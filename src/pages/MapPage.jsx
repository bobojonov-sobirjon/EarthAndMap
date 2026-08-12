import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import GisMap from '../components/GisMap'
import LandDetail from '../components/LandDetail'
import LandForm from '../components/LandForm'
import MapControlPanel from '../components/MapControlPanel'
import { useAuth } from '../context/AuthContext'
import { landsApi } from '../api/services'
import { requestMapRefresh, useMapData } from '../hooks/useMapData'
import { filterResearchCategories, isResearchCategory } from '../constants/researchLayers'

export default function MapPage() {
  const { canEdit } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    search: '', category: '', status: '', mahalla: '',
  })
  const [queryParams, setQueryParams] = useState({})
  const [visibleLayers, setVisibleLayers] = useState({})
  const [layersInitialized, setLayersInitialized] = useState(false)
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editLand, setEditLand] = useState(null)
  const [drawMode, setDrawMode] = useState(false)
  const [drawGeometry, setDrawGeometry] = useState(null)
  const [drawType, setDrawType] = useState('Polygon')
  const [mapCoords, setMapCoords] = useState('39.7689° N, 64.4283° E | UTM 40N')

  const {
    boundaries,
    features,
    config,
    loading,
    refreshing,
    error,
    refresh,
  } = useMapData({
    params: { ...queryParams },
    pollIntervalMs: 30000,
    enabled: true,
  })

  const categories = useMemo(
    () => filterResearchCategories(config?.categories || []),
    [config],
  )

  const mahallas = useMemo(() => {
    const set = new Set()
    ;(features?.features || []).forEach((f) => {
      const m = f.properties?.mahalla
      if (m) set.add(m)
    })
    return [...set].sort()
  }, [features])

  useEffect(() => {
    if (!config || layersInitialized) return
    const vis = {}
    ;(config.categories || []).forEach((c) => {
      vis[c.code] = isResearchCategory(c.code)
    })
    ;(boundaries?.features || []).forEach((f) => {
      const code = f.properties?.code
      if (code) vis[`boundary:${code}`] = true
    })
    setVisibleLayers(vis)
    setLayersInitialized(true)
  }, [config, boundaries, layersInitialized])

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

  const handleSelect = useCallback(async (props) => {
    setSelected(props)
    setShowForm(false)
  }, [])

  useEffect(() => {
    const landId = searchParams.get('land')
    if (!landId || !features?.features?.length) return
    const found = features.features.find((f) => String(f.properties?.id) === String(landId))
    if (found) handleSelect(found.properties)
  }, [searchParams, features, handleSelect])

  const filteredGeojson = useMemo(() => {
    if (!features) return null
    let list = (features.features || []).filter((f) => isResearchCategory(f.properties?.category_code))
    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter((f) =>
        f.properties?.name?.toLowerCase().includes(q)
        || f.properties?.address?.toLowerCase().includes(q)
        || f.properties?.mahalla?.toLowerCase().includes(q)
        || f.properties?.public_id?.toLowerCase().includes(q),
      )
    }
    if (filters.mahalla) {
      list = list.filter((f) => (f.properties?.mahalla || '') === filters.mahalla)
    }
    return { ...features, features: list }
  }, [features, filters.search, filters.mahalla])

  const handleSearch = () => {
    const params = {}
    if (filters.category) params.category = filters.category
    if (filters.status) params.status = filters.status
    setQueryParams(params)
  }

  useEffect(() => {
    const params = {}
    if (filters.category) params.category = filters.category
    if (filters.status) params.status = filters.status
    setQueryParams(params)
  }, [filters.category, filters.status])

  const handleToggleLayer = (code) => {
    setVisibleLayers((prev) => ({ ...prev, [code]: !prev[code] }))
  }

  const handleToggleGroup = (codes) => {
    setVisibleLayers((prev) => {
      const currentlyOn = codes.every((c) => prev[c] !== false)
      const next = { ...prev }
      codes.forEach((c) => { next[c] = !currentlyOn })
      return next
    })
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
    } catch (err) {
      alert(err.response?.data?.detail || 'Xatolik yuz berdi')
    }
  }

  const handleCoordsChange = useCallback((text) => {
    setMapCoords(text)
  }, [])

  return (
    <div className="map-page map-page--immersive">
      <div className="map-stage">
        <div className="map-print-header" aria-hidden="true">
          <strong>Interaktiv xarita — Buxoro shahri</strong>
          <span>Buxoro GIS · {new Date().toLocaleDateString('uz')}</span>
        </div>

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
          showEditTools={canEdit}
          onCoordsChange={handleCoordsChange}
        />

        <MapControlPanel
          boundaries={(boundaries?.features || []).map((f) => f.properties)}
          categories={config?.categories || []}
          visibleLayers={visibleLayers}
          onToggle={handleToggleLayer}
          onToggleGroup={handleToggleGroup}
          filters={filters}
          onChange={setFilters}
          onSearch={handleSearch}
          mahallas={mahallas}
        />

        {selected && !showForm && (
          <LandDetail
            land={selected}
            onClose={() => setSelected(null)}
            canEdit={canEdit}
            floating
            onEdit={async (land) => {
              const { data } = await landsApi.get(land.id)
              setEditLand(data)
              setShowForm(true)
            }}
            onDetail={(land) => navigate(`/lands?land=${land.id}`)}
          />
        )}

        {showForm && canEdit && (
          <div className="map-form-overlay">
            <LandForm
              categories={categories}
              initial={editLand}
              geometry={drawGeometry}
              onSubmit={handleSave}
              onCancel={() => { setShowForm(false); setDrawMode(false) }}
            />
          </div>
        )}

        <footer className="map-bottom-bar">
          <div className="map-bottom-bar__left">
            <span>© {new Date().getFullYear()} Buxoro GIS platformasi</span>
            <span className="map-bottom-bar__sep">·</span>
            <span>Ma&apos;lumot manbalari: Esri, Davlat kadastri, OSM, Sentinel-2</span>
          </div>
          <div className="map-bottom-bar__right">
            <span className="map-scale-hint">0 — 3 km</span>
            <span className="map-bottom-bar__sep">|</span>
            <span>{mapCoords}</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
