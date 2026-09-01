import { useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import RouteProgress from '../components/RouteProgress'
import PageLoader from '../components/PageLoader'

function Ico({ children }) {
  return (
    <svg className="admin-nav__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  )
}

const GROUPS = [
  {
    id: 'main',
    title: 'Основное',
    hint: 'Сводка и загрузка данных',
    items: [
      { to: '/admin-panel', end: true, label: 'Обзор', Icon: () => <Ico><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Ico> },
      { to: '/admin-panel/import', end: true, label: 'Импорт файлов', Icon: () => <Ico><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Ico> },
      { to: '/admin-panel/import-guide', label: 'Как загрузить слой', Icon: () => <Ico><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><line x1="8" y1="7" x2="16" y2="7" /><line x1="8" y1="11" x2="16" y2="11" /></Ico> },
    ],
  },
  {
    id: 'map',
    title: 'Карта',
    hint: 'Объекты и границы на карте',
    items: [
      { to: '/admin-panel/map', end: true, label: 'Интерактивная карта', Icon: () => <Ico><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></Ico> },
      { to: '/admin-panel/lands', label: 'Реестр объектов', Icon: () => <Ico><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></Ico> },
      { to: '/admin-panel/categories', label: 'Категории', Icon: () => <Ico><path d="M12 2l3 7h7l-5.5 4.2L18.5 21 12 16.8 5.5 21 7.5 13.2 2 9h7z" /></Ico> },
      { to: '/admin-panel/boundaries', label: 'Границы', Icon: () => <Ico><polygon points="3 11 11 3 21 8 21 20 13 20 3 11" /><line x1="11" y1="3" x2="11" y2="20" /></Ico> },
      { to: '/admin-panel/mahallas', label: 'Махалли (МФЙ)', Icon: () => <Ico><path d="M3 21V8l9-5 9 5v13" /><path d="M9 21V12h6v9" /></Ico> },
    ],
  },
  {
    id: 'mon',
    title: 'Мониторинг',
    hint: 'Изменения по годам и журнал',
    items: [
      { to: '/admin-panel/issues', label: 'Проблемные участки', Icon: () => <Ico><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></Ico> },
      { to: '/admin-panel/application-types', label: 'Типы обращений', Icon: () => <Ico><path d="M4 4h16v4H4zM4 10h10v4H4zM4 16h14v4H4z" /></Ico> },
      { to: '/admin-panel/application-sites', label: 'Сайты обращений', Icon: () => <Ico><circle cx="12" cy="12" r="9" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></Ico> },
      { to: '/admin-panel/records', label: 'Записи мониторинга', Icon: () => <Ico><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></Ico> },
      { to: '/admin-panel/years', label: 'Годы мониторинга', Icon: () => <Ico><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" /></Ico> },
      { to: '/admin-panel/versions', label: 'Версии объектов', Icon: () => <Ico><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></Ico> },
      { to: '/admin-panel/urbanization', label: 'Урбанизация', Icon: () => <Ico><rect x="3" y="10" width="4" height="11" /><rect x="10" y="3" width="4" height="18" /><rect x="17" y="7" width="4" height="14" /></Ico> },
      { to: '/admin-panel/changes', label: 'Журнал изменений', Icon: () => <Ico><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></Ico> },
    ],
  },
  {
    id: 'sys',
    title: 'Система',
    hint: 'Доступ и объявления',
    items: [
      { to: '/admin-panel/users', label: 'Пользователи', Icon: () => <Ico><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Ico> },
      { to: '/admin-panel/notices', label: 'Объявления', Icon: () => <Ico><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></Ico> },
    ],
  },
]

function groupOpenByPath(pathname) {
  const hit = GROUPS.find((g) => g.items.some((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to) && i.to !== '/admin-panel')))
  if (pathname === '/admin-panel' || pathname === '/admin-panel/') return 'main'
  return hit?.id || 'main'
}

export default function AdminLayout() {
  const { user, loading, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(() => new Set(['main', 'map', groupOpenByPath(pathname)]))

  useEffect(() => {
    setOpen((prev) => new Set(prev).add(groupOpenByPath(pathname)))
  }, [pathname])

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return GROUPS
    return GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.label.toLowerCase().includes(s) || g.title.toLowerCase().includes(s)),
    })).filter((g) => g.items.length)
  }, [q])

  const toggle = (id) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login?next=/admin-panel" replace />

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <h2>Доступ запрещён</h2>
        <p>Админ-панель доступна только супер-администратору.</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
          На главную
        </button>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <RouteProgress />
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand__mark" aria-hidden>🌍</span>
          <div>
            <strong>Бухара GIS</strong>
            <span>Панель управления</span>
          </div>
        </div>

        <label className="admin-nav-search">
          <span className="admin-nav-search__ico" aria-hidden>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3-3" /></svg>
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск раздела..."
          />
        </label>

        <nav className="admin-nav">
          {groups.map((g) => {
            const isOpen = q || open.has(g.id)
            return (
              <div key={g.id} className={`admin-nav__group ${isOpen ? 'is-open' : ''}`}>
                <button type="button" className="admin-nav__title" onClick={() => toggle(g.id)} aria-expanded={!!isOpen}>
                  <span>
                    <b>{g.title}</b>
                    <small>{g.hint}</small>
                  </span>
                  <em className="admin-nav__chev" aria-hidden>▾</em>
                </button>
                <div className="admin-nav__list">
                  <div className="admin-nav__list-inner">
                    {g.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        tabIndex={isOpen ? 0 : -1}
                        className={({ isActive }) => `admin-nav__link ${isActive ? 'active' : ''}`}
                      >
                        <item.Icon />
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
          {!groups.length && <p className="admin-nav__empty">Ничего не найдено</p>}
        </nav>

        <div className="admin-sidebar__foot">
          <div className="user-info">
            <span className="admin-avatar">{(user.username || 'A').slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{user.username}</strong>
              <small>Администратор</small>
            </div>
          </div>
          <div className="admin-sidebar__acts">
            <NavLink to="/" className="btn btn-ghost btn-sm">К сайту</NavLink>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => { logout(); navigate('/login') }}
            >
              Выйти
            </button>
          </div>
        </div>
      </aside>
      <main className={`admin-main${pathname === '/admin-panel/map' ? ' admin-main--map' : ''}`} key={pathname}>
        <Outlet />
      </main>
    </div>
  )
}
