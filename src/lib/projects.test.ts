import { beforeEach, describe, expect, it, vi } from 'vitest'

const { calls, supabase } = vi.hoisted(() => {
  const project = {
    id: 'project-1',
    project_name: 'Air Oven',
    start_date: '2026-01-08',
    capital_invested: 85800,
    revenue: 160000,
    cost_percentage: 10,
    split_percentage: 50,
    notes: null,
    status: 'active',
    created_at: '2026-01-08T00:00:00.000Z',
    updated_at: '2026-06-10T00:00:00.000Z',
  }

  const calls = {
    inserts: [] as Array<{ table: string; value: unknown }>,
    updates: [] as Array<{ table: string; value: Record<string, unknown> }>,
  }

  function createBuilder(table: string) {
    let operation: 'insert' | 'select' | 'update' | null = null
    let payload: Record<string, unknown> | null = null

    const builder = {
      eq: vi.fn(() => builder),
      insert: vi.fn((value: unknown) => {
        operation = 'insert'
        calls.inserts.push({ table, value })
        if (table === 'project_capital_entries') {
          return Promise.resolve({ error: null })
        }
        return builder
      }),
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      select: vi.fn(() => {
        operation = operation ?? 'select'
        return builder
      }),
      single: vi.fn(() => {
        if (table === 'projects' && operation === 'update') {
          return Promise.resolve({ data: { ...project, ...payload }, error: null })
        }

        if (table === 'project_audit_logs' && operation === 'insert') {
          return Promise.resolve({
            data: {
              id: 'audit-1',
              project_id: 'project-1',
              updated_by: 'Vish',
              action: 'Updated project',
              details: 'Updated projected revenue from ₱160,000.00 to ₱175,000.00',
              created_at: '2026-06-10T05:00:00.000Z',
            },
            error: null,
          })
        }

        return Promise.resolve({ data: project, error: null })
      }),
      update: vi.fn((value: Record<string, unknown>) => {
        operation = 'update'
        payload = value
        calls.updates.push({ table, value })
        return builder
      }),
    }

    return builder
  }

  const supabase = {
    from: vi.fn((table: string) => createBuilder(table)),
  }

  return { calls, project, supabase }
})

vi.mock('./supabaseClient', () => ({ supabase }))

import { addProjectCapital, updateProjectWithAudit } from './projects'

describe('project data helpers', () => {
  beforeEach(() => {
    calls.inserts.length = 0
    calls.updates.length = 0
    supabase.from.mockClear()
  })

  it('adds capital, increments total capital, and writes an audit row', async () => {
    const result = await addProjectCapital('project-1', {
      amount: 50000,
      updated_by: 'Vish',
      note: 'Top up',
    })

    expect(calls.inserts).toContainEqual({
      table: 'project_capital_entries',
      value: {
        project_id: 'project-1',
        amount: 50000,
        note: 'Top up',
        updated_by: 'Vish',
      },
    })
    expect(calls.updates[0]).toMatchObject({
      table: 'projects',
      value: {
        capital_invested: 135800,
      },
    })
    expect(calls.inserts).toContainEqual({
      table: 'project_audit_logs',
      value: {
        project_id: 'project-1',
        updated_by: 'Vish',
        action: 'Added capital',
        details: 'Added capital ₱50,000.00 (Top up)',
      },
    })
    expect(result.capital_invested).toBe(135800)
  })

  it('writes readable audit details for project updates', async () => {
    await updateProjectWithAudit(
      'project-1',
      {
        revenue: 175000,
      },
      { updated_by: 'Dad' },
    )

    expect(calls.updates[0]).toMatchObject({
      table: 'projects',
      value: {
        revenue: 175000,
      },
    })
    expect(calls.inserts).toContainEqual({
      table: 'project_audit_logs',
      value: {
        project_id: 'project-1',
        updated_by: 'Dad',
        action: 'Updated project',
        details: 'Updated projected revenue from ₱160,000.00 to ₱175,000.00',
      },
    })
  })
})
