from rest_framework import serializers
from .models import Bill, BillItem, Payment, DirectPaymentTransaction
from bookings.serializers import BookingSerializer

class BillItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillItem
        fields = ('id', 'bill', 'part_name', 'quantity', 'price')
        read_only_fields = ('id', 'bill')

class BillSerializer(serializers.ModelSerializer):
    items = BillItemSerializer(many=True, read_only=True)
    booking_detail = BookingSerializer(source='booking', read_only=True)

    class Meta:
        model = Bill
        fields = (
            'id', 'booking', 'booking_detail', 'labour_charges', 'parts_charges',
            'gst', 'discount', 'grand_total', 'is_approved', 'invoice_pdf', 'supplier_invoice', 'items', 'created_at'
        )
        read_only_fields = ('id', 'parts_charges', 'gst', 'grand_total', 'is_approved', 'invoice_pdf', 'created_at')


class DirectPaymentTransactionSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    recipient_name = serializers.CharField(source='recipient.full_name', read_only=True)

    class Meta:
        model = DirectPaymentTransaction
        fields = (
            'id', 'payment', 'booking', 'transaction_type', 'sender', 'sender_name',
            'recipient', 'recipient_name', 'amount', 'currency', 'status',
            'payment_method', 'adapter_name', 'is_mock', 'idempotency_key',
            'metadata', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class PaymentSerializer(serializers.ModelSerializer):
    payment_method = serializers.ReadOnlyField()
    payment_status = serializers.ReadOnlyField()
    captain_name = serializers.CharField(source='captain.full_name', read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    transactions = DirectPaymentTransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'booking', 'customer', 'customer_name', 'captain', 'captain_name',
            'amount', 'currency', 'receipt_number', 'method', 'status',
            'payment_method', 'payment_status',
            # UNNATI direct payment extension fields
            'lifecycle_status', 'direct_recipient', 'worker_direct_payout',
            'cooperative_allocation', 'platform_fee', 'platform_escrow_held',
            'is_mock_provider', 'adapter_type', 'worker_upi_id', 'idempotency_key',
            'refund_amount', 'refund_reason', 'cancellation_compensation',
            'transactions',
            # Legacy fields preserved
            'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature',
            'transaction_id', 'cash_confirmation_timestamp', 'payment_time',
            'receipt_pdf', 'created_at'
        )
        read_only_fields = ('id', 'created_at', 'payment_method', 'payment_status', 'platform_fee', 'platform_escrow_held')

