import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Mail, ArrowRight, Loader2 } from 'lucide-react'

export function LoginPage() {
  const { user, signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    setSubmitting(true)
    const { error } = await signIn(email)
    if (error) setError(error)
    setSubmitting(false)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', backgroundColor: '#0A0A0F',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(245,166,35,0.08) 0%, transparent 55%)',
    }}>
      <div style={{ width: '100%', maxWidth: 360, padding: '0 24px' }}>

        {/* Logo */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: 16,
            backgroundColor: '#F5A623',
            marginBottom: 14,
            boxShadow: '0 8px 28px rgba(245,166,35,0.35)',
          }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#0A0A0F' }}>B</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F0F1F8', margin: 0 }}>
            Beezion Ops Hub
          </h1>
          <p style={{ fontSize: 12, color: '#3D4055', marginTop: 5 }}>
            Solo para el equipo interno
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: '#13131A',
          border: '1px solid #1E1E2E',
          borderRadius: 16,
          padding: '28px 24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}>
          <p style={{ fontSize: 13, color: '#5A5E72', margin: '0 0 20px', lineHeight: 1.5 }}>
            Ingresa tu correo corporativo para acceder
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email input */}
            <div style={{ marginBottom: 14 }}>
              <label style={{
                display: 'block', fontSize: 10, fontWeight: 700,
                color: '#3D4055', marginBottom: 7,
                textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
                Correo corporativo
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={13} color="#3D4055" style={{
                  position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  required
                  autoFocus
                  placeholder="tucorreo@beezion.com"
                  style={{
                    width: '100%', padding: '10px 12px 10px 32px',
                    backgroundColor: '#0D0D14',
                    border: `1.5px solid ${error ? 'rgba(226,68,92,0.5)' : '#1E1E2E'}`,
                    borderRadius: 9, fontSize: 13, color: '#F0F1F8',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { if (!error) e.target.style.borderColor = 'rgba(245,166,35,0.4)' }}
                  onBlur={e => { if (!error) e.target.style.borderColor = '#1E1E2E' }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '9px 12px', borderRadius: 8, marginBottom: 14,
                backgroundColor: 'rgba(226,68,92,0.08)',
                border: '1px solid rgba(226,68,92,0.2)',
              }}>
                <p style={{ fontSize: 12, color: '#E2445C', margin: 0 }}>
                  {error}
                </p>
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={submitting || !email.trim()}
              style={{
                width: '100%', padding: '11px 16px',
                borderRadius: 9, fontSize: 13, fontWeight: 700,
                color: '#0A0A0F',
                backgroundColor: !email.trim() ? '#1E1E2E' : '#F5A623',
                border: 'none',
                cursor: !email.trim() || submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
                boxShadow: email.trim() && !submitting ? '0 4px 16px rgba(245,166,35,0.3)' : 'none',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
                  Verificando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 10, color: '#1E1E2E', marginTop: 18 }}>
          Acceso restringido · Beezion © 2026
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
