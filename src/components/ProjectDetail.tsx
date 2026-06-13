import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { FundingStatus, Project, ProjectAuditLog, ProjectStatus } from '../types/project'
import {
  addProjectCapital,
  getProject,
  getProjectAuditLogs,
  updateProjectWithAudit,
} from '../lib/projects'
import { computeFinancials } from '../lib/calculations'
import { formatPHP, formatPercent } from '../lib/formatters'
import { buildProjectInfoRows } from '../lib/projectInfoRows'
import { useProjects } from '../hooks/useProjects'

interface FormState {
  project_name: string
  start_date: string
  capital_invested: string
  revenue: string
  cost_percentage: string
  split_percentage: string
  notes: string
  status: ProjectStatus
  funding_status: FundingStatus | ''
}

const SYSTEM_UPDATED_BY = 'System'

function toFormState(p: Project): FormState {
  return {
    project_name: p.project_name,
    start_date: p.start_date ?? '',
    capital_invested: String(p.capital_invested),
    revenue: String(p.revenue),
    cost_percentage: String(p.cost_percentage),
    split_percentage: String(p.split_percentage),
    notes: p.notes ?? '',
    status: p.status,
    funding_status: p.funding_status ?? '',
  }
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { refresh } = useProjects()

  const [form, setForm] = useState<FormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [auditLogs, setAuditLogs] = useState<ProjectAuditLog[]>([])
  const [capitalAmount, setCapitalAmount] = useState('')
  const [capitalNote, setCapitalNote] = useState('')
  const [addingCapital, setAddingCapital] = useState(false)
  const [showAddCapital, setShowAddCapital] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([getProject(id), getProjectAuditLogs(id)])
      .then(([p, logs]) => {
        if (!cancelled) {
          setForm(toFormState(p))
          setAuditLogs(logs)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const financials = useMemo(() => {
    if (!form) return null
    return computeFinancials({
      capital_invested: Number(form.capital_invested),
      revenue: Number(form.revenue),
      cost_percentage: Number(form.cost_percentage),
      split_percentage: Number(form.split_percentage),
    })
  }, [form])

  const infoRows = useMemo(() => {
    if (!form) return []
    return buildProjectInfoRows(form)
  }, [form])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
    setSavedAt(null)
  }

  async function refreshProjectDetail() {
    if (!id) return

    const [project, logs] = await Promise.all([getProject(id), getProjectAuditLogs(id)])
    setForm(toFormState(project))
    setAuditLogs(logs)
  }

  async function handleSave() {
    if (!id || !form) return

    setSaving(true)
    setError(null)
    try {
      await updateProjectWithAudit(
        id,
        {
          project_name: form.project_name.trim(),
          start_date: form.start_date || null,
          capital_invested: Number(form.capital_invested) || 0,
          revenue: Number(form.revenue) || 0,
          cost_percentage: Number(form.cost_percentage) || 0,
          split_percentage: Number(form.split_percentage) || 0,
          notes: form.notes || null,
          status: form.status,
          funding_status: form.funding_status || null,
        },
        { updated_by: SYSTEM_UPDATED_BY },
      )
      await refresh()
      await refreshProjectDetail()
      setSavedAt(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive() {
    if (!id) return

    setSaving(true)
    setError(null)
    try {
      await updateProjectWithAudit(id, { status: 'archived' }, { updated_by: SYSTEM_UPDATED_BY })
      await refresh()
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive')
      setSaving(false)
    }
  }

  async function handleAddCapital() {
    if (!id) return

    const amount = Number(capitalAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Capital amount must be greater than 0.')
      return
    }

    setAddingCapital(true)
    setError(null)
    try {
      await addProjectCapital(id, {
        amount,
        updated_by: SYSTEM_UPDATED_BY,
        note: capitalNote || null,
      })
      setCapitalAmount('')
      setCapitalNote('')
      setShowAddCapital(false)
      await refresh()
      await refreshProjectDetail()
      setSavedAt(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add capital')
    } finally {
      setAddingCapital(false)
    }
  }

  if (loading) return <p className="text-gray-400">Loading…</p>
  if (error && !form)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  if (!form || !financials) return null

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {form.project_name || 'Untitled project'}
          </h1>
          <p className="text-sm text-gray-500">Edit figures, then save to Supabase.</p>
        </div>
        <button
          type="button"
          onClick={handleArchive}
          disabled={saving}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Archive
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Editable inputs */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Details
          </h2>
          <div className="space-y-4">
            <TextField
              label="Project name"
              value={form.project_name}
              onChange={(v) => update('project_name', v)}
            />
            <Field label="Funding">
              <select
                value={form.funding_status}
                onChange={(e) => update('funding_status', e.target.value as FundingStatus | '')}
                className={inputClass}
              >
                <option value="">Unset</option>
                <option value="full">Full</option>
                <option value="partial">Partial</option>
              </select>
            </Field>
            <Field label="Start date">
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => update('start_date', e.target.value)}
                className={inputClass}
              />
            </Field>
            <NumberField
              label="Capital invested (₱)"
              value={form.capital_invested}
              onChange={(v) => update('capital_invested', v)}
            />
            <div>
              <button
                type="button"
                onClick={() => setShowAddCapital((value) => !value)}
                className="rounded-md border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                Add Capital
              </button>

              {showAddCapital && (
                <div className="mt-3 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <NumberField
                    label="Additional capital (₱)"
                    value={capitalAmount}
                    onChange={setCapitalAmount}
                  />
                  <TextField label="Note" value={capitalNote} onChange={setCapitalNote} />
                  <button
                    type="button"
                    onClick={handleAddCapital}
                    disabled={addingCapital}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addingCapital ? 'Adding...' : 'Save Added Capital'}
                  </button>
                </div>
              )}
            </div>
            <NumberField
              label="Projected revenue (₱)"
              value={form.revenue}
              onChange={(v) => update('revenue', v)}
            />
            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="Cost %"
                value={form.cost_percentage}
                onChange={(v) => update('cost_percentage', v)}
              />
              <NumberField
                label="Split %"
                value={form.split_percentage}
                onChange={(v) => update('split_percentage', v)}
              />
            </div>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value as ProjectStatus)}
                className={inputClass}
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={3}
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        {/* Read-only source information */}
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Information
          </h2>
          <dl className="space-y-3">
            {infoRows.map((row) => (
              <InfoRow key={row.label} label={row.label} value={row.value} />
            ))}
          </dl>
        </section>

        {/* Calculated, read-only figures */}
        <section className="rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Calculated
          </h2>
          <dl className="space-y-3">
            <CalcRow
              label="Capital invested"
              value={formatPHP(Number(form.capital_invested) || 0)}
            />
            <CalcRow label="Total cost" value={formatPHP(financials.totalCost)} />
            <CalcRow
              label="Profit Split"
              value={formatPHP(financials.splitAmount)}
              accent={financials.splitAmount >= 0 ? 'positive' : 'negative'}
            />
            <CalcRow label="ROI" value={formatPercent(financials.roi)} />
            <div className="border-t border-gray-200 pt-3">
              <CalcRow
                label="Total Return (Profit + Capital)"
                value={formatPHP(financials.finalAmount)}
                emphasize
              />
            </div>
          </dl>
        </section>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || addingCapital || !form.project_name.trim()}
          className="w-full rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {savedAt && <span className="text-sm text-green-600">Saved ✓</span>}
      </div>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Audit Log
        </h2>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-gray-400">No changes recorded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {auditLogs.map((log) => (
              <li key={log.id} className="py-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-gray-900">{log.action}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.created_at).toLocaleString('en-PH')}
                  </p>
                </div>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                  {log.updated_by || 'Unknown'}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-gray-600">{log.details}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  )
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Field label={label}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </Field>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </Field>
  )
}

function CalcRow({
  label,
  value,
  accent = 'default',
  emphasize = false,
}: {
  label: string
  value: string
  accent?: 'default' | 'positive' | 'negative'
  emphasize?: boolean
}) {
  const accentClass =
    accent === 'positive'
      ? 'text-green-600'
      : accent === 'negative'
        ? 'text-red-600'
        : 'text-gray-900'
  return (
    <div className="flex items-center justify-between">
      <dt className={`text-sm ${emphasize ? 'font-semibold text-gray-700' : 'text-gray-500'}`}>
        {label}
      </dt>
      <dd className={`${emphasize ? 'text-lg font-bold' : 'font-medium'} ${accentClass}`}>
        {value}
      </dd>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-gray-900">{value}</dd>
    </div>
  )
}
