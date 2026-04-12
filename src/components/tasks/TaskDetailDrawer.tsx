import { useState, useEffect } from 'react'
import {
  X, Save, Calendar, User, Tag, Layers, AlertTriangle, Clock, FileText, Hash,
  Anchor, Video, PenTool, Target, FileDown, Film, Globe, ThumbsUp, LayoutGrid,
  Type, HelpCircle, BarChart3, RefreshCw, Bot, Hand, Zap, Hourglass, Package,
} from 'lucide-react'
import { useUpdateTask } from '../../hooks/useTasks'
import { useClients } from '../../hooks/useClients'
import { useCampaignsByClient } from '../../hooks/useCampaigns'
import type { Task, Area, Priority, TaskStatus, TaskTipo, Etapa, MiniStatus, Deliverables } from '../../types'
import {
  AREA_LABELS, AREA_COLORS, STATUS_LABELS, STATUS_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS,
  ETAPA_LABELS, ETAPA_COLORS, ETAPA_ORDER,
  MINI_STATUS_LABELS, MINI_STATUS_COLORS, MINI_STATUS_ORDER,
} from '../../lib/constants'
import { getSprintDateRange, formatFullDate } from '../../lib/dates'

const ASSIGNEES = [
  { name: 'Alejandro', role: 'CEO · Copy · Estrategia',           color: '#8b5cf6', areas: ['copy', 'trafico', 'tech', 'admin'] },
  { name: 'Alec',      role: 'Head of Paid · Estrategia',         color: '#f5a623', areas: ['trafico', 'tech'] },
  { name: 'Jose',      role: 'Trafficker',                        color: '#3b82f6', areas: ['trafico'] },
  { name: 'Luisa',     role: 'Copywriter',                        color: '#ef4444', areas: ['copy'] },
  { name: 'Paula',     role: 'Aux. Marketing · Grabaciones',      color: '#ec4899', areas: ['copy', 'admin'] },
  { name: 'David',     role: 'Editor',                            color: '#06b6d4', areas: ['copy'] },
  { name: 'Johan',     role: 'Editor',                            color: '#10b981', areas: ['copy'] },
  { name: 'Felipe',    role: 'Editor',                            color: '#f97316', areas: ['copy'] },
]

const SPRINT_COLORS: Record<number, string> = {
  1: '#8b5cf6', 2: '#ec4899', 3: '#3b82f6', 4: '#22c55e',
}

const DELIVERABLE_DEFS: { key: keyof Deliverables; label: string; color: string; Icon: React.ElementType }[] = [
  { key: 'hooks',              label: 'Hooks de video',        color: '#8b5cf6', Icon: Anchor },
  { key: 'scripts_video',      label: 'Scripts video',         color: '#ec4899', Icon: Video },
  { key: 'body_copy',          label: 'Body copy / Ad copy',   color: '#3b82f6', Icon: PenTool },
  { key: 'cta',                label: 'CTAs',                  color: '#f5a623', Icon: Target },
  { key: 'lead_magnet_pdf',    label: 'Lead magnets (PDF)',    color: '#22c55e', Icon: FileDown },
  { key: 'vsl_script',         label: 'Scripts VSL',           color: '#06b6d4', Icon: Film },
  { key: 'landing_copy',       label: 'Landing page copy',     color: '#f97316', Icon: Globe },
  { key: 'thank_you_page_copy',label: 'Thank you page copy',   color: '#fbbf24', Icon: ThumbsUp },
  { key: 'carousel_slides',    label: 'Slides / Carrusel',     color: '#a78bfa', Icon: LayoutGrid },
  { key: 'headline_options',   label: 'Opciones de headline',  color: '#f472b6', Icon: Type },
  { key: 'quiz_preguntas',     label: 'Preguntas de quiz',     color: '#818cf8', Icon: HelpCircle },
  { key: 'quiz_resultados',    label: 'Resultados de quiz',    color: '#6ee7b7', Icon: BarChart3 },
  { key: 'retargeting_scripts',label: 'Scripts de retargeting',color: '#34d399', Icon: RefreshCw },
]

interface Props {
  task: Task
  onClose: () => void
}

const inputBase: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E6E9EF',
  color: '#1F2128',
  outline: 'none',
  width: '100%',
  borderRadius: 8,
}

