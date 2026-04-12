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
import { GripVertical } from 'lucide-react'
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
        className="cursor-pointer rounded-xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: '#E8EAF0',
          borderWidth: '1px',
          borderLeft: task.client?.color ? `3px solid ${task.client.color}` : '1px solid #E8EAF0',
        }}
      >
        <div style={{ padding: '10px 12px' }}>
          {/* Client badge */}
          {task.client && (
            <div style={{ marginBottom: 7 }}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: task.client.color,
                backgroundColor: `${task.client.color}15`,
                padding: '2px 7px', borderRadius: 5,
                border: `1px solid ${task.client.color}25`,
              }}>
                {task.client.name}
              </span>
            </div>
          )}

          {/* Title */}
          <h3
            className="line-clamp-2 leading-snug"
            style={{ fontSize: 12, fontWeight: 600, color: '#1A1D27', marginBottom: 10 }}
          >
            {task.title}
          </h3>

          {/* Meta Row: Area, Urgent, date, assignee */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {/* Area tag */}
              {task.area && (
                <span
                  style={{
                    fontSize: 9, fontWeight: 700, flexShrink: 0,
                    padding: '2px 6px', borderRadius: 5,
                    backgroundColor: AREA_COLORS[task.area] + '18',
                    color: AREA_COLORS[task.area],
                  }}
                >
                  {AREA_LABELS[task.area]}
                </span>
              )}
              {task.tipo === 'urgente' && (
                <span style={{ fontSize: 9, fontWeight: 800, color: '#E2445C', backgroundColor: '#FEF2F4', padding: '2px 5px', borderRadius: 4, border: '1px solid #FECDD3' }}>
                  🚨 URG
                </span>
              )}
            </div>

          </div>

          {/* Footer: Assignee + drag */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            {task.assignee ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div
                  style={{
                    width: 20, height: 20, borderRadius: '50%',
                    backgroundColor: ASSIGNEE_COLORS[task.assignee] || '#6366F1',
                    color: '#fff', fontSize: 8, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}
                  title={task.assignee}
                >
                  {task.assignee.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: 10, color: '#9699B0', fontWeight: 500 }}>{task.assignee}</span>
              </div>
            ) : <div />}

            <button
              {...listeners}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
              onClick={e => e.stopPropagation()}
            >
              <GripVertical size={13} style={{ color: '#B0B3C6' }} />
            </button>
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
