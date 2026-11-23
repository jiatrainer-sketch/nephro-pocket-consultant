import { DR_AI_MODEL, buildDrAIPrompt, buildPatientContext } from './drAIPrompt'
import { getLatestLabEntry } from './storage'

export const chatKeyFor = (patient) => `chat_${patient?.id || 'quick'}`
export const autoKeyFor = (patient) => `chat_auto_${patient?.id || 'quick'}`

export function labMarker(patient) {
  const lab = getLatestLabEntry(patient || {})
  return lab ? `${lab.date}|${JSON.stringify(lab.values)}` : ''
}

export function summaryRequest(patient) {
  const lab = getLatestLabEntry(patient || {})
  if (!lab) return null
  return {
    content: `สรุปผล Lab ล่าสุด (${lab.date}) ของคนไข้รายนี้ เทียบกับครั้งก่อน`,
    display: `📋 สรุปผล Lab ${lab.date} อัตโนมัติ`,
  }
}

export function needsSummary(patient) {
  const m = labMarker(patient)
  if (!m) return false
  try {
    return localStorage.getItem(autoKeyFor(patient)) !== m
  } catch {
    return false
  }
}

async function callDrAI(patient, messages, apiKey, signal) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: DR_AI_MODEL,
        max_tokens: 1024,
        system: buildDrAIPrompt(buildPatientContext(patient), { brief: true }),
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })
    if (res.status === 429 || res.status === 529) {
      await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)))
      continue
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || `HTTP ${res.status}`)
    }
    const data = await res.json()
    return data.content?.map((b) => b.text || '').join('') || ''
  }
  throw new Error('API ไม่ว่าง ลองใหม่ภายหลัง')
}

/** สรุป lab ของคนไข้หนึ่งคน แล้วบันทึกลงประวัติแชท Dr. AI ของคนนั้น */
export async function summarizeAndStore(patient, apiKey, signal) {
  const req = summaryRequest(patient)
  if (!req) return
  const chatKey = chatKeyFor(patient)
  let history = []
  try {
    history = JSON.parse(localStorage.getItem(chatKey)) || []
  } catch {}
  const userMsg = { role: 'user', ...req }
  const text = await callDrAI(patient, [...history, userMsg], apiKey, signal)
  localStorage.setItem(chatKey, JSON.stringify([...history, userMsg, { role: 'assistant', content: text }]))
  localStorage.setItem(autoKeyFor(patient), labMarker(patient))
}

/** ไล่สรุปทุกคนที่มี lab ใหม่ (ทีละ 3 คนพร้อมกัน) */
export async function summarizeAll(patients, apiKey, { signal, onProgress } = {}) {
  const queue = patients.filter(needsSummary)
  const total = queue.length
  let done = 0
  let failed = 0
  onProgress?.({ done, failed, total })
  const worker = async () => {
    while (queue.length && !signal?.aborted) {
      const p = queue.shift()
      try {
        await summarizeAndStore(p, apiKey, signal)
        done++
      } catch (e) {
        if (e.name === 'AbortError') return
        failed++
      }
      onProgress?.({ done, failed, total })
    }
  }
  await Promise.all([worker(), worker(), worker()])
  return { done, failed }
}
