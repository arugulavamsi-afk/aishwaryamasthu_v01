        // ============= EMERGENCY FUND FUNCTIONS =============
        let efMonths = 6;
        Object.defineProperty(window, '_efMonths', { get: function(){ return efMonths; } });
        let efChartInstance = null;
        let customExpenseCount = 0;

        const EF_CATEGORY_COLORS = [
            '#3b82f6','#22c55e','#f59e0b','#a855f7','#0ea5e9','#ec4899',
            '#f97316','#ef4444','#14b8a6','#84cc16','#6366f1','#f43f5e'
        ];

        function setMonths(m) {
            efMonths = m;
            [3,6,12].forEach(n => {
                const btn = document.getElementById('m-btn-' + n);
                if (n === m) {
                    btn.className = 'ef-months-btn ef-months-active flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all';
                } else {
                    btn.className = 'ef-months-btn flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all';
                }
            });
            document.getElementById('ef-months-display').innerText = m;
            document.getElementById('ef-coverage-label').innerText = _t('ef.month.fund').replace('{n}', m);
            calcEmergency();
        }

        function efFormatInput(el) {
            let val = el.value.replace(/[^0-9]/g, '');
            if (val === '' || val === '0') { el.value = '0'; el.classList.add('text-slate-400'); return; }
            let num = parseInt(val, 10);
            el.value = new Intl.NumberFormat('en-IN').format(num);
            el.classList.remove('text-slate-400');
        }

        function efGetRawValue(input) {
            return parseInt(input.value.replace(/,/g, '') || '0', 10);
        }

        function addCustomExpense() {
            customExpenseCount++;
            const icons = ['🧾','💊','🎮','📱','👗','🐾','🍽️','🎵','💇','🛠️'];
            const icon = icons[(customExpenseCount - 1) % icons.length];
            const id = 'custom-row-' + customExpenseCount;

            const div = document.createElement('div');
            div.className = 'expense-row flex items-center gap-3 group';
            div.setAttribute('data-category', 'Custom');
            div.id = id;
            div.innerHTML = `
                <div class="w-7 h-7 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-slate-100">${icon}</div>
                <input type="text" placeholder="Expense name" maxlength="24"
                    class="text-sm font-semibold text-slate-700 flex-1 min-w-0 bg-transparent border-b border-dashed border-slate-300 focus:border-amber-400 outline-none px-1 py-0.5"
                    oninput="this.closest('[data-category]').setAttribute('data-category', this.value || 'Custom')">
                <button onclick="removeCustomExpense('${id}')" class="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0" title="Remove">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <div class="relative flex-shrink-0">
                    <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                    <input type="text" value="0" inputmode="numeric"
                        class="ef-input w-32 pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-right focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition-all text-slate-400"
                        onfocus="if(this.value==='0'){this.value='';this.classList.remove('text-slate-400');}"
                        onblur="if(this.value===''||this.value==='0'){this.value='0';this.classList.add('text-slate-400');}"
                        oninput="efFormatInput(this); calcEmergency(); this.classList.remove('text-slate-400');">
                </div>`;
            document.getElementById('custom-expense-rows').appendChild(div);
            div.querySelector('input[type="text"]').focus();
        }

        function removeCustomExpense(id) {
            const el = document.getElementById(id);
            if (el) { el.remove(); calcEmergency(); }
        }

        function resetEmergencyFund() {
            // Reset all fixed expense inputs to 0
            document.querySelectorAll('#expense-rows .ef-input').forEach(input => {
                input.value = '0';
                input.classList.add('text-slate-400');
            });
            // Remove all custom rows
            document.getElementById('custom-expense-rows').innerHTML = '';
            customExpenseCount = 0;
            // Reset months to default 6
            setMonths(6);
            calcEmergency();
            if (typeof saveUserData === 'function') saveUserData();
        }

        function calcEmergency() {
            const fmt = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

            // Collect all expense rows
            const allRows = document.querySelectorAll('#expense-rows .expense-row, #custom-expense-rows .expense-row');
            let categories = [], values = [], total = 0;

            allRows.forEach((row, idx) => {
                const input = row.querySelector('.ef-input');
                if (!input) return;
                const val = efGetRawValue(input);
                const label = row.getAttribute('data-category') || 'Other';
                if (val > 0) { categories.push(label); values.push(val); }
                total += val;
            });

            // Update monthly total
            document.getElementById('ef-monthly-total').innerText = fmt(total);
            document.getElementById('ef-monthly-words').innerText = numberToWords(total);

            // Compute targets
            const t3 = total * 3, t6 = total * 6, t12 = total * 12;
            document.getElementById('ef-3m').innerText = fmt(t3);
            document.getElementById('ef-6m').innerText = fmt(t6);
            document.getElementById('ef-12m').innerText = fmt(t12);

            const target = total * efMonths;
            // Animate the main result with flip
            const efResultEl = document.getElementById('ef-total-result');
            efResultEl.classList.remove('result-flip-in');
            void efResultEl.offsetWidth;
            efResultEl.classList.add('result-flip-in');
            efResultEl.innerText = fmt(target);
            document.getElementById('ef-total-words').innerText = numberToWords(Math.round(target));
            document.getElementById('ef-coverage-label').innerText = efMonths + '-Month Emergency Fund';
            document.getElementById('ef-months-display').innerText = efMonths;

            // Chart
            if (categories.length === 0) {
                document.getElementById('ef-empty-state').classList.remove('hidden');
                document.getElementById('ef-chart-container').classList.add('hidden');
                if (efChartInstance) { efChartInstance.destroy(); efChartInstance = null; }
            } else {
                document.getElementById('ef-empty-state').classList.add('hidden');
                document.getElementById('ef-chart-container').classList.remove('hidden');
                renderEFDonutChart(categories, values);
            }
            if (typeof saveUserData === 'function') saveUserData();
        }

        function renderEFDonutChart(labels, data) {
            const ctx = document.getElementById('efChart').getContext('2d');
            if (efChartInstance) efChartInstance.destroy();
            const colors = EF_CATEGORY_COLORS.slice(0, labels.length);
            const fmt = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
            const total = data.reduce((a, b) => a + b, 0);

            efChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: { labels, datasets: [{ data, backgroundColor: colors, hoverOffset: 8, borderWidth: 2, borderColor: '#fff' }] },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '65%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(15,23,42,0.9)',
                            callbacks: {
                                label: (c) => {
                                    const pct = ((c.raw / total) * 100).toFixed(1);
                                    return `${c.label}: ${fmt(c.raw)} (${pct}%)`;
                                }
                            }
                        }
                    }
                }
            });

            // Build legend
            const legend = document.getElementById('ef-legend');
            legend.innerHTML = '';
            labels.forEach((lbl, i) => {
                const pct = ((data[i] / total) * 100).toFixed(1);
                legend.insertAdjacentHTML('beforeend', `
                    <div class="flex items-center gap-1.5 min-w-0">
                        <div class="w-2.5 h-2.5 rounded-sm flex-shrink-0" style="background:${colors[i]}"></div>
                        <span class="text-[11px] text-slate-600 truncate flex-1">${lbl}</span>
                        <span class="text-[11px] font-bold text-slate-500 flex-shrink-0">${pct}%</span>
                    </div>`);
            });
        }
        // ========== END EMERGENCY FUND FUNCTIONS ==========