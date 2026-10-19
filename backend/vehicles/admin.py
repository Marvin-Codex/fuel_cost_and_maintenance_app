from django.contrib import admin

from .models import Vehicle, VehicleAssignment


class VehicleAssignmentInline(admin.TabularInline):
    model = VehicleAssignment
    extra = 0


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('name', 'license_plate', 'workspace', 'organization', 'owner', 'is_active')
    list_filter = ('is_active', 'fuel_type')
    search_fields = ('name', 'license_plate', 'vin')
    inlines = [VehicleAssignmentInline]


@admin.register(VehicleAssignment)
class VehicleAssignmentAdmin(admin.ModelAdmin):
    list_display = ('membership', 'vehicle')
    search_fields = ('membership__user__username', 'vehicle__name')
