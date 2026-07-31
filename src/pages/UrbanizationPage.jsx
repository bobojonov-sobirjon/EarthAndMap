import { useEffect, useState } from 'react'
import {
  Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { statsApi } from '../api/services'

export default function UrbanizationPage() {
  const [data, setData] = useState(null)
  const [year, setYear] = useState(2025)

  useEffect(() => {
    statsApi.urbanization().then(({ data: d }) => setData(d))
  }, [])

  if (!data) return <div className="page-loading">Urbanizatsiya yuklanmoqda...</div>

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <h2>Urbanizatsiya jarayoni (2000–2025)</h2>
          <p className="muted">Umumiy yer monitoringidan alohida tematik modul</p>
        </div>
        <div className="header-actions">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {(data.years || []).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="kpi-grid compact">
        <div className="kpi-card">
          <span>Urban hudud</span>
          <strong>{data.summary.urban_ha.toLocaleString()} ga</strong>
        </div>
        <div className="kpi-card">
          <span>Qishloq xo‘jaligi yerlari</span>
          <strong>{data.summary.agriculture_ha.toLocaleString()} ga</strong>
        </div>
        <div className="kpi-card">
          <span>Davr</span>
          <strong>{data.summary.period}</strong>
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: '1rem' }}>
        <h3>Urban vs qishloq xo‘jaligi dinamikasi</h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data.series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="year" tick={{ fill: '#aaa' }} />
            <YAxis tick={{ fill: '#aaa' }} />
            <Tooltip contentStyle={{ background: '#1a2332', border: '1px solid #333' }} />
            <Legend />
            <Area type="monotone" dataKey="urban_ha" name="Urban (ga)" stroke="#e74c3c" fill="#e74c3c55" />
            <Area type="monotone" dataKey="agriculture_ha" name="Qishloq xo‘jaligi (ga)" stroke="#27ae60" fill="#27ae6055" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="year-slider-bar">
        {(data.years || []).map((y) => (
          <button
            key={y}
            type="button"
            className={`chip ${y === year ? 'active' : ''}`}
            onClick={() => setYear(y)}
          >
            {y}
          </button>
        ))}
      </div>

      <div className="table-wrap" style={{ marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Yil</th>
              <th>Qatlam</th>
              <th>Turi</th>
              <th>Maydon (ga)</th>
              <th>O‘sish %</th>
            </tr>
          </thead>
          <tbody>
            {(data.layers || [])
              .filter((l) => l.year === year)
              .map((l) => (
                <tr key={l.id}>
                  <td>{l.year}</td>
                  <td>{l.name}</td>
                  <td>{l.layer_kind}</td>
                  <td>{l.area_ha}</td>
                  <td className={l.growth_pct >= 0 ? 'up' : 'down'}>{l.growth_pct}%</td>
                </tr>
              ))}
            {!(data.layers || []).filter((l) => l.year === year).length && (
              (data.series || []).filter((s) => s.year === year).map((s) => (
                <tr key={s.year}>
                  <td>{s.year}</td>
                  <td colSpan={2}>Aggregatsiya</td>
                  <td>Urban {s.urban_ha} / QX {s.agriculture_ha}</td>
                  <td>—</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
