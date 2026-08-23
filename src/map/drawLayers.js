import L from 'leaflet'
import { loc } from '../i18n/loc'
import { clearLayer, createOverlayGroup } from './layerCleanup'

const STATUS_LABELS = {
  uz: { active: 'Faol', construction: 'Qurilish', damaged: 'Zararlangan', closed: 'Yopiq', planned: 'Rejalashtirilgan' },
  ru: { active: 'Активен', construction: 'Строительство', damaged: 'Повреждён', closed: 'Закрыт', planned: 'Планируется' },
  en: { active: 'Active', construction: 'Construction', damaged: 'Damaged', closed: 'Closed', planned: 'Planned' },
}

const POP = {
  uz: { cat: 'Kategoriya', status: 'Status', area: 'Maydon', len: 'Uzunlik', addr: 'Manzil', obj: 'Obyekt', bound: 'Chegara' },
  ru: { cat: 'Категория', status: 'Статус', area: 'Площадь', len: 'Длина', addr: 'Адрес', obj: 'Объект', bound: 'Граница' },
  en: { cat: 'Category', status: 'Status', area: 'Area', len: 'Length', addr: 'Address', obj: 'Object', bound: 'Boundary' },
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const FILL_OPACITY = {
  polygon: 0.35,
  selected: 0.5,
}

function featureCenter(feature) {
  try {
    const b = L.geoJSON(feature).getBounds()
    if (b.isValid()) return b.getCenter()
  } catch {
    // ignore
  }
  return null
}

function isLineGeom(type) {
  return type === 'LineString' || type === 'MultiLineString'
}

function isPolyGeom(type) {
  return type === 'Polygon' || type === 'MultiPolygon'
}

function roadWeightForZoom(zoom, road) {
  const z = zoom || 13
  let base = 1.15
  if (road === 'magistral') base = 2.1
  else if (road === 'shahar') base = 1.55
  else if (road === 'mahalliy') base = 1.05
  else if (road === 'piyoda') base = 0.8
  if (z <= 12) return Math.max(0.55, base * 0.32)
  if (z <= 13) return Math.max(0.65, base * 0.48)
  if (z <= 14) return base * 0.72
  if (z <= 15) return base * 0.9
  return base
}

function roadVisibleAtZoom(zoom, road) {
  const z = zoom || 13
  if (road === 'piyoda' && z < 15) return false
  if (road === 'mahalliy' && z < 13) return false
  return true
}

function applyRoadLineStyle(layer, code, map) {
  if (code !== 'yollar' && code !== 'suv') return undefined
  const paint = () => {
    const z = map.getZoom()
    layer.eachLayer((lyr) => {
      if (!lyr.setStyle) return
      const road = lyr.feature?.properties?.road_class
      if (code === 'yollar' && !roadVisibleAtZoom(z, road)) {
        lyr.setStyle({ opacity: 0, weight: 0, fill: false, fillOpacity: 0 })
        return
      }
      const weight = code === 'yollar' ? roadWeightForZoom(z, road) : (z <= 13 ? 1.4 : 2.4)
      lyr.setStyle({
        weight,
        opacity: 0.92,
        fill: false,
        fillOpacity: 0,
        lineCap: 'butt',
        lineJoin: 'round',
      })
    })
  }
  paint()
  map.on('zoomend', paint)
  layer.on('remove', () => { map.off('zoomend', paint) })
  return paint
}

function asDrawnFeature(feature, code) {
  if (code !== 'yollar' && code !== 'suv') return feature
  const g = feature.geometry
  if (!g || isLineGeom(g.type) || !isPolyGeom(g.type)) return feature
  let coordinates
  if (g.type === 'Polygon') coordinates = g.coordinates || []
  else {
    coordinates = []
    ;(g.coordinates || []).forEach((poly) => {
      ;(poly || []).forEach((ring) => { if (ring?.length) coordinates.push(ring) })
    })
  }
  if (!coordinates.length) return feature
  const geometry = coordinates.length === 1
    ? { type: 'LineString', coordinates: coordinates[0] }
    : { type: 'MultiLineString', coordinates }
  return { ...feature, geometry }
}

/** Maydondan ekvivalent radius (m): A = π r² */
function radiusMeters(props, geomType) {
  const area = Number(props?.area_sqm) || 0
  if (area > 5e7) return 40
  if (area > 0) return Math.max(18, Math.sqrt(area / Math.PI))
  if (isLineGeom(geomType)) return 28
  return 55
}

function pinIcon(color, code) {
  const safe = String(color || '#3388ff').replace(/[^#a-zA-Z0-9]/g, '')
  const glyph = code === 'qabriston' ? '✝' : code === 'istirohat' || code === 'park' ? '●' : '•'
  return L.divIcon({
    className: 'map-pin',
    html: `<span class="map-pin__dot" style="--pin:${safe}">${glyph}</span>`,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -28],
  })
}

function boundsLookLocal(b) {
  const latSpan = Math.abs(b.getNorth() - b.getSouth())
  const lngSpan = Math.abs(b.getEast() - b.getWest())
  if (latSpan > 2.5 || lngSpan > 2.5) return false
  const c = b.getCenter()
  if (c.lat < 38.5 || c.lat > 41.5 || c.lng < 62 || c.lng > 67) return false
  return true
}

function formatRadius(m) {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`
  return `${Math.round(m)} m`
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
  lang = 'uz',
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
          fillOpacity: isCity ? Math.max(Number(p.fill_opacity) || 0.22, 0.18) : Math.min(Number(p.fill_opacity) || 0.08, 0.2),
          dashArray: p.dash_array || null,
          opacity: 1,
          interactive: true,
          // Pane: overlay pastroq — label tilelari ustida qoladi
          className: 'map-boundary-layer',
        }
      },
      onEachFeature: (feature, lyr) => {
        const p = feature.properties || {}
        const label = loc(p, 'name', lang) || POP[lang]?.bound || POP.uz.bound
        lyr.bindPopup(`<strong>${esc(label)}</strong>`)
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
  lang = 'uz',
  fitToFeatures = false,
  hidePins = false,
  onlyIds = null,
}) {
  // Caller clears via clearLayerGroup; we rebuild into layersRef
  if (!map || !collection?.features?.length) return

  const byCategory = {}
  collection.features.forEach((feature) => {
    const code = feature.properties?.category_code
    if (!code || visibleLayers[code] === false) return
    const isLine = code === 'yollar' || code === 'suv'
    if (onlyIds && !isLine) return
    if (!byCategory[code]) byCategory[code] = []
    byCategory[code].push(feature)
  })

  Object.entries(byCategory).forEach(([code, features]) => {
    const color = features[0]?.properties?.category_color || '#3388ff'
    const group = L.featureGroup()
    const drawn = features.map((f) => asDrawnFeature(f, code))
    const layer = L.geoJSON(
      { type: 'FeatureCollection', features: drawn },
      {
        pointToLayer: (f, latlng) =>
          L.circleMarker(latlng, {
            radius: selectedId === f.properties?.id ? 10 : 7,
            fillColor: color,
            color: '#ffffff',
            weight: selectedId === f.properties?.id ? 3 : 2,
            fillOpacity: 0.95,
            className: 'map-marker-layer',
          }),
        renderer: (code === 'yollar' || code === 'suv') ? L.canvas({ padding: 0.4 }) : undefined,
        style: (feature) => {
          const isSelected = selectedId === feature.properties?.id
          const isLine = isLineGeom(feature.geometry?.type) || code === 'yollar' || code === 'suv'
          const polyBoost = code === 'qabriston' ? 0.28 : FILL_OPACITY.polygon
          const road = feature.properties?.road_class
          const z = map.getZoom()
          let weight = 2
          if (isLine) {
            if (code === 'yollar') {
              weight = roadWeightForZoom(z, road)
              if (isSelected) weight += 1.2
            } else {
              weight = z <= 13 ? 1.4 : 2.4
              if (isSelected) weight += 1.2
            }
          } else {
            weight = isSelected ? 3 : 2
          }
          const hideRoad = code === 'yollar' && !roadVisibleAtZoom(z, road)
          return {
            color: isSelected ? '#ffffff' : color,
            weight: hideRoad ? 0 : weight,
            fillColor: color,
            fill: !isLine,
            fillOpacity: isLine ? 0 : (isSelected ? FILL_OPACITY.selected : polyBoost),
            opacity: hideRoad ? 0 : (isLine ? 0.92 : 1),
            lineCap: isLine ? 'butt' : 'round',
            lineJoin: 'round',
            smoothFactor: 1,
            noClip: true,
            className: 'map-feature-layer',
          }
        },
        onEachFeature: (f, lyr) => {
          const p = f.properties || {}
          const LBL = POP[lang] || POP.uz
          const st = (STATUS_LABELS[lang] || STATUS_LABELS.uz)[p.status] || p.status || '—'
          const name = loc(p, 'name', lang) || LBL.obj
          const cat = loc({
            name: p.category_name,
            name_ru: p.category_name_ru,
            name_en: p.category_name_en,
          }, 'name', lang) || '—'
          const addr = loc(p, 'address', lang)
          const r = radiusMeters(p, f.geometry?.type)
          lyr.bindPopup(`
            <div class="map-popup">
              <h4>${esc(name)}</h4>
              <p><b>${LBL.cat}:</b> ${esc(cat)}</p>
              <p><b>${LBL.status}:</b> ${esc(st)}</p>
              ${p.area_sqm ? `<p><b>${LBL.area}:</b> ${Number(p.area_ha ?? p.area_sqm / 10000).toLocaleString()} ga</p>` : ''}
              <p><b>Radius:</b> ≈ ${esc(formatRadius(r))}</p>
              ${p.length_m ? `<p><b>${LBL.len}:</b> ${Number(p.length_m).toLocaleString()} m</p>` : ''}
              ${addr ? `<p><b>${LBL.addr}:</b> ${esc(addr)}</p>` : ''}
            </div>
          `)
          lyr.on('click', () => onSelect?.(p))
        },
      },
    )
    group.addLayer(layer)
    applyRoadLineStyle(layer, code, map)

    const lineLayer = code === 'yollar' || code === 'suv' || features.every((f) => isLineGeom(f.geometry?.type))
    const pinThese = !hidePins && !lineLayer && (
      features.length <= 120 || features.some((f) => isPolyGeom(f.geometry?.type) || f.geometry?.type === 'Point')
    )
    if (pinThese) {
    features.forEach((f) => {
      const p = f.properties || {}
      const center = featureCenter(f)
      if (!center) return
      const r = radiusMeters(p, f.geometry?.type)
      const name = loc(p, 'name', lang) || p.public_id || '—'
      if (isPolyGeom(f.geometry?.type) || f.geometry?.type === 'Point') {
        L.circle(center, {
          radius: r,
          color,
          weight: 1.5,
          dashArray: '5 5',
          fillColor: color,
          fillOpacity: 0.1,
          interactive: false,
          className: 'map-radius-ring',
        }).addTo(group)
      }
      const pin = L.marker(center, {
        icon: pinIcon(color, code),
        riseOnHover: true,
        zIndexOffset: 600,
      })
      pin.bindTooltip(
        `<strong>${esc(name)}</strong><br/>R ≈ ${esc(formatRadius(r))}${p.area_ha != null ? ` · ${p.area_ha} ga` : ''}`,
        { direction: 'top', sticky: true, className: 'map-pin-tip' },
      )
      pin.on('click', () => onSelect?.(p))
      pin.addTo(group)
    })
    }

    group.addTo(map)
    layersRef.current[code] = group
  })

  if (fitToFeatures) {
    const all = Object.values(layersRef.current).filter(Boolean)
    if (all.length) {
      const united = L.featureGroup(all)
      const b = united.getBounds()
      if (b.isValid() && boundsLookLocal(b)) {
        map.fitBounds(b, { padding: [48, 48], maxZoom: 17 })
      } else {
        map.setView([39.773, 64.440], 13)
      }
    }
  }
}
