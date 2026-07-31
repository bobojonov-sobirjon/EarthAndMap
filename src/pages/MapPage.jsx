import { useCallback, useEffect, useMemo, useState } from 'react'
import FilterPanel from '../components/FilterPanel'
import GisMap from '../components/GisMap'
import LandDetail from '../components/LandDetail'
import LandForm from '../components/LandForm'
import LayerPanel from '../components/LayerPanel'
import { useAuth } from '../context/AuthContext'
import { landsApi, statsApi } from '../api/services'
import { requestMapRefresh, useMapData } from '../hooks/useMapData'

export default function MapPage() {
  const { canEdit } = useAuth()
  const [stats, setStats] = useState(null)
  const [filters, setFilters] = useState({
    search: '', category: '', status: '', area_min: '', area_max: '',
  })
  const [queryParams, setQueryParams] = useState({})
  const [visibleLayers, setVisibleLayers] = useState({})
  const [layersInitialized, setLayersInitialized] = useState(false)
  const [selected, setSelected] = useState(null)
  const [history, setHistory] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editLand, setEditLand] = useState(null)
  const [drawMode, setDrawMode] = useState(false)
  const [drawGeometry, setDrawGeometry] = useState(null)
  const [drawType, setDrawType] = useState('Polygon')
  const [monitorYear, setMonitorYear] = useState(2026)
  const [versions, setVersions] = useState([])

  const {
    boundaries,
    features,
    config,
    loading,
    refreshing,
    error,
    lastUpdated,
    refresh,
  } = useMapData({
    params: { ...queryParams, ...(monitorYear ? { year: monitorYear } : {}) },
    pollIntervalMs: 30000,
    enabled: true,
  })

  const categories = config?.categories || []

  // Default visibility — faqat birinchi muvaffaqiyatli yuklashda
  useEffect(() => {
    if (!config || layersInitialized) return
    const vis = {}
    ;(config.categories || []).forEach((c) => {
      vis[c.code] = c.code !== 'yollar'
    })
    ;(boundaries?.features || []).forEach((f) => {
      const code = f.properties?.code
      if (code) vis[`boundary:${code}`] = true
    })
    setVisibleLayers(vis)
    setLayersInitialized(true)
  }, [config, boundaries, layersInitialized])

  // Yangi boundary code'lar paydo bo'lsa — default yoqish
  useEffect(() => {
    if (!boundaries?.features?.length || !layersInitialized) return
    setVisibleLayers((prev) => {
      const next = { ...prev }
      let changed = false
      boundaries.features.forEach((f) => {
        const key = `boundary:${f.properties?.code}`
        if (f.properties?.code && !(key in next)) {
          next[key] = true
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [boundaries, layersInitialized])

  useEffect(() => {
    statsApi.get().then(({ data }) => setStats(data.totals)).catch(() => {})
  }, [features])

  const filteredGeojson = useMemo(() => {
    if (!features) return null
    let list = features.features || []
    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter((f) =>
        f.properties?.name?.toLowerCase().includes(q)
        || f.properties?.address?.toLowerCase().includes(q),
      )
    }
    if (filters.area_min) {
      list = list.filter((f) => (f.properties?.area_sqm || 0) >= Number(filters.area_min))
    }
    if (filters.area_max) {
      list = list.filter((f) => (f.properties?.area_sqm || 0) <= Number(filters.area_max))
    }
    return { ...features, features: list }
  }, [features, filters.search, filters.area_min, filters.area_max])

  const handleSearch = () => {
    const params = {}
    if (filters.category) params.category = filters.category
    if (filters.status) params.status = filters.status
    setQueryParams(params)
  }

  const handleSelect = useCallback(async (props) => {
    setSelected(props)
    setShowForm(false)
    try {
      const [hist, vers] = await Promise.all([
        landsApi.history(props.id),
        landsApi.versions(props.id),
      ])
      setHistory(hist.data)
      setVersions(vers.data)
    } catch {
      setHistory([])
      setVersions([])
    }
  }, [])

  const handleToggleLayer = (code) => {
    setVisibleLayers((prev) => ({ ...prev, [code]: !prev[code] }))
  }

  const handleDrawComplete = (geom) => {
    setDrawGeometry(geom)
    setDrawMode(false)
  }

  const handleSave = async (data) => {
    try {
      if (editLand) {
        await landsApi.update(editLand.id, data)
      } else {
        await landsApi.create(data)
      }
      setShowForm(false)
      setEditLand(null)
      setDrawGeometry(null)
      requestMapRefresh()
      const { data: s } = await statsApi.get()
      setStats(s.totals)
    } catch (err) {
      alert(err.response?.data?.detail || 'Xatolik yuz berdi')
    }
  }

  const startCreate = (type = 'Polygon') => {
    setEditLand(null)
    setDrawGeometry(null)
    setDrawType(type)
    setDrawMode(true)
    setShowForm(true)
    setSelected(null)
  }

  return (
    <div className="map-page">
      <div className="map-toolbar">
        <div>
          <h2>Interaktiv xarita — Buxoro shahri</h2>
          {lastUpdated && (
            <small className="map-updated-hint">
              Yangilangan: {lastUpdated.toLocaleTimeString('uz')}
              {refreshing ? ' · yangilanmoqda...' : ''}
            </small>
          )}
        </div>
        {canEdit && (
          <div className="toolbar-actions">
            <button type="button" className="btn btn-primary" onClick={() => startCreate('Polygon')}>+ Poligon</button>
            <button type="button" className="btn btn-secondary" onClick={() => startCreate('LineString')}>+ Yo'l</button>
            <button type="button" className="btn btn-secondary" onClick={() => startCreate('Point')}>+ Nuqta</button>
          </div>
        )}
      </div>
      <div className="map-layout">
        <div className="map-sidebars left">
          <LayerPanel
            categories={categories}
            boundaries={(boundaries?.features || []).map((f) => f.properties)}
            visibleLayers={visibleLayers}
            onToggle={handleToggleLayer}
            stats={stats}
          />
          <FilterPanel
            filters={filters}
            categories={categories}
            onChange={setFilters}
            onSearch={handleSearch}
          />
        </div>
        <div className="map-container">
          <GisMap
            center={config?.center}
            geojson={filteredGeojson}
            boundary={boundaries}
            visibleLayers={visibleLayers}
            selectedId={selected?.id}
            onSelect={handleSelect}
            drawMode={drawMode}
            drawType={drawType}
            onDrawComplete={handleDrawComplete}
            loading={loading && !features}
            error={error}
            refreshing={refreshing}
            onRefresh={refresh}
          />
          <div className="map-year-slider">
            <span>Monitoring yili:</span>
            {[2018, 2020, 2022, 2024, 2026].map((y) => (
              <button
                key={y}
                type="button"
                className={`chip ${monitorYear === y ? 'active' : ''}`}
                onClick={() => setMonitorYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
        <div className="map-sidebars right">
          {showForm && canEdit && (
            <LandForm
              categories={categories}
              initial={editLand}
              geometry={drawGeometry}
              onSubmit={handleSave}
              onCancel={() => { setShowForm(false); setDrawMode(false) }}
            />
          )}
          {selected && !showForm && (
            <LandDetail
              land={selected}
              history={history}
              versions={versions}
              onClose={() => setSelected(null)}
              canEdit={canEdit}
              onEdit={async (land) => {
                const { data } = await landsApi.get(land.id)
                setEditLand(data)
                setShowForm(true)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
