import { useI18n } from '../i18n/I18nContext'

function fmt(n, d = 1) {
  const x = Number(n ?? 0)
  if (!Number.isFinite(x)) return '—'
  return x.toLocaleString(undefined, { maximumFractionDigits: d })
}

/**
 * Pastki qisqa statistik panel — MFY asosiy ko‘rsatkichlari.
 */
export default function MfyStatsBar({ passport }) {
  const { t } = useI18n()
  if (!passport) return null

  const cards = [
    { id: 'name', label: t('map.mfy'), value: passport.name, wide: true },
    { id: 'area', label: t('map.mfyAnal.area'), value: `${fmt(passport.areaHa, 1)} ga` },
    { id: 'roads', label: t('map.mfyAnal.roadsShort'), value: `${fmt(passport.roadKm, 1)} km`, tone: 'road' },
    { id: 'streets', label: t('map.mfyAnal.streetsShort'), value: `${fmt(passport.streetKm, 1)} km`, tone: 'street' },
    { id: 'ariq', label: t('map.mfyAnal.ariqsShort'), value: `${fmt(passport.ariqKm, 1)} km`, tone: 'ariq' },
    { id: 'kanal', label: t('map.mfyAnal.canalsShort'), value: `${fmt(passport.kanalKm, 1)} km`, tone: 'kanal' },
    { id: 'cem', label: t('map.mfyAnal.cemeteriesShort'), value: String(passport.cemeteries ?? 0), tone: 'cem' },
    { id: 'park', label: t('map.mfyAnal.parksShort'), value: String(passport.parks ?? 0), tone: 'park' },
    { id: 'other', label: t('map.mfyAnal.otherShort'), value: String(passport.other ?? 0), tone: 'other' },
  ]

  return (
    <div className="mfy-stats-bar" role="region" aria-label={t('map.mfyAnal.statsBar')}>
      {cards.map((c) => (
        <div
          key={c.id}
          className={`mfy-stats-bar__card${c.wide ? ' mfy-stats-bar__card--wide' : ''}${c.tone ? ` mfy-stats-bar__card--${c.tone}` : ''}`}
        >
          <span>{c.label}</span>
          <b>{c.value}</b>
        </div>
      ))}
    </div>
  )
}
