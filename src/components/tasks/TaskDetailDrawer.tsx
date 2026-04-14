import { useState, useEffect, useRef } from 'react'
import {
  X, Save, ChevronDown, AlertTriangle, Check,
  Paperclip, Upload, Trash2, Download, File, Image, FileVideo, FileAudio,
  Bot, Hand,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUpdateTask, useDeleteTask } from '../../hooks/useTasks'
import { getDaysOverdue } from '../../lib/dates'
import { useClients } from '../../hooks/useClients'
import { useCampaignsByClient } from '../../hooks/useCampaigns'
import type { Task, Area, Priority, TaskStatus, TaskTipo, Etapa, MiniStatus, Deliverables, TaskAttachment } from '../../types'
import {
  AREA_LABELS, AREA_COLORS, STATUS_LABELS, STATUS_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS,
  ETAPA_LABELS, ETAPA_COLORS, ETAPA_ORDER,
  MINI_STATUS_LABELS, MINI_STATUS_COLORS, MINI_STATUS_ORDER,
} from '../../lib/constants'
import { TaskActivityLogPanel } from '../widgets/TaskActivityLogPanel'
import { SubtasksPanel } from './SubtasksPanel'

// ── Team ─────────────────────────────────────────────────────────────────────
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
      <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
      </p>
      <button type="button" onClick={() => setOpen(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 10px', borderRadius: 8, cursor: 'pointer', outline: 'none',
        backgroundColor: value ? `${color}08` : '#FAFBFC',
        border: `1px solid ${open ? color + '50' : value ? color + '30' : '#E5E7EB'}`,
        transition: 'all 0.15s',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left', fontSize: 12, fontWeight: 600, color: value ? color : '#9CA3AF' }}>{sel?.label ?? ''}</span>
        <ChevronDown size={11} style={{ color: '#D1D5DB', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 600,
          backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
          borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', padding: 4,
          maxHeight: 220, overflowY: 'auto',
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
                  backgroundColor: isActive ? `${oc}10` : 'transparent', textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F5F5' }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: oc, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? oc : '#374151' }}>{o.label}</span>
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

export function TaskDetailDrawer({ task, onClose }: Props) {
  const updateTask  = useUpdateTask()
  const deleteTask  = useDeleteTask()
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
  const [uploading,     setUploading]    = useState(false)
  const [saving,        setSaving]       = useState(false)
  const [saved,         setSaved]        = useState(false)
  const [showDel,       setShowDel]      = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: campaigns = [] } = useCampaignsByClient(clientId || undefined)
  const assigneeInfo = ASSIGNEES.find(a => a.name === assignee)
  const clientColor  = clients.find(c => c.id === clientId)?.color

  // Validación: obligatorios
  const missing: string[] = []
  if (!title.trim())   missing.push('Título')
  if (!clientId)       missing.push('Cliente')
  if (!etapa)          missing.push('Etapa')
  if (!dueDate)        missing.push('Fecha de entrega')
  const isValid = missing.length === 0

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
    JSON.stringify(attachments)  !== JSON.stringify(task.attachments ?? [])

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
        attachments:  attachments.length > 0 ? attachments : undefined,
      })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  const setDeliverable = (key: keyof Deliverables, value: number) => {
    setDeliverables(prev => { const n = { ...prev }; if (value > 0) n[key] = value; else delete n[key]; return n })
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
    if (att.path) {
      await supabase.storage.from('task-attachments').remove([att.path])
    }
    setAttachments(prev => prev.filter(a => a.path !== att.path))
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image
    if (type.startsWith('video/')) return FileVideo
    if (type.startsWith('audio/')) return FileAudio
    return File
  }
  const fmtBytes  = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(0)} KB` : `${(b/1048576).toFixed(1)} MB`
  const totalDel  = Object.values(deliverables).reduce((s, v) => s + (v ?? 0), 0)

  const statusOpts     = (Object.entries(STATUS_LABELS)   as [TaskStatus, string][]).map(([v, l]) => ({ value: v, label: l, color: STATUS_COLORS[v] }))
  const priorityOpts   = (Object.entries(PRIORITY_LABELS) as [Priority,   string][]).map(([v, l]) => ({ value: v, label: l, color: PRIORITY_COLORS[v] }))
  // tipo kept in state for save compatibility but not shown in UI
  const etapaOpts      = [{ value: '', label: 'Sin etapa', color: '#D1D5DB' }, ...ETAPA_ORDER.map(e => ({ value: e, label: ETAPA_LABELS[e as Etapa], color: ETAPA_COLORS[e as Etapa] }))]
  const miniStatusOpts = [{ value: '', label: 'Sin estado', color: '#D1D5DB' }, ...MINI_STATUS_ORDER.map(s => ({ value: s, label: MINI_STATUS_LABELS[s as MiniStatus], color: MINI_STATUS_COLORS[s as MiniStatus] }))]
  const clienteOpts    = [{ value: '', label: 'Sin cliente', color: '#D1D5DB' }, ...clients.map(c => ({ value: c.id, label: c.name, color: c.color }))]
  const campanaOpts    = [{ value: '', label: 'Sin campaña', color: '#D1D5DB' }, ...campaigns.map(c => ({ value: c.id, label: c.name, color: '#6366F1' }))]

  const sLbl = (t: string) => (
    <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{t}</p>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose}
        style={{ backgroundColor: 'rgba(15,17,22,0.25)', backdropFilter: 'blur(3px)' }} />

      {/* Drawer panel */}
      <div className="relative flex flex-col h-full w-full overflow-hidden"
        style={{ maxWidth: 520, backgroundColor: '#FFFFFF', borderLeft: '1px solid #E5E7EB', boxShadow: '-12px 0 40px rgba(0,0,0,0.15)' }}>

        {/* Client color stripe */}
        <div style={{ height: 3, background: task.client?.color ? `linear-gradient(90deg,${task.client.color},${task.client.color}60)` : '#6366F1', flexShrink: 0 }} />

        {/* ── Header ── */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', flexShrink: 0, backgroundColor: '#FFFFFF' }}>
          {/* Row 1: badges + actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {task.client && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, backgroundColor: `${task.client.color}15`, color: task.client.color, border: `1px solid ${task.client.color}30` }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: task.client.color }} />
                  {task.client.name}
                </span>
              )}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, backgroundColor: '#F3F4F6', color: '#9CA3AF', border: '1px solid #E5E7EB' }}>
                {task.source === 'meeting_auto' ? <><Bot size={9} /> Auto</> : <><Hand size={9} /> Manual</>}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isDirty && (
                <button onClick={handleSave} disabled={saving || !isValid}
                  title={!isValid ? `Faltan: ${missing.join(', ')}` : undefined}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: (saving || !isValid) ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', boxShadow: '0 2px 12px rgba(99,102,241,0.35)', opacity: (saving || !isValid) ? 0.5 : 1 }}>
                  <Save size={12} />
                  {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar'}
                </button>
              )}
              {/* Delete */}
              {confirmDelete ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>¿Eliminar?</span>
                  <button
                    onClick={async () => { await deleteTask.mutateAsync(task.id); onClose() }}
                    style={{ padding: '5px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, backgroundColor: '#EF4444', color: '#fff' }}>
                    Sí, eliminar
                  </button>
                  <button onClick={() => setConfirmDelete(false)}
                    style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid #E5E7EB', cursor: 'pointer', fontSize: 11, fontWeight: 600, backgroundColor: '#fff', color: '#6B7280' }}>
                    No
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} title="Eliminar tarea"
                  style={{ padding: 7, borderRadius: 8, border: '1px solid #FEE2E2', cursor: 'pointer', backgroundColor: '#FFF5F5', color: '#EF4444', display: 'flex' }}>
                  <Trash2 size={14} />
                </button>
              )}
              <button onClick={onClose}
                style={{ padding: 7, borderRadius: 8, border: '1px solid #E5E7EB', cursor: 'pointer', backgroundColor: '#fff', color: '#9CA3AF', display: 'flex' }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Row 2: Title */}
          <textarea
            value={title}
            onChange={e => setTitle(e.target.value)}
            rows={2}
            style={{
              width: '100%', border: 'none', outline: 'none', resize: 'none',
              fontSize: 16, fontWeight: 600, color: '#111827', lineHeight: 1.4,
              backgroundColor: 'transparent', fontFamily: 'inherit',
            }}
            placeholder="Título de la tarea..."
          />

          {/* Row 3: meta — fecha creación + ID + overdue badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>
              Creado{' '}
              <span style={{ color: '#1F2937', fontWeight: 700 }}>
                {new Date(task.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: '#D1D5DB', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>
              ID <span style={{ color: '#1F2937', fontWeight: 700, fontFamily: 'monospace' }}>{task.id.slice(0, 8)}</span>
            </span>
            {(() => {
              const days = getDaysOverdue(task)
              if (days === 0) return null
              return (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: '#D1D5DB', flexShrink: 0 }} />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
                    ⚠️ Atrasada {days} {days === 1 ? 'día' : 'días'}
                  </span>
                </>
              )
            })()}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-auto" style={{ padding: '18px 20px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Status · Prioridad */}
            <div style={{ display: 'flex', gap: 8 }}>
              <FieldSel label="Status"    value={status}   onChange={v => setStatus(v as TaskStatus)}   options={statusOpts} />
              <FieldSel label="Prioridad" value={priority} onChange={v => setPriority(v as Priority)}   options={priorityOpts} />
            </div>

            {/* Área */}
            <div>
              {sLbl('Área')}
              <div style={{ display: 'flex', gap: 6 }}>
                {(Object.entries(AREA_LABELS) as [Area, string][]).map(([v, l]) => {
                  const active = area === v
                  const col    = AREA_COLORS[v]
                  return (
                    <button key={v} onClick={() => setArea(v)} style={{
                      padding: '6px 18px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                      backgroundColor: active ? col : `${col}12`,
                      color: active ? '#fff' : col,
                      boxShadow: active ? `0 2px 10px ${col}45` : 'none',
                    }}>{l}</button>
                  )
                })}
              </div>
            </div>

            {/* Responsable */}
            <div>
              {sLbl('Responsable')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {ASSIGNEES.map(a => {
                  const active = assignee === a.name
                  return (
                    <button key={a.name} onClick={() => setAssignee(a.name)} style={{
                      display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px',
                      borderRadius: 9, cursor: 'pointer', textAlign: 'left', border: 'none',
                      backgroundColor: active ? `${a.color}10` : '#FAFBFC',
                      outline: active ? `1.5px solid ${a.color}40` : '1.5px solid #F0F0F0',
                      transition: 'all 0.12s',
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 800,
                        background: active ? `linear-gradient(135deg,${a.color},${a.color}80)` : `${a.color}18`,
                        color: active ? '#fff' : a.color,
                      }}>
                        {a.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: active ? a.color : '#374151', margin: 0 }}>{a.name}</p>
                        <p style={{ fontSize: 9, color: '#9CA3AF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.role}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              {assigneeInfo && !assigneeInfo.areas.includes(area) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, padding: '5px 10px', borderRadius: 7, backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <AlertTriangle size={11} color="#D97706" />
                  <span style={{ fontSize: 11, color: '#92400E' }}>{assignee} normalmente no trabaja en <strong>{AREA_LABELS[area]}</strong>.</span>
                </div>
              )}
            </div>

            {/* Cliente · Campaña */}
            <div style={{ display: 'flex', gap: 8 }}>
              <FieldSel label="Cliente" required value={clientId}  onChange={v => { setClientId(v); setCampaignId('') }} options={clienteOpts}  accentColor={clientColor ?? '#D1D5DB'} />
              <FieldSel label="Campaña" value={campaignId} onChange={setCampaignId}                            options={campanaOpts} />
            </div>

            {/* Etapa · Mini Status */}
            <div style={{ display: 'flex', gap: 8 }}>
              <FieldSel label="Etapa" required value={etapa}      onChange={v => setEtapa(v as Etapa | '')}           options={etapaOpts}      accentColor={etapa ? ETAPA_COLORS[etapa as Etapa] : '#D1D5DB'} />
              <FieldSel label="Mini Status" value={miniStatus} onChange={v => setMiniStatus(v as MiniStatus | '')} options={miniStatusOpts} accentColor={miniStatus ? MINI_STATUS_COLORS[miniStatus as MiniStatus] : '#D1D5DB'} />
            </div>

            {/* Fecha de Creación (auto) · Fecha de entrega */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Fecha de Creación</p>
                <input type="date" value={task.created_at ? new Date(task.created_at).toISOString().slice(0,10) : ''} readOnly disabled style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8, outline: 'none',
                  border: '1px solid #E5E7EB', backgroundColor: '#EEF0F6',
                  fontSize: 12, color: '#6B7280', cursor: 'not-allowed',
                }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                  Fecha de entrega <span style={{ color: '#EF4444' }}>*</span>
                </p>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8, outline: 'none',
                  border: `1px solid ${!dueDate ? '#FCA5A5' : '#E5E7EB'}`,
                  backgroundColor: !dueDate ? '#FEF2F2' : '#FAFBFC',
                  fontSize: 12, color: dueDate && new Date(dueDate) < new Date() ? '#DC2626' : '#374151',
                }} />
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, backgroundColor: '#F3F4F6' }} />

            {/* Descripción */}
            <div>
              {sLbl('Descripción / Instrucciones')}
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 9, resize: 'none', outline: 'none',
                  border: '1px solid #E5E7EB', backgroundColor: '#FAFBFC',
                  fontSize: 13, color: '#374151', lineHeight: 1.6,
                }}
                placeholder="Qué hay que hacer, cómo hacerlo, referencias, links..." />
            </div>

            {/* Problema */}
            <div>
              {sLbl('Problema que resuelve')}
              <input value={problema} onChange={e => setProblema(e.target.value)} style={{
                width: '100%', padding: '9px 12px', borderRadius: 9, outline: 'none',
                border: '1px solid #E5E7EB', backgroundColor: '#FAFBFC', fontSize: 13, color: '#374151',
              }} placeholder="Ej: Show rate de Book Demos bajo" />
            </div>

            {/* Entregables */}
            <div>
              <button type="button" onClick={() => setShowDel(v => !v)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '10px 14px', borderRadius: 9, cursor: 'pointer', border: 'none',
                backgroundColor: showDel ? '#EEF2FF' : '#F9FAFB',
                outline: `1px solid ${showDel ? '#C7D2FE' : '#E5E7EB'}`,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: showDel ? '#4F46E5' : '#6B7280' }}>
                  📦 Entregables y cantidades
                  {totalDel > 0 && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, backgroundColor: '#E0E7FF', color: '#4F46E5' }}>{totalDel}</span>}
                </span>
                <ChevronDown size={13} style={{ color: '#9CA3AF', transform: showDel ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
              </button>
              {showDel && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {DELIVERABLE_DEFS.map(({ key, label, color }) => {
                    const val = deliverables[key] ?? 0
                    return (
                      <div key={key} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8,
                        backgroundColor: val > 0 ? `${color}08` : '#FAFBFC',
                        border: `1px solid ${val > 0 ? color + '25' : '#F0F0F0'}`,
                      }}>
                        <span style={{ flex: 1, fontSize: 12, color: val > 0 ? color : '#9CA3AF' }}>{label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button type="button" onClick={() => setDeliverable(key, Math.max(0, val - 1))}
                            style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #E5E7EB', cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: val > 0 ? `${color}12` : '#F9FAFB', color: val > 0 ? color : '#D1D5DB' }}>−</button>
                          <span style={{ width: 26, textAlign: 'center', fontSize: 12, fontWeight: 700, color: val > 0 ? color : '#D1D5DB' }}>{val}</span>
                          <button type="button" onClick={() => setDeliverable(key, val + 1)}
                            style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid #E5E7EB', cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}12`, color }}>+</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Subtareas */}
            <SubtasksPanel taskId={task.id} />

            {/* Adjuntos */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                  Archivos adjuntos {attachments.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, backgroundColor: '#EEF2FF', color: '#6366F1' }}>{attachments.length}</span>}
                </p>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid #E0E7FF', cursor: 'pointer', fontSize: 11, fontWeight: 600, backgroundColor: '#EEF2FF', color: '#6366F1' }}>
                  <Upload size={10} />{uploading ? 'Subiendo…' : 'Subir'}
                </button>
              </div>
              <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileUpload}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip" />
              {attachments.length === 0 && !uploading && (
                <div onClick={() => fileInputRef.current?.click()} style={{ border: '1.5px dashed #E5E7EB', borderRadius: 9, padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
                  <Paperclip size={16} style={{ color: '#D1D5DB', margin: '0 auto 6px' }} />
                  <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Arrastra o haz click para adjuntar</p>
                </div>
              )}
              {attachments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {attachments.map(att => {
                    const FileIcon = getFileIcon(att.type ?? '')
                    return (
                      <div key={att.path ?? att.url} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, backgroundColor: '#FAFBFC', border: '1px solid #F0F0F0' }}>
                        <FileIcon size={14} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 500, color: '#374151', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</p>
                          <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>{fmtBytes(att.size ?? 0)}</p>
                        </div>
                        <a href={att.url} download target="_blank" rel="noreferrer" style={{ padding: 4, color: '#9CA3AF', display: 'flex' }}><Download size={13} /></a>
                        <button type="button" onClick={() => removeAttachment(att)} style={{ padding: 4, border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: '#EF4444', display: 'flex' }}><Trash2 size={13} /></button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Historial de actividad */}
            <div style={{ marginTop: 8 }}>
              <TaskActivityLogPanel taskId={task.id} />
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
