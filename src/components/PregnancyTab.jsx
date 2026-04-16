import { useState } from 'react'
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

export default function PregnancyTab({ onBack }) {
  const [context, setContext] = useState('pregnant-1') // pregnant-1/2/3 | breastfeeding
  const [mode, setMode] = useState('symptom') // 'symptom' | 'search'
  const [selectedSymptom, setSelectedSymptom] = useState(null)
  const [query, setQuery] = useState('')

  const isBF = context === 'breastfeeding'
  const contextLabel = isBF
    ? 'ให้นมบุตร'
    : `ตั้งครรภ์ ไตรมาส ${context.split('-')[1]}`

  const results = mode === 'symptom' && selectedSymptom
    ? searchBySymptom(selectedSymptom, isBF ? 'breastfeeding' : 'pregnant')
    : mode === 'search' && query.trim().length >= 1
      ? searchDrugPregnancy(query)
      : []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
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

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 space-y-4">
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
            placeholder="พิมพ์ชื่อยา เช่น amlo, para, metro..."
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
