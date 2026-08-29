import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { BASEMAPS, MAP_MAX_ZOOM, MAP_MIN_ZOOM } from '../map/basemaps'
import { applyBasemapLayers } from '../map/applyBasemapLayers'
import { useI18n } from '../i18n/I18nContext'
import { roadClassColor, waterClassColor } from '../constants/researchLayers'
import PrettySelect from './PrettySelect'

const CENTER = [39.7747, 64.4286]
const FALLBACK_YEARS = [2018, 2020, 2022, 2024, 2026]

/** Faqat monitoring_year mos kelgan real obyektlar (demo scale yo‘q). */
export function filterByMonitoringYear(collection, year) {
  if (!collection?.features) return collection
  const y = Number(year)
  if (!Number.isFinite(y)) return collection
  return {
    ...collection,
    features: collection.features.filter(
      (f) => Number(f.properties?.monitoring_year) === y,
    ),
  }
}

export function collectRealYears(collection) {
  const set = new Set()
  ;(collection?.features || []).forEach((f) => {
    const y = Number(f.properties?.monitoring_year)
    if (Number.isFinite(y) && y > 1900) set.add(y)
  })
  return [...set].sort((a, b) => a - b)
}

function drawSimple(map, collection) {
  const group = L.layerGroup().addTo(map)
  ;(collection?.features || []).forEach((f) => {
    const code = f.properties?.category_code
    const road = f.properties?.road_class
    const color = code === 'yollar'
      ? roadClassColor(road, '#e67e22')
      : code === 'suv'
        ? waterClassColor(road, '#3498db')
        : code === 'qabriston'
          ? '#94a3b8'
          : code === 'istirohat' || code === 'park'
            ? '#27ae60'
            : '#3388ff'
    const isLine = code === 'yollar' || code === 'suv'
      || f.geometry?.type === 'LineString'
      || f.geometry?.type === 'MultiLineString'
    try {
      L.geoJSON(f, {
        style: {
          color,
          weight: isLine ? 2 : 1.5,
          fillColor: color,
          fillOpacity: isLine ? 0 : 0.35,
          opacity: 0.9,
        },
        pointToLayer: (_ft, ll) => L.circleMarker(ll, {
          radius: 5,
          color: '#fff',
          weight: 1,
          fillColor: color,
          fillOpacity: 0.95,
        }),
      }).addTo(group)
    } catch {
      /* skip */
    }
  })
  return group
}

function YearOption({ year, missing, missingLabel }) {
  return (
    <span className={`map-split__opt${missing ? ' is-missing' : ''}`}>
      <strong>{year}</strong>
      {missing ? (
        <span className="map-split__opt-badge">{missingLabel}</span>
      ) : null}
    </span>
  )
}

