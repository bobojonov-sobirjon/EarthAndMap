import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { loc } from '../i18n/loc'

/**
 * MFY hover floating card — cursor yonida, viewport ichida ushlab turiladi.
 * `hover` = { name, feature, clientX, clientY } | null
 */
export default function MfyHoverCard({ hover, stats = null, containerRef = null }) {
  const { t, lang } = useI18n()
  const cardRef = useRef(null)
  const [pos, setPos] = useState({ left: 0, top: 0, visible: false })
  const rafRef = useRef(0)

  const meta = useMemo(() => {
    if (!hover?.feature && !hover?.name) return null
    const p = hover.feature?.properties || {}
    const name = loc(p, 'name', lang) || p.name || hover.name || '—'
    const district = p.district_name || p.district || p.tuman || t('map.mfyHover.districtDefault')
    const region = p.region_name || p.region || p.viloyat || t('map.mfyHover.regionDefault')
    return { name, district, region, code: p.code || p.mahalla_code || '' }
  }, [hover, lang, t])

  useEffect(() => {
    if (!hover || !meta) {
      setPos((p) => (p.visible ? { ...p, visible: false } : p))
      return undefined
    }

    const place = () => {
      const card = cardRef.current
      const wrap = containerRef?.current
      const rect = wrap?.getBoundingClientRect?.()
      const cw = card?.offsetWidth || 280
      const ch = card?.offsetHeight || 160
      const pad = 12
      const offset = 18

      let x = hover.clientX + offset
      let y = hover.clientY + offset

      if (rect) {
        x -= rect.left
        y -= rect.top
        const maxX = rect.width - cw - pad
        const maxY = rect.height - ch - pad
        if (x > maxX) x = hover.clientX - rect.left - cw - offset
        if (y > maxY) y = hover.clientY - rect.top - ch - offset
        x = Math.max(pad, Math.min(x, maxX))
        y = Math.max(pad, Math.min(y, maxY))
      } else {
        const maxX = window.innerWidth - cw - pad
        const maxY = window.innerHeight - ch - pad
        if (x > maxX) x = hover.clientX - cw - offset
        if (y > maxY) y = hover.clientY - ch - offset
        x = Math.max(pad, Math.min(x, maxX))
        y = Math.max(pad, Math.min(y, maxY))
      }

      setPos({ left: x, top: y, visible: true })
    }

    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(place)
    return () => cancelAnimationFrame(rafRef.current)
  }, [hover, meta, containerRef])

  if (!meta) return null

  const s = stats || {}
  const area = Number.isFinite(s.areaHa) ? s.areaHa : null
  const total = Number.isFinite(s.total) ? s.total : null

  return (
    <div
      ref={cardRef}
      className={`mfy-hover-card${pos.visible ? ' is-visible' : ''}`}
      style={{ left: pos.left, top: pos.top }}
      role="tooltip"
      aria-live="polite"
    >
      <div className="mfy-hover-card__glow" aria-hidden />
      <header className="mfy-hover-card__head">
        <span className="mfy-hover-card__eyebrow">{t('map.mfyHover.eyebrow')}</span>
        <strong className="mfy-hover-card__title">{meta.name}</strong>
      </header>
      <dl className="mfy-hover-card__meta">
        <div>
          <dt>{t('map.mfyHover.district')}</dt>
          <dd>{meta.district}</dd>
        </div>
        <div>
          <dt>{t('map.mfyHover.region')}</dt>
          <dd>{meta.region}</dd>
        </div>
      </dl>
      <div className="mfy-hover-card__stats">
        <div className="mfy-hover-card__stat">
          <span>{t('map.mfyAnal.area')}</span>
          <strong>{area != null ? `${area} ga` : '—'}</strong>
        </div>
        <div className="mfy-hover-card__stat">
          <span>{t('map.mfyAnal.objects')}</span>
          <strong>{total != null ? total : '—'}</strong>
        </div>
        <div className="mfy-hover-card__stat">
          <span>{t('map.mfyAnal.roadsShort')}</span>
          <strong>{fmtKm(s.roadKm)}</strong>
        </div>
        <div className="mfy-hover-card__stat">
          <span>{t('map.mfyAnal.parksShort')}</span>
          <strong>{Number.isFinite(s.parks) ? s.parks : '—'}</strong>
        </div>
      </div>
      <p className="mfy-hover-card__hint">{t('map.mfyHover.hint')}</p>
    </div>
  )
}

function fmtKm(n) {
  if (!Number.isFinite(n)) return '—'
  return `${n} km`
}
