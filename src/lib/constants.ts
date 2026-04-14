import type { Area, Priority, TaskStatus, TaskTipo, CampaignType, CampaignStatus, Etapa, MiniStatus, TeamRole } from '../types'

// ── Area ─────────────────────────────────────────────────────
export const AREA_LABELS: Record<Area, string> = {
  copy: 'Copy',
  produccion: 'Producción',
  edicion: 'Edición',
  trafico: 'Tráfico',
  tech: 'Tech',
  admin: 'Admin',
}

export const AREA_COLORS: Record<Area, string> = {
  copy: '#818cf8',
  produccion: '#f59e0b',
  edicion: '#ec4899',
  trafico: '#4ade80',
  tech: '#60a5fa',
  admin: '#fbbf24',
}

// Mapping etapa → area (auto-derivación; puede sobreescribirse manualmente)
export const ETAPA_TO_AREA: Record<Etapa, Area> = {
  copy: 'copy',
  scripts: 'copy',
  landing_page: 'copy',
  lead_magnet: 'copy',
  produccion: 'produccion',
  edicion: 'edicion',
  tracking: 'trafico',
  estructuracion: 'trafico',
}

// ── Priority ─────────────────────────────────────────────────
export const PRIORITY_LABELS: Record<Priority, string> = {
  alerta_roja: '🚨 Alerta Roja',
  alta:  'Alta',
  media: 'Media',
  baja:  'Baja',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  alerta_roja: '#DC2626',
  alta: '#EF4444',
  media: '#F59E0B',
  baja: '#9CA3AF',
}

export const PRIORITY_ORDER: Priority[] = ['alerta_roja', 'alta', 'media', 'baja']

// Derivar priority desde due_date (match exacto con trigger SQL)
export function priorityFromDueDate(dueDate?: string | null): Priority {
  if (!dueDate) return 'baja'
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000)
  if (days <= 0) return 'alerta_roja'
  if (days <= 3) return 'alta'
  if (days <= 7) return 'media'
  return 'baja'
}

// ── Task Status (V2) ──────────────────────────────────────────
export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo:        'Todo',
  en_progreso: 'En Proceso',
  revision:    'Revisión',
  bloqueado:   'Bloqueado',
  hecho:       'Hecho',
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  todo:        '#9699B0',
  en_progreso: '#3B82F6',
  revision:    '#8B5CF6',
  bloqueado:   '#EF4444',
  hecho:       '#10B981',
}

export const STATUS_ORDER: TaskStatus[] = ['todo', 'en_progreso', 'revision', 'bloqueado', 'hecho']

// Back-compat: status viejos → V2 (para lectura de datos legacy)
export const LEGACY_STATUS_MAP: Record<string, TaskStatus> = {
  pendiente: 'todo',
  completado: 'hecho',
}
export function normalizeStatus(s?: string | null): TaskStatus {
  if (!s) return 'todo'
  if ((STATUS_ORDER as string[]).includes(s)) return s as TaskStatus
  return LEGACY_STATUS_MAP[s] ?? 'todo'
}

// ── Task Tipo ─────────────────────────────────────────────────
export const TIPO_LABELS: Record<TaskTipo, string> = {
  nuevo: 'Nuevo',
  pendiente_anterior: 'Pendiente Anterior',
  urgente: 'Urgente',
}

// ── Campaign Type ─────────────────────────────────────────────
export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  nueva_campana: 'Nueva Campaña',
  iteracion: 'Iteración',
  refresh: 'Refresh',
  bombero: '🔥 Bombero',
}

export const CAMPAIGN_TYPE_COLORS: Record<CampaignType, string> = {
  nueva_campana: '#6366F1',
  iteracion: '#3B82F6',
  refresh: '#F59E0B',
  bombero: '#EF4444',
}

// ── Campaign Status ───────────────────────────────────────────
export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  activa: 'Activa',
  pausada: 'Pausada',
  desactivada: 'Desactivada',
}

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  activa: '#00C875',
  pausada: '#FDAB3D',
  desactivada: '#C4C4C4',
}

// ── Etapas (V2 — 8, sin revisión final) ──────────────────────
export const ETAPA_LABELS: Record<Etapa, string> = {
  copy: 'Copy',
  scripts: 'Scripts',
  produccion: 'Producción',
  edicion: 'Edición',
  landing_page: 'Landing Page',
  lead_magnet: 'Lead Magnet',
  tracking: 'Tracking',
  estructuracion: 'Estructuración',
}

export const ETAPA_COLORS: Record<Etapa, string> = {
  copy: '#818CF8',
  scripts: '#A78BFA',
  produccion: '#F59E0B',
  edicion: '#EC4899',
  landing_page: '#3B82F6',
  lead_magnet: '#10B981',
  tracking: '#0EA5E9',
  estructuracion: '#A855F7',
}

