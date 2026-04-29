import { useEffect, useState } from 'react'
import { DR_AI_MODEL } from '../drAIPrompt'
import { generateId, isLabOutdated, parseLabDate } from '../storage'

// ============================================================
// Lab groups — type:'number' removed, handled via inputMode in form
// ============================================================
const LAB_GROUPS = [
  {
    id: 'anemia',
    label: '🩸 Anemia',
    fields: [
      { key: 'Hb', label: 'Hb', unit: 'g/dL' },
      { key: 'Hct', label: 'Hct', unit: '%' },
      { key: 'Ferritin', label: 'Ferritin', unit: 'ng/mL' },
      { key: 'TSAT', label: 'TSAT', unit: '%' },
      { key: 'Iron', label: 'Iron', unit: 'mcg/dL' },
      { key: 'TIBC', label: 'TIBC', unit: 'mcg/dL' },
    ],
  },
  {
    id: 'adequacy',
    label: '⚗️ Dialysis Adequacy',
    fields: [
      { key: 'KtV', label: 'Kt/V', unit: '' },
      { key: 'URR', label: 'URR', unit: '%' },
      { key: 'BUN_pre', label: 'BUN pre-HD', unit: 'mg/dL' },
      { key: 'BUN_post', label: 'BUN post-HD', unit: 'mg/dL' },
      { key: 'nPCR', label: 'nPCR', unit: '' },
    ],
  },
  {
    id: 'electrolytes',
    label: '⚡ Electrolytes & Kidney',
    fields: [
      { key: 'BUN', label: 'BUN', unit: 'mg/dL' },
      { key: 'Cr', label: 'Creatinine', unit: 'mg/dL' },
      { key: 'eGFR', label: 'eGFR (ปัจจุบัน)', unit: 'mL/min' },
      { key: 'Na', label: 'Na', unit: 'mEq/L' },
      { key: 'K', label: 'K', unit: 'mEq/L' },
      { key: 'Cl', label: 'Cl', unit: 'mEq/L' },
      { key: 'HCO3', label: 'HCO3', unit: 'mEq/L' },
    ],
  },
  {
    id: 'mbd',
    label: '🦴 CKD-MBD',
    fields: [
      { key: 'Ca', label: 'Ca', unit: 'mg/dL' },
      { key: 'PO4', label: 'PO4', unit: 'mg/dL' },
      { key: 'iPTH', label: 'iPTH', unit: 'pg/mL' },
      { key: 'VitD25', label: '25-OH Vitamin D', unit: 'ng/mL' },
      { key: 'ALP', label: 'ALP', unit: 'U/L' },
    ],
  },
  {
    id: 'nutrition',
    label: '🥗 Nutrition',
    fields: [{ key: 'Albumin', label: 'Albumin', unit: 'g/dL' }],
  },
  {
    id: 'dm',
    label: '🍬 DM',
    fields: [
      { key: 'FBS', label: 'FBS / DTX', unit: 'mg/dL' },
      { key: 'HbA1C', label: 'HbA1C', unit: '%' },
      { key: 'UACR', label: 'UACR', unit: 'mg/g' },
    ],
  },
  {
    id: 'screening',
    label: '🔬 Infection Screening',
    select: true,
    fields: [
      { key: 'HBsAg', label: 'HBsAg', options: ['', 'Pos', 'Neg'] },
      { key: 'HBsAb', label: 'HBsAb', options: ['', 'Pos', 'Neg'] },
      { key: 'Anti-HCV', label: 'Anti-HCV', options: ['', 'Pos', 'Neg'] },
      { key: 'Anti-HIV', label: 'Anti-HIV', options: ['', 'Pos', 'Neg'] },
    ],
  },
  {
    id: 'annual',
    label: '📅 อื่น ๆ',
    fields: [
      { key: 'LDL', label: 'LDL', unit: 'mg/dL' },
      { key: 'TG', label: 'TG', unit: 'mg/dL' },
      { key: 'AST', label: 'AST', unit: 'U/L' },
      { key: 'ALT', label: 'ALT', unit: 'U/L' },
      { key: 'UricAcid', label: 'Uric acid', unit: 'mg/dL' },
      { key: 'PT_INR', label: 'PT/INR', unit: '' },
    ],
  },
]

