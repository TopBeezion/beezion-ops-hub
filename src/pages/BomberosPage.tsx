import { useState, useMemo, useRef, useEffect } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useOutletContext } from 'react-router-dom'
import { useUpdateTask } from '../hooks/useTasks'
import type { Task, Client, TaskStatus } from '../types'
import { STATUS_LABELS, STATUS_COLORS, ASSIGNEE_COLORS, PRIORITY_COLORS, TEAM_MEMBERS } from '../lib/constants'
import {
  Flame, CheckCircle2, Clock, AlertTriangle,
  ChevronDown, Circle, RefreshCw, XCircle,
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

const STATUS_ORDER: TaskStatus[] = ['pendiente', 'en_progreso', 'revision', 'completado']

// ─── Status Dropdown ──────────────────────────────────────────────────────────
function StatusDropdown({
  status,
  onSelect,
}: {
  status: TaskStatus
  onSelect: (s: TaskStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const color = STATUS_COLORS[status]

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        dropRef.current && !dropRef.current.contains(t) &&
        btnRef.current && !btnRef.current.contains(t)
      ) setOpen(false)
    }
    const onScroll = () => setOpen(false)
    document.addEventListener('mousedown', h)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', h)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setDropPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
    }
    setOpen(v => !v)
  }

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 11, fontWeight: 700,
          color, backgroundColor: `${color}15`,
          padding: '5px 10px', borderRadius: 6, border: `1.5px solid ${color}35`,
          cursor: 'pointer', transition: 'all 0.1s',
          whiteSpace: 'nowrap',
        }}
      >
        <Circle size={7} fill={color} color={color} />
        {STATUS_LABELS[status]}
        <ChevronDown size={11} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
      </button>

      {open && (
        <div
          ref={dropRef}
          style={{
            position: 'fixed',
            top: dropPos.top,
            right: dropPos.right,
            zIndex: 9999,
            backgroundColor: '#fff',
            border: '1px solid #E4E7F0',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
            padding: 4,
            minWidth: 170,
          }}
        >
          {STATUS_ORDER.map(s => {
            const sc = STATUS_COLORS[s]
            const isActive = s === status
            return (
              <button
                key={s}
                onClick={e => { e.stopPropagation(); onSelect(s); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '9px 11px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  backgroundColor: isActive ? `${sc}12` : 'transparent',
                  transition: 'background 0.1s', textAlign: 'left',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F6FA' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                <Circle size={8} fill={sc} color={sc} />
                <span style={{ flex: 1, fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? sc : '#374151' }}>
                  {STATUS_LABELS[s]}
                </span>
                {isActive && <CheckCircle2 size={13} color={sc} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Bombero Row ──────────────────────────────────────────────────────────────
function BomberoRow({ task, onClick, onStatusChange, isLast }: {
  task: Task
  onClick?: () => void
  onStatusChange: (id: string, status: TaskStatus) => void
  isLast?: boolean
}) {
  const clientColor = (task.client as Client & { color: string })?.color || C.red
  const priorityColor = PRIORITY_COLORS[task.priority]
  const assigneeColor = ASSIGNEE_COLORS[task.assignee] || C.muted
  const isCompleted = task.status === 'completado'
  const accentColor = task.status === 'en_progreso' ? C.red : task.status === 'completado' ? C.green : C.orange

  return (
    <div
      className="flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
      style={{
        padding: '12px 20px',
        borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
        borderLeft: `4px solid ${accentColor}`,
        opacity: isCompleted ? 0.6 : 1,
      }}
      onClick={onClick}
    >
      {/* Priority dot */}
      <div style={{
        width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
        backgroundColor: priorityColor,
        boxShadow: `0 0 6px ${priorityColor}60`,
      }} />

      {/* Title + client + problema */}
      <div className="flex-1 min-w-0">
        <p style={{
          fontSize: 13, fontWeight: 600, color: isCompleted ? C.muted : C.text,
          textDecoration: isCompleted ? 'line-through' : 'none',
          lineHeight: 1.3,
        }} className="truncate">
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {task.client && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: clientColor,
              backgroundColor: `${clientColor}15`,
              padding: '1px 7px', borderRadius: 4, flexShrink: 0,
            }}>
              {(task.client as Client).name}
            </span>
          )}
          {task.area && (
            <span style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>
              {task.area}
            </span>
          )}
        </div>
      </div>

      {/* Assignee avatar */}
      <div
        style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          backgroundColor: `${assigneeColor}20`, color: assigneeColor,
          fontSize: 10, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1.5px solid ${assigneeColor}40`,
        }}
        title={task.assignee}
      >
        {task.assignee.slice(0, 2).toUpperCase()}
      </div>

      {/* Status dropdown */}
      <StatusDropdown
        status={task.status}
        onSelect={status => onStatusChange(task.id, status)}
      />
    </div>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({
  icon: Icon, title, count, accentColor, borderColor, bgColor, children,
}: {
  icon: React.ElementType; title: string; count: number; accentColor: string
  borderColor: string; bgColor: string; children: React.ReactNode
}) {
  return (
    <div style={{
      backgroundColor: C.card, borderRadius: 14,
      border: `1px solid ${borderColor}`, marginBottom: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      overflow: 'visible',
    }}>
      <div style={{
        padding: '13px 20px', backgroundColor: bgColor,
        borderBottom: `1px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Icon size={15} color={accentColor} />
        <span style={{ fontSize: 13, fontWeight: 800, color: accentColor, letterSpacing: '0.02em' }}>
          {title}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700,
          backgroundColor: `${accentColor}20`, color: accentColor,
          padding: '1px 8px', borderRadius: 99,
        }}>
          {count}
        </span>
      </div>
      {children}
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

  const allBomberos = useMemo(() => tasks
    .filter(t => t.priority === 'alta')
    .filter(t => !filterClient || t.client_id === filterClient)
    .filter(t => !filterAssignee || t.assignee === filterAssignee),
  [tasks, filterClient, filterAssignee])

  const enProceso  = useMemo(() => allBomberos.filter(t => t.status === 'en_progreso'), [allBomberos])
  const pendientes = useMemo(() => allBomberos.filter(t => t.status === 'pendiente' || t.status === 'revision'), [allBomberos])
  const resueltos  = useMemo(() => allBomberos.filter(t => t.status === 'completado'), [allBomberos])

  const stats = useMemo(() => ({
    total:      tasks.filter(t => t.priority === 'alta').length,
    enProceso:  tasks.filter(t => t.priority === 'alta' && t.status === 'en_progreso').length,
    pendientes: tasks.filter(t => t.priority === 'alta' && (t.status === 'pendiente' || t.status === 'revision')).length,
    resueltos:  tasks.filter(t => t.priority === 'alta' && t.status === 'completado').length,
  }), [tasks])

  const assignees = TEAM_MEMBERS.filter(m => m !== 'TBD')

  const handleStatusChange = (id: string, status: TaskStatus) => {
    updateTask.mutate({ id, status })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: C.bg }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #E2445C 0%, #B03050 100%)',
        padding: '24px 32px 20px',
      }}>
        <div className="flex items-center gap-3 mb-5">
          <div style={{
            width: 46, height: 46, borderRadius: 13,
            backgroundColor: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.25)',
          }}>
            <Flame size={22} color="#FFFFFF" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>🔥 Bomberos</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
              Tareas de alta prioridad — revisión diaria del equipo
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Total alta prioridad', value: stats.total,      icon: AlertTriangle, color: 'rgba(255,255,255,0.9)' },
            { label: 'En Proceso',           value: stats.enProceso,  icon: Flame,         color: '#FFD700' },
            { label: 'Pendientes',           value: stats.pendientes, icon: Clock,         color: '#FFB347' },
            { label: 'Resueltos',            value: stats.resueltos,  icon: CheckCircle2,  color: '#7DF9AA' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{
              backgroundColor: 'rgba(255,255,255,0.13)',
              borderRadius: 12, padding: '10px 18px',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
            }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} color={color} />
                <span style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{value}</span>
              </div>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: C.card, borderBottom: `1px solid ${C.border}`,
        padding: '14px 32px', display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: C.muted, letterSpacing: '0.12em', marginRight: 2 }}>CLIENTE</span>
          {[{ id: '', name: 'Todos' }, ...clients].map(c => {
            const col = (c as any).color || C.red
            const active = filterClient === c.id
            return (
              <button key={c.id} onClick={() => setFilterClient(active ? '' : c.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                  backgroundColor: active ? (c.id ? col : C.red) : '#F5F6FA',
                  color: active ? '#fff' : C.sub,
                  boxShadow: active ? `0 2px 8px ${c.id ? col : C.red}40` : `inset 0 0 0 1px ${C.border}`,
                }}
              >
                {c.id && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: active ? 'rgba(255,255,255,0.8)' : col, flexShrink: 0 }} />}
                {c.name}
              </button>
            )
          })}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setShowResolved(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s',
              padding: '5px 12px', borderRadius: 20, border: 'none',
              backgroundColor: showResolved ? C.green : '#F5F6FA',
              color: showResolved ? '#fff' : C.sub,
              boxShadow: showResolved ? `0 2px 8px ${C.green}50` : `inset 0 0 0 1px ${C.border}`,
            }}>
              <CheckCircle2 size={11} />
              {showResolved ? 'Ocultar resueltos' : `Ver resueltos (${stats.resueltos})`}
            </button>
            <button onClick={() => window.location.reload()} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              padding: '5px 12px', borderRadius: 20, border: 'none',
              backgroundColor: '#F5F6FA', color: C.sub,
              boxShadow: `inset 0 0 0 1px ${C.border}`,
            }}>
              <RefreshCw size={11} /> Actualizar
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: C.muted, letterSpacing: '0.12em', marginRight: 2 }}>RESPONSABLE</span>
          {[{ name: '', label: 'Todos' }, ...assignees.map(a => ({ name: a, label: a }))].map(({ name, label }) => {
            const ac = ASSIGNEE_COLORS[name] || C.muted
            const active = filterAssignee === name
            const ini = name ? name.slice(0, 2).toUpperCase() : null
            return (
              <button key={name} onClick={() => setFilterAssignee(active ? '' : name)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: ini ? '4px 10px 4px 4px' : '5px 12px', borderRadius: 20,
                  fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                  backgroundColor: active ? ac : '#F5F6FA',
                  color: active ? '#fff' : C.sub,
                  boxShadow: active ? `0 2px 8px ${ac}40` : `inset 0 0 0 1px ${C.border}`,
                }}
              >
                {ini && (
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: active ? 'rgba(255,255,255,0.3)' : `${ac}20`,
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

      {/* ── Task List ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '28px auto', padding: '0 32px' }}>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-current animate-spin" style={{ color: C.red }} />
          </div>
        ) : (
          <>
            {/* EN PROCESO */}
            {enProceso.length > 0 && (
              <SectionCard icon={Flame} title="EN PROCESO" count={enProceso.length}
                accentColor={C.red} borderColor="#E2445C25" bgColor="#E2445C06">
                {enProceso.map((task, i) => (
                  <BomberoRow key={task.id} task={task} isLast={i === enProceso.length - 1}
                    onClick={() => ctx?.openTaskDetail?.(task)}
                    onStatusChange={handleStatusChange} />
                ))}
              </SectionCard>
            )}

            {/* PENDIENTES */}
            {pendientes.length > 0 && (
              <SectionCard icon={Clock} title="PENDIENTES" count={pendientes.length}
                accentColor={C.orange} borderColor="#FDAB3D25" bgColor="#FDAB3D06">
                {pendientes.map((task, i) => (
                  <BomberoRow key={task.id} task={task} isLast={i === pendientes.length - 1}
                    onClick={() => ctx?.openTaskDetail?.(task)}
                    onStatusChange={handleStatusChange} />
                ))}
              </SectionCard>
            )}

            {/* RESUELTOS — siempre visible cuando showResolved=true */}
            {showResolved && (
              resueltos.length > 0 ? (
                <SectionCard icon={CheckCircle2} title="RESUELTOS" count={resueltos.length}
                  accentColor={C.green} borderColor="#00C87525" bgColor="#00C87506">
                  {resueltos.map((task, i) => (
                    <BomberoRow key={task.id} task={task} isLast={i === resueltos.length - 1}
                      onClick={() => ctx?.openTaskDetail?.(task)}
                      onStatusChange={handleStatusChange} />
                  ))}
                </SectionCard>
              ) : (
                <div style={{
                  backgroundColor: C.card, borderRadius: 12,
                  border: `1px solid ${C.border}`, padding: '20px 24px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <XCircle size={16} color={C.muted} />
                  <p style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>
                    No hay tareas resueltas{filterClient || filterAssignee ? ' con los filtros aplicados' : ''}.
                  </p>
                </div>
              )
            )}

            {/* Estado vacío — ninguna tarea activa/pendiente */}
            {enProceso.length === 0 && pendientes.length === 0 && !showResolved && (
              <div style={{
                backgroundColor: C.card, borderRadius: 14,
                border: `1px solid ${C.border}`, padding: '52px 40px', textAlign: 'center',
              }}>
                <CheckCircle2 size={44} color={C.green} style={{ margin: '0 auto 14px' }} />
                <p style={{ fontSize: 18, fontWeight: 700, color: C.text }}>¡Sin incendios activos!</p>
                <p style={{ fontSize: 13, color: C.sub, marginTop: 8, marginBottom: stats.resueltos > 0 ? 20 : 0 }}>
                  {filterClient || filterAssignee ? 'Sin tareas con los filtros aplicados.' : 'El equipo está operando sin urgencias. ¡Buen trabajo! 🎉'}
                </p>
                {stats.resueltos > 0 && (
                  <button onClick={() => setShowResolved(true)} style={{
                    fontSize: 12, fontWeight: 700, color: C.green, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '9px 18px', borderRadius: 20, border: `1.5px solid ${C.green}35`,
                    backgroundColor: `${C.green}0D`,
                  }}>
                    <CheckCircle2 size={13} />
                    Ver {stats.resueltos} tarea{stats.resueltos !== 1 ? 's' : ''} resuelta{stats.resueltos !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
            )}

            {/* Hint abajo cuando hay activos Y hay resueltos sin mostrar */}
            {(enProceso.length > 0 || pendientes.length > 0) && !showResolved && stats.resueltos > 0 && (
              <div style={{ textAlign: 'center', paddingTop: 4, paddingBottom: 8 }}>
                <button onClick={() => setShowResolved(true)} style={{
                  fontSize: 12, fontWeight: 600, color: C.green, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 20, border: 'none',
                  backgroundColor: `${C.green}0D`,
                }}>
                  <CheckCircle2 size={13} />
                  Ver {stats.resueltos} tarea{stats.resueltos !== 1 ? 's' : ''} resuelta{stats.resueltos !== 1 ? 's' : ''}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
