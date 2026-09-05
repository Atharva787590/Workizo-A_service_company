from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ServiceCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=100, blank=True, null=True)
    base_labour_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Rating(models.Model):
    booking = models.OneToOneField('bookings.Booking', on_delete=models.CASCADE, related_name='rating')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submitted_ratings')
    worker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_ratings')
    rating = models.IntegerField()
    review = models.TextField(blank=True, null=True)
    is_hidden = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rating: {self.rating} stars for Worker {self.worker.email} by {self.customer.email}"

class SystemSetting(models.Model):
    company_name = models.CharField(max_length=100, default='UNNATI')
    company_logo = models.ImageField(upload_to='settings/', blank=True, null=True)
    contact_details = models.TextField(blank=True, null=True)
    gst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    support_email = models.EmailField(default='support@unnati.coop')
    support_phone = models.CharField(max_length=15, default='+919876543210')
    terms_conditions = models.TextField(blank=True, null=True)
    privacy_policy = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.company_name


class ServiceCatalogItem(models.Model):
    """
    UNNATI Structured Service Catalog Item
    Defines individual trade services under a category with pricing guidance, typical duration,
    and required trade skills/qualifications.
    """
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name='catalog_items')
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=160, blank=True)
    description = models.TextField()
    typical_duration_minutes = models.PositiveIntegerField(default=60)
    estimated_base_price = models.DecimalField(max_digits=10, decimal_places=2, default=299.00)
    estimated_max_price = models.DecimalField(max_digits=10, decimal_places=2, default=599.00)
    pricing_guidance = models.TextField(
        default="Covers standard inspection + labor up to duration. Parts and complex diagnostics billed transparently on-site with zero platform commission."
    )
    required_skills = models.JSONField(default=list, blank=True)
    required_certification_level = models.CharField(
        max_length=30,
        choices=(
            ('BEGINNER', 'Beginner'),
            ('SKILLED', 'Skilled'),
            ('CERTIFIED', 'Certified'),
            ('EXPERT', 'Expert')
        ),
        default='SKILLED'
    )
    is_restricted = models.BooleanField(default=False)
    icon = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} ({self.category.name})"
