import { useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useOutletContext } from 'react-router-dom'
import type { Task } from '../types'
import { AREA_COLORS, AREA_LABELS, STATUS_COLORS, STATUS_LABELS, ASSIGNEE_COLORS } from '../lib/constants'
import { X, ChevronDown, ChevronUp, Zap } from 'lucide-react'

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#F0F2F8',
  card: '#FFFFFF',
  border: '#E4E7F0',
  text: '#1A1D27',
  sub: '#5A5E72',
  muted: '#9699B0',
  headerBg: '#FFFFFF',
}

const WEEKS = [1, 2, 3, 4] as const

const SPRINT_META: Record<number, { label: string; sub: string; color: string; owner: string }> = {
  1: { label: 'Sprint 1', sub: 'Copy & Briefs',       color: '#8b5cf6', owner: 'Alejandro · Editores' },
  2: { label: 'Sprint 2', sub: 'Producción & Diseño',  color: '#ec4899', owner: 'Paula · Editores' },
  3: { label: 'Sprint 3', sub: 'Dev & Setup',           color: '#3b82f6', owner: 'Alec · Paula' },
  4: { label: 'Sprint 4', sub: 'Launch & Optim.',       color: '#22c55e', owner: 'Alec · Jose' },
}

const AREA_LIST   = ['copy', 'trafico', 'tech', 'admin'] as const
const ASSIGNEES   = ['Alejandro', 'Alec', 'Jose', 'Luisa', 'Paula', 'David', 'Johan', 'Felipe']

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
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={2.5} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={2.5}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
    </svg>
  )
}

