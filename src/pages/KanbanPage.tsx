import { useState, useMemo } from 'react'
import { useTasks, useUpdateTaskStatus } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useTeam } from '../hooks/useTeam'
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
  Plus,
  Filter,
  Clock,
  AlertTriangle,
  Zap,
} from 'lucide-react'
import type { Task, TaskStatus, Area, Client } from '../types'
import {
  STATUS_LABELS,
  STATUS_COLORS,
  AREA_LABELS,
  AREA_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '../lib/constants'

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'pendiente', label: 'Pendiente', color: '#C4C4C4' },
  { id: 'en_progreso', label: 'En Progreso', color: '#579BFC' },
  { id: 'revision', label: 'En Revisión', color: '#FDAB3D' },
  { id: 'completado', label: 'Completado', color: '#00C875' },
]

const ASSIGNEE_COLORS: Record<string, string> = {
  Alejandro: '#8b5cf6',
  Alec: '#f59e0b',
  Paula: '#ec4899',
  'Jose Luis': '#3b82f6',
  'Editor 1': '#06b6d4',
  'Editor 2': '#10b981',
  'Editor 3': '#f97316',
}

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
  const { data: team = [] } = useTeam()
  const { openNewTask, openTaskDetail } = useOutletContext<{
    openNewTask: () => void
    openTaskDetail: (task: Task) => void
  }>()

  const updateTaskStatus = useUpdateTaskStatus()

  const [filterClient, setFilterClient] = useState<string>('')
  const [filterArea, setFilterArea] = useState<string>('')
  const [filterAssignee, setFilterAssignee] = useState<string>('')
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterClient && task.client_id !== filterClient) return false
      if (filterArea && task.area !== filterArea) return false
      if (filterAssignee && task.assignee !== filterAssignee) return false
      return true
    })
  }, [tasks, filterClient, filterArea, filterAssignee])

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
      <div
        className="px-6 py-4 border-b"
        style={{ borderColor: '#ECEDF2', backgroundColor: '#FFFFFF' }}
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold" style={{ color: '#1F2128' }}>
              Tablero Kanban
            </h1>
            <span
              className="text-sm px-2 py-1 rounded"
              style={{
                backgroundColor: '#E0E7FF',
                color: '#4F46E5',
              }}
            >
              {totalTasks} tareas
            </span>
          </div>
          <button
            onClick={openNewTask}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
            style={{
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
            }}
          >
            <Plus size={18} />
            Nueva tarea
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter size={18} style={{ color: '#676879' }} />

          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border transition-colors"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#ECEDF2',
              color: '#1F2128',
            }}
          >
            <option value="">Todos los clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>

          <select
            value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border transition-colors"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#ECEDF2',
              color: '#1F2128',
            }}
          >
            <option value="">Todas las áreas</option>
            <option value="diseno">Diseño</option>
            <option value="desarrollo">Desarrollo</option>
            <option value="marketing">Marketing</option>
            <option value="soporte">Soporte</option>
          </select>

          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border transition-colors"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#ECEDF2',
              color: '#1F2128',
            }}
          >
            <option value="">Todos los asignados</option>
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
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
