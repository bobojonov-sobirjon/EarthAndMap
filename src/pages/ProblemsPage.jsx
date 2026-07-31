import { useEffect, useState } from 'react'
import { monitoringApi } from '../api/services'
import { useAuth } from '../context/AuthContext'

const STATUS = {
  new: 'Yangi',
  open: 'Ochiq',
  in_progress: 'Jarayonda',
  resolved: 'Bartaraf etilgan',
  closed: 'Yopilgan',
}

const SEVERITY = { low: 'Past', medium: "O'rta", high: 'Yuqori', critical: 'Kritik' }

export default function ProblemsPage() {
  const { canEdit } = useAuth()
  const [issues, setIssues] = useState([])
  const [form, setForm] = useState({
    title: '', description: '', severity: 'medium', geometry_kind: 'Point',
    latitude: '', longitude: '',
  })

  const load = async () => {
    const { data } = await monitoringApi.issues()
    setIssues(data.results || data)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
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
    setForm({ title: '', description: '', severity: 'medium', geometry_kind: 'Point', latitude: '', longitude: '' })
    load()
  }

  const resolve = async (id) => {
    await monitoringApi.updateIssue(id, { status: 'resolved', resolved_at: new Date().toISOString() })
    load()
  }

  return (
    <div className="module-page">
      <h2>Muammoli hududlar</h2>
      <p className="muted">Nuqta / chiziq / poligon bilan belgilash, holat: yangi → bartaraf etilgan</p>

      <div className="monitoring-grid">
        {canEdit && (
          <form className="panel issue-form" onSubmit={handleCreate}>
            <h3>Yangi muammo</h3>
            <input required placeholder="Sarlavha" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea required rows={3} placeholder="Tavsif" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <select value={form.geometry_kind} onChange={(e) => setForm({ ...form, geometry_kind: e.target.value })}>
              <option value="Point">Nuqta</option>
              <option value="LineString">Chiziq</option>
              <option value="Polygon">Poligon</option>
            </select>
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              {Object.entries(SEVERITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <div className="filter-row">
              <input placeholder="Lat" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
              <input placeholder="Lng" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary">Saqlash</button>
          </form>
        )}

        <div className="issues-list">
          {issues.map((issue) => (
            <div key={issue.id} className={`issue-card severity-${issue.severity}`}>
              <div className="issue-header">
                <h4>{issue.title}</h4>
                <span className="badge">{STATUS[issue.status] || issue.status}</span>
              </div>
              <p>{issue.description}</p>
              <div className="issue-meta">
                <span>{issue.geometry_kind}</span>
                <span>{SEVERITY[issue.severity]}</span>
                <span>{new Date(issue.created_at).toLocaleString('uz')}</span>
              </div>
              {canEdit && !['resolved', 'closed'].includes(issue.status) && (
                <button type="button" className="btn btn-sm" onClick={() => resolve(issue.id)}>
                  Bartaraf etilgan deb belgilash
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
