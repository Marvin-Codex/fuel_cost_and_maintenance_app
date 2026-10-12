import uuid
from datetime import timedelta

from django.utils import timezone
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Membership, Organization, Plan, Subscription, User


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
    plan_id = serializers.UUIDField(required=False, allow_null=True)
    organization = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password',
            'account_type', 'organization_id', 'organization_name', 'plan_id',
            'organization',
        ]

    def validate(self, attrs):
        account_type = attrs.get('account_type', 'personal')
        organization_id = attrs.get('organization_id')
        organization_name = (attrs.get('organization_name') or '').strip()
        plan_id = attrs.get('plan_id')

        if account_type == 'personal':
            if organization_id or organization_name or plan_id:
                raise serializers.ValidationError(
                    'Personal accounts cannot include organization or package details.'
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
            if not Organization.objects.filter(pk=organization_id).exists():
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
            if not Plan.objects.filter(pk=plan_id, is_active=True).exists():
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

    def create(self, validated_data):
        account_type = validated_data.pop('account_type', 'personal')
        organization_id = validated_data.pop('organization_id', None)
        organization_name = validated_data.pop('organization_name', '') or ''
        plan_id = validated_data.pop('plan_id', None)

        user = User.objects.create_user(**validated_data)
        self._created_organization = None

        if account_type != 'organization':
            return user

        if organization_id:
            organization = Organization.objects.get(pk=organization_id)
            Membership.objects.get_or_create(
                organization=organization,
                user=user,
                defaults={'role': Membership.DRIVER, 'is_active': True},
            )
        else:
            organization = Organization.objects.create(
                name=organization_name,
                slug=self._unique_slug(organization_name),
                created_by=user,
            )
            Membership.objects.create(
                organization=organization, user=user, role=Membership.OWNER
            )
            starts_at = timezone.now()
            Subscription.objects.create(
                organization=organization,
                plan_id=plan_id,
                starts_at=starts_at,
                ends_at=starts_at + timedelta(days=365),
            )

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
