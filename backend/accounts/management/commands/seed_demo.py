from django.core.management.base import BaseCommand
from accounts.models import User
from workers.models import WorkerProfile
from services.models import ServiceCategory

class Command(BaseCommand):
    help = 'Seeds verified demo accounts and categories for SIH jury demonstration'

    def handle(self, *args, **options):
        # 1. Ensure Categories exist
        cats = [
            ("Electrician", 250),
            ("Plumber", 200),
            ("Carpenter", 220),
            ("AC Technician", 300),
            ("Mechanic", 200),
            ("Home Cleaning", 180),
        ]
        created_cats = {}
        for name, base_charge in cats:
            cat, created = ServiceCategory.objects.get_or_create(
                name=name,
                defaults={'base_labour_charge': base_charge, 'is_active': True}
            )
            created_cats[name] = cat
        self.stdout.write(self.style.SUCCESS("✓ Service categories verified."))

        # 2. Administrator Persona
        admin_user, _ = User.objects.get_or_create(
            email='admin@unnati.org',
            defaults={
                'role': 'admin',
                'full_name': 'UNNATI Administrator',
                'is_staff': True,
                'is_superuser': True
            }
        )
        admin_user.set_password('Admin@1234')
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()

        # 3. Customer Persona
        customer_user, _ = User.objects.get_or_create(
            email='customer@unnati.org',
            defaults={
                'role': 'customer',
                'full_name': 'Anita Sharma (Customer)',
                'phone': '9876543210'
            }
        )
        customer_user.set_password('Customer@1234')
        customer_user.save()

        # 4. Worker Persona (Electrician)
        worker_user, _ = User.objects.get_or_create(
            email='worker@unnati.org',
            defaults={
                'role': 'worker',
                'full_name': 'Ramesh Kumar (Worker)',
                'phone': '9876543211'
            }
        )
        worker_user.set_password('Worker@1234')
        worker_user.save()

        elec = created_cats.get("Electrician")
        wp, _ = WorkerProfile.objects.get_or_create(
            user=worker_user,
            defaults={
                'service_category': elec,
                'experience': 6,
                'city': 'Bhopal',
                'state': 'Madhya Pradesh',
                'pincode': '462001',
                'is_verified': True,
                'approval_status': 'approved',
                'online_status': True,
                'payout_readiness': 'VERIFIED'
            }
        )
        wp.service_category = elec
        wp.is_verified = True
        wp.approval_status = 'approved'
        wp.online_status = True
        wp.payout_readiness = 'VERIFIED'
        wp.save()

        self.stdout.write(self.style.SUCCESS("✓ SIH Demo personas (Admin, Customer, Worker) seeded and verified."))
