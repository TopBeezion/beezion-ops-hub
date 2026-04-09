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
  PRIORITY_COLORS,
} from '../lib/constants'

const STATUSES: TaskStatus[] = ['pendiente', 'en_progreso', 'revision', 'completado']

const STATUS_ACCENT_COLORS: Record<TaskStatus, string> = {
  pendiente: '#6B7280',
  en_progreso: '#3B82F6',
  revision: '#F59E0B',
  completado: '#10B981',
}

interface DraggableTaskCardProps {
  task: Task
  onOpenDetail: (id: string) => void
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

  const priorityIcon =
    task.priority === 'urgente' ? (
      <AlertTriangle size={14} style={{ color: '#EF4444' }} />
    ) : task.priority === 'previsto' ? (
      <Zap size={14} style={{ color: '#F59E0B' }} />
    ) : null

  const clientColor = task.clientId ? `var(--color-${task.clientId})` : '#9CA3AF'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative"
      {...attributes}
    >
      <div
        onClick={() => onOpenDetail(task.id)}
        className="cursor-pointer rounded-lg border transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95"
        style={{
          backgroundColor: '#1A1D2E',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: '1px',
        }}
      >
        <div className="p-3">
          {/* Client & Priority */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-1.5 flex-1">
              <span
                className="text-xs font-medium"
                style={{ color: clientColor }}
              >
                {task.clientName || 'Sin cliente'}
              </span>
              {task.priority === 'urgente' && (
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: '#7F1D1D',
                    color: '#FCA5A5',
                  }}
                >
                  URGENTE
                </span>
              )}
              {task.priority === 'previsto' && (
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: '#78350F',
                    color: '#FED7AA',
                  }}
                >
                  PREVISTO
                </span>
              )}
            </div>
            <button
              {...listeners}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded"
              style={{ cursor: 'grab' }}
            >
              <GripVertical size={16} style={{ color: '#6B7280' }} />
            </button>
          </div>

          {/* Title */}
          <h3
            className="text-sm font-medium mb-3 line-clamp-2 leading-tight"
            style={{ color: '#E5E7EB' }}
          >
            {task.title}
          </h3>

          {/* Footer: Area, Assignee, Due Date */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {task.area && (
                <span
                  className="text-xs px-2 py-1 rounded font-medium"
                  style={{
                    backgroundColor: AREA_COLORS[task.area] + '20',
                    color: AREA_COLORS[task.area],
                  }}
                >
                  {AREA_LABELS[task.area]}
                </span>
              )}
              {task.dueDate && (
                <span
                  className="text-xs px-1.5 py-1 rounded flex items-center gap-0.5"
                  style={{ color: '#9CA3AF' }}
                >
                  <Clock size={12} />
                  {new Date(task.dueDate).toLocaleDateString('es-ES', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
            {task.assigneeId && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{
                  backgroundColor: '#6366F1',
                  color: '#fff',
                }}
              >
                {task.assigneeName?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  onOpenDetail: (id: string) => void
}

function KanbanColumn({ status, tasks, onOpenDetail }: KanbanColumnProps) {
  const { setNodeRef } = useSortable({
    id: status,
    data: { type: 'column' },
  })

  const accentColor = STATUS_ACCENT_COLORS[status]

  return (
    <div
      className="flex flex-col flex-1 min-w-72 max-h-[calc(100vh-200px)]"
      style={{ backgroundColor: '#151829' }}
    >
      {/* Column Header */}
      <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ backgroundColor: accentColor, width: '100%' }}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <h2 className="font-semibold text-sm" style={{ color: '#E5E7EB' }}>
              {STATUS_LABELS[status]}
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#9CA3AF',
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
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {tasks.length === 0 ? (
          <div
            className="h-40 rounded-lg border-2 border-dashed flex items-center justify-center"
            style={{
              borderColor: 'rgba(255,255,255,0.12)',
              color: '#6B7280',
            }}
          >
            <p className="text-xs text-center">No hay tareas</p>
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
    openTaskDetail: (id: string) => void
  }>()

  const updateTaskStatus = useUpdateTaskStatus()

  const [filterClient, setFilterClient] = useState<string>('')
  const [filterArea, setFilterArea] = useState<string>('')
  const [filterAssignee, setFilterAssignee] = useState<string>('')
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterClient && task.clientId !== filterClient) return false
      if (filterArea && task.area !== filterArea) return false
      if (filterAssignee && task.assigneeId !== filterAssignee) return false
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
    if (STATUSES.includes(newStatus) && draggedTask) {
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
      style={{ backgroundColor: '#0F1117' }}
    >
      {/* Top Bar */}
      <div
        className="px-6 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold" style={{ color: '#E5E7EB' }}>
              Tablero Kanban
            </h1>
            <span
              className="text-sm px-2 py-1 rounded"
              style={{
                backgroundColor: 'rgba(99,102,241,0.1)',
                color: '#6366F1',
              }}
            >
              {totalTasks} tareas
            </span>
          </div>
          <button
            onClick={openNewTask}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
            style={{
              backgroundColor: '#6366F1',
              color: '#fff',
            }}
          >
            <Plus size={18} />
            Nueva tarea
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter size={18} style={{ color: '#9CA3AF' }} />
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="filter-select text-sm px-3 py-1.5 rounded-lg border transition-colors"
            style={{
              backgroundColor: '#151829',
              borderColor: 'rgba(255,255,255,0.08)',
              color: '#E5E7EB',
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
            className="filter-select text-sm px-3 py-1.5 rounded-lg border transition-colors"
            style={{
              backgroundColor: '#151829',
              borderColor: 'rgba(255,255,255,0.08)',
              color: '#E5E7EB',
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
            className="filter-select text-sm px-3 py-1.5 rounded-lg border transition-colors"
            style={{
              backgroundColor: '#151829',
              borderColor: 'rgba(255,255,255,0.08)',
              color: '#E5E7EB',
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

      {/* Kanban Grid */}
      <div className="flex-1 overflow-x-auto p-4 gap-4 flex">
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onOpenDetail={openTaskDetail}
            />
          ))}
          <DragOverlay>
            {draggedTask && (
              <div
                className="rounded-lg p-3 shadow-2xl opacity-95"
                style={{
                  backgroundColor: '#1A1D2E',
                  borderColor: 'rgba(255,255,255,0.08)',
                  borderWidth: '1px',
                  width: '280px',
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: '#6366F1' }}>
                    {draggedTask.clientName || 'Sin cliente'}
                  </span>
                </div>
                <h3
                  className="text-sm font-medium mb-3 line-clamp-2"
                  style={{ color: '#E5E7EB' }}
                >
                  {draggedTask.title}
                </h3>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
