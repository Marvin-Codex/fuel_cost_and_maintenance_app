import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { SkeletonCard } from './components/ui/Feedback'
import Landing from './pages/Landing'

// Route-level code splitting: heavy/authenticated pages load on demand so the
// public landing shell stays small on slow mobile connections.
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))

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

/** Public marketing pages and authenticated application routes. */
export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/super-admin" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

