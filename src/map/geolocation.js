/** GPS / Geolocation helpers — HTTPS (secure context) talab qilinadi. */

export function isGeoSupported() {
  return typeof navigator !== 'undefined' && Boolean(navigator.geolocation)
}

export function isSecureForGeo() {
  if (typeof window === 'undefined') return false
  return Boolean(window.isSecureContext)
}

export function httpsUpgradeUrl() {
  if (typeof window === 'undefined') return ''
  if (window.location.protocol === 'https:') return window.location.href
  const url = new URL(window.location.href)
  url.protocol = 'https:'
  return url.toString()
}

/**
 * @returns {Promise<GeolocationPosition>}
 */
export function getUserPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!isGeoSupported()) {
      reject(Object.assign(new Error('UNSUPPORTED'), { code: 'UNSUPPORTED' }))
      return
    }
    if (!isSecureForGeo()) {
      reject(Object.assign(new Error('INSECURE'), { code: 'INSECURE' }))
      return
    }

    const base = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30_000,
      ...options,
    }

    const attempt = (opts, allowRetry) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (err) => {
          // High-accuracy timeout → oddiy tarmoq joylashuvi
          if (allowRetry && opts.enableHighAccuracy && (err?.code === 3 || err?.code === 2)) {
            attempt({ ...opts, enableHighAccuracy: false, timeout: 20000 }, false)
            return
          }
          reject(err)
        },
        opts,
      )
    }

    attempt(base, true)
  })
}

/** i18n kaliti: route.gps.* */
export function geoErrorKey(err) {
  const code = err?.code
  if (code === 'INSECURE' || code === 'UNSUPPORTED') {
    return code === 'INSECURE' ? 'route.gps.insecure' : 'route.gps.unsupported'
  }
  // GeolocationPositionError
  if (code === 1) return 'route.gps.denied'
  if (code === 2) return 'route.gps.unavailable'
  if (code === 3) return 'route.gps.timeout'
  return 'route.gps.fail'
}
