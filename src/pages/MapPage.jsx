import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import GisMap from '../components/GisMap'
import LandDetail from '../components/LandDetail'
import LandForm from '../components/LandForm'
import MapToolbar from '../components/MapToolbar'
import MfyPassportCard from '../components/MfyPassportCard'
import NearestRoutesPanel from '../components/NearestRoutesPanel'
import SplitCompareView from '../components/SplitCompareView'
import { useAuth } from '../context/AuthContext'
import { landsApi, mapApi } from '../api/services'
import { requestMapRefresh, useMapData } from '../hooks/useMapData'
import { filterResearchCategories, isResearchCategory, ROAD_CLASS_LIST, WATER_CLASS_LIST, PARK_CLASS_LIST, roadLayerKey, waterLayerKey, parkLayerKey, parseTypeFilter, matchesTypeFilter } from '../constants/researchLayers'
import { buildMfyInsightIndex, mfyPassport, DEFAULT_MONITORING_YEAR } from '../map/mfyInsights'
import { useI18n } from '../i18n/I18nContext'
import { apiError } from '../i18n/apiError'
import client from '../api/client'
import { geoErrorKey, getUserPosition, httpsUpgradeUrl } from '../map/geolocation'

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

/** Fokus/kategoriya uchun qatlamlar: yo'l/suv/bog' pastki turlarini ham yoqadi. */
function applyCategoryVisibility(prev, code) {
  const next = { ...prev }
  Object.keys(next).forEach((k) => {
    if (k.startsWith('boundary:')) return
    if (k === 'mfy_boundaries' || k === 'mfy_points') {
      next[k] = false
      return
    }
    next[k] = false
  })
  if (!code) return next
  next[code] = true
  if (code === 'park') next.istirohat = true
  if (code === 'istirohat') next.park = true
  if (code === 'yollar') {
    ROAD_CLASS_LIST.forEach((r) => { next[roadLayerKey(r.id)] = true })
  }
  if (code === 'suv') {
    WATER_CLASS_LIST.forEach((w) => { next[waterLayerKey(w.id)] = true })
  }
  if (code === 'istirohat' || code === 'park') {
    PARK_CLASS_LIST.forEach((p) => { next[parkLayerKey(p.id)] = true })
  }
  return next
}

/** Qatlamlar ro'yxatida bir xil code (turli yillar) takrorlanmasin. */
function uniqueBoundaries(features = []) {
  const byCode = new Map()
  features.forEach((f) => {
    const p = f.properties || {}
    const code = p.code
    if (!code) return
    const prev = byCode.get(code)
    if (!prev || Number(p.monitoring_year) > Number(prev.monitoring_year || 0)) {
      byCode.set(code, p)
    }
  })
  return [...byCode.values()]
}

