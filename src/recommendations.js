import { getLatestLabEntry, parseLabDate, isLabOutdated } from './storage'

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
  const outdated = isLabOutdated(labEntry.date)

  const recs = []

  // Critical alerts first
  recs.push(...getCriticalAlerts(v))

  // eGFR trend (Quick Mode explicit + Record Mode lab history)
  recs.push(...getEgfrTrendRecs(patient, v, meds))

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
  let cur = parseFloat(v.eGFR)
  let prev = null
  let months = null

  // 1) Quick Mode explicit values
  if (v.eGFR_prev != null && v.eGFR_prev_months != null) {
    prev = parseFloat(v.eGFR_prev)
    months = parseFloat(v.eGFR_prev_months)
  } else if (patient.labs && patient.labs.length >= 2) {
    // 2) Record Mode: find most recent previous lab with eGFR (before current labEntry date)
    const sorted = [...patient.labs].sort((a, b) => {
      const da = parseLabDate(a.date) || new Date(0)
      const db = parseLabDate(b.date) || new Date(0)
      return db - da
    })
    const curEntry = sorted[0]
    const prevEntry = sorted.slice(1).find(l => l.values?.eGFR != null)
    if (prevEntry) {
      prev = parseFloat(prevEntry.values.eGFR)
      const dCur = parseLabDate(curEntry.date)
      const dPrev = parseLabDate(prevEntry.date)
      if (dCur && dPrev) {
        months = (dCur - dPrev) / (1000 * 60 * 60 * 24 * 30.44)
      }
    }
  }

  if (isNaN(cur) || prev == null || isNaN(prev) || prev <= 0 || months == null || isNaN(months) || months <= 0) {
    return recs
  }

  const diff = cur - prev
  const pct = (diff / prev) * 100
  const ratePerYear = (diff / months) * 12

  const hasACEiARB = findMed(meds, ['Losartan','Valsartan','Irbesartan','Telmisartan','Olmesartan','Candesartan','Enalapril','Ramipril','Lisinopril','Perindopril'])
  const hasSGLT2i = findMed(meds, ['Dapagliflozin','Empagliflozin','Canagliflozin','Forxiga','Jardiance','Invokana'])

  // Drop >30% with ACEi/ARB → red
  if (pct <= -30 && hasACEiARB) {
    recs.push({
      id: 'egfr-drop-arb', severity: 'red', domain: 'CKD Progression',
      title: `eGFR drop ${pct.toFixed(0)}% หลังเริ่ม ACEi/ARB`,
      recommendation: `eGFR ลด ${prev.toFixed(0)} → ${cur.toFixed(0)} mL/min ใน ${months.toFixed(1)} เดือน (−${Math.abs(pct).toFixed(0)}%, rate ${ratePerYear.toFixed(0)} mL/min/ปี)\nพิจารณา **ลดหรือหยุด ${hasACEiARB.name}** + หา renal artery stenosis (Doppler renal artery) + ตรวจ K/Cr ซ้ำ 1-2 สัปดาห์`,
      target: 'eGFR drop <30% หลังเริ่ม RAS inhibitor',
      warning: 'ถ้ามี bilateral renal artery stenosis → ห้ามใช้ ACEi/ARB',
    })
  } else if (pct <= -30 && hasSGLT2i) {
    // Drop >30% with SGLT2i → yellow (can be hemodynamic)
    recs.push({
      id: 'egfr-drop-sglt2', severity: 'yellow', domain: 'CKD Progression',
      title: `eGFR drop ${pct.toFixed(0)}% หลังเริ่ม SGLT2i`,
      recommendation: `eGFR ลด ${prev.toFixed(0)} → ${cur.toFixed(0)} mL/min ใน ${months.toFixed(1)} เดือน\nอาจเป็น hemodynamic effect ของ ${hasSGLT2i.name} (ช่วง 2-4 สัปดาห์แรก) — **recheck eGFR ใน 2-4 สัปดาห์** ก่อนปรับยา`,
      target: 'eGFR stable หลัง initial dip',
      warning: 'ถ้า drop ต่อเนื่อง → หยุด SGLT2i + หาสาเหตุอื่น',
    })
  } else if (pct <= -30) {
    recs.push({
      id: 'egfr-drop', severity: 'red', domain: 'CKD Progression',
      title: `eGFR drop ${pct.toFixed(0)}%`,
      recommendation: `eGFR ลด ${prev.toFixed(0)} → ${cur.toFixed(0)} mL/min ใน ${months.toFixed(1)} เดือน\nหา acute cause: dehydration, NSAIDs, contrast, obstruction, infection — recheck Cr/eGFR 1-2 สัปดาห์`,
      target: 'eGFR stable',
      warning: 'Acute kidney injury workup',
    })
  }

  // Rapid progression: rate < -5 mL/min/year (not covered by >30% drop)
  if (ratePerYear <= -5 && pct > -30) {
    recs.push({
      id: 'egfr-rapid', severity: 'yellow', domain: 'CKD Progression',
      title: `Rapid eGFR decline (${ratePerYear.toFixed(1)} mL/min/ปี)`,
      recommendation: `Rate of decline เร็วกว่าเป้า (>5 mL/min/ปี)\nเช็ค: BP control, proteinuria (UACR), DM control, NSAID exposure, renoprotection (ACEi/ARB + SGLT2i + max tolerated dose)`,
      target: 'Rate of decline <5 mL/min/ปี',
      warning: 'พิจารณา renoprotection ladder ตาม KDIGO 2024',
    })
  } else if (ratePerYear >= -2 && pct > -10) {
    recs.push({
      id: 'egfr-stable', severity: 'green', domain: 'CKD Progression',
      title: `eGFR stable (${ratePerYear.toFixed(1)} mL/min/ปี)`,
      recommendation: `Rate of decline ${ratePerYear.toFixed(1)} mL/min/ปี — อยู่ในเป้า`,
      target: 'Rate of decline <5 mL/min/ปี',
    })
  }

  return recs
}

