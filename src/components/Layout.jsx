import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useI18n } from '../i18n/I18nContext'
import LangSwitcher from './LangSwitcher'
import RouteProgress from './RouteProgress'

const ROLE_KEYS = {
  admin: 'role.admin',
  specialist: 'role.specialist',
  monitor: 'role.monitor',
  observer: 'role.observer',
}

function initials(user) {
  const a = (user.first_name || '').trim()
  const b = (user.last_name || '').trim()
  if (a || b) return `${a.charAt(0)}${b.charAt(0)}`.toUpperCase() || a.slice(0, 2).toUpperCase()
  return (user.username || '?').slice(0, 2).toUpperCase()
}

function displayName(user) {
  const full = `${user.first_name || ''} ${user.last_name || ''}`.trim()
  return full || user.username
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)
  const [navCollapsed, setNavCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const NAV = [
    { to: '/', label: t('nav.home'), icon: '🏠', end: true },
    { to: '/map', label: t('nav.map'), icon: '🗺️' },
    { to: '/lands', label: t('nav.lands'), icon: '📋' },
    { to: '/dashboard', label: t('nav.stats'), icon: '📊' },
    { to: '/urbanization', label: t('nav.urban'), icon: '🏙️' },
    { to: '/problems', label: t('nav.problems'), icon: '⚠️' },
  ]

  const toggleNav = () => {
    if (window.matchMedia('(max-width: 900px)').matches) {
      setNavOpen((v) => !v)
    } else {
      setNavCollapsed((v) => !v)
    }
  }

  const closeMobileNav = () => setNavOpen(false)

  const roleLabel = user
    ? (user.is_superuser ? t('role.admin') : t(ROLE_KEYS[user.role] || 'role.observer'))
    : ''

  return (
    <div className={`app-shell ${navCollapsed ? 'nav-collapsed' : ''} ${navOpen ? 'nav-open' : ''}`}>
      <RouteProgress />
      <header className="topbar">
        <div className="topbar__left">
          <button type="button" className="topbar-icon" onClick={toggleNav} aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <div className="topbar__right">
          <LangSwitcher variant="flags" />
          <button
            type="button"
            className="topbar-icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? t('theme.day') : t('theme.night')}
            aria-label={theme === 'dark' ? t('theme.day') : t('theme.night')}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 14.3A8.5 8.5 0 0 1 9.7 3 7 7 0 1 0 21 14.3z" />
              </svg>
            )}
          </button>

          {user ? (
            <div className="topbar-user-wrap">
              <button
                type="button"
                className="topbar-user"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className="topbar-avatar">{initials(user)}</span>
                <span className="topbar-user__meta">
                  <strong>{displayName(user)}</strong>
                  <small>{roleLabel}</small>
                </span>
              </button>
              {menuOpen && (
                <div className="topbar-menu">
                  <div className="topbar-menu__who">
                    <b>{user.username}</b>
                    {user.email ? <span>{user.email}</span> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      logout()
                      navigate('/login')
                    }}
                  >
                    {t('auth.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="topbar-guest">
              <NavLink to="/login" className="btn btn-primary btn-sm">{t('auth.login')}</NavLink>
              <NavLink to="/register" className="btn btn-ghost btn-sm">{t('auth.register')}</NavLink>
            </div>
          )}
        </div>
      </header>

      {navOpen && <button type="button" className="nav-backdrop" aria-label="Close" onClick={closeMobileNav} />}

      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">🌍</span>
          <div>
            <h1>Buxoro GIS</h1>
            <p>{t('brand.sub')}</p>
          </div>
        </div>
        <nav className="nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={closeMobileNav}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content" onClick={() => setMenuOpen(false)}>
        <Outlet />
      </main>
    </div>
  )
}
