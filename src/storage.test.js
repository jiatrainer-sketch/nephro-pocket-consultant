import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  parseLabDate,
  isLabOutdated,
  isScreeningOutdated,
  getCKDStage,
  getLatestLabEntry,
  createEmptyPatient,
  generateId,
} from './storage'

describe('getCKDStage', () => {
  // KDIGO 2024 CKD staging — boundaries must match guideline
  it.each([
    [120, 'G1'],
    [90, 'G1'],
    [89, 'G2'],
    [60, 'G2'],
    [59, 'G3a'],
    [45, 'G3a'],
    [44, 'G3b'],
    [30, 'G3b'],
    [29, 'G4'],
    [15, 'G4'],
    [14, 'G5'],
    [5, 'G5'],
  ])('eGFR %d → %s', (egfr, stage) => {
    expect(getCKDStage(egfr)).toBe(stage)
  })

  it('returns null for missing / invalid', () => {
    expect(getCKDStage(null)).toBeNull()
    expect(getCKDStage(undefined)).toBeNull()
    expect(getCKDStage('')).toBeNull()
    expect(getCKDStage('not-a-number')).toBeNull()
  })

  it('accepts numeric strings', () => {
    expect(getCKDStage('45')).toBe('G3a')
  })
})

describe('parseLabDate', () => {
  it('parses YYYY-MM-DD', () => {
    const d = parseLabDate('2026-04-15')
    expect(d).toBeInstanceOf(Date)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(3) // April = 3
    expect(d.getDate()).toBe(15)
  })

  it('parses YYYY-MM as first of month', () => {
    const d = parseLabDate('2026-04')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(3)
    expect(d.getDate()).toBe(1)
  })

  it('returns null for unparseable input', () => {
    expect(parseLabDate('')).toBeNull()
    expect(parseLabDate(null)).toBeNull()
    expect(parseLabDate('last week')).toBeNull()
    expect(parseLabDate('15/04/2026')).toBeNull()
  })
})

describe('isLabOutdated / isScreeningOutdated', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T00:00:00Z'))
  })

  it('lab > 3 months old is outdated', () => {
    expect(isLabOutdated('2025-12-01')).toBe(true)
    expect(isLabOutdated('2026-02-01')).toBe(false)
  })

  it('screening > 6 months old is outdated', () => {
    expect(isScreeningOutdated('2025-09-01')).toBe(true)
    expect(isScreeningOutdated('2025-12-01')).toBe(false)
  })

  it('unparseable date is treated as not outdated', () => {
    expect(isLabOutdated('')).toBe(false)
    expect(isLabOutdated('unknown')).toBe(false)
  })
})

describe('getLatestLabEntry', () => {
  it('returns null when no labs', () => {
    expect(getLatestLabEntry({ labs: [] })).toBeNull()
    expect(getLatestLabEntry({})).toBeNull()
  })

  it('returns the newest by date', () => {
    const patient = {
      labs: [
        { date: '2026-01-01', values: { eGFR: 50 } },
        { date: '2026-03-15', values: { eGFR: 45 } },
        { date: '2025-11-01', values: { eGFR: 55 } },
      ],
    }
    expect(getLatestLabEntry(patient).date).toBe('2026-03-15')
  })
})

describe('createEmptyPatient', () => {
  it('returns schema with required fields', () => {
    const p = createEmptyPatient('abc123')
    expect(p.id).toBe('abc123')
    expect(p.status).toBe('HD')
    expect(p.conditions).toEqual([])
    expect(p.allergies).toEqual([])
    expect(p.medications).toEqual([])
    expect(p.labs).toEqual([])
    expect(p.created_at).toBeTruthy()
    expect(p.updated_at).toBeTruthy()
  })
})

describe('generateId', () => {
  it('produces unique ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId()))
    expect(ids.size).toBe(50)
  })
})
