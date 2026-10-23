"""Routing proxy — keeps OSRM calls same-origin and cacheable in production.

The web client used to call OSRM directly through the Vite dev proxy
(`/osm-route/...`), which does not exist in a production build. This view
forwards validated waypoint lists to an OSRM instance (configurable via
`OSRM_BASE_URL`, defaults to the public demo server) and caches the result.
"""
import hashlib
import json
import os
import urllib.error
import urllib.request

from django.core.cache import cache
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView


OSRM_BASE_URL = os.environ.get('OSRM_BASE_URL', 'https://router.project-osrm.org').rstrip('/')
CACHE_TTL = int(os.environ.get('OSRM_CACHE_TTL', '86400'))
UPSTREAM_TIMEOUT = float(os.environ.get('OSRM_TIMEOUT', '15'))


def _validate_coordinates(raw):
    """Return a normalised ``lng,lat;lng,lat`` string or raise ValueError."""
    if not raw or not isinstance(raw, str):
        raise ValueError('coordinates is required')
    parts = [p for p in raw.split(';') if p.strip()]
    if len(parts) < 2:
        raise ValueError('at least two waypoints are required')
    if len(parts) > 25:
        raise ValueError('too many waypoints (max 25)')
    normalised = []
    for part in parts:
        bits = part.split(',')
        if len(bits) != 2:
            raise ValueError('each waypoint must be "lng,lat"')
        try:
            lng = float(bits[0])
            lat = float(bits[1])
        except ValueError:
            raise ValueError('waypoint coordinates must be numeric')
        if not (-180.0 <= lng <= 180.0) or not (-90.0 <= lat <= 90.0):
            raise ValueError('waypoint out of range')
        normalised.append(f'{lng:.6f},{lat:.6f}')
    return ';'.join(normalised)


def fetch_osrm(coordinates, alternatives=False):
    """Perform the upstream OSRM request. Isolated for easy mocking in tests."""
    url = f'{OSRM_BASE_URL}/route/v1/driving/{coordinates}?overview=full&geometries=geojson'
    if alternatives:
        url += '&alternatives=true'
    req = urllib.request.Request(url, headers={'User-Agent': 'FuelMaintenance/1.0'})
    with urllib.request.urlopen(req, timeout=UPSTREAM_TIMEOUT) as resp:
        return resp.read(), resp.headers.get('Content-Type', 'application/json')


def _parse_alternatives(raw):
    return str(raw or '').strip().lower() in {'1', 'true', 'yes', 'on'}


class RouteView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'routing'

    def get(self, request):
        try:
            coordinates = _validate_coordinates(request.query_params.get('coordinates'))
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=400)

        alternatives = _parse_alternatives(request.query_params.get('alternatives'))

        cache_key = 'osrm:route:v2:' + hashlib.sha256(
            (coordinates + ('|alt' if alternatives else '')).encode()
        ).hexdigest()
        cached = cache.get(cache_key)
        if cached is not None:
            response = Response(cached)
            response['X-Cache'] = 'HIT'
            return response

        try:
            body, content_type = fetch_osrm(coordinates, alternatives=alternatives)
        except urllib.error.HTTPError as exc:
            return Response({'detail': f'upstream error: {exc.code}'}, status=502)
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            return Response({'detail': f'upstream unavailable: {exc}'}, status=504)
        except Exception as exc:  # pragma: no cover - defensive
            return Response({'detail': f'upstream failure: {exc}'}, status=502)

        try:
            data = json.loads(body.decode('utf-8'))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return Response({'detail': 'invalid upstream response'}, status=502)

        if not isinstance(data, dict) or data.get('code') not in (None, 'Ok'):
            # OSRM signals errors via `code`; only cache successful responses.
            return Response(data, status=502)

        cache.set(cache_key, data, CACHE_TTL)
        response = Response(data)
        response['X-Cache'] = 'MISS'
        return response
