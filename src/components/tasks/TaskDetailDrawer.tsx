import { useState, useEffect, useRef } from 'react'
import {
  X, Save, ChevronDown, AlertTriangle, FileText,
  Paperclip, Upload, Trash2, Download, File, Image, FileVideo, FileAudio,
  Bot, Hand,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUpdateTask } from '../../hooks/useTasks'
import { useClients } from '../../hooks/useClients'
import { useCampaignsByClient } from '../../hooks/useCampaigns'
import type { Task, Area, Priority, TaskStatus, TaskTipo, Etapa, MiniStatus, Deliverables, TaskAttachment } from '../../types'
import {
  AREA_LABELS, AREA_COLORS, STATUS_LABELS, STATUS_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS,
  ETAPA_LABELS, ETAPA_COLORS, ETAPA_ORDER,
  MINI_STATUS_LABELS, MINI_STATUS_COLORS, MINI_STATUS_ORDER,
} from '../../lib/constants'
import { getSprintDateRange } from '../../lib/dates'

// ── Team ────────────────────────────────────────────────────────────────────
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

const DELIVERABLE_DEFS: { key: keyof Deliverables; label: string; color: string }[] = [
  { key: 'hooks',               label: 'Hooks de video',        color: '#8b5cf6' },
  { key: 'scripts_video',       label: 'Scripts video',         color: '#ec4899' },
  { key: 'body_copy',           label: 'Body copy / Ad copy',   color: '#3b82f6' },
  { key: 'cta',                 label: 'CTAs',                  color: '#f5a623' },
  { key: 'lead_magnet_pdf',     label: 'Lead magnets (PDF)',    color: '#22c55e' },
  { key: 'vsl_script',          label: 'Scripts VSL',           color: '#06b6d4' },
  { key: 'landing_copy',        label: 'Landing page copy',     color: '#f97316' },
  { key: 'thank_you_page_copy', label: 'Thank you page copy',   color: '#fbbf24' },
  { key: 'carousel_slides',     label: 'Slides / Carrusel',     color: '#a78bfa' },
  { key: 'headline_options',    label: 'Opciones de headline',  color: '#f472b6' },
  { key: 'retargeting_scripts', label: 'Scripts retargeting',   color: '#34d399' },
]

const SPRINT_COLORS: Record<number, string> = { 1: '#8b5cf6', 2: '#ec4899', 3: '#3b82f6', 4: '#22c55e' }

// ── Helpers ─────────────────────────────────────────────────────────────────
const lbl: React.CSSProperties = {
  color: '#9699A6', fontSize: 10, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, display: 'block',
}

const inputBase: React.CSSProperties = {
  backgroundColor: '#FFFFFF', border: '1px solid #E6E9EF',
  color: '#1F2128', outline: 'none', width: '100%', borderRadius: 8,
}

// Styled select dropdown
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

// ── Props ────────────────────────────────────────────────────────────────────
interface Props { task: Task; onClose: () => void }

