let loadPromise = null

/** Google Maps JS API — faqat VITE_GOOGLE_MAPS_API_KEY bo'lganda. */
export function loadGoogleMaps(apiKey) {
  if (!apiKey) return Promise.reject(new Error('Google Maps API key missing'))
  if (typeof window !== 'undefined' && window.google?.maps) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      loadPromise = null
      reject(new Error('Google Maps script failed to load'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}
