import { useEffect, useMemo, useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Legend,
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { statsApi } from '../api/services'
import {
  IcoArea, IcoLayers, IcoPark, IcoRoad, IcoWater, IcoCemetery,
} from '../components/HomeIcons'
import { filterResearchCategoryStats } from '../constants/researchLayers'
import { useI18n } from '../i18n/I18nContext'
import PageLoader from '../components/PageLoader'

const AXIS = { fill: '#93a4bb', fontSize: 11 }
const GRID = { stroke: 'rgba(148,163,184,0.12)', strokeDasharray: '4 6' }
const TIP_WRAP = { outline: 'none', background: 'transparent', border: 'none', boxShadow: 'none' }

const STATUS_I18N = {
  active: 'dash.status.active',
  construction: 'dash.status.construction',
  damaged: 'dash.status.damaged',
  closed: 'dash.status.closed',
  planned: 'dash.status.planned',
}
const COND_I18N = {
  good: 'dash.condition.good',
  normal: 'dash.condition.normal',
  bad: 'dash.condition.bad',
}

function ChartTip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  const suffix = row.unit || unit
  return (
    <div className="home-tooltip">
      <strong>{label || row.name}</strong>
      {payload.map((p) => (
        <em key={p.dataKey}>
          {Number(p.value).toLocaleString('ru-RU')} {suffix || row.unit || ''}
        </em>
      ))}
    </div>
  )
}

function fmtVal(v) {
  const n = Number(v)
  if (!Number.isFinite(n) || n === 0) return ''
  return n >= 100
    ? n.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
    : n.toLocaleString('ru-RU', { maximumFractionDigits: 1 })
}

function fmt(n, d = 1) {
  return Number(n ?? 0).toLocaleString('ru-RU', { maximumFractionDigits: d })
}

