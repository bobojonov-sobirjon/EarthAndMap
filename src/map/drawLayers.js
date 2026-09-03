import L from 'leaflet'
import { loc } from '../i18n/loc'
import { roadClassColor, waterClassColor, parkClassColor, isYollarFeatureVisible, isSuvFeatureVisible, isIstirohatFeatureVisible } from '../constants/researchLayers'
import { clearLayer, createOverlayGroup } from './layerCleanup'

const STATUS_LABELS = {
  uz: { active: 'Faol', construction: 'Qurilish', damaged: 'Zararlangan', closed: 'Yopiq', planned: 'Rejalashtirilgan' },
  ru: { active: 'Активен', construction: 'Строительство', damaged: 'Повреждён', closed: 'Закрыт', planned: 'Планируется' },
  en: { active: 'Active', construction: 'Construction', damaged: 'Damaged', closed: 'Closed', planned: 'Planned' },
}

const POP = {
  uz: { cat: 'Kategoriya', status: 'Status', area: 'Maydon', len: 'Uzunlik', addr: 'Manzil', obj: 'Obyekt', bound: 'Chegara', road: 'Daraja' },
  ru: { cat: 'Категория', status: 'Статус', area: 'Площадь', len: 'Длина', addr: 'Адрес', obj: 'Объект', bound: 'Граница', road: 'Класс' },
  en: { cat: 'Category', status: 'Status', area: 'Area', len: 'Length', addr: 'Address', obj: 'Object', bound: 'Boundary', road: 'Class' },
}

