import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ApplicationTypePickerModal from '../components/ApplicationTypePickerModal'
import ApplicationEmbedModal from '../components/ApplicationEmbedModal'
import ProblemAnalysisModal from '../components/ProblemAnalysisModal'
import { monitoringApi } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { dateLocale, loc } from '../i18n/loc'
import { apiError } from '../i18n/apiError'
import PageLoader from '../components/PageLoader'

const STATUS_COLORS = {
  new: '#38bdf8',
  open: '#f97316',
  in_progress: '#a78bfa',
  resolved: '#4ade80',
  closed: '#64748b',
}

const SEV_STYLE = {
  low: { color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  high: { color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  critical: { color: '#f87171', bg: 'rgba(248,113,113,0.18)' },
}

const FLOW = { new: 'open', open: 'in_progress', in_progress: 'resolved', resolved: 'closed' }

function IcoPlus({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function IcoAnalyze({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
    </svg>
  )
}

export default function ProblemsPage() {
  const { user, canEdit } = useAuth()
  const { t, lang } = useI18n()
  const [issues, setIssues] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [embedSelection, setEmbedSelection] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const reqs = [monitoringApi.issues()]
      if (user) reqs.push(monitoringApi.submissions())
      const [issuesRes, subsRes] = await Promise.all(reqs)
      setIssues(issuesRes.data.results || issuesRes.data || [])
      if (subsRes) {
        setSubmissions(subsRes.data.results || subsRes.data || [])
      }
    } catch (err) {
      setError(apiError(err, t, 'msg.loadFail'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user])

  const advance = async (issue) => {
    const next = FLOW[issue.status]
    if (!next) return
    try {
      const patch = { status: next }
      if (next === 'resolved') patch.resolved_at = new Date().toISOString()
      await monitoringApi.updateIssue(issue.id, patch)
      setOk(t('msg.saved'))
      load()
    } catch (err) {
      setError(apiError(err, t, 'msg.saveFail'))
    }
  }

  const counts = useMemo(() => {
    const c = { total: issues.length, new: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 }
    issues.forEach((i) => { if (c[i.status] !== undefined) c[i.status] += 1 })
    return c
  }, [issues])

  const rows = useMemo(() => {
    let list = [...issues]
    if (filterStatus) list = list.filter((i) => i.status === filterStatus)
    if (filterSeverity) list = list.filter((i) => i.severity === filterSeverity)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((i) =>
        `${i.title} ${i.title_ru} ${i.title_en} ${i.description}`.toLowerCase().includes(q),
      )
    }
    return list
  }, [issues, filterStatus, filterSeverity, search])

  const handleSelectType = (row) => {
    setShowAnalysis(false)
    setShowTypePicker(false)
    setEmbedSelection(row)
  }

  const handleSubmitted = () => {
    setOk(t('problems.submitOk'))
    load()
  }

  return (
    <div className="module-page problems-page">
      <header className="dash-head">
        <div>
          <p className="eyebrow">{t('problems.eyebrow')}</p>
          <h2>{t('problems.title')}</h2>
          <p className="muted">{t('problems.sub')}</p>
        </div>
        {user ? (
          <div className="problems-head-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowAnalysis(true)}>
              <IcoAnalyze /> {t('problems.analysisBtn')}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setShowTypePicker(true)}>
              <IcoPlus /> {t('problems.add')}
            </button>
          </div>
        ) : (
          <Link className="btn btn-primary" to="/login?next=/problems">{t('problems.loginToAdd')}</Link>
        )}
      </header>

      <ol className="problems-how">
        <li><b>1</b><span>{t('problems.step1')}</span></li>
        <li><b>2</b><span>{t('problems.step2')}</span></li>
        <li><b>3</b><span>{t('problems.step3')}</span></li>
        <li><b>4</b><span>{t('problems.step4')}</span></li>
      </ol>

      {error && <div className="admin-error">{error}</div>}
      {ok && <div className="admin-ok">{ok}</div>}

      <ProblemAnalysisModal
        open={showAnalysis && user}
        onClose={() => setShowAnalysis(false)}
        onSelectType={handleSelectType}
      />

      <ApplicationTypePickerModal
        open={showTypePicker && user}
        onClose={() => setShowTypePicker(false)}
        onSelectType={handleSelectType}
      />

      <ApplicationEmbedModal
        open={Boolean(embedSelection)}
        selection={embedSelection}
        onClose={() => setEmbedSelection(null)}
        onSubmitted={handleSubmitted}
      />

      {user && submissions.length > 0 && (
        <section className="problems-submissions">
          <h3>{t('problems.mySubmissions')}</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('form.name')}</th>
                  <th>{t('problems.orgType')}</th>
                  <th>{t('problems.match')}</th>
                  <th>{t('form.status')}</th>
                  <th>{t('problems.subDate')}</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.title || '—'}</td>
                    <td>{s.application_type_name}</td>
                    <td>{s.match_score}%</td>
                    <td>{t(`problems.subStatus.${s.status}`)}</td>
                    <td>{new Date(s.created_at).toLocaleDateString(dateLocale(lang))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="problems-kpi">
        {[
          { key: '', label: t('iss.total') },
          { key: 'new', label: t('iss.new') },
          { key: 'open', label: t('iss.open') },
          { key: 'in_progress', label: t('iss.in_progress') },
          { key: 'resolved', label: t('iss.resolved') },
          { key: 'closed', label: t('iss.closed') },
        ].map((item) => (
          <button
            key={item.key || 'all'}
            type="button"
            className={`problems-kpi__card ${filterStatus === item.key ? 'is-on' : ''}`}
            style={{ '--kc': STATUS_COLORS[item.key] || '#38bdf8' }}
            onClick={() => setFilterStatus(item.key)}
          >
            <strong style={{ color: STATUS_COLORS[item.key] || '#38bdf8' }}>
              {item.key ? counts[item.key] : counts.total}
            </strong>
            <span>{item.label}</span>
          </button>
        ))}
      </section>

      <div className="problems-filters">
        <input
          className="problems-search"
          placeholder={t('problems.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
          <option value="">{t('problems.allSev')}</option>
          {['low', 'medium', 'high', 'critical'].map((k) => (
            <option key={k} value={k}>{t(`sev.${k}`)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <PageLoader compact />
      ) : rows.length === 0 ? (
        <div className="problems-empty">
          <strong>{t('problems.empty')}</strong>
          <p>{user ? t('problems.emptyHintUser') : t('problems.emptyHintGuest')}</p>
          {!user && <Link className="btn btn-primary" to="/login?next=/problems">{t('auth.login')}</Link>}
          {user && (
            <button type="button" className="btn btn-primary" onClick={() => setShowTypePicker(true)}>
              {t('problems.add')}
            </button>
          )}
        </div>
      ) : (
        <div className="issues-grid">
          {rows.map((issue) => {
            const sev = SEV_STYLE[issue.severity] || SEV_STYLE.medium
            const next = FLOW[issue.status]
            return (
              <article key={issue.id} className="issue-card2" style={{ '--sev': sev.color, '--sev-bg': sev.bg }}>
                <div className="issue-card2__top">
                  <span className="issue-badge" style={{ background: sev.bg, color: sev.color }}>{t(`sev.${issue.severity}`)}</span>
                  <span className="issue-status" style={{ color: STATUS_COLORS[issue.status] || '#94a3b8' }}>
                    {t(`iss.${issue.status}`)}
                  </span>
                </div>
                <h4 className="issue-card2__title">{loc(issue, 'title', lang) || issue.title}</h4>
                <p className="issue-card2__desc">{loc(issue, 'description', lang) || issue.description}</p>
                <div className="issue-card2__meta">
                  <span>{t(`geo.${issue.geometry_kind}`)}</span>
                  {issue.latitude && issue.longitude && (
                    <span>{Number(issue.latitude).toFixed(4)}, {Number(issue.longitude).toFixed(4)}</span>
                  )}
                  <span>{new Date(issue.created_at).toLocaleDateString(dateLocale(lang))}</span>
                </div>
                {canEdit && next && (
                  <div className="issue-card2__actions">
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => advance(issue)}>
                      {t(`problems.next.${issue.status}`)}
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
