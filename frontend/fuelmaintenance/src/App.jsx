import { Suspense, lazy, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { hasSession, getStoredUser } from './api/auth'
import Landing from './pages/Landing'
import { SkeletonCard } from './components/ui/Feedback'

// Route-level code splitting: heavy/authenticated pages load on demand so the
// public landing shell stays small on slow mobile connections.
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const SuperAdminManage = lazy(() => import('./pages/SuperAdminManage'))

/** Placeholder shown while a lazy route chunk downloads. */
function RouteFallback() {
  return (
    <div className="fm-route-fallback" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="fm-route-fallback-grid">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}

/** Public marketing pages that do not require authentication. */
const PUBLIC_PATHS = ['/', '/login', '/register']

function UseAuthRedirect() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Never redirect users already on a public page.
    if (PUBLIC_PATHS.includes(location.pathname)) return
    if (!hasSession()) {
      // Store the intended destination so we can redirect after login
      const intended = location.pathname + (location.search ? location.search : '')
      // Save intended destination to sessionStorage so it persists across refresh
      try { sessionStorage.setItem('intended_destination', intended) } catch {}
      navigate('/login', { replace: true })
    }
  }, [navigate, location.pathname, location.search])

  return true
}

/** Protected route that checks authentication before rendering. */
function PrivateRoute({ element, ...rest }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const location = useLocation()

  useEffect(() => {
    setIsAuthenticated(hasSession())
  }, [])

  if (isAuthenticated === null) return null // showing nothing while checking

  if (!isAuthenticated) {
    // Store the intended destination so we can redirect after login
    try { sessionStorage.setItem('intended_destination', location.pathname + location.search) } catch {}
    return <Navigate to="/login" replace />
  }

  return element
}

/** Super admin route that checks both authentication and superuser status. */
function SuperAdminRoute({ element, ...rest }) {
  const [isSuperuser, setIsSuperuser] = useState(null)

  useEffect(() => {
    setIsSuperuser(Boolean(getStoredUser()?.is_superuser))
  }, [])

  if (isSuperuser === null) return null // showing nothing while checking

  if (!isSuperuser) {
    return <Navigate to="/dashboard" replace />
  }

  return element
}

/** Public marketing pages and authenticated application routes. */
export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>

      {/* Intended destination handler - check auth on mount and redirect if needed */}
      <UseAuthRedirect />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected dashboard route - redirects to login if no session */}
        <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />

        {/* Super admin route - only for platform superusers */}
        <Route path="/super-admin/:resource?" element={<SuperAdminRoute element={<SuperAdminManage />} />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

