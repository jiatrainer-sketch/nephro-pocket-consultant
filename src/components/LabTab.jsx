import { useState } from 'react'
import { generateId, isLabOutdated, parseLabDate } from '../storage'

// ============================================================
// Lab groups — type:'number' removed, handled via inputMode in form
// ============================================================
const LAB_GROUPS = [
  {
    id: 'anemia',
    label: '🩸 Anemia',
    fields: [
      { key: 'Hb',      label: 'Hb',       unit: 'g/dL'   },
      { key: 'Hct',     label: 'Hct',       unit: '%'      },
      { key: 'Ferritin',label: 'Ferritin',  unit: 'ng/mL'  },
      { key: 'TSAT',    label: 'TSAT',      unit: '%'      },
      { key: 'Iron',    label: 'Iron',      unit: 'mcg/dL' },
      { key: 'TIBC',    label: 'TIBC',      unit: 'mcg/dL' },
    ],
  },
  {
    id: 'adequacy',
    label: '⚗️ Dialysis Adequacy',
    fields: [
      { key: 'KtV',      label: 'Kt/V',        unit: ''      },
      { key: 'URR',      label: 'URR',          unit: '%'     },
      { key: 'BUN_pre',  label: 'BUN pre-HD',   unit: 'mg/dL' },
      { key: 'BUN_post', label: 'BUN post-HD',  unit: 'mg/dL' },
      { key: 'nPCR',     label: 'nPCR',         unit: ''      },
    ],
  },
  {
    id: 'electrolytes',
    label: '⚡ Electrolytes & Kidney',
    fields: [
      { key: 'BUN',  label: 'BUN',        unit: 'mg/dL'  },
      { key: 'Cr',   label: 'Creatinine', unit: 'mg/dL'  },
      { key: 'eGFR', label: 'eGFR (ปัจจุบัน)', unit: 'mL/min' },
      { key: 'Na',   label: 'Na',         unit: 'mEq/L'  },
      { key: 'K',    label: 'K',          unit: 'mEq/L'  },
      { key: 'Cl',   label: 'Cl',         unit: 'mEq/L'  },
      { key: 'HCO3', label: 'HCO3',       unit: 'mEq/L'  },
    ],
  },
  {
    id: 'mbd',
    label: '🦴 CKD-MBD',
    fields: [
      { key: 'Ca',     label: 'Ca',              unit: 'mg/dL'  },
      { key: 'PO4',    label: 'PO4',             unit: 'mg/dL'  },
      { key: 'iPTH',   label: 'iPTH',            unit: 'pg/mL'  },
      { key: 'VitD25', label: '25-OH Vitamin D', unit: 'ng/mL'  },
      { key: 'ALP',    label: 'ALP',             unit: 'U/L'    },
    ],
  },
  {
    id: 'nutrition',
    label: '🥗 Nutrition',
    fields: [
      { key: 'Albumin', label: 'Albumin', unit: 'g/dL' },
    ],
  },
  {
    id: 'dm',
    label: '🍬 DM',
    fields: [
      { key: 'FBS',   label: 'FBS / DTX', unit: 'mg/dL' },
      { key: 'HbA1C', label: 'HbA1C',     unit: '%'     },
      { key: 'UACR',  label: 'UACR',      unit: 'mg/g'  },
    ],
  },
  {
    id: 'screening',
    label: '🔬 Infection Screening',
    select: true,
    fields: [
      { key: 'HBsAg',    label: 'HBsAg',    options: ['', 'Pos', 'Neg'] },
      { key: 'HBsAb',    label: 'HBsAb',    options: ['', 'Pos', 'Neg'] },
      { key: 'Anti-HCV', label: 'Anti-HCV', options: ['', 'Pos', 'Neg'] },
      { key: 'Anti-HIV', label: 'Anti-HIV', options: ['', 'Pos', 'Neg'] },
    ],
  },
  {
    id: 'annual',
    label: '📅 อื่น ๆ',
    fields: [
      { key: 'LDL',      label: 'LDL',      unit: 'mg/dL' },
      { key: 'TG',       label: 'TG',        unit: 'mg/dL' },
      { key: 'AST',      label: 'AST',       unit: 'U/L'   },
      { key: 'ALT',      label: 'ALT',       unit: 'U/L'   },
      { key: 'UricAcid', label: 'Uric acid', unit: 'mg/dL' },
      { key: 'PT_INR',   label: 'PT/INR',    unit: ''      },
    ],
  },
]

