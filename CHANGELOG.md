# Changelog

All notable changes to this project are documented in this file. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Every change
made to the project (web frontend, Flutter app, backend) is logged here with
the date, the component touched, the files involved, and how it was verified.

## [Unreleased]

### Added — Persisted fuel management (2026-10-11)

- **Backend purchase records** — `backend/fuel/models.py`,
  `serializers.py`, and `migrations/0002_fuelrecord_purchased_at_fuelrecord_receipt_reference.py`:
  added optional purchase timestamp and receipt reference, kept the existing
  date field and older records compatible, derive the purchase date from a
  supplied timestamp, and reject a conflicting date/timestamp. Server-
  calculated total cost, fuel type, station, full-tank marker, and odometer
  checks remain in place.
- **API routes** — `backend/fuel/urls.py` and `views.py`: retained
  `/api/v1/fuel-records/` and its existing summary route; added equivalent
  `/api/v1/fuel/`, `/api/v1/fuel/summary/`, and
  `/api/v1/fuel/efficiency/` endpoints. List and reports support vehicle,
  date-range, and fuel-type filters with invalid dates and reversed ranges
  rejected.
- **Purchase and consumption reporting** — summary reports distinguish fuel
  purchased and purchase spending from fuel consumed on trips. They include
  daily, weekly, monthly, year-to-date, and filtered purchase totals. The
  efficiency endpoint returns measured trip consumption and full-tank-to-full-
  tank refill efficiency, plus trip cost and best/average/worst measurements
  where available.
- **Estimates and alerts** — estimated remaining fuel starts from tank
  capacity at the latest full-tank purchase, adds later logged purchases, and
  subtracts recorded trip consumption. Estimated range uses measured trip
  economy. Both are unavailable with an explanatory reason when the necessary
  capacity, full-tank baseline, accessible trip records, or consistent
  consumption data is missing. Reports can flag low estimated fuel, a recent
  high-consumption trip, an unexpected efficiency drop, and inconsistent
  refueling/odometer data; no sensor readings are fabricated.
- **React Fuel screen** — `frontend/fuelmaintenance/src/api/fuel.js`,
  `src/pages/Fuel.jsx`, and `src/pages/Fuel.css`: replaced the sample level,
  purchase history, costs, consumption, alerts, and efficiency chart with
  authenticated purchase entry and saved history; server totals; daily/weekly/
  monthly expenditure; recorded trip fuel use and costs; measured trip
  efficiency trends; and API data-quality alerts. The purchase form captures
  date/time, odometer, litres, unit price, fuel type, station, receipt
  reference, and whether the tank was filled. Fuel purchases and trip fuel
  consumption are labeled separately.
- **Coverage and project notes** — `backend/fuel/tests.py` covers timestamped
  purchase creation, receipt references, timestamp/date consistency,
  expenditure periods, trip/refill efficiency, range estimation, and low-fuel
  and unusual-consumption alerts. `WEB_TODO.md` records the completed work and
  remaining Fuel UI items.
- **Verification** — all 13 focused fuel API tests passed, Django migration
  drift check reported no changes, focused frontend lint passed, and the React
  production build succeeded. The generated migration still needs to be
  applied to the deployment database.

### Added — Persisted trip management (2026-10-11)

- **Backend** — `backend/trips/models.py`, `serializers.py`, `views.py`,
  `migrations/0002_remove_trip_trip_end_after_start_and_more.py`, and
  `tests.py`: added open-trip creation that captures the selected vehicle's current
  odometer, and trip completion that derives distance from the ending and
  starting odometer readings. Completing a trip advances the vehicle to that
  same ending reading; manually entered distances without ending readings do
  not independently change the vehicle odometer.
- Added optional max-speed and driving-event fields, computed duration,
  average speed, fuel economy and server-calculated fuel cost, plus
  completed-trip summaries for today, this week, this month and all-time
  distance/count/average, including the trip with the most recorded fuel use.
