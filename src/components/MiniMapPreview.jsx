import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import { useMapData } from '../hooks/useMapData'
import { clearLayer, clearLayerGroup } from '../map/layerCleanup'
import { drawBoundaries, drawFeatureLayers } from '../map/drawLayers'
import { isResearchCategory, LAYER_GROUPS } from '../constants/researchLayers'

const CENTER = { lat: 39.773, lng: 64.44, zoom: 12 }

export default function MiniMapPreview() {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const layersRef = useRef({})
  const boundaryRef = useRef(null)
  const fittedRef = useRef(false)
  const [ready, setReady] = useState(false)

  const { boundaries, features, loading } = useMapData({
    pollIntervalMs: 0,
    enabled: true,
  })

  const visibleLayers = useMemo(() => {
    const vis = {}
    LAYER_GROUPS.forEach((g) => g.codes.forEach((c) => { vis[c] = true }))
    ;(boundaries?.features || []).forEach((f) => {
      const code = f.properties?.code
      if (code) vis[`boundary:${code}`] = true
    })
    return vis
  }, [boundaries])

  const geojson = useMemo(() => {
    if (!features) return null
    return {
      ...features,
      features: (features.features || []).filter((f) => isResearchCategory(f.properties?.category_code)),
    }
  }, [features])

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return undefined

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: true,
    }).setView([CENTER.lat, CENTER.lng], CENTER.zoom)

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 },
    ).addTo(map)

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, opacity: 0.9 },
    ).addTo(map)

    const onWheel = (e) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      e.stopPropagation()
      const step = e.deltaY > 0 ? -1 : 1
      const nextZoom = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), map.getZoom() + step))
      const point = map.mouseEventToContainerPoint(e)
      const latlng = map.containerPointToLatLng(point)
      map.setZoomAround(latlng, nextZoom)
    }
    map.getContainer().addEventListener('wheel', onWheel, { passive: false })

    mapInstance.current = map
    setReady(true)

    const t = window.setTimeout(() => map.invalidateSize(), 80)

    return () => {
      window.clearTimeout(t)
      map.getContainer().removeEventListener('wheel', onWheel)
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
    drawBoundaries({
      map,
      boundaryRef,
      collection: boundaries,
      visibleLayers,
      fitOnceRef: fittedRef,
      fitToBoundary: true,
    })
    return () => clearLayer(map, boundaryRef)
  }, [boundaries, ready, visibleLayers])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || !ready) return
    clearLayerGroup(map, layersRef)
    drawFeatureLayers({
      map,
      layersRef,
      collection: geojson,
      visibleLayers,
    })
    return () => clearLayerGroup(map, layersRef)
  }, [geojson, visibleLayers, ready])

  return (
    <div className="mini-map-frame">
      <div ref={mapRef} className="mini-map-canvas" />
      {loading && <div className="mini-map-loading">Xarita yuklanmoqda...</div>}
      <Link to="/map" className="mini-map-cta">Interaktiv xaritani ochish</Link>
    </div>
  )
}
