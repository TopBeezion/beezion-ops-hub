import { useState } from 'react'
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTasks, useUpdateTaskStatus } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import type { Task, TaskStatus } from '../types'
import { STATUS_LABELS, AREA_COLORS, AREA_LABELS } from '../lib/constants'
import { ClientBadge } from '../components/ui/ClientBadge'
import { AssigneeAvatar } from '../components/ui/AssigneeAvatar'
import { PriorityDot } from '../components/ui/PriorityDot'
import { X } from 'lucide-react'

const COLUMNS: TaskStatus[] = ['pendiente', 'en_progreso', 'revision', 'completado']

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  pendiente:  '#64748b',
  en_progreso:'#3b82f6',
  revision:   '#f59e0b',
  completado: '#22c55e',
}

const AREA_LIST = ['copy', 'trafico', 'tech', 'admin'] as const
const ASSIGNEES = ['Alejandro', 'Alec', 'Paula', 'Jose Luis', 'Editor 1', 'Editor 2', 'Editor 3']

// ── Task Card ─────────────────────────────────────────────────────
function TaskCard({ task, isDragging }: { task: Task; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
  }

  const deliverables = task.deliverables
  const chips: string[] = []
  if (deliverables?.hooks)         chips.push(`${deliverables.hooks} hooks`)
  if (deliverables?.cta)           chips.push(`${deliverables.cta} CTA`)
  if (deliverables?.body_copy)     chips.push(`${deliverables.body_copy} body`)
  if (deliverables?.scripts_video) chips.push(`${deliverables.scripts_video} scripts`)
  if (deliverables?.lead_magnet_pdf) chips.push(`${deliverables.lead_magnet_pdf} PDFs`)
  if (deliverables?.vsl_script)    chips.push(`${deliverables.vsl_script} VSL`)

  const clientColor = task.client?.color || '#6b7280'
  const isUrgent   = task.tipo === 'urgente'
  const isPrevious = task.tipo === 'pendiente_anterior'

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div
        className="rounded-xl p-3 cursor-grab active:cursor-grabbing select-none relative overflow-hidden card-hover"
        style={{
          backgroundColor: '#13152a',
          border: isUrgent
            ? '1px solid rgba(239,68,68,0.45)'
            : isPrevious
            ? '1px solid rgba(249,115,22,0.38)'
            : '1px solid rgba(255,255,255,0.09)',
          boxShadow: isUrgent ? '0 0 14px rgba(239,68,68,0.12)' : 'none',
        }}
      >
        {/* Client color stripe */}
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl" style={{ backgroundColor: clientColor }} />

        {/* Urgency badge */}
        {(isUrgent || isPrevious) && (
          <div className="absolute top-3 right-3">
            <span
              className="text-[8px] font-bold px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.15)',
                color: isUrgent ? '#f87171' : '#fb923c',
              }}
            >
              {isUrgent ? '⚡ URG' : '⏳ PREV'}
            </span>
          </div>
        )}

        <div className="mt-1.5 mb-2">
          <ClientBadge client={task.client} size="xs" />
        </div>

        {/* Title */}
        <p className="text-[12px] leading-relaxed font-medium pr-10 mb-1" style={{ color: '#e8eaff' }}>
          {task.title}
        </p>

        {task.problema && (
          <p className="text-[10px] mb-2 line-clamp-1" style={{ color: '#565a7a' }}>
            {task.problema}
          </p>
        )}

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {chips.slice(0, 2).map((chip, i) => (
              <span
                key={i}
                className="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-semibold"
                style={{
                  backgroundColor: 'rgba(139,92,246,0.14)',
                  color: '#c4b5fd',
                  border: '1px solid rgba(139,92,246,0.22)',
                }}
              >
                {chip}
              </span>
            ))}
            {chips.length > 2 && (
              <span
                className="inline-block px-1.5 py-0.5 rounded-md text-[9px]"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#565a7a' }}
              >
                +{chips.length - 2}
              </span>
            )}
          </div>
        )}

        <div
          className="flex items-center justify-between pt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide"
            style={{
              backgroundColor: `${AREA_COLORS[task.area]}18`,
              color: AREA_COLORS[task.area],
              border: `1px solid ${AREA_COLORS[task.area]}28`,
            }}
          >
            {AREA_LABELS[task.area]}
          </span>
          <div className="flex items-center gap-1.5">
            <PriorityDot priority={task.priority} />
            <AssigneeAvatar name={task.assignee} size="sm" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Kanban Column ─────────────────────────────────────────────────