- **API and React Trips screen** — added authenticated list, start, completion,
  date/vehicle filtering, and summary requests in
  `frontend/fuelmaintenance/src/api/trips.js` and wired them into
  `src/pages/Trips.jsx` and `src/pages/Trips.css`. Removed simulated route,
  telemetry, driving-event, and trip-history values from this screen.
- Added trip migration and API coverage for start/complete, derived distance,
  conflicting readings, odometer regression, filtering scopes and summaries.
- Verification: all 11 focused trip API tests passed; migration drift check
  reported no changes; React production build passed.

### Fixed — Fuel screen tank capacity (2026-10-11)

- Replaced the Fuel screen's hard-coded 60 L tank and 40 L fill calculation
  with the selected vehicle's saved tank capacity. Estimated litres remaining,
  range, and full-tank cost now derive from that value; if capacity is missing,
  dependent estimates are shown as unavailable rather than using a mismatched
  sample size.
- Kept the fuel percentage and consumption explicitly labeled as illustrative
  sample data.

### Fixed — Expired and mock web authentication (2026-10-11)

- Routed organization and vehicle API calls through one authenticated fetch
  helper, refreshes expired access tokens once using the stored refresh token,
  and redirects to sign-in when the refresh token is no longer valid.
- Vehicle saves now surface API and authentication failures and prevent
  duplicate submissions while a save is in progress.
- Mock-auth mode now reports that persistent vehicle operations require a
  backend sign-in instead of sending the mock token to Django.

### Added — Persistent vehicle management (2026-10-11)

- Expanded the vehicle API with engine capacity, transmission, tank capacity,
  operational status, case-insensitive registration validation, and monotonic
  odometer updates while retaining the existing `/api/v1/vehicles/` routes.
- Added `POST /api/v1/vehicles/{id}/activate/` and per-user persistent vehicle
  selection; dashboard summary requests now default to that selection and
  accept an explicit `vehicle` filter.
- Trip completion and fuel/maintenance odometer entries advance the vehicle's
  current reading. Vehicle deletion returns HTTP 409 when trip, fuel, or
  maintenance history is retained.
- Connected the React dashboard vehicle switcher, overview summary metrics,
  and System vehicle create/edit/delete form to the authenticated backend.
  Sensor readings and remaining detail panels remain marked as illustrative.
- Added backend coverage for complete vehicle specifications, duplicate
  registration, odometer progression, selection persistence, retained-history
  deletion, trip odometer updates, and selected-vehicle dashboard summaries.
- Verification: all 37 focused vehicle, trip, fuel, maintenance, and dashboard
  tests passed; `makemigrations --check --dry-run` reported no model drift.
  Editor diagnostics found no errors in the changed React files.

### Added — Vehicle-aware dashboard and tabs (React web)

- **Vehicle switcher** — `frontend/fuelmaintenance/src/pages/Dashboard.jsx`
  now switches among three sample vehicle profiles. The overview and Fuel,
  Services, Trips, and System views receive the selected vehicle's details and
  sample metrics.
- **Services view** — added `Services.jsx` and `Services.css` with service
  health, next-service estimates, cost summaries, upcoming maintenance,
  component status, service history, and a form to add a service record.
- **Trips view** — added `Trips.jsx` and `Trips.css` with simulated start/end
  controls, a static route illustration, trip history and comparison, and
  sample fuel/performance/driving-behaviour statistics.
- **System view** — added `System.jsx` and `System.css` with vehicle details
  editing, simulated connection status and diagnostics, alert/threshold
  controls, app preferences, and sample export/backup actions.
- These screens use sample data and local component state; they do not yet
  persist records or call the backend. GPS and sensor readings are not live.

### Added — Vehicle-management backend APIs

