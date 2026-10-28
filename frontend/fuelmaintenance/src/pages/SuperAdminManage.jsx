import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as auth from '../api/auth'
import { createAdmin, deactivateAdmin, fetchAdminReference, listAdmin, updateAdmin } from '../api/access'
import Sidebar from '../components/Sidebar'
import DashboardHeader from '../components/DashboardHeader'
import { useSyncStatus } from '../hooks/useSyncStatus'
import './Dashboard.css'

function Icon({ children, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
}


const SECTIONS = {
  workspaces: {
    title: 'Workspace management',
    description: 'Create, edit, and deactivate customer workspaces: their package, per-customer limits, and feature overrides.',
    singular: 'workspace',
  },
  plans: {
    title: 'Plan management',
    description: 'Maintain packages: identity, visibility, default status, limits, feature ceiling, and billing configuration.',
    singular: 'plan',
  },
  users: {
    title: 'User management',
    description: 'Manage platform accounts: credentials, contact details, status, and administrator access.',
    singular: 'user',
  },
  memberships: {
    title: 'Membership management',
    description: "Control which users belong to each workspace, their roles, vehicle scope, and status.",
    singular: 'membership',
  },
  'vehicle-presets': {
    title: 'Vehicle preset management',
    description: 'Create the vehicle definitions available for people to choose in the dashboard.',
    singular: 'vehicle preset',
  },
  roles: {
    title: 'Role management',
    description: 'Platform role templates (shared everywhere) and workspace custom roles (one workspace only). Read-only here.',
    singular: 'role',
    readOnly: true,
  },
}

/* The API path each section talks to. Workspaces use the superadmin endpoint
   (plan assignment + overrides); roles are read-only for reference. */
function apiPath(resource) {
  if (resource === 'workspaces') return 'super-workspaces'
  return resource
}

/** JSON text helpers for the limit/override/price editors. `null` means "not set". */
function stringifyJson(value) {
  if (value === undefined || value === null) return ''
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return ''
  }
}

function parseJsonField(text, fieldName) {
  if (!String(text ?? '').trim()) return { ok: true, value: null }
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false, error: `${fieldName} must be valid JSON (or empty to leave it unchanged).` }
  }
}

/* One labeled full-width form row. */
function Field({ label, hint, children }) {
  return (
    <div className="super-admin-field">
      <span className="super-admin-field-label">{label}</span>
      {children}
      {hint && <small className="super-admin-field-hint">{hint}</small>}
    </div>
  )
}

function CheckRow({ label, hint, checked, onChange }) {
  return (
    <label className="super-admin-check">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}{hint && <small className="super-admin-field-hint">{hint}</small>}</span>
    </label>
  )
}

/** Permission code picker grouped by the backend catalog. */
function PermissionPicker({ label, hint, permissions, selected, onChange, disabled }) {
  const values = Array.isArray(selected) ? selected : []
  const groups = {}
  for (const permission of permissions) {
    const group = permission.group || 'Other'
    if (!groups[group]) groups[group] = []
    groups[group].push(permission)
  }
  const toggle = (code) => {
    if (disabled) return
    onChange(values.includes(code) ? values.filter((item) => item !== code) : [...values, code])
  }
  return (
    <div className="super-admin-field">
      <span className="super-admin-field-label">{label} <em>({values.length} selected)</em></span>
      {Object.keys(groups).length === 0 && <small className="super-admin-field-hint">Loading the permission catalog…</small>}
      <div className="super-admin-permissions">
        {Object.entries(groups).map(([group, items]) => (
          <details key={group}>
            <summary>{group} ({items.filter((item) => values.includes(item.code)).length}/{items.length})</summary>
            {items.map((item) => (
              <label key={item.code} className="super-admin-check">
                <input type="checkbox" checked={values.includes(item.code)} disabled={disabled} onChange={() => toggle(item.code)} />
                <span><code>{item.code}</code><small className="super-admin-field-hint">{item.label}</small></span>
              </label>
            ))}
          </details>
        ))}
      </div>
      {hint && <small className="super-admin-field-hint">{hint}</small>}
    </div>
  )
}

const PLAN_KINDS = ['personal', 'group', 'organization']
const VEHICLE_SCOPES = [
  ['', 'Inherit from role'],
  ['all', 'All vehicles'],
  ['assigned', 'Only assigned vehicles'],
]

