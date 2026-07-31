import { useState } from 'react'

const STATUSES = [
  { value: 'active', label: 'Faol' },
  { value: 'construction', label: 'Qurilish jarayonida' },
  { value: 'damaged', label: 'Zararlangan' },
  { value: 'closed', label: 'Yopiq' },
  { value: 'planned', label: 'Rejalashtirilgan' },
]

export default function LandForm({ categories, initial, geometry, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    category: initial?.category || categories[0]?.id || '',
    status: initial?.status || 'active',
    address: initial?.address || '',
    cadastral_number: initial?.cadastral_number || '',
    description: initial?.description || '',
    responsible_org: initial?.responsible_org || '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const geom = geometry || initial?.geometry
    if (!geom) {
      alert('Xaritada geometriyani chizing!')
      return
    }
    onSubmit({ ...form, geometry: geom })
  }

  return (
    <form className="panel land-form" onSubmit={handleSubmit}>
      <h3>{initial ? 'Obyektni tahrirlash' : 'Yangi obyekt'}</h3>
      <label>Nomi<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label>
        Kategoriya
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name_uz}</option>)}
        </select>
      </label>
      <label>
        Status
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </label>
      <label>Manzil<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
      <label>Kadastr raqami<input value={form.cadastral_number} onChange={(e) => setForm({ ...form, cadastral_number: e.target.value })} /></label>
      <label>Mas'ul tashkilot<input value={form.responsible_org} onChange={(e) => setForm({ ...form, responsible_org: e.target.value })} /></label>
      <label>Tavsif<textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      {!geometry && !initial?.geometry && (
        <p className="hint">Xaritada chizish tugmalaridan foydalaning</p>
      )}
      {(geometry || initial?.geometry) && (
        <p className="success-hint">✓ Geometriya belgilangan</p>
      )}
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Bekor</button>
        <button type="submit" className="btn btn-primary">Saqlash</button>
      </div>
    </form>
  )
}
