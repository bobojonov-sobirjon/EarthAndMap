import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import IntroSplash, { shouldShowIntro } from './components/IntroSplash'
import Layout from './components/Layout'
import AdminLayout from './admin/AdminLayout'
import AdminHome from './admin/AdminHome'
import AdminImportPage from './admin/AdminImportPage'
import {
  AdminBoundariesPage,
  AdminCategoriesPage,
  AdminChangesPage,
  AdminIssuesPage,
  AdminLandsPage,
  AdminMahallasPage,
  AdminNoticesPage,
  AdminRecordsPage,
  AdminUrbanizationPage,
  AdminUsersPage,
  AdminVersionsPage,
  AdminYearsPage,
} from './admin/AdminPages'
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
            <Route path="/admin-panel" element={<AdminLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="import" element={<AdminImportPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="lands" element={<AdminLandsPage />} />
              <Route path="boundaries" element={<AdminBoundariesPage />} />
              <Route path="mahallas" element={<AdminMahallasPage />} />
              <Route path="years" element={<AdminYearsPage />} />
              <Route path="versions" element={<AdminVersionsPage />} />
              <Route path="records" element={<AdminRecordsPage />} />
              <Route path="urbanization" element={<AdminUrbanizationPage />} />
              <Route path="issues" element={<AdminIssuesPage />} />
              <Route path="changes" element={<AdminChangesPage />} />
              <Route path="notices" element={<AdminNoticesPage />} />
            </Route>
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
