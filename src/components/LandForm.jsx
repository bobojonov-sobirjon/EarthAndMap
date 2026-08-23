import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { loc } from '../i18n/loc'
import { CURRENT_YEAR, YEARS } from '../constants/years'

const STATUS_KEYS = ['active', 'construction', 'damaged', 'closed', 'planned']

export default function LandForm({ categories, initial, geometry, onSubmit, onCancel }) {
  const { t, lang } = useI18n()
  const [form, setForm] = useState({
    name: initial?.name || '',
    category: initial?.category || categories[0]?.id || '',
    status: initial?.status || 'active',
    address: initial?.address || '',
    cadastral_number: initial?.cadastral_number || '',
    description: initial?.description || '',
    responsible_org: initial?.responsible_org || '',
    monitoring_year: initial?.monitoring_year || CURRENT_YEAR,
  })
  const [shapeFile, setShapeFile] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    const geom = geometry || initial?.geometry
    if (!geom && !shapeFile) {
      alert(t('form.drawGeom'))
      return
    }
    onSubmit({ ...form, geometry: geom, shapeFile })
  }

  return (
    <form className="panel land-form" onSubmit={handleSubmit}>
      <h3>{initial ? t('form.editObject') : t('form.newObject')}</h3>
      <label>{t('form.name')}<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label>
        {t('form.category')}
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{t(`layer.${c.code === 'park' ? 'istirohat' : c.code}`) || loc(c, 'name', lang)}</option>
          ))}
        </select>
      </label>
      <label>
        {t('map.status')}
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {STATUS_KEYS.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
        </select>
      </label>
      <label>
        {t('map.year')}
        <select value={form.monitoring_year} onChange={(e) => setForm({ ...form, monitoring_year: Number(e.target.value) })}>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </label>
      <label>{t('form.address')}<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
      <label>{t('form.cadastre')}<input value={form.cadastral_number} onChange={(e) => setForm({ ...form, cadastral_number: e.target.value })} /></label>
      <label>{t('form.org')}<input value={form.responsible_org} onChange={(e) => setForm({ ...form, responsible_org: e.target.value })} /></label>
      <label>{t('form.desc')}<textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      <label className="land-form__file">
        {t('form.shpFile')}
        <input
          type="file"
          accept=".zip,.shp,.geojson,.json,application/zip,application/json"
          onChange={(e) => setShapeFile(e.target.files?.[0] || null)}
        />
        <span className="hint">{t('form.shpHint')}</span>
        {shapeFile && <span className="success-hint">✓ {shapeFile.name}</span>}
      </label>
      {!geometry && !initial?.geometry && !shapeFile && (
        <p className="hint">{t('form.drawHint')}</p>
      )}
      {(geometry || initial?.geometry) && !shapeFile && (
        <p className="success-hint">✓ {t('form.geomOk')}</p>
      )}
      {shapeFile && (
        <p className="success-hint">✓ {t('form.shpWillReplace')}</p>
      )}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>{t('common.cancel')}</button>
        <button type="submit" className="btn btn-primary">{t('common.save')}</button>
      </div>
    </form>
  )
}
