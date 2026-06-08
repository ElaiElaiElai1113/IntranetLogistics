import type { Project } from '../types/project'
import { computeFinancials } from './calculations'
import { formatDate, formatPHP, formatPercent } from './formatters'

export interface ProjectOverviewRow {
  id: string
  projectName: string
  startDate: string
  capitalInvested: string
  revenue: string
  costPercentage: string
  splitPercentage: string
  totalCost: string
  profit: string
  profitTone: 'positive' | 'negative'
  roi: string
  finalAmount: string
}

export function buildProjectOverviewRows(projects: Project[]): ProjectOverviewRow[] {
  return projects.map((project) => {
    const financials = computeFinancials(project)

    return {
      id: project.id,
      projectName: project.project_name,
      startDate: formatDate(project.start_date),
      capitalInvested: formatPHP(project.capital_invested),
      revenue: formatPHP(project.revenue),
      costPercentage: formatPercent(project.cost_percentage),
      splitPercentage: formatPercent(project.split_percentage),
      totalCost: formatPHP(financials.totalCost),
      profit: formatPHP(financials.profit),
      profitTone: financials.profit >= 0 ? 'positive' : 'negative',
      roi: formatPercent(financials.roi),
      finalAmount: formatPHP(financials.finalAmount),
    }
  })
}
