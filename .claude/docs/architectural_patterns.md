# Architectural Patterns

## 1. Client-side routing via `switchMode()`
All navigation is handled by a single function in `app.js`. There are no separate HTML pages.

- `switchMode(mode)` (`app.js` ~line 379): saves current tab state, hides all `*-panel` elements, shows the target panel, then calls `init{Mode}()` if it exists.
- Every tool has an `init{ToolName}()` function (e.g. `initHomeLoan()`, `initMFExplorer()`) that bootstraps its UI and restores persisted state.
- **Adding a new tool:** register the route in `switchMode()` first, add a panel `div` with id `{mode}-panel` in `index.html`, then create the `init` function in a new JS file loaded after `app.js`.

## 2. Module pattern — one file, one feature
Each tool lives in its own JS file. Files are loaded via `<script>` tags (not ES modules), so everything is global. Convention to avoid collisions:

- **Private state:** prefixed with `_` and scoped to the file (e.g. `_mfeList`, `_mfcFunds`, `_fpState`).
- **Public functions:** unprefixed, called from `onclick` handlers in HTML or from `switchMode()`.
- **Init function:** always named `init{Feature}()`, always called by the router.
- File sizes are large (up to 6 k lines) because all feature logic is co-located in one file.

## 3. Two-tier state persistence
State is written to **two places** on every meaningful user action:

1. **localStorage** (immediate, offline-capable): tab inputs, fund lists, dashboard favorites.
   - Keys: `aw_growth_mode`, `am_mfc_funds`, `am_mfe_category`, `aw_dash_favs`
   - All reads/writes are wrapped in `try/catch` to handle quota errors silently.
2. **Firestore** (cloud, after login): full user data synced via `saveUserData()` (`auth.js`).
   - Writes are debounced 1.5 s and use `{ merge: true }` to avoid overwriting unrelated fields.
   - On login, `loadUserData()` fetches the Firestore doc and restores all calculator inputs.
   - Firestore path: `/users/{uid}` — one document per user, nested sub-objects per tool.

**Pattern:** every calculation function ends with a call to `saveUserData()`.

## 4. Auth-gated data load
`auth.js` sets up `_fbAuth.onAuthStateChanged()` as the single entry point for post-login work. When a user signs in, it calls `loadUserData()` which pulls Firestore state and then calls `restoreTabState()` to repopulate the DOM. No tool should fetch user data independently.

## 5. Async API calls — batched with `Promise.allSettled`
All external fetches (to `api.mfapi.in`) follow the same pattern:

- Requests are grouped into batches (8–15 concurrent) to avoid rate-limiting.
- `Promise.allSettled()` is used so one failure doesn't abort the batch — failed entries fall back to `null`.
- Each fetch gets an `AbortSignal.timeout(20000)` to prevent hanging.
- Results are cached per session in module-level variables (e.g. `_mfeMetCache`, `_mfeNavCache`) keyed by fund code + category, so switching categories doesn't re-fetch.
- The nightly script (`scripts/compute-mf-scores.js`) adds exponential-backoff retry on top of this (3 attempts, delay × attempt number).

## 6. Input parsing convention
User-facing number inputs accept formatted strings (e.g. `"12,34,567"`). Before any calculation, inputs are sanitised with a helper that strips commas and non-numeric characters, then parses as float — see `hlNum()` in `home-loan.js:18`. The same pattern appears inline across `app.js` and `dashboard.js`.

## 7. Chart.js lifecycle
Each calculator that renders a chart stores its `Chart` instance in a module-level variable. Before re-drawing, the old instance is destroyed with `.destroy()`. Charts are never shared across tools.

## 8. Financial constants (do not change without domain verification)
- Risk-free rate: `0.065` (6.5% — India 91-day T-bill proxy), used in Sharpe/Sortino in `mf-explorer.js` and `scripts/compute-mf-scores.js`.
- LTCG exemption: ₹1,25,000/year; LTCG rate: 12.5%; STCG rate: 20% — used in `tax-guide.js`.
- 87A rebate threshold: ₹12L (Budget 2025) — `tax-guide.js`.
- EMI formula: `EMI = P × r × (1+r)^n / ((1+r)^n – 1)` — `home-loan.js`.

## 9. Tailwind + custom CSS co-existence
Tailwind utility classes are used for layout and spacing directly in HTML/JS-generated markup. Brand colours, animations, scrollbar styles, and component-specific overrides live in `styles.css` via CSS custom properties (`--brand-primary`, `--brand-teal`, `--brand-gold`). When in conflict, `styles.css` wins because it is loaded after the Tailwind CDN.
