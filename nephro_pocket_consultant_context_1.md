# Nephrology Pocket Consultant — Project Context

## สรุปโปรเจค
Web app สำหรับ nephrologist ไทย (ใช้คนเดียว) ช่วยราวคนไข้ HD ประจำเดือนให้เร็วขึ้น กรอก lab + ยา + โรค → ได้ recommendation อัตโนมัติตาม CPG → คุยกับ AI ต่อได้

---

## ผู้ใช้
- Nephrologist คนเดียว (อายุรแพทย์โรคไต)
- ดูคนไข้ HD หลายศูนย์ แต่เก็บข้อมูลเฉพาะ รพ.ดอนตูม
- ศูนย์อื่นใช้ quick mode กรอก lab ดู recommendation แล้วจบ ไม่เก็บข้อมูล
- ใช้บนมือถือข้างเตียง HD

## ภาษา
- ไทยเป็นหลัก
- ชื่อยา + ศัพท์การแพทย์เฉพาะทางเป็นอังกฤษ
- เช่น "คนไข้ Hb ต่ำ ได้ EPO 4000 u ควรเพิ่มเป็นเท่าไหร่"

---

## Mode การใช้งาน

### Quick Mode (ไม่บันทึก)
- ไม่ใส่ชื่อ/HN → กรอก lab + ยา + โรค → ดู recommendation → คุย AI → ปิดแล้วหายไป
- ใช้สำหรับคนไข้ศูนย์อื่นหรือ consult เร็ว ๆ

### Patient Record Mode (บันทึก)
- ใส่ชื่อ/HN (อะไรก็ได้ ชื่อจริง/ชื่อเล่น/HN มั่วก่อน/initials)
- ข้อมูลเก็บใน persistent storage (browser)
- เปิดมาทีหลังข้อมูลยังอยู่
- แก้ไข/อัปเดต/ลบได้ตลอด ไม่มีอะไรล็อค

---

## Patient List

### ฟีเจอร์
- เพิ่ม/ลบคนไข้ได้
- เรียงตามชื่อ หรือ HN
- แก้ชื่อ/HN ทีหลังได้
- ลบคนไข้ที่เสียชีวิต/ย้ายศูนย์ได้
- ไม่ต้องแยกศูนย์ (ตัดออกแล้ว)

### ข้อมูลที่แสดงใน list
- ชื่อ/HN
- lab ล่าสุดเมื่อไหร่
- flag ถ้ามี lab ผิดปกติ

---

## ข้อมูลคนไข้ (ทุกช่องไม่บังคับ แก้ไขได้ตลอด)

### ข้อมูลพื้นฐาน
- ชื่อ / HN (อะไรก็ได้)
- น้ำหนัก (kg) + ส่วนสูง (cm) — ใช้คำนวณ dose ยาตาม weight, BMI
- Dry weight (kg) — เปลี่ยนบ่อย
- วันเริ่ม HD (ยืดหยุ่น: วันเป๊ะ / เดือน+ปี / ไม่ใส่)
- สาเหตุ ESRD (เช่น DKD / CGN / PKD / Obstructive / Unknown — กดเลือก + พิมพ์เพิ่ม)

### Vascular Access
- ชนิด: AVF / AVG / Perm cath / DLC (กดเลือก)
- วันที่สร้าง (ยืดหยุ่น)

### โรคประจำตัว
- กดเลือกจาก common list:
  - DM type 1, DM type 2
  - Hypertension
  - CAD (s/p PCI, s/p CABG)
  - CVA (ischemic, hemorrhagic)
  - Heart failure (HFrEF, HFpEF)
  - AF
  - Dyslipidemia
  - Gout
  - SLE
  - PKD
  - Hepatitis B, Hepatitis C, HIV
  - อื่น ๆ
- พิมพ์เพิ่มเองได้ (free text)
- ลบได้
- เพิ่มวันที่เริ่มโรคได้ (ไม่บังคับ) — สำคัญสำหรับ DAPT duration เป็นต้น

