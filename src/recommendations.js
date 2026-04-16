import { getLatestLabEntry, isLabOutdated, parseLabDate } from './storage'

// ============================================================
// CPG Recommendation Engine
// Thailand CPG Anemia 2021 + KDIGO 2026 Anemia
// KDIGO 2017/2025 MBD, KDIGO 2024 CKD
// ============================================================

export function getRecommendations(patient) {
  const labEntry = getLatestLabEntry(patient)
  if (!labEntry) return []

  const v = labEntry.values || {}
  const meds = patient.medications || []
  const allergies = patient.allergies || []
  const _outdated = isLabOutdated(labEntry.date)

  const recs = []

  // Critical alerts first
  recs.push(...getCriticalAlerts(v))

  // eGFR trend (Quick Mode explicit + Record Mode lab history)
  const { recs: egfrTrendRecs, egfrDropPct } = getEgfrTrendRecs(patient, v, meds)
  recs.push(...egfrTrendRecs)

  // Renoprotection: ARB/ACEi dose + SGLT2i (suppress up-titrate if eGFR dropping)
  recs.push(...getRenoprotectionRecs(v, meds, patient.conditions, egfrDropPct))

  // Drug-eGFR adjustment alerts
  recs.push(...getDrugEgfrRecs(v, meds))

  // Drug interaction alerts
  recs.push(...getDrugInteractionRecs(meds, v))

  // Domain recs
  recs.push(...getAnemiaRecs(v, meds, allergies))
  recs.push(...getMBDRecs(v, meds))
  recs.push(...getAdequacyRecs(v))
  recs.push(...getNutritionRecs(v, patient))
  recs.push(...getElectrolyteRecs(v))
  recs.push(...getInfectionRecs(v, labEntry.date))

  return recs
}

// ---- eGFR trend: % drop + rate of decline per year ----
function getEgfrTrendRecs(patient, v, meds) {
  const recs = []
  let egfrDropPct = 0
  const cur = Number.parseFloat(v.eGFR)
  let prev = null
  let months = null

  // 1) Quick Mode explicit values
  if (v.eGFR_prev != null && v.eGFR_prev_months != null) {
    prev = Number.parseFloat(v.eGFR_prev)
    months = Number.parseFloat(v.eGFR_prev_months)
  } else if (patient.labs && patient.labs.length >= 2) {
    // 2) Record Mode: find most recent previous lab with eGFR (before current labEntry date)
    const sorted = [...patient.labs].sort((a, b) => {
      const da = parseLabDate(a.date) || new Date(0)
      const db = parseLabDate(b.date) || new Date(0)
      return db - da
    })
    const curEntry = sorted[0]
    const prevEntry = sorted.slice(1).find((l) => l.values?.eGFR != null)
    if (prevEntry) {
      prev = Number.parseFloat(prevEntry.values.eGFR)
      const dCur = parseLabDate(curEntry.date)
      const dPrev = parseLabDate(prevEntry.date)
      if (dCur && dPrev) {
        months = (dCur - dPrev) / (1000 * 60 * 60 * 24 * 30.44)
      }
    }
  }

  if (
    Number.isNaN(cur) ||
    prev == null ||
    Number.isNaN(prev) ||
    prev <= 0 ||
    months == null ||
    Number.isNaN(months) ||
    months <= 0
  ) {
    return { recs, egfrDropPct }
  }

  const diff = cur - prev
  const pct = (diff / prev) * 100
  egfrDropPct = pct
  const ratePerYear = (diff / months) * 12

  const hasACEiARB = findMed(meds, [
    'Losartan',
    'Valsartan',
    'Irbesartan',
    'Telmisartan',
    'Olmesartan',
    'Candesartan',
    'Enalapril',
    'Ramipril',
    'Lisinopril',
    'Perindopril',
  ])
  const hasSGLT2i = findMed(meds, [
    'Dapagliflozin',
    'Empagliflozin',
    'Canagliflozin',
    'Forxiga',
    'Jardiance',
    'Invokana',
  ])

  // Drop >30% with ACEi/ARB → red
  if (pct <= -30 && hasACEiARB) {
    const currentDose = parseDoseMg(hasACEiARB.dose)
    const halfDose = currentDose ? Math.round(currentDose / 2) : null
    const doseRec = halfDose
      ? `ลด ${hasACEiARB.name} จาก ${hasACEiARB.dose} → ${halfDose} mg (ลด 50%) หรือหยุดชั่วคราว`
      : `ลดหรือหยุด ${hasACEiARB.name} ชั่วคราว`
    recs.push({
      id: 'egfr-drop-arb',
      severity: 'red',
      domain: 'CKD Progression',
      title: `eGFR drop ${pct.toFixed(0)}% หลังเริ่ม ACEi/ARB`,
      recommendation: `eGFR ลด ${prev.toFixed(0)} → ${cur.toFixed(0)} mL/min ใน ${months.toFixed(1)} เดือน (−${Math.abs(pct).toFixed(0)}%, rate ${Math.abs(ratePerYear).toFixed(0)} mL/min/ปี)\n${doseRec}\nตรวจ K/Cr ซ้ำ 1-2 สัปดาห์ + พิจารณา Doppler renal artery (bilateral RAS?)`,
      target: 'eGFR drop <30% หลังเริ่ม RAS inhibitor',
      warning: 'ถ้ามี bilateral renal artery stenosis → ห้ามใช้ ACEi/ARB',
    })
  } else if (pct <= -30 && hasSGLT2i) {
    // Drop >30% with SGLT2i → yellow (can be hemodynamic)
    recs.push({
      id: 'egfr-drop-sglt2',
      severity: 'yellow',
      domain: 'CKD Progression',
      title: `eGFR drop ${pct.toFixed(0)}% หลังเริ่ม SGLT2i`,
      recommendation: `eGFR ลด ${prev.toFixed(0)} → ${cur.toFixed(0)} mL/min ใน ${months.toFixed(1)} เดือน\nอาจเป็น hemodynamic effect ของ ${hasSGLT2i.name} (ช่วง 2-4 สัปดาห์แรก) — **recheck eGFR ใน 2-4 สัปดาห์** ก่อนปรับยา`,
      target: 'eGFR stable หลัง initial dip',
      warning: 'ถ้า drop ต่อเนื่อง → หยุด SGLT2i + หาสาเหตุอื่น',
    })
  } else if (pct <= -30) {
    recs.push({
      id: 'egfr-drop',
      severity: 'red',
      domain: 'CKD Progression',
      title: `eGFR drop ${pct.toFixed(0)}%`,
      recommendation: `eGFR ลด ${prev.toFixed(0)} → ${cur.toFixed(0)} mL/min ใน ${months.toFixed(1)} เดือน\nหา acute cause: dehydration, NSAIDs, contrast, obstruction, infection — recheck Cr/eGFR 1-2 สัปดาห์`,
      target: 'eGFR stable',
      warning: 'Acute kidney injury workup',
    })
  }

  // Rapid progression: rate < -5 mL/min/year (not covered by >30% drop)
  if (ratePerYear <= -5 && pct > -30) {
    recs.push({
      id: 'egfr-rapid',
      severity: 'yellow',
      domain: 'CKD Progression',
      title: `Rapid eGFR decline (${ratePerYear.toFixed(1)} mL/min/ปี)`,
      recommendation: `Rate of decline เร็วกว่าเป้า (>5 mL/min/ปี)\nเช็ค: BP control, proteinuria (UACR), DM control, NSAID exposure, renoprotection (ACEi/ARB + SGLT2i + max tolerated dose)`,
      target: 'Rate of decline <5 mL/min/ปี',
      warning: 'พิจารณา renoprotection ladder ตาม KDIGO 2024',
    })
  } else if (ratePerYear >= -2 && pct > -10) {
    recs.push({
      id: 'egfr-stable',
      severity: 'green',
      domain: 'CKD Progression',
      title: `eGFR stable (${ratePerYear.toFixed(1)} mL/min/ปี)`,
      recommendation: `Rate of decline ${ratePerYear.toFixed(1)} mL/min/ปี — อยู่ในเป้า`,
      target: 'Rate of decline <5 mL/min/ปี',
    })
  }

  return { recs, egfrDropPct }
}

