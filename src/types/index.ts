export type Area = 'copy' | 'trafico' | 'tech' | 'admin'
export type Priority = 'alta' | 'media' | 'baja'
export type TaskStatus = 'pendiente' | 'en_progreso' | 'revision' | 'completado'
export type TaskTipo = 'nuevo' | 'pendiente_anterior' | 'urgente'
export type TeamRole = 'admin' | 'maintainer' | 'contributor'

export interface Client {
  id: string
  name: string
  color: string
  active: boolean
  created_at: string
}

export interface Deliverables {
  hooks?: number
  cta?: number
  body_copy?: number
  scripts_video?: number
  landing_copy?: number
  lead_magnet_pdf?: number
  vsl_script?: number
  thank_you_page_copy?: number
  carousel_slides?: number
  quiz_preguntas?: number
  quiz_resultados?: number
  headline_options?: number
  cta_options?: number
  retargeting_scripts?: number
}

export interface Task {
  id: string
  title: string
  description?: string
  client_id?: string
  area: Area
  assignee: string
  priority: Priority
  status: TaskStatus
  week: number
  tipo: TaskTipo
  problema?: string
  source: string
  meeting_date?: string
  created_at: string
  updated_at: string
  client?: Client
  deliverables?: Deliverables
}

export interface TeamMember {
  id: string
  name: string
  email?: string
  role: TeamRole
  color: string
}

export interface MeetingLog {
  id: string
  title?: string
  meeting_date?: string
  transcript?: string
  tasks_extracted: number
  processed: boolean
  created_at: string
}

export interface TaskFilters {
  client_id?: string
  area?: Area
  week?: number
  assignee?: string
  status?: TaskStatus
  priority?: Priority
  search?: string
}
