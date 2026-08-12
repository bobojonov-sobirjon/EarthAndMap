import { displayCategoryName } from '../constants/researchLayers'

const STATUS_LABELS = {
  active: 'Amalda',
  construction: 'Yangilanmoqda',
  damaged: 'Muammoli',
  closed: 'Yopiq',
  planned: 'Rejalashtirilgan',
}

const ROAD_CLASS = {
  magistral: 'I',
  shahar: 'II',
  mahalliy: 'III',
  piyoda: 'Piyoda',
}

const CATEGORY_TITLES = {
  yollar: "Avtomobil yo'li",
  suv: "Sug'orish tarmog'i",
  istirohat: "Istirohat bog'i",
  park: "Istirohat bog'i",
  qabriston: 'Qabriston',
}

function attrsForLand(land) {
  const code = land.category_code
  const rows = [{ label: 'Nomi', value: land.name }]

  if (code === 'yollar') {
    rows.push(
      { label: 'Kategoriyasi', value: ROAD_CLASS[land.road_class] || land.road_class || '—' },
      { label: 'Uzunligi', value: land.length_km != null ? `${land.length_km} km` : '—' },
      { label: 'Qoplama turi', value: land.surface_type || land.data_source || '—' },
      { label: 'Holati', value: STATUS_LABELS[land.status] || land.status },
    )
  } else if (code === 'suv') {
    rows.push(
      { label: 'Turi', value: land.water_type || 'Kanal / ariq' },
      { label: 'Uzunligi', value: land.length_km != null ? `${land.length_km} km` : '—' },
      { label: 'Holati', value: STATUS_LABELS[land.status] || land.status },
    )
  } else if (code === 'istirohat' || code === 'park') {
    rows.push(
      { label: 'Maydoni', value: land.area_ha != null ? `${land.area_ha} ga` : '—' },
      { label: 'Foydalanish turi', value: land.usage_type || 'Rekreatsiya' },
      { label: 'Ekologik holati', value: STATUS_LABELS[land.status] || land.status },
    )
  } else if (code === 'qabriston') {
    rows.push(
      { label: 'MFY', value: land.mahalla || '—' },
      { label: 'Maydoni', value: land.area_ha != null ? `${land.area_ha} ga` : '—' },
      { label: 'Kadastr raqami', value: land.cadastral_number || '—' },
      { label: 'Holati', value: STATUS_LABELS[land.status] || land.status },
    )
  } else {
    rows.push(
      { label: 'Kategoriya', value: displayCategoryName(land) || land.category_name },
      { label: 'Holati', value: STATUS_LABELS[land.status] || land.status },
      land.area_ha != null && { label: 'Maydoni', value: `${land.area_ha} ga` },
      land.length_km != null && { label: 'Uzunligi', value: `${land.length_km} km` },
      land.mahalla && { label: 'MFY', value: land.mahalla },
    )
  }

  if (land.updated_at || land.last_updated) {
    rows.push({
      label: 'Oxirgi yangilangan sana',
      value: new Date(land.updated_at || land.last_updated).toLocaleDateString('uz'),
    })
  }

  return rows.filter(Boolean)
}

export default function LandDetail({ land, onClose, onEdit, onDetail, canEdit, floating = false }) {
  if (!land) return null
  const rows = attrsForLand(land)
  const title = CATEGORY_TITLES[land.category_code] || displayCategoryName(land.category_code) || 'Obyekt'

  return (
    <div className={`land-detail-popup ${floating ? 'land-detail-popup--floating' : ''}`}>
      <div className="land-detail-popup__header">
        <h3>{title}</h3>
        <button type="button" className="btn-close" onClick={onClose} aria-label="Yopish">×</button>
      </div>
      <div className="land-detail-popup__body">
        {rows.map((r) => (
          <div key={r.label} className="land-detail-row">
            <span className="land-detail-row__label">{r.label}</span>
            <span className="land-detail-row__value">{r.value}</span>
          </div>
        ))}
      </div>
      <div className="land-detail-popup__footer">
        <button
          type="button"
          className="btn btn-primary btn-block land-detail-popup__cta"
          onClick={() => onDetail?.(land)}
        >
          Batafsil ma&apos;lumot
        </button>
        {canEdit && (
          <button type="button" className="btn btn-ghost btn-block" onClick={() => onEdit(land)}>
            Tahrirlash
          </button>
        )}
      </div>
    </div>
  )
}
