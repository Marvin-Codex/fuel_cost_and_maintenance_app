from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from preferences.models import UserPreference
from django.db import transaction

from access.drf import WorkspacePermission, canonical_code
from access.models import Workspace
from access.services import check_limit

from .models import Vehicle
from .scoping import vehicles_for
from .serializers import VehicleSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [WorkspacePermission]
    permission_map = {
        'list': 'vehicles.view',
        'retrieve': 'vehicles.view',
        'create': 'vehicles.add',
        'update': 'vehicles.edit',
        'partial_update': 'vehicles.edit',
        'destroy': 'vehicles.delete',
        'activate': 'vehicles.view',
    }

    def get_queryset(self):
        return vehicles_for(self.request.access)

    def perform_create(self, serializer):
        ws = self.request.workspace
        with transaction.atomic():
            Workspace.objects.select_for_update().get(pk=ws.pk)  # serialise concurrent adds
            check_limit(ws, 'vehicles')
            serializer.save(
                owner=self.request.user, workspace=ws,
                organization_id=getattr(ws, '_legacy_org_id', None),
            )

    def destroy(self, request, *args, **kwargs):
        vehicle = self.get_object()
        has_history = any((
            vehicle.fuel_records.exists(),
            vehicle.trips.exists(),
            vehicle.maintenance_records.exists(),
        ))
        if has_history:
            return Response(
                {
                    'detail': (
                        'This vehicle has fuel, trip, or maintenance history and '
                        'cannot be deleted. Mark it inactive instead.'
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )
        self.perform_destroy(vehicle)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        vehicle = self.get_object()
        UserPreference.objects.update_or_create(
            user=request.user,
            defaults={'active_vehicle': vehicle},
        )
        return Response(self.get_serializer(vehicle).data)

    def permission_for_action(self):
        """Lets WorkspacePermission derive the code when it probes the view."""
        action = getattr(self, 'action', '') or 'list'
        return canonical_code(self.permission_map.get(action, 'vehicles.view'))
