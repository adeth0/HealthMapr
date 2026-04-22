import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Log from './pages/Log'
import Trends from './pages/Trends'
import Profile from './pages/Profile'
import Setup from './pages/Setup'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/log" element={<Log />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