// ---- helpers ----
function findMed(meds, keywords) {
  return meds.find(m =>
    keywords.some(k => m.name.toLowerCase().includes(k.toLowerCase()))
  )
}

function hasAllergy(allergies, keywords) {
  return allergies.some(a =>
    keywords.some(k => a.toLowerCase().includes(k.toLowerCase()))
  )
}

// ---- critical alerts ----
function getCriticalAlerts(v) {
  const recs = []

  if (v.K !== undefined && v.K >= 6.5)
    recs.push({
      id: 'crit-hyperK', severity: 'critical', domain: 'Electrolytes',
      title: 'URGENT: Hyperkalemia วิกฤต',
      recommendation: `K = ${v.K} mEq/L\n• EKG ทันที\n• IV Calcium gluconate\n• Insulin 10 u + 50% glucose 50 mL IV\n• Sodium bicarbonate (ถ้า acidosis)\n• พิจารณา urgent HD`,
      target: 'K 3.5–5.5 mEq/L',
      warning: 'ห้ามรอ — ต้องรักษาเร่งด่วน เสี่ยง fatal arrhythmia',
    })

  if (v.K !== undefined && v.K <= 2.5)
    recs.push({
      id: 'crit-hypoK', severity: 'critical', domain: 'Electrolytes',
      title: 'URGENT: Severe hypokalemia',
      recommendation: `K = ${v.K} mEq/L\n• IV K replacement\n• EKG monitoring\n• ตรวจสอบยาที่อาจทำให้ K ต่ำ`,
      target: 'K 3.5–5.5 mEq/L',
      warning: 'เสี่ยง cardiac arrhythmia',
    })

  if (v.Ca !== undefined && v.Ca >= 12.0)
    recs.push({
      id: 'crit-hyperCa', severity: 'critical', domain: 'CKD-MBD',
      title: 'URGENT: Severe hypercalcemia',
      recommendation: `Ca = ${v.Ca} mg/dL\n• หยุด Calcium-based binder ทันที\n• หยุด Vitamin D\n• IV saline hydration\n• พิจารณา low-Ca dialysate`,
      target: 'Ca 8.4–10.2 mg/dL',
      warning: 'เสี่ยง cardiac arrhythmia, vascular calcification',
    })

  if (v.Ca !== undefined && v.Ca <= 6.0)
    recs.push({
      id: 'crit-hypoCa', severity: 'critical', domain: 'CKD-MBD',
      title: 'URGENT: Severe hypocalcemia',
      recommendation: `Ca = ${v.Ca} mg/dL\n• IV Calcium gluconate ทันที\n• EKG monitoring`,
      target: 'Ca 8.4–10.2 mg/dL',
      warning: 'เสี่ยง tetany, laryngospasm, cardiac arrhythmia',
    })

  if (v.Hb !== undefined && v.Hb <= 5.0)
    recs.push({
      id: 'crit-anemia', severity: 'critical', domain: 'Anemia',
      title: 'URGENT: Severe anemia',
      recommendation: `Hb = ${v.Hb} g/dL\n• พิจารณา blood transfusion\n• ตรวจหาสาเหตุ bleeding\n• หยุด EPO ชั่วคราว ถ้า aplasia`,
      target: 'Hb 10–11.5 g/dL',
      warning: 'Hb ต่ำมาก — ต้องรักษาเร่งด่วน',
    })

  if (v.Na !== undefined && v.Na <= 120)
    recs.push({
      id: 'crit-hypoNa', severity: 'critical', domain: 'Electrolytes',
      title: 'URGENT: Severe hyponatremia',
      recommendation: `Na = ${v.Na} mEq/L\n• แก้ไข Na อย่างช้า ๆ ไม่เกิน 8–10 mEq/L/day\n• ปรึกษาทีมเพื่อพิจารณา hypertonic saline`,
      target: 'Na 135–145 mEq/L',
      warning: 'เสี่ยง cerebral edema ถ้าแก้ Na เร็วเกิน',
    })

  if (v.Na !== undefined && v.Na >= 160)
    recs.push({
      id: 'crit-hyperNa', severity: 'critical', domain: 'Electrolytes',
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
  const epo = findMed(meds, ['recormon', 'eprex', 'aranesp', 'cera', 'mircera', 'epo', 'darbepoetin', 'epoetin'])
  const ironAllergy = hasAllergy(allergies, ['venofer', 'iron sucrose'])
  const ironProduct = ironAllergy ? 'Ferinject (FCM) ⚠️ แพ้ Venofer' : 'Venofer (Iron sucrose)'

  // --- EPO by Hb ---
  if (v.Hb !== undefined && v.Hb > 5.0) {
    if (v.Hb < 10.0) {
      const dose = epo
        ? `เพิ่ม ${epo.name} 15–30%\nDose ปัจจุบัน: ${epo.dose} ${epo.frequency || ''}`
        : 'เริ่ม EPO (ถ้ายังไม่ได้) — ปรึกษา dose เริ่มต้น'
      recs.push({
        id: 'epo-low', severity: 'yellow', domain: 'Anemia',
        title: 'Hb ต่ำกว่าเป้า — เพิ่ม EPO',
        recommendation: `Hb = ${v.Hb} g/dL\n${dose}\nตรวจสอบ iron status ก่อนปรับ EPO`,
        target: 'Hb 10–11.5 g/dL',
        warning: 'ระวัง HTN, vascular access thrombosis ถ้าเพิ่ม EPO เร็วเกิน',
      })
    } else if (v.Hb <= 11.5) {
      recs.push({
        id: 'epo-ok', severity: 'green', domain: 'Anemia',
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
        id: 'epo-high', severity: 'yellow', domain: 'Anemia',
        title: 'Hb สูงกว่าเป้า — ลด EPO',
        recommendation: `Hb = ${v.Hb} g/dL\n${dose}`,
        target: 'Hb 10–11.5 g/dL',
        warning: 'ระวัง HTN, stroke, vascular thrombosis',
      })
    } else {
      const restart = epo ? `Restart ${epo.name} 50% ของ dose เดิม (${epo.dose}) เมื่อ Hb ลงมา 10.6–12 g/dL` : ''
      recs.push({
        id: 'epo-stop', severity: 'red', domain: 'Anemia',
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
        id: 'iron-stop', severity: 'yellow', domain: 'Anemia',
        title: 'Iron สูง — หยุด IV Iron',
        recommendation: `Ferritin = ${fer ?? '—'} ng/mL, TSAT = ${tsat ?? '—'}%\nหยุด IV Iron จนกว่า Ferritin <500 และ TSAT <30%`,
        target: 'Ferritin 200–500 ng/mL, TSAT 20–30%',
        warning: 'Iron overload เสี่ยง oxidative stress',
      })
    } else if (tsat !== undefined && tsat < 20 && (fer === undefined || fer < 200)) {
      recs.push({
        id: 'iron-def', severity: 'red', domain: 'Anemia',
        title: 'Iron Deficiency — IV Iron เร่งด่วน',
        recommendation: `TSAT = ${tsat ?? '—'}%, Ferritin = ${fer ?? '—'} ng/mL\n${ironProduct} 100 mg IV q 1 week × 10 doses`,
        target: 'Ferritin 200–500 ng/mL, TSAT 20–30%',
        warning: ironAllergy ? '⚠️ แพ้ iron sucrose — ใช้ Ferinject แทน\nระวัง anaphylaxis' : 'ระวัง anaphylaxis (โดยเฉพาะ Iron dextran)',
      })
    } else if (tsat !== undefined && tsat < 30 && (fer === undefined || fer < 500)) {
      const freq = (tsat >= 20 && fer !== undefined && fer >= 200) ? 'q 2 weeks' : 'q 1 week'
      recs.push({
        id: 'iron-low', severity: 'yellow', domain: 'Anemia',
        title: 'Iron ต่ำกว่าเป้า — เพิ่ม IV Iron',
        recommendation: `TSAT = ${tsat ?? '—'}%, Ferritin = ${fer ?? '—'} ng/mL\n${ironProduct} 100 mg IV ${freq} × 10 doses`,
        target: 'Ferritin 200–500 ng/mL, TSAT 20–30%',
        warning: ironAllergy ? '⚠️ แพ้ iron sucrose — ใช้ Ferinject' : '—',
      })
    } else if (tsat !== undefined && tsat >= 30 && tsat < 40 && fer !== undefined && fer < 800) {
      recs.push({
        id: 'iron-borderline', severity: 'yellow', domain: 'Anemia',
        title: 'TSAT ค่อนข้างสูง — ลด frequency',
        recommendation: `TSAT = ${tsat}%, Ferritin = ${fer ?? '—'} ng/mL\n${ironProduct} 100 mg IV q 4 weeks`,
        target: 'Ferritin 200–500 ng/mL, TSAT 20–30%',
        warning: '—',
      })
    } else {
      recs.push({
        id: 'iron-ok', severity: 'green', domain: 'Anemia',
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
        id: 'po4-high', severity: 'yellow', domain: 'CKD-MBD',
        title: 'Phosphate สูง — เพิ่ม binder + ควบ diet',
        recommendation: `PO4 = ${v.PO4} mg/dL\n• เพิ่ม phosphate binder (CaCO3 / Sevelamer / Lanthanum)\n• จำกัด dietary phosphate: หลีกเลี่ยง processed food, นม, cheese, น้ำอัดลม`,
        target: 'PO4 3.5–5.5 mg/dL',
        warning: 'ถ้าได้ CaCO3 ร่วมกับ Vitamin D → ระวัง hypercalcemia',
      })
    else if (v.PO4 >= 3.5)
      recs.push({
        id: 'po4-ok', severity: 'green', domain: 'CKD-MBD',
        title: 'Phosphate อยู่ในเป้าหมาย',
        recommendation: `PO4 = ${v.PO4} mg/dL`,
        target: 'PO4 3.5–5.5 mg/dL', warning: '—',
      })
    else
      recs.push({
        id: 'po4-low', severity: 'yellow', domain: 'CKD-MBD',
        title: 'Phosphate ต่ำ — ลด binder',
        recommendation: `PO4 = ${v.PO4} mg/dL\nพิจารณาลด phosphate binder`,
        target: 'PO4 3.5–5.5 mg/dL', warning: '—',
      })
  }

  if (v.Ca !== undefined) {
    if (v.Ca > 10.2)
      recs.push({
        id: 'ca-high', severity: 'red', domain: 'CKD-MBD',
        title: 'Calcium สูง — ลด/หยุด CaCO3, ลด Vitamin D',
        recommendation: `Ca = ${v.Ca} mg/dL\n• ลด/หยุด CaCO3\n• ลดขนาด Vitamin D\n• พิจารณาลด Ca ใน dialysate`,
        target: 'Ca 8.4–10.2 mg/dL',
        warning: 'Hypercalcemia + high PO4 → vascular calcification',
      })
    else if (v.Ca >= 8.4)
      recs.push({
        id: 'ca-ok', severity: 'green', domain: 'CKD-MBD',
        title: 'Calcium อยู่ในเป้าหมาย',
        recommendation: `Ca = ${v.Ca} mg/dL`,
        target: 'Ca 8.4–10.2 mg/dL', warning: '—',
      })
    else
      recs.push({
        id: 'ca-low', severity: 'yellow', domain: 'CKD-MBD',
        title: 'Calcium ต่ำ — เพิ่ม CaCO3',
        recommendation: `Ca = ${v.Ca} mg/dL\nเพิ่ม CaCO3 หรือ Ca supplement`,
        target: 'Ca 8.4–10.2 mg/dL',
        warning: 'Recheck Ca ใน 2 สัปดาห์หลังปรับยา',
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
        id: 'pth-high', severity: 'yellow', domain: 'CKD-MBD',
        title: 'iPTH สูง — เพิ่ม/เริ่ม Vitamin D',
        recommendation: `iPTH = ${pth} pg/mL\n${vitDRec}`,
        target: 'iPTH 150–300 pg/mL',
        warning: 'Recheck Ca ใน 2 สัปดาห์หลังเพิ่ม Vitamin D',
      })
    } else if (pth >= 200) {
      recs.push({
        id: 'pth-ok', severity: 'green', domain: 'CKD-MBD',
        title: 'iPTH อยู่ในเป้าหมาย',
        recommendation: `iPTH = ${pth} pg/mL — คงขนาด Vitamin D เดิม ≥3 เดือน`,
        target: 'iPTH 150–300 pg/mL', warning: '—',
      })
    } else if (pth >= 150) {
      const dose = vitD ? `ลด ${vitD.name} 50% จาก ${vitD.dose} นาน 2 เดือน` : 'iPTH ค่อนข้างต่ำ — ติดตาม'
      recs.push({
        id: 'pth-low-border', severity: 'yellow', domain: 'CKD-MBD',
        title: 'iPTH ค่อนข้างต่ำ — ลด Vitamin D',
        recommendation: `iPTH = ${pth} pg/mL\n${dose}`,
        target: 'iPTH 150–300 pg/mL', warning: '—',
      })
    } else {
      const dose = vitD ? `หยุด ${vitD.name} 1 เดือน` : 'iPTH ต่ำมาก — ติดตาม'
      recs.push({
        id: 'pth-low', severity: 'red', domain: 'CKD-MBD',
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
        id: 'ktv-low', severity: 'red', domain: 'Dialysis Adequacy',
        title: 'Kt/V ต่ำ — Dialysis ไม่เพียงพอ',
        recommendation: `Kt/V = ${v.KtV} (เป้า ≥1.2 สำหรับ 3×/wk)\nตรวจสอบ:\n• เวลา HD ≥4 ชม.\n• BFR ≥250 mL/min\n• Vascular access flow\n• Dialyzer size`,
        target: 'Kt/V ≥1.2 (3×/wk), ≥1.8 (2×/wk)',
        warning: 'Inadequate dialysis เสี่ยง uremic complications',
      })
    else
      recs.push({
        id: 'ktv-ok', severity: 'green', domain: 'Dialysis Adequacy',
        title: 'Kt/V อยู่ในเป้าหมาย',
        recommendation: `Kt/V = ${v.KtV}`,
        target: 'Kt/V ≥1.2 (3×/wk)', warning: '—',
      })
  }

  if (v.URR !== undefined) {
    if (v.URR < 65)
      recs.push({
        id: 'urr-low', severity: 'yellow', domain: 'Dialysis Adequacy',
        title: 'URR ต่ำ — ตรวจสอบ prescription',
        recommendation: `URR = ${v.URR}% (เป้า ≥65%)\nตรวจสอบ HD prescription และ vascular access`,
        target: 'URR ≥65%', warning: '—',
      })
    else
      recs.push({
        id: 'urr-ok', severity: 'green', domain: 'Dialysis Adequacy',
        title: 'URR อยู่ในเป้าหมาย',
        recommendation: `URR = ${v.URR}%`,
        target: 'URR ≥65%', warning: '—',
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
        id: 'albumin-low', severity: 'red', domain: 'Nutrition',
        title: 'Albumin ต่ำ — Malnutrition',
        recommendation: `Albumin = ${v.Albumin} g/dL\n• Nutritional assessment\n• ${proteinRec}\n• พิจารณา nutritional supplement`,
        target: 'Albumin ≥3.5 g/dL',
        warning: 'Hypoalbuminemia เพิ่ม mortality ใน HD patients',
      })
    } else {
      recs.push({
        id: 'albumin-ok', severity: 'green', domain: 'Nutrition',
        title: 'Albumin อยู่ในเป้าหมาย',
        recommendation: `Albumin = ${v.Albumin} g/dL`,
        target: 'Albumin ≥3.5 g/dL', warning: '—',
      })
    }
  }

  if (v.nPCR !== undefined) {
    if (v.nPCR < 0.8)
      recs.push({
        id: 'npcr-low', severity: 'yellow', domain: 'Nutrition',
        title: 'nPCR ต่ำ — Protein intake ไม่เพียงพอ',
        recommendation: `nPCR = ${v.nPCR} (เป้า 1.0–1.2)\nแนะนำเพิ่ม protein intake`,
        target: 'nPCR 1.0–1.2', warning: '—',
      })
    else
      recs.push({
        id: 'npcr-ok', severity: 'green', domain: 'Nutrition',
        title: 'nPCR อยู่ในเป้าหมาย',
        recommendation: `nPCR = ${v.nPCR}`,
        target: 'nPCR 1.0–1.2', warning: '—',
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
        id: 'k-high', severity: 'yellow', domain: 'Electrolytes',
        title: 'Potassium สูง — จำกัด K ในอาหาร',
        recommendation: `K = ${v.K} mEq/L\n• จำกัด dietary K (หลีกเลี่ยงกล้วย, ส้ม, มะเขือเทศ)\n• ทบทวน ACEi/ARB/MRA\n• พิจารณา K binder (Patiromer, ZS-9)`,
        target: 'K 3.5–5.5 mEq/L',
        warning: 'K >6.0 ต้องรีบรักษา',
      })
    else if (v.K < 3.5)
      recs.push({
        id: 'k-low', severity: 'yellow', domain: 'Electrolytes',
        title: 'Potassium ต่ำ',
        recommendation: `K = ${v.K} mEq/L\n• ทบทวนยา diuretic\n• K supplement\n• เพิ่ม K ในอาหาร`,
        target: 'K 3.5–5.5 mEq/L',
        warning: 'ระวัง cardiac arrhythmia',
      })
    else
      recs.push({
        id: 'k-ok', severity: 'green', domain: 'Electrolytes',
        title: 'Potassium อยู่ในเป้าหมาย',
        recommendation: `K = ${v.K} mEq/L`,
        target: 'K 3.5–5.5 mEq/L', warning: '—',
      })
  }

  if (v.HCO3 !== undefined) {
    if (v.HCO3 < 22)
      recs.push({
        id: 'hco3-low', severity: 'yellow', domain: 'Electrolytes',
        title: 'Metabolic Acidosis — เพิ่ม NaHCO3',
        recommendation: `HCO3 = ${v.HCO3} mEq/L\n• เพิ่ม NaHCO3 supplement\n• พิจารณาเพิ่ม dialysate bicarbonate`,
        target: 'HCO3 ≥22 mEq/L',
        warning: 'Metabolic acidosis เร่ง bone disease และ muscle wasting',
      })
    else
      recs.push({
        id: 'hco3-ok', severity: 'green', domain: 'Electrolytes',
        title: 'Bicarbonate อยู่ในเป้าหมาย',
        recommendation: `HCO3 = ${v.HCO3} mEq/L`,
        target: 'HCO3 ≥22 mEq/L', warning: '—',
      })
  }

  return recs
}

// ---- infection screening ----
function getInfectionRecs(v, labDate) {
  const recs = []

  if (v.HBsAb !== undefined) {
    if (v.HBsAb === 'Neg')
      recs.push({
        id: 'hbsab-neg', severity: 'yellow', domain: 'Infection',
        title: 'HBsAb ลบ — ควรฉีด HBV vaccine',
        recommendation: 'HBsAb Negative\nแนะนำ HBV vaccination series\n(double dose สำหรับผู้ป่วย HD: 40 mcg ×3 doses)',
        target: 'HBsAb Positive (protective)',
        warning: 'HD patients มีความเสี่ยง HBV สูง',
      })
  }

  if (v['Anti-HCV'] === 'Pos')
    recs.push({
      id: 'hcv-pos', severity: 'yellow', domain: 'Infection',
      title: 'Anti-HCV Positive — Refer Hepatologist',
      recommendation: 'Anti-HCV Positive\n• ตรวจ HCV RNA ยืนยัน active infection\n• Refer Hepatologist พิจารณา DAA treatment',
      target: 'HCV eradication',
      warning: 'DAA ปัจจุบัน safe ใน CKD/HD — ควรรักษา',
    })

  return recs
}

// ---- summary helpers used in patient list ----
export function hasCritical(patient) {
  return getRecommendations(patient).some(r => r.severity === 'critical')
}

export function hasAbnormal(patient) {
  return getRecommendations(patient).some(
    r => r.severity === 'critical' || r.severity === 'red' || r.severity === 'yellow'
  )
}
