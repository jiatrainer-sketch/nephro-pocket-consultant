import { useEffect, useRef, useState } from 'react'
import DrAIFloat from './components/DrAIFloat'
import PatientDetail from './components/PatientDetail'
import PregnancyTab from './components/PregnancyTab'
import QuickMode from './components/QuickMode'
import { hasAbnormal, hasCritical } from './recommendations'
import {
  createEmptyPatient,
  exportAllData,
  generateId,
  getCKDStage,
  getLatestLabEntry,
  getStorageInfo,
  importAllData,
  isLabOutdated,
  loadPatients,
  loadSettings,
  savePatients,
  saveSettings,
} from './storage'
import { useTheme } from './useTheme'

// ============================================================
// App Root
// ============================================================
export default function App() {
  const [view, setView] = useState('list') // 'list' | 'detail' | 'quick' | 'pregnancy' | 'settings'
  const [patients, setPatients] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [settings, setSettings] = useState({ apiKey: '' })
  const { toggle: toggleTheme, isDark } = useTheme()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newHN, setNewHN] = useState('')

  useEffect(() => {
    setPatients(loadPatients())
    setSettings(loadSettings())
  }, [])

  const persist = (list) => {
    setPatients(list)
    savePatients(list)
  }

  const addPatient = () => {
    if (!newName.trim() && !newHN.trim()) return
    const p = { ...createEmptyPatient(generateId()), name: newName.trim(), hn: newHN.trim() }
    const next = [...patients, p]
    persist(next)
    setNewName('')
    setNewHN('')
    setShowAdd(false)
    setSelectedId(p.id)
    setView('detail')
  }

  const updatePatient = (updated) => {
    persist(
      patients.map((p) =>
        p.id === updated.id ? { ...updated, updated_at: new Date().toISOString() } : p
      )
    )
  }

  const deletePatient = (id) => {
    if (!window.confirm('ลบคนไข้นี้ออกจากระบบ?')) return
    persist(patients.filter((p) => p.id !== id))
  }

  const selectedPatient = patients.find((p) => p.id === selectedId)

  // ---- filtered + sorted list ----
  const displayed = patients
    .filter((p) => {
      if (!search) return true
      const q = search.toLowerCase()
      return p.name?.toLowerCase().includes(q) || p.hn?.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '', 'th')
      if (sortBy === 'hn') return (a.hn || '').localeCompare(b.hn || '')
      // date: sort by updated_at desc
      return (b.updated_at || '').localeCompare(a.updated_at || '')
    })

  if (view === 'detail' && selectedPatient) {
    return (
      <>
        <PatientDetail
          patient={selectedPatient}
          onUpdate={updatePatient}
          onDelete={() => {
            deletePatient(selectedPatient.id)
            setView('list')
          }}
          onBack={() => setView('list')}
          settings={settings}
        />
        <DrAIFloat settings={settings} />
      </>
    )
  }

  if (view === 'quick') {
    return (
      <>
        <QuickMode onBack={() => setView('list')} settings={settings} />
        <DrAIFloat settings={settings} />
      </>
    )
  }

  if (view === 'pregnancy') {
    return <PregnancyTab onBack={() => setView('list')} settings={settings} />
  }

  if (view === 'settings') {
    return (
      <SettingsView
        settings={settings}
        onSave={(s) => {
          setSettings(s)
          saveSettings(s)
          setView('list')
        }}
        onBack={() => setView('list')}
        onDataRestored={() => setPatients(loadPatients())}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
    )
  }

  // ---- patient list ----
  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header
          className="bg-blue-700 text-white px-4 pt-safe-top pb-3 sticky top-0 z-20 shadow-md"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
        >
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div>
              <div className="text-lg font-bold leading-tight">Nephro Pocket</div>
              <div className="text-xs text-blue-200">HD Clinical Consultant · รพ.ดอนตูม</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setView('quick')}
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-800 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                Quick
              </button>
              <button
                type="button"
                onClick={() => setView('pregnancy')}
                className="bg-pink-500 hover:bg-pink-400 active:bg-pink-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                Preg
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-800 w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                aria-label={isDark ? 'โหมดกลางวัน' : 'โหมดกลางคืน'}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              <button
                type="button"
                onClick={() => setView('settings')}
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-800 w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                aria-label="ตั้งค่า"
              >
                ⚙️
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4">
          {/* Search */}
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="ค้นหาชื่อ / HN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Sort tabs */}
          <div className="flex gap-1.5 mb-4">
            {[
              ['name', '🔤 ชื่อ'],
              ['hn', '# HN'],
              ['date', '🕐 ล่าสุด'],
            ].map(([k, label]) => (
              <button
                type="button"
                key={k}
                onClick={() => setSortBy(k)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  sortBy === k
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-400 self-center">{patients.length} คน</span>
          </div>

          {/* Patient cards */}
          <div className="space-y-2 mb-4">
            {displayed.map((p) => (
              <PatientCard
                key={p.id}
                patient={p}
                onClick={() => {
                  setSelectedId(p.id)
                  setView('detail')
                }}
              />
            ))}
            {displayed.length === 0 && (
              <div className="text-center text-gray-400 py-16 text-sm">
                {search ? 'ไม่พบคนไข้ที่ค้นหา' : 'ยังไม่มีคนไข้\nกด + เพิ่มคนไข้ใหม่'}
              </div>
            )}
          </div>

          {/* Add patient */}
          {showAdd ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <p className="font-medium text-sm mb-3 text-gray-700">เพิ่มคนไข้ใหม่</p>
              <input
                type="text"
                placeholder="ชื่อ / ชื่อเล่น / initials"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPatient()}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <input
                type="text"
                placeholder="HN (ไม่บังคับ)"
                value={newHN}
                onChange={(e) => setNewHN(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPatient()}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addPatient}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium"
                >
                  เพิ่ม
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdd(false)
                    setNewName('')
                    setNewHN('')
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="w-full bg-blue-600 active:bg-blue-700 text-white py-3.5 rounded-2xl text-sm font-medium shadow flex items-center justify-center gap-2"
            >
              <span className="text-lg leading-none">+</span> เพิ่มคนไข้ใหม่
            </button>
          )}

          {/* Disclaimer */}
          <p className="text-center text-xs text-gray-400 mt-6 mb-2">
            Clinical decision support — แพทย์ต้อง confirm ก่อนสั่งยาเสมอ
          </p>
        </main>
      </div>
      <DrAIFloat settings={settings} />
    </>
  )
}

