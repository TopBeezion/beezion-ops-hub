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
      'Revisar y ajustar los 16 hooks existentes que Alec envió a Alejandro — ajustar tono y mensaje por ICP',
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
      'Crear 3 lead magnets de HubSpot para captura tráfico frío: (1) HubSpot Sales Audit checklist, (2) HubSpot Implementation Checklist, (3) Sales Process Checklist — cada uno con PDF + landing copy + 3 hooks',
      'Quiz funnel "What\'s the ROI of your HubSpot?" — 8 preguntas + 3 resultados posibles + Thank You Page con urgencia para scheduling',
      'Actualizar booking page: nuevo BCL (video) + urgencia estadística + escasez (X spots disponibles este mes)',
      'Urgencia basada en estadística: "7 de cada 10 empresas que llegan a nosotros omiten mejorar sus resultados por no tomar acción"',
      'Lanzar campaña awareness + retargeting para visitantes que llegaron a landing pero no descargaron lead magnet',
      'Testear YouTube display ads en videos del canal de On The Fuze — usar inventario propio para retargeting',
      'Reservar presupuesto para test en Mayo: video estilo Wilson Luna con Gabriel como cara del contenido',
    ],
    kpis: ['Estabilizar flujo de MQLs semana a semana', 'Reducir CPL', 'Aumentar booking rate desde landing'],
  },
  Finkargo: {
    problems: [
      'MQLs bajos tanto en Colombia como en México — volumen insuficiente para el equipo comercial',
      'Baja conversión FOB a pitch — leads que califican como FOB (Free on Board) no avanzan a presentación',
      'Falta de datos de contactabilidad — no se sabe cuántos FOB contactados respondieron vs no respondieron',
      'BCL pendiente de producción desde sprint anterior — bloqueando activación de Thank You Page',
      'Sin lead magnet activo para captura de tráfico frío en importadores',
    ],
    strategies: [
      'Producir BCL Finkargo (ya aprobado conceptualmente) y subir a Thank You Page como activación inmediata post-registro',
      'Crear lead magnet: "Calculadora de costos para importadores" — herramienta interactiva que calcule ahorro potencial con Finkargo',
      'Pedir métricas de contactabilidad a Figueroa (equipo comercial): FOB contactados vs respondidos — URGENTE para semana actual',
      'Configurar lista FOB calificados en Meta y lanzar campaña de remarketing segmentada',
      'Copy anuncio remarketing FOB: "Aprobamos hasta $3M en 48 horas" — 4 hooks + 1 body copy + 1 CTA',
      'Implementar alertas automáticas en sistema cuando un crédito está próximo a vencer — retención y reactivación',
      'Crear carrusel de testimonios escritos de importadores que ya usaron Finkargo — 5 slides',
      'Crear template de reporte quincenal de performance para alinear expectativas con cliente',
      'Presentación Q1 para reunión con cliente: resultados vs expectativas + cuello de botella identificado + estrategia Abril',
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
      'Enviar propuestas de nuevos headlines para landing + anuncios — 5 opciones + 3 variaciones de CTA para que Alejandro revise y elija',
      'Escribir nuevos hooks para ads "Talk to Sale" y "Registros" con enfoque completamente diferente al actual — 6 hooks + 1 CTA + 1 body copy',
      'Estructurar campaña awareness transversal para ampliar el embudo superior',
      'Auditoría completa de la landing page: diseño, contraste de colores, claridad del CTA, modernidad visual — proponer mejoras concretas',
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

  const clientColor = client?.color || '#f5a623'

  return (
    <div className="space-y-5">
      {/* Client hero header */}
      <div
        className="relative overflow-hidden px-6 pt-6 pb-5"
        style={{
          background: `linear-gradient(135deg, ${clientColor}12 0%, rgba(12,14,26,0) 60%)`,
          borderBottom: `1px solid ${clientColor}20`,
        }}
      >
        {/* Large faded letter background */}
        <div
          className="absolute right-6 top-1/2 -translate-y-1/2 text-[120px] font-black select-none pointer-events-none"
          style={{ color: `${clientColor}06`, lineHeight: 1 }}
        >
          {client?.name[0]}
        </div>

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0"
              style={{
                background: `linear-gradient(135deg, ${clientColor}30, ${clientColor}10)`,
                color: clientColor,
                border: `1px solid ${clientColor}40`,
                boxShadow: `0 0 20px ${clientColor}20`,
              }}
            >
              {client?.name[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: '#f0f2ff' }}>
                {client?.name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[11px] font-medium" style={{ color: '#6b7099' }}>
                  {tasks.length} tareas totales
                </span>
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${clientColor}15`,
                    color: clientColor,
                    border: `1px solid ${clientColor}30`,
                  }}
                >
                  {progress}% completado
                </span>
              </div>
            </div>
          </div>

          {/* Progress ring */}
          <div className="relative shrink-0">
            <svg width={64} height={64} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={32} cy={32} r={26} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={3} />
              <circle
                cx={32} cy={32} r={26}
                fill="none"
                stroke={clientColor}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - progress / 100)}
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold tabular-nums" style={{ color: clientColor }}>
                {progress}%
              </span>
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mt-4">
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${clientColor}, ${clientColor}88)`,
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </div>
        </div>
      </div>

      <div className="px-6 space-y-5">
      {/* Status breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tasksByStatus.map(({ status, tasks: statusTasks }) => (
          <div
            key={status}
            className="rounded-xl p-3"
            style={{
              backgroundColor: '#13152a',
              border: `1px solid ${STATUS_COLORS[status]}20`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[status], boxShadow: `0 0 4px ${STATUS_COLORS[status]}` }}
              />
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6b7099' }}>
                {STATUS_LABELS[status]}
              </p>
            </div>
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: statusTasks.length > 0 ? STATUS_COLORS[status] : '#3d4268' }}
            >
              {statusTasks.length}
            </p>
          </div>
        ))}
      </div>

      {/* Strategy */}
      {strategy && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Problems */}
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: '#13152a',
                border: '1px solid rgba(248,113,113,0.2)',
                background: 'linear-gradient(135deg, rgba(248,113,113,0.04) 0%, #13152a 50%)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f87171' }} />
                <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#f87171' }}>
                  Problemas identificados
                </h2>
              </div>
              <ul className="space-y-2">
                {strategy.problems.map((p, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span
                      className="text-[9px] font-bold mt-0.5 shrink-0 w-4 h-4 rounded flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(248,113,113,0.12)', color: '#f87171' }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-xs leading-relaxed" style={{ color: '#c8cbec' }}>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* KPIs */}
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: '#13152a',
                border: '1px solid rgba(96,165,250,0.2)',
                background: 'linear-gradient(135deg, rgba(96,165,250,0.04) 0%, #13152a 50%)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#60a5fa' }} />
                <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#60a5fa' }}>
                  KPIs objetivo
                </h2>
              </div>
              <ul className="space-y-2">
                {strategy.kpis.map((k, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span
                      className="text-[10px] shrink-0 mt-0.5"
                      style={{ color: '#60a5fa' }}
                    >
                      ◎
                    </span>
                    <span className="text-xs leading-relaxed font-medium" style={{ color: '#c8cbec' }}>{k}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Strategies */}
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: '#13152a',
              border: '1px solid rgba(74,222,128,0.2)',
              background: 'linear-gradient(135deg, rgba(74,222,128,0.03) 0%, #13152a 50%)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4ade80' }} />
              <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#4ade80' }}>
                Estrategias acordadas
              </h2>
              <span
                className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(74,222,128,0.12)', color: '#4ade80' }}
              >
                {strategy.strategies.length} iniciativas
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {strategy.strategies.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg p-2.5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                >
                  <span
                    className="text-[9px] font-black shrink-0 w-4 h-4 rounded flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: 'rgba(74,222,128,0.12)', color: '#4ade80' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs leading-relaxed" style={{ color: '#c8cbec' }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#3d4268' }}>
            Tareas del sprint
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setAreaFilter('')}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
              style={{
                color: !areaFilter ? '#f0f2ff' : '#6b7099',
                backgroundColor: !areaFilter ? 'rgba(255,255,255,0.07)' : 'transparent',
                border: `1px solid ${!areaFilter ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
              }}
            >
              Todas
            </button>
            {(['copy', 'trafico', 'tech', 'admin'] as Area[]).map(area => (
              <button
                key={area}
                onClick={() => setAreaFilter(area)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                style={{
                  color: areaFilter === area ? '#f0f2ff' : '#6b7099',
                  backgroundColor: areaFilter === area ? 'rgba(255,255,255,0.07)' : 'transparent',
                  border: `1px solid ${areaFilter === area ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
                }}
              >
                {AREA_LABELS[area]}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div
              className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: clientColor, borderTopColor: 'transparent' }}
            />
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: '#13152a',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {filteredTasks.map((task, i) => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-4 py-2.5 group hover:bg-white/[0.02] transition-colors"
                style={{
                  borderBottom: i < filteredTasks.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                  borderLeft: `2px solid ${clientColor}30`,
                }}
              >
                <PriorityDot priority={task.priority} />
                <span
                  className="flex-1 text-xs font-medium"
                  style={{
                    color: task.status === 'completado' ? '#3d4268' : '#c8cbec',
                    textDecoration: task.status === 'completado' ? 'line-through' : 'none',
                  }}
                >
                  {task.title}
                </span>
                <AreaBadge area={task.area} size="xs" />
                <AssigneeAvatar name={task.assignee} size="sm" />
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#6b7099' }}
                  title={['', 'S1: Copy & Briefs', 'S2: Producción & Diseño', 'S3: Dev & Setup', 'S4: Launch & Optim.'][task.week]}
                >
                  S{task.week}
                </span>
                <StatusSelect
                  status={task.status}
                  onChange={status => updateStatus.mutate({ id: task.id, status })}
                />
              </div>
            ))}
            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-sm" style={{ color: '#3d4268' }}>
                No hay tareas para este filtro
              </div>
            )}
          </div>
        )}
      </div>
      </div>{/* end px-6 wrapper */}
    </div>
  )
}