function fields(resource, form, editingId, setField, refs) {
  const plans = refs.plans ?? []
  const users = refs.users ?? []
  const workspaces = refs.workspaces ?? []
  const roles = refs.roles ?? []
  const permissions = refs.permissions ?? []
  if (resource === 'plans') return <>
    <Field label="Key" hint="Stable id used by code and seeds. Renaming breaks references — prefer editing the name.">
      <input required placeholder="personal-pro" value={form.key ?? ''} onChange={(e) => setField('key', e.target.value)} disabled={Boolean(editingId && form.is_system)} />
    </Field>
    <Field label="Name" hint="What people see on the landing page and at sign-up.">
      <input required placeholder="Personal Pro" value={form.name ?? ''} onChange={(e) => setField('name', e.target.value)} />
    </Field>
    <Field label="Kind">
      <select value={form.kind ?? 'personal'} onChange={(e) => setField('kind', e.target.value)}>
        {PLAN_KINDS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
      </select>
    </Field>
    <Field label="Description" hint="Shown on the landing page cards and the registration picker.">
      <textarea rows={2} placeholder="One person, more vehicles." value={form.description ?? ''} onChange={(e) => setField('description', e.target.value)} />
    </Field>
    <CheckRow label="Public package" hint="Off = custom package for specific customers (hidden from sign-up)." checked={form.is_public ?? true} onChange={(value) => setField('is_public', value)} />
    <CheckRow label="Default package" hint="Given to every new signup. Only one package can be default." checked={form.is_default ?? false} onChange={(value) => setField('is_default', value)} />
    <Field label="Limits (JSON)" hint='e.g. {"vehicles": 5, "members": 3}. null = unlimited, a missing key = 0 (deny).'>
      <textarea rows={3} spellCheck={false} placeholder={'{\n  "vehicles": 5,\n  "members": 3\n}'} value={form.limits ?? ''} onChange={(e) => setField('limits', e.target.value)} />
    </Field>
    <PermissionPicker label="Feature ceiling (entitlements)" hint="Nobody on this package can ever exceed these features." permissions={permissions} selected={form.entitlements} onChange={(value) => setField('entitlements', value)} />
    <Field label="Billing configuration (JSON)" hint='Reserved for billing later, e.g. {"base": 0, "per_vehicle": 5000, "included_vehicles": 1}.'>
      <textarea rows={3} spellCheck={false} placeholder={'{\n  "base": 0,\n  "per_vehicle": 5000,\n  "included_vehicles": 1\n}'} value={form.price_config ?? ''} onChange={(e) => setField('price_config', e.target.value)} />
    </Field>
    {Boolean(editingId && form.is_system) && <p className="super-admin-field-hint">Seeded default package: the key is locked, but every other field stays editable. Deactivate instead of deleting.</p>}
  </>
  if (resource === 'users') return <>
    <Field label="Username">
      <input required placeholder="jane.doe" value={form.username ?? ''} onChange={(e) => setField('username', e.target.value)} />
    </Field>
    <Field label="Email">
      <input type="email" placeholder="you@example.com" value={form.email ?? ''} onChange={(e) => setField('email', e.target.value)} />
    </Field>
    <Field label="First name">
      <input placeholder="Jane" value={form.first_name ?? ''} onChange={(e) => setField('first_name', e.target.value)} />
    </Field>
    <Field label="Last name">
      <input placeholder="Doe" value={form.last_name ?? ''} onChange={(e) => setField('last_name', e.target.value)} />
    </Field>
    <Field label={editingId ? 'New password (blank keeps current)' : 'Password'} hint="Min 8 characters. Blank on edit keeps the current credential.">
      <input placeholder={editingId ? 'New password (optional)' : 'Password'} type="password" required={!editingId} minLength={8} value={form.password ?? ''} onChange={(e) => setField('password', e.target.value)} />
    </Field>
    <CheckRow label="Staff (Django admin access)" checked={form.is_staff ?? false} onChange={(value) => setField('is_staff', value)} />
    <CheckRow label="Superuser (platform admin)" hint="Grants the whole superadmin console. Handle with care." checked={form.is_superuser ?? false} onChange={(value) => setField('is_superuser', value)} />
  </>
  if (resource === 'vehicle-presets') return <>
    <Field label="Preset name">
      <input required placeholder="Toyota Premio 2018" value={form.name ?? ''} onChange={(e) => setField('name', e.target.value)} />
    </Field>
    <Field label="Make">
      <input required placeholder="Toyota" value={form.make ?? ''} onChange={(e) => setField('make', e.target.value)} />
    </Field>
    <Field label="Model">
      <input required placeholder="Premio" value={form.model ?? ''} onChange={(e) => setField('model', e.target.value)} />
    </Field>
    <Field label="Year">
      <input type="number" min="1900" max="2100" placeholder="2018" value={form.year ?? ''} onChange={(e) => setField('year', e.target.value || null)} />
    </Field>
    <Field label="Color">
      <input placeholder="White" value={form.color ?? ''} onChange={(e) => setField('color', e.target.value)} />
    </Field>
    <Field label="Body type">
      <select value={form.body_type ?? ''} onChange={(e) => setField('body_type', e.target.value)}><option value="">—</option>{['sedan','hatchback','suv','crossover','wagon','pickup','van','coupe','convertible','bus','other'].map(v=><option key={v} value={v}>{v.replace(/_/g,' ').toUpperCase()}</option>)}</select>
    </Field>
    <Field label="Doors">
      <input type="number" min="1" placeholder="4" value={form.doors ?? ''} onChange={(e) => setField('doors', e.target.value || null)} />
    </Field>
    <Field label="Seats">
      <input type="number" min="1" placeholder="5" value={form.seats ?? ''} onChange={(e) => setField('seats', e.target.value || null)} />
    </Field>
    <Field label="Fuel type">
      <select value={form.fuel_type ?? 'petrol'} onChange={(e) => setField('fuel_type', e.target.value)}><option value="petrol">Petrol</option><option value="diesel">Diesel</option><option value="electric">Electric</option><option value="hybrid">Hybrid</option><option value="lpg">LPG</option><option value="cng">CNG</option><option value="other">Other</option></select>
    </Field>
    <Field label="Engine">
      <input placeholder="1.8L 2ZR-FAE" value={form.engine ?? ''} onChange={(e) => setField('engine', e.target.value)} />
    </Field>
    <Field label="Engine capacity (cc)">
      <input type="number" min="1" placeholder="1800" value={form.engine_capacity_cc ?? ''} onChange={(e) => setField('engine_capacity_cc', e.target.value || null)} />
    </Field>
    <Field label="Cylinders">
      <input type="number" min="1" placeholder="4" value={form.cylinders ?? ''} onChange={(e) => setField('cylinders', e.target.value || null)} />
    </Field>
    <Field label="Transmission">
      <select value={form.transmission ?? ''} onChange={(e) => setField('transmission', e.target.value)}><option value="">—</option><option value="manual">Manual</option><option value="automatic">Automatic</option><option value="cvt">CVT</option><option value="dct">DCT</option><option value="amt">AMT</option><option value="other">Other</option></select>
    </Field>
    <Field label="Drive type">
      <select value={form.drive_type ?? ''} onChange={(e) => setField('drive_type', e.target.value)}><option value="">—</option><option value="fwd">FWD</option><option value="rwd">RWD</option><option value="awd">AWD</option><option value="4wd">4WD</option><option value="other">Other</option></select>
    </Field>
    <Field label="Power (hp)">
      <input type="number" min="0" step="0.01" placeholder="140" value={form.power_hp ?? ''} onChange={(e) => setField('power_hp', e.target.value || null)} />
    </Field>
    <Field label="Power (kW)">
      <input type="number" min="0" step="0.01" placeholder="104" value={form.power_kw ?? ''} onChange={(e) => setField('power_kw', e.target.value || null)} />
    </Field>
    <Field label="Torque (Nm)">
      <input type="number" min="0" step="0.01" placeholder="173" value={form.torque_nm ?? ''} onChange={(e) => setField('torque_nm', e.target.value || null)} />
    </Field>
    <Field label="Top speed (km/h)">
      <input type="number" min="0" step="0.01" placeholder="200" value={form.top_speed_kmh ?? ''} onChange={(e) => setField('top_speed_kmh', e.target.value || null)} />
    </Field>
    <Field label="Curb weight (kg)">
      <input type="number" min="0" step="0.01" placeholder="1300" value={form.curb_weight_kg ?? ''} onChange={(e) => setField('curb_weight_kg', e.target.value || null)} />
    </Field>
    <Field label="Gross weight (kg)">
      <input type="number" min="0" step="0.01" placeholder="1700" value={form.gross_weight_kg ?? ''} onChange={(e) => setField('gross_weight_kg', e.target.value || null)} />
    </Field>
    <Field label="Tank capacity (L)">
      <input type="number" min="0" step="0.01" placeholder="60" value={form.tank_capacity_liters ?? form.tank_capacity_l ?? ''} onChange={(e) => { setField('tank_capacity_liters', e.target.value || null); setField('tank_capacity_l', e.target.value || null) }} />
    </Field>
    <Field label="Combined (L/100 km)">
      <input type="number" min="0" step="0.01" placeholder="6.5" value={form.combined_fuel_consumption_l_100km ?? ''} onChange={(e) => setField('combined_fuel_consumption_l_100km', e.target.value || null)} />
    </Field>
    <Field label="City (L/100 km)">
      <input type="number" min="0" step="0.01" placeholder="8.0" value={form.city_fuel_consumption_l_100km ?? ''} onChange={(e) => setField('city_fuel_consumption_l_100km', e.target.value || null)} />
    </Field>
    <Field label="Highway (L/100 km)">
      <input type="number" min="0" step="0.01" placeholder="5.0" value={form.highway_fuel_consumption_l_100km ?? ''} onChange={(e) => setField('highway_fuel_consumption_l_100km', e.target.value || null)} />
    </Field>
    <Field label="Battery (kWh)">
      <input type="number" min="0" step="0.01" placeholder="50" value={form.battery_capacity_kwh ?? ''} onChange={(e) => setField('battery_capacity_kwh', e.target.value || null)} />
    </Field>
    <Field label="Electric range (km)">
      <input type="number" min="0" placeholder="350" value={form.electric_range_km ?? ''} onChange={(e) => setField('electric_range_km', e.target.value || null)} />
    </Field>
  </>
  if (resource === 'workspaces') return <>
    <Field label="Workspace name">
      <input required placeholder="Kampala Fleet Services" value={form.name ?? ''} onChange={(e) => setField('name', e.target.value)} />
    </Field>
    <Field label="Kind" hint="Only a label for the UI — behaviour comes from the package, limits, and roles.">
      <select value={form.kind ?? 'personal'} onChange={(e) => setField('kind', e.target.value)}>
        {PLAN_KINDS.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
      </select>
    </Field>
    <Field label="Package (plan)" hint={editingId ? 'Reassigning the package changes limits and features immediately.' : 'Empty = default package.'}>
      <select value={form.plan ?? ''} onChange={(e) => setField('plan', e.target.value === '' ? '' : Number(e.target.value))}>
        {!editingId && <option value="">Default package</option>}
        {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} ({plan.key})</option>)}
      </select>
    </Field>
    <Field label="Limit overrides (JSON)" hint='Per-customer exceptions, e.g. {"vehicles": 20}. Empty = follow the package.'>
      <textarea rows={3} spellCheck={false} placeholder={'{\n  "vehicles": 20\n}'} value={form.limit_overrides ?? ''} onChange={(e) => setField('limit_overrides', e.target.value)} />
    </Field>
    <PermissionPicker label="Feature grants" hint="Extra features on top of the package ceiling." permissions={permissions} selected={form.entitlement_grants} onChange={(value) => setField('entitlement_grants', value)} />
    <PermissionPicker label="Feature revokes" hint="Features taken away even though the package includes them." permissions={permissions} selected={form.entitlement_revokes} onChange={(value) => setField('entitlement_revokes', value)} />
  </>
  if (resource === 'memberships') {
    const userQuery = (form.userSearch ?? '').toLowerCase()
    const workspaceQuery = (form.workspaceSearch ?? '').toLowerCase()
    const matchingUsers = users.filter((user) => !userQuery || `${user.username} ${user.email || ''}`.toLowerCase().includes(userQuery)).slice(0, 50)
    const matchingWorkspaces = workspaces.filter((workspace) => !workspaceQuery || `${workspace.name} ${workspace.plan_name || ''}`.toLowerCase().includes(workspaceQuery)).slice(0, 50)
    const chosenWorkspace = workspaces.find((workspace) => String(workspace.id) === String(form.workspace))
    const eligibleRoles = roles.filter((role) => !role.workspace || String(role.workspace) === String(form.workspace))
    return <>
      <Field label="Member (user)">
        {editingId
          ? <input value={users.find((user) => String(user.id) === String(form.user))?.username ?? form.user} disabled />
          : <>
            <input placeholder="Type to search users…" value={form.userSearch ?? ''} onChange={(e) => setField('userSearch', e.target.value)} />
            <select value={form.user ?? ''} onChange={(e) => setField('user', e.target.value)} size={Math.min(6, Math.max(2, matchingUsers.length))}>
              <option value="">Select a user…</option>
              {matchingUsers.map((user) => <option key={user.id} value={user.id}>{user.username}{user.email ? ` (${user.email})` : ''}</option>)}
            </select>
          </>}
      </Field>
      <Field label="Workspace">
        {editingId
          ? <input value={chosenWorkspace ? `${chosenWorkspace.name} (${chosenWorkspace.plan_name ?? ''})` : form.workspace} disabled />
          : <>
            <input placeholder="Type to search workspaces…" value={form.workspaceSearch ?? ''} onChange={(e) => setField('workspaceSearch', e.target.value)} />
            <select value={form.workspace ?? ''} onChange={(e) => { setField('workspace', e.target.value); setField('role', '') }} size={Math.min(6, Math.max(2, matchingWorkspaces.length))}>
              <option value="">Select a workspace…</option>
              {matchingWorkspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name} ({workspace.plan_name ?? 'no package'})</option>)}
            </select>
          </>}
      </Field>
      <Field label="Role" hint="Template roles work anywhere; custom roles only inside their own workspace.">
        <select value={form.role ?? ''} onChange={(e) => setField('role', e.target.value === '' ? '' : Number(e.target.value))} required={!editingId}>
          <option value="">Select a role…</option>
          {eligibleRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}{role.workspace ? ' (custom)' : ' (template)'}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Vehicle scope" hint="Blank = inherit the role's default scope.">
        <select value={form.vehicle_scope ?? ''} onChange={(e) => setField('vehicle_scope', e.target.value)}>
          {VEHICLE_SCOPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </Field>
    </>
  }
  if (resource === 'roles') return <>
    <Field label="Key"><input value={form.key ?? ''} disabled /></Field>
    <Field label="Name"><input value={form.name ?? ''} disabled /></Field>
    <Field label="Scope"><input value={form.workspace ? 'Custom (one workspace)' : 'Template (every workspace)'} disabled /></Field>
    <PermissionPicker label="Permissions" permissions={permissions} selected={form.permissions} onChange={() => {}} disabled />
  </>
  return null
}


