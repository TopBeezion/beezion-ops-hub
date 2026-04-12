import { useState, useRef, useEffect } from 'react'
import { Search, Plus, X, ChevronDown } from 'lucide-react'
import { useTasks, useUpdateTask, useUpdateTaskStatus } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useCampaigns } from '../hooks/useCampaigns'
import { useOutletContext } from 'react-router-dom'
import type { Task, Area, Priority, TaskStatus, TaskFilters, Etapa } from '../types'
import {
  AREA_LABELS, AREA_COLORS, STATUS_LABELS, STATUS_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS, ETAPA_LABELS, ETAPA_COLORS, ETAPA_ORDER,
  CAMPAIGN_TYPE_COLORS,
} from '../lib/constants'

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg: '#F0F2F8',
  surface: '#FFFFFF',
  border: '#E4E7F0',
  borderLight: '#ECEDF2',
  text: '#1A1D27',
  sub: '#5A5E72',
  muted: '#9699B0',
  accent: '#6366F1',
}

const STATUS_ORDER: TaskStatus[] = ['pendiente', 'en_progreso', 'revision', 'completado']
const PRIORITY_CYCLE: Priority[] = ['baja', 'media', 'alta']

const ASSIGNEES = [
  { name: 'Alejandro', color: '#8B5CF6' },
  { name: 'Alec',      color: '#F59E0B' },
  { name: 'Jose',      color: '#3B82F6' },
  { name: 'Luisa',     color: '#EF4444' },
  { name: 'Paula',     color: '#EC4899' },
  { name: 'David',     color: '#06B6D4' },
  { name: 'Johan',     color: '#10B981' },
  { name: 'Felipe',    color: '#F97316' },
]

type GroupByOption = 'campaign' | 'client' | 'assignee' | 'status' | 'none'

// ─── Pill badge ─────────────────────────────────────────────────────────────
function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 20,
      fontSize: 10, fontWeight: 700,
      color, backgroundColor: `${color}18`,
      border: `1px solid ${color}28`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

// ─── Toggle chip ─────────────────────────────────────────────────────────────
function Chip({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '4px 11px', borderRadius: 20,
        fontSize: 11, fontWeight: 600,
        cursor: 'pointer', border: 'none', transition: 'all 0.12s',
        backgroundColor: active ? color : C.surface,
        color: active ? '#fff' : C.sub,
        boxShadow: active ? `0 2px 8px ${color}40` : `inset 0 0 0 1px ${C.border}`,
      }}
    >
      {label}
    </button>
  )
}

