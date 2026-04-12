import { useState, useMemo } from 'react'
import { useTasks, useUpdateTaskStatus } from '../hooks/useTasks'
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
import {
  GripVertical,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import type { Task, TaskStatus, Area, Client } from '../types'
import {
  AREA_LABELS,
  AREA_COLORS,
  PRIORITY_COLORS,
  ASSIGNEE_COLORS,
} from '../lib/constants'

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

function FilterChip({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center',
        padding: '4px 11px', borderRadius: 20,
        fontSize: 11, fontWeight: 600,
        cursor: 'pointer', border: 'none', transition: 'all 0.12s',
        backgroundColor: active ? color : '#F8F9FC',
        color: active ? '#fff' : '#5A5E72',
        boxShadow: active ? `0 2px 8px ${color}40` : `inset 0 0 0 1px #E4E7F0`,
      }}
    >
      {label}
    </button>
  )
}

function AvatarChip({ name, color, active, onClick }: { name: string; color: string; active: boolean; onClick: () => void }) {
  const ini = name.slice(0, 2).toUpperCase()
  return (
    <button
      onClick={onClick}
      title={name}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        padding: '4px 8px', borderRadius: 10,
        cursor: 'pointer', border: 'none', transition: 'all 0.12s',
        backgroundColor: active ? `${color}15` : 'transparent',
        outline: active ? `2px solid ${color}` : `1px solid #E4E7F0`,
      }}
    >
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        backgroundColor: active ? color : `${color}28`,
        color: active ? '#fff' : color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 800,
      }}>
        {ini}
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, color: active ? color : '#9699B0' }}>
        {name.split(' ')[0]}
      </span>
    </button>
  )
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'pendiente', label: 'Pendiente', color: '#C4C4C4' },
  { id: 'en_progreso', label: 'En Progreso', color: '#579BFC' },
  { id: 'revision', label: 'En Revisión', color: '#FDAB3D' },
  { id: 'completado', label: 'Completado', color: '#00C875' },
]

interface DraggableTaskCardProps {
  task: Task
  onOpenDetail: (task: Task) => void
}

