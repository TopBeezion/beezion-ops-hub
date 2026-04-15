import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams, Navigate, useNavigate, useOutletContext } from 'react-router-dom'
import { useCampaigns, useUpdateCampaign, useDeleteCampaign } from '../hooks/useCampaigns'
import { useEnsureGroupChildren } from '../hooks/useCampaignTemplates'
import { useClients } from '../hooks/useClients'
import { useTasks, useUpdateTask, useCreateTask } from '../hooks/useTasks'
import type { Task, CampaignType, CampaignStatus, Etapa, TaskStatus, Priority, Area } from '../types'
import {
  CAMPAIGN_TYPE_LABELS, CAMPAIGN_TYPE_COLORS,
  CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS,
  ETAPA_LABELS, ETAPA_COLORS, ETAPA_ORDER, ETAPA_TO_AREA,
  STATUS_LABELS, STATUS_COLORS, STATUS_ORDER,
  PRIORITY_LABELS, PRIORITY_COLORS, PRIORITY_ORDER,
  TEAM_MEMBERS, ASSIGNEE_COLORS, getTaskAssignees,
} from '../lib/constants'
import {
  ArrowLeft, Calendar, Target as TargetIcon,
  ChevronDown, Archive, ArchiveRestore, Trash2, LayoutGrid, StickyNote, Plus,
} from 'lucide-react'

const C = {
  bg: '#F0F2F8', card: '#FFFFFF', border: '#E4E7F0',
  text: '#1A1D27', sub: '#5A5E72', muted: '#9699B0', accent: '#6366F1',
}

// ── Small popover helper ────────────────────────────────────────────────────
function usePop() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return { open, setOpen, ref }
}