### Allergy ยา
- พิมพ์ชื่อยาที่แพ้ (free text)
- AI จะไม่แนะนำยาที่แพ้ + แจ้งเตือนในแชท

### Lab
- กรอกแค่ที่มี ไม่ต้องครบ
- กรอกตัวไหน → ได้ recommendation ตัวนั้นทันที
- วันที่ยืดหยุ่น: วันเป๊ะ / เดือน+ปี (เช่น "มี.ค. 68") / ไม่ใส่
- เก็บ lab ย้อนหลังได้ (เห็น trend)
- Lab เก่า > 3 เดือน → แสดงป้ายเตือน "lab outdated"

#### Lab items (จัดเป็นกลุ่ม กด expand เฉพาะกลุ่มที่จะกรอก):

**กลุ่ม Anemia:**
- Hb (g/dL)
- Hct (%)
- Ferritin (ng/mL)
- TSAT (%)
- Iron (mcg/dL)
- TIBC (mcg/dL)

**กลุ่ม Dialysis Adequacy:**
- Kt/V
- URR (%)
- BUN pre-HD (mg/dL)
- BUN post-HD (mg/dL)
- nPCR

**กลุ่ม Electrolytes & Kidney:**
- BUN (mg/dL)
- Creatinine (mg/dL)
- Na (mEq/L)
- K (mEq/L)
- Cl (mEq/L)
- HCO3 (mEq/L)

**กลุ่ม CKD-MBD:**
- Ca (mg/dL)
- PO4 (mg/dL)
- iPTH (pg/mL)
- 25-OH Vitamin D (ng/mL)
- ALP (U/L)

**กลุ่ม Nutrition:**
- Albumin (g/dL)
- nPCR (ซ้ำกับ adequacy)

**กลุ่ม Infection Screening:**
- HBsAg (Pos/Neg)
- HBsAb (Pos/Neg)
- Anti-HCV (Pos/Neg)
- Anti-HIV (Pos/Neg)

**กลุ่ม อื่น ๆ (ปีละครั้ง):**
- LDL (mg/dL)
- TG (mg/dL)
- HbA1C (%)
- AST / ALT
- Uric acid (mg/dL)

### ยา
- เพิ่มยา 2 วิธี:
  1. พิมพ์ autocomplete — พิมพ์ "amlo" → ขึ้น "Amlodipine" → กดเลือก
  2. (Phase 2) ถ่ายรูป doctor order → AI อ่าน → confirm + แก้ได้
- ทุกตัวยามีข้อมูล:
  - ชื่อยา
  - Dose + จำนวน (เช่น 0.25 mcg x 6 เม็ด)
  - เวลากิน (ac / pc / hs / หลัง HD / พร้อมอาหาร / อื่น ๆ)
- แก้ dose / เวลากิน / ลบ ได้ตลอด
- ฐานยา autocomplete ครอบคลุมทุกกลุ่ม (ไม่จำกัดแค่ยา HD):

**ยา HD หลัก:**
- EPO: Recormon, Eprex, Aranesp (darbepoetin), CERA (methoxy PEG-epoetin beta)
- IV Iron: Venofer (iron sucrose), Ferinject (FCM), Iron dextran
- Phosphate binders: CaCO3, Sevelamer, Lanthanum, Aluminium hydroxide
- Vitamin D: Alfacalcidol, Calcitriol, Ergocalciferol, Cholecalciferol
- Calcimimetics: Cinacalcet, Etelcalcetide
- Heparin, LMWH (Enoxaparin)
- Bicarbonate

