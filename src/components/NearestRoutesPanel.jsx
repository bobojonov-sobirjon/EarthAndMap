import { useEffect, useState } from 'react'
import { LAYER_GROUPS } from '../constants/researchLayers'
import { useI18n } from '../i18n/I18nContext'
import { loc } from '../i18n/loc'
import {
  TRAVEL_MODES,
  featureLatLng,
  fmtDriveTime,
  fmtKm,
  haversineMeters,
  osrmRoute,
  reverseAddress,
  travelModeById,
} from '../map/routing'

const LETTERS = ['B', 'C', 'D']

function codesFor(key) {
  const g = LAYER_GROUPS.find((x) => x.key === key)
  const extra = key === 'qabriston' ? ['qabriston', 'cemetery'] : []
  return [...(g?.codes || [key]), ...extra]
}

function matchesCat(feature, key) {
  const code = String(feature?.properties?.category_code || '').toLowerCase()
  return codesFor(key).some((c) => c.toLowerCase() === code)
}

function ModeIcon({ id }) {
  const p = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.9',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  if (id === 'driving') {
    return (
      <svg {...p}><path d="M5 16v-3.2L7 8h10l2 4.8V16" /><path d="M5 16h14" /><circle cx="7.5" cy="16.5" r="1.6" /><circle cx="16.5" cy="16.5" r="1.6" /><path d="M7 11h10" /></svg>
    )
  }
  if (id === 'bus') {
    return (
      <svg {...p}><rect x="5" y="4" width="14" height="13" rx="2" /><path d="M5 11h14" /><path d="M8 17v2" /><path d="M16 17v2" /></svg>
    )
  }
  if (id === 'walking') {
    return (
      <svg {...p}><circle cx="12" cy="5" r="2" /><path d="M10 22l2-7 3 2 2 5" /><path d="M8 13l4 2 3-5" /></svg>
    )
  }
  if (id === 'cycling') {
    return (
      <svg {...p}><circle cx="6.5" cy="17" r="3" /><circle cx="17.5" cy="17" r="3" /><path d="M6.5 17l4-8h4l3 8" /><path d="M12 9V6" /><circle cx="13" cy="5" r="1.4" /></svg>
    )
  }
  return (
    <svg {...p}><path d="M5 16h8l3-6H9L5 16z" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="14.5" cy="17.5" r="1.6" /><path d="M16 10l3-3" /></svg>
  )
}

