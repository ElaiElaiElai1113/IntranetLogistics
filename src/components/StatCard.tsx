import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string
  hint?: ReactNode
  accent?: 'default' | 'positive' | 'negative'
}

const accentText: Record<NonNullable<StatCardProps['accent']>, string> = {
  default: 'text-gray-900',
  positive: 'text-green-600',
  negative: 'text-red-600',
}

export default function StatCard({ label, value, hint, accent = 'default' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accentText[accent]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}
