from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from access.drf import my_access
from vehicles.views import VehicleViewSet

router = DefaultRouter()
router.register("vehicles", VehicleViewSet, basename="vehicle")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/me/access/", my_access),
    path("api/", include(router.urls)),
]
