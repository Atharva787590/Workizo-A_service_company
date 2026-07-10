from rest_framework import serializers
from .models import Booking, RepairToken, MajorRepairApproval
from accounts.serializers import UserSerializer
from services.serializers import ServiceCategorySerializer
from django.contrib.auth import get_user_model

User = get_user_model()

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
    
    class Meta:
        model = Booking
        fields = (
            'id', 'tracking_id', 'customer', 'worker', 'service_category', 'service_category_detail',
            'problem_type', 'problem_description', 'address', 'city', 'state', 'pincode',
            'status', 'qr_code_value',
            'before_photo', 'after_photo', 'spare_part_photo', 'invoice_photo', 'optional_video',
            'repair_token', 'major_repairs', 'rating', 'payment', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'tracking_id', 'customer', 'worker', 'qr_code_value', 'created_at', 'updated_at')

    def get_payment(self, obj):
        from billing.serializers import PaymentSerializer
        try:
            if hasattr(obj, 'payment') and obj.payment:
                return PaymentSerializer(obj.payment).data
        except Exception:
            pass
        return None



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

