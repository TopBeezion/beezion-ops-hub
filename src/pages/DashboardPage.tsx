import { useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useCampaigns } from '../hooks/useCampaigns'
import { useOutletContext, useNavigate } from 'react-router-dom'
import type { Task, Client, Area } from '../types'
import { AREA_LABELS, AREA_COLORS, STATUS_COLORS, ASSIGNEE_COLORS } from '../lib/constants'
import {
  Flame, Zap, CheckCircle2, Clock, TrendingUp,
  Users, BarChart3, ChevronRight, Circle, Layers, Activity,
} from 'lucide-react'

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#F0F2F8',
  card: '#FFFFFF',
  border: '#E4E7F0',
  text: '#1A1D27',
  sub: '#5A5E72',
  muted: '#9699B0',
  accent: '#6366F1',
  red: '#E2445C',
  orange: '#F59E0B',
  green: '#10B981',
  blue: '#3B82F6',
  purple: '#8B5CF6',
}

function card(extra?: React.CSSProperties): React.CSSProperties {
  return {
    backgroundColor: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 0 0 0 transparent',
    overflow: 'hidden',
    ...extra,
  }
}

// ─── KPI Card — horizontal compact ───────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, onClick }: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; color: string; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="hover:shadow-md transition-all duration-200"
      style={{ ...card(), padding: '14px 18px', cursor: onClick ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 14 }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
        background: `linear-gradient(135deg, ${color}22, ${color}10)`,
        border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={color} />
      </div>
      <div className="min-w-0">
        <p style={{ fontSize: 24, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>{value}</p>
        <p style={{ fontSize: 11, fontWeight: 600, color: C.sub, marginTop: 2 }}>{label}</p>
        {sub && <p style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{sub}</p>}
      </div>
      {onClick && <ChevronRight size={14} color={C.muted} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, sub, color = C.accent, action, onAction }: {
  icon: React.ElementType; title: string; sub?: string; color?: string
  action?: string; onAction?: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          backgroundColor: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={13} color={color} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{title}</p>
          {sub && <p style={{ fontSize: 10, color: C.muted }}>{sub}</p>}
        </div>
      </div>
      {action && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 hover:opacity-80 transition-opacity"
          style={{ fontSize: 11, fontWeight: 600, color: color }}
        >
          {action} <ChevronRight size={11} />
        </button>
      )}
    </div>
  )
}

// ─── Bombero row ──────────────────────────────────────────────────────────────
function BomberoRow({ task, onClick }: { task: Task; onClick?: () => void }) {
  const clientColor = (task.client as Client & { color: string })?.color || C.red
  const isUrgent = task.tipo === 'urgente'
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 cursor-pointer transition-colors"
      style={{ borderBottom: `1px solid ${C.border}`, borderLeft: `3px solid ${isUrgent ? C.red : C.orange}` }}
      onClick={onClick}
    >
      <div style={{ flexShrink: 0 }}>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.04em',
          color: isUrgent ? C.red : C.orange,
          backgroundColor: isUrgent ? '#E2445C15' : '#F59E0B15',
          padding: '2px 5px', borderRadius: 4,
        }}>
          {isUrgent ? 'URG' : 'PREV'}
        </span>
      </div>
      <p style={{ fontSize: 12, fontWeight: 500, color: C.text, flex: 1, lineHeight: 1.3 }} className="truncate">
        {task.title}
      </p>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {task.client && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: clientColor,
            backgroundColor: `${clientColor}15`, padding: '1px 5px', borderRadius: 3,
          }}>
            {(task.client as Client).name}
          </span>
        )}
        <div style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          backgroundColor: `${ASSIGNEE_COLORS[task.assignee] || C.muted}25`,
          color: ASSIGNEE_COLORS[task.assignee] || C.muted,
          fontSize: 8, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {task.assignee.slice(0, 2).toUpperCase()}
        </div>
      </div>
    </div>
  )
}

// ─── In-progress row ──────────────────────────────────────────────────────────
function ProgressRow({ task, onClick }: { task: Task; onClick?: () => void }) {
  const clientColor = (task.client as Client & { color: string })?.color || C.muted
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors"
      onClick={onClick}
      style={{ borderBottom: `1px solid ${C.border}` }}
    >
      <Circle size={7} color={C.blue} fill={C.blue} className="shrink-0" />
      <p style={{ fontSize: 12, color: C.text, flex: 1 }} className="truncate">{task.title}</p>
      {task.client && (
        <span style={{
          fontSize: 9, fontWeight: 700, color: clientColor,
          backgroundColor: `${clientColor}15`, padding: '1px 5px', borderRadius: 3, flexShrink: 0,
        }}>
          {(task.client as Client).name}
        </span>
      )}
    </div>
  )
}

