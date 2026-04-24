import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useTasks, useUpdateTask } from '../hooks/useTasks'
import { getDaysOverdue } from '../lib/dates'
import { useClients } from '../hooks/useClients'
import { useOutletContext } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  rectIntersection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { ChevronDown, Plus, GripVertical, Eye, EyeOff } from 'lucide-react'
import type { Task, TaskStatus, Area, Etapa, Client } from '../types'
import {
  AREA_LABELS, AREA_COLORS,
  PRIORITY_COLORS, ASSIGNEE_COLORS,
  STATUS_LABELS, STATUS_COLORS, STATUS_ORDER,
  ETAPA_LABELS, ETAPA_COLORS, ETAPA_ORDER,
  KANBAN_GROUP_BY_OPTIONS, DEFAULT_KANBAN_CARD_FIELDS,
} from '../lib/constants'

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

// ─── Column definitions per groupBy ──────────────────────────────────────────
type GroupByKey = (typeof KANBAN_GROUP_BY_OPTIONS)[number]['key']

interface ColumnDef {
  id: string
  label: string
  color: string
}

function getColumnsForGroupBy(groupBy: GroupByKey, clients: Client[]): ColumnDef[] {
  switch (groupBy) {
    case 'etapa':
      return ETAPA_ORDER.map(e => ({ id: e, label: ETAPA_LABELS[e], color: ETAPA_COLORS[e] }))
    case 'status':
      return STATUS_ORDER.map(s => ({ id: s, label: STATUS_LABELS[s], color: STATUS_COLORS[s] }))
    case 'assignee':
      return Object.entries(ASSIGNEE_COLORS).map(([name, color]) => ({ id: name, label: name, color }))
    case 'priority':
      return [
        { id: 'alerta_roja', label: '🚨 Alerta Roja', color: '#DC2626' },
        { id: 'alta', label: 'Alta', color: '#EF4444' },
        { id: 'media', label: 'Media', color: '#F59E0B' },
        { id: 'baja', label: 'Baja', color: '#9CA3AF' },
      ]
    case 'area':
      return (Object.entries(AREA_LABELS) as [Area, string][]).map(([k, label]) => ({
        id: k, label, color: AREA_COLORS[k],
      }))
    case 'client':
      return clients.map(c => ({ id: c.id, label: c.name, color: c.color || '#6366F1' }))
    default:
      return ETAPA_ORDER.map(e => ({ id: e, label: ETAPA_LABELS[e], color: ETAPA_COLORS[e] }))
  }
}

function getTaskGroupValue(task: Task, groupBy: GroupByKey): string {
  switch (groupBy) {
    case 'etapa': return task.etapa || ''
    case 'status': return task.status
    case 'assignee': return task.assignee || ''
    case 'priority': return task.priority
    case 'area': return task.area || ''
    case 'client': return task.client_id || ''
    default: return ''
  }
}

function getUpdateField(groupBy: GroupByKey): string {
  switch (groupBy) {
    case 'etapa': return 'etapa'
    case 'status': return 'status'
    case 'assignee': return 'assignee'
    case 'priority': return 'priority'
    case 'area': return 'area'
    case 'client': return 'client_id'
    default: return 'etapa'
  }
}

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
          padding: 4, minWidth: 190, maxHeight: 300, overflowY: 'auto',
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

