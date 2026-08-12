import { buildLayerGroups } from '../constants/researchLayers'

export default function LayerPanel({ categories, boundaries = [], visibleLayers, onToggle, onToggleGroup, stats }) {
  const groups = buildLayerGroups(categories)

  const groupChecked = (g) => g.codes.every((code) => visibleLayers[code] !== false)

  return (
    <div className="panel layer-panel">
      <h3>Chegaralar</h3>
      <div className="layer-list">
        {boundaries.map((b) => (
          <label key={b.code} className="layer-item">
            <input
              type="checkbox"
              checked={visibleLayers[`boundary:${b.code}`] !== false}
              onChange={() => onToggle(`boundary:${b.code}`)}
            />
            <span className="layer-color" style={{ background: b.color }} />
            <span className="layer-name">{b.name}</span>
          </label>
        ))}
      </div>

      <h3 style={{ marginTop: '1rem' }}>Umumiy foydalanishdagi yer obyektlari</h3>
      <div className="layer-list">
        {groups.map((g) => (
          <label key={g.key} className="layer-item">
            <input
              type="checkbox"
              checked={groupChecked(g)}
              onChange={() => {
                if (onToggleGroup) onToggleGroup(g.codes)
                else g.codes.forEach((c) => onToggle(c))
              }}
            />
            <span className="layer-color" style={{ background: g.color }} />
            <span className="layer-name">{g.name}</span>
            <span className="layer-count">{g.land_count}</span>
          </label>
        ))}
      </div>

      <h3 style={{ marginTop: '1rem' }}>Legenda</h3>
      <div className="layer-legend">
        {groups.map((g) => (
          <div key={`leg-${g.key}`} className="legend-row">
            <span className="layer-color" style={{ background: g.color }} />
            <span>{g.name}</span>
          </div>
        ))}
      </div>

      {stats && (
        <div className="layer-stats">
          <div><strong>{stats.total_objects}</strong> obyekt</div>
          <div><strong>{Math.round(stats.total_area_sqm || 0).toLocaleString()}</strong> m² maydon</div>
        </div>
      )}
    </div>
  )
}
