import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import uz from './uz.json'
import ru from './ru.json'
import en from './en.json'
import { LANGS, STORAGE_KEY } from './loc'

const DICTS = { uz, ru, en }

const I18nContext = createContext(null)

function isLang(v) {
  return v === 'uz' || v === 'ru' || v === 'en'
}

function readLang() {
  try {
    const q = new URLSearchParams(window.location.search).get('lang')
    if (isLang(q)) return q
    const v = localStorage.getItem(STORAGE_KEY)
    if (isLang(v)) return v
  } catch { /* ignore */ }
  return 'uz'
}

function persistUrl(lang) {
  try {
    const url = new URL(window.location.href)
    url.searchParams.set('lang', lang)
    window.history.replaceState({}, '', url)
  } catch { /* ignore */ }
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(readLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = (next) => {
    const v = isLang(next) ? next : 'uz'
    setLangState(v)
    try { localStorage.setItem(STORAGE_KEY, v) } catch { /* ignore */ }
    document.documentElement.lang = v
    persistUrl(v)
  }

  const value = useMemo(() => {
    const dict = DICTS[lang] || uz
    const t = (key) => dict[key] || DICTS.uz[key] || key
    return { lang, setLang, t, langs: LANGS }
  }, [lang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
