import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { statsApi } from '../api/services'
import {
  IcoArea, IcoArrow, IcoLayers, IcoPark, IcoPercent, IcoRoad,
} from '../components/HomeIcons'
import { displayCategoryName, LAYER_GROUPS } from '../constants/researchLayers'

const YEARS = [2018, 2020, 2022, 2024, 2026]
const PRESETS = [
  { a: 2018, b: 2026, label: '2018 → 2026' },
  { a: 2020, b: 2026, label: '2020 → 2026' },
  { a: 2022, b: 2026, label: '2022 → 2026' },
  { a: 2024, b: 2026, label: '2024 → 2026' },
]

const AXIS = { fill: '#93a4bb', fontSize: 11 }
const GRID = { stroke: 'rgba(148,163,184,0.12)', strokeDasharray: '4 6' }
const TIP_WRAP = { outline: 'none', background: 'transparent', border: 'none', boxShadow: 'none' }
const CAT_COLOR = Object.fromEntries(LAYER_GROUPS.map((g) => [g.key, g.color]))

function fmt(n, d = 2) {
  const x = Number(n ?? 0)
  return x.toLocaleString('ru-RU', { maximumFractionDigits: d })
}

function ChartTip({ active, payload, label, unit = 'ga' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="home-tooltip">
      <strong>{label || payload[0].payload?.name}</strong>
      <em>{fmt(payload[0].value)} {unit}</em>
    </div>
  )
}

