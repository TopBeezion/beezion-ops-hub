import { useState, useRef, useEffect } from 'react'
import { Plus, ChevronDown, ChevronRight, Flame, Zap, RefreshCw, TrendingUp, Circle, Check, UserPlus, Pencil } from 'lucide-react'
import { useClients } from '../hooks/useClients'
import { useCampaigns, useUpdateCampaign, useUpdateCampaignStatus, useCreateCampaign } from '../hooks/useCampaigns'
import { useTasks } from '../hooks/useTasks'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useApplyCampaignTemplate, useCampaignTemplates } from '../hooks/useCampaignTemplates'
import { CampaignProgressBar } from '../components/widgets/CampaignProgressBar'
import { isAdminPlus } from '../lib/constants'
import type { Task, Campaign, CampaignType, CampaignStatus } from '../types'
import {
  CAMPAIGN_TYPE_LABELS, CAMPAIGN_TYPE_COLORS,
  CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS,
  ETAPA_LABELS, ETAPA_COLORS, ETAPA_ORDER,
  ASSIGNEE_COLORS,
} from '../lib/constants'

// ─── Team members ─────────────────────────────────────────────────────────────
const TEAM = [
  { name: 'Alejandro', color: '#8B5CF6', role: 'CEO' },
  { name: 'Alec',      color: '#F59E0B', role: 'Head of Paid' },
  { name: 'Jose',      color: '#3B82F6', role: 'Trafficker' },
  { name: 'Luisa',     color: '#EF4444', role: 'Copywriter' },
  { name: 'Paula',     color: '#EC4899', role: 'Project Manager' },
  { name: 'David',     color: '#06B6D4', role: 'Editor' },
  { name: 'Johan',     color: '#10B981', role: 'Editor' },
  { name: 'Felipe',    color: '#F97316', role: 'Editor' },
]

const CAMPAIGN_ICONS: Record<CampaignType, React.ReactNode> = {
  nueva_campana: <Zap size={13} />,
  iteracion: <TrendingUp size={13} />,
  refresh: <RefreshCw size={13} />,
  bombero: <Flame size={13} />,
}

const ALL_STATUSES: CampaignStatus[] = ['activa', 'pausada', 'desactivada']

// ─── usePopover hook ──────────────────────────────────────────────────────────
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

