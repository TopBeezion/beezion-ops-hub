import { useState } from 'react'
import { Search, ChevronDown, Plus } from 'lucide-react'
import { useTasks, useUpdateTaskStatus } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import type { Area, Priority, TaskFilters } from '../types'
import { AREA_LABELS, PRIORITY_COLORS, PRIORITY_LABELS } from '../lib/constants'
import { ClientBadge } from '../components/ui/ClientBadge'
import { AreaBadge } from '../components/ui/AreaBadge'
import { AssigneeAvatar } from '../components/ui/AssigneeAvatar'
import { PriorityDot } from '../components/ui/PriorityDot'
import { StatusSelect } from '../components/ui/StatusSelect'
import { useOutletContext } from 'react-router-dom'

const ASSIGNEES = ['Alejandro', 'Alec', 'Paula', 'Jose Luis', 'Editor 1', 'Editor 2', 'Editor 3']

const SPRINT_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'S1 — Copy & Briefs', color: '#8b5cf6' },
  2: { label: 'S2 — Producción & Diseño', color: '#ec4899' },
  3: { label: 'S3 — Dev & Setup', color: '#3b82f6' },
  4: { label: 'S4 — Launch & Optimización', color: '#4ade80' },
}

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
          backgroundColor: value ? 'rgba(245,166,35,0.1)' : '#13152a',
          border: `1px solid ${value ? 'rgba(245,166,35,0.3)' : 'rgba(255,255,255,0.07)'}`,
          color: value ? '#f5a623' : '#6a6d82',
        }}
      >
        <option value="">{label}</option>
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ backgroundColor: '#13152a', color: '#f0f2ff' }}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#a0a6cc' }} />
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
  const ctx = useOutletContext<{ openNewTask?: () => void }>()

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
    const chips: string[] = []
    if (d.hooks) chips.push(`${d.hooks} hooks`)
    if (d.cta) chips.push(`${d.cta} CTA`)
    if (d.body_copy) chips.push(`${d.body_copy} body`)
    if (d.scripts_video) chips.push(`${d.scripts_video} scripts`)
    if (d.lead_magnet_pdf) chips.push(`${d.lead_magnet_pdf} PDFs`)
    if (d.vsl_script) chips.push(`${d.vsl_script} VSL`)
    if (d.thank_you_page_copy) chips.push(`${d.thank_you_page_copy} TYP`)
    if (d.carousel_slides) chips.push(`${d.carousel_slides} carousel`)
    if (d.quiz_preguntas) chips.push(`${d.quiz_preguntas} preguntas`)
    if (d.quiz_resultados) chips.push(`${d.quiz_resultados} resultados`)
    if (d.headline_options) chips.push(`${d.headline_options} headlines`)
    if (d.retargeting_scripts) chips.push(`${d.retargeting_scripts} retarget`)
    return chips
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0c0e1a' }}>
      {/* Filters bar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 flex-wrap shrink-0"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: 'rgba(12,14,26,0.9)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#6b7099' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tareas..."
            className="pl-7 pr-3 py-1.5 rounded-lg text-xs outline-none w-48 font-medium placeholder:font-normal"
            style={{
              backgroundColor: '#13152a',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#f0f2ff',
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
            color: groupBySprint ? '#f0f2ff' : '#6a6d82',
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
            color: showSprintGuide ? '#f5a623' : '#6b7099',
            backgroundColor: showSprintGuide ? 'rgba(245,166,35,0.08)' : 'transparent',
            border: `1px solid ${showSprintGuide ? 'rgba(245,166,35,0.25)' : 'rgba(255,255,255,0.06)'}`,
          }}
          title="Ver guía de sprints"
        >
          ? Sprints
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: '#6b7099' }}>
            {filteredTasks.length} tareas
          </span>
          {ctx?.openNewTask && (
            <button
              onClick={ctx.openNewTask}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold"
              style={{
                background: 'linear-gradient(135deg, #f5a623, #ff7c1a)',
                color: '#0c0e1a',
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
            background: 'linear-gradient(135deg, rgba(245,166,35,0.04) 0%, rgba(12,14,26,0) 60%)',
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
                who: '✍️ Alejandro',
              },
              {
                n: 2, color: '#ec4899',
                label: 'Sprint 2 — Producción & Diseño',
                desc: 'Semana 2: Paula graba videos, crea portadas y diseños para lead magnets, edita piezas y apoya con seguimiento a clientes y gestiones admin. Jose Luis diseña PDFs, thumbnails y landings.',
                who: '🎬 Paula · 🎨 Jose Luis',
              },
              {
                n: 3, color: '#3b82f6',
                label: 'Sprint 3 — Dev & Setup',
                desc: 'Semana 3: Alec desarrolla landings, integra CRMs, configura automatizaciones y tracking.',
                who: '⚙️ Alec',
              },
              {
                n: 4, color: '#4ade80',
                label: 'Sprint 4 — Launch & Optim.',
                desc: 'Semana 4: Alec lanza campañas, revisa métricas de la primera semana y optimiza.',
                who: '🚀 Alec',
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
                <p className="text-[10px] leading-relaxed mb-1.5" style={{ color: '#a0a6cc' }}>{desc}</p>
                <p className="text-[9px] font-semibold" style={{ color: '#6b7099' }}>{who}</p>
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
              <tr className="sticky top-0 z-10" style={{ backgroundColor: '#0c0e1a' }}>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider w-8"
                  style={{ color: '#3d4268', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  #
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#3d4268', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  Cliente
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#3d4268', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  Tarea
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#3d4268', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  Área
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#3d4268', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  Responsable
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#3d4268', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  Entregables
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#3d4268', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  Prior.
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: '#3d4268', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(({ week, tasks: groupTasks }) => (
                <>
                  {groupBySprint && week > 0 && (
                    <tr key={`header-${week}`}>
                      <td
                        colSpan={8}
                        className="px-4 py-2 sticky"
                        style={{
                          backgroundColor: '#0c0e1a',
                          top: 37,
                          zIndex: 5,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="h-px flex-1"
                            style={{
                              background: `linear-gradient(90deg, ${SPRINT_LABELS[week]?.color || '#3d4268'}, transparent)`,
                            }}
                          />
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                            style={{
                              color: SPRINT_LABELS[week]?.color || '#3d4268',
                              backgroundColor: `${SPRINT_LABELS[week]?.color || '#3d4268'}15`,
                              border: `1px solid ${SPRINT_LABELS[week]?.color || '#3d4268'}30`,
                            }}
                          >
                            {SPRINT_LABELS[week]?.label || `Sprint ${week}`}
                          </span>
                          <span
                            className="text-[10px] font-bold tabular-nums"
                            style={{ color: '#3d4268' }}
                          >
                            {groupTasks.length} tareas
                          </span>
                          <div
                            className="h-px flex-1"
                            style={{
                              background: `linear-gradient(270deg, transparent, transparent)`,
                              backgroundColor: 'rgba(255,255,255,0.04)',
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                  {groupTasks.map((task, idx) => {
                    const deliverableChips = getDeliverableChips(task)
                    const clientColor = task.client?.color || '#6b7280'

                    return (
                      <tr
                        key={task.id}
                        className="group"
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
                          style={{ color: '#3d4268', borderBottom: '1px solid rgba(255,255,255,0.025)' }}
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
                              style={{ color: '#c8cbec' }}
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
                              <p className="text-[10px] mt-0.5 truncate" style={{ color: '#3d4268' }}>
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
                            <span className="text-[11px] font-medium" style={{ color: '#a0a6cc' }}>
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
                              deliverableChips.map((chip, i) => (
                                <span
                                  key={i}
                                  className="inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap"
                                  style={{
                                    backgroundColor: 'rgba(139,92,246,0.12)',
                                    color: '#a78bfa',
                                    border: '1px solid rgba(139,92,246,0.2)',
                                  }}
                                >
                                  {chip}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px]" style={{ color: '#1f2240' }}>—</span>
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
                  <td colSpan={8} className="text-center py-16 text-sm" style={{ color: '#3d4268' }}>
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
