# Nephrology Pocket Consultant — Project Context (Final Version)

## สรุปโปรเจค
Web app สำหรับ nephrologist ไทย (ใช้คนเดียว) ช่วยราวคนไข้ HD ประจำเดือน + ดูคนไข้ CKD clinic (DM/HT) ให้เร็วขึ้น กรอก lab + ยา + โรค → ได้ recommendation อัตโนมัติตาม CPG → คุยกับ AI ต่อได้

---

## ผู้ใช้
- Nephrologist คนเดียว (อายุรแพทย์โรคไต)
- ดูคนไข้ HD + CKD clinic (DM/HT/CKD ทุก stage)
- ใช้บนมือถือข้างเตียง HD / ในห้องตรวจ CKD clinic
- ส่วนใหญ่ใช้ quick mode (ไม่เก็บข้อมูล) กรอก lab ดู recommendation แล้วจบ

## ภาษา
- ไทยเป็นหลัก
- ชื่อยา + ศัพท์การแพทย์เฉพาะทางเป็นอังกฤษ
- เช่น "คนไข้ Hb ต่ำ ได้ EPO 4000 u ควรเพิ่มเป็นเท่าไหร่"

---

## Mode การใช้งาน

### Quick Mode (ไม่บันทึก) — ใช้บ่อยที่สุด
- ไม่ใส่ชื่อ/HN → กรอก lab + ยา + โรค → ดู recommendation → คุย AI → ปิดแล้วหายไป
- ใช้สำหรับคนไข้ทุกศูนย์ / consult เร็ว ๆ

### Patient Record Mode (บันทึก)
- ใส่ชื่อ/HN (อะไรก็ได้ ชื่อจริง/ชื่อเล่น/HN มั่วก่อน/initials)
- ข้อมูลเก็บใน persistent storage (browser)
- เปิดมาทีหลังข้อมูลยังอยู่
- แก้ไข/อัปเดต/ลบได้ตลอด ไม่มีอะไรล็อค
- เก็บเฉพาะคนไข้ รพ.ดอนตูม

---

## Patient List

### ฟีเจอร์
- เพิ่ม/ลบคนไข้ได้
- เรียงตามชื่อ หรือ HN
- แก้ชื่อ/HN ทีหลังได้
- ลบคนไข้ที่เสียชีวิต/ย้ายศูนย์ได้
- ไม่ต้องแยกศูนย์

### ข้อมูลที่แสดงใน list
- ชื่อ/HN
- สถานะ (CKD stage / HD)
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

### สถานะคนไข้ (กดเลือก)
- CKD ยังไม่ล้างไต → ใส่ eGFR + stage (app คำนวณ stage จาก eGFR ให้อัตโนมัติ)
- HD (ฟอกเลือด)
- PD (ล้างไตทางหน้าท้อง)
- KT (ปลูกถ่ายไตแล้ว)

ถ้าเลือก CKD → recommendation เน้น renoprotection + ปรับยา DM/HT ตาม eGFR
ถ้าเลือก HD → recommendation เน้น EPO + Iron + MBD + Kt/V + dialysis adequacy
สถานะเปลี่ยนได้ตลอด (เช่น CKD → HD เมื่อเริ่มล้างไต)

### Vascular Access (สำหรับ HD)
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
- เก็บ lab ย้อนหลังได้ (กรอกหลายชุดทีเดียวได้ เช่น eGFR ย้อนหลัง 2 ปี กรอกทีละชุด กดเพิ่ม กดเพิ่ม)
- Lab เก่า > 3 เดือน → แสดงป้ายเตือน "lab outdated"
- eGFR กรอกใหม่ → app เทียบกับ eGFR เก่าอัตโนมัติ คำนวณ % เปลี่ยนแปลง + rate of decline ต่อปี

#### Lab items (จัดเป็นกลุ่ม กด expand เฉพาะกลุ่มที่จะกรอก — ไม่ดูน่ากลัว):

**กลุ่ม Anemia:**
- Hb (g/dL)
- Hct (%)
- Ferritin (ng/mL)
- TSAT (%)
- Iron (mcg/dL)
- TIBC (mcg/dL)

**กลุ่ม Dialysis Adequacy (สำหรับ HD):**
- Kt/V
- URR (%)
- BUN pre-HD (mg/dL)
- BUN post-HD (mg/dL)
- nPCR

**กลุ่ม Electrolytes & Kidney:**
- BUN (mg/dL)
- Creatinine (mg/dL)
- eGFR (mL/min/1.73m2)
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

**กลุ่ม DM:**
- FBS / DTX (mg/dL)
- HbA1C (%)
- UACR (mg/g)

**กลุ่ม Infection Screening:**
- HBsAg (Pos/Neg)
- HBsAb (Pos/Neg)
- Anti-HCV (Pos/Neg)
- Anti-HIV (Pos/Neg)

**กลุ่ม อื่น ๆ:**
- LDL (mg/dL)
- TG (mg/dL)
- AST / ALT
- Uric acid (mg/dL)
- PT/INR

