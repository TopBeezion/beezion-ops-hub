import { useState } from 'react'
import { useParams, Navigate, useOutletContext } from 'react-router-dom'
import { useTasks, useUpdateTaskStatus } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import { useCampaigns } from '../hooks/useCampaigns'
import type { Area, TaskStatus, Task } from '../types'
import { AREA_LABELS, STATUS_LABELS, STATUS_COLORS, CAMPAIGN_TYPE_COLORS, CAMPAIGN_TYPE_LABELS } from '../lib/constants'
import { AreaBadge } from '../components/ui/AreaBadge'
import { AssigneeAvatar } from '../components/ui/AssigneeAvatar'
import { PriorityDot } from '../components/ui/PriorityDot'
import { ChevronRight, Target, AlertTriangle, CheckCircle2, Zap } from 'lucide-react'

const C = {
  bg: '#F0F2F8',
  card: '#FFFFFF',
  border: '#E4E7F0',
  text: '#1A1D27',
  sub: '#5A5E72',
  muted: '#9699B0',
  accent: '#6366F1',
}

// ─── Strategy data per client ───────────────────────────────────────────────
const CLIENT_STRATEGY: Record<string, { problems: string[]; strategies: string[]; kpis: string[] }> = {
  Dapta: {
    problems: [
      'Payment Approved conversión baja — pocos leads llegan a pagar después del trial',
      'Pocos registros P1/P2 — mayoría de leads son de baja calidad o no califican',
      'Show rate Book Demos menor al 50% — los agendamientos no se concretan',
      'Falta de urgencia en la oferta — el valor del producto no es claro en el top funnel',
    ],
    strategies: [
      'Funnel remarketing 3 videos: Video 1 lead magnet gratis → Video 2 awareness → Video 3 testimonios',
      'Thank You Page con oferta 50% off inmediatamente al descargar el lead magnet',
      'Configurar P1/P2 como evento de conversión prioritario en Google Ads',
      'Exportar lista P1/P2 desde HubSpot y subirla a Meta como audiencia + lookalike',
      'Rediseñar landing Book Demo: fricción en formulario + VSL + urgencia "primeros 20 spots"',
      'Implementar AI voice call en landing — webhook que llama al lead apenas se registra',
      'Copy oferta "primer agente gratis" en booking page para aumentar show rate',
    ],
    kpis: ['Aumentar tasa P1/P2 sobre total leads', 'Show rate Book Demos +50%', 'Payment Approved +20%'],
  },
  Bink: {
    problems: [
      'Volumen MQLs bajo — pocos leads calificados llegando al pipeline',
      'Calificación MQL a SQL baja — leads que llegan no convierten en demos reales',
      'Audiencia no segmentada — se habla igual a CFO que ya conoce flexibilización y al que no',
      'Hooks actuales no generan suficiente CTR',
      'Thank You Page sin urgencia ni oferta clara',
    ],
    strategies: [
      'Segmentar en CFO1 (conoce flexibilización) y CFO2 (necesita educación)',
      'CFO1: captions sobre riesgo legal + solución Bink. 6 hooks + 1 CTA + 1 body copy',
      'CFO2: captions educativos sobre flexibilización. 6 hooks + 1 CTA + 1 body copy',
      'Lead magnet CFO1: "Cómo hacer flexibilización salarial de forma legal"',
      'Nuevo formulario de calificación: número de empleados, tipo de contratación, situación legal',
      'Thank You Page con urgencia real y escasez',
      'Estructura 4 grupos: CFO1, CFO2, Competidores, Awareness + retargeting por VTR',
    ],
    kpis: ['Aumentar volumen MQLs semanales', 'Mejorar tasa MQL→SQL', 'Reducir CPL por segmento'],
  },
  'On The Fuze': {
    problems: [
      'Semanas irregulares de MQLs — flujo inconsistente',
      'Pocos bookings — la oferta en la booking page no genera urgencia',
      'Costo por MQL alto — estructura actual no es eficiente',
      'No hay lead magnets activos para tráfico frío',
    ],
    strategies: [
      'Crear 3 lead magnets: HubSpot Sales Audit, Implementation Checklist, Sales Process Checklist',
      'Quiz funnel "What\'s the ROI of your HubSpot?" — 8 preguntas + 3 resultados',
      'Actualizar booking page: nuevo BCL + urgencia estadística + escasez',
      'Lanzar campaña awareness + retargeting para visitantes sin conversión',
      'Testear YouTube display ads en videos del canal de OTF',
    ],
    kpis: ['Estabilizar flujo de MQLs semana a semana', 'Reducir CPL', 'Aumentar booking rate'],
  },
  Finkargo: {
    problems: [
      'MQLs bajos en Colombia y México — volumen insuficiente para el equipo comercial',
      'Baja conversión FOB a pitch',
      'Falta de datos de contactabilidad de FOBs',
      'BCL pendiente de producción — bloqueando Thank You Page',
      'Sin lead magnet activo para importadores',
    ],
    strategies: [
      'Producir BCL Finkargo y subir a Thank You Page',
      'Crear lead magnet: "Calculadora de costos para importadores"',
      'Pedir métricas de contactabilidad a Figueroa: FOB contactados vs respondidos — URGENTE',
      'Configurar lista FOB en Meta y lanzar campaña remarketing',
      'Copy remarketing FOB: "Aprobamos hasta $3M en 48 horas" — 4 hooks + 1 body copy + 1 CTA',
      'Crear carrusel de testimonios escritos — 5 slides',
    ],
    kpis: ['Aumentar MQLs Colombia y México', 'Mejorar conversión FOB→pitch', 'Ritmo quincenal de reporte'],
  },
  Treble: {
    problems: [
      'Conversión visita a click baja — la landing no está convirtiendo tráfico en leads',
      'Meta: 1000 MQLs desde paid media — sin estructura clara de campaña',
      'Hooks y ads no diferenciados del mercado',
      'Landing page visualmente desactualizada',
    ],
    strategies: [
      'Nuevos headlines para landing + anuncios — 5 opciones + 3 variaciones de CTA',
      'Nuevos hooks para "Talk to Sale" y "Registros" — 6 hooks + 1 CTA + 1 body copy',
      'Campaña awareness transversal para ampliar el embudo superior',
      'Auditoría completa landing: diseño, contraste, claridad del CTA',
    ],
    kpis: ['Mejorar CTR de ads', 'Aumentar conversión landing', 'Alcanzar 1000 MQLs desde paid'],
  },
  ColombiatechWeek: {
    problems: [
      'Evento con fecha límite fija — toda la producción de contenido tiene deadline duro',
      'Necesidad de posicionar a los speakers antes del evento para generar expectativa',
      'Baja visibilidad del evento en LATAM fuera de Colombia',
    ],
    strategies: [
      'Campaña de speakers: hooks cortos con cada speaker destacado + sus temas',
      'Anuncios de urgencia: "X días para el evento" + escasez de tickets',
      'Retargeting a visitantes de la web del evento que no compraron ticket',
      'Contenido de valor pre-evento: mini insights de los speakers en formato carrusel',
    ],
    kpis: ['Aumentar venta de tickets', 'Mejorar awareness del evento en LATAM', 'CTR anuncios speakers'],
  },
}

