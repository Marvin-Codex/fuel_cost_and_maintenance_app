from datetime import date

from django.db.models import Avg, Sum
from django.utils import timezone
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from fuel.models import FuelRecord
from maintenance.models import MaintenanceRecord, MaintenanceReminder
from trips.models import Trip
from vehicles.resource_scoping import vehicles_visible_to_request


class DashboardSummaryView(APIView):
    def get(self, request):
        _, vehicles = vehicles_visible_to_request(request, 'vehicle.view')
        vehicle_id = request.query_params.get('vehicle')
        if vehicle_id:
            vehicle_uuid = serializers.UUIDField().run_validation(vehicle_id)
            vehicles = vehicles.filter(pk=vehicle_uuid)
        vehicle = vehicles.order_by('-created_at').first()
        if vehicle is None:
            return Response({'vehicle': None, 'message': 'No accessible vehicle found.'})

        today = timezone.localdate()
        month_start = today.replace(day=1)
        year_start = date(today.year, 1, 1)
        fuel_records = FuelRecord.objects.filter(vehicle=vehicle)
        maintenance_records = MaintenanceRecord.objects.filter(vehicle=vehicle)
        trips = Trip.objects.filter(vehicle=vehicle)
        reminders = MaintenanceReminder.objects.filter(
            vehicle=vehicle, status=MaintenanceReminder.OPEN
        ).select_related('vehicle')

        for permission in ('fuel.view', 'trip.view', 'maintenance.view'):
            if request.headers.get('X-Organization-ID'):
                from accounts.permissions import has_permission

                membership, _ = vehicles_visible_to_request(request)
                if membership and not has_permission(
                    request.user, permission, membership.organization
                ):
                    from rest_framework.exceptions import PermissionDenied

                    raise PermissionDenied(
                        f'Your organization role or package cannot view {permission.split(".")[0]} data.'
                    )

        latest_reminder = reminders.order_by('due_date', 'due_odometer_km').first()
        return Response({
            'vehicle': {
                'id': str(vehicle.id),
                'name': vehicle.name,
                'make': vehicle.make,
                'model': vehicle.model,
                'year': vehicle.year,
                'registration': vehicle.license_plate,
                'vin': vehicle.vin,
                'fuel_type': vehicle.fuel_type,
                'odometer_km': vehicle.odometer_km,
                'is_active': vehicle.is_active,
            },
            'fuel': {
                'this_month_cost': fuel_records.filter(
                    date__gte=month_start
                ).aggregate(value=Sum('total_cost'))['value'] or 0,
                'this_year_cost': fuel_records.filter(
                    date__gte=year_start
                ).aggregate(value=Sum('total_cost'))['value'] or 0,
                'this_month_liters': fuel_records.filter(
                    date__gte=month_start
                ).aggregate(value=Sum('quantity_liters'))['value'] or 0,
                'record_count': fuel_records.count(),
            },
            'maintenance': {
                'this_month_cost': maintenance_records.filter(
                    service_date__gte=month_start
                ).aggregate(value=Sum('cost'))['value'] or 0,
                'this_year_cost': maintenance_records.filter(
                    service_date__gte=year_start
                ).aggregate(value=Sum('cost'))['value'] or 0,
                'average_cost': maintenance_records.aggregate(
                    value=Avg('cost')
                )['value'] or 0,
                'record_count': maintenance_records.count(),
                'next_reminder_id': str(latest_reminder.id) if latest_reminder else None,
            },
            'trips': {
                'today_count': trips.filter(started_at__date=today).count(),
                'month_count': trips.filter(started_at__date__gte=month_start).count(),
                'month_distance_km': trips.filter(
                    started_at__date__gte=month_start
                ).aggregate(value=Sum('distance_km'))['value'] or 0,
                'month_fuel_liters': trips.filter(
                    started_at__date__gte=month_start
                ).aggregate(value=Sum('fuel_consumed_liters'))['value'] or 0,
            },
        })
