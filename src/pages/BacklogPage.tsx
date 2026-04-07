import { useState } from 'react'
import {
  Search, ChevronDown, Plus, ExternalLink,
  Anchor, Video, PenTool, Target, FileDown, Film, Globe,
  ThumbsUp, LayoutGrid, Type, HelpCircle, BarChart3, RefreshCw,
} from 'lucide-react'
import { useTasks, useUpdateTaskStatus } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import type { Area, Priority, Task, TaskFilters } from '../types'
import { AREA_LABELS, PRIORITY_COLORS, PRIORITY_LABELS } from '../lib/constants'
import { ClientBadge } from '../components/ui/ClientBadge'
import { AreaBadge } from '../components/ui/AreaBadge'
import { AssigneeAvatar } from '../components/ui/AssigneeAvatar'
import { PriorityDot } from '../components/ui/PriorityDot'
import { StatusSelect } from '../components/ui/StatusSelect'
import { useOutletContext } from 'react-router-dom'
import { getSprintDateRange } from '../lib/dates'

const ASSIGNEES = ['Alejandro', 'Alec', 'Paula', 'Jose Luis', 'Editor 1', 'Editor 2', 'Editor 3']

const SPRINT_META: Record<number, { label: string; sub: string; color: string }> = {
  1: { label: 'Sprint 1', sub: 'Copy & Briefs',      color: '#8b5cf6' },
  2: { label: 'Sprint 2', sub: 'Producción & Diseño', color: '#ec4899' },
  3: { label: 'Sprint 3', sub: 'Dev & Setup',          color: '#3b82f6' },
  4: { label: 'Sprint 4', sub: 'Launch & Optim.',      color: '#22c55e' },
}
// backward compat alias
const SPRINT_LABELS = Object.fromEntries(
  Object.entries(SPRINT_META).map(([k, v]) => [k, { label: `${v.label} — ${v.sub}`, color: v.color }])
)

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-2.5 pr-6 py-1.5 rounded-lg text-xs outline-none cursor-pointer font-medium"
        style={{
          backgroundColor: value ? 'rgba(245,166,35,0.1)' : '#1c1c1c',
          border: `1px solid ${value ? 'rgba(245,166,35,0.3)' : 'rgba(255,255,255,0.07)'}`,
          color: value ? '#f5a623' : '#6b6b6b',
        }}
      >
        <option value="">{label}</option>
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ backgroundColor: '#1c1c1c', color: '#f5f5f5' }}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#a1a1a1' }} />
    </div>
  )
}

