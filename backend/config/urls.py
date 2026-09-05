"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from accounts.views import GoogleLoginView
from workers.views import OCRExtractView
from bookings.views import ChatMessagesView

def health_check(request):
    return JsonResponse({
        "status": "healthy",
        "service": "UNNATI Cooperative Platform",
        "version": "1.0.0"
    })

urlpatterns = [
    path('healthz', health_check, name='healthz_bare'),
    path('healthz/', health_check, name='healthz'),
    path('api/health/', health_check, name='api_health'),
    path('admin/', admin.site.urls),
    path('api/ocr/extract-document/', OCRExtractView.as_view(), name='ocr_extract'),
    path('api/auth/google-login/', GoogleLoginView.as_view(), name='google_login'),
    path('api/accounts/', include('accounts.urls')),
    path('api/services/', include('services.urls')),
    path('api/workers/', include('workers.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/assistant/', include('assistant.urls')),
    path('api/chat/<int:booking_id>/', ChatMessagesView.as_view(), name='chat-history'),
]

from django.views.static import serve
from django.urls import re_path

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]
