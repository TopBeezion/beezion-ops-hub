import { useState, useRef, useEffect, useMemo } from 'react'
import { useUserPreference } from '../hooks/useUserPreferences'
import { Search, Plus, X, ChevronDown, AlertTriangle, Columns as ColumnsIcon, Trash2 } from 'lucide-react'
import { SavedViewsMenu } from '../components/widgets/SavedViewsMenu'
import type { ViewConfig } from '../types'
import { getDaysOverdue } from '../lib/dates'
import { useTasks, useUpdateTask, useUpdateTaskStatus, useBulkDeleteTasks } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useCampaignsForSelector } from '../hooks/useCampaigns'
import { useOutletContext } from 'react-router-dom'
import type { Task, Area, Priority, TaskStatus, TaskFilters, Etapa } from '../types'
import {
  AREA_LABELS, AREA_COLORS, STATUS_LABELS, STATUS_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS, CAMPAIGN_TYPE_COLORS,
  ETAPA_LABELS, ETAPA_COLORS, ETAPA_ORDER,
} from '../lib/constants'

// ─── Alias map: lo que el usuario escribe → lo que se busca ─────────────────
const SEARCH_ALIASES: Record<string, string[]> = {
  'lp':             ['landing page', ' lp ', 'lp de', 'lp del', 'copy lp', 'desarrollar lp', 'crear lp'],
  'landing page':   ['landing page', ' lp ', 'lp de', 'lp del', 'copy lp', 'desarrollar lp', 'crear lp'],
  'lm':             ['lead magnet', ' lm ', 'lm de', 'lm del'],
  'lead magnet':    ['lead magnet', ' lm ', 'lm de', 'lm del'],
  'typ':            ['thank you page', ' typ', 'typage', 'thank you'],
  'thank you page': ['thank you page', ' typ', 'typage'],
  'vsl':            ['vsl', 'video sales letter'],
  'cta':            ['cta', 'call to action'],
  'hook':           ['hook', 'hooks'],
  'hooks':          ['hook', 'hooks'],
  'script':         ['script', 'scripts'],
  'scripts':        ['script', 'scripts'],
  'webinar':        ['webinar'],
  'quiz':           ['quiz', 'interactivo'],
}

function matchesSearch(title: string, query: string): boolean {
  const tl = ' ' + title.toLowerCase() + ' '
  const ql = query.toLowerCase().trim()
  if (tl.includes(ql)) return true
  const aliases = SEARCH_ALIASES[ql]
  if (aliases) return aliases.some(a => tl.includes(a))
  return false
}

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg: '#F0F2F8', surface: '#FFFFFF', border: '#E4E7F0',
  borderLight: '#ECEDF2', text: '#1A1D27', sub: '#5A5E72',
  muted: '#9699B0', accent: '#6366F1',
}

