import { describe, expect, it } from 'vitest'
import source from './ProjectDetail.tsx?raw'

describe('ProjectDetail source', () => {
  it('removes manual updater input while preserving system audit attribution', () => {
    expect(source).not.toContain('Updated by is required.')
    expect(source).not.toContain('label="Updated by"')
    expect(source).toContain("updated_by: SYSTEM_UPDATED_BY")
  })

  it('shows capital invested above total cost in the Calculated card', () => {
    const capitalRow = source.indexOf('label="Capital invested"')
    const totalCostRow = source.indexOf('label="Total cost"')

    expect(capitalRow).toBeGreaterThan(-1)
    expect(totalCostRow).toBeGreaterThan(-1)
    expect(capitalRow).toBeLessThan(totalCostRow)
  })
})
