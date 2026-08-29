import { useMemo } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { catName, loc } from '../i18n/loc'

const STATUSES = ['', 'active', 'construction', 'damaged', 'closed', 'planned']

function IconFilter() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 4h16l-6 8v6l-4 2v-8L4 4z" strokeLinejoin="round" />
    </svg>
  )
}

function IconClear() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  )
}

function countActive(filters) {
  let n = 0
  if (filters.search?.trim()) n += 1
  if (filters.mahalla) n += 1
  if (filters.category) n += 1
  if (filters.status) n += 1
  if (filters.year) n += 1
  return n
}

export default function MapFilterBar({
  filters,
  onChange,
  onClear,
  mahallas = [],
  categories = [],
  years = [],
}) {
  const { t, lang } = useI18n()
  const active = useMemo(() => countActive(filters), [filters])
  const yearList = useMemo(
    () => years.filter((y) => Number.isFinite(Number(y))).map(Number),
    [years],
  )

  const summary = active === 0
    ? t('map.filterAll')
    : t('map.filterActive').replace('{n}', String(active))

  return (
    <div className={`map-filter-bar${active ? ' has-filters' : ''}`}>
      <div className="map-filter-bar__glow" aria-hidden />

      <div className="map-filter-bar__head">
        <div className="map-filter-bar__brand">
          <span className="map-filter-bar__eyebrow">{t('map.filter')}</span>
          <span className="map-filter-bar__summary" key={summary}>{summary}</span>
        </div>
        <button
          type="button"
          className={`map-filter-bar__act${active ? ' is-on' : ''}`}
          onClick={onClear}
          disabled={!active}
          title={t('map.filterClear')}
        >
          <IconClear />
          <span>{t('map.filterClear')}</span>
        </button>
      </div>

      <p className="map-filter-bar__hint">{t('map.filterHint')}</p>

      <div className="map-filter-bar__search">
        <IconFilter />
        <input
          type="text"
          className="map-filter-bar__search-input"
          placeholder={t('map.searchPh')}
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="map-filter-bar__grid">
        <select
          className="map-filter-bar__select"
          value={filters.mahalla || ''}
          onChange={(e) => onChange({ ...filters, mahalla: e.target.value })}
          aria-label={t('map.mfy')}
        >
          <option value="">{t('map.mfyAll')}</option>
          {mahallas.map((m) => {
            const val = typeof m === 'string' ? m : m.name
            const label = typeof m === 'string' ? m : (loc(m, 'name', lang) || m.name)
            return <option key={val} value={val}>{label}</option>
          })}
        </select>

        <select
          className="map-filter-bar__select"
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          aria-label={t('map.type')}
        >
          <option value="">{t('map.type')}</option>
          {categories.map((c) => (
            <option key={c.id || c.code} value={c.code}>{catName(c, t, lang)}</option>
          ))}
        </select>

        <select
          className="map-filter-bar__select"
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          aria-label={t('map.status')}
        >
          {STATUSES.map((s) => (
            <option key={s || 'all'} value={s}>{s ? t(`status.${s}`) : t('map.status')}</option>
          ))}
        </select>

        {yearList.length > 0 && (
          <select
            className="map-filter-bar__select"
            value={filters.year || ''}
            onChange={(e) => onChange({ ...filters, year: e.target.value })}
            aria-label={t('map.year')}
          >
            <option value="">{t('map.allYears')}</option>
            {yearList.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}
