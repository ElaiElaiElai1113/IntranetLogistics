import { describe, expect, it } from 'vitest'
import { buildProjectOverviewRows } from './projectOverviewRows'
import type { Project } from '../types/project'

const baseProject: Project = {
  id: 'project-1',
  project_name: 'Air Oven',
  start_date: '2026-06-07',
  capital_invested: 85800,
  revenue: 160000,
  cost_percentage: 10,
  split_percentage: 50,
  notes: null,
  status: 'active',
  created_at: '2026-06-07T00:00:00.000Z',
  updated_at: '2026-06-07T00:00:00.000Z',
}

describe('buildProjectOverviewRows', () => {
  it('returns formatted source and calculated values for active project rows', () => {
    const rows = buildProjectOverviewRows([baseProject])

    expect(rows).toEqual([
      {
        id: 'project-1',
        projectName: 'Air Oven',
        startDate: 'Jun 7, 2026',
        capitalInvested: '₱85,800.00',
        revenue: '₱160,000.00',
        costPercentage: '10.0%',
        splitPercentage: '50.0%',
        totalCost: '₱16,000.00',
        profit: '₱58,200.00',
        profitTone: 'positive',
        roi: '33.9%',
        finalAmount: '₱114,900.00',
      },
    ])
  })

  it('marks negative profit rows so the table can render loss styling', () => {
    const rows = buildProjectOverviewRows([
      {
        ...baseProject,
        id: 'project-2',
        project_name: 'Loss Project',
        capital_invested: 10000,
        revenue: 1000,
        cost_percentage: 100,
      },
    ])

    expect(rows[0]).toMatchObject({
      profit: '-₱10,000.00',
      profitTone: 'negative',
      roi: '-50.0%',
      finalAmount: '₱5,000.00',
    })
  })

  it('uses a dash for missing start dates', () => {
    const rows = buildProjectOverviewRows([{ ...baseProject, start_date: null }])

    expect(rows[0].startDate).toBe('—')
  })
})
