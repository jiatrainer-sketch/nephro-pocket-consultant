# 🎬 Storyboard — "Agonal Breathing คืออะไร?"

> **Format:** 9:16 (vertical) · **Length:** ~75 sec · **Style:** Cinematic + Medical Education
> **Use:** Facebook / TikTok / Reels (ตัดเป็น cut สั้น 15–30 วิ ได้)
> **Production note:** ตัวสคริปต์นี้เขียนเพื่อป้อนเข้า text-to-video AI (Google Veo / Flow).
> Narration ไทยใช้พากย์/subtitle. **Prompt วิดีโอเขียนเป็นภาษาอังกฤษ** เพราะ Veo/Flow
> ทำตามคำสั่งอังกฤษได้นิ่งและแม่นกว่าไทยมาก.

---

## ⚠️ Medical accuracy note (อ่านก่อนใช้)

เนื้อหาอิงแนวทาง **AHA / ILCOR 2025** สำหรับ Basic Life Support (lay rescuer):

1. **ลำดับที่ถูกต้อง** — ตรวจการตอบสนอง → ตะโกนขอความช่วยเหลือ → โทร 1669 (เปิด
   speaker) → ตรวจการหายใจ **ไม่เกิน 10 วินาที** → ถ้าไม่หายใจ/หายใจเฮือก ให้เริ่ม
   CPR ทันที → ใช้ AED ทันทีเมื่อพร้อม.
2. **lay rescuer ไม่ต้องคลำชีพจร** — สำหรับประชาชนทั่วไป AHA ตัดขั้นตอนคลำชีพจร
   carotid ออก (เพราะคลำผิดบ่อย) ให้ดู "ไม่ตอบสนอง + ไม่หายใจ/เฮือก = เริ่ม CPR".
   (เวอร์ชันบุคลากรการแพทย์เท่านั้นที่คลำชีพจรพร้อมดูหายใจใน ≤10 วิ.)
3. **Agonal breathing ≠ การหายใจ** — เป็นสัญญาณของภาวะหัวใจหยุดเต้น (cardiac
   arrest) ห้ามตีความว่า "ยังหายใจอยู่".
4. คลิปนี้เป็น **สื่อให้ความรู้** ไม่แทนการอบรม CPR แบบลงมือจริง — ควรมี end card
   แนะนำให้ไปอบรม BLS.

> ✏️ เทียบกับสคริปต์เดิม: SHOT 5–6 เดิมแยก "ตรวจการตอบสนอง" กับ "เช็กหายใจ" โดยยัง
> ไม่โทร 1669 จน SHOT 8 — ในเวอร์ชันนี้ขยับ "ตะโกน/โทร 1669" มาก่อนเริ่ม CPR ให้ตรง
> ลำดับ AHA. หัวเรื่องเดิมเขียน 70 วิ แต่รวม shot ได้ ~75 วิ จึงใช้ 75 วิ.

---

## 🎨 Global style prompt (ใส่ทุกช็อต)

ต่อท้าย/นำหน้า prompt ของทุกช็อตด้วยบล็อกนี้เพื่อคุมโทนภาพให้ต่อเนื่อง:

```
STYLE: ultra-realistic Thai hospital / home simulation, warm cinematic lighting,
natural skin tones, no overacting, documentary realism, medically accurate,
shallow depth of field, Sony FX3 look, 85mm portrait lens, 4K, vertical 9:16,
film grain subtle, color grade teal-amber.
```

**Negative / avoid:** `cartoonish, exaggerated gore, text artifacts, distorted hands, watermark, oversaturated`

---

## 🎞️ SHOT LIST

### SHOT 1 — Hook · 0:00–0:06
**On screen:** ชายไทย ~58 ปี นอนหมดสติบนพื้นห้องนั่งเล่น ญาติเดินเข้ามา · กล้อง dolly-in ช้า · หน้าอกแทบไม่ขยับ · หายใจเฮือกเป็นพัก ๆ
**Narration (TH):** "ถ้าได้ยินเสียงแบบนี้... อย่าเพิ่งคิดว่า... เขายังหายใจอยู่"
**SFX:** agonal gasp (เฮือก…หยุด…ครืด…เฮือก ไม่สม่ำเสมอ) · low heartbeat · room ambience
**Veo/Flow prompt:**
```
A 58-year-old Thai man lies unconscious on the floor of a modest living room.
A worried family member slowly walks into frame. Slow dolly-in push toward the
man's face and chest. His chest barely moves; occasional irregular agonal gasps,
mouth opening like a fish. Dim warm afternoon light through a window. Tense,
quiet. Handheld stabilized. [+ GLOBAL STYLE]
```

---

