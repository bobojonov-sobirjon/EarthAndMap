/** Nuqtalar orasidagi masofa (m) — WGS84 taxminiy. */
function segmentMeters(lat1, lng1, lat2, lng2) {
  const latRad = ((lat1 + lat2) / 2) * (Math.PI / 180)
  const dx = (lng2 - lng1) * 111320 * Math.cos(latRad)
  const dy = (lat2 - lat1) * 111320
  return Math.sqrt(dx * dx + dy * dy)
}

/** Yopiq poligon perimetri (m). */
export function polygonPerimeterM(points) {
  if (!points || points.length < 2) return 0
  let total = 0
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    total += segmentMeters(a.lat, a.lng, b.lat, b.lng)
  }
  return total
}

/** Yopiq poligon maydoni (m²) — shoelace + WGS84. */
export function polygonAreaSqm(points) {
  if (!points || points.length < 3) return 0
  const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length
  const latRad = (avgLat * Math.PI) / 180
  const mLng = 111320 * Math.cos(latRad)
  const mLat = 111320

  let area = 0
  const n = points.length
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n
    const x1 = points[i].lng * mLng
    const y1 = points[i].lat * mLat
    const x2 = points[j].lng * mLng
    const y2 = points[j].lat * mLat
    area += x1 * y2 - x2 * y1
  }
  return Math.abs(area) / 2
}

/** Ochiq chiziq uzunligi (m). */
export function polylineLengthM(points) {
  if (!points || points.length < 2) return 0
  let total = 0
  for (let i = 1; i < points.length; i += 1) {
    total += segmentMeters(
      points[i - 1].lat, points[i - 1].lng,
      points[i].lat, points[i].lng,
    )
  }
  return total
}

export function fmtLength(m) {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`
  return `${Math.round(m)} m`
}

export function fmtArea(sqm) {
  if (sqm >= 10000) return `${(sqm / 10000).toFixed(2)} ga`
  if (sqm >= 1) return `${Math.round(sqm)} m²`
  return `${sqm.toFixed(1)} m²`
}

/** Nuqtalar yopiq poligon bo'ladimi (birinchi nuqtaga yaqin). */
export function nearFirstPoint(map, points, latlng, px = 14) {
  if (!map || points.length < 3) return false
  const first = points[0]
  return map.latLngToContainerPoint(first).distanceTo(map.latLngToContainerPoint(latlng)) <= px
}
