# Vehicle Fuel & Maintenance Management System — Build Guide

This README is written for an AI coding agent (or a developer) picking up this repo. It defines the stack, repo layout, build order, and conventions to follow. Full requirements live in `docs/SRS_SDD.docx` (or wherever that file is placed) — this document is the *execution plan*, not the spec.

## 1. Stack

| Layer | Technology |
|---|---|
| Native apps (Android/iOS/macOS/Windows/Linux) | Flutter (Dart), SQLite (via `drift` or `sqflite`), offline-first |
| Web frontend | React (Vite), PWA (service worker + IndexedDB via `dexie`/`idb`), offline-first |
| Backend / API | Django + Django REST Framework |
| Database | PostgreSQL + PostGIS |
| ML service | Python, Pandas, NumPy, Scikit-learn |
| Maps/routing | OpenStreetMap, Leaflet (web) / flutter_map (native), OSRM or GraphHopper |

**Offline-first is a hard requirement for every client, not just Flutter.** Users must be able to open the app, record fuel/trips/maintenance, and view their own data with zero network connectivity — on the React web app included. All calculations (fuel cost, consumption, reminders, predictions) still happen server-side whenever a network call is possible, and both clients defer to the server as the source of truth once synced; but writing a record must never require the network to succeed locally, on any client. GPS trip *capture* is the one exception — it stays mobile/native-only (see Build order); the web app can display synced trip history offline but does not record new GPS trips.

## 2. Repository layout

Everything lives inside the single Flutter project root (`fuel_cost_and_maintenance_app/`), which also holds the Android/iOS/macOS/Windows/Linux native targets. `backend/` and `frontend/` sit as siblings of `lib/` inside that same root — not as separate top-level repos.

```
fuel_cost_and_maintenance_app/        # repo root — also the Flutter project root
├── android/
├── ios/
├── macos/
├── windows/
├── linux/
├── web/                              # ⚠ stray Flutter-web scaffold — delete this;
│                                        the real web app is frontend/fuelmaintenance
├── lib/                              # Flutter app source
│   ├── core/                          # constants, theme, routing, utils
│   ├── models/                         # Vehicle, Trip, FuelRecord, Maintenance
│   ├── services/                        # gps_service, fuel_service, maintenance_service, api_service, sync_service
│   ├── database/                         # local_database (SQLite)
│   ├── screens/                           # dashboard, vehicles, trips, fuel, maintenance, settings
│   └── widgets/
├── test/
├── backend/                          # Django project
│   ├── .venv/
│   ├── fuelmaintenance/                # settings, urls, wsgi/asgi (django-admin project package)
│   ├── accounts/                        # auth, users
│   ├── vehicles/                         # Vehicle app
│   ├── fuel/                              # Fuel records
│   ├── trips/                              # Trips + GPS points
│   ├── maintenance/                         # Maintenance records, reminders
│   ├── servicecentres/                       # PostGIS-backed service centre search
│   ├── ml/                                    # prediction service, model training scripts
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   └── fuelmaintenance/               # React app (Vite)
│       ├── src/
│       │   ├── api/                    # typed API client (one file per resource)
│       │   ├── pages/                    # dashboard, vehicles, fuel, trips, maintenance, settings
│       │   ├── components/
│       │   └── hooks/
│       ├── public/
│       ├── index.html
│       └── package.json
├── docs/
│   └── SRS_SDD.docx
├── pubspec.yaml
└── README.md                         # this file
```

**Note:** nesting `backend/` and `frontend/` inside the Flutter project root works, but means `.gitignore` needs to cover three ecosystems' build artifacts from one root (`.venv/`, `node_modules/`, `.dart_tool/`, `build/`), and your IDE will show Dart, Python, and JS files all mixed in the same Explorer tree. If that gets noisy, consider opening `backend/` and `frontend/fuelmaintenance/` as separate VS Code workspaces/windows day-to-day, even though they physically live under the same repo root.

## 3. Build order

Work top to bottom — each phase should be runnable and demoable before starting the next.

1. **Backend foundation** — Django project, Postgres+PostGIS, custom user model, token auth (DRF `TokenAuthentication` or SimpleJWT), `vehicles` app with full CRUD, OpenAPI schema (drf-spectacular) from day one so both clients can codegen/reference it. Design the sync endpoint contract now (step below) — both clients will build against it.
2. **Fuel + Maintenance APIs** — CRUD endpoints, server-side consumption/cost calculations, maintenance reminder computation.
3. **Trips + GPS APIs** — trip CRUD, batch GPS point ingestion endpoint (mobile will upload points in batches, not one at a time), distance/duration calculation.
4. **React app, CRUD + offline layer together** — auth flow, vehicle/fuel/maintenance CRUD, dashboard with charts, built directly on top of the offline layer: `vite-plugin-pwa` for service worker/app-shell caching, IndexedDB (`dexie`) mirroring the API resources, local writes queued and flushed via `POST /api/v1/sync/` on reconnect. Every screen is offline-capable from the first commit — there is no online-only intermediate version.
5. **Flutter app, CRUD + offline layer together** — same principle: local Drift/SQLite schema mirroring the API resources and the sync queue are part of the app from day one, not bolted on after. A screen isn't "done" until it works in airplane mode.
6. **GPS trip tracking (Flutter only)** — foreground location tracking, point filtering (5–10s or 10–20m, whichever first), route/distance calculation on-device with server reconciliation. Naturally offline already, since it's local-first by nature.
7. **Maps / service centre discovery** — Leaflet on web, flutter_map or google_maps_flutter (OSM tiles) on native; OSRM for routing. Cache the user's last-known nearby results locally so this degrades gracefully offline instead of showing a blank map.
8. **ML service** — start once there's real trip/fuel data to train on. Build as a separate Python module the Django backend calls into (in-process import or a small internal service), not a rewrite of Django.
9. **Fuel efficiency alerts + personalized reminders + forecasting** — layer on top of steps 2–8 once predictions are producing sane output.