const STATUSES: TaskStatus[] = ['todo', 'en_progreso', 'revision', 'hecho']

export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const { data: clients = [] } = useClients()
  const { data: tasks = [], isLoading } = useTasks({ client_id: clientId })
  const { data: allCampaigns = [] } = useCampaigns()
  const updateStatus = useUpdateTaskStatus()
  const ctx = useOutletContext<{ openNewTask?: () => void; openTaskDetail?: (t: Task) => void }>()

  const [areaFilter, setAreaFilter] = useState<Area | ''>('')
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null)

  const client = clients.find(c => c.id === clientId)
  if (!isLoading && !client) return <Navigate to="/" replace />

  const clientCampaigns = allCampaigns.filter(c => c.client_id === clientId)
  const filteredTasks = areaFilter ? tasks.filter(t => t.area === areaFilter) : tasks
  const completedCount = tasks.filter(t => t.status === 'hecho').length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0
  const strategy = client ? CLIENT_STRATEGY[client.name] : null
  const tasksByStatus = STATUSES.map(s => ({ status: s, tasks: tasks.filter(t => t.status === s) }))
  const clientColor = client?.color || '#6366F1'

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100%' }}>

      {/* ── Hero header ─────────────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${clientColor}12 0%, ${C.card} 60%)`,
        borderBottom: `1px solid ${clientColor}25`,
        padding: '20px 24px 16px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
          fontSize: 120, fontWeight: 900, lineHeight: 1,
          color: `${clientColor}06`, pointerEvents: 'none', userSelect: 'none',
        }}>
          {client?.name[0]}
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, flexShrink: 0,
              background: `linear-gradient(135deg, ${clientColor}25, ${clientColor}10)`,
              border: `1.5px solid ${clientColor}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900, color: clientColor,
            }}>
              {client?.name[0]}
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>{client?.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: C.muted }}>{tasks.length} tareas · {clientCampaigns.length} campañas</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  backgroundColor: `${clientColor}15`, color: clientColor,
                  border: `1px solid ${clientColor}30`,
                }}>
                  {progress}% completado
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  backgroundColor: clientCampaigns.filter(c => c.status === 'activa').length > 0 ? '#D1FAE5' : '#F3F4F6',
                  color: clientCampaigns.filter(c => c.status === 'activa').length > 0 ? '#10B981' : C.muted,
                  border: `1px solid ${clientCampaigns.filter(c => c.status === 'activa').length > 0 ? '#86EFAC' : C.border}`,
                }}>
                  {clientCampaigns.filter(c => c.status === 'activa').length} activas
                </span>
              </div>
            </div>
          </div>
          {/* Progress ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width={64} height={64} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={32} cy={32} r={26} fill="none" stroke={C.border} strokeWidth={3.5} />
              <circle cx={32} cy={32} r={26} fill="none" stroke={clientColor} strokeWidth={3.5}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - progress / 100)}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: clientColor,
            }}>
              {progress}%
            </div>
          </div>
        </div>
        <div style={{ marginTop: 14, height: 3, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: `linear-gradient(90deg, ${clientColor}, ${clientColor}88)`,
            borderRadius: 3, transition: 'width 0.8s ease',
          }} />
        </div>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Status KPIs ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {tasksByStatus.map(({ status, tasks: st }) => (
            <div key={status} style={{
              backgroundColor: C.card, border: `1px solid ${STATUS_COLORS[status]}20`,
              borderRadius: 12, padding: '12px 16px',
              borderTop: `3px solid ${STATUS_COLORS[status]}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: STATUS_COLORS[status] }} />
                <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {STATUS_LABELS[status]}
                </p>
              </div>
              <p style={{ fontSize: 30, fontWeight: 800, color: st.length > 0 ? STATUS_COLORS[status] : C.border, lineHeight: 1 }}>
                {st.length}
              </p>
            </div>
          ))}
        </div>

        {/* ── Campaigns ───────────────────────────────────────────────────────── */}
        {clientCampaigns.length > 0 && (
          <div>
            <h2 style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 10px' }}>
              Campañas
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {clientCampaigns.map(cam => {
                const camTasks = tasks.filter(t => t.campaign_id === cam.id)
                const camDone = camTasks.filter(t => t.status === 'hecho').length
                const camPct = camTasks.length > 0 ? Math.round((camDone / camTasks.length) * 100) : 0
                const camColor = CAMPAIGN_TYPE_COLORS[cam.type as keyof typeof CAMPAIGN_TYPE_COLORS] ?? clientColor
                const isExpanded = expandedCampaign === cam.id
                const statusCount = {
                  pendiente: camTasks.filter(t => t.status === 'todo').length,
                  en_progreso: camTasks.filter(t => t.status === 'en_progreso').length,
                  revision: camTasks.filter(t => t.status === 'revision').length,
                  completado: camDone,
                }

                return (
                  <div key={cam.id} style={{
                    backgroundColor: C.card,
                    border: `1px solid ${camColor}30`,
                    borderRadius: 12, overflow: 'hidden',
                    borderTop: `3px solid ${camColor}`,
                  }}>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4, lineHeight: 1.3 }}>
                            {cam.name}
                          </p>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                              backgroundColor: `${camColor}15`, color: camColor,
                            }}>
                              {CAMPAIGN_TYPE_LABELS[cam.type as keyof typeof CAMPAIGN_TYPE_LABELS] ?? cam.type}
                            </span>
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                              backgroundColor: cam.status === 'activa' ? '#D1FAE5' : '#F3F4F6',
                              color: cam.status === 'activa' ? '#10B981' : C.muted,
                            }}>
                              {cam.status === 'activa' ? '● Activa' : cam.status === 'pausada' ? '⏸ Pausada' : '○ Inactiva'}
                            </span>
                          </div>
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 800, color: camColor, flexShrink: 0 }}>
                          {camTasks.length}
                        </span>
                      </div>

                      {/* Mini progress */}
                      <div style={{ marginTop: 10, height: 3, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${camPct}%`,
                          backgroundColor: camColor, borderRadius: 3,
                          transition: 'width 0.5s ease',
                        }} />
                      </div>

                      {/* Status mini-counts */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        {Object.entries(statusCount).filter(([, v]) => v > 0).map(([s, v]) => (
                          <span key={s} style={{
                            fontSize: 9, fontWeight: 700,
                            color: STATUS_COLORS[s as TaskStatus],
                          }}>
                            {v} {STATUS_LABELS[s as TaskStatus].toLowerCase()}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Expand tasks */}
                    {camTasks.length > 0 && (
                      <>
                        <button
                          onClick={() => setExpandedCampaign(isExpanded ? null : cam.id)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            width: '100%', padding: '8px 14px',
                            background: `${camColor}08`, border: 'none',
                            borderTop: `1px solid ${camColor}20`, cursor: 'pointer',
                            fontSize: 10, fontWeight: 600, color: camColor,
                          }}
                        >
                          <span>{isExpanded ? 'Ocultar tareas' : `Ver ${camTasks.length} tareas`}</span>
                          <ChevronRight size={12} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: '0.15s' }} />
                        </button>
                        {isExpanded && (
                          <div style={{ borderTop: `1px solid ${C.border}` }}>
                            {camTasks.map((t, i) => (
                              <div
                                key={t.id}
                                onClick={() => ctx?.openTaskDetail?.(t)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  padding: '8px 14px', cursor: 'pointer',
                                  borderBottom: i < camTasks.length - 1 ? `1px solid ${C.border}` : 'none',
                                  borderLeft: `3px solid ${STATUS_COLORS[t.status]}40`,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8F9FC')}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                              >
                                <PriorityDot priority={t.priority} />
                                <span style={{ flex: 1, fontSize: 11, color: C.text, fontWeight: 500 }}>{t.title}</span>
                                <span style={{
                                  fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                                  backgroundColor: `${STATUS_COLORS[t.status]}15`,
                                  color: STATUS_COLORS[t.status],
                                }}>
                                  {STATUS_LABELS[t.status]}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Strategy ─────────────────────────────────────────────────────────── */}
        {strategy && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Problems */}
              <div style={{ backgroundColor: C.card, border: '1px solid #FCA5A530', borderRadius: 12, padding: 16, borderLeft: '3px solid #EF4444' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <AlertTriangle size={13} color="#EF4444" />
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Problemas identificados
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {strategy.problems.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, flexShrink: 0,
                        width: 16, height: 16, borderRadius: 4, marginTop: 1,
                        backgroundColor: '#FEF2F2', color: '#EF4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* KPIs */}
              <div style={{ backgroundColor: C.card, border: '1px solid #93C5FD30', borderRadius: 12, padding: 16, borderLeft: '3px solid #3B82F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Target size={13} color="#3B82F6" />
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    KPIs objetivo
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {strategy.kpis.map((k, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 8, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE30' }}>
                      <CheckCircle2 size={13} color="#3B82F6" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.5 }}>{k}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Strategies */}
            <div style={{ backgroundColor: C.card, border: '1px solid #86EFAC30', borderRadius: 12, padding: 16, borderLeft: '3px solid #10B981' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Zap size={13} color="#10B981" />
                <p style={{ fontSize: 10, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Estrategias acordadas
                </p>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, backgroundColor: '#D1FAE5', color: '#10B981' }}>
                  {strategy.strategies.length} iniciativas
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {strategy.strategies.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: '9px 11px', borderRadius: 8,
                    backgroundColor: '#F0FDF4', border: '1px solid #86EFAC30',
                  }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, flexShrink: 0,
                      width: 16, height: 16, borderRadius: 4, marginTop: 1,
                      backgroundColor: '#D1FAE5', color: '#10B981',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{i + 1}</span>
                    <span style={{ fontSize: 11, color: C.sub, lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── All Tasks ────────────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Todas las tareas · {filteredTasks.length}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={() => setAreaFilter('')} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                cursor: 'pointer', border: 'none',
                color: !areaFilter ? '#FFFFFF' : C.muted,
                backgroundColor: !areaFilter ? clientColor : 'transparent',
              }}>Todas</button>
              {(['copy', 'trafico', 'tech', 'admin', 'edicion'] as Area[]).map(area => (
                <button key={area} onClick={() => setAreaFilter(area)} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                  cursor: 'pointer', border: 'none',
                  color: areaFilter === area ? '#FFFFFF' : C.muted,
                  backgroundColor: areaFilter === area ? clientColor : 'transparent',
                }}>
                  {AREA_LABELS[area]}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <div className="w-6 h-6 rounded-full border-2 border-transparent border-t-current animate-spin" style={{ color: clientColor }} />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: C.muted, fontSize: 13 }}>
              No hay tareas para este filtro
            </div>
          ) : filteredTasks.map((task, i) => (
            <div
              key={task.id}
              onClick={() => ctx?.openTaskDetail?.(task)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px',
                borderBottom: i < filteredTasks.length - 1 ? `1px solid ${C.border}` : 'none',
                borderLeft: `3px solid ${STATUS_COLORS[task.status]}40`,
                backgroundColor: '#FFFFFF', transition: 'background 0.12s', cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F6FF')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
            >
              <PriorityDot priority={task.priority} />
              <span style={{
                flex: 1, fontSize: 12, fontWeight: 500,
                color: task.status === 'hecho' ? C.muted : C.text,
                textDecoration: task.status === 'hecho' ? 'line-through' : 'none',
              }}>
                {task.title}
              </span>
              {task.campaign && (
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4, flexShrink: 0,
                  backgroundColor: `${CAMPAIGN_TYPE_COLORS[task.campaign.type as keyof typeof CAMPAIGN_TYPE_COLORS] ?? C.accent}15`,
                  color: CAMPAIGN_TYPE_COLORS[task.campaign.type as keyof typeof CAMPAIGN_TYPE_COLORS] ?? C.accent,
                }}>
                  {task.campaign.name}
                </span>
              )}
              <AreaBadge area={task.area} size="xs" />
              <AssigneeAvatar name={task.assignee} size="sm" />
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                backgroundColor: C.bg, color: C.muted, flexShrink: 0,
              }}>
                S{task.week}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
                backgroundColor: `${STATUS_COLORS[task.status]}15`,
                color: STATUS_COLORS[task.status],
              }}>
                {STATUS_LABELS[task.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
