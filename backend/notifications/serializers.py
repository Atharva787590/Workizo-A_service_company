from rest_framework import serializers
from .models import Notification, Announcement, NotificationPreference, OpportunityAlert

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            'id', 'user', 'title', 'message', 'notification_type',
            'category', 'channel_delivery_history', 'delivered_channel',
            'idempotency_key', 'is_urgent', 'language', 'is_read', 'created_at'
        )
        read_only_fields = ('id', 'user', 'created_at')


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = (
            'id', 'user', 'enabled_channels', 'quiet_hours_enabled',
            'quiet_hours_start', 'quiet_hours_end', 'preferred_language',
            'opportunity_radius_km', 'urgent_bypasses_quiet_hours',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')


class OpportunityAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpportunityAlert
        fields = (
            'id', 'worker', 'booking_id', 'service_title',
            'coarse_locality', 'coarse_distance_km', 'estimated_payout',
            'status', 'created_at'
        )
        read_only_fields = ('id', 'worker', 'created_at')


class AnnouncementSerializer(serializers.ModelSerializer):
    recipient_user_name = serializers.CharField(source='recipient_user.full_name', read_only=True, default=None)
    
    class Meta:
        model = Announcement
        fields = ('id', 'title', 'message', 'recipient_type', 'recipient_user', 'recipient_user_name', 'created_at')
        read_only_fields = ('id', 'created_at')
