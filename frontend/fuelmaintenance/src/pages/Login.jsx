import LoginForm from '../components/LoginForm'
import './Login.css'

/** Web entry screen — blue-themed login for the Fuel cost and maintenance app. */
export default function Login() {
  return (
    <main className="login-page">
      <div className="login-card">
        <header className="login-brand">
          <div className="login-logo" aria-hidden="true">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
          </div>
          <h1 className="login-title">Fuel cost and maintenance app</h1>
          <p className="login-subtitle">
            Sign in to track fuel, trips and maintenance for your vehicles.
          </p>
        </header>
        <LoginForm />
      </div>
    </main>
  )
}
