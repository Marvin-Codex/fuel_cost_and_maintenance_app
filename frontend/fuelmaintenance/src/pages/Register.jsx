import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as auth from '../api/auth'
import ThemeToggle from '../components/ui/ThemeToggle'
import { Gauge, RouteAnimation } from '../components/animations'
import { APP_NAME } from '../config/brand'
import './Auth.css'

/** Split-layout registration sharing the auth card styles. */
export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [accountType, setAccountType] = useState('personal')
  const [orgMode, setOrgMode] = useState('join')
  const [organizations, setOrganizations] = useState([])
  const [organizationId, setOrganizationId] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [plans, setPlans] = useState([])
  const [planId, setPlanId] = useState('')
  const [listError, setListError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false)
  useEffect(() => {
    const on = () => setOffline(!navigator.onLine)
    window.addEventListener('online', on)
    window.addEventListener('offline', on)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', on) }
  }, [])
  useEffect(() => {
    if (accountType !== 'organization') return
    let cancelled = false
    Promise.all([auth.getPublicOrganizations(), auth.getPublicPlans()])
      .then(([orgs, planList]) => {
        if (cancelled) return
        setOrganizations(Array.isArray(orgs) ? orgs : [])
        setPlans(Array.isArray(planList) ? planList : [])
        setListError('')
      })
      .catch((err) => { if (!cancelled) setListError(err instanceof Error ? err.message : 'Unable to load organizations and packages.') })
    return () => { cancelled = true }
  }, [accountType])
  function update(e) { setForm({ ...form, [e.target.name]: e.target.value }) }
  async function submit(e) {
    e.preventDefault()
    setError('')
    if (form.username.trim().length < 3) return setError('Username must be at least 3 characters.')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return setError('Enter a valid email address.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')

    const options = { accountType }
    if (accountType === 'organization') {
      if (orgMode === 'join') {
        if (!organizationId) return setError('Select an organization to join.')
        options.organizationId = organizationId
      } else {
        if (organizationName.trim().length < 2) return setError('Organization name must be at least 2 characters.')
        if (!planId) return setError('Choose a package for your organization.')
        options.organizationName = organizationName.trim()
        options.planId = planId
      }
    }

    setSubmitting(true)
    try {
      await auth.register(form.username.trim(), form.email.trim(), form.password, options)
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <main className="fm-auth">
      <div className="fm-auth-form">
        <section className="fm-auth-card" aria-labelledby="register-title">
          <div className="fm-auth-brand">
            <p className="fm-eyebrow">{APP_NAME}</p>
            <h1 id="register-title">Create your account</h1>
            <p>Start tracking your vehicle costs today.</p>
          </div>
          <form className="login-form" onSubmit={submit} noValidate>
            <fieldset className="fm-fieldset">
              <legend>Account type</legend>
              <div className="fm-choice-grid">
                <label className={`fm-choice-card${accountType === 'personal' ? ' fm-choice-card--selected' : ''}`}>
                  <input type="radio" name="accountType" value="personal" checked={accountType === 'personal'} onChange={() => setAccountType('personal')} disabled={submitting} />
                  <strong>Personal</strong>
                  <span>Track your own vehicles.</span>
                </label>
                <label className={`fm-choice-card${accountType === 'organization' ? ' fm-choice-card--selected' : ''}`}>
                  <input type="radio" name="accountType" value="organization" checked={accountType === 'organization'} onChange={() => setAccountType('organization')} disabled={submitting} />
                  <strong>Organization</strong>
                  <span>Join a fleet or set one up.</span>
                </label>
              </div>
            </fieldset>

            {accountType === 'organization' && (
              <fieldset className="fm-fieldset">
                <legend>Organization</legend>
                <div className="fm-segmented" role="group" aria-label="Organization setup">
                  <button type="button" className={orgMode === 'join' ? 'selected' : ''} aria-pressed={orgMode === 'join'} onClick={() => setOrgMode('join')} disabled={submitting}>Join existing</button>
                  <button type="button" className={orgMode === 'create' ? 'selected' : ''} aria-pressed={orgMode === 'create'} onClick={() => setOrgMode('create')} disabled={submitting}>Create new</button>
                </div>
                {listError && <p className="form-banner form-banner--error" role="alert">{listError}</p>}
                {orgMode === 'join' ? (
                  <div className="form-field">
                    <label htmlFor="register-organization">Organization</label>
                    <select id="register-organization" value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} disabled={submitting}>
                      <option value="">{organizations.length ? 'Select an organization' : 'Loading organizations...'}</option>
                      {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="form-field">
                      <label htmlFor="register-org-name">Organization name</label>
                      <input id="register-org-name" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="e.g. Kampala Fleet Services" disabled={submitting} />
                    </div>
                    <div className="fm-fieldset">
                      <span className="fm-legend">Package</span>
                      {plans.length === 0 && !listError && <p className="fm-hint">Loading packages...</p>}
                      <div className="fm-plan-grid">
                        {plans.map((plan) => (
                          <label key={plan.id} className={`fm-plan-card${planId === plan.id ? ' fm-plan-card--selected' : ''}`}>
                            <input type="radio" name="planId" value={plan.id} checked={planId === plan.id} onChange={() => setPlanId(plan.id)} disabled={submitting} />
                            <strong>{plan.name}</strong>
                            <span>{plan.description}</span>
                            <ul>{(plan.features || []).map((feature) => <li key={feature}>{feature}</li>)}</ul>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </fieldset>
            )}

            <div className="form-field"><label htmlFor="register-username">Username</label><input id="register-username" name="username" value={form.username} onChange={update} required minLength={3} maxLength={150} placeholder="e.g. jane.doe" disabled={submitting} /></div>
            <div className="form-field"><label htmlFor="register-email">Email</label><input id="register-email" type="email" name="email" value={form.email} onChange={update} required placeholder="you@example.com" disabled={submitting} /></div>
            <div className="form-field"><label htmlFor="register-password">Password</label><div className="input-wrap"><input id="register-password" type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={update} required placeholder="At least 8 characters" disabled={submitting} /><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((v) => !v)}>{showPassword ? 'Hide' : 'Show'}</button></div></div>
            <div className="form-field"><label htmlFor="register-confirm">Confirm password</label><input id="register-confirm" type={showPassword ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={update} required placeholder="Repeat your password" disabled={submitting} /></div>
            {error && <p className="form-banner form-banner--error" role="alert">{error}</p>}
            <button className="login-submit" disabled={submitting}>{submitting ? 'Creating account...' : 'Create account'}</button>
          </form>
          {offline && <p className="fm-offline-note" role="status">You appear to be offline. This page renders offline, but registration needs the network to reach the server.</p>}
          <p className="auth-switch">Already registered? <Link className="auth-link" to="/login">Sign in</Link></p>
          <p className="auth-home"><Link className="auth-link auth-link--muted" to="/">Back to home</Link> · <ThemeToggle /></p>
        </section>
      </div>
      <aside className="fm-auth-art fm-map-grid" aria-hidden="true">
        <div className="fm-auth-art-inner">
          <h2>Built for cars, bikes and bad networks.</h2>
          <p>Record fuel and trips with zero bars. Sync when you are back online.</p>
          <RouteAnimation chips={['Offline-ready', 'UGX costs', 'L/100 km']} />
          <div className="fm-auth-gauges">
            <Gauge label="Trips synced" value={86} max={100} display="86" />
            <Gauge label="Uptime offline" value={100} max={100} display="100%" />
          </div>
        </div>
      </aside>
    </main>
  )
}
