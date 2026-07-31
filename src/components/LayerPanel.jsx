export default function LayerPanel({ categories, boundaries = [], visibleLayers, onToggle, stats }) {
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

      <h3 style={{ marginTop: '1rem' }}>Qatlamlar</h3>
      <div className="layer-list">
        {categories.map((cat) => (
          <label key={cat.code} className="layer-item">
            <input
              type="checkbox"
              checked={visibleLayers[cat.code] !== false}
              onChange={() => onToggle(cat.code)}
            />
            <span className="layer-color" style={{ background: cat.color }} />
            <span className="layer-name">{cat.name_uz}</span>
            <span className="layer-count">{cat.land_count ?? 0}</span>
          </label>
        ))}
      </div>
      {stats && (
        <div className="layer-stats">
          <div><strong>{stats.total_objects}</strong> obyekt</div>
          <div><strong>{Math.round(stats.total_area_sqm).toLocaleString()}</strong> m² maydon</div>
        </div>
      )}
    </div>
  )
}
