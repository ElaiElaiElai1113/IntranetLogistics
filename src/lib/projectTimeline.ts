export type TimelineTone = 'positive' | 'warning' | 'negative' | 'muted'

export interface TimelineStatus {
  label: 'On Track' | 'Approaching Due' | 'Overdue' | 'No Start Date'
  tone: TimelineTone
}

const EXPECTED_MONTHS = 8
const APPROACHING_DAYS = 30
const MS_PER_DAY = 24 * 60 * 60 * 1000

function parseDateOnly(value: string): Date | null {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null

  return new Date(year, month - 1, day)
}

function toDateOnly(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function formatDateOnly(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function calculateDaysActive(startDate: string | null, today = new Date()): number | null {
  const start = startDate ? parseDateOnly(startDate) : null
  if (!start) return null

  const current = toDateOnly(today)

  return Math.max(0, Math.floor((current.getTime() - start.getTime()) / MS_PER_DAY))
}

export function addExpectedProjectMonths(startDate: string | null): string | null {
  const start = startDate ? parseDateOnly(startDate) : null
  if (!start) return null

  const expected = new Date(start)
  expected.setMonth(expected.getMonth() + EXPECTED_MONTHS)

  return formatDateOnly(expected)
}

export function getProjectTimelineStatus(
  startDate: string | null,
  today = new Date(),
): TimelineStatus {
  const expected = addExpectedProjectMonths(startDate)
  if (!expected) return { label: 'No Start Date', tone: 'muted' }

  const expectedDate = parseDateOnly(expected)
  if (!expectedDate) return { label: 'No Start Date', tone: 'muted' }

  const current = toDateOnly(today)
  const daysRemaining = Math.floor((expectedDate.getTime() - current.getTime()) / MS_PER_DAY)

  if (daysRemaining < 0) return { label: 'Overdue', tone: 'negative' }
  if (daysRemaining <= APPROACHING_DAYS) {
    return { label: 'Approaching Due', tone: 'warning' }
  }

  return { label: 'On Track', tone: 'positive' }
}
