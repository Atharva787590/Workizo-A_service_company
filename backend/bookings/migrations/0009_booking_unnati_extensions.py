# Generated for UNNATI Cooperative Platform (SIH 2026)

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0008_chatmessage'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='booking_type',
            field=models.CharField(choices=[('instant', 'Instant'), ('scheduled', 'Scheduled'), ('collective', 'Collective / Group Task')], default='instant', max_length=20),
        ),
        migrations.AddField(
            model_name='booking',
            name='scheduled_time',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='required_worker_count',
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AddField(
            model_name='booking',
            name='assigned_workers',
            field=models.ManyToManyField(blank=True, related_name='collective_jobs', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='booking',
            name='latitude',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='longitude',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='arrival_radius_meters',
            field=models.PositiveIntegerField(default=300),
        ),
        migrations.AddField(
            model_name='booking',
            name='geofence_verified',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='booking',
            name='geofence_verified_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='cancellation_fee',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AddField(
            model_name='booking',
            name='cancellation_reason',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='dispute_reason',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='booking',
            name='total_contract_value',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AddField(
            model_name='booking',
            name='cooperative_allocation',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AddField(
            model_name='booking',
            name='idempotency_key',
            field=models.CharField(blank=True, db_index=True, max_length=100, null=True),
        ),
    ]
