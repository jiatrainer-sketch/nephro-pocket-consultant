import { useState } from 'react'
import RecommendationTab from './RecommendationTab'
import ChatTab from './ChatTab'
import MedTab from './MedTab'

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
  const [rawWeight, setRawWeight] = useState(
    patient.weight_kg ? String(patient.weight_kg) : ''
  )
  const [newAllergy, setNewAllergy] = useState('')
  const [newCondition, setNewCondition] = useState('')

  // Convert raw strings → numbers for patient/recommendations
  const buildUpdate = (nextRaw, nextDate, nextWeight, nextPatient) => {
    const numericVals = {}
    Object.entries(nextRaw).forEach(([k, v]) => {
      if (v !== '' && v !== undefined) {
        const n = parseFloat(v)
        if (!isNaN(n)) numericVals[k] = n
      }
    })
    return {
      ...(nextPatient || patient),
      weight_kg: nextWeight ? parseFloat(nextWeight) || nextWeight : '',
      labs: [{ id: 'quick', date: nextDate, values: numericVals }],
    }
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

  const addAllergy = () => {
    const a = newAllergy.trim()
    if (!a) return
    onUpdate({
      ...buildUpdate(rawVals, date, rawWeight),
      allergies: [...patient.allergies, a],
    })
    setNewAllergy('')
  }

  const removeAllergy = (i) => {
    onUpdate({
      ...buildUpdate(rawVals, date, rawWeight),
      allergies: patient.allergies.filter((_, idx) => idx !== i),
    })
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 text-center bg-white'

  return (
    <div className="p-4 space-y-4">
      {/* Date + Weight */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
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
        <div className="flex gap-2">
          <input
            type="text"
            value={newAllergy}
            onChange={e => setNewAllergy(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addAllergy()}
            placeholder="ชื่อยาที่แพ้..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
          <button
            type="button"
            onClick={addAllergy}
            className="bg-red-500 text-white px-3 rounded-xl text-sm"
          >
            +
          </button>
        </div>
      </div>

      <p className="text-xs text-center text-gray-400">
        กรอกเสร็จ → ไปดู 📋 Rec หรือ 💬 AI ด้านบน
      </p>
    </div>
  )
}
