import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const KEY = 'buxoro-gis-theme'
const ThemeContext = createContext(null)

function readTheme() {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark') return v
  } catch { /* ignore */ }
  return 'dark'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const t = readTheme()
    document.documentElement.setAttribute('data-theme', t)
    return t
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = (next) => {
    const v = next === 'light' ? 'light' : 'dark'
    setThemeState(v)
    try { localStorage.setItem(KEY, v) } catch { /* ignore */ }
    document.documentElement.setAttribute('data-theme', v)
  }

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme],
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