// ---- helpers ----
function findMed(meds, keywords) {
  return meds.find((m) => keywords.some((k) => m.name.toLowerCase().includes(k.toLowerCase())))
}

function hasAllergy(allergies, keywords) {
  return allergies.some((a) => keywords.some((k) => a.toLowerCase().includes(k.toLowerCase())))
}

function parseDoseMg(doseStr) {
  if (!doseStr) return null
  const match = String(doseStr).match(/(\d+(?:\.\d+)?)/)
  return match ? Number.parseFloat(match[1]) : null
}

// ---- Renoprotection (ACEi/ARB dose + SGLT2i) ----
const ARB_ACEi_MAX = {
  losartan: 100,
  valsartan: 320,
  irbesartan: 300,
  telmisartan: 80,
  olmesartan: 40,
  candesartan: 32,
  enalapril: 40,
  ramipril: 10,
  lisinopril: 40,
  perindopril: 8,
}

function getRenoprotectionRecs(v, meds, conditions, egfrDropPct = 0) {
  const recs = []

  // เฉพาะคนไข้ CKD (มี eGFR) หรือที่มี FBS/HbA1C (DM clinic)
  const hasCKDLab = v.eGFR !== undefined || v.UACR !== undefined || v.Cr !== undefined
  if (!hasCKDLab) return recs

  const hasARB = findMed(meds, [
    'Losartan',
    'Valsartan',
    'Irbesartan',
    'Telmisartan',
    'Olmesartan',
    'Candesartan',
  ])
  const hasACEi = findMed(meds, ['Enalapril', 'Ramipril', 'Lisinopril', 'Perindopril'])
  const arbOrAcei = hasARB || hasACEi
  const hasSGLT2i = findMed(meds, [
    'Dapagliflozin',
    'Empagliflozin',
    'Canagliflozin',
    'Forxiga',
    'Jardiance',
    'Invokana',
  ])
  const hasDM = conditions?.some((c) => /dm|diabet/i.test(c.name))
  const hasProteinuria = v.UACR !== undefined && v.UACR >= 30
  const kOk = v.K === undefined || v.K < 5.0
  const egfrOk = v.eGFR === undefined || v.eGFR > 20

  if (arbOrAcei) {
    const med = arbOrAcei
    // หา max dose จาก key ชื่อยา
    let maxDose = null
    for (const [key, val] of Object.entries(ARB_ACEi_MAX)) {
      if (med.name.toLowerCase().includes(key)) {
        maxDose = val
        break
      }
    }
    const currentDose = parseDoseMg(med.dose)

    if (maxDose && currentDose) {
      const pct = Math.round((currentDose / maxDose) * 100)
      const atMax = currentDose >= maxDose

      if (atMax) {
        recs.push({
          id: 'renop-arb-max',
          severity: 'green',
          domain: 'CKD Progression',
          title: `${med.name} ที่ max dose แล้ว ✓`,
          recommendation: `${med.name} ${med.dose} = max dose (${maxDose} mg/day) ✓\nRenoprotection เต็ม dose ตาม KDIGO 2024`,
          target: 'Max tolerated ACEi/ARB',
          warning: 'Monitor K/eGFR ทุก 3–6 เดือน',
        })
      } else if (egfrDropPct <= -30) {
        // Suppress up-titrate when eGFR dropped >30% — conflict with dose reduction
        recs.push({
          id: 'renop-arb-hold',
          severity: 'yellow',
          domain: 'CKD Progression',
          title: `${med.name} — ชะลอ up-titrate (eGFR drop ${Math.abs(egfrDropPct).toFixed(0)}%)`,
          recommendation: `${med.name} dose ปัจจุบัน: ${med.dose} (${pct}% ของ max ${maxDose} mg)\neGFR ลดลง >30% — ไม่ควร up-titrate ตอนนี้\nรอ eGFR stable + recheck K/Cr ก่อนพิจารณาปรับ dose`,
          target: `เป้าหมาย: eGFR stable แล้วค่อย up-titrate → ${maxDose} mg`,
          warning: 'ห้าม up-titrate ขณะ eGFR กำลังลดลง',
        })
      } else {
        const uptitrate =
          kOk && egfrOk
            ? `แนะนำ up-titrate → ${maxDose} mg (max dose)\nเพิ่มทีละ ${currentDose} mg ทุก 2–4 สัปดาห์ + เช็ค K/Cr`
            : v.K !== undefined && v.K >= 5.0
              ? `K = ${v.K} mEq/L — รอ K <5.0 ก่อน up-titrate`
              : `eGFR = ${v.eGFR ?? '—'} mL/min — ระวังถ้า eGFR ต่ำมาก`
        recs.push({
          id: 'renop-arb-uptitrate',
          severity: 'yellow',
          domain: 'CKD Progression',
          title: `${med.name} ${pct}% ของ max dose — พิจารณาขึ้น dose`,
          recommendation: `${med.name} dose ปัจจุบัน: ${med.dose} (${pct}% ของ max ${maxDose} mg)\n${uptitrate}`,
          target: `Max tolerated dose = ${maxDose} mg/day`,
          warning: 'Monitor K/Cr 1–2 สัปดาห์หลังปรับ dose',
        })
      }
    } else if (!currentDose) {
      recs.push({
        id: 'renop-arb-nodose',
        severity: 'yellow',
        domain: 'CKD Progression',
        title: `${med.name} — ยังไม่ทราบ dose`,
        recommendation: `ใช้ ${med.name} อยู่ แต่ไม่มีข้อมูล dose\nกรุณาบันทึก dose เพื่อประเมิน % ของ max dose`,
        target: 'Max tolerated ACEi/ARB',
        warning: 'Up-titrate ถึง max tolerated dose ตาม KDIGO 2024',
      })
    }

    // แนะนำเพิ่ม SGLT2i ถ้ายังไม่ได้
    if (!hasSGLT2i && (hasDM || hasProteinuria) && egfrOk) {
      const indication = [hasDM ? 'DM' : null, hasProteinuria ? `UACR ${v.UACR} mg/g` : null]
        .filter(Boolean)
        .join(' + ')
      recs.push({
        id: 'renop-sglt2-add',
        severity: 'yellow',
        domain: 'CKD Progression',
        title: 'แนะนำเพิ่ม SGLT2i (KDIGO 2024)',
        recommendation: `มี ${indication} + ใช้ ACEi/ARB อยู่แล้ว\nแนะนำ add SGLT2i ตาม KDIGO 2024:\n• Dapagliflozin (Forxiga) 10 mg OD (eGFR ≥25)\n• Empagliflozin (Jardiance) 10 mg OD (eGFR ≥20)`,
        target: 'ACEi/ARB + SGLT2i combination (KDIGO 2024)',
        warning: `eGFR ปัจจุบัน: ${v.eGFR ?? '—'} mL/min — ห้ามใช้ถ้า eGFR <20`,
      })
    }
  } else {
    // ไม่ได้ใช้ ARB/ACEi — แนะนำเริ่มถ้ามี indication
    if ((hasDM || hasProteinuria) && kOk) {
      const indication = [hasDM ? 'DM' : null, hasProteinuria ? `UACR ${v.UACR} mg/g` : null]
        .filter(Boolean)
        .join(' + ')
      recs.push({
        id: 'renop-start-arb',
        severity: 'yellow',
        domain: 'CKD Progression',
        title: 'แนะนำเริ่ม ACEi/ARB — Renoprotection',
        recommendation: `มี ${indication} แต่ยังไม่ได้ ACEi/ARB\nแนะนำเริ่ม:\n• Losartan 50 mg OD (ARB)\n• Enalapril 5 mg OD (ACEi)\nTitrate ถึง max tolerated dose ทุก 2–4 สัปดาห์`,
        target: 'Max tolerated ACEi/ARB',
        warning: 'Monitor K/Cr 1–2 สัปดาห์หลังเริ่ม',
      })
    }
  }

  return recs
}