**ยา Cardiovascular:**
- ACEi: Enalapril, Ramipril, Lisinopril, Perindopril
- ARB: Losartan, Valsartan, Irbesartan, Telmisartan, Olmesartan, Candesartan
- CCB: Amlodipine, Nifedipine, Diltiazem, Verapamil
- Beta-blocker: Atenolol, Metoprolol, Bisoprolol, Carvedilol, Propranolol
- Diuretics: Furosemide, HCTZ, Spironolactone
- Finerenone
- Hydralazine, Minoxidil, Prazosin, Doxazosin
- Antiplatelet: ASA, Clopidogrel, Ticagrelor, Prasugrel
- Anticoagulant: Warfarin, Rivaroxaban, Apixaban, Dabigatran
- Statin: Atorvastatin, Rosuvastatin, Simvastatin, Pravastatin
- Ezetimibe, Fibrate (Fenofibrate, Gemfibrozil)
- Nitrate: ISDN, ISMN
- Digoxin, Amiodarone

**ยา DM:**
- Insulin: RI, NPH, Glargine, Detemir, Degludec, Aspart, Lispro
- Metformin (ถ้า eGFR ยังพอ)
- SGLT2i: Dapagliflozin, Empagliflozin, Canagliflozin
- GLP-1 RA: Semaglutide, Liraglutide, Dulaglutide
- DPP4i: Linagliptin, Sitagliptin, Vildagliptin
- SU: Glipizide, Gliclazide
- TZD: Pioglitazone

**ยาอื่น ๆ:**
- PPI: Omeprazole, Esomeprazole, Pantoprazole
- H2 blocker: Ranitidine, Famotidine
- Allopurinol, Febuxostat
- Colchicine
- Gabapentin, Pregabalin
- Antidepressant: Sertraline, Fluoxetine, Escitalopram
- Paracetamol
- Antibiotics (common): Amoxicillin, Augmentin, Cephalexin, Ceftriaxone, Tazocin, Meropenem, Vancomycin, Ciprofloxacin, Levofloxacin
- Antifungal: Fluconazole
- อื่น ๆ (free text พิมพ์เพิ่มได้เสมอ)

---

## Output: Recommendation Engine

### หลักการ
- กรอก lab ตัวไหน → แสดง recommendation ตัวนั้นทันที
- ไม่ต้องกรอกครบถึงจะแสดง
- แสดง 3 ส่วน: (1) Recommendation (2) เป้าหมาย (3) ข้อระวัง

### Clinical Logic ตาม CPG

#### 1. Anemia Management (Thailand CPG 2021 + KDIGO 2026)

**EPO adjustment by Hb:**
- Hb <10.0 g/dL → เพิ่ม EPO dose 15-30% + คำนวณ dose ใหม่จาก dose ปัจจุบัน
- Hb 10.0-11.5 g/dL → คงขนาด EPO + ประเมิน iron status
- Hb 11.6-12.9 g/dL → ลด EPO dose 15-30%
- Hb ≥13.0 g/dL → หยุด EPO 1-2 สัปดาห์ → เมื่อ Hb 10.6-12 ให้ restart EPO 50% ของ dose เดิม
- เป้าหมาย: Hb 10-11.5 g/dL
- ข้อระวัง: HTN, vascular access thrombosis, stroke ถ้าเพิ่ม dose เร็วเกินไป

**IV Iron by TSAT + Ferritin:**
- Ferritin ≥800 ng/mL หรือ TSAT ≥40% → หยุด IV Iron
- TSAT 30-40% + Ferritin 500-800 → Iron IV 100 mg q 4 weeks x 10 doses
- TSAT 20-30% + Ferritin 200-500 → Iron IV 100 mg q 2 weeks x 10 doses
- TSAT <20% + Ferritin <200 → Iron IV 100 mg q 1 week x 10 doses
- เป้าหมาย: Ferritin 200-500 ng/mL, TSAT 20-30%
- ข้อระวัง: anaphylaxis (โดยเฉพาะ iron dextran), ถ้าแพ้ iron sucrose → เปลี่ยนเป็น FCM

