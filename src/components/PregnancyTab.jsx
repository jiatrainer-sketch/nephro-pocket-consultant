import { useRef, useState, useEffect } from 'react'
import { SYMPTOMS, getPregnancyInfo, searchBySymptom, searchDrugPregnancy } from '../pregnancyData'

const SAFETY_STYLE = {
  safe: 'bg-green-100 text-green-700',
  caution: 'bg-yellow-100 text-yellow-700',
  avoid: 'bg-red-100 text-red-700',
  contraindicated: 'bg-red-200 text-red-800',
}
const SAFETY_LABEL = {
  safe: 'Safe',
  caution: 'Caution',
  avoid: 'Avoid',
  contraindicated: 'Contraindicated',
}

const MODEL = 'claude-sonnet-4-6'

export default function PregnancyTab({ onBack, settings }) {
  const [context, setContext] = useState('pregnant-1')
  const [mode, setMode] = useState('symptom')
  const [selectedSymptom, setSelectedSymptom] = useState(null)
  const [query, setQuery] = useState('')
  const [showAI, setShowAI] = useState(false)

  const isBF = context === 'breastfeeding'
  const contextLabel = isBF
    ? 'ให้นมบุตร'
    : `ตั้งครรภ์ ไตรมาส ${context.split('-')[1]}`

  const results = mode === 'symptom' && selectedSymptom
    ? searchBySymptom(selectedSymptom, isBF ? 'breastfeeding' : 'pregnant')
    : mode === 'search' && query.trim().length >= 1
      ? searchDrugPregnancy(query)
      : []

  const aiContext = `สถานะ: ${contextLabel}\n` +
    (selectedSymptom ? `อาการ: ${SYMPTOMS.find(s => s.key === selectedSymptom)?.label || selectedSymptom}\n` : '') +
    (results.length > 0 ? `ยาที่แนะนำ:\n${results.map(d => {
      const info = getPregnancyInfo(d.name) || {}
      const s = isBF ? info.l : info.p
      return `- ${d.name} (${d.generic}) — ${SAFETY_LABEL[s] || '?'}: ${(isBF ? info.lN : info.pN) || ''}`
    }).join('\n')}` : '')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header
        className="bg-pink-600 text-white px-4 pt-safe-top pb-3 sticky top-0 z-20 shadow-md"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={onBack} className="text-xl leading-none">←</button>
          <div>
            <div className="text-lg font-bold leading-tight">Pregnancy / Lactation</div>
            <div className="text-xs text-pink-200">ยาปลอดภัยสำหรับคนท้อง/ให้นม</div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-4 pb-24">
        {/* Context selector */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <label className="block text-xs text-gray-500 mb-2 font-medium">สถานะผู้ป่วย</label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { v: 'pregnant-1', l: 'ท้อง T1' },
              { v: 'pregnant-2', l: 'ท้อง T2' },
              { v: 'pregnant-3', l: 'ท้อง T3' },
              { v: 'breastfeeding', l: 'ให้นม' },
            ].map(({ v, l }) => (
              <button
                key={v}
                onClick={() => setContext(v)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  context === v
                    ? 'bg-pink-600 text-white border-pink-600'
                    : 'text-gray-600 border-gray-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => { setMode('symptom'); setQuery('') }}
            className={`flex-1 text-sm py-2 rounded-xl font-medium transition-colors ${
              mode === 'symptom' ? 'bg-pink-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            เลือกอาการ
          </button>
          <button
            onClick={() => { setMode('search'); setSelectedSymptom(null) }}
            className={`flex-1 text-sm py-2 rounded-xl font-medium transition-colors ${
              mode === 'search' ? 'bg-pink-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            ค้นชื่อยา
          </button>
        </div>

        {/* Symptom picker */}
        {mode === 'symptom' && (
          <div className="flex flex-wrap gap-1.5">
            {SYMPTOMS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedSymptom(key === selectedSymptom ? null : key)}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                  selectedSymptom === key
                    ? 'bg-pink-100 text-pink-700 border-pink-300 font-medium'
                    : 'text-gray-600 border-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Drug search */}
        {mode === 'search' && (
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="พิมพ์ชื่อยา เช่น amlo, para, miracid, ponstan..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            autoFocus
          />
        )}

        {/* Results */}
        {mode === 'symptom' && selectedSymptom && results.length === 0 && (
          <div className="text-center text-gray-400 py-8 text-sm">
            ไม่มียาที่ tagged สำหรับอาการนี้
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 font-medium">
              {mode === 'symptom'
                ? `ยาสำหรับ "${SYMPTOMS.find(s => s.key === selectedSymptom)?.label}" — ${contextLabel}`
                : `ผลค้นหา "${query}" — ${contextLabel}`}
            </div>
            {results.map((drug, i) => (
              <DrugCard key={i} drug={drug} isBF={isBF} />
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 leading-relaxed">
          AI-seeded data (FDA labels + LactMed). ยังไม่ verified — แพทย์ต้อง confirm ก่อนสั่งยาเสมอ
        </div>
      </main>

      {/* AI Floating Button */}
      {!showAI && (
        <button
          onClick={() => setShowAI(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl active:bg-purple-800 z-30"
          aria-label="ถาม AI"
        >
          AI
        </button>
      )}

      {/* AI Chat Panel */}
      {showAI && (
        <AIChat
          settings={settings}
          contextLabel={contextLabel}
          aiContext={aiContext}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  )
}

function DrugCard({ drug, isBF }) {
  const info = getPregnancyInfo(drug.name) || {}
  const safety = isBF ? info.l : info.p
  const note = isBF ? info.lN : info.pN
  const alts = (!isBF && info.pAlt?.length > 0) ? info.pAlt : []

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium text-sm text-gray-900">{drug.name}</span>
        {safety && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${SAFETY_STYLE[safety]}`}>
            {SAFETY_LABEL[safety]}
          </span>
        )}
        {drug.riskClass === 'narrow-ti' && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
            Narrow TI
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{drug.generic}</div>
      {note && <div className="text-xs text-gray-600 mt-1">{note}</div>}
      {drug.dosage && (
        <div className="text-[11px] text-blue-600 mt-1">
          Dose: {drug.dosage}
        </div>
      )}
      {alts.length > 0 && (
        <div className="text-[11px] text-green-700 mt-1">
          Alternatives: {alts.join(', ')}
        </div>
      )}
    </div>
  )
}

function AIChat({ settings, contextLabel, aiContext, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [messages, loading])

  const systemPrompt = `คุณคือ Pregnancy/Lactation Drug Safety Consultant สำหรับแพทย์ไทย

สถานะผู้ป่วยปัจจุบัน: ${contextLabel}

${aiContext ? `ข้อมูลที่ระบบแนะนำไว้:\n${aiContext}` : ''}

หลักการตอบ:
1. ตอบเป็นภาษาไทย ชื่อยาใช้ภาษาอังกฤษ
2. อ้างอิง FDA pregnancy category, LactMed (NIH), ACOG guidelines
3. ระบุ safety level: Safe / Caution / Avoid / Contraindicated
4. แนะนำทางเลือกที่ปลอดภัยกว่าเสมอ
5. ระบุ trimester-specific risk ถ้ามี
6. ตอบสั้นกระชับ
7. คุณเป็น clinical decision support — แพทย์ต้อง confirm ก่อนสั่งยาเสมอ`

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    if (!settings?.apiKey) return

    const userMsg = { role: 'user', content: text }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          system: systemPrompt,
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text || 'ไม่สามารถตอบได้'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ไม่สามารถเชื่อมต่อ API ได้' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-gray-50">
      {/* AI Header */}
      <div className="bg-purple-600 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={onClose} className="text-xl leading-none">←</button>
        <div>
          <div className="text-sm font-bold">AI Recheck — {contextLabel}</div>
          <div className="text-xs text-purple-200">ถามเกี่ยวกับยาในคนท้อง/ให้นม</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            {!settings?.apiKey
              ? 'กรุณาใส่ API Key ใน Settings ก่อนใช้ AI'
              : 'ถามได้เลย เช่น "Cafergot ให้คนท้องได้ไหม?" หรือ "ยาแก้ปวดหัวที่ปลอดภัยสำหรับแม่ให้นม?"'}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-gray-200 text-gray-800'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2 text-sm text-gray-400">
              กำลังคิด...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={settings?.apiKey ? 'ถาม AI เกี่ยวกับยา...' : 'ใส่ API Key ใน Settings ก่อน'}
            disabled={!settings?.apiKey}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:bg-gray-100"
          />
          <button
            onClick={send}
            disabled={!settings?.apiKey || loading || !input.trim()}
            className="bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            ส่ง
          </button>
        </div>
      </div>
    </div>
  )
}
