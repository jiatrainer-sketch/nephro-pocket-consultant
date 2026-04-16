/**
 * Pregnancy / Lactation safety + symptom-indication mapping.
 * AI-seeded from FDA labels + LactMed (NIH). source='AI-seed', verified=false.
 */
import { BRAND_MAP, MEDICATIONS } from './medicationDatabase'

export const SYMPTOMS = [
  { key: 'headache', label: 'ปวดหัว' },
  { key: 'nasal-congestion', label: 'คัดจมูก' },
  { key: 'sore-throat', label: 'เจ็บคอ' },
  { key: 'fever', label: 'ไข้' },
  { key: 'nausea', label: 'คลื่นไส้' },
  { key: 'cough', label: 'ไอ' },
  { key: 'diarrhea', label: 'ท้องเสีย' },
  { key: 'constipation', label: 'ท้องผูก' },
  { key: 'UTI', label: 'UTI' },
  { key: 'insomnia', label: 'นอนไม่หลับ' },
  { key: 'GERD', label: 'กรดไหลย้อน' },
  { key: 'abdominal-pain', label: 'ปวดท้อง' },
  { key: 'rash-allergy', label: 'ผื่น/แพ้' },
  { key: 'back-pain', label: 'ปวดหลัง' },
  { key: 'hypertension', label: 'ความดันสูง' },
  { key: 'diabetes', label: 'เบาหวาน' },
  { key: 'seizure', label: 'ชัก' },
  { key: 'depression', label: 'ซึมเศร้า' },
]

