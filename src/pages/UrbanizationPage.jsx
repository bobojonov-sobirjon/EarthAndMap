import { useEffect, useMemo, useState } from 'react'
import {
  Area, AreaChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { statsApi } from '../api/services'
import { useI18n } from '../i18n/I18nContext'
import { loc } from '../i18n/loc'
import PageLoader from '../components/PageLoader'

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function fmtHa(v) {
  const n = num(v)
  if (n == null) return '—'
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })} ga`
}

function growthPct(cur, prev) {
  const a = num(cur)
  const b = num(prev)
  if (a == null || b == null || b === 0) return null
  return ((a - b) / b) * 100
}

export default function UrbanizationPage() {
  const { t, lang } = useI18n()
  const [data, setData] = useState(null)
  const [year, setYear] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    statsApi.urbanization()
      .then(({ data: d }) => {
        setData(d)
        const years = (d.years || []).map(Number)
        setYear((prev) => (prev != null && years.includes(prev) ? prev : years[years.length - 1] || 2025))
      })
      .catch(() => setError(t('msg.loadFail')))
  }, [t])

  const years = useMemo(() => (data?.years || []).map(Number), [data])
  const series = useMemo(() => (data?.series || []).map((s) => ({ ...s, year: Number(s.year) })), [data])

  const snapshot = useMemo(() => {
    const row = series.find((s) => s.year === Number(year))
    const idx = series.findIndex((s) => s.year === Number(year))
    const prev = idx > 0 ? series[idx - 1] : null
    return {
      urban: row?.urban_ha,
      agri: row?.agriculture_ha,
      urbanG: growthPct(row?.urban_ha, prev?.urban_ha),
      agriG: growthPct(row?.agriculture_ha, prev?.agriculture_ha),
      prevYear: prev?.year,
    }
  }, [series, year])

  const tableRows = useMemo(() => {
    const y = Number(year)
    const layers = (data?.layers || []).filter((l) => Number(l.year) === y)
    if (layers.length) return layers.map((l) => ({
      key: l.id || `${l.year}-${l.layer_kind}-${l.name}`,
      year: l.year,
      name: loc(l, 'name', lang) || t('urban.agg'),
      kind: l.layer_kind ? t(`urban.kind.${l.layer_kind}`) : '—',
      area: l.area_ha,
      growth: l.growth_pct,
    }))
    const s = series.find((r) => r.year === y)
    if (!s) return []
    return [
      {
        key: `${y}-u`, year: y, name: t('urban.area'), kind: t('urban.kind.urban'),
        area: s.urban_ha, growth: snapshot.urbanG,
      },
      {
        key: `${y}-a`, year: y, name: t('urban.agri'), kind: t('urban.kind.agriculture'),
        area: s.agriculture_ha, growth: snapshot.agriG,
      },
    ]
  }, [data, year, series, lang, t, snapshot])

  const pickYear = (y) => setYear(Number(y))

  if (error) return <div className="page-loading">{error}</div>
  if (!data || year == null) return <PageLoader />

  return (
    <div className="module-page">
      <div className="page-header">
        <div>
          <h2>{t('nav.urban')}</h2>
          <p className="muted">{t('urban.sub')}</p>
        </div>
        <label className="header-actions urban-year-filter">
          <span>{t('urban.year')}</span>
          <select value={year} onChange={(e) => pickYear(e.target.value)}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>

      <div className="kpi-grid compact">
        <div className="kpi-card">
          <span>{t('urban.area')} · {year}</span>
          <strong>{fmtHa(snapshot.urban)}</strong>
          {snapshot.urbanG != null && (
            <small className={snapshot.urbanG >= 0 ? 'up' : 'down'}>
              {snapshot.urbanG >= 0 ? '+' : ''}{snapshot.urbanG.toFixed(1)}%
              {snapshot.prevYear ? ` (${snapshot.prevYear})` : ''}
            </small>
          )}
        </div>
        <div className="kpi-card">
          <span>{t('urban.agri')} · {year}</span>
          <strong>{fmtHa(snapshot.agri)}</strong>
          {snapshot.agriG != null && (
            <small className={snapshot.agriG >= 0 ? 'up' : 'down'}>
              {snapshot.agriG >= 0 ? '+' : ''}{snapshot.agriG.toFixed(1)}%
              {snapshot.prevYear ? ` (${snapshot.prevYear})` : ''}
            </small>
          )}
        </div>
        <div className="kpi-card">
          <span>{t('urban.period')}</span>
          <strong>{years[0]}–{years[years.length - 1]}</strong>
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: '1rem' }}>
        <h3>{t('urban.chart')}</h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={series} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="year" tick={{ fill: '#aaa' }} />
            <YAxis tick={{ fill: '#aaa' }} />
            <Tooltip
              cursor={{ stroke: '#38bdf8', strokeWidth: 1 }}
              contentStyle={{ background: '#1a2332', border: '1px solid #333' }}
              formatter={(v, name) => [fmtHa(v), name]}
            />
            <Legend />
            <ReferenceLine x={year} stroke="#38bdf8" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="urban_ha" name={t('urban.urbanGa')} stroke="#e74c3c" fill="#e74c3c55" />
            <Area type="monotone" dataKey="agriculture_ha" name={t('urban.agriGa')} stroke="#27ae60" fill="#27ae6055" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="year-slider-bar">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            className={`chip ${y === Number(year) ? 'active' : ''}`}
            onClick={() => pickYear(y)}
          >
            {y}
          </button>
        ))}
      </div>

      <div className="table-wrap" style={{ marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('urban.year')}</th>
              <th>{t('urban.layer')}</th>
              <th>{t('urban.kind')}</th>
              <th>{t('urban.areaCol')}</th>
              <th>{t('urban.growth')}</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((l) => (
              <tr key={l.key}>
                <td>{l.year}</td>
                <td>{l.name}</td>
                <td>{l.kind}</td>
                <td>{fmtHa(l.area)}</td>
                <td className={l.growth == null ? '' : (l.growth >= 0 ? 'up' : 'down')}>
                  {l.growth == null ? '—' : `${l.growth >= 0 ? '+' : ''}${Number(l.growth).toFixed(1)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
