import { useState } from 'react'
import { getRecommendations } from '../recommendations'
import { getLatestLabEntry, isLabOutdated } from '../storage'

const SEV_STYLE = {
  critical: {
    card: 'bg-red-600 border-red-600 text-white',
    badge: 'bg-red-700 text-red-100',
    icon: '🚨',
  },
  red: {
    card: 'bg-red-50 border-l-4 border-red-500',
    badge: 'bg-red-100 text-red-700',
    icon: '🔴',
  },
  yellow: {
    card: 'bg-yellow-50 border-l-4 border-yellow-500',
    badge: 'bg-yellow-100 text-yellow-700',
    icon: '🟡',
  },
  green: {
    card: 'bg-green-50 border-l-4 border-green-500',
    badge: 'bg-green-100 text-green-700',
    icon: '🟢',
  },
}

const DOMAIN_ORDER = [
  'CKD Progression', 'Drug Interaction', 'Drug Adjustment',
  'Anemia', 'CKD-MBD', 'Dialysis Adequacy', 'Electrolytes', 'Nutrition', 'Infection',
]

// ---- local helper for protocol panels ----
function localFind(meds, keywords) {
  return meds.find(m => keywords.some(k => m.name.toLowerCase().includes(k.toLowerCase())))
}

export default function RecommendationTab({ patient }) {
  const [activeProtocol, setActiveProtocol] = useState(null)
  const latestLab = getLatestLabEntry(patient)
  const outdated = latestLab ? isLabOutdated(latestLab.date) : false
  const recs = latestLab ? getRecommendations(patient) : []

  const criticals = recs.filter(r => r.severity === 'critical')
  const others = recs.filter(r => r.severity !== 'critical')

  const sorted = [...others].sort((a, b) => {
    const ai = DOMAIN_ORDER.indexOf(a.domain)
    const bi = DOMAIN_ORDER.indexOf(b.domain)
    const severityOrder = { red: 0, yellow: 1, green: 2 }
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    return (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9)
  })

  const toggleProtocol = (key) => setActiveProtocol(p => p === key ? null : key)

  return (
    <div className="p-4 space-y-3">
      {/* Protocol buttons — always visible */}
      <div className="flex gap-2">
        {[
          { key: 'sick', icon: '🤒', label: 'Sick Day', color: 'orange' },
          { key: 'contrast', icon: '💉', label: 'Contrast', color: 'purple' },
          { key: 'preop', icon: '🔪', label: 'Pre-op', color: 'blue' },
        ].map(({ key, icon, label, color }) => (
          <button
            key={key}
            onClick={() => toggleProtocol(key)}
            className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl text-xs font-semibold border transition-colors ${
              activeProtocol === key
                ? color === 'orange' ? 'bg-orange-500 text-white border-orange-500'
                : color === 'purple' ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 active:bg-gray-50'
            }`}
          >
            <span className="text-lg leading-none mb-0.5">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Protocol panel */}
      {activeProtocol === 'sick' && (
        <ProtocolCard title="🤒 Sick Day Protocol" onClose={() => setActiveProtocol(null)}>
          <SickDayContent patient={patient} latestLab={latestLab} />
        </ProtocolCard>
      )}
      {activeProtocol === 'contrast' && (
        <ProtocolCard title="💉 เตรียมฉีด Contrast" onClose={() => setActiveProtocol(null)}>
          <ContrastContent patient={patient} latestLab={latestLab} />
        </ProtocolCard>
      )}
      {activeProtocol === 'preop' && (
        <ProtocolCard title="🔪 เตรียมผ่าตัด" onClose={() => setActiveProtocol(null)}>
          <PreopContent patient={patient} latestLab={latestLab} />
        </ProtocolCard>
      )}

      {!latestLab ? (
        <div className="text-center text-gray-400 py-10">
          <div className="text-4xl mb-3">🧪</div>
          <p className="text-sm font-medium">ยังไม่มี Lab</p>
          <p className="text-xs mt-1">กรอก Lab เพื่อดู recommendation</p>
        </div>
      ) : (
        <>
          {/* Lab date + outdated warning */}
          <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl ${
            outdated ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-gray-100 text-gray-600'
          }`}>
            <span>Lab: {latestLab.date || '—'}</span>
            {outdated && <span className="font-medium">⚠️ เก่า >3 เดือน — ควรเจาะใหม่</span>}
          </div>

          {/* Critical alerts */}
          {criticals.map(rec => <RecCard key={rec.id} rec={rec} />)}

          {/* Domain sections */}
          {DOMAIN_ORDER.map(domain => {
            const domainRecs = sorted.filter(r => r.domain === domain)
            if (domainRecs.length === 0) return null
            return (
              <div key={domain}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 mt-2">{domain}</p>
                <div className="space-y-2">
                  {domainRecs.map(rec => <RecCard key={rec.id} rec={rec} />)}
                </div>
              </div>
            )
          })}

          {/* Other domains */}
          {sorted.filter(r => !DOMAIN_ORDER.includes(r.domain)).map(rec => (
            <RecCard key={rec.id} rec={rec} />
          ))}

          {recs.length === 0 && (
            <div className="text-center text-gray-400 py-8 text-sm">
              ไม่มี lab value ที่ครบพอสำหรับ recommendation
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ---- Protocol wrapper card ----
function ProtocolCard({ title, onClose, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-bold text-sm text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 text-lg leading-none px-1">✕</button>
      </div>
      <div className="px-4 py-3 space-y-3">{children}</div>
    </div>
  )
}

// ---- Sick Day ----
function SickDayContent({ patient, latestLab }) {
  const meds = patient.medications || []

  const STOP_RULES = [
    { keys: ['dapagliflozin','empagliflozin','canagliflozin','forxiga','jardiance','invokana'], reason: 'Euglycemic DKA risk', level: 'stop' },
    { keys: ['metformin','glucophage'], reason: 'Lactic acidosis risk เมื่อ dehydrated', level: 'stop' },
    { keys: ['losartan','valsartan','irbesartan','telmisartan','olmesartan','candesartan','enalapril','ramipril','lisinopril','perindopril'], reason: 'AKI risk เมื่อ volume depleted', level: 'hold' },
    { keys: ['furosemide','lasix'], reason: 'Dehydration + AKI risk', level: 'hold' },
    { keys: ['hctz','hydrochlorothiazide'], reason: 'Dehydration + AKI risk', level: 'hold' },
    { keys: ['finerenone','kerendia'], reason: 'Hyperkalemia + AKI risk', level: 'hold' },
    { keys: ['spironolactone','aldactone'], reason: 'Hyperkalemia + AKI risk', level: 'hold' },
  ]
  const MONITOR_RULES = [
    { keys: ['insulin','glargine','lantus','detemir','degludec','aspart','lispro','nph'], note: 'คง dose แต่ monitor DTX ถี่ขึ้น — ลด 20–50% ถ้ากินไม่ได้' },
    { keys: ['warfarin','coumadin'], note: 'กินต่อ แต่ monitor INR — อาจผันผวนถ้าไข้/ไม่กินอาหาร' },
    { keys: ['digoxin','lanoxin'], note: 'กินต่อ แต่ระวัง toxicity ถ้า K ต่ำหรือ dehydrated' },
  ]
  const CONTINUE_RULES = [
    { keys: ['atenolol','bisoprolol','metoprolol','carvedilol','propranolol'] },
    { keys: ['amlodipine','nifedipine','diltiazem','verapamil','manidipine'] },
    { keys: ['atorvastatin','rosuvastatin','simvastatin','pravastatin'] },
  ]

  const stopList = STOP_RULES.map(r => { const m = localFind(meds, r.keys); return m ? { name: m.name, reason: r.reason, level: r.level } : null }).filter(Boolean)
  const monitorList = MONITOR_RULES.map(r => { const m = localFind(meds, r.keys); return m ? { name: m.name, note: r.note } : null }).filter(Boolean)
  const continueList = CONTINUE_RULES.map(r => localFind(meds, r.keys)).filter(Boolean)

  if (stopList.length === 0 && monitorList.length === 0 && continueList.length === 0) {
    return <p className="text-sm text-gray-500 py-1">ยังไม่มีข้อมูลยา — กรอกยาใน tab ยา เพื่อดู Sick Day protocol</p>
  }

  return (
    <>
      <p className="text-xs text-gray-500">เมื่อคนไข้ป่วย/อาเจียน/ท้องเสีย/ไม่สามารถกินอาหารได้</p>

      {stopList.length > 0 && (
        <div>
          <p className="text-xs font-bold text-red-700 mb-1.5">🛑 หยุดชั่วคราว</p>
          <div className="space-y-1">
            {stopList.map((item, i) => (
              <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-xl text-sm border ${
                item.level === 'stop' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
              }`}>
                <span className="shrink-0 mt-0.5">{item.level === 'stop' ? '❌' : '⏸️'}</span>
                <div>
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <span className="text-gray-500 text-xs ml-1">— {item.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {monitorList.length > 0 && (
        <div>
          <p className="text-xs font-bold text-yellow-700 mb-1.5">⚠️ คงไว้ แต่ระวัง</p>
          <div className="space-y-1">
            {monitorList.map((item, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl text-sm bg-yellow-50 border border-yellow-200">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <div>
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <p className="text-xs text-gray-600 mt-0.5">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {continueList.length > 0 && (
        <div>
          <p className="text-xs font-bold text-green-700 mb-1.5">✅ กินต่อตามปกติ</p>
          <div className="flex flex-wrap gap-1.5">
            {continueList.map((m, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-green-50 border border-green-200 text-green-800">{m.name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600">
        <span className="font-medium">Restart ยาที่หยุด:</span> เมื่อคนไข้ดีขึ้น + กินอาหารได้ปกติ + eGFR stable
      </div>
    </>
  )
}

// ---- Contrast ----
function ContrastContent({ patient, latestLab }) {
  const meds = patient.medications || []
  const egfr = latestLab?.values?.eGFR ? parseFloat(latestLab.values.eGFR) : null
  const isHD = patient.status === 'HD'
  const metformin = localFind(meds, ['metformin','glucophage'])
  const nsaid = localFind(meds, ['ibuprofen','diclofenac','naproxen','voltaren','celecoxib','mefenamic','arcoxia'])

  let risk, riskBg, hydration
  if (isHD) {
    risk = 'HD Patient'
    riskBg = 'bg-blue-50 border-blue-200 text-blue-800'
    hydration = null
  } else if (!egfr) {
    risk = 'ไม่ทราบ eGFR — ทำ hydration ก่อนฉีดเสมอ'
    riskBg = 'bg-gray-50 border-gray-200 text-gray-700'
    hydration = 'NSS 1 mL/kg/hr × 6–12 ชม. ก่อน + หลัง (default)'
  } else if (egfr >= 60) {
    risk = `eGFR ${egfr} — Low risk`
    riskBg = 'bg-green-50 border-green-200 text-green-800'
    hydration = 'ไม่จำเป็นต้อง pre-hydration เป็นพิเศษ'
  } else if (egfr >= 30) {
    risk = `eGFR ${egfr} — Moderate risk`
    riskBg = 'bg-yellow-50 border-yellow-200 text-yellow-800'
    hydration = 'NSS 1 mL/kg/hr × 6–12 ชม. ก่อน + หลังฉีด contrast'
  } else {
    risk = `eGFR ${egfr} — High risk`
    riskBg = 'bg-red-50 border-red-200 text-red-800'
    hydration = 'NSS hydration ก่อน + หลัง + ใช้ low-osmolar contrast + minimal volume\nพิจารณา alternative imaging ถ้าเป็นไปได้'
  }

  return (
    <>
      <div className={`px-3 py-2.5 rounded-xl text-sm font-medium border ${riskBg}`}>{risk}</div>

      {hydration && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-sm text-blue-800">
          <span className="font-medium">💧 Hydration: </span><span className="whitespace-pre-line">{hydration}</span>
        </div>
      )}

      {!isHD && (
        <div>
          <p className="text-xs font-bold text-gray-600 mb-1.5">ยาที่ต้องหยุด</p>
          <div className="space-y-1">
            {metformin ? (
              <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-sm bg-red-50 border border-red-200">
                <span>❌</span>
                <div>
                  <span className="font-medium">{metformin.name}</span>
                  <p className="text-xs text-gray-600 mt-0.5">หยุด 48 ชม. ก่อนฉีด (หรือวันฉีด) + ไม่เริ่มจนกว่า Cr stable หลัง 48 ชม.</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 px-1">Metformin: ไม่ได้กิน ✓</p>
            )}
            {nsaid && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-sm bg-orange-50 border border-orange-200">
                <span>⏸️</span>
                <div>
                  <span className="font-medium">{nsaid.name}</span>
                  <p className="text-xs text-gray-600 mt-0.5">หยุด NSAIDs ก่อนฉีดสี</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-bold text-gray-600 mb-1">Lab monitoring</p>
        <div className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 space-y-0.5">
          <p>• <span className="font-medium">ก่อนฉีด:</span> Cr, eGFR</p>
          <p>• <span className="font-medium">48–72 ชม. หลังฉีด:</span> Cr, eGFR (ดู AKI)</p>
          <p>• <span className="font-medium">1–2 สัปดาห์:</span> Cr, eGFR (ดู recovery)</p>
        </div>
      </div>

      {isHD && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-800">
          <span className="font-medium">HD:</span> ทำ HD session ถัดไปหลังฉีด contrast เพื่อ clear ออก (ไม่ต้องกังวลเรื่อง Metformin)
        </div>
      )}
    </>
  )
}

// ---- Pre-op ----
function PreopContent({ patient, latestLab }) {
  const [type, setType] = useState('major')
  const meds = patient.medications || []
  const isHD = patient.status === 'HD'
  const egfr = latestLab?.values?.eGFR ? parseFloat(latestLab.values.eGFR) : null

  const PREOP_RULES = [
    { keys: ['aspirin','asa'], label: 'ASA', minor: 'กินต่อ ✓', major: 'กินต่อ ✓ (หยุดเฉพาะ neurosurgery)', mc: 'green', Mc: 'green' },
    { keys: ['clopidogrel','plavix'], label: null, minor: 'ไม่หยุด หรือหยุด 3 วัน', major: 'หยุด 5–7 วัน', mc: 'yellow', Mc: 'red' },
    { keys: ['ticagrelor','brilinta'], label: null, minor: 'หยุด 3 วัน', major: 'หยุด 5 วัน', mc: 'yellow', Mc: 'red' },
    { keys: ['prasugrel','efient'], label: null, minor: 'หยุด 5 วัน', major: 'หยุด 7 วัน', mc: 'red', Mc: 'red' },
    { keys: ['warfarin','coumadin'], label: null, minor: 'ไม่หยุด (ถอนฟัน/ต้อกระจก)', major: 'หยุด 5 วัน + เช็ค INR', mc: 'green', Mc: 'red' },
    { keys: ['rivaroxaban','xarelto'], label: null, minor: 'ข้าม 1 dose', major: 'หยุด 2–3 วัน', mc: 'yellow', Mc: 'orange' },
    { keys: ['apixaban','eliquis'], label: null, minor: 'ข้าม 1 dose', major: 'หยุด 2–3 วัน', mc: 'yellow', Mc: 'orange' },
    { keys: ['dabigatran','pradaxa'], label: null,
      minor: 'หยุด 1–2 วัน',
      major: egfr && egfr < 30 ? 'หยุด 3–5 วัน (eGFR ต่ำ ขับช้า)' : 'หยุด 2–4 วัน',
      mc: 'yellow', Mc: 'orange' },
    { keys: ['dapagliflozin','empagliflozin','canagliflozin','forxiga','jardiance','invokana'], label: null, minor: 'หยุด 1 วัน', major: 'หยุด 3 วันก่อน', mc: 'yellow', Mc: 'red' },
    { keys: ['metformin','glucophage'], label: null, minor: 'หยุดเช้าวันผ่าตัด', major: 'หยุดเช้าวันผ่าตัด', mc: 'yellow', Mc: 'yellow' },
    { keys: ['losartan','valsartan','irbesartan','telmisartan','olmesartan','candesartan','enalapril','ramipril','lisinopril','perindopril'], label: null, minor: 'หยุดเช้าวันผ่าตัด', major: 'หยุดเช้าวันผ่าตัด (hypotension risk)', mc: 'yellow', Mc: 'yellow' },
    { keys: ['insulin','glargine','lantus','detemir','degludec','aspart','lispro','nph'], label: null, minor: 'คง dose ปกติ', major: 'ลด basal 50–80% คืนก่อน', mc: 'green', Mc: 'orange' },
    { keys: ['atorvastatin','rosuvastatin','simvastatin','pravastatin'], label: null, minor: 'กินต่อ ✓', major: 'กินต่อ ✓', mc: 'green', Mc: 'green' },
    { keys: ['atenolol','bisoprolol','metoprolol','carvedilol','propranolol'], label: null, minor: 'กินต่อ ✓', major: 'กินต่อ ✓', mc: 'green', Mc: 'green' },
    { keys: ['amlodipine','nifedipine','diltiazem','verapamil','manidipine'], label: null, minor: 'กินต่อ ✓', major: 'กินต่อ ✓', mc: 'green', Mc: 'green' },
  ]

  const colorCls = (c) => ({
    red: 'bg-red-50 border-red-200 text-red-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    green: 'bg-green-50 border-green-200 text-green-800',
  }[c] || 'bg-gray-50 border-gray-200 text-gray-700')

  const rows = PREOP_RULES
    .map(r => { const m = localFind(meds, r.keys); return m ? { name: r.label || m.name, instr: type === 'minor' ? r.minor : r.major, color: type === 'minor' ? r.mc : r.Mc } : null })
    .filter(Boolean)

  const hasWarfarin = localFind(meds, ['warfarin','coumadin'])

  return (
    <>
      <div className="flex gap-2">
        {[['minor', 'Minor / Low risk'], ['major', 'Major / High risk']].map(([k, label]) => (
          <button key={k} onClick={() => setType(k)} className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
            type === k
              ? k === 'minor' ? 'bg-blue-600 text-white border-blue-600' : 'bg-orange-600 text-white border-orange-600'
              : 'bg-white text-gray-600 border-gray-300'
          }`}>{label}</button>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        {type === 'minor' ? 'เช่น ถอนฟัน, ต้อกระจก, biopsy ผิวหนัง, small procedure' : 'เช่น TKR, THR, CABG, open abdominal, neurosurgery, major vascular'}
      </p>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500 py-1">ยังไม่มีข้อมูลยา — กรอกยาใน tab ยา</p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((row, i) => (
            <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm border ${colorCls(row.color)}`}>
              <span className="font-medium shrink-0 mr-2">{row.name}</span>
              <span className="text-right text-xs">{row.instr}</span>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs font-bold text-gray-600 mb-1">Lab ก่อนผ่าตัด</p>
        <div className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 space-y-0.5">
          {type === 'minor' ? (
            <>
              <p>• CBC</p>
              {hasWarfarin && <p>• INR (กิน warfarin อยู่)</p>}
            </>
          ) : (
            <>
              <p>• CBC, BUN, Cr, K, PT/INR, PTT</p>
              <p>• CXR, EKG</p>
              {isHD && <p>• ทำ HD ก่อนผ่าตัด 1 วัน — ใช้ heparin-free/minimal heparin</p>}
            </>
          )}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 space-y-0.5">
        <p className="font-semibold">เริ่มยาใหม่หลังผ่าตัด (ถ้าไม่มี bleeding)</p>
        <p>• Anticoagulant/antiplatelet: 24–48 ชม. หลังผ่าตัด</p>
        <p>• Metformin: เมื่อกินอาหารได้ + eGFR stable</p>
        <p>• SGLT2i: เมื่อกินอาหารได้ปกติ</p>
        <p>• ACEi/ARB: วันรุ่งขึ้นถ้า BP stable</p>
      </div>
    </>
  )
}

// ---- Recommendation Card ----
function RecCard({ rec }) {
  const s = SEV_STYLE[rec.severity] || SEV_STYLE.green
  const isCritical = rec.severity === 'critical'

  return (
    <div className={`rounded-2xl border overflow-hidden ${s.card}`}>
      <div className="px-4 py-3">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-base leading-none shrink-0 mt-0.5">{s.icon}</span>
          <div className="flex-1">
            <span className={`font-bold text-sm ${isCritical ? 'text-white' : 'text-gray-900'}`}>
              {rec.title}
            </span>
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${s.badge}`}>
              {rec.domain}
            </span>
          </div>
        </div>

        <div className={`text-sm leading-relaxed whitespace-pre-line mb-2 ${isCritical ? 'text-red-50' : 'text-gray-700'}`}>
          {rec.recommendation}
        </div>

        <div className={`text-xs space-y-0.5 mt-2 pt-2 border-t ${isCritical ? 'border-red-500 text-red-200' : 'border-gray-100 text-gray-500'}`}>
          <div>
            <span className="font-medium">เป้าหมาย:</span> {rec.target}
          </div>
          {rec.warning && rec.warning !== '—' && (
            <div>
              <span className="font-medium">⚠️ ข้อระวัง:</span> {rec.warning}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