// p=pregnancy safety, pN=preg note, pAlt=alternatives
// l=lactation safety, lN=lact note, ind=indications
const D = {
  // === HD 1-10 ===
  'EPO (Recormon)': { p: 'caution', pN: 'Use if severe anemia; limited data', pAlt: [], l: 'safe', lN: 'Large molecule; minimal transfer', ind: [] },
  'EPO (Eprex)': { p: 'caution', pN: 'Use if severe anemia; limited data', pAlt: [], l: 'safe', lN: 'Large molecule; minimal transfer', ind: [] },
  'Aranesp': { p: 'caution', pN: 'Limited human data; use if needed', pAlt: [], l: 'safe', lN: 'Large molecule', ind: [] },
  'CERA (Mircera)': { p: 'caution', pN: 'Limited data', pAlt: [], l: 'caution', lN: 'Unknown excretion', ind: [] },
  'Venofer': { p: 'caution', pN: '2nd/3rd tri preferred; avoid 1st tri', pAlt: ['Ferrous sulfate'], l: 'safe', lN: 'Iron supplements compatible', ind: [] },
  'Ferinject': { p: 'caution', pN: '2nd/3rd tri only; avoid 1st tri', pAlt: ['Ferrous sulfate'], l: 'safe', lN: 'Compatible', ind: [] },
  'Iron dextran': { p: 'avoid', pN: 'Anaphylaxis risk; use alternatives', pAlt: ['Venofer', 'Ferrous sulfate'], l: 'caution', lN: 'Use with monitoring', ind: [] },
  'Calcium carbonate (CaCO3)': { p: 'safe', pN: 'Safe as supplement/PO4 binder', pAlt: [], l: 'safe', lN: 'Safe', ind: ['GERD'] },
  'Sevelamer': { p: 'caution', pN: 'Not absorbed; limited data', pAlt: ['Calcium carbonate (CaCO3)'], l: 'safe', lN: 'Not absorbed systemically', ind: [] },
  'Lanthanum carbonate': { p: 'avoid', pN: 'Limited data; potential accumulation', pAlt: ['Calcium carbonate (CaCO3)'], l: 'avoid', lN: 'Insufficient data', ind: [] },
  // === HD 11-20 ===
  'Aluminium hydroxide': { p: 'caution', pN: 'Short-term OK; avoid chronic use', pAlt: ['Calcium carbonate (CaCO3)'], l: 'safe', lN: 'Minimal absorption', ind: ['GERD'] },
  'Alfacalcidol': { p: 'caution', pN: 'Monitor Ca; high doses teratogenic', pAlt: ['Cholecalciferol'], l: 'caution', lN: 'Excreted in milk; monitor infant Ca', ind: [] },
  'Calcitriol': { p: 'caution', pN: 'Monitor Ca closely; teratogenic at high dose', pAlt: ['Cholecalciferol'], l: 'caution', lN: 'Monitor infant Ca', ind: [] },
  'Ergocalciferol': { p: 'safe', pN: 'Safe at recommended doses', pAlt: [], l: 'safe', lN: 'Safe at normal doses', ind: [] },
  'Cholecalciferol': { p: 'safe', pN: 'Safe at recommended doses', pAlt: [], l: 'safe', lN: 'Safe; recommended', ind: [] },
  'Cinacalcet': { p: 'avoid', pN: 'Animal teratogenicity; no human data', pAlt: [], l: 'avoid', lN: 'Unknown excretion', ind: [] },
  'Etelcalcetide': { p: 'avoid', pN: 'No human data', pAlt: [], l: 'avoid', lN: 'No data', ind: [] },
  'Heparin': { p: 'safe', pN: 'Does not cross placenta; preferred anticoag in pregnancy', pAlt: [], l: 'safe', lN: 'Large molecule; not excreted', ind: [] },
  'Enoxaparin (Clexane)': { p: 'safe', pN: 'Preferred LMWH in pregnancy', pAlt: [], l: 'safe', lN: 'Not orally absorbed by infant', ind: [] },
  'Sodium bicarbonate': { p: 'safe', pN: 'Safe; avoid excessive use (alkalosis)', pAlt: [], l: 'safe', lN: 'Safe', ind: ['GERD'] },
  // === CV: ACEi/ARB (contraindicated) ===
  'Enalapril': { p: 'contraindicated', pN: 'Fetotoxic all trimesters; renal agenesis', pAlt: ['Methyldopa', 'Labetalol', 'Nifedipine'], l: 'safe', lN: 'Minimal transfer; compatible', ind: ['hypertension'] },
  'Ramipril': { p: 'contraindicated', pN: 'Fetotoxic', pAlt: ['Methyldopa', 'Labetalol', 'Nifedipine'], l: 'caution', lN: 'Limited data', ind: ['hypertension'] },
  'Lisinopril': { p: 'contraindicated', pN: 'Fetotoxic', pAlt: ['Methyldopa', 'Labetalol', 'Nifedipine'], l: 'caution', lN: 'Limited data', ind: ['hypertension'] },
  'Perindopril': { p: 'contraindicated', pN: 'Fetotoxic', pAlt: ['Methyldopa', 'Labetalol', 'Nifedipine'], l: 'caution', lN: 'Limited data', ind: ['hypertension'] },
  'Losartan': { p: 'contraindicated', pN: 'Fetotoxic; renal/skeletal defects', pAlt: ['Methyldopa', 'Labetalol', 'Nifedipine'], l: 'avoid', lN: 'Insufficient data', ind: ['hypertension'] },
  'Valsartan': { p: 'contraindicated', pN: 'Fetotoxic', pAlt: ['Methyldopa', 'Labetalol', 'Nifedipine'], l: 'avoid', lN: 'Insufficient data', ind: ['hypertension'] },
  'Irbesartan': { p: 'contraindicated', pN: 'Fetotoxic', pAlt: ['Methyldopa', 'Labetalol', 'Nifedipine'], l: 'avoid', lN: 'Insufficient data', ind: ['hypertension'] },
  'Telmisartan': { p: 'contraindicated', pN: 'Fetotoxic', pAlt: ['Methyldopa', 'Labetalol', 'Nifedipine'], l: 'avoid', lN: 'Insufficient data', ind: ['hypertension'] },
  'Olmesartan': { p: 'contraindicated', pN: 'Fetotoxic', pAlt: ['Methyldopa', 'Labetalol', 'Nifedipine'], l: 'avoid', lN: 'Insufficient data', ind: ['hypertension'] },
  'Candesartan': { p: 'contraindicated', pN: 'Fetotoxic', pAlt: ['Methyldopa', 'Labetalol', 'Nifedipine'], l: 'avoid', lN: 'Insufficient data', ind: ['hypertension'] },
  // === CV: CCB + BB ===
  'Amlodipine': { p: 'caution', pN: 'Limited data; Nifedipine preferred', pAlt: ['Nifedipine'], l: 'caution', lN: 'Excreted in milk', ind: ['hypertension'] },
  'Nifedipine': { p: 'safe', pN: '1st-line CCB in pregnancy HTN; also tocolytic', pAlt: [], l: 'safe', lN: 'Compatible; low levels in milk', ind: ['hypertension'] },
  'Diltiazem': { p: 'avoid', pN: 'Teratogenic in animals', pAlt: ['Nifedipine'], l: 'caution', lN: 'Excreted in milk', ind: ['hypertension'] },
  'Verapamil': { p: 'caution', pN: 'Use if SVT; limited data for HTN', pAlt: ['Nifedipine'], l: 'safe', lN: 'Low levels in milk', ind: ['hypertension'] },
  'Manidipine (Madiplot)': { p: 'avoid', pN: 'No human pregnancy data', pAlt: ['Nifedipine'], l: 'avoid', lN: 'No data', ind: ['hypertension'] },
  'Atenolol': { p: 'avoid', pN: 'IUGR risk; crosses placenta readily', pAlt: ['Labetalol', 'Metoprolol'], l: 'caution', lN: 'Concentrated in milk; monitor infant', ind: ['hypertension'] },
  'Metoprolol': { p: 'caution', pN: 'Acceptable if needed; Labetalol preferred', pAlt: ['Labetalol'], l: 'safe', lN: 'Low levels in milk', ind: ['hypertension'] },
  'Bisoprolol': { p: 'caution', pN: 'Limited data; Labetalol preferred', pAlt: ['Labetalol'], l: 'caution', lN: 'Unknown excretion', ind: ['hypertension'] },
  'Carvedilol': { p: 'caution', pN: 'Limited data', pAlt: ['Labetalol'], l: 'caution', lN: 'Unknown', ind: ['hypertension'] },
  'Propranolol': { p: 'caution', pN: 'Long experience; IUGR possible', pAlt: ['Labetalol'], l: 'safe', lN: 'Low levels; compatible', ind: ['hypertension'] },
  // === CV: diuretics/vasodilators/antiplatelets ===
  'Furosemide': { p: 'caution', pN: 'Use if needed; may reduce placental perfusion', pAlt: [], l: 'caution', lN: 'May suppress lactation', ind: [] },
  'HCTZ': { p: 'avoid', pN: 'May reduce placental perfusion; neonatal thrombocytopenia', pAlt: [], l: 'safe', lN: 'Low levels; compatible', ind: ['hypertension'] },
  'Spironolactone': { p: 'contraindicated', pN: 'Anti-androgenic; feminization of male fetus', pAlt: [], l: 'caution', lN: 'Active metabolite in milk', ind: [] },
  'Finerenone': { p: 'contraindicated', pN: 'No human data; avoid', pAlt: [], l: 'avoid', lN: 'No data', ind: [] },
  'Hydralazine': { p: 'safe', pN: '1st-line for severe pregnancy HTN; long track record', pAlt: [], l: 'safe', lN: 'Compatible', ind: ['hypertension'] },
  'Minoxidil': { p: 'avoid', pN: 'Neonatal hypertrichosis', pAlt: ['Hydralazine'], l: 'avoid', lN: 'Excreted in milk', ind: ['hypertension'] },
  'Prazosin': { p: 'caution', pN: 'Limited data', pAlt: ['Methyldopa'], l: 'caution', lN: 'Unknown', ind: ['hypertension'] },
  'Doxazosin': { p: 'caution', pN: 'Limited data', pAlt: ['Methyldopa'], l: 'caution', lN: 'Unknown', ind: ['hypertension'] },
  'Aspirin (ASA)': { p: 'caution', pN: 'Low-dose (81mg) safe/recommended for pre-eclampsia prevention; avoid full dose 3rd tri', pAlt: [], l: 'safe', lN: 'Low dose compatible', ind: ['headache', 'fever'] },
  'Clopidogrel': { p: 'avoid', pN: 'Limited data; use only if essential', pAlt: ['Aspirin (ASA)'], l: 'avoid', lN: 'Unknown', ind: [] },
  // === CV: anticoag/statins/misc ===
  'Ticagrelor': { p: 'avoid', pN: 'No data', pAlt: ['Aspirin (ASA)'], l: 'avoid', lN: 'No data', ind: [] },
  'Prasugrel': { p: 'avoid', pN: 'No data', pAlt: ['Aspirin (ASA)'], l: 'avoid', lN: 'No data', ind: [] },
  'Warfarin': { p: 'contraindicated', pN: 'Warfarin embryopathy (1st tri); CNS defects', pAlt: ['Heparin', 'Enoxaparin (Clexane)'], l: 'safe', lN: 'Not excreted in active form', ind: [] },
  'Rivaroxaban': { p: 'contraindicated', pN: 'Crosses placenta; bleeding risk', pAlt: ['Heparin', 'Enoxaparin (Clexane)'], l: 'avoid', lN: 'Excreted in milk in animals', ind: [] },
  'Apixaban': { p: 'contraindicated', pN: 'No data; assumed risk', pAlt: ['Heparin', 'Enoxaparin (Clexane)'], l: 'avoid', lN: 'No data', ind: [] },
  'Dabigatran': { p: 'contraindicated', pN: 'No data; assumed risk', pAlt: ['Heparin', 'Enoxaparin (Clexane)'], l: 'avoid', lN: 'No data', ind: [] },
  'Atorvastatin': { p: 'contraindicated', pN: 'Cholesterol needed for fetal development', pAlt: [], l: 'contraindicated', lN: 'Avoid during breastfeeding', ind: [] },
  'Rosuvastatin': { p: 'contraindicated', pN: 'Teratogenic risk', pAlt: [], l: 'contraindicated', lN: 'Avoid', ind: [] },
  'Simvastatin': { p: 'contraindicated', pN: 'Teratogenic risk', pAlt: [], l: 'contraindicated', lN: 'Avoid', ind: [] },
  'Pravastatin': { p: 'contraindicated', pN: 'Class effect; some data suggests lower risk but still avoid', pAlt: [], l: 'avoid', lN: 'Insufficient data', ind: [] },
  'Ezetimibe': { p: 'avoid', pN: 'No data', pAlt: [], l: 'avoid', lN: 'No data', ind: [] },
  'Fenofibrate': { p: 'contraindicated', pN: 'Embryotoxic in animals', pAlt: [], l: 'avoid', lN: 'No data', ind: [] },
  'Gemfibrozil': { p: 'contraindicated', pN: 'Embryotoxic in animals', pAlt: [], l: 'avoid', lN: 'No data', ind: [] },
  'ISDN': { p: 'caution', pN: 'Use if benefit > risk', pAlt: [], l: 'caution', lN: 'Unknown', ind: [] },
  'ISMN': { p: 'caution', pN: 'Use if benefit > risk', pAlt: [], l: 'caution', lN: 'Unknown', ind: [] },
  'Digoxin': { p: 'safe', pN: 'Crosses placenta; long experience; monitor levels', pAlt: [], l: 'safe', lN: 'Low levels in milk', ind: [] },
  'Amiodarone': { p: 'avoid', pN: 'Neonatal thyroid dysfunction; IUGR; use only if life-threatening', pAlt: [], l: 'contraindicated', lN: 'Concentrated in milk; thyroid risk', ind: [] },
  // === DM: Insulins + oral ===
  'Insulin RI': { p: 'safe', pN: 'Preferred for GDM; does not cross placenta', pAlt: [], l: 'safe', lN: 'Degraded in GI; safe', ind: ['diabetes'] },
  'Insulin NPH': { p: 'safe', pN: 'Preferred basal insulin in pregnancy', pAlt: [], l: 'safe', lN: 'Safe', ind: ['diabetes'] },
  'Insulin Glargine': { p: 'safe', pN: 'Increasing data supports safety; NPH also OK', pAlt: ['Insulin NPH'], l: 'safe', lN: 'Safe', ind: ['diabetes'] },
  'Insulin Detemir': { p: 'safe', pN: 'FDA Cat B; studied in pregnancy', pAlt: [], l: 'safe', lN: 'Safe', ind: ['diabetes'] },
  'Insulin Degludec': { p: 'caution', pN: 'Limited pregnancy data', pAlt: ['Insulin NPH', 'Insulin Detemir'], l: 'caution', lN: 'Limited data', ind: ['diabetes'] },
  'Insulin Aspart': { p: 'safe', pN: 'Studied in pregnancy; preferred rapid-acting', pAlt: [], l: 'safe', lN: 'Safe', ind: ['diabetes'] },
  'Insulin Lispro': { p: 'safe', pN: 'Long experience in pregnancy', pAlt: [], l: 'safe', lN: 'Safe', ind: ['diabetes'] },
  'Metformin': { p: 'safe', pN: 'Crosses placenta; used for GDM/PCOS; long track record', pAlt: ['Insulin RI'], l: 'safe', lN: 'Low levels in milk; compatible', ind: ['diabetes'] },
  'Dapagliflozin (Forxiga)': { p: 'avoid', pN: 'No human data; renal effects in animal', pAlt: ['Insulin RI', 'Metformin'], l: 'avoid', lN: 'No data', ind: ['diabetes'] },
  'Empagliflozin (Jardiance)': { p: 'avoid', pN: 'No human data', pAlt: ['Insulin RI', 'Metformin'], l: 'avoid', lN: 'No data', ind: ['diabetes'] },
  'Canagliflozin (Invokana)': { p: 'avoid', pN: 'No human data', pAlt: ['Insulin RI', 'Metformin'], l: 'avoid', lN: 'No data', ind: ['diabetes'] },
  'Semaglutide (Ozempic)': { p: 'contraindicated', pN: 'Embryotoxic in animals; discontinue 2mo before conception', pAlt: ['Insulin RI'], l: 'avoid', lN: 'No data', ind: [] },
  'Liraglutide (Victoza)': { p: 'contraindicated', pN: 'Embryotoxic in animals', pAlt: ['Insulin RI'], l: 'avoid', lN: 'No data', ind: [] },
  'Dulaglutide (Trulicity)': { p: 'contraindicated', pN: 'Embryotoxic', pAlt: ['Insulin RI'], l: 'avoid', lN: 'No data', ind: [] },
  'Linagliptin (Trajenta)': { p: 'avoid', pN: 'Limited data', pAlt: ['Insulin RI', 'Metformin'], l: 'avoid', lN: 'No data', ind: ['diabetes'] },
  'Sitagliptin (Januvia)': { p: 'avoid', pN: 'Limited data', pAlt: ['Insulin RI', 'Metformin'], l: 'avoid', lN: 'No data', ind: ['diabetes'] },
  'Vildagliptin (Galvus)': { p: 'avoid', pN: 'Limited data', pAlt: ['Insulin RI', 'Metformin'], l: 'avoid', lN: 'No data', ind: ['diabetes'] },
  'Glipizide (Minidiab)': { p: 'avoid', pN: 'Neonatal hypoglycemia; use insulin instead', pAlt: ['Insulin RI', 'Metformin'], l: 'caution', lN: 'May cause infant hypoglycemia', ind: ['diabetes'] },
  'Gliclazide (Diamicron)': { p: 'avoid', pN: 'Neonatal hypoglycemia', pAlt: ['Insulin RI', 'Metformin'], l: 'avoid', lN: 'Limited data', ind: ['diabetes'] },
  'Glimepiride (Amaryl)': { p: 'avoid', pN: 'Neonatal hypoglycemia', pAlt: ['Insulin RI', 'Metformin'], l: 'avoid', lN: 'No data', ind: ['diabetes'] },
  'Acarbose (Glucobay)': { p: 'avoid', pN: 'Limited data; not absorbed but no studies', pAlt: ['Insulin RI'], l: 'caution', lN: 'Minimal absorption', ind: [] },
  'Pioglitazone (Actos)': { p: 'avoid', pN: 'No human data', pAlt: ['Insulin RI', 'Metformin'], l: 'avoid', lN: 'No data', ind: [] },
  'Lixisenatide': { p: 'avoid', pN: 'No data', pAlt: ['Insulin RI'], l: 'avoid', lN: 'No data', ind: [] },
  'Exenatide': { p: 'avoid', pN: 'No data', pAlt: ['Insulin RI'], l: 'avoid', lN: 'No data', ind: [] },
  // === Other: GI ===
  'Omeprazole': { p: 'safe', pN: 'Extensive data; compatible', pAlt: [], l: 'safe', lN: 'Low levels in milk', ind: ['GERD', 'abdominal-pain'] },
  'Esomeprazole': { p: 'safe', pN: 'S-isomer of omeprazole; same safety', pAlt: [], l: 'safe', lN: 'Low levels', ind: ['GERD', 'abdominal-pain'] },
  'Pantoprazole': { p: 'safe', pN: 'Compatible', pAlt: [], l: 'safe', lN: 'Low levels', ind: ['GERD'] },
  'Ranitidine': { p: 'safe', pN: 'Long track record', pAlt: [], l: 'safe', lN: 'Compatible', ind: ['GERD'] },
  'Famotidine': { p: 'safe', pN: 'Compatible', pAlt: [], l: 'safe', lN: 'Compatible', ind: ['GERD'] },
  // === Other: gout ===
  'Allopurinol': { p: 'avoid', pN: 'Limited data; possible teratogenicity', pAlt: [], l: 'caution', lN: 'Excreted in milk; monitor', ind: [] },
  'Febuxostat': { p: 'avoid', pN: 'No human data', pAlt: [], l: 'avoid', lN: 'No data', ind: [] },
  'Colchicine': { p: 'caution', pN: 'Use if FMF requires it; limited data', pAlt: [], l: 'caution', lN: 'Excreted in milk', ind: [] },
  // === Other: neuro/psych ===
  'Gabapentin': { p: 'avoid', pN: 'Possible birth defects; limited data', pAlt: [], l: 'caution', lN: 'Excreted but low levels', ind: [] },
  'Pregabalin': { p: 'avoid', pN: 'Teratogenic in animals', pAlt: [], l: 'avoid', lN: 'No data', ind: [] },
  'Sertraline': { p: 'safe', pN: 'Preferred SSRI in pregnancy; most data', pAlt: [], l: 'safe', lN: 'Lowest milk levels of SSRIs', ind: ['depression'] },
  'Fluoxetine': { p: 'caution', pN: 'Long half-life; neonatal adaptation syndrome', pAlt: ['Sertraline'], l: 'caution', lN: 'Active metabolite in milk', ind: ['depression'] },
  'Escitalopram': { p: 'caution', pN: 'Less data than sertraline', pAlt: ['Sertraline'], l: 'caution', lN: 'Excreted in milk', ind: ['depression'] },
  'Paracetamol': { p: 'safe', pN: '1st-line analgesic/antipyretic in pregnancy', pAlt: [], l: 'safe', lN: 'Safe; compatible', ind: ['headache', 'fever', 'back-pain', 'sore-throat', 'abdominal-pain'] },
  'Amoxicillin': { p: 'safe', pN: 'Penicillin class; safe in pregnancy', pAlt: [], l: 'safe', lN: 'Low levels; compatible', ind: ['UTI', 'sore-throat'] },
  'Augmentin': { p: 'safe', pN: 'Safe; avoid if history of cholestasis', pAlt: [], l: 'safe', lN: 'Compatible', ind: ['UTI', 'sore-throat'] },
  'Cephalexin': { p: 'safe', pN: 'Cephalosporin; safe', pAlt: [], l: 'safe', lN: 'Compatible', ind: ['UTI'] },
  'Ceftriaxone': { p: 'safe', pN: 'Safe; avoid near term (bilirubin displacement theory)', pAlt: [], l: 'safe', lN: 'Low levels', ind: [] },
  'Tazocin': { p: 'caution', pN: 'Limited data; use if needed', pAlt: [], l: 'safe', lN: 'Compatible', ind: [] },
  'Meropenem': { p: 'caution', pN: 'Limited data; use if needed', pAlt: [], l: 'safe', lN: 'Low levels', ind: [] },
  'Vancomycin': { p: 'caution', pN: 'No teratogenicity; monitor levels', pAlt: [], l: 'safe', lN: 'Poorly absorbed orally by infant', ind: [] },
  'Ciprofloxacin': { p: 'avoid', pN: 'Cartilage damage in animals; use alternatives', pAlt: ['Amoxicillin', 'Cephalexin'], l: 'caution', lN: 'Low levels; short courses OK', ind: ['UTI'] },
  'Levofloxacin': { p: 'avoid', pN: 'Same as ciprofloxacin', pAlt: ['Amoxicillin', 'Cephalexin'], l: 'caution', lN: 'Short courses OK', ind: ['UTI'] },
  'Fluconazole': { p: 'avoid', pN: 'High-dose teratogenic; single 150mg may be OK', pAlt: [], l: 'safe', lN: 'Compatible; low levels', ind: [] },
  // === Pain / NSAIDs ===
  'Ibuprofen': { p: 'avoid', pN: 'Avoid 3rd tri (premature DA closure); 1st/2nd short course OK', pAlt: ['Paracetamol'], l: 'safe', lN: 'Low levels; compatible short-term', ind: ['headache', 'fever', 'back-pain'] },
  'Naproxen': { p: 'avoid', pN: 'Same as ibuprofen; avoid 3rd tri', pAlt: ['Paracetamol'], l: 'safe', lN: 'Compatible short-term', ind: ['headache', 'back-pain'] },
  'Diclofenac': { p: 'avoid', pN: 'Avoid 3rd tri', pAlt: ['Paracetamol'], l: 'safe', lN: 'Low levels', ind: ['back-pain'] },
  'Mefenamic acid': { p: 'avoid', pN: 'Avoid 3rd tri', pAlt: ['Paracetamol'], l: 'caution', lN: 'Limited data', ind: ['headache'] },
  'Celecoxib': { p: 'avoid', pN: 'Avoid 3rd tri; limited 1st/2nd data', pAlt: ['Paracetamol'], l: 'caution', lN: 'Limited data', ind: [] },
  'Etoricoxib': { p: 'avoid', pN: 'No pregnancy data', pAlt: ['Paracetamol'], l: 'avoid', lN: 'No data', ind: [] },
  'Piroxicam': { p: 'avoid', pN: 'Avoid 3rd tri', pAlt: ['Paracetamol'], l: 'caution', lN: 'Low levels', ind: [] },
  'Indomethacin': { p: 'caution', pN: 'Used short-term for tocolysis <32wk; avoid 3rd tri >32wk', pAlt: ['Paracetamol'], l: 'safe', lN: 'Low levels', ind: [] },
  'Tramadol': { p: 'avoid', pN: 'Neonatal withdrawal if chronic use; short course caution', pAlt: ['Paracetamol'], l: 'caution', lN: 'Low levels; monitor infant sedation', ind: ['back-pain'] },
  'Codeine': { p: 'caution', pN: 'Short course OK; avoid chronic (neonatal withdrawal)', pAlt: ['Paracetamol'], l: 'caution', lN: 'Ultra-rapid metabolizers risk; monitor', ind: ['cough'] },
  'Tolperisone': { p: 'avoid', pN: 'No data', pAlt: [], l: 'avoid', lN: 'No data', ind: ['back-pain'] },
  'Baclofen': { p: 'avoid', pN: 'Limited data; neonatal withdrawal reported', pAlt: [], l: 'caution', lN: 'Low levels in milk', ind: ['back-pain'] },
  // === Steroids ===
  'Prednisolone': { p: 'caution', pN: 'Preferred steroid (less placental transfer); cleft palate risk 1st tri debated', pAlt: [], l: 'safe', lN: 'Low levels; wait 4h after dose', ind: ['rash-allergy'] },
  'Prednisone': { p: 'caution', pN: 'Converted to prednisolone; same profile', pAlt: [], l: 'safe', lN: 'Low levels', ind: ['rash-allergy'] },
  'Methylprednisolone': { p: 'caution', pN: 'Use if needed; short course preferred', pAlt: ['Prednisolone'], l: 'safe', lN: 'Compatible', ind: ['rash-allergy'] },
  'Dexamethasone': { p: 'caution', pN: 'Crosses placenta fully; used for fetal lung maturity', pAlt: ['Prednisolone'], l: 'safe', lN: 'Compatible', ind: [] },
  'Hydrocortisone': { p: 'safe', pN: 'Physiologic replacement safe', pAlt: [], l: 'safe', lN: 'Safe', ind: ['rash-allergy'] },
  'Fludrocortisone': { p: 'caution', pN: 'Use if adrenal insufficiency', pAlt: [], l: 'caution', lN: 'Unknown', ind: [] },
  'Betamethasone': { p: 'caution', pN: 'Standard for fetal lung maturity 24-34wk', pAlt: [], l: 'safe', lN: 'Compatible', ind: [] },
  // === Antihistamines ===
  'Chlorpheniramine': { p: 'safe', pN: 'Long track record; 1st-gen preferred in pregnancy', pAlt: [], l: 'caution', lN: 'May reduce milk supply; sedation in infant', ind: ['nasal-congestion', 'rash-allergy', 'insomnia'] },
  'Loratadine': { p: 'safe', pN: 'Preferred 2nd-gen antihistamine in pregnancy', pAlt: [], l: 'safe', lN: 'Low levels; compatible', ind: ['nasal-congestion', 'rash-allergy'] },
  'Cetirizine': { p: 'safe', pN: 'Compatible; less data than loratadine', pAlt: ['Loratadine'], l: 'safe', lN: 'Compatible', ind: ['nasal-congestion', 'rash-allergy'] },
  'Fexofenadine': { p: 'caution', pN: 'Less data; loratadine preferred', pAlt: ['Loratadine'], l: 'safe', lN: 'Compatible', ind: ['nasal-congestion', 'rash-allergy'] },
  // === Cough/Cold ===
  'Dextromethorphan': { p: 'safe', pN: 'Compatible; extensive experience', pAlt: [], l: 'safe', lN: 'Compatible', ind: ['cough'] },
  'Ambroxol': { p: 'caution', pN: 'Avoid 1st tri; OK 2nd/3rd', pAlt: ['Guaifenesin'], l: 'safe', lN: 'Compatible', ind: ['cough'] },
  'Bromhexine': { p: 'caution', pN: 'Limited data; avoid 1st tri', pAlt: ['Guaifenesin'], l: 'caution', lN: 'Limited data', ind: ['cough'] },
  'Guaifenesin': { p: 'safe', pN: 'Compatible', pAlt: [], l: 'safe', lN: 'Compatible', ind: ['cough'] },
  // === GI extras ===
  'Ondansetron': { p: 'safe', pN: 'Widely used for hyperemesis; slight cleft palate debate but accepted', pAlt: [], l: 'safe', lN: 'Compatible', ind: ['nausea'] },
  'Metoclopramide': { p: 'safe', pN: 'Used for hyperemesis; long experience', pAlt: [], l: 'caution', lN: 'May increase milk supply; EPS in infant rare', ind: ['nausea'] },
  'Domperidone': { p: 'caution', pN: 'Less data than metoclopramide', pAlt: ['Metoclopramide'], l: 'safe', lN: 'Used as galactagogue; low levels', ind: ['nausea'] },
  'Lactulose': { p: 'safe', pN: 'Not absorbed; safe', pAlt: [], l: 'safe', lN: 'Safe', ind: ['constipation'] },
  'Loperamide': { p: 'caution', pN: 'Short course OK; avoid chronic', pAlt: [], l: 'safe', lN: 'Low levels', ind: ['diarrhea'] },
  // === Antibiotics gap-fill ===
  'Azithromycin': { p: 'safe', pN: 'Compatible; used for STI/resp', pAlt: [], l: 'safe', lN: 'Low levels', ind: ['sore-throat', 'cough'] },
  'Doxycycline': { p: 'contraindicated', pN: 'Teeth/bone staining; avoid all trimesters', pAlt: ['Azithromycin', 'Amoxicillin'], l: 'safe', lN: 'Short course compatible; Ca in milk binds it', ind: [] },
  'Metronidazole': { p: 'caution', pN: 'Avoid 1st tri if possible; 2nd/3rd tri OK', pAlt: [], l: 'caution', lN: 'Withhold BF 12-24h after dose', ind: [] },
  'Bactrim (TMP-SMX)': { p: 'avoid', pN: 'Folate antagonist; avoid 1st tri + near term (kernicterus)', pAlt: ['Amoxicillin', 'Cephalexin'], l: 'caution', lN: 'Avoid in G6PD infant/jaundice', ind: ['UTI'] },
  'Nitrofurantoin': { p: 'caution', pN: 'OK 2nd tri; avoid 1st tri + near term (hemolysis)', pAlt: ['Cephalexin'], l: 'safe', lN: 'Compatible; avoid G6PD infant', ind: ['UTI'] },
  'Erythromycin': { p: 'safe', pN: 'Safe; avoid estolate form (hepatotoxic)', pAlt: [], l: 'safe', lN: 'Compatible', ind: ['sore-throat'] },
  'Clindamycin': { p: 'safe', pN: 'Compatible', pAlt: [], l: 'safe', lN: 'Compatible', ind: [] },
  // === Hematology ===
  'Ferrous sulfate': { p: 'safe', pN: 'Recommended in pregnancy anemia', pAlt: [], l: 'safe', lN: 'Safe', ind: [] },
  'Folic acid': { p: 'safe', pN: 'Essential; 400-5000 mcg preconception + pregnancy', pAlt: [], l: 'safe', lN: 'Safe', ind: [] },
  'Vitamin K (Phytonadione)': { p: 'safe', pN: 'Safe; given to neonates routinely', pAlt: [], l: 'safe', lN: 'Safe', ind: [] },
  'Tranexamic acid': { p: 'caution', pN: 'Use if needed for bleeding; crosses placenta', pAlt: [], l: 'safe', lN: 'Low levels', ind: [] },
  // === Endo: Thyroid + misc ===
  'Levothyroxine': { p: 'safe', pN: 'Essential; increase dose 30-50% in pregnancy', pAlt: [], l: 'safe', lN: 'Safe; minimal transfer', ind: [] },
  'PTU (Propylthiouracil)': { p: 'caution', pN: 'Preferred 1st tri (less teratogenic than methimazole); hepatotoxic', pAlt: [], l: 'safe', lN: 'Low levels; compatible', ind: [] },
  'Methimazole': { p: 'avoid', pN: 'Aplasia cutis + choanal atresia 1st tri; OK 2nd/3rd', pAlt: ['PTU (Propylthiouracil)'], l: 'safe', lN: 'Low levels; compatible', ind: [] },
  'Desmopressin (DDAVP)': { p: 'safe', pN: 'Safe for DI in pregnancy', pAlt: [], l: 'safe', lN: 'Compatible', ind: [] },
  'Octreotide': { p: 'caution', pN: 'Limited data; use if acromegaly requires', pAlt: [], l: 'caution', lN: 'Unknown', ind: [] },
  'Bromocriptine': { p: 'avoid', pN: 'Discontinue when pregnancy confirmed', pAlt: [], l: 'avoid', lN: 'Suppresses lactation', ind: [] },
  'Cabergoline': { p: 'avoid', pN: 'Discontinue when pregnancy confirmed', pAlt: [], l: 'avoid', lN: 'Suppresses lactation', ind: [] },
  'Calcitonin': { p: 'caution', pN: 'Limited data; inhibits lactation in animals', pAlt: [], l: 'avoid', lN: 'May inhibit lactation', ind: [] },
  // === OB ===
  'COC (Combined oral contraceptive)': { p: 'contraindicated', pN: 'Not for use in pregnancy', pAlt: [], l: 'avoid', lN: 'Reduces milk supply; use POP instead', ind: [] },
  'POP (Progestin-only pill)': { p: 'contraindicated', pN: 'Not for use in pregnancy', pAlt: [], l: 'safe', lN: 'Compatible; no effect on milk supply', ind: [] },
  'DMPA (Depo-Provera)': { p: 'contraindicated', pN: 'Not for use in pregnancy', pAlt: [], l: 'safe', lN: 'Can start 6wk postpartum', ind: [] },
  'Levonorgestrel EC': { p: 'avoid', pN: 'EC only; not abortifacient; no harm if already pregnant', pAlt: [], l: 'safe', lN: 'Single dose OK', ind: [] },
  'Ulipristal EC': { p: 'avoid', pN: 'Avoid if pregnant', pAlt: [], l: 'avoid', lN: 'Withhold BF 1 week', ind: [] },
  'Etonogestrel implant': { p: 'contraindicated', pN: 'Remove if pregnant', pAlt: [], l: 'safe', lN: 'Compatible', ind: [] },
  'MgSO4': { p: 'safe', pN: 'Standard for eclampsia/pre-eclampsia', pAlt: [], l: 'safe', lN: 'Compatible', ind: ['seizure', 'hypertension'] },
  'Methyldopa': { p: 'safe', pN: '1st-line antihypertensive in pregnancy; most data', pAlt: [], l: 'safe', lN: 'Compatible', ind: ['hypertension'] },
  'Labetalol': { p: 'safe', pN: '1st-line for pregnancy HTN; IV for acute', pAlt: [], l: 'safe', lN: 'Compatible; low levels', ind: ['hypertension'] },
  'Oxytocin': { p: 'caution', pN: 'Induction/PPH only; uterine hyperstimulation risk', pAlt: [], l: 'safe', lN: 'Short half-life; compatible', ind: [] },
  'Misoprostol': { p: 'contraindicated', pN: 'Abortifacient; use only for PPH/induction under supervision', pAlt: [], l: 'caution', lN: 'Wait 1-2h after dose', ind: [] },
  // === Emergency ===
  'Atropine': { p: 'caution', pN: 'Use in emergency; crosses placenta', pAlt: [], l: 'caution', lN: 'May suppress lactation', ind: [] },
  'Adenosine': { p: 'safe', pN: 'Ultra-short half-life; safe for SVT', pAlt: [], l: 'safe', lN: 'Safe', ind: [] },
  'Calcium gluconate': { p: 'safe', pN: 'Safe for hyperkalemia/emergency', pAlt: [], l: 'safe', lN: 'Safe', ind: [] },
  'Naloxone': { p: 'caution', pN: 'Use in emergency; may precipitate withdrawal', pAlt: [], l: 'safe', lN: 'Poorly absorbed orally', ind: [] },
  'Flumazenil': { p: 'caution', pN: 'Use in emergency only', pAlt: [], l: 'caution', lN: 'Unknown', ind: [] },
  'Epinephrine': { p: 'safe', pN: 'Life-saving; use for anaphylaxis without hesitation', pAlt: [], l: 'safe', lN: 'Short half-life', ind: [] },
  // === Smoking/Alcohol ===
  'Varenicline': { p: 'avoid', pN: 'No human data; NRT preferred', pAlt: [], l: 'avoid', lN: 'No data', ind: [] },
  'Thiamine (Vitamin B1)': { p: 'safe', pN: 'Safe; recommended supplement', pAlt: [], l: 'safe', lN: 'Safe', ind: [] },
  'Chlordiazepoxide': { p: 'avoid', pN: 'Benzo; neonatal withdrawal + floppy infant', pAlt: [], l: 'avoid', lN: 'Accumulates in infant', ind: [] },
  // === Resp ===
  'Salbutamol': { p: 'safe', pN: 'Safe for asthma; inhaled preferred', pAlt: [], l: 'safe', lN: 'Safe', ind: ['cough'] },
  'Budesonide': { p: 'safe', pN: 'Preferred ICS in pregnancy; most data', pAlt: [], l: 'safe', lN: 'Inhaled = minimal systemic', ind: ['cough'] },
  'Ipratropium': { p: 'safe', pN: 'Inhaled; minimal systemic absorption', pAlt: [], l: 'safe', lN: 'Safe', ind: ['cough'] },
  'Tiotropium': { p: 'caution', pN: 'Limited data; ipratropium preferred', pAlt: ['Ipratropium'], l: 'caution', lN: 'Unknown', ind: ['cough'] },
  'Montelukast': { p: 'safe', pN: 'Compatible; can continue', pAlt: [], l: 'safe', lN: 'Compatible', ind: ['cough'] },
  // === Weight/Bone ===
  'Tirzepatide (Mounjaro)': { p: 'contraindicated', pN: 'Discontinue 2mo before conception', pAlt: ['Insulin RI'], l: 'avoid', lN: 'No data', ind: [] },
  'Orlistat': { p: 'avoid', pN: 'Weight loss not recommended in pregnancy', pAlt: [], l: 'avoid', lN: 'Minimal absorption but avoid', ind: [] },
  'Alendronate': { p: 'contraindicated', pN: 'Bone incorporation; theoretical fetal risk', pAlt: [], l: 'caution', lN: 'Unknown excretion', ind: [] },
  'Risedronate': { p: 'contraindicated', pN: 'Same as alendronate', pAlt: [], l: 'caution', lN: 'Unknown', ind: [] },
  // === Psych ===
  'Haloperidol': { p: 'caution', pN: 'Use if needed for psychosis/delirium; limb defects debated', pAlt: [], l: 'caution', lN: 'Low levels; monitor infant sedation', ind: [] },
  'Quetiapine': { p: 'caution', pN: 'Limited data; use if needed', pAlt: [], l: 'caution', lN: 'Low levels', ind: ['insomnia'] },
  'Lorazepam': { p: 'avoid', pN: 'Neonatal withdrawal/floppy infant; short course only if essential', pAlt: [], l: 'caution', lN: 'Low levels; short-acting preferred benzo', ind: ['insomnia'] },
  'Diazepam': { p: 'avoid', pN: 'Floppy infant + withdrawal; long half-life', pAlt: ['Lorazepam'], l: 'avoid', lN: 'Active metabolites accumulate', ind: [] },
  // === Neuro/Seizure ===
  'Phenytoin': { p: 'avoid', pN: 'Fetal hydantoin syndrome; use levetiracetam if possible', pAlt: ['Levetiracetam', 'Lamotrigine'], l: 'safe', lN: 'Low levels; compatible', ind: ['seizure'] },
  'Carbamazepine': { p: 'avoid', pN: 'NTD 1-2%; spina bifida risk; folic acid 5mg essential', pAlt: ['Levetiracetam', 'Lamotrigine'], l: 'safe', lN: 'Compatible; monitor infant', ind: ['seizure'] },
  'Valproic acid': { p: 'contraindicated', pN: 'NTD 5-10%; cognitive impairment; absolutely avoid', pAlt: ['Levetiracetam', 'Lamotrigine'], l: 'safe', lN: 'Compatible; low levels', ind: ['seizure'] },
  'Levetiracetam': { p: 'safe', pN: 'Preferred AED in pregnancy; lowest malformation rate', pAlt: [], l: 'safe', lN: 'Compatible', ind: ['seizure'] },
  'Lamotrigine': { p: 'safe', pN: 'Preferred AED; increase dose in pregnancy (clearance rises)', pAlt: [], l: 'safe', lN: 'Excreted but generally compatible', ind: ['seizure'] },
  'Sumatriptan': { p: 'caution', pN: 'Registry data reassuring; use if migraine severe', pAlt: ['Paracetamol'], l: 'safe', lN: 'Withhold BF 12h or use; low levels', ind: ['headache'] },
  'Amitriptyline': { p: 'caution', pN: 'Limited data; neonatal withdrawal possible', pAlt: ['Paracetamol'], l: 'caution', lN: 'Low levels; monitor sedation', ind: ['headache', 'depression', 'insomnia'] },
  'Cafergot': { p: 'contraindicated', pN: 'Ergotamine = uterine contraction → abortion risk; absolutely avoid', pAlt: ['Paracetamol', 'Sumatriptan'], l: 'contraindicated', lN: 'Ergotamine suppresses lactation + infant ergotism risk', ind: ['headache'] },
  'Flunarizine': { p: 'avoid', pN: 'Limited data; avoid in pregnancy', pAlt: ['Paracetamol'], l: 'avoid', lN: 'Excreted in milk; long half-life', ind: ['headache'] },
  'Hyoscine': { p: 'caution', pN: 'Use if needed; limited data but long experience', pAlt: [], l: 'safe', lN: 'Poorly absorbed; compatible', ind: ['abdominal-pain', 'nausea'] },
}

