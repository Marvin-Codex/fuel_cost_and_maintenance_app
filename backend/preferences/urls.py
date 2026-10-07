from django.urls import path

from .views import DataExportView, UserPreferenceView

app_name = 'preferences'

urlpatterns = [
    path('preferences/', UserPreferenceView.as_view(), name='preferences'),
    path('export/', DataExportView.as_view(), name='data-export'),
]
