from rest_framework import serializers
from .models import Booking, RepairToken, MajorRepairApproval, ChatMessage, BookingDispute
from accounts.serializers import UserSerializer
from services.serializers import ServiceCategorySerializer
from django.contrib.auth import get_user_model
from .fair_wage_engine import calculate_fair_wage

User = get_user_model()

class BookingDisputeSerializer(serializers.ModelSerializer):
    raised_by_name = serializers.CharField(source='raised_by.full_name', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.full_name', read_only=True)

    class Meta:
        model = BookingDispute
        fields = (
            'id', 'dispute_id', 'booking', 'raised_by', 'raised_by_name',
            'reason', 'status', 'worker_response', 'worker_responded_at',
            'resolution_notes', 'resolved_by', 'resolved_by_name', 'resolved_at',
            'evidence_record', 'assessment_report', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'dispute_id', 'raised_by', 'created_at', 'updated_at', 'evidence_record', 'assessment_report')

class RepairTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepairToken
        fields = ('id', 'booking', 'token_number', 'status', 'updated_at')

class MajorRepairApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = MajorRepairApproval
        fields = ('id', 'booking', 'reason', 'estimated_cost', 'status', 'created_at')

from services.models import Rating

class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ('id', 'rating', 'review', 'created_at')

class BookingSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    worker = UserSerializer(read_only=True)
    service_category_detail = ServiceCategorySerializer(source='service_category', read_only=True)
    repair_token = RepairTokenSerializer(read_only=True)
    major_repairs = MajorRepairApprovalSerializer(many=True, read_only=True)
    rating = RatingSerializer(read_only=True)
    payment = serializers.SerializerMethodField()
    unread_chats_count = serializers.SerializerMethodField()
    dispute = serializers.SerializerMethodField()
    fair_wage_breakdown = serializers.SerializerMethodField()
    
    assigned_workers = UserSerializer(many=True, read_only=True)
    arrival_pin = serializers.SerializerMethodField()
    arrival_pin_verified = serializers.BooleanField(read_only=True)
    arrival_pin_verified_at = serializers.DateTimeField(read_only=True)
    qr_code_value = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = (
            'id', 'tracking_id', 'customer', 'worker', 'assigned_workers', 'service_category', 'service_category_detail',
            'problem_type', 'problem_description', 'address', 'city', 'state', 'pincode',
            'status', 'booking_type', 'scheduled_time', 'required_worker_count',
            'latitude', 'longitude', 'arrival_radius_meters', 'geofence_verified', 'geofence_verified_at',
            'arrival_pin', 'arrival_pin_verified', 'arrival_pin_verified_at',
            'cancellation_fee', 'cancellation_reason', 'dispute_reason',
            'total_contract_value', 'cooperative_allocation', 'idempotency_key',
            'qr_code_value',
            'before_photo', 'after_photo', 'spare_part_photo', 'invoice_photo', 'optional_video',
            'repair_token', 'major_repairs', 'rating', 'payment', 'unread_chats_count',
            'dispute', 'fair_wage_breakdown',
            'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'tracking_id', 'customer', 'worker', 'created_at', 'updated_at',
            'status', 'total_contract_value', 'cooperative_allocation',
            'geofence_verified', 'geofence_verified_at', 'cancellation_fee',
            'arrival_pin_verified', 'arrival_pin_verified_at'
        )

    def get_arrival_pin(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            if request.user == obj.customer or request.user.is_staff or getattr(request.user, 'role', '') == 'admin':
                return obj.arrival_pin
        return None

    def get_qr_code_value(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            if request.user == obj.customer or request.user.is_staff or getattr(request.user, 'role', '') == 'admin':
                return str(obj.qr_code_value) if obj.qr_code_value else None
        return None

    def get_payment(self, obj):
        from billing.serializers import PaymentSerializer
        try:
            if hasattr(obj, 'payment') and obj.payment:
                return PaymentSerializer(obj.payment).data
        except Exception:
            pass
        return None

    def get_unread_chats_count(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.chat_messages.filter(receiver=request.user, is_read=False).count()
        return 0

    def get_dispute(self, obj):
        dispute = obj.disputes.first()
        if dispute:
            return BookingDisputeSerializer(dispute).data
        return None

    def get_fair_wage_breakdown(self, obj):
        cat = obj.service_category
        base = getattr(cat, 'base_labour_charge', None) if cat else None
        return calculate_fair_wage(
            base_charge=base,
            duration_minutes=60,
            required_worker_count=obj.required_worker_count,
            category_name=cat.name if cat else "General Maintenance"
        )


class BookingAuditLogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True)

    class Meta:
        from .models import BookingAuditLog
        model = BookingAuditLog
        fields = ('id', 'booking', 'from_status', 'to_status', 'changed_by', 'changed_by_name', 'reason', 'metadata', 'created_at')



class PublicBookingSerializer(serializers.ModelSerializer):
    service_category_detail = ServiceCategorySerializer(source='service_category', read_only=True)
    repair_token = RepairTokenSerializer(read_only=True)
    major_repairs = MajorRepairApprovalSerializer(many=True, read_only=True)
    worker_name = serializers.CharField(source='worker.full_name', read_only=True, default=None)
    
    class Meta:
        model = Booking
        fields = (
            'id', 'tracking_id', 'status', 'problem_type',
            'service_category_detail',
            'worker_name', 'repair_token', 'major_repairs', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'tracking_id', 'status', 'created_at', 'updated_at')


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    receiver_name = serializers.CharField(source='receiver.full_name', read_only=True)
    receiver_email = serializers.EmailField(source='receiver.email', read_only=True)

    class Meta:
        model = ChatMessage
        fields = (
            'id', 'booking', 'sender', 'sender_name', 'sender_email',
            'receiver', 'receiver_name', 'receiver_email',
            'message', 'created_at', 'is_read', 'message_type'
        )
        read_only_fields = ('id', 'sender', 'receiver', 'created_at', 'is_read')