// ─── GroupBy Select ───────────────────────────────────────────────────────────
function GroupBySelect({ value, onChange }: { value: GroupByKey; onChange: (v: GroupByKey) => void }) {
  const { open, setOpen, ref } = useKanbanPopover()
  const current = KANBAN_GROUP_BY_OPTIONS.find(o => o.key === value)

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.04em' }}>AGRUPAR</span>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px',
        borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
        border: 'none', backgroundColor: `${C.accent}12`,
        outline: `1.5px solid ${C.accent}40`, color: C.accent,
      }}>
        {current?.label ?? 'Etapa'}
        <ChevronDown size={10} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 400,
          backgroundColor: '#fff', border: `1px solid ${C.border}`,
          borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.13)',
          padding: 4, minWidth: 170,
        }}>
          {KANBAN_GROUP_BY_OPTIONS.map(o => {
            const isSel = o.key === value
            return (
              <button key={o.key} onClick={() => { onChange(o.key); setOpen(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '8px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                backgroundColor: isSel ? `${C.accent}12` : 'transparent', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F6FA' }}
              onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}>
                <span style={{ fontSize: 12, fontWeight: isSel ? 700 : 500, color: isSel ? C.accent : C.text }}>{o.label}</span>
                {isSel && <span style={{ fontSize: 11, color: C.accent }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── FieldsToggle ─────────────────────────────────────────────────────────────
const ALL_CARD_FIELDS = [
  { key: 'client', label: 'Cliente' },
  { key: 'etapa', label: 'Etapa' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Prioridad' },
  { key: 'assignee', label: 'Responsable' },
  { key: 'due_date', label: 'Fecha' },
  { key: 'campaign', label: 'Campaña' },
  { key: 'area', label: 'Área' },
]

function FieldsToggle({ visible, onChange }: { visible: string[]; onChange: (v: string[]) => void }) {
  const { open, setOpen, ref } = useKanbanPopover()
  const toggle = (k: string) =>
    onChange(visible.includes(k) ? visible.filter(x => x !== k) : [...visible, k])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, padding: '0 10px',
        borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
        backgroundColor: '#F5F6FA', outline: `1px solid ${C.border}`, color: C.sub,
      }}>
        <Eye size={12} /> Campos {visible.length}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 400,
          backgroundColor: '#fff', border: `1px solid ${C.border}`,
          borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.13)',
          padding: 4, minWidth: 170,
        }}>
          {ALL_CARD_FIELDS.map(f => {
            const on = visible.includes(f.key)
            return (
              <button key={f.key} onClick={() => toggle(f.key)} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                backgroundColor: on ? `${C.accent}10` : 'transparent', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!on) (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F6FA' }}
              onMouseLeave={e => { if (!on) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}>
                {on ? <Eye size={12} color={C.accent} /> : <EyeOff size={12} color={C.muted} />}
                <span style={{ fontSize: 12, fontWeight: on ? 600 : 400, color: on ? C.text : C.muted }}>{f.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Draggable Task Card ─────────────────────────────────────────────────────
const KANBAN_ASSIGNEES_MAP: Record<string, string> = ASSIGNEE_COLORS

function DraggableCard({ task, onOpenDetail, visibleFields }: {
  task: Task; onOpenDetail: (t: Task) => void; visibleFields: string[]
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })

  const clientColor = (task.client as Client & { color: string })?.color
  const assigneeColor = KANBAN_ASSIGNEES_MAP[task.assignee] || C.muted
  const areaColor = AREA_COLORS[task.area] || C.muted
  const priorityColor = PRIORITY_COLORS[task.priority] || C.muted
  const etapaColor = task.etapa ? ETAPA_COLORS[task.etapa] : C.muted
  const statusColor = STATUS_COLORS[task.status] || C.muted
  const isUrgent = task.tipo === 'urgente'

  const style: React.CSSProperties = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 999 : 'auto',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="group">
      <div
        onClick={() => onOpenDetail(task)}
        style={{
          backgroundColor: C.card,
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          borderLeft: clientColor ? `3px solid ${clientColor}` : `1px solid ${C.border}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          cursor: 'pointer',
          transition: 'box-shadow 0.15s, transform 0.15s',
          padding: '10px 12px',
          position: 'relative',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)' }}
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
        {visibleFields.includes('client') && task.client && (
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
          {visibleFields.includes('etapa') && task.etapa && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: etapaColor, backgroundColor: `${etapaColor}18`,
              padding: '2px 6px', borderRadius: 4,
            }}>
              {ETAPA_LABELS[task.etapa]}
            </span>
          )}
          {visibleFields.includes('status') && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: statusColor, backgroundColor: `${statusColor}18`,
              padding: '2px 6px', borderRadius: 4,
            }}>
              {STATUS_LABELS[task.status]}
            </span>
          )}
          {visibleFields.includes('priority') && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: priorityColor, backgroundColor: `${priorityColor}18`,
              padding: '2px 6px', borderRadius: 4,
            }}>
              {task.priority === 'alerta_roja' ? '🚨 Alerta' : task.priority === 'alta' ? '↑ Alta' : task.priority === 'media' ? '→ Media' : '↓ Baja'}
            </span>
          )}
          {visibleFields.includes('area') && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: areaColor, backgroundColor: `${areaColor}18`,
              padding: '2px 6px', borderRadius: 4,
            }}>
              {AREA_LABELS[task.area]}
            </span>
          )}
          {(() => {
            const days = getDaysOverdue(task)
            if (days === 0) return null
            return (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', backgroundColor: '#FEF2F2', padding: '2px 6px', borderRadius: 4, border: '1px solid #FECACA' }}>
                ⚠️ {days}d
              </span>
            )
          })()}
          {visibleFields.includes('due_date') && task.due_date && (
            <span style={{ fontSize: 9, fontWeight: 600, color: C.muted, backgroundColor: '#F5F6FA', padding: '2px 6px', borderRadius: 4 }}>
              📅 {new Date(task.due_date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {visibleFields.includes('campaign') && task.campaign && (
            <span style={{
              fontSize: 9, color: C.muted, padding: '2px 5px', borderRadius: 4,
              backgroundColor: '#F5F6FA',
              maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {task.campaign.name}
            </span>
          )}
        </div>

        {/* Footer */}
        {visibleFields.includes('assignee') && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: -4 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                backgroundColor: assigneeColor, color: '#fff', fontSize: 8, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {task.assignee.slice(0, 2).toUpperCase()}
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, color: C.sub, marginLeft: 5 }}>{task.assignee}</span>
            </div>

            <button
              {...listeners}
              onClick={e => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
              style={{ background: 'none', border: 'none', padding: '2px', color: C.muted }}
            >
              <GripVertical size={13} />
            </button>
          </div>
        )}

        {/* Drag handle if no assignee visible */}
        {!visibleFields.includes('assignee') && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              {...listeners}
              onClick={e => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
              style={{ background: 'none', border: 'none', padding: '2px', color: C.muted }}
            >
              <GripVertical size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Droppable Kanban Column ─────────────────────────────────────────────────
function DroppableColumn({
  column, tasks, onOpenDetail, onNewTask, visibleFields,
}: {
  column: ColumnDef
  tasks: Task[]
  onOpenDetail: (t: Task) => void
  onNewTask?: () => void
  visibleFields: string[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minWidth: 240, width: 240, flexShrink: 0,
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
        {onNewTask && (
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

      {/* Column body (droppable) */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1, overflowY: 'auto',
          backgroundColor: isOver ? `${column.color}12` : `${column.color}06`,
          border: `1px solid ${isOver ? column.color + '50' : C.border}`,
          borderTop: 'none',
          borderRadius: '0 0 10px 10px',
          padding: 8,
          display: 'flex', flexDirection: 'column', gap: 6,
          transition: 'background-color 0.2s, border-color 0.2s',
          minHeight: 80,
        }}
      >
        {tasks.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: 100, borderRadius: 8,
            border: `2px dashed ${isOver ? column.color + '60' : column.color + '30'}`,
            color: C.muted, fontSize: 11, fontWeight: 500, gap: 4,
            transition: 'border-color 0.2s',
          }}>
            <span style={{ fontSize: 18 }}>📋</span>
            {isOver ? 'Soltar aquí' : 'Sin tareas aquí'}
          </div>
        ) : (
          tasks.map(task => (
            <DraggableCard key={task.id} task={task} onOpenDetail={onOpenDetail} visibleFields={visibleFields} />
          ))
        )}
      </div>
    </div>
  )
}

// ─── DragOverlay Card (ghost) ────────────────────────────────────────────────
function OverlayCard({ task }: { task: Task }) {
  const clientColor = (task.client as Client & { color: string })?.color
  return (
    <div style={{
      backgroundColor: C.card, borderRadius: 10,
      border: `1px solid ${C.border}`,
      borderLeft: clientColor ? `3px solid ${clientColor}` : `1px solid ${C.border}`,
      padding: '10px 12px',
      boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
      transform: 'rotate(2deg)',
      maxWidth: 240, width: 240,
    }}>
      {task.client && (
        <span style={{ fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 5, color: clientColor }}>
          {task.client.name}
        </span>
      )}
      <p style={{ fontSize: 12, fontWeight: 600, color: C.text, margin: 0 }}>
        {task.title}
      </p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function KanbanPage() {
  const { data: tasks = [] } = useTasks()
  const { data: clients = [] } = useClients()
  const { openTaskDetail, openNewTask } = useOutletContext<{
    openNewTask: () => void
    openTaskDetail: (task: Task) => void
  }>()

  const updateTask = useUpdateTask()

  // State
  const [groupBy, setGroupBy] = useState<GroupByKey>('etapa')
  const [filterClients, setFilterClients] = useState<string[]>([])
  const [filterAreas, setFilterAreas] = useState<string[]>([])
  const [filterAssignees, setFilterAssignees] = useState<string[]>([])
  const [hideDone, setHideDone] = useState(true)
  const [visibleFields, setVisibleFields] = useState<string[]>(DEFAULT_KANBAN_CARD_FIELDS)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

  const hasFilters = filterClients.length > 0 || filterAreas.length > 0 || filterAssignees.length > 0
  const clearFilters = () => { setFilterClients([]); setFilterAreas([]); setFilterAssignees([]) }

  // Columns
  const columns = useMemo(() => getColumnsForGroupBy(groupBy, clients), [groupBy, clients])

  // Filtered tasks
  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (filterClients.length && !filterClients.includes(task.client_id ?? '')) return false
    if (filterAreas.length && !filterAreas.includes(task.area ?? '')) return false
    if (filterAssignees.length && !filterAssignees.includes(task.assignee ?? '')) return false
    if (hideDone && task.status === 'done') return false
    return true
  }), [tasks, filterClients, filterAreas, filterAssignees, hideDone])

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    columns.forEach(col => { grouped[col.id] = [] })
    filteredTasks.forEach(task => {
      const val = getTaskGroupValue(task, groupBy)
      if (grouped[val]) grouped[val].push(task)
    })
    return grouped
  }, [filteredTasks, columns, groupBy])

  // Assignee options
  const assigneeOptions = useMemo(() =>
    Object.entries(ASSIGNEE_COLORS).filter(([n]) => n !== 'TBD').map(([name, color]) => ({ value: name, label: name, color })),
  [])

  // DnD handlers
  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    const task = filteredTasks.find(t => t.id === active.id)
    if (task) setDraggedTask(task)
  }, [filteredTasks])

  const handleDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    setDraggedTask(null)
    if (!over || !draggedTask) return

    const targetColumnId = over.id as string
    const isColumn = columns.some(c => c.id === targetColumnId)
    if (!isColumn) return

    const currentValue = getTaskGroupValue(draggedTask, groupBy)
    if (currentValue === targetColumnId) return

    const field = getUpdateField(groupBy)
    updateTask.mutate({ id: draggedTask.id, [field]: targetColumnId })
  }, [draggedTask, columns, groupBy, updateTask])

  // Count total
  const totalTasks = filteredTasks.length
  const totalCols = columns.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: C.bg }}>

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
          options={assigneeOptions}
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

        <div style={{ width: 1, height: 20, backgroundColor: C.border, margin: '0 4px' }} />

        <GroupBySelect value={groupBy} onChange={setGroupBy} />

        <FieldsToggle visible={visibleFields} onChange={setVisibleFields} />

        {/* Hide done toggle */}
        <button onClick={() => setHideDone(h => !h)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, padding: '0 10px',
          borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
          backgroundColor: hideDone ? '#F0FDF4' : '#F5F6FA',
          outline: hideDone ? '1.5px solid #86EFAC' : `1px solid ${C.border}`,
          color: hideDone ? '#16A34A' : C.sub,
        }}>
          {hideDone ? <EyeOff size={12} /> : <Eye size={12} />}
          Ocultar done
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: C.muted }}>{totalTasks} tareas · {totalCols} col.</span>
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
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', padding: '16px 20px' }}>
        <DndContext
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', gap: 14, height: '100%', minWidth: 'max-content' }}>
            {columns.map((column, idx) => (
              <DroppableColumn
                key={column.id}
                column={column}
                tasks={tasksByColumn[column.id] || []}
                onOpenDetail={openTaskDetail}
                onNewTask={idx === 0 ? openNewTask : undefined}
                visibleFields={visibleFields}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {draggedTask && <OverlayCard task={draggedTask} />}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
