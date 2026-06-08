const phpFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Formats a number as Philippine Peso, e.g. ₱157,800.00 */
export function formatPHP(value: number): string {
  return phpFormatter.format(Number.isFinite(value) ? value : 0)
}

/** Formats a number as a one-decimal percentage, e.g. 167.8% */
export function formatPercent(value: number): string {
  const safe = Number.isFinite(value) ? value : 0
  return `${safe.toFixed(1)}%`
}

/** Formats an ISO date string (or null) as a short readable date. */
export function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
