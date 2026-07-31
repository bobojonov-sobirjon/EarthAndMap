import L from 'leaflet'

/**
 * Leaflet layer / FeatureGroup ni xaritadan to'liq olib tashlash.
 * Duplicate / overlapping chizilishni oldini oladi.
 */
export function clearLayer(map, layerRef) {
  if (!map || !layerRef) return
  const layer = layerRef.current
  if (!layer) return

  try {
    if (map.hasLayer(layer)) {
      map.removeLayer(layer)
    }
    if (typeof layer.clearLayers === 'function') {
      layer.clearLayers()
    }
    if (typeof layer.off === 'function') {
      layer.off()
    }
  } catch {
    // ignore teardown races
  }
  layerRef.current = null
}

/** Bir nechta named layerlarni tozalash (object of refs yoki layers). */
export function clearLayerGroup(map, layersRef) {
  if (!map || !layersRef?.current) return
  Object.values(layersRef.current).forEach((layer) => {
    if (!layer) return
    try {
      if (map.hasLayer(layer)) map.removeLayer(layer)
      if (typeof layer.clearLayers === 'function') layer.clearLayers()
      if (typeof layer.off === 'function') layer.off()
    } catch {
      // ignore
    }
  })
  layersRef.current = {}
}

/** Bo'sh FeatureGroup yaratish va xaritaga bog'lash. */
export function createOverlayGroup(map) {
  const group = L.featureGroup()
  group.addTo(map)
  return group
}