// ---- critical alerts ----
function getCriticalAlerts(v) {
  const recs = []

  if (v.K !== undefined && v.K >= 6.5)
    recs.push({
      id: 'crit-hyperK',
      severity: 'critical',
      domain: 'Electrolytes',
      title: 'URGENT: Hyperkalemia วิกฤต',
      recommendation: `K = ${v.K} mEq/L\n• EKG ทันที\n• IV Calcium gluconate\n• Insulin 10 u + 50% glucose 50 mL IV\n• Sodium bicarbonate (ถ้า acidosis)\n• พิจารณา urgent HD`,
      target: 'K 3.5–5.5 mEq/L',
      warning: 'ห้ามรอ — ต้องรักษาเร่งด่วน เสี่ยง fatal arrhythmia',
    })

  if (v.K !== undefined && v.K <= 2.5)
    recs.push({
      id: 'crit-hypoK',
      severity: 'critical',
      domain: 'Electrolytes',
      title: 'URGENT: Severe hypokalemia',
      recommendation: `K = ${v.K} mEq/L\n• IV K replacement\n• EKG monitoring\n• ตรวจสอบยาที่อาจทำให้ K ต่ำ`,
      target: 'K 3.5–5.5 mEq/L',
      warning: 'เสี่ยง cardiac arrhythmia',
    })

  if (v.Ca !== undefined && v.Ca >= 12.0)
    recs.push({
      id: 'crit-hyperCa',
      severity: 'critical',
      domain: 'CKD-MBD',
      title: 'URGENT: Severe hypercalcemia',
      recommendation: `Ca = ${v.Ca} mg/dL\n• หยุด Calcium-based binder ทันที\n• หยุด Vitamin D\n• IV saline hydration\n• พิจารณา low-Ca dialysate`,
      target: 'Ca 8.4–10.2 mg/dL',
      warning: 'เสี่ยง cardiac arrhythmia, vascular calcification',
    })

  if (v.Ca !== undefined && v.Ca <= 6.0)
    recs.push({
      id: 'crit-hypoCa',
      severity: 'critical',
      domain: 'CKD-MBD',
      title: 'URGENT: Severe hypocalcemia',
      recommendation: `Ca = ${v.Ca} mg/dL\n• IV Calcium gluconate ทันที\n• EKG monitoring`,
      target: 'Ca 8.4–10.2 mg/dL',
      warning: 'เสี่ยง tetany, laryngospasm, cardiac arrhythmia',
    })

  if (v.Hb !== undefined && v.Hb <= 5.0)
    recs.push({
      id: 'crit-anemia',
      severity: 'critical',
      domain: 'Anemia',
      title: 'URGENT: Severe anemia',
      recommendation: `Hb = ${v.Hb} g/dL\n• พิจารณา blood transfusion\n• ตรวจหาสาเหตุ bleeding\n• หยุด EPO ชั่วคราว ถ้า aplasia`,
      target: 'Hb 10–11.5 g/dL',
      warning: 'Hb ต่ำมาก — ต้องรักษาเร่งด่วน',
    })

  if (v.Na !== undefined && v.Na <= 120)
    recs.push({
      id: 'crit-hypoNa',
      severity: 'critical',
      domain: 'Electrolytes',
      title: 'URGENT: Severe hyponatremia',
      recommendation: `Na = ${v.Na} mEq/L\n• แก้ไข Na อย่างช้า ๆ ไม่เกิน 8–10 mEq/L/day\n• ปรึกษาทีมเพื่อพิจารณา hypertonic saline`,
      target: 'Na 135–145 mEq/L',
      warning: 'เสี่ยง cerebral edema ถ้าแก้ Na เร็วเกิน',
    })

  if (v.Na !== undefined && v.Na >= 160)
    recs.push({
      id: 'crit-hyperNa',
      severity: 'critical',
      domain: 'Electrolytes',
      title: 'URGENT: Severe hypernatremia',
      recommendation: `Na = ${v.Na} mEq/L\n• แก้ไข free water deficit อย่างช้า ๆ\n• ไม่เกิน 10 mEq/L/day`,
      target: 'Na 135–145 mEq/L',
      warning: 'เสี่ยง cerebral hemorrhage ถ้าแก้ Na เร็วเกิน',
    })

  return recs
}

