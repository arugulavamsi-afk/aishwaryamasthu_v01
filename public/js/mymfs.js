/* ══════════════════════════════════════════════════════════
   MY MUTUAL FUNDS — Personal watchlist, saved to Firestore
   Scores/ratings are read from MF Explorer's shared cache.
══════════════════════════════════════════════════════════ */

window._myMFs = window._myMFs || [];   // [{code,name,cat,subSect,amc}]

var _myMFsMax = 20;

function mfIsWatchlisted(code) {
    return (window._myMFs || []).some(function(f) { return f.code === code; });
}
window.mfIsWatchlisted = mfIsWatchlisted;

function mfToggleWatchlist(code, name, cat, subSect, amc) {
    if (!window._myMFs) window._myMFs = [];
    var idx = window._myMFs.findIndex(function(f) { return f.code === code; });
    if (idx !== -1) {
        window._myMFs.splice(idx, 1);
    } else {
        if (window._myMFs.length >= _myMFsMax) {
            alert('You can save up to ' + _myMFsMax + ' funds in My Mutual Funds.');
            return;
        }
        window._myMFs.push({ code: code, name: name, cat: cat, subSect: subSect || '', amc: amc || '' });
    }
    if (typeof saveUserData === 'function') saveUserData();
    _myMFsRefreshBookmarks();
    var panel = document.getElementById('mymfs-panel');
    if (panel && !panel.classList.contains('hidden')) renderMyMFs();
}
window.mfToggleWatchlist = mfToggleWatchlist;

function _myMFsRefreshBookmarks() {
    document.querySelectorAll('[data-mf-bm]').forEach(function(btn) {
        var code = btn.getAttribute('data-mf-bm');
        var saved = mfIsWatchlisted(code);
        btn.textContent = saved ? '★' : '☆';
        btn.title = saved ? 'Saved — click to remove from My Mutual Funds' : 'Click to save to My Mutual Funds';
        btn.style.color = saved ? '#f5c842' : '#94a3b8';
    });
}
window._myMFsRefreshBookmarks = _myMFsRefreshBookmarks;

function initMyMFs() {
    renderMyMFs();
    if (!window._myMFs || !window._myMFs.length) return;
    // If MF Explorer data isn't loaded yet, trigger it — renderMyMFs will be called
    // again from mfeLoadPrecomputed once it completes.
    if (typeof _mfeReady !== 'undefined' && !_mfeReady) {
        if (typeof mfeLoadPrecomputed === 'function') mfeLoadPrecomputed();
    }
}
window.initMyMFs = initMyMFs;

function renderMyMFs() {
    var el = document.getElementById('mymfs-tbody');
    if (!el) return;

    var list = window._myMFs || [];
    var countEl = document.getElementById('mymfs-count');
    if (countEl) countEl.textContent = list.length + ' / ' + _myMFsMax + ' funds';

    if (!list.length) {
        el.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:36px 16px;">' +
            '<div style="font-size:28px;margin-bottom:8px;">☆</div>' +
            '<div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.7);margin-bottom:4px;">No funds saved yet</div>' +
            '<div style="font-size:11px;color:rgba(255,255,255,0.4);">Open MF Explorer and click ☆ on any fund to add it here.</div>' +
            '</td></tr>';
        return;
    }

    var dataReady = typeof _mfeReady !== 'undefined' && _mfeReady;

    el.innerHTML = list.map(function(f) {
        var cacheKey = (f.cat === 'Sectoral' && f.subSect) ? f.code + ':' + f.subSect : f.code;
        var m  = dataReady && typeof _mfeMetCache !== 'undefined' ? _mfeMetCache[cacheKey] : undefined;
        var nc = dataReady && typeof _mfeNavCache  !== 'undefined' ? _mfeNavCache[f.code]   : null;

        var sigHtml = !dataReady
            ? '<span style="color:rgba(255,255,255,0.3);font-size:10px;">loading…</span>'
            : (m == null
                ? '<span style="color:rgba(255,255,255,0.35);font-size:10px;">—</span>'
                : (typeof mfeSignalHtml === 'function' ? mfeSignalHtml(m.stars, m.score, m.pillars) : '—'));

        var cagrVal = m && m.cagr ? (m.cagr.y3 != null ? m.cagr.y3 : (m.cagr.y1 != null ? m.cagr.y1 : null)) : null;
        var cagrHtml = !dataReady
            ? '<span style="color:rgba(255,255,255,0.3);font-size:10px;">…</span>'
            : (cagrVal != null
                ? '<span style="color:' + (cagrVal >= 0 ? '#4ade80' : '#f87171') + ';font-weight:700;">' + (cagrVal >= 0 ? '+' : '') + cagrVal.toFixed(2) + '%</span>'
                : '<span style="color:rgba(255,255,255,0.35);">—</span>');

        var navHtml = nc ? '₹' + nc.nav.toFixed(4) : (dataReady ? '—' : '…');

        var sharpeHtml = m && m.sharpe != null
            ? '<span style="color:' + (m.sharpe > 1.5 ? '#4ade80' : m.sharpe > 0.8 ? '#fbbf24' : '#f87171') + '">' + m.sharpe.toFixed(2) + '</span>'
            : (dataReady ? '—' : '…');

        var erData = dataReady && typeof mfeGetER === 'function' ? mfeGetER(f.code, f.cat) : null;
        var erHtml = erData
            ? '<span style="color:' + (erData.val <= 0.6 ? '#4ade80' : erData.val <= 1.0 ? '#fbbf24' : '#f87171') + '">' + erData.val.toFixed(2) + '%</span>'
            : (dataReady ? '—' : '…');

        var catLabel = f.cat + (f.subSect ? ' · ' + f.subSect : '');

        return '<tr class="mymf-row">' +
            '<td class="mymf-td mymf-td-name">' +
                '<div class="mymf-fname">' + _myMFesc(f.name) + '</div>' +
                '<div class="mymf-famc">' + _myMFesc(f.amc) + '</div>' +
            '</td>' +
            '<td class="mymf-td" style="color:rgba(255,255,255,0.5);font-size:10px;white-space:nowrap;">' + _myMFesc(catLabel) + '</td>' +
            '<td class="mymf-td" style="text-align:center;">' + sigHtml + '</td>' +
            '<td class="mymf-td" style="text-align:right;">' + cagrHtml + '</td>' +
            '<td class="mymf-td" style="text-align:right;font-size:11px;color:rgba(255,255,255,0.8);">' + navHtml + '</td>' +
            '<td class="mymf-td" style="text-align:right;font-size:11px;">' + sharpeHtml + '</td>' +
            '<td class="mymf-td" style="text-align:right;font-size:11px;">' + erHtml + '</td>' +
            '<td class="mymf-td" style="text-align:center;">' +
                '<button onclick="mfToggleWatchlist(\'' + _myMFescAttr(f.code) + '\',\'' + _myMFescAttr(f.name) + '\',\'' + _myMFescAttr(f.cat) + '\',\'' + _myMFescAttr(f.subSect) + '\',\'' + _myMFescAttr(f.amc) + '\')" ' +
                'style="font-size:10px;font-weight:700;color:#f87171;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.25);border-radius:6px;padding:3px 9px;cursor:pointer;">Remove</button>' +
            '</td>' +
        '</tr>';
    }).join('');
}
window.renderMyMFs = renderMyMFs;

function _myMFesc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function _myMFescAttr(s) {
    return String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
