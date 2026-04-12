import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ArrowRight, Loader2 } from 'lucide-react'

// ─── Hexagon background pattern ───────────────────────────────────────────────
function HexPattern() {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.4 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="hex" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
          <polygon
            points="28,2 52,14 52,38 28,50 4,38 4,14"
            fill="none"
            stroke="#E8E9EF"
            strokeWidth="1"
          />
          <polygon
            points="56,2 80,14 80,38 56,50 32,38 32,14"
            fill="none"
            stroke="#E8E9EF"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex)" />
    </svg>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
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
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#F7F8FC',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <HexPattern />

      {/* Left panel — branding */}
      <div style={{
        display: 'none',
        flex: 1,
        background: 'linear-gradient(145deg, #1A1D27 0%, #12141E 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
        position: 'relative',
      }}
        className="lg-panel"
      />

      {/* Center card */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: '100%',
          maxWidth: 420,
        }}>
          {/* Logo */}
          <div style={{ marginBottom: 36, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, #F5A623 0%, #E8971A 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245,166,35,0.4)',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="white" opacity="0.9"/>
                  <polygon points="12,6 18,9.5 18,16.5 12,20 6,16.5 6,9.5" fill="#F5A623"/>
                  <circle cx="12" cy="13" r="3" fill="white"/>
                </svg>
              </div>
              <span style={{
                fontSize: 32,
                fontWeight: 900,
                color: '#1A1D27',
                letterSpacing: '-1px',
                lineHeight: 1,
                fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
              }}>
                beezi<span style={{ color: '#F5A623' }}>o</span>n
              </span>
            </div>
            <p style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#9699B0',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginTop: 2,
            }}>
              Operaciones
            </p>
          </div>

          {/* Card */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            padding: '36px 32px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.08)',
            border: '1px solid #ECEDF5',
          }}>
            <h2 style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#1A1D27',
              margin: '0 0 6px',
            }}>
              Bienvenido 👋
            </h2>
            <p style={{
              fontSize: 13,
              color: '#9699B0',
              margin: '0 0 28px',
              lineHeight: 1.5,
            }}>
              Ingresa tu correo corporativo para acceder al hub de operaciones
            </p>

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#5A5E72',
                  marginBottom: 7,
                }}>
                  Correo corporativo
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  required
                  autoFocus
                  placeholder="tucorreo@beezion.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#F7F8FC',
                    border: `1.5px solid ${error ? '#E2445C' : '#E4E7F0'}`,
                    borderRadius: 10,
                    fontSize: 14,
                    color: '#1A1D27',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#6366F1'
                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'
                    e.target.style.backgroundColor = '#FFFFFF'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = error ? '#E2445C' : '#E4E7F0'
                    e.target.style.boxShadow = 'none'
                    e.target.style.backgroundColor = '#F7F8FC'
                  }}
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 8,
                  marginBottom: 16,
                  backgroundColor: '#FEF2F4',
                  border: '1px solid #FECDD3',
                }}>
                  <span style={{ fontSize: 14 }}>⚠️</span>
                  <p style={{ fontSize: 12, color: '#E2445C', margin: 0, fontWeight: 500 }}>
                    {error}
                  </p>
                </div>
              )}

              {/* Botón */}
              <button
                type="submit"
                disabled={submitting || !email.trim()}
                style={{
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  color: !email.trim() ? '#9699B0' : '#FFFFFF',
                  backgroundColor: !email.trim() ? '#F0F2F8' : '#F5A623',
                  border: 'none',
                  cursor: !email.trim() || submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  boxShadow: email.trim() && !submitting
                    ? '0 4px 14px rgba(245,166,35,0.35)'
                    : 'none',
                }}
                onMouseEnter={e => {
                  if (email.trim() && !submitting) {
                    e.currentTarget.style.backgroundColor = '#E8971A'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={e => {
                  if (email.trim() && !submitting) {
                    e.currentTarget.style.backgroundColor = '#F5A623'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                    Verificando acceso...
                  </>
                ) : (
                  <>
                    Entrar al hub
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#C0C3D0',
            marginTop: 20,
          }}>
            Acceso restringido al equipo interno de Beezion
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