- Added fuel records and cost summaries, trip summary records and statistics,
  maintenance history and reminders, user preferences, dashboard summaries,
  and CSV export. The endpoints are mounted under `/api/v1/`:
  `/fuel-records/`, `/trips/`, `/maintenance-records/`,
  `/maintenance-reminders/`, `/system/preferences/`, `/system/export/`, and
  `/dashboard/summary/`.
- Added vehicle-scoped personal/organization access and role/plan permission
  checks, server-calculated fuel and trip costs, date/odometer reminder status,
  reminder completion, and CSV formula-cell escaping.
- Implemented the `fuel`, `trips`, `maintenance`, `preferences`, and `dashboard`
  apps plus shared vehicle-scoping/API helpers, account permission grants,
  migrations, and focused endpoint tests.
  There is no live sensor ingestion, GPS capture, GPS-point storage, or map
  routing API; trips are stored as journey summaries.
- Hardened `backend/accounts/management/commands/seed_demo_user.py`: it now
  prompts for a password without echo, checks confirmation and configured
  password validation, and never prints the password.
- Updated `WEB_TODO.md` to mark completed backend items and retain remaining
  work such as sync/offline support, GPS integration, and production operations.

### Verification and commit-safety audit

- Django system check passed; all 39 backend tests passed using an in-memory
  SQLite test configuration; `makemigrations --check --dry-run` reported no
  model changes without migrations.
- The new migrations have **not** been applied to PostgreSQL. Applying them
  through SQLite is blocked by the existing accounts migration that requires
  PostgreSQL for its primary-key conversion; verify migrations on a backed-up
  PostgreSQL staging database before deployment.
- Checked tracked paths and ignore rules: the local backend `.env`, virtual
  environment, SQLite database, and frontend `node_modules` are ignored rather
  than tracked. The committed `.env.example` contains placeholders only. No
  production credentials were identified in the tracked-file scan.
- Replaced the README's fixed local Docker database password with a generated
  per-run value so the documented setup does not normalize a shared password.

### Added — Telemetry tab (React web)

- **Telemetry view** — `frontend/fuelmaintenance/src/pages/Telemetry.jsx` and
  `Telemetry.css`: added a dedicated dashboard view for live engine monitoring
  (RPM, vehicle speed, engine load, coolant and intake temperature), engine
  health and diagnostics (check-engine status, DTCs and sensors), driving
  behaviour, alert monitoring, and trip performance/history.
- Added disconnected/waiting states so readings and trip data that require an
  OBD-II adapter or trip history are shown as unavailable instead of being
  presented as live measurements.
- Wired the dashboard's Telemetry bottom-navigation button to open the view;
  added a top back arrow to return to the dashboard overview in
  `frontend/fuelmaintenance/src/pages/Dashboard.jsx`.

### Added — Fuel tab (React web and Flutter)

- **React dashboard Fuel tab** — `frontend/fuelmaintenance/src/pages/Fuel.jsx`
  and `Fuel.css`: added a selectable Fuel view with a fuel-level gauge
  (68%, 40.8/60 L), estimated remaining range, current/average/best/worst
  consumption, cost and fuel-used summaries, and editable petrol price with a
  recalculated 40 L fill-cost estimate.
- Added selectable Today/7 days/30 days efficiency charts, simulated recent
  fill-up history with odometer readings, high-consumption/low-fuel alerts, and
  an efficiency-improved notice. Demo values are explicitly identified as
  sample data and not live vehicle readings.
- Wired the React dashboard's Fuel bottom-navigation button to the view and
  added a back arrow to return to the dashboard overview in
  `frontend/fuelmaintenance/src/pages/Dashboard.jsx`.
- **Flutter Fuel tab** — `lib/main.dart`: added Dashboard/Fuel navigation and
  the same core fuel-level, range, consumption, cost, editable price, efficiency
  chart, history, and alert experience using illustrative sample figures.
- Added `test/widget_test.dart` coverage for Fuel navigation, displayed fuel
  data, price-based fill-cost recalculation, and return navigation.