export function BacklogPage() {
  const { data: clients = [] } = useClients()
  const [filters, setFilters] = useState<TaskFilters>({})
  const { data: tasks = [], isLoading } = useTasks(filters)
  const updateStatus = useUpdateTaskStatus()
  const [search, setSearch] = useState('')
  const [groupBySprint, setGroupBySprint] = useState(true)
  const [showSprintGuide, setShowSprintGuide] = useState(false)
  const ctx = useOutletContext<{ openNewTask?: () => void; openTaskDetail?: (t: Task) => void }>()

  const filteredTasks = search
    ? tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    : tasks

  const setFilter = (key: keyof TaskFilters, value: string) => {
    setFilters(f => ({ ...f, [key]: value || undefined }))
  }

  const clearFilters = () => {
    setFilters({})
    setSearch('')
  }

  const hasFilters = Object.values(filters).some(Boolean) || search

  // Group by sprint week
  const grouped = groupBySprint
    ? [1, 2, 3, 4].map(week => ({
        week,
        tasks: filteredTasks.filter(t => t.week === week),
      })).filter(g => g.tasks.length > 0)
    : [{ week: 0, tasks: filteredTasks }]

  const getDeliverableChips = (task: (typeof filteredTasks)[0]) => {
    const d = task.deliverables
    if (!d) return []
    const chips: { label: string; count: number; color: string; Icon: React.ElementType }[] = []
    if (d.hooks)              chips.push({ label: 'hooks',    count: d.hooks,              color: '#8b5cf6', Icon: Anchor })
    if (d.scripts_video)      chips.push({ label: 'scripts',  count: d.scripts_video,      color: '#ec4899', Icon: Video })
    if (d.body_copy)          chips.push({ label: 'body',     count: d.body_copy,           color: '#3b82f6', Icon: PenTool })
    if (d.cta)                chips.push({ label: 'CTA',      count: d.cta,                 color: '#f5a623', Icon: Target })
    if (d.lead_magnet_pdf)    chips.push({ label: 'LM',       count: d.lead_magnet_pdf,     color: '#22c55e', Icon: FileDown })
    if (d.vsl_script)         chips.push({ label: 'VSL',      count: d.vsl_script,          color: '#06b6d4', Icon: Film })
    if (d.landing_copy)       chips.push({ label: 'landing',  count: d.landing_copy,        color: '#f97316', Icon: Globe })
    if (d.thank_you_page_copy)chips.push({ label: 'TYP',      count: d.thank_you_page_copy, color: '#fbbf24', Icon: ThumbsUp })
    if (d.carousel_slides)    chips.push({ label: 'slides',   count: d.carousel_slides,     color: '#a78bfa', Icon: LayoutGrid })
    if (d.quiz_preguntas)     chips.push({ label: 'quiz-Q',   count: d.quiz_preguntas,      color: '#818cf8', Icon: HelpCircle })
    if (d.quiz_resultados)    chips.push({ label: 'quiz-R',   count: d.quiz_resultados,     color: '#6ee7b7', Icon: BarChart3 })
    if (d.headline_options)   chips.push({ label: 'hdl',      count: d.headline_options,    color: '#f472b6', Icon: Type })
    if (d.retargeting_scripts)chips.push({ label: 'retarg',   count: d.retargeting_scripts, color: '#34d399', Icon: RefreshCw })
    return chips
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0f0f0f' }}>
      {/* Filters bar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 flex-wrap shrink-0"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: 'rgba(15,15,15,0.9)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#6b6b6b' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tareas..."
            className="pl-7 pr-3 py-1.5 rounded-lg text-xs outline-none w-48 font-medium placeholder:font-normal"
            style={{
              backgroundColor: '#1c1c1c',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#f5f5f5',
            }}
          />
        </div>

        <FilterSelect
          label="Cliente"
          value={filters.client_id || ''}
          onChange={v => setFilter('client_id', v)}
          options={clients.map(c => ({ value: c.id, label: c.name }))}
        />
        <FilterSelect
          label="Área"
          value={filters.area || ''}
          onChange={v => setFilter('area', v)}
          options={(['copy', 'trafico', 'tech', 'admin'] as Area[]).map(a => ({ value: a, label: AREA_LABELS[a] }))}
        />
        <FilterSelect
          label="Semana"
          value={filters.week?.toString() || ''}
          onChange={v => setFilter('week', v)}
          options={[1, 2, 3, 4].map(w => ({ value: w.toString(), label: `Sprint ${w}` }))}
        />
        <FilterSelect
          label="Responsable"
          value={filters.assignee || ''}
          onChange={v => setFilter('assignee', v)}
          options={ASSIGNEES.map(a => ({ value: a, label: a }))}
        />
        <FilterSelect
          label="Status"
          value={filters.status || ''}
          onChange={v => setFilter('status', v)}
          options={[
            { value: 'pendiente', label: 'Pendiente' },
            { value: 'en_progreso', label: 'En Progreso' },
            { value: 'revision', label: 'En Revisión' },
            { value: 'completado', label: 'Completado' },
          ]}
        />
        <FilterSelect
          label="Prioridad"
          value={filters.priority || ''}
          onChange={v => setFilter('priority', v)}
          options={(['alta', 'media', 'baja'] as Priority[]).map(p => ({ value: p, label: PRIORITY_LABELS[p] }))}
        />

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
            style={{ color: '#f5a623', backgroundColor: 'rgba(245,166,35,0.08)' }}
          >
            Limpiar
          </button>
        )}

        {/* Group toggle */}
        <button
          onClick={() => setGroupBySprint(g => !g)}
          className="text-xs px-2.5 py-1.5 rounded-lg font-medium ml-1"
          style={{
            color: groupBySprint ? '#f5f5f5' : '#6b6b6b',
            backgroundColor: groupBySprint ? 'rgba(255,255,255,0.06)' : 'transparent',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {groupBySprint ? '⊞ Por sprint' : '≡ Lista plana'}
        </button>

        {/* Sprint guide toggle */}
        <button
          onClick={() => setShowSprintGuide(s => !s)}
          className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
          style={{
            color: showSprintGuide ? '#f5a623' : '#6b6b6b',
            backgroundColor: showSprintGuide ? 'rgba(245,166,35,0.08)' : 'transparent',
            border: `1px solid ${showSprintGuide ? 'rgba(245,166,35,0.25)' : 'rgba(255,255,255,0.06)'}`,
          }}
          title="Ver guía de sprints"
        >
          ? Sprints
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: '#6b6b6b' }}>
            {filteredTasks.length} tareas
          </span>
          {ctx?.openNewTask && (
            <button
              onClick={ctx.openNewTask}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold"
              style={{
                background: 'linear-gradient(135deg, #f5a623, #ff7c1a)',
                color: '#0f0f0f',
              }}
            >
              <Plus size={11} strokeWidth={2.5} />
              Nueva
            </button>
          )}
        </div>
      </div>

      {/* Sprint Guide Panel */}
      {showSprintGuide && (
        <div
          className="shrink-0 px-4 py-3"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'linear-gradient(135deg, rgba(245,166,35,0.04) 0%, rgba(15,15,15,0) 60%)',
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: '#f5a623' }}>
            Guía de Sprints — Flujo de trabajo Beezion
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              {
                n: 1, color: '#8b5cf6',
                label: 'Sprint 1 — Copy & Briefs',
                desc: 'Semana 1: Alejandro escribe hooks, scripts, briefs creativos y todos los textos de cada pieza.',
                who: 'Alejandro',
              },
              {
                n: 2, color: '#ec4899',
                label: 'Sprint 2 — Producción & Diseño',
                desc: 'Semana 2: Paula graba videos, crea portadas y diseños para lead magnets, edita piezas y apoya con seguimiento a clientes y gestiones admin. Jose Luis diseña PDFs, thumbnails y landings.',
                who: 'Paula · Jose Luis',
              },
              {
                n: 3, color: '#3b82f6',
                label: 'Sprint 3 — Dev & Setup',
                desc: 'Semana 3: Alec desarrolla landings, integra CRMs, configura automatizaciones y tracking.',
                who: 'Alec',
              },
              {
                n: 4, color: '#4ade80',
                label: 'Sprint 4 — Launch & Optim.',
                desc: 'Semana 4: Alec lanza campañas, revisa métricas de la primera semana y optimiza.',
                who: 'Alec',
              },
            ].map(({ n, color, label, desc, who }) => (
              <div
                key={n}
                className="rounded-lg p-3"
                style={{
                  backgroundColor: `${color}08`,
                  border: `1px solid ${color}20`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-bold" style={{ color }}>{label}</span>
                </div>
                <p className="text-[10px] leading-relaxed mb-1.5" style={{ color: '#a1a1a1' }}>{desc}</p>
                <p className="text-[9px] font-semibold" style={{ color: '#6b6b6b' }}>{who}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#f5a623', borderTopColor: 'transparent' }}
          />
        </div>
      ) : (
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="sticky top-0 z-10" style={{ backgroundColor: '#0f0f0f' }}>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider w-8"
                  style={{ color: '#585858', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  #
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#585858', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  Cliente
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#585858', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  Tarea
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#585858', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  Área
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#585858', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  Responsable
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#585858', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  Entregables
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#585858', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  Prior.
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#585858', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(({ week, tasks: groupTasks }) => (
                <>
                  {groupBySprint && week > 0 && (() => {
                    const meta = SPRINT_META[week]
                    const dates = getSprintDateRange(week)
                    return (
                      <tr key={`header-${week}`}>
                        <td
                          colSpan={8}
                          className="px-4 py-2 sticky"
                          style={{ backgroundColor: '#0f0f0f', top: 37, zIndex: 5 }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${meta.color}, transparent)` }} />
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                                style={{ color: meta.color, backgroundColor: `${meta.color}15`, border: `1px solid ${meta.color}30` }}
                              >
                                {meta.label} · {meta.sub}
                              </span>
                              <span className="text-[10px] font-medium" style={{ color: '#6b6b6b' }}>
                                {dates.label}
                              </span>
                              <span className="text-[10px] font-bold tabular-nums" style={{ color: '#585858' }}>
                                {groupTasks.length} tareas
                              </span>
                            </div>
                            <div className="h-px flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
                          </div>
                        </td>
                      </tr>
                    )
                  })()}
                  {groupTasks.map((task, idx) => {
                    const deliverableChips = getDeliverableChips(task)
                    const clientColor = task.client?.color || '#6b7280'

                    return (
                      <tr
                        key={task.id}
                        className="group cursor-pointer"
                        onClick={() => ctx?.openTaskDetail?.(task)}
                        style={{
                          borderLeft: task.tipo === 'urgente'
                            ? '2px solid #ef4444'
                            : task.tipo === 'pendiente_anterior'
                            ? '2px solid #f97316'
                            : `2px solid ${clientColor}40`,
                        }}
                      >
                        <td
                          className="px-4 py-2 text-[10px] tabular-nums"
                          style={{ color: '#585858', borderBottom: '1px solid rgba(255,255,255,0.025)' }}
                        >
                          {idx + 1}
                        </td>
                        <td
                          className="px-3 py-2"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}
                        >
                          <ClientBadge client={task.client} size="xs" />
                        </td>
                        <td
                          className="px-3 py-2 max-w-xs"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}
                        >
                          <div>
                            <p
                              className="text-xs font-medium truncate group-hover:text-white transition-colors"
                              style={{ color: '#d0d0d0' }}
                              title={task.title}
                            >
                              {task.tipo === 'urgente' && (
                                <span className="text-[9px] font-bold mr-1.5 px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>
                                  URGENTE
                                </span>
                              )}
                              {task.tipo === 'pendiente_anterior' && (
                                <span className="text-[9px] font-bold mr-1.5 px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(249,115,22,0.2)', color: '#f97316' }}>
                                  PREV
                                </span>
                              )}
                              {task.title}
                            </p>
                            {task.problema && (
                              <p className="text-[10px] mt-0.5 truncate" style={{ color: '#585858' }}>
                                {task.problema}
                              </p>
                            )}
                          </div>
                        </td>
                        <td
                          className="px-3 py-2"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}
                        >
                          <AreaBadge area={task.area} size="xs" />
                        </td>
                        <td
                          className="px-3 py-2"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}
                        >
                          <div className="flex items-center gap-1.5">
                            <AssigneeAvatar name={task.assignee} />
                            <span className="text-[11px] font-medium" style={{ color: '#a1a1a1' }}>
                              {task.assignee}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-3 py-2"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}
                        >
                          <div className="flex flex-wrap gap-1">
                            {deliverableChips.length > 0 ? (
                              deliverableChips.map(({ label, count, color, Icon }, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap"
                                  style={{
                                    backgroundColor: `${color}15`,
                                    color,
                                    border: `1px solid ${color}30`,
                                  }}
                                >
                                  <Icon size={8} />
                                  <span style={{ fontWeight: 900 }}>{count}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px]" style={{ color: '#262626' }}>—</span>
                            )}
                          </div>
                        </td>
                        <td
                          className="px-3 py-2"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}
                        >
                          <div className="flex items-center gap-1.5">
                            <PriorityDot priority={task.priority} />
                            <span
                              className="text-[10px] font-semibold"
                              style={{ color: PRIORITY_COLORS[task.priority] }}
                            >
                              {PRIORITY_LABELS[task.priority]}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-3 py-2"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}
                        >
                          <StatusSelect
                            status={task.status}
                            onChange={status => updateStatus.mutate({ id: task.id, status })}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </>
              ))}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-sm" style={{ color: '#585858' }}>
                    No hay tareas con los filtros seleccionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
