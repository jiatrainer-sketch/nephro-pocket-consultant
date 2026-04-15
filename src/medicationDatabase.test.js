import { describe, it, expect } from 'vitest'
import {
  MEDICATIONS,
  searchMedications,
  TIMING_OPTIONS,
  FREQUENCY_OPTIONS,
} from './medicationDatabase'

describe('MEDICATIONS integrity', () => {
  it('every entry has name / generic / category', () => {
    for (const m of MEDICATIONS) {
      expect(m.name, JSON.stringify(m)).toBeTruthy()
      expect(m.generic, JSON.stringify(m)).toBeTruthy()
      expect(m.category, JSON.stringify(m)).toBeTruthy()
    }
  })

  it('category is one of the allowed values', () => {
    const allowed = new Set(['HD', 'CV', 'DM', 'Other'])
    for (const m of MEDICATIONS) {
      expect(allowed.has(m.category), `${m.name} has unknown category ${m.category}`).toBe(true)
    }
  })

  it('no duplicate display names', () => {
    const seen = new Set()
    for (const m of MEDICATIONS) {
      expect(seen.has(m.name), `duplicate name: ${m.name}`).toBe(false)
      seen.add(m.name)
    }
  })

  it('covers key renal-adjusted drugs', () => {
    // Guard against accidental removal of drugs used in recommendations.js
    const generics = MEDICATIONS.map(m => m.generic.toLowerCase())
    const required = [
      'losartan',
      'metformin',
      'gabapentin',
      'allopurinol',
      'dapagliflozin',
      'empagliflozin',
    ]
    for (const g of required) {
      expect(
        generics.some(x => x.includes(g)),
        `missing renal-critical drug: ${g}`,
      ).toBe(true)
    }
  })
})

describe('searchMedications', () => {
  it('returns [] for empty / whitespace query', () => {
    expect(searchMedications('')).toEqual([])
    expect(searchMedications('   ')).toEqual([])
    expect(searchMedications(null)).toEqual([])
    expect(searchMedications(undefined)).toEqual([])
  })

  it('is case-insensitive', () => {
    const a = searchMedications('LOSARTAN')
    const b = searchMedications('losartan')
    expect(a.length).toBeGreaterThan(0)
    expect(a).toEqual(b)
  })

  it('matches brand or generic', () => {
    expect(searchMedications('Forxiga').length).toBeGreaterThan(0)
    expect(searchMedications('Dapagliflozin').length).toBeGreaterThan(0)
  })

  it('caps results at 8', () => {
    // "in" appears in many names → should still cap
    const res = searchMedications('in')
    expect(res.length).toBeLessThanOrEqual(8)
  })
})

describe('option lists', () => {
  it('timing options non-empty strings', () => {
    expect(TIMING_OPTIONS.length).toBeGreaterThan(0)
    for (const t of TIMING_OPTIONS) expect(typeof t).toBe('string')
  })

  it('frequency options non-empty strings', () => {
    expect(FREQUENCY_OPTIONS.length).toBeGreaterThan(0)
    for (const f of FREQUENCY_OPTIONS) expect(typeof f).toBe('string')
  })
})
