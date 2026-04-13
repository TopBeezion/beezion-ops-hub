import { useState, useRef, useEffect } from 'react'
import { Search, Plus, X, ChevronDown } from 'lucide-react'
import { useTasks, useUpdateTask, useUpdateTaskStatus } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useCampaigns } from '../hooks/useCampaigns'
import { useOutletContext } from 'react-router-dom'
import type { Task, Area, Priority, TaskStatus, TaskFilters } from '../types'
import {
  AREA_LABELS, AREA_COLORS, STATUS_LABELS, STATUS_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS, CAMPAIGN_TYPE_COLORS,
} from '../lib/constants'

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg: '#F0F2F8', surface: '#FFFFFF', border: '#E4E7F0',
  borderLight: '#ECEDF2', text: '#1A1D27', sub: '#5A5E72',
  muted: '#9699B0', accent: '#6366F1',
}

const STATUS_ORDER: TaskStatus[] = ['pendiente', 'en_progreso', 'revision', 'completado']
const PRIORITY_ORDER: Priority[] = ['alta', 'media', 'baja']
const AREA_ORDER: Area[] = ['copy', 'trafico', 'tech', 'admin']
const ASSIGNEES = [
  { name: 'Alejandro', color: '#8B5CF6', role: 'CEO · Estrategia' },
  { name: 'Alec',      color: '#F59E0B', role: 'Head of Paid' },
  { name: 'Jose',      color: '#3B82F6', role: 'Trafficker' },
  { name: 'Luisa',     color: '#EF4444', role: 'Copywriter' },
  { name: 'Paula',     color: '#EC4899', role: 'Aux. Marketing' },
  { name: 'David',     color: '#06B6D4', role: 'Editor' },
  { name: 'Johan',     color: '#10B981', role: 'Editor' },
  { name: 'Felipe',    color: '#F97316', role: 'Editor' },
]
type GroupByOption = 'campaign' | 'client' | 'assignee' | 'status' | 'none'

// ─── Generic Popover Hook ────────────────────────────────────────────────────
function usePopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return { open, setOpen, ref }
}

const popoverBox: React.CSSProperties = {
  position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 200,
  backgroundColor: C.surface, border: `1px solid ${C.border}`,
  borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.13)',
  padding: 6, minWidth: 170,
}

