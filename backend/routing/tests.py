"""Tests for the same-origin OSRM routing proxy."""
import json
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

import routing.views as views
import urllib.error

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

    def _mock_urlopen_response(self, payload):
        resp = mock.Mock()
        resp.read.return_value = json.dumps(payload).encode()
        resp.headers.get.return_value = 'application/json'
        cm = mock.MagicMock()
        cm.__enter__.return_value = resp
        return cm

    @mock.patch('routing.views.urllib.request.urlopen')
    def test_upstream_unavailable_returns_fallback_route(self, urlopen_mock):
        urlopen_mock.side_effect = urllib.error.URLError('down')
        res = self.client.get(ROUTE_URL, {'coordinates': '32.5,0.3;32.6,0.4'})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data['fallback'])
        self.assertEqual(res['X-Route-Fallback'], 'true')
        self.assertNotIn('X-Cache', res)
        routes = data['routes']
        self.assertEqual(len(routes), 1)
        self.assertEqual(routes[0]['geometry']['coordinates'], [[32.5, 0.3], [32.6, 0.4]])
        # One attempt plus the default retry.
        self.assertEqual(urlopen_mock.call_count, 2)

    @mock.patch('routing.views.urllib.request.urlopen')
    def test_transient_failure_retries_then_succeeds(self, urlopen_mock):
        payload = {
            'code': 'Ok',
            'routes': [{'geometry': {'coordinates': [[32.5, 0.3], [32.6, 0.4]]}}],
        }
        attempts = {'n': 0}

        def fake_urlopen(*args, **kwargs):
            attempts['n'] += 1
            if attempts['n'] == 1:
                raise urllib.error.URLError('blip')
            return self._mock_urlopen_response(payload)

        urlopen_mock.side_effect = fake_urlopen
        res = self.client.get(ROUTE_URL, {'coordinates': '32.5,0.3;32.6,0.4'})
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.json().get('fallback'))
        self.assertEqual(urlopen_mock.call_count, 2)

    @mock.patch('routing.views.urllib.request.urlopen')
    def test_repeated_failure_returns_fallback(self, urlopen_mock):
        urlopen_mock.side_effect = urllib.error.URLError('down')
        res = self.client.get(ROUTE_URL, {'coordinates': '32.5,0.3;32.6,0.4'})
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()['fallback'])
        # One initial attempt plus OSRM_RETRIES (default 1) retry.
        self.assertEqual(urlopen_mock.call_count, 2)

    @mock.patch('routing.views.urllib.request.urlopen')
    def test_fallback_not_cached(self, urlopen_mock):
        urlopen_mock.side_effect = urllib.error.URLError('down')
        res1 = self.client.get(ROUTE_URL, {'coordinates': '32.5,0.3;32.6,0.4'})
        res2 = self.client.get(ROUTE_URL, {'coordinates': '32.5,0.3;32.6,0.4'})
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res2.status_code, 200)
        # Fallback is never cached: upstream is attempted on every request.
        self.assertEqual(urlopen_mock.call_count, 4)

    def test_straight_line_fallback_distance(self):
        data = views._straight_line_route('32.5,0.3;32.6,0.4')
        self.assertEqual(data['code'], 'Ok')
        self.assertTrue(data['fallback'])
        route = data['routes'][0]
        # ~15.7 km great-circle between the two waypoints.
        self.assertGreater(route['distance'], 15000)
        self.assertLess(route['distance'], 17000)
        self.assertGreater(route['duration'], 0)
        self.assertEqual(
            route['geometry']['coordinates'], [[32.5, 0.3], [32.6, 0.4]]
        )
        self.assertEqual(
            data['waypoints'], [{'name': '', 'location': [32.5, 0.3]}, {'name': '', 'location': [32.6, 0.4]}]
        )

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
