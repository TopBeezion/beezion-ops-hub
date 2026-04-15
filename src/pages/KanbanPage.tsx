import { useState, useMemo, useRef, useEffect } from 'react'
import { useTasks, useUpdateTaskStatus } from '../hooks/useTasks'
import { getDaysOverdue } from '../lib/dates'
import { useClients } from '../hooks/useClients'
import { useOutletContext } from 'react-router-dom'
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
import { GripVertical, Plus, ChevronDown } from 'lucide-react'
import type { Task, TaskStatus, Area, Client } from '../types'
import {
  AREA_LABELS, AREA_COLORS,
  PRIORITY_COLORS, ASSIGNEE_COLORS,
  STATUS_LABELS,
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

const COLUMNS: { id: TaskStatus; label: string; color: string; bg: string }[] = [
  { id: 'todo',   label: 'Pendiente',  color: '#9699B0', bg: '#F4F5F7' },
  { id: 'en_progreso', label: 'En Proceso', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'revision',    label: 'Blocker',    color: '#EF4444', bg: '#FEF2F2' },
  { id: 'hecho',  label: 'Done',       color: '#10B981', bg: '#F0FDF4' },
]

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
function TaskCard({ task, onOpenDetail }: { task: Task; onOpenDetail: (t: Task) => void }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: task.id })

  const clientColor = (task.client as Client & { color: string })?.color
  const assigneeColor = ASSIGNEE_COLORS[task.assignee] || C.muted
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
        {task.client && (
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
          <span style={{
            fontSize: 9, fontWeight: 700,
            color: areaColor, backgroundColor: `${areaColor}18`,
            padding: '2px 6px', borderRadius: 4,
          }}>
            {AREA_LABELS[task.area]}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700,
            color: priorityColor, backgroundColor: `${priorityColor}18`,
            padding: '2px 6px', borderRadius: 4,
          }}>
            {task.priority === 'alerta_roja' ? '🚨 Alerta' : task.priority === 'alta' ? '↑ Alta' : task.priority === 'media' ? '→ Media' : '↓ Baja'}
          </span>
          {(() => {
            const days = getDaysOverdue(task)
            if (days === 0) return null
            return (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', backgroundColor: '#FEF2F2', padding: '2px 6px', borderRadius: 4, border: '1px solid #FECACA' }}>
                ⚠️ {days}d atraso
              </span>
            )
          })()}
          {task.campaign && (
            <span style={{
              fontSize: 9, color: C.muted,
              padding: '2px 5px', borderRadius: 4,
              backgroundColor: '#F5F6FA',
              maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {task.campaign.name}
            </span>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              backgroundColor: assigneeColor,
              color: '#fff', fontSize: 8, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {task.assignee.slice(0, 2).toUpperCase()}
            </div>
            <span style={{ fontSize: 10, fontWeight: 500, color: C.sub }}>{task.assignee}</span>
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
      </div>
    </div>
  )
}

// ─── Kanban column ────────────────────────────────────────────────────────────
function KanbanColumn({
  column, tasks, onOpenDetail, onNewTask,
}: {
  column: typeof COLUMNS[0]
  tasks: Task[]
  onOpenDetail: (t: Task) => void
  onNewTask?: () => void
}) {
  const { setNodeRef } = useSortable({ id: column.id, data: { type: 'column' } })

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minWidth: 280, flex: 1,
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
        {onNewTask && column.id === 'todo' && (
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
              {column.id === 'hecho' ? '🎉' : column.id === 'revision' ? '🚫' : '📋'}
            </span>
            Sin tareas aquí
          </div>
        ) : (
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onOpenDetail={onOpenDetail} />
            ))}
          </SortableContext>
        )}
      </div>
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

  const updateTaskStatus = useUpdateTaskStatus()

  const [filterClients, setFilterClients] = useState<string[]>([])
  const [filterAreas, setFilterAreas] = useState<string[]>([])
  const [filterAssignees, setFilterAssignees] = useState<string[]>([])
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

  const toggle = <T,>(arr: T[], val: T) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const hasFilters = filterClients.length > 0 || filterAreas.length > 0 || filterAssignees.length > 0
  const clearFilters = () => { setFilterClients([]); setFilterAreas([]); setFilterAssignees([]) }

  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (filterClients.length && !filterClients.includes(task.client_id ?? '')) return false
    if (filterAreas.length && !filterAreas.includes(task.area ?? '')) return false
    if (filterAssignees.length && !filterAssignees.includes(task.assignee ?? '')) return false
    return true
  }), [tasks, filterClients, filterAreas, filterAssignees])

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [], en_progreso: [], revision: [], bloqueado: [], hecho: [],
    }
    filteredTasks.forEach(task => { grouped[task.status].push(task) })
    return grouped
  }, [filteredTasks])

  const handleDragStart = ({ active }: DragStartEvent) => {
    const task = filteredTasks.find(t => t.id === active.id)
    if (task) setDraggedTask(task)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggedTask(null)
    if (!over) return
    const newStatus = over.id as TaskStatus
    if (COLUMNS.map(c => c.id).includes(newStatus) && draggedTask) {
      updateTaskStatus.mutate({ id: draggedTask.id, status: newStatus })
    }
  }

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
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {COLUMNS.map(col => (
            <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.color }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: C.sub }}>{tasksByStatus[col.id].length}</span>
            </div>
          ))}
          <span style={{ fontSize: 10, color: C.muted, marginLeft: 4 }}>{filteredTasks.length} tareas</span>
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
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', gap: 14, height: '100%', minWidth: 'max-content' }}>
            {COLUMNS.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasksByStatus[column.id]}
                onOpenDetail={openTaskDetail}
                onNewTask={openNewTask}
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
