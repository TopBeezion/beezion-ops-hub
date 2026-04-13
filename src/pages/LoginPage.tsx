import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { Zap, ArrowRight, Mail } from 'lucide-react'

const TEAM = [
  { name: 'Alejandro', color: '#8B5CF6', role: 'CEO' },
  { name: 'Alec',      color: '#F59E0B', role: 'Head of Paid' },
  { name: 'Jose',      color: '#3B82F6', role: 'Trafficker' },
  { name: 'Luisa',     color: '#EF4444', role: 'Copywriter' },
  { name: 'Paula',     color: '#EC4899', role: 'Aux. Marketing' },
  { name: 'David',     color: '#06B6D4', role: 'Editor' },
  { name: 'Johan',     color: '#10B981', role: 'Editor' },
  { name: 'Felipe',    color: '#F97316', role: 'Editor' },
]

export function LoginPage() {
  const { user, signIn } = useAuth()
  const [email, setEmail]             = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  if (user) return <Navigate to="/" replace />

  const selectProfile = (member: typeof TEAM[0]) => {
    setSelectedUser(member.name)
    setError('')
    // No auto-fill del email — cada quien ingresa el suyo
  }

  const handleLogin = async () => {
    if (!selectedUser) { setError('Selecciona tu perfil primero'); return }
    if (!email.trim()) { setError('Confirma tu email'); return }
    setLoading(true); setError('')
    const result = await signIn(email.trim().toLowerCase())
    if (result.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'radial-gradient(ellipse at 30% 20%, rgba(124,131,247,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(245,166,35,0.06) 0%, transparent 50%), #0D1117',
    }}>
      {/* ── Left panel ─────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'flex-start',
        padding: '60px 64px',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 64 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, #F5A623, #E8760A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 28px rgba(245,166,35,0.45)',
          }}>
            <Zap size={22} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#F0F0F0', margin: 0, letterSpacing: '-0.5px' }}>beezion</p>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#525669', margin: 0, letterSpacing: '0.14em', textTransform: 'uppercase' }}>ops hub</p>
          </div>
        </div>

        <h1 style={{ fontSize: 38, fontWeight: 800, color: '#F0F0F0', margin: '0 0 16px', lineHeight: 1.15, letterSpacing: '-1px', maxWidth: 420 }}>
          Gestiona el trabajo<br />
          <span style={{ color: '#7C83F7' }}>del equipo</span> desde aquí.
        </h1>
        <p style={{ fontSize: 15, color: '#525669', margin: '0 0 48px', lineHeight: 1.6, maxWidth: 360 }}>
          Campañas, tareas, Kanban, adjuntos y métricas — todo en un solo lugar para la agencia.
        </p>

        {/* Stacked team avatars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#3A3D4E', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Equipo Beezion</p>
          <div style={{ display: 'flex' }}>
            {TEAM.map((m, i) => (
              <div key={m.name} title={`${m.name} · ${m.role}`} style={{
                width: 36, height: 36, borderRadius: '50%',
                backgroundColor: `${m.color}25`, color: m.color,
                border: '2px solid #0D1117',
                fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: i > 0 ? -8 : 0, position: 'relative', zIndex: TEAM.length - i,
              }}>
                {m.name.slice(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right login panel ───────────────────────────────────────────── */}
      <div style={{ width: 460, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#E8EAED', margin: '0 0 6px' }}>Bienvenido de nuevo</h2>
          <p style={{ fontSize: 13, color: '#525669', margin: 0 }}>Selecciona tu perfil para entrar</p>
        </div>

        {/* Profile grid */}
        <div style={{ marginBottom: 22 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#525669', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Tu perfil</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TEAM.map(m => {
              const sel = selectedUser === m.name
              return (
                <button key={m.name} onClick={() => selectProfile(m)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                  border: sel ? `1.5px solid ${m.color}60` : '1.5px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer', backgroundColor: sel ? `${m.color}15` : 'rgba(255,255,255,0.03)',
                  transition: 'all 0.15s', textAlign: 'left',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: sel ? m.color : `${m.color}30`,
                    color: sel ? '#fff' : m.color,
                    fontSize: 10, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: sel ? '#E8EAED' : '#8B8FA8', margin: 0 }}>{m.name}</p>
                    <p style={{ fontSize: 10, color: '#525669', margin: 0 }}>{m.role}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Email field */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#525669', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Tu email
          </p>
          <div style={{ position: 'relative' }}>
            <Mail size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#525669', pointerEvents: 'none' }} />
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="tu@beezion.com"
              style={{
                width: '100%', padding: '12px 16px 12px 40px', borderRadius: 10,
                border: error ? '1.5px solid #F87171' : '1.5px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.04)', color: '#E8EAED', fontSize: 14,
                outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(124,131,247,0.5)' }}
              onBlur={e => { if (!error) e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
            />
          </div>
          {error && <p style={{ fontSize: 11, color: '#F87171', marginTop: 6 }}>{error}</p>}
        </div>

        {/* Submit */}
        <button onClick={handleLogin} disabled={loading} style={{
          width: '100%', padding: '13px', borderRadius: 10, border: 'none',
          background: loading ? 'rgba(124,131,247,0.4)' : 'linear-gradient(135deg, #7C83F7, #5B63F0)',
          color: '#fff', fontSize: 14, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: loading ? 'none' : '0 4px 20px rgba(124,131,247,0.35)',
          transition: 'all 0.15s',
        }}>
          {loading
            ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
            : <><span>Entrar al Hub</span><ArrowRight size={16} /></>
          }
        </button>

        <p style={{ fontSize: 11, color: '#3A3D4E', marginTop: 16, textAlign: 'center', lineHeight: 1.5 }}>
          Solo el equipo Beezion tiene acceso.<br />
          Si tu email no funciona, escríbele a Alejandro.
        </p>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}
