import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, statsApi } from '../api/services'
import AdminGuide from './AdminGuide'
import PageLoader from '../components/PageLoader'

const CARDS = [
  { to: '/admin-panel/users', label: 'Пользователи', key: 'users', color: '#38bdf8' },
  { to: '/admin-panel/lands', label: 'Объекты реестра', key: 'lands', color: '#22c55e' },
  { to: '/admin-panel/categories', label: 'Категории', key: 'categories', color: '#f97316' },
  { to: '/admin-panel/issues', label: 'Проблемы', key: 'issues', color: '#f87171' },
  { to: '/admin-panel/years', label: 'Годы', key: 'years', color: '#a78bfa' },
  { to: '/admin-panel/notices', label: 'Объявления', key: 'notices', color: '#94a3b8' },
]

function countOf(data) {
  if (Array.isArray(data)) return data.length
  if (data?.count != null) return data.count
  if (data?.results) return data.count ?? data.results.length
  return 0
}

export default function AdminHome() {
  const [counts, setCounts] = useState({})
  const [kpi, setKpi] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [users, lands, cats, issues, years, notices, dash] = await Promise.all([
          adminApi.users.list(),
          adminApi.lands.list({ page_size: 1 }),
          adminApi.categories.list(),
          adminApi.issues.list(),
          adminApi.years.list(),
          adminApi.notices.list(),
          statsApi.dashboard().catch(() => ({ data: null })),
        ])
        setCounts({
          users: countOf(users.data),
          lands: countOf(lands.data),
          categories: countOf(cats.data),
          issues: countOf(issues.data),
          years: countOf(years.data),
          notices: countOf(notices.data),
        })
        setKpi(dash.data?.kpis || null)
      } catch {
        /* ignore */
      } finally {
        setReady(true)
      }
    }
    load()
  }, [])

  if (!ready) return <PageLoader />

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <div>
          <p className="eyebrow">Панель управления</p>
          <h2>Админ-панель Бухара GIS</h2>
          <p className="muted">Полное управление реестром, пользователями и мониторингом</p>
        </div>
      </header>

      <section className="admin-kpi-grid">
        {CARDS.map((c) => (
          <Link key={c.key} to={c.to} className="admin-kpi" style={{ '--ac': c.color }}>
            <strong>{counts[c.key] ?? '—'}</strong>
            <span>{c.label}</span>
          </Link>
        ))}
      </section>

      {kpi && (
        <section className="admin-summary chart-card">
          <h3>Сводка системы</h3>
          <div className="admin-summary__grid">
            <div><span>Всего объектов</span><b>{kpi.total_objects}</b></div>
            <div><span>Площадь (га)</span><b>{kpi.total_area_ha}</b></div>
            <div><span>Дороги (км)</span><b>{kpi.roads_length_km}</b></div>
            <div><span>Орошение (км)</span><b>{kpi.water_length_km}</b></div>
          </div>
        </section>
      )}

      <section className="admin-quick">
        <h3>Быстрые действия</h3>
        <div className="admin-quick__row">
          <Link className="btn btn-primary" to="/admin-panel/import">Импорт файлов на карту</Link>
          <Link className="btn btn-ghost" to="/admin-panel/lands">Реестр объектов</Link>
          <Link className="btn btn-ghost" to="/admin-panel/users">Пользователи</Link>
          <Link className="btn btn-ghost" to="/admin-panel/map">Интерактивная карта</Link>
        </div>
      </section>

      <AdminGuide
        title="С чего начать"
        steps={[
          'Импорт: ZIP парков 2018 → категория istirohat, год 2018, зелёный цвет.',
          'В Реестре проверьте колонку «Год» — должно быть 2018.',
          'На сайте откройте карту и ползунок года.',
          'Клиент регистрируется на /register как наблюдатель; роль меняется здесь.',
        ]}
      />
    </div>
  )
}
