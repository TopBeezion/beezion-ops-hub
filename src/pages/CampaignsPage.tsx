import { useState } from 'react'
import { Plus, ChevronDown, ChevronRight, Flame, Zap, RefreshCw, TrendingUp, MoreHorizontal, Circle } from 'lucide-react'
import { useClients } from '../hooks/useClients'
import { useCampaigns, useUpdateCampaignStatus, useCreateCampaign } from '../hooks/useCampaigns'
import { useTasks } from '../hooks/useTasks'
import { useOutletContext } from 'react-router-dom'
import type { Task, Campaign, CampaignType, CampaignStatus } from '../types'
import {
  CAMPAIGN_TYPE_LABELS, CAMPAIGN_TYPE_COLORS,
  CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS,
  ETAPA_LABELS, ETAPA_COLORS, ETAPA_ORDER,
  ASSIGNEE_COLORS,
} from '../lib/constants'

const CAMPAIGN_ICONS: Record<CampaignType, React.ReactNode> = {
  nueva_campana: <Zap size={13} />,
  iteracion: <TrendingUp size={13} />,
  refresh: <RefreshCw size={13} />,
  bombero: <Flame size={13} />,
}

const STATUS_CYCLE: CampaignStatus[] = ['activa', 'pausada', 'desactivada']

