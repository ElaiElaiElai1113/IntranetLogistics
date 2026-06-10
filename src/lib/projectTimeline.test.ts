import { describe, expect, it } from 'vitest'
import {
  addExpectedProjectMonths,
  calculateDaysActive,
  getProjectTimelineStatus,
} from './projectTimeline'

const today = new Date('2026-06-10T00:00:00+08:00')

describe('project timeline helpers', () => {
  it('calculates whole calendar days active from start date to today', () => {
    expect(calculateDaysActive('2026-06-01', today)).toBe(9)
  })

  it('returns null days active for a missing start date', () => {
    expect(calculateDaysActive(null, today)).toBeNull()
  })

  it('adds 8 calendar months for expected project completion', () => {
    expect(addExpectedProjectMonths('2026-01-08')).toBe('2026-09-08')
  })

  it('returns no-start-date status when start date is missing', () => {
    expect(getProjectTimelineStatus(null, today)).toEqual({
      label: 'No Start Date',
      tone: 'muted',
    })
  })

  it('marks projects on track when more than 30 days remain', () => {
    expect(getProjectTimelineStatus('2026-02-01', today)).toEqual({
      label: 'On Track',
      tone: 'positive',
    })
  })

  it('marks projects approaching due when 0 to 30 days remain', () => {
    expect(getProjectTimelineStatus('2025-10-25', today)).toEqual({
      label: 'Approaching Due',
      tone: 'warning',
    })
  })

  it('marks projects overdue after the expected finish date', () => {
    expect(getProjectTimelineStatus('2025-09-01', today)).toEqual({
      label: 'Overdue',
      tone: 'negative',
    })
  })
})
