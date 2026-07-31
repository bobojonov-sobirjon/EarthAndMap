import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
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
      navigate('/map')
    } catch {
      setError('Login yoki parol noto\'g\'ri')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <span>🌍</span>
          <h1>Buxoro GIS</h1>
          <p>Umumfoydalanishdagi yerlar tizimi</p>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <label>Login<input value={username} onChange={(e) => setUsername(e.target.value)} /></label>
        <label>Parol<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Kirish...' : 'Kirish'}
        </button>
        <p className="login-hint">Demo: admin / admin123</p>
      </form>
    </div>
  )
}
