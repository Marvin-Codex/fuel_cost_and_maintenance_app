import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as auth from '../api/auth'

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

  return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-700 p-6"><section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"><div className="mb-7 text-center"><Link className="text-sm font-semibold text-blue-700" to="/">← FuelMaintenance</Link><h1 className="mt-5 text-2xl font-bold text-slate-900">Create your account</h1><p className="mt-2 text-sm text-slate-500">Start tracking your vehicle costs today.</p></div><form className="space-y-4" onSubmit={submit}><label className="block text-sm font-semibold text-slate-700">Username<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" name="username" value={form.username} onChange={update} required minLength={3} maxLength={150} /></label><label className="block text-sm font-semibold text-slate-700">Email<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" type="email" name="email" value={form.email} onChange={update} required /></label><label className="block text-sm font-semibold text-slate-700">Password<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" type="password" name="password" value={form.password} onChange={update} required /></label><label className="block text-sm font-semibold text-slate-700">Confirm password<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" type="password" name="confirmPassword" value={form.confirmPassword} onChange={update} required /></label>{error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}<button className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</button></form><p className="mt-5 text-center text-sm text-slate-600">Already registered? <Link className="font-semibold text-blue-700" to="/login">Sign in</Link></p></section></main>
}
