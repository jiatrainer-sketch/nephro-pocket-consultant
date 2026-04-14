import { useState, useRef } from 'react'
import { getCKDStage, getLatestLabEntry } from '../storage'
import { searchMedications } from '../medicationDatabase'

const PATIENT_STATUSES = [
  { id: 'CKD', label: 'CKD' },
  { id: 'HD', label: 'HD' },
  { id: 'PD', label: 'PD' },
  { id: 'KT', label: 'KT' },
]

const ESRD_CAUSES = ['DKD', 'CGN', 'PKD', 'Obstructive uropathy', 'Hypertensive nephrosclerosis', 'SLE nephritis', 'Unknown', 'อื่น ๆ']
const VASCULAR_ACCESS_TYPES = ['AVF', 'AVG', 'Perm cath', 'DLC (Dual-lumen catheter)']
const COMMON_CONDITIONS = [
  'DM type 2', 'DM type 1', 'Hypertension',
  'CAD s/p PCI', 'CAD s/p CABG', 'CAD (stable)',
  'CVA (ischemic)', 'CVA (hemorrhagic)',
  'Heart failure (HFrEF)', 'Heart failure (HFpEF)',
  'AF', 'Dyslipidemia', 'Gout', 'SLE', 'PKD',
  'Hepatitis B', 'Hepatitis C', 'HIV',
]

// ฐานโรคสำหรับ autocomplete (รวม COMMON_CONDITIONS + เพิ่มโรคที่เจอบ่อยในคลินิกไต)
const CONDITION_SUGGESTIONS = [
  ...COMMON_CONDITIONS,
  'Alzheimer\'s disease', 'Parkinson\'s disease', 'Dementia',
  'Asthma', 'COPD', 'OSA', 'Pulmonary TB', 'Pulmonary hemorrhage',
  'Thyroid cancer', 'Breast cancer', 'Lung cancer', 'Colorectal cancer',
  'Hepatocellular carcinoma (HCC)', 'Renal cell carcinoma (RCC)',
  'Multiple myeloma', 'Lymphoma', 'Leukemia',
  'Rheumatoid arthritis', 'Sjogren syndrome', 'Psoriasis', 'Vasculitis',
  'Autoimmune hepatitis', 'Autoimmune thyroiditis', 'ITP',
  'IgA nephropathy', 'FSGS', 'Membranous nephropathy', 'Lupus nephritis',
  'Diabetic retinopathy', 'Diabetic neuropathy',
  'Osteoporosis', 'Osteoarthritis',
  'GERD', 'Peptic ulcer disease',
  'Depression', 'Anxiety disorder', 'Insomnia',
  'BPH', 'UTI (recurrent)', 'Nephrolithiasis',
  'Anemia of CKD', 'Iron deficiency anemia',
]

