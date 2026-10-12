from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    MeView,
    OrganizationListCreateView,
    OrganizationMemberCreateView,
    PublicOrganizationListView,
    PublicPlanListView,
    RegisterView,
    OrganizationSubscriptionView,
    PlanListView,
)

app_name = 'accounts'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('plans/', PlanListView.as_view(), name='plan-list'),
    path('plans/public/', PublicPlanListView.as_view(), name='plan-list-public'),
    path(
        'organizations/public/',
        PublicOrganizationListView.as_view(),
        name='organization-list-public',
    ),
    path(
        'organizations/<uuid:organization_id>/subscription/',
        OrganizationSubscriptionView.as_view(),
        name='organization-subscription',
    ),
    path('organizations/', OrganizationListCreateView.as_view(), name='organization-list'),
    path(
        'organizations/<uuid:organization_id>/members/',
        OrganizationMemberCreateView.as_view(),
        name='organization-member-create',
    ),
]
