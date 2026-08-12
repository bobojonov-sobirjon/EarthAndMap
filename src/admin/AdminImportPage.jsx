import { useEffect, useState } from 'react'
import { adminApi } from '../api/services'
import client from '../api/client'

export default function AdminImportPage() {
  const [cats, setCats] = useState([])
  const [target, setTarget] = useState('layer')
  const [category, setCategory] = useState('')
  const [prefix, setPrefix] = useState('')
  const [replace, setReplace] = useState(false)
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.categories.list().then(({ data }) => {
      const list = Array.isArray(data) ? data : (data.results || [])
      setCats(list)
      if (list[0]?.code) setCategory(list[0].code)
    }).catch(() => {})
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Выберите файл')
      return
    }
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('target', target)
      if (target === 'layer') {
        fd.append('category', category)
        fd.append('replace', replace ? '1' : '0')
        if (prefix) fd.append('prefix', prefix)
      } else {
        fd.append('boundary_code', 'bukhara_city')
        fd.append('boundary_type', 'city')
      }
      const { data } = await client.post('/import/', fd)
      setResult(data)
    } catch (err) {
      const d = err?.response?.data
      setError(d?.detail || (typeof d === 'string' ? d : JSON.stringify(d || err.message)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <p className="eyebrow">Карта</p>
          <h2>Импорт файлов</h2>
          <p className="muted">Загрузите Shapefile (.zip) или GeoJSON — объекты появятся на карте</p>
        </div>
      </header>

      <div className="admin-import-grid">
        <form className="admin-import-card" onSubmit={submit}>
          <label className="admin-field">
            <span>Что загружаем</span>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="layer">Слой объектов (дороги, парки…)</option>
              <option value="boundary">Граница города</option>
            </select>
          </label>

          {target === 'layer' && (
            <>
              <label className="admin-field">
                <span>Категория на карте</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {cats.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name_ru || c.name_uz} ({c.code})
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>Префикс имени (если в файле нет name)</span>
                <input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="Например: Парк" />
              </label>
              <label className="admin-check" style={{ paddingTop: 0 }}>
                <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
                Заменить все объекты этой категории
              </label>
            </>
          )}

          <label className="admin-drop">
            <input
              type="file"
              accept=".zip,.shp,.geojson,.json"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <strong>{file ? file.name : 'Выберите файл'}</strong>
            <span>.zip (shp+shx+dbf) или .geojson</span>
          </label>

          {error && <div className="admin-error">{error}</div>}
          {result && (
            <div className="admin-ok">
              Загружено: <b>{result.imported}</b> объектов
              {result.category ? ` · категория ${result.category}` : ''}
              {result.replaced ? ' · старые записи этой категории удалены' : ''}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Импорт...' : 'Загрузить на карту'}
          </button>
        </form>

        <aside className="admin-import-help">
          <h3>Как это работает</h3>
          <ol>
            <li>Подготовьте Shapefile: <code>.shp + .shx + .dbf</code> в одном ZIP.</li>
            <li>Или один файл <code>.geojson</code>.</li>
            <li>Выберите категорию (дороги, орошение, парки…).</li>
            <li>После импорта объекты сразу видны на интерактивной карте.</li>
          </ol>
          <p className="muted">
            Раньше это делалось командой <code>python manage.py import_shapefiles</code>.
            Теперь то же самое — через эту страницу, без кода.
          </p>
        </aside>
      </div>
    </div>
  )
}
