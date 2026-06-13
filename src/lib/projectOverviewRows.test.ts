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
  funding_status: 'full',
  created_at: '2026-06-07T00:00:00.000Z',
  updated_at: '2026-06-07T00:00:00.000Z',
}

const today = new Date('2026-06-10T00:00:00+08:00')

describe('buildProjectOverviewRows', () => {
  it('returns formatted source, timeline, and calculated values for active project rows', () => {
    const rows = buildProjectOverviewRows([baseProject], today)

    expect(rows).toEqual([
      {
        id: 'project-1',
        projectName: 'Air Oven',
        startDate: 'Jun 7, 2026',
        daysActive: '3',
        expectedCompletionDate: 'Feb 7, 2027',
        timelineStatus: 'On Track',
        timelineTone: 'positive',
        capitalInvested: '₱85,800.00',
        projectedRevenue: '₱160,000.00',
        profitSplit: '₱29,100.00',
        profitTone: 'positive',
        roi: '33.9%',
      },
    ])
  })

  it('marks negative profit split rows so the table can render loss styling', () => {
    const rows = buildProjectOverviewRows([
      {
        ...baseProject,
        id: 'project-2',
        project_name: 'Loss Project',
        capital_invested: 10000,
        revenue: 1000,
        cost_percentage: 100,
      },
    ], today)

    expect(rows[0]).toMatchObject({
      profitSplit: '-₱5,000.00',
      profitTone: 'negative',
      roi: '-50.0%',
    })
  })

  it('uses a dash for missing start dates', () => {
    const rows = buildProjectOverviewRows([{ ...baseProject, start_date: null }], today)

    expect(rows[0].startDate).toBe('—')
    expect(rows[0].daysActive).toBe('—')
    expect(rows[0].expectedCompletionDate).toBe('—')
    expect(rows[0].timelineStatus).toBe('No Start Date')
  })

  it('sorts rows by start date with missing dates last', () => {
    const rows = buildProjectOverviewRows(
      [
        { ...baseProject, id: 'late', project_name: 'Late', start_date: '2026-03-01' },
        { ...baseProject, id: 'missing', project_name: 'Missing', start_date: null },
        { ...baseProject, id: 'early', project_name: 'Early', start_date: '2026-01-01' },
      ],
      today,
    )

    expect(rows.map((row) => row.id)).toEqual(['early', 'late', 'missing'])
  })
})