export default function NearestRoutesPanel(props) {
  const {
    features,
    userLocation,
    locating = false,
  } = props
  const askGps = props.onNeedLocation || props.onNeedLocation
  const pushRoutes = props.onRoutes || props.onRoutes
  const pickLand = props.onPick || props.onPick
  const onClose = props.onClose
  const { t, lang } = useI18n()
  const [category, setCategory] = useState('qabriston')
  const [mode, setMode] = useState('driving')
  const [rows, setRows] = useState([])
  const [modeTimes, setModeTimes] = useState({})
  const [focus, setFocus] = useState(0)
  const [busy, setBusy] = useState(false)
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    if (!userLocation) {
      setAddress('')
      return undefined
    }
    reverseAddress(userLocation.lat, userLocation.lng, lang)
      .then((name) => { if (!cancelled) setAddress(name) })
      .catch(() => { if (!cancelled) setAddress('') })
    return () => { cancelled = true }
  }, [userLocation, lang])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setError('')
      setRows([])
      pushRoutes?.([])
      if (!userLocation) return
      const list = (features?.features || [])
        .filter((f) => matchesCat(f, category))
        .map((f) => {
          const ll = featureLatLng(f)
          if (!ll) return null
          return { feature: f, ll, air: haversineMeters(userLocation, ll) }
        })
        .filter(Boolean)
        .sort((a, b) => a.air - b.air)
        .slice(0, 3)

      if (!list.length) {
        setError(t('route.empty'))
        return
      }

      setBusy(true)
      const paint = travelModeById(mode).color
      try {
        const routed = await Promise.all(list.map((item, i) => (
          osrmRoute(userLocation, item.ll, mode).then((r) => ({
            ...item,
            letter: LETTERS[i],
            color: paint,
            distance: r.distance,
            duration: r.duration,
            coordinates: r.coordinates,
            fallback: r.fallback,
          }))
        )))
        if (cancelled) return
        setRows(routed)
        setFocus((i) => Math.min(i, routed.length - 1))
        pushRoutes?.(routed.map((r) => ({
          id: r.feature.id || r.feature.properties?.id,
          letter: r.letter,
          color: r.color,
          coordinates: r.coordinates,
          dest: r.ll,
          name: loc(r.feature.properties || {}, 'name', lang) || r.feature.properties?.name || r.letter,
          land: r.feature.properties || {},
        })))
      } catch {
        if (!cancelled) setError(t('route.fail'))
      } finally {
        if (!cancelled) setBusy(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [userLocation, category, features, t, mode, lang])

  useEffect(() => {
    let cancelled = false
    const target = rows[focus] || rows[0]
    if (!userLocation || !target) {
      setModeTimes({})
      return undefined
    }
    Promise.all(TRAVEL_MODES.map((m) => (
      osrmRoute(userLocation, target.ll, m.id).then((r) => [m.id, r.duration])
    ))).then((pairs) => {
      if (!cancelled) setModeTimes(Object.fromEntries(pairs))
    })
    return () => { cancelled = true }
  }, [userLocation, rows, focus])

  const bestId = TRAVEL_MODES.reduce((best, m) => {
    const a = modeTimes[m.id]
    const b = modeTimes[best]
    if (a == null) return best
    if (b == null || a < b) return m.id
    return best
  }, 'driving')

  return (
    <div className="route-panel">
      <div className="route-panel__head">
        <div>
          <strong>{t('route.title')}</strong>
          <span>{t('route.max3')}</span>
        </div>
        {onClose && (
          <button type="button" className="btn-close" onClick={onClose} aria-label={t('common.close')}>×</button>
        )}
      </div>

      <label className="route-panel__cat">
        {t('route.category')}
        <select value={category} onChange={(e) => { setFocus(0); setCategory(e.target.value) }}>
          {LAYER_GROUPS.map((g) => (
            <option key={g.key} value={g.key}>
              {t(`layer.${g.key === 'qabriston' ? 'qabriston' : g.key === 'park' ? 'istirohat' : g.key}`)}
            </option>
          ))}
        </select>
      </label>

      {userLocation ? (
        <div className="travel-modes" role="tablist" aria-label={t('route.how')}>
          {TRAVEL_MODES.map((m) => {
            const on = mode === m.id
            const sec = modeTimes[m.id]
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={on}
                className={`travel-modes__btn${on ? ' is-on' : ''}`}
                onClick={() => setMode(m.id)}
                title={t(`route.mode.${m.id}`)}
              >
                <span className="travel-modes__ico" style={{ '--m': m.color }}>
                  <ModeIcon id={m.id} />
                </span>
                <span className="travel-modes__time">
                  {sec == null ? (busy ? '…' : '—') : fmtDriveTime(sec)}
                </span>
                <span className="travel-modes__lab">
                  {m.id === bestId && sec != null ? t('route.best') : t(`route.mode.${m.id}`)}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="route-stop">
        <span className="route-letter route-letter--a">A</span>
        <div>
          <b>{t('route.you')}</b>
          {userLocation ? (
            <small>{address || t('route.addressWait')}</small>
          ) : (
            <small>{t('route.needGps')}</small>
          )}
        </div>
      </div>

      {!userLocation && (
        <button type="button" className="btn btn-primary route-panel__gps" onClick={askGps} disabled={locating}>
          {locating ? t('common.loading') : t('route.locate')}
        </button>
      )}

      {busy && <p className="route-panel__hint">{t('route.searching')}</p>}
      {error && !busy && <p className="route-panel__hint">{error}</p>}

      <ul className="route-list">
        {rows.map((r, i) => {
          const p = r.feature.properties || {}
          const name = loc(p, 'name', lang) || p.name || p.public_id || t('route.dest')
          return (
            <li key={r.letter}>
              <button
                type="button"
                className={`route-stop route-stop--btn${focus === i ? ' is-focus' : ''}`}
                onClick={() => { setFocus(i); pickLand?.(p) }}
              >
                <span className="route-letter" style={{ background: r.color }}>{r.letter}</span>
                <div>
                  <b>{name}</b>
                  <small className="route-meta">
                    <span>{fmtKm(r.distance)}</span>
                    <span className="route-car">{fmtDriveTime(r.duration)}</span>
                    {r.fallback ? <em>{t('route.approx')}</em> : null}
                  </small>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
