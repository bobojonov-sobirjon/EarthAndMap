import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../api/services'
import client from '../api/client'
import AdminGuide from './AdminGuide'
import ColorField from './ColorField'
import PrettySelect from '../components/PrettySelect'
import { CURRENT_YEAR, YEARS } from '../constants/years'

const IMPORT_HINTS = [
  'Распаковка ZIP и чтение shapefile…',
  'Создание категорий, если их ещё нет…',
  'Запись объектов в базу — большой архив может занять 1–3 минуты…',
  'Не закрывайте вкладку, пока идёт импорт.',
]

function formatElapsed(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function AdminImportPage() {
  const [cats, setCats] = useState([])
  const [mode, setMode] = useState('single')
  const [target, setTarget] = useState('layer')
  const [category, setCategory] = useState('istirohat')
  const [year, setYear] = useState(CURRENT_YEAR)
  const [color, setColor] = useState('#27ae60')
  const [prefix, setPrefix] = useState('Bog‘')
  const [replace, setReplace] = useState(false)
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [hintI, setHintI] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!busy) {
      setElapsed(0)
      setHintI(0)
      return undefined
    }
    const t = setInterval(() => setElapsed((n) => n + 1), 1000)
    const h = setInterval(() => setHintI((i) => (i + 1) % IMPORT_HINTS.length), 4500)
    return () => {
      clearInterval(t)
      clearInterval(h)
    }
  }, [busy])

  const loadCats = () => {
    adminApi.categories.list().then(({ data }) => {
      const list = Array.isArray(data) ? data : (data.results || [])
      setCats(list)
      const park = list.find((c) => c.code === 'istirohat' || c.code === 'park')
      if (park) {
        setCategory(park.code)
        if (park.color) setColor(park.color)
      } else if (list[0]?.code) setCategory(list[0].code)
    }).catch(() => {})
  }

  useEffect(() => { loadCats() }, [])

  useEffect(() => {
    const c = cats.find((x) => x.code === category)
    if (c?.color) setColor(c.color)
  }, [category, cats])

  const submit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Выберите файл')
      return
    }
    if (mode === 'single' && target === 'layer' && (!category || !cats.length)) {
      setError('Сначала создайте категорию или используйте пакетный импорт (вариант 2)')
      return
    }
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('mode', mode)
      fd.append('year', String(year))
      fd.append('replace', replace ? '1' : '0')
      if (mode === 'single') {
        fd.append('target', target)
        if (target === 'layer') {
          fd.append('category', category)
          fd.append('color', color)
          if (prefix) fd.append('prefix', prefix)
        } else {
          fd.append('boundary_code', 'bukhara_city')
          fd.append('boundary_type', 'city')
        }
      }
      const { data } = await client.post('/import/', fd, { timeout: 15 * 60 * 1000 })
      setResult(data)
      if (mode === 'bundle') loadCats()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Ошибка импорта. Проверьте ZIP и что сервер запущен.')
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
          <p className="muted">Два способа: один слой вручную или весь ZIP сразу по именам файлов</p>
        </div>
        <div className="admin-page__actions">
          <Link className="btn btn-ghost" to="/admin-panel/import-guide">Как загрузить слой</Link>
        </div>
      </header>

      <div className="import-mode">
        <button type="button" disabled={busy} className={mode === 'single' ? 'is-on' : ''} onClick={() => { setMode('single'); setResult(null); setError('') }}>
          <b>Вариант 1</b>
          <span>Один слой — вы сами указываете категорию и год</span>
        </button>
        <button type="button" disabled={busy} className={mode === 'bundle' ? 'is-on' : ''} onClick={() => { setMode('bundle'); setResult(null); setError('') }}>
          <b>Вариант 2</b>
          <span>Весь ZIP целиком — категории создаются из имён файлов</span>
        </button>
      </div>

      {mode === 'single' && !cats.length && target === 'layer' && (
        <div className="admin-warn">
          Категорий ещё нет — для варианта 1 их нужно создать.{' '}
          <Link to="/admin-panel/categories">Создайте категорию</Link>
          {' · '}
          или выберите <button type="button" className="linkish" onClick={() => setMode('bundle')}>вариант 2</button>.
        </div>
      )}

      <div className="admin-import-grid">
        <form className={`admin-import-card ${busy ? 'is-busy' : ''}`} onSubmit={submit}>
          {busy && (
            <div className="import-loading" role="status" aria-live="polite">
              <div className="import-loading__spin" aria-hidden />
              <strong>Импорт идёт</strong>
              <p className="import-loading__time">{formatElapsed(elapsed)}</p>
              <div className="import-loading__bar"><span /></div>
              <p className="import-loading__hint">{IMPORT_HINTS[hintI]}</p>
              {file ? <p className="import-loading__file">{file.name}</p> : null}
            </div>
          )}
          {mode === 'single' && (
            <>
              <label className="admin-field">
                <span>Что загружаем</span>
                <PrettySelect
                  placeholder="—"
                  isSearchable={false}
                  value={target}
                  onChange={setTarget}
                  options={[
                    { value: 'layer', label: 'Слой объектов (дороги, парки…)' },
                    { value: 'boundary', label: 'Граница города' },
                  ]}
                />
              </label>

              {target === 'layer' && (
                <>
                  <label className="admin-field">
                    <span>Категория на карте</span>
                    <PrettySelect
                      value={category}
                      onChange={setCategory}
                      placeholder="Выберите категорию"
                      noOptionsMessage="Категорий нет — создайте слой или используйте вариант 2"
                      options={cats.map((c) => ({
                        value: c.code,
                        label: `${c.name_ru || c.name_uz} (${c.code})`,
                      }))}
                    />
                  </label>
                  <label className="admin-field">
                    <span>Год мониторинга</span>
                    <PrettySelect
                      value={year}
                      onChange={(v) => setYear(Number(v))}
                      placeholder="2010 — сейчас"
                      noOptionsMessage="Нет такого года — выберите из списка 2010…текущий"
                      options={YEARS.map((y) => ({ value: y, label: String(y) }))}
                    />
                  </label>
                  <ColorField label="Цвет на карте" value={color} onChange={setColor} />
                  <label className="admin-field">
                    <span>Префикс имени (если в файле нет name)</span>
                    <input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="Например: Парк" />
                  </label>
                </>
              )}
            </>
          )}

          {mode === 'bundle' && (
            <p className="import-bundle-hint">
              Один ZIP с несколькими shapefile: <code>Istrohat_boglari_2026</code>,{' '}
              <code>Qabristonlar_2026</code>, <code>Kanallar_2026</code>,{' '}
              <code>I_darajali_magistral_2026</code> и т.д. Год берётся из имени файла.
              Если категории нет — она создаётся автоматически.
            </p>
          )}

          {mode === 'bundle' && (
            <label className="admin-field">
              <span>Год, если его нет в имени файла</span>
              <PrettySelect
                value={year}
                onChange={(v) => setYear(Number(v))}
                placeholder="2010 — сейчас"
                noOptionsMessage="Нет такого года — выберите из списка 2010…текущий"
                options={YEARS.map((y) => ({ value: y, label: String(y) }))}
              />
            </label>
          )}

          <label className="admin-check" style={{ paddingTop: 0 }}>
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
            {mode === 'bundle'
              ? 'Заменить объекты тех же категорий и годов, что в ZIP'
              : 'Заменить только эту категорию за выбранный год'}
          </label>

          <label className="admin-drop">
            <input
              type="file"
              accept={mode === 'bundle' ? '.zip' : '.zip,.shp,.geojson,.json'}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <strong>{file ? file.name : 'Выберите файл'}</strong>
            <span>
              {mode === 'bundle'
                ? 'Один .zip со всеми слоями (.shp + .shx + .dbf)'
                : '.zip (shp+shx+dbf) или .geojson'}
            </span>
          </label>

          {error && <div className="admin-error">{typeof error === 'string' ? error : JSON.stringify(error)}</div>}
          {result && result.mode === 'bundle' && (
            <div className="admin-ok">
              <p>Загружено объектов: <b>{result.imported}</b> · shapefile: <b>{result.files}</b></p>
              <ul className="import-result-list">
                {(result.layers || []).map((row) => (
                  <li key={row.stem} className={row.ok ? '' : 'is-bad'}>
                    {row.ok
                      ? <>{row.stem} → {row.kind === 'boundary' ? 'граница' : row.category}{row.road_class ? ` / ${row.road_class}` : ''} · {row.count} · {row.year}{row.category_created ? ' · категория создана' : ''}</>
                      : <>{row.stem}: {row.error}</>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result && result.mode !== 'bundle' && (
            <div className="admin-ok">
              Загружено: <b>{result.imported}</b>
              {result.year ? ` · ${result.year}` : ''}
              {result.category ? ` · ${result.category}` : ''}
              {result.replaced ? ' · старые записи этого года удалены' : ''}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy
              ? `Идёт импорт · ${formatElapsed(elapsed)}`
              : mode === 'bundle' ? 'Загрузить весь ZIP' : 'Загрузить на карту'}
          </button>
          <Link to="/admin-panel/map" className="btn btn-ghost">Открыть карту</Link>
        </form>

        {mode === 'single' ? (
          <AdminGuide
            title="Вариант 1 — один слой"
            steps={[
              'Соберите ZIP: Istrohat_boglari_2018.shp + .shx + .dbf (и .prj).',
              'Выберите категорию, год и цвет.',
              'Галочку «заменить» не ставьте, если добавляете новый год.',
              'Проверьте Реестр и ползунок года на карте.',
              'Другие слои и годы — отдельными ZIP.',
            ]}
            note="Если категорий нет, создайте их вручную или переключитесь на вариант 2."
          />
        ) : (
          <AdminGuide
            title="Вариант 2 — весь архив"
            steps={[
              'Положите в один ZIP все shapefile-группы за год (или несколько лет).',
              'Имена: Istrohat_boglari_2026, Qabristonlar_2026, Kanallar_2026, I_darajali_magistral_2026…',
              'Система читает каждое .shp, год из имени (_2026), категорию из названия.',
              'Нет категории в базе — она создаётся (istirohat, suv, yollar, qabriston).',
              'buxoro_shahar_* станет границей города. Дороги получат класс I / II / III / пешеходные.',
            ]}
            note="Не смешивайте в одном имени разные типы. Нужны .shp + .shx + .dbf для каждой группы."
          />
        )}
      </div>
    </div>
  )
}
