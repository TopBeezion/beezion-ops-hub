import { useMemo, useState, useRef, useEffect } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useOutletContext } from 'react-router-dom'
import type { Task } from '../types'
import { AREA_COLORS, AREA_LABELS, STATUS_COLORS, STATUS_LABELS, ASSIGNEE_COLORS } from '../lib/constants'
import { X, ChevronDown, ChevronLeft, ChevronRight, Zap, Calendar } from 'lucide-react'
import {
  startOfWeek, endOfWeek, addWeeks, subWeeks, format, isWithinInterval,
  parseISO, isSameMonth, getISOWeek, startOfDay,
} from 'date-fns'
import { es } from 'date-fns/locale'

// ─── usePopover ───────────────────────────────────────────────────────────────
function useTLPopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return { open, setOpen, ref }
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────
function TLFilterDrop({ label, value, onChange, options, showAvatar }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string; color?: string }[]
  showAvatar?: boolean
}) {
  const { open, setOpen, ref } = useTLPopover()
  const sel = options.find(o => o.value === value)
  const isActive = !!value
  const oc = sel?.color ?? '#6366F1'
  const C2 = { bg: '#F0F2F8', border: '#E4E7F0', sub: '#5A5E72', muted: '#9699B0', text: '#1A1D27' }

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, padding: '0 10px',
        borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
        backgroundColor: isActive ? `${oc}14` : C2.bg,
        outline: isActive ? `1.5px solid ${oc}50` : `1px solid ${C2.border}`,
        color: isActive ? oc : C2.sub, transition: 'all 0.12s',
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', color: isActive ? oc : C2.muted }}>{label}</span>
        {sel && <><span style={{ width: 1, height: 10, backgroundColor: `${oc}40` }} /><span style={{ fontWeight: 700 }}>{sel.label}</span></>}
        <ChevronDown size={10} style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 400,
          backgroundColor: '#fff', border: `1px solid ${C2.border}`,
          borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.13)',
          padding: 4, minWidth: 190, maxHeight: 360, overflowY: 'auto',
        }}>
          <button onClick={() => { onChange(''); setOpen(false) }} style={{
            display: 'flex', alignItems: 'center', width: '100%', padding: '7px 10px',
            borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12,
            backgroundColor: !value ? '#F5F6FA' : 'transparent', color: C2.muted,
          }}
          onMouseEnter={e => { if (value) (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F6FA' }}
          onMouseLeave={e => { if (value) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}>
            Todos
          </button>
          {options.map(o => {
            const isSel = value === o.value
            const tc = o.color ?? '#6366F1'
            return (
              <button key={o.value} onClick={() => { onChange(isSel ? '' : o.value); setOpen(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                backgroundColor: isSel ? `${tc}12` : 'transparent', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F6FA' }}
              onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}>
                {showAvatar
                  ? <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: isSel ? tc : `${tc}25`, color: isSel ? '#fff' : tc, fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{o.label.slice(0, 2).toUpperCase()}</div>
                  : <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: tc, flexShrink: 0 }} />
                }
                <span style={{ flex: 1, fontSize: 12, fontWeight: isSel ? 700 : 500, color: isSel ? tc : C2.text }}>{o.label}</span>
                {isSel && <span style={{ fontSize: 11, color: tc }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: '#F0F2F8',
  card: '#FFFFFF',
  border: '#E4E7F0',
  text: '#1A1D27',
  sub: '#5A5E72',
  muted: '#9699B0',
  headerBg: '#FFFFFF',
  accent: '#6366F1',
  todayBg: '#FFF9E6',
  todayBorder: '#F59E0B',
}

const AREA_LIST = ['copy', 'trafico', 'tech', 'admin', 'edicion'] as const
const ASSIGNEES = ['Alejandro', 'Alec', 'Jose', 'Luisa', 'Paula', 'David', 'Johan', 'Felipe']

const ASSIGNEE_INITIALS: Record<string, string> = {
  Alejandro: 'AL', Alec: 'AC', Jose: 'JO', Luisa: 'LU',
  Paula: 'PL', David: 'DA', Johan: 'JH', Felipe: 'FE',
}

const MONTH_COLORS = ['#6366F1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

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
  const isDone      = task.status === 'hecho'
  const isUrgent    = task.tipo === 'urgente'
  const initials    = ASSIGNEE_INITIALS[task.assignee] ?? task.assignee.slice(0, 2).toUpperCase()
  const avatarColor = ASSIGNEE_COLORS[task.assignee] ?? '#6366F1'
  const hasDeliverables = task.deliverables && Object.values(task.deliverables).some(v => v && v > 0)
  const dueLabel = task.due_date ? format(parseISO(task.due_date), 'EEE d', { locale: es }) : null

  return (
    <button
      onClick={() => onOpen?.(task)}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        backgroundColor: isDone ? C.bg : C.card,
        border: isUrgent ? '1px solid rgba(239,68,68,0.35)' : `1px solid ${C.border}`,
        borderLeft: `3px solid ${isDone ? C.border : statusColor}`,
        borderRadius: 7, overflow: 'hidden',
        transition: 'all 150ms ease',
        cursor: onOpen ? 'pointer' : 'default',
        position: 'relative',
      }}
      title={`${task.title} · ${task.assignee} · ${STATUS_LABELS[task.status]}${task.due_date ? ` · ${task.due_date}` : ''}`}
      onMouseEnter={e => { if (!isDone) (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
    >
      {isUrgent && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 7, boxShadow: 'inset 0 0 0 1px rgba(239,68,68,0.15)', pointerEvents: 'none' }} />
      )}
      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 3 }}>
          {isUrgent ? (
            <span style={{
              fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 3,
              backgroundColor: '#FEF2F2', color: '#EF4444',
              display: 'inline-flex', alignItems: 'center', gap: 2,
            }}>
              <Zap size={7} /> URGENTE
            </span>
          ) : <span />}
          {dueLabel && (
            <span style={{ fontSize: 8, fontWeight: 700, color: C.muted, textTransform: 'capitalize' }}>
              {dueLabel}
            </span>
          )}
        </div>
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

// ── Week cell ─────────────────────────────────────────────────────
function WeekCell({
  tasks, isToday, onOpen,
}: { tasks: Task[]; isToday: boolean; onOpen?: (t: Task) => void }) {
  const [expanded, setExpanded] = useState(false)
  const MAX_VISIBLE = 4
  const visible = expanded ? tasks : tasks.slice(0, MAX_VISIBLE)
  const hidden  = tasks.length - MAX_VISIBLE
  const done    = tasks.filter(t => t.status === 'hecho').length

  return (
    <div style={{
      padding: '8px 8px',
      borderRight: `1px solid ${C.border}`,
      background: isToday ? C.todayBg : 'transparent',
      borderLeft: isToday ? `2px solid ${C.todayBorder}` : 'none',
      minHeight: 100, display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      {tasks.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 60 }}>
          <span style={{ fontSize: 10, color: '#D1D5DB' }}>—</span>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: C.sub }}>{tasks.length} tareas</span>
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
                color: C.accent, backgroundColor: `${C.accent}08`,
                border: `1px solid ${C.accent}20`, cursor: 'pointer',
              }}
            >
              +{hidden} más
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
              Colapsar
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ── Client label (left col) ──────────────────────────────────────
function ClientLabel({ client, tasks }: { client: { id: string; name: string; color: string }; tasks: Task[] }) {
  const total = tasks.length
  const done  = tasks.filter(t => t.status === 'hecho').length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div style={{
      padding: '12px 14px',
      position: 'sticky', left: 0, zIndex: 2,
      borderRight: `1px solid ${C.border}`,
      backgroundColor: C.card,
      borderTop: `3px solid ${client.color}`,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: '100%',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: client.color }} />
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
            backgroundColor: client.color, borderRadius: 2, transition: 'width 0.7s ease',
          }} />
        </div>
      </div>
    </div>
  )
}

// ── Week header ──────────────────────────────────────────────────
function WeekHeader({ start, end, isToday }: { start: Date; end: Date; isToday: boolean }) {
  const sameMonth = isSameMonth(start, end)
  const label = sameMonth
    ? `${format(start, 'd', { locale: es })}–${format(end, 'd MMM', { locale: es })}`
    : `${format(start, 'd MMM', { locale: es })}–${format(end, 'd MMM', { locale: es })}`
  const wk = getISOWeek(start)
  return (
    <div style={{
      padding: '10px 10px',
      borderRight: `1px solid ${C.border}`,
      borderBottom: `1px solid ${C.border}`,
      background: isToday ? C.todayBg : 'transparent',
      borderTop: isToday ? `3px solid ${C.todayBorder}` : '3px solid transparent',
    }}>
      <p style={{ fontSize: 9, fontWeight: 700, color: isToday ? C.todayBorder : C.muted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Semana {wk}{isToday ? ' · HOY' : ''}
      </p>
      <p style={{ fontSize: 12, fontWeight: 700, color: C.text, marginTop: 2, textTransform: 'capitalize' }}>
        {label}
      </p>
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
  const [numWeeks, setNumWeeks] = useState<number>(() => {
    const v = Number(localStorage.getItem('timeline_weeks'))
    return [6, 8, 12, 16].includes(v) ? v : 8
  })
  const [anchor, setAnchor] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }))

  useEffect(() => { localStorage.setItem('timeline_weeks', String(numWeeks)) }, [numWeeks])

  const weeks = useMemo(() => {
    return Array.from({ length: numWeeks }, (_, i) => {
      const start = addWeeks(anchor, i)
      const end = endOfWeek(start, { weekStartsOn: 1 })
      return { start, end }
    })
  }, [anchor, numWeeks])

  const rangeStart = weeks[0].start
  const rangeEnd = weeks[weeks.length - 1].end
  const today = startOfDay(new Date())

  // Group months across weeks for header band
  const monthBands = useMemo(() => {
    const bands: { label: string; span: number; color: string }[] = []
    let currentLabel = ''
    let currentCount = 0
    let monthIndex = -1
    for (const w of weeks) {
      const monthLabel = format(w.start, 'MMMM yyyy', { locale: es })
      if (monthLabel !== currentLabel) {
        if (currentCount > 0) bands.push({ label: currentLabel, span: currentCount, color: MONTH_COLORS[monthIndex % MONTH_COLORS.length] })
        currentLabel = monthLabel
        currentCount = 1
        monthIndex++
      } else {
        currentCount++
      }
    }
    if (currentCount > 0) bands.push({ label: currentLabel, span: currentCount, color: MONTH_COLORS[monthIndex % MONTH_COLORS.length] })
    return bands
  }, [weeks])

  const tasks = allTasks
    .filter(t => !areaFilter     || t.area     === areaFilter)
    .filter(t => !assigneeFilter || t.assignee === assigneeFilter)
    .filter(t => !clientFilter   || t.client_id === clientFilter)

  // Tasks with due_date in range
  const tasksInRange = useMemo(() => tasks.filter(t => {
    if (!t.due_date) return false
    try {
      const d = parseISO(t.due_date)
      return isWithinInterval(d, { start: rangeStart, end: rangeEnd })
    } catch { return false }
  }), [tasks, rangeStart, rangeEnd])

  const tasksNoDate = useMemo(() => tasks.filter(t => !t.due_date), [tasks])

  const hasFilters = !!(areaFilter || assigneeFilter || clientFilter)
  const isLoading  = clientsLoading || tasksLoading

  const activeClients = clients.filter(c =>
    (!clientFilter || c.id === clientFilter) &&
    tasks.some(t => t.client_id === c.id),
  )

  const getClientWeekTasks = (clientId: string, weekStart: Date, weekEnd: Date) =>
    tasksInRange.filter(t => {
      if (t.client_id !== clientId) return false
      const d = parseISO(t.due_date!)
      return isWithinInterval(d, { start: weekStart, end: weekEnd })
    })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, backgroundColor: C.bg }}>
        <div className="w-7 h-7 rounded-full border-2 border-transparent border-t-current animate-spin" style={{ color: '#6366F1' }} />
      </div>
    )
  }

  const gridTemplate = `200px repeat(${numWeeks}, minmax(160px, 1fr))`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: C.bg }}>

      {/* ── Filter toolbar ─────────────────────────────────────────── */}
      <div style={{
        padding: '8px 16px', backgroundColor: C.card, borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
      }}>
        <TLFilterDrop
          label="Área" value={areaFilter} onChange={setAreaFilter}
          options={AREA_LIST.map(a => ({ value: a, label: AREA_LABELS[a], color: AREA_COLORS[a] }))}
        />
        <TLFilterDrop
          label="Cliente" value={clientFilter} onChange={setClientFilter}
          options={clients.map(c => ({ value: c.id, label: c.name, color: c.color }))}
        />
        <TLFilterDrop
          label="Persona" value={assigneeFilter} onChange={setAssigneeFilter}
          options={ASSIGNEES.map(name => ({ value: name, label: name, color: ASSIGNEE_COLORS[name] || '#9699B0' }))}
          showAvatar
        />
        {hasFilters && (
          <button onClick={() => { setAreaFilter(''); setAssigneeFilter(''); setClientFilter('') }}
            style={{ fontSize: 10, fontWeight: 700, cursor: 'pointer', color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '0 10px', height: 32, display: 'flex', alignItems: 'center', gap: 4 }}>
            <X size={9} strokeWidth={3} /> Limpiar
          </button>
        )}

        <div style={{ flex: 1 }} />

        {/* Nav controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: `1px solid ${C.border}`, borderRadius: 8, padding: 2, backgroundColor: '#F5F6FA' }}>
          <button
            onClick={() => setAnchor(a => subWeeks(a, numWeeks))}
            title="Retroceder"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', color: C.sub }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E4E7F0' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
          ><ChevronLeft size={14} /></button>
          <button
            onClick={() => setAnchor(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            title="Hoy"
            style={{ fontSize: 10, fontWeight: 700, color: C.accent, background: 'transparent', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
          ><Calendar size={11} /> Hoy</button>
          <button
            onClick={() => setAnchor(a => addWeeks(a, numWeeks))}
            title="Avanzar"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', color: C.sub }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E4E7F0' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
          ><ChevronRight size={14} /></button>
        </div>

        {/* Range picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 2, backgroundColor: '#F5F6FA' }}>
          {[6, 8, 12, 16].map(n => (
            <button
              key={n}
              onClick={() => setNumWeeks(n)}
              style={{
                fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                backgroundColor: numWeeks === n ? C.accent : 'transparent',
                color: numWeeks === n ? '#fff' : C.sub,
              }}
            >{n}s</button>
          ))}
        </div>

        <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{tasksInRange.length} tareas · {tasksNoDate.length} sin fecha</span>
      </div>

      {/* ── Grid ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ minWidth: 200 + numWeeks * 160 }}>

          {/* Month bands */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: gridTemplate,
            position: 'sticky', top: 0, zIndex: 11,
            backgroundColor: C.headerBg,
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{ padding: '6px 14px', borderRight: `1px solid ${C.border}` }} />
            {(() => {
              const cells: React.ReactNode[] = []
              let offset = 0
              for (const band of monthBands) {
                cells.push(
                  <div
                    key={`${band.label}-${offset}`}
                    style={{
                      gridColumn: `span ${band.span}`,
                      padding: '6px 10px',
                      borderRight: `1px solid ${C.border}`,
                      background: `linear-gradient(180deg, ${band.color}10, transparent)`,
                      borderTop: `3px solid ${band.color}`,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, color: band.color, textTransform: 'capitalize', letterSpacing: '0.02em' }}>
                      {band.label}
                    </span>
                  </div>,
                )
                offset += band.span
              }
              return cells
            })()}
          </div>

          {/* Week headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: gridTemplate,
            position: 'sticky', top: 38, zIndex: 10,
            backgroundColor: C.headerBg,
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{
              padding: '10px 14px', borderRight: `1px solid ${C.border}`,
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Cliente
              </span>
              <p style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
                {activeClients.length} activos
              </p>
            </div>
            {weeks.map(w => (
              <WeekHeader key={w.start.toISOString()} start={w.start} end={w.end} isToday={isWithinInterval(today, { start: w.start, end: w.end })} />
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
                  gridTemplateColumns: gridTemplate,
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <ClientLabel client={client} tasks={clientTasks} />
                {weeks.map(w => (
                  <WeekCell
                    key={w.start.toISOString()}
                    tasks={getClientWeekTasks(client.id, w.start, w.end)}
                    isToday={isWithinInterval(today, { start: w.start, end: w.end })}
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

          {/* Sin fecha */}
          {tasksNoDate.length > 0 && (
            <div style={{
              marginTop: 16, padding: '10px 16px', borderTop: `2px dashed ${C.border}`,
              backgroundColor: C.card,
            }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                ⚠ {tasksNoDate.length} tareas sin fecha de entrega
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6 }}>
                {tasksNoDate.slice(0, 12).map(t => <TaskCard key={t.id} task={t} onOpen={openTaskDetail} />)}
              </div>
              {tasksNoDate.length > 12 && (
                <p style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>+{tasksNoDate.length - 12} más</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
