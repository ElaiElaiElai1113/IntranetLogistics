import type { ProjectStatus } from '../types/project'
import { formatDate, formatPHP, formatPercent } from './formatters'

export interface ProjectInfoSource {
  project_name: string
  start_date: string
  capital_invested: string
  revenue: string
  cost_percentage: string
  split_percentage: string
  notes: string
  status: ProjectStatus
}

export interface ProjectInfoRow {
  label: string
  value: string
}

function numberFromInput(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function statusLabel(status: ProjectStatus): string {
  return status === 'active' ? 'Active' : 'Archived'
}

export function buildProjectInfoRows(source: ProjectInfoSource): ProjectInfoRow[] {
  return [
    {
      label: 'Project name',
      value: source.project_name.trim() || 'Untitled project',
    },
    {
      label: 'Start date',
      value: formatDate(source.start_date || null),
    },
    {
      label: 'Capital invested',
      value: formatPHP(numberFromInput(source.capital_invested)),
    },
    {
      label: 'Projected revenue',
      value: formatPHP(numberFromInput(source.revenue)),
    },
    {
      label: 'Cost percentage',
      value: formatPercent(numberFromInput(source.cost_percentage)),
    },
    {
      label: 'Split percentage',
      value: formatPercent(numberFromInput(source.split_percentage)),
    },
    {
      label: 'Status',
      value: statusLabel(source.status),
    },
    {
      label: 'Notes',
      value: source.notes.trim() || '—',
    },
  ]
}
