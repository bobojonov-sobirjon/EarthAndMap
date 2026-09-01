import { useEffect, useState } from 'react'
import { monitoringApi } from '../api/services'
import { useI18n } from '../i18n/I18nContext'
import { apiError } from '../i18n/apiError'

export default function ApplicationTypePickerModal({ open, onClose, onSelectType }) {
  const { t } = useI18n()
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setTypes([])
      setError('')
      return undefined
    }
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const { data } = await monitoringApi.applicationTypes()
        if (!cancelled) {
          setTypes(data.results || data || [])
        }
      } catch (err) {
        if (!cancelled) setError(apiError(err, t, 'msg.loadFail'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [open, t])

  if (!open) return null

  const pick = (row) => {
    onSelectType({
      application_type_id: row.id,
      name: row.name,
      site_url: row.site_url || '',
      score: 0,
      analysis_text: '',
    })
    onClose()
  }

  return (
    <div className="problems-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="problems-modal"
        role="dialog"
        aria-labelledby="pick-org-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="problems-modal__head">
          <h3 id="pick-org-title">{t('problems.pickOrgTitle')}</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label={t('common.cancel')}>×</button>
        </div>

        <p className="muted">{t('problems.pickOrgHint')}</p>
        {error && <div className="admin-error">{error}</div>}

        {loading ? (
          <div className="problems-analysis-loading" role="status">
            <div className="import-loading__spin" aria-hidden />
            <strong>{t('common.loading')}</strong>
          </div>
        ) : (
          <div className="problems-analysis-results">
            {types.map((row) => (
              <div key={row.id} className="problems-analysis-row">
                <strong>{row.name}</strong>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => pick(row)}>
                  {t('problems.pickOrg')}
                </button>
              </div>
            ))}
            {!types.length && !loading && (
              <p className="muted">{t('problems.noTypes')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
