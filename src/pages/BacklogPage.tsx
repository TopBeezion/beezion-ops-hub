import { useState } from 'react'
import {
  Search, ChevronDown, Plus, ChevronRight, X,
} from 'lucide-react'
import { useTasks, useUpdateTask, useUpdateTaskStatus } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useOutletContext } from 'react-router-dom'
import type { Task, Area, Priority, TaskStatus, TaskFilters } from '../types'
import { AREA_LABELS, AREA_COLORS, STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../lib/constants'

const PRIORITY_CYCLE: Priority[] = ['baja', 'media', 'alta']
const STATUS_CYCLE: TaskStatus[] = ['pendiente', 'en_progreso', 'revision', 'completado']

const TEAM_MEMBERS = ['Alejandro', 'Alec', 'Paula', 'Jose Luis', 'Editor 1', 'Editor 2', 'Editor 3']

const ASSIGNEE_COLORS: Record<string, string> = {
  Alejandro: '#8b5cf6',
  Alec: '#f59e0b',
  Paula: '#ec4899',
  'Jose Luis': '#3b82f6',
  'Editor 1': '#06b6d4',
  'Editor 2': '#10b981',
  'Editor 3': '#f97316',
}

type GroupByOption = 'none' | 'status' | 'client' | 'assignee' | 'priority' | 'area'

export function BacklogPage() {
  const { data: clients = [] } = useClients()
  const updateTask = useUpdateTask()
  const updateStatus = useUpdateTaskStatus()
  const ctx = useOutletContext<{ openNewTask?: () => void; openTaskDetail?: (t: Task) => void }>()

  // Filter state
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<TaskFilters>({})
  const [groupBy, setGroupBy] = useState<GroupByOption>('none')

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
    if (!client) return <span style={{ color: '#9699A6' }}>—</span>
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: client.color }}
        />
        <span style={{ color: '#1F2128', fontSize: '13px' }}>{client.name}</span>
      </div>
    )
  }

  const renderAssigneeAvatar = (assignee?: string) => {
    if (!assignee) return <span style={{ color: '#9699A6' }}>—</span>
    const color = ASSIGNEE_COLORS[assignee] || '#06b6d4'
    const initials = assignee.split(' ').map(n => n[0]).join('').toUpperCase()
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
          style={{ backgroundColor: color, color: '#FFFFFF' }}
        >
          {initials}
        </div>
        <span style={{ color: '#1F2128', fontSize: '13px' }}>{assignee}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#F6F7FB' }}>
      {/* Filter Toolbar */}
      <div
        className="flex items-center gap-3 px-6 py-4 flex-wrap shrink-0"
        style={{
          borderBottom: '1px solid #E6E9EF',
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9699A6' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="filter-search pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: '#F6F7FB',
              border: '1px solid #E6E9EF',
              color: '#1F2128',
              width: '240px',
            }}
          />
        </div>

        {/* Client Filter */}
        <select
          value={filters.client_id || ''}
          onChange={e => setFilter('client_id', e.target.value)}
          className="filter-select px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
          style={{
            backgroundColor: filters.client_id ? '#F0F3FF' : '#F6F7FB',
            border: '1px solid #E6E9EF',
            color: filters.client_id ? '#1F2128' : '#9699A6',
          }}
        >
          <option value="">Client</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
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
            backgroundColor: filters.area ? '#F0F3FF' : '#F6F7FB',
            border: '1px solid #E6E9EF',
            color: filters.area ? '#1F2128' : '#9699A6',
          }}
        >
          <option value="">Area</option>
          {(['copy', 'trafico', 'tech', 'admin'] as Area[]).map(a => (
            <option key={a} value={a}>
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
            backgroundColor: filters.assignee ? '#F0F3FF' : '#F6F7FB',
            border: '1px solid #E6E9EF',
            color: filters.assignee ? '#1F2128' : '#9699A6',
          }}
        >
          <option value="">Assignee</option>
          {TEAM_MEMBERS.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status || ''}
          onChange={e => setFilter('status', e.target.value)}
          className="filter-select px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
          style={{
            backgroundColor: filters.status ? '#F0F3FF' : '#F6F7FB',
            border: '1px solid #E6E9EF',
            color: filters.status ? '#1F2128' : '#9699A6',
          }}
        >
          <option value="">Status</option>
          {(['pendiente', 'en_progreso', 'revision', 'completado'] as TaskStatus[]).map(s => (
            <option key={s} value={s}>
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
            backgroundColor: filters.priority ? '#F0F3FF' : '#F6F7FB',
            border: '1px solid #E6E9EF',
            color: filters.priority ? '#1F2128' : '#9699A6',
          }}
        >
          <option value="">Priority</option>
          {(['baja', 'media', 'alta'] as Priority[]).map(p => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>

        {/* Sprint Filter */}
        <select
          value={filters.week?.toString() || ''}
          onChange={e => setFilter('week', e.target.value ? parseInt(e.target.value) : undefined)}
          className="filter-select px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
          style={{
            backgroundColor: filters.week ? '#F0F3FF' : '#F6F7FB',
            border: '1px solid #E6E9EF',
            color: filters.week ? '#1F2128' : '#9699A6',
          }}
        >
          <option value="">Sprint</option>
          {[1, 2, 3, 4].map(w => (
            <option key={w} value={w.toString()}>
              S{w}
            </option>
          ))}
        </select>

        {/* Group By */}
        <select
          value={groupBy}
          onChange={e => setGroupBy(e.target.value as GroupByOption)}
          className="filter-select px-3 py-2 rounded-lg text-sm outline-none cursor-pointer"
          style={{
            backgroundColor: groupBy !== 'none' ? '#F0F3FF' : '#F6F7FB',
            border: '1px solid #E6E9EF',
            color: groupBy !== 'none' ? '#1F2128' : '#9699A6',
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
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-50"
            style={{
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FCA5A5',
            }}
          >
            Clear {activeFilterCount}
          </button>
        )}

        {/* Right section */}
        <div className="ml-auto flex items-center gap-3">
          <span style={{ color: '#9699A6', fontSize: '13px', fontWeight: '500' }}>
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </span>
          {ctx?.openNewTask && (
            <button
              onClick={ctx.openNewTask}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors hover:bg-blue-600"
              style={{
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              New task
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div
              className="w-8 h-8 rounded-full border-3 border-blue-200 border-t-blue-500 animate-spin mx-auto mb-3"
              style={{ borderColor: '#DBEAFE', borderTopColor: '#3B82F6' }}
            />
            <p style={{ color: '#676879', fontSize: '13px' }}>Cargando tareas...</p>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex items-center justify-center flex-1" style={{ color: '#9699A6' }}>
          <div className="text-center">
            <p className="text-sm font-medium mb-1" style={{ color: '#676879' }}>No hay tareas</p>
            <p className="text-xs" style={{ color: '#9699A6' }}>Try adjusting your filters or create a new task</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="task-table w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #ECEDF2' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: '#676879', width: '300px' }}>
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: '#676879', width: '140px' }}>
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: '#676879', width: '110px' }}>
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: '#676879', width: '100px' }}>
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: '#676879', width: '100px' }}>
                  Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: '#676879', width: '150px' }}>
                  Assignee
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider" style={{ color: '#676879', width: '80px' }}>
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
              ]).map((item: any) => {
                if (item.isHeader) {
                  const borderColor = groupBy === 'status'
                    ? STATUS_COLORS[item.groupKey as TaskStatus]
                    : groupBy === 'priority'
                      ? PRIORITY_COLORS[item.groupKey as Priority]
                      : groupBy === 'area'
                        ? AREA_COLORS[item.groupKey as Area]
                        : '#D1D5DB'

                  return (
                    <tr key={item.key} style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #ECEDF2' }}>
                      <td colSpan={7} className="px-6 py-3">
                        <button
                          onClick={() => toggleGroupCollapsed(item.groupKey)}
                          className="group-header flex items-center gap-2 w-full font-semibold text-sm hover:opacity-80 transition-opacity"
                          style={{
                            color: '#1F2128',
                            paddingLeft: '12px',
                            borderLeft: `3px solid ${borderColor}`,
                          }}
                        >
                          <ChevronRight
                            size={16}
                            style={{
                              transform: collapsedGroups.has(item.groupKey) ? 'rotate(0)' : 'rotate(90deg)',
                              transition: 'transform 0.2s',
                            }}
                          />
                          {item.label}
                          <span style={{ color: '#9699A6', fontSize: '12px', marginLeft: '8px' }}>
                            ({item.count})
                          </span>
                        </button>
                      </td>
                    </tr>
                  )
                }

                const task = item.task as Task

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => ctx?.openTaskDetail?.(task)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderBottom: '1px solid #ECEDF2',
                    }}
                  >
                    {/* Title */}
                    <td className="px-6 py-4">
                      <div style={{ color: '#1F2128', fontSize: '13px', fontWeight: '500' }}>
                        {task.title}
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-6 py-4">
                      {renderClientBadge(task.client_id)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          cycleStatus(task)
                        }}
                        className={`status-pill status-pill--${task.status} px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80`}
                        style={{
                          backgroundColor: `${STATUS_COLORS[task.status]}20`,
                          color: STATUS_COLORS[task.status],
                          border: `1px solid ${STATUS_COLORS[task.status]}40`,
                        }}
                      >
                        {STATUS_LABELS[task.status]}
                      </button>
                    </td>

                    {/* Priority */}
                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          cyclePriority(task)
                        }}
                        className={`priority-badge priority-badge--${task.priority} flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80`}
                        style={{
                          backgroundColor: `${PRIORITY_COLORS[task.priority]}20`,
                          color: PRIORITY_COLORS[task.priority],
                          border: `1px solid ${PRIORITY_COLORS[task.priority]}40`,
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
                        {PRIORITY_LABELS[task.priority]}
                      </button>
                    </td>

                    {/* Area */}
                    <td className="px-6 py-4">
                      <span
                        className={`area-tag area-tag--${task.area} inline-block px-3 py-1.5 rounded-full text-xs font-semibold`}
                        style={{
                          backgroundColor: `${AREA_COLORS[task.area]}20`,
                          color: AREA_COLORS[task.area],
                          border: `1px solid ${AREA_COLORS[task.area]}40`,
                        }}
                      >
                        {AREA_LABELS[task.area]}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="px-6 py-4">
                      {renderAssigneeAvatar(task.assignee)}
                    </td>

                    {/* Sprint */}
                    <td className="px-6 py-4">
                      {task.week ? (
                        <span
                          style={{
                            backgroundColor: '#F0F3FF',
                            color: '#3B82F6',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: '1px solid #BFDBFE',
                          }}
                        >
                          S{task.week}
                        </span>
                      ) : (
                        <span style={{ color: '#9699A6' }}>—</span>
                      )}
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