function Pane({
  label,
  year,
  collection,
  basemapId = 'satellite',
  hasData,
  emptyTitle,
  emptyHint,
  resizeTick = 0,
  flashKey = '',
}) {
  const ref = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef(null)
  const baseRef = useRef([])
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (!ref.current || mapRef.current) return undefined
    const map = L.map(ref.current, {
      center: CENTER,
      zoom: 13,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      zoomControl: false,
      attributionControl: false,
    })
    mapRef.current = map
    const def = BASEMAPS[basemapId] || BASEMAPS.satellite
    baseRef.current = applyBasemapLayers(map, def, baseRef.current)
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const def = BASEMAPS[basemapId] || BASEMAPS.satellite
    baseRef.current = applyBasemapLayers(map, def, baseRef.current)
  }, [basemapId])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (layersRef.current) {
      map.removeLayer(layersRef.current)
      layersRef.current = null
    }
    if (hasData) {
      layersRef.current = drawSimple(map, collection)
    }
  }, [collection, hasData])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const id = requestAnimationFrame(() => map.invalidateSize())
    return () => cancelAnimationFrame(id)
  }, [resizeTick])

  useEffect(() => {
    const el = ref.current
    const map = mapRef.current
    if (!el || !map || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(() => {
      map.invalidateSize()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const layers = baseRef.current || []
    layers.forEach((lyr) => {
      if (lyr && typeof lyr.setOpacity === 'function') {
        lyr.setOpacity(hasData ? 1 : 0.28)
      }
    })
  }, [hasData, basemapId])

  useEffect(() => {
    if (!flashKey) return undefined
    setFlash(true)
    const t = window.setTimeout(() => setFlash(false), 480)
    return () => window.clearTimeout(t)
  }, [flashKey])

  return (
    <div className={`map-split__pane${!hasData ? ' is-empty' : ''}${flash ? ' is-flash' : ''}`}>
      <div className={`map-split__badge${!hasData ? ' is-empty' : ''}`}>
        <span className="map-split__badge-side">{label}</span>
        <span className="map-split__badge-year">{year}</span>
      </div>
      <div className="map-split__map" ref={ref} />
      {!hasData && (
        <div className="map-split__empty" role="status" aria-live="polite">
          <div className="map-split__empty-card">
            <span className="map-split__empty-icon" aria-hidden>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="17.2" cy="15.2" r="3.2" fill="#0b1220" stroke="currentColor" strokeWidth="1.4" />
                <path d="M15.9 15.2h2.6M17.2 13.9v2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </span>
            <strong className="map-split__empty-title">{emptyTitle}</strong>
            <p className="map-split__empty-hint">{emptyHint?.replace('{year}', String(year))}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SplitCompareView({
  collection,
  yearA = 2020,
  yearB = 2026,
  onYearA,
  onYearB,
  basemap = 'satellite',
  onClose,
}) {
  const { t } = useI18n()
  const bodyRef = useRef(null)
  const [leftPct, setLeftPct] = useState(50)
  const [dragging, setDragging] = useState(false)
  const [resizeTick, setResizeTick] = useState(0)
  const [entered, setEntered] = useState(false)
  const [swapSpin, setSwapSpin] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const realYears = useMemo(() => collectRealYears(collection), [collection])
  const yearOptions = useMemo(() => {
    const list = realYears.length ? realYears : FALLBACK_YEARS
    return list.map((y) => ({
      value: String(y),
      label: String(y),
      isMissing: !realYears.includes(y),
    }))
  }, [realYears])

  // Tanlangan yil bazada yo‘q bo‘lsa — mavjud yilga siljitish
  useEffect(() => {
    if (!realYears.length) return
    if (!realYears.includes(Number(yearA))) {
      onYearA?.(realYears[0])
    }
    if (!realYears.includes(Number(yearB))) {
      onYearB?.(realYears[realYears.length - 1])
    }
  }, [realYears, yearA, yearB, onYearA, onYearB])

  const formatYearOption = useCallback((opt) => (
    <YearOption
      year={opt.label}
      missing={opt.isMissing}
      missingLabel={t('map.split.noDataShort')}
    />
  ), [t])

  const filteredA = useMemo(
    () => filterByMonitoringYear(collection, yearA),
    [collection, yearA],
  )
  const filteredB = useMemo(
    () => filterByMonitoringYear(collection, yearB),
    [collection, yearB],
  )

  const countA = filteredA?.features?.length || 0
  const countB = filteredB?.features?.length || 0
  const hasA = countA > 0
  const hasB = countB > 0

  const needsSecondYear = realYears.length < 2
  const missingSelected = (!hasA || !hasB) && !needsSecondYear

  const onPointerDown = useCallback((e) => {
    e.preventDefault()
    setDragging(true)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }, [])

  useEffect(() => {
    if (!dragging) return undefined
    const onMove = (e) => {
      const body = bodyRef.current
      if (!body) return
      const rect = body.getBoundingClientRect()
      const stacked = window.matchMedia('(max-width: 800px)').matches
      if (stacked) {
        if (rect.height < 40) return
        const y = e.clientY - rect.top
        const pct = Math.min(85, Math.max(15, (y / rect.height) * 100))
        setLeftPct(pct)
      } else {
        if (rect.width < 40) return
        const x = e.clientX - rect.left
        const pct = Math.min(85, Math.max(15, (x / rect.width) * 100))
        setLeftPct(pct)
      }
      setResizeTick((n) => n + 1)
    }
    const onUp = () => setDragging(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragging])

  const swapYears = () => {
    setSwapSpin(true)
    onYearA?.(yearB)
    onYearB?.(yearA)
    window.setTimeout(() => setSwapSpin(false), 420)
  }

  const titleYears = `${yearA} vs ${yearB}`

  return (
    <div
      className={`map-split${entered ? ' is-in' : ''}`}
      role="region"
      aria-label={t('map.split.title')}
    >
      <div className="map-split__toolbar">
        <strong className="map-split__title">{titleYears}</strong>
        <div className="map-split__years">
          <label className="map-split__year-field">
            <span className="map-split__year-tag">A</span>
            <PrettySelect
              className="map-split__select"
              value={String(yearA)}
              onChange={(v) => onYearA?.(Number(v) || yearA)}
              options={yearOptions}
              formatOptionLabel={formatYearOption}
              isSearchable={false}
              menuPlacement="bottom"
              placeholder={t('dash.year')}
            />
          </label>
          <button
            type="button"
            className={`map-split__swap${swapSpin ? ' is-spin' : ''}`}
            onClick={swapYears}
            title={t('map.split.swap')}
            aria-label={t('map.split.swap')}
          >
            ⇄
          </button>
          <label className="map-split__year-field">
            <span className="map-split__year-tag map-split__year-tag--b">B</span>
            <PrettySelect
              className="map-split__select"
              value={String(yearB)}
              onChange={(v) => onYearB?.(Number(v) || yearB)}
              options={yearOptions}
              formatOptionLabel={formatYearOption}
              isSearchable={false}
              menuPlacement="bottom"
              placeholder={t('dash.year')}
            />
          </label>
        </div>
        {onClose && (
          <button type="button" className="map-split__close" onClick={onClose}>
            {t('common.close')}
          </button>
        )}
      </div>

      {needsSecondYear && (
        <div className="map-split__warn" role="status">
          {t('map.split.warnOneYear').replace(
            '{year}',
            String(realYears[0] ?? '—'),
          )}
        </div>
      )}
      {!needsSecondYear && missingSelected && (
        <div className="map-split__warn map-split__warn--soft" role="status">
          {t('map.split.warnMissing')
            .replace('{a}', String(yearA))
            .replace('{b}', String(yearB))
            .replace('{years}', realYears.join(', '))}
        </div>
      )}

      <div
        className={`map-split__body${dragging ? ' is-dragging' : ''}`}
        ref={bodyRef}
        style={{
          '--split-a': `${leftPct}%`,
          gridTemplateColumns: `${leftPct}% 12px minmax(0, 1fr)`,
        }}
      >
        <Pane
          label="A"
          year={yearA}
          collection={filteredA}
          basemapId={basemap}
          hasData={hasA}
          emptyTitle={t('map.split.noData')}
          emptyHint={t('map.split.noDataHint')}
          resizeTick={resizeTick}
          flashKey={`a-${yearA}`}
        />
        <div
          className="map-split__divider"
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={Math.round(leftPct)}
          aria-valuemin={15}
          aria-valuemax={85}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') {
              setLeftPct((p) => Math.max(15, p - 2))
              setResizeTick((n) => n + 1)
            } else if (e.key === 'ArrowRight') {
              setLeftPct((p) => Math.min(85, p + 2))
              setResizeTick((n) => n + 1)
            }
          }}
          title={t('map.split.dragHint')}
        >
          <span className="map-split__divider-grip" />
        </div>
        <Pane
          label="B"
          year={yearB}
          collection={filteredB}
          basemapId={basemap}
          hasData={hasB}
          emptyTitle={t('map.split.noData')}
          emptyHint={t('map.split.noDataHint')}
          resizeTick={resizeTick}
          flashKey={`b-${yearB}`}
        />
      </div>
    </div>
  )
}
