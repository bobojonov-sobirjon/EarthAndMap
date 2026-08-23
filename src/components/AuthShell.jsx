import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'
import LangSwitcher from './LangSwitcher'

export default function AuthShell({ title, subtitle, children, footer, wide }) {
  const { t } = useI18n()
  return (
    <div className={`auth-shell ${wide ? 'auth-shell--wide' : ''}`}>
      <div className="auth-bg" aria-hidden>
        <i className="auth-orb auth-orb--a" />
        <i className="auth-orb auth-orb--b" />
        <i className="auth-orb auth-orb--c" />
        <div className="auth-grid" />
      </div>

      <section className="auth-visual">
        <svg className="auth-map" viewBox="0 0 640 420" aria-hidden>
          <path className="auth-draw auth-draw--b" d="M70 60h500v300H70z" />
          <path className="auth-draw auth-draw--r" d="M70 210 H570 M190 60 V360 M320 60 V360 M450 60 V360" />
          <path className="auth-draw auth-draw--w" d="M90 320 C 180 280, 280 340, 400 300 S 530 240, 570 270" />
          <rect className="auth-park" x="210" y="120" width="80" height="60" rx="4" />
          <rect className="auth-park auth-park--2" x="380" y="230" width="95" height="48" rx="4" />
        </svg>
        <div className="auth-visual__copy">
          <p>{t('home.eyebrow')}</p>
          <h1>Buxoro <em>GIS</em></h1>
          <small>{t('brand.sub')}</small>
        </div>
      </section>

      <section className="auth-panel">
        <div className={`auth-card ${wide ? 'auth-card--wide' : ''}`}>
          <LangSwitcher />
          <h2>{title}</h2>
          {subtitle && <p className="muted">{subtitle}</p>}
          {children}
          {footer}
        </div>
        <p className="auth-legal">
          <Link to="/">← {t('auth.home')}</Link>
        </p>
      </section>
    </div>
  )
}
