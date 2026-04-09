import { useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useTeam } from '../hooks/useTeam'
import { useOutletContext } from 'react-router-dom'
import type { Task, Client, Area, TaskStatus } from '../types'
import { AREA_LABELS, AREA_COLORS, STATUS_LABELS, STATUS_COLORS } from '../lib/constants'
import {
  Layers, Activity, CheckCircle2, AlertTriangle, TrendingUp, BarChart3, Users, Zap
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────
// STYLING CONSTANTS
// ─────────────────────────────────────────────────────────────────────

const COLORS = {
  pageBg: '#0F1117',
  cardBg: '#1A1D2E',
  cardBorder: 'rgba(255,255,255,0.08)',
  textPrimary: '#E5E7EB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  accent: '#6366F1',
}

const ACCENT_COLORS = {
  blue: '#3B82F6',
  green: '#10B981',
  red: '#EF4444',
  orange: '#F97316',
  purple: '#8B5CF6',
}

// ─────────────────────────────────────────────────────────────────────
// COMPONENT: KPI Card
// ─────────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, trend, icon: Icon, accentColor
}: {
  label: string
  value: number | string
  trend?: string
  icon: React.ElementType
  accentColor: string
}) {
  return (
    <div
      className="rounded-xl p-5 relative overflow-hidden"
      style={{
        backgroundColor: COLORS.cardBg,
        border: `1px solid ${COLORS.cardBorder}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '140px',
      }}
    >
      {/* Background accent glow */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl"
        style={{ backgroundColor: accentColor, opacity: 0.08 }}
      />

      {/* Icon in top right */}
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: COLORS.textMuted }}
          >
            {label}
          </p>
          <p
            className="text-4xl font-bold leading-tight"
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
          className="p-2 rounded-lg"
          style={{
            backgroundColor: `${accentColor}18`,
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
  title, icon: Icon, count
}: {
  title: string
  icon?: React.ElementType
  count?: number
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {Icon && <Icon size={16} style={{ color: COLORS.accent }} />}
      <h2
        className="text-sm font-semibold uppercase tracking-wide"
        style={{ color: COLORS.textPrimary }}
      >
        {title}
      </h2>
      {count !== undefined && (
        <span
          className="text-xs font-medium px-2 py-1 rounded-md"
          style={{
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            color: COLORS.accent,
          }}
        >
          {count}
        </span>
      )}
      <div className="flex-1 h-px" style={{ backgroundColor: COLORS.cardBorder }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// COMPONENT: Skill Level Indicator
// ─────────────────────────────────────────────────────────────────────

function UtilizationIndicator({ count }: { count: number }) {
  let color = ACCENT_COLORS.green
  let label = 'Bajo'
  if (count >= 5 && count < 8) {
    color = '#F59E0B'
    label = 'Moderado'
  } else if (count >= 8) {
    color = ACCENT_COLORS.red
    label = 'Alto'
  }
  return (
    <div
      className="text-xs font-semibold px-2 py-1 rounded-md"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {label}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// COMPONENT: Progress Bar
// ─────────────────────────────────────────────────────────────────────

function ProgressBar({ done, total, color }: { done: number; total: number; color: string }) {
  const pct = total > 0 ? (done / total) * 100 : 0
  return (
    <div
      className="h-2 rounded-full overflow-hidden"
      style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
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
  member, taskCount, tasksByStatus
}: {
  member: any
  taskCount: number
  tasksByStatus: { pending: number; in_progress: number; completed: number; revision: number }
}) {
  const total = Object.values(tasksByStatus).reduce((a, b) => a + b, 0)
  const utilization = Math.min(100, (tasksByStatus.in_progress / Math.max(1, total)) * 100)

  return (
    <div
      className="rounded-lg p-3 flex items-center gap-3"
      style={{
        backgroundColor: COLORS.cardBg,
        border: `1px solid ${COLORS.cardBorder}`,
      }}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{
          backgroundColor: `${member.color || COLORS.accent}20`,
          color: member.color || COLORS.accent,
          border: `1px solid ${member.color || COLORS.accent}40`,
        }}
      >
        {(member.name || member.displayName || 'U').substring(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
          {member.name || member.displayName || 'Unknown'}
        </p>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>
          {taskCount} tareas
          {tasksByStatus.in_progress > 0 && ` · ${tasksByStatus.in_progress} en progreso`}
        </p>
      </div>

      {/* Status dots */}
      <div className="flex gap-1 flex-shrink-0">
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
            style={{ backgroundColor: COLORS.accent }}
            title={`${tasksByStatus.in_progress} en progreso`}
          />
        )}
        {tasksByStatus.revision > 0 && (
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: '#F59E0B' }}
            title={`${tasksByStatus.revision} en revisión`}
          />
        )}
      </div>

      {/* Utilization */}
      <UtilizationIndicator count={taskCount} />
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
    const completed = tasks.filter(t => t.status === 'completado').length
    const inProgress = tasks.filter(t => t.status === 'en_progreso').length
    const urgent = tasks.filter(t => t.tipo === 'urgente' || t.tipo === 'pendiente_anterior').length
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, inProgress, urgent, completionPct }
  }, [tasks])

  // Client stats
  const clientStats = useMemo(() => {
    return clients.map(client => {
      const clientTasks = tasks.filter(t => t.client_id === client.id)
      const done = clientTasks.filter(t => t.status === 'completado').length
      const inProg = clientTasks.filter(t => t.status === 'en_progreso').length
      const pct = clientTasks.length > 0 ? Math.round((done / clientTasks.length) * 100) : 0
      const isAtRisk = clientTasks.length >= 3 && pct < 30 && inProg === 0
      const byArea = {
        copy: clientTasks.filter(t => t.area === 'copy').length,
        trafico: clientTasks.filter(t => t.area === 'trafico').length,
        tech: clientTasks.filter(t => t.area === 'tech').length,
        admin: clientTasks.filter(t => t.area === 'admin').length,
      }
      return { client, total: clientTasks.length, done, inProg, pct, isAtRisk, byArea }
    }).filter(c => c.total > 0)
  }, [clients, tasks])

  // Area stats
  const areaStats = useMemo(() => {
    const areas: Area[] = ['copy', 'trafico', 'tech', 'admin']
    return areas.map(area => {
      const areaTasks = tasks.filter(t => t.area === area)
      return {
        area,
        total: areaTasks.length,
        done: areaTasks.filter(t => t.status === 'completado').length,
        inProg: areaTasks.filter(t => t.status === 'en_progreso').length,
      }
    })
  }, [tasks])

  // Team stats
  const teamStats = useMemo(() => {
    const members = teamMembers.length > 0 ? teamMembers : deriveMembersFromTasks(tasks)
    return members.map(member => {
      const memberTasks = tasks.filter(t =>
        t.assignee === (member.name || member.displayName) ||
        t.assignee_id === member.id
      )
      return {
        member,
        total: memberTasks.length,
        byStatus: {
          pending: memberTasks.filter(t => t.status === 'pendiente').length,
          in_progress: memberTasks.filter(t => t.status === 'en_progreso').length,
          completed: memberTasks.filter(t => t.status === 'completado').length,
          revision: memberTasks.filter(t => t.status === 'revision').length,
        }
      }
    })
  }, [tasks, teamMembers])

  // Blockers
  const blockers = useMemo(() => {
    return tasks
      .filter(t => t.tipo === 'urgente' || t.tipo === 'pendiente_anterior')
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
          accentColor={COLORS.accent}
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
          <SectionHeader title="Bloqueantes y Urgentes" icon={AlertTriangle} count={blockers.length} />
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: COLORS.cardBg,
              border: `1px solid ${ACCENT_COLORS.red}30`,
              backgroundImage: `linear-gradient(135deg, ${ACCENT_COLORS.red}08 0%, transparent 100%)`,
            }}
          >
            {blockers.map((task, idx) => (
              <div
                key={task.id}
                className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
                onClick={() => ctx?.openTaskDetail?.(task)}
                style={{
                  borderBottom: idx < blockers.length - 1 ? `1px solid ${COLORS.cardBorder}` : 'none',
                  borderLeft: `3px solid ${task.tipo === 'urgente' ? ACCENT_COLORS.red : ACCENT_COLORS.orange}`,
                }}
              >
                {/* Type badge */}
                <div
                  className="text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"
                  style={{
                    backgroundColor: task.tipo === 'urgente' ? `${ACCENT_COLORS.red}20` : `${ACCENT_COLORS.orange}20`,
                    color: task.tipo === 'urgente' ? ACCENT_COLORS.red : ACCENT_COLORS.orange,
                  }}
                >
                  {task.tipo === 'urgente' ? <Zap size={10} /> : <AlertTriangle size={10} />}
                  {task.tipo === 'urgente' ? 'URG' : 'PREV'}
                </div>

                {/* Client badge */}
                {task.client && (
                  <div
                    className="text-[10px] font-semibold px-2 py-1 rounded"
                    style={{
                      backgroundColor: `${task.client.color || COLORS.accent}20`,
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
                    className="text-[10px] font-semibold px-2 py-1 rounded"
                    style={{
                      backgroundColor: `${AREA_COLORS[task.area]}20`,
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
          SECTION 3: CLIENT OVERVIEW (left) + BLOCKERS (right)
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
            {clientStats.map(({ client, total, done, pct, isAtRisk, byArea }) => (
              <button
                key={client.id}
                className="rounded-lg p-4 text-left transition-all hover:scale-105"
                style={{
                  backgroundColor: COLORS.cardBg,
                  border: isAtRisk
                    ? `1px solid ${ACCENT_COLORS.red}50`
                    : `1px solid ${client.color || COLORS.accent}30`,
                  backgroundImage: isAtRisk
                    ? `linear-gradient(135deg, ${ACCENT_COLORS.red}08 0%, transparent 100%)`
                    : undefined,
                }}
                onClick={() => { /* navigate to client */ }}
              >
                {/* Header with color dot */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: isAtRisk ? ACCENT_COLORS.red : client.color || COLORS.accent,
                      }}
                    />
                    <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>
                      {client.name}
                    </h3>
                  </div>
                  {isAtRisk && (
                    <AlertTriangle size={14} style={{ color: ACCENT_COLORS.red }} />
                  )}
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs" style={{ color: COLORS.textMuted }}>
                      {done}/{total} completadas
                    </span>
                    <span className="text-sm font-bold" style={{ color: client.color || COLORS.accent }}>
                      {pct}%
                    </span>
                  </div>
                  <ProgressBar done={done} total={total} color={client.color || COLORS.accent} />
                </div>

                {/* Area breakdown */}
                <div className="flex gap-2">
                  {(Object.entries(byArea) as [Area, number][]).map(([area, count]) => (
                    count > 0 && (
                      <div
                        key={area}
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${AREA_COLORS[area]}20`,
                          color: AREA_COLORS[area],
                        }}
                      >
                        {area.slice(0, 1).toUpperCase()} {count}
                      </div>
                    )
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: AREA BREAKDOWN STACKED BAR */}
        <div>
          <SectionHeader title="Por Área" icon={BarChart3} count={areaStats.length} />
          <div className="space-y-3">
            {areaStats.map(({ area, total, done, inProg }) => {
              const pct = total > 0 ? (done / total) * 100 : 0
              return (
                <div
                  key={area}
                  className="rounded-lg p-3"
                  style={{
                    backgroundColor: COLORS.cardBg,
                    border: `1px solid ${COLORS.cardBorder}`,
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
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
          SECTION 4: TEAM CAPACITY (left) + AREA BREAKDOWN (right)
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
                value: tasks.filter(t => t.status === 'pendiente').length,
                icon: '⏳',
              },
              {
                label: 'En revisión',
                value: tasks.filter(t => t.status === 'revision').length,
                icon: '🔍',
              },
              {
                label: 'Clientes activos',
                value: clientStats.length,
                icon: '👥',
              },
              {
                label: 'Equipo activo',
                value: teamStats.filter(t => t.total > 0).length,
                icon: '⚡',
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="rounded-lg p-3 flex items-center justify-between"
                style={{
                  backgroundColor: COLORS.cardBg,
                  border: `1px solid ${COLORS.cardBorder}`,
                }}
              >
                <span className="text-sm" style={{ color: COLORS.textMuted }}>
                  {stat.label}
                </span>
                <span className="text-2xl font-bold" style={{ color: COLORS.accent }}>
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
  tasks.forEach(t => {
    if (t.assignee) assignees.add(t.assignee)
  })

  const colors = Object.values(ACCENT_COLORS)
  let colorIdx = 0

  return Array.from(assignees).map(name => ({
    id: name,
    name,
    displayName: name,
    email: `${name.toLowerCase().replace(' ', '.')}@team.local`,
    role: 'Team Member',
    color: colors[colorIdx++ % colors.length],
  }))
}
