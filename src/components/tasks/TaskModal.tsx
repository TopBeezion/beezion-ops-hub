import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import { X, ChevronDown, AlertTriangle, Check } from 'lucide-react'
import { useClients } from '../../hooks/useClients'
import { useCampaignsByClient } from '../../hooks/useCampaigns'
import { useCreateTask } from '../../hooks/useTasks'
import type { Area, Priority, TaskStatus, TaskTipo, Etapa, MiniStatus, Deliverables } from '../../types'
import {
  AREA_COLORS, AREA_LABELS,
  STATUS_LABELS, STATUS_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS,
  ETAPA_LABELS, ETAPA_COLORS, ETAPA_ORDER,
  MINI_STATUS_LABELS, MINI_STATUS_COLORS, MINI_STATUS_ORDER,
} from '../../lib/constants'
import { getSprintDateRange } from '../../lib/dates'

const ASSIGNEES = [
  { name: 'Alejandro', role: 'CEO · Copy · Estrategia',      color: '#8b5cf6', areas: ['copy','trafico','tech','admin'] },
  { name: 'Alec',      role: 'Head of Paid · Estrategia',    color: '#f5a623', areas: ['trafico','tech'] },
  { name: 'Jose',      role: 'Trafficker',                   color: '#3b82f6', areas: ['trafico'] },
  { name: 'Luisa',     role: 'Copywriter',                   color: '#ef4444', areas: ['copy'] },
  { name: 'Paula',     role: 'Aux. Marketing · Grabaciones', color: '#ec4899', areas: ['copy','admin'] },
  { name: 'David',     role: 'Editor',                       color: '#06b6d4', areas: ['edicion'] },
  { name: 'Johan',     role: 'Editor',                       color: '#10b981', areas: ['edicion'] },
  { name: 'Felipe',    role: 'Lead Editor',                  color: '#f97316', areas: ['edicion'] },
]

const DELIVERABLE_DEFS: { key: keyof Deliverables; label: string; color: string; areas: Area[] }[] = [
  { key: 'hooks',               label: 'Hooks de video',       color: '#8b5cf6', areas: ['copy'] },
  { key: 'scripts_video',       label: 'Scripts video',        color: '#ec4899', areas: ['copy'] },
  { key: 'body_copy',           label: 'Body copy / Ad copy',  color: '#3b82f6', areas: ['copy'] },
  { key: 'cta',                 label: 'CTAs',                 color: '#f5a623', areas: ['copy','trafico'] },
  { key: 'lead_magnet_pdf',     label: 'Lead magnets (PDF)',   color: '#22c55e', areas: ['copy','admin'] },
  { key: 'vsl_script',          label: 'Scripts VSL',          color: '#06b6d4', areas: ['copy'] },
  { key: 'landing_copy',        label: 'Landing page copy',    color: '#f97316', areas: ['copy','tech'] },
  { key: 'thank_you_page_copy', label: 'Thank you page',       color: '#fbbf24', areas: ['copy','tech'] },
  { key: 'carousel_slides',     label: 'Slides / Carrusel',    color: '#a78bfa', areas: ['copy','admin'] },
  { key: 'headline_options',    label: 'Opciones de headline', color: '#f472b6', areas: ['copy'] },
  { key: 'retargeting_scripts', label: 'Scripts retargeting',  color: '#34d399', areas: ['copy','trafico'] },
]

const SPRINT_COLORS: Record<number, string> = { 1: '#8b5cf6', 2: '#ec4899', 3: '#3b82f6', 4: '#22c55e' }

// ── Styles ────────────────────────────────────────────────────────────────────
const lbl: React.CSSProperties = {
  color: '#9CA3AF', fontSize: 10, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'block',
}
const fieldBase: React.CSSProperties = {
  backgroundColor: '#F8F9FC', border: '1px solid #E4E7F0',
  color: '#1F2128', outline: 'none', width: '100%', borderRadius: 8,
}
// White card — groups related fields visually
const formCard: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E8EAF2',
  borderRadius: 12,
  padding: '18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

// ── usePopover ────────────────────────────────────────────────────────────────
function usePopover() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return { open, setOpen, ref }
}

