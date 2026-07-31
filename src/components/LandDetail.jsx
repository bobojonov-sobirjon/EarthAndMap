const STATUS_LABELS = {
  active: 'Yaxshi',
  construction: 'Qurilish jarayonida',
  damaged: 'Zararlangan',
  closed: 'Yopiq',
  planned: 'Rejalashtirilgan',
}

export default function LandDetail({ land, history, versions = [], onClose, onEdit, canEdit }) {
  if (!land) return null

  return (
    <div className="panel land-detail">
      <div className="panel-header">
        <h3>{land.public_id ? `${land.public_id}` : land.name}</h3>
        <button type="button" className="btn-close" onClick={onClose}>×</button>
      </div>
      <p className="detail-title">{land.name}</p>
      <div className="detail-grid">
        <div><span>Kategoriya</span><strong>{land.category_name}</strong></div>
        <div><span>Status</span><strong>{STATUS_LABELS[land.status] || land.status}</strong></div>
        {land.area_ha != null && <div><span>Maydon</span><strong>{land.area_ha} ga</strong></div>}
        {land.area_sqm && !land.area_ha && <div><span>Maydon</span><strong>{Number(land.area_sqm).toLocaleString()} m²</strong></div>}
        {land.length_km != null && <div><span>Uzunlik</span><strong>{land.length_km} km</strong></div>}
        {land.mahalla && <div><span>Mahalla</span><strong>{land.mahalla}</strong></div>}
        {land.address && <div className="full"><span>Manzil</span><strong>{land.address}</strong></div>}
        {land.monitoring_year && <div><span>Monitoring yili</span><strong>{land.monitoring_year}</strong></div>}
        {land.data_source && <div><span>Manba</span><strong>{land.data_source}</strong></div>}
        {land.responsible_org && <div className="full"><span>Mas'ul</span><strong>{land.responsible_org}</strong></div>}
        {land.description && <div className="full"><span>Tavsif</span><p>{land.description}</p></div>}
      </div>

      {versions?.length > 0 && (
        <div className="history-section">
          <h4>Yillar bo‘yicha o‘zgarish</h4>
          <table className="mini-table">
            <thead><tr><th>Yil</th><th>ga</th></tr></thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.id}><td>{v.year}</td><td>{v.area_ha}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && (
        <button type="button" className="btn btn-primary btn-block" onClick={() => onEdit(land)}>
          Tahrirlash
        </button>
      )}
      {history?.length > 0 && (
        <div className="history-section">
          <h4>O'zgarishlar tarixi</h4>
          <ul>
            {history.map((h) => (
              <li key={h.id}>
                <span>{new Date(h.changed_at).toLocaleString('uz')}</span>
                <span>{h.change_type} — {h.description || h.field_name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
