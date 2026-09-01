import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'
import AdminGuide from './AdminGuide'
import PrettySelect from '../components/PrettySelect'

const URBAN_YEARS = [2000, 2010, 2015, 2020, 2025]

const UPLOAD_HINTS = [
  'Shapefile o‘qilmoqda va atributlar ajratilmoqda…',
  'GeoTIFF (klassifikatsiya) qayta ishlanmoqda…',
  'Xarita preview yaratilmoqda — katta fayl 1–3 daqiqa olishi mumkin…',
  'Yuklash tugaguncha bu yorliqni yopmang.',
]

function unwrapList(data) {
  if (Array.isArray(data)) return data
  if (data?.results) return data.results
  return []
}

function fmtHa(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function formatElapsed(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function AdminUrbanizationMapsPage() {
  const [rasterRows, setRasterRows] = useState([])
  const [vectorRows, setVectorRows] = useState([])
  const [year, setYear] = useState(2010)
  const [shpFile, setShpFile] = useState(null)
  const [tifFile, setTifFile] = useState(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [hintI, setHintI] = useState(0)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const load = () => {
    client.get('/urbanization-maps/')
      .then(({ data }) => setRasterRows(unwrapList(data)))
      .catch(() => setRasterRows([]))
    client.get('/urbanization-vectors/')
      .then(({ data }) => setVectorRows(unwrapList(data)))
      .catch(() => setVectorRows([]))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!busy) {
      setElapsed(0)
      setHintI(0)
      return undefined
    }
    const tick = setInterval(() => setElapsed((n) => n + 1), 1000)
    const hint = setInterval(() => setHintI((i) => (i + 1) % UPLOAD_HINTS.length), 4500)
    return () => {
      clearInterval(tick)
      clearInterval(hint)
    }
  }, [busy])

  const mergedRows = useMemo(() => {
    const byYear = new Map()
    rasterRows.forEach((r) => {
      byYear.set(r.year, { year: r.year, raster: r, vector: null })
    })
    vectorRows.forEach((v) => {
      const row = byYear.get(v.year) || { year: v.year, raster: null, vector: null }
      row.vector = v
      byYear.set(v.year, row)
    })
    return [...byYear.values()].sort((a, b) => a.year - b.year)
  }, [rasterRows, vectorRows])

  const existingRow = useMemo(
    () => mergedRows.find((r) => r.year === year) || null,
    [mergedRows, year],
  )

  const filesReady = Boolean(shpFile && tifFile)
  const oneFilePending = Boolean(shpFile || tifFile) && !filesReady

  const submit = async (e) => {
    e.preventDefault()
    if (!shpFile || !tifFile) {
      setError('Выберите shapefile и классификацию GeoTIFF')
      return
    }
    setBusy(true)
    setError('')
    setOk('')
    try {
      const fd = new FormData()
      fd.append('year', String(year))
      fd.append('shapefile', shpFile)
      fd.append('classified_tif', tifFile)
      if (note) fd.append('note', note)
      const { data } = await client.post('/urbanization/bundle/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000,
      })
      const urban = data.vector?.urban_area_ha ?? data.raster?.urban_area_ha
      const nonUrban = data.vector?.non_urban_area_ha ?? data.raster?.non_urban_area_ha
      setOk(
        `Год ${year} загружен · Urban ${fmtHa(urban)} га · Non-urban ${fmtHa(nonUrban)} га`
        + (data.vector?.class_field ? ` · ${data.vector.class_field}` : '')
        + (data.vector?.feature_count ? ` · ${data.vector.feature_count} obj` : ''),
      )
      setShpFile(null)
      setTifFile(null)
      setNote('')
      load()
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Ошибка загрузки'
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail))
    } finally {
      setBusy(false)
    }
  }

  const removeYear = async (row) => {
    if (!window.confirm(`Удалить данные урбанизации за ${row.year} год?`)) return
    if (row.vector?.id) await client.delete(`/urbanization-vectors/${row.vector.id}`)
    if (row.raster?.id) await client.delete(`/urbanization-maps/${row.raster.id}`)
    load()
  }

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <div>
          <h1>Карты урбанизации</h1>
          <p className="muted">Два файла на год: shapefile (.shp/.zip) + классификация GeoTIFF (.tif/.zip)</p>
        </div>
        <Link className="btn btn-ghost" to="/urbanization" target="_blank">Открыть на сайте</Link>
      </div>

      <AdminGuide
        title="Порядок загрузки"
        steps={[
          'Выберите год: 2000, 2010, 2015, 2020 или 2025.',
          'Shapefile: .shp/.zip с gridcode (0 = sariq, 1 = ko\'k) va barcha atributlar.',
          'GeoTIFF: klassifikatsiya (.tif yoki ZIP ichida .tif + .tfw).',
          '«Загрузить» bosing — yuklash va tahlil shu paytda boshlanadi.',
        ]}
      />

      <form className={`admin-card admin-urban-form ${busy ? 'is-busy' : ''}`} onSubmit={submit}>
        {busy && (
          <div className="import-loading" role="status" aria-live="polite">
            <div className="import-loading__spin" aria-hidden />
            <strong>Загрузка идёт</strong>
            <p className="import-loading__time">{formatElapsed(elapsed)}</p>
            <div className="import-loading__bar"><span /></div>
            <p className="import-loading__hint">{UPLOAD_HINTS[hintI]}</p>
            {shpFile && <p className="import-loading__file">SHP: {shpFile.name}</p>}
            {tifFile && <p className="import-loading__file">TIF: {tifFile.name}</p>}
          </div>
        )}

        <div className="admin-form-grid admin-form-grid--urban">
          <label className="admin-field admin-urban-form__year">
            <span>Год *</span>
            <PrettySelect
              value={year}
              isDisabled={busy}
              onChange={(v) => setYear(Number(v))}
              options={URBAN_YEARS.map((y) => ({ value: y, label: String(y) }))}
            />
          </label>

          <div className="admin-field admin-field--full admin-urban-form__files">
            <div className="admin-urban-form__file-col">
              <span className="admin-urban-form__file-label">Shapefile *</span>
              <label className="admin-drop">
                <input
                  type="file"
                  accept=".shp,.zip"
                  disabled={busy}
                  onChange={(e) => setShpFile(e.target.files?.[0] || null)}
                />
                <strong>{shpFile ? shpFile.name : 'Выберите файл'}</strong>
                <span>.shp + .shx + .dbf + .prj yoki .zip</span>
              </label>
            </div>
            <div className="admin-urban-form__file-col">
              <span className="admin-urban-form__file-label">Классификация GeoTIFF *</span>
              <label className="admin-drop">
                <input
                  type="file"
                  accept=".tif,.tiff,.zip"
                  disabled={busy}
                  onChange={(e) => setTifFile(e.target.files?.[0] || null)}
                />
                <strong>{tifFile ? tifFile.name : 'Выберите файл'}</strong>
                <span>.tif / .tiff yoki ZIP (Extract_2000.tif + .tfw)</span>
              </label>
            </div>
          </div>

          {oneFilePending && (
            <p className="admin-field--full muted admin-urban-preview">
              {shpFile && !tifFile
                ? 'Shapefile tanlandi — klassifikatsiya (.tif yoki ZIP) tanlang, keyin «Загрузить» bosing.'
                : 'GeoTIFF tanlandi — shapefile (.shp/.zip) tanlang, keyin «Загрузить» bosing.'}
            </p>
          )}

          {filesReady && !busy && (
            <p className="admin-field--full muted admin-urban-preview">
              Ikkala fayl tanlandi — «Загрузить» bosing. API faqat shu paytda ishlaydi.
            </p>
          )}

          {!shpFile && !tifFile && existingRow && (
            <p className="admin-field--full muted admin-urban-preview">
              Уже загружено ({year}): Urban {fmtHa(existingRow.vector?.urban_area_ha ?? existingRow.raster?.urban_area_ha)} га,
              Non-urban {fmtHa(existingRow.vector?.non_urban_area_ha ?? existingRow.raster?.non_urban_area_ha)} га
            </p>
          )}

          <label className="admin-field admin-field--full">
            <span>Примечание</span>
            <textarea rows={2} value={note} disabled={busy} onChange={(e) => setNote(e.target.value)} />
          </label>

          {error && <div className="admin-error admin-field--full">{error}</div>}
          {ok && <div className="admin-ok admin-field--full">{ok}</div>}

          <div className="admin-field--full admin-urban-form__actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || !filesReady}
            >
              {busy ? `Загрузка · ${formatElapsed(elapsed)}` : 'Загрузить'}
            </button>
          </div>
        </div>
      </form>

      <div className="admin-card" style={{ marginTop: '1rem' }}>
        <h3>Загруженные годы</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Год</th>
              <th>SHP</th>
              <th>Urban (га)</th>
              <th>Non-urban (га)</th>
              <th>TIF</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {mergedRows.length === 0 && (
              <tr><td colSpan={6} className="muted">Пока ничего не загружено</td></tr>
            )}
            {mergedRows.map((row) => {
              const urban = row.vector?.urban_area_ha ?? row.raster?.urban_area_ha
              const nonUrban = row.vector?.non_urban_area_ha ?? row.raster?.non_urban_area_ha
              return (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{row.vector ? `${row.vector.feature_count ?? '✓'} · ${row.vector.class_field || '—'}` : '—'}</td>
                  <td>{fmtHa(urban)}</td>
                  <td>{fmtHa(nonUrban)}</td>
                  <td>{row.raster?.classified_preview_url ? '✓' : '—'}</td>
                  <td>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => removeYear(row)}>
                      Удалить
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
