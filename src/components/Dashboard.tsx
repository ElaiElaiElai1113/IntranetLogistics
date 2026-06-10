import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import { computeFinancials } from '../lib/calculations'
import { formatPHP, formatPercent } from '../lib/formatters'
import { buildProjectOverviewRows } from '../lib/projectOverviewRows'
import StatCard from './StatCard'

export default function Dashboard() {
  const { active, loading, error, configured } = useProjects()

  const summary = useMemo(() => {
    const totals = active.reduce(
      (acc, p) => {
        const fin = computeFinancials(p)
        acc.capital += p.capital_invested
        acc.revenue += p.revenue
        acc.profit += fin.splitAmount
        acc.roiSum += fin.roi
        if (!acc.best || fin.roi > acc.best.roi) {
          acc.best = { name: p.project_name, roi: fin.roi }
        }
        return acc
      },
      {
        capital: 0,
        revenue: 0,
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

  const overviewRows = useMemo(() => buildProjectOverviewRows(active), [active])

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
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Active Projects" value={String(summary.count)} />
            <StatCard label="Total Capital Invested" value={formatPHP(summary.capital)} />
            <StatCard label="Projected Revenue" value={formatPHP(summary.revenue)} />
            <StatCard
              label="Total Profit Split"
              value={formatPHP(summary.profit)}
              accent={summary.profit >= 0 ? 'positive' : 'negative'}
            />
            <StatCard label="Average ROI" value={formatPercent(summary.avgRoi)} />
            <StatCard
              label="Best ROI Project"
              value={summary.best ? summary.best.name : '-'}
              hint={summary.best ? formatPercent(summary.best.roi) : undefined}
            />
          </div>

          <section className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                All Projects
              </h2>
            </div>

            {overviewRows.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400">No active projects yet.</p>
            ) : (
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[1150px] divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <TableHead>Project</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead align="right">Days Active</TableHead>
                      <TableHead>Expected Completion</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead align="right">Capital Invested</TableHead>
                      <TableHead align="right">Projected Revenue</TableHead>
                      <TableHead align="right">Profit Split</TableHead>
                      <TableHead align="right">ROI</TableHead>
                      <TableHead align="right">Total Return</TableHead>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {overviewRows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="max-w-[220px] px-4 py-3">
                          <Link
                            to={`/projects/${row.id}`}
                            className="font-semibold text-blue-600 hover:underline"
                          >
                            {row.projectName}
                          </Link>
                        </td>
                        <TableCell>{row.startDate}</TableCell>
                        <TableCell align="right">{row.daysActive}</TableCell>
                        <TableCell>{row.expectedCompletionDate}</TableCell>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusPill label={row.timelineStatus} tone={row.timelineTone} />
                        </td>
                        <TableCell align="right">{row.capitalInvested}</TableCell>
                        <TableCell align="right">{row.projectedRevenue}</TableCell>
                        <TableCell align="right" tone={row.profitTone}>
                          {row.profitSplit}
                        </TableCell>
                        <TableCell align="right" tone={row.profitTone}>
                          {row.roi}
                        </TableCell>
                        <TableCell align="right">{row.totalReturn}</TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile: tappable cards instead of the wide table */}
            {overviewRows.length > 0 && (
              <ul className="divide-y divide-gray-100 md:hidden">
                {overviewRows.map((row) => (
                  <li key={row.id}>
                    <Link
                      to={`/projects/${row.id}`}
                      className="block px-4 py-4 transition-colors active:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-blue-600">{row.projectName}</span>
                        <span className="shrink-0 text-xs text-gray-400">{row.startDate}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                        <MobileStat label="Days Active" value={row.daysActive} />
                        <MobileStat label="Expected" value={row.expectedCompletionDate} />
                        <MobileStat label="Capital" value={row.capitalInvested} />
                        <MobileStat label="Projected Revenue" value={row.projectedRevenue} />
                        <MobileStat
                          label="Profit Split"
                          value={row.profitSplit}
                          tone={row.profitTone}
                        />
                        <MobileStat label="ROI" value={row.roi} tone={row.profitTone} />
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                        <StatusPill label={row.timelineStatus} tone={row.timelineTone} />
                        <div className="text-right">
                          <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Total Return
                          </span>
                          <span className="text-base font-bold text-gray-900">
                            {row.totalReturn}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function StatusPill({
  label,
  tone,
}: {
  label: string
  tone: 'positive' | 'warning' | 'negative' | 'muted'
}) {
  const toneClass =
    tone === 'positive'
      ? 'bg-green-50 text-green-700 ring-green-200'
      : tone === 'warning'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : tone === 'negative'
          ? 'bg-red-50 text-red-700 ring-red-200'
          : 'bg-gray-50 text-gray-600 ring-gray-200'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ${toneClass}`}
    >
      {label}
    </span>
  )
}

function TableHead({
  children,
  align = 'left',
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  )
}

function MobileStat({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'negative'
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-green-600'
      : tone === 'negative'
        ? 'text-red-600'
        : 'text-gray-900'
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-0.5 break-words text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  )
}

function TableCell({
  children,
  align = 'left',
  tone = 'default',
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
  tone?: 'default' | 'positive' | 'negative'
}) {
  const toneClass =
    tone === 'positive'
      ? 'text-green-600'
      : tone === 'negative'
        ? 'text-red-600'
        : 'text-gray-700'

  return (
    <td
      className={`whitespace-nowrap px-4 py-3 font-medium ${toneClass} ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </td>
  )
}
