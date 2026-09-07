import { useI18n } from '../i18n/I18nContext'

/** MFY fokussiyasi uchun shartli belgilar (pastki chap). */
export default function MfyLegend() {
  const { t } = useI18n()
  const items = [
    { cls: 'mfy', label: t('map.mfyAnal.legendMfy') },
    { cls: 'road', label: t('map.mfyAnal.roads') },
    { cls: 'street', label: t('map.mfyAnal.streets') },
    { cls: 'ariq', label: t('map.mfyAnal.ariqs') },
    { cls: 'kanal', label: t('map.mfyAnal.canals') },
    { cls: 'cem', label: t('map.mfyAnal.cemeteries') },
    { cls: 'park', label: t('map.mfyAnal.parks') },
  ]
  return (
    <div className="mfy-legend" aria-hidden>
      <strong>{t('map.mfyAnal.legendTitle')}</strong>
      <ul>
        {items.map((it) => (
          <li key={it.cls}>
            <span className={`mfy-legend__swatch mfy-legend__swatch--${it.cls}`} />
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
