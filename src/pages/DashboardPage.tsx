import { useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useCampaigns } from '../hooks/useCampaigns'
import { useOutletContext, useNavigate } from 'react-router-dom'
import type { Task, Client, Area } from '../types'
import {
  AREA_LABELS, AREA_COLORS, STATUS_COLORS, ASSIGNEE_COLORS,
} from '../lib/constants'
import {
  Flame, Zap, AlertTriangle, CheckCircle2, Clock, TrendingUp,
  Users, BarChart3, ChevronRight, Circle, Layers, Activity,
} from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#F6F7FB',
  card: '#FFFFFF',
  border: '#E6E9EF',
  text: '#1F2128',
  sub: '#676879',
  muted: '#9699A6',
  accent: '#6366F1',
  red: '#E2445C',
  orange: '#FDAB3D',
  green: '#00C875',
  blue: '#579BFC',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function card(extra?: React.CSSProperties): React.CSSProperties {
  return {
    backgroundColor: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    ...extra,
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color, onClick,
}: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; color: string; onClick?: () => void
}) {
  return (
    <div
      style={{ ...card(), padding: 20, cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
      className="hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <p style={{ fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginTop: 4 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

function SectionTitle({ icon: Icon, title, sub, color = C.accent }: {
  icon: React.ElementType; title: string; sub?: string; color?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={14} color={color} />
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</p>
        {sub && <p style={{ fontSize: 11, color: C.muted }}>{sub}</p>}
      </div>
    </div>
  )
}

function BomberoCard({ task, onClick }: { task: Task; onClick?: () => void }) {
  const clientColor = (task.client as Client & { color: string })?.color || '#E2445C'
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 cursor-pointer transition-colors"
      style={{ borderLeft: `3px solid ${clientColor}` }}
      onClick={onClick}
    >
      <Flame size={14} color="#E2445C" className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 13, fontWeight: 600, color: C.text }} className="truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.client && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: clientColor,
              backgroundColor: `${clientColor}15`,
              padding: '1px 6px', borderRadius: 4,
            }}>
              {(task.client as Client).name}
            </span>
          )}
          <span style={{ fontSize: 10, color: C.muted }}>{task.assignee}</span>
        </div>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, color: '#E2445C',
        backgroundColor: '#E2445C15', padding: '2px 8px', borderRadius: 6,
      }}>
        URGENTE
      </span>
    </div>
  )
}

