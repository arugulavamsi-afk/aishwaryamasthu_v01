    /* ═══════════════════════════════════════════════
       USER PROFILE — save, load, autofill
    ═══════════════════════════════════════════════ */
    window._userProfile = {};

    function upFmt(el) {
        var raw = el.value.replace(/[^0-9]/g, '');
        if (!raw) { el.value = ''; return; }
        el.value = parseInt(raw, 10).toLocaleString('en-IN');
    }

    function upNum(id) {
        return parseFloat((document.getElementById(id)?.value || '').replace(/,/g, '')) || 0;
    }

    function upRenderProfileGoals() {
        var section = document.getElementById('up-goals-section');
        var list    = document.getElementById('up-goals-list');
        var countEl = document.getElementById('up-goals-count');
        if (!section || !list) return;
        var goals = (window._userProfile && window._userProfile.profileGoals) || [];
        if (goals.length === 0) { section.classList.add('hidden'); return; }
        section.classList.remove('hidden');
        if (countEl) countEl.textContent = goals.length + ' goal' + (goals.length !== 1 ? 's' : '');
        var now = Date.now();
        list.innerHTML = goals.map(function(g, i) {
            var days  = g.addedAt ? Math.floor((now - new Date(g.addedAt).getTime()) / 86400000) : 0;
            var daysLabel = days === 0 ? 'Added today' : days === 1 ? '1 day ago' : days + ' days ago';
            var amt   = g.targetAmt > 0 ? '₹' + Number(g.targetAmt).toLocaleString('en-IN') : '';
            var srcLabel = g.source === 'fin_plan' ? 'Financial Plan' : 'Goal Planner';
            return '<div class="flex items-start gap-2 rounded-xl px-3 py-2" style="background:rgba(245,200,66,0.08);border:1px solid rgba(245,200,66,0.28);">' +
                '<span class="text-sm leading-none flex-shrink-0 mt-0.5">' + (g.emoji || '🎯') + '</span>' +
                '<div class="flex-1 min-w-0">' +
                    '<div class="text-[11px] font-bold truncate" style="color:#1e293b;">' + g.label + '</div>' +
                    '<div class="text-[9px] text-slate-500 leading-snug">' +
                        (amt ? amt + ' &middot; ' : '') + g.years + ' yr' + (g.years !== 1 ? 's' : '') +
                        ' &middot; <span style="color:#b45309;">' + srcLabel + '</span>' +
                    '</div>' +
                    '<div class="text-[9px] font-semibold mt-0.5" style="color:#92400e;">📅 ' + daysLabel + '</div>' +
                '</div>' +
                '<button onclick="upRemoveProfileGoal(' + i + ')" class="text-[10px] text-slate-300 hover:text-red-400 flex-shrink-0 transition-colors leading-none mt-0.5" title="Remove goal">✕</button>' +
            '</div>';
        }).join('');
    }

    function upRemoveProfileGoal(idx) {
        var p     = window._userProfile || {};
        var goals = (p.profileGoals || []).slice();
        goals.splice(idx, 1);
        p.profileGoals = goals;
        window._userProfile = p;
        upRenderProfileGoals();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function upSave() {
        var existing = window._userProfile || {};
        var p = {
            name:         document.getElementById('up-name')?.value.trim()  || '',
            age:          document.getElementById('up-age')?.value           || '',
            occupation:   document.getElementById('up-occupation')?.value    || '',
            income:       document.getElementById('up-income')?.value        || '',
            expenses:     document.getElementById('up-expenses')?.value      || '',
            regime:       document.getElementById('up-regime')?.value        || 'new',
            city:         document.getElementById('up-city')?.value          || 'metro',
            profileGoals: existing.profileGoals || []
        };
        window._userProfile = p;
        upUpdateSummary();
        upRefreshBanners();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function upLoad(p) {
        if (!p) return;
        window._userProfile = p;
        ['name','age','occupation','income','expenses','regime','city'].forEach(function(k) {
            var el = document.getElementById('up-' + k);
            if (el && p[k] !== undefined) el.value = p[k];
        });
        upUpdateSummary();
        upRefreshBanners();
        upRefreshRiskDisplay();
        upRenderProfileGoals();
    }

    function upToggle() {
        var body    = document.getElementById('up-body');
        var chevron = document.getElementById('up-chevron');
        if (!body) return;
        var open = !body.classList.contains('hidden');
        body.classList.toggle('hidden', open);
        if (chevron) chevron.style.transform = open ? '' : 'rotate(180deg)';
    }

    function upUpdateSummary() {
        var el  = document.getElementById('up-summary');
        if (!el) return;
        var p   = window._userProfile;
        var parts = [];
        if (p.name)       parts.push(p.name.split(' ')[0]);
        if (p.age)        parts.push(p.age + 'y');
        if (p.occupation) parts.push({ salaried:_t('up.occ.s'), 'self-employed':_t('up.occ.se'), business:_t('up.occ.b'), retired:_t('up.occ.r'), student:_t('up.occ.st') }[p.occupation] || p.occupation);
        if (p.income)     parts.push('₹' + p.income + '/mo');
        el.textContent = parts.length ? parts.join(' · ') : 'Set your details once — auto-fill any tool instantly';
    }

    function upRefreshBanners() {
        var p = window._userProfile;
        var hasProfile = p.income || p.age || p.name;
        ['taxguide', 'finplan', 'drawdown'].forEach(function(tool) {
            var banner = document.getElementById('up-banner-' + tool);
            if (banner) banner.classList.toggle('hidden', !hasProfile);
        });
    }

    // ── Risk profile display helpers ──────────────────────────────────────────
    function _upRiskLabel(key) {
        var map = { conservative:'risk.conservative', moderate:'risk.moderate', moderateAggressive:'risk.modagg', aggressive:'risk.aggressive' };
        return _t(map[key] || 'risk.moderate');
    }

    function upRefreshRiskDisplay() {
        var cache = window._fpRiskCache;
        var displayEl = document.getElementById('up-risk-display');
        var badgeEl   = document.getElementById('up-risk-badge');
        if (!cache) {
            if (displayEl) displayEl.textContent = _t('up.risk.unset');
            if (badgeEl)   badgeEl.classList.add('hidden');
            return;
        }
        var age        = parseInt(document.getElementById('up-age')?.value || '30', 10);
        var profileKey = typeof window.fpGetRiskProfile === 'function'
            ? window.fpGetRiskProfile(cache.score, age)
            : (cache.score <= 4 ? 'conservative' : cache.score <= 8 ? 'moderate' : cache.score <= 11 ? 'moderateAggressive' : 'aggressive');
        var label = _upRiskLabel(profileKey);
        if (displayEl) displayEl.textContent = label + ' · Score ' + cache.score + '/15';
        if (badgeEl)   { badgeEl.textContent = label; badgeEl.classList.remove('hidden'); }
    }

    // ── Risk Questionnaire ────────────────────────────────────────────────────
    var _upRiskAnswers = {};
    var _upRiskQs = [
        { id:'q1', icon:'📉', tk:'rq.q1' },
        { id:'q2', icon:'💼', tk:'rq.q2' },
        { id:'q3', icon:'🧠', tk:'rq.q3' },
        { id:'q4', icon:'⏳', tk:'rq.q4' },
        { id:'q5', icon:'📊', tk:'rq.q5' }
    ];

    function upShowRiskQuiz() {
        var quiz = document.getElementById('up-risk-quiz');
        if (!quiz) return;
        var wasHidden = quiz.classList.contains('hidden');
        quiz.classList.toggle('hidden');
        if (wasHidden) {
            _upRiskAnswers = {};
            // Pre-populate from saved answers if they exist
            var cache = window._fpRiskCache;
            if (cache && cache.answers) {
                _upRiskQs.forEach(function(q) {
                    if (cache.answers[q.id] !== undefined) _upRiskAnswers[q.id] = cache.answers[q.id];
                });
            }
            upRiskRender();
        }
    }

    function upRiskRender() {
        var inner = document.getElementById('up-risk-quiz-inner');
        if (!inner) return;
        var answered = Object.keys(_upRiskAnswers).length;
        var total    = _upRiskQs.length;
        var pct      = Math.round(answered / total * 100);

        var html = '<div class="p-4">';
        // Header + progress
        html += '<div class="flex items-center justify-between mb-2">';
        html += '<span class="text-[11px] font-bold" style="color:#7c5c0a;">' + _t('quiz.title') + ' — ' + answered + '/' + total + '</span>';
        html += '<button onclick="document.getElementById(\'up-risk-quiz\').classList.add(\'hidden\')" class="text-[10px] px-2 py-0.5 rounded-lg" style="background:rgba(0,0,0,0.06);color:#666;">' + _t('quiz.close') + '</button>';
        html += '</div>';
        html += '<div class="h-1.5 rounded-full mb-4" style="background:rgba(245,200,66,0.20);">';
        html += '<div class="h-1.5 rounded-full transition-all" style="width:' + pct + '%;background:linear-gradient(90deg,#f5c842,#e8a44a);"></div>';
        html += '</div>';

        _upRiskQs.forEach(function(q) {
            html += '<div class="mb-3.5">';
            html += '<div class="text-[11px] font-bold mb-1.5" style="color:#162a10;">' + q.icon + ' ' + _t(q.tk + '.t') + '</div>';
            html += '<div class="flex flex-wrap gap-1.5">';
            [0,1,2,3].forEach(function(oi) {
                var sel = _upRiskAnswers[q.id] === oi;
                var selStyle = sel
                    ? 'background:linear-gradient(130deg,#f5c842,#e8a44a);color:#162a10;border-color:rgba(245,200,66,0.8);font-weight:700;'
                    : 'background:rgba(255,255,255,0.85);color:#4a3a0a;border-color:rgba(245,200,66,0.30);';
                html += '<button onclick="upRiskAnswer(\'' + q.id + '\',' + oi + ')" class="text-[10px] px-2.5 py-1.5 rounded-xl border transition-all" style="' + selStyle + '">' + _t(q.tk + '.' + oi) + '</button>';
            });
            html += '</div></div>';
        });

        var allAnswered = answered === total;
        var btnStyle = allAnswered
            ? 'background:linear-gradient(130deg,#f5c842,#e8a44a);color:#162a10;cursor:pointer;'
            : 'background:rgba(245,200,66,0.20);color:#9a8060;cursor:default;';
        html += '<button onclick="upRiskSubmit()" class="mt-2 w-full py-2 rounded-xl text-[12px] font-bold transition-all" style="' + btnStyle + '"' + (allAnswered ? '' : ' disabled') + '>';
        html += allAnswered ? _t('quiz.submit') : _t('quiz.title') + ' — ' + answered + '/' + total;
        html += '</button></div>';

        inner.innerHTML = html;
    }

    function upRiskAnswer(qid, pts) {
        _upRiskAnswers[qid] = pts;
        upRiskRender();
    }

    function upRiskSubmit() {
        if (Object.keys(_upRiskAnswers).length < _upRiskQs.length) return;
        var score = _upRiskQs.reduce(function(s, q) { return s + (_upRiskAnswers[q.id] || 0); }, 0);
        // Build answers object in fpSaveRiskScore format
        var answers = {};
        _upRiskQs.forEach(function(q) {
            answers[q.id]          = _upRiskAnswers[q.id];
            answers[q.id + '_pts'] = _upRiskAnswers[q.id];
        });
        // Save via global exposed by app.js (falls back inline if FP not loaded yet)
        if (typeof window.fpSaveRiskScore === 'function') {
            window.fpSaveRiskScore(answers, score);
        } else {
            var data = { answers: answers, score: score, savedAt: new Date().toISOString() };
            window._fpRiskCache = data;
            var user = window._fbAuth && window._fbAuth.currentUser;
            if (user && window._fbDb) {
                window._fbDb.collection('users').doc(user.uid)
                    .set({ riskProfile: data }, { merge: true })
                    .catch(function(e){ console.warn('upRiskSubmit save:', e); });
            }
        }
        upRefreshRiskDisplay();

        // Show result inside the quiz box, then auto-close after 3s
        var age        = parseInt(document.getElementById('up-age')?.value || '30', 10);
        var profileKey = typeof window.fpGetRiskProfile === 'function'
            ? window.fpGetRiskProfile(score, age)
            : (score <= 4 ? 'conservative' : score <= 8 ? 'moderate' : score <= 11 ? 'moderateAggressive' : 'aggressive');
        var label      = _upRiskLabels[profileKey] || '⚖️ Moderate';
        var inner = document.getElementById('up-risk-quiz-inner');
        if (inner) {
            inner.innerHTML = '<div class="p-5 text-center">'
                + '<div class="text-3xl mb-2">🎉</div>'
                + '<div class="text-[14px] font-black mb-1" style="color:#162a10;">' + label + '</div>'
                + '<div class="text-[10px] mb-4" style="color:rgba(22,42,16,0.60);">' + _t('quiz.title') + ' · ' + score + '/15</div>'
                + '<button onclick="document.getElementById(\'up-risk-quiz\').classList.add(\'hidden\')" class="text-[12px] px-5 py-2 rounded-xl font-bold" style="background:linear-gradient(130deg,#f5c842,#e8a44a);color:#162a10;">' + _t('quiz.close.btn') + '</button>'
                + '</div>';
        }
        setTimeout(function() {
            var quiz = document.getElementById('up-risk-quiz');
            if (quiz) quiz.classList.add('hidden');
        }, 4000);
    }

    function upApply(tool) {
        var p   = window._userProfile;
        var inc = upNum('up-income');    // monthly income
        var exp = upNum('up-expenses');  // monthly expenses
        var age = parseInt(p.age, 10) || 0;

        if (tool === 'taxguide') {
            // Annual gross = monthly × 12
            if (inc > 0) {
                var annualInc = (inc * 12).toLocaleString('en-IN');
                var el = document.getElementById('tg-income');
                if (el) { el.value = annualInc; el.classList.remove('text-slate-400'); }
            }
            // Tax regime
            var regEl = document.getElementById('tg-regime');
            if (regEl && p.regime) {
                for (var i = 0; i < regEl.options.length; i++) {
                    if (regEl.options[i].value === p.regime || regEl.options[i].text.toLowerCase().includes(p.regime)) {
                        regEl.selectedIndex = i; break;
                    }
                }
            }
            if (typeof tgCalc === 'function') tgCalc();
        }

        if (tool === 'finplan') {
            if (p.name) {
                var fnEl = document.getElementById('fp-name');
                if (fnEl) fnEl.value = p.name;
            }
            if (age > 0) {
                var faEl = document.getElementById('fp-age');
                if (faEl) faEl.value = age;
            }
            if (inc > 0) {
                var fiEl = document.getElementById('fp-income');
                if (fiEl) { fiEl.value = inc.toLocaleString('en-IN'); if (typeof fpFormatMoney === 'function') fpFormatMoney(fiEl, 'fp-income-words'); }
            }
            if (inc > 0 && exp > 0 && inc > exp) {
                var surplus = inc - exp;
                var fsEl = document.getElementById('fp-invest-amt');
                if (fsEl) { fsEl.value = surplus.toLocaleString('en-IN'); if (typeof fpFormatMoney === 'function') fpFormatMoney(fsEl, 'fp-invest-words'); }
            }
            if (typeof fpLiveUpdate === 'function') fpLiveUpdate();
        }

        if (tool === 'drawdown') {
            if (age > 0) {
                var daEl = document.getElementById('dd-current-age');
                if (daEl) { daEl.value = age; daEl.classList.remove('text-slate-400'); }
            }
            if (exp > 0) {
                var deEl = document.getElementById('dd-expenses');
                if (deEl) { deEl.value = exp.toLocaleString('en-IN'); deEl.classList.remove('text-slate-400'); }
            }
            if (typeof drawdownCalc === 'function') drawdownCalc();
        }

        // Flash the banner button to confirm
        var btn = document.querySelector('#up-banner-' + tool + ' .up-apply-btn');
        if (btn) {
            var orig = btn.textContent;
            btn.textContent = _t('up.applied');
            btn.style.background = '#059669';
            setTimeout(function() { btn.textContent = orig; btn.style.background = ''; }, 1500);
        }
    }
