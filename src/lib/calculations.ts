import type { Financials } from '../types/project'

/** Numeric inputs needed to derive a project's financials. */
export interface FinancialInputs {
  capital_invested: number
  revenue: number
  cost_percentage: number
  split_percentage: number
}

/** Treats NaN / non-finite values as 0 so partially-filled forms stay calculable. */
function num(value: number): number {
  return Number.isFinite(value) ? value : 0
}

/**
 * Computes display-only financial figures from a project's editable numbers.
 * Pure function — no side effects, safe to call on every keystroke.
 */
export function computeFinancials(inputs: FinancialInputs): Financials {
  const capitalInvested = num(inputs.capital_invested)
  const revenue = num(inputs.revenue)
  const costPercentage = num(inputs.cost_percentage)
  const splitPercentage = num(inputs.split_percentage)

  // Formulas mirror the client's "logistics - eli.xlsx" exactly.
  const totalCost = revenue * (costPercentage / 100)
  const profit = revenue - totalCost - capitalInvested
  const splitAmount = profit * (splitPercentage / 100)
  // ROI is the return on the investor's split relative to capital, not gross profit.
  const roi = capitalInvested > 0 ? (splitAmount / capitalInvested) * 100 : 0
  const finalAmount = capitalInvested + splitAmount

  return { totalCost, profit, splitAmount, roi, finalAmount }
}