/** Build the API payload. Returns { ok, payload } or { ok: false, error }. */
function buildPayload(resource, form, editingId) {
  if (resource === 'plans') {
    const limits = parseJsonField(form.limits, 'Limits')
    if (!limits.ok) return limits
    const price = parseJsonField(form.price_config, 'Billing configuration')
    if (!price.ok) return { ok: false, error: price.error }
    const payload = {
      key: (form.key ?? '').trim(), name: (form.name ?? '').trim(), kind: form.kind || 'personal',
      description: form.description ?? '', is_public: Boolean(form.is_public),
      is_default: Boolean(form.is_default), is_active: form.is_active ?? true,
      entitlements: Array.isArray(form.entitlements) ? form.entitlements : [],
    }
    if (limits.value !== null) payload.limits = limits.value
    else if (!editingId) payload.limits = {}
    if (price.value !== null) payload.price_config = price.value
    else if (!editingId) payload.price_config = {}
    return { ok: true, payload }
  }
  if (resource === 'users') {
    const payload = {
      username: (form.username ?? '').trim(), email: (form.email ?? '').trim(),
      first_name: form.first_name ?? '', last_name: form.last_name ?? '',
      is_active: form.is_active ?? true, is_staff: Boolean(form.is_staff),
      is_superuser: Boolean(form.is_superuser),
    }
    // Omit on edit so an untouched password field never resets the credential.
    if (form.password || !editingId) payload.password = form.password ?? ''
    return { ok: true, payload }
  }
  if (resource === 'workspaces') {
    const overrides = parseJsonField(form.limit_overrides, 'Limit overrides')
    if (!overrides.ok) return overrides
    const payload = {
      name: (form.name ?? '').trim(), kind: form.kind || 'personal',
      is_active: form.is_active ?? true,
      entitlement_grants: Array.isArray(form.entitlement_grants) ? form.entitlement_grants : [],
      entitlement_revokes: Array.isArray(form.entitlement_revokes) ? form.entitlement_revokes : [],
    }
    if (form.plan !== '' && form.plan !== null && form.plan !== undefined) payload.plan = form.plan
    if (overrides.value !== null) payload.limit_overrides = overrides.value
    else if (!editingId) payload.limit_overrides = {}
    return { ok: true, payload }
  }
  if (resource === 'memberships') {
    if (!form.user) return { ok: false, error: 'Pick the member (user).' }
    if (!form.workspace) return { ok: false, error: 'Pick the workspace.' }
    if (!form.role && !editingId) return { ok: false, error: 'Pick the role.' }
    const payload = {
      user: form.user, workspace: form.workspace, is_active: form.is_active ?? true,
      vehicle_scope: form.vehicle_scope || '',
    }
    if (form.role) payload.role = form.role
    return { ok: true, payload }
  }
  // Strip read-only/display leftovers the rows carry (id, timestamps, *_name).
  const payload = { ...form }
  for (const key of ['id', 'created_at', 'updated_at', 'plan_name', 'username', 'workspace_name', 'role_name']) delete payload[key]
  return { ok: true, payload }
}