export const ETAPA_ORDER: Etapa[] = [
  'copy',
  'scripts',
  'produccion',
  'edicion',
  'landing_page',
  'lead_magnet',
  'tracking',
  'estructuracion',
]

// ── Mini Status ───────────────────────────────────────────────
export const MINI_STATUS_LABELS: Record<MiniStatus, string> = {
  aprobacion_interna: 'Aprobación Interna',
  correcciones: 'Correcciones',
  enviado_cliente: 'Enviado al Cliente',
  ajustes_cliente: 'Ajustes Cliente',
  aprobado: '✓ Aprobado',
}

export const MINI_STATUS_COLORS: Record<MiniStatus, string> = {
  aprobacion_interna: '#818CF8',
  correcciones: '#FBBF24',
  enviado_cliente: '#60A5FA',
  ajustes_cliente: '#F97316',
  aprobado: '#00C875',
}

export const MINI_STATUS_ORDER: MiniStatus[] = [
  'aprobacion_interna',
  'correcciones',
  'enviado_cliente',
  'ajustes_cliente',
  'aprobado',
]

// ── Client colors ─────────────────────────────────────────────
export const CLIENT_COLORS: Record<string, string> = {
  'Bink': '#ec4899',
  'On The Fuze': '#f97316',
  'OTF': '#f97316',
  'Dapta': '#10b981',
  'Finkargo': '#3b82f6',
  'Treble': '#94a3b8',
  'ColombiatechWeek': '#5d00ff',
  'CTW': '#5d00ff',
}

// ── Team members ──────────────────────────────────────────────
export const TEAM_MEMBERS = [
  'Alejandro', 'Alec', 'Jose', 'Luisa',
  'Paula', 'David', 'Johan', 'Felipe', 'TBD',
]

// Admin-plus: únicos que pueden marcar Revisión Final + ver Team Capacity
export const ADMIN_PLUS_EMAILS = [
  'alejosarmi@beezion.com',
  'aleciriarte@beezion.com',
  'paula@beezion.com',
]

export const ADMIN_PLUS_NAMES = ['Alejandro', 'Alec', 'Paula']

export function isAdminPlus(user?: { email?: string; role?: string; name?: string } | null): boolean {
  if (!user) return false
  if (user.role === 'admin_plus') return true
  if (user.email && ADMIN_PLUS_EMAILS.includes(user.email.toLowerCase())) return true
  if (user.name && ADMIN_PLUS_NAMES.includes(user.name)) return true
  return false
}

// Cargos del equipo
export const TEAM_ROLES: Record<string, string> = {
  Alejandro: 'CEO · Copy · Estrategia',
  Alec: 'Head of Paid · Estrategia',
  Jose: 'Trafficker',
  Luisa: 'Copywriter',
  Felipe: 'Editor',
  Johan: 'Editor',
  David: 'Editor',
  Paula: 'Aux. Marketing · Grabaciones',
  TBD: 'Por definir',
}

export const ASSIGNEE_COLORS: Record<string, string> = {
  Alejandro: '#8B5CF6',
  Alec: '#F59E0B',
  Jose: '#3B82F6',
  Paula: '#EC4899',
  David: '#06B6D4',
  Johan: '#10B981',
  Felipe: '#F97316',
  Luisa: '#EF4444',
  TBD: '#9CA3AF',
}

export const WEEKS = [1, 2, 3, 4] as const

// ── Backlog: columnas disponibles (para show/hide) ────────────
export const BACKLOG_COLUMNS = [
  { key: 'title', label: 'Task Name', required: true },
  { key: 'client', label: 'Cliente' },
  { key: 'campaign', label: 'Campaña' },
  { key: 'etapa', label: 'Etapa' },
  { key: 'status', label: 'Status' },
  { key: 'mini_status', label: 'Mini-Status' },
  { key: 'priority', label: 'Prioridad' },
  { key: 'area', label: 'Área' },
  { key: 'assignee', label: 'Responsable' },
  { key: 'due_date', label: 'Fecha Entrega' },
  { key: 'created_at', label: 'Fecha Creación' },
  { key: 'duration_days', label: 'Duración' },
  { key: 'cantidad_hooks', label: 'Cant. Hooks' },
  { key: 'attachments', label: 'Attachments' },
] as const

export const DEFAULT_BACKLOG_COLUMNS = [
  'title', 'client', 'campaign', 'etapa', 'status', 'priority', 'assignee', 'due_date',
]

// ── Kanban: groupBy options ───────────────────────────────────
export const KANBAN_GROUP_BY_OPTIONS = [
  { key: 'etapa', label: 'Etapa' },
  { key: 'status', label: 'Status' },
  { key: 'assignee', label: 'Responsable' },
  { key: 'priority', label: 'Prioridad' },
  { key: 'area', label: 'Área' },
  { key: 'client', label: 'Cliente' },
] as const

export const DEFAULT_KANBAN_CARD_FIELDS = [
  'client', 'etapa', 'priority', 'assignee', 'due_date',
]
