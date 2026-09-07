/** MFY tahlil, heatmap, spatial filter va pasport statistikasi. */

export const YEAR_SCALE = {
  2010: 0.62,
  2012: 0.68,
  2014: 0.72,
  2016: 0.75,
  2018: 0.78,
  2020: 0.85,
  2022: 0.91,
  2024: 0.96,
  2025: 0.98,
  2026: 1,
}

export const TIMELINE_YEARS = [2018, 2020, 2022, 2024, 2026]

export const DEFAULT_MONITORING_YEAR = 2026

/** Tor ko‘chalar / mahalliy (III + piyoda). */
const ROAD_NARROW = new Set(['mahalliy', 'piyoda'])

function ringContains(ring, lng, lat) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    const intersect = ((yi > lat) !== (yj > lat))
      && (lng < ((xj - xi) * (lat - yi)) / ((yj - yi) || 1e-12) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

export function pointInGeom(geom, lng, lat) {
  if (!geom) return false
  const t = geom.type
  if (t === 'Polygon') {
    const rings = geom.coordinates || []
    if (!rings[0] || !ringContains(rings[0], lng, lat)) return false
    for (let i = 1; i < rings.length; i++) {
      if (ringContains(rings[i], lng, lat)) return false
    }
    return true
  }
  if (t === 'MultiPolygon') {
    return (geom.coordinates || []).some((poly) => {
      if (!poly?.[0] || !ringContains(poly[0], lng, lat)) return false
      for (let i = 1; i < poly.length; i++) {
        if (ringContains(poly[i], lng, lat)) return false
      }
      return true
    })
  }
  return false
}

export function featureCentroidLngLat(feature) {
  const g = feature?.geometry
  if (!g) return null
  if (g.type === 'Point') {
    const [lng, lat] = g.coordinates || []
    return Number.isFinite(lng) && Number.isFinite(lat) ? { lng, lat } : null
  }
  const pts = []
  const walk = (c) => {
    if (!c) return
    if (typeof c[0] === 'number') {
      pts.push(c)
      return
    }
    c.forEach(walk)
  }
  walk(g.coordinates)
  if (!pts.length) return null
  let sx = 0
  let sy = 0
  pts.forEach(([x, y]) => { sx += x; sy += y })
  return { lng: sx / pts.length, lat: sy / pts.length }
}

function polygonAreaHa(geom) {
  if (!geom) return 0
  const rings = geom.type === 'Polygon'
    ? [geom.coordinates?.[0]].filter(Boolean)
    : (geom.coordinates || []).map((p) => p?.[0]).filter(Boolean)
  let sum = 0
  rings.forEach((ring) => {
    if (!ring || ring.length < 3) return
    let a = 0
    for (let i = 0; i < ring.length - 1; i++) {
      a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1]
    }
    sum += Math.abs(a) / 2
  })
  const m2 = sum * 111320 * 111320 * Math.cos((39.77 * Math.PI) / 180)
  return m2 / 10000
}

function featureAreaHa(feature) {
  const p = feature?.properties || {}
  const fromProp = Number(p.area_ha)
  if (Number.isFinite(fromProp) && fromProp > 0) return fromProp
  const sqm = Number(p.area_sqm)
  if (Number.isFinite(sqm) && sqm > 0) return sqm / 10000
  if (feature?.geometry?.type === 'Polygon' || feature?.geometry?.type === 'MultiPolygon') {
    return polygonAreaHa(feature.geometry)
  }
  return 0
}

function featureLengthKm(feature) {
  const p = feature?.properties || {}
  const km = Number(p.length_km)
  if (Number.isFinite(km) && km > 0) return km
  const m = Number(p.length_m)
  if (Number.isFinite(m) && m > 0) return m / 1000
  return 0
}

function emptyRow(name, feature) {
  return {
    name,
    feature,
    areaHa: polygonAreaHa(feature?.geometry),
    total: 0,
    parks: 0,
    cemeteries: 0,
    other: 0,
    roadKm: 0,
    streetKm: 0,
    ariqKm: 0,
    kanalKm: 0,
    canalKm: 0,
    waterKm: 0,
    cemeteryList: [],
    parkList: [],
    otherList: [],
    roadList: [],
    streetList: [],
    ariqList: [],
    kanalList: [],
  }
}

function itemFromFeature(feature) {
  const p = feature?.properties || {}
  return {
    id: p.id ?? feature?.id,
    public_id: p.public_id || '',
    name: p.name || p.public_id || '—',
    areaHa: Math.round(featureAreaHa(feature) * 100) / 100,
    lengthKm: Math.round(featureLengthKm(feature) * 1000) / 1000,
    road_class: p.road_class || '',
    feature,
  }
}

export function hashUnit(id) {
  const n = Number(id) || String(id || '').split('').reduce((s, ch) => s + ch.charCodeAt(0), 0)
  return ((n * 2654435761) >>> 0) / 4294967295
}