### ยา
- เพิ่มยา: พิมพ์ autocomplete — พิมพ์ "amlo" → ขึ้น "Amlodipine" → กดเลือก
- พิมพ์ free text ได้ถ้ายาไม่อยู่ใน list
- ทุกตัวยามีข้อมูล:
  - ชื่อยา
  - Dose + จำนวน (เช่น 0.25 mcg x 6 เม็ด)
  - เวลากิน (ac / pc / hs / หลัง HD / พร้อมอาหาร / อื่น ๆ)
- แก้ dose / เวลากิน / ลบ ได้ตลอด

#### ฐานยา Autocomplete (ครอบคลุมทุกกลุ่ม):

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
- CCB: Amlodipine, Nifedipine, Diltiazem, Verapamil, Manidipine
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
- Insulin: RI, NPH, Glargine (Lantus), Detemir, Degludec, Aspart, Lispro
- Metformin (Glucophage)
- SGLT2i: Dapagliflozin (Forxiga), Empagliflozin (Jardiance), Canagliflozin
- GLP-1 RA: Semaglutide (Ozempic), Liraglutide (Victoza), Dulaglutide (Trulicity)
- DPP4i: Linagliptin (Trajenta), Sitagliptin (Januvia), Vildagliptin (Galvus)
- SU: Glipizide (Minidiab), Gliclazide (Diamicron), Glimepiride (Amaryl)
- TZD: Pioglitazone (Actos)
- Acarbose (Glucobay)

**ยาอื่น ๆ:**
- PPI: Omeprazole, Esomeprazole, Pantoprazole
- H2 blocker: Famotidine
- Allopurinol (Zyloric), Febuxostat (Feburic)
- Colchicine
- Gabapentin (Neurontin), Pregabalin (Lyrica)
- Antidepressant: Sertraline, Fluoxetine, Escitalopram
- Paracetamol
- Antibiotics: Amoxicillin, Augmentin, Cephalexin, Ceftriaxone, Tazocin, Meropenem, Vancomycin, Ciprofloxacin, Levofloxacin
- Antifungal: Fluconazole
- อื่น ๆ (free text พิมพ์เพิ่มได้เสมอ)

---

## Output: Recommendation Engine

### หลักการ
- กรอก lab ตัวไหน → แสดง recommendation ตัวนั้นทันที
- ไม่ต้องกรอกครบถึงจะแสดง
- แสดง 3 ส่วน: (1) Recommendation (2) เป้าหมาย (3) ข้อระวัง
- กรอกยา + eGFR → app เตือนอัตโนมัติว่ายาตัวไหนต้องปรับ/หยุด ตาม eGFR (ไม่ต้องจำ ไม่ต้องเปิด UpToDate)

### Clinical Logic ตาม CPG

#### 1. Anemia Management (Thailand CPG 2021 + KDIGO 2026)

**EPO adjustment by Hb:**
- Hb <10.0 g/dL → เพิ่ม EPO dose 15-30% + คำนวณ dose ใหม่จาก dose ปัจจุบัน
- Hb 10.0-11.5 g/dL → คงขนาด EPO + ประเมิน iron status
- Hb 11.6-12.9 g/dL → ลด EPO dose 15-30%
- Hb >=13.0 g/dL → หยุด EPO 1-2 สัปดาห์ → เมื่อ Hb 10.6-12 ให้ restart EPO 50% ของ dose เดิม
- เป้าหมาย: Hb 10-11.5 g/dL
- ข้อระวัง: HTN, vascular access thrombosis, stroke ถ้าเพิ่ม dose เร็วเกินไป

**IV Iron by TSAT + Ferritin (Thailand CPG 2021):**
- Ferritin >=800 ng/mL หรือ TSAT >=40% → หยุด IV Iron
- TSAT 30-40% + Ferritin 500-800 → Iron IV 100 mg q 4 weeks x 10 doses
- TSAT 20-30% + Ferritin 200-500 → Iron IV 100 mg q 2 weeks x 10 doses
- TSAT <20% + Ferritin <200 → Iron IV 100 mg q 1 week x 10 doses
- เป้าหมาย: Ferritin 200-500 ng/mL, TSAT 20-30%
- ข้อระวัง: anaphylaxis (โดยเฉพาะ iron dextran), ถ้าแพ้ iron sucrose → เปลี่ยนเป็น FCM

**KDIGO 2026 Anemia update:**
- HD patients: เริ่ม IV iron เมื่อ Ferritin <=500 + TSAT <=30%
- ใช้ proactive approach เพื่อ maintain stable iron status
- เป้า Hb ของ ESA maintenance ควร <11.5 g/dL
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
  - iPTH 200-300 → คงขนาด >=3 เดือน
  - iPTH >300 → ถ้าได้ Vitamin D อยู่ เพิ่ม 10-25% / ถ้ายังไม่ได้ ให้ 75% ของ dose เริ่มต้น
