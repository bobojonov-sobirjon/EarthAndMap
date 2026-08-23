export const LANGS = [
  { code: 'uz', label: 'O‘zbekcha' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
]

export const STORAGE_KEY = 'buxoro-gis-lang'

export function dateLocale(lang) {
  if (lang === 'ru') return 'ru-RU'
  if (lang === 'en') return 'en-GB'
  return 'uz-UZ'
}

/** Dynamic CMS text: UZ lives in `name` or `name_uz`. */
export function loc(obj, base, lang = 'uz') {
  if (!obj) return ''
  const uz = obj[`${base}_uz`] ?? obj[base] ?? ''
  const ru = obj[`${base}_ru`] ?? ''
  const en = obj[`${base}_en`] ?? ''
  if (lang === 'ru') return ru || uz || en
  if (lang === 'en') return en || uz || ru
  return uz || ru || en
}

const UZ_RU = [
  [/istirohat\s+bog[‘'ʻ’]?i?/gi, 'парк отдыха'],
  [/\beko\s+bog[‘'ʻ’]?i?\b/gi, 'Экопарк'],
  [/\bbog[‘'ʻ’]?lari\b/gi, 'парки'],
  [/\bbog[‘'ʻ’]?i\b/gi, 'парк'],
  [/\bbog[‘'ʻ’]?\b/gi, 'парк'],
  [/qabriston(lar)?/gi, 'кладбище'],
  [/kanal(lar)?/gi, 'канал'],
  [/ariq(lar)?/gi, 'арык'],
  [/rekreatsiya/gi, 'рекреация'],
  [/amalda/gi, 'действует'],
  [/yo[‘'ʻ’]?l(lar)?/gi, 'дорога'],
]

const UZ_EN = [
  [/istirohat\s+bog[‘'ʻ’]?i?/gi, 'recreation park'],
  [/\beko\s+bog[‘'ʻ’]?i?\b/gi, 'Eco park'],
  [/\bbog[‘'ʻ’]?lari\b/gi, 'parks'],
  [/\bbog[‘'ʻ’]?i\b/gi, 'park'],
  [/\bbog[‘'ʻ’]?\b/gi, 'park'],
  [/qabriston(lar)?/gi, 'cemetery'],
  [/kanal(lar)?/gi, 'canal'],
  [/ariq(lar)?/gi, 'ditch'],
  [/rekreatsiya/gi, 'recreation'],
  [/amalda/gi, 'in use'],
  [/yo[‘'ʻ’]?l(lar)?/gi, 'road'],
]

export function localizePhrase(text, lang = 'uz') {
  if (!text || lang === 'uz') return text || ''
  let s = String(text)
  const pairs = lang === 'ru' ? UZ_RU : UZ_EN
  pairs.forEach(([re, to]) => { s = s.replace(re, to) })
  return s
}

/** CMS matn + agar ru/en bo‘sh bo‘lsa oddiy so‘zlarni tarjima qiladi. */
export function locName(obj, lang = 'uz') {
  if (!obj) return ''
  const uz = obj.name_uz ?? obj.name ?? ''
  const ru = obj.name_ru ?? ''
  const en = obj.name_en ?? ''
  if (lang === 'ru') return ru || localizePhrase(uz, 'ru') || en
  if (lang === 'en') return en || localizePhrase(uz, 'en') || ru
  return uz || ru || en
}

export function catName(codeOrObj, t, lang = 'uz') {
  if (!codeOrObj) return ''
  const code = typeof codeOrObj === 'string'
    ? codeOrObj
    : (codeOrObj.code || codeOrObj.category_code)
  const k = code === 'park' ? 'istirohat' : code
  if (t && ['yollar', 'suv', 'istirohat', 'qabriston'].includes(k)) {
    return t(`layer.${k}`)
  }
  if (typeof codeOrObj === 'string') return t ? t(`layer.${k}`) : codeOrObj
  return loc(codeOrObj, 'name', lang)
    || loc({
      name: codeOrObj.category_name,
      name_ru: codeOrObj.category_name_ru,
      name_en: codeOrObj.category_name_en,
    }, 'name', lang)
    || (t && code ? t(`layer.${k}`) : '')
}
