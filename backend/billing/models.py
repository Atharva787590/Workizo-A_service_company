from django.db import models
from bookings.models import Booking

class Bill(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='bill')
    labour_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    parts_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    gst = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_approved = models.BooleanField(default=False)
    invoice_pdf = models.FileField(upload_to='invoices/', null=True, blank=True)
    supplier_invoice = models.FileField(upload_to='supplier_invoices/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"Bill for Booking #{self.booking.id} - Total: ₹{self.grand_total}"

class BillItem(models.Model):
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='items')
    part_name = models.CharField(max_length=200)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.part_name} (x{self.quantity}) - ₹{self.price * self.quantity}"

from django.contrib.auth import get_user_model
User = get_user_model()

class Payment(models.Model):
    METHOD_CHOICES = (
        ('ONLINE', 'Online Payment'),
        ('CASH', 'Cash Payment'),
        ('cash', 'Cash'), # Keep for compatibility
        ('upi', 'UPI'),
        ('card', 'Card'),
    )
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('FAILED', 'Failed'),
        ('WAITING_FOR_CASH_CONFIRMATION', 'Waiting For Cash Confirmation'),
        ('PAID', 'Paid'),
        ('COMPLETED', 'Completed'),
        ('success', 'Success'), # Keep for compatibility
        ('failed', 'Failed_compat'),
        ('pending', 'Pending_compat'),
    )

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='payment')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments_as_customer', null=True, blank=True)
    captain = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='payments_as_captain', null=True, blank=True)
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    receipt_number = models.CharField(max_length=100, unique=True, null=True, blank=True)
    
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='PENDING')
    
    razorpay_order_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True)
    razorpay_signature = models.CharField(max_length=200, blank=True, null=True)
    
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    cash_confirmation_timestamp = models.DateTimeField(null=True, blank=True)
    payment_time = models.DateTimeField(null=True, blank=True)
    receipt_pdf = models.FileField(upload_to='receipts/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # UNNATI Direct Payment Extension Fields
    LIFECYCLE_CHOICES = (
        ('PAYMENT_PENDING', 'Payment Pending'),
        ('PAYMENT_INITIATED', 'Payment Initiated'),
        ('PAYMENT_CONFIRMED', 'Payment Confirmed'),
        ('PAYMENT_COMPLETED', 'Payment Completed'),
        ('PAYMENT_FAILED', 'Payment Failed'),
        ('PAYMENT_CANCELLED', 'Payment Cancelled'),
        ('REFUND_PENDING', 'Refund Pending'),
        ('REFUNDED', 'Refunded'),
    )

    lifecycle_status = models.CharField(max_length=50, choices=LIFECYCLE_CHOICES, default='PAYMENT_PENDING')
    direct_recipient = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='direct_received_payments')
    worker_direct_payout = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    cooperative_allocation = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00) # Always 0.00 in UNNATI direct model
    platform_escrow_held = models.BooleanField(default=False) # Explicit platform escrow avoidance guarantee
    is_mock_provider = models.BooleanField(default=False)
    adapter_type = models.CharField(max_length=50, default='DIRECT_UPI')
    worker_upi_id = models.CharField(max_length=100, blank=True, null=True)
    idempotency_key = models.CharField(max_length=100, blank=True, null=True, unique=True)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    refund_reason = models.TextField(blank=True, null=True)
    cancellation_compensation = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def save(self, *args, **kwargs):
        if self.method:
            self.method = self.method.upper()
        if self.status:
            val_map = {
                'success': 'PAID',
                'failed': 'FAILED',
                'pending': 'PENDING'
            }
            self.status = val_map.get(self.status.lower(), self.status.upper())
        # Sync lifecycle_status with legacy status if unset
        if not self.lifecycle_status or self.lifecycle_status == 'PAYMENT_PENDING':
            if self.status in ['PAID', 'COMPLETED']:
                self.lifecycle_status = 'PAYMENT_COMPLETED'
            elif self.status == 'FAILED':
                self.lifecycle_status = 'PAYMENT_FAILED'
        super().save(*args, **kwargs)

    @property
    def payment_method(self):
        return self.method

    @property
    def payment_status(self):
        return self.status

    def __str__(self):
        return f"Payment of {self.currency} {self.amount} for Booking #{self.booking.id} via {self.method} ({self.status} / {self.lifecycle_status})"


class DirectPaymentTransaction(models.Model):
    TRANSACTION_TYPE_CHOICES = (
        ('CUSTOMER_DIRECT_PAYMENT', 'Customer Direct Payment'),
        ('WORKER_PAYOUT_SHARE', 'Worker Payout Share'),
        ('COOPERATIVE_ALLOCATION', 'Cooperative Allocation'),
        ('CANCELLATION_COMPENSATION', 'Cancellation Compensation'),
        ('REFUND', 'Direct Refund'),
        ('ADJUSTMENT', 'Direct Adjustment'),
    )
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('INITIATED', 'Initiated'),
        ('CONFIRMED', 'Confirmed'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
        ('REFUNDED', 'Refunded'),
    )

    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='transactions')
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payment_transactions')
    transaction_type = models.CharField(max_length=50, choices=TRANSACTION_TYPE_CHOICES)
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_transactions')
    recipient = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='INITIATED')
    payment_method = models.CharField(max_length=50, default='DIRECT_UPI')
    adapter_name = models.CharField(max_length=50, default='DIRECT_UPI_MOCK')
    is_mock = models.BooleanField(default=False)
    idempotency_key = models.CharField(max_length=100, blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction_type} of ₹{self.amount} ({self.status}) for Booking #{self.booking.id}"

