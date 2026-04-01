import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import './Auth.css'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setError(''); setMessage(''); setLoading(true)
    const fn = mode === 'login' ? signIn : signUp
    const { error } = await fn(email, password)
    setLoading(false)
    if (error) { setError(error.message); return }
    if (mode === 'signup') setMessage('Compte créé ! Vérifie ton email pour confirmer.')
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/carbcycle-icon.svg" alt="CarbCycle" className="auth-logo-img" />
          <span className="auth-logo-text">CarbCycle</span>
        </div>
        <h1 className="auth-title">
          {mode === 'login' ? 'Bon retour !' : 'Créer un compte'}
        </h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Connecte-toi pour accéder à ton programme' : 'Commence à suivre ton carb cycling'}
        </p>

        <form onSubmit={handle} className="auth-form">
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="toi@exemple.com"
              required
            />
          </div>
          <div className="auth-field">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success">{message}</div>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}>
            {mode === 'login' ? "S'inscrire" : 'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  )
}
