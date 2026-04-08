import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, List, Kanban, CalendarDays, Settings, ChevronLeft, ChevronRight, Zap, ChevronDown } from 'lucide-react'
import { useClients } from '../../hooks/useClients'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/', exact: true },
  { id: 'backlog', label: 'Backlog', icon: List, path: '/backlog' },
  { id: 'kanban', label: 'Kanban', icon: Kanban, path: '/kanban' },
  { id: 'timeline', label: 'Timeline', icon: CalendarDays, path: '/timeline' },
  { id: 'settings', label: 'Configuración', icon: Settings, path: '/settings' },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { data: clients } = useClients()
  const [clientsOpen, setClientsOpen] = useState(true)

  const toggleClientsSection = () => setClientsOpen(o => !o)

  return (
    <div
      style={{
        width: collapsed ? '56px' : '240px',
        backgroundColor: '#12141F',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
      }}
      className="flex flex-col h-full transition-all duration-220 relative"
    >
      {/* Top Accent Gradient */}
      <div
        style={{
          background: 'linear-gradient(90deg, #6366F1 0%, transparent 100%)',
          height: '2px',
          opacity: 0.3,
        }}
      />

      {/* Logo Section */}
      <div className="px-3 py-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
        <div className="flex items-center gap-2">
          <div
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
              padding: '6px 8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={16} color="white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span
                style={{ color: 'white', fontSize: '13px', fontWeight: '700', lineHeight: '1.2' }}
              >
                Beezion
              </span>
              <span
                style={{
                  color: '#6366F1',
                  fontSize: '10px',
                  fontWeight: '600',
                  lineHeight: '1.2',
                  letterSpacing: '0.5px',
                }}
              >
                OPS HUB
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="px-2 py-3 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.id === 'dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-md text-13px font-medium transition-all duration-150 relative group ${
                    isActive ? 'text-[#6366F1]' : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.09)' : 'transparent',
                  borderLeft: isActive ? '3px solid #6366F1' : '3px solid transparent',
                  paddingLeft: isActive ? '12px' : '12px',
                })}
              >
                <Icon size={15} className="flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {collapsed && item.label && (
                  <div
                    className="absolute left-full ml-2 px-2 py-1 rounded bg-[#1F2433] text-[#E5E7EB] text-12px whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50"
                    style={{ color: '#E5E7EB', fontSize: '12px' }}
                  >
                    {item.label}
                  </div>
                )}
              </NavLink>
            )
          })}
        </div>

        {/* Clients Section */}
        {!collapsed && (
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <button
              onClick={toggleClientsSection}
              className="flex items-center justify-between w-full px-3 py-2 transition-colors duration-150 group"
              style={{ color: '#6B7280' }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  color: '#4B5563',
                }}
              >
                Clientes
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${clientsOpen ? '' : '-rotate-90'}`}
                style={{ color: '#4B5563' }}
              />
            </button>

            {clientsOpen && (
              <div className="space-y-1 mt-2">
                {clients?.map(client => (
                    <NavLink
                      key={client.id}
                      to={`/clients/${client.id}`}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-150"
                      style={({ isActive }) => ({
                        color: isActive ? '#E5E7EB' : '#9CA3AF',
                        backgroundColor: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                      })}
                    >
                      {({ isActive }) => (
                        <>
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: client.color,
                              flexShrink: 0,
                              boxShadow: isActive ? `0 0 8px ${client.color}` : 'none',
                            }}
                          />
                          <span className="truncate" style={{ fontSize: '12px', fontWeight: 500, color: isActive ? '#E5E7EB' : '#9CA3AF' }}>
                            {client.name}
                          </span>
                        </>
                      )}
                    </NavLink>
                  ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Collapse Toggle Button */}
      <div
        className="px-2 py-3 border-t flex items-center justify-center"
        style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
      >
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md transition-colors duration-150 group"
          style={{
            color: '#9CA3AF',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#E5E7EB'
            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.09)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9CA3AF'
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </div>
  )
}
