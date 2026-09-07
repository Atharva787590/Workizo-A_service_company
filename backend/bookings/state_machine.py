import math
from decimal import Decimal
from django.utils import timezone
from .models import Booking, BookingAuditLog

def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two points on the Earth (in meters).
    """
    if None in (lat1, lon1, lat2, lon2):
        return None
        
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(float(lat1))
    phi2 = math.radians(float(lat2))
    delta_phi = math.radians(float(lat2) - float(lat1))
    delta_lambda = math.radians(float(lon2) - float(lon1))

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

# UNNATI Canonical Lifecycle Transition Graph
UNNATI_ALLOWED_TRANSITIONS = {
    'searching': ['MATCHING', 'accepted', 'SCHEDULED', 'scheduled', 'cancelled', 'disputed'],
    'requested': ['MATCHING', 'accepted', 'SCHEDULED', 'scheduled', 'cancelled', 'disputed'],
    'REQUESTED': ['MATCHING', 'accepted', 'SCHEDULED', 'scheduled', 'cancelled', 'disputed'],
    'MATCHING': ['accepted', 'SCHEDULED', 'scheduled', 'cancelled', 'disputed'],
    'SCHEDULED': ['on_the_way', 'WORKER_ARRIVING', 'cancelled', 'disputed'],
    'scheduled': ['on_the_way', 'WORKER_ARRIVING', 'cancelled', 'disputed'],
    'accepted': ['SCHEDULED', 'scheduled', 'on_the_way', 'WORKER_ARRIVING', 'cancelled', 'disputed'],
    'on_the_way': ['arrived', 'cancelled', 'disputed'],
    'WORKER_ARRIVING': ['arrived', 'cancelled', 'disputed'],
    'arrived': ['verified', 'inspection', 'repair_started', 'IN_PROGRESS', 'in_progress', 'cancelled', 'disputed'],
    'verified': ['inspection', 'repair_started', 'IN_PROGRESS', 'in_progress', 'disputed'],
    'inspection': ['repair_started', 'IN_PROGRESS', 'in_progress', 'disputed'],
    'repair_started': ['repair_completed', 'waiting_approval', 'COMPLETED', 'completed', 'disputed'],
    'IN_PROGRESS': ['repair_completed', 'waiting_approval', 'COMPLETED', 'completed', 'disputed'],
    'in_progress': ['repair_completed', 'waiting_approval', 'COMPLETED', 'completed', 'disputed'],
    'repair_completed': ['waiting_approval', 'ready_to_complete', 'COMPLETED', 'completed', 'disputed'],
    'waiting_approval': ['WAITING_FOR_CASH_CONFIRMATION', 'ready_to_complete', 'COMPLETED', 'completed', 'disputed'],
    'WAITING_FOR_CASH_CONFIRMATION': ['ready_to_complete', 'COMPLETED', 'completed', 'disputed'],
    'ready_to_complete': ['completed', 'PAYMENT_RELEASED', 'disputed'],
    'COMPLETED': ['PAYMENT_RELEASED', 'completed'],
    'completed': ['PAYMENT_RELEASED'],
    'PAYMENT_RELEASED': [],
    'cancelled': [],
    'disputed': ['searching', 'requested', 'accepted', 'cancelled', 'completed', 'PAYMENT_RELEASED'],
}

def validate_state_transition(booking, new_status, user):
    """
    Validate that transition from booking.status to new_status is allowed and authorized.
    Returns (is_valid: bool, error_message: str)
    """
    current_status = booking.status
    if current_status == new_status:
        return True, "Status unchanged (idempotent)"

    # Admin bypass
    if user.is_staff or getattr(user, 'role', '') == 'admin':
        return True, ""

    # Check state graph
    allowed = UNNATI_ALLOWED_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        return False, f"Illegal state transition from '{current_status}' to '{new_status}'."

    # Customer permissions
    if user.role == 'customer':
        if booking.customer != user:
            return False, "You do not have permission to manage this booking."
        if new_status == 'cancelled':
            # Customers cannot cancel once repair has started
            if current_status in ['repair_started', 'IN_PROGRESS', 'in_progress', 'repair_completed', 'completed', 'PAYMENT_RELEASED']:
                return False, "Cannot cancel job once work is in progress. Please raise a dispute."
            return True, ""
        elif new_status == 'disputed':
            return True, ""
        else:
            return False, "Customers can only cancel or dispute bookings."

    # Worker permissions
    if user.role == 'worker':
        if booking.worker != user and not booking.assigned_workers.filter(id=user.id).exists():
            return False, "You are not assigned to this service contract."

        # Geo-fence guard for starting repair
        if new_status in ['repair_started', 'IN_PROGRESS', 'in_progress'] and not booking.geofence_verified:
            # Allow fallback if no coordinates set on booking
            if booking.latitude is not None and booking.longitude is not None:
                return False, "Worker arrival must be geo-fence verified before starting work."

        # Start-of-service verification guard (Arrival PIN)
        if new_status in ['repair_started', 'IN_PROGRESS', 'in_progress']:
            if not booking.arrival_pin_verified and booking.status != 'verified':
                return False, "Start-of-service verification (Arrival PIN) is required before entering in_progress."

        if new_status == 'cancelled':
            return True, ""
        elif new_status == 'disputed':
            return True, ""
        return True, ""

    return False, "Unauthorized role for booking operations."

def calculate_cancellation_compensation(booking, user):
    """
    Progressive cancellation calculation:
    - Free if cancelled within 5 mins of creation OR > 2 hours before scheduled slot.
    - ₹100 or 20% of base labor charge if worker is on the way (travel compensation).
    - ₹200 or 50% of base labor charge if worker already arrived (arrival compensation).
    """
    now = timezone.now()
    base_charge = Decimal(str(getattr(booking.service_category, 'base_labour_charge', 250.00)))
    
    # 1. Free Grace Period Check (5 minutes from creation)
    if (now - booking.created_at).total_seconds() <= 300:
        return Decimal('0.00'), "Cancelled within 5-minute free grace period."

    # 2. Advance Scheduled Check (> 2 hours before scheduled time)
    if booking.scheduled_time and (booking.scheduled_time - now).total_seconds() > 7200:
        return Decimal('0.00'), "Cancelled more than 2 hours before scheduled appointment."

    # 3. Progressive fee based on current status
    if booking.status in ['on_the_way', 'WORKER_ARRIVING']:
        fee = max(Decimal('100.00'), (base_charge * Decimal('0.20')).quantize(Decimal('0.01')))
        return fee, f"Worker is en route. ₹{fee} travel compensation applied for worker."

    if booking.status in ['arrived', 'verified', 'inspection']:
        fee = max(Decimal('200.00'), (base_charge * Decimal('0.50')).quantize(Decimal('0.01')))
        return fee, f"Worker already arrived on site. ₹{fee} site visit compensation applied."

    return Decimal('0.00'), "No cancellation fee applied."

def record_booking_audit(booking, from_status, to_status, user, reason="", metadata=None):
    """
    Audit log creation helper for booking state modifications.
    """
    return BookingAuditLog.objects.create(
        booking=booking,
        from_status=from_status,
        to_status=to_status,
        changed_by=user if getattr(user, 'is_authenticated', False) else None,
        reason=reason,
        metadata=metadata or {}
    )
