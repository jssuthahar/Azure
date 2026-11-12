/**
 * Installable app (PWA) helpers used by the header, the /app/ page and the offline page.
 * Nothing here needs an account: install state and preferences live in this browser only.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type Platform = 'ios' | 'android' | 'mac-safari' | 'desktop' | 'other';

export const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: minimal-ui)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

/** iPhone, iPod and iPad (iPadOS reports itself as a Mac with a touch screen). */
export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isIPad = () => /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function platform(): Platform {
  const ua = navigator.userAgent;
  if (isIOS()) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg|Firefox/.test(ua)) return 'mac-safari';
  if (/Windows|Macintosh|CrOS|Linux/.test(ua)) return 'desktop';
  return 'other';
}

let deferred: BeforeInstallPromptEvent | null = (window as unknown as { __msdbBip?: BeforeInstallPromptEvent }).__msdbBip ?? null;
const changed = () => window.dispatchEvent(new CustomEvent('pwa-change'));

addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // we show our own Install button instead of the browser's mini bar
  deferred = e as BeforeInstallPromptEvent;
  changed();
});
addEventListener('appinstalled', () => {
  deferred = null;
  try { localStorage.setItem('msdb-app-installed', '1'); } catch {}
  changed();
});

/** The browser can show its own install dialog right now (Chrome, Edge, Samsung Internet, Opera…). */
export const canPrompt = () => !!deferred;

/** Worth offering an install: the browser has a prompt, or it's iPhone/iPad Safari (manual "Add to Home Screen"). */
export const installable = () => !isStandalone() && (canPrompt() || isIOS());

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  const e = deferred;
  deferred = null;
  await e.prompt();
  const { outcome } = await e.userChoice;
  changed();
  return outcome;
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  const go = () => navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
}

/* ---------- offline copies ---------- */
export const PAGE_CACHE = 'msdb-pages';

export async function savedPaths(): Promise<Set<string>> {
  if (!('caches' in window)) return new Set();
  try {
    const c = await caches.open(PAGE_CACHE);
    return new Set((await c.keys()).map((r) => new URL(r.url).pathname));
  } catch { return new Set(); }
}

export async function storageUsedMB(): Promise<number | null> {
  try { const e = await navigator.storage?.estimate?.(); return e?.usage ? Math.round((e.usage / 1048576) * 10) / 10 : null; } catch { return null; }
}

/** Ask the service worker to download pages (and their scripts/styles) for offline use. */
export async function saveForOffline(urls: string[], onProgress: (done: number, total: number) => void): Promise<{ saved: number; failed: number }> {
  if (!('serviceWorker' in navigator)) throw new Error('This browser cannot save pages for offline use.');
  const reg = await navigator.serviceWorker.ready;
  try { await navigator.storage?.persist?.(); } catch {}
  return new Promise((resolve) => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'SAVE_PROGRESS') onProgress(e.data.done, e.data.total);
      if (e.data?.type === 'SAVE_DONE') { navigator.serviceWorker.removeEventListener('message', onMsg); resolve({ saved: e.data.saved, failed: e.data.failed }); }
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    reg.active!.postMessage({ type: 'SAVE_OFFLINE', urls });
  });
}

export async function clearOffline() {
  if (!('caches' in window)) return;
  await Promise.all(['msdb-pages', 'msdb-assets', 'msdb-media'].map((k) => caches.delete(k)));
}
