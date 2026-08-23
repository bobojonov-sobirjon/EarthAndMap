import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { statsApi } from '../api/services'
import PageLoader from '../components/PageLoader'
import MiniMapPreview from '../components/MiniMapPreview'
import {
  IcoArea, IcoArrow, IcoCalendar, IcoCemetery, IcoChart, IcoCheck, IcoCity,
  IcoClock, IcoCloud, IcoDatabase, IcoLayers, IcoMahalla, IcoMap,
  IcoMonitor, IcoPark, IcoPercent, IcoReport, IcoRoad, IcoUrban, IcoWater,
} from '../components/HomeIcons'
import { useI18n } from '../i18n/I18nContext'
import { loc, dateLocale } from '../i18n/loc'
import {
  filterResearchCategoryStats,
  LAYER_GROUPS,
} from '../constants/researchLayers'

const QUICK = [
  { to: '/map', labelKey: 'home.quick.map', descKey: 'home.quick.mapDesc', color: '#38bdf8', Icon: IcoMap },
  { to: '/lands', labelKey: 'home.quick.lands', descKey: 'home.quick.landsDesc', color: '#22c55e', Icon: IcoLayers },
  { to: '/dashboard', labelKey: 'home.quick.stats', descKey: 'home.quick.statsDesc', color: '#a78bfa', Icon: IcoChart },
  { to: '/monitoring', labelKey: 'home.quick.mon', descKey: 'home.quick.monDesc', color: '#2dd4bf', Icon: IcoMonitor },
  { to: '/urbanization', labelKey: 'home.quick.urban', descKey: 'home.quick.urbanDesc', color: '#fb923c', Icon: IcoUrban },
]

