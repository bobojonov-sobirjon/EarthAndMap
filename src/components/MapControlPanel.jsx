import { buildLayerGroups, displayCategoryName } from '../constants/researchLayers'

const STATUSES = [
  { value: '', label: 'Holati' },
  { value: 'active', label: 'Amalda' },
  { value: 'construction', label: 'Yangilanmoqda' },
  { value: 'damaged', label: 'Muammoli' },
  { value: 'closed', label: 'Yopiq' },
  { value: 'planned', label: 'Rejalashtirilgan' },
]

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
  filters,
  onChange,
  onSearch,
  mahallas = [],
}) {
  const groups = buildLayerGroups(categories)
  const groupChecked = (g) => g.codes.every((code) => visibleLayers[code] !== false)

  return (
    <aside className="map-control-panel">
      <header className="map-control-panel__head">
        <h2>Interaktiv xarita — Buxoro shahri</h2>
      </header>

      <section className="map-control-section">
        <h3 className="map-control-section__title">Chegaralar</h3>
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
              <span>{b.name}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="map-control-section">
        <h3 className="map-control-section__title">Umumiy foydalanishdagi yer obyektlari</h3>
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
              <span>{g.name}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="map-control-section">
        <h3 className="map-control-section__title">Qidiruv</h3>
        <div className="map-search-wrap">
          <svg className="map-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className="map-search-input"
            placeholder="Obyekt nomi bo'yicha qidirish..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
      </section>

      <section className="map-control-section">
        <h3 className="map-control-section__title">Filtr</h3>
        <select
          className="map-select"
          value={filters.mahalla || ''}
          onChange={(e) => onChange({ ...filters, mahalla: e.target.value })}
        >
          <option value="">MFY</option>
          {mahallas.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          className="map-select"
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
        >
          <option value="">Obyekt turi</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{displayCategoryName(c)}</option>
          ))}
        </select>
        <select
          className="map-select"
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
        >
          {STATUSES.map((s) => (
            <option key={s.value || 'all'} value={s.value}>{s.label}</option>
          ))}
        </select>
      </section>

      <section className="map-control-section map-control-section--legend">
        <h3 className="map-control-section__title">Legenda</h3>
        <div className="map-legend-grid">
          {groups.map((g) => (
            <div key={`leg-${g.key}`} className="map-legend-item">
              <LayerIcon type={LAYER_ICONS[g.key]} color={g.color} />
              <span>{g.name}</span>
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}