// ============================================================
// Patient Card
// ============================================================
function PatientCard({ patient, onClick }) {
  const latestLab = getLatestLabEntry(patient)
  const critical = hasCritical(patient)
  const abnormal = hasAbnormal(patient)
  const outdated = latestLab ? isLabOutdated(latestLab.date) : false

  const initial = ((patient.name || patient.hn || '?')[0] || '?').toUpperCase()
  const avatarColor = critical ? 'bg-red-500' : abnormal ? 'bg-yellow-500' : 'bg-blue-500'

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 text-left active:bg-gray-50 transition-colors"
    >
      <div
        className={`w-11 h-11 rounded-full ${avatarColor} text-white font-bold text-base flex items-center justify-center shrink-0`}
      >
        {initial}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">{patient.name || '(ไม่มีชื่อ)'}</div>
        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
          {/* Status badge */}
          {(() => {
            const status = patient.status || 'HD'
            const egfr = latestLab?.values?.eGFR
            const stage = status === 'CKD' ? getCKDStage(egfr) : null
            const color =
              status === 'HD'
                ? 'text-blue-600'
                : status === 'PD'
                  ? 'text-purple-600'
                  : status === 'KT'
                    ? 'text-green-600'
                    : 'text-orange-600'
            return (
              <span className={`font-semibold ${color}`}>
                {status}
                {stage ? ` ${stage}` : ''}
              </span>
            )
          })()}
          {patient.hn && <span>· HN: {patient.hn}</span>}
          {latestLab ? (
            <span className={outdated ? 'text-orange-500' : ''}>
              · Lab: {latestLab.date || '—'}
              {outdated && ' ⚠️'}
            </span>
          ) : (
            <span className="text-gray-400">· ยังไม่มี lab</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        {critical && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
            วิกฤต
          </span>
        )}
        {!critical && abnormal && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
            ผิดปกติ
          </span>
        )}
        {!critical && !abnormal && latestLab && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            ปกติ
          </span>
        )}
        <span className="text-gray-300 text-lg leading-none">›</span>
      </div>
    </button>
  )
}