const STATUS_ORDER: TaskStatus[] = ['pendiente', 'en_proceso', 'aprobacion_interna', 'blocker', 'done']
const PRIORITY_ORDER: Priority[] = ['alerta_roja', 'alta', 'media', 'baja']
const AREA_ORDER: Area[] = ['copy', 'produccion', 'edicion', 'trafico', 'tech', 'admin']
const ASSIGNEES = [
  { name: 'Alejandro', color: '#8B5CF6', role: 'CEO · Estrategia' },
  { name: 'Alec',      color: '#F59E0B', role: 'Head of Paid' },
  { name: 'Jose',      color: '#3B82F6', role: 'Trafficker' },
  { name: 'Luisa',     color: '#EF4444', role: 'Copywriter' },
  { name: 'Paula',     color: '#EC4899', role: 'Project Manager' },
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

// ─── Filter Dropdown ──────────────────────────────────────────────────────────
function FilterDropdown({ label, options, value, onChange, multiValues, onMultiChange }: {
  label: string
  options: { value: string; label: string; color?: string; count?: number }[]
  value?: string
  onChange?: (v: string) => void
  multiValues?: string[]
  onMultiChange?: (v: string[]) => void
}) {
  const { open, setOpen, ref } = usePopover()
  const isMulti = !!onMultiChange
  const selected = isMulti ? (multiValues ?? []) : (value ? [value] : [])
  const isActive = selected.length > 0

  let btnLabel = ''
  let btnColor = C.accent
  if (selected.length === 1) {
    const opt = options.find(o => o.value === selected[0])
    btnLabel = opt?.label ?? ''
    btnColor = opt?.color ?? C.accent
  } else if (selected.length > 1) {
    btnLabel = `${selected.length} filtros`
    btnColor = C.accent
  }

  const toggle = (v: string) => {
    if (isMulti && onMultiChange && multiValues !== undefined) {
      onMultiChange(multiValues.includes(v) ? multiValues.filter(x => x !== v) : [...multiValues, v])
    } else if (onChange) {
      onChange(value === v ? '' : v)
      setOpen(false)
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, height: 32,
        padding: '0 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
        cursor: 'pointer', border: 'none', transition: 'all 0.12s',
        backgroundColor: isActive ? `${btnColor}14` : C.bg,
        outline: isActive ? `1.5px solid ${btnColor}50` : `1px solid ${C.border}`,
        color: isActive ? btnColor : C.sub,
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: isActive ? btnColor : C.muted, letterSpacing: '0.05em' }}>{label}</span>
        {btnLabel && <><span style={{ width: 1, height: 10, backgroundColor: isActive ? `${btnColor}40` : C.border }} /><span style={{ fontWeight: 700, fontSize: 11 }}>{btnLabel}</span></>}
        <ChevronDown size={10} style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: '0.15s', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 400,
          backgroundColor: '#fff', border: `1px solid ${C.border}`,
          borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.13)',
          padding: 4, minWidth: 180, maxHeight: 280, overflowY: 'auto',
        }}>
          {options.map(o => {
            const isSel = selected.includes(o.value)
            const oc = o.color ?? C.accent
            return (
              <button key={o.value} onClick={() => toggle(o.value)} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                backgroundColor: isSel ? `${oc}12` : 'transparent', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F6FA' }}
              onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}>
                {o.color && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: oc, flexShrink: 0 }} />}
                <span style={{ flex: 1, fontSize: 12, fontWeight: isSel ? 700 : 500, color: isSel ? oc : C.text }}>{o.label}</span>
                {o.count !== undefined && o.count > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: oc, backgroundColor: `${oc}15`, padding: '0 5px', borderRadius: 10 }}>{o.count}</span>}
                {isSel && <span style={{ fontSize: 11, color: oc }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Filter Chip (kept for compatibility) ────────────────────────────────────
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
  const { data: campaigns = [] } = useCampaignsForSelector()
  const updateTask = useUpdateTask()
  const updateStatus = useUpdateTaskStatus()
  const ctx = useOutletContext<{ openNewTask?: () => void; openTaskDetail?: (t: Task) => void }>()

  const ALL_COLS = ['num','title','campaign','client','status','priority','area','etapa','assignee','due_date'] as const
  const { value: prefs, setValue: setPrefs, loaded: prefsLoaded } = useUserPreference<{
    search: string
    activePersons: string[]
    activeClients: string[]
    activeStatuses: TaskStatus[]
    activeArea: Area | ''
    activeEtapa: Etapa | ''
    groupBy: GroupByOption
    visibleCols: string[]
  }>('backlog', {
    search: '',
    activePersons: [],
    activeClients: [],
    activeStatuses: [],
    activeArea: '',
    activeEtapa: '',
    groupBy: 'campaign',
    visibleCols: [...ALL_COLS],
  })

  const search = prefs.search
  const setSearch = (v: string) => setPrefs({ ...prefs, search: v })
  const activePersons = prefs.activePersons
  const setPersons = (v: string[]) => setPrefs({ ...prefs, activePersons: v })
  const activeClients = prefs.activeClients
  const setClients = (v: string[]) => setPrefs({ ...prefs, activeClients: v })
  const activeStatuses = prefs.activeStatuses
  const setStats = (v: TaskStatus[]) => setPrefs({ ...prefs, activeStatuses: v })
  const activeArea = prefs.activeArea
  const setArea = (v: Area | '') => setPrefs({ ...prefs, activeArea: v })
  const activeEtapa = prefs.activeEtapa
  const setEtapa = (v: Etapa | '') => setPrefs({ ...prefs, activeEtapa: v })
  const groupBy = prefs.groupBy
  const setGroupBy = (v: GroupByOption) => setPrefs({ ...prefs, groupBy: v })
  // Migrate legacy 'week' → 'due_date' from saved preferences
  const visibleCols = useMemo(() => {
    const cols = (prefs.visibleCols ?? []).map(c => c === 'week' ? 'due_date' : c)
    return new Set(cols)
  }, [prefs.visibleCols])
  const setVisibleCols = (next: Set<string>) => setPrefs({ ...prefs, visibleCols: Array.from(next) })
  void prefsLoaded

  const [collapsedGroups, setCollapsed] = useState<Set<string>>(new Set())
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const bulkDelete = useBulkDeleteTasks()
  const toggleCol = (k: string) => { const n = new Set(visibleCols); if (n.has(k)) n.delete(k); else n.add(k); setVisibleCols(n) }
  const [colsMenuOpen, setColsMenuOpen] = useState(false)
  const colsMenuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!colsMenuOpen) return
    const h = (e: MouseEvent) => { if (colsMenuRef.current && !colsMenuRef.current.contains(e.target as Node)) setColsMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [colsMenuOpen])
  const [activeViewId, setActiveViewId] = useState<string | undefined>()
  const applyView = (v: ViewConfig) => {
    setActiveViewId(v.id)
    const cfg = v.config
    if (cfg.filters) {
      setSearch(cfg.filters.search ?? '')
      setPersons(cfg.filters.assignee ? [cfg.filters.assignee] : [])
      setClients(cfg.filters.client_id ? [cfg.filters.client_id] : [])
      setStats(cfg.filters.status ? [cfg.filters.status] : [])
      setArea(cfg.filters.area ?? '')
      setEtapa(cfg.filters.etapa ?? '')
    }
    if (cfg.columns) setVisibleCols(new Set(cfg.columns as string[]))
  }

  const [filters] = useState<TaskFilters>({})
  const { data: tasks = [], isLoading } = useTasks(filters)

  const toggleArr = <T,>(arr: T[], set: (v: T[]) => void, val: T) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])

  const hasFilters = search || activePersons.length || activeClients.length || activeStatuses.length || activeArea || activeEtapa
  const clearAll = () => { setSearch(''); setPersons([]); setClients([]); setStats([]); setArea(''); setEtapa('') }

  const filtered = tasks.filter(t => {
    if (search && !matchesSearch(t.title, search)) return false
    if (activePersons.length && !activePersons.includes(t.assignee ?? '')) return false
    if (activeClients.length && !activeClients.includes(t.client_id ?? '')) return false
    if (activeStatuses.length && !activeStatuses.includes(t.status)) return false
    if (activeArea && t.area !== activeArea) return false
    if (activeEtapa && (t as any).etapa !== activeEtapa) return false
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

  // ── Multi-select helpers ─────────────────────────────────────
  const visibleTaskIds = useMemo(() => flatItems.filter(i => !i.isHeader).map(i => (i as any).task.id as string), [flatItems])
  const allVisibleSelected = visibleTaskIds.length > 0 && visibleTaskIds.every(id => selectedIds.has(id))
  const someVisibleSelected = visibleTaskIds.some(id => selectedIds.has(id))
  const toggleRow = (id: string) => { const n = new Set(selectedIds); n.has(id) ? n.delete(id) : n.add(id); setSelectedIds(n) }
  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      const n = new Set(selectedIds); visibleTaskIds.forEach(id => n.delete(id)); setSelectedIds(n)
    } else {
      const n = new Set(selectedIds); visibleTaskIds.forEach(id => n.add(id)); setSelectedIds(n)
    }
  }
  const clearSelection = () => setSelectedIds(new Set())
  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    if (!confirm(`¿Eliminar ${ids.length} tarea${ids.length === 1 ? '' : 's'}? Esta acción no se puede deshacer.`)) return
    bulkDelete.mutate(ids, { onSuccess: () => setSelectedIds(new Set()) })
  }

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
            {/* Columns toggle */}
            <div ref={colsMenuRef} style={{ position: 'relative' }}>
              <button onClick={() => setColsMenuOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, border: `1px solid ${C.border}`, backgroundColor: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: C.text }}>
                <ColumnsIcon size={12} /> Columnas <ChevronDown size={10} />
              </button>
              {colsMenuOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 50, backgroundColor: '#fff', border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 6, minWidth: 180 }}>
                  {ALL_COLS.map(k => {
                    const labels: Record<string, string> = { num: '#', title: 'Tarea', campaign: 'Campaña', client: 'Cliente', status: 'Estado', priority: 'Prioridad', area: 'Área', etapa: 'Etapa', assignee: 'Responsable', due_date: 'Fecha entrega' }
                    const on = visibleCols.has(k)
                    return (
                      <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: on ? C.text : C.muted }}>
                        <input type="checkbox" checked={on} onChange={() => toggleCol(k)} />
                        {labels[k]}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
            {/* Saved views */}
            <SavedViewsMenu
              page="backlog"
              currentConfig={{
                filters: { search, status: activeStatuses[0], area: activeArea || undefined, etapa: activeEtapa || undefined, assignee: activePersons[0], client_id: activeClients[0] },
                columns: Array.from(visibleCols),
              }}
              activeViewId={activeViewId}
              onApply={applyView}
            />
            {ctx?.openNewTask && (
              <button onClick={ctx.openNewTask} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: C.accent, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: `0 2px 8px ${C.accent}35` }}>
                <Plus size={13} strokeWidth={2.5} /> Nueva tarea
              </button>
            )}
          </div>
        </div>

        {/* ── FILTER BAR ─────────────────────────────────────────────────── */}
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tarea..."
              style={{ paddingLeft: 28, paddingRight: 10, height: 32, borderRadius: 8, border: `1px solid ${search ? C.accent : C.border}`, backgroundColor: search ? '#EEF2FF' : C.bg, color: C.text, fontSize: 12, outline: 'none', width: 160 }} />
          </div>
          <div style={{ width: 1, height: 20, backgroundColor: C.border, flexShrink: 0 }} />
          <FilterDropdown
            label="Estado"
            options={STATUS_ORDER.map(s => ({ value: s, label: STATUS_LABELS[s], color: STATUS_COLORS[s], count: statusCounts[s] }))}
            multiValues={activeStatuses}
            onMultiChange={v => setStats(v as TaskStatus[])}
          />
          <FilterDropdown
            label="Área"
            options={AREA_ORDER.map(a => ({ value: a, label: AREA_LABELS[a], color: AREA_COLORS[a] }))}
            value={activeArea}
            onChange={v => setArea(v as Area | '')}
          />
          <FilterDropdown
            label="Etapa"
            options={ETAPA_ORDER.map(e => ({ value: e, label: ETAPA_LABELS[e as Etapa], color: ETAPA_COLORS[e as Etapa] }))}
            value={activeEtapa}
            onChange={v => setEtapa(v as Etapa | '')}
          />
          <FilterDropdown
            label="Responsable"
            options={ASSIGNEES.map(({ name, color }) => ({ value: name, label: name, color }))}
            multiValues={activePersons}
            onMultiChange={v => setPersons(v)}
          />
          <FilterDropdown
            label="Cliente"
            options={clients.map(cl => ({ value: cl.id, label: cl.name, color: cl.color }))}
            multiValues={activeClients}
            onMultiChange={v => setClients(v)}
          />
          {hasFilters && (
            <button onClick={clearAll} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer', color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '0 10px', height: 32, flexShrink: 0 }}>
              <X size={9} /> Limpiar
            </button>
          )}
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
        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          {selectedIds.size > 0 && (
            <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', backgroundColor: '#EEF2FF', borderBottom: `1px solid #C7D2FE`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>
                {selectedIds.size} tarea{selectedIds.size === 1 ? '' : 's'} seleccionada{selectedIds.size === 1 ? '' : 's'}
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDelete.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, backgroundColor: '#DC2626', color: '#fff', border: 'none', fontSize: 11, fontWeight: 700, cursor: bulkDelete.isPending ? 'wait' : 'pointer', opacity: bulkDelete.isPending ? 0.6 : 1 }}
              >
                <Trash2 size={13} /> {bulkDelete.isPending ? 'Eliminando…' : 'Eliminar'}
              </button>
              <button
                onClick={clearSelection}
                style={{ padding: '6px 12px', borderRadius: 8, backgroundColor: '#fff', color: C.text, border: `1px solid ${C.border}`, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}>
              <tr>
                <th style={{ width: 36, padding: '8px 10px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={el => { if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected }}
                    onChange={toggleAllVisible}
                    onClick={e => e.stopPropagation()}
                    style={{ cursor: 'pointer', width: 14, height: 14 }}
                  />
                </th>
                {(([['num','#', '3%'], ['title','TAREA', '19%'], ['campaign','CAMPAÑA', '12%'], ['client','CLIENTE', '8%'], ['status','ESTADO', '9%'], ['priority','PRIORIDAD', '8%'], ['area','ÁREA', '7%'], ['etapa','ETAPA', '9%'], ['assignee','RESPONSABLE', '10%'], ['due_date','FECHA ENTREGA', '10%']]) as [string, string, string][]).filter(([k]) => visibleCols.has(k)).map(([k,l,w]) => (
                  <th key={k} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9, fontWeight: 800, letterSpacing: '0.09em', color: C.muted, width: w, whiteSpace: 'nowrap' }}>{l}</th>
                ))}
                <th style={{ width: '4%' }} />
              </tr>
            </thead>
            <tbody>
              {(() => {
                let rowNum = 0
                return flatItems.map(item => {
                if (item.isHeader) {
                  rowNum = 0
                  const isCollapsed = collapsedGroups.has(item.groupKey)
                  return (
                    <tr key={item.key}>
                      <td colSpan={12} style={{ padding: 0 }}>
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
                rowNum++
                const isHovered = hoveredRow === task.id
                const clientColor = clients.find(c => c.id === task.client_id)?.color

                return (
                  <tr key={item.key}
                    onClick={() => ctx?.openTaskDetail?.(task)}
                    onMouseEnter={() => setHoveredRow(task.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{ backgroundColor: selectedIds.has(task.id) ? '#EEF2FF' : (isHovered ? '#F4F5FF' : C.surface), borderBottom: `1px solid ${C.borderLight}`, cursor: 'pointer', transition: 'background 0.08s', borderLeft: clientColor ? `3px solid ${clientColor}` : 'none' }}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: '9px 10px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(task.id)}
                        onChange={() => toggleRow(task.id)}
                        style={{ cursor: 'pointer', width: 14, height: 14 }}
                      />
                    </td>
                    {/* # */}
                    {visibleCols.has('num') && <td style={{ padding: '9px 14px', color: C.muted, fontSize: 11, fontWeight: 700, userSelect: 'none' }}>{rowNum}</td>}
                    {/* Tarea */}
                    {visibleCols.has('title') && <td style={{ padding: '9px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        <span style={{ color: C.text, fontWeight: 500, fontSize: 12, lineHeight: 1.35 }}>{task.title}</span>
                        {(() => {
                          const days = getDaysOverdue(task)
                          if (days === 0) return null
                          return (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', flexShrink: 0, whiteSpace: 'nowrap' }}>
                              <AlertTriangle size={8} /> {days}d atrasada
                            </span>
                          )
                        })()}
                      </div>
                    </td>}
                    {/* Campaña */}
                    {visibleCols.has('campaign') && <td style={{ padding: '9px 14px', maxWidth: 0, overflow: 'hidden' }}>{renderCampaign(task.campaign)}</td>}
                    {/* Cliente */}
                    {visibleCols.has('client') && <td style={{ padding: '9px 14px' }}>{renderClient(task.client_id)}</td>}
                    {/* Estado */}
                    {visibleCols.has('status') && <td style={{ padding: '9px 14px' }}><StatusPicker task={task} onUpdate={handleStatusUpdate} /></td>}
                    {/* Prioridad */}
                    {visibleCols.has('priority') && <td style={{ padding: '9px 14px' }}><PriorityPicker task={task} onUpdate={handlePriorityUpdate} /></td>}
                    {/* Área */}
                    {visibleCols.has('area') && <td style={{ padding: '9px 14px' }}><AreaPicker task={task} onUpdate={handleAreaUpdate} /></td>}
                    {/* Etapa */}
                    {visibleCols.has('etapa') && <td style={{ padding: '9px 14px' }}>
                      {(task as any).etapa ? (() => {
                        const e = (task as any).etapa as Etapa
                        const ec = ETAPA_COLORS[e] ?? '#9699A6'
                        return (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                            backgroundColor: `${ec}15`, color: ec,
                            border: `1px solid ${ec}25`, whiteSpace: 'nowrap',
                          }}>
                            {ETAPA_LABELS[e] ?? e}
                          </span>
                        )
                      })() : <span style={{ color: C.muted, fontSize: 11 }}>—</span>}
                    </td>}
                    {/* Responsable */}
                    {visibleCols.has('assignee') && <td style={{ padding: '9px 14px' }}><AssigneePicker task={task} onUpdate={handleAssigneeUpdate} /></td>}
                    {/* Fecha de entrega */}
                    {visibleCols.has('due_date') && <td style={{ padding: '9px 14px' }}>
                      {task.due_date ? (() => {
                        const d = new Date(task.due_date + 'T00:00:00')
                        const today = new Date(); today.setHours(0,0,0,0)
                        const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000)
                        const overdue = diffDays < 0 && task.status !== 'done'
                        const soon = diffDays >= 0 && diffDays <= 3 && task.status !== 'done'
                        const fmt = d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
                        const bg = overdue ? '#FEF2F2' : soon ? '#FFFBEB' : '#F3F4F6'
                        const color = overdue ? '#DC2626' : soon ? '#B45309' : C.sub
                        const border = overdue ? '#FCA5A5' : soon ? '#FCD34D' : C.border
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 8, fontSize: 10.5, fontWeight: 700, backgroundColor: bg, color, border: `1px solid ${border}`, whiteSpace: 'nowrap' }}>
                            {fmt}
                          </span>
                        )
                      })() : <span style={{ color: C.muted }}>—</span>}
                    </td>}
                    <td style={{ padding: '9px 14px' }} />
                  </tr>
                )
              })
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
