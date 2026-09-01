import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { BASEMAPS } from '../map/basemaps'
import { applyBasemapLayers } from '../map/applyBasemapLayers'
import { statsApi } from '../api/services'

const DEFAULT_BOUNDS = [[39.728, 64.352], [39.802, 64.528]]

const CLASS_COLORS = {
  0: { fill: '#ec4899', stroke: '#db2777' },
  1: { fill: '#22c55e', stroke: '#16a34a' },
}

function normalizeBounds(raw) {
  if (!Array.isArray(raw) || raw.length !== 2) return DEFAULT_BOUNDS
  const [a, b] = raw
  if (!Array.isArray(a) || !Array.isArray(b)) return DEFAULT_BOUNDS
  return [[Number(a[0]), Number(a[1])], [Number(b[0]), Number(b[1])]]
}

function classValue(props, field) {
  const raw = props?.[field]
  const n = Number(raw)
  return Number.isFinite(n) ? n : raw
}

export default function UrbanizationVectorMap({
  year,
  classField,
  layerVisible,
  legend,
  popupLabels,
}) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const basemapLayersRef = useRef([])
  const vectorLayerRef = useRef(null)
  const cacheRef = useRef({})

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
      BASEMAPS.satellite,
      basemapLayersRef.current,
    )
    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
      vectorLayerRef.current = null
      cacheRef.current = {}
    }
  }, [])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || !year) return undefined

    let cancelled = false

    const applyLayer = (data) => {
      if (cancelled) return

      if (vectorLayerRef.current) {
        map.removeLayer(vectorLayerRef.current)
        vectorLayerRef.current = null
      }

      const field = data.class_field || classField || 'class'
      const fc = {
        type: 'FeatureCollection',
        features: data.features || [],
      }

      const layer = L.geoJSON(fc, {
        style: (feature) => {
          const cls = classValue(feature.properties, field)
          const palette = CLASS_COLORS[cls] || { fill: '#94a3b8', stroke: '#64748b' }
          return {
            fillColor: palette.fill,
            color: palette.stroke,
            weight: 1,
            fillOpacity: layerVisible ? 0.45 : 0,
            opacity: layerVisible ? 0.75 : 0,
          }
        },
        onEachFeature: (feature, lyr) => {
          lyr.on('click', () => {
            const cls = classValue(feature.properties, field)
            const label = cls === 1 ? popupLabels.urban : popupLabels.nonUrban
            lyr.bindPopup(
              `<div class="urban-popup"><strong>${popupLabels.year}: ${year}</strong><br/>${popupLabels.class}: ${label}</div>`,
            )
            lyr.openPopup()
          })
        },
      })

      vectorLayerRef.current = layer
      if (layerVisible) layer.addTo(map)

      const bounds = normalizeBounds(data.bounds)
      if (layer.getLayers().length && layer.getBounds().isValid()) {
        map.fitBounds(layer.getBounds(), { padding: [24, 24] })
      } else if (bounds) {
        map.fitBounds(bounds, { padding: [24, 24] })
      }
    }

    const load = async () => {
      const y = Number(year)
      let data = cacheRef.current[y]
      if (!data) {
        const { data: fetched } = await statsApi.urbanizationGeojson({ year: y })
        data = fetched
        cacheRef.current[y] = data
      }
      applyLayer(data)
    }

    load().catch(() => {
      if (vectorLayerRef.current) {
        map.removeLayer(vectorLayerRef.current)
        vectorLayerRef.current = null
      }
    })

    return () => { cancelled = true }
  }, [year, classField, layerVisible, popupLabels])

  return (
    <div className="urban-vector-map">
      <div ref={mapRef} className="urban-vector-map__canvas" />
      <div className="urban-compare__legend urban-vector-map__legend" aria-hidden>
        <span className="urban-compare__legend-item urban-compare__legend-item--non">
          {legend?.nonUrban}
        </span>
        <span className="urban-compare__legend-item urban-compare__legend-item--urban">
          {legend?.urban}
        </span>
      </div>
    </div>
  )
}
