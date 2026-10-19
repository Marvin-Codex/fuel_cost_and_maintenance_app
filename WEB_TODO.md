# SaaS Web Platform TODO

This checklist positions FuelMaintenance as a scalable, multi-tenant SaaS from day one. The platform must support individual users, growing fleets, business teams, and high request/data volumes without redesigning the core architecture. Tenant data isolation, security, observability, reliability, and predictable operating costs are core requirements.

The React web client should remain offline-first: users must be able to view cached data and record changes without a network connection, then synchronize when connectivity returns.

## 1. SaaS foundation and tenancy

- [x] Introduce workspace, membership, role, permission, and plan models. Workspaces cover personal, group, and organization accounts.
- [x] Scope the migrated vehicle, fuel, trip, maintenance, dashboard, and preference APIs by active workspace and permissions.
- [x] Add workspace-aware permission resolution, Django admin tooling, access snapshots, and cross-workspace ownership checks for the implemented APIs.
- [ ] Support invitations, team membership management, role changes, deactivation, and audit history.
- [x] Define seeded subscription plans, feature entitlements, usage limits, and workspace overrides.
- [ ] Add billing-provider integration with webhook verification and subscription state reconciliation.
- [ ] Add tenant settings for locale, currency, units, time zone, retention, and notification preferences.
- [ ] Define data export, account deletion, retention, and tenant offboarding workflows.

### Superadmin dashboard

- [x] Add the `/super-admin` React route and platform-superuser-only dashboard branch.
- [x] Add responsive superadmin navigation and light/dark/system theme support.
- [x] Add frontend access snapshot caching and workspace context switching.
- [ ] Replace sample superadmin metrics and controls with protected API-backed platform summaries.
- [x] Build React management screens for plans (all fields), roles (read-only reference), workspaces (package + overrides), memberships (pickers), and vehicle presets (all fields); superadmin API endpoints `super-workspaces/`, `superadmin/permissions/`, `super-roles/`.
- [ ] Build React management screens for audit history and support workspace access.
- [ ] Add frontend tests for superadmin authorization, management workflows, and light-mode rendering.

## 2. Backend / Django API

### Authentication and users

- [x] Registration endpoint: `POST /api/v1/auth/register/`
- [x] JWT login, refresh, and current-user endpoints.
- [ ] Add password reset/change and account profile endpoints.
- [ ] Add rate limiting, secure production token handling, and authentication error logging.
- [ ] Confirm permissions and ownership checks for every user-owned resource.

### Vehicles

- [x] Vehicle model and ownership-scoped CRUD API.
- [ ] Add filtering, searching, sorting, and active/inactive vehicle support.
- [ ] Validate odometer values, VIN, license plates, and duplicate records.
- [ ] Complete CRUD, validation, and permission tests.

### Fuel records

- [x] Create fuel-record model, migrations, serializer, viewset, and URLs.
- [x] Support date, vehicle, odometer, quantity, unit price, total cost, fuel type, station, and notes.
- [x] Validate odometer progression and calculate fuel cost on the server.
- [x] Add date-range and vehicle-filtered summaries for fuel cost and volume.
- [ ] Add distance and consumption calculations to fuel summaries.

### Trips

- [x] Create manual/synced trip-summary model, migration, serializer, and CRUD endpoints.
- [ ] Add GPS-point storage and batch ingestion (GPS integration remains out of scope for now).
- [x] Support synced trip history and trip statistics for the web app.
- [x] Keep live GPS trip capture outside the web/backend summary API for now.
- [ ] Add route/map data when GPS data is available.

### Maintenance

- [x] Create maintenance-record and maintenance-reminder models and migrations.
- [x] Add CRUD endpoints for service history, costs, parts, notes, dates, and odometer readings.
- [x] Add upcoming/overdue maintenance queries and reminder completion.
- [ ] Add service-centre lookup integration if required.

### System preferences and export

- [x] Add per-user alert settings, thresholds, units, currency, language, and notification preferences.
- [x] Export accessible vehicle, fuel, trip, and maintenance records as CSV.

### Sync, calculations, and operations

- [ ] Add a sync protocol for create/update/delete operations, retries, conflicts, and idempotency.
- [x] Expose server-side fuel, maintenance, trip, and dashboard summaries.
- [ ] Add prediction summaries when sufficient real-world data is available.
- [ ] Add consistent pagination, filtering, error formats, and API versioning.
- [ ] Maintain OpenAPI documentation for all endpoints.
- [ ] Add production PostgreSQL/PostGIS configuration, backups, logging, health checks, and monitoring.
- [ ] Review CORS, `ALLOWED_HOSTS`, secrets, debug settings, and HTTPS deployment settings.

## 2. Frontend / React web client

### Application shell and authentication

- [x] Landing page, registration page, login page, and basic dashboard route.
- [x] Landing `#packages` section renders the live public plans (grouped personal / team) with deep links into registration; static mirrors render when the API is unreachable.
- [ ] Protect `/dashboard` and future private routes using the stored JWT.
- [ ] Restore sessions on refresh and redirect unauthenticated users to `/login`.
- [ ] Handle token expiry with refresh and logout on failed refresh.
- [x] Add profile menu, account switching, theme toggle, and logout controls; complete account settings remain TODO.

