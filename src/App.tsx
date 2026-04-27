import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'

import Landing       from './pages/Landing'
import Login         from './pages/Login'
import Onboarding    from './pages/Onboarding'
import Dashboard     from './pages/Dashboard'
import Log           from './pages/Log'
import Trends        from './pages/Trends'
import Profile       from './pages/Profile'
import Setup         from './pages/Setup'
import HealthConnect from './pages/HealthConnect'

// ── Protected route wrapper ───────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <>{children}</>
}

// ── Auth callback handler (wildcard fallback) ─────────────────────────────────
// With PKCE flow, Supabase redirects arrive as ?code=xxx on the root URL (/),
// so this component is only hit for genuinely unknown hash paths.
// We show a spinner and wait for the auth state to resolve, then route
// accordingly — this prevents the "Navigate to / replace" from clobbering
// any in-flight auth tokens that arrived via the legacy implicit flow.

function AuthCallback() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return  // still processing — keep spinner up

    if (user) {
      // Strava callback check — preserve ?code= processing
      const params = new URLSearchParams(window.location.search)
      if (params.get('state') === 'strava_oauth') {
        navigate('/health-connect', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } else {
      // No session after Supabase has finished — unknown route, go home
      navigate('/', { replace: true })
    }
  }, [user, loading, navigate])

  // Spinner while auth state resolves
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
    </div>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"       element={<Landing />} />
      <Route path="/login"  element={<Login />} />

      {/* Onboarding — requires auth */}
      <Route path="/onboarding" element={
        <ProtectedRoute><Onboarding /></ProtectedRoute>
      } />

      {/* Protected app */}
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/log" element={
        <ProtectedRoute><Log /></ProtectedRoute>
      } />
      <Route path="/trends" element={
        <ProtectedRoute><Trends /></ProtectedRoute>
      } />
      <Route path="/health-connect" element={
        <ProtectedRoute><HealthConnect /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><Profile /></ProtectedRoute>
      } />
      <Route path="/setup" element={
        <ProtectedRoute><Setup /></ProtectedRoute>
      } />

      {/* Catch-all: show spinner while auth resolves, then route correctly */}
      <Route path="*" element={<AuthCallback />} />
    </Routes>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  )
}