## 4. API conventions

- Base path: `/api/v1/`.
- Every endpoint requires auth; querysets are always scoped to `request.user`'s own vehicles — never trust a client-supplied vehicle ID without an ownership check.
- Use DRF `ModelViewSet` + routers for standard CRUD; keep calculation logic (consumption, cost, reminders) in `services.py` per app, not in views or serializers, so both the API and any management commands can call it.
- Standard pagination (`PageNumberPagination`) on all list endpoints.
- Batch endpoint for GPS points: `POST /api/v1/trips/{id}/gps-points/batch/` — never one request per point.
- Sync endpoint accepts a list of `{record_type, client_id, payload}` and returns per-item success/failure plus the server ID, so any client's local sync queue (Flutter/SQLite or React/IndexedDB) can reconcile against it.

## 5. Data model source of truth

Django models are the canonical schema. React and Flutter each maintain their own typed models that mirror the API's serialized shape — regenerate/update them whenever a serializer changes. Core entities: `User`, `Vehicle`, `Trip`, `GPSPoint`, `FuelRecord`, `MaintenanceRecord`, `MaintenanceType`, `FuelPrice`, `ServiceCentre`, `Prediction`, `SyncQueueItem` (client-local only — one instance in Flutter/SQLite, one in React/IndexedDB — not a server model).

## 6. Database configuration

**PostgreSQL (+ PostGIS) is the default, including locally in development** — via `DATABASE_URL`. SQLite is available only as an explicit opt-in fallback (e.g. a quick sanity check with no Postgres running), not the default. Install `dj-database-url`:

```bash
python -m pip install dj-database-url
```

`config/settings.py`:

```python
import dj_database_url
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_URL = os.environ.get("DATABASE_URL")
USE_SQLITE = os.environ.get("USE_SQLITE") == "1"   # explicit opt-in only

if USE_SQLITE:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
elif DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(DATABASE_URL, conn_max_age=600, ssl_require=True)
    }
else:
    raise RuntimeError(
        "DATABASE_URL is not set. Set it to your local Postgres instance "
        "(see README §'Run Postgres locally'), or set USE_SQLITE=1 to fall back to SQLite."
    )
```

`.env` (never committed) — local dev, pointing at a Postgres instance you're running on your machine:

```
DATABASE_URL=postgresql://localhost:5432/vehicle_fuel_db
```

`.env` — staging/production (e.g. Neon):

```
DATABASE_URL=postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require
```

**Local Postgres setup (macOS/Homebrew):**

```bash
brew install postgresql@16
brew services start postgresql@16
createdb vehicle_fuel_db
psql vehicle_fuel_db -c "CREATE EXTENSION postgis;"
```

Docker is a solid alternative if you'd rather not manage a Homebrew service — `postgis/postgis` images bundle Postgres+PostGIS together:

```bash
docker run --name vehicle-fuel-pg -e POSTGRES_PASSWORD=devpass -e POSTGRES_DB=vehicle_fuel_db -p 5432:5432 -d postgis/postgis:16-3.4
```

**Caveats:**
- Making Postgres the default means every dev (including your future self on a fresh machine) needs Postgres running before `manage.py runserver` will even start — that's intentional here, since it keeps dev and prod on the same engine and avoids SQLite/PostGIS gaps entirely, but note it in your setup docs for anyone else touching the repo.
- Neon requires `sslmode=require` (included above), uses connection pooling by default (its pooled connection string works fine with Django), and free-tier databases auto-suspend after inactivity — first request after idle is slightly slower while it wakes up.
- Add `.env` to `.gitignore` if it isn't already; commit a `.env.example` with a placeholder `DATABASE_URL` instead.

## 7. Environment setup

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# ensure Postgres is running and DATABASE_URL is set in .env (see §6)
python manage.py migrate
python manage.py runserver
```

**Frontend (React)**
```bash
cd frontend/fuelmaintenance
npm install
npm run dev
```

**Flutter (Android / iOS / macOS / Windows / Linux)**
```bash
# from the repo root — pubspec.yaml lives here
flutter pub get
flutter run                 # pick target device/platform when prompted
```

## 8. Conventions for the AI agent

- Don't introduce a new package/library for something Django, DRF, React, or Flutter already does natively — check before adding a dependency.
- Write the server-side calculation once; both clients call the API for it. Only duplicate logic client-side for the offline case (Flutter/SQLite or React/IndexedDB), and comment clearly why (`// duplicated for offline use — keep in sync with backend/fuel/services.py:calc_consumption`).
- Every new model needs a migration committed alongside it — never hand-edit a migration.
- Every new API endpoint needs at minimum one DRF test (happy path + ownership check).
- Keep GPS/location permission handling and battery-conscious sampling in one place (`services/gps_service.dart`) — don't scatter `Geolocator` calls across screens.
- Treat "works with no network" as a testable requirement, not a nice-to-have: for every new screen/feature on Flutter or React, check it against airplane mode before calling it done.
- No secrets in code — `.env` files for both `backend/` and `frontend/fuelmaintenance/`, `flutter_dotenv` or `--dart-define` for the Flutter app.

## 9. Out of scope for v1

Deep learning models, payment integration, multi-user fleet management, iOS build (Android only per current scope).

dart run build_runner build --delete-conflicting-outputs