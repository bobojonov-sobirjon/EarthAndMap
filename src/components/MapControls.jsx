import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import {
  IconCrosshair,
  IconHome,
  IconLocate,
  IconMinus,
  IconPlus,
  IconPrint,
  IconRefresh,
  IconRoute,
  IconRuler,
} from './MapIcons'
import { useI18n } from '../i18n/I18nContext'

export default function MapControls({ map, onRefresh, refreshing = false, onCoordsChange, onUserLocation, onNearest, nearestOpen = false }) {
  const { t } = useI18n()
  const [locating, setLocating] = useState(false)
  const [measureOn, setMeasureOn] = useState(false)
  const [coordMode, setCoordMode] = useState(false)
  const [measureLabel, setMeasureLabel] = useState('')
  const measureRef = useRef({ points: [], line: null, markers: [] })

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
    m.markers.forEach((mk) => map.removeLayer(mk))
    m.markers = []
    m.points = []
    setMeasureLabel('')
  }, [map])

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
    // Ba'zi brauzerlar afterprint bermaydi
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
    const onClick = (e) => {
      const { lat, lng } = e.latlng
      onCoordsChange?.(`${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E | UTM 40N`, true)
    }
    map.on('click', onClick)
    return () => map.off('click', onClick)
  }, [map, coordMode, onCoordsChange])

  useEffect(() => {
    if (!map) return undefined
    if (!measureOn) {
      clearMeasure()
      map.getContainer().style.cursor = ''
      return undefined
    }
    map.getContainer().style.cursor = 'crosshair'
    const onClick = (e) => {
      const m = measureRef.current
      m.points.push(e.latlng)
      const marker = L.circleMarker(e.latlng, {
        radius: 5, color: '#fff', fillColor: '#1867D2', fillOpacity: 1,
      }).addTo(map)
      m.markers.push(marker)
      if (m.points.length >= 2) {
        if (m.line) map.removeLayer(m.line)
        m.line = L.polyline(m.points, { color: '#f1c40f', weight: 3, dashArray: '6 4' }).addTo(map)
        let total = 0
        for (let i = 1; i < m.points.length; i += 1) {
          total += m.points[i - 1].distanceTo(m.points[i])
        }
        setMeasureLabel(total >= 1000 ? `${(total / 1000).toFixed(2)} km` : `${Math.round(total)} m`)
      }
    }
    const onDbl = () => setMeasureOn(false)
    map.on('click', onClick)
    map.on('dblclick', onDbl)
    return () => {
      map.off('click', onClick)
      map.off('dblclick', onDbl)
      map.getContainer().style.cursor = ''
    }
  }, [map, measureOn, clearMeasure])

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
        {measureLabel && <span className="map-measure-badge">{measureLabel}</span>}
      </div>

      <div className="map-controls" role="group" aria-label="Zoom">
        <button type="button" className="map-ctrl-btn" onClick={zoomIn} title="Yaqinlashtirish" aria-label="Yaqinlashtirish">
          <IconPlus />
        </button>
        <button type="button" className="map-ctrl-btn" onClick={zoomOut} title="Uzoqlashtirish" aria-label="Uzoqlashtirish">
          <IconMinus />
        </button>
        <div className="map-ctrl-divider" />
        <button
          type="button"
          className={`map-ctrl-btn ${locating ? 'is-loading' : ''}`}
          onClick={locateMe}
          title="Mening joylashuvim"
          aria-label="Mening joylashuvim"
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
              title="Yangilash"
              aria-label="Yangilash"
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
