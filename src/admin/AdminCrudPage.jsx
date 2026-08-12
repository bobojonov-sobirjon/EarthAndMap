import { useCallback, useEffect, useMemo, useState } from 'react'

function unwrapList(data) {
  if (Array.isArray(data)) return data
  if (data?.results) return data.results
  return []
}

function FieldInput({ field, value, onChange }) {
  const common = {
    value: value ?? '',
    onChange: (e) => {
      let v = e.target.value
      if (field.type === 'number') v = v === '' ? '' : Number(v)
      if (field.type === 'checkbox') v = e.target.checked
      onChange(field.key, v)
    },
  }

  if (field.type === 'checkbox') {
    return (
      <label className="admin-check">
        <input type="checkbox" checked={!!value} onChange={common.onChange} />
        {field.label}
      </label>
    )
  }

  if (field.type === 'textarea' || field.type === 'json') {
    return (
      <label className="admin-field">
        <span>{field.label}</span>
        <textarea
          rows={field.rows || 4}
          value={typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : (value ?? '')}
          onChange={(e) => {
            if (field.type === 'json') {
              try {
                onChange(field.key, e.target.value ? JSON.parse(e.target.value) : null)
              } catch {
                onChange(field.key, e.target.value)
              }
            } else {
              onChange(field.key, e.target.value)
            }
          }}
        />
      </label>
    )
  }

  if (field.type === 'select') {
    return (
      <label className="admin-field">
        <span>{field.label}</span>
        <select value={value ?? ''} onChange={common.onChange}>
          <option value="">—</option>
          {(field.options || []).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <label className="admin-field">
      <span>{field.label}</span>
      <input
        type={field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : 'text'}
        step={field.step || undefined}
        placeholder={field.placeholder || ''}
        {...common}
      />
    </label>
  )
}

/**
 * Универсальная CRUD-страница админ-панели.
 * config: { title, subtitle, api, idKey, columns, fields, readOnly?, searchPlaceholder? }
 */
export default function AdminCrudPage({ config }) {
  const {
    title, subtitle, api, idKey = 'id', columns, fields,
    readOnly = false, searchPlaceholder = 'Поиск...',
    defaultForm = {},
  } = config

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | row
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (search.trim()) params.search = search.trim()
      const { data } = await api.list(params)
      setRows(unwrapList(data))
    } catch (e) {
      setError(e?.response?.data?.detail || 'Ошибка загрузки')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [api, search])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setForm({ ...defaultForm })
    setEditing('new')
  }

  const openEdit = (row) => {
    const next = {}
    fields.forEach((f) => {
      next[f.key] = row[f.key] ?? (f.type === 'checkbox' ? false : '')
    })
    setForm(next)
    setEditing(row)
  }

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form }
      // drop empty password on update
      if (editing !== 'new' && 'password' in payload && !payload.password) {
        delete payload.password
      }
      if (editing === 'new') {
        await api.create(payload)
      } else {
        const id = editing[idKey]
        await api.update(id, payload)
      }
      setEditing(null)
      await load()
    } catch (err) {
      const d = err?.response?.data
      setError(typeof d === 'string' ? d : JSON.stringify(d || err.message))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row) => {
    if (!window.confirm('Удалить запись?')) return
    try {
      await api.remove(row[idKey])
      await load()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Ошибка удаления')
    }
  }

  const visibleCols = useMemo(() => columns, [columns])

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        <div className="admin-page__actions">
          <input
            className="admin-search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {!readOnly && (
            <button type="button" className="btn btn-primary" onClick={openNew}>
              + Добавить
            </button>
          )}
        </div>
      </header>

      {error && <div className="admin-error">{error}</div>}

      {editing && (
        <div className="admin-modal">
          <form className="admin-modal__card" onSubmit={save}>
            <div className="admin-modal__head">
              <h3>{editing === 'new' ? 'Новая запись' : 'Редактирование'}</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="admin-form-grid">
              {fields.map((f) => (
                <FieldInput key={f.key} field={f} value={form[f.key]} onChange={setField} />
              ))}
            </div>
            <div className="admin-modal__foot">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Отмена</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-wrap">
        {loading ? (
          <p className="muted" style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                {visibleCols.map((c) => <th key={c.key}>{c.label}</th>)}
                {!readOnly && <th></th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[idKey]}>
                  {visibleCols.map((c) => (
                    <td key={c.key}>
                      {c.render ? c.render(row[c.key], row) : formatCell(row[c.key])}
                    </td>
                  ))}
                  {!readOnly && (
                    <td className="admin-table__acts">
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => openEdit(row)}>Изменить</button>
                      {api.remove && (
                        <button type="button" className="btn btn-sm btn-ghost danger" onClick={() => remove(row)}>Удалить</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={visibleCols.length + 1}>Нет данных</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function formatCell(v) {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Да' : 'Нет'
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 60)
  return String(v)
}