- เป้าหมาย: iPTH 150-300 pg/mL (หรือ 2-9x ULN ตาม KDIGO)
- ข้อระวัง: ถ้าเพิ่ม Vitamin D → ต้อง recheck Ca ใน 2 สัปดาห์, ระวัง hypercalcemia

**Phosphate management:**
- PO4 >5.5 mg/dL → เพิ่ม phosphate binder + dietary PO4 restriction
- เป้าหมาย: PO4 3.5-5.5 mg/dL
- ข้อระวัง: CaCO3 → ระวัง hypercalcemia โดยเฉพาะถ้าได้ Vitamin D ร่วม

**Calcium:**
- Ca >10.2 mg/dL → ลด/หยุด CaCO3, ลด Vitamin D, ลด Ca ใน dialysate
- Ca <8.4 mg/dL → เพิ่ม CaCO3 หรือ Ca supplement
- เป้าหมาย: Ca 8.4-10.2 mg/dL

#### 3. Dialysis Adequacy

- Kt/V <1.2 (HD 3x/wk) หรือ <1.8 (HD 2x/wk) → inadequate
- URR <65% → inadequate
- แนะนำ: ตรวจสอบ HD time >=4 ชม., BFR >=250, vascular access function, dialyzer size
- เป้าหมาย: Kt/V >=1.2 (3x/wk) หรือ >=1.8 (2x/wk), URR >=65%

#### 4. Nutrition

- Albumin <3.5 g/dL → flag malnutrition → protein intake >=1.0-1.2 g/kg/day
- nPCR <0.8 → inadequate protein intake
- เป้าหมาย: Albumin >=3.5 g/dL, nPCR 1.0-1.2

#### 5. Electrolytes

**Potassium:**
- K >5.5 mEq/L → dietary K restriction, review meds (ACEi/ARB/MRA), +/- K binder
- K >6.5 mEq/L → URGENT: EKG, Ca gluconate, insulin+glucose, urgent HD
- K <3.5 mEq/L → review diuretics, K supplement
- เป้าหมาย: K 3.5-5.5 mEq/L

**Bicarbonate:**
- HCO3 <22 mEq/L → metabolic acidosis → NaHCO3 supplement, adjust dialysate HCO3
- เป้าหมาย: HCO3 >=22 mEq/L

#### 6. Infection Screening

- HBsAg/HBsAb/Anti-HCV → ถ้าผล > 6 เดือน → เตือน "ครบกำหนดเจาะใหม่"
- HBsAb negative → แนะนำ HBV vaccination
- Anti-HCV positive → แนะนำ refer Hepatologist for DAA treatment

#### 7. Lab วิกฤต (Critical Alert — สีแดง ขึ้นทันที)

- K >=6.5 mEq/L → "URGENT: Hyperkalemia วิกฤต"
- K <=2.5 mEq/L → "URGENT: Severe hypokalemia"
- Ca >=12.0 mg/dL → "URGENT: Severe hypercalcemia"
- Ca <=6.0 mg/dL → "URGENT: Severe hypocalcemia"
- Hb <=5.0 g/dL → "URGENT: Severe anemia — พิจารณา transfusion"
- Na <=120 mEq/L → "URGENT: Severe hyponatremia"
- Na >=160 mEq/L → "URGENT: Severe hypernatremia"

#### 8. eGFR Drop Detection

- กรอก eGFR ใหม่ + มี eGFR เก่า → คำนวณ % เปลี่ยนแปลง + rate of decline ต่อปี อัตโนมัติ
- eGFR drop >30% หลังเริ่ม ACEi/ARB → เตือน "ลดหรือหยุดยา + หา renal artery stenosis"
- eGFR drop >30% หลังเริ่ม SGLT2i → เตือน "อาจเป็น hemodynamic effect ปกติ แต่ถ้า >30% ควร recheck"
- Rate of decline >5 mL/min/year → เตือน "rapid progression"
- เป้าหมาย: eGFR decline <5 mL/min/year

#### 9. Renoprotection Ladder (KDIGO 2024 + ADA 2026)

ถ้าคนไข้เป็น CKD + DM/HT → app แนะนำอัตโนมัติว่ายังขาดยาตัวไหน:

ลำดับ:
1. ACEi/ARB (ถ้ามี albuminuria หรือ eGFR <60) — max tolerated dose
2. SGLT2i — Dapagliflozin (Forxiga) 10 mg / Empagliflozin (Jardiance) 10 mg (eGFR >=20)
3. Finerenone (Kerendia) — DM + CKD + K <5.0 + eGFR >=25 + ได้ ACEi/ARB max dose แล้ว
4. GLP-1 RA — Semaglutide (Ozempic) เป็น first choice (มี kidney outcome trial)
5. Statin

ADA 2026 ใหม่: สามารถเริ่ม SGLT2i + Finerenone พร้อมกันได้ ถ้า UACR >=100 + eGFR 30-90 + ได้ RAS inhibitor อยู่