// ─── Status Picker ───────────────────────────────────────────────────────────
function StatusPicker({ task, onUpdate }: { task: Task; onUpdate: (id: string, s: TaskStatus) => void }) {
  const { open, setOpen, ref } = usePopover()
  const color = STATUS_COLORS[task.status]
  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
        cursor: 'pointer', border: 'none',
        backgroundColor: `${color}15`, color,
        outline: `1.5px solid ${color}35`,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color }} />
        {STATUS_LABELS[task.status]}
        <ChevronDown size={9} style={{ opacity: 0.6 }} />
      </button>
      {open && (
        <div style={{ ...popoverBox, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {STATUS_ORDER.map(s => {
            const sc = STATUS_COLORS[s]
            const isActive = task.status === s
            return (
              <button key={s} onClick={() => { onUpdate(task.id, s); setOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', backgroundColor: isActive ? `${sc}15` : 'transparent', transition: 'background 0.1s' }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = `${sc}10` }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: sc, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? sc : C.text, flex: 1 }}>{STATUS_LABELS[s]}</span>
                {isActive && <span style={{ fontSize: 10, color: sc }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Priority Picker ─────────────────────────────────────────────────────────
function PriorityPicker({ task, onUpdate }: { task: Task; onUpdate: (id: string, p: Priority) => void }) {
  const { open, setOpen, ref } = usePopover()
  const color = PRIORITY_COLORS[task.priority]
  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
        cursor: 'pointer', border: 'none',
        backgroundColor: `${color}15`, color,
        outline: `1.5px solid ${color}30`,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
        {PRIORITY_LABELS[task.priority]}
        <ChevronDown size={9} style={{ opacity: 0.6 }} />
      </button>
      {open && (
        <div style={{ ...popoverBox, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {PRIORITY_ORDER.map(p => {
            const pc = PRIORITY_COLORS[p]
            const isActive = task.priority === p
            return (
              <button key={p} onClick={() => { onUpdate(task.id, p); setOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', backgroundColor: isActive ? `${pc}15` : 'transparent', transition: 'background 0.1s' }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = `${pc}10` }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: pc }} />
                <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? pc : C.text, flex: 1 }}>{PRIORITY_LABELS[p]}</span>
                {isActive && <span style={{ fontSize: 10, color: pc }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Area Picker ─────────────────────────────────────────────────────────────
function AreaPicker({ task, onUpdate }: { task: Task; onUpdate: (id: string, a: Area) => void }) {
  const { open, setOpen, ref } = usePopover()
  const color = AREA_COLORS[task.area]
  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
        cursor: 'pointer', border: 'none',
        backgroundColor: `${color}15`, color,
        outline: `1.5px solid ${color}30`,
      }}>
        {AREA_LABELS[task.area]}
        <ChevronDown size={9} style={{ opacity: 0.6 }} />
      </button>
      {open && (
        <div style={{ ...popoverBox, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {AREA_ORDER.map(a => {
            const ac = AREA_COLORS[a]
            const isActive = task.area === a
            return (
              <button key={a} onClick={() => { onUpdate(task.id, a); setOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', backgroundColor: isActive ? `${ac}15` : 'transparent', transition: 'background 0.1s' }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = `${ac}10` }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: ac }} />
                <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? ac : C.text, flex: 1 }}>{AREA_LABELS[a]}</span>
                {isActive && <span style={{ fontSize: 10, color: ac }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Assignee Picker ─────────────────────────────────────────────────────────
function AssigneePicker({ task, onUpdate }: { task: Task; onUpdate: (id: string, name: string) => void }) {
  const { open, setOpen, ref } = usePopover()
  const a = ASSIGNEES.find(x => x.name === task.assignee)
  const color = a?.color ?? C.muted
  const ini = task.assignee?.slice(0, 2).toUpperCase() ?? '?'
  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 8px 3px 4px', borderRadius: 20, fontSize: 11, fontWeight: 600,
        cursor: 'pointer', border: 'none', backgroundColor: `${color}12`,
        outline: `1.5px solid ${color}30`,
      }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: `${color}30`, color, fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1.5px solid ${color}40` }}>{ini}</div>
        <span style={{ color: C.sub }}>{task.assignee || '—'}</span>
        <ChevronDown size={9} style={{ color: C.muted, opacity: 0.6 }} />
      </button>
      {open && (
        <div style={{ ...popoverBox, minWidth: 220, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 8 }}>
          {ASSIGNEES.map(({ name, color: ac, role }) => {
            const isActive = task.assignee === name
            return (
              <button key={name} onClick={() => { onUpdate(task.id, name); setOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', backgroundColor: isActive ? `${ac}15` : 'transparent', outline: isActive ? `1.5px solid ${ac}40` : 'none', transition: 'all 0.1s' }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F6FA' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: isActive ? ac : `${ac}25`, color: isActive ? '#fff' : ac, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: isActive ? 700 : 600, color: C.text, margin: 0 }}>{name}</p>
                  <p style={{ fontSize: 9, color: C.muted, margin: 0 }}>{role}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Filter Chip ─────────────────────────────────────────────────────────────
function Chip({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', padding: '4px 11px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.12s',
      backgroundColor: active ? color : C.surface, color: active ? '#fff' : C.sub,
      boxShadow: active ? `0 2px 8px ${color}40` : `inset 0 0 0 1px ${C.border}`,
    }}>{label}</button>
  )
}

export function BacklogPage() {
  const { data: clients = [] } = useClients()
  const { data: campaigns = [] } = useCampaigns()
  const updateTask = useUpdateTask()
  const updateStatus = useUpdateTaskStatus()
  const ctx = useOutletContext<{ openNewTask?: () => void; openTaskDetail?: (t: Task) => void }>()

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

  const toggleArr = <T,>(arr: T[], set: (v: T[]) => void, val: T) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])

  const hasFilters = search || activePersons.length || activeClients.length || activeStatuses.length || activeArea
  const clearAll = () => { setSearch(''); setPersons([]); setClients([]); setStats([]); setArea('') }

  const filtered = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    if (activePersons.length && !activePersons.includes(t.assignee ?? '')) return false
    if (activeClients.length && !activeClients.includes(t.client_id ?? '')) return false
    if (activeStatuses.length && !activeStatuses.includes(t.status)) return false
    if (activeArea && t.area !== activeArea) return false
    return true
  })

  const getKey = (t: Task): string => {
    if (groupBy === 'campaign') return t.campaign_id ?? 'unassigned'
    if (groupBy === 'client')   return t.client_id ?? 'unassigned'
    if (groupBy === 'assignee') return t.assignee ?? 'unassigned'
    if (groupBy === 'status')   return t.status
    return 'all'
  }

  const getGroupMeta = (key: string): { label: string; color: string } => {
    if (groupBy === 'campaign') {
      const cam = campaigns.find(c => c.id === key)
      const cl  = clients.find(c => c.id === cam?.client_id)
      return { label: cam ? `${cl?.name ?? ''} — ${cam.name}` : 'Sin campaña', color: cam ? (CAMPAIGN_TYPE_COLORS[cam.type as keyof typeof CAMPAIGN_TYPE_COLORS] ?? C.accent) : C.muted }
    }
    if (groupBy === 'client') { const cl = clients.find(c => c.id === key); return { label: cl?.name ?? 'Sin cliente', color: cl?.color ?? C.muted } }
    if (groupBy === 'assignee') { const a = ASSIGNEES.find(a => a.name === key); return { label: key === 'unassigned' ? 'Sin asignar' : key, color: a?.color ?? C.muted } }
    if (groupBy === 'status') return { label: STATUS_LABELS[key as TaskStatus] ?? key, color: STATUS_COLORS[key as TaskStatus] ?? C.muted }
    return { label: 'Todas', color: C.accent }
  }

  const grouped = Object.entries(
    filtered.reduce((acc, t) => { const k = getKey(t); if (!acc[k]) acc[k] = []; acc[k].push(t); return acc }, {} as Record<string, Task[]>)
  ).map(([key, ts]) => ({ key, tasks: ts, ...getGroupMeta(key) }))

  const flatItems = (groupBy === 'none'
    ? [{ isHeader: false as const, key: 'ph', label: '', color: C.accent, tasks: filtered }]
    : grouped
  ).flatMap(({ key, label, color, tasks: gt }) => [
    ...(groupBy !== 'none' ? [{ isHeader: true as const, key: `h-${key}`, groupKey: key, label, color, count: gt.length }] : []),
    ...gt.filter(() => groupBy === 'none' || !collapsedGroups.has(key)).map(task => ({ isHeader: false as const, key: task.id, task })),
  ])

  const toggleGroup = (k: string) => { const n = new Set(collapsedGroups); n.has(k) ? n.delete(k) : n.add(k); setCollapsed(n) }

  const handleStatusUpdate = (id: string, status: TaskStatus) => updateStatus.mutate({ id, status })
  const handlePriorityUpdate = (id: string, priority: Priority) => updateTask.mutate({ id, priority })
  const handleAreaUpdate = (id: string, area: Area) => updateTask.mutate({ id, area })
  const handleAssigneeUpdate = (id: string, assignee: string) => updateTask.mutate({ id, assignee })

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
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, color, backgroundColor: `${color}15`, border: `1px solid ${color}25`, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {campaign.name}
      </span>
    )
  }

  const statusCounts = STATUS_ORDER.reduce((acc, s) => { acc[s] = tasks.filter(t => t.status === s).length; return acc }, {} as Record<TaskStatus, number>)

  const Divider = () => <div style={{ width: 1, height: 32, backgroundColor: C.border, alignSelf: 'center', flexShrink: 0 }} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: C.bg }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: C.text, margin: 0 }}>Backlog</h1>
            <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#EEF2FF', color: C.accent, padding: '2px 9px', borderRadius: 20, border: `1px solid ${C.accent}20` }}>
              {filtered.length} tareas
            </span>
            {hasFilters && (
              <button onClick={clearAll} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer', color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 20, padding: '2px 9px' }}>
                <X size={9} /> Limpiar
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: 3, borderRadius: 10, border: `1px solid ${C.border}`, backgroundColor: C.bg }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.muted, padding: '2px 6px', letterSpacing: '0.06em' }}>AGRUPAR</span>
              {([['campaign', 'Campaña'], ['client', 'Cliente'], ['assignee', 'Persona'], ['status', 'Estado']] as [GroupByOption, string][]).map(([opt, lbl]) => (
                <button key={opt} onClick={() => setGroupBy(opt)} style={{ padding: '4px 9px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.12s', backgroundColor: groupBy === opt ? C.accent : 'transparent', color: groupBy === opt ? '#fff' : C.muted }}>
                  {lbl}
                </button>
              ))}
            </div>
            {ctx?.openNewTask && (
              <button onClick={ctx.openNewTask} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: C.accent, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: `0 2px 8px ${C.accent}35` }}>
                <Plus size={13} strokeWidth={2.5} /> Nueva tarea
              </button>
            )}
          </div>
        </div>

        {/* ── FILTER BAR ─────────────────────────────────────────────────── */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '8px 20px 10px', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Search */}
          <div style={{ position: 'relative', alignSelf: 'center' }}>
            <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tarea..."
              style={{ paddingLeft: 28, paddingRight: 12, paddingTop: 6, paddingBottom: 6, borderRadius: 10, border: `1px solid ${search ? C.accent : C.border}`, backgroundColor: search ? '#EEF2FF' : C.bg, color: C.text, fontSize: 12, outline: 'none', width: 175 }} />
          </div>
          <Divider />
          {/* Estado */}
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, color: C.muted, margin: '0 0 5px', letterSpacing: '0.1em' }}>ESTADO</p>
            <div style={{ display: 'flex', gap: 4 }}>
              {STATUS_ORDER.map(key => {
                const active = activeStatuses.includes(key); const sc = STATUS_COLORS[key]
                return (
                  <button key={key} onClick={() => toggleArr(activeStatuses, setStats, key)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.12s', backgroundColor: active ? sc : C.surface, color: active ? '#fff' : C.sub, boxShadow: active ? `0 2px 8px ${sc}40` : `inset 0 0 0 1px ${C.border}` }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: active ? 'rgba(255,255,255,0.7)' : sc }} />
                    {STATUS_LABELS[key]}
                    {statusCounts[key] > 0 && <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: active ? 'rgba(255,255,255,0.25)' : `${sc}20`, color: active ? '#fff' : sc, padding: '0 5px', borderRadius: 10 }}>{statusCounts[key]}</span>}
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
              {AREA_ORDER.map(a => <Chip key={a} label={AREA_LABELS[a]} active={activeArea === a} color={AREA_COLORS[a]} onClick={() => setArea(activeArea === a ? '' : a)} />)}
            </div>
          </div>
          <Divider />
          {/* Responsable */}
          <div>
            <p style={{ fontSize: 9, fontWeight: 800, color: C.muted, margin: '0 0 5px', letterSpacing: '0.1em' }}>RESPONSABLE</p>
            <div style={{ display: 'flex', gap: 4 }}>
              {ASSIGNEES.map(({ name, color }) => {
                const active = activePersons.includes(name)
                return (
                  <button key={name} onClick={() => toggleArr(activePersons, setPersons, name)} title={name}
                    style={{ width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', border: 'none', backgroundColor: active ? color : `${color}22`, color: active ? '#fff' : color, fontSize: 9, fontWeight: 800, outline: active ? `2px solid ${color}` : `1px solid ${color}35`, outlineOffset: active ? 1 : 0, transition: 'all 0.12s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {name.slice(0, 2).toUpperCase()}
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
              {clients.map(cl => <Chip key={cl.id} label={cl.name} active={activeClients.includes(cl.id)} color={cl.color} onClick={() => toggleArr(activeClients, setClients, cl.id)} />)}
            </div>
          </div>
        </div>
      </div>

      {/* ── HINT BAR ─────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#FFFBEB', borderBottom: `1px solid #FDE68A`, padding: '5px 20px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: '#92400E', fontWeight: 600 }}>
          💡 Haz click en Estado, Prioridad, Área o Responsable para cambiarlos directamente. Click en la tarea para ver detalle completo.
        </span>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #DBEAFE', borderTopColor: C.accent, animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 32 }}>🔍</span>
          <p style={{ color: C.sub, fontSize: 14, fontWeight: 600, margin: 0 }}>No hay tareas con estos filtros</p>
          <button onClick={clearAll} style={{ color: C.accent, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>Limpiar filtros</button>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}>
              <tr>
                {([['TAREA', '28%'], ['CAMPAÑA', '16%'], ['CLIENTE', '9%'], ['ESTADO', '11%'], ['PRIORIDAD', '9%'], ['ÁREA', '8%'], ['RESPONSABLE', '12%'], ['SEMANA', '7%']] as [string, string][]).map(([l, w]) => (
                  <th key={l} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9, fontWeight: 800, letterSpacing: '0.09em', color: C.muted, width: w, whiteSpace: 'nowrap' }}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flatItems.map(item => {
                if (item.isHeader) {
                  const isCollapsed = collapsedGroups.has(item.groupKey)
                  return (
                    <tr key={item.key}>
                      <td colSpan={8} style={{ padding: 0 }}>
                        <button onClick={() => toggleGroup(item.groupKey)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 14px', background: `${item.color}08`, border: 'none', borderLeft: `3px solid ${item.color}`, borderBottom: `1px solid ${item.color}18`, cursor: 'pointer' }}>
                          <span style={{ fontSize: 13, color: item.color, transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: '0.15s', display: 'inline-block' }}>›</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{item.label}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: item.color, backgroundColor: `${item.color}15`, padding: '1px 7px', borderRadius: 20, border: `1px solid ${item.color}25` }}>{item.count}</span>
                        </button>
                      </td>
                    </tr>
                  )
                }

                const task = item.task
                const isHovered = hoveredRow === task.id
                const clientColor = clients.find(c => c.id === task.client_id)?.color

                return (
                  <tr key={item.key}
                    onClick={() => ctx?.openTaskDetail?.(task)}
                    onMouseEnter={() => setHoveredRow(task.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{ backgroundColor: isHovered ? '#F4F5FF' : C.surface, borderBottom: `1px solid ${C.borderLight}`, cursor: 'pointer', transition: 'background 0.08s', borderLeft: clientColor ? `3px solid ${clientColor}40` : 'none' }}
                  >
                    {/* Tarea */}
                    <td style={{ padding: '9px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        {task.tipo === 'urgente' && <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 4, backgroundColor: '#FEE2E2', color: '#DC2626', flexShrink: 0 }}>URG</span>}
                        <span style={{ color: C.text, fontWeight: 500, fontSize: 12, lineHeight: 1.35 }}>{task.title}</span>
                      </div>
                    </td>
                    {/* Campaña */}
                    <td style={{ padding: '9px 14px', maxWidth: 0, overflow: 'hidden' }}>{renderCampaign(task.campaign)}</td>
                    {/* Cliente */}
                    <td style={{ padding: '9px 14px' }}>{renderClient(task.client_id)}</td>
                    {/* Estado */}
                    <td style={{ padding: '9px 14px' }}><StatusPicker task={task} onUpdate={handleStatusUpdate} /></td>
                    {/* Prioridad */}
                    <td style={{ padding: '9px 14px' }}><PriorityPicker task={task} onUpdate={handlePriorityUpdate} /></td>
                    {/* Área */}
                    <td style={{ padding: '9px 14px' }}><AreaPicker task={task} onUpdate={handleAreaUpdate} /></td>
                    {/* Responsable */}
                    <td style={{ padding: '9px 14px' }}><AssigneePicker task={task} onUpdate={handleAssigneeUpdate} /></td>
                    {/* Sprint */}
                    <td style={{ padding: '9px 14px' }}>
                      {task.week ? <span style={{ padding: '3px 9px', borderRadius: 8, fontSize: 10, fontWeight: 700, backgroundColor: '#EEF2FF', color: C.accent, border: `1px solid ${C.accent}20`, whiteSpace: 'nowrap' }}>Sem. {task.week}</span> : <span style={{ color: C.muted }}>—</span>}
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
