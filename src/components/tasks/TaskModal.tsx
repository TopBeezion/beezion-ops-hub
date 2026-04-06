import { useState } from 'react'
import type { FormEvent } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { useClients } from '../../hooks/useClients'
import { useCreateTask } from '../../hooks/useTasks'
import type { Area, Priority, TaskStatus, TaskTipo, Deliverables } from '../../types'
import { AREA_COLORS, AREA_LABELS } from '../../lib/constants'
import { getSprintDateRange } from '../../lib/dates'

const ASSIGNEES = [
  { name: 'Alejandro', role: 'CEO · Copy & Estrategia',             color: '#8b5cf6', areas: ['copy'] },
  { name: 'Alec',      role: 'COO · Head Tech & Paid Media',         color: '#f5a623', areas: ['tech', 'trafico'] },
  { name: 'Paula',     role: 'Aux. Marketing · Producción · Admin',  color: '#ec4899', areas: ['copy', 'admin'] },
  { name: 'Jose Luis', role: 'Trafficker Digital',                   color: '#3b82f6', areas: ['trafico'] },
  { name: 'Editor 1',  role: 'Edición de Video',                    color: '#06b6d4', areas: ['copy'] },
  { name: 'Editor 2',  role: 'Edición de Video',                    color: '#10b981', areas: ['copy'] },
  { name: 'Editor 3',  role: 'Edición de Video',                    color: '#f97316', areas: ['copy'] },
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
}

