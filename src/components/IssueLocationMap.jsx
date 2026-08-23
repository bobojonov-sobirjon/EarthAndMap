import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { reverseAddress } from '../map/routing'
import { useI18n } from '../i18n/I18nContext'

const CENTER = { lat: 39.7683, lng: 64.455 }

const PIN = L.divIcon({
  className: 'issue-pin',
  iconSize: [28, 36],
  iconAnchor: [14, 34],
  html: '<span class="issue-pin__dot"></span>',
})

export default function IssueLocationMap({ value, onChange }) {
  const { t, lang } = useI18n()
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const langRef = useRef(lang)
  const [q, setQ] = useState(value?.address || '')
  const [hits, setHits] = useState([])
  const [busy, setBusy] = useState(false)

  onChangeRef.current = onChange
  langRef.current = lang

  const place = async (lat, lng, label) => {
    const map = mapRef.current
    if (!map) return
    if (markerRef.current) map.removeLayer(markerRef.current)
    const mk = L.marker([lat, lng], { icon: PIN, draggable: true }).addTo(map)
    markerRef.current = mk
    mk.on('dragend', async (e) => {
      const p = e.target.getLatLng()
      const addr = await reverseAddress(p.lat, p.lng, langRef.current).catch(() => '')
      setQ(addr)
      onChangeRef.current?.({ lat: p.lat, lng: p.lng, address: addr })
    })
    map.setView([lat, lng], Math.max(map.getZoom(), 16))
    const address = label || await reverseAddress(lat, lng, langRef.current).catch(() => '')
    setQ(address || '')
    onChangeRef.current?.({ lat, lng, address: address || '' })
  }

  useEffect(() => {
    if (mapRef.current || !mapEl.current) return undefined
    const map = L.map(mapEl.current, { zoomControl: true, attributionControl: false })
      .setView([CENTER.lat, CENTER.lng], 13)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18, maxNativeZoom: 17 },
    ).addTo(map)
    map.on('click', (e) => { place(e.latlng.lat, e.latlng.lng) })
    mapRef.current = map
    const tmr = window.setTimeout(() => map.invalidateSize(), 80)
    const tmr2 = window.setTimeout(() => map.invalidateSize(), 400)
    return () => {
      window.clearTimeout(tmr)
      window.clearTimeout(tmr2)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  const search = async (text) => {
    setQ(text)
    const s = text.trim()
    if (s.length < 2) {
      setHits([])
      return
    }
    setBusy(true)
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(s)}&lat=${CENTER.lat}&lon=${CENTER.lng}&limit=6`
      const res = await fetch(url)
      const data = await res.json()
      setHits((data.features || []).map((f) => {
        const [lng, lat] = f.geometry.coordinates
        const p = f.properties || {}
        return {
          lat,
          lng,
          name: [p.name, p.street, p.city || p.county, p.state].filter(Boolean).join(', '),
        }
      }))
    } catch {
      setHits([])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="issue-map">
      <span className="issue-map__label">{t('mon.mapLabel')}</span>
      <input
        value={q}
        onChange={(e) => search(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
        placeholder={t('mon.mapSearch')}
      />
      {hits.length > 0 && (
        <ul className="issue-map__hits">
          {hits.map((h) => (
            <li key={`${h.lat}-${h.lng}-${h.name}`}>
              <button
                type="button"
                onClick={() => { setHits([]); place(h.lat, h.lng, h.name) }}
              >
                {h.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {busy && <p className="issue-map__hint">{t('common.loading')}</p>}
      <div ref={mapEl} className="issue-map__canvas" />
      <p className="issue-map__hint">
        {value?.lat
          ? `${value.address || t('mon.pointSet')} · ${Number(value.lat).toFixed(5)}, ${Number(value.lng).toFixed(5)}`
          : t('mon.mapHint')}
      </p>
    </div>
  )
}
