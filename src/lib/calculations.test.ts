import { describe, it, expect } from 'vitest'
import { computeFinancials } from './calculations'

describe('computeFinancials', () => {
  // Source of truth: client's "logistics - eli.xlsx".
  //   Total Cost = Revenue * cost%
  //   Profit     = Revenue - Total Cost - Capital Invested
  //   Split      = Profit * split%
  //   ROI        = Split / Capital Invested
  //   Final      = Capital Invested + Split
  it('matches the Air Oven spreadsheet example', () => {
    const result = computeFinancials({
      capital_invested: 85800,
      revenue: 160000,
      cost_percentage: 10,
      split_percentage: 50,
    })

    expect(result.totalCost).toBe(16000)
    expect(result.profit).toBe(58200)
    expect(result.splitAmount).toBe(29100)
    expect(result.roi).toBeCloseTo(33.916, 3)
    expect(result.finalAmount).toBe(114900)
  })

  it('matches the Surgical Equipment spreadsheet example (larger figures)', () => {
    const result = computeFinancials({
      capital_invested: 725000,
      revenue: 1554195,
      cost_percentage: 10,
      split_percentage: 50,
    })

    expect(result.totalCost).toBe(155419.5)
    expect(result.profit).toBe(673775.5)
    expect(result.splitAmount).toBe(336887.75)
    expect(result.roi).toBeCloseTo(46.467, 3)
    expect(result.finalAmount).toBe(1061887.75)
  })

  it('returns 0 ROI when no capital is invested (avoids divide-by-zero)', () => {
    const result = computeFinancials({
      capital_invested: 0,
      revenue: 70000,
      cost_percentage: 10,
      split_percentage: 50,
    })

    // profit = 70000 - 7000 - 0 = 63000; split = 31500
    expect(result.roi).toBe(0)
    expect(result.finalAmount).toBe(31500)
  })

  it('handles a loss (profit goes negative when capital exceeds net revenue)', () => {
    const result = computeFinancials({
      capital_invested: 10000,
      revenue: 1000,
      cost_percentage: 100,
      split_percentage: 50,
    })

    // totalCost = 1000; profit = 1000 - 1000 - 10000 = -10000
    expect(result.totalCost).toBe(1000)
    expect(result.profit).toBe(-10000)
    expect(result.splitAmount).toBe(-5000)
    expect(result.roi).toBe(-50)
    expect(result.finalAmount).toBe(5000)
  })

  it('coerces missing/NaN numeric inputs to 0', () => {
    const result = computeFinancials({
      capital_invested: Number.NaN,
      revenue: Number.NaN,
      cost_percentage: Number.NaN,
      split_percentage: Number.NaN,
    })

    expect(result.totalCost).toBe(0)
    expect(result.profit).toBe(0)
    expect(result.splitAmount).toBe(0)
    expect(result.roi).toBe(0)
    expect(result.finalAmount).toBe(0)
  })
})
