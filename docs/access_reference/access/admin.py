"""Superuser console v1. Everything below is editable in the Django admin."""

from django.contrib import admin

from .models import Membership, Permission, Plan, Role, Workspace


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("code", "group", "label")
    list_filter = ("group",)
    search_fields = ("code", "label")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class SystemRowGuard:
    """Seeded rows can be edited and renamed but not deleted; `key` is fixed once created."""

    def has_delete_permission(self, request, obj=None):
        if obj is not None and obj.is_system:
            return False
        return super().has_delete_permission(request, obj)

    def get_readonly_fields(self, request, obj=None):
        return ("key",) if obj else ()


@admin.register(Plan)
class PlanAdmin(SystemRowGuard, admin.ModelAdmin):
    list_display = ("name", "key", "kind", "is_public", "is_default", "is_system", "is_active")
    list_filter = ("kind", "is_public", "is_active")
    filter_horizontal = ("entitlements",)


@admin.register(Role)
class RoleAdmin(SystemRowGuard, admin.ModelAdmin):
    list_display = ("name", "key", "workspace", "default_vehicle_scope", "is_system")
    list_filter = ("workspace", "is_system")
    filter_horizontal = ("permissions",)


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ("name", "kind", "plan", "is_active", "created_at")
    list_filter = ("kind", "plan", "is_active")
    search_fields = ("name",)
    filter_horizontal = ("entitlement_grants", "entitlement_revokes")


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "workspace", "role", "vehicle_scope", "is_active")
    list_filter = ("role", "is_active")
    search_fields = ("user__username", "workspace__name")
    raw_id_fields = ("user", "workspace")
    filter_horizontal = ("grants", "denies")