export function TaskModal({ onClose, defaultClientId }: TaskModalProps) {
  const { data: clients } = useClients()
  const createTask = useCreateTask()

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [clientId,    setClientId]    = useState(defaultClientId || '')
  const [area,        setArea]        = useState<Area>('copy')
  const [assignee,    setAssignee]    = useState('Alejandro')
  const [priority,    setPriority]    = useState<Priority>('media')
  const [status,      setStatus]      = useState<TaskStatus>('pendiente')
  const [week,        setWeek]        = useState(1)
  const [tipo,        setTipo]        = useState<TaskTipo>('nuevo')
  const [problema,    setProblema]    = useState('')
  const [deliverables, setDeliverables] = useState<Deliverables>({})
  const [showDeliverables, setShowDeliverables] = useState(false)

  const assigneeInfo = ASSIGNEES.find(a => a.name === assignee)
  const relevantDeliverables = DELIVERABLE_DEFS.filter(d => d.areas.includes(area))

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
      area,
      assignee,
      priority,
      status,
      week,
      tipo,
      problema: problema || undefined,
      source: 'manual',
      deliverables: hasDeliverables ? deliverables : undefined,
    })
    onClose()
  }

  const fieldStyle: React.CSSProperties = {
    backgroundColor: '#191c35',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#f0f2ff',
    outline: 'none',
    width: '100%',
    borderRadius: 8,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />
      <div
        className="relative h-full w-full max-w-md flex flex-col overflow-hidden"
        style={{
          backgroundColor: '#0d0e17',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '-24px 0 64px rgba(0,0,0,0.65)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'linear-gradient(180deg, rgba(245,166,35,0.04) 0%, transparent 100%)',
          }}
        >
          <div>
            <h2 className="text-sm font-semibold" style={{ color: '#f0f2ff' }}>Nueva tarea</h2>
            <p className="text-[10px] mt-0.5" style={{ color: '#6b7099' }}>Completa el detalle de la tarea</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <X size={15} style={{ color: '#a0a6cc' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-5 space-y-4">

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0a6cc' }}>
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
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0a6cc' }}>
              Descripción / Instrucciones
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg text-xs leading-relaxed resize-none"
              style={{ ...fieldStyle, color: '#c0c3e0' }}
              placeholder="Detalla qué hay que hacer, cómo, referencias, observaciones..."
            />
          </div>

          {/* 2-col grid */}
          <div className="grid grid-cols-2 gap-3">

            {/* Cliente */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0a6cc' }}>Cliente</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} className="px-3 py-2 rounded-lg text-sm" style={fieldStyle}>
                <option value="">Sin cliente</option>
                {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Área */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0a6cc' }}>Área</label>
              <select
                value={area}
                onChange={e => setArea(e.target.value as Area)}
                className="px-3 py-2 rounded-lg text-xs font-semibold"
                style={{
                  ...fieldStyle,
                  color: AREA_COLORS[area],
                  backgroundColor: `${AREA_COLORS[area]}15`,
                  border: `1px solid ${AREA_COLORS[area]}35`,
                }}
              >
                {(Object.entries(AREA_LABELS) as [Area, string][]).map(([v, l]) => (
                  <option key={v} value={v} style={{ backgroundColor: '#13152a', color: AREA_COLORS[v] }}>{l}</option>
                ))}
              </select>
            </div>

            {/* Prioridad */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0a6cc' }}>Prioridad</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="px-3 py-2 rounded-lg text-xs font-semibold"
                style={{ ...fieldStyle }}
              >
                <option value="alta">🔴 Alta</option>
                <option value="media">🟡 Media</option>
                <option value="baja">🟢 Baja</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0a6cc' }}>Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="px-3 py-2 rounded-lg text-xs font-semibold"
                style={{ ...fieldStyle }}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En Progreso</option>
                <option value="revision">En Revisión</option>
                <option value="completado">Completado</option>
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0a6cc' }}>Tipo</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as TaskTipo)}
                className="px-3 py-2 rounded-lg text-xs font-semibold"
                style={{ ...fieldStyle }}
              >
                <option value="nuevo">Nuevo</option>
                <option value="pendiente_anterior">⏳ Pendiente anterior</option>
                <option value="urgente">⚡ Urgente</option>
              </select>
            </div>
          </div>

          {/* Sprint week — visual selector with dates */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#a0a6cc' }}>Sprint</label>
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
                      backgroundColor: week === w ? `${sc}18` : 'rgba(255,255,255,0.02)',
                      border: week === w ? `1px solid ${sc}45` : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <p className="text-[12px] font-bold" style={{ color: week === w ? sc : '#6b7099' }}>S{w}</p>
                    <p className="text-[9px] mt-0.5 leading-tight" style={{ color: '#3d4268' }}>{SPRINT_SUBS[w]}</p>
                    <p className="text-[8px] mt-0.5 leading-tight" style={{ color: week === w ? `${sc}aa` : '#2d3050' }}>
                      {dates.startFmt}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Responsable */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: '#a0a6cc' }}>Responsable</label>
            <div className="grid grid-cols-2 gap-1.5">
              {ASSIGNEES.map(a => (
                <button
                  key={a.name}
                  type="button"
                  onClick={() => setAssignee(a.name)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all"
                  style={{
                    backgroundColor: assignee === a.name ? `${a.color}18` : 'rgba(255,255,255,0.02)',
                    border: assignee === a.name ? `1px solid ${a.color}40` : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                    style={{ background: `linear-gradient(135deg, ${a.color}40, ${a.color}20)`, color: a.color, border: `1px solid ${a.color}30` }}
                  >
                    {a.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold" style={{ color: assignee === a.name ? '#f0f2ff' : '#a0a6cc' }}>{a.name}</p>
                    <p className="text-[9px] truncate" style={{ color: '#3d4268' }}>{a.role}</p>
                  </div>
                </button>
              ))}
            </div>
            {/* Smart warning */}
            {assigneeInfo && !assigneeInfo.areas.includes(area) && (
              <p className="text-[10px] mt-1.5 px-1" style={{ color: '#f59e0b' }}>
                ⚠️ {assignee} normalmente cubre {assigneeInfo.areas.join(', ')}, no <strong>{AREA_LABELS[area]}</strong>.
              </p>
            )}
          </div>

          {/* Problema */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a0a6cc' }}>Problema que resuelve</label>
            <input
              value={problema}
              onChange={e => setProblema(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs"
              style={fieldStyle}
              placeholder="Ej: Show rate de Book Demos bajo"
            />
          </div>

          {/* Entregables — collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setShowDeliverables(v => !v)}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-colors"
              style={{
                backgroundColor: showDeliverables ? 'rgba(245,166,35,0.06)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${showDeliverables ? 'rgba(245,166,35,0.25)' : 'rgba(255,255,255,0.07)'}`,
              }}
            >
              <span className="text-xs font-semibold" style={{ color: showDeliverables ? '#f5a623' : '#a0a6cc' }}>
                📦 Entregables y cantidades
                {Object.keys(deliverables).length > 0 && (
                  <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,166,35,0.15)', color: '#f5a623' }}>
                    {Object.values(deliverables).reduce((s, v) => s + (v ?? 0), 0)} total
                  </span>
                )}
              </span>
              <ChevronDown size={12} style={{ color: '#6b7099', transform: showDeliverables ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
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
                        backgroundColor: val > 0 ? `${color}08` : 'rgba(255,255,255,0.015)',
                        border: val > 0 ? `1px solid ${color}25` : '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <span className="flex-1 text-[11px] font-medium" style={{ color: val > 0 ? '#d0d3ea' : '#4d5170' }}>
                        {label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDeliverable(key, Math.max(0, val - 1))}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: val > 0 ? `${color}20` : 'rgba(255,255,255,0.04)', color: val > 0 ? color : '#3d4268' }}
                        >−</button>
                        <span className="w-8 text-center text-[12px] font-bold tabular-nums" style={{ color: val > 0 ? color : '#3d4268' }}>
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

          {/* Footer buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/5"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: '#a0a6cc' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createTask.isPending || !title.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #f5a623, #ff7c1a)',
                color: '#0c0e1a',
                boxShadow: '0 0 16px rgba(245,166,35,0.3)',
              }}
            >
              {createTask.isPending ? 'Creando…' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
