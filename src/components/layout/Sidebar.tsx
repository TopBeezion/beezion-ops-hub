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

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',     icon: LayoutDashboard, path: '/' },
  { id: 'bomberos',  label: '🔥 Bomberos',   icon: Flame,           path: '/bomberos',  accent: '#E2445C' },
  { id: 'campaigns', label: 'Campañas',      icon: Rocket,          path: '/campaigns' },
  { id: 'backlog',   label: 'Backlog',       icon: List,            path: '/backlog' },
  { id: 'kanban',    label: 'Kanban',        icon: Kanban,          path: '/kanban' },
  { id: 'timeline',  label: 'Timeline',      icon: CalendarDays,    path: '/timeline' },
  { id: 'settings',  label: 'Configuración', icon: Settings,        path: '/settings' },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { data: clients } = useClients()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [clientsOpen, setClientsOpen] = useState(true)

  const handleSignOut = () => { signOut(); navigate('/login') }

  return (
    <div style={{
      width: collapsed ? 56 : 228,
      backgroundColor: '#FFFFFF',
      borderRight: '1px solid #E8EAF0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      transition: 'width 0.2s ease',
      flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{
        padding: collapsed ? '16px 12px' : '16px 18px',
        borderBottom: '1px solid #F0F1F7',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minHeight: 56,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, #F5A623 0%, #E8971A 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(245,166,35,0.35)',
        }}>
          <Zap size={15} color="white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1D27', margin: 0, lineHeight: 1.2 }}>
              Beezion
            </p>
            <p style={{ fontSize: 9, fontWeight: 600, color: '#9699B0', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Ops Hub
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.id === 'dashboard'}
                title={collapsed ? item.label : undefined}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: collapsed ? '9px' : '9px 11px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#6366F1' : '#5A5E72',
                  backgroundColor: isActive ? '#EEF2FF' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                })}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  if (!el.style.backgroundColor.includes('EEF2FF')) {
                    el.style.backgroundColor = '#F5F6FA'
                    el.style.color = '#1A1D27'
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  if (!el.style.backgroundColor.includes('EEF2FF')) {
                    el.style.backgroundColor = 'transparent'
                    el.style.color = '#5A5E72'
                  }
                }}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={16}
                      strokeWidth={isActive ? 2.5 : 2}
                      color={(item as any).accent && !isActive ? (item as any).accent : undefined}
                      style={{ flexShrink: 0 }}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>

        {/* Clients section */}
        {!collapsed && clients && clients.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F0F1F7' }}>
            <button
              onClick={() => setClientsOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '4px 11px', background: 'none', border: 'none', cursor: 'pointer',
                marginBottom: 4,
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: '#B0B3C6', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Clientes
              </span>
              <ChevronDown
                size={12} color="#B0B3C6"
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
                      padding: '7px 11px', borderRadius: 7,
                      fontSize: 12, fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#1A1D27' : '#5A5E72',
                      backgroundColor: isActive ? '#F0F1F7' : 'transparent',
                      textDecoration: 'none', transition: 'all 0.15s',
                    })}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F5F6FA'; e.currentTarget.style.color = '#1A1D27' }}
                    onMouseLeave={e => {
                      if (!e.currentTarget.style.backgroundColor.includes('F0F1F7')) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#5A5E72'
                      }
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

      {/* User */}
      {user && (
        <div style={{ padding: '10px 8px', borderTop: '1px solid #F0F1F7' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 10px', borderRadius: 9,
            backgroundColor: '#F7F8FC',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              backgroundColor: `${ASSIGNEE_COLORS[user.name] || '#6366F1'}18`,
              color: ASSIGNEE_COLORS[user.name] || '#6366F1',
              fontSize: 10, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1.5px solid ${ASSIGNEE_COLORS[user.name] || '#6366F1'}30`,
            }}>
              {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>

            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#1A1D27', margin: 0 }} className="truncate">
                    {user.name}
                  </p>
                  <p style={{ fontSize: 9, color: '#9699B0', margin: 0 }} className="truncate">
                    {TEAM_ROLES[user.name] || user.role}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Cerrar sesión"
                  style={{
                    background: '#F5F6FA', border: '1px solid #E8EAF0', cursor: 'pointer',
                    color: '#9699B0', padding: '4px 7px', borderRadius: 6, flexShrink: 0,
                    transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 600,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#FEF2F4'
                    e.currentTarget.style.borderColor = '#FECDD3'
                    e.currentTarget.style.color = '#E2445C'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#F5F6FA'
                    e.currentTarget.style.borderColor = '#E8EAF0'
                    e.currentTarget.style.color = '#9699B0'
                  }}
                >
                  <LogOut size={11} />
                  <span>Salir</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <div style={{ padding: '8px', borderTop: '1px solid #F0F1F7', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onToggle}
          style={{
            padding: '6px', borderRadius: 7, background: 'none', border: 'none',
            cursor: 'pointer', color: '#B0B3C6', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F0F1F7'; e.currentTarget.style.color = '#5A5E72' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#B0B3C6' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  )
}
