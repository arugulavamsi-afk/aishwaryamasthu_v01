    /* ══════════════════════════════════════════════════════════
       NOMINATION TRACKER / WILL AWARENESS TOOL
    ══════════════════════════════════════════════════════════ */

    var _ntAssets = [
        { key:'bank',   icon:'🏦', label:'Bank Accounts',      note:'All savings / FD / RD accounts — update at branch or net banking' },
        { key:'mf',     icon:'📊', label:'Mutual Funds',        note:'CAMS / KFintech folio nomination — can be done online in 5 min' },
        { key:'life',   icon:'🛡️', label:'Life Insurance',      note:'Policy documents + insurer portal — nominee = legal beneficiary' },
        { key:'epf',    icon:'🏛️', label:'EPF Account',         note:'EPFO Unified Portal (unifiedportal-mem.epfindia.gov.in) — ~30% accounts have no nominee!' },
        { key:'ppf',    icon:'📘', label:'PPF Account',         note:'At bank branch or post office — up to 4 nominees allowed' },
        { key:'nps',    icon:'🏖️', label:'NPS Account',         note:'NPS Trust / CRA portal — mandatory for new accounts' },
        { key:'demat',  icon:'📈', label:'Demat / Shares',      note:'CDSL / NSDL DP — submit Form DRF online or at branch' },
        { key:'health', icon:'❤️', label:'Health Insurance',    note:'Nominee for claim settlement — update with insurer / TPA portal' }
    ];

    function _ntGet(id) {
        var el = document.getElementById(id);
        return el ? el.value : '';
    }

    function nomScore() {
        var done = 0, total = 0;
        _ntAssets.forEach(function(a) {
            total++;
            if (_ntGet('nt-' + a.key + '-status') === 'done') done++;
        });
        // Will & estate items (4 points)
        ['nt-will-status','nt-exec-status','nt-fam-status','nt-digital-status'].forEach(function(id) {
            total++;
            var v = _ntGet(id);
            if (v === 'yes' || v === 'registered') done++;
        });
        return { done: done, total: total, pct: total ? Math.round(done / total * 100) : 0 };
    }

    function nomRenderScore(s) {
        var el = document.getElementById('nt-score-val');
        if (el) el.textContent = s.done + '/' + s.total;
        var bar = document.getElementById('nt-score-bar');
        if (bar) {
            bar.style.width = s.pct + '%';
            bar.style.background = s.pct >= 80 ? '#10b981' : s.pct >= 50 ? '#f59e0b' : '#ef4444';
        }
        var pctEl = document.getElementById('nt-score-pct');
        if (pctEl) pctEl.textContent = s.pct + '%';
        var badge = document.getElementById('nt-score-badge');
        if (badge) {
            var level, bg, col;
            if (s.pct >= 80)      { level = '✅ Estate Ready';    bg = '#dcfce7'; col = '#166534'; }
            else if (s.pct >= 60) { level = '🟡 Good Progress';   bg = '#fef9c3'; col = '#713f12'; }
            else if (s.pct >= 35) { level = '🟠 Action Needed';   bg = '#ffedd5'; col = '#9a3412'; }
            else                  { level = '🔴 Critical Risk';   bg = '#fee2e2'; col = '#991b1b'; }
            badge.textContent = level;
            badge.style.background = bg;
            badge.style.color = col;
        }
    }

    function nomRenderAlerts() {
        var el = document.getElementById('nt-alerts');
        if (!el) return;
        var alerts = [];

        _ntAssets.forEach(function(a) {
            var status = _ntGet('nt-' + a.key + '-status');
            if (status !== 'pending') return;
            var isEpf = a.key === 'epf';
            alerts.push({
                critical: isEpf,
                msg: (isEpf ? '⚠️ ' : '') + '<strong>' + a.label + '</strong>' + (isEpf
                    ? ': ~30% of EPF accounts in India have <em>no nominee</em>. Log in to EPFO Unified Portal → Manage → Nomination and update immediately.'
                    : ': Nomination pending — ' + a.note)
            });
        });

        var willV = _ntGet('nt-will-status');
        if (willV === 'none') {
            alerts.push({ critical: true,  msg: '⚠️ <strong>Will</strong>: No Will found. Without a registered Will, assets may be distributed as per personal law — often leading to family disputes and lengthy court battles.' });
        } else if (willV === 'unregistered') {
            alerts.push({ critical: false, msg: '📋 <strong>Will</strong>: Unregistered Wills are legally valid but can be challenged. Consider registering at Sub-Registrar\'s office (₹200–₹500) for added certainty.' });
        }
        if (_ntGet('nt-exec-status') === 'no') {
            alerts.push({ critical: false, msg: '👤 <strong>Executor</strong>: No executor named in your Will. An executor speeds up estate settlement significantly — name one explicitly.' });
        }
        if (_ntGet('nt-fam-status') === 'no') {
            alerts.push({ critical: false, msg: '👨‍👩‍👧 <strong>Family Awareness</strong>: Your family may not know where your Will/documents are. This alone causes 60%+ of estate disputes in India.' });
        }
        if (_ntGet('nt-digital-status') === 'no') {
            alerts.push({ critical: false, msg: '💻 <strong>Digital Assets</strong>: Online accounts, UPI, crypto, email — share access via a sealed envelope or trusted password manager.' });
        }

        el.innerHTML = alerts.length === 0
            ? '<div class="flex items-center gap-2 text-emerald-700 font-bold text-[11px]"><span class="text-base">✅</span><span>All items tracked! Review nominations annually and after major life events.</span></div>'
            : alerts.slice(0, 5).map(function(a) {
                return '<div class="flex gap-2 items-start py-1.5 border-b border-slate-100 last:border-0">' +
                    '<span class="flex-shrink-0 mt-0.5 text-xs">' + (a.critical ? '🔴' : '🟡') + '</span>' +
                    '<div class="text-[10px] text-slate-700 leading-relaxed">' + a.msg + '</div></div>';
              }).join('');
    }

    function nomRenderRowStatus() {
        _ntAssets.forEach(function(a) {
            var status = _ntGet('nt-' + a.key + '-status');
            var dot = document.getElementById('nt-' + a.key + '-dot');
            if (!dot) return;
            if (status === 'done')    { dot.textContent = '✅'; }
            else if (status === 'na') { dot.textContent = '➖'; }
            else                      { dot.textContent = '⏳'; }
        });
    }

    function nomRender() {
        var s = nomScore();
        nomRenderScore(s);
        nomRenderAlerts();
        nomRenderRowStatus();
        if (typeof saveUserData === 'function') saveUserData();
    }

    function initNomTrack() {
        nomRender();
        // Auto-save Will form on any input change
        var willForm = document.getElementById('nt-will-form');
        if (willForm) {
            willForm.addEventListener('input', function() {
                if (typeof saveUserData === 'function') saveUserData();
            });
        }
    }

    function ntGeneratePdf() {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            alert('PDF library not loaded yet. Please try again in a moment.');
            return false;
        }
        var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        var W = 210, margin = 16, y = 0;

        // ── Helpers ────────────────────────────────────────────────────
        function line(text, x, yPos, opts) {
            doc.text(text, x, yPos, opts || {});
        }
        function hRule(yPos, r, g, b) {
            doc.setDrawColor(r || 30, g || 58, b || 138);
            doc.setLineWidth(0.4);
            doc.line(margin, yPos, W - margin, yPos);
        }
        function box(x, bY, w, h, r, g, b) {
            doc.setFillColor(r, g, b);
            doc.rect(x, bY, w, h, 'F');
        }

        // Status display helper
        function statusLabel(v) {
            if (v === 'done')         return 'Done';
            if (v === 'na')           return 'N/A';
            if (v === 'registered')   return 'Registered';
            if (v === 'unregistered') return 'Unregistered';
            if (v === 'yes')          return 'Yes';
            if (v === 'no')           return 'No';
            return 'Pending';
        }
        function statusDot(v) {
            if (v === 'done' || v === 'yes' || v === 'registered') return '[DONE]';
            if (v === 'na')  return '[N/A]';
            return '[PENDING]';
        }
        function fmtDate(d) {
            if (!d) return '—';
            try {
                var parts = d.split('-');
                if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
            } catch(e) {}
            return d;
        }

        var today = (function() {
            var n = new Date();
            var dd = String(n.getDate()).padStart(2, '0');
            var mm = String(n.getMonth() + 1).padStart(2, '0');
            var yyyy = n.getFullYear();
            return dd + '/' + mm + '/' + yyyy;
        })();

        // ══ HEADER BANNER ══════════════════════════════════════════════
        box(0, 0, W, 38, 12, 35, 64);           // dark navy
        box(0, 38, W, 4, 14, 92, 58);           // green accent strip

        doc.setTextColor(245, 200, 66);          // gold
        doc.setFontSize(15);
        doc.setFont('helvetica', 'bold');
        line('NOMINATION & WILL DECLARATION DOCUMENT', W / 2, 14, { align: 'center' });

        doc.setTextColor(147, 197, 253);         // light blue
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        line('Personal Estate Planning Reference  |  AishwaryaMasthu', W / 2, 21, { align: 'center' });
        line('aishwaryamasthu-66c6f.web.app', W / 2, 27, { align: 'center' });

        doc.setTextColor(200, 220, 255);
        doc.setFontSize(7.5);
        line('Generated on: ' + today, W / 2, 34, { align: 'center' });

        y = 52;

        // ══ DECLARATION ════════════════════════════════════════════════
        box(margin, y - 5, W - margin * 2, 26, 239, 246, 255);
        doc.setDrawColor(191, 219, 254);
        doc.setLineWidth(0.3);
        doc.rect(margin, y - 5, W - margin * 2, 26);

        doc.setTextColor(30, 58, 138);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        line('DECLARATION', margin + 4, y + 1);

        doc.setTextColor(51, 65, 85);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        var declText = [
            'I hereby declare that the following nomination records and Will-related information are accurate and maintained in good faith.',
            'This document serves as a personal estate planning reference to ensure seamless transfer of assets to the nominated',
            'beneficiaries in the event of my demise. This information has been recorded and reviewed using AishwaryaMasthu.'
        ];
        declText.forEach(function(t, i) { line(t, margin + 4, y + 8 + i * 5); });

        y += 32;

        // ══ SECTION A — FINANCIAL NOMINATIONS ═════════════════════════
        doc.setTextColor(255, 255, 255);
        box(margin, y, W - margin * 2, 8, 30, 58, 138);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        line('SECTION A  ·  FINANCIAL ACCOUNT NOMINATIONS', margin + 4, y + 5.5);
        y += 11;

        // Table header
        var cols = [margin, margin + 42, margin + 66, margin + 110, margin + 144];
        var colW  = [40, 22, 42, 32, 32];
        box(margin, y, W - margin * 2, 7, 241, 245, 249);
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        ['ASSET', 'STATUS', 'NOMINEE NAME', 'LAST UPDATED', ''].forEach(function(h, i) {
            if (i < 4) line(h, cols[i] + 1.5, y + 4.5);
        });
        y += 8;

        // Table rows
        doc.setFont('helvetica', 'normal');
        _ntAssets.forEach(function(a, idx) {
            var status  = _ntGet('nt-' + a.key + '-status');
            var nominee = _ntGet('nt-' + a.key + '-nominee') || '—';
            var date    = fmtDate(_ntGet('nt-' + a.key + '-date'));
            var bgR = idx % 2 === 0 ? 255 : 248;
            box(margin, y, W - margin * 2, 7, bgR, bgR, bgR);

            // Status colour dot
            if (status === 'done')    { doc.setTextColor(22, 101, 52); }
            else if (status === 'na') { doc.setTextColor(100, 116, 139); }
            else                      { doc.setTextColor(185, 28, 28); }
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            line(statusDot(status), cols[1] + 1.5, y + 4.5);

            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'normal');
            line(a.label,   cols[0] + 1.5, y + 4.5);
            line(nominee,   cols[2] + 1.5, y + 4.5);
            line(date,      cols[3] + 1.5, y + 4.5);

            // thin row border
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.2);
            doc.line(margin, y + 7, W - margin, y + 7);
            y += 7;
        });

        y += 6;

        // ══ SECTION B — WILL & ESTATE ══════════════════════════════════
        doc.setTextColor(255, 255, 255);
        box(margin, y, W - margin * 2, 8, 14, 92, 58);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        line('SECTION B  ·  WILL & ESTATE READINESS', margin + 4, y + 5.5);
        y += 11;

        var willItems = [
            { label: 'Will Status',    id: 'nt-will-status' },
            { label: 'Executor Named', id: 'nt-exec-status' },
            { label: 'Family Aware',   id: 'nt-fam-status' },
            { label: 'Digital Assets', id: 'nt-digital-status' }
        ];

        willItems.forEach(function(item, idx) {
            var v = _ntGet(item.id);
            var bgR = idx % 2 === 0 ? 255 : 248;
            box(margin, y, W - margin * 2, 7, bgR, bgR, bgR);

            doc.setTextColor(30, 41, 59);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            line(item.label, cols[0] + 1.5, y + 4.5);

            var col = (v === 'yes' || v === 'registered') ? [22, 101, 52] : (v === 'no' || v === 'none') ? [185, 28, 28] : [161, 98, 7];
            doc.setTextColor(col[0], col[1], col[2]);
            doc.setFont('helvetica', 'normal');
            line(statusLabel(v), cols[1] + 1.5, y + 4.5);

            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.2);
            doc.line(margin, y + 7, W - margin, y + 7);
            y += 7;
        });

        // Estate Score summary
        var score = nomScore();
        y += 4;
        box(margin, y, W - margin * 2, 10, 220, 252, 231);
        doc.setDrawColor(134, 239, 172);
        doc.setLineWidth(0.3);
        doc.rect(margin, y, W - margin * 2, 10);
        doc.setTextColor(22, 101, 52);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        line('Estate Readiness Score:  ' + score.done + ' / ' + score.total + '  (' + score.pct + '%)', margin + 4, y + 6.5);

        var badgeText = _waFmt(document.getElementById('nt-score-badge'));
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        line(badgeText, margin + 100, y + 6.5);
        y += 16;

        // ══ SECTION C — NOTES ══════════════════════════════════════════
        var notes = (_ntGet('nt-notes') || '').trim();
        if (notes) {
            doc.setTextColor(255, 255, 255);
            box(margin, y, W - margin * 2, 8, 88, 28, 135);
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            line('SECTION C  ·  NOTES & IMPORTANT CONTACTS', margin + 4, y + 5.5);
            y += 11;

            box(margin, y, W - margin * 2, 4, 250, 245, 255);
            var noteLines = doc.splitTextToSize(notes, W - margin * 2 - 8);
            var noteH = noteLines.length * 5 + 6;
            box(margin, y, W - margin * 2, noteH, 250, 245, 255);
            doc.setDrawColor(196, 181, 253);
            doc.setLineWidth(0.3);
            doc.rect(margin, y, W - margin * 2, noteH);
            doc.setTextColor(51, 65, 85);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            noteLines.forEach(function(l, i) { line(l, margin + 4, y + 5 + i * 5); });
            y += noteH + 6;
        }

        // ══ FOOTER ════════════════════════════════════════════════════
        var footerY = 280;
        hRule(footerY, 203, 213, 225);
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'italic');
        doc.text(
            'DISCLAIMER: This document is generated by AishwaryaMasthu for personal reference only. It is not a legal document and does not constitute legal advice.',
            W / 2, footerY + 4, { align: 'center' }
        );
        doc.text(
            'For legal validity, please consult a qualified legal professional registered with the Bar Council of India.',
            W / 2, footerY + 8.5, { align: 'center' }
        );
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('aishwaryamasthu-66c6f.web.app  |  Generated: ' + today, W / 2, footerY + 13, { align: 'center' });

        // Save
        doc.save('Nomination-Will-Declaration-' + today.replace(/\//g, '-') + '.pdf');
        return true;
    }

    function ntToggleWill() {
        var form = document.getElementById('nt-will-form');
        var chev = document.getElementById('nt-will-chevron');
        if (!form) return;
        var hidden = form.classList.toggle('hidden');
        if (chev) chev.style.transform = hidden ? '' : 'rotate(180deg)';
    }

    function ntGenerateWillPdf(shareViaWa) {
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            alert('PDF library not loaded yet. Please try again in a moment.');
            return;
        }

        // ── Collect inputs ──────────────────────────────────────────────
        var name     = (document.getElementById('wg-name')?.value || '').trim();
        var age      = (document.getElementById('wg-age')?.value || '').trim();
        var parent   = (document.getElementById('wg-parent')?.value || '').trim();
        var religion = (document.getElementById('wg-religion')?.value || 'Hindu').trim();
        var address  = (document.getElementById('wg-address')?.value || '').trim();
        var willDate = (document.getElementById('wg-date')?.value || '').trim();
        var special  = (document.getElementById('wg-special')?.value || '').trim();
        var execName = (document.getElementById('wg-exec-name')?.value || '').trim();
        var execRel  = (document.getElementById('wg-exec-rel')?.value || '').trim();
        var execAddr = (document.getElementById('wg-exec-addr')?.value || '').trim();
        var w1Name   = (document.getElementById('wg-w1-name')?.value || '').trim();
        var w1Occ    = (document.getElementById('wg-w1-occ')?.value || '').trim();
        var w1Addr   = (document.getElementById('wg-w1-addr')?.value || '').trim();
        var w2Name   = (document.getElementById('wg-w2-name')?.value || '').trim();
        var w2Occ    = (document.getElementById('wg-w2-occ')?.value || '').trim();
        var w2Addr   = (document.getElementById('wg-w2-addr')?.value || '').trim();

        if (!name) { alert('Please enter the testator\'s full name before generating the Will.'); return; }

        // Collect beneficiaries
        var beneNames  = Array.from(document.querySelectorAll('.wg-bene-name')).map(function(e) { return e.value.trim(); });
        var beneRels   = Array.from(document.querySelectorAll('.wg-bene-rel')).map(function(e) { return e.value.trim(); });
        var beneShares = Array.from(document.querySelectorAll('.wg-bene-share')).map(function(e) { return e.value.trim(); });
        var beneCont   = Array.from(document.querySelectorAll('.wg-bene-cont')).map(function(e) { return e.value.trim(); });
        var beneficiaries = beneNames.map(function(n, i) {
            return { name: n, rel: beneRels[i] || '', share: beneShares[i] || '', cont: beneCont[i] || '' };
        }).filter(function(b) { return b.name; });

        // Format date
        function fmtWillDate(d) {
            if (!d) return 'the date stated below';
            try {
                var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
                var parts = d.split('-');
                return parseInt(parts[2]) + ' ' + months[parseInt(parts[1]) - 1] + ' ' + parts[0];
            } catch(e) { return d; }
        }
        function todayStr() {
            var n = new Date();
            return String(n.getDate()).padStart(2,'0') + '/' + String(n.getMonth()+1).padStart(2,'0') + '/' + n.getFullYear();
        }
        var dateStr = fmtWillDate(willDate);
        var today   = todayStr();

        // ── PDF Setup ───────────────────────────────────────────────────
        var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        var W = 210, M = 20, y = 0;
        var TW = W - M * 2;   // text width

        function txt(text, x, yy, opts) { doc.text(text, x, yy, opts || {}); }
        function hRule(yy, r, g, b, lw) {
            doc.setDrawColor(r || 80, g || 50, b || 140);
            doc.setLineWidth(lw || 0.35);
            doc.line(M, yy, W - M, yy);
        }
        function box(x, by, w, h, r, g, b) {
            doc.setFillColor(r, g, b);
            doc.rect(x, by, w, h, 'F');
        }
        function wrapTxt(text, maxW) {
            return doc.splitTextToSize(text, maxW);
        }
        // Print wrapped lines, return new y
        function para(text, x, startY, maxW, lineH) {
            var lines = wrapTxt(text, maxW || TW);
            lines.forEach(function(l, i) { txt(l, x, startY + i * (lineH || 5)); });
            return startY + lines.length * (lineH || 5);
        }
        // Clause heading
        function clauseHead(num, title, yy) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(76, 29, 149);
            txt(num + '.  ' + title, M, yy);
            return yy + 6;
        }
        // Normal body text
        function body(text, x, yy, maxW) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(30, 41, 59);
            return para(text, x, yy, maxW || TW);
        }
        // Check page overflow, add new page if needed
        function checkY(needed) {
            if (y + (needed || 14) > 270) {
                doc.addPage();
                y = 20;
                // faint footer line on new page
                doc.setDrawColor(220, 220, 230);
                doc.setLineWidth(0.2);
                doc.line(M, 285, W - M, 285);
                doc.setTextColor(180, 180, 200);
                doc.setFontSize(6.5);
                doc.setFont('helvetica', 'italic');
                txt('Last Will & Testament of ' + name + '  |  Draft generated by AishwaryaMasthu  |  Page ' + doc.internal.getNumberOfPages(), W / 2, 289, { align: 'center' });
            }
        }

        // ══ PAGE BORDER ════════════════════════════════════════════════
        doc.setDrawColor(124, 58, 237);
        doc.setLineWidth(1.2);
        doc.rect(7, 7, W - 14, 283);
        doc.setDrawColor(196, 181, 253);
        doc.setLineWidth(0.4);
        doc.rect(9, 9, W - 18, 279);

        // ══ HEADER ════════════════════════════════════════════════════
        y = 20;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(76, 29, 149);
        txt('LAST WILL AND TESTAMENT', W / 2, y, { align: 'center' });
        y += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(124, 58, 237);
        txt('of  ' + (name || '____________________'), W / 2, y, { align: 'center' });
        y += 5;

        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        txt('Draft prepared on ' + today + '  |  AishwaryaMasthu  |  For personal reference only', W / 2, y, { align: 'center' });
        y += 5;

        hRule(y, 124, 58, 237, 0.6);
        y += 8;

        // ══ PREAMBLE ══════════════════════════════════════════════════
        checkY(30);
        doc.setFillColor(245, 243, 255);
        doc.rect(M, y - 2, TW, 30, 'F');
        doc.setDrawColor(196, 181, 253);
        doc.setLineWidth(0.3);
        doc.rect(M, y - 2, TW, 30);

        var parentClause = parent ? (', son/daughter/spouse of ' + parent) : '';
        var ageClause    = age    ? (', aged ' + age + ' years') : '';
        var preamble = 'I, ' + name + parentClause + ageClause + ', residing at ' + (address || '___________') +
            ', being a ' + religion + ' by faith' +
            ', being of sound and disposing mind, memory, and understanding, and not acting under any fraud, coercion, or undue influence,' +
            ' do hereby make, publish, and declare this document to be my LAST WILL AND TESTAMENT, this ' + dateStr + '.';

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        y = para(preamble, M + 4, y + 4, TW - 8) + 8;

        // ══ CLAUSE I — REVOCATION ═════════════════════════════════════
        checkY(18);
        y = clauseHead('I', 'REVOCATION OF PRIOR WILLS', y);
        y = body('I hereby revoke, cancel, and annul all former Wills, codicils, and testamentary dispositions previously made by me, and declare this to be my Last Will and Testament.', M + 5, y, TW - 5) + 7;

        // ══ CLAUSE II — EXECUTOR ══════════════════════════════════════
        checkY(22);
        y = clauseHead('II', 'APPOINTMENT OF EXECUTOR', y);
        if (execName) {
            var execClause = 'I hereby appoint ' + execName + (execRel ? ' (' + execRel + ')' : '') +
                (execAddr ? ', residing at ' + execAddr : '') +
                ', as the Executor of this Will. The Executor shall have the full power and authority to administer my estate, pay all just debts and funeral expenses, and distribute the residue as directed herein. If the said Executor is unable or unwilling to act, I request the beneficiaries to mutually appoint an Executor.';
            y = body(execClause, M + 5, y, TW - 5) + 7;
        } else {
            y = body('I appoint __________________________ as the Executor of this Will, with full power and authority to administer my estate and distribute assets as directed herein.', M + 5, y, TW - 5) + 7;
        }

        // ══ CLAUSE III — DEBTS & EXPENSES ═════════════════════════════
        checkY(18);
        y = clauseHead('III', 'PAYMENT OF DEBTS AND FUNERAL EXPENSES', y);
        y = body('I direct my Executor to pay all my just and lawful debts, funeral and cremation expenses, and the costs of administering my estate as soon as practicable after my death.', M + 5, y, TW - 5) + 7;

        // ══ CLAUSE IV — DISTRIBUTION ══════════════════════════════════
        checkY(20);
        y = clauseHead('IV', 'DISTRIBUTION OF ESTATE', y);
        if (beneficiaries.length > 0) {
            y = body('Subject to the payment of debts and expenses under Clause III above, I give, bequeath, and devise my estate as follows:', M + 5, y, TW - 5) + 4;
            beneficiaries.forEach(function(b, i) {
                checkY(18);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(76, 29, 149);
                txt('(' + String.fromCharCode(97 + i) + ')', M + 7, y);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(30, 41, 59);
                var bText = 'To ' + b.name + (b.rel ? ' (' + b.rel + ')' : '') + ': ' + (b.share || '___________') + '.';
                if (b.cont) bText += ' In the event that ' + b.name + ' predeceases me, ' + b.cont + '.';
                y = para(bText, M + 14, y, TW - 14) + 5;
            });
            y += 2;
        } else {
            y = body('To __________________________ (__________), I give and bequeath ____________________________.', M + 5, y, TW - 5) + 7;
        }

        // ══ CLAUSE V — NOMINATION SUMMARY ═════════════════════════════
        checkY(20);
        y = clauseHead('V', 'FINANCIAL ACCOUNT NOMINATIONS (FOR REFERENCE)', y);
        y = body('The following persons have been nominated as beneficiaries in my financial accounts as of the date of this Will. These nominations are separate legal instruments and take precedence for the specific instruments listed. This clause serves as a cross-reference for my Executor.', M + 5, y, TW - 5) + 4;

        var donePairs = _ntAssets.filter(function(a) {
            return _ntGet('nt-' + a.key + '-status') === 'done' && _ntGet('nt-' + a.key + '-nominee');
        });
        if (donePairs.length > 0) {
            donePairs.forEach(function(a) {
                checkY(8);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8.5);
                doc.setTextColor(30, 41, 59);
                txt('•  ' + a.label + ':  ' + _ntGet('nt-' + a.key + '-nominee'), M + 9, y);
                y += 5;
            });
        } else {
            y = body('(No nominations marked as completed in the tracker — please update your nomination status.)', M + 5, y, TW - 5);
        }
        y += 4;

        // ══ CLAUSE VI — SPECIAL INSTRUCTIONS ═════════════════════════
        if (special) {
            checkY(20);
            y = clauseHead('VI', 'SPECIAL BEQUESTS AND INSTRUCTIONS', y);
            y = body(special, M + 5, y, TW - 5) + 7;
        }

        // ══ CLAUSE VII — RESIDUARY ESTATE ════════════════════════════
        var clauseNum = special ? 'VII' : 'VI';
        checkY(18);
        y = clauseHead(clauseNum, 'RESIDUARY ESTATE', y);
        var residBenef = beneficiaries.length > 0 ? beneficiaries[0].name + (beneficiaries[0].rel ? ' (' + beneficiaries[0].rel + ')' : '') : '__________________________';
        y = body('All the rest, residue, and remainder of my estate, both real and personal, of whatsoever nature and wheresoever situated, which I may own or be entitled to at the time of my death and not otherwise disposed of by this Will, I give, bequeath, and devise to ' + residBenef + ', absolutely and forever.', M + 5, y, TW - 5) + 8;

        // ══ DECLARATION & SIGNATURE ════════════════════════════════════
        checkY(60);
        hRule(y, 124, 58, 237, 0.5);
        y += 7;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(76, 29, 149);
        txt('TESTATOR\'S DECLARATION AND SIGNATURE', W / 2, y, { align: 'center' });
        y += 7;

        var declText = 'I, ' + name + ', the Testator, sign my name to this instrument this _______ day of ________________, _______, and being first duly sworn, declare to the undersigned authority that I sign and execute this instrument as my Last Will and that I sign it willingly, that I execute it as my free and voluntary act for the purposes therein expressed.';
        y = body(declText, M, y, TW) + 10;

        // Signature box
        doc.setDrawColor(196, 181, 253);
        doc.setLineWidth(0.3);
        doc.rect(M, y, 80, 18);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        txt('Signature / Thumb impression of Testator', M + 4, y + 13);
        txt(name, M + 4, y + 16.5);
        y += 24;

        // ══ WITNESSES ════════════════════════════════════════════════
        checkY(50);
        hRule(y, 124, 58, 237, 0.5);
        y += 7;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(76, 29, 149);
        txt('ATTESTATION BY WITNESSES', W / 2, y, { align: 'center' });
        y += 5;
        y = body('We, the undersigned, being present at the same time, witness the signature of the above-named Testator to this, their Last Will and Testament, and in the presence and at the request of the Testator, and in the presence of each other, subscribe our names as witnesses thereto, believing said Testator to be of sound and disposing mind and memory.', M, y, TW) + 8;

        var colW = (TW - 10) / 2;
        [[w1Name, w1Occ, w1Addr, 'Witness 1'], [w2Name, w2Occ, w2Addr, 'Witness 2']].forEach(function(w, i) {
            var cx = M + i * (colW + 10);
            doc.setDrawColor(196, 181, 253);
            doc.setLineWidth(0.3);
            doc.rect(cx, y, colW, 32);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(76, 29, 149);
            txt(w[3], cx + 4, y + 5);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(30, 41, 59);
            txt('Name: ' + (w[0] || '____________________'), cx + 4, y + 11);
            txt('Occupation: ' + (w[1] || '____________________'), cx + 4, y + 17);
            var addrLines = wrapTxt('Address: ' + (w[2] || '____________________'), colW - 8);
            addrLines.forEach(function(l, li) { txt(l, cx + 4, y + 22 + li * 4); });
            doc.setTextColor(148, 163, 184);
            doc.setFontSize(7);
            txt('Signature: ____________________', cx + 4, y + 29);
        });
        y += 38;

        // ══ DISCLAIMER FOOTER ════════════════════════════════════════
        checkY(22);
        hRule(y, 200, 200, 210, 0.3);
        y += 5;
        doc.setFillColor(248, 247, 255);
        doc.rect(M, y, TW, 16, 'F');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        txt('DISCLAIMER: This document is a draft template generated by AishwaryaMasthu (aishwaryamasthu-66c6f.web.app) for personal reference and', M + 3, y + 4.5);
        txt('planning purposes only. It does NOT constitute legal advice or a legally executed Will. To be legally valid, this document must be signed by', M + 3, y + 8.5);
        txt('the Testator in the presence of two witnesses who must also sign. Registration at the Sub-Registrar\'s office is strongly recommended.', M + 3, y + 12.5);

        // ── Save ────────────────────────────────────────────────────────
        var safeName = name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        var fileName = 'Will_' + safeName + '_' + today.replace(/\//g, '-') + '.pdf';
        doc.save(fileName);

        // ── WhatsApp share (opens after PDF downloads) ─────────────────
        if (shareViaWa) {
            var beneList = beneficiaries.map(function(b) { return b.name + (b.rel ? ' (' + b.rel + ')' : ''); }).join(', ') || '—';
            var execLine = execName ? execName + (execRel ? ' (' + execRel + ')' : '') : '—';
            var msg =
                '⚖️ I have prepared my *Last Will & Testament* using AishwaryaMasthu!\n\n' +
                '👤 Testator: *' + name + '*\n' +
                (beneficiaries.length ? '🎁 Beneficiaries: ' + beneList + '\n' : '') +
                (execName ? '🧑‍⚖️ Executor: ' + execLine + '\n' : '') +
                '\n📎 The Will document (*' + fileName + '*) has been downloaded to your device.\n' +
                'Please attach it to this chat to share it.\n\n' +
                '🔒 Generated securely on-device — no data was uploaded.\n' +
                'aishwaryamasthu-66c6f.web.app';
            var waLink = 'https://wa.me/?text=' + encodeURIComponent(msg);
            setTimeout(function() {
                window.open(waLink, '_blank') || (location.href = waLink);
            }, 800);
        }
    }

    function resetNomTrack() {
        _ntAssets.forEach(function(a) {
            var sEl = document.getElementById('nt-' + a.key + '-status');
            var nEl = document.getElementById('nt-' + a.key + '-nominee');
            var dEl = document.getElementById('nt-' + a.key + '-date');
            if (sEl) sEl.value = 'pending';
            if (nEl) nEl.value = '';
            if (dEl) dEl.value = '';
        });
        var wEl = document.getElementById('nt-will-status');     if (wEl) wEl.value = 'none';
        var eEl = document.getElementById('nt-exec-status');     if (eEl) eEl.value = 'no';
        var fEl = document.getElementById('nt-fam-status');      if (fEl) fEl.value = 'no';
        var dEl2 = document.getElementById('nt-digital-status'); if (dEl2) dEl2.value = 'no';
        var notEl = document.getElementById('nt-notes');
        if (notEl) notEl.value = '';
        nomRender();
        if (typeof saveUserData === 'function') saveUserData();
    }