// ---- anemia ----
function getAnemiaRecs(v, meds, allergies) {
  const recs = []
  const epo = findMed(meds, [
    'recormon',
    'eprex',
    'aranesp',
    'cera',
    'mircera',
    'epo',
    'darbepoetin',
    'epoetin',
  ])
  const ironAllergy = hasAllergy(allergies, ['venofer', 'iron sucrose'])
  const ironProduct = ironAllergy ? 'Ferinject (FCM) ⚠️ แพ้ Venofer' : 'Venofer (Iron sucrose)'

  // --- EPO by Hb ---
  if (v.Hb !== undefined && v.Hb > 5.0) {
    if (v.Hb < 10.0) {
      const dose = epo
        ? `เพิ่ม ${epo.name} 15–30%\nDose ปัจจุบัน: ${epo.dose} ${epo.frequency || ''}`
        : 'เริ่ม EPO (ถ้ายังไม่ได้) — ปรึกษา dose เริ่มต้น'
      recs.push({
        id: 'epo-low',
        severity: 'yellow',
        domain: 'Anemia',
        title: 'Hb ต่ำกว่าเป้า — เพิ่ม EPO',
        recommendation: `Hb = ${v.Hb} g/dL\n${dose}\nตรวจสอบ iron status ก่อนปรับ EPO`,
        target: 'Hb 10–11.5 g/dL',
        warning: 'ระวัง HTN, vascular access thrombosis ถ้าเพิ่ม EPO เร็วเกิน',
      })
    } else if (v.Hb <= 11.5) {
      recs.push({
        id: 'epo-ok',
        severity: 'green',
        domain: 'Anemia',
        title: 'Hb อยู่ในเป้าหมาย',
        recommendation: `Hb = ${v.Hb} g/dL — คงขนาด EPO เดิม`,
        target: 'Hb 10–11.5 g/dL',
        warning: '—',
      })
    } else if (v.Hb < 13.0) {
      const dose = epo
        ? `ลด ${epo.name} 15–30%\nDose ปัจจุบัน: ${epo.dose} ${epo.frequency || ''}`
        : 'Hb สูงกว่าเป้า — ตรวจสอบ EPO dose'
      recs.push({
        id: 'epo-high',
        severity: 'yellow',
        domain: 'Anemia',
        title: 'Hb สูงกว่าเป้า — ลด EPO',
        recommendation: `Hb = ${v.Hb} g/dL\n${dose}`,
        target: 'Hb 10–11.5 g/dL',
        warning: 'ระวัง HTN, stroke, vascular thrombosis',
      })
    } else {
      const restart = epo
        ? `Restart ${epo.name} 50% ของ dose เดิม (${epo.dose}) เมื่อ Hb ลงมา 10.6–12 g/dL`
        : ''
      recs.push({
        id: 'epo-stop',
        severity: 'red',
        domain: 'Anemia',
        title: 'Hb สูงมาก — หยุด EPO',
        recommendation: `Hb = ${v.Hb} g/dL\nหยุด EPO 1–2 สัปดาห์\n${restart}`,
        target: 'Hb 10–11.5 g/dL',
        warning: 'เสี่ยง stroke, thrombosis — ต้องปรับทันที',
      })
    }
  }

  // --- IV Iron by TSAT + Ferritin ---
  if (v.Ferritin !== undefined || v.TSAT !== undefined) {
    const fer = v.Ferritin
    const tsat = v.TSAT

    if ((fer !== undefined && fer >= 800) || (tsat !== undefined && tsat >= 40)) {
      recs.push({
        id: 'iron-stop',
        severity: 'yellow',
        domain: 'Anemia',
        title: 'Iron สูง — หยุด IV Iron',
        recommendation: `Ferritin = ${fer ?? '—'} ng/mL, TSAT = ${tsat ?? '—'}%\nหยุด IV Iron จนกว่า Ferritin <500 และ TSAT <30%`,
        target: 'Ferritin 200–500 ng/mL, TSAT 20–30%',
        warning: 'Iron overload เสี่ยง oxidative stress',
      })
    } else if (tsat !== undefined && tsat < 20 && (fer === undefined || fer < 200)) {
      recs.push({
        id: 'iron-def',
        severity: 'red',
        domain: 'Anemia',
        title: 'Iron Deficiency — IV Iron เร่งด่วน',
        recommendation: `TSAT = ${tsat ?? '—'}%, Ferritin = ${fer ?? '—'} ng/mL\n${ironProduct} 100 mg IV q 1 week × 10 doses`,
        target: 'Ferritin 200–500 ng/mL, TSAT 20–30%',
        warning: ironAllergy
          ? '⚠️ แพ้ iron sucrose — ใช้ Ferinject แทน\nระวัง anaphylaxis'
          : 'ระวัง anaphylaxis (โดยเฉพาะ Iron dextran)',
      })
    } else if (tsat !== undefined && tsat < 30 && (fer === undefined || fer < 500)) {
      const freq = tsat >= 20 && fer !== undefined && fer >= 200 ? 'q 2 weeks' : 'q 1 week'
      recs.push({
        id: 'iron-low',
        severity: 'yellow',
        domain: 'Anemia',
        title: 'Iron ต่ำกว่าเป้า — เพิ่ม IV Iron',
        recommendation: `TSAT = ${tsat ?? '—'}%, Ferritin = ${fer ?? '—'} ng/mL\n${ironProduct} 100 mg IV ${freq} × 10 doses`,
        target: 'Ferritin 200–500 ng/mL, TSAT 20–30%',
        warning: ironAllergy ? '⚠️ แพ้ iron sucrose — ใช้ Ferinject' : '—',
      })
    } else if (tsat !== undefined && tsat >= 30 && tsat < 40 && fer !== undefined && fer < 800) {
      recs.push({
        id: 'iron-borderline',
        severity: 'yellow',
        domain: 'Anemia',
        title: 'TSAT ค่อนข้างสูง — ลด frequency',
        recommendation: `TSAT = ${tsat}%, Ferritin = ${fer ?? '—'} ng/mL\n${ironProduct} 100 mg IV q 4 weeks`,
        target: 'Ferritin 200–500 ng/mL, TSAT 20–30%',
        warning: '—',
      })
    } else {
      recs.push({
        id: 'iron-ok',
        severity: 'green',
        domain: 'Anemia',
        title: 'Iron Status ดี',
        recommendation: `TSAT = ${tsat ?? '—'}%, Ferritin = ${fer ?? '—'} ng/mL — คง IV Iron เดิม`,
        target: 'Ferritin 200–500 ng/mL, TSAT 20–30%',
        warning: '—',
      })
    }
  }

  return recs
}

