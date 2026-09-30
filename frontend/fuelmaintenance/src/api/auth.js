// Auth API client for the web frontend — see build guide §2 (one file per
// resource under src/api/).
//
// Endpoint contract (Django backend, not built yet — Phase 1):
//   POST /api/v1/auth/login/     body: { username, password }
//   200 → { access, refresh, username, ... }
//   401 → invalid credentials
//
// The API base URL is read from VITE_API_BASE_URL (see .env in
// frontend/fuelmaintenance/) and defaults to the local Django dev server.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const LOGIN_PATH = '/api/v1/auth/login/'

const ACCESS_TOKEN_KEY = 'fuelmaintenance.accessToken'
const REFRESH_TOKEN_KEY = 'fuelmaintenance.refreshToken'

/** Sign in with a username + password; stores tokens and returns the payload. */
export async function login(username, password) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${LOGIN_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
  } catch {
    throw new Error(
      'Cannot reach the server. Check your connection and try again.',
    )
  }

  if (response.status === 401) {
    throw new Error('Incorrect username or password.')
  }
  if (!response.ok) {
    throw new Error('Sign in failed. Please try again.')
  }

  const data = await response.json()
  if (data.access) localStorage.setItem(ACCESS_TOKEN_KEY, data.access)
  if (data.refresh) localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh)
  return data
}

/** Whether a session token is already stored locally. */
export function hasSession() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) !== null
}

/** Clear the locally stored session. */
export function logout() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}
