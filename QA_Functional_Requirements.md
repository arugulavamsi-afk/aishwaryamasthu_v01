# Functional Testing Requirements — AishwaryaMasthu
**Version:** 1.0  
**Date:** April 2026  
**Platform:** Web SPA (Firebase-hosted), Vanilla JS, Tailwind CSS  
**External APIs:** Firebase Auth, Firestore, mfapi.in

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Test Environment Setup](#2-test-environment-setup)
3. [Authentication](#3-authentication)
4. [Data Persistence](#4-data-persistence)
5. [Dashboard & Navigation](#5-dashboard--navigation)
6. [Calculators](#6-calculators)
7. [Mutual Fund Tools](#7-mutual-fund-tools)
8. [Special Tools](#8-special-tools)
9. [External API Behavior](#9-external-api-behavior)
10. [Global Input Validation](#10-global-input-validation)
11. [Error Handling](#11-error-handling)
12. [Guest Mode](#12-guest-mode)
13. [Responsive & Mobile](#13-responsive--mobile)
14. [Security](#14-security)
15. [Known Limitations](#15-known-limitations)
16. [Master Test Checklist](#16-master-test-checklist)

---

## 1. Application Overview

AishwaryaMasthu is a single-page personal finance app for Indian users. It requires no build step and runs entirely in the browser. All tools are accessible from a central dashboard. Signed-in users have their data saved automatically to Firestore; guest users get full calculator functionality without persistence.

### Tool Inventory

| # | Tool Name | Key | Data Saved |
|---|-----------|-----|-----------|
| 1 | Growth Calculator | `growth` | Firestore |
| 2 | Goal Planner | `goal` | Firestore |
| 3 | Emergency Fund Calculator | `emergency` | Firestore |
| 4 | Home Loan Advisor | `homeloan` | Firestore |
| 5 | Step-Up SIP Calculator | `stepupsip` | Firestore |
| 6 | EPF Corpus Projector | `epfcalc` | Firestore |
| 7 | PPF & NPS Calculator | `ppfnps` | Firestore |
| 8 | Insurance Adequacy | `insure` | Firestore |
| 9 | MF Explorer | `mfexplorer` | mfapi.in + localStorage |
| 10 | Fund Comparator | `mfcomparator` | localStorage |
| 11 | Tax Guide | `taxguide` | Firestore |
| 12 | Financial Plan | `finplan` | Firestore |
| 13 | CTC Optimizer | `ctcoptimizer` | Firestore |
| 14 | Gratuity Calculator | `gratuity` | Firestore |
| 15 | Loan Prepayment Planner | `debtplan` | Firestore |
| 16 | Joint Family Planner | `jointplan` | Firestore |
| 17 | CIBIL Score Tracker | `cibil` | Firestore |
| 18 | Financial Calendar | `fincal` | Firestore |
| 19 | Self-Employed & Business | `selfempl` | Firestore |
| 20 | Gold Comparator | `goldcomp` | Firestore |
| 21 | Net Worth Tracker | `networth` | Firestore |
| 22 | ULIP/Policy Analyzer | `ulipcheck` | Firestore |
| 23 | Fixed Income Tools | `fixedincome` | Firestore |
| 24 | Retirement Hub | `retirementhub` | Firestore |
| 25 | Capital Gains Calculator | `cgcalc` | Firestore |
| 26 | HRA Calculator | `hracalc` | Firestore |
| 27 | Nomination Tracker & Will | `nomtrack` | Firestore |
| 28 | Budget & Expense Tracker | `budgettrack` | Firestore |
| 29 | My Mutual Funds | `mymfs` | Firestore |
| 30 | Financial Health Score | `healthscore` | Firestore |
| 31 | SSA + Child Education | `ssaplanner` | Firestore |
| 32 | Drawdown Planner | `drawdown` | Firestore |
| 33 | My Profile | `myprofile` | Firestore |
| 34 | Coffee Can Strategy | `coffeecan` | None (guest) |
| 35 | Fund Picker Guide | `fundpicker` | None (guest) |
| 36 | MF Kit | `mfkit` | None (guest) |

---

## 2. Test Environment Setup

### Prerequisites
- A modern browser: Chrome, Firefox, Edge, or Safari (latest stable)
- Network access to Firebase and mfapi.in
- Two dedicated test accounts (one for primary testing, one for isolation tests)
- Browser DevTools open to monitor console errors

### Test Data
- **Test email:** use a real email domain (e.g., yourname+qa1@gmail.com)
- **Test password:** at least 8 chars with uppercase, digit, and special character
- **Sample amounts:** ₹10,00,000 (10 lakhs), ₹1,00,00,000 (1 crore)
- **Sample rate:** 12% (equity), 7.1% (PPF), 8.5% (home loan)

### LocalStorage Reset
Before each test session, clear localStorage:
> DevTools → Application → Local Storage → Clear

---

## 3. Authentication

### 3.1 Sign-Up

**Entry:** Auth splash → "Sign Up" tab

| Field | Rules |
|-------|-------|
| First Name | Required, non-empty |
| Last Name | Required, non-empty |
| Email | Required, must contain `@`, must not already exist |
| Password | Required, minimum 8 characters |
| Confirm Password | Must exactly match Password |

**Password Strength Indicator (real-time visual bar):**

| Condition | Strength Added | Color |
|-----------|---------------|-------|
| 0 characters | 0% | Red |
| ≥ 8 characters | +25% | Orange |
| Contains uppercase letter | +25% | Yellow |
| Contains digit | +25% | Yellow-green |
| Contains special char (`!@#$%^&*`) | +25% | Green |

**Expected success flow:**
1. All fields valid → click "Create My Account"
2. Button changes to "Creating…" (disabled)
3. Success message: "🎉 Account created! Welcome, [First Name]!"
4. Splash dismisses → Dashboard loads
5. Firestore doc created at `users/{uid}` with fname, lname, email, createdAt
6. displayName set to "FirstName LastName"

**Expected error messages:**

| Condition | Message |
|-----------|---------|
| Email already registered | "An account with this email already exists. Please login." |
| Weak password (Firebase reject) | "Password is too weak." |
| Passwords don't match | "Passwords do not match." |
| Empty first/last name | Field-level prompt or form prevents submission |
| Invalid email format | "Enter a valid email address." |

---

### 3.2 Login

**Entry:** Auth splash → "Login" tab

| Field | Rules |
|-------|-------|
| Email | Required, trimmed, lowercased |
| Password | Required |

**Expected success flow:**
1. Valid credentials → click "Sign In"
2. Button changes to "Signing in…" (disabled)
3. `onAuthStateChanged` fires → splash dismisses → `loadUserData()` called → Dashboard loads
4. Header shows: "👋 [DisplayName]"

**Expected error messages:**

| Condition | Message |
|-----------|---------|
| Wrong password | "Invalid email or password. Please try again." |
| User not found | "Invalid email or password. Please try again." |
| Empty email or password | Form prevents submission |

---

### 3.3 Google Sign-In

**Entry:** "Sign in with Google" button

**Flow:**
1. Click button → Google OAuth popup opens
2. User grants permission
3. `onAuthStateChanged` fires → Dashboard loads
4. New Google users: Firestore doc created automatically
5. Existing Google users: logged in, existing data loaded

**Error case:** Popup blocked or dismissed → generic error message shown

---

### 3.4 Session Persistence

**Signed-in state (page reload):**
- Auth splash does NOT appear
- Dashboard loads directly
- Welcome greeting shown: "Welcome back, [Name]! 👋"
- All saved data restored from Firestore

**Signed-out state (new session):**
- Auth splash appears (login/signup tabs)
- Guest mode option visible
- No user data accessible

---

### 3.5 Logout

**Entry:** "Logout" button in navigation

**Flow:**
1. Click Logout → `signOut()` called → page reloads
2. Auth splash appears with login form
3. No user data visible

---

## 4. Data Persistence

### 4.1 Firestore Auto-Save

**Trigger:** Any input change in a calculator panel  
**Mechanism:** 1.5-second debounce — multiple rapid changes produce only 1 Firestore write  
**Page unload:** Pending debounced save is flushed immediately on `beforeunload`  
**Write mode:** `merge: true` — only changed fields are updated; unmodified fields preserved  

**Test scenarios:**
- Enter a value → wait 2 seconds → close and reopen tab → value restored
- Enter 10 values rapidly (within 1s) → only 1 Firestore write occurs (verify in Network tab)
- Navigate away while typing → data is saved before leaving

### 4.2 Firestore Auto-Load

**Trigger:** Login or session resume  
**Source:** `users/{uid}` document  
**Cache:** Snapshot stored in `window._cachedRestoreData`  

All calculator panels restore their last-saved state including:
- Numeric inputs
- Dropdown selections
- Toggle states (LTCG, inflation, regime)
- Dynamic rows (custom expense categories, loan rows, etc.)
- Lazy-loaded panels (panels not yet in DOM use MutationObserver to restore when inserted)

### 4.3 Reset All Data

**Entry:** Dashboard settings or profile area  
**Flow:**
1. Click "Reset All Data"
2. Confirmation dialog: "Reset all your saved numbers?"
3. Confirm → all Firestore `users/{uid}/tools/*` docs deleted (plus legacy `appData` field, if present)
4. Page reloads → all calculators show empty/default state

**Cancel:** No data deleted, no reload

### 4.4 LocalStorage (Non-Firestore)

| Key | Contents | Used By |
|-----|----------|---------|
| `aw_dash_favs` | JSON array of pinned tool IDs | Dashboard favorites |
| `am_mfc_funds` | JSON array of fund scheme codes | Fund Comparator |

These keys persist across sessions independently of Firestore. Clearing localStorage removes pinned favorites and saved comparator funds.

---

## 5. Dashboard & Navigation

### 5.1 Default State

- On first login, Financial Health Score (`healthscore`) is pinned by default
- Favorites grid displays pinned tools
- Category sections list all tools grouped by type

### 5.2 Pin / Unpin (Favorites)

**Action:** Click Pin button on any tool card

| State | Button Text | Background |
|-------|------------|-----------|
| Not pinned | "☆ Pin" | Normal |
| Pinned | "★ Pinned" | Gold (#f5c842) |

**Behavior:**
- Toggles tool in/out of `aw_dash_favs` in localStorage
- Favorites grid updates immediately
- Pin count displayed: "n pinned" or "n/X favorites"
- No upper limit on number of pinned tools

### 5.3 Navigation

**Mode switching (`switchMode`):**
1. All panels hidden
2. Requested panel shown (or lazily loaded)
3. Breadcrumb updated: `icon + tool name + back link`
4. Mobile dropdown label updated

**Breadcrumb:**
- Signed-in: "⬅ Dashboard"
- Guest: "⬅ Sign In"

### 5.4 Mobile Dropdown

- Category buttons collapse into a dropdown on mobile
- Tap a category → dropdown expands
- Arrow rotates to indicate open/closed state
- Selecting a tool collapses the dropdown

---

## 6. Calculators

### 6.1 Growth Calculator

**Inputs:**

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Amount | ₹ formatted | — | Required |
| Annual Return | % | 12 | — |
| Years | integer | 20 | Range 1–50 |
| Inflation Rate | % toggle | 6% | Optional |
| LTCG Tax | toggle | off | Applies ≥1 year hold |

**Formula:**
```
FV = Amount × (1 + return/100)^years
If inflation: adjusted_return = (1 + return/100) / (1 + inflation/100) - 1
If LTCG: gains = FV - Amount
         taxable = max(0, gains - 1,25,000)
         tax = taxable × 0.125
         FV_after_tax = FV - tax
```

**Outputs:**
- Final amount (₹, formatted with words e.g., "One Crore, Fifty Lakh")
- Wealth gained (FV − principal)
- Inflation-adjusted real value (if toggle on)
- LTCG tax deducted and net value (if toggle on)

**Edge cases:**
- Amount = 0 → show placeholder, no calculation
- Rate = 0 → FV = principal (no growth)
- Inflation ≥ return → real value goes below principal (negative real gain displayed)
- LTCG with gains ≤ ₹1.25L → ₹0 tax applied

---

### 6.2 Goal Planner

**Goal Types:** Vehicle, Education, Marriage, Home, Custom

**Modes:** Lump Sum OR SIP

**Inputs:**

| Field | Type | Notes |
|-------|------|-------|
| Goal Type | dropdown | Custom shows text + return% |
| Investment Type | radio | Lump Sum / SIP |
| Goal Amount | ₹ | Required |
| Years to Goal | integer | — |
| Inflation Rate | % | Optional |
| Annual Return | % | Required for custom goals |

**Formulas:**
```
Inflation-adjusted target = Goal × (1 + inf/100)^years

Lump Sum:
  Required today = target / (1 + return/100)^years

SIP:
  r = monthly_return = return / 100 / 12
  n = years × 12
  SIP = target × r / ((1 + r)^n - 1)
```

**Outputs:**
- Required corpus or SIP amount
- Amount in words
- Future value with and without inflation

**Additional features:**
- "Save Goal" → stored in Firestore `users/{uid}/tools/savedGoals`
- "Use in Financial Plan" → bridges saved goal to Financial Plan tool

---

### 6.3 Emergency Fund Calculator

**Inputs:**

| Field | Type |
|-------|------|
| Groceries | ₹/month |
| Utilities | ₹/month |
| Rent | ₹/month |
| Insurance | ₹/month |
| Transport | ₹/month |
| Medical | ₹/month |
| Other | ₹/month |
| Custom categories | dynamic rows (add/remove) |
| Coverage months | radio: 3, 6, 9, 12, or custom |

**Formula:**
```
Emergency Fund = (sum of all categories) × months
```

**Outputs:**
- Total emergency corpus (₹, formatted)
- Breakdown per category
- Visual bar chart showing % per category

**Edge cases:**
- Custom rows can be added/removed; each has name + amount
- Default coverage: 6 months
- Zero expenses → result is ₹0

---

### 6.4 Home Loan Advisor

Contains four sub-tools accessible via tabs.

#### 6.4.1 EMI Calculator

**Inputs:**

| Field | Default |
|-------|---------|
| Loan Amount (₹) | — |
| Interest Rate (%) | 8.5 |
| Tenure (years) | 20 |
| Start Month/Year | Current month + 1 |

**Formula:**
```
r = rate / 100 / 12
n = tenure × 12
EMI = P × r × (1+r)^n / ((1+r)^n - 1)
Total Interest = (EMI × n) - P
```

**Outputs:**
- Monthly EMI (₹)
- Total Principal
- Total Interest
- Total Payment
- Principal vs Interest % (stacked bar)
- Amortisation table (toggle): Year | Principal Paid | Interest Paid | Balance
- End date of loan
- Tip: impact of 1% rate change on EMI

#### 6.4.2 Prepayment Calculator

**Inputs:**

| Field | Notes |
|-------|-------|
| Loan Amount (₹) | — |
| Interest Rate (%) | — |
| Tenure (years) | — |
| Lump Sum Amount (₹) | Prepayment amount |
| After X years | When prepayment happens |
| Strategy | Reduce Tenure OR Reduce EMI |

**Formula:**
```
Outstanding after X years: calculated month-by-month
With prepayment (Reduce Tenure): solve for new_n
With prepayment (Reduce EMI): new_EMI = outstanding × r / (1 - (1+r)^-remaining)
Interest saved = original_total_interest - new_total_interest
```

**Outputs:**
- Outstanding before/after prepayment
- Interest saved (₹)
- Time saved (months/years) if "Reduce Tenure"
- New EMI if "Reduce EMI"

**Edge case:** Prepayment amount ≥ outstanding balance → treats as full payoff

#### 6.4.3 Rent vs Buy Analysis

**Inputs:**

| Field | Default |
|-------|---------|
| Property Price (₹) | — |
| Down Payment (₹) | — |
| Loan Rate (%) | — |
| Tenure (years) | — |
| Property Appreciation (% p.a.) | — |
| Annual Maintenance (₹) | — |
| Monthly Society Charges (₹) | — |
| Stamp Duty + Registration (% of price) | 7% |
| GST % | 0% |
| MODT + Legal (₹) | — |
| Monthly Rent (₹) | — |
| Annual Rent Increase (%) | — |
| Investment Return (%) | 12% |
| Analysis Period (years) | — |

**Expected outputs:**
- Winner banner with wealth difference (₹)
- SVG line chart — wealth progression over 5 years (buy vs rent)
- Crossover year (when one path overtakes the other)
- Side-by-side wealth breakdown (property value, corpus, net worth)
- Upfront cost breakdown callout
- Disclaimer about non-financial factors

#### 6.4.4 Section 24(b) Tax Saving

**Inputs:** Loan Amount, Rate, Tenure, Tax Slab, Property Type (Self-occupied / Let-out), Tax Regime

**Rules:**
| Scenario | Deduction |
|----------|-----------|
| Self-occupied + Old Regime | Max ₹2,00,000/year |
| Let-out + Old Regime | Full interest (no cap) |
| Self-occupied + New Regime | NOT available → show warning |
| Let-out + New Regime | Full interest deductible |

**Outputs:**
- Total tax saved (₹)
- Effective loan interest rate (after tax benefit)
- Year-by-year table: Year | Interest | Deduction | Tax Saved

---

### 6.5 Step-Up SIP Calculator

**Inputs:**

| Field | Default |
|-------|---------|
| Initial SIP Amount (₹) | — |
| Annual Return (%) | 12 |
| Duration (years) | — |
| Step-up % per year | 10% |
| LTCG Tax toggle | off |

**Formula:**
```
Each year:
  sip_amount = initial × (1 + step_up/100)^year
  Each month: corpus = corpus × (1 + monthly_return) + sip_amount

LTCG (if enabled):
  gains = final - total_invested
  taxable = max(0, gains - 1,25,000)
  tax = taxable × 0.125
```

**Outputs:**
- Final corpus (before/after LTCG tax)
- Total amount invested
- Wealth gained
- Year-by-year breakdown table

---

### 6.6 Tax Guide

#### 6.6.1 Tax Inputs

| Field | Old Regime | New Regime |
|-------|-----------|-----------|
| Gross Salary | ✓ | ✓ |
| Other Income | ✓ | ✓ |
| Standard Deduction | ₹50,000 | ₹75,000 |
| Section 80C | Max ₹1,50,000 | ✗ |
| Section 80D | Max ₹75,000 / ₹1,00,000 (super-senior) | ✗ |
| HRA | Actual received | ✗ |
| NPS 80CCD(1) | Max ₹50,000 | ✗ |
| Employee NPS 80CCD(2) | ✓ | ✓ |
| Home Loan Interest 24(b) | Max ₹2,00,000 | ✗ (self-occ) |
| Other Deductions | ✓ | ✗ |
| Monthly Expenses | For surplus calc | For surplus calc |

**Taxpayer categories:** General, Senior (60–80), Super-Senior (80+)

#### 6.6.2 Tax Slabs (FY 2025-26)

**Old Regime:**
| Income Range | Rate |
|-------------|------|
| Up to ₹2.5L (General) / ₹3L (Senior) / ₹5L (Super-Senior) | 0% |
| ₹2.5L – ₹5L | 5% |
| ₹5L – ₹10L | 20% |
| > ₹10L | 30% |
| Surcharge > ₹50L | 10% |
| Surcharge > ₹1Cr | 15% |
| Surcharge > ₹2Cr | 25% |
| Surcharge > ₹5Cr | 37% |
| Cess | 4% on (tax + surcharge) |
| 87A Rebate | Full rebate if taxable ≤ ₹5L |

**New Regime:**
| Income Range | Rate |
|-------------|------|
| ₹0 – ₹4L | 0% |
| ₹4L – ₹8L | 5% |
| ₹8L – ₹12L | 10% |
| ₹12L – ₹16L | 15% |
| ₹16L – ₹20L | 20% |
| ₹20L – ₹24L | 25% |
| > ₹24L | 30% |
| Surcharge > ₹50L | 10% (max 25%) |
| Cess | 4% on (tax + surcharge) |
| 87A Rebate (Budget 2025) | Full rebate if taxable ≤ ₹12L |

#### 6.6.3 Tax Guide Outputs

**Winner Banner:**
- Shows which regime saves more tax
- Displays savings amount per year
- Color coding: Green (New better), Purple (Old better), Blue (equal)

**Comparison Table:**

| Metric | Old Regime | New Regime |
|--------|-----------|-----------|
| Gross Income | ₹X | ₹X |
| Deductions | ₹X | ₹X |
| Taxable Income | ₹X | ₹X |
| Tax | ₹X | ₹X |
| Surcharge | ₹X | ₹X |
| Cess (4%) | ₹X | ₹X |
| Total Tax | ₹X | ₹X |
| Take-Home (Annual) | ₹X | ₹X |
| Monthly Take-Home | ₹X | ₹X |

**Slab Breakdown:** Visual bars for each slab with 87A rebate note

**Investable Surplus (when expenses entered):**
```
Cash-in-hand = Monthly take-home
Less: Employee EPF (12% of basic salary if entered)
Less: Monthly expenses
Free Surplus = investable per month
Savings rate %
```

**Integration:** "Send Surplus to Financial Plan" → auto-fills Financial Plan investment field

**Post-Tax Return Calculator:** Compare pre-tax vs post-tax return for fund types (Equity-LT, Equity-ST, Debt, FD, ELSS, International)

---

### 6.7 Financial Plan (Multi-Step)

**Step 1 — Goals:**
- Checkboxes: Education, Marriage, Home, Retirement, Wealth, Custom
- Toggle on/off (state saved)
- Visual tiles with emoji + color

**Step 2 — Risk Profile:**
- Questionnaire or visual slider
- Output: Conservative / Moderate / Aggressive
- Saved to Firestore `riskProfile` field

**Step 3 — Existing Corpus:**
- Asset type checkboxes: EPF, PPF, NPS, Mutual Funds, Stocks, Gold, Real Estate, SCSS, POMIS, KVP, Custom
- Amount input per selected type
- Crypto: confirmation popup on first selection
- Custom type: free-text description

**Step 4 — Investment Amount:**
- Monthly investment (₹)
- Monthly income (₹)
- EPF basic salary (₹)
- EPF mode: Balance (existing amount) OR Contribution (monthly amount)

**Output:**
- Comprehensive text plan with specific recommendations
- Goal-wise corpus projections
- Asset allocation recommendation (based on risk profile + time horizon)
- Timeline visualization

**Data behaviour:**
- Saves to Firestore `users/{uid}/tools/finplan`
- Saved goals deduplicated by type on restore
- All toggle/checkbox states restored on reload

---

### 6.8 EPF Corpus Projector

**Inputs:** Current EPF Balance, Annual Basic Salary, Current Age, Retirement Age (default 60), EPF Growth Rate (default 8%), Employee Contribution Rate (default 12%)

**Formula:**
```
Monthly contribution = basic × employee_rate / 100
Monthly employer contribution = basic × 0.0867 / 100  (statutory 8.67%)
Each month: balance = balance × (1 + rate/12/100) + contributions
Project until retirement age
```

**Outputs:** Projected balance at retirement, total contribution vs growth, year-by-year table

---

### 6.9 PPF & NPS Calculator

#### PPF Tab

**Inputs:** Annual Contribution (max ₹1,50,000), Current Balance, Years Completed (0–14+), Interest Rate (default 7.1%), Extend Years (post-maturity 7-year blocks)

**Output:** Maturity amount, extension projections, partial withdrawal allowance (50% of prior year balance)

#### NPS Tab

**Inputs:** Monthly Contribution, Current Age, Current Balance, Expected Return (default 10%), Annuity Rate at Retirement (default 6%)

**Formula:**
```
FV = balance × (1 + return)^years + monthly × [((1+return)^years - 1) / return]
Monthly pension = FV × annuity_rate / 100 / 12
```

**Output:** Maturity corpus, estimated monthly pension

---

### 6.10 Insurance Adequacy Calculator

**Inputs:** Annual Income, Age, Dependents count, Outstanding Loans, Current Term/Health/CI/Disability Insurance, Monthly Expenses, Family size, Assets, Parents to cover (Y/N) + parent ages

**Expected outputs:**
- Recommended coverage for each insurance type (Term, Health, CI, Disability)
- Gap analysis (recommended vs current)
- Priority ranking of coverage gaps

---

### 6.11 Gratuity Calculator

**Inputs:** Basic Salary, Years of Service, Months (partial year), Employment Type (Covered / Not Covered under Gratuity Act), Tax Slab, Tax Regime

**Formula (Covered under Act):**
```
Gratuity = (Basic + DA) × Years × 15 / 26
Cap: ₹20,00,000 (current statutory maximum)
Exemption: ₹10,00,000
Taxable = max(0, Gratuity - 10,00,000)
Tax = Taxable × slab_rate
Net Gratuity = Gratuity - Tax
```

**Outputs:** Gross gratuity, exemption, taxable amount, tax liability, net gratuity

---

### 6.12 Fixed Income Tools

**Sub-calculators:** FD, SCSS, POMIS, NSC, KVP

Each accepts: Principal, Rate, Tenure, Tax Regime, Tax Slab

**Formula:**
```
Compound: A = P × (1 + r/100)^n
Simple: A = P + (P × r × n / 100)
Tax: gains = A - P; tax = gains × slab_rate (if applicable)
```

**Outputs:** Maturity amount, tax impact, post-tax return

---

### 6.13 Capital Gains Calculator

**Inputs:** Asset Type, Buy Date, Sell Date, Cost Price, Sale Price, LTCG exemption used (₹), Annual Income, Tax Regime

**Tax classification rules:**

| Asset | Short-Term | Long-Term |
|-------|-----------|----------|
| Equity shares / Equity MF | ≤ 12 months → 15% | > 12 months → 12.5% (₹1.25L exemption) |
| Debt MF | ≤ 36 months → slab | > 36 months → 20% with indexation (old) / slab (new) |
| Real Estate | ≤ 24 months → slab | > 24 months → 20% with indexation OR 10% without |

**Outputs:** ST vs LT classification, applicable tax rate and notes, net gain after tax, annualized return

---

### 6.14 HRA Calculator

**Inputs:** Basic Salary, HRA Received, Rent Paid, City Type (Metro / Non-Metro), Tax Regime, Tax Slab

**Rules:**
| Regime | City | Exemption |
|--------|------|----------|
| Old | Metro | min(HRA received, 50% basic, rent - 10% basic) |
| Old | Non-metro | min(HRA received, 40% basic, rent - 10% basic) |
| New | Any | No HRA exemption |

**Outputs:** HRA exemption amount, taxable HRA, tax saved, net benefit

---

### 6.15 Net Worth Tracker

**Inputs — Assets:** Savings Account, FDs, Stocks, Equity MFs, EPF, PPF, NPS, Debt MFs, Home, Other Property, Physical Gold, Paper Gold, Crypto, Insurance Savings, Other Assets

**Inputs — Liabilities:** Home Loan, Car Loan, Personal Loan, Education Loan, Credit Card, Other Liabilities

**Formula:** `Net Worth = Total Assets - Total Liabilities`

**Outputs:** Net worth (formatted), asset allocation pie chart, liability breakdown, trend chart over time (saved snapshots in Firestore `users/{uid}/tools/nwHistory`)

---

### 6.16 Drawdown Planner

**Inputs:** Corpus, Current Age, Retirement Age, Annual Expenses, Inflation %, Expected Return %, Other Annual Income (pension etc.)

**Formula (year-by-year):**
```
adjusted_expense = expense × (1 + inflation)^year
net_draw = adjusted_expense - other_income
corpus = corpus × (1 + return) - net_draw
If corpus ≤ 0: corpus depleted in this year
```

**Outputs:** Years until corpus depletion, year-by-year balance table, safe withdrawal rate, shortfall warnings

---

### 6.17 CIBIL Score Tracker

**Inputs:** CIBIL Score (300–900), Utilization Ratio (%), Missed Payments, Credit Age (years), Active Cards, Recent Enquiries, Loan Amount, Loan Tenure

**Outputs:** Score interpretation (Poor / Fair / Good / Excellent), factors affecting score, improvement recommendations

---

### 6.18 Budget & Expense Tracker

**Inputs:** Month selector, Categories (Food, Transport, Shopping, Entertainment, Utilities, Healthcare, Other), custom categories (add/remove), Chart type (Bar / Pie / Line)

**Outputs:** Total spending, % per category, chart visualization, month-over-month trends

---

### 6.19 Gold Comparator

**Inputs:** Amount (₹), Years, Expected Return (%), Making Charges, Locker Charges, Tax Slab, Tax Regime

**Comparison paths:**
- Physical Gold: includes making charges, locker costs, LTCG tax (20% with indexation old / slab rate new)
- Paper Gold (e.g., Sovereign Gold Bond / Gold ETF): no making/locker charges, same LTCG rules

**Outputs:** Net value comparison, tax impact per path, recommendation

---

### 6.20 CTC Optimizer

**Inputs:** Annual CTC, Basic, HRA, Rent Paid, City, LTA, Food Coupons, Phone/Internet, Employee NPS, 80C, Tax Regime

**Outputs:** Optimal salary component allocation, net monthly take-home, tax savings vs sub-optimal split

---

### 6.21 PPF + NPS and Retirement Hub

**Retirement Hub** consolidates EPF, PPF, NPS, SIP, and other corpus with:
- Expected return and inflation inputs per asset class
- Projection to life expectancy (default 90)
- Shows corpus sufficiency, depletion year if applicable, recommended drawdown
- PPF deposits modelled only for the remaining years of the 15-year term (`Years Done` input); balance then compounds deposit-free to retirement
- EPS pension estimated from future service: `min(basic, ₹15,000) × min(service, 35) ÷ 70`, requires ≥10 years of service; added to retirement income
- Depletion simulation inflates general and medical expenses annually through retirement (general and healthcare inflation applied separately, net of NPS + EPS pensions)
- Stress test (−30% Year-1 crash) applies only to market-linked assets (NPS lumpsum, SIP, Other); EPF/PPF are unaffected

---

### 6.22 SSA + Child Education Planner

**Inputs:** Child DOB Year, Annual SIP, ELSS SIP + return %, Inflation %, Education goal (₹), Marriage goal (₹)

**Formula:**
```
Current child age = current_year - dob_year
Inflated education goal = goal × (1 + inf/100)^years_to_goal
ELSS corpus = SIP × [((1+r)^n - 1) / r]
Shortfall = ELSS_corpus - inflated_goal
```

**Outputs:** Corpus needed, SIP adequacy, shortfall/surplus, combined projection for multiple children

---

### 6.23 Loan Prepayment Planner (Debt Plan)

**Inputs:** Extra monthly amount available (₹), Dynamic loan rows (Name, Balance, Rate, Current EMI)

**Strategies:**
- Avalanche: pay off highest interest rate first
- Snowball: pay off lowest balance first
- Custom selection

**Outputs:** Payoff sequence, payoff date per loan, total interest saved

---

### 6.24 Self-Employed & Business Planner

**Inputs:** Turnover, Actual Profit, Other Income, 80C, NPS, Business expenses breakdown, GST details (revenue, purchases, rates, delay), Tax Regime, Business Type (44AD / 44ADA / other)

**Outputs:** ITR filing requirement, tax liability, GST due, advance tax instalment calendar

---

### 6.25 Will Generator & Nomination Tracker

**Will Generator inputs:** Personal details, Executor, 2 Witnesses, Beneficiaries (dynamic rows with share %), Special Instructions, Signature Date

**Output:** Printable will template, execution checklist

**Nomination Tracker:** Status grid for Bank, MF, Life Insurance, EPF, PPF, NPS, Demat, Health Insurance — shows completion %, overdue items highlighted

---

### 6.26 My Profile

**Inputs:** Name, Age, Email, Annual Income, Risk Profile, Investment Horizon, Goals (checkboxes)

**Output:** Stored in Firestore `users/{uid}/tools/userProfile`, used by Financial Plan to tailor recommendations

---

## 7. Mutual Fund Tools

### 7.1 MF Explorer

**Data source:** mfapi.in (live)  
**Fund count:** 10,000+

#### Features

**Category browse:**
- Dropdown: Equity, Debt, Hybrid, Liquid, Gold, etc.
- Sub-category pills

**Live NAV:**
- Fetched from mfapi.in for each fund
- Displays: NAV (₹), last updated date

**Metrics calculated from NAV history:**

| Metric | Description |
|--------|-------------|
| 1Y / 3Y / 5Y / 10Y CAGR | Compounded annual growth rate |
| Rolling 3Y Hit Rate | % of 3-year windows with positive return |
| Sharpe Ratio | Return per unit total risk |
| Sortino Ratio | Return per unit downside risk |
| Alpha | Excess return vs benchmark |
| Beta | Market sensitivity |
| Std Dev | Annualized volatility |
| Expense Ratio | Annual cost % |

**Star Rating System:**

| Rating | Label | Percentile |
|--------|-------|-----------|
| ★★★★★ | Elite | Top 10% |
| ★★★★ | Strong | Top 25% |
| ★★★ | Average | Top 50% |
| ★★ | Weak | Bottom 50% |
| ★ | Avoid | Bottom 10% |

Pillars: Returns / Safety / Consistency

**Search & autocomplete:**
- Real-time filter as you type
- Filter by fund name or AMC
- Up to 8 suggestions
- Keyboard navigation: ↑↓ to move, Enter to select

**Sorting:** Star rating, CAGR (any period), NAV, Rolling Hit %, Sharpe, Alpha, Expense Ratio — ascending/descending toggle per column

**Pagination:** 25 funds per page, Next/Previous navigation

**Constraints:**
- Requires ≥ 30 NAV data points to calculate metrics; funds below threshold show "—" or "Insufficient data"

---

### 7.2 Fund Comparator

**Inputs:** Up to 5 funds via autocomplete search

**Outputs — side-by-side table:**
- Fund name, AMC, category
- Star rating, score, pillars
- CAGR (1/3/5/10Y)
- Latest NAV
- Rolling hit %, rolling avg return
- Sharpe, Sortino, Alpha, Std Dev, Beta
- Expense Ratio vs category ceiling
- Best value highlighted green, worst highlighted red

**Constraints:**
- Maximum 5 funds — alert shown if attempting to add 6th
- Saved fund list persists in localStorage (`am_mfc_funds`)
- Restored automatically on next visit

---

### 7.3 My Mutual Funds

- Bookmarked/saved fund list (Firestore)
- Quick access from Dashboard
- Persists across sessions

---

## 8. Special Tools

### 8.1 Financial Health Score

**Inputs:** Income, EMI, Expenses, Savings, Health Insurance coverage, Term Insurance coverage, EPF balance, Portfolio allocation (Equity / Debt / Realty / Gold / Other %), Age

**Scoring:** Each metric scored 1–10; weighted average produces overall score

| Score Range | Color |
|------------|-------|
| < 40 | Red |
| 40–70 | Amber |
| > 70 | Green |

**Outputs:** Overall score card, component scores (bars), improvement recommendations, comparison with demographic average

---

### 8.2 Joint Family Planner

- Two earners, shared goals
- Separate income/expense/EPF inputs per earner
- Combined goal planning

---

### 8.3 Financial Calendar

- Tax deadline tracker
- Advance tax dates
- ITR filing deadlines
- GST filing deadlines

---

### 8.4 Coffee Can Strategy

**Guest-accessible tool (no auth required, no persistence)**

**Inputs:** Principal, Annual Return, Years, Inflation %

**Outputs:** Nominal value, real value (inflation-adjusted), gains, purchasing power erosion due to inflation

---

## 9. External API Behavior

### 9.1 mfapi.in

| Endpoint | Used For | Timeout |
|----------|---------|---------|
| `GET /mf` | Load all fund list | 20–25s |
| `GET /mf/{code}` | Fund detail + NAV history | 20–25s |
| `GET /mf/{code}/latest` | Latest NAV only | 20–25s |

**Caching:**
- In-memory: `_mfeNavCache` (NAV data), `_mfeMetCache` (computed metrics)
- Cleared on panel reset; persists during the session

**Error handling:**
- Timeout → shows timeout message or partial result
- HTTP error → fund shows "—" for metrics; does not crash
- Network unavailable → shows placeholder, cached data used where available

---

### 9.2 Firebase

| Service | Usage |
|---------|-------|
| Firebase Auth | Email/Password, Google OAuth |
| Firestore | All user data read/write |

**Firestore write behavior:**
- `merge: true` on all writes — no accidental field deletion
- Null values in payload are omitted from Firestore payload
- Authentication required — unauthorized access blocked by security rules

---

## 10. Global Input Validation

### Number Inputs (₹ amounts)

- Non-numeric characters rejected on entry
- Indian comma formatting applied as user types: 1,00,000
- Commas stripped before calculation
- Negative values: some fields clamp to 0, some allow negative (e.g., net worth)
- Very large values (crores+): formatted correctly

### Percentage Inputs

- Range: 0–100 (or 0–50 for some fields)
- Decimal values accepted (e.g., 8.5%)
- Out-of-range values should not produce impossible results silently

### Year / Age Inputs

- Integer values only
- Age: typically 18–100
- Years: typically 1–50
- Retirement age must be > current age

### Date Inputs

- Date pickers validate calendar dates
- Future dates not allowed for historical events (buy date in CG calculator)

---

## 11. Error Handling

### Authentication Errors

| Error Code | User-Facing Message |
|-----------|-------------------|
| `auth/email-already-in-use` | "An account with this email already exists. Please login." |
| `auth/weak-password` | "Password is too weak." |
| `auth/user-not-found` | "Invalid email or password. Please try again." |
| `auth/wrong-password` | "Invalid email or password. Please try again." |
| `auth/invalid-credential` | "Invalid email or password. Please try again." |
| Firebase not initialized | "Still connecting… please wait a moment and try again." |

### Calculator Edge Cases

| Scenario | Expected Behavior |
|----------|-----------------|
| Amount = 0 | Show placeholder "Enter amount to calculate" |
| Rate = 0 | Show 0 growth (no crash) |
| Years = 0 | Show 0 growth or placeholder |
| Division by zero in SIP | Handle gracefully (no Infinity/NaN displayed) |
| 87A rebate applies | Show ₹0 tax with rebate note |
| LTCG ≤ ₹1.25L exemption | Show ₹0 tax |
| Section 24(b) + New Regime + Self-occupied | Show warning message; disable or explain |
| Negative net worth | Display correctly (no crash) |
| Loan prepayment > outstanding | Treat as full payoff |

### Firestore Errors

| Condition | Behavior |
|-----------|---------|
| Write fails (network) | Log warning; retry on next debounce; no crash |
| Read fails on login | Log warning; show empty state (no crash) |
| Permission denied | Log warning; show empty state |

### API Errors (mfapi.in)

| Condition | Behavior |
|-----------|---------|
| Timeout | Show "—" or timeout message |
| Non-200 response | Skip fund; show "—" for metrics |
| Network unavailable | Show placeholder; use in-memory cache |

---

## 12. Guest Mode

**Activation:** Click "Skip" or "Sign In Later" on auth splash

**State:** `window._guestMode = true`

**Features available without account:**
- All calculators (full functionality)
- MF Explorer, Fund Comparator, MF Kit, Fund Picker Guide, Coffee Can Strategy
- Growth, Goal, Emergency, Home Loan, Tax Guide calculators

**Limitations:**
- No Firestore save/load — data lost on page refresh
- Breadcrumb shows "⬅ Sign In" instead of "⬅ Dashboard"
- Pinning/Favorites not available

---

## 13. Responsive & Mobile

### Mobile Behaviors

| Feature | Mobile Behavior |
|---------|----------------|
| Dashboard navigation | Collapsible dropdown with animated arrow |
| Tool breadcrumb | Compact icon + name + back link |
| Input fields | Touch-friendly, commas formatted as typed |
| Tables | Horizontal scroll on overflow |
| Charts | Resize/redraw to fit viewport |
| Buttons | Minimum touch target 48px |

### Breakpoints

| Range | Category |
|-------|---------|
| < 768px | Mobile |
| 768px – 1024px | Tablet |
| > 1024px | Desktop |

---

## 14. Security

### Passwords
- Never stored, logged, or displayed in JS
- Hashed server-side by Firebase

### Data Isolation
- Each user can only read/write their own Firestore document (`users/{uid}`)
- Security rules enforce authentication check

### XSS Prevention
- User-entered text rendered via value properties, not innerHTML
- Any dynamic HTML uses escaped output (`_esc()` function)

### localStorage
- Contains only non-sensitive data (pinned tool IDs, fund scheme codes)
- No tokens, passwords, or PII

---

## 15. Known Limitations

| Limitation | Details |
|-----------|---------|
| No password reset | Users cannot reset a forgotten password |
| No two-factor authentication | Single factor only (password or Google) |
| No data export | No CSV/PDF export of calculator results |
| No offline mode | All API calls require network; no service worker |
| Single-user only | No shared access or collaboration |
| No audit log | No history of user actions |
| No native mobile app | Web-only |

---

## 16. Master Test Checklist

### Smoke Tests (Run First)
- [ ] App loads without console errors
- [ ] Auth splash displays on fresh session
- [ ] Sign-up creates account and loads dashboard
- [ ] Login succeeds and restores data
- [ ] Logout returns to auth splash
- [ ] Growth Calculator produces a result
- [ ] Data saves to Firestore (check Network tab)
- [ ] Dashboard shows at least one pinned tool

---

### Authentication
- [ ] Sign-up: all required fields validated
- [ ] Sign-up: password strength indicator updates in real-time
- [ ] Sign-up: duplicate email shows error
- [ ] Sign-up: password mismatch shows error
- [ ] Sign-up: password < 8 chars shows error
- [ ] Login: correct credentials succeed
- [ ] Login: wrong password shows error
- [ ] Login: unknown email shows error
- [ ] Google Sign-In: popup opens and completes
- [ ] Session persistence: reload without login splash
- [ ] Logout: clears session and shows login

---

### Data Persistence
- [ ] Enter value → wait 2s → close/reopen → value restored
- [ ] 10 rapid inputs → only 1 Firestore write (verify Network tab)
- [ ] Navigate away while typing → data saved
- [ ] Page unload during debounce → data saved
- [ ] All input types restored: numbers, dropdowns, toggles, dynamic rows
- [ ] Lazy-loaded panels restore on first navigation
- [ ] Reset All Data → confirmation dialog → all cleared
- [ ] Reset All Data → cancel → no change

---

### Dashboard
- [ ] Financial Health Score pinned by default (new account)
- [ ] Pin button adds tool to favorites grid
- [ ] Unpin button removes tool from favorites grid
- [ ] Favorite count updates on toggle
- [ ] Pin state persists across sessions (localStorage)
- [ ] Category navigation opens correct tool
- [ ] Breadcrumb shows tool name
- [ ] Mobile dropdown opens/closes with animation
- [ ] Selecting tool from dropdown closes dropdown

---

### Growth Calculator
- [ ] Valid inputs produce correct FV
- [ ] Amount = 0 → placeholder shown
- [ ] Inflation toggle: real value calculated
- [ ] LTCG toggle: tax deducted; net value shown
- [ ] LTCG with gains ≤ ₹1.25L → ₹0 tax
- [ ] Amount displayed in Indian words
- [ ] All inputs saved and restored

---

### Goal Planner
- [ ] Lump Sum mode calculates correct corpus
- [ ] SIP mode calculates correct monthly SIP
- [ ] Inflation option adjusts target
- [ ] All goal types available in dropdown
- [ ] Custom goal type accepts text + return
- [ ] "Save Goal" stores to Firestore
- [ ] "Use in Financial Plan" bridges data to FP

---

### Emergency Fund Calculator
- [ ] All fixed categories summed correctly
- [ ] Custom rows: add/remove works
- [ ] Coverage months radio: 3/6/9/12/custom
- [ ] Custom months accepted as input
- [ ] Category bar chart shows correct percentages
- [ ] Result = total expenses × months

---

### Home Loan Advisor
- [ ] EMI formula verified (sample values)
- [ ] Amortisation table toggle works
- [ ] Amortisation values sum to loan total
- [ ] Prepayment: Reduce Tenure shows time saved
- [ ] Prepayment: Reduce EMI shows new EMI
- [ ] Prepayment > outstanding → full payoff message
- [ ] Rent vs Buy: winner banner correct
- [ ] Rent vs Buy: chart draws line for both paths
- [ ] Rent vs Buy: crossover year labeled
- [ ] Section 24(b): New Regime + Self-occupied → warning shown
- [ ] Section 24(b): Let-out → full interest deductible (no cap)
- [ ] All tabs accessible and functional

---

### Step-Up SIP
- [ ] Corpus increases each year by step-up%
- [ ] LTCG tax applied correctly on toggle
- [ ] Year-by-year table matches calculation
- [ ] Total invested = sum of monthly SIPs

---

### Tax Guide
- [ ] Old regime tax computed correctly (verify with sample income)
- [ ] New regime tax computed correctly
- [ ] 87A rebate: taxable ≤ ₹5L (old) → ₹0 tax
- [ ] 87A rebate: taxable ≤ ₹12L (new) → ₹0 tax
- [ ] Surcharge applied above ₹50L (old and new)
- [ ] 4% cess applied on (tax + surcharge)
- [ ] Winner banner shows correct regime
- [ ] Deductions table matches inputs
- [ ] Slab breakdown bars displayed
- [ ] Investable surplus = take-home − EMI − expenses
- [ ] "Send to FP" pre-fills Financial Plan
- [ ] Post-tax return calculator works for all fund types
- [ ] Regime switch rebuilds slab options
- [ ] Senior/Super-senior taxpayer categories change slabs

---

### Financial Plan
- [ ] Goals toggle on and off
- [ ] Risk questionnaire completes and gives score
- [ ] Asset checkboxes show/hide amount fields
- [ ] Crypto selection shows confirmation popup
- [ ] Custom investment type accepts free text
- [ ] Monthly investment + income captured
- [ ] EPF mode (Balance vs Contribution) switches correctly
- [ ] Plan generated with recommendations
- [ ] All state saved to Firestore and restored on reload
- [ ] Saved goals not duplicated on restore

---

### MF Explorer
- [ ] 10,000+ funds load (check count)
- [ ] Category dropdown filters correctly
- [ ] Sub-category pills filter results
- [ ] Search autocomplete shows ≤ 8 suggestions
- [ ] Keyboard ↑↓ navigates suggestions
- [ ] Enter selects suggestion
- [ ] Sorting: star rating / CAGR / NAV / Sharpe all work
- [ ] Ascending and descending toggle per column
- [ ] Pagination: Next/Previous pages work
- [ ] Green/Amber/Red badges shown per metric
- [ ] Fund with < 30 data points shows "—" metrics
- [ ] Tooltip on metric header explains metric

---

### Fund Comparator
- [ ] Add fund via search works
- [ ] 6th fund triggers alert
- [ ] Remove individual fund works
- [ ] Clear all removes all funds
- [ ] Best/worst column highlighted
- [ ] All metrics displayed correctly
- [ ] Fund list restored from localStorage on next visit

---

### Capital Gains Calculator
- [ ] < 12 months equity → 15% STCG
- [ ] > 12 months equity → 12.5% LTCG with ₹1.25L exemption
- [ ] LTCG ≤ ₹1.25L → ₹0 tax
- [ ] Debt MF held > 36 months → 20% with indexation (old regime)
- [ ] Real estate held > 24 months → 20% with indexation option
- [ ] Net gain after tax shown

---

### HRA Calculator
- [ ] Metro city: 50% basic used in formula
- [ ] Non-metro: 40% basic used
- [ ] New Regime → ₹0 exemption, note shown
- [ ] Exemption = min of three amounts (not just one)

---

### Gratuity Calculator
- [ ] Gratuity ≤ ₹20L cap applied
- [ ] Exemption ₹10L applied
- [ ] Taxable amount correct for slab

---

### Net Worth Tracker
- [ ] All asset inputs summed correctly
- [ ] All liability inputs summed correctly
- [ ] Net worth = assets − liabilities
- [ ] Negative net worth displays correctly
- [ ] Snapshot saved to nwHistory
- [ ] Trend chart updates with multiple snapshots

---

### Error Handling
- [ ] Firestore write failure → no crash, warning logged
- [ ] API timeout → placeholder shown, no crash
- [ ] Missing DOM elements → no crash
- [ ] Invalid JSON in localStorage → graceful fallback
- [ ] NaN / Infinity in calculations → not displayed to user

---

### Security
- [ ] Passwords never visible in DOM or console
- [ ] Log in as User A; attempt to access User B's data URL → access denied
- [ ] Enter `<script>alert(1)</script>` in text field → not executed
- [ ] localStorage contains only non-sensitive data

---

### Browser & Device Compatibility
- [ ] Chrome (latest) — desktop
- [ ] Firefox (latest) — desktop
- [ ] Edge (latest) — desktop
- [ ] Safari (latest) — desktop
- [ ] Chrome (Android) — mobile
- [ ] Safari (iOS) — mobile

---

### Performance
- [ ] Initial page load < 3 seconds (clean cache)
- [ ] Tab switch < 100ms
- [ ] Calculator result appears < 50ms after input change
- [ ] MF Explorer loads list in < 5 seconds
- [ ] No console errors during normal use
- [ ] No memory leaks over extended use (check DevTools Memory tab)

---

### Accessibility
- [ ] All interactive elements reachable via Tab key
- [ ] Enter activates focused button
- [ ] Focus indicator visible on all inputs and buttons
- [ ] Form labels associated with inputs
- [ ] Color contrast sufficient (text on backgrounds)

---

*End of Functional Testing Requirements Document*
