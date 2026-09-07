"""
UNNATI demo seed: categories, system settings, admin + demo accounts.

Usage:
    python manage.py seed_demo

Creates (idempotent):
  * Service categories (Electrician, Plumber, Carpenter, AC Technician, Mechanic, Home Cleaning)
  * SystemSetting row for the UNNATI brand
  * Admin account        -> admin@unnati.in    / Unnati@2026
  * Customer demo account-> customer@unnati.in / Unnati@2026
  * Captain demo account -> captain@unnati.in  / Unnati@2026 (KYC approved)

Change the passwords below (or create your own users via the UI).
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

CATEGORIES = [
    ('Electrician', '⚡', 299.00),
    ('Plumber', '🔧', 249.00),
    ('Carpenter', '🛠️', 279.00),
    ('AC Technician', '❄️', 349.00),
    ('Mechanic', '🚗', 299.00),
    ('Home Cleaning', '🧹', 199.00),
]


class Command(BaseCommand):
    help = 'Seeds the Unnati database with categories, settings and demo accounts'

    def handle(self, *args, **kwargs):
        from services.models import ServiceCategory, SystemSetting
        from customers.models import CustomerProfile
        from workers.models import WorkerProfile, Wallet

        # 1) Categories
        for name, icon, charge in CATEGORIES:
            obj, created = ServiceCategory.objects.get_or_create(
                name=name,
                defaults={'icon': icon, 'base_labour_charge': charge, 'is_active': True},
            )
            self.stdout.write(self.style.SUCCESS(f"Category '{name}' {'created' if created else 'exists'}."))

        electrician = ServiceCategory.objects.get(name='Electrician')

        # 2) Brand settings
        setting, created = SystemSetting.objects.get_or_create(
            id=1,
            defaults=dict(
                company_name='Unnati',
                support_email='support@unnati.in',
                support_phone='+91 98765 43210',
                gst_percentage=18.00,
            ),
        )
        if created:
            self.stdout.write(self.style.SUCCESS("System settings seeded for 'Unnati'."))
        elif setting.company_name != 'Unnati':
            setting.company_name = 'Unnati'
            setting.support_email = setting.support_email or 'support@unnati.in'
            setting.save()
            self.stdout.write(self.style.SUCCESS("System settings updated to 'Unnati'."))

        # 3) Accounts
        accounts = [
            dict(email='admin@unnati.in', full_name='Unnati Admin', phone='+919000000001', role='admin', superuser=True),
            dict(email='customer@unnati.in', full_name='Demo Customer', phone='+919000000002', role='customer'),
            dict(email='captain@unnati.in', full_name='Demo Captain', phone='+919000000003', role='worker'),
        ]

        for acc in accounts:
            user = User.objects.filter(email=acc['email']).first()
            if not user:
                if acc.get('superuser'):
                    user = User.objects.create_superuser(
                        email=acc['email'], full_name=acc['full_name'],
                        phone=acc['phone'], password='Unnati@2026',
                    )
                else:
                    user = User.objects.create_user(
                        email=acc['email'], full_name=acc['full_name'],
                        phone=acc['phone'], password='Unnati@2026', role=acc['role'],
                    )
                self.stdout.write(self.style.SUCCESS(f"Created {acc['role']}: {acc['email']} / Unnati@2026"))
            user.is_email_verified = True
            user.is_active = True
            user.save()

            if acc['role'] == 'customer':
                CustomerProfile.objects.get_or_create(user=user, defaults=dict(city='Ahmedabad', state='Gujarat'))
            if acc['role'] == 'worker':
                profile, _ = WorkerProfile.objects.get_or_create(user=user)
                profile.service_category = profile.service_category or electrician
                profile.experience = profile.experience or 5
                profile.city = profile.city or 'Ahmedabad'
                profile.state = profile.state or 'Gujarat'
                profile.is_verified = True
                profile.approval_status = 'approved'
                profile.save()
                Wallet.objects.get_or_create(worker=user)

        self.stdout.write(self.style.SUCCESS("\n✅ Unnati seed complete."))
        self.stdout.write("   Admin   : admin@unnati.in    / Unnati@2026")
        self.stdout.write("   Customer: customer@unnati.in / Unnati@2026")
        self.stdout.write("   Captain : captain@unnati.in  / Unnati@2026")
