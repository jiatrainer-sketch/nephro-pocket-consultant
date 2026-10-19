import { useEffect, useRef, useState } from 'react'
import { FREQUENCY_OPTIONS, TIMING_OPTIONS, getDrugInfo, searchMedications } from '../medicationDatabase'
import { generateId } from '../storage'

export default function MedTab({ patient, onUpdate, settings }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showScan, setShowScan] = useState(false)

  const openAdd = () => {
    setEditingId(null)
    setShowForm(true)
  }
  const openEdit = (id) => {
    setEditingId(id)
    setShowForm(true)
  }

  const saveMed = (med) => {
    let meds
    if (editingId) {
      meds = patient.medications.map((m) => (m.id === editingId ? { ...med, id: editingId } : m))
    } else {
      meds = [...(patient.medications || []), { ...med, id: generateId() }]
    }
    onUpdate({ ...patient, medications: meds })
    setShowForm(false)
  }

  const deleteMed = (id) => {
    if (!window.confirm('ลบยานี้?')) return
    onUpdate({ ...patient, medications: patient.medications.filter((m) => m.id !== id) })
  }

  const addScannedMeds = (medsArr) => {
    const existing = patient.medications || []
    const newMeds = medsArr.map(m => ({ ...m, id: generateId() }))
    onUpdate({ ...patient, medications: [...existing, ...newMeds] })
    setShowScan(false)
  }

  if (showScan) {
    return <MedScan settings={settings} onConfirm={addScannedMeds} onCancel={() => setShowScan(false)} />
  }

  if (showForm) {
    const existing = editingId ? patient.medications.find((m) => m.id === editingId) : null
    return <MedForm initial={existing} onSave={saveMed} onCancel={() => setShowForm(false)} />
  }

  const meds = patient.medications || []

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={openAdd}
          className="flex-1 bg-blue-600 text-white py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2"
        >
          <span className="text-lg leading-none">+</span> เพิ่มยา
        </button>
        <button
          type="button"
          onClick={() => setShowScan(true)}
          className="bg-purple-600 text-white px-4 py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-1"
        >
          <span className="text-base leading-none">📷</span> สแกนยา
        </button>
      </div>

      {meds.length === 0 && (
        <div className="text-center text-gray-400 py-12 text-sm">ยังไม่มียา — กด + เพิ่มยา</div>
      )}

      {/* Group by category */}
      {meds.length > 0 && (
        <div className="space-y-2">
          {meds.map((med) => (
            <MedCard
              key={med.id}
              med={med}
              onEdit={() => openEdit(med.id)}
              onDelete={() => deleteMed(med.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Med Card
// ============================================================
function MedCard({ med, onEdit, onDelete }) {
  const info = getDrugInfo(med.name)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-sm text-gray-900">{med.name}</span>
          {info?.riskClass === 'narrow-ti' && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
              Narrow TI
            </span>
          )}
          {info?.verified && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
              Verified
            </span>
          )}
          {info?.source === 'AI-seed' && !info?.verified && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">
              AI-seed
            </span>
          )}
        </div>
        <div className="text-xs text-gray-600 mt-0.5">
          {[med.dose, med.frequency, med.timing].filter(Boolean).join(' · ')}
        </div>
        {info?.dosage && (
          <div className="text-[11px] text-blue-600 mt-0.5 leading-snug">
            💊 {info.dosage}
          </div>
        )}
        {med.note && <div className="text-xs text-gray-400 mt-0.5">{med.note}</div>}
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-blue-500 px-2 py-1 rounded-lg active:bg-blue-50"
        >
          แก้
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-red-400 px-2 py-1 rounded-lg active:bg-red-50"
        >
          ลบ
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Med Form (add/edit)
// ============================================================
function MedForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '')
  const [dose, setDose] = useState(initial?.dose || '')
  const [frequency, setFrequency] = useState(initial?.frequency || '')
  const [timing, setTiming] = useState(initial?.timing || '')
  const [note, setNote] = useState(initial?.note || '')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [customFreq, setCustomFreq] = useState(
    !FREQUENCY_OPTIONS.includes(initial?.frequency || '') && !!initial?.frequency
  )
  const [customTiming, setCustomTiming] = useState(
    !TIMING_OPTIONS.includes(initial?.timing || '') && !!initial?.timing
  )
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleNameChange = (val) => {
    setName(val)
    const results = searchMedications(val)
    setSuggestions(results)
    setShowSuggestions(val.trim().length >= 1)
  }

  const [doseHint, setDoseHint] = useState(() => {
    const info = initial ? getDrugInfo(initial.name) : null
    return info?.dosage || ''
  })

  const selectMed = (med) => {
    setName(med.name)
    setDoseHint(med.dosage || '')
    setSuggestions([])
    setShowSuggestions(false)
  }

  const canSave = name.trim().length > 0

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <h3 className="font-semibold text-sm text-gray-700">{initial ? 'แก้ไขยา' : 'เพิ่มยา'}</h3>

        {/* Drug name with autocomplete */}
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1">ชื่อยา *</label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => {
              if (name.trim().length >= 1) {
                setSuggestions(searchMedications(name))
                setShowSuggestions(true)
              }
            }}
            placeholder="พิมพ์ชื่อยา เช่น amlo, EPO, CaCO3..."
            className={inp}
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
          />
          {showSuggestions && suggestions.length === 0 && name.trim().length >= 2 && (
            <p className="text-xs text-gray-400 mt-1">
              ไม่พบ "{name}" ในฐานยา — พิมพ์ต่อจนครบแล้วกด{' '}
              <span className="text-blue-500 font-medium">บันทึก</span> ได้เลย
            </p>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-56 overflow-y-auto">
              {suggestions.map((med, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={() => selectMed(med)}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0"
                >
                  <div className="text-sm font-medium text-gray-800">{med.name}</div>
                  <div className="text-xs text-gray-400">{med.generic}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dose hint from database */}
        {doseHint && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700 leading-relaxed">
            💊 <span className="font-medium">Ref dose:</span> {doseHint}
            <span className="text-blue-400 ml-1">(AI-seed, ยังไม่ verified)</span>
          </div>
        )}

        {/* Dose */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Dose</label>
          <input
            type="text"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            placeholder="เช่น 4000 u, 0.25 mcg, 10 mg"
            className={inp}
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Frequency</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {FREQUENCY_OPTIONS.filter((o) => o !== 'อื่น ๆ').map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  setFrequency(o)
                  setCustomFreq(false)
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  frequency === o && !customFreq
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-gray-600 border-gray-300'
                }`}
              >
                {o}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setCustomFreq(true)
                setFrequency('')
              }}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                customFreq
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-gray-600 border-gray-300'
              }`}
            >
              อื่น ๆ
            </button>
          </div>
          {customFreq && (
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder="ระบุ frequency..."
              className={inp}
            />
          )}
        </div>

        {/* Timing */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">เวลากิน</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {TIMING_OPTIONS.filter((o) => o !== 'อื่น ๆ').map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  setTiming(o)
                  setCustomTiming(false)
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  timing === o && !customTiming
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'text-gray-600 border-gray-300'
                }`}
              >
                {o}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setCustomTiming(true)
                setTiming('')
              }}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                customTiming
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-gray-600 border-gray-300'
              }`}
            >
              อื่น ๆ
            </button>
          </div>
          {customTiming && (
            <input
              type="text"
              value={timing}
              onChange={(e) => setTiming(e.target.value)}
              placeholder="ระบุเวลา..."
              className={inp}
            />
          )}
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">หมายเหตุ</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="บันทึกเพิ่มเติม (ไม่บังคับ)"
            className={inp}
          />
        </div>
      </div>

      <div className="flex gap-2 pb-8">
        <button
          type="button"
          onClick={() => canSave && onSave({ name: name.trim(), dose, frequency, timing, note })}
          disabled={!canSave}
          className={`flex-1 py-3 rounded-2xl text-sm font-medium ${
            canSave ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
          }`}
        >
          บันทึก
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl text-sm"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  )
}

// ============================================================
// Med Scan — photo → AI reads drug names → confirm
// ============================================================
const SCAN_MODEL = 'claude-sonnet-4-6'

function MedScan({ settings, onConfirm, onCancel }) {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scannedDrugs, setScannedDrugs] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [error, setError] = useState('')

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
    const reader = new FileReader()
    reader.onload = () => {
      const mediaType = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg'
      setImage({ data: reader.result.split(',')[1], type: mediaType })
    }
    reader.onerror = () => setError('ไม่สามารถอ่านไฟล์ได้')
    reader.readAsDataURL(file)
    setScannedDrugs([])
    setError('')
    e.target.value = ''
  }

  const scan = async () => {
    if (!image || !settings?.apiKey) return
    setLoading(true)
    setError('')
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
          model: SCAN_MODEL,
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: image.type, data: image.data } },
              { type: 'text', text: `อ่านชื่อยาทั้งหมดจากรูปนี้ (ซองยา/ฉลาก/ใบสั่งยา)
ตอบเป็น JSON array เท่านั้น ห้ามมีข้อความอื่น:
[{"name":"ชื่อยา generic ภาษาอังกฤษ","dose":"dose ถ้าเห็น","frequency":"frequency ถ้าเห็น","timing":"เวลากิน ถ้าเห็น"}]
ถ้าไม่เห็น dose/frequency/timing ใส่ ""
ถ้าเป็นชื่อการค้า ให้แปลงเป็น generic name ด้วย` },
            ],
          }],
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || `API error ${res.status}`)
      }
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const match = text.match(/\[[\s\S]*\]/)
      if (match) {
        const drugs = JSON.parse(match[0])
        setScannedDrugs(drugs)
        setSelected(new Set(drugs.map((_, i) => i)))
      } else {
        setError('AI ไม่สามารถอ่านชื่อยาจากรูปได้ — ลองถ่ายใหม่ให้ชัดขึ้น')
      }
    } catch (e) {
      setError(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const toggle = (i) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const updateDrug = (i, field, value) => {
    setScannedDrugs(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d))
  }

  const confirmSelected = () => {
    const meds = scannedDrugs
      .filter((_, i) => selected.has(i))
      .map(d => ({ name: d.name, dose: d.dose || '', frequency: d.frequency || '', timing: d.timing || '', note: 'สแกนจากรูป' }))
    onConfirm(meds)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <h3 className="font-semibold text-sm text-gray-700">สแกนยาจากรูป</h3>

        {!settings?.apiKey && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-xs text-orange-700">
            ใส่ API Key ใน Settings ก่อนใช้สแกน
          </div>
        )}

        <input id="med-scan-input" type="file" accept="image/*" capture onChange={handleFile} className="sr-only" />

        {!preview ? (
          <label
            htmlFor={settings?.apiKey ? 'med-scan-input' : undefined}
            className={`w-full border-2 border-dashed border-gray-300 rounded-2xl py-12 text-center text-gray-400 text-sm block ${!settings?.apiKey ? 'opacity-50' : 'cursor-pointer active:bg-gray-50'}`}
          >
            <div className="text-3xl mb-2">📷</div>
            กดเพื่อถ่ายรูป / เลือกรูปยา
          </label>
        ) : (
          <div className="space-y-3">
            <img src={preview} alt="ยา" className="w-full rounded-xl max-h-60 object-contain bg-gray-100" />
            <div className="flex gap-2">
              <label htmlFor="med-scan-input" onClick={() => { setScannedDrugs([]); setError('') }} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-xs text-center cursor-pointer">
                เปลี่ยนรูป
              </label>
              {scannedDrugs.length === 0 && (
                <button
                  type="button"
                  onClick={scan}
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-xl text-xs font-medium disabled:opacity-50"
                >
                  {loading ? 'กำลังอ่าน...' : 'AI อ่านชื่อยา'}
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">{error}</div>
        )}

        {scannedDrugs.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 font-medium">AI อ่านได้ {scannedDrugs.length} ตัว — แก้ไขได้ กดปุ่มซ้ายเพื่อเลือก/ไม่เลือก:</div>
            {scannedDrugs.map((drug, i) => (
              <div
                key={i}
                className={`rounded-xl border text-sm transition-colors ${
                  selected.has(i)
                    ? 'bg-purple-50 border-purple-300'
                    : 'bg-gray-50 border-gray-200 opacity-50'
                }`}
              >
                <div className="flex items-center gap-2 px-3 pt-2">
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-xs shrink-0 ${
                      selected.has(i)
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'border-gray-300 text-transparent'
                    }`}
                  >
                    ✓
                  </button>
                  <input
                    type="text"
                    value={drug.name}
                    onChange={(e) => updateDrug(i, 'name', e.target.value)}
                    className="flex-1 font-medium text-sm bg-transparent border-none p-0 focus:outline-none focus:ring-0"
                    placeholder="ชื่อยา"
                  />
                </div>
                <div className="flex gap-2 px-3 pb-2 pt-1 pl-11">
                  <input
                    type="text"
                    value={drug.dose || ''}
                    onChange={(e) => updateDrug(i, 'dose', e.target.value)}
                    className="flex-1 text-xs bg-transparent border-none p-0 focus:outline-none text-gray-600"
                    placeholder="dose"
                  />
                  <input
                    type="text"
                    value={drug.frequency || ''}
                    onChange={(e) => updateDrug(i, 'frequency', e.target.value)}
                    className="flex-1 text-xs bg-transparent border-none p-0 focus:outline-none text-gray-600"
                    placeholder="frequency"
                  />
                  <input
                    type="text"
                    value={drug.timing || ''}
                    onChange={(e) => updateDrug(i, 'timing', e.target.value)}
                    className="flex-1 text-xs bg-transparent border-none p-0 focus:outline-none text-gray-600"
                    placeholder="เวลากิน"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pb-8">
        {scannedDrugs.length > 0 && (
          <button
            type="button"
            onClick={confirmSelected}
            disabled={selected.size === 0}
            className={`flex-1 py-3 rounded-2xl text-sm font-medium ${
              selected.size > 0 ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            เพิ่ม {selected.size} ยา
          </button>
        )}
        <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl text-sm">
          ยกเลิก
        </button>
      </div>
    </div>
  )
}
