import { useTasks } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import type { Area } from '../types'
import { AREA_LABELS, AREA_COLORS } from '../lib/constants'
import { ClientBadge } from '../components/ui/ClientBadge'
import { AreaBadge } from '../components/ui/AreaBadge'
import { AssigneeAvatar } from '../components/ui/AssigneeAvatar'
import { StatusSelect } from '../components/ui/StatusSelect'
import { useUpdateTaskStatus } from '../hooks/useTasks'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { AlertTriangle, TrendingUp, CheckCircle2, Layers, Zap, Users, Activity } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'

const AREAS: Area[] = ['copy', 'trafico', 'tech', 'admin']
const ASSIGNEES = ['Alejandro', 'Alec', 'Paula', 'Jose Luis', 'Editor 1', 'Editor 2', 'Editor 3']

const ASSIGNEE_COLORS: Record<string, string> = {
  Alejandro: '#8b5cf6',
  Alec: '#f5a623',
  Paula: '#ec4899',
  'Jose Luis': '#3b82f6',
  'Editor 1': '#06b6d4',
  'Editor 2': '#10b981',
  'Editor 3': '#f97316',
}

// Areas each team member covers
const ASSIGNEE_AREAS: Record<string, string[]> = {
  Alejandro: ['copy'],
  Alec: ['tech', 'trafico'],
  Paula: ['copy', 'admin'],
  'Jose Luis': ['trafico'],
  'Editor 1': ['copy'],
  'Editor 2': ['copy'],
  'Editor 3': ['copy'],
}

// Role description per team member
const ASSIGNEE_ROLE: Record<string, string> = {
  Alejandro: 'CEO · Copy & Estrategia',
  Alec: 'COO · Head Tech & Paid Media',
  Paula: 'Aux. Marketing · Producción · Diseño LM · Admin',
  'Jose Luis': 'Trafficker Digital',
  'Editor 1': 'Edición de Video',
  'Editor 2': 'Edición de Video',
  'Editor 3': 'Edición de Video',
}

const SPRINT_META = {
  1: { label: 'Sprint 1', sub: 'Copy & Briefs', color: '#8b5cf6', owner: 'Alejandro · Editores' },
  2: { label: 'Sprint 2', sub: 'Producción & Diseño', color: '#ec4899', owner: 'Paula · Jose Luis' },
  3: { label: 'Sprint 3', sub: 'Dev & Setup', color: '#3b82f6', owner: 'Alec · Paula' },
  4: { label: 'Sprint 4', sub: 'Launch & Optim.', color: '#22c55e', owner: 'Alec · Jose Luis' },
}

// SVG Progress Ring
function ProgressRing({
  value, max, color, size = 52,
}: {
  value: number; max: number; color: string; size?: number
}) {
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const pct = max > 0 ? value / max : 0
  const offset = circumference * (1 - pct)

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={3}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={3} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  )
}

