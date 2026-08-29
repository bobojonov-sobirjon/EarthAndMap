import { useEffect, useMemo, useRef, useState } from 'react'
import { BASEMAP_IDS } from '../map/basemaps'
import { buildLayerGroups, ROAD_CLASS_LIST, WATER_CLASS_LIST, roadLayerKey, waterLayerKey, buildTypeFilterOptions } from '../constants/researchLayers'
import { useI18n } from '../i18n/I18nContext'
import { catName, loc } from '../i18n/loc'
import PrettySelect from './PrettySelect'
import TypeFilterSelect from './TypeFilterSelect'

const LAYER_ICONS = {
  yollar: 'road',
  suv: 'water',
  istirohat: 'park',
  qabriston: 'cemetery',
}

function IconLayers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}

function IconMore() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  )
}

function IconEye({ off = false }) {
  if (off) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 3l18 18" strokeLinecap="round" />
        <path d="M10.6 10.6a2 2 0 002.8 2.8" />
        <path d="M6.7 6.7C4.6 8.3 3.2 10.4 2 12c1.8 3.6 6 6 10 6 1.6 0 3.1-.4 4.4-1" />
        <path d="M9.9 4.2A10.8 10.8 0 0112 4c4 0 8.2 2.4 10 6-.6 1.2-1.5 2.3-2.6 3.2" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function LayerSwatch({ type, color, variant }) {
  if (variant === 'mfy-outline') {
    return <span className="map-layers-swatch map-layers-swatch--mfy" />
  }
  if (variant === 'mfy-point') {
    return <span className="map-layers-swatch map-layers-swatch--mfy-point" />
  }
  if (type === 'road') {
    return <span className="map-layers-swatch map-layers-swatch--road" style={{ '--c': color }} />
  }
  if (type === 'water') {
    return <span className="map-layers-swatch map-layers-swatch--water" style={{ '--c': color }} />
  }
  if (type === 'water-line') {
    return <span className="map-layers-swatch map-layers-swatch--water-line" style={{ '--c': color }} />
  }
  if (type === 'park-poly') {
    return <span className="map-layers-swatch map-layers-swatch--park" style={{ '--c': color }} />
  }
  if (type === 'park') {
    return <span className="map-layers-swatch map-layers-swatch--park" style={{ '--c': color }} />
  }
  if (type === 'cemetery') {
    return <span className="map-layers-swatch map-layers-swatch--cemetery" style={{ '--c': color }} />
  }
  return <span className="map-layers-swatch" style={{ background: color }} />
}

function LayerRow({
  label,
  visible,
  onToggle,
  swatch,
  indent = false,
  expandable = false,
  expanded = false,
  onExpandToggle,
}) {
  return (
    <div className={`map-layers-row${visible ? ' is-on' : ''}${indent ? ' map-layers-row--sub' : ''}${expandable ? ' map-layers-row--parent' : ''}`}>
      {swatch}
      {expandable && (
        <button
          type="button"
          className={`map-layers-row__fold${expanded ? ' is-open' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onExpandToggle?.()
          }}
          aria-expanded={expanded}
          aria-label={expanded ? 'Yopish' : 'Ochish'}
        >
          {expanded ? '−' : '+'}
        </button>
      )}
      <button type="button" className="map-layers-row__main" onClick={onToggle}>
        <span className="map-layers-row__label">{label}</span>
        <span className={`map-layers-row__eye${visible ? '' : ' is-off'}`}>
          <IconEye off={!visible} />
        </span>
      </button>
    </div>
  )
}

export default function MapToolbar({
  basemap = 'satellite',
  onBasemapChange,
  boundaries = [],
  categories = [],
  visibleLayers,
  onToggle,
  onToggleGroup,
  filters,
  onFiltersChange,
  onFiltersClear,
  mahallas = [],
  years = [],
  onOpenNearest,
  compareHref = '/compare',
}) {
  const { t, lang } = useI18n()
  const rootRef = useRef(null)
  const [layersOpen, setLayersOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [suvOpen, setSuvOpen] = useState(false)
  const groups = buildLayerGroups(categories)
  const yearList = useMemo(
    () => years.filter((y) => Number.isFinite(Number(y))).map(Number),
    [years],
  )

  const hasInlineFilters = yearList.length > 0 || categories.length > 0 || mahallas.length > 0
  const extrasActive = Boolean(filters.search?.trim())

  const mahallaOptions = useMemo(() => [
    { value: '', label: t('map.mfyAll') },
    ...mahallas.map((m) => {
      const val = typeof m === 'string' ? m : m.name
      const label = typeof m === 'string' ? m : (loc(m, 'name', lang) || m.name)
      return { value: val, label }
    }),
  ], [mahallas, lang, t])

  const categoryOptions = useMemo(
    () => buildTypeFilterOptions(categories, { t, lang, catName }),
    [categories, lang, t],
  )

  const typeMainOptions = useMemo(
    () => categoryOptions.filter((o) => o.value && !o.isRoads && !o.isParks),
    [categoryOptions],
  )

  const roadsLabel = useMemo(() => {
    const row = categoryOptions.find((o) => o.isRoads)
    return row?.label || t('layer.yollar')
  }, [categoryOptions, t])

  const parksLabel = useMemo(() => {
    const row = categoryOptions.find((o) => o.isParks)
    return row?.label || t('layer.istirohat')
  }, [categoryOptions, t])

  const yearOptions = useMemo(() => [
    { value: '', label: t('map.monitoring') },
    ...yearList.map((y) => ({ value: String(y), label: String(y) })),
  ], [yearList, t])

  const layerKeys = useMemo(() => {
    const keys = boundaries.map((b) => `boundary:${b.code}`)
    keys.push('mfy_boundaries', 'mfy_points')
    groups.forEach((g) => {
      g.codes.forEach((c) => keys.push(c))
      if (g.key === 'yollar') ROAD_CLASS_LIST.forEach((r) => keys.push(roadLayerKey(r.id)))
      if (g.key === 'suv') WATER_CLASS_LIST.forEach((w) => keys.push(waterLayerKey(w.id)))
    })
    return keys
  }, [boundaries, groups])

  const allLayersOn = layerKeys.every((k) => visibleLayers[k] !== false)

  const toggleAllLayers = () => {
    const next = !allLayersOn
    layerKeys.forEach((k) => {
      if ((visibleLayers[k] !== false) !== next) onToggle(k)
    })
  }

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) {
        setLayersOpen(false)
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const openLayers = () => {
    setMoreOpen(false)
    setLayersOpen((v) => !v)
  }

  const openMore = () => {
    setLayersOpen(false)
    setMoreOpen((v) => !v)
  }

  return (
    <div className="map-toolbar-wrap" ref={rootRef}>
      {layersOpen && (
        <div className="map-toolbar-pop map-toolbar-pop--layers" role="dialog" aria-label={t('map.layers')}>
          <div className="map-toolbar-pop__head">
            <strong>{t('map.layers')}</strong>
            <button type="button" className="map-toolbar-pop__eye-all" onClick={toggleAllLayers} title={t('map.layersToggleAll')}>
              <IconEye off={!allLayersOn} />
            </button>
          </div>
          <div className="map-toolbar-pop__list">
            {boundaries.map((b) => {
              const key = `boundary:${b.code}`
              const visible = visibleLayers[key] !== false
              return (
                <LayerRow
                  key={key}
                  label={loc(b, 'name', lang) || b.name}
                  visible={visible}
                  onToggle={() => onToggle(key)}
                  swatch={<LayerSwatch color={b.color} />}
                />
              )
            })}
            <LayerRow
              label={t('map.mfyBoundaries')}
              visible={visibleLayers.mfy_boundaries !== false}
              onToggle={() => onToggle('mfy_boundaries')}
              swatch={<LayerSwatch variant="mfy-outline" />}
            />
            <LayerRow
              label={t('map.mfyPoints')}
              visible={visibleLayers.mfy_points !== false}
              onToggle={() => onToggle('mfy_points')}
              swatch={<LayerSwatch variant="mfy-point" />}
              indent
            />
            {groups.map((g) => {
              if (g.key === 'yollar') return null
              const visible = g.codes.every((code) => visibleLayers[code] !== false)
              const isSuv = g.key === 'suv'
              return (
                <div key={g.key} className={`map-layers-group${isSuv && suvOpen ? ' is-open' : ''}`}>
                  <LayerRow
                    label={t(`layer.${g.key}`)}
                    visible={visible}
                    onToggle={() => {
                      if (onToggleGroup) onToggleGroup(g.codes)
                      else g.codes.forEach((c) => onToggle(c))
                    }}
                    swatch={<LayerSwatch type={LAYER_ICONS[g.key]} color={g.color} />}
                    expandable={isSuv}
                    expanded={isSuv && suvOpen}
                    onExpandToggle={isSuv ? () => setSuvOpen((v) => !v) : undefined}
                  />
                  {isSuv && (
                    <div className={`map-layers-group__kids${suvOpen ? ' is-open' : ''}`}>
                      <div className="map-layers-group__kids-inner">
                        {WATER_CLASS_LIST.map((w) => {
                          const key = waterLayerKey(w.id)
                          const subOn = visible && visibleLayers[key] !== false
                          return (
                            <LayerRow
                              key={key}
                              label={t(`layer.water.${w.id}`)}
                              visible={subOn}
                              onToggle={() => onToggle(key)}
                              swatch={<LayerSwatch type="water-line" color={w.color} />}
                              indent
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {moreOpen && (
        <div className="map-toolbar-pop map-toolbar-pop--more" role="dialog" aria-label={t('map.extras.title')}>
          <div className="map-toolbar-pop__head">
            <strong>{t('map.search')}</strong>
            {extrasActive && (
              <button type="button" className="map-toolbar-pop__clear" onClick={() => onFiltersChange({ ...filters, search: '' })}>
                {t('map.filterClear')}
              </button>
            )}
          </div>
          <input
            type="text"
            className="map-toolbar-pop__input"
            placeholder={t('map.searchPh')}
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          />
          <div className="map-toolbar-pop__links">
            {onOpenNearest && (
              <button type="button" className="map-toolbar-pop__link" onClick={onOpenNearest}>
                {t('map.extras.nearest')}
              </button>
            )}
            <a href={compareHref} className="map-toolbar-pop__link">{t('map.extras.compare')}</a>
            <a href="https://open.ngis.uz/" target="_blank" rel="noopener noreferrer" className="map-toolbar-pop__link">
              {t('map.extras.ngis')}
            </a>
          </div>
        </div>
      )}

      <div className="map-toolbar" role="toolbar" aria-label={t('map.toolbar')}>
        <button
          type="button"
          className={`map-toolbar__layers${layersOpen ? ' is-open' : ''}`}
          onClick={openLayers}
          aria-expanded={layersOpen}
        >
          <IconLayers />
          <span>{t('map.layers')}</span>
        </button>

        <div className="map-toolbar__sep" aria-hidden />

        <div className="map-toolbar__basemaps" role="group" aria-label={t('map.basemap')}>
          {BASEMAP_IDS.map((id) => (
            <button
              key={id}
              type="button"
              className={`map-toolbar__basemap${basemap === id ? ' is-on' : ''}`}
              onClick={() => onBasemapChange?.(id)}
              aria-pressed={basemap === id}
            >
              {t(`map.basemap.${id}`)}
            </button>
          ))}
        </div>

        {hasInlineFilters && (
          <>
            <div className="map-toolbar__sep map-toolbar__sep--filters" aria-hidden />
            <div className="map-toolbar__filters" role="group" aria-label={t('map.filter')}>
              {yearList.length > 0 && (
                <PrettySelect
                  variant="toolbar"
                  className="map-toolbar__filter map-toolbar__filter--year"
                  value={filters.year || ''}
                  onChange={(v) => onFiltersChange({ ...filters, year: v })}
                  options={yearOptions}
                  placeholder={t('map.monitoring')}
                  isSearchable={false}
                  menuPlacement="auto"
                />
              )}
              {categories.length > 0 && (
                  <TypeFilterSelect
                  value={filters.category || ''}
                  onChange={(v) => onFiltersChange({ ...filters, category: v })}
                  mainOptions={typeMainOptions}
                  roadsLabel={roadsLabel}
                  parksLabel={parksLabel}
                  allRoadsLabel={t('map.roadAll')}
                  allParksLabel={t('map.parkAll')}
                  allLabel={t('map.allYears')}
                  placeholder={t('map.type')}
                  t={t}
                />
              )}
              {mahallas.length > 0 && (
                <PrettySelect
                  variant="toolbar"
                  className="map-toolbar__filter map-toolbar__filter--mfy"
                  value={filters.mahalla || ''}
                  onChange={(v) => onFiltersChange({ ...filters, mahalla: v })}
                  options={mahallaOptions}
                  placeholder={t('map.mfyAll')}
                  isSearchable
                  menuPlacement="auto"
                  noOptionsMessage={t('map.selectEmpty')}
                />
              )}
            </div>
          </>
        )}

        <div className="map-toolbar__sep" aria-hidden />

        <button
          type="button"
          className={`map-toolbar__more${moreOpen ? ' is-open' : ''}${extrasActive ? ' has-badge' : ''}`}
          onClick={openMore}
          aria-expanded={moreOpen}
          aria-label={t('map.extras.title')}
        >
          <IconMore />
          {extrasActive && <span className="map-toolbar__badge">1</span>}
        </button>
      </div>
    </div>
  )
}
