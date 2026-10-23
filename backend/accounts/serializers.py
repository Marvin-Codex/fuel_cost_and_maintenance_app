import uuid
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Membership, Organization, Plan, Subscription, User
from access.models import Plan as AccessPlan
from access.models import Workspace


class PlanSerializer(serializers.ModelSerializer):
    features = serializers.SerializerMethodField()

    class Meta:
        model = Plan
        fields = ['id', 'name', 'slug', 'description', 'features']
        read_only_fields = fields

    def get_features(self, plan):
        return list(plan.features.values_list('code', flat=True))


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)

    class Meta:
        model = Subscription
        fields = ['id', 'plan', 'starts_at', 'ends_at', 'is_active']
        read_only_fields = fields


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_superuser']
        read_only_fields = fields


class AccessPlanSerializer(serializers.ModelSerializer):
    features = serializers.SerializerMethodField()

    class Meta:
        model = AccessPlan
        fields = ['id', 'key', 'name', 'kind', 'description', 'limits', 'features']
        read_only_fields = fields

    def get_features(self, plan):
        return list(plan.entitlements.values_list('code', flat=True))


class PublicWorkspaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace
        fields = ['id', 'name', 'kind']
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    """User registration with an optional organization/package selection.

    ``account_type`` is ``personal`` (default) or ``organization``. Organization
    registrations either join an existing organization (``organization_id``,
    default role: driver) or create a new one (``organization_name`` + a
    required ``plan_id`` package; the creator becomes the owner and receives a
    one-year subscription).
    """

    password = serializers.CharField(write_only=True, min_length=8)
    account_type = serializers.ChoiceField(
        choices=['personal', 'organization'], default='personal'
    )
    organization_id = serializers.UUIDField(required=False, allow_null=True)
    organization_name = serializers.CharField(
        required=False, allow_blank=True, max_length=150
    )
    # New clients submit an access.Plan integer ID; legacy clients may submit
    # an accounts.Plan UUID while older installations are being migrated.
    plan_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    organization = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password',
            'account_type', 'organization_id', 'organization_name', 'plan_id',
            'organization',
        ]

    @staticmethod
    def _access_plan_for(value, kinds=None):
        if value is None or value == '':
            return None
        filters = {'is_public': True, 'is_active': True}
        if kinds:
            filters['kind__in'] = kinds
        try:
            return AccessPlan.objects.filter(pk=int(value), **filters).first()
        except (TypeError, ValueError):
            legacy_plan = Plan.objects.filter(pk=value, is_active=True).first()
            if legacy_plan:
                access_plan = AccessPlan.objects.filter(
                    key=legacy_plan.slug, is_public=True, is_active=True,
                ).first()
                if access_plan and kinds and access_plan.kind not in kinds:
                    return None
                return access_plan
        return None

    def validate(self, attrs):
        account_type = attrs.get('account_type', 'personal')
        organization_id = attrs.get('organization_id')
        organization_name = (attrs.get('organization_name') or '').strip()
        plan_id = attrs.get('plan_id')

        if account_type == 'personal':
            if organization_id or organization_name:
                raise serializers.ValidationError(
                    'Personal accounts cannot include organization details.'
                )
            if plan_id and not self._access_plan_for(plan_id, kinds=['personal']):
                if not Plan.objects.filter(pk=plan_id, is_active=True).exists():
                    raise serializers.ValidationError(
                        {'plan_id': 'Selected personal package is not available.'}
                    )
            return attrs

        if organization_id and organization_name:
            raise serializers.ValidationError(
                'Choose an existing organization or provide a new organization '
                'name — not both.'
            )
        if not organization_id and not organization_name:
            raise serializers.ValidationError(
                'Select an existing organization or provide a name for a new one.'
            )

        if organization_id:
            if not Workspace.objects.filter(
                pk=organization_id, kind='organization', is_active=True,
            ).exists():
                raise serializers.ValidationError(
                    {'organization_id': 'Organization not found.'}
                )
            if plan_id:
                raise serializers.ValidationError(
                    {'plan_id': 'Package selection applies when creating a new '
                                'organization.'}
                )
        else:
            if len(organization_name) < 2:
                raise serializers.ValidationError(
                    {'organization_name': 'Organization name must be at least '
                                          '2 characters.'}
                )
            if not plan_id:
                raise serializers.ValidationError(
                    {'plan_id': 'Choose a package for the new organization.'}
                )
            if not self._access_plan_for(
                plan_id, kinds=['group', 'organization']
            ) and not Plan.objects.filter(
                pk=plan_id, is_active=True,
            ).exists():
                raise serializers.ValidationError(
                    {'plan_id': 'Selected package is not available.'}
                )

        attrs['organization_name'] = organization_name
        return attrs

    @staticmethod
    def _unique_slug(name):
        base = slugify(name)[:140] or 'organization'
        slug = base
        while Organization.objects.filter(slug=slug).exists():
            slug = f'{base}-{uuid.uuid4().hex[:6]}'
        return slug

    @transaction.atomic
    def create(self, validated_data):
        account_type = validated_data.pop('account_type', 'personal')
        organization_id = validated_data.pop('organization_id', None)
        organization_name = validated_data.pop('organization_name', '') or ''
        plan_id = validated_data.pop('plan_id', None)

        user = User.objects.create_user(**validated_data)
        self._created_organization = None

        # The access post_save signal creates the personal workspace.
        from access.models import Membership as WsMembership
        from access.models import Workspace as Ws
        from access.services import add_member, create_personal_workspace

        personal_membership = WsMembership.objects.filter(
            user=user, workspace__kind='personal', is_active=True,
        ).select_related('workspace').first()
        self._created_workspace = personal_membership

        if account_type != 'organization':
            if personal_membership and plan_id:
                personal_plan = self._access_plan_for(plan_id, kinds=['personal'])
                if personal_plan is None:
                    personal_plan = AccessPlan.objects.filter(
                        key='personal-free', is_public=True, is_active=True,
                    ).first()
                if personal_plan is None:
                    raise serializers.ValidationError(
                        {'plan_id': 'No personal package is configured.'}
                    )
                personal_workspace = personal_membership.workspace
                personal_workspace.plan = personal_plan
                personal_workspace.save(update_fields=['plan'])
            elif not personal_membership:
                # Fallback: the post_save signal (bootstrap_user) should have
                # created a personal workspace + owner membership. If it didn't
                # (e.g. seed data wasn't ready yet), create one now so the user
                # is never left without a workspace of their own.
                create_personal_workspace(user)
            return user

        if organization_id:
            workspace = Ws.objects.get(
                pk=organization_id, kind='organization', is_active=True,
            )
            access_plan = workspace.plan
            organization, _ = Organization.objects.get_or_create(
                pk=workspace.pk,
                defaults={
                    'name': workspace.name,
                    'slug': self._unique_slug(workspace.name),
                    'created_by': user,
                },
            )
            Membership.objects.get_or_create(
                organization=organization,
                user=user,
                defaults={'role': Membership.DRIVER, 'is_active': True},
            )
            add_member(workspace, user, 'staff')
        else:
            access_plan = self._access_plan_for(plan_id)
            if access_plan is None:
                access_plan = AccessPlan.objects.filter(
                    key='enterprise', is_public=True, is_active=True,
                ).first() or AccessPlan.objects.filter(
                    is_default=True, is_public=True, is_active=True,
                ).first()
            if access_plan is None:
                raise serializers.ValidationError(
                    {'plan_id': 'No organization access package is configured.'}
                )
            workspace = Ws.objects.create(
                name=organization_name,
                kind='organization',
                plan=access_plan,
            )
            organization = Organization.objects.create(
                id=workspace.pk,
                name=workspace.name,
                slug=self._unique_slug(workspace.name),
                created_by=user,
            )
            legacy_plan, _ = Plan.objects.get_or_create(
                slug=access_plan.key,
                defaults={
                    'name': access_plan.name,
                    'description': access_plan.description,
                    'is_active': access_plan.is_active,
                },
            )
            Membership.objects.create(
                organization=organization, user=user, role=Membership.OWNER
            )
            starts_at = timezone.now()
            Subscription.objects.create(
                organization=organization,
                plan=legacy_plan,
                starts_at=starts_at,
                ends_at=starts_at + timedelta(days=365),
            )
            add_member(workspace, user, 'owner')

        self._created_organization = organization
        return user

    def get_organization(self, user):
        organization = getattr(self, '_created_organization', None)
        if not organization:
            return None
        membership = Membership.objects.filter(
            organization=organization, user=user
        ).first()
        return {
            'id': str(organization.id),
            'name': organization.name,
            'slug': organization.slug,
            'role': membership.role if membership else None,
        }


