import { useState } from 'react'
import { Search, Plus, ChevronRight, ListFilter, X } from 'lucide-react'
import { useTasks, useUpdateTask, useUpdateTaskStatus } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useCampaigns } from '../hooks/useCampaigns'
import { useOutletContext } from 'react-router-dom'
import type { Task, Area, Priority, TaskStatus, TaskFilters, Etapa } from '../types'
import {
  AREA_LABELS, AREA_COLORS, STATUS_LABELS, STATUS_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS, ETAPA_LABELS, ETAPA_COLORS, ETAPA_ORDER,
  CAMPAIGN_TYPE_COLORS,
} from '../lib/constants'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#F0F2F8',
  surface: '#FFFFFF',
  border: '#E4E7F0',
  borderLight: '#ECEDF2',
  text: '#1A1D27',
  sub: '#5A5E72',
  muted: '#9699B0',
  accent: '#6366F1',
}

const PRIORITY_CYCLE: Priority[] = ['baja', 'media', 'alta']
const STATUS_CYCLE: TaskStatus[] = ['pendiente', 'en_progreso', 'revision', 'completado']
const TEAM_MEMBERS = ['Alejandro', 'Alec', 'Paula', 'Jose Luis', 'Editor 1', 'Editor 2', 'Editor 3']

const ASSIGNEE_COLORS: Record<string, string> = {
  Alejandro: '#8b5cf6', Alec: '#f59e0b', Paula: '#ec4899',
  'Jose Luis': '#3b82f6', 'Editor 1': '#06b6d4', 'Editor 2': '#10b981', 'Editor 3': '#f97316',
}

type GroupByOption = 'none' | 'campaign' | 'client' | 'status' | 'assignee' | 'priority' | 'area'

// ─── Pill badge ───────────────────────────────────────────────────────────────
function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 600,
      color, backgroundColor: `${color}18`,
      border: `1px solid ${color}30`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