// ============================================================
// Sparkline chart (pure SVG, no library)
// ============================================================
function Sparkline({ data, width = 80, height = 36, color, refLow, refHigh }) {
  if (!data || data.length < 2) return null
  const vals = data.map((d) => d.v)
  const allVals = [...vals, refLow, refHigh].filter((v) => v != null)
  const minV = Math.min(...allVals)
  const maxV = Math.max(...allVals)
  const range = maxV - minV || 1
  const pad = 3
  const w = width - pad * 2
  const h = height - pad * 2
  const cx = (i) => pad + (i / (data.length - 1)) * w
  const cy = (v) => pad + h - ((v - minV) / range) * h
  const pathD = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${cy(d.v).toFixed(1)}`)
    .join(' ')
  const lastVal = vals[vals.length - 1]
  const inRange = (refLow == null || lastVal >= refLow) && (refHigh == null || lastVal <= refHigh)
  const lineColor = color || (inRange ? '#22c55e' : '#ef4444')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Reference range band */}
      {refLow != null && refHigh != null && (
        <rect
          x={pad}
          y={cy(refHigh).toFixed(1)}
          width={w}
          height={(cy(refLow) - cy(refHigh)).toFixed(1)}
          fill="#22c55e18"
        />
      )}
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dots */}
      {data.map((d, i) => (
        <circle key={i} cx={cx(i).toFixed(1)} cy={cy(d.v).toFixed(1)} r="2.2" fill={lineColor} />
      ))}
    </svg>
  )
}

// Key labs to show in trend section
const TREND_LABS = [
  { key: 'eGFR', label: 'eGFR', unit: '', color: '#3b82f6', refLow: null, refHigh: null },
  { key: 'Hb', label: 'Hb', unit: 'g/dL', color: null, refLow: 10, refHigh: 12 },
  { key: 'K', label: 'K', unit: 'mEq/L', color: null, refLow: 3.5, refHigh: 5.5 },
  { key: 'PO4', label: 'PO4', unit: 'mg/dL', color: null, refLow: 3.5, refHigh: 5.5 },
  { key: 'iPTH', label: 'iPTH', unit: 'pg/mL', color: '#a855f7', refLow: 130, refHigh: 600 },
  { key: 'Albumin', label: 'Albumin', unit: 'g/dL', color: null, refLow: 4.0, refHigh: null },
  { key: 'HbA1C', label: 'HbA1C', unit: '%', color: null, refLow: null, refHigh: 7.0 },
]

function TrendSection({ labs }) {
  if (!labs || labs.length < 2) return null
  const sorted = [...labs].sort((a, b) => (a.date || '').localeCompare(b.date || ''))

  const cards = TREND_LABS.map((tl) => {
    const points = sorted
      .map((entry) => ({ date: entry.date, v: Number.parseFloat(entry.values?.[tl.key]) }))
      .filter((p) => !Number.isNaN(p.v))
    if (points.length < 2) return null
    const latest = points[points.length - 1].v
    const prev = points[points.length - 2].v
    const diff = latest - prev
    const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→'
    const arrowColor =
      tl.key === 'eGFR'
        ? diff >= 0
          ? 'text-green-600'
          : 'text-red-500'
        : diff === 0
          ? 'text-gray-400'
          : tl.refLow != null && latest < tl.refLow
            ? 'text-red-500'
            : tl.refHigh != null && latest > tl.refHigh
              ? 'text-red-500'
              : 'text-green-600'

    return { tl, points, latest, arrow, arrowColor }
  }).filter(Boolean)

  if (cards.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-1">
      <div className="px-4 pt-3 pb-1">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">📈 แนวโน้ม Lab</p>
      </div>
      <div className="flex overflow-x-auto gap-0 px-2 pb-3 scrollbar-hide">
        {cards.map(({ tl, points, latest, arrow, arrowColor }) => (
          <div
            key={tl.key}
            className="shrink-0 flex flex-col items-center px-3 py-1.5 min-w-[80px]"
          >
            <span className="text-xs text-gray-500 mb-0.5">{tl.label}</span>
            <Sparkline data={points} color={tl.color} refLow={tl.refLow} refHigh={tl.refHigh} />
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span className="text-sm font-bold text-gray-800">{latest}</span>
              <span className={`text-xs font-bold ${arrowColor}`}>{arrow}</span>
            </div>
            {tl.unit && <span className="text-xs text-gray-400">{tl.unit}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// LabTab
// ============================================================
export default function LabTab({ patient, onUpdate, settings }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showScan, setShowScan] = useState(false)

  const sortedLabs = [...(patient.labs || [])].sort((a, b) => {
    const da = parseLabDate(a.date) || new Date(0)
    const db = parseLabDate(b.date) || new Date(0)
    return db - da
  })

  const openAdd = () => {
    setEditingId(null)
    setShowForm(true)
  }
  const openEdit = (id) => {
    setEditingId(id)
    setShowForm(true)
  }

  const saveEntry = (entry) => {
    let labs
    if (editingId) {
      labs = patient.labs.map((l) => (l.id === editingId ? { ...entry, id: editingId } : l))
    } else {
      labs = [...(patient.labs || []), { ...entry, id: generateId() }]
    }
    onUpdate({ ...patient, labs })
    setShowForm(false)
  }

  const deleteEntry = (id) => {
    if (!window.confirm('ลบ lab entry นี้?')) return
    onUpdate({ ...patient, labs: patient.labs.filter((l) => l.id !== id) })
  }

  if (showScan) {
    return (
      <LabScan
        settings={settings}
        onConfirm={(entry) => {
          saveEntry(entry)
          setShowScan(false)
        }}
        onCancel={() => setShowScan(false)}
      />
    )
  }

  if (showForm) {
    const existing = editingId ? patient.labs.find((l) => l.id === editingId) : null
    return <LabForm initial={existing} onSave={saveEntry} onCancel={() => setShowForm(false)} />
  }

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        <button
          onClick={openAdd}
          className="flex-1 bg-blue-600 text-white py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2"
        >
          <span className="text-lg leading-none">+</span> บันทึก Lab
        </button>
        <button
          onClick={() => setShowScan(true)}
          className="bg-purple-600 text-white px-4 py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-1"
        >
          <span className="text-base leading-none">📷</span> สแกน Lab
        </button>
      </div>

      <TrendSection labs={patient.labs} />

      {sortedLabs.length === 0 && (
        <div className="text-center text-gray-400 py-12 text-sm">ยังไม่มี lab — กด + บันทึก Lab ใหม่</div>
      )}

      {sortedLabs.map((entry) => (
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
  const filledKeys = Object.keys(v).filter(
    (k) => v[k] !== '' && v[k] !== undefined && v[k] !== null
  )

  const allFields = LAB_GROUPS.flatMap((g) => g.fields)
  const getLabel = (key) => allFields.find((f) => f.key === key)?.label || key
  const getUnit = (key) => allFields.find((f) => f.key === key)?.unit || ''

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="font-semibold text-sm text-gray-800">{entry.date || '—'}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {filledKeys.length} รายการ
            {outdated && (
              <span className="ml-2 text-orange-500 font-medium">⚠️ lab เก่า &gt;3 เดือน</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={onEdit} className="text-xs text-blue-500 px-2 py-1">
            แก้ไข
          </button>
          <button onClick={onDelete} className="text-xs text-red-400  px-2 py-1">
            ลบ
          </button>
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 text-lg px-1">
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Quick summary row */}
      <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1">
        {['Hb', 'K', 'Ca', 'PO4', 'iPTH', 'Albumin', 'KtV', 'eGFR', 'HbA1C'].map((key) => {
          const val = v[key]
          if (val === undefined || val === '') return null
          return (
            <span key={key} className="text-xs text-gray-600">
              <span className="font-medium">{getLabel(key)}</span> {val}
              {getUnit(key) ? ' ' + getUnit(key) : ''}
            </span>
          )
        })}
      </div>

      {/* Expanded full view */}
      {expanded && (
        <div className="border-t border-gray-50 px-4 py-3 space-y-4">
          {LAB_GROUPS.map((group) => {
            const filled = group.fields.filter((f) => v[f.key] !== undefined && v[f.key] !== '')
            if (filled.length === 0) return null
            return (
              <div key={group.id}>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">{group.label}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {filled.map((f) => (
                    <div key={f.key} className="flex justify-between text-xs">
                      <span className="text-gray-500">{f.label}</span>
                      <span className="font-medium text-gray-800">
                        {v[f.key]}
                        {f.unit ? ' ' + f.unit : ''}
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
  const [note, setNote] = useState(initial?.note || '')

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
    anemia: true,
    electrolytes: true,
    mbd: true,
  })

  const setVal = (key, raw) => setRawVals((prev) => ({ ...prev, [key]: raw }))
  const toggleGroup = (id) => setOpenGroups((g) => ({ ...g, [id]: !g[id] }))
  const hasValue = (key) => rawVals[key] !== undefined && rawVals[key] !== ''

  const handleSave = () => {
    // Convert raw strings to numbers (or keep string for select fields)
    const numericVals = {}
    Object.entries(rawVals).forEach(([k, raw]) => {
      if (raw === '' || raw === undefined) return
      const n = Number.parseFloat(raw)
      numericVals[k] = Number.isNaN(n) ? raw : n // keep string for Pos/Neg
    })
    onSave({ date, values: numericVals, note })
  }

  const inp =
    'w-full border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-center bg-white'

  return (
    <div className="p-4 space-y-4">
      {/* Date */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <label className="block text-xs text-gray-500 mb-1">วันที่เจาะ Lab</label>
        <input
          type="month"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* Lab groups */}
      {LAB_GROUPS.map((group) => (
        <div
          key={group.id}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <button
            type="button"
            onClick={() => toggleGroup(group.id)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
          >
            <span className="text-sm font-medium text-gray-700">{group.label}</span>
            <div className="flex items-center gap-2">
              {group.fields.some((f) => hasValue(f.key)) && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {group.fields.filter((f) => hasValue(f.key)).length} filled
                </span>
              )}
              <span className="text-gray-400">{openGroups[group.id] ? '▲' : '▼'}</span>
            </div>
          </button>

          {openGroups[group.id] && (
            <div className="border-t border-gray-50 px-4 py-3 grid grid-cols-2 gap-3">
              {group.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs text-gray-500 mb-1">
                    {field.label}
                    {field.unit && <span className="text-gray-400"> ({field.unit})</span>}
                  </label>
                  {field.options ? (
                    // Select field (Pos/Neg)
                    <select
                      value={rawVals[field.key] || ''}
                      onChange={(e) => setVal(field.key, e.target.value || undefined)}
                      className="w-full border border-gray-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      {field.options.map((o) => (
                        <option key={o} value={o}>
                          {o || '—'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    // Numeric text input — inputMode="decimal" shows number keyboard on mobile
                    <input
                      type="text"
                      inputMode="decimal"
                      value={rawVals[field.key] ?? ''}
                      onChange={(e) => setVal(field.key, e.target.value)}
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
          onChange={(e) => setNote(e.target.value)}
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

// ============================================================
// Lab Scan — photo → AI reads lab values → confirm
// ============================================================
const LAB_KEYS =
  'Hb, Hct, Ferritin, TSAT, Iron, TIBC, KtV, URR, BUN_pre, BUN_post, BUN, Cr, eGFR, Na, K, Cl, HCO3, Ca, PO4, iPTH, VitD25, ALP, Albumin, FBS, HbA1C, UACR, LDL, TG, AST, ALT, UricAcid, PT_INR'

function LabScan({ settings, onConfirm, onCancel }) {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [scannedValues, setScannedValues] = useState(null)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
    const reader = new FileReader()
    reader.onload = () => {
      const mediaType = file.type?.startsWith('image/') ? file.type : 'image/jpeg'
      setImage({ data: reader.result.split(',')[1], type: mediaType })
    }
    reader.onerror = () => setError('ไม่สามารถอ่านไฟล์ได้')
    reader.readAsDataURL(file)
    setScannedValues(null)
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
          model: DR_AI_MODEL,
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: image.type, data: image.data },
                },
                {
                  type: 'text',
                  text: `อ่านค่า Lab จากรูปนี้ (ใบ Lab/หน้าจอ EMR/ผลเลือด)
ตอบเป็น JSON object เท่านั้น:
{${LAB_KEYS.split(', ')
                    .map((k) => `"${k}":number|null`)
                    .join(',')}}
ใส่เฉพาะค่าที่เห็น ค่าที่ไม่เห็นใส่ null
ถ้าเห็นวันที่ lab ใส่ "date":"YYYY-MM-DD"`,
                },
              ],
            },
          ],
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || `API error ${res.status}`)
      }
      const data = await res.json()
      const text = data.content?.[0]?.text || ''
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        if (parsed.date) {
          setDate(parsed.date)
        }
        const { date: _, ...labValues } = parsed
        const filtered = {}
        for (const [k, v] of Object.entries(labValues)) {
          if (v !== null && v !== undefined && v !== '') filtered[k] = v
        }
        setScannedValues(filtered)
      } else {
        setError('AI ไม่สามารถอ่านค่า Lab ได้ — ลองถ่ายใหม่')
      }
    } catch (e) {
      setError(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const updateValue = (key, val) =>
    setScannedValues((prev) => ({ ...prev, [key]: val === '' ? undefined : Number(val) || val }))

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <h3 className="font-semibold text-sm text-gray-700">สแกน Lab จากรูป</h3>
        {!settings?.apiKey && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-xs text-orange-700">
            ใส่ API Key ใน Settings ก่อนใช้สแกน
          </div>
        )}
        <input
          id="lab-scan-input"
          type="file"
          accept="image/*"
          capture
          onChange={handleFile}
          className="sr-only"
        />
        {!preview ? (
          <label
            htmlFor={settings?.apiKey ? 'lab-scan-input' : undefined}
            className={`w-full border-2 border-dashed border-gray-300 rounded-2xl py-12 text-center text-gray-400 text-sm block ${!settings?.apiKey ? 'opacity-50' : 'cursor-pointer active:bg-gray-50'}`}
          >
            <div className="text-3xl mb-2">📷</div>กดเพื่อถ่ายรูป / เลือกรูปผล Lab
          </label>
        ) : (
          <div className="space-y-3">
            <img
              src={preview}
              alt="Lab"
              className="w-full rounded-xl max-h-60 object-contain bg-gray-100"
            />
            <div className="flex gap-2">
              <label
                htmlFor="lab-scan-input"
                onClick={() => setScannedValues(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl text-xs text-center cursor-pointer"
              >
                เปลี่ยนรูป
              </label>
              {!scannedValues && (
                <button
                  onClick={scan}
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-xl text-xs font-medium disabled:opacity-50"
                >
                  {loading ? 'กำลังอ่าน...' : 'AI อ่านค่า Lab'}
                </button>
              )}
            </div>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        {scannedValues && (
          <div className="space-y-3">
            <div className="text-xs text-gray-500 font-medium">
              AI อ่านได้ {Object.keys(scannedValues).length} ค่า — แก้ไขได้:
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">วันที่ Lab</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(scannedValues).map(([key, val]) => (
                <div
                  key={key}
                  className="bg-purple-50 border border-purple-200 rounded-xl px-3 py-2"
                >
                  <label className="block text-[10px] text-purple-600 font-medium">{key}</label>
                  <input
                    type="text"
                    value={val ?? ''}
                    onChange={(e) => updateValue(key, e.target.value)}
                    className="w-full text-sm font-medium bg-transparent border-none p-0 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2 pb-8">
        {scannedValues && (
          <button
            onClick={() => {
              const values = {}
              for (const [k, v] of Object.entries(scannedValues)) {
                if (v !== undefined && v !== null && v !== '') values[k] = v
              }
              onConfirm({ date, values })
            }}
            className="flex-1 py-3 rounded-2xl text-sm font-medium bg-purple-600 text-white"
          >
            บันทึก Lab
          </button>
        )}
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
