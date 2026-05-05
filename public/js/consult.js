    /* ═══════════════════════════════════════════════
       CONSULT AN EXPERT — user-side logic
    ═══════════════════════════════════════════════ */

    var _consultExperts        = [];
    var _consultView           = 'list'; // 'list' | 'slots' | 'bookings' | 'chat'
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
        var tabsRow  = document.getElementById('consult-tabs');
        var secList  = document.getElementById('consult-sec-list');
        var secBook  = document.getElementById('consult-sec-bookings');
        var secSlot  = document.getElementById('consult-sec-slots');
        var secChat  = document.getElementById('consult-sec-chat');
        if (!secList) return;

        var showList = _consultView === 'list';
        var showBook = _consultView === 'bookings';
        var showSlot = _consultView === 'slots';
        var showChat = _consultView === 'chat';

        if (tabsRow) tabsRow.style.display = showChat ? 'none' : '';
        if (tabList) tabList.classList.toggle('consult-tab-active', showList);
        if (tabBook) tabBook.classList.toggle('consult-tab-active', showBook);
        if (secList) secList.style.display = (showList || showSlot) ? '' : 'none';
        if (secBook) secBook.style.display = showBook ? '' : 'none';
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

        // Cached tool data (EPF calc, retirement hub)
        if (window._cachedRestoreData) {
            snap._cached = {
                epfCalc:       window._cachedRestoreData.epfCalc       || {},
                retirementHub: window._cachedRestoreData.retirementHub || {}
            };
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
        document.querySelectorAll('#consult-bookings-list .opacity-70').forEach(function(el) { el.remove(); });
        _consultUpdateClearBtn();
    }
    function _consultUpdateClearBtn() {
        var btn = document.getElementById('consult-clear-done-btn');
        if (!btn) return;
        if (!document.querySelector('#consult-bookings-list .opacity-70')) btn.parentElement.remove();
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

        /* ── helpers ── */
        function pn(v) { return parseFloat(String(v || '0').replace(/,/g, '')) || 0; }
        function inr(v) { var n = pn(v); return n ? 'Rs.' + n.toLocaleString('en-IN') : '—'; }
        function inrA(v) {
            var n = pn(v); if (!n) return '—';
            if (n >= 10000000) return 'Rs.' + (n / 10000000).toFixed(2) + ' Cr';
            if (n >= 100000)   return 'Rs.' + (n / 100000).toFixed(2) + ' L';
            return 'Rs.' + n.toLocaleString('en-IN');
        }
        function pctOf(v, total) { return total > 0 ? (pn(v) / total * 100).toFixed(1) + '%' : ''; }
        function stripE(s) { return String(s || '').replace(/[\u{1F000}-\u{1FFFF}]/gu, '').replace(/[☀-➿]/g, '').trim(); }
        function newPage() { doc.addPage(); y = 16; }
        function pageCheck(h) { if (y > 283 - (h || 10)) newPage(); }

        function sHead(title) {
            pageCheck(14);
            y += 3;
            doc.setFillColor(12, 35, 64);
            doc.rect(L, y - 5, R - L, 9, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
            doc.setTextColor(245, 200, 66);
            doc.text(title, L + 3, y);
            y += 7;
        }

        function subHead(title) {
            pageCheck(8);
            doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
            doc.setTextColor(12, 35, 64);
            doc.text(title, L, y);
            y += 6;
        }

        function row(label, value, vcRgb) {
            pageCheck(7);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(85, 85, 85);
            doc.text(String(label), L + 2, y);
            doc.setFont('helvetica', 'bold');
            if (vcRgb) doc.setTextColor(vcRgb[0], vcRgb[1], vcRgb[2]);
            else       doc.setTextColor(20, 20, 20);
            doc.text(String(value || '—'), R, y, { align: 'right' });
            y += 6;
        }

        function divider() {
            doc.setDrawColor(215); doc.setLineWidth(0.2);
            doc.line(L, y - 1, R, y - 1);
            y += 3;
        }

        function callout(label, value, good) {
            pageCheck(12);
            y += 1;
            var bg = good === true ? [236, 253, 245] : good === false ? [254, 226, 226] : [239, 246, 255];
            var tc = good === true ? [5, 100, 60]    : good === false ? [153, 27, 27]    : [12, 35, 100];
            doc.setFillColor(bg[0], bg[1], bg[2]);
            doc.roundedRect(L, y - 4, R - L, 11, 1.5, 1.5, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
            doc.setTextColor(tc[0], tc[1], tc[2]);
            doc.text(String(label), L + 3, y + 2);
            doc.text(String(value || ''), R - 2, y + 2, { align: 'right' });
            y += 14;
        }

        /* ── tax calculators ── */
        function taxNew2025(gross) {
            var ti = Math.max(0, gross - 75000);
            var tax = 0, r = ti;
            [[400000, 0], [400000, 0.05], [400000, 0.10], [400000, 0.15],
             [400000, 0.20], [400000, 0.25], [Infinity, 0.30]].forEach(function(s) {
                var chunk = Math.min(r, s[0]); tax += chunk * s[1]; r -= chunk;
            });
            if (ti <= 1200000) tax = 0;
            return Math.round(tax * 1.04);
        }
        function taxOld(gross, deduct) {
            var ti = Math.max(0, gross - 50000 - (deduct || 0));
            var tax = 0;
            if (ti > 1000000)      tax = (ti - 1000000) * 0.30 + 500000 * 0.20 + 250000 * 0.05;
            else if (ti > 500000)  tax = (ti - 500000)  * 0.20 + 250000 * 0.05;
            else if (ti > 250000)  tax = (ti - 250000)  * 0.05;
            if (ti <= 500000) tax = 0;
            return Math.round(tax * 1.04);
        }

        /* ── goal SIP (PMT) ── */
        function goalSIP(target, years, rate) {
            rate = (rate || 12) / 100 / 12;
            var n = (years || 1) * 12;
            return rate > 0 ? Math.round(target * rate / (Math.pow(1 + rate, n) - 1)) : 0;
        }

        /* ══════════ COVER HEADER ══════════ */
        doc.setFillColor(12, 35, 64);
        doc.rect(0, 0, W, 34, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
        doc.setTextColor(245, 200, 66);
        doc.text('AISHWARYAMASTHU', W / 2, 13, { align: 'center' });
        doc.setFontSize(10); doc.setTextColor(180, 210, 255);
        doc.text('Client Financial Summary Report', W / 2, 21, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(120, 160, 210);
        doc.text('Generated: ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) +
            '   |   Confidential — For Advisor Use Only', W / 2, 28, { align: 'center' });
        y = 40;

        var occMap = { salaried: 'Salaried', 'self-employed': 'Self-Employed', business: 'Business Owner', retired: 'Retired', student: 'Student' };
        doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(12, 35, 64);
        doc.text(p.name || 'Client', L, y);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 80, 80);
        doc.text([(occMap[p.occupation] || p.occupation || ''),
                  (p.age ? 'Age ' + p.age : ''),
                  (p.city === 'metro' ? 'Metro' : p.city ? 'Non-Metro' : ''),
                  (p.dependents !== undefined && p.dependents !== '' ? p.dependents + ' dependant(s)' : '')]
                 .filter(Boolean).join('  ·  '), L, y + 7);
        y += 18;

        /* ── KPI STRIP ── */
        var assetKeys = ['assetsBank', 'assetsMf', 'assetsStocks', 'assetsRe', 'assetsPpf', 'assetsGold', 'assetsOther'];
        var liabKeys  = ['liabHome', 'liabCar', 'liabPersonal', 'liabCc', 'liabOther'];
        var totalAssets = assetKeys.reduce(function(s, k) { return s + pn(p[k]); }, 0);
        var totalLiab   = liabKeys.reduce(function(s, k)  { return s + pn(p[k]); }, 0);
        var netWorth    = totalAssets - totalLiab;

        var kpis = [
            { lbl: 'Net Worth',       val: inrA(netWorth),  bg: netWorth >= 0 ? [236,253,245] : [254,226,226], tc: netWorth >= 0 ? [6,95,70] : [153,27,27] },
            { lbl: 'Health Score',    val: p.healthScore ? p.healthScore.split(' ')[0] + '/100' : '—', bg: [219,234,254], tc: [29,78,216] },
            { lbl: 'Risk Profile',    val: p.riskProfile ? p.riskProfile.split(' ')[0] : '—',         bg: [254,243,199], tc: [146,64,14] },
            { lbl: 'Monthly Income',  val: inrA(p.income), bg: [243,232,255], tc: [88,28,135] },
        ];
        var kW = (R - L - 4.5) / 4;
        kpis.forEach(function(k, i) {
            var bx = L + i * (kW + 1.5);
            doc.setFillColor(k.bg[0], k.bg[1], k.bg[2]);
            doc.roundedRect(bx, y, kW, 19, 2, 2, 'F');
            doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(k.tc[0], k.tc[1], k.tc[2]);
            doc.text(k.val, bx + kW / 2, y + 8, { align: 'center' });
            doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(80, 80, 80);
            doc.text(k.lbl, bx + kW / 2, y + 14.5, { align: 'center' });
        });
        y += 24;

        /* ══════════ 1. NET WORTH ══════════ */
        sHead('1.  NET WORTH ANALYSIS');
        var assetLabels = { assetsBank: 'Bank / FD / Savings', assetsMf: 'Mutual Funds', assetsStocks: 'Stocks & Equity', assetsRe: 'Real Estate', assetsPpf: 'PPF / EPF', assetsGold: 'Gold', assetsOther: 'Other Assets' };
        var liabLabels  = { liabHome: 'Home Loan', liabCar: 'Vehicle Loan', liabPersonal: 'Personal Loan', liabCc: 'Credit Card Dues', liabOther: 'Other Liabilities' };

        subHead('ASSETS');
        assetKeys.forEach(function(k) {
            if (pn(p[k]) > 0) {
                pageCheck(6);
                doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(70, 70, 70);
                doc.text(assetLabels[k], L + 3, y);
                doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20);
                var pctStr = pctOf(p[k], totalAssets);
                doc.text(inr(p[k]) + (pctStr ? '  (' + pctStr + ')' : ''), R, y, { align: 'right' });
                y += 6;
            }
        });
        divider(); row('Total Assets', inr(totalAssets)); y += 2;

        subHead('LIABILITIES');
        liabKeys.forEach(function(k) {
            if (pn(p[k]) > 0) {
                pageCheck(6);
                doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(70, 70, 70);
                doc.text(liabLabels[k], L + 3, y);
                doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20);
                doc.text(inr(p[k]), R, y, { align: 'right' });
                y += 6;
            }
        });
        divider(); row('Total Liabilities', inr(totalLiab)); y += 2;
        callout('NET WORTH', inr(netWorth), netWorth >= 0);

        /* ══════════ 2. INCOME & TAX ══════════ */
        sHead('2.  INCOME & TAX ANALYSIS');
        var monthlyInc = pn(p.income);
        var annualInc  = pn(p.annualIncome) || monthlyInc * 12;
        row('Monthly In-Hand Income', inr(monthlyInc));
        row('Annual Gross Income',    inr(annualInc));
        if (pn(p.basicSalary) > 0) row('Basic Salary (Monthly)', inr(p.basicSalary));
        row('Tax Regime Declared', p.regime === 'old' ? 'Old Regime' : 'New Regime (Budget 2025)');
        y += 2;

        if (p.taxData) {
            var td = p.taxData;
            var grossTax = pn(td['tg-income']) || annualInc;
            grossTax    += pn(td['tg-other-income']);
            var d80c     = Math.min(pn(td['tg-80c']), 150000);
            var d80d     = pn(td['tg-80d']);
            var dNps     = Math.min(pn(td['tg-nps']), 50000);
            var dENps    = pn(td['tg-emp-nps']);
            var dHra     = pn(td['tg-hra']);
            var dHl      = Math.min(pn(td['tg-homeloan']), 200000);
            var dOth     = pn(td['tg-other-deduct']);
            var totalOldD = d80c + d80d + dNps + dENps + dHra + dHl + dOth;

            var tNew = taxNew2025(grossTax);
            var tOld = taxOld(grossTax, totalOldD);
            var diff = tOld - tNew;
            var betterR = diff >= 0 ? 'New Regime' : 'Old Regime';

            subHead('TAX COMPARISON');
            row('Gross Annual Income', inr(grossTax));
            row('Estimated Tax — New Regime 2025', inr(tNew), tNew <= tOld ? [5, 100, 60] : [185, 28, 28]);
            row('Estimated Tax — Old Regime',      inr(tOld), tOld <  tNew ? [5, 100, 60] : [185, 28, 28]);
            divider();
            callout('Recommended: ' + betterR, 'Annual Saving: ' + inr(Math.abs(diff)), diff >= 0);

            if (totalOldD > 0) {
                subHead('DEDUCTIONS (OLD REGIME)');
                if (d80c  > 0) row('Sec 80C — ELSS / PPF / LIC etc.',  inr(d80c));
                if (d80d  > 0) row('Sec 80D — Health Insurance',        inr(d80d));
                if (dNps  > 0) row('NPS — Sec 80CCD(1B)',               inr(dNps));
                if (dENps > 0) row('Employer NPS — Sec 80CCD(2)',       inr(dENps));
                if (dHra  > 0) row('HRA Exemption',                     inr(dHra));
                if (dHl   > 0) row('Home Loan Interest — Sec 24B',      inr(dHl));
                if (dOth  > 0) row('Other Deductions',                   inr(dOth));
                divider();
                row('Total Deductions', inr(totalOldD));
            }
        }

        /* ══════════ 3. EMERGENCY FUND ══════════ */
        sHead('3.  EMERGENCY FUND');
        var efMonths = parseInt(p.efMonths, 10) || 6;
        var efExp    = pn(p.efMonthlyExpenses) || monthlyInc;
        if (efExp > 0) {
            var efTarget = efExp * efMonths;
            var liquid   = pn(p.assetsBank);
            var efOk     = liquid >= efTarget;
            row('Monthly Expenses (Est.)',     inr(efExp));
            row('Recommended Buffer',          efMonths + ' months');
            row('Target Emergency Fund',       inr(efTarget));
            row('Available Liquid Assets',     inr(liquid));
            divider();
            callout(efOk ? 'Emergency Fund: Adequate' : 'Emergency Fund: Deficit',
                    efOk ? 'Surplus ' + inr(liquid - efTarget) : 'Shortfall ' + inr(efTarget - liquid), efOk);
        } else {
            row('Status', 'Fill Emergency Fund tool or add income in My Profile');
        }

        /* ══════════ 4. RETIREMENT & EPF ══════════ */
        sHead('4.  RETIREMENT & EPF PROJECTION');
        var cAge     = parseInt(p.age, 10) || 0;
        var rAge     = parseInt(p.retireAge, 10) || 60;
        var yrsLeft  = (rAge > cAge && cAge > 0) ? rAge - cAge : 0;
        var epfBal   = pn(p.epfBalance);
        var epfBasic = pn(p.basicSalary);
        var cachedEpf = (p._cached && p._cached.epfCalc) ? p._cached.epfCalc : {};

        if (cAge > 0)   row('Current Age',             cAge + ' years');
        if (rAge > 0)   row('Target Retirement Age',   rAge + ' years' + (yrsLeft > 0 ? '  (' + yrsLeft + ' yrs remaining)' : ''));
        if (epfBal > 0) row('Current EPF Balance',     inr(epfBal));

        if (epfBasic > 0) {
            var empEpf     = Math.round(epfBasic * 0.12);
            var erEpf      = Math.round(epfBasic * 0.12);
            var totalEpfM  = empEpf + erEpf;
            row('Basic Salary (Monthly)',          inr(epfBasic));
            row('Employee Contribution (12%)',     inr(empEpf));
            row('Employer Contribution (~12%)',    inr(erEpf));
            row('Total Monthly EPF Contribution', inr(totalEpfM));
        }

        if (yrsLeft > 0 && epfBasic > 0) {
            var epfRate = pn(cachedEpf['epf-rate']) || 8.15;
            var er      = epfRate / 100 / 12;
            var en      = yrsLeft * 12;
            var monthlyC = Math.round(epfBasic * 0.24);
            var fv      = Math.round(epfBal * Math.pow(1 + er, en) + monthlyC * ((Math.pow(1 + er, en) - 1) / er));
            var mthlyDraw = Math.round(fv * 0.04 / 12);
            divider();
            callout('Projected EPF Corpus at Retirement', inr(fv), true);
            row('Est. Monthly Income from Corpus (4% SWR)', inr(mthlyDraw));
        }

        /* ══════════ 5. FINANCIAL PLAN & GOALS ══════════ */
        var fpGoals  = (p.fpGoals && p.fpGoals.length > 0) ? p.fpGoals : (p.profileGoals || []);
        var fpInvAmt = pn(p.fpInvestAmt);
        if (fpGoals.length > 0 || fpInvAmt > 0) {
            sHead('5.  FINANCIAL PLAN & GOALS');
            if (fpInvAmt > 0) { row('Monthly Investment Capacity', inr(fpInvAmt)); y += 2; }

            var totalSIP = 0;
            fpGoals.forEach(function(g) {
                var label = stripE(g.label || g.type || '');
                var tAmt  = pn(g.targetAmt);
                var gYrs  = parseInt(g.years, 10) || 0;
                if (!label && !tAmt) return;
                pageCheck(22);
                subHead(label || 'Goal');
                if (tAmt > 0)  row('  Target Amount',                inr(tAmt));
                if (gYrs > 0)  row('  Time Horizon',                 gYrs + ' year' + (gYrs !== 1 ? 's' : ''));
                if (tAmt > 0 && gYrs > 0) {
                    var sip = goalSIP(tAmt, gYrs, 12);
                    totalSIP += sip;
                    row('  Required Monthly SIP  (@12% p.a.)', inr(sip));
                }
                y += 2;
            });

            if (totalSIP > 0) {
                divider();
                row('Total SIP Required Across All Goals', inr(totalSIP));
                if (fpInvAmt > 0) {
                    var surplus = fpInvAmt - totalSIP;
                    callout(surplus >= 0 ? 'Investment Capacity: Sufficient' : 'Investment Capacity: Short',
                            surplus >= 0 ? 'Surplus ' + inr(surplus) : 'Shortfall ' + inr(-surplus), surplus >= 0);
                }
            }
        }

        /* ══════════ 6. FINANCIAL HEALTH SCORE ══════════ */
        sHead('6.  FINANCIAL HEALTH SCORE');
        if (p.healthScore) {
            var hsNum = parseInt(p.healthScore, 10) || 0;
            callout('Overall Score: ' + p.healthScore, '',
                    hsNum >= 70 ? true : hsNum >= 40 ? null : false);

            var hsi = p.hsInputs || {};
            var hsInc = pn(hsi['hs-income']) || monthlyInc;
            if (hsInc > 0) {
                subHead('KEY METRICS');
                var hsSav = pn(hsi['hs-savings']);
                if (hsSav > 0) {
                    var savR = hsSav / hsInc * 100;
                    row('Savings Rate', savR.toFixed(1) + '%  (target ≥ 20%)',
                        savR >= 20 ? [5, 100, 60] : savR >= 10 ? [146, 64, 14] : [185, 28, 28]);
                }
                var hsEmi = pn(hsi['hs-emi']);
                if (hsEmi > 0) {
                    var emiR = hsEmi / hsInc * 100;
                    row('EMI-to-Income Ratio', emiR.toFixed(1) + '%  (safe ≤ 40%)',
                        emiR <= 40 ? [5, 100, 60] : [185, 28, 28]);
                }
                var hsEf = pn(hsi['hs-efund']);
                if (hsEf > 0) {
                    row('Emergency Fund Buffer', hsEf + ' months  (recommended ≥ 6)',
                        hsEf >= 6 ? [5, 100, 60] : [185, 28, 28]);
                }
                var hsHI = pn(hsi['hs-health-ins']);
                var hsTI = pn(hsi['hs-term-ins']);
                if (hsHI > 0) row('Health Insurance Coverage', inr(hsHI));
                if (hsTI > 0) row('Term Insurance Sum Assured', inr(hsTI));

                // Portfolio allocation check
                var eqPct  = pn(hsi['hs-pf-equity']);
                var dbtPct = pn(hsi['hs-pf-debt']);
                var glPct  = pn(hsi['hs-pf-gold']);
                if (eqPct + dbtPct + glPct > 0) {
                    y += 2; subHead('PORTFOLIO ALLOCATION');
                    if (eqPct  > 0) row('Equity', eqPct + '%');
                    if (dbtPct > 0) row('Debt / Fixed Income', dbtPct + '%');
                    if (glPct  > 0) row('Gold', glPct + '%');
                    var otherPct = pn(hsi['hs-pf-realty']) + pn(hsi['hs-pf-retiral']) + pn(hsi['hs-pf-other']);
                    if (otherPct > 0) row('Real Estate / Retiral / Other', otherPct.toFixed(1) + '%');
                }
            }
        } else {
            row('Status', 'Complete the Financial Health Score tool for details');
        }

        /* ══════════ 7. RISK PROFILE ══════════ */
        sHead('7.  RISK PROFILE & INVESTMENT APPROACH');
        if (p.riskProfile) {
            callout('Risk Category', p.riskProfile, null);
            var allocs = {
                'Conservative':        { eq: 20, debt: 60, gold: 10, liq: 10 },
                'Moderate':            { eq: 50, debt: 35, gold: 10, liq:  5 },
                'Moderate-Aggressive': { eq: 65, debt: 25, gold:  7, liq:  3 },
                'Aggressive':          { eq: 80, debt: 15, gold:  5, liq:  0 },
            };
            var cat = Object.keys(allocs).find(function(k) { return p.riskProfile.indexOf(k) > -1; });
            if (cat) {
                var al = allocs[cat];
                subHead('RECOMMENDED PORTFOLIO ALLOCATION');
                row('Equity  (Stocks / Equity MF / ELSS)',  al.eq   + '%');
                row('Debt    (Bonds / Debt MF / FD / PPF)', al.debt + '%');
                row('Gold    (SGB / Gold ETF / Physical)',  al.gold + '%');
                if (al.liq > 0) row('Liquid  (Savings / Liquid Fund)',    al.liq  + '%');
            }
            y += 2;
            doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(120, 120, 120);
            var guidanceMap = {
                'Conservative':        'Prioritise capital preservation. Focus on debt instruments, PPF, and large-cap funds.',
                'Moderate':            'Balanced growth. Mix of equity MFs, debt funds, and some gold.',
                'Moderate-Aggressive': 'Growth-oriented. Flexi-cap / mid-cap MFs with some debt cushion.',
                'Aggressive':          'High growth. Majority equity (small/mid-cap MFs, direct stocks). Volatility tolerance needed.',
            };
            if (cat && guidanceMap[cat]) {
                var lines = doc.splitTextToSize(guidanceMap[cat], R - L - 4);
                pageCheck(lines.length * 5 + 4);
                lines.forEach(function(ln) { doc.text(ln, L + 2, y); y += 5; });
            }
        } else {
            row('Status', 'Complete the Risk Assessment quiz for personalised guidance');
        }

        /* ══════════ 8. INSURANCE ══════════ */
        var hasIns = p.healthInsurer || pn(p.healthCoverage) > 0 || p.termInsurer || pn(p.termAssured) > 0;
        if (hasIns) {
            sHead('8.  INSURANCE COVERAGE');
            if (p.healthInsurer || pn(p.healthCoverage) > 0) {
                subHead('HEALTH INSURANCE');
                if (p.healthInsurer)          row('Insurer',        p.healthInsurer);
                if (pn(p.healthCoverage) > 0) row('Coverage',       inr(p.healthCoverage));
                if (pn(p.healthPremium)  > 0) row('Annual Premium', inr(p.healthPremium));
                if (p.healthPolicyNo)         row('Policy No.',     p.healthPolicyNo);
                y += 2;
            }
            if (p.termInsurer || pn(p.termAssured) > 0) {
                subHead('TERM INSURANCE');
                if (p.termInsurer)           row('Insurer',         p.termInsurer);
                if (pn(p.termAssured) > 0)   row('Sum Assured',     inr(p.termAssured));
                if (pn(p.termPremium) > 0)   row('Annual Premium',  inr(p.termPremium));
                if (p.termNominee)            row('Nominee',         p.termNominee + (p.termNomineeRel ? ' (' + p.termNomineeRel + ')' : ''));
                var annInc2 = annualInc || monthlyInc * 12;
                if (pn(p.termAssured) > 0 && annInc2 > 0) {
                    var adequate = pn(p.termAssured) >= annInc2 * 10;
                    divider();
                    callout('Term Cover Adequacy  (10× annual income rule)',
                            adequate ? 'Adequate' : 'Possibly Insufficient', adequate);
                }
            }
        }

        /* ══════════ FOOTER (all pages) ══════════ */
        var nPages = doc.getNumberOfPages();
        for (var pg = 1; pg <= nPages; pg++) {
            doc.setPage(pg);
            doc.setDrawColor(200); doc.setLineWidth(0.2);
            doc.line(L, 290, R, 290);
            doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.setTextColor(160, 160, 160);
            doc.text('Aishwaryamasthu  |  Confidential — For advisor use only  |  Not SEBI-registered investment advice  |  Page ' + pg + ' of ' + nPages,
                     W / 2, 295, { align: 'center' });
        }

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
