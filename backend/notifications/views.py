from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification, Announcement, NotificationPreference, OpportunityAlert
from .serializers import (
    NotificationSerializer,
    NotificationPreferenceSerializer,
    OpportunityAlertSerializer,
    AnnouncementSerializer
)
from .notification_engine import (
    route_multi_channel_notification,
    is_within_quiet_hours,
    render_notification_template,
    fuzz_opportunity_location
)

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(user=self.request.user).order_by('-created_at')
        cat = self.request.query_params.get('category')
        if cat:
            qs = qs.filter(category=cat)
        return qs

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        noti = self.get_object()
        noti.is_read = True
        noti.save()
        return Response(NotificationSerializer(noti).data)

    @action(detail=False, methods=['post'], url_path='read-all')
    def read_all(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "success", "message": "All notifications marked as read."})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread_count": count})


class NotificationPreferenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        pref, _ = NotificationPreference.objects.get_or_create(
            user=request.user,
            defaults={
                'enabled_channels': ['PUSH', 'IN_APP', 'SMS'],
                'preferred_language': 'hi',
                'quiet_hours_enabled': False,
                'quiet_hours_start': '22:00',
                'quiet_hours_end': '07:00',
                'opportunity_radius_km': 10.0,
                'urgent_bypasses_quiet_hours': True,
            }
        )
        return Response(NotificationPreferenceSerializer(pref).data)

    def put(self, request):
        pref, _ = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(pref, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OpportunityAlertViewSet(viewsets.ModelViewSet):
    serializer_class = OpportunityAlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Server-side ownership enforcement
        return OpportunityAlert.objects.filter(worker=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        opp = self.get_object()
        if opp.status != 'AVAILABLE':
            return Response({"detail": f"Opportunity is already {opp.status.lower()}."}, status=status.HTTP_400_BAD_REQUEST)
        opp.status = 'ACCEPTED'
        opp.save()
        return Response({"status": "success", "message": "Opportunity accepted.", "opportunity": OpportunityAlertSerializer(opp).data})

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        opp = self.get_object()
        opp.status = 'DISMISSED'
        opp.save()
        return Response({"status": "success", "message": "Opportunity dismissed."})


class GovernanceAnnouncementsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = Announcement.objects.filter(
            recipient_type__in=['all_customers', 'all_captains']
        ).order_by('-created_at')[:20]
        return Response(AnnouncementSerializer(qs, many=True).data)
