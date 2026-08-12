import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { statsApi } from '../api/services'
import MiniMapPreview from '../components/MiniMapPreview'
import {
  IcoArea, IcoArrow, IcoCalendar, IcoCemetery, IcoChart, IcoCheck, IcoCity,
  IcoClock, IcoCloud, IcoDatabase, IcoLayers, IcoMahalla, IcoMap,
  IcoMonitor, IcoPark, IcoPercent, IcoReport, IcoRoad, IcoUrban, IcoWater,
} from '../components/HomeIcons'
import {
  filterResearchCategoryStats,
  LAYER_GROUPS,
  ROAD_CLASS_LABELS,
} from '../constants/researchLayers'

const QUICK = [
  { to: '/map', label: 'Interaktiv xarita', desc: 'Kadastr xaritasi', color: '#38bdf8', Icon: IcoMap },
  { to: '/dashboard', label: 'Statistika', desc: 'Tahlil va diagrammalar', color: '#a78bfa', Icon: IcoChart },
  { to: '/monitoring', label: 'Monitoring', desc: 'Yillar bo‘yicha o‘zgarish', color: '#2dd4bf', Icon: IcoMonitor },
  { to: '/urbanization', label: 'Urbanizatsiya', desc: '2000–2025 jarayoni', color: '#fb923c', Icon: IcoUrban },
  { to: '/reports', label: 'Hisobotlar', desc: 'Excel / PDF eksport', color: '#f87171', Icon: IcoReport },
]

const KPI_META = [
  { key: 'objects', title: 'Jami obyektlar', Icon: IcoLayers, color: '#3b82f6' },
  { key: 'area', title: 'Jami maydon', Icon: IcoArea, color: '#22c55e' },
  { key: 'roads', title: 'Yo‘llar uzunligi', Icon: IcoRoad, color: '#f97316' },
  { key: 'water', title: 'Sug‘orish tarmoqlari', Icon: IcoWater, color: '#38bdf8' },
  { key: 'parks', title: 'Istirohat bog‘lari', Icon: IcoPark, color: '#16a34a' },
  { key: 'cemeteries', title: 'Qabristonlar', Icon: IcoCemetery, color: '#94a3b8' },
]

const AXIS = { fill: '#93a4bb', fontSize: 11 }
const GRID = { stroke: 'rgba(148,163,184,0.12)', strokeDasharray: '4 6' }

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

const TIP_PROPS = {
  content: <ChartTip />,
  cursor: false,
  wrapperStyle: { outline: 'none', background: 'transparent', border: 'none', boxShadow: 'none' },
}

function fmtVal(v) {
  const n = Number(v)
  if (!Number.isFinite(n) || n === 0) return ''
  return n >= 100 ? n.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) : n.toLocaleString('ru-RU', { maximumFractionDigits: 1 })
}

