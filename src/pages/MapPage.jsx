import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import GisMap from '../components/GisMap'
import LandDetail from '../components/LandDetail'
import LandForm from '../components/LandForm'
import MapControlPanel from '../components/MapControlPanel'
import MapYearBar from '../components/MapYearBar'
import NearestRoutesPanel from '../components/NearestRoutesPanel'
import { useAuth } from '../context/AuthContext'
import { landsApi } from '../api/services'
import { requestMapRefresh, useMapData } from '../hooks/useMapData'
import { filterResearchCategories, isResearchCategory } from '../constants/researchLayers'
import { useI18n } from '../i18n/I18nContext'
import { apiError } from '../i18n/apiError'
import client from '../api/client'

function featureMatchesLand(feature, key) {
  if (!key || !feature) return false
  const k = String(key).trim().toLowerCase()
  const vals = [
    feature.id,
    feature.properties?.id,
    feature.properties?.public_id,
  ]
  return vals.some((v) => v != null && String(v).trim().toLowerCase() === k)
}

export default function MapPage({ editable = false }) {
  const { t } = useI18n()
  const { canEdit: authCanEdit } = useAuth()
  const canEdit = Boolean(editable && authCanEdit)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [year, setYear] = useState(null)
  const yearReady = useRef(false)
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
  const [focusFeature, setFocusFeature] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [routes, setRoutes] = useState([])
  const [locating, setLocating] = useState(false)
  const [showNearest, setShowNearest] = useState(false)

  const focusKey = (searchParams.get('land') || '').trim()

  const {
    boundaries,
    features,
    config,
    loading,
    refreshing,
    error,
    refresh,
  } = useMapData({
    params: {
      ...queryParams,
      ...(Number.isFinite(Number(year)) && !focusKey ? { year } : {}),
    },
    pollIntervalMs: 30000,
    enabled: true,
  })

  const categories = useMemo(
    () => filterResearchCategories(config?.categories || []),
    [config],
  )

  const dataYears = config?.years || []

  useEffect(() => {
    if (!dataYears.length) return
    const nums = dataYears.map(Number)
    if (!yearReady.current) {
      yearReady.current = true
      setYear(nums[nums.length - 1])
      return
    }
    if (year == null) return
    if (!nums.includes(Number(year))) setYear(nums[nums.length - 1])
  }, [dataYears, year])

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
    if (focusKey) setYear(null)
  }, [focusKey])

  useEffect(() => {
    let alive = true
    if (!focusKey) {
      setFocusFeature(null)
      return undefined
    }

    const fromSnap = (features?.features || []).find((f) => featureMatchesLand(f, focusKey))
    if (fromSnap) {
      setFocusFeature(fromSnap)
      handleSelect(fromSnap.properties)
      const code = fromSnap.properties?.category_code
      if (code) {
        setVisibleLayers((prev) => {
          const next = { ...prev }
          Object.keys(next).forEach((k) => {
            if (!k.startsWith('boundary:')) next[k] = k === code || (code === 'park' && k === 'istirohat') || (code === 'istirohat' && k === 'park')
          })
          next[code] = true
          return next
        })
      }
      return undefined
    }

    const loadSolo = async () => {
      try {
        const { data } = await client.get(`/lands/${focusKey}/feature/`)
        if (!alive || !data?.geometry) return
        setFocusFeature(data)
        handleSelect(data.properties || data)
      } catch {
        if (alive) setFocusFeature(null)
      }
    }
    loadSolo()
    return () => { alive = false }
  }, [focusKey, features, handleSelect])

  const filteredGeojson = useMemo(() => {
    if (focusKey && focusFeature?.geometry) {
      return { type: 'FeatureCollection', features: [focusFeature] }
    }
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
    if (filters.category) {
      const cat = String(filters.category)
      list = list.filter((f) =>
        String(f.properties?.category_code || '') === cat
        || String(f.properties?.category || '') === cat,
      )
    }
    return { ...features, features: list }
  }, [features, filters.search, filters.mahalla, filters.category, focusKey, focusFeature])

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
      const file = data.shapeFile
      const payload = { ...data }
      delete payload.shapeFile
      if (file) {
        const parsed = await landsApi.parseGeometry(file)
        payload.geometry = parsed.data.geometry
        if (parsed.data.features > 1) {
          alert(t('form.shpMerged').replace('{n}', String(parsed.data.features)))
        }
      }
      if (!payload.geometry) {
        alert(t('form.drawGeom'))
        return
      }
      if (editLand) {
        await landsApi.update(editLand.id, payload)
      } else {
        await landsApi.create(payload)
      }
      setShowForm(false)
      setEditLand(null)
      setDrawGeometry(null)
      requestMapRefresh()
    } catch (err) {
      alert(apiError(err, t, 'msg.saveFail'))
    }
  }

  const handleCoordsChange = useCallback((text) => {
    setMapCoords(text)
  }, [])

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])

  const handlePickNearest = useCallback((props) => {
    if (!props) return
    setSelected(props)
    setShowForm(false)
  }, [])

  return (
    <div className={`map-page map-page--immersive${editable ? ' map-page--admin' : ''}`}>
      <div className="map-stage">
        <div className="map-print-header" aria-hidden="true">
          <strong>{t('map.title')}</strong>
          <span>Buxoro GIS · {new Date().toLocaleDateString()}</span>
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
          fitToBoundary={!focusKey}
          fitToFeatures={Boolean(focusKey || filters.category || filters.status || filters.mahalla || filters.search)}
          onUserLocation={setUserLocation}
          userLocation={userLocation}
          routes={routes}
          onNearest={() => setShowNearest(true)}
          nearestOpen={showNearest}
        />

        {focusKey && (
          <div className="map-focus-banner">
            <span>
              Только объект <b>{selected?.public_id || focusFeature?.properties?.public_id || focusKey}</b>
            </span>
            <button
              type="button"
              className="chip"
              onClick={() => navigate(editable ? '/admin-panel/map' : '/map')}
            >
              Показать все
            </button>
          </div>
        )}

        <div className="map-dock map-dock--left">
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
          <MapYearBar year={year} years={config?.years || []} onChange={setYear} />
        </div>

        {!showNearest && !selected && (
          <button
            type="button"
            className="map-nearest-fab"
            onClick={() => setShowNearest(true)}
          >
            {t('route.title')}
          </button>
        )}

        {selected && !showForm && (
          <div className="map-dock map-dock--right">
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
              onDetail={(land) => navigate(editable ? `/admin-panel/lands?land=${land.id}` : `/lands?land=${land.id}`)}
            />
          </div>
        )}

        {showNearest && createPortal(
          <div className="admin-modal route-modal-overlay" onClick={() => setShowNearest(false)}>
            <div className="admin-modal__card route-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <NearestRoutesPanel
                features={features}
                userLocation={userLocation}
                locating={locating}
                onNeedLocation={locateUser}
                onRoutes={setRoutes}
                onClose={() => setShowNearest(false)}
                onPick={handlePickNearest}
              />
            </div>
          </div>,
          document.body,
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
            <span>© {new Date().getFullYear()} {t('map.copyright')}</span>
            <span className="map-bottom-bar__sep">·</span>
            <span>{t('map.sources')}</span>
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
