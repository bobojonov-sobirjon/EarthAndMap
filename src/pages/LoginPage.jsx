import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthShell from '../components/AuthShell'
import { useI18n } from '../i18n/I18nContext'

export default function LoginPage() {
  const { t } = useI18n()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(username, password)
      navigate(next)
    } catch {
      setError(t('auth.bad'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={t('auth.title')}
      subtitle={next.startsWith('/admin-panel') ? t('auth.adminSub') : t('auth.sub')}
      footer={(
        <p className="auth-switch">
          {t('auth.noAccount')} <Link to="/register">{t('auth.register')}</Link>
        </p>
      )}
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="error-msg">{error}</div>}
        <label>{t('auth.username')}
          <input required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>{t('auth.password')}
          <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary btn-block auth-submit" disabled={loading}>
          {loading ? t('auth.checking') : t('auth.submit')}
        </button>
      </form>
    </AuthShell>
  )
}