/** Prefill an edit dialog from a row; JSON objects become editable text. */
function formFromRow(resource, row) {
  if (resource === 'plans') {
    return {
      key: row.key ?? '', name: row.name ?? '', kind: row.kind ?? 'personal',
      description: row.description ?? '', is_public: row.is_public ?? true,
      is_default: row.is_default ?? false, is_active: row.is_active ?? true,
      limits: stringifyJson(row.limits), entitlements: Array.isArray(row.entitlements) ? row.entitlements : [],
      price_config: stringifyJson(row.price_config), is_system: Boolean(row.is_system),
    }
  }
  if (resource === 'users') {
    return {
      username: row.username ?? '', email: row.email ?? '', first_name: row.first_name ?? '',
      last_name: row.last_name ?? '', password: '', is_active: row.is_active ?? true,
      is_staff: row.is_staff ?? false, is_superuser: row.is_superuser ?? false,
    }
  }
  if (resource === 'workspaces') {
    return {
      name: row.name ?? '', kind: row.kind ?? 'personal', plan: row.plan ?? '', is_active: row.is_active ?? true,
      limit_overrides: stringifyJson(row.limit_overrides),
      entitlement_grants: Array.isArray(row.entitlement_grants) ? row.entitlement_grants : [],
      entitlement_revokes: Array.isArray(row.entitlement_revokes) ? row.entitlement_revokes : [],
    }
  }
  if (resource === 'memberships') {
    return {
      user: row.user ?? '', userSearch: '', workspace: row.workspace ?? '', workspaceSearch: '',
      role: row.role ?? '', vehicle_scope: row.vehicle_scope ?? '', is_active: row.is_active ?? true,
    }
  }
  return { ...row }
}

