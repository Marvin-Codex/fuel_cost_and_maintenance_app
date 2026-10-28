// Access client — the backend snapshot from GET /api/v1/auth/me/access/.
//
// The server decides every right. This module only caches the answer so the
// dashboard can render (and refuse actions) offline. Hide UI from the cached
// permissions, but never trust them: the API returns 403 `permission_denied`
// or `limit_exceeded` and that is the only verdict that counts.

import * as auth from './auth'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:8000')

const MY_ACCESS_PATH = '/api/v1/auth/me/access/'
const SNAPSHOT_KEY = 'fuelmaintenance.accessSnapshot'
const ACTIVE_WORKSPACE_KEY = 'fuelmaintenance.activeWorkspace'

/** Workspaces the user picked, persisted so a reload stays in the same one. */
export function getActiveWorkspaceId() {
  try {
    return localStorage.getItem(ACTIVE_WORKSPACE_KEY)
  } catch {
    return null
  }
}

export function setActiveWorkspaceId(id) {
  try {
    if (id) localStorage.setItem(ACTIVE_WORKSPACE_KEY, String(id))
    else localStorage.removeItem(ACTIVE_WORKSPACE_KEY)
  } catch {
    /* storage unavailable — the choice just won't persist */
  }
  return id ?? null
}

/** The last snapshot we downloaded, or null when this device has none. */
export function getCachedSnapshot() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function cacheSnapshot(payload) {
  try {
    localStorage.setItem(
      SNAPSHOT_KEY,
      JSON.stringify({ fetched_at: new Date().toISOString(), ...payload }),
    )
  } catch {
    /* storage full or blocked — we simply run without an offline cache */
  }
}

/**
 * Download the snapshot. Returns `{ workspaces }` where each entry is:
 * { workspace, plan, role, permissions[], vehicle_scope, limits{key:{limit,used}}, version }
 */
export async function fetchAccessSnapshot() {
  async function doFetch() {
    const token = auth.readToken()
    try {
      return await fetch(`${API_BASE_URL}${MY_ACCESS_PATH}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    } catch {
      throw new Error('Cannot reach the server. Showing your last known access.')
    }
  }
  let response = await doFetch()
  if (response.status === 401) {
    const refreshed = await auth.refresh()
    if (refreshed) response = await doFetch()
    else {
      auth.logout()
      if (typeof window !== 'undefined') window.location.assign('/login')
      throw new Error('You do not have access to this account.')
    }
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error('You do not have access to this account.')
  }
  if (!response.ok) throw new Error('Unable to load your access rights.')
  const body = await response.json()
  const workspaces = Array.isArray(body) ? body : body.workspaces ?? []
  cacheSnapshot({ workspaces, is_superuser: Boolean(body.is_superuser) })
  return {
    workspaces,
    activeWorkspace: body.active_workspace ?? null,
    isSuperuser: Boolean(body.is_superuser),
  }
}

export function forgetAccessCache() {
  try {
    localStorage.removeItem(SNAPSHOT_KEY)
  } catch {
    /* nothing to clear */
  }
}


/** Load platform-wide data for the superadmin console. */
export async function fetchSuperadminOverview() {
  async function doFetch() {
    const token = auth.readToken()
    try {
      return await fetch(`${API_BASE_URL}/api/v1/access/superadmin/overview/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    } catch {
      throw new Error('Cannot reach the server. The platform overview is unavailable.')
    }
  }
  let response = await doFetch()
  if (response.status === 401) {
    const refreshed = await auth.refresh()
    if (refreshed) response = await doFetch()
    else {
      auth.logout()
      if (typeof window !== 'undefined') window.location.assign('/login')
      throw new Error('You are not authorized to view the platform overview.')
    }
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error('You are not authorized to view the platform overview.')
  }
  if (!response.ok) throw new Error('Unable to load the platform overview.')
  return response.json()
}



async function adminRequest(path, options = {}) {
  async function doFetch() {
    const token = auth.readToken()
    const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    if (options.body) headers['Content-Type'] = 'application/json'
    try {
      return await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
    } catch {
      throw new Error('Cannot reach the server.')
    }
  }
  let response = await doFetch()
  if (response.status === 401) {
    const refreshed = await auth.refresh()
    if (refreshed) response = await doFetch()
    else {
      auth.logout()
      if (typeof window !== 'undefined') window.location.assign('/login')
      throw new Error('Your session expired. Please sign in again.')
    }
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = Object.values(data).flat().find((value) => typeof value === 'string')
    throw new Error(detail || data.detail || 'The management request failed.')
  }
  return data
}

export async function listAdmin(resource, params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.append(key, value)
  })
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return adminRequest(`/api/v1/access/${resource}/${suffix}`)
}
export function createAdmin(resource, payload) {
  return adminRequest(`/api/v1/access/${resource}/`, { method: 'POST', body: JSON.stringify(payload) })
}
export function updateAdmin(resource, id, payload) {
  return adminRequest(`/api/v1/access/${resource}/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
}
export function deactivateAdmin(resource, id) {
  return adminRequest(`/api/v1/access/${resource}/${id}/`, { method: 'DELETE' })
}

/** Active vehicle presets any signed-in user can pick from when adding a vehicle. */
export async function listVehiclePresets() {
  const data = await adminRequest('/api/v1/access/vehicle-presets/')
  return Array.isArray(data) ? data : data.results ?? []
}

export async function bulkImportVehiclePresets() {
  return adminRequest('/api/v1/access/vehicle-presets/bulk_import/', { method: 'POST', body: JSON.stringify({}) })
}

/**
 * Reference data for the superadmin pickers: all plans, all memberships'
 * workspaces/users, the template + custom role list, and the permission
 * catalog for entitlement editors. Superuser-only like the rest of the admin API.
 */
export async function fetchAdminReference() {
  const [plansRaw, workspacesRaw, usersRaw, rolesRaw, permissions] = await Promise.all([
    adminRequest('/api/v1/access/plans/'),
    adminRequest('/api/v1/access/super-workspaces/'),
    adminRequest('/api/v1/access/users/'),
    adminRequest('/api/v1/access/super-roles/'),
    adminRequest('/api/v1/access/superadmin/permissions/'),
  ])
  const unwrap = (data) => (Array.isArray(data) ? data : data.results ?? [])
  return {
    plans: unwrap(plansRaw),
    workspaces: unwrap(workspacesRaw),
    users: unwrap(usersRaw),
    roles: unwrap(rolesRaw),
    permissions: Array.isArray(permissions) ? permissions : [],
  }
}