// ─── Inline Status Picker ───────────────────────────────────────────────────
function StatusPicker({ task, onUpdate }: { task: Task; onUpdate: (id: string, status: TaskStatus) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const color = STATUS_COLORS[task.status]

  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 20,
          fontSize: 10, fontWeight: 700,
          cursor: 'pointer', border: 'none', transition: 'all 0.12s',
          backgroundColor: `${color}18`,
          color,
          outline: `1.5px solid ${color}35`,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
        {STATUS_LABELS[task.status]}
        <ChevronDown size={10} style={{ opacity: 0.6 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
          backgroundColor: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: 6,
          minWidth: 160,
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {STATUS_ORDER.map(s => {
            const sc = STATUS_COLORS[s]
            const isActive = task.status === s
            return (
              <button
                key={s}
                onClick={() => { onUpdate(task.id, s); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', borderRadius: 8,
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  backgroundColor: isActive ? `${sc}15` : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = `${sc}10` }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: sc, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? sc : C.text }}>
                  {STATUS_LABELS[s]}
                </span>
                {isActive && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: sc, fontWeight: 800 }}>✓</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function BacklogPage() {
  const { data: clients = [] } = useClients()
  const { data: campaigns = [] } = useCampaigns()
  const updateTask = useUpdateTask()
  const updateStatus = useUpdateTaskStatus()
  const ctx = useOutletContext<{ openNewTask?: () => void; openTaskDetail?: (t: Task) => void }>()

  // ─── Filter state ─────────────────────────────────────────────────────────
  const [search, setSearch]         = useState('')
  const [activePersons, setPersons] = useState<string[]>([])
  const [activeClients, setClients] = useState<string[]>([])
  const [activeStatuses, setStats]  = useState<TaskStatus[]>([])
  const [activeArea, setArea]       = useState<Area | ''>('')
  const [groupBy, setGroupBy]       = useState<GroupByOption>('campaign')
  const [collapsedGroups, setCollapsed] = useState<Set<string>>(new Set())
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const [filters] = useState<TaskFilters>({})
  const { data: tasks = [], isLoading } = useTasks(filters)

  // ─── Toggle helpers ────────────────────────────────────────────────────────
  const toggleArr = <T,>(arr: T[], set: (v: T[]) => void, val: T) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])

  const hasFilters = search || activePersons.length || activeClients.length || activeStatuses.length || activeArea
  const clearAll = () => { setSearch(''); setPersons([]); setClients([]); setStats([]); setArea('') }

  // ─── Filtering ─────────────────────────────────────────────────────────────
  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    if (activePersons.length && !activePersons.includes(t.assignee ?? '')) return false
    if (activeClients.length && !activeClients.includes(t.client_id ?? '')) return false
    if (activeStatuses.length && !activeStatuses.includes(t.status)) return false
    if (activeArea && t.area !== activeArea) return false
    return true
  })

  // ─── Grouping ──────────────────────────────────────────────────────────────
  const getKey = (t: Task): string => {
    if (groupBy === 'campaign') return t.campaign_id ?? 'unassigned'
    if (groupBy === 'client')   return t.client_id ?? 'unassigned'
    if (groupBy === 'assignee') return t.assignee ?? 'unassigned'
    if (groupBy === 'status')   return t.status
    return 'all'
  }

  const getGroupMeta = (key: string): { label: string; color: string; sub?: string } => {
    if (groupBy === 'campaign') {
      const cam = campaigns.find(c => c.id === key)
      const cl  = clients.find(c => c.id === cam?.client_id)
      return {
        label: cam ? `${cl?.name ?? ''} — ${cam.name}` : 'Sin campaña',
        color: cam ? (CAMPAIGN_TYPE_COLORS[cam.type as keyof typeof CAMPAIGN_TYPE_COLORS] ?? C.accent) : C.muted,
        sub: cl?.name,
      }
    }
    if (groupBy === 'client') {
      const cl = clients.find(c => c.id === key)
      return { label: cl?.name ?? 'Sin cliente', color: cl?.color ?? C.muted }
    }
    if (groupBy === 'assignee') {
      const a = ASSIGNEES.find(a => a.name === key)
      return { label: key === 'unassigned' ? 'Sin asignar' : key, color: a?.color ?? C.muted }
    }
    if (groupBy === 'status') {
      return { label: STATUS_LABELS[key as TaskStatus] ?? key, color: STATUS_COLORS[key as TaskStatus] ?? C.muted }
    }
    return { label: 'Todas', color: C.accent }
  }

  const grouped = Object.entries(
    filtered.reduce((acc, t) => {
      const k = getKey(t)
      if (!acc[k]) acc[k] = []
      acc[k].push(t)
      return acc
    }, {} as Record<string, Task[]>)
  ).map(([key, tasks]) => ({ key, tasks, ...getGroupMeta(key) }))

  const flatItems = (groupBy === 'none'
    ? [{ isHeader: false as const, key: 'all-header-placeholder', label: '', color: C.accent, tasks: filtered }]
    : grouped
  ).flatMap(({ key, label, color, tasks: groupTasks }) => [
    ...(groupBy !== 'none' ? [{
      isHeader: true as const,
      key: `header-${key}`,
      groupKey: key,
      label,
      color,
      count: groupTasks.length,
    }] : []),
    ...groupTasks
      .filter(() => groupBy === 'none' || !collapsedGroups.has(key))
      .map(task => ({ isHeader: false as const, key: task.id, task })),
  ])

  const toggleGroup = (k: string) => {
    const next = new Set(collapsedGroups)
    next.has(k) ? next.delete(k) : next.add(k)
    setCollapsed(next)
  }

  // ─── Actions ───────────────────────────────────────────────────────────────
  const handleStatusUpdate = (id: string, status: TaskStatus) => {
    updateStatus.mutate({ id, status })
  }
  const cyclePriority = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = PRIORITY_CYCLE[(PRIORITY_CYCLE.indexOf(task.priority) + 1) % PRIORITY_CYCLE.length]
    updateTask.mutate({ id: task.id, priority: next })
  }

  // ─── Render helpers ────────────────────────────────────────────────────────
  const renderClient = (clientId?: string) => {
    const cl = clients.find(c => c.id === clientId)
    if (!cl) return <span style={{ color: C.muted, fontSize: 11 }}>—</span>
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: cl.color, flexShrink: 0 }} />
        <span style={{ color: C.text, fontSize: 11, fontWeight: 600 }}>{cl.name}</span>
      </div>
    )
  }

  const renderCampaign = (campaign?: Task['campaign']) => {
    if (!campaign) return <span style={{ color: C.muted, fontSize: 11 }}>—</span>
    const color = CAMPAIGN_TYPE_COLORS[campaign.type as keyof typeof CAMPAIGN_TYPE_COLORS] ?? C.muted
    return <Pill label={campaign.name} color={color} />
  }

  const renderAssignee = (assignee?: string) => {
    if (!assignee) return <span style={{ color: C.muted }}>—</span>
    const a = ASSIGNEES.find(x => x.name === assignee)
    const color = a?.color ?? C.muted
    const ini = assignee.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          backgroundColor: `${color}25`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontWeight: 800, flexShrink: 0,
          border: `1.5px solid ${color}40`,
        }}>{ini}</div>
        <span style={{ color: C.sub, fontSize: 11, fontWeight: 500 }}>{assignee}</span>
      </div>
    )
  }

  const Divider = () => <div style={{ width: 1, height: 32, backgroundColor: C.border, alignSelf: 'center', flexShrink: 0 }} />

  // status counts for filter chips
  const statusCounts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s).length
    return acc
  }, {} as Record<TaskStatus, number>)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: C.bg }}>

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>

        {/* Title + controls row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.3px' }}>
              Backlog
            </h1>
            <span style={{
              fontSize: 11, fontWeight: 700,
              backgroundColor: '#EEF2FF', color: C.accent,
              padding: '2px 9px', borderRadius: 20,
              border: `1px solid ${C.accent}20`,
            }}>
              {filtered.length} tareas
            </span>
            {hasFilters && (
              <button onClick={clearAll} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 10, fontWeight: 700, cursor: 'pointer',
                color: '#DC2626', backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5', borderRadius: 20, padding: '2px 9px',
              }}>
                <X size={9} /> Limpiar
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Group by */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 2,
              padding: 3, borderRadius: 10,
              border: `1px solid ${C.border}`, backgroundColor: C.bg,
            }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.muted, padding: '2px 6px', letterSpacing: '0.06em' }}>AGRUPAR</span>
              {([['campaign', 'Campaña'], ['client', 'Cliente'], ['assignee', 'Persona'], ['status', 'Estado']] as [GroupByOption, string][]).map(([opt, lbl]) => (
                <button key={opt} onClick={() => setGroupBy(opt)} style={{
                  padding: '4px 9px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                  backgroundColor: groupBy === opt ? C.accent : 'transparent',
                  color: groupBy === opt ? '#fff' : C.muted,
                }}>
                  {lbl}
                </button>
              ))}
            </div>

            {ctx?.openNewTask && (
              <button
                onClick={ctx.openNewTask}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 10,
                  backgroundColor: C.accent, color: '#fff',
                  border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  boxShadow: `0 2px 8px ${C.accent}35`,
                }}
              >
                <Plus size={13} strokeWidth={2.5} /> Nueva tarea
              </button>
            )}
          </div>
        </div>

        {/* ── FILTER BAR ──────────────────────────────────────────────────── */}
        <div style={{
          borderTop: `1px solid ${C.border}`,
          padding: '8px 20px 10px',
          display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start',
        }}>

          {/* Search */}
          <div style={{ position: 'relative', alignSelf: 'center' }}>
            <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar tarea..."
              style={{
                paddingLeft: 28, paddingRight: 12, paddingTop: 6, paddingBottom: 6,
                borderRadius: 10, border: `1px solid ${search ? C.accent : C.border}`,
                backgroundColor: search ? '#EEF2FF' : C.bg,
                color: C.text, fontSize: 12, outline: 'none', width: 175,
              }}
            />
          </div>

          <Divider />

          {/* Estado — con conteos */}
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, color: C.muted, margin: '0 0 5px', letterSpacing: '0.1em' }}>ESTADO</p>
            <div style={{ display: 'flex', gap: 4 }}>
              {STATUS_ORDER.map(key => {
                const active = activeStatuses.includes(key)
                const sc = STATUS_COLORS[key]
                return (
                  <button
                    key={key}
                    onClick={() => toggleArr(activeStatuses, setStats, key)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 20,
                      fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                      backgroundColor: active ? sc : C.surface,
                      color: active ? '#fff' : C.sub,
                      boxShadow: active ? `0 2px 8px ${sc}40` : `inset 0 0 0 1px ${C.border}`,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: active ? 'rgba(255,255,255,0.7)' : sc }} />
                    {STATUS_LABELS[key]}
                    {statusCounts[key] > 0 && (
                      <span style={{
                        fontSize: 9, fontWeight: 800,
                        backgroundColor: active ? 'rgba(255,255,255,0.25)' : `${sc}20`,
                        color: active ? '#fff' : sc,
                        padding: '0px 5px', borderRadius: 10,
                      }}>{statusCounts[key]}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <Divider />

          {/* Área */}
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, color: C.muted, margin: '0 0 5px', letterSpacing: '0.1em' }}>ÁREA</p>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['copy', 'trafico', 'tech', 'admin'] as Area[]).map(a => (
                <Chip
                  key={a}
                  label={AREA_LABELS[a]}
                  active={activeArea === a}
                  color={AREA_COLORS[a]}
                  onClick={() => setArea(activeArea === a ? '' : a)}
                />
              ))}
            </div>
          </div>

          <Divider />

          {/* Responsable — avatars */}
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, color: C.muted, margin: '0 0 5px', letterSpacing: '0.1em' }}>RESPONSABLE</p>
            <div style={{ display: 'flex', gap: 4 }}>
              {ASSIGNEES.map(({ name, color }) => {
                const active = activePersons.includes(name)
                const ini = name.slice(0, 2).toUpperCase()
                return (
                  <button
                    key={name}
                    onClick={() => toggleArr(activePersons, setPersons, name)}
                    title={name}
                    style={{
                      width: 30, height: 30, borderRadius: '50%',
                      cursor: 'pointer', border: 'none',
                      backgroundColor: active ? color : `${color}22`,
                      color: active ? '#fff' : color,
                      fontSize: 9, fontWeight: 800,
                      outline: active ? `2px solid ${color}` : `1px solid ${color}35`,
                      outlineOffset: active ? 1 : 0,
                      transition: 'all 0.12s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {ini}
                  </button>
                )
              })}
            </div>
          </div>

          <Divider />

          {/* Cliente */}
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, color: C.muted, margin: '0 0 5px', letterSpacing: '0.1em' }}>CLIENTE</p>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {clients.map(cl => (
                <Chip
                  key={cl.id}
                  label={cl.name}
                  active={activeClients.includes(cl.id)}
                  color={cl.color}
                  onClick={() => toggleArr(activeClients, setClients, cl.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '3px solid #DBEAFE', borderTopColor: C.accent,
              animation: 'spin 0.8s linear infinite', margin: '0 auto 10px',
            }} />
            <p style={{ color: C.sub, fontSize: 13 }}>Cargando tareas...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 32 }}>🔍</span>
          <p style={{ color: C.sub, fontSize: 14, fontWeight: 600, margin: 0 }}>No hay tareas con estos filtros</p>
          <button onClick={clearAll} style={{ color: C.accent, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>

            {/* Table header */}
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}>
              <tr>
                {([
                  ['TAREA', '30%'], ['CAMPAÑA', '18%'], ['CLIENTE', '10%'],
                  ['ESTADO', '11%'], ['PRIORIDAD', '9%'], ['ÁREA', '8%'],
                  ['RESPONSABLE', '9%'], ['S', '5%'],
                ] as [string, string][]).map(([l, w]) => (
                  <th key={l} style={{
                    padding: '8px 14px', textAlign: 'left',
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.09em',
                    color: C.muted, width: w, whiteSpace: 'nowrap',
                  }}>
                    {l}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table body */}
            <tbody>
              {flatItems.map(item => {
                if (item.isHeader) {
                  const isCollapsed = collapsedGroups.has(item.groupKey)
                  return (
                    <tr key={item.key}>
                      <td colSpan={8} style={{ padding: 0 }}>
                        <button
                          onClick={() => toggleGroup(item.groupKey)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%', padding: '7px 14px',
                            background: `${item.color}08`, border: 'none',
                            borderLeft: `3px solid ${item.color}`,
                            borderBottom: `1px solid ${item.color}18`,
                            cursor: 'pointer',
                          }}
                        >
                          <span style={{
                            fontSize: 13, color: item.color, display: 'inline-block',
                            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                            transition: '0.15s',
                          }}>›</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{item.label}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, color: item.color,
                            backgroundColor: `${item.color}15`, padding: '1px 7px',
                            borderRadius: 20, border: `1px solid ${item.color}25`,
                          }}>
                            {item.count}
                          </span>
                        </button>
                      </td>
                    </tr>
                  )
                }

                const task = item.task
                const isHovered = hoveredRow === task.id
                return (
                  <tr
                    key={item.key}
                    onClick={() => ctx?.openTaskDetail?.(task)}
                    onMouseEnter={() => setHoveredRow(task.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      backgroundColor: isHovered ? '#F4F5FF' : C.surface,
                      borderBottom: `1px solid ${C.borderLight}`,
                      cursor: 'pointer', transition: 'background 0.08s',
                    }}
                  >
                    {/* Tarea */}
                    <td style={{ padding: '9px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {task.tipo === 'urgente' && (
                          <span style={{
                            fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4,
                            backgroundColor: '#FEE2E2', color: '#DC2626', flexShrink: 0,
                          }}>URG</span>
                        )}
                        <span style={{ color: C.text, fontWeight: 500, fontSize: 12, lineHeight: 1.4 }} className="line-clamp-2">
                          {task.title}
                        </span>
                      </div>
                    </td>

                    {/* Campaña */}
                    <td style={{ padding: '9px 14px', maxWidth: 0 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {renderCampaign(task.campaign)}
                      </div>
                    </td>

                    {/* Cliente */}
                    <td style={{ padding: '9px 14px' }}>
                      {renderClient(task.client_id)}
                    </td>

                    {/* Estado — INLINE PICKER */}
                    <td style={{ padding: '9px 14px' }}>
                      <StatusPicker task={task} onUpdate={handleStatusUpdate} />
                    </td>

                    {/* Prioridad */}
                    <td style={{ padding: '9px 14px' }}>
                      <button
                        onClick={e => cyclePriority(task, e)}
                        title="Click para cambiar prioridad"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                          cursor: 'pointer', border: 'none',
                          backgroundColor: `${PRIORITY_COLORS[task.priority]}18`,
                          color: PRIORITY_COLORS[task.priority],
                          outline: `1px solid ${PRIORITY_COLORS[task.priority]}30`,
                        }}
                      >
                        <span style={{ fontSize: 7 }}>●</span>
                        {PRIORITY_LABELS[task.priority]}
                      </button>
                    </td>

                    {/* Área */}
                    <td style={{ padding: '9px 14px' }}>
                      <Pill label={AREA_LABELS[task.area]} color={AREA_COLORS[task.area]} />
                    </td>

                    {/* Responsable */}
                    <td style={{ padding: '9px 14px' }}>
                      {renderAssignee(task.assignee)}
                    </td>

                    {/* Sprint */}
                    <td style={{ padding: '9px 14px' }}>
                      {task.week ? (
                        <span style={{
                          padding: '3px 7px', borderRadius: 8,
                          fontSize: 10, fontWeight: 700,
                          backgroundColor: '#EEF2FF', color: C.accent,
                          border: `1px solid ${C.accent}20`,
                        }}>
                          S{task.week}
                        </span>
                      ) : <span style={{ color: C.muted }}>—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
