import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminGuide from './AdminGuide'
import ColorField from './ColorField'
import PrettySelect from '../components/PrettySelect'
import { useI18n } from '../i18n/I18nContext'
import { apiError } from '../i18n/apiError'
import PageLoader from '../components/PageLoader'

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

  if (field.type === 'color') {
    return (
      <ColorField
        label={field.label}
        value={value || '#3388ff'}
        onChange={(v) => onChange(field.key, v)}
      />
    )
  }

  if (field.type === 'select') {
    return (
      <label className="admin-field">
        <span>{field.label}</span>
        <PrettySelect
          placeholder="—"
          value={value ?? ''}
      onChange={(v) => onChange(field.key, field.key === 'monitoring_year' ? Number(v) : v)}
          options={field.options || []}
        />
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
    defaultForm = {}, help,
  } = config

  const { t } = useI18n()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [editing, setEditing] = useState(null) // null | 'new' | row
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [formLang, setFormLang] = useState('uz')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (search.trim()) params.search = search.trim()
      const { data } = await api.list(params)
      setRows(unwrapList(data))
    } catch (e) {
      setError(apiError(e, t, 'msg.loadFail'))
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [api, search, t])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setForm({ ...defaultForm })
    setFormLang('uz')
    setEditing('new')
  }

  const openEdit = (row) => {
    const next = {}
    fields.forEach((f) => {
      next[f.key] = row[f.key] ?? (f.type === 'checkbox' ? false : '')
    })
    setForm(next)
    setFormLang('uz')
    setEditing(row)
  }

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setOk('')
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
      setOk(t('msg.saved'))
      await load()
    } catch (err) {
      setError(apiError(err, t, 'msg.saveFail'))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row) => {
    if (!window.confirm(t('msg.confirmDelete'))) return
    try {
      await api.remove(row[idKey])
      setOk(t('msg.deleted'))
      await load()
    } catch (err) {
      setError(apiError(err, t, 'msg.deleteFail'))
    }
  }

  const visibleCols = useMemo(() => columns, [columns])
  const i18nFields = fields.filter((f) => f.lang)
  const otherFields = fields.filter((f) => !f.lang)
  const shownI18n = i18nFields.filter((f) => f.lang === formLang)

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
              + {t('admin.add')}
            </button>
          )}
        </div>
      </header>

      {help && <AdminGuide title={help.title} steps={help.steps} note={help.note} />}

      {error && <div className="admin-error">{error}</div>}
      {ok && <div className="admin-ok">{ok}</div>}

      {editing && (
        <div className="admin-modal">
          <form className="admin-modal__card" onSubmit={save}>
            <div className="admin-modal__head">
              <h3>{editing === 'new' ? t('admin.newRow') : t('admin.editRow')}</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>✕</button>
            </div>
            {i18nFields.length > 0 && (
              <div className="i18n-tabs">
                {['uz', 'ru', 'en'].map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={formLang === l ? 'is-on' : ''}
                    onClick={() => setFormLang(l)}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
            <div className="admin-form-grid">
              {shownI18n.map((f) => (
                <FieldInput key={f.key} field={f} value={form[f.key]} onChange={setField} />
              ))}
              {otherFields.map((f) => (
                <FieldInput key={f.key} field={f} value={form[f.key]} onChange={setField} />
              ))}
            </div>
            <div className="admin-modal__foot">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>{t('common.cancel')}</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-table-wrap">
        {loading ? (
          <PageLoader compact />
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
