/** Tadqiqot uchun asosiy 4 qatlam */

export const RESEARCH_CATEGORY_CODES = ['yollar', 'suv', 'istirohat', 'park', 'qabriston']

export const CATEGORY_DISPLAY_NAMES = {
  yollar: "Avtomobil yo'llari",
  suv: "Sug'orish tarmoqlari",
  istirohat: "Istirohat bog'lari va rekreatsion hududlar",
  park: "Istirohat bog'lari va rekreatsion hududlar",
  qabriston: 'Qabristonlar',
}

const CATEGORY_I18N = {
  yollar: { uz: "Avtomobil yo'llari", ru: 'Автомобильные дороги', en: 'Roads' },
  suv: { uz: "Sug'orish tarmoqlari", ru: 'Оросительные сети', en: 'Irrigation networks' },
  istirohat: { uz: "Istirohat bog'lari", ru: 'Парки и рекреация', en: 'Parks and recreation' },
  park: { uz: "Istirohat bog'lari", ru: 'Парки и рекреация', en: 'Parks and recreation' },
  qabriston: { uz: 'Qabristonlar', ru: 'Кладбища', en: 'Cemeteries' },
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
  piyoda: 'Piyoda va yordamchi',
}

/** Yo'l darajalari — SHP import nomlariga mos (I/II/III_darajali, piyoda). */
export const ROAD_CLASS_LIST = [
  { id: 'magistral', color: '#ef4444', order: 1 },
  { id: 'shahar', color: '#9333ea', order: 2 },
  { id: 'mahalliy', color: '#14b8a6', order: 3 },
  { id: 'piyoda', color: '#94a3b8', order: 4 },
]

/** Sug'orish: Kanallar / Ariqlar (road_class maydonida). */
export const WATER_CLASS_LIST = [
  { id: 'kanal', color: '#2563eb', order: 1 },
  { id: 'ariq', color: '#22d3ee', order: 2 },
]

/** Istirohat: SHP fclass (park / xiyobon / square). */
export const PARK_CLASS_LIST = [
  { id: 'park', color: '#22c55e', order: 1 },
  { id: 'xiyobon', color: '#84cc16', order: 2 },
  { id: 'square', color: '#a3e635', order: 3 },
]

export function roadClassColor(roadClass, fallback = '#e67e22') {
  const row = ROAD_CLASS_LIST.find((r) => r.id === roadClass)
  return row?.color || fallback
}

export function waterClassColor(waterClass, fallback = '#3498db') {
  const row = WATER_CLASS_LIST.find((r) => r.id === waterClass)
  return row?.color || fallback
}

export function parkClassColor(parkClass, fallback = '#27ae60') {
  const row = PARK_CLASS_LIST.find((r) => r.id === parkClass)
  return row?.color || fallback
}

export function roadLayerKey(roadClass) {
  return `road:${roadClass || 'unknown'}`
}

export function waterLayerKey(waterClass) {
  return `water:${waterClass || 'unknown'}`
}

export function parkLayerKey(parkClass) {
  return `rec:${parkClass || 'unknown'}`
}

export function isYollarFeatureVisible(feature, visibleLayers = {}) {
  if (visibleLayers.yollar === false) return false
  const road = feature?.properties?.road_class
  if (!road) return true
  return visibleLayers[roadLayerKey(road)] !== false
}

export function isSuvFeatureVisible(feature, visibleLayers = {}) {
  if (visibleLayers.suv === false) return false
  const water = feature?.properties?.road_class
  if (!water) return true
  return visibleLayers[waterLayerKey(water)] !== false
}

export function isIstirohatFeatureVisible(feature, visibleLayers = {}) {
  const code = feature?.properties?.category_code
  if (code !== 'istirohat' && code !== 'park') return true
  if (visibleLayers.istirohat === false && visibleLayers.park === false) return false
  if (visibleLayers.istirohat === false && code === 'istirohat') return false
  if (visibleLayers.park === false && code === 'park') return false
  const park = feature?.properties?.road_class
  if (!park) return true
  return visibleLayers[parkLayerKey(park)] !== false
}


/** Obyekt turi filter: `yollar`, `road:magistral`, `istirohat`, `rec:park`, … */
export function parseTypeFilter(value) {
  if (!value) return { category: '', road_class: '' }
  const raw = String(value)
  if (raw.startsWith('road:')) return { category: 'yollar', road_class: raw.slice(5) }
  if (raw.startsWith('rec:')) return { category: 'istirohat', road_class: raw.slice(4) }
  return { category: raw, road_class: '' }
}

export function matchesTypeFilter(feature, filterValue) {
  const { category, road_class } = parseTypeFilter(filterValue)
  if (!category) return true
  const code = feature?.properties?.category_code
  const catOk = code === category
    || (category === 'istirohat' && code === 'park')
    || (category === 'park' && code === 'istirohat')
  if (!catOk) return false
  if ((category === 'yollar' || category === 'istirohat' || category === 'park') && road_class) {
    return (feature?.properties?.road_class || '') === road_class
  }
  return true
}

const TYPE_FILTER_ORDER = ['yollar', 'istirohat', 'suv', 'qabriston']

export function buildTypeFilterOptions(categories, { t, lang, catName }) {
  const opts = [{ value: '', label: t('map.type') }]
  const seen = new Set()
  TYPE_FILTER_ORDER.forEach((code) => {
    const c = categories.find((x) => x.code === code || (code === 'istirohat' && x.code === 'park'))
    if (!c) return
    const key = c.code === 'park' ? 'istirohat' : c.code
    if (seen.has(key)) return
    seen.add(key)
    if (key === 'yollar') {
      opts.push({
        value: 'yollar',
        label: catName(c, t, lang),
        isRoads: true,
      })
      return
    }
    if (key === 'istirohat') {
      opts.push({
        value: 'istirohat',
        label: catName(c, t, lang),
        isParks: true,
      })
      return
    }
    opts.push({ value: key, label: catName(c, t, lang) })
  })
  return opts
}

export function isResearchCategory(code) {
  return RESEARCH_CATEGORY_CODES.includes(code)
}

export function displayCategoryName(catOrCode, lang = 'uz') {
  if (!catOrCode) return ''
  if (typeof catOrCode === 'string') {
    const row = CATEGORY_I18N[catOrCode] || CATEGORY_I18N[catOrCode === 'park' ? 'istirohat' : catOrCode]
    return (row && (row[lang] || row.uz)) || CATEGORY_DISPLAY_NAMES[catOrCode] || catOrCode
  }
  const uz = catOrCode.name_uz || catOrCode.name
  const ru = catOrCode.name_ru || catOrCode.category_name_ru
  const en = catOrCode.name_en || catOrCode.category_name_en
  if (lang === 'ru') return ru || uz || en || displayCategoryName(catOrCode.code, lang)
  if (lang === 'en') return en || uz || ru || displayCategoryName(catOrCode.code, lang)
  return uz || ru || en || displayCategoryName(catOrCode.code, lang)
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
    .map((c) => ({
      ...c,
      name_uz: displayCategoryName(c, 'uz'),
      name_ru: displayCategoryName(c, 'ru'),
      name_en: displayCategoryName(c, 'en'),
    }))
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
