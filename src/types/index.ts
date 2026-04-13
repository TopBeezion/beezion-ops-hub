export type Area = 'copy' | 'trafico' | 'tech' | 'admin' | 'edicion'
export type Priority = 'alta' | 'media' | 'baja'
export type TaskStatus = 'pendiente' | 'en_progreso' | 'revision' | 'completado'
export type TaskTipo = 'nuevo' | 'pendiente_anterior' | 'urgente'
export type TeamRole = 'admin' | 'maintainer' | 'contributor'

// ── Campaign types ──────────────────────────────────────────
export type CampaignType = 'nueva_campana' | 'iteracion' | 'refresh' | 'bombero'
export type CampaignStatus = 'activa' | 'pausada' | 'desactivada'

// Etapas del flujo de una campaña
export type Etapa =
  | 'copy'
  | 'produccion'
  | 'edicion'
  | 'landing_page'
  | 'lead_magnet'
  | 'trafico'
  | 'revision_final'

// Mini-status dentro de cada etapa
export type MiniStatus =
  | 'aprobacion_interna'
  | 'correcciones'
  | 'enviado_cliente'
  | 'ajustes_cliente'
  | 'aprobado'

// ── Interfaces ───────────────────────────────────────────────
export interface Client {
  id: string
  name: string
  color: string
  active: boolean
  created_at: string
}

export interface Campaign {
  id: string
  name: string
  client_id: string
  type: CampaignType
  status: CampaignStatus
  objective?: string
  launch_date?: string
  assignees?: string[]
  created_at: string
  updated_at: string
  client?: Client
  tasks?: Task[]
}

export interface TaskAttachment {
  name: string
  url: string
  path: string
  size: number
  type: string
  uploaded_at: string
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
  campaign_id?: string
  area: Area
  assignee: string
  priority: Priority
  status: TaskStatus
  etapa?: Etapa
  mini_status?: MiniStatus
  week: number
  tipo: TaskTipo
  problema?: string
  source: string
  meeting_date?: string
  due_date?: string
  duration_days?: number
  created_at: string
  updated_at: string
  client?: Client
  campaign?: Campaign
  deliverables?: Deliverables
  attachments?: TaskAttachment[]
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
  campaign_id?: string
  area?: Area
  week?: number
  assignee?: string
  status?: TaskStatus
  priority?: Priority
  etapa?: Etapa
  search?: string
}

export interface CampaignFilters {
  client_id?: string
  type?: CampaignType
  status?: CampaignStatus
}
