import { useState, useEffect, useRef } from 'react'
import {
  X, Save, ChevronDown, AlertTriangle, Check,
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

// ── Design tokens ─────────────────────────────────────────────────────────────
const D = {
  bg:          '#111318',
  surface:     '#1C1F26',
  surfaceHov:  '#22262F',
  border:      'rgba(255,255,255,0.07)',
  borderHov:   'rgba(255,255,255,0.13)',
  text:        '#E8EAED',
  sub:         '#8B8FA8',
  muted:       '#525669',
  accent:      '#7C83F7',
  input:       'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.09)',
}

// ── Team ─────────────────────────────────────────────────────────────────────
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
  { key: 'hooks',               label: 'Hooks de video',       color: '#8b5cf6' },
  { key: 'scripts_video',       label: 'Scripts video',        color: '#ec4899' },
  { key: 'body_copy',           label: 'Body copy',            color: '#3b82f6' },
  { key: 'cta',                 label: 'CTAs',                 color: '#f5a623' },
  { key: 'lead_magnet_pdf',     label: 'Lead magnets',         color: '#22c55e' },
  { key: 'vsl_script',          label: 'Scripts VSL',          color: '#06b6d4' },
  { key: 'landing_copy',        label: 'Landing copy',         color: '#f97316' },
  { key: 'thank_you_page_copy', label: 'Thank you page',       color: '#fbbf24' },
  { key: 'carousel_slides',     label: 'Slides / Carrusel',    color: '#a78bfa' },
  { key: 'headline_options',    label: 'Headlines',            color: '#f472b6' },
  { key: 'retargeting_scripts', label: 'Retargeting',          color: '#34d399' },
]

const SPRINT_COLORS: Record<number, string> = { 1: '#8b5cf6', 2: '#ec4899', 3: '#3b82f6', 4: '#22c55e' }

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