function TypePicker({ value, onChange }: { value: CampaignType; onChange: (v: CampaignType) => void }) {
  const { open, setOpen, ref } = usePop()
  const color = CAMPAIGN_TYPE_COLORS[value]
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 700,
        backgroundColor: `${color}15`, color, border: `1px solid ${color}40`, cursor: 'pointer',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color }} />
        {CAMPAIGN_TYPE_LABELS[value]}
        <ChevronDown size={11} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100,
          background: '#fff', border: '1px solid #E4E7F0', borderRadius: 8,
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)', padding: 4, minWidth: 180,
        }}>
          {(Object.keys(CAMPAIGN_TYPE_LABELS) as CampaignType[]).map(t => {
            const tc = CAMPAIGN_TYPE_COLORS[t]
            return (
              <button key={t} type="button" onClick={() => { onChange(t); setOpen(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 7, width: '100%',
                padding: '7px 9px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: value === t ? `${tc}12` : 'transparent', textAlign: 'left', fontSize: 12, fontWeight: 600,
                color: value === t ? tc : C.text,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: tc }} />
                {CAMPAIGN_TYPE_LABELS[t]}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatusPicker({ value, onChange }: { value: CampaignStatus; onChange: (v: CampaignStatus) => void }) {
  const { open, setOpen, ref } = usePop()
  const color = CAMPAIGN_STATUS_COLORS[value]
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 11px', borderRadius: 7, fontSize: 12, fontWeight: 700,
        backgroundColor: `${color}15`, color, border: `1px solid ${color}40`, cursor: 'pointer',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color }} />
        {CAMPAIGN_STATUS_LABELS[value]}
        <ChevronDown size={11} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100,
          background: '#fff', border: '1px solid #E4E7F0', borderRadius: 8,
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)', padding: 4, minWidth: 150,
        }}>
          {(Object.keys(CAMPAIGN_STATUS_LABELS) as CampaignStatus[]).map(s => {
            const sc = CAMPAIGN_STATUS_COLORS[s]
            return (
              <button key={s} type="button" onClick={() => { onChange(s); setOpen(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 7, width: '100%',
                padding: '7px 9px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: value === s ? `${sc}12` : 'transparent', textAlign: 'left', fontSize: 12, fontWeight: 600,
                color: value === s ? sc : C.text,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: sc }} />
                {CAMPAIGN_STATUS_LABELS[s]}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Generic styled popover picker ─────────────────────────────────────────
type BadgeOption = { value: string; label: string; color?: string }

function BadgePicker({
  value, options, onChange, color, title, width, align = 'left',
  placeholder = '—',
}: {
  value: string
  options: BadgeOption[]
  onChange: (v: string) => void
  color: string
  title?: string
  width?: number | string
  align?: 'left' | 'right'
  placeholder?: string
}) {
  const { open, setOpen, ref } = usePop()
  const current = options.find(o => o.value === value)
  const label = current?.label ?? placeholder

  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button
        type="button"
        title={title}
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 7,
          fontSize: 11.5, fontWeight: 700,
          backgroundColor: `${color}15`, color,
          border: `1px solid ${color}40`,
          cursor: 'pointer', width: width ?? 'auto', justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
          {label}
        </span>
        <ChevronDown size={11} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)',
          [align]: 0 as unknown as number,
          zIndex: 1000,
          background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8,
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)', padding: 4, minWidth: 180,
          maxHeight: 280, overflowY: 'auto',
        } as React.CSSProperties}>
          {options.map(o => {
            const c = o.color ?? C.sub
            const sel = value === o.value
            return (
              <button
                key={o.value}
                type="button"
                onClick={e => { e.stopPropagation(); onChange(o.value); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, width: '100%',
                  padding: '7px 9px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: sel ? `${c}12` : 'transparent',
                  textAlign: 'left', fontSize: 12, fontWeight: 600,
                  color: sel ? c : C.text,
                }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.backgroundColor = '#F5F6FA' }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: c, flexShrink: 0 }} />
                {o.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Multi-select badge picker (para responsables) ─────────────────────────
function MultiBadgePicker({
  values, options, onChange, width, align = 'left', title,
}: {
  values: string[]
  options: { value: string; label: string; color?: string }[]
  onChange: (v: string[]) => void
  width?: number | string
  align?: 'left' | 'right'
  title?: string
}) {
  const { open, setOpen, ref } = usePop()
  const initials = (n: string) => n.slice(0, 2).toUpperCase()
  const selected = values.map(v => options.find(o => o.value === v)).filter(Boolean) as { value: string; label: string; color?: string }[]
  const primary = selected[0]
  const primaryColor = primary?.color ?? C.muted
  const hasAny = selected.length > 0

  const toggle = (val: string) => {
    if (values.includes(val)) onChange(values.filter(v => v !== val))
    else onChange([...values, val])
  }

  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button
        type="button"
        title={title}
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px 4px 5px', borderRadius: 7,
          fontSize: 11.5, fontWeight: 700,
          backgroundColor: hasAny ? `${primaryColor}15` : '#F5F6FA',
          color: hasAny ? primaryColor : C.muted,
          border: `1px solid ${hasAny ? `${primaryColor}40` : C.border}`,
          cursor: 'pointer', width: width ?? 'auto', justifyContent: 'space-between',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
          {hasAny ? (
            <>
              <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                {selected.slice(0, 2).map((s, i) => {
                  const c = s.color ?? C.sub
                  return (
                    <span key={s.value} style={{
                      width: 16, height: 16, borderRadius: '50%',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 7.5, fontWeight: 800, color: '#fff',
                      background: `linear-gradient(135deg,${c},${c}80)`,
                      border: '1.5px solid #fff',
                      marginLeft: i === 0 ? 0 : -5,
                      zIndex: 10 - i,
                    }}>{initials(s.label)}</span>
                  )
                })}
              </span>
              <span style={{ marginLeft: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selected.length === 1 ? primary.label : `${selected.length} personas`}
              </span>
            </>
          ) : (
            <>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: C.muted, flexShrink: 0 }} />
              Sin asignar
            </>
          )}
        </span>
        <ChevronDown size={11} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)',
          [align]: 0 as unknown as number,
          zIndex: 1000,
          background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8,
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)', padding: 4, minWidth: 200,
          maxHeight: 300, overflowY: 'auto',
        } as React.CSSProperties}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '5px 8px', fontSize: 9.5, fontWeight: 700, color: C.muted,
            textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            <span>Uno o varios</span>
            {hasAny && (
              <button type="button" onClick={e => { e.stopPropagation(); onChange([]) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: C.accent, fontWeight: 700 }}>
                Limpiar
              </button>
            )}
          </div>
          {options.map(o => {
            const c = o.color ?? C.sub
            const sel = values.includes(o.value)
            return (
              <button
                key={o.value}
                type="button"
                onClick={e => { e.stopPropagation(); toggle(o.value) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, width: '100%',
                  padding: '6px 9px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: sel ? `${c}12` : 'transparent',
                  textAlign: 'left', fontSize: 12, fontWeight: 600,
                  color: sel ? c : C.text,
                }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.backgroundColor = '#F5F6FA' }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <span style={{
                  width: 15, height: 15, borderRadius: 3, flexShrink: 0,
                  border: `1.5px solid ${sel ? c : C.border}`,
                  background: sel ? c : '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: '#fff', fontWeight: 800,
                }}>{sel ? '✓' : ''}</span>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: c, flexShrink: 0 }} />
                {o.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Inline editable task row ───────────────────────────────────────────────
function InlineTaskRow({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const updateTask = useUpdateTask()
  const patch = (fields: Partial<Task>) =>
    updateTask.mutate({ id: task.id, ...fields } as Parameters<typeof updateTask.mutate>[0])

  const statusColor = STATUS_COLORS[task.status]
  const priorityColor = PRIORITY_COLORS[task.priority] ?? C.muted
  const taskAssignees = getTaskAssignees(task)
  const etapaColor = task.etapa ? (ETAPA_COLORS[task.etapa as Etapa] ?? C.sub) : C.muted

  // Date overdue/urgency styling
  let dateColor = C.muted
  let dateBg = '#F5F6FA'
  let dateBorder = C.border
  if (task.due_date) {
    const today = new Date(); today.setHours(0,0,0,0)
    const due = new Date(task.due_date); due.setHours(0,0,0,0)
    const diff = (due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
    if (diff < 0) { dateColor = '#B91C1C'; dateBg = '#FEE2E2'; dateBorder = '#FCA5A5' }
    else if (diff <= 3) { dateColor = '#92400E'; dateBg = '#FEF3C7'; dateBorder = '#FCD34D' }
    else { dateColor = C.sub; dateBg = '#F5F6FA'; dateBorder = C.border }
  }

  const etapaOptions: BadgeOption[] = [
    { value: '', label: '— sin etapa —', color: C.muted },
    ...ETAPA_ORDER.map(et => ({
      value: et, label: ETAPA_LABELS[et as Etapa] ?? et, color: ETAPA_COLORS[et as Etapa],
    })),
  ]
  const statusOptions: BadgeOption[] = STATUS_ORDER.map(s => ({
    value: s, label: STATUS_LABELS[s], color: STATUS_COLORS[s],
  }))
  const priorityOptions: BadgeOption[] = PRIORITY_ORDER.map(p => ({
    value: p, label: PRIORITY_LABELS[p], color: PRIORITY_COLORS[p],
  }))
  const assigneeOptions = TEAM_MEMBERS.map(m => ({
    value: m, label: m, color: ASSIGNEE_COLORS[m] ?? C.accent,
  }))

  return (
    <div
      onClick={onOpen}
      style={{
        display: 'grid',
        gridTemplateColumns: '14px minmax(0,1fr) 140px 170px 110px 130px 130px',
        alignItems: 'center', gap: 8,
        padding: '8px 12px',
        borderTop: `1px solid ${C.border}`,
        cursor: 'pointer',
        background: '#fff',
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FAFBFC')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
    >
      {/* Status dot (was priority) */}
      <span
        title={STATUS_LABELS[task.status]}
        style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: statusColor, display: 'inline-block' }}
      />

      {/* Title */}
      <span style={{
        fontSize: 12.5, color: C.text, fontWeight: 500,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
      }}>
        {task.title}
      </span>

      {/* Etapa */}
      <BadgePicker
        title="Etapa"
        value={task.etapa ?? ''}
        color={etapaColor}
        options={etapaOptions}
        width="100%"
        onChange={v => patch({ etapa: (v || undefined) as Etapa | undefined })}
      />

      {/* Status */}
      <BadgePicker
        title="Status"
        value={task.status}
        color={statusColor}
        options={statusOptions}
        width="100%"
        onChange={v => patch({ status: v as TaskStatus })}
      />

      {/* Priority */}
      <BadgePicker
        title="Prioridad"
        value={task.priority}
        color={priorityColor}
        options={priorityOptions}
        width="100%"
        onChange={v => patch({ priority: v as Priority })}
      />

      {/* Due date — clicking anywhere in the field opens the picker */}
      <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
        <input
          type="date"
          value={task.due_date ? task.due_date.slice(0, 10) : ''}
          onClick={e => {
            e.stopPropagation()
            const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void }
            if (typeof el.showPicker === 'function') { try { el.showPicker() } catch { /* ignore */ } }
          }}
          onFocus={e => {
            const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void }
            if (typeof el.showPicker === 'function') { try { el.showPicker() } catch { /* ignore */ } }
          }}
          onKeyDown={e => e.stopPropagation()}
          onChange={e => { e.stopPropagation(); patch({ due_date: e.target.value || undefined }) }}
          title="Fecha de entrega"
          style={{
            width: '100%',
            fontSize: 11.5, fontWeight: 700,
            padding: '5px 8px', borderRadius: 7,
            border: `1px solid ${dateBorder}`,
            background: dateBg, color: dateColor,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Assignees (multi) */}
      <MultiBadgePicker
        title="Responsables"
        values={taskAssignees}
        options={assigneeOptions}
        width="100%"
        align="right"
        onChange={vs => patch({ assignees: vs, assignee: vs[0] ?? '' } as Partial<Task>)}
      />
    </div>
  )
}

// ── Add task inline row ────────────────────────────────────────────────────
function AddTaskRow({
  clientId, campaignId, defaultEtapa, subCampaigns, onDone, onCancel,
}: {
  clientId: string
  campaignId: string  // target campaign (a sub-campaign id if group)
  defaultEtapa?: Etapa
  subCampaigns?: { id: string; label: string; color: string }[]  // only if group
  onDone: () => void
  onCancel: () => void
}) {
  const createTask = useCreateTask()
  const [title, setTitle] = useState('')
  const [etapa, setEtapa] = useState<Etapa | ''>(defaultEtapa ?? '')
  const [subId, setSubId] = useState<string>(subCampaigns?.[0]?.id ?? campaignId)

  const etapaOptions: BadgeOption[] = [
    { value: '', label: '— sin etapa —', color: C.muted },
    ...ETAPA_ORDER.map(et => ({
      value: et, label: ETAPA_LABELS[et as Etapa] ?? et, color: ETAPA_COLORS[et as Etapa],
    })),
  ]
  const etapaColor = etapa ? ETAPA_COLORS[etapa as Etapa] : C.muted
  const subOptions: BadgeOption[] =
    (subCampaigns ?? []).map(s => ({ value: s.id, label: s.label, color: s.color }))
  const selectedSub = subCampaigns?.find(s => s.id === subId)

  const submit = () => {
    const t = title.trim()
    if (!t) return
    const area: Area = etapa ? (ETAPA_TO_AREA[etapa as Etapa] ?? 'copy') : 'copy'
    const target = subCampaigns && subCampaigns.length > 0 ? subId : campaignId
    createTask.mutate(
      {
        title: t,
        client_id: clientId,
        campaign_id: target,
        area,
        assignee: '',
        assignees: [],
        priority: 'baja',
        priority_manual_override: true,
        status: 'pendiente',
        etapa: (etapa || undefined) as Etapa | undefined,
        week: 0,
        tipo: 'nuevo',
        source: 'manual',
      } as Parameters<typeof createTask.mutate>[0],
      {
        onSuccess: () => { setTitle(''); onDone() },
        onError: (e: unknown) => alert(`No se pudo crear la task: ${(e as { message?: string })?.message ?? e}`),
      }
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: subCampaigns && subCampaigns.length > 0
        ? 'minmax(0,1fr) 160px 150px auto auto'
        : 'minmax(0,1fr) 160px auto auto',
      alignItems: 'center', gap: 8,
      padding: '9px 12px',
      background: '#F8FAFF', borderTop: `1px dashed ${C.accent}50`,
    }}>
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') submit()
          else if (e.key === 'Escape') onCancel()
        }}
        placeholder="Título de la task… (Enter para crear, Esc para cancelar)"
        style={{
          fontSize: 12.5, padding: '6px 10px', borderRadius: 7,
          border: `1px solid ${C.border}`, outline: 'none',
          background: '#fff', color: C.text, fontFamily: 'inherit',
        }}
      />
      <BadgePicker
        title="Etapa"
        value={etapa}
        color={etapaColor}
        options={etapaOptions}
        width="100%"
        onChange={v => setEtapa(v as Etapa | '')}
      />
      {subCampaigns && subCampaigns.length > 0 && (
        <BadgePicker
          title="Sub-campaña"
          value={subId}
          color={selectedSub?.color ?? C.accent}
          options={subOptions}
          width="100%"
          onChange={v => setSubId(v)}
        />
      )}
      <button
        onClick={submit}
        disabled={!title.trim() || createTask.isPending}
        style={{
          padding: '6px 12px', borderRadius: 7,
          background: C.accent, color: '#fff',
          border: 'none', cursor: title.trim() ? 'pointer' : 'not-allowed',
          fontSize: 11.5, fontWeight: 700, opacity: title.trim() ? 1 : 0.5,
        }}
      >Crear</button>
      <button
        onClick={onCancel}
        style={{
          padding: '6px 10px', borderRadius: 7,
          background: 'transparent', color: C.sub,
          border: `1px solid ${C.border}`, cursor: 'pointer',
          fontSize: 11.5, fontWeight: 600,
        }}
      >Cancelar</button>
    </div>
  )
}

export function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const navigate = useNavigate()
  const ctx = useOutletContext<{ openTaskDetail?: (t: Task) => void }>()
  const { data: campaigns = [], isLoading } = useCampaigns()
  const { data: clients = [] } = useClients()
  const { data: tasks = [] } = useTasks({ campaign_id: campaignId })
  const updateCampaign = useUpdateCampaign()
  const deleteCampaign = useDeleteCampaign()
  const ensureChildren = useEnsureGroupChildren()
  const [addingForEtapa, setAddingForEtapa] = useState<Etapa | '__no_etapa' | null>(null)

  const campaign = campaigns.find(c => c.id === campaignId)
  const client = clients.find(c => c.id === campaign?.client_id)
  const children = campaign
    ? campaigns.filter(c => c.parent_campaign_id === campaign.id).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    : []
  const parentGroup = campaign?.parent_campaign_id
    ? campaigns.find(c => c.id === campaign.parent_campaign_id)
    : undefined

  const [editObjective, setEditObjective] = useState(false)
  const [objective, setObjective] = useState('')
  useEffect(() => { setObjective(campaign?.objective ?? '') }, [campaign?.objective])

  const [launchDate, setLaunchDate] = useState('')
  useEffect(() => { setLaunchDate(campaign?.launch_date ?? '') }, [campaign?.launch_date])

  const [editNotes, setEditNotes] = useState(false)
  const [notes, setNotes] = useState('')
  useEffect(() => { setNotes(campaign?.notes ?? '') }, [campaign?.notes])

  const tasksByEtapa = useMemo(() => {
    const map: Record<string, Task[]> = {}
    ETAPA_ORDER.forEach(e => { map[e] = [] })
    map['_no_etapa'] = []
    for (const t of tasks) {
      const k = t.etapa ?? '_no_etapa'
      if (!map[k]) map[k] = []
      map[k].push(t)
    }
    return map
  }, [tasks])

  if (isLoading) return <div style={{ padding: 32, color: C.muted }}>Cargando…</div>
  if (!campaign) return <Navigate to="/campaigns" replace />

  const camColor = CAMPAIGN_TYPE_COLORS[campaign.type] ?? C.accent
  const doneCount = tasks.filter(t => t.status === 'done').length
  const pct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0

  const saveField = (patch: Partial<{ type: CampaignType; status: CampaignStatus; objective: string; launch_date: string; name: string; notes: string }>) => {
    updateCampaign.mutate({ id: campaign.id, ...patch })
  }

  const isArchived = campaign.status === 'desactivada'

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', padding: '24px 28px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Back */}
        <button onClick={() => navigate(-1)} style={{
          alignSelf: 'flex-start',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: C.sub, fontSize: 12, fontWeight: 600,
        }}>
          <ArrowLeft size={14} /> Volver
        </button>

        {/* Header */}
        <div style={{
          backgroundColor: C.card, borderRadius: 14, padding: 20,
          border: `1px solid ${C.border}`, borderLeft: `4px solid ${camColor}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                {client?.name ?? 'Sin cliente'} · Campaña
              </div>
              <input
                value={campaign.name}
                onChange={e => saveField({ name: e.target.value })}
                style={{
                  fontSize: 22, fontWeight: 700, color: C.text,
                  border: '1px solid transparent', background: 'transparent',
                  outline: 'none', padding: '2px 4px', borderRadius: 5,
                  width: '100%',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = C.border }}
                onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <TypePicker value={campaign.type} onChange={t => saveField({ type: t })} />
                <StatusPicker value={campaign.status} onChange={s => saveField({ status: s })} />
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, backgroundColor: '#F5F6FA', border: `1px solid ${C.border}`, fontSize: 12, color: C.sub, fontWeight: 600 }}>
                  <Calendar size={12} />
                  <input type="date" value={launchDate || ''} onChange={e => { setLaunchDate(e.target.value); saveField({ launch_date: e.target.value }) }}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: launchDate ? C.text : C.muted, fontWeight: 600 }} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => navigate(`/kanban?campaign=${campaign.id}`)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 8,
                  background: '#EEF2FF', color: C.accent,
                  border: `1px solid ${C.accent}30`, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                }}>
                <LayoutGrid size={13} /> Ver en Kanban
              </button>
              <button
                onClick={() => saveField({ status: isArchived ? 'activa' : 'desactivada' })}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 8,
                  background: isArchived ? '#D1FAE5' : '#FEF3C7',
                  color: isArchived ? '#065F46' : '#92400E',
                  border: `1px solid ${isArchived ? '#10B98130' : '#F59E0B30'}`,
                  cursor: 'pointer', fontSize: 12, fontWeight: 700,
                }}>
                {isArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                {isArchived ? 'Desarchivar' : 'Archivar'}
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`¿Eliminar campaña "${campaign.name}"? Las tareas asociadas quedarán sin campaña.`)) {
                    deleteCampaign.mutate(campaign.id, {
                      onSuccess: () => navigate(`/clients/${campaign.client_id}`),
                    })
                  }
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 10px', borderRadius: 8,
                  background: 'transparent', color: '#EF4444',
                  border: `1px solid #EF444430`, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Progress */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              <span>Progreso</span>
              <span>{doneCount}/{tasks.length} ({pct}%)</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, backgroundColor: '#F5F6FA', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, backgroundColor: camColor, transition: 'width 0.2s' }} />
            </div>
          </div>
        </div>

        {/* Parent breadcrumb (if this is a child Main/Iteración/Refresh) */}
        {parentGroup && (
          <div style={{
            backgroundColor: C.card, borderRadius: 12, padding: '10px 14px',
            border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12,
          }}>
            <span style={{ color: C.muted, fontWeight: 600 }}>Parte de:</span>
            <button
              onClick={() => navigate(`/campaigns/${parentGroup.id}`)}
              style={{
                background: '#EEF2FF', border: `1px solid ${C.accent}30`,
                color: C.accent, padding: '3px 10px', borderRadius: 6,
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}
            >
              {parentGroup.name}
            </button>
          </div>
        )}

        {/* Group children nav (Main / Iteración / Refresh) */}
        {children.length > 0 && (
          <div style={{
            backgroundColor: C.card, borderRadius: 14, padding: 14,
            border: `1px solid ${C.border}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Sub-campañas
            </div>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
              {children.map(kid => {
                const kc = CAMPAIGN_TYPE_COLORS[kid.type] ?? C.accent
                return (
                  <button
                    key={kid.id}
                    onClick={() => navigate(`/campaigns/${kid.id}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 12px', borderRadius: 10,
                      border: `1px solid ${C.border}`, background: '#FAFBFD',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ width: 4, height: 22, borderRadius: 2, background: kc }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{kid.name}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                        {CAMPAIGN_TYPE_LABELS[kid.type]}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Objective */}
        <div style={{ backgroundColor: C.card, borderRadius: 14, padding: 18, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <TargetIcon size={13} color={C.accent} />
            <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
              Objetivo
            </p>
          </div>
          {editObjective ? (
            <textarea
              autoFocus
              value={objective}
              onChange={e => setObjective(e.target.value)}
              onBlur={() => { setEditObjective(false); if (objective !== (campaign.objective ?? '')) saveField({ objective }) }}
              rows={3}
              style={{
                width: '100%', padding: '9px 11px', borderRadius: 8,
                border: `1px solid ${C.accent}50`, outline: 'none',
                fontSize: 13, color: C.text, resize: 'vertical', fontFamily: 'inherit',
              }}
              placeholder="¿Qué queremos lograr con esta campaña?"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditObjective(true)}
              style={{
                width: '100%', textAlign: 'left', background: 'transparent',
                border: '1px solid transparent', borderRadius: 8, padding: '9px 11px',
                fontSize: 13, color: campaign.objective ? C.text : C.muted, cursor: 'text',
                fontStyle: campaign.objective ? 'normal' : 'italic',
                minHeight: 42,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.border }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent' }}
            >
              {campaign.objective || 'Click para agregar objetivo…'}
            </button>
          )}
        </div>

        {/* Notas */}
        <div style={{ backgroundColor: '#FFFBEB', borderRadius: 14, padding: 18, border: '1px solid #FDE68A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <StickyNote size={13} color="#B45309" />
            <p style={{ fontSize: 10, fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
              Notas
            </p>
          </div>
          {editNotes ? (
            <textarea
              autoFocus
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={() => { setEditNotes(false); if (notes !== (campaign.notes ?? '')) saveField({ notes }) }}
              rows={6}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: '1px solid #F59E0B70', outline: 'none',
                fontSize: 13, color: C.text, resize: 'vertical', fontFamily: 'inherit',
                backgroundColor: '#FFFEF7', lineHeight: 1.55,
              }}
              placeholder="Notas de la campaña: decisiones, contexto, links, pendientes, lo que sea…"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditNotes(true)}
              style={{
                width: '100%', textAlign: 'left', background: 'transparent',
                border: '1px solid transparent', borderRadius: 8, padding: '10px 12px',
                fontSize: 13, color: campaign.notes ? C.text : '#B45309',
                fontStyle: campaign.notes ? 'normal' : 'italic',
                cursor: 'text', minHeight: 80, whiteSpace: 'pre-wrap', lineHeight: 1.55,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#FDE68A' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent' }}
            >
              {campaign.notes || 'Click para agregar notas…'}
            </button>
          )}
        </div>

        {/* Tasks by etapa */}
        {(() => {
          const isGroup = campaign.kind === 'group'
          const subOptions = isGroup
            ? children.map(kid => ({
                id: kid.id,
                label: kid.name,
                color: CAMPAIGN_TYPE_COLORS[kid.type] ?? C.accent,
              }))
            : undefined
          const canAddHere = !isGroup || (subOptions?.length ?? 0) > 0
          const addEtapaProp = (et: Etapa | '__no_etapa' | null): Etapa | undefined =>
            et && et !== '__no_etapa' ? et : undefined
          return (
            <div style={{ backgroundColor: C.card, borderRadius: 14, padding: 18, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                  Tareas por etapa · {tasks.length}
                </p>
                {isGroup && subOptions && subOptions.length === 0 ? (
                  <button
                    onClick={() => ensureChildren.mutate(campaign.id)}
                    disabled={ensureChildren.isPending}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 11px', borderRadius: 7,
                      background: C.accent, color: '#fff', border: 'none',
                      cursor: 'pointer', fontSize: 11, fontWeight: 700,
                    }}
                  >
                    <Plus size={12} /> Crear Main / Iteración / Refresh
                  </button>
                ) : canAddHere ? (
                  <button
                    onClick={() => setAddingForEtapa(addingForEtapa === '__no_etapa' ? null : '__no_etapa')}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 11px', borderRadius: 7,
                      background: addingForEtapa === '__no_etapa' ? '#F5F6FA' : C.accent,
                      color: addingForEtapa === '__no_etapa' ? C.sub : '#fff',
                      border: addingForEtapa === '__no_etapa' ? `1px solid ${C.border}` : 'none',
                      cursor: 'pointer', fontSize: 11, fontWeight: 700,
                    }}
                  >
                    <Plus size={12} /> {addingForEtapa === '__no_etapa' ? 'Cancelar' : 'Nueva task'}
                  </button>
                ) : null}
              </div>

              {isGroup && (
                <div style={{
                  background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E',
                  padding: '8px 12px', borderRadius: 8, fontSize: 11.5, marginBottom: 10,
                }}>
                  Esta campaña es un contenedor. Las tasks se asignan a una sub-campaña: Main, Iteración o Refresh.
                </div>
              )}

              {addingForEtapa === '__no_etapa' && canAddHere && (
                <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 10, position: 'relative' }}>
                  <AddTaskRow
                    clientId={campaign.client_id}
                    campaignId={campaign.id}
                    subCampaigns={subOptions}
                    onDone={() => setAddingForEtapa(null)}
                    onCancel={() => setAddingForEtapa(null)}
                  />
                </div>
              )}

              {tasks.length === 0 && addingForEtapa !== '__no_etapa' ? (
                <div style={{ padding: 24, textAlign: 'center', color: C.muted, fontSize: 12 }}>
                  No hay tareas asociadas a esta campaña.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {ETAPA_ORDER.map(etapa => {
                    const rows = tasksByEtapa[etapa] ?? []
                    const isAddingHere = addingForEtapa === etapa
                    if (rows.length === 0 && !isAddingHere) {
                      return null
                    }
                    const ec = ETAPA_COLORS[etapa]
                    return (
                      <div key={etapa} style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: isAddingHere ? 'visible' : 'hidden', position: 'relative' }}>
                        <div style={{
                          padding: '7px 12px',
                          backgroundColor: `${ec}12`, borderBottom: `1px solid ${ec}25`,
                          display: 'flex', alignItems: 'center', gap: 7,
                        }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: ec }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: ec }}>{ETAPA_LABELS[etapa as Etapa]}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginLeft: 8 }}>{rows.length}</span>
                          {canAddHere && (
                            <button
                              onClick={() => setAddingForEtapa(isAddingHere ? null : etapa)}
                              title="Agregar task a esta etapa"
                              style={{
                                marginLeft: 'auto',
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 8px', borderRadius: 6,
                                background: isAddingHere ? '#F5F6FA' : '#fff',
                                color: ec, border: `1px solid ${ec}40`,
                                cursor: 'pointer', fontSize: 10.5, fontWeight: 700,
                              }}
                            >
                              <Plus size={11} /> {isAddingHere ? 'Cancelar' : 'Task'}
                            </button>
                          )}
                        </div>
                        {isAddingHere && (
                          <AddTaskRow
                            clientId={campaign.client_id}
                            campaignId={campaign.id}
                            defaultEtapa={addEtapaProp(addingForEtapa)}
                            subCampaigns={subOptions}
                            onDone={() => setAddingForEtapa(null)}
                            onCancel={() => setAddingForEtapa(null)}
                          />
                        )}
                        {rows.map(t => (
                          <InlineTaskRow key={t.id} task={t} onOpen={() => ctx?.openTaskDetail?.(t)} />
                        ))}
                      </div>
                    )
                  })}
                  {/* Tasks with no etapa */}
                  {(tasksByEtapa['_no_etapa']?.length ?? 0) > 0 && (
                    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ padding: '7px 12px', backgroundColor: '#F5F6FA', borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.muted }}>
                        Sin etapa · {tasksByEtapa['_no_etapa'].length}
                      </div>
                      {tasksByEtapa['_no_etapa'].map((t, i, arr) => (
                        <div key={t.id} onClick={() => ctx?.openTaskDetail?.(t)} style={{
                          padding: '8px 12px', fontSize: 12, cursor: 'pointer',
                          borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none', color: C.sub,
                        }}>
                          {t.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
