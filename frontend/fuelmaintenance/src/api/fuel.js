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
    throw new Error(detail || `Fuel request failed (${response.status}).`)
  }
  return data
}

function filtersToQuery(filters = {}) {
  const params = new URLSearchParams()
  if (filters.vehicle) params.set('vehicle', filters.vehicle)
  if (filters.dateFrom) params.set('date_from', filters.dateFrom)
  if (filters.dateTo) params.set('date_to', filters.dateTo)
  if (filters.fuelType) params.set('fuel_type', filters.fuelType)
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

export function listFuelPurchases(filters) {
  const query = filtersToQuery(filters)
  return getAll(`/api/v1/fuel/${query ? `?${query}` : ''}`)
}

export function getFuelSummary(filters) {
  const query = filtersToQuery(filters)
  return request(`/api/v1/fuel/summary/${query ? `?${query}` : ''}`)
}

export function getFuelEfficiency(filters) {
  const query = filtersToQuery(filters)
  return request(`/api/v1/fuel/efficiency/${query ? `?${query}` : ''}`)
}

export function createFuelPurchase(purchase) {
  return request('/api/v1/fuel/', { method: 'POST', body: purchase })
}
