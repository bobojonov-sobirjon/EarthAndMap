import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ROAD_CLASS_LIST,
  PARK_CLASS_LIST,
  roadLayerKey,
  parkLayerKey,
} from '../constants/researchLayers'

const ROAD_ITEMS = [
  { value: 'yollar', color: '#e67e22', labelKey: 'map.roadAll', hintKey: 'map.roadAllHint' },
  ...ROAD_CLASS_LIST.map((r) => ({
    value: roadLayerKey(r.id),
    color: r.color,
    id: r.id,
    labelKey: `road.${r.id}`,
    hintKey: `map.roadHint.${r.id}`,
  })),
]

const PARK_ITEMS = [
  { value: 'istirohat', color: '#27ae60', labelKey: 'map.parkAll', hintKey: 'map.parkAllHint' },
  ...PARK_CLASS_LIST.map((p) => ({
    value: parkLayerKey(p.id),
    color: p.color,
    id: p.id,
    labelKey: `layer.park.${p.id}`,
    hintKey: `map.parkHint.${p.id}`,
  })),
]

/**
 * Obyekt turi — yo'llar va istirohat accordion.
 */
export default function TypeFilterSelect({
  value = '',
  onChange,
  mainOptions = [],
  roadsLabel = "Avtomobil yo'llari",
  parksLabel = "Istirohat bog'lari",
  allRoadsLabel = "Barcha yo'llar",
  allParksLabel = "Barcha bog'lar",
  placeholder = 'Obyekt turi',
  allLabel = 'Barchasi',
  t,
}) {
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [roadsOpen, setRoadsOpen] = useState(false)
  const [parksOpen, setParksOpen] = useState(false)

  const roadValues = useMemo(() => ROAD_ITEMS.map((r) => r.value), [])
  const parkValues = useMemo(() => PARK_ITEMS.map((p) => p.value), [])
  const isRoadSelected = roadValues.includes(value)
  const isParkSelected = parkValues.includes(value)

  const displayLabel = useMemo(() => {
    if (!value) return placeholder
    if (value === 'yollar') return allRoadsLabel
    if (value === 'istirohat') return allParksLabel
    const road = ROAD_CLASS_LIST.find((r) => roadLayerKey(r.id) === value)
    if (road) return t ? t(`road.${road.id}`) : road.id
    const park = PARK_CLASS_LIST.find((p) => parkLayerKey(p.id) === value)
    if (park) return t ? t(`layer.park.${park.id}`) : park.id
    const main = mainOptions.find((o) => o.value === value)
    return main?.label || placeholder
  }, [value, placeholder, allRoadsLabel, allParksLabel, mainOptions, t])

  useEffect(() => {
    if (isRoadSelected) setRoadsOpen(true)
    if (isParkSelected) setParksOpen(true)
  }, [isRoadSelected, isParkSelected])

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) {
        setOpen(false)
        setRoadsOpen(false)
        setParksOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const pick = (v) => {
    onChange?.(v)
    setOpen(false)
    setRoadsOpen(false)
    setParksOpen(false)
  }

  const closePanels = () => {
    setRoadsOpen(false)
    setParksOpen(false)
  }

  return (
    <div className={`type-filter${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`type-filter__trigger${open ? ' is-open' : ''}${value ? ' has-value' : ''}`}
        onClick={() => {
          setOpen((v) => {
            if (v) closePanels()
            return !v
          })
        }}
        aria-expanded={open}
      >
        <span className="type-filter__value">{displayLabel}</span>
        <svg className="type-filter__chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="type-filter__menu" role="listbox">
          <div className="type-filter__menu-head">{placeholder}</div>
          <div className="type-filter__menu-list">
            <button
              type="button"
              className={`type-filter__item${!value ? ' is-on' : ''}`}
              onClick={() => pick('')}
              role="option"
              aria-selected={!value}
            >
              {allLabel}
            </button>

            <div className={`type-filter__roads${roadsOpen ? ' is-open' : ''}${isRoadSelected ? ' has-sel' : ''}`}>
              <button
                type="button"
                className={`type-filter__item type-filter__item--road${roadsOpen || isRoadSelected ? ' is-active' : ''}`}
                onClick={() => {
                  setParksOpen(false)
                  setRoadsOpen((v) => !v)
                }}
                aria-expanded={roadsOpen}
              >
                <span className="type-filter__road-ico" aria-hidden />
                <span>{roadsLabel}</span>
                <svg
                  className={`type-filter__side-chev${roadsOpen ? ' is-open' : ''}`}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className={`type-filter__roads-panel${roadsOpen ? ' is-open' : ''}`} aria-hidden={!roadsOpen}>
                <div className="type-filter__roads-inner">
                  {ROAD_ITEMS.map((item) => {
                    const label = t ? t(item.labelKey) : item.labelKey
                    const hint = t ? t(item.hintKey) : ''
                    return (
                      <button
                        key={item.value}
                        type="button"
                        className={`type-filter__fly-card${value === item.value ? ' is-on' : ''}`}
                        onClick={() => pick(item.value)}
                      >
                        <span className="type-filter__fly-icon" style={{ '--c': item.color }} aria-hidden>
                          <span className="type-filter__fly-icon-bar" />
                        </span>
                        <span className="type-filter__fly-text">
                          <span className="type-filter__fly-name">{label}</span>
                          {hint && <span className="type-filter__fly-hint">{hint}</span>}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className={`type-filter__roads type-filter__parks${parksOpen ? ' is-open' : ''}${isParkSelected ? ' has-sel' : ''}`}>
              <button
                type="button"
                className={`type-filter__item type-filter__item--park${parksOpen || isParkSelected ? ' is-active' : ''}`}
                onClick={() => {
                  setRoadsOpen(false)
                  setParksOpen((v) => !v)
                }}
                aria-expanded={parksOpen}
              >
                <span className="type-filter__park-ico" aria-hidden />
                <span>{parksLabel}</span>
                <svg
                  className={`type-filter__side-chev${parksOpen ? ' is-open' : ''}`}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <div className={`type-filter__roads-panel${parksOpen ? ' is-open' : ''}`} aria-hidden={!parksOpen}>
                <div className="type-filter__roads-inner">
                  {PARK_ITEMS.map((item) => {
                    const label = t ? t(item.labelKey) : item.labelKey
                    const hint = t ? t(item.hintKey) : ''
                    return (
                      <button
                        key={item.value}
                        type="button"
                        className={`type-filter__fly-card type-filter__fly-card--park${value === item.value ? ' is-on' : ''}`}
                        onClick={() => pick(item.value)}
                      >
                        <span className="type-filter__fly-icon type-filter__fly-icon--poly" style={{ '--c': item.color }} aria-hidden>
                          <span className="type-filter__fly-icon-sq" />
                        </span>
                        <span className="type-filter__fly-text">
                          <span className="type-filter__fly-name">{label}</span>
                          {hint && <span className="type-filter__fly-hint">{hint}</span>}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {mainOptions.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`type-filter__item${value === o.value ? ' is-on' : ''}`}
                onClick={() => pick(o.value)}
                role="option"
                aria-selected={value === o.value}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
