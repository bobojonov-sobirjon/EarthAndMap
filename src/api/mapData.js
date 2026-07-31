import client from './client'

/**
 * Backenddan xarita uchun dinamik ma'lumotlar:
 * - chegaralar (GeoJSON FeatureCollection)
 * - obyektlar / markerlar (GeoJSON FeatureCollection)
 * - map-config (markaz, kategoriyalar)
 */
export async function fetchMapBoundaries(params = {}) {
  const { data } = await client.get('/boundaries/geojson/', { params })
  return normalizeFeatureCollection(data)
}

export async function fetchMapFeatures(params = {}) {
  const { data } = await client.get('/lands/geojson/', { params })
  return normalizeFeatureCollection(data)
}

export async function fetchMapConfig() {
  const { data } = await client.get('/map-config/')
  return data
}

/**
 * Bitta so'rovda barcha xarita ma'lumotlarini olish.
 * Natija fingerprint bilan — pollingda o'zgarishni aniqlash uchun.
 */
export async function fetchMapSnapshot(params = {}) {
  const [boundaries, features, config] = await Promise.all([
    fetchMapBoundaries(),
    fetchMapFeatures(params),
    fetchMapConfig(),
  ])

  const markers = {
    type: 'FeatureCollection',
    features: features.features.filter((f) => isPointGeometry(f.geometry)),
  }

  const polygonsAndLines = {
    type: 'FeatureCollection',
    features: features.features.filter((f) => !isPointGeometry(f.geometry)),
  }

  const fingerprint = buildFingerprint(boundaries, features)

  return {
    boundaries,
    features,
    markers,
    polygonsAndLines,
    config,
    fingerprint,
    fetchedAt: Date.now(),
  }
}

function isPointGeometry(geometry) {
  if (!geometry) return false
  return geometry.type === 'Point' || geometry.type === 'MultiPoint'
}

function normalizeFeatureCollection(data) {
  if (!data) return { type: 'FeatureCollection', features: [] }
  if (data.type === 'FeatureCollection' && Array.isArray(data.features)) {
    return data
  }
  if (Array.isArray(data)) {
    return { type: 'FeatureCollection', features: data }
  }
  return { type: 'FeatureCollection', features: [] }
}

/** O'zgarishni arzon aniqlash (to'liq JSON solishtirmasdan). */
export function buildFingerprint(boundaries, features) {
  const bCount = boundaries?.features?.length ?? 0
  const fCount = features?.features?.length ?? 0
  const bIds = (boundaries?.features || []).map((f) => f.id ?? f.properties?.id).join(',')
  const sample = (features?.features || [])
    .slice(0, 5)
    .concat((features?.features || []).slice(-5))
    .map((f) => `${f.id ?? f.properties?.id}:${f.properties?.updated_at || ''}`)
    .join('|')
  return `b${bCount}:${bIds}|f${fCount}:${sample}`
}
