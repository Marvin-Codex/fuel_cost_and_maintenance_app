from rest_framework.routers import DefaultRouter

from .views import MaintenanceRecordViewSet, MaintenanceReminderViewSet

app_name = 'maintenance'

router = DefaultRouter()
router.register('maintenance-records', MaintenanceRecordViewSet, basename='maintenance-record')
router.register('maintenance-reminders', MaintenanceReminderViewSet, basename='maintenance-reminder')

urlpatterns = router.urls
