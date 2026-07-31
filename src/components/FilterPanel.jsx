const STATUSES = [
  { value: '', label: 'Barchasi' },
  { value: 'active', label: 'Faol' },
  { value: 'construction', label: 'Qurilish' },
  { value: 'damaged', label: 'Zararlangan' },
  { value: 'closed', label: 'Yopiq' },
  { value: 'planned', label: 'Rejalashtirilgan' },
]

export default function FilterPanel({ filters, categories, onChange, onSearch }) {
  return (
    <div className="panel filter-panel">
      <h3>Qidiruv va filtr</h3>
      <input
        type="text"
        placeholder="Nomi, manzil, kadastr..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
      />
      <select
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value })}
      >
        <option value="">Barcha kategoriyalar</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name_uz}</option>
        ))}
      </select>
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <div className="filter-row">
        <input
          type="number"
          placeholder="Min maydon"
          value={filters.area_min}
          onChange={(e) => onChange({ ...filters, area_min: e.target.value })}
        />
        <input
          type="number"
          placeholder="Max maydon"
          value={filters.area_max}
          onChange={(e) => onChange({ ...filters, area_max: e.target.value })}
        />
      </div>
      <button type="button" className="btn btn-primary btn-block" onClick={onSearch}>
        Qidirish
      </button>
    </div>
  )
}
