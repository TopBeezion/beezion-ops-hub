import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useOutletContext } from 'react-router-dom'
import { useUpdateTask } from '../hooks/useTasks'
import type { Task, Client, TaskStatus } from '../types'
import { STATUS_LABELS, STATUS_COLORS, ASSIGNEE_COLORS, PRIORITY_COLORS, TEAM_MEMBERS } from '../lib/constants'
import {
  Flame, CheckCircle2, Clock, AlertTriangle, ChevronDown,
  Circle, RefreshCw,
} from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#F0F2F8',
  card: '#FFFFFF',
  border: '#E6E9EF',
  text: '#1F2128',
  sub: '#676879',
  muted: '#9699A6',
  red: '#E2445C',
  orange: '#FDAB3D',
  green: '#00C875',
  blue: '#579BFC',
}

function StatusBadge({ status, onClick }: { status: TaskStatus; onClick?: (e: React.MouseEvent) => void }) {
  const color = STATUS_COLORS[status]
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 700,
        color, backgroundColor: `${color}15`,
        padding: '3px 8px', borderRadius: 6, border: `1px solid ${color}30`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <Circle size={6} fill={color} color={color} />
      {STATUS_LABELS[status]}
      {onClick && <ChevronDown size={10} />}
    </button>
  )
}

const STATUS_CYCLE: TaskStatus[] = ['pendiente', 'en_progreso', 'revision', 'completado']

