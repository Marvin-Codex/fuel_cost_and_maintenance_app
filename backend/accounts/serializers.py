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
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


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