// ---- CKD-MBD ----
function getMBDRecs(v, meds) {
  const recs = []
  const vitD = findMed(meds, ['alfacalcidol', 'calcitriol', 'ergocalciferol', 'cholecalciferol'])

  if (v.PO4 !== undefined) {
    if (v.PO4 > 5.5)
      recs.push({
        id: 'po4-high',
        severity: 'yellow',
        domain: 'CKD-MBD',
        title: 'Phosphate สูง — เพิ่ม binder + ควบ diet',
        recommendation: `PO4 = ${v.PO4} mg/dL\n• เพิ่ม phosphate binder (CaCO3 / Sevelamer / Lanthanum)\n• จำกัด dietary phosphate: หลีกเลี่ยง processed food, นม, cheese, น้ำอัดลม`,
        target: 'PO4 3.5–5.5 mg/dL',
        warning: 'ถ้าได้ CaCO3 ร่วมกับ Vitamin D → ระวัง hypercalcemia',
      })
    else if (v.PO4 >= 3.5)
      recs.push({
        id: 'po4-ok',
        severity: 'green',
        domain: 'CKD-MBD',
        title: 'Phosphate อยู่ในเป้าหมาย',
        recommendation: `PO4 = ${v.PO4} mg/dL`,
        target: 'PO4 3.5–5.5 mg/dL',
        warning: '—',
      })
    else
      recs.push({
        id: 'po4-low',
        severity: 'yellow',
        domain: 'CKD-MBD',
        title: 'Phosphate ต่ำ — ลด binder',
        recommendation: `PO4 = ${v.PO4} mg/dL\nพิจารณาลด phosphate binder`,
        target: 'PO4 3.5–5.5 mg/dL',
        warning: '—',
      })
  }

  if (v.Ca !== undefined) {
    if (v.Ca > 10.2)
      recs.push({
        id: 'ca-high',
        severity: 'red',
        domain: 'CKD-MBD',
        title: 'Calcium สูง — ลด/หยุด CaCO3, ลด Vitamin D',
        recommendation: `Ca = ${v.Ca} mg/dL\n• ลด/หยุด CaCO3\n• ลดขนาด Vitamin D\n• พิจารณาลด Ca ใน dialysate`,
        target: 'Ca 8.4–10.2 mg/dL',
        warning: 'Hypercalcemia + high PO4 → vascular calcification',
      })
    else if (v.Ca >= 8.4)
      recs.push({
        id: 'ca-ok',
        severity: 'green',
        domain: 'CKD-MBD',
        title: 'Calcium อยู่ในเป้าหมาย',
        recommendation: `Ca = ${v.Ca} mg/dL`,
        target: 'Ca 8.4–10.2 mg/dL',
        warning: '—',
      })
    else
      recs.push({
        id: 'ca-low',
        severity: 'yellow',
        domain: 'CKD-MBD',
        title: 'Calcium ต่ำ — เพิ่ม CaCO3',
        recommendation: `Ca = ${v.Ca} mg/dL\nเพิ่ม CaCO3 หรือ Ca supplement`,
        target: 'Ca 8.4–10.2 mg/dL',
        warning: 'Recheck Ca ใน 2 สัปดาห์หลังปรับยา',
      })
  }

  // 25-OH Vitamin D (KDIGO 2017 CKD-MBD)
  if (v.VitD25 !== undefined) {
    const vd = v.VitD25
    if (vd < 10)
      recs.push({
        id: 'vitd-severe',
        severity: 'red',
        domain: 'CKD-MBD',
        title: '25-OH Vit D ต่ำมาก (Severe deficiency)',
        recommendation: `VitD25 = ${vd} ng/mL\n• Cholecalciferol 40,000–50,000 IU/wk IM × 8–12 wk\n• หรือ Ergocalciferol 50,000 IU/wk × 8 wk\n• Recheck ใน 3 เดือน`,
        target: '25-OH VitD ≥ 30 ng/mL',
        warning: 'Monitor Ca/PO4 ทุก 4–6 สัปดาห์หลังเริ่มยา',
      })
    else if (vd < 20)
      recs.push({
        id: 'vitd-deficient',
        severity: 'red',
        domain: 'CKD-MBD',
        title: '25-OH Vit D ต่ำ (Deficiency)',
        recommendation: `VitD25 = ${vd} ng/mL\n• Cholecalciferol 20,000–40,000 IU/wk × 8–12 wk\n• Recheck ใน 3 เดือน`,
        target: '25-OH VitD ≥ 30 ng/mL',
        warning: 'ระวัง hypercalcemia — ติดตาม Ca หลัง 4–6 สัปดาห์',
      })
    else if (vd < 30)
      recs.push({
        id: 'vitd-insufficient',
        severity: 'yellow',
        domain: 'CKD-MBD',
        title: '25-OH Vit D ไม่พอ (Insufficiency)',
        recommendation: `VitD25 = ${vd} ng/mL\n• Cholecalciferol 1,000–2,000 IU/วัน หรือ 10,000 IU/wk × 4–8 wk\n• Recheck ใน 3 เดือน`,
        target: '25-OH VitD ≥ 30 ng/mL',
        warning: '—',
      })
    else
      recs.push({
        id: 'vitd-ok',
        severity: 'green',
        domain: 'CKD-MBD',
        title: '25-OH Vit D อยู่ในเกณฑ์',
        recommendation: `VitD25 = ${vd} ng/mL — คงการรักษาเดิม`,
        target: '25-OH VitD ≥ 30 ng/mL',
        warning: '—',
      })
  }

  if (v.iPTH !== undefined) {
    const pth = v.iPTH
    const ca = v.Ca
    const po4 = v.PO4
    const eligibleForVitD = (po4 === undefined || po4 < 5.5) && (ca === undefined || ca < 9.5)

    if (pth > 300) {
      let vitDRec
      if (eligibleForVitD) {
        vitDRec = vitD
          ? `เพิ่มขนาด ${vitD.name} 25–50%\nDose ปัจจุบัน: ${vitD.dose}`
          : 'เริ่ม Alfacalcidol 0.25–0.5 mcg 3×/wk หรือ Calcitriol 0.25 mcg OD'
      } else {
        vitDRec = 'iPTH สูง แต่ Ca หรือ PO4 สูงเกิน\nปรับ Ca/PO4 ก่อน — พิจารณา Cinacalcet'
      }
      recs.push({
        id: 'pth-high',
        severity: 'yellow',
        domain: 'CKD-MBD',
        title: 'iPTH สูง — เพิ่ม/เริ่ม Vitamin D',
        recommendation: `iPTH = ${pth} pg/mL\n${vitDRec}`,
        target: 'iPTH 150–300 pg/mL',
        warning: 'Recheck Ca ใน 2 สัปดาห์หลังเพิ่ม Vitamin D',
      })
    } else if (pth >= 200) {
      recs.push({
        id: 'pth-ok',
        severity: 'green',
        domain: 'CKD-MBD',
        title: 'iPTH อยู่ในเป้าหมาย',
        recommendation: `iPTH = ${pth} pg/mL — คงขนาด Vitamin D เดิม ≥3 เดือน`,
        target: 'iPTH 150–300 pg/mL',
        warning: '—',
      })
    } else if (pth >= 150) {
      const dose = vitD
        ? `ลด ${vitD.name} 50% จาก ${vitD.dose} นาน 2 เดือน`
        : 'iPTH ค่อนข้างต่ำ — ติดตาม'
      recs.push({
        id: 'pth-low-border',
        severity: 'yellow',
        domain: 'CKD-MBD',
        title: 'iPTH ค่อนข้างต่ำ — ลด Vitamin D',
        recommendation: `iPTH = ${pth} pg/mL\n${dose}`,
        target: 'iPTH 150–300 pg/mL',
        warning: '—',
      })
    } else {
      const dose = vitD ? `หยุด ${vitD.name} 1 เดือน` : 'iPTH ต่ำมาก — ติดตาม'
      recs.push({
        id: 'pth-low',
        severity: 'red',
        domain: 'CKD-MBD',
        title: 'iPTH ต่ำมาก — หยุด Vitamin D',
        recommendation: `iPTH = ${pth} pg/mL\n${dose}\nRecheck iPTH 1 เดือน`,
        target: 'iPTH 150–300 pg/mL',
        warning: 'iPTH ต่ำเกิน → เสี่ยง adynamic bone disease',
      })
    }
  }

  return recs
}

// ---- dialysis adequacy ----
function getAdequacyRecs(v) {
  const recs = []

  if (v.KtV !== undefined) {
    if (v.KtV < 1.2)
      recs.push({
        id: 'ktv-low',
        severity: 'red',
        domain: 'Dialysis Adequacy',
        title: 'Kt/V ต่ำ — Dialysis ไม่เพียงพอ',
        recommendation: `Kt/V = ${v.KtV} (เป้า ≥1.2 สำหรับ 3×/wk)\nตรวจสอบ:\n• เวลา HD ≥4 ชม.\n• BFR ≥250 mL/min\n• Vascular access flow\n• Dialyzer size`,
        target: 'Kt/V ≥1.2 (3×/wk), ≥1.8 (2×/wk)',
        warning: 'Inadequate dialysis เสี่ยง uremic complications',
      })
    else
      recs.push({
        id: 'ktv-ok',
        severity: 'green',
        domain: 'Dialysis Adequacy',
        title: 'Kt/V อยู่ในเป้าหมาย',
        recommendation: `Kt/V = ${v.KtV}`,
        target: 'Kt/V ≥1.2 (3×/wk)',
        warning: '—',
      })
  }

  if (v.URR !== undefined) {
    if (v.URR < 65)
      recs.push({
        id: 'urr-low',
        severity: 'yellow',
        domain: 'Dialysis Adequacy',
        title: 'URR ต่ำ — ตรวจสอบ prescription',
        recommendation: `URR = ${v.URR}% (เป้า ≥65%)\nตรวจสอบ HD prescription และ vascular access`,
        target: 'URR ≥65%',
        warning: '—',
      })
    else
      recs.push({
        id: 'urr-ok',
        severity: 'green',
        domain: 'Dialysis Adequacy',
        title: 'URR อยู่ในเป้าหมาย',
        recommendation: `URR = ${v.URR}%`,
        target: 'URR ≥65%',
        warning: '—',
      })
  }

  return recs
}

