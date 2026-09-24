from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = fields


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
