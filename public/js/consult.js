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

        // Tax Guide deductions
        if (window._tgPendingData) snap.taxData = Object.assign({}, window._tgPendingData);

        // Emergency Fund — buffer months + total monthly expenses from the EF panel
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

        // Financial Plan — goals list and monthly investment capacity
        if (window._fpState) {
            snap.fpGoals = (window._fpState.goals || []).slice();
            var _fpInvEl = document.getElementById('fp-invest-amt');
            if (_fpInvEl && _fpInvEl.value) snap.fpInvestAmt = _fpInvEl.value.replace(/,/g, '');
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
        p = p || window._userProfile || {};
        var doc  = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
        var W    = 210, L = 14, y = 0, lh = 6.2;

        function pn(v) { return parseFloat(String(v || '0').replace(/,/g, '')) || 0; }
        function inr(v) { var n = pn(v); return n > 0 ? 'Rs.' + n.toLocaleString('en-IN') : '-'; }
        function stripEmoji(s) { return String(s || '').replace(/[\u{1F000}-\u{1FFFF}]/gu, '').replace(/[☀-➿]/g, '').trim(); }

        function pageCheck() { if (y > 272) { doc.addPage(); y = 18; } }

        function sectionHead(title) {
            pageCheck();
            y += 3;
            doc.setFillColor(232, 240, 253);
            doc.rect(L, y - 4.5, W - L * 2, 7.5, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(12, 35, 64);
            doc.text(title, L + 2, y);
            y += 6;
        }

        function row(label, value) {
            pageCheck();
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(label, L, y);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(25, 25, 25);
            doc.text(String(value || '-'), W - L, y, { align: 'right' });
            y += lh;
        }

        function divider() {
            doc.setDrawColor(210);
            doc.line(L, y, W - L, y);
            y += 3;
        }

        // ── Header ──
        doc.setFillColor(12, 35, 64);
        doc.rect(0, 0, W, 28, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(245, 200, 66);
        doc.text('AISHWARYAMASTHU', W / 2, 11, { align: 'center' });
        doc.setFontSize(9);
        doc.setTextColor(180, 210, 255);
        doc.text('Client Financial Profile', W / 2, 18, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(120, 160, 210);
        doc.text('Generated: ' + new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), W / 2, 24, { align: 'center' });
        y = 36;

        // ── Personal Details ──
        var occMap = { salaried: 'Salaried', 'self-employed': 'Self-Employed', business: 'Business Owner', retired: 'Retired', student: 'Student' };
        sectionHead('PERSONAL DETAILS');
        row('Full Name',    p.name || '-');
        row('Age',         p.age ? p.age + ' years' : '-');
        row('Occupation',  occMap[p.occupation] || p.occupation || '-');
        row('Dependents',  p.dependents !== undefined && p.dependents !== '' ? p.dependents : '-');
        row('City Type',   p.city === 'metro' ? 'Metro' : 'Non-Metro');

        // ── Income & Tax ──
        sectionHead('INCOME & TAX');
        row('Monthly In-Hand Income', inr(p.income));
        row('Annual Income',          inr(p.annualIncome));
        row('Tax Regime',             p.regime === 'old' ? 'Old Regime' : 'New Regime (Budget 2025)');
        if (pn(p.basicSalary) > 0) row('Basic Salary (Monthly)', inr(p.basicSalary));

        // ── Tax Deductions ──
        if (p.taxData) {
            var td = p.taxData;
            var c80   = pn(td['tg-80c']);
            var c80d  = pn(td['tg-80d']);
            var cNps  = pn(td['tg-nps']);
            var cEnps = pn(td['tg-emp-nps']);
            var cHra  = pn(td['tg-hra']);
            var cHl   = pn(td['tg-homeloan']);
            var cOth  = pn(td['tg-other-deduct']);
            var totalDeduct = c80 + c80d + cNps + cEnps + cHra + cHl + cOth;
            if (totalDeduct > 0) {
                sectionHead('TAX DEDUCTIONS (ANNUAL)');
                if (c80   > 0) row('Sec 80C (ELSS / PPF / LIC etc.)', 'Rs.' + c80.toLocaleString('en-IN'));
                if (c80d  > 0) row('Sec 80D (Health Insurance)',       'Rs.' + c80d.toLocaleString('en-IN'));
                if (cNps  > 0) row('NPS — Sec 80CCD(1B)',              'Rs.' + cNps.toLocaleString('en-IN'));
                if (cEnps > 0) row('Employer NPS — 80CCD(2)',          'Rs.' + cEnps.toLocaleString('en-IN'));
                if (cHra  > 0) row('HRA Exemption',                    'Rs.' + cHra.toLocaleString('en-IN'));
                if (cHl   > 0) row('Home Loan Interest — Sec 24B',     'Rs.' + cHl.toLocaleString('en-IN'));
                if (cOth  > 0) row('Other Deductions',                  'Rs.' + cOth.toLocaleString('en-IN'));
                divider();
                row('Total Deductions', 'Rs.' + totalDeduct.toLocaleString('en-IN'));
            }
        }

        // ── Assets ──
        var assetKeys = ['assetsBank','assetsMf','assetsStocks','assetsRe','assetsPpf','assetsGold','assetsOther'];
        var liabKeys  = ['liabHome','liabCar','liabPersonal','liabCc','liabOther'];
        var totalAssets = assetKeys.reduce(function(s, k) { return s + pn(p[k]); }, 0);
        var totalLiab   = liabKeys.reduce(function(s, k)  { return s + pn(p[k]); }, 0);
        var netWorth    = totalAssets - totalLiab;
        var assetLabels = { assetsBank:'Bank / Savings', assetsMf:'Mutual Funds', assetsStocks:'Stocks / Shares', assetsRe:'Real Estate', assetsPpf:'PPF / EPF', assetsGold:'Gold', assetsOther:'Other Assets' };
        var liabLabels  = { liabHome:'Home Loan', liabCar:'Car / Vehicle Loan', liabPersonal:'Personal Loan', liabCc:'Credit Card Dues', liabOther:'Other Liabilities' };

        sectionHead('ASSETS');
        var hasAssets = false;
        assetKeys.forEach(function(k) { if (pn(p[k]) > 0) { row(assetLabels[k], inr(p[k])); hasAssets = true; } });
        if (!hasAssets) row('(none recorded)', '');
        divider();
        row('Total Assets', 'Rs.' + totalAssets.toLocaleString('en-IN'));

        sectionHead('LIABILITIES');
        var hasLiab = false;
        liabKeys.forEach(function(k) { if (pn(p[k]) > 0) { row(liabLabels[k], inr(p[k])); hasLiab = true; } });
        if (!hasLiab) row('(none recorded)', '');
        divider();
        row('Total Liabilities', 'Rs.' + totalLiab.toLocaleString('en-IN'));

        // Net worth highlight
        pageCheck();
        y += 2;
        var pos = netWorth >= 0;
        doc.setFillColor(pos ? 240 : 254, pos ? 253 : 242, pos ? 244 : 242);
        doc.rect(L, y - 4.5, W - L * 2, 9, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(pos ? 5 : 185, pos ? 100 : 28, pos ? 60 : 28);
        doc.text('NET WORTH', L + 2, y + 1);
        doc.text((netWorth < 0 ? '-Rs.' : 'Rs.') + Math.abs(netWorth).toLocaleString('en-IN'), W - L, y + 1, { align: 'right' });
        y += 12;

        // ── Emergency Fund ──
        var efMonthsVal = parseInt(p.efMonths, 10) || 0;
        var efExpenses  = pn(p.efMonthlyExpenses) || pn(p.income);
        if (efMonthsVal > 0 || efExpenses > 0) {
            sectionHead('EMERGENCY FUND');
            if (efExpenses  > 0) row('Monthly Expenses (Est.)',  inr(efExpenses));
            if (efMonthsVal > 0) row('Recommended Buffer',       efMonthsVal + ' months');
            if (efExpenses > 0 && efMonthsVal > 0) {
                var efTarget = efExpenses * efMonthsVal;
                row('Target Emergency Fund', 'Rs.' + efTarget.toLocaleString('en-IN'));
                var liquid = pn(p.assetsBank);
                if (liquid > 0) {
                    row('Liquid Savings (Bank / FD)', inr(p.assetsBank));
                    row('Status', liquid >= efTarget ? 'Adequate' : 'Needs top-up');
                }
            }
        }

        // ── Risk Profile ──
        if (p.riskProfile) {
            sectionHead('RISK PROFILE');
            row('Risk Category', p.riskProfile);
        }

        // ── Financial Health Score ──
        if (p.healthScore) {
            sectionHead('FINANCIAL HEALTH SCORE');
            row('Score', p.healthScore);
        }

        // ── Retirement & EPF ──
        var cAge      = parseInt(p.age,      10) || 0;
        var rAge      = parseInt(p.retireAge, 10) || 0;
        var yrsLeft   = (rAge > cAge && cAge > 0) ? rAge - cAge : 0;
        var epfBal    = pn(p.epfBalance);
        var epfBasicS = pn(p.basicSalary);
        if (rAge > 0 || epfBal > 0 || epfBasicS > 0) {
            sectionHead('RETIREMENT & EPF');
            if (cAge > 0) row('Current Age',             cAge + ' years');
            if (rAge > 0) row('Target Retirement Age',   rAge + ' years' + (yrsLeft > 0 ? '  (' + yrsLeft + ' yrs to go)' : ''));
            if (epfBal > 0)    row('Current EPF Balance',    inr(p.epfBalance));
            if (epfBasicS > 0) {
                var monthlyEpf = Math.round(epfBasicS * 0.24);
                row('Basic Salary (Monthly)',          inr(p.basicSalary));
                row('Monthly EPF Contribution (est.)', 'Rs.' + monthlyEpf.toLocaleString('en-IN') + '  (24% of basic)');
                if (yrsLeft > 0) {
                    var er  = 0.0815 / 12;
                    var en  = yrsLeft * 12;
                    var efv = Math.round(epfBal * Math.pow(1 + er, en) +
                                  monthlyEpf * ((Math.pow(1 + er, en) - 1) / er));
                    row('Projected EPF Corpus at Retirement', 'Rs.' + efv.toLocaleString('en-IN'));
                }
            }
        }

        // ── Insurance ──
        if (p.healthInsurer || pn(p.healthCoverage) > 0) {
            sectionHead('HEALTH INSURANCE');
            if (p.healthInsurer)          row('Insurer',       p.healthInsurer);
            if (pn(p.healthCoverage) > 0) row('Coverage',      inr(p.healthCoverage));
            if (pn(p.healthPremium)  > 0) row('Annual Premium',inr(p.healthPremium));
            if (p.healthPolicyNo)         row('Policy No.',    p.healthPolicyNo);
        }
        if (p.termInsurer || pn(p.termAssured) > 0) {
            sectionHead('TERM INSURANCE');
            if (p.termInsurer)          row('Insurer',       p.termInsurer);
            if (pn(p.termAssured) > 0) row('Sum Assured',   inr(p.termAssured));
            if (pn(p.termPremium) > 0) row('Annual Premium',inr(p.termPremium));
            if (p.termNominee) row('Nominee', p.termNominee + (p.termNomineeRel ? ' (' + p.termNomineeRel + ')' : ''));
        }

        // ── Financial Plan & Goals ──
        var fpGoalList  = (p.fpGoals && p.fpGoals.length > 0) ? p.fpGoals : (p.profileGoals || []);
        var fpInvestAmt = pn(p.fpInvestAmt);
        if (fpGoalList.length > 0 || fpInvestAmt > 0) {
            sectionHead('FINANCIAL PLAN & GOALS');
            if (fpInvestAmt > 0) row('Monthly Investment Capacity', inr(p.fpInvestAmt));
            fpGoalList.forEach(function(g) {
                pageCheck();
                var label = stripEmoji(g.label || g.type || '');
                var detail = [];
                if (pn(g.targetAmt) > 0) detail.push('Rs.' + Number(g.targetAmt).toLocaleString('en-IN'));
                if (g.years) detail.push(g.years + ' yr' + (g.years !== 1 ? 's' : ''));
                row(label || '-', detail.join(' · ') || '-');
            });
        }

        // ── Footer ──
        var fy = Math.max(y + 10, 282);
        if (fy > 292) { doc.addPage(); fy = 288; }
        doc.setDrawColor(210);
        doc.line(L, fy - 5, W - L, fy - 5);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(160);
        doc.text('Aishwaryamasthu  |  For educational purposes only  |  Not SEBI-registered investment advice', W / 2, fy, { align: 'center' });

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
