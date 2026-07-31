import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ComparePage from './pages/ComparePage'
import Dashboard from './pages/Dashboard'
import HomePage from './pages/HomePage'
import LandsPage from './pages/LandsPage'
import LoginPage from './pages/LoginPage'
import MapPage from './pages/MapPage'
import MonitoringPage from './pages/MonitoringPage'
import ProblemsPage from './pages/ProblemsPage'
import ReportsPage from './pages/ReportsPage'
import UrbanizationPage from './pages/UrbanizationPage'
import { useAuth } from './context/AuthContext'

function App() {
  const { loading } = useAuth()

  if (loading) {
    return <div className="loading-screen">Yuklanmoqda...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="lands" element={<LandsPage />} />
        <Route path="monitoring" element={<MonitoringPage />} />
        <Route path="urbanization" element={<UrbanizationPage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="problems" element={<ProblemsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