### Verification

- React `npm run lint` and `npm run build` — passed.
- Browser check — Fuel navigation, fill-cost recalculation, chart-period
  selection, and return-to-dashboard navigation verified.
- Flutter `flutter test` — passed.
- Flutter `flutter analyze` — no errors; reports three existing `withOpacity`
  deprecation infos in dashboard card styling.

## [2026-09-24]

### Added — Web frontend (React)

- **Login page** — `frontend/fuelmaintenance/src/pages/Login.jsx`: blue-themed
  sign-in screen titled **"Fuel cost and maintenance app"**, a centred white
  card over a blue gradient, username + password inputs with a show/hide
  password toggle, inline validation, a loading spinner while submitting, and a
  friendly error banner.
- **Reusable form** — `frontend/fuelmaintenance/src/components/LoginForm.jsx`.
- **Auth API client** — `frontend/fuelmaintenance/src/api/auth.js`: `login()`
  posts to the future Django endpoint `POST /api/v1/auth/login/`, stores JWT
  tokens in `localStorage` on success, and maps failures to readable messages
  (wrong credentials vs. server unreachable). The backend endpoint is not built
  yet, so a submit currently shows "Cannot reach server" (expected until
  backend Phase 1 ships).
- **Routing** — `frontend/fuelmaintenance/src/App.jsx` + `src/main.jsx`:
  `react-router-dom` `BrowserRouter` with `/login`; all other paths redirect to
  `/login`.
- **Global styles** — `frontend/fuelmaintenance/src/index.css`: reset + blue
  palette CSS variables shared across pages.
- **Page title** — `frontend/fuelmaintenance/index.html`: "Fuel cost and
  maintenance app".

### Changed — Web frontend

- Replaced the Vite counter demo (`src/App.jsx`) with the app shell/router.
- Removed Vite demo styling (`src/App.css`) and unused demo assets
  (`src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`,
  `public/icons.svg`).

### Verification

- `npm install` completed.
- `npm run lint` (oxlint) passes.
- `npm run build` (Vite production build) succeeds.
- Page renders as the blue login screen.

### Added — Backend (Django)

- **Neon Postgres connection** — `backend/.env` (gitignored) now holds the
  `DATABASE_URL` (Neon, `sslmode=require`), `SECRET_KEY` and `DEBUG`.
- **`backend/requirements.txt`** — added `dj-database-url==3.1.2` (required by
  README §6); the file already pinned the full stack (Django 6.1.1, DRF 3.18.1,
  SimpleJWT, drf-spectacular, django-cors-headers, psycopg2, plus the Phase-8 ML
  stack).
- **`backend/fuelmaintenance/fuelmaintenance/settings.py`** — loads `.env` via
  `python-dotenv` (checks both `backend/.env` and `backend/fuelmaintenance/.env`);
  `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` now read from the environment;
  `DATABASES` configured **per README §6**: Postgres via
  `dj_database_url.parse(DATABASE_URL, conn_max_age=600, ssl_require=True)` by
  default, explicit `USE_SQLITE=1` opt-in fallback, `RuntimeError` guard when
  neither is set. Removed the legacy `MAILERS` block; added
  `DEFAULT_AUTO_FIELD`.
- **`backend/.env.example`** — committed placeholder template (no secrets).

### Changed — Backend

- Created `backend/.venv` (virtualenv) and installed every pinned
  `requirements.txt` package into it (Django 6.1.1, DRF stack, psycopg2-binary,
  dj-database-url, python-dotenv, and the Phase-8 ML stack: numpy, pandas,
  scipy, scikit-learn, pillow, joblib, …).

### Verification

- `manage.py check` — no issues.
- `manage.py migrate --noinput` — all Django built-in migrations applied
  **directly to Neon** (`vendor: postgresql`, host `*.neon.tech`; 10 tables:
  `auth_*`, `django_*`).
