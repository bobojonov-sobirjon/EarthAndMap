import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { monitoringApi } from '../api/services'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'
import { apiError } from '../i18n/apiError'
import { dateLocale, locName } from '../i18n/loc'
import PageLoader from '../components/PageLoader'
import IssueLocationMap from '../components/IssueLocationMap'

const SEVS = ['low', 'medium', 'high', 'critical']
const STATUSES = ['new', 'open', 'in_progress', 'resolved', 'closed']

function fmtDate(iso, lang) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(dateLocale(lang), {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function logLabel(c, t) {
  const name = c.land_public_id || c.land_name || '—'
  const key = `chg.${c.change_type}`
  const type = t(key) === key ? c.change_type : t(key)
  if (c.change_type === 'created') {
    return t('chg.createdMsg').replace('{name}', name)
  }
  if (c.description) return c.description
  if (c.field_name) return `${c.field_name}: ${c.old_value || '—'} → ${c.new_value || '—'}`
  return type
}

export default function MonitoringPage() {
  const { canEdit } = useAuth()
  const { t, lang } = useI18n()
  const [issues, setIssues] = useState([])
  const [changes, setChanges] = useState([])
  const [tab, setTab] = useState('issues')
  const [form, setForm] = useState({ title: '', description: '', severity: 'medium', lat: null, lng: null, address: '' })
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [issueFilter, setIssueFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const [issuesRes, changesRes] = await Promise.all([
        monitoringApi.issues(),
        monitoringApi.changes({ ordering: '-changed_at' }),
      ])
      setIssues(issuesRes.data.results || issuesRes.data || [])
      setChanges(changesRes.data.results || changesRes.data || [])
    } catch (err) {
      setError(apiError(err, t, 'msg.loadFail'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const kpis = useMemo(() => {
    const open = issues.filter((i) => i.status === 'open' || i.status === 'new').length
    const work = issues.filter((i) => i.status === 'in_progress').length
    const done = issues.filter((i) => i.status === 'resolved' || i.status === 'closed').length
    return { open, work, done, logs: changes.length, total: issues.length }
  }, [issues, changes])

  const visibleIssues = useMemo(() => {
    if (!issueFilter) return issues
    return issues.filter((i) => i.status === issueFilter)
  }, [issues, issueFilter])

  const visibleLogs = useMemo(() => {
    const s = q.trim().toLowerCase()
    return changes.filter((c) => {
      if (typeFilter && c.change_type !== typeFilter) return false
      if (!s) return true
      const blob = `${c.land_public_id} ${c.land_name} ${c.description} ${c.changed_by_name}`.toLowerCase()
      return blob.includes(s)
    })
  }, [changes, q, typeFilter])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setOk('')
    if (form.lat == null || form.lng == null) {
      setError(t('mon.needPoint'))
      return
    }
    setSaving(true)
    try {
      await monitoringApi.createIssue({
        title: form.title,
        description: form.description,
        severity: form.severity,
        latitude: form.lat,
        longitude: form.lng,
        address: form.address,
        geometry_kind: 'Point',
        geometry: { type: 'Point', coordinates: [form.lng, form.lat] },
      })
      setForm({ title: '', description: '', severity: 'medium', lat: null, lng: null, address: '' })
      setShowForm(false)
      setShowSuccess(true)
      window.setTimeout(() => setShowSuccess(false), 2800)
      load()
    } catch (err) {
      setError(apiError(err, t, 'msg.saveFail'))
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id, status) => {
    setError('')
    try {
      await monitoringApi.updateIssue(id, { status })
      setOk(t('msg.saved'))
      load()
    } catch (err) {
      setError(apiError(err, t, 'msg.saveFail'))
    }
  }

  const nextAction = (status) => {
    if (status === 'new' || status === 'open') return { to: 'in_progress', label: t('iss.in_progress') }
    if (status === 'in_progress') return { to: 'resolved', label: t('iss.resolved') }
    return null
  }

  if (loading) return <PageLoader />

  return (
    <div className="mon-page">
      <header className="mon-head">
        <div>
          <p className="eyebrow">{t('mon.eyebrow')}</p>
          <h2>{t('mon.title')}</h2>
          <p className="muted">{t('mon.sub')}</p>
        </div>
        {tab === 'issues' && canEdit && (
          <button type="button" className="btn btn-primary" onClick={() => { setError(''); setShowForm(true) }}>
            {t('mon.new')}
          </button>
        )}
      </header>

      {error && <div className="alert-error">{error}</div>}
      {ok && <div className="alert-ok">{ok}</div>}

      <div className="mon-kpis">
        <div className="mon-kpi">
          <b>{kpis.open}</b>
          <span>{t('mon.kpiOpen')}</span>
        </div>
        <div className="mon-kpi">
          <b>{kpis.work}</b>
          <span>{t('mon.kpiWork')}</span>
        </div>
        <div className="mon-kpi">
          <b>{kpis.done}</b>
          <span>{t('mon.kpiDone')}</span>
        </div>
        <div className="mon-kpi">
          <b>{kpis.logs}</b>
          <span>{t('mon.kpiLogs')}</span>
        </div>
      </div>

      <div className="mon-tabs" role="tablist">
        <button type="button" className={tab === 'issues' ? 'is-on' : ''} onClick={() => setTab('issues')}>
          {t('mon.issues')}
          <em>{kpis.total}</em>
        </button>
        <button type="button" className={tab === 'changes' ? 'is-on' : ''} onClick={() => setTab('changes')}>
          {t('mon.history')}
          <em>{kpis.logs}</em>
        </button>
      </div>

      {tab === 'issues' && (
        <>
          <p className="mon-hint">{t('mon.issuesHint')}</p>
          {showForm && canEdit && (
            <div className="modal-backdrop" onClick={() => !saving && setShowForm(false)}>
              <form className="modal-card mon-form-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
                <div className="mon-form-modal__head">
                  <h3>{t('mon.new')}</h3>
                  <button type="button" className="btn-close" onClick={() => setShowForm(false)} aria-label={t('common.close')}>×</button>
                </div>
                {error && <div className="alert-error">{error}</div>}
                <label>
                  {t('form.name')}
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </label>
                <label>
                  {t('form.desc')}
                  <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </label>
                <label>
                  {t('mon.severity')}
                  <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                    {SEVS.map((k) => <option key={k} value={k}>{t(`sev.${k}`)}</option>)}
                  </select>
                </label>
                <IssueLocationMap
                  value={{ lat: form.lat, lng: form.lng, address: form.address }}
                  onChange={(pt) => setForm((f) => ({ ...f, lat: pt.lat, lng: pt.lng, address: pt.address }))}
                />
                <div className="mon-form-modal__foot">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)} disabled={saving}>
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? t('common.loading') : t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="mon-filters">
            <button type="button" className={!issueFilter ? 'is-on' : ''} onClick={() => setIssueFilter('')}>{t('common.all')}</button>
            {STATUSES.map((s) => (
              <button key={s} type="button" className={issueFilter === s ? 'is-on' : ''} onClick={() => setIssueFilter(s)}>
                {t(`iss.${s}`)}
              </button>
            ))}
          </div>

          {visibleIssues.length === 0 ? (
            <div className="mon-empty">
              <strong>{t('mon.emptyIssues')}</strong>
              <p>{t('mon.emptyIssuesHint')}</p>
            </div>
          ) : (
            <div className="mon-cards">
              {visibleIssues.map((issue) => {
                const act = nextAction(issue.status)
                return (
                  <article key={issue.id} className={`mon-card sev-${issue.severity}`}>
                    <div className="mon-card__top">
                      <h3>{locName({ name: issue.title, name_ru: issue.title_ru, name_en: issue.title_en }, lang) || issue.title}</h3>
                      <span className={`pill sev-${issue.severity}`}>{t(`sev.${issue.severity}`)}</span>
                    </div>
                    <p>{issue.description}</p>
                    <div className="mon-card__meta">
                      <span className={`pill status-${issue.status}`}>{t(`iss.${issue.status}`)}</span>
                      <span>{fmtDate(issue.created_at, lang)}</span>
                      {issue.address && <span>{issue.address}</span>}
                      {issue.land_public_id && (
                        <Link to={`/map?land=${issue.land}`}>{issue.land_public_id}</Link>
                      )}
                    </div>
                    {canEdit && act && (
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => updateStatus(issue.id, act.to)}>
                        {act.label}
                      </button>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'changes' && (
        <>
          <p className="mon-hint">{t('mon.historyHint')}</p>
          <div className="mon-toolbar">
            <input
              className="mon-search"
              placeholder={t('mon.searchLog')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">{t('mon.allTypes')}</option>
              {['created', 'updated', 'status_changed', 'geometry_changed', 'deleted'].map((k) => (
                <option key={k} value={k}>{t(`chg.${k}`)}</option>
              ))}
            </select>
          </div>
          <div className="table-wrap mon-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('mon.col.date')}</th>
                  <th>{t('mon.col.object')}</th>
                  <th>{t('mon.col.type')}</th>
                  <th>{t('mon.col.desc')}</th>
                  <th>{t('mon.col.who')}</th>
                </tr>
              </thead>
              <tbody>
                {visibleLogs.length === 0 && (
                  <tr><td colSpan={5} className="muted">{t('mon.emptyLogs')}</td></tr>
                )}
                {visibleLogs.map((c) => (
                  <tr key={c.id}>
                    <td>{fmtDate(c.changed_at, lang)}</td>
                    <td>
                      {c.land ? (
                        <Link to={`/map?land=${c.land}`}>{c.land_public_id || c.land_name || c.land}</Link>
                      ) : (c.land_name || '—')}
                    </td>
                    <td><span className={`pill type-${c.change_type}`}>{t(`chg.${c.change_type}`)}</span></td>
                    <td>{logLabel(c, t)}</td>
                    <td>{c.changed_by_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showSuccess && (
        <div className="success-popup" role="status">
          <div className="success-popup__card">
            <span className="success-popup__check" aria-hidden>✓</span>
            <strong>{t('mon.added')}</strong>
            <p>{t('mon.addedHint')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
