# Accounts, Packages, Roles & Permissions — Implementation Spec

For Claude Code (or any AI) working in `backend/`. Read the root `README.md` first for the stack and conventions.

**Status:** design settled. A reference implementation is in `access_reference.zip` (Django app `access`). It has 28 tests, all passing, and I also broke the rules on purpose in a copy to confirm the tests fail when they should. Treat the zip as the source of truth for behaviour. It was tested on Django 6.1 / DRF 3.18 only. Regenerate migrations in the real project.

---

## 1. Product rules (from the owner)

- **Free Personal**: a day-to-day user adds one vehicle and manages it for free.
- **Personal Pro**: one person, more vehicles; the more vehicles, the more they pay (billing comes later).
- **Group / family**: a few people see the same vehicles and statistics (e.g. 3 people, 5 vehicles). Not an organization.
- **Organization / Enterprise**: a registered organization with members in different roles (owner, admin, manager, staff, viewer…). Custom user count, vehicle limit or unlimited, custom feature set. Not everyone sees everything.
- **Custom packages**: the superuser can create any package and tune it per customer.
- **Permission based**: the superuser moves permissions between roles, for the whole platform or for a single user. Package names, roles, limits are **editable defaults**, never hardcoded.
- One login can belong to several accounts (personal + group + organization) and **switch** between them, with different rights in each.
- Everything stays **offline-first** (see section 9).

## 2. The idea that fixes the mess: everything is a Workspace

| Account type | `kind` (UI label only) | Default package | People | Roles in use | Vehicles |
|---|---|---|---|---|---|
| Personal | personal | Personal (free) | 1 | owner | 1 |
| Personal Pro | personal | Personal Pro | 1 | owner | 5 (raised as they pay) |
| Group / family | group | Group | up to 3 | owner, member, viewer | 5 shared |
| Organization | organization | Enterprise | custom | owner, admin, manager, staff, viewer, custom roles | custom / unlimited |
| Custom | any | a private Plan + overrides | custom | any | custom |

Rules that remove the "no organization → viewer" problem:

1. **Every user gets a personal workspace at signup, superusers included.** There is no "user without an account" state any more.
2. **Vehicles belong to a workspace, not to a user.** Fuel, trips and maintenance hang off the vehicle.
3. **A role lives on the membership** (user ↔ workspace), not on the user. The same person can be owner of their personal account, admin in a company and viewer in a family group.
4. **Switching account = switching the active workspace** (request header `X-Workspace: <uuid>`).
5. **Superuser is a platform flag** (`is_superuser`), not a workspace role.
6. Group and Organization are the **same model**. They differ only in plan, limits and which roles are used. That is what keeps everything customizable.

## 3. Building blocks

| Model | What it is | Editable by superuser |
|---|---|---|
| `Permission` | One code the app can enforce (`vehicles.add`, `analytics.export`…). Defined in `permissions_catalog.py`, synced to the DB. | No (code decides what exists) |
| `Plan` | A package: name, limits, **entitlements** (the feature ceiling), `is_public`, `is_default`, `price_config` (for billing later). Custom packages are just more rows. | Yes, all of it (`key` is fixed) |
| `Workspace` | The tenant. Has a plan plus per-customer overrides: `limit_overrides`, `entitlement_grants`, `entitlement_revokes`. | Yes |
| `Role` | A named set of permissions. `workspace=NULL` is a platform template shared by all; `workspace=<ws>` is a custom role in one workspace. | Yes |
| `Membership` | A seat: user + workspace + role. Optional per-user `grants` / `denies` and `vehicle_scope`. | Yes |
| `VehicleAssignment` | Which vehicles a role with scope `assigned` (e.g. a driver) may see. Lives in the `vehicles` app. | Yes |

## 4. How a permission is decided (one function: `resolve_access`)

```
ceiling   = (plan.entitlements ∪ workspace.entitlement_grants) − workspace.entitlement_revokes
effective = ((role.permissions ∪ membership.grants) ∩ ceiling) − membership.denies

is_superuser             → everything (no membership needed)
no active membership     → AccessDenied("not_a_member")      ← never "viewer"
```

