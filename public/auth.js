    /* ============================================================
       COIN PARTICLES
    ============================================================ */
    (function() {
        const container = document.getElementById('coins-container');
        for (let i = 0; i < 16; i++) {
            const c = document.createElement('div');
            c.className = 'coin';
            const size = 4 + Math.random() * 7;
            c.style.cssText = `
                left: ${Math.random() * 100}vw;
                bottom: -12px;
                width: ${size}px;
                height: ${size}px;
                animation-duration: ${7 + Math.random() * 9}s;
                animation-delay: ${Math.random() * 5}s;
            `;
            container.appendChild(c);
        }
    })();

    /* ============================================================
       FIREBASE AUTH + FIRESTORE  (replaces localStorage demo tier)
       Passwords handled by Firebase (bcrypt) — never touch JS
       Data stored in Firestore, isolated per user by security rules
    ============================================================ */

    // ── Firebase SDK (CDN, no build tools needed) ──
    const _fbScripts = [
        'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
        'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js'
    ];
    let _fbLoaded = 0;
    let _fbAuth, _fbDb;

    function _loadFirebase() {
        _fbScripts.forEach(src => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = () => { _fbLoaded++; if (_fbLoaded === _fbScripts.length) _initFirebase(); };
            document.head.appendChild(s);
        });
    }
    _loadFirebase();

    function _initFirebase() {
        const cfg = {
            apiKey:            "AIzaSyBPi4Vl-PuND-dUPO4XCre6PzKSz1CGB3M",
            authDomain:        "aishwaryamasthu-66c6f.firebaseapp.com",
            projectId:         "aishwaryamasthu-66c6f",
            storageBucket:     "aishwaryamasthu-66c6f.firebasestorage.app",
            messagingSenderId: "270484363947",
            appId:             "1:270484363947:web:494c86d4f8a94ac618f5ee"
        };
        if (!firebase.apps.length) firebase.initializeApp(cfg);
        _fbAuth = firebase.auth();
        _fbDb   = firebase.firestore();

        // ── Auth state listener — single source of truth for splash ──
        _fbAuth.onAuthStateChanged(user => {
            const authPanel    = document.getElementById('auth-panel');
            const welcomePanel = document.getElementById('auth-welcome');
            const bar          = document.getElementById('user-bar');

            const greet        = document.getElementById('nav-user-greeting');

            if (user) {
                const fname = (user.displayName || user.email).split(' ')[0];
                const dname = user.displayName || user.email;
                if (document.getElementById('welcome-greeting'))
                    document.getElementById('welcome-greeting').textContent = `Welcome back, ${fname}! 👋`;
                if (welcomePanel) { welcomePanel.style.display = 'flex'; }
                if (authPanel)    { authPanel.style.display    = 'none'; }
                if (bar && greet) {
                    greet.textContent = '👋 ' + dname;
                    bar.classList.remove('hidden');
                    bar.style.display = 'flex';
                }
                // Load this user's saved data after auth confirms
                if (typeof loadUserData === 'function') loadUserData();
            } else {
                if (authPanel)    { authPanel.style.display    = 'block'; }
                if (welcomePanel) { welcomePanel.style.display = 'none';  }
                if (bar)          { bar.style.display = 'none'; bar.classList.add('hidden'); }
            }
        });

        // Enable Google sign-in button if present
        const gBtn = document.getElementById('btn-google-signin');
        if (gBtn) gBtn.style.display = 'flex';
    }

    /* ============================================================
       AUTH TAB SWITCHER
    ============================================================ */
    function switchAuthTab(tab) {
        const loginForm   = document.getElementById('auth-login-form');
        const signupForm  = document.getElementById('auth-signup-form');
        const tabLogin    = document.getElementById('auth-tab-login');
        const tabSignup   = document.getElementById('auth-tab-signup');

        if (tab === 'login') {
            loginForm.style.display  = 'flex';
            signupForm.style.display = 'none';
            tabLogin.classList.add('active');
            tabSignup.classList.remove('active');
        } else {
            loginForm.style.display  = 'none';
            signupForm.style.display = 'flex';
            tabSignup.classList.add('active');
            tabLogin.classList.remove('active');
        }
        // Clear errors
        ['login-error','signup-error','signup-success'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.display = 'none'; el.textContent = ''; }
        });
    }

    /* ============================================================
       PASSWORD STRENGTH INDICATOR
    ============================================================ */
    function updatePwdStrength(val) {
        const fill = document.getElementById('pwd-strength-fill');
        if (!fill) return;
        let score = 0;
        if (val.length >= 8)  score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;
        const pct   = score * 25;
        const colors = ['#ef4444','#f97316','#eab308','#22c55e'];
        fill.style.width      = pct + '%';
        fill.style.background = colors[score - 1] || 'rgba(255,255,255,0.1)';
    }

    /* ============================================================
       SIGNUP — Firebase Auth (bcrypt, server-side)
    ============================================================ */
    function doSignup() {
        const fname   = document.getElementById('signup-fname').value.trim();
        const lname   = document.getElementById('signup-lname').value.trim();
        const email   = document.getElementById('signup-email').value.trim().toLowerCase();
        const pwd     = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;
        const errEl   = document.getElementById('signup-error');
        const okEl    = document.getElementById('signup-success');
        const btn     = document.querySelector('[onclick="doSignup()"]');

        function showErr(msg) {
            errEl.textContent = msg; errEl.style.display = 'block'; okEl.style.display = 'none';
        }
        errEl.style.display = 'none'; okEl.style.display = 'none';

        if (!fname || !lname)              return showErr('Please enter your full name.');
        if (!email || !email.includes('@')) return showErr('Enter a valid email address.');
        if (pwd.length < 8)                return showErr('Password must be at least 8 characters.');
        if (pwd !== confirm)               return showErr('Passwords do not match.');
        if (!_fbAuth)                      return showErr('Still connecting… please wait a moment and try again.');

        if (btn) { btn.disabled = true; btn.textContent = 'Creating…'; }

        _fbAuth.createUserWithEmailAndPassword(email, pwd)
            .then(cred => {
                return cred.user.updateProfile({ displayName: fname + ' ' + lname })
                    .then(() => _fbDb.collection('users').doc(cred.user.uid).set({
                        fname, lname, email, createdAt: Date.now()
                    }));
            })
            .then(() => {
                okEl.textContent = `🎉 Account created! Welcome, ${fname}!`;
                okEl.style.display = 'block';
                // onAuthStateChanged will fire and dismiss the splash
            })
            .catch(err => {
                const msg = err.code === 'auth/email-already-in-use'
                    ? 'An account with this email already exists. Please login.'
                    : err.code === 'auth/weak-password' ? 'Password is too weak.'
                    : err.message;
                showErr(msg);
            })
            .finally(() => {
                if (btn) { btn.disabled = false; btn.textContent = 'Create My Account →'; }
            });
    }

    /* ============================================================
       LOGIN — Firebase Auth
    ============================================================ */
    function doLogin() {
        const email  = document.getElementById('login-email').value.trim().toLowerCase();
        const pwd    = document.getElementById('login-password').value;
        const errEl  = document.getElementById('login-error');
        const btn    = document.querySelector('[onclick="doLogin()"]');

        errEl.style.display = 'none'; errEl.textContent = '';

        if (!email || !pwd) {
            errEl.textContent = 'Please enter your email and password.';
            errEl.style.display = 'block'; return;
        }
        if (!_fbAuth) {
            errEl.textContent = 'Still connecting… please wait a moment and try again.';
            errEl.style.display = 'block'; return;
        }

        if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }

        _fbAuth.signInWithEmailAndPassword(email, pwd)
            .catch(err => {
                errEl.textContent = (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential')
                    ? 'Invalid email or password. Please try again.'
                    : err.message;
                errEl.style.display = 'block';
            })
            .finally(() => {
                if (btn) { btn.disabled = false; btn.textContent = 'Enter the Dashboard →'; }
            });
        // onAuthStateChanged fires on success and handles splash dismiss + data load
    }

    /* ── Google Sign-In ── */
    function doGoogleSignIn() {
        if (!_fbAuth) return;
        const provider = new firebase.auth.GoogleAuthProvider();
        _fbAuth.signInWithPopup(provider).catch(err => {
            const errEl = document.getElementById('login-error') || document.getElementById('signup-error');
            if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
        });
    }

    /* ============================================================
       LOGOUT — Firebase Auth
    ============================================================ */
    function doLogout() {
        if (_fbAuth) _fbAuth.signOut().then(() => location.reload());
        else location.reload();
    }

    /* ============================================================
       DISMISS SPLASH — called by onAuthStateChanged after login
    ============================================================ */
    function dismissSplash() {
        const splash = document.getElementById('splash');
        if (!splash || splash.classList.contains('fade-out')) return;
        splash.classList.add('fade-out');
        splash.addEventListener('animationend', () => { splash.remove(); }, { once: true });
    }

    /** Wipe all saved calculator data for the current user (with confirmation) */
    function confirmResetAllData() {
        if (!confirm('Reset all your saved numbers?\n\nThis clears Growth, Goal, Emergency Fund, Health Score, and Financial Plan data. Your account stays safe.')) return;
        const user = _fbAuth && _fbAuth.currentUser;
        if (user && _fbDb) {
            _fbDb.collection('users').doc(user.uid).update({ appData: firebase.firestore.FieldValue.delete() })
                .then(() => location.reload()).catch(() => location.reload());
        } else { location.reload(); }
    }

    // Allow Enter key to submit forms
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const splash = document.getElementById('splash');
        if (!splash) return;
        const loginForm  = document.getElementById('auth-login-form');
        const signupForm = document.getElementById('auth-signup-form');
        const welcome    = document.getElementById('auth-welcome');
        if (loginForm  && loginForm.style.display  !== 'none') doLogin();
        else if (signupForm && signupForm.style.display !== 'none') doSignup();
        else if (welcome && welcome.style.display !== 'none') dismissSplash();
    });

    // Nav shadow on scroll
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('nav');
        if (nav) {
            nav.style.boxShadow = window.scrollY > 4
                ? '0 2px 20px rgba(26,82,118,0.12)'
                : '0 1px 3px rgba(0,0,0,0.06)';
        }
    }, { passive: true });

    // ============================================================
    //  PER-USER PERSISTENT STORAGE
    //  Defined here (first script block) so DOMContentLoaded and
    //  dismissSplash can call loadUserData() reliably.
    // ============================================================

    let _restoring = false; // guard: prevent save-during-restore
    let _saveTimer  = null;  // debounce: batch rapid saves into one Firestore write

    function getUserDataKey() {
        // Kept for legacy localStorage reads during migration — returns null for new users
        return null;
    }

    function saveUserData() {
        if (_restoring) return;
        const user = _fbAuth && _fbAuth.currentUser;
        if (!user || !_fbDb) return;
        // Debounce: wait 1.5s after last change before writing to Firestore
        clearTimeout(_saveTimer);
        _saveTimer = setTimeout(() => _doSaveUserData(user), 1500);
    }

    function _doSaveUserData(user) {
        try {
            const fixedExpenses = {};
            document.querySelectorAll('#expense-rows .expense-row').forEach(function(row) {
                const cat = row.getAttribute('data-category') || 'Other';
                const inp = row.querySelector('.ef-input');
                fixedExpenses[cat] = inp ? inp.value.replace(/,/g,'') : '0';
            });
            const customRows = [];
            document.querySelectorAll('#custom-expense-rows .expense-row').forEach(function(row) {
                const cat = row.getAttribute('data-category') || 'Custom';
                const inp = row.querySelector('.ef-input');
                customRows.push({ category: cat, value: inp ? inp.value.replace(/,/g,'') : '0' });
            });
            const hsFields = ['hs-income','hs-emi','hs-expenses','hs-savings','hs-health-ins','hs-term-ins','hs-efund','hs-age',
                              'hs-pf-equity','hs-pf-debt','hs-pf-realty','hs-pf-gold','hs-pf-retiral','hs-pf-other'];
            const healthScore = {};
            hsFields.forEach(function(id) {
                const el = document.getElementById(id);
                healthScore[id] = el ? el.value : '';
            });
            const fpSaveObj = window._fpState ? {
                step: window._fpState.step,
                goals: window._fpState.goals,
                existing: window._fpState.existing,
                existingAmounts: window._fpState.existingAmounts,
                existingCustom: window._fpState.existingCustom,
                answers: window._fpState.answers,
                planGenerated: window._fpState.planGenerated
            } : {};
            ['fp-name','fp-age','fp-retire-age','fp-income','fp-invest-amt','fp-epf-basic'].forEach(function(id) {
                const el = document.getElementById(id);
                fpSaveObj[id] = el ? el.value : '';
            });
            fpSaveObj.epfMode = (window._fpState && window._fpState.epfMode) || 'balance';
            // Persist dedicated goal amount/years separately
            if (window._tabState && window._tabState.goal) {
                window._tabState.goal.goalAmount = typeof window._goalAmount !== 'undefined' ? window._goalAmount : '';
                window._tabState.goal.goalYears  = typeof window._goalYears  !== 'undefined' ? window._goalYears  : '';
            }
            // Tax Guide fields
            // Tax Guide is lazily rendered — elements only exist while that section is open.
            // Strategy: when elements ARE in DOM, read them and refresh _tgPendingData so it
            // always mirrors the latest user-entered state. When elements are gone (user navigated
            // away, or section never opened), fall back to _tgPendingData so we never overwrite
            // Firestore with empty strings.
            const taxGuide = {};
            if (document.getElementById('tg-income') !== null) {
                taxGuide['tg-income']       = document.getElementById('tg-income')?.value       || '';
                taxGuide['tg-other-income'] = document.getElementById('tg-other-income')?.value || '';
                taxGuide['tg-80c']          = document.getElementById('tg-80c')?.value          || '';
                taxGuide['tg-80d']          = document.getElementById('tg-80d')?.value          || '';
                taxGuide['tg-hra']          = document.getElementById('tg-hra')?.value          || '';
                taxGuide['tg-nps']          = document.getElementById('tg-nps')?.value          || '';
                taxGuide['tg-emp-nps']      = document.getElementById('tg-emp-nps')?.value      || '';
                taxGuide['tg-homeloan']     = document.getElementById('tg-homeloan')?.value     || '';
                taxGuide['tg-other-deduct'] = document.getElementById('tg-other-deduct')?.value || '';
                taxGuide['tg-expenses']     = document.getElementById('tg-expenses')?.value     || '';
                taxGuide['tg-epf-basic']    = document.getElementById('tg-epf-basic')?.value    || '';
                taxGuide['tg-slab']         = document.getElementById('tg-slab')?.value         || '';
                taxGuide['tg-regime']       = document.getElementById('tg-regime')?.value       || '';
                // Keep _tgPendingData in sync so the fallback branch always has fresh data
                window._tgPendingData = Object.assign({}, taxGuide);
            } else if (window._tgPendingData) {
                // Section not rendered — preserve last known state
                Object.assign(taxGuide, window._tgPendingData);
            }
            // If neither branch applies (section never opened AND no pending data),
            // taxGuide stays {} which is correct for a brand-new user.
            // Home Loan fields
            const homeLoan = {};
            homeLoan['hl-amount'] = document.getElementById('hl-amount')?.value || '';
            homeLoan['hl-rate'] = document.getElementById('hl-rate')?.value || '';
            homeLoan['hl-tenure'] = document.getElementById('hl-tenure')?.value || '';
            homeLoan['hl-start-month'] = document.getElementById('hl-start-month')?.value || '';
            homeLoan['hl-start-year'] = document.getElementById('hl-start-year')?.value || '';
            homeLoan['pp-amount'] = document.getElementById('pp-amount')?.value || '';
            homeLoan['pp-rate'] = document.getElementById('pp-rate')?.value || '';
            homeLoan['pp-tenure'] = document.getElementById('pp-tenure')?.value || '';
            homeLoan['pp-lump'] = document.getElementById('pp-lump')?.value || '';
            homeLoan['pp-after'] = document.getElementById('pp-after')?.value || '';
            homeLoan['rvb-price'] = document.getElementById('rvb-price')?.value || '';
            homeLoan['rvb-down'] = document.getElementById('rvb-down')?.value || '';
            homeLoan['rvb-rate'] = document.getElementById('rvb-rate')?.value || '';
            homeLoan['rvb-tenure'] = document.getElementById('rvb-tenure')?.value || '';
            homeLoan['rvb-apprec'] = document.getElementById('rvb-apprec')?.value || '';
            homeLoan['rvb-maint'] = document.getElementById('rvb-maint')?.value || '';
            homeLoan['rvb-society'] = document.getElementById('rvb-society')?.value || '';
            homeLoan['rvb-stamp'] = document.getElementById('rvb-stamp')?.value || '';
            homeLoan['rvb-gst'] = document.getElementById('rvb-gst')?.value || '';
            homeLoan['rvb-modt'] = document.getElementById('rvb-modt')?.value || '';
            homeLoan['rvb-rent'] = document.getElementById('rvb-rent')?.value || '';
            homeLoan['rvb-rent-incr'] = document.getElementById('rvb-rent-incr')?.value || '';
            homeLoan['rvb-inv-return'] = document.getElementById('rvb-inv-return')?.value || '';
            homeLoan['rvb-years'] = document.getElementById('rvb-years')?.value || '';
            homeLoan['tx-amount'] = document.getElementById('tx-amount')?.value || '';
            homeLoan['tx-rate'] = document.getElementById('tx-rate')?.value || '';
            homeLoan['tx-tenure'] = document.getElementById('tx-tenure')?.value || '';
            homeLoan['tx-slab'] = document.getElementById('tx-slab')?.value || '';
            homeLoan['tx-type'] = document.getElementById('tx-type')?.value || '';
            const stepUpSIP = {};
            ['su-amount','su-rate','su-years','su-stepup'].forEach(function(id) {
                stepUpSIP[id] = document.getElementById(id)?.value || '';
            });
            stepUpSIP['su-ltcg'] = document.getElementById('su-ltcg-toggle')?.checked ? '1' : '0';
            const data = {
                growth:    window._tabState ? Object.assign({}, window._tabState.growth) : {},
                goal:      window._tabState ? Object.assign({}, window._tabState.goal)   : {},
                emergency: { months: window._efMonths || 6, fixedExpenses: fixedExpenses, customRows: customRows },
                healthScore: healthScore,
                finplan:   fpSaveObj,
                // Only include taxGuide when we actually have data.
                // If taxGuide is {} (Tax Guide never opened this session AND
                // _tgPendingData not yet populated from Firestore), omitting it
                // prevents a race-condition save from overwriting stored values
                // with an empty object before loadUserData's fetch has returned.
                ...(Object.keys(taxGuide).length > 0 ? { taxGuide } : {}),
                homeLoan:  homeLoan,
                stepUpSIP: stepUpSIP,
                ssaPlanner: (function(){
                    var obj = {};
                    ['ssa-dob-year','ssa-annual','ssa-tenure','ssa-elss-sip','ssa-elss-return','ssa-inflation','ssa-goal-edu','ssa-goal-marr'].forEach(function(id){
                        obj[id] = document.getElementById(id)?.value || '';
                    });
                    return obj;
                })(),
                epfCalc:   (function(){
                    var obj = {};
                    ['epf-basic','epf-balance','epf-age','epf-retire','epf-growth','epf-rate'].forEach(function(id){
                        obj[id] = document.getElementById(id)?.value || '';
                    });
                    return obj;
                })(),
                drawdown: (function(){
                    var obj = {};
                    ['dd-corpus','dd-ret-age','dd-expenses','dd-inflation','dd-return','dd-other-income'].forEach(function(id){
                        obj[id] = document.getElementById(id)?.value || '';
                    });
                    return obj;
                })(),
                ppfnps: (function(){
                    var obj = {};
                    ['ppf-annual','ppf-balance','ppf-years-done','ppf-rate','ppf-extend',
                     'nps-monthly','nps-age','nps-balance','nps-return','nps-annuity-rate','nps-slab','nps-regime'].forEach(function(id){
                        obj[id] = document.getElementById(id)?.value || '';
                    });
                    obj['ppfnps-active-tab'] = (document.getElementById('ppf-section') && !document.getElementById('ppf-section').classList.contains('hidden')) ? 'ppf' : 'nps';
                    return obj;
                })(),
                ctcOptimizer: (function(){
                    var obj = {};
                    ['ctc-annual','ctc-basic','ctc-hra','ctc-rent','ctc-city','ctc-lta',
                     'ctc-food','ctc-phone','ctc-emp-nps','ctc-80c','ctc-regime'].forEach(function(id){
                        obj[id] = document.getElementById(id)?.value || '';
                    });
                    return obj;
                })(),
                insurance: (function(){
                    var obj = {};
                    ['ins-income','ins-age','ins-dependents','ins-loans','ins-term-current',
                     'ins-health-current','ins-monthly-exp','ins-family'].forEach(function(id){
                        obj[id] = document.getElementById(id)?.value || '';
                    });
                    return obj;
                })(),
                gratuity: (function(){
                    var obj = {};
                    ['grat-basic','grat-years','grat-months','grat-type','grat-slab','grat-regime'].forEach(function(id){
                        obj[id] = document.getElementById(id)?.value || '';
                    });
                    return obj;
                })(),
                debtPlan: (function(){
                    var obj = {};
                    obj['debt-extra'] = document.getElementById('debt-extra')?.value || '';
                    // Save loan rows
                    var loans = [];
                    var rows = document.querySelectorAll('#debt-loans-container .debt-loan-row');
                    rows.forEach(function(row) {
                        var inputs = row.querySelectorAll('.debt-loan-input');
                        if (inputs.length >= 3) {
                            loans.push({name: inputs[0].value, balance: inputs[1].value, rate: inputs[2].value, emi: inputs[3] ? inputs[3].value : ''});
                        }
                    });
                    obj['debt-loans'] = JSON.stringify(loans);
                    return obj;
                })(),
                jointPlan: (function(){
                    var obj = {};
                    ['jp-p1-name','jp-p1-income','jp-p1-invest','jp-p1-portfolio','jp-p1-80c',
                     'jp-p2-name','jp-p2-income','jp-p2-invest','jp-p2-portfolio','jp-p2-80c',
                     'jp-edu-cost','jp-edu-years','jp-home-cost','jp-home-years',
                     'jp-retire-age','jp-retire-monthly','jp-return'].forEach(function(id){
                        obj[id] = document.getElementById(id)?.value || '';
                    });
                    obj['jp-p1-slab']       = document.getElementById('jp-p1-slab')?.value || '20';
                    obj['jp-p2-slab']       = document.getElementById('jp-p2-slab')?.value || '30';
                    obj['jp-p1-regime']     = document.getElementById('jp-p1-regime')?.value || 'new';
                    obj['jp-p2-regime']     = document.getElementById('jp-p2-regime')?.value || 'new';
                    obj['jp-goal-edu']      = document.getElementById('jp-goal-edu')?.checked ? '1' : '0';
                    obj['jp-goal-home']     = document.getElementById('jp-goal-home')?.checked ? '1' : '0';
                    obj['jp-goal-retire']   = document.getElementById('jp-goal-retire')?.checked ? '1' : '0';
                    return obj;
                })(),
                cibil: (function(){
                    var obj = {};
                    ['cibil-score','cibil-util','cibil-missed','cibil-age','cibil-cards',
                     'cibil-enquiries','cibil-loan-amt','cibil-loan-tenure'].forEach(function(id){
                        obj[id] = document.getElementById(id)?.value || '';
                    });
                    return obj;
                })(),
                fincal: (function(){
                    var obj = {};
                    obj['fc-regime']  = document.getElementById('fc-regime')?.value  || 'new';
                    obj['fc-income']  = document.getElementById('fc-income')?.value  || '';
                    obj['fc-ppf']     = document.getElementById('fc-ppf')?.value     || 'yes';
                    obj['fc-elss']    = document.getElementById('fc-elss')?.value    || 'yes';
                    obj['fc-sgb']     = document.getElementById('fc-sgb')?.value     || 'yes';
                    obj['fc-epf']     = document.getElementById('fc-epf')?.value     || 'yes';
                    obj['fc-cc-date'] = document.getElementById('fc-cc-date')?.value || '';
                    return obj;
                })(),
                selfEmpl: (function(){
                    var obj = {};
                    ['se-turnover','se-actual-profit','se-other-income','se-80c','se-nps',
                     'se-bef-salaries','se-bef-rent','se-bef-tools','se-bef-loans','se-bef-utilities',
                     'se-bef-inventory','se-bef-personal','se-bef-current',
                     'se-gst-revenue','se-gst-purchases','se-gst-delay','se-adv-tax'].forEach(function(id){
                        obj[id] = document.getElementById(id)?.value || '';
                    });
                    obj['se-biz-type']    = document.getElementById('se-biz-type')?.value    || '44AD_digital';
                    obj['se-tax-regime']  = document.getElementById('se-tax-regime')?.value  || 'new';
                    obj['se-bef-months']  = document.getElementById('se-bef-months')?.value  || '6';
                    obj['se-gst-type']    = document.getElementById('se-gst-type')?.value    || 'regular';
                    obj['se-gst-rate-out']= document.getElementById('se-gst-rate-out')?.value|| '18';
                    obj['se-gst-rate-in'] = document.getElementById('se-gst-rate-in')?.value || '18';
                    return obj;
                })(),
                goldComp: (function(){
                    var obj = {};
                    ['gc-amount','gc-years','gc-return','gc-making','gc-locker'].forEach(function(id){
                        obj[id] = document.getElementById(id)?.value || '';
                    });
                    obj['gc-slab'] = document.getElementById('gc-slab')?.value || '20';
                    obj['gc-regime'] = document.getElementById('gc-regime')?.value || 'new';
                    return obj;
                })()
            };
            _fbDb.collection('users').doc(user.uid)
                .set({ appData: data }, { merge: true })
                .catch(e => console.warn('saveUserData Firestore failed:', e));
        } catch(e) { console.warn('saveUserData failed:', e); }
    }

    function loadUserData() {
        const user = _fbAuth && _fbAuth.currentUser;
        if (!user || !_fbDb) return;

        _fbDb.collection('users').doc(user.uid).get().then(snap => {
            // ── Load risk profile into cache (one-time activity) ──
            if (snap.exists && snap.data() && snap.data().riskProfile) {
                window._fpRiskCache = snap.data().riskProfile;
            }
            const data = snap.exists && snap.data() && snap.data().appData ? snap.data().appData : null;
            if (!data) return;
            _restoring = true;
            try {
            // Growth / Goal
            try {
                if (data.growth && window._tabState) Object.assign(window._tabState.growth, data.growth);
                if (data.goal && window._tabState) {
                    // Restore goal tab state — but amount/years go to dedicated vars
                    const gd = data.goal;
                    Object.assign(window._tabState.goal, {
                        invType:        gd.invType        || 'lumpsum',
                        goalType:       gd.goalType       || 'vehicle',
                        customGoalText: gd.customGoalText || '',
                        customRate:     gd.customRate     || '',
                        goalInflRate:   gd.goalInflRate   || ''
                    });
                    // Restore dedicated goal amount/years (separate from growth)
                    window._goalAmount = gd.goalAmount || '';
                    window._goalYears  = gd.goalYears  || '';
                }
                if (typeof restoreTabState === 'function') {
                    restoreTabState(window._currentMode === 'goal' ? 'goal' : 'growth');
                }
                if (typeof calculate === 'function') calculate();
            } catch(e) { console.warn('loadUserData growth/goal:', e); }

            // Emergency Fund
            try {
                if (data.emergency) {
                    const ef = data.emergency;
                    if (typeof setMonths === 'function' && ef.months) setMonths(parseInt(ef.months, 10) || 6);
                    if (ef.fixedExpenses) {
                        document.querySelectorAll('#expense-rows .expense-row').forEach(function(row) {
                            const cat = row.getAttribute('data-category');
                            const inp = row.querySelector('.ef-input');
                            if (!inp || !cat || ef.fixedExpenses[cat] === undefined) return;
                            const val = parseInt(ef.fixedExpenses[cat], 10);
                            if (val > 0) {
                                inp.value = new Intl.NumberFormat('en-IN').format(val);
                                inp.classList.remove('text-slate-400');
                            }
                        });
                    }
                    if (ef.customRows && ef.customRows.length > 0 && typeof addCustomExpense === 'function') {
                        ef.customRows.forEach(function(r) {
                            addCustomExpense();
                            const rows = document.querySelectorAll('#custom-expense-rows .expense-row');
                            const lastRow = rows[rows.length - 1];
                            if (!lastRow) return;
                            const nameInp = lastRow.querySelector('input[type="text"]');
                            const valInp  = lastRow.querySelector('.ef-input');
                            if (nameInp) { nameInp.value = r.category; lastRow.setAttribute('data-category', r.category); }
                            const val = parseInt(r.value, 10);
                            if (valInp && val > 0) {
                                valInp.value = new Intl.NumberFormat('en-IN').format(val);
                                valInp.classList.remove('text-slate-400');
                            }
                        });
                    }
                    if (typeof calcEmergency === 'function') calcEmergency();
                }
            } catch(e) { console.warn('loadUserData emergency:', e); }

            // Health Score
            try {
                if (data.healthScore) {
                    Object.entries(data.healthScore).forEach(function(entry) {
                        const id = entry[0], val = entry[1];
                        const el = document.getElementById(id);
                        if (!el || val === '' || val === undefined || val === null) return;
                        el.value = val;
                        if (val && val !== '0') el.classList.remove('text-slate-400');
                    });
                    if (typeof calcHealthScore === 'function') calcHealthScore();
                }
            } catch(e) { console.warn('loadUserData health score:', e); }

            // Financial Plan
            try {
                if (data.finplan && window._fpState) {
                    const fp = data.finplan;

                    // Deduplicate saved goals by type — prevents duplicates from
                    // older sessions accumulating on every toggle.
                    const rawGoals = fp.goals || [];
                    const seenTypes = {};
                    const dedupedGoals = rawGoals.filter(function(g) {
                        if (!g || !g.type || seenTypes[g.type]) return false;
                        seenTypes[g.type] = true;
                        return true;
                    });

                    Object.assign(window._fpState, {
                        step: 1,
                        goals:           dedupedGoals,
                        existing:        fp.existing        || [],
                        existingAmounts: fp.existingAmounts || {},
                        existingCustom:  fp.existingCustom  || '',
                        answers:         fp.answers         || {},
                        planGenerated:   fp.planGenerated   || false
                    });
                    ['fp-name','fp-age','fp-retire-age','fp-income','fp-invest-amt','fp-epf-basic'].forEach(function(id) {
                        const el = document.getElementById(id);
                        if (el && fp[id]) el.value = fp[id];
                    });
                    if (fp.epfMode) fpState.epfMode = fp.epfMode;
                    if (typeof fpGoStep === 'function') fpGoStep(1);
                    // Restore tile visual state after DOM is ready
                    if (typeof fpRestoreGoalTiles === 'function') fpRestoreGoalTiles();
                    // Restore EPF panel + button state
                    if (fp.existing && fp.existing.includes('epf')) {
                        var epfBtn   = document.getElementById('fp-existing-epf-btn');
                        var epfPanel = document.getElementById('fp-epf-panel');
                        if (epfBtn)   epfBtn.classList.add('fp-existing-active');
                        if (epfPanel) epfPanel.classList.remove('hidden');
                    }
                    // Restore crypto button + active indicator (already confirmed)
                    if (fp.existing && fp.existing.includes('crypto')) {
                        var cryptoBtnR   = document.getElementById('fp-existing-crypto-btn');
                        var cryptoActive = document.getElementById('fp-crypto-active');
                        if (cryptoBtnR)   cryptoBtnR.classList.add('fp-existing-active');
                        if (cryptoActive) cryptoActive.classList.remove('hidden');
                    }
                    if (typeof fpLiveUpdate === 'function') fpLiveUpdate();
                }
            } catch(e) { console.warn('loadUserData finplan:', e); }

            // Tax Guide restore
            try {
                if (data.taxGuide) {
                    // _tgPendingData is the source of truth whenever Tax Guide is not in DOM.
                    // It is NEVER set to null — the save side reads it as a fallback whenever
                    // the user navigates away from Tax Guide before the debounce fires.
                    window._tgPendingData = data.taxGuide;

                    function _applyTgData() {
                        if (!window._tgPendingData) return;
                        _restoring = true;
                        try {
                            Object.entries(window._tgPendingData).forEach(function([id, val]) {
                                var el = document.getElementById(id);
                                if (!el || val === '' || val === null) return;
                                el.value = val;
                                if (el.classList.contains('text-slate-400') && val && val !== '0') {
                                    el.classList.remove('text-slate-400');
                                }
                            });
                        } finally {
                            _restoring = false;
                        }
                        if (typeof tgCalc === 'function') tgCalc();
                    }

                    if (document.getElementById('tg-income') !== null) {
                        // Section is already in DOM — apply immediately
                        _applyTgData();
                    } else {
                        // Section is lazily rendered. Use MutationObserver so we apply the
                        // instant initTaxGuide adds elements — before it can set defaults or
                        // trigger a calculation that would fire saveUserData with stale values.
                        var _tgObserver = new MutationObserver(function(mutations, obs) {
                            if (document.getElementById('tg-income') !== null) {
                                obs.disconnect();
                                // setTimeout(0) lets initTaxGuide finish its synchronous setup
                                // (e.g. placeholder formatting) before we overwrite with saved values
                                setTimeout(_applyTgData, 0);
                            }
                        });
                        _tgObserver.observe(document.body, { childList: true, subtree: true });
                    }
                }
            } catch(e) { console.warn('loadUserData taxGuide:', e); }

            // Home Loan: restore directly (all fields exist in DOM from page load)
            try {
                if (data.homeLoan) {
                    window._hlPendingData = data.homeLoan; // also keep for initHomeLoan colour fix
                    var hlRestoreDefaults = {'hl-rate':'8.5','hl-tenure':'20','pp-rate':'8.5','pp-tenure':'20','pp-after':'3','rvb-rate':'8.5','rvb-tenure':'20','rvb-apprec':'7','rvb-stamp':'7','rvb-gst':'0','rvb-rent-incr':'5','rvb-inv-return':'12','rvb-years':'20','tx-rate':'8.5','tx-tenure':'20'};
                    Object.entries(data.homeLoan).forEach(function([id, val]) {
                        var el = document.getElementById(id);
                        if (!el || val === null) return;
                        el.value = val;
                        var defaultVal = hlRestoreDefaults[id];
                        if (el.tagName === 'SELECT') {
                            if (val) el.style.removeProperty('color');
                        } else if (defaultVal !== undefined) {
                            if (val === '' || val === defaultVal) {
                                el.classList.add('text-slate-400');
                            } else {
                                el.classList.remove('text-slate-400');
                            }
                        } else {
                            // Placeholder/hlFormat field
                            if (val && val !== '0') {
                                el.classList.remove('text-slate-400');
                            } else {
                                el.classList.add('text-slate-400');
                            }
                        }
                    });
                }
            } catch(e) { console.warn('loadUserData homeLoan:', e); }

            // Step-Up SIP restore
            try {
                if (data.stepUpSIP) {
                    var suDefaults = {'su-amount':'5,000','su-rate':'12','su-years':'20','su-stepup':'10'};
                    Object.entries(data.stepUpSIP).forEach(function([id, val]) {
                        var el = document.getElementById(id);
                        if (!el || val === null || val === '') return;
                        el.value = val;
                        if (val === (suDefaults[id] || '')) {
                            el.classList.add('text-slate-400');
                        } else {
                            el.classList.remove('text-slate-400');
                        }
                    });
                    // Restore LTCG toggle
                    var suLtcgTog = document.getElementById('su-ltcg-toggle');
                    if (suLtcgTog && data.stepUpSIP['su-ltcg'] !== undefined) {
                        suLtcgTog.checked = data.stepUpSIP['su-ltcg'] === '1';
                    }
                    if (typeof stepUpCalc === 'function') stepUpCalc();
                }
            } catch(e) { console.warn('loadUserData stepUpSIP:', e); }

            // EPF Corpus Projector restore
            try {
                if (data.epfCalc) {
                    var epfDefs = {'epf-basic':'50000','epf-balance':'200000','epf-age':'30','epf-retire':'60','epf-growth':'8','epf-rate':'8.15'};
                    Object.entries(data.epfCalc).forEach(function([id, val]) {
                        var el = document.getElementById(id);
                        if (!el || val === null || val === '') return;
                        el.value = val;
                        if (val === (epfDefs[id] || '')) { el.classList.add('text-slate-400'); }
                        else { el.classList.remove('text-slate-400'); }
                    });
                    if (typeof epfCalc === 'function') epfCalc();
                }
            } catch(e) { console.warn('loadUserData epfCalc:', e); }

            // SSA Planner restore
            try {
                if (data.ssaPlanner) {
                    var ssaDefs = {'ssa-dob-year': String(new Date().getFullYear()-5), 'ssa-annual':'150000','ssa-tenure':'15','ssa-elss-sip':'5000','ssa-elss-return':'12','ssa-inflation':'8','ssa-goal-edu':'2500000','ssa-goal-marr':'3000000'};
                    Object.entries(data.ssaPlanner).forEach(function([id, val]) {
                        var el = document.getElementById(id);
                        if (!el || val === null || val === '') return;
                        el.value = val;
                        if (val === (ssaDefs[id] || '')) { el.classList.add('text-slate-400'); }
                        else { el.classList.remove('text-slate-400'); }
                    });
                    if (typeof ssaCalc === 'function') ssaCalc();
                }
            } catch(e) { console.warn('loadUserData ssaPlanner:', e); }

            // Drawdown Planner restore
            try {
                if (data.drawdown) {
                    var ddDefs = {'dd-corpus':'1,00,00,000','dd-ret-age':'60','dd-expenses':'60,000','dd-inflation':'6','dd-return':'8','dd-other-income':''};
                    Object.entries(data.drawdown).forEach(function([id, val]) {
                        var el = document.getElementById(id);
                        if (!el || val === null || val === undefined) return;
                        el.value = val;
                        if (val === (ddDefs[id] || '')) { el.classList.add('text-slate-400'); }
                        else { el.classList.remove('text-slate-400'); }
                    });
                    if (typeof drawdownCalc === 'function') drawdownCalc();
                }
            } catch(e) { console.warn('loadUserData drawdown:', e); }

            // PPF & NPS restore
            try {
                if (data.ppfnps) {
                    var ppfDefs = {'ppf-annual':'1,50,000','ppf-balance':'0','ppf-years-done':'0','ppf-rate':'7.1','ppf-extend':'0',
                                   'nps-monthly':'5,000','nps-age':'30','nps-balance':'0','nps-return':'10','nps-annuity-rate':'6','nps-slab':'20'};
                    Object.entries(data.ppfnps).forEach(function([id, val]) {
                        if (id === 'ppfnps-active-tab') return;
                        var el = document.getElementById(id);
                        if (!el || val === null || val === undefined || val === '') return;
                        el.value = val;
                        if (val === (ppfDefs[id] || '')) { el.classList.add('text-slate-400'); }
                        else { el.classList.remove('text-slate-400'); }
                    });
                    // Restore active tab
                    if (data.ppfnps['ppfnps-active-tab'] === 'nps') {
                        if (typeof ppfnpsTab === 'function') ppfnpsTab('nps');
                    }
                    if (typeof ppfCalc === 'function') ppfCalc();
                    if (typeof npsCalc === 'function') npsCalc();
                }
            } catch(e) { console.warn('loadUserData ppfnps:', e); }

            // CTC Optimizer restore
            try {
                if (data.ctcOptimizer) {
                    var ctcDefs = {'ctc-annual':'12,00,000','ctc-basic':'40,000','ctc-hra':'20,000',
                                   'ctc-rent':'15,000','ctc-city':'metro','ctc-lta':'20,000',
                                   'ctc-food':'0','ctc-phone':'0','ctc-emp-nps':'0',
                                   'ctc-80c':'1,50,000','ctc-regime':'new'};
                    Object.entries(data.ctcOptimizer).forEach(function([id, val]) {
                        var el = document.getElementById(id);
                        if (!el || val === null || val === undefined || val === '') return;
                        el.value = val;
                        if (val === (ctcDefs[id] || '')) { el.classList.add('text-slate-400'); }
                        else { el.classList.remove('text-slate-400'); }
                    });
                    if (typeof ctcCalc === 'function') ctcCalc();
                }
            } catch(e) { console.warn('loadUserData ctcOptimizer:', e); }

            // Insurance Adequacy restore
            try {
                if (data.insurance) {
                    var insDefs = {'ins-income':'12,00,000','ins-age':'30','ins-dependents':'2',
                                   'ins-loans':'0','ins-term-current':'0','ins-health-current':'0',
                                   'ins-monthly-exp':'50,000','ins-family':'2'};
                    Object.entries(data.insurance).forEach(function([id, val]) {
                        var el = document.getElementById(id);
                        if (!el || val === null || val === undefined || val === '') return;
                        el.value = val;
                        if (val === (insDefs[id] || '')) { el.classList.add('text-slate-400'); }
                        else { el.classList.remove('text-slate-400'); }
                    });
                    if (typeof insureCalc === 'function') insureCalc();
                }
            } catch(e) { console.warn('loadUserData insurance:', e); }

            // Gratuity restore
            try {
                if (data.gratuity) {
                    var gratDefs = {'grat-basic':'50,000','grat-years':'7','grat-months':'0',
                                    'grat-type':'covered','grat-slab':'20'};
                    Object.entries(data.gratuity).forEach(function([id, val]) {
                        var el = document.getElementById(id);
                        if (!el || val === null || val === undefined || val === '') return;
                        el.value = val;
                        if (val === (gratDefs[id] || '')) { el.classList.add('text-slate-400'); }
                        else { el.classList.remove('text-slate-400'); }
                    });
                    if (typeof gratCalc === 'function') gratCalc();
                }
            } catch(e) { console.warn('loadUserData gratuity:', e); }

            // Debt Plan restore
            try {
                if (data.debtPlan) {
                    var extraEl = document.getElementById('debt-extra');
                    if (extraEl && data.debtPlan['debt-extra']) {
                        extraEl.value = data.debtPlan['debt-extra'];
                        extraEl.classList.remove('text-slate-400');
                    }
                    if (data.debtPlan['debt-loans']) {
                        try {
                            var savedLoans = JSON.parse(data.debtPlan['debt-loans']);
                            if (Array.isArray(savedLoans) && savedLoans.length > 0) {
                                var container = document.getElementById('debt-loans-container');
                                if (container) {
                                    container.innerHTML = '';
                                    window._debtLoans = [];
                                    savedLoans.forEach(function(l) {
                                        debtAddLoan(l.name, l.balance, l.rate, l.emi);
                                    });
                                }
                            }
                        } catch(e2) {}
                    }
                    if (typeof debtCalc === 'function') debtCalc();
                }
            } catch(e) { console.warn('loadUserData debtPlan:', e); }

            // Joint Family Planner restore
            try {
                if (data.jointPlan) {
                    var jpDefs = {
                        'jp-p1-income':'1,20,000','jp-p1-invest':'25,000','jp-p1-portfolio':'5,00,000','jp-p1-80c':'1,50,000',
                        'jp-p2-income':'90,000','jp-p2-invest':'18,000','jp-p2-portfolio':'2,50,000','jp-p2-80c':'1,50,000',
                        'jp-edu-cost':'20,00,000','jp-edu-years':'15','jp-home-cost':'60,00,000','jp-home-years':'5',
                        'jp-retire-age':'35','jp-retire-monthly':'1,00,000','jp-return':'12'
                    };
                    Object.entries(data.jointPlan).forEach(function([id, val]) {
                        var el = document.getElementById(id);
                        if (!el || val === null || val === undefined || val === '') return;
                        if (el.type === 'checkbox') {
                            el.checked = val === '1';
                        } else if (el.tagName === 'SELECT') {
                            el.value = val;
                        } else {
                            el.value = val;
                            if (val === (jpDefs[id] || '')) { el.classList.add('text-slate-400'); }
                            else { el.classList.remove('text-slate-400'); }
                        }
                    });
                    if (typeof initJointPlan === 'function') initJointPlan();
                }
            } catch(e) { console.warn('loadUserData jointPlan:', e); }

            // CIBIL Score Tracker restore
            try {
                if (data.cibil) {
                    var cibilDefs = {'cibil-score':'720','cibil-util':'35','cibil-missed':'0','cibil-age':'4',
                                     'cibil-cards':'2','cibil-enquiries':'1','cibil-loan-amt':'50,00,000','cibil-loan-tenure':'20'};
                    Object.entries(data.cibil).forEach(function([id, val]) {
                        var el = document.getElementById(id);
                        if (!el || val === null || val === undefined || val === '') return;
                        el.value = val;
                        if (val === (cibilDefs[id] || '')) { el.classList.add('text-slate-400'); }
                        else { el.classList.remove('text-slate-400'); }
                    });
                    if (typeof cibilCalc === 'function') cibilCalc();
                }
            } catch(e) { console.warn('loadUserData cibil:', e); }

            // Financial Calendar restore
            try {
                if (data.fincal) {
                    var fcDefs = {'fc-income':'12,00,000','fc-cc-date':'5'};
                    Object.entries(data.fincal).forEach(function([id, val]) {
                        var el = document.getElementById(id);
                        if (!el || val === null || val === undefined || val === '') return;
                        if (el.tagName === 'SELECT') { el.value = val; }
                        else {
                            el.value = val;
                            if (val === (fcDefs[id] || '')) { el.classList.add('text-slate-400'); }
                            else { el.classList.remove('text-slate-400'); }
                        }
                    });
                    if (typeof finCalRender === 'function') finCalRender();
                }
            } catch(e) { console.warn('loadUserData fincal:', e); }

            // Self-Employed & Business Planner restore
            try {
                if (data.selfEmpl) {
                    var seDefs = {
                        'se-turnover':'25,00,000','se-actual-profit':'8,00,000','se-other-income':'0',
                        'se-80c':'1,50,000','se-nps':'50,000',
                        'se-bef-salaries':'80,000','se-bef-rent':'25,000','se-bef-tools':'10,000',
                        'se-bef-loans':'15,000','se-bef-utilities':'5,000','se-bef-inventory':'0',
                        'se-bef-personal':'60,000','se-bef-current':'0',
                        'se-gst-revenue':'8,00,000','se-gst-purchases':'3,00,000','se-gst-delay':'45',
                        'se-adv-tax':'1,80,000'
                    };
                    var seSelectIds = ['se-biz-type','se-tax-regime','se-bef-months','se-gst-type','se-gst-rate-out','se-gst-rate-in'];
                    Object.entries(data.selfEmpl).forEach(function([id, val]) {
                        var el = document.getElementById(id);
                        if (!el || val === null || val === undefined || val === '') return;
                        if (seSelectIds.indexOf(id) !== -1) { el.value = val; }
                        else {
                            el.value = val;
                            if (val === (seDefs[id] || '')) { el.classList.add('text-slate-400'); }
                            else { el.classList.remove('text-slate-400'); }
                        }
                    });
                    if (typeof initSelfEmpl === 'function') initSelfEmpl();
                }
            } catch(e) { console.warn('loadUserData selfEmpl:', e); }

            // Gold Comparator restore
            try {
                if (data.goldComp) {
                    var gcDefs = {'gc-amount':'1,00,000','gc-years':'5','gc-return':'10','gc-making':'12','gc-locker':'2,000'};
                    Object.entries(data.goldComp).forEach(function([id, val]) {
                        var el = document.getElementById(id);
                        if (!el || val === null || val === undefined || val === '') return;
                        if (id === 'gc-slab') { el.value = val; }
                        else {
                            el.value = val;
                            if (val === (gcDefs[id] || '')) { el.classList.add('text-slate-400'); }
                            else { el.classList.remove('text-slate-400'); }
                        }
                    });
                    if (typeof goldCalc === 'function') goldCalc();
                }
            } catch(e) { console.warn('loadUserData goldComp:', e); }

            } finally {
                _restoring = false;
            }
        }).catch(e => console.warn('loadUserData Firestore failed:', e));
    }

    // ============================================================
    //  END PER-USER PERSISTENT STORAGE
    // ============================================================