### SHOT 2 — Title reveal · 0:06–0:12
**On screen:** จอดำ → ตัวหนังสือแดง **AGONAL BREATHING** · เส้น ECG ค่อย ๆ แบนราบ
**Narration (TH):** "นี่เรียกว่า... Agonal Breathing... หรือ 'การหายใจเฮือก'"
**SFX:** ECG beep ที่ค่อย ๆ เป็นเส้นตรง (flatline tone) · heartbeat จาง
**Veo/Flow prompt:**
```
Black background. Bold red medical title text "AGONAL BREATHING" fades in,
centered. A green ECG line crosses the screen and slowly flattens into a
straight line. Minimal, clinical, ominous. Subtle red glow. [+ GLOBAL STYLE]
```
> 💡 ข้อความบนจอใส่ตอน post (CapCut/Premiere) จะคมกว่าให้ AI เจน text.

---

### SHOT 3 — Why it happens (3D anatomy) · 0:12–0:20
**On screen:** ร่างกายโปร่งแสง 3D · หัวใจหยุดเต้น · เลือดไม่ขึ้นสมอง · ก้านสมองส่งสัญญาณสุดท้าย · กะบังลมหดตัว → เกิดการเฮือก
**Narration (TH):** "หัวใจหยุดเต้นแล้ว... สมองยังพยายามสั่งให้หายใจ... จึงเกิดเสียงเฮือกเป็นพัก ๆ"
**SFX:** deep sub bass · single weak heartbeat แล้วเงียบ
**Veo/Flow prompt:**
```
3D semi-transparent human body, anatomical visualization. The heart stops
beating and dims. Blood flow to the brain fades. The brainstem emits a faint
last neural pulse traveling down to the diaphragm, which contracts sharply,
producing a single gasp. Clean medical 3D render, dark background, glowing
highlights on heart, brain and diaphragm. [+ GLOBAL STYLE]
```

---

### SHOT 4 — Normal vs Agonal (split screen) · 0:20–0:32
**On screen:** Split screen · LEFT: คนหายใจปกติ หน้าอกขึ้นลงสม่ำเสมอ (label "ปกติ / Normal") · RIGHT: agonal เฮือก…หยุด…เฮือก เหมือนกรน (label "เฮือก / Agonal")
**Narration (TH):** "การหายใจปกติ จะสม่ำเสมอ... แต่ Agonal จะเฮือก หอบ เหมือนกรน"
**SFX:** ซ้าย breathing สม่ำเสมอ · ขวา irregular gasp/snore
**Veo/Flow prompt:**
```
Vertical split screen comparison. LEFT half: a calm person breathing normally,
chest rising and falling in a steady rhythm. RIGHT half: a person showing agonal
breathing — sudden irregular gasps with long pauses, snoring-like, mouth gaping.
Clear visual contrast. Clean labels space at top. [+ GLOBAL STYLE]
```

---

### SHOT 5 — Check response · 0:32–0:42
**On screen:** ญาติคุกเข่า แตะไหล่ เขย่าเบา ๆ เรียก "คุณครับ... ได้ยินไหมครับ" · ไม่มีตอบสนอง · close-up ใบหน้านิ่ง
**Narration (TH):** "ขั้นแรก — ตรวจการตอบสนอง เรียกและเขย่าไหล่"
**SFX:** เสียงเรียก · ambience · ไม่มีเสียงตอบ
**Veo/Flow prompt:**
```
Close-up. A family member kneels beside the unconscious man, taps and gently
shakes both his shoulders, leaning in to call out to him. The man's face stays
slack and unresponsive — no reaction. Urgent but controlled. Shallow depth of
field on the face. [+ GLOBAL STYLE]
```

---

### SHOT 6 — Shout for help + call 1669 · 0:42–0:50
**On screen:** ญาติตะโกนขอความช่วยเหลือ → หยิบมือถือ โทร **1669** เปิด speaker phone
**Narration (TH):** "ตะโกนขอความช่วยเหลือ แล้วโทร 1669 ทันที เปิดลำโพง"
**SFX:** เสียงตะโกน "ช่วยด้วย!" · เสียงกดโทร · ringtone 1669
**Veo/Flow prompt:**
```
The rescuer turns their head and shouts for help, then quickly pulls out a
smartphone, dials the emergency number, and switches on speakerphone, placing
the phone on the floor nearby. Fast, decisive movement. Worried expression.
Phone screen visible. [+ GLOBAL STYLE]
```
> 🩺 AHA: โทรขอความช่วยเหลือ/เปิด speaker **ก่อน** เริ่ม CPR (เมื่ออยู่คนเดียว) เพื่อให้ dispatcher ช่วย guide ได้.

---

### SHOT 7 — Check breathing ≤10 sec · 0:50–0:58
**On screen:** ก้มดูหน้าอก/ฟังลมหายใจ · overlay นับถอยหลัง 10 → 0
**Narration (TH):** "ตรวจการหายใจ ไม่เกิน 10 วินาที — ถ้าไม่หายใจ หรือหายใจเฮือก"
**SFX:** clock ticking · heartbeat ตึงขึ้น
**Veo/Flow prompt:**
```
The rescuer leans over the man's chest, looking and listening for normal
breathing for no more than ten seconds. The chest does not rise normally — only
an occasional agonal gasp. A countdown timer overlay space at top. Tense.
Macro detail on the chest. [+ GLOBAL STYLE]
```

