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

  it('includes a funding selector with unset, full, and partial options', () => {
    expect(source).toContain('<Field label="Funding">')
    expect(source).toContain('<option value="">Unset</option>')
    expect(source).toContain('<option value="full">Full</option>')
    expect(source).toContain('<option value="partial">Partial</option>')
    expect(source).toContain('funding_status: form.funding_status || null')
  })
})
