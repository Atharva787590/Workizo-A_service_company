from django.urls import path
from services.views import (
    ListServiceCategoriesView,
    SubmitRatingView,
    ServiceCatalogListView,
    ServiceCatalogDetailView,
    ServiceProviderDiscoveryView,
    TransparencyMetricsView,
    TransparencyPoliciesView
)

urlpatterns = [
    path('categories/', ListServiceCategoriesView.as_view(), name='list_categories'),
    path('rate-booking/', SubmitRatingView.as_view(), name='rate_booking'),
    path('catalog/', ServiceCatalogListView.as_view(), name='service_catalog_list'),
    path('catalog/<int:pk>/', ServiceCatalogDetailView.as_view(), name='service_catalog_detail'),
    path('providers/', ServiceProviderDiscoveryView.as_view(), name='service_provider_discovery'),
    path('transparency/metrics/', TransparencyMetricsView.as_view(), name='transparency_metrics'),
    path('transparency/policies/', TransparencyPoliciesView.as_view(), name='transparency_policies'),
]
