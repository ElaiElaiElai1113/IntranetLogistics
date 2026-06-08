import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import ProjectForm from './ProjectForm'

export default function Layout() {
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <div className="flex h-full min-h-screen bg-gray-100 text-gray-900">
      <Sidebar onAddProject={() => setShowAddForm(true)} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">
          <Outlet />
        </div>
      </main>
      {showAddForm && <ProjectForm onClose={() => setShowAddForm(false)} />}
    </div>
  )
}
