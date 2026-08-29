import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import {
  IconCrosshair,
  IconHeat,
  IconHome,
  IconLocate,
  IconMinus,
  IconPlus,
  IconPrint,
  IconRefresh,
  IconRoute,
  IconRuler,
  IconSplit,
} from './MapIcons'
import { useI18n } from '../i18n/I18nContext'
import {
  fmtArea,
  fmtLength,
  nearFirstPoint,
  polygonAreaSqm,
  polygonPerimeterM,
  polylineLengthM,
} from '../map/measureUtils'

export default function MapControls({
  map,
  onRefresh,
  refreshing = false,
  onCoordsChange,
  onUserLocation,
  onNearest,
  nearestOpen = false,
  heatmapOn = false,
  onToggleHeatmap,
  splitOn = false,
  onToggleSplit,
}) {
  const { t } = useI18n()
  const [locating, setLocating] = useState(false)
  const [measureOn, setMeasureOn] = useState(false)
  const [coordMode, setCoordMode] = useState(false)
  const [measureLabel, setMeasureLabel] = useState('')
  const measureRef = useRef({ points: [], line: null, polygon: null, markers: [], closed: false })

  const zoomIn = useCallback(() => {
    if (!map) return
    const next = Math.min((map.getZoom() || 0) + 1, 16)
    map.setZoom(next)
  }, [map])
  const zoomOut = useCallback(() => map?.zoomOut(), [map])

  const goHome = useCallback(() => {
    map?.flyTo([39.773, 64.440], 13, { duration: 1 })
  }, [map])

  const clearMeasure = useCallback(() => {
    const m = measureRef.current
    if (!map) return
    if (m.line) { map.removeLayer(m.line); m.line = null }
    if (m.polygon) { map.removeLayer(m.polygon); m.polygon = null }
    m.markers.forEach((mk) => map.removeLayer(mk))
    m.markers = []
    m.points = []
    m.closed = false
    setMeasureLabel('')
  }, [map])

  const updateMeasureLayers = useCallback((m) => {
    if (!map) return
    if (m.line) { map.removeLayer(m.line); m.line = null }
    if (m.polygon) { map.removeLayer(m.polygon); m.polygon = null }

    if (m.closed && m.points.length >= 3) {
      m.polygon = L.polygon(m.points, {
        pane: 'measure',
        color: '#f1c40f',
        weight: 2,
        fillColor: '#f1c40f',
        fillOpacity: 0.22,
        dashArray: '6 4',
        interactive: false,
      }).addTo(map)
      const perim = polygonPerimeterM(m.points)
      const area = polygonAreaSqm(m.points)
      setMeasureLabel(`${t('map.measure.perimeter')}: ${fmtLength(perim)} · ${t('map.measure.area')}: ${fmtArea(area)}`)
      return
    }

    if (m.points.length >= 2) {
      m.line = L.polyline(m.points, {
        pane: 'measure',
        color: '#f1c40f',
        weight: 3,
        dashArray: '6 4',
        interactive: false,
      }).addTo(map)
    }
    if (m.points.length >= 3) {
      m.polygon = L.polygon(m.points, {
        pane: 'measure',
        color: '#f1c40f',
        weight: 2,
        fillColor: '#f1c40f',
        fillOpacity: 0.15,
        dashArray: '6 4',
        interactive: false,
      }).addTo(map)
      const perim = polygonPerimeterM(m.points)
      const area = polygonAreaSqm(m.points)
      setMeasureLabel(`${t('map.measure.perimeter')}: ${fmtLength(perim)} · ${t('map.measure.area')}: ${fmtArea(area)}`)
    } else if (m.points.length === 2) {
      setMeasureLabel(`${t('map.measure.length')}: ${fmtLength(polylineLengthM(m.points))}`)
    } else {
      setMeasureLabel('')
    }
  }, [map, t])

  const locateMe = useCallback(() => {
    if (!map) return
    if (!navigator.geolocation) {
      goHome()
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), { duration: 1.2 })
        onCoordsChange?.(`${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`)
        onUserLocation?.({ lat: latitude, lng: longitude })
        setLocating(false)
      },
      () => { goHome(); setLocating(false) },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [map, goHome, onCoordsChange, onUserLocation])

  const printMap = useCallback(() => {
    document.body.classList.add('map-printing')
    const cleanup = () => document.body.classList.remove('map-printing')
    window.addEventListener('afterprint', cleanup, { once: true })
    setTimeout(cleanup, 3000)
    window.print()
  }, [])

  useEffect(() => {
    if (!map) return undefined
    const onMove = (e) => {
      if (!coordMode) return
      const { lat, lng } = e.latlng
      onCoordsChange?.(`${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`)
    }
    map.on('mousemove', onMove)
    return () => map.off('mousemove', onMove)
  }, [map, coordMode, onCoordsChange])

  useEffect(() => {
    if (!map) return undefined
    if (!coordMode) return undefined
    const container = map.getContainer()
    const onClick = (ev) => {
      const latlng = map.mouseEventToLatLng(ev)
      if (!latlng) return
      const { lat, lng } = latlng
      onCoordsChange?.(`${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E | UTM 40N`, true)
    }
    container.addEventListener('click', onClick, true)
    return () => container.removeEventListener('click', onClick, true)
  }, [map, coordMode, onCoordsChange])

  useEffect(() => {
    if (measureOn) setCoordMode(false)
  }, [measureOn])

  useEffect(() => {
    if (!map) return undefined
    const container = map.getContainer()
    const wrap = container.closest('.gis-map-wrap')
    const lock = measureOn || coordMode
    wrap?.classList.toggle('is-measuring', lock)
    container.classList.toggle('is-measuring', lock)
    if (!map.getPane('measure')) {
      map.createPane('measure')
      map.getPane('measure').style.zIndex = 680
    }
    return () => {
      wrap?.classList.remove('is-measuring')
      container.classList.remove('is-measuring')
    }
  }, [map, measureOn, coordMode])

  useEffect(() => {
    if (!map) return undefined
    if (!measureOn) {
      clearMeasure()
      map.getContainer().style.cursor = ''
      return undefined
    }
    if (coordMode) return undefined

    const container = map.getContainer()
    container.style.cursor = 'crosshair'
    map.doubleClickZoom?.disable()

    const addPoint = (latlng) => {
      if (!latlng) return
      const m = measureRef.current
      if (m.closed) {
        clearMeasure()
        measureRef.current = { points: [], line: null, polygon: null, markers: [], closed: false }
      }
      const cur = measureRef.current
      if (cur.points.length >= 3 && nearFirstPoint(map, cur.points, latlng)) {
        cur.closed = true
        updateMeasureLayers(cur)
        return
      }
      cur.points.push(latlng)
      const marker = L.circleMarker(latlng, {
        pane: 'measure',
        radius: cur.points.length === 1 ? 6 : 5,
        color: '#fff',
        fillColor: cur.points.length === 1 ? '#22c55e' : '#1867D2',
        fillOpacity: 1,
        weight: 2,
        interactive: false,
      }).addTo(map)
      cur.markers.push(marker)
      updateMeasureLayers(cur)
    }

    const onClick = (ev) => {
      ev.stopPropagation()
      addPoint(map.mouseEventToLatLng(ev))
    }
    const onDbl = (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      const m = measureRef.current
      if (m.points.length >= 3) {
        m.closed = true
        updateMeasureLayers(m)
      } else {
        setMeasureOn(false)
      }
    }

    container.addEventListener('click', onClick, true)
    container.addEventListener('dblclick', onDbl, true)

    return () => {
      container.removeEventListener('click', onClick, true)
      container.removeEventListener('dblclick', onDbl, true)
      container.style.cursor = ''
      map.doubleClickZoom?.enable()
    }
  }, [map, measureOn, clearMeasure, updateMeasureLayers, coordMode])

  useEffect(() => {
    if (!map) return undefined
    const onKey = (e) => {
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return
      if (e.key === '+' || e.key === '=') zoomIn()
      if (e.key === '-') zoomOut()
      if (e.key === 'Escape') {
        setMeasureOn(false)
        setCoordMode(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [map, zoomIn, zoomOut])

  if (!map) return null

  return (
    <>
      <div className="map-tools-bar" role="group" aria-label={t('nav.map')}>
        <button type="button" className="map-tools-bar__btn" onClick={goHome} title={t('map.home')}>
          <IconHome />
          <span>{t('map.home')}</span>
        </button>
        <button
          type="button"
          className={`map-tools-bar__btn ${measureOn ? 'is-active' : ''}`}
          onClick={() => setMeasureOn((v) => !v)}
          title={t('map.measure')}
        >
          <IconRuler />
          <span>{t('map.measure')}</span>
        </button>
        <button
          type="button"
          className={`map-tools-bar__btn ${coordMode ? 'is-active' : ''}`}
          onClick={() => setCoordMode((v) => !v)}
          title={t('map.coords')}
        >
          <IconCrosshair />
          <span>{t('map.coords')}</span>
        </button>
        <button type="button" className="map-tools-bar__btn" onClick={printMap} title={t('map.print')}>
          <IconPrint />
          <span>{t('map.print')}</span>
        </button>
        {onNearest && (
          <button
            type="button"
            className={`map-tools-bar__btn ${nearestOpen ? 'is-active' : ''}`}
            onClick={onNearest}
            title={t('route.title')}
          >
            <IconRoute />
            <span>{t('route.title')}</span>
          </button>
        )}
        {onToggleHeatmap && (
          <button
            type="button"
            className={`map-tools-bar__btn ${heatmapOn ? 'is-active' : ''}`}
            onClick={onToggleHeatmap}
            title={t('map.heatmap')}
          >
            <IconHeat />
            <span>{t('map.heatmap')}</span>
          </button>
        )}
        {onToggleSplit && (
          <button
            type="button"
            className={`map-tools-bar__btn ${splitOn ? 'is-active' : ''}`}
            onClick={onToggleSplit}
            title={t('map.split.title')}
          >
            <IconSplit />
            <span>{t('map.split.short')}</span>
          </button>
        )}
        {measureOn && !measureLabel && (
          <span className="map-measure-hint">{t('map.measure.hint')}</span>
        )}
        {measureLabel && <span className="map-measure-badge">{measureLabel}</span>}
      </div>

      <div className="map-controls" role="group" aria-label="Zoom">
        <button type="button" className="map-ctrl-btn" onClick={zoomIn} title={t('map.zoomIn')} aria-label={t('map.zoomIn')}>
          <IconPlus />
        </button>
        <button type="button" className="map-ctrl-btn" onClick={zoomOut} title={t('map.zoomOut')} aria-label={t('map.zoomOut')}>
          <IconMinus />
        </button>
        <div className="map-ctrl-divider" />
        <button
          type="button"
          className={`map-ctrl-btn ${locating ? 'is-loading' : ''}`}
          onClick={locateMe}
          title={t('route.locate')}
          aria-label={t('route.locate')}
        >
          <IconLocate />
        </button>
        {onRefresh && (
          <>
            <div className="map-ctrl-divider" />
            <button
              type="button"
              className={`map-ctrl-btn ${refreshing ? 'is-loading' : ''}`}
              onClick={onRefresh}
              title={t('common.refresh')}
              aria-label={t('common.refresh')}
              disabled={refreshing}
            >
              <IconRefresh spinning={refreshing} />
            </button>
          </>
        )}
      </div>
    </>
  )
}