export default function MapPage({ editable = false }) {
  const { t } = useI18n()
  const { canEdit: authCanEdit } = useAuth()
  const canEdit = Boolean(editable && authCanEdit)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlYear = (searchParams.get('year') || '').trim()
  const urlCategory = (searchParams.get('category') || '').trim()
  const [filters, setFilters] = useState({
    search: '',
    category: urlCategory,
    mahalla: '',
    year: urlYear || String(DEFAULT_MONITORING_YEAR),
  })
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
  const [basemap, setBasemap] = useState('satellite')
  const [registryMahallas, setRegistryMahallas] = useState([])
  const [heatmapOn, setHeatmapOn] = useState(false)
  const [splitOn, setSplitOn] = useState(false)
  const [splitYearA, setSplitYearA] = useState(2020)
  const [splitYearB, setSplitYearB] = useState(2026)

  const focusKey = (searchParams.get('land') || '').trim()
  const insightMode = heatmapOn || splitOn

  const mapYear = useMemo(() => {
    // Split-compare uchun backenddan barcha yillar kerak (SplitCompareView o'zi filtr qiladi).
    // Qolgan rejimlarda esa server year bo'yicha filtrni qo'llasin.
    if (splitOn) return null
    const y = Number(filters.year)
    if (Number.isFinite(y) && y > 0) return y
    return null
  }, [splitOn, filters.year])

  const {
    boundaries,
    features,
    mahallas: mahallaBoundaries,
    config,
    loading,
    refreshing,
    error,
    refresh,
  } = useMapData({
    params: {
      ...(mapYear ? { year: mapYear } : {}),
    },
    pollIntervalMs: 30000,
    enabled: true,
  })

  const dbYears = useMemo(
    () => [...new Set((config?.years || [])
      .filter((y) => Number.isFinite(Number(y)))
      .map(Number))].sort((a, b) => b - a),
    [config],
  )

  const defaultYear = dbYears[0] ?? DEFAULT_MONITORING_YEAR
  const selectedYear = Number(filters.year) || defaultYear

  useEffect(() => {
    if (!dbYears.length) return
    const cur = Number(filters.year)
    if (!Number.isFinite(cur) || !dbYears.includes(cur)) {
      // Fokus obyekt yili bazada bo'lmasa ham saqlansin; aks holda default.
      if (focusKey && Number.isFinite(cur) && cur > 0) return
      setFilters((f) => ({ ...f, year: String(defaultYear) }))
    }
  }, [dbYears, defaultYear, focusKey, filters.year])

  const mfyEnabled = selectedYear === defaultYear && !focusKey

  useEffect(() => {
    if (mfyEnabled) return
    setHeatmapOn(false)
    setFilters((f) => (f.mahalla ? { ...f, mahalla: '' } : f))
  }, [mfyEnabled])

  useEffect(() => {
    if (!urlCategory) return
    setFilters((f) => (f.category === urlCategory ? f : { ...f, category: urlCategory }))
  }, [urlCategory])

  useEffect(() => {
    if (!urlYear) return
    const y = Number(urlYear)
    if (!Number.isFinite(y) || y <= 0) return
    setFilters((f) => (String(f.year) === String(y) ? f : { ...f, year: String(y) }))
  }, [urlYear])

  const categories = useMemo(
    () => filterResearchCategories(config?.categories || []),
    [config],
  )

  const mahallas = useMemo(() => {
    const byName = new Map()
    registryMahallas.forEach((m) => {
      if (m?.name) byName.set(m.name, m)
    })
    ;(features?.features || []).forEach((f) => {
      const name = f.properties?.mahalla
      if (name && !byName.has(name)) byName.set(name, name)
    })
    ;(mahallaBoundaries?.features || []).forEach((f) => {
      if (f.properties?.kind === 'point') return
      const name = f.properties?.name
      if (name && !byName.has(name)) byName.set(name, f.properties)
    })
    return [...byName.values()].sort((a, b) => {
      const na = typeof a === 'string' ? a : a.name
      const nb = typeof b === 'string' ? b : b.name
      return na.localeCompare(nb, 'uz')
    })
  }, [features, registryMahallas, mahallaBoundaries])

  useEffect(() => {
    let alive = true
    mapApi.mahallas({ is_active: true })
      .then(({ data }) => {
        if (!alive) return
        const rows = data.results || data || []
        setRegistryMahallas(rows)
      })
      .catch(() => { /* reestr bo'lmasa — faqat geojson dan */ })
    return () => { alive = false }
  }, [])

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
    vis.mfy_boundaries = true
    vis.mfy_points = false
    ROAD_CLASS_LIST.forEach((r) => { vis[roadLayerKey(r.id)] = true })
    WATER_CLASS_LIST.forEach((w) => { vis[waterLayerKey(w.id)] = true })
    PARK_CLASS_LIST.forEach((p) => { vis[parkLayerKey(p.id)] = true })
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
    // Fokusda yilni tozalamaymiz — aks holda barcha yillardagi shahar chegarasi chiqadi.
    if (!focusKey && filters.year === '') {
      setFilters((f) => ({ ...f, year: String(defaultYear) }))
    }
  }, [focusKey, defaultYear, filters.year])

  useEffect(() => {
    let alive = true
    if (!focusKey) {
      setFocusFeature(null)
      return undefined
    }

    const applyFocus = (feature) => {
      if (!feature?.geometry) return
      setFocusFeature(feature)
      const props = feature.properties || {}
      handleSelect(props)
      const y = Number(props.monitoring_year)
      if (Number.isFinite(y) && y > 0) {
        setFilters((f) => (String(f.year) === String(y) ? f : { ...f, year: String(y) }))
      }
      const code = props.category_code
      if (code) {
        setVisibleLayers((prev) => applyCategoryVisibility(prev, code))
      }
    }

    const fromSnap = (features?.features || []).find((f) => featureMatchesLand(f, focusKey))
    if (fromSnap) {
      applyFocus(fromSnap)
      return undefined
    }

    const loadSolo = async () => {
      try {
        const { data } = await client.get(`/lands/${focusKey}/feature/`)
        if (!alive || !data?.geometry) return
        applyFocus(data)
      } catch {
        if (alive) setFocusFeature(null)
      }
    }
    loadSolo()
    return () => { alive = false }
  }, [focusKey, features, handleSelect])

  // Reyestrdan kategoriya (yo'llar/qabriston...) bilan kelganda faqat shu qatlam.
  useEffect(() => {
    if (focusKey || !urlCategory || !layersInitialized) return
    const { category } = parseTypeFilter(urlCategory)
    if (!category) return
    setVisibleLayers((prev) => applyCategoryVisibility(prev, category))
  }, [focusKey, urlCategory, layersInitialized])

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
    // MFY: faqat mahalla maydoni to'ldirilgan obyektlarni filtrlash.
    // Bog'/qabristonda mahalla bo'sh — ular qatlam orqali ko'rinadi.
    if (filters.mahalla) {
      const want = filters.mahalla.toLowerCase()
      list = list.filter((f) => {
        const m = (f.properties?.mahalla || '').trim()
        if (!m) return true
        return m.toLowerCase() === want
      })
    }
    // Yo'l / istirohat pastki turi: boshqa qatlamlar yashirilmasin.
    if (filters.category) {
      const { category, road_class } = parseTypeFilter(filters.category)
      if (category === 'yollar') {
        list = list.filter((f) => {
          if (f.properties?.category_code !== 'yollar') return true
          if (!road_class) return true
          return (f.properties?.road_class || '') === road_class
        })
      } else if (category === 'istirohat' || category === 'park') {
        list = list.filter((f) => {
          const code = f.properties?.category_code
          const isPark = code === 'istirohat' || code === 'park'
          if (!isPark) return true
          if (!road_class) return true
          return (f.properties?.road_class || '') === road_class
        })
      } else {
        list = list.filter((f) => matchesTypeFilter(f, filters.category))
      }
    }
    return { ...features, features: list }
  }, [features, filters.search, filters.mahalla, filters.category, filters.year, focusKey, focusFeature])

  const mfyInsights = useMemo(
    () => buildMfyInsightIndex(features?.features || [], mahallaBoundaries),
    [features, mahallaBoundaries],
  )

  const heatByName = useMemo(() => {
    if (!heatmapOn || !mfyEnabled) return null
    const map = {}
    mfyInsights.rows.forEach((r) => {
      // Zichlik: maydon birligiga obyekt (kam = past, ko'p = yuqori)
      map[r.name.toLowerCase()] = r.heat
    })
    return map
  }, [heatmapOn, mfyEnabled, mfyInsights])

  const passport = useMemo(
    () => (filters.mahalla ? mfyPassport(mfyInsights, filters.mahalla) : null),
    [filters.mahalla, mfyInsights],
  )

  const handleToggleLayer = (code) => {
    setVisibleLayers((prev) => {
      const currentlyVisible = prev[code] !== false
      const nextVisible = !currentlyVisible
      const next = { ...prev, [code]: nextVisible }
      if (code === 'yollar') {
        ROAD_CLASS_LIST.forEach((r) => { next[roadLayerKey(r.id)] = nextVisible })
      }
      if (code === 'suv') {
        WATER_CLASS_LIST.forEach((w) => { next[waterLayerKey(w.id)] = nextVisible })
      }
      if (code === 'istirohat' || code === 'park') {
        PARK_CLASS_LIST.forEach((p) => { next[parkLayerKey(p.id)] = nextVisible })
        next.istirohat = nextVisible
        next.park = nextVisible
      }
      if (nextVisible && String(code).startsWith('water:')) {
        next.suv = true
      }
      if (nextVisible && String(code).startsWith('park:')) {
        next.istirohat = true
        next.park = true
      }
      if (nextVisible && String(code).startsWith('rec:')) {
        next.istirohat = true
        next.park = true
      }
      return next
    })
  }

  const handleToggleGroup = (codes) => {
    setVisibleLayers((prev) => {
      const currentlyOn = codes.every((c) => prev[c] !== false)
      const nextOn = !currentlyOn
      const next = { ...prev }
      codes.forEach((c) => { next[c] = nextOn })
      if (codes.includes('suv')) {
        WATER_CLASS_LIST.forEach((w) => { next[waterLayerKey(w.id)] = nextOn })
      }
      if (codes.includes('yollar')) {
        ROAD_CLASS_LIST.forEach((r) => { next[roadLayerKey(r.id)] = nextOn })
      }
      if (codes.includes('istirohat') || codes.includes('park')) {
        PARK_CLASS_LIST.forEach((p) => { next[parkLayerKey(p.id)] = nextOn })
      }
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

  const locateUser = useCallback(async () => {
    setLocating(true)
    try {
      const pos = await getUserPosition()
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    } catch (err) {
      const key = geoErrorKey(err)
      if (key === 'route.gps.insecure') {
        const httpsUrl = httpsUpgradeUrl()
        const goHttps = window.confirm(`${t(key)}\n\n${httpsUrl}`)
        if (goHttps && httpsUrl) window.location.replace(httpsUrl)
      } else {
        window.alert(t(key))
      }
    } finally {
      setLocating(false)
    }
  }, [t])

  const handlePickNearest = useCallback((props) => {
    if (!props) return
    setSelected(props)
    setShowForm(false)
  }, [])

  const fitFeaturesKey = useMemo(() => {
    if (focusKey) return `land:${focusKey}`
    const parts = [filters.category, filters.mahalla, filters.search].filter(Boolean)
    return parts.join('|')
  }, [focusKey, filters.category, filters.mahalla, filters.search])

  return (
    <div className={`map-page map-page--immersive${editable ? ' map-page--admin' : ''}`}>
      <div className="map-stage">
        <div className="map-print-header" aria-hidden="true">
          <strong>{t('map.title')}</strong>
          <span>Buxoro GIS · {new Date().toLocaleDateString()}</span>
        </div>

        {!splitOn && (
          <GisMap
            center={config?.center}
            geojson={filteredGeojson}
            boundary={boundaries}
            mahallas={mfyEnabled ? mahallaBoundaries : null}
            mfyHighlight={mfyEnabled ? filters.mahalla : ''}
            heatByName={heatByName}
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
            fitToBoundary={!focusKey && !filters.mahalla}
            boundaryFitKey={String(mapYear ?? DEFAULT_MONITORING_YEAR)}
            fitToFeatures={Boolean(fitFeaturesKey)}
            fitFeaturesKey={fitFeaturesKey}
            onUserLocation={setUserLocation}
            userLocation={userLocation}
            routes={routes}
            onNearest={() => setShowNearest(true)}
            nearestOpen={showNearest}
            basemap={basemap}
            onBasemapChange={setBasemap}
            heatmapOn={heatmapOn}
            onToggleHeatmap={mfyEnabled ? () => {
              setHeatmapOn((v) => !v)
              setSplitOn(false)
            } : undefined}
            splitOn={splitOn}
            onToggleSplit={() => {
              setSplitOn((v) => {
                const next = !v
                if (next) setHeatmapOn(false)
                return next
              })
            }}
          />
        )}

        {splitOn && (
          <SplitCompareView
            collection={features}
            yearA={splitYearA}
            yearB={splitYearB}
            onYearA={setSplitYearA}
            onYearB={setSplitYearB}
            basemap={basemap}
            onClose={() => setSplitOn(false)}
          />
        )}

        {heatmapOn && !splitOn && (
          <div className="map-heat-legend" aria-hidden>
            <span>{t('map.heatmap.low')}</span>
            <span className="map-heat-legend__bar" />
            <span>{t('map.heatmap.high')}</span>
          </div>
        )}

        {passport && !splitOn && mfyEnabled && (
          <MfyPassportCard
            passport={passport}
            onClose={() => setFilters((f) => ({ ...f, mahalla: '' }))}
          />
        )}

        {!splitOn && !mfyEnabled && !focusKey && (
          <div className="map-mfy-year-notice" role="status">
            {t('map.mfyYearOnly').replace('{year}', String(DEFAULT_MONITORING_YEAR))}
          </div>
        )}

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

        <MapToolbar
          basemap={basemap}
          onBasemapChange={setBasemap}
          boundaries={uniqueBoundaries(boundaries?.features || [])}
          categories={config?.categories || []}
          visibleLayers={visibleLayers}
          onToggle={handleToggleLayer}
          onToggleGroup={handleToggleGroup}
          filters={filters}
          onFiltersChange={setFilters}
          onFiltersClear={() => setFilters({
            search: '', category: '', mahalla: '', year: String(DEFAULT_MONITORING_YEAR),
          })}
          mahallas={mfyEnabled ? mahallas : []}
          mfyEnabled={mfyEnabled}
          years={dbYears}
          onOpenNearest={() => setShowNearest(true)}
          compareHref={editable ? '/admin-panel/compare' : '/compare'}
        />

        {!showNearest && !selected && !splitOn && (
          <button
            type="button"
            className="map-nearest-fab"
            onClick={() => setShowNearest(true)}
          >
            {t('route.title')}
          </button>
        )}

        {selected && !showForm && (
          <div className="map-dock map-dock--left map-dock--detail">
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
