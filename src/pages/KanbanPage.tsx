import { useState, useMemo, useRef, useEffect } from 'react'
import { useTasks, useUpdateTaskStatus } from '../hooks/useTasks'
import { useUserPreference } from '../hooks/useUserPreferences'
import { getDaysOverdue } from '../lib/dates'
import { useClients } from '../hooks/useClients'
import { useCampaigns } from '../hooks/useCampaigns'
import { useIsMobile } from '../hooks/useIsMobile'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, ChevronDown, SlidersHorizontal, X } from 'lucide-react'
import type { Task, TaskStatus, Area, Client, Priority, Etapa } from '../types'
import {
  AREA_LABELS, AREA_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS, ASSIGNEE_COLORS,
  STATUS_LABELS, STATUS_COLORS, STATUS_ORDER,
  ETAPA_LABELS, ETAPA_COLORS, ETAPA_ORDER,
  KANBAN_GROUP_BY_OPTIONS, getTaskAssignees,
} from '../lib/constants'

type GroupByKey = 'status' | 'etapa' | 'assignee' | 'priority' | 'area' | 'client'

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#F0F2F8',
  card: '#FFFFFF',
  border: '#E4E7F0',
  text: '#1A1D27',
  sub: '#5A5E72',
  muted: '#9699B0',
  accent: '#6366F1',
}

type Column = { id: string; label: string; color: string; bg: string }

const bgFor = (color: string) => `${color}0D`

const STATUS_COLUMNS: Column[] = STATUS_ORDER.map(s => ({
  id: s, label: STATUS_LABELS[s], color: STATUS_COLORS[s], bg: bgFor(STATUS_COLORS[s]),
}))

function buildColumns(groupBy: GroupByKey, clients: Client[], tasks: Task[]): Column[] {
  switch (groupBy) {
    case 'status':
      return STATUS_COLUMNS
    case 'etapa':
      return [
        { id: '__none__', label: 'Sin etapa', color: '#9699B0', bg: '#F4F5F7' },
        ...ETAPA_ORDER.map(e => ({ id: e, label: ETAPA_LABELS[e], color: ETAPA_COLORS[e], bg: bgFor(ETAPA_COLORS[e]) })),
      ]
    case 'assignee': {
      const set = new Set<string>()
      tasks.forEach(t => {
        const names = getTaskAssignees(t)
        names.forEach(n => set.add(n))
      })
      const columns: Column[] = Array.from(set).sort().map(name => ({
        id: name, label: name, color: ASSIGNEE_COLORS[name] ?? '#6B7280', bg: bgFor(ASSIGNEE_COLORS[name] ?? '#6B7280'),
      }))
      // Bucket para tasks sin responsable
      if (tasks.some(t => getTaskAssignees(t).length === 0)) {
        columns.unshift({ id: '__none__', label: 'Sin asignar', color: '#9699B0', bg: '#F4F5F7' })
      }
      return columns
    }
    case 'priority':
      return (['alerta_roja', 'alta', 'media', 'baja'] as Priority[]).map(p => ({
        id: p, label: PRIORITY_LABELS[p], color: PRIORITY_COLORS[p], bg: bgFor(PRIORITY_COLORS[p]),
      }))
    case 'area':
      return (Object.entries(AREA_LABELS) as [Area, string][]).map(([k, l]) => ({
        id: k, label: l, color: AREA_COLORS[k], bg: bgFor(AREA_COLORS[k]),
      }))
    case 'client':
      return [
        { id: '__none__', label: 'Sin cliente', color: '#9699B0', bg: '#F4F5F7' },
        ...clients.map(c => ({ id: c.id, label: c.name, color: c.color || '#6B7280', bg: bgFor(c.color || '#6B7280') })),
      ]
  }
}

function bucketsOf(t: Task, groupBy: GroupByKey): string[] {
  switch (groupBy) {
    case 'status': return [t.status]
    case 'etapa': return [t.etapa ?? '__none__']
    case 'assignee': {
      const names = getTaskAssignees(t)
      return names.length > 0 ? names : ['__none__']
    }
    case 'priority': return [t.priority]
    case 'area': return [t.area]
    case 'client': return [t.client_id ?? '__none__']
  }
}

const KANBAN_ASSIGNEES = [
  { name: 'Alejandro', color: '#8B5CF6' },
  { name: 'Alec',      color: '#F59E0B' },
  { name: 'Jose',      color: '#3B82F6' },
  { name: 'Luisa',     color: '#EF4444' },
  { name: 'Paula',     color: '#EC4899' },
  { name: 'David',     color: '#06B6D4' },
  { name: 'Johan',     color: '#10B981' },
  { name: 'Felipe',    color: '#F97316' },
]