function emptyForm(resource) {
  if (resource === 'plans') return { kind: 'personal', is_public: true, is_default: false, is_active: true, limits: '', entitlements: [], price_config: '' }
  if (resource === 'users') return { is_active: true, is_staff: false, is_superuser: false }
  if (resource === 'workspaces') return { kind: 'personal', plan: '', is_active: true, limit_overrides: '', entitlement_grants: [], entitlement_revokes: [] }
  if (resource === 'memberships') return { user: '', userSearch: '', workspace: '', workspaceSearch: '', role: '', vehicle_scope: '', is_active: true }
  if (resource === 'vehicle-presets') return { fuel_type: 'petrol', is_active: true }
  return { is_active: true }
}

/** One-line summary shown beside each row in the list. */
function rowDetail(resource, row) {
  if (resource === 'users') {
    const bits = [row.email, row.is_superuser ? 'superuser' : row.is_staff ? 'staff' : ''].filter(Boolean)
    return bits.join(' \u00b7 ')
  }
  if (resource === 'plans') {
    const limits = row.limits ?? {}
    const vehicles = limits.vehicles === null || limits.vehicles === undefined ? '\u221e vehicles' : `${limits.vehicles} vehicle${limits.vehicles === 1 ? '' : 's'}`
    const members = limits.members === null || limits.members === undefined ? '\u221e members' : `${limits.members} member${limits.members === 1 ? '' : 's'}`
    return `${row.kind ?? ''} \u00b7 ${vehicles} \u00b7 ${members} \u00b7 ${(row.entitlements ?? []).length} features`
  }
  if (resource === 'workspaces') return row.plan_name ?? ''
  if (resource === 'memberships') return `${row.workspace_name ?? ''} \u00b7 ${row.role_name ?? ''}`
  if (resource === 'vehicle-presets') return [row.make, row.model, row.year].filter(Boolean).join(' ')
  if (resource === 'roles') return `${row.workspace ? 'custom' : 'template'} \u00b7 ${(row.permissions ?? []).length} permissions`
  return ''
}

