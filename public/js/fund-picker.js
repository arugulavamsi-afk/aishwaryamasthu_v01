        // ===== FUND PICKER GUIDE PAGE =====

        function filterPickerMetrics(cat) {
            _pickerCurrentFilter = cat;
            ['all','returns','risk','cost','structure'].forEach(function(f) {
                var btn = document.getElementById('picker-f-' + f);
                if (btn) btn.className = (f === cat)
                    ? 'mf-filter-active text-xs font-bold px-3 py-1.5 rounded-full transition-all'
                    : 'mf-filter-inactive text-xs font-bold px-3 py-1.5 rounded-full transition-all';
            });
            document.querySelectorAll('#picker-metric-cards .picker-card').forEach(function(card) {
                var cardCat = card.dataset.pickerCat;
                var show = (cat === 'all' || cardCat === cat);
                card.style.display = show ? '' : 'none';
                if (show) { card.classList.remove('picker-card-anim'); void card.offsetWidth; card.classList.add('picker-card-anim'); }
            });
        }

        function renderFundPickerPage() {
            if (_pickerRendered) return;
            _pickerRendered = true;

            // ── Metric Cards ──────────────────────────────────────────────
            var grid = document.getElementById('picker-metric-cards');
            if (!grid) return;
            grid.innerHTML = '';
            MF_METRICS.forEach(function(m, idx) {
                var cat = PICKER_METRIC_CATEGORY[m.id] || 'returns';
                var isAUMQuickRef     = m.id === 'aumquickref';
                var isDirectVsRegular = m.id === 'directvsregular';
                var isExitLoad        = m.id === 'exitloadtax';
                var isNewCard = ['directvsregular','exitloadtax','aumquickref'].includes(m.id);
                var newBadge  = isNewCard
                    ? '<span class="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide">' + _t('picker.mustknow') + '</span>'
                    : '';

                var directVsRegularBody =
                    '<div class="px-4 py-3 space-y-2.5">' +
                        '<p class="text-[11px] text-slate-600 leading-relaxed">' + _mMetricDesc(m.id, m.description) + '</p>' +
                        '<div class="grid grid-cols-2 gap-2">' +
                            '<div class="rounded-xl p-3 border-2 border-emerald-200 bg-emerald-50 text-center">' +
                                '<div class="text-lg mb-1">🎯</div>' +
                                '<div class="text-[10px] font-black text-emerald-800 uppercase tracking-wide">Direct Plan</div>' +
                                '<div class="text-xs font-black text-emerald-700 mt-1">₹1.37 Cr</div>' +
                                '<div class="text-[9px] text-emerald-600 font-medium">₹10K SIP × 20 yrs</div>' +
                                '<div class="mt-1.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 rounded-lg px-1.5 py-0.5">You keep 100%</div>' +
                            '</div>' +
                            '<div class="rounded-xl p-3 border-2 border-rose-200 bg-rose-50 text-center">' +
                                '<div class="text-lg mb-1">💸</div>' +
                                '<div class="text-[10px] font-black text-rose-800 uppercase tracking-wide">Regular Plan</div>' +
                                '<div class="text-xs font-black text-rose-700 mt-1">₹1.09 Cr</div>' +
                                '<div class="text-[9px] text-rose-600 font-medium">Same SIP × 20 yrs</div>' +
                                '<div class="mt-1.5 text-[9px] font-bold text-rose-700 bg-rose-100 rounded-lg px-1.5 py-0.5">₹28L lost to fees</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">' +
                            '<div class="text-[9px] font-black text-blue-700 uppercase tracking-wider mb-0.5">' + _t('picker.protip') + '</div>' +
                            '<p class="text-[10px] text-blue-800 leading-relaxed">' + _mMetricTip(m.id, m.tip) + '</p>' +
                        '</div>' +
                    '</div>';

                var exitLoadBody =
                    '<div class="px-4 py-3 space-y-2.5">' +
                        '<p class="text-[11px] text-slate-600 leading-relaxed">' + _mMetricDesc(m.id, m.description) + '</p>' +
                        '<div class="rounded-xl overflow-hidden border border-[#f5c842]/30">' +
                            '<div class="grid grid-cols-3 bg-slate-100 text-[8px] font-black text-slate-500 uppercase tracking-wide">' +
                                '<div class="px-2 py-1.5">Fund Type</div>' +
                                '<div class="px-2 py-1.5 text-center">Holding</div>' +
                                '<div class="px-2 py-1.5 text-right">Tax Rate</div>' +
                            '</div>' +
                            '<div class="divide-y divide-slate-100 text-[10px]">' +
                                '<div class="grid grid-cols-3 px-2 py-1.5 bg-white"><span class="font-bold text-slate-700">Equity MF</span><span class="text-center text-slate-500">&gt;1 yr</span><span class="text-right font-black text-emerald-700">12.5% LTCG</span></div>' +
                                '<div class="grid grid-cols-3 px-2 py-1.5 bg-slate-50"><span class="font-bold text-slate-700">Equity MF</span><span class="text-center text-slate-500">&lt;1 yr</span><span class="text-right font-black text-rose-600">20% STCG</span></div>' +
                                '<div class="grid grid-cols-3 px-2 py-1.5 bg-white"><span class="font-bold text-slate-700">Debt MF</span><span class="text-center text-slate-500">Any</span><span class="text-right font-black text-amber-600">Slab rate</span></div>' +
                                '<div class="grid grid-cols-3 px-2 py-1.5 bg-slate-50"><span class="font-bold text-slate-700">ELSS</span><span class="text-center text-slate-500">3 yr lock</span><span class="text-right font-black text-emerald-700">12.5% LTCG</span></div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">' +
                            '<span class="text-amber-500 font-black text-xs mt-0.5 flex-shrink-0">!</span>' +
                            '<p class="text-[10px] text-amber-800 leading-relaxed">' + m.tip + '</p>' +
                        '</div>' +
                    '</div>';

                var defaultBody =
                    '<div class="px-4 py-3 space-y-2.5">' +
                        '<p class="text-[11px] text-slate-600 leading-relaxed">' + _mMetricDesc(m.id, m.description) + '</p>' +
                        '<div class="flex flex-col gap-1.5">' +
                            '<div class="flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1.5">' +
                                '<span class="text-green-500 font-black text-xs mt-0.5 flex-shrink-0">✓</span>' +
                                '<div>' +
                                    '<div class="text-[9px] font-black text-green-700 uppercase tracking-wider">' + _t('picker.good') + ': ' + _mMetricGoodLabel(m.id, m.goodLabel) + '</div>' +
                                    '<div class="text-[10px] text-green-800 font-medium">' + _mMetricGoodRange(m.id, m.goodRange) + '</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">' +
                                '<span class="text-red-500 font-black text-xs mt-0.5 flex-shrink-0">✗</span>' +
                                '<div>' +
                                    '<div class="text-[9px] font-black text-red-700 uppercase tracking-wider">' + _t('picker.watchout') + ': ' + _mMetricBadLabel(m.id, m.badLabel) + '</div>' +
                                    '<div class="text-[10px] text-red-800 font-medium">' + _mMetricBadRange(m.id, m.badRange) + '</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">' +
                            '<div class="text-[9px] font-black text-blue-700 uppercase tracking-wider mb-0.5">' + _t('picker.protip') + '</div>' +
                            '<p class="text-[10px] text-blue-800 leading-relaxed">' + _mMetricTip(m.id, m.tip) + '</p>' +
                        '</div>' +
                        '<div class="bg-slate-50 border border-[#f5c842]/30 rounded-lg px-2.5 py-1.5">' +
                            '<div class="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-0.5">' + _t('picker.eg') + '</div>' +
                            '<p class="text-[10px] text-slate-700 leading-relaxed">' + _mMetricExample(m.id, m.example) + '</p>' +
                        '</div>' +
                    '</div>';

                var bodyContent = isAUMQuickRef     ? renderAUMQuickRefCard()
                                : isDirectVsRegular ? directVsRegularBody
                                : isExitLoad        ? exitLoadBody
                                :                     defaultBody;

                var catLabel = { returns:_t('picker.cat.returns'), risk:_t('picker.cat.risk'), cost:_t('picker.cat.cost'), structure:_t('picker.cat.structure') };
                var catColor = { returns:'#2563eb', risk:'#7c3aed', cost:'#dc2626', structure:'#0891b2' };
                var catBadge = '<span class="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style="background:' +
                               (catColor[cat]||'#6366f1') + '18;color:' + (catColor[cat]||'#6366f1') + ';">' +
                               (catLabel[cat]||cat) + '</span>';

                grid.insertAdjacentHTML('beforeend',
                    '<div class="picker-card picker-card-anim bg-white border border-[#f5c842]/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow" data-picker-cat="' + cat + '">' +
                        '<div class="px-4 pt-4 pb-3 border-b border-slate-100" style="background: linear-gradient(135deg, ' + m.goodColor + '0d 0%, ' + m.goodColor + '05 100%);">' +
                            '<div class="flex items-center gap-2 mb-1 flex-wrap">' +
                                '<span class="text-xl">' + m.icon + '</span>' +
                                '<span class="text-sm font-black text-slate-800">' + _mMetricName(m.id, m.name) + '</span>' +
                                catBadge +
                                newBadge +
                            '</div>' +
                            '<p class="text-[11px] text-slate-500 leading-snug">' + _mMetricTagline(m.id, m.tagline) + '</p>' +
                            '<div class="mt-2.5 flex items-center gap-2">' +
                                '<div class="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">' +
                                    '<div class="h-full rounded-full transition-all duration-1000" style="width:' + m.meter + '%; background:' + m.meterColor + ';"></div>' +
                                '</div>' +
                                '<span class="text-[9px] font-bold text-slate-400 uppercase tracking-wide">importance</span>' +
                            '</div>' +
                        '</div>' +
                        bodyContent +
                    '</div>'
                );
            });

            // ── Checklist ─────────────────────────────────────────────────
            var checklist = document.getElementById('picker-checklist');
            if (checklist) {
                checklist.innerHTML = '';
                MF_CHECKLIST.forEach(function(item) {
                    checklist.insertAdjacentHTML('beforeend',
                        '<div class="flex flex-col gap-1.5 bg-slate-50 border border-[#f5c842]/30 rounded-xl p-3 h-full">' +
                            '<div class="flex items-start gap-2">' +
                                '<span class="text-base flex-shrink-0 mt-0.5">' + item.icon + '</span>' +
                                '<span class="text-xs font-black text-slate-800 leading-snug">' + item.question + '</span>' +
                            '</div>' +
                            '<div class="flex flex-col gap-1 pl-1 flex-1 justify-end">' +
                                '<div class="flex items-start gap-1.5">' +
                                    '<span class="text-[10px] font-black text-green-600 flex-shrink-0">✓ YES:</span>' +
                                    '<span class="text-[10px] text-green-700 leading-snug">' + item.pass + '</span>' +
                                '</div>' +
                                '<div class="flex items-start gap-1.5">' +
                                    '<span class="text-[10px] font-black text-red-500 flex-shrink-0">✗ NO:</span>' +
                                    '<span class="text-[10px] text-red-700 leading-snug">' + item.fail + '</span>' +
                                '</div>' +
                            '</div>' +
                        '</div>'
                    );
                });
            }

            // ── Comparison Table ──────────────────────────────────────────
            var tableWrap = document.getElementById('picker-comparison-table-wrap');
            if (tableWrap) {
                // Find the overflow-x-auto scroll wrapper inside mfkit-panel
                var mfPanel   = document.getElementById('mfkit-panel');
                var srcScroll = mfPanel ? mfPanel.querySelector('.overflow-x-auto') : null;
                if (srcScroll) {
                    var clone = srcScroll.cloneNode(true);
                    tableWrap.appendChild(clone);
                }
            }
        }

                function getMFCategoryColors(category) {
            const map = {
                equity:  { color: '#2563eb', bg: '#eff6ff', badge: '#bfdbfe' },
                debt:    { color: '#059669', bg: '#ecfdf5', badge: '#a7f3d0' },
                hybrid:  { color: '#b45309', bg: '#fffbeb', badge: '#fde68a' },
                tax:     { color: '#7c3aed', bg: '#f5f3ff', badge: '#ddd6fe' },
                passive: { color: '#0891b2', bg: '#ecfeff', badge: '#a5f3fc' },
                others:  { color: '#0f766e', bg: '#f0fdfa', badge: '#99f6e4' }
            };
            return map[category] || map.equity;
        }

        function renderMFKit() {
            if (_mfRendered) return;
            _mfRendered = true;
            const grid = document.getElementById('mf-tiles-grid');
            grid.innerHTML = '';
            MF_DATA.forEach((fund, idx) => {
                const c = getMFCategoryColors(fund.category);
                const riskColors = ['','#16a34a','#65a30d','#ca8a04','#ea580c','#dc2626'];
                const riskColor = riskColors[fund.risk];
                let dots = '';
                for (let d = 1; d <= 5; d++) {
                    dots += `<div style="width:9px;height:9px;border-radius:50%;background:${d <= fund.risk ? riskColor : '#e2e8f0'};flex-shrink:0;"></div>`;
                }
                grid.insertAdjacentHTML('beforeend', `
                    <div class="mf-tile invest-card border border-[#f5c842]/30 rounded-xl p-3 bg-white cursor-pointer group relative overflow-hidden"
                         data-category="${fund.category}" data-id="${fund.id}"
                         style="border-left: 3px solid ${c.color};"
                         onclick="openMFModal(${idx})">
                        <div class="flex items-start justify-between gap-2 mb-1.5">
                            <div class="font-bold text-sm text-slate-800 leading-tight">${fund.icon} ${_mfName(fund.id, fund.name)}</div>
                            <span class="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0" style="background:${c.badge};color:${c.color}">${fund.categoryLabel}</span>
                        </div>
                        <div class="text-[11px] text-slate-500 mb-2.5 leading-snug">${_mfTag(fund.id, fund.tagline)}</div>
                        <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                            <div class="flex flex-col gap-0.5">
                                <span class="text-[9px] font-bold text-slate-400 uppercase">${_t('mf.returns')}</span>
                                <span class="text-xs font-black" style="color:${c.color}">${fund.returns}</span>
                            </div>
                            <div class="flex flex-col items-center gap-0.5">
                                <span class="text-[9px] font-bold text-slate-400 uppercase">${_t('mf.horizon')}</span>
                                <span class="text-xs font-bold text-slate-600">${fund.horizon}</span>
                            </div>
                            <div class="flex flex-col items-end gap-0.5">
                                <div class="flex items-center gap-0.5">${dots}</div>
                                <span class="text-[9px] font-bold" style="color:${riskColor}">${_mfRisk(fund.riskLabel)}</span>
                            </div>
                        </div>
                        <div class="flex items-center justify-end mt-2">
                            <span class="text-[10px] font-semibold text-slate-400 group-hover:text-emerald-600 transition-colors flex items-center gap-0.5">${_t('mf.details')} <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
                        </div>
                        <div class="absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-emerald-300 transition-all pointer-events-none"></div>
                    </div>
                `);
            });
            renderMFPickerSection();
        }

        function filterMF(category) {
            _mfCurrentFilter = category;
            ['all','equity','debt','hybrid','tax','passive','others'].forEach(f => {
                const btn = document.getElementById('mf-f-' + f);
                if (btn) btn.className = (f === category) ? 'mf-filter-active text-xs font-bold px-3 py-1.5 rounded-full transition-all' : 'mf-filter-inactive text-xs font-bold px-3 py-1.5 rounded-full transition-all';
            });
            const tiles = document.querySelectorAll('#mf-tiles-grid .mf-tile');
            tiles.forEach(tile => {
                if (category === 'all' || tile.dataset.category === category) {
                    tile.classList.remove('mf-tile-hidden');
                } else {
                    tile.classList.add('mf-tile-hidden');
                }
            });
        }

        function openMFModal(idx) {
            const fund = MF_DATA[idx];
            if (!fund) return;
            const c = getMFCategoryColors(fund.category);
            const riskColors = ['','#16a34a','#65a30d','#ca8a04','#ea580c','#dc2626'];
            const riskColor = riskColors[fund.risk];
            const header = document.getElementById('mf-modal-header');
            header.style.background = c.bg;
            document.getElementById('mf-modal-icon').innerText = fund.icon;
            document.getElementById('mf-modal-name').innerText = _mfName(fund.id, fund.name);
            document.getElementById('mf-modal-returns').innerText = fund.returns;
            document.getElementById('mf-modal-returns').style.color = c.color;
            document.getElementById('mf-modal-horizon').innerText = fund.horizon;
            document.getElementById('mf-modal-risk-label').innerText = _mfRisk(fund.riskLabel);
            document.getElementById('mf-modal-risk-label').style.color = riskColor;
            const badge = document.getElementById('mf-modal-category-badge');
            badge.innerText = _mfCat(fund.categoryLabel);
            badge.style.background = c.badge;
            badge.style.color = c.color;
            let dots = '';
            for (let d = 1; d <= 5; d++) {
                dots += `<div style="width:11px;height:11px;border-radius:50%;background:${d <= fund.risk ? riskColor : '#e2e8f0'};flex-shrink:0;"></div>`;
            }
            document.getElementById('mf-modal-risk-dots').innerHTML = dots;
            document.getElementById('mf-modal-what').innerText = _mfWhat(fund.id, fund.what);
            document.getElementById('mf-modal-scenarios').innerText = _mfScenarios(fund.id, fund.scenarios);
            document.getElementById('mf-modal-avoid').innerText = _mfAvoid(fund.id, fund.avoid);
            document.getElementById('mf-modal-example').innerText = _mfExampleModal(fund.id, fund.example);
            const modal = document.getElementById('mf-modal');
            modal.classList.remove('hidden');
            const card = modal.querySelector('.animate-modal');
            card.style.animation = 'none';
            requestAnimationFrame(() => { card.style.animation = ''; });
        }

        function closeMFModal(event) {
            const modal = document.getElementById('mf-modal');
            if (event.target === modal || event.target === modal.querySelector('.absolute.inset-0')) {
                modal.classList.add('hidden');
            }
        }