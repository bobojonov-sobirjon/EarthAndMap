import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { BASEMAPS } from '../map/basemaps'

/**
 * Yuqori o‘ng: Buxoro shahri overview + tanlangan MFY (sariq).
 */
export default function MfyOverviewMap({
  cityBoundary,
  mfyFeature,
  className = '',
}) {
  const wrapRef = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef(null)

  useEffect(() => {
    if (!wrapRef.current || mapRef.current) return undefined
    const map = L.map(wrapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    })
    const dark = BASEMAPS.schematicDark
    ;(dark?.layers || []).forEach((layer) => {
      L.tileLayer(layer.url, layer.options || {}).addTo(map)
    })
    mapRef.current = map
    layersRef.current = L.layerGroup().addTo(map)
    return () => {
      map.remove()
      mapRef.current = null
      layersRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const group = layersRef.current
    if (!map || !group) return

    group.clearLayers()
    const boundsParts = []

    const cityFeats = (cityBoundary?.features || []).filter((f) => {
      const code = String(f.properties?.code || '')
      return code.includes('shahar') || code === 'buxoro' || !code.includes('viloyat')
    })
    const city = cityFeats.length
      ? { type: 'FeatureCollection', features: cityFeats.slice(0, 3) }
      : cityBoundary

    if (city?.features?.length) {
      const cityLayer = L.geoJSON(city, {
        style: {
          color: '#94a3b8',
          weight: 1.4,
          fillColor: '#1e293b',
          fillOpacity: 0.55,
          opacity: 0.9,
        },
        interactive: false,
      }).addTo(group)
      try {
        const b = cityLayer.getBounds()
        if (b.isValid()) boundsParts.push(b)
      } catch { /* ignore */ }
    }

    if (mfyFeature?.geometry) {
      const mfyLayer = L.geoJSON(mfyFeature, {
        style: {
          color: '#facc15',
          weight: 2.2,
          fillColor: '#fbbf24',
          fillOpacity: 0.7,
          opacity: 1,
        },
        interactive: false,
      }).addTo(group)
      try {
        const b = mfyLayer.getBounds()
        if (b.isValid()) boundsParts.push(b)
      } catch { /* ignore */ }
    }

    if (boundsParts.length) {
      const bounds = boundsParts.reduce((acc, b) => acc.extend(b), L.latLngBounds(boundsParts[0]))
      map.fitBounds(bounds.pad(0.08), { animate: false, maxZoom: 13 })
    } else {
      map.setView([39.775, 64.43], 11)
    }

    requestAnimationFrame(() => map.invalidateSize())
  }, [cityBoundary, mfyFeature])

  return (
    <div className={`mfy-overview ${className}`.trim()} aria-hidden>
      <div ref={wrapRef} className="mfy-overview__map" />
    </div>
  )
}
