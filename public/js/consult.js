    /* ═══════════════════════════════════════════════
       CONSULT AN EXPERT — user-side logic
    ═══════════════════════════════════════════════ */

    var _consultExperts = [];   // cached expert list from Firestore
    var _consultView    = 'list'; // 'list' | 'slots' | 'bookings'
    var _consultSelected = null; // selected expert object

    function initConsult() {
        _consultView = 'list';
        _consultRenderView();
        _consultLoadExperts();
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
        var tabList = document.getElementById('consult-tab-list');
        var tabBook = document.getElementById('consult-tab-bookings');
        var secList = document.getElementById('consult-sec-list');
        var secBook = document.getElementById('consult-sec-bookings');
        var secSlot = document.getElementById('consult-sec-slots');
        if (!secList) return;

        var showList = _consultView === 'list';
        var showBook = _consultView === 'bookings';
        var showSlot = _consultView === 'slots';

        if (tabList) tabList.classList.toggle('consult-tab-active', showList);
        if (tabBook) tabBook.classList.toggle('consult-tab-active', showBook);
        if (secList) secList.style.display = (showList || showSlot) ? '' : 'none';
        if (secBook) secBook.style.display = showBook ? '' : 'none';
        if (secSlot) secSlot.style.display = showSlot ? '' : 'none';
    }

    function consultShowTab(tab) {
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
        _consultSelected = _consultExperts.find(function(e){ return e.id === expertId; });
        if (!_consultSelected) return;
        _consultView = 'slots';
        _consultRenderView();
        _consultRenderSlots();
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

        // Capture profile snapshot at booking time
        var snap = Object.assign({}, window._userProfile || {});

        var booking = {
            userId:              user.uid,
            userEmail:           user.email,
            userName:            (window._userProfile || {}).name || user.displayName || '',
            expertId:            e.id,
            expertName:          e.name,
            slot:                { date: date, time: time },
            status:              'confirmed',
            userProfileSnapshot: snap,
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
                snap.forEach(function(doc) {
                    var b = doc.data();
                    var statusColor = b.status === 'confirmed' ? '#059669' : b.status === 'completed' ? '#0891b2' : '#dc2626';
                    var statusLabel = (b.status || 'pending').charAt(0).toUpperCase() + (b.status || '').slice(1);
                    html += '<div class="bg-white rounded-2xl border border-[#f5c842]/30 shadow-sm p-4">' +
                        '<div class="flex items-start justify-between gap-2">' +
                            '<div>' +
                                '<div class="font-black text-[13px] text-slate-800">🧑‍💼 ' + (b.expertName || 'Expert') + '</div>' +
                                '<div class="text-[11px] text-slate-500 mt-0.5">📅 ' + (b.slot && b.slot.date ? b.slot.date : '') + ' at ' + (b.slot && b.slot.time ? b.slot.time : '') + '</div>' +
                            '</div>' +
                            '<span class="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0" style="background:' + statusColor + '22;color:' + statusColor + ';">' + statusLabel + '</span>' +
                        '</div>' +
                    '</div>';
                });
                listEl.innerHTML = html;
            })
            .catch(function(err) {
                console.error('[consult] bookings load error:', err);
            });
    }

    /* ── Toast ── */
    function _consultShowToast(msg) {
        var t = document.createElement('div');
        t.textContent = msg;
        t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#0c2340;color:#f5c842;font-size:12px;font-weight:700;padding:10px 20px;border-radius:12px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.3);max-width:320px;text-align:center;';
        document.body.appendChild(t);
        setTimeout(function(){ t.remove(); }, 4000);
    }
