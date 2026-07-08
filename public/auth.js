
    /* ============================================================
       FIREBASE AUTH + FIRESTORE  (replaces localStorage demo tier)
       Passwords handled by Firebase (bcrypt) — never touch JS
       Data stored in Firestore, isolated per user by security rules
    ============================================================ */

    // ── Shared HTML escape helper — use for ANY user-entered string that
    //    lands in an innerHTML sink. auth.js loads first, so window.esc is
    //    available to every other module. ──
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    window.esc = esc;

    // ── Firebase App Check (reCAPTCHA v3) ──
    // To enable: Firebase console → App Check → register web app with
    // reCAPTCHA v3, paste the site key below, then turn on enforcement
    // for Firestore + Auth once token metrics look healthy.
    const APP_CHECK_SITE_KEY = '';

    // ── Firebase SDK (CDN, no build tools needed) ──
    const _fbScripts = [
        { src: 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
          integrity: 'sha384-sEVIly94UBRLKWdkYoPpSG7GD/e79YHMrxVyZaOk712Ga7+EAw6w1EFi+xBzBdd+' },
        { src: 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-check-compat.js',
          integrity: 'sha384-E3vxFxXu8FhW5kvqdQJ5Yf8ugrV7iCJP8jgnItRH2Rk8Q08cJzJGTi/oMC3FEp3j' },
        { src: 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
          integrity: 'sha384-EkqK+ezBWJuvO3hfrSx2iVqr3YQbhmnzn8kPhOpBZ+0GMVU5oGSgptwIu8D84HjE' },
        { src: 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js',
          integrity: 'sha384-M481iNZJtbpypKgvlvZ+78Giq0BsewFLk5r2k+MOcGXlwKCc27DQRZ+WCV/zpmpC' }
    ];
    let _fbLoaded = 0;
    let _fbAuth, _fbDb;

    function _loadFirebase() {
        _fbScripts.forEach(({ src, integrity }) => {
            const s = document.createElement('script');
            s.src = src;
            s.integrity = integrity;
            s.crossOrigin = 'anonymous';
            s.async = false;   // preserve execution order — compat SDKs need app-compat first
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
        // App Check — attests requests come from this app before they hit
        // Firestore/Auth. No-op until a reCAPTCHA v3 site key is configured.
        if (APP_CHECK_SITE_KEY && firebase.appCheck) {
            try {
                firebase.appCheck().activate(APP_CHECK_SITE_KEY, /* autoRefresh */ true);
            } catch (e) {
                console.error('[auth] App Check activation failed:', e);
            }
        }
        _fbAuth = firebase.auth();
        _fbDb   = firebase.firestore();
        // Expose to window so app.js / dashboard.js can do direct Firestore writes
        // (e.g. fpSaveRiskScore, upRiskSubmit fallback — both reference window._fbAuth/_fbDb)
        window._fbAuth = _fbAuth;
        window._fbDb   = _fbDb;

        // ── Auth state listener — single source of truth for splash ──
        _fbAuth.onAuthStateChanged(user => {
            const authPanel    = document.getElementById('auth-panel');
            const welcomePanel = document.getElementById('auth-welcome');

            const bar          = document.getElementById('user-bar');
            const greet        = document.getElementById('nav-user-greeting');

            const splashInner = document.getElementById('splash-inner');
            if (user) {
                // Signed-in: hide everything auth-related, show welcome, restore data
                window._guestMode = false;
                const fname = (user.displayName || user.email).split(' ')[0];
                const dname = user.displayName || user.email;
                if (document.getElementById('welcome-greeting'))
                    document.getElementById('welcome-greeting').textContent = `Welcome back, ${fname}! 👋`;
                if (welcomePanel) { welcomePanel.style.display = 'flex'; }
                if (authPanel)    { authPanel.style.display    = 'none'; }

                const guestBar = document.getElementById('guest-signin-bar');
                if (guestBar) guestBar.style.display = 'none';
                if (bar && greet) {
                    greet.textContent = '👋 ' + dname;
                    bar.classList.remove('hidden');
                    bar.style.display = 'flex';
                }
                var _menuInitial = document.getElementById('user-menu-initial');
                if (_menuInitial) _menuInitial.textContent = fname ? fname[0].toUpperCase() : '👤';
                // Gentle nudge for password accounts that haven't verified their email
                var verifyNote = document.getElementById('verify-email-note');
                if (verifyNote) {
                    var isPwdUser = (user.providerData || []).some(p => p.providerId === 'password');
                    verifyNote.style.display = (isPwdUser && !user.emailVerified) ? 'block' : 'none';
                }
                // Centre the welcome content vertically in the splash
                if (splashInner) splashInner.classList.add('splash-inner--centered');
                // Check if this user is a registered expert before loading user data
                _fbDb.collection('experts').where('email', '==', user.email).limit(1).get()
                    .then(function(snap) {
                        console.log('[auth] expert check — docs found:', snap.size, '| email:', user.email);
                        window._authResolved = true;
                        if (!snap.empty) {
                            // Expert login — show expert dashboard instead of user app
                            window._isExpert  = true;
                            window._expertDoc = Object.assign({ id: snap.docs[0].id }, snap.docs[0].data());
                            dismissSplash();
                            if (typeof epInitDashboard === 'function') epInitDashboard(window._expertDoc);
                        } else {
                            // Regular user — restore saved data and show dashboard
                            window._isExpert  = false;
                            window._expertDoc = null;
                            if (typeof loadUserData === 'function') loadUserData();
                            if (typeof switchMode === 'function') switchMode('dashboard');
                        }
                    })
                    .catch(function(err) {
                        // On error fall back to normal user flow
                        console.error('[auth] expert check failed:', err.code, err.message);
                        window._authResolved = true;
                        window._isExpert  = false;
                        window._expertDoc = null;
                        if (typeof loadUserData === 'function') loadUserData();
                        if (typeof switchMode === 'function') switchMode('dashboard');
                    });
            } else {
                // Not signed in: show auth form and guest tiles
                if (authPanel)  { authPanel.style.display  = 'block'; }
                if (welcomePanel) { welcomePanel.style.display = 'none'; }

                if (bar) { bar.style.display = 'none'; bar.classList.add('hidden'); }
                if (splashInner) splashInner.classList.remove('splash-inner--centered');
                // Reset expert state and restore main app visibility
                window._authResolved = true;
                window._isExpert  = false;
                window._expertDoc = null;
                if (typeof epHideDashboard === 'function') epHideDashboard();
                if (typeof switchMode === 'function') switchMode('dashboard');
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
            signupForm.style.display = 'none';
            loginForm.style.display  = 'flex';
            tabLogin.classList.add('active');
            tabSignup.classList.remove('active');
        } else {
            loginForm.style.display  = 'none';
            signupForm.style.display = 'flex';
            tabSignup.classList.add('active');
            tabLogin.classList.remove('active');
        }
        // Clear errors
        ['login-error','login-success','signup-error','signup-success'].forEach(id => {
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

        const nameRegex = /^[a-zA-ZÀ-ɏ\s'\-\.]+$/;
        if (!fname || !lname)              return showErr('Please enter your full name.');
        if (!nameRegex.test(fname))        return showErr('First name can only contain letters, spaces, hyphens, apostrophes, or dots.');
        if (!nameRegex.test(lname))        return showErr('Last name can only contain letters, spaces, hyphens, apostrophes, or dots.');
        if (!email || !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)) return showErr('Enter a valid email address.');
        if (pwd.length < 8)                return showErr('Password must be at least 8 characters.');
        if (pwd !== confirm)               return showErr('Passwords do not match.');
        if (!_fbAuth)                      return showErr('Still connecting… please wait a moment and try again.');

        if (btn) { btn.disabled = true; btn.textContent = 'Creating…'; }

        _fbAuth.createUserWithEmailAndPassword(email, pwd)
            .then(cred => {
                // Verification email is best-effort — never block account creation on it
                cred.user.sendEmailVerification().catch(err =>
                    console.warn('[auth] verification email failed:', err.code));
                return cred.user.updateProfile({ displayName: fname + ' ' + lname })
                    .then(() => _fbDb.collection('users').doc(cred.user.uid).set({
                        fname, lname, email, createdAt: Date.now()
                    }));
            })
            .then(() => {
                okEl.textContent = `🎉 Account created! Welcome, ${fname}! We've sent a verification link to your email.`;
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
        const okEl   = document.getElementById('login-success');
        const btn    = document.querySelector('[onclick="doLogin()"]');

        errEl.style.display = 'none'; errEl.textContent = '';
        if (okEl) { okEl.style.display = 'none'; okEl.textContent = ''; }

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

    /* ============================================================
       FORGOT PASSWORD — Firebase Auth reset email
    ============================================================ */
    function doForgotPassword() {
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const errEl = document.getElementById('login-error');
        const okEl  = document.getElementById('login-success');

        errEl.style.display = 'none'; errEl.textContent = '';
        if (okEl) { okEl.style.display = 'none'; okEl.textContent = ''; }

        if (!email || !/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)) {
            errEl.textContent = 'Enter your email address above first, then tap "Forgot password?".';
            errEl.style.display = 'block'; return;
        }
        if (!_fbAuth) {
            errEl.textContent = 'Still connecting… please wait a moment and try again.';
            errEl.style.display = 'block'; return;
        }

        // Same message on success and user-not-found — don't reveal which
        // emails have accounts (email enumeration)
        const done = () => {
            if (okEl) {
                okEl.textContent = `📬 If a password-based account exists for ${email}, a reset link is on its way. Signed up with Google? Just use "Continue with Google" — there's no password to reset.`;
                okEl.style.display = 'block';
            }
        };
        _fbAuth.sendPasswordResetEmail(email)
            .then(done)
            .catch(err => {
                if (err.code === 'auth/user-not-found') return done();
                errEl.textContent = err.code === 'auth/too-many-requests'
                    ? 'Too many attempts — please try again in a few minutes.'
                    : 'Could not send the reset email. Please try again.';
                errEl.style.display = 'block';
            });
    }

    /* ── Resend verification email (welcome panel nudge) ── */
    function resendVerification() {
        const note = document.getElementById('verify-email-note');
        const user = _fbAuth && _fbAuth.currentUser;
        if (!user || !note) return;
        user.sendEmailVerification()
            .then(() => { note.textContent = '📬 Verification link sent — check your inbox (and spam folder).'; })
            .catch(err => {
                note.textContent = err.code === 'auth/too-many-requests'
                    ? '⏳ Too many attempts — try again in a few minutes.'
                    : '⚠️ Could not send the email right now. Try again later.';
            });
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


    /** Return to the sign-in splash from guest mode */
    function returnToSignIn() {
        window._guestMode = false;
        const splash = document.getElementById('splash');
        if (splash) splash.style.display = '';   // restore flex from CSS

        // Hide guest bar
        const guestBar = document.getElementById('guest-signin-bar');
        if (guestBar) guestBar.style.display = 'none';

        // Restore breadcrumb button to its normal Dashboard behaviour
        const dashBtn = document.getElementById('nav-bc-dashboard-btn');
        if (dashBtn) {
            dashBtn.querySelector('span').textContent = '⬅ Dashboard';
            dashBtn.onclick = function() { switchMode('dashboard'); };
        }
    }

    /** Wipe all saved calculator data for the current user (with confirmation) */
    function confirmResetAllData() {
        if (!confirm('Reset all your saved numbers?\n\nThis clears Growth, Goal, Emergency Fund, Health Score, and Financial Plan data. Your account stays safe.')) return;
        const user = _fbAuth && _fbAuth.currentUser;
        if (user && _fbDb) {
            const userRef = _fbDb.collection('users').doc(user.uid);
            userRef.collection('tools').get()
                .then(function(toolsSnap) {
                    var batch = _fbDb.batch();
                    toolsSnap.forEach(function(d) { batch.delete(d.ref); });
                    // Also clear the legacy appData field for not-yet-migrated users
                    batch.set(userRef, { appData: firebase.firestore.FieldValue.delete() }, { merge: true });
                    return batch.commit();
                })
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
        // Debounce: wait 0.8s after last change before writing to Firestore
        // (short enough that a quick tab close rarely races the write)
        clearTimeout(_saveTimer);
        _saveTimer = setTimeout(() => { _saveTimer = null; _doSaveUserData(user); }, 800);
    }

    // Flush any pending debounced save immediately when the page is leaving or
    // hidden. beforeunload alone is unreliable — it often never fires on mobile
    // (tab discard, app switch), so visibilitychange === 'hidden' is the
    // primary signal; beforeunload stays as a desktop refresh/close fallback.
    function _flushPendingSave() {
        const user = _fbAuth && _fbAuth.currentUser;
        if (_saveTimer && user && _fbDb) {
            clearTimeout(_saveTimer);
            _saveTimer = null;
            _doSaveUserData(user);
        }
    }
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') _flushPendingSave();
    });
    window.addEventListener('beforeunload', _flushPendingSave);

    function _doSaveUserData(user) {
        try {
            // Helper: collect field values only if the panel is in the DOM.
            // Returns null when anchor element is missing (panel not yet lazy-loaded).
            // Caller uses spread syntax so null keys are omitted from Firestore payload —
            // with merge:true, omitted keys are PRESERVED, not overwritten with empty strings.
            function _panelData(anchorId, collectFn) {
                return document.getElementById(anchorId) ? collectFn() : null;
            }

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
            // healthScore — null when panel not in DOM (omitted from payload → Firestore preserves existing)
            const healthScore = _panelData('hs-income', function() {
                var obj = {};
                ['hs-income','hs-emi','hs-expenses','hs-savings','hs-health-ins','hs-term-ins','hs-efund','hs-age',
                 'hs-pf-equity','hs-pf-debt','hs-pf-realty','hs-pf-gold','hs-pf-retiral','hs-pf-other'].forEach(function(id) {
                    obj[id] = document.getElementById(id)?.value || '';
                });
                return obj;
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
            ['fp-name','fp-age','fp-retire-age','fp-income','fp-invest-amt','fp-epf-basic','fp-epf-balance'].forEach(function(id) {
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
            // Per-panel data — _panelData returns null when anchor not in DOM.
            // Spread in data object: null → key omitted → Firestore merge:true preserves existing value.
            const homeLoan = _panelData('hl-amount', function() {
                var obj = {};
                ['hl-amount','hl-rate','hl-tenure','hl-start-month','hl-start-year',
                 'pp-amount','pp-rate','pp-tenure','pp-lump','pp-after',
                 'rvb-price','rvb-down','rvb-rate','rvb-tenure','rvb-apprec','rvb-maint','rvb-society','rvb-stamp','rvb-gst','rvb-modt','rvb-rent','rvb-rent-incr','rvb-inv-return','rvb-years',
                 'tx-amount','tx-rate','tx-tenure','tx-slab','tx-type'].forEach(function(id) {
                    obj[id] = document.getElementById(id)?.value || '';
                });
                return obj;
            });
            const stepUpSIP = _panelData('su-amount', function() {
                var obj = {};
                ['su-amount','su-rate','su-years','su-stepup'].forEach(function(id) {
                    obj[id] = document.getElementById(id)?.value || '';
                });
                obj['su-ltcg'] = document.getElementById('su-ltcg-toggle')?.checked ? '1' : '0';
                return obj;
            });
            const ssaPlanner = _panelData('ssa-dob-year', function() {
                var obj = {};
                ['ssa-dob-year','ssa-annual','ssa-tenure','ssa-elss-sip','ssa-elss-return','ssa-inflation','ssa-goal-edu','ssa-goal-marr'].forEach(function(id){
                    obj[id] = document.getElementById(id)?.value || '';
                });
                return obj;
            });
            const epfCalc = _panelData('epf-basic', function() {
                var obj = {};
                ['epf-basic','epf-balance','epf-age','epf-retire','epf-growth','epf-rate'].forEach(function(id){
                    obj[id] = document.getElementById(id)?.value || '';
                });
                return obj;
            });
            const drawdown = _panelData('dd-corpus', function() {
                var obj = {};
                ['dd-corpus','dd-current-age','dd-ret-age','dd-expenses','dd-inflation','dd-return','dd-other-income'].forEach(function(id){
                    obj[id] = document.getElementById(id)?.value || '';
                });
                return obj;
            });
            const ppfnps = _panelData('ppf-annual', function() {
                var obj = {};
                ['ppf-annual','ppf-balance','ppf-years-done','ppf-rate','ppf-extend',
                 'nps-monthly','nps-age','nps-balance','nps-return','nps-annuity-rate','nps-slab','nps-regime'].forEach(function(id){
                    obj[id] = document.getElementById(id)?.value || '';
                });
                obj['ppfnps-active-tab'] = (document.getElementById('ppf-section') && !document.getElementById('ppf-section').classList.contains('hidden')) ? 'ppf' : 'nps';
                return obj;
            });
            const ctcOptimizer = _panelData('ctc-annual', function() {
                var obj = {};
                ['ctc-annual','ctc-basic','ctc-hra','ctc-rent','ctc-city','ctc-lta',
                 'ctc-food','ctc-phone','ctc-emp-nps','ctc-80c','ctc-regime'].forEach(function(id){
                    obj[id] = document.getElementById(id)?.value || '';
                });
                return obj;
            });
            const insurance = _panelData('ins-income', function() {
                var obj = {};
                ['ins-income','ins-age','ins-dependents','ins-loans','ins-term-current',
                 'ins-health-current','ins-monthly-exp','ins-family',
                 'ins-assets','ins-ci-current','ins-disability-current',
                 'ins-parents-cover','ins-parents-age1','ins-parents-age2'].forEach(function(id){
                    obj[id] = document.getElementById(id)?.value || '';
                });
                return obj;
            });
            const fixedIncome = _panelData('fi-fd-principal', function() {
                var obj = {};
                ['fi-fd-principal','fi-fd-rate','fi-fd-tenure','fi-fd-type',
                 'fi-fd-regime','fi-fd-slab',
                 'fi-scss-principal','fi-scss-regime','fi-scss-slab',
                 'fi-pomis-principal','fi-pomis-regime','fi-pomis-slab',
                 'fi-nsc-principal','fi-nsc-regime','fi-nsc-slab',
                 'fi-kvp-principal',
                 'fi-cmp-principal','fi-cmp-fd-rate','fi-cmp-elss-return',
                 'fi-cmp-regime','fi-cmp-slab'].forEach(function(id){
                    obj[id] = document.getElementById(id)?.value || '';
                });
                return obj;
            });
            const retirementHub = _panelData('rh-age', function() {
                var obj = {};
                ['rh-age','rh-ret-age','rh-life-exp','rh-inflation','rh-ret-return','rh-expenses',
                 'rh-epf-balance','rh-epf-basic',
                 'rh-ppf-balance','rh-ppf-annual','rh-ppf-years-done',
                 'rh-nps-balance','rh-nps-monthly','rh-nps-return','rh-nps-annuity',
                 'rh-sip-monthly','rh-sip-return',
                 'rh-other-corpus','rh-other-return'].forEach(function(id){
                    obj[id] = document.getElementById(id)?.value || '';
                });
                return obj;
            });
            const gratuity = _panelData('grat-basic', function() {
                var obj = {};
                ['grat-basic','grat-years','grat-months','grat-type','grat-slab','grat-regime'].forEach(function(id){
                    obj[id] = document.getElementById(id)?.value || '';
                });
                return obj;
            });
            const debtPlan = _panelData('debt-extra', function() {
                var obj = {};
                obj['debt-extra'] = document.getElementById('debt-extra')?.value || '';
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
            });
            const jointPlan = _panelData('jp-p1-name', function() {
                var obj = {};
                ['jp-p1-name','jp-p1-income','jp-p1-invest','jp-p1-portfolio','jp-p1-80c',
                 'jp-p2-name','jp-p2-income','jp-p2-invest','jp-p2-portfolio','jp-p2-80c',
                 'jp-edu-cost','jp-edu-years','jp-home-cost','jp-home-years',
                 'jp-retire-age','jp-retire-monthly','jp-return'].forEach(function(id){
                    obj[id] = document.getElementById(id)?.value || '';
                });
                obj['jp-p1-slab']     = document.getElementById('jp-p1-slab')?.value     || '20';
                obj['jp-p2-slab']     = document.getElementById('jp-p2-slab')?.value     || '30';
                obj['jp-p1-regime']   = document.getElementById('jp-p1-regime')?.value   || 'new';
                obj['jp-p2-regime']   = document.getElementById('jp-p2-regime')?.value   || 'new';
                obj['jp-goal-edu']    = document.getElementById('jp-goal-edu')?.checked    ? '1' : '0';
                obj['jp-goal-home']   = document.getElementById('jp-goal-home')?.checked   ? '1' : '0';
                obj['jp-goal-retire'] = document.getElementById('jp-goal-retire')?.checked ? '1' : '0';
                return obj;
            });
            const cibil = _panelData('cibil-score', function() {
                var obj = {};
                ['cibil-score','cibil-util','cibil-missed','cibil-age','cibil-cards',
                 'cibil-enquiries','cibil-loan-amt','cibil-loan-tenure'].forEach(function(id){
                    obj[id] = document.getElementById(id)?.value || '';
                });
                return obj;
            });
            const fincal = _panelData('fc-income', function() {
                var obj = {};
                obj['fc-regime']  = document.getElementById('fc-regime')?.value  || 'new';
                obj['fc-income']  = document.getElementById('fc-income')?.value  || '';
                obj['fc-ppf']     = document.getElementById('fc-ppf')?.value     || 'yes';
                obj['fc-elss']    = document.getElementById('fc-elss')?.value    || 'yes';
                obj['fc-sgb']     = document.getElementById('fc-sgb')?.value     || 'yes';
                obj['fc-epf']     = document.getElementById('fc-epf')?.value     || 'yes';
                obj['fc-cc-date'] = document.getElementById('fc-cc-date')?.value || '';
                return obj;
            });
            const selfEmpl = _panelData('se-turnover', function() {
                var obj = {};
                ['se-turnover','se-actual-profit','se-other-income','se-80c','se-nps',
                 'se-bef-salaries','se-bef-rent','se-bef-tools','se-bef-loans','se-bef-utilities',
                 'se-bef-inventory','se-bef-personal','se-bef-current',
                 'se-gst-revenue','se-gst-purchases','se-gst-delay','se-adv-tax'].forEach(function(id){
                    obj[id] = document.getElementById(id)?.value || '';
                });
                obj['se-biz-type']     = document.getElementById('se-biz-type')?.value     || '44AD_digital';
                obj['se-tax-regime']   = document.getElementById('se-tax-regime')?.value   || 'new';
                obj['se-bef-months']   = document.getElementById('se-bef-months')?.value   || '6';
                obj['se-gst-type']     = document.getElementById('se-gst-type')?.value     || 'regular';
                obj['se-gst-rate-out'] = document.getElementById('se-gst-rate-out')?.value || '18';
                obj['se-gst-rate-in']  = document.getElementById('se-gst-rate-in')?.value  || '18';
                return obj;
            });
            const goldComp = _panelData('gc-amount', function() {
                var obj = {};
                ['gc-amount','gc-years','gc-return','gc-making','gc-locker'].forEach(function(id){
                    obj[id] = document.getElementById(id)?.value || '';
                });
                obj['gc-slab']   = document.getElementById('gc-slab')?.value   || '20';
                obj['gc-regime'] = document.getElementById('gc-regime')?.value || 'new';
                return obj;
            });
            const ulipCheck = _panelData('uc-premium', function() {
                var obj = {};
                ['uc-premium','uc-term','uc-paid','uc-maturity','uc-sv',
                 'uc-cover','uc-age','uc-inv-return'].forEach(function(id){
                    obj[id] = document.getElementById(id)?.value || '';
                });
                obj['uc-slab'] = document.getElementById('uc-slab')?.value || '20';
                return obj;
            });
            const netWorth = _panelData('nw-savings', function() {
                var obj = {};
                ['nw-savings','nw-fd','nw-stocks','nw-eq-mf','nw-epf','nw-ppf','nw-nps',
                 'nw-debt-mf','nw-home','nw-property','nw-gold-phys','nw-gold-paper',
                 'nw-crypto','nw-ins-sv','nw-other-assets',
                 'nw-liab-home','nw-liab-car','nw-liab-pl','nw-liab-edu','nw-liab-cc','nw-liab-other'].forEach(function(id){
                    obj[id] = document.getElementById(id)?.value || '';
                });
                return obj;
            });
            const cgCalc = _panelData('cg-cost', function() {
                var obj = {};
                ['cg-buy-date','cg-sell-date','cg-cost','cg-sale','cg-ltcg-used','cg-income'].forEach(function(id){
                    obj[id] = document.getElementById(id)?.value || '';
                });
                obj['cg-asset']  = document.getElementById('cg-asset')?.value  || 'equity';
                obj['cg-regime'] = document.getElementById('cg-regime')?.value || 'new';
                return obj;
            });
            const hraCalc = _panelData('hra-basic', function() {
                var obj = {};
                ['hra-basic','hra-received','hra-rent'].forEach(function(id){
                    obj[id] = document.getElementById(id)?.value || '';
                });
                obj['hra-city']   = document.getElementById('hra-city')?.value   || 'metro';
                obj['hra-regime'] = document.getElementById('hra-regime')?.value || 'old';
                obj['hra-slab']   = document.getElementById('hra-slab')?.value   || '20';
                return obj;
            });
            const budgetTracker = _panelData('bt-month-disp', function() {
                return {
                    month:       window._btMonth        || '',
                    chartType:   window._btChartType    || 'bar',
                    data:        window._btData         ? JSON.stringify(window._btData)       : '{}',
                    customCats:  window._btCustomCats   ? JSON.stringify(window._btCustomCats) : '[]',
                    lastUpdated: window._btLastUpdated  || ''
                };
            });
            const nomTrack = _panelData('nt-bank-status', function() {
                var obj = {};
                ['bank','mf','life','epf','ppf','nps','demat','health'].forEach(function(a) {
                    ['status','nominee','date'].forEach(function(f) {
                        var id = 'nt-' + a + '-' + f;
                        obj[id] = document.getElementById(id)?.value || '';
                    });
                });
                ['nt-will-status','nt-exec-status','nt-fam-status','nt-digital-status'].forEach(function(id) {
                    obj[id] = document.getElementById(id)?.value || '';
                });
                obj['nt-notes'] = document.getElementById('nt-notes')?.value || '';
                // Will generator fields
                ['wg-name','wg-age','wg-parent','wg-religion','wg-address','wg-date',
                 'wg-exec-name','wg-exec-rel','wg-exec-addr',
                 'wg-w1-name','wg-w1-occ','wg-w1-addr',
                 'wg-w2-name','wg-w2-occ','wg-w2-addr','wg-special'].forEach(function(id) {
                    obj[id] = document.getElementById(id)?.value || '';
                });
                // Beneficiary rows (class-based, no IDs — save by index)
                ['name','rel','share','cont'].forEach(function(field) {
                    document.querySelectorAll('.wg-bene-' + field).forEach(function(el, i) {
                        obj['wg-bene-' + field + '-' + i] = el.value || '';
                    });
                });
                return obj;
            });
            // Seed from last Firestore snapshot so panel data isn't lost when panels
            // are lazy-loaded and not currently in the DOM — carry forward missing
            // panel data using the cached snapshot as the starting point, so the
            // per-tool diff in _writeToolDocs sees a complete picture and skips
            // unchanged docs.
            var _base = window._cachedRestoreData ? Object.assign({}, window._cachedRestoreData) : {};
            var data = Object.assign(_base, {
                growth:    window._tabState ? Object.assign({}, window._tabState.growth) : (_base.growth || {}),
                goal:      window._tabState ? Object.assign({}, window._tabState.goal)   : (_base.goal   || {}),
                emergency: { months: window._efMonths || 6, fixedExpenses: fixedExpenses, customRows: customRows },
                ...(healthScore  ? { healthScore }  : {}),
                finplan:   fpSaveObj,
                // Only include taxGuide when we actually have data (see comment above taxGuide block).
                ...(Object.keys(taxGuide).length > 0 ? { taxGuide } : {}),
                ...(homeLoan     ? { homeLoan }     : {}),
                ...(stepUpSIP    ? { stepUpSIP }    : {}),
                ...(ssaPlanner   ? { ssaPlanner }   : {}),
                ...(epfCalc      ? { epfCalc }      : {}),
                userProfile: window._userProfile || _base.userProfile || {},
                ...(drawdown     ? { drawdown }     : {}),
                ...(ppfnps       ? { ppfnps }       : {}),
                ...(ctcOptimizer ? { ctcOptimizer } : {}),
                ...(insurance    ? { insurance }    : {}),
                ...(fixedIncome  ? { fixedIncome }  : {}),
                ...(retirementHub? { retirementHub }: {}),
                ...(gratuity     ? { gratuity }     : {}),
                ...(debtPlan     ? { debtPlan }     : {}),
                ...(jointPlan    ? { jointPlan }    : {}),
                ...(cibil        ? { cibil }        : {}),
                ...(fincal       ? { fincal }       : {}),
                ...(selfEmpl     ? { selfEmpl }     : {}),
                ...(goldComp     ? { goldComp }     : {}),
                savedGoals:   window._savedGoals   || _base.savedGoals   || [],
                savedGoalsTs: window._savedGoalsTs || _base.savedGoalsTs || '',
                ...(ulipCheck    ? { ulipCheck }    : {}),
                ...(netWorth     ? { netWorth }     : {}),
                ...(cgCalc       ? { cgCalc }       : {}),
                ...(hraCalc      ? { hraCalc }      : {}),
                ...(nomTrack      ? { nomTrack }      : {}),
                ...(budgetTracker ? { budgetTracker } : {}),
                ...((window._pathState && (window._pathState.active || (window._pathState.archive || []).length))
                    ? { finPath: window._pathState }
                    : (_base.finPath ? { finPath: _base.finPath } : {})),
                roadmap: window._rmState ? {
                    profile: window._rmState.profile || null,
                    visited: window._rmState.visited  || [],
                    dismissed: window._rmState.dismissed || false,
                    collapsed: window._rmState.collapsed || false
                } : (_base.roadmap || {}),
                nwHistory: (typeof _nwHistory !== 'undefined' && _nwHistory.length) ? _nwHistory.slice() : (_base.nwHistory || []),
                myMFs: window._myMFs && window._myMFs.length ? window._myMFs.slice() : (_base.myMFs || []),
                hsLastScore: window._hsLastResult ? {
                    score: window._hsLastResult.score, ts: window._hsLastResult.ts,
                    grade: window._hsLastResult.grade, emoji: window._hsLastResult.emoji,
                    arcColor: window._hsLastResult.arcColor, topActions: window._hsLastResult.topActions || []
                } : (_base.hsLastScore || null)
            });
            // Keep in-memory cache in sync so subsequent saves inherit current values
            window._cachedRestoreData = data;
            _writeToolDocs(user, data);
        } catch(e) { console.warn('saveUserData failed:', e); }
    }

    // ── Per-tool Firestore layout ──
    // Each top-level key of the assembled data object lives in its own doc at
    // users/{uid}/tools/{toolId}, payload under field `v` — the user doc itself
    // stays small (profile, riskProfile, toolSummaries) and no doc approaches
    // Firestore's 1 MB limit as the 26+ tools accumulate data.
    // _toolWriteBaseline holds a JSON snapshot of the last loaded/written payload
    // per tool, so a debounced save only writes docs whose data actually changed
    // (typically just the panel being edited).
    var _toolWriteBaseline = {};

    function _writeToolDocs(user, data) {
        var toolsCol = _fbDb.collection('users').doc(user.uid).collection('tools');
        var batch = _fbDb.batch();
        var written = [];
        Object.keys(data).forEach(function(toolId) {
            var payload = data[toolId];
            if (payload === undefined) return;
            var json = JSON.stringify(payload);
            if (_toolWriteBaseline[toolId] === json) return;
            // merge:true — same deep-merge semantics the appData map had, so a
            // partial payload never clobbers fields written by another session
            batch.set(toolsCol.doc(toolId), { v: payload }, { merge: true });
            written.push({ id: toolId, json: json });
        });
        if (written.length === 0) return;
        batch.commit()
            .then(function() {
                // Only advance the baseline on success so a failed write retries
                // on the next debounced save
                written.forEach(function(w) { _toolWriteBaseline[w.id] = w.json; });
            })
            .catch(function(e) { console.warn('saveUserData Firestore failed:', e); });
    }

    // One-time migration from the legacy layout (everything under users/{uid}.appData):
    // copy each key into its own tool doc and drop the appData field in a single
    // atomic batch — if the commit fails, appData is untouched and migration
    // simply retries on the next login.
    function _migrateAppDataToToolDocs(user, appData) {
        var userRef = _fbDb.collection('users').doc(user.uid);
        var batch = _fbDb.batch();
        Object.keys(appData).forEach(function(toolId) {
            if (appData[toolId] === undefined) return;
            batch.set(userRef.collection('tools').doc(toolId), { v: appData[toolId] }, { merge: true });
        });
        batch.set(userRef, { appData: firebase.firestore.FieldValue.delete() }, { merge: true });
        batch.commit()
            .then(function() {
                Object.keys(appData).forEach(function(toolId) {
                    if (appData[toolId] !== undefined) _toolWriteBaseline[toolId] = JSON.stringify(appData[toolId]);
                });
                console.log('[auth] migrated appData to', Object.keys(appData).length, 'per-tool docs');
            })
            .catch(function(e) { console.warn('[auth] appData migration failed (retries next login):', e); });
    }

    function loadUserData(preloaded) {
        if (preloaded !== undefined) {
            if (!preloaded) return;
            _applyData(preloaded);
            return;
        }
        const user = _fbAuth && _fbAuth.currentUser;
        if (!user || !_fbDb) return;

        const userRef = _fbDb.collection('users').doc(user.uid);
        Promise.all([userRef.get(), userRef.collection('tools').get()]).then(function(res) {
            var snap = res[0], toolsSnap = res[1];
            // ── Load risk profile into cache (one-time activity) ──
            if (snap.exists && snap.data() && snap.data().riskProfile) {
                window._fpRiskCache = snap.data().riskProfile;
                if (typeof upRefreshRiskDisplay === 'function') upRefreshRiskDisplay();
            }
            // ── Load tool summaries for My Profile ──
            if (snap.exists && snap.data() && snap.data().toolSummaries) {
                window._toolSummaries = snap.data().toolSummaries;
                if (typeof upRefreshToolSummaries === 'function') upRefreshToolSummaries();
            }
            var data = null;
            if (!toolsSnap.empty) {
                // Current layout — one doc per tool under users/{uid}/tools
                data = {};
                toolsSnap.forEach(function(d) {
                    data[d.id] = d.data().v;
                    _toolWriteBaseline[d.id] = JSON.stringify(d.data().v);
                });
            } else if (snap.exists && snap.data() && snap.data().appData) {
                // Legacy layout — restore from the appData field, then migrate it
                data = snap.data().appData;
                _migrateAppDataToToolDocs(user, data);
            }
            if (!data) return;
            window._cachedRestoreData = data;
            _applyData(data);
        }).catch(e => console.warn('loadUserData Firestore failed:', e));
    }

    function saveToolSummary(toolName, data) {
        window._toolSummaries = window._toolSummaries || {};
        window._toolSummaries[toolName] = Object.assign({}, data, { updatedAt: new Date().toISOString() });
        var user = _fbAuth && _fbAuth.currentUser;
        if (user && _fbDb) {
            var patch = { toolSummaries: {} };
            patch.toolSummaries[toolName] = window._toolSummaries[toolName];
            _fbDb.collection('users').doc(user.uid).set(patch, { merge: true })
                .catch(function(e){ console.warn('saveToolSummary failed:', e); });
        }
        if (typeof upRefreshToolSummaries === 'function') upRefreshToolSummaries();
        if (typeof _dashUpdateNetWorthWidget === 'function') _dashUpdateNetWorthWidget();
        if (toolName === 'netWorth' && typeof hsRefreshNwBanner === 'function') hsRefreshNwBanner();
        if (toolName === 'netWorth' && typeof fpRefreshNwBanner === 'function') fpRefreshNwBanner();
    }
    window.saveToolSummary = saveToolSummary;

    // Generic helper: if anchorId is in DOM, call applyFn immediately (inside the
    // caller's _restoring = true context). Otherwise set up a MutationObserver so
    // data is applied the instant the panel appears — with its own _restoring guard.
    function _applyWhenReady(anchorId, applyFn) {
        if (document.getElementById(anchorId) !== null) {
            applyFn(); // _restoring is already true from outer _applyData
        } else {
            var _obs = new MutationObserver(function(_, obs) {
                if (document.getElementById(anchorId) !== null) {
                    obs.disconnect();
                    setTimeout(function() {
                        // _applyData has completed by now; set _restoring ourselves
                        _restoring = true;
                        try { applyFn(); } catch(e) { console.warn('panel restore (' + anchorId + '):', e); }
                        finally { _restoring = false; }
                    }, 0);
                }
            });
            _obs.observe(document.body, { childList: true, subtree: true });
        }
    }

    // Compute a score summary from raw healthScore input data without needing DOM elements.
    // Mirrors the scoring logic in health-score.js so the dashboard widget works on first load.
    function _hsQuickScore(d) {
        function pv(v) { return parseInt((v||'').replace(/[^0-9]/g,''),10)||0; }
        var income=pv(d['hs-income']); if(!income) return null;
        var emi=pv(d['hs-emi']),exp=pv(d['hs-expenses']),sav=pv(d['hs-savings']);
        var hi=pv(d['hs-health-ins']),ti=pv(d['hs-term-ins']),ef=pv(d['hs-efund']);
        var age=parseInt(d['hs-age'],10)||0;
        var pfEq=pv(d['hs-pf-equity']),pfD=pv(d['hs-pf-debt']),pfR=pv(d['hs-pf-realty']);
        var pfG=pv(d['hs-pf-gold']),pfRet=pv(d['hs-pf-retiral']),pfOth=pv(d['hs-pf-other']);
        var pfTotal=pfEq+pfD+pfR+pfG+pfRet+pfOth, annInc=income*12, mthExp=exp+emi;
        var savR=(sav/income)*100;
        var cats=[];
        cats.push({name:'Savings Rate',    pts:savR>=30?20:savR>=20?16:savR>=10?11:savR>=5?6:Math.max(0,Math.round(savR*1.2)), max:20, icon:'💰', mode:'stepupsip'});
        var ep=(emi/income)*100;
        cats.push({name:'Debt Burden',     pts:ep===0||ep<20?20:ep<30?15:ep<40?9:ep<50?4:0,                                     max:20, icon:'🏦', mode:'debtplan'});
        var hiL=hi/100000;
        cats.push({name:'Health Insurance',pts:hiL>=20?15:hiL>=10?13:hiL>=5?9:hiL>=3?5:hiL>=1?2:0,                             max:15, icon:'🏥', mode:'insure'});
        var tiM=annInc>0?ti/annInc:0;
        cats.push({name:'Term Insurance',  pts:tiM>=15?15:tiM>=10?13:tiM>=7?9:tiM>=5?5:tiM>=2?2:0,                             max:15, icon:'🛡️', mode:'insure'});
        var efM=mthExp>0?ef/mthExp:0;
        cats.push({name:'Emergency Fund',  pts:efM>=12?15:efM>=9?12:efM>=6?10:efM>=4?7:efM>=2?4:efM>=1?2:0,                   max:15, icon:'🚨', mode:'goal'});
        var sp=((exp+emi)/income)*100;
        cats.push({name:'Spending Control',pts:sp<=50?15:sp<=60?12:sp<=70?8:sp<=80?4:sp<=90?1:0,                               max:15, icon:'🛒', mode:'budgettrack'});
        if(age>=18&&age<=80){var ap=0;if(age<=25)ap=savR>=10?10:savR>=5?8:savR>0?5:2;else if(age<=35)ap=savR>=20?10:savR>=15?8:savR>=10?5:savR>=5?2:0;else if(age<=45)ap=savR>=25?10:savR>=20?7:savR>=15?4:savR>=10?1:0;else if(age<=55)ap=savR>=30?10:savR>=25?6:savR>=20?3:savR>=15?1:0;else ap=savR>=35?10:savR>=30?5:savR>=25?2:0;cats.push({name:'Age Readiness',pts:ap,max:10,icon:'🎂',mode:'finplan'});}
        if(pfTotal>0){var pfM=annInc>0?pfTotal/annInc:0,nwP=(pfM>=10?7:pfM>=5?6:pfM>=3?5:pfM>=2?4:pfM>=1?3:pfM>=0.5?2:1);var acc=[pfEq>0,(pfD>0||pfRet>0),pfR>0,pfG>0].filter(Boolean).length;nwP+=Math.min(4,acc);var eqPct=pfTotal>0?(pfEq/pfTotal)*100:0,idealEq=Math.max(20,100-(age||35)),eqGap=Math.abs(eqPct-idealEq);nwP+=(eqGap<=10?4:eqGap<=20?3:eqGap<=30?2:0);cats.push({name:'Net Worth Readiness',pts:Math.min(15,nwP),max:15,icon:'📊',mode:'networth'});}
        var raw=cats.reduce(function(a,c){return a+c.pts;},0), max=cats.reduce(function(a,c){return a+c.max;},0);
        var score=Math.min(100,Math.round(raw*100/max));
        var grade,emoji,arcColor;
        if(score>=90){grade='Financial Rockstar 🤘';emoji='🏆';arcColor='#10b981';}
        else if(score>=80){grade='Wealth Builder';emoji='🌟';arcColor='#22c55e';}
        else if(score>=70){grade='On the Right Track';emoji='📈';arcColor='#84cc16';}
        else if(score>=55){grade='Getting There';emoji='🚀';arcColor='#eab308';}
        else if(score>=40){grade='Wake-Up Call';emoji='⚡';arcColor='#f97316';}
        else if(score>=25){grade='SOS Mode';emoji='🚨';arcColor='#ef4444';}
        else{grade='Financial Emergency';emoji='🆘';arcColor='#dc2626';}
        var sorted=cats.slice().sort(function(a,b){return(a.pts/a.max)-(b.pts/b.max);}),topActions=[];
        sorted.forEach(function(c){if(topActions.length>=3||c.pts>=c.max)return;topActions.push({icon:c.icon,name:c.name,color:'',mode:c.mode});});
        return {score:score,grade:grade,emoji:emoji,arcColor:arcColor,topActions:topActions,ts:Date.now()};
    }

    function _applyData(data) {
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
            // Health Score — same MutationObserver pattern as Tax Guide:
            // store pending data then watch for panel to appear in DOM
            try {
                if (data.healthScore) {
                    window._hsPendingData = data.healthScore;

                    function _applyHsData() {
                        var pending = window._hsPendingData;
                        if (!pending) return;
                        window._hsPendingData = null; // prevent double-apply
                        _restoring = true;
                        try {
                            Object.entries(pending).forEach(function(entry) {
                                var id = entry[0], val = entry[1];
                                var el = document.getElementById(id);
                                if (!el || val === '' || val === undefined || val === null) return;
                                el.value = val;
                                if (val && val !== '0') el.classList.remove('text-slate-400');
                            });
                        } finally {
                            _restoring = false;
                        }
                        if (typeof calcHealthScore === 'function') calcHealthScore();
                    }

                    if (document.getElementById('hs-income') !== null) {
                        _applyHsData();
                    } else {
                        var _hsObserver = new MutationObserver(function(mutations, obs) {
                            if (document.getElementById('hs-income') !== null) {
                                obs.disconnect();
                                // setTimeout(0) lets the panel's init code finish before we overwrite
                                setTimeout(_applyHsData, 0);
                            }
                        });
                        _hsObserver.observe(document.body, { childList: true, subtree: true });
                    }
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
                        existing:        (fp.existing        || []).slice(),
                        existingAmounts: Object.assign({}, fp.existingAmounts || {}),
                        existingCustom:  fp.existingCustom  || '',
                        answers:         Object.assign({}, fp.answers || {}),
                        planGenerated:   fp.planGenerated   || false
                    });
                    ['fp-name','fp-age','fp-retire-age','fp-income','fp-invest-amt','fp-epf-basic','fp-epf-balance'].forEach(function(id) {
                        const el = document.getElementById(id);
                        if (el && fp[id]) el.value = fp[id];
                    });
                    if (fp.epfMode) window._fpState.epfMode = fp.epfMode;
                    if (typeof fpGoStep === 'function') fpGoStep(1);
                    // Restore tile visual state after DOM is ready
                    if (typeof fpRestoreGoalTiles === 'function') fpRestoreGoalTiles();
                    // Restore EPF panel + button state
                    if (fp.existing && fp.existing.includes('epf')) {
                        var epfBtn   = document.getElementById('fp-existing-epf-btn');
                        var epfPanel = document.getElementById('fp-epf-panel');
                        if (epfBtn)   epfBtn.classList.add('fp-existing-active');
                        if (epfPanel) epfPanel.classList.remove('hidden');
                        // Restore the EPF balance field — prefer direct DOM field value, fall back to existingAmounts
                        var epfBalEl = document.getElementById('fp-epf-balance');
                        var savedEpfBal = (fp['fp-epf-balance'] && fp['fp-epf-balance'] !== '0') ? fp['fp-epf-balance']
                            : (fp.existingAmounts && fp.existingAmounts['epf'] ? Number(fp.existingAmounts['epf']).toLocaleString('en-IN') : '');
                        if (epfBalEl && savedEpfBal) epfBalEl.value = savedEpfBal;
                        // Only sync when panel is in DOM — fpEpfSync reads fp-epf-balance; calling with
                        // no panel would zero out fpState.existingAmounts['epf'] via empty input.
                        if (epfBalEl && typeof fpEpfSync === 'function') fpEpfSync();
                    }
                    // Restore crypto button + active indicator (already confirmed)
                    if (fp.existing && fp.existing.includes('crypto')) {
                        var cryptoBtnR   = document.getElementById('fp-existing-crypto-btn');
                        var cryptoActive = document.getElementById('fp-crypto-active');
                        if (cryptoBtnR)   cryptoBtnR.classList.add('fp-existing-active');
                        if (cryptoActive) cryptoActive.classList.remove('hidden');
                    }
                    // Restore active state for all other existing investment buttons
                    // (mf, ppf, nps, fd, stocks, gold, real_estate, scss, pomis, kvp, rbi_frb, nsc, custom_inv)
                    if (fp.existing && fp.existing.length > 0) {
                        document.querySelectorAll('.fp-existing-btn').forEach(function(btn) {
                            var onclick = btn.getAttribute('onclick') || '';
                            var match = onclick.match(/fpToggleExisting\(this,'([^']+)'\)/);
                            if (match && fp.existing.includes(match[1])) {
                                btn.classList.add('fp-existing-active');
                            }
                        });
                        // Restore custom_inv text input
                        if (fp.existing.includes('custom_inv')) {
                            var customInp = document.getElementById('fp-existing-custom-input');
                            if (customInp) customInp.classList.remove('hidden');
                        }
                        // Re-render the amount inputs
                        if (typeof fpRenderExistingAmounts === 'function') fpRenderExistingAmounts();
                    }
                    if (typeof fpLiveUpdate === 'function') fpLiveUpdate();
                }
            } catch(e) { console.warn('loadUserData finplan:', e); }

            // Saved Goals (Goal Planner → Financial Plan bridge)
            try {
                if (Array.isArray(data.savedGoals)) {
                    window._savedGoals = data.savedGoals;
                    if (data.savedGoalsTs) window._savedGoalsTs = data.savedGoalsTs;
                    if (typeof gpRenderSavedGoalsBanner  === 'function') gpRenderSavedGoalsBanner();
                    if (typeof _dashUpdateGoalsWidget    === 'function') _dashUpdateGoalsWidget();
                    if (typeof window._gtRefreshIfOpen  === 'function') window._gtRefreshIfOpen();
                }
            } catch(e) { console.warn('loadUserData savedGoals:', e); }

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

            // Home Loan restore
            try {
                if (data.homeLoan) {
                    window._hlPendingData = data.homeLoan; // kept for initHomeLoan colour fix
                    var _hlData = data.homeLoan;
                    _applyWhenReady('hl-amount', function() {
                        var hlRestoreDefaults = {'hl-rate':'8.5','hl-tenure':'20','pp-rate':'8.5','pp-tenure':'20','pp-after':'3','rvb-rate':'8.5','rvb-tenure':'20','rvb-apprec':'7','rvb-stamp':'7','rvb-gst':'0','rvb-rent-incr':'5','rvb-inv-return':'12','rvb-years':'20','tx-rate':'8.5','tx-tenure':'20'};
                        Object.entries(_hlData).forEach(function([id, val]) {
                            var el = document.getElementById(id);
                            if (!el || val === null) return;
                            el.value = val;
                            var defaultVal = hlRestoreDefaults[id];
                            if (el.tagName === 'SELECT') {
                                if (val) el.style.removeProperty('color');
                            } else if (defaultVal !== undefined) {
                                if (val === '' || val === defaultVal) el.classList.add('text-slate-400');
                                else el.classList.remove('text-slate-400');
                            } else {
                                if (val && val !== '0') el.classList.remove('text-slate-400');
                                else el.classList.add('text-slate-400');
                            }
                        });
                    });
                }
            } catch(e) { console.warn('loadUserData homeLoan:', e); }

            // Step-Up SIP restore
            try {
                if (data.stepUpSIP) {
                    var _suData = data.stepUpSIP;
                    _applyWhenReady('su-amount', function() {
                        var suDefaults = {'su-amount':'5,000','su-rate':'12','su-years':'20','su-stepup':'10'};
                        Object.entries(_suData).forEach(function([id, val]) {
                            var el = document.getElementById(id);
                            if (!el || val === null || val === '') return;
                            el.value = val;
                            if (val === (suDefaults[id] || '')) el.classList.add('text-slate-400');
                            else el.classList.remove('text-slate-400');
                        });
                        var suLtcgTog = document.getElementById('su-ltcg-toggle');
                        if (suLtcgTog && _suData['su-ltcg'] !== undefined) suLtcgTog.checked = _suData['su-ltcg'] === '1';
                        if (typeof stepUpCalc === 'function') stepUpCalc();
                    });
                }
            } catch(e) { console.warn('loadUserData stepUpSIP:', e); }

            // EPF Corpus Projector restore
            try {
                if (data.epfCalc) {
                    var _epfData = data.epfCalc;
                    _applyWhenReady('epf-basic', function() {
                        var epfDefs = {'epf-basic':'50000','epf-balance':'200000','epf-age':'30','epf-retire':'60','epf-growth':'8','epf-rate':'8.15'};
                        Object.entries(_epfData).forEach(function([id, val]) {
                            var el = document.getElementById(id);
                            if (!el || val === null || val === '') return;
                            el.value = val;
                            if (val === (epfDefs[id] || '')) el.classList.add('text-slate-400');
                            else el.classList.remove('text-slate-400');
                        });
                        if (typeof epfCalc === 'function') epfCalc();
                    });
                }
            } catch(e) { console.warn('loadUserData epfCalc:', e); }

            // SSA Planner restore
            try {
                if (data.ssaPlanner) {
                    var _ssaData = data.ssaPlanner;
                    _applyWhenReady('ssa-dob-year', function() {
                        var ssaDefs = {'ssa-dob-year': String(new Date().getFullYear()-5), 'ssa-annual':'150000','ssa-tenure':'15','ssa-elss-sip':'5000','ssa-elss-return':'12','ssa-inflation':'8','ssa-goal-edu':'2500000','ssa-goal-marr':'3000000'};
                        Object.entries(_ssaData).forEach(function([id, val]) {
                            var el = document.getElementById(id);
                            if (!el || val === null || val === '') return;
                            el.value = val;
                            if (val === (ssaDefs[id] || '')) el.classList.add('text-slate-400');
                            else el.classList.remove('text-slate-400');
                        });
                        if (typeof ssaCalc === 'function') ssaCalc();
                    });
                }
            } catch(e) { console.warn('loadUserData ssaPlanner:', e); }

            // User Profile restore
            try {
                if (data.userProfile && typeof upLoad === 'function') {
                    upLoad(data.userProfile);
                    // Re-render FP goal cards so "My Profile" toggles reflect restored profileGoals
                    // (fpRenderGoalCards ran earlier during finplan restore, before profile was loaded)
                    if (typeof fpRenderGoalCards === 'function') fpRenderGoalCards();
                }
            } catch(e) { console.warn('loadUserData userProfile:', e); }

            // Drawdown Planner restore
            try {
                if (data.drawdown) {
                    var _ddData = data.drawdown;
                    _applyWhenReady('dd-corpus', function() {
                        var ddDefs = {'dd-corpus':'1,00,00,000','dd-current-age':'30','dd-ret-age':'60','dd-expenses':'60,000','dd-inflation':'6','dd-return':'8','dd-other-income':''};
                        Object.entries(_ddData).forEach(function([id, val]) {
                            var el = document.getElementById(id);
                            if (!el || val === null || val === undefined) return;
                            el.value = val;
                            if (val === (ddDefs[id] || '')) el.classList.add('text-slate-400');
                            else el.classList.remove('text-slate-400');
                        });
                        if (typeof drawdownCalc === 'function') drawdownCalc();
                    });
                }
            } catch(e) { console.warn('loadUserData drawdown:', e); }

            // PPF & NPS restore
            try {
                if (data.ppfnps) {
                    var _ppfData = data.ppfnps;
                    _applyWhenReady('ppf-annual', function() {
                        var ppfDefs = {'ppf-annual':'1,50,000','ppf-balance':'0','ppf-years-done':'0','ppf-rate':'7.1','ppf-extend':'0',
                                       'nps-monthly':'5,000','nps-age':'30','nps-balance':'0','nps-return':'10','nps-annuity-rate':'6','nps-slab':'20'};
                        Object.entries(_ppfData).forEach(function([id, val]) {
                            if (id === 'ppfnps-active-tab') return;
                            var el = document.getElementById(id);
                            if (!el || val === null || val === undefined || val === '') return;
                            el.value = val;
                            if (val === (ppfDefs[id] || '')) el.classList.add('text-slate-400');
                            else el.classList.remove('text-slate-400');
                        });
                        if (_ppfData['ppfnps-active-tab'] === 'nps') {
                            if (typeof ppfnpsTab === 'function') ppfnpsTab('nps');
                        }
                        if (typeof ppfCalc === 'function') ppfCalc();
                        if (typeof npsCalc === 'function') npsCalc();
                    });
                }
            } catch(e) { console.warn('loadUserData ppfnps:', e); }

            // CTC Optimizer restore
            try {
                if (data.ctcOptimizer) {
                    var _ctcData = data.ctcOptimizer;
                    _applyWhenReady('ctc-annual', function() {
                        var ctcDefs = {'ctc-annual':'12,00,000','ctc-basic':'40,000','ctc-hra':'20,000',
                                       'ctc-rent':'15,000','ctc-city':'metro','ctc-lta':'20,000',
                                       'ctc-food':'0','ctc-phone':'0','ctc-emp-nps':'0',
                                       'ctc-80c':'1,50,000','ctc-regime':'new'};
                        Object.entries(_ctcData).forEach(function([id, val]) {
                            var el = document.getElementById(id);
                            if (!el || val === null || val === undefined || val === '') return;
                            el.value = val;
                            if (val === (ctcDefs[id] || '')) el.classList.add('text-slate-400');
                            else el.classList.remove('text-slate-400');
                        });
                        if (typeof ctcCalc === 'function') ctcCalc();
                    });
                }
            } catch(e) { console.warn('loadUserData ctcOptimizer:', e); }

            // Insurance Adequacy restore
            try {
                if (data.insurance) {
                    var _insData = data.insurance;
                    _applyWhenReady('ins-income', function() {
                        var insDefs = {'ins-income':'12,00,000','ins-age':'30','ins-dependents':'2',
                                       'ins-loans':'0','ins-term-current':'0','ins-health-current':'0',
                                       'ins-monthly-exp':'50,000','ins-family':'2',
                                       'ins-assets':'0','ins-ci-current':'0','ins-disability-current':'0',
                                       'ins-parents-cover':'0','ins-parents-age1':'55','ins-parents-age2':'52'};
                        Object.entries(_insData).forEach(function([id, val]) {
                            var el = document.getElementById(id);
                            if (!el || val === null || val === undefined || val === '') return;
                            el.value = val;
                            if (val === (insDefs[id] || '')) el.classList.add('text-slate-400');
                            else el.classList.remove('text-slate-400');
                        });
                        if (typeof insureCalc === 'function') insureCalc();
                    });
                }
            } catch(e) { console.warn('loadUserData insurance:', e); }

            // Fixed Income restore
            try {
                if (data.fixedIncome) {
                    var _fiData = data.fixedIncome;
                    _applyWhenReady('fi-fd-principal', function() {
                        var fiDefs = {
                            'fi-fd-principal':'1,00,000','fi-fd-rate':'7.0','fi-fd-tenure':'12',
                            'fi-fd-type':'cumulative','fi-fd-regime':'new','fi-fd-slab':'30',
                            'fi-scss-principal':'10,00,000','fi-scss-regime':'new','fi-scss-slab':'30',
                            'fi-pomis-principal':'5,00,000','fi-pomis-regime':'new','fi-pomis-slab':'30',
                            'fi-nsc-principal':'1,00,000','fi-nsc-regime':'new','fi-nsc-slab':'30',
                            'fi-kvp-principal':'1,00,000',
                            'fi-cmp-principal':'1,50,000','fi-cmp-fd-rate':'7.0',
                            'fi-cmp-elss-return':'12.0','fi-cmp-regime':'new','fi-cmp-slab':'30'
                        };
                        Object.entries(_fiData).forEach(function([id, val]) {
                            var el = document.getElementById(id);
                            if (!el || val === null || val === undefined || val === '') return;
                            el.value = val;
                            if (val === (fiDefs[id] || '')) el.classList.add('text-slate-400');
                            else el.classList.remove('text-slate-400');
                        });
                        if (typeof initFixedIncome === 'function') initFixedIncome();
                    });
                }
            } catch(e) { console.warn('loadUserData fixedIncome:', e); }

            // Retirement Hub restore
            try {
                if (data.retirementHub) {
                    var _rhData = data.retirementHub;
                    _applyWhenReady('rh-age', function() {
                        var rhDefs2 = {
                            'rh-age':'30','rh-ret-age':'60','rh-life-exp':'90',
                            'rh-inflation':'6','rh-ret-return':'7','rh-expenses':'60,000',
                            'rh-epf-balance':'2,00,000','rh-epf-basic':'50,000',
                            'rh-ppf-balance':'0','rh-ppf-annual':'1,50,000','rh-ppf-years-done':'0',
                            'rh-nps-balance':'0','rh-nps-monthly':'5,000','rh-nps-return':'10','rh-nps-annuity':'6',
                            'rh-sip-monthly':'10,000','rh-sip-return':'12',
                            'rh-other-corpus':'0','rh-other-return':'7'
                        };
                        Object.entries(_rhData).forEach(function([id, val]) {
                            var el = document.getElementById(id);
                            if (!el || val === null || val === undefined || val === '') return;
                            el.value = val;
                            if (val === (rhDefs2[id] || '')) el.classList.add('text-slate-400');
                            else el.classList.remove('text-slate-400');
                        });
                        if (typeof retHubCalc === 'function') retHubCalc();
                    });
                }
            } catch(e) { console.warn('loadUserData retirementHub:', e); }

            // Gratuity restore
            try {
                if (data.gratuity) {
                    var _gratData = data.gratuity;
                    _applyWhenReady('grat-basic', function() {
                        var gratDefs = {'grat-basic':'50,000','grat-years':'7','grat-months':'0',
                                        'grat-type':'covered','grat-slab':'20'};
                        Object.entries(_gratData).forEach(function([id, val]) {
                            var el = document.getElementById(id);
                            if (!el || val === null || val === undefined || val === '') return;
                            el.value = val;
                            if (val === (gratDefs[id] || '')) el.classList.add('text-slate-400');
                            else el.classList.remove('text-slate-400');
                        });
                        if (typeof gratCalc === 'function') gratCalc();
                    });
                }
            } catch(e) { console.warn('loadUserData gratuity:', e); }

            // Debt Plan restore
            try {
                if (data.debtPlan) {
                    var _dpData = data.debtPlan;
                    _applyWhenReady('debt-extra', function() {
                        var extraEl = document.getElementById('debt-extra');
                        if (extraEl && _dpData['debt-extra']) {
                            extraEl.value = _dpData['debt-extra'];
                            extraEl.classList.remove('text-slate-400');
                        }
                        if (_dpData['debt-loans']) {
                            try {
                                var savedLoans = JSON.parse(_dpData['debt-loans']);
                                if (Array.isArray(savedLoans) && savedLoans.length > 0) {
                                    var container = document.getElementById('debt-loans-container');
                                    if (container) {
                                        container.innerHTML = '';
                                        window._debtLoans = [];
                                        savedLoans.forEach(function(l) { debtAddLoan(l.name, l.balance, l.rate, l.emi); });
                                    }
                                }
                            } catch(e2) {}
                        }
                        if (typeof debtCalc === 'function') debtCalc();
                    });
                }
            } catch(e) { console.warn('loadUserData debtPlan:', e); }

            // Joint Family Planner restore
            try {
                if (data.jointPlan) {
                    var _jpData = data.jointPlan;
                    _applyWhenReady('jp-p1-name', function() {
                        var jpDefs = {
                            'jp-p1-income':'1,20,000','jp-p1-invest':'25,000','jp-p1-portfolio':'5,00,000','jp-p1-80c':'1,50,000',
                            'jp-p2-income':'90,000','jp-p2-invest':'18,000','jp-p2-portfolio':'2,50,000','jp-p2-80c':'1,50,000',
                            'jp-edu-cost':'20,00,000','jp-edu-years':'15','jp-home-cost':'60,00,000','jp-home-years':'5',
                            'jp-retire-age':'35','jp-retire-monthly':'1,00,000','jp-return':'12'
                        };
                        Object.entries(_jpData).forEach(function([id, val]) {
                            var el = document.getElementById(id);
                            if (!el || val === null || val === undefined || val === '') return;
                            if (el.type === 'checkbox') {
                                el.checked = val === '1';
                            } else if (el.tagName === 'SELECT') {
                                el.value = val;
                            } else {
                                el.value = val;
                                if (val === (jpDefs[id] || '')) el.classList.add('text-slate-400');
                                else el.classList.remove('text-slate-400');
                            }
                        });
                        if (typeof initJointPlan === 'function') initJointPlan();
                    });
                }
            } catch(e) { console.warn('loadUserData jointPlan:', e); }

            // CIBIL Score Tracker restore
            try {
                if (data.cibil) {
                    var _cibilData = data.cibil;
                    _applyWhenReady('cibil-score', function() {
                        var cibilDefs = {'cibil-score':'720','cibil-util':'35','cibil-missed':'0','cibil-age':'4',
                                         'cibil-cards':'2','cibil-enquiries':'1','cibil-loan-amt':'50,00,000','cibil-loan-tenure':'20'};
                        Object.entries(_cibilData).forEach(function([id, val]) {
                            var el = document.getElementById(id);
                            if (!el || val === null || val === undefined || val === '') return;
                            el.value = val;
                            if (val === (cibilDefs[id] || '')) el.classList.add('text-slate-400');
                            else el.classList.remove('text-slate-400');
                        });
                        if (typeof cibilCalc === 'function') cibilCalc();
                    });
                }
            } catch(e) { console.warn('loadUserData cibil:', e); }

            // Financial Calendar restore
            try {
                if (data.fincal) {
                    var _fcData = data.fincal;
                    _applyWhenReady('fc-income', function() {
                        var fcDefs = {'fc-income':'12,00,000','fc-cc-date':'5'};
                        Object.entries(_fcData).forEach(function([id, val]) {
                            var el = document.getElementById(id);
                            if (!el || val === null || val === undefined || val === '') return;
                            if (el.tagName === 'SELECT') el.value = val;
                            else {
                                el.value = val;
                                if (val === (fcDefs[id] || '')) el.classList.add('text-slate-400');
                                else el.classList.remove('text-slate-400');
                            }
                        });
                        if (typeof finCalRender === 'function') finCalRender();
                    });
                }
            } catch(e) { console.warn('loadUserData fincal:', e); }

            // Self-Employed & Business Planner restore
            if (data.selfEmpl) {
                var _seData = data.selfEmpl;
                _applyWhenReady('se-turnover', function() {
                    try {
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
                        Object.entries(_seData).forEach(function(entry) {
                            var id = entry[0], val = entry[1];
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
                    } catch(e) { console.warn('loadUserData selfEmpl:', e); }
                });
            }

            // Gold Comparator restore
            if (data.goldComp) {
                var _gcData = data.goldComp;
                _applyWhenReady('gc-amount', function() {
                    try {
                        var gcDefs = {'gc-amount':'1,00,000','gc-years':'5','gc-return':'10','gc-making':'12','gc-locker':'2,000'};
                        Object.entries(_gcData).forEach(function(entry) {
                            var id = entry[0], val = entry[1];
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
                    } catch(e) { console.warn('loadUserData goldComp:', e); }
                });
            }

            // ULIP / Policy Analyzer restore
            if (data.ulipCheck) {
                var _ucData = data.ulipCheck;
                _applyWhenReady('uc-premium', function() {
                    try {
                        var ucDefs = {'uc-premium':'50,000','uc-term':'21','uc-paid':'5',
                                      'uc-maturity':'15,00,000','uc-sv':'1,50,000',
                                      'uc-cover':'10,00,000','uc-age':'35','uc-inv-return':'12'};
                        Object.entries(_ucData).forEach(function(entry) {
                            var id = entry[0], val = entry[1];
                            var el = document.getElementById(id);
                            if (!el || val === null || val === undefined || val === '') return;
                            el.value = val;
                            if (el.tagName === 'SELECT') return;
                            if (val === (ucDefs[id] || '')) el.classList.add('text-slate-400');
                            else el.classList.remove('text-slate-400');
                        });
                        if (typeof ucCalc === 'function') ucCalc();
                    } catch(e) { console.warn('loadUserData ulipCheck:', e); }
                });
            }

            // Net Worth Tracker restore
            if (data.netWorth || (data.nwHistory && Array.isArray(data.nwHistory))) {
                var _nwData = data.netWorth;
                var _nwHistData = data.nwHistory;
                _applyWhenReady('nw-savings', function() {
                    try {
                        if (_nwData) {
                            Object.entries(_nwData).forEach(function(entry) {
                                var id = entry[0], val = entry[1];
                                var el = document.getElementById(id);
                                if (!el || val === null || val === undefined || val === '') return;
                                el.value = val;
                                if (val === '0' || val === '') { el.classList.add('text-slate-400'); }
                                else { el.classList.remove('text-slate-400'); }
                            });
                            if (typeof nwCalc === 'function') nwCalc();
                        }
                        if (_nwHistData && Array.isArray(_nwHistData)) {
                            _nwHistory = _nwHistData;
                            if (typeof nwRenderTrend === 'function') nwRenderTrend();
                        }
                    } catch(e) { console.warn('loadUserData netWorth:', e); }
                });
            }

            // Capital Gains Calculator restore
            if (data.cgCalc) {
                var _cgData = data.cgCalc;
                _applyWhenReady('cg-cost', function() {
                    try {
                        var cgDefs = {'cg-cost':'1,00,000','cg-sale':'1,50,000','cg-ltcg-used':'0','cg-income':'12,00,000'};
                        Object.entries(_cgData).forEach(function(entry) {
                            var id = entry[0], val = entry[1];
                            var el = document.getElementById(id);
                            if (!el || val === null || val === undefined || val === '') return;
                            el.value = val;
                            if (el.tagName === 'SELECT') return;
                            if (val === (cgDefs[id] || '')) el.classList.add('text-slate-400');
                            else el.classList.remove('text-slate-400');
                        });
                        if (typeof cgSetRegime === 'function') cgSetRegime(_cgData['cg-regime'] || 'new');
                        if (typeof cgCalc === 'function') cgCalc();
                    } catch(e) { console.warn('loadUserData cgCalc:', e); }
                });
            }

            // HRA Calculator restore
            if (data.hraCalc) {
                var _hraData = data.hraCalc;
                _applyWhenReady('hra-basic', function() {
                    try {
                        var hraDefs = {'hra-basic':'50,000','hra-received':'20,000','hra-rent':'15,000'};
                        ['hra-basic','hra-received','hra-rent'].forEach(function(id) {
                            var val = _hraData[id];
                            var el  = document.getElementById(id);
                            if (!el || val === null || val === undefined || val === '') return;
                            el.value = val;
                            if (val === (hraDefs[id] || '')) el.classList.add('text-slate-400');
                            else el.classList.remove('text-slate-400');
                        });
                        var hraCityEl   = document.getElementById('hra-city');
                        var hraRegimeEl = document.getElementById('hra-regime');
                        var hraSlabEl   = document.getElementById('hra-slab');
                        if (hraCityEl   && _hraData['hra-city'])   hraCityEl.value   = _hraData['hra-city'];
                        if (hraRegimeEl && _hraData['hra-regime']) hraRegimeEl.value = _hraData['hra-regime'];
                        if (hraSlabEl   && _hraData['hra-slab'])   hraSlabEl.value   = _hraData['hra-slab'];
                        if (typeof hraCalc === 'function') hraCalc();
                    } catch(e) { console.warn('loadUserData hraCalc:', e); }
                });
            }

            // Nomination Tracker restore
            if (data.nomTrack) {
                var _ntData = data.nomTrack;
                _applyWhenReady('nt-bank-status', function() {
                    try {
                        Object.entries(_ntData).forEach(function(entry) {
                            var id = entry[0], val = entry[1];
                            var el = document.getElementById(id);
                            if (!el || val === null || val === undefined) return;
                            el.value = val; // works for select, input[text], input[date], textarea
                        });
                        // Restore beneficiary rows (class-based, no IDs)
                        ['name','rel','share','cont'].forEach(function(field) {
                            document.querySelectorAll('.wg-bene-' + field).forEach(function(el, i) {
                                var val = _ntData['wg-bene-' + field + '-' + i];
                                if (val !== undefined && val !== null) el.value = val;
                            });
                        });
                        if (typeof nomRender === 'function') nomRender();
                    } catch(e) { console.warn('loadUserData nomTrack:', e); }
                });
            }

            // Budget & Expense Tracker restore
            if (data.budgetTracker) {
                var _btRestore = data.budgetTracker;
                if (_btRestore.month)     window._btMonth     = _btRestore.month;
                if (_btRestore.chartType) window._btChartType = _btRestore.chartType;
                if (_btRestore.data) {
                    try { window._btData = JSON.parse(_btRestore.data); } catch(e2) {}
                }
                if (_btRestore.customCats) {
                    try { window._btCustomCats = JSON.parse(_btRestore.customCats); } catch(e2) {}
                }
                if (_btRestore.lastUpdated) window._btLastUpdated = _btRestore.lastUpdated;
                if (typeof _dashUpdateBudgetWidget === 'function') _dashUpdateBudgetWidget();
                _applyWhenReady('bt-month-disp', function() {
                    try {
                        if (typeof initBudgetTracker === 'function') initBudgetTracker();
                    } catch(e) { console.warn('loadUserData budgetTracker:', e); }
                });
            }

            // Roadmap state restore
            if (data.roadmap) {
                window._rmState = Object.assign({ profile: null, visited: [], dismissed: false, collapsed: false }, data.roadmap);
                if (typeof initRoadmap === 'function') initRoadmap();
            }

            // Your Financial Path — restore saved active path + archive
            if (data.finPath) {
                window._pathState = {
                    active:  data.finPath.active  || null,
                    archive: data.finPath.archive || []
                };
                _applyWhenReady('path-content', function() {
                    try { if (typeof pathRender === 'function') pathRender(); }
                    catch(e) { console.warn('loadUserData finPath:', e); }
                });
            }

            // Health Score snapshot — pre-populate _hsLastResult so dashboard widget renders
            // immediately when Firestore data arrives, before the health score panel is opened.
            // Falls back to computing from raw inputs so it works even on first load after deploy.
            if (!window._hsLastResult) {
                var _snap = null;
                if (data.hsLastScore && data.hsLastScore.score) {
                    _snap = {
                        score:      data.hsLastScore.score,
                        grade:      data.hsLastScore.grade      || '',
                        emoji:      data.hsLastScore.emoji      || '📊',
                        arcColor:   data.hsLastScore.arcColor   || '#10b981',
                        topActions: data.hsLastScore.topActions || [],
                        ts:         data.hsLastScore.ts
                    };
                } else if (data.healthScore) {
                    _snap = _hsQuickScore(data.healthScore);
                }
                if (_snap) {
                    if (data.hsLastScore) window._hsPrevScore = { score: data.hsLastScore.score, ts: data.hsLastScore.ts };
                    window._hsLastResult = _snap;
                    if (typeof _dashUpdateScoreWidget === 'function') _dashUpdateScoreWidget();
                }
            }

            // My Mutual Funds restore
            if (Array.isArray(data.myMFs)) {
                window._myMFs = data.myMFs;
                if (typeof _myMFsRefreshBookmarks === 'function') _myMFsRefreshBookmarks();
            }

            } finally {
                _restoring = false;
            }
    }

    // ============================================================
    //  END PER-USER PERSISTENT STORAGE
    // ============================================================
