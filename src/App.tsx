import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
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
// Redirects unauthenticated users to /login.
// Authenticated users who haven't finished onboarding go to /onboarding.

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

      <Route path="*" element={<Navigate to="/" replace />} />
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
