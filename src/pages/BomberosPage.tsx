import { useState, useMemo, useRef, useEffect } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useOutletContext } from 'react-router-dom'
import { useUpdateTask } from '../hooks/useTasks'
import type { Task, Client, TaskStatus } from '../types'
import { STATUS_LABELS, STATUS_COLORS, ASSIGNEE_COLORS, PRIORITY_COLORS, TEAM_MEMBERS } from '../lib/constants'
import {
  Flame, CheckCircle2, Clock, AlertTriangle,
  ChevronDown, Circle, RefreshCw, XCircle, Zap,
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
  orange: '#F59E0B',
  green: '#10B981',
  blue: '#3B82F6',
}

// Column config
const COLUMNS: { status: TaskStatus; label: string; icon: React.ElementType; color: string; bg: string; border: string }[] = [
  { status: 'en_progreso', label: 'EN PROCESO',  icon: Flame,        color: C.blue,   bg: '#EFF6FF', border: '#BFDBFE' },
  { status: 'pendiente',   label: 'PENDIENTES',  icon: Clock,        color: C.orange, bg: '#FFFBEB', border: '#FDE68A' },
  { status: 'revision',    label: 'BLOCKER',     icon: AlertTriangle,color: C.red,    bg: '#FEF2F2', border: '#FECACA' },
  { status: 'completado',  label: 'DONE',        icon: CheckCircle2, color: C.green,  bg: '#ECFDF5', border: '#A7F3D0' },
]

