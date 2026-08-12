import { displayCategoryName } from '../constants/researchLayers'

const STATUSES = [
  { value: '', label: 'Barchasi' },
  { value: 'active', label: 'Faol' },
  { value: 'construction', label: 'Yangilanmoqda' },
  { value: 'damaged', label: 'Muammoli' },
  { value: 'closed', label: 'Yopiq' },
  { value: 'planned', label: 'Rejalashtirilgan' },
]

export default function FilterPanel({ filters, categories, onChange, onSearch }) {
  return (
    <div className="panel filter-panel">
      <h3>Qidiruv</h3>
      <input
        type="text"
        placeholder="Nomi, ID, manzil..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
      />
      <h3 style={{ marginTop: '0.75rem' }}>Filtr</h3>
      <input
        type="text"
        placeholder="MFY"
        value={filters.mahalla || ''}
        onChange={(e) => onChange({ ...filters, mahalla: e.target.value })}
      />
      <select
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value })}
      >
        <option value="">Obyekt turi</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{displayCategoryName(c)}</option>
        ))}
      </select>
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label || 'Holati'}</option>
        ))}
      </select>
      <button type="button" className="btn btn-primary btn-block" onClick={onSearch}>
        Qidirish
      </button>
    </div>
  )
}