// ---- nutrition ----
function getNutritionRecs(v, patient) {
  const recs = []
  const w = patient.weight_kg

  if (v.Albumin !== undefined) {
    if (v.Albumin < 3.5) {
      const proteinRec = w
        ? `protein intake ≥${Math.round(w * 1.0)}–${Math.round(w * 1.2)} g/day`
        : 'protein intake ≥1.0–1.2 g/kg/day'
      recs.push({
        id: 'albumin-low',
        severity: 'red',
        domain: 'Nutrition',
        title: 'Albumin ต่ำ — Malnutrition',
        recommendation: `Albumin = ${v.Albumin} g/dL\n• Nutritional assessment\n• ${proteinRec}\n• พิจารณา nutritional supplement`,
        target: 'Albumin ≥3.5 g/dL',
        warning: 'Hypoalbuminemia เพิ่ม mortality ใน HD patients',
      })
    } else {
      recs.push({
        id: 'albumin-ok',
        severity: 'green',
        domain: 'Nutrition',
        title: 'Albumin อยู่ในเป้าหมาย',
        recommendation: `Albumin = ${v.Albumin} g/dL`,
        target: 'Albumin ≥3.5 g/dL',
        warning: '—',
      })
    }
  }

  if (v.nPCR !== undefined) {
    if (v.nPCR < 0.8)
      recs.push({
        id: 'npcr-low',
        severity: 'yellow',
        domain: 'Nutrition',
        title: 'nPCR ต่ำ — Protein intake ไม่เพียงพอ',
        recommendation: `nPCR = ${v.nPCR} (เป้า 1.0–1.2)\nแนะนำเพิ่ม protein intake`,
        target: 'nPCR 1.0–1.2',
        warning: '—',
      })
    else
      recs.push({
        id: 'npcr-ok',
        severity: 'green',
        domain: 'Nutrition',
        title: 'nPCR อยู่ในเป้าหมาย',
        recommendation: `nPCR = ${v.nPCR}`,
        target: 'nPCR 1.0–1.2',
        warning: '—',
      })
  }

  return recs
}

// ---- electrolytes ----
function getElectrolyteRecs(v) {
  const recs = []

  if (v.K !== undefined && v.K > 2.5 && v.K < 6.5) {
    if (v.K > 5.5)
      recs.push({
        id: 'k-high',
        severity: 'yellow',
        domain: 'Electrolytes',
        title: 'Potassium สูง — จำกัด K ในอาหาร',
        recommendation: `K = ${v.K} mEq/L\n• จำกัด dietary K (หลีกเลี่ยงกล้วย, ส้ม, มะเขือเทศ)\n• ทบทวน ACEi/ARB/MRA\n• พิจารณา K binder (Patiromer, ZS-9)`,
        target: 'K 3.5–5.5 mEq/L',
        warning: 'K >6.0 ต้องรีบรักษา',
      })
    else if (v.K < 3.5)
      recs.push({
        id: 'k-low',
        severity: 'yellow',
        domain: 'Electrolytes',
        title: 'Potassium ต่ำ',
        recommendation: `K = ${v.K} mEq/L\n• ทบทวนยา diuretic\n• K supplement\n• เพิ่ม K ในอาหาร`,
        target: 'K 3.5–5.5 mEq/L',
        warning: 'ระวัง cardiac arrhythmia',
      })
    else
      recs.push({
        id: 'k-ok',
        severity: 'green',
        domain: 'Electrolytes',
        title: 'Potassium อยู่ในเป้าหมาย',
        recommendation: `K = ${v.K} mEq/L`,
        target: 'K 3.5–5.5 mEq/L',
        warning: '—',
      })
  }

  if (v.HCO3 !== undefined) {
    if (v.HCO3 < 22)
      recs.push({
        id: 'hco3-low',
        severity: 'yellow',
        domain: 'Electrolytes',
        title: 'Metabolic Acidosis — เพิ่ม NaHCO3',
        recommendation: `HCO3 = ${v.HCO3} mEq/L\n• เพิ่ม NaHCO3 supplement\n• พิจารณาเพิ่ม dialysate bicarbonate`,
        target: 'HCO3 ≥22 mEq/L',
        warning: 'Metabolic acidosis เร่ง bone disease และ muscle wasting',
      })
    else
      recs.push({
        id: 'hco3-ok',
        severity: 'green',
        domain: 'Electrolytes',
        title: 'Bicarbonate อยู่ในเป้าหมาย',
        recommendation: `HCO3 = ${v.HCO3} mEq/L`,
        target: 'HCO3 ≥22 mEq/L',
        warning: '—',
      })
  }

  return recs
}

// ---- infection screening ----
function getInfectionRecs(v, _labDate) {
  const recs = []

  if (v.HBsAb !== undefined) {
    if (v.HBsAb === 'Neg')
      recs.push({
        id: 'hbsab-neg',
        severity: 'yellow',
        domain: 'Infection',
        title: 'HBsAb ลบ — ควรฉีด HBV vaccine',
        recommendation:
          'HBsAb Negative\nแนะนำ HBV vaccination series\n(double dose สำหรับผู้ป่วย HD: 40 mcg ×3 doses)',
        target: 'HBsAb Positive (protective)',
        warning: 'HD patients มีความเสี่ยง HBV สูง',
      })
  }

  if (v['Anti-HCV'] === 'Pos')
    recs.push({
      id: 'hcv-pos',
      severity: 'yellow',
      domain: 'Infection',
      title: 'Anti-HCV Positive — Refer Hepatologist',
      recommendation:
        'Anti-HCV Positive\n• ตรวจ HCV RNA ยืนยัน active infection\n• Refer Hepatologist พิจารณา DAA treatment',
      target: 'HCV eradication',
      warning: 'DAA ปัจจุบัน safe ใน CKD/HD — ควรรักษา',
    })

  return recs
}

