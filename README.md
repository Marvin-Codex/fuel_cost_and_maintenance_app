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

**Offline-first is a hard requirement for every client, not just Flutter.** Users must be able to open the app, record fuel/trips/maintenance, and view their own data with zero network connectivity — on the React web app included. All calculations (fuel cost, consumption, reminders, predictions) still happen server-side whenever a network call is possible, and both clients defer to the server as the source of truth once synced; but writing a record must never require the network to succeed locally, on any client. GPS trip *capture* is the one exception — it stays mobile/native-only (see Build order, step 7); the web app can display synced trip history offline but does not record new GPS trips.

## 2. Repository layout

Everything lives inside the single Flutter project root (`fuel_cost_and_maintenance_app/`), which also holds the Android/iOS/macOS/Windows/Linux native targets. `backend/` and `frontend/` sit as siblings of `lib/` inside that same root — not as separate top-level repos.

```
fuel_cost_and_maintenance_app/        # repo root — also the Flutter project root
├── android/
├── ios/
├── macos/
├── windows/
├── linux/
├── web/                              
│                                   the real web app is frontend fuelmaintenance
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
4. **React web app, online-only first** — auth flow, vehicle management, fuel/maintenance CRUD, dashboard with charts. Fastest way to exercise the API end-to-end before adding offline complexity.
5. **React offline layer (PWA)** — `vite-plugin-pwa` for the service worker/app-shell caching, IndexedDB (`dexie`) mirroring the API resources, local writes queued and flushed via `POST /api/v1/sync/` on reconnect. Same sync-queue shape as Flutter (step 6) — build them from the same contract.
6. **Flutter app, online-only first** — same CRUD flows against the live API, no offline/sync yet. Validates the API from a third client (native).
7. **Flutter offline layer** — local SQLite schema mirroring the API resources, sync queue, background sync service.
8. **GPS trip tracking (Flutter only)** — foreground location tracking, point filtering (5–10s or 10–20m, whichever first), route/distance calculation on-device with server reconciliation.
9. **Maps / service centre discovery** — Leaflet on web, flutter_map or google_maps_flutter (OSM tiles) on native; OSRM for routing. Cache the user's last-known nearby results locally so this degrades gracefully offline instead of showing a blank map.
10. **ML service** — start once there's real trip/fuel data to train on. Build as a separate Python module the Django backend calls into (in-process import or a small internal service), not a rewrite of Django.
11. **Fuel efficiency alerts + personalized reminders + forecasting** — layer on top of steps 2–10 once predictions are producing sane output.

## 4. API conventions

- Base path: `/api/v1/`.
- Every endpoint requires auth; querysets are always scoped to `request.user`'s own vehicles — never trust a client-supplied vehicle ID without an ownership check.
- Use DRF `ModelViewSet` + routers for standard CRUD; keep calculation logic (consumption, cost, reminders) in `services.py` per app, not in views or serializers, so both the API and any management commands can call it.
- Standard pagination (`PageNumberPagination`) on all list endpoints.
- Batch endpoint for GPS points: `POST /api/v1/trips/{id}/gps-points/batch/` — never one request per point.
- Sync endpoint accepts a list of `{record_type, client_id, payload}` and returns per-item success/failure plus the server ID, so any client's local sync queue (Flutter/SQLite or React/IndexedDB) can reconcile against it.

## 5. Data model source of truth

Django models are the canonical schema. React and Flutter each maintain their own typed models that mirror the API's serialized shape — regenerate/update them whenever a serializer changes. Core entities: `User`, `Vehicle`, `Trip`, `GPSPoint`, `FuelRecord`, `MaintenanceRecord`, `MaintenanceType`, `FuelPrice`, `ServiceCentre`, `Prediction`, `SyncQueueItem` (client-local only — one instance in Flutter/SQLite, one in React/IndexedDB — not a server model).

## 6. Environment setup

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
createdb vehicle_fuel_db   # requires PostGIS extension enabled
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

## 7. Conventions for the AI agent

- Don't introduce a new package/library for something Django, DRF, React, or Flutter already does natively — check before adding a dependency.
- Write the server-side calculation once; both clients call the API for it. Only duplicate logic client-side for the offline case (Flutter/SQLite or React/IndexedDB), and comment clearly why (`// duplicated for offline use — keep in sync with backend/fuel/services.py:calc_consumption`).
- Every new model needs a migration committed alongside it — never hand-edit a migration.
- Every new API endpoint needs at minimum one DRF test (happy path + ownership check).
- Keep GPS/location permission handling and battery-conscious sampling in one place (`services/gps_service.dart`) — don't scatter `Geolocator` calls across screens.
- Treat "works with no network" as a testable requirement, not a nice-to-have: for every new screen/feature on Flutter or React, check it against airplane mode before calling it done.
- No secrets in code — `.env` files for both `backend/` and `frontend/fuelmaintenance/`, `flutter_dotenv` or `--dart-define` for the Flutter app.

## 8. Out of scope for v1

Deep learning models, payment integration, multi-user fleet management, iOS build (Android only per current scope).


dart run build_runner build --delete-conflicting-outputs