### Dashboard

- [x] Replace remaining static dashboard values with authenticated API data. The customer-facing dashboard tabs (Fuel, Services, Trips, System) now load records, summaries and preferences from the API; the superadmin console is partially API-backed.
- [x] Add vehicle selection UI and pass the selected vehicle through the dashboard tabs. API-backed vehicle loading is now wired (vehicles load through `/api/v1/vehicles/`).
- [x] Add loading, empty, offline, and API-error states across dashboard data views. Every tab shows retry, empty and loading states; offline data is served from the cached access snapshot.
- [x] Add responsive layouts for mobile, tablet, and desktop.
- [x] Connect telemetry, fuel, maintenance, trip, alert, and diagnostic actions to real features. Fuel, maintenance and trip records, summaries and preferences now persist to the API. Telemetry (OBD-II) and live diagnostics remain intentionally offline — they have no backend endpoints yet.

### Vehicle management

- [ ] Add vehicle list, details, create, edit, and delete screens.
- [ ] Add forms for all supported vehicle fields with client-side validation.
- [ ] Show ownership, active status, odometer, fuel type, and recent activity.

### Fuel management

- [ ] Add fuel-record list, filters, details, create, edit, and delete flows.
- [ ] Add fuel cost and consumption charts with selectable date ranges.
- [ ] Support queued offline fuel records and visible sync status.

### Trips and maintenance

- [ ] Add synced trip-history list and trip details/map display.
- [ ] Add maintenance history, upcoming reminders, service details, and completion flows.
- [ ] Add dashboard alerts for overdue and upcoming maintenance.

## 3. Offline-first web support

- [ ] Add PWA manifest, service worker, install metadata, and offline app shell.
- [ ] Add IndexedDB storage using an approved project dependency.
- [ ] Cache authenticated user data safely and provide offline read access.
- [ ] Queue local writes and synchronize them when connectivity returns.
- [ ] Add conflict handling, retry controls, last-synced timestamps, and offline indicators.
- [ ] Clear sensitive cached data on logout or account change.

## 4. UX, accessibility, and quality

- [ ] Add consistent form validation and readable API error messages.
- [ ] Add keyboard navigation, focus states, labels, semantic HTML, and screen-reader support.
- [ ] Add confirmation flows for destructive actions.
- [ ] Add reusable API, form, table, chart, modal, and notification components.
- [ ] Remove placeholder/demo values and align branding/content across pages.

## 5. Scalability, performance, and reliability

- [ ] Define a stateless API architecture so application servers can scale horizontally.
- [ ] Add Redis or an equivalent managed cache for sessions, throttling, frequently used lookups, and hot dashboard summaries.
- [ ] Add a background job system for notifications, imports, reports, analytics, sync processing, and prediction workloads.
- [ ] Keep slow work out of request/response paths and expose job status for long-running operations.
- [ ] Add database indexes, query optimization, connection pooling, pagination limits, and protection against N+1 queries.
- [ ] Plan read replicas and partitioning/archival strategies for high-volume trip, GPS, and telemetry data.
- [ ] Add API rate limits, per-tenant quotas, payload limits, abuse protection, and graceful overload responses.
- [ ] Add CDN/static asset delivery, compression, browser caching, and frontend code splitting.
- [ ] Define service-level objectives for availability, latency, sync completion, and recovery time.
- [ ] Add structured logs, metrics, distributed tracing, error tracking, dashboards, and actionable alerts.
- [ ] Add health/readiness checks, rolling deployments, autoscaling, and zero-downtime migrations.
- [ ] Define backup restoration tests, disaster recovery procedures, regional failure handling, and recovery point objectives.

## 6. Testing and verification

- [ ] Add backend tests for every endpoint: happy path, validation, authentication, ownership, and pagination.
- [ ] Add frontend component and route tests for authentication and core workflows.
- [ ] Add API integration tests for login, registration, vehicles, fuel, trips, and maintenance.
- [ ] Test offline creation, reconnect synchronization, retries, conflicts, and logout data clearing.
- [ ] Test responsive layouts and accessibility with supported browsers.
- [ ] Run Django checks/tests, frontend lint, frontend build, and production smoke tests in CI.

## 6. Deployment and release

- [ ] Define production environment variables for the API and frontend.
- [ ] Deploy the Django API and PostgreSQL/PostGIS database.
- [ ] Deploy the React app with the correct API URL, SPA fallback, HTTPS, and caching headers.
- [ ] Configure migrations, static files, error monitoring, backups, and rollback steps.
- [ ] Document local setup, API usage, environment configuration, and release procedures.

## Suggested implementation order

1. Protect the dashboard and connect authentication/session handling.
2. Connect vehicle CRUD and replace dashboard placeholders with vehicle data.
3. Build fuel records and server-side summaries.
4. Build maintenance records/reminders and dashboard alerts.
5. Build synced trip history.
6. Add IndexedDB, PWA support, offline queues, and synchronization.
7. Complete tests, accessibility, security review, and deployment automation.