export function BacklogPage() {
  const { data: clients = [] } = useClients()
  const { data: campaigns = [] } = useCampaigns()
  const updateTask = useUpdateTask()
  const updateStatus = useUpdateTaskStatus()
  const ctx = useOutletContext<{ openNewTask?: () => void; openTaskDetail?: (t: Task) => void }>()

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<TaskFilters>({})
  const [groupBy, setGroupBy] = useState<GroupByOption>('campaign')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const { data: tasks = [], isLoading } = useTasks(filters)

  const filteredTasks = search
    ? tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : tasks

  const activeFilterCount = Object.values(filters).filter(Boolean).length + (search ? 1 : 0)

  const setFilter = (key: keyof TaskFilters, value: string | number | undefined) => {
    setFilters(f => ({ ...f, [key]: value || undefined }))
  }

  const clearFilters = () => { setFilters({}); setSearch('') }

  // ─── Grouping ─────────────────────────────────────────────────────────────
  const getGroupKey = (task: Task): string => {
    switch (groupBy) {
      case 'campaign': return task.campaign_id || 'unassigned'
      case 'status': return task.status
      case 'client': return task.client_id || 'unassigned'
      case 'assignee': return task.assignee || 'unassigned'
      case 'priority': return task.priority
      case 'area': return task.area
      default: return 'all'
    }
  }

  const grouped = groupBy === 'none'
    ? [{ key: 'all', label: '', tasks: filteredTasks, color: C.accent }]
    : Object.entries(
        filteredTasks.reduce((acc, task) => {
          const key = getGroupKey(task)
          if (!acc[key]) acc[key] = []
          acc[key].push(task)
          return acc
        }, {} as Record<string, Task[]>)
      ).map(([key, tasks]) => {
        let label = key
        let color = '#9699B0'
        if (groupBy === 'campaign') {
          const cam = campaigns.find(c => c.id === key)
          const client = cam ? clients.find(cl => cl.id === cam.client_id) : null
          label = cam ? `${client?.name ?? ''} — ${cam.name}` : 'Sin campaña'
          color = cam ? (CAMPAIGN_TYPE_COLORS[cam.type as keyof typeof CAMPAIGN_TYPE_COLORS] ?? C.accent) : '#9699B0'
        } else if (groupBy === 'status') {
          label = STATUS_LABELS[key as TaskStatus] ?? key
          color = STATUS_COLORS[key as TaskStatus] ?? '#9699B0'
        } else if (groupBy === 'client') {
          const client = clients.find(c => c.id === key)
          label = client?.name ?? 'Sin cliente'
          color = client?.color ?? '#9699B0'
        } else if (groupBy === 'assignee') {
          label = key === 'unassigned' ? 'Sin asignar' : key
          color = ASSIGNEE_COLORS[key] ?? '#9699B0'
        } else if (groupBy === 'priority') {
          label = PRIORITY_LABELS[key as Priority] ?? key
          color = PRIORITY_COLORS[key as Priority] ?? '#9699B0'
        } else if (groupBy === 'area') {
          label = AREA_LABELS[key as Area] ?? key
          color = AREA_COLORS[key as Area] ?? '#9699B0'
        }
        return { key, label, tasks, color }
      })

  const cycleStatus = (task: Task) => {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(task.status) + 1) % STATUS_CYCLE.length]
    updateStatus.mutate({ id: task.id, status: next })
  }
  const cyclePriority = (task: Task) => {
    const next = PRIORITY_CYCLE[(PRIORITY_CYCLE.indexOf(task.priority) + 1) % PRIORITY_CYCLE.length]
    updateTask.mutate({ id: task.id, priority: next })
  }
  const toggleGroup = (key: string) => {
    const next = new Set(collapsedGroups)
    next.has(key) ? next.delete(key) : next.add(key)
    setCollapsedGroups(next)
  }

  // ─── Render helpers ───────────────────────────────────────────────────────
  const renderClient = (clientId?: string) => {
    const client = clients.find(c => c.id === clientId)
    if (!client) return <span style={{ color: C.muted }}>—</span>
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: client.color, flexShrink: 0 }} />
        <span style={{ color: C.text, fontSize: 12, fontWeight: 500 }}>{client.name}</span>
      </div>
    )
  }

  const renderCampaign = (campaign?: Task['campaign']) => {
    if (!campaign) return <span style={{ color: C.muted }}>—</span>
    const color = CAMPAIGN_TYPE_COLORS[campaign.type as keyof typeof CAMPAIGN_TYPE_COLORS] ?? '#9699B0'
    return <Pill label={campaign.name} color={color} />
  }

  const renderAssignee = (assignee?: string) => {
    if (!assignee) return <span style={{ color: C.muted }}>—</span>
    const color = ASSIGNEE_COLORS[assignee] ?? '#9699B0'
    const initials = assignee.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          backgroundColor: color, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, flexShrink: 0,
        }}>{initials}</div>
        <span style={{ color: C.sub, fontSize: 12 }}>{assignee}</span>
      </div>
    )
  }

  // ─── Filter select helper ─────────────────────────────────────────────────
  const FilterSelect = ({ value, onChange, placeholder, children }: {
    value: string; onChange: (v: string) => void; placeholder: string; children: React.ReactNode
  }) => {
    const active = !!value
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: active ? 600 : 400,
          border: `1px solid ${active ? C.accent : C.border}`,
          backgroundColor: active ? '#EEF2FF' : C.surface,
          color: active ? C.accent : C.sub,
          outline: 'none', cursor: 'pointer', appearance: 'auto',
        }}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
    )
  }

  // ─── Flat items for rendering ─────────────────────────────────────────────
  const flatItems = grouped.flatMap(({ key, label, tasks: groupTasks, color }) => [
    ...(groupBy !== 'none' ? [{ isHeader: true as const, key: `header-${key}`, label, groupKey: key, color, count: groupTasks.length }] : []),
    ...groupTasks
      .filter(() => groupBy === 'none' || !collapsedGroups.has(key))
      .map(task => ({ isHeader: false as const, key: task.id, task })),
  ])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: C.bg }}>

      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: '16px 24px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: '-0.3px' }}>
              Backlog
            </h1>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {filteredTasks.length} {filteredTasks.length === 1 ? 'tarea' : 'tareas'}
              {activeFilterCount > 0 && ` · ${activeFilterCount} filtro${activeFilterCount > 1 ? 's' : ''} activo${activeFilterCount > 1 ? 's' : ''}`}
            </p>
          </div>
          {ctx?.openNewTask && (
            <button
              onClick={ctx.openNewTask}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 10,
                backgroundColor: C.accent, color: '#fff',
                border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#4F46E5')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.accent)}
            >
              <Plus size={15} strokeWidth={2.5} />
              Nueva tarea
            </button>
          )}
        </div>

        {/* ── Filter Bar ───────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar tareas..."
              style={{
                paddingLeft: 30, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
                borderRadius: 8, fontSize: 12, outline: 'none',
                border: `1px solid ${search ? C.accent : C.border}`,
                backgroundColor: search ? '#EEF2FF' : C.bg,
                color: C.text, width: 180,
              }}
            />
          </div>

          <div style={{ width: 1, height: 20, backgroundColor: C.border }} />

          <FilterSelect value={filters.client_id || ''} onChange={v => setFilter('client_id', v)} placeholder="Cliente">
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </FilterSelect>

          <FilterSelect value={filters.area || ''} onChange={v => setFilter('area', v)} placeholder="Área">
            {(['copy', 'trafico', 'tech', 'admin'] as Area[]).map(a => (
              <option key={a} value={a}>{AREA_LABELS[a]}</option>
            ))}
          </FilterSelect>

          <FilterSelect value={filters.assignee || ''} onChange={v => setFilter('assignee', v)} placeholder="Asignado">
            {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
          </FilterSelect>

          <FilterSelect value={filters.status || ''} onChange={v => setFilter('status', v)} placeholder="Estado">
            {(['pendiente', 'en_progreso', 'revision', 'completado'] as TaskStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </FilterSelect>

          <FilterSelect value={filters.priority || ''} onChange={v => setFilter('priority', v)} placeholder="Prioridad">
            {(['baja', 'media', 'alta'] as Priority[]).map(p => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </FilterSelect>

          <FilterSelect value={filters.etapa || ''} onChange={v => setFilter('etapa', v)} placeholder="Etapa">
            {ETAPA_ORDER.map(e => <option key={e} value={e}>{ETAPA_LABELS[e]}</option>)}
          </FilterSelect>

          <div style={{ width: 1, height: 20, backgroundColor: C.border }} />

          {/* Group by */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ListFilter size={13} style={{ color: C.muted }} />
            <FilterSelect value={groupBy} onChange={v => setGroupBy(v as GroupByOption)} placeholder="">
              <option value="none">Sin agrupar</option>
              <option value="campaign">Campaña</option>
              <option value="client">Cliente</option>
              <option value="status">Estado</option>
              <option value="assignee">Asignado</option>
              <option value="priority">Prioridad</option>
              <option value="area">Área</option>
            </FilterSelect>
          </div>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 10px', borderRadius: 8,
                backgroundColor: '#FEF2F2', color: '#DC2626',
                border: '1px solid #FCA5A5', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <X size={12} />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '3px solid #DBEAFE', borderTopColor: C.accent,
              animation: 'spin 0.8s linear infinite', margin: '0 auto 10px',
            }} />
            <p style={{ color: C.sub, fontSize: 13 }}>Cargando tareas...</p>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: C.sub, fontSize: 14, fontWeight: 600 }}>No hay tareas</p>
            <p style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>Ajusta los filtros o crea una nueva tarea</p>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            {/* ── Table Header ──────────────────────────────────────────────── */}
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}>
              <tr>
                {[
                  { label: 'TAREA', width: 300 },
                  { label: 'CLIENTE', width: 120 },
                  { label: 'CAMPAÑA', width: 190 },
                  { label: 'ESTADO', width: 120 },
                  { label: 'PRIORIDAD', width: 100 },
                  { label: 'ÁREA', width: 100 },
                  { label: 'ASIGNADO', width: 140 },
                  { label: 'ETAPA', width: 100 },
                  { label: 'FECHA', width: 90 },
                  { label: 'SPRINT', width: 70 },
                ].map(col => (
                  <th
                    key={col.label}
                    style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                      color: C.muted, width: col.width, whiteSpace: 'nowrap',
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* ── Table Body ────────────────────────────────────────────────── */}
            <tbody>
              {flatItems.map(item => {
                if (item.isHeader) {
                  const isCollapsed = collapsedGroups.has(item.groupKey)
                  return (
                    <tr key={item.key} style={{ backgroundColor: `${item.color}08` }}>
                      <td colSpan={10} style={{ padding: '0' }}>
                        <button
                          onClick={() => toggleGroup(item.groupKey)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%', padding: '9px 16px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            borderLeft: `3px solid ${item.color}`,
                            borderBottom: `1px solid ${item.color}20`,
                          }}
                        >
                          <ChevronRight
                            size={14}
                            style={{
                              color: item.color,
                              transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                              transition: 'transform 0.15s',
                            }}
                          />
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                            {item.label}
                          </span>
                          <span style={{
                            marginLeft: 4, fontSize: 11, fontWeight: 600,
                            color: item.color, backgroundColor: `${item.color}18`,
                            padding: '1px 8px', borderRadius: 12,
                            border: `1px solid ${item.color}30`,
                          }}>
                            {item.count}
                          </span>
                        </button>
                      </td>
                    </tr>
                  )
                }

                const task = item.task
                return (
                  <tr
                    key={item.key}
                    onClick={() => ctx?.openTaskDetail?.(task)}
                    style={{
                      backgroundColor: C.surface,
                      borderBottom: `1px solid ${C.borderLight}`,
                      cursor: 'pointer',
                      transition: 'background-color 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F6FF')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.surface)}
                  >
                    {/* Tarea */}
                    <td style={{ padding: '10px 16px', maxWidth: 300 }}>
                      <span style={{
                        color: C.text, fontSize: 13, fontWeight: 500,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {task.title}
                      </span>
                    </td>

                    {/* Cliente */}
                    <td style={{ padding: '10px 16px' }}>
                      {renderClient(task.client_id)}
                    </td>

                    {/* Campaña */}
                    <td style={{ padding: '10px 16px', maxWidth: 190 }}>
                      {renderCampaign(task.campaign)}
                    </td>

                    {/* Estado */}
                    <td style={{ padding: '10px 16px' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => cycleStatus(task)}
                        style={{
                          padding: '3px 10px', borderRadius: 20,
                          fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                          backgroundColor: `${STATUS_COLORS[task.status]}18`,
                          color: STATUS_COLORS[task.status],
                          outline: `1px solid ${STATUS_COLORS[task.status]}35`,
                        }}
                      >
                        {STATUS_LABELS[task.status]}
                      </button>
                    </td>

                    {/* Prioridad */}
                    <td style={{ padding: '10px 16px' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => cyclePriority(task)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 20,
                          fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                          backgroundColor: `${PRIORITY_COLORS[task.priority]}18`,
                          color: PRIORITY_COLORS[task.priority],
                          outline: `1px solid ${PRIORITY_COLORS[task.priority]}35`,
                        }}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: PRIORITY_COLORS[task.priority] }} />
                        {PRIORITY_LABELS[task.priority]}
                      </button>
                    </td>

                    {/* Área */}
                    <td style={{ padding: '10px 16px' }}>
                      <Pill label={AREA_LABELS[task.area]} color={AREA_COLORS[task.area]} />
                    </td>

                    {/* Asignado */}
                    <td style={{ padding: '10px 16px' }}>
                      {renderAssignee(task.assignee)}
                    </td>

                    {/* Etapa */}
                    <td style={{ padding: '10px 16px' }}>
                      {task.etapa
                        ? <Pill label={ETAPA_LABELS[task.etapa].split(' ')[0]} color={ETAPA_COLORS[task.etapa]} />
                        : <span style={{ color: C.muted }}>—</span>
                      }
                    </td>

                    {/* Fecha */}
                    <td style={{ padding: '10px 16px' }}>
                      {task.due_date ? (
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: new Date(task.due_date) < new Date() ? '#E2445C' : C.sub,
                        }}>
                          {new Date(task.due_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                        </span>
                      ) : <span style={{ color: C.muted }}>—</span>}
                    </td>

                    {/* Sprint */}
                    <td style={{ padding: '10px 16px' }}>
                      {task.week ? (
                        <span style={{
                          padding: '3px 8px', borderRadius: 8,
                          fontSize: 11, fontWeight: 700,
                          backgroundColor: '#EEF2FF', color: C.accent,
                          border: `1px solid ${C.accent}30`,
                        }}>
                          S{task.week}
                        </span>
                      ) : <span style={{ color: C.muted }}>—</span>}
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
