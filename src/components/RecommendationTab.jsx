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

const DOMAIN_ORDER = ['Anemia', 'CKD-MBD', 'Dialysis Adequacy', 'Electrolytes', 'Nutrition', 'Infection']

export default function RecommendationTab({ patient }) {
  const latestLab = getLatestLabEntry(patient)
  const outdated = latestLab ? isLabOutdated(latestLab.date) : false
  const recs = getRecommendations(patient)

  if (!latestLab) {
    return (
      <div className="p-6 text-center text-gray-400 py-16">
        <div className="text-4xl mb-3">🧪</div>
        <p className="text-sm font-medium">ยังไม่มี Lab</p>
        <p className="text-xs mt-1">กรอก Lab เพื่อดู recommendation</p>
      </div>
    )
  }

  const criticals = recs.filter(r => r.severity === 'critical')
  const others = recs.filter(r => r.severity !== 'critical')

  // Sort others by domain order
  const sorted = [...others].sort((a, b) => {
    const ai = DOMAIN_ORDER.indexOf(a.domain)
    const bi = DOMAIN_ORDER.indexOf(b.domain)
    const severityOrder = { red: 0, yellow: 1, green: 2 }
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    return (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9)
  })

  return (
    <div className="p-4 space-y-3">
      {/* Lab date + outdated warning */}
      <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl ${
        outdated ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-gray-100 text-gray-600'
      }`}>
        <span>Lab: {latestLab.date || '—'}</span>
        {outdated && <span className="font-medium">⚠️ เก่า >3 เดือน — ควรเจาะใหม่</span>}
      </div>

      {/* Critical alerts */}
      {criticals.map(rec => (
        <RecCard key={rec.id} rec={rec} />
      ))}

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
    </div>
  )
}

function RecCard({ rec }) {
  const s = SEV_STYLE[rec.severity] || SEV_STYLE.green
  const isCritical = rec.severity === 'critical'

  return (
    <div className={`rounded-2xl border overflow-hidden ${s.card}`}>
      <div className="px-4 py-3">
        {/* Title */}
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

        {/* Recommendation */}
        <div className={`text-sm leading-relaxed whitespace-pre-line mb-2 ${isCritical ? 'text-red-50' : 'text-gray-700'}`}>
          {rec.recommendation}
        </div>

        {/* Target + Warning */}
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
