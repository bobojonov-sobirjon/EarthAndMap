import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { categoriesApi, landsApi, statsApi } from '../api/services'
import { useAuth } from '../context/AuthContext'
import {
  displayCategoryName,
  filterResearchCategories,
  isResearchCategory,
  LAYER_GROUPS,
} from '../constants/researchLayers'
import { loc, catName } from '../i18n/loc'
import { useI18n } from '../i18n/I18nContext'
import { apiError } from '../i18n/apiError'
import PageLoader from '../components/PageLoader'
import { CURRENT_YEAR, YEARS } from '../constants/years'

const STATUS_LABELS = {
  active: 'Faol',
  construction: 'Yangilanmoqda',
  damaged: 'Muammoli',
  closed: 'Yopiq',
  planned: 'Rejalashtirilgan',
}

export default function LandsPage() {
  const { t, lang } = useI18n()
  const { canEdit } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [lands, setLands] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [mahallaFilter, setMahallaFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [yearFilter, setYearFilter] = useState(CURRENT_YEAR)
  const [selected, setSelected] = useState(null)
  const [selectedVersions, setSelectedVersions] = useState(null)
  const [loading, setLoading] = useState(true)

  const researchCats = useMemo(() => filterResearchCategories(categories), [categories])

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (categoryFilter) params.category = categoryFilter
      if (statusFilter) params.status = statusFilter
      if (yearFilter) params.monitoring_year = yearFilter
      if (mahallaFilter) params.search = [search, mahallaFilter].filter(Boolean).join(' ')
      const [landsRes, catsRes] = await Promise.all([
        landsApi.list(params),
        categoriesApi.list(),
      ])
      const all = landsRes.data.results || landsRes.data
      setLands(all.filter((l) => isResearchCategory(l.category_code)))
      setCategories(catsRes.data.results || catsRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    const landId = searchParams.get('land')
    if (!landId) return
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await landsApi.get(landId)
        if (!cancelled) setSelected(data)
      } catch {
        const found = lands.find((l) => String(l.id) === String(landId))
        if (!cancelled && found) setSelected(found)
      }
      if (!cancelled) setSearchParams({}, { replace: true })
    })()
    return () => { cancelled = true }
  }, [searchParams, lands, setSearchParams])

  const summary = useMemo(() => {
    return LAYER_GROUPS.map((g) => {
      const items = lands.filter((l) => g.codes.includes(l.category_code))
      const area = items.reduce((s, l) => s + (Number(l.area_ha) || 0), 0)
      const length = items.reduce((s, l) => s + (Number(l.length_km) || 0), 0)
      return {
        ...g,
        count: items.length,
        metric: g.key === 'yollar' || g.key === 'suv'
          ? `~${length.toFixed(1)} km`
          : `${area.toFixed(1)} ga`,
      }
    })
  }, [lands])

  const mahallas = useMemo(() => {
    const set = new Set(lands.map((l) => l.mahalla).filter(Boolean))
    return [...set].sort()
  }, [lands])

  const resetFilters = () => {
    setSearch('')
    setCategoryFilter('')
    setMahallaFilter('')
    setStatusFilter('')
    setYearFilter(CURRENT_YEAR)
    setTimeout(load, 0)
  }

  const exportCsv = () => {
    const header = ['ID', 'Nomi', 'Turi', 'MFY', 'Maydon_ga', 'Uzunlik_km', 'Holati', 'Yangilangan']
    const rows = lands.map((l) => [
      l.public_id || l.id,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      displayCategoryName(l.category_code || l),
      l.mahalla || '',
      l.area_ha ?? '',
      l.length_km ?? '',
      STATUS_LABELS[l.status] || l.status,
      l.updated_at ? new Date(l.updated_at).toLocaleDateString('uz') : '',
    ])
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reyestr_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPdfCard = async (land) => {
    const w = window.open('', '_blank', 'width=720,height=900')
    if (!w) return
    w.document.write(`<!doctype html><html><head><title>${land.public_id || land.name}</title>
      <style>
        body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#111}
        h1{font-size:20px;margin:0 0 8px}
        .meta{color:#555;margin-bottom:16px}
        table{width:100%;border-collapse:collapse}
        td{padding:8px;border-bottom:1px solid #ddd;vertical-align:top}
        td:first-child{width:40%;color:#555}
      </style></head><body>
      <h1>${land.name}</h1>
      <div class="meta">${land.public_id || ''} · ${displayCategoryName(land.category_code || land)}</div>
      <table>
        <tr><td>MFY</td><td>${land.mahalla || '—'}</td></tr>
        <tr><td>Maydon</td><td>${land.area_ha ?? '—'} ga</td></tr>
        <tr><td>Uzunlik</td><td>${land.length_km ?? '—'} km</td></tr>
        <tr><td>Holati</td><td>${STATUS_LABELS[land.status] || land.status}</td></tr>
        <tr><td>Kadastr</td><td>${land.cadastral_number || '—'}</td></tr>
        <tr><td>Manzil</td><td>${land.address || '—'}</td></tr>
        <tr><td>Tavsif</td><td>${land.description || '—'}</td></tr>
      </table>
      <script>window.print()</script>
      </body></html>`)
    w.document.close()
  }

  const openDetail = async (land) => {
    try {
      const { data } = await landsApi.get(land.id)
      setSelected(data)
    } catch {
      setSelected(land)
    }
  }

  const showVersions = async (land) => {
    const { data } = await landsApi.versions(land.id)
    setSelectedVersions({ land, versions: data })
  }

  const handleDelete = async (id) => {
    if (!confirm(t('msg.confirmDelete'))) return
    try {
      await landsApi.delete(id)
      load()
    } catch (err) {
      alert(apiError(err, t, 'msg.deleteFail'))
    }
  }

  return (
    <div className="lands-page">
      {loading && <PageLoader />}
      {!loading && (
      <>
      <div className="page-header lands-header">
        <div>
          <h2>{t('lands.title')}</h2>
          <p className="muted">{t('lands.sub')}</p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-ghost" onClick={resetFilters}>{t('common.clear')}</button>
          <button type="button" className="btn btn-secondary" onClick={exportCsv}>{t('lands.exportCsv')}</button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => statsApi.exportExcel().then(({ data }) => {
              const url = URL.createObjectURL(data)
              const a = document.createElement('a')
              a.href = url
              a.download = 'reyestr.xlsx'
              a.click()
              URL.revokeObjectURL(url)
            }).catch(() => exportCsv())}
          >
            {t('lands.exportXls')}
          </button>
        </div>
      </div>

      <div className="lands-filters">
        <input
          placeholder={t('lands.searchPh')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
        <select value={yearFilter || ''} onChange={(e) => setYearFilter(Number(e.target.value) || '')}>
          <option value="">{t('common.all')} — {t('map.year')}</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">{t('lands.allCats')}</option>
          {researchCats.map((c) => (
            <option key={c.id} value={c.id}>{catName(c, t, lang)}</option>
          ))}
        </select>
        <select value={mahallaFilter} onChange={(e) => setMahallaFilter(e.target.value)}>
          <option value="">{t('map.mfy')}</option>
          {mahallas.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">{t('map.status')}</option>
          {['active', 'construction', 'damaged', 'closed', 'planned'].map((k) => (
            <option key={k} value={k}>{t(`status.${k}`)}</option>
          ))}
        </select>
        <button type="button" className="btn btn-primary" onClick={load}>{t('common.search')}</button>
      </div>

      <div className="lands-summary">
        {summary.map((s) => (
          <div key={s.key} className="summary-card" style={{ borderTopColor: s.color }}>
            <strong>{s.count}</strong>
            <span>{t(`layer.${s.key}`)}</span>
            <small>{s.metric}</small>
          </div>
        ))}
      </div>

      <div className={`lands-layout ${selected ? 'with-detail' : ''}`}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>{t('lands.col.name')}</th>
                <th>{t('lands.col.type')}</th>
                <th>{t('map.mfy')}</th>
                <th>{t('lands.col.area')}</th>
                <th>{t('lands.col.len')}</th>
                <th>{t('lands.col.status')}</th>
                <th>{t('lands.col.updated')}</th>
                <th>{t('lands.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {lands.map((land) => (
                <tr key={land.id} className={selected?.id === land.id ? 'is-selected' : ''}>
                  <td><code>{land.public_id || land.id}</code></td>
                  <td>
                    <span className="color-dot" style={{ background: land.category_color }} />
                    {loc(land, 'name', lang)}
                  </td>
                  <td>{catName(land.category_code || land, t, lang)}</td>
                  <td>{land.mahalla || '—'}</td>
                  <td>{land.area_ha ?? '—'}</td>
                  <td>{land.length_km ?? '—'}</td>
                  <td><span className={`badge badge-${land.status}`}>{t(`status.${land.status}`)}</span></td>
                  <td>{land.updated_at ? new Date(land.updated_at).toLocaleDateString('uz') : '—'}</td>
                  <td className="actions-cell">
                    <button type="button" className="btn btn-sm btn-secondary" title="Batafsil" onClick={() => openDetail(land)}>📄</button>
                    <button type="button" className="btn btn-sm btn-secondary" title="Xaritada ko'rsatish" onClick={() => navigate(`/map?land=${land.id}`)}>🗺️</button>
                    <button type="button" className="btn btn-sm btn-secondary" title="PDF kartochka" onClick={() => exportPdfCard(land)}>⬇️</button>
                    <button type="button" className="btn btn-sm btn-ghost" title="Versiyalar" onClick={() => showVersions(land)}>⏱</button>
                    {canEdit && (
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(land.id)}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <aside className="lands-detail-panel panel">
            <div className="panel-header">
              <h3>{selected.public_id || selected.name}</h3>
              <button type="button" className="btn-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <p className="detail-title">{selected.name}</p>
            <div className="detail-grid">
              <div><span>{t('lands.col.type')}</span><strong>{displayCategoryName(selected.category_code || selected, lang)}</strong></div>
              <div><span>MFY</span><strong>{selected.mahalla || '—'}</strong></div>
              <div><span>Maydon</span><strong>{selected.area_ha ?? '—'} ga</strong></div>
              <div><span>Uzunlik</span><strong>{selected.length_km ?? '—'} km</strong></div>
              <div><span>Holati</span><strong>{STATUS_LABELS[selected.status]}</strong></div>
              <div><span>Kadastr</span><strong>{selected.cadastral_number || '—'}</strong></div>
              {selected.address && <div className="full"><span>Manzil</span><strong>{selected.address}</strong></div>}
              {selected.description && <div className="full"><span>Tavsif</span><p>{selected.description}</p></div>}
            </div>
            <div className="lands-detail-actions">
              <button type="button" className="btn btn-primary" onClick={() => navigate(`/map?land=${selected.id}`)}>
                Xaritada ochish
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => exportPdfCard(selected)}>
                PDF kartochka
              </button>
            </div>
          </aside>
        )}
      </div>

      {selectedVersions && (
        <div className="modal-backdrop" onClick={() => setSelectedVersions(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedVersions.land.public_id} — yillar kesimidagi versiyalar</h3>
            <table className="data-table">
              <thead>
                <tr><th>Yil</th><th>Maydon (ga)</th><th>Uzunlik (km)</th><th>Status</th><th>Izoh</th></tr>
              </thead>
              <tbody>
                {selectedVersions.versions.map((v) => (
                  <tr key={v.id}>
                    <td>{v.year}</td>
                    <td>{v.area_ha}</td>
                    <td>{v.length_km}</td>
                    <td>{v.status}</td>
                    <td>{v.change_note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="btn btn-ghost" onClick={() => setSelectedVersions(null)}>{t('common.close')}</button>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  )
}
