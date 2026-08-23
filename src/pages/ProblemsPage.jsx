import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

const EMPTY = {
  title: '', description: '', severity: 'medium',
  geometry_kind: 'Point', latitude: '', longitude: '',
}

function IcoPlus({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export default function ProblemsPage() {
  const { user, canEdit } = useAuth()
  const { t, lang } = useI18n()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await monitoringApi.issues()
      setIssues(data.results || data || [])
    } catch (err) {
      setError(apiError(err, t, 'msg.loadFail'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError('')
    setOk('')
    try {
      await monitoringApi.createIssue({
        ...form,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        geometry: form.latitude && form.longitude
          ? { type: 'Point', coordinates: [Number(form.longitude), Number(form.latitude)] }
          : null,
        status: 'new',
      })
      setForm(EMPTY)
      setShowForm(false)
      setOk(t('msg.created'))
      load()
    } catch (err) {
      setError(apiError(err, t, 'msg.saveFail'))
    } finally {
      setSaving(false)
    }
  }

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

  return (
    <div className="module-page problems-page">
      <header className="dash-head">
        <div>
          <p className="eyebrow">{t('problems.eyebrow')}</p>
          <h2>{t('problems.title')}</h2>
          <p className="muted">{t('problems.sub')}</p>
        </div>
        {user ? (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            <IcoPlus /> {showForm ? t('common.cancel') : t('problems.add')}
          </button>
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

      {showForm && user && (
        <div className="problems-form-wrap">
          <div className="problems-form-head">
            <h3>{t('problems.formTitle')}</h3>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>×</button>
          </div>
          <form className="problems-form" onSubmit={handleCreate}>
            <label>
              {t('form.name')}
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label>
              {t('form.desc')}
              <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <div className="problems-form-row">
              <label>
                {t('problems.mark')}
                <select value={form.geometry_kind} onChange={(e) => setForm({ ...form, geometry_kind: e.target.value })}>
                  <option value="Point">{t('geo.Point')}</option>
                  <option value="LineString">{t('geo.LineString')}</option>
                  <option value="Polygon">{t('geo.Polygon')}</option>
                </select>
              </label>
              <label>
                {t('mon.severity')}
                <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                  {['low', 'medium', 'high', 'critical'].map((k) => (
                    <option key={k} value={k}>{t(`sev.${k}`)}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="problems-form-row">
              <label>
                {t('problems.lat')}
                <input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="39.77" />
              </label>
              <label>
                {t('problems.lng')}
                <input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="64.42" />
              </label>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: '0.8rem' }}>{t('problems.coordHint')}</p>
            <div className="problems-form-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

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
          {user && !showForm && (
            <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
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
