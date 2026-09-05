"""
UNNATI Payment Engine: Direct Service-Provider Payment & Cooperative Economics
-------------------------------------------------------------------------------
Core principle: UNNATI is NOT a financial intermediary or escrow holder.
The payment relationship is directly between customer and worker/collective.
"""

from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timezone as dt_timezone
from typing import Dict, Any, Optional, Tuple

COOPERATIVE_RATE_DEFAULT = Decimal('0.065') # 6.5% transparent cooperative reserve
PLATFORM_FEE_DIRECT = Decimal('0.00')       # Exactly 0.00 - zero escrow, zero middleman rake

# Canonical Lifecycle States
VALID_PAYMENT_STATES = {
    'PAYMENT_PENDING',
    'PAYMENT_INITIATED',
    'PAYMENT_CONFIRMED',
    'PAYMENT_COMPLETED',
    'PAYMENT_FAILED',
    'PAYMENT_CANCELLED',
    'REFUND_PENDING',
    'REFUNDED',
}

# Permitted state transitions
ALLOWED_PAYMENT_TRANSITIONS = {
    'PAYMENT_PENDING': {'PAYMENT_INITIATED', 'PAYMENT_CANCELLED', 'PAYMENT_FAILED'},
    'PAYMENT_INITIATED': {'PAYMENT_CONFIRMED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'PAYMENT_CANCELLED'},
    'PAYMENT_CONFIRMED': {'PAYMENT_COMPLETED', 'REFUND_PENDING'},
    'PAYMENT_COMPLETED': {'REFUND_PENDING'},
    'PAYMENT_FAILED': {'PAYMENT_INITIATED', 'PAYMENT_CANCELLED'},
    'REFUND_PENDING': {'REFUNDED', 'PAYMENT_COMPLETED'},
    'PAYMENT_CANCELLED': set(),
    'REFUNDED': set(),
}


def calculate_direct_payment_breakdown(
    amount: Decimal,
    worker_count: int = 1,
    cooperative_rate: Decimal = COOPERATIVE_RATE_DEFAULT
) -> Dict[str, Any]:
    """
    Computes transparent server-side breakdown for direct worker payment.
    Ensures 0 platform middleman fee and verifies no platform escrow.
    """
    amount = Decimal(str(amount)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    worker_count = max(1, int(worker_count))

    # Cooperative contribution (retained by cooperative entity for member patronage dividend)
    coop_allocation = (amount * cooperative_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    # Direct Worker Payout is the total payable less the cooperative dividend reserve
    worker_direct_payout = (amount - coop_allocation).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    # Equal split per worker for collective crew bookings
    per_worker_share = (worker_direct_payout / Decimal(worker_count)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    # Total payout reconciled with rounding adjustment on first worker
    rounding_diff = worker_direct_payout - (per_worker_share * Decimal(worker_count))
    first_worker_share = per_worker_share + rounding_diff

    breakdown = {
        'total_customer_paid': amount,
        'worker_direct_payout': worker_direct_payout,
        'cooperative_allocation': coop_allocation,
        'cooperative_rate_percentage': float(cooperative_rate * 100),
        'platform_fee': PLATFORM_FEE_DIRECT,
        'platform_escrow_balance': Decimal('0.00'),
        'platform_holds_escrow': False,
        'worker_count': worker_count,
        'per_worker_share': per_worker_share,
        'first_worker_share': first_worker_share,
        'is_collective': worker_count > 1,
    }
    
    ensure_no_platform_escrow(breakdown)
    return breakdown


def ensure_no_platform_escrow(breakdown: Dict[str, Any]) -> None:
    """
    Security check: raises ValueError if platform fee is non-zero or platform holds funds.
    """
    if breakdown.get('platform_fee') != Decimal('0.00'):
        raise ValueError("UNNATI policy violation: Platform fee must be 0.00 in direct model.")
    if breakdown.get('platform_escrow_balance') != Decimal('0.00'):
        raise ValueError("UNNATI policy violation: Platform escrow balance must be 0.00.")
    if breakdown.get('platform_holds_escrow') is not False:
        raise ValueError("UNNATI policy violation: Platform must never hold customer escrow.")


def validate_payment_state_transition(
    current_state: str,
    next_state: str,
    user_role: str,
    is_worker_confirmed: bool = False
) -> Tuple[bool, Optional[str]]:
    """
    Enforces server-side authorization and transition rules for payment lifecycle.
    """
    if current_state not in VALID_PAYMENT_STATES:
        return False, f"Invalid current payment state: {current_state}"
    if next_state not in VALID_PAYMENT_STATES:
        return False, f"Invalid target payment state: {next_state}"
        
    allowed_targets = ALLOWED_PAYMENT_TRANSITIONS.get(current_state, set())
    if next_state not in allowed_targets:
        return False, f"Transition from '{current_state}' to '{next_state}' is not permitted."

    # Role-based authorization rules
    if next_state in {'PAYMENT_INITIATED', 'PAYMENT_CANCELLED'} and current_state == 'PAYMENT_PENDING':
        if user_role not in {'customer', 'admin'}:
            return False, "Only customer or admin can initiate or cancel pending payment."

    if next_state in {'PAYMENT_CONFIRMED', 'PAYMENT_COMPLETED'}:
        # Must be confirmed by worker or provider adapter / admin
        if user_role not in {'worker', 'admin'} and not is_worker_confirmed:
            return False, "Only service provider (worker), provider adapter, or admin can confirm direct payment receipt."

    if next_state == 'REFUND_PENDING':
        if user_role not in {'customer', 'worker', 'admin'}:
            return False, "Unauthorized refund request."

    if next_state == 'REFUNDED':
        if user_role not in {'worker', 'admin'}:
            return False, "Refund execution must be verified by the direct recipient worker or admin."

    return True, None


def calculate_cancellation_refund(
    total_amount: Decimal,
    booking_status: str,
    created_at: datetime,
    scheduled_time: Optional[datetime] = None,
    now: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Integrates existing booking cancellation safeguards into direct payment records.
    - Free cancellation in 5 min grace period or >2 hours ahead for scheduled.
    - ₹100 compensation if worker on the way.
    - ₹200 compensation if worker arrived at job site.
    - Remainder is refunded directly to customer.
    """
    now = now or datetime.now(dt_timezone.utc)
    total_amount = Decimal(str(total_amount))
    
    # 5-minute grace period
    grace_period_seconds = 300
    seconds_since_creation = (now - created_at).total_seconds()
    is_within_grace = seconds_since_creation <= grace_period_seconds

    # Scheduled booking >2h buffer
    is_advance_scheduled_free = False
    if scheduled_time:
        seconds_until_scheduled = (scheduled_time - now).total_seconds()
        if seconds_until_scheduled >= 7200:
            is_advance_scheduled_free = True

    status_normalized = (booking_status or '').lower()
    
    if is_within_grace or is_advance_scheduled_free or status_normalized in ['requested', 'matching', 'searching', 'accepted', 'scheduled']:
        compensation = Decimal('0.00')
        reason = "Free cancellation within grace window"
    elif status_normalized in ['worker_arriving', 'on_the_way']:
        compensation = min(Decimal('100.00'), total_amount)
        reason = "Progressive compensation: worker dispatched / on the way"
    elif status_normalized in ['arrived', 'in_progress', 'repair_started']:
        compensation = min(Decimal('200.00'), total_amount)
        reason = "Progressive compensation: worker arrived on site"
    else:
        compensation = Decimal('0.00')
        reason = "Standard refund"

    refund_amount = max(Decimal('0.00'), total_amount - compensation)
    
    return {
        'total_amount': total_amount,
        'cancellation_compensation': compensation,
        'refund_amount': refund_amount,
        'reason': reason,
        'platform_retained': Decimal('0.00'),
    }


def generate_upi_intent_uri(
    vpa: str,
    payee_name: str,
    amount: Decimal,
    booking_id: int,
    transaction_ref: Optional[str] = None
) -> str:
    """
    Generates standard Indian NPCI UPI intent URI for direct customer-to-worker payment.
    Enables instant checkout via Google Pay, PhonePe, Paytm, BHIM, etc.
    """
    clean_name = payee_name.replace(' ', '%20')
    ref = transaction_ref or f"UNN-{booking_id}"
    amt_str = f"{amount:.2f}"
    return f"upi://pay?pa={vpa}&pn={clean_name}&am={amt_str}&cu=INR&tn=UNNATI-Booking-{booking_id}&tr={ref}"
