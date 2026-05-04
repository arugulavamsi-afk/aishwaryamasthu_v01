    /* ═══════════════════════════════════════════════════════════════
       FUND COMPARATOR
       State: _mfcFunds — array of fund objects from _mfeList
       Up to 5 funds. Reuses mfeCompute / mfeFetchCatBench / mfeSignalHtml.
       Persists fund codes to localStorage.
    ═══════════════════════════════════════════════════════════════ */
    const MFC_MAX = 5;
    const MFC_STORE_KEY = 'am_mfc_funds';
    let _mfcFunds  = [];   // [{code,name,amc,cat}]
    let _mfcMet    = {};   // code → computed metrics (or null)
    let _mfcNav    = {};   // code → {nav,date}
    let _mfcAcIdx  = -1;   // autocomplete keyboard cursor

    /* ── Persist / restore ── */
    function mfcSave() {
        try { localStorage.setItem(MFC_STORE_KEY, JSON.stringify(_mfcFunds.map(f=>f.code))); } catch {}
    }
    function mfcRestore() {
        try {
            const codes = JSON.parse(localStorage.getItem(MFC_STORE_KEY)||'[]');
            if (!codes.length || !_mfeReady) return;
            codes.forEach(code => {
                const f = _mfeList.find(x => x.code === code);
                if (f && !_mfcFunds.find(x=>x.code===code)) _mfcFunds.push(f);
            });
            if (_mfcFunds.length) {
                mfcRenderChips();
                mfcFetchAndRender();
                if (typeof mfeUpdateCompareBtns === 'function') mfeUpdateCompareBtns();
                if (typeof mfeUpdateCompareBridge === 'function') mfeUpdateCompareBridge();
            }
        } catch {}
    }

    /* ── Search autocomplete ── */
    function mfcOnSearch() {
        const q = (document.getElementById('mfc-search')?.value||'').toLowerCase().trim();
        const ac = document.getElementById('mfc-autocomplete');
        if (!ac) return;
        if (!q || !_mfeReady) { ac.classList.add('hidden'); return; }
        const hits = _mfeList.filter(f =>
            f.name.toLowerCase().includes(q) || f.amc.toLowerCase().includes(q)
        ).slice(0, 8);
        if (!hits.length) { ac.classList.add('hidden'); return; }
        _mfcAcIdx = -1;
        ac.innerHTML = hits.map((f, i) => {
            const already = _mfcFunds.find(x=>x.code===f.code);
            return `<div class="mfc-ac-item" data-idx="${i}" data-code="${f.code}"
                onclick="mfcPickAc('${f.code}')">
                <span class="mfc-ac-name">${_esc(f.name)}</span>
                <span class="mfc-ac-meta">${_esc(f.amc)} · ${f.cat}
                    ${already?'<span class="mfc-ac-added">✓ Added</span>':''}</span>
            </div>`;
        }).join('');
        ac.classList.remove('hidden');
    }
    function mfcKeyNav(e) {
        const ac = document.getElementById('mfc-autocomplete');
        if (!ac || ac.classList.contains('hidden')) return;
        const items = ac.querySelectorAll('.mfc-ac-item');
        if (e.key === 'ArrowDown') { e.preventDefault(); _mfcAcIdx = Math.min(_mfcAcIdx+1, items.length-1); mfcHilite(items); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); _mfcAcIdx = Math.max(_mfcAcIdx-1, 0); mfcHilite(items); }
        else if (e.key === 'Enter' && _mfcAcIdx >= 0) { e.preventDefault(); items[_mfcAcIdx]?.click(); }
        else if (e.key === 'Escape') { ac.classList.add('hidden'); }
    }
    function mfcHilite(items) {
        items.forEach((el,i) => el.classList.toggle('mfc-ac-sel', i===_mfcAcIdx));
    }
    document.addEventListener('click', e => {
        if (!e.target.closest('#mfc-search-wrap')) {
            document.getElementById('mfc-autocomplete')?.classList.add('hidden');
        }
    });
    function mfcPickAc(code) {
        document.getElementById('mfc-autocomplete')?.classList.add('hidden');
        document.getElementById('mfc-search').value = '';
        if (_mfcFunds.find(f=>f.code===code)) return; // already added
        if (_mfcFunds.length >= MFC_MAX) {
            alert(`Maximum ${MFC_MAX} funds can be compared at once.`); return;
        }
        const f = _mfeList.find(x=>x.code===code);
        if (!f) return;
        _mfcFunds.push(f);
        mfcSave();
        mfcRenderChips();
        mfcFetchAndRender();
        if (typeof mfeUpdateCompareBtns === 'function') mfeUpdateCompareBtns();
        if (typeof mfeUpdateCompareBridge === 'function') mfeUpdateCompareBridge();
    }
    function mfcRemove(code) {
        _mfcFunds = _mfcFunds.filter(f=>f.code!==code);
        mfcSave();
        mfcRenderChips();
        if (_mfcFunds.length) mfcRenderTable(); else mfcShowEmpty();
        if (typeof mfeUpdateCompareBtns === 'function') mfeUpdateCompareBtns();
        if (typeof mfeUpdateCompareBridge === 'function') mfeUpdateCompareBridge();
    }
    function mfcClearAll() {
        _mfcFunds=[]; mfcSave(); mfcRenderChips(); mfcShowEmpty();
        if (typeof mfeUpdateCompareBtns === 'function') mfeUpdateCompareBtns();
        if (typeof mfeUpdateCompareBridge === 'function') mfeUpdateCompareBridge();
    }

    /* ── Chips ── */
    function mfcRenderChips() {
        const wrap = document.getElementById('mfc-chips');
        if (!wrap) return;
        wrap.innerHTML = _mfcFunds.map(f => `
            <div class="mfc-chip">
                <span title="${_esc(f.name)}">${_esc(f.name.length>28?f.name.slice(0,26)+'…':f.name)}</span>
                <button onclick="mfcRemove('${f.code}')" title="Remove">✕</button>
            </div>`).join('');
        const cnt = document.getElementById('mfc-fund-count');
        if (cnt) cnt.textContent = _mfcFunds.length ? `${_mfcFunds.length}/${MFC_MAX} funds` : '';
    }

    /* ── Fetch metrics for any fund not yet in cache ── */
    async function mfcFetchAndRender() {
        const toFetch = _mfcFunds.filter(f => !_mfeMetCache.hasOwnProperty(f.code));
        if (!toFetch.length) { mfcRenderTable(); return; }
        document.getElementById('mfc-empty')?.classList.add('hidden');
        document.getElementById('mfc-grid')?.classList.add('hidden');
        document.getElementById('mfc-loading')?.classList.remove('hidden');
        const txt = document.getElementById('mfc-loading-text');
        let done = 0;
        await Promise.allSettled(toFetch.map(async f => {
            try {
                if (txt) txt.textContent = `Fetching ${f.name.slice(0,32)}…`;
                // Get benchmark for this fund's category
                const bench = await mfeFetchCatBench(f.cat, null);
                const r = await fetch(`https://api.mfapi.in/mf/${f.code}`,
                    {signal: AbortSignal.timeout(20000)});
                if (!r.ok) throw new Error('HTTP '+r.status);
                const j = await r.json();
                const navArr = (j?.data||[]).map(d=>parseFloat(d.nav))
                    .filter(v=>!isNaN(v)).reverse();
                // Store latest NAV if not already in cache
                if (!_mfeNavCache[f.code] && navArr.length) {
                    _mfeNavCache[f.code] = { nav: navArr[navArr.length-1], date: j.data?.[0]?.date||'' };
                }
                _mfeMetCache[f.code] = navArr.length >= 30 ? mfeCompute(navArr, bench) : null;
                // Refine category from API metadata
                const metaCat = mfeCatFromMeta(j?.meta?.scheme_category);
                if (metaCat) f.cat = metaCat;
            } catch { _mfeMetCache[f.code] = null; }
            done++;
            if (txt) txt.textContent = `Loading… ${done}/${toFetch.length}`;
        }));
        document.getElementById('mfc-loading')?.classList.add('hidden');
        mfcRenderTable();
    }

    /* ── Render the comparison table ── */
    function mfcRenderTable() {
        if (!_mfcFunds.length) { mfcShowEmpty(); return; }
        document.getElementById('mfc-empty')?.classList.add('hidden');
        document.getElementById('mfc-loading')?.classList.add('hidden');
        const grid = document.getElementById('mfc-grid');
        if (!grid) return;
        grid.classList.remove('hidden');

        const funds = _mfcFunds;
        const mets  = funds.map(f => _mfeMetCache[f.code]);
        const navs  = funds.map(f => _mfeNavCache[f.code]?.nav ?? null);

        // Helper: pick best/worst index for a row (higher=better by default)
        function highlight(vals, higherBetter=true) {
            const nums = vals.map(v => typeof v==='number'&&isFinite(v)?v:null);
            if (nums.filter(v=>v!==null).length < 2) return [];
            const best  = higherBetter ? Math.max(...nums.filter(v=>v!==null)) : Math.min(...nums.filter(v=>v!==null));
            const worst = higherBetter ? Math.min(...nums.filter(v=>v!==null)) : Math.max(...nums.filter(v=>v!==null));
            return nums.map(v => v===null?'':v===best?'mfc-best':v===worst?'mfc-worst':'');
        }

        // Build header row
        let html = '<thead><tr>';
        html += '<th class="mfc-metric">Fund</th>';
        funds.forEach((f,i) => {
            const shortName = f.name.replace(/direct|growth|plan|option|fund/gi,'').trim().replace(/\s+/g,' ');
            html += `<th class="mfc-fund-col">
                <span class="mfc-fn" title="${_esc(f.name)}">${_esc(shortName.length>32?shortName.slice(0,30)+'…':shortName)}</span>
                <span class="mfc-fa">${_esc(f.amc)} · ${f.cat}</span>
                <button class="mfc-rm" onclick="mfcRemove('${f.code}')" title="Remove">✕</button>
            </th>`;
        });
        html += '</tr></thead><tbody>';

        // Section builder — label in sticky first cell, one filler td per fund column
        function section(label) {
            const fillers = funds.map(() => '<td class="mfc-sh-fill"></td>').join('');
            html += `<tr class="mfc-section-head">
                <td class="mfc-sh-label">${label}</td>${fillers}
            </tr>`;
        }
        function row(label, vals, cls=[], fmt=(v,i)=>v, tooltip='') {
            html += `<tr><td class="mfc-metric"${tooltip?` title="${tooltip}"`:''}>${label}</td>`;
            vals.forEach((v,i) => {
                html += `<td class="mfc-val ${cls[i]||''}">${v===null||v===undefined?'<span class="mfe-na">—</span>':fmt(v,i)}</td>`;
            });
            html += '</tr>';
        }

        // ── Signal ──
        section('Star Rating');
        const sigVals = funds.map((_,i) => mets[i]?.stars ?? null);
        row('Rating', sigVals, highlight(sigVals),
            (v, i) => mfeSignalHtml(v, mets[i]?.score ?? null, mets[i]?.pillars ?? null),
            '5★ Elite (top 10%) → 4★ Strong → 3★ Average → 2★ Weak → 1★ Avoid. Hover for Returns / Safety / Consistency breakdown.');

        // ── CAGR ──
        section('Returns (CAGR)');
        ['y1','y3','y5','y10'].forEach((k,j) => {
            const label = ['1 Year','3 Year','5 Year','10 Year'][j];
            const vals  = funds.map((_,i) => mets[i]?.cagr?.[k] ?? null);
            const cls   = highlight(vals);
            row(label, vals, cls,
                v => `<span class="${v>=0?'mfe-cagr-pos':'mfe-cagr-neg'}">${v>=0?'+':''}${v.toFixed(2)}%</span>`);
        });
        // Latest NAV
        row('Latest NAV', navs, [],
            v => `₹${v.toFixed(4)}`);

        // ── Consistency ──
        section('Consistency');
        const rollHitVals = funds.map((_,i) => mets[i]?.rolling?.hitRate ?? null);
        row('Roll Hit %', rollHitVals, highlight(rollHitVals),
            v => `<span class="${v>=80?'mfe-good':v>=60?'mfe-avg':'mfe-bad'}">${v.toFixed(1)}%</span>`,
            '% of rolling 3Y windows with positive return');
        const rollAvgVals = funds.map((_,i) => mets[i]?.rolling?.avg ?? null);
        row('Roll Avg Return', rollAvgVals, highlight(rollAvgVals),
            v => `<span class="${v>=12?'mfe-good':v>=8?'mfe-avg':'mfe-bad'}">${v>=0?'+':''}${v.toFixed(2)}%</span>`,
            'Average annualised return across all rolling 3Y windows');

        // ── Risk-adjusted ──
        section('Risk & Quality');
        const sharpeVals = funds.map((_,i) => mets[i]?.sharpe ?? null);
        row('Sharpe Ratio', sharpeVals, highlight(sharpeVals),
            v => `<span class="${v>1.5?'mfe-good':v>0.8?'mfe-avg':'mfe-bad'}">${v.toFixed(2)}</span>`,
            'Return per unit of total risk (higher = better)');
        const sortinoVals = funds.map((_,i) => mets[i]?.sortino ?? null);
        row('Sortino Ratio', sortinoVals, highlight(sortinoVals),
            v => `<span class="${v>1.5?'mfe-good':v>0.8?'mfe-avg':'mfe-bad'}">${v.toFixed(2)}</span>`,
            'Return per unit of downside risk (higher = better)');
        const alphaVals = funds.map((_,i) => mets[i]?.alpha ?? null);
        row('Alpha %', alphaVals, highlight(alphaVals),
            v => `<span class="${v>2?'mfe-good':v>0?'mfe-avg':'mfe-bad'}">${v>=0?'+':''}${v.toFixed(2)}%</span>`,
            'Excess return vs category benchmark');
        const stdDevVals = funds.map((_,i) => mets[i]?.stdDev ?? null);
        row('Std Dev %', stdDevVals, highlight(stdDevVals, false), // lower is better
            v => `<span class="${v<12?'mfe-good':v<20?'mfe-avg':'mfe-bad'}">${v.toFixed(2)}%</span>`,
            'Annualised volatility — lower is more stable');
        const betaVals = funds.map((_,i) => mets[i]?.beta ?? null);
        row('Beta', betaVals, [],
            v => `<span class="${v<0.9?'mfe-good':v<1.15?'mfe-avg':'mfe-bad'}">${v.toFixed(2)}</span>`,
            'Market sensitivity vs benchmark (1.0 = moves with market)');

        // ── Cost ──
        section('Cost');
        const erVals = funds.map(f => { const d=mfeGetER(f.code,f.cat); return d?d.val:null; });
        row('Expense Ratio', erVals, highlight(erVals, false), // lower is better
            (v, i) => {
                const cat    = funds[i]?.cat || '_default';
                const bench  = MFE_ER_BENCH[cat] ?? 1.0;
                const cls    = v <= bench*0.6 ? 'mfe-good' : v <= bench ? 'mfe-avg' : 'mfe-bad';
                const tip    = `Category ceiling: ${bench.toFixed(2)}% (good ≤${(bench*0.6).toFixed(2)}%)`;
                return `<span class="${cls}" title="${tip}">${v.toFixed(2)}%</span>`;
            },
            'Annual cost vs category-specific benchmark (hover for threshold)');

        html += '</tbody>';
        const tbl = document.getElementById('mfc-table');
        if (tbl) tbl.innerHTML = html;
    }

    function mfcShowEmpty() {
        document.getElementById('mfc-empty')?.classList.remove('hidden');
        document.getElementById('mfc-grid')?.classList.add('hidden');
        document.getElementById('mfc-loading')?.classList.add('hidden');
        const cnt = document.getElementById('mfc-fund-count');
        if (cnt) cnt.textContent = '';
    }

    /* Restore saved funds once MFE data is ready */
    const _mfcOrigInit = window.mfeInit;
    document.addEventListener('DOMContentLoaded', () => {
        // Hook into MFE ready state — poll until _mfeReady
        const _mfcPoll = setInterval(() => {
            if (_mfeReady && _mfeList.length) {
                clearInterval(_mfcPoll);
                mfcRestore();
            }
        }, 500);
    });