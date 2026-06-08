import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Project } from '../types/project'
import { getActiveProjects, getArchivedProjects } from '../lib/projects'
import { isSupabaseConfigured } from '../lib/supabaseClient'

interface ProjectsContextValue {
  active: Project[]
  archived: Project[]
  loading: boolean
  error: string | null
  configured: boolean
  /** Re-fetches both active and archived lists from Supabase. */
  refresh: () => Promise<void>
}

const ProjectsContext = createContext<ProjectsContextValue | undefined>(undefined)

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<Project[]>([])
  const [archived, setArchived] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [activeList, archivedList] = await Promise.all([
        getActiveProjects(),
        getArchivedProjects(),
      ])
      setActive(activeList)
      setArchived(archivedList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const value = useMemo<ProjectsContextValue>(
    () => ({ active, archived, loading, error, configured: isSupabaseConfigured, refresh }),
    [active, archived, loading, error, refresh],
  )

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
}

export function useProjects(): ProjectsContextValue {
  const context = useContext(ProjectsContext)
  if (!context) {
    throw new Error('useProjects must be used within a ProjectsProvider')
  }
  return context
}