// ── Dark custom dropdown ──────────────────────────────────────────────────────
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
  const color = accentColor ?? sel?.color ?? D.accent

  return (
    <div style={{ flex: 1, position: 'relative' }} ref={ref}>
      <p style={{ fontSize: 10, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{label}</p>
      <button type="button" onClick={() => setOpen(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 10px', borderRadius: 8, cursor: 'pointer', outline: 'none',
        backgroundColor: D.input, border: `1px solid ${open ? color + '60' : D.inputBorder}`,
        transition: 'border 0.15s',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left', fontSize: 12, fontWeight: 600, color: value ? color : D.sub }}>{sel?.label ?? ''}</span>
        <ChevronDown size={11} style={{ color: D.muted, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 600,
          backgroundColor: D.surface, border: `1px solid ${D.borderHov}`,
          borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.5)', padding: 4,
          maxHeight: 220, overflowY: 'auto',
        }}>
          {options.map(o => {
            const isActive = o.value === value
            const oc = o.color ?? D.accent
            return (
              <button key={o.value} type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  backgroundColor: isActive ? `${oc}18` : 'transparent', textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: oc, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? oc : D.sub }}>{o.label}</span>
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
interface Props { task: Task; onClose: () => void }

// ── Component ─────────────────────────────────────────────────────────────────
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
  const sprint       = getSprintDateRange(week)
  const sprintColor  = SPRINT_COLORS[week] ?? D.accent
  const assigneeInfo = ASSIGNEES.find(a => a.name === assignee)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const isDirty =
    title !== task.title || description !== (task.description ?? '') ||
    problema !== (task.problema ?? '') || area !== task.area ||
    assignee !== task.assignee || priority !== task.priority ||
    status !== task.status || week !== task.week || tipo !== task.tipo ||
    clientId !== (task.client_id ?? '') || campaignId !== (task.campaign_id ?? '') ||
    etapa !== (task.etapa ?? '') || miniStatus !== (task.mini_status ?? '') ||
    dueDate !== (task.due_date ?? '') ||
    JSON.stringify(deliverables) !== JSON.stringify(task.deliverables ?? {}) ||
    JSON.stringify(attachments) !== JSON.stringify(task.attachments ?? [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateTask.mutateAsync({
        id: task.id, title, description: description || undefined,
        problema: problema || undefined, area, assignee, priority, status,
        week, tipo, client_id: clientId || undefined,
        campaign_id: campaignId || undefined, etapa: etapa || undefined,
        mini_status: miniStatus || undefined, due_date: dueDate || undefined,
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

  const clientColor = clients.find(c => c.id === clientId)?.color
  const statusOpts   = (Object.entries(STATUS_LABELS)   as [TaskStatus, string][]).map(([v, l]) => ({ value: v, label: l, color: STATUS_COLORS[v] }))
  const priorityOpts = (Object.entries(PRIORITY_LABELS) as [Priority,   string][]).map(([v, l]) => ({ value: v, label: l, color: PRIORITY_COLORS[v] }))
  const tipoOpts = [
    { value: 'nuevo',              label: 'Nuevo',              color: D.sub },
    { value: 'pendiente_anterior', label: 'Pendiente anterior', color: '#F97316' },
    { value: 'urgente',            label: 'Urgente 🚨',         color: '#EF4444' },
  ]
  const etapaOpts    = [{ value: '', label: 'Sin etapa', color: D.muted }, ...ETAPA_ORDER.map(e => ({ value: e, label: ETAPA_LABELS[e as Etapa], color: ETAPA_COLORS[e as Etapa] }))]
  const miniStatusOpts = [{ value: '', label: 'Sin estado', color: D.muted }, ...MINI_STATUS_ORDER.map(s => ({ value: s, label: MINI_STATUS_LABELS[s as MiniStatus], color: MINI_STATUS_COLORS[s as MiniStatus] }))]
  const clienteOpts  = [{ value: '', label: 'Sin cliente', color: D.muted }, ...clients.map(c => ({ value: c.id, label: c.name, color: c.color }))]
  const campanaOpts  = [{ value: '', label: 'Sin campaña', color: D.muted }, ...campaigns.map(c => ({ value: c.id, label: c.name, color: D.accent }))]

  const sectionLbl = (text: string) => (
    <p style={{ fontSize: 10, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{text}</p>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose}
        style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }} />

      {/* Drawer */}
      <div className="relative flex flex-col h-full w-full overflow-hidden"
        style={{ maxWidth: 520, backgroundColor: D.bg, borderLeft: `1px solid ${D.border}`, boxShadow: '-16px 0 48px rgba(0,0,0,0.5)' }}>

        {/* Client color top stripe */}
        <div className="absolute top-0 left-0 right-0" style={{ height: 2, background: task.client?.color ? `linear-gradient(90deg, ${task.client.color}, ${task.client.color}80)` : D.accent }} />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0"
          style={{ borderBottom: `1px solid ${D.border}` }}>
          <div className="flex items-center gap-2 flex-wrap">
            {task.client && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                style={{ backgroundColor: `${task.client.color}20`, color: task.client.color, border: `1px solid ${task.client.color}35` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.client.color }} />
                {task.client.name}
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider"
              style={{
                backgroundColor: task.source === 'meeting_auto' ? `${D.accent}18` : 'rgba(255,255,255,0.05)',
                color: task.source === 'meeting_auto' ? D.accent : D.muted,
                border: `1px solid ${task.source === 'meeting_auto' ? D.accent + '30' : D.border}`,
              }}>
              {task.source === 'meeting_auto' ? <><Bot size={9} /> Auto</> : <><Hand size={9} /> Manual</>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${D.accent}, #9B6DFF)`, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: `0 0 16px ${D.accent}40` }}>
                <Save size={11} />
                {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar'}
              </button>
            )}
            <button onClick={onClose}
              style={{ padding: 6, borderRadius: 8, border: `1px solid ${D.border}`, cursor: 'pointer', backgroundColor: 'transparent', color: D.sub, display: 'flex', alignItems: 'center' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-auto" style={{ padding: '20px 20px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Título */}
            <div>
              {sectionLbl('Título de la tarea')}
              <textarea value={title} onChange={e => setTitle(e.target.value)} rows={2}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  backgroundColor: D.input, border: `1px solid ${D.inputBorder}`,
                  color: D.text, fontSize: 14, fontWeight: 500, resize: 'none',
                  lineHeight: 1.5, outline: 'none',
                }}
                placeholder="Describe la tarea..." />
            </div>

            {/* Row: Status · Prioridad · Tipo */}
            <div style={{ display: 'flex', gap: 8 }}>
              <FieldSel label="Status" value={status} onChange={v => setStatus(v as TaskStatus)} options={statusOpts} />
              <FieldSel label="Prioridad" value={priority} onChange={v => setPriority(v as Priority)} options={priorityOpts} />
              <FieldSel label="Tipo" value={tipo} onChange={v => setTipo(v as TaskTipo)} options={tipoOpts} accentColor={D.sub} />
            </div>

            {/* Área */}
            <div>
              {sectionLbl('Área')}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(Object.entries(AREA_LABELS) as [Area, string][]).map(([v, l]) => {
                  const active = area === v
                  const col = AREA_COLORS[v]
                  return (
                    <button key={v} onClick={() => setArea(v)} style={{
                      padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                      backgroundColor: active ? col : `${col}15`,
                      color: active ? '#fff' : col,
                      boxShadow: active ? `0 0 16px ${col}50` : 'none',
                    }}>{l}</button>
                  )
                })}
              </div>
            </div>

            {/* Responsable */}
            <div>
              {sectionLbl('Responsable')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {ASSIGNEES.map(a => {
                  const active = assignee === a.name
                  return (
                    <button key={a.name} onClick={() => setAssignee(a.name)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                        borderRadius: 10, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                        backgroundColor: active ? `${a.color}18` : D.input,
                        border: `1px solid ${active ? a.color + '50' : D.inputBorder}`,
                        boxShadow: active ? `0 0 12px ${a.color}25` : 'none',
                      }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 800,
                        background: active ? `linear-gradient(135deg, ${a.color}, ${a.color}90)` : `${a.color}25`,
                        color: active ? '#fff' : a.color,
                        boxShadow: active ? `0 0 8px ${a.color}50` : 'none',
                      }}>
                        {a.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: active ? a.color : D.text, margin: 0 }}>{a.name}</p>
                        <p style={{ fontSize: 9, color: D.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.role}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              {assigneeInfo && !assigneeInfo.areas.includes(area) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <AlertTriangle size={11} color="#F59E0B" />
                  <span style={{ fontSize: 11, color: '#F59E0B' }}>{assignee} normalmente no trabaja en <strong>{AREA_LABELS[area]}</strong>.</span>
                </div>
              )}
            </div>

            {/* Row: Cliente · Campaña */}
            <div style={{ display: 'flex', gap: 8 }}>
              <FieldSel label="Cliente" value={clientId} onChange={v => { setClientId(v); setCampaignId('') }} options={clienteOpts} accentColor={clientColor ?? D.muted} />
              <FieldSel label="Campaña" value={campaignId} onChange={setCampaignId} options={campanaOpts} />
            </div>

            {/* Row: Etapa · Mini Status */}
            <div style={{ display: 'flex', gap: 8 }}>
              <FieldSel label="Etapa" value={etapa} onChange={v => setEtapa(v as Etapa | '')} options={etapaOpts} accentColor={etapa ? ETAPA_COLORS[etapa as Etapa] : D.muted} />
              <FieldSel label="Mini Status" value={miniStatus} onChange={v => setMiniStatus(v as MiniStatus | '')} options={miniStatusOpts} accentColor={miniStatus ? MINI_STATUS_COLORS[miniStatus as MiniStatus] : D.muted} />
            </div>

            {/* Row: Fecha límite + Sprint */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Fecha límite</p>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  backgroundColor: D.input, border: `1px solid ${D.inputBorder}`,
                  color: dueDate && new Date(dueDate) < new Date() ? '#F87171' : D.sub,
                  fontSize: 12, outline: 'none', colorScheme: 'dark',
                }} />
              </div>
              <div style={{ flex: 1.4 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Sprint</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4].map(w => {
                    const sc = SPRINT_COLORS[w]
                    const s  = getSprintDateRange(w)
                    const active = week === w
                    return (
                      <button key={w} onClick={() => setWeek(w)} style={{
                        flex: 1, borderRadius: 8, padding: '7px 4px', textAlign: 'center',
                        backgroundColor: active ? `${sc}20` : D.input,
                        border: `1px solid ${active ? sc + '60' : D.inputBorder}`,
                        cursor: 'pointer', transition: 'all 0.15s',
                        boxShadow: active ? `0 0 10px ${sc}30` : 'none',
                      }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: active ? sc : D.muted, margin: 0 }}>S{w}</p>
                        <p style={{ fontSize: 8, color: D.muted, margin: 0 }}>{s.startFmt}</p>
                      </button>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: sprintColor }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: sprintColor }}>Sprint {week}</span>
                  <span style={{ fontSize: 10, color: D.muted }}>· {sprint.label}</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, backgroundColor: D.border }} />

            {/* Descripción */}
            <div>
              {sectionLbl('Descripción / Instrucciones')}
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  backgroundColor: D.input, border: `1px solid ${D.inputBorder}`,
                  color: D.sub, fontSize: 12, resize: 'none', lineHeight: 1.6, outline: 'none',
                }}
                placeholder="Qué hay que hacer, cómo hacerlo, referencias, links..." />
            </div>

            {/* Problema */}
            <div>
              {sectionLbl('Problema que resuelve')}
              <input value={problema} onChange={e => setProblema(e.target.value)} style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                backgroundColor: D.input, border: `1px solid ${D.inputBorder}`,
                color: D.sub, fontSize: 12, outline: 'none',
              }} placeholder="Ej: Show rate de Book Demos bajo" />
            </div>

            {/* Entregables */}
            <div>
              <button type="button" onClick={() => setShowDel(v => !v)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                backgroundColor: showDel ? `${D.accent}12` : D.input,
                border: `1px solid ${showDel ? D.accent + '40' : D.inputBorder}`,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: showDel ? D.accent : D.sub }}>
                  📦 Entregables y cantidades
                  {totalDel > 0 && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, backgroundColor: `${D.accent}20`, color: D.accent }}>{totalDel}</span>}
                </span>
                <ChevronDown size={12} style={{ color: D.muted, transform: showDel ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
              </button>
              {showDel && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {DELIVERABLE_DEFS.map(({ key, label, color }) => {
                    const val = deliverables[key] ?? 0
                    return (
                      <div key={key} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8,
                        backgroundColor: val > 0 ? `${color}10` : D.input,
                        border: `1px solid ${val > 0 ? color + '30' : D.inputBorder}`,
                      }}>
                        <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: val > 0 ? color : D.muted }}>{label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button type="button" onClick={() => setDeliverable(key, Math.max(0, val - 1))}
                            style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: val > 0 ? `${color}25` : 'rgba(255,255,255,0.06)', color: val > 0 ? color : D.muted }}>−</button>
                          <span style={{ width: 28, textAlign: 'center', fontSize: 12, fontWeight: 700, color: val > 0 ? color : D.muted }}>{val}</span>
                          <button type="button" onClick={() => setDeliverable(key, val + 1)}
                            style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}25`, color }}>+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Adjuntos */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                {sectionLbl(`Archivos adjuntos${attachments.length > 0 ? ` (${attachments.length})` : ''}`)}
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: `1px solid ${D.border}`, cursor: 'pointer', fontSize: 11, fontWeight: 600, backgroundColor: D.input, color: D.accent }}>
                  <Upload size={11} />{uploading ? 'Subiendo…' : 'Subir'}
                </button>
              </div>
              <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
                onChange={handleFileUpload} accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip" />

              {attachments.length === 0 && !uploading && (
                <div onClick={() => fileInputRef.current?.click()} style={{ border: `1.5px dashed ${D.border}`, borderRadius: 10, padding: '20px 16px', textAlign: 'center', cursor: 'pointer' }}>
                  <Paperclip size={18} style={{ color: D.muted, margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 11, color: D.muted, margin: 0 }}>Arrastra o haz click para adjuntar</p>
                </div>
              )}
              {attachments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {attachments.map(att => {
                    const FileIcon = getFileIcon(att.type)
                    return (
                      <div key={att.path} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, backgroundColor: D.input, border: `1px solid ${D.inputBorder}` }}>
                        <FileIcon size={14} style={{ color: D.muted, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 11, fontWeight: 500, color: D.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</p>
                          <p style={{ fontSize: 9, color: D.muted, margin: 0 }}>{fmtBytes(att.size)}</p>
                        </div>
                        <a href={att.url} download target="_blank" rel="noreferrer" style={{ padding: 4, color: D.sub, display: 'flex' }}>
                          <Download size={12} />
                        </a>
                        <button type="button" onClick={() => removeAttachment(att)} style={{ padding: 4, border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: '#F87171', display: 'flex' }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
