export type ProjectStatus = 'active' | 'archived'

export interface Project {
  id: string
  project_name: string
  start_date: string | null
  capital_invested: number
  revenue: number
  cost_percentage: number
  split_percentage: number
  notes: string | null
  status: ProjectStatus
  created_at: string
  updated_at: string
}

/** Shape used when creating a new project. Only the name is required. */
export interface ProjectInput {
  project_name: string
  start_date?: string | null
  capital_invested?: number
  revenue?: number
  cost_percentage?: number
  split_percentage?: number
  notes?: string | null
}

/** Editable subset of a project (everything except calculated/system fields). */
export type ProjectPatch = Partial<
  Pick<
    Project,
    | 'project_name'
    | 'start_date'
    | 'capital_invested'
    | 'revenue'
    | 'cost_percentage'
    | 'split_percentage'
    | 'notes'
    | 'status'
  >
>

/** Calculated, display-only financial figures derived from a project. */
export interface Financials {
  totalCost: number
  profit: number
  splitAmount: number
  roi: number
  finalAmount: number
}

export interface ProjectCapitalEntry {
  id: string
  project_id: string
  amount: number
  note: string | null
  updated_by: string
  created_at: string
}

export interface ProjectAuditLog {
  id: string
  project_id: string
  updated_by: string
  action: string
  details: string
  created_at: string
}

export interface AddCapitalInput {
  amount: number
  updated_by: string
  note?: string | null
}

export interface AuditMetadata {
  updated_by: string
}
