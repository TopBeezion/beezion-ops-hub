import { useState } from 'react'
import type { FormEvent } from 'react'
import { X, ChevronDown, AlertTriangle } from 'lucide-react'
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
  { name: 'David',     role: 'Editor',                       color: '#06b6d4', areas: ['copy'] },
  { name: 'Johan',     role: 'Editor',                       color: '#10b981', areas: ['copy'] },
  { name: 'Felipe',    role: 'Editor',                       color: '#f97316', areas: ['copy'] },
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

// ── Shared styles ─────────────────────────────────────────────────────────────
const lbl: React.CSSProperties = {
  color: '#9699A6', fontSize: 10, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, display: 'block',
}
const fieldBase: React.CSSProperties = {
  backgroundColor: '#FFFFFF', border: '1px solid #E6E9EF',
  color: '#1F2128', outline: 'none', width: '100%', borderRadius: 8,
}

// ── Compact styled select ─────────────────────────────────────────────────────
function FieldSel({
  label, value, onChange, options, accentColor,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; color?: string }[]
  accentColor?: string
}) {
  const sel = options.find(o => o.value === value)
  const color = accentColor ?? sel?.color ?? '#6366F1'
  return (
    <div style={{ flex: 1 }}>
      <label style={lbl}>{label}</label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', padding: '7px 28px 7px 10px',
            borderRadius: 8, fontSize: 12, fontWeight: 600,
            appearance: 'none', cursor: 'pointer', outline: 'none',
            border: `1px solid ${color}35`,
            backgroundColor: `${color}0D`,
            color,
          }}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#9699A6', pointerEvents: 'none' }} />
      </div>
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
      title,
      description: description || undefined,
      client_id: clientId || undefined,
      campaign_id: campaignId || undefined,
      area, assignee, priority, status, week, tipo,
      problema: problema || undefined,
      etapa: etapa || undefined,
      mini_status: miniStatus || undefined,
      due_date: dueDate || undefined,
      source: 'manual',
      deliverables: Object.keys(deliverables).length > 0 ? deliverables : undefined,
    })
    onClose()
  }

  // Build options
  const statusOpts   = (Object.entries(STATUS_LABELS)   as [TaskStatus, string][]).map(([v, l]) => ({ value: v, label: l, color: STATUS_COLORS[v] }))
  const priorityOpts = (Object.entries(PRIORITY_LABELS) as [Priority,   string][]).map(([v, l]) => ({ value: v, label: l, color: PRIORITY_COLORS[v] }))
  const tipoOpts = [
    { value: 'nuevo',             label: 'Nuevo',              color: '#9699A6' },
    { value: 'pendiente_anterior', label: 'Pendiente anterior', color: '#F97316' },
    { value: 'urgente',           label: '🚨 Urgente',         color: '#EF4444' },
  ]
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
      <div className="absolute inset-0" onClick={onClose} style={{ backgroundColor: 'rgba(0,0,0,0.25)' }} />
      <div
        className="relative h-full w-full max-w-md flex flex-col overflow-hidden"
        style={{ backgroundColor: '#FFFFFF', borderLeft: '1px solid #E6E9EF', boxShadow: '-8px 0 24px rgba(0,0,0,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 shrink-0" style={{ borderBottom: '1px solid #E6E9EF' }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: '#1F2128' }}>Nueva tarea</h2>
            <p className="text-[10px] mt-0.5" style={{ color: '#9699A6' }}>Completa el detalle de la tarea</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={15} style={{ color: '#9699A6' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-5 space-y-4">

          {/* Título */}
          <div>
            <label style={lbl}>Título <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={fieldBase}
              placeholder="Ej: 50 hooks para campañas de Finkargo..."
            />
          </div>

          {/* Row: Status · Prioridad · Tipo */}
          <div style={{ display: 'flex', gap: 8 }}>
            <FieldSel label="Status" value={status} onChange={v => setStatus(v as TaskStatus)} options={statusOpts} />
            <FieldSel label="Prioridad" value={priority} onChange={v => setPriority(v as Priority)} options={priorityOpts} />
            <FieldSel label="Tipo" value={tipo} onChange={v => setTipo(v as TaskTipo)} options={tipoOpts} />
          </div>

          {/* Área — pills */}
          <div>
            <label style={lbl}>Área</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(Object.entries(AREA_LABELS) as [Area, string][]).map(([v, l]) => {
                const active = area === v
                const col    = AREA_COLORS[v]
                return (
                  <button key={v} type="button" onClick={() => setArea(v)} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                    backgroundColor: active ? col : `${col}12`,
                    color: active ? '#fff' : col,
                    boxShadow: active ? `0 2px 8px ${col}40` : `inset 0 0 0 1.5px ${col}35`,
                  }}>{l}</button>
                )
              })}
            </div>
          </div>

          {/* Responsable — grid */}
          <div>
            <label style={lbl}>Responsable</label>
            <div className="grid grid-cols-2 gap-1.5">
              {ASSIGNEES.map(a => (
                <button
                  key={a.name}
                  type="button"
                  onClick={() => setAssignee(a.name)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all"
                  style={{
                    backgroundColor: assignee === a.name ? `${a.color}10` : '#FAFBFC',
                    border: assignee === a.name ? `1px solid ${a.color}40` : '1px solid #E6E9EF',
                    boxShadow: assignee === a.name ? `0 0 10px ${a.color}15` : 'none',
                  }}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                    style={{ background: `linear-gradient(135deg,${a.color}40,${a.color}20)`, color: a.color, border: `1px solid ${a.color}30` }}>
                    {a.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold" style={{ color: assignee === a.name ? '#1F2128' : '#676879' }}>{a.name}</p>
                    <p className="text-[9px] truncate" style={{ color: '#9699A6' }}>{a.role}</p>
                  </div>
                </button>
              ))}
            </div>
            {assigneeInfo && !assigneeInfo.areas.includes(area) && (
              <p className="text-[10px] mt-1.5 px-1 flex items-center gap-1" style={{ color: '#F59E0B' }}>
                <AlertTriangle size={10} /> {assignee} normalmente cubre {assigneeInfo.areas.join(', ')}, no <strong>{AREA_LABELS[area]}</strong>.
              </p>
            )}
          </div>

          {/* Row: Cliente · Campaña */}
          <div style={{ display: 'flex', gap: 8 }}>
            <FieldSel
              label="Cliente"
              value={clientId}
              onChange={v => { setClientId(v); setCampaignId('') }}
              options={clienteOpts}
              accentColor={(clients ?? []).find(c => c.id === clientId)?.color ?? '#6366F1'}
            />
            <FieldSel
              label="Campaña"
              value={campaignId}
              onChange={setCampaignId}
              options={campanaOpts}
            />
          </div>

          {/* Row: Etapa · Mini Status */}
          <div style={{ display: 'flex', gap: 8 }}>
            <FieldSel
              label="Etapa"
              value={etapa}
              onChange={v => setEtapa(v as Etapa | '')}
              options={etapaOpts}
              accentColor={etapa ? ETAPA_COLORS[etapa as Etapa] : '#9699A6'}
            />
            <FieldSel
              label="Mini Status"
              value={miniStatus}
              onChange={v => setMiniStatus(v as MiniStatus | '')}
              options={miniStatusOpts}
              accentColor={miniStatus ? MINI_STATUS_COLORS[miniStatus as MiniStatus] : '#9699A6'}
            />
          </div>

          {/* Fecha límite + Sprint */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Fecha límite</label>
              <input
                type="date" value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={fieldBase}
              />
            </div>
            <div style={{ flex: 1.4 }}>
              <label style={lbl}>Sprint</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4].map(w => {
                  const sc = SPRINT_COLORS[w]
                  const s  = getSprintDateRange(w)
                  return (
                    <button key={w} type="button" onClick={() => setWeek(w)} className="flex-1 rounded-lg py-2 text-center transition-all"
                      style={{
                        backgroundColor: week === w ? `${sc}14` : '#FAFBFC',
                        border: week === w ? `1.5px solid ${sc}50` : '1px solid #E6E9EF',
                      }}>
                      <p className="text-[11px] font-bold" style={{ color: week === w ? sc : '#9699A6' }}>S{w}</p>
                      <p className="text-[8px] leading-tight" style={{ color: '#C4C7D0' }}>{s.startFmt}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label style={lbl}>Descripción / Instrucciones</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg text-xs leading-relaxed resize-none"
              style={{ ...fieldBase, color: '#676879' }}
              placeholder="Detalla qué hay que hacer, cómo, referencias, observaciones..."
            />
          </div>

          {/* Problema */}
          <div>
            <label style={lbl}>Problema que resuelve</label>
            <input
              value={problema}
              onChange={e => setProblema(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs"
              style={fieldBase}
              placeholder="Ej: Show rate de Book Demos bajo"
            />
          </div>

          {/* Entregables */}
          <div>
            <button
              type="button"
              onClick={() => setShowDel(v => !v)}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-colors"
              style={{
                backgroundColor: showDel ? 'rgba(99,102,241,0.06)' : '#FAFBFC',
                border: `1px solid ${showDel ? 'rgba(99,102,241,0.25)' : '#E6E9EF'}`,
              }}
            >
              <span className="text-xs font-semibold" style={{ color: showDel ? '#6366F1' : '#676879' }}>
                📦 Entregables y cantidades
                {totalDel > 0 && (
                  <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366F1' }}>
                    {totalDel} total
                  </span>
                )}
              </span>
              <ChevronDown size={12} style={{ color: '#9699A6', transform: showDel ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
            </button>

            {showDel && (
              <div className="mt-2 space-y-1.5">
                {relevantDel.map(({ key, label, color }) => {
                  const val = deliverables[key] ?? 0
                  return (
                    <div key={key} className="flex items-center gap-3 px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: val > 0 ? `${color}10` : '#FAFBFC',
                        border: val > 0 ? `1px solid ${color}30` : '1px solid #E6E9EF',
                      }}>
                      <span className="flex-1 text-[11px] font-medium" style={{ color: val > 0 ? color : '#9699A6' }}>{label}</span>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={() => setDeliverable(key, Math.max(0, val - 1))}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: val > 0 ? `${color}20` : '#E6E9EF', color: val > 0 ? color : '#9699A6' }}>−</button>
                        <span className="w-7 text-center text-[12px] font-bold tabular-nums" style={{ color: val > 0 ? color : '#9699A6' }}>{val}</span>
                        <button type="button" onClick={() => setDeliverable(key, val + 1)}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: `${color}20`, color }}>+</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm transition-colors hover:bg-gray-100"
              style={{ border: '1px solid #E6E9EF', color: '#676879' }}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createTask.isPending || !title.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: '#6366F1', color: '#FFFFFF', boxShadow: '0 0 16px rgba(99,102,241,0.2)' }}
            >
              {createTask.isPending ? 'Creando…' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
