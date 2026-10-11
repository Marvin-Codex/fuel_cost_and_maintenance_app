import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LoginForm from '../components/LoginForm'
import ThemeToggle from '../components/ui/ThemeToggle'
import { Gauge, RouteAnimation } from '../components/animations'
import { APP_NAME } from '../config/brand'
import './Auth.css'

/** Split-layout login: form + animated artwork (art hidden on small screens). */
export default function Login() {
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false)
  useEffect(() => {
    const on = () => setOffline(!navigator.onLine)
    window.addEventListener('online', on)
    window.addEventListener('offline', on)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', on) }
  }, [])
  return (
    <main className="fm-auth">
      <div className="fm-auth-form">
        <div className="fm-auth-card">
          <header className="fm-auth-brand">
            <p className="fm-eyebrow">{APP_NAME}</p>
            <h1>Welcome back</h1>
            <p>Sign in to track fuel, trips and maintenance for your vehicles.</p>
          </header>
          <LoginForm />
          {offline && <p className="fm-offline-note" role="status">You appear to be offline. This page renders offline, but sign-in needs the network the first time to reach the server.</p>}
          <p className="auth-switch">New here? <Link className="auth-link" to="/register">Create an account</Link></p>
          <p className="auth-home"><Link className="auth-link auth-link--muted" to="/">Back to home</Link> · <ThemeToggle /></p>
        </div>
      </div>
      <aside className="fm-auth-art fm-map-grid" aria-hidden="true">
        <div className="fm-auth-art-inner">
          <h2>Every litre, every kilometre, accounted for.</h2>
          <p>GPS trips, fuel costs in UGX and service reminders — online or off.</p>
          <RouteAnimation chips={['Trip 42 km', 'Fuel 3.4 L', 'UGX 18,700']} />
          <div className="fm-auth-gauges">
            <Gauge label="Efficiency" value={7.8} max={15} display="7.8" unit="L/100 km" />
            <Gauge label="Fuel level" value={68} max={100} display="68%" />
          </div>
        </div>
      </aside>
    </main>
  )
}