**KDIGO 2026 update:**
- HD patients: เริ่ม IV iron เมื่อ Ferritin ≤500 + TSAT ≤30%
- ใช้ proactive approach เพื่อ maintain stable iron status
- HIF-PHI (เช่น roxadustat) เป็น alternative ถ้า ESA hyporesponsiveness หรือ ESA ไม่สะดวก

#### 2. CKD-MBD (MBD Flowchart + KDIGO 2017/2025)

**Vitamin D adjustment by iPTH:**
- เริ่ม Vitamin D เมื่อ: iPTH >300 pg/mL + PO4 <5.5 mg/dL + Ca <9.5 mg/dL → เพิ่มขนาด 25-50%
- iPTH 200-300 → คงขนาด Vitamin D นาน 3 เดือน
- iPTH 150-200 → ลดขนาด Vitamin D 50% นาน 2 เดือน
- iPTH <150 → หยุด Vitamin D 1 เดือน
- หลัง recheck iPTH:
  - iPTH <150 → หยุด Vitamin D 3 เดือน
  - iPTH 150-200 → ลด 25-50% หรือคงขนาดเดิมก่อนหน้า
  - iPTH 200-300 → คงขนาด ≥3 เดือน
  - iPTH >300 → ถ้าได้ Vitamin D อยู่ เพิ่ม 10-25% / ถ้ายังไม่ได้ ให้ 75% ของ dose เริ่มต้น
- เป้าหมาย: iPTH 150-300 pg/mL (หรือ 2-9x ULN ตาม KDIGO)
- ข้อระวัง: ถ้าเพิ่ม Vitamin D → ต้อง recheck Ca ใน 2 สัปดาห์, ระวัง hypercalcemia

**Phosphate management:**
- PO4 >5.5 mg/dL → เพิ่ม phosphate binder + dietary PO4 restriction
- เป้าหมาย: PO4 3.5-5.5 mg/dL (ตาม KDIGO: toward normal range)
- ข้อระวัง: CaCO3 → ระวัง hypercalcemia โดยเฉพาะถ้าได้ Vitamin D ร่วม

**Calcium:**
- Ca >10.2 mg/dL → ลด/หยุด CaCO3, ลด Vitamin D, ลด Ca ใน dialysate
- Ca <8.4 mg/dL → เพิ่ม CaCO3 หรือ Ca supplement
- เป้าหมาย: Ca 8.4-10.2 mg/dL
- ข้อระวัง: hypercalcemia + high PO4 → vascular calcification risk

#### 3. Dialysis Adequacy

**Kt/V:**
- Kt/V <1.2 (HD 3x/wk) หรือ <1.8 (HD 2x/wk) → inadequate
- URR <65% → inadequate
- แนะนำ: ตรวจสอบ HD prescription (เวลา ≥4 ชม., BFR ≥250), vascular access function, dialyzer size
- เป้าหมาย: Kt/V ≥1.2 (3x/wk) หรือ ≥1.8 (2x/wk), URR ≥65%
- ถ้าอยากคุยรายละเอียด → ใช้แชท AI

#### 4. Nutrition

**Albumin:**
- Albumin <3.5 g/dL → flag malnutrition → แนะนำ nutritional assessment, protein intake ≥1.0-1.2 g/kg/day
- เป้าหมาย: Albumin ≥3.5 g/dL

**nPCR:**
- nPCR <0.8 → inadequate protein intake
- เป้าหมาย: nPCR 1.0-1.2

#### 5. Electrolytes

**Potassium:**
- K >5.5 mEq/L → dietary K restriction, review meds (ACEi/ARB/MRA), ±K binder
- K >6.5 mEq/L → ⚠️ URGENT: EKG, Ca gluconate, insulin+glucose, urgent HD
- K <3.5 mEq/L → review diuretics, K supplement
- เป้าหมาย: K 3.5-5.5 mEq/L

**Bicarbonate:**
- HCO3 <22 mEq/L → metabolic acidosis → NaHCO3 supplement, adjust dialysate HCO3
- เป้าหมาย: HCO3 ≥22 mEq/L