// ─── usePopover ───────────────────────────────────────────────────────────────
function useKanbanPopover() {
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

// ─── Filter Dropdown ──────────────────────────────────────────────────────────
function KFDrop({ label, options, multiValues, onMultiChange, showAvatar }: {
  label: string
  options: { value: string; label: string; color?: string }[]
  multiValues: string[]
  onMultiChange: (v: string[]) => void
  showAvatar?: boolean
}) {
  const { open, setOpen, ref } = useKanbanPopover()
  const isActive = multiValues.length > 0
  const firstSel = options.find(o => o.value === multiValues[0])
  const btnColor = firstSel?.color ?? C.accent
  const btnLabel = multiValues.length === 1 ? firstSel?.label ?? '' : multiValues.length > 1 ? `${multiValues.length} filtros` : ''

  const toggle = (v: string) =>
    onMultiChange(multiValues.includes(v) ? multiValues.filter(x => x !== v) : [...multiValues, v])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, padding: '0 10px',
        borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
        backgroundColor: isActive ? `${btnColor}14` : C.bg,
        outline: isActive ? `1.5px solid ${btnColor}50` : `1px solid ${C.border}`,
        color: isActive ? btnColor : C.sub, transition: 'all 0.12s',
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', color: isActive ? btnColor : C.muted }}>{label}</span>
        {btnLabel && <><span style={{ width: 1, height: 10, backgroundColor: isActive ? `${btnColor}40` : C.border }} /><span style={{ fontWeight: 700 }}>{btnLabel}</span></>}
        <ChevronDown size={10} style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 400,
          backgroundColor: '#fff', border: `1px solid ${C.border}`,
          borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.13)',
          padding: 4, minWidth: 190,
        }}>
          {options.map(o => {
            const isSel = multiValues.includes(o.value)
            const oc = o.color ?? C.accent
            return (
              <button key={o.value} onClick={() => toggle(o.value)} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                backgroundColor: isSel ? `${oc}12` : 'transparent', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F6FA' }}
              onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}>
                {showAvatar
                  ? <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: isSel ? oc : `${oc}25`, color: isSel ? '#fff' : oc, fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{o.label.slice(0, 2).toUpperCase()}</div>
                  : <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: oc, flexShrink: 0 }} />
                }
                <span style={{ flex: 1, fontSize: 12, fontWeight: isSel ? 700 : 500, color: isSel ? oc : C.text }}>{o.label}</span>
                {isSel && <span style={{ fontSize: 11, color: oc }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Task card ────────────────────────────────────────────────────────────────
const CARD_FIELDS = [
  { key: 'client',      label: 'Cliente' },
  { key: 'area',        label: 'Área' },
  { key: 'priority',    label: 'Prioridad' },
  { key: 'overdue',     label: 'Días de atraso' },
  { key: 'campaign',    label: 'Campaña' },
  { key: 'etapa',       label: 'Etapa' },
  { key: 'due_date',    label: 'Fecha entrega' },
  { key: 'assignee',    label: 'Responsable' },
] as const

const DEFAULT_CARD_FIELDS: string[] = ['client', 'area', 'priority', 'overdue', 'campaign', 'assignee']

function TaskCard({ task, onOpenDetail, visibleFields, campaignLabel }: { task: Task; onOpenDetail: (t: Task) => void; visibleFields: Set<string>; campaignLabel?: string }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: task.id })

  const clientColor = (task.client as Client & { color: string })?.color
  const taskAssignees = getTaskAssignees(task)
  const primaryAssignee = taskAssignees[0] ?? ''
  const assigneeColor = primaryAssignee ? (ASSIGNEE_COLORS[primaryAssignee] || C.muted) : C.muted
  const areaColor = AREA_COLORS[task.area] || C.muted
  const priorityColor = PRIORITY_COLORS[task.priority] || C.muted
  const isUrgent = task.tipo === 'urgente'

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="group"
      {...attributes}
    >
      <div
        onClick={() => onOpenDetail(task)}
        style={{
          backgroundColor: C.card,
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          borderLeft: clientColor ? `3px solid ${clientColor}` : `1px solid ${C.border}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          cursor: 'pointer',
          transition: 'all 0.15s',
          padding: '10px 12px',
          position: 'relative',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {/* Urgent badge */}
        {isUrgent && (
          <div style={{
            position: 'absolute', top: -1, right: 10,
            fontSize: 9, fontWeight: 800, color: '#E2445C',
            backgroundColor: '#FEF2F4', padding: '2px 6px',
            borderRadius: '0 0 6px 6px', border: '1px solid #FECDD3', borderTop: 'none',
          }}>
            🚨 URGENTE
          </div>
        )}

        {/* Client */}
        {visibleFields.has('client') && task.client && (
          <div style={{ marginBottom: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: clientColor, backgroundColor: `${clientColor}15`,
              padding: '2px 7px', borderRadius: 5,
              border: `1px solid ${clientColor}25`,
            }}>
              {task.client.name}
            </span>
          </div>
        )}

        {/* Title */}
        <p style={{
          fontSize: 12, fontWeight: 600, color: C.text,
          lineHeight: 1.45, marginBottom: 8,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {task.title}
        </p>

        {/* Chips row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
          {visibleFields.has('area') && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: areaColor, backgroundColor: `${areaColor}18`,
              padding: '2px 6px', borderRadius: 4,
            }}>
              {AREA_LABELS[task.area]}
            </span>
          )}
          {visibleFields.has('priority') && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: priorityColor, backgroundColor: `${priorityColor}18`,
              padding: '2px 6px', borderRadius: 4,
            }}>
              {task.priority === 'alerta_roja' ? '🚨 Alerta' : task.priority === 'alta' ? '↑ Alta' : task.priority === 'media' ? '→ Media' : '↓ Baja'}
            </span>
          )}
          {visibleFields.has('overdue') && (() => {
            const days = getDaysOverdue(task)
            if (days === 0) return null
            return (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', backgroundColor: '#FEF2F2', padding: '2px 6px', borderRadius: 4, border: '1px solid #FECACA' }}>
                ⚠️ {days}d atraso
              </span>
            )
          })()}
          {visibleFields.has('etapa') && (task as any).etapa && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: ETAPA_COLORS[(task as any).etapa as Etapa] || C.muted,
              backgroundColor: `${ETAPA_COLORS[(task as any).etapa as Etapa] || C.muted}18`,
              padding: '2px 6px', borderRadius: 4,
            }}>
              {ETAPA_LABELS[(task as any).etapa as Etapa] || (task as any).etapa}
            </span>
          )}
          {visibleFields.has('due_date') && task.due_date && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: C.sub,
              padding: '2px 6px', borderRadius: 4,
              backgroundColor: '#F5F6FA', border: '1px solid #E5E7EB',
            }}>
              📅 {new Date(task.due_date).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
            </span>
          )}
          {visibleFields.has('campaign') && (task.campaign || campaignLabel) && (
            <span style={{
              fontSize: 9, color: C.muted,
              padding: '2px 5px', borderRadius: 4,
              backgroundColor: '#F5F6FA',
              maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {campaignLabel || task.campaign?.name}
            </span>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {visibleFields.has('assignee') && taskAssignees.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {taskAssignees.slice(0, 3).map((name, i) => {
                  const color = ASSIGNEE_COLORS[name] || C.muted
                  return (
                    <div key={name} style={{
                      width: 22, height: 22, borderRadius: '50%',
                      backgroundColor: color, color: '#fff',
                      fontSize: 8, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid #fff',
                      marginLeft: i === 0 ? 0 : -7,
                      zIndex: 10 - i,
                    }}>
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                  )
                })}
                {taskAssignees.length > 3 && (
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    backgroundColor: '#E5E7EB', color: C.sub,
                    fontSize: 8, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #fff', marginLeft: -7,
                  }}>+{taskAssignees.length - 3}</div>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, color: C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {taskAssignees.length === 1 ? primaryAssignee : `${taskAssignees.length} personas`}
              </span>
            </div>
          ) : <div />}

          <button
            {...listeners}
            onClick={e => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            style={{ background: 'none', border: 'none', padding: '2px', color: C.muted }}
          >
            <GripVertical size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Kanban column ────────────────────────────────────────────────────────────
function KanbanColumn({
  column, tasks, onOpenDetail, onNewTask, showNewButton, visibleFields, campaignLabelMap,
}: {
  column: Column
  tasks: Task[]
  onOpenDetail: (t: Task) => void
  onNewTask?: () => void
  showNewButton: boolean
  visibleFields: Set<string>
  campaignLabelMap: Map<string, string>
}) {
  const { setNodeRef } = useSortable({ id: column.id, data: { type: 'column' } })

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minWidth: 220, width: 220, flex: '0 0 220px',
      maxHeight: 'calc(100vh - 160px)',
    }}>
      {/* Column header */}
      <div style={{
        backgroundColor: C.card,
        borderRadius: '10px 10px 0 0',
        border: `1px solid ${C.border}`,
        borderBottom: 'none',
        borderTop: `3px solid ${column.color}`,
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{column.label}</span>
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: tasks.length > 0 ? column.color : C.muted,
            backgroundColor: tasks.length > 0 ? `${column.color}15` : '#F5F6FA',
            padding: '1px 7px', borderRadius: 10,
            border: `1px solid ${tasks.length > 0 ? column.color + '30' : C.border}`,
          }}>
            {tasks.length}
          </span>
        </div>
        {onNewTask && showNewButton && (
          <button
            onClick={onNewTask}
            style={{
              width: 22, height: 22, borderRadius: 6,
              backgroundColor: `${C.accent}15`, border: `1px solid ${C.accent}30`,
              color: C.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Nueva tarea"
          >
            <Plus size={12} />
          </button>
        )}
      </div>

      {/* Column body */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1, overflowY: 'auto',
          backgroundColor: column.bg,
          border: `1px solid ${C.border}`,
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          padding: 8,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}
      >
        {tasks.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: 120, borderRadius: 8,
            border: `2px dashed ${column.color}30`,
            color: C.muted, fontSize: 11, fontWeight: 500, gap: 4,
          }}>
            <span style={{ fontSize: 18 }}>
              {column.id === 'done' ? '🎉' : column.id === 'aprobacion_interna' ? '🚫' : '📋'}
            </span>
            Sin tareas aquí
          </div>
        ) : (
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onOpenDetail={onOpenDetail} visibleFields={visibleFields} campaignLabel={task.campaign_id ? campaignLabelMap.get(task.campaign_id) : undefined} />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function KanbanPage() {
  const isMobile = useIsMobile()
  const { data: tasks = [] } = useTasks()
  const { data: clients = [] } = useClients()
  const { data: campaigns = [] } = useCampaigns()
  const { openTaskDetail, openNewTask } = useOutletContext<{
    openNewTask: () => void
    openTaskDetail: (task: Task) => void
  }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlCampaignId = searchParams.get('campaign') ?? ''
  const urlClientId = searchParams.get('client') ?? ''

  const updateTaskStatus = useUpdateTaskStatus()

  const { value: prefs, setValue: setPrefs } = useUserPreference<{
    groupBy: GroupByKey
    filterClients: string[]
    filterAreas: string[]
    filterAssignees: string[]
    visibleFields: string[]
  }>('kanban', {
    groupBy: 'status',
    filterClients: [],
    filterAreas: [],
    filterAssignees: [],
    visibleFields: DEFAULT_CARD_FIELDS,
  })
  const groupBy = prefs.groupBy
  const setGroupBy = (v: GroupByKey) => setPrefs({ ...prefs, groupBy: v })
  const filterClients = prefs.filterClients
  const setFilterClients = (v: string[] | ((p: string[]) => string[])) =>
    setPrefs({ ...prefs, filterClients: typeof v === 'function' ? v(prefs.filterClients) : v })
  const filterAreas = prefs.filterAreas
  const setFilterAreas = (v: string[] | ((p: string[]) => string[])) =>
    setPrefs({ ...prefs, filterAreas: typeof v === 'function' ? v(prefs.filterAreas) : v })
  const filterAssignees = prefs.filterAssignees
  const setFilterAssignees = (v: string[] | ((p: string[]) => string[])) =>
    setPrefs({ ...prefs, filterAssignees: typeof v === 'function' ? v(prefs.filterAssignees) : v })
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const visibleFields = useMemo(() => new Set(prefs.visibleFields), [prefs.visibleFields])
  const setVisibleFields = (updater: (prev: Set<string>) => Set<string>) => {
    const next = updater(visibleFields)
    setPrefs({ ...prefs, visibleFields: Array.from(next) })
  }
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false)
  const fieldPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!fieldPickerOpen) return
    const h = (e: MouseEvent) => { if (fieldPickerRef.current && !fieldPickerRef.current.contains(e.target as Node)) setFieldPickerOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [fieldPickerOpen])

  const toggleField = (key: string) => {
    setVisibleFields(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const toggle = <T,>(arr: T[], val: T) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const hasFilters = filterClients.length > 0 || filterAreas.length > 0 || filterAssignees.length > 0 || !!urlCampaignId || !!urlClientId
  const clearFilters = () => {
    setFilterClients([]); setFilterAreas([]); setFilterAssignees([])
    setSearchParams({})
  }

  const urlCampaign = useMemo(() => campaigns.find(c => c.id === urlCampaignId), [campaigns, urlCampaignId])
  const urlClient = useMemo(() => clients.find(c => c.id === (urlClientId || urlCampaign?.client_id)), [clients, urlClientId, urlCampaign])

  // For group campaigns, include all child campaign IDs in the filter
  const urlCampaignIds = useMemo(() => {
    if (!urlCampaignId) return new Set<string>()
    const ids = new Set<string>([urlCampaignId])
    if (urlCampaign?.kind === 'group') {
      campaigns.filter(c => c.parent_campaign_id === urlCampaignId).forEach(c => ids.add(c.id))
    }
    return ids
  }, [urlCampaignId, urlCampaign, campaigns])

  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (urlCampaignIds.size > 0 && !urlCampaignIds.has(task.campaign_id ?? '')) return false
    if (urlClientId && task.client_id !== urlClientId) return false
    if (filterClients.length && !filterClients.includes(task.client_id ?? '')) return false
    if (filterAreas.length && !filterAreas.includes(task.area ?? '')) return false
    if (filterAssignees.length) {
      const names = getTaskAssignees(task)
      if (!names.some(n => filterAssignees.includes(n))) return false
    }
    return true
  }), [tasks, filterClients, filterAreas, filterAssignees, urlCampaignIds, urlClientId])

  // Build campaign label map: child campaigns show "ParentName · ChildName"
  const campaignLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    const parentMap = new Map<string, string>()
    campaigns.forEach(c => { if (c.kind === 'group') parentMap.set(c.id, c.name) })
    campaigns.forEach(c => {
      if (c.parent_campaign_id && parentMap.has(c.parent_campaign_id)) {
        map.set(c.id, `${parentMap.get(c.parent_campaign_id)} · ${c.name}`)
      } else if (c.kind !== 'group') {
        map.set(c.id, c.name)
      }
    })
    return map
  }, [campaigns])

  const columns = useMemo(() => buildColumns(groupBy, clients, filteredTasks), [groupBy, clients, filteredTasks])

  const tasksByBucket = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    columns.forEach(c => { grouped[c.id] = [] })
    filteredTasks.forEach(task => {
      const bs = bucketsOf(task, groupBy)
      bs.forEach(b => {
        if (!grouped[b]) grouped[b] = []
        grouped[b].push(task)
      })
    })
    return grouped
  }, [filteredTasks, columns, groupBy])

  const handleDragStart = ({ active }: DragStartEvent) => {
    const task = filteredTasks.find(t => t.id === active.id)
    if (task) setDraggedTask(task)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggedTask(null)
    if (!over || !draggedTask) return
    // Solo permitimos DnD cuando la agrupación es por status (otros campos requieren UI especial)
    if (groupBy !== 'status') return
    const newStatus = over.id as TaskStatus
    if (columns.map(c => c.id).includes(newStatus)) {
      updateTaskStatus.mutate({ id: draggedTask.id, status: newStatus })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: C.bg }}>

      {/* ── Breadcrumb cuando hay filtro de URL ──────────────────────────── */}
      {(urlClient || urlCampaign) && (
        <div style={{
          backgroundColor: '#FAFBFF', borderBottom: `1px solid ${C.border}`,
          padding: isMobile ? '8px 12px' : '8px 20px', display: 'flex', alignItems: 'center', gap: 8,
          flexShrink: 0, fontSize: 12, flexWrap: 'wrap',
        }}>
          <span style={{ color: C.muted, fontWeight: 600 }}>Viendo:</span>
          {urlClient && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '3px 10px', borderRadius: 99, fontWeight: 700,
              backgroundColor: `${urlClient.color}15`, color: urlClient.color,
              border: `1px solid ${urlClient.color}30`,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: urlClient.color }} />
              {urlClient.name}
            </span>
          )}
          {urlCampaign && (
            <>
              <span style={{ color: C.muted }}>›</span>
              <span style={{
                padding: '3px 10px', borderRadius: 99, fontWeight: 700,
                backgroundColor: '#EEF2FF', color: C.accent,
                border: `1px solid ${C.accent}30`,
              }}>
                {urlCampaign.name}
              </span>
            </>
          )}
          <button
            onClick={() => setSearchParams({})}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
              color: C.muted, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
            title="Quitar filtro"
          >
            <X size={12} /> Ver todas
          </button>
        </div>
      )}

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: C.card, borderBottom: `1px solid ${C.border}`,
        padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <KFDrop
          label="Cliente"
          options={clients.map(cl => ({ value: cl.id, label: cl.name, color: cl.color }))}
          multiValues={filterClients}
          onMultiChange={setFilterClients}
        />
        <KFDrop
          label="Responsable"
          options={KANBAN_ASSIGNEES.map(({ name, color }) => ({ value: name, label: name, color }))}
          multiValues={filterAssignees}
          onMultiChange={setFilterAssignees}
          showAvatar
        />
        <KFDrop
          label="Área"
          options={(Object.entries(AREA_LABELS) as [Area, string][]).map(([key, label]) => ({ value: key, label, color: AREA_COLORS[key] }))}
          multiValues={filterAreas}
          onMultiChange={v => setFilterAreas(v as Area[])}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: '0.05em' }}>AGRUPAR</span>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value as GroupByKey)}
            style={{ height: 32, padding: '0 10px', fontSize: 11, fontWeight: 700, color: C.accent, backgroundColor: `${C.accent}10`, border: `1px solid ${C.accent}30`, borderRadius: 8, cursor: 'pointer', outline: 'none' }}>
            {KANBAN_GROUP_BY_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>

        {/* Field picker */}
        <div ref={fieldPickerRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setFieldPickerOpen(o => !o)}
            style={{
              height: 32, padding: '0 10px', fontSize: 11, fontWeight: 700,
              color: C.sub, backgroundColor: '#fff', border: `1px solid ${C.border}`,
              borderRadius: 8, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
            }}
            title="Campos visibles en tarjetas"
          >
            <SlidersHorizontal size={12} /> Campos
            <span style={{ fontSize: 9, color: C.muted, fontWeight: 700 }}>{visibleFields.size}</span>
          </button>
          {fieldPickerOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4,
              backgroundColor: '#fff', border: `1px solid ${C.border}`,
              borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              padding: 10, minWidth: 210, zIndex: 20,
            }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: C.muted, letterSpacing: '0.05em', margin: '0 0 8px' }}>
                MOSTRAR EN TARJETA
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {CARD_FIELDS.map(f => {
                  const on = visibleFields.has(f.key)
                  return (
                    <label key={f.key}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
                        backgroundColor: on ? '#EEF2FF' : 'transparent',
                      }}
                      onMouseEnter={e => { if (!on) e.currentTarget.style.backgroundColor = '#F5F6FA' }}
                      onMouseLeave={e => { if (!on) e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <span style={{ fontSize: 12, color: C.text, fontWeight: on ? 600 : 500 }}>{f.label}</span>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleField(f.key)}
                        style={{ accentColor: C.accent, cursor: 'pointer' }}
                      />
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: C.muted }}>{filteredTasks.length} tareas · {columns.length} col.</span>
          {hasFilters && (
            <button onClick={clearFilters} style={{
              fontSize: 10, fontWeight: 700, cursor: 'pointer',
              color: '#DC2626', backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5', borderRadius: 8, padding: '0 10px', height: 32,
            }}>✕ Limpiar</button>
          )}
        </div>
      </div>

      {/* ── Kanban board ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: isMobile ? '8px 6px' : '12px 14px' }}>
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', gap: 10, height: '100%', minWidth: 'max-content' }}>
            {columns.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasksByBucket[column.id] ?? []}
                onOpenDetail={openTaskDetail}
                onNewTask={openNewTask}
                showNewButton={groupBy === 'status' ? column.id === 'pendiente' : false}
                visibleFields={visibleFields}
                campaignLabelMap={campaignLabelMap}
              />
            ))}
          </div>

          <DragOverlay>
            {draggedTask && (
              <div style={{
                backgroundColor: C.card, borderRadius: 10,
                border: `1px solid ${C.border}`,
                borderLeft: draggedTask.client?.color ? `3px solid ${draggedTask.client.color}` : `1px solid ${C.border}`,
                padding: '10px 12px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
                transform: 'rotate(2deg)',
                maxWidth: 280,
              }}>
                {draggedTask.client && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 5,
                    color: draggedTask.client.color,
                  }}>
                    {draggedTask.client.name}
                  </span>
                )}
                <p style={{ fontSize: 12, fontWeight: 600, color: C.text, margin: 0 }}>
                  {draggedTask.title}
                </p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
