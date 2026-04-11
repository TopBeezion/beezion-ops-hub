import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { useTasks, useUpdateTaskStatus } from '../hooks/useTasks'
import { useClients } from '../hooks/useClients'
import type { Area, TaskStatus } from '../types'
import { AREA_LABELS, STATUS_LABELS, STATUS_COLORS } from '../lib/constants'
import { AreaBadge } from '../components/ui/AreaBadge'
import { AssigneeAvatar } from '../components/ui/AssigneeAvatar'
import { PriorityDot } from '../components/ui/PriorityDot'
import { StatusSelect } from '../components/ui/StatusSelect'

// ─── Design tokens (same as Dashboard) ────────────────────────────────────────
const C = {
  bg: '#F0F2F8',
  card: '#FFFFFF',
  border: '#E4E7F0',
  text: '#1A1D27',
  sub: '#5A5E72',
  muted: '#9699B0',
}

// Hardcoded strategic data per client
const CLIENT_STRATEGY: Record<string, { problems: string[]; strategies: string[]; kpis: string[] }> = {
  Dapta: {
    problems: [
      'Payment Approved conversión baja — pocos leads llegan a pagar después del trial',
      'Pocos registros P1/P2 — mayoría de leads son de baja calidad o no califican',
      'Show rate Book Demos menor al 50% — los agendamientos no se concretan',
      'Falta de urgencia en la oferta — el valor del producto no es claro en el top funnel',
    ],
    strategies: [
      'Funnel remarketing 3 videos: Video 1 lead magnet gratis → Video 2 awareness producto → Video 3 testimonios/carrusel',
      'Thank You Page con oferta 50% off inmediatamente al descargar el lead magnet para impulsar upgrade',
      'Configurar P1/P2 como evento de conversión prioritario en Google Ads — dejar de optimizar por volumen de leads',
      'Exportar lista P1/P2 desde HubSpot y subirla a Meta como audiencia + crear lookalike',
      'Análisis de qué campañas traen más P1/P2 separado por desktop vs mobile',
      'Rediseñar landing Book Demo: agregar fricción en el formulario + VSL explicando el valor + urgencia "primeros 20 spots"',
      'Implementar AI voice call (Talk to Dapta) en landing de registros — webhook que llama al lead apenas se registra en Step 1',
      'Copy oferta "primer agente gratis" en booking page para aumentar show rate',
    ],
    kpis: ['Aumentar tasa P1/P2 sobre total leads', 'Show rate Book Demos +50%', 'Payment Approved conversion rate +20%'],
  },
  Bink: {
    problems: [
      'Volumen MQLs bajo — pocos leads calificados llegando al pipeline',
      'Calificación MQL a SQL baja — leads que llegan no convierten en demos reales',
      'Audiencia no segmentada — se habla igual a CFO que ya conoce flexibilización y al que nunca ha escuchado el término',
      'Hooks actuales no están generando suficiente CTR ni enganches',
      'Thank You Page sin urgencia ni oferta clara — no hay acción inmediata del lead',
    ],
    strategies: [
      'Segmentar audiencia en CFO1 (sabe qué es flexibilización salarial, tiene riesgo legal) y CFO2 (no sabe, necesita educación)',
      'CFO1: captions usando "flexibilización informal" como gancho, mensaje sobre riesgo legal + solución Bink. 6 hooks + 1 CTA + 1 body copy',
      'CFO2: captions educativos sobre qué es flexibilización y por qué la necesitan. 6 hooks + 1 CTA + 1 body copy',
      'Lead magnet CFO1: guía "Cómo hacer flexibilización salarial de forma legal" — 1 PDF + landing copy + 3 hooks',
      'Lead magnet CFO2: guía "Qué es la flexibilización salarial y por qué tu empresa la necesita" — 1 PDF + landing copy + 3 hooks',
      'Nuevo formulario de calificación con preguntas específicas: número de empleados, tipo de contratación, situación legal actual',
      'BCL (Bridge/Click/Lead) para landing pages: video largo + botón, sin más información en la página',
      'Thank You Page con urgencia real y escasez (confirmar oferta con Miguel) — no dejar que el lead abandone sin acción',
      'Estructura campañas en 4 grupos: CFO1, CFO2, Competidores (apuntar a usuarios de competencia), Awareness + retargeting por VTR',
      'Scripts 4 videos awareness + 2 videos retargeting por VTR (25%, 50%, 75%)',
      'Revisar y ajustar los 16 hooks existentes — ajustar tono y mensaje por ICP',
    ],
    kpis: ['Aumentar volumen MQLs semanales', 'Mejorar tasa MQL→SQL', 'Reducir CPL por segmento'],
  },
  'On The Fuze': {
    problems: [
      'Semanas irregulares de MQLs — flujo inconsistente, algunas semanas sin leads y otras con picos',
      'Pocos bookings — la oferta en la booking page no genera urgencia ni convicción suficiente',
      'Costo por MQL alto — estructura actual no es eficiente para el volumen objetivo',
      'No hay lead magnets activos generando leads de tráfico frío consistente',
    ],
    strategies: [
      'Crear 3 lead magnets de HubSpot para captura tráfico frío: (1) HubSpot Sales Audit checklist, (2) HubSpot Implementation Checklist, (3) Sales Process Checklist',
      'Quiz funnel "What\'s the ROI of your HubSpot?" — 8 preguntas + 3 resultados posibles + Thank You Page con urgencia',
      'Actualizar booking page: nuevo BCL (video) + urgencia estadística + escasez (X spots disponibles este mes)',
      'Urgencia basada en estadística: "7 de cada 10 empresas omiten mejorar sus resultados por no tomar acción"',
      'Lanzar campaña awareness + retargeting para visitantes que llegaron a landing pero no descargaron lead magnet',
      'Testear YouTube display ads en videos del canal de On The Fuze — usar inventario propio para retargeting',
      'Reservar presupuesto para test en Mayo: video estilo Wilson Luna con Gabriel como cara del contenido',
    ],
    kpis: ['Estabilizar flujo de MQLs semana a semana', 'Reducir CPL', 'Aumentar booking rate desde landing'],
  },
  Finkargo: {
    problems: [
      'MQLs bajos tanto en Colombia como en México — volumen insuficiente para el equipo comercial',
      'Baja conversión FOB a pitch — leads que califican como FOB no avanzan a presentación',
      'Falta de datos de contactabilidad — no se sabe cuántos FOB contactados respondieron',
      'BCL pendiente de producción desde sprint anterior — bloqueando activación de Thank You Page',
      'Sin lead magnet activo para captura de tráfico frío en importadores',
    ],
    strategies: [
      'Producir BCL Finkargo (ya aprobado conceptualmente) y subir a Thank You Page como activación inmediata',
      'Crear lead magnet: "Calculadora de costos para importadores" — herramienta interactiva de ahorro potencial',
      'Pedir métricas de contactabilidad a Figueroa: FOB contactados vs respondidos — URGENTE',
      'Configurar lista FOB calificados en Meta y lanzar campaña de remarketing segmentada',
      'Copy anuncio remarketing FOB: "Aprobamos hasta $3M en 48 horas" — 4 hooks + 1 body copy + 1 CTA',
      'Implementar alertas automáticas cuando un crédito está próximo a vencer — retención y reactivación',
      'Crear carrusel de testimonios escritos de importadores — 5 slides',
      'Crear template de reporte quincenal de performance para alinear expectativas con cliente',
    ],
    kpis: ['Aumentar MQLs Colombia y México', 'Mejorar conversión FOB→pitch', 'Establecer ritmo quincenal de reporte'],
  },
  'Treble.ai': {
    problems: [
      'Conversión visita a click baja — la landing no está convirtiendo tráfico en leads',
      'Meta: 1000 MQLs desde paid media — sin estructura de campaña clara para alcanzar ese objetivo',
      'Hooks y ads actuales no están diferenciados del mercado — mensaje muy similar a competencia',
      'Landing page visualmente desactualizada — diseño, contraste y CTA necesitan revisión urgente',
    ],
    strategies: [
      'Enviar propuestas de nuevos headlines para landing + anuncios — 5 opciones + 3 variaciones de CTA',
      'Escribir nuevos hooks para ads "Talk to Sale" y "Registros" con enfoque completamente diferente — 6 hooks + 1 CTA + 1 body copy',
      'Estructurar campaña awareness transversal para ampliar el embudo superior',
      'Auditoría completa de la landing page: diseño, contraste de colores, claridad del CTA, modernidad visual',
    ],
    kpis: ['Mejorar CTR de ads', 'Aumentar conversión landing', 'Alcanzar 1000 MQLs desde paid'],
  },
}

