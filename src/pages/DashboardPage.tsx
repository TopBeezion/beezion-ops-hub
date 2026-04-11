import { useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useTeam } from '../hooks/useTeam'
import { useOutletContext } from 'react-router-dom'
import type { Task, Client, Area, TeamMember } from '../types'
import { AREA_LABELS, AREA_COLORS, STATUS_LABELS, STATUS_COLORS } from '../lib/constants'
import {
  Layers, Activity, CheckCircle2, AlertTriangle, TrendingUp, BarChart3, Users, Zap, Clock
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────
// STYLING CONSTANTS - LIGHT THEME
// ─────────────────────────────────────────────────────────────────────

const COLORS = {
  pageBg: '#F6F7FB',
  cardBg: '#FFFFFF',
  cardBorder: '#E6E9EF',
  textPrimary: '#1F2128',
  textSecondary: '#676879',
  textMuted: '#9699A6',
  accent: '#6366F1',
}

const ACCENT_COLORS = {
  indigo: '#6366F1',
  blue: '#579BFC',
  green: '#00C875',
  red: '#E2445C',
  orange: '#F59E0B',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
}

const TEAM_COLORS: Record<string, string> = {
  'Alejandro': '#8b5cf6',
  'Alec': '#f59e0b',
  'Paula': '#ec4899',
  'Jose Luis': '#3b82f6',
  'Editor 1': '#06b6d4',
  'Editor 2': '#10b981',
  'Editor 3': '#f97316',
}

// ─────────────────────────────────────────────────────────────────────
// COMPONENT: KPI Card
// ─────────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  trend,
  icon: Icon,
  accentColor,
}: {
  label: string
  value: number | string
  trend?: string
  icon: React.ElementType
  accentColor: string
}) {
  return (
    <div
      className="rounded-[12px] p-5 flex flex-col justify-between"
      style={{
        backgroundColor: COLORS.cardBg,
        border: `1px solid ${COLORS.cardBorder}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        minHeight: '140px',
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: COLORS.textMuted }}
          >
            {label}
          </p>
          <p
            className="text-[32px] font-black leading-tight"
            style={{ color: COLORS.textPrimary }}
          >
            {value}
          </p>
          {trend && (
            <p className="text-xs font-medium mt-2" style={{ color: accentColor }}>
              {trend}
            </p>
          )}
        </div>
        <div
          className="p-2 rounded-lg flex-shrink-0"
          style={{
            backgroundColor: `${accentColor}12`,
            border: `1px solid ${accentColor}30`,
          }}
        >
          <Icon size={20} style={{ color: accentColor }} />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// COMPONENT: Section Header
// ─────────────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  icon: Icon,
  count,
}: {
  title: string
  icon?: React.ElementType
  count?: number
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {Icon && <Icon size={18} style={{ color: COLORS.accent }} />}
      <h2
        className="text-sm font-bold uppercase tracking-wide"
        style={{ color: COLORS.textPrimary }}
      >
        {title}
      </h2>
      {count !== undefined && (
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-md ml-auto"
          style={{
            backgroundColor: `${COLORS.accent}15`,
            color: COLORS.accent,
          }}
        >
          {count}
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// COMPONENT: Progress Bar
// ─────────────────────────────────────────────────────────────────────

function ProgressBar({
  done,
  total,
  color,
}: {
  done: number
  total: number
  color: string
}) {
  const pct = total > 0 ? (done / total) * 100 : 0
  return (
    <div
      className="h-2 rounded-full overflow-hidden"
      style={{ backgroundColor: '#E6E9EF' }}
    >
      <div
        className="h-full transition-all duration-300"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// COMPONENT: Team Member Row
// ─────────────────────────────────────────────────────────────────────

function TeamMemberRow({
  member,
  taskCount,
  tasksByStatus,
}: {
  member: any
  taskCount: number
  tasksByStatus: {
    pending: number
    in_progress: number
    completed: number
    revision: number
  }
}) {
  const total = Object.values(tasksByStatus).reduce((a, b) => a + b, 0)
  const utilization = tasksByStatus.in_progress > 0 ? 'Alto' : tasksByStatus.completed > 0 ? 'Moderado' : 'Bajo'
  const utilizationColor =
    tasksByStatus.in_progress > 0
      ? ACCENT_COLORS.red
      : tasksByStatus.completed > 0
        ? ACCENT_COLORS.orange
        : ACCENT_COLORS.green

  return (
    <div
      className="rounded-lg p-3 flex items-center gap-3"
      style={{
        backgroundColor: COLORS.cardBg,
        border: `1px solid ${COLORS.cardBorder}`,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          backgroundColor: `${member.color || COLORS.accent}15`,
          color: member.color || COLORS.accent,
          border: `1px solid ${member.color || COLORS.accent}30`,
        }}
      >
        {(member.name || member.displayName || 'U')
          .substring(0, 2)
          .toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold"
          style={{ color: COLORS.textPrimary }}
        >
          {member.name || member.displayName || 'Unknown'}
        </p>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          {taskCount} tareas
          {tasksByStatus.in_progress > 0 && ` · ${tasksByStatus.in_progress} en progreso`}
        </p>
      </div>

      {/* Status dots */}
      <div className="flex gap-1.5 flex-shrink-0">
        {tasksByStatus.completed > 0 && (
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: ACCENT_COLORS.green }}
            title={`${tasksByStatus.completed} completadas`}
          />
        )}
        {tasksByStatus.in_progress > 0 && (
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: ACCENT_COLORS.blue }}
            title={`${tasksByStatus.in_progress} en progreso`}
          />
        )}
        {tasksByStatus.revision > 0 && (
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: ACCENT_COLORS.orange }}
            title={`${tasksByStatus.revision} en revisión`}
          />
        )}
      </div>

      {/* Utilization */}
      <div
        className="text-xs font-semibold px-2 py-1 rounded-md"
        style={{
          backgroundColor: `${utilizationColor}15`,
          color: utilizationColor,
        }}
      >
        {utilization}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// MAIN COMPONENT: DashboardPage
// ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: clients = [] } = useClients()
  const { data: teamMembers = [] } = useTeam()
  const ctx = useOutletContext<{
    openNewTask?: () => void
    openTaskDetail?: (task: Task) => void
  }>()

  // ─────────────────────────────────────────────────────────────────
  // COMPUTED STATS
  // ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === 'completado').length
    const inProgress = tasks.filter((t) => t.status === 'en_progreso').length
    const urgent = tasks.filter(
      (t) => t.tipo === 'urgente' || (t.priority === 'alta' && t.tipo === 'pendiente_anterior')
    ).length
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, inProgress, urgent, completionPct }
  }, [tasks])

  // Client stats
  const clientStats = useMemo(() => {
    return clients
      .map((client) => {
        const clientTasks = tasks.filter((t) => t.client_id === client.id)
        const done = clientTasks.filter((t) => t.status === 'completado').length
        const inProg = clientTasks.filter((t) => t.status === 'en_progreso').length
        const pct =
          clientTasks.length > 0 ? Math.round((done / clientTasks.length) * 100) : 0
        const byArea = {
          copy: clientTasks.filter((t) => t.area === 'copy').length,
          trafico: clientTasks.filter((t) => t.area === 'trafico').length,
          tech: clientTasks.filter((t) => t.area === 'tech').length,
          admin: clientTasks.filter((t) => t.area === 'admin').length,
        }
        return { client, total: clientTasks.length, done, inProg, pct, byArea }
      })
      .filter((c) => c.total > 0)
  }, [clients, tasks])

  // Area stats
  const areaStats = useMemo(() => {
    const areas: Area[] = ['copy', 'trafico', 'tech', 'admin']
    return areas.map((area) => {
      const areaTasks = tasks.filter((t) => t.area === area)
      return {
        area,
        total: areaTasks.length,
        done: areaTasks.filter((t) => t.status === 'completado').length,
        inProg: areaTasks.filter((t) => t.status === 'en_progreso').length,
      }
    })
  }, [tasks])

  // Team stats
  const teamStats = useMemo(() => {
    const members =
      teamMembers.length > 0 ? teamMembers : deriveMembersFromTasks(tasks)
    return members.map((member) => {
      const memberTasks = tasks.filter(
        (t) =>
          t.assignee === member.name
      )
      return {
        member,
        total: memberTasks.length,
        byStatus: {
          pending: memberTasks.filter((t) => t.status === 'pendiente').length,
          in_progress: memberTasks.filter((t) => t.status === 'en_progreso').length,
          completed: memberTasks.filter((t) => t.status === 'completado').length,
          revision: memberTasks.filter((t) => t.status === 'revision').length,
        },
      }
    })
  }, [tasks, teamMembers])

  // Blockers & Urgent
  const blockers = useMemo(() => {
    return tasks
      .filter((t) => t.tipo === 'urgente' || (t.tipo === 'pendiente_anterior' && t.priority === 'alta'))
      .sort((a, b) => {
        if (a.tipo === 'urgente' && b.tipo !== 'urgente') return -1
        if (a.tipo !== 'urgente' && b.tipo === 'urgente') return 1
        return 0
      })
      .slice(0, 8)
  }, [tasks])

  // ─────────────────────────────────────────────────────────────────
  // RENDER: LOADING STATE
  // ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center h-96"
        style={{ backgroundColor: COLORS.pageBg }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 border-transparent border-t-current animate-spin"
          style={{ color: COLORS.accent }}
        />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER: MAIN DASHBOARD
  // ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen p-6 space-y-6"
      style={{ backgroundColor: COLORS.pageBg }}
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: KPI ROW (4 CARDS)
          ───────────────────────────────────────────────────────────── */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
      >
        <KpiCard
          label="Total de tareas"
          value={stats.total}
          trend={`${stats.completionPct}% completadas`}
          icon={Layers}
          accentColor={ACCENT_COLORS.indigo}
        />
        <KpiCard
          label="En progreso"
          value={stats.inProgress}
          trend="activas ahora"
          icon={Activity}
          accentColor={ACCENT_COLORS.blue}
        />
        <KpiCard
          label="Completadas"
          value={stats.completed}
          trend={`de ${stats.total} total`}
          icon={CheckCircle2}
          accentColor={ACCENT_COLORS.green}
        />
        <KpiCard
          label="Urgentes"
          value={stats.urgent}
          trend={stats.urgent > 0 ? 'requieren atención' : 'ninguno'}
          icon={stats.urgent > 0 ? AlertTriangle : TrendingUp}
          accentColor={stats.urgent > 0 ? ACCENT_COLORS.red : ACCENT_COLORS.green}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: BLOCKERS & URGENT (if any)
          ───────────────────────────────────────────────────────────── */}

      {blockers.length > 0 && (
        <div>
          <SectionHeader
            title="Bloqueantes y Urgentes"
            icon={AlertTriangle}
            count={blockers.length}
          />
          <div
            className="rounded-lg overflow-hidden"
            style={{
              backgroundColor: COLORS.cardBg,
              border: `1px solid ${COLORS.cardBorder}`,
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            }}
          >
            {blockers.map((task, idx) => (
              <div
                key={task.id}
                className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => ctx?.openTaskDetail?.(task)}
                style={{
                  borderBottom:
                    idx < blockers.length - 1 ? `1px solid ${COLORS.cardBorder}` : 'none',
                  borderLeft: `4px solid ${
                    task.tipo === 'urgente' ? ACCENT_COLORS.red : ACCENT_COLORS.orange
                  }`,
                }}
              >
                {/* Type badge */}
                <div
                  className="text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 flex-shrink-0"
                  style={{
                    backgroundColor:
                      task.tipo === 'urgente'
                        ? `${ACCENT_COLORS.red}15`
                        : `${ACCENT_COLORS.orange}15`,
                    color:
                      task.tipo === 'urgente'
                        ? ACCENT_COLORS.red
                        : ACCENT_COLORS.orange,
                  }}
                >
                  {task.tipo === 'urgente' ? <Zap size={10} /> : <Clock size={10} />}
                  {task.tipo === 'urgente' ? 'URG' : 'PREV'}
                </div>

                {/* Client badge */}
                {task.client && (
                  <div
                    className="text-[10px] font-semibold px-2 py-1 rounded flex-shrink-0"
                    style={{
                      backgroundColor: `${task.client.color || COLORS.accent}15`,
                      color: task.client.color || COLORS.accent,
                    }}
                  >
                    {task.client.name}
                  </div>
                )}

                {/* Title */}
                <span
                  className="flex-1 text-sm font-medium truncate"
                  style={{ color: COLORS.textPrimary }}
                >
                  {task.title}
                </span>

                {/* Area */}
                {task.area && (
                  <div
                    className="text-[10px] font-semibold px-2 py-1 rounded flex-shrink-0"
                    style={{
                      backgroundColor: `${AREA_COLORS[task.area]}15`,
                      color: AREA_COLORS[task.area],
                    }}
                  >
                    {AREA_LABELS[task.area]}
                  </div>
                )}

                {/* Status indicator */}
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: STATUS_COLORS[task.status] || COLORS.textMuted,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: CLIENT OVERVIEW GRID + AREA BREAKDOWN
          ───────────────────────────────────────────────────────────── */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '24px',
        }}
      >
        {/* LEFT: CLIENT CARDS */}
        <div>
          <SectionHeader title="Clientes" count={clientStats.length} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
            }}
          >
            {clientStats.map(({ client, total, done, pct, byArea }) => (
              <button
                key={client.id}
                className="rounded-lg p-4 text-left transition-all hover:shadow-md active:shadow-sm"
                style={{
                  backgroundColor: COLORS.cardBg,
                  border: `1px solid ${COLORS.cardBorder}`,
                  borderLeft: `4px solid ${client.color || COLORS.accent}`,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                }}
                onClick={() => {
                  /* navigate to client */
                }}
              >
                {/* Header with color dot */}
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="font-bold text-sm"
                    style={{ color: COLORS.textPrimary }}
                  >
                    {client.name}
                  </h3>
                </div>

                {/* Task count */}
                <p
                  className="text-xs mb-3"
                  style={{ color: COLORS.textMuted }}
                >
                  {total} tareas
                </p>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs" style={{ color: COLORS.textMuted }}>
                      {done}/{total} completadas
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: client.color || COLORS.accent }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <ProgressBar
                    done={done}
                    total={total}
                    color={client.color || COLORS.accent}
                  />
                </div>

                {/* Area breakdown */}
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(byArea) as [Area, number][]).map(
                    ([area, count]) =>
                      count > 0 && (
                        <div
                          key={area}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: `${AREA_COLORS[area]}15`,
                            color: AREA_COLORS[area],
                          }}
                        >
                          {area.slice(0, 1).toUpperCase()} {count}
                        </div>
                      )
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: AREA BREAKDOWN */}
        <div>
          <SectionHeader title="Por Área" icon={BarChart3} count={areaStats.length} />
          <div className="space-y-3">
            {areaStats.map(({ area, total, done }) => {
              return (
                <div
                  key={area}
                  className="rounded-lg p-3"
                  style={{
                    backgroundColor: COLORS.cardBg,
                    border: `1px solid ${COLORS.cardBorder}`,
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: COLORS.textPrimary }}
                    >
                      {AREA_LABELS[area]}
                    </span>
                    <span className="text-xs" style={{ color: COLORS.textMuted }}>
                      {done}/{total}
                    </span>
                  </div>
                  <ProgressBar done={done} total={total} color={AREA_COLORS[area]} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: TEAM CAPACITY + SUMMARY STATS
          ───────────────────────────────────────────────────────────── */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}
      >
        {/* LEFT: TEAM CAPACITY */}
        <div>
          <SectionHeader title="Carga del Equipo" icon={Users} count={teamStats.length} />
          <div className="space-y-2">
            {teamStats.map(({ member, total, byStatus }) => (
              <TeamMemberRow
                key={member.id || member.name}
                member={member}
                taskCount={total}
                tasksByStatus={byStatus}
              />
            ))}
            {teamStats.length === 0 && (
              <p className="text-sm text-center py-6" style={{ color: COLORS.textMuted }}>
                Sin datos de equipo disponibles
              </p>
            )}
          </div>
        </div>

        {/* RIGHT: SUMMARY STATS */}
        <div>
          <SectionHeader title="Resumen Operativo" />
          <div className="space-y-3">
            {[
              {
                label: 'Tareas pendientes',
                value: tasks.filter((t) => t.status === 'pendiente').length,
                color: ACCENT_COLORS.orange,
              },
              {
                label: 'En revisión',
                value: tasks.filter((t) => t.status === 'revision').length,
                color: ACCENT_COLORS.blue,
              },
              {
                label: 'Clientes activos',
                value: clientStats.length,
                color: ACCENT_COLORS.indigo,
              },
              {
                label: 'Equipo activo',
                value: teamStats.filter((t) => t.total > 0).length,
                color: ACCENT_COLORS.green,
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="rounded-lg p-3 flex items-center justify-between"
                style={{
                  backgroundColor: COLORS.cardBg,
                  border: `1px solid ${COLORS.cardBorder}`,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                }}
              >
                <span className="text-sm" style={{ color: COLORS.textMuted }}>
                  {stat.label}
                </span>
                <span
                  className="text-2xl font-bold"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          FOOTER: HELPFUL MESSAGE IF EMPTY
          ───────────────────────────────────────────────────────────── */}

      {tasks.length === 0 && (
        <div
          className="rounded-lg p-8 text-center"
          style={{
            backgroundColor: COLORS.cardBg,
            border: `1px solid ${COLORS.cardBorder}`,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          }}
        >
          <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>
            Sin tareas en el sistema
          </p>
          <button
            onClick={() => ctx?.openNewTask?.()}
            className="px-4 py-2 rounded-lg font-semibold transition-colors"
            style={{
              backgroundColor: COLORS.accent,
              color: 'white',
            }}
          >
            Crear primera tarea
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// UTILITY: Derive team members from tasks if useTeam not available
// ─────────────────────────────────────────────────────────────────────

function deriveMembersFromTasks(tasks: Task[]) {
  const assignees = new Set<string>()
  tasks.forEach((t) => {
    if (t.assignee) assignees.add(t.assignee)
  })

  return Array.from(assignees).map((name) => ({
    id: name,
    name,
    displayName: name,
    email: `${name.toLowerCase().replace(' ', '.')}@team.local`,
    role: 'Team Member',
    color: TEAM_COLORS[name] || ACCENT_COLORS.indigo,
  }))
}
