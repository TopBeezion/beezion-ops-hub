import { Copy, CheckCircle2, Users, Building2, Webhook, Palette, Plus, X, FileStack, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useClients, useUpdateClient, useCreateClient } from '../hooks/useClients'
import { useTeam } from '../hooks/useTeam'
import { useTasks } from '../hooks/useTasks'
import { useCampaignTemplates, useUpdateCampaignTemplate, type CampaignTemplateRow, type CampaignTemplateTask } from '../hooks/useCampaignTemplates'
import { AREA_COLORS, AREA_LABELS, ASSIGNEE_COLORS, TEAM_ROLES } from '../lib/constants'
import type { Area, Etapa } from '../types'

const ETAPA_OPTIONS: Etapa[] = ['scripts', 'produccion', 'edicion', 'lead_magnet', 'landing_page', 'tracking', 'estructuracion']
const AREA_OPTIONS: Area[] = ['copy', 'produccion', 'edicion', 'trafico', 'tech', 'admin']

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#F0F2F8',
  card: '#FFFFFF',
  border: '#E4E7F0',
  text: '#1A1D27',
  sub: '#5A5E72',
  muted: '#9699B0',
  accent: '#6366F1',
  green: '#10B981',
  orange: '#F59E0B',
  red: '#E2445C',
}

const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL ?? 'https://YOUR_PROJECT.supabase.co'}/functions/v1/process-meeting`

// ─── Helpers ──────────────────────────────────────────────────────────────────
function card(extra?: React.CSSProperties): React.CSSProperties {
  return {
    backgroundColor: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    overflow: 'hidden',
    ...extra,
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
      }}
      style={{
        padding: '6px', borderRadius: 6, cursor: 'pointer',
        color: copied ? C.green : C.muted,
        backgroundColor: copied ? '#D1FAE5' : C.bg,
        border: `1px solid ${copied ? '#86EFAC' : C.border}`,
        transition: 'all 0.2s', flexShrink: 0,
      }}
      title="Copiar"
    >
      {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
    </button>
  )
}

function SectionTitle({ icon: Icon, children }: { icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
      {Icon && (
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          backgroundColor: `${C.accent}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={12} color={C.accent} />
        </div>
      )}
      <h2 style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: C.muted, margin: 0,
      }}>
        {children}
      </h2>
    </div>
  )
}

// ─── New Client Modal ─────────────────────────────────────────────────────────
const PRESET_COLORS = [
  '#6366F1', '#3B82F6', '#10B981', '#F59E0B',
  '#EC4899', '#8B5CF6', '#F97316', '#EF4444', '#06B6D4',
]

function NewClientModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (name: string, color: string) => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(15,17,26,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{ ...card({ overflow: 'visible' }), padding: 24, width: 380 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>Nuevo cliente</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 6 }}>Nombre</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Beezion Client"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                border: `1px solid ${C.border}`, fontSize: 13, color: C.text,
                outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = C.accent)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 8 }}>Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    backgroundColor: c, cursor: 'pointer',
                    border: color === c ? `3px solid ${c}` : '3px solid transparent',
                    outline: color === c ? `2px solid ${c}40` : 'none',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: color }} />
              <input
                value={color}
                onChange={e => setColor(e.target.value)}
                placeholder="#6366F1"
                style={{
                  fontSize: 12, fontFamily: 'monospace',
                  padding: '4px 8px', borderRadius: 6,
                  border: `1px solid ${C.border}`, outline: 'none', color: C.sub,
                }}
                onFocus={e => (e.target.style.borderColor = C.accent)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3" style={{ marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13,
              fontWeight: 600, color: C.sub, backgroundColor: C.bg,
              border: `1px solid ${C.border}`, cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            disabled={!name.trim()}
            onClick={() => { if (name.trim()) { onCreate(name.trim(), color); onClose() } }}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13,
              fontWeight: 600, color: '#fff',
              backgroundColor: name.trim() ? C.accent : '#C7D2FE',
              border: 'none', cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Crear cliente
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
// ── Campaign Templates Editor ────────────────────────────────────────
function CampaignTemplatesEditor() {
  const { data: templates = [], isLoading } = useCampaignTemplates()
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (!activeId && templates.length > 0) {
      const preferred = templates.find(t => t.tipo === 'nueva_campana') ?? templates[0]
      setActiveId(preferred.id)
    }
  }, [templates, activeId])

  if (isLoading) {
    return (
      <div style={card({ padding: 24, display: 'flex', justifyContent: 'center' })}>
        <div className="w-5 h-5 border-2 border-transparent border-t-current rounded-full animate-spin" style={{ color: C.accent }} />
      </div>
    )
  }
  const active = templates.find(t => t.id === activeId) ?? null

  return (
    <div style={card({ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 })}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {templates.map(t => {
          const isActive = t.id === activeId
          return (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              style={{
                padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                border: `1px solid ${isActive ? C.accent : C.border}`,
                background: isActive ? `${C.accent}12` : '#fff',
                color: isActive ? C.accent : C.sub,
                cursor: 'pointer',
              }}
            >
              {t.name}
            </button>
          )
        })}
      </div>
      {active && <TemplateForm key={active.id} template={active} />}
    </div>
  )
}

