/**
 * Drug reference database.
 *
 * Required fields:
 *   - name      (string)  display name incl. brand
 *   - generic   (string)  generic name
 *   - category  (string)  'HD' | 'CV' | 'DM' | 'Other'
 *
 * Dose-seed fields (AI-generated, awaiting physician verification):
 *   - dosage    (string)  short reference dose, renal-adjusted where relevant
 *   - source    (string)  'AI-seed' | citation after human review
 *   - verified  (boolean) false = AI-seeded, true = physician-reviewed
 *   - riskClass (string)  'narrow-ti' for narrow therapeutic index drugs
 *
 * SAFETY: entries with verified=false are AI-seeded dose hints only.
 * A physician must review and flip verified→true per drug before clinical use.
 */
export const MEDICATIONS = [
  // === HD หลัก ===
  { name: 'EPO (Recormon)', generic: 'Epoetin beta', category: 'HD',
    dosage: '2000-4000 U SC/IV 3x/wk; adjust to Hb 10-11.5', source: 'AI-seed', verified: false },
  { name: 'EPO (Eprex)', generic: 'Epoetin alfa', category: 'HD',
    dosage: '2000-4000 U SC/IV 3x/wk; adjust to Hb 10-11.5', source: 'AI-seed', verified: false },
  { name: 'Aranesp', generic: 'Darbepoetin alfa', category: 'HD',
    dosage: '0.45 mcg/kg SC/IV q1-2wk; adjust to Hb 10-11.5', source: 'AI-seed', verified: false },
  { name: 'CERA (Mircera)', generic: 'Methoxy PEG-epoetin beta', category: 'HD',
    dosage: '0.6 mcg/kg IV/SC q2wk init → q4wk maint', source: 'AI-seed', verified: false },
  { name: 'Venofer', generic: 'Iron sucrose', category: 'HD',
    dosage: '100 mg IV per HD session; total course 1000 mg', source: 'AI-seed', verified: false },
  { name: 'Ferinject', generic: 'Ferric carboxymaltose (FCM)', category: 'HD',
    dosage: '500-1000 mg IV; max 20 mg/kg/dose', source: 'AI-seed', verified: false },
  { name: 'Iron dextran', generic: 'Iron dextran', category: 'HD',
    dosage: '25 mg test dose → 100 mg IV/session; total per formula', source: 'AI-seed', verified: false },
  { name: 'Calcium carbonate (CaCO3)', generic: 'Calcium carbonate', category: 'HD',
    dosage: '500-1500 mg elemental Ca TID with meals as PO4 binder', source: 'AI-seed', verified: false },
  { name: 'Sevelamer', generic: 'Sevelamer', category: 'HD',
    dosage: '800 mg TID with meals; titrate to PO4 target', source: 'AI-seed', verified: false },
  { name: 'Lanthanum carbonate', generic: 'Lanthanum', category: 'HD',
    dosage: '250-500 mg TID with meals; chew before swallow', source: 'AI-seed', verified: false },
  { name: 'Aluminium hydroxide', generic: 'Aluminium hydroxide', category: 'HD',
    dosage: '300-600 mg TID with meals; short-term only (≤4 wk)', source: 'AI-seed', verified: false },
  { name: 'Alfacalcidol', generic: 'Alfacalcidol', category: 'HD',
    dosage: '0.25-0.5 mcg/day PO; titrate per Ca/PTH', source: 'AI-seed', verified: false },
  { name: 'Calcitriol', generic: 'Calcitriol', category: 'HD',
    dosage: '0.25-0.5 mcg/day PO or 1-2 mcg IV 3x/wk post-HD', source: 'AI-seed', verified: false },
  { name: 'Ergocalciferol', generic: 'Ergocalciferol (Vitamin D2)', category: 'HD',
    dosage: '50,000 U/wk × 8-12 wk if 25-OH VitD <30', source: 'AI-seed', verified: false },
  { name: 'Cholecalciferol', generic: 'Cholecalciferol (Vitamin D3)', category: 'HD',
    dosage: '1,000-5,000 U/day maintenance', source: 'AI-seed', verified: false },
  { name: 'Cinacalcet', generic: 'Cinacalcet', category: 'HD',
    dosage: '25-30 mg OD; titrate q2-4wk to max 180 mg/day', source: 'AI-seed', verified: false },
  { name: 'Etelcalcetide', generic: 'Etelcalcetide', category: 'HD',
    dosage: '5 mg IV 3x/wk post-HD; titrate per PTH', source: 'AI-seed', verified: false },
  { name: 'Heparin', generic: 'Heparin', category: 'HD',
    dosage: 'HD: 1000-2000 U bolus + 500-1000 U/hr; adjust per ACT', source: 'AI-seed', verified: false, riskClass: 'narrow-ti' },
  { name: 'Enoxaparin (Clexane)', generic: 'Enoxaparin', category: 'HD',
    dosage: '1 mg/kg q12h; CrCl<30: 1 mg/kg OD; HD anticoag: 0.5-1 mg/kg', source: 'AI-seed', verified: false, riskClass: 'narrow-ti' },
  { name: 'Sodium bicarbonate', generic: 'Sodium bicarbonate', category: 'HD',
    dosage: '650-1300 mg PO TID; target serum HCO3 ≥22', source: 'AI-seed', verified: false },

  // === Cardiovascular ===
  { name: 'Enalapril', generic: 'Enalapril', category: 'CV' },
  { name: 'Ramipril', generic: 'Ramipril', category: 'CV' },
  { name: 'Lisinopril', generic: 'Lisinopril', category: 'CV' },
  { name: 'Perindopril', generic: 'Perindopril', category: 'CV' },
  { name: 'Losartan', generic: 'Losartan', category: 'CV' },
  { name: 'Valsartan', generic: 'Valsartan', category: 'CV' },
  { name: 'Irbesartan', generic: 'Irbesartan', category: 'CV' },
  { name: 'Telmisartan', generic: 'Telmisartan', category: 'CV' },
  { name: 'Olmesartan', generic: 'Olmesartan', category: 'CV' },
  { name: 'Candesartan', generic: 'Candesartan', category: 'CV' },
  { name: 'Amlodipine', generic: 'Amlodipine', category: 'CV' },
  { name: 'Nifedipine', generic: 'Nifedipine', category: 'CV' },
  { name: 'Diltiazem', generic: 'Diltiazem', category: 'CV' },
  { name: 'Verapamil', generic: 'Verapamil', category: 'CV' },
  { name: 'Manidipine (Madiplot)', generic: 'Manidipine', category: 'CV' },
  { name: 'Atenolol', generic: 'Atenolol', category: 'CV' },
  { name: 'Metoprolol', generic: 'Metoprolol', category: 'CV' },
  { name: 'Bisoprolol', generic: 'Bisoprolol', category: 'CV' },
  { name: 'Carvedilol', generic: 'Carvedilol', category: 'CV' },
  { name: 'Propranolol', generic: 'Propranolol', category: 'CV' },
  { name: 'Furosemide', generic: 'Furosemide', category: 'CV' },
  { name: 'HCTZ', generic: 'Hydrochlorothiazide', category: 'CV' },
  { name: 'Spironolactone', generic: 'Spironolactone', category: 'CV' },
  { name: 'Finerenone', generic: 'Finerenone', category: 'CV' },
  { name: 'Hydralazine', generic: 'Hydralazine', category: 'CV' },
  { name: 'Minoxidil', generic: 'Minoxidil', category: 'CV' },
  { name: 'Prazosin', generic: 'Prazosin', category: 'CV' },
  { name: 'Doxazosin', generic: 'Doxazosin', category: 'CV' },
  { name: 'Aspirin (ASA)', generic: 'Aspirin', category: 'CV' },
  { name: 'Clopidogrel', generic: 'Clopidogrel', category: 'CV' },
  { name: 'Ticagrelor', generic: 'Ticagrelor', category: 'CV' },
  { name: 'Prasugrel', generic: 'Prasugrel', category: 'CV' },
  { name: 'Warfarin', generic: 'Warfarin', category: 'CV' },
  { name: 'Rivaroxaban', generic: 'Rivaroxaban', category: 'CV' },
  { name: 'Apixaban', generic: 'Apixaban', category: 'CV' },
  { name: 'Dabigatran', generic: 'Dabigatran', category: 'CV' },
  { name: 'Atorvastatin', generic: 'Atorvastatin', category: 'CV' },
  { name: 'Rosuvastatin', generic: 'Rosuvastatin', category: 'CV' },
  { name: 'Simvastatin', generic: 'Simvastatin', category: 'CV' },
  { name: 'Pravastatin', generic: 'Pravastatin', category: 'CV' },
  { name: 'Ezetimibe', generic: 'Ezetimibe', category: 'CV' },
  { name: 'Fenofibrate', generic: 'Fenofibrate', category: 'CV' },
  { name: 'Gemfibrozil', generic: 'Gemfibrozil', category: 'CV' },
  { name: 'ISDN', generic: 'Isosorbide dinitrate', category: 'CV' },
  { name: 'ISMN', generic: 'Isosorbide mononitrate', category: 'CV' },
  { name: 'Digoxin', generic: 'Digoxin', category: 'CV' },
  { name: 'Amiodarone', generic: 'Amiodarone', category: 'CV' },

  // === DM ===
  { name: 'Insulin RI', generic: 'Regular Insulin', category: 'DM' },
  { name: 'Insulin NPH', generic: 'NPH Insulin', category: 'DM' },
  { name: 'Insulin Glargine', generic: 'Insulin glargine', category: 'DM' },
  { name: 'Insulin Detemir', generic: 'Insulin detemir', category: 'DM' },
  { name: 'Insulin Degludec', generic: 'Insulin degludec', category: 'DM' },
  { name: 'Insulin Aspart', generic: 'Insulin aspart', category: 'DM' },
  { name: 'Insulin Lispro', generic: 'Insulin lispro', category: 'DM' },
  { name: 'Metformin', generic: 'Metformin', category: 'DM' },
  { name: 'Dapagliflozin (Forxiga)', generic: 'Dapagliflozin', category: 'DM' },
  { name: 'Empagliflozin (Jardiance)', generic: 'Empagliflozin', category: 'DM' },
  { name: 'Canagliflozin (Invokana)', generic: 'Canagliflozin', category: 'DM' },
  { name: 'Semaglutide (Ozempic)', generic: 'Semaglutide', category: 'DM' },
  { name: 'Liraglutide (Victoza)', generic: 'Liraglutide', category: 'DM' },
  { name: 'Dulaglutide (Trulicity)', generic: 'Dulaglutide', category: 'DM' },
  { name: 'Linagliptin (Trajenta)', generic: 'Linagliptin', category: 'DM' },
  { name: 'Sitagliptin (Januvia)', generic: 'Sitagliptin', category: 'DM' },
  { name: 'Vildagliptin (Galvus)', generic: 'Vildagliptin', category: 'DM' },
  { name: 'Glipizide (Minidiab)', generic: 'Glipizide', category: 'DM' },
  { name: 'Gliclazide (Diamicron)', generic: 'Gliclazide', category: 'DM' },
  { name: 'Glimepiride (Amaryl)', generic: 'Glimepiride', category: 'DM' },
  { name: 'Acarbose (Glucobay)', generic: 'Acarbose', category: 'DM' },
  { name: 'Pioglitazone (Actos)', generic: 'Pioglitazone', category: 'DM' },
  { name: 'Lixisenatide', generic: 'Lixisenatide', category: 'DM' },
  { name: 'Exenatide', generic: 'Exenatide', category: 'DM' },

  // === อื่น ๆ ===
  { name: 'Omeprazole', generic: 'Omeprazole', category: 'Other' },
  { name: 'Esomeprazole', generic: 'Esomeprazole', category: 'Other' },
  { name: 'Pantoprazole', generic: 'Pantoprazole', category: 'Other' },
  { name: 'Ranitidine', generic: 'Ranitidine', category: 'Other' },
  { name: 'Famotidine', generic: 'Famotidine', category: 'Other' },
  { name: 'Allopurinol', generic: 'Allopurinol', category: 'Other' },
  { name: 'Febuxostat', generic: 'Febuxostat', category: 'Other' },
  { name: 'Colchicine', generic: 'Colchicine', category: 'Other' },
  { name: 'Gabapentin', generic: 'Gabapentin', category: 'Other' },
  { name: 'Pregabalin', generic: 'Pregabalin', category: 'Other' },
  { name: 'Sertraline', generic: 'Sertraline', category: 'Other' },
  { name: 'Fluoxetine', generic: 'Fluoxetine', category: 'Other' },
  { name: 'Escitalopram', generic: 'Escitalopram', category: 'Other' },
  { name: 'Paracetamol', generic: 'Paracetamol', category: 'Other' },
  { name: 'Amoxicillin', generic: 'Amoxicillin', category: 'Other' },
  { name: 'Augmentin', generic: 'Amoxicillin-clavulanate', category: 'Other' },
  { name: 'Cephalexin', generic: 'Cephalexin', category: 'Other' },
  { name: 'Ceftriaxone', generic: 'Ceftriaxone', category: 'Other' },
  { name: 'Tazocin', generic: 'Piperacillin-tazobactam', category: 'Other' },
  { name: 'Meropenem', generic: 'Meropenem', category: 'Other' },
  { name: 'Vancomycin', generic: 'Vancomycin', category: 'Other' },
  { name: 'Ciprofloxacin', generic: 'Ciprofloxacin', category: 'Other' },
  { name: 'Levofloxacin', generic: 'Levofloxacin', category: 'Other' },
  { name: 'Fluconazole', generic: 'Fluconazole', category: 'Other' },
]

export function searchMedications(query) {
  if (!query || query.trim().length < 1) return []
  const q = query.toLowerCase()
  return MEDICATIONS.filter(
    (m) => m.name.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q)
  ).slice(0, 8)
}

/** Look up dose-seed info for a drug by display name. */
export function getDrugInfo(name) {
  if (!name) return null
  const n = name.toLowerCase()
  return MEDICATIONS.find((m) => m.name.toLowerCase() === n) || null
}

export const TIMING_OPTIONS = [
  'ac (ก่อนอาหาร)',
  'pc (หลังอาหาร)',
  'hs (ก่อนนอน)',
  'หลัง HD',
  'พร้อมอาหาร',
  'เช้า-เย็น',
  'เช้า-กลางวัน-เย็น',
  'เมื่อจำเป็น (prn)',
  'อื่น ๆ',
]

export const FREQUENCY_OPTIONS = [
  'OD',
  'BD',
  'TID',
  'QID',
  '3x/wk (หลัง HD)',
  '2x/wk',
  '1x/wk',
  'q 2 weeks',
  'q 4 weeks',
  'prn',
  'อื่น ๆ',
]
