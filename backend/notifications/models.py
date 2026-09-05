from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, default='general')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # UNNATI Extensions
    category = models.CharField(max_length=50, default='general', blank=True) # booking, opportunity, governance, payment
    channel_delivery_history = models.JSONField(default=list, blank=True)
    delivered_channel = models.CharField(max_length=20, default='IN_APP', blank=True)
    idempotency_key = models.CharField(max_length=120, null=True, blank=True, unique=True)
    is_urgent = models.BooleanField(default=False)
    language = models.CharField(max_length=10, default='hi', blank=True)

    def __str__(self):
        return f"Notification for {self.user.email} - {self.title} (Read: {self.is_read})"


class NotificationPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preference')
    enabled_channels = models.JSONField(default=list, blank=True)  # ['PUSH', 'IN_APP', 'SMS', 'IVR']
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.CharField(max_length=10, default="22:00")
    quiet_hours_end = models.CharField(max_length=10, default="07:00")
    preferred_language = models.CharField(max_length=10, default="hi")
    opportunity_radius_km = models.FloatField(default=10.0)
    urgent_bypasses_quiet_hours = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferences for {self.user.email} ({self.preferred_language})"


class OpportunityAlert(models.Model):
    STATUS_CHOICES = (
        ('AVAILABLE', 'Available'),
        ('ACCEPTED', 'Accepted'),
        ('DISMISSED', 'Dismissed'),
        ('EXPIRED', 'Expired'),
    )
    worker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='opportunity_alerts')
    booking_id = models.IntegerField(null=True, blank=True)
    service_title = models.CharField(max_length=150)
    coarse_locality = models.CharField(max_length=150)
    coarse_distance_km = models.FloatField(default=0.0)
    estimated_payout = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Opportunity #{self.id} for {self.worker.email} ({self.service_title} - {self.status})"


class Announcement(models.Model):
    RECIPIENT_CHOICES = (
        ('all_customers', 'All Customers'),
        ('all_captains', 'All Captains'),
        ('individual_customer', 'Individual Customer'),
        ('individual_captain', 'Individual Captain'),
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    recipient_type = models.CharField(max_length=50, choices=RECIPIENT_CHOICES)
    recipient_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_announcements')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} to {self.recipient_type}"
