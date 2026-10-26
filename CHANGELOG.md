# Changelog

This file summarizes notable changes to the web client, Flutter app, and
backend. Entries are grouped by product area so implemented features and
remaining limitations are clear.

## [Unreleased] — system snapshot (2026-10-23)

<<<<<<< HEAD
### Added — Android AVD for Flutter widget testing (batch-file method)
- Created AVD config manually at `C:\Users\Marvin\AppData\Roaming\.android\avd\test_avd\config.ini`
- AVD targets API 35 with `system-images;android-35;default;arm64-v8a` package
- Manual config creation required due to `avdmanager create avd` shell argument parsing bug with semicolons in paths
- All system images confirmed installed via `sdkmanager --list`
- AVD config file contents: `avd.name=test_avd`, `package.id=system-images;android-35;default;arm64-v8a`, `target=android-35`, `abi=arm64-v8a`, `revision=2`
- Emulator binary extraction from SDK has been problematic; manual AVD config created as intermediate step

### Added — SDK and AVD infrastructure setup
- Android SDK confirmed at `C:\Android\Sdk` with android-35 platform and system images
- System images verified installed (Google APIs, default ARM64 & x86_64)
- AVD config directory (`%APPDATA%\.android\avd`) created manually
- Emulator executable location verified in SDK directory
- Multiple batch file attempts documented (`create_avd.bat` through `create_avd7.bat`)

### Blocked — avdmanager command fails
- `avdmanager create avd` fails with "Package path is not valid" error
- Semicolon-separated paths and backslash-separated paths both fail in shell
- Manual AVD config workaround implemented as alternative
=======
### Accounts, workspaces, and permissions
>>>>>>> bdffdfbf98becf4c85ac74d478b1271afb924b4b

- Added JWT registration, login, token refresh, and current-user endpoints.
  Registration supports personal accounts, joining an existing organization,
  and creating an organization with an active plan.
- Added personal, group, and organization workspaces; memberships, roles,
  permission checks, seeded plans, feature entitlements, usage limits, and
  workspace-level overrides.
- Added an access snapshot endpoint and active-workspace selection. Resource
  requests are scoped to the selected workspace and permissions are checked by
  the backend; the web client sends the active workspace in `X-Workspace`.
- Added public plan and organization lists for registration and live plan cards
  on the landing page.

### Vehicle management and dashboard

- Added workspace-scoped vehicle CRUD with specifications, operational status,
  persistent active-vehicle selection, registration-number validation, and
  odometer progression checks.
- Prevented deleting vehicles that have fuel, trip, or maintenance history.
- Connected the web dashboard and vehicle settings to vehicle records and
  server-calculated dashboard summaries. Fuel, Services, Trips, and System
  screens use the selected vehicle and persisted API data where supported.

### Fuel records and reporting

- Added authenticated fuel-purchase records, including purchase date/time,
  odometer, quantity, unit price, fuel type, station, receipt reference, and
  full-tank status. The backend calculates totals and validates odometer
  progression.
- Added filtered purchase and expenditure summaries, trip fuel consumption,
  measured trip/refill efficiency, and data-backed fuel/range estimates.
  Estimates are unavailable with an explanation when the records needed to
  calculate them are missing or inconsistent.
- Replaced sample purchase history and cost figures in the web Fuel screen
  with saved records and server reports. Remaining sample indicators are
  identified as illustrative rather than live vehicle readings.

### Trips, routing, and maintenance

- Added persisted trip summaries with start/completion workflows, odometer-
  derived distance, vehicle updates, calculated duration and fuel cost, and
  vehicle/date-filtered history and summaries.
- Added a web route planner using location search, map selection, and a
  same-origin routing endpoint. It estimates route distance, duration, fuel,
  and cost; planning a route does not record a trip.
- Added local GPS trip capture in the Flutter app. GPS points are not stored by
  the backend or uploaded as a route.
- Added maintenance records and reminders, including service history, costs,
  due/overdue status, and reminder completion.

### Preferences, export, and platform administration

- Added per-user system preferences and CSV export of records the user can
  access.
- Added protected superadmin management screens and APIs for plans, users,
  workspaces, memberships, and vehicle presets. Roles are available as a
  read-only reference, and workspace entitlement grants/revocations and limit
  overrides can be managed.
- Added light, dark, and system theme options and responsive navigation for
  the web client.

### Flutter app and local data

- Added persistent local storage for vehicles, fuel, trips, and maintenance,
  plus workspace access handling and a sync service for exchanging supported
  records with the backend.
- Added native GPS trip tracking and local trip history. The current sync
  service does not provide a complete conflict-resolution, idempotency, or
  retry-management protocol.

### Known limitations

- The web client does not yet queue offline record changes or expose complete
  offline synchronization status. The Flutter app has local persistence and
  basic synchronization, but not the full conflict-safe sync workflow.
- GPS point storage and ingestion are not implemented in the backend. Web trip
  planning provides route estimates only; it does not provide live trip
  tracking.
- OBD-II sensor readings and live diagnostics are not connected. The Telemetry
  screen indicates unavailable/disconnected data rather than representing
  sample values as live.
- Superadmin audit-history and support-access workflows are not implemented.
  Some superadmin overview metrics and controls remain illustrative.
- Billing-provider integration, invitation workflows, and production
  deployment/operations are not complete.

### Verification

- Focused Django vehicle, dashboard, and fuel tests passed (31 tests), and the
  migration drift check reported no model changes without migrations.
- The React production build passed. Frontend lint completed with warnings but
  no errors.

## [2026-09-24] — initial project foundation

### Added

- Created the initial React web app shell with public login and routing, and
  the Django backend foundation with a custom user model, JWT authentication,
  vehicle CRUD, environment-based configuration, and API schema/documentation
  endpoints.
- Added initial backend checks, migrations, and authentication/vehicle tests.
