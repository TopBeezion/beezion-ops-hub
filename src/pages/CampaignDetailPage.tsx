import { useState, useRef, useEffect, useMemo } from 'react'
import { useParams, Navigate, useNavigate, useOutletContext } from 'react-router-dom'
import { useCampaigns, useUpdateCampaign, useDeleteCampaign } from '../hooks/useCampaigns'
import { useClients } from '../hooks/useClients'
import { useTasks, useUpdateTask } from '../hooks/useTasks'
import type { Task, CampaignType, CampaignStatus, Etapa, TaskStatus, Priority } from '../types'
import {
  CAMPAIGN_TYPE_LABELS, CAMPAIGN_TYPE_COLORS,
  CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS,
  ETAPA_LABELS, ETAPA_COLORS, ETAPA_ORDER,
  STATUS_LABELS, STATUS_COLORS, STATUS_ORDER,
  PRIORITY_LABELS, PRIORITY_COLORS, PRIORITY_ORDER,
  TEAM_MEMBERS, ASSIGNEE_COLORS,
} from '../lib/constants'
import {
  ArrowLeft, Calendar, Target as TargetIcon,
  ChevronDown, Archive, ArchiveRestore, Trash2, LayoutGrid, StickyNote,
} from 'lucide-react'
import { PriorityDot } from '../components/ui/PriorityDot'
import { AssigneeAvatar } from '../components/ui/AssigneeAvatar'

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

