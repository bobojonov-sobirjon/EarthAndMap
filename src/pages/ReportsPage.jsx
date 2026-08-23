import { useState } from 'react'
import { statsApi } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'

export default function ReportsPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    if (!user) {
      alert(t('reports.needLogin'))
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
      alert(t('reports.exportFail'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reports-page">
      <h2>{t('nav.stats')}</h2>
      <div className="report-cards">
        <div className="report-card">
          <h3>Excel</h3>
          <p>{t('lands.exportXls')}</p>
          <button type="button" className="btn btn-primary" onClick={handleExport} disabled={loading}>
            {loading ? t('common.loading') : t('lands.exportXls')}
          </button>
        </div>
      </div>
    </div>
  )
}
