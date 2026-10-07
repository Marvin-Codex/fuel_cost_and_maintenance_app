from rest_framework.routers import DefaultRouter

from .views import FuelRecordViewSet

app_name = 'fuel'

router = DefaultRouter()
router.register('fuel-records', FuelRecordViewSet, basename='fuel-record')

urlpatterns = router.urls

