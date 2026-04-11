import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { session, signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError('Credenciales inválidas. Verifica tu email y contraseña.')
    }
    setSubmitting(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0d0d0f' }}>
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: '#f5a623' }} />
            <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#f5a623' }}>
              Beezion
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#e8e9ef' }}>
            Ops Hub
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            Accede con tu cuenta de equipo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b7280' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md text-sm outline-none transition-colors"
              style={{
                backgroundColor: '#1c1c1c',
                border: '1px solid #262626',
                color: '#e8e9ef',
              }}
              placeholder="tu@beezion.co"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b7280' }}>
              Contrasena
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={{
                backgroundColor: '#1c1c1c',
                border: '1px solid #262626',
                color: '#e8e9ef',
              }}
            />
          </div>

          {error && (
            <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 px-4 rounded-md text-sm font-medium transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#f5a623', color: '#0d0d0f' }}
          >
            {submitting ? 'Accediendo...' : 'Acceder'}
          </button>
        </form>
      </div>
    </div>
  )
}
