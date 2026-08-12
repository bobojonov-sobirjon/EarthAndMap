import { useEffect, useMemo, useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { statsApi } from '../api/services'
import {
  IcoArea, IcoLayers, IcoPark, IcoRoad, IcoWater, IcoCemetery,
} from '../components/HomeIcons'
import { filterResearchCategoryStats, ROAD_CLASS_LABELS } from '../constants/researchLayers'

const AXIS = { fill: '#93a4bb', fontSize: 11 }
const GRID = { stroke: 'rgba(148,163,184,0.12)', strokeDasharray: '4 6' }
const TIP_WRAP = { outline: 'none', background: 'transparent', border: 'none', boxShadow: 'none' }

function ChartTip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  const suffix = row.unit || unit
  return (
    <div className="home-tooltip">
      <strong>{label || row.name}</strong>
      <em>{Number(payload[0].value).toLocaleString('ru-RU')} {suffix}</em>
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

function fmt(n) {
  return Number(n ?? 0).toLocaleString('ru-RU')
}

const SHORT_NAME = {
  yollar: "Avtomobil yo'llari",
  suv: "Sug'orish tarmoqlari",
  istirohat: "Istirohat bog'lari",
  qabriston: 'Qabristonlar',
}

export default function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    statsApi.dashboard().then(({ data: d }) => setData(d))
  }, [])

  const cats = useMemo(() => filterResearchCategoryStats(data?.by_category || []).map((c) => {
    const isLine = c.code === 'yollar' || c.code === 'suv'
    return {
      ...c,
      name: SHORT_NAME[c.code] || c.name,
      metric: isLine ? Number(c.length_km || 0) : Number(c.area_ha || 0),
      unit: isLine ? 'km' : 'ga',
    }
  }), [data])

  const roads = useMemo(() => (data?.road_by_class || [])
    .filter((r) => ROAD_CLASS_LABELS[r.code])
    .map((r) => ({ ...r, name: ROAD_CLASS_LABELS[r.code] })), [data])

  if (!data) return <div className="page-loading">Statistika yuklanmoqda...</div>

  const { kpis, area_dynamics } = data

  const cards = [
    { title: 'Jami obyektlar', value: fmt(kpis.total_objects), unit: 'ta', Icon: IcoLayers, color: '#3b82f6' },
    { title: 'Jami maydon', value: fmt(kpis.total_area_ha), unit: 'ga', Icon: IcoArea, color: '#22c55e' },
    { title: 'Yo‘llar uzunligi', value: fmt(kpis.roads_length_km), unit: 'km', Icon: IcoRoad, color: '#f97316' },
    { title: 'Sug‘orish tarmoqlari', value: fmt(kpis.water_length_km), unit: 'km', Icon: IcoWater, color: '#38bdf8' },
    { title: 'Istirohat bog‘lari', value: fmt(kpis.parks_count), unit: `ta / ${kpis.parks_area_ha} ga`, Icon: IcoPark, color: '#16a34a' },
    { title: 'Qabristonlar', value: fmt(kpis.cemeteries_count), unit: `ta / ${kpis.cemeteries_area_ha} ga`, Icon: IcoCemetery, color: '#94a3b8' },
  ]

  return (
    <div className="dashboard-page">
      <header className="dash-head">
        <div>
          <p className="eyebrow">Tahlil</p>
          <h2>Statistika va tahlil</h2>
          <p className="muted">Asosiy obyektlar, maydon dinamikasi va yo‘l toifalari</p>
        </div>
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
          <h3>Asosiy obyektlar bo‘yicha ko‘rsatkich</h3>
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
          <h3>Yillar bo‘yicha maydon dinamikasi (ga)</h3>
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
              <Tooltip content={<ChartTip unit="ga" />} cursor={false} wrapperStyle={TIP_WRAP} />
              <Area type="monotone" dataKey="area_ha" stroke="#38bdf8" strokeWidth={2.4} fill="url(#dashArea)" name="Maydon" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card full">
          <h3>Yo‘l toifalari bo‘yicha uzunlik (km)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={roads} layout="vertical" margin={{ left: 8, right: 48, top: 8, bottom: 4 }} barCategoryGap={22}>
              <defs>
                <linearGradient id="dashRoad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#fdba74" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} {...GRID} />
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={100} tick={AXIS} axisLine={false} tickLine={false} interval={0} />
              <Tooltip content={<ChartTip unit="km" />} cursor={false} wrapperStyle={TIP_WRAP} />
              <Bar dataKey="length_km" fill="url(#dashRoad)" radius={[0, 8, 8, 0]} barSize={22} background={{ fill: 'rgba(148,163,184,0.08)', radius: 8 }} activeBar={false}>
                <LabelList dataKey="length_km" position="right" fill="#d7e2ef" fontSize={12} formatter={fmtVal} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
