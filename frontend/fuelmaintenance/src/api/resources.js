// Customer resource client — vehicles, fuel, trips, maintenance, dashboard summary.
//
// Every call sends the JWT plus the active workspace header, because the
// backend scopes all data to the workspace and re-checks permissions.
// Reads need `*.view`; writes need `*.add` / `*.edit` / `*.delete`.
// The server is the verdict: 403 means "not allowed", 400 carries validation.

import { getActiveWorkspaceId } from './access'
import * as auth from './auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:8000')

function headers(workspaceId, json = false) {
  const token = auth.readToken()
  const out = {}
  if (token) out.Authorization = `Bearer ${token}`
  const workspace = workspaceId ?? getActiveWorkspaceId()
  if (workspace) out['X-Workspace'] = String(workspace)
  if (json) out['Content-Type'] = 'application/json'
  return out
}

function firstErrorMessage(data, fallback) {
  if (data && typeof data === 'object') {
    if (typeof data.detail === 'string') return data.detail
    const nested = Object.values(data).flat().find((value) => typeof value === 'string')
    if (nested) return nested
  }
  return fallback
}

async function request(path, { method = 'GET', body, workspaceId, errorMessage } = {}) {
  async function doFetch() {
    try {
      return await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: headers(workspaceId, body !== undefined),
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch {
      throw new Error('Cannot reach the server. Check your connection and try again.')
    }
  }
  let response = await doFetch()
  if (response.status === 401) {
    const refreshed = await auth.refresh()
    if (refreshed) {
      response = await doFetch()
    } else {
      auth.logout()
      if (typeof window !== 'undefined') window.location.assign('/login')
      throw new Error('Your session expired. Please sign in again.')
    }
  }
  if (response.status === 401) {
    auth.logout()
    if (typeof window !== 'undefined') window.location.assign('/login')
    throw new Error('Your session expired. Please sign in again.')
  }
  if (response.status === 403) {
    const data = await response.json().catch(() => ({}))
    throw new Error(firstErrorMessage(data, 'You do not have permission for this action.'))
  }
  if (response.status === 404) throw new Error('That record no longer exists.')
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(firstErrorMessage(data, errorMessage || 'The request failed.'))
  return data
}

/** DRF paginates lists as { results: [...] }; plain arrays pass through. */
export function unwrapList(data) {
  if (Array.isArray(data)) return data
  return data?.results ?? []
}

function query(params) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

/* Vehicles */

export async function listVehicles(options = {}) {
  return unwrapList(await request('/api/v1/vehicles/', { ...options, errorMessage: 'Unable to load vehicles.' }))
}

export function createVehicle(payload, options = {}) {
  return request('/api/v1/vehicles/', { ...options, method: 'POST', body: payload, errorMessage: 'Unable to add the vehicle.' })
}

export function activateVehicle(vehicleId, options = {}) {
  return request(`/api/v1/vehicles/${encodeURIComponent(vehicleId)}/activate/`, {
    ...options,
    method: 'POST',
    errorMessage: 'Unable to select the vehicle.',
  })
}

export function updateVehicle(id, payload, options = {}) {
  return request(`/api/v1/vehicles/${id}/`, { ...options, method: 'PATCH', body: payload, errorMessage: 'Unable to update the vehicle.' })
}

export function deleteVehicle(id, options = {}) {
  return request(`/api/v1/vehicles/${id}/`, { ...options, method: 'DELETE', errorMessage: 'Unable to remove the vehicle.' })
}

/* Dashboard summary (per selected vehicle, from real aggregates) */

export function fetchDashboardSummary(vehicleId, options = {}) {
  return request(`/api/v1/dashboard/summary/${query({ vehicle: vehicleId })}`, {
    ...options,
    errorMessage: 'Unable to load the dashboard summary.',
  })
}

/* Fuel records */

export function listFuelRecords(params = {}, options = {}) {
  return request(`/api/v1/fuel-records/${query(params)}`, { ...options, errorMessage: 'Unable to load fuel records.' })
    .then(unwrapList)
}

export function createFuelRecord(payload, options = {}) {
  return request('/api/v1/fuel-records/', { ...options, method: 'POST', body: payload, errorMessage: 'Unable to log the fill-up.' })
}

/* Trips */

export function listTrips(params = {}, options = {}) {
  return request(`/api/v1/trips/${query(params)}`, { ...options, errorMessage: 'Unable to load trips.' })
    .then(unwrapList)
}

export function createTrip(payload, options = {}) {
  return request('/api/v1/trips/', { ...options, method: 'POST', body: payload, errorMessage: 'Unable to log the trip.' })
}

/* Maintenance */

export function listMaintenanceRecords(params = {}, options = {}) {
  return request(`/api/v1/maintenance-records/${query(params)}`, { ...options, errorMessage: 'Unable to load maintenance records.' })
    .then(unwrapList)
}

export function createMaintenanceRecord(payload, options = {}) {
  return request('/api/v1/maintenance-records/', { ...options, method: 'POST', body: payload, errorMessage: 'Unable to log the service.' })
}

export function listMaintenanceReminders(params = {}, options = {}) {
  return request(`/api/v1/maintenance-reminders/${query(params)}`, { ...options, errorMessage: 'Unable to load reminders.' })
    .then(unwrapList)
}

export function listUpcomingReminders(params = {}, options = {}) {
  return request(`/api/v1/maintenance-reminders/upcoming/${query(params)}`, { ...options, errorMessage: 'Unable to load upcoming reminders.' })
    .then(unwrapList)
}

export function completeMaintenanceReminder(id, options = {}) {
  return request(`/api/v1/maintenance-reminders/${id}/complete/`, {
    ...options,
    method: 'POST',
    errorMessage: 'Unable to complete the reminder.',
  })
}

/* Server-side summaries (same aggregates the overview cards use) */

export function fetchFuelSummary(params = {}, options = {}) {
  return request(`/api/v1/fuel-records/summary/${query(params)}`, { ...options, errorMessage: 'Unable to load the fuel summary.' })
}

export function fetchTripSummary(params = {}, options = {}) {
  return request(`/api/v1/trips/summary/${query(params)}`, { ...options, errorMessage: 'Unable to load the trip summary.' })
}

export function fetchMaintenanceSummary(params = {}, options = {}) {
  return request(`/api/v1/maintenance-records/summary/${query(params)}`, { ...options, errorMessage: 'Unable to load the maintenance summary.' })
}

/* Workspace preferences (units, currency, language, alerts, thresholds) */

export function fetchPreferences(options = {}) {
  return request('/api/v1/system/preferences/', { ...options, errorMessage: 'Unable to load your preferences.' })
}

export function updatePreferences(payload, options = {}) {
  return request('/api/v1/system/preferences/', {
    ...options,
    method: 'PATCH',
    body: payload,
    errorMessage: 'Unable to save your preferences.',
  })
}

/** Download the workspace data export as a CSV file (needs `analytics.export`). */
export async function downloadDataExport() {
  async function doFetch() {
    const accessToken = auth.readToken()
    const headers = {}
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    const workspace = getActiveWorkspaceId()
    if (workspace) headers['X-Workspace'] = String(workspace)
    try {
      return await fetch(`${API_BASE_URL}/api/v1/system/export/`, { headers })
    } catch {
      throw new Error('Cannot reach the server. Export is unavailable right now.')
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
  if (response.status === 401) {
    auth.logout()
    if (typeof window !== 'undefined') window.location.assign('/login')
    throw new Error('Your session expired. Please sign in again.')
  }
  if (response.status === 403) throw new Error('You do not have permission to export workspace data.')
  if (!response.ok) throw new Error('The export failed. Please try again.')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'vehicle-data-export.csv'
  link.click()
  URL.revokeObjectURL(url)
}
