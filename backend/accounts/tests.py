"""Auth + registration tests: JWT login plus the workspace bootstrap."""
from io import StringIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import CommandError, call_command
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from access.models import Membership as WsMembership
from access.models import Plan as WsPlan
from access.models import Workspace

from .models import Membership, Organization, Plan, PlanFeature, User


class AuthAPITests(APITestCase):
    def setUp(self):
        self.password = 'test-Pass-123'
        self.user = User.objects.create_user(
            username='jane', email='jane@example.com', password=self.password
        )

    def _login(self, username='jane', password=None):
        return self.client.post(
            reverse('accounts:login'),
            {'username': username, 'password': password or self.password},
            format='json',
        )

    def test_login_happy_path_returns_tokens_and_user(self):
        res = self._login()
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['username'], 'jane')

    def test_login_wrong_password_returns_401(self):
        res = self._login(password='wrong-password')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_requires_auth(self):
        res = self.client.get(reverse('accounts:me'))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_current_user(self):
        token = self._login().data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        me = self.client.get(reverse('accounts:me'))
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data['username'], 'jane')

    def test_signup_creates_personal_workspace(self):
        membership = WsMembership.objects.get(user=self.user)
        self.assertEqual(membership.workspace.kind, 'personal')
        self.assertEqual(membership.role.key, 'owner')
        self.assertEqual(membership.workspace.plan.key, 'personal-free')

    def test_me_access_snapshot(self):
        token = self._login().data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.get('/api/v1/auth/me/access/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertIn('vehicles.add', res.data[0]['permissions'])


class RegistrationFlowTests(APITestCase):
    def setUp(self):
        self.password = 'test-Pass-123'
        self.plan = Plan.objects.create(name='Fleet', slug='fleet')
        PlanFeature.objects.create(plan=self.plan, code='vehicle.view')
        creator = User.objects.create_user(
            username='owner', email='owner@example.com', password=self.password
        )
        self.organization = Organization.objects.create(
            name='TransLogix', slug='translogix', created_by=creator
        )

    def _register(self, **payload):
        base = {
            'username': 'newuser', 'email': 'new@example.com',
            'password': self.password,
        }
        base.update(payload)
        return self.client.post(reverse('accounts:register'), base, format='json')

    def test_personal_registration_creates_personal_workspace(self):
        res = self._register()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='newuser')
        membership = WsMembership.objects.get(user=user)
        self.assertEqual(membership.workspace.kind, 'personal')

    def test_personal_pro_registration_assigns_multi_vehicle_package(self):
        pro = WsPlan.objects.get(key='personal-pro')
        res = self._register(plan_id=str(pro.id))
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        user = User.objects.get(username='newuser')
        workspace = WsMembership.objects.get(user=user).workspace
        self.assertEqual(workspace.plan, pro)
        self.assertEqual(workspace.plan.limits['vehicles'], 5)

    def test_create_org_creates_mirrored_workspace(self):
        res = self._register(
            account_type='organization', organization_name='Kampala Fleet',
            plan_id=str(self.plan.id),
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        organization = Organization.objects.get(name='Kampala Fleet')
        workspace = Workspace.objects.get(pk=organization.pk)
        ws_membership = WsMembership.objects.get(
            user__username='newuser', workspace=workspace
        )
        self.assertEqual(ws_membership.role.key, 'owner')

class WorkspaceAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='ws-user', password='pw-123456')
        self.client.force_authenticate(user=self.user)

    def test_mine_lists_personal_workspace(self):
        res = self.client.get('/api/v1/access/workspaces/mine/')
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['role'], 'owner')

    def test_add_member_flow(self):
        ws = Workspace.objects.get(kind='personal', memberships__user=self.user)
        User.objects.create_user(username='ws-friend', password='pw-123456')
        res = self.client.post(
            '/api/v1/access/workspaces/%s/add_member/' % ws.pk,
            {'username': 'ws-friend', 'role': 'viewer'},
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
