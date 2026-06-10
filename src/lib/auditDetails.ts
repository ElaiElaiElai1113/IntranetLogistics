import type { Project, ProjectPatch, ProjectStatus } from '../types/project'
import { formatDate, formatPHP, formatPercent } from './formatters'

function statusLabel(status: ProjectStatus): string {
  return status === 'active' ? 'Active' : 'Archived'
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() || '—'
}

const labels: Record<keyof ProjectPatch, string> = {
  project_name: 'project name',
  start_date: 'start date',
  capital_invested: 'capital invested',
  revenue: 'projected revenue',
  cost_percentage: 'cost percentage',
  split_percentage: 'split percentage',
  notes: 'notes',
  status: 'status',
}

export function buildProjectUpdateDetails(project: Project, patch: ProjectPatch): string[] {
  return (Object.keys(patch) as Array<keyof ProjectPatch>).flatMap((key) => {
    const next = patch[key]
    const current = project[key]

    if (next === undefined || next === current) return []

    if (key === 'revenue' || key === 'capital_invested') {
      return [
        `Updated ${labels[key]} from ${formatPHP(Number(current))} to ${formatPHP(Number(next))}`,
      ]
    }

    if (key === 'cost_percentage' || key === 'split_percentage') {
      return [
        `Updated ${labels[key]} from ${formatPercent(Number(current))} to ${formatPercent(
          Number(next),
        )}`,
      ]
    }

    if (key === 'start_date') {
      return [
        `Updated ${labels[key]} from ${formatDate(current as string | null)} to ${formatDate(
          next as string | null,
        )}`,
      ]
    }

    if (key === 'status') {
      return [
        `Changed status from ${statusLabel(current as ProjectStatus)} to ${statusLabel(
          next as ProjectStatus,
        )}`,
      ]
    }

    return [
      `Updated ${labels[key]} from ${normalizeText(current as string | null)} to ${normalizeText(
        next as string | null,
      )}`,
    ]
  })
}
