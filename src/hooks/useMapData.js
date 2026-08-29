import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMapSnapshot } from '../api/mapData'
import { useI18n } from '../i18n/I18nContext'
import { apiError } from '../i18n/apiError'

const DEFAULT_POLL_MS = 30000

/**
 * Backenddan chegaralar + markerlar/obyektlarni yuklaydi va polling qiladi.
 * Ma'lumot o'zgarsa fingerprint orqali state yangilanadi — xarita qayta chiziladi.
 */
export function useMapData({
  params = {},
  pollIntervalMs = DEFAULT_POLL_MS,
  enabled = true,
} = {}) {
  const { t } = useI18n()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fingerprintRef = useRef(null)
  const paramsKey = JSON.stringify(params)
  const abortRef = useRef(null)

  const load = useCallback(async ({ silent = false, force = false } = {}) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const snapshot = await fetchMapSnapshot(JSON.parse(paramsKey))
      if (controller.signal.aborted) return snapshot

      const changed = force || fingerprintRef.current !== snapshot.fingerprint
      if (changed || !fingerprintRef.current) {
        fingerprintRef.current = snapshot.fingerprint
        setData(snapshot)
        setLastUpdated(new Date())
      }
      return snapshot
    } catch (err) {
      if (controller.signal.aborted) return null
      setError(apiError(err, t, 'map.loadFail'))
      return null
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [paramsKey, t])

  const refresh = useCallback(() => load({ silent: true, force: true }), [load])

  /** Tashqi event: window.dispatchEvent(new CustomEvent('buxoro-map:refresh')) */
  useEffect(() => {
    if (!enabled) return undefined

    fingerprintRef.current = null
    load({ silent: false, force: true })

    const onRefresh = () => load({ silent: true, force: true })
    window.addEventListener('buxoro-map:refresh', onRefresh)

    let timer = null
    if (pollIntervalMs > 0) {
      timer = window.setInterval(() => load({ silent: true }), pollIntervalMs)
    }

    return () => {
      window.removeEventListener('buxoro-map:refresh', onRefresh)
      if (timer) window.clearInterval(timer)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [enabled, load, pollIntervalMs])

  return {
    data,
    boundaries: data?.boundaries ?? null,
    features: data?.features ?? null,
    markers: data?.markers ?? null,
    mahallas: data?.mahallas ?? null,
    config: data?.config ?? null,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh,
    reload: () => load({ silent: false }),
  }
}

/** Boshqa joydan xaritani yangilash uchun. */
export function requestMapRefresh() {
  window.dispatchEvent(new CustomEvent('buxoro-map:refresh'))
}