function EtapaProgress({ campaignId, tasks }: { campaignId: string; tasks: Task[] }) {
  const campaignTasks = tasks.filter(t => t.campaign_id === campaignId)

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {ETAPA_ORDER.map(etapa => {
        const etapaTasks = campaignTasks.filter(t => t.etapa === etapa)
        const done = etapaTasks.filter(t => t.mini_status === 'aprobado').length
        const total = etapaTasks.length
        const hasWork = total > 0
        const allDone = hasWork && done === total

        return (
          <div
            key={etapa}
            title={`${ETAPA_LABELS[etapa]}${hasWork ? ` — ${done}/${total} aprobadas` : ' — sin tareas'}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: hasWork
                ? allDone ? `${ETAPA_COLORS[etapa]}20` : `${ETAPA_COLORS[etapa]}15`
                : '#F3F4F6',
              color: hasWork ? ETAPA_COLORS[etapa] : '#D1D5DB',
              border: `1px solid ${hasWork ? ETAPA_COLORS[etapa] + '40' : '#E5E7EB'}`,
              opacity: hasWork ? 1 : 0.5,
            }}
          >
            {allDone && <span style={{ fontSize: '10px' }}>✓</span>}
            {ETAPA_LABELS[etapa].split(' ')[0]}
            {hasWork && (
              <span style={{ opacity: 0.7 }}>
                {done}/{total}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function AssigneeAvatars({ assignees }: { assignees: string[] }) {
  const unique = [...new Set(assignees)].filter(Boolean).slice(0, 4)
  return (
    <div className="flex items-center" style={{ gap: '-4px' }}>
      {unique.map((name, i) => (
        <div
          key={name}
          title={name}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: ASSIGNEE_COLORS[name] || '#9CA3AF',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: i > 0 ? '-6px' : 0,
            border: '2px solid #fff',
            zIndex: unique.length - i,
            position: 'relative',
          }}
        >
          {name.charAt(0)}
        </div>
      ))}
    </div>
  )
}

function CampaignCard({
  campaign,
  tasks,
  onOpenTask,
  onStatusCycle,
}: {
  campaign: Campaign
  tasks: Task[]
  onOpenTask?: (t: Task) => void
  onStatusCycle: (id: string, current: CampaignStatus) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const campaignTasks = tasks.filter(t => t.campaign_id === campaign.id)
  const assignees = campaignTasks.map(t => t.assignee).filter(Boolean)
  const pendingCount = campaignTasks.filter(t => t.status !== 'completado').length
  const completedCount = campaignTasks.filter(t => t.status === 'completado').length

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E6E9EF',
        borderRadius: '10px',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Card header */}
      <div
        style={{
          padding: '14px 16px',
          borderLeft: `3px solid ${CAMPAIGN_TYPE_COLORS[campaign.type]}`,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: expand + name + badges */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div style={{ color: '#9CA3AF', flexShrink: 0 }}>
              {expanded
                ? <ChevronDown size={14} />
                : <ChevronRight size={14} />
              }
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1F2128', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {campaign.name}
            </span>
            {/* Type badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '99px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: `${CAMPAIGN_TYPE_COLORS[campaign.type]}15`,
                color: CAMPAIGN_TYPE_COLORS[campaign.type],
                border: `1px solid ${CAMPAIGN_TYPE_COLORS[campaign.type]}30`,
                flexShrink: 0,
              }}
            >
              {CAMPAIGN_ICONS[campaign.type]}
              {CAMPAIGN_TYPE_LABELS[campaign.type]}
            </span>
          </div>

          {/* Right: status + task counts + assignees */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {campaignTasks.length > 0 && (
              <div className="flex items-center gap-1">
                <span style={{ fontSize: '11px', color: '#6B7280' }}>
                  {completedCount}/{campaignTasks.length} tasks
                </span>
              </div>
            )}
            {assignees.length > 0 && <AssigneeAvatars assignees={assignees} />}
            {/* Status pill — click to cycle */}
            <button
              onClick={e => {
                e.stopPropagation()
                onStatusCycle(campaign.id, campaign.status)
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '99px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: `${CAMPAIGN_STATUS_COLORS[campaign.status]}20`,
                color: CAMPAIGN_STATUS_COLORS[campaign.status],
                border: `1px solid ${CAMPAIGN_STATUS_COLORS[campaign.status]}40`,
                cursor: 'pointer',
              }}
            >
              <Circle size={6} fill={CAMPAIGN_STATUS_COLORS[campaign.status]} strokeWidth={0} />
              {CAMPAIGN_STATUS_LABELS[campaign.status]}
            </button>
          </div>
        </div>

        {/* Etapa progress pills (always visible) */}
        {campaignTasks.length > 0 && (
          <div style={{ marginTop: '10px', marginLeft: '22px' }}>
            <EtapaProgress campaignId={campaign.id} tasks={tasks} />
          </div>
        )}
        {campaign.objective && (
          <p style={{ marginTop: '6px', marginLeft: '22px', fontSize: '12px', color: '#6B7280' }}>
            {campaign.objective}
          </p>
        )}
      </div>

      {/* Expanded: tasks per etapa */}
      {expanded && (
        <div style={{ borderTop: '1px solid #F3F4F6', backgroundColor: '#FAFBFC' }}>
          {campaignTasks.length === 0 ? (
            <div style={{ padding: '20px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
              No hay tareas en esta campaña todavía
            </div>
          ) : (
            ETAPA_ORDER.map(etapa => {
              const etapaTasks = campaignTasks.filter(t => t.etapa === etapa)
              if (etapaTasks.length === 0) return null
              return (
                <div key={etapa} style={{ borderBottom: '1px solid #F0F1F5' }}>
                  <div style={{
                    padding: '8px 16px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: ETAPA_COLORS[etapa],
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: ETAPA_COLORS[etapa], textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {ETAPA_LABELS[etapa]}
                    </span>
                    <span style={{ fontSize: '11px', color: '#9CA3AF' }}>({etapaTasks.length})</span>
                  </div>
                  {etapaTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => onOpenTask?.(task)}
                      style={{
                        padding: '8px 16px 8px 32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F0F3FF')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div className="flex items-center gap-2">
                        <div style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          backgroundColor: task.status === 'completado' ? '#00C875'
                            : task.status === 'en_progreso' ? '#579BFC'
                            : task.status === 'revision' ? '#FDAB3D'
                            : '#C4C4C4',
                          flexShrink: 0,
                        }} />
                        <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>
                          {task.title}
                        </span>
                        {task.mini_status && (
                          <span style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '99px',
                            backgroundColor: '#F0F3FF',
                            color: '#6366F1',
                            border: '1px solid #E0E7FF',
                          }}>
                            {task.mini_status === 'aprobado' ? '✓ Aprobado'
                              : task.mini_status === 'aprobacion_interna' ? 'Apr. Interna'
                              : task.mini_status === 'correcciones' ? 'Correcciones'
                              : task.mini_status === 'enviado_cliente' ? 'Enviado'
                              : 'Ajustes'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {task.due_date && (
                          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                            {new Date(task.due_date).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                          </span>
                        )}
                        {task.assignee && (
                          <div
                            title={task.assignee}
                            style={{
                              width: '20px', height: '20px', borderRadius: '50%',
                              backgroundColor: ASSIGNEE_COLORS[task.assignee] || '#9CA3AF',
                              color: '#fff', fontSize: '9px', fontWeight: 700,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
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
        </div>
      )}
    </div>
  )
}

function NewCampaignModal({
  clientId,
  clientName,
  onClose,
  onCreate,
}: {
  clientId: string
  clientName: string
  onClose: () => void
  onCreate: (data: { name: string; type: CampaignType; objective: string }) => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<CampaignType>('nueva_campana')
  const [objective, setObjective] = useState('')

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          width: '420px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1F2128', marginBottom: '4px' }}>
          Nueva Campaña
        </h3>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px' }}>
          Cliente: <strong>{clientName}</strong>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
              Nombre de la campaña *
            </label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Lead Magnet CFO"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '8px',
                border: '1px solid #E6E9EF', fontSize: '13px', color: '#1F2128',
                outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#6366F1')}
              onBlur={e => (e.target.style.borderColor = '#E6E9EF')}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>
              Tipo
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([
                { value: 'nueva_campana' as CampaignType, label: 'Nueva Campaña', color: '#6366F1' },
                { value: 'iteracion' as CampaignType,     label: 'Iteración',     color: '#3B82F6' },
                { value: 'refresh' as CampaignType,       label: 'Refresh',       color: '#F59E0B' },
                { value: 'bombero' as CampaignType,       label: '🔥 Bombero',    color: '#EF4444' },
              ]).map(({ value, label, color }) => {
                const active = type === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    style={{
                      padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', border: 'none', transition: 'all 0.12s',
                      backgroundColor: active ? color : `${color}12`,
                      color: active ? '#fff' : color,
                      boxShadow: active ? `0 2px 8px ${color}40` : `inset 0 0 0 1.5px ${color}35`,
                    }}
                  >{label}</button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
              Objetivo / Brief
            </label>
            <textarea
              value={objective}
              onChange={e => setObjective(e.target.value)}
              placeholder="¿Qué problema resuelve esta campaña?"
              rows={3}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '8px',
                border: '1px solid #E6E9EF', fontSize: '13px', color: '#1F2128',
                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#6366F1')}
              onBlur={e => (e.target.style.borderColor = '#E6E9EF')}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3" style={{ marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 16px', borderRadius: '8px', fontSize: '13px',
              fontWeight: 600, color: '#6B7280', backgroundColor: '#F3F4F6',
              border: 'none', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => { if (name.trim()) onCreate({ name: name.trim(), type, objective }) }}
            style={{
              padding: '9px 20px', borderRadius: '8px', fontSize: '13px',
              fontWeight: 600, color: '#fff',
              backgroundColor: name.trim() ? '#6366F1' : '#C7D2FE',
              border: 'none', cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Crear Campaña
          </button>
        </div>
      </div>
    </div>
  )
}

export function CampaignsPage() {
  const { data: clients = [] } = useClients()
  const { data: campaigns = [], isLoading } = useCampaigns()
  const { data: tasks = [] } = useTasks()
  const updateStatus = useUpdateCampaignStatus()
  const createCampaign = useCreateCampaign()
  const ctx = useOutletContext<{ openTaskDetail?: (t: Task) => void }>()

  const [activeClient, setActiveClient] = useState<string | 'all'>('all')
  const [filterType, setFilterType] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [newCampaignFor, setNewCampaignFor] = useState<{ id: string; name: string } | null>(null)
  const [collapsedClients, setCollapsedClients] = useState<Set<string>>(new Set())

  const handleStatusCycle = (id: string, current: CampaignStatus) => {
    const idx = STATUS_CYCLE.indexOf(current)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    updateStatus.mutate({ id, status: next })
  }

  const handleCreateCampaign = (clientId: string, data: { name: string; type: CampaignType; objective: string }) => {
    createCampaign.mutate({
      name: data.name,
      client_id: clientId,
      type: data.type,
      status: 'activa',
      objective: data.objective,
    })
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

  // Filter campaigns
  const visibleCampaigns = campaigns.filter(c => {
    if (activeClient !== 'all' && c.client_id !== activeClient) return false
    if (filterType && c.type !== filterType) return false
    if (filterStatus && c.status !== filterStatus) return false
    return true
  })

  // Group by client
  const clientsWithCampaigns = clients.filter(c =>
    activeClient === 'all' ? true : c.id === activeClient
  )

  // Bomberos (type === 'bombero') separate section
  const bomberos = visibleCampaigns.filter(c => c.type === 'bombero')
  const regular = visibleCampaigns.filter(c => c.type !== 'bombero')

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            border: '3px solid #E0E7FF', borderTopColor: '#6366F1',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ color: '#6B7280', fontSize: '13px' }}>Cargando campañas...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#F6F7FB' }}>

      {/* ── Top filter bar ── */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E6E9EF',
      }}>
        {/* Row 1: client chips */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
          padding: '10px 20px 8px',
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>
            Cliente
          </span>
          {[{ id: 'all', name: 'Todos', color: '#6366F1' }, ...clients].map(c => {
            const isActive = activeClient === c.id
            const clientColor = (c as any).color || '#6366F1'
            return (
              <button
                key={c.id}
                onClick={() => setActiveClient(c.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 11px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  backgroundColor: isActive ? (c.id === 'all' ? '#6366F1' : clientColor) : '#F3F4F6',
                  color: isActive ? '#fff' : '#374151',
                  border: `1.5px solid ${isActive ? (c.id === 'all' ? '#6366F1' : clientColor) : '#E5E7EB'}`,
                  boxShadow: isActive ? `0 2px 6px ${c.id === 'all' ? '#6366F140' : clientColor + '40'}` : 'none',
                }}
              >
                {c.id !== 'all' && (
                  <span style={{
                    display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.7)' : clientColor,
                    flexShrink: 0,
                  }} />
                )}
                {c.name}
              </button>
            )
          })}

          {/* Stats pill — right side */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#00C875' }}>
              {campaigns.filter(c => c.status === 'activa').length} activas
            </span>
            <span style={{ width: 1, height: 14, backgroundColor: '#E6E9EF' }} />
            <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>
              {campaigns.length} campañas
            </span>
          </div>
        </div>

        {/* Row 2: type + status chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 20px 10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 2 }}>
            Tipo
          </span>
          {[
            { value: '', label: 'Todos' },
            { value: 'nueva_campana', label: 'Nueva Campaña' },
            { value: 'iteracion', label: 'Iteración' },
            { value: 'refresh', label: 'Refresh' },
            { value: 'bombero', label: '🔥 Bombero' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterType(filterType === value ? '' : value)}
              style={{
                padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                backgroundColor: filterType === value ? '#6366F1' : '#F3F4F6',
                color: filterType === value ? '#fff' : '#6B7280',
                border: `1px solid ${filterType === value ? '#6366F1' : '#E5E7EB'}`,
              }}
            >
              {label}
            </button>
          ))}

          <span style={{ width: 1, height: 14, backgroundColor: '#E6E9EF', margin: '0 4px' }} />

          <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 2 }}>
            Estado
          </span>
          {[
            { value: '', label: 'Todos' },
            { value: 'activa', label: 'Activa', color: '#00C875' },
            { value: 'pausada', label: 'Pausada', color: '#FDAB3D' },
            { value: 'desactivada', label: 'Desactivada', color: '#C4C4C4' },
          ].map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(filterStatus === value ? '' : value)}
              style={{
                padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                backgroundColor: filterStatus === value ? (color || '#6366F1') : '#F3F4F6',
                color: filterStatus === value ? '#fff' : '#6B7280',
                border: `1px solid ${filterStatus === value ? (color || '#6366F1') : '#E5E7EB'}`,
              }}
            >
              {label}
            </button>
          ))}

          {(filterType || filterStatus) && (
            <button
              onClick={() => { setFilterType(''); setFilterStatus('') }}
              style={{
                padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600,
                cursor: 'pointer', color: '#9CA3AF',
                backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB',
              }}
            >
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* 🔥 Bomberos section */}
        {bomberos.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '4px 12px', borderRadius: '99px',
                backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
              }}>
                <Flame size={14} color="#EF4444" />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444' }}>
                  BOMBEROS — Incendios Activos
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                ({bomberos.length})
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bomberos.map(c => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  tasks={tasks}
                  onOpenTask={ctx?.openTaskDetail}
                  onStatusCycle={handleStatusCycle}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular campaigns grouped by client */}
        {clientsWithCampaigns.map(client => {
          const clientCampaigns = regular.filter(c => c.client_id === client.id)
          if (activeClient !== 'all' && clientCampaigns.length === 0) return null

          const isCollapsed = collapsedClients.has(client.id)

          return (
            <div key={client.id} style={{ marginBottom: '28px' }}>
              {/* Client header */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: '12px', cursor: 'pointer',
                }}
                onClick={() => toggleClient(client.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    backgroundColor: client.color,
                  }} />
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1F2128' }}>
                    {client.name}
                  </h2>
                  <span style={{
                    padding: '2px 8px', borderRadius: '99px', fontSize: '11px',
                    fontWeight: 600, backgroundColor: '#F3F4F6', color: '#6B7280',
                  }}>
                    {clientCampaigns.length} {clientCampaigns.length === 1 ? 'campaña' : 'campañas'}
                  </span>
                  {isCollapsed
                    ? <ChevronRight size={14} color="#9CA3AF" />
                    : <ChevronDown size={14} color="#9CA3AF" />
                  }
                </div>

                {/* Add campaign button */}
                <button
                  onClick={e => {
                    e.stopPropagation()
                    setNewCampaignFor({ id: client.id, name: client.name })
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 12px', borderRadius: '8px', fontSize: '12px',
                    fontWeight: 600, color: '#6366F1',
                    backgroundColor: '#F0F3FF', border: '1px solid #E0E7FF',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E0E7FF')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F0F3FF')}
                >
                  <Plus size={12} />
                  Nueva campaña
                </button>
              </div>

              {/* Campaign cards */}
              {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {clientCampaigns.length === 0 ? (
                    <div
                      style={{
                        padding: '24px', textAlign: 'center',
                        border: '2px dashed #E5E7EB', borderRadius: '10px',
                        color: '#9CA3AF', fontSize: '13px',
                      }}
                    >
                      No hay campañas activas para {client.name}.{' '}
                      <button
                        onClick={() => setNewCampaignFor({ id: client.id, name: client.name })}
                        style={{ color: '#6366F1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Crear una
                      </button>
                    </div>
                  ) : (
                    clientCampaigns.map(c => (
                      <CampaignCard
                        key={c.id}
                        campaign={c}
                        tasks={tasks}
                        onOpenTask={ctx?.openTaskDetail}
                        onStatusCycle={handleStatusCycle}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}

        {visibleCampaigns.length === 0 && !isLoading && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              No hay campañas
            </p>
            <p style={{ fontSize: '13px' }}>
              Selecciona un cliente y crea la primera campaña.
            </p>
          </div>
        )}
      </div>

      {/* New campaign modal */}
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
