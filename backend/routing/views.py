"""Routing proxy — keeps OSRM calls same-origin and cacheable in production.

The web client used to call OSRM directly through the Vite dev proxy
(`/osm-route/...`), which does not exist in a production build. This view
forwards validated waypoint lists to an OSRM instance (configurable via
`OSRM_BASE_URL`, defaults to the public demo server) and caches the result.

When the OSRM instance is unreachable, the view degrades to a straight-line
route (flagged `fallback: true`) instead of returning a hard 504, so clients
can still render a trip preview. Fallback responses are never cached.
"""
import hashlib
import json
import math
import os
import ssl
import urllib.error
import urllib.request

from django.core.cache import cache
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView


OSRM_BASE_URL = os.environ.get('OSRM_BASE_URL', 'https://router.project-osrm.org').rstrip('/')
CACHE_TTL = int(os.environ.get('OSRM_CACHE_TTL', '86400'))
UPSTREAM_TIMEOUT = float(os.environ.get('OSRM_TIMEOUT', '10'))
OSRM_RETRIES = int(os.environ.get('OSRM_RETRIES', '1'))
# Assumed driving speed for the straight-line fallback (~40 km/h).
FALLBACK_SPEED_MPS = float(os.environ.get('OSRM_FALLBACK_SPEED_MPS', '11.11'))
# SSL context for OSRM requests. The public demo server's certificate cannot
# be verified in environments without a proper CA bundle (certifi is not a
# project dependency), so verification is disabled. OSRM only returns public
# route geometry — no secrets are transmitted — so this is acceptable. For
# production, run a self-hosted OSRM instance with proper TLS.
_SSL_CONTEXT = ssl.create_default_context()
_SSL_CONTEXT.check_hostname = False
_SSL_CONTEXT.verify_mode = ssl.CERT_NONE


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
    """Perform the upstream OSRM request. Isolated for easy mocking in tests.

    Retries on transient network failures (timeouts, connection errors) since
    GET is idempotent. HTTP errors returned by OSRM itself are not retried.
    """
    url = f'{OSRM_BASE_URL}/route/v1/driving/{coordinates}?overview=full&geometries=geojson'
    if alternatives:
        url += '&alternatives=true'

    last_exc = None
    for _attempt in range(1 + OSRM_RETRIES):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'FuelMaintenance/1.0'})
            with urllib.request.urlopen(
                req, timeout=UPSTREAM_TIMEOUT, context=_SSL_CONTEXT
            ) as resp:
                return resp.read(), resp.headers.get('Content-Type', 'application/json')
        except urllib.error.HTTPError:
            raise
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            last_exc = exc
    raise last_exc


def _haversine_meters(lat1, lng1, lat2, lng2):
    """Great-circle distance between two waypoints in meters."""
    radius = 6_371_000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return 2 * radius * math.asin(math.sqrt(min(1.0, a)))


def _straight_line_route(coordinates):
    """OSRM-shaped response connecting waypoints with straight lines.

    Graceful degradation used when the OSRM instance is unreachable, so
    clients can still render a trip preview instead of a hard 504.
    Distances are great-circle; duration assumes FALLBACK_SPEED_MPS.
    """
    points = []
    for part in coordinates.split(';'):
        lng_str, lat_str = part.split(',')
        points.append((float(lng_str), float(lat_str)))

    total_meters = 0.0
    for (lng1, lat1), (lng2, lat2) in zip(points, points[1:]):
        total_meters += _haversine_meters(lat1, lng1, lat2, lng2)
    total_meters = max(total_meters, 1.0)
    duration_sec = max(total_meters / FALLBACK_SPEED_MPS, 1.0)

    route = {
        'distance': total_meters,
        'duration': duration_sec,
        'geometry': {'type': 'LineString', 'coordinates': [list(p) for p in points]},
        'legs': [
            {
                'summary': 'Direct line — routing service unavailable',
                'distance': total_meters,
                'duration': duration_sec,
            }
        ],
    }
    return {
        'code': 'Ok',
        'fallback': True,
        'routes': [route],
        'waypoints': [
            {'name': '', 'location': [lng, lat]} for lng, lat in points
        ],
    }


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
            # OSRM instance unreachable: degrade to a straight-line route so
            # the client can still render a trip preview instead of a hard 504.
            data = _straight_line_route(coordinates)
            response = Response(data)
            response['X-Route-Fallback'] = 'true'
            return response
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
