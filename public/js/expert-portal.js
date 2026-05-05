    /* ═══════════════════════════════════════════════
       EXPERT PORTAL — integrated into main app
       Shown instead of the user dashboard when a
       registered expert logs in.
    ═══════════════════════════════════════════════ */

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

    /* ── Tabs ── */
    function epShowTab(tab) {
        var secBook = document.getElementById('ep-sec-bookings');
        var secProf = document.getElementById('ep-sec-profile');
        var tabBook = document.getElementById('ep-tab-bookings');
        var tabProf = document.getElementById('ep-tab-profile');
        if (secBook) secBook.classList.toggle('hidden', tab !== 'bookings');
        if (secProf) secProf.classList.toggle('hidden', tab !== 'profile');
        if (tabBook) tabBook.classList.toggle('consult-tab-active', tab === 'bookings');
        if (tabProf) tabProf.classList.toggle('consult-tab-active', tab === 'profile');
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
                snap.forEach(function(doc) {
                    var b   = doc.data();
                    var bid = doc.id;
                    var statusColors = { confirmed:'#059669', completed:'#0891b2', pending:'#b45309', cancelled:'#dc2626' };
                    var sc = statusColors[b.status] || '#64748b';
                    var sl = (b.status || 'pending').charAt(0).toUpperCase() + (b.status || '').slice(1);
                    html += '<div class="bg-white rounded-2xl border border-[#f5c842]/30 shadow-sm p-4">' +
                        '<div class="flex items-start justify-between gap-3 flex-wrap">' +
                            '<div>' +
                                '<div class="font-black text-[13px] text-slate-800">👤 ' + (b.userName || b.userEmail || 'Client') + '</div>' +
                                '<div class="text-[11px] text-slate-500 mt-0.5">📅 ' + (b.slot ? b.slot.date + ' at ' + b.slot.time : 'N/A') + '</div>' +
                                '<div class="text-[10px] text-slate-400 mt-0.5">' + (b.userEmail || '') + '</div>' +
                            '</div>' +
                            '<span class="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0" style="background:' + sc + '22;color:' + sc + ';">' + sl + '</span>' +
                        '</div>' +
                        '<div class="flex flex-wrap gap-2 mt-3">' +
                            '<button onclick="epViewClientProfile(\'' + bid + '\')" class="consult-tab px-3 py-1.5 rounded-xl text-[11px] font-bold">👤 View Profile</button>' +
                            (b.status === 'confirmed' ? '<button onclick="epMarkComplete(\'' + bid + '\')" class="px-3 py-1.5 rounded-xl text-[11px] font-bold" style="background:#d1fae5;color:#065f46;border:1px solid #6ee7b7;">✓ Mark Complete</button>' : '') +
                        '</div>' +
                    '</div>';
                });
                listEl.innerHTML = html;
            })
            .catch(function(err) {
                listEl.innerHTML = '<div class="text-center py-6 text-slate-400 text-[12px]">Failed to load bookings.</div>';
                console.error('[expert] bookings error:', err);
            });
    }

    /* ── Client profile modal ── */
    function epViewClientProfile(bookingId) {
        var db = window._fbDb;
        if (!db) return;
        db.collection('bookings').doc(bookingId).get()
            .then(function(doc) {
                if (!doc.exists) return;
                var snap = doc.data().userProfileSnapshot || {};
                var rows = [
                    ['Full Name',       snap.name         || ''],
                    ['Age',             snap.age          || ''],
                    ['Occupation',      snap.occupation   || ''],
                    ['Dependents',      snap.dependents !== undefined ? snap.dependents : ''],
                    ['Monthly Income',  snap.income       ? '₹' + Number(snap.income).toLocaleString('en-IN')       : ''],
                    ['Annual Income',   snap.annualIncome ? '₹' + Number(snap.annualIncome).toLocaleString('en-IN') : ''],
                    ['Tax Regime',      snap.regime       || ''],
                    ['Risk Profile',    snap.riskProfile  || ''],
                    ['Retirement Age',  snap.retireAge    || ''],
                    ['EPF Balance',     snap.epfBalance   ? '₹' + Number(snap.epfBalance).toLocaleString('en-IN')   : ''],
                ].filter(function(r) { return r[1] !== ''; });

                var html = rows.map(function(r) {
                    return '<div class="flex justify-between items-center py-1.5 border-b border-slate-50">' +
                        '<span class="text-slate-400 font-semibold text-[11px]">' + r[0] + '</span>' +
                        '<span class="font-bold text-slate-800">' + r[1] + '</span>' +
                    '</div>';
                }).join('');
                if (!html) html = '<div class="text-slate-400 text-[12px] text-center py-4">No profile data captured.</div>';

                var content = document.getElementById('ep-modal-content');
                if (content) content.innerHTML = html;
                var modal = document.getElementById('ep-profile-modal');
                if (modal) modal.classList.remove('hidden');
            })
            .catch(function(err) { console.error('[expert] profile load error:', err); });
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
