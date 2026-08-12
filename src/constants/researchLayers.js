/** Tadqiqot uchun asosiy 4 qatlam */

export const RESEARCH_CATEGORY_CODES = ['yollar', 'suv', 'istirohat', 'park', 'qabriston']

export const CATEGORY_DISPLAY_NAMES = {
  yollar: "Avtomobil yo'llari",
  suv: "Sug'orish tarmoqlari",
  istirohat: "Istirohat bog'lari va rekreatsion hududlar",
  park: "Istirohat bog'lari va rekreatsion hududlar",
  qabriston: 'Qabristonlar',
}

export const LAYER_GROUPS = [
  { key: 'yollar', codes: ['yollar'], name: "Avtomobil yo'llari", color: '#e67e22' },
  { key: 'suv', codes: ['suv'], name: "Sug'orish tarmoqlari", color: '#3498db' },
  { key: 'istirohat', codes: ['istirohat', 'park'], name: "Istirohat bog'lari va rekreatsion hududlar", color: '#27ae60' },
  { key: 'qabriston', codes: ['qabriston'], name: 'Qabristonlar', color: '#95a5a6' },
]

export const ROAD_CLASS_LABELS = {
  magistral: 'I darajali',
  shahar: 'II darajali',
  mahalliy: 'III darajali',
}

export function isResearchCategory(code) {
  return RESEARCH_CATEGORY_CODES.includes(code)
}

export function displayCategoryName(catOrCode) {
  if (!catOrCode) return ''
  if (typeof catOrCode === 'string') return CATEGORY_DISPLAY_NAMES[catOrCode] || catOrCode
  return CATEGORY_DISPLAY_NAMES[catOrCode.code] || catOrCode.name_uz || catOrCode.name || ''
}

/** Layer panel uchun 4 ta guruh */
export function buildLayerGroups(categories = []) {
  return LAYER_GROUPS.map((g) => {
    const matched = categories.filter((c) => g.codes.includes(c.code))
    const land_count = matched.reduce((s, c) => s + (c.land_count || 0), 0)
    const color = matched[0]?.color || g.color
    return { ...g, color, land_count, matched }
  }).filter((g) => g.matched.length > 0 || true)
}

export function filterResearchCategories(categories = []) {
  return categories
    .filter((c) => isResearchCategory(c.code))
    .map((c) => ({ ...c, name_uz: displayCategoryName(c), name_ru: displayCategoryName(c) }))
}

export function filterResearchCategoryStats(byCategory = []) {
  const map = {}
  for (const c of byCategory) {
    if (!isResearchCategory(c.code)) continue
    const key = c.code === 'park' ? 'istirohat' : c.code
    if (!map[key]) {
      map[key] = {
        ...c,
        code: key,
        name: displayCategoryName(key),
        name_uz: displayCategoryName(key),
        count: 0,
        area_ha: 0,
        length_km: 0,
        color: LAYER_GROUPS.find((g) => g.key === key)?.color || c.color,
      }
    }
    map[key].count += c.count || 0
    map[key].area_ha += c.area_ha || 0
    map[key].length_km += c.length_km || 0
  }
  return LAYER_GROUPS.map((g) => map[g.key]).filter(Boolean)
}
