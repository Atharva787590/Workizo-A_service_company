# Generated for UNNATI Cooperative Platform (SIH 2026)

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('billing', '0004_payment_captain_payment_cash_confirmation_timestamp_and_more'),
        ('bookings', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='lifecycle_status',
            field=models.CharField(choices=[('PAYMENT_PENDING', 'Payment Pending'), ('PAYMENT_INITIATED', 'Payment Initiated'), ('PAYMENT_CONFIRMED', 'Payment Confirmed'), ('PAYMENT_COMPLETED', 'Payment Completed'), ('PAYMENT_FAILED', 'Payment Failed'), ('PAYMENT_CANCELLED', 'Payment Cancelled'), ('REFUND_PENDING', 'Refund Pending'), ('REFUNDED', 'Refunded')], default='PAYMENT_PENDING', max_length=50),
        ),
        migrations.AddField(
            model_name='payment',
            name='direct_recipient',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='direct_received_payments', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='payment',
            name='worker_direct_payout',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AddField(
            model_name='payment',
            name='cooperative_allocation',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AddField(
            model_name='payment',
            name='platform_fee',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AddField(
            model_name='payment',
            name='platform_escrow_held',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='payment',
            name='is_mock_provider',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='payment',
            name='adapter_type',
            field=models.CharField(default='DIRECT_UPI', max_length=50),
        ),
        migrations.AddField(
            model_name='payment',
            name='worker_upi_id',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='idempotency_key',
            field=models.CharField(blank=True, max_length=100, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='refund_amount',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AddField(
            model_name='payment',
            name='refund_reason',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='cancellation_compensation',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.CreateModel(
            name='DirectPaymentTransaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('transaction_type', models.CharField(choices=[('CUSTOMER_DIRECT_PAYMENT', 'Customer Direct Payment'), ('WORKER_PAYOUT_SHARE', 'Worker Payout Share'), ('COOPERATIVE_ALLOCATION', 'Cooperative Allocation'), ('CANCELLATION_COMPENSATION', 'Cancellation Compensation'), ('REFUND', 'Direct Refund'), ('ADJUSTMENT', 'Direct Adjustment')], max_length=50)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('currency', models.CharField(default='INR', max_length=10)),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('INITIATED', 'Initiated'), ('CONFIRMED', 'Confirmed'), ('COMPLETED', 'Completed'), ('FAILED', 'Failed'), ('CANCELLED', 'Cancelled'), ('REFUNDED', 'Refunded')], default='INITIATED', max_length=50)),
                ('payment_method', models.CharField(default='DIRECT_UPI', max_length=50)),
                ('adapter_name', models.CharField(default='DIRECT_UPI_MOCK', max_length=50)),
                ('is_mock', models.BooleanField(default=False)),
                ('idempotency_key', models.CharField(blank=True, max_length=100, null=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('booking', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payment_transactions', to='bookings.booking')),
                ('payment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transactions', to='billing.payment')),
                ('recipient', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='received_transactions', to=settings.AUTH_USER_MODEL)),
                ('sender', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='sent_transactions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
