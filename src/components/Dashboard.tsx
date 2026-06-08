import { useMemo } from 'react'
import { useProjects } from '../hooks/useProjects'
import { computeFinancials } from '../lib/calculations'
import { formatPHP, formatPercent } from '../lib/formatters'
import StatCard from './StatCard'

export default function Dashboard() {
  const { active, loading, error, configured } = useProjects()

  const summary = useMemo(() => {
    const totals = active.reduce(
      (acc, p) => {
        const fin = computeFinancials(p)
        acc.capital += p.capital_invested
        acc.revenue += p.revenue
        acc.cost += fin.totalCost
        acc.profit += fin.profit
        acc.roiSum += fin.roi
        if (!acc.best || fin.roi > acc.best.roi) {
          acc.best = { name: p.project_name, roi: fin.roi }
        }
        return acc
      },
      {
        capital: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        roiSum: 0,
        best: null as { name: string; roi: number } | null,
      },
    )

    const count = active.length
    return {
      ...totals,
      count,
      avgRoi: count > 0 ? totals.roiSum / count : 0,
    }
  }, [active])

  if (!configured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <h2 className="text-lg font-semibold">Supabase not configured</h2>
        <p className="mt-1 text-sm">
          Add <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_URL</code> and{' '}
          <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_ANON_KEY</code> to your{' '}
          <code className="rounded bg-amber-100 px-1">.env</code> file, run the SQL in{' '}
          <code className="rounded bg-amber-100 px-1">supabase/schema.sql</code>, then restart
          the dev server.
        </p>
      </div>
    )
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview across all active projects</p>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Active Projects" value={String(summary.count)} />
          <StatCard label="Total Capital Invested" value={formatPHP(summary.capital)} />
          <StatCard label="Total Revenue" value={formatPHP(summary.revenue)} />
          <StatCard label="Total Cost" value={formatPHP(summary.cost)} />
          <StatCard
            label="Total Profit"
            value={formatPHP(summary.profit)}
            accent={summary.profit >= 0 ? 'positive' : 'negative'}
          />
          <StatCard label="Average ROI" value={formatPercent(summary.avgRoi)} />
          <StatCard
            label="Best ROI Project"
            value={summary.best ? summary.best.name : '—'}
            hint={summary.best ? formatPercent(summary.best.roi) : undefined}
          />
        </div>
      )}
    </div>
  )
}
