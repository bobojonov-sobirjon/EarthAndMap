import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import '@geoman-io/leaflet-geoman-free'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
import MapControls from './MapControls'
import { clearLayer, clearLayerGroup } from '../map/layerCleanup'
import { drawBoundaries, drawFeatureLayers } from '../map/drawLayers'
import { useI18n } from '../i18n/I18nContext'

const DEFAULT_CENTER = { lat: 39.773, lng: 64.440, zoom: 13 }
/** Buxoro Esri z=17+ da “Map data not yet available” beradi. */
const MAP_MAX_ZOOM = 16
const TILE_NATIVE_ZOOM = 16
const ROUTE_FIT_MAX_ZOOM = 14

const RED_PIN = '#dc2626'

function destPinIcon(letter) {
  const Ltr = String(letter || '').slice(0, 1)
  return L.divIcon({
    className: 'route-dest',
    iconSize: [40, 52],
    iconAnchor: [20, 50],
    popupAnchor: [0, -44],
    html: `<div class="route-dest__wrap">
      <svg class="route-dest__svg" viewBox="0 0 40 52" width="40" height="52" aria-hidden="true">
        <path fill="${RED_PIN}" stroke="#fff" stroke-width="2.2"
          d="M20 2.2c-9.2 0-16.6 7.5-16.6 16.8 0 12.4 16.6 30.2 16.6 30.2S36.6 31.4 36.6 19C36.6 9.7 29.2 2.2 20 2.2z"/>
        <circle cx="20" cy="18.5" r="9.2" fill="#fff"/>
        <text x="20" y="23" text-anchor="middle" fill="${RED_PIN}" font-size="13" font-weight="800" font-family="system-ui,sans-serif">${Ltr}</text>
      </svg>
    </div>`,
  })
}

function userPinIcon() {
  return L.divIcon({
    className: 'route-dest',
    iconSize: [40, 52],
    iconAnchor: [20, 50],
    html: `<div class="route-dest__wrap">
      <svg class="route-dest__svg" viewBox="0 0 40 52" width="40" height="52" aria-hidden="true">
        <path fill="#2563eb" stroke="#fff" stroke-width="2.2"
          d="M20 2.2c-9.2 0-16.6 7.5-16.6 16.8 0 12.4 16.6 30.2 16.6 30.2S36.6 31.4 36.6 19C36.6 9.7 29.2 2.2 20 2.2z"/>
        <circle cx="20" cy="18.5" r="9.2" fill="#fff"/>
        <text x="20" y="23" text-anchor="middle" fill="#2563eb" font-size="13" font-weight="800" font-family="system-ui,sans-serif">A</text>
      </svg>
    </div>`,
  })
}

/**
 * Dinamik chegaralar + markerlar / obyektlar.
 * Props o'zgarganda eski layerlar tozalanadi, yangilari chiziladi.
 */
