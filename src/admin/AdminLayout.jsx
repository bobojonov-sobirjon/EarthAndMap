import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const GROUPS = [
  {
    title: 'Asosiy',
    items: [
      { to: '/admin-panel', label: 'Обзор', end: true },
      { to: '/admin-panel/import', label: 'Импорт файлов' },
    ],
  },
  {
    title: 'Карта',
    items: [
      { to: '/admin-panel/lands', label: 'Реестр' },
      { to: '/admin-panel/categories', label: 'Категории' },
      { to: '/admin-panel/boundaries', label: 'Границы' },
    ],
  },
  {
    title: 'Мониторинг',
    items: [
      { to: '/admin-panel/issues', label: 'Проблемы' },
      { to: '/admin-panel/records', label: 'Записи' },
      { to: '/admin-panel/years', label: 'Годы' },
    ],
  },
  {
    title: 'Система',
    items: [
      { to: '/admin-panel/users', label: 'Пользователи' },
      { to: '/admin-panel/notices', label: 'Объявления' },
    ],
  },
]

export default function AdminLayout() {
  const { user, loading, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  if (loading) return <div className="loading-screen">Загрузка...</div>
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
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <strong>Бухара GIS</strong>
          <span>Админ-панель</span>
        </div>
        <nav className="admin-nav">
          {GROUPS.map((g) => (
            <div key={g.title} className="admin-nav__group">
              <p className="admin-nav__title">{g.title}</p>
              {g.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `admin-nav__link ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-sidebar__foot">
          <div className="user-info">
            <strong>{user.username}</strong>
            <small>Администратор</small>
          </div>
          <NavLink to="/" className="btn btn-ghost btn-sm">← К сайту</NavLink>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => { logout(); navigate('/login') }}
          >
            Выйти
          </button>
        </div>
      </aside>
      <main className="admin-main" key={pathname}>
        <Outlet />
      </main>
    </div>
  )
}
