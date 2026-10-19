from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from access.drf import WorkspacePermission, canonical_code

from .resource_scoping import vehicles_visible_to_request
from .scoping import vehicles_for


class VehicleScopedSerializerMixin:
    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if request and 'vehicle' in fields and hasattr(request, 'access'):
            fields['vehicle'].queryset = vehicles_for(request.access)
        return fields


class VehicleScopedViewSet(viewsets.ModelViewSet):
    """CRUD base for records that belong to a vehicle and its workspace."""

    permission_classes = [WorkspacePermission]
    resource_name = ''  # e.g. 'fuel' | 'trip' | 'maintenance'
    # Suffixes the spec catalog uses per action.
    action_suffix = {
        'list': 'view',
        'retrieve': 'view',
        'create': 'add',
        'update': 'edit',
        'partial_update': 'edit',
        'destroy': 'delete',
        'summary': 'view',
        'upcoming': 'view',
        'complete': 'edit',
    }
    # Resource name as it appears in the permission catalog.
    catalog_resource = ''

    def _catalog_resource(self):
        if self.catalog_resource:
            return self.catalog_resource
        # Legacy names: trip -> trips, fuel/maintenance already canonical.
        return {'trip': 'trips'}.get(self.resource_name, self.resource_name)

    def permission_for_action(self, action=None):
        action = action or getattr(self, 'action', '')
        suffix = self.action_suffix.get(action, 'view')
        return canonical_code(f'{self._catalog_resource()}.{suffix}')

    def get_queryset(self):
        _, vehicles = vehicles_visible_to_request(self.request)
        return self.queryset.model.objects.filter(vehicle__in=vehicles)

    def save_record(self, serializer):
        _, vehicles = vehicles_visible_to_request(self.request)
        vehicle = serializer.validated_data.get(
            'vehicle', getattr(serializer.instance, 'vehicle', None)
        )
        if vehicle is None or not vehicles.filter(pk=vehicle.pk).exists():
            raise PermissionDenied('You cannot add records for this vehicle.')
        serializer.save(owner=self.request.user)

    def perform_create(self, serializer):
        self.save_record(serializer)

    def perform_update(self, serializer):
        self.save_record(serializer)
