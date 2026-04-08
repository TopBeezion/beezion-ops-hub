import { useState, useCallback, useRef } from 'react'
import {
  Search, ChevronDown, Plus, ChevronRight, Trash2, Edit2, Check, X,
} from 'lucide-react'
import { useTasks, useUpdateTask, useUpdateTaskStatus } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useTeam } from '../hooks/useTeam'
import { useOutletContext } from 'react-router-dom'
import type { Task, Area, Priority, TaskStatus, TaskFilters } from '../types'
import { AREA_LABELS, AREA_COLORS, STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../lib/constants'

const PRIORITY_CYCLE: Priority[] = ['alta', 'media', 'baja']
const STATUS_CYCLE: TaskStatus[] = ['pendiente', 'en_progreso', 'revision', 'completado']

type GroupByOption = 'none' | 'status' | 'client' | 'assignee' | 'priority' | 'area'

export function BacklogPage() {
  const { data: clients = [] } = useClients()
  const { data: team = [] } = useTeam()
  const updateTask = useUpdateTask()
  const updateStatus = useUpdateTaskStatus()
  const ctx = useOutletContext<{ openNewTask?: () => void; openTaskDetail?: (t: Task) => void }>()

  // Filter state
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<TaskFilters>({})
  const [groupBy, setGroupBy] = useState<GroupByOption>('none')

  // Inline editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editTitleRef, setEditTitleRef] = useState<HTMLInputElement | null>(null)

  // Collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const { data: tasks = [], isLoading } = useTasks(filters)

  // Apply search filter
  const filteredTasks = search
    ? tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : tasks

  // Filter helpers
  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

  const setFilter = (key: keyof TaskFilters, value: string | number | undefined) => {
    setFilters(f => ({
      ...f,
      [key]: value || undefined,
    }))
  }

  const clearFilters = () => {
    setFilters({})
    setSearch('')
  }

  // Grouping logic
  const getGroupKey = (task: Task): string => {
    switch (groupBy) {
      case 'status':
        return task.status
      case 'client':
        return task.client_id || 'unassigned'
      case 'assignee':
        return task.assignee || 'unassigned'
      case 'priority':
        return task.priority
      case 'area':
        return task.area
      default:
        return 'all'
    }
  }

  const grouped = groupBy === 'none'
    ? [{ key: 'all', label: '', tasks: filteredTasks }]
    : Object.entries(
        filteredTasks.reduce((acc, task) => {
          const key = getGroupKey(task)
          if (!acc[key]) acc[key] = []
          acc[key].push(task)
          return acc
        }, {} as Record<string, Task[]>)
      ).map(([key, tasks]) => {
        let label = key
        if (groupBy === 'status') label = STATUS_LABELS[key as TaskStatus]
        else if (groupBy === 'client') {
          const client = clients.find(c => c.id === key)
          label = client?.name || 'Sin cliente'
        } else if (groupBy === 'assignee') label = key === 'unassigned' ? 'Sin asignar' : key
        else if (groupBy === 'priority') label = PRIORITY_LABELS[key as Priority]
        else if (groupBy === 'area') label = AREA_LABELS[key as Area]

        return { key, label, tasks }
      })

  // Inline editing handlers
  const startEditingTitle = (task: Task) => {
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
    setTimeout(() => editTitleRef?.focus(), 0)
  }

  const saveTitle = async (taskId: string) => {
    if (editingTitle.trim() && editingTitle !== tasks.find(t => t.id === taskId)?.title) {
      await updateTask.mutate({ id: taskId, title: editingTitle.trim() })
    }
    setEditingTaskId(null)
    setEditingTitle('')
  }

  const cancelEditingTitle = () => {
    setEditingTaskId(null)
    setEditingTitle('')
  }

  const cycleStatus = async (task: Task) => {
    const currentIndex = STATUS_CYCLE.indexOf(task.status)
    const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length]
    await updateStatus.mutate({ id: task.id, status: nextStatus })
  }

  const cyclePriority = async (task: Task) => {
    const currentIndex = PRIORITY_CYCLE.indexOf(task.priority)
    const nextPriority = PRIORITY_CYCLE[(currentIndex + 1) % PRIORITY_CYCLE.length]
    await updateTask.mutate({ id: task.id, priority: nextPriority })
  }

  const toggleGroupCollapsed = (key: string) => {
    const next = new Set(collapsedGroups)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setCollapsedGroups(next)
  }

  // Render helpers
  const renderClientBadge = (clientId?: string) => {
    const client = clients.find(c => c.id === clientId)
    if (!client) return <span style={{ color: '#6B7280' }}>—</span>
    return (
      <span
        className="inline-block px-2 py-1 rounded text-xs font-medium"
        style={{
          backgroundColor: `${client.color}20`,
          color: client.color,
          border: `1px solid ${client.color}40`,
        }}
      >
        {client.name}
      </span>
    )
  }

  const renderAreaBadge = (area: Area) => {
    const color = AREA_COLORS[area]
    return (
      <span
        className="inline-block px-2 py-1 rounded text-xs font-medium"
        style={{
          backgroundColor: `${color}20`,
          color,
          border: `1px solid ${color}40`,
        }}
      >
        {AREA_LABELS[area]}
      </span>
    )
  }

  const renderStatusBadge = (status: TaskStatus, onClick?: () => void) => {
    const color = STATUS_COLORS[status]
    return (
      <button
        onClick={onClick}
        className="inline-block px-2 py-1 rounded text-xs font-medium hover:opacity-80 transition-opacity"
        style={{
          backgroundColor: `${color}20`,
          color,
          border: `1px solid ${color}40`,
        }}
      >
        {STATUS_LABELS[status]}
      </button>
    )
  }

  const renderPriorityBadge = (priority: Priority, onClick?: () => void) => {
    const color = PRIORITY_COLORS[priority]
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium hover:opacity-80 transition-opacity"
        style={{
          backgroundColor: `${color}20`,
          color,
          border: `1px solid ${color}40`,
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        {PRIORITY_LABELS[priority]}
      </button>
    )
  }

  const renderTipoIndicator = (tipo: string) => {
    if (tipo === 'urgente') {
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: '#EF444420', color: '#EF4444' }}>URGENTE</span>
    }
    if (tipo === 'pendiente_anterior') {
      return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: '#F9731620', color: '#F97316' }}>PREV</span>
    }
    return null
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0F1117' }}>
      {/* Filter Bar */}
      <div
        className="filter-toolbar flex items-center gap-2 px-4 py-3 flex-wrap shrink-0"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: '#1A1D2E',
        }}
      >
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-8 pr-3 py-2 rounded-lg text-sm outline-none w-52"
            style={{
              backgroundColor: '#252940',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#E5E7EB',
            }}
          />
        </div>

        {/* Client Filter */}
        <select
          value={filters.client_id || ''}
          onChange={e => setFilter('client_id', e.target.value)}
          className="filter-select px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
          style={{
            backgroundColor: filters.client_id ? 'rgba(99,102,241,0.1)' : '#252940',
            border: '1px solid rgba(255,255,255,0.08)',
            color: filters.client_id ? '#6366F1' : '#9CA3AF',
          }}
        >
          <option value="">Client</option>
          {clients.map(c => (
            <option key={c.id} value={c.id} style={{ backgroundColor: '#1A1D2E' }}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Area Filter */}
        <select
          value={filters.area || ''}
          onChange={e => setFilter('area', e.target.value)}
          className="filter-select px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
          style={{
            backgroundColor: filters.area ? 'rgba(99,102,241,0.1)' : '#252940',
            border: '1px solid rgba(255,255,255,0.08)',
            color: filters.area ? '#6366F1' : '#9CA3AF',
          }}
        >
          <option value="">Area</option>
          {(['copy', 'trafico', 'tech', 'admin'] as Area[]).map(a => (
            <option key={a} value={a} style={{ backgroundColor: '#1A1D2E' }}>
              {AREA_LABELS[a]}
            </option>
          ))}
        </select>

        {/* Assignee Filter */}
        <select
          value={filters.assignee || ''}
          onChange={e => setFilter('assignee', e.target.value)}
          className="filter-select px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
          style={{
            backgroundColor: filters.assignee ? 'rgba(99,102,241,0.1)' : '#252940',
            border: '1px solid rgba(255,255,255,0.08)',
            color: filters.assignee ? '#6366F1' : '#9CA3AF',
          }}
        >
          <option value="">Assignee</option>
          {team.map(m => (
            <option key={m.id} value={m.name} style={{ backgroundColor: '#1A1D2E' }}>
              {m.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status || ''}
          onChange={e => setFilter('status', e.target.value)}
          className="filter-select px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
          style={{
            backgroundColor: filters.status ? 'rgba(99,102,241,0.1)' : '#252940',
            border: '1px solid rgba(255,255,255,0.08)',
            color: filters.status ? '#6366F1' : '#9CA3AF',
          }}
        >
          <option value="">Status</option>
          {(['pendiente', 'en_progreso', 'revision', 'completado'] as TaskStatus[]).map(s => (
            <option key={s} value={s} style={{ backgroundColor: '#1A1D2E' }}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          value={filters.priority || ''}
          onChange={e => setFilter('priority', e.target.value)}
          className="filter-select px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
          style={{
            backgroundColor: filters.priority ? 'rgba(99,102,241,0.1)' : '#252940',
            border: '1px solid rgba(255,255,255,0.08)',
            color: filters.priority ? '#6366F1' : '#9CA3AF',
          }}
        >
          <option value="">Priority</option>
          {(['alta', 'media', 'baja'] as Priority[]).map(p => (
            <option key={p} value={p} style={{ backgroundColor: '#1A1D2E' }}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>

        {/* Week Filter */}
        <select
          value={filters.week?.toString() || ''}
          onChange={e => setFilter('week', e.target.value ? parseInt(e.target.value) : undefined)}
          className="filter-select px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
          style={{
            backgroundColor: filters.week ? 'rgba(99,102,241,0.1)' : '#252940',
            border: '1px solid rgba(255,255,255,0.08)',
            color: filters.week ? '#6366F1' : '#9CA3AF',
          }}
        >
          <option value="">Sprint</option>
          {[1, 2, 3, 4].map(w => (
            <option key={w} value={w.toString()} style={{ backgroundColor: '#1A1D2E' }}>
              Sprint {w}
            </option>
          ))}
        </select>

        {/* Group By */}
        <select
          value={groupBy}
          onChange={e => setGroupBy(e.target.value as GroupByOption)}
          className="filter-select px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
          style={{
            backgroundColor: groupBy !== 'none' ? 'rgba(99,102,241,0.1)' : '#252940',
            border: '1px solid rgba(255,255,255,0.08)',
            color: groupBy !== 'none' ? '#6366F1' : '#9CA3AF',
          }}
        >
          <option value="none">Group by</option>
          <option value="status">Status</option>
          <option value="client">Client</option>
          <option value="assignee">Assignee</option>
          <option value="priority">Priority</option>
          <option value="area">Area</option>
        </select>

        {/* Active filters indicator */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              backgroundColor: '#252940',
              color: '#6366F1',
              border: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            Clear filters
          </button>
        )}

        {/* Right section */}
        <div className="ml-auto flex items-center gap-3">
          <span style={{ color: '#9CA3AF', fontSize: '14px', fontWeight: '500' }}>
            {filteredTasks.length} tasks
          </span>
          {ctx?.openNewTask && (
            <button
              onClick={ctx.openNewTask}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-opacity hover:opacity-90"
              style={{
                backgroundColor: '#6366F1',
                color: '#E5E7EB',
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              New
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#6366F1', borderTopColor: 'transparent' }}
          />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex items-center justify-center flex-1" style={{ color: '#6B7280' }}>
          <div className="text-center">
            <p className="text-sm font-medium mb-1">No tasks found</p>
            <p className="text-xs">Try adjusting your filters or create a new task</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: '#1A1D2E' }}>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: '#6B7280', width: '50px' }}>
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: '#6B7280' }}>
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: '#6B7280', width: '110px' }}>
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: '#6B7280', width: '90px' }}>
                  Area
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: '#6B7280', width: '110px' }}>
                  Assignee
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: '#6B7280', width: '110px' }}>
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: '#6B7280', width: '130px' }}>
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: '#6B7280', width: '70px' }}>
                  Sprint
                </th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(({ key, label, tasks: groupTasks }) => [
                // Group header (if grouped)
                ...(groupBy !== 'none' ? [{
                  isHeader: true,
                  key: `header-${key}`,
                  label,
                  groupKey: key,
                  count: groupTasks.length,
                }] : []),
                // Tasks
                ...groupTasks
                  .filter(() => groupBy === 'none' || !collapsedGroups.has(key))
                  .map(task => ({
                    isHeader: false,
                    task,
                  })),
              ]).map((item: any, idx) => {
                if (item.isHeader) {
                  return (
                    <tr key={item.key} style={{ backgroundColor: '#252940', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <td colSpan={8} className="px-4 py-2">
                        <button
                          onClick={() => toggleGroupCollapsed(item.groupKey)}
                          className="flex items-center gap-2 w-full font-medium text-sm hover:opacity-80 transition-opacity"
                          style={{ color: '#E5E7EB' }}
                        >
                          <ChevronRight
                            size={16}
                            style={{
                              transform: collapsedGroups.has(item.groupKey) ? 'rotate(0)' : 'rotate(90deg)',
                              transition: 'transform 0.2s',
                            }}
                          />
                          {item.label}
                          <span style={{ color: '#6B7280', fontSize: '12px', marginLeft: '8px' }}>
                            {item.count}
                          </span>
                        </button>
                      </td>
                    </tr>
                  )
                }

                const task = item.task
                const isEditing = editingTaskId === task.id

                return (
                  <tr
                    key={task.id}
                    className="hover:opacity-70 transition-opacity cursor-pointer"
                    onClick={() => !isEditing && ctx?.openTaskDetail?.(task)}
                    style={{
                      backgroundColor: '#0F1117',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      minHeight: '44px',
                    }}
                  >
                    {/* Tipo indicator */}
                    <td className="px-4 py-3" style={{ color: '#E5E7EB' }}>
                      {renderTipoIndicator(task.tipo)}
                    </td>

                    {/* Title - Inline Editable */}
                    <td className="px-4 py-3" onClick={e => isEditing && e.stopPropagation()}>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            ref={setEditTitleRef}
                            type="text"
                            value={editingTitle}
                            onChange={e => setEditingTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveTitle(task.id)
                              if (e.key === 'Escape') cancelEditingTitle()
                            }}
                            onClick={e => e.stopPropagation()}
                            className="flex-1 px-2 py-1 rounded text-sm outline-none"
                            style={{
                              backgroundColor: '#252940',
                              border: '1px solid #6366F1',
                              color: '#E5E7EB',
                            }}
                          />
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              saveTitle(task.id)
                            }}
                            className="p-1 hover:opacity-80"
                            style={{ color: '#4ADE80' }}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              cancelEditingTitle()
                            }}
                            className="p-1 hover:opacity-80"
                            style={{ color: '#EF4444' }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="hover:underline"
                          onDoubleClick={e => {
                            e.stopPropagation()
                            startEditingTitle(task)
                          }}
                          style={{ color: '#E5E7EB', cursor: 'text' }}
                        >
                          {task.title}
                        </div>
                      )}
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3">
                      {renderClientBadge(task.client_id)}
                    </td>

                    {/* Area */}
                    <td className="px-4 py-3">
                      {renderAreaBadge(task.area)}
                    </td>

                    {/* Assignee */}
                    <td className="px-4 py-3" style={{ color: '#E5E7EB' }}>
                      {task.assignee || '—'}
                    </td>

                    {/* Priority - Clickable to cycle */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => cyclePriority(task)}>
                        {renderPriorityBadge(task.priority)}
                      </button>
                    </td>

                    {/* Status - Clickable to cycle */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {renderStatusBadge(task.status, () => cycleStatus(task))}
                    </td>

                    {/* Sprint */}
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: '#6366F120',
                          color: '#6366F1',
                          border: '1px solid #6366F140',
                        }}
                      >
                        Sprint {task.week}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
