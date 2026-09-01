/** Urbanizatsiya split xarita — default zoom/ko‘rinish. */
export const URBAN_COMPARE_FIT = {
  padding: [48, 48],
  maxZoom: 12,
}

export function fitUrbanCompareBounds(map, bounds) {
  if (!map || !bounds) return
  map.fitBounds(bounds, URBAN_COMPARE_FIT)
  window.setTimeout(() => {
    map.invalidateSize()
    map.fitBounds(bounds, URBAN_COMPARE_FIT)
  }, 120)
}
