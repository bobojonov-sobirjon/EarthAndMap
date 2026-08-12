import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import MapControls from './MapControls'
import { clearLayer, clearLayerGroup } from '../map/layerCleanup'
import { drawBoundaries, drawFeatureLayers } from '../map/drawLayers'

const DEFAULT_CENTER = { lat: 39.773, lng: 64.440, zoom: 13 }

/**
 * Dinamik chegaralar + markerlar / obyektlar.
 * Props o'zgarganda eski layerlar tozalanadi, yangilari chiziladi.
 */
export default function GisMap({
  center = DEFAULT_CENTER,
  geojson,
  boundary,
  visibleLayers = {},
  selectedId,
  onSelect,
  drawMode = false,
  drawType = 'Polygon',
  onDrawComplete,
  fitToBoundary = true,
  loading = false,
  error = null,
  refreshing = false,
  onRefresh,
  showEditTools = false,
  onCoordsChange,
}) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const layersRef = useRef({})
  const boundaryRef = useRef(null)
  const fittedRef = useRef(false)
  const drawHandlerRef = useRef(onDrawComplete)
  const [ready, setReady] = useState(false)

  drawHandlerRef.current = onDrawComplete

  // —— Map init (bir marta) ——
  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return undefined

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(
      [center?.lat ?? DEFAULT_CENTER.lat, center?.lng ?? DEFAULT_CENTER.lng],
      center?.zoom ?? DEFAULT_CENTER.zoom,
    )

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: '', maxZoom: 19 },
    ).addTo(map)

    // Joy nomlari — yuqori pane, aniq kontrast
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '',
        maxZoom: 19,
        opacity: 1,
        className: 'map-labels-sharp',
        zIndex: 450,
      },
    ).addTo(map)

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '',
        maxZoom: 19,
        opacity: 0.8,
        zIndex: 440,
      },
    ).addTo(map)

    map.pm.setLang('en')
    // Chizish / tahrirlash / kesish asboblari odatiy holatda YO'Q (hujjat: olib tashlash)
    map.on('pm:create', (e) => {
      const layer = e.layer
      const geo = layer.toGeoJSON().geometry
      drawHandlerRef.current?.(geo)
      map.removeLayer(layer)
    })

    mapInstance.current = map
    setReady(true)

    return () => {
      clearLayer(map, boundaryRef)
      clearLayerGroup(map, layersRef)
      map.remove()
      mapInstance.current = null
      fittedRef.current = false
    }
  }, [])

  // —— Dinamik chegaralar ——
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !ready) return

    drawBoundaries({
      map,
      boundaryRef,
      collection: boundary,
      visibleLayers,
      fitOnceRef: fittedRef,
      fitToBoundary,
    })

    return () => {
      clearLayer(map, boundaryRef)
    }
  }, [boundary, ready, visibleLayers, fitToBoundary])

  // —— Dinamik obyektlar / markerlar ——
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !ready) return

    clearLayerGroup(map, layersRef)
    drawFeatureLayers({
      map,
      layersRef,
      collection: geojson,
      visibleLayers,
      selectedId,
      onSelect,
    })

    return () => {
      clearLayerGroup(map, layersRef)
    }
  }, [geojson, visibleLayers, selectedId, ready, onSelect])

  // —— Draw mode (faqat tahrirlash ruxsati bilan) ——
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !ready) return
    map.pm.disableDraw()
    if (showEditTools && drawMode) {
      const shape = drawType === 'LineString' ? 'Line' : drawType === 'Point' ? 'Marker' : 'Polygon'
      map.pm.enableDraw(shape)
    }
  }, [drawMode, drawType, ready, showEditTools])

  return (
    <div className="gis-map-wrap">
      <div ref={mapRef} className="gis-map" />
      <MapControls
        map={ready ? mapInstance.current : null}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onCoordsChange={onCoordsChange}
      />

      {loading && (
        <div className="map-status map-status-loading" role="status">
          Xarita ma'lumotlari yuklanmoqda...
        </div>
      )}
      {error && !loading && (
        <div className="map-status map-status-error" role="alert">
          <span>{error}</span>
          {onRefresh && (
            <button type="button" className="btn btn-sm btn-primary" onClick={onRefresh}>
              Qayta urinish
            </button>
          )}
        </div>
      )}
    </div>
  )
}
