import { useEffect, useState } from 'react'
import { displayCategoryName } from '../constants/researchLayers'
import { landsApi } from '../api/services'
import { useI18n } from '../i18n/I18nContext'
import { dateLocale, loc, locName, localizePhrase } from '../i18n/loc'
import { IconEye, IconPencil } from './MapIcons'

const ROAD_CLASS = {
  magistral: 'I',
  shahar: 'II',
  mahalliy: 'III',
  piyoda: 'popup.pedestrian',
}

function statusLabel(t, status) {
  if (!status) return '—'
  const k = `status.${status}`
  const v = t(k)
  return v === k ? status : v
}

function attrsForLand(land, lang, t) {
  const code = land.category_code
  const name = locName(land, lang) || '—'
  const rows = [{ label: t('popup.name'), value: name }]

  if (code === 'yollar') {
    const road = ROAD_CLASS[land.road_class]
    rows.push(
      { label: t('popup.category'), value: road === 'popup.pedestrian' ? t('popup.pedestrian') : (road || land.road_class || '—') },
      { label: t('popup.length'), value: land.length_km != null ? `${land.length_km} km` : '—' },
      { label: t('popup.surface'), value: localizePhrase(land.surface_type || land.data_source || '—', lang) },
      { label: t('popup.status'), value: statusLabel(t, land.status) },
    )
  } else if (code === 'suv') {
    rows.push(
      { label: t('popup.waterType'), value: localizePhrase(land.water_type || t('popup.canal'), lang) },
      { label: t('popup.length'), value: land.length_km != null ? `${land.length_km} km` : '—' },
      { label: t('popup.status'), value: statusLabel(t, land.status) },
    )
  } else if (code === 'istirohat' || code === 'park') {
    rows.push(
      { label: t('popup.area'), value: land.area_ha != null && Number(land.area_ha) < 50000 ? `${land.area_ha} ga` : '—' },
      { label: t('popup.year'), value: land.monitoring_year || '—' },
      { label: t('popup.useType'), value: localizePhrase(land.usage_type || t('popup.recreation'), lang) },
      { label: t('popup.eco'), value: statusLabel(t, land.status) },
    )
  } else if (code === 'qabriston') {
    rows.push(
      { label: t('popup.mfy'), value: loc(land, 'mahalla', lang) || land.mahalla || '—' },
      { label: t('popup.area'), value: land.area_ha != null && Number(land.area_ha) < 50000 ? `${land.area_ha} ga` : '—' },
      { label: t('popup.cadastre'), value: land.cadastral_number || '—' },
      { label: t('popup.status'), value: statusLabel(t, land.status) },
    )
  } else {
    rows.push(
      { label: t('popup.category'), value: displayCategoryName(land, lang) || loc({ name: land.category_name, name_ru: land.category_name_ru, name_en: land.category_name_en }, 'name', lang) },
      { label: t('popup.status'), value: statusLabel(t, land.status) },
    )
    if (land.area_ha != null && Number(land.area_ha) < 50000) {
      rows.push({ label: t('popup.area'), value: `${land.area_ha} ga` })
    }
    if (land.length_km != null) {
      rows.push({ label: t('popup.length'), value: `${land.length_km} km` })
    }
    if (land.mahalla) rows.push({ label: t('popup.mfy'), value: land.mahalla })
  }

  if (land.updated_at || land.last_updated) {
    rows.push({
      label: t('popup.updated'),
      value: new Date(land.updated_at || land.last_updated).toLocaleDateString(dateLocale(lang)),
    })
  }

  const addr = loc(land, 'address', lang) || land.address
  if (addr) rows.push({ label: t('popup.address'), value: addr })

  return rows.filter(Boolean)
}

export default function LandDetail({ land, onClose, onEdit, onDetail, canEdit, floating = false }) {
  const { lang, t } = useI18n()
  const [versions, setVersions] = useState([])

  useEffect(() => {
    if (!land?.id) return undefined
    let alive = true
    landsApi.versions(land.id).then(({ data }) => {
      if (alive) setVersions(Array.isArray(data) ? data : [])
    }).catch(() => { if (alive) setVersions([]) })
    return () => { alive = false }
  }, [land?.id])

  if (!land) return null
  const rows = attrsForLand(land, lang, t)
  const catKey = land.category_code === 'park' ? 'istirohat' : land.category_code
  const title = t(`layer.${catKey}`) !== `layer.${catKey}`
    ? t(`layer.${catKey}`)
    : (displayCategoryName(land, lang) || locName(land, lang))

  return (
    <div className={`land-detail-popup ${floating ? 'land-detail-popup--floating' : ''}`}>
      <div className="land-detail-popup__header">
        <div className="land-detail-popup__title">
          <h3>{title}</h3>
          <button
            type="button"
            className="land-detail-icon-btn"
            onClick={() => onDetail?.(land)}
            title={t('lands.more')}
            aria-label={t('lands.more')}
          >
            <IconEye size={17} />
          </button>
          {canEdit && (
            <button
              type="button"
              className="land-detail-icon-btn"
              onClick={() => onEdit?.(land)}
              title={t('form.editObject')}
              aria-label={t('form.editObject')}
            >
              <IconPencil size={16} />
            </button>
          )}
        </div>
        <button type="button" className="btn-close" onClick={onClose} aria-label={t('common.close')}>×</button>
      </div>
      <div className="land-detail-popup__body">
        {rows.map((r) => (
          <div key={r.label} className="land-detail-row">
            <span className="land-detail-row__label">{r.label}</span>
            <span className="land-detail-row__value">{r.value}</span>
          </div>
        ))}
        {versions.length > 0 && (
          <div className="land-timeline">
            <span className="land-detail-row__label">{t('popup.years')}</span>
            <ul>
              {versions.map((v) => (
                <li key={v.id || v.year}>
                  <b>{v.year}</b>
                  <span>{v.area_ha != null ? `${v.area_ha} ga` : (v.length_km != null ? `${v.length_km} km` : '—')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="land-detail-popup__footer">
        {(land.public_id || land.id) && (
          <span className="land-detail-chip">ID {land.public_id || land.id}</span>
        )}
        {land.monitoring_year && (
          <span className="land-detail-chip">{land.monitoring_year}</span>
        )}
        {(land.mahalla || loc(land, 'mahalla', lang)) && (
          <span className="land-detail-chip">{loc(land, 'mahalla', lang) || land.mahalla}</span>
        )}
        <p className="land-detail-hint">{t('popup.hintMore')}</p>
      </div>
    </div>
  )
}
