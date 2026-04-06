import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  List,
  Kanban,
  CalendarDays,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  ChevronDown,
} from 'lucide-react'
import { useClients } from '../../hooks/useClients'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/backlog', icon: List, label: 'Backlog' },
  { to: '/kanban', icon: Kanban, label: 'Kanban' },
  { to: '/timeline', icon: CalendarDays, label: 'Timeline' },
  { to: '/settings', icon: Settings, label: 'Configuración' },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { data: clients } = useClients()
  const [clientsOpen, setClientsOpen] = useState(true)

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 shrink-0 relative"
      style={{
        width: collapsed ? 56 : 220,
        backgroundColor: '#111111',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        transition: 'width 220ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(245,166,35,0.7) 40%, rgba(139,92,246,0.5) 70%, transparent 100%)',
        }}
      />

      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-3.5 shrink-0"
        style={{
          height: 52,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div
          className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #f5a623 0%, #ff6b35 100%)',
            boxShadow: '0 0 14px rgba(245,166,35,0.45)',
          }}
        >
          <Zap size={12} color="#fff" fill="#fff" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold leading-none tracking-tight" style={{ color: '#f5f5f5' }}>Beezion</p>
            <p className="text-[9px] leading-none mt-0.5 font-semibold tracking-[0.12em] uppercase" style={{ color: '#f5a623' }}>OPS HUB</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-lg font-medium relative overflow-hidden ${
                collapsed ? 'justify-center px-0 py-2.5 w-full' : 'gap-2.5 px-3 py-2'
              } ${isActive ? 'active-nav' : ''}`
            }
            style={({ isActive }) => ({
              color: isActive ? '#f5a623' : '#5a5e7a',
              backgroundColor: isActive ? 'rgba(245,166,35,0.09)' : 'transparent',
              boxShadow: isActive ? 'inset 0 0 0 1px rgba(245,166,35,0.18)' : 'none',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                    style={{ backgroundColor: '#f5a623' }}
                  />
                )}
                <Icon
                  size={15}
                  className="shrink-0"
                  style={{ color: isActive ? '#f5a623' : '#6b6b6b' }}
                />
                {!collapsed && (
                  <span className="text-sm" style={{ color: isActive ? '#f5f5f5' : '#a1a1a1' }}>
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Clients section */}
        <div className="mt-5">
          {!collapsed && (
            <button
              onClick={() => setClientsOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1 w-full text-left mb-1 group"
            >
              <span
                className="text-[10px] font-bold uppercase tracking-[0.12em] flex-1"
                style={{ color: '#585858' }}
              >
                Clientes
              </span>
              <ChevronDown
                size={10}
                style={{
                  color: '#585858',
                  transform: clientsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 150ms',
                }}
              />
            </button>
          )}

          {(clientsOpen || collapsed) && clients?.map(client => (
            <NavLink
              key={client.id}
              to={`/clients/${client.id}`}
              title={collapsed ? client.name : undefined}
              className={`flex items-center rounded-lg relative ${
                collapsed ? 'justify-center px-0 py-2 w-full' : 'gap-2.5 px-3 py-1.5'
              }`}
              style={({ isActive }) => ({
                color: isActive ? '#f5f5f5' : '#a1a1a1',
                backgroundColor: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
              })}
            >
              {({ isActive }) => (
                <>
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: client.color,
                      boxShadow: isActive ? `0 0 8px ${client.color}` : 'none',
                    }}
                  />
                  {!collapsed && (
                    <span
                      className="truncate text-[12px] font-medium"
                      style={{ color: isActive ? '#f5f5f5' : '#a1a1a1' }}
                    >
                      {client.name}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Toggle button */}
      <div
        className="flex items-center justify-end px-2 py-2.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: '#585858' }}
          title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>
    </aside>
  )
}