Two separate questions, never mixed: **entitlement** (does this package include the feature?) and **permission** (may this role use it?). A user needs both.

**Where to change what** (this is the "move permissions around" requirement):

| I want to… | Edit | Affects |
|---|---|---|
| change what a role can do everywhere | template `Role.permissions` | every workspace using that role |
| change what a package includes | `Plan.entitlements` | every workspace on that plan |
| tune one customer's package | `Workspace.entitlement_grants/revokes`, `limit_overrides` (or give them a private `Plan`) | that workspace only |
| change one person | `Membership.grants / denies` | that person in that workspace |
| give one organization its own role | create a `Role` with `workspace=<that org>` | that organization only |

A per-user grant can never exceed the package ceiling. To go beyond it, give the workspace the entitlement.

## 5. Limits

- `Plan.limits` = `{"vehicles": 1, "members": 1}`; `null` = unlimited; a key missing everywhere = **0** (deny by default, so a new limit never becomes free by accident).
- `Workspace.limit_overrides` wins over the plan. **Pay-per-vehicle later = set `limit_overrides["vehicles"]` to the quantity they paid for.** No schema change.
- Each app registers how its resource is counted: `register_usage("vehicles", fn)` (see `vehicles/apps.py`).
- `check_limit(workspace, key)` raises `LimitExceeded`. Call it inside `transaction.atomic()` after `select_for_update()` on the workspace row so two simultaneous adds cannot both pass.
- Downgrades never delete data. Over-limit workspaces simply cannot add more.

## 6. Seeded defaults (editable; seeding only creates what is missing and never overwrites your edits)

| Plan (`key`) | Vehicles | People | Includes |
|---|---|---|---|
| Personal (`personal-free`, default) | 1 | 1 | vehicles, fuel, trips, maintenance (view/add/edit/delete), analytics view, service centres, workspace + billing management |
| Personal Pro (`personal-pro`) | 5 | 1 | above + predictions + analytics export |
| Group (`group`) | 5 | 3 | above + members view/invite/manage |
| Enterprise (`enterprise`) | unlimited | unlimited | every permission |

| Role | Gets |
|---|---|
| owner | everything the plan allows |
| admin | everything except `billing.manage` |
| manager | full CRUD on the four data types, analytics (view/export), predictions, service centres, see members |
| member | view/add/edit on the four data types (no delete), analytics view, predictions, service centres, see members |
| staff / driver | scope **assigned**: view their vehicles; add fuel, trips, maintenance records; service centres |
| viewer | view-only on the four data types, analytics view, service centres |

The free plan includes `billing.manage` on purpose, so a free user can reach the upgrade screen.
The names above are just defaults. Rename or change any of them in the admin.

## 7. Request flow

1. Authenticate (token).
2. **Active workspace**: header `X-Workspace`, else the user's personal workspace, else their first one. A superuser may enter any workspace. No workspace → `no_workspace`.
3. `resolve_access(user, workspace)` → `request.workspace`, `request.access`.
4. The view maps each action to a permission (`permission_map`). An action with no mapping is **denied**.
5. Querysets are scoped to the workspace, and to assigned vehicles for `assigned` roles (`vehicles_for(access)`).
6. Creating things calls `check_limit` under a row lock.

Every refusal is HTTP 403 with a machine-readable `code`, so the clients can react correctly:
`not_a_member`, `no_workspace`, `invalid_workspace`, `workspace_inactive`, `permission_denied` (show "you can't do this"), `limit_exceeded` (show "upgrade your package", includes `limit_key`, `limit`, `used`).

Views never look at roles or plans. They only call `access.can("code")` through `WorkspacePermission`.

## 8. Fixing the "everyone is a viewer" bug in the existing code

I have not seen your current code. From your description the likely cause is: permission lookups start from the organization, and when no organization is found a default `viewer` role is applied, superuser included. Steps:

