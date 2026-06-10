import { describe, expect, it } from 'vitest'
import { buildProjectInfoRows } from './projectInfoRows'

describe('buildProjectInfoRows', () => {
  it('returns formatted source information apart from calculated figures', () => {
    const rows = buildProjectInfoRows({
      project_name: 'Air Oven',
      start_date: '2026-06-07',
      capital_invested: '85800',
      revenue: '160000',
      cost_percentage: '10',
      split_percentage: '50',
      notes: 'First batch',
      status: 'active',
    })

    expect(rows).toEqual([
      { label: 'Project name', value: 'Air Oven' },
      { label: 'Start date', value: 'Jun 7, 2026' },
      { label: 'Capital invested', value: '₱85,800.00' },
      { label: 'Projected revenue', value: '₱160,000.00' },
      { label: 'Cost percentage', value: '10.0%' },
      { label: 'Split percentage', value: '50.0%' },
      { label: 'Status', value: 'Active' },
      { label: 'Notes', value: 'First batch' },
    ])

    expect(rows.map((row) => row.label)).not.toContain('Profit')
    expect(rows.map((row) => row.label)).not.toContain('ROI')
    expect(rows.map((row) => row.label)).not.toContain('Final amount')
  })

  it('uses a dash for missing optional display values', () => {
    const rows = buildProjectInfoRows({
      project_name: '',
      start_date: '',
      capital_invested: '',
      revenue: '',
      cost_percentage: '',
      split_percentage: '',
      notes: '',
      status: 'archived',
    })

    expect(rows).toContainEqual({ label: 'Project name', value: 'Untitled project' })
    expect(rows).toContainEqual({ label: 'Start date', value: '—' })
    expect(rows).toContainEqual({ label: 'Capital invested', value: '₱0.00' })
    expect(rows).toContainEqual({ label: 'Projected revenue', value: '₱0.00' })
    expect(rows).toContainEqual({ label: 'Notes', value: '—' })
    expect(rows).toContainEqual({ label: 'Status', value: 'Archived' })
  })
})
