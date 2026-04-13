import { useMemo, useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useCampaigns } from '../hooks/useCampaigns'
import { useOutletContext, useNavigate } from 'react-router-dom'
import type { Task, Client, Area } from '../types'
import { AREA_LABELS, AREA_COLORS, ASSIGNEE_COLORS, STATUS_LABELS, STATUS_COLORS, TEAM_MEMBERS, TEAM_ROLES } from '../lib/constants'
import {
  Flame, Zap, CheckCircle2, Clock, TrendingUp,
  Users, BarChart3, ChevronRight, Circle, Layers, Activity,
  UserCircle2,
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
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    ...extra,
  }
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, onClick }: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; color: string; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="hover:shadow-md transition-all duration-200"
      style={{ ...card(), padding: '16px 18px', cursor: onClick ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 14 }}
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
function BomberoRow({ task, onClick, isLast }: { task: Task; onClick?: () => void; isLast?: boolean }) {
  const clientColor = (task.client as Client & { color: string })?.color || C.red
  const statusColor = STATUS_COLORS[task.status] || C.muted
  const assigneeColor = ASSIGNEE_COLORS[task.assignee] || C.muted
  const isInProgress = task.status === 'en_progreso'

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-all"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px',
        borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
        borderLeft: `3px solid ${statusColor}`,
        backgroundColor: 'transparent',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F7F8FC'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
    >
      {/* Status dot */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        backgroundColor: statusColor,
        boxShadow: isInProgress ? `0 0 5px ${statusColor}80` : 'none',
      }} />

      {/* Title */}
      <p style={{ fontSize: 12, fontWeight: 600, color: C.text, flex: 1, lineHeight: 1.3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {task.title}
      </p>

      {/* Client + assignee */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {task.client && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: clientColor,
            backgroundColor: `${clientColor}12`, padding: '2px 7px', borderRadius: 4,
            border: `1px solid ${clientColor}20`,
          }}>
            {(task.client as Client).name}
          </span>
        )}
        <div style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          backgroundColor: `${assigneeColor}20`, color: assigneeColor,
          fontSize: 8, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1.5px solid ${assigneeColor}35`,
        }}>
          {task.assignee.slice(0, 2).toUpperCase()}
        </div>
      </div>
    </div>
  )
}

// ─── In-progress row ──────────────────────────────────────────────────────────
function ProgressRow({ task, onClick, isLast }: { task: Task; onClick?: () => void; isLast?: boolean }) {
  const clientColor = (task.client as Client & { color: string })?.color || C.muted
  const assigneeColor = ASSIGNEE_COLORS[task.assignee] || C.muted
  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-all"
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
        borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
        borderLeft: `3px solid ${C.blue}`,
        backgroundColor: 'transparent',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F7F8FC'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: C.blue, flexShrink: 0, boxShadow: `0 0 5px ${C.blue}60` }} />
      <p style={{ fontSize: 12, fontWeight: 600, color: C.text, flex: 1, lineHeight: 1.3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      {task.client && (
        <span style={{
          fontSize: 9, fontWeight: 700, color: clientColor,
          backgroundColor: `${clientColor}12`, padding: '2px 7px', borderRadius: 4, flexShrink: 0,
          border: `1px solid ${clientColor}20`,
        }}>
          {(task.client as Client).name}
        </span>
      )}
      <div style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        backgroundColor: `${assigneeColor}20`, color: assigneeColor,
        fontSize: 8, fontWeight: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1.5px solid ${assigneeColor}35`,
      }}>
        {task.assignee.slice(0, 2).toUpperCase()}
      </div>
      </div>
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
      style={{ ...card(), padding: 0, borderTop: `3px solid ${client.color}` }}
    >
      {/* Header */}
      <div style={{ padding: '16px 18px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: client.color, flexShrink: 0, boxShadow: `0 0 6px ${client.color}60` }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{client.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {activeCampaigns > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: client.color,
                backgroundColor: `${client.color}12`, padding: '2px 7px', borderRadius: 5,
                border: `1px solid ${client.color}25`,
              }}>
                {activeCampaigns} camp.
              </span>
            )}
            <span style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>{total} tasks</span>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height: 4, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg, ${client.color}, ${client.color}BB)`,
            borderRadius: 4, transition: 'width 0.5s ease',
          }} />
        </div>
        {pct > 0 && (
          <p style={{ fontSize: 10, color: C.muted, marginTop: 5, textAlign: 'right', fontWeight: 500 }}>{pct}% completado</p>
        )}
      </div>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid ${C.border}` }}>
        {[
          { label: 'Progreso', value: inProg, color: C.blue },
          { label: 'Pendiente', value: pending, color: C.orange },
          { label: 'Hecho', value: done, color: C.green },
        ].map(({ label, value, color }, i) => (
          <div key={label} style={{ padding: '10px 0', textAlign: 'center', borderRight: i < 2 ? `1px solid ${C.border}` : 'none' }}>
            <p style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 9, color: C.muted, fontWeight: 600, marginTop: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Mi Vista Chip ────────────────────────────────────────────────────────────
function MemberChip({ name, active, onClick }: { name: string; active: boolean; onClick: () => void }) {
  const color = ASSIGNEE_COLORS[name] || C.muted
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <button
      onClick={onClick}
      title={TEAM_ROLES[name] || name}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 10px 5px 6px',
        borderRadius: 99,
        fontSize: 12, fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
        backgroundColor: active ? color : C.card,
        color: active ? '#fff' : C.sub,
        border: `1.5px solid ${active ? color : C.border}`,
        boxShadow: active ? `0 2px 8px ${color}35` : 'none',
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        backgroundColor: active ? 'rgba(255,255,255,0.25)' : `${color}20`,
        color: active ? '#fff' : color,
        fontSize: 8, fontWeight: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {initials}
      </div>
      {name}
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: clients = [] } = useClients()
  const { data: campaigns = [] } = useCampaigns()
  const navigate = useNavigate()
  const ctx = useOutletContext<{ openNewTask?: () => void; openTaskDetail?: (t: Task) => void }>()

  // ── Mi Vista state ───────────────────────────────────────────────────────
  const [miVista, setMiVista] = useState<string | null>(null)

  // Filter tasks for selected member
  const visibleTasks = useMemo(
    () => miVista ? tasks.filter(t => t.assignee === miVista) : tasks,
    [tasks, miVista]
  )

  // All active members (those who have tasks)
  const activeMembers = useMemo(() => {
    const found = new Set(tasks.map(t => t.assignee).filter(Boolean))
    return TEAM_MEMBERS.filter(m => found.has(m))
  }, [tasks])

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = visibleTasks.length
    const completed = visibleTasks.filter(t => t.status === 'completado').length
    const inProgress = visibleTasks.filter(t => t.status === 'en_progreso').length
    const pending = visibleTasks.filter(t => t.status === 'pendiente').length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, inProgress, pending, pct }
  }, [visibleTasks])

  const bomberos = useMemo(() => visibleTasks
    .filter(t => t.priority === 'alta' && t.status !== 'completado')
    .sort((a, b) => (a.status === 'en_progreso' ? 0 : 1) - (b.status === 'en_progreso' ? 0 : 1))
    .slice(0, 7),
  [visibleTasks])

  const inProgressTasks = useMemo(() => visibleTasks.filter(t => t.status === 'en_progreso').slice(0, 6), [visibleTasks])

  const clientStats = useMemo(() => clients
    .map(client => {
      const ct = visibleTasks.filter(t => t.client_id === client.id)
      const done = ct.filter(t => t.status === 'completado').length
      const inProg = ct.filter(t => t.status === 'en_progreso').length
      const pending = ct.filter(t => t.status === 'pendiente').length
      const pct = ct.length > 0 ? Math.round((done / ct.length) * 100) : 0
      const activeCampaigns = campaigns.filter(c => c.client_id === client.id && c.status === 'activa').length
      return { client, total: ct.length, done, inProg, pending, pct, activeCampaigns }
    })
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total),
  [clients, visibleTasks, campaigns])

  const copyMetrics = useMemo(() => {
    let hooks = 0, cta = 0, body = 0, scripts = 0, lm = 0
    for (const t of visibleTasks) {
      if (!t.deliverables) continue
      hooks   += t.deliverables.hooks ?? 0
      cta     += t.deliverables.cta ?? 0
      body    += t.deliverables.body_copy ?? 0
      scripts += t.deliverables.scripts_video ?? 0
      lm      += t.deliverables.lead_magnet_pdf ?? 0
    }
    return { hooks, cta, body, scripts, lm }
  }, [visibleTasks])

  const areaStats = useMemo(() => (['copy', 'trafico', 'tech', 'admin', 'edicion'] as Area[]).map(area => {
    const at = visibleTasks.filter(t => t.area === area)
    return { area, total: at.length, done: at.filter(t => t.status === 'completado').length }
  }).filter(a => a.total > 0), [visibleTasks])

  const teamStats = useMemo(() => {
    const map: Record<string, { total: number; done: number; inProg: number }> = {}
    for (const t of tasks) {  // always use all tasks for team view
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
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Mi Vista Filter ───────────────────────────────────────────────────── */}
      <div style={{
        ...card({ overflow: 'visible' }),
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div className="flex items-center gap-1.5" style={{ marginRight: 4 }}>
          <UserCircle2 size={14} color={C.accent} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.sub, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Mi Vista
          </span>
        </div>

        {/* "Todos" chip */}
        <button
          onClick={() => setMiVista(null)}
          style={{
            padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
            backgroundColor: miVista === null ? C.accent : C.bg,
            color: miVista === null ? '#fff' : C.sub,
            border: `1.5px solid ${miVista === null ? C.accent : C.border}`,
            boxShadow: miVista === null ? `0 2px 8px ${C.accent}35` : 'none',
          }}
        >
          Todos
        </button>

        {activeMembers.map(member => (
          <MemberChip
            key={member}
            name={member}
            active={miVista === member}
            onClick={() => setMiVista(miVista === member ? null : member)}
          />
        ))}

        {miVista && (
          <span style={{
            marginLeft: 'auto', fontSize: 11, color: C.muted, fontWeight: 500,
          }}>
            {visibleTasks.length} tareas de {miVista}
          </span>
        )}
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
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
          <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${C.red}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flame size={14} color={C.red} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>🔥 Bomberos — Incendios del día</p>
                <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>{bomberos.length} urgentes activos</p>
              </div>
            </div>
            <button onClick={() => navigate('/bomberos')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: C.red, background: 'none', border: 'none', cursor: 'pointer' }}>
              Ver todos <ChevronRight size={11} />
            </button>
          </div>
          {bomberos.length === 0 ? (
            <div className="flex flex-col items-center justify-center" style={{ padding: '32px 0' }}>
              <CheckCircle2 size={26} color={C.green} />
              <p style={{ color: C.sub, fontSize: 12, marginTop: 10, fontWeight: 500 }}>
                {miVista ? `Sin incendios para ${miVista} 🎉` : 'Sin incendios activos 🎉'}
              </p>
            </div>
          ) : (
            <div>
              {bomberos.map((t, i) => (
                <BomberoRow key={t.id} task={t} isLast={i === bomberos.length - 1} onClick={() => ctx?.openTaskDetail?.(t)} />
              ))}
            </div>
          )}
        </div>

        {/* En Progreso */}
        <div style={card()}>
          <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${C.blue}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={14} color={C.blue} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>En progreso ahora</p>
                <p style={{ fontSize: 10, color: C.muted, margin: 0 }}>{stats.inProgress} tareas activas</p>
              </div>
            </div>
            <button onClick={() => navigate('/kanban')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: C.blue, background: 'none', border: 'none', cursor: 'pointer' }}>
              Ver Kanban <ChevronRight size={11} />
            </button>
          </div>
          {inProgressTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center" style={{ padding: '32px 0' }}>
              <Clock size={26} color={C.muted} />
              <p style={{ color: C.sub, fontSize: 12, marginTop: 10 }}>Nada en progreso aún</p>
            </div>
          ) : (
            <div>
              {inProgressTasks.map((t, i) => (
                <ProgressRow key={t.id} task={t} isLast={i === inProgressTasks.length - 1} onClick={() => ctx?.openTaskDetail?.(t)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CLIENTES ──────────────────────────────────────────────────────────── */}
      {clientStats.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 2 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${C.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={14} color={C.accent} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0, lineHeight: 1.2 }}>Estado por cliente</p>
              <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{clientStats.length} clientes con tareas activas</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {clientStats.map(s => (
              <ClientCard key={s.client.id} {...s} onClick={() => navigate(`/clients/${s.client.id}`)} />
            ))}
          </div>
        </div>
      )}

      {/* ── MÉTRICAS BOTTOM ROW ───────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.9fr 1.2fr', gap: 14, paddingBottom: 16 }}>

        {/* Copy Production */}
        <div style={card({ padding: '18px 18px 16px' })}>
          <SectionHeader icon={BarChart3} title="Producción de copy acumulada" sub="Entregables creados en total" color={C.purple} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
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
            {areaStats.length === 0 ? (
              <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', padding: '12px 0' }}>Sin datos</p>
            ) : areaStats.map(({ area, total, done }) => {
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
              const isActive = miVista === name
              return (
                <div
                  key={name}
                  className="flex items-center gap-2 cursor-pointer rounded-lg transition-all"
                  style={{
                    padding: '4px 6px', margin: '-4px -6px',
                    backgroundColor: isActive ? `${color}10` : 'transparent',
                    border: isActive ? `1px solid ${color}25` : '1px solid transparent',
                  }}
                  onClick={() => setMiVista(miVista === name ? null : name)}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${color}30, ${color}15)`,
                    color, fontSize: 9, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${isActive ? color + '60' : color + '25'}`,
                  }}>
                    {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 600, color: isActive ? color : C.text }} className="truncate">{name}</span>
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