const ROAD_LABELS = {
  uz: { magistral: 'I darajali', shahar: 'II darajali', mahalliy: 'III darajali', piyoda: 'Piyoda va yordamchi', kanal: 'Kanal', ariq: 'Ariq', park: "Bog'", xiyobon: 'Xiyobon', square: 'Maydon' },
  ru: { magistral: 'I категория', shahar: 'II категория', mahalliy: 'III категория', piyoda: 'Пешеходные', kanal: 'Канал', ariq: 'Арык', park: 'Парк', xiyobon: 'Бульвар', square: 'Площадь' },
  en: { magistral: 'Class I', shahar: 'Class II', mahalliy: 'Class III', piyoda: 'Pedestrian', kanal: 'Canal', ariq: 'Ditch', park: 'Park', xiyobon: 'Boulevard', square: 'Square' },
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

function pinCenterKey(center) {
  return `${center.lat.toFixed(5)},${center.lng.toFixed(5)}`
}

function groupPinFeatures(features) {
  const groups = new Map()
  features.forEach((f) => {
    if (!isPolyGeom(f.geometry?.type) && f.geometry?.type !== 'Point') return
    const center = featureCenter(f)
    if (!center) return
    const key = pinCenterKey(center)
    if (!groups.has(key)) groups.set(key, { center, items: [] })
    groups.get(key).items.push(f)
  })
  return groups
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
  if (z <= 18) return base
  return base * 1.2
}

function roadVisibleAtZoom(zoom, road) {
  const z = zoom || 13
  if (road === 'piyoda' && z < 15) return false
  if (road === 'mahalliy' && z < 14) return false
  if (road === 'shahar' && z < 12) return false
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
      const lineColor = code === 'yollar' ? roadClassColor(road, '#e67e22') : undefined
      lyr.setStyle({
        weight,
        color: lineColor || lyr.options.color,
        opacity: 0.92,
        fill: false,
        fillOpacity: 0,
        lineCap: 'butt',
        lineJoin: 'round',
        dashArray: road === 'piyoda' ? '6 8' : undefined,
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

const PIN_BADGE = {
  qabriston: { color: '#64748b', accent: '#334155' },
  park: { color: '#16a34a', accent: '#14532d' },
  xiyobon: { color: '#65a30d', accent: '#3f6212' },
  square: { color: '#ca8a04', accent: '#854d0e' },
}

function badgePinHtml(color, inner, extraClass = '') {
  const safe = String(color || '#64748b').replace(/[^#a-zA-Z0-9]/g, '')
  return `<div class="map-pin__badge${extraClass ? ` ${extraClass}` : ''}">
    <svg class="map-pin__badge-svg" viewBox="0 0 40 52" width="40" height="52" aria-hidden="true">
      <path fill="${safe}" stroke="#fff" stroke-width="2.5"
        d="M20 2.2c-9.2 0-16.6 7.5-16.6 16.8 0 12.4 16.6 30.2 16.6 30.2S36.6 31.4 36.6 19C36.6 9.7 29.2 2.2 20 2.2z"/>
      <circle cx="20" cy="18.5" r="10.2" fill="#fff"/>
    </svg>
    <span class="map-pin__badge-inner">${inner}</span>
  </div>`
}

function badgePinIcon(color, inner, className) {
  return L.divIcon({
    className: `map-pin map-pin--badge ${className}`,
    html: badgePinHtml(color, inner),
    iconSize: [40, 52],
    iconAnchor: [20, 50],
    popupAnchor: [0, -44],
  })
}

function pinGlyphSvg(kind, fg = '#334155') {
  const safeFg = String(fg).replace(/[^#a-zA-Z0-9]/g, '')
  if (kind === 'xiyobon') {
    return `<svg viewBox="0 0 24 24" class="map-pin__badge-glyph" aria-hidden="true">
      <path fill="${safeFg}" d="M4 20h16v-1.6H4V20zm2-3.2h2.4V9.2L12 5l3.6 4.2v7.6H18V8.4L12 2.8 6 8.4v8.4z"/>
    </svg>`
  }
  if (kind === 'square') {
    return `<svg viewBox="0 0 24 24" class="map-pin__badge-glyph" aria-hidden="true">
      <path fill="${safeFg}" d="M4 4h16v16H4V4zm2.4 2.4v11.2h11.2V6.4H6.4z"/>
      <circle cx="12" cy="12" r="2.2" fill="${safeFg}"/>
    </svg>`
  }
  // bog / park / default
  return `<svg viewBox="0 0 24 24" class="map-pin__badge-glyph" aria-hidden="true">
    <path fill="${safeFg}" d="M12 2.2c-3.1 3.9-5.8 5.1-5.8 8.7a4.3 4.3 0 0 0 4.3 4.3c.9 0 1.6-.2 2.3-.65.75 1.25 2.05 2.15 3.65 2.15 2.35 0 4.25-1.95 4.25-4.35 0-3.6-2.7-4.75-6-8.55z"/>
    <path fill="${safeFg}" d="M10.8 15.4h2.4v6.2h-2.4z"/>
  </svg>`
}

function cemeteryPinIcon() {
  const { color } = PIN_BADGE.qabriston
  const inner = '<img src="/icons/church.png" alt="" class="map-pin__badge-img" draggable="false" />'
  return badgePinIcon(color, inner, 'map-pin--cemetery')
}

function recreationPinIcon(roadClass) {
  const kind = ['park', 'xiyobon', 'square'].includes(roadClass) ? roadClass : 'park'
  const palette = PIN_BADGE[kind] || PIN_BADGE.park
  const glyph = pinGlyphSvg(kind, palette.accent)
  return badgePinIcon(palette.color, glyph, `map-pin--${kind}`)
}

function categoryPinIcon(color, code, roadClass = '') {
  if (code === 'qabriston') return cemeteryPinIcon()
  if (code === 'istirohat' || code === 'park') return recreationPinIcon(roadClass)

  const safe = String(color || '#3388ff').replace(/[^#a-zA-Z0-9]/g, '')
  return L.divIcon({
    className: 'map-pin',
    html: `<span class="map-pin__dot" style="--pin:${safe}">•</span>`,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -28],
  })
}

function pinIcon(color, code, roadClass = '') {
  return categoryPinIcon(color, code, roadClass)
}

const REC_TYPE_LABELS = {
  uz: { park: "Bog'", xiyobon: 'Xiyobon', square: 'Maydon' },
  ru: { park: 'Парк', xiyobon: 'Бульвар', square: 'Площадь' },
  en: { park: 'Park', xiyobon: 'Boulevard', square: 'Square' },
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
  // Bir xil code (turli yillar) bo'lsa — faqat bitta (eng yangi yoki monitoring_year max)
  const deduped = []
  const seen = new Set()
  ;[...visibleFeatures]
    .sort((a, b) => Number(b.properties?.monitoring_year || 0) - Number(a.properties?.monitoring_year || 0))
    .forEach((f) => {
      const code = f.properties?.code || f.id
      if (seen.has(code)) return
      seen.add(code)
      deduped.push(f)
    })
  if (!deduped.length) return null

  const group = createOverlayGroup(map)
  const layer = L.geoJSON(
    { type: 'FeatureCollection', features: deduped },
    {
      style: (feature) => {
        const p = feature.properties || {}
        const isCity = p.boundary_type === 'city'
        return {
          color: p.color || (isCity ? '#ff6b00' : '#e74c3c'),
          weight: p.weight || (isCity ? 4 : 3),
          fillColor: p.color || '#ff6b00',
          fill: !isCity,
          fillOpacity: isCity ? 0 : Math.min(Number(p.fill_opacity) || 0.08, 0.2),
          dashArray: p.dash_array || null,
          opacity: 1,
          interactive: false,
          className: isCity ? 'map-boundary-layer map-boundary-layer--city' : 'map-boundary-layer',
        }
      },
      onEachFeature: (feature, lyr) => {
        const p = feature.properties || {}
        const label = loc(p, 'name', lang) || POP[lang]?.bound || POP.uz.bound
        const year = p.monitoring_year ? ` · ${p.monitoring_year}` : ''
        lyr.bindPopup(`<strong>${esc(label)}${esc(year)}</strong>`)
        lyr.bringToBack?.()
      },
    },
  )
  group.addLayer(layer)
  boundaryRef.current = group

  if (fitToBoundary && fitOnceRef && !fitOnceRef.current) {
    const city = deduped.find((f) => f.properties?.boundary_type === 'city')
      || deduped[0]
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

const MFY_COLOR = '#ea580c'
const MFY_STROKE = '#f97316'

function mfyLineWeight(zoom, active) {
  const z = zoom || 13
  let w = 2.4
  if (z <= 11) w = 1.8
  else if (z <= 12) w = 2.1
  else if (z <= 14) w = 2.6
  else w = 3.1
  return active ? w + 1.2 : w
}

function mfyLabelVisible(zoom) {
  return (zoom || 13) >= 12
}

function mfyPointRadius(zoom, active) {
  const z = zoom || 13
  let r = 4
  if (z <= 11) r = 3
  else if (z >= 15) r = 5
  return active ? r + 1.5 : r
}

function featureCentroid(feature) {
  const c = feature?.properties?.centroid
  if (Array.isArray(c) && c.length >= 2) {
    return L.latLng(c[1], c[0])
  }
  return featureCenter(feature)
}

/**
 * MFY (mahalla) — polygon chiziq, markaz nuqta va nom (kadastr xaritasi uslubi).
 */
export function drawMahallaLayers({
  map,
  mahallaRef,
  collection,
  visible = true,
  showAreas = true,
  showPoints = true,
  lang = 'uz',
  highlightName = '',
  heatByName = null,
}) {
  clearLayer(map, mahallaRef)
  if (!map || !visible || !collection?.features?.length) return null
  if (!showAreas && !showPoints) return null

  const heatOn = heatByName && typeof heatByName === 'object'
  const areaFeatures = collection.features.filter((f) => {
    const kind = f.properties?.kind
    if (kind === 'point') return false
    if (kind === 'area') return true
    return isPolyGeom(f.geometry?.type)
  })
  const pointFeatures = collection.features.filter((f) => {
    const kind = f.properties?.kind
    if (kind === 'point') return true
    return f.geometry?.type === 'Point'
  })
  if (!areaFeatures.length && !pointFeatures.length) return null

  const group = createOverlayGroup(map)
  const ensurePane = (name, z) => {
    if (!map.getPane(name)) map.createPane(name)
    map.getPane(name).style.zIndex = String(z)
  }
  // overlayPane=400; basemap labels~450 — MFY ular ustida bo'lsin
  ensurePane('mahalla', 520)
  ensurePane('mahalla-points', 525)
  ensurePane('mahalla-labels', 530)
  map.getPane('mahalla-labels').style.pointerEvents = 'none'

  const hl = (highlightName || '').trim().toLowerCase()
  const pointLayers = []
  const labelLayers = []
  let polyLayer = null

  const heatFill = (name) => {
    if (!heatOn) return null
    const key = (name || '').toLowerCase()
    const t = heatByName[key]
    // 0 = kam (sariq), 1 = ko'p / eng zich (qizil)
    const x = t == null ? 0 : Math.max(0, Math.min(1, Number(t) || 0))
    const r = 255
    const g = Math.round(235 - x * 210)
    const b = Math.round(70 - x * 65)
    return {
      color: x > 0.55 ? '#7f1d1d' : '#b45309',
      fillColor: `rgb(${r},${Math.max(18, g)},${Math.max(0, b)})`,
      fillOpacity: 0.28 + x * 0.52,
      weight: 2 + x * 1.4,
    }
  }

  if (showAreas && areaFeatures.length) {
    polyLayer = L.geoJSON(
      { type: 'FeatureCollection', features: areaFeatures },
      {
        pane: 'mahalla',
        style: (feature) => {
          const name = (feature.properties?.name || '')
          const active = hl && name.toLowerCase() === hl
          const heat = heatFill(name)
          if (heat) {
            return {
              ...heat,
              opacity: active ? 1 : 0.95,
              fill: true,
              interactive: true,
              className: 'map-mfy-layer map-mfy-layer--heat',
            }
          }
          return {
            color: MFY_STROKE,
            weight: mfyLineWeight(map.getZoom(), active),
            fill: false,
            fillOpacity: 0,
            opacity: active ? 1 : 0.95,
            interactive: true,
            className: 'map-mfy-layer',
          }
        },
        onEachFeature: (feature, lyr) => {
          const p = feature.properties || {}
          const label = loc(p, 'name', lang) || p.name || ''
          const heat = heatOn ? heatByName[(p.name || '').toLowerCase()] : null
          const heatTxt = heat != null ? `<br/>Zichlik: ${Math.round(Number(heat) * 100)}%` : ''
          lyr.bindPopup(`<strong>${esc(label)}</strong><br/>MFY${heatTxt}`)
          if (!heatOn) lyr.bringToBack?.()
          else lyr.bringToFront?.()
        },
      },
    )
    group.addLayer(polyLayer)
  }

  if (showPoints) {
    const markerFeatures = pointFeatures.length
      ? pointFeatures
      : areaFeatures.map((f) => {
        const center = featureCentroid(f)
        if (!center) return null
        return {
          ...f,
          geometry: { type: 'Point', coordinates: [center.lng, center.lat] },
        }
      }).filter(Boolean)

    markerFeatures.forEach((feature) => {
      const p = feature.properties || {}
      const label = loc(p, 'name', lang) || p.name || ''
      const center = featureCentroid(feature)
      if (!center) return

      const name = (p.name || '').toLowerCase()
      const active = hl && name === hl

      const point = L.circleMarker(center, {
        pane: 'mahalla-points',
        radius: mfyPointRadius(map.getZoom(), active),
        color: '#ffffff',
        weight: active ? 2.5 : 1.8,
        fillColor: MFY_COLOR,
        fillOpacity: 1,
        opacity: 1,
        interactive: true,
        className: 'map-mfy-point',
      })
      point.feature = feature
      point._mfyActive = active
      point.bindPopup(`<strong>${esc(label)}</strong><br/>MFY`)
      point.addTo(group)
      pointLayers.push(point)
    })
  }

  if (showAreas || showPoints) {
    const labelFeatures = areaFeatures.length ? areaFeatures : pointFeatures
    labelFeatures.forEach((feature) => {
      const p = feature.properties || {}
      const label = loc(p, 'name', lang) || p.name || ''
      const center = featureCentroid(feature)
      if (!label || !center) return
      const tip = L.tooltip({
        permanent: true,
        direction: 'center',
        offset: showPoints ? [0, -12] : [0, 0],
        className: 'map-mfy-label',
        opacity: 1,
        pane: 'mahalla-labels',
      })
        .setContent(esc(label))
        .setLatLng(center)
        .addTo(group)
      labelLayers.push(tip)
    })
  }

  const repaint = () => {
    const z = map.getZoom()
    const showLabels = mfyLabelVisible(z)
    if (polyLayer && !heatOn) {
      polyLayer.eachLayer((lyr) => {
        const name = (lyr.feature?.properties?.name || '').toLowerCase()
        const active = hl && name === hl
        lyr.setStyle({
          color: MFY_STROKE,
          weight: mfyLineWeight(z, active),
          fill: false,
          fillOpacity: 0,
          opacity: active ? 1 : 0.92,
        })
      })
    }
    pointLayers.forEach((pt) => {
      pt.setRadius(mfyPointRadius(z, pt._mfyActive))
    })
    labelLayers.forEach((tip) => {
      const el = tip.getElement?.()
      if (el) el.style.display = showLabels ? '' : 'none'
    })
  }

  repaint()
  map.on('zoomend', repaint)
  group.on('remove', () => { map.off('zoomend', repaint) })

  mahallaRef.current = group
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
  fitOnceRef = null,
  hidePins = false,
  onlyIds = null,
}) {
  // Caller clears via clearLayerGroup; we rebuild into layersRef
  if (!map || !collection?.features?.length) return

  const byCategory = {}
  collection.features.forEach((feature) => {
    const code = feature.properties?.category_code
    if (!code) return
    if (code === 'yollar') {
      if (!isYollarFeatureVisible(feature, visibleLayers)) return
    } else if (code === 'suv') {
      if (!isSuvFeatureVisible(feature, visibleLayers)) return
    } else if (code === 'istirohat' || code === 'park') {
      if (!isIstirohatFeatureVisible(feature, visibleLayers)) return
    } else if (visibleLayers[code] === false) return
    const isLine = code === 'yollar' || code === 'suv'
    if (onlyIds && !isLine) return
    if (!byCategory[code]) byCategory[code] = []
    byCategory[code].push(feature)
  })

  Object.entries(byCategory).forEach(([code, features]) => {
    const color = features[0]?.properties?.category_color || '#3388ff'
    const group = L.featureGroup()
    const lineLayer = code === 'yollar' || code === 'suv' || features.every((f) => isLineGeom(f.geometry?.type))
    const pinThese = !hidePins && !lineLayer && (
      features.length <= 120 || features.some((f) => isPolyGeom(f.geometry?.type) || f.geometry?.type === 'Point')
    )
    const drawn = features.map((f) => asDrawnFeature(f, code))
    const geoFeatures = pinThese
      ? drawn.filter((f) => f.geometry?.type !== 'Point')
      : drawn
    const layer = L.geoJSON(
      { type: 'FeatureCollection', features: geoFeatures },
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
          const polyBoost = code === 'qabriston'
            ? 0.38
            : code === 'istirohat' || code === 'park'
              ? 0.45
              : FILL_OPACITY.polygon
          const road = feature.properties?.road_class
          const z = map.getZoom()
          let weight = 2
          if (isLine) {
            if (code === 'yollar') {
              weight = roadWeightForZoom(z, road)
              if (isSelected) weight += 1.2
            } else if (code === 'suv') {
              weight = road === 'kanal' ? (z <= 13 ? 2.2 : 3.2) : (z <= 13 ? 1.2 : 2)
              if (isSelected) weight += 1.2
            } else {
              weight = z <= 13 ? 1.4 : 2.4
              if (isSelected) weight += 1.2
            }
          } else {
            weight = isSelected
              ? 3
              : (code === 'qabriston'
                ? 2.5
                : (code === 'istirohat' || code === 'park')
                  ? 2.8
                  : 2)
          }
          const hideRoad = code === 'yollar' && !roadVisibleAtZoom(z, road)
          const lineColor = code === 'yollar'
            ? roadClassColor(road, color)
            : code === 'suv'
              ? waterClassColor(road, color)
              : (code === 'istirohat' || code === 'park')
                ? parkClassColor(road, color)
                : color
          const strokeColor = isSelected ? '#ffffff' : (code === 'qabriston' ? '#475569' : lineColor)
          const fillCol = code === 'qabriston'
            ? '#94a3b8'
            : (code === 'istirohat' || code === 'park')
              ? parkClassColor(road, color)
              : color
          return {
            color: strokeColor,
            weight: hideRoad ? 0 : weight,
            fillColor: fillCol,
            fill: !isLine,
            fillOpacity: isLine ? 0 : (isSelected ? FILL_OPACITY.selected : polyBoost),
            opacity: hideRoad ? 0 : (isLine ? 0.92 : 1),
            lineCap: isLine ? 'butt' : 'round',
            lineJoin: 'round',
            smoothFactor: 1,
            noClip: true,
            dashArray: code === 'yollar' && road === 'piyoda'
              ? '6 8'
              : code === 'suv' && road === 'ariq'
                ? '4 5'
                : undefined,
            className: code === 'qabriston'
              ? 'map-feature-layer map-feature-layer--cemetery'
              : code === 'yollar'
                ? `map-feature-layer map-road-layer map-road-layer--${road || 'other'}`
                : code === 'suv'
                  ? `map-feature-layer map-water-layer map-water-layer--${road || 'other'}`
                  : 'map-feature-layer',
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
          const roadLbl = p.road_class
            ? ((ROAD_LABELS[lang] || ROAD_LABELS.uz)[p.road_class] || p.road_class)
            : ''
          lyr.bindPopup(`
            <div class="map-popup">
              <h4>${esc(name)}</h4>
              <p><b>${LBL.cat}:</b> ${esc(cat)}</p>
              ${roadLbl ? `<p><b>${LBL.road}:</b> ${esc(roadLbl)}</p>` : ''}
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

    if (pinThese) {
      const LBL = POP[lang] || POP.uz
      groupPinFeatures(features).forEach(({ center, items }) => {
        const f = items[0]
        const p = f.properties || {}
        const name = loc(p, 'name', lang) || p.public_id || '—'
        const recClass = p.road_class || ''
        const pinColor = (code === 'istirohat' || code === 'park')
          ? parkClassColor(recClass, color)
          : color
        const typeLbl = (REC_TYPE_LABELS[lang] || REC_TYPE_LABELS.uz)[recClass] || ''
        const pin = L.marker(center, {
          icon: pinIcon(pinColor, code, recClass),
          riseOnHover: true,
          zIndexOffset: code === 'qabriston' ? 900 : (recClass === 'square' ? 750 : recClass === 'xiyobon' ? 700 : 650),
        })
        const tooltipLines = items.length > 1
          ? [
            `<strong>${items.length} ${LBL.obj}</strong>`,
            ...items.map((item) => {
              const ip = item.properties || {}
              const iname = loc(ip, 'name', lang) || ip.public_id || '—'
              const itype = (REC_TYPE_LABELS[lang] || REC_TYPE_LABELS.uz)[ip.road_class || ''] || ''
              return esc(iname) + (itype ? ` <span>(${esc(itype)})</span>` : '')
            }),
          ]
          : [
            `<strong>${esc(name)}</strong>`,
            ...(typeLbl ? [`<span>${esc(typeLbl)}</span>`] : []),
            ...(p.area_ha != null ? [`${p.area_ha} ga`] : []),
          ]
        pin.bindTooltip(tooltipLines.join('<br/>'), {
          direction: 'top',
          sticky: true,
          className: 'map-pin-tip',
        })
        pin.on('click', () => onSelect?.(p))
        pin.addTo(group)
      })
    }

    group.addTo(map)
    layersRef.current[code] = group
  })

  if (fitToFeatures && !(fitOnceRef?.current)) {
    const all = Object.values(layersRef.current).filter(Boolean)
    if (all.length) {
      const united = L.featureGroup(all)
      const b = united.getBounds()
      if (b.isValid() && boundsLookLocal(b)) {
        map.fitBounds(b, { padding: [48, 48], maxZoom: 19 })
      } else {
        map.setView([39.773, 64.440], 13)
      }
    }
    if (fitOnceRef) fitOnceRef.current = true
  }
}
