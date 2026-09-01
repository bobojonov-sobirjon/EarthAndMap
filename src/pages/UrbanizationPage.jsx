import { useEffect, useMemo, useState } from 'react'
import {
  Area, AreaChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { statsApi } from '../api/services'
import { useI18n } from '../i18n/I18nContext'
import PageLoader from '../components/PageLoader'
import UrbanizationSplitMap from '../components/UrbanizationSplitMap'

const VECTOR_YEARS = [2000, 2010, 2015, 2020, 2025]
const POLL_MS = 10000

function formatElapsed(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

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
  const { t } = useI18n()
  const [data, setData] = useState(null)
  const [year, setYear] = useState(null)
  const [error, setError] = useState(null)
  const [waitingElapsed, setWaitingElapsed] = useState(0)
  const [polling, setPolling] = useState(false)

  const applyUrbanData = (d) => {
    setData(d)
    const vectorYears = (d.vector_years || d.vectors?.map((v) => Number(v.year)) || [])
    const mapYears = (d.maps || []).map((m) => Number(m.year))
    const list = [...new Set([...vectorYears, ...mapYears])].sort((a, b) => a - b)
    const fallback = list.length ? list : VECTOR_YEARS
    setYear((prev) => (prev != null && fallback.includes(prev) ? prev : fallback[fallback.length - 1] || 2010))
  }

  const loadUrbanization = async ({ silent = false } = {}) => {
    if (!silent) setPolling(true)
    try {
      const { data: d } = await statsApi.urbanization()
      applyUrbanData(d)
      setError(null)
      return d
    } catch {
      if (!silent) setError(t('msg.loadFail'))
      return null
    } finally {
      if (!silent) setPolling(false)
    }
  }

  useEffect(() => {
    loadUrbanization()
  }, [t])

  const hasUploadedData = Boolean(
    (data?.vectors?.length > 0) || (data?.maps?.length > 0),
  )

  useEffect(() => {
    if (!data || hasUploadedData) {
      setWaitingElapsed(0)
      return undefined
    }
    const tick = window.setInterval(() => setWaitingElapsed((n) => n + 1), 1000)
    const poll = window.setInterval(() => loadUrbanization({ silent: true }), POLL_MS)
    return () => {
      clearInterval(tick)
      clearInterval(poll)
    }
  }, [data, hasUploadedData])

  const years = useMemo(() => {
    const fromVectors = (data?.vector_years || data?.vectors?.map((v) => Number(v.year)) || [])
    const fromMaps = (data?.maps || []).map((m) => Number(m.year))
    const merged = [...new Set([...fromVectors, ...fromMaps])]
    if (merged.length) return merged.sort((a, b) => a - b)
    return VECTOR_YEARS
  }, [data])

  const activeVector = useMemo(
    () => (data?.vectors || []).find((v) => Number(v.year) === Number(year)) || null,
    [data, year],
  )

  const activeMap = useMemo(
    () => (data?.maps || []).find((m) => Number(m.year) === Number(year)) || null,
    [data, year],
  )

  const hasClassifiedTif = Boolean(
    activeMap?.classified_preview_url || activeMap?.rgb_preview_url,
  )

  const series = useMemo(() => (data?.series || []).map((s) => ({ ...s, year: Number(s.year) })), [data])

  const snapshot = useMemo(() => {
    if (activeVector?.urban_area_ha != null) {
      return {
        urban: activeVector.urban_area_ha,
        agri: activeVector.non_urban_area_ha,
        urbanG: null,
        agriG: null,
        prevYear: null,
      }
    }
    if (activeMap?.urban_area_ha != null) {
      return {
        urban: activeMap.urban_area_ha,
        agri: activeMap.non_urban_area_ha,
        urbanG: null,
        agriG: null,
        prevYear: null,
      }
    }
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
  }, [series, year, activeMap, activeVector])

  const pickYear = (y) => setYear(Number(y))

  const popupLabels = useMemo(() => ({
    year: t('urban.year'),
    class: t('urban.kind'),
    urban: t('urban.legendUrban'),
    nonUrban: t('urban.legendNonUrban'),
  }), [t])

  const splitLabels = useMemo(() => ({
    shpTitle: t('urban.splitShpTitle'),
    shpSub: t('urban.splitShpSub'),
    tifTitle: t('urban.splitTifTitle'),
    tifSub: activeMap?.rgb_label || t('urban.splitTifSub'),
    tifEmpty: t('urban.tifMissingHint'),
    urban: t('urban.legendUrban'),
    nonUrban: t('urban.legendNonUrban'),
  }), [t, activeMap])

  const mapTitle = useMemo(
    () => t('urban.mapTitle').replace('{year}', String(year ?? '')),
    [t, year],
  )

  if (error) return <div className="page-loading">{error}</div>
  if (!data || year == null) return <PageLoader />

  const hasData = activeVector || activeMap

  return (
    <div className="module-page urban-page">
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

      {!hasUploadedData ? (
        <div className="urban-page__empty urban-page__waiting" role="status" aria-live="polite">
          <div className="import-loading__spin" aria-hidden />
          <strong>{t('urban.waitingTitle')}</strong>
          <p className="import-loading__time">{formatElapsed(waitingElapsed)}</p>
          <p className="muted">{t('urban.waitingHint')}</p>
          <p className="urban-page__waiting-poll muted">
            {polling
              ? t('urban.waitingChecking')
              : t('urban.waitingPoll').replace('{sec}', String(POLL_MS / 1000))}
          </p>
        </div>
      ) : hasData ? (
        <>
          <h3 className="urban-page__map-title">{mapTitle}</h3>
          <p className="muted urban-page__map-sub">{t('urban.splitIntro')}</p>

          {activeVector ? (
            <UrbanizationSplitMap
              year={year}
              classField={activeVector.class_field || 'gridcode'}
              mapSet={activeMap}
              labels={splitLabels}
              popupLabels={popupLabels}
            />
          ) : (
            <div className="urban-page__empty">
              <p className="muted">{t('urban.noVectorHint')}</p>
            </div>
          )}

          {activeVector && !hasClassifiedTif && (
            <div className="urban-page__notice">{t('urban.tifMissingHint')}</div>
          )}
        </>
      ) : (
        <div className="urban-page__empty">
          <strong>{t('urban.noMapTitle').replace('{year}', String(year))}</strong>
          <p className="muted">{t('urban.noVectorHint')}</p>
        </div>
      )}

      <div className="kpi-grid compact" style={{ marginTop: '1.25rem' }}>
        <div className="kpi-card">
          <span>{t('urban.area')} · {year}</span>
          <strong>{fmtHa(snapshot.urban)}</strong>
        </div>
        <div className="kpi-card">
          <span>{t('urban.nonUrban')} · {year}</span>
          <strong>{fmtHa(snapshot.agri)}</strong>
        </div>
        <div className="kpi-card">
          <span>{t('urban.period')}</span>
          <strong>{years[0]}–{years[years.length - 1]}</strong>
        </div>
      </div>

      {series.length > 1 && (
        <div className="chart-card" style={{ marginTop: '1rem' }}>
          <h3>{t('urban.chart')}</h3>
          <ResponsiveContainer width="100%" height={280}>
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
              <Area type="monotone" dataKey="urban_ha" name={t('urban.urbanGa')} stroke="#3b82f6" fill="#3b82f655" />
              <Area type="monotone" dataKey="agriculture_ha" name={t('urban.agriGa')} stroke="#facc15" fill="#facc1555" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  )
}
