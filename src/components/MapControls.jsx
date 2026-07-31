import { useCallback, useEffect, useState } from 'react'

/**
 * Yuqori o'ng: zoom in / zoom out / locate / refresh
 */
export default function MapControls({ map, onRefresh, refreshing = false }) {
  const [locating, setLocating] = useState(false)

  const zoomIn = useCallback(() => {
    map?.zoomIn()
  }, [map])

  const zoomOut = useCallback(() => {
    map?.zoomOut()
  }, [map])

  const locateMe = useCallback(() => {
    if (!map) return
    if (!navigator.geolocation) {
      map.flyTo([39.773, 64.440], 14, { duration: 1 })
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), { duration: 1.2 })
        setLocating(false)
      },
      () => {
        map.flyTo([39.773, 64.440], 14, { duration: 1 })
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [map])

  useEffect(() => {
    if (!map) return undefined
    const onKey = (e) => {
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return
      if (e.key === '+' || e.key === '=') zoomIn()
      if (e.key === '-') zoomOut()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [map, zoomIn, zoomOut])

  if (!map) return null

  return (
    <div className="map-controls" role="group" aria-label="Xarita boshqaruvi">
      <button type="button" className="map-ctrl-btn" onClick={zoomIn} title="Yaqinlashtirish" aria-label="Zoom in">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </button>
      <button type="button" className="map-ctrl-btn" onClick={zoomOut} title="Uzoqlashtirish" aria-label="Zoom out">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="currentColor" d="M19 13H5v-2h14v2z" />
        </svg>
      </button>
      <div className="map-ctrl-divider" />
      <button
        type="button"
        className={`map-ctrl-btn map-ctrl-locate ${locating ? 'is-loading' : ''}`}
        onClick={locateMe}
        title="Mening joylashuvim"
        aria-label="Locate me"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"
          />
        </svg>
      </button>
      {onRefresh && (
        <>
          <div className="map-ctrl-divider" />
          <button
            type="button"
            className={`map-ctrl-btn ${refreshing ? 'is-loading' : ''}`}
            onClick={onRefresh}
            title="Ma'lumotlarni yangilash"
            aria-label="Refresh map data"
            disabled={refreshing}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                fill="currentColor"
                d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
