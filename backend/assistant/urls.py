from django.urls import path
from .views import AssistantQueryView, AssistantLanguagesView, AssistantCapabilitiesView

urlpatterns = [
    path('query/', AssistantQueryView.as_view(), name='assistant-query'),
    path('languages/', AssistantLanguagesView.as_view(), name='assistant-languages'),
    path('capabilities/', AssistantCapabilitiesView.as_view(), name='assistant-capabilities'),
]
