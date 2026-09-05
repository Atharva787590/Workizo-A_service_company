from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NotificationViewSet,
    NotificationPreferenceView,
    OpportunityAlertViewSet,
    GovernanceAnnouncementsView
)

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'opportunities', OpportunityAlertViewSet, basename='opportunity')

urlpatterns = [
    path('preferences/', NotificationPreferenceView.as_view(), name='notification-preferences'),
    path('governance-announcements/', GovernanceAnnouncementsView.as_view(), name='governance-announcements'),
    path('', include(router.urls)),
]