/** Lookup pregnancy/lactation info by drug name */
export function getPregnancyInfo(name) {
  if (!name) return null
  return D[name] || null
}

/** Get drugs matching a symptom, sorted safe→caution→avoid for given context */
export function searchBySymptom(symptomKey, context) {
  const isBF = context === 'breastfeeding'
  const results = []
  for (const med of MEDICATIONS) {
    const d = D[med.name]
    if (!d) continue
    if (!d.ind || !d.ind.includes(symptomKey)) continue
    const safety = isBF ? d.l : d.p
    if (!safety) continue
    results.push({ ...med, ...d, _safety: safety })
  }
  const order = { safe: 0, caution: 1, avoid: 2, contraindicated: 3 }
  results.sort((a, b) => (order[a._safety] ?? 9) - (order[b._safety] ?? 9))
  return results
}

/** Quick search: find drug by name/generic/brand and return pregnancy/lactation status */
export function searchDrugPregnancy(query) {
  if (!query || query.trim().length < 1) return []
  const q = query.toLowerCase()
  return MEDICATIONS
    .filter(m =>
      m.name.toLowerCase().includes(q)
      || m.generic.toLowerCase().includes(q)
      || (BRAND_MAP[m.name] && BRAND_MAP[m.name].some(b => b.toLowerCase().includes(q)))
    )
    .map(m => ({ ...m, ...D[m.name] }))
    .slice(0, 10)
}
