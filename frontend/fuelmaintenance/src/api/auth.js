// Auth API client — Django token endpoints through one module.
// Set VITE_USE_MOCK_AUTH=true for a clearly marked offline demo that never
// touches the network; otherwise all calls hit the Django backend.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:8000')
const USE_MOCK = import.meta.env.VITE_USE_MOCK_AUTH === 'true'

const LOGIN_PATH = '/api/v1/auth/login/'
const REGISTER_PATH = '/api/v1/auth/register/'
const REFRESH_PATH = '/api/v1/auth/refresh/'
const PLANS_PUBLIC_PATH = '/api/v1/auth/plans/public/'
const ORGANIZATIONS_PUBLIC_PATH = '/api/v1/auth/organizations/public/'

const ACCESS_TOKEN_KEY = 'fuelmaintenance.accessToken'
const REFRESH_TOKEN_KEY = 'fuelmaintenance.refreshToken'
const USER_KEY = 'fuelmaintenance.user'
const ACTIVE_WORKSPACE_KEY = 'fuelmaintenance.activeWorkspace'
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

async function authenticatedGet(path, workspaceId = null) {
  const token = readToken()
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  // Scopes the request to one workspace; omitting it means "personal".
  if (workspaceId) headers['X-Workspace'] = String(workspaceId)
  const response = await fetch(`${API_BASE_URL}${path}`, { headers })
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

async function publicGet(path, fallbackMessage) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`)
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.')
  }
  if (!response.ok) throw new Error(fallbackMessage)
  return response.json()
}

/** Return active plans/packages shown on the registration page (no auth). */
export function getPublicPlans() {
  return publicGet(PLANS_PUBLIC_PATH, 'Unable to load packages right now.')
}

/** Return organizations selectable when joining during registration (no auth). */
export function getPublicOrganizations() {
  return publicGet(ORGANIZATIONS_PUBLIC_PATH, 'Unable to load organizations right now.')
}

/**
 * Create a user account. Pass an options object for organization registration:
 * { accountType: 'organization', organizationId } to join an existing org, or
 * { accountType: 'organization', organizationName, planId } to create one.
 */
export async function register(username, email, password, options = {}) {
  const body = { username, email, password }
  if (options.accountType === 'organization') {
    body.account_type = 'organization'
    if (options.organizationId) body.organization_id = options.organizationId
    if (options.organizationName) body.organization_name = options.organizationName
    if (options.planId) body.plan_id = options.planId
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${REGISTER_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
      const data = { access: 'mock-access-token', refresh: 'mock-refresh-token', username, user: { is_superuser: false, username } }
      storage(remember).setItem(ACCESS_TOKEN_KEY, data.access)
      storage(remember).setItem(REFRESH_TOKEN_KEY, data.refresh)
      storage(remember).setItem(USER_KEY, JSON.stringify(data.user))
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
  if (data.user) storage(remember).setItem(USER_KEY, JSON.stringify(data.user))
  // Clear any stale workspace choice from a previous user/session so the
  // next access snapshot establishes the correct default for this user.
  try {
    localStorage.removeItem(ACTIVE_WORKSPACE_KEY)
    sessionStorage.removeItem(ACTIVE_WORKSPACE_KEY)
  } catch {
    /* storage unavailable — nothing to clear */
  }
  return data
}

/** Exchange the stored refresh token for a new access token. Returns the new access token or null on failure. */
export async function refresh() {
  const stored = readToken()
  let refreshToken = null
  try {
    refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) ?? sessionStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    /* storage unavailable — nothing to read */
  }
  if (!stored || !refreshToken) return null
  let response
  try {
    response = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    })
  } catch {
    return null
  }
  if (!response.ok) return null
  const data = await response.json().catch(() => ({}))
  if (data.access) {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access)
      sessionStorage.setItem(ACCESS_TOKEN_KEY, data.access)
    } catch {
      /* storage unavailable — token not persisted */
    }
  }
  return data.access ?? null
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
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
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(ACTIVE_WORKSPACE_KEY)
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(ACTIVE_WORKSPACE_KEY)
  } catch {
    /* storage unavailable — nothing to clear */
  }
}