export default function SuperAdminManage() {
  const { resource = 'workspaces' } = useParams()
  const navigate = useNavigate()
  const section = SECTIONS[resource] ?? SECTIONS.workspaces
  const { state: syncState, pending } = useSyncStatus()
  const user = auth.getStoredUser()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({})
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [refs, setRefs] = useState({ plans: [], workspaces: [], users: [], roles: [], permissions: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!SECTIONS[resource]) { navigate('/super-admin/workspaces', { replace: true }); return undefined }
    if (!auth.getStoredUser()?.is_superuser) { navigate('/dashboard', { replace: true }); return undefined }
    let mounted = true
    listAdmin(apiPath(resource)).then((data) => {
      if (mounted) setRows(Array.isArray(data) ? data : data.results ?? [])
    }).catch((e) => { if (mounted) setError(e.message) }).finally(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [navigate, resource])
  /* Reference data for the pickers (plans, users, workspaces, roles, catalog). */
  useEffect(() => {
    let mounted = true
    fetchAdminReference()
      .then((data) => { if (mounted) setRefs(data) })
      .catch(() => { if (mounted) setRefs({ plans: [], workspaces: [], users: [], roles: [], permissions: [] }) })
    return () => { mounted = false }
  }, [])

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }))
  async function submit(event) {
    event.preventDefault(); setLoading(true); setError(null)
    const built = buildPayload(resource, form, editingId)
    if (!built.ok) { setError(built.error); setLoading(false); return }
    const endpoint = apiPath(resource)
    try {
      const saved = editingId ? await updateAdmin(endpoint, editingId, built.payload) : await createAdmin(endpoint, built.payload)
      setRows((current) => editingId ? current.map((row) => row.id === saved.id ? saved : row) : [...current, saved])
      closeEditor()
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  async function deactivate(id) {
    setLoading(true); setError(null)
    try { await deactivateAdmin(apiPath(resource), id); setRows((current) => current.map((row) => row.id === id ? { ...row, is_active: false } : row)); setDeleteId(null) }
    catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  function openCreate() { setEditingId(null); setForm(emptyForm(resource)); setEditorOpen(true) }
  function openEdit(row) { setEditingId(row.id); setForm(formFromRow(resource, row)); setEditorOpen(true) }
  function closeEditor() { setEditorOpen(false); setEditingId(null); setForm({}) }
  function signOut() { auth.logout(); navigate('/login') }
  const superAdminNavItems = [
    { id: 'sa-overview', label: 'OVERVIEW', icon: <Icon><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></Icon> },
    { id: 'sa-workspaces', label: 'WORKSPACES', icon: <Icon><path d="M3 21h18M6 21V3h12v18M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" /></Icon> },
    { id: 'sa-plans', label: 'PLANS', icon: <Icon><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></Icon> },
    { id: 'sa-users', label: 'USERS', icon: <Icon><circle cx="9" cy="8" r="3" /><path d="M3 20c.5-3.4 2.5-5 6-5s5.5 1.6 6 5M16 5c2.5.5 3.5 2 3.5 4M17 15c2.5.5 3.5 2 4 5" /></Icon> },
    { id: 'sa-memberships', label: 'MEMBERSHIPS', icon: <Icon><path d="M4 5h16v14H4zM8 9h8M8 13h5" /></Icon> },
    { id: 'sa-roles', label: 'ROLES', icon: <Icon><path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7z" /></Icon> },
    { id: 'sa-vehicle-presets', label: 'VEHICLE PRESETS', icon: <Icon><path d="M3 16v-3l2-5h14l2 5v3M5 16v2M19 16v2M6 13h12" /><circle cx="6" cy="16" r="1.5" /><circle cx="18" cy="16" r="1.5" /></Icon> },
  ]
  const activeNav = resource === 'workspaces' ? 'sa-workspaces' : `sa-${resource}`
  function handleNav(id) {
    if (id === 'sa-overview') navigate('/super-admin')
    else navigate(`/super-admin/${id.replace('sa-', '')}`)
  }

  return (
    <main className={`dashboard-shell super-admin-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <DashboardHeader
        subtitle="SUPER ADMIN"
        syncState={syncState}
        pending={pending}
        profileName={user?.username ?? 'Platform Admin'}
        roleLabel="Super Admin"
        profilePath="/super-admin"
        onSignOut={signOut}
      />
      <Sidebar items={superAdminNavItems} activeTab={activeNav} onTabChange={handleNav} collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} title="PLATFORM" subtitle="Super Admin" ariaLabel="Platform sections" footer={<div className="sidebar-footer-copy"><small>ACCESS LEVEL</small><strong>SUPER ADMIN</strong></div>} />
      <section className="dashboard-content super-admin-content super-admin-page-content">
        <Link className="super-admin-back-link" to="/super-admin">← Platform overview</Link>
        <div className="super-admin-hero"><div><p className="eyebrow">SUPER ADMIN / {resource.toUpperCase()}</p><h1>{section.title}</h1><p className="super-admin-section-description">{section.description}</p></div><span className="live-pill"><i /> PROTECTED</span></div>
        {error && <div className="dashboard-notice" role="alert">{error}</div>}
        <section className="panel super-admin-panel super-admin-manager">
          <div className="panel-title"><h2>All {resource}</h2><b>{rows.length} RECORDS</b></div>
          {!section.readOnly && <button className="super-admin-create-button" type="button" onClick={openCreate}>+ Add {section.singular}</button>}
          <div className="super-admin-list">
            {rows.length ? rows.map((row) => {
              const title = row.name ?? row.username ?? row.workspace_name ?? row.key ?? row.id
              const detail = rowDetail(resource, row)
              return <div key={row.id} className={row.is_active === false ? 'is-inactive' : ''}><span>{title}<small>{detail}</small></span><strong>{row.is_active === false ? 'Inactive' : <><button type="button" onClick={() => openEdit(row)}>{section.readOnly ? 'View' : 'Edit'}</button>{!section.readOnly && <button type="button" onClick={() => setDeleteId(row.id)}>Delete</button>}</>}</strong></div>
            }) : <p className="super-admin-empty">{loading ? 'Loading records…' : 'No records found.'}</p>}
          </div>
        </section>
      </section>

      {editorOpen && <div className="super-admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor() }}>
        <section className="super-admin-dialog" role="dialog" aria-modal="true" aria-labelledby="editor-title">
          <div className="panel-title"><h2 id="editor-title">{editingId ? (section.readOnly ? 'View role' : 'Edit record') : `Add ${section.singular}`}</h2><button type="button" onClick={closeEditor} aria-label="Close">×</button></div>
          <form className="super-admin-form" onSubmit={submit}>
            {fields(resource, form, editingId, setField, refs)}
            {section.readOnly
              ? <div className="super-admin-dialog-actions"><button type="button" onClick={closeEditor}>Close</button></div>
              : <>
                <CheckRow label="Active" hint={resource === 'plans' ? 'Inactive packages disappear from sign-up and the landing page.' : undefined} checked={form.is_active ?? true} onChange={(value) => setField('is_active', value)} />
                <div className="super-admin-dialog-actions"><button type="button" onClick={closeEditor}>Cancel</button><button type="submit" disabled={loading}>{editingId ? 'Save changes' : 'Create'}</button></div>
              </>}
          </form>
        </section>
      </div>}

      {deleteId !== null && <div className="super-admin-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteId(null) }}>
        <section className="super-admin-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <div className="panel-title"><h2 id="delete-title">Delete record?</h2><button type="button" onClick={() => setDeleteId(null)} aria-label="Close">×</button></div>
          <p>This will deactivate the selected {section.singular}. This action can affect access immediately.</p>
          <div className="super-admin-dialog-actions"><button type="button" onClick={() => setDeleteId(null)}>Cancel</button><button className="danger-button" type="button" disabled={loading} onClick={() => deactivate(deleteId)}>Delete</button></div>
        </section>
      </div>}
    </main>
  )
}