export default function ComparePage() {
  const navigate = useNavigate()
  const [yearA, setYearA] = useState(2018)
  const [yearB, setYearB] = useState(2026)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('expanded')
  const [catFilter, setCatFilter] = useState('')
  const [search, setSearch] = useState('')

  const load = async (a = yearA, b = yearB) => {
    setLoading(true)
    try {
      const { data: d } = await statsApi.compare({ year_a: a, year_b: b })
      setData(d)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const swapYears = () => {
    setYearA(yearB)
    setYearB(yearA)
    load(yearB, yearA)
  }

  const s = data?.summary
  const chartData = useMemo(() => (data?.by_category || []).map((c) => ({
    ...c,
    name: c.name,
    color: CAT_COLOR[c.code] || '#38bdf8',
  })), [data])

  const lists = {
    expanded: data?.expanded || [],
    shrunk: data?.shrunk || [],
    new: data?.new_objects || [],
    gone: data?.disappeared || [],
  }

  const rows = useMemo(() => {
    let list = lists[tab] || []
    if (catFilter) {
      list = list.filter((r) => {
        const code = r.category === 'park' ? 'istirohat' : r.category
        return code === catFilter
      })
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((r) =>
        r.name?.toLowerCase().includes(q)
        || r.public_id?.toLowerCase().includes(q),
      )
    }
    return list
  }, [data, tab, catFilter, search])

  const insight = useMemo(() => {
    if (!s || !chartData.length) return ''
    const top = [...chartData].sort((a, b) => Math.abs(b.delta_ha) - Math.abs(a.delta_ha))[0]
    const dir = s.delta_ha >= 0 ? 'oshdi' : 'kamaydi'
    return `${yearA}–${yearB} oralig‘ida umumiy maydon ${fmt(Math.abs(s.delta_pct), 1)}% ${dir}. Eng katta o‘zgarish: ${top.name} (${top.delta_ha >= 0 ? '+' : ''}${fmt(top.delta_ha)} ga).`
  }, [s, chartData, yearA, yearB])

  const tabs = [
    { id: 'expanded', label: 'Kengaygan', count: s?.expanded_count || 0 },
    { id: 'shrunk', label: 'Qisqargan', count: s?.shrunk_count || 0 },
    { id: 'new', label: 'Yangi', count: s?.new_count || 0 },
    { id: 'gone', label: 'Yo‘qolgan', count: s?.disappeared_count || 0 },
  ]

  const simple = tab === 'new' || tab === 'gone'

  return (
    <div className="module-page compare-page">
      <header className="dash-head compare-head">
        <div>
          <p className="eyebrow">Yillar kesimida</p>
          <h2>Taqqoslash va tahlil</h2>
          <p className="muted">Yo‘llar, sug‘orish, bog‘lar va qabristonlar o‘zgarishi</p>
        </div>
        <div className="compare-controls">
          <div className="compare-years">
            <select value={yearA} onChange={(e) => setYearA(Number(e.target.value))}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <button type="button" className="compare-swap" onClick={swapYears} title="Yillarni almashtirish">↔</button>
            <select value={yearB} onChange={(e) => setYearB(Number(e.target.value))}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="compare-presets">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className={`chip ${yearA === p.a && yearB === p.b ? 'active' : ''}`}
                onClick={() => { setYearA(p.a); setYearB(p.b); load(p.a, p.b) }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-primary" onClick={() => load()} disabled={loading}>
            {loading ? 'Hisoblanmoqda...' : 'Taqqoslash'}
          </button>
        </div>
      </header>

      {s && (
        <>
          {insight && <p className="compare-insight">{insight}</p>}

          <section className="kpi-grid">
            <Kpi Icon={IcoArea} color="#38bdf8" title={`Maydon ${data.year_a}`} value={`${fmt(s.total_area_a_ha)} ga`} />
            <Kpi Icon={IcoArea} color="#22c55e" title={`Maydon ${data.year_b}`} value={`${fmt(s.total_area_b_ha)} ga`} />
            <Kpi Icon={IcoLayers} color={s.delta_ha >= 0 ? '#22c55e' : '#f87171'} title="Δ maydon" value={`${s.delta_ha >= 0 ? '+' : ''}${fmt(s.delta_ha)} ga`} />
            <Kpi Icon={IcoPercent} color="#a78bfa" title="Δ foiz" value={`${s.delta_pct >= 0 ? '+' : ''}${s.delta_pct}%`} />
            <Kpi Icon={IcoRoad} color="#f97316" title="Δ uzunlik" value={`${(s.delta_km || 0) >= 0 ? '+' : ''}${fmt(s.delta_km || 0, 2)} km`} />
            <Kpi Icon={IcoPark} color="#94a3b8" title="Barqaror" value={`${s.stable_count || 0} ta`} />
          </section>

          <section className="compare-status">
            <StatusCard label="Kengaygan" value={s.expanded_count} tone="up" onClick={() => setTab('expanded')} active={tab === 'expanded'} />
            <StatusCard label="Qisqargan" value={s.shrunk_count} tone="down" onClick={() => setTab('shrunk')} active={tab === 'shrunk'} />
            <StatusCard label="Yangi" value={s.new_count} tone="new" onClick={() => setTab('new')} active={tab === 'new'} />
            <StatusCard label="Yo‘qolgan" value={s.disappeared_count} tone="gone" onClick={() => setTab('gone')} active={tab === 'gone'} />
          </section>

          <section className="charts-grid">
            <div className="chart-card">
              <h3>Kategoriya bo‘yicha maydon o‘zgarishi (ga)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 36, top: 8, bottom: 0 }} barCategoryGap={16}>
                  <CartesianGrid horizontal={false} {...GRID} />
                  <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={AXIS} axisLine={false} tickLine={false} interval={0} />
                  <Tooltip content={<ChartTip unit="ga" />} cursor={false} wrapperStyle={TIP_WRAP} />
                  <Bar dataKey="delta_ha" radius={[0, 8, 8, 0]} barSize={16} activeBar={false}>
                    {chartData.map((c) => (
                      <Cell key={c.code} fill={c.delta_ha >= 0 ? c.color : '#f87171'} />
                    ))}
                    <LabelList dataKey="delta_ha" position="right" fill="#d7e2ef" fontSize={11} formatter={(v) => (v > 0 ? `+${fmt(v)}` : fmt(v))} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <h3>Yillar kesimidagi maydon</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
                  <CartesianGrid vertical={false} {...GRID} />
                  <XAxis dataKey="name" tick={{ fill: '#93a4bb', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={AXIS} axisLine={false} tickLine={false} />
                  <Tooltip cursor={false} wrapperStyle={TIP_WRAP} content={<ChartTip unit="ga" />} />
                  <Bar dataKey="area_a" name={`${data.year_a}`} fill="#64748b" radius={[6, 6, 0, 0]} barSize={18} activeBar={false} />
                  <Bar dataKey="area_b" name={`${data.year_b}`} fill="#38bdf8" radius={[6, 6, 0, 0]} barSize={18} activeBar={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="chart-card compare-table-card">
            <div className="compare-tabs">
              {tabs.map((t) => (
                <button key={t.id} type="button" className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
                  {t.label} <b>{t.count}</b>
                </button>
              ))}
            </div>
            <div className="compare-filters">
              <input placeholder="Nomi yoki ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                <option value="">Barcha kategoriyalar</option>
                {LAYER_GROUPS.map((g) => (
                  <option key={g.key} value={g.key}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nomi</th>
                    <th>Kategoriya</th>
                    {!simple && <th>{data.year_a}</th>}
                    {!simple && <th>{data.year_b}</th>}
                    {!simple && <th>Δ</th>}
                    {simple && <th>Maydon / uzunlik</th>}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.public_id}-${r.name}`}>
                      <td><code>{r.public_id}</code></td>
                      <td>{r.name}</td>
                      <td>{displayCategoryName(r.category)}</td>
                      {!simple && <td>{fmt(r.area_a ?? r.length_a)}</td>}
                      {!simple && <td>{fmt(r.area_b ?? r.length_b)}</td>}
                      {!simple && (
                        <td className={(r.delta_ha || r.delta_km) >= 0 ? 'up' : 'down'}>
                          {(r.delta_ha || 0) !== 0 ? `${r.delta_ha > 0 ? '+' : ''}${fmt(r.delta_ha)} ga` : `${r.delta_km > 0 ? '+' : ''}${fmt(r.delta_km, 2)} km`}
                        </td>
                      )}
                      {simple && <td>{r.area_ha ? `${fmt(r.area_ha)} ga` : `${fmt(r.length_km, 2)} km`}</td>}
                      <td>
                        {r.id && (
                          <button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate(`/map?land=${r.id}`)}>
                            Xarita <IcoArrow size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr><td colSpan={7}>Bu filtr bo‘yicha yozuv yo‘q</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function Kpi({ Icon, color, title, value }) {
  return (
    <div className="kpi-card">
      <span className="kpi-card__icon" style={{ color, background: `${color}22` }}><Icon size={28} /></span>
      <div className="kpi-card__body">
        <span className="kpi-title">{title}</span>
        <strong className="kpi-value">{value}</strong>
      </div>
    </div>
  )
}

function StatusCard({ label, value, tone, onClick, active }) {
  return (
    <button type="button" className={`compare-status__card ${tone} ${active ? 'is-on' : ''}`} onClick={onClick}>
      <strong>{value}</strong>
      <span>{label}</span>
    </button>
  )
}
