// ── V2 enums ─────────────────────────────────────────────────
export type Area = 'copy' | 'produccion' | 'edicion' | 'trafico' | 'tech' | 'admin'
export type Priority = 'alerta_roja' | 'alta' | 'media' | 'baja'
export type TaskStatus =
  | 'pendiente'
  | 'en_proceso'
  | 'aprobacion_interna'
  | 'correcciones'
  | 'enviado_cliente'
  | 'ajustes_cliente'
  | 'done'
  | 'blocker'

/** @deprecated Legacy alias; mini_status fue consolidado en TaskStatus. */
export type MiniStatus = TaskStatus
export type TaskTipo = 'nuevo' | 'pendiente_anterior' | 'urgente'
export type TeamRole = 'admin_plus' | 'admin' | 'member'

// ── Campaign types ──────────────────────────────────────────
export type CampaignType = 'nueva_campana' | 'iteracion' | 'refresh' | 'bombero'
export type CampaignStatus = 'activa' | 'pausada' | 'desactivada'

// Etapas del flujo (V2 — Scripts y Copy separados; Revisión Final OUT)
export type Etapa =
  | 'copy'
  | 'scripts'
  | 'produccion'
  | 'edicion'
  | 'landing_page'
  | 'lead_magnet'
  | 'tracking'
  | 'estructuracion'

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
  notes?: string
  launch_date?: string
  assignees?: string[]
  revision_final_done?: boolean
  revision_final_by?: string
  revision_final_at?: string
  created_at: string
  updated_at: string
  client?: Client
  tasks?: Task[]
}

export interface TaskAttachment {
  name: string
  url: string
  path?: string
  size?: number
  type?: string
  uploaded_at?: string
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

// Custom fields globales (definición en settings)
export interface CustomFieldDef {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'multiselect' | 'url' | 'date'
  required?: boolean
  options?: string[]
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
  priority_manual_override?: boolean
  status: TaskStatus
  etapa?: Etapa
  week: number
  tipo: TaskTipo
  problema?: string
  source: string
  meeting_date?: string
  due_date?: string
  duration_days?: number
  cantidad_hooks?: number
  custom_fields?: Record<string, unknown>
  created_at: string
  updated_at: string
  created_by?: string
  client?: Client
  campaign?: Campaign
  deliverables?: Deliverables
  attachments?: TaskAttachment[]
}

export interface Subtask {
  id: string
  task_id: string
  title: string
  status: TaskStatus
  assignee?: string | null
  due_date?: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  name: string
  email?: string
  role: TeamRole
  color?: string
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
  priorities?: Priority[]
}

export interface CampaignFilters {
  client_id?: string
  type?: CampaignType
  status?: CampaignStatus
}

// ── Saved Views ──────────────────────────────────────────────
export type ViewScope = 'global' | 'personal'
export type ViewPage = 'backlog' | 'kanban'

export interface ViewConfig {
  id: string
  name: string
  page: ViewPage
  scope: ViewScope
  owner_id?: string
  config: {
    filters?: TaskFilters
    sort?: { column: string; dir: 'asc' | 'desc' }[]
    columns?: string[]          // backlog: columnas visibles
    groupBy?: string            // kanban: etapa/status/assignee/priority/area
    cardFields?: string[]       // kanban: fields visibles en card
  }
  created_at: string
  updated_at: string
}

// ── Activity Log ─────────────────────────────────────────────
export interface TaskActivityEntry {
  id: string
  task_id: string
  actor: string
  action: 'insert' | 'update' | 'delete'
  diff: Record<string, { old: unknown; new: unknown }>
  created_at: string
}

// ── Campaign Template ────────────────────────────────────────
export interface CampaignTemplate {
  id: string
  key: string                  // 'new_campaign', 'iteracion', 'refresh', 'bomberos'
  name: string
  tasks: {
    title: string
    etapa?: Etapa
    area?: Area
    duration_days?: number
  }[]
}

// ── Campaign Progress view row ───────────────────────────────
export interface CampaignProgressRow {
  campaign_id: string
  campaign_name: string
  client_id: string
  client_name?: string
  total_tasks: number
  done_tasks: number
  progress_pct: number
  revision_final_done: boolean
}

// ── Team Capacity view row ───────────────────────────────────
export interface TeamCapacityRow {
  assignee: string
  open_tasks: number
  alerta_roja: number
  alta: number
  media: number
  baja: number
}
