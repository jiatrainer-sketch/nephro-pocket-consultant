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
    return new Date(parseInt(y), parseInt(m) - 1, 1)
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
  const v = parseFloat(egfr)
  if (isNaN(v)) return null
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
    status: 'HD',       // CKD | HD | PD | KT
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
