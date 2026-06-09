import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import ProjectForm from './ProjectForm'

export default function Layout() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-full min-h-screen bg-gray-100 text-gray-900">
      {/* Backdrop for the mobile drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddProject={() => setShowAddForm(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar with hamburger */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="font-bold text-gray-900">Logistics</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      {showAddForm && <ProjectForm onClose={() => setShowAddForm(false)} />}
    </div>
  )
}
