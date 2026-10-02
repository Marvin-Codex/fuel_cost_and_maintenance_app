from django.db.models import Prefetch
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Membership, Organization, Plan, Subscription
from .permissions import active_subscription, has_permission
from .serializers import (
    AddMemberSerializer,
    CreateOrganizationSerializer,
    LoginSerializer,
    OrganizationSerializer,
    PlanSerializer,
    RegisterSerializer,
    SubscriptionSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(TokenObtainPairView):
    """POST /api/v1/auth/login/ — username + password → JWT pair + user."""

    serializer_class = LoginSerializer


class OrganizationListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        memberships = Membership.objects.filter(
            user=self.request.user, is_active=True
        )
        return Organization.objects.filter(
            memberships__user=self.request.user,
            memberships__is_active=True,
        ).prefetch_related(
            Prefetch('memberships', queryset=memberships, to_attr='request_memberships')
        ).distinct()

    def get_serializer_class(self):
        return OrganizationSerializer if self.request.method == 'GET' else CreateOrganizationSerializer

    def perform_create(self, serializer):
        serializer.save()


class OrganizationMemberCreateView(generics.CreateAPIView):
    serializer_class = AddMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_organization(self):
        organization_id = self.kwargs['organization_id']
        membership = self.request.user.memberships.filter(
            organization_id=organization_id, is_active=True
        ).select_related('organization').first()
        if not membership or not has_permission(
            self.request.user, 'member.manage', membership.organization
        ):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You cannot manage this organization.')
        return membership.organization

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['organization'] = self.get_organization()
        return context


class PlanListView(generics.ListAPIView):
    """GET /api/v1/auth/plans/ — plans available for selection."""

    permission_classes = [IsAuthenticated]
    serializer_class = PlanSerializer

    def get_queryset(self):
        return Plan.objects.filter(is_active=True).prefetch_related('features')


class OrganizationSubscriptionView(APIView):
    """GET the active subscription for the requested organization."""

    permission_classes = [IsAuthenticated]

    def get(self, request, organization_id):
        membership = request.user.memberships.filter(
            organization_id=organization_id, is_active=True
        ).select_related('organization').first()
        if not membership:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You cannot access this organization.')
        subscription = active_subscription(membership.organization)
        if not subscription:
            return Response({'subscription': None})
        return Response({'subscription': SubscriptionSerializer(subscription).data})


class MeView(APIView):
    """GET /api/v1/auth/me/ — the authenticated user's own profile."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)
