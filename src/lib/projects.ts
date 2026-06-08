import { supabase } from './supabaseClient'
import type { Project, ProjectInput, ProjectPatch } from '../types/project'

const TABLE = 'projects'

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

/** Soft-deletes a project by setting its status to archived. */
export async function archiveProject(id: string): Promise<Project> {
  return updateProject(id, { status: 'archived' })
}

/** Restores an archived project back to active. */
export async function restoreProject(id: string): Promise<Project> {
  return updateProject(id, { status: 'active' })
}