const KPI_META = [
  { key: 'objects', titleKey: 'home.kpi.objects', Icon: IcoLayers, color: '#3b82f6' },
  { key: 'area', titleKey: 'home.kpi.area', Icon: IcoArea, color: '#22c55e' },
  { key: 'roads', titleKey: 'home.kpi.roads', Icon: IcoRoad, color: '#f97316' },
  { key: 'water', titleKey: 'home.kpi.water', Icon: IcoWater, color: '#38bdf8' },
  { key: 'parks', titleKey: 'home.kpi.parks', Icon: IcoPark, color: '#16a34a' },
  { key: 'cemeteries', titleKey: 'home.kpi.cemeteries', Icon: IcoCemetery, color: '#94a3b8' },
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
  const { t, lang } = useI18n()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    statsApi.dashboard({ year: 2026 })
      .then(({ data: d }) => setData(d))
      .catch(() => setError(t('msg.loadFail')))
  }, [t])

  const researchCats = useMemo(
    () => filterResearchCategoryStats(data?.by_category || []).map((c) => ({
      ...c,
      name: t(`layer.${c.code === 'park' ? 'istirohat' : c.code}`),
    })),
    [data, lang, t],
  )

  const roadClasses = useMemo(() => {
    return (data?.road_by_class || [])
      .filter((r) => ['magistral', 'shahar', 'mahalliy'].includes(r.code))
      .map((r) => ({
        ...r,
        name: t(`road.${r.code}`),
      }))
  }, [data, t])

  const objectStats = useMemo(() => researchCats.map((c) => {
    const isLine = c.code === 'yollar' || c.code === 'suv'
    return {
      ...c,
      metric: isLine ? Number(c.length_km || 0) : Number(c.area_ha || 0),
      unit: isLine ? t('unit.km') : t('unit.ha'),
    }
  }), [researchCats, t])

  if (error) return <div className="page-loading">{t('msg.error')}: {error}</div>
  if (!data) return <PageLoader />

  const { kpis, project, meta, recent_changes, area_dynamics } = data
  const updated = new Date(meta.last_updated)

  const fmt = (n) => Number(n ?? 0).toLocaleString('ru-RU')
  const kpiValues = {
    objects: { value: fmt(kpis.total_objects), unit: t('unit.pcs') },
    area: { value: fmt(kpis.total_area_ha), unit: t('unit.ha') },
    roads: { value: fmt(kpis.roads_length_km), unit: t('unit.km') },
    water: { value: fmt(kpis.water_length_km), unit: t('unit.km') },
    parks: { value: fmt(kpis.parks_count), unit: `${t('unit.pcs')} / ${kpis.parks_area_ha} ${t('unit.ha')}` },
    cemeteries: { value: fmt(kpis.cemeteries_count), unit: `${t('unit.pcs')} / ${kpis.cemeteries_area_ha} ${t('unit.ha')}` },
  }

  return (
    <div className="home-page">
      <header className="home-hero home-hero-compact">
        <div className="home-hero-text">
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1>{loc(project, 'title', lang) || project.name}</h1>
          <p className="hero-desc">{loc(project, 'description', lang) || t('home.heroDesc')}</p>
          <div className="hero-chips">
            <span>{t('layer.yollar')}</span>
            <span>{t('layer.suv')}</span>
            <span>{t('layer.istirohat')}</span>
            <span>{t('layer.qabriston')}</span>
          </div>
          <Link to="/map" className="hero-cta">
            {t('map.open')} <IcoArrow size={18} />
          </Link>
        </div>
        <div className="home-hero-meta home-status-row">
          <div className="meta-card meta-card--year">
            <span className="meta-card__icon"><IcoCalendar size={22} /></span>
            <div className="meta-card__body">
                    <span className="meta-card__label">{t('home.year')}</span>
              <strong>{meta.selected_year || meta.current_monitoring_year || 2026}</strong>
            </div>
          </div>
          <div className="meta-card meta-card--time">
            <span className="meta-card__icon"><IcoClock size={22} /></span>
            <div className="meta-card__body">
                    <span className="meta-card__label">{t('home.updated')}</span>
              <strong>
                {updated.toLocaleDateString(dateLocale(lang))}
                <small>{updated.toLocaleTimeString(dateLocale(lang), { hour: '2-digit', minute: '2-digit' })}</small>
              </strong>
            </div>
          </div>
          <div className="meta-card meta-card--data ok">
            <span className="meta-card__icon"><IcoDatabase size={22} /></span>
            <div className="meta-card__body">
                    <span className="meta-card__label">{t('home.dataStatus')}</span>
              <strong>
                <span className="status-badge status-badge--ok">
                  <IcoCheck size={14} /> {t('home.actual')}
                </span>
              </strong>
            </div>
          </div>
          <div className="meta-card meta-card--sys ok">
            <span className="meta-card__icon"><IcoCloud size={22} /></span>
            <div className="meta-card__body">
                    <span className="meta-card__label">{t('home.sysStatus')}</span>
              <strong>
                <span className="status-badge status-badge--live">
                  <span className="status-dot" /> {t('home.alive')}
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
              <span className="kpi-title">{t(k.titleKey)}</span>
              <strong className="kpi-value">{kpiValues[k.key].value}</strong>
              <span className="kpi-unit">{kpiValues[k.key].unit}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="home-mid-grid">
        <div className="chart-card mini-map-card">
          <h3>{t('home.miniMap')}</h3>
          <MiniMapPreview />
          <div className="mini-legend">
            {LAYER_GROUPS.map((g) => (
              <span key={g.key}><i style={{ background: g.color }} /> {t(`layer.${g.key}`)}</span>
            ))}
          </div>
        </div>

        <div className="chart-card coverage-card">
          <h3>{t('home.coverage')}</h3>
          <ul className="coverage-list">
            <li>
              <span className="coverage-list__icon" style={{ color: '#38bdf8' }}><IcoCity size={24} /></span>
              <span className="coverage-list__text">
                <small>{t('home.cityArea')}</small>
                <strong>7 966 {t('unit.ha')}</strong>
              </span>
            </li>
            <li>
              <span className="coverage-list__icon" style={{ color: '#818cf8' }}><IcoMahalla size={24} /></span>
              <span className="coverage-list__text">
                <small>{t('home.mfyCount')}</small>
                <strong>65 {t('unit.pcs')}</strong>
              </span>
            </li>
            <li>
              <span className="coverage-list__icon" style={{ color: '#34d399' }}><IcoPercent size={24} /></span>
              <span className="coverage-list__text">
                <small>{t('home.monCover')}</small>
                <strong>100%</strong>
                <span className="coverage-bar"><i style={{ width: '100%' }} /></span>
              </span>
            </li>
            <li>
              <span className="coverage-list__icon" style={{ color: '#fb923c' }}><IcoCalendar size={24} /></span>
              <span className="coverage-list__text">
                <small>{t('home.lastMon')}</small>
                <strong>{meta.current_monitoring_year || 2026} {t('unit.year')}</strong>
              </span>
            </li>
          </ul>
        </div>

        <div className="chart-card">
          <h3>{t('dash.byObjects')}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={objectStats} layout="vertical" margin={{ left: 8, right: 36, top: 4, bottom: 0 }} barCategoryGap={14}>
              <CartesianGrid horizontal={false} {...GRID} />
              <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={118} tick={AXIS} axisLine={false} tickLine={false} />
              <Tooltip {...TIP_PROPS} />
              <Bar dataKey="metric" name={t('chart.value')} radius={[0, 8, 8, 0]} barSize={16} background={{ fill: 'rgba(148,163,184,0.08)', radius: 8 }} activeBar={false}>
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
          <h3>{t('dash.areaDyn')}</h3>
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
              <Tooltip content={<ChartTip unit={t('unit.ha')} />} cursor={false} wrapperStyle={TIP_PROPS.wrapperStyle} />
              <Area type="monotone" dataKey="area_ha" stroke="#38bdf8" strokeWidth={2.4} fill="url(#areaFill)" name={t('compare.area')} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>{t('dash.roads')}</h3>
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
              <Tooltip content={<ChartTip unit={t('unit.km')} />} cursor={false} wrapperStyle={TIP_PROPS.wrapperStyle} />
              <Bar dataKey="length_km" fill="url(#roadBar)" name="km" radius={[0, 8, 8, 0]} barSize={18} background={{ fill: 'rgba(148,163,184,0.08)', radius: 8 }} activeBar={false}>
                <LabelList dataKey="length_km" position="right" fill="#d7e2ef" fontSize={11} formatter={fmtVal} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card changes-card">
          <h3>{t('home.recent')}</h3>
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
            {!recent_changes?.length && <li className="change-list__empty">{t('home.noChanges')}</li>}
          </ul>
          <Link to="/monitoring" className="link-more">
            {t('home.seeAll')} <IcoArrow size={16} />
          </Link>
        </div>
      </section>

      <section className="quick-links">
        <h2>{t('home.links')}</h2>
        <div className="quick-grid">
          {QUICK.map((q) => (
            <Link key={q.to} to={q.to} className="quick-card" style={{ '--quick-accent': q.color }}>
              <span className="quick-card__icon"><q.Icon size={26} /></span>
              <h3>{t(q.labelKey)}</h3>
              <p>{t(q.descKey)}</p>
              <em>{t('home.open')} <IcoArrow size={14} /></em>
            </Link>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <div>
          <h4>{t('home.sources')}</h4>
          <p>{t('home.sourcesList')}</p>
        </div>
        <div>
          <h4>{t('home.tech')}</h4>
          <p>Leaflet · PostgreSQL / PostGIS · GeoServer</p>
        </div>
        <div>
          <h4>{t('home.platform')}</h4>
          <p>© {new Date().getFullYear()} Buxoro GIS · {t('brand.sub')}</p>
        </div>
      </footer>
    </div>
  )
}
