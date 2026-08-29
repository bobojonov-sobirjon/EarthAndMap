import L from 'leaflet'
import { MAP_MAX_ZOOM } from './basemaps'

/**
 * Esri tile qatlamlarini xaritaga qo'shadi (EPSG:3857).
 * @returns {L.Layer[]}
 */
export function applyBasemapLayers(map, basemapDef, previousLayers = []) {
  previousLayers.forEach((ly) => {
    try { map.removeLayer(ly) } catch { /* ignore */ }
  })

  const layers = []
  for (const spec of basemapDef.layers || []) {
    if (!spec.url) continue
    const layer = L.tileLayer(spec.url, {
      attribution: '',
      maxZoom: MAP_MAX_ZOOM,
      ...spec.options,
    })
    layer.addTo(map)
    layers.push(layer)
  }

  map.invalidateSize()
  return layers
}
