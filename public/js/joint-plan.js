    // =====================================================================
    //  JOINT / FAMILY FINANCIAL PLANNER
    // =====================================================================

    function initJointPlan() {
        // Wire up goal toggle checkboxes
        ['jp-goal-edu','jp-goal-home','jp-goal-retire'].forEach(function(id) {
            var chk = document.getElementById(id);
            if (!chk) return;
            var inputId = id === 'jp-goal-edu' ? 'jp-edu-inputs' : id === 'jp-goal-home' ? 'jp-home-inputs' : 'jp-retire-inputs';
            var track = chk.parentElement.querySelector('.jp-toggle-track');
            var thumb = chk.parentElement.querySelector('.jp-toggle-thumb');
            // Sync visual state on init
            _jpSyncToggle(chk, track, thumb, inputId);
            chk.addEventListener('change', function() {
                _jpSyncToggle(chk, track, thumb, inputId);
                jointPlanCalc();
            });
        });
        jointPlanCalc();
    }

    function _jpSyncToggle(chk, track, thumb, inputId) {
        var on = chk.checked;
        if (track) track.style.background = on ? '#0ea5e9' : '#e2e8f0';
        if (thumb) thumb.style.transform = on ? 'translateX(16px)' : 'translateX(0)';
        var inp = document.getElementById(inputId);
        if (inp) inp.classList.toggle('hidden', !on);
    }

    function jpFmt(el) {
        var raw = el.value.replace(/[^0-9]/g, '');
        if (!raw) return;
        el.value = jpComma(parseInt(raw, 10));
        el.classList.remove('text-slate-400');
    }

    function jpComma(n) {
        if (isNaN(n)) return '';
        var s = Math.round(n).toString();
        if (s.length <= 3) return s;
        var last3 = s.slice(-3);
        var rest = s.slice(0, -3);
        return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
    }

    function jpParseMoney(id) {
        var el = document.getElementById(id);
        if (!el) return 0;
        var v = parseFloat(el.value.replace(/[^0-9.]/g, '')) || 0;
        return v;
    }

    function jpInrFmt(n) {
        if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr';
        if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L';
        return '₹' + jpComma(Math.round(n));
    }

    function jointPlanCalc() {
        // Read partner values
        var p1Income    = jpParseMoney('jp-p1-income') * 12;    // annual
        var p2Income    = jpParseMoney('jp-p2-income') * 12;
        var p1Invest    = jpParseMoney('jp-p1-invest');          // monthly
        var p2Invest    = jpParseMoney('jp-p2-invest');
        var p1Portfolio = jpParseMoney('jp-p1-portfolio');
        var p2Portfolio = jpParseMoney('jp-p2-portfolio');
        var p1SlabEl = document.getElementById('jp-p1-slab');
        var p2SlabEl = document.getElementById('jp-p2-slab');
        var p1Slab   = p1SlabEl && p1SlabEl.value !== '' ? parseInt(p1SlabEl.value) : 20;
        var p2Slab   = p2SlabEl && p2SlabEl.value !== '' ? parseInt(p2SlabEl.value) : 20;
        var retRate     = (parseFloat(document.getElementById('jp-return').value) || 12) / 100;

        var combinedMonthly = p1Invest + p2Invest;
        var combinedAnnualIncome = p1Income + p2Income;
        var totalPortfolio = p1Portfolio + p2Portfolio;
        var savingsRate = combinedAnnualIncome > 0 ? (combinedMonthly * 12 / combinedAnnualIncome * 100) : 0;

        // Update summary card
        document.getElementById('jp-res-income').textContent = jpInrFmt(combinedAnnualIncome / 12) + '/mo';
        document.getElementById('jp-res-invest').textContent = jpInrFmt(combinedMonthly) + '/mo';
        document.getElementById('jp-res-rate').textContent = savingsRate.toFixed(1) + '%';
        document.getElementById('jp-res-portfolio').textContent = jpInrFmt(totalPortfolio);

        // LTCG calculations — ₹1.25L exemption per person per year
        // Assumption: portfolio returns ~12%, of which LTCG = ~8-10% gains
        var ltcgExemption = 125000;
        var p1GainRate = 0.10;  // assumed annual gain % of portfolio
        var p2GainRate = 0.10;
        var p1AnnualGains = p1Portfolio * p1GainRate;
        var p2AnnualGains = p2Portfolio * p2GainRate;

        // Tax saved = min(gains, exemption) * tax_rate / 100
        // If gains > exemption, harvesting saves: exemption * rate
        // If gains < exemption, saves: gains * rate (all tax-free)
        var p1LtcgSave = Math.min(p1AnnualGains, ltcgExemption) * (p1Slab / 100) + (p1AnnualGains > ltcgExemption ? (p1AnnualGains - ltcgExemption) * 0.125 - p1AnnualGains * 0.125 : 0);
        // Simplified: benefit of harvesting = gains_up_to_1.25L taxed at 0 instead of 12.5%
        p1LtcgSave = Math.min(p1AnnualGains, ltcgExemption) * 0.125;
        var p2LtcgSave = Math.min(p2AnnualGains, ltcgExemption) * 0.125;
        var totalLtcgSave = p1LtcgSave + p2LtcgSave;

        document.getElementById('jp-ltcg-p1-save').textContent = jpInrFmt(p1LtcgSave) + '/yr';
        document.getElementById('jp-ltcg-p2-save').textContent = jpInrFmt(p2LtcgSave) + '/yr';
        document.getElementById('jp-ltcg-total-save').textContent = jpInrFmt(totalLtcgSave) + '/yr';
        document.getElementById('jp-ltcg-10yr').textContent = jpInrFmt(totalLtcgSave * 10);

        // Investment split advice
        var p1Name = document.getElementById('jp-p1-name').value.trim() || 'Partner 1';
        var p2Name = document.getElementById('jp-p2-name').value.trim() || 'Partner 2';
        var splitHtml = '';
        if (combinedMonthly > 0) {
            // Higher LTCG potential goes to higher portfolio holder
            // More equity to lower slab
            var higherSlabName = p1Slab >= p2Slab ? p1Name : p2Name;
            var lowerSlabName  = p1Slab < p2Slab  ? p1Name : p2Name;
            var higherSlabPct  = Math.max(p1Slab, p2Slab);
            var lowerSlabPct   = Math.min(p1Slab, p2Slab);
            var p1Pct = Math.round((p1Invest / (combinedMonthly || 1)) * 100);
            var p2Pct = 100 - p1Pct;

            splitHtml += '<div class="flex justify-between items-center py-1 border-b border-slate-100">';
            splitHtml += '<span class="text-slate-600">' + p1Name + ' (' + p1Slab + '% slab)</span>';
            splitHtml += '<span class="font-black text-slate-800">' + jpInrFmt(p1Invest) + '/mo (' + p1Pct + '%)</span></div>';
            splitHtml += '<div class="flex justify-between items-center py-1 border-b border-slate-100">';
            splitHtml += '<span class="text-slate-600">' + p2Name + ' (' + p2Slab + '% slab)</span>';
            splitHtml += '<span class="font-black text-slate-800">' + jpInrFmt(p2Invest) + '/mo (' + p2Pct + '%)</span></div>';

            if (p1Slab !== p2Slab) {
                splitHtml += '<div class="mt-2 px-2 py-1.5 rounded-lg text-[9px] leading-relaxed" style="background:#fffbeb;border:1px solid #fde68a;color:#78350f;">';
                splitHtml += '💡 Route FD/debt instruments through <strong>' + lowerSlabName + '</strong> (' + lowerSlabPct + '% slab) to save ';
                splitHtml += (higherSlabPct - lowerSlabPct) + '% tax on interest income.</div>';
            }

            // 80C advice
            var p1_80c_used = jpParseMoney('jp-p1-80c');
            var p2_80c_used = jpParseMoney('jp-p2-80c');
            var p1_80c_left = Math.max(0, 150000 - p1_80c_used);
            var p2_80c_left = Math.max(0, 150000 - p2_80c_used);
            if (p1_80c_left > 0 || p2_80c_left > 0) {
                splitHtml += '<div class="mt-2 px-2 py-1.5 rounded-lg text-[9px] leading-relaxed" style="background:#f0fdf4;border:1px solid #86efac;color:#14532d;">';
                if (p1_80c_left > 0) splitHtml += '✅ ' + p1Name + ': ₹' + jpComma(p1_80c_left) + ' 80C room left. ';
                if (p2_80c_left > 0) splitHtml += '✅ ' + p2Name + ': ₹' + jpComma(p2_80c_left) + ' 80C room left. ';
                splitHtml += 'ELSS SIP counts toward 80C.</div>';
            }
        } else {
            splitHtml = '<div class="text-slate-400 text-[10px]">Enter monthly investment amounts to see split recommendations</div>';
        }
        document.getElementById('jp-split-content').innerHTML = splitHtml;

        // Goals calculation
        var goalHtml = '';
        var eduActive    = document.getElementById('jp-goal-edu').checked;
        var homeActive   = document.getElementById('jp-goal-home').checked;
        var retireActive = document.getElementById('jp-goal-retire').checked;

        function sipNeeded(fv, r, n) {
            // Monthly SIP for FV = SIP * [((1+r/12)^n - 1) / (r/12)] * (1+r/12)
            var rm = r / 12;
            var months = n * 12;
            if (rm === 0) return fv / months;
            return fv * rm / (Math.pow(1 + rm, months) - 1) / (1 + rm);
        }

        function goalCard(emoji, label, todayCost, years, inflRate, color, border) {
            var eduInfl = inflRate / 100;
            var fv = todayCost * Math.pow(1 + eduInfl, years);
            var sip = sipNeeded(fv, retRate, years);
            var combinedCorpus = p1Portfolio + p2Portfolio;
            var existingGrowth = combinedCorpus * Math.pow(1 + retRate, years);
            var sipAfterExisting = Math.max(0, sipNeeded(Math.max(0, fv - existingGrowth), retRate, years));

            return '<div class="rounded-2xl p-3" style="background:' + color + ';border:1px solid ' + border + ';">' +
                '<div class="flex items-center gap-1.5 mb-2"><span class="text-base">' + emoji + '</span>' +
                '<span class="text-[10px] font-black text-slate-700 uppercase tracking-wider">' + label + '</span></div>' +
                '<div class="grid grid-cols-3 gap-1.5 text-center">' +
                '<div><div class="text-[8px] text-slate-500 uppercase font-bold">Future Cost</div><div class="text-sm font-black text-slate-800">' + jpInrFmt(fv) + '</div></div>' +
                '<div><div class="text-[8px] text-slate-500 uppercase font-bold">Monthly SIP</div><div class="text-sm font-black text-emerald-700">' + jpInrFmt(sip) + '</div></div>' +
                '<div><div class="text-[8px] text-slate-500 uppercase font-bold">Adjusted SIP</div><div class="text-sm font-black text-sky-700">' + jpInrFmt(sipAfterExisting) + '</div><div class="text-[8px] text-slate-400">after existing corpus</div></div>' +
                '</div></div>';
        }

        if (eduActive) {
            var eduCost  = jpParseMoney('jp-edu-cost')  || 2000000;
            var eduYears = parseFloat(document.getElementById('jp-edu-years').value) || 15;
            goalHtml += goalCard('🎓', "Child's Education", eduCost, eduYears, 10, '#f0f9ff', '#bae6fd');
        }
        if (homeActive) {
            var homeCost  = jpParseMoney('jp-home-cost')  || 6000000;
            var homeYears = parseFloat(document.getElementById('jp-home-years').value) || 5;
            goalHtml += goalCard('🏠', 'Home Purchase (Down Payment)', homeCost, homeYears, 6, '#f0fdf4', '#86efac');
        }
        if (retireActive) {
            var retireAge     = parseFloat(document.getElementById('jp-retire-age').value) || 35;
            var retireMonthly = jpParseMoney('jp-retire-monthly') || 100000;
            var yearsToRetire = Math.max(1, 60 - retireAge);
            // Corpus = (monthly * 12 / 0.04) — 4% SWR
            var retireCorpus  = retireMonthly * 12 / 0.04;
            goalHtml += goalCard('🌅', 'Joint Retirement Corpus', retireCorpus, yearsToRetire, 7, '#fdf4ff', '#e9d5ff');
        }

        var goalsDiv = document.getElementById('jp-goals-results');
        goalsDiv.className = 'grid grid-cols-1 sm:grid-cols-' + ([eduActive, homeActive, retireActive].filter(Boolean).length || 1) + ' gap-2';
        if (goalHtml) {
            goalsDiv.innerHTML = goalHtml;
            goalsDiv.classList.remove('hidden');
        } else {
            goalsDiv.classList.add('hidden');
        }

        // Insight strip
        var insight = document.getElementById('jp-insight');
        if (combinedMonthly > 0) {
            var monthsToDouble = Math.round(72 / ((retRate * 100))) ;
            var insights = [];
            if (savingsRate >= 30) insights.push('🌟 Your household savings rate of <strong>' + savingsRate.toFixed(1) + '%</strong> is excellent — well above the recommended 20%.');
            else if (savingsRate >= 15) insights.push('👍 Your combined savings rate of <strong>' + savingsRate.toFixed(1) + '%</strong> is on track. Aim for 25–30% for faster financial independence.');
            else insights.push('⚠️ Savings rate of <strong>' + savingsRate.toFixed(1) + '%</strong> is below 15%. Try to cut discretionary spend and increase SIPs.');
            if (totalLtcgSave > 0) insights.push('💰 By harvesting LTCG yearly, your family saves <strong>' + jpInrFmt(totalLtcgSave) + ' per year</strong> — that\'s <strong>' + jpInrFmt(totalLtcgSave * 10) + ' over 10 years</strong> entirely legally.');
            if (combinedMonthly > 0) insights.push('📈 At ' + (retRate * 100).toFixed(0) + '% p.a., your combined ₹' + jpInrFmt(combinedMonthly) + '/mo SIP becomes <strong>' + jpInrFmt(combinedMonthly * 12 * ((Math.pow(1 + retRate / 12, 120) - 1) / (retRate / 12))) + ' in 10 years</strong>.');
            insight.innerHTML = insights.join(' &nbsp;·&nbsp; ');
            insight.classList.remove('hidden');
        } else {
            insight.classList.add('hidden');
        }
        if (typeof saveUserData === 'function') saveUserData();
    }

    function resetJointPlan() {
        var defaults = {
            'jp-p1-name': '', 'jp-p2-name': '',
            'jp-p1-income': '1,20,000', 'jp-p2-income': '90,000',
            'jp-p1-invest': '25,000',  'jp-p2-invest': '18,000',
            'jp-p1-portfolio': '5,00,000', 'jp-p2-portfolio': '2,50,000',
            'jp-p1-80c': '1,50,000',   'jp-p2-80c': '1,50,000',
            'jp-edu-cost': '20,00,000', 'jp-edu-years': '15',
            'jp-home-cost': '60,00,000', 'jp-home-years': '5',
            'jp-retire-age': '35', 'jp-retire-monthly': '1,00,000',
            'jp-return': '12'
        };
        Object.keys(defaults).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) { el.value = defaults[id]; el.classList.add('text-slate-400'); }
        });
        document.getElementById('jp-p1-slab').value = '20';
        document.getElementById('jp-p2-slab').value = '30';
        document.getElementById('jp-goal-edu').checked    = true;
        document.getElementById('jp-goal-home').checked   = false;
        document.getElementById('jp-goal-retire').checked = false;
        initJointPlan();
    }

    function jpPreset(name) {
        var p = {
            starter:    { p1i:'80,000',   p2i:'60,000',   p1inv:'15,000', p2inv:'10,000', p1port:'1,50,000', p2port:'75,000',   p1s:10, p2s:5,  ret:12 },
            midcareer:  { p1i:'1,20,000', p2i:'90,000',   p1inv:'25,000', p2inv:'18,000', p1port:'5,00,000', p2port:'2,50,000', p1s:20, p2s:20, ret:12 },
            senior:     { p1i:'2,50,000', p2i:'1,80,000', p1inv:'60,000', p2inv:'40,000', p1port:'40,00,000',p2port:'25,00,000',p1s:30, p2s:30, ret:12 }
        };
        var d = p[name];
        if (!d) return;
        var map = {
            'jp-p1-income': d.p1i, 'jp-p2-income': d.p2i,
            'jp-p1-invest': d.p1inv, 'jp-p2-invest': d.p2inv,
            'jp-p1-portfolio': d.p1port, 'jp-p2-portfolio': d.p2port,
            'jp-return': d.ret
        };
        Object.keys(map).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) { el.value = map[id]; el.classList.remove('text-slate-400'); }
        });
        document.getElementById('jp-p1-slab').value = d.p1s;
        document.getElementById('jp-p2-slab').value = d.p2s;
        document.getElementById('jp-goal-edu').checked  = true;
        document.getElementById('jp-goal-home').checked = name === 'senior';
        initJointPlan();
    }