export default function GisMap(props) {
  const {
    center = DEFAULT_CENTER,
    geojson,
    boundary,
    visibleLayers = {},
    selectedId,
    drawMode = false,
    drawType = 'Polygon',
    onDrawComplete,
    fitToBoundary = true,
    fitToFeatures = false,
    loading = false,
    error = null,
    refreshing = false,
    onRefresh,
    showEditTools = false,
    onCoordsChange,
    onUserLocation,
    userLocation = null,
    routes = [],
    onNearest,
    nearestOpen = false,
  } = props
  const onSelect = props.onSelect || props.onSelect || props.onPick
  const { lang, t } = useI18n()
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const layersRef = useRef({})
  const boundaryRef = useRef(null)
  const fittedRef = useRef(false)
  const extraRef = useRef(null)
  const drawHandlerRef = useRef(onDrawComplete)
  const [ready, setReady] = useState(false)

  drawHandlerRef.current = onDrawComplete

  // —— Map init (bir marta) ——
  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return undefined

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 10,
      maxZoom: MAP_MAX_ZOOM,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 120,
    }).setView(
      [center?.lat ?? DEFAULT_CENTER.lat, center?.lng ?? DEFAULT_CENTER.lng],
      center?.zoom ?? DEFAULT_CENTER.zoom,
    )

    const tileOpts = {
      attribution: '',
      maxZoom: MAP_MAX_ZOOM,
      maxNativeZoom: TILE_NATIVE_ZOOM,
    }

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      tileOpts,
    ).addTo(map)

    // Joy nomlari — yuqori pane, aniq kontrast
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        ...tileOpts,
        opacity: 1,
        className: 'map-labels-sharp',
        zIndex: 450,
      },
    ).addTo(map)

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      {
        ...tileOpts,
        opacity: 0.8,
        zIndex: 440,
      },
    ).addTo(map)

    map.createPane('nearest')
    map.getPane('nearest').style.zIndex = 650
    map.getPane('nearest').style.pointerEvents = 'auto'

    map.pm.setLang('en')
    // Chizish / tahrirlash / kesish asboblari odatiy holatda YO'Q (hujjat: olib tashlash)
    map.on('pm:create', (e) => {
      const layer = e.layer
      const geo = layer.toGeoJSON().geometry
      drawHandlerRef.current?.(geo)
      map.removeLayer(layer)
    })

    map.on('zoomend', () => {
      if (map.getZoom() > MAP_MAX_ZOOM) map.setZoom(MAP_MAX_ZOOM)
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

  useEffect(() => {
    const map = mapInstance.current
    if (!map || !ready) return
    map.setMaxZoom(MAP_MAX_ZOOM)
    map.setMinZoom(10)
    if (map.getZoom() > MAP_MAX_ZOOM) map.setZoom(MAP_MAX_ZOOM)
  }, [ready])

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
      lang,
    })

    return () => {
      clearLayer(map, boundaryRef)
    }
  }, [boundary, ready, visibleLayers, fitToBoundary, lang])

  // —— Dinamik obyektlar / markerlar ——
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !ready) return

    clearLayerGroup(map, layersRef)
    const nearestIds = (routes || []).map((r) => r.id).filter((id) => id != null)
    const nearestMode = nearestIds.length > 0
    drawFeatureLayers({
      map,
      layersRef,
      collection: geojson,
      visibleLayers,
      selectedId,
      onSelect,
      lang,
      fitToFeatures: nearestMode ? false : fitToFeatures,
      hidePins: nearestMode,
      onlyIds: nearestMode ? new Set(nearestIds) : null,
    })

    return () => {
      clearLayerGroup(map, layersRef)
    }
  }, [geojson, visibleLayers, selectedId, ready, onSelect, lang, fitToFeatures, routes])

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

  useEffect(() => {
    const map = mapInstance.current
    if (!map || !ready) return undefined
    if (extraRef.current) {
      map.removeLayer(extraRef.current)
      extraRef.current = null
    }
    const group = L.layerGroup().addTo(map)
    extraRef.current = group

    if (userLocation) {
      L.circleMarker([userLocation.lat, userLocation.lng], {
        pane: 'nearest',
        radius: 8,
        color: '#fff',
        weight: 2,
        fillColor: '#2563eb',
        fillOpacity: 1,
      }).addTo(group)
      L.marker([userLocation.lat, userLocation.lng], {
        pane: 'nearest',
        icon: userPinIcon(),
        zIndexOffset: 2500,
        title: 'A',
      }).addTo(group)
    }

    const pts = []
    if (userLocation) pts.push([userLocation.lat, userLocation.lng])
    ;(routes || []).forEach((r) => {
      if (r.coordinates?.length) {
        L.polyline(
          r.coordinates.map(([lng, lat]) => [lat, lng]),
          { pane: 'nearest', color: r.color || RED_PIN, weight: 5, opacity: 0.92, lineJoin: 'round' },
        ).addTo(group)
      }
      if (r.dest) {
        pts.push([r.dest.lat, r.dest.lng])
        L.circleMarker([r.dest.lat, r.dest.lng], {
          pane: 'nearest',
          radius: 8,
          color: '#fff',
          weight: 2,
          fillColor: RED_PIN,
          fillOpacity: 1,
        }).addTo(group).on('click', () => {
          onSelect?.(r.land || { id: r.id, name: r.name })
        })
        const mk = L.marker([r.dest.lat, r.dest.lng], {
          pane: 'nearest',
          icon: destPinIcon(r.letter),
          zIndexOffset: 2400,
          title: r.name || r.letter,
        }).addTo(group)
        mk.on('click', (ev) => {
          L.DomEvent.stopPropagation(ev)
          const land = r.land || { id: r.id, name: r.name }
          onSelect?.(land)
        })
        if (r.name) {
          mk.bindTooltip(`${r.letter}: ${r.name}`, {
            direction: 'top',
            offset: [0, -42],
            permanent: true,
            interactive: false,
            className: 'route-dest-tip',
          })
        }
      }
    })

    if (pts.length >= 2) {
      map.fitBounds(L.latLngBounds(pts).pad(0.35), { maxZoom: ROUTE_FIT_MAX_ZOOM, animate: true })
    } else if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], Math.min(14, MAP_MAX_ZOOM), { duration: 0.9 })
    }

    return () => {
      if (extraRef.current) {
        map.removeLayer(extraRef.current)
        extraRef.current = null
      }
    }
  }, [userLocation, routes, ready])

  return (
    <div className="gis-map-wrap">
      <div ref={mapRef} className="gis-map" />
      <MapControls
        map={ready ? mapInstance.current : null}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onCoordsChange={onCoordsChange}
        onUserLocation={onUserLocation}
        onNearest={onNearest}
        nearestOpen={nearestOpen}
      />

      {loading && (
        <div className="map-status map-status-loading" role="status">
          <span className="map-status-spin" aria-hidden />
          {t('map.dataLoading')}
        </div>
      )}
      {error && !loading && (
        <div className="map-status map-status-error" role="alert">
          <span>{error}</span>
          {onRefresh && (
            <button type="button" className="btn btn-sm btn-primary" onClick={onRefresh}>
              {t('common.retry')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