// ============================================================
// LabTab
// ============================================================
export default function LabTab({ patient, onUpdate }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const sortedLabs = [...(patient.labs || [])].sort((a, b) => {
    const da = parseLabDate(a.date) || new Date(0)
    const db = parseLabDate(b.date) || new Date(0)
    return db - da
  })

  const openAdd = () => { setEditingId(null); setShowForm(true) }
  const openEdit = (id) => { setEditingId(id); setShowForm(true) }

  const saveEntry = (entry) => {
    let labs
    if (editingId) {
      labs = patient.labs.map(l => l.id === editingId ? { ...entry, id: editingId } : l)
    } else {
      labs = [...(patient.labs || []), { ...entry, id: generateId() }]
    }
    onUpdate({ ...patient, labs })
    setShowForm(false)
  }

  const deleteEntry = (id) => {
    if (!window.confirm('ลบ lab entry นี้?')) return
    onUpdate({ ...patient, labs: patient.labs.filter(l => l.id !== id) })
  }

  if (showForm) {
    const existing = editingId ? patient.labs.find(l => l.id === editingId) : null
    return <LabForm initial={existing} onSave={saveEntry} onCancel={() => setShowForm(false)} />
  }

  return (
    <div className="p-4 space-y-3">
      <button
        onClick={openAdd}
        className="w-full bg-blue-600 text-white py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2"
      >
        <span className="text-lg leading-none">+</span> บันทึก Lab ใหม่
      </button>

      {sortedLabs.length === 0 && (
        <div className="text-center text-gray-400 py-12 text-sm">
          ยังไม่มี lab — กด + บันทึก Lab ใหม่
        </div>
      )}

      {sortedLabs.map(entry => (
        <LabCard
          key={entry.id}
          entry={entry}
          onEdit={() => openEdit(entry.id)}
          onDelete={() => deleteEntry(entry.id)}
        />
      ))}
    </div>
  )
}

