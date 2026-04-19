/* AishwaryaMasthu Service Worker */
var CACHE = 'am-v1';

/* App shell — pre-cached on SW install. Other files are cached on first access. */
var SHELL = [
  '/',
  '/styles.css',
  '/app.js',
  '/auth.js',
  '/dashboard.js',
  '/mf-explorer.js',
  '/fund-comparator.js',
  '/home-loan.js',
  '/tax-guide.js',
  '/coffee-can.js',
  '/js/user-profile.js',
  '/js/fin-plan.js',
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
  '/js/self-empl.js',
  '/js/gold-comp.js',
  '/js/ulip-check.js',
  '/js/net-worth.js',
  '/js/cg-calc.js',
  '/js/hra-calc.js',
  '/js/ssa-planner.js',
  '/js/health-score.js',
  '/js/emergency.js',
  '/js/fund-picker.js',
  '/js/mf-kit.js',
  '/js/share.js',
  '/js/i18n.js',
  '/js/nom-track.js',
  '/js/budget-tracker.js',
  '/js/roadmap.js',
  '/manifest.json',
  '/icons/icon.svg'
];

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
    }).then(function() {
      return self.skipWaiting();
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

  /* Network-only: Firebase Auth/Firestore, MF API */
  if (url.includes('firebaseapp.com') ||
      url.includes('googleapis.com') ||
      url.includes('firestore.googleapis.com') ||
      url.includes('identitytoolkit') ||
      url.includes('securetoken') ||
      url.includes('mfapi.in')) {
    return; /* let the browser handle it normally */
  }

  /* Network-first for CDN scripts (Tailwind, Chart.js, Firebase SDK) */
  if (url.includes('cdn.tailwindcss') ||
      url.includes('cdn.jsdelivr') ||
      url.includes('cdnjs.cloudflare') ||
      url.includes('gstatic.com')) {
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
