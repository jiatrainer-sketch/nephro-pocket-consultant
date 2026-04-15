# Daily Check Routine — nephro-pocket-consultant

Runs: **daily 07:00 GMT+7**
Repo: `jiatrainer-sketch/nephro-pocket-consultant`
Connectors: bioRxiv · Clinical Trials · ICD-10 · Vercel
  (Supabase is not used — the app stores data in browser `localStorage` only)

> Paste the "Prompt" section below into the Claude Code Routine UI.
> This file is the source of truth; keep the UI in sync with it.

---

## Prompt

Read `CLAUDE.md` first — obey the safety rules there.

### [1] Build & code health

Run, in order:

```bash
npm install
npm run build
npm test
```

If any step fails, that is the top-priority finding for today.

Also scan `src/` for:

- syntax errors, unused imports, orphan `console.log`
- Tailwind class typos (`bg-blu-500`, etc.)
- accessibility regressions (missing `aria-label`, button without text)

### [2] Medical content watch  (bioRxiv + Clinical Trials)

Query last 7 days for: `hemodialysis`, `CKD`, `KDIGO`, `renal dosing`,
`anemia CKD`, `mineral bone disease CKD`.

For each hit that plausibly contradicts or extends
`src/recommendations.js`:

- list title + source URL + 1-line summary
- do **not** edit `recommendations.js` or `medicationDatabase.js`
- instead, queue it for the Issue in step [5]

### [3] Drug-safety spot check  (ICD-10 connector for reference)

In `src/medicationDatabase.js` and `src/recommendations.js`, sanity-check
the renal-adjusted drugs below. Flag only concrete, sourceable issues.

- losartan · metformin · gabapentin · pregabalin · allopurinol
- dapagliflozin · empagliflozin · canagliflozin
- enoxaparin · vancomycin · ciprofloxacin · levofloxacin

### [4] Deployment health  (Vercel connector)

- latest production deploy status + timestamp
- if the latest deploy is `ERROR` or `CANCELED`, this is priority-1

### [5] Action policy

| Finding type | Action |
|---|---|
| Build / test / lint failure | branch `claude/fix-<slug>-<YYYYMMDD>` + PR |
| Typo, dead code, a11y, Tailwind fix | branch + PR (small, focused) |
| Drug dose add / change (any entry in `medicationDatabase.js` `dosage` field) | **comment on Issue #1 "Drug Dose Reference Review"** — one row per drug, cite source, never open a branch |
| Medical content update (guideline, threshold, renal formula) | **Issue only** — cite source, tag `medical-review` |
| Vercel deploy failure | **Issue only** — attach last deploy log excerpt |
| Nothing to do | single comment `✅ All clear YYYY-MM-DD` on a tracking issue (do not open a new issue) |

Hard rules:

- never edit `src/recommendations.js` or the `dosage` / `source` /
  `lastReviewed` fields in `src/medicationDatabase.js` via an auto-PR
- drug dose content ONLY enters `medicationDatabase.js` after a physician
  signs off in the "Drug Dose Reference Review" Issue — a human must open
  that PR, not the Routine
- never remove or weaken the "แพทย์ต้อง confirm" disclaimer
- never introduce network calls, analytics, or a backend
- at most **one PR and one Issue per day** from this routine
- report must reflect the ACTUAL git diff made, not the work planned
  (no claims of changes that were not committed)

### [6] Report format

Post the report as a comment on the tracking issue (create one titled
"Daily Check Log" if none exists). Use:

```markdown
## 🌅 Daily Check YYYY-MM-DD

- Build: ✅ / ⚠️ / ❌  (<reason if not ✅>)
- Tests: ✅ / ⚠️ / ❌  (<n passed / n total>)
- Drug DB: ✅ / ⚠️   (<issues>)
- Medical updates: <count>  (<top title or "—">)
- Vercel: ✅ / ❌   (<last deploy status>)

### Actions
- PR: <link or "none">
- Issue: <link or "none">

### Medical watch (no code change made)
- <bullet list or "—">
```

Keep the whole comment under ~40 lines.

---

## Change log

- **2026-04-15** — initial version
