import { useState } from 'react'
import ChatTab from './ChatTab'
import InfoTab from './InfoTab'
import LabTab from './LabTab'
import MedTab from './MedTab'
import RecommendationTab from './RecommendationTab'

const TABS = [
  { id: 'rec', label: '📋 Rec', title: 'Recommendation' },
  { id: 'info', label: '👤 ข้อมูล', title: 'ข้อมูลคนไข้' },
  { id: 'lab', label: '🧪 Lab', title: 'Lab' },
  { id: 'med', label: '💊 ยา', title: 'ยา' },
  { id: 'chat', label: '💬 AI', title: 'AI Chat' },
]

export default function PatientDetail({ patient, onUpdate, onDelete, onBack, settings }) {
  const [tab, setTab] = useState('rec')
  const [showMenu, setShowMenu] = useState(false)

  const _activeTab = TABS.find((t) => t.id === tab)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header
        className="bg-blue-700 text-white px-4 pb-0 sticky top-0 z-20 shadow-md"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <div className="max-w-lg mx-auto">
          {/* Top row */}
          <div className="flex items-center gap-3 pb-2">
            <button onClick={onBack} className="text-2xl leading-none shrink-0">
              ←
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-base leading-tight truncate">
                {patient.name || '(ไม่มีชื่อ)'}
              </div>
              {patient.hn && <div className="text-xs text-blue-200">HN: {patient.hn}</div>}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 flex items-center justify-center text-white text-xl rounded-lg"
              >
                ⋮
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-9 bg-white text-gray-800 rounded-xl shadow-lg border border-gray-100 z-20 min-w-36 overflow-hidden">
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        setTab('info')
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                    >
                      ✏️ แก้ไขข้อมูล
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        onDelete()
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                    >
                      🗑️ ลบคนไข้
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-0 -mx-4 px-2 overflow-x-auto scrollbar-hide">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-300 hover:text-blue-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full">
        {tab === 'info' && <InfoTab patient={patient} onUpdate={onUpdate} />}
        {tab === 'lab' && <LabTab patient={patient} onUpdate={onUpdate} />}
        {tab === 'med' && <MedTab patient={patient} onUpdate={onUpdate} settings={settings} />}
        {tab === 'rec' && <RecommendationTab patient={patient} />}
        {tab === 'chat' && <ChatTab patient={patient} settings={settings} />}
      </main>

      {/* Disclaimer footer */}
      <div className="max-w-lg mx-auto w-full px-4 py-3 border-t border-gray-100 bg-gray-50">
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          ⚕️ <span className="font-medium text-gray-500">Clinical Decision Support เท่านั้น</span> —
          ข้อมูลนี้ไม่ใช่คำสั่งการรักษา แพทย์ต้องใช้วิจารณญาณทางคลินิกและยืนยันก่อนสั่งยาหรือปรับการรักษาทุกครั้ง
        </p>
      </div>
    </div>
  )
}
