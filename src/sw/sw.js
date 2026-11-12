/* MSDEVBUILD Azure service worker. Served at /sw.js by src/pages/sw.js.ts (which stamps the version).
 *
 * Strategy
 *   pages (navigations)  network first → saved copy → /offline/      (learners always get the latest lesson online)
 *   /_astro/* (hashed)   cache first, kept across versions            (file names change when content changes)
 *   images, icons, fonts stale-while-revalidate
 *   everything else      straight to the network
 *
 * Messages from the page
 *   { type: 'SAVE_OFFLINE', urls: [...] }  download pages + their scripts/styles for offline use,
 *                                          replying { type: 'SAVE_PROGRESS', done, total } and { type: 'SAVE_DONE', saved, failed }
 */
const VERSION = '__VERSION__';
const SHELL = 'msdb-shell-' + VERSION;
const PAGES = 'msdb-pages';
const ASSETS = 'msdb-assets';
const MEDIA = 'msdb-media';
const LIMITS = { [PAGES]: 250, [ASSETS]: 600, [MEDIA]: 200 };
const SHELL_URLS = ['/offline/', '/', '/manifest.webmanifest', '/favicon.svg', '/icons/icon-192.png', '/images/author-160.jpg'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // The offline page must be there; the rest is best effort.
    await cache.add(new Request('/offline/', { cache: 'reload' }));
    await Promise.all(SHELL_URLS.slice(1).map((u) => cache.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL, PAGES, ASSETS, MEDIA]);
    await Promise.all((await caches.keys()).filter((k) => k.startsWith('msdb-') && !keep.has(k)).map((k) => caches.delete(k)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => {});
    await self.clients.claim();
  })());
});

const pageKey = (url) => { const u = new URL(url); return u.origin + u.pathname; };

async function trim(name) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  const extra = keys.length - LIMITS[name];
  for (let i = 0; i < extra; i++) await cache.delete(keys[i]);
}

async function put(name, key, res) {
  if (!res || !res.ok || res.redirected || res.type !== 'basic') return;
  const cache = await caches.open(name);
  await cache.put(key, res);
  trim(name);
}

async function page(event) {
  const req = event.request;
  try {
    const res = (await event.preloadResponse) || (await fetch(req));
    if (res.ok) event.waitUntil(put(PAGES, pageKey(req.url), res.clone()));
    return res;
  } catch {
    const key = pageKey(req.url);
    return (await caches.match(key, { ignoreSearch: true }))
      || (await caches.match(req, { ignoreSearch: true }))
      || (await caches.match('/offline/'))
      || new Response('<h1>You are offline</h1>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}

async function cacheFirst(event, name) {
  const hit = await caches.match(event.request);
  if (hit) return hit;
  const res = await fetch(event.request);
  event.waitUntil(put(name, event.request, res.clone()));
  return res;
}

async function staleWhileRevalidate(event, name) {
  const hit = await caches.match(event.request);
  const fresh = fetch(event.request).then((res) => { event.waitUntil(put(name, event.request, res.clone())); return res; });
  if (hit) { event.waitUntil(fresh.catch(() => {})); return hit; }
  return fresh;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') return event.respondWith(page(event));
  if (url.pathname.startsWith('/_astro/')) return event.respondWith(cacheFirst(event, ASSETS));
  if (/\.(png|jpe?g|webp|avif|gif|svg|ico|woff2?)$/i.test(url.pathname) && !url.pathname.startsWith('/og/')) return event.respondWith(staleWhileRevalidate(event, MEDIA));
});

/* ---------- "Save for offline" ---------- */
const ASSET_RE = /(?:src|href)=["'](\/(?:_astro|images|icons)\/[^"'#?]+)["']/g;
const JS_IMPORT_RE = /["'`]\.\/([\w.-]+\.(?:js|css))["'`]/g;

async function saveAssets(urls, seen) {
  const queue = [...urls];
  while (queue.length) {
    const path = queue.shift();
    if (seen.has(path)) continue;
    seen.add(path);
    try {
      let res = await caches.match(path);
      if (!res) {
        res = await fetch(path);
        if (!res.ok) continue;
        await put(path.startsWith('/_astro/') ? ASSETS : MEDIA, path, res.clone());
      }
      // follow lazy-loaded chunks (e.g. the 3D engine) one module at a time
      if (path.endsWith('.js')) {
        const text = await res.text();
        for (const m of text.matchAll(JS_IMPORT_RE)) queue.push('/_astro/' + m[1]);
      }
    } catch {}
  }
}

async function saveOffline(urls, client) {
  const seen = new Set();
  let done = 0, saved = 0, failed = 0;
  const post = (msg) => client && client.postMessage(msg);
  const worker = async () => {
    while (urls.length) {
      const u = urls.shift();
      try {
        const res = await fetch(u, { credentials: 'same-origin' });
        if (!res.ok) throw new Error(String(res.status));
        const html = await res.clone().text();
        await caches.open(PAGES).then((c) => c.put(pageKey(new URL(u, self.location.origin).href), res));
        await saveAssets([...html.matchAll(ASSET_RE)].map((m) => m[1]), seen);
        saved++;
      } catch { failed++; }
      done++;
      post({ type: 'SAVE_PROGRESS', done, total: done + urls.length });
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  post({ type: 'SAVE_DONE', saved, failed });
}

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SAVE_OFFLINE' && Array.isArray(data.urls)) {
    // raise the page limit so a full course download is not trimmed straight away
    LIMITS[PAGES] = Math.max(LIMITS[PAGES], data.urls.length + 100);
    event.waitUntil(saveOffline(data.urls.slice(), event.source));
  }
});
