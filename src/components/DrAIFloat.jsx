import { useEffect, useRef, useState } from 'react'
import { DR_AI_MODEL, buildDrAIPrompt } from '../drAIPrompt'

export default function DrAIFloat({ settings }) {
  const [open, setOpen] = useState(false)
  const chatKey = 'chat_drai_float'
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(chatKey)) || [] } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(chatKey, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    if (!settings?.apiKey) return

    const userMsg = { role: 'user', content: text }
    const newMsgs = [...messages, userMsg]
    setMessages([...newMsgs, { role: 'assistant', content: '' }])
    setInput('')
    setLoading(true)

    try {
      const controller = new AbortController()
      abortRef.current = controller
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': settings.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: DR_AI_MODEL,
          max_tokens: 4096,
          stream: true,
          system: buildDrAIPrompt(''),
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const json = line.slice(6)
          if (json === '[DONE]') continue
          try {
            const evt = JSON.parse(json)
            if (evt.type === 'content_block_delta' && evt.delta?.text) {
              accumulated += evt.delta.text
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: accumulated }
                return updated
              })
            }
          } catch {}
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: 'Error: ไม่สามารถเชื่อมต่อได้' }
          return updated
        })
      }
    } finally {
      abortRef.current = null
      setLoading(false)
    }
  }

  const stopGeneration = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 active:scale-95 transition-transform"
        aria-label="Dr. AI"
      >
        <span className="text-xs font-bold leading-none">Dr.<br/>AI</span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={() => setOpen(false)} className="text-xl leading-none">←</button>
        <div className="flex-1">
          <div className="text-sm font-bold">Dr. AI</div>
          <div className="text-xs text-blue-200">Senior Internal Medicine Consultant</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            {!settings?.apiKey
              ? 'กรุณาใส่ API Key ใน Settings ก่อนใช้ Dr. AI'
              : (
                <div>
                  <div className="text-3xl mb-3">👨‍⚕️</div>
                  <p className="font-medium">สวัสดีครับพี่</p>
                  <p className="mt-1">มีอะไรให้ช่วยครับ? ถามได้ทุกเรื่อง Internal Medicine</p>
                  <div className="mt-4 space-y-2 max-w-xs mx-auto">
                    {['Hyperkalemia K 6.8 ทำยังไง?', 'Dose Vancomycin ใน HD patient', 'DKA management step by step'].map(q => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className="block w-full text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-xl border border-blue-100 text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-800'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && messages.length > 0 && messages[messages.length - 1].content === '' && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2 text-sm text-gray-400 animate-pulse">
              Dr. AI กำลังคิด...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="max-w-lg mx-auto flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={settings?.apiKey ? 'ถาม Dr. AI... (Enter = ขึ้นบรรทัดใหม่)' : 'ใส่ API Key ใน Settings ก่อน'}
            disabled={!settings?.apiKey}
            rows={2}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100"
          />
          {loading ? (
            <button onClick={stopGeneration} className="px-4 rounded-xl text-sm font-medium bg-red-500 text-white shrink-0">
              หยุด
            </button>
          ) : (
            <button
              onClick={send}
              disabled={!settings?.apiKey || !input.trim()}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 shrink-0"
            >
              ส่ง
            </button>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); localStorage.removeItem(chatKey) }}
            className="w-full mt-2 text-xs text-gray-400 py-1"
          >
            ล้างประวัติแชท
          </button>
        )}
      </div>
    </div>
  )
}