---

### SHOT 8 — The rule (red alert) · 0:58–1:04
**On screen:** เต็มจอ พื้นแดง ⚠️ · ข้อความ: **ไม่ตอบสนอง + หายใจเฮือก = หัวใจหยุดเต้น**
**Narration (TH):** "ถ้าไม่ตอบสนอง และหายใจเฮือก ให้ถือว่าหัวใจหยุดเต้นทันที"
**SFX:** alert sting · heartbeat เด่น
**Veo/Flow prompt:**
```
Full-screen red alert background with a warning triangle icon. Strong, urgent
mood. Space reserved for large text. Subtle pulsing red vignette like a heartbeat.
[+ GLOBAL STYLE]
```

---

### SHOT 9 — Start CPR + AED · 1:04–1:12
**On screen:** เริ่ม CPR กดหน้าอกกลางอก · อีกคนเปิดกล่อง AED
**Narration (TH):** "เริ่ม CPR ทันที — กดหน้าอกแรงและเร็ว และใช้ AED ทันทีที่พร้อม"
**SFX:** CPR compression beat (~110/min) · AED voice prompt เบา ๆ
**Veo/Flow prompt:**
```
The rescuer begins chest compressions on the center of the man's chest, arms
straight, pushing hard and fast in a steady rhythm. A second person opens an AED
case nearby and pulls out the pads. Focused, determined. Realistic CPR hand
placement. [+ GLOBAL STYLE]
```
> 🩺 จังหวะ ~100–120 ครั้ง/นาที ลึก ~5 ซม. ปล่อยให้หน้าอกคืนตัวเต็มที่.

---

### SHOT 10 — Hero shot · 1:12–1:15
**On screen:** wide hero shot CPR ต่อเนื่อง · แสงอาทิตย์ส่อง · slow motion · ข้อความ "ทุกวินาทีมีค่า — ยิ่งเริ่ม CPR เร็ว โอกาสรอดยิ่งสูง"
**Narration (TH):** "ทุกวินาที... คือโอกาสรอดชีวิต"
**SFX/Music:** epic hopeful swell
**Veo/Flow prompt:**
```
Wide hero shot, slight low angle. The rescuer continues CPR with determination
as warm golden sunlight streams through the window, backlighting the scene. Slow
motion, dust particles in the light beam. Hopeful, heroic, emotional. Cinematic.
[+ GLOBAL STYLE]
```

---

### END CARD — 1:15+
**On screen:** พื้นขาว · โลโก้ **JIA**
```
จำง่าย
✅ ไม่ตอบสนอง
✅ หายใจเฮือก
=
❤️ เริ่ม CPR ทันที + โทร 1669
```
**เพิ่ม (แนะนำ):** บรรทัดเล็ก "สื่อให้ความรู้ · ควรเข้ารับการอบรม CPR/BLS เพื่อฝึกปฏิบัติจริง"
**Music:** soft piano outro

---

## 🎵 Music arc
`Low heartbeat (SHOT 1–3)` → `Ambient tension (SHOT 4–7)` → `Alert sting (SHOT 8)` → `Epic hopeful (SHOT 9–10)` → `Soft piano (End card)`

## 🔊 SFX checklist
- [ ] Agonal breathing (เฮือก/หอบ ไม่สม่ำเสมอ)
- [ ] ECG beep → flatline tone
- [ ] Heartbeat (low, จาง)
- [ ] Clock ticking (countdown)
- [ ] Phone call 1669 (dial + ringtone)
- [ ] Living-room ambience
- [ ] CPR compression beat
- [ ] AED voice prompt

---

## ✂️ Short-cut versions (สำหรับ Reels/TikTok)
- **15s hook cut:** SHOT 1 → SHOT 8 → END CARD ("เฮือก = หัวใจหยุดเต้น ทำยังไง")
- **30s educational cut:** SHOT 1 → 4 → 6 → 8 → 9 → END CARD
- **Full 75s:** ทั้งหมดตามลำดับ

---

## 🛠️ Workflow แนะนำ
1. เจนทีละช็อตด้วย prompt ข้างบน (Veo/Flow) — เก็บ clip ละ 6–12 วิ
2. ต่อใน CapCut / Premiere / DaVinci — ใส่ text overlay, narration, SFX, music ตอน post (คมกว่าให้ AI เจน text)
3. เช็กลำดับ AHA ตาม medical accuracy note ก่อนเผยแพร่
4. ใส่ disclaimer + แนะนำอบรม BLS ใน end card / caption

> ⚠️ **Disclaimer:** สื่อนี้เป็นความรู้เบื้องต้น ไม่ทดแทนการอบรมกู้ชีพ (BLS/CPR)
> และการตัดสินใจของบุคลากรการแพทย์ ณ จุดเกิดเหตุ.
