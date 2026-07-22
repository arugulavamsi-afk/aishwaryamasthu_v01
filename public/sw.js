/* AishwaryaMasthu Service Worker */
var CACHE = 'am-v68';

/* App shell — pre-cached on SW install. Other files are cached on first access. */
var SHELL = [
  '/',
  '/styles.css',
  '/tailwind.css',
  '/app.js',
  '/auth.js',
  '/dashboard.js',
  '/mf-explorer.js',
  '/fund-comparator.js',
  '/home-loan.js',
  '/tax-guide.js',
  '/coffee-can.js',
  '/js/icons.js',
  '/js/user-profile.js',
  '/js/epf.js',
  '/js/ppf-nps.js',
  '/js/step-up-sip.js',
  '/js/insure.js',
  '/js/gratuity.js',
  '/js/drawdown.js',
  '/js/retirement-hub.js',
  '/js/ctc-optimizer.js',
  '/js/fixed-income.js',
  '/js/debt-plan.js',
  '/js/joint-plan.js',
  '/js/cibil.js',
  '/js/consult.js',
  '/js/expert-portal.js',
  '/js/goal-tracker.js',
  '/js/how-to-use.js',
  '/js/user-guide.js',
  '/js/self-empl.js',
  '/js/gold-comp.js',
  '/js/ulip-check.js',
  '/js/net-worth.js',
  '/js/cg-calc.js',
  '/js/hra-calc.js',
  '/js/returns-calc.js',
  '/js/ssa-planner.js',
  '/js/health-score.js',
  '/js/financial-path.js',
  '/js/share.js',
  '/js/i18n.js',
  '/js/nom-track.js',
  '/js/budget-tracker.js',
  '/js/mymfs.js',
  '/panels/budget-tracker.html',
  '/panels/cgcalc.html',
  '/panels/cibil.html',
  '/panels/coffeecan.html',
  '/panels/consult.html',
  '/panels/ctcoptimizer.html',
  '/panels/debtplan.html',
  '/panels/emergency.html',
  '/panels/epfcalc.html',
  '/panels/fincal.html',
  '/panels/finplan.html',
  '/panels/finpath.html',
  '/panels/fixedincome.html',
  '/panels/fundpicker.html',
  '/panels/goaltracker.html',
  '/panels/goldcomp.html',
  '/panels/gratuity.html',
  '/panels/healthscore.html',
  '/panels/homeloan.html',
  '/panels/hracalc.html',
  '/panels/insure.html',
  '/panels/jointplan.html',
  '/panels/mfexplorer.html',
  '/panels/mfkit.html',
  '/panels/mymfs.html',
  '/panels/myprofile.html',
  '/panels/networth.html',
  '/panels/nomtrack.html',
  '/panels/ppfnps.html',
  '/panels/retirementhub.html',
  '/panels/returnscalc.html',
  '/panels/selfempl.html',
  '/panels/ssaplanner.html',
  '/panels/stepupsip.html',
  '/panels/taxguide.html',
  '/panels/ulipcheck.html',
  '/manifest.json',
  '/icons/GoldenEle_Logov02.png',
  '/fonts/cormorant-garamond-roman.woff2',
  '/fonts/cormorant-garamond-roman-ext.woff2',
  '/fonts/cormorant-garamond-italic.woff2'
];

/* ── Skip-waiting message (sent by update toast in index.html) ── */
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

/* ── Install: cache the app shell ── */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      /* Add shell files individually so one missing file doesn't break install */
      return Promise.allSettled(
        SHELL.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW] Failed to cache:', url, err);
          });
        })
      );
    })
  );
});

/* ── Activate: delete old caches ── */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k)   { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: strategy by request type ── */
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  /* Skip non-GET and chrome-extension requests */
  if (e.request.method !== 'GET') return;
  if (url.startsWith('chrome-extension')) return;

  /* Network-only: Firebase Auth/Firestore, Google sign-in (gapi), MF API */
  if (url.includes('firebaseapp.com') ||
      url.includes('googleapis.com') ||
      url.includes('apis.google.com') ||
      url.includes('accounts.google.com') ||
      url.includes('firestore.googleapis.com') ||
      url.includes('identitytoolkit') ||
      url.includes('securetoken') ||
      url.includes('mfapi.in')) {
    return; /* let the browser handle it normally */
  }

  /* Network-first for CDN scripts (Chart.js, Firebase SDK, jsPDF, xlsx)
     and nightly-regenerated data files (Coffee Can screen, MF scores) */
  if (url.includes('cdn.jsdelivr') ||
      url.includes('cdnjs.cloudflare') ||
      url.includes('gstatic.com') ||
      url.includes('/cc-data.json') ||
      url.includes('/mf-data.json')) {
    e.respondWith(
      fetch(e.request).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        return res;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  /* Cache-first for everything else (app shell, panels, assets) */
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var networkFetch = fetch(e.request).then(function(res) {
        if (res && res.status === 200) {
          var clone = res.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        }
        return res;
      });
      return cached || networkFetch;
    })
  );
});