export default function Dashboard() {
  const { t } = useI18n()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [year, setYear] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = year ? { year: Number(year) } : {}
    statsApi.dashboard(params)
      .then(({ data: d }) => {
        setData(d)
        if (!year && d?.meta?.selected_year) {
          setYear(String(d.meta.selected_year))
        }
      })
      .catch(() => setError(t('msg.loadFail')))
      .finally(() => setLoading(false))
  }, [t, year])

  const years = data?.meta?.years || data?.meta?.monitoring_years || []

  const cats = useMemo(() => filterResearchCategoryStats(data?.by_category || []).map((c) => {
    const isLine = c.code === 'yollar' || c.code === 'suv'
    return {
      ...c,
      name: t(`layer.${c.code === 'park' ? 'istirohat' : c.code}`),
      metric: isLine ? Number(c.length_km || 0) : Number(c.area_ha || 0),
      unit: isLine ? t('unit.km') : t('unit.ha'),
      count: Number(c.count || 0),
    }
  }), [data, t])

  const roads = useMemo(() => (data?.road_by_class || []).map((r) => ({
    ...r,
    name: t(`road.${r.code}`),
  })), [data, t])

  const water = useMemo(() => (data?.water_by_class || []).map((r) => ({
    ...r,
    name: t(`layer.water.${r.code}`),
  })), [data, t])

  const parks = useMemo(() => (data?.park_by_class || []).map((r) => ({
    ...r,
    name: t(`layer.park.${r.code}`),
  })), [data, t])

  const statusRows = useMemo(() => (data?.by_status || []).map((r) => ({
    ...r,
    name: t(STATUS_I18N[r.code] || 'dash.status.unknown'),
  })), [data, t])

  const condRows = useMemo(() => (data?.by_condition || []).map((r) => ({
    ...r,
    name: t(COND_I18N[r.code] || 'dash.condition.unknown'),
  })), [data, t])

  const mahalla = useMemo(() => (data?.by_mahalla || []).slice(0, 12).map((r) => ({
    ...r,
    name: r.name?.length > 18 ? `${r.name.slice(0, 16)}…` : r.name,
  })), [data])

  if (error) return <div className="page-loading">{error}</div>
  if (loading && !data) return <PageLoader />
  if (!data) return <PageLoader />

  const { kpis, area_dynamics, length_dynamics, meta } = data
  const modeHint = meta?.data_mode === 'scaled'
    ? t('dash.modeScaled')
    : meta?.data_mode === 'versions'
      ? t('dash.modeVersions')
      : t('dash.modeExact')

  const cards = [
    { title: t('home.kpi.objects'), value: fmt(kpis.total_objects, 0), unit: t('unit.pcs'), Icon: IcoLayers, color: '#3b82f6' },
    { title: t('home.kpi.area'), value: fmt(kpis.total_area_ha, 1), unit: t('unit.ha'), Icon: IcoArea, color: '#22c55e' },
    { title: t('home.kpi.roads'), value: fmt(kpis.roads_length_km, 1), unit: `${t('unit.km')} · ${fmt(kpis.roads_count, 0)} ${t('unit.pcs')}`, Icon: IcoRoad, color: '#f97316' },
    { title: t('home.kpi.water'), value: fmt(kpis.water_length_km, 1), unit: `${t('unit.km')} · ${fmt(kpis.water_count, 0)} ${t('unit.pcs')}`, Icon: IcoWater, color: '#38bdf8' },
    { title: t('home.kpi.parks'), value: fmt(kpis.parks_count, 0), unit: `${t('unit.pcs')} / ${fmt(kpis.parks_area_ha, 1)} ${t('unit.ha')}`, Icon: IcoPark, color: '#16a34a' },
    { title: t('home.kpi.cemeteries'), value: fmt(kpis.cemeteries_count, 0), unit: `${t('unit.pcs')} / ${fmt(kpis.cemeteries_area_ha, 1)} ${t('unit.ha')}`, Icon: IcoCemetery, color: '#94a3b8' },
  ]

  return (
    <div className="dashboard-page">
      <header className="dash-head dash-head--row">
        <div>
          <p className="eyebrow">{t('dash.eyebrow')}</p>
          <h2>{t('dash.title')}</h2>
          <p className="muted">{t('dash.sub')}</p>
          <p className="dash-mode">{modeHint}</p>
        </div>
        <label className="dash-year">
          <span>{t('dash.year')}</span>
          <select value={year} onChange={(e) => setYear(e.target.value)} disabled={loading}>
            {years.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </label>
      </header>

      <section className="kpi-grid">
        {cards.map((k) => (
          <div key={k.title} className="kpi-card">
            <span className="kpi-card__icon" style={{ color: k.color, background: `${k.color}22` }}>
              <k.Icon size={32} />
            </span>
            <div className="kpi-card__body">
              <span className="kpi-title">{k.title}</span>
              <strong className="kpi-value">{k.value}</strong>
              <span className="kpi-unit">{k.unit}</span>
            </div>
          </div>
        ))}
      </section>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>{t('dash.byObjects')}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cats} layout="vertical" margin={{ left: 8, right: 40, top: 8, bottom: 4 }} barCategoryGap={18}>
              <CartesianGrid horizontal={false} {...GRID} />
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={128} tick={AXIS} axisLine={false} tickLine={false} interval={0} />
              <Tooltip content={<ChartTip />} cursor={false} wrapperStyle={TIP_WRAP} />
              <Bar dataKey="metric" radius={[0, 8, 8, 0]} barSize={18} background={{ fill: 'rgba(148,163,184,0.08)', radius: 8 }} activeBar={false}>
                {cats.map((c) => <Cell key={c.code} fill={c.color} />)}
                <LabelList dataKey="metric" position="right" fill="#d7e2ef" fontSize={11} formatter={fmtVal} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>{t('dash.byCount')}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cats} layout="vertical" margin={{ left: 8, right: 40, top: 8, bottom: 4 }} barCategoryGap={18}>
              <CartesianGrid horizontal={false} {...GRID} />
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={128} tick={AXIS} axisLine={false} tickLine={false} interval={0} />
              <Tooltip content={<ChartTip unit={t('unit.pcs')} />} cursor={false} wrapperStyle={TIP_WRAP} />
              <Bar dataKey="count" fill="#818cf8" radius={[0, 8, 8, 0]} barSize={18} background={{ fill: 'rgba(148,163,184,0.08)', radius: 8 }} activeBar={false}>
                <LabelList dataKey="count" position="right" fill="#d7e2ef" fontSize={11} formatter={fmtVal} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>{t('dash.areaDyn')}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={area_dynamics} margin={{ left: 0, right: 12, top: 12, bottom: 4 }}>
              <defs>
                <linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.42} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} {...GRID} />
              <XAxis dataKey="year" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip unit={t('unit.ha')} />} cursor={false} wrapperStyle={TIP_WRAP} />
              <Area type="monotone" dataKey="area_ha" stroke="#38bdf8" strokeWidth={2.4} fill="url(#dashArea)" name={t('compare.area')} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>{t('dash.lengthDyn')}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={length_dynamics || []} margin={{ left: 0, right: 12, top: 12, bottom: 4 }}>
              <CartesianGrid vertical={false} {...GRID} />
              <XAxis dataKey="year" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip unit={t('unit.km')} />} cursor={false} wrapperStyle={TIP_WRAP} />
              <Legend />
              <Line type="monotone" dataKey="roads_km" name={t('home.kpi.roads')} stroke="#f97316" strokeWidth={2.2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="water_km" name={t('home.kpi.water')} stroke="#38bdf8" strokeWidth={2.2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>{t('dash.roads')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={roads} layout="vertical" margin={{ left: 8, right: 48, top: 8, bottom: 4 }} barCategoryGap={18}>
              <CartesianGrid horizontal={false} {...GRID} />
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={100} tick={AXIS} axisLine={false} tickLine={false} interval={0} />
              <Tooltip content={<ChartTip unit={t('unit.km')} />} cursor={false} wrapperStyle={TIP_WRAP} />
              <Bar dataKey="length_km" fill="#f97316" radius={[0, 8, 8, 0]} barSize={18} background={{ fill: 'rgba(148,163,184,0.08)', radius: 8 }} activeBar={false}>
                <LabelList dataKey="length_km" position="right" fill="#d7e2ef" fontSize={12} formatter={fmtVal} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>{t('dash.water')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={water} layout="vertical" margin={{ left: 8, right: 48, top: 8, bottom: 4 }} barCategoryGap={22}>
              <CartesianGrid horizontal={false} {...GRID} />
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={100} tick={AXIS} axisLine={false} tickLine={false} interval={0} />
              <Tooltip content={<ChartTip unit={t('unit.km')} />} cursor={false} wrapperStyle={TIP_WRAP} />
              <Bar dataKey="length_km" fill="#38bdf8" radius={[0, 8, 8, 0]} barSize={22} background={{ fill: 'rgba(148,163,184,0.08)', radius: 8 }} activeBar={false}>
                <LabelList dataKey="length_km" position="right" fill="#d7e2ef" fontSize={12} formatter={fmtVal} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>{t('dash.parks')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={parks} layout="vertical" margin={{ left: 8, right: 48, top: 8, bottom: 4 }} barCategoryGap={22}>
              <CartesianGrid horizontal={false} {...GRID} />
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={100} tick={AXIS} axisLine={false} tickLine={false} interval={0} />
              <Tooltip content={<ChartTip unit={t('unit.ha')} />} cursor={false} wrapperStyle={TIP_WRAP} />
              <Bar dataKey="area_ha" fill="#22c55e" radius={[0, 8, 8, 0]} barSize={22} background={{ fill: 'rgba(148,163,184,0.08)', radius: 8 }} activeBar={false}>
                <LabelList dataKey="area_ha" position="right" fill="#d7e2ef" fontSize={12} formatter={fmtVal} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>{t('dash.status')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusRows} margin={{ left: 8, right: 16, top: 8, bottom: 4 }}>
              <CartesianGrid vertical={false} {...GRID} />
              <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip unit={t('unit.pcs')} />} cursor={false} wrapperStyle={TIP_WRAP} />
              <Bar dataKey="count" fill="#a78bfa" radius={[8, 8, 0, 0]} barSize={36} activeBar={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>{t('dash.condition')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={condRows} margin={{ left: 8, right: 16, top: 8, bottom: 4 }}>
              <CartesianGrid vertical={false} {...GRID} />
              <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip unit={t('unit.pcs')} />} cursor={false} wrapperStyle={TIP_WRAP} />
              <Bar dataKey="count" fill="#34d399" radius={[8, 8, 0, 0]} barSize={36} activeBar={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {mahalla.length > 0 && (
          <div className="chart-card full">
            <h3>{t('dash.mfy')}</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={mahalla} layout="vertical" margin={{ left: 8, right: 40, top: 8, bottom: 4 }} barCategoryGap={10}>
                <CartesianGrid horizontal={false} {...GRID} />
                <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={140} tick={AXIS} axisLine={false} tickLine={false} interval={0} />
                <Tooltip content={<ChartTip unit={t('unit.pcs')} />} cursor={false} wrapperStyle={TIP_WRAP} />
                <Bar dataKey="count" fill="#f472b6" radius={[0, 8, 8, 0]} barSize={14} background={{ fill: 'rgba(148,163,184,0.08)', radius: 8 }} activeBar={false}>
                  <LabelList dataKey="count" position="right" fill="#d7e2ef" fontSize={11} formatter={fmtVal} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
