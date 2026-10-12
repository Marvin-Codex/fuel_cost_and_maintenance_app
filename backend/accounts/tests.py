from io import StringIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import CommandError, call_command
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

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
        self.assertEqual(me.data['email'], 'jane@example.com')


class RegistrationFlowTests(APITestCase):
    """Account-type registration: personal, join organization, create + package."""

    def setUp(self):
        self.password = 'test-Pass-123'
        self.plan = Plan.objects.create(
            name='Fleet', slug='fleet', description='For teams.'
        )
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

    def test_personal_registration_is_default_and_has_no_organization(self):
        res = self._register()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['organization'], None)
        user = User.objects.get(username='newuser')
        self.assertFalse(user.memberships.exists())

    def test_join_organization_creates_driver_membership(self):
        res = self._register(
            account_type='organization', organization_id=str(self.organization.id)
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        membership = Membership.objects.get(
            user__username='newuser', organization=self.organization
        )
        self.assertEqual(membership.role, Membership.DRIVER)
        self.assertEqual(res.data['organization']['role'], Membership.DRIVER)

    def test_create_organization_with_package_creates_owner_and_subscription(self):
        res = self._register(
            account_type='organization', organization_name='Kampala Fleet',
            plan_id=str(self.plan.id),
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        organization = Organization.objects.get(name='Kampala Fleet')
        membership = Membership.objects.get(
            user__username='newuser', organization=organization
        )
        self.assertEqual(membership.role, Membership.OWNER)
        subscription = organization.subscriptions.get()
        self.assertEqual(subscription.plan, self.plan)
        self.assertTrue(subscription.is_active)

    def test_organization_without_details_is_rejected(self):
        res = self._register(account_type='organization')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_organization_requires_package(self):
        res = self._register(
            account_type='organization', organization_name='No Package Ltd'
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Organization.objects.filter(name='No Package Ltd').exists())

    def test_join_organization_rejects_package_selection(self):
        res = self._register(
            account_type='organization', organization_id=str(self.organization.id),
            plan_id=str(self.plan.id),
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_personal_registration_rejects_organization_details(self):
        res = self._register(organization_name='Sneaky Org')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_public_endpoints_do_not_require_auth(self):
        plans = self.client.get(reverse('accounts:plan-list-public'))
        self.assertEqual(plans.status_code, status.HTTP_200_OK)
        self.assertEqual(len(plans.data), 1)

        organizations = self.client.get(reverse('accounts:organization-list-public'))
        self.assertEqual(organizations.status_code, status.HTTP_200_OK)
        self.assertEqual(organizations.data[0]['name'], 'TransLogix')
        self.assertNotIn('created_by', organizations.data[0])


class SeedDemoUserCommandTests(APITestCase):
    @patch(
        'accounts.management.commands.seed_demo_user.getpass',
        side_effect=['Strong-test-password-928!', 'Strong-test-password-928!'],
    )
    def test_password_is_prompted_and_never_printed(self, _getpass):
        output = StringIO()

        call_command('seed_demo_user', stdout=output)

        user = get_user_model().objects.get(username='demo')
        self.assertTrue(user.check_password('Strong-test-password-928!'))
        self.assertNotIn('Strong-test-password-928!', output.getvalue())

    @patch(
        'accounts.management.commands.seed_demo_user.getpass',
        side_effect=['Strong-test-password-928!', 'different-password'],
    )
    def test_mismatched_password_does_not_create_user(self, _getpass):
        with self.assertRaises(CommandError):
            call_command('seed_demo_user', stdout=StringIO())

        self.assertFalse(get_user_model().objects.filter(username='demo').exists())