// ── Component ────────────────────────────────────────────────────────────────
export function TaskDetailDrawer({ task, onClose }: Props) {
  const updateTask = useUpdateTask()
  const { data: clients = [] } = useClients()

  const [title,        setTitle]        = useState(task.title)
  const [description,  setDescription]  = useState(task.description ?? '')
  const [problema,     setProblema]     = useState(task.problema ?? '')
  const [area,         setArea]         = useState<Area>(task.area)
  const [assignee,     setAssignee]     = useState(task.assignee)
  const [priority,     setPriority]     = useState<Priority>(task.priority)
  const [status,       setStatus]       = useState<TaskStatus>(task.status)
  const [week,         setWeek]         = useState(task.week)
  const [tipo,         setTipo]         = useState<TaskTipo>(task.tipo)
  const [clientId,     setClientId]     = useState(task.client_id ?? '')
  const [campaignId,   setCampaignId]   = useState(task.campaign_id ?? '')
  const [etapa,        setEtapa]        = useState<Etapa | ''>(task.etapa ?? '')
  const [miniStatus,   setMiniStatus]   = useState<MiniStatus | ''>(task.mini_status ?? '')
  const [dueDate,      setDueDate]      = useState(task.due_date ?? '')
  const [deliverables, setDeliverables] = useState<Deliverables>(task.deliverables ?? {})
  const [attachments,  setAttachments]  = useState<TaskAttachment[]>(task.attachments ?? [])
  const [uploading,    setUploading]    = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [showDel,      setShowDel]      = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: campaigns = [] } = useCampaignsByClient(clientId || undefined)
  const sprint      = getSprintDateRange(week)
  const sprintColor = SPRINT_COLORS[week] ?? '#6b7280'
  const assigneeInfo = ASSIGNEES.find(a => a.name === assignee)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const isDirty =
    title !== task.title ||
    description !== (task.description ?? '') ||
    problema !== (task.problema ?? '') ||
    area !== task.area || assignee !== task.assignee ||
    priority !== task.priority || status !== task.status ||
    week !== task.week || tipo !== task.tipo ||
    clientId !== (task.client_id ?? '') || campaignId !== (task.campaign_id ?? '') ||
    etapa !== (task.etapa ?? '') || miniStatus !== (task.mini_status ?? '') ||
    dueDate !== (task.due_date ?? '') ||
    JSON.stringify(deliverables) !== JSON.stringify(task.deliverables ?? {}) ||
    JSON.stringify(attachments) !== JSON.stringify(task.attachments ?? [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateTask.mutateAsync({
        id: task.id, title,
        description: description || undefined,
        problema: problema || undefined,
        area, assignee, priority, status, week, tipo,
        client_id: clientId || undefined,
        campaign_id: campaignId || undefined,
        etapa: etapa || undefined,
        mini_status: miniStatus || undefined,
        due_date: dueDate || undefined,
        deliverables: Object.keys(deliverables).length > 0 ? deliverables : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  const setDeliverable = (key: keyof Deliverables, value: number) => {
    setDeliverables(prev => {
      const next = { ...prev }
      if (value > 0) next[key] = value
      else delete next[key]
      return next
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    const added: TaskAttachment[] = []
    for (const file of files) {
      const path = `tasks/${task.id}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('task-attachments').upload(path, file, { upsert: false })
      if (!error) {
        const { data: urlData } = supabase.storage.from('task-attachments').getPublicUrl(path)
        added.push({ name: file.name, url: urlData.publicUrl, path, size: file.size, type: file.type, uploaded_at: new Date().toISOString() })
      }
    }
    setAttachments(prev => [...prev, ...added])
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = async (att: TaskAttachment) => {
    await supabase.storage.from('task-attachments').remove([att.path])
    setAttachments(prev => prev.filter(a => a.path !== att.path))
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image
    if (type.startsWith('video/')) return FileVideo
    if (type.startsWith('audio/')) return FileAudio
    return File
  }
  const fmtBytes = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(0)} KB` : `${(b/1048576).toFixed(1)} MB`

  const totalDel = Object.values(deliverables).reduce((s, v) => s + (v ?? 0), 0)

  // Build select options
  const statusOpts = (Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([v, l]) => ({ value: v, label: l, color: STATUS_COLORS[v] }))
  const priorityOpts = (Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(([v, l]) => ({ value: v, label: l, color: PRIORITY_COLORS[v] }))
  const tipoOpts = [
    { value: 'nuevo', label: 'Nuevo', color: '#9699A6' },
    { value: 'pendiente_anterior', label: 'Pendiente anterior', color: '#F97316' },
    { value: 'urgente', label: '🚨 Urgente', color: '#EF4444' },
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
    ...clients.map(c => ({ value: c.id, label: c.name, color: c.color })),
  ]
  const campanaOpts = [
    { value: '', label: 'Sin campaña', color: '#9699A6' },
    ...campaigns.map(c => ({ value: c.id, label: c.name, color: '#6366F1' })),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
      />

      {/* Drawer */}
      <div
        className="relative flex flex-col h-full w-full overflow-hidden"
        style={{ maxWidth: 520, backgroundColor: '#FFFFFF', borderLeft: '1px solid #E6E9EF', boxShadow: '-8px 0 32px rgba(0,0,0,0.1)' }}
      >
        {/* Client stripe */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: task.client?.color ?? '#f5a623' }} />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3.5 shrink-0" style={{ borderBottom: '1px solid #E6E9EF' }}>
          <div className="flex items-center gap-2 flex-wrap">
            {task.client && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                style={{ backgroundColor: `${task.client.color}18`, color: task.client.color, border: `1px solid ${task.client.color}30` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.client.color }} />
                {task.client.name}
              </span>
            )}
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1"
              style={{
                backgroundColor: task.source === 'meeting_auto' ? 'rgba(99,102,241,0.1)' : '#F5F5F5',
                color: task.source === 'meeting_auto' ? '#6366F1' : '#9699A6',
                border: task.source === 'meeting_auto' ? '1px solid rgba(99,102,241,0.2)' : '1px solid #E6E9EF',
              }}>
              {task.source === 'meeting_auto' ? <><Bot size={9} /> Auto-reunión</> : <><Hand size={9} /> Manual</>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-60"
                style={{ background: '#6366F1', color: '#fff', boxShadow: '0 0 14px rgba(99,102,241,0.2)' }}>
                <Save size={11} />
                {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar'}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: '#9699A6' }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-auto px-5 py-4 space-y-4">

          {/* Título */}
          <div>
            <label style={lbl}>Título de la tarea</label>
            <textarea
              value={title}
              onChange={e => setTitle(e.target.value)}
              rows={2}
              className="mt-0.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium resize-none leading-relaxed"
              style={inputBase}
              placeholder="Describe la tarea..."
            />
          </div>

          {/* Row 1: Status · Prioridad · Tipo */}
          <div style={{ display: 'flex', gap: 8 }}>
            <FieldSel label="Status" value={status} onChange={v => setStatus(v as TaskStatus)} options={statusOpts} />
            <FieldSel label="Prioridad" value={priority} onChange={v => setPriority(v as Priority)} options={priorityOpts} />
            <FieldSel label="Tipo" value={tipo} onChange={v => setTipo(v as TaskTipo)} options={tipoOpts} />
          </div>

          {/* Área — pills (visual distinction is useful here) */}
          <div>
            <label style={lbl}>Área</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(Object.entries(AREA_LABELS) as [Area, string][]).map(([v, l]) => {
                const active = area === v
                const col = AREA_COLORS[v]
                return (
                  <button key={v} onClick={() => setArea(v)} style={{
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

          {/* Responsable — grid (need to see all members) */}
          <div>
            <label style={lbl}>Responsable</label>
            <div className="grid grid-cols-2 gap-1.5">
              {ASSIGNEES.map(a => (
                <button
                  key={a.name}
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
                    <p className="text-[11px] font-semibold leading-none" style={{ color: assignee === a.name ? '#1F2128' : '#676879' }}>{a.name}</p>
                    <p className="text-[9px] mt-0.5 leading-tight truncate" style={{ color: '#9699A6' }}>{a.role}</p>
                  </div>
                </button>
              ))}
            </div>
            {assigneeInfo && !assigneeInfo.areas.includes(area) && (
              <p className="flex items-center gap-1 text-[10px] mt-1.5 px-1" style={{ color: '#F59E0B' }}>
                <AlertTriangle size={10} /> {assignee} normalmente no trabaja en <strong>{AREA_LABELS[area]}</strong>.
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
              accentColor={clients.find(c => c.id === clientId)?.color ?? '#6366F1'}
            />
            {clientId && (
              <FieldSel
                label="Campaña"
                value={campaignId}
                onChange={setCampaignId}
                options={campanaOpts}
              />
            )}
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

          {/* Fecha límite + Sprint en la misma área */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            {/* Fecha */}
            <div style={{ flex: 1 }}>
              <label style={lbl}>Fecha límite</label>
              <input
                type="date" value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm w-full"
                style={{ ...inputBase, color: dueDate && new Date(dueDate) < new Date() ? '#E2445C' : '#1F2128' }}
              />
            </div>
            {/* Sprint pills compactos */}
            <div style={{ flex: 1.4 }}>
              <label style={lbl}>Sprint</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4].map(w => {
                  const sc = SPRINT_COLORS[w]
                  const s  = getSprintDateRange(w)
                  return (
                    <button key={w} onClick={() => setWeek(w)} className="flex-1 rounded-lg py-2 text-center transition-all"
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
              <div className="flex items-center gap-1.5 mt-1.5 px-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sprintColor }} />
                <span className="text-[10px] font-medium" style={{ color: sprintColor }}>Sprint {week}</span>
                <span className="text-[10px]" style={{ color: '#9699A6' }}>· {sprint.label}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px" style={{ backgroundColor: '#E6E9EF' }} />

          {/* Descripción */}
          <div>
            <label style={lbl}><FileText size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Descripción / Instrucciones</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg text-xs leading-relaxed resize-none"
              style={{ ...inputBase, color: '#676879' }}
              placeholder="Qué hay que hacer, cómo hacerlo, referencias, links..."
            />
          </div>

          {/* Problema */}
          <div>
            <label style={lbl}>Problema que resuelve</label>
            <input
              value={problema}
              onChange={e => setProblema(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-xs"
              style={inputBase}
              placeholder="Ej: Show rate de Book Demos bajo"
            />
          </div>

          {/* Entregables — collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setShowDel(v => !v)}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-colors"
              style={{
                backgroundColor: showDel ? 'rgba(99,102,241,0.06)' : '#FAFBFC',
                border: `1px solid ${showDel ? 'rgba(99,102,241,0.2)' : '#E6E9EF'}`,
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
                {DELIVERABLE_DEFS.map(({ key, label, color }) => {
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

          {/* Adjuntos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label style={lbl} className="flex items-center gap-1 !mb-0">
                <Paperclip size={9} style={{ display: 'inline' }} /> Archivos adjuntos
                {attachments.length > 0 && (
                  <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#EEF2FF', color: '#6366F1' }}>
                    {attachments.length}
                  </span>
                )}
              </label>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg"
                style={{ backgroundColor: uploading ? '#F3F4F6' : '#EEF2FF', color: uploading ? '#9699A6' : '#6366F1', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer' }}>
                <Upload size={11} />
                {uploading ? 'Subiendo…' : 'Subir archivo'}
              </button>
              <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
                onChange={handleFileUpload}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" />
            </div>

            {attachments.length === 0 && !uploading && (
              <div style={{ border: '2px dashed #E4E7F0', borderRadius: 10, padding: 16, textAlign: 'center', cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}>
                <Paperclip size={18} style={{ color: '#D1D5DB', margin: '0 auto 6px' }} />
                <p style={{ fontSize: 11, color: '#9699A6', margin: 0 }}>Arrastra o haz click para adjuntar</p>
              </div>
            )}

            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {attachments.map(att => {
                  const FileIcon = getFileIcon(att.type)
                  return (
                    <div key={att.path} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{ backgroundColor: '#FAFBFC', border: '1px solid #E6E9EF' }}>
                      <FileIcon size={14} style={{ color: '#9699A6', flexShrink: 0 }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate" style={{ color: '#1F2128' }}>{att.name}</p>
                        <p className="text-[9px]" style={{ color: '#9699A6' }}>{fmtBytes(att.size)}</p>
                      </div>
                      <a href={att.url} download target="_blank" rel="noreferrer"
                        className="p-1 rounded hover:bg-gray-100" style={{ color: '#9699A6' }}>
                        <Download size={12} />
                      </a>
                      <button type="button" onClick={() => removeAttachment(att)}
                        className="p-1 rounded hover:bg-red-50" style={{ color: '#E2445C', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bottom padding */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  )
}
