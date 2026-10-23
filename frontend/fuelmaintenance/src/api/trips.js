import { authenticatedFetch } from './auth'

async function request(path, { method = 'GET', body } = {}) {
  let response
  try {
    response = await authenticatedFetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Cannot reach the server. Check your connection and try again.')
  }

  const data = response.status === 204
    ? null
    : await response.json().catch(() => null)
  if (!response.ok) {
    const detail = data?.detail
      ?? Object.values(data ?? {}).flat(Infinity).find((value) => typeof value === 'string')
    throw new Error(detail || `Trip request failed (${response.status}).`)
  }
  return data
}

function queryString(filters = {}) {
  const params = new URLSearchParams()
  if (filters.vehicle) params.set('vehicle', filters.vehicle)
  if (filters.dateFrom) params.set('date_from', filters.dateFrom)
  if (filters.dateTo) params.set('date_to', filters.dateTo)
  return params.toString()
}

async function getAll(path) {
  const records = []
  let nextPath = path
  while (nextPath) {
    const page = await request(nextPath)
    records.push(...(Array.isArray(page) ? page : page.results ?? []))
    nextPath = !Array.isArray(page) && page.next
      ? new URL(page.next, window.location.origin).pathname
        + new URL(page.next, window.location.origin).search
      : null
  }
  return records
}

export function listTrips(filters) {
  const query = queryString(filters)
  return getAll(`/api/v1/trips/${query ? `?${query}` : ''}`)
}

export function getTripSummary(filters) {
  const query = queryString(filters)
  return request(`/api/v1/trips/summary/${query ? `?${query}` : ''}`)
}

export function startTrip({ vehicle, start_location, destination }) {
  return request('/api/v1/trips/', {
    method: 'POST',
    body: { vehicle, start_location, destination },
  })
}

export function completeTrip(tripId, endOdometerKm) {
  return request(`/api/v1/trips/${tripId}/`, {
    method: 'PATCH',
    body: {
      end_odometer_km: Number(endOdometerKm),
    },
  })
}
