from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from .resource_scoping import vehicles_visible_to_request


class VehicleScopedSerializerMixin:
    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if request and 'vehicle' in fields:
            _, vehicles = vehicles_visible_to_request(request)
            fields['vehicle'].queryset = vehicles
        return fields


class VehicleScopedViewSet(viewsets.ModelViewSet):
    """CRUD base for records that belong to a vehicle and its owner/tenant."""

    resource_name = ''

    def permission_for_action(self):
        action = getattr(self, 'action', '')
        suffix = {
            'list': 'view',
            'retrieve': 'view',
            'create': 'create',
            'update': 'update',
            'partial_update': 'update',
            'destroy': 'delete',
        }.get(action, 'view')
        return f'{self.resource_name}.{suffix}'

    def get_queryset(self):
        _, vehicles = vehicles_visible_to_request(
            self.request, self.permission_for_action()
        )
        return self.queryset.model.objects.filter(vehicle__in=vehicles)

    def save_record(self, serializer):
        permission = self.permission_for_action()
        membership, vehicles = vehicles_visible_to_request(
            self.request, permission
        )
        vehicle = serializer.validated_data.get(
            'vehicle', getattr(serializer.instance, 'vehicle', None)
        )
        if vehicle is None or not vehicles.filter(pk=vehicle.pk).exists():
            raise PermissionDenied('You cannot add records for this vehicle.')
        serializer.save(
            owner=self.request.user,
            organization=membership.organization if membership else None,
        )

    def perform_create(self, serializer):
        self.save_record(serializer)

    def perform_update(self, serializer):
        self.save_record(serializer)