#### 6. Infection Screening

- HBsAg/HBsAb/Anti-HCV → ถ้าผล > 6 เดือน → เตือน "ครบกำหนดเจาะใหม่"
- HBsAb negative → แนะนำ HBV vaccination
- Anti-HCV positive → แนะนำ refer Hepatologist for DAA treatment

#### 7. Lab วิกฤต (Critical Alert — สีแดง)

- K ≥6.5 mEq/L → "URGENT: Hyperkalemia วิกฤต — EKG ทันที + emergency treatment"
- K ≤2.5 mEq/L → "URGENT: Severe hypokalemia"
- Ca ≥12.0 mg/dL → "URGENT: Severe hypercalcemia"
- Ca ≤6.0 mg/dL → "URGENT: Severe hypocalcemia"
- Hb ≤5.0 g/dL → "URGENT: Severe anemia — พิจารณา transfusion"
- Na ≤120 mEq/L → "URGENT: Severe hyponatremia"
- Na ≥160 mEq/L → "URGENT: Severe hypernatremia"

---

## แชท AI (Claude API)

### System Prompt สำหรับ AI ในแชท:

```
คุณคือ Nephrology Clinical Consultant สำหรับ nephrologist ไทย

ข้อมูลคนไข้ที่มีอยู่:
{patient_data: โรคประจำตัว, allergy, lab ทั้งหมด+วันที่, ยาทั้งหมด+dose, vascular access, วันเริ่ม HD, สาเหตุ ESRD, น้ำหนัก, dry weight}

หลักการตอบ:
1. ตอบเป็นภาษาไทย ชื่อยาและศัพท์เฉพาะทางใช้อังกฤษ
2. อ้างอิง CPG: Thailand CPG Anemia 2021, KDIGO 2026 Anemia, KDIGO 2024 CKD, KDIGO 2017 MBD, AHA/ACC guidelines สำหรับ cardiovascular
3. คิด dose จริง จากข้อมูลยาปัจจุบันของคนไข้
4. บอกเป้าหมาย + ข้อระวัง + สิ่งที่ต้อง monitor หลังปรับยา
5. ถ้าคนไข้มี allergy → ห้ามแนะนำยาที่แพ้
6. ถ้า lab เก่า > 3 เดือน → เตือนว่าควรเจาะใหม่ก่อนปรับยา
7. ถ้ามียาที่มี duration จำกัดตาม guideline (เช่น DAPT) → เตือนเรื่อง duration
8. คุณเป็น clinical decision support — แพทย์ต้อง confirm ก่อนสั่งยาเสมอ
9. ดูคนไข้ให้ครอบทุกมุม: ไต + เบาหวาน + ความดัน + หัวใจ + drug interaction
10. ตอบสั้นกระชับ ไม่ต้องอธิบายยืดยาว เว้นแต่ถูกถามให้ขยาย
```

### ฟีเจอร์แชท
- AI รู้ข้อมูลคนไข้ทั้งหมดที่กรอกไว้ (ส่งเป็น context ทุกครั้ง)
- คุยไทยปนอังกฤษ
- ถามอะไรก็ได้ ไม่จำกัด domain
- Voice input ใช้ keyboard ไมค์มือถือได้ (ไม่ต้อง build เพิ่ม)

---

## Technical Specs

### Stack
- React (single-page app)
- Anthropic API (Claude) สำหรับแชท — model: claude-sonnet-4-20250514
- Persistent storage (Anthropic artifact storage API) สำหรับบันทึกคนไข้
- Mobile-first design (ใช้บนมือถือเป็นหลัก)

### Storage Schema

