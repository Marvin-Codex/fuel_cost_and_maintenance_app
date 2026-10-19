from django.db import transaction
from rest_framework import viewsets

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

    def permission_for_action(self):
        """Lets WorkspacePermission derive the code when it probes the view."""
        action = getattr(self, 'action', '') or 'list'
        return canonical_code(self.permission_map.get(action, 'vehicles.view'))
