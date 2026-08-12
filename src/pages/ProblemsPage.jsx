import { useEffect, useMemo, useState } from 'react'
import { monitoringApi } from '../api/services'
import { useAuth } from '../context/AuthContext'

const STATUS_MAP = {
  new: { label: 'Yangi', color: '#38bdf8' },
  open: { label: 'Ochiq', color: '#f97316' },
  in_progress: { label: 'Jarayonda', color: '#a78bfa' },
  resolved: { label: 'Bartaraf etilgan', color: '#4ade80' },
  closed: { label: 'Yopilgan', color: '#64748b' },
}

const SEVERITY_MAP = {
  low: { label: 'Past', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  medium: { label: "O'rta", color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  high: { label: 'Yuqori', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  critical: { label: 'Kritik', color: '#f87171', bg: 'rgba(248,113,113,0.18)' },
}

const GEO_MAP = { Point: 'Nuqta', LineString: 'Chiziq', Polygon: 'Poligon' }

const STATUS_FLOW = {
  new: 'open',
  open: 'in_progress',
  in_progress: 'resolved',
  resolved: 'closed',
}

const STATUS_NEXT_LABEL = {
  new: 'Ochiq deb belgilash',
  open: 'Jarayonga olish',
  in_progress: 'Bartaraf etilgan',
  resolved: 'Yopish',
}

function IcoPlus({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
function IcoX({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function IcoWarning({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  )
}

const EMPTY_FORM = {
  title: '', description: '', severity: 'medium',
  geometry_kind: 'Point', latitude: '', longitude: '',
}

export default function ProblemsPage() {
  const { canEdit } = useAuth()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await monitoringApi.issues()
      setIssues(data.results || data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        geometry: form.latitude && form.longitude
          ? { type: 'Point', coordinates: [Number(form.longitude), Number(form.latitude)] }
          : null,
        status: 'new',
      }
      await monitoringApi.createIssue(payload)
      setForm(EMPTY_FORM)
      setShowForm(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const advance = async (issue) => {
    const next = STATUS_FLOW[issue.status]
    if (!next) return
    const patch = { status: next }
    if (next === 'resolved') patch.resolved_at = new Date().toISOString()
    await monitoringApi.updateIssue(issue.id, patch)
    load()
  }

  const counts = useMemo(() => {
    const c = { total: issues.length, new: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 }
    issues.forEach((i) => { if (c[i.status] !== undefined) c[i.status]++ })
    return c
  }, [issues])

  const rows = useMemo(() => {
    let list = [...issues]
    if (filterStatus) list = list.filter((i) => i.status === filterStatus)
    if (filterSeverity) list = list.filter((i) => i.severity === filterSeverity)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((i) =>
        i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q),
      )
    }
    return list
  }, [issues, filterStatus, filterSeverity, search])

  return (
    <div className="module-page problems-page">
      <header className="dash-head">
        <div>
          <p className="eyebrow">Monitoring</p>
          <h2>Muammoli hududlar</h2>
          <p className="muted">Nuqta / chiziq / poligon bilan belgilash, holat: yangi → bartaraf etilgan</p>
        </div>
        {canEdit && (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            <IcoPlus size={16} /> Yangi muammo
          </button>
        )}
      </header>

      {/* KPI summary */}
      <section className="problems-kpi">
        {[
          { key: '', label: 'Jami', color: '#38bdf8' },
          { key: 'new', label: 'Yangi', color: '#38bdf8' },
          { key: 'open', label: 'Ochiq', color: '#f97316' },
          { key: 'in_progress', label: 'Jarayonda', color: '#a78bfa' },
          { key: 'resolved', label: 'Bartaraf etilgan', color: '#4ade80' },
          { key: 'closed', label: 'Yopilgan', color: '#64748b' },
        ].map((item) => (
          <button
            key={item.key || 'all'}
            type="button"
            className={`problems-kpi__card ${filterStatus === item.key ? 'is-on' : ''}`}
            style={{ '--kc': item.color }}
            onClick={() => setFilterStatus(item.key)}
          >
            <strong style={{ color: item.color }}>
              {item.key ? counts[item.key] ?? 0 : counts.total}
            </strong>
            <span>{item.label}</span>
          </button>
        ))}
      </section>

      {/* Create form */}
      {showForm && canEdit && (
        <div className="problems-form-wrap">
          <div className="problems-form-card">
            <div className="problems-form-head">
              <h3>Yangi muammo qo'shish</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}><IcoX /></button>
            </div>
            <form className="problems-form" onSubmit={handleCreate}>
              <input
                required
                placeholder="Sarlavha *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <textarea
                required
                rows={3}
                placeholder="Tavsif *"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="problems-form-row">
                <select value={form.geometry_kind} onChange={(e) => setForm({ ...form, geometry_kind: e.target.value })}>
                  <option value="Point">Nuqta</option>
                  <option value="LineString">Chiziq</option>
                  <option value="Polygon">Poligon</option>
                </select>
                <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                  {Object.entries(SEVERITY_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="problems-form-row">
                <input
                  placeholder="Kenglik (Lat)"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                />
                <input
                  placeholder="Uzunlik (Lng)"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                />
              </div>
              <div className="problems-form-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="problems-filters">
        <input
          className="problems-search"
          placeholder="Qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
          <option value="">Barcha darajalar</option>
          {Object.entries(SEVERITY_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <p className="muted" style={{ padding: '2rem', textAlign: 'center' }}>Yuklanmoqda...</p>
      ) : rows.length === 0 ? (
        <div className="problems-empty">
          <IcoWarning size={48} />
          <p>Muammoli hudud topilmadi</p>
        </div>
      ) : (
        <div className="issues-grid">
          {rows.map((issue) => {
            const sev = SEVERITY_MAP[issue.severity] || SEVERITY_MAP.medium
            const st = STATUS_MAP[issue.status] || { label: issue.status, color: '#64748b' }
            const nextLabel = STATUS_NEXT_LABEL[issue.status]
            return (
              <div key={issue.id} className="issue-card2" style={{ '--sev': sev.color, '--sev-bg': sev.bg }}>
                <div className="issue-card2__top">
                  <span className="issue-badge" style={{ background: sev.bg, color: sev.color }}>{sev.label}</span>
                  <span className="issue-status" style={{ color: st.color }}>{st.label}</span>
                </div>
                <h4 className="issue-card2__title">{issue.title}</h4>
                <p className="issue-card2__desc">{issue.description}</p>
                <div className="issue-card2__meta">
                  <span>{GEO_MAP[issue.geometry_kind] || issue.geometry_kind}</span>
                  {issue.latitude && issue.longitude && (
                    <span>{Number(issue.latitude).toFixed(4)}, {Number(issue.longitude).toFixed(4)}</span>
                  )}
                  <span>{new Date(issue.created_at).toLocaleDateString('uz-UZ')}</span>
                </div>
                {canEdit && nextLabel && (
                  <div className="issue-card2__actions">
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => advance(issue)}>
                      {nextLabel}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
