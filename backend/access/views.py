"""Workspace / plan / role management APIs (spec sections 9-10)."""
from django.contrib.auth import get_user_model
from django.db import models
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
from django.core.management import call_command
from io import StringIO

from .drf import WorkspacePermission, canonical_code
from .models import Membership, Permission, Plan, Role, VehiclePreset, Workspace
from .services import AccessDenied, add_member

User = get_user_model()


class WorkspaceSerializer(serializers.ModelSerializer):
    plan_key = serializers.CharField(source='plan.key', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    role = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = ['id', 'name', 'kind', 'plan', 'plan_key', 'plan_name', 'role', 'is_active']
        read_only_fields = ['id', 'plan_key', 'plan_name', 'role']

    def get_role(self, workspace):
        cached = getattr(workspace, '_my_memberships', None)
        if cached:
            return cached[0].role.key
        request = self.context.get('request')
        if request is None or not request.user.is_authenticated:
            return None
        membership = Membership.objects.filter(
            user=request.user, workspace=workspace, is_active=True,
        ).select_related('role').first()
        return membership.role.key if membership else None


class WorkspaceViewSet(viewsets.ModelViewSet):
    queryset = Workspace.objects.select_related('plan').all()
    serializer_class = WorkspaceSerializer
    permission_classes = [WorkspacePermission]
    permission_map = {
        'list': 'workspace.manage',
        'retrieve': 'workspace.manage',
        'create': 'workspace.manage',
        'update': 'workspace.manage',
        'partial_update': 'workspace.manage',
        'destroy': 'workspace.manage',
        'mine': 'vehicles.view',
        'members': 'members.view',
        'add_member': 'members.manage',
    }
    http_method_names = ['get', 'post', 'patch', 'put', 'delete', 'head', 'options']

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=['is_active'])

    def permission_for_action(self, action=None):
        action = action or getattr(self, 'action', '')
        return canonical_code(self.permission_map.get(action, 'workspace.manage'))

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Workspace.objects.select_related('plan').all()
        return Workspace.objects.select_related('plan').filter(
            memberships__user=user, memberships__is_active=True, is_active=True,
        ).distinct()

    def perform_create(self, serializer):
        plan = serializer.validated_data.get('plan')
        if plan is None:
            plan = Plan.objects.filter(is_default=True).first()
        workspace = serializer.save(
            plan=plan, kind=serializer.validated_data.get('kind', 'personal'),
        )
        role = Role.objects.filter(workspace=None, key='owner').first()
        Membership.objects.create(user=self.request.user, workspace=workspace, role=role)

    @action(detail=False, methods=['get'])
    def mine(self, request):
        """Workspaces the caller belongs to (for the account switcher)."""
        workspaces = list(self.get_queryset())
        memberships = {
            m.workspace_id: m
            for m in Membership.objects.filter(
                user=request.user, workspace__in=workspaces, is_active=True,
            ).select_related('role')
        }
        for workspace in workspaces:
            workspace._my_memberships = (
                [memberships[workspace.pk]] if workspace.pk in memberships else []
            )
        return Response(self.get_serializer(workspaces, many=True).data)

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        workspace = self.get_object()
        rows = Membership.objects.filter(workspace=workspace).select_related('user', 'role')
        return Response([
            {
                'id': str(m.pk), 'user': m.user.get_username(), 'role': m.role.key,
                'role_name': m.role.name, 'vehicle_scope': m.effective_vehicle_scope,
                'is_active': m.is_active,
            }
            for m in rows
        ])

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        workspace = self.get_object()
        username = (request.data.get('username') or '').strip()
        role_key = (request.data.get('role') or 'viewer').strip()
        if not username:
            return Response({'code': 'invalid', 'detail': 'username is required.'}, status=400)
        from django.contrib.auth import get_user_model

        User = get_user_model()
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'code': 'not_found', 'detail': 'User does not exist.'}, status=404)
        try:
            membership = add_member(workspace, user, role_key)
        except ValueError as exc:
            return Response({'code': 'invalid', 'detail': str(exc)}, status=400)
        except AccessDenied as exc:
            return Response({'code': exc.code, 'detail': str(exc)}, status=403)
        return Response({'id': str(membership.pk), 'role': membership.role.key})


class PlanAdminSerializer(serializers.ModelSerializer):
    entitlements = serializers.SlugRelatedField(
        many=True, slug_field='code', queryset=Permission.objects.all(),
    )

    class Meta:
        model = Plan
        fields = [
            'id', 'key', 'name', 'kind', 'description', 'is_public',
            'is_default', 'is_system', 'is_active', 'limits', 'entitlements', 'price_config',
        ]
        read_only_fields = ['id', 'is_system']


