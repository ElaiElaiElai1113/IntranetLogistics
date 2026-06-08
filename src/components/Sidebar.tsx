import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import { restoreProject } from '../lib/projects'

const linkBase =
  'block rounded-md px-3 py-2 text-sm font-medium transition-colors truncate'

function navClass({ isActive }: { isActive: boolean }): string {
  return `${linkBase} ${
    isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
  }`
}

export default function Sidebar({ onAddProject }: { onAddProject: () => void }) {
  const { active, archived, loading, refresh } = useProjects()
  const [showArchived, setShowArchived] = useState(false)

  async function handleRestore(id: string) {
    await restoreProject(id)
    await refresh()
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="px-5 py-5">
        <h1 className="text-lg font-bold text-gray-900">Logistics</h1>
        <p className="text-xs text-gray-500">Project Financials</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <NavLink to="/" end className={navClass}>
          Dashboard
        </NavLink>

        <div className="mt-5 mb-1 flex items-center justify-between px-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Projects
          </span>
        </div>

        {loading && <p className="px-3 py-2 text-sm text-gray-400">Loading…</p>}
        {!loading && active.length === 0 && (
          <p className="px-3 py-2 text-sm text-gray-400">No active projects yet.</p>
        )}

        <div className="space-y-1">
          {active.map((project) => (
            <NavLink
              key={project.id}
              to={`/projects/${project.id}`}
              className={navClass}
            >
              {project.project_name}
            </NavLink>
          ))}
        </div>

        {archived.length > 0 && (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
            >
              <span>Archived ({archived.length})</span>
              <span>{showArchived ? '▾' : '▸'}</span>
            </button>
            {showArchived && (
              <div className="mt-1 space-y-1">
                {archived.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm text-gray-500"
                  >
                    <span className="truncate">{project.project_name}</span>
                    <button
                      type="button"
                      onClick={() => handleRestore(project.id)}
                      className="ml-2 shrink-0 text-xs font-medium text-blue-600 hover:underline"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <button
          type="button"
          onClick={onAddProject}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          + Add Project
        </button>
      </div>
    </aside>
  )
}
