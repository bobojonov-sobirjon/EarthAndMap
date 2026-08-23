import { useEffect, useRef, useState } from 'react'

const PRESETS = [
  '#27ae60', '#22c55e', '#16a34a', '#0ea5e9', '#38bdf8', '#3b82f6',
  '#64748b', '#94a3b8', '#f97316', '#eab308', '#a855f7', '#e11d48',
  '#14532d', '#164e63', '#1e3a5f', '#7c2d12', '#ffffff', '#111827',
]

export default function ColorField({ value, onChange, label }) {
  const [open, setOpen] = useState(false)
  const [hex, setHex] = useState(value || '#27ae60')
  const box = useRef(null)

  useEffect(() => { setHex(value || '#27ae60') }, [value])

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (box.current && !box.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const apply = (c) => {
    const v = c.startsWith('#') ? c : `#${c}`
    setHex(v)
    if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v)
  }

  return (
    <div className="color-field" ref={box}>
      {label && <span className="color-field__label">{label}</span>}
      <div className="color-field__row">
        <button
          type="button"
          className="color-field__swatch"
          style={{ background: hex }}
          onClick={() => setOpen((v) => !v)}
          aria-label="Выбрать цвет"
        />
        <input
          className="color-field__hex"
          value={hex}
          onChange={(e) => apply(e.target.value)}
          maxLength={7}
          spellCheck={false}
        />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen((v) => !v)}>
          {open ? 'Закрыть' : 'Палитра'}
        </button>
      </div>
      {open && (
        <div className="color-field__pop" role="dialog" aria-label="Палитра">
          <div className="color-field__presets">
            {PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                className={c.toLowerCase() === hex.toLowerCase() ? 'is-on' : ''}
                style={{ background: c }}
                onClick={() => apply(c)}
                title={c}
              />
            ))}
          </div>
          <div className="color-field__fine">
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#27ae60'}
              onChange={(e) => apply(e.target.value)}
            />
            <span>Точный цвет</span>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>
              Готово
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