// ---- Drug-eGFR adjustment rules ----
const DRUG_EGFR_RULES = [
  // เบาหวาน
  {
    keywords: ['metformin', 'glucophage'],
    rules: [
      {
        eGFR_max: 30,
        severity: 'red',
        action: 'หยุด Metformin ทันที — ห้ามใช้เมื่อ eGFR <30 (lactic acidosis risk)',
      },
      {
        eGFR_max: 45,
        severity: 'yellow',
        action: 'ลด Metformin → max 500–1000 mg/day เมื่อ eGFR 30–44',
      },
    ],
  },
  {
    keywords: ['glipizide', 'minidiab'],
    rules: [
      {
        eGFR_max: 15,
        severity: 'red',
        action: 'หลีกเลี่ยง Glipizide เมื่อ eGFR <15 — prolonged hypoglycemia risk',
      },
      {
        eGFR_max: 30,
        severity: 'yellow',
        action: 'ระวัง Glipizide เมื่อ eGFR 15–29 — ลด dose 50%, monitor DTX',
      },
    ],
  },
  {
    keywords: ['gliclazide', 'diamicron'],
    rules: [
      {
        eGFR_max: 15,
        severity: 'red',
        action: 'หลีกเลี่ยง Gliclazide เมื่อ eGFR <15 — prolonged hypoglycemia risk',
      },
      {
        eGFR_max: 30,
        severity: 'yellow',
        action: 'ระวัง Gliclazide เมื่อ eGFR 15–29 — ลด dose 50%, monitor DTX',
      },
    ],
  },
  {
    keywords: ['glimepiride', 'amaryl'],
    rules: [
      {
        eGFR_max: 30,
        severity: 'red',
        action: 'หลีกเลี่ยง Glimepiride เมื่อ eGFR <30 — สะสม + prolonged hypoglycemia',
      },
    ],
  },
  {
    keywords: ['sitagliptin', 'januvia'],
    rules: [
      { eGFR_max: 30, severity: 'yellow', action: 'ลด Sitagliptin → 25 mg/day (eGFR <30)' },
      { eGFR_max: 45, severity: 'yellow', action: 'ลด Sitagliptin → 50 mg/day (eGFR 30–44)' },
    ],
  },
  {
    keywords: ['vildagliptin', 'galvus'],
    rules: [
      {
        eGFR_max: 45,
        severity: 'yellow',
        action: 'ลด Vildagliptin → 50 mg OD (จาก 50 mg bid) เมื่อ eGFR <45',
      },
    ],
  },
  {
    keywords: ['acarbose', 'glucobay'],
    rules: [{ eGFR_max: 25, severity: 'red', action: 'หยุด Acarbose — ห้ามใช้เมื่อ eGFR <25' }],
  },
  {
    keywords: ['dapagliflozin', 'forxiga'],
    rules: [
      {
        eGFR_max: 20,
        severity: 'red',
        action: 'หยุด Dapagliflozin — ไม่มีประสิทธิภาพ + ไม่ปลอดภัยเมื่อ eGFR <20',
      },
    ],
  },
  {
    keywords: ['empagliflozin', 'jardiance'],
    rules: [
      { eGFR_max: 20, severity: 'red', action: 'หยุด Empagliflozin — ไม่มีประสิทธิภาพเมื่อ eGFR <20' },
    ],
  },
  {
    keywords: ['canagliflozin', 'invokana'],
    rules: [
      { eGFR_max: 20, severity: 'red', action: 'หยุด Canagliflozin — ไม่มีประสิทธิภาพเมื่อ eGFR <20' },
    ],
  },
  {
    keywords: [
      'insulin',
      'glargine',
      'lantus',
      'detemir',
      'degludec',
      'tresiba',
      'aspart',
      'novorapid',
      'lispro',
      'humalog',
      'nph',
    ],
    rules: [
      {
        eGFR_max: 15,
        severity: 'yellow',
        action:
          'ลด Insulin dose ~50% เมื่อ eGFR <15/HD — ไตขับ insulin ช้าลง + uremia ลด insulin resistance',
      },
      {
        eGFR_max: 30,
        severity: 'yellow',
        action: 'ลด Insulin dose ~25% เมื่อ eGFR 15–29 — monitor DTX ถี่ขึ้น',
      },
    ],
  },
  // ความดัน
  {
    keywords: ['atenolol', 'tenormin'],
    rules: [
      { eGFR_max: 30, severity: 'yellow', action: 'ลด Atenolol 50% เมื่อ eGFR <30 — ไตขับ, สะสมได้' },
    ],
  },
  {
    keywords: ['hctz', 'hydrochlorothiazide'],
    rules: [
      {
        eGFR_max: 30,
        severity: 'yellow',
        action: 'HCTZ ไม่ได้ผลเมื่อ eGFR <30 — เปลี่ยนเป็น Furosemide (loop diuretic)',
      },
    ],
  },
  {
    keywords: ['spironolactone', 'aldactone'],
    rules: [
      {
        eGFR_max: 15,
        severity: 'red',
        action: 'หลีกเลี่ยง Spironolactone เมื่อ eGFR <15/HD — severe hyperkalemia risk',
      },
      {
        eGFR_max: 30,
        severity: 'yellow',
        action: 'ระวัง Spironolactone เมื่อ eGFR 15–29 — monitor K ถี่ขึ้น, ระวัง hyperkalemia',
      },
    ],
  },
  {
    keywords: ['ramipril', 'tritace'],
    rules: [
      {
        eGFR_max: 30,
        severity: 'yellow',
        action: 'ลด Ramipril 50% เมื่อ eGFR <30 — สะสม, ระวัง AKI + hyperkalemia',
      },
    ],
  },
  // อื่น ๆ
  {
    keywords: ['allopurinol', 'zyloric'],
    rules: [
      {
        eGFR_max: 30,
        severity: 'yellow',
        action:
          'ลด Allopurinol เริ่มต้น 50–100 mg/day เมื่อ eGFR <30 — ระวัง allopurinol hypersensitivity syndrome',
      },
    ],
  },
  {
    keywords: ['colchicine'],
    rules: [
      {
        eGFR_max: 30,
        severity: 'yellow',
        action: 'ลด Colchicine 50% หรือ qOD เมื่อ eGFR <30 — ระวัง neuromyopathy',
      },
    ],
  },
  {
    keywords: ['gabapentin', 'neurontin'],
    rules: [
      {
        eGFR_max: 15,
        severity: 'yellow',
        action: 'ลด Gabapentin 75% (100–300 mg/day) เมื่อ eGFR <15',
      },
      { eGFR_max: 30, severity: 'yellow', action: 'ลด Gabapentin 50% เมื่อ eGFR 15–29' },
      { eGFR_max: 60, severity: 'yellow', action: 'ลด Gabapentin dose เมื่อ eGFR 30–59' },
    ],
  },
  {
    keywords: ['pregabalin', 'lyrica'],
    rules: [
      { eGFR_max: 30, severity: 'yellow', action: 'ลด Pregabalin 75% เมื่อ eGFR <30' },
      { eGFR_max: 60, severity: 'yellow', action: 'ลด Pregabalin 50% เมื่อ eGFR 30–59' },
    ],
  },
  {
    keywords: ['dabigatran', 'pradaxa'],
    rules: [
      {
        eGFR_max: 30,
        severity: 'red',
        action: 'หลีกเลี่ยง Dabigatran เมื่อ eGFR <30 — ไตขับ 80%, สะสมมาก → bleeding risk สูง',
      },
    ],
  },
  {
    keywords: ['rivaroxaban', 'xarelto'],
    rules: [
      { eGFR_max: 15, severity: 'red', action: 'หลีกเลี่ยง Rivaroxaban เมื่อ eGFR <15' },
      { eGFR_max: 50, severity: 'yellow', action: 'ลด Rivaroxaban → 15 mg/day เมื่อ eGFR 15–49' },
    ],
  },
  {
    keywords: ['apixaban', 'eliquis'],
    rules: [
      { eGFR_max: 25, severity: 'yellow', action: 'พิจารณาลด Apixaban → 2.5 mg bid เมื่อ eGFR <25' },
    ],
  },
]

function getDrugEgfrRecs(v, meds) {
  const recs = []
  const egfr = Number.parseFloat(v.eGFR)
  if (Number.isNaN(egfr) || meds.length === 0) return recs

  for (const drugDef of DRUG_EGFR_RULES) {
    const med = findMed(meds, drugDef.keywords)
    if (!med) continue

    // Find most specific (lowest eGFR_max) applicable rule
    const applicable = drugDef.rules
      .filter((r) => egfr < r.eGFR_max)
      .sort((a, b) => a.eGFR_max - b.eGFR_max)
    if (applicable.length === 0) continue
    const rule = applicable[0]

    recs.push({
      id: `drug-egfr-${med.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')}`,
      severity: rule.severity,
      domain: 'Drug Adjustment',
      title: `${med.name} — ต้องปรับ dose (eGFR ${egfr.toFixed(0)})`,
      recommendation: rule.action,
      target: `eGFR ปัจจุบัน: ${egfr.toFixed(0)} mL/min/1.73m²`,
      warning: rule.severity === 'red' ? 'ต้องปรับยาทันที' : 'พิจารณาปรับ dose',
    })
  }

  return recs
}

