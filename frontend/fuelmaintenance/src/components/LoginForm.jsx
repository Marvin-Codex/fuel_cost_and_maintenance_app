import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as auth from '../api/auth'

const USERNAME_PATTERN = /^[\w.@+-]{3,150}$/

/** Sign-in form wired to src/api/auth.js with validation + remember-me. */
export default function LoginForm() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    if (!username.trim()) return 'Enter your username.'
    if (!USERNAME_PATTERN.test(username.trim())) return 'Username must be 3-150 characters (letters, digits, @ . + - _).'
    if (!password) return 'Enter your password.'
    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const message = validate()
    if (message) { setError(message); return }
    setError('')
    setSubmitting(true)
    try {
      await auth.login(username.trim(), password, { remember })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="username">Username</label>
        <input id="username" name="username" type="text" autoComplete="username" placeholder="e.g. jane.doe" maxLength={150} value={username} onChange={(e) => setUsername(e.target.value)} disabled={submitting} required />
      </div>
      <div className="form-field">
        <label htmlFor="password">Password</label>
        <div className="input-wrap">
          <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={submitting} required />
          <button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((v) => !v)}>{showPassword ? 'Hide' : 'Show'}</button>
        </div>
      </div>
      <label className="fm-check"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />Remember me on this device</label>
      {error && <p className="form-banner form-banner--error" role="alert">{error}</p>}
      <button type="submit" className="login-submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in'}</button>
    </form>
  )
}
