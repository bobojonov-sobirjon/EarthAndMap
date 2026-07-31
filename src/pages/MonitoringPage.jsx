import { useEffect, useState } from 'react'
import { monitoringApi } from '../api/services'
import { useAuth } from '../context/AuthContext'

const SEVERITY = { low: 'Past', medium: 'O\'rta', high: 'Yuqori', critical: 'Kritik' }
const ISSUE_STATUS = { open: 'Ochiq', in_progress: 'Jarayonda', resolved: 'Hal qilindi', closed: 'Yopilgan' }

export default function MonitoringPage() {
  const { canEdit } = useAuth()
  const [issues, setIssues] = useState([])
  const [changes, setChanges] = useState([])
  const [tab, setTab] = useState('issues')
  const [form, setForm] = useState({ title: '', description: '', severity: 'medium' })

  const load = async () => {
    const [issuesRes, changesRes] = await Promise.all([
      monitoringApi.issues(),
      monitoringApi.changes({ ordering: '-changed_at' }),
    ])
    setIssues(issuesRes.data.results || issuesRes.data)
    setChanges(changesRes.data.results || changesRes.data)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    await monitoringApi.createIssue(form)
    setForm({ title: '', description: '', severity: 'medium' })
    load()
  }

  const updateStatus = async (id, status) => {
    await monitoringApi.updateIssue(id, { status })
    load()
  }

  return (
    <div className="monitoring-page">
      <h2>Monitoring va nazorat</h2>
      <div className="tabs">
        <button type="button" className={tab === 'issues' ? 'active' : ''} onClick={() => setTab('issues')}>Muammoli joylar</button>
        <button type="button" className={tab === 'changes' ? 'active' : ''} onClick={() => setTab('changes')}>O'zgarishlar tarixi</button>
      </div>

      {tab === 'issues' && (
        <div className="monitoring-grid">
          {canEdit && (
            <form className="panel issue-form" onSubmit={handleCreate}>
              <h3>Yangi muammo qayd etish</h3>
              <input required placeholder="Sarlavha" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <textarea required rows={3} placeholder="Tavsif" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                {Object.entries(SEVERITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <button type="submit" className="btn btn-primary">Saqlash</button>
            </form>
          )}
          <div className="issues-list">
            {issues.map((issue) => (
              <div key={issue.id} className={`issue-card severity-${issue.severity}`}>
                <div className="issue-header">
                  <h4>{issue.title}</h4>
                  <span className={`badge badge-${issue.severity}`}>{SEVERITY[issue.severity]}</span>
                </div>
                <p>{issue.description}</p>
                <div className="issue-meta">
                  <span>{ISSUE_STATUS[issue.status]}</span>
                  <span>{new Date(issue.created_at).toLocaleString('uz')}</span>
                </div>
                {canEdit && issue.status === 'open' && (
                  <button type="button" className="btn btn-sm" onClick={() => updateStatus(issue.id, 'in_progress')}>
                    Jarayonga o'tkazish
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'changes' && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sana</th>
                <th>Obyekt</th>
                <th>Turi</th>
                <th>Tavsif</th>
                <th>Kim</th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c) => (
                <tr key={c.id}>
                  <td>{new Date(c.changed_at).toLocaleString('uz')}</td>
                  <td>{c.land_name}</td>
                  <td>{c.change_type}</td>
                  <td>{c.description || `${c.field_name}: ${c.old_value} → ${c.new_value}`}</td>
                  <td>{c.changed_by_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
