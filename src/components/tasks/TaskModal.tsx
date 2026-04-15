import { useState, useRef, useEffect } from 'react'
import type { FormEvent } from 'react'
import { X, ChevronDown, AlertTriangle, Check } from 'lucide-react'
import { useClients } from '../../hooks/useClients'
import { useCampaignsForSelector } from '../../hooks/useCampaigns'
import { useCreateTask } from '../../hooks/useTasks'
import type { Area, Priority, TaskStatus, TaskTipo, Etapa, Deliverables, TaskAttachment } from '../../types'
import {
  AREA_COLORS, AREA_LABELS,
  STATUS_LABELS, STATUS_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS,
  ETAPA_LABELS, ETAPA_COLORS, ETAPA_ORDER, ETAPA_TO_AREA,
  priorityFromDueDate,
} from '../../lib/constants'

const ASSIGNEES = [
  { name: 'Alejandro', role: 'CEO · Copy · Estrategia',      color: '#8b5cf6', areas: ['copy','trafico','tech','admin'] },
  { name: 'Alec',      role: 'Head of Paid · Estrategia',    color: '#f5a623', areas: ['trafico','tech'] },
  { name: 'Jose',      role: 'Trafficker',                   color: '#3b82f6', areas: ['trafico'] },
  { name: 'Luisa',     role: 'Copywriter',                   color: '#ef4444', areas: ['copy'] },
  { name: 'Paula',     role: 'Project Manager',              color: '#ec4899', areas: ['copy','admin','trafico','tech','produccion','edicion'] },
  { name: 'David',     role: 'Editor',                       color: '#06b6d4', areas: ['edicion'] },
  { name: 'Johan',     role: 'Editor',                       color: '#10b981', areas: ['edicion'] },
  { name: 'Felipe',    role: 'Lead Editor',                  color: '#f97316', areas: ['edicion'] },
]

const DELIVERABLE_DEFS: { key: keyof Deliverables; label: string; color: string; areas: Area[] }[] = [
  { key: 'hooks',               label: 'Hooks de video',       color: '#8b5cf6', areas: ['copy'] },
  { key: 'body_copy',           label: 'Body copy / Ad copy',  color: '#3b82f6', areas: ['copy'] },
  { key: 'cta',                 label: 'CTAs',                 color: '#f5a623', areas: ['copy','trafico'] },
  { key: 'lead_magnet_pdf',     label: 'Lead magnets (PDF)',   color: '#22c55e', areas: ['copy','admin'] },
]

