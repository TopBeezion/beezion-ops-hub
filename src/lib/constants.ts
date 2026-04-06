import type { Area, Priority, TaskStatus, TaskTipo } from '../types'

export const AREA_LABELS: Record<Area, string> = {
  copy: 'Copy',
  trafico: 'Tráfico',
  tech: 'Tech',
  admin: 'Admin',
}

export const AREA_COLORS: Record<Area, string> = {
  copy: '#818cf8',
  trafico: '#4ade80',
  tech: '#60a5fa',
  admin: '#fbbf24',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  alta: '#f87171',
  media: '#fbbf24',
  baja: '#6b7280',
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En Progreso',
  revision: 'En Revisión',
  completado: 'Completado',
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  pendiente: '#6b7280',
  en_progreso: '#60a5fa',
  revision: '#fbbf24',
  completado: '#4ade80',
}

export const TIPO_LABELS: Record<TaskTipo, string> = {
  nuevo: 'Nuevo',
  pendiente_anterior: 'Pendiente Anterior',
  urgente: 'Urgente',
}

export const WEEKS = [1, 2, 3, 4] as const
