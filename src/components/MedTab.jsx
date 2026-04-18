import { useEffect, useRef, useState } from 'react'
import {
  FREQUENCY_OPTIONS,
  TIMING_OPTIONS,
  getDrugInfo,
  searchMedications,
} from '../medicationDatabase'
import { generateId } from '../storage'

export default function MedTab({ patient, onUpdate }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

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

  if (showForm) {
    const existing = editingId ? patient.medications.find((m) => m.id === editingId) : null
    return <MedForm initial={existing} onSave={saveMed} onCancel={() => setShowForm(false)} />
  }

  const meds = patient.medications || []

  return (
    <div className="p-4 space-y-3">
      <button
        onClick={openAdd}
        className="w-full bg-blue-600 text-white py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2"
      >
        <span className="text-lg leading-none">+</span> เพิ่มยา
      </button>

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
          <div className="text-[11px] text-blue-600 mt-0.5 leading-snug">💊 {info.dosage}</div>
        )}
        {med.note && <div className="text-xs text-gray-400 mt-0.5">{med.note}</div>}
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="text-xs text-blue-500 px-2 py-1 rounded-lg active:bg-blue-50"
        >
          แก้
        </button>
        <button
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

  const inp =
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300'

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
          onClick={() => canSave && onSave({ name: name.trim(), dose, frequency, timing, note })}
          disabled={!canSave}
          className={`flex-1 py-3 rounded-2xl text-sm font-medium ${
            canSave ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
          }`}
        >
          บันทึก
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl text-sm"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  )
}
