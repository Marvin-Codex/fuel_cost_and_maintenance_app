# SaaS Web Platform TODO

This checklist positions FuelMaintenance as a scalable, multi-tenant SaaS from day one. The platform must support individual users, growing fleets, business teams, and high request/data volumes without redesigning the core architecture. Tenant data isolation, security, observability, reliability, and predictable operating costs are core requirements.

The React web client should remain offline-first: users must be able to view cached data and record changes without a network connection, then synchronize when connectivity returns.

## 1. SaaS foundation and tenancy

- [ ] Introduce `Organization`/`Tenant` and membership models with roles and permissions.
- [ ] Scope every user, vehicle, fuel, trip, and maintenance query by tenant at the database/API layer.
- [ ] Add tenant-aware object permissions, admin tooling, and automated cross-tenant isolation tests.
- [ ] Support invitations, team membership, role changes, deactivation, and audit history.
- [ ] Define subscription plans, feature entitlements, usage quotas, trials, upgrades, downgrades, and cancellation.
- [ ] Add billing-provider integration with webhook verification and subscription state reconciliation.
- [ ] Add tenant settings for locale, currency, units, time zone, retention, and notification preferences.
- [ ] Define data export, account deletion, retention, and tenant offboarding workflows.

## 2. Backend / Django API

### Authentication and users

- [x] Registration endpoint: `POST /api/v1/auth/register/`
- [x] JWT login, refresh, and current-user endpoints.
- [ ] Add password reset/change and account profile endpoints.
- [ ] Add rate limiting, secure production token handling, and authentication error logging.
- [ ] Confirm permissions and ownership checks for every user-owned resource.

### Vehicles

- [x] Vehicle model and ownership-scoped CRUD API.
- [x] Add vehicle specifications, operational status, and persistent active-vehicle selection.
- [x] Validate odometer progression and registration-number uniqueness.
- [x] Protect vehicles with stored records from deletion and add focused CRUD/permission tests.
- [ ] Add vehicle search and sorting.

### Fuel records

- [x] Create fuel-record model, migrations, serializer, viewset, and URLs.
- [x] Support purchase date/time, vehicle, odometer, quantity, unit price, total cost, fuel type, station, receipt reference, and notes.
- [x] Validate odometer progression and calculate fuel cost on the server.
- [x] Add date-range and vehicle-filtered summaries for daily, weekly, and monthly purchase costs and volume.
- [x] Add trip and full-tank-refill fuel-efficiency history; estimate range only when recorded fuel data supports it.
- [x] Add alerts for low estimated fuel, unusually high trip consumption, and inconsistent or insufficient refueling records.

### Trips

- [x] Create manual/synced trip-summary model, migration, serializer, and CRUD endpoints.
- [x] Start and complete trips using vehicle odometer readings; derive distance from the odometer difference and keep vehicle updates consistent.
- [x] Connect the web Trips screen to persisted trip history, vehicle/date filters, and completed-trip summaries.
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
- [ ] Protect `/dashboard` and future private routes using the stored JWT.
- [ ] Restore sessions on refresh and redirect unauthenticated users to `/login`.
- [ ] Handle token expiry with refresh and logout on failed refresh.
- [ ] Add profile menu, account settings, and accessible logout flow.

### Dashboard

- [x] Load the authenticated vehicle list and persist the selected dashboard vehicle.
- [x] Load vehicle-scoped summary metrics for the selected vehicle.
- [ ] Replace remaining illustrative charts, alerts, and telemetry with recorded/live API data.
- [ ] Add loading, empty, offline, and API-error states.
- [ ] Add responsive layouts for mobile, tablet, and desktop.
- [ ] Connect telemetry, fuel, maintenance, trip, alert, and diagnostic actions to real features.

### Vehicle management

- [x] Add vehicle switching and profile fields plus create, edit, and delete controls.
- [x] Add forms for supported specifications, odometer, and status fields.
- [ ] Show ownership and recent activity in a dedicated vehicle list/detail view.

### Fuel management

- [x] Add authenticated fuel-purchase list and create flows to the Fuel screen.
- [x] Show saved purchase costs, trip-consumption details, measured efficiency history, and fuel-data alerts.
- [ ] Add fuel-record filters, details, edit, and delete flows.
- [ ] Add consumption charts with selectable date ranges.
- [ ] Support queued offline fuel records and visible sync status.

### Trips and maintenance

- [x] Add a vehicle-scoped trip-history list with start/end odometer details.
- [ ] Add trip map display when GPS data is available.
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
