import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProject } from '../lib/projects'
import { useProjects } from '../hooks/useProjects'
import type { ProjectInput } from '../types/project'

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

interface FormState {
  project_name: string
  start_date: string
  capital_invested: string
  revenue: string
  cost_percentage: string
  split_percentage: string
  notes: string
}

const initialState: FormState = {
  project_name: '',
  start_date: '',
  capital_invested: '',
  revenue: '',
  cost_percentage: '10',
  split_percentage: '50',
  notes: '',
}

export default function ProjectForm({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { refresh } = useProjects()
  const [form, setForm] = useState<FormState>(initialState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function numberOrDefault(value: string, fallback: number): number {
    if (value.trim() === '') return fallback
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = form.project_name.trim()
    if (!name) {
      setError('Project name is required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const input: ProjectInput = {
        project_name: name,
        start_date: form.start_date || null,
        capital_invested: numberOrDefault(form.capital_invested, 0),
        revenue: numberOrDefault(form.revenue, 0),
        cost_percentage: numberOrDefault(form.cost_percentage, 10),
        split_percentage: numberOrDefault(form.split_percentage, 50),
        notes: form.notes || null,
      }
      const created = await createProject(input)
      await refresh()
      onClose()
      navigate(`/projects/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900">Add Project</h2>
        <p className="mb-4 text-sm text-gray-500">Only a project name is required.</p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Project name <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              autoFocus
              value={form.project_name}
              onChange={(e) => update('project_name', e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Start date</span>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => update('start_date', e.target.value)}
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Capital Invested (₱)
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={form.capital_invested}
                onChange={(e) => update('capital_invested', e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                Projected Revenue (₱)
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={form.revenue}
                onChange={(e) => update('revenue', e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Cost %</span>
              <input
                type="number"
                inputMode="decimal"
                value={form.cost_percentage}
                onChange={(e) => update('cost_percentage', e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Split %</span>
              <input
                type="number"
                inputMode="decimal"
                value={form.split_percentage}
                onChange={(e) => update('split_percentage', e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={2}
              className={inputClass}
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