export function featureVisibleInYear(feature, year) {
  if (!year) return true
  const y = Number(year)
  const scale = YEAR_SCALE[y] ?? (y >= 2026 ? 1 : Math.min(1, 0.55 + (y - 2010) * 0.028))
  const id = feature?.id ?? feature?.properties?.id ?? feature?.properties?.public_id
  return hashUnit(id) <= scale
}

export function filterFeaturesByYear(collection, year) {
  if (!collection?.features || !year) return collection
  return {
    ...collection,
    features: collection.features.filter((f) => featureVisibleInYear(f, year)),
  }
}

function catKey(code) {
  if (code === 'park') return 'istirohat'
  return code || ''
}

function findMfyRow(byName, feature) {
  const p = feature?.properties || {}
  const mName = (p.mahalla || '').trim().toLowerCase()
  if (mName && byName.has(mName)) return byName.get(mName)
  const c = featureCentroidLngLat(feature)
  if (!c) return null
  for (const r of byName.values()) {
    if (pointInGeom(r.feature.geometry, c.lng, c.lat)) return r
  }
  return null
}

/** Obyekt tanlangan MFY ichidami (atribut yoki centroid PIP). */
export function featureBelongsToMfy(feature, mfyRowOrGeom, mfyName = '') {
  if (!feature) return false
  const want = String(mfyName || mfyRowOrGeom?.name || '').trim().toLowerCase()
  const mAttr = (feature.properties?.mahalla || '').trim().toLowerCase()
  if (want && mAttr && mAttr === want) return true

  const geom = mfyRowOrGeom?.feature?.geometry || mfyRowOrGeom?.geometry || mfyRowOrGeom
  if (!geom || !geom.type) return Boolean(want && mAttr && mAttr === want)

  const c = featureCentroidLngLat(feature)
  if (!c) return false
  return pointInGeom(geom, c.lng, c.lat)
}

/**
 * MFY bo'yicha obyektlar statistikasi (heatmap + tahlil paneli).
 */
export function buildMfyInsightIndex(features = [], mahallaCollection) {
  const areas = (mahallaCollection?.features || []).filter((f) => f.properties?.kind !== 'point')
  const byName = new Map()
  areas.forEach((f) => {
    const name = (f.properties?.name || '').trim()
    if (!name) return
    byName.set(name.toLowerCase(), emptyRow(name, f))
  })

  ;(features || []).forEach((f) => {
    const p = f.properties || {}
    const code = catKey(p.category_code)
    const row = findMfyRow(byName, f)
    if (!row) return

    row.total += 1
    const lenKm = featureLengthKm(f)
    const item = itemFromFeature(f)
    const cls = (p.road_class || '').toLowerCase()

    if (code === 'istirohat') {
      row.parks += 1
      row.parkList.push(item)
      return
    }
    if (code === 'qabriston') {
      row.cemeteries += 1
      row.cemeteryList.push(item)
      return
    }
    if (code === 'yollar') {
      if (ROAD_NARROW.has(cls)) {
        row.streetKm += lenKm
        row.streetList.push(item)
      } else {
        row.roadKm += lenKm
        row.roadList.push(item)
      }
      return
    }
    if (code === 'suv') {
      if (cls === 'ariq') {
        row.ariqKm += lenKm
        row.ariqList.push(item)
      } else {
        row.kanalKm += lenKm
        row.kanalList.push(item)
      }
      row.canalKm += lenKm
      row.waterKm += lenKm
      return
    }
    row.other += 1
    row.otherList.push(item)
  })

  const round3 = (n) => Math.round(n * 1000) / 1000
  const rows = [...byName.values()].map((r) => ({
    ...r,
    roadKm: round3(r.roadKm),
    streetKm: round3(r.streetKm),
    ariqKm: round3(r.ariqKm),
    kanalKm: round3(r.kanalKm),
    canalKm: round3(r.canalKm),
    waterKm: round3(r.waterKm),
    areaHa: Math.round(r.areaHa * 100) / 100,
    density: r.areaHa > 0.01 ? r.total / r.areaHa : r.total,
    cemeteryList: r.cemeteryList.sort((a, b) => a.name.localeCompare(b.name, 'uz')),
    parkList: r.parkList.sort((a, b) => a.name.localeCompare(b.name, 'uz')),
    otherList: r.otherList.sort((a, b) => a.name.localeCompare(b.name, 'uz')),
  }))

  const maxTotal = Math.max(1, ...rows.map((r) => r.total))
  const maxDensity = Math.max(0.0001, ...rows.map((r) => r.density))
  rows.forEach((r) => {
    r.heat = Math.min(1, r.density / maxDensity)
    r.heatCount = Math.min(1, r.total / maxTotal)
  })

  return { byName, rows, maxTotal, maxDensity }
}

export function mfyPassport(insights, mahallaName) {
  if (!mahallaName || !insights) return null
  const row = insights.byName.get(String(mahallaName).trim().toLowerCase())
  return row || null
}

/** Heat fill color (low → high). */
export function heatColor(t) {
  const x = Math.max(0, Math.min(1, t))
  const r = Math.round(255)
  const g = Math.round(220 - x * 180)
  const b = Math.round(40 - x * 40)
  return `rgb(${r},${g},${Math.max(0, b)})`
}
