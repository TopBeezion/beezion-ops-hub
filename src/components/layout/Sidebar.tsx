import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, List, Kanban, CalendarDays, Settings,
  ChevronLeft, ChevronRight, ChevronDown, Rocket, Flame, LogOut,
  Zap, Plus, Pencil, Trash2,
} from 'lucide-react'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../../hooks/useClients'
import { useCampaigns, useCreateCampaign, useUpdateCampaign, useDeleteCampaign } from '../../hooks/useCampaigns'
import { useAuth } from '../../hooks/useAuth'
import { ASSIGNEE_COLORS, TEAM_ROLES, CAMPAIGN_TYPE_COLORS } from '../../lib/constants'

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
  const { data: campaigns = [] } = useCampaigns()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const deleteClient = useDeleteClient()
  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign()
  const deleteCampaign = useDeleteCampaign()

  const randomColor = () => {
    const palette = ['#ec4899', '#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444']
    return palette[Math.floor(Math.random() * palette.length)]
  }

  const handleAddClient = async () => {
    const name = window.prompt('Nombre del nuevo cliente:')
    if (!name || !name.trim()) return
    try {
      await createClient.mutateAsync({ name: name.trim(), color: randomColor() })
    } catch (e) {
      alert(`No se pudo crear el cliente: ${(e as { message?: string })?.message ?? e}`)
    }
  }

  const handleRenameClient = async (id: string, currentName: string) => {
    const name = window.prompt('Nuevo nombre del cliente:', currentName)
    if (!name || !name.trim() || name === currentName) return
    try {
      await updateClient.mutateAsync({ id, name: name.trim() })
    } catch (e) {
      alert(`No se pudo renombrar: ${(e as { message?: string })?.message ?? e}`)
    }
  }

  const handleDeleteClient = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar cliente "${name}"? (sus campañas y tareas se preservan)`)) return
    try {
      await deleteClient.mutateAsync(id)
    } catch (e) {
      alert(`No se pudo eliminar: ${(e as { message?: string })?.message ?? e}`)
    }
  }

  const handleAddCampaign = async (clientId: string) => {
    const name = window.prompt('Nombre de la nueva campaña:')
    if (!name || !name.trim()) return
    try {
      await createCampaign.mutateAsync({
        name: name.trim(),
        client_id: clientId,
        type: 'nueva_campana',
        status: 'activa',
      } as Parameters<typeof createCampaign.mutateAsync>[0])
    } catch (e) {
      alert(`No se pudo crear la campaña: ${(e as { message?: string })?.message ?? e}`)
    }
  }

  const handleRenameCampaign = async (id: string, currentName: string) => {
    const name = window.prompt('Nuevo nombre de la campaña:', currentName)
    if (!name || !name.trim() || name === currentName) return
    try {
      await updateCampaign.mutateAsync({ id, name: name.trim() })
    } catch (e) {
      alert(`No se pudo renombrar: ${(e as { message?: string })?.message ?? e}`)
    }
  }

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar campaña "${name}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteCampaign.mutateAsync(id)
    } catch (e) {
      alert(`No se pudo eliminar: ${(e as { message?: string })?.message ?? e}`)
    }
  }
  const [clientsOpen, setClientsOpen] = useState(true)
  const [expandedClients, setExpandedClients] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('sidebar_expanded_clients')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })

  const toggleClientExpanded = (id: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      try { localStorage.setItem('sidebar_expanded_clients', JSON.stringify([...next])) } catch {}
      return next
    })
  }

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
        {!collapsed && (
          <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${S.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 8px 6px 11px' }}>
              <button
                onClick={() => setClientsOpen(o => !o)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
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
              <button
                onClick={handleAddClient}
                title="Agregar cliente"
                style={{
                  marginLeft: 6, background: 'none', border: 'none', cursor: 'pointer',
                  color: S.muted, padding: 2, borderRadius: 5, display: 'flex',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = S.accent; e.currentTarget.style.backgroundColor = S.hover }}
                onMouseLeave={e => { e.currentTarget.style.color = S.muted; e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <Plus size={12} />
              </button>
            </div>

            {clientsOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {(clients ?? []).map(client => {
                  const clientCampaigns = campaigns.filter(c => c.client_id === client.id && c.status !== 'desactivada')
                  const isExpanded = expandedClients.has(client.id)
                  return (
                    <div key={client.id} className="group" style={{ display: 'flex', flexDirection: 'column' }}>
                      {/* Client row (folder-style) */}
                      <div className="sidebar-row" style={{ display: 'flex', alignItems: 'center', gap: 0, position: 'relative' }}>
                        <button
                          onClick={() => toggleClientExpanded(client.id)}
                          title={isExpanded ? 'Colapsar' : 'Expandir'}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 18, height: 26, border: 'none', cursor: 'pointer',
                            background: 'transparent', color: S.muted, flexShrink: 0, borderRadius: 4,
                          }}
                        >
                          <ChevronRight
                            size={11}
                            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
                          />
                        </button>
                        <NavLink
                          to={`/clients/${client.id}`}
                          style={({ isActive }) => ({
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '5px 8px', borderRadius: 7, flex: 1,
                            fontSize: 12, fontWeight: isActive ? 700 : 600,
                            color: isActive ? S.text : S.text,
                            backgroundColor: isActive ? S.active : 'transparent',
                            textDecoration: 'none', transition: 'all 0.12s',
                          })}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = S.hover }}
                          onMouseLeave={e => {
                            const active = e.currentTarget.getAttribute('aria-current') === 'page'
                            e.currentTarget.style.backgroundColor = active ? S.active : 'transparent'
                          }}
                        >
                          <div style={{
                            width: 14, height: 14, borderRadius: 3,
                            backgroundColor: `${client.color}25`,
                            border: `1.5px solid ${client.color}`,
                            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: client.color }} />
                          </div>
                          <span className="truncate" style={{ flex: 1 }}>{client.name}</span>
                          {clientCampaigns.length > 0 && (
                            <span className="sidebar-count" style={{ fontSize: 9, fontWeight: 700, color: S.muted, flexShrink: 0 }}>
                              {clientCampaigns.length}
                            </span>
                          )}
                        </NavLink>
                        <div className="sidebar-actions" style={{
                          display: 'none', alignItems: 'center', gap: 2,
                          position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                          background: S.bg, padding: '2px 3px', borderRadius: 6,
                          boxShadow: `0 1px 3px rgba(0,0,0,0.08)`,
                        }}>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddCampaign(client.id) }}
                            title="Agregar campaña"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.muted, padding: 2, display: 'flex', borderRadius: 4 }}
                            onMouseEnter={e => { e.currentTarget.style.color = S.accent }}
                            onMouseLeave={e => { e.currentTarget.style.color = S.muted }}
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRenameClient(client.id, client.name) }}
                            title="Renombrar cliente"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.muted, padding: 2, display: 'flex', borderRadius: 4 }}
                            onMouseEnter={e => { e.currentTarget.style.color = S.accent }}
                            onMouseLeave={e => { e.currentTarget.style.color = S.muted }}
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteClient(client.id, client.name) }}
                            title="Eliminar cliente"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.muted, padding: 2, display: 'flex', borderRadius: 4 }}
                            onMouseEnter={e => { e.currentTarget.style.color = S.red }}
                            onMouseLeave={e => { e.currentTarget.style.color = S.muted }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Campaigns under client */}
                      {isExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginLeft: 18, paddingLeft: 8, borderLeft: `1px dashed ${S.border}` }}>
                          {clientCampaigns.length === 0 && (
                            <span style={{ fontSize: 10, color: S.muted, fontStyle: 'italic', padding: '4px 10px' }}>
                              Sin campañas activas
                            </span>
                          )}
                          {clientCampaigns.map(camp => {
                            const color = CAMPAIGN_TYPE_COLORS[camp.type] ?? S.accent
                            return (
                              <div key={camp.id} className="sidebar-row" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                                <NavLink
                                  to={`/kanban?campaign=${camp.id}`}
                                  style={({ isActive }) => ({
                                    display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0,
                                    padding: '4px 8px', borderRadius: 6,
                                    fontSize: 11, fontWeight: isActive ? 600 : 400,
                                    color: isActive ? S.text : S.sub,
                                    backgroundColor: isActive ? S.active : 'transparent',
                                    textDecoration: 'none', transition: 'all 0.12s',
                                  })}
                                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = S.hover; e.currentTarget.style.color = S.text }}
                                  onMouseLeave={e => {
                                    const active = e.currentTarget.getAttribute('aria-current') === 'page'
                                    e.currentTarget.style.backgroundColor = active ? S.active : 'transparent'
                                    e.currentTarget.style.color = active ? S.text : S.sub
                                  }}
                                >
                                  <div style={{
                                    width: 3, height: 14, borderRadius: 2,
                                    backgroundColor: color, flexShrink: 0,
                                  }} />
                                  <span className="truncate">{camp.name}</span>
                                </NavLink>
                                <div className="sidebar-actions" style={{
                                  display: 'none', alignItems: 'center', gap: 2,
                                  position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)',
                                  background: S.bg, padding: '2px 3px', borderRadius: 6,
                                  boxShadow: `0 1px 3px rgba(0,0,0,0.08)`,
                                }}>
                                  <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRenameCampaign(camp.id, camp.name) }}
                                    title="Renombrar campaña"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.muted, padding: 2, display: 'flex', borderRadius: 4 }}
                                    onMouseEnter={e => { e.currentTarget.style.color = S.accent }}
                                    onMouseLeave={e => { e.currentTarget.style.color = S.muted }}
                                  >
                                    <Pencil size={10} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteCampaign(camp.id, camp.name) }}
                                    title="Eliminar campaña"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.muted, padding: 2, display: 'flex', borderRadius: 4 }}
                                    onMouseEnter={e => { e.currentTarget.style.color = S.red }}
                                    onMouseLeave={e => { e.currentTarget.style.color = S.muted }}
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                          <button
                            onClick={() => handleAddCampaign(client.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '4px 8px', borderRadius: 6, marginTop: 2,
                              fontSize: 10, fontWeight: 500, color: S.muted,
                              background: 'none', border: `1px dashed ${S.border}`, cursor: 'pointer',
                              transition: 'all 0.12s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = S.accent; e.currentTarget.style.borderColor = S.accent }}
                            onMouseLeave={e => { e.currentTarget.style.color = S.muted; e.currentTarget.style.borderColor = S.border }}
                          >
                            <Plus size={10} />
                            <span>Agregar campaña</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
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
