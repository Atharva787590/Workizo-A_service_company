from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserManager(BaseUserManager):
    def create_user(self, email, full_name, phone=None, password=None, role='customer', **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        
        auth_provider = extra_fields.get('auth_provider', 'EMAIL')
        if auth_provider == 'EMAIL' and not phone:
            raise ValueError('Users must have a phone number')
        
        email = self.normalize_email(email)
        user = self.model(
            email=email,
            full_name=full_name,
            phone=phone,
            role=role,
            **extra_fields
        )
        
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
            
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, phone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(
            email=email,
            full_name=full_name,
            phone=phone,
            password=password,
            role='admin',
            **extra_fields
        )

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('worker', 'Worker (Captain)'),
        ('admin', 'Admin'),
    )
    
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, max_length=255)
    phone = models.CharField(unique=True, max_length=20, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    profile_photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)
    
    # Google Authentication fields
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    profile_picture = models.URLField(max_length=500, null=True, blank=True)
    auth_provider = models.CharField(max_length=50, default='EMAIL')
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False) # for Django admin panel integration
    is_email_verified = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name', 'phone']
    
    def __str__(self):
        return f"{self.email} ({self.role})"


class CooperativeAuditLog(models.Model):
    """
    Operations Center Immutable Audit Trail
    Records admin actions, worker credential changes, booking triages, and governance overrides.
    """
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='operational_audit_actions')
    actor_name = models.CharField(max_length=150)
    action = models.CharField(max_length=100)
    target_type = models.CharField(max_length=50) # 'WORKER', 'BOOKING', 'PAYMENT', 'GOVERNANCE', 'SYSTEM'
    target_id = models.CharField(max_length=100)
    result = models.CharField(max_length=50, default='SUCCESS')
    notes = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Audit #{self.id}: {self.actor_name} -> {self.action} on {self.target_type}#{self.target_id}"