// ============================================================
// Lab Card
// ============================================================
function LabCard({ entry, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const outdated = isLabOutdated(entry.date)
  const v = entry.values || {}
  const filledKeys = Object.keys(v).filter(k => v[k] !== '' && v[k] !== undefined && v[k] !== null)

  const allFields = LAB_GROUPS.flatMap(g => g.fields)
  const getLabel = (key) => allFields.find(f => f.key === key)?.label || key
  const getUnit  = (key) => allFields.find(f => f.key === key)?.unit  || ''

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="font-semibold text-sm text-gray-800">{entry.date || '—'}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {filledKeys.length} รายการ
            {outdated && <span className="ml-2 text-orange-500 font-medium">⚠️ lab เก่า &gt;3 เดือน</span>}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={onEdit}   className="text-xs text-blue-500 px-2 py-1">แก้ไข</button>
          <button onClick={onDelete} className="text-xs text-red-400  px-2 py-1">ลบ</button>
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 text-lg px-1">
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Quick summary row */}
      <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1">
        {['Hb', 'K', 'Ca', 'PO4', 'iPTH', 'Albumin', 'KtV', 'eGFR', 'HbA1C'].map(key => {
          const val = v[key]
          if (val === undefined || val === '') return null
          return (
            <span key={key} className="text-xs text-gray-600">
              <span className="font-medium">{getLabel(key)}</span> {val}{getUnit(key) ? ' ' + getUnit(key) : ''}
            </span>
          )
        })}
      </div>

      {/* Expanded full view */}
      {expanded && (
        <div className="border-t border-gray-50 px-4 py-3 space-y-4">
          {LAB_GROUPS.map(group => {
            const filled = group.fields.filter(f => v[f.key] !== undefined && v[f.key] !== '')
            if (filled.length === 0) return null
            return (
              <div key={group.id}>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">{group.label}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {filled.map(f => (
                    <div key={f.key} className="flex justify-between text-xs">
                      <span className="text-gray-500">{f.label}</span>
                      <span className="font-medium text-gray-800">
                        {v[f.key]}{f.unit ? ' ' + f.unit : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {entry.note && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">หมายเหตุ</p>
              <p className="text-xs text-gray-700">{entry.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Lab Form — raw strings in state, convert to numbers on save
// ============================================================
function LabForm({ initial, onSave, onCancel }) {
  const today = new Date().toISOString().slice(0, 7)
  const [date, setDate] = useState(initial?.date || today)
  const [note, setNote]   = useState(initial?.note  || '')

  // Store raw strings so user can freely type "9." without losing the dot
  const initRaw = {}
  if (initial?.values) {
    Object.entries(initial.values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) initRaw[k] = String(v)
    })
  }
  const [rawVals, setRawVals] = useState(initRaw)

  // Which groups are open
  const [openGroups, setOpenGroups] = useState({
    anemia: true, electrolytes: true, mbd: true,
  })

  const setVal = (key, raw) => setRawVals(prev => ({ ...prev, [key]: raw }))
  const toggleGroup = (id) => setOpenGroups(g => ({ ...g, [id]: !g[id] }))
  const hasValue = (key) => rawVals[key] !== undefined && rawVals[key] !== ''

  const handleSave = () => {
    // Convert raw strings to numbers (or keep string for select fields)
    const numericVals = {}
    Object.entries(rawVals).forEach(([k, raw]) => {
      if (raw === '' || raw === undefined) return
      const n = parseFloat(raw)
      numericVals[k] = isNaN(n) ? raw : n  // keep string for Pos/Neg
    })
    onSave({ date, values: numericVals, note })
  }

  const inp = 'w-full border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-center bg-white'

  return (
    <div className="p-4 space-y-4">
      {/* Date */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <label className="block text-xs text-gray-500 mb-1">วันที่เจาะ Lab</label>
        <input
          type="month"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Lab groups */}
      {LAB_GROUPS.map(group => (
        <div key={group.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleGroup(group.id)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-medium text-gray-700">{group.label}</span>
            <div className="flex items-center gap-2">
              {group.fields.some(f => hasValue(f.key)) && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {group.fields.filter(f => hasValue(f.key)).length} filled
                </span>
              )}
              <span className="text-gray-400">{openGroups[group.id] ? '▲' : '▼'}</span>
            </div>
          </button>

          {openGroups[group.id] && (
            <div className="border-t border-gray-50 px-4 py-3 grid grid-cols-2 gap-3">
              {group.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs text-gray-500 mb-1">
                    {field.label}
                    {field.unit && <span className="text-gray-400"> ({field.unit})</span>}
                  </label>
                  {field.options ? (
                    // Select field (Pos/Neg)
                    <select
                      value={rawVals[field.key] || ''}
                      onChange={e => setVal(field.key, e.target.value || undefined)}
                      className="w-full border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      {field.options.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                    </select>
                  ) : (
                    // Numeric text input — inputMode="decimal" shows number keyboard on mobile
                    <input
                      type="text"
                      inputMode="decimal"
                      value={rawVals[field.key] ?? ''}
                      onChange={e => setVal(field.key, e.target.value)}
                      placeholder="—"
                      className={inp}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Note */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <label className="block text-xs text-gray-500 mb-1">หมายเหตุ</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          placeholder="บันทึกเพิ่มเติม (ไม่บังคับ)"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
        />
      </div>

      <div className="flex gap-2 pb-8">
        <button
          onClick={handleSave}
          className="flex-1 bg-blue-600 text-white py-3 rounded-2xl text-sm font-medium"
        >
          บันทึก Lab
        </button>
        <button onClick={onCancel} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl text-sm">
          ยกเลิก
        </button>
      </div>
    </div>
  )
}
