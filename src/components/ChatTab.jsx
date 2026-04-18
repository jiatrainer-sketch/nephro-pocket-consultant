import { useEffect, useRef, useState } from 'react'

const MODEL = 'claude-sonnet-4-6'

function buildSystemPrompt(patient) {
  const labs = patient.labs?.length
    ? patient.labs
        .slice()
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, 3)
        .map((l) => `  - ${l.date || 'ไม่ระบุวันที่'}: ${JSON.stringify(l.values)}`)
        .join('\n')
    : '  ไม่มีข้อมูล lab'

  const meds = patient.medications?.length
    ? patient.medications
        .map((m) => `  - ${m.name} ${m.dose} ${m.frequency} ${m.timing}`)
        .join('\n')
    : '  ไม่มีข้อมูล'

  const conditions =
    patient.conditions?.map((c) => c.name + (c.since ? ` (since ${c.since})` : '')).join(', ') ||
    'ไม่มีข้อมูล'
  const allergies = patient.allergies?.join(', ') || 'ไม่มี'

  return `คุณคือ Internal Medicine & Nephrology Consultant สำหรับแพทย์ไทย
มีความเชี่ยวชาญครอบคลุมทุก subspecialty (Cardio, Endo, ID, Rheum, Neuro, Hemato ฯลฯ)
แต่ต้องคำนึงถึง CKD/HD context เสมอ — ปรับ dose ตาม eGFR/CrCl ทุกยา

ข้อมูลคนไข้:
- ชื่อ/HN: ${patient.name || '—'} / ${patient.hn || '—'}
- อายุ: ${patient.age || '—'} ปี
- น้ำหนัก: ${patient.weight_kg || '—'} kg, ส่วนสูง: ${patient.height_cm || '—'} cm, Dry weight: ${patient.dry_weight_kg || '—'} kg
- เริ่ม HD: ${patient.hd_start_date || '—'}
- สาเหตุ ESRD: ${patient.esrd_cause || '—'}
- Vascular access: ${patient.vascular_access?.type || '—'} (${patient.vascular_access?.created_date || '—'})
- โรคประจำตัว: ${conditions}
- Allergy: ${allergies}
- ยาปัจจุบัน:
${meds}
- Lab (ล่าสุด 3 ครั้ง):
${labs}

หลักการตอบ:
1. ตอบเป็นภาษาไทย ชื่อยาและศัพท์เฉพาะทางใช้ภาษาอังกฤษ
2. อ้างอิง CPG: Thailand CPG Anemia 2021, KDIGO 2026 Anemia, KDIGO 2024 CKD, KDIGO 2017/2025 MBD, AHA/ACC, ADA, ACR, IDSA guidelines ตามสาขาที่ถาม
3. คำนวณ dose จริงจากข้อมูลยาปัจจุบัน
4. บอกเป้าหมาย + ข้อระวัง + monitor หลังปรับยา
5. ถ้าคนไข้มี allergy → ห้ามแนะนำยาที่แพ้
6. ถ้า lab เก่า >3 เดือน → เตือนควรเจาะใหม่
7. ตอบสั้นกระชับ เว้นแต่ถูกถามให้ขยาย
8. คุณเป็น clinical decision support — แพทย์ต้อง confirm ก่อนสั่งยาเสมอ
9. ดูคนไข้ให้ครอบทุกมุม: ไต + เบาหวาน + ความดัน + หัวใจ + drug interaction`
}

export default function ChatTab({ patient, settings }) {
  const chatKey = `chat_${patient?.id || 'quick'}`
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(chatKey)) || []
    } catch {
      return []
    }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(chatKey))
      setMessages(saved || [])
    } catch {
      setMessages([])
    }
  }, [chatKey])

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(chatKey, JSON.stringify(messages))
  }, [messages, chatKey])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, error])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    if (!settings?.apiKey) {
      setError('ยังไม่ได้ตั้ง API Key — ไปที่ ⚙️ ตั้งค่า')
      return
    }

    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError('')

    try {
      const controller = new AbortController()
      abortRef.current = controller
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 2048,
          stream: true,
          system: buildSystemPrompt(patient),
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || `HTTP ${res.status}`)
      }

      // Add empty placeholder for streaming text
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])
      setLoading(false)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              fullText += parsed.delta.text
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: fullText }
                return updated
              })
            }
          } catch {}
        }
      }
    } catch (e) {
      setLoading(false)
      if (e.name !== 'AbortError') setError(`เกิดข้อผิดพลาด: ${e.message}`)
    } finally {
      abortRef.current = null
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const stopGeneration = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setLoading(false)
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 130px)' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm font-medium">AI Nephrology Consultant</p>
            <p className="text-xs mt-1">ถามได้ทุกเรื่องที่เกี่ยวกับคนไข้รายนี้</p>
            <div className="mt-4 space-y-2">
              {['ควรปรับ EPO เท่าไหร่?', 'iPTH สูง ทำยังไงดี?', 'มี drug interaction ไหม?'].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q)
                  }}
                  className="block w-full text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-xl border border-blue-100 text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-md'
              }`}
            >
              {msg.content}
              {/* Blinking cursor while streaming */}
              {msg.role === 'assistant' &&
                i === messages.length - 1 &&
                !loading &&
                msg.content === '' && (
                  <span className="inline-block w-2 h-4 bg-gray-400 ml-0.5 animate-pulse rounded-sm" />
                )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1 items-center">
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-xl">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        {!settings?.apiKey && (
          <p className="text-xs text-orange-600 mb-2 text-center">
            ⚠️ ยังไม่ได้ตั้ง API Key — ไปที่ ⚙️ ตั้งค่า
          </p>
        )}
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ถามเกี่ยวกับคนไข้... (Enter = ขึ้นบรรทัดใหม่)"
            rows={2}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          {loading ? (
            <button
              onClick={stopGeneration}
              className="px-4 rounded-xl text-sm font-medium bg-red-500 text-white active:bg-red-700 shrink-0"
            >
              หยุด
            </button>
          ) : (
            <button
              onClick={send}
              disabled={!input.trim()}
              className={`px-4 rounded-xl text-sm font-medium transition-colors shrink-0 ${
                !input.trim()
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-blue-600 text-white active:bg-blue-700'
              }`}
            >
              ส่ง
            </button>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => {
              setMessages([])
              localStorage.removeItem(chatKey)
            }}
            className="w-full mt-2 text-xs text-gray-400 py-1"
          >
            ล้างประวัติแชท
          </button>
        )}
      </div>
    </div>
  )
}
