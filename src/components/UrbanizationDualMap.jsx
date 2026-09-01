import { useEffect, useRef } from 'react'
import L from 'leaflet'

const DEFAULT_BOUNDS = [[39.728, 64.352], [39.802, 64.528]]

function normalizeBounds(raw) {
  if (!Array.isArray(raw) || raw.length !== 2) return DEFAULT_BOUNDS
  const [a, b] = raw
  if (!Array.isArray(a) || !Array.isArray(b)) return DEFAULT_BOUNDS
  return [[Number(a[0]), Number(a[1])], [Number(b[0]), Number(b[1])]]
}

function RasterPane({ panel, tag }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const overlayRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return undefined
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 10,
      maxZoom: 18,
    })
    mapInstance.current = map
    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || !panel) return

    if (overlayRef.current) {
      map.removeLayer(overlayRef.current)
      overlayRef.current = null
    }

    const url = panel.previewUrl || panel.imageUrl
    const bounds = normalizeBounds(panel.bounds)
    if (url) {
      overlayRef.current = L.imageOverlay(url, bounds, {
        opacity: 1,
        interactive: false,
        className: 'urban-raster-overlay',
      }).addTo(map)
      map.fitBounds(bounds, { padding: [12, 12] })
    } else {
      map.setView([(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2], 12)
    }
  }, [panel])

  return (
    <div className="urban-compare__pane">
      <div className="urban-compare__pane-head">
        <span className="urban-compare__tag">{tag}</span>
        <div>
          <strong>{panel?.label}</strong>
          {panel?.subtitle && <small>{panel.subtitle}</small>}
        </div>
      </div>
      <div ref={mapRef} className="urban-compare__map" />
    </div>
  )
}

export default function UrbanizationDualMap({ mapSet, legend }) {
  if (!mapSet) return null

  const left = {
    label: mapSet.rgb_label || 'Landsat 7 ETM+ RGB',
    subtitle: legend?.rgb || 'RGB: Tabiiy rangli kompozit',
    previewUrl: mapSet.rgb_preview_url,
    imageUrl: mapSet.rgb_tif_url,
    bounds: mapSet.rgb_bounds,
  }
  const right = {
    label: mapSet.classified_label || 'Urban extraction (ISO Cluster)',
    subtitle: legend?.classified || '',
    previewUrl: mapSet.classified_preview_url,
    imageUrl: mapSet.classified_tif_url,
    bounds: mapSet.classified_bounds,
  }

  return (
    <div className="urban-compare">
      <RasterPane panel={left} tag="a" />
      <RasterPane panel={right} tag="b" />
      <div className="urban-compare__legend" aria-hidden>
        <span className="urban-compare__legend-item urban-compare__legend-item--non">
          {legend?.nonUrban || 'Urbanizatsiyalashmagan hudud'}
        </span>
        <span className="urban-compare__legend-item urban-compare__legend-item--urban">
          {legend?.urban || 'Urbanizatsiyalashgan hudud'}
        </span>
      </div>
    </div>
  )
}
