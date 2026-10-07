import csv

from django.http import HttpResponse
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied

from fuel.models import FuelRecord
from maintenance.models import MaintenanceRecord
from trips.models import Trip
from vehicles.resource_scoping import vehicles_visible_to_request

from .models import UserPreference
from .serializers import UserPreferenceSerializer


def _safe_csv_cell(value):
    if isinstance(value, str) and value.lstrip(' \t\r\n')[:1] in {'=', '+', '-', '@'}:
        return f"'{value}"
    return value


class UserPreferenceView(generics.RetrieveUpdateAPIView):
    serializer_class = UserPreferenceSerializer

    def get_object(self):
        membership, _ = vehicles_visible_to_request(
            self.request, 'system.view' if self.request.method == 'GET' else 'system.update'
        )
        if membership is None and not self.request.user.is_authenticated:
            raise PermissionDenied('Authentication is required.')
        return UserPreference.objects.get_or_create(user=self.request.user)[0]


class DataExportView(generics.GenericAPIView):
    def get(self, request):
        _, vehicles = vehicles_visible_to_request(request, 'system.view')
        vehicle_ids = vehicles.values('pk')

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="vehicle-data-export.csv"'
        writer = csv.writer(response)
        def write_row(values):
            writer.writerow([_safe_csv_cell(value) for value in values])

        write_row([
            'record_type', 'vehicle_id', 'date', 'description', 'odometer_km',
            'distance_km', 'quantity_liters', 'cost', 'notes',
        ])
        for vehicle in vehicles:
            write_row([
                'vehicle', vehicle.id, '', vehicle.name, vehicle.odometer_km,
                '', '', '', f'{vehicle.make} {vehicle.model} · {vehicle.license_plate}',
            ])
        for record in FuelRecord.objects.filter(vehicle_id__in=vehicle_ids).select_related('vehicle'):
            write_row([
                'fuel', record.vehicle_id, record.date.isoformat(), record.station,
                record.odometer_km, '', record.quantity_liters, record.total_cost,
                record.notes,
            ])
        for record in MaintenanceRecord.objects.filter(
            vehicle_id__in=vehicle_ids
        ).select_related('vehicle'):
            write_row([
                'maintenance', record.vehicle_id, record.service_date.isoformat(),
                record.service_type, record.odometer_km, '', '', record.cost,
                record.notes,
            ])
        for record in Trip.objects.filter(vehicle_id__in=vehicle_ids).select_related('vehicle'):
            write_row([
                'trip', record.vehicle_id, record.started_at.isoformat(),
                f'{record.start_location} to {record.destination}',
                record.end_odometer_km or '', record.distance_km,
                record.fuel_consumed_liters or '', record.fuel_cost, record.notes,
            ])
        return response
