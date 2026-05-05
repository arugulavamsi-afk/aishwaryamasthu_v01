    /* ═══════════════════════════════════════════════
       EXPERT PORTAL — integrated into main app
       Shown instead of the user dashboard when a
       registered expert logs in.
    ═══════════════════════════════════════════════ */

    var _epView            = 'bookings'; // 'bookings' | 'profile' | 'chat'
    var _epChatBookingId   = null;
    var _epChatClientName  = '';
    var _epChatListener    = null;
    var _epBookingCache    = {}; // bookingId → booking data (for PDF download)

    function epInitDashboard(expert) {
        // Hide user-facing app, show expert dashboard
        var mainEl = document.querySelector('main');
        var epEl   = document.getElementById('expert-main');
        if (mainEl) mainEl.style.display = 'none';
        if (epEl)   epEl.style.display   = '';

        // Update welcome text in nav greeting
        var greet = document.getElementById('nav-user-greeting');
        if (greet) greet.textContent = '🧑‍💼 ' + (expert.name || expert.email);

        // Set welcome message
        var welcome = document.getElementById('ep-welcome');
        if (welcome) welcome.textContent = 'Welcome back, ' + (expert.name || 'Advisor');

        epShowTab('bookings');
        epLoadBookings(expert.id);
        epLoadProfile(expert);
    }

    function epHideDashboard() {
        var mainEl = document.querySelector('main');
        var epEl   = document.getElementById('expert-main');
        if (mainEl) mainEl.style.display = '';
        if (epEl)   epEl.style.display   = 'none';
    }

    /* ── Tabs / view switcher ── */
    function _epRenderView() {
        var tabsRow  = document.getElementById('ep-tabs');
        var secBook  = document.getElementById('ep-sec-bookings');
        var secProf  = document.getElementById('ep-sec-profile');
        var secChat  = document.getElementById('ep-sec-chat');
        var tabBook  = document.getElementById('ep-tab-bookings');
        var tabProf  = document.getElementById('ep-tab-profile');
        var showChat = _epView === 'chat';

        if (tabsRow) tabsRow.style.display = showChat ? 'none' : '';
        if (secBook) secBook.classList.toggle('hidden', _epView !== 'bookings');
        if (secProf) secProf.classList.toggle('hidden', _epView !== 'profile');
        if (secChat) secChat.classList.toggle('hidden', !showChat);
        if (tabBook) tabBook.classList.toggle('consult-tab-active', _epView === 'bookings');
        if (tabProf) tabProf.classList.toggle('consult-tab-active', _epView === 'profile');
    }

    function epShowTab(tab) {
        if (_epChatListener) { _epChatListener(); _epChatListener = null; }
        _epChatBookingId = null;
        _epView = tab;
        _epRenderView();
    }

    /* ── Load bookings ── */
    function epLoadBookings(expertId) {
        var db     = window._fbDb;
        var listEl = document.getElementById('ep-booking-list');
        if (!db || !listEl) return;
        listEl.innerHTML = '<div class="text-center py-8 text-slate-400 text-[12px]">Loading bookings…</div>';
        db.collection('bookings').where('expertId', '==', expertId)
            .orderBy('createdAt', 'desc').limit(30).get()
            .then(function(snap) {
                if (snap.empty) {
                    listEl.innerHTML = '<div class="text-center py-8 text-slate-400 text-[12px]"><div class="text-3xl mb-2">📭</div>No bookings yet.</div>';
                    return;
                }
                var html = '';
                var epHasDone = false;
                _epBookingCache = {};
                snap.forEach(function(doc) {
                    var b   = doc.data();
                    var bid = doc.id;
                    _epBookingCache[bid] = b;
                    var isDone = b.status === 'completed' || b.status === 'cancelled';
                    if (isDone) epHasDone = true;
                    var statusColors = { confirmed:'#059669', completed:'#0891b2', pending:'#b45309', cancelled:'#dc2626' };
                    var sc = statusColors[b.status] || '#64748b';
                    var sl = (b.status || 'pending').charAt(0).toUpperCase() + (b.status || '').slice(1);
                    var dismissBtn = isDone
                        ? '<button onclick="document.getElementById(\'epb-' + bid + '\').remove();_epUpdateClearBtn();" ' +
                          'class="text-[10px] text-slate-300 hover:text-red-400 transition-colors ml-1 px-1 leading-none" title="Dismiss">✕</button>'
                        : '';
                    html += '<div id="epb-' + bid + '" class="bg-white rounded-2xl border border-[#f5c842]/30 shadow-sm p-4' + (isDone ? ' opacity-70' : '') + '">' +
                        '<div class="flex items-start justify-between gap-3 flex-wrap">' +
                            '<div>' +
                                '<div class="font-black text-[13px] text-slate-800">👤 ' + (b.userName || b.userEmail || 'Client') + '</div>' +
                                '<div class="text-[11px] text-slate-500 mt-0.5">📅 ' + (b.slot ? b.slot.date + ' at ' + b.slot.time : 'N/A') + '</div>' +
                                '<div class="text-[10px] text-slate-400 mt-0.5">' + (b.userEmail || '') + '</div>' +
                            '</div>' +
                            '<div class="flex items-center gap-1 flex-shrink-0">' +
                                '<span class="text-[10px] font-bold px-2 py-1 rounded-full" style="background:' + sc + '22;color:' + sc + ';">' + sl + '</span>' +
                                dismissBtn +
                            '</div>' +
                        '</div>' +
                        '<div class="flex flex-wrap gap-2 mt-3">' +
                            '<button onclick="epViewClientProfile(\'' + bid + '\')" class="consult-tab px-3 py-1.5 rounded-xl text-[11px] font-bold">👤 View Profile</button>' +
                            '<button onclick="epViewClientPdf(\'' + bid + '\')" class="px-3 py-1.5 rounded-xl text-[11px] font-bold" style="background:#f0fdf4;color:#065f46;border:1px solid #6ee7b7;">📄 View PDF</button>' +
                            (b.status === 'confirmed' || b.status === 'completed'
                                ? '<button onclick="epOpenChat(\'' + bid + '\',\'' + (b.userName || b.userEmail || 'Client').replace(/'/g, "\\'") + '\')" class="px-3 py-1.5 rounded-xl text-[11px] font-bold" style="background:linear-gradient(130deg,#0c2340,#1a4a7a);color:#f5c842;border:1px solid rgba(245,200,66,0.3);">💬 Chat</button>'
                                : '') +
                            (b.status === 'confirmed' ? '<button onclick="epMarkComplete(\'' + bid + '\')" class="px-3 py-1.5 rounded-xl text-[11px] font-bold" style="background:#d1fae5;color:#065f46;border:1px solid #6ee7b7;">✓ Mark Complete</button>' : '') +
                        '</div>' +
                    '</div>';
                });
                var epClearAllBtn = epHasDone
                    ? '<div class="flex justify-end mb-2"><button id="ep-clear-done-btn" onclick="_epClearDone()" ' +
                      'class="text-[11px] font-bold px-3 py-1 rounded-xl transition-all" ' +
                      'style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;">🗑 Clear finished</button></div>'
                    : '';
                listEl.innerHTML = epClearAllBtn + html;
            })
            .catch(function(err) {
                listEl.innerHTML = '<div class="text-center py-6 text-slate-400 text-[12px]">Failed to load bookings.</div>';
                console.error('[expert] bookings error:', err);
            });
    }

    function _epClearDone() {
        document.querySelectorAll('#ep-booking-list .opacity-70').forEach(function(el) { el.remove(); });
        _epUpdateClearBtn();
    }
    function _epUpdateClearBtn() {
        var btn = document.getElementById('ep-clear-done-btn');
        if (!btn) return;
        if (!document.querySelector('#ep-booking-list .opacity-70')) btn.parentElement.remove();
    }

    /* ── Client profile modal ── */
    function epViewClientProfile(bookingId) {
        // Use cache if available, else fetch
        var cached = _epBookingCache[bookingId];
        if (cached) {
            _epRenderProfileModal(bookingId, cached);
            return;
        }
        var db = window._fbDb;
        if (!db) return;
        db.collection('bookings').doc(bookingId).get()
            .then(function(doc) {
                if (!doc.exists) return;
                _epRenderProfileModal(bookingId, doc.data());
            })
            .catch(function(err) { console.error('[expert] profile load error:', err); });
    }

    function _epRenderProfileModal(bookingId, bookingData) {
        var snap = bookingData.userProfileSnapshot || {};
        var rows = [
            ['Full Name',      snap.name         || ''],
            ['Age',            snap.age          || ''],
            ['Occupation',     snap.occupation   || ''],
            ['Dependents',     snap.dependents !== undefined ? snap.dependents : ''],
            ['Monthly Income', snap.income       ? '₹' + Number(snap.income).toLocaleString('en-IN')       : ''],
            ['Annual Income',  snap.annualIncome ? '₹' + Number(snap.annualIncome).toLocaleString('en-IN') : ''],
            ['Tax Regime',     snap.regime       || ''],
            ['Retirement Age', snap.retireAge    || ''],
            ['EPF Balance',    snap.epfBalance   ? '₹' + Number(snap.epfBalance).toLocaleString('en-IN')   : ''],
            ['Risk Profile',   snap.riskProfile  || ''],
            ['Health Score',   snap.healthScore  || ''],
        ].filter(function(r) { return r[1] !== ''; });

        var html = rows.map(function(r) {
            return '<div class="flex justify-between items-center py-1.5 border-b border-slate-50">' +
                '<span class="text-slate-400 font-semibold text-[11px]">' + r[0] + '</span>' +
                '<span class="font-bold text-slate-800 text-right ml-2">' + r[1] + '</span>' +
            '</div>';
        }).join('');
        if (!html) html = '<div class="text-slate-400 text-[12px] text-center py-4">No profile data captured.</div>';

        html += '<button onclick="epViewClientPdf(\'' + bookingId + '\')" ' +
            'class="mt-4 w-full py-2 rounded-xl text-[12px] font-bold" ' +
            'style="background:linear-gradient(130deg,#0c2340,#1a4a7a);color:#f5c842;border:1px solid rgba(245,200,66,0.3);">📄 View Full PDF Profile</button>';

        var content = document.getElementById('ep-modal-content');
        if (content) content.innerHTML = html;
        var modal = document.getElementById('ep-profile-modal');
        if (modal) modal.classList.remove('hidden');
    }

    /* ── PDF viewer (view-only, opens in browser tab) ── */
    function epViewClientPdf(bookingId) {
        var b = _epBookingCache[bookingId];
        if (b) { _epDeliverPdf(b, bookingId); return; }
        var db = window._fbDb;
        if (!db) return;
        db.collection('bookings').doc(bookingId).get()
            .then(function(doc) {
                if (!doc.exists) return;
                var data = doc.data();
                _epBookingCache[bookingId] = data;
                _epDeliverPdf(data, bookingId);
            })
            .catch(function(err) { console.error('[expert] pdf view error:', err); });
    }

    function _epDeliverPdf(bookingData, bookingId) {
        if (bookingData.profilePdfBase64) {
            _epOpenPdfInTab(bookingData.profilePdfBase64);
            return;
        }
        // Generate on demand from snapshot (bookings before PDF storage was added)
        if (typeof _consultBuildProfilePdf === 'function') {
            var snap = bookingData.userProfileSnapshot || {};
            var base64 = null;
            try { base64 = _consultBuildProfilePdf(snap); } catch(ex) { console.warn('[expert] pdf gen error:', ex); }
            if (base64) {
                _epOpenPdfInTab(base64);
                var db = window._fbDb;
                if (db) db.collection('bookings').doc(bookingId).update({ profilePdfBase64: base64 }).catch(function(){});
                return;
            }
        }
        alert('PDF could not be generated for this booking.');
    }

    function _epOpenPdfInTab(base64) {
        try {
            var binary = atob(base64);
            var arr = new Uint8Array(binary.length);
            for (var i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
            var blob = new Blob([arr], { type: 'application/pdf' });
            var url  = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(function() { URL.revokeObjectURL(url); }, 60000);
        } catch(e) {
            console.error('[expert] pdf open error:', e);
            alert('Could not open PDF. Please try again.');
        }
    }

    function epCloseProfileModal() {
        var modal = document.getElementById('ep-profile-modal');
        if (modal) modal.classList.add('hidden');
    }

    /* ── Mark complete ── */
    function epMarkComplete(bookingId) {
        var db = window._fbDb;
        if (!db || !window._expertDoc) return;
        db.collection('bookings').doc(bookingId).update({ status: 'completed' })
            .then(function() { epLoadBookings(window._expertDoc.id); })
            .catch(function(err) { console.error('[expert] mark complete error:', err); });
    }

    /* ── Chat ── */
    function epOpenChat(bookingId, clientName) {
        if (_epChatListener) { _epChatListener(); _epChatListener = null; }
        _epChatBookingId  = bookingId;
        _epChatClientName = clientName;
        _epView = 'chat';
        _epRenderView();

        var headerEl = document.getElementById('ep-chat-header');
        if (headerEl) headerEl.textContent = '💬 ' + clientName;

        var db = window._fbDb;
        if (!db) return;

        _epChatListener = db.collection('conversations').doc(bookingId)
            .collection('messages').orderBy('sentAt', 'asc')
            .onSnapshot(function(snap) {
                var msgs = [];
                snap.forEach(function(d) { msgs.push(Object.assign({ id: d.id }, d.data())); });
                _epRenderMessages(msgs);
            }, function(err) {
                console.error('[expert] chat listener error:', err);
            });
    }

    function epCloseChat() {
        if (_epChatListener) { _epChatListener(); _epChatListener = null; }
        _epChatBookingId = null;
        _epView = 'bookings';
        _epRenderView();
        if (window._expertDoc) epLoadBookings(window._expertDoc.id);
    }

    function epSendMessage() {
        var input = document.getElementById('ep-chat-input');
        if (!input) return;
        var text = input.value.trim();
        if (!text || !_epChatBookingId) return;
        var db   = window._fbDb;
        var user = window._fbAuth && window._fbAuth.currentUser;
        if (!db || !user) return;

        input.value = '';
        input.disabled = true;

        db.collection('conversations').doc(_epChatBookingId)
            .collection('messages').add({
                senderUid:  user.uid,
                senderRole: 'expert',
                text:       text,
                sentAt:     Date.now()
            })
            .then(function() {
                input.disabled = false;
                input.focus();
                // Increment unread counter so user sees the badge on their dashboard
                db.collection('bookings').doc(_epChatBookingId).update({
                    unreadForUser: firebase.firestore.FieldValue.increment(1)
                }).catch(function(){});
            })
            .catch(function(err) {
                input.disabled = false;
                console.error('[expert] send error:', err);
            });
    }

    function epPostSummary() {
        var input = document.getElementById('ep-summary-input');
        if (!input) return;
        var text = input.value.trim();
        if (!text || !_epChatBookingId) return;
        var db   = window._fbDb;
        var user = window._fbAuth && window._fbAuth.currentUser;
        if (!db || !user) return;

        var btn = document.getElementById('ep-summary-btn');
        if (btn) btn.disabled = true;
        input.disabled = true;

        db.collection('conversations').doc(_epChatBookingId)
            .collection('messages').add({
                senderUid:  user.uid,
                senderRole: 'expert',
                type:       'summary',
                text:       text,
                sentAt:     Date.now()
            })
            .then(function() {
                input.value = '';
                input.disabled = false;
                if (btn) btn.disabled = false;
                var panel = document.getElementById('ep-summary-panel');
                if (panel) panel.classList.add('hidden');
                // Increment unread counter for the summary message
                db.collection('bookings').doc(_epChatBookingId).update({
                    unreadForUser: firebase.firestore.FieldValue.increment(1)
                }).catch(function(){});
            })
            .catch(function(err) {
                input.disabled = false;
                if (btn) btn.disabled = false;
                console.error('[expert] summary send error:', err);
            });
    }

    function _epRenderMessages(msgs) {
        var listEl = document.getElementById('ep-chat-messages');
        if (!listEl) return;
        var user = window._fbAuth && window._fbAuth.currentUser;
        var myUid = user ? user.uid : '';

        if (msgs.length === 0) {
            listEl.innerHTML = '<div class="text-center text-slate-400 text-[11px] py-6">No messages yet.</div>';
            return;
        }

        listEl.innerHTML = msgs.map(function(m) {
            var isMe = m.senderUid === myUid;
            var isSummary = m.type === 'summary';

            if (isSummary) {
                return '<div class="chat-summary-bubble">' +
                    '<div class="text-[10px] font-black uppercase tracking-wider mb-1.5" style="color:#b45309;">📋 Session Summary</div>' +
                    '<div class="text-[12px] text-slate-700 whitespace-pre-wrap leading-relaxed">' + _epEscHtml(m.text) + '</div>' +
                '</div>';
            }

            var time = m.sentAt ? new Date(m.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
            return '<div class="flex ' + (isMe ? 'justify-end' : 'justify-start') + '">' +
                '<div class="' + (isMe ? 'chat-bubble-user' : 'chat-bubble-expert') + '">' +
                    '<div class="text-[12px] leading-snug">' + _epEscHtml(m.text) + '</div>' +
                    '<div class="text-[9px] mt-1 opacity-60 text-right">' + time + '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        listEl.scrollTop = listEl.scrollHeight;
    }

    function _epEscHtml(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    /* ── Expert's own profile ── */
    function epLoadProfile(expert) {
        var el = document.getElementById('ep-profile-content');
        if (!el) return;
        var rows = [
            ['Name',            expert.name                               || '—'],
            ['Email',           expert.email                              || '—'],
            ['Qualifications',  expert.qualifications                     || '—'],
            ['Experience',      expert.experience ? expert.experience + ' years' : '—'],
            ['Languages',       (expert.languages || []).join(', ')       || '—'],
            ['Specializations', (expert.specialization || []).join(', ') || '—'],
        ];
        el.innerHTML = rows.map(function(r) {
            return '<div class="flex justify-between items-center py-2 border-b border-slate-50">' +
                '<span class="text-slate-400 font-semibold text-[11px] uppercase tracking-wide">' + r[0] + '</span>' +
                '<span class="font-bold text-slate-800">' + r[1] + '</span>' +
            '</div>';
        }).join('') +
        '<p class="text-[11px] text-slate-400 mt-3 leading-relaxed">' + (expert.bio || '') + '</p>' +
        '<p class="text-[10px] text-slate-300 mt-3">To update your profile, contact the admin.</p>';
    }
