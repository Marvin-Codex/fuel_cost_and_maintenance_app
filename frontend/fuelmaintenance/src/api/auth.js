// Auth API client — Django token endpoints through one module.
// Set VITE_USE_MOCK_AUTH=true for a clearly marked offline demo that never
// touches the network; otherwise all calls hit the Django backend.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const USE_MOCK = import.meta.env.VITE_USE_MOCK_AUTH === 'true'

const LOGIN_PATH = '/api/v1/auth/login/'
const REGISTER_PATH = '/api/v1/auth/register/'
const REFRESH_PATH = '/api/v1/auth/refresh/'
const ORGANIZATIONS_PATH = '/api/v1/auth/organizations/'

const ACCESS_TOKEN_KEY = 'fuelmaintenance.accessToken'
const REFRESH_TOKEN_KEY = 'fuelmaintenance.refreshToken'
let refreshInProgress = null

// "Remember me" off → sessionStorage so the session ends with the tab.
function storage(remember) {
  try {
    return remember ? localStorage : sessionStorage
  } catch {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} }
  }
}

function readSession() {
  try {
    for (const store of [localStorage, sessionStorage]) {
      const access = store.getItem(ACCESS_TOKEN_KEY)
      if (access) {
        return {
          access,
          refresh: store.getItem(REFRESH_TOKEN_KEY),
          store,
        }
      }
    }
  } catch {
    return null
  }
  return null
}

function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch {
    // Storage may be unavailable in privacy-restricted browser contexts.
  }
}

function saveTokens(access, refresh, targetStore) {
  clearTokens()
  try {
    targetStore.setItem(ACCESS_TOKEN_KEY, access)
    if (refresh) targetStore.setItem(REFRESH_TOKEN_KEY, refresh)
  } catch {
    throw new Error('Unable to store your sign-in session. Check browser storage settings.')
  }
}

function expireSession() {
  clearTokens()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('fuelmaintenance:auth-expired'))
  }
}

async function refreshAccessToken() {
  if (!refreshInProgress) {
    refreshInProgress = (async () => {
      const session = readSession()
      if (!session?.refresh) {
        expireSession()
        throw new Error('Your session has expired. Sign in again.')
      }

      let response
      try {
        response = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: session.refresh }),
        })
      } catch {
        throw new Error('Cannot refresh your session. Check your connection and try again.')
      }

      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.access) {
        expireSession()
        throw new Error('Your session has expired. Sign in again.')
      }
      saveTokens(data.access, data.refresh ?? session.refresh, session.store)
      return data.access
    })()
  }

  try {
    return await refreshInProgress
  } finally {
    refreshInProgress = null
  }
}

/** Fetch an authenticated API resource and refresh an expired access token once. */
export async function authenticatedFetch(path, options = {}) {
  if (USE_MOCK) {
    throw new Error(
      'Vehicle data cannot be saved in mock-auth mode. Disable VITE_USE_MOCK_AUTH and sign in to the backend.',
    )
  }

  const send = (token) => {
    const headers = new Headers(options.headers ?? {})
    headers.set('Authorization', `Bearer ${token}`)
    return fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  }

  const session = readSession()
  if (!session?.access) {
    expireSession()
    throw new Error('Sign in again to continue.')
  }

  const response = await send(session.access)
  if (response.status !== 401) return response
  return send(await refreshAccessToken())
}

async function authenticatedGet(path) {
  const response = await authenticatedFetch(path)
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
    await new Promise((resolve) => setTimeout(resolve, 500))
    if (username === 'demo' && password === 'demo1234') {
      const data = { access: 'mock-access-token', refresh: 'mock-refresh-token', username }
      saveTokens(data.access, data.refresh, storage(remember))
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
    throw new Error('Cannot reach the server. Check your connection and try again.')
  }

  if (response.status === 401) throw new Error('Incorrect username or password.')
  if (!response.ok) throw new Error('Sign in failed. Please try again.')

  const data = await response.json()
  if (data.access && data.refresh) {
    saveTokens(data.access, data.refresh, storage(remember))
  }
  return data
}

/** Whether a session token is already stored locally. */
export function hasSession() {
  return Boolean(readSession()?.access)
}

/** Clear the locally stored session. */
export function logout() {
  clearTokens()
}
