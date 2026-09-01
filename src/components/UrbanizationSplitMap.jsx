import { useCallback, useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import { BASEMAPS } from '../map/basemaps'
import { applyBasemapLayers } from '../map/applyBasemapLayers'
import { statsApi } from '../api/services'
import UrbanRgbFrame from './UrbanRgbFrame'

import { fitUrbanCompareBounds } from '../map/urbanCompareView'

const DEFAULT_BOUNDS = [[39.728, 64.352], [39.802, 64.528]]

/** gridcode 0 = sariq, 1 = ko'k */
const CLASS_COLORS = {
  0: { fill: '#facc15', stroke: '#ca8a04' },
  1: { fill: '#3b82f6', stroke: '#1d4ed8' },
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

function fitMapToBounds(map, bounds) {
  fitUrbanCompareBounds(map, bounds)
}

function ShpPane({ year, classField, popupLabels, fitBounds, onMapReady }) {
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
    if (!map || !year) return undefined
    let cancelled = false

    const applyLayer = (data) => {
      if (cancelled) return
      if (vectorLayerRef.current) {
        map.removeLayer(vectorLayerRef.current)
        vectorLayerRef.current = null
      }

      const field = data.class_field || classField || 'gridcode'
      const fc = { type: 'FeatureCollection', features: data.features || [] }

      const layer = L.geoJSON(fc, {
        style: (feature) => {
          const cls = classValue(feature.properties, field)
          const palette = CLASS_COLORS[cls] || { fill: '#94a3b8', stroke: '#64748b' }
          return {
            fillColor: palette.fill,
            color: palette.stroke,
            weight: 0.6,
            fillOpacity: 0.55,
            opacity: 0.85,
          }
        },
        onEachFeature: (feature, lyr) => {
          lyr.on('click', () => {
            const props = feature.properties || {}
            const fieldKey = data.class_field || classField || 'gridcode'
            const cls = classValue(props, fieldKey)
            const label = cls === 1 ? popupLabels.urban : popupLabels.nonUrban
            const attrs = Object.entries(props)
              .filter(([k]) => !k.startsWith('_'))
              .map(([k, v]) => `${k}: ${v ?? '—'}`)
              .join('<br/>')
            lyr.bindPopup(
              `<div class="urban-popup"><strong>${popupLabels.year}: ${year}</strong><br/>`
              + `${popupLabels.class}: ${label} (${fieldKey}=${cls ?? '—'})<br/>${attrs}</div>`,
            )
            lyr.openPopup()
          })
        },
      })

      vectorLayerRef.current = layer
      layer.addTo(map)

      if (fitBounds) {
        fitMapToBounds(map, fitBounds)
      } else if (layer.getLayers().length && layer.getBounds().isValid()) {
        fitMapToBounds(map, layer.getBounds())
      } else {
        fitMapToBounds(map, normalizeBounds(data.bounds))
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

    load().catch(() => {})
    return () => { cancelled = true }
  }, [year, classField, popupLabels, fitBounds])

  return <div ref={mapRef} className="urban-compare__map" />
}

function TifPane({ mapSet, emptyLabel, labels, fitBounds, onMapReady }) {
  return (
    <UrbanRgbFrame
      mapSet={mapSet}
      labels={labels}
      emptyLabel={emptyLabel}
      fitBounds={fitBounds}
      onMapReady={onMapReady}
    />
  )
}

export default function UrbanizationSplitMap({
  year,
  classField,
  mapSet,
  labels,
  popupLabels,
}) {
  const mapsRef = useRef({ a: null, b: null })
  const syncLockRef = useRef(false)

  const fitBounds = useMemo(
    () => normalizeBounds(mapSet?.rgb_bounds || mapSet?.classified_bounds),
    [mapSet?.rgb_bounds, mapSet?.classified_bounds],
  )

  const registerMap = useCallback((key, map) => {
    const prev = mapsRef.current[key]
    if (prev && prev !== map && prev._urbanSyncHandler) {
      prev.off('moveend', prev._urbanSyncHandler)
      prev.off('zoomend', prev._urbanSyncHandler)
    }

    mapsRef.current[key] = map
    if (!map) return

    const syncHandler = () => {
      if (syncLockRef.current) return
      const otherKey = key === 'a' ? 'b' : 'a'
      const other = mapsRef.current[otherKey]
      if (!other) return
      syncLockRef.current = true
      other.setView(map.getCenter(), map.getZoom(), { animate: false })
      syncLockRef.current = false
    }

    map._urbanSyncHandler = syncHandler
    map.on('moveend', syncHandler)
    map.on('zoomend', syncHandler)
  }, [])

  const onShpMapReady = useCallback((map) => registerMap('a', map), [registerMap])
  const onTifMapReady = useCallback((map) => registerMap('b', map), [registerMap])

  return (
    <div className="urban-compare urban-compare--split">
      <div className="urban-compare__pane">
        <div className="urban-compare__pane-head">
          <span className="urban-compare__tag">a</span>
          <div>
            <strong>{labels.shpTitle}</strong>
            <small>{labels.shpSub}</small>
          </div>
        </div>
        <div className="urban-compare__map-wrap urban-compare__map-wrap--shp">
          <ShpPane
            year={year}
            classField={classField}
            popupLabels={popupLabels}
            fitBounds={fitBounds}
            onMapReady={onShpMapReady}
          />
          <div className="urban-compare__legend urban-compare__legend--gridcode" aria-hidden>
            <span className="urban-compare__legend-item urban-compare__legend-item--gc0">
              {labels.nonUrban} (gridcode 0)
            </span>
            <span className="urban-compare__legend-item urban-compare__legend-item--gc1">
              {labels.urban} (gridcode 1)
            </span>
          </div>
        </div>
      </div>
      <div className="urban-compare__pane">
        <div className="urban-compare__pane-head">
          <span className="urban-compare__tag">b</span>
          <div>
            <strong>{labels.tifTitle}</strong>
            <small>{labels.tifSub}</small>
          </div>
        </div>
        <TifPane
          mapSet={mapSet}
          emptyLabel={labels.tifEmpty}
          labels={labels}
          fitBounds={fitBounds}
          onMapReady={onTifMapReady}
        />
      </div>
    </div>
  )
}
