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
  { name: 'Alejandro', role: 'CEO · Copy · Estrategia',             color: '#8b5cf6', areas: ['copy', 'trafico', 'tech', 'admin'] },
  { name: 'Alec',      role: 'Head of Paid · Estrategia',           color: '#f5a623', areas: ['trafico', 'tech'] },
  { name: 'Jose',      role: 'Trafficker',                          color: '#3b82f6', areas: ['trafico'] },
  { name: 'Luisa',     role: 'Copywriter',                          color: '#ef4444', areas: ['copy'] },
  { name: 'Paula',     role: 'Aux. Marketing · Grabaciones',        color: '#ec4899', areas: ['copy', 'admin'] },
  { name: 'David',     role: 'Editor',                              color: '#06b6d4', areas: ['copy'] },
  { name: 'Johan',     role: 'Editor',                              color: '#10b981', areas: ['copy'] },
  { name: 'Felipe',    role: 'Editor',                              color: '#f97316', areas: ['copy'] },
]

const DELIVERABLE_DEFS: { key: keyof Deliverables; label: string; color: string; areas: Area[] }[] = [
  { key: 'hooks',               label: 'Hooks de video',       color: '#8b5cf6', areas: ['copy'] },
  { key: 'scripts_video',       label: 'Scripts video',        color: '#ec4899', areas: ['copy'] },
  { key: 'body_copy',           label: 'Body copy / Ad copy',  color: '#3b82f6', areas: ['copy'] },
  { key: 'cta',                 label: 'CTAs',                 color: '#f5a623', areas: ['copy', 'trafico'] },
  { key: 'lead_magnet_pdf',     label: 'Lead magnets (PDF)',   color: '#22c55e', areas: ['copy', 'admin'] },
  { key: 'vsl_script',          label: 'Scripts VSL',          color: '#06b6d4', areas: ['copy'] },
  { key: 'landing_copy',        label: 'Landing page copy',    color: '#f97316', areas: ['copy', 'tech'] },
  { key: 'thank_you_page_copy', label: 'Thank you page',       color: '#fbbf24', areas: ['copy', 'tech'] },
  { key: 'carousel_slides',     label: 'Slides / Carrusel',    color: '#a78bfa', areas: ['copy', 'admin'] },
  { key: 'headline_options',    label: 'Opciones de headline', color: '#f472b6', areas: ['copy'] },
  { key: 'retargeting_scripts', label: 'Scripts retargeting',  color: '#34d399', areas: ['copy', 'trafico'] },
]

const SPRINT_COLORS: Record<number, string> = {
  1: '#8b5cf6', 2: '#ec4899', 3: '#3b82f6', 4: '#22c55e',
}
const SPRINT_SUBS: Record<number, string> = {
  1: 'Copy & Briefs', 2: 'Producción & Diseño', 3: 'Dev & Setup', 4: 'Launch & Optim.',
}

