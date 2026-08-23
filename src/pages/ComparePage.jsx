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
import { useI18n } from '../i18n/I18nContext'
import { apiError } from '../i18n/apiError'
import { CURRENT_YEAR, YEARS } from '../constants/years'
import PageLoader from '../components/PageLoader'
const PRESETS = [
  { a: 2010, b: CURRENT_YEAR, label: `2010 → ${CURRENT_YEAR}` },
  { a: 2018, b: CURRENT_YEAR, label: `2018 → ${CURRENT_YEAR}` },
  { a: 2020, b: CURRENT_YEAR, label: `2020 → ${CURRENT_YEAR}` },
  { a: 2024, b: CURRENT_YEAR, label: `2024 → ${CURRENT_YEAR}` },
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
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [yearA, setYearA] = useState(2010)
  const [yearB, setYearB] = useState(CURRENT_YEAR)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('expanded')
  const [catFilter, setCatFilter] = useState('')
  const [search, setSearch] = useState('')

  const load = async (a = yearA, b = yearB) => {
    setLoading(true)
    setError('')
    try {
      const { data: d } = await statsApi.compare({ year_a: a, year_b: b })
      setData(d)
    } catch (err) {
      setError(apiError(err, t, 'msg.loadFail'))
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
    name: t(`layer.${c.code === 'park' ? 'istirohat' : c.code}`),
    color: CAT_COLOR[c.code] || '#38bdf8',
  })), [data, t])

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
    { id: 'expanded', label: t('compare.expanded'), count: s?.expanded_count || 0 },
    { id: 'shrunk', label: t('compare.shrunk'), count: s?.shrunk_count || 0 },
    { id: 'new', label: t('compare.new'), count: s?.new_count || 0 },
    { id: 'gone', label: t('compare.gone'), count: s?.disappeared_count || 0 },
  ]

  const simple = tab === 'new' || tab === 'gone'

  return (
    <div className="module-page compare-page">
      <header className="dash-head compare-head">
        <div>
          <p className="eyebrow">{t('compare.eyebrow')}</p>
          <h2>{t('compare.title')}</h2>
          <p className="muted">{t('compare.sub')}</p>
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
            {loading ? t('compare.wait') : t('compare.run')}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>{t('compare.print')}</button>
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}

      {loading && !data && <PageLoader />}

      {s && (
        <>
          {insight && <p className="compare-insight">{insight}</p>}

          <section className="compare-swipe chart-card">
            <h3>{t('compare.before')}</h3>
            <p className="muted">{t('compare.swipe').replace('{a}', data.year_a).replace('{b}', data.year_b)}</p>
            <SwipeYears yearA={data.year_a} yearB={data.year_b} areaA={s.total_area_a_ha} areaB={s.total_area_b_ha} />
          </section>

          <section className="kpi-grid">
            <Kpi Icon={IcoArea} color="#38bdf8" title={`${t('compare.area')} ${data.year_a}`} value={`${fmt(s.total_area_a_ha)} ga`} />
            <Kpi Icon={IcoArea} color="#22c55e" title={`${t('compare.area')} ${data.year_b}`} value={`${fmt(s.total_area_b_ha)} ga`} />
            <Kpi Icon={IcoLayers} color={s.delta_ha >= 0 ? '#22c55e' : '#f87171'} title={`Δ ${t('compare.area').toLowerCase()}`} value={`${s.delta_ha >= 0 ? '+' : ''}${fmt(s.delta_ha)} ga`} />
            <Kpi Icon={IcoPercent} color="#a78bfa" title={t('compare.pct')} value={`${s.delta_pct >= 0 ? '+' : ''}${s.delta_pct}%`} />
            <Kpi Icon={IcoRoad} color="#f97316" title={t('compare.len')} value={`${(s.delta_km || 0) >= 0 ? '+' : ''}${fmt(s.delta_km || 0, 2)} km`} />
            <Kpi Icon={IcoPark} color="#94a3b8" title={t('compare.stable')} value={`${s.stable_count || 0} ${t('unit.pcs')}`} />
            <Kpi
              Icon={IcoPark}
              color="#4ade80"
              title={t('compare.green')}
              value={`${fmt((chartData.find((c) => c.code === 'istirohat' || c.code === 'park')?.area_b) || 0)} ga`}
            />
          </section>

          <section className="compare-status">
            <StatusCard label={t('compare.expanded')} value={s.expanded_count} tone="up" onClick={() => setTab('expanded')} active={tab === 'expanded'} />
            <StatusCard label={t('compare.shrunk')} value={s.shrunk_count} tone="down" onClick={() => setTab('shrunk')} active={tab === 'shrunk'} />
            <StatusCard label={t('compare.new')} value={s.new_count} tone="new" onClick={() => setTab('new')} active={tab === 'new'} />
            <StatusCard label={t('compare.gone')} value={s.disappeared_count} tone="gone" onClick={() => setTab('gone')} active={tab === 'gone'} />
          </section>

          <section className="charts-grid">
            <div className="chart-card">
              <h3>{t('compare.byCat')}</h3>
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
              <h3>{t('compare.byYear')}</h3>
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
              {tabs.map((item) => (
                <button key={item.id} type="button" className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
                  {item.label} <b>{item.count}</b>
                </button>
              ))}
            </div>
            <div className="compare-filters">
              <input placeholder={t('lands.searchPh')} value={search} onChange={(e) => setSearch(e.target.value)} />
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                <option value="">{t('lands.allCats')}</option>
                {LAYER_GROUPS.map((g) => (
                  <option key={g.key} value={g.key}>{t(`layer.${g.key}`)}</option>
                ))}
              </select>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{t('lands.col.name')}</th>
                    <th>{t('lands.col.type')}</th>
                    {!simple && <th>{data.year_a}</th>}
                    {!simple && <th>{data.year_b}</th>}
                    {!simple && <th>Δ</th>}
                    {simple && <th>{t('compare.areaLen')}</th>}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.public_id}-${r.name}`}>
                      <td><code>{r.public_id}</code></td>
                      <td>{r.name}</td>
                      <td>{displayCategoryName(r.category, lang)}</td>
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
                          {t('nav.map')} <IcoArrow size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr><td colSpan={7}>{t('home.noChanges')}</td></tr>
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

function SwipeYears({ yearA, yearB, areaA, areaB }) {
  const [pct, setPct] = useState(50)
  return (
    <div className="swipe-years">
      <div className="swipe-years__stage">
        <div className="swipe-years__pane swipe-years__pane--a">
          <b>{yearA}</b>
          <span>{fmt(areaA)} ga</span>
        </div>
        <div className="swipe-years__pane swipe-years__pane--b" style={{ clipPath: `inset(0 0 0 ${pct}%)` }}>
          <b>{yearB}</b>
          <span>{fmt(areaB)} ga</span>
        </div>
        <div className="swipe-years__line" style={{ left: `${pct}%` }} />
      </div>
      <input type="range" min={5} max={95} value={pct} onChange={(e) => setPct(Number(e.target.value))} />
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
