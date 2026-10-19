"""Access app routes: workspaces, plans, roles."""
from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    MembershipViewSet,
    PlanViewSet,
    RoleViewSet,
    SuperRoleListViewSet,
    UserViewSet,
    VehiclePresetViewSet,
    WorkspaceAdminViewSet,
    WorkspaceViewSet,
    permission_catalog,
    superadmin_overview,
)

router = DefaultRouter()
router.register('workspaces', WorkspaceViewSet, basename='workspace')
router.register('super-workspaces', WorkspaceAdminViewSet, basename='access-workspace')
router.register('super-roles', SuperRoleListViewSet, basename='access-super-role')
router.register('plans', PlanViewSet, basename='access-plan')
router.register('roles', RoleViewSet, basename='access-role')
router.register('users', UserViewSet, basename='access-user')
router.register('memberships', MembershipViewSet, basename='access-membership')
router.register('vehicle-presets', VehiclePresetViewSet, basename='vehicle-preset')

urlpatterns = [
    *router.urls,
    path('superadmin/overview/', superadmin_overview, name='superadmin-overview'),
    path('superadmin/permissions/', permission_catalog, name='superadmin-permissions'),
]