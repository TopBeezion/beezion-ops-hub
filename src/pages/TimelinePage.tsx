import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useOutletContext } from 'react-router-dom'
import type { Task } from '../types'
import { AREA_COLORS, AREA_LABELS, STATUS_COLORS, STATUS_LABELS } from '../lib/constants'
import { X, ChevronDown, ChevronUp, Zap } from 'lucide-react'

const WEEKS = [1, 2, 3, 4] as const

const SPRINT_META: Record<number, { label: string; sub: string; color: string; owner: string }> = {
  1: { label: 'Sprint 1', sub: 'Copy & Briefs',       color: '#8b5cf6', owner: 'Alejandro · Editores' },
  2: { label: 'Sprint 2', sub: 'Producción & Diseño',  color: '#ec4899', owner: 'Paula · Jose Luis' },
  3: { label: 'Sprint 3', sub: 'Dev & Setup',           color: '#3b82f6', owner: 'Alec · Paula' },
  4: { label: 'Sprint 4', sub: 'Launch & Optim.',       color: '#22c55e', owner: 'Alec · Jose Luis' },
}

const AREA_LIST   = ['copy', 'trafico', 'tech', 'admin'] as const
const ASSIGNEES   = ['Alejandro', 'Alec', 'Paula', 'Jose Luis', 'Editor 1', 'Editor 2', 'Editor 3']

const ASSIGNEE_INITIALS: Record<string, string> = {
  Alejandro: 'AL', Alec: 'AC', Paula: 'PL', 'Jose Luis': 'JL',
  'Editor 1': 'E1', 'Editor 2': 'E2', 'Editor 3': 'E3',
}
const ASSIGNEE_COLORS: Record<string, string> = {
  Alejandro: '#8b5cf6', Alec: '#f5a623', Paula: '#ec4899',
  'Jose Luis': '#3b82f6', 'Editor 1': '#06b6d4', 'Editor 2': '#10b981', 'Editor 3': '#f97316',
}

// ── Progress Ring ─────────────────────────────────────────────────
function ProgressRing({ value, max, color, size = 44 }: { value: number; max: number; color: string; size?: number }) {
  const r = (size - 5) / 2
  const circ = 2 * Math.PI * r
  const pct = max > 0 ? value / max : 0
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={2.5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={2.5}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  )
}

// ── Deliverable chips ─────────────────────────────────────────────
function DeliverableChips({ task, isDone }: { task: Task; isDone: boolean }) {
  const d = task.deliverables
  if (!d) return null

  const chips: { label: string; count: number; color: string }[] = []
  if (d.hooks)           chips.push({ label: 'hooks',   count: d.hooks,           color: '#8b5cf6' })
  if (d.scripts_video)   chips.push({ label: 'scripts', count: d.scripts_video,   color: '#ec4899' })
  if (d.body_copy)       chips.push({ label: 'body',    count: d.body_copy,        color: '#3b82f6' })
  if (d.cta)             chips.push({ label: 'CTA',     count: d.cta,              color: '#f5a623' })
  if (d.lead_magnet_pdf) chips.push({ label: 'LM',      count: d.lead_magnet_pdf,  color: '#22c55e' })
  if (d.vsl_script)      chips.push({ label: 'VSL',     count: d.vsl_script,       color: '#06b6d4' })
  if (d.landing_copy)    chips.push({ label: 'landing', count: d.landing_copy,     color: '#f97316' })
  if (d.carousel_slides) chips.push({ label: 'slides',  count: d.carousel_slides,  color: '#a78bfa' })
  if (d.headline_options)chips.push({ label: 'hdl',     count: d.headline_options, color: '#f472b6' })
  if (d.retargeting_scripts) chips.push({ label: 'retarg', count: d.retargeting_scripts, color: '#34d399' })

  if (chips.length === 0) return null

  const visible = chips.slice(0, 3)
  const extra   = chips.length - 3

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {visible.map(({ label, count, color }) => (
        <span
          key={label}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold leading-none"
          style={{
            backgroundColor: isDone ? 'rgba(255,255,255,0.03)' : `${color}15`,
            color: isDone ? '#303030' : color,
            border: `1px solid ${isDone ? 'rgba(255,255,255,0.04)' : `${color}30`}`,
          }}
        >
          <span style={{ color: isDone ? '#303030' : color, fontWeight: 900 }}>{count}</span>
          &nbsp;{label}
        </span>
      ))}
      {extra > 0 && (
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold leading-none"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#585858' }}
        >
          +{extra}
        </span>
      )}
    </div>
  )
}