// KPI stat card
function KpiCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; accent: string
}) {
  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden card-hover"
      style={{
        backgroundColor: '#161616',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-15"
        style={{ backgroundColor: accent }}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium leading-tight" style={{ color: '#a1a1a1' }}>{label}</p>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${accent}18`, border: `1px solid ${accent}28` }}
          >
            <Icon size={13} style={{ color: accent }} />
          </div>
        </div>
        <p
          className="text-3xl font-bold tabular-nums count-up"
          style={{ color: '#f5f5f5', letterSpacing: '-0.03em' }}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[11px] mt-1 font-medium" style={{ color: accent }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

// Section header
function SectionHead({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ color: '#585858' }}
      >
        {title}
      </span>
      {count !== undefined && (
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#6b6b6b' }}
        >
          {count}
        </span>
      )}
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
    </div>
  )
}

export function DashboardPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: clients = [] } = useClients()
  const updateStatus = useUpdateTaskStatus()
  const navigate = useNavigate()
  const ctx = useOutletContext<{ openTaskDetail?: (t: any) => void }>()

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

  const total = tasks.length
  const completados = tasks.filter(t => t.status === 'completado').length
  const enProgreso = tasks.filter(t => t.status === 'en_progreso').length
  const enRevision = tasks.filter(t => t.status === 'revision').length
  const urgentOrPrevious = tasks.filter(t => t.tipo === 'urgente' || t.tipo === 'pendiente_anterior')
  const completedPct = total > 0 ? Math.round((completados / total) * 100) : 0

  // COO Health Score: penalise urgent/prev + revision, reward completados
  const urgentPenalty = urgentOrPrevious.length * 4
  const revisionPenalty = enRevision * 2
  const rawHealth = Math.max(0, Math.min(100, completedPct - urgentPenalty - revisionPenalty + (enProgreso > 0 ? 5 : 0)))
  const healthColor = rawHealth >= 70 ? '#22c55e' : rawHealth >= 40 ? '#f5a623' : '#ef4444'
  const healthLabel = rawHealth >= 70 ? 'Operación sana' : rawHealth >= 40 ? 'Atención requerida' : 'Riesgo operativo'

  const byArea = AREAS.map(area => ({
    area,
    total: tasks.filter(t => t.area === area).length,
    done: tasks.filter(t => t.area === area && t.status === 'completado').length,
    inProgress: tasks.filter(t => t.area === area && t.status === 'en_progreso').length,
  }))

  const byAssignee = ASSIGNEES.map(name => ({
    name,
    total: tasks.filter(t => t.assignee === name).length,
    pendiente: tasks.filter(t => t.assignee === name && t.status === 'pendiente').length,
    enProgreso: tasks.filter(t => t.assignee === name && t.status === 'en_progreso').length,
    completado: tasks.filter(t => t.assignee === name && t.status === 'completado').length,
    revision: tasks.filter(t => t.assignee === name && t.status === 'revision').length,
  }))

  const byClient = clients.map(client => {
    const ct = tasks.filter(t => t.client_id === client.id)
    const done = ct.filter(t => t.status === 'completado').length
    const prog = ct.filter(t => t.status === 'en_progreso').length
    const pct = ct.length > 0 ? Math.round((done / ct.length) * 100) : 0
    const atRisk = ct.length > 0 && pct < 25 && ct.length >= 3
    return {
      client, total: ct.length, done, prog, pct, atRisk,
      copy: ct.filter(t => t.area === 'copy').length,
      trafico: ct.filter(t => t.area === 'trafico').length,
      tech: ct.filter(t => t.area === 'tech').length,
      admin: ct.filter(t => t.area === 'admin').length,
    }
  })

  const atRiskClients = byClient.filter(c => c.atRisk)

  const recent = [...tasks]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 7)

  return (
    <div className="p-5 space-y-6 max-w-[1480px]">

      {/* ── Row 1: Health score + KPIs ─────────────────────────────── */}
      <div className="grid grid-cols-5 gap-3">

        {/* Health Score — COO hero metric */}
        <div
          className="rounded-xl p-5 flex items-center gap-4 card-hover col-span-1"
          style={{
            background: `linear-gradient(135deg, ${healthColor}0a 0%, #161616 60%)`,
            border: `1px solid ${healthColor}30`,
          }}
        >
          <div className="relative shrink-0">
            <ProgressRing value={rawHealth} max={100} color={healthColor} size={64} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold tabular-nums" style={{ color: healthColor }}>
                {rawHealth}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] mb-0.5" style={{ color: '#6b6b6b' }}>
              Health Score
            </p>
            <p className="text-sm font-semibold leading-tight" style={{ color: healthColor }}>
              {healthLabel}
            </p>
            {urgentOrPrevious.length > 0 && (
              <p className="text-[10px] mt-1" style={{ color: '#ef4444' }}>
                <Zap size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {urgentOrPrevious.length} bloqueante{urgentOrPrevious.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <KpiCard
          label="Tareas totales"
          value={total}
          sub={`${completedPct}% completado`}
          icon={Layers}
          accent="#8b5cf6"
        />
        <KpiCard
          label="En progreso"
          value={enProgreso}
          sub="activas ahora"
          icon={Activity}
          accent="#3b82f6"
        />
        <KpiCard
          label="Completadas"
          value={completados}
          sub={`de ${total} total`}
          icon={CheckCircle2}
          accent="#22c55e"
        />
        <KpiCard
          label="Urgentes / Previas"
          value={urgentOrPrevious.length}
          sub={urgentOrPrevious.length > 0 ? 'requieren atención' : 'sin pendientes'}
          icon={urgentOrPrevious.length > 0 ? AlertTriangle : TrendingUp}
          accent={urgentOrPrevious.length > 0 ? '#ef4444' : '#22c55e'}
        />
      </div>

      {/* ── Row 2: Bottlenecks / urgent ────────────────────────────── */}
      {urgentOrPrevious.length > 0 && (
        <div>
          <SectionHead title="Bloqueantes & Urgentes" count={urgentOrPrevious.length} />
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, #161616 55%)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            {urgentOrPrevious.slice(0, 6).map((task, i) => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                onClick={() => ctx?.openTaskDetail?.(task)}
                style={{
                  borderBottom: i < Math.min(urgentOrPrevious.length, 6) - 1
                    ? '1px solid rgba(255,255,255,0.03)'
                    : 'none',
                  borderLeft: `3px solid ${task.tipo === 'urgente' ? '#ef4444' : '#f97316'}`,
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0 pulse-dot"
                  style={{ backgroundColor: task.tipo === 'urgente' ? '#ef4444' : '#f97316' }}
                />
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    backgroundColor: task.tipo === 'urgente' ? 'rgba(239,68,68,0.12)' : 'rgba(249,115,22,0.12)',
                    color: task.tipo === 'urgente' ? '#ef4444' : '#f97316',
                  }}
                >
                  {task.tipo === 'urgente' ? <><Zap size={9} style={{ display: 'inline' }} /> URG</> : <><Activity size={9} style={{ display: 'inline' }} /> PREV</>}
                </span>
                <ClientBadge client={task.client} size="xs" />
                <span className="flex-1 text-xs truncate font-medium" style={{ color: '#e0e0e0' }}>
                  {task.title}
                </span>
                <AreaBadge area={task.area} size="xs" />
                <AssigneeAvatar name={task.assignee} size="sm" />
                <StatusSelect
                  status={task.status}
                  onChange={status => updateStatus.mutate({ id: task.id, status })}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Row 3: Client overview + Sprints ───────────────────────── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Client cards — 2 cols */}
        <div className="col-span-2">
          <SectionHead title="Clientes" count={byClient.length} />
          <div className="grid grid-cols-3 gap-3">
            {byClient.map(({ client, total: ct, done, pct, atRisk, copy, trafico, tech, admin }) => (
              <button
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="rounded-xl p-4 text-left card-hover relative overflow-hidden group"
                style={{
                  backgroundColor: '#161616',
                  border: atRisk ? `1px solid rgba(239,68,68,0.35)` : `1px solid ${client.color}20`,
                }}
              >
                {/* Color top stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
                  style={{ backgroundColor: atRisk ? '#ef4444' : client.color }}
                />
                {/* At-risk badge */}
                {atRisk && (
                  <div
                    className="absolute top-3 right-3 text-[8px] font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                  >
                    EN RIESGO
                  </div>
                )}

                <div className="flex items-center justify-between mt-1 mb-3">
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#f5f5f5' }}>{client.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: '#6b6b6b' }}>
                      {done}/{ct} tareas
                    </p>
                  </div>
                  <div className="relative">
                    <ProgressRing value={done} max={ct} color={atRisk ? '#ef4444' : client.color} size={44} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[9px] font-bold tabular-nums" style={{ color: atRisk ? '#ef4444' : client.color }}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Area breakdown */}
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { key: 'C', count: copy, color: AREA_COLORS.copy },
                    { key: 'T', count: trafico, color: AREA_COLORS.trafico },
                    { key: 'D', count: tech, color: AREA_COLORS.tech },
                    { key: 'A', count: admin, color: AREA_COLORS.admin },
                  ].map(({ key, count, color }) => (
                    <div key={key} className="text-center">
                      <div className="text-[9px] font-bold" style={{ color: count > 0 ? color : '#262626' }}>{count}</div>
                      <div className="text-[8px]" style={{ color: '#585858' }}>{key}</div>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sprint progress — 1 col */}
        <div>
          <SectionHead title="Sprints" />
          <div className="space-y-2.5">
            {([1, 2, 3, 4] as const).map(w => {
              const meta = SPRINT_META[w]
              const wt = tasks.filter(t => t.week === w)
              const wd = wt.filter(t => t.status === 'completado').length
              const wpct = wt.length > 0 ? (wd / wt.length) * 100 : 0
              return (
                <div
                  key={w}
                  className="rounded-xl p-3.5"
                  style={{
                    backgroundColor: '#161616',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: meta.color, boxShadow: `0 0 6px ${meta.color}` }}
                      />
                      <span className="text-xs font-semibold" style={{ color: '#f5f5f5' }}>{meta.label}</span>
                    </div>
                    <span className="text-[10px] font-bold tabular-nums" style={{ color: meta.color }}>
                      {wd}/{wt.length}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${wpct}%`,
                        background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)`,
                        transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    />
                  </div>
                  <p className="text-[10px]" style={{ color: '#6b6b6b' }}>
                    {meta.sub} · <span style={{ color: '#a1a1a1' }}>{meta.owner}</span>
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Row 4: Area breakdown + Team capacity ──────────────────── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Area breakdown */}
        <div>
          <SectionHead title="Por área" />
          <div className="space-y-2">
            {byArea.map(({ area, total: at, done, inProgress }) => {
              const color = AREA_COLORS[area]
              const donePct = at > 0 ? (done / at) * 100 : 0
              const inPct = at > 0 ? (inProgress / at) * 100 : 0
              return (
                <div
                  key={area}
                  className="rounded-xl p-3.5 flex items-center gap-3"
                  style={{
                    backgroundColor: '#161616',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                    style={{
                      backgroundColor: `${color}15`,
                      color,
                      border: `1px solid ${color}28`,
                    }}
                  >
                    {at}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium" style={{ color: '#d0d3ea' }}>
                        {AREA_LABELS[area]}
                      </span>
                      <span className="text-[10px] font-medium" style={{ color: '#6b6b6b' }}>
                        {done}/{at} · {Math.round(donePct)}%
                      </span>
                    </div>
                    {/* Stacked bar: done + in progress + pending */}
                    <div className="flex h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                      <div className="h-full" style={{ width: `${donePct}%`, backgroundColor: '#22c55e', transition: 'width 0.6s' }} />
                      <div className="h-full" style={{ width: `${inPct}%`, backgroundColor: color, opacity: 0.7, transition: 'width 0.6s' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Team capacity */}
        <div>
          <SectionHead title="Carga del equipo" count={ASSIGNEES.length} />
          <div className="space-y-2">
            {byAssignee.map(({ name, total: nt, pendiente, enProgreso: ep, completado, revision }) => {
              const color = ASSIGNEE_COLORS[name] || '#6b7280'
              const utilizationPct = nt > 0 ? Math.round(((ep + revision) / nt) * 100) : 0
              const donePct = nt > 0 ? (completado / nt) * 100 : 0
              const inPct = nt > 0 ? (ep / nt) * 100 : 0
              const revPct = nt > 0 ? (revision / nt) * 100 : 0
              const pendPct = nt > 0 ? (pendiente / nt) * 100 : 0
              return (
                <div
                  key={name}
                  className="rounded-xl p-3.5"
                  style={{
                    backgroundColor: '#161616',
                    border: `1px solid ${color}18`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${color}28, ${color}10)`,
                        color,
                        border: `1px solid ${color}38`,
                      }}
                    >
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-none" style={{ color: '#f5f5f5' }}>{name}</p>
                      <p className="text-[10px] mt-0.5 truncate" style={{ color: '#a1a1a1' }}>
                        {ASSIGNEE_ROLE[name] || ''}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[9px]" style={{ color: '#6b6b6b' }}>
                          {nt} tareas · {utilizationPct}% activo
                        </span>
                        {(ASSIGNEE_AREAS[name] || []).map(a => (
                          <span
                            key={a}
                            className="text-[9px] px-1.5 py-px rounded font-semibold uppercase tracking-wide"
                            style={{
                              backgroundColor: `${AREA_COLORS[a as Area]}15`,
                              color: AREA_COLORS[a as Area],
                              border: `1px solid ${AREA_COLORS[a as Area]}28`,
                            }}
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {completado > 0 && <span className="text-[10px] font-medium" style={{ color: '#22c55e' }}>✓{completado}</span>}
                      {ep > 0 && <span className="text-[10px] font-medium" style={{ color }}>◷{ep}</span>}
                      {revision > 0 && <span className="text-[10px] font-medium" style={{ color: '#f59e0b' }}>⟳{revision}</span>}
                      {pendiente > 0 && <span className="text-[10px]" style={{ color: '#585858' }}>○{pendiente}</span>}
                    </div>
                  </div>
                  {/* Stacked bar */}
                  <div className="flex h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                    {donePct > 0 && <div className="h-full" style={{ width: `${donePct}%`, backgroundColor: '#22c55e' }} />}
                    {inPct > 0 && <div className="h-full" style={{ width: `${inPct}%`, backgroundColor: color }} />}
                    {revPct > 0 && <div className="h-full" style={{ width: `${revPct}%`, backgroundColor: '#f59e0b' }} />}
                    {pendPct > 0 && <div className="h-full" style={{ width: `${pendPct}%`, backgroundColor: 'rgba(255,255,255,0.06)' }} />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Row 5: At-risk clients warning (if any) ────────────────── */}
      {atRiskClients.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.05) 0%, #161616 60%)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={13} style={{ color: '#ef4444' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#ef4444' }}>
              Clientes en riesgo — menos del 25% completado
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {atRiskClients.map(({ client, pct, total: ct }) => (
              <button
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg card-hover"
                style={{
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: client.color }} />
                <span className="text-xs font-semibold" style={{ color: '#f5f5f5' }}>{client.name}</span>
                <span className="text-[10px]" style={{ color: '#ef4444' }}>{pct}% · {ct} tareas</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Row 6: Recent activity ─────────────────────────────────── */}
      <div>
        <SectionHead title="Actividad reciente" count={recent.length} />
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: '#161616',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {recent.map((task, i) => (
            <div
              key={task.id}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors cursor-pointer"
              onClick={() => ctx?.openTaskDetail?.(task)}
              style={{
                borderBottom: i < recent.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              }}
            >
              <ClientBadge client={task.client} size="xs" />
              <span className="flex-1 text-xs truncate font-medium" style={{ color: '#e0e0e0' }}>
                {task.title}
              </span>
              <AreaBadge area={task.area} size="xs" />
              <AssigneeAvatar name={task.assignee} size="sm" />
              <StatusSelect
                status={task.status}
                onChange={status => updateStatus.mutate({ id: task.id, status })}
              />
              <span className="text-[10px] shrink-0 hidden lg:block" style={{ color: '#585858' }}>
                {formatDistanceToNow(new Date(task.updated_at), { locale: es, addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
