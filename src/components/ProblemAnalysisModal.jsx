import { useEffect, useState } from 'react'
import { monitoringApi } from '../api/services'
import { useI18n } from '../i18n/I18nContext'
import { apiError } from '../i18n/apiError'

function formatElapsed(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function ProblemAnalysisModal({
  open,
  onClose,
  onSelectType,
}) {
  const { t } = useI18n()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setText('')
      setResults(null)
      setError('')
      setElapsed(0)
      setLoading(false)
    }
  }, [open])

  useEffect(() => {
    if (!loading) return undefined
    const tick = window.setInterval(() => setElapsed((n) => n + 1), 1000)
    return () => clearInterval(tick)
  }, [loading])

  if (!open) return null

  const runAnalysis = async (e) => {
    e.preventDefault()
    if (text.trim().length < 8) {
      setError(t('problems.analysisTooShort'))
      return
    }
    setLoading(true)
    setError('')
    setResults(null)
    setElapsed(0)
    try {
      const { data } = await monitoringApi.analyzeProblem({ text: text.trim() })
      setResults(data)
    } catch (err) {
      setError(apiError(err, t, 'problems.analysisFail'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="problems-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="problems-modal"
        role="dialog"
        aria-labelledby="analysis-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="problems-modal__head">
          <h3 id="analysis-title">{t('problems.analysisTitle')}</h3>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label={t('common.cancel')}>×</button>
        </div>

        <form onSubmit={runAnalysis}>
          <label className="problems-modal__label">
            {t('problems.analysisLabel')}
            <textarea
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('problems.analysisPh')}
              disabled={loading}
            />
          </label>

          {error && <div className="admin-error">{error}</div>}

          {loading && (
            <div className="problems-analysis-loading" role="status">
              <div className="import-loading__spin" aria-hidden />
              <strong>{t('problems.analysisRunning')}</strong>
              <span>{formatElapsed(elapsed)}</span>
            </div>
          )}

          {!loading && results?.results?.length > 0 && (
            <div className="problems-analysis-results">
              <p className="muted">{t('problems.analysisHint')}</p>
              {results.results.map((row) => (
                <div key={row.application_type_id} className="problems-analysis-row">
                  <div>
                    <strong>{row.name}</strong>
                    <span className="problems-analysis-score">{row.score}%</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onSelectType({
                      ...row,
                      analysis_text: results.text,
                    })}
                  >
                    {t('problems.sendToOrg')}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="problems-modal__foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('problems.analysisRunning') : t('problems.analysisBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
