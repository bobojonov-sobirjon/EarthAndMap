import { useEffect, useState } from 'react'
import { statsApi } from '../api/services'

export default function ComparePage() {
  const [yearA, setYearA] = useState(2018)
  const [yearB, setYearB] = useState(2026)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data: d } = await statsApi.compare({ year_a: yearA, year_b: yearB })
      setData(d)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const years = [2018, 2020, 2022, 2024, 2026]

  return (
    <div className="module-page">
      <div className="page-header">
        <h2>Taqqoslash va tahlil</h2>
        <div className="header-actions">
          <select value={yearA} onChange={(e) => setYearA(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <span>↔</span>
          <select value={yearB} onChange={(e) => setYearB(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button type="button" className="btn btn-primary" onClick={load} disabled={loading}>
            {loading ? 'Hisoblanmoqda...' : 'Taqqoslash'}
          </button>
        </div>
      </div>

      {data && (
        <>
          <div className="kpi-grid compact">
            <div className="kpi-card"><span>Maydon {data.year_a}</span><strong>{data.summary.total_area_a_ha} ga</strong></div>
            <div className="kpi-card"><span>Maydon {data.year_b}</span><strong>{data.summary.total_area_b_ha} ga</strong></div>
            <div className="kpi-card"><span>Δ mutlaq</span><strong>{data.summary.delta_ha} ga</strong></div>
            <div className="kpi-card"><span>Δ foiz</span><strong>{data.summary.delta_pct}%</strong></div>
            <div className="kpi-card"><span>Kengaygan</span><strong>{data.summary.expanded_count}</strong></div>
            <div className="kpi-card"><span>Qisqargan</span><strong>{data.summary.shrunk_count}</strong></div>
            <div className="kpi-card"><span>Yangi</span><strong>{data.summary.new_count}</strong></div>
            <div className="kpi-card"><span>Yo‘qolgan</span><strong>{data.summary.disappeared_count}</strong></div>
          </div>

          <div className="compare-tables">
            <CompareTable title="Kengaygan obyektlar" rows={data.expanded} />
            <CompareTable title="Qisqargan obyektlar" rows={data.shrunk} />
            <CompareTable title="Yangi paydo bo‘lgan" rows={data.new_objects} simple />
          </div>
        </>
      )}
    </div>
  )
}

function CompareTable({ title, rows, simple }) {
  return (
    <div className="table-wrap">
      <h3 style={{ padding: '0.75rem' }}>{title}</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nomi</th>
            <th>Kategoriya</th>
            {!simple && <th>Maydon A</th>}
            {!simple && <th>Maydon B</th>}
            {!simple && <th>Δ ga</th>}
            {simple && <th>Maydon (ga)</th>}
          </tr>
        </thead>
        <tbody>
          {(rows || []).map((r) => (
            <tr key={r.public_id + r.name}>
              <td>{r.public_id}</td>
              <td>{r.name}</td>
              <td>{r.category}</td>
              {!simple && <td>{r.area_a}</td>}
              {!simple && <td>{r.area_b}</td>}
              {!simple && <td className={r.delta_ha >= 0 ? 'up' : 'down'}>{r.delta_ha}</td>}
              {simple && <td>{r.area_ha}</td>}
            </tr>
          ))}
          {!rows?.length && <tr><td colSpan={6}>Ma’lumot yo‘q</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