1. Copy `access/` into `backend/`, add `"access"` to `INSTALLED_APPS`, set `REST_FRAMEWORK["EXCEPTION_HANDLER"] = "access.drf.access_exception_handler"`, run `makemigrations access` and `migrate`. Migrating seeds the default plans and roles.
2. Run `python manage.py backfill_workspaces`. Every existing user, superusers included, gets a personal workspace as owner on the default plan.
3. Add `workspace = ForeignKey("access.Workspace", related_name="vehicles")` to `Vehicle`. Data migration: each vehicle goes to its owner's personal workspace; for each existing Organization create a `Workspace` (kind `organization`, plan `enterprise`), map each old org member to a `Membership` with the matching new role key, and point the org's vehicles at it.
4. Register the vehicle count: `register_usage("vehicles", ...)` in the vehicles app's `ready()`.
5. **Delete every fallback to "viewer".** Search the code for `viewer`, `get_role`, `organization`, `is_org_member`. Replace each check with `WorkspacePermission` + `permission_map`, and each `if user.role == ...` with `access.can("...")`.
6. Remove any special-casing of superusers. `resolve_access` already handles them.
7. Copy `access/tests.py`, adapt its imports to your real `Vehicle` (it expects `workspace`, `name`, `archived` and a `VehicleAssignment` model) and your URLs, and get all 28 passing. Then add tests for your own endpoints.

Note: limits still apply to a superuser. For your own testing, set `limit_overrides = {"vehicles": null}` on your own workspace.

## 9. Offline-first rules

- On login and on every sync, call `GET /api/me/access/`. It returns, per workspace: role, effective `permissions`, `vehicle_scope`, `limits` (`limit` and `used`), plan, and a `version` hash. Store it in the local database (Drift / Dexie).
- `version` changes only when rights or limit values change, not when usage changes. Refresh the cache when it differs.
- Hide or disable UI from the cached permissions, but **the server is the authority**. Never rely on client checks.
- Check the limit locally before creating (instant feedback), but expect the server to be able to refuse at sync time.
- Every synced item carries `workspace_id`; the server resolves access per item and answers per item with `permission_denied` or `limit_exceeded`. The client keeps a refused record visible as "not accepted" and lets the user resolve it (upgrade, delete or edit). It never silently drops it.
- Local tables carry `workspace_id`, so switching accounts works offline from the cached workspaces.
- If the package is downgraded, existing local and server data is kept; only adding more is blocked.

## 10. Superuser console

- **v1 (provided):** Django admin: edit plans (entitlement picker, limits), roles (permission picker), workspaces (plan, overrides), memberships (per-user grants/denies). Seeded plans and roles cannot be deleted; their `key` cannot change; names are freely editable.
- **v2 (React, later):** a plans screen; a **roles × permissions matrix** with toggles; a workspace screen to change plan and overrides; per-member grants/denies; "enter workspace" for support, with an audit log.

## 11. Decisions I made (change any you disagree with)

- Group and Organization are one model; `kind` is only a label.
- A platform superuser bypasses permissions and plan ceilings but **not** limits.
- Permission codes live in code; plans, roles, limits and names live in the database.
- A custom package is a private plan (`is_public=False`) and/or per-workspace overrides.
- Refusals use 403 (not 402) for limits, with the `code` field telling the cases apart.
- Role templates are shared platform-wide; per-organization differences are done with custom roles, not by editing the template.

## 12. Defined but not built yet

- Billing and payments, `price_config` is only reserved.
- Invitation email / accept flow (the `add_member` service exists; there is no endpoint).
- Endpoints to manage members and custom roles (`members.*`, `roles.manage` are defined but not enforced anywhere yet).
- Audit log (`audit.view` is defined only).
- Moving a vehicle between workspaces; protecting the last owner from removal; support-staff platform roles.

## 13. Order of work for the AI

1. Install the `access` app, migrate, backfill (section 8, steps 1-2).
2. Add the workspace FK to Vehicle plus the data migration (step 3).
3. Move one endpoint (vehicles) onto `WorkspacePermission`; get it green; then migrate the rest one by one (fuel, trips, maintenance, analytics).
4. Add `/api/me/access/` to the React and Flutter clients; replace role checks with permission checks; add the workspace switcher (stores the active workspace, sends `X-Workspace`).
5. Add the "upgrade" and "not allowed" UI states keyed on the error `code`.
6. Build the superuser matrix screens (section 10, v2).