// ─── Status Dropdown (position:fixed para evitar clipping) ────────────────────
function StatusDropdown({ status, onSelect }: { status: TaskStatus; onSelect: (s: TaskStatus) => void }) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const color = STATUS_COLORS[status]

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      const t = e.target as Node
      if (dropRef.current && !dropRef.current.contains(t) && btnRef.current && !btnRef.current.contains(t))
        setOpen(false)
    }
    const onScroll = () => setOpen(false)
    document.addEventListener('mousedown', h)
    window.addEventListener('scroll', onScroll, true)
    return () => { document.removeEventListener('mousedown', h); window.removeEventListener('scroll', onScroll, true) }
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
      <button ref={btnRef} onClick={handleToggle} style={{
        display: 'flex', alignItems: 'center', gap: 4,
        fontSize: 10, fontWeight: 700, color, backgroundColor: `${color}15`,
        padding: '4px 8px', borderRadius: 5, border: `1.5px solid ${color}30`,
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}>
        <Circle size={6} fill={color} color={color} />
        {STATUS_LABELS[status]}
        <ChevronDown size={10} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
      </button>

      {open && (
        <div ref={dropRef} style={{
          position: 'fixed', top: dropPos.top, right: dropPos.right, zIndex: 9999,
          backgroundColor: '#fff', border: '1px solid #E4E7F0', borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.16)', padding: 4, minWidth: 160,
        }}>
          {COLUMNS.map(({ status: s, label, icon: Icon, color: sc }) => {
            const isActive = s === status
            return (
              <button key={s} onClick={e => { e.stopPropagation(); onSelect(s); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  backgroundColor: isActive ? `${sc}12` : 'transparent', textAlign: 'left',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F6FA' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                <Icon size={12} color={sc} />
                <span style={{ flex: 1, fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? sc : '#374151' }}>
                  {label}
                </span>
                {isActive && <CheckCircle2 size={12} color={sc} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, onClick, onStatusChange, isLast }: {
  task: Task; onClick?: () => void
  onStatusChange: (id: string, s: TaskStatus) => void; isLast?: boolean
}) {
  const clientColor = (task.client as Client & { color: string })?.color || C.red
  const priorityColor = PRIORITY_COLORS[task.priority]
  const assigneeColor = ASSIGNEE_COLORS[task.assignee] || C.muted
  const isCompleted = task.status === 'completado'

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-all"
      style={{
        padding: '10px 14px',
        borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
        opacity: isCompleted ? 0.65 : 1,
        borderLeft: `3px solid ${priorityColor}`,
        backgroundColor: 'transparent',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = '#F7F8FC'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'}
    >
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <p style={{
          fontSize: 12, fontWeight: 600, color: isCompleted ? C.muted : C.text,
          textDecoration: isCompleted ? 'line-through' : 'none',
          lineHeight: 1.35, flex: 1, minWidth: 0,
        }}>
          {task.title}
        </p>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {task.client && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: clientColor,
            backgroundColor: `${clientColor}15`,
            padding: '1px 6px', borderRadius: 4, flexShrink: 0,
          }}>
            {(task.client as Client).name}
          </span>
        )}
        {task.area && (
          <span style={{ fontSize: 9, color: C.muted, fontWeight: 500, flexShrink: 0 }}>{task.area}</span>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Assignee */}
        <div style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          backgroundColor: `${assigneeColor}20`, color: assigneeColor,
          fontSize: 8, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${assigneeColor}40`,
        }} title={task.assignee}>
          {task.assignee.slice(0, 2).toUpperCase()}
        </div>

        {/* Status dropdown */}
        <StatusDropdown status={task.status} onSelect={s => onStatusChange(task.id, s)} />
      </div>
    </div>
  )
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
function KanbanColumn({ col, tasks, onTaskClick, onStatusChange, visible }: {
  col: typeof COLUMNS[number]
  tasks: Task[]
  onTaskClick: (t: Task) => void
  onStatusChange: (id: string, s: TaskStatus) => void
  visible: boolean
}) {
  if (!visible) return null
  const { label, icon: Icon, color, bg, border } = col

  return (
    <div style={{
      flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
      backgroundColor: C.card, borderRadius: 14,
      border: `1px solid ${C.border}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>
      {/* Column header */}
      <div style={{
        padding: '12px 16px', backgroundColor: bg,
        borderBottom: `1px solid ${border}`,
        display: 'flex', alignItems: 'center', gap: 8,
        flexShrink: 0, position: 'sticky', top: 0,
      }}>
        <Icon size={13} color={color} />
        <span style={{ fontSize: 12, fontWeight: 800, color, letterSpacing: '0.03em', flex: 1 }}>
          {label}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700,
          backgroundColor: `${color}20`, color,
          padding: '1px 8px', borderRadius: 99,
        }}>
          {tasks.length}
        </span>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 290px)' }}>
        {tasks.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center' }}>
            <XCircle size={20} color={C.muted} style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>Sin tareas</p>
          </div>
        ) : (
          tasks.map((task, i) => (
            <TaskCard
              key={task.id} task={task}
              isLast={i === tasks.length - 1}
              onClick={() => onTaskClick(task)}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
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
  // Which columns are visible (all by default except done)
  const [visibleCols, setVisibleCols] = useState<Record<TaskStatus, boolean>>({
    en_progreso: true, pendiente: true, revision: true, completado: false,
  })

  const allBomberos = useMemo(() => tasks
    .filter(t => t.priority === 'alta')
    .filter(t => !filterClient || t.client_id === filterClient)
    .filter(t => !filterAssignee || t.assignee === filterAssignee),
  [tasks, filterClient, filterAssignee])

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { en_progreso: [], pendiente: [], revision: [], completado: [] }
    for (const t of allBomberos) {
      if (map[t.status]) map[t.status].push(t)
    }
    return map
  }, [allBomberos])

  const stats = useMemo(() => ({
    total:      tasks.filter(t => t.priority === 'alta').length,
    enProceso:  tasks.filter(t => t.priority === 'alta' && t.status === 'en_progreso').length,
    pendientes: tasks.filter(t => t.priority === 'alta' && t.status === 'pendiente').length,
    blocker:    tasks.filter(t => t.priority === 'alta' && t.status === 'revision').length,
    done:       tasks.filter(t => t.priority === 'alta' && t.status === 'completado').length,
  }), [tasks])

  const assignees = TEAM_MEMBERS.filter(m => m !== 'TBD')
  const handleStatusChange = (id: string, status: TaskStatus) => updateTask.mutate({ id, status })
  const toggleCol = (s: TaskStatus) => setVisibleCols(v => ({ ...v, [s]: !v[s] }))

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: C.bg }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #E2445C 0%, #B03050 100%)', padding: '20px 28px 16px', flexShrink: 0 }}>
        <div className="flex items-center gap-3 mb-4">
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.25)',
          }}>
            <Flame size={20} color="#FFFFFF" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>🔥 Bomberos</h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              Alta prioridad · revisión diaria del equipo
            </p>
          </div>
          <button onClick={() => window.location.reload()} style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)',
            backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)',
          }}>
            <RefreshCw size={11} /> Actualizar
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',      value: stats.total,      icon: AlertTriangle, color: 'rgba(255,255,255,0.9)' },
            { label: 'En Proceso', value: stats.enProceso,  icon: Flame,         color: '#93C5FD' },
            { label: 'Pendientes', value: stats.pendientes, icon: Clock,         color: '#FCD34D' },
            { label: 'Blocker',    value: stats.blocker,    icon: Zap,           color: '#FCA5A5' },
            { label: 'Done',       value: stats.done,       icon: CheckCircle2,  color: '#6EE7B7' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderRadius: 10, padding: '8px 14px',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={12} color={color} />
                <span style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{value}</span>
              </div>
              <p style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.6)', margin: 0, marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters + Column toggles ────────────────────────────────────────── */}
      <div style={{
        backgroundColor: C.card, borderBottom: `1px solid ${C.border}`,
        padding: '10px 28px', flexShrink: 0,
      }}>
        {/* Row 1: Column toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: C.muted, letterSpacing: '0.1em', marginRight: 4 }}>VER</span>
          {COLUMNS.map(col => {
            const active = visibleCols[col.status]
            return (
              <button key={col.status} onClick={() => toggleCol(col.status)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                backgroundColor: active ? col.color : '#F5F6FA',
                color: active ? '#fff' : C.sub,
                boxShadow: active ? `0 2px 8px ${col.color}40` : `inset 0 0 0 1px ${C.border}`,
              }}>
                <col.icon size={10} />
                {col.label}
                <span style={{
                  fontSize: 10, padding: '0px 5px', borderRadius: 10,
                  backgroundColor: active ? 'rgba(255,255,255,0.25)' : C.border,
                  color: active ? '#fff' : C.muted, fontWeight: 700,
                }}>
                  {byStatus[col.status].length}
                </span>
              </button>
            )
          })}
        </div>

        {/* Row 2: Client + assignee filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: C.muted, letterSpacing: '0.1em', marginRight: 2 }}>CLIENTE</span>
          {[{ id: '', name: 'Todos' }, ...clients].map(c => {
            const col = (c as any).color || C.red
            const active = filterClient === c.id
            return (
              <button key={c.id} onClick={() => setFilterClient(active ? '' : c.id)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                backgroundColor: active ? (c.id ? col : C.red) : '#F5F6FA',
                color: active ? '#fff' : C.sub,
                boxShadow: active ? `0 2px 6px ${c.id ? col : C.red}40` : `inset 0 0 0 1px ${C.border}`,
              }}>
                {c.id && <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: active ? 'rgba(255,255,255,0.8)' : col, flexShrink: 0 }} />}
                {c.name}
              </button>
            )
          })}

          <span style={{ fontSize: 9, fontWeight: 800, color: C.muted, letterSpacing: '0.1em', marginLeft: 8, marginRight: 4 }}>PERSONA</span>
          {assignees.map(name => {
            const ac = ASSIGNEE_COLORS[name] || C.muted
            const active = filterAssignee === name
            return (
              <button key={name} onClick={() => setFilterAssignee(active ? '' : name)} title={name} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px 4px 5px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                backgroundColor: active ? ac : '#F5F6FA', color: active ? '#fff' : C.sub,
                boxShadow: active ? `0 2px 8px ${ac}40` : `inset 0 0 0 1px ${C.border}`,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: active ? 'rgba(255,255,255,0.25)' : ac,
                  color: '#fff', fontSize: 8, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: active ? '2px solid rgba(255,255,255,0.4)' : 'none',
                }}>{name.slice(0, 2).toUpperCase()}</div>
                {name}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Kanban Board ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '16px 24px', overflow: 'hidden' }}>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-current animate-spin" style={{ color: C.red }} />
          </div>
        ) : (
          <div style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            height: 'calc(100vh - 270px)',
          }}>
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.status}
                col={col}
                tasks={byStatus[col.status]}
                onTaskClick={t => ctx?.openTaskDetail?.(t)}
                onStatusChange={handleStatusChange}
                visible={visibleCols[col.status]}
              />
            ))}

            {/* All hidden */}
            {!Object.values(visibleCols).some(Boolean) && (
              <div style={{
                flex: 1, backgroundColor: C.card, borderRadius: 14,
                border: `1px solid ${C.border}`, padding: '60px 40px', textAlign: 'center',
              }}>
                <XCircle size={36} color={C.muted} style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Sin columnas visibles</p>
                <p style={{ fontSize: 13, color: C.sub, marginTop: 6 }}>Activa al menos una columna con los botones de arriba.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