export default function HomePage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    statsApi.dashboard({ year: 2026 })
      .then(({ data: d }) => setData(d))
      .catch((e) => setError(e.message || 'Yuklash xatosi'))
  }, [])

  const researchCats = useMemo(
    () => filterResearchCategoryStats(data?.by_category || []).map((c) => ({
      ...c,
      name: c.code === 'istirohat' ? "Istirohat bog'lari" : c.name,
    })),
    [data],
  )

  const roadClasses = useMemo(() => {
    return (data?.road_by_class || [])
      .filter((r) => ROAD_CLASS_LABELS[r.code])
      .map((r) => ({
        ...r,
        name: ROAD_CLASS_LABELS[r.code],
      }))
  }, [data])

  const objectStats = useMemo(() => researchCats.map((c) => {
    const isLine = c.code === 'yollar' || c.code === 'suv'
    return {
      ...c,
      metric: isLine ? Number(c.length_km || 0) : Number(c.area_ha || 0),
      unit: isLine ? 'km' : 'ga',
    }
  }), [researchCats])

  if (error) return <div className="page-loading">Xato: {error}</div>
  if (!data) return <div className="page-loading">Bosh sahifa yuklanmoqda...</div>

  const { kpis, project, meta, recent_changes, area_dynamics } = data
  const updated = new Date(meta.last_updated)

  const fmt = (n) => Number(n ?? 0).toLocaleString('ru-RU')
  const kpiValues = {
    objects: { value: fmt(kpis.total_objects), unit: 'ta' },
    area: { value: fmt(kpis.total_area_ha), unit: 'ga' },
    roads: { value: fmt(kpis.roads_length_km), unit: 'km' },
    water: { value: fmt(kpis.water_length_km), unit: 'km' },
    parks: { value: fmt(kpis.parks_count), unit: `ta / ${kpis.parks_area_ha} ga` },
    cemeteries: { value: fmt(kpis.cemeteries_count), unit: `ta / ${kpis.cemeteries_area_ha} ga` },
  }

  return (
    <div className="home-page">
      <header className="home-hero home-hero-compact">
        <div className="home-hero-text">
          <p className="eyebrow">Buxoro shahri — geoinformatsion tizim</p>
          <h1>{project.name}</h1>
          <p className="hero-desc">
            Umumiy foydalanishdagi yer obyektlarining elektron reyestri va monitoringi.
            Yo‘llar, sug‘orish tarmoqlari, istirohat bog‘lari va qabristonlar yagona
            geoinformatsion platformada yuritiladi.
          </p>
          <div className="hero-chips">
            <span>Yo‘llar</span>
            <span>Sug‘orish</span>
            <span>Bog‘lar</span>
            <span>Qabristonlar</span>
          </div>
          <Link to="/map" className="hero-cta">
            Interaktiv xaritani ochish <IcoArrow size={18} />
          </Link>
        </div>
        <div className="home-hero-meta home-status-row">
          <div className="meta-card meta-card--year">
            <span className="meta-card__icon"><IcoCalendar size={28} /></span>
            <div className="meta-card__body">
              <span>Monitoring yili</span>
              <strong>{meta.selected_year || meta.current_monitoring_year || 2026}</strong>
            </div>
          </div>
          <div className="meta-card meta-card--time">
            <span className="meta-card__icon"><IcoClock size={28} /></span>
            <div className="meta-card__body">
              <span>Oxirgi yangilanish</span>
              <strong>
                {updated.toLocaleDateString('uz-UZ')}
                <small>{updated.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</small>
              </strong>
            </div>
          </div>
          <div className="meta-card meta-card--data ok">
            <span className="meta-card__icon"><IcoDatabase size={28} /></span>
            <div className="meta-card__body">
              <span>Ma'lumot holati</span>
              <strong>
                <span className="status-badge status-badge--ok">
                  <IcoCheck size={14} /> Aktual
                </span>
              </strong>
            </div>
          </div>
          <div className="meta-card meta-card--sys ok">
            <span className="meta-card__icon"><IcoCloud size={28} /></span>
            <div className="meta-card__body">
              <span>Tizim holati</span>
              <strong>
                <span className="status-badge status-badge--live">
                  <span className="status-dot" /> Faol
                </span>
              </strong>
            </div>
          </div>
        </div>
      </header>

      <section className="kpi-grid">
        {KPI_META.map((k) => (
          <div key={k.key} className="kpi-card">
            <span className="kpi-card__icon" style={{ color: k.color, background: `${k.color}22` }}>
              <k.Icon size={32} />
            </span>
            <div className="kpi-card__body">
              <span className="kpi-title">{k.title}</span>
              <strong className="kpi-value">{kpiValues[k.key].value}</strong>
              <span className="kpi-unit">{kpiValues[k.key].unit}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="home-mid-grid">
        <div className="chart-card mini-map-card">
          <h3>Buxoro shahri — mini xarita</h3>
          <MiniMapPreview />
          <div className="mini-legend">
            {LAYER_GROUPS.map((g) => (
              <span key={g.key}><i style={{ background: g.color }} /> {g.name}</span>
            ))}
          </div>
        </div>

        <div className="chart-card coverage-card">
          <h3>Hududiy qamrov</h3>
          <ul className="coverage-list">
            <li>
              <span className="coverage-list__icon" style={{ color: '#38bdf8' }}><IcoCity size={24} /></span>
              <span className="coverage-list__text">
                <small>Buxoro shahri maydoni</small>
                <strong>7 966 ga</strong>
              </span>
            </li>
            <li>
              <span className="coverage-list__icon" style={{ color: '#818cf8' }}><IcoMahalla size={24} /></span>
              <span className="coverage-list__text">
                <small>MFY soni</small>
                <strong>65 ta</strong>
              </span>
            </li>
            <li>
              <span className="coverage-list__icon" style={{ color: '#34d399' }}><IcoPercent size={24} /></span>
              <span className="coverage-list__text">
                <small>Monitoring qamrovi</small>
                <strong>100%</strong>
                <span className="coverage-bar"><i style={{ width: '100%' }} /></span>
              </span>
            </li>
            <li>
              <span className="coverage-list__icon" style={{ color: '#fb923c' }}><IcoCalendar size={24} /></span>
              <span className="coverage-list__text">
                <small>Oxirgi monitoring</small>
                <strong>{meta.current_monitoring_year || 2026} yil</strong>
              </span>
            </li>
          </ul>
        </div>

        <div className="chart-card">
          <h3>Asosiy obyektlar bo‘yicha statistika</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={objectStats} layout="vertical" margin={{ left: 8, right: 36, top: 4, bottom: 0 }} barCategoryGap={14}>
              <CartesianGrid horizontal={false} {...GRID} />
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={118} tick={AXIS} axisLine={false} tickLine={false} />
              <Tooltip {...TIP_PROPS} />
              <Bar dataKey="metric" name="Qiymat" radius={[0, 8, 8, 0]} barSize={16} background={{ fill: 'rgba(148,163,184,0.08)', radius: 8 }} activeBar={false}>
                {objectStats.map((c) => (
                  <Cell key={c.code} fill={c.color} />
                ))}
                <LabelList dataKey="metric" position="right" fill="#d7e2ef" fontSize={11} formatter={fmtVal} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="home-charts home-charts-3">
        <div className="chart-card">
          <h3>Maydon dinamikasi (ga) · 2018–2026</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={area_dynamics} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.42} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} {...GRID} />
              <XAxis dataKey="year" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip unit="ga" />} cursor={false} wrapperStyle={TIP_PROPS.wrapperStyle} />
              <Area type="monotone" dataKey="area_ha" stroke="#38bdf8" strokeWidth={2.4} fill="url(#areaFill)" name="Maydon" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Yo‘llar toifalari bo‘yicha uzunlik (km)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={roadClasses} layout="vertical" margin={{ left: 8, right: 36, top: 4, bottom: 0 }} barCategoryGap={18}>
              <defs>
                <linearGradient id="roadBar" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#fdba74" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} {...GRID} />
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={90} tick={AXIS} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip unit="km" />} cursor={false} wrapperStyle={TIP_PROPS.wrapperStyle} />
              <Bar dataKey="length_km" fill="url(#roadBar)" name="km" radius={[0, 8, 8, 0]} barSize={18} background={{ fill: 'rgba(148,163,184,0.08)', radius: 8 }} activeBar={false}>
                <LabelList dataKey="length_km" position="right" fill="#d7e2ef" fontSize={11} formatter={fmtVal} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card changes-card">
          <h3>Oxirgi o‘zgarishlar</h3>
          <ul className="change-list">
            {(recent_changes || []).slice(0, 6).map((c) => (
              <li key={c.id}>
                <span className="change-list__icon"><IcoLayers size={16} /></span>
                <div>
                  <strong>{c.land_name || c.description}</strong>
                  <span>{c.description || c.change_type}</span>
                  <small>{new Date(c.changed_at).toLocaleDateString('uz-UZ')}</small>
                </div>
              </li>
            ))}
            {!recent_changes?.length && <li className="change-list__empty">Hozircha yozuv yo‘q</li>}
          </ul>
          <Link to="/monitoring" className="link-more">
            Barchasini ko‘rish <IcoArrow size={16} />
          </Link>
        </div>
      </section>

      <section className="quick-links">
        <h2>Tezkor havolalar</h2>
        <div className="quick-grid">
          {QUICK.map((q) => (
            <Link key={q.to} to={q.to} className="quick-card" style={{ '--quick-accent': q.color }}>
              <span className="quick-card__icon"><q.Icon size={26} /></span>
              <h3>{q.label}</h3>
              <p>{q.desc}</p>
              <em>Ochish <IcoArrow size={14} /></em>
            </Link>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <div>
          <h4>Ma'lumot manbalari</h4>
          <p>Davlat kadastrlari palatasi · OSM · Sentinel-2 · Landsat 8 · Buxoro shahar kadastri</p>
        </div>
        <div>
          <h4>Texnologiyalar</h4>
          <p>Leaflet · PostgreSQL / PostGIS · GeoServer</p>
        </div>
        <div>
          <h4>Platforma</h4>
          <p>© {new Date().getFullYear()} Buxoro GIS · Elektron reyestr va monitoring</p>
        </div>
      </footer>
    </div>
  )
}
