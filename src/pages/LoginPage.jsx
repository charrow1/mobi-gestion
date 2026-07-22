import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) { setError('Email o contraseña incorrectos.'); setLoading(false) }
      else navigate('/')
    } else {
      const { error } = await signUp(email, password)
      if (error) { setError(error.message); setLoading(false) }
      else { setSuccess('Cuenta creada. Revisá tu email para confirmar.'); setLoading(false) }
    }
  }

  const inp = { width: '100%', padding: '9px 12px', border: '0.5px solid var(--color-border)', borderRadius: 8, background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 13, outline: 'none' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 22, color: '#fff' }}>✓</div>
          <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Mobi Gestión</h1>
          <p style={{ color: 'var(--color-text-3)', fontSize: 13 }}>Sistema interno de seguimiento</p>
        </div>

        <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 14, padding: 24, boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', gap: 4, background: 'var(--color-bg)', borderRadius: 8, padding: 4, marginBottom: 20 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }}
                style={{ flex: 1, padding: '7px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 500, background: mode === m ? 'var(--color-surface)' : 'transparent', color: mode === m ? 'var(--color-text)' : 'var(--color-text-3)', boxShadow: mode === m ? 'var(--shadow)' : 'none', cursor: 'pointer', transition: 'all .15s' }}>
                {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="nombre@empresa.com" style={inp}
                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" style={inp}
                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'} />
            </div>

            {error && <div style={{ background: 'var(--color-danger-bg)', border: '0.5px solid var(--color-danger-border)', borderRadius: 8, padding: '9px 12px', color: 'var(--color-danger)', fontSize: 12, marginBottom: 14 }}>{error}</div>}
            {success && <div style={{ background: 'var(--color-success-bg)', border: '0.5px solid #9ee5c1', borderRadius: 8, padding: '9px 12px', color: 'var(--color-success)', fontSize: 12, marginBottom: 14 }}>{success}</div>}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: 10, background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