// ── Task Card (mini) ──────────────────────────────────────────────
function TaskCard({ task, onOpen }: { task: Task; onOpen?: (t: Task) => void }) {
  const areaColor   = AREA_COLORS[task.area]
  const statusColor = STATUS_COLORS[task.status]
  const isDone      = task.status === 'completado'
  const isUrgent    = task.tipo === 'urgente'
  const initials    = ASSIGNEE_INITIALS[task.assignee] ?? task.assignee.slice(0, 2).toUpperCase()
  const avatarColor = ASSIGNEE_COLORS[task.assignee] ?? '#6b7280'
  const hasDeliverables = task.deliverables && Object.values(task.deliverables).some(v => v && v > 0)

  return (
    <button
      onClick={() => onOpen?.(task)}
      className="group relative rounded-lg overflow-hidden text-left w-full"
      style={{
        backgroundColor: isDone ? 'rgba(255,255,255,0.02)' : 'rgba(26,26,26,0.9)',
        border: isUrgent
          ? '1px solid rgba(239,68,68,0.4)'
          : isDone
          ? '1px solid rgba(255,255,255,0.04)'
          : '1px solid rgba(255,255,255,0.08)',
        borderLeft: `3px solid ${isDone ? '#222222' : statusColor}`,
        transition: 'all 150ms ease',
        cursor: onOpen ? 'pointer' : 'default',
      }}
      title={`${task.title} · ${task.assignee} · ${STATUS_LABELS[task.status]}`}
    >
      {isUrgent && (
        <div className="absolute inset-0 pointer-events-none rounded-lg" style={{ boxShadow: 'inset 0 0 12px rgba(239,68,68,0.08)' }} />
      )}

      <div className="px-2.5 py-2">
        {/* Urgency tag */}
        {isUrgent && (
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
              <Zap size={8} style={{ display: 'inline' }} /> URGENTE
            </span>
          </div>
        )}

        {/* Title */}
        <p
          className="text-[11px] font-medium leading-snug"
          style={{
            color: isDone ? '#585858' : '#e0e0e0',
            textDecoration: isDone ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </p>

        {/* Deliverables breakdown */}
        {hasDeliverables && <DeliverableChips task={task} isDone={isDone} />}

        {/* Footer row */}
        <div className={`flex items-center justify-between gap-1 ${hasDeliverables ? 'mt-2' : 'mt-1.5'}`} style={{ borderTop: hasDeliverables ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingTop: hasDeliverables ? '6px' : 0 }}>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide leading-none"
            style={{
              backgroundColor: isDone ? 'rgba(255,255,255,0.03)' : `${areaColor}15`,
              color: isDone ? '#303030' : areaColor,
              border: `1px solid ${isDone ? 'rgba(255,255,255,0.04)' : `${areaColor}28`}`,
            }}
          >
            {AREA_LABELS[task.area]}
          </span>
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0"
            style={{
              background: isDone ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${avatarColor}40, ${avatarColor}20)`,
              color: isDone ? '#303030' : avatarColor,
              border: `1px solid ${isDone ? 'rgba(255,255,255,0.05)' : `${avatarColor}40`}`,
            }}
          >
            {initials}
          </div>
        </div>
      </div>
    </button>
  )
}

// ── Sprint Column Header ──────────────────────────────────────────
function SprintHeader({ week, tasks }: { week: number; tasks: Task[] }) {
  const meta     = SPRINT_META[week]
  const total    = tasks.length
  const done     = tasks.filter(t => t.status === 'completado').length
  const inProg   = tasks.filter(t => t.status === 'en_progreso').length
  const revision = tasks.filter(t => t.status === 'revision').length
  const pct      = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div
      className="px-4 py-3.5 flex flex-col gap-2.5"
      style={{
        borderRight: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: `linear-gradient(180deg, ${meta.color}08 0%, transparent 100%)`,
      }}
    >
      {/* Top row: label + ring */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
          />
          <div>
            <p className="text-[13px] font-bold leading-none" style={{ color: '#f5f5f5' }}>{meta.label}</p>
            <p className="text-[10px] mt-0.5 leading-none" style={{ color: '#6b6b6b' }}>{meta.sub}</p>
          </div>
        </div>
        <div className="relative shrink-0">
          <ProgressRing value={done} max={total} color={meta.color} size={38} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-bold tabular-nums" style={{ color: meta.color }}>{pct}%</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)`,
            transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold tabular-nums" style={{ color: meta.color }}>
            {done}/{total}
          </span>
          {inProg > 0 && (
            <span className="text-[9px] font-medium" style={{ color: '#3b82f6' }}>◷{inProg}</span>
          )}
          {revision > 0 && (
            <span className="text-[9px] font-medium" style={{ color: '#f59e0b' }}>⟳{revision}</span>
          )}
        </div>
        <span className="text-[9px]" style={{ color: '#585858' }}>{meta.owner}</span>
      </div>
    </div>
  )
}

// ── Client Row Label ──────────────────────────────────────────────
function ClientLabel({ client, tasks }: { client: { id: string; name: string; color: string }; tasks: Task[] }) {
  const total = tasks.length
  const done  = tasks.filter(t => t.status === 'completado').length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div
      className="px-4 py-4 sticky left-0 flex flex-col justify-between"
      style={{
        borderRight: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: '#0f0f0f',
        borderTop: `2px solid ${client.color}`,
        minHeight: '100%',
      }}
    >
      {/* Client name */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: client.color, boxShadow: `0 0 6px ${client.color}` }}
          />
          <span className="text-[13px] font-bold leading-tight" style={{ color: '#f5f5f5' }}>
            {client.name}
          </span>
        </div>
        <p className="text-[10px] ml-4" style={{ color: '#6b6b6b' }}>
          {done}/{total} tareas
        </p>
      </div>

      {/* Mini progress */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-bold" style={{ color: client.color }}>{pct}%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              backgroundColor: client.color,
              transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </div>
        {/* Per-sprint dots */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {WEEKS.map(w => {
            const wt = tasks.filter(t => t.week === w)
            if (wt.length === 0) return null
            const wd = wt.filter(t => t.status === 'completado').length
            return (
              <span key={w} className="text-[8px] font-bold" style={{ color: SPRINT_META[w].color }}>
                S{w}·{wd}/{wt.length}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Cell ──────────────────────────────────────────────────────────
function SprintCell({
  clientId, week, tasks, onOpen,
}: {
  clientId: string; week: number; tasks: Task[]; onOpen?: (t: Task) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const meta        = SPRINT_META[week]
  const MAX_VISIBLE = 4
  const visible     = expanded ? tasks : tasks.slice(0, MAX_VISIBLE)
  const hidden      = tasks.length - MAX_VISIBLE
  const done        = tasks.filter(t => t.status === 'completado').length

  if (tasks.length === 0) {
    return (
      <div
        className="px-3 py-3 flex items-center justify-center"
        style={{
          borderRight: '1px solid rgba(255,255,255,0.04)',
          minHeight: 100,
        }}
      >
        <span className="text-[10px]" style={{ color: '#1e1e1e' }}>—</span>
      </div>
    )
  }

  return (
    <div
      className="px-3 py-3 flex flex-col gap-2"
      style={{
        borderRight: '1px solid rgba(255,255,255,0.04)',
        borderTop: `2px solid ${meta.color}28`,
        minHeight: 100,
      }}
    >
      {/* Cell header */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold" style={{ color: meta.color }}>
          {tasks.length} tareas
        </span>
        {done > 0 && (
          <span className="text-[9px] font-medium" style={{ color: '#22c55e' }}>✓{done}</span>
        )}
      </div>

      {/* Task cards */}
      <div className="flex flex-col gap-1.5">
        {visible.map(task => (
          <TaskCard key={task.id} task={task} onOpen={onOpen} />
        ))}
      </div>

      {/* Expand / collapse */}
      {hidden > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-bold w-full"
          style={{
            color: meta.color,
            backgroundColor: `${meta.color}08`,
            border: `1px solid ${meta.color}20`,
          }}
        >
          <ChevronDown size={9} />
          +{hidden} más
        </button>
      )}
      {expanded && tasks.length > MAX_VISIBLE && (
        <button
          onClick={() => setExpanded(false)}
          className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[9px] font-bold w-full"
          style={{
            color: '#6b6b6b',
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <ChevronUp size={9} />
          colapsar
        </button>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
export function TimelinePage() {
  const { openTaskDetail } = useOutletContext<{ openTaskDetail?: (t: Task) => void }>()
  const { data: clients = [], isLoading: clientsLoading } = useClients()
  const { data: allTasks = [], isLoading: tasksLoading }  = useTasks()
  const [areaFilter,     setAreaFilter]     = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [clientFilter,   setClientFilter]   = useState('')

  const tasks = allTasks
    .filter(t => !areaFilter     || t.area     === areaFilter)
    .filter(t => !assigneeFilter || t.assignee === assigneeFilter)
    .filter(t => !clientFilter   || t.client_id === clientFilter)

  const hasFilters = !!(areaFilter || assigneeFilter || clientFilter)
  const isLoading  = clientsLoading || tasksLoading

  const activeClients = clients.filter(c =>
    (!clientFilter || c.id === clientFilter) &&
    allTasks.some(t => t.client_id === c.id),
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: '#f5a623', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0f0f0f' }}>

      {/* ── Filter toolbar ────────────────────────────────────────── */}
      <div className="filter-toolbar">

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

      {/* ── Grid ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div style={{ minWidth: 1000 }}>

          {/* Column headers */}
          <div
            className="grid sticky top-0 z-10"
            style={{
              gridTemplateColumns: '200px repeat(4, 1fr)',
              backgroundColor: '#0f0f0f',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {/* Client column header */}
            <div
              className="px-4 py-4 flex flex-col justify-end"
              style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#585858' }}>
                Cliente
              </span>
              <p className="text-[9px] mt-0.5" style={{ color: '#222222' }}>
                {activeClients.length} activos
              </p>
            </div>

            {/* Sprint headers */}
            {WEEKS.map(w => (
              <SprintHeader
                key={w}
                week={w}
                tasks={tasks.filter(t => t.week === w)}
              />
            ))}
          </div>

          {/* Client rows */}
          {activeClients.map(client => {
            const clientTasks = tasks.filter(t => t.client_id === client.id)
            return (
              <div
                key={client.id}
                className="grid"
                style={{
                  gridTemplateColumns: '200px repeat(4, 1fr)',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <ClientLabel client={client} tasks={clientTasks} />
                {WEEKS.map(week => (
                  <SprintCell
                    key={week}
                    clientId={client.id}
                    week={week}
                    tasks={clientTasks.filter(t => t.week === week)}
                    onOpen={openTaskDetail}
                  />
                ))}
              </div>
            )
          })}

          {activeClients.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-20"
              style={{ color: '#585858' }}
            >
              <p className="text-sm font-medium">Sin resultados</p>
              <p className="text-xs mt-1">Prueba ajustando los filtros</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