// ── Deliverable chips ─────────────────────────────────────────────
function DeliverableChips({ task, isDone }: { task: Task; isDone: boolean }) {
  const d = task.deliverables
  if (!d) return null

  const chips: { label: string; count: number; color: string }[] = []
  if (d.hooks)           chips.push({ label: 'hooks',   count: d.hooks,            color: '#8b5cf6' })
  if (d.scripts_video)   chips.push({ label: 'scripts', count: d.scripts_video,    color: '#ec4899' })
  if (d.body_copy)       chips.push({ label: 'body',    count: d.body_copy,         color: '#3b82f6' })
  if (d.cta)             chips.push({ label: 'CTA',     count: d.cta,               color: '#f5a623' })
  if (d.lead_magnet_pdf) chips.push({ label: 'LM',      count: d.lead_magnet_pdf,   color: '#22c55e' })
  if (d.vsl_script)      chips.push({ label: 'VSL',     count: d.vsl_script,        color: '#06b6d4' })
  if (d.landing_copy)    chips.push({ label: 'landing', count: d.landing_copy,      color: '#f97316' })
  if (d.carousel_slides) chips.push({ label: 'slides',  count: d.carousel_slides,   color: '#a78bfa' })
  if (d.headline_options)chips.push({ label: 'hdl',     count: d.headline_options,  color: '#f472b6' })
  if (d.retargeting_scripts) chips.push({ label: 'retarg', count: d.retargeting_scripts, color: '#34d399' })
  if (chips.length === 0) return null

  const visible = chips.slice(0, 3)
  const extra   = chips.length - 3

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 5 }}>
      {visible.map(({ label, count, color }) => (
        <span key={label} style={{
          display: 'inline-flex', alignItems: 'center', gap: 2,
          padding: '1px 5px', borderRadius: 4, fontSize: 9, fontWeight: 700,
          backgroundColor: isDone ? C.bg : `${color}12`,
          color: isDone ? C.muted : color,
          border: `1px solid ${isDone ? C.border : `${color}25`}`,
        }}>
          <span style={{ fontWeight: 900 }}>{count}</span>&nbsp;{label}
        </span>
      ))}
      {extra > 0 && (
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '1px 5px', borderRadius: 4, fontSize: 9, fontWeight: 700,
          backgroundColor: C.bg, color: C.muted, border: `1px solid ${C.border}`,
        }}>
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
  const avatarColor = ASSIGNEE_COLORS[task.assignee] ?? '#6366F1'
  const hasDeliverables = task.deliverables && Object.values(task.deliverables).some(v => v && v > 0)

  return (
    <button
      onClick={() => onOpen?.(task)}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        backgroundColor: isDone ? C.bg : C.card,
        border: isUrgent
          ? '1px solid rgba(239,68,68,0.35)'
          : isDone
          ? `1px solid ${C.border}`
          : `1px solid ${C.border}`,
        borderLeft: `3px solid ${isDone ? C.border : statusColor}`,
        borderRadius: 7, overflow: 'hidden',
        transition: 'all 150ms ease',
        cursor: onOpen ? 'pointer' : 'default',
        position: 'relative',
      }}
      title={`${task.title} · ${task.assignee} · ${STATUS_LABELS[task.status]}`}
      onMouseEnter={e => { if (!isDone) (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      {isUrgent && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 7, boxShadow: 'inset 0 0 0 1px rgba(239,68,68,0.15)', pointerEvents: 'none' }} />
      )}
      <div style={{ padding: '8px 10px' }}>
        {isUrgent && (
          <div style={{ marginBottom: 4 }}>
            <span style={{
              fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 3,
              backgroundColor: '#FEF2F2', color: '#EF4444',
              display: 'inline-flex', alignItems: 'center', gap: 2,
            }}>
              <Zap size={7} /> URGENTE
            </span>
          </div>
        )}
        <p style={{
          fontSize: 11, fontWeight: 500, lineHeight: 1.4,
          color: isDone ? C.muted : C.text,
          textDecoration: isDone ? 'line-through' : 'none',
        }}>
          {task.title}
        </p>
        {hasDeliverables && <DeliverableChips task={task} isDone={isDone} />}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
          marginTop: hasDeliverables ? 6 : 5,
          borderTop: hasDeliverables ? `1px solid ${C.border}` : 'none',
          paddingTop: hasDeliverables ? 5 : 0,
        }}>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
            backgroundColor: isDone ? C.bg : `${areaColor}12`,
            color: isDone ? C.muted : areaColor,
            border: `1px solid ${isDone ? C.border : `${areaColor}25`}`,
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {AREA_LABELS[task.area]}
          </span>
          <div style={{
            width: 16, height: 16, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 7, fontWeight: 800, flexShrink: 0,
            background: isDone ? C.bg : `linear-gradient(135deg, ${avatarColor}30, ${avatarColor}15)`,
            color: isDone ? C.muted : avatarColor,
            border: `1px solid ${isDone ? C.border : `${avatarColor}35`}`,
          }}>
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
    <div style={{
      padding: '12px 14px',
      borderRight: `1px solid ${C.border}`,
      borderBottom: `1px solid ${C.border}`,
      background: `linear-gradient(180deg, ${meta.color}08 0%, transparent 100%)`,
      borderTop: `3px solid ${meta.color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            backgroundColor: meta.color,
          }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{meta.label}</p>
            <p style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{meta.sub}</p>
          </div>
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ProgressRing value={done} max={total} color={meta.color} size={36} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, fontWeight: 800, color: meta.color,
          }}>
            {pct}%
          </div>
        </div>
      </div>
      <div style={{ height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden', marginBottom: 7 }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)`,
          borderRadius: 2, transition: 'width 0.7s ease',
        }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: meta.color }}>{done}/{total}</span>
          {inProg > 0 && <span style={{ fontSize: 9, color: '#3b82f6' }}>◷{inProg}</span>}
          {revision > 0 && <span style={{ fontSize: 9, color: '#f59e0b' }}>⟳{revision}</span>}
        </div>
        <span style={{ fontSize: 9, color: C.muted }}>{meta.owner}</span>
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
    <div style={{
      padding: '14px 14px',
      position: 'sticky', left: 0,
      borderRight: `1px solid ${C.border}`,
      backgroundColor: C.card,
      borderTop: `3px solid ${client.color}`,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: '100%',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            backgroundColor: client.color,
          }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{client.name}</span>
        </div>
        <p style={{ fontSize: 10, color: C.muted, paddingLeft: 15 }}>{done}/{total} tareas</p>
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: client.color }}>{pct}%</span>
        </div>
        <div style={{ height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            backgroundColor: client.color,
            borderRadius: 2, transition: 'width 0.7s ease',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
          {WEEKS.map(w => {
            const wt = tasks.filter(t => t.week === w)
            if (wt.length === 0) return null
            const wd = wt.filter(t => t.status === 'completado').length
            return (
              <span key={w} style={{ fontSize: 8, fontWeight: 700, color: SPRINT_META[w].color }}>
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
  week, tasks, onOpen,
}: {
  week: number; tasks: Task[]; onOpen?: (t: Task) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const meta        = SPRINT_META[week]
  const MAX_VISIBLE = 4
  const visible     = expanded ? tasks : tasks.slice(0, MAX_VISIBLE)
  const hidden      = tasks.length - MAX_VISIBLE
  const done        = tasks.filter(t => t.status === 'completado').length

  if (tasks.length === 0) {
    return (
      <div style={{
        borderRight: `1px solid ${C.border}`,
        minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 10, color: C.border }}>—</span>
      </div>
    )
  }

  return (
    <div style={{
      padding: '10px 10px',
      borderRight: `1px solid ${C.border}`,
      borderTop: `2px solid ${meta.color}22`,
      minHeight: 100, display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: meta.color }}>{tasks.length} tareas</span>
        {done > 0 && <span style={{ fontSize: 9, color: '#10b981' }}>✓{done}</span>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {visible.map(task => <TaskCard key={task.id} task={task} onOpen={onOpen} />)}
      </div>
      {hidden > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
            padding: '5px 0', borderRadius: 6, fontSize: 9, fontWeight: 700, width: '100%',
            color: meta.color, backgroundColor: `${meta.color}08`,
            border: `1px solid ${meta.color}20`, cursor: 'pointer',
          }}
        >
          <ChevronDown size={9} />+{hidden} más
        </button>
      )}
      {expanded && tasks.length > MAX_VISIBLE && (
        <button
          onClick={() => setExpanded(false)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
            padding: '5px 0', borderRadius: 6, fontSize: 9, fontWeight: 700, width: '100%',
            color: C.muted, backgroundColor: C.bg,
            border: `1px solid ${C.border}`, cursor: 'pointer',
          }}
        >
          <ChevronUp size={9} />colapsar
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

  const chipStyle = (active: boolean, color = '#6366F1'): React.CSSProperties => ({
    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'all 0.12s',
    backgroundColor: active ? color : `${color}12`,
    color: active ? '#fff' : color,
    boxShadow: active ? `0 2px 6px ${color}40` : `inset 0 0 0 1.5px ${color}35`,
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, backgroundColor: C.bg }}>
        <div className="w-7 h-7 rounded-full border-2 border-transparent border-t-current animate-spin" style={{ color: '#6366F1' }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: C.bg }}>

      {/* ── Filter toolbar ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: '10px 16px',
        backgroundColor: C.card, borderBottom: `1px solid ${C.border}`,
      }}>
        {/* Row 1: Area + Cliente */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 2 }}>Área</span>
          <button onClick={() => setAreaFilter('')} style={chipStyle(!areaFilter)}>Todas</button>
          {AREA_LIST.map(a => (
            <button key={a} onClick={() => setAreaFilter(areaFilter === a ? '' : a)} style={chipStyle(areaFilter === a, AREA_COLORS[a])}>
              {AREA_LABELS[a]}
            </button>
          ))}

          <span style={{ width: 1, height: 14, backgroundColor: C.border, margin: '0 4px' }} />

          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 2 }}>Cliente</span>
          <button onClick={() => setClientFilter('')} style={chipStyle(!clientFilter)}>Todos</button>
          {clients.map(c => (
            <button key={c.id} onClick={() => setClientFilter(clientFilter === c.id ? '' : c.id)}
              style={{ ...chipStyle(clientFilter === c.id, c.color), display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: clientFilter === c.id ? 'rgba(255,255,255,0.7)' : c.color, display: 'inline-block' }} />
              {c.name}
            </button>
          ))}

          <span style={{ fontSize: 11, color: C.muted, marginLeft: 'auto', fontWeight: 500 }}>{tasks.length} tareas</span>
        </div>

        {/* Row 2: Assignee */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 2 }}>Persona</span>
          <button onClick={() => setAssigneeFilter('')} style={chipStyle(!assigneeFilter)}>Todos</button>
          {ASSIGNEES.map(name => {
            const color = ASSIGNEE_COLORS[name] || '#9699B0'
            const active = assigneeFilter === name
            return (
              <button key={name} onClick={() => setAssigneeFilter(active ? '' : name)} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 9px 3px 5px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                backgroundColor: active ? color : `${color}12`,
                color: active ? '#fff' : color,
                boxShadow: active ? `0 2px 6px ${color}40` : `inset 0 0 0 1.5px ${color}35`,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: active ? 'rgba(255,255,255,0.25)' : `${color}20`,
                  color: active ? '#fff' : color,
                  fontSize: 8, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {name.slice(0, 2).toUpperCase()}
                </div>
                {name}
              </button>
            )
          })}

          {hasFilters && (
            <button
              onClick={() => { setAreaFilter(''); setAssigneeFilter(''); setClientFilter('') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700,
                padding: '4px 9px', borderRadius: 20, cursor: 'pointer', border: 'none',
                backgroundColor: '#FEF2F2', color: '#DC2626',
                boxShadow: 'inset 0 0 0 1.5px #FCA5A5',
              }}
            >
              <X size={9} strokeWidth={3} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Grid ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ minWidth: 1000 }}>

          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '200px repeat(4, 1fr)',
            position: 'sticky', top: 0, zIndex: 10,
            backgroundColor: C.headerBg,
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{
              padding: '12px 14px', borderRight: `1px solid ${C.border}`,
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Cliente
              </span>
              <p style={{ fontSize: 9, color: C.border, marginTop: 2 }}>
                {activeClients.length} activos
              </p>
            </div>
            {WEEKS.map(w => (
              <SprintHeader key={w} week={w} tasks={tasks.filter(t => t.week === w)} />
            ))}
          </div>

          {/* Client rows */}
          {activeClients.map(client => {
            const clientTasks = tasks.filter(t => t.client_id === client.id)
            return (
              <div
                key={client.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '200px repeat(4, 1fr)',
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <ClientLabel client={client} tasks={clientTasks} />
                {WEEKS.map(week => (
                  <SprintCell
                    key={week}
                    week={week}
                    tasks={clientTasks.filter(t => t.week === week)}
                    onOpen={openTaskDetail}
                  />
                ))}
              </div>
            )
          })}

          {activeClients.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '80px 20px', color: C.muted,
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.sub }}>Sin resultados</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Ajusta los filtros para ver tareas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
