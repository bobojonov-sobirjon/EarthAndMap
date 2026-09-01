import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import { BASEMAPS } from '../map/basemaps'
import { applyBasemapLayers } from '../map/applyBasemapLayers'

import { fitUrbanCompareBounds } from '../map/urbanCompareView'

const DEFAULT_BOUNDS = [[39.728, 64.352], [39.802, 64.528]]

function normalizeBounds(raw) {
  if (!Array.isArray(raw) || raw.length !== 2) return DEFAULT_BOUNDS
  const [a, b] = raw
  if (!Array.isArray(a) || !Array.isArray(b)) return DEFAULT_BOUNDS
  return [[Number(a[0]), Number(a[1])], [Number(b[0]), Number(b[1])]]
}

function fitMapToBounds(map, bounds) {
  fitUrbanCompareBounds(map, bounds)
}

/** Landsat RGB — basemap ustida georeferenced overlay. */
export default function UrbanRgbFrame({
  mapSet,
  emptyLabel,
  fitBounds: fitBoundsProp,
  onMapReady,
}) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const basemapLayersRef = useRef([])
  const overlayRef = useRef(null)

  const url = mapSet?.rgb_preview_url
  const bounds = useMemo(
    () => normalizeBounds(fitBoundsProp || mapSet?.rgb_bounds || mapSet?.classified_bounds),
    [fitBoundsProp, mapSet?.rgb_bounds, mapSet?.classified_bounds],
  )

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return undefined
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
      minZoom: 10,
      maxZoom: 18,
    })
    basemapLayersRef.current = applyBasemapLayers(
      map,
      BASEMAPS.schematic,
      basemapLayersRef.current,
    )
    mapInstance.current = map
    onMapReady?.(map)
    return () => {
      onMapReady?.(null)
      map.remove()
      mapInstance.current = null
    }
  }, [onMapReady])

  useEffect(() => {
    const map = mapInstance.current
    if (!map) return undefined

    if (overlayRef.current) {
      map.removeLayer(overlayRef.current)
      overlayRef.current = null
    }

    if (url) {
      overlayRef.current = L.imageOverlay(url, bounds, {
        opacity: 1,
        interactive: false,
        className: 'urban-raster-overlay',
      }).addTo(map)
    }

    fitMapToBounds(map, bounds)

    return () => {
      if (overlayRef.current && mapInstance.current) {
        mapInstance.current.removeLayer(overlayRef.current)
        overlayRef.current = null
      }
    }
  }, [url, bounds])

  if (!mapSet) {
    return (
      <div className="urban-thematic urban-thematic--empty">
        {emptyLabel && <p className="muted">{emptyLabel}</p>}
      </div>
    )
  }

  if (!url) {
    return (
      <div className="urban-thematic urban-thematic--empty">
        <p className="muted">{emptyLabel || 'Preview yo‘q'}</p>
      </div>
    )
  }

  return (
    <div className="urban-thematic urban-thematic--rgb">
      <div className="urban-compare__map-wrap urban-compare__map-wrap--tif">
        <div ref={mapRef} className="urban-compare__map urban-compare__map--tif" />
      </div>
    </div>
  )
}
