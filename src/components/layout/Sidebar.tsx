import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, List, Kanban, CalendarDays, Settings,
  ChevronLeft, ChevronRight, ChevronDown, Rocket, Flame, LogOut,
  Zap,
} from 'lucide-react'
import { useClients } from '../../hooks/useClients'
import { useAuth } from '../../hooks/useAuth'
import { ASSIGNEE_COLORS, TEAM_ROLES } from '../../lib/constants'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard',    icon: LayoutDashboard, path: '/' },
  { id: 'bomberos',  label: 'Bomberos',     icon: Flame,           path: '/bomberos',  hot: true },
  { id: 'campaigns', label: 'Campañas',     icon: Rocket,          path: '/campaigns' },
  { id: 'backlog',   label: 'Backlog',      icon: List,            path: '/backlog' },
  { id: 'kanban',    label: 'Kanban',       icon: Kanban,          path: '/kanban' },
  { id: 'timeline',  label: 'Timeline',     icon: CalendarDays,    path: '/timeline' },
  { id: 'settings',  label: 'Config',       icon: Settings,        path: '/settings' },
]

// Light palette
const S = {
  bg:       '#FFFFFF',
  hover:    '#F5F6FA',
  active:   '#EEF2FF',
  border:   '#E4E7F0',
  text:     '#1A1D27',
  sub:      '#5A5E72',
  muted:    '#9699B0',
  accent:   '#6366F1',
  accentBg: 'rgba(99,102,241,0.08)',
  red:      '#EF4444',
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { data: clients } = useClients()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [clientsOpen, setClientsOpen] = useState(true)

  const handleSignOut = () => { signOut(); navigate('/login') }

  return (
    <div style={{
      width: collapsed ? 58 : 220,
      backgroundColor: S.bg,
      borderRight: `1px solid ${S.border}`,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'width 0.2s ease',
      flexShrink: 0,
    }}>

      {/* ── Logo ────────────────────────────────────── */}
      <div style={{
        padding: collapsed ? '14px 0' : '14px 16px',
        borderBottom: `1px solid ${S.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
        minHeight: 58, justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #F5A623 0%, #E8760A 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(245,166,35,0.35)',
        }}>
          <Zap size={16} color="white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: S.text, margin: 0, letterSpacing: '-0.3px' }}>
              beezion
            </p>
            <p style={{ fontSize: 9, fontWeight: 600, color: S.muted, margin: 0, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              ops hub
            </p>
          </div>
        )}
      </div>

      {/* ── Nav ─────────────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.id === 'dashboard'}
                title={collapsed ? item.label : undefined}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: collapsed ? '9px 0' : '8px 11px',
                  borderRadius: 9, fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? S.accent : S.sub,
                  backgroundColor: isActive ? S.accentBg : 'transparent',
                  textDecoration: 'none', transition: 'all 0.12s',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  border: isActive ? `1px solid rgba(99,102,241,0.18)` : '1px solid transparent',
                })}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  if (!el.style.backgroundColor.includes('99,102')) {
                    el.style.backgroundColor = S.hover
                    el.style.color = S.text
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  if (!el.style.backgroundColor.includes('99,102')) {
                    el.style.backgroundColor = 'transparent'
                    el.style.color = S.sub
                  }
                }}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16} strokeWidth={isActive ? 2.5 : 2}
                      color={item.hot ? (isActive ? '#FB923C' : '#EF4444') : (isActive ? S.accent : S.sub)}
                      style={{ flexShrink: 0 }}
                    />
                    {!collapsed && (
                      <span style={{ flex: 1 }}>
                        {item.hot ? `🔥 ${item.label}` : item.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>

        {/* ── Clients ──────────────────────────────── */}
        {!collapsed && clients && clients.length > 0 && (
          <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${S.border}` }}>
            <button
              onClick={() => setClientsOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '3px 11px 6px', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Clientes
              </span>
              <ChevronDown
                size={11} color={S.muted}
                style={{ transform: clientsOpen ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s' }}
              />
            </button>

            {clientsOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {clients.map(client => (
                  <NavLink
                    key={client.id}
                    to={`/clients/${client.id}`}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '6px 11px', borderRadius: 8,
                      fontSize: 12, fontWeight: isActive ? 600 : 400,
                      color: isActive ? S.text : S.sub,
                      backgroundColor: isActive ? S.active : 'transparent',
                      textDecoration: 'none', transition: 'all 0.12s',
                    })}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = S.hover; e.currentTarget.style.color = S.text }}
                    onMouseLeave={e => {
                      const isActive = e.currentTarget.getAttribute('aria-current') === 'page'
                      e.currentTarget.style.backgroundColor = isActive ? S.active : 'transparent'
                      e.currentTarget.style.color = isActive ? S.text : S.sub
                    }}
                  >
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      backgroundColor: client.color, flexShrink: 0,
                    }} />
                    <span className="truncate">{client.name}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ── User ────────────────────────────────────── */}
      {user && (
        <div style={{ padding: '8px', borderTop: `1px solid ${S.border}` }}>
          {collapsed ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                backgroundColor: `${ASSIGNEE_COLORS[user.name] || S.accent}15`,
                color: ASSIGNEE_COLORS[user.name] || S.accent,
                fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1.5px solid ${ASSIGNEE_COLORS[user.name] || S.accent}30`,
              }}>
                {user.name.slice(0, 2).toUpperCase()}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 10,
              backgroundColor: '#F5F6FA',
              border: `1px solid ${S.border}`,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${ASSIGNEE_COLORS[user.name] || S.accent}, ${ASSIGNEE_COLORS[user.name] || S.accent}80)`,
                color: '#fff',
                fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: S.text, margin: 0 }} className="truncate">
                  {user.name}
                </p>
                <p style={{ fontSize: 9, color: S.muted, margin: 0 }} className="truncate">
                  {TEAM_ROLES[user.name] || user.role}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                title="Salir"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: S.muted, padding: '4px', borderRadius: 6, flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 10, fontWeight: 600, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = S.red }}
                onMouseLeave={e => { e.currentTarget.style.color = S.muted }}
              >
                <LogOut size={13} />
                <span>Salir</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Collapse toggle ──────────────────────────── */}
      <div style={{ padding: '8px', borderTop: `1px solid ${S.border}`, display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onToggle}
          style={{
            padding: '6px', borderRadius: 7, background: 'none', border: 'none',
            cursor: 'pointer', color: S.muted, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = S.hover; e.currentTarget.style.color = S.text }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = S.muted }}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>
    </div>
  )
}
