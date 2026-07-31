import { useState } from 'react'
import { statsApi } from '../api/services'
import { useAuth } from '../context/AuthContext'

export default function ReportsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    if (!user) {
      alert('Hisobot yuklab olish uchun tizimga kiring')
      return
    }
    setLoading(true)
    try {
      const { data } = await statsApi.exportExcel()
      const url = window.URL.createObjectURL(new Blob([data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'buxoro_gis_export.xlsx'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Eksport xatosi — avval tizimga kiring')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reports-page">
      <h2>Hisobotlar</h2>
      <div className="report-cards">
        <div className="report-card">
          <h3>Excel hisobot</h3>
          <p>Barcha umumfoydalanishdagi yerlar ro'yxatini Excel formatida yuklab oling.</p>
          <button type="button" className="btn btn-primary" onClick={handleExport} disabled={loading}>
            {loading ? 'Yuklanmoqda...' : 'Excel yuklab olish'}
          </button>
        </div>
        <div className="report-card">
          <h3>Django Admin</h3>
          <p>To'liq boshqaruv paneli uchun Django Admin dan foydalaning.</p>
          <a href="http://127.0.0.1:8009/admin/" target="_blank" rel="noreferrer" className="btn btn-secondary">
            Admin panelga o'tish →
          </a>
        </div>
      </div>
    </div>
  )
}