function TemplateForm({ template }: { template: CampaignTemplateRow }) {
  const update = useUpdateCampaignTemplate()
  const [tasks, setTasks] = useState<CampaignTemplateTask[]>(() =>
    Array.isArray(template.default_tasks) ? template.default_tasks : []
  )
  const [name, setName] = useState(template.name)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    setTasks(Array.isArray(template.default_tasks) ? template.default_tasks : [])
    setName(template.name)
  }, [template.id])

  const updateTask = (i: number, patch: Partial<CampaignTemplateTask>) => {
    setTasks(curr => curr.map((t, idx) => idx === i ? { ...t, ...patch } : t))
  }
  const removeTask = (i: number) => setTasks(curr => curr.filter((_, idx) => idx !== i))
  const addTask = () => setTasks(curr => [...curr, { title: 'Nueva tarea', etapa: 'scripts', area: 'copy' }])
  const moveTask = (i: number, dir: -1 | 1) => {
    setTasks(curr => {
      const next = [...curr]
      const j = i + dir
      if (j < 0 || j >= next.length) return curr
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const handleSave = async () => {
    try {
      await update.mutateAsync({ id: template.id, default_tasks: tasks, name })
      setSavedAt(Date.now())
    } catch (e) {
      alert(`No se pudo guardar: ${(e as { message?: string })?.message ?? e}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          style={{
            flex: 1, padding: '8px 10px', borderRadius: 8,
            border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600, color: C.text,
          }}
        />
        <span style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>
          tipo: {template.tipo}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tasks.length === 0 && (
          <span style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>Sin tareas — agregá la primera.</span>
        )}
        {tasks.map((t, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 130px 110px auto auto',
            gap: 6, alignItems: 'center',
            padding: 8, border: `1px solid ${C.border}`, borderRadius: 8, background: '#FAFBFE',
          }}>
            <input
              value={t.title}
              onChange={e => updateTask(i, { title: e.target.value })}
              placeholder="Título"
              style={{ padding: '6px 8px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, color: C.text }}
            />
            <select
              value={t.etapa ?? ''}
              onChange={e => updateTask(i, { etapa: (e.target.value || null) as Etapa | null })}
              style={{ padding: '6px 8px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, color: C.text }}
            >
              <option value="">— sin etapa —</option>
              {ETAPA_OPTIONS.map(et => <option key={et} value={et}>{et}</option>)}
            </select>
            <select
              value={t.area ?? ''}
              onChange={e => updateTask(i, { area: (e.target.value || null) as Area | null })}
              style={{ padding: '6px 8px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, color: C.text }}
            >
              <option value="">— área —</option>
              {AREA_OPTIONS.map(a => <option key={a} value={a}>{AREA_LABELS[a] ?? a}</option>)}
            </select>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <button
                onClick={() => moveTask(i, -1)}
                disabled={i === 0}
                style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? C.muted : C.sub, fontSize: 10, padding: 0 }}
              >▲</button>
              <button
                onClick={() => moveTask(i, 1)}
                disabled={i === tasks.length - 1}
                style={{ background: 'none', border: 'none', cursor: i === tasks.length - 1 ? 'default' : 'pointer', color: i === tasks.length - 1 ? C.muted : C.sub, fontSize: 10, padding: 0 }}
              >▼</button>
            </div>
            <button
              onClick={() => removeTask(i)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, padding: 4, display: 'flex' }}
              title="Eliminar tarea"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={addTask}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 8, border: `1px dashed ${C.border}`,
            background: '#fff', cursor: 'pointer', color: C.sub, fontSize: 12, fontWeight: 600,
          }}
        >
          <Plus size={12} /> Agregar tarea
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {savedAt && (
            <span style={{ fontSize: 11, color: C.green }}>Guardado ✓</span>
          )}
          <button
            onClick={handleSave}
            disabled={update.isPending}
            style={{
              padding: '7px 14px', borderRadius: 8, border: 'none',
              background: C.accent, color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: update.isPending ? 'wait' : 'pointer', opacity: update.isPending ? 0.6 : 1,
            }}
          >
            {update.isPending ? 'Guardando…' : 'Guardar template'}
          </button>
        </div>
      </div>
      <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
        Estos cambios se aplicarán a las próximas campañas creadas con este template.
      </p>
    </div>
  )
}

export function SettingsPage() {
  const { data: clients = [], isLoading: clientsLoading } = useClients(true) // include inactive
  const { data: team = [], isLoading: teamLoading } = useTeam()
  const { data: tasks = [] } = useTasks()
  const updateClient = useUpdateClient()
  const createClient = useCreateClient()
  const [showNewClient, setShowNewClient] = useState(false)

  const tasksByMember = (name: string) => ({
    total: tasks.filter(t => t.assignee === name).length,
    active: tasks.filter(t => t.assignee === name && t.status === 'en_proceso').length,
    done: tasks.filter(t => t.assignee === name && t.status === 'done').length,
  })

  const tasksByClient = (id: string) => tasks.filter(t => t.client_id === id).length

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100%', padding: '20px 24px' }}>
      <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>Configuración</h1>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>Gestiona clientes, equipo y conectores</p>
        </div>

        {/* ── Clients ── */}
        <section>
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <SectionTitle icon={Building2}>Clientes activos</SectionTitle>
            <button
              onClick={() => setShowNewClient(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 8, fontSize: 12,
                fontWeight: 600, color: C.accent,
                backgroundColor: `${C.accent}10`, border: `1px solid ${C.accent}30`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = `${C.accent}18`)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = `${C.accent}10`)}
            >
              <Plus size={13} /> Nuevo cliente
            </button>
          </div>

          <div style={card()}>
            {clientsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <div className="w-5 h-5 border-2 border-transparent border-t-current rounded-full animate-spin" style={{ color: C.accent }} />
              </div>
            ) : clients.map((client, idx) => {
              const taskCount = tasksByClient(client.id)
              return (
                <div key={client.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderBottom: idx < clients.length - 1 ? `1px solid ${C.border}` : 'none',
                  borderLeft: `3px solid ${client.active ? client.color : C.border}`,
                  opacity: client.active ? 1 : 0.6,
                  transition: 'all 0.2s',
                }}>
                  {/* Color swatch */}
                  <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, backgroundColor: client.color }} />

                  {/* Name */}
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>{client.name}</span>

                  {/* Task count */}
                  {taskCount > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: client.color,
                      backgroundColor: `${client.color}15`, padding: '2px 7px', borderRadius: 99,
                      border: `1px solid ${client.color}25`,
                    }}>
                      {taskCount} tareas
                    </span>
                  )}

                  {/* Color hex */}
                  <span style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace' }}>{client.color}</span>

                  {/* Active toggle */}
                  <button
                    onClick={() => updateClient.mutate({ id: client.id, active: !client.active })}
                    disabled={updateClient.isPending}
                    style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                      backgroundColor: client.active ? '#D1FAE5' : '#F3F4F6',
                      color: client.active ? C.green : C.muted,
                      border: `1px solid ${client.active ? '#86EFAC' : C.border}`,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = client.active ? '#FEE2E2' : '#D1FAE5'
                      e.currentTarget.style.color = client.active ? C.red : C.green
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = client.active ? '#D1FAE5' : '#F3F4F6'
                      e.currentTarget.style.color = client.active ? C.green : C.muted
                    }}
                  >
                    {client.active ? '✓ Activo' : 'Inactivo'}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Team ── */}
        <section>
          <SectionTitle icon={Users}>Equipo</SectionTitle>
          <div style={card()}>
            {teamLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <div className="w-5 h-5 border-2 border-transparent border-t-current rounded-full animate-spin" style={{ color: C.accent }} />
              </div>
            ) : team.map((member, idx) => {
              const stats = tasksByMember(member.name)
              const color = ASSIGNEE_COLORS[member.name] || member.color
              return (
                <div key={member.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  borderBottom: idx < team.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: `${color}20`,
                    color: color, fontSize: 12, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1.5px solid ${color}35`,
                  }}>
                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>{member.name}</p>
                    {member.email && (
                      <p style={{ fontSize: 11, color: C.muted, margin: '1px 0 0' }}>{member.email}</p>
                    )}
                  </div>

                  {/* Task stats */}
                  {stats.total > 0 && (
                    <div className="flex items-center gap-1.5">
                      {stats.active > 0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: '#3B82F6',
                          backgroundColor: '#3B82F615', padding: '2px 7px', borderRadius: 99,
                          border: '1px solid #3B82F625',
                        }}>
                          {stats.active} activas
                        </span>
                      )}
                      <span style={{
                        fontSize: 10, fontWeight: 600, color: C.muted,
                        backgroundColor: C.bg, padding: '2px 7px', borderRadius: 99,
                        border: `1px solid ${C.border}`,
                      }}>
                        {stats.total} total
                      </span>
                    </div>
                  )}

                  {/* Role / cargo badge */}
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 6,
                    backgroundColor: (member.role === 'admin' || member.name === 'Alejandro' || member.name === 'Alec')
                      ? `${C.accent}12` : C.bg,
                    color: (member.role === 'admin' || member.name === 'Alejandro' || member.name === 'Alec')
                      ? C.accent : C.sub,
                    border: `1px solid ${(member.role === 'admin' || member.name === 'Alejandro' || member.name === 'Alec')
                      ? `${C.accent}25` : C.border}`,
                    fontWeight: 600, whiteSpace: 'nowrap',
                  }}>
                    {TEAM_ROLES[member.name] || member.role}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Área colors ── */}
        <section>
          <SectionTitle icon={Palette}>Áreas de trabajo</SectionTitle>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(['copy', 'trafico', 'tech', 'admin', 'edicion'] as const).map(area => {
              const areaTaskCount = tasks.filter(t => t.area === area).length
              return (
                <div key={area} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 10,
                  backgroundColor: C.card, border: `1px solid ${C.border}`,
                  borderLeft: `3px solid ${AREA_COLORS[area]}`,
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: AREA_COLORS[area] }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{AREA_LABELS[area]}</span>
                  {areaTaskCount > 0 && (
                    <span style={{
                      fontSize: 10, color: AREA_COLORS[area],
                      backgroundColor: `${AREA_COLORS[area]}15`,
                      padding: '1px 6px', borderRadius: 99, fontWeight: 600,
                    }}>
                      {areaTaskCount}
                    </span>
                  )}
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: C.muted }}>{AREA_COLORS[area]}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Webhook n8n ── */}
        <section>
          <SectionTitle icon={Webhook}>Webhook n8n</SectionTitle>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 12, marginTop: -4 }}>
            Configura este endpoint en n8n para procesar transcripciones y crear tareas automáticamente.
          </p>
          <div style={{ ...card({ overflow: 'visible' }), padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Endpoint */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.sub, marginBottom: 5 }}>Endpoint URL</p>
                <code style={{
                  fontSize: 11, color: C.accent, fontFamily: 'monospace',
                  backgroundColor: `${C.accent}0D`, padding: '6px 10px', borderRadius: 6,
                  border: `1px solid ${C.accent}25`, display: 'block', wordBreak: 'break-all',
                }}>
                  {WEBHOOK_URL}
                </code>
              </div>
              <CopyButton text={WEBHOOK_URL} />
            </div>

            {/* Method */}
            <div className="flex items-center gap-10">
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.sub, marginBottom: 5 }}>Método</p>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 6, fontFamily: 'monospace', fontWeight: 700,
                  backgroundColor: '#D1FAE5', color: C.green, border: '1px solid #86EFAC',
                }}>
                  POST
                </span>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.sub, marginBottom: 5 }}>Content-Type</p>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 6, fontFamily: 'monospace',
                  backgroundColor: C.bg, color: C.sub, border: `1px solid ${C.border}`,
                }}>
                  application/json
                </span>
              </div>
            </div>

            {/* Body */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.sub, marginBottom: 5 }}>Body JSON de ejemplo</p>
              <pre style={{
                fontSize: 11, borderRadius: 8, padding: '12px 14px', overflow: 'auto',
                backgroundColor: '#F8F9FC', border: `1px solid ${C.border}`,
                color: C.text, fontFamily: 'monospace', lineHeight: 1.7, margin: 0,
              }}>
{`{
  "meeting_title": "Reunión semanal equipo",
  "meeting_date": "2026-04-07",
  "transcript": "...",
  "tasks": [
    {
      "title": "Crear BCL para cliente X",
      "client_name": "Dapta",
      "area": "copy",
      "assignee": "Alejandro",
      "priority": "alta",
      "week": 1,
      "tipo": "nuevo",
      "problema": "Conversión baja"
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* ── Templates ── */}
        <section>
          <SectionTitle icon={FileStack}>Templates de Campaña</SectionTitle>
          <CampaignTemplatesEditor />
        </section>

      </div>

      {showNewClient && (
        <NewClientModal
          onClose={() => setShowNewClient(false)}
          onCreate={(name, color) => createClient.mutate({ name, color })}
        />
      )}
    </div>
  )
}