export default function InfoTab({ patient, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(clonePatient(patient))
  const [newCondition, setNewCondition] = useState('')
  const [conditionSince, setConditionSince] = useState('')
  const [newAllergy, setNewAllergy] = useState('')
  const [allergySuggestions, setAllergySuggestions] = useState([])
  const [conditionSuggestions, setConditionSuggestions] = useState([])
  const conditionInputRef = useRef(null)
  const allergyInputRef = useRef(null)

  function clonePatient(p) {
    return JSON.parse(JSON.stringify(p))
  }

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))
  const setAccess = (key, value) => setForm(f => ({
    ...f,
    vascular_access: { ...(f.vascular_access || {}), [key]: value }
  }))

  const handleConditionInput = (val) => {
    setNewCondition(val)
    const q = val.trim().toLowerCase()
    if (q.length < 2) { setConditionSuggestions([]); return }
    const already = new Set((form.conditions || []).map(c => c.name.toLowerCase()))
    const results = CONDITION_SUGGESTIONS
      .filter(c => c.toLowerCase().includes(q) && !already.has(c.toLowerCase()))
      .slice(0, 6)
    setConditionSuggestions(results)
  }

  const addCondition = (name) => {
    // Read from DOM ref as fallback (avoids stale state from mobile keyboards / race conditions)
    const fromRef = conditionInputRef.current?.value || ''
    const n = (name || newCondition || fromRef).trim()
    if (!n) return
    setForm(f => ({
      ...f,
      conditions: [...(f.conditions || []), { name: n, since: conditionSince.trim() }]
    }))
    setNewCondition('')
    setConditionSince('')
    setConditionSuggestions([])
    if (conditionInputRef.current) conditionInputRef.current.value = ''
  }

  const removeCondition = (i) => {
    setForm(f => ({ ...f, conditions: f.conditions.filter((_, idx) => idx !== i) }))
  }

  const handleAllergyInput = (val) => {
    setNewAllergy(val)
    setAllergySuggestions(val.length >= 2 ? searchMedications(val) : [])
  }

  const addAllergy = (name) => {
    const fromRef = allergyInputRef.current?.value || ''
    const a = (name || newAllergy || fromRef).trim()
    if (!a) return
    setForm(f => ({ ...f, allergies: [...(f.allergies || []), a] }))
    setNewAllergy('')
    setAllergySuggestions([])
    if (allergyInputRef.current) allergyInputRef.current.value = ''
  }

  const removeAllergy = (i) => {
    setForm(f => ({ ...f, allergies: f.allergies.filter((_, idx) => idx !== i) }))
  }

  const save = () => {
    onUpdate(form)
    setEditing(false)
  }

  const cancel = () => {
    setForm(clonePatient(patient))
    setEditing(false)
  }

  // ---- Read-only view ----
  if (!editing) {
    const latestLab = getLatestLabEntry(patient)
    const latestEgfr = latestLab?.values?.eGFR
    const ckdStage = patient.status === 'CKD' ? getCKDStage(latestEgfr) : null

    return (
      <div className="p-4 space-y-4">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
            patient.status === 'HD' ? 'bg-blue-100 text-blue-800' :
            patient.status === 'PD' ? 'bg-purple-100 text-purple-800' :
            patient.status === 'KT' ? 'bg-green-100 text-green-800' :
            'bg-orange-100 text-orange-800'
          }`}>
            {patient.status || 'HD'}
          </span>
          {ckdStage && (
            <span className="text-sm font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
              Stage {ckdStage}
              {latestEgfr ? ` (eGFR ${latestEgfr})` : ''}
            </span>
          )}
        </div>

        {/* Basic info card */}
        <Section title="ข้อมูลพื้นฐาน" onEdit={() => setEditing(true)}>
          <Row label="ชื่อ" value={patient.name || '—'} />
          <Row label="HN" value={patient.hn || '—'} />
          <Row label="น้ำหนัก" value={patient.weight_kg ? `${patient.weight_kg} kg` : '—'} />
          <Row label="ส่วนสูง" value={patient.height_cm ? `${patient.height_cm} cm` : '—'} />
          <Row label="Dry weight" value={patient.dry_weight_kg ? `${patient.dry_weight_kg} kg` : '—'} />
          <Row label="เริ่ม HD" value={patient.hd_start_date || '—'} />
          <Row label="สาเหตุ ESRD" value={patient.esrd_cause || '—'} />
        </Section>

        <Section title="Vascular Access">
          <Row label="ชนิด" value={patient.vascular_access?.type || '—'} />
          <Row label="วันที่สร้าง" value={patient.vascular_access?.created_date || '—'} />
        </Section>

        <Section title="โรคประจำตัว">
          {(!patient.conditions || patient.conditions.length === 0) ? (
            <p className="text-sm text-gray-400">—</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {patient.conditions.map((c, i) => (
                <span key={i} className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-2.5 py-1 rounded-full">
                  {c.name}{c.since ? ` (${c.since})` : ''}
                </span>
              ))}
            </div>
          )}
        </Section>

        <Section title="Allergy ยา">
          {(!patient.allergies || patient.allergies.length === 0) ? (
            <p className="text-sm text-gray-400">ไม่มี allergy</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {patient.allergies.map((a, i) => (
                <span key={i} className="bg-red-50 border border-red-200 text-red-800 text-xs px-2.5 py-1 rounded-full">
                  ⚠️ {a}
                </span>
              ))}
            </div>
          )}
        </Section>

        <button
          onClick={() => setEditing(true)}
          className="w-full border border-blue-300 text-blue-600 py-3 rounded-2xl text-sm font-medium"
        >
          ✏️ แก้ไขข้อมูล
        </button>
      </div>
    )
  }

  // ---- Edit form ----
  return (
    <div className="p-4 space-y-5">
      <FormCard title="ข้อมูลพื้นฐาน">
        <Field label="สถานะคนไข้">
          <div className="flex gap-2">
            {PATIENT_STATUSES.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => set('status', s.id)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  form.status === s.id
                    ? s.id === 'HD' ? 'bg-blue-600 text-white border-blue-600'
                      : s.id === 'PD' ? 'bg-purple-600 text-white border-purple-600'
                      : s.id === 'KT' ? 'bg-green-600 text-white border-green-600'
                      : 'bg-orange-500 text-white border-orange-500'
                    : 'text-gray-600 border-gray-300 bg-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="ชื่อ / ชื่อเล่น">
          <input className={input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="ชื่อคนไข้" />
        </Field>
        <Field label="HN (ไม่บังคับ)">
          <input className={input} value={form.hn} onChange={e => set('hn', e.target.value)} placeholder="เลข HN" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="น้ำหนัก (kg)">
            <input className={input} type="number" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} placeholder="60" />
          </Field>
          <Field label="ส่วนสูง (cm)">
            <input className={input} type="number" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} placeholder="165" />
          </Field>
        </div>
        <Field label="Dry weight (kg)">
          <input className={input} type="number" value={form.dry_weight_kg} onChange={e => set('dry_weight_kg', e.target.value)} placeholder="58" />
        </Field>
        <Field label="วันเริ่ม HD">
          <input className={input} value={form.hd_start_date} onChange={e => set('hd_start_date', e.target.value)} placeholder="เช่น 2020-06 หรือ 2563" />
        </Field>
        <Field label="สาเหตุ ESRD">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {ESRD_CAUSES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => set('esrd_cause', form.esrd_cause === c ? '' : c)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  form.esrd_cause === c ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            className={input}
            value={form.esrd_cause || ''}
            onChange={e => set('esrd_cause', e.target.value)}
            placeholder="หรือพิมพ์เพิ่ม..."
          />
        </Field>
      </FormCard>

      <FormCard title="Vascular Access">
        <Field label="ชนิด">
          <div className="flex flex-wrap gap-1.5">
            {VASCULAR_ACCESS_TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setAccess('type', form.vascular_access?.type === t ? '' : t)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  form.vascular_access?.type === t ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Field>
        <Field label="วันที่สร้าง">
          <input className={input} value={form.vascular_access?.created_date || ''} onChange={e => setAccess('created_date', e.target.value)} placeholder="เช่น 2022-03" />
        </Field>
      </FormCard>

      <FormCard title="โรคประจำตัว">
        {/* Selected conditions */}
        {form.conditions?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {form.conditions.map((c, i) => (
              <span key={i} className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs px-2.5 py-1 rounded-full">
                {c.name}{c.since ? ` (${c.since})` : ''}
                <button onClick={() => removeCondition(i)} className="text-blue-400 hover:text-red-500 ml-0.5">✕</button>
              </span>
            ))}
          </div>
        )}
        {/* Common list */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {COMMON_CONDITIONS
            .filter(c => !form.conditions?.some(x => x.name === c))
            .map(c => (
              <button
                key={c}
                type="button"
                onClick={() => addCondition(c)}
                className="text-xs px-2.5 py-1 rounded-full border border-gray-300 text-gray-600 active:bg-blue-50"
              >
                + {c}
              </button>
            ))}
        </div>
        {/* Free text + since + autocomplete */}
        <div className="relative">
          <div className="flex gap-2">
            <input
              ref={conditionInputRef}
              className={`${input} flex-1`}
              value={newCondition}
              onChange={e => handleConditionInput(e.target.value)}
              placeholder="พิมพ์โรคเพิ่ม..."
              onKeyDown={e => e.key === 'Enter' && addCondition()}
              onBlur={() => setTimeout(() => setConditionSuggestions([]), 150)}
            />
            <input
              className={`${input} w-20`}
              value={conditionSince}
              onChange={e => setConditionSince(e.target.value)}
              placeholder="ปี..."
            />
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => addCondition()}
              className="bg-blue-600 text-white px-3 rounded-xl text-sm shrink-0 active:bg-blue-700"
            >
              +
            </button>
          </div>
          {conditionSuggestions.length > 0 && (
            <div className="absolute left-0 right-24 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden max-h-56 overflow-y-auto">
              {conditionSuggestions.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={() => addCondition(c)}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          {newCondition.trim().length >= 2 && conditionSuggestions.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              ไม่พบใน list — กด <span className="text-blue-500 font-medium">+</span> เพื่อเพิ่มเป็น custom
            </p>
          )}
        </div>
      </FormCard>

      <FormCard title="Allergy ยา">
        {form.allergies?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {form.allergies.map((a, i) => (
              <span key={i} className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-800 text-xs px-2.5 py-1 rounded-full">
                ⚠️ {a}
                <button onClick={() => removeAllergy(i)} className="text-red-400 hover:text-red-600 ml-0.5">✕</button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <div className="flex gap-2">
            <input
              ref={allergyInputRef}
              className={`${input} flex-1`}
              value={newAllergy}
              onChange={e => handleAllergyInput(e.target.value)}
              placeholder="พิมพ์ชื่อยา เช่น amlo, voltaren..."
              onKeyDown={e => e.key === 'Enter' && addAllergy()}
              onBlur={() => setTimeout(() => setAllergySuggestions([]), 150)}
            />
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => addAllergy()}
              className="bg-red-500 text-white px-3 rounded-xl text-sm shrink-0 active:bg-red-600"
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
      </FormCard>

      {/* Save / Cancel */}
      <div className="flex gap-2 pb-8">
        <button onClick={save} className="flex-1 bg-blue-600 text-white py-3 rounded-2xl text-sm font-medium">
          บันทึก
        </button>
        <button onClick={cancel} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl text-sm">
          ยกเลิก
        </button>
      </div>
    </div>
  )
}

// ---- sub-components ----
const input = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white'

function Section({ title, children, onEdit }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
        {onEdit && (
          <button onClick={onEdit} className="text-xs text-blue-500">แก้ไข</button>
        )}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between py-1 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500 shrink-0 mr-4">{label}</span>
      <span className="text-sm text-gray-900 text-right">{value}</span>
    </div>
  )
}

function FormCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-50">
        <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
      </div>
      <div className="px-4 py-3 space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}
