import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import type { Task } from '../types'
import { AREA_COLORS, AREA_LABELS, STATUS_COLORS, STATUS_LABELS } from '../lib/constants'
import { X } from 'lucide-react'

const WEEKS = [1, 2, 3, 4]

const SPRINT_META: Record<number, { label: string; sub: string; color: string }> = {
  1: { label: 'Sprint 1', sub: 'Copy & Briefs',      color: '#8b5cf6' },
  2: { label: 'Sprint 2', sub: 'Producción & Diseño', color: '#ec4899' },
  3: { label: 'Sprint 3', sub: 'Dev & Setup',         color: '#3b82f6' },
  4: { label: 'Sprint 4', sub: 'Launch & Optim.',     color: '#22c55e' },
}

const MAX_VISIBLE = 5
const AREA_LIST   = ['copy', 'trafico', 'tech', 'admin'] as const
const ASSIGNEES   = ['Alejandro', 'Alec', 'Paula', 'Jose Luis', 'Editor 1', 'Editor 2', 'Editor 3']

// ── Task Pill ─────────────────────────────────────────────────────
function TaskPill({ task }: { task: Task }) {
  const areaColor   = AREA_COLORS[task.area]
  const statusColor = STATUS_COLORS[task.status]
  const isDone      = task.status === 'completado'

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
      style={{
        backgroundColor: isDone ? 'rgba(255,255,255,0.02)' : `${areaColor}10`,
        borderLeft: `2px solid ${isDone ? '#2d3050' : statusColor}`,
        border: `1px solid ${isDone ? 'rgba(255,255,255,0.05)' : `${areaColor}22`}`,
        borderLeftWidth: 2,
        borderLeftColor: isDone ? '#2d3050' : statusColor,
      }}
      title={`${task.title} · ${task.assignee} · ${STATUS_LABELS[task.status]}`}
    >
      <div
        className="w-1 h-1 rounded-full shrink-0"
        style={{ backgroundColor: isDone ? '#3d4268' : areaColor }}
      />
      <span
        className="text-[10px] truncate font-medium leading-tight"
        style={{
          color: isDone ? '#3d4268' : '#c8cbec',
          textDecoration: isDone ? 'line-through' : 'none',
          maxWidth: '100%',
        }}
      >
        {task.title}
      </span>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export function TimelinePage() {
  const { data: clients = [], isLoading: clientsLoading } = useClients()
  const { data: allTasks = [], isLoading: tasksLoading }   = useTasks()
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set())
  const [areaFilter,     setAreaFilter]     = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [clientFilter,   setClientFilter]   = useState('')

  const tasks = allTasks
    .filter(t => !areaFilter     || t.area       === areaFilter)
    .filter(t => !assigneeFilter || t.assignee   === assigneeFilter)
    .filter(t => !clientFilter   || t.client_id  === clientFilter)

  const hasFilters = !!(areaFilter || assigneeFilter || clientFilter)
  const isLoading  = clientsLoading || tasksLoading

  const getTasksForCell = (clientId: string, week: number) =>
    tasks.filter(t => t.client_id === clientId && t.week === week)

  const toggleCell = (key: string) =>
    setExpandedCells(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  const activeClients = clients.filter(c =>
    (!clientFilter || c.id === clientFilter) &&
    tasks.some(t => t.client_id === c.id)
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#f5a623', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0c0e1a' }}>

      {/* ── Filter toolbar ──────────────────────────────────────── */}
      <div className="filter-toolbar">

        {/* Sprint summary pills */}
        {WEEKS.map(w => {
          const wt   = allTasks.filter(t => t.week === w)
          const done = wt.filter(t => t.status === 'completado').length
          const meta = SPRINT_META[w]
          return (
            <div
              key={w}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ backgroundColor: `${meta.color}10`, border: `1px solid ${meta.color}22` }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
              <span className="text-[10px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
              <span className="text-[10px]" style={{ color: '#6b7099' }}>{done}/{wt.length}</span>
            </div>
          )
        })}

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

        {/* Cliente */}
        <select
          className={`filter-select ${clientFilter ? 'has-value' : ''}`}
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
        >
          <option value="">Todos los clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {hasFilters && (
          <button
            className="filter-clear"
            onClick={() => { setAreaFilter(''); setAssigneeFilter(''); setClientFilter('') }}
          >
            <X size={10} strokeWidth={3} />
            Limpiar
          </button>
        )}
        <span className="filter-count">{tasks.length} tareas</span>
      </div>

      {/* ── Grid ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[900px]">

          {/* Column headers */}
          <div
            className="grid sticky top-0 z-10"
            style={{
              gridTemplateColumns: '168px repeat(4, 1fr)',
              backgroundColor: '#0c0e1a',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="px-4 py-3 flex items-end" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#3d4268' }}>
                Cliente
              </span>
            </div>
            {WEEKS.map(w => {
              const meta      = SPRINT_META[w]
              const weekTotal = tasks.filter(t => t.week === w).length
              return (
                <div key={w} className="px-4 py-3" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
                    <span className="text-[12px] font-bold" style={{ color: '#f0f2ff' }}>{meta.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px]" style={{ color: '#6b7099' }}>{meta.sub}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: `${meta.color}18`, color: meta.color }}>
                      {weekTotal}
                    </span>
                  </div>
                  <div className="mt-2 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, ${meta.color}, transparent)` }} />
                </div>
              )
            })}
          </div>

          {/* Client rows */}
          {activeClients.map(client => (
            <div
              key={client.id}
              className="grid"
              style={{
                gridTemplateColumns: '168px repeat(4, 1fr)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {/* Client label */}
              <div
                className="px-4 py-3 sticky left-0"
                style={{
                  borderRight: '1px solid rgba(255,255,255,0.05)',
                  backgroundColor: '#0c0e1a',
                  borderTop: `2px solid ${client.color}`,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: client.color, boxShadow: `0 0 6px ${client.color}` }} />
                  <span className="text-[12px] font-bold" style={{ color: '#f0f2ff' }}>{client.name}</span>
                </div>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {WEEKS.map(w => {
                    const n = getTasksForCell(client.id, w).length
                    if (n === 0) return null
                    return (
                      <span key={w} className="text-[9px] font-bold" style={{ color: SPRINT_META[w].color }}>
                        S{w}:{n}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* Week cells */}
              {WEEKS.map(week => {
                const cellKey      = `${client.id}-${week}`
                const cellTasks    = getTasksForCell(client.id, week)
                const isExpanded   = expandedCells.has(cellKey)
                const visibleTasks = isExpanded ? cellTasks : cellTasks.slice(0, MAX_VISIBLE)
                const hiddenCount  = cellTasks.length - MAX_VISIBLE
                const meta         = SPRINT_META[week]
                const doneCount    = cellTasks.filter(t => t.status === 'completado').length

                return (
                  <div
                    key={week}
                    className="px-2 py-2"
                    style={{
                      borderRight: '1px solid rgba(255,255,255,0.05)',
                      borderTop: `2px solid ${cellTasks.length > 0 ? `${meta.color}35` : 'transparent'}`,
                      minHeight: 60,
                    }}
                  >
                    {cellTasks.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between mb-1.5 px-0.5">
                          <span className="text-[9px] font-bold" style={{ color: meta.color }}>
                            {cellTasks.length} tareas
                          </span>
                          {doneCount > 0 && (
                            <span className="text-[9px] font-medium" style={{ color: '#22c55e' }}>
                              ✓{doneCount}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          {visibleTasks.map(task => <TaskPill key={task.id} task={task} />)}
                        </div>

                        {hiddenCount > 0 && !isExpanded && (
                          <button
                            onClick={() => toggleCell(cellKey)}
                            className="mt-1.5 w-full text-center text-[9px] font-bold py-1 rounded-md"
                            style={{ color: meta.color, backgroundColor: `${meta.color}08`, border: `1px solid ${meta.color}22` }}
                          >
                            +{hiddenCount} más
                          </button>
                        )}
                        {isExpanded && cellTasks.length > MAX_VISIBLE && (
                          <button
                            onClick={() => toggleCell(cellKey)}
                            className="mt-1.5 w-full text-center text-[9px] font-bold py-1 rounded-md"
                            style={{ color: '#6b7099', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                          >
                            colapsar
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-10">
                        <span className="text-[10px]" style={{ color: '#1e2240' }}>—</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