class RoleAdminSerializer(serializers.ModelSerializer):
    permissions = serializers.SlugRelatedField(
        many=True, slug_field='code', queryset=Permission.objects.all(),
    )

    class Meta:
        model = Role
        fields = ['id', 'workspace', 'key', 'name', 'permissions', 'default_vehicle_scope', 'is_system']
        read_only_fields = ['id', 'is_system']


class SuperadminViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'put', 'delete', 'head', 'options']

    def check_permissions(self, request):
        super().check_permissions(request)
        if not request.user.is_superuser:
            raise PermissionDenied('Only platform admins can manage platform data.')


class PlanViewSet(SuperadminViewSet):
    queryset = Plan.objects.prefetch_related('entitlements').all()
    serializer_class = PlanAdminSerializer

    def check_permissions(self, request):
        super(SuperadminViewSet, self).check_permissions(request)
        if request.method == 'GET' and getattr(self, 'action', None) == 'list' and not request.user.is_superuser:
            return
        if not request.user.is_superuser:
            raise PermissionDenied('Only platform admins manage packages.')

    def list(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            plans = Plan.objects.filter(is_public=True, is_active=True).prefetch_related('entitlements')
            return Response(self.get_serializer(plans, many=True).data)
        return super().list(request, *args, **kwargs)

    def perform_destroy(self, instance):
        if instance.is_system:
            raise PermissionDenied('System plans cannot be deleted; deactivate them instead.')
        instance.is_active = False
        instance.save(update_fields=['is_active'])


class UserAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff', 'is_superuser', 'password']
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save(update_fields=['password'])
        return instance


class UserViewSet(SuperadminViewSet):
    queryset = User.objects.order_by('username')
    serializer_class = UserAdminSerializer

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise PermissionDenied('You cannot deactivate your own account.')
        instance.is_active = False
        instance.save(update_fields=['is_active'])



class VehiclePresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehiclePreset
        fields = [
            'id', 'name', 'make', 'model', 'year', 'fuel_type', 'engine',
            'engine_capacity_cc', 'cylinders', 'transmission', 'drive_type', 'body_type',
            'doors', 'seats', 'color', 'power_hp', 'power_kw', 'torque_nm',
            'top_speed_kmh', 'curb_weight_kg', 'gross_weight_kg',
            'tank_capacity_l', 'tank_capacity_liters',
            'combined_fuel_consumption_l_100km', 'city_fuel_consumption_l_100km', 'highway_fuel_consumption_l_100km',
            'battery_capacity_kwh', 'electric_range_km', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class VehiclePresetViewSet(SuperadminViewSet):
    queryset = VehiclePreset.objects.all()
    serializer_class = VehiclePresetSerializer
    filter_backends = [SearchFilter]
    search_fields = ['name', 'make', 'model', 'year', 'engine', 'fuel_type', 'transmission', 'drive_type', 'body_type']

    def check_permissions(self, request):
        # Any signed-in user may browse presets to pick from when adding a vehicle.
        if request.method in ('GET', 'HEAD', 'OPTIONS') and getattr(self, 'action', None) in ('list', 'retrieve'):
            super(SuperadminViewSet, self).check_permissions(request)
            return
        super().check_permissions(request)

    def get_queryset(self):
        qs = VehiclePreset.objects.all()
        if self.request.user.is_superuser:
            return qs
        return qs.filter(is_active=True)

    @action(detail=False, methods=['post'])
    def bulk_import(self, request):
        try:
            out = StringIO()
            call_command('import_vehicle_presets', stdout=out)
            return Response({'detail': 'Import completed', 'output': out.getvalue()})
        except Exception as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=['is_active', 'updated_at'])


class MembershipAdminSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    workspace_name = serializers.CharField(source='workspace.name', read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = Membership
        fields = ['id', 'user', 'username', 'workspace', 'workspace_name', 'role', 'role_name', 'vehicle_scope', 'is_active']
        read_only_fields = ['id', 'username', 'workspace_name', 'role_name']

    def validate(self, attrs):
        role = attrs.get('role', getattr(self.instance, 'role', None))
        workspace = attrs.get('workspace', getattr(self.instance, 'workspace', None))
        if role and role.workspace_id not in (None, workspace.pk if workspace else None):
            raise serializers.ValidationError({'role': 'The role must belong to the selected workspace or be a template role.'})
        return attrs


class MembershipViewSet(SuperadminViewSet):
    queryset = Membership.objects.select_related('user', 'workspace', 'role').order_by('workspace__name', 'user__username')
    serializer_class = MembershipAdminSerializer

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=['is_active'])


class SuperRoleListViewSet(SuperadminViewSet):
    """Read-only role list for superadmin pickers (template + custom roles)."""
    queryset = Role.objects.select_related('workspace').prefetch_related('permissions').order_by('workspace__name', 'key')
    serializer_class = RoleAdminSerializer
    http_method_names = ['get', 'head', 'options']


class WorkspaceAdminSerializer(serializers.ModelSerializer):
    """Full tenant record for the superadmin console: plan, overrides, status."""
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    entitlement_grants = serializers.SlugRelatedField(
        many=True, slug_field='code', queryset=Permission.objects.all(), required=False,
    )
    entitlement_revokes = serializers.SlugRelatedField(
        many=True, slug_field='code', queryset=Permission.objects.all(), required=False,
    )

    class Meta:
        model = Workspace
        fields = [
            'id', 'name', 'kind', 'plan', 'plan_name', 'limit_overrides',
            'entitlement_grants', 'entitlement_revokes', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'plan_name', 'created_at']


class WorkspaceAdminViewSet(SuperadminViewSet):
    """Platform-side workspace CRUD: plan assignment, per-customer overrides, status."""
    queryset = Workspace.objects.select_related('plan').prefetch_related(
        'entitlement_grants', 'entitlement_revokes',
    ).order_by('-created_at')
    serializer_class = WorkspaceAdminSerializer

    def perform_create(self, serializer):
        plan = serializer.validated_data.get('plan')
        if plan is None:
            plan = Plan.objects.filter(is_default=True).first()
            if plan is None:
                raise PermissionDenied('Set a package first: no default package exists.')
        serializer.save(plan=plan)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=['is_active'])


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.prefetch_related('permissions').all()
    serializer_class = RoleAdminSerializer
    permission_classes = [WorkspacePermission]
    permission_map = {
        'list': 'roles.manage', 'retrieve': 'roles.manage',
        'create': 'roles.manage', 'update': 'roles.manage',
        'partial_update': 'roles.manage', 'destroy': 'roles.manage',
    }
    http_method_names = ['get', 'post', 'patch', 'put', 'head', 'options']

    def permission_for_action(self, action=None):
        return 'roles.manage'

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Role.objects.prefetch_related('permissions').all()
        return Role.objects.prefetch_related('permissions').filter(
            models.Q(workspace=None)
            | models.Q(workspace__memberships__user=user, workspace__memberships__is_active=True)
        ).distinct()

    def perform_create(self, serializer):
        workspace = serializer.validated_data.get('workspace')
        if workspace is None:
            if not self.request.user.is_superuser:
                raise PermissionDenied('Only platform admins create template roles.')
        else:
            access = getattr(self.request, 'access', None)
            if access is None or access.workspace.pk != workspace.pk:
                raise PermissionDenied('Create custom roles inside the active workspace.')
        serializer.save()



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def permission_catalog(request):
    """Permission code catalog for the superadmin console (entitlement pickers)."""
    if not request.user.is_superuser:
        raise PermissionDenied('Only platform admins can view the permission catalog.')
    from .permissions_catalog import PERMISSIONS
    return Response([
        {'code': code, 'group': group, 'label': label}
        for code, (group, label) in sorted(PERMISSIONS.items())
    ])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def superadmin_overview(request):
    """Return platform-wide dashboard data for Django superusers only."""
    if not request.user.is_superuser:
        raise PermissionDenied('Only platform admins can view the platform overview.')

    workspaces = Workspace.objects.filter(is_active=True).select_related('plan').annotate(
        active_members=models.Count('memberships', filter=models.Q(memberships__is_active=True), distinct=True),
    ).order_by('-created_at')
    plans = Plan.objects.filter(is_active=True).annotate(
        workspace_count=models.Count('workspaces', filter=models.Q(workspaces__is_active=True), distinct=True),
    ).order_by('name')

    return Response({
        'metrics': {
            'active_workspaces': workspaces.count(),
            'active_subscriptions': sum(plan.workspace_count for plan in plans),
            'active_members': Membership.objects.filter(is_active=True).values('user_id').distinct().count(),
            'active_plans': plans.count(),
        },
        'workspaces': [
            {
                'id': str(workspace.pk),
                'name': workspace.name,
                'kind': workspace.kind,
                'plan': workspace.plan.name,
                'members': workspace.active_members,
            }
            for workspace in workspaces[:8]
        ],
        'plans': [
            {
                'id': plan.pk,
                'name': plan.name,
                'workspaces': plan.workspace_count,
                'is_default': plan.is_default,
            }
            for plan in plans
        ],
    })
