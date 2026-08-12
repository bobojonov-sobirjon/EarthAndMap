import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/map'
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
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
      setError('Неверный логин или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <span>🌍</span>
          <h1>Бухара GIS</h1>
          <p>{next.startsWith('/admin-panel') ? 'Вход в админ-панель' : 'Система земель общего пользования'}</p>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <label>Логин<input value={username} onChange={(e) => setUsername(e.target.value)} /></label>
        <label>Пароль<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
        <p className="login-hint">Супер-админ: admin / admin123</p>
      </form>
    </div>
  )
}
