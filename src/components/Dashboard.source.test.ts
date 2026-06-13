import { describe, expect, it } from 'vitest'
import source from './Dashboard.tsx?raw'

describe('Dashboard source', () => {
  it('does not render the Total Return dashboard column or mobile value', () => {
    expect(source).not.toContain('Total Return')
    expect(source).not.toContain('row.totalReturn')
  })

  it('renders Funding as a separate dashboard column before timeline Status', () => {
    const fundingHead = source.indexOf('<TableHead>Funding</TableHead>')
    const statusHead = source.indexOf('<TableHead>Status</TableHead>')
    const fundingValue = source.indexOf('row.fundingStatus')
    const timelineValue = source.indexOf('row.timelineStatus')

    expect(fundingHead).toBeGreaterThan(-1)
    expect(statusHead).toBeGreaterThan(-1)
    expect(fundingHead).toBeLessThan(statusHead)
    expect(fundingValue).toBeGreaterThan(-1)
    expect(timelineValue).toBeGreaterThan(-1)
  })
})
