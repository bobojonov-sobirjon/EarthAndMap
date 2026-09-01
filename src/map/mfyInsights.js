/** MFY tahlil, heatmap va yillar bo'yicha demo-filtr. */

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
  // rough deg² → m² at ~39.7°N
  const m2 = sum * 111320 * 111320 * Math.cos((39.77 * Math.PI) / 180)
  return m2 / 10000
}

export function hashUnit(id) {
  const n = Number(id) || String(id || '').split('').reduce((s, ch) => s + ch.charCodeAt(0), 0)
  return ((n * 2654435761) >>> 0) / 4294967295
}

/** ObjectVersion yo'q bo'lsa — yil bo'yicha deterministic "o'sish" namoyishi. */
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

/**
 * MFY bo'yicha obyektlar statistikasi (heatmap + passport).
 */
export function buildMfyInsightIndex(features = [], mahallaCollection) {
  const areas = (mahallaCollection?.features || []).filter((f) => f.properties?.kind !== 'point')
  const byName = new Map()
  areas.forEach((f) => {
    const name = (f.properties?.name || '').trim()
    if (!name) return
    byName.set(name.toLowerCase(), {
      name,
      feature: f,
      areaHa: polygonAreaHa(f.geometry),
      total: 0,
      parks: 0,
      cemeteries: 0,
      roadKm: 0,
      canalKm: 0,
      waterKm: 0,
    })
  })

  const list = features || []
  list.forEach((f) => {
    const p = f.properties || {}
    const code = catKey(p.category_code)
    let row = null
    const mName = (p.mahalla || '').trim().toLowerCase()
    if (mName && byName.has(mName)) row = byName.get(mName)
    if (!row) {
      const c = featureCentroidLngLat(f)
      if (c) {
        for (const r of byName.values()) {
          if (pointInGeom(r.feature.geometry, c.lng, c.lat)) {
            row = r
            break
          }
        }
      }
    }
    if (!row) return
    row.total += 1
    const lenKm = Number(p.length_km) || (Number(p.length_m) ? Number(p.length_m) / 1000 : 0)
    if (code === 'istirohat') row.parks += 1
    else if (code === 'qabriston') row.cemeteries += 1
    else if (code === 'yollar') row.roadKm += lenKm
    else if (code === 'suv') {
      row.canalKm += lenKm
      row.waterKm += lenKm
    }
  })

  const rows = [...byName.values()].map((r) => ({
    ...r,
    roadKm: Math.round(r.roadKm * 1000) / 1000,
    canalKm: Math.round(r.canalKm * 1000) / 1000,
    waterKm: Math.round(r.waterKm * 1000) / 1000,
    areaHa: Math.round(r.areaHa * 100) / 100,
    density: r.areaHa > 0.01 ? r.total / r.areaHa : r.total,
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
  // yellow → orange → red
  const r = Math.round(255)
  const g = Math.round(220 - x * 180)
  const b = Math.round(40 - x * 40)
  return `rgb(${r},${g},${Math.max(0, b)})`
}
