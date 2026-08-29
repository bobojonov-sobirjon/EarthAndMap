import { BASEMAP_IDS } from '../map/basemaps'
import { useI18n } from '../i18n/I18nContext'

/** Xarita ustidagi Sputnik | Sxema | Tungi tugmalari. */
export default function MapBasemapSwitcher({ value = 'satellite', onChange }) {
  const { t } = useI18n()

  return (
    <div className="map-basemap-switch" role="group" aria-label={t('map.basemap')}>
      {BASEMAP_IDS.map((id, i) => (
        <span key={id} className="map-basemap-switch__item">
          {i > 0 && <span className="map-basemap-switch__sep" aria-hidden />}
          <button
            type="button"
            className={`map-basemap-switch__btn${value === id ? ' is-on' : ''}`}
            onClick={() => onChange?.(id)}
            aria-pressed={value === id}
          >
            {t(`map.basemap.${id}`)}
          </button>
        </span>
      ))}
    </div>
  )
}