function KanbanColumn({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  const accent = COLUMN_ACCENT[status]

  return (
    <div className="flex flex-col min-h-0 w-[288px] shrink-0">
      {/* Header */}
      <div
        className="rounded-xl mb-3 px-3 py-2.5 flex items-center justify-between"
        style={{
          backgroundColor: `${accent}10`,
          border: `1px solid ${accent}22`,
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 7px ${accent}` }} />
          <span className="text-[12px] font-semibold" style={{ color: '#e8eaff' }}>
            {STATUS_LABELS[status]}
          </span>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums"
          style={{ backgroundColor: `${accent}18`, color: accent, border: `1px solid ${accent}28` }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        className="flex-1 rounded-xl p-2 space-y-2.5 min-h-[120px]"
        style={{
          backgroundColor: 'rgba(19,21,42,0.4)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => <TaskCard key={task.id} task={task} />)}
        </SortableContext>
        {tasks.length === 0 && (
          <div
            className="flex items-center justify-center h-24 rounded-lg border border-dashed"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <span className="text-[11px]" style={{ color: '#3d4268' }}>Sin tareas</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export function KanbanPage() {
  const { data: clients = [] } = useClients()
  const [clientFilter, setClientFilter] = useState('')
  const [areaFilter, setAreaFilter]     = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const { data: allTasks = [], isLoading } = useTasks(clientFilter ? { client_id: clientFilter } : undefined)
  const updateStatus = useUpdateTaskStatus()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const tasks = allTasks
    .filter(t => !areaFilter    || t.area     === areaFilter)
    .filter(t => !assigneeFilter || t.assignee === assigneeFilter)

  const hasFilters = !!(clientFilter || areaFilter || assigneeFilter)

  const handleDragStart = (e: DragStartEvent) => setActiveTask(tasks.find(t => t.id === e.active.id) || null)
  const handleDragEnd   = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveTask(null)
    if (!over) return
    const overId = over.id as string
    const targetStatus = COLUMNS.find(s => s === overId)
    const overTask = tasks.find(t => t.id === overId)
    const newStatus = targetStatus || overTask?.status
    if (newStatus && active.id !== over.id) {
      const task = tasks.find(t => t.id === active.id)
      if (task && task.status !== newStatus) updateStatus.mutate({ id: task.id, status: newStatus })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#f5a623', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Filter toolbar ──────────────────────────────────────── */}
      <div className="filter-toolbar">

        {/* Cliente */}
        <select
          className={`filter-select ${clientFilter ? 'has-value' : ''}`}
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
        >
          <option value="">Todos los clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="filter-sep" />

        {/* Área */}
        <select
          className={`filter-select ${areaFilter ? 'has-value' : ''}`}
          value={areaFilter}
          onChange={e => setAreaFilter(e.target.value)}
        >
          <option value="">Todas las áreas</option>
          {AREA_LIST.map(a => <option key={a} value={a}>{AREA_LABELS[a]}</option>)}
        </select>

        {/* Equipo */}
        <select
          className={`filter-select ${assigneeFilter ? 'has-value' : ''}`}
          value={assigneeFilter}
          onChange={e => setAssigneeFilter(e.target.value)}
        >
          <option value="">Todo el equipo</option>
          {ASSIGNEES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        {/* Clear + count */}
        {hasFilters && (
          <button
            className="filter-clear"
            onClick={() => { setClientFilter(''); setAreaFilter(''); setAssigneeFilter('') }}
          >
            <X size={10} strokeWidth={3} />
            Limpiar
          </button>
        )}
        <span className="filter-count">{tasks.length} tareas</span>
      </div>

      {/* ── Board ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-4">
        <DndContext
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 h-full">
            {COLUMNS.map(status => (
              <KanbanColumn key={status} status={status} tasks={tasks.filter(t => t.status === status)} />
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
            {activeTask && (
              <div
                className="rounded-xl p-3 rotate-2"
                style={{
                  backgroundColor: '#1f2240',
                  border: '1px solid rgba(245,166,35,0.4)',
                  width: 284,
                  boxShadow: '0 24px 48px rgba(0,0,0,0.7), 0 0 24px rgba(245,166,35,0.12)',
                }}
              >
                <p className="text-xs font-medium" style={{ color: '#f0f2ff' }}>{activeTask.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
