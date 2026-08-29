import { useI18n } from '../i18n/I18nContext'

function fmt(n, d = 1) {
  const x = Number(n ?? 0)
  return x.toLocaleString(undefined, { maximumFractionDigits: d })
}

export default function MfyPassportCard({ passport, onClose }) {
  const { t } = useI18n()
  if (!passport) return null

  const rows = [
    { k: t('map.passport.area'), v: `${fmt(passport.areaHa, 2)} ga` },
    { k: t('map.passport.parks'), v: String(passport.parks) },
    { k: t('map.passport.roads'), v: `${fmt(passport.roadKm, 2)} km` },
    { k: t('map.passport.canals'), v: `${fmt(passport.canalKm, 2)} km` },
    { k: t('map.passport.cemeteries'), v: String(passport.cemeteries) },
    { k: t('map.passport.objects'), v: String(passport.total) },
  ]

  return (
    <aside className="mfy-passport" role="dialog" aria-label={t('map.passport.title')}>
      <header className="mfy-passport__head">
        <div>
          <span className="mfy-passport__eyebrow">{t('map.passport.title')}</span>
          <strong>{passport.name}</strong>
        </div>
        {onClose && (
          <button type="button" className="mfy-passport__close" onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
        )}
      </header>
      <ul className="mfy-passport__grid">
        {rows.map((r) => (
          <li key={r.k}>
            <span>{r.k}</span>
            <b>{r.v}</b>
          </li>
        ))}
      </ul>
    </aside>
  )
}
