import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import IntroSplash, { shouldShowIntro } from './components/IntroSplash'
import Layout from './components/Layout'
import ComparePage from './pages/ComparePage'
import Dashboard from './pages/Dashboard'
import HomePage from './pages/HomePage'
import LandsPage from './pages/LandsPage'
import LoginPage from './pages/LoginPage'
import MapPage from './pages/MapPage'
import MonitoringPage from './pages/MonitoringPage'
import ProblemsPage from './pages/ProblemsPage'
import UrbanizationPage from './pages/UrbanizationPage'
import { useAuth } from './context/AuthContext'

function App() {
  const { loading } = useAuth()
  const location = useLocation()
  const [introOpen, setIntroOpen] = useState(() => shouldShowIntro())

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const p = params.get('intro')
    if (p === '1') setIntroOpen(true)
    if (p === '-1' || p === '0') setIntroOpen(false)
  }, [location.search])

  return (
    <>
      {introOpen && <IntroSplash onDone={() => setIntroOpen(false)} />}
      {loading ? (
        <div className="loading-screen">Yuklanmoqda...</div>
      ) : (
        <div className={introOpen ? 'app-behind-intro' : 'app-enter'}>
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
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </div>
      )}
    </>
  )
}

export default App