function TaskRow({ task, onClick }: { task: Task; onClick?: () => void }) {
  const statusColor = STATUS_COLORS[task.status]
  const clientColor = (task.client as Client & { color: string })?.color || C.muted
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
      style={{ borderBottom: `1px solid ${C.border}` }}
    >
      <Circle size={8} color={statusColor} fill={statusColor} className="shrink-0" />
      <p style={{ fontSize: 13, color: C.text, flex: 1 }} className="truncate">{task.title}</p>
      {task.client && (
        <span style={{
          fontSize: 10, fontWeight: 600, color: clientColor,
          backgroundColor: `${clientColor}15`, padding: '1px 6px', borderRadius: 4, flexShrink: 0,
        }}>
          {(task.client as Client).name}
        </span>
      )}
      <span style={{
        fontSize: 10, fontWeight: 600, color: ASSIGNEE_COLORS[task.assignee] || C.muted,
        flexShrink: 0, minWidth: 60, textAlign: 'right',
      }}>
        {task.assignee}
      </span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: clients = [] } = useClients()
  const { data: campaigns = [] } = useCampaigns()
  const navigate = useNavigate()
  const ctx = useOutletContext<{
    openNewTask?: () => void
    openTaskDetail?: (task: Task) => void
  }>()

  // ── Computed ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completado').length
    const inProgress = tasks.filter(t => t.status === 'en_progreso').length
    const urgent = tasks.filter(t => t.tipo === 'urgente').length
    const pending = tasks.filter(t => t.status === 'pendiente').length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, inProgress, urgent, pending, pct }
  }, [tasks])

  // Bomberos: urgent tasks and prev-pending high priority
  const bomberos = useMemo(() => tasks
    .filter(t => t.tipo === 'urgente' || (t.tipo === 'pendiente_anterior' && t.priority === 'alta'))
    .sort((a, b) => (a.tipo === 'urgente' ? -1 : 1) - (b.tipo === 'urgente' ? -1 : 1))
    .slice(0, 8),
  [tasks])

  // Recent in-progress tasks
  const inProgressTasks = useMemo(() => tasks
    .filter(t => t.status === 'en_progreso')
    .slice(0, 6),
  [tasks])

  // Client cards
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
    .sort((a, b) => b.inProg - a.inProg),
  [clients, tasks, campaigns])

  // Copy production totals
  const copyMetrics = useMemo(() => {
    let hooks = 0, cta = 0, body = 0, scripts = 0, lm = 0
    for (const t of tasks) {
      if (!t.deliverables) continue
      hooks  += t.deliverables.hooks ?? 0
      cta    += t.deliverables.cta ?? 0
      body   += t.deliverables.body_copy ?? 0
      scripts += t.deliverables.scripts_video ?? 0
      lm     += t.deliverables.lead_magnet_pdf ?? 0
    }
    return { hooks, cta, body, scripts, lm }
  }, [tasks])

  // Area breakdown
  const areaStats = useMemo(() => (['copy', 'trafico', 'tech', 'admin'] as Area[]).map(area => {
    const at = tasks.filter(t => t.area === area)
    return { area, total: at.length, done: at.filter(t => t.status === 'completado').length }
  }), [tasks])

  // Team load
  const teamStats = useMemo(() => {
    const map: Record<string, { total: number; done: number; inProg: number }> = {}
    for (const t of tasks) {
      if (!map[t.assignee]) map[t.assignee] = { total: 0, done: 0, inProg: 0 }
      map[t.assignee].total++
      if (t.status === 'completado') map[t.assignee].done++
      if (t.status === 'en_progreso') map[t.assignee].inProg++
    }
    return Object.entries(map)
      .map(([name, s]) => ({ name, ...s }))
      .filter(m => m.total > 0)
      .sort((a, b) => b.inProg - a.inProg)
  }, [tasks])

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96" style={{ backgroundColor: C.bg }}>
        <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-current animate-spin" style={{ color: C.accent }} />
      </div>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6 space-y-6" style={{ backgroundColor: C.bg }}>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        <KpiCard label="Tareas totales"   value={stats.total}     sub={`${stats.pct}% completadas`}    icon={Layers}       color={C.accent} />
        <KpiCard label="En progreso"      value={stats.inProgress} sub="activas ahora"                 icon={Activity}     color={C.blue} />
        <KpiCard label="Completadas"      value={stats.completed}  sub={`de ${stats.total}`}           icon={CheckCircle2} color={C.green} />
        <KpiCard label="Pendientes"       value={stats.pending}    sub="sin iniciar"                   icon={Clock}        color={C.orange} />
        <KpiCard label="Campañas activas" value={campaigns.filter(c => c.status === 'activa').length} sub="en curso" icon={Zap} color="#8B5CF6" onClick={() => navigate('/campaigns')} />
      </div>

      {/* ── BOMBEROS + EN PROGRESO ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Bomberos */}
        <div style={card()}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
            <SectionTitle icon={Flame} title="🔥 Bomberos — Incendios del día" sub="Urgentes y prev-pendientes con prioridad alta" color="#E2445C" />
          </div>
          {bomberos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <CheckCircle2 size={28} color={C.green} />
              <p style={{ color: C.sub, fontSize: 13, marginTop: 8 }}>Sin incendios activos 🎉</p>
            </div>
          ) : (
            <div>
              {bomberos.map(t => (
                <BomberoCard key={t.id} task={t} onClick={() => ctx?.openTaskDetail?.(t)} />
              ))}
              {bomberos.length >= 8 && (
                <button
                  onClick={() => navigate('/backlog')}
                  className="flex items-center gap-1 w-full justify-center py-2.5 text-xs font-semibold hover:bg-gray-50 transition-colors"
                  style={{ color: C.accent, borderTop: `1px solid ${C.border}` }}
                >
                  Ver todos <ChevronRight size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* En Progreso */}
        <div style={card()}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
            <SectionTitle icon={Activity} title="En progreso ahora" sub={`${stats.inProgress} tareas activas`} color={C.blue} />
          </div>
          {inProgressTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Clock size={28} color={C.muted} />
              <p style={{ color: C.sub, fontSize: 13, marginTop: 8 }}>Nada en progreso aún</p>
            </div>
          ) : (
            <div>
              {inProgressTasks.map(t => (
                <TaskRow key={t.id} task={t} onClick={() => ctx?.openTaskDetail?.(t)} />
              ))}
              <button
                onClick={() => navigate('/kanban')}
                className="flex items-center gap-1 w-full justify-center py-2.5 text-xs font-semibold hover:bg-gray-50 transition-colors"
                style={{ color: C.accent, borderTop: `1px solid ${C.border}` }}
              >
                Ver Kanban <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── CLIENTES ─────────────────────────────────────────────────────── */}
      <div>
        <SectionTitle icon={Users} title="Estado por cliente" sub={`${clientStats.length} clientes activos`} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {clientStats.map(({ client, total, done, inProg, pending, pct, activeCampaigns }) => (
            <div
              key={client.id}
              style={{ ...card(), padding: 16, cursor: 'pointer', borderTop: `3px solid ${client.color}` }}
              className="hover:shadow-md transition-shadow"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: client.color }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{client.name}</span>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: client.color,
                  backgroundColor: `${client.color}15`, padding: '2px 6px', borderRadius: 4,
                }}>
                  {activeCampaigns} camp.
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ height: 4, backgroundColor: C.border, borderRadius: 4, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, backgroundColor: client.color, borderRadius: 4, transition: 'width 0.3s' }} />
              </div>

              <div className="flex justify-between text-center">
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: C.blue }}>{inProg}</p>
                  <p style={{ fontSize: 9, color: C.muted, fontWeight: 600 }}>PROGRESO</p>
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: C.orange }}>{pending}</p>
                  <p style={{ fontSize: 9, color: C.muted, fontWeight: 600 }}>PENDIENTE</p>
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: C.green }}>{done}</p>
                  <p style={{ fontSize: 9, color: C.muted, fontWeight: 600 }}>HECHO</p>
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{pct}%</p>
                  <p style={{ fontSize: 9, color: C.muted, fontWeight: 600 }}>AVANCE</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── COPY PRODUCTION + ÁREAS + EQUIPO ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: 16 }}>

        {/* Copy Production */}
        <div style={card({ padding: 20 })}>
          <SectionTitle icon={BarChart3} title="Producción de copy acumulada" sub="Total de entregables creados" color="#8B5CF6" />
          <div className="space-y-3 mt-2">
            {[
              { label: 'Hooks de video', value: copyMetrics.hooks, color: '#8B5CF6' },
              { label: 'CTAs',           value: copyMetrics.cta,   color: '#F59E0B' },
              { label: 'Body copy',      value: copyMetrics.body,  color: '#3B82F6' },
              { label: 'Scripts video',  value: copyMetrics.scripts, color: '#EC4899' },
              { label: 'Lead magnets',   value: copyMetrics.lm,    color: '#10B981' },
            ].map(({ label, value, color }) => {
              const max = Math.max(copyMetrics.hooks, copyMetrics.cta, copyMetrics.body, copyMetrics.scripts, copyMetrics.lm, 1)
              return (
                <div key={label}>
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
                  </div>
                  <div style={{ height: 5, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(value / max) * 100}%`, backgroundColor: color, borderRadius: 3 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Áreas */}
        <div style={card({ padding: 20 })}>
          <SectionTitle icon={TrendingUp} title="Por área" sub="Carga de trabajo actual" />
          <div className="space-y-3 mt-2">
            {areaStats.filter(a => a.total > 0).map(({ area, total, done }) => {
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              const color = AREA_COLORS[area]
              return (
                <div key={area} className="flex items-center gap-3">
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: color, flexShrink: 0,
                  }} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>{AREA_LABELS[area]}</span>
                      <span style={{ fontSize: 11, color: C.muted }}>{done}/{total}</span>
                    </div>
                    <div style={{ height: 4, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 3 }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Team Load */}
        <div style={card({ padding: 20 })}>
          <SectionTitle icon={Users} title="Carga del equipo" sub="Tareas por persona" color="#F59E0B" />
          <div className="space-y-2 mt-2">
            {teamStats.slice(0, 7).map(({ name, total, done, inProg }) => {
              const pct = total > 0 ? Math.round((done / total) * 100) : 0
              const color = ASSIGNEE_COLORS[name] || C.muted
              return (
                <div key={name} className="flex items-center gap-2">
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    backgroundColor: `${color}20`, color,
                    fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, border: `1px solid ${color}30`,
                  }}>
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{name}</span>
                      <div className="flex gap-1.5">
                        {inProg > 0 && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: C.blue, backgroundColor: `${C.blue}15`, padding: '1px 4px', borderRadius: 3 }}>{inProg} activo</span>
                        )}
                        <span style={{ fontSize: 9, color: C.muted }}>{total} total</span>
                      </div>
                    </div>
                    <div style={{ height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 2 }} />
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