function DraggableTaskCard({ task, onOpenDetail }: DraggableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative"
      {...attributes}
    >
      <div
        onClick={() => onOpenDetail(task)}
        className="cursor-pointer rounded-lg border transition-all duration-200 hover:shadow-md hover:-translate-y-1 active:scale-95"
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#ECEDF2',
          borderWidth: '1px',
        }}
      >
        <div className="p-3">
          {/* Title */}
          <h3
            className="text-sm font-medium mb-3 line-clamp-2 leading-tight"
            style={{ color: '#1F2128' }}
          >
            {task.title}
          </h3>

          {/* Meta Row: Client, Area, Priority, Assignee */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Client dot + name */}
              {task.client_id && (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: PRIORITY_COLORS[task.priority] || '#9CA3AF',
                    }}
                  />
                  <span
                    className="truncate font-medium"
                    style={{ color: '#676879' }}
                  >
                    {task.client?.name || 'Sin cliente'}
                  </span>
                </div>
              )}

              {/* Area tag */}
              {task.area && (
                <span
                  className="px-2 py-0.5 rounded font-medium flex-shrink-0"
                  style={{
                    backgroundColor: AREA_COLORS[task.area] + '20',
                    color: AREA_COLORS[task.area],
                  }}
                >
                  {AREA_LABELS[task.area]}
                </span>
              )}
            </div>

            {/* Priority badge */}
            {task.tipo && (
              <div className="flex-shrink-0">
                {task.tipo === 'urgente' ? (
                  <AlertTriangle
                    size={14}
                    style={{ color: '#EF4444' }}
                  />
                ) : null}
              </div>
            )}
          </div>

          {/* Footer: Meeting Date + Assignee */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {task.meeting_date && (
                <span
                  className="text-xs px-1.5 py-1 rounded flex items-center gap-0.5"
                  style={{ color: '#676879' }}
                >
                  <Clock size={12} />
                  {new Date(task.meeting_date).toLocaleDateString('es-ES', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Assignee avatar */}
              {task.assignee && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                  style={{
                    backgroundColor:
                      ASSIGNEE_COLORS[task.assignee || ''] || '#6366F1',
                  }}
                  title={task.assignee}
                >
                  {task.assignee?.charAt(0).toUpperCase() || '?'}
                </div>
              )}

              {/* Drag handle */}
              <button
                {...listeners}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
              >
                <GripVertical size={14} style={{ color: '#676879' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface KanbanColumnProps {
  column: (typeof COLUMNS)[0]
  tasks: Task[]
  onOpenDetail: (task: Task) => void
}

function KanbanColumn({ column, tasks, onOpenDetail }: KanbanColumnProps) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: 'column' },
  })

  return (
    <div
      className="flex flex-col flex-1 min-w-80 max-h-[calc(100vh-180px)] rounded-lg"
      style={{ backgroundColor: '#F0F1F5' }}
    >
      {/* Column Header */}
      <div
        className="px-4 py-3 border-t-2"
        style={{ borderColor: column.color }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2
              className="font-semibold text-sm"
              style={{ color: '#1F2128' }}
            >
              {column.label}
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#676879',
                border: '1px solid #ECEDF2',
              }}
            >
              {tasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Column Body */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-3 space-y-2"
      >
        {tasks.length === 0 ? (
          <div
            className="h-32 rounded-lg border-2 border-dashed flex items-center justify-center text-center"
            style={{
              borderColor: '#ECEDF2',
              color: '#676879',
            }}
          >
            <p className="text-xs">No hay tareas</p>
          </div>
        ) : (
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  )
}

export function KanbanPage() {
  const { data: tasks = [] } = useTasks()
  const { data: clients = [] } = useClients()
  const { openTaskDetail } = useOutletContext<{
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

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterClients.length && !filterClients.includes(task.client_id ?? '')) return false
      if (filterAreas.length && !filterAreas.includes(task.area ?? '')) return false
      if (filterAssignees.length && !filterAssignees.includes(task.assignee ?? '')) return false
      return true
    })
  }, [tasks, filterClients, filterAreas, filterAssignees])

  const tasksByStatus: Record<TaskStatus, Task[]> = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      pendiente: [],
      en_progreso: [],
      revision: [],
      completado: [],
    }
    filteredTasks.forEach((task) => {
      grouped[task.status].push(task)
    })
    return grouped
  }, [filteredTasks])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = filteredTasks.find((t) => t.id === active.id)
    if (task) {
      setDraggedTask(task)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedTask(null)

    if (!over) return

    const newStatus = over.id as TaskStatus
    const validStatuses = COLUMNS.map((col) => col.id)
    if (validStatuses.includes(newStatus) && draggedTask) {
      updateTaskStatus.mutate({
        id: draggedTask.id,
        status: newStatus,
      })
    }
  }

  const totalTasks = filteredTasks.length

  return (
    <div
      className="h-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: '#F6F7FB' }}
    >
      {/* Filter Bar */}
      <div style={{ borderBottom: '1px solid #E4E7F0', backgroundColor: '#FFFFFF', padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Row 1: clients + assignees */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#9699B0', letterSpacing: '0.1em', marginRight: 2 }}>CLIENTE</span>
          {clients.map(cl => (
            <FilterChip
              key={cl.id}
              label={cl.name}
              active={filterClients.includes(cl.id)}
              color={cl.color}
              onClick={() => setFilterClients(toggle(filterClients, cl.id))}
            />
          ))}

          <div style={{ width: 1, height: 28, backgroundColor: '#E4E7F0', margin: '0 4px' }} />

          <span style={{ fontSize: 9, fontWeight: 800, color: '#9699B0', letterSpacing: '0.1em', marginRight: 2 }}>RESPONSABLE</span>
          {KANBAN_ASSIGNEES.map(({ name, color }) => (
            <AvatarChip
              key={name}
              name={name}
              color={color}
              active={filterAssignees.includes(name)}
              onClick={() => setFilterAssignees(toggle(filterAssignees, name))}
            />
          ))}
        </div>

        {/* Row 2: areas + count + clear */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: '#9699B0', letterSpacing: '0.1em', marginRight: 2 }}>ÁREA</span>
          {(Object.entries(AREA_LABELS) as [string, string][]).map(([key, label]) => (
            <FilterChip
              key={key}
              label={label}
              active={filterAreas.includes(key)}
              color={AREA_COLORS[key as Area] ?? '#6366F1'}
              onClick={() => setFilterAreas(toggle(filterAreas, key))}
            />
          ))}

          <span style={{ fontSize: 11, color: '#9699B0', marginLeft: 'auto', fontWeight: 500 }}>
            {totalTasks} tareas
          </span>

          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                color: '#DC2626', backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5', borderRadius: 20, padding: '3px 10px',
              }}
            >
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 overflow-x-auto p-4 gap-4 flex">
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByStatus[column.id]}
              onOpenDetail={openTaskDetail}
            />
          ))}

          {/* Drag Overlay */}
          <DragOverlay>
            {draggedTask && (
              <div
                className="rounded-lg p-3 shadow-xl opacity-95 max-w-xs"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#ECEDF2',
                  borderWidth: '1px',
                  transform: 'rotate(2deg)',
                }}
              >
                <h3
                  className="text-sm font-medium mb-2 line-clamp-2"
                  style={{ color: '#1F2128' }}
                >
                  {draggedTask.title}
                </h3>
                <div className="flex items-center gap-1 text-xs">
                  {draggedTask.client_id && (
                    <span style={{ color: '#676879' }}>
                      {draggedTask.client?.name || 'Sin cliente'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