const STATUSES: TaskStatus[] = ['pendiente', 'en_progreso', 'revision', 'completado']

export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>()
  const { data: clients = [] } = useClients()
  const { data: tasks = [], isLoading } = useTasks({ client_id: clientId })
  const updateStatus = useUpdateTaskStatus()
  const [areaFilter, setAreaFilter] = useState<Area | ''>('')

  const client = clients.find(c => c.id === clientId)

  if (!isLoading && !client) {
    return <Navigate to="/" replace />
  }

  const filteredTasks = areaFilter ? tasks.filter(t => t.area === areaFilter) : tasks
  const completedCount = tasks.filter(t => t.status === 'completado').length
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  const strategy = client ? CLIENT_STRATEGY[client.name] : null

  const tasksByStatus = STATUSES.map(status => ({
    status,
    tasks: tasks.filter(t => t.status === status),
  }))

  const clientColor = client?.color || '#6366F1'

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100%' }}>

      {/* ── Client hero header ── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${clientColor}12 0%, ${C.card} 60%)`,
          borderBottom: `1px solid ${clientColor}25`,
          padding: '20px 24px 16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Faded letter background */}
        <div style={{
          position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
          fontSize: 120, fontWeight: 900, lineHeight: 1,
          color: `${clientColor}06`, pointerEvents: 'none', userSelect: 'none',
        }}>
          {client?.name[0]}
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Avatar */}
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: `linear-gradient(135deg, ${clientColor}25, ${clientColor}10)`,
              border: `1.5px solid ${clientColor}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 900, color: clientColor,
            }}>
              {client?.name[0]}
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>
                {client?.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: C.muted }}>{tasks.length} tareas totales</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                  backgroundColor: `${clientColor}15`, color: clientColor,
                  border: `1px solid ${clientColor}30`,
                }}>
                  {progress}% completado
                </span>
              </div>
            </div>
          </div>

          {/* Progress ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width={60} height={60} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={30} cy={30} r={24} fill="none" stroke={C.border} strokeWidth={3} />
              <circle
                cx={30} cy={30} r={24}
                fill="none" stroke={clientColor} strokeWidth={3} strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 24}
                strokeDashoffset={2 * Math.PI * 24 * (1 - progress / 100)}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, color: clientColor,
            }}>
              {progress}%
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 14, height: 3, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: `linear-gradient(90deg, ${clientColor}, ${clientColor}88)`,
            borderRadius: 3, transition: 'width 0.8s ease',
          }} />
        </div>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Status breakdown ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {tasksByStatus.map(({ status, tasks: st }) => (
            <div key={status} style={{
              backgroundColor: C.card, border: `1px solid ${STATUS_COLORS[status]}20`,
              borderRadius: 12, padding: '12px 14px',
              borderTop: `3px solid ${STATUS_COLORS[status]}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: STATUS_COLORS[status],
                }} />
                <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {STATUS_LABELS[status]}
                </p>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: st.length > 0 ? STATUS_COLORS[status] : C.border, lineHeight: 1 }}>
                {st.length}
              </p>
            </div>
          ))}
        </div>

        {/* ── Strategy ── */}
        {strategy && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

              {/* Problems */}
              <div style={{
                backgroundColor: C.card, border: `1px solid #FCA5A530`,
                borderRadius: 12, padding: 16,
                borderLeft: '3px solid #EF4444',
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  🔴 Problemas identificados
                </p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
                  {strategy.problems.map((p, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, flexShrink: 0,
                        width: 16, height: 16, borderRadius: 4, marginTop: 1,
                        backgroundColor: '#FEF2F2', color: '#EF4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{i + 1}</span>
                      <span style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* KPIs */}
              <div style={{
                backgroundColor: C.card, border: `1px solid #93C5FD30`,
                borderRadius: 12, padding: 16,
                borderLeft: '3px solid #3B82F6',
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  🎯 KPIs objetivo
                </p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
                  {strategy.kpis.map((k, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#3B82F6', flexShrink: 0, marginTop: 2 }}>◎</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.5 }}>{k}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Strategies */}
            <div style={{
              backgroundColor: C.card, border: `1px solid #86EFAC30`,
              borderRadius: 12, padding: 16,
              borderLeft: '3px solid #10B981',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ✅ Estrategias acordadas
                </p>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99,
                  backgroundColor: '#D1FAE5', color: '#10B981',
                }}>
                  {strategy.strategies.length} iniciativas
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {strategy.strategies.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: '8px 10px', borderRadius: 8, backgroundColor: '#F0FDF4',
                    border: '1px solid #86EFAC30',
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

        {/* ── Tasks ── */}
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {/* Task list header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tareas del sprint
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setAreaFilter('')}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                  cursor: 'pointer', border: 'none',
                  color: !areaFilter ? '#FFFFFF' : C.muted,
                  backgroundColor: !areaFilter ? clientColor : 'transparent',
                }}
              >
                Todas
              </button>
              {(['copy', 'trafico', 'tech', 'admin'] as Area[]).map(area => (
                <button
                  key={area}
                  onClick={() => setAreaFilter(area)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                    cursor: 'pointer', border: 'none',
                    color: areaFilter === area ? '#FFFFFF' : C.muted,
                    backgroundColor: areaFilter === area ? clientColor : 'transparent',
                  }}
                >
                  {AREA_LABELS[area]}
                </button>
              ))}
            </div>
          </div>

          {/* Task rows */}
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <div className="w-6 h-6 rounded-full border-2 border-transparent border-t-current animate-spin"
                style={{ color: clientColor }} />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: C.muted, fontSize: 13 }}>
              No hay tareas para este filtro
            </div>
          ) : (
            filteredTasks.map((task, i) => (
              <div
                key={task.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 16px',
                  borderBottom: i < filteredTasks.length - 1 ? `1px solid ${C.border}` : 'none',
                  borderLeft: `3px solid ${clientColor}30`,
                  backgroundColor: '#FFFFFF',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8F9FC')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
              >
                <PriorityDot priority={task.priority} />
                <span style={{
                  flex: 1, fontSize: 12, fontWeight: 500,
                  color: task.status === 'completado' ? C.muted : C.text,
                  textDecoration: task.status === 'completado' ? 'line-through' : 'none',
                }}>
                  {task.title}
                </span>
                <AreaBadge area={task.area} size="xs" />
                <AssigneeAvatar name={task.assignee} size="sm" />
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                  backgroundColor: C.bg, color: C.muted, flexShrink: 0,
                }}
                  title={['', 'S1: Copy & Briefs', 'S2: Producción & Diseño', 'S3: Dev & Setup', 'S4: Launch & Optim.'][task.week]}
                >
                  S{task.week}
                </span>
                <StatusSelect
                  status={task.status}
                  onChange={status => updateStatus.mutate({ id: task.id, status })}
                />
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