#### 10. Hypertension ใน CKD (KDIGO 2021/2024 + ADA 2026)

- เป้า SBP <120 mmHg (standardized measurement) ถ้าทนได้
- เป้า SBP <130 mmHg สำหรับ practical clinical setting
- คนเปราะบาง/สูงอายุ/เสี่ยงล้ม → individualize เป้าอาจ <140 mmHg
- First line ถ้ามี albuminuria หรือ eGFR <60 → ACEi/ARB max tolerated dose
- First line ถ้าไม่มี albuminuria → เลือกจาก ACEi/ARB, CCB, diuretic
- คนสูงอายุ >=75 ปี ไม่มี proteinuria → CCB เป็น first line ได้
- eGFR <30 → ใช้ loop diuretic (Furosemide) แทน thiazide
- ต้อง monitor K + Cr หลังเริ่ม ACEi/ARB

#### 11. DM ใน CKD (ADA 2026 + KDIGO 2024 + ADA/KDIGO Consensus)

- เป้า HbA1C <7% ทั่วไป
- เป้า HbA1C <8% ถ้า eGFR ต่ำ + hypo risk สูง (individualized)
- First line: SGLT2i (eGFR >=20) + Semaglutide (ทุก eGFR)
- Metformin: ไม่เริ่มใหม่ถ้า eGFR <45 / ลด dose เมื่อ eGFR <45 / หยุดเมื่อ eGFR <30
- Insulin ใน CKD: ลด dose 25% เมื่อ eGFR 15-29 / ลด 50% เมื่อ eGFR <15 หรือ HD
- SU (Glipizide/Gliclazide): ระวัง hypo ลด dose เมื่อ eGFR ต่ำ หลีกเลี่ยงใน HD
- Linagliptin: ไม่ต้องปรับ dose ทุก eGFR (preferred DPP4i ใน CKD)

---

## Drug-eGFR Adjustment Database (เตือนอัตโนมัติจากยาใน list)

### ยาเบาหวาน

| ยา (ชื่อการค้า) | eGFR >=60 | eGFR 45-59 | eGFR 30-44 | eGFR 15-29 | eGFR <15 / HD |
|---|---|---|---|---|---|
| Metformin (Glucophage) | ใช้ได้ปกติ | ลด max 1000 mg/d | ลด max 500 mg/d | หยุด | หยุด |
| Glipizide (Minidiab) | ใช้ได้ | ใช้ได้ | ระวัง hypo ลด dose | ระวัง hypo ลด 50% | หลีกเลี่ยง |
| Gliclazide (Diamicron) | ใช้ได้ | ใช้ได้ | ระวัง hypo ลด dose | ระวัง hypo ลด 50% | หลีกเลี่ยง |
| Glimepiride (Amaryl) | ใช้ได้ | ใช้ได้ | ระวัง hypo ลด dose | หลีกเลี่ยง | หลีกเลี่ยง |
| Acarbose (Glucobay) | ใช้ได้ | ใช้ได้ | ระวัง | หยุด (eGFR <25) | หยุด |
| Pioglitazone (Actos) | ใช้ได้ | ใช้ได้ | ใช้ได้ ระวังบวม | ใช้ได้ ระวังบวม | ระวัง fluid |
| Linagliptin (Trajenta) | 5 mg ไม่ปรับ | ไม่ปรับ | ไม่ปรับ | ไม่ปรับ | ไม่ปรับ |
| Sitagliptin (Januvia) | 100 mg | 100 mg | 50 mg | 25 mg | 25 mg |
| Vildagliptin (Galvus) | 50 mg bid | 50 mg bid | 50 mg OD | 50 mg OD | 50 mg OD |
| Dapagliflozin (Forxiga) | 10 mg | 10 mg | 10 mg | 10 mg (ถึง eGFR 20) | หยุด |
| Empagliflozin (Jardiance) | 10-25 mg | 10 mg | 10 mg | 10 mg (ถึง eGFR 20) | หยุด |
| Semaglutide (Ozempic) | ใช้ได้ | ใช้ได้ | ใช้ได้ | ใช้ได้ ระวัง | ใช้ได้ ระวัง |
| Liraglutide (Victoza) | ใช้ได้ | ใช้ได้ | ใช้ได้ | ใช้ได้ ระวัง | ไม่แนะนำ |
| Dulaglutide (Trulicity) | ใช้ได้ | ใช้ได้ | ใช้ได้ | ใช้ได้ ระวัง | ไม่แนะนำ |
| Lixisenatide | ใช้ได้ | ใช้ได้ | ระวัง | หลีกเลี่ยง (eGFR <=30) | หลีกเลี่ยง |
| Exenatide | ใช้ได้ | ใช้ได้ | ระวัง | หลีกเลี่ยง (CrCl <=30) | หลีกเลี่ยง |
| Insulin ทุกชนิด | ใช้ได้ | ใช้ได้ | ลด dose 25% | ลด dose 25-50% | ลด dose 50% |