// ─── Client card ──────────────────────────────────────────────────────────────
function ClientCard({ client, total, done, inProg, pending, pct, activeCampaigns, onClick }: {
  client: Client; total: number; done: number; inProg: number; pending: number
  pct: number; activeCampaigns: number; onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="hover:shadow-md transition-all duration-200 cursor-pointer"
      style={{
        ...card(),
        padding: 0,
        borderTop: `3px solid ${client.color}`,
      }}
    >
      {/* Header */}
      <div style={{ padding: '12px 14px 8px' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: client.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{client.name}</span>
          </div>
          <div className="flex items-center gap-1">
            {activeCampaigns > 0 && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: client.color,
                backgroundColor: `${client.color}15`, padding: '2px 6px', borderRadius: 4,
              }}>
                {activeCampaigns} camp.
              </span>
            )}
            <span style={{ fontSize: 9, color: C.muted }}>{total} tasks</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg, ${client.color}, ${client.color}CC)`,
            borderRadius: 3, transition: 'width 0.5s ease',
          }} />
        </div>
        {pct > 0 && (
          <p style={{ fontSize: 9, color: C.muted, marginTop: 3, textAlign: 'right' }}>{pct}% completado</p>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid ${C.border}` }}>
        {[
          { label: 'Progreso', value: inProg, color: C.blue },
          { label: 'Pendiente', value: pending, color: C.orange },
          { label: 'Hecho', value: done, color: C.green },
        ].map(({ label, value, color }, i) => (
          <div
            key={label}
            style={{
              padding: '8px 0', textAlign: 'center',
              borderRight: i < 2 ? `1px solid ${C.border}` : 'none',
            }}
          >
            <p style={{ fontSize: 16, fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 8, color: C.muted, fontWeight: 600, marginTop: 2, letterSpacing: '0.04em' }}>{label.toUpperCase()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: clients = [] } = useClients()
  const { data: campaigns = [] } = useCampaigns()
  const navigate = useNavigate()
  const ctx = useOutletContext<{ openNewTask?: () => void; openTaskDetail?: (t: Task) => void }>()

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completado').length
    const inProgress = tasks.filter(t => t.status === 'en_progreso').length
    const pending = tasks.filter(t => t.status === 'pendiente').length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, inProgress, pending, pct }
  }, [tasks])

  const bomberos = useMemo(() => tasks
    .filter(t => t.tipo === 'urgente' || (t.tipo === 'pendiente_anterior' && t.priority === 'alta'))
    .sort((a, b) => (a.tipo === 'urgente' ? 0 : 1) - (b.tipo === 'urgente' ? 0 : 1))
    .slice(0, 7),
  [tasks])

  const inProgressTasks = useMemo(() => tasks.filter(t => t.status === 'en_progreso').slice(0, 6), [tasks])

  const clientStats = useMemo(() => clients
    .map(client => {
      const ct = tasks.filter(t => t.client_id === client.id)
      const done = ct.filter(t => t.status === 'completado').length
      const inProg = ct.filter(t => t.status === 'en_progreso').length
      const pending = ct.filter(t => t.status === 'pendiente').length
      const pct = ct.length > 0 ? Math.round((done / ct.length) * 100) : 0
      const activeCampaigns = campaigns.filter(c => c.client_id === client.id && c.status === 'activa').length
      return { client, total: ct.length, done, inProg, pending, pct, activeCampaigns }
    })
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total),
  [clients, tasks, campaigns])

  const copyMetrics = useMemo(() => {
    let hooks = 0, cta = 0, body = 0, scripts = 0, lm = 0
    for (const t of tasks) {
      if (!t.deliverables) continue
      hooks   += t.deliverables.hooks ?? 0
      cta     += t.deliverables.cta ?? 0
      body    += t.deliverables.body_copy ?? 0
      scripts += t.deliverables.scripts_video ?? 0
      lm      += t.deliverables.lead_magnet_pdf ?? 0
    }
    return { hooks, cta, body, scripts, lm }
  }, [tasks])

  const areaStats = useMemo(() => (['copy', 'trafico', 'tech', 'admin'] as Area[]).map(area => {
    const at = tasks.filter(t => t.area === area)
    return { area, total: at.length, done: at.filter(t => t.status === 'completado').length }
  }).filter(a => a.total > 0), [tasks])

  const teamStats = useMemo(() => {
    const map: Record<string, { total: number; done: number; inProg: number }> = {}
    for (const t of tasks) {
      if (!map[t.assignee]) map[t.assignee] = { total: 0, done: 0, inProg: 0 }
      map[t.assignee].total++
      if (t.status === 'completado') map[t.assignee].done++
      if (t.status === 'en_progreso') map[t.assignee].inProg++
    }
    return Object.entries(map).map(([name, s]) => ({ name, ...s })).sort((a, b) => b.total - a.total)
  }, [tasks])

  const activeCampaignsCount = campaigns.filter(c => c.status === 'activa').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96" style={{ backgroundColor: C.bg }}>
        <div className="w-7 h-7 rounded-full border-2 border-transparent border-t-current animate-spin" style={{ color: C.accent }} />
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── KPIs ─────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        <KpiCard icon={Layers}       label="Tareas totales"    value={stats.total}       sub={`${stats.pct}% completadas`}    color={C.accent}  />
        <KpiCard icon={Activity}     label="En progreso"       value={stats.inProgress}  sub="activas ahora"                  color={C.blue}    />
        <KpiCard icon={CheckCircle2} label="Completadas"       value={stats.completed}   sub={`de ${stats.total} total`}      color={C.green}   />
        <KpiCard icon={Clock}        label="Pendientes"        value={stats.pending}     sub="sin iniciar"                    color={C.orange}  />
        <KpiCard icon={Zap}          label="Campañas activas"  value={activeCampaignsCount} sub="en curso"                   color={C.purple}  onClick={() => navigate('/campaigns')} />
      </div>

      {/* ── BOMBEROS + EN PROGRESO ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 14 }}>

        {/* Bomberos */}
        <div style={card()}>
          <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${C.border}` }}>
            <SectionHeader
              icon={Flame} title="🔥 Bomberos — Incendios del día"
              sub={`${bomberos.length} urgentes activos`} color={C.red}
              action="Ver todos" onAction={() => navigate('/bomberos')}
            />
          </div>
          {bomberos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 size={24} color={C.green} />
              <p style={{ color: C.sub, fontSize: 12, marginTop: 8, fontWeight: 500 }}>Sin incendios activos 🎉</p>
            </div>
          ) : (
            bomberos.map(t => (
              <BomberoRow key={t.id} task={t} onClick={() => ctx?.openTaskDetail?.(t)} />
            ))
          )}
        </div>

        {/* En Progreso */}
        <div style={card()}>
          <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${C.border}` }}>
            <SectionHeader
              icon={Activity} title="En progreso ahora"
              sub={`${stats.inProgress} tareas activas`} color={C.blue}
              action="Ver Kanban" onAction={() => navigate('/kanban')}
            />
          </div>
          {inProgressTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Clock size={24} color={C.muted} />
              <p style={{ color: C.sub, fontSize: 12, marginTop: 8 }}>Nada en progreso aún</p>
            </div>
          ) : (
            inProgressTasks.map(t => (
              <ProgressRow key={t.id} task={t} onClick={() => ctx?.openTaskDetail?.(t)} />
            ))
          )}
        </div>
      </div>

      {/* ── CLIENTES ──────────────────────────────────────────────────────────── */}
      {clientStats.length > 0 && (
        <div>
          <SectionHeader icon={Users} title="Estado por cliente" sub={`${clientStats.length} clientes con tareas activas`} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {clientStats.map(s => (
              <ClientCard key={s.client.id} {...s} onClick={() => navigate(`/clients/${s.client.id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* ── MÉTRICAS BOTTOM ROW ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr 1.2fr', gap: 14 }}>

        {/* Copy Production */}
        <div style={card({ padding: 18 })}>
          <SectionHeader icon={BarChart3} title="Producción de copy acumulada" sub="Entregables creados en total" color={C.purple} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {[
              { label: 'Hooks de video', value: copyMetrics.hooks, color: C.purple },
              { label: 'CTAs',           value: copyMetrics.cta,   color: C.orange },
              { label: 'Body copy',      value: copyMetrics.body,  color: C.blue },
              { label: 'Scripts video',  value: copyMetrics.scripts, color: '#EC4899' },
              { label: 'Lead magnets',   value: copyMetrics.lm,    color: C.green },
            ].map(({ label, value, color }) => {
              const max = Math.max(copyMetrics.hooks, copyMetrics.cta, copyMetrics.body, copyMetrics.scripts, copyMetrics.lm, 1)
              return (
                <div key={label}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: C.sub, fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
                  </div>
                  <div style={{ height: 4, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(value / max) * 100}%`, backgroundColor: color, borderRadius: 3 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Por Área */}
        <div style={card({ padding: 18 })}>
          <SectionHeader icon={TrendingUp} title="Por área" sub="Distribución de tareas" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            {areaStats.map(({ area, total, done }) => {
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              const color = AREA_COLORS[area]
              return (
                <div key={area} className="flex items-center gap-2">
                  <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="flex justify-between" style={{ marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.sub }}>{AREA_LABELS[area]}</span>
                      <span style={{ fontSize: 10, color: C.muted }}>{done}/{total}</span>
                    </div>
                    <div style={{ height: 4, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 3 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color, minWidth: 28, textAlign: 'right' }}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Equipo */}
        <div style={card({ padding: 18 })}>
          <SectionHeader icon={Users} title="Carga del equipo" sub="Tareas por persona" color={C.orange} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {teamStats.slice(0, 7).map(({ name, total, done, inProg }) => {
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              const color = ASSIGNEE_COLORS[name] || C.muted
              return (
                <div key={name} className="flex items-center gap-2">
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${color}30, ${color}15)`,
                    color, fontSize: 9, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${color}25`,
                  }}>
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.text }} className="truncate">{name}</span>
                      <div className="flex gap-1.5 flex-shrink-0">
                        {inProg > 0 && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: C.blue, backgroundColor: `${C.blue}15`, padding: '1px 4px', borderRadius: 3 }}>{inProg} act.</span>
                        )}
                        <span style={{ fontSize: 9, color: C.muted }}>{total}</span>
                      </div>
                    </div>
                    <div style={{ height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}AA)`, borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
