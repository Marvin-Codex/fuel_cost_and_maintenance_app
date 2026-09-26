"""
URL configuration for fuelmaintenance project.
"""
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.permissions import AllowAny

urlpatterns = [
    path('admin/', admin.site.urls),
    # Web auth (SimpleJWT) — matches the frontend api/auth.js contract.
    path('api/v1/auth/', include('accounts.urls')),
    # Resource APIs.
    path('api/v1/', include('vehicles.urls')),
    # OpenAPI schema (public — both clients codegen/reference from it).
    path(
        'api/schema/',
        SpectacularAPIView.as_view(permission_classes=[AllowAny]),
        name='schema',
    ),
    path(
        'api/docs/',
        SpectacularSwaggerView.as_view(url_name='schema', permission_classes=[AllowAny]),
        name='docs',
    ),
]

