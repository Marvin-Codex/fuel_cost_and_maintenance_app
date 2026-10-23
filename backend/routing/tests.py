"""Tests for the same-origin OSRM routing proxy."""
import json
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

User = get_user_model()

ROUTE_URL = '/api/v1/route/'


class RoutingProxyTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('router', password='x')
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        cache.clear()

    def test_requires_auth(self):
        anon = APIClient()
        res = anon.get(ROUTE_URL, {'coordinates': '32.5,0.3;32.6,0.4'})
        self.assertEqual(res.status_code, 401)

    def test_missing_coordinates_returns_400(self):
        res = self.client.get(ROUTE_URL)
        self.assertEqual(res.status_code, 400)

    def test_invalid_coordinates_returns_400(self):
        res = self.client.get(ROUTE_URL, {'coordinates': 'not-a-point;32.6,0.4'})
        self.assertEqual(res.status_code, 400)
        res = self.client.get(ROUTE_URL, {'coordinates': '32.5,0.3'})
        self.assertEqual(res.status_code, 400)
        res = self.client.get(ROUTE_URL, {'coordinates': '999,0;1,2'})
        self.assertEqual(res.status_code, 400)

    def test_too_many_waypoints_returns_400(self):
        coords = ';'.join(f'{i},{i}' for i in range(30))
        res = self.client.get(ROUTE_URL, {'coordinates': coords})
        self.assertEqual(res.status_code, 400)

    @mock.patch('routing.views.fetch_osrm')
    def test_success_caches_and_returns_geometry(self, fetch_mock):
        payload = {
            'code': 'Ok',
            'routes': [{'geometry': {'coordinates': [[32.5, 0.3], [32.6, 0.4]]}}],
        }
        fetch_mock.return_value = (json.dumps(payload).encode(), 'application/json')
        coords = '32.5,0.3;32.6,0.4'
        res = self.client.get(ROUTE_URL, {'coordinates': coords})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['code'], 'Ok')
        self.assertEqual(res['X-Cache'], 'MISS')
        fetch_mock.assert_called_once()

        # Second call should be served from cache without hitting upstream.
        res2 = self.client.get(ROUTE_URL, {'coordinates': coords})
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2['X-Cache'], 'HIT')
        self.assertEqual(fetch_mock.call_count, 1)

    @mock.patch('routing.views.fetch_osrm')
    def test_upstream_http_error_returns_502(self, fetch_mock):
        import urllib.error
        fetch_mock.side_effect = urllib.error.HTTPError(
            'url', 500, 'boom', {}, None
        )
        res = self.client.get(ROUTE_URL, {'coordinates': '32.5,0.3;32.6,0.4'})
        self.assertEqual(res.status_code, 502)

    @mock.patch('routing.views.fetch_osrm')
    def test_upstream_unavailable_returns_504(self, fetch_mock):
        import urllib.error
        fetch_mock.side_effect = urllib.error.URLError('down')
        res = self.client.get(ROUTE_URL, {'coordinates': '32.5,0.3;32.6,0.4'})
        self.assertEqual(res.status_code, 504)

    @mock.patch('routing.views.fetch_osrm')
    def test_osrm_error_code_not_cached(self, fetch_mock):
        payload = {'code': 'NoRoute', 'routes': []}
        fetch_mock.return_value = (json.dumps(payload).encode(), 'application/json')
        res = self.client.get(ROUTE_URL, {'coordinates': '32.5,0.3;32.6,0.4'})
        self.assertEqual(res.status_code, 502)
        # ensure not cached: a subsequent successful response is a MISS
        fetch_mock.return_value = (
            json.dumps({'code': 'Ok', 'routes': [{'geometry': {'coordinates': [[1, 2], [3, 4]]}}]}).encode(),
            'application/json',
        )
        res2 = self.client.get(ROUTE_URL, {'coordinates': '32.5,0.3;32.6,0.4'})
        self.assertEqual(res2['X-Cache'], 'MISS')
