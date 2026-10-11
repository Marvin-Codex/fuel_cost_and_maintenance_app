import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as auth from '../api/auth'
import './Login.css'

/** Dashboard-themed registration page sharing the auth card styles. */
export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
    setSubmitting(true)
    try {
      await auth.register(form.username.trim(), form.email.trim(), form.password)
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="register-title">
        <div className="login-brand">
          <p className="login-eyebrow">FUELMAINTENANCE</p>
          <h1 className="login-title" id="register-title">Create your account</h1>
          <p className="login-subtitle">Start tracking your vehicle costs today.</p>
        </div>
        <form className="login-form" onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="register-username">Username</label>
            <input id="register-username" name="username" value={form.username} onChange={update} required minLength={3} maxLength={150} placeholder="e.g. jane.doe" />
          </div>
          <div className="form-field">
            <label htmlFor="register-email">Email</label>
            <input id="register-email" type="email" name="email" value={form.email} onChange={update} required placeholder="you@example.com" />
          </div>
          <div className="form-field">
            <label htmlFor="register-password">Password</label>
            <input id="register-password" type="password" name="password" value={form.password} onChange={update} required placeholder="At least 8 characters" />
          </div>
          <div className="form-field">
            <label htmlFor="register-confirm">Confirm password</label>
            <input id="register-confirm" type="password" name="confirmPassword" value={form.confirmPassword} onChange={update} required placeholder="Repeat your password" />
          </div>
          {error && <p className="form-banner form-banner--error" role="alert">{error}</p>}
          <button className="login-submit" disabled={submitting}>
            {submitting && <span className="spinner" aria-hidden="true" />}
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">Already registered? <Link className="auth-link" to="/login">Sign in</Link></p>
        <p className="auth-home"><Link className="auth-link auth-link--muted" to="/">← Back to home</Link></p>
      </section>
    </main>
  )
}