### ยาความดัน

| ยา (ชื่อการค้า) | eGFR >=30 | eGFR 15-29 | eGFR <15 / HD | หมายเหตุ |
|---|---|---|---|---|
| Losartan (Cozaar) | ใช้ได้ ไม่ปรับ | ใช้ได้ เช็ค K, Cr | ใช้ได้ เช็ค K | ถ้า eGFR drop >30% หลังเริ่ม → ลด/หยุด |
| Enalapril (Renitec) | ใช้ได้ | ลด dose | ลด dose | เช็ค K 1 สัปดาห์หลังเริ่ม |
| Ramipril (Tritace) | ใช้ได้ | ลด dose 50% | ลด dose 50% | เช็ค K |
| Amlodipine (Norvasc) | ไม่ปรับ | ไม่ปรับ | ไม่ปรับ | ใช้ได้ทุก eGFR |
| Nifedipine (Adalat) | ไม่ปรับ | ไม่ปรับ | ไม่ปรับ | ใช้ได้ทุก eGFR |
| Manidipine (Madiplot) | ไม่ปรับ | ไม่ปรับ | ไม่ปรับ | ใช้ได้ทุก eGFR |
| Diltiazem (Herbesser) | ไม่ปรับ | ไม่ปรับ | ไม่ปรับ | ใช้ได้ทุก eGFR |
| Atenolol (Tenormin) | ใช้ได้ | ลด 50% | ลด 50% | ไตขับ ต้องปรับ |
| Bisoprolol (Concor) | ไม่ปรับ | ไม่ปรับ | เริ่มต่ำ | ตับขับเป็นหลัก |
| Metoprolol (Betaloc) | ไม่ปรับ | ไม่ปรับ | ไม่ปรับ | ตับขับ |
| Carvedilol (Dilatrend) | ไม่ปรับ | ไม่ปรับ | ไม่ปรับ | ตับขับ |
| Furosemide (Lasix) | ใช้ได้ | เพิ่ม dose | ใช้ได้ | eGFR ต่ำต้อง dose สูงขึ้น |
| HCTZ | ใช้ได้ | ลดประสิทธิภาพ | ไม่ได้ผล (eGFR <30) | เปลี่ยนเป็น Furosemide |
| Spironolactone (Aldactone) | ใช้ได้ เช็ค K | ระวัง hyperK | หลีกเลี่ยง | |
| Finerenone (Kerendia) | K <5.0 | K <5.0 (ถึง eGFR 25) | ไม่แนะนำ | เฉพาะ DM+CKD |
| Hydralazine (Apresoline) | ไม่ปรับ | ไม่ปรับ | ไม่ปรับ | ใช้ได้ทุก eGFR |
| Prazosin / Doxazosin | ไม่ปรับ | ไม่ปรับ | ไม่ปรับ | ระวัง orthostatic |

### ยาอื่นที่ใช้บ่อย

| ยา | ปรับ dose ตาม eGFR | หมายเหตุ |
|---|---|---|
| Allopurinol (Zyloric) | eGFR <30 → ลดเริ่ม 50-100 mg | เช็ค rash |
| Febuxostat (Feburic) | ไม่ต้องปรับ | ใช้ได้ทุก eGFR |
| Colchicine | eGFR <30 → ลด 50% หรือ qOD | ระวัง toxicity |
| Gabapentin (Neurontin) | eGFR 30-59 → ลด, eGFR 15-29 → ลด 50%, eGFR <15 → ลด 75% | |
| Pregabalin (Lyrica) | eGFR 30-60 → ลด 50%, eGFR <30 → ลด 75% | |
| Warfarin (Coumadin) | ไม่ปรับ | bleeding risk สูงใน CKD |
| Rivaroxaban (Xarelto) | eGFR 15-49 → 15 mg, eGFR <15 → หลีกเลี่ยง | |
| Apixaban (Eliquis) | eGFR <25 → 2.5 mg bid | ใช้ได้ใน HD |
| Dabigatran (Pradaxa) | eGFR <30 → หลีกเลี่ยง | ไตขับ 80% |

---

## Drug Interaction Alert (อัตโนมัติ — ไม่ต้องกดปุ่ม)

App ตรวจยาใน list อัตโนมัติ เตือนเมื่อเห็น combination อันตราย:

| Combination | ความเสี่ยง | คำเตือน |
|---|---|---|
| ACEi + ARB | Dual RAS blockade | ห้ามใช้ร่วม — hyperkalemia + AKI risk |
| ACEi/ARB + Spironolactone + SGLT2i | Triple whammy | Hyperkalemia risk สูงมาก — monitor K ถี่ |
| ACEi/ARB + Finerenone | Double MRA effect | ระวัง hyperK — เช็ค K ก่อนเริ่ม + 1 เดือนหลังเริ่ม |
| NSAIDs + ACEi/ARB | AKI risk | หลีกเลี่ยง NSAIDs ใน CKD |
| NSAIDs + ACEi/ARB + Diuretic | Triple whammy AKI | ห้ามใช้ร่วม 3 ตัว |
| Metformin + Contrast | Lactic acidosis | หยุด Metformin 48 ชม. ก่อน+หลังฉีดสี |
| SGLT2i + Insulin/SU | Hypoglycemia | ลด Insulin/SU dose เมื่อเพิ่ม SGLT2i |
| Warfarin + NSAIDs | GI bleeding | หลีกเลี่ยง |
| Digoxin + Hypokalemia | Digoxin toxicity | ระวังถ้า K ต่ำ |

---

## 4 ปุ่มพิเศษ (Phase 1)

### ปุ่ม 1: 🤒 Sick Day
กดปุ๊บ → app ดูยาใน list → แสดงว่าต้องหยุดยาตัวไหนชั่วคราว:
- หยุด SGLT2i (ketoacidosis risk)
- หยุด Metformin (lactic acidosis)
- หยุด ACEi/ARB (AKI risk)
- หยุด Diuretic (dehydration)
- หยุด Finerenone (hyperkalemia + AKI)
- คง Insulin แต่ monitor DTX ถี่ขึ้น (ลด dose ถ้ากินไม่ได้)
- คง Beta-blocker, CCB, Statin

### ปุ่ม 2: 💉 เตรียมฉีด Contrast
กดปุ๊บ → app ดู eGFR + ยา → แสดง:

**Risk level:**
- eGFR >=60 → Low risk
- eGFR 30-59 → Moderate risk → NSS hydration 1 mL/kg/hr x 6-12 ชม. ก่อน+หลัง
- eGFR <30 → High risk → NSS hydration + พิจารณาว่าจำเป็นจริงไหม + ใช้ low-osmolar contrast + minimal volume

**ยาที่ต้องหยุด:**
- Metformin → หยุด 48 ชม. ก่อน (หรือวันฉีด) + ไม่เริ่มจนกว่า Cr stable หลัง 48 ชม.
- NSAIDs → หยุด

**Lab:**
- ก่อนฉีด: Cr, eGFR
- 48-72 ชม. หลังฉีด: Cr, eGFR (ดู AKI)
- 1-2 สัปดาห์: Cr, eGFR (ดู recovery)
- 1 เดือน: Cr, eGFR (ถ้ามี AKI → ดูว่า recover หรือไม่)

**สำหรับ HD:**
- ฉีด contrast ได้ → ทำ HD หลังฉีดเพื่อ clear contrast
- ไม่ต้องหยุด Metformin (ไม่ได้กินอยู่แล้ว)

### ปุ่ม 3: 🔪 เตรียมผ่าตัด
กดปุ๊บ → app ถาม:

**1. ผ่าตัดอะไร** (พิมพ์ free text) เช่น "ถอนฟันคุด" / "TKR" / "CABG"

**2. ระดับ** (AI auto fill จากชื่อผ่าตัด → กด OK ยืนยัน หรือแก้ได้):
- Minor / Low bleeding risk (ถอนฟัน, ต้อกระจก, biopsy ผิวหนัง)
- Moderate (hernia, lap chole, PCI)
- Major / High bleeding risk (TKR, THR, CABG, open abdominal, neurosurgery)

**ยาที่ต้องหยุด (ปรับตาม minor/major):**

| ยา | Minor | Major |
|---|---|---|
| ASA | กินต่อได้ | กินต่อได้ (หยุดเฉพาะ neurosurgery) |
| Clopidogrel (Plavix) | ไม่หยุด หรือ 3 วัน | หยุด 5-7 วัน |
| Ticagrelor (Brilinta) | หยุด 3 วัน | หยุด 5 วัน |
| Prasugrel (Efient) | หยุด 5 วัน | หยุด 7 วัน |
| Warfarin (Coumadin) | ไม่หยุด (ต้อกระจก/ถอนฟัน) | หยุด 5 วัน + เช็ค INR |
| Rivaroxaban (Xarelto) | ข้าม 1 dose | หยุด 2-3 วัน |
| Apixaban (Eliquis) | ข้าม 1 dose | หยุด 2-3 วัน |
| Dabigatran (Pradaxa) | หยุด 1-2 วัน | หยุด 2-4 วัน (นานขึ้นถ้า eGFR ต่ำ) |
| SGLT2i | หยุด 1 วัน | หยุด 3 วัน |
| Metformin | หยุดเช้าวันผ่าตัด | หยุดเช้าวันผ่าตัด |
| ACEi/ARB | หยุดเช้าวันผ่าตัด | หยุดเช้าวันผ่าตัด (hypotension risk) |
| Insulin | ลด basal 20% | ลด basal 50-80% คืนก่อน |
| Statin | กินต่อ | กินต่อ |
| Beta-blocker | กินต่อ | กินต่อ |
| CCB | กินต่อ | กินต่อ |