// ── Custom dropdown ───────────────────────────────────────────────────────────
function FieldSel({
  label, value, onChange, options, accentColor,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; color?: string }[]
  accentColor?: string
}) {
  const { open, setOpen, ref } = usePopover()
  const sel = options.find(o => o.value === value)
  const color = accentColor ?? sel?.color ?? '#6366F1'

  return (
    <div style={{ flex: 1, position: 'relative' }} ref={ref}>
      <label style={lbl}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
          border: `1px solid ${color}40`, backgroundColor: `${color}0D`, outline: 'none',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left', fontSize: 12, fontWeight: 600, color }}>{sel?.label ?? ''}</span>
        <ChevronDown size={11} style={{ color: '#9699A6', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 600,
          backgroundColor: '#fff', border: '1px solid #E4E7F0', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 4, maxHeight: 220, overflowY: 'auto',
        }}>
          {options.map(o => {
            const isActive = o.value === value
            const oc = o.color ?? '#6366F1'
            return (
              <button key={o.value} type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  backgroundColor: isActive ? `${oc}12` : 'transparent',
                  transition: 'background 0.1s', textAlign: 'left',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F5F5' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: oc, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? oc : '#374151' }}>{o.label}</span>
                {isActive && <Check size={11} color={oc} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface TaskModalProps {
  onClose: () => void
  defaultClientId?: string
  defaultCampaignId?: string
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TaskModal({ onClose, defaultClientId, defaultCampaignId }: TaskModalProps) {
  const { data: clients } = useClients()
  const createTask = useCreateTask()

  const [title,        setTitle]        = useState('')
  const [description,  setDescription]  = useState('')
  const [clientId,     setClientId]     = useState(defaultClientId || '')
  const [campaignId,   setCampaignId]   = useState(defaultCampaignId || '')
  const [area,         setArea]         = useState<Area>('copy')
  const [assignee,     setAssignee]     = useState('Alejandro')
  const [priority,     setPriority]     = useState<Priority>('media')
  const [status,       setStatus]       = useState<TaskStatus>('pendiente')
  const [week,         setWeek]         = useState(1)
  const [tipo,         setTipo]         = useState<TaskTipo>('nuevo')
  const [problema,     setProblema]     = useState('')
  const [etapa,        setEtapa]        = useState<Etapa | ''>('')
  const [miniStatus,   setMiniStatus]   = useState<MiniStatus | ''>('')
  const [dueDate,      setDueDate]      = useState('')
  const [deliverables, setDeliverables] = useState<Deliverables>({})
  const [showDel,      setShowDel]      = useState(false)

  const { data: campaigns } = useCampaignsByClient(clientId || undefined)
  const assigneeInfo = ASSIGNEES.find(a => a.name === assignee)
  const relevantDel  = DELIVERABLE_DEFS.filter(d => d.areas.includes(area))

  const setDeliverable = (key: keyof Deliverables, val: number) => {
    setDeliverables(prev => {
      const next = { ...prev }
      if (val > 0) next[key] = val
      else delete next[key]
      return next
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await createTask.mutateAsync({
      title, description: description || undefined,
      client_id: clientId || undefined, campaign_id: campaignId || undefined,
      area, assignee, priority, status, week, tipo,
      problema: problema || undefined, etapa: etapa || undefined,
      mini_status: miniStatus || undefined, due_date: dueDate || undefined,
      source: 'manual',
      deliverables: Object.keys(deliverables).length > 0 ? deliverables : undefined,
    })
    onClose()
  }

  const statusOpts   = (Object.entries(STATUS_LABELS)   as [TaskStatus, string][]).map(([v, l]) => ({ value: v, label: l, color: STATUS_COLORS[v] }))
  const priorityOpts = (Object.entries(PRIORITY_LABELS) as [Priority,   string][]).map(([v, l]) => ({ value: v, label: l, color: PRIORITY_COLORS[v] }))
  // tipo removed from UI — kept in submit payload as default 'nuevo'
  const etapaOpts = [
    { value: '', label: 'Sin etapa', color: '#9699A6' },
    ...ETAPA_ORDER.map(e => ({ value: e, label: ETAPA_LABELS[e as Etapa], color: ETAPA_COLORS[e as Etapa] })),
  ]
  const miniStatusOpts = [
    { value: '', label: 'Sin mini status', color: '#9699A6' },
    ...MINI_STATUS_ORDER.map(s => ({ value: s, label: MINI_STATUS_LABELS[s as MiniStatus], color: MINI_STATUS_COLORS[s as MiniStatus] })),
  ]
  const clienteOpts = [
    { value: '', label: 'Sin cliente', color: '#9699A6' },
    ...(clients ?? []).map(c => ({ value: c.id, label: c.name, color: c.color })),
  ]
  const campanaOpts = [
    { value: '', label: 'Sin campaña', color: '#9699A6' },
    ...(campaigns ?? []).map(c => ({ value: c.id, label: c.name, color: '#6366F1' })),
  ]
  const totalDel = Object.values(deliverables).reduce((s, v) => s + (v ?? 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0" onClick={onClose} style={{ backgroundColor: 'rgba(15,17,22,0.2)', backdropFilter: 'blur(2px)' }} />
      <div className="relative h-full w-full max-w-md flex flex-col overflow-hidden"
        style={{ backgroundColor: '#FFFFFF', borderLeft: '1px solid #DDE0EA', boxShadow: '-16px 0 48px rgba(0,0,0,0.12)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 shrink-0" style={{ borderBottom: '1px solid #DDE0EA' }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1F2128', margin: 0 }}>Nueva tarea</h2>
            <p style={{ fontSize: 10, color: '#9699A6', margin: '2px 0 0' }}>Completa el detalle de la tarea</p>
          </div>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 8, border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: '#9699A6' }}>
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto"
          style={{ backgroundColor: '#F0F2F8', padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Card 1: Título + Status + Prioridad ──────────────────────── */}
          <div style={formCard}>
            <div>
              <label style={lbl}>Título <span style={{ color: '#EF4444' }}>*</span></label>
              <input value={title} onChange={e => setTitle(e.target.value)} required
                style={{ ...fieldBase, padding: '9px 11px', fontSize: 13 }}
                placeholder="Ej: 50 hooks para campañas de Finkargo..." />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <FieldSel label="Status" value={status} onChange={v => setStatus(v as TaskStatus)} options={statusOpts} />
              <FieldSel label="Prioridad" value={priority} onChange={v => setPriority(v as Priority)} options={priorityOpts} />
            </div>
          </div>

          {/* ── Card 2: Área + Responsable ───────────────────────────────── */}
          <div style={formCard}>
            <div>
              <label style={lbl}>Área</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(Object.entries(AREA_LABELS) as [Area, string][]).map(([v, l]) => {
                  const active = area === v
                  const col    = AREA_COLORS[v]
                  return (
                    <button key={v} type="button" onClick={() => setArea(v)} style={{
                      padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                      backgroundColor: active ? col : `${col}12`, color: active ? '#fff' : col,
                      boxShadow: active ? `0 2px 8px ${col}40` : `inset 0 0 0 1.5px ${col}35`,
                    }}>{l}</button>
                  )
                })}
              </div>
            </div>
            <div>
              <label style={lbl}>Responsable</label>
              <div className="grid grid-cols-2 gap-2.5">
                {ASSIGNEES.map(a => (
                  <button key={a.name} type="button" onClick={() => setAssignee(a.name)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left"
                    style={{
                      backgroundColor: assignee === a.name ? `${a.color}10` : '#F8F9FC',
                      border: assignee === a.name ? `1.5px solid ${a.color}50` : '1px solid #E8EAF2',
                      boxShadow: assignee === a.name ? `0 0 12px ${a.color}20` : 'none',
                      cursor: 'pointer', transition: 'all 0.12s',
                    }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, background: `linear-gradient(135deg,${a.color}40,${a.color}20)`, color: a.color, border: `1px solid ${a.color}30` }}>
                      {a.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: assignee === a.name ? '#1F2128' : '#6B7280', margin: 0 }}>{a.name}</p>
                      <p style={{ fontSize: 9, color: '#9CA3AF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.role}</p>
                    </div>
                  </button>
                ))}
              </div>
              {assigneeInfo && !assigneeInfo.areas.includes(area) && (
                <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#F59E0B', marginTop: 6 }}>
                  <AlertTriangle size={10} /> {assignee} normalmente cubre {assigneeInfo.areas.join(', ')}, no <strong>{AREA_LABELS[area]}</strong>.
                </p>
              )}
            </div>
          </div>

          {/* ── Card 3: Cliente + Campaña + Etapa + Mini Status ──────────── */}
          <div style={formCard}>
            <div style={{ display: 'flex', gap: 10 }}>
              <FieldSel label="Cliente" value={clientId}
                onChange={v => { setClientId(v); setCampaignId('') }}
                options={clienteOpts}
                accentColor={(clients ?? []).find(c => c.id === clientId)?.color ?? '#9699A6'} />
              <FieldSel label="Campaña" value={campaignId} onChange={setCampaignId} options={campanaOpts} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <FieldSel label="Etapa" value={etapa} onChange={v => setEtapa(v as Etapa | '')} options={etapaOpts}
                accentColor={etapa ? ETAPA_COLORS[etapa as Etapa] : '#9699A6'} />
              <FieldSel label="Mini Status" value={miniStatus} onChange={v => setMiniStatus(v as MiniStatus | '')} options={miniStatusOpts}
                accentColor={miniStatus ? MINI_STATUS_COLORS[miniStatus as MiniStatus] : '#9699A6'} />
            </div>
          </div>

          {/* ── Card 4: Fecha límite + Sprint ─────────────────────────────── */}
          <div style={formCard}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flex: '0 0 140px' }}>
                <label style={lbl}>Fecha límite</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  style={{ ...fieldBase, padding: '7px 10px', fontSize: 12 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Sprint</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4].map(w => {
                    const sc = SPRINT_COLORS[w]
                    const s  = getSprintDateRange(w)
                    return (
                      <button key={w} type="button" onClick={() => setWeek(w)} style={{
                        flex: 1, borderRadius: 8, padding: '6px 2px', textAlign: 'center',
                        backgroundColor: week === w ? `${sc}14` : '#F8F9FC',
                        border: week === w ? `1.5px solid ${sc}50` : '1px solid #E8EAF2',
                        cursor: 'pointer', transition: 'all 0.12s',
                      }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: week === w ? sc : '#9CA3AF', margin: 0 }}>S{w}</p>
                        <p style={{ fontSize: 8, color: '#BFC3CF', margin: 0, whiteSpace: 'nowrap' }}>{s.startFmt}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Card 5: Descripción + Problema ───────────────────────────── */}
          <div style={formCard}>
            <div>
              <label style={lbl}>Descripción / Instrucciones</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                style={{ ...fieldBase, padding: '9px 11px', fontSize: 12, color: '#6B7280', resize: 'none', lineHeight: 1.5 }}
                placeholder="Detalla qué hay que hacer, cómo, referencias, observaciones..." />
            </div>
            <div>
              <label style={lbl}>Problema que resuelve</label>
              <input value={problema} onChange={e => setProblema(e.target.value)}
                style={{ ...fieldBase, padding: '8px 11px', fontSize: 12 }}
                placeholder="Ej: Show rate de Book Demos bajo" />
            </div>
          </div>

          {/* ── Card 6: Entregables ───────────────────────────────────────── */}
          <div style={formCard}>
            <button type="button" onClick={() => setShowDel(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6366F1' }}>
                📦 Entregables y cantidades
                {totalDel > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, backgroundColor: 'rgba(99,102,241,0.1)', color: '#6366F1' }}>
                    {totalDel} total
                  </span>
                )}
              </span>
              <ChevronDown size={12} style={{ color: '#9CA3AF', transform: showDel ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
            </button>
            {showDel && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {relevantDel.map(({ key, label, color }) => {
                  const val = deliverables[key] ?? 0
                  return (
                    <div key={key} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8,
                      backgroundColor: val > 0 ? `${color}08` : '#F8F9FC',
                      border: val > 0 ? `1px solid ${color}25` : '1px solid #E8EAF2',
                    }}>
                      <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: val > 0 ? color : '#9CA3AF' }}>{label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <button type="button" onClick={() => setDeliverable(key, Math.max(0, val - 1))}
                          style={{ width: 22, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: val > 0 ? `${color}20` : '#E8EAF2', color: val > 0 ? color : '#9CA3AF' }}>−</button>
                        <span style={{ width: 26, textAlign: 'center', fontSize: 12, fontWeight: 700, color: val > 0 ? color : '#9CA3AF' }}>{val}</span>
                        <button type="button" onClick={() => setDeliverable(key, val + 1)}
                          style={{ width: 22, height: 22, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}20`, color }}>+</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, border: '1px solid #E4E7F0', color: '#6B7280', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 500 }}>
              Cancelar
            </button>
            <button type="submit" disabled={createTask.isPending || !title.trim()}
              style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.3)', opacity: (createTask.isPending || !title.trim()) ? 0.5 : 1 }}>
              {createTask.isPending ? 'Creando…' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
