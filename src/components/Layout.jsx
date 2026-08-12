import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/', label: 'Bosh sahifa', icon: '🏠', end: true },
  { to: '/map', label: 'Interaktiv xarita', icon: '🗺️' },
  { to: '/lands', label: 'Reyestr', icon: '📋' },
  { to: '/dashboard', label: 'Statistika', icon: '📊' },
  { to: '/monitoring', label: 'Monitoring', icon: '📡' },
  { to: '/urbanization', label: 'Urbanizatsiya', icon: '🏙️' },
  { to: '/compare', label: 'Taqqoslash', icon: '⚖️' },
  { to: '/problems', label: 'Muammoli hududlar', icon: '⚠️' },
]

const ROLE_LABEL = {
  admin: 'Bosh administrator',
  specialist: 'Mutaxassis',
  monitor: 'Monitoring xodimi',
  observer: 'Ommaviy foydalanuvchi',
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">🌍</span>
          <div>
            <h1>Buxoro GIS</h1>
            <p>Elektron reyestr va monitoring</p>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {user ? (
            <>
              <div className="user-info">
                <strong>{user.username}</strong>
                <small>{ROLE_LABEL[user.role] || user.role}</small>
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => { logout(); navigate('/login') }}>
                Chiqish
              </button>
            </>
          ) : (
            <NavLink to="/login" className="btn btn-primary">Kirish</NavLink>
          )}
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