// ─── Filter Dropdown (for campaigns page) ────────────────────────────────────
function CampFilterDrop({ label, value, onChange, options, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; color?: string }[]
  placeholder?: string
}) {
  const { open, setOpen, ref } = usePopover()
  const sel = options.find(o => o.value === value)
  const isActive = !!value

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, padding: '0 10px',
        borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
        backgroundColor: isActive ? `${sel?.color ?? '#6366F1'}14` : '#F6F7FB',
        outline: isActive ? `1.5px solid ${sel?.color ?? '#6366F1'}50` : '1px solid #E6E9EF',
        color: isActive ? (sel?.color ?? '#6366F1') : '#6B7280',
        transition: 'all 0.12s',
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.05em', color: isActive ? (sel?.color ?? '#6366F1') : '#9CA3AF' }}>{label}</span>
        {sel && <><span style={{ width: 1, height: 10, backgroundColor: '#E6E9EF' }} /><span style={{ fontWeight: 700 }}>{sel.label}</span></>}
        <ChevronDown size={10} style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: '0.15s' }} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 400,
          backgroundColor: '#fff', border: '1px solid #E6E9EF',
          borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
          padding: 4, minWidth: 180,
        }}>
          <button onClick={() => { onChange(''); setOpen(false) }} style={{
            display: 'flex', alignItems: 'center', width: '100%', padding: '7px 10px',
            borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12,
            backgroundColor: !value ? '#F5F6FA' : 'transparent', color: '#6B7280',
          }}
          onMouseEnter={e => { if (value) (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F6FA' }}
          onMouseLeave={e => { if (value) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}>
            {placeholder ?? 'Todos'}
          </button>
          {options.map(o => {
            const isSel = value === o.value
            const oc = o.color ?? '#6366F1'
            return (
              <button key={o.value} onClick={() => { onChange(isSel ? '' : o.value); setOpen(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                backgroundColor: isSel ? `${oc}12` : 'transparent', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.backgroundColor = '#F5F6FA' }}
              onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}>
                {o.color && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: oc, flexShrink: 0 }} />}
                <span style={{ flex: 1, fontSize: 12, fontWeight: isSel ? 700 : 500, color: isSel ? oc : '#374151' }}>{o.label}</span>
                {isSel && <span style={{ fontSize: 11, color: oc }}>✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Etapa progress pills ─────────────────────────────────────────────────────
function EtapaProgress({ campaignId, tasks }: { campaignId: string; tasks: Task[] }) {
  const campaignTasks = tasks.filter(t => t.campaign_id === campaignId)
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {ETAPA_ORDER.map(etapa => {
        const et = campaignTasks.filter(t => t.etapa === etapa)
        const done = et.filter(t => t.status === 'done').length
        const total = et.length
        const hasWork = total > 0
        const allDone = hasWork && done === total
        return (
          <div key={etapa} title={`${ETAPA_LABELS[etapa]}${hasWork ? ` — ${done}/${total} aprobadas` : ' — sin tareas'}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
              backgroundColor: hasWork ? allDone ? `${ETAPA_COLORS[etapa]}20` : `${ETAPA_COLORS[etapa]}15` : '#F3F4F6',
              color: hasWork ? ETAPA_COLORS[etapa] : '#D1D5DB',
              border: `1px solid ${hasWork ? ETAPA_COLORS[etapa] + '40' : '#E5E7EB'}`,
              opacity: hasWork ? 1 : 0.5,
            }}
          >
            {allDone && <span style={{ fontSize: 10 }}>✓</span>}
            {ETAPA_LABELS[etapa].split(' ')[0]}
            {hasWork && <span style={{ opacity: 0.7 }}>{done}/{total}</span>}
          </div>
        )
      })}
    </div>
  )
}

// ─── Status Dropdown ──────────────────────────────────────────────────────────
function StatusDropdown({ campaign, onUpdate }: {
  campaign: Campaign
  onUpdate: (id: string, status: CampaignStatus) => void
}) {
  const { open, setOpen, ref } = usePopover()
  const color = CAMPAIGN_STATUS_COLORS[campaign.status]

  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
          backgroundColor: `${color}18`, color,
          border: `1.5px solid ${color}40`,
          cursor: 'pointer', transition: 'all 0.12s',
        }}
      >
        <Circle size={6} fill={color} strokeWidth={0} />
        {CAMPAIGN_STATUS_LABELS[campaign.status]}
        <ChevronDown size={10} style={{ opacity: 0.7 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 300,
          backgroundColor: '#fff', border: '1px solid #E4E7F0',
          borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.13)',
          padding: 5, minWidth: 160,
        }}>
          {ALL_STATUSES.map(s => {
            const sc = CAMPAIGN_STATUS_COLORS[s]
            const isActive = campaign.status === s
            return (
              <button key={s}
                onClick={() => { onUpdate(campaign.id, s); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  backgroundColor: isActive ? `${sc}15` : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = `${sc}08` }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
              >
                <Circle size={8} fill={sc} color={sc} strokeWidth={0} />
                <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? sc : '#374151', flex: 1, textAlign: 'left' }}>
                  {CAMPAIGN_STATUS_LABELS[s]}
                </span>
                {isActive && <Check size={12} color={sc} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Assignee Picker ──────────────────────────────────────────────────────────
function AssigneePicker({ campaign, onUpdate }: {
  campaign: Campaign
  onUpdate: (id: string, assignees: string[]) => void
}) {
  const { open, setOpen, ref } = usePopover()
  const assignees: string[] = (campaign as Campaign & { assignees?: string[] }).assignees ?? []

  const toggle = (name: string) => {
    const next = assignees.includes(name)
      ? assignees.filter(a => a !== name)
      : [...assignees, name]
    onUpdate(campaign.id, next)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          cursor: 'pointer', background: 'none', border: 'none', padding: 0,
        }}
        title="Gestionar responsables"
      >
        {/* Avatars stack */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {assignees.length === 0 ? (
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              border: '1.5px dashed #D1D5DB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#9CA3AF',
            }}>
              <UserPlus size={11} />
            </div>
          ) : assignees.slice(0, 4).map((name, i) => {
            const color = ASSIGNEE_COLORS[name] || '#9CA3AF'
            return (
              <div key={name} title={name} style={{
                width: 26, height: 26, borderRadius: '50%',
                backgroundColor: color, color: '#fff',
                fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginLeft: i > 0 ? -7 : 0,
                border: '2px solid #fff',
                zIndex: assignees.length - i,
                position: 'relative',
              }}>
                {name.slice(0, 2).toUpperCase()}
              </div>
            )
          })}
          {assignees.length > 4 && (
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              backgroundColor: '#E5E7EB', color: '#6B7280',
              fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: -7, border: '2px solid #fff', position: 'relative',
            }}>
              +{assignees.length - 4}
            </div>
          )}
          <ChevronDown size={10} color="#9CA3AF" style={{ marginLeft: 3 }} />
        </div>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 300,
          backgroundColor: '#fff', border: '1px solid #E4E7F0',
          borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.13)',
          padding: 8, width: 230,
        }}>
          <p style={{ fontSize: 9, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.09em', padding: '2px 6px 8px', margin: 0 }}>
            RESPONSABLES
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {TEAM.map(({ name, color, role }) => {
              const selected = assignees.includes(name)
              return (
                <button key={name} onClick={() => toggle(name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '7px 8px',
                    borderRadius: 8, border: selected ? `1.5px solid ${color}40` : '1.5px solid transparent',
                    cursor: 'pointer', backgroundColor: selected ? `${color}12` : 'transparent',
                    transition: 'all 0.1s', textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB' }}
                  onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: selected ? color : `${color}25`,
                    color: selected ? '#fff' : color,
                    fontSize: 9, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}>
                    {name.slice(0, 2).toUpperCase()}
                    {selected && (
                      <div style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 11, height: 11, borderRadius: '50%',
                        backgroundColor: color, border: '1.5px solid #fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={6} color="#fff" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: selected ? 700 : 600, color: selected ? color : '#374151', margin: 0 }}>{name}</p>
                    <p style={{ fontSize: 9, color: '#9CA3AF', margin: 0 }}>{role}</p>
                  </div>
                </button>
              )
            })}
          </div>
          {assignees.length > 0 && (
            <button onClick={() => onUpdate(campaign.id, [])}
              style={{ marginTop: 8, width: '100%', padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, color: '#EF4444', backgroundColor: '#FEF2F2', fontWeight: 600 }}
            >
              Quitar todos
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Campaign Card ────────────────────────────────────────────────────────────
function CampaignCard({
  campaign, tasks, onOpenTask, onStatusUpdate, onAssigneesUpdate, onNameUpdate,
  onApplyTemplate, onToggleRevisionFinal, canRevisionFinal,
}: {
  campaign: Campaign
  tasks: Task[]
  onOpenTask?: (t: Task) => void
  onStatusUpdate: (id: string, status: CampaignStatus) => void
  onAssigneesUpdate: (id: string, assignees: string[]) => void
  onNameUpdate: (id: string, name: string) => void
  onApplyTemplate?: (id: string) => void
  onToggleRevisionFinal?: (id: string, done: boolean) => void
  canRevisionFinal?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(campaign.name)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editingName) nameInputRef.current?.focus() }, [editingName])

  const commitName = () => {
    const trimmed = nameVal.trim()
    if (trimmed && trimmed !== campaign.name) onNameUpdate(campaign.id, trimmed)
    else setNameVal(campaign.name)
    setEditingName(false)
  }
  const campaignTasks = tasks.filter(t => t.campaign_id === campaign.id)
  const completedCount = campaignTasks.filter(t => t.status === 'done').length

  return (
    <div style={{
      backgroundColor: '#FFFFFF', border: '1px solid #E6E9EF',
      borderRadius: 10, transition: 'box-shadow 0.2s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Card header */}
      <div
        style={{ padding: '13px 16px', borderLeft: `3px solid ${CAMPAIGN_TYPE_COLORS[campaign.type]}`, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: expand + name + type badge */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span style={{ color: '#9CA3AF', flexShrink: 0, fontSize: 14 }}>
              {expanded ? '▾' : '▸'}
            </span>
            {editingName ? (
              <input
                ref={nameInputRef}
                value={nameVal}
                onChange={e => setNameVal(e.target.value)}
                onBlur={commitName}
                onKeyDown={e => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setNameVal(campaign.name); setEditingName(false) } }}
                onClick={e => e.stopPropagation()}
                style={{
                  fontSize: 13, fontWeight: 600, color: '#1F2128',
                  border: '1.5px solid #6366F1', borderRadius: 6, outline: 'none',
                  padding: '2px 8px', backgroundColor: '#FAFBFF', flex: 1, minWidth: 0,
                }}
              />
            ) : (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2128', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {campaign.name}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); setEditingName(true) }}
                  title="Editar nombre"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C4C9D4', padding: '2px 3px', borderRadius: 4, display: 'flex', flexShrink: 0, transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#6366F1')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#C4C9D4')}
                >
                  <Pencil size={11} />
                </button>
              </div>
            )}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
              backgroundColor: `${CAMPAIGN_TYPE_COLORS[campaign.type]}15`,
              color: CAMPAIGN_TYPE_COLORS[campaign.type],
              border: `1px solid ${CAMPAIGN_TYPE_COLORS[campaign.type]}30`,
              flexShrink: 0,
            }}>
              {CAMPAIGN_ICONS[campaign.type]}
              {CAMPAIGN_TYPE_LABELS[campaign.type]}
            </span>
          </div>

          {/* Right: task count + assignees + status */}
          <div className="flex items-center gap-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
            {campaignTasks.length > 0 && (
              <span style={{ fontSize: 11, color: '#6B7280' }}>
                {completedCount}/{campaignTasks.length} tasks
              </span>
            )}

            {/* Assignee picker */}
            <AssigneePicker campaign={campaign} onUpdate={onAssigneesUpdate} />

            {/* Status dropdown */}
            <StatusDropdown campaign={campaign} onUpdate={onStatusUpdate} />
          </div>
        </div>

        {/* Etapa pills */}
        {campaignTasks.length > 0 && (
          <div style={{ marginTop: 10, marginLeft: 22 }}>
            <EtapaProgress campaignId={campaign.id} tasks={tasks} />
          </div>
        )}
        {campaign.objective && (
          <p style={{ marginTop: 6, marginLeft: 22, fontSize: 12, color: '#6B7280' }}>
            {campaign.objective}
          </p>
        )}
        {/* Campaign progress bar */}
        <div style={{ marginTop: 8, marginLeft: 22, marginRight: 4 }} onClick={e => e.stopPropagation()}>
          <CampaignProgressBar campaignId={campaign.id} compact />
        </div>
      </div>

      {/* Expanded task list */}
      {expanded && (
        <div style={{ borderTop: '1px solid #F3F4F6', backgroundColor: '#FAFBFC' }}>
          {campaignTasks.length === 0 ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              No hay tareas en esta campaña todavía
            </div>
          ) : (
            ETAPA_ORDER.map(etapa => {
              const etapaTasks = campaignTasks.filter(t => t.etapa === etapa)
              if (etapaTasks.length === 0) return null
              return (
                <div key={etapa} style={{ borderBottom: '1px solid #F0F1F5' }}>
                  <div style={{ padding: '8px 16px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: ETAPA_COLORS[etapa], flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: ETAPA_COLORS[etapa], textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {ETAPA_LABELS[etapa]}
                    </span>
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>({etapaTasks.length})</span>
                  </div>
                  {etapaTasks.map(task => (
                    <div key={task.id} onClick={() => onOpenTask?.(task)}
                      style={{ padding: '8px 16px 8px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F0F3FF')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div className="flex items-center gap-2">
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                          backgroundColor: task.status === 'done' ? '#00C875' : task.status === 'en_proceso' ? '#579BFC' : task.status === 'aprobacion_interna' ? '#FDAB3D' : '#C4C4C4',
                        }} />
                        <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{task.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.due_date && (
                          <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                            {new Date(task.due_date).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                        {task.assignee && (
                          <div title={task.assignee} style={{
                            width: 20, height: 20, borderRadius: '50%',
                            backgroundColor: ASSIGNEE_COLORS[task.assignee] || '#9CA3AF',
                            color: '#fff', fontSize: 9, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {task.assignee.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })
          )}
          {/* Action bar: template + revisión final (admin+) */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #F0F1F5', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {onApplyTemplate && (
              <button
                onClick={e => { e.stopPropagation(); onApplyTemplate(campaign.id) }}
                style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 6, border: '1px solid #E0E7FF', backgroundColor: '#EEF2FF', color: '#6366F1', cursor: 'pointer' }}
              >
                ⚡ Aplicar template
              </button>
            )}
            {canRevisionFinal && onToggleRevisionFinal && (
              <button
                onClick={e => { e.stopPropagation(); onToggleRevisionFinal(campaign.id, !campaign.revision_final_done) }}
                style={{
                  fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 6,
                  border: `1px solid ${campaign.revision_final_done ? '#10B981' : '#E5E7EB'}`,
                  backgroundColor: campaign.revision_final_done ? '#ECFDF5' : '#fff',
                  color: campaign.revision_final_done ? '#047857' : '#6B7280',
                  cursor: 'pointer',
                }}
              >
                {campaign.revision_final_done ? '✓ Revisión final hecha' : 'Marcar revisión final'}
              </button>
            )}
            {campaign.revision_final_done && campaign.revision_final_by && (
              <span style={{ fontSize: 10, color: '#9CA3AF' }}>
                por {campaign.revision_final_by}
                {campaign.revision_final_at && ` · ${new Date(campaign.revision_final_at).toLocaleDateString('es')}`}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── New Campaign Modal ───────────────────────────────────────────────────────
function NewCampaignModal({ clientId, clientName, onClose, onCreate }: {
  clientId: string; clientName: string
  onClose: () => void
  onCreate: (data: { name: string; type: CampaignType; objective: string }) => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<CampaignType>('nueva_campana')
  const [objective, setObjective] = useState('')

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1F2128', marginBottom: 4 }}>Nueva Campaña</h3>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Cliente: <strong>{clientName}</strong></p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Nombre *</label>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Lead Magnet CFO"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E6E9EF', fontSize: 13, color: '#1F2128', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => (e.target.style.borderColor = '#6366F1')}
              onBlur={e => (e.target.style.borderColor = '#E6E9EF')} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Tipo</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([
                { value: 'nueva_campana' as CampaignType, label: 'Nueva Campaña', color: '#6366F1' },
                { value: 'iteracion' as CampaignType,     label: 'Iteración',     color: '#3B82F6' },
                { value: 'refresh' as CampaignType,       label: 'Refresh',       color: '#F59E0B' },
                { value: 'bombero' as CampaignType,       label: '🔥 Bombero',    color: '#EF4444' },
              ]).map(({ value, label, color }) => {
                const active = type === value
                return (
                  <button key={value} type="button" onClick={() => setType(value)} style={{
                    padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                    backgroundColor: active ? color : `${color}12`,
                    color: active ? '#fff' : color,
                    boxShadow: active ? `0 2px 8px ${color}40` : `inset 0 0 0 1.5px ${color}35`,
                  }}>{label}</button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Objetivo / Brief</label>
            <textarea value={objective} onChange={e => setObjective(e.target.value)} placeholder="¿Qué problema resuelve esta campaña?" rows={3}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #E6E9EF', fontSize: 13, color: '#1F2128', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              onFocus={e => (e.target.style.borderColor = '#6366F1')}
              onBlur={e => (e.target.style.borderColor = '#E6E9EF')} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3" style={{ marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#6B7280', backgroundColor: '#F3F4F6', border: 'none', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button disabled={!name.trim()} onClick={() => { if (name.trim()) onCreate({ name: name.trim(), type, objective }) }}
            style={{ padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', backgroundColor: name.trim() ? '#6366F1' : '#C7D2FE', border: 'none', cursor: name.trim() ? 'pointer' : 'not-allowed' }}>
            Crear Campaña
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function CampaignsPage() {
  const { data: clients = [] } = useClients()
  const { data: campaigns = [], isLoading } = useCampaigns()
  const { data: tasks = [] } = useTasks()
  const updateStatus = useUpdateCampaignStatus()
  const updateCampaign = useUpdateCampaign()
  const createCampaign = useCreateCampaign()
  const ctx = useOutletContext<{ openTaskDetail?: (t: Task) => void }>()
  const { user } = useAuth()
  const canRevisionFinal = isAdminPlus(user)
  const applyTemplate = useApplyCampaignTemplate()

  const [activeClient, setActiveClient] = useState<string | 'all'>('all')
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [newCampaignFor, setNewCampaignFor] = useState<{ id: string; name: string } | null>(null)
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set())

  const handleStatusUpdate = (id: string, status: CampaignStatus) => {
    updateStatus.mutate({ id, status })
  }

  const handleAssigneesUpdate = (id: string, assignees: string[]) => {
    updateCampaign.mutate({ id, assignees } as Parameters<typeof updateCampaign.mutate>[0])
  }

  const handleNameUpdate = (id: string, name: string) => {
    updateCampaign.mutate({ id, name } as Parameters<typeof updateCampaign.mutate>[0])
  }

  const handleApplyTemplate = (id: string) => {
    if (!confirm('¿Aplicar template a esta campaña? Se crearán las tareas faltantes.')) return
    applyTemplate.mutate({ campaignId: id })
  }

  const handleToggleRevisionFinal = (id: string, done: boolean) => {
    updateCampaign.mutate({
      id,
      revision_final_done: done,
      revision_final_by: done ? (user?.name ?? user?.email ?? null) : null,
      revision_final_at: done ? new Date().toISOString() : null,
    } as Parameters<typeof updateCampaign.mutate>[0])
  }

  const handleCreateCampaign = (clientId: string, data: { name: string; type: CampaignType; objective: string }) => {
    createCampaign.mutate({ name: data.name, client_id: clientId, type: data.type, status: 'activa', objective: data.objective })
    setNewCampaignFor(null)
  }

  const toggleClient = (id: string) => {
    setCollapsedClients(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const visibleCampaigns = campaigns.filter(c => {
    if (activeClient !== 'all' && c.client_id !== activeClient) return false
    if (filterType && c.type !== filterType) return false
    if (filterStatus && c.status !== filterStatus) return false
    return true
  })

  const clientsWithCampaigns = clients.filter(c => activeClient === 'all' ? true : c.id === activeClient)
  const bomberos = visibleCampaigns.filter(c => c.type === 'bombero')
  const regular = visibleCampaigns.filter(c => c.type !== 'bombero')

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E0E7FF', borderTopColor: '#6366F1', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#6B7280', fontSize: 13 }}>Cargando campañas...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#F6F7FB' }}>

      {/* Filter bar */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E6E9EF', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <CampFilterDrop
          label="Cliente"
          value={activeClient === 'all' ? '' : activeClient}
          onChange={v => setActiveClient(v || 'all')}
          options={clients.map(c => ({ value: c.id, label: c.name, color: (c as typeof clients[0] & { color?: string }).color || '#6366F1' }))}
          placeholder="Todos"
        />
        <CampFilterDrop
          label="Tipo"
          value={filterType}
          onChange={setFilterType}
          options={[
            { value: 'nueva_campana', label: 'Nueva Campaña', color: '#6366F1' },
            { value: 'iteracion',     label: 'Iteración',     color: '#8B5CF6' },
            { value: 'refresh',       label: 'Refresh',       color: '#3B82F6' },
            { value: 'bombero',       label: '🔥 Bombero',    color: '#E2445C' },
          ]}
          placeholder="Todos los tipos"
        />
        <CampFilterDrop
          label="Estado"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: 'activa',       label: 'Activa',       color: '#00C875' },
            { value: 'pausada',      label: 'Pausada',      color: '#FDAB3D' },
            { value: 'desactivada',  label: 'Desactivada',  color: '#C4C4C4' },
          ]}
          placeholder="Todos los estados"
        />
        {(filterType || filterStatus || activeClient !== 'all') && (
          <button onClick={() => { setFilterType(''); setFilterStatus(''); setActiveClient('all') }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, cursor: 'pointer', color: '#DC2626', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '0 10px', height: 32 }}>
            ✕ Limpiar
          </button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#00C875' }}>{campaigns.filter(c => c.status === 'activa').length} activas</span>
          <span style={{ width: 1, height: 14, backgroundColor: '#E6E9EF' }} />
          <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{campaigns.length} campañas</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

        {/* Bomberos */}
        {bomberos.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99, backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                <Flame size={14} color="#EF4444" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>BOMBEROS — Incendios Activos</span>
              </div>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>({bomberos.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bomberos.map(c => (
                <CampaignCard key={c.id} campaign={c} tasks={tasks}
                  onOpenTask={ctx?.openTaskDetail}
                  onStatusUpdate={handleStatusUpdate}
                  onAssigneesUpdate={handleAssigneesUpdate}
                  onNameUpdate={handleNameUpdate}
                  onApplyTemplate={handleApplyTemplate}
                  onToggleRevisionFinal={handleToggleRevisionFinal}
                  canRevisionFinal={canRevisionFinal}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular campaigns by client */}
        {clientsWithCampaigns.map(client => {
          const clientCampaigns = regular.filter(c => c.client_id === client.id)
          if (activeClient !== 'all' && clientCampaigns.length === 0) return null
          const isCollapsed = collapsedClients.has(client.id)

          return (
            <div key={client.id} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, cursor: 'pointer' }} onClick={() => toggleClient(client.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: client.color }} />
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1F2128' }}>{client.name}</h2>
                  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                    {clientCampaigns.length} {clientCampaigns.length === 1 ? 'campaña' : 'campañas'}
                  </span>
                  {isCollapsed ? <ChevronRight size={14} color="#9CA3AF" /> : <ChevronDown size={14} color="#9CA3AF" />}
                </div>
                <button onClick={e => { e.stopPropagation(); setNewCampaignFor({ id: client.id, name: client.name }) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#6366F1', backgroundColor: '#F0F3FF', border: '1px solid #E0E7FF', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E0E7FF')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F0F3FF')}
                >
                  <Plus size={12} /> Nueva campaña
                </button>
              </div>

              {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {clientCampaigns.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', border: '2px dashed #E5E7EB', borderRadius: 10, color: '#9CA3AF', fontSize: 13 }}>
                      No hay campañas activas para {client.name}.{' '}
                      <button onClick={() => setNewCampaignFor({ id: client.id, name: client.name })}
                        style={{ color: '#6366F1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                        Crear una
                      </button>
                    </div>
                  ) : clientCampaigns.map(c => (
                    <CampaignCard key={c.id} campaign={c} tasks={tasks}
                      onOpenTask={ctx?.openTaskDetail}
                      onStatusUpdate={handleStatusUpdate}
                      onAssigneesUpdate={handleAssigneesUpdate}
                      onNameUpdate={handleNameUpdate}
                      onApplyTemplate={handleApplyTemplate}
                      onToggleRevisionFinal={handleToggleRevisionFinal}
                      canRevisionFinal={canRevisionFinal}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {visibleCampaigns.length === 0 && !isLoading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 8 }}>No hay campañas</p>
            <p style={{ fontSize: 13 }}>Selecciona un cliente y crea la primera campaña.</p>
          </div>
        )}
      </div>

      {newCampaignFor && (
        <NewCampaignModal
          clientId={newCampaignFor.id}
          clientName={newCampaignFor.name}
          onClose={() => setNewCampaignFor(null)}
          onCreate={data => handleCreateCampaign(newCampaignFor.id, data)}
        />
      )}
    </div>
  )
}
