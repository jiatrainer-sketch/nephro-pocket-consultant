# Nephro Pocket Consultant — Claude Context

Clinical decision support (CDS) web app for hemodialysis / CKD patient management
at รพ.ดอนตูม. Mobile-friendly SPA, data kept in browser `localStorage` only.

## Stack

- **Frontend**: React 18 + Vite 5 + Tailwind
- **Storage**: browser `localStorage` (no backend, no Supabase despite what a
  Routine connector list might imply)
- **AI Chat**: Anthropic API, user-provided key in Settings
- **Deploy**: Vercel (see `vercel.json`)
- **Tests**: Vitest (`npm test`)

## Layout

| Path | Role |
|------|------|
| `src/App.jsx` | Root; patient list, add/delete, view routing |
| `src/storage.js` | `localStorage` IO, date parsing, CKD staging |
| `src/medicationDatabase.js` | Drug name/generic list + timing/frequency options |
| `src/recommendations.js` | **Medical logic** — CPG recommendation engine |
| `src/components/PatientDetail.jsx` | Tabbed patient view (Info/Lab/Med/Rec/Chat) |
| `src/components/QuickMode.jsx` | One-shot input → recommendation (no save) |
| `src/components/{Info,Lab,Med,Recommendation,Chat}Tab.jsx` | Tab views |

## Guidelines backing `recommendations.js`

- Thailand CPG Anemia 2021 + KDIGO 2026 Anemia
- KDIGO 2017 / 2025 MBD
- KDIGO 2024 CKD

Anything touching this file is **medical content**.

## Safety rules (critical)

This app gives clinical recommendations. Wrong logic can harm patients.
When acting automatically (Routines, on-PR, etc.) follow these rules:

1. **Never modify medical logic** (`src/recommendations.js`,
   `src/medicationDatabase.js` content, threshold values in any tab) without
   opening an **Issue** first that cites a source (guideline, paper, FDA label).
   Do not push an auto-fix PR for these files.
2. **Code-quality fixes are fine to auto-PR**: typos, dead code, broken imports,
   build errors, Tailwind class fixes, accessibility, non-medical UI copy.
3. **Disclaimer must stay**: the "แพทย์ต้อง confirm ก่อนสั่งยาเสมอ" text in
   `App.jsx` and any analogous disclaimer in tabs must not be removed or softened.
4. **No telemetry / no external data send**: do not add analytics, error
   reporters, or any network call beyond the existing Anthropic chat.
5. **Patient data stays local**: do not introduce a backend, Supabase, or any
   persistent store outside `localStorage` without explicit user approval.

## How to verify a change

```bash
npm install
npm run build   # must succeed
npm test        # must pass
```

Vitest covers the deterministic pieces of `storage.js` and
`medicationDatabase.js`. Medical logic in `recommendations.js` is **not**
auto-tested — changes there need human review.

## Branch / PR conventions

- Feature / autofix work on `claude/<topic>-<date>` branches
- Commits: short imperative subject (see `git log` for style, e.g.
  "Add Drug-eGFR alerts…", "Fix: condition/allergy + button…")
- Only open a PR when the user asks, or when a Routine rule explicitly allows it

## Routines

Scheduled Claude Code runs live in `.claude/routines/`. Current routines:

- `daily-check.md` — daily 07:00 GMT+7 health check

Read the routine file before running — it contains the scope and action policy
the Routine must follow.
