import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { statsApi } from '../api/services'

const QUICK = [
  { to: '/map', label: 'Interaktiv xarita', desc: 'Qatlamlar va obyekt kartochkasi', color: '#2d8cf0' },
  { to: '/dashboard', label: 'Statistika', desc: 'Tahlil va diagrammalar', color: '#8e44ad' },
  { to: '/monitoring', label: 'Monitoring', desc: 'O‘zgarishlar jurnali', color: '#16a085' },
  { to: '/urbanization', label: 'Urbanizatsiya', desc: '2000–2025 jarayoni', color: '#e67e22' },
  { to: '/reports', label: 'Hisobotlar', desc: 'Excel / PDF eksport', color: '#c0392b' },
]

export default function HomePage() {
  const [data, setData] = useState(null)
  const [year, setYear] = useState(2026)
  const [error, setError] = useState(null)

  useEffect(() => {
    statsApi.dashboard({ year })
      .then(({ data: d }) => setData(d))
      .catch((e) => setError(e.message || 'Yuklash xatosi'))
  }, [year])

  if (error) return <div className="page-loading">Xato: {error}</div>
  if (!data) return <div className="page-loading">Bosh sahifa yuklanmoqda...</div>

  const { kpis, project, meta, notice, by_category, area_dynamics, road_by_class, recent_changes } = data
  const pieData = by_category
    .filter((c) => c.area_ha > 0)
    .slice(0, 6)
    .map((c) => ({ name: c.name, value: c.area_ha, color: c.color }))

  return (
    <div className="home-page">
      <header className="home-hero">
        <div className="home-hero-text">
          <p className="eyebrow">Buxoro shahri · Geoinformatsion tizim</p>
          <h1>{project.name}</h1>
          <p className="hero-desc">{project.title_uz}</p>
          <p className="hero-sub">{project.description_uz}</p>
        </div>
        <div className="home-hero-meta">
          <div className="meta-card">
            <span>Monitoring yili</span>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {(meta.monitoring_years || []).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="meta-card">
            <span>Oxirgi yangilanish</span>
            <strong>{new Date(meta.last_updated).toLocaleString('uz')}</strong>
          </div>
          {notice && (
            <div className="meta-card notice">
              <span>Administrator xabari</span>
              <strong>{notice.title}</strong>
              <p>{notice.message}</p>
            </div>
          )}
        </div>
      </header>

      <section className="kpi-grid">
        <Kpi title="Jami obyektlar" value={kpis.total_objects.toLocaleString()} growth={kpis.total_objects_growth_pct} />
        <Kpi title="Jami maydon" value={`${kpis.total_area_ha.toLocaleString()} ga`} growth={kpis.total_area_growth_pct} />
        <Kpi title="Yo‘llar uzunligi" value={`${kpis.roads_length_km.toLocaleString()} km`} growth={kpis.roads_growth_pct} />
        <Kpi title="Suv tarmoqlari" value={`${kpis.water_length_km.toLocaleString()} km`} />
        <Kpi title="Istirohat bog‘lari" value={`${kpis.parks_count} / ${kpis.parks_area_ha} ga`} />
        <Kpi title="Qabristonlar" value={`${kpis.cemeteries_count} / ${kpis.cemeteries_area_ha} ga`} />
      </section>

      <section className="home-charts">
        <div className="chart-card">
          <h3>Kategoriyalar bo‘yicha maydon</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} label>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Maydon dinamikasi (ga) · 2018–2026</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={area_dynamics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="year" tick={{ fill: '#aaa' }} />
              <YAxis tick={{ fill: '#aaa' }} />
              <Tooltip contentStyle={{ background: '#1a2332', border: '1px solid #333' }} />
              <Area type="monotone" dataKey="area_ha" stroke="#2d8cf0" fill="#2d8cf055" name="Maydon (ga)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Yo‘l toifalari bo‘yicha uzunlik (km)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={road_by_class} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" tick={{ fill: '#aaa' }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#aaa', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1a2332', border: '1px solid #333' }} />
              <Bar dataKey="length_km" fill="#9b59b6" name="km" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Oxirgi o‘zgarishlar</h3>
          <ul className="change-list">
            {(recent_changes || []).slice(0, 6).map((c) => (
              <li key={c.id}>
                <strong>{c.land_public_id || c.land_name}</strong>
                <span>{c.description || c.change_type}</span>
                <small>{new Date(c.changed_at).toLocaleString('uz')}</small>
              </li>
            ))}
            {!recent_changes?.length && <li>Hozircha yozuv yo‘q</li>}
          </ul>
          <div className="year-chips">
            <div>
              <small>Monitoring yillari</small>
              <div>{(meta.monitoring_years || []).map((y) => <span key={y} className="chip">{y}</span>)}</div>
            </div>
            <div>
              <small>Urbanizatsiya yillari</small>
              <div>{(meta.urbanization_years || []).map((y) => <span key={y} className="chip chip-orange">{y}</span>)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="quick-links">
        <h2>Tezkor havolalar</h2>
        <div className="quick-grid">
          {QUICK.map((q) => (
            <Link key={q.to} to={q.to} className="quick-card" style={{ borderTopColor: q.color }}>
              <h3>{q.label}</h3>
              <p>{q.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function Kpi({ title, value, growth }) {
  return (
    <div className="kpi-card">
      <span className="kpi-title">{title}</span>
      <strong className="kpi-value">{value}</strong>
      {growth != null && (
        <span className={`kpi-growth ${growth >= 0 ? 'up' : 'down'}`}>
          {growth >= 0 ? '+' : ''}{growth}%
        </span>
      )}
    </div>
  )
}