// ============================================================
// Settings View
// ============================================================
function SettingsView({ settings, onSave, onBack, onDataRestored, isDark, onToggleTheme }) {
  const [apiKey, setApiKey] = useState(settings.apiKey || '')
  const [storage, setStorage] = useState(null)
  const [restoreMsg, setRestoreMsg] = useState('')
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef(null)
  const importFileRef = useRef(null)

  useEffect(() => {
    getStorageInfo().then(setStorage)
  }, [])

  const handleDownload = () => {
    const json = exportAllData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `nephro-backup-${date}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleRestore = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const preview = JSON.parse(text)
      const n = Array.isArray(preview?.patients) ? preview.patients.length : 0
      const ok = window.confirm(`ไฟล์นี้มีคนไข้ ${n} คน\nการ restore จะ **เขียนทับ** ข้อมูลปัจจุบัน\nยืนยันไหม?`)
      if (!ok) {
        e.target.value = ''
        return
      }
      const result = importAllData(text, { overwriteSettings: false })
      setRestoreMsg(`✅ Restore สำเร็จ — ${result.patients} คนไข้`)
      onDataRestored?.()
    } catch (err) {
      setRestoreMsg(`❌ ${err.message || 'Restore ไม่สำเร็จ'}`)
    }
    e.target.value = ''
  }

  const handleImportPatients = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      // รองรับทั้ง plain array และ full backup format
      const incoming = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.patients)
          ? parsed.patients
          : null
      if (!incoming) throw new Error('ไม่พบ patients array ในไฟล์')
      const current = loadPatients()
      const existingIds = new Set(current.map((p) => p.id))
      const toAdd = incoming.filter((p) => p?.id && !existingIds.has(p.id))
      savePatients([...current, ...toAdd])
      setImportMsg(
        `✅ นำเข้าสำเร็จ — เพิ่ม ${toAdd.length} คน (ซ้ำ ${incoming.length - toAdd.length} คน)`
      )
      onDataRestored?.()
    } catch (err) {
      setImportMsg(`❌ ${err.message || 'นำเข้าไม่สำเร็จ'}`)
    }
    e.target.value = ''
  }

  const fmtBytes = (n) => {
    if (!n) return '0 B'
    if (n < 1024) return `${n} B`
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
    return `${(n / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className="bg-blue-700 text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-20"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
      >
        <button type="button" onClick={onBack} className="text-2xl leading-none">
          ←
        </button>
        <h1 className="font-bold text-lg">ตั้งค่า</h1>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-semibold text-sm text-gray-700 mb-1">ธีม / Theme</h3>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => isDark && onToggleTheme()}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                !isDark ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300'
              }`}
            >
              ☀️ กลางวัน
            </button>
            <button
              type="button"
              onClick={() => !isDark && onToggleTheme()}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                isDark ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300'
              }`}
            >
              🌙 กลางคืน
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h3 className="font-semibold text-sm text-gray-700 mb-1">Anthropic API Key</h3>
          <p className="text-xs text-gray-500 mb-3">
            ใช้สำหรับ AI Chat — เก็บใน browser เครื่องนี้เท่านั้น ไม่ส่งไปที่ใด
          </p>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            type="button"
            onClick={() => onSave({ ...settings, apiKey })}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium"
          >
            บันทึก
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-1">💾 ข้อมูล & Backup</h3>
            <p className="text-xs text-gray-500">
              ข้อมูลอยู่ใน browser เครื่องนี้เท่านั้น — ดาวน์โหลดไฟล์ไว้กันข้อมูลหาย
            </p>
          </div>

          {storage?.supported && (
            <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">สถานะ Persistent</span>
                <span
                  className={storage.persisted ? 'text-green-600 font-medium' : 'text-amber-600'}
                >
                  {storage.persisted ? '✅ browser สัญญาจะไม่ลบ' : '⚠️ browser อาจลบเองได้'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ใช้งาน</span>
                <span className="text-gray-800">
                  {fmtBytes(storage.usage)} / {fmtBytes(storage.quota)} ({storage.percent}%)
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium"
          >
            💾 ดาวน์โหลด backup JSON
          </button>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium border border-gray-200"
          >
            ⬆️ Restore จากไฟล์ backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleRestore}
            className="hidden"
          />

          {restoreMsg && <p className="text-xs text-center mt-1">{restoreMsg}</p>}

          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-500 mb-2">
              📥 นำเข้าคนไข้จากไฟล์ JSON (เพิ่มเข้ามา ไม่เขียนทับข้อมูลเดิม)
            </p>
            <button
              type="button"
              onClick={() => importFileRef.current?.click()}
              className="w-full bg-green-50 text-green-700 py-2.5 rounded-xl text-sm font-medium border border-green-200"
            >
              📥 นำเข้าคนไข้ (merge)
            </button>
            <input
              ref={importFileRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportPatients}
              className="hidden"
            />
            {importMsg && <p className="text-xs text-center mt-1">{importMsg}</p>}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
          <p className="font-semibold mb-1">⚠️ Disclaimer</p>
          <p>
            แอปนี้เป็น <strong>clinical decision support tool</strong> เท่านั้น recommendation
            ทั้งหมดต้องผ่านการพิจารณาของแพทย์ก่อนสั่งยาเสมอ ข้อมูลคนไข้เก็บใน browser ของคุณเท่านั้น ไม่มีการส่งออก
          </p>
        </div>
      </div>
    </div>
  )
}
