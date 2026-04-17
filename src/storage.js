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

// ----------------------------------------------------------------------
// Browser storage durability + backup/restore
// ----------------------------------------------------------------------

/**
 * Ask the browser to mark this site's storage as persistent so it is NOT
 * auto-evicted when the device runs low on space. Safe to call every boot.
 * Returns { supported, persisted }.
 */
export async function requestPersistentStorage() {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return { supported: false, persisted: false }
  }
  try {
    const persisted = await navigator.storage.persist()
    return { supported: true, persisted }
  } catch {
    return { supported: true, persisted: false }
  }
}

/**
 * Report current storage usage so the UI can show a bar + persistent flag.
 * Returns { supported, persisted, usage, quota, percent }. Values in bytes.
 */
export async function getStorageInfo() {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return { supported: false, persisted: false, usage: 0, quota: 0, percent: 0 }
  }
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate()
    const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false
    return {
      supported: true,
      persisted,
      usage,
      quota,
      percent: quota > 0 ? Math.round((usage / quota) * 100) : 0,
    }
  } catch {
    return { supported: false, persisted: false, usage: 0, quota: 0, percent: 0 }
  }
}

const BACKUP_VERSION = 1

/**
 * Serialise all patient + settings data to a JSON string. Shape:
 *   { version, exportedAt, patients: [...], settings: {...} }
 * Stays on the user's device unless they choose to send it somewhere.
 */
export function exportAllData() {
  return JSON.stringify(
    {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      patients: loadPatients(),
      settings: loadSettings(),
    },
    null,
    2
  )
}

/**
 * Restore data from a backup JSON string.
 *   opts.overwriteSettings  include settings (API key) from the backup
 * Throws on malformed input. Returns { patients, settings }.
 */
export function importAllData(jsonString, { overwriteSettings = false } = {}) {
  let parsed
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    throw new Error('ไฟล์ backup อ่านไม่ได้ (JSON ผิดรูปแบบ)')
  }
  // รองรับทั้ง plain array และ full backup format
  if (Array.isArray(parsed)) {
    parsed = { patients: parsed }
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('ไฟล์ backup ไม่ถูกต้อง')
  }
  if (!Array.isArray(parsed.patients)) {
    throw new Error('ไฟล์ backup ไม่มี patients array')
  }
  for (const p of parsed.patients) {
    if (!p || typeof p !== 'object' || typeof p.id !== 'string') {
      throw new Error('ข้อมูล patient ในไฟล์ไม่ครบ (missing id)')
    }
  }
  savePatients(parsed.patients)
  if (overwriteSettings && parsed.settings && typeof parsed.settings === 'object') {
    saveSettings(parsed.settings)
  }
  return {
    patients: parsed.patients.length,
    settings: overwriteSettings && !!parsed.settings,
  }
}