**สำหรับ HD:**
- ทำ HD ก่อนผ่าตัด 1 วัน
- ใช้ heparin-free หรือ minimal heparin

**Lab ก่อนผ่าตัด:**
- Minor: CBC, INR (ถ้ากิน warfarin)
- Major: CBC, BUN, Cr, K, PT/INR, PTT, CXR, EKG

**Lab หลังผ่าตัด:**
- Minor: ไม่ต้อง (ถ้าไม่มี complication)
- Major: 6 ชม. → CBC, K / 24 ชม. → CBC, Cr, K / 48-72 ชม. → Cr (ดู AKI) / 1 สัปดาห์ → CBC, Cr, K, INR (ถ้า restart warfarin)

**เริ่มยาใหม่เมื่อไหร่:**
- Anticoagulant/antiplatelet → 24-48 ชม. หลังผ่าตัดถ้าไม่มี bleeding
- Metformin → เมื่อกินอาหารได้ + eGFR stable
- SGLT2i → เมื่อกินอาหารได้ปกติ
- ACEi/ARB → วันรุ่งขึ้นถ้า BP stable

---

## เป้าหมายการรักษา (แสดงอัตโนมัติ)

| โรค/ค่า | เป้าหมาย |
|---|---|
| BP (CKD) | <130/80 mmHg (ideal <120/80 ถ้าทนได้) |
| HbA1C (ทั่วไป) | <7% |
| HbA1C (eGFR ต่ำ + hypo risk) | <8% (individualized) |
| eGFR decline | <5 mL/min/year |
| UACR | ลด >=30% จาก baseline |
| K (ถ้าได้ ACEi/ARB/MRA) | <5.5 mEq/L |
| Hb (CKD/HD) | 10-11.5 g/dL |
| Ferritin (HD) | 200-500 ng/mL |
| TSAT (HD) | 20-30% |
| Kt/V (HD 3x/wk) | >=1.2 |
| Kt/V (HD 2x/wk) | >=1.8 |
| URR | >=65% |
| Ca | 8.4-10.2 mg/dL |
| PO4 | 3.5-5.5 mg/dL |
| iPTH (HD) | 150-300 pg/mL (2-9x ULN) |
| Albumin | >=3.5 g/dL |
| HCO3 | >=22 mEq/L |
| LDL | <70 mg/dL (ถ้ามี ASCVD) / <100 mg/dL (ทั่วไป) |

---

## แชท AI (Claude API)

### System Prompt:

```
คุณคือ Nephrology Clinical Consultant สำหรับ nephrologist ไทย

ข้อมูลคนไข้ที่มีอยู่:
{patient_data: สถานะ(CKD/HD/PD), eGFR, โรคประจำตัว, allergy, lab ทั้งหมด+วันที่, ยาทั้งหมด+dose+เวลากิน, vascular access, วันเริ่ม HD, สาเหตุ ESRD, น้ำหนัก, dry weight}

หลักการตอบ:
1. ตอบเป็นภาษาไทย ชื่อยาและศัพท์เฉพาะทางใช้อังกฤษ
2. ตอบเป็นชื่อยาสามัญ (ชื่อการค้า) (กลุ่มยา) + dose เสมอ เช่น Linagliptin (Trajenta) (DPP4i) 5 mg OD — ไม่ตอบแค่ชื่อกลุ่ม
3. อ้างอิง CPG: Thailand CPG Anemia 2021, KDIGO 2026 Anemia, KDIGO 2024 CKD, KDIGO 2017 MBD, ADA 2026, ADA/KDIGO Consensus, AHA/ACC guidelines
4. คิด dose จริง จากข้อมูลยาปัจจุบันของคนไข้ + ปรับตาม eGFR/body weight
5. บอกเป้าหมาย + ข้อระวัง + สิ่งที่ต้อง monitor หลังปรับยา + กี่สัปดาห์/กี่เดือน
6. ถ้าคนไข้มี allergy → ห้ามแนะนำยาที่แพ้ + แนะนำทางเลือกอื่น
7. ถ้า lab เก่า > 3 เดือน → เตือนว่าควรเจาะใหม่ก่อนปรับยา
8. ถ้ามียาที่มี duration จำกัดตาม guideline (เช่น DAPT) → เตือนเรื่อง duration
9. ถ้าแนะนำหยุดยา → บอกว่าเปลี่ยนเป็นตัวไหนแทน พร้อม dose
10. คำนึงว่าเป็น รพ.เล็ก ยาอาจไม่ครบ → ถ้าคนไข้บอกว่ายาไม่มี ให้แนะนำทางเลือกอื่น
11. ดูคนไข้ให้ครอบทุกมุม: ไต + เบาหวาน + ความดัน + หัวใจ + drug interaction
12. ตอบสั้นกระชับ ไม่ต้องอธิบายยืดยาว เว้นแต่ถูกถามให้ขยาย
13. คุณเป็น clinical decision support — แพทย์ต้อง confirm ก่อนสั่งยาเสมอ
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
- Mobile-first design

### Storage Schema

```json
{
  "patients": [
    {
      "id": "uuid",
      "name": "น.จ. หรือ ชื่อเล่น หรือ HN",
      "hn": "12345",
      "weight_kg": 60,
      "height_cm": 165,
      "dry_weight_kg": 58,
      "status": "HD",
      "egfr": null,
      "ckd_stage": null,
      "hd_start_date": "2024-01",
      "esrd_cause": "DKD",
      "vascular_access": { "type": "AVF", "created_date": "2023-06" },
      "conditions": [
        { "name": "DM type 2", "since": "2015" },
        { "name": "HT", "since": "" },
        { "name": "CAD s/p PCI with DES", "since": "2024-06-15" }
      ],
      "allergies": ["Venofer", "Sulfa"],
      "medications": [
        { "name": "EPO (Recormon)", "dose": "4000 u", "frequency": "3x/wk", "timing": "หลัง HD" },
        { "name": "Alfacalcidol", "dose": "0.25 mcg x 6 เม็ด", "frequency": "3x/wk", "timing": "หลัง HD" },
        { "name": "Amlodipine (Norvasc)", "dose": "10 mg", "frequency": "OD", "timing": "hs" }
      ],
      "labs": [
        {
          "date": "2025-03",
          "values": { "Hb": 9.2, "Ferritin": 450, "TSAT": 25, "KtV": 1.3, "URR": 68, "Ca": 9.1, "PO4": 5.5, "iPTH": 450, "Albumin": 3.8, "K": 4.8, "HCO3": 20 }
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
await window.storage.set('patients', JSON.stringify(patients));
const result = await window.storage.get('patients');
const patients = result ? JSON.parse(result.value) : [];
```

---

## UI Design Principles

1. **Mobile-first** — ใช้บนมือถือเป็นหลัก
2. **กรอกน้อยที่สุด** — ทุกช่องไม่บังคับ
3. **ไม่ดูน่ากลัว** — ใช้ expandable sections ไม่ใช่ form ยาว 30 ช่อง
4. **Recommendation เด่นชัด** — เห็นปุ๊บรู้ปั๊บต้องทำอะไร
5. **สีสื่อความหมาย:**
   - แดง = วิกฤต / ต้องแก้ไขด่วน / หยุดยา
   - เหลือง = ควรปรับ / ระวัง
   - เขียว = ปกติ / ใช้ได้
6. **ภาษาไทย** ทั้ง UI
7. **Disclaimer** แสดงชัดเจน: "Clinical decision support — แพทย์ต้อง confirm ก่อนสั่งยาเสมอ"

---

## Build Order (แนะนำ)

### รอบ 1: โครงสร้าง
1. Patient list + CRUD (เพิ่ม/แก้/ลบ)
2. Patient detail page: ข้อมูลพื้นฐาน + สถานะ CKD/HD + โรค + allergy
3. Lab input (expandable groups) + บันทึก history + eGFR trend
4. Medication input (autocomplete + dose + timing)
5. Persistent storage (save/load)

### รอบ 2: สมอง
6. Recommendation engine (ตาม CPG logic)
7. Drug-eGFR adjustment alerts (อัตโนมัติ)
8. Drug interaction alerts (อัตโนมัติ)
9. Critical lab alerts
10. Renoprotection ladder check
11. 4 ปุ่มพิเศษ (Sick day / Contrast / Pre-op / + drug interaction auto)
12. แชท AI (Claude API + patient context + system prompt)

### รอบ 3: Polish
13. eGFR trend visualization
14. Lab trend chart
15. UX refinements
16. Disclaimer + about page

---

## ไม่ทำใน Phase 1

- ถ่ายรูป doctor order (OCR ลายมือ)
- ถ่ายรูป lab
- แยกศูนย์
- HD prescription (dialyzer, BFR, time, UF goal)
- Alert อัตโนมัติ DAPT duration (ใช้แชท AI แทน)
- Export รายงาน
- สิทธิ์การรักษา
- เตรียม KT
- Vaccination reminder (ใช้แชท AI แทน)

---

## CPG References

- Thailand CPG for Treatment of Anemia in CKD 2021
- Thailand MBD Flowchart (iPTH + Vitamin D adjustment)
- KDIGO 2026 Clinical Practice Guideline for Anemia in CKD
- KDIGO 2024 Clinical Practice Guideline for Evaluation and Management of CKD
- KDIGO 2021 Clinical Practice Guideline for Management of BP in CKD
- KDIGO 2017 CKD-MBD Guideline (+ 2025 Controversies Conference)
- ADA Standards of Care in Diabetes 2026
- ADA/KDIGO Consensus Report on Diabetes Management in CKD
- ESH 2023 Guidelines for Management of Arterial Hypertension
- JSH 2025 Guidelines (BP in CKD)
- ศ.ร.ต. 2568 เกณฑ์มาตรฐานหน่วยไตเทียม
