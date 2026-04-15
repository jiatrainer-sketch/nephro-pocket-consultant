// In-memory localStorage shim so storage helpers work under the default
// Node test environment without pulling in jsdom.
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    key: (i) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size
    },
  }
}

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createEmptyPatient,
  exportAllData,
  generateId,
  getCKDStage,
  getLatestLabEntry,
  importAllData,
  isLabOutdated,
  isScreeningOutdated,
  loadPatients,
  loadSettings,
  parseLabDate,
  savePatients,
  saveSettings,
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

describe('exportAllData / importAllData', () => {
  beforeEach(() => {
    // jsdom localStorage is isolated per test file; reset between tests
    localStorage.clear()
  })

  it('round-trips patients + settings', () => {
    const patients = [
      { ...createEmptyPatient('a'), name: 'นาย A', hn: '001' },
      { ...createEmptyPatient('b'), name: 'นาง B', hn: '002' },
    ]
    savePatients(patients)
    saveSettings({ apiKey: 'sk-ant-test' })

    const json = exportAllData()
    const parsed = JSON.parse(json)
    expect(parsed.version).toBe(1)
    expect(parsed.patients).toHaveLength(2)
    expect(parsed.settings.apiKey).toBe('sk-ant-test')
    expect(parsed.exportedAt).toBeTruthy()

    // Wipe then restore
    localStorage.clear()
    const result = importAllData(json)
    expect(result.patients).toBe(2)
    expect(loadPatients()).toHaveLength(2)
    expect(loadPatients()[0].name).toBe('นาย A')
  })

  it('does not overwrite settings by default', () => {
    savePatients([])
    saveSettings({ apiKey: 'current-key' })
    const json = JSON.stringify({
      version: 1,
      patients: [{ ...createEmptyPatient('x') }],
      settings: { apiKey: 'backup-key' },
    })
    importAllData(json)
    expect(loadSettings().apiKey).toBe('current-key')
  })

  it('overwrites settings when opted in', () => {
    saveSettings({ apiKey: 'current-key' })
    const json = JSON.stringify({
      version: 1,
      patients: [],
      settings: { apiKey: 'backup-key' },
    })
    importAllData(json, { overwriteSettings: true })
    expect(loadSettings().apiKey).toBe('backup-key')
  })

  it('rejects malformed JSON', () => {
    expect(() => importAllData('not json')).toThrow()
  })

  it('rejects missing patients array', () => {
    expect(() => importAllData(JSON.stringify({ version: 1 }))).toThrow()
  })

  it('rejects patient without id', () => {
    const bad = JSON.stringify({ version: 1, patients: [{ name: 'no id' }] })
    expect(() => importAllData(bad)).toThrow()
  })
})