interface TaskModalProps {
  onClose: () => void
  defaultClientId?: string
  defaultCampaignId?: string
}

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
  const [showDeliverables, setShowDeliverables] = useState(false)

  // Load campaigns for selected client
  const { data: campaigns } = useCampaignsByClient(clientId || undefined)

  const assigneeInfo = ASSIGNEES.find(a => a.name === assignee)
  const relevantDeliverables = DELIVERABLE_DEFS.filter(d => d.areas.includes(area))

  const handleClientChange = (val: string) => {
    setClientId(val)
    setCampaignId('') // reset campaign when client changes
  }

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
    const hasDeliverables = Object.keys(deliverables).length > 0
    await createTask.mutateAsync({
      title,
      description: description || undefined,
      client_id: clientId || undefined,
      campaign_id: campaignId || undefined,
      area,
      assignee,
      priority,
      status,
      week,
      tipo,
      problema: problema || undefined,
      etapa: etapa || undefined,
      mini_status: miniStatus || undefined,
      due_date: dueDate || undefined,
      source: 'manual',
      deliverables: hasDeliverables ? deliverables : undefined,
    })
    onClose()
  }

  const fieldStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E6E9EF',
    color: '#1F2128',
    outline: 'none',
    width: '100%',
    borderRadius: 8,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0" onClick={onClose} style={{ backgroundColor: 'rgba(0,0,0,0.25)' }} />
      <div
        className="relative h-full w-full max-w-md flex flex-col overflow-hidden"
        style={{
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid #E6E9EF',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ borderBottom: '1px solid #E6E9EF', backgroundColor: '#FFFFFF' }}
        >
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
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#676879' }}>
              Título <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={fieldStyle}
              placeholder="Ej: 50 hooks para campañas de Finkargo..."
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#676879' }}>
              Descripción / Instrucciones
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg text-xs leading-relaxed resize-none"
              style={{ ...fieldStyle, color: '#676879' }}
              placeholder="Detalla qué hay que hacer, cómo, referencias, observaciones..."
            />
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#676879' }}>Cliente</label>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => handleClientChange('')} style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                backgroundColor: !clientId ? '#6366F1' : '#F3F4F6',
                color: !clientId ? '#fff' : '#9699A6',
                boxShadow: !clientId ? '0 2px 6px #6366F140' : 'inset 0 0 0 1.5px #E5E7EB',
              }}>Sin cliente</button>
              {clients?.map(c => {
                const active = clientId === c.id
                return (
                  <button key={c.id} type="button" onClick={() => handleClientChange(c.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                    backgroundColor: active ? c.color : `${c.color}12`,
                    color: active ? '#fff' : c.color,
                    boxShadow: active ? `0 2px 6px ${c.color}40` : `inset 0 0 0 1.5px ${c.color}35`,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: active ? 'rgba(255,255,255,0.7)' : c.color, display: 'inline-block', flexShrink: 0 }} />
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Campaña */}
          {clientId && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#676879' }}>Campaña</label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setCampaignId('')} style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                  backgroundColor: !campaignId ? '#6366F1' : '#F3F4F6',
                  color: !campaignId ? '#fff' : '#9699A6',
                  boxShadow: !campaignId ? '0 2px 6px #6366F140' : 'inset 0 0 0 1.5px #E5E7EB',
                }}>Sin campaña</button>
                {campaigns?.map(c => {
                  const active = campaignId === c.id
                  return (
                    <button key={c.id} type="button" onClick={() => setCampaignId(c.id)} style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                      backgroundColor: active ? '#6366F1' : '#EEF2FF',
                      color: active ? '#fff' : '#4F46E5',
                      boxShadow: active ? '0 2px 6px #6366F140' : 'inset 0 0 0 1.5px #C7D2FE',
                    }}>{c.name}</button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Etapa + Mini Status */}
          {campaignId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#676879' }}>Etapa</label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {['', ...ETAPA_ORDER].map(e => {
                    const active = etapa === e
                    const col = e ? ETAPA_COLORS[e as Etapa] : '#9699A6'
                    return (
                      <button key={e || '_none'} type="button" onClick={() => setEtapa(e as Etapa | '')} style={{
                        padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                        cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                        backgroundColor: active ? col : `${col}12`,
                        color: active ? '#fff' : col,
                        boxShadow: active ? `0 2px 5px ${col}40` : `inset 0 0 0 1.5px ${col}35`,
                      }}>{e ? ETAPA_LABELS[e as Etapa].split(' ')[0] : 'Ninguna'}</button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#676879' }}>Mini status</label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {['', ...MINI_STATUS_ORDER].map(s => {
                    const active = miniStatus === s
                    const col = s ? MINI_STATUS_COLORS[s as MiniStatus] : '#9699A6'
                    return (
                      <button key={s || '_none'} type="button" onClick={() => setMiniStatus(s as MiniStatus | '')} style={{
                        padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                        cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                        backgroundColor: active ? col : `${col}12`,
                        color: active ? '#fff' : col,
                        boxShadow: active ? `0 2px 5px ${col}40` : `inset 0 0 0 1.5px ${col}35`,
                      }}>{s ? MINI_STATUS_LABELS[s as MiniStatus] : 'Ninguno'}</button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Área + Prioridad + Status + Tipo — chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Área */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#676879' }}>Área</label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {(Object.entries(AREA_LABELS) as [Area, string][]).map(([v, l]) => {
                  const active = area === v
                  const col = AREA_COLORS[v]
                  return (
                    <button key={v} type="button" onClick={() => setArea(v)} style={{
                      padding: '5px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                      backgroundColor: active ? col : `${col}12`,
                      color: active ? '#fff' : col,
                      boxShadow: active ? `0 2px 8px ${col}40` : `inset 0 0 0 1.5px ${col}35`,
                    }}>{l}</button>
                  )
                })}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: '#676879' }}>Status</label>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([v, l]) => {
                  const active = status === v
                  const col = STATUS_COLORS[v]
                  return (
                    <button key={v} type="button" onClick={() => setStatus(v)} style={{
                      padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                      backgroundColor: active ? col : `${col}12`,
                      color: active ? '#fff' : col,
                      boxShadow: active ? `0 2px 6px ${col}40` : `inset 0 0 0 1.5px ${col}35`,
                    }}>{l}</button>
                  )
                })}
              </div>
            </div>

            {/* Priority + Tipo side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#676879' }}>Prioridad</label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([v, l]) => {
                    const active = priority === v
                    const col = PRIORITY_COLORS[v]
                    return (
                      <button key={v} type="button" onClick={() => setPriority(v)} style={{
                        padding: '4px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                        cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                        backgroundColor: active ? col : `${col}12`,
                        color: active ? '#fff' : col,
                        boxShadow: active ? `0 2px 6px ${col}40` : `inset 0 0 0 1.5px ${col}35`,
                      }}>{l}</button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: '#676879' }}>Tipo</label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {([
                    { v: 'nuevo' as TaskTipo,             l: 'Nuevo',     col: '#9699A6' },
                    { v: 'pendiente_anterior' as TaskTipo, l: 'Anterior',  col: '#F97316' },
                    { v: 'urgente' as TaskTipo,            l: '🚨 Urgente', col: '#EF4444' },
                  ]).map(({ v, l, col }) => {
                    const active = tipo === v
                    return (
                      <button key={v} type="button" onClick={() => setTipo(v)} style={{
                        padding: '4px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                        cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                        backgroundColor: active ? col : `${col}12`,
                        color: active ? '#fff' : col,
                        boxShadow: active ? `0 2px 6px ${col}40` : `inset 0 0 0 1.5px ${col}35`,
                      }}>{l}</button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Fecha límite */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#676879' }}>Fecha límite</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={fieldStyle}
            />
          </div>

          {/* Sprint week */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#676879' }}>Sprint</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map(w => {
                const sc = SPRINT_COLORS[w]
                const dates = getSprintDateRange(w)
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWeek(w)}
                    className="rounded-lg p-2 text-center transition-all"
                    style={{
                      backgroundColor: week === w ? `${sc}12` : '#FAFBFC',
                      border: week === w ? `1px solid ${sc}30` : '1px solid #E6E9EF',
                    }}
                  >
                    <p className="text-[12px] font-bold" style={{ color: week === w ? sc : '#9699A6' }}>S{w}</p>
                    <p className="text-[9px] mt-0.5 leading-tight" style={{ color: '#9699A6' }}>{SPRINT_SUBS[w]}</p>
                    <p className="text-[8px] mt-0.5 leading-tight" style={{ color: week === w ? sc : '#9699A6' }}>
                      {dates.startFmt}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Responsable */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#676879' }}>Responsable</label>
            <div className="grid grid-cols-2 gap-1.5">
              {ASSIGNEES.map(a => (
                <button
                  key={a.name}
                  type="button"
                  onClick={() => setAssignee(a.name)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all"
                  style={{
                    backgroundColor: assignee === a.name ? '#EEF2FF' : '#FAFBFC',
                    border: assignee === a.name ? `1px solid ${a.color}40` : '1px solid #E6E9EF',
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                    style={{ background: `linear-gradient(135deg, ${a.color}40, ${a.color}20)`, color: a.color, border: `1px solid ${a.color}30` }}
                  >
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
              <p className="text-[10px] mt-1.5 px-1" style={{ color: '#F59E0B' }}>
                <AlertTriangle size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {assignee} normalmente cubre {assigneeInfo.areas.join(', ')}, no <strong>{AREA_LABELS[area]}</strong>.
              </p>
            )}
          </div>

          {/* Problema */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#676879' }}>Problema que resuelve</label>
            <input
              value={problema}
              onChange={e => setProblema(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs"
              style={fieldStyle}
              placeholder="Ej: Show rate de Book Demos bajo"
            />
          </div>

          {/* Entregables */}
          <div>
            <button
              type="button"
              onClick={() => setShowDeliverables(v => !v)}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-colors"
              style={{
                backgroundColor: showDeliverables ? 'rgba(99,102,241,0.06)' : '#FAFBFC',
                border: `1px solid ${showDeliverables ? 'rgba(99,102,241,0.25)' : '#E6E9EF'}`,
              }}
            >
              <span className="text-xs font-semibold" style={{ color: showDeliverables ? '#6366F1' : '#676879' }}>
                📦 Entregables y cantidades
                {Object.keys(deliverables).length > 0 && (
                  <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366F1' }}>
                    {Object.values(deliverables).reduce((s, v) => s + (v ?? 0), 0)} total
                  </span>
                )}
              </span>
              <ChevronDown size={12} style={{ color: '#9699A6', transform: showDeliverables ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
            </button>

            {showDeliverables && (
              <div className="mt-2 space-y-1.5">
                {relevantDeliverables.map(({ key, label, color }) => {
                  const val = deliverables[key] ?? 0
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: val > 0 ? `${color}12` : '#FAFBFC',
                        border: val > 0 ? `1px solid ${color}30` : '1px solid #E6E9EF',
                      }}
                    >
                      <span className="flex-1 text-[11px] font-medium" style={{ color: val > 0 ? color : '#9699A6' }}>
                        {label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDeliverable(key, Math.max(0, val - 1))}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: val > 0 ? `${color}20` : '#E6E9EF', color: val > 0 ? color : '#9699A6' }}
                        >−</button>
                        <span className="w-8 text-center text-[12px] font-bold tabular-nums" style={{ color: val > 0 ? color : '#9699A6' }}>
                          {val}
                        </span>
                        <button
                          type="button"
                          onClick={() => setDeliverable(key, val + 1)}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: `${color}20`, color }}
                        >+</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm transition-colors hover:bg-gray-100"
              style={{ border: '1px solid #E6E9EF', color: '#676879' }}
            >
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
