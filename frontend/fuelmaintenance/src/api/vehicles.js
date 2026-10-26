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
      ?? Object.values(data ?? {}).flat().find((value) => typeof value === 'string')
    throw new Error(detail || `Vehicle request failed (${response.status}).`)
  }
  return data
}

export async function listVehicles() {
  const vehicles = []
  let page = 1
  let hasNextPage = true
  while (hasNextPage) {
    const response = await request(`/api/v1/vehicles/?page=${page}`)
    vehicles.push(...(Array.isArray(response) ? response : response.results ?? []))
    hasNextPage = Boolean(!Array.isArray(response) && response.next)
    page += 1
  }
  return vehicles
}

export function activateVehicle(vehicleId) {
  return request(`/api/v1/vehicles/${vehicleId}/activate/`, { method: 'POST' })
}

export function createVehicle(vehicle) {
  return request('/api/v1/vehicles/', { method: 'POST', body: vehicle })
}

export function updateVehicle(vehicleId, vehicle) {
  return request(`/api/v1/vehicles/${vehicleId}/`, { method: 'PATCH', body: vehicle })
}

export function deleteVehicle(vehicleId) {
  return request(`/api/v1/vehicles/${vehicleId}/`, { method: 'DELETE' })
}

export function getDashboardSummary(vehicleId) {
  return request(`/api/v1/dashboard/summary/?vehicle=${encodeURIComponent(vehicleId)}`)
}