// ── Styles ────────────────────────────────────────────────────────────────────
const lbl: React.CSSProperties = {
  color: '#9CA3AF', fontSize: 10, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7, display: 'block',
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
  padding: '14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
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
  label, value, onChange, options, accentColor, required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; color?: string }[]
  accentColor?: string
  required?: boolean
}) {
  const { open, setOpen, ref } = usePopover()
  const sel = options.find(o => o.value === value)
  const color = accentColor ?? sel?.color ?? '#6366F1'

  return (
    <div style={{ flex: 1, position: 'relative' }} ref={ref}>
      <label style={lbl}>{label}{required && <span style={{ color: '#EF4444' }}> *</span>}</label>
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
  const [etapa,        setEtapa]        = useState<Etapa | ''>('')
  const [dueDate,      setDueDate]      = useState('')
  const [attachments,  setAttachments]  = useState<TaskAttachment[]>([])
  const [newAttUrl,    setNewAttUrl]    = useState('')
  const [newAttName,   setNewAttName]   = useState('')
  const [priorityManual, setPriorityManual] = useState(false)
  const [areaManual,   setAreaManual]   = useState(false)
  const [deliverables, setDeliverables] = useState<Deliverables>({})
  const [showDel,      setShowDel]      = useState(false)
  const [justCreated,  setJustCreated]  = useState(false)
  const [errorMsg,     setErrorMsg]     = useState('')

  // Required validation: título, cliente, etapa (fecha de entrega es opcional)
  const isValid = title.trim() !== '' && clientId !== '' && etapa !== ''
  const missing: string[] = []
  if (!title.trim()) missing.push('Título')
  if (!clientId)     missing.push('Cliente')
  if (!etapa)        missing.push('Etapa')

  // Fecha de creación (hoy, read-only)
  const todayISO = new Date().toISOString().slice(0, 10)

  // Auto-derive area from etapa (unless user manually overrode)
  useEffect(() => {
    if (areaManual) return
    if (etapa && ETAPA_TO_AREA[etapa as Etapa]) {
      setArea(ETAPA_TO_AREA[etapa as Etapa])
    }
  }, [etapa, areaManual])

  // Auto-derive priority from due_date (unless user manually overrode)
  useEffect(() => {
    if (priorityManual) return
    if (dueDate) setPriority(priorityFromDueDate(dueDate))
  }, [dueDate, priorityManual])

  const { data: campaigns } = useCampaignsForSelector(clientId || undefined)
  const assigneeInfo = ASSIGNEES.find(a => a.name === assignee)
  const relevantDel  = DELIVERABLE_DEFS.filter(d => d.areas.includes(area))

  // ── Auto-detect etapa from title ──────────────────────────────────────────
  // Tracks the last etapa that was auto-suggested (so we don't override manual picks)
  const autoEtapaRef = useRef<Etapa | ''>('')

  useEffect(() => {
    if (!title.trim()) return
    const tl = ' ' + title.toLowerCase() + ' '
    const isLP =
      tl.includes('landing page') ||
      /\blp\b/.test(tl) ||
      tl.includes('copy lp') ||
      tl.includes('crear lp') ||
      tl.includes('desarrollar lp') ||
      tl.includes('lp de ') ||
      tl.includes('lp del ')
    const isLM =
      tl.includes('lead magnet') ||
      /\blm\b/.test(tl) ||
      tl.includes('lm de ') ||
      tl.includes('lm del ')
    const isProduccion =
      tl.includes('grabar') ||
      tl.includes('grabaci') ||
      tl.includes('footage') ||
      tl.includes('producir') ||
      tl.includes('producci')
    const isTYP =
      tl.includes('thank you page') ||
      /\btyp\b/.test(tl)
    const isTracking =
      tl.includes('tracking') ||
      tl.includes('utm') ||
      tl.includes('evento de conversi') ||
      tl.includes('eventos de conversi') ||
      tl.includes('pixel') ||
      tl.includes('google tag') ||
      tl.includes('conversion event')
    const isEstructuracion =
      tl.includes('media buying') ||
      tl.includes('estructurar campa') ||
      tl.includes('estructuraci') ||
      tl.includes('presupuesto') ||
      tl.includes('budget') ||
      tl.includes('distribuir presupuesto') ||
      tl.includes('pautar')
    const isScripts =
      tl.includes('script') ||
      tl.includes('guion') ||
      tl.includes('guión')
    const isCopy =
      tl.includes('hook') ||
      tl.includes('body copy') ||
      tl.includes('email') ||
      tl.includes('headline') ||
      tl.includes('copy ')

    let detected: Etapa | '' = ''
    if (isLP || isTYP)     detected = 'landing_page'
    else if (isLM)         detected = 'lead_magnet'
    else if (isProduccion) detected = 'produccion'
    else if (isTracking)   detected = 'tracking'
    else if (isEstructuracion) detected = 'estructuracion'
    else if (isScripts)    detected = 'scripts'
    else if (isCopy)       detected = 'scripts'

    if (detected && detected !== autoEtapaRef.current) {
      // Only auto-set if current etapa is empty OR was previously auto-set (not manually chosen)
      setEtapa(prev => {
        if (prev === '' || prev === autoEtapaRef.current) {
          autoEtapaRef.current = detected
          return detected
        }
        return prev // user manually selected something — keep it
      })
    }
  }, [title])

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
    setErrorMsg('')
    if (!isValid) {
      setErrorMsg(`Faltan campos obligatorios: ${missing.join(', ')}`)
      return
    }
    try {
      await createTask.mutateAsync({
        title, description: description || undefined,
        client_id: clientId || undefined, campaign_id: campaignId || undefined,
        area, assignee, priority, status, week, tipo,
        etapa: etapa || undefined,
        due_date: dueDate || undefined,
        priority_manual_override: priorityManual,
        source: 'manual',
        attachments: attachments.length > 0 ? attachments : undefined,
        deliverables: Object.keys(deliverables).length > 0 ? deliverables : undefined,
      })
      setJustCreated(true)
      // Cerrar después de mostrar el éxito para que el usuario vea la confirmación
      setTimeout(() => { onClose() }, 1200)
    } catch (err) {
      // Supabase PostgrestError tiene .message y .details; Error nativo tiene .message
      const msg =
        (err as { message?: string; details?: string })?.message ||
        (err as { details?: string })?.details ||
        (typeof err === 'string' ? err : JSON.stringify(err))
      console.error('[TaskModal] createTask failed:', err)
      setErrorMsg(`Error al crear la tarea: ${msg}`)
    }
  }

  const statusOpts   = (Object.entries(STATUS_LABELS)   as [TaskStatus, string][]).map(([v, l]) => ({ value: v, label: l, color: STATUS_COLORS[v] }))
  const priorityOpts = (Object.entries(PRIORITY_LABELS) as [Priority,   string][]).map(([v, l]) => ({ value: v, label: l, color: PRIORITY_COLORS[v] }))
  // tipo removed from UI — kept in submit payload as default 'nuevo'
  const etapaOpts = [
    { value: '', label: 'Sin etapa', color: '#9699A6' },
    ...ETAPA_ORDER.map(e => ({ value: e, label: ETAPA_LABELS[e as Etapa], color: ETAPA_COLORS[e as Etapa] })),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ padding: '24px' }}>
      <div className="absolute inset-0" onClick={onClose} style={{ backgroundColor: 'rgba(15,17,22,0.45)', backdropFilter: 'blur(4px)' }} />
      <div className="relative flex flex-col overflow-hidden"
        style={{
          width: '100%',
          maxWidth: 980,
          maxHeight: 'calc(100vh - 48px)',
          backgroundColor: '#FFFFFF',
          border: '1px solid #DDE0EA',
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: '1px solid #E8EAF2', flexShrink: 0,
          background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              backgroundColor: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.25)',
            }}>
              <span style={{ fontSize: 16 }}>✦</span>
            </div>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Nueva tarea</h2>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', margin: '1px 0 0' }}>Completa los datos y asigna al responsable</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            padding: 7, borderRadius: 8, border: 'none', cursor: 'pointer',
            backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)',
            display: 'flex', alignItems: 'center',
          }}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto"
          style={{ backgroundColor: '#F0F2F8', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

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
              <FieldSel label={priorityManual ? 'Prioridad (manual)' : 'Prioridad (auto)'} value={priority} onChange={v => { setPriority(v as Priority); setPriorityManual(true) }} options={priorityOpts} />
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
                    <button key={v} type="button" onClick={() => { setArea(v); setAreaManual(true) }} style={{
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ASSIGNEES.map(a => {
                  const isActive = assignee === a.name
                  return (
                    <button key={a.name} type="button" onClick={() => setAssignee(a.name)}
                      title={a.role}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '5px 10px 5px 5px', borderRadius: 20,
                        backgroundColor: isActive ? `${a.color}15` : '#F8F9FC',
                        border: isActive ? `1.5px solid ${a.color}50` : '1px solid #E8EAF2',
                        boxShadow: isActive ? `0 2px 8px ${a.color}25` : 'none',
                        cursor: 'pointer', transition: 'all 0.12s',
                      }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 8, fontWeight: 800,
                        background: `linear-gradient(135deg,${a.color}40,${a.color}20)`,
                        color: a.color, border: `1px solid ${a.color}30`,
                      }}>
                        {a.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 600, color: isActive ? a.color : '#6B7280' }}>{a.name}</span>
                    </button>
                  )
                })}
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
              <FieldSel label="Cliente" required value={clientId}
                onChange={v => { setClientId(v); setCampaignId('') }}
                options={clienteOpts}
                accentColor={(clients ?? []).find(c => c.id === clientId)?.color ?? '#9699A6'} />
              <FieldSel label="Campaña" value={campaignId} onChange={setCampaignId} options={campanaOpts} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <FieldSel label="Etapa" required value={etapa} onChange={v => setEtapa(v as Etapa | '')} options={etapaOpts}
                accentColor={etapa ? ETAPA_COLORS[etapa as Etapa] : '#9699A6'} />
            </div>
          </div>

          {/* ── Card 4: Fecha de Creación (auto) + Fecha de entrega ─────── */}
          <div style={formCard}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Fecha de Creación</label>
                <input type="date" value={todayISO} readOnly disabled
                  style={{ ...fieldBase, padding: '8px 11px', fontSize: 12, backgroundColor: '#EEF0F6', color: '#6B7280', cursor: 'not-allowed' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Fecha de entrega</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  style={{ ...fieldBase, padding: '8px 11px', fontSize: 12 }} />
              </div>
            </div>
          </div>

          {/* ── Card 5: Descripción ──────────────────────────────────────── */}
          <div style={formCard}>
            <div>
              <label style={lbl}>Descripción / Instrucciones</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                style={{ ...fieldBase, padding: '9px 11px', fontSize: 12, color: '#6B7280', resize: 'none', lineHeight: 1.5 }}
                placeholder="Detalla qué hay que hacer, cómo, referencias, observaciones..." />
            </div>
          </div>

          {/* ── Card 5b: Attachments ─────────────────────────────────────── */}
          <div style={formCard}>
            <div>
              <label style={lbl}>Attachments (Drive URLs)</label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input value={newAttName} onChange={e => setNewAttName(e.target.value)}
                  style={{ ...fieldBase, padding: '7px 10px', fontSize: 11, flex: '0 0 100px' }} placeholder="Nombre" />
                <input value={newAttUrl} onChange={e => setNewAttUrl(e.target.value)}
                  style={{ ...fieldBase, padding: '7px 10px', fontSize: 11, flex: 1 }} placeholder="https://drive.google.com/..." />
                <button type="button"
                  onClick={() => {
                    if (!newAttUrl.trim()) return
                    setAttachments(prev => [...prev, { name: newAttName.trim() || newAttUrl.trim(), url: newAttUrl.trim() }])
                    setNewAttName(''); setNewAttUrl('')
                  }}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #6366F1', backgroundColor: '#6366F1', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+</button>
              </div>
              {attachments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {attachments.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 6, backgroundColor: '#F0F2F8', fontSize: 11 }}>
                      <span style={{ flex: 1, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📎 {a.name}</span>
                      <a href={a.url} target="_blank" rel="noreferrer" style={{ color: '#6366F1', fontSize: 10 }}>abrir</a>
                      <button type="button" onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                        style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 12 }}>×</button>
                    </div>
                  ))}
                </div>
              )}
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

          {/* Error banner */}
          {errorMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 10,
              backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5',
              color: '#B91C1C', fontSize: 12, fontWeight: 600,
            }}>
              <AlertTriangle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Missing-fields hint (solo si el usuario ya intentó o hay missing visible) */}
          {!isValid && missing.length > 0 && !errorMsg && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 10,
              backgroundColor: '#FFFBEB', border: '1px solid #FDE68A',
              color: '#92400E', fontSize: 11, fontWeight: 600,
            }}>
              <AlertTriangle size={12} />
              <span>Obligatorios pendientes: {missing.join(', ')}</span>
            </div>
          )}

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4, paddingBottom: 8 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '11px', borderRadius: 10, fontSize: 13, border: '1.5px solid #E4E7F0', color: '#6B7280', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 600 }}>
              Cancelar
            </button>
            <button type="submit" disabled={createTask.isPending || !isValid}
              title={!isValid ? `Faltan: ${missing.join(', ')}` : undefined}
              style={{
                flex: 2, padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: (createTask.isPending || !isValid) ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                opacity: (createTask.isPending || !isValid) ? 0.5 : 1,
              }}>
              {createTask.isPending ? 'Creando…' : '✦  Crear tarea'}
            </button>
          </div>
        </form>

        {/* Success overlay — confirma visualmente antes de cerrar */}
        {justCreated && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 700,
            backgroundColor: 'rgba(255,255,255,0.96)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
            animation: 'fadeIn 0.15s ease',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(16,185,129,0.35)',
            }}>
              <Check size={32} color="#fff" strokeWidth={3} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#065F46', margin: 0 }}>¡Tarea creada!</p>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>Se notificó al responsable por Slack.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
