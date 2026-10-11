// Auth API client — Django token endpoints through one module.
// Set VITE_USE_MOCK_AUTH=true for a clearly marked offline demo that never
// touches the network; otherwise all calls hit the Django backend.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const USE_MOCK = import.meta.env.VITE_USE_MOCK_AUTH === 'true'

const LOGIN_PATH = '/api/v1/auth/login/'
const REGISTER_PATH = '/api/v1/auth/register/'

const ACCESS_TOKEN_KEY = 'fuelmaintenance.accessToken'
const REFRESH_TOKEN_KEY = 'fuelmaintenance.refreshToken'
const ORGANIZATIONS_PATH = '/api/v1/auth/organizations/'

// "Remember me" off → sessionStorage so the session ends with the tab.
function storage(remember) {
  try {
    return remember ? localStorage : sessionStorage
  } catch {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  }
}

function readToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY) ?? sessionStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

async function authenticatedGet(path) {
  const token = readToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) throw new Error('Unable to load account information.')
  return response.json()
}

/** Return organizations available to the signed-in user. */
export function getOrganizations() {
  return authenticatedGet(ORGANIZATIONS_PATH)
}

/** Return the current active subscription for an organization. */
export function getSubscription(organizationId) {
  return authenticatedGet(`${ORGANIZATIONS_PATH}${organizationId}/subscription/`)
}

/** Create a user account. */
export async function register(username, email, password) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${REGISTER_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    })
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.')
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = Object.values(data).flat().find((value) => typeof value === 'string')
    throw new Error(message || 'Registration failed. Please check your details.')
  }
  return data
}

/** Sign in with a username + password; stores tokens and returns the payload. */
export async function login(username, password, { remember = true } = {}) {
  if (USE_MOCK) {
    // Clearly marked mock adapter — demo only, no network.
    await new Promise((resolve) => setTimeout(resolve, 500))
    if (username === 'demo' && password === 'demo1234') {
      const data = { access: 'mock-access-token', refresh: 'mock-refresh-token', username }
      storage(remember).setItem(ACCESS_TOKEN_KEY, data.access)
      storage(remember).setItem(REFRESH_TOKEN_KEY, data.refresh)
      return { ...data, mocked: true }
    }
    throw new Error('Mock auth: use demo / demo1234, or unset VITE_USE_MOCK_AUTH for the real backend.')
  }
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
  if (data.access) storage(remember).setItem(ACCESS_TOKEN_KEY, data.access)
  if (data.refresh) storage(remember).setItem(REFRESH_TOKEN_KEY, data.refresh)
  return data
}

/** Whether a session token is already stored locally. */
export function hasSession() {
  return readToken() !== null
}

/** Clear the locally stored session. */
export function logout() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    /* storage unavailable — nothing to clear */
  }
}
