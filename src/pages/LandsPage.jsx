import { useEffect, useState } from 'react'
import { categoriesApi, landsApi } from '../api/services'
import { useAuth } from '../context/AuthContext'

const STATUS_LABELS = {
  active: 'Yaxshi', construction: 'Qurilish', damaged: 'Zararlangan',
  closed: 'Yopiq', planned: 'Rejalashtirilgan',
}

export default function LandsPage() {
  const { canEdit } = useAuth()
  const [lands, setLands] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [selectedVersions, setSelectedVersions] = useState(null)

  const load = async () => {
    const params = {}
    if (search) params.search = search
    if (categoryFilter) params.category = categoryFilter
    if (yearFilter) params.monitoring_year = yearFilter
    const [landsRes, catsRes] = await Promise.all([
      landsApi.list(params),
      categoriesApi.list(),
    ])
    setLands(landsRes.data.results || landsRes.data)
    setCategories(catsRes.data.results || catsRes.data)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return
    await landsApi.delete(id)
    load()
  }

  const showVersions = async (land) => {
    const { data } = await landsApi.versions(land.id)
    setSelectedVersions({ land, versions: data })
  }

  return (
    <div className="lands-page">
      <div className="page-header">
        <h2>Obyektlar reyestri</h2>
        <div className="header-actions">
          <input placeholder="ID, nomi, mahalla..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Barcha kategoriyalar</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name_uz}</option>)}
          </select>
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
            <option value="">Monitoring yili</option>
            {[2018, 2020, 2022, 2024, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button type="button" className="btn btn-primary" onClick={load}>Qidirish</button>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nomi</th>
              <th>Kategoriya</th>
              <th>Status</th>
              <th>Maydon (ga)</th>
              <th>Uzunlik (km)</th>
              <th>Mahalla</th>
              <th>Yil</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {lands.map((land) => (
              <tr key={land.id}>
                <td><code>{land.public_id || land.id}</code></td>
                <td><span className="color-dot" style={{ background: land.category_color }} /> {land.name}</td>
                <td>{land.category_name}</td>
                <td><span className={`badge badge-${land.status}`}>{STATUS_LABELS[land.status]}</span></td>
                <td>{land.area_ha ?? '—'}</td>
                <td>{land.length_km ?? '—'}</td>
                <td>{land.mahalla || '—'}</td>
                <td>{land.monitoring_year}</td>
                <td>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => showVersions(land)}>Versiyalar</button>
                  {canEdit && (
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(land.id)}>O'chirish</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedVersions && (
        <div className="modal-backdrop" onClick={() => setSelectedVersions(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedVersions.land.public_id} — yillar kesimidagi versiyalar</h3>
            <p className="muted">Eski ma’lumotlar yangisi bilan almashtirilmaydi</p>
            <table className="data-table">
              <thead>
                <tr><th>Yil</th><th>Maydon (ga)</th><th>Uzunlik (km)</th><th>Status</th><th>Izoh</th></tr>
              </thead>
              <tbody>
                {selectedVersions.versions.map((v) => (
                  <tr key={v.id}>
                    <td>{v.year}</td>
                    <td>{v.area_ha}</td>
                    <td>{v.length_km}</td>
                    <td>{v.status}</td>
                    <td>{v.change_note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="btn btn-ghost" onClick={() => setSelectedVersions(null)}>Yopish</button>
          </div>
        </div>
      )}
    </div>
  )
}
