/**
 * storage.js — the ONLY IO boundary for patient and settings data.
 *
 * Keep all persistence calls (browser localStorage today, backend tomorrow)
 * isolated to this file. Components must import the helpers here and must
 * never call `localStorage` / `fetch` / a DB client directly. This makes
 * swapping the backend a one-file change (see Issue "Backend migration
 * decision" for criteria and plan).
 *
 * Schema — Patient:
 *   {
 *     id:            string                        // generateId()
 *     name:          string
 *     hn:            string                        // hospital number
 *     status:        'HD' | 'PD' | 'KT' | 'CKD'
 *     weight_kg:     string | number
 *     height_cm:     string | number
 *     dry_weight_kg: string | number               // HD only
 *     hd_start_date: string                        // YYYY-MM-DD
 *     esrd_cause:    string                        // free text
 *     vascular_access: { type: string, created_date: string }
 *     conditions:    string[]                      // free text per item
 *     allergies:     string[]                      // free text per item
 *     medications:   Array<{
 *       name: string, dose: string, frequency: string,
 *       timing: string, note: string
 *     }>
 *     labs:          Array<{
 *       date: string,                              // YYYY-MM-DD or YYYY-MM
 *       values: Record<string, string | number>    // eGFR, Hb, K, Ca, P, iPTH, ...
 *     }>
 *     created_at:    string                        // ISO timestamp
 *     updated_at:    string                        // ISO timestamp
 *   }
 *
 * Schema — Settings:
 *   { apiKey: string }                             // Anthropic API key, local only
 *
 * Storage keys are versioned (`_v1`). Bump the suffix and add a migration
 * step here if the Patient shape changes in a non-backwards-compatible way.
 */
const PATIENTS_KEY = 'nephro_patients_v1'
const SETTINGS_KEY = 'nephro_settings_v1'

export function loadPatients() {
  try {
    const data = localStorage.getItem(PATIENTS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function savePatients(patients) {
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients))
}

export function loadSettings() {
  try {
    const data = localStorage.getItem(SETTINGS_KEY)
    return data ? JSON.parse(data) : { apiKey: '' }
  } catch {
    return { apiKey: '' }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// Parse date string (YYYY-MM or YYYY-MM-DD or free text) → Date object
export function parseLabDate(dateStr) {
  if (!dateStr) return null
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr)
  // Try YYYY-MM
  if (/^\d{4}-\d{2}$/.test(dateStr)) {
    const [y, m] = dateStr.split('-')
    return new Date(Number.parseInt(y), Number.parseInt(m) - 1, 1)
  }
  return null
}

export function isLabOutdated(dateStr) {
  const d = parseLabDate(dateStr)
  if (!d) return false
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  return d < threeMonthsAgo
}

export function isScreeningOutdated(dateStr) {
  const d = parseLabDate(dateStr)
  if (!d) return false
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  return d < sixMonthsAgo
}

export function getLatestLabEntry(patient) {
  if (!patient.labs || patient.labs.length === 0) return null
  return [...patient.labs].sort((a, b) => {
    const da = parseLabDate(a.date) || new Date(0)
    const db = parseLabDate(b.date) || new Date(0)
    return db - da
  })[0]
}

export function getCKDStage(egfr) {
  if (egfr === null || egfr === undefined || egfr === '') return null
  const v = Number.parseFloat(egfr)
  if (Number.isNaN(v)) return null
  if (v >= 90) return 'G1'
  if (v >= 60) return 'G2'
  if (v >= 45) return 'G3a'
  if (v >= 30) return 'G3b'
  if (v >= 15) return 'G4'
  return 'G5'
}

export function createEmptyPatient(id) {
  return {
    id,
    name: '',
    hn: '',
    status: 'HD', // CKD | HD | PD | KT
    weight_kg: '',
    height_cm: '',
    dry_weight_kg: '',
    hd_start_date: '',
    esrd_cause: '',
    vascular_access: { type: '', created_date: '' },
    conditions: [],
    allergies: [],
    medications: [],
    labs: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
