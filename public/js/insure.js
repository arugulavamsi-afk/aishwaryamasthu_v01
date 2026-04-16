    /* ══════════════════════════════════════════════════════════
       INSURANCE ADEQUACY CALCULATOR
    ══════════════════════════════════════════════════════════ */

    function insFormat(el) {
        var raw = (el.value || '').replace(/[^0-9]/g, '');
        el.value = raw ? Number(raw).toLocaleString('en-IN') : '';
    }
    function insNum(id) {
        return parseFloat((document.getElementById(id)?.value || '').replace(/,/g, '')) || 0;
    }
    function insFmt(n) {
        if (!n && n !== 0) return '—';
        var a = Math.abs(n), s = n < 0 ? '-' : '';
        if (a >= 1e7) return s + '₹' + (a/1e7).toFixed(2) + ' Cr';
        if (a >= 1e5) return s + '₹' + (a/1e5).toFixed(2) + ' L';
        return s + '₹' + Math.round(a).toLocaleString('en-IN');
    }

    function initInsure() { insureCalc(); }

    function resetInsure() {
        var defs = {'ins-income':'12,00,000','ins-age':'30','ins-dependents':'2',
                    'ins-loans':'0','ins-term-current':'0','ins-health-current':'0',
                    'ins-monthly-exp':'50,000','ins-family':'2',
                    'ins-assets':'0','ins-illiquid-assets':'0','ins-ci-current':'0','ins-disability-current':'0',
                    'ins-parents-cover':'0','ins-parents-age1':'55','ins-parents-age2':'52'};
        Object.entries(defs).forEach(function([id, val]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = val; el.classList.add('text-slate-400');
        });
        insureCalc();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function insPreset(income, age, dependents, loans, termCurrent, healthCurrent, expenses, family, assets, ciCurrent, disabilityCurrent, parentsCover, parentsAge1, parentsAge2) {
        var f = {
            'ins-income':              Number(income).toLocaleString('en-IN'),
            'ins-age':                 String(age),
            'ins-dependents':          String(dependents),
            'ins-loans':               Number(loans).toLocaleString('en-IN'),
            'ins-term-current':        Number(termCurrent).toLocaleString('en-IN'),
            'ins-health-current':      Number(healthCurrent).toLocaleString('en-IN'),
            'ins-monthly-exp':         Math.round(Number(expenses) / 12).toLocaleString('en-IN'),
            'ins-family':              String(family),
            'ins-assets':              Number(assets || 0).toLocaleString('en-IN'),
            'ins-ci-current':          Number(ciCurrent || 0).toLocaleString('en-IN'),
            'ins-disability-current':  Number(disabilityCurrent || 0).toLocaleString('en-IN'),
            'ins-parents-cover':       Number(parentsCover || 0).toLocaleString('en-IN'),
            'ins-parents-age1':        String(parentsAge1 || 55),
            'ins-parents-age2':        String(parentsAge2 || 52)
        };
        Object.entries(f).forEach(function([id, val]) {
            var el = document.getElementById(id); if (!el) return;
            el.value = val; el.classList.remove('text-slate-400');
        });
        insureCalc();
    }

    function insureCalc() {
        var income           = insNum('ins-income');
        var age              = Math.round(insNum('ins-age')) || 30;
        var dependents       = Math.round(insNum('ins-dependents'));
        var loans            = insNum('ins-loans');
        var termCurrent      = insNum('ins-term-current');
        var healthCurrent    = insNum('ins-health-current');
        var monthlyExp       = insNum('ins-monthly-exp');
        var expenses         = monthlyExp * 12;
        var hintEl           = document.getElementById('ins-exp-annual-hint');
        if (hintEl) hintEl.textContent = monthlyExp > 0 ? '= ' + insFmt(expenses) + '/yr' : '= ₹0/yr';
        var familySize       = Math.max(1, Math.round(parseFloat(document.getElementById('ins-family')?.value) || 2));
        var assets           = insNum('ins-assets');
        var illiquidAssets   = insNum('ins-illiquid-assets');
        var ciCurrent        = insNum('ins-ci-current');
        var disabilityCurrent= insNum('ins-disability-current');
        var parentsCover     = insNum('ins-parents-cover');
        var parentsAge1      = Math.round(insNum('ins-parents-age1')) || 0;
        var parentsAge2      = Math.round(insNum('ins-parents-age2')) || 0;

        if (!income) return;

        // ── TERM INSURANCE: HLV Method (assets-netted) ────────────
        var hlvMultiple = age <= 35 ? 15 : age <= 45 ? 12 : 10;
        var hlvBase     = income * hlvMultiple;
        // Net out liquid assets: family already has those savings
        var termNeeded  = Math.max(income * 10, Math.round(hlvBase + loans - assets));
        var termGap     = Math.max(0, termNeeded - termCurrent);

        // ── HEALTH INSURANCE ──────────────────────────────────────
        var baseFloater  = familySize <= 2 ? 1000000 : familySize <= 3 ? 1500000 : 2000000;
        var superTopUp   = 2500000;
        var healthNeeded = baseFloater + superTopUp;
        var healthGap    = Math.max(0, healthNeeded - healthCurrent);

        // ── CRITICAL ILLNESS ──────────────────────────────────────
        // Target: max(₹25L, 3× income) capped at ₹50L
        // CI pays lump sum for cancer, heart attack, stroke — separate from health insurance
        var ciNeeded = Math.min(5000000, Math.max(2500000, income * 3));
        var ciGap    = Math.max(0, ciNeeded - ciCurrent);

        // ── DISABILITY INSURANCE ──────────────────────────────────
        // Target corpus = 10× annual income (generate income if unable to work)
        var disabilityNeeded = income * 10;
        var disabilityGap    = Math.max(0, disabilityNeeded - disabilityCurrent);

        // ── PARENTS HEALTH COVER ──────────────────────────────────
        var maxParentAge = Math.max(parentsAge1, parentsAge2);
        var parentsNeeded    = 0;
        var estParentsPremium= 0;
        if (maxParentAge > 0) {
            // ₹5L floater + ₹20L super top-up = ₹25L recommended per parent couple
            parentsNeeded = 2500000;
            // Premium estimate by age of oldest parent
            estParentsPremium = maxParentAge < 60 ? 22000 : maxParentAge < 65 ? 34000 : maxParentAge < 70 ? 50000 : 68000;
        }
        var parentsGap = Math.max(0, parentsNeeded - parentsCover);

        // ── Estimated term premium range (actual quotes vary by gender, smoker status, health)
        var rateMin = age <= 30 ? 5  : age <= 35 ? 7  : age <= 40 ? 10 : age <= 45 ? 15 : 22;
        var rateMax = age <= 30 ? 12 : age <= 35 ? 16 : age <= 40 ? 24 : age <= 45 ? 36 : 55;
        var termPremiumMin = Math.round((termGap / 100000) * rateMin * 100);
        var termPremiumMax = Math.round((termGap / 100000) * rateMax * 100);

        // ── DOM Updates — Term & Health ───────────────────────────
        document.getElementById('ins-term-needed').textContent   = insFmt(termNeeded);
        document.getElementById('ins-health-needed').textContent = insFmt(healthNeeded);
        document.getElementById('ins-hlv-multiple').textContent  = hlvMultiple + 'x';
        document.getElementById('ins-term-premium').textContent  = termPremiumMin > 0 ? insFmt(termPremiumMin) + '–' + insFmt(termPremiumMax) + '/yr' : '—';
        document.getElementById('ins-term-gap-pill').textContent   = termGap > 0 ? insFmt(termGap) : _t('insure.adequate');
        document.getElementById('ins-health-gap-pill').textContent = healthGap > 0 ? insFmt(healthGap) : _t('insure.adequate');

        var tGapEl = document.getElementById('ins-term-gap');
        if (tGapEl) { if (termGap > 0) { tGapEl.textContent = _t('insure.gap') + insFmt(termGap); tGapEl.style.color = '#fbbf24'; } else { tGapEl.textContent = _t('insure.adequate'); tGapEl.style.color = '#86efac'; } }

        var hGapEl = document.getElementById('ins-health-gap');
        if (hGapEl) { if (healthGap > 0) { hGapEl.textContent = _t('insure.gap') + insFmt(healthGap); hGapEl.style.color = '#fbbf24'; } else { hGapEl.textContent = _t('insure.adequate'); hGapEl.style.color = '#86efac'; } }

        // ── DOM Updates — CI, Disability, Parents ─────────────────
        var ciNeedEl = document.getElementById('ins-ci-needed');
        if (ciNeedEl) ciNeedEl.textContent = insFmt(ciNeeded);
        var ciGapEl = document.getElementById('ins-ci-gap');
        if (ciGapEl) { if (ciGap > 0) { ciGapEl.textContent = _t('insure.gap') + insFmt(ciGap); ciGapEl.style.color = '#fdba74'; } else { ciGapEl.textContent = _t('insure.adequate'); ciGapEl.style.color = '#6ee7b7'; } }
        var ciGapPill = document.getElementById('ins-ci-gap-pill');
        if (ciGapPill) ciGapPill.textContent = ciGap > 0 ? insFmt(ciGap) : _t('insure.adequate');

        var disNeedEl = document.getElementById('ins-disability-needed');
        if (disNeedEl) disNeedEl.textContent = insFmt(disabilityNeeded);
        var disGapEl = document.getElementById('ins-disability-gap');
        if (disGapEl) { if (disabilityGap > 0) { disGapEl.textContent = _t('insure.gap') + insFmt(disabilityGap); disGapEl.style.color = '#fca5a5'; } else { disGapEl.textContent = _t('insure.adequate'); disGapEl.style.color = '#6ee7b7'; } }

        var parNeedEl = document.getElementById('ins-parents-needed');
        if (parNeedEl) parNeedEl.textContent = parentsNeeded > 0 ? insFmt(parentsNeeded) : '—';
        var parGapEl = document.getElementById('ins-parents-gap');
        if (parGapEl) { if (parentsNeeded === 0) { parGapEl.textContent = _t('insure.enter_parent_age'); parGapEl.style.color = '#5eead4'; } else if (parentsGap > 0) { parGapEl.textContent = _t('insure.gap') + insFmt(parentsGap); parGapEl.style.color = '#5eead4'; } else { parGapEl.textContent = _t('insure.adequate'); parGapEl.style.color = '#6ee7b7'; } }
        var parPremEl = document.getElementById('ins-parents-premium');
        if (parPremEl) parPremEl.textContent = estParentsPremium > 0 ? insFmt(estParentsPremium) + '/yr' : '—';

        // ── Term workings ─────────────────────────────────────────
        var tw = document.getElementById('ins-term-workings');
        if (tw) tw.innerHTML =
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Annual income</span><span class="font-bold">' + insFmt(income) + '</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>HLV multiple (age ' + age + ')</span><span class="font-bold">× ' + hlvMultiple + '</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>HLV base</span><span class="font-bold">' + insFmt(Math.round(income * hlvMultiple)) + '</span></div>' +
            (loans > 0 ? '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>+ Outstanding loans</span><span class="font-bold">' + insFmt(loans) + '</span></div>' : '') +
            (assets > 0 ? '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>− Liquid assets (FD/MF/savings)</span><span class="font-bold text-emerald-600">−' + insFmt(assets) + '</span></div>' : '') +
            (illiquidAssets > 0 ? '<div class="flex justify-between py-0.5 border-b border-slate-100 text-amber-700"><span>⚠ Home/vehicle equity (NOT netted)</span><span class="font-bold">' + insFmt(illiquidAssets) + '</span></div>' : '') +
            '<div class="flex justify-between py-1 font-black text-blue-700"><span>= Total term needed</span><span>' + insFmt(termNeeded) + '</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>− Existing cover</span><span class="font-bold">' + insFmt(termCurrent) + '</span></div>' +
            '<div class="flex justify-between py-1 font-black ' + (termGap > 0 ? 'text-red-600' : 'text-emerald-600') + '"><span>' + (termGap > 0 ? _t('insure.gap_fill') : _t('insure.no_gap')) + '</span><span>' + (termGap > 0 ? insFmt(termGap) : _t('insure.covered')) + '</span></div>';

        // ── Health workings ───────────────────────────────────────
        var hw = document.getElementById('ins-health-workings');
        var familyLabel = ['','Self only','Self + Spouse','Family of 3','Family of 4','Family + Parents'];
        if (hw) hw.innerHTML =
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Family (' + (familyLabel[familySize] || 'Family') + ')</span><span class="font-bold">Base floater</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Base floater (min ₹10L)</span><span class="font-bold">' + insFmt(baseFloater) + '</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>+ Super top-up (₹25L above ₹5L)</span><span class="font-bold">' + insFmt(superTopUp) + '</span></div>' +
            '<div class="flex justify-between py-1 font-black text-emerald-700"><span>= Total health cover needed</span><span>' + insFmt(healthNeeded) + '</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>− Existing cover</span><span class="font-bold">' + insFmt(healthCurrent) + '</span></div>' +
            '<div class="flex justify-between py-1 font-black ' + (healthGap > 0 ? 'text-red-600' : 'text-emerald-600') + '"><span>' + (healthGap > 0 ? _t('insure.gap_fill') : _t('insure.no_gap')) + '</span><span>' + (healthGap > 0 ? insFmt(healthGap) : _t('insure.covered')) + '</span></div>' +
            '<div class="mt-2 text-[9px] text-slate-500">ICU costs post-COVID: ₹40K–80K/day. A ₹25L top-up costs only ₹4,000–8,000/yr.</div>' +
            '<div class="mt-1.5 rounded-lg px-2 py-1.5 text-[9px] leading-relaxed font-semibold" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;">⚠️ This is an <strong>annual coverage limit</strong>, not a lifetime guarantee — it resets each policy year. A single cancer treatment in a Tier-1 city can cost ₹30–60L over 12–18 months, spread across multiple policy years. Premiums increase with age and policies may become unavailable after age 75–80. Consider a critical illness (CI) policy for lump-sum protection against high-cost conditions.</div>';

        // ── CI + Disability workings ───────────────────────────────
        var cw = document.getElementById('ins-ci-workings');
        if (cw) cw.innerHTML =
            '<div class="text-[9px] font-black text-orange-700 mb-1">🎗️ Critical Illness</div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Recommended (max ₹25L, 3× income)</span><span class="font-bold">' + insFmt(ciNeeded) + '</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>− Current CI cover</span><span class="font-bold">' + insFmt(ciCurrent) + '</span></div>' +
            '<div class="flex justify-between py-1 font-black ' + (ciGap > 0 ? 'text-red-600' : 'text-emerald-600') + '"><span>' + (ciGap > 0 ? _t('insure.ci_gap_txt') : _t('insure.no_ci_gap')) + '</span><span>' + (ciGap > 0 ? insFmt(ciGap) : _t('insure.covered')) + '</span></div>' +
            '<div class="text-[9px] font-black text-rose-700 mt-2 mb-1">♿ Disability Cover</div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Income replacement corpus (10× income)</span><span class="font-bold">' + insFmt(disabilityNeeded) + '</span></div>' +
            '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>− Current disability cover</span><span class="font-bold">' + insFmt(disabilityCurrent) + '</span></div>' +
            '<div class="flex justify-between py-1 font-black ' + (disabilityGap > 0 ? 'text-red-600' : 'text-emerald-600') + '"><span>' + (disabilityGap > 0 ? _t('insure.dis_gap_txt') : _t('insure.no_gap')) + '</span><span>' + (disabilityGap > 0 ? insFmt(disabilityGap) : _t('insure.covered')) + '</span></div>' +
            '<div class="mt-2 text-[9px] text-slate-500">CI pays a lump sum regardless of hospitalisation. Most group covers exclude CI and disability.</div>';

        // ── Parents workings ──────────────────────────────────────
        var pw = document.getElementById('ins-parents-workings');
        if (pw) {
            if (maxParentAge === 0) {
                pw.innerHTML = '<div class="text-slate-400 text-[10px]">Enter parent ages above to see their cover analysis.</div>';
            } else {
                pw.innerHTML =
                    '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Oldest parent age</span><span class="font-bold">' + maxParentAge + ' yrs</span></div>' +
                    '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Recommended cover (₹5L + ₹20L top-up)</span><span class="font-bold">' + insFmt(parentsNeeded) + '</span></div>' +
                    '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>− Existing parents cover</span><span class="font-bold">' + insFmt(parentsCover) + '</span></div>' +
                    '<div class="flex justify-between py-1 font-black ' + (parentsGap > 0 ? 'text-red-600' : 'text-emerald-600') + '"><span>' + (parentsGap > 0 ? _t('insure.gap_fill') : _t('insure.no_gap')) + '</span><span>' + (parentsGap > 0 ? insFmt(parentsGap) : _t('insure.covered')) + '</span></div>' +
                    '<div class="flex justify-between py-0.5 border-b border-slate-100"><span>Est. annual senior floater premium</span><span class="font-bold text-teal-700">' + insFmt(estParentsPremium) + '/yr</span></div>' +
                    '<div class="mt-2 text-[9px] text-slate-500">Senior citizen floaters have 3–4 yr waiting for pre-existing conditions. Buy when parents are still healthy (under 65).</div>';
            }
        }

        // ── Insight ───────────────────────────────────────────────
        var ins = document.getElementById('ins-insight');
        if (ins) {
            ins.classList.remove('hidden');
            var msgs = [];
            if (termGap > 0) msgs.push('Term gap <strong>' + insFmt(termGap) + '</strong> — est. premium ₹' + rateMin + '–' + rateMax + '/L/yr at age ' + age + ' (range reflects healthy non-smoker to high-risk profile). <strong>Compare live quotes on Policybazaar / Ditto / Coverfox</strong> — gender, smoking status, and pre-existing conditions move the actual price significantly.');
            else msgs.push('Term cover adequate ✅.');
            if (healthGap > 0) msgs.push('Health gap <strong>' + insFmt(healthGap) + '</strong> — add floater + ₹25L top-up (~₹15K–25K/yr).');
            else msgs.push('Health cover adequate ✅.');
            if (ciGap > 0) msgs.push('CI gap <strong>' + insFmt(ciGap) + '</strong> — add a standalone CI rider (~₹5K–15K/yr).');
            if (disabilityGap > 0) msgs.push('No disability cover — consider a group personal accident or income protection plan.');
            if (parentsNeeded > 0 && parentsGap > 0) msgs.push('Parents health gap <strong>' + insFmt(parentsGap) + '</strong> — buy senior floater before they turn 65, est. ₹' + insFmt(estParentsPremium) + '/yr.');
            if (illiquidAssets > 0) msgs.push('<span style="color:#92400e;font-weight:700">⚠️ Illiquid assets (' + insFmt(illiquidAssets) + ') excluded from cover calculation</span> — your family may not be able or willing to sell the home or vehicle after your death. The term cover above does <em>not</em> assume these are accessible.');
            ins.innerHTML = '<strong>💡 Summary:</strong> ' + msgs.join(' ');
        }

        if (typeof saveUserData === 'function') saveUserData();
    }
