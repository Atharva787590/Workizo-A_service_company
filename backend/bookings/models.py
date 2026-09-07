import uuid
import secrets
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Booking(models.Model):
    BOOKING_TYPE_CHOICES = (
        ('instant', 'Instant Booking'),
        ('scheduled', 'Scheduled Booking'),
        ('collective', 'Collective Multi-Worker Booking'),
    )

    STATUS_CHOICES = (
        ('searching', 'Searching For Worker (REQUESTED)'),
        ('requested', 'Requested'),
        ('MATCHING', 'Matching Workers'),
        ('accepted', 'Worker Accepted'),
        ('SCHEDULED', 'Scheduled in Advance'),
        ('scheduled', 'Scheduled'),
        ('on_the_way', 'Worker On The Way (WORKER_ARRIVING)'),
        ('arrived', 'Worker Arrived'),
        ('verified', 'QR / Arrival PIN / Geofence Verified'),
        ('inspection', 'Inspection'),
        ('repair_started', 'Repair Started (IN_PROGRESS)'),
        ('in_progress', 'In Progress'),
        ('repair_completed', 'Repair Completed'),
        ('waiting_approval', 'Waiting For Customer Approval'),
        ('WAITING_FOR_CASH_CONFIRMATION', 'Waiting For Cash Confirmation'),
        ('ready_to_complete', 'Ready To Complete (PAYMENT_RELEASED)'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('disputed', 'Disputed'),
    )

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    worker = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='jobs')
    service_category = models.ForeignKey('services.ServiceCategory', on_delete=models.PROTECT)
    problem_type = models.CharField(max_length=100)
    problem_description = models.TextField()
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='searching')
    
    # UNNATI Extensions
    booking_type = models.CharField(max_length=20, choices=BOOKING_TYPE_CHOICES, default='instant')
    scheduled_time = models.DateTimeField(null=True, blank=True)
    required_worker_count = models.PositiveIntegerField(default=1)
    assigned_workers = models.ManyToManyField(User, related_name='collective_jobs', blank=True)
    
    # Geo-fencing & Start-of-Service Verification
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    arrival_radius_meters = models.PositiveIntegerField(default=300)
    geofence_verified = models.BooleanField(default=False)
    geofence_verified_at = models.DateTimeField(null=True, blank=True)
    arrival_pin = models.CharField(max_length=6, blank=True, null=True)
    arrival_pin_verified = models.BooleanField(default=False)
    arrival_pin_verified_at = models.DateTimeField(null=True, blank=True)
    
    # Cancellation & Disputes
    cancellation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    cancellation_reason = models.TextField(blank=True, null=True)
    dispute_reason = models.TextField(blank=True, null=True)
    
    # Cooperative Economics
    total_contract_value = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    cooperative_allocation = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    idempotency_key = models.CharField(max_length=100, null=True, blank=True, db_index=True)

    qr_code_value = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    tracking_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    before_photo = models.ImageField(upload_to='bookings/before/', null=True, blank=True)
    after_photo = models.ImageField(upload_to='bookings/after/', null=True, blank=True)
    spare_part_photo = models.ImageField(upload_to='bookings/parts/', null=True, blank=True)
    invoice_photo = models.ImageField(upload_to='bookings/invoices/', null=True, blank=True)
    optional_video = models.FileField(upload_to='bookings/videos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if not self.arrival_pin:
            self.arrival_pin = f"{secrets.randbelow(9000) + 1000}"
        super().save(*args, **kwargs)
        if is_new and not self.tracking_id:
            self.tracking_id = f"WRK-{self.id + 10000}"
            super().save(update_fields=['tracking_id'])

    def __str__(self):
        return f"Booking #{self.id} - {self.service_category.name} ({self.status})"

class RepairToken(models.Model):
    STATUS_CHOICES = (
        ('item_received', 'Item Received'),
        ('reached_workshop', 'Reached Workshop'),
        ('inspection', 'Inspection'),
        ('repair_started', 'Repair Started'),
        ('waiting_parts', 'Waiting For Parts'),
        ('repair_completed', 'Repair Completed'),
        ('returning', 'Returning'),
        ('delivered', 'Delivered'),
    )

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='repair_token')
    token_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='item_received')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Token {self.token_number} ({self.status})"

class MajorRepairApproval(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='major_repairs')
    reason = models.TextField()
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Repair Approval #{self.id} for Booking #{self.booking.id} ({self.status})"

class BookingRejection(models.Model):
    worker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='booking_rejections')
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='booking_rejections')
    reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('worker', 'booking')

    def __str__(self):
        return f"Rejection by {self.worker.email} for Booking #{self.booking.id}"

class ChatMessage(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='chat_messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    message_type = models.CharField(max_length=20, default='text')

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Msg {self.id} from {self.sender.email} to {self.receiver.email} for Booking {self.booking.id}"


class BookingAuditLog(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='audit_logs')
    from_status = models.CharField(max_length=50)
    to_status = models.CharField(max_length=50)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    reason = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Audit #{self.id} on Booking #{self.booking.id}: {self.from_status} -> {self.to_status}"


class BookingWorkerAllocation(models.Model):
    STATUS_CHOICES = (
        ('assigned', 'Assigned'),
        ('arrived', 'Arrived'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('disputed', 'Disputed'),
    )

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='worker_allocations')
    worker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cooperative_allocations')
    allocated_payout = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    cooperative_dividend_share = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('booking', 'worker')

    def __str__(self):
        return f"Allocation for {self.worker.email} on Booking #{self.booking.id} (₹{self.allocated_payout})"


class BookingDispute(models.Model):
    """
    UNNATI Dispute & Rework Resolution Record
    Tracks customer disputes, worker responses, factual evidence records,
    and deterministic rule-based assessments without automated verdicts.
    """
    STATUS_CHOICES = (
        ('OPEN', 'Open'),
        ('UNDER_REVIEW', 'Under Review'),
        ('RESOLVED', 'Resolved'),
        ('REJECTED', 'Rejected'),
    )

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='disputes')
    dispute_id = models.CharField(max_length=50, unique=True)
    raised_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='raised_booking_disputes')
    reason = models.TextField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='OPEN')
    worker_response = models.TextField(blank=True, null=True)
    worker_responded_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True, null=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_booking_disputes')
    resolved_at = models.DateTimeField(null=True, blank=True)
    evidence_record = models.JSONField(default=dict, blank=True)
    assessment_report = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Dispute {self.dispute_id} on Booking #{self.booking_id} ({self.status})"