```json
{
  "patients": [
    {
      "id": "uuid",
      "name": "น.จ. หรือ ชื่อเล่น หรือ HN",
      "hn": "12345 (optional)",
      "weight_kg": 60,
      "height_cm": 165,
      "dry_weight_kg": 58,
      "hd_start_date": "2024-01 หรือ 2024-01-15",
      "esrd_cause": "DKD",
      "vascular_access": {
        "type": "AVF",
        "created_date": "2023-06"
      },
      "conditions": [
        { "name": "DM type 2", "since": "2015" },
        { "name": "HT", "since": "" },
        { "name": "CAD s/p PCI with DES", "since": "2024-06-15" }
      ],
      "allergies": ["Venofer", "Sulfa"],
      "medications": [
        {
          "name": "EPO (Recormon)",
          "dose": "4000 u",
          "frequency": "3x/wk",
          "timing": "หลัง HD",
          "note": ""
        },
        {
          "name": "Alfacalcidol",
          "dose": "0.25 mcg x 6 เม็ด",
          "frequency": "3x/wk",
          "timing": "หลัง HD",
          "note": ""
        },
        {
          "name": "Amlodipine",
          "dose": "10 mg",
          "frequency": "OD",
          "timing": "hs",
          "note": ""
        }
      ],
      "labs": [
        {
          "date": "2025-03",
          "values": {
            "Hb": 9.2,
            "Ferritin": 450,
            "TSAT": 25,
            "KtV": 1.3,
            "URR": 68,
            "Ca": 9.1,
            "PO4": 5.5,
            "iPTH": 450,
            "Albumin": 3.8,
            "K": 4.8,
            "HCO3": 20
          }
        }
      ],
      "created_at": "2025-04-14",
      "updated_at": "2025-04-14"
    }
  ]
}
```

### Persistent Storage API
```javascript
// เก็บข้อมูลคนไข้
await window.storage.set('patients', JSON.stringify(patients));

// ดึงข้อมูล
const result = await window.storage.get('patients');
const patients = result ? JSON.parse(result.value) : [];
```

---

## UI Design Principles

1. **Mobile-first** — ใช้บนมือถือข้างเตียง HD
2. **กรอกน้อยที่สุด** — ทุกช่องไม่บังคับ
3. **ไม่ดูน่ากลัว** — ไม่ใช่ form ยาว 30 ช่อง, ใช้ expandable sections
4. **Recommendation เด่นชัด** — เห็นปุ๊บรู้ปั๊บต้องทำอะไร
5. **สีสื่อความหมาย:**
   - 🔴 แดง = วิกฤต / FAIL / ต้องแก้ไขด่วน
   - 🟡 เหลือง = ควรปรับ
   - 🟢 เขียว = ปกติ / PASS
6. **ภาษาไทย** ทั้ง UI
7. **Disclaimer** แสดงชัดเจน: "Clinical decision support — แพทย์ต้อง confirm ก่อนสั่งยาเสมอ"

---

## ไม่ทำใน Phase 1

- ❌ ถ่ายรูป doctor order (OCR ลายมือ)
- ❌ ถ่ายรูป lab
- ❌ แยกศูนย์
- ❌ HD prescription (dialyzer, BFR, time, UF goal)
- ❌ Alert อัตโนมัติ DAPT duration (ใช้แชท AI แทน)
- ❌ Export รายงาน
- ❌ สิทธิ์การรักษา (สปสช./ประกันสังคม/ข้าราชการ)

---

## Build Order (แนะนำ)

### รอบ 1: โครงสร้าง
1. Patient list + CRUD (เพิ่ม/แก้/ลบ)
2. Patient detail page: ข้อมูลพื้นฐาน + โรค + allergy
3. Lab input (expandable groups) + บันทึก history
4. Medication input (autocomplete + dose + timing)
5. Persistent storage (save/load)

### รอบ 2: สมอง
6. Recommendation engine (ตาม CPG logic ข้างบน)
7. Critical lab alerts
8. แชท AI (Claude API + patient context)

### รอบ 3: Polish
9. Lab trend visualization
10. UX refinements
11. Disclaimer + about page