function BomberoRow({ task, onClick, onStatusChange }: {
  task: Task
  onClick?: () => void
  onStatusChange: (id: string, status: TaskStatus) => void
}) {
  const clientColor = (task.client as Client & { color: string })?.color || C.red
  const priorityColor = PRIORITY_COLORS[task.priority]
  const assigneeColor = ASSIGNEE_COLORS[task.assignee] || C.muted

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation()
    const cur = STATUS_CYCLE.indexOf(task.status)
    const next = STATUS_CYCLE[(cur + 1) % STATUS_CYCLE.length]
    onStatusChange(task.id, next)
  }

  const isCompleted = task.status === 'completado'

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 hover:bg-red-50 transition-colors cursor-pointer"
      style={{
        borderBottom: `1px solid ${C.border}`,
        borderLeft: `4px solid ${task.status === 'en_progreso' ? C.red : C.orange}`,
        opacity: isCompleted ? 0.5 : 1,
      }}
      onClick={onClick}
    >
      {/* Priority dot */}
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        backgroundColor: priorityColor, flexShrink: 0,
        boxShadow: `0 0 6px ${priorityColor}60`,
      }} />

      {/* Title + client */}
      <div className="flex-1 min-w-0">
        <p style={{
          fontSize: 14, fontWeight: 600, color: C.text,
          textDecoration: isCompleted ? 'line-through' : 'none',
        }} className="truncate">
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {task.client && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: clientColor,
              backgroundColor: `${clientColor}15`,
              padding: '1px 7px', borderRadius: 4,
            }}>
              {(task.client as Client).name}
            </span>
          )}
          {task.problema && (
            <span style={{ fontSize: 11, color: C.muted }} className="truncate max-w-xs">
              {task.problema}
            </span>
          )}
        </div>
      </div>

      {/* Assignee */}
      <div
        style={{
          width: 28, height: 28, borderRadius: '50%',
          backgroundColor: `${assigneeColor}20`, color: assigneeColor,
          fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${assigneeColor}30`, flexShrink: 0,
        }}
        title={task.assignee}
      >
        {task.assignee.slice(0, 2).toUpperCase()}
      </div>

      {/* Status cycle */}
      <StatusBadge status={task.status} onClick={cycleStatus} />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function BomberosPage() {
  const { data: tasks = [], isLoading } = useTasks()
  const { data: clients = [] } = useClients()
  const updateTask = useUpdateTask()
  const ctx = useOutletContext<{ openTaskDetail?: (task: Task) => void }>()

  const [filterClient, setFilterClient] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [showResolved, setShowResolved] = useState(false)

  const bomberos = useMemo(() => tasks
    .filter(t => t.priority === 'alta')
    .filter(t => !filterClient || t.client_id === filterClient)
    .filter(t => !filterAssignee || t.assignee === filterAssignee)
    .filter(t => showResolved || t.status !== 'completado')
    .sort((a, b) => {
      if (a.status === 'en_progreso' && b.status !== 'en_progreso') return -1
      if (a.status !== 'en_progreso' && b.status === 'en_progreso') return 1
      return 0
    }),
  [tasks, filterClient, filterAssignee, showResolved])

  const stats = useMemo(() => ({
    total: tasks.filter(t => t.priority === 'alta').length,
    enProceso: tasks.filter(t => t.priority === 'alta' && t.status === 'en_progreso').length,
    pendientes: tasks.filter(t => t.priority === 'alta' && t.status === 'pendiente').length,
    resueltos: tasks.filter(t => t.priority === 'alta' && t.status === 'completado').length,
  }), [tasks, bomberos.length, showResolved])

  // Always show all team members in the filter (not just those with tasks)
  const assignees = TEAM_MEMBERS.filter(m => m !== 'TBD')

  const handleStatusChange = (id: string, status: TaskStatus) => {
    updateTask.mutate({ id, status })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #E2445C 0%, #C0392B 100%)',
        padding: '24px 28px',
      }}>
        <div className="flex items-center gap-3 mb-4">
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Flame size={22} color="#FFFFFF" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF' }}>🔥 Bomberos</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
              Centro de control de incendios operativos — revisión diaria
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-3">
          {[
            { label: 'Total alta prioridad', value: stats.total,     icon: AlertTriangle, color: '#FFF' },
            { label: 'En Proceso',           value: stats.enProceso, icon: Flame,         color: '#FFD700' },
            { label: 'Pendientes',           value: stats.pendientes, icon: Clock,        color: '#FFB347' },
            { label: 'Resueltos',            value: stats.resueltos,  icon: CheckCircle2, color: '#90EE90' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 10, padding: '10px 16px',
              backdropFilter: 'blur(4px)',
            }}>
              <div className="flex items-center gap-2">
                <Icon size={14} color={color} />
                <span style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF' }}>{value}</span>
              </div>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: C.card, borderBottom: `1px solid ${C.border}`,
        padding: '10px 28px', display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {/* Row 1: Clients */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: C.muted, letterSpacing: '0.1em', marginRight: 2 }}>CLIENTE</span>
          {[{ id: '', name: 'Todos' }, ...clients].map(c => {
            const col = (c as any).color || C.red
            const active = filterClient === c.id
            return (
              <button key={c.id} onClick={() => setFilterClient(c.id === filterClient ? '' : c.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                  backgroundColor: active ? (c.id ? col : C.red) : '#F5F6FA',
                  color: active ? '#fff' : C.sub,
                  boxShadow: active ? `0 2px 6px ${c.id ? col : C.red}40` : `inset 0 0 0 1px ${C.border}`,
                }}
              >
                {c.id && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: active ? 'rgba(255,255,255,0.7)' : col, flexShrink: 0 }} />}
                {c.name}
              </button>
            )
          })}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setShowResolved(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s',
                padding: '4px 10px', borderRadius: 20,
                backgroundColor: showResolved ? `${C.green}18` : '#F5F6FA',
                color: showResolved ? C.green : C.sub,
                boxShadow: showResolved ? `inset 0 0 0 1.5px ${C.green}` : `inset 0 0 0 1px ${C.border}`,
                border: 'none',
              }}
            >
              <CheckCircle2 size={11} />
              {showResolved ? 'Ocultar resueltos' : 'Ver resueltos'}
            </button>
            <button onClick={() => window.location.reload()}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                padding: '4px 10px', borderRadius: 20,
                backgroundColor: '#F5F6FA', color: C.sub, border: 'none',
                boxShadow: `inset 0 0 0 1px ${C.border}`,
              }}
            >
              <RefreshCw size={11} /> Actualizar
            </button>
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>
              {bomberos.length} visible{bomberos.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Row 2: Assignees */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: C.muted, letterSpacing: '0.1em', marginRight: 2 }}>RESPONSABLE</span>
          {[{ name: '', label: 'Todos' }, ...assignees.map(a => ({ name: a, label: a }))].map(({ name, label }) => {
            const ac = ASSIGNEE_COLORS[name] || C.muted
            const active = filterAssignee === name
            const ini = name ? name.slice(0, 2).toUpperCase() : null
            return (
              <button key={name} onClick={() => setFilterAssignee(name === filterAssignee ? '' : name)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: ini ? '3px 8px 3px 4px' : '4px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                  backgroundColor: active ? ac : '#F5F6FA',
                  color: active ? '#fff' : C.sub,
                  boxShadow: active ? `0 2px 6px ${ac}40` : `inset 0 0 0 1px ${C.border}`,
                }}
              >
                {ini && (
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: active ? 'rgba(255,255,255,0.3)' : `${ac}25`,
                    color: active ? '#fff' : ac, fontSize: 8, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{ini}</div>
                )}
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* List */}
      <div style={{ maxWidth: 1100, margin: '24px auto', padding: '0 28px' }}>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-current animate-spin" style={{ color: C.red }} />
          </div>
        ) : bomberos.length === 0 ? (
          <div style={{
            backgroundColor: C.card, borderRadius: 12,
            border: `1px solid ${C.border}`,
            padding: '60px 40px', textAlign: 'center',
          }}>
            <CheckCircle2 size={48} color={C.green} style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: 20, fontWeight: 700, color: C.text }}>¡Sin incendios activos!</p>
            <p style={{ fontSize: 14, color: C.sub, marginTop: 8 }}>
              {filterClient || filterAssignee ? 'No hay incendios con los filtros aplicados.' : 'El equipo está operando sin urgencias. Buen trabajo.'}
            </p>
          </div>
        ) : (
          <>
            {/* En Proceso */}
            {bomberos.filter(t => t.status === 'en_progreso').length > 0 && (
              <div style={{
                backgroundColor: C.card, borderRadius: 12,
                border: `1px solid #E2445C30`, overflow: 'hidden', marginBottom: 16,
              }}>
                <div style={{ padding: '12px 20px', backgroundColor: '#E2445C08', borderBottom: `1px solid #E2445C20` }}>
                  <div className="flex items-center gap-2">
                    <Flame size={14} color={C.red} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.red }}>
                      EN PROCESO ({bomberos.filter(t => t.status === 'en_progreso').length})
                    </span>
                  </div>
                </div>
                {bomberos
                  .filter(t => t.status === 'en_progreso')
                  .map(task => (
                    <BomberoRow
                      key={task.id}
                      task={task}
                      onClick={() => ctx?.openTaskDetail?.(task)}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
              </div>
            )}

            {/* Pendientes de alta prioridad */}
            {bomberos.filter(t => t.status !== 'en_progreso').length > 0 && (
              <div style={{
                backgroundColor: C.card, borderRadius: 12,
                border: `1px solid #FDAB3D30`, overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 20px', backgroundColor: '#FDAB3D08', borderBottom: `1px solid #FDAB3D20` }}>
                  <div className="flex items-center gap-2">
                    <Clock size={14} color={C.orange} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>
                      PENDIENTES — PRIORIDAD ALTA ({bomberos.filter(t => t.status !== 'en_progreso').length})
                    </span>
                  </div>
                </div>
                {bomberos
                  .filter(t => t.status !== 'en_progreso')
                  .map(task => (
                    <BomberoRow
                      key={task.id}
                      task={task}
                      onClick={() => ctx?.openTaskDetail?.(task)}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
