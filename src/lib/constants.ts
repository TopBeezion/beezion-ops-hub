import type { Area, Priority, TaskStatus, TaskTipo, CampaignType, CampaignStatus, Etapa, MiniStatus } from '../types'

// ── Area ─────────────────────────────────────────────────────
export const AREA_LABELS: Record<Area, string> = {
  copy: 'Copy',
  trafico: 'Tráfico',
  tech: 'Tech',
  admin: 'Admin',
  edicion: 'Edición',
}

export const AREA_COLORS: Record<Area, string> = {
  copy: '#818cf8',
  trafico: '#4ade80',
  tech: '#60a5fa',
  admin: '#fbbf24',
  edicion: '#ec4899',
}

// ── Priority ─────────────────────────────────────────────────
export const PRIORITY_LABELS: Record<Priority, string> = {
  alta:  'Alta',
  media: 'Media',
  baja:  'Baja',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  alta: '#EF4444',
  media: '#F59E0B',
  baja: '#9CA3AF',
}

// ── Task Status ───────────────────────────────────────────────
export const STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente:  'Pendiente',
  en_progreso: 'En Proceso',
  revision:   'Blocker',
  completado: 'Done',
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  pendiente:  '#9699B0',
  en_progreso: '#3B82F6',
  revision:   '#EF4444',
  completado: '#10B981',
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

// ── Etapas ───────────────────────────────────────────────────
export const ETAPA_LABELS: Record<Etapa, string> = {
  copy: 'Copy / Scripts',
  produccion: 'Producción',
  edicion: 'Edición',
  landing_page: 'Landing Page',
  lead_magnet: 'Lead Magnet',
  trafico: 'Tráfico',
  revision_final: 'Revisión Final',
}

export const ETAPA_COLORS: Record<Etapa, string> = {
  copy: '#818CF8',
  produccion: '#F59E0B',
  edicion: '#EC4899',
  landing_page: '#3B82F6',
  lead_magnet: '#10B981',
  trafico: '#F97316',
  revision_final: '#6366F1',
}

export const ETAPA_ORDER: Etapa[] = [
  'copy',
  'produccion',
  'edicion',
  'landing_page',
  'lead_magnet',
  'trafico',
  'revision_final',
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
  'Bink': '#F59E0B',
  'On The Fuze': '#8B5CF6',
  'Dapta': '#3B82F6',
  'Finkargo': '#10B981',
  'Treble': '#EC4899',
  'ColombiatechWeek': '#F97316',
}

// ── Team members ──────────────────────────────────────────────
export const TEAM_MEMBERS = [
  'Alejandro', 'Alec', 'Jose', 'Luisa',
  'Paula', 'David', 'Johan', 'Felipe', 'TBD',
]

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
