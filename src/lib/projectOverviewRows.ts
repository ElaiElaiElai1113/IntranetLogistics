import type { Project } from '../types/project'
import { computeFinancials } from './calculations'
import { formatDate, formatPHP, formatPercent } from './formatters'
import {
  addExpectedProjectMonths,
  calculateDaysActive,
  getProjectTimelineStatus,
  type TimelineTone,
} from './projectTimeline'

export interface ProjectOverviewRow {
  id: string
  projectName: string
  startDate: string
  daysActive: string
  expectedCompletionDate: string
  timelineStatus: string
  timelineTone: TimelineTone
  capitalInvested: string
  projectedRevenue: string
  profitSplit: string
  profitTone: 'positive' | 'negative'
  roi: string
  totalReturn: string
}

function sortByStartDate(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    if (!a.start_date && !b.start_date) return a.project_name.localeCompare(b.project_name)
    if (!a.start_date) return 1
    if (!b.start_date) return -1

    return a.start_date.localeCompare(b.start_date)
  })
}

export function buildProjectOverviewRows(
  projects: Project[],
  today = new Date(),
): ProjectOverviewRow[] {
  return sortByStartDate(projects).map((project) => {
    const financials = computeFinancials(project)
    const daysActive = calculateDaysActive(project.start_date, today)
    const expectedCompletionDate = addExpectedProjectMonths(project.start_date)
    const timeline = getProjectTimelineStatus(project.start_date, today)

    return {
      id: project.id,
      projectName: project.project_name,
      startDate: formatDate(project.start_date),
      daysActive: daysActive === null ? '—' : String(daysActive),
      expectedCompletionDate: formatDate(expectedCompletionDate),
      timelineStatus: timeline.label,
      timelineTone: timeline.tone,
      capitalInvested: formatPHP(project.capital_invested),
      projectedRevenue: formatPHP(project.revenue),
      profitSplit: formatPHP(financials.splitAmount),
      profitTone: financials.splitAmount >= 0 ? 'positive' : 'negative',
      roi: formatPercent(financials.roi),
      totalReturn: formatPHP(financials.finalAmount),
    }
  })
}
