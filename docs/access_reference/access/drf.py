from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from .services import AccessDenied, access_snapshot, get_active_workspace, resolve_access

WORKSPACE_HEADER = "X-Workspace"


class WorkspacePermission(BasePermission):
    """Resolves the active workspace + effective permissions once per request, then checks the
    permission the view maps to the current action. An unmapped action is denied.

        class VehicleViewSet(ModelViewSet):
            permission_classes = [WorkspacePermission]
            permission_map = {"list": "vehicles.view", "create": "vehicles.add", ...}
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        workspace = get_active_workspace(request.user, request.headers.get(WORKSPACE_HEADER))
        access = resolve_access(request.user, workspace)
        request.workspace, request.access = workspace, access
        action = getattr(view, "action", None) or request.method.lower()
        code = getattr(view, "permission_map", {}).get(action)
        if code is None:
            raise AccessDenied("permission_denied", f"No permission is mapped to '{action}'.")
        if not access.can(code):
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
    """Everything an offline client needs to cache: every workspace, role, permissions, limits."""
    return Response(access_snapshot(request.user))