const sectionLabel: React.CSSProperties = {
  color: '#9699A6',
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

export function TaskDetailDrawer({ task, onClose }: Props) {
  const updateTask = useUpdateTask()
  const { data: clients = [] } = useClients()

  // Editable state
  const [title,       setTitle]       = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [problema,    setProblema]    = useState(task.problema ?? '')
  const [area,        setArea]        = useState<Area>(task.area)
  const [assignee,    setAssignee]    = useState(task.assignee)
  const [priority,    setPriority]    = useState<Priority>(task.priority)
  const [status,      setStatus]      = useState<TaskStatus>(task.status)
  const [week,        setWeek]        = useState(task.week)
  const [tipo,        setTipo]        = useState<TaskTipo>(task.tipo)
  const [clientId,    setClientId]    = useState(task.client_id ?? '')
  const [campaignId,  setCampaignId]  = useState(task.campaign_id ?? '')
  const [etapa,       setEtapa]       = useState<Etapa | ''>(task.etapa ?? '')
  const [miniStatus,  setMiniStatus]  = useState<MiniStatus | ''>(task.mini_status ?? '')
  const [dueDate,     setDueDate]     = useState(task.due_date ?? '')
  const [deliverables, setDeliverables] = useState<Deliverables>(task.deliverables ?? {})
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)

  const { data: campaigns = [] } = useCampaignsByClient(clientId || undefined)

  // Sprint date range
  const sprint = getSprintDateRange(week)
  const sprintColor = SPRINT_COLORS[week] ?? '#6b7280'
  const assigneeInfo = ASSIGNEES.find(a => a.name === assignee)

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const isDirty =
    title !== task.title ||
    description !== (task.description ?? '') ||
    problema !== (task.problema ?? '') ||
    area !== task.area ||
    assignee !== task.assignee ||
    priority !== task.priority ||
    status !== task.status ||
    week !== task.week ||
    tipo !== task.tipo ||
    clientId !== (task.client_id ?? '') ||
    campaignId !== (task.campaign_id ?? '') ||
    etapa !== (task.etapa ?? '') ||
    miniStatus !== (task.mini_status ?? '') ||
    dueDate !== (task.due_date ?? '') ||
    JSON.stringify(deliverables) !== JSON.stringify(task.deliverables ?? {})

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateTask.mutateAsync({
        id: task.id,
        title,
        description: description || undefined,
        problema: problema || undefined,
        area,
        assignee,
        priority,
        status,
        week,
        tipo,
        client_id: clientId || undefined,
        campaign_id: campaignId || undefined,
        etapa: etapa || undefined,
        mini_status: miniStatus || undefined,
        due_date: dueDate || undefined,
        deliverables: Object.keys(deliverables).length > 0 ? deliverables : undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const setDeliverable = (key: keyof Deliverables, value: number) => {
    setDeliverables(prev => {
      const next = { ...prev }
      if (value > 0) next[key] = value
      else delete next[key]
      return next
    })
  }

  const totalDeliverables = Object.values(deliverables).reduce((s, v) => s + (v ?? 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        onClick={onClose}
        style={{ backgroundColor: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }}
      />

      {/* Drawer */}
      <div
        className="relative flex flex-col h-full w-full overflow-hidden"
        style={{
          maxWidth: 540,
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid #E6E9EF',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Client color top stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ backgroundColor: task.client?.color ?? '#f5a623' }}
        />

        {/* ── Header ───────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0"
          style={{ borderBottom: '1px solid #E6E9EF' }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {/* Client badge */}
            {task.client && (
              <span
                className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${task.client.color}18`,
                  color: task.client.color,
                  border: `1px solid ${task.client.color}30`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: task.client.color }} />
                {task.client.name}
              </span>
            )}
            {/* Source badge */}
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider"
              style={{
                backgroundColor: task.source === 'meeting_auto' ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)',
                color: task.source === 'meeting_auto' ? '#6366F1' : '#9699A6',
                border: task.source === 'meeting_auto' ? '1px solid rgba(99,102,241,0.2)' : '1px solid #E6E9EF',
              }}
            >
              <span className="flex items-center gap-1">
                {task.source === 'meeting_auto' ? <><Bot size={9} /> Auto-reunión</> : <><Hand size={9} /> Manual</>}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-60"
                style={{
                  background: '#6366F1',
                  color: '#FFFFFF',
                  boxShadow: '0 0 14px rgba(99,102,241,0.2)',
                }}
              >
                <Save size={11} />
                {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: '#9699A6' }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ──────────────────────────── */}
        <div className="flex-1 overflow-auto px-5 py-4 space-y-5">

          {/* ── Título ── */}
          <div>
            <label style={sectionLabel}>Título de la tarea</label>
            <textarea
              value={title}
              onChange={e => setTitle(e.target.value)}
              rows={2}
              className="mt-1.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium resize-none leading-relaxed"
              style={{ ...inputBase }}
              placeholder="Describe la tarea..."
            />
          </div>

          {/* ── Meta row ── */}
          <div className="grid grid-cols-2 gap-3">

            {/* Status */}
            <div>
              <label className="flex items-center gap-1 mb-1.5" style={sectionLabel}>
                <Tag size={9} /> Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="px-3 py-2 rounded-lg text-xs font-semibold w-full"
                style={{
                  ...inputBase,
                  color: STATUS_COLORS[status],
                  backgroundColor: `${STATUS_COLORS[status]}15`,
                  border: `1px solid ${STATUS_COLORS[status]}30`,
                }}
              >
                {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([v, l]) => (
                  <option key={v} value={v} style={{ backgroundColor: '#FFFFFF', color: STATUS_COLORS[v] }}>{l}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="flex items-center gap-1 mb-1.5" style={sectionLabel}>
                <AlertTriangle size={9} /> Prioridad
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="px-3 py-2 rounded-lg text-xs font-semibold w-full"
                style={{
                  ...inputBase,
                  color: PRIORITY_COLORS[priority],
                  backgroundColor: `${PRIORITY_COLORS[priority]}15`,
                  border: `1px solid ${PRIORITY_COLORS[priority]}30`,
                }}
              >
                {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([v, l]) => (
                  <option key={v} value={v} style={{ backgroundColor: '#FFFFFF', color: PRIORITY_COLORS[v] }}>{l}</option>
                ))}
              </select>
            </div>

            {/* Área */}
            <div>
              <label className="flex items-center gap-1 mb-1.5" style={sectionLabel}>
                <Layers size={9} /> Área
              </label>
              <select
                value={area}
                onChange={e => setArea(e.target.value as Area)}
                className="px-3 py-2 rounded-lg text-xs font-semibold w-full"
                style={{
                  ...inputBase,
                  color: AREA_COLORS[area],
                  backgroundColor: `${AREA_COLORS[area]}15`,
                  border: `1px solid ${AREA_COLORS[area]}30`,
                }}
              >
                {(Object.entries(AREA_LABELS) as [Area, string][]).map(([v, l]) => (
                  <option key={v} value={v} style={{ backgroundColor: '#FFFFFF', color: AREA_COLORS[v] }}>{l}</option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="flex items-center gap-1 mb-1.5" style={sectionLabel}>
                <Hash size={9} /> Tipo
              </label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as TaskTipo)}
                className="px-3 py-2 rounded-lg text-xs font-semibold w-full"
                style={{ ...inputBase, color: tipo === 'urgente' ? '#ef4444' : tipo === 'pendiente_anterior' ? '#f97316' : '#9699A6' }}
              >
                <option value="nuevo" style={{ backgroundColor: '#FFFFFF' }}>Nuevo</option>
                <option value="pendiente_anterior" style={{ backgroundColor: '#FFFFFF' }}>Pendiente anterior</option>
                <option value="urgente" style={{ backgroundColor: '#FFFFFF' }}>Urgente</option>
              </select>
            </div>
          </div>

          {/* ── Responsable ── */}
          <div>
            <label className="flex items-center gap-1 mb-2" style={sectionLabel}>
              <User size={9} /> Responsable
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ASSIGNEES.map(a => (
                <button
                  key={a.name}
                  onClick={() => setAssignee(a.name)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all"
                  style={{
                    backgroundColor: assignee === a.name ? '#EEF2FF' : '#FAFBFC',
                    border: assignee === a.name ? `1px solid ${a.color}40` : '1px solid #E6E9EF',
                    boxShadow: assignee === a.name ? `0 0 12px ${a.color}18` : 'none',
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${a.color}40, ${a.color}20)`,
                      color: a.color,
                      border: `1px solid ${a.color}30`,
                    }}
                  >
                    {a.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold leading-none" style={{ color: assignee === a.name ? '#1F2128' : '#676879' }}>{a.name}</p>
                    <p className="text-[9px] mt-0.5 leading-tight truncate" style={{ color: '#9699A6' }}>{a.role}</p>
                  </div>
                </button>
              ))}
            </div>
            {/* Smart suggestion */}
            {assigneeInfo && !assigneeInfo.areas.includes(area) && (
              <p className="flex items-center gap-1 text-[10px] mt-1.5 px-1" style={{ color: '#F59E0B' }}>
                <AlertTriangle size={10} /> {assignee} normalmente no trabaja en el área de <strong>{AREA_LABELS[area]}</strong>.
                {area === 'copy' && ' Para copy, considera: Alejandro, Paula o Editores.'}
                {area === 'trafico' && ' Para tráfico, considera: Alec o Jose.'}
                {area === 'tech' && ' Para tech, considera: Alec.'}
                {area === 'admin' && ' Para admin, considera: Paula.'}
              </p>
            )}
          </div>

          {/* ── Cliente + Campaña ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 mb-1.5" style={sectionLabel}>
                <Tag size={9} /> Cliente
              </label>
              <select
                value={clientId}
                onChange={e => { setClientId(e.target.value); setCampaignId('') }}
                className="px-3 py-2 rounded-lg text-sm w-full"
                style={{ ...inputBase }}
              >
                <option value="">Sin cliente</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1 mb-1.5" style={sectionLabel}>
                <Zap size={9} /> Campaña
              </label>
              <select
                value={campaignId}
                onChange={e => setCampaignId(e.target.value)}
                disabled={!clientId}
                className="px-3 py-2 rounded-lg text-xs w-full"
                style={{ ...inputBase, opacity: clientId ? 1 : 0.5 }}
              >
                <option value="">Sin campaña</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Etapa + Mini Status ── */}
          {(campaignId || etapa || miniStatus) && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1 mb-1.5" style={sectionLabel}>
                  <Layers size={9} /> Etapa
                </label>
                <select
                  value={etapa}
                  onChange={e => setEtapa(e.target.value as Etapa | '')}
                  className="px-3 py-2 rounded-lg text-xs font-semibold w-full"
                  style={{
                    ...inputBase,
                    color: etapa ? ETAPA_COLORS[etapa as Etapa] : '#9699A6',
                    backgroundColor: etapa ? `${ETAPA_COLORS[etapa as Etapa]}15` : '#FFFFFF',
                    border: etapa ? `1px solid ${ETAPA_COLORS[etapa as Etapa]}30` : '1px solid #E6E9EF',
                  }}
                >
                  <option value="">Sin etapa</option>
                  {ETAPA_ORDER.map(e => <option key={e} value={e}>{ETAPA_LABELS[e]}</option>)}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1 mb-1.5" style={sectionLabel}>
                  <Tag size={9} /> Mini status
                </label>
                <select
                  value={miniStatus}
                  onChange={e => setMiniStatus(e.target.value as MiniStatus | '')}
                  className="px-3 py-2 rounded-lg text-xs font-semibold w-full"
                  style={{
                    ...inputBase,
                    color: miniStatus ? MINI_STATUS_COLORS[miniStatus as MiniStatus] : '#9699A6',
                    backgroundColor: miniStatus ? `${MINI_STATUS_COLORS[miniStatus as MiniStatus]}15` : '#FFFFFF',
                  }}
                >
                  <option value="">Sin estado</option>
                  {MINI_STATUS_ORDER.map(s => <option key={s} value={s}>{MINI_STATUS_LABELS[s]}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* ── Fecha límite ── */}
          <div>
            <label className="flex items-center gap-1 mb-1.5" style={sectionLabel}>
              <Calendar size={9} /> Fecha límite
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm w-full"
              style={{
                ...inputBase,
                color: dueDate && new Date(dueDate) < new Date() ? '#E2445C' : '#1F2128',
              }}
            />
          </div>

          {/* ── Sprint / Fechas ── */}
          <div>
            <label className="flex items-center gap-1 mb-2" style={sectionLabel}>
              <Calendar size={9} /> Sprint & Fechas
            </label>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[1, 2, 3, 4].map(w => {
                const s = getSprintDateRange(w)
                const sc = SPRINT_COLORS[w]
                return (
                  <button
                    key={w}
                    onClick={() => setWeek(w)}
                    className="rounded-lg p-2 text-center transition-all"
                    style={{
                      backgroundColor: week === w ? `${sc}12` : '#FAFBFC',
                      border: week === w ? `1px solid ${sc}30` : '1px solid #E6E9EF',
                    }}
                  >
                    <p className="text-[11px] font-bold" style={{ color: week === w ? sc : '#9699A6' }}>
                      S{w}
                    </p>
                    <p className="text-[9px] mt-0.5 leading-tight" style={{ color: '#9699A6' }}>
                      {s.startFmt}
                    </p>
                    <p className="text-[9px] leading-tight" style={{ color: '#9699A6' }}>
                      — {s.endFmt}
                    </p>
                  </button>
                )
              })}
            </div>
            <div
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ backgroundColor: `${sprintColor}12`, border: `1px solid ${sprintColor}30` }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sprintColor }} />
                <span className="text-xs font-semibold" style={{ color: sprintColor }}>Sprint {week}</span>
              </div>
              <span className="text-[11px]" style={{ color: '#9699A6' }}>{sprint.label}</span>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="h-px" style={{ backgroundColor: '#E6E9EF' }} />

          {/* ── Descripción ── */}
          <div>
            <label className="flex items-center gap-1 mb-1.5" style={sectionLabel}>
              <FileText size={9} /> Descripción / Instrucciones específicas
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg text-xs leading-relaxed resize-none"
              style={{ ...inputBase, color: '#676879' }}
              placeholder="Describe qué exactamente hay que hacer, cómo hacerlo, referencias, links, observaciones..."
            />
          </div>

          {/* ── Problema ── */}
          <div>
            <label className="flex items-center gap-1 mb-1.5" style={sectionLabel}>
              <AlertTriangle size={9} /> Problema que resuelve
            </label>
            <input
              value={problema}
              onChange={e => setProblema(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs"
              style={{ ...inputBase }}
              placeholder="Ej: Show rate de Book Demos bajó un 40%..."
            />
          </div>

          {/* ── Divider ── */}
          <div className="h-px" style={{ backgroundColor: '#E6E9EF' }} />

          {/* ── Entregables ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1" style={sectionLabel}>
                <Package size={9} /> Entregables
              </label>
              {totalDeliverables > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(99,102,241,0.1)', color: '#6366F1' }}>
                  {totalDeliverables} total
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {DELIVERABLE_DEFS.map(({ key, label, color, Icon }) => {
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
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                      style={{ backgroundColor: val > 0 ? `${color}18` : 'transparent' }}
                    >
                      <Icon size={12} style={{ color: val > 0 ? color : '#9699A6' }} />
                    </div>
                    <span
                      className="flex-1 text-[11px] font-medium"
                      style={{ color: val > 0 ? color : '#9699A6' }}
                    >
                      {label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setDeliverable(key, Math.max(0, val - 1))}
                        className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold transition-colors"
                        style={{
                          backgroundColor: val > 0 ? `${color}20` : '#E6E9EF',
                          color: val > 0 ? color : '#9699A6',
                        }}
                      >
                        −
                      </button>
                      <span
                        className="w-7 text-center text-[12px] font-bold tabular-nums"
                        style={{ color: val > 0 ? color : '#9699A6' }}
                      >
                        {val}
                      </span>
                      <button
                        onClick={() => setDeliverable(key, val + 1)}
                        className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold transition-colors"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Metadata ── */}
          <div
            className="rounded-lg px-3 py-3 space-y-1.5"
            style={{ backgroundColor: '#F6F7FB', border: '1px solid #E6E9EF' }}
          >
            <p style={sectionLabel}>Historial</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Clock size={10} style={{ color: '#9699A6' }} />
              <span className="text-[10px]" style={{ color: '#676879' }}>
                Creado: <span style={{ color: '#9699A6' }}>{formatFullDate(task.created_at)}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={10} style={{ color: '#9699A6' }} />
              <span className="text-[10px]" style={{ color: '#676879' }}>
                Actualizado: <span style={{ color: '#9699A6' }}>{formatFullDate(task.updated_at)}</span>
              </span>
            </div>
            {task.meeting_date && (
              <div className="flex items-center gap-2">
                <Calendar size={10} style={{ color: '#9699A6' }} />
                <span className="text-[10px]" style={{ color: '#676879' }}>
                  Reunión: <span style={{ color: '#6366F1' }}>{task.meeting_date}</span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Tag size={10} style={{ color: '#9699A6' }} />
              <span className="text-[10px]" style={{ color: '#676879' }}>
                ID: <span className="font-mono" style={{ color: '#9699A6' }}>{task.id.slice(0, 8)}…</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Sticky save bar ──────────────────────────── */}
        {isDirty && (
          <div
            className="px-5 py-3 shrink-0 flex items-center justify-between"
            style={{
              borderTop: '1px solid rgba(99,102,241,0.2)',
              background: 'linear-gradient(0deg, rgba(99,102,241,0.06) 0%, transparent 100%)',
            }}
          >
            <span className="text-[11px]" style={{ color: '#6366F1' }}>
              Cambios sin guardar
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTitle(task.title); setDescription(task.description ?? '')
                  setProblema(task.problema ?? ''); setArea(task.area)
                  setAssignee(task.assignee); setPriority(task.priority)
                  setStatus(task.status); setWeek(task.week); setTipo(task.tipo)
                  setClientId(task.client_id ?? ''); setDeliverables(task.deliverables ?? {})
                }}
                className="px-3 py-1.5 rounded-lg text-[11px]"
                style={{ color: '#676879', border: '1px solid #E6E9EF' }}
              >
                Descartar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-60"
                style={{
                  background: '#6366F1',
                  color: '#FFFFFF',
                }}
              >
                <Save size={10} />
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