- `pip check` — no broken requirements.
- Live smoke test: `manage.py runserver` → `/admin/login/` returned **HTTP 200**.
- No secrets were printed or committed; `backend/.env` stays gitignored.

### Repaired — Web frontend (React)

- Recreated the four app-glue files that were removed in the earlier session
  but never restored (interrupted by the mode switch):
  - `frontend/fuelmaintenance/index.html` — title/description "Fuel cost and
    maintenance app", `#root` + module entry.
  - `frontend/fuelmaintenance/src/main.jsx` — React entry wrapped in
    `react-router-dom` `BrowserRouter`.
  - `frontend/fuelmaintenance/src/App.jsx` — router shell: `/login` renders the
    login page, all other paths redirect to `/login`.
  - `frontend/fuelmaintenance/src/index.css` — global reset + shared blue
    palette CSS variables (`--fm-*`) used by `Login.css`.
- Installed dependencies (`npm install`) into `frontend/fuelmaintenance/node_modules`.

### Verification

- `npm run lint` (oxlint) — 0 warnings, 0 errors (6 files).
- `npm run build` (Vite production build) — success in 2.46s (28 modules;
  `dist/index.html` 0.64 kB, CSS 3.75 kB, JS 264.37 kB).
- Dev-server smoke test: `npm run dev` on `127.0.0.1:5173` → `/login` returned
  **HTTP 200** with the correct `<title>` and `#root`; `/src/main.jsx` served.

### Added — Backend foundation (Phase 1)

- **Repo layout** — restructured to the README §2 layout: `backend/manage.py` and
  the settings package directly at `backend/fuelmaintenance/`.
- **`accounts` app** — custom `User(AbstractUser)` (`AUTH_USER_MODEL`). JWT
  endpoints under `/api/v1/auth/`:
  - `POST /api/v1/auth/login/` — username/password → `{access, refresh, user}`
    (matches the web frontend `src/api/auth.js` contract).
  - `POST /api/v1/auth/refresh/` — SimpleJWT refresh.
  - `GET /api/v1/auth/me/` — current user.
- **`vehicles` app** — `Vehicle` model + ownership-scoped `ModelViewSet` at
  `/api/v1/vehicles/`: queryset filtered to `request.user` (another user's
  vehicle → 404), `owner` read-only in the serializer and set server-side in
  `perform_create`, unique `(owner, license_plate)` constraint, full CRUD.
- **`backend/fuelmaintenance/settings.py`** — DRF defaults (SimpleJWT auth,
  `IsAuthenticated`, `PageNumberPagination` page size 20, drf-spectacular
  `AutoSchema`); CORS for `http://localhost:5173` + `127.0.0.1:5173`; custom
  user model; `drf-spectacular` wired.
- **URLs** — OpenAPI schema (`GET /api/schema/`) and Swagger UI
  (`GET /api/docs/`) public from day one (build guide §3.1).
- **`seed_demo_user` management command** — creates or updates a local
  development demo account.
- **Migrations** — `accounts/0001_initial`, `vehicles/0001_initial` committed.
  Introducing the custom user model required a schema reset on Neon (fresh DB,
  no data loss) before re-migrating.

### Verification

- `manage.py check` — no issues.
- `manage.py migrate` — all 20 migrations applied to Neon (custom `user` +
  `vehicle` tables created).
- `python manage.py test accounts vehicles` (README §6 `USE_SQLITE=1` opt-in
  for the local run; Neon's test-db role is limited for serverless) — **9
  tests, all passed** (`Ran 9 tests … OK`).
- Live smoke test against `runserver` — **8/8 passed**: schema 200, login →
  JWT+user 200, wrong password 401, `/me` 200, vehicles list 200 (paginated,
  scoped), create 201 (owner set), bad token 401, CORS preflight
  `Access-Control-Allow-Origin: http://localhost:5173`.
  account as seed data.
