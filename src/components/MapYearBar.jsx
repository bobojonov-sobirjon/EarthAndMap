import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'

export default function MapYearBar({ year, onChange, years = [] }) {
  const { t } = useI18n()
  const list = years.filter((y) => Number.isFinite(Number(y))).map(Number)
  const [playing, setPlaying] = useState(false)
  const idx = year == null ? -1 : list.indexOf(Number(year))
  const playRef = useRef(null)
  const oneYear = Number.isFinite(Number(year))

  useEffect(() => {
    if (!playing || !list.length) return undefined
    let i = idx < 0 ? 0 : idx
    onChange(list[i])
    playRef.current = window.setInterval(() => {
      i = (i + 1) % list.length
      onChange(list[i])
    }, 1400)
    return () => window.clearInterval(playRef.current)
  }, [playing, list.join(',')])

  if (!list.length) return null

  return (
    <div className="map-year-bar">
      <div className="map-year-bar__head">
        <div className="map-year-bar__title">
          <strong>{t('map.year')}</strong>
          <span className="map-year-bar__current">
            {oneYear ? year : t('map.allYears')}
          </span>
        </div>
        <div className="map-year-bar__acts">
          <button
            type="button"
            className={`chip ${!oneYear ? 'active' : ''}`}
            onClick={() => { setPlaying(false); onChange(null) }}
          >
            {t('map.allYears')}
          </button>
          <button type="button" className={`chip ${playing ? 'active' : ''}`} onClick={() => setPlaying((v) => !v)}>
            {playing ? t('map.stop') : t('map.play')}
          </button>
        </div>
      </div>
      <p className="map-year-bar__hint">{t('map.yearHint')}</p>
      <input
        type="range"
        min={0}
        max={Math.max(0, list.length - 1)}
        step={1}
        value={idx < 0 ? list.length - 1 : idx}
        onChange={(e) => { setPlaying(false); onChange(list[Number(e.target.value)]) }}
        aria-label={t('map.year')}
      />
      <div className="map-year-bar__ticks">
        {list.map((y) => (
          <button
            key={y}
            type="button"
            className={Number(year) === y ? 'is-on' : ''}
            onClick={() => { setPlaying(false); onChange(y) }}
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  )
}
