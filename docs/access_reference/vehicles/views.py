from django.db import transaction
from rest_framework import serializers, viewsets

from access.drf import WorkspacePermission
from access.models import Workspace
from access.services import check_limit

from .models import Vehicle


def vehicles_for(access):
    """Queryset scoping: only this workspace, and only assigned vehicles for 'assigned' roles."""
    qs = Vehicle.objects.filter(workspace=access.workspace)
    if access.vehicle_scope == "all":
        return qs
    return qs.filter(assignments__membership=access.membership)


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ["id", "name"]


class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [WorkspacePermission]
    permission_map = {
        "list": "vehicles.view",
        "retrieve": "vehicles.view",
        "create": "vehicles.add",
        "update": "vehicles.edit",
        "partial_update": "vehicles.edit",
        "destroy": "vehicles.delete",
    }

    def get_queryset(self):
        return vehicles_for(self.request.access)

    def perform_create(self, serializer):
        ws = self.request.workspace
        with transaction.atomic():
            Workspace.objects.select_for_update().get(pk=ws.pk)  # serialise concurrent adds
            check_limit(ws, "vehicles")
            serializer.save(workspace=ws)
