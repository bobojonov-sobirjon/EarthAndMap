import { buildLayerGroups } from '../constants/researchLayers'
import { useI18n } from '../i18n/I18nContext'
import { loc } from '../i18n/loc'

const LAYER_ICONS = {
  yollar: 'road',
  suv: 'water',
  istirohat: 'park',
  qabriston: 'cemetery',
}

function LayerIcon({ type, color }) {
  if (type === 'road') {
    return <span className="map-layer-icon map-layer-icon--road" style={{ '--c': color }} />
  }
  if (type === 'water') {
    return <span className="map-layer-icon map-layer-icon--water" style={{ '--c': color }} />
  }
  if (type === 'park') {
    return <span className="map-layer-icon map-layer-icon--park" style={{ '--c': color }} />
  }
  if (type === 'cemetery') {
    return <span className="map-layer-icon map-layer-icon--cemetery" style={{ '--c': color }} />
  }
  return <span className="layer-color" style={{ background: color }} />
}

export default function MapControlPanel({
  boundaries = [],
  categories = [],
  visibleLayers,
  onToggle,
  onToggleGroup,
  onOpenNearest,
  compareHref = '/compare',
}) {
  const { t, lang } = useI18n()
  const groups = buildLayerGroups(categories)
  const groupChecked = (g) => g.codes.every((code) => visibleLayers[code] !== false)

  return (
    <aside className="map-control-panel">
      <header className="map-control-panel__head">
        <h2>{t('map.title')}</h2>
      </header>

      <section className="map-control-section">
        <h3 className="map-control-section__title">{t('map.borders')}</h3>
        <div className="map-control-list">
          {boundaries.map((b) => (
            <label key={b.code} className="map-control-item">
              <input
                type="checkbox"
                checked={visibleLayers[`boundary:${b.code}`] !== false}
                onChange={() => onToggle(`boundary:${b.code}`)}
              />
              <span className="map-control-check" />
              <span className="layer-color" style={{ background: b.color }} />
              <span>{loc(b, 'name', lang) || b.name}</span>
            </label>
          ))}
          <label className="map-control-item">
            <input
              type="checkbox"
              checked={visibleLayers.mfy_boundaries !== false}
              onChange={() => onToggle('mfy_boundaries')}
            />
            <span className="map-control-check" />
            <span className="layer-color layer-color--mfy" />
            <span>{t('map.mfyBoundaries')}</span>
          </label>
          <label className="map-control-item map-control-item--sub">
            <input
              type="checkbox"
              checked={visibleLayers.mfy_points !== false}
              onChange={() => onToggle('mfy_points')}
            />
            <span className="map-control-check" />
            <span className="layer-color layer-color--mfy-point" />
            <span>{t('map.mfyPoints')}</span>
          </label>
        </div>
      </section>

      <section className="map-control-section">
        <h3 className="map-control-section__title">{t('map.objects')}</h3>
        <div className="map-control-list">
          {groups.map((g) => (
            <label key={g.key} className="map-control-item">
              <input
                type="checkbox"
                checked={groupChecked(g)}
                onChange={() => {
                  if (onToggleGroup) onToggleGroup(g.codes)
                  else g.codes.forEach((c) => onToggle(c))
                }}
              />
              <span className="map-control-check" />
              <LayerIcon type={LAYER_ICONS[g.key]} color={g.color} />
              <span>{t(`layer.${g.key}`)}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="map-control-section map-control-section--extras">
        <h3 className="map-control-section__title">{t('map.extras.title')}</h3>
        <p className="map-extras-hint">{t('map.extras.sub')}</p>
        <ul className="map-extras-list">
          <li>
            <a href="https://open.ngis.uz/" target="_blank" rel="noopener noreferrer">
              {t('map.extras.ngis')}
            </a>
            <span>{t('map.extras.ngisHint')}</span>
          </li>
          {onOpenNearest && (
            <li>
              <button type="button" className="map-extras-link" onClick={onOpenNearest}>
                {t('map.extras.nearest')}
              </button>
            </li>
          )}
          <li>
            <a href={compareHref}>{t('map.extras.compare')}</a>
          </li>
          <li>
            <a href="https://open.ngis.uz/" target="_blank" rel="noopener noreferrer">
              {t('map.extras.cadastre')}
            </a>
          </li>
        </ul>
      </section>

      <section className="map-control-section map-control-section--legend">
        <h3 className="map-control-section__title">{t('map.legend')}</h3>
        <div className="map-legend-grid">
          {groups.map((g) => (
            <div key={`leg-${g.key}`} className="map-legend-item">
              <LayerIcon type={LAYER_ICONS[g.key]} color={g.color} />
              <span>{t(`layer.${g.key}`)}</span>
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}
