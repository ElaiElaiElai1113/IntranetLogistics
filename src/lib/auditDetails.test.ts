import { describe, expect, it } from 'vitest'
import type { Project, ProjectPatch } from '../types/project'
import { buildProjectUpdateDetails } from './auditDetails'

const project: Project = {
  id: 'project-1',
  project_name: 'Air Oven',
  start_date: '2026-01-08',
  capital_invested: 85800,
  revenue: 160000,
  cost_percentage: 10,
  split_percentage: 50,
  notes: null,
  status: 'active',
  funding_status: 'partial',
  created_at: '2026-01-08T00:00:00.000Z',
  updated_at: '2026-06-10T00:00:00.000Z',
}

describe('buildProjectUpdateDetails', () => {
  it('describes changed currency and status fields', () => {
    const patch: ProjectPatch = {
      revenue: 175000,
      status: 'archived',
    }

    expect(buildProjectUpdateDetails(project, patch)).toEqual([
      'Updated projected revenue from ₱160,000.00 to ₱175,000.00',
      'Changed status from Active to Archived',
    ])
  })

  it('returns no details when values do not change', () => {
    expect(buildProjectUpdateDetails(project, { revenue: 160000 })).toEqual([])
  })

  it('describes funding status changes', () => {
    expect(buildProjectUpdateDetails(project, { funding_status: 'full' })).toEqual([
      'Changed funding from Partial to Full',
    ])

    expect(
      buildProjectUpdateDetails(
        {
          ...project,
          funding_status: null,
        },
        { funding_status: 'partial' },
      ),
    ).toEqual(['Changed funding from Unset to Partial'])

    expect(buildProjectUpdateDetails(project, { funding_status: null })).toEqual([
      'Changed funding from Partial to Unset',
    ])
  })
})
