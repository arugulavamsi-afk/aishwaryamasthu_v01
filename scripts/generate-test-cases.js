const XLSX = require('./node_modules/xlsx');

// ─── Test Case Data ────────────────────────────────────────────────────────────
// Columns: ID | Module | Sub-Module | Title | Preconditions | Steps | Expected Result | Type | Priority | Status

const TC = [

  // ══════════════════════════════════════════════════════
  // 1. AUTHENTICATION
  // ══════════════════════════════════════════════════════
  ['TC-AUTH-001','Authentication','Sign-Up','Successful sign-up with valid inputs',
   'App loaded; no user signed in',
   '1. Click Sign Up tab\n2. Enter First Name: "Test"\n3. Enter Last Name: "User"\n4. Enter Email: valid unique email\n5. Enter Password: "Test@1234"\n6. Enter Confirm Password: "Test@1234"\n7. Click Create My Account',
   'Account created; splash dismisses; Dashboard loads; "Welcome, Test!" shown; Firestore doc created at users/{uid}',
   'Positive','High','Not Run'],

  ['TC-AUTH-002','Authentication','Sign-Up','Sign-up with already registered email',
   'An account exists with email test@example.com',
   '1. Click Sign Up tab\n2. Enter all valid fields\n3. Use email: test@example.com\n4. Click Create My Account',
   'Error shown: "An account with this email already exists. Please login."',
   'Negative','High','Not Run'],

  ['TC-AUTH-003','Authentication','Sign-Up','Sign-up with password less than 8 characters',
   'App loaded; Sign Up tab active',
   '1. Enter all valid fields\n2. Enter Password: "Test1"\n3. Enter Confirm Password: "Test1"\n4. Click Create My Account',
   'Error shown: "Password is too weak." or form validation prevents submission',
   'Negative','High','Not Run'],

  ['TC-AUTH-004','Authentication','Sign-Up','Sign-up when passwords do not match',
   'App loaded; Sign Up tab active',
   '1. Enter all valid fields\n2. Enter Password: "Test@1234"\n3. Enter Confirm Password: "Test@5678"\n4. Click Create My Account',
   'Error shown: "Passwords do not match." Account not created.',
   'Negative','High','Not Run'],

  ['TC-AUTH-005','Authentication','Sign-Up','Sign-up with empty First Name',
   'App loaded; Sign Up tab active',
   '1. Leave First Name blank\n2. Fill all other valid fields\n3. Click Create My Account',
   'Form validation prevents submission; First Name field highlighted',
   'Negative','Medium','Not Run'],

  ['TC-AUTH-006','Authentication','Sign-Up','Sign-up with invalid email format (no @)',
   'App loaded; Sign Up tab active',
   '1. Enter Email: "testexample.com" (no @)\n2. Fill all other valid fields\n3. Click Create My Account',
   'Error shown: "Enter a valid email address." Account not created.',
   'Negative','High','Not Run'],

  ['TC-AUTH-007','Authentication','Sign-Up','Password strength indicator — 0 characters',
   'App loaded; Sign Up tab active',
   '1. Click on Password field\n2. Do not type anything',
   'Strength bar shows 0% (red)',
   'Positive','Medium','Not Run'],

  ['TC-AUTH-008','Authentication','Sign-Up','Password strength indicator — 8+ chars only',
   'App loaded; Sign Up tab active',
   '1. Type "abcdefgh" in Password field',
   'Strength bar shows 25% (orange); only length criterion met',
   'Positive','Medium','Not Run'],

  ['TC-AUTH-009','Authentication','Sign-Up','Password strength indicator — full strength',
   'App loaded; Sign Up tab active',
   '1. Type "Test@123" in Password field',
   'Strength bar shows 100% (green); all 4 criteria met (length, uppercase, digit, special char)',
   'Positive','Medium','Not Run'],

  ['TC-AUTH-010','Authentication','Sign-Up','Create My Account button is disabled during submission',
   'App loaded; Sign Up tab active; valid inputs entered',
   '1. Enter all valid fields\n2. Click Create My Account\n3. Observe button state immediately',
   'Button text changes to "Creating…" and is disabled until response received',
   'Positive','Medium','Not Run'],

  ['TC-AUTH-011','Authentication','Login','Successful login with valid credentials',
   'Account exists with known credentials',
   '1. Click Login tab\n2. Enter registered email\n3. Enter correct password\n4. Click Sign In',
   'Splash dismisses; Dashboard loads; "👋 [Name]" shown in header',
   'Positive','High','Not Run'],

  ['TC-AUTH-012','Authentication','Login','Login with wrong password',
   'Account exists',
   '1. Enter correct email\n2. Enter wrong password\n3. Click Sign In',
   'Error shown: "Invalid email or password. Please try again."',
   'Negative','High','Not Run'],

  ['TC-AUTH-013','Authentication','Login','Login with unregistered email',
   'App loaded; Login tab active',
   '1. Enter unregistered email\n2. Enter any password\n3. Click Sign In',
   'Error shown: "Invalid email or password. Please try again."',
   'Negative','High','Not Run'],

  ['TC-AUTH-014','Authentication','Login','Login with empty fields',
   'App loaded; Login tab active',
   '1. Leave Email and Password blank\n2. Click Sign In',
   'Form validation prevents submission',
   'Negative','Medium','Not Run'],

  ['TC-AUTH-015','Authentication','Login','Sign In button disabled during submission',
   'Valid credentials ready',
   '1. Enter valid credentials\n2. Click Sign In\n3. Observe button immediately',
   'Button text changes to "Signing in…" and is disabled',
   'Positive','Low','Not Run'],

  ['TC-AUTH-016','Authentication','Google Sign-In','Successful sign-in via Google OAuth',
   'Browser has a Google account available',
   '1. Click "Sign in with Google"\n2. Select Google account in popup\n3. Grant permission',
   'OAuth popup closes; Dashboard loads; user doc created in Firestore for new Google users',
   'Positive','High','Not Run'],

  ['TC-AUTH-017','Authentication','Google Sign-In','Google Sign-In popup dismissed by user',
   'App loaded; auth splash visible',
   '1. Click "Sign in with Google"\n2. Close the popup without completing sign-in',
   'Generic error message shown; user remains on auth splash',
   'Negative','Medium','Not Run'],

  ['TC-AUTH-018','Authentication','Session Persistence','Reload preserves logged-in session',
   'User is logged in',
   '1. Reload the browser page',
   'Auth splash does NOT appear; Dashboard loads directly; welcome greeting shown',
   'Positive','High','Not Run'],

  ['TC-AUTH-019','Authentication','Session Persistence','New tab shows logged-in session',
   'User is logged in in Tab 1',
   '1. Open a new tab\n2. Navigate to the app URL',
   'Dashboard loads directly without auth splash',
   'Positive','Medium','Not Run'],

  ['TC-AUTH-020','Authentication','Logout','Logout clears session and shows auth splash',
   'User is logged in',
   '1. Click Logout button in navigation',
   'Page reloads; auth splash appears with login form; no user data visible',
   'Positive','High','Not Run'],

  // ══════════════════════════════════════════════════════
  // 2. DATA PERSISTENCE
  // ══════════════════════════════════════════════════════
  ['TC-PERS-001','Data Persistence','Auto-Save','Data saved after 1.5s debounce',
   'User is logged in; Growth Calculator open',
   '1. Enter Amount: ₹10,00,000\n2. Wait 2 seconds\n3. Close browser tab\n4. Reopen app and navigate to Growth Calculator',
   'Amount field shows ₹10,00,000',
   'Positive','High','Not Run'],

  ['TC-PERS-002','Data Persistence','Auto-Save','Multiple rapid inputs produce one Firestore write',
   'User is logged in; Growth Calculator open; DevTools Network tab open',
   '1. Type 10 different values in Amount field within 1 second\n2. Wait 2 seconds\n3. Count Firestore write requests in Network tab',
   'Only 1 Firestore write request observed (not 10)',
   'Positive','Medium','Not Run'],

  ['TC-PERS-003','Data Persistence','Auto-Save','Data saved on page unload (before debounce)',
   'User is logged in; Growth Calculator open',
   '1. Enter Amount: ₹5,00,000\n2. Immediately close browser tab (within 1 second)\n3. Reopen app and navigate to Growth Calculator',
   'Amount field shows ₹5,00,000 (beforeunload flush worked)',
   'Positive','High','Not Run'],

  ['TC-PERS-004','Data Persistence','Auto-Load','All calculator inputs restored on login',
   'User previously saved data in Growth, Tax Guide, and Emergency Fund',
   '1. Logout\n2. Login again\n3. Navigate to each calculator',
   'All previously entered values restored in each calculator',
   'Positive','High','Not Run'],

  ['TC-PERS-005','Data Persistence','Auto-Load','Dropdowns and toggles restored on login',
   'User previously set LTCG toggle ON and Inflation Rate = 7%',
   '1. Logout\n2. Login\n3. Navigate to Growth Calculator',
   'LTCG toggle is ON; Inflation Rate shows 7%',
   'Positive','High','Not Run'],

  ['TC-PERS-006','Data Persistence','Auto-Load','Dynamic rows restored (custom expense categories)',
   'User added custom expense row "Pet Food: ₹2,000" in Emergency Fund',
   '1. Logout\n2. Login\n3. Navigate to Emergency Fund Calculator',
   '"Pet Food" custom row with ₹2,000 is restored',
   'Positive','High','Not Run'],

  ['TC-PERS-007','Data Persistence','Reset','Reset All Data clears all fields',
   'User has data saved across multiple calculators',
   '1. Locate Reset All Data option\n2. Click it\n3. Confirm in dialog\n4. Navigate to Growth Calculator',
   'All fields empty/default; Firestore appData field deleted',
   'Positive','High','Not Run'],

  ['TC-PERS-008','Data Persistence','Reset','Reset All Data cancel keeps data intact',
   'User has data saved',
   '1. Click Reset All Data\n2. Click Cancel in confirmation dialog',
   'No data changed; page not reloaded',
   'Positive','Medium','Not Run'],

  ['TC-PERS-009','Data Persistence','LocalStorage','Pinned favorites persist across sessions',
   'User pins "Tax Guide" tool',
   '1. Pin Tax Guide on Dashboard\n2. Close browser\n3. Reopen app and login',
   'Tax Guide appears pinned in favorites grid',
   'Positive','High','Not Run'],

  ['TC-PERS-010','Data Persistence','LocalStorage','Fund Comparator list restored from localStorage',
   'User added 3 funds in Fund Comparator',
   '1. Add 3 funds in Fund Comparator\n2. Close browser tab\n3. Reopen and navigate to Fund Comparator',
   'Same 3 funds still shown in comparator',
   'Positive','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 3. DASHBOARD & NAVIGATION
  // ══════════════════════════════════════════════════════
  ['TC-DASH-001','Dashboard','Favorites','Financial Health Score pinned by default on new account',
   'Brand new user account (first login)',
   '1. Create new account\n2. Observe favorites grid on Dashboard',
   'Financial Health Score tile is pinned and visible in favorites grid',
   'Positive','Medium','Not Run'],

  ['TC-DASH-002','Dashboard','Favorites','Pin a tool adds it to favorites grid',
   'User logged in; Dashboard visible',
   '1. Find Tax Guide card in category section\n2. Click "☆ Pin" button',
   'Button changes to "★ Pinned" with gold background; Tax Guide tile appears in favorites grid',
   'Positive','High','Not Run'],

  ['TC-DASH-003','Dashboard','Favorites','Unpin a tool removes it from favorites grid',
   'Tax Guide is currently pinned',
   '1. Click "★ Pinned" button on Tax Guide',
   'Button changes to "☆ Pin"; Tax Guide tile removed from favorites grid; count decremented',
   'Positive','High','Not Run'],

  ['TC-DASH-004','Dashboard','Navigation','Clicking a tool navigates to it',
   'User on Dashboard',
   '1. Click "Growth Calculator" tile or link',
   'Growth Calculator panel becomes visible; breadcrumb shows "Growth Calculator"',
   'Positive','High','Not Run'],

  ['TC-DASH-005','Dashboard','Navigation','"Back to Dashboard" link returns to dashboard',
   'User is in Growth Calculator',
   '1. Click "⬅ Dashboard" in breadcrumb',
   'Dashboard panel shown; Growth Calculator hidden',
   'Positive','High','Not Run'],

  ['TC-DASH-006','Dashboard','Mobile Dropdown','Mobile dropdown expands and collapses',
   'Viewport set to < 768px; Dashboard visible',
   '1. Click the category dropdown button\n2. Observe\n3. Click again',
   'Dropdown expands on first click (arrow rotates down); collapses on second click (arrow rotates up)',
   'Positive','Medium','Not Run'],

  ['TC-DASH-007','Dashboard','Mobile Dropdown','Selecting a tool from dropdown closes it',
   'Mobile viewport; dropdown open',
   '1. Click any tool in the dropdown',
   'Dropdown closes; selected tool panel opens',
   'Positive','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 4. GROWTH CALCULATOR
  // ══════════════════════════════════════════════════════
  ['TC-GC-001','Growth Calculator','Calculation','Basic FV calculation without toggles',
   'User logged in; Growth Calculator open',
   '1. Enter Amount: ₹1,00,000\n2. Enter Return: 12%\n3. Enter Years: 10\n4. Leave inflation and LTCG off',
   'FV ≈ ₹3,10,585 (₹1L × 1.12^10); result shown with Indian words',
   'Positive','High','Not Run'],

  ['TC-GC-002','Growth Calculator','Calculation','FV with inflation adjustment',
   'Growth Calculator open',
   '1. Enter Amount: ₹1,00,000; Return: 12%; Years: 10\n2. Turn ON Inflation toggle\n3. Set Inflation: 6%',
   'Real return ≈ 5.66%; inflation-adjusted value shown (lower than nominal FV)',
   'Positive','High','Not Run'],

  ['TC-GC-003','Growth Calculator','Calculation','FV with LTCG tax',
   'Growth Calculator open',
   '1. Enter Amount: ₹1,00,000; Return: 12%; Years: 10\n2. Turn ON LTCG Tax toggle',
   'Gains = FV - ₹1L; taxable = max(0, gains - ₹1.25L); tax = taxable × 12.5%; net value shown',
   'Positive','High','Not Run'],

  ['TC-GC-004','Growth Calculator','Edge Case','LTCG gains within ₹1.25L exemption → ₹0 tax',
   'Growth Calculator open',
   '1. Enter Amount: ₹1,00,000; Return: 12%; Years: 1\n2. Turn ON LTCG',
   'Gains ≈ ₹12,000 (< ₹1.25L); LTCG tax shown as ₹0; net = gross FV',
   'Edge Case','High','Not Run'],

  ['TC-GC-005','Growth Calculator','Edge Case','Amount = 0 shows placeholder',
   'Growth Calculator open',
   '1. Enter Amount: 0 or leave blank\n2. Set Return: 12%; Years: 10',
   'Placeholder message shown instead of calculation result',
   'Edge Case','Medium','Not Run'],

  ['TC-GC-006','Growth Calculator','Edge Case','Rate = 0 shows no growth',
   'Growth Calculator open',
   '1. Enter Amount: ₹1,00,000; Return: 0%; Years: 10',
   'FV = ₹1,00,000 (no growth); result displayed correctly',
   'Edge Case','Medium','Not Run'],

  ['TC-GC-007','Growth Calculator','Edge Case','Inflation >= Return shows negative real gain',
   'Growth Calculator open; Inflation toggle ON',
   '1. Enter Return: 5%; Inflation: 7%',
   'Real value is below principal; negative real gain displayed (no crash)',
   'Edge Case','Medium','Not Run'],

  ['TC-GC-008','Growth Calculator','Input Format','Amount formatted with Indian commas',
   'Growth Calculator open',
   '1. Type "10000000" in Amount field',
   'Field displays "1,00,00,000" (Indian format)',
   'Positive','Medium','Not Run'],

  ['TC-GC-009','Growth Calculator','Output','Amount displayed in Indian words',
   'Growth Calculator open; valid calculation done',
   '1. Enter Amount: ₹1,00,00,000; Return: 12%; Years: 10',
   'Result shows amount in words e.g., "Three Crore, Ten Lakh..."',
   'Positive','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 5. GOAL PLANNER
  // ══════════════════════════════════════════════════════
  ['TC-GP-001','Goal Planner','Lump Sum','Correct corpus required (Lump Sum mode)',
   'Goal Planner open',
   '1. Select mode: Lump Sum\n2. Goal Type: Education\n3. Goal Amount: ₹20,00,000\n4. Years: 10; Return: 12%; Inflation: off',
   'Required corpus today ≈ ₹20L / 1.12^10 ≈ ₹6,44,000 (shown in formatted output)',
   'Positive','High','Not Run'],

  ['TC-GP-002','Goal Planner','SIP','Correct monthly SIP calculated',
   'Goal Planner open',
   '1. Select mode: SIP\n2. Goal Amount: ₹50,00,000\n3. Years: 20; Return: 12%',
   'Monthly SIP calculated using SIP formula; result shown in ₹',
   'Positive','High','Not Run'],

  ['TC-GP-003','Goal Planner','Inflation','Inflation adjusts target amount',
   'Goal Planner open',
   '1. Goal Amount: ₹20,00,000; Years: 10; Inflation: 6%\n2. Compare with inflation OFF',
   'Inflated target = ₹20L × 1.06^10 ≈ ₹35.82L; corpus required is higher than without inflation',
   'Positive','High','Not Run'],

  ['TC-GP-004','Goal Planner','Save Goal','Save goal stores to Firestore',
   'User logged in; Goal calculated',
   '1. Enter goal details\n2. Click Save Goal',
   'Goal saved to Firestore appData.savedGoals; confirmation shown',
   'Positive','Medium','Not Run'],

  ['TC-GP-005','Goal Planner','Integration','Use in Financial Plan pre-fills FP',
   'Goal saved; Financial Plan tool accessible',
   '1. Save a goal\n2. Click "Use in Financial Plan"',
   'Financial Plan tool opens with goal pre-filled',
   'Positive','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 6. EMERGENCY FUND CALCULATOR
  // ══════════════════════════════════════════════════════
  ['TC-EF-001','Emergency Fund','Calculation','Correct fund for 6 months (default)',
   'Emergency Fund Calculator open',
   '1. Enter Groceries: ₹5,000; Rent: ₹15,000; Utilities: ₹2,000\n2. Coverage: 6 months (default)',
   'Emergency Fund = ₹22,000 × 6 = ₹1,32,000',
   'Positive','High','Not Run'],

  ['TC-EF-002','Emergency Fund','Calculation','Coverage months radio buttons (3/6/9/12)',
   'Emergency Fund Calculator open; total expenses: ₹20,000',
   '1. Select 3 months → verify result = ₹60,000\n2. Select 12 months → verify result = ₹2,40,000',
   'Results match total × months for each selection',
   'Positive','High','Not Run'],

  ['TC-EF-003','Emergency Fund','Custom Rows','Add custom expense category',
   'Emergency Fund Calculator open',
   '1. Click Add Row / Custom Category\n2. Enter Name: "Pet Food"; Amount: ₹2,000\n3. Observe total',
   'Custom row appears; ₹2,000 added to total expenses; fund recalculated',
   'Positive','Medium','Not Run'],

  ['TC-EF-004','Emergency Fund','Custom Rows','Remove custom expense category',
   'Custom row "Pet Food" exists',
   '1. Click Remove on custom row',
   'Row disappears; total expenses recalculated without it',
   'Positive','Medium','Not Run'],

  ['TC-EF-005','Emergency Fund','Chart','Bar chart shows correct category percentages',
   'Multiple expense categories entered',
   '1. Enter Rent: ₹15,000; Groceries: ₹5,000; Others: ₹5,000\n2. Observe chart',
   'Rent bar = 60%; Groceries = 20%; Others = 20% of total',
   'Positive','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 7. HOME LOAN ADVISOR
  // ══════════════════════════════════════════════════════
  ['TC-HLA-001','Home Loan Advisor','EMI Calc','Correct EMI calculation',
   'Home Loan Advisor open; EMI tab active',
   '1. Loan Amount: ₹50,00,000\n2. Rate: 8.5%\n3. Tenure: 20 years\n4. Click Calculate',
   'EMI ≈ ₹43,391 (verify with formula: P×r×(1+r)^n / ((1+r)^n - 1))',
   'Positive','High','Not Run'],

  ['TC-HLA-002','Home Loan Advisor','EMI Calc','Total interest > principal for long tenure',
   'EMI Calculator with inputs from TC-HLA-001',
   '1. Observe Total Interest vs Total Principal in output',
   'Total Interest > ₹50L for 20yr loan at 8.5% (interest ≈ ₹54.1L)',
   'Positive','Medium','Not Run'],

  ['TC-HLA-003','Home Loan Advisor','EMI Calc','Amortisation table toggle works',
   'EMI calculated',
   '1. Click "Show/Hide Amortisation Table"',
   'Table appears/disappears; shows Year | Principal Paid | Interest Paid | Balance',
   'Positive','Medium','Not Run'],

  ['TC-HLA-004','Home Loan Advisor','EMI Calc','Amortisation final row balance = ₹0',
   'Amortisation table visible',
   '1. Scroll to last row of amortisation table',
   'Final year balance = ₹0 (or ≈ ₹0 due to rounding)',
   'Positive','High','Not Run'],

  ['TC-HLA-005','Home Loan Advisor','Prepayment','Reduce Tenure: correct interest saved',
   'Prepayment tab active',
   '1. Loan: ₹50L; Rate: 8.5%; Tenure: 20yr\n2. Prepay ₹5L after Year 5\n3. Strategy: Reduce Tenure',
   'Interest saved > ₹0; time saved shown in months/years; total payment lower than without prepayment',
   'Positive','High','Not Run'],

  ['TC-HLA-006','Home Loan Advisor','Prepayment','Reduce EMI: new lower EMI shown',
   'Prepayment tab active; same inputs as TC-HLA-005',
   '1. Strategy: Reduce EMI\n2. Calculate',
   'New EMI < original EMI; interest saved shown',
   'Positive','High','Not Run'],

  ['TC-HLA-007','Home Loan Advisor','Prepayment','Prepayment > outstanding treated as full payoff',
   'Prepayment tab active',
   '1. Loan: ₹50L; Prepay: ₹1,00,00,000 after Year 5',
   'App treats as full payoff; shows loan closed at year 5; no crash',
   'Edge Case','Medium','Not Run'],

  ['TC-HLA-008','Home Loan Advisor','Rent vs Buy','Winner banner shows correct comparison',
   'Rent vs Buy tab active',
   '1. Property: ₹80L; Down: ₹20L; Rate: 8%; Tenure: 20yr; Appreciation: 7%\n2. Rent: ₹25,000/month; Rent increase: 5%/yr\n3. Analysis period: 20yr\n4. Calculate',
   'Winner banner shown (Buy or Rent); wealth difference in ₹ displayed',
   'Positive','High','Not Run'],

  ['TC-HLA-009','Home Loan Advisor','Rent vs Buy','Chart draws both wealth lines',
   'Rent vs Buy calculated',
   '1. Observe SVG/chart area',
   'Two lines plotted (Buy path and Rent path); crossover year labeled if applicable',
   'Positive','Medium','Not Run'],

  ['TC-HLA-010','Home Loan Advisor','Section 24(b)','New Regime + Self-Occupied shows warning',
   'Section 24(b) tab active',
   '1. Select Tax Regime: New\n2. Select Property Type: Self-Occupied\n3. Calculate',
   'Warning shown: "Section 24(b) not available under New Regime for self-occupied property"',
   'Negative','High','Not Run'],

  ['TC-HLA-011','Home Loan Advisor','Section 24(b)','Old Regime + Self-Occupied deduction capped at ₹2L/yr',
   'Section 24(b) tab active',
   '1. Loan: ₹1,00,00,000; Rate: 9%; Tenure: 20yr\n2. Old Regime; Self-Occupied; Slab: 30%\n3. Calculate',
   'Year 1 deduction capped at ₹2,00,000; tax saved = ₹2L × 30% × 1.04 = ₹62,400',
   'Positive','High','Not Run'],

  ['TC-HLA-012','Home Loan Advisor','Section 24(b)','Let-Out property deducts full interest (no cap)',
   'Section 24(b) tab active',
   '1. Loan: ₹50L; Rate: 8.5%; Old Regime; Let-Out property\n2. Calculate',
   'Year 1 deduction = full interest paid (e.g., ₹4.2L if interest > ₹2L); no ₹2L cap applied',
   'Positive','High','Not Run'],

  // ══════════════════════════════════════════════════════
  // 8. STEP-UP SIP CALCULATOR
  // ══════════════════════════════════════════════════════
  ['TC-SIP-001','Step-Up SIP','Calculation','Corpus higher than flat SIP due to step-up',
   'Step-Up SIP Calculator open',
   '1. Initial SIP: ₹10,000; Return: 12%; Duration: 20yr; Step-up: 10%\n2. Compare mentally with flat SIP of same initial amount',
   'Final corpus substantially higher than a flat ₹10,000 SIP for 20 years',
   'Positive','High','Not Run'],

  ['TC-SIP-002','Step-Up SIP','Calculation','LTCG tax reduces net corpus',
   'Step-Up SIP Calculator open',
   '1. Enter valid inputs\n2. Toggle LTCG ON\n3. Compare corpus before and after tax',
   'Net corpus (after LTCG) < gross corpus; LTCG tax amount shown',
   'Positive','High','Not Run'],

  ['TC-SIP-003','Step-Up SIP','Edge Case','LTCG gains within ₹1.25L exemption → ₹0 tax',
   'Step-Up SIP Calculator open',
   '1. SIP: ₹500; Return: 12%; Duration: 1yr; Step-up: 0%\n2. Enable LTCG',
   'Gains < ₹1.25L; LTCG tax = ₹0',
   'Edge Case','Medium','Not Run'],

  ['TC-SIP-004','Step-Up SIP','Year Table','Year-by-year table shows increasing SIP amount',
   'Calculation done with 10% step-up',
   '1. Observe year-by-year breakdown table',
   'SIP amount in Year 2 = Year 1 × 1.10; increases each year',
   'Positive','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 9. TAX GUIDE
  // ══════════════════════════════════════════════════════
  ['TC-TG-001','Tax Guide','Old Regime','Correct tax for ₹20L gross (Old Regime)',
   'Tax Guide open',
   '1. Gross Salary: ₹20,00,000\n2. Select Old Regime\n3. 80C: ₹1,50,000; 80D: ₹25,000\n4. Calculate',
   'Taxable = ₹20L - ₹50K (std) - ₹1.5L (80C) - ₹25K (80D) = ₹17.75L\nTax: ₹2.5L×0 + ₹2.5L×5% + ₹5L×20% + ₹7.75L×30% + 4% cess',
   'Positive','High','Not Run'],

  ['TC-TG-002','Tax Guide','New Regime','Correct tax for ₹20L gross (New Regime)',
   'Tax Guide open',
   '1. Gross Salary: ₹20,00,000\n2. Select New Regime\n3. No deductions (except ₹75K std deduction)',
   'Taxable = ₹20L - ₹75K = ₹19.25L\nNew slab rates applied; 87A rebate not applicable (> ₹12L)\n4% cess applied',
   'Positive','High','Not Run'],

  ['TC-TG-003','Tax Guide','87A Rebate','Old Regime: full rebate for taxable ≤ ₹5L',
   'Tax Guide open',
   '1. Gross Salary: ₹7,00,000; 80C: ₹1,50,000; Regime: Old\n2. Taxable = ₹7L - ₹50K - ₹1.5L = ₹5L',
   'Tax = ₹0 (87A rebate applied); note shown indicating rebate',
   'Positive','High','Not Run'],

  ['TC-TG-004','Tax Guide','87A Rebate','New Regime: full rebate for taxable ≤ ₹12L',
   'Tax Guide open',
   '1. Gross Salary: ₹12,75,000; New Regime\n2. Taxable = ₹12.75L - ₹75K = ₹12L',
   'Tax = ₹0 (Budget 2025 87A rebate applied); note shown',
   'Positive','High','Not Run'],

  ['TC-TG-005','Tax Guide','87A Rebate','New Regime: tax applies for taxable > ₹12L',
   'Tax Guide open',
   '1. Gross Salary: ₹14,00,000; New Regime; no deductions beyond std',
   'Taxable = ₹14L - ₹75K = ₹13.25L > ₹12L; 87A rebate NOT applied; tax > ₹0',
   'Positive','High','Not Run'],

  ['TC-TG-006','Tax Guide','Surcharge','Surcharge applied for income > ₹50L',
   'Tax Guide open',
   '1. Gross Salary: ₹60,00,000; New Regime',
   '10% surcharge applied on base tax; total = tax + surcharge + 4% cess',
   'Positive','High','Not Run'],

  ['TC-TG-007','Tax Guide','Winner Banner','Winner highlighted correctly',
   'Tax Guide open; both regimes computed',
   '1. Enter inputs where New Regime is clearly better\n2. Observe winner banner',
   'Green banner: "New Regime saves ₹X/year"',
   'Positive','Medium','Not Run'],

  ['TC-TG-008','Tax Guide','Investable Surplus','Surplus = take-home minus expenses',
   'Tax Guide; Monthly Expenses entered',
   '1. Enter all inputs; Monthly Expenses: ₹60,000\n2. Observe surplus section',
   'Free Surplus = Monthly take-home - EPF contribution - ₹60,000; savings rate % shown',
   'Positive','High','Not Run'],

  ['TC-TG-009','Tax Guide','Integration','Send Surplus to Financial Plan',
   'Tax Guide with surplus calculated; FP tool accessible',
   '1. Click "Send Surplus to Financial Plan"',
   'Financial Plan tool opens; monthly investment field pre-filled with surplus amount',
   'Positive','High','Not Run'],

  ['TC-TG-010','Tax Guide','Post-Tax Return','Equity-LT post-tax return shown correctly',
   'Tax Guide open; post-tax return calculator section visible',
   '1. Enter Pre-tax return: 15%\n2. Fund type: Equity-LT',
   'Post-tax return = 15% adjusted for 12.5% LTCG; 10-year corpus impact shown',
   'Positive','Medium','Not Run'],

  ['TC-TG-011','Tax Guide','Regime Switch','Switching regime updates slab options',
   'Tax Guide open; Old Regime selected',
   '1. Switch to New Regime\n2. Observe slab breakdown',
   'Slab breakdown updates to New Regime slabs; deduction fields grey out/hide',
   'Positive','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 10. FINANCIAL PLAN
  // ══════════════════════════════════════════════════════
  ['TC-FP-001','Financial Plan','Goals','Toggle goals on and off',
   'Financial Plan open; Step 1 visible',
   '1. Click Education tile to enable\n2. Click Marriage tile to enable\n3. Click Education to disable',
   'Education deselected; Marriage remains selected; state saved',
   'Positive','High','Not Run'],

  ['TC-FP-002','Financial Plan','Risk Profile','Risk questionnaire produces score',
   'Financial Plan Step 2 visible',
   '1. Answer all risk questions\n2. Submit questionnaire',
   'Risk profile assigned: Conservative / Moderate / Aggressive; saved to Firestore riskProfile',
   'Positive','High','Not Run'],

  ['TC-FP-003','Financial Plan','Existing Corpus','Asset checkboxes show amount fields',
   'Financial Plan Step 3 visible',
   '1. Check "EPF" checkbox\n2. Observe',
   'Amount input field appears for EPF; enter ₹5,00,000',
   'Positive','Medium','Not Run'],

  ['TC-FP-004','Financial Plan','Existing Corpus','Crypto checkbox shows confirmation popup',
   'Financial Plan Step 3 visible',
   '1. Check "Crypto" checkbox',
   'One-time confirmation popup appears before allowing entry',
   'Positive','Medium','Not Run'],

  ['TC-FP-005','Financial Plan','Plan Generation','Plan generated with recommendations',
   'All steps completed with valid inputs',
   '1. Complete Steps 1–4 with valid data\n2. Click Generate Plan',
   'Comprehensive text plan shown with goal projections, allocation recommendation, timeline',
   'Positive','High','Not Run'],

  ['TC-FP-006','Financial Plan','Persistence','All FP state restored on reload',
   'FP completed and saved',
   '1. Complete FP\n2. Logout and login\n3. Navigate to Financial Plan',
   'All goals, risk profile, corpus, investment amounts restored; no duplicates',
   'Positive','High','Not Run'],

  // ══════════════════════════════════════════════════════
  // 11. EPF CORPUS PROJECTOR
  // ══════════════════════════════════════════════════════
  ['TC-EPF-001','EPF Corpus Projector','Calculation','Correct corpus at retirement',
   'EPF Calculator open',
   '1. Current Balance: ₹5,00,000\n2. Annual Basic: ₹6,00,000\n3. Current Age: 30; Retirement: 60\n4. Rate: 8%; Employee contrib: 12%',
   'Projected EPF balance > ₹5L (grows with contributions + interest over 30yr)',
   'Positive','High','Not Run'],

  ['TC-EPF-002','EPF Corpus Projector','Calculation','Employer contribution (8.67%) included',
   'EPF Calculator open; same inputs as TC-EPF-001',
   '1. Observe breakdown of contributions',
   'Employer contribution = Basic × 8.67% / 100 per month added to corpus',
   'Positive','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 12. PPF & NPS CALCULATOR
  // ══════════════════════════════════════════════════════
  ['TC-PPF-001','PPF & NPS','PPF','PPF maturity after 15 years',
   'PPF tab active',
   '1. Annual Contribution: ₹1,50,000; Current Balance: ₹0; Years Completed: 0; Rate: 7.1%',
   'Maturity ≈ ₹40.7L after 15 years at 7.1%',
   'Positive','High','Not Run'],

  ['TC-PPF-002','PPF & NPS','PPF','Annual contribution capped at ₹1.5L',
   'PPF tab active',
   '1. Try entering Annual Contribution > ₹1,50,000',
   'Note or warning shown that PPF annual limit is ₹1,50,000',
   'Negative','Medium','Not Run'],

  ['TC-PPF-003','PPF & NPS','NPS','Monthly pension calculated correctly',
   'NPS tab active',
   '1. Monthly Contribution: ₹10,000; Age: 30; Balance: 0; Return: 10%; Annuity: 6%',
   'Pension = FV × 6% / 12; FV based on 30-year SIP at 10% return',
   'Positive','High','Not Run'],

  // ══════════════════════════════════════════════════════
  // 13. GRATUITY CALCULATOR
  // ══════════════════════════════════════════════════════
  ['TC-GRT-001','Gratuity Calculator','Calculation','Correct gratuity for Act-covered employee',
   'Gratuity Calculator open',
   '1. Basic: ₹50,000/month\n2. Years: 10; Months: 0\n3. Type: Covered under Act\n4. Tax Slab: 30%; Old Regime',
   'Gratuity = 50000 × 10 × 15/26 = ₹2,88,462\nCapped at ₹20L (not triggered here)\nExemption ₹10L not triggered\nNet = ₹2,88,462',
   'Positive','High','Not Run'],

  ['TC-GRT-002','Gratuity Calculator','Cap','Gratuity capped at ₹20,00,000',
   'Gratuity Calculator open',
   '1. Basic: ₹2,00,000/month; Years: 30; Type: Covered',
   'Calculated gratuity > ₹20L but output shows ₹20,00,000 (statutory cap)',
   'Edge Case','High','Not Run'],

  ['TC-GRT-003','Gratuity Calculator','Tax','Exemption ₹10L applied before tax',
   'Gratuity Calculator open; gratuity > ₹10L',
   '1. Calculate gratuity > ₹10L\n2. Observe taxable amount',
   'Taxable = Gratuity - ₹10,00,000; tax = Taxable × slab',
   'Positive','High','Not Run'],

  // ══════════════════════════════════════════════════════
  // 14. CAPITAL GAINS CALCULATOR
  // ══════════════════════════════════════════════════════
  ['TC-CG-001','Capital Gains','Equity ST','Equity held ≤ 12 months → 15% STCG',
   'Capital Gains Calculator open',
   '1. Asset: Equity; Buy: 01-Jan-2024; Sell: 01-Jun-2024\n2. Cost: ₹1,00,000; Sale: ₹1,20,000',
   'Classified as Short-Term; tax = ₹20,000 × 15% = ₹3,000',
   'Positive','High','Not Run'],

  ['TC-CG-002','Capital Gains','Equity LT','Equity held > 12 months → 12.5% LTCG with ₹1.25L exemption',
   'Capital Gains Calculator open',
   '1. Asset: Equity; Buy: 01-Jan-2023; Sell: 01-Jun-2024\n2. Cost: ₹1,00,000; Sale: ₹2,50,000',
   'Classified as Long-Term; gains = ₹1.5L; taxable = max(0, ₹1.5L - ₹1.25L) = ₹25,000; tax = ₹3,125',
   'Positive','High','Not Run'],

  ['TC-CG-003','Capital Gains','Equity LT','LTCG ≤ ₹1.25L → ₹0 tax',
   'Capital Gains Calculator open',
   '1. Asset: Equity; gains = ₹50,000 (< ₹1.25L exemption)',
   'LTCG tax = ₹0; net gain = ₹50,000',
   'Edge Case','High','Not Run'],

  ['TC-CG-004','Capital Gains','Real Estate','Real estate held > 24 months → LT classification',
   'Capital Gains Calculator open',
   '1. Asset: Real Estate; Buy: 01-Jan-2021; Sell: 01-Jun-2024\n2. Cost: ₹50L; Sale: ₹80L',
   'Classified as Long-Term; 20% with indexation or 10% without offered',
   'Positive','High','Not Run'],

  // ══════════════════════════════════════════════════════
  // 15. HRA CALCULATOR
  // ══════════════════════════════════════════════════════
  ['TC-HRA-001','HRA Calculator','Old Regime Metro','HRA exemption = min of 3 amounts (metro)',
   'HRA Calculator open',
   '1. Basic: ₹50,000/month\n2. HRA received: ₹20,000\n3. Rent paid: ₹18,000\n4. City: Metro; Old Regime; Slab: 30%',
   '50% basic = ₹25,000; HRA = ₹20,000; rent-10%basic = ₹18K-₹5K=₹13,000\nExemption = min(₹25K,₹20K,₹13K) = ₹13,000',
   'Positive','High','Not Run'],

  ['TC-HRA-002','HRA Calculator','New Regime','No HRA exemption under New Regime',
   'HRA Calculator open',
   '1. Enter valid inputs\n2. Select New Regime',
   'HRA Exemption = ₹0; note shown explaining no HRA benefit under New Regime',
   'Negative','High','Not Run'],

  // ══════════════════════════════════════════════════════
  // 16. NET WORTH TRACKER
  // ══════════════════════════════════════════════════════
  ['TC-NW-001','Net Worth Tracker','Calculation','Net worth = assets minus liabilities',
   'Net Worth Tracker open',
   '1. Savings: ₹5,00,000; Stocks: ₹10,00,000\n2. Home Loan: ₹30,00,000; Credit Card: ₹50,000',
   'Net Worth = ₹15,00,000 - ₹30,50,000 = -₹15,50,000 (negative displayed correctly)',
   'Positive','High','Not Run'],

  ['TC-NW-002','Net Worth Tracker','Positive NW','Positive net worth displayed correctly',
   'Net Worth Tracker open',
   '1. Total Assets: ₹1,00,00,000; Total Liabilities: ₹20,00,000',
   'Net Worth = ₹80,00,000 (shown with Indian formatting)',
   'Positive','High','Not Run'],

  ['TC-NW-003','Net Worth Tracker','History','Snapshot saved to history',
   'User logged in; Net Worth calculated',
   '1. Enter all asset/liability values\n2. Click Save Snapshot',
   'Snapshot saved to Firestore appData.nwHistory; date shown in history',
   'Positive','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 17. INSURANCE ADEQUACY CALCULATOR
  // ══════════════════════════════════════════════════════
  ['TC-INS-001','Insurance Adequacy','Calculation','Recommended term coverage > current coverage',
   'Insurance Adequacy open',
   '1. Annual Income: ₹10,00,000; Age: 35; Dependents: 2\n2. Outstanding Loan: ₹30,00,000\n3. Current Term: ₹25,00,000',
   'Recommended term > ₹25L; gap = recommended - current highlighted',
   'Positive','High','Not Run'],

  ['TC-INS-002','Insurance Adequacy','Gap Analysis','Priority ranking shown',
   'Insurance Adequacy calculated with gaps',
   '1. Observe output section',
   'Coverage types prioritized (e.g., Term first, then Health, CI, Disability)',
   'Positive','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 18. DRAWDOWN PLANNER
  // ══════════════════════════════════════════════════════
  ['TC-DP-001','Drawdown Planner','Calculation','Corpus survives to expected life',
   'Drawdown Planner open',
   '1. Corpus: ₹5,00,00,000; Current Age: 60; Life Expectancy: 90\n2. Annual Expenses: ₹12,00,000; Inflation: 6%; Return: 8%',
   'Year-by-year table shows corpus balance; indicates adequacy or year of depletion',
   'Positive','High','Not Run'],

  ['TC-DP-002','Drawdown Planner','Edge Case','Corpus depleted before life expectancy shown',
   'Drawdown Planner open',
   '1. Corpus: ₹50,00,000; Annual Expenses: ₹10,00,000; Return: 5%; Inflation: 7%',
   'Depletion year shown; warning/recommendation displayed',
   'Edge Case','High','Not Run'],

  // ══════════════════════════════════════════════════════
  // 19. CIBIL SCORE TRACKER
  // ══════════════════════════════════════════════════════
  ['TC-CIBIL-001','CIBIL Score Tracker','Score Band','750+ score interpreted as Excellent',
   'CIBIL Tracker open',
   '1. Enter CIBIL Score: 780',
   'Interpretation: "Excellent" or "Good" shown with green indicator',
   'Positive','Medium','Not Run'],

  ['TC-CIBIL-002','CIBIL Score Tracker','Score Band','Score below 600 interpreted as Poor',
   'CIBIL Tracker open',
   '1. Enter CIBIL Score: 550',
   'Interpretation: "Poor" shown with red indicator; improvement recommendations shown',
   'Negative','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 20. BUDGET & EXPENSE TRACKER
  // ══════════════════════════════════════════════════════
  ['TC-BT-001','Budget Tracker','Chart','Bar chart renders for monthly expenses',
   'Budget Tracker open',
   '1. Enter Food: ₹5,000; Transport: ₹2,000; Shopping: ₹3,000\n2. Select Chart: Bar',
   'Bar chart rendered with correct category amounts and colors',
   'Positive','Medium','Not Run'],

  ['TC-BT-002','Budget Tracker','Chart Type','Switch chart type between Bar/Pie/Line',
   'Budget Tracker with data entered',
   '1. Switch from Bar to Pie\n2. Switch to Line',
   'Chart updates to reflect selected type without data loss',
   'Positive','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 21. GOLD COMPARATOR
  // ══════════════════════════════════════════════════════
  ['TC-GOLD-001','Gold Comparator','Comparison','Paper gold has higher net value (no making/locker charges)',
   'Gold Comparator open',
   '1. Amount: ₹1,00,000; Years: 10; Return: 8%\n2. Making Charges: ₹5,000; Locker: ₹500/month',
   'Paper gold net value > Physical gold net value (due to lower costs)',
   'Positive','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 22. MF EXPLORER
  // ══════════════════════════════════════════════════════
  ['TC-MFE-001','MF Explorer','Load','Fund list loads successfully',
   'MF Explorer opened',
   '1. Navigate to MF Explorer\n2. Wait for data to load',
   'Funds table appears with 25 per page; total count shown',
   'Positive','High','Not Run'],

  ['TC-MFE-002','MF Explorer','Category Filter','Category dropdown filters fund list',
   'MF Explorer loaded',
   '1. Select Category: Equity\n2. Sub-category: Large Cap',
   'Fund list shows only Large Cap Equity funds',
   'Positive','High','Not Run'],

  ['TC-MFE-003','MF Explorer','Search','Autocomplete shows ≤ 8 suggestions',
   'MF Explorer loaded',
   '1. Type "HDFC" in search box',
   '≤ 8 HDFC fund suggestions shown in dropdown',
   'Positive','High','Not Run'],

  ['TC-MFE-004','MF Explorer','Search','Keyboard navigation in autocomplete',
   'MF Explorer search; 8 suggestions shown',
   '1. Press ↓ arrow twice\n2. Press Enter',
   'Third suggestion highlighted and selected; fund detail shown',
   'Positive','Medium','Not Run'],

  ['TC-MFE-005','MF Explorer','Sort','Sort by 3Y CAGR descending',
   'MF Explorer with funds loaded',
   '1. Click "3Y CAGR" column header\n2. Click again to reverse',
   'First click: ascending order; second click: descending order; highest CAGR at top',
   'Positive','High','Not Run'],

  ['TC-MFE-006','MF Explorer','Pagination','Next/Previous page navigation',
   'MF Explorer with > 25 funds loaded',
   '1. Click Next page\n2. Click Previous page',
   'Page 2 shows different 25 funds; Previous returns to page 1',
   'Positive','Medium','Not Run'],

  ['TC-MFE-007','MF Explorer','Star Rating','5-star fund is in top 10%',
   'MF Explorer with rated funds',
   '1. Observe star ratings\n2. Find a 5★ fund',
   '5★ badge shown with label "Elite"; metric badges colored green',
   'Positive','Medium','Not Run'],

  ['TC-MFE-008','MF Explorer','Insufficient Data','Fund with < 30 NAV points shows "—"',
   'MF Explorer loaded',
   '1. Find a new fund (< 1 year old)\n2. Observe metrics',
   'Metrics show "—" or "Insufficient data" instead of calculated values; no crash',
   'Edge Case','Medium','Not Run'],

  ['TC-MFE-009','MF Explorer','API Timeout','App handles mfapi.in timeout gracefully',
   'Network throttled to simulate timeout',
   '1. Open MF Explorer\n2. Wait > 25 seconds',
   'Timeout message shown; no JavaScript error in console; user can retry',
   'Negative','High','Not Run'],

  // ══════════════════════════════════════════════════════
  // 23. FUND COMPARATOR
  // ══════════════════════════════════════════════════════
  ['TC-FC-001','Fund Comparator','Add Fund','Add fund via search',
   'Fund Comparator open',
   '1. Type fund name in search\n2. Select from autocomplete',
   'Fund added to comparator table; metrics shown',
   'Positive','High','Not Run'],

  ['TC-FC-002','Fund Comparator','Max Limit','Adding 6th fund shows alert',
   'Fund Comparator with 5 funds',
   '1. Search for a 6th fund\n2. Try to add it',
   'Alert shown: maximum 5 funds; 6th fund not added',
   'Negative','High','Not Run'],

  ['TC-FC-003','Fund Comparator','Remove','Remove individual fund',
   'Fund Comparator with 3 funds',
   '1. Click Remove on the second fund',
   'Second fund removed; remaining 2 funds displayed correctly',
   'Positive','Medium','Not Run'],

  ['TC-FC-004','Fund Comparator','Highlighting','Best value highlighted green; worst highlighted red',
   'Fund Comparator with ≥ 2 funds',
   '1. Observe CAGR column across funds',
   'Highest CAGR cell has green background; lowest has red background',
   'Positive','Medium','Not Run'],

  ['TC-FC-005','Fund Comparator','Persistence','Fund list restored from localStorage',
   'User added 2 funds; closed tab',
   '1. Reopen app; navigate to Fund Comparator',
   'Same 2 funds appear (restored from localStorage)',
   'Positive','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 24. FINANCIAL HEALTH SCORE
  // ══════════════════════════════════════════════════════
  ['TC-FHS-001','Financial Health Score','Scoring','Overall score ≥ 70 shows green',
   'Financial Health Score open; high-scoring inputs',
   '1. Enter low EMI ratio, high savings, adequate insurance, diversified portfolio\n2. Calculate',
   'Score > 70; displayed in green; "Good Financial Health" or equivalent',
   'Positive','Medium','Not Run'],

  ['TC-FHS-002','Financial Health Score','Scoring','Score < 40 shows red with recommendations',
   'Financial Health Score open; poor inputs',
   '1. Enter high EMI, no insurance, no savings\n2. Calculate',
   'Score < 40; shown in red; improvement recommendations displayed',
   'Negative','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 25. GUEST MODE
  // ══════════════════════════════════════════════════════
  ['TC-GUEST-001','Guest Mode','Access','Calculators work without login',
   'App loaded; not signed in',
   '1. Click "Skip" / "Sign In Later"\n2. Navigate to Growth Calculator\n3. Enter values and calculate',
   'Calculation works normally; result shown',
   'Positive','High','Not Run'],

  ['TC-GUEST-002','Guest Mode','No Persistence','Data lost on page refresh in guest mode',
   'Guest mode active; Growth Calculator open',
   '1. Enter Amount: ₹10,00,000\n2. Refresh browser',
   'Amount field is empty after refresh (no Firestore save)',
   'Positive','High','Not Run'],

  ['TC-GUEST-003','Guest Mode','Breadcrumb','"⬅ Sign In" shown instead of "⬅ Dashboard"',
   'Guest mode active; inside a tool',
   '1. Navigate to Tax Guide\n2. Observe breadcrumb',
   'Breadcrumb back link shows "⬅ Sign In"',
   'Positive','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 26. ERROR HANDLING
  // ══════════════════════════════════════════════════════
  ['TC-ERR-001','Error Handling','Calculation','NaN or Infinity never displayed to user',
   'Any calculator open',
   '1. Enter Rate: 0; Division scenarios\n2. Observe results',
   'No "NaN", "Infinity", or "undefined" shown anywhere in the UI',
   'Negative','High','Not Run'],

  ['TC-ERR-002','Error Handling','API','mfapi.in non-200 response shows — not crash',
   'MF Explorer loaded; simulate HTTP error for a fund',
   '1. Block one fund\'s API request (via DevTools → Network → Block)\n2. Reload MF Explorer',
   'Blocked fund shows "—" for metrics; other funds still load; no JavaScript error',
   'Negative','High','Not Run'],

  ['TC-ERR-003','Error Handling','Firestore','Firestore write failure shows no crash',
   'User logged in; DevTools → block Firestore write',
   '1. Enter value in Growth Calculator\n2. Wait 2 seconds',
   'Console warning logged; no user-facing crash; app continues to function',
   'Negative','Medium','Not Run'],

  ['TC-ERR-004','Error Handling','LocalStorage','Corrupted localStorage handled gracefully',
   'App not loaded',
   '1. Open DevTools → Application → LocalStorage\n2. Set aw_dash_favs = "INVALID_JSON"\n3. Load app',
   'App loads normally; defaults used (no crash from JSON parse error)',
   'Edge Case','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 27. INPUT VALIDATION
  // ══════════════════════════════════════════════════════
  ['TC-INP-001','Input Validation','Number Format','Non-numeric characters rejected in ₹ field',
   'Any calculator with ₹ input',
   '1. Type "abc" in an Amount field',
   'Characters rejected; field remains empty or shows only numeric content',
   'Negative','High','Not Run'],

  ['TC-INP-002','Input Validation','Number Format','Indian comma formatting applied as typed',
   'Any calculator with ₹ input',
   '1. Type "10000000"',
   'Field shows "1,00,00,000" (Indian format)',
   'Positive','High','Not Run'],

  ['TC-INP-003','Input Validation','Number Format','Very large amount (₹1 crore+) formatted correctly',
   'Growth Calculator open',
   '1. Enter Amount: ₹10,00,00,000 (10 crore)',
   'Displayed as "10,00,00,000"; result computes without overflow',
   'Edge Case','Medium','Not Run'],

  ['TC-INP-004','Input Validation','Percentage','Percentage field accepts decimals',
   'Any calculator with % input',
   '1. Enter Rate: 8.75%',
   'Value accepted; calculation uses 8.75% correctly',
   'Positive','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 28. SECURITY
  // ══════════════════════════════════════════════════════
  ['TC-SEC-001','Security','XSS','Script injection in text field does not execute',
   'Any tool with text input (e.g., custom expense name)',
   '1. Enter <script>alert("xss")</script> in a text field\n2. Observe',
   'Script not executed; text displayed as literal string or sanitized; no alert popup',
   'Negative','High','Not Run'],

  ['TC-SEC-002','Security','Data Isolation','User A cannot see User B data',
   'Two accounts: UserA and UserB with separate data',
   '1. Login as UserA; note Firestore UID\n2. Logout; Login as UserB\n3. Navigate to all calculators',
   'UserB sees only their own data; UserA data not visible',
   'Negative','High','Not Run'],

  ['TC-SEC-003','Security','Password','Password not visible in DOM or console',
   'Login form visible',
   '1. Enter password\n2. Inspect page element for password field\n3. Check browser console',
   'Password input type="password" (masked); not logged to console',
   'Positive','High','Not Run'],

  ['TC-SEC-004','Security','LocalStorage','LocalStorage contains no sensitive data',
   'User logged in; data saved',
   '1. Open DevTools → Application → LocalStorage\n2. Inspect all keys',
   'Only non-sensitive data: aw_dash_favs (tool IDs), am_mfc_funds (fund codes); no passwords/tokens',
   'Positive','High','Not Run'],

  // ══════════════════════════════════════════════════════
  // 29. RESPONSIVE & MOBILE
  // ══════════════════════════════════════════════════════
  ['TC-MOB-001','Responsive','Mobile','App loads correctly on 375px viewport',
   'Browser set to mobile emulation (375px width)',
   '1. Open app\n2. Navigate to dashboard\n3. Open Growth Calculator',
   'No horizontal overflow; all buttons/inputs accessible; text readable',
   'Positive','High','Not Run'],

  ['TC-MOB-002','Responsive','Mobile','Tables scroll horizontally on mobile',
   'Mobile viewport; Tax Guide comparison table visible',
   '1. Swipe left on comparison table',
   'Table scrolls horizontally; no content cut off',
   'Positive','Medium','Not Run'],

  // ══════════════════════════════════════════════════════
  // 30. PERFORMANCE
  // ══════════════════════════════════════════════════════
  ['TC-PERF-001','Performance','Load Time','Initial page load < 3 seconds',
   'Browser cache cleared',
   '1. Clear browser cache\n2. Open app URL\n3. Note time from navigation to dashboard visible',
   'Dashboard visible within 3 seconds',
   'Positive','High','Not Run'],

  ['TC-PERF-002','Performance','Calculation','Calculator result appears < 100ms',
   'Growth Calculator open',
   '1. Enter all values\n2. Change a single input and time the result update',
   'Result updates within 100ms (near instant)',
   'Positive','Medium','Not Run'],

  ['TC-PERF-003','Performance','MF Explorer','MF list loads in < 5 seconds',
   'MF Explorer opened; network in normal condition',
   '1. Navigate to MF Explorer\n2. Time from click to first fund row visible',
   'Funds appear within 5 seconds',
   'Positive','Medium','Not Run'],

  ['TC-PERF-004','Performance','Console','No console errors during normal use',
   'DevTools console open',
   '1. Login\n2. Navigate through 5 different tools\n3. Use each tool briefly',
   'Console shows no red errors (warnings acceptable)',
   'Positive','High','Not Run'],

  // ══════════════════════════════════════════════════════
  // 31. BROWSER COMPATIBILITY
  // ══════════════════════════════════════════════════════
  ['TC-BRWS-001','Browser Compatibility','Chrome','Full smoke test on Chrome (latest)',
   'Chrome latest installed',
   '1. Open app in Chrome\n2. Login; navigate to 3 calculators; calculate; logout',
   'All features work; no console errors',
   'Positive','High','Not Run'],

  ['TC-BRWS-002','Browser Compatibility','Firefox','Full smoke test on Firefox (latest)',
   'Firefox latest installed',
   '1. Open app in Firefox\n2. Login; navigate to 3 calculators; calculate; logout',
   'All features work; no console errors',
   'Positive','High','Not Run'],

  ['TC-BRWS-003','Browser Compatibility','Safari','Full smoke test on Safari (latest)',
   'Safari on macOS or iOS',
   '1. Open app in Safari\n2. Login; navigate to 3 calculators; calculate; logout',
   'All features work; no console errors',
   'Positive','High','Not Run'],

  ['TC-BRWS-004','Browser Compatibility','Edge','Full smoke test on Edge (latest)',
   'Microsoft Edge latest installed',
   '1. Open app in Edge\n2. Login; navigate to 3 calculators; calculate; logout',
   'All features work; no console errors',
   'Positive','High','Not Run'],

  // ══════════════════════════════════════════════════════
  // 32. ACCESSIBILITY
  // ══════════════════════════════════════════════════════
  ['TC-ACC-001','Accessibility','Keyboard','All interactive elements reachable via Tab',
   'Dashboard visible',
   '1. Do not use mouse\n2. Press Tab repeatedly through the page',
   'Every button, input, and link gains focus; focus indicator visible',
   'Positive','Medium','Not Run'],

  ['TC-ACC-002','Accessibility','Keyboard','Enter key activates focused button',
   'A button is focused via Tab',
   '1. Tab to a Calculate button\n2. Press Enter',
   'Calculation executes as if clicked',
   'Positive','Medium','Not Run'],

];

// ─── Build Workbook ────────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();

// ── Sheet 1: All Test Cases ────────────────────────────────────────────────────
const headers = [
  'Test Case ID', 'Module', 'Sub-Module', 'Test Case Title',
  'Preconditions', 'Test Steps', 'Expected Result',
  'Type', 'Priority', 'Status', 'Actual Result', 'Remarks'
];

const tcRows = [headers, ...TC.map(r => [...r, '', ''])]; // add Actual Result + Remarks
const wsTc = XLSX.utils.aoa_to_sheet(tcRows);

// Column widths
wsTc['!cols'] = [
  { wch: 14 },  // ID
  { wch: 22 },  // Module
  { wch: 22 },  // Sub-Module
  { wch: 50 },  // Title
  { wch: 40 },  // Preconditions
  { wch: 65 },  // Steps
  { wch: 60 },  // Expected
  { wch: 12 },  // Type
  { wch: 10 },  // Priority
  { wch: 12 },  // Status
  { wch: 35 },  // Actual Result
  { wch: 25 },  // Remarks
];

XLSX.utils.book_append_sheet(wb, wsTc, 'Test Cases');

// ── Sheet 2: Summary by Module ─────────────────────────────────────────────────
const moduleCount = {};
const priorityCount = { High: 0, Medium: 0, Low: 0 };
const typeCount = { Positive: 0, Negative: 0, 'Edge Case': 0 };

TC.forEach(([id, module, , , , , , type, priority]) => {
  moduleCount[module] = (moduleCount[module] || 0) + 1;
  if (priorityCount[priority] !== undefined) priorityCount[priority]++;
  if (typeCount[type] !== undefined) typeCount[type]++;
});

const summaryRows = [
  ['TEST SUMMARY', ''],
  ['Total Test Cases', TC.length],
  ['', ''],
  ['BY MODULE', 'Count'],
  ...Object.entries(moduleCount).sort((a, b) => b[1] - a[1]),
  ['', ''],
  ['BY PRIORITY', 'Count'],
  ...Object.entries(priorityCount),
  ['', ''],
  ['BY TYPE', 'Count'],
  ...Object.entries(typeCount),
  ['', ''],
  ['STATUS TRACKER', ''],
  ['Not Run', TC.length],
  ['Pass', 0],
  ['Fail', 0],
  ['Blocked', 0],
];

const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
wsSummary['!cols'] = [{ wch: 35 }, { wch: 12 }];
XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

// ── Sheet 3: Quick Lookup (ID → Title) ────────────────────────────────────────
const lookupRows = [
  ['Test Case ID', 'Module', 'Title', 'Priority', 'Type', 'Status'],
  ...TC.map(([id, module, , title, , , , type, priority, status]) =>
    [id, module, title, priority, type, status]
  )
];
const wsLookup = XLSX.utils.aoa_to_sheet(lookupRows);
wsLookup['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 55 }, { wch: 10 }, { wch: 12 }, { wch: 12 }];
XLSX.utils.book_append_sheet(wb, wsLookup, 'Quick Lookup');

// ── Write file ────────────────────────────────────────────────────────────────
const outPath = 'C:\\Users\\sruja\\Desktop\\Vamshi\\CoderVamshi\\Aishwaryamasthu\\AishwaryaMasthu_TestCases.xlsx';
XLSX.writeFile(wb, outPath);
console.log(`Excel file written: ${outPath}`);
console.log(`Total test cases: ${TC.length}`);
