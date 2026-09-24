import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as auth from '../api/auth'

// Mirrors Django's default User.username rules: letters, digits and @ . + - _
const USERNAME_PATTERN = /^[\w.@+-]{3,150}$/

/**
 * Sign-in form. Validates locally, then calls the auth API (src/api/auth.js).
 * The Django auth endpoint is not built yet (backend Phase 1), so a healthy
 * submit currently shows the "Cannot reach server" message; this form is ready
 * to authenticate the moment the backend ships.
 */
export default function LoginForm() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    if (!username.trim()) return 'Enter your username.'
    if (!USERNAME_PATTERN.test(username.trim())) {
      return 'Username must be 3–150 characters (letters, digits, @ . + - _).'
    }
    if (!password) return 'Enter your password.'
    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setNotice('')

    const validationMessage = validate()
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await auth.login(username.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Sign in failed. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="username">Username</label>
        <div className="input-wrap">
          <span className="input-icon" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="e.g. jane.doe"
            maxLength={150}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={submitting}
            required
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="password">Password</label>
        <div className="input-wrap">
          <span className="input-icon" aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
            required
          />
          <button
            type="button"
            className="password-toggle"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {showPassword ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M1 1l22 22" />
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <p className="form-banner form-banner--error" role="alert">
          {error}
        </p>
      )}

      {notice && (
        <p className="form-banner form-banner--success" role="status">
          {notice}
        </p>
      )}

      <button type="submit" className="login-submit" disabled={submitting}>
        {submitting && <span className="spinner" aria-hidden="true" />}
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
