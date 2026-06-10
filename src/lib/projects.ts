import { supabase } from './supabaseClient'
import type {
  AddCapitalInput,
  AuditMetadata,
  Project,
  ProjectAuditLog,
  ProjectInput,
  ProjectPatch,
} from '../types/project'
import { buildProjectUpdateDetails } from './auditDetails'
import { formatPHP } from './formatters'

const TABLE = 'projects'
const CAPITAL_TABLE = 'project_capital_entries'
const AUDIT_TABLE = 'project_audit_logs'

/** Fetches all active projects, ordered alphabetically for the sidebar. */
export async function getActiveProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('status', 'active')
    .order('project_name', { ascending: true })

  if (error) throw error
  return data ?? []
}

/** Fetches all archived projects. */
export async function getArchivedProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('status', 'archived')
    .order('project_name', { ascending: true })

  if (error) throw error
  return data ?? []
}

/** Fetches a single project by id. */
export async function getProject(id: string): Promise<Project> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single()

  if (error) throw error
  return data
}

/** Inserts a new project and returns the created row. */
export async function createProject(input: ProjectInput): Promise<Project> {
  const { data, error } = await supabase.from(TABLE).insert(input).select().single()

  if (error) throw error
  return data
}

/** Updates editable fields on a project, bumping updated_at, and returns the row. */
export async function updateProject(id: string, patch: ProjectPatch): Promise<Project> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Fetches audit log rows for a project, newest first. */
export async function getProjectAuditLogs(projectId: string): Promise<ProjectAuditLog[]> {
  const { data, error } = await supabase
    .from(AUDIT_TABLE)
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

async function createAuditLog(
  projectId: string,
  updatedBy: string,
  action: string,
  details: string,
): Promise<ProjectAuditLog> {
  const { data, error } = await supabase
    .from(AUDIT_TABLE)
    .insert({
      project_id: projectId,
      updated_by: updatedBy.trim(),
      action,
      details,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/** Updates a project and records a readable audit entry when values changed. */
export async function updateProjectWithAudit(
  id: string,
  patch: ProjectPatch,
  metadata: AuditMetadata,
): Promise<Project> {
  const current = await getProject(id)
  const updated = await updateProject(id, patch)
  const details = buildProjectUpdateDetails(current, patch)

  if (details.length > 0) {
    await createAuditLog(id, metadata.updated_by, 'Updated project', details.join('\n'))
  }

  return updated
}

/** Adds an extra capital entry, increments total capital, and records an audit entry. */
export async function addProjectCapital(
  projectId: string,
  input: AddCapitalInput,
): Promise<Project> {
  const amount = Number.isFinite(input.amount) ? input.amount : 0
  if (amount <= 0) throw new Error('Capital amount must be greater than 0.')

  const current = await getProject(projectId)
  const { error: entryError } = await supabase.from(CAPITAL_TABLE).insert({
    project_id: projectId,
    amount,
    note: input.note?.trim() || null,
    updated_by: input.updated_by.trim(),
  })

  if (entryError) throw entryError

  const updated = await updateProject(projectId, {
    capital_invested: current.capital_invested + amount,
  })

  const note = input.note?.trim() ? ` (${input.note.trim()})` : ''
  await createAuditLog(
    projectId,
    input.updated_by,
    'Added capital',
    `Added capital ${formatPHP(amount)}${note}`,
  )

  return updated
}

/** Soft-deletes a project by setting its status to archived. */
export async function archiveProject(id: string): Promise<Project> {
  return updateProject(id, { status: 'archived' })
}

/** Restores an archived project back to active. */
export async function restoreProject(id: string): Promise<Project> {
  return updateProject(id, { status: 'active' })
}
