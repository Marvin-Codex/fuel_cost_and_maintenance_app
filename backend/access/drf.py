from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from .services import AccessDenied, access_snapshot, get_active_workspace, resolve_access

WORKSPACE_HEADER = "X-Workspace"
LEGACY_ORG_HEADER = "X-Organization-ID"

# Old per-app permission strings -> canonical catalog codes. Lets the
# pre-workspace backend (accounts.permissions ROLE_PERMISSIONS, vehicle.view…)
# keep working while views migrate one by one.
LEGACY_CODE_MAP = {
    "vehicle.view": "vehicles.view",
    "vehicle.create": "vehicles.add",
    "vehicle.update": "vehicles.edit",
    "vehicle.delete": "vehicles.delete",
    "fuel.view": "fuel.view",
    "fuel.create": "fuel.add",
    "fuel.update": "fuel.edit",
    "fuel.delete": "fuel.delete",
    "trip.view": "trips.view",
    "trip.create": "trips.add",
    "trip.update": "trips.edit",
    "trip.delete": "trips.delete",
    "maintenance.view": "maintenance.view",
    "maintenance.create": "maintenance.add",
    "maintenance.update": "maintenance.edit",
    "maintenance.delete": "maintenance.delete",
    "member.manage": "members.manage",
    "system.view": "analytics.view",
    "system.update": "workspace.manage",
}


def canonical_code(code):
    return LEGACY_CODE_MAP.get(code, code)


class WorkspacePermission(BasePermission):
    """Resolves the active workspace + effective permissions once per request, then checks the
    permission the view maps to the current action. An unmapped action is denied.

        class VehicleViewSet(ModelViewSet):
            permission_classes = [WorkspacePermission]
            permission_map = {"list": "vehicles.view", "create": "vehicles.add", ...}
    """

    def _requested_workspace_id(self, request):
        requested = request.headers.get(WORKSPACE_HEADER)
        if requested:
            return requested
        # Back-compat: the old frontend sends X-Organization-ID. Old
        # organizations were migrated 1:1 to workspaces keeping the same
        # UUID, so the value works as an X-Workspace id directly.
        return request.headers.get(LEGACY_ORG_HEADER)

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        workspace = get_active_workspace(request.user, self._requested_workspace_id(request))
        access = resolve_access(request.user, workspace)
        request.workspace, request.access = workspace, access
        action = getattr(view, "action", None) or request.method.lower()
        permission_map = getattr(view, "permission_map", None)
        if permission_map is None:
            # Views that compute their own permission per action (e.g. the
            # VehicleScopedViewSet family) expose permission_for_action().
            code = None
            if hasattr(view, "permission_for_action"):
                try:
                    code = view.permission_for_action()
                except Exception:
                    code = None
            else:
                # Generic APIViews without a map: only require membership.
                return True
        else:
            code = permission_map.get(action)
        if code is None:
            raise AccessDenied("permission_denied", f"No permission is mapped to '{action}'.")
        if not access.can(canonical_code(code)):
            raise AccessDenied("permission_denied", f"Your role does not allow this ({code}).")
        return True


def access_exception_handler(exc, context):
    """Set REST_FRAMEWORK['EXCEPTION_HANDLER'] = 'access.drf.access_exception_handler'."""
    if isinstance(exc, AccessDenied):
        return Response({"code": exc.code, "detail": str(exc), **exc.extra}, status=403)
    return drf_exception_handler(exc, context)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_access(request):
    """Everything an offline client needs to cache: every workspace, role, permissions, limits.

    Returns `{ active_workspace, is_superuser, workspaces:[...] }`. `active_workspace`
    is the workspace a header-less client should use (the user's default). Superuser
    status is included so clients can show the platform console without a second call.
    """
    workspaces = access_snapshot(request.user)
    try:
        active = get_active_workspace(request.user, request.headers.get(WORKSPACE_HEADER))
        active_id = str(active.pk)
    except AccessDenied:
        active_id = workspaces[0]["workspace"]["id"] if workspaces else None
    return Response(
        {
            "active_workspace": active_id,
            "is_superuser": request.user.is_superuser,
            "workspaces": workspaces,
        }
    )

