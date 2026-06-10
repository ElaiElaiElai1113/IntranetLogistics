import { describe, expect, it } from 'vitest'
import source from './Dashboard.tsx?raw'

describe('Dashboard source', () => {
  it('does not render the Total Return dashboard column or mobile value', () => {
    expect(source).not.toContain('Total Return')
    expect(source).not.toContain('row.totalReturn')
  })
})
