import L from 'leaflet'
import { clearLayer, createOverlayGroup } from './layerCleanup'

const STATUS_LABELS = {
  active: 'Faol',
  construction: 'Qurilish',
  damaged: 'Zararlangan',
  closed: 'Yopiq',
  planned: 'Rejalashtirilgan',
}

/** Past fill — fon yozuvlari (Buxoro, Kogon...) o'qilishi uchun. */
const FILL_OPACITY = {
  polygon: 0.35,
  selected: 0.5,
}

/**
 * Dinamik chegaralarni chizish.
 * Avvalgi polygon tozalanadi, keyin yangi GeoJSON chiziladi.
 */
export function drawBoundaries({
  map,
  boundaryRef,
  collection,
  visibleLayers = {},
  fitOnceRef,
  fitToBoundary = true,
}) {
  clearLayer(map, boundaryRef)
  if (!map || !collection?.features?.length) return null

  const visibleFeatures = collection.features.filter((f) => {
    const code = f.properties?.code
    return visibleLayers[`boundary:${code}`] !== false
  })
  if (!visibleFeatures.length) return null

  const group = createOverlayGroup(map)
  const layer = L.geoJSON(
    { type: 'FeatureCollection', features: visibleFeatures },
    {
      style: (feature) => {
        const p = feature.properties || {}
        const isCity = p.boundary_type === 'city'
        return {
          color: p.color || (isCity ? '#ff6b00' : '#e74c3c'),
          weight: p.weight || (isCity ? 4 : 3),
          fillColor: p.color || '#ff6b00',
          fillOpacity: Math.min(p.fill_opacity ?? 0.04, 0.06),
          dashArray: p.dash_array || null,
          opacity: 1,
          interactive: true,
          // Pane: overlay pastroq — label tilelari ustida qoladi
          className: 'map-boundary-layer',
        }
      },
      onEachFeature: (feature, lyr) => {
        lyr.bindPopup(`<strong>${feature.properties?.name || 'Chegara'}</strong>`)
        lyr.bringToBack?.()
      },
    },
  )
  group.addLayer(layer)
  boundaryRef.current = group

  if (fitToBoundary && fitOnceRef && !fitOnceRef.current) {
    const city = visibleFeatures.find((f) => f.properties?.boundary_type === 'city')
      || visibleFeatures[0]
    try {
      const bounds = L.geoJSON(city).getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] })
        fitOnceRef.current = true
      }
    } catch {
      // ignore invalid geom
    }
  }

  return group
}

/**
 * Poligon / chiziq / nuqta (marker) qatlamlarini kategoriya bo'yicha chizish.
 * Har yangilanishda eski layerlar to'liq o'chiriladi.
 */
export function drawFeatureLayers({
  map,
  layersRef,
  collection,
  visibleLayers = {},
  selectedId,
  onSelect,
}) {
  // Caller clears via clearLayerGroup; we rebuild into layersRef
  if (!map || !collection?.features?.length) return

  const byCategory = {}
  collection.features.forEach((feature) => {
    const code = feature.properties?.category_code
    if (!code || visibleLayers[code] === false) return
    if (!byCategory[code]) byCategory[code] = []
    byCategory[code].push(feature)
  })

  Object.entries(byCategory).forEach(([code, features]) => {
    const color = features[0]?.properties?.category_color || '#3388ff'
    const layer = L.geoJSON(
      { type: 'FeatureCollection', features },
      {
        pointToLayer: (f, latlng) =>
          L.circleMarker(latlng, {
            radius: selectedId === f.properties?.id ? 10 : 7,
            fillColor: color,
            color: selectedId === f.properties?.id ? '#ffffff' : color,
            weight: selectedId === f.properties?.id ? 3 : 2,
            fillOpacity: 0.9,
            className: 'map-marker-layer',
          }),
        style: (feature) => {
          const isSelected = selectedId === feature.properties?.id
          const isLine = feature.geometry?.type === 'LineString'
            || feature.geometry?.type === 'MultiLineString'
          return {
            color: isSelected ? '#ffffff' : color,
            weight: isLine ? (isSelected ? 4 : 2) : (isSelected ? 3 : 2),
            fillColor: color,
            fillOpacity: isLine ? 0 : (isSelected ? FILL_OPACITY.selected : FILL_OPACITY.polygon),
            className: 'map-feature-layer',
          }
        },
        onEachFeature: (f, lyr) => {
          const p = f.properties || {}
          lyr.bindPopup(`
            <div class="map-popup">
              <h4>${p.name || 'Obyekt'}</h4>
              <p><b>Kategoriya:</b> ${p.category_name || '—'}</p>
              <p><b>Status:</b> ${STATUS_LABELS[p.status] || p.status || '—'}</p>
              ${p.area_sqm ? `<p><b>Maydon:</b> ${Number(p.area_sqm).toLocaleString()} m²</p>` : ''}
              ${p.length_m ? `<p><b>Uzunlik:</b> ${Number(p.length_m).toLocaleString()} m</p>` : ''}
              ${p.address ? `<p><b>Manzil:</b> ${p.address}</p>` : ''}
            </div>
          `)
          lyr.on('click', () => onSelect?.(p))
        },
      },
    )
    layer.addTo(map)
    layersRef.current[code] = layer
  })
}
