/** WGS84 haversine, metr. */
export function haversineMeters(a, b) {
  const R = 6371000
  const p1 = (a.lat * Math.PI) / 180
  const p2 = (b.lat * Math.PI) / 180
  const dp = ((b.lat - a.lat) * Math.PI) / 180
  const dl = ((b.lng - a.lng) * Math.PI) / 180
  const x = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)))
}

function flattenCoords(node, out = []) {
  if (!Array.isArray(node) || node.length === 0) return out
  if (typeof node[0] === 'number' && typeof node[1] === 'number') {
    out.push(node)
    return out
  }
  node.forEach((n) => flattenCoords(n, out))
  return out
}

export function featureLatLng(feature) {
  const g = feature?.geometry
  if (!g?.coordinates) return null
  if (g.type === 'Point') {
    return { lat: g.coordinates[1], lng: g.coordinates[0] }
  }
  const pts = flattenCoords(g.coordinates)
  if (!pts.length) return null
  let lat = 0
  let lng = 0
  pts.forEach((p) => {
    lng += p[0]
    lat += p[1]
  })
  return { lat: lat / pts.length, lng: lng / pts.length }
}

export function fmtKm(meters) {
  if (meters == null || !Number.isFinite(meters)) return '—'
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`
}

export function fmtDriveTime(seconds) {
  if (seconds == null || !Number.isFinite(seconds)) return '—'
  const s = Math.max(60, Math.round(seconds))
  if (s < 3600) return `${Math.round(s / 60)} min`
  const h = Math.floor(s / 3600)
  const m = Math.round((s % 3600) / 60)
  return m ? `${h} h ${m} min` : `${h} h`
}

const OSRM_BASE = 'https://router.project-osrm.org/route/v1'

/** Piyoda, mashina, avtobus, velosiped, elektr samokat. */
export const TRAVEL_MODES = [
  { id: 'driving', osrm: 'driving', scale: 1, speedKmh: 35, color: '#2563eb' },
  { id: 'bus', osrm: 'driving', scale: 1.9, speedKmh: 18, color: '#7c3aed' },
  { id: 'walking', osrm: 'walking', scale: 1, speedKmh: 5, color: '#0d9488' },
  { id: 'cycling', osrm: 'cycling', scale: 1, speedKmh: 16, color: '#ea580c' },
  { id: 'scooter', osrm: 'cycling', scale: 0.72, speedKmh: 22, color: '#db2777' },
]

export function travelModeById(id) {
  return TRAVEL_MODES.find((m) => m.id === id) || TRAVEL_MODES[0]
}

export async function osrmRoute(from, to, modeId = 'driving') {
  const mode = travelModeById(modeId)
  const url = `${OSRM_BASE}/${mode.osrm}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('osrm')
    const data = await res.json()
    const route = data?.routes?.[0]
    if (!route?.geometry?.coordinates?.length) throw new Error('empty')
    const distance = route.distance
    let duration = Math.max(60, route.duration * mode.scale)
    const bySpeed = (distance / 1000 / mode.speedKmh) * 3600
    if (mode.id === 'walking' || mode.id === 'bus' || mode.id === 'cycling' || mode.id === 'scooter') {
      duration = Math.max(duration, bySpeed)
    }
    return {
      distance,
      duration,
      coordinates: route.geometry.coordinates,
      fallback: false,
      mode: mode.id,
      color: mode.color,
    }
  } catch {
    const straight = haversineMeters(from, to)
    return {
      distance: straight,
      duration: Math.max(60, (straight / 1000 / mode.speedKmh) * 3600),
      coordinates: [
        [from.lng, from.lat],
        [to.lng, to.lat],
      ],
      fallback: true,
      mode: mode.id,
      color: mode.color,
    }
  }
}

/** Mashina marshruti (eski chaqiriqlar uchun). */
export function drivingRoute(from, to) {
  return osrmRoute(from, to, 'driving')
}

/** GPS nuqtadan o‘qiladigan manzil. */
export async function reverseAddress(lat, lng, lang = 'uz') {
  const loc = lang === 'ru' ? 'ru' : lang === 'en' ? 'en' : 'uz'
  const fallback = lang === 'ru' ? 'Бухара, Узбекистан' : lang === 'en' ? 'Bukhara, Uzbekistan' : 'Buxoro, O‘zbekiston'

  try {
    const api = `/api/geocode/reverse/?lat=${lat}&lng=${lng}&lang=${loc}`
    const res = await fetch(api)
    if (res.ok) {
      const data = await res.json()
      if (data?.label) return data.label
    }
  } catch { /* ignore */ }

  try {
    const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=${loc === 'uz' ? 'en' : loc}`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      const p = data?.features?.[0]?.properties || {}
      const parts = [p.name || p.street, p.district || p.locality, p.city || p.county || p.state].filter(Boolean)
      const uniq = [...new Set(parts)]
      if (uniq.length) return uniq.join(', ')
    }
  } catch { /* ignore */ }

  return fallback
}
