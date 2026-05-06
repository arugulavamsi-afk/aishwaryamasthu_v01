    /* ═══════════════════════════════════════════════
       CONSULT AN EXPERT — user-side logic
    ═══════════════════════════════════════════════ */

    var _consultExperts        = [];
    var _consultView           = 'list'; // 'list' | 'slots' | 'bookings' | 'chat' | 'archive'
    var _pdfLogoBase64         = null;
    (function() {
        var img = new Image();
        img.onload = function() {
            try {
                var c = document.createElement('canvas');
                c.width = img.naturalWidth; c.height = img.naturalHeight;
                c.getContext('2d').drawImage(img, 0, 0);
                _pdfLogoBase64 = c.toDataURL('image/png');
            } catch(e) {}
        };
        img.src = '/icons/GoldenEle_Logov03_nobg_v2.png';
    })();
    var _consultSelected       = null;
    var _consultChatBookingId  = null;
    var _consultChatListener   = null;
    var _consultChatExpertName = '';
    var _consultUnreadListener = null;

    function initConsult() {
        _consultView = 'list';
        _consultRenderView();
        _consultLoadExperts();
    }

    /* ── Unread badge on dashboard tile ── */
    function consultWatchUnread() {
        if (_consultUnreadListener) { _consultUnreadListener(); _consultUnreadListener = null; }
        var db   = window._fbDb;
        var user = window._fbAuth && window._fbAuth.currentUser;
        if (!db || !user) return;

        _consultUnreadListener = db.collection('bookings')
            .where('userId', '==', user.uid)
            .onSnapshot(function(snap) {
                var total = 0;
                snap.forEach(function(doc) {
                    var b = doc.data();
                    if ((b.status === 'confirmed' || b.status === 'completed') && b.unreadForUser > 0) {
                        total += b.unreadForUser;
                    }
                });
                var badge = document.getElementById('consult-unread-badge');
                if (!badge) return;
                if (total > 0) {
                    badge.textContent = total > 9 ? '9+' : String(total);
                    badge.style.display = '';
                } else {
                    badge.style.display = 'none';
                }
            }, function(err) {
                console.error('[consult] unread watch error:', err);
            });
    }

    /* ── Load experts from Firestore ── */
    function _consultLoadExperts() {
        var db = window._fbDb;
        if (!db) return;
        var listEl = document.getElementById('consult-expert-list');
        if (listEl) listEl.innerHTML = '<div class="text-center py-8 text-slate-400 text-[12px]">Loading advisors…</div>';
        db.collection('experts').where('isActive', '==', true).get()
            .then(function(snap) {
                _consultExperts = [];
                snap.forEach(function(doc) {
                    _consultExperts.push(Object.assign({ id: doc.id }, doc.data()));
                });
                _consultRenderExperts();
            })
            .catch(function(err) {
                var listEl = document.getElementById('consult-expert-list');
                if (listEl) listEl.innerHTML = '<div class="text-center py-8 text-slate-400 text-[12px]">Could not load advisors. Please try again.</div>';
                console.error('[consult] load experts error:', err);
            });
    }

    /* ── Main view switcher ── */
    function _consultRenderView() {
        var tabList  = document.getElementById('consult-tab-list');
        var tabBook  = document.getElementById('consult-tab-bookings');
        var tabArch  = document.getElementById('consult-tab-archive');
        var tabsRow  = document.getElementById('consult-tabs');
        var secList  = document.getElementById('consult-sec-list');
        var secBook  = document.getElementById('consult-sec-bookings');
        var secArch  = document.getElementById('consult-sec-archive');
        var secSlot  = document.getElementById('consult-sec-slots');
        var secChat  = document.getElementById('consult-sec-chat');
        if (!secList) return;

        var showList = _consultView === 'list';
        var showBook = _consultView === 'bookings';
        var showArch = _consultView === 'archive';
        var showSlot = _consultView === 'slots';
        var showChat = _consultView === 'chat';

        if (tabsRow) tabsRow.style.display = showChat ? 'none' : '';
        if (tabList) tabList.classList.toggle('consult-tab-active', showList);
        if (tabBook) tabBook.classList.toggle('consult-tab-active', showBook);
        if (tabArch) tabArch.classList.toggle('consult-tab-active', showArch);
        if (secList) secList.style.display = (showList || showSlot) ? '' : 'none';
        if (secBook) secBook.style.display = showBook ? '' : 'none';
        if (secArch) secArch.style.display = showArch ? '' : 'none';
        if (secSlot) secSlot.style.display = showSlot ? '' : 'none';
        if (secChat) secChat.style.display = showChat ? '' : 'none';
    }

    function consultShowTab(tab) {
        // Unsubscribe from any open chat listener
        if (_consultChatListener) { _consultChatListener(); _consultChatListener = null; }
        _consultChatBookingId = null;
        _consultView = tab;
        _consultRenderView();
        if (tab === 'bookings') _consultLoadMyBookings();
    }

    /* ── Render expert cards ── */
    function _consultRenderExperts() {
        var listEl = document.getElementById('consult-expert-list');
        if (!listEl) return;
        if (_consultExperts.length === 0) {
            listEl.innerHTML = '<div class="text-center py-10 text-slate-400 text-[12px]"><div class="text-3xl mb-2">🚧</div>We are onboarding certified advisors. Check back shortly.</div>';
            return;
        }
        listEl.innerHTML = _consultExperts.map(function(e) {
            var tags = (e.specialization || []).slice(0, 3).map(function(s) {
                return '<span class="px-2 py-0.5 rounded-full text-[9px] font-bold" style="background:rgba(245,200,66,0.15);color:#b45309;">' + s + '</span>';
            }).join('');
            var langs = (e.languages || []).join(' · ');
            var initials = (e.name || 'E').split(' ').map(function(w){ return w[0]; }).join('').toUpperCase().slice(0,2);
            var photoHtml = e.photo
                ? '<img src="' + e.photo + '" class="w-14 h-14 rounded-2xl object-cover flex-shrink-0" style="border:2px solid rgba(245,200,66,0.3);">'
                : '<div class="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-lg font-black text-white" style="background:linear-gradient(135deg,#0c2340,#1a4a7a);border:2px solid rgba(245,200,66,0.3);">' + initials + '</div>';
            return '<div class="bg-white rounded-2xl border border-[#f5c842]/30 shadow-sm p-4">' +
                '<div class="flex gap-3">' +
                    photoHtml +
                    '<div class="flex-1 min-w-0">' +
                        '<div class="font-black text-[13px] text-slate-800">' + (e.name || '') + '</div>' +
                        '<div class="text-[10px] font-semibold mt-0.5" style="color:#b45309;">' + (e.qualifications || '') + '</div>' +
                        '<div class="text-[10px] text-slate-400 mt-0.5">' + (e.experience || 0) + ' yrs experience · ' + langs + '</div>' +
                        '<div class="flex flex-wrap gap-1 mt-1.5">' + tags + '</div>' +
                    '</div>' +
                '</div>' +
                '<p class="text-[11px] text-slate-500 mt-2.5 leading-relaxed">' + (e.bio || '') + '</p>' +
                '<button onclick="consultSelectExpert(\'' + e.id + '\')" ' +
                    'class="mt-3 w-full py-2 rounded-xl text-[12px] font-bold transition-all" ' +
                    'style="background:linear-gradient(130deg,#0c2340,#1a4a7a);color:#f5c842;border:1px solid rgba(245,200,66,0.3);">Book a 1-Hour Slot →</button>' +
            '</div>';
        }).join('');
    }

    /* ── Slot picker ── */
    function consultSelectExpert(expertId) {
        var expert = _consultExperts.find(function(e){ return e.id === expertId; });
        if (!expert) return;
        var db   = window._fbDb;
        var user = window._fbAuth && window._fbAuth.currentUser;
        if (!db || !user) return;

        // Block booking if the user already has an active (confirmed) session
        db.collection('bookings')
            .where('userId',  '==', user.uid)
            .where('status',  '==', 'confirmed')
            .limit(1).get()
            .then(function(snap) {
                if (!snap.empty) {
                    _consultShowToast('You already have an active booking. It must be completed before you can book again.');
                    return;
                }
                _consultSelected = expert;
                _consultView = 'slots';
                _consultRenderView();
                _consultRenderSlots();
            })
            .catch(function(err) {
                console.error('[consult] active-booking check error:', err);
                // Fall through and allow booking if the check itself fails
                _consultSelected = expert;
                _consultView = 'slots';
                _consultRenderView();
                _consultRenderSlots();
            });
    }

    function consultBackToList() {
        _consultView = 'list';
        _consultSelected = null;
        _consultRenderView();
    }

    function _consultRenderSlots() {
        var slotEl = document.getElementById('consult-sec-slots');
        if (!slotEl || !_consultSelected) return;
        var e = _consultSelected;
        var avail = e.availability || {};

        // Build next 7 days
        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        var today = new Date();
        var slots = [];
        for (var i = 1; i <= 7; i++) {
            var d = new Date(today);
            d.setDate(today.getDate() + i);
            var dayName = days[d.getDay()];
            var times = avail[dayName] || [];
            if (times.length > 0) {
                slots.push({ date: d, dayName: dayName, times: times });
            }
        }

        var initials = (e.name || 'E').split(' ').map(function(w){ return w[0]; }).join('').toUpperCase().slice(0,2);
        var photoHtml = e.photo
            ? '<img src="' + e.photo + '" class="w-10 h-10 rounded-xl object-cover" style="border:1.5px solid rgba(245,200,66,0.3);">'
            : '<div class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white" style="background:linear-gradient(135deg,#0c2340,#1a4a7a);">' + initials + '</div>';

        var slotsHtml = slots.length === 0
            ? '<div class="text-center py-6 text-slate-400 text-[12px]">No slots available in the next 7 days.</div>'
            : slots.map(function(s) {
                var dateLabel = s.date.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' });
                var timeBtns = s.times.map(function(t) {
                    return '<button onclick="consultConfirmSlot(\'' + s.date.toISOString().split('T')[0] + '\',\'' + t + '\')" ' +
                        'class="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:shadow" ' +
                        'style="background:linear-gradient(130deg,#f5c842,#e8a44a);color:#162a10;border:1px solid rgba(245,200,66,0.5);">' + t + '</button>';
                }).join('');
                return '<div class="bg-white rounded-xl border border-[#f5c842]/20 px-3 py-2.5">' +
                    '<div class="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">' + dateLabel + '</div>' +
                    '<div class="flex flex-wrap gap-2">' + timeBtns + '</div>' +
                '</div>';
            }).join('');

        slotEl.innerHTML =
            '<div class="flex items-center gap-2 mb-3">' +
                '<button onclick="consultBackToList()" class="px-3 py-1.5 rounded-xl text-[11px] font-bold" style="background:rgba(255,255,255,0.9);border:1px solid #e2e8f0;color:#475569;">← Back</button>' +
                '<span class="text-[12px] font-black text-slate-700">Select a Slot</span>' +
            '</div>' +
            '<div class="bg-white rounded-2xl border border-[#f5c842]/30 shadow-sm p-4 mb-3">' +
                '<div class="flex items-center gap-3">' +
                    photoHtml +
                    '<div>' +
                        '<div class="font-black text-[13px] text-slate-800">' + e.name + '</div>' +
                        '<div class="text-[10px] text-slate-400">' + (e.qualifications || '') + '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="flex flex-col gap-2">' + slotsHtml + '</div>';
    }

    /* ── Booking confirmation ── */
    function consultConfirmSlot(date, time) {
        var e = _consultSelected;
        if (!e) return;
        var user = window._fbAuth && window._fbAuth.currentUser;
        if (!user) return;
        var db = window._fbDb;
        if (!db) return;

        // Capture profile snapshot — include computed values not stored in _userProfile
        var snap = Object.assign({}, window._userProfile || {});
        var rc = window._fpRiskCache;
        if (rc && rc.score !== undefined) {
            var rKey = rc.score <= 4 ? 'Conservative' : rc.score <= 8 ? 'Moderate' : rc.score <= 11 ? 'Moderate-Aggressive' : 'Aggressive';
            snap.riskProfile = rKey + ' (Score ' + rc.score + '/15)';
        }
        var hs = window._toolSummaries && window._toolSummaries.healthScore;
        if (hs && hs.score !== undefined) {
            snap.healthScore = hs.score + ' / 100' + (hs.label ? ' (' + hs.label + ')' : '');
        }

        // Tax Guide
        if (window._tgPendingData) snap.taxData = Object.assign({}, window._tgPendingData);

        // Emergency Fund
        snap.efMonths = window._efMonths || 6;
        var _efTotal = 0;
        document.querySelectorAll('#expense-rows .expense-row').forEach(function(r) {
            var inp = r.querySelector('.ef-input');
            if (inp) _efTotal += parseInt(String(inp.value).replace(/,/g, '')) || 0;
        });
        document.querySelectorAll('#custom-expense-rows .expense-row').forEach(function(r) {
            var inp = r.querySelector('.ef-input');
            if (inp) _efTotal += parseInt(String(inp.value).replace(/,/g, '')) || 0;
        });
        if (_efTotal > 0) snap.efMonthlyExpenses = _efTotal;

        // Financial Plan
        if (window._fpState) {
            snap.fpGoals = (window._fpState.goals || []).slice();
            var _fpInvEl = document.getElementById('fp-invest-amt');
            if (_fpInvEl && _fpInvEl.value) snap.fpInvestAmt = _fpInvEl.value.replace(/,/g, '');
        }

        // Health Score inputs (from pending state or live DOM)
        var _hsPend = window._hsPendingData || {};
        var _hsIds  = ['hs-income','hs-emi','hs-expenses','hs-savings','hs-health-ins',
                       'hs-term-ins','hs-efund','hs-age','hs-pf-equity','hs-pf-debt',
                       'hs-pf-realty','hs-pf-gold','hs-pf-retiral','hs-pf-other'];
        var _hsInputs = {};
        _hsIds.forEach(function(id) {
            var el = document.getElementById(id);
            var v  = (el ? el.value : '') || _hsPend[id] || '';
            if (v) _hsInputs[id] = v;
        });
        if (Object.keys(_hsInputs).length > 0) snap.hsInputs = _hsInputs;

        // Net Worth Tracker data — try live DOM first, then cached restore
        var _nwAssetIds = ['nw-savings','nw-fd','nw-stocks','nw-eq-mf','nw-epf','nw-ppf','nw-nps',
                           'nw-debt-mf','nw-home','nw-property','nw-gold-phys','nw-gold-paper',
                           'nw-crypto','nw-ins-sv','nw-other-assets'];
        var _nwLiabIds  = ['nw-liab-home','nw-liab-car','nw-liab-pl','nw-liab-edu','nw-liab-cc','nw-liab-other'];
        var _nwData = {};
        var _nwHasData = false;
        _nwAssetIds.concat(_nwLiabIds).forEach(function(id) {
            var el = document.getElementById(id);
            if (el && el.value) { _nwData[id] = el.value.replace(/,/g, ''); _nwHasData = true; }
        });
        if (!_nwHasData && window._cachedRestoreData && window._cachedRestoreData.netWorth) {
            _nwData = Object.assign({}, window._cachedRestoreData.netWorth);
            _nwHasData = Object.keys(_nwData).length > 0;
        }
        if (_nwHasData) snap.nwData = _nwData;

        // Income fallback — fp-income or tg-income if My Profile income is empty
        if (!snap.income || parseFloat(String(snap.income).replace(/,/g,'')) === 0) {
            var _fpIncEl = document.getElementById('fp-income');
            if (_fpIncEl && _fpIncEl.value) snap.income = _fpIncEl.value.replace(/,/g, '');
            if (!snap.income || parseFloat(String(snap.income).replace(/,/g,'')) === 0) {
                var _cachedFp = window._cachedRestoreData && window._cachedRestoreData.finplan;
                if (_cachedFp && _cachedFp['fp-income']) snap.income = String(_cachedFp['fp-income']).replace(/,/g,'');
            }
            if (!snap.income || parseFloat(String(snap.income).replace(/,/g,'')) === 0) {
                var _tgInc = (window._tgPendingData || {})['tg-income'];
                if (_tgInc) { var _tgAmt = parseFloat(String(_tgInc).replace(/,/g,'')); if (_tgAmt > 0) snap.income = String(Math.round(_tgAmt / 12)); }
            }
        }

        // Retirement Hub — live DOM first, then Firestore cache
        var _rhIds = ['rh-age','rh-ret-age','rh-life-exp','rh-inflation','rh-ret-return','rh-expenses',
                      'rh-medical-expenses','rh-medical-inflation',
                      'rh-epf-balance','rh-epf-basic',
                      'rh-ppf-balance','rh-ppf-annual','rh-ppf-years-done',
                      'rh-nps-balance','rh-nps-monthly','rh-nps-return','rh-nps-annuity','rh-nps-lumpsum-pct',
                      'rh-sip-monthly','rh-sip-return','rh-other-corpus','rh-other-return'];
        var _rhLive = {}; var _rhHasLive = false;
        _rhIds.forEach(function(id) {
            var el = document.getElementById(id);
            if (el && el.value) { _rhLive[id] = el.value; _rhHasLive = true; }
        });
        snap.rhData = _rhHasLive ? _rhLive
            : (window._cachedRestoreData && window._cachedRestoreData.retirementHub
                ? Object.assign({}, window._cachedRestoreData.retirementHub) : {});

        // Budget Tracker — live window._btData first, then Firestore cache
        if (window._btData && Object.keys(window._btData).length > 0) {
            snap.budgetData = window._btData;
            snap.budgetCustomCats = window._btCustomCats || [];
        } else if (window._cachedRestoreData && window._cachedRestoreData.budgetTracker) {
            try {
                var _btc = window._cachedRestoreData.budgetTracker;
                if (_btc.data) snap.budgetData = JSON.parse(_btc.data);
                if (_btc.customCats) snap.budgetCustomCats = JSON.parse(_btc.customCats);
            } catch(e) {}
        }

        // Tool summaries (health score grade, finplan label)
        if (window._toolSummaries) snap.toolSummaries = Object.assign({}, window._toolSummaries);

        // Cached tool data (EPF calc)
        if (window._cachedRestoreData) {
            snap._cached = { epfCalc: window._cachedRestoreData.epfCalc || {} };
        }

        // Generate PDF — silent if jsPDF unavailable
        var pdfBase64 = null;
        try { pdfBase64 = _consultBuildProfilePdf(snap); } catch (ex) { console.warn('[consult] pdf error:', ex); }

        var booking = {
            userId:              user.uid,
            userEmail:           user.email,
            userName:            (window._userProfile || {}).name || user.displayName || '',
            expertId:            e.id,
            expertName:          e.name,
            slot:                { date: date, time: time },
            status:              'confirmed',
            userProfileSnapshot: snap,
            profilePdfBase64:    pdfBase64,
            createdAt:           Date.now()
        };

        // Disable all slot buttons while saving
        document.querySelectorAll('#consult-sec-slots button').forEach(function(b){ b.disabled = true; });

        db.collection('bookings').add(booking)
            .then(function(docRef) {
                _consultView = 'bookings';
                _consultSelected = null;
                _consultRenderView();
                _consultLoadMyBookings();
                _consultShowToast('Booking confirmed! You will be contacted before your session.');
            })
            .catch(function(err) {
                _consultShowToast('Booking failed. Please try again.');
                document.querySelectorAll('#consult-sec-slots button').forEach(function(b){ b.disabled = false; });
                console.error('[consult] booking error:', err);
            });
    }

    /* ── My Bookings ── */
    function _consultLoadMyBookings() {
        var db   = window._fbDb;
        var user = window._fbAuth && window._fbAuth.currentUser;
        if (!db || !user) return;
        var listEl = document.getElementById('consult-bookings-list');
        if (listEl) listEl.innerHTML = '<div class="text-center py-6 text-slate-400 text-[12px]">Loading…</div>';
        db.collection('bookings').where('userId', '==', user.uid)
            .orderBy('createdAt', 'desc').limit(20).get()
            .then(function(snap) {
                if (!listEl) return;
                if (snap.empty) {
                    listEl.innerHTML = '<div class="text-center py-8 text-slate-400 text-[12px]"><div class="text-3xl mb-2">📭</div>No bookings yet.</div>';
                    return;
                }
                var html = '';
                var hasDone = false;
                snap.forEach(function(doc) {
                    var b   = doc.data();
                    var bid = doc.id;
                    var isDone    = b.status === 'completed' || b.status === 'cancelled';
                    if (isDone) hasDone = true;
                    var statusColor = b.status === 'confirmed' ? '#059669' : b.status === 'completed' ? '#0891b2' : '#dc2626';
                    var statusLabel = (b.status || 'pending').charAt(0).toUpperCase() + (b.status || '').slice(1);
                    var canChat   = b.status === 'confirmed' || b.status === 'completed';
                    var canCancel = b.status === 'confirmed';
                    var chatBtn = canChat
                        ? '<button onclick="consultOpenChat(\'' + bid + '\',\'' + (b.expertName || 'Expert').replace(/'/g, "\\'") + '\')" ' +
                          'class="flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all" ' +
                          'style="background:linear-gradient(130deg,#0c2340,#1a4a7a);color:#f5c842;border:1px solid rgba(245,200,66,0.3);">💬 Open Chat</button>'
                        : '';
                    var cancelBtn = canCancel
                        ? '<button onclick="consultCancelBooking(\'' + bid + '\')" ' +
                          'class="py-1.5 px-3 rounded-xl text-[11px] font-bold transition-all" ' +
                          'style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;">✕ Cancel</button>'
                        : '';
                    var dismissBtn = isDone
                        ? '<button onclick="document.getElementById(\'cb-' + bid + '\').remove();_consultUpdateClearBtn();" ' +
                          'class="text-[10px] text-slate-300 hover:text-red-400 transition-colors ml-1 px-1 leading-none" title="Dismiss">✕</button>'
                        : '';
                    html += '<div id="cb-' + bid + '" class="bg-white rounded-2xl border border-[#f5c842]/30 shadow-sm p-4' + (isDone ? ' opacity-70' : '') + '">' +
                        '<div class="flex items-start justify-between gap-2">' +
                            '<div>' +
                                '<div class="font-black text-[13px] text-slate-800">🧑‍💼 ' + (b.expertName || 'Expert') + '</div>' +
                                '<div class="text-[11px] text-slate-500 mt-0.5">📅 ' + (b.slot && b.slot.date ? b.slot.date : '') + ' at ' + (b.slot && b.slot.time ? b.slot.time : '') + '</div>' +
                            '</div>' +
                            '<div class="flex items-center gap-1 flex-shrink-0">' +
                                '<span class="text-[10px] font-bold px-2 py-1 rounded-full" style="background:' + statusColor + '22;color:' + statusColor + ';">' + statusLabel + '</span>' +
                                dismissBtn +
                            '</div>' +
                        '</div>' +
                        ((chatBtn || cancelBtn) ? '<div class="flex gap-2 mt-2.5">' + chatBtn + cancelBtn + '</div>' : '') +
                    '</div>';
                });
                var clearAllBtn = hasDone
                    ? '<div class="flex justify-end mb-2"><button id="consult-clear-done-btn" onclick="_consultClearDone()" ' +
                      'class="text-[11px] font-bold px-3 py-1 rounded-xl transition-all" ' +
                      'style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;">🗑 Clear finished</button></div>'
                    : '';
                listEl.innerHTML = clearAllBtn + html;
            })
            .catch(function(err) {
                if (listEl) listEl.innerHTML = '<div class="text-center py-6 text-slate-400 text-[12px]">Could not load bookings. Please try again.</div>';
                console.error('[consult] bookings load error:', err);
            });
    }

    function _consultClearDone() {
        var archiveList = document.getElementById('consult-archive-list');
        var doneEls = document.querySelectorAll('#consult-bookings-list .opacity-70');
        if (archiveList && doneEls.length > 0) {
            var placeholder = archiveList.querySelector('.text-center');
            if (placeholder) placeholder.remove();
            doneEls.forEach(function(el) { archiveList.appendChild(el); });
            _consultUpdateArchiveBadge();
        }
        _consultUpdateClearBtn();
    }
    function _consultUpdateClearBtn() {
        var btn = document.getElementById('consult-clear-done-btn');
        if (!btn) return;
        if (!document.querySelector('#consult-bookings-list .opacity-70')) btn.parentElement.remove();
    }
    function _consultUpdateArchiveBadge() {
        var tab = document.getElementById('consult-tab-archive');
        if (!tab) return;
        var count = document.querySelectorAll('#consult-archive-list > div[id]').length;
        var badge = tab.querySelector('.consult-archive-badge');
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'consult-archive-badge inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black ml-1';
                badge.style.cssText = 'background:#dc2626;color:#fff;';
                tab.appendChild(badge);
            }
            badge.textContent = count;
        } else if (badge) {
            badge.remove();
        }
    }

    /* ── Cancel booking ── */
    function consultCancelBooking(bookingId) {
        if (!confirm('Cancel this booking? This cannot be undone.')) return;
        var db = window._fbDb;
        if (!db) return;
        db.collection('bookings').doc(bookingId).update({ status: 'cancelled' })
            .then(function() {
                _consultShowToast('Booking cancelled.');
                _consultLoadMyBookings();
            })
            .catch(function(err) {
                _consultShowToast('Could not cancel. Please try again.');
                console.error('[consult] cancel error:', err);
            });
    }

    /* ── Chat ── */
    function consultOpenChat(bookingId, expertName) {
        if (_consultChatListener) { _consultChatListener(); _consultChatListener = null; }
        _consultChatBookingId  = bookingId;
        _consultChatExpertName = expertName;
        _consultView = 'chat';
        _consultRenderView();

        var headerEl = document.getElementById('consult-chat-header');
        if (headerEl) headerEl.textContent = '💬 ' + expertName;

        var db = window._fbDb;
        if (!db) return;

        // Clear unread count as soon as the user opens the chat
        db.collection('bookings').doc(bookingId).update({ unreadForUser: 0 }).catch(function(){});

        _consultChatListener = db.collection('conversations').doc(bookingId)
            .collection('messages').orderBy('sentAt', 'asc')
            .onSnapshot(function(snap) {
                var msgs = [];
                snap.forEach(function(d) { msgs.push(Object.assign({ id: d.id }, d.data())); });
                _consultRenderMessages(msgs);
            }, function(err) {
                console.error('[consult] chat listener error:', err);
            });
    }

    function consultCloseChat() {
        if (_consultChatListener) { _consultChatListener(); _consultChatListener = null; }
        _consultChatBookingId = null;
        _consultView = 'bookings';
        _consultRenderView();
        _consultLoadMyBookings();
    }

    function consultSendMessage() {
        var input = document.getElementById('consult-chat-input');
        if (!input) return;
        var text = input.value.trim();
        if (!text || !_consultChatBookingId) return;
        var db   = window._fbDb;
        var user = window._fbAuth && window._fbAuth.currentUser;
        if (!db || !user) return;

        input.value = '';
        input.disabled = true;

        db.collection('conversations').doc(_consultChatBookingId)
            .collection('messages').add({
                senderUid:  user.uid,
                senderRole: 'user',
                text:       text,
                sentAt:     Date.now()
            })
            .then(function() { input.disabled = false; input.focus(); })
            .catch(function(err) {
                input.disabled = false;
                console.error('[consult] send error:', err);
                _consultShowToast('Could not send message. Please try again.');
            });
    }

    function _consultRenderMessages(msgs) {
        var listEl = document.getElementById('consult-chat-messages');
        if (!listEl) return;
        var user = window._fbAuth && window._fbAuth.currentUser;
        var myUid = user ? user.uid : '';

        if (msgs.length === 0) {
            listEl.innerHTML = '<div class="text-center text-slate-400 text-[11px] py-6">No messages yet. Say hello!</div>';
            return;
        }

        listEl.innerHTML = msgs.map(function(m) {
            var isMe = m.senderUid === myUid;
            var isSummary = m.type === 'summary';

            if (isSummary) {
                return '<div class="chat-summary-bubble">' +
                    '<div class="text-[10px] font-black uppercase tracking-wider mb-1.5" style="color:#b45309;">📋 Session Summary from ' + _consultChatExpertName + '</div>' +
                    '<div class="text-[12px] text-slate-700 whitespace-pre-wrap leading-relaxed">' + _escHtml(m.text) + '</div>' +
                '</div>';
            }

            var time = m.sentAt ? new Date(m.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
            return '<div class="flex ' + (isMe ? 'justify-end' : 'justify-start') + '">' +
                '<div class="' + (isMe ? 'chat-bubble-user' : 'chat-bubble-expert') + '">' +
                    '<div class="text-[12px] leading-snug">' + _escHtml(m.text) + '</div>' +
                    '<div class="text-[9px] mt-1 opacity-60 text-right">' + time + '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        listEl.scrollTop = listEl.scrollHeight;
    }

    function _escHtml(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    /* ── PDF profile builder ── */
    function _consultBuildProfilePdf(p) {
        if (!window.jspdf || !window.jspdf.jsPDF) return null;
        p = p || {};
        var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
        var W = 210, L = 14, R = 196, y = 0;
        var _PDF_REWRITE_MARKER = true; // sentinel — remove old code below


        /* ── helpers ── */
        function pn(v) { return parseFloat(String(v || '0').replace(/,/g, '')) || 0; }
        function inr(v)  { var n = pn(v); return n ? 'Rs.' + Math.round(n).toLocaleString('en-IN') : '—'; }
        function inrA(v) {
            var n = pn(v); if (!n) return '—';
            if (n >= 10000000) return 'Rs.' + (n/10000000).toFixed(2) + ' Cr';
            if (n >= 100000)   return 'Rs.' + (n/100000).toFixed(2) + ' L';
            return 'Rs.' + Math.round(n).toLocaleString('en-IN');
        }
        function stripE(s) { return String(s||'').replace(/[\u{1F000}-\u{1FFFF}]/gu,'').replace(/[☀-➿]/g,'').trim(); }
        function newPage() { doc.addPage(); y = 16; }
        function pageCheck(h) { if (y > 283-(h||10)) newPage(); }

        function sHead(title) {
            pageCheck(14); y += 3;
            doc.setFillColor(12,35,64); doc.rect(L, y-5, R-L, 9, 'F');
            doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(245,200,66);
            doc.text(title, L+3, y); y += 7;
        }
        function subHead(title) {
            pageCheck(8);
            doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(12,35,64);
            doc.text(title, L, y); y += 6;
        }
        function row(label, value, vc) {
            pageCheck(7);
            doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(85,85,85);
            doc.text(String(label), L+2, y);
            doc.setFont('helvetica','bold');
            if (vc) doc.setTextColor(vc[0],vc[1],vc[2]); else doc.setTextColor(20,20,20);
            doc.text(String(value||'—'), R, y, {align:'right'}); y += 6;
        }
        function divider() {
            doc.setDrawColor(215); doc.setLineWidth(0.2); doc.line(L, y-1, R, y-1); y += 3;
        }
        function callout(label, value, good) {
            pageCheck(12); y += 1;
            var bg = good===true?[236,253,245]:good===false?[254,226,226]:[239,246,255];
            var tc = good===true?[5,100,60]:good===false?[153,27,27]:[12,35,100];
            doc.setFillColor(bg[0],bg[1],bg[2]);
            doc.roundedRect(L, y-4, R-L, 11, 1.5, 1.5, 'F');
            doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.setTextColor(tc[0],tc[1],tc[2]);
            doc.text(String(label), L+3, y+2); doc.text(String(value||''), R-2, y+2, {align:'right'}); y += 14;
        }
        function taxNew2025(gross) {
            var ti = Math.max(0, gross-75000), tax=0, r=ti;
            [[400000,0],[400000,.05],[400000,.10],[400000,.15],[400000,.20],[400000,.25],[Infinity,.30]].forEach(function(s){
                var c=Math.min(r,s[0]); tax+=c*s[1]; r-=c;
            });
            if (ti<=1200000) tax=0; return Math.round(tax*1.04);
        }
        function taxOld(gross, deduct) {
            var ti=Math.max(0,gross-50000-(deduct||0)), tax=0;
            if (ti>1000000) tax=(ti-1000000)*.30+500000*.20+250000*.05;
            else if (ti>500000) tax=(ti-500000)*.20+250000*.05;
            else if (ti>250000) tax=(ti-250000)*.05;
            if (ti<=500000) tax=0; return Math.round(tax*1.04);
        }
        function goalSIP(target, years, rate) {
            rate=(rate||12)/100/12; var n=(years||1)*12;
            return rate>0?Math.round(target*rate/(Math.pow(1+rate,n)-1)):0;
        }

        /* ══════════ COVER HEADER ══════════ */
        doc.setFillColor(12,35,64); doc.rect(0,0,W,38,'F');
        if (_pdfLogoBase64) { try { doc.addImage(_pdfLogoBase64,'PNG',L,4,18,18); } catch(e){} }
        var titleX = _pdfLogoBase64 ? L+22 : W/2;
        var titleAlign = _pdfLogoBase64 ? 'left' : 'center';
        doc.setFont('times','bold'); doc.setFontSize(18); doc.setTextColor(245,200,66);
        doc.text('AISHWARYAMASTHU', titleX, 14, {align: titleAlign});
        doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(180,210,255);
        doc.text('Client Financial Summary  |  Advisor Copy  |  Confidential', titleX, 21, {align: titleAlign});
        doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(120,160,210);
        doc.text('Generated: ' + new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}), titleX, 28, {align: titleAlign});
        y = 44;

        var occMap = {salaried:'Salaried','self-employed':'Self-Employed',business:'Business Owner',retired:'Retired',student:'Student'};
        doc.setFont('times','bold'); doc.setFontSize(15); doc.setTextColor(12,35,64);
        doc.text(p.name||'Client', L, y);
        doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(80,80,80);
        doc.text([(occMap[p.occupation]||p.occupation||''),(p.age?'Age '+p.age:''),(p.dependents!==undefined&&p.dependents!==''?p.dependents+' dependant(s)':'')].filter(Boolean).join('  ·  '), L, y+7);
        y += 18;

        /* ══════════ 1. NET WORTH ══════════ */
        sHead('1.  NET WORTH ANALYSIS');
        var nwd = p.nwData || {};
        var _nwAK = ['nw-savings','nw-fd','nw-stocks','nw-eq-mf','nw-epf','nw-ppf','nw-nps','nw-debt-mf','nw-home','nw-property','nw-gold-phys','nw-gold-paper','nw-crypto','nw-ins-sv','nw-other-assets'];
        var _nwLK = ['nw-liab-home','nw-liab-car','nw-liab-pl','nw-liab-edu','nw-liab-cc','nw-liab-other'];
        var nwAL = {'nw-savings':'Savings Account','nw-fd':'Fixed Deposits','nw-stocks':'Stocks & Direct Equity','nw-eq-mf':'Equity Mutual Funds','nw-epf':'EPF','nw-ppf':'PPF','nw-nps':'NPS','nw-debt-mf':'Debt Mutual Funds','nw-home':'Primary Home','nw-property':'Other Property','nw-gold-phys':'Physical Gold','nw-gold-paper':'Gold ETF / SGB','nw-crypto':'Crypto','nw-ins-sv':'Insurance Surrender Value','nw-other-assets':'Other Assets'};
        var nwLL = {'nw-liab-home':'Home Loan','nw-liab-car':'Vehicle Loan','nw-liab-pl':'Personal Loan','nw-liab-edu':'Education Loan','nw-liab-cc':'Credit Card Dues','nw-liab-other':'Other Liabilities'};
        var totalAssets = _nwAK.reduce(function(s,k){return s+pn(nwd[k]);},0);
        var totalLiab   = _nwLK.reduce(function(s,k){return s+pn(nwd[k]);},0);
        var netWorth    = totalAssets - totalLiab;

        subHead('ASSETS');
        var hasNwA = false;
        _nwAK.forEach(function(k){ if(pn(nwd[k])>0){ hasNwA=true; pageCheck(6);
            doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(70,70,70);doc.text(nwAL[k],L+3,y);
            doc.setFont('helvetica','bold');doc.setTextColor(20,20,20);
            var pct=totalAssets>0?'  ('+(pn(nwd[k])/totalAssets*100).toFixed(1)+'%)':'';
            doc.text(inr(nwd[k])+pct,R,y,{align:'right'});y+=6;}
        });
        if(!hasNwA){doc.setFont('helvetica','italic');doc.setFontSize(8.5);doc.setTextColor(150,150,150);doc.text('No asset data in Net Worth Tracker.',L+2,y);y+=6;}
        divider(); row('Total Assets', inrA(totalAssets)); y+=2;

        subHead('LIABILITIES');
        var hasNwL = false;
        _nwLK.forEach(function(k){ if(pn(nwd[k])>0){ hasNwL=true; pageCheck(6);
            doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(70,70,70);doc.text(nwLL[k],L+3,y);
            doc.setFont('helvetica','bold');doc.setTextColor(20,20,20);doc.text(inr(nwd[k]),R,y,{align:'right'});y+=6;}
        });
        if(!hasNwL){doc.setFont('helvetica','italic');doc.setFontSize(8.5);doc.setTextColor(150,150,150);doc.text('No liabilities entered.',L+2,y);y+=6;}
        divider(); row('Total Liabilities', inrA(totalLiab)); y+=2;
        callout('NET WORTH', inrA(netWorth), netWorth>=0);
        if(totalAssets>0){ var dtar=(totalLiab/totalAssets*100).toFixed(1)+'%'; row('Debt-to-Asset Ratio',dtar,pn(dtar)>50?[185,28,28]:[5,100,60]); }

        /* ══════════ 2. FINANCIAL HEALTH SCORE ══════════ */
        sHead('2.  FINANCIAL HEALTH SCORE');
        var hsi   = p.hsInputs || {};
        var hsInc = pn(hsi['hs-income'])||pn(p.income);
        var hsEmi = pn(hsi['hs-emi']); var hsExp=pn(hsi['hs-expenses']); var hsSav=pn(hsi['hs-savings']);
        var hsHI  = pn(hsi['hs-health-ins']); var hsTI=pn(hsi['hs-term-ins']); var hsEF=pn(hsi['hs-efund']);
        var hsAge = parseInt(hsi['hs-age']||p.age||'0',10);
        var pfEq=pn(hsi['hs-pf-equity']),pfDbt=pn(hsi['hs-pf-debt']),pfRlt=pn(hsi['hs-pf-realty']),pfGld=pn(hsi['hs-pf-gold']),pfRet=pn(hsi['hs-pf-retiral']),pfOth=pn(hsi['hs-pf-other']);
        var pfTot=pfEq+pfDbt+pfRlt+pfGld+pfRet+pfOth;
        if(hsInc>0){
            var hsAnnInc=hsInc*12,savRate=hsSav/hsInc*100,emiPct=hsEmi/hsInc*100,mthExp=hsExp+hsEmi;
            var spendPct=(hsExp+hsEmi)/hsInc*100,efMths=mthExp>0?hsEF/mthExp:0;
            var hiLakh=hsHI/100000,termMult=hsAnnInc>0?hsTI/hsAnnInc:0;
            var _cats=[];
            _cats.push({n:'Savings Rate',pts:savRate>=30?20:savRate>=20?16:savRate>=10?11:savRate>=5?6:Math.max(0,Math.round(savRate*1.2)),max:20,desc:savRate.toFixed(1)+'% of income saved'});
            _cats.push({n:'Debt Burden',pts:emiPct===0?20:emiPct<20?20:emiPct<30?15:emiPct<40?9:emiPct<50?4:0,max:20,desc:emiPct.toFixed(1)+'% of income on EMIs'});
            _cats.push({n:'Health Insurance',pts:hiLakh>=20?15:hiLakh>=10?13:hiLakh>=5?9:hiLakh>=3?5:hiLakh>=1?2:0,max:15,desc:hiLakh>0?'Rs.'+hiLakh.toFixed(1)+'L sum insured':'No coverage'});
            _cats.push({n:'Term Insurance',pts:termMult>=15?15:termMult>=10?13:termMult>=7?9:termMult>=5?5:termMult>=2?2:0,max:15,desc:termMult>0?termMult.toFixed(1)+'x annual income':'No term plan'});
            _cats.push({n:'Emergency Fund',pts:efMths>=12?15:efMths>=9?12:efMths>=6?10:efMths>=4?7:efMths>=2?4:efMths>=1?2:0,max:15,desc:efMths.toFixed(1)+' months of expenses'});
            _cats.push({n:'Spending Control',pts:spendPct<=50?15:spendPct<=60?12:spendPct<=70?8:spendPct<=80?4:spendPct<=90?1:0,max:15,desc:spendPct.toFixed(1)+'% on expenses+EMI'});
            if(hsAge>=18&&hsAge<=80){ var ap=hsAge<=25?(savRate>=10?10:savRate>=5?8:savRate>0?5:2):hsAge<=35?(savRate>=20?10:savRate>=15?8:savRate>=10?5:savRate>=5?2:0):hsAge<=45?(savRate>=25?10:savRate>=20?7:savRate>=15?4:savRate>=10?1:0):hsAge<=55?(savRate>=30?10:savRate>=25?6:savRate>=20?3:savRate>=15?1:0):(savRate>=35?10:savRate>=30?5:savRate>=25?2:0); _cats.push({n:'Age Readiness',pts:ap,max:10,desc:'Savings rate '+savRate.toFixed(1)+'% at age '+hsAge}); }
            if(pfTot>0){ var pfMult=hsAnnInc>0?pfTot/hsAnnInc:0,acCnt=[pfEq>0,(pfDbt>0||pfRet>0),pfRlt>0,pfGld>0].filter(Boolean).length,idealEq=Math.max(20,100-(hsAge||35)),eqPct=pfTot>0?pfEq/pfTot*100:0,eqGap=Math.abs(eqPct-idealEq),nwp=0;
                nwp+=pfMult>=10?7:pfMult>=5?6:pfMult>=3?5:pfMult>=2?4:pfMult>=1?3:pfMult>=0.5?2:1;
                nwp+=Math.min(4,acCnt); nwp+=eqGap<=10?4:eqGap<=20?3:eqGap<=30?2:0;
                _cats.push({n:'Net Worth Readiness',pts:nwp,max:15,desc:pfMult.toFixed(1)+'x annual income, '+acCnt+' asset classes, equity '+eqPct.toFixed(0)+'% (ideal '+idealEq+'%)'}); }
            var rawTot=_cats.reduce(function(a,c){return a+c.pts;},0),maxTot=_cats.reduce(function(a,c){return a+c.max;},0);
            var hsScore=Math.min(100,Math.round(rawTot*100/maxTot));
            var hsGrade=hsScore>=90?'Financial Rockstar':hsScore>=80?'Wealth Builder':hsScore>=70?'On the Right Track':hsScore>=55?'Getting There':hsScore>=40?'Wake-Up Call':hsScore>=25?'SOS Mode':'Financial Emergency';
            callout('Overall Score: '+hsScore+' / 100  —  '+hsGrade,'',hsScore>=70?true:hsScore>=40?null:false);
            subHead('CATEGORY BREAKDOWN');
            _cats.forEach(function(c){ pageCheck(10);
                doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(70,70,70);doc.text(c.n,L+2,y);
                var pp=c.pts/c.max*100,cc=pp>=80?[5,100,60]:pp>=50?[146,64,14]:[185,28,28];
                doc.setFont('helvetica','bold');doc.setTextColor(cc[0],cc[1],cc[2]);doc.text(c.pts+'/'+c.max,R,y,{align:'right'});
                doc.setFont('helvetica','italic');doc.setFontSize(7.5);doc.setTextColor(120,120,120);y+=4.5;doc.text(c.desc,L+4,y);y+=5;
            });
            y+=2;
            subHead('ACTION PLAN (Top Priority Areas)');
            var _aTips={'Savings Rate':'Increase SIP/savings by at least 5% of income. Every extra rupee now compounds dramatically over 10+ years.','Debt Burden':'EMI above 30% is limiting wealth growth. Prepay the highest-interest loan first using any surplus.','Health Insurance':'Target Rs.10L+ floater for family. A super top-up can add coverage at minimal incremental premium.','Term Insurance':'Need 10-15x annual income in term cover. A Rs.1Cr plan typically costs Rs.500-800/month.','Emergency Fund':'Build 6-month expense buffer. Park in a liquid fund or sweep FD for easy access.','Spending Control':'Expenses+EMI above 70% leaves little to invest. Track and aim to bring below 60%.','Age Readiness':hsAge<=35?'In the wealth-building window — increase SIP aggressively.':hsAge<=50?'Boost savings to 25-30% now. NPS gives extra deduction beyond 80C.':'Prioritise debt freedom, NPS, and PPF. Shift equity SIPs to balanced funds.','Net Worth Readiness':pfTot===0?'Enter savings in Net Worth Tracker to compute this score.':'Diversify: target 3-4 asset classes — equity MF, debt MF/FD, gold (5-10%), EPF/PPF/NPS.'};
            var _sorted=_cats.slice().sort(function(a,b){return (a.pts/a.max)-(b.pts/b.max);}),_shown=0;
            _sorted.forEach(function(c){ if(_shown>=4||c.pts>=c.max||!_aTips[c.n])return; pageCheck(16);
                doc.setFillColor(255,251,235);doc.roundedRect(L,y-1,R-L,14,1.5,1.5,'F');
                doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(146,64,14);doc.text(c.n.toUpperCase(),L+3,y+3);
                doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(60,60,60);
                var tl=doc.splitTextToSize(_aTips[c.n],R-L-6);tl.slice(0,2).forEach(function(ln,i){doc.text(ln,L+3,y+8+(i*4.5));});
                y+=17;_shown++;
            });
            if(_shown===0){doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(5,100,60);doc.text('All categories performing well!',L+2,y);y+=8;}
        } else {
            doc.setFont('helvetica','italic');doc.setFontSize(9);doc.setTextColor(120,120,120);doc.text('Complete the Financial Health Score tool to see this section.',L+2,y);y+=8;
        }

        /* ══════════ 3. INCOME & TAX ══════════ */
        sHead('3.  INCOME & TAX ANALYSIS');
        var monthlyInc=pn(p.income), annualInc=pn(p.annualIncome)||monthlyInc*12;
        row('Monthly In-Hand Income', inr(monthlyInc)); row('Annual Gross Income', inr(annualInc));
        row('Tax Regime Declared', p.regime==='old'?'Old Regime':'New Regime (Budget 2025)'); y+=2;
        var td=p.taxData||{};
        if(Object.keys(td).length>0){
            var grossTax=pn(td['tg-income'])||annualInc; grossTax+=pn(td['tg-other-income']);
            var d80c=Math.min(pn(td['tg-80c']),150000),d80d=pn(td['tg-80d']),dNps=Math.min(pn(td['tg-nps']),50000),dENps=pn(td['tg-emp-nps']),dHra=pn(td['tg-hra']),dHl=Math.min(pn(td['tg-homeloan']),200000),dOth=pn(td['tg-other-deduct']);
            var totalOldD=d80c+d80d+dNps+dENps+dHra+dHl+dOth;
            var tNew=taxNew2025(grossTax),tOld=taxOld(grossTax,totalOldD),diff=tOld-tNew;
            subHead('TAX COMPARISON (incl. 4% Health & Ed. Cess)');
            row('Gross Taxable Income', inr(grossTax));
            row('Estimated Tax — New Regime 2025', inr(tNew), tNew<=tOld?[5,100,60]:[185,28,28]);
            row('Estimated Tax — Old Regime', inr(tOld), tOld<tNew?[5,100,60]:[185,28,28]);
            divider(); callout('Recommended: '+(diff>=0?'New Regime':'Old Regime'), 'Annual Tax Saving: '+inrA(Math.abs(diff)), diff>=0);
            if(totalOldD>0){ subHead('DEDUCTIONS (OLD REGIME)');
                if(d80c>0)  row('80C — ELSS / PPF / LIC / PF', inr(d80c)+' (capped Rs.1.5L)');
                if(d80d>0)  row('80D — Health Insurance',       inr(d80d));
                if(dNps>0)  row('NPS — 80CCD(1B)',              inr(dNps)+' (capped Rs.50K)');
                if(dENps>0) row('NPS — 80CCD(2) Employer',      inr(dENps));
                if(dHra>0)  row('HRA Exemption',                inr(dHra));
                if(dHl>0)   row('Home Loan Interest — 24B',     inr(dHl)+' (capped Rs.2L)');
                if(dOth>0)  row('Other Deductions',             inr(dOth));
                divider(); row('Total Deductions', inr(totalOldD));
            }
            row('Est. Monthly Take-Home (New Regime)', inr(Math.round((grossTax-tNew)/12)));
        } else { doc.setFont('helvetica','italic');doc.setFontSize(9);doc.setTextColor(120,120,120);doc.text('Complete Tax Guide to populate this section.',L+2,y);y+=8; }

        /* ══════════ 4. EMERGENCY FUND & BUDGET ══════════ */
        sHead('4.  EMERGENCY FUND & BUDGET ANALYSIS');
        var bdg=p.budgetData||{},bdgMonths=Object.keys(bdg).sort().reverse(),latestMonth=bdgMonths[0]||'',latestData=latestMonth?(bdg[latestMonth]||{}):{};
        var customCats=p.budgetCustomCats||[];
        var _BT_FIXED=['Housing','Food','Transport','EMIs & Loans','Entertainment','Health','Shopping','Utilities','Education','Others'];
        var allCatKeys=_BT_FIXED.concat(customCats.map(function(c){return c.key||c;}));
        var totalBudget=0,totalActual=0;
        allCatKeys.forEach(function(k){var e=latestData[k]||{b:0,a:0};totalBudget+=(e.b||0);totalActual+=(e.a||0);});
        if(latestMonth){
            var mParts=latestMonth.split('-'),mLabel=mParts.length===2?(new Date(parseInt(mParts[0]),parseInt(mParts[1])-1,1).toLocaleDateString('en-IN',{month:'long',year:'numeric'})):latestMonth;
            subHead('BUDGET VS ACTUAL  —  '+mLabel);
            allCatKeys.forEach(function(k){ var e=latestData[k]||{b:0,a:0}; if(!(e.b||0)&&!(e.a||0))return; pageCheck(7);
                doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(70,70,70);doc.text(k,L+2,y);
                var over=(e.b||0)>0&&(e.a||0)>(e.b||0);
                doc.setFont('helvetica','bold');doc.setTextColor(over?185:20,over?28:20,over?28:20);
                doc.text(((e.a||0)>0?inr(e.a)+' spent':'—')+'  /  '+((e.b||0)>0?inr(e.b)+' budgeted':'—'),R,y,{align:'right'});y+=6;
            });
            divider();
            row('Total Budgeted', inr(totalBudget)); row('Total Actual Spend', inr(totalActual), totalActual>totalBudget&&totalBudget>0?[185,28,28]:[20,20,20]);
            if(totalBudget>0) callout(totalActual<=totalBudget?'Within Budget':'Over Budget',totalActual<=totalBudget?'Saved '+inr(totalBudget-totalActual):'Overspent '+inr(totalActual-totalBudget),totalActual<=totalBudget);
        } else { doc.setFont('helvetica','italic');doc.setFontSize(9);doc.setTextColor(120,120,120);doc.text('No data found in Budget Planner.',L+2,y);y+=8; }
        var efMonthlyExp=pn(p.efMonthlyExpenses)||(hsEmi+hsExp)||totalActual;
        if(efMonthlyExp>0||hsEF>0){ y+=2; subHead('EMERGENCY FUND STATUS');
            var efMths2=pn(p.efMonths)||6,efTarget=efMonthlyExp*efMths2,efAvail=hsEF;
            row('Monthly Expenses (Est.)', inr(efMonthlyExp)); row('Recommended Buffer', efMths2+' months'); row('Emergency Fund Target', inr(efTarget));
            if(efAvail>0){ row('Emergency Fund Available', inr(efAvail)); divider(); callout(efAvail>=efTarget?'Emergency Fund: Adequate':'Emergency Fund: Deficit',efAvail>=efTarget?'Surplus '+inrA(efAvail-efTarget):'Shortfall '+inrA(efTarget-efAvail),efAvail>=efTarget); }
        }

        /* ══════════ 5. CLIENT PROFILE ══════════ */
        sHead('5.  CLIENT PROFILE');
        var _pfRows=[['Full Name',p.name],['Age',p.age?p.age+' years':null],['Occupation',occMap[p.occupation]||p.occupation],['Dependants',p.dependents!==undefined&&p.dependents!==''?String(p.dependents):null],['Monthly Income',monthlyInc>0?inr(monthlyInc):null],['Annual Income',annualInc>0?inrA(annualInc):null],['Tax Regime',p.regime==='old'?'Old Regime':p.regime?'New Regime (Budget 2025)':null],['Retirement Age',p.retireAge?p.retireAge+' years':null],['EPF Balance',pn(p.epfBalance)>0?inr(p.epfBalance):null],['City',p.city==='metro'?'Metro':p.city?'Non-Metro':null]];
        _pfRows.forEach(function(r){if(r[1])row(r[0],r[1]);});

        /* ══════════ 6. FINANCIAL PLAN ══════════ */
        sHead('6.  FINANCIAL PLAN & GOALS');
        var fpGoals=(p.fpGoals&&p.fpGoals.length>0)?p.fpGoals:(p.profileGoals||[]),fpInvAmt=pn(p.fpInvestAmt);
        var fpSum=(p.toolSummaries||{}).finplan||{};
        if(fpInvAmt>0) row('Monthly Investment Capacity', inr(fpInvAmt));
        if(fpSum.profileLabel) row('Risk Profile (at plan creation)', fpSum.profileLabel); y+=2;
        if(fpGoals.length>0){
            var totalSIP=0;
            fpGoals.forEach(function(g){ var label=stripE(g.label||g.type||g.customName||''),tAmt=pn(g.targetAmt),gYrs=parseInt(g.years,10)||0; if(!label&&!tAmt)return; pageCheck(24); subHead(label||'Goal');
                if(tAmt>0) row('  Target Amount', inrA(tAmt)); if(gYrs>0) row('  Time Horizon', gYrs+' year'+(gYrs!==1?'s':''));
                if(tAmt>0&&gYrs>0){ var sip=goalSIP(tAmt,gYrs,12);totalSIP+=sip;row('  Monthly SIP Required (@12% p.a.)',inr(sip));} y+=2;
            });
            if(totalSIP>0){ divider(); row('Total SIP Required (All Goals)',inr(totalSIP)); if(fpInvAmt>0){var sur=fpInvAmt-totalSIP;callout(sur>=0?'Investment Capacity: Sufficient':'Investment Capacity: Shortfall',sur>=0?'Surplus '+inrA(sur):'Shortfall '+inrA(-sur),sur>=0);} }
        } else { doc.setFont('helvetica','italic');doc.setFontSize(9);doc.setTextColor(120,120,120);doc.text('Complete Financial Plan to see goals here.',L+2,y);y+=8; }

        /* ══════════ 7. RETIREMENT & EPF ══════════ */
        sHead('7.  RETIREMENT & EPF PROJECTION');
        var rh=p.rhData||{};
        function rhN(k,d){return pn(rh[k])||d||0;}
        var rhAge=Math.round(rhN('rh-age',30)),rhRetAge=Math.round(rhN('rh-ret-age',60)),rhLifeExp=Math.round(rhN('rh-life-exp',90));
        var rhInfl=rhN('rh-inflation',6)/100,rhRetRet=rhN('rh-ret-return',7)/100;
        var rhYrs=Math.max(0,rhRetAge-rhAge),rhDrawYrs=Math.max(1,rhLifeExp-rhRetAge);
        var EPF_RATE=0.0825,rhEpfBal=rhN('rh-epf-balance'),rhEpfBase=rhN('rh-epf-basic');
        var rhEpfBalFV=rhEpfBal*Math.pow(1+EPF_RATE,rhYrs),emr=EPF_RATE/12;
        var rhEpfMo=rhEpfBase>0?(rhEpfBase*.12+(rhEpfBase*.12-Math.min(1250,Math.round(rhEpfBase*.0833)))):0;
        var rhEpfSip=(rhEpfMo>0&&rhYrs>0&&emr>0)?rhEpfMo*((Math.pow(1+emr,rhYrs*12)-1)/emr)*(1+emr):0;
        var rhEpfC=Math.round(rhEpfBalFV+rhEpfSip);
        var rhPpfBal=rhN('rh-ppf-balance'),rhPpfAnn=rhN('rh-ppf-annual',150000),ppfC2=rhPpfBal;
        for(var py2=0;py2<rhYrs;py2++) ppfC2=(ppfC2+rhPpfAnn)*(1+0.071);
        var rhPpfC=Math.round(ppfC2);
        var rhNpsBal=rhN('rh-nps-balance'),rhNpsMo=rhN('rh-nps-monthly',5000),rhNpsRet=rhN('rh-nps-return',10)/100,rhNpsAnn=rhN('rh-nps-annuity',6)/100,nmr2=rhNpsRet/12;
        var rhNpsBalFV=rhNpsBal*Math.pow(1+rhNpsRet,rhYrs),rhNpsSip=(rhNpsMo>0&&rhYrs>0&&nmr2>0)?rhNpsMo*((Math.pow(1+nmr2,rhYrs*12)-1)/nmr2)*(1+nmr2):0;
        var rhNpsTotal=Math.round(rhNpsBalFV+rhNpsSip),rhNpsLumpPct=Math.min(100,Math.max(0,rhN('rh-nps-lumpsum-pct',60)))/100;
        var rhNpsLump=Math.round(rhNpsTotal*rhNpsLumpPct),rhNpsPool=Math.round(rhNpsTotal*(1-rhNpsLumpPct)),rhNpsPens=Math.round(rhNpsPool*rhNpsAnn/12);
        var rhSipMo=rhN('rh-sip-monthly',10000),rhSipRet=rhN('rh-sip-return',12)/100,smr2=rhSipRet/12;
        var rhSipC=(rhSipMo>0&&rhYrs>0&&smr2>0)?Math.round(rhSipMo*((Math.pow(1+smr2,rhYrs*12)-1)/smr2)*(1+smr2)):0;
        var rhOtherC=Math.round(rhN('rh-other-corpus')*Math.pow(1+(rhN('rh-other-return',7)/100),rhYrs));
        var rhTotalC=rhEpfC+rhPpfC+rhNpsLump+rhSipC+rhOtherC,rMo=rhRetRet/12,rhN2=rhDrawYrs*12;
        var rhSwp=rhTotalC>0?(rMo>0?Math.round(rhTotalC*rMo/(1-Math.pow(1+rMo,-rhN2))):Math.round(rhTotalC/rhN2)):0;
        var rhTotInc=rhSwp+rhNpsPens,rhExpToday=rhN('rh-expenses',60000),rhExpInfl=Math.round(rhExpToday*Math.pow(1+rhInfl,rhYrs));
        var rhMedExp=rhN('rh-medical-expenses',5000),rhMedInfl=rhN('rh-medical-inflation',12)/100,rhMedInfl2=Math.round(rhMedExp*Math.pow(1+rhMedInfl,rhYrs));
        var rhTotExpInfl=rhExpInfl+rhMedInfl2,rhGap=rhTotInc-rhTotExpInfl;
        if(rhAge>0) row('Current Age', rhAge+' years');
        row('Retirement Age', rhRetAge+' years'+(rhYrs>0?' ('+rhYrs+' yrs remaining)':''));
        row('Life Expectancy / Drawdown Period', rhLifeExp+' yrs ('+rhDrawYrs+' yrs drawdown)'); y+=2;
        subHead('PROJECTED CORPUS AT RETIREMENT');
        if(rhEpfC>0)    row('EPF (incl. contributions)', inrA(rhEpfC));
        if(rhPpfC>0)    row('PPF', inrA(rhPpfC));
        if(rhNpsLump>0) row('NPS Lumpsum ('+Math.round(rhNpsLumpPct*100)+'% withdrawal)', inrA(rhNpsLump));
        if(rhSipC>0)    row('Equity SIP / MF Corpus', inrA(rhSipC));
        if(rhOtherC>0)  row('Other Savings', inrA(rhOtherC));
        divider(); callout('Total Retirement Corpus', inrA(rhTotalC), rhTotalC>0); y+=2;
        subHead('MONTHLY INCOME VS EXPENSES AT RETIREMENT');
        row('SWP from corpus', inr(rhSwp)+'/mo'); if(rhNpsPens>0) row('NPS Pension (annuity)', inr(rhNpsPens)+'/mo');
        row('Total Monthly Income', inr(rhTotInc)+'/mo');
        row('Living Expenses (inflated @'+(rhInfl*100).toFixed(0)+'%)', inr(rhExpInfl)+'/mo');
        row('Medical Expenses (inflated @'+(rhMedInfl*100).toFixed(0)+'%)', inr(rhMedInfl2)+'/mo');
        row('Total Inflated Monthly Expenses', inr(rhTotExpInfl)+'/mo');
        divider(); callout('Monthly Surplus / Gap at Retirement',(rhGap>=0?'Surplus ':'Deficit ')+inrA(Math.abs(rhGap))+'/mo', rhGap>=0);

        /* ══════════ 8. RISK APPETITE ══════════ */
        sHead('8.  RISK APPETITE & INVESTMENT PROFILE');
        var rp=p.riskProfile||'';
        if(rp){
            callout('Risk Category', rp, null);
            var _allocs={'Conservative':{eq:20,debt:60,gold:10,liq:10},'Moderate':{eq:50,debt:35,gold:10,liq:5},'Moderate-Aggressive':{eq:65,debt:25,gold:7,liq:3},'Aggressive':{eq:80,debt:15,gold:5,liq:0}};
            var _alloc=null; Object.keys(_allocs).forEach(function(k){if(rp.indexOf(k)>-1)_alloc=_allocs[k];});
            if(_alloc){ subHead('RECOMMENDED PORTFOLIO ALLOCATION');
                row('Equity  (Stocks / Equity MF / ELSS)', _alloc.eq+'%');
                row('Debt    (Bonds / Debt MF / FD / PPF)', _alloc.debt+'%');
                row('Gold    (SGB / Gold ETF / Physical)', _alloc.gold+'%');
                if(_alloc.liq>0) row('Liquid  (Savings / Liquid Fund)', _alloc.liq+'%'); y+=3;
            }
            var _guidance={'Conservative':'Prioritise capital preservation. Focus on debt instruments, PPF, and large-cap funds.','Moderate':'Balanced growth. Mix of equity MFs, debt funds, and some gold.','Moderate-Aggressive':'Growth-oriented. Flexi-cap / mid-cap MFs with some debt cushion.','Aggressive':'High growth. Majority equity (small/mid-cap MFs, direct stocks). Volatility tolerance required.'};
            Object.keys(_guidance).forEach(function(k){ if(rp.indexOf(k)>-1){ pageCheck(12); doc.setFont('helvetica','italic');doc.setFontSize(8.5);doc.setTextColor(80,80,80); var gl=doc.splitTextToSize(_guidance[k],R-L-4); gl.forEach(function(ln){doc.text(ln,L+2,y);y+=5;}); }});
            var fpRc=window._fpRiskCache;
            if(fpRc&&fpRc.answers){ y+=3; subHead('RISK QUESTIONNAIRE ANSWERS');
                var _qL=['If your investment drops 20% in a month, you would:','Your primary income is:','Your main investing goal is:','Your investment horizon is:','Your investing experience is:'];
                var _qO=[['Sell everything','Hold and worry','Hold calmly','Buy more'],['Unstable / freelance','Somewhat stable','Stable employment','Very stable / multiple'],['Preserve capital','Steady income','Balanced growth','Maximum growth'],['Under 2 years','2-5 years','5-10 years','10+ years'],['None','Basic knowledge','Some experience','Very experienced']];
                ['q1','q2','q3','q4','q5'].forEach(function(q,i){ var ans=fpRc.answers[q]; if(ans===undefined||ans===null)return; pageCheck(11);
                    doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(60,60,60);
                    var ql=doc.splitTextToSize('Q'+(i+1)+'. '+_qL[i],R-L-4); ql.forEach(function(ln){doc.text(ln,L+2,y);y+=4.5;});
                    doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(12,35,64);
                    doc.text('-> '+(_qO[i]&&_qO[i][ans]?_qO[i][ans]:'Option '+(ans+1)),L+5,y);y+=6;
                });
                var rpMatch=rp.match(/Score (\d+)\/15/); if(rpMatch){divider();row('Total Risk Score',rpMatch[1]+' / 15');}
            }
        } else { doc.setFont('helvetica','italic');doc.setFontSize(9);doc.setTextColor(120,120,120);doc.text('Complete Risk Assessment in Financial Plan to see this section.',L+2,y);y+=8; }

        /* ══════════ FOOTER ══════════ */
        var nPages=doc.getNumberOfPages();
        for(var pg=1;pg<=nPages;pg++){ doc.setPage(pg); doc.setDrawColor(200);doc.setLineWidth(0.2);doc.line(L,290,R,290);
            doc.setFont('helvetica','italic');doc.setFontSize(7);doc.setTextColor(160,160,160);
            doc.text('Aishwaryamasthu  |  Confidential — For advisor use only  |  Not SEBI-registered investment advice  |  Page '+pg+' of '+nPages, W/2, 295, {align:'center'}); }

        return doc.output('datauristring').split(',')[1];
    }

    /* ── Toast ── */
    function _consultShowToast(msg) {
        var t = document.createElement('div');
        t.textContent = msg;
        t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0c2340;color:#f5c842;font-size:12px;font-weight:700;padding:10px 20px;border-radius:12px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.3);max-width:320px;text-align:center;';
        document.body.appendChild(t);
        setTimeout(function(){ t.remove(); }, 4000);
    }