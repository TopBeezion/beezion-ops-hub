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
import {
  X, ExternalLink, Zap, Hourglass,
  Anchor, Video, PenTool, Target, FileDown, Film, Globe,
  ThumbsUp, LayoutGrid, Type, HelpCircle, BarChart3, RefreshCw,
} from 'lucide-react'
import { useOutletContext } from 'react-router-dom'

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
function TaskCard({
  task, isDragging, onOpen,
}: { task: Task; isDragging?: boolean; onOpen?: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
  }

  const deliverables = task.deliverables
  const chips: { label: string; count: number; color: string; Icon: React.ElementType }[] = []
  if (deliverables?.hooks)             chips.push({ label: 'hooks',   count: deliverables.hooks,             color: '#8b5cf6', Icon: Anchor })
  if (deliverables?.scripts_video)     chips.push({ label: 'scripts', count: deliverables.scripts_video,     color: '#ec4899', Icon: Video })
  if (deliverables?.body_copy)         chips.push({ label: 'body',    count: deliverables.body_copy,          color: '#3b82f6', Icon: PenTool })
  if (deliverables?.cta)               chips.push({ label: 'CTA',     count: deliverables.cta,                color: '#f5a623', Icon: Target })
  if (deliverables?.lead_magnet_pdf)   chips.push({ label: 'LM',      count: deliverables.lead_magnet_pdf,    color: '#22c55e', Icon: FileDown })
  if (deliverables?.vsl_script)        chips.push({ label: 'VSL',     count: deliverables.vsl_script,         color: '#06b6d4', Icon: Film })
  if (deliverables?.landing_copy)      chips.push({ label: 'landing', count: deliverables.landing_copy,       color: '#f97316', Icon: Globe })
  if (deliverables?.carousel_slides)   chips.push({ label: 'slides',  count: deliverables.carousel_slides,    color: '#a78bfa', Icon: LayoutGrid })
  if (deliverables?.headline_options)  chips.push({ label: 'hdl',     count: deliverables.headline_options,   color: '#f472b6', Icon: Type })
  if (deliverables?.retargeting_scripts) chips.push({ label: 'retarg',count: deliverables.retargeting_scripts, color: '#34d399', Icon: RefreshCw })
  if (deliverables?.thank_you_page_copy) chips.push({ label: 'TYP',   count: deliverables.thank_you_page_copy, color: '#fbbf24', Icon: ThumbsUp })

  const clientColor = task.client?.color || '#6b7280'
  const isUrgent   = task.tipo === 'urgente'
  const isPrevious = task.tipo === 'pendiente_anterior'

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div
        className="rounded-xl p-3 cursor-pointer active:cursor-grabbing select-none relative overflow-hidden card-hover group"
        onClick={() => onOpen?.(task)}
        style={{
          backgroundColor: '#161616',
          border: isUrgent
            ? '1px solid rgba(239,68,68,0.45)'
            : isPrevious
            ? '1px solid rgba(249,115,22,0.38)'
            : '1px solid rgba(255,255,255,0.07)',
          boxShadow: isUrgent
            ? '0 0 14px rgba(239,68,68,0.12)'
            : '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {/* Client color stripe */}
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl" style={{ backgroundColor: clientColor }} />

        {/* Open detail button */}
        <button
          onClick={e => { e.stopPropagation(); onOpen?.(task) }}
          className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#a1a1a1' }}
          title="Ver detalle"
        >
          <ExternalLink size={9} />
        </button>

        {/* Urgency badge */}
        {(isUrgent || isPrevious) && (
          <div className="absolute top-3 right-8">
            <span
              className="text-[8px] font-bold px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.15)',
                color: isUrgent ? '#f87171' : '#fb923c',
              }}
            >
              {isUrgent ? <><Zap size={8} style={{ display: 'inline' }} /> URG</> : <><Hourglass size={8} style={{ display: 'inline' }} /> PREV</>}
            </span>
          </div>
        )}

        <div className="mt-1.5 mb-2">
          <ClientBadge client={task.client} size="xs" />
        </div>

        {/* Title */}
        <p className="text-[12px] leading-relaxed font-medium pr-2 mb-1" style={{ color: '#efefef' }}>
          {task.title}
        </p>

        {task.problema && (
          <p className="text-[10px] mb-2 line-clamp-1" style={{ color: '#5a5a5a' }}>
            {task.problema}
          </p>
        )}

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {chips.map(({ label, count, color, Icon }, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold leading-none"
                style={{
                  backgroundColor: `${color}15`,
                  color,
                  border: `1px solid ${color}30`,
                }}
              >
                <Icon size={8} />
                <span style={{ fontWeight: 900 }}>{count}</span>
              </span>
            ))}
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
function KanbanColumn({ status, tasks, onOpen }: { status: TaskStatus; tasks: Task[]; onOpen: (t: Task) => void }) {
  const accent = COLUMN_ACCENT[status]

  return (
    <div className="flex flex-col min-h-0 w-[300px] shrink-0">
      {/* Header */}
      <div
        className="rounded-xl mb-3 px-3 py-2.5 flex items-center justify-between"
        style={{
          backgroundColor: `${accent}12`,
          border: `1px solid ${accent}28`,
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }} />
          <span className="text-[13px] font-semibold" style={{ color: '#efefef' }}>
            {STATUS_LABELS[status]}
          </span>
        </div>
        <span
          className="text-[11px] font-bold px-2.5 py-0.5 rounded-full tabular-nums"
          style={{ backgroundColor: `${accent}18`, color: accent, border: `1px solid ${accent}35` }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        className="flex-1 rounded-xl p-2.5 space-y-2.5 min-h-[120px]"
        style={{
          backgroundColor: 'rgba(26,26,26,0.35)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => <TaskCard key={task.id} task={task} onOpen={onOpen} />)}
        </SortableContext>
        {tasks.length === 0 && (
          <div
            className="flex items-center justify-center h-24 rounded-lg border border-dashed"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <span className="text-[11px]" style={{ color: '#303030' }}>Sin tareas</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export function KanbanPage() {
  const { data: clients = [] } = useClients()
  const { openTaskDetail } = useOutletContext<{ openTaskDetail?: (t: Task) => void }>()
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
          <div className="flex gap-4 h-full pb-4">
            {COLUMNS.map(status => (
              <KanbanColumn key={status} status={status} tasks={tasks.filter(t => t.status === status)} onOpen={t => openTaskDetail?.(t)} />
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
            {activeTask && (
              <div
                className="rounded-xl p-3 rotate-2"
                style={{
                  backgroundColor: '#262626',
                  border: '1px solid rgba(245,166,35,0.4)',
                  width: 284,
                  boxShadow: '0 24px 48px rgba(0,0,0,0.7), 0 0 24px rgba(245,166,35,0.12)',
                }}
              >
                <p className="text-xs font-medium" style={{ color: '#f5f5f5' }}>{activeTask.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
