import { useState, useMemo } from 'react'
import RecommendationTab from './RecommendationTab'
import ChatTab from './ChatTab'
import MedTab from './MedTab'
import { searchMedications } from '../medicationDatabase'

const QUICK_CONDITIONS = [
  'DM type 2', 'DM type 1', 'Hypertension', 'CAD', 'Heart failure',
  'AF', 'Dyslipidemia', 'Gout', 'SLE', 'CKD',
]

export default function QuickMode({ onBack, settings }) {
  const [tab, setTab] = useState('lab')
  const [patient, setPatient] = useState(createQuickPatient())

  function createQuickPatient() {
    return {
      id: '__quick__',
      name: 'Quick Mode',
      hn: '',
      age: '',
      weight_kg: '',
      status: 'HD',
      conditions: [],
      allergies: [],
      medications: [],
      labs: [],
    }
  }

  const reset = () => {
    if (window.confirm('ล้างข้อมูลทั้งหมดใน Quick Mode?')) {
      setPatient(createQuickPatient())
      setTab('lab')
    }
  }

  const TABS = [
    { id: 'lab', label: '🧪 Lab' },
    { id: 'med', label: '💊 ยา' },
    { id: 'rec', label: '📋 Rec' },
    { id: 'chat', label: '💬 AI' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header
        className="bg-teal-700 text-white px-4 pb-0 sticky top-0 z-20 shadow-md"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 pb-2">
            <button onClick={onBack} className="text-2xl leading-none shrink-0">←</button>
            <div className="flex-1">
              <div className="font-bold text-base">Quick Mode</div>
              <div className="text-xs text-teal-200">ไม่บันทึกข้อมูล</div>
            </div>
            <button onClick={reset} className="text-xs bg-teal-600 px-3 py-1.5 rounded-lg">
              ล้าง
            </button>
          </div>
          <div className="flex -mx-4 px-2 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                  tab === t.id ? 'border-white text-white' : 'border-transparent text-teal-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full">
        {tab === 'lab' && (
          <QuickLabInput patient={patient} onUpdate={setPatient} />
        )}
        {tab === 'med' && <MedTab patient={patient} onUpdate={setPatient} />}
        {tab === 'rec' && <RecommendationTab patient={patient} />}
        {tab === 'chat' && <ChatTab patient={patient} settings={settings} />}
      </main>

      <div className="max-w-lg mx-auto w-full px-4 py-2 text-center">
        <p className="text-xs text-gray-400">
          Clinical decision support — แพทย์ต้อง confirm ก่อนสั่งยาเสมอ
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Quick fields — ใช้ type="text" inputMode="decimal" เพื่อให้กรอกตัวเลขได้บนมือถือ
// ============================================================
const QUICK_FIELDS = [
  { key: 'Hb',      label: 'Hb',       unit: 'g/dL'   },
  { key: 'Ferritin',label: 'Ferritin',  unit: 'ng/mL'  },
  { key: 'TSAT',    label: 'TSAT',      unit: '%'      },
  { key: 'K',       label: 'K',         unit: 'mEq/L'  },
  { key: 'Ca',      label: 'Ca',        unit: 'mg/dL'  },
  { key: 'PO4',     label: 'PO4',       unit: 'mg/dL'  },
  { key: 'iPTH',    label: 'iPTH',      unit: 'pg/mL'  },
  { key: 'VitD25',  label: '25-OH VitD',unit: 'ng/mL'  },
  { key: 'Albumin', label: 'Albumin',   unit: 'g/dL'   },
  { key: 'KtV',     label: 'Kt/V',      unit: ''       },
  { key: 'HCO3',    label: 'HCO3',      unit: 'mEq/L'  },
  { key: 'Na',      label: 'Na',        unit: 'mEq/L'  },
  { key: 'URR',     label: 'URR',       unit: '%'      },
  { key: 'BUN',     label: 'BUN',       unit: 'mg/dL'  },
  { key: 'Cr',      label: 'Cr',        unit: 'mg/dL'  },
  { key: 'eGFR',    label: 'eGFR',      unit: 'mL/min' },
  { key: 'FBS',     label: 'FBS/DTX',   unit: 'mg/dL'  },
  { key: 'HbA1C',   label: 'HbA1C',     unit: '%'      },
  { key: 'UACR',    label: 'UACR',      unit: 'mg/g'   },
]

function QuickLabInput({ patient, onUpdate }) {
  const today = new Date().toISOString().slice(0, 7)
  const existingLab = patient.labs?.[0]
  const existingVals = existingLab?.values || {}

  // Store raw strings so user can type "9." without losing the dot
  const initRaw = {}
  Object.entries(existingVals).forEach(([k, v]) => {
    if (v !== undefined && v !== null) initRaw[k] = String(v)
  })

  const [rawVals, setRawVals] = useState(initRaw)
  const [date, setDate] = useState(existingLab?.date || today)
  const [rawAge, setRawAge] = useState(
    patient.age ? String(patient.age) : ''
  )
  const [rawWeight, setRawWeight] = useState(
    patient.weight_kg ? String(patient.weight_kg) : ''
  )
  const [rawEgfrPrev, setRawEgfrPrev] = useState(
    existingVals.eGFR_prev != null ? String(existingVals.eGFR_prev) : ''
  )
  const [rawEgfrPrevMonths, setRawEgfrPrevMonths] = useState(
    existingVals.eGFR_prev_months != null ? String(existingVals.eGFR_prev_months) : ''
  )
  const [rawPthPrev, setRawPthPrev] = useState(
    existingVals.iPTH_prev != null ? String(existingVals.iPTH_prev) : ''
  )
  const [rawPthPrevMonths, setRawPthPrevMonths] = useState(
    existingVals.iPTH_prev_months != null ? String(existingVals.iPTH_prev_months) : ''
  )
  const [newAllergy, setNewAllergy] = useState('')
  const [allergySuggestions, setAllergySuggestions] = useState([])
  const [newCondition, setNewCondition] = useState('')

  // Convert raw strings → numbers for patient/recommendations
  const buildUpdate = (nextRaw, nextDate, nextWeight, nextPatient, nextPrev, nextMonths, nextPthPrev, nextPthMonths) => {
    const numericVals = {}
    Object.entries(nextRaw).forEach(([k, v]) => {
      if (v !== '' && v !== undefined) {
        const n = parseFloat(v)
        if (!isNaN(n)) numericVals[k] = n
      }
    })
    const pPrev = nextPrev !== undefined ? nextPrev : rawEgfrPrev
    const pMonths = nextMonths !== undefined ? nextMonths : rawEgfrPrevMonths
    if (pPrev !== '' && pPrev !== undefined) {
      const n = parseFloat(pPrev); if (!isNaN(n)) numericVals.eGFR_prev = n
    }
    if (pMonths !== '' && pMonths !== undefined) {
      const n = parseFloat(pMonths); if (!isNaN(n)) numericVals.eGFR_prev_months = n
    }
    const pp = nextPthPrev !== undefined ? nextPthPrev : rawPthPrev
    const pm = nextPthMonths !== undefined ? nextPthMonths : rawPthPrevMonths
    if (pp !== '' && pp !== undefined) {
      const n = parseFloat(pp); if (!isNaN(n)) numericVals.iPTH_prev = n
    }
    if (pm !== '' && pm !== undefined) {
      const n = parseFloat(pm); if (!isNaN(n)) numericVals.iPTH_prev_months = n
    }
    return {
      ...(nextPatient || patient),
      age: rawAge ? parseInt(rawAge) || rawAge : '',
      weight_kg: nextWeight ? parseFloat(nextWeight) || nextWeight : '',
      labs: [{ id: 'quick', date: nextDate, values: numericVals }],
    }
  }

  const handleEgfrPrev = (val) => {
    setRawEgfrPrev(val)
    onUpdate(buildUpdate(rawVals, date, rawWeight, null, val, rawEgfrPrevMonths))
  }
  const handleEgfrPrevMonths = (val) => {
    setRawEgfrPrevMonths(val)
    onUpdate(buildUpdate(rawVals, date, rawWeight, null, rawEgfrPrev, val))
  }
  const handlePthPrev = (val) => {
    setRawPthPrev(val)
    onUpdate(buildUpdate(rawVals, date, rawWeight, null, undefined, undefined, val, rawPthPrevMonths))
  }
  const handlePthPrevMonths = (val) => {
    setRawPthPrevMonths(val)
    onUpdate(buildUpdate(rawVals, date, rawWeight, null, undefined, undefined, rawPthPrev, val))
  }

  const setVal = (key, raw) => {
    const next = { ...rawVals, [key]: raw }
    setRawVals(next)
    onUpdate(buildUpdate(next, date, rawWeight))
  }

  const handleDate = (val) => {
    setDate(val)
    onUpdate(buildUpdate(rawVals, val, rawWeight))
  }

  const handleAge = (val) => {
    setRawAge(val)
    const n = parseInt(val)
    onUpdate({ ...buildUpdate(rawVals, date, rawWeight), age: !isNaN(n) ? n : val })
  }

  const handleWeight = (val) => {
    setRawWeight(val)
    onUpdate(buildUpdate(rawVals, date, val))
  }

  const toggleCondition = (name) => {
    const exists = patient.conditions.some(c => c.name === name)
    const next = exists
      ? patient.conditions.filter(c => c.name !== name)
      : [...patient.conditions, { name, since: '' }]
    onUpdate({ ...buildUpdate(rawVals, date, rawWeight), conditions: next })
  }

  const addCondition = () => {
    const c = newCondition.trim()
    if (!c) return
    const exists = patient.conditions.some(x => x.name === c)
    if (exists) { setNewCondition(''); return }
    onUpdate({ ...buildUpdate(rawVals, date, rawWeight), conditions: [...patient.conditions, { name: c, since: '' }] })
    setNewCondition('')
  }

  const handleAllergyInput = (val) => {
    setNewAllergy(val)
    setAllergySuggestions(val.length >= 2 ? searchMedications(val) : [])
  }

  const addAllergy = (name) => {
    const a = (name || newAllergy).trim()
    if (!a) return
    onUpdate({
      ...buildUpdate(rawVals, date, rawWeight),
      allergies: [...patient.allergies, a],
    })
    setNewAllergy('')
    setAllergySuggestions([])
  }

  const removeAllergy = (i) => {
    onUpdate({
      ...buildUpdate(rawVals, date, rawWeight),
      allergies: patient.allergies.filter((_, idx) => idx !== i),
    })
    setAllergySuggestions([])
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 text-center bg-white'

  return (
    <div className="p-4 space-y-4">
      {/* Date + Age + Weight */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">วันที่เจาะ</label>
            <input
              type="month"
              value={date}
              onChange={e => handleDate(e.target.value)}
              className={inp}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">อายุ (ปี)</label>
            <input
              type="text"
              inputMode="numeric"
              value={rawAge}
              onChange={e => handleAge(e.target.value)}
              placeholder="55"
              className={inp}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">น้ำหนัก (kg)</label>
            <input
              type="text"
              inputMode="decimal"
              value={rawWeight}
              onChange={e => handleWeight(e.target.value)}
              placeholder="60"
              className={inp}
            />
          </div>
        </div>

        {/* Lab grid */}
        <div className="grid grid-cols-3 gap-x-2 gap-y-3">
          {QUICK_FIELDS.map(f => (
            <div key={f.key}>
              <label className="block text-xs text-gray-500 mb-1 text-center leading-tight">
                {f.label}
                {f.unit && <span className="text-gray-400 block text-[10px]">({f.unit})</span>}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={rawVals[f.key] ?? ''}
                onChange={e => setVal(f.key, e.target.value)}
                placeholder="—"
                className={inp}
              />
            </div>
          ))}
        </div>

        {/* eGFR trend — compare กับ eGFR เดิม */}
        <EgfrTrend
          egfrCurrent={rawVals.eGFR}
          rawEgfrPrev={rawEgfrPrev}
          rawEgfrPrevMonths={rawEgfrPrevMonths}
          onEgfrPrev={handleEgfrPrev}
          onEgfrPrevMonths={handleEgfrPrevMonths}
        />

        {/* iPTH trend — compare กับ iPTH เดิม */}
        <PthTrend
          pthCurrent={rawVals.iPTH}
          rawPthPrev={rawPthPrev}
          rawPthPrevMonths={rawPthPrevMonths}
          onPthPrev={handlePthPrev}
          onPthPrevMonths={handlePthPrevMonths}
        />
      </div>

      {/* โรคประจำตัว */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">โรคประจำตัว</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_CONDITIONS.map(name => {
            const selected = patient.conditions.some(c => c.name === name)
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggleCondition(name)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  selected
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'text-gray-600 border-gray-300 bg-white'
                }`}
              >
                {name}
              </button>
            )
          })}
        </div>
        {/* Custom condition free text */}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newCondition}
            onChange={e => setNewCondition(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCondition()}
            placeholder="เพิ่มโรคอื่น เช่น Autoimmune, HIV..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
          <button
            type="button"
            onClick={addCondition}
            className="bg-teal-600 text-white px-3 rounded-xl text-sm shrink-0"
          >
            +
          </button>
        </div>
        {patient.conditions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {patient.conditions.map((c, i) => (
              <span key={i} className="flex items-center gap-1 bg-teal-50 border border-teal-200 text-teal-800 text-xs px-2.5 py-1 rounded-full">
                {c.name}
                {!QUICK_CONDITIONS.includes(c.name) && (
                  <button onClick={() => {
                    const next = patient.conditions.filter((_, idx) => idx !== i)
                    onUpdate({ ...buildUpdate(rawVals, date, rawWeight), conditions: next })
                  }} className="text-teal-400 ml-0.5">✕</button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Allergy */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">Allergy ยา</p>
        {patient.allergies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {patient.allergies.map((a, i) => (
              <span key={i} className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-800 text-xs px-2.5 py-1 rounded-full">
                ⚠️ {a}
                <button onClick={() => removeAllergy(i)} className="text-red-400 ml-0.5">✕</button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              value={newAllergy}
              onChange={e => handleAllergyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addAllergy()}
              onBlur={() => setTimeout(() => setAllergySuggestions([]), 150)}
              placeholder="พิมพ์ชื่อยา เช่น amlo, penicillin..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <button
              type="button"
              onClick={() => addAllergy()}
              className="bg-red-500 text-white px-3 rounded-xl text-sm shrink-0"
            >
              +
            </button>
          </div>
          {allergySuggestions.length > 0 && (
            <div className="absolute left-0 right-10 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
              {allergySuggestions.map((med, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={() => addAllergy(med.name)}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-red-50 border-b border-gray-50 last:border-0"
                >
                  <span className="font-medium text-gray-800">{med.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{med.generic}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-center text-gray-400">
        กรอกเสร็จ → ไปดู 📋 Rec หรือ 💬 AI ด้านบน
      </p>
    </div>
  )
}

// ============================================================
// PTH trend — compare current กับ iPTH เดิม
// ============================================================
const PTH_MONTH_PRESETS = [3, 6, 12, 24]

function PthTrend({ pthCurrent, rawPthPrev, rawPthPrevMonths, onPthPrev, onPthPrevMonths }) {
  const cur = parseFloat(pthCurrent)
  const prev = parseFloat(rawPthPrev)
  const months = parseFloat(rawPthPrevMonths)
  const valid = !isNaN(cur) && !isNaN(prev) && prev > 0 && !isNaN(months) && months > 0
  const diff = valid ? cur - prev : null
  const pct = valid ? (diff / prev) * 100 : null

  let tone = 'bg-gray-50 border-gray-200 text-gray-700'
  if (valid) {
    if (pct >= 50)  tone = 'bg-red-50 border-red-200 text-red-800'
    else if (pct >= 20) tone = 'bg-yellow-50 border-yellow-200 text-yellow-800'
    else if (pct <= -30) tone = 'bg-yellow-50 border-yellow-200 text-yellow-800'
    else tone = 'bg-green-50 border-green-200 text-green-800'
  }

  const inpSmall = 'w-full border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 text-center bg-white'

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs text-gray-500 mb-2">📉 เทียบ iPTH เดิม (ถ้ามี)</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1 text-center">
            iPTH เดิม<span className="text-gray-400 block text-[10px]">(pg/mL)</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={rawPthPrev}
            onChange={e => onPthPrev(e.target.value)}
            placeholder="350"
            className={inpSmall}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 text-center">
            เมื่อ<span className="text-gray-400 block text-[10px]">(เดือนก่อน)</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={rawPthPrevMonths}
            onChange={e => onPthPrevMonths(e.target.value)}
            placeholder="6"
            className={inpSmall}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {PTH_MONTH_PRESETS.map(v => (
          <button
            key={v}
            type="button"
            onClick={() => onPthPrevMonths(String(v))}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              parseFloat(rawPthPrevMonths) === v
                ? 'bg-teal-600 text-white border-teal-600'
                : 'text-gray-600 border-gray-300 bg-white'
            }`}
          >
            {v} เดือน
          </button>
        ))}
      </div>
      {valid && (
        <div className={`mt-3 rounded-xl border px-3 py-2 text-xs ${tone}`}>
          <div className="font-semibold">
            {diff >= 0 ? '▲' : '▼'} {diff >= 0 ? '+' : ''}{diff.toFixed(0)} pg/mL
            <span className="ml-2">({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)</span>
            <span className="ml-2 font-normal">ใน {months} เดือน</span>
          </div>
          <div className="mt-0.5 text-gray-500">
            {pct >= 50 ? '⚠️ iPTH เพิ่มมาก — พิจารณาเพิ่ม/เริ่ม active VitD หรือ Cinacalcet'
              : pct >= 20 ? 'iPTH มีแนวโน้มสูงขึ้น — ติดตามใกล้ชิด'
              : pct <= -30 ? 'iPTH ลดลงดี — monitor ไม่ให้ต่ำเกิน'
              : 'iPTH ค่อนข้างคงที่'}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// eGFR trend — compare current กับ eGFR เดิม + คำนวณ % drop + rate/yr
// ============================================================
const MONTH_PRESETS = [1, 3, 6, 12, 24]
const DAY_PRESETS   = [7, 14, 30, 60, 90]

function EgfrTrend({ egfrCurrent, rawEgfrPrev, rawEgfrPrevMonths, onEgfrPrev, onEgfrPrevMonths }) {
  const [unit, setUnit] = useState('เดือน') // 'เดือน' | 'วัน'

  // แปลง rawEgfrPrevMonths (เก็บเป็น months เสมอ) → ค่าที่แสดงตาม unit ปัจจุบัน
  const displayTimeVal = useMemo(() => {
    if (rawEgfrPrevMonths === '' || rawEgfrPrevMonths == null) return ''
    const m = parseFloat(rawEgfrPrevMonths)
    if (isNaN(m)) return rawEgfrPrevMonths
    if (unit === 'วัน') return String(Math.round(m * 30.44))
    return rawEgfrPrevMonths
  }, [rawEgfrPrevMonths, unit])

  // user พิมพ์ → แปลงเป็น months แล้วส่งขึ้น parent
  const handleTimeInput = (val) => {
    if (unit === 'วัน') {
      const days = parseFloat(val)
      onEgfrPrevMonths(val === '' ? '' : !isNaN(days) ? String(days / 30.44) : val)
    } else {
      onEgfrPrevMonths(val)
    }
  }

  // preset click
  const handlePreset = (v) => {
    if (unit === 'วัน') {
      onEgfrPrevMonths(String(v / 30.44))
    } else {
      onEgfrPrevMonths(String(v))
    }
  }

  // เช็คว่า preset ตรงกับค่าปัจจุบันไหม
  const isPresetActive = (v) => {
    const m = parseFloat(rawEgfrPrevMonths)
    if (isNaN(m)) return false
    if (unit === 'วัน') return Math.round(m * 30.44) === v
    return m === v
  }

  // สลับ unit — แปลงค่าที่ค้างอยู่
  const switchUnit = (newUnit) => {
    if (newUnit === unit) return
    const m = parseFloat(rawEgfrPrevMonths)
    if (!isNaN(m) && m > 0) {
      if (newUnit === 'วัน') {
        // เปลี่ยนจาก เดือน → วัน: ค่า months ไม่เปลี่ยน แค่ display เปลี่ยน
      } else {
        // เปลี่ยนจาก วัน → เดือน: ค่า months ไม่เปลี่ยนเช่นกัน
      }
    }
    setUnit(newUnit)
  }

  const cur = parseFloat(egfrCurrent)
  const prev = parseFloat(rawEgfrPrev)
  const months = parseFloat(rawEgfrPrevMonths)
  const valid = !isNaN(cur) && !isNaN(prev) && prev > 0 && !isNaN(months) && months > 0
  const diff = valid ? cur - prev : null
  const pct = valid ? (diff / prev) * 100 : null
  const ratePerYear = valid ? (diff / months) * 12 : null

  let tone = 'bg-gray-50 border-gray-200 text-gray-700'
  if (valid) {
    if (pct <= -30 || ratePerYear <= -5) tone = 'bg-red-50 border-red-200 text-red-800'
    else if (pct <= -10) tone = 'bg-yellow-50 border-yellow-200 text-yellow-800'
    else if (pct >= 0) tone = 'bg-green-50 border-green-200 text-green-800'
  }

  const inpSmall = 'w-full border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 text-center bg-white'
  const presets = unit === 'วัน' ? DAY_PRESETS : MONTH_PRESETS

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs text-gray-500 mb-2">📉 เทียบ eGFR เดิม (ถ้ามี)</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1 text-center">
            eGFR เดิม<span className="text-gray-400 block text-[10px]">(mL/min)</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={rawEgfrPrev}
            onChange={e => onEgfrPrev(e.target.value)}
            placeholder="35"
            className={inpSmall}
          />
        </div>
        <div>
          {/* unit toggle */}
          <div className="flex justify-center gap-1 mb-1">
            {['เดือน', 'วัน'].map(u => (
              <button
                key={u}
                type="button"
                onClick={() => switchUnit(u)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  unit === u ? 'bg-teal-600 text-white border-teal-600' : 'text-gray-500 border-gray-300 bg-white'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
          <label className="block text-xs text-gray-500 mb-1 text-center">
            เมื่อ<span className="text-gray-400 block text-[10px]">({unit}ก่อน)</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={displayTimeVal}
            onChange={e => handleTimeInput(e.target.value)}
            placeholder={unit === 'วัน' ? '15' : '3'}
            className={inpSmall}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {presets.map(v => (
          <button
            key={v}
            type="button"
            onClick={() => handlePreset(v)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              isPresetActive(v)
                ? 'bg-teal-600 text-white border-teal-600'
                : 'text-gray-600 border-gray-300 bg-white'
            }`}
          >
            {v} {unit}
          </button>
        ))}
      </div>
      {valid && (
        <div className={`mt-3 rounded-xl border px-3 py-2 text-xs ${tone}`}>
          <div className="font-semibold">
            {diff >= 0 ? '▲' : '▼'} {diff >= 0 ? '+' : ''}{diff.toFixed(1)} mL/min
            <span className="ml-2">({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)</span>
          </div>
          <div className="mt-0.5">
            Rate: {ratePerYear >= 0 ? '+' : ''}{ratePerYear.toFixed(1)} mL/min/ปี
          </div>
        </div>
      )}
    </div>
  )
}
