import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

export function LoginPage() {
  const { session, signInWithMagicLink, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    setSubmitting(true)

    const { error } = await signInWithMagicLink(email)
    if (error) {
      setError(error)
    } else {
      setSent(true)
    }
    setSubmitting(false)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0A0A0F',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 60%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 380, padding: '0 24px' }}>

        {/* Logo */}
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 48, height: 48, borderRadius: 14,
            backgroundColor: '#F5A623',
            marginBottom: 16,
            boxShadow: '0 8px 24px rgba(245,166,35,0.3)',
          }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#0A0A0F' }}>B</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F0F1F8', margin: 0 }}>
            Beezion Ops Hub
          </h1>
          <p style={{ fontSize: 13, color: '#5A5E72', marginTop: 6 }}>
            Acceso exclusivo para el equipo Beezion
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: '#13131A',
          border: '1px solid #1E1E2E',
          borderRadius: 16,
          padding: '28px 24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        }}>

          {sent ? (
            /* ── Estado: correo enviado ── */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                backgroundColor: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <CheckCircle2 size={26} color="#10B981" />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F0F1F8', margin: '0 0 8px' }}>
                Revisa tu correo
              </h2>
              <p style={{ fontSize: 13, color: '#5A5E72', lineHeight: 1.6, margin: '0 0 20px' }}>
                Enviamos un enlace de acceso a<br />
                <strong style={{ color: '#9699B0' }}>{email}</strong>
              </p>
              <p style={{ fontSize: 11, color: '#3D4055' }}>
                El enlace expira en 1 hora. Revisa también spam.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                style={{
                  marginTop: 20, fontSize: 12, color: '#5A5E72',
                  background: 'none', border: 'none', cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Usar otro correo
              </button>
            </div>
          ) : (
            /* ── Estado: formulario ── */
            <>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#D0D2E0', margin: '0 0 6px' }}>
                Iniciar sesión
              </h2>
              <p style={{ fontSize: 12, color: '#3D4055', margin: '0 0 20px' }}>
                Sin contraseña — te enviamos un enlace directo
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{
                    display: 'block', fontSize: 11, fontWeight: 600,
                    color: '#5A5E72', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    Correo corporativo
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={14} color="#3D4055"
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError('') }}
                      required
                      autoFocus
                      placeholder="tucorreo@beezion.com"
                      style={{
                        width: '100%', padding: '10px 12px 10px 34px',
                        backgroundColor: '#0D0D14',
                        border: `1px solid ${error ? '#E2445C40' : '#1E1E2E'}`,
                        borderRadius: 8, fontSize: 13, color: '#F0F1F8',
                        outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => (e.target.style.borderColor = '#6366F160')}
                      onBlur={e => (e.target.style.borderColor = error ? '#E2445C40' : '#1E1E2E')}
                    />
                  </div>
                </div>

                {error && (
                  <div style={{
                    padding: '8px 12px', borderRadius: 7, marginBottom: 14,
                    backgroundColor: 'rgba(226,68,92,0.1)',
                    border: '1px solid rgba(226,68,92,0.25)',
                  }}>
                    <p style={{ fontSize: 12, color: '#E2445C', margin: 0 }}>{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !email.trim()}
                  style={{
                    width: '100%', padding: '11px 16px',
                    borderRadius: 8, fontSize: 13, fontWeight: 700,
                    color: '#0A0A0F',
                    backgroundColor: submitting || !email.trim() ? '#3D4055' : '#F5A623',
                    border: 'none', cursor: submitting || !email.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s',
                    boxShadow: submitting || !email.trim() ? 'none' : '0 4px 14px rgba(245,166,35,0.3)',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                      Enviando enlace...
                    </>
                  ) : (
                    <>
                      Enviar enlace de acceso
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#2A2A3A', marginTop: 20 }}>
          Solo accesible para el equipo interno de Beezion
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
