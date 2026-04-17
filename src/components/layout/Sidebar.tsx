import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, List, Kanban, CalendarDays, Settings,
  ChevronLeft, ChevronRight, ChevronDown, Rocket, Flame, LogOut,
  Zap, Plus, Pencil, Trash2, Trash,
} from 'lucide-react'
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../../hooks/useClients'
import { useCampaigns, useCreateCampaign, useUpdateCampaign, useDeleteCampaign } from '../../hooks/useCampaigns'
import { useApplyCampaignTemplate } from '../../hooks/useCampaignTemplates'
import { useAuth } from '../../hooks/useAuth'
import {
  ASSIGNEE_COLORS, TEAM_ROLES, CAMPAIGN_TYPE_COLORS,
  CAMPAIGN_CATEGORY_LABELS, CAMPAIGN_CATEGORY_ICONS, CAMPAIGN_CATEGORY_ORDER,
  CAMPAIGN_STATUS_DOT,
} from '../../lib/constants'
import type { Campaign, CampaignCategory } from '../../types'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onNavClick?: () => void
}

const NAV = [
  { id: 'dashboard', label: 'Dashboard',    icon: LayoutDashboard, path: '/' },
  { id: 'bomberos',  label: 'Bomberos',     icon: Flame,           path: '/bomberos',  hot: true },
  { id: 'campaigns', label: 'Campañas',     icon: Rocket,          path: '/campaigns' },
  { id: 'backlog',   label: 'Backlog',      icon: List,            path: '/backlog' },
  { id: 'kanban',    label: 'Kanban',       icon: Kanban,          path: '/kanban' },
  { id: 'timeline',  label: 'Timeline',     icon: CalendarDays,    path: '/timeline' },
  { id: 'trash',     label: 'Papelera',     icon: Trash,           path: '/trash' },
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

export function Sidebar({ collapsed, onToggle, onNavClick }: SidebarProps) {
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
  const applyTemplate = useApplyCampaignTemplate()
  const [templatePickerFor, setTemplatePickerFor] = useState<{ clientId: string; category: CampaignCategory } | null>(null)

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

  /**
   * Create a campaign for a client, optionally applying a template (which seeds tasks).
   * Position is set to a large negative timestamp so the new campaign appears at the TOP
   * of its category folder; user can re-organize later.
   */
  const handleAddCampaign = async (
    clientId: string,
    category: CampaignCategory = 'meta_ads',
    options: { template?: 'nueva_campana' | null; promptName?: boolean } = {},
  ) => {
    const useTemplate = options.template ?? null
    const defaultName = useTemplate === 'nueva_campana' ? 'Campaña Nueva' : ''
    const name = window.prompt('Nombre de la nueva campaña:', defaultName)
    if (!name || !name.trim()) return
    try {
      const created = await createCampaign.mutateAsync({
        name: name.trim(),
        client_id: clientId,
        type: useTemplate ?? 'nueva_campana',
        status: 'activa',
        category,
        kind: 'group',
        position: -Math.floor(Date.now() / 1000),
      } as Parameters<typeof createCampaign.mutateAsync>[0])
      if (useTemplate && created?.id) {
        try { await applyTemplate.mutateAsync({ campaignId: created.id }) }
        catch (e) {
          alert(`Campaña creada, pero no se pudo aplicar el template: ${(e as { message?: string })?.message ?? e}`)
        }
      }
    } catch (e) {
      alert(`No se pudo crear la campaña: ${(e as { message?: string })?.message ?? e}`)
    } finally {
      setTemplatePickerFor(null)
    }
  }

  const handleDropToCategory = async (e: React.DragEvent, clientId: string, category: CampaignCategory) => {
    e.preventDefault()
    const campaignId = e.dataTransfer.getData('campaignId')
    const fromClient = e.dataTransfer.getData('clientId')
    if (!campaignId || fromClient !== clientId) return
    try {
      const patch: Partial<Campaign> & { id: string } = { id: campaignId, category }
      if (category === 'archivado') patch.status = 'desactivada'
      else patch.status = 'activa'
      await updateCampaign.mutateAsync(patch as Parameters<typeof updateCampaign.mutateAsync>[0])
    } catch (err) {
      alert(`No se pudo mover: ${(err as { message?: string })?.message ?? err}`)
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
    if (!window.confirm(`¿Mover "${name}" a la papelera? Podés restaurarla durante 7 días.`)) return
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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('sidebar_expanded_folders')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('sidebar_expanded_campaigns')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })
  const [dragOver, setDragOver] = useState<string | null>(null)

  const toggleClientExpanded = (id: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      try { localStorage.setItem('sidebar_expanded_clients', JSON.stringify([...next])) } catch {}
      return next
    })
  }
  const toggleFolderExpanded = (key: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      try { localStorage.setItem('sidebar_expanded_folders', JSON.stringify([...next])) } catch {}
      return next
    })
  }
  const toggleCampaignExpanded = (id: string) => {
    setExpandedCampaigns(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      try { localStorage.setItem('sidebar_expanded_campaigns', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const handleSignOut = () => { signOut(); navigate('/login') }

  return (
    <div style={{
      width: collapsed ? 58 : 280,
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
                onClick={onNavClick}
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
                  const clientAll = campaigns.filter(c => c.client_id === client.id)
                  const generalCamp = clientAll.find(c => c.kind === 'general')
                  // Group (top-level) campaigns per category
                  const groupsByCat: Record<CampaignCategory, Campaign[]> = {
                    general: [], meta_ads: [], google_ads: [], archivado: [],
                  }
                  clientAll
                    .filter(c => c.kind === 'group')
                    .forEach(c => { groupsByCat[c.category]?.push(c) })
                  ;(Object.keys(groupsByCat) as CampaignCategory[]).forEach(k => {
                    groupsByCat[k].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                  })
                  // Children for a group
                  const childrenOf = (parentId: string) =>
                    clientAll
                      .filter(c => c.parent_campaign_id === parentId)
                      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
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
                            padding: '6px 8px', borderRadius: 7, flex: 1,
                            fontSize: 13.5, fontWeight: isActive ? 700 : 600,
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
                        </NavLink>
                        <div className="sidebar-actions" style={{
                          display: 'none', alignItems: 'center', gap: 2,
                          position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                          background: S.bg, padding: '2px 3px', borderRadius: 6,
                          boxShadow: `0 1px 3px rgba(0,0,0,0.08)`,
                        }}>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTemplatePickerFor({ clientId: client.id, category: 'meta_ads' }) }}
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

                      {/* Category folders under client */}
                      {isExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginLeft: 18, paddingLeft: 8, borderLeft: `1px dashed ${S.border}` }}>
                          {/* General campaign (kind=general) */}
                          {generalCamp && (
                            <NavLink
                              to={`/campaigns/${generalCamp.id}`}
                              style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '5px 8px', borderRadius: 6,
                                fontSize: 12.5, fontWeight: isActive ? 700 : 600,
                                color: isActive ? S.text : S.sub,
                                backgroundColor: isActive ? S.active : 'transparent',
                                textDecoration: 'none',
                              })}
                              onMouseEnter={e => { e.currentTarget.style.backgroundColor = S.hover }}
                              onMouseLeave={e => {
                                const active = e.currentTarget.getAttribute('aria-current') === 'page'
                                e.currentTarget.style.backgroundColor = active ? S.active : 'transparent'
                              }}
                            >
                              <span style={{ fontSize: 11 }}>📋</span>
                              <span className="truncate" style={{ flex: 1 }}>General</span>
                              <span style={{
                                width: 7, height: 7, borderRadius: '50%',
                                backgroundColor: CAMPAIGN_STATUS_DOT[generalCamp.status],
                                flexShrink: 0,
                              }} />
                            </NavLink>
                          )}

                          {/* Meta Ads / Google Ads / Archivado folders */}
                          {CAMPAIGN_CATEGORY_ORDER.filter(cat => cat !== 'general').map(cat => {
                            const folderKey = `${client.id}:${cat}`
                            const folderOpen = expandedFolders.has(folderKey)
                            const groups = groupsByCat[cat] ?? []
                            const isDropping = dragOver === folderKey
                            return (
                              <div key={cat} style={{ display: 'flex', flexDirection: 'column' }}>
                                <div
                                  onDragOver={e => { e.preventDefault(); setDragOver(folderKey) }}
                                  onDragLeave={() => setDragOver(null)}
                                  onDrop={e => { setDragOver(null); handleDropToCategory(e, client.id, cat) }}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    borderRadius: 6,
                                    backgroundColor: isDropping ? S.accentBg : 'transparent',
                                    border: isDropping ? `1px dashed ${S.accent}` : '1px solid transparent',
                                  }}
                                >
                                  <button
                                    onClick={() => toggleFolderExpanded(folderKey)}
                                    style={{
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      width: 14, height: 22, border: 'none', cursor: 'pointer',
                                      background: 'transparent', color: S.muted, flexShrink: 0,
                                    }}
                                  >
                                    <ChevronRight size={10} style={{ transform: folderOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
                                  </button>
                                  <NavLink
                                    to={`/clients/${client.id}/folder/${cat}`}
                                    style={({ isActive }) => ({
                                      display: 'flex', alignItems: 'center', gap: 6, flex: 1,
                                      padding: '5px 6px', borderRadius: 6,
                                      fontSize: 12.5, fontWeight: isActive ? 700 : 600,
                                      color: isActive ? S.text : S.sub,
                                      backgroundColor: isActive ? S.active : 'transparent',
                                      textDecoration: 'none',
                                    })}
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = S.hover }}
                                    onMouseLeave={e => {
                                      const active = e.currentTarget.getAttribute('aria-current') === 'page'
                                      e.currentTarget.style.backgroundColor = active ? S.active : 'transparent'
                                    }}
                                  >
                                    <span>{CAMPAIGN_CATEGORY_ICONS[cat]}</span>
                                    <span className="truncate" style={{ flex: 1 }}>{CAMPAIGN_CATEGORY_LABELS[cat]}</span>
                                    {groups.length > 0 && (
                                      <span style={{ fontSize: 9, fontWeight: 700, color: S.muted }}>{groups.length}</span>
                                    )}
                                  </NavLink>
                                  {cat !== 'archivado' && (
                                    <button
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTemplatePickerFor({ clientId: client.id, category: cat }) }}
                                      title="Agregar campaña"
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.muted, padding: 2, display: 'flex', borderRadius: 4, marginRight: 4 }}
                                      onMouseEnter={e => { e.currentTarget.style.color = S.accent }}
                                      onMouseLeave={e => { e.currentTarget.style.color = S.muted }}
                                    >
                                      <Plus size={11} />
                                    </button>
                                  )}
                                </div>

                                {/* Group campaigns in this folder */}
                                {folderOpen && (
                                  <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 14, paddingLeft: 6, borderLeft: `1px dashed ${S.border}` }}>
                                    {groups.length === 0 && (
                                      <span style={{ fontSize: 10, color: S.muted, fontStyle: 'italic', padding: '3px 8px' }}>
                                        Vacío
                                      </span>
                                    )}
                                    {groups.map(camp => {
                                      const kids = childrenOf(camp.id)
                                      const campOpen = expandedCampaigns.has(camp.id)
                                      const color = CAMPAIGN_TYPE_COLORS[camp.type] ?? S.accent
                                      return (
                                        <div key={camp.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                          <div
                                            className="sidebar-row"
                                            draggable
                                            onDragStart={e => {
                                              e.dataTransfer.setData('campaignId', camp.id)
                                              e.dataTransfer.setData('clientId', client.id)
                                              e.dataTransfer.effectAllowed = 'move'
                                            }}
                                            style={{ display: 'flex', alignItems: 'center', position: 'relative' }}
                                          >
                                            <button
                                              onClick={() => toggleCampaignExpanded(camp.id)}
                                              style={{
                                                width: 12, height: 20, border: 'none', cursor: 'pointer',
                                                background: 'transparent', color: S.muted,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                              }}
                                            >
                                              <ChevronRight size={9} style={{ transform: campOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
                                            </button>
                                            <NavLink
                                              to={`/campaigns/${camp.id}`}
                                              style={({ isActive }) => ({
                                                display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0,
                                                padding: '4px 6px', borderRadius: 6,
                                                fontSize: 12.5, fontWeight: isActive ? 600 : 500,
                                                color: isActive ? S.text : S.sub,
                                                backgroundColor: isActive ? S.active : 'transparent',
                                                textDecoration: 'none',
                                              })}
                                              onMouseEnter={e => { e.currentTarget.style.backgroundColor = S.hover; e.currentTarget.style.color = S.text }}
                                              onMouseLeave={e => {
                                                const active = e.currentTarget.getAttribute('aria-current') === 'page'
                                                e.currentTarget.style.backgroundColor = active ? S.active : 'transparent'
                                                e.currentTarget.style.color = active ? S.text : S.sub
                                              }}
                                            >
                                              <div style={{ width: 3, height: 12, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
                                              <span className="truncate" style={{ flex: 1 }}>{camp.name}</span>
                                              <span style={{
                                                width: 6, height: 6, borderRadius: '50%',
                                                backgroundColor: CAMPAIGN_STATUS_DOT[camp.status],
                                                flexShrink: 0,
                                              }} />
                                            </NavLink>
                                            <div className="sidebar-actions" style={{
                                              display: 'none', alignItems: 'center', gap: 2,
                                              position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)',
                                              background: S.bg, padding: '2px 3px', borderRadius: 6,
                                              boxShadow: `0 1px 3px rgba(0,0,0,0.08)`,
                                            }}>
                                              <button
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRenameCampaign(camp.id, camp.name) }}
                                                title="Renombrar"
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.muted, padding: 2, display: 'flex', borderRadius: 4 }}
                                              >
                                                <Pencil size={10} />
                                              </button>
                                              <button
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteCampaign(camp.id, camp.name) }}
                                                title="Eliminar"
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.muted, padding: 2, display: 'flex', borderRadius: 4 }}
                                                onMouseEnter={e => { e.currentTarget.style.color = S.red }}
                                                onMouseLeave={e => { e.currentTarget.style.color = S.muted }}
                                              >
                                                <Trash2 size={10} />
                                              </button>
                                            </div>
                                          </div>

                                          {/* Children: Main / Iteración / Refresh */}
                                          {campOpen && (
                                            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 12, paddingLeft: 6, borderLeft: `1px dashed ${S.border}` }}>
                                              {kids.map(kid => (
                                                <NavLink
                                                  key={kid.id}
                                                  to={`/campaigns/${kid.id}`}
                                                  style={({ isActive }) => ({
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                    padding: '4px 8px', borderRadius: 5,
                                                    fontSize: 12, fontWeight: isActive ? 600 : 500,
                                                    color: isActive ? S.text : S.sub,
                                                    backgroundColor: isActive ? S.active : 'transparent',
                                                    textDecoration: 'none',
                                                  })}
                                                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = S.hover }}
                                                  onMouseLeave={e => {
                                                    const active = e.currentTarget.getAttribute('aria-current') === 'page'
                                                    e.currentTarget.style.backgroundColor = active ? S.active : 'transparent'
                                                  }}
                                                >
                                                  <div style={{
                                                    width: 4, height: 4, borderRadius: '50%',
                                                    backgroundColor: CAMPAIGN_TYPE_COLORS[kid.type] ?? S.muted,
                                                    flexShrink: 0,
                                                  }} />
                                                  <span className="truncate">{kid.name}</span>
                                                </NavLink>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })}
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

      {/* ── Template picker modal ──────────────────── */}
      {templatePickerFor && (
        <div
          onClick={() => setTemplatePickerFor(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,18,32,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFFFFF', borderRadius: 14, padding: 20, width: 360,
              boxShadow: '0 18px 50px rgba(15,18,32,0.25)',
              border: `1px solid ${S.border}`,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: S.text }}>
              Nueva campaña
            </h3>
            <p style={{ margin: '4px 0 14px', fontSize: 12, color: S.sub }}>
              Elegí cómo querés crearla.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => {
                  const target = templatePickerFor
                  if (target) handleAddCampaign(target.clientId, target.category, { template: 'nueva_campana' })
                }}
                style={{
                  textAlign: 'left', padding: '12px 14px', borderRadius: 10,
                  border: `1px solid ${S.border}`, background: '#FAFBFE',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = S.accent; e.currentTarget.style.background = S.accentBg }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.background = '#FAFBFE' }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: S.text }}>📦 Campaña Nueva (template)</span>
                <span style={{ fontSize: 11, color: S.sub }}>
                  Crea la campaña + 8 tareas (Scripts, Lead Magnet, Landing).
                </span>
              </button>
              <button
                onClick={() => {
                  const target = templatePickerFor
                  if (target) handleAddCampaign(target.clientId, target.category, { template: null })
                }}
                style={{
                  textAlign: 'left', padding: '12px 14px', borderRadius: 10,
                  border: `1px solid ${S.border}`, background: '#FAFBFE',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = S.accent; e.currentTarget.style.background = S.accentBg }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = S.border; e.currentTarget.style.background = '#FAFBFE' }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: S.text }}>🗂 Vacía</span>
                <span style={{ fontSize: 11, color: S.sub }}>Solo crea la campaña, sin tareas.</span>
              </button>
            </div>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setTemplatePickerFor(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, color: S.sub, padding: '6px 10px',
                }}
              >
                Cancelar
              </button>
            </div>
            <p style={{ marginTop: 8, fontSize: 10.5, color: S.muted, lineHeight: 1.5 }}>
              Podés editar los tasks de cada template desde Configuración → Templates.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
