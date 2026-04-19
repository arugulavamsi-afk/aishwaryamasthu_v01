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
            name:           document.getElementById('up-name')?.value.trim()      || '',
            age:            document.getElementById('up-age')?.value              || '',
            occupation:     document.getElementById('up-occupation')?.value       || '',
            dependents:     document.getElementById('up-dependents')?.value       || '',
            income:         document.getElementById('up-income')?.value           || '',
            annualIncome:   document.getElementById('up-annual-income')?.value    || '',
            expenses:       document.getElementById('up-expenses')?.value         || '',
            regime:         document.getElementById('up-regime')?.value           || 'new',
            taxSlab:        document.getElementById('up-tax-slab')?.value         || '',
            city:           document.getElementById('up-city')?.value             || 'metro',
            basicSalary:    document.getElementById('up-basic-salary')?.value     || '',
            retireAge:      document.getElementById('up-retire-age')?.value       || '',
            epfBalance:     document.getElementById('up-epf-balance')?.value      || '',
            // Assets
            assetsBank:     document.getElementById('up-assets-bank')?.value      || '0',
            assetsMf:       document.getElementById('up-assets-mf')?.value        || '0',
            assetsStocks:   document.getElementById('up-assets-stocks')?.value    || '0',
            assetsRe:       document.getElementById('up-assets-re')?.value        || '0',
            assetsPpf:      document.getElementById('up-assets-ppf')?.value       || '0',
            assetsGold:     document.getElementById('up-assets-gold')?.value      || '0',
            assetsOther:    document.getElementById('up-assets-other')?.value     || '0',
            // Liabilities
            liabHome:       document.getElementById('up-liab-home')?.value        || '0',
            liabCar:        document.getElementById('up-liab-car')?.value         || '0',
            liabPersonal:   document.getElementById('up-liab-personal')?.value    || '0',
            liabCc:         document.getElementById('up-liab-cc')?.value          || '0',
            liabOther:      document.getElementById('up-liab-other')?.value       || '0',
            // Health Insurance
            healthInsurer:  document.getElementById('up-health-insurer')?.value   || '',
            healthCoverage: document.getElementById('up-health-coverage')?.value  || '0',
            healthPremium:  document.getElementById('up-health-premium')?.value   || '0',
            healthType:     document.getElementById('up-health-type')?.value      || 'individual',
            healthPolicyNo: document.getElementById('up-health-policyno')?.value  || '',
            // Term Insurance
            termInsurer:    document.getElementById('up-term-insurer')?.value     || '',
            termAssured:    document.getElementById('up-term-assured')?.value     || '0',
            termPremium:    document.getElementById('up-term-premium')?.value     || '0',
            termNominee:    document.getElementById('up-term-nominee')?.value     || '',
            termNomineeRel: document.getElementById('up-term-nominee-rel')?.value || '',
            termPolicyNo:   document.getElementById('up-term-policyno')?.value    || '',
            profileGoals:   existing.profileGoals || []
        };
        window._userProfile = p;
        upUpdateSummary();
        upRefreshBanners();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function upLoad(p) {
        if (!p) return;
        window._userProfile = p;
        // Basic fields
        ['name','age','occupation','dependents','expenses','regime','city'].forEach(function(k) {
            var el = document.getElementById('up-' + k);
            if (el && p[k] !== undefined) el.value = p[k];
        });
        // Rebuild slab options for the restored regime, then select saved value
        upRegimeChange();
        var slabEl = document.getElementById('up-tax-slab');
        if (slabEl && p.taxSlab !== undefined) slabEl.value = p.taxSlab;
        // Monthly Basic Salary
        var bsEl = document.getElementById('up-basic-salary');
        if (bsEl && p.basicSalary) { bsEl.value = p.basicSalary; bsEl.classList.remove('text-slate-400'); }
        // Retirement Age
        var raEl = document.getElementById('up-retire-age');
        if (raEl && p.retireAge) raEl.value = p.retireAge;
        // EPF Balance
        var epfEl = document.getElementById('up-epf-balance');
        if (epfEl) {
            var epfVal = p.epfBalance || '0';
            epfEl.value = epfVal;
            if (epfVal === '0' || !epfVal) epfEl.classList.add('text-slate-400'); else epfEl.classList.remove('text-slate-400');
        }
        // Income (text field — strip commas not needed, value already formatted)
        var incEl = document.getElementById('up-income');
        if (incEl && p.income) incEl.value = p.income;

        // Annual Income
        var annEl = document.getElementById('up-annual-income');
        if (annEl) {
            if (p.annualIncome && p.annualIncome !== '0') {
                annEl.value = p.annualIncome;
                annEl.classList.remove('text-slate-400');
            } else {
                annEl.value = '0';
                annEl.classList.add('text-slate-400');
            }
        }

        // Assets
        var assetMap = { assetsBank:'up-assets-bank', assetsMf:'up-assets-mf', assetsStocks:'up-assets-stocks',
                         assetsRe:'up-assets-re', assetsPpf:'up-assets-ppf', assetsGold:'up-assets-gold', assetsOther:'up-assets-other' };
        Object.keys(assetMap).forEach(function(k) {
            var el = document.getElementById(assetMap[k]);
            if (!el) return;
            var val = p[k] || '0';
            el.value = val;
            if (val === '0' || !val) el.classList.add('text-slate-400'); else el.classList.remove('text-slate-400');
        });

        // Liabilities
        var liabMap = { liabHome:'up-liab-home', liabCar:'up-liab-car', liabPersonal:'up-liab-personal',
                        liabCc:'up-liab-cc', liabOther:'up-liab-other' };
        Object.keys(liabMap).forEach(function(k) {
            var el = document.getElementById(liabMap[k]);
            if (!el) return;
            var val = p[k] || '0';
            el.value = val;
            if (val === '0' || !val) el.classList.add('text-slate-400'); else el.classList.remove('text-slate-400');
        });

        // Health Insurance
        var healthTextMap = { healthInsurer:'up-health-insurer', healthPolicyNo:'up-health-policyno' };
        Object.keys(healthTextMap).forEach(function(k) {
            var el = document.getElementById(healthTextMap[k]);
            if (el && p[k]) el.value = p[k];
        });
        var healthMoneyMap = { healthCoverage:'up-health-coverage', healthPremium:'up-health-premium' };
        Object.keys(healthMoneyMap).forEach(function(k) {
            var el = document.getElementById(healthMoneyMap[k]);
            if (!el) return;
            var val = p[k] || '0';
            el.value = val;
            if (val === '0' || !val) el.classList.add('text-slate-400'); else el.classList.remove('text-slate-400');
        });
        var htEl = document.getElementById('up-health-type');
        if (htEl && p.healthType) htEl.value = p.healthType;

        // Term Insurance
        var termTextMap = { termInsurer:'up-term-insurer', termNominee:'up-term-nominee', termPolicyNo:'up-term-policyno' };
        Object.keys(termTextMap).forEach(function(k) {
            var el = document.getElementById(termTextMap[k]);
            if (el && p[k]) el.value = p[k];
        });
        var termMoneyMap = { termAssured:'up-term-assured', termPremium:'up-term-premium' };
        Object.keys(termMoneyMap).forEach(function(k) {
            var el = document.getElementById(termMoneyMap[k]);
            if (!el) return;
            var val = p[k] || '0';
            el.value = val;
            if (val === '0' || !val) el.classList.add('text-slate-400'); else el.classList.remove('text-slate-400');
        });
        var tnrEl = document.getElementById('up-term-nominee-rel');
        if (tnrEl && p.termNomineeRel) tnrEl.value = p.termNomineeRel;

        upCalcTotals();
        upUpdateSummary();
        upRefreshBanners();
        upRefreshRiskDisplay();
        upRenderProfileGoals();
    }

    function upToggle() {
        // Old accordion card removed — tile now navigates to myprofile page
        if (typeof switchMode === 'function') switchMode('myprofile');
    }

    function upRegimeChange() {
        var regEl  = document.getElementById('up-regime');
        var slabEl = document.getElementById('up-tax-slab');
        if (!regEl || !slabEl) return;
        if (typeof _mkSlabOpts === 'function') {
            slabEl.innerHTML = _mkSlabOpts(regEl.value, slabEl.value);
        }
    }

    function upAutoFillAnnual() {
        var monthly = parseFloat((document.getElementById('up-income')?.value || '').replace(/,/g,'')) || 0;
        var annualEl = document.getElementById('up-annual-income');
        if (!annualEl) return;
        var isBlank = annualEl.classList.contains('text-slate-400') || annualEl.value === '0' || !annualEl.value;
        if (isBlank && monthly > 0) {
            annualEl.value = (monthly * 12).toLocaleString('en-IN');
            annualEl.classList.remove('text-slate-400');
        }
        var hintEl = document.getElementById('up-annual-hint');
        if (hintEl && monthly > 0) hintEl.textContent = '≈ ₹' + (monthly * 12).toLocaleString('en-IN') + ' / yr';
        else if (hintEl) hintEl.textContent = '';
    }

    function upCalcTotals() {
        function _v(id) { return parseFloat((document.getElementById(id)?.value || '0').replace(/,/g,'')) || 0; }
        var totalAssets = _v('up-assets-bank') + _v('up-assets-mf') + _v('up-assets-stocks') +
                          _v('up-assets-re') + _v('up-assets-ppf') + _v('up-assets-gold') + _v('up-assets-other');
        var totalLiab   = _v('up-liab-home') + _v('up-liab-car') + _v('up-liab-personal') +
                          _v('up-liab-cc') + _v('up-liab-other');
        var netWorth    = totalAssets - totalLiab;

        var aEl = document.getElementById('up-assets-total');
        var lEl = document.getElementById('up-liab-total');
        var nEl = document.getElementById('up-networth-val');
        var nBar= document.getElementById('up-networth-bar');
        if (aEl) aEl.textContent = '₹' + totalAssets.toLocaleString('en-IN');
        if (lEl) lEl.textContent = '₹' + totalLiab.toLocaleString('en-IN');
        if (nEl) {
            nEl.textContent = (netWorth < 0 ? '−₹' : '₹') + Math.abs(netWorth).toLocaleString('en-IN');
            nEl.style.color = netWorth >= 0 ? '#059669' : '#dc2626';
        }
        if (nBar) {
            if (netWorth < 0) {
                nBar.style.background = 'rgba(239,68,68,0.07)';
                nBar.style.border     = '1px solid rgba(239,68,68,0.22)';
                var lbl = nBar.querySelector('span:first-child');
                if (lbl) lbl.style.color = '#dc2626';
            } else {
                nBar.style.background = 'rgba(245,200,66,0.10)';
                nBar.style.border     = '1px solid rgba(245,200,66,0.35)';
                var lbl2 = nBar.querySelector('span:first-child');
                if (lbl2) lbl2.style.color = '#7c5c0a';
            }
        }
    }

    function upShareWhatsApp() {
        var p = window._userProfile || {};
        function fmt(v) {
            var n = parseFloat((v || '0').replace(/,/g,'')) || 0;
            return n > 0 ? '₹' + n.toLocaleString('en-IN') : '—';
        }
        var occMap = { salaried:'Salaried', 'self-employed':'Self-Employed', business:'Business Owner', retired:'Retired', student:'Student' };
        var typeMap = { individual:'Individual', family:'Family Floater', corporate:'Corporate/Group' };
        var relMap  = { spouse:'Spouse', child:'Child', parent:'Parent', sibling:'Sibling', other:'Other' };

        var totalAssets = ['assetsBank','assetsMf','assetsStocks','assetsRe','assetsPpf','assetsGold','assetsOther']
            .reduce(function(s,k){ return s + (parseFloat((p[k]||'0').replace(/,/g,''))||0); }, 0);
        var totalLiab = ['liabHome','liabCar','liabPersonal','liabCc','liabOther']
            .reduce(function(s,k){ return s + (parseFloat((p[k]||'0').replace(/,/g,''))||0); }, 0);
        var netWorth = totalAssets - totalLiab;

        var riskText = '—';
        var cache = window._fpRiskCache;
        if (cache && cache.score !== undefined) {
            var age = parseInt(p.age || '30', 10);
            var rKey = typeof window.fpGetRiskProfile === 'function'
                ? window.fpGetRiskProfile(cache.score, age)
                : (cache.score <= 4 ? 'conservative' : cache.score <= 8 ? 'moderate' : cache.score <= 11 ? 'moderateAggressive' : 'aggressive');
            riskText = _upRiskLabel(rKey) + ' (Score ' + cache.score + '/15)';
        }

        var lines = [
            '👤 *My Financial Profile*',
            '━━━━━━━━━━━━━━━━━━━',
            '',
            '*📋 Personal Details*',
            '• Name: ' + (p.name || '—'),
            '• Age: ' + (p.age ? p.age + ' years' : '—'),
            '• Occupation: ' + (occMap[p.occupation] || p.occupation || '—'),
            '',
            '*💰 Income & Tax*',
            '• Monthly In-Hand: ' + fmt(p.income),
            '• Annual Income: ' + fmt(p.annualIncome),
            '• Tax Regime: ' + (p.regime === 'old' ? 'Old Regime' : 'New Regime'),
            '• City Type: ' + (p.city === 'metro' ? 'Metro' : 'Non-Metro'),
            '',
            '*📈 Current Assets*',
            '  Bank / Savings:    ' + fmt(p.assetsBank),
            '  Mutual Funds:      ' + fmt(p.assetsMf),
            '  Stocks / Shares:   ' + fmt(p.assetsStocks),
            '  Real Estate:       ' + fmt(p.assetsRe),
            '  PPF / EPF:         ' + fmt(p.assetsPpf),
            '  Gold & Jewellery:  ' + fmt(p.assetsGold),
            '  Other Assets:      ' + fmt(p.assetsOther),
            '  ─────────────────',
            '  *Total Assets:     ₹' + totalAssets.toLocaleString('en-IN') + '*',
            '',
            '*📉 Current Liabilities*',
            '  Home Loan:         ' + fmt(p.liabHome),
            '  Car / Vehicle:     ' + fmt(p.liabCar),
            '  Personal Loan:     ' + fmt(p.liabPersonal),
            '  Credit Card Dues:  ' + fmt(p.liabCc),
            '  Other:             ' + fmt(p.liabOther),
            '  ─────────────────',
            '  *Total Liabilities: ₹' + totalLiab.toLocaleString('en-IN') + '*',
            '',
            '*⚖️ Net Worth: ' + (netWorth < 0 ? '−₹' : '₹') + Math.abs(netWorth).toLocaleString('en-IN') + '*',
            '',
            '*🏥 Health Insurance*',
            '  Insurer:   ' + (p.healthInsurer || '—'),
            '  Coverage:  ' + fmt(p.healthCoverage),
            '  Premium:   ' + fmt(p.healthPremium) + '/yr',
            '  Type:      ' + (typeMap[p.healthType] || '—'),
            (p.healthPolicyNo ? '  Policy No: ' + p.healthPolicyNo : ''),
            '',
            '*🛡️ Term Insurance*',
            '  Insurer:   ' + (p.termInsurer || '—'),
            '  Sum Assured: ' + fmt(p.termAssured),
            '  Premium:   ' + fmt(p.termPremium) + '/yr',
            '  Nominee:   ' + (p.termNominee || '—') + (p.termNomineeRel ? ' (' + (relMap[p.termNomineeRel] || p.termNomineeRel) + ')' : ''),
            (p.termPolicyNo ? '  Policy No: ' + p.termPolicyNo : ''),
            '',
            '*🎯 Risk Appetite*',
            '  ' + riskText,
            '',
            '─────────────────────',
            '_Shared from AishwaryaMasthu Finance App_'
        ].filter(function(l){ return l !== undefined && l !== null; }).join('\n');

        window.open('https://wa.me/?text=' + encodeURIComponent(lines), '_blank');
    }

    function initMyProfile() {
        var p = window._userProfile;
        upRegimeChange(); // ensure slab options match regime before restoring
        if (p) upLoad(p);
        upCalcTotals();
        upRefreshRiskDisplay();
        upRenderProfileGoals();
    }

    function upUpdateSummary() {
        var el = document.getElementById('up-tile-summary');
        if (!el) return;
        var p  = window._userProfile;
        var parts = [];
        if (p.name)       parts.push(p.name.split(' ')[0]);
        if (p.age)        parts.push(p.age + 'y');
        if (p.occupation) parts.push({ salaried:'Salaried', 'self-employed':'Self-Employed', business:'Business Owner', retired:'Retired', student:'Student' }[p.occupation] || p.occupation);
        if (p.income)     parts.push('₹' + p.income + '/mo');
        el.textContent = parts.length ? parts.join(' · ') : 'Set your details once — auto-fill any tool instantly';
    }

    function upRefreshBanners() {
        var p = window._userProfile;
        var hasProfile = p.income || p.age || p.name;
        var hasBasic   = !!(p.basicSalary);
        var hasTax     = !!(p.regime || p.taxSlab);
        ['taxguide', 'finplan', 'drawdown',
         'epfcalc', 'ppfnps', 'retirementhub',
         'insure', 'gratuity', 'homeloan',
         'healthscore', 'hracalc'].forEach(function(tool) {
            var banner = document.getElementById('up-banner-' + tool);
            if (!banner) return;
            var show = hasProfile;
            if (tool === 'epfcalc' || tool === 'retirementhub') show = hasProfile && (hasBasic || !!(p.retireAge));
            if (tool === 'gratuity' || tool === 'hracalc')      show = hasBasic || hasTax;
            if (tool === 'homeloan')                            show = hasTax;
            if (tool === 'ppfnps')                              show = !!(p.age);
            banner.classList.toggle('hidden', !show);
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
        var label      = _upRiskLabel(profileKey) || '⚖️ Moderate';
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

    function _upSet(id, val, formatted) {
        var el = document.getElementById(id);
        if (!el || val === '' || val === null || val === undefined) return;
        el.value = formatted !== undefined ? formatted : val;
        el.classList.remove('text-slate-400');
    }

    function upApply(tool) {
        var p       = window._userProfile;
        var inc     = upNum('up-income');          // monthly in-hand
        var exp     = upNum('up-expenses');         // monthly expenses
        var age     = parseInt(p.age, 10) || 0;
        var basic   = parseFloat((p.basicSalary || '').replace(/,/g,'')) || 0;
        var retAge  = parseInt(p.retireAge, 10) || 0;
        var epfBal  = parseFloat((p.epfBalance || '').replace(/,/g,'')) || 0;
        var slab    = p.taxSlab || '';
        var deps    = p.dependents || '';
        var annInc  = parseFloat((p.annualIncome || '').replace(/,/g,'')) || (inc * 12);

        if (tool === 'taxguide') {
            if (annInc > 0) _upSet('tg-income', annInc, annInc.toLocaleString('en-IN'));
            if (p.regime) { var re = document.getElementById('tg-regime'); if (re) re.value = p.regime; }
            if (basic > 0) _upSet('tg-epf-basic', basic, basic.toLocaleString('en-IN'));
            if (typeof tgCalc === 'function') tgCalc();
        }

        if (tool === 'finplan') {
            if (p.name)   _upSet('fp-name', p.name);
            if (age > 0)  _upSet('fp-age', age);
            if (retAge > 0) _upSet('fp-retire-age', retAge);
            if (inc > 0)  { var fi = document.getElementById('fp-income'); if (fi) { fi.value = inc.toLocaleString('en-IN'); fi.classList.remove('text-slate-400'); if (typeof fpFormatMoney === 'function') fpFormatMoney(fi, 'fp-income-words'); } }
            if (inc > 0 && exp > 0 && inc > exp) { var fs = document.getElementById('fp-invest-amt'); if (fs) { fs.value = (inc - exp).toLocaleString('en-IN'); fs.classList.remove('text-slate-400'); if (typeof fpFormatMoney === 'function') fpFormatMoney(fs, 'fp-invest-words'); } }
            if (basic > 0) _upSet('fp-epf-basic', basic, basic.toLocaleString('en-IN'));
            if (typeof fpLiveUpdate === 'function') fpLiveUpdate();
        }

        if (tool === 'drawdown') {
            if (age > 0)  _upSet('dd-current-age', age);
            if (retAge > 0) _upSet('dd-ret-age', retAge);
            if (exp > 0)  _upSet('dd-expenses', exp, exp.toLocaleString('en-IN'));
            if (typeof drawdownCalc === 'function') drawdownCalc();
        }

        if (tool === 'epfcalc') {
            if (age > 0)    _upSet('epf-age', age);
            if (retAge > 0) _upSet('epf-retire', retAge);
            if (basic > 0)  _upSet('epf-basic', basic, basic.toLocaleString('en-IN'));
            if (epfBal > 0) _upSet('epf-balance', epfBal, epfBal.toLocaleString('en-IN'));
            if (typeof epfCalc === 'function') epfCalc();
        }

        if (tool === 'ppfnps') {
            if (age > 0) _upSet('nps-age', age);
            if (typeof npsCalc === 'function') npsCalc();
        }

        if (tool === 'retirementhub') {
            if (age > 0)    _upSet('rh-age', age);
            if (retAge > 0) _upSet('rh-ret-age', retAge);
            if (exp > 0)    _upSet('rh-expenses', exp, exp.toLocaleString('en-IN'));
            if (basic > 0)  _upSet('rh-epf-basic', basic, basic.toLocaleString('en-IN'));
            if (epfBal > 0) _upSet('rh-epf-balance', epfBal, epfBal.toLocaleString('en-IN'));
            if (typeof retHubCalc === 'function') retHubCalc();
        }

        if (tool === 'insure') {
            if (annInc > 0) _upSet('ins-income', annInc, annInc.toLocaleString('en-IN'));
            if (age > 0)    _upSet('ins-age', age);
            if (exp > 0)    _upSet('ins-monthly-exp', exp, exp.toLocaleString('en-IN'));
            if (deps !== '')_upSet('ins-dependents', deps);
            if (deps !== '') _upSet('ins-family', deps);
            var totalLiab = ['liabHome','liabCar','liabPersonal','liabCc','liabOther'].reduce(function(s,k){ return s + (parseFloat((p[k]||'0').replace(/,/g,''))||0); }, 0);
            if (totalLiab > 0) _upSet('ins-loans', totalLiab, totalLiab.toLocaleString('en-IN'));
            var hCov = parseFloat((p.healthCoverage || '0').replace(/,/g,'')) || 0;
            var tAss = parseFloat((p.termAssured   || '0').replace(/,/g,'')) || 0;
            if (hCov > 0) _upSet('ins-health-current', hCov, hCov.toLocaleString('en-IN'));
            if (tAss > 0) _upSet('ins-term-current',   tAss, tAss.toLocaleString('en-IN'));
            if (typeof insureCalc === 'function') insureCalc();
        }

        if (tool === 'gratuity') {
            if (basic > 0) _upSet('grat-basic', basic, basic.toLocaleString('en-IN'));
            if (p.regime) { var gr = document.getElementById('grat-regime'); if (gr) gr.value = p.regime; }
            if (slab)     { var gs = document.getElementById('grat-slab');   if (gs) gs.value = slab; }
            if (typeof gratCalc === 'function') gratCalc();
        }

        if (tool === 'homeloan') {
            if (slab)     { var ts = document.getElementById('tx-slab');   if (ts) { ts.value = slab; ts.classList.remove('text-slate-400'); } }
            if (p.regime) { var tr = document.getElementById('tx-regime'); if (tr) tr.value = p.regime; }
            if (typeof hlTaxCalc === 'function') hlTaxCalc();
        }

        if (tool === 'healthscore') {
            if (inc > 0) _upSet('hs-income', inc, inc.toLocaleString('en-IN'));
            if (exp > 0) _upSet('hs-expenses', exp, exp.toLocaleString('en-IN'));
            if (age > 0) _upSet('hs-age', age);
            if (typeof calcHealthScore === 'function') calcHealthScore();
        }

        if (tool === 'hracalc') {
            if (basic > 0) _upSet('hra-basic', basic, basic.toLocaleString('en-IN'));
            if (p.city)   { var hc = document.getElementById('hra-city');   if (hc) hc.value = p.city; }
            if (p.regime) { var hr = document.getElementById('hra-regime'); if (hr) hr.value = p.regime; }
            if (slab)     { var hs = document.getElementById('hra-slab');   if (hs) hs.value = slab; }
            if (typeof hraCalc === 'function') hraCalc();
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