// ---- Drug interaction alerts ----
function getDrugInteractionRecs(meds, v) {
  const recs = []

  const hasARB = findMed(meds, [
    'Losartan',
    'Valsartan',
    'Irbesartan',
    'Telmisartan',
    'Olmesartan',
    'Candesartan',
  ])
  const hasACEi = findMed(meds, ['Enalapril', 'Ramipril', 'Lisinopril', 'Perindopril'])
  const hasSGLT2i = findMed(meds, [
    'Dapagliflozin',
    'Empagliflozin',
    'Canagliflozin',
    'Forxiga',
    'Jardiance',
    'Invokana',
  ])
  const hasSpiro = findMed(meds, ['Spironolactone', 'Aldactone'])
  const hasFinerenone = findMed(meds, ['Finerenone', 'Kerendia'])
  const hasNSAIDs = findMed(meds, [
    'Ibuprofen',
    'Diclofenac',
    'Naproxen',
    'Piroxicam',
    'Indomethacin',
    'Voltaren',
    'Celecoxib',
    'Mefenamic',
    'Arcoxia',
  ])
  const hasDiuretic = findMed(meds, ['Furosemide', 'HCTZ', 'Hydrochlorothiazide', 'Torsemide'])
  const hasInsulin = findMed(meds, [
    'Insulin',
    'Glargine',
    'Lantus',
    'Detemir',
    'Degludec',
    'Aspart',
    'Lispro',
    'NPH',
  ])
  const hasSU = findMed(meds, [
    'Glipizide',
    'Gliclazide',
    'Glimepiride',
    'Minidiab',
    'Diamicron',
    'Amaryl',
  ])
  const hasWarfarin = findMed(meds, ['Warfarin', 'Coumadin'])
  const hasDigoxin = findMed(meds, ['Digoxin', 'Lanoxin'])

  // 1. Dual RAS: ACEi + ARB
  if (hasARB && hasACEi) {
    recs.push({
      id: 'drug-int-dual-ras',
      severity: 'red',
      domain: 'Drug Interaction',
      title: `Dual RAS Blockade: ${hasARB.name} + ${hasACEi.name}`,
      recommendation: `ห้ามใช้ ACEi + ARB ร่วมกัน\nเสี่ยง: hyperkalemia รุนแรง + AKI\n→ ให้เลือกใช้ตัวใดตัวหนึ่งเท่านั้น`,
      target: 'ใช้ ACEi หรือ ARB ตัวเดียว',
      warning: 'ONTARGET trial: dual RAS เพิ่ม AKI + hyperkalemia โดยไม่มีประโยชน์เพิ่ม',
    })
  }

  // 2. Triple K-sparing: ACEi/ARB + Spiro + SGLT2i
  if ((hasARB || hasACEi) && hasSpiro && hasSGLT2i) {
    const ras = hasARB || hasACEi
    recs.push({
      id: 'drug-int-triple-K',
      severity: 'red',
      domain: 'Drug Interaction',
      title: 'Triple K-sparing — Hyperkalemia Risk สูง',
      recommendation: `${ras.name} + ${hasSpiro.name} + ${hasSGLT2i.name}\nทั้ง 3 ตัวเพิ่ม K — monitor K ทุก 1–2 สัปดาห์\nพิจารณา K binder ถ้า K >5.0 mEq/L`,
      target: 'K <5.5 mEq/L',
      warning: 'ถ้า K >5.5 → ต้องปรับยาทันที',
    })
  }

  // 3. ACEi/ARB + Finerenone
  if ((hasARB || hasACEi) && hasFinerenone) {
    const ras = hasARB || hasACEi
    recs.push({
      id: 'drug-int-finerenone',
      severity: 'yellow',
      domain: 'Drug Interaction',
      title: `${ras.name} + Finerenone — ระวัง Hyperkalemia`,
      recommendation: `Double K-sparing effect\nตรวจ K ก่อนเริ่ม Finerenone + ทุก 1 เดือน\nหยุด Finerenone ถ้า K ≥5.5 mEq/L`,
      target: 'K <5.0 mEq/L ก่อนเริ่ม Finerenone',
      warning: 'ห้ามเริ่ม Finerenone ถ้า K ≥5.0',
    })
  }

  // 4. NSAIDs combinations
  if (hasNSAIDs) {
    const arbAcei = hasARB || hasACEi
    if (arbAcei && hasDiuretic) {
      recs.push({
        id: 'drug-int-triple-whammy',
        severity: 'critical',
        domain: 'Drug Interaction',
        title: `Triple Whammy AKI: NSAIDs + RAS + Diuretic`,
        recommendation: `${hasNSAIDs.name} + ${arbAcei.name} + ${hasDiuretic.name}\n"Triple Whammy" — เสี่ยง AKI รุนแรงมาก\nหยุด NSAIDs ทันที — ใช้ Paracetamol แทน`,
        target: 'หยุด NSAIDs ทุกชนิดใน CKD',
        warning: 'ห้ามใช้ NSAIDs ใน CKD ยิ่งถ้าได้ RAS inhibitor + diuretic',
      })
    } else if (arbAcei) {
      recs.push({
        id: 'drug-int-nsaid-ras',
        severity: 'red',
        domain: 'Drug Interaction',
        title: `NSAIDs + ${arbAcei.name} — AKI Risk`,
        recommendation: `${hasNSAIDs.name} + ${arbAcei.name}\nNSAIDs ลด GFR + เพิ่ม K + ลด effect ของ RAS inhibitor\nหยุด NSAIDs — ใช้ Paracetamol แทน`,
        target: 'หลีกเลี่ยง NSAIDs ใน CKD',
        warning: 'NSAIDs contraindicated ใน CKD',
      })
    } else if (hasWarfarin) {
      recs.push({
        id: 'drug-int-warfarin-nsaid',
        severity: 'red',
        domain: 'Drug Interaction',
        title: `Warfarin + ${hasNSAIDs.name} — GI Bleeding`,
        recommendation: `${hasWarfarin.name} + ${hasNSAIDs.name}\nเสี่ยง GI bleeding รุนแรง\nหยุด NSAIDs — ใช้ Paracetamol แทน`,
        target: 'หลีกเลี่ยง NSAIDs เมื่อได้ anticoagulant',
        warning: 'ระวัง GI bleeding',
      })
    }
  }

  // 5. SGLT2i + Insulin/SU
  if (hasSGLT2i && (hasInsulin || hasSU)) {
    const risk = hasInsulin || hasSU
    recs.push({
      id: 'drug-int-sglt2-hypo',
      severity: 'yellow',
      domain: 'Drug Interaction',
      title: `SGLT2i + ${risk.name} — Hypoglycemia Risk`,
      recommendation: `${hasSGLT2i.name} + ${risk.name}\nSGLT2i ลด glucose → เพิ่มเสี่ยง hypoglycemia\n${hasInsulin ? 'ลด Insulin basal 20–30%' : 'ลด SU dose 50%'} เมื่อเพิ่ม SGLT2i`,
      target: 'DTX 80–180 mg/dL',
      warning: 'Monitor DTX ถี่ขึ้นใน 2 สัปดาห์แรก',
    })
  }

  // 6. Digoxin + Hypokalemia
  if (hasDigoxin && v.K !== undefined && v.K < 3.5) {
    recs.push({
      id: 'drug-int-digoxin-hypoK',
      severity: 'red',
      domain: 'Drug Interaction',
      title: `Digoxin Toxicity Risk (K = ${v.K} mEq/L)`,
      recommendation: `Digoxin + K ต่ำ (K = ${v.K} mEq/L)\nK ต่ำ เพิ่ม sensitivity ต่อ digoxin → toxic\nแก้ K ก่อน: target K ≥3.5 mEq/L\nEKG monitoring + ตรวจ digoxin level`,
      target: 'K ≥3.5 mEq/L เสมอเมื่อได้ Digoxin',
      warning: 'Digoxin toxicity: nausea, bradycardia, visual changes, arrhythmia',
    })
  }

  return recs
}

// ---- summary helpers used in patient list ----
export function hasCritical(patient) {
  return getRecommendations(patient).some((r) => r.severity === 'critical')
}

export function hasAbnormal(patient) {
  return getRecommendations(patient).some(
    (r) => r.severity === 'critical' || r.severity === 'red' || r.severity === 'yellow'
  )
}
