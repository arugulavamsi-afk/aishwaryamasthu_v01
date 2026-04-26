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

    function _upDomVal(id, fallback) {
        var el = document.getElementById(id);
        return el !== null ? el.value : fallback;
    }

    function upSave() {
        var existing = window._userProfile || {};
        var p = {
            name:           _upDomVal('up-name',    existing.name    || '').trim(),
            age:            _upDomVal('up-age',      existing.age     || ''),
            occupation:     _upDomVal('up-occupation',existing.occupation || ''),
            dependents:     _upDomVal('up-dependents',existing.dependents || ''),
            // Preserved from linked tools — not editable in My Profile any more
            income:         _upDomVal('up-income',      existing.income      || ''),
            annualIncome:   _upDomVal('up-annual-income',existing.annualIncome|| ''),
            expenses:       _upDomVal('up-expenses',    existing.expenses    || ''),
            regime:         _upDomVal('up-regime',      existing.regime      || 'new'),
            taxSlab:        _upDomVal('up-tax-slab',    existing.taxSlab     || ''),
            city:           _upDomVal('up-city',        existing.city        || 'metro'),
            basicSalary:    _upDomVal('up-basic-salary',existing.basicSalary || ''),
            retireAge:      _upDomVal('up-retire-age',  existing.retireAge   || ''),
            epfBalance:     _upDomVal('up-epf-balance', existing.epfBalance  || ''),
            assetsBank:     _upDomVal('up-assets-bank',    existing.assetsBank    || '0'),
            assetsMf:       _upDomVal('up-assets-mf',      existing.assetsMf      || '0'),
            assetsStocks:   _upDomVal('up-assets-stocks',  existing.assetsStocks  || '0'),
            assetsRe:       _upDomVal('up-assets-re',      existing.assetsRe      || '0'),
            assetsPpf:      _upDomVal('up-assets-ppf',     existing.assetsPpf     || '0'),
            assetsGold:     _upDomVal('up-assets-gold',    existing.assetsGold    || '0'),
            assetsOther:    _upDomVal('up-assets-other',   existing.assetsOther   || '0'),
            liabHome:       _upDomVal('up-liab-home',      existing.liabHome      || '0'),
            liabCar:        _upDomVal('up-liab-car',       existing.liabCar       || '0'),
            liabPersonal:   _upDomVal('up-liab-personal',  existing.liabPersonal  || '0'),
            liabCc:         _upDomVal('up-liab-cc',        existing.liabCc        || '0'),
            liabOther:      _upDomVal('up-liab-other',     existing.liabOther     || '0'),
            healthInsurer:  _upDomVal('up-health-insurer', existing.healthInsurer  || ''),
            healthCoverage: _upDomVal('up-health-coverage',existing.healthCoverage || '0'),
            healthPremium:  _upDomVal('up-health-premium', existing.healthPremium  || '0'),
            healthType:     _upDomVal('up-health-type',    existing.healthType     || 'individual'),
            healthPolicyNo: _upDomVal('up-health-policyno',existing.healthPolicyNo || ''),
            termInsurer:    _upDomVal('up-term-insurer',   existing.termInsurer    || ''),
            termAssured:    _upDomVal('up-term-assured',   existing.termAssured    || '0'),
            termPremium:    _upDomVal('up-term-premium',   existing.termPremium    || '0'),
            termNominee:    _upDomVal('up-term-nominee',   existing.termNominee    || ''),
            termNomineeRel: _upDomVal('up-term-nominee-rel',existing.termNomineeRel|| ''),
            termPolicyNo:   _upDomVal('up-term-policyno',  existing.termPolicyNo   || ''),
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
        upRefreshToolSummaries();
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

    // ── Compact number formatter ──────────────────────────────────────────────
    function _upFmt(n) {
        if (!n || isNaN(n)) return '—';
        if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
        if (n >= 1e5) return '₹' + (n / 1e5).toFixed(1) + ' L';
        return '₹' + Math.round(n).toLocaleString('en-IN');
    }

    // ── Tool summary cards ────────────────────────────────────────────────────
    function upRefreshToolSummaries() {
        var s = window._toolSummaries || {};

        // Tax Guide
        var taxEl = document.getElementById('up-tax-summary');
        if (taxEl && s.taxGuide) {
            var t = s.taxGuide;
            taxEl.innerHTML =
                '<div class="flex justify-between"><span class="text-slate-500">Best Regime</span><span class="font-black" style="color:#7c5c0a;">' + (t.bestRegime || '—') + '</span></div>' +
                '<div class="flex justify-between"><span class="text-slate-500">Tax Payable</span><span class="font-bold">' + _upFmt(Math.min(t.taxOld || 0, t.taxNew || 0)) + '/yr</span></div>' +
                '<div class="flex justify-between"><span class="text-slate-500">Regime Saving</span><span class="font-bold text-emerald-600">' + _upFmt(t.savings || 0) + '/yr</span></div>' +
                '<div class="flex justify-between"><span class="text-slate-500">Take-Home</span><span class="font-black" style="color:#059669;">' + _upFmt(t.takeHomeMonthly || 0) + '/mo</span></div>';
        }

        // Retirement Hub
        var retEl = document.getElementById('up-retirement-summary');
        if (retEl && s.retirement) {
            var r = s.retirement;
            var gapColor = (r.gap || 0) >= 0 ? '#059669' : '#dc2626';
            var gapLabel = (r.gap || 0) >= 0 ? 'Surplus' : 'Shortfall';
            retEl.innerHTML =
                '<div class="flex justify-between"><span class="text-slate-500">Total Corpus</span><span class="font-black" style="color:#7c3aed;">' + _upFmt(r.totalCorpus || 0) + '</span></div>' +
                '<div class="flex justify-between"><span class="text-slate-500">Monthly Income</span><span class="font-bold">' + _upFmt(r.monthlyIncome || 0) + '/mo</span></div>' +
                '<div class="flex justify-between"><span class="text-slate-500">Years to Retire</span><span class="font-bold">' + (r.yearsToRetire || '—') + ' yrs (at ' + (r.retirementAge || '—') + ')</span></div>' +
                '<div class="flex justify-between"><span class="text-slate-500">' + gapLabel + '</span><span class="font-black" style="color:' + gapColor + ';">' + _upFmt(Math.abs(r.gap || 0)) + '/mo</span></div>';
        }

        // Net Worth
        var nwEl = document.getElementById('up-networth-summary');
        if (nwEl && s.netWorth) {
            var nw = s.netWorth;
            var nwColor = (nw.netWorth || 0) >= 0 ? '#059669' : '#dc2626';
            nwEl.innerHTML =
                '<div class="flex justify-between"><span class="text-slate-500">Total Assets</span><span class="font-bold text-emerald-700">' + _upFmt(nw.totalAssets || 0) + '</span></div>' +
                '<div class="flex justify-between"><span class="text-slate-500">Total Liabilities</span><span class="font-bold text-red-600">' + _upFmt(nw.totalLiab || 0) + '</span></div>' +
                '<div class="flex justify-between border-t border-slate-100 pt-1 mt-0.5"><span class="font-black text-slate-600">Net Worth</span><span class="font-black" style="color:' + nwColor + ';">' + _upFmt(nw.netWorth || 0) + '</span></div>';
        }

        // Financial Health Score
        var hsEl = document.getElementById('up-health-summary');
        if (hsEl && s.healthScore) {
            var hs = s.healthScore;
            var hsColor = hs.score >= 70 ? '#059669' : hs.score >= 50 ? '#d97706' : '#dc2626';
            hsEl.innerHTML =
                '<div class="flex justify-between items-center">' +
                    '<span class="text-slate-500">Score</span>' +
                    '<span class="text-lg font-black" style="color:' + hsColor + ';">' + hs.score + '<span class="text-[10px] font-normal">/100</span></span>' +
                '</div>' +
                '<div class="text-[10px] font-semibold" style="color:' + hsColor + ';">' + (hs.grade || '') + '</div>';
        }

        // Financial Plan
        var fpEl = document.getElementById('up-finplan-summary');
        if (fpEl && s.finplan) {
            var fp = s.finplan;
            fpEl.innerHTML =
                '<div class="flex justify-between"><span class="text-slate-500">Profile</span><span class="font-black" style="color:#0369a1;">' + (fp.profileLabel || '—') + '</span></div>' +
                (fp.monthlyInvest > 0 ? '<div class="flex justify-between"><span class="text-slate-500">Monthly SIP</span><span class="font-bold">' + _upFmt(fp.monthlyInvest) + '/mo</span></div>' : '') +
                '<div class="flex justify-between"><span class="text-slate-500">Goals Planned</span><span class="font-bold">' + (fp.goalCount || 0) + '</span></div>' +
                '<div class="flex justify-between"><span class="text-slate-500">Expected Return</span><span class="font-bold">' + (fp.blendedReturn || '—') + '%</span></div>';
        }

        // Emergency Fund
        var efEl = document.getElementById('up-emergency-summary');
        if (efEl && s.budgetTracker) {
            var bt = s.budgetTracker;
            efEl.innerHTML =
                '<div class="flex justify-between"><span class="text-slate-500">Target (' + (bt.efMonths || 6) + ' months)</span><span class="font-black" style="color:#b45309;">' + _upFmt(bt.efTarget || 0) + '</span></div>' +
                '<div class="flex justify-between"><span class="text-slate-500">Monthly Expenses</span><span class="font-bold">' + _upFmt(bt.monthlyExpenses || 0) + '/mo</span></div>';
        }
    }
    window.upRefreshToolSummaries = upRefreshToolSummaries;

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