// ── Inline editable task row ───────────────────────────────────────────────
function InlineTaskRow({ task, onOpen }: { task: Task; onOpen: () => void }) {
  const updateTask = useUpdateTask()

  const stop = (e: React.MouseEvent | React.ChangeEvent) => e.stopPropagation()
  const patch = (fields: Partial<Task>) => updateTask.mutate({ id: task.id, ...fields } as Parameters<typeof updateTask.mutate>[0])

  const statusColor = STATUS_COLORS[task.status]
  const priorityColor = PRIORITY_COLORS[task.priority] ?? C.muted
  const assigneeColor = task.assignee ? (ASSIGNEE_COLORS[task.assignee] ?? C.accent) : C.muted

  // Date overdue/urgency styling
  let dateColor = C.muted
  let dateBg = '#F5F6FA'
  if (task.due_date) {
    const today = new Date(); today.setHours(0,0,0,0)
    const due = new Date(task.due_date); due.setHours(0,0,0,0)
    const diff = (due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
    if (diff < 0) { dateColor = '#B91C1C'; dateBg = '#FEE2E2' }
    else if (diff <= 3) { dateColor = '#92400E'; dateBg = '#FEF3C7' }
    else { dateColor = C.sub; dateBg = '#F5F6FA' }
  }

  return (
    <div
      onClick={onOpen}
      style={{
        display: 'grid',
        gridTemplateColumns: '14px minmax(0,1fr) 110px 130px 90px 110px 26px',
        alignItems: 'center', gap: 8,
        padding: '8px 12px',
        borderTop: `1px solid ${C.border}`,
        cursor: 'pointer',
        background: '#fff',
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FAFBFC')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
    >
      {/* Priority dot */}
      <span
        title={PRIORITY_LABELS[task.priority] ?? task.priority}
        style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: priorityColor, display: 'inline-block' }}
      />

      {/* Title */}
      <span style={{
        fontSize: 12.5, color: C.text, fontWeight: 500,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
      }}>
        {task.title}
      </span>

      {/* Etapa */}
      <select
        value={task.etapa ?? ''}
        onClick={stop}
        onChange={e => { stop(e); patch({ etapa: (e.target.value || undefined) as Etapa | undefined }) }}
        title="Etapa"
        style={{
          fontSize: 11, fontWeight: 600, color: C.sub,
          padding: '3px 6px', borderRadius: 6,
          border: `1px solid ${C.border}`, background: '#fff',
          cursor: 'pointer', maxWidth: 110,
        }}
      >
        <option value="">— etapa —</option>
        {ETAPA_ORDER.map(et => (
          <option key={et} value={et}>{ETAPA_LABELS[et as Etapa] ?? et}</option>
        ))}
      </select>

      {/* Status */}
      <select
        value={task.status}
        onClick={stop}
        onChange={e => { stop(e); patch({ status: e.target.value as TaskStatus }) }}
        title="Status"
        style={{
          fontSize: 11, fontWeight: 700,
          padding: '3px 8px', borderRadius: 6,
          border: `1px solid ${statusColor}40`,
          background: `${statusColor}15`,
          color: statusColor,
          cursor: 'pointer',
        }}
      >
        {STATUS_ORDER.map(s => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>

      {/* Priority */}
      <select
        value={task.priority}
        onClick={stop}
        onChange={e => { stop(e); patch({ priority: e.target.value as Priority }) }}
        title="Prioridad"
        style={{
          fontSize: 11, fontWeight: 700,
          padding: '3px 6px', borderRadius: 6,
          border: `1px solid ${priorityColor}40`,
          background: `${priorityColor}15`,
          color: priorityColor,
          cursor: 'pointer',
        }}
      >
        {PRIORITY_ORDER.map(p => (
          <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
        ))}
      </select>

      {/* Due date — clicking anywhere in the field opens the picker */}
      <input
        type="date"
        value={task.due_date ? task.due_date.slice(0, 10) : ''}
        onClick={e => {
          stop(e)
          const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void }
          if (typeof el.showPicker === 'function') {
            try { el.showPicker() } catch { /* unsupported / not user-gesture */ }
          }
        }}
        onFocus={e => {
          const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void }
          if (typeof el.showPicker === 'function') {
            try { el.showPicker() } catch { /* ignore */ }
          }
        }}
        onKeyDown={e => e.stopPropagation()}
        onChange={e => { stop(e); patch({ due_date: e.target.value || undefined }) }}
        title="Fecha de entrega"
        style={{
          fontSize: 11, fontWeight: 600,
          padding: '3px 6px', borderRadius: 6,
          border: `1px solid ${C.border}`,
          background: dateBg, color: dateColor,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      />

      {/* Assignee */}
      <select
        value={task.assignee ?? ''}
        onClick={stop}
        onChange={e => { stop(e); patch({ assignee: e.target.value || undefined } as Partial<Task>) }}
        title="Responsable"
        style={{
          fontSize: 10, fontWeight: 700,
          padding: 0, borderRadius: '50%',
          width: 26, height: 26,
          border: `1.5px solid ${assigneeColor}50`,
          background: task.assignee ? `${assigneeColor}20` : '#F5F6FA',
          color: assigneeColor,
          cursor: 'pointer', textAlign: 'center', appearance: 'none',
          textAlignLast: 'center' as 'center',
        }}
      >
        <option value="">—</option>
        {TEAM_MEMBERS.map(m => (
          <option key={m} value={m}>{m.slice(0, 2).toUpperCase()} · {m}</option>
        ))}
      </select>
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
        <div style={{ backgroundColor: C.card, borderRadius: 14, padding: 18, border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
              Tareas por etapa · {tasks.length}
            </p>
          </div>

          {tasks.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: C.muted, fontSize: 12 }}>
              No hay tareas asociadas a esta campaña.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ETAPA_ORDER.map(etapa => {
                const rows = tasksByEtapa[etapa] ?? []
                if (rows.length === 0) return null
                const ec = ETAPA_COLORS[etapa]
                return (
                  <div key={etapa} style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{
                      padding: '7px 12px',
                      backgroundColor: `${ec}12`, borderBottom: `1px solid ${ec}25`,
                      display: 'flex', alignItems: 'center', gap: 7,
                    }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: ec }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: ec }}>{ETAPA_LABELS[etapa as Etapa]}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, marginLeft: 'auto' }}>{rows.length}</span>
                    </div>
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
      </div>
    </div>
  )
}
