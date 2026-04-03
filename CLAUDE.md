# AishwaryaMasthu — CLAUDE.md

## What this is
A Firebase-hosted single-page app for personal finance in India. Tools: Mutual Fund Explorer, Fund Comparator, Home Loan Calculator, Tax Guide, Financial Plan, Dashboard. No build step — vanilla JS runs directly in the browser.

## Tech stack
- **Frontend:** Vanilla JS (ES2020), Tailwind CSS (CDN), Chart.js (CDN)
- **Auth & DB:** Firebase Auth + Firestore (compat SDK, loaded via CDN in `auth.js`)
- **Hosting:** Firebase Hosting (`firebase.json` serves `public/`)
- **External API:** `api.mfapi.in` — mutual fund NAV and history data
- **Batch script:** `scripts/compute-mf-scores.js` — Node.js nightly job, writes `output/mf-data.json`

## Key directories
| Path | Purpose |
|------|---------|
| `public/` | All browser-executed code and the HTML shell |
| `public/index.html` | Single HTML file; loads scripts in dependency order |
| `public/app.js` | Routing (`switchMode()`), Growth/Goal/Inflation calculators, tab state |
| `public/auth.js` | Firebase init, `loadUserData()`, `saveUserData()` (debounced Firestore writes) |
| `public/dashboard.js` | Dashboard hub, Financial Plan, tool catalog (26 tools) |
| `public/mf-explorer.js` | 3-step async data loader for mutual funds |
| `public/fund-comparator.js` | Side-by-side fund comparison (max 5 funds) |
| `public/home-loan.js` | EMI, prepayment, rent-vs-buy, tax savings |
| `public/tax-guide.js` | Old/New regime comparison, post-tax return calculator |
| `public/styles.css` | All shared styles — the only stylesheet |
| `scripts/` | Node.js build utilities (not served to browser) |
| `output/` | Generated files (do not edit manually) |
| `.firebase/` | Firebase deploy cache (do not edit) |

## Commands
```bash
firebase emulators:start          # Local dev with Firebase emulators
firebase deploy --only hosting    # Deploy frontend
firebase deploy --only firestore  # Deploy Firestore rules only
node scripts/compute-mf-scores.js # Regenerate output/mf-data.json
```
Never run `firebase deploy` (full) without explicit user confirmation.

## Critical rules
- **Currency:** display with `toLocaleString('en-IN')` — always ₹, never truncate, round to 2dp
- **Tax slabs:** New regime uses Budget 2025 slabs (87A rebate ≤₹12L) — verify before changing (`tax-guide.js:1`)
- **MF data:** treat `mfapi.in` responses as read-only; never mutate fetched objects
- **Routing:** new tools must be registered in `app.js` (`switchMode()`) before anything else works
- **Styles:** all CSS goes in `styles.css`; no inline styles injected from JS
- **Auth:** Firebase Auth is the only source of truth for sessions — no custom auth logic
- **Firestore saves:** always go through `saveUserData()` in `auth.js` (debounced, merged writes)
- **Input parsing:** strip formatting before parsing — see `hlNum()` in `home-loan.js:18`

## Additional documentation
Check these when working on the relevant area:

| File | When to read |
|------|-------------|
| `.claude/docs/architectural_patterns.md` | Routing, state management, data persistence, API patterns, module conventions |