class PublicOrganizationSerializer(serializers.ModelSerializer):
    """Minimal organization fields safe to expose during registration."""

    class Meta:
        model = Organization
        fields = ['id', 'name', 'slug']
        read_only_fields = fields


class OrganizationSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'name', 'slug', 'role', 'created_at']
        read_only_fields = fields

    def get_role(self, organization):
        memberships = getattr(organization, 'request_memberships', [])
        membership = memberships[0] if memberships else None
        return membership.role if membership else None


class CreateOrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['name', 'slug']

    def create(self, validated_data):
        user = self.context['request'].user
        organization = Organization.objects.create(created_by=user, **validated_data)
        Membership.objects.create(
            organization=organization, user=user, role=Membership.OWNER
        )
        return organization


class AddMemberSerializer(serializers.Serializer):
    username = serializers.CharField()
    role = serializers.ChoiceField(choices=Membership.ROLE_CHOICES)

    def validate_username(self, value):
        try:
            return User.objects.get(username=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('User does not exist.')

    def create(self, validated_data):
        organization = self.context['organization']
        return Membership.objects.update_or_create(
            organization=organization,
            user=validated_data['username'],
            defaults={'role': validated_data['role'], 'is_active': True},
        )[0]


class LoginSerializer(TokenObtainPairSerializer):
    """JWT token pair plus the authenticated user payload.

    Kept in sync with the web frontend contract in
    frontend/fuelmaintenance/src/api/auth.js — response must include
    `access`/`refresh` (SimpleJWT provides both).
    """

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data
