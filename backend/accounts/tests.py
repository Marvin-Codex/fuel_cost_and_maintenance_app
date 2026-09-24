from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


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
