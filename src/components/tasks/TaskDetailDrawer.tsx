import { useState, useEffect, useRef } from 'react'
import {
  X, Save, ChevronDown, AlertTriangle, Check,
  Paperclip, Upload, Trash2, Download, File, Image, FileVideo, FileAudio,
  Bot, Hand, Plus,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useUpdateTask, useDeleteTask } from '../../hooks/useTasks'
import { getDaysOverdue } from '../../lib/dates'
import { useClients } from '../../hooks/useClients'
import { useCampaignPicker, useCreateCampaign } from '../../hooks/useCampaigns'
import type { Task, Area, Priority, TaskStatus, TaskTipo, Etapa, Deliverables, TaskAttachment, CampaignType } from '../../types'
import {
  AREA_LABELS, AREA_COLORS, ETAPA_TO_AREA, STATUS_LABELS, STATUS_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS,
  ETAPA_LABELS, ETAPA_COLORS, ETAPA_ORDER,
  CAMPAIGN_TYPE_LABELS, CAMPAIGN_TYPE_COLORS,
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
  { key: 'body_copy',           label: 'Body copy',            color: '#3b82f6' },
  { key: 'cta',                 label: 'CTAs',                 color: '#f5a623' },
  { key: 'lead_magnet_pdf',     label: 'Lead magnets',         color: '#22c55e' },
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

// ── Assignee dropdown (multi-select) ───────────────────────────────────────────
type AssigneeItem = { name: string; role: string; color: string; areas: string[] }
function AssigneeDropdown({
  value, onChange, options,
}: {
  value: string[]
  onChange: (v: string[]) => void
  options: AssigneeItem[]
}) {
  const { open, setOpen, ref } = usePopover()
  const initials = (n: string) => n.slice(0, 2).toUpperCase()
  const selected = value.map(name => options.find(o => o.name === name)).filter(Boolean) as AssigneeItem[]
  const hasAny = selected.length > 0
  const primary = selected[0]
  const primaryColor = primary?.color ?? '#9CA3AF'

  const toggle = (name: string) => {
    if (value.includes(name)) onChange(value.filter(v => v !== name))
    else onChange([...value, name])
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 11px', borderRadius: 9,
          background: hasAny ? `${primaryColor}10` : '#FAFBFC',
          border: `1.5px solid ${hasAny ? `${primaryColor}40` : '#F0F0F0'}`,
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        {hasAny ? (
          <>
            {/* Stacked avatars (máx 3) */}
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {selected.slice(0, 3).map((a, i) => (
                <div key={a.name} style={{
                  width: 26, height: 26, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800,
                  background: `linear-gradient(135deg,${a.color},${a.color}80)`,
                  color: '#fff',
                  border: '2px solid #fff',
                  marginLeft: i === 0 ? 0 : -8,
                  zIndex: 10 - i,
                }}>{initials(a.name)}</div>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: primaryColor, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selected.map(s => s.name).join(', ')}
              </p>
              <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selected.length === 1 ? primary?.role : `${selected.length} responsables`}
              </p>
            </div>
          </>
        ) : (
          <>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: '#F3F4F6', color: '#9CA3AF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800,
            }}>?</div>
            <span style={{ flex: 1, fontSize: 12.5, color: '#9CA3AF', fontWeight: 600 }}>Sin responsable</span>
          </>
        )}
        <ChevronDown size={13} style={{ color: '#9CA3AF', transform: open ? 'rotate(180deg)' : 'none', transition: '150ms' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 120,
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10,
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)', padding: 4,
          maxHeight: 340, overflowY: 'auto',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 9px', fontSize: 10, fontWeight: 700, color: '#9CA3AF',
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            <span>Selecciona uno o varios</span>
            {hasAny && (
              <button type="button" onClick={() => onChange([])}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#6366F1', fontWeight: 700 }}>
                Limpiar
              </button>
            )}
          </div>
          {options.map(a => {
            const sel = value.includes(a.name)
            return (
              <button
                key={a.name}
                type="button"
                onClick={() => toggle(a.name)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                  padding: '7px 9px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  background: sel ? `${a.color}14` : 'transparent', textAlign: 'left',
                }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.backgroundColor = '#F9FAFB' }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: `1.5px solid ${sel ? a.color : '#D1D5DB'}`,
                  background: sel ? a.color : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {sel && <Check size={12} color="#fff" strokeWidth={3} />}
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9.5, fontWeight: 800,
                  background: sel ? `linear-gradient(135deg,${a.color},${a.color}80)` : `${a.color}1A`,
                  color: sel ? '#fff' : a.color,
                }}>{initials(a.name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: sel ? a.color : '#111827', margin: 0 }}>{a.name}</p>
                  <p style={{ fontSize: 9.5, color: '#9CA3AF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.role}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
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
      {label && (
        <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
          {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
        </p>
      )}
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
  const createCampaign = useCreateCampaign()
  const { data: clients = [] } = useClients()

  const [title,        setTitle]        = useState(task.title)
  const [description,  setDescription]  = useState(task.description ?? '')
  const [area,         setArea]         = useState<Area>(task.area)
  const [assignees,    setAssignees]    = useState<string[]>(
    task.assignees && task.assignees.length > 0
      ? task.assignees
      : (task.assignee ? [task.assignee] : [])
  )
  const [priority,     setPriority]     = useState<Priority>(task.priority)
  const [status,       setStatus]       = useState<TaskStatus>(task.status)
  const [week,         setWeek]         = useState(task.week)
  const [tipo,         setTipo]         = useState<TaskTipo>(task.tipo)
  const [clientId,     setClientId]     = useState(task.client_id ?? '')
  const [campaignId,   setCampaignId]   = useState(task.campaign_id ?? '')
  const [etapa,        setEtapa]        = useState<Etapa | ''>(task.etapa ?? '')
  const prevEtapaRef = useRef<Etapa | ''>(task.etapa ?? '')
  // Auto-derive área from etapa whenever etapa changes.
  useEffect(() => {
    if (etapa && etapa !== prevEtapaRef.current) {
      const mapped = ETAPA_TO_AREA[etapa as Etapa]
      if (mapped) setArea(mapped)
    }
    prevEtapaRef.current = etapa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa])
  const [dueDate,      setDueDate]      = useState(task.due_date ?? '')
  const [deliverables, setDeliverables] = useState<Deliverables>(task.deliverables ?? {})
  const [attachments,  setAttachments]  = useState<TaskAttachment[]>(task.attachments ?? [])
  const [uploading,     setUploading]    = useState(false)
  const [saving,        setSaving]       = useState(false)
  const [saved,         setSaved]        = useState(false)
  const [showDel,       setShowDel]      = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [creatingCampaign, setCreatingCampaign] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [newCampaignType, setNewCampaignType] = useState<CampaignType>('nueva_campana')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: campaigns = [] } = useCampaignPicker(clientId || undefined)
  const primaryAssignee = assignees[0] ?? ''
  const assigneeInfo = ASSIGNEES.find(a => a.name === primaryAssignee)
  const clientColor  = clients.find(c => c.id === clientId)?.color

  // Validación: obligatorios
  const missing: string[] = []
  if (!title.trim())   missing.push('Título')
  if (!clientId)       missing.push('Cliente')
  if (!etapa)          missing.push('Etapa')
  const isValid = missing.length === 0

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const prevAssigneesKey = (task.assignees && task.assignees.length > 0 ? task.assignees : (task.assignee ? [task.assignee] : [])).join('|')
  const currAssigneesKey = assignees.join('|')

  const isDirty =
    title !== task.title || description !== (task.description ?? '') ||
    area !== task.area ||
    currAssigneesKey !== prevAssigneesKey || priority !== task.priority ||
    status !== task.status || week !== task.week || tipo !== task.tipo ||
    clientId !== (task.client_id ?? '') || campaignId !== (task.campaign_id ?? '') ||
    etapa !== (task.etapa ?? '') ||
    dueDate !== (task.due_date ?? '') ||
    JSON.stringify(deliverables) !== JSON.stringify(task.deliverables ?? {}) ||
    JSON.stringify(attachments)  !== JSON.stringify(task.attachments ?? [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateTask.mutateAsync({
        id: task.id, title, description: description || undefined,
        area, assignee: assignees[0] ?? '', assignees, priority, status,
        week, tipo, client_id: clientId || undefined,
        campaign_id: campaignId || undefined, etapa: etapa || undefined,
        due_date: dueDate || undefined,
        deliverables: Object.keys(deliverables).length > 0 ? deliverables : undefined,
        attachments:  attachments.length > 0 ? attachments : undefined,
      })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  // Only hard requirement to save is a non-empty title (DB NOT NULL).
  const canSave = title.trim().length > 0

  const handleCreateCampaign = async () => {
    const name = newCampaignName.trim()
    if (!name || !clientId) return
    try {
      const created = await createCampaign.mutateAsync({
        client_id: clientId,
        name,
        type: newCampaignType,
        status: 'activa',
      } as Parameters<typeof createCampaign.mutateAsync>[0])
      if (created?.id) setCampaignId(created.id)
      setNewCampaignName('')
      setCreatingCampaign(false)
    } catch (err) {
      console.error('Error creating campaign:', err)
    }
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
  const areaOpts       = (Object.entries(AREA_LABELS) as [Area, string][]).map(([v, l]) => ({ value: v, label: l, color: AREA_COLORS[v] }))
  const clienteOpts    = [{ value: '', label: 'Sin cliente', color: '#D1D5DB' }, ...clients.map(c => ({ value: c.id, label: c.name, color: c.color }))]
  const campanaOpts    = clientId
    ? [{ value: '', label: 'Sin campaña', color: '#D1D5DB' }, ...campaigns.map(c => ({ value: c.id, label: c.label, color: c.color }))]
    : [{ value: '', label: 'Selecciona cliente primero', color: '#D1D5DB' }]

  const sLbl = (t: string) => (
    <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{t}</p>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ padding: '24px' }}>
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose}
        style={{ backgroundColor: 'rgba(15,17,22,0.45)', backdropFilter: 'blur(4px)' }} />

      {/* Modal panel */}
      <div className="relative flex flex-col overflow-hidden"
        style={{
          width: '100%',
          maxWidth: 980,
          maxHeight: 'calc(100vh - 48px)',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}>

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
              {/* Save button — manual save only */}
              {saved && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, border: '1px solid #BBF7D0', backgroundColor: '#F0FDF4', color: '#16A34A' }}>
                  <Check size={11} /> Guardado
                </span>
              )}
              {isDirty && !isValid && !saved && (
                <span title={`Faltan: ${missing.join(', ')}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, border: '1px solid #FCA5A5', backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                  <AlertTriangle size={11} /> Faltan campos
                </span>
              )}
              {isDirty && canSave && !saved && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                    border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                    backgroundColor: '#6366F1', color: '#fff',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  <Save size={12} /> {saving ? 'Guardando…' : 'Guardar'}
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
              width: '100%', outline: 'none', resize: 'none',
              fontSize: 16, fontWeight: 600, color: '#111827', lineHeight: 1.4,
              backgroundColor: '#FAFBFC', fontFamily: 'inherit',
              padding: '8px 10px', borderRadius: 8,
              border: '1px dashed #D1D5DB',
              transition: 'all 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.border = '1px solid #6366F1'; e.currentTarget.style.backgroundColor = '#FAFBFF' }}
            onBlur={e => { e.currentTarget.style.border = '1px dashed #D1D5DB'; e.currentTarget.style.backgroundColor = '#FAFBFC' }}
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

            {/* Etapa (antes ocupaba el lugar de Área) */}
            <div style={{ display: 'flex', gap: 8 }}>
              <FieldSel label="Etapa" required value={etapa} onChange={v => setEtapa(v as Etapa | '')} options={etapaOpts} accentColor={etapa ? ETAPA_COLORS[etapa as Etapa] : '#D1D5DB'} />
            </div>

            {/* Responsables (multi-select) */}
            <div>
              {sLbl('Responsables')}
              <AssigneeDropdown
                value={assignees}
                onChange={setAssignees}
                options={ASSIGNEES}
              />
              {assigneeInfo && !assigneeInfo.areas.includes(area) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, padding: '5px 10px', borderRadius: 7, backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                  <AlertTriangle size={11} color="#D97706" />
                  <span style={{ fontSize: 11, color: '#92400E' }}>{primaryAssignee} normalmente no trabaja en <strong>{AREA_LABELS[area]}</strong>.</span>
                </div>
              )}
            </div>

            {/* Cliente · Campaña */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <FieldSel label="Cliente" required value={clientId}  onChange={v => { setClientId(v); setCampaignId(''); setCreatingCampaign(false) }} options={clienteOpts}  accentColor={clientColor ?? '#D1D5DB'} />
              <div style={{ flex: 1 }}>
                {creatingCampaign ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                        Nueva Campaña
                      </p>
                      <button type="button" onClick={() => { setCreatingCampaign(false); setNewCampaignName('') }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#6B7280', fontWeight: 600 }}>
                        Cancelar
                      </button>
                    </div>
                    <input
                      autoFocus
                      value={newCampaignName}
                      onChange={e => setNewCampaignName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCampaign() } }}
                      placeholder="Nombre de la campaña"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, outline: 'none', border: '1px solid #6366F1', fontSize: 12, fontWeight: 500, color: '#374151', backgroundColor: '#FAFBFF', marginBottom: 6 }}
                    />
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                      {(Object.entries(CAMPAIGN_TYPE_LABELS) as [CampaignType, string][]).map(([v, l]) => {
                        const active = newCampaignType === v
                        const col = CAMPAIGN_TYPE_COLORS[v]
                        return (
                          <button key={v} type="button" onClick={() => setNewCampaignType(v)}
                            style={{ padding: '4px 10px', borderRadius: 16, fontSize: 10, fontWeight: 700, cursor: 'pointer', border: 'none', backgroundColor: active ? col : `${col}15`, color: active ? '#fff' : col, transition: 'all 0.12s' }}>
                            {l}
                          </button>
                        )
                      })}
                    </div>
                    <button type="button" onClick={handleCreateCampaign}
                      disabled={!newCampaignName.trim() || createCampaign.isPending}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: 'none', cursor: newCampaignName.trim() ? 'pointer' : 'not-allowed', fontSize: 11, fontWeight: 700, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', opacity: (!newCampaignName.trim() || createCampaign.isPending) ? 0.5 : 1 }}>
                      {createCampaign.isPending ? 'Creando…' : '✓ Crear campaña'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                        Campaña
                      </p>
                      {clientId && (
                        <button type="button" onClick={() => setCreatingCampaign(true)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#6366F1', fontWeight: 700 }}>
                          <Plus size={10} /> Nueva
                        </button>
                      )}
                    </div>
                    <FieldSel label="" value={campaignId} onChange={setCampaignId} options={campanaOpts} />
                  </>
                )}
              </div>
            </div>

            {/* Área (auto-derivado de Etapa; editable) */}
            <div style={{ display: 'flex', gap: 8 }}>
              <FieldSel label="Área" value={area} onChange={v => setArea(v as Area)} options={areaOpts} accentColor={AREA_COLORS[area]} />
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
                  Fecha de entrega
                </p>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8, outline: 'none',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#FAFBFC',
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
