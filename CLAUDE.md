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
node scripts/compute-cc-data.js   # Coffee Can screen: Nifty 500 via NSE+Yahoo → public/cc-data.json (nightly via GitHub Actions; cache output/cc-history.json is committed)
node scripts/test-tax-engine.js   # Test tax slab math (run after ANY tax-guide.js change)
```
Never run `firebase deploy` (full) without explicit user confirmation.

## Critical rules
- **Currency:** display with `toLocaleString('en-IN')` — always ₹, never truncate, round to 2dp
- **Tax slabs:** New regime uses Budget 2025 slabs (87A rebate ≤₹12L) — verify before changing (`tax-guide.js:1`) and run `node scripts/test-tax-engine.js` after any change to `tgTaxNew`/`tgTaxOld`
- **MF data:** treat `mfapi.in` responses as read-only; never mutate fetched objects
- **Routing:** new tools must be registered in `app.js` (`switchMode()`) before anything else works
- **Styles:** all CSS goes in `styles.css`; no inline styles injected from JS
- **Auth:** Firebase Auth is the only source of truth for sessions — no custom auth logic
- **Firestore saves:** always go through `saveUserData()` in `auth.js` (debounced, merged writes). Tool data lives in per-tool docs `users/{uid}/tools/{toolId}` (payload under field `v`), never on the user doc — the user doc holds only small account-level fields (`fname`, `riskProfile`, `toolSummaries`). Legacy `appData` is auto-migrated on login
- **Input parsing:** strip formatting before parsing — see `hlNum()` in `home-loan.js:18`
- **Service worker:** bump `CACHE = 'am-vN'` in `public/sw.js` on EVERY deploy that changes `public/` assets (cache-first serving mixes old/new code otherwise), and add any new JS module or panel HTML to the `SHELL` list so offline mode covers it
- **Tax figures:** always include 4% Health & Education Cess (`× 1.04`) and label it, and apply §87A marginal relief above ₹12L in new-regime slab math (`t = Math.min(t, taxable − 12,00,000)`)
- **Translations:** only English lives inline in `public/js/i18n.js`; hi/te/ta dictionaries live in `public/i18n/{hi,te,ta}.json`, lazy-fetched by `loadLangDict()`. Keep key sets identical across all four languages — add new keys to `_T.en` AND all three JSON files

## Additional documentation
Check these when working on the relevant area:

| File | When to read |
|------|-------------|
| `.claude/docs/architectural_patterns.md` | Routing, state management, data persistence, API patterns, module conventions |
