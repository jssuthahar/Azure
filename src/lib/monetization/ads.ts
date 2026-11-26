/**
 * Client ad engine. One module for every page: finds .ad-host placeholders, decides whether
 * each may show, lazy-loads it, and keeps learners in "focus mode" (no anchor ad) while a
 * simulation, quiz or game is on screen.
 *
 * The AdSense script itself is injected once in <head> by AdsHead.astro, which also sets
 * <html data-ads="live|debug|off"> before paint so reserved space never jumps.
 *
 * Hosts (from AdSlot.astro):
 *   <div class="ad-host" data-unit="inArticle">                       lazy, on scroll
 *   <div class="ad-host" data-unit="multiplex" data-ad-trigger="quiz"> after a lesson quiz is checked
 *   <div class="ad-host" data-unit="multiplex" data-ad-reveal="#done"> when a results screen shows
 *   <div data-ad-mid>                                                   lesson: add one inArticle mid-explanation if it's long
 */
import { MONETIZATION as M, isAdFreePath, supportUrl, type UnitKey } from './config';
import { isSupporter } from './supporter';

const html = document.documentElement;
const mode = () => html.dataset.ads as 'live' | 'debug' | 'off' | undefined;
const debug = () => mode() === 'debug';
const counts = (u: UnitKey) => u !== 'sidebar';
let inContent = 0;

const unitOf = (host: HTMLElement) => host.dataset.unit as UnitKey;

/** Every reason an ad may not show. Learning wins: any doubt means no ad. */
function allowed(host: HTMLElement, { ignoreCap = false } = {}): boolean {
  const unit = M.units[unitOf(host)];
  if (!unit || !M.adsEnabled) return false;
  const m = mode();
  if (m !== 'live' && m !== 'debug') return false;
  if (M.supporterAdFree && isSupporter()) return false;
  if (!navigator.onLine) return false;
  if (isAdFreePath(location.pathname)) return false;
  if ('minViewport' in unit && unit.minViewport && innerWidth < unit.minViewport) return false;
  const maxVp = Number(host.dataset.maxViewport || 0);
  if (maxVp && innerWidth > maxVp) return false;
  if (unit.slot.startsWith('SLOT_ID_') && !debug()) return false;
  // hidden by CSS (container query, view mode, results screen not shown yet)
  if (!host.getClientRects().length) return false;
  if (unitOf(host) === 'leaderboard' && host.clientWidth < 970) return false;
  if (!ignoreCap && counts(unitOf(host)) && inContent >= M.maxInContentAdsPerPage) return false;
  return true;
}

/**
 * Render one ad unit into containerEl. Pushes to adsbygoogle exactly once per <ins>.
 * In debug mode (or for an unfinished SLOT_ID_ unit in debug) it draws a labelled grey box instead.
 */
export function renderAd(unitKey: UnitKey, containerEl: HTMLElement): boolean {
  const unit = M.units[unitKey];
  if (containerEl.querySelector('.ad-wrap')) return false; // already filled
  const wrap = document.createElement('div');
  wrap.className = 'ad-wrap';
  wrap.dataset.unit = unitKey;
  wrap.setAttribute('role', 'complementary');
  wrap.setAttribute('aria-label', 'Advertisement');
  const label = document.createElement('span');
  label.className = 'ad-label';
  label.setAttribute('aria-hidden', 'true'); // the wrapper already says "Advertisement"; keeps Listen from reading it
  label.textContent = 'Advertisement';
  wrap.append(label);

  if (debug() || unit.slot.startsWith('SLOT_ID_')) {
    const box = document.createElement('div');
    box.className = 'ad-debug';
    box.textContent = `${unitKey} · ${unit.size}${unit.slot.startsWith('SLOT_ID_') ? ' · slot not created yet' : ` · slot ${unit.slot}`}`;
    wrap.append(box);
    containerEl.prepend(wrap);
  } else {
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.setAttribute('style', unit.style);
    ins.dataset.adClient = M.adClient;
    ins.dataset.adSlot = unit.slot;
    for (const [k, v] of Object.entries(unit.attrs)) ins.setAttribute(k, v);
    wrap.append(ins);
    containerEl.prepend(wrap);
    if (!ins.dataset.adsbygoogleStatus) {
      try { ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({}); } catch {}
    }
  }
  containerEl.dataset.adState = 'filled';
  if (counts(unitKey)) inContent++;
  return true;
}

function clear(host: HTMLElement) {
  if (host.dataset.adState !== 'filled') return;
  host.querySelector('.ad-wrap')?.remove();
  host.dataset.adState = 'idle';
  if (counts(unitOf(host))) inContent = Math.max(0, inContent - 1);
}

/** Slot for a host: collapses it (no empty reserved box) when it can never show here. */
function settle(host: HTMLElement) {
  if (host.dataset.adState === 'filled') return;
  host.dataset.adState = allowed(host, { ignoreCap: true }) ? 'idle' : 'off';
}

// ---------------------------------------------------------------- lazy loading
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const host = e.target as HTMLElement;
        if (allowed(host)) { renderAd(unitOf(host), host); io!.unobserve(host); }
      }
    }, { rootMargin: '200px 0px' })
  : null;

const watch = (host: HTMLElement) => { if (host.dataset.adState !== 'filled' && allowed(host)) io?.observe(host); };

// ---------------------------------------------------------------- triggers
function afterQuiz(host: HTMLElement) {
  host.hidden = true; // never on page load
  document.addEventListener('submit', (e) => {
    if (!(e.target as Element)?.closest?.('.kc')) return;
    if (host.dataset.adState === 'filled' || !host.hidden) return;
    host.hidden = false;
    if (allowed(host)) { watch(host); nudge(host); }
    else host.hidden = true;
  });
}

function afterReveal(host: HTMLElement) {
  const target = document.querySelector<HTMLElement>(host.dataset.adReveal!);
  if (!target) return;
  const shown = () => !target.hidden && !target.classList.contains('hidden') && target.getClientRects().length > 0;
  const sync = () => {
    const on = shown();
    host.hidden = !on; // hide with the results; never re-request on "play again"
    if (on && host.dataset.adState !== 'filled' && allowed(host)) watch(host);
  };
  host.hidden = true;
  new MutationObserver(sync).observe(target, { attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
}

/** One quiet line under the post-quiz ad, at most once per browser session. */
function nudge(host: HTMLElement) {
  if (host.querySelector('.ad-nudge')) return;
  try { if (sessionStorage.getItem('msdb-ad-nudge')) return; sessionStorage.setItem('msdb-ad-nudge', '1'); } catch {}
  const p = document.createElement('p');
  p.className = 'ad-nudge';
  p.innerHTML = `Prefer no ads? <a href="${supportUrl()}" target="_blank" rel="noopener">Support the site →</a>`;
  host.append(p); // inside the slot, so it sits right under the ad
}

// ---------------------------------------------------------------- lesson: second in-article ad
function midLesson(root: HTMLElement) {
  if (mode() !== 'live' && mode() !== 'debug') return;
  const lesson = root.querySelector<HTMLElement>('.lesson');
  if (!lesson) return;
  const sections = [...lesson.querySelectorAll<HTMLElement>(':scope > .lesson-section')];
  const words = sections.reduce((n, s) => n + (s.textContent || '').trim().split(/\s+/).length, 0);
  if (words < 600 || sections.length < 3) return;
  // a visible section near the middle, never the first
  const visible = sections.filter((s) => s.getClientRects().length > 0);
  const pick = visible[Math.max(1, Math.floor(visible.length / 2))];
  if (!pick) return;
  const host = document.createElement('div');
  host.className = 'ad-host not-prose';
  host.dataset.unit = 'inArticle';
  host.dataset.slideSkip = '';
  host.dataset.noAnnotate = '';
  pick.before(host);
}

// ---------------------------------------------------------------- focus mode (mobile anchor ad)
function focusMode() {
  const zones = [...document.querySelectorAll<HTMLElement>('#simulations, .kc, [data-focus-zone]')];
  if (!zones.length || !('IntersectionObserver' in window)) return;
  const live = new Set<Element>();
  const fio = new IntersectionObserver((entries) => {
    for (const e of entries) e.isIntersecting ? live.add(e.target) : live.delete(e.target);
    document.body.classList.toggle('focus-mode', live.size > 0);
  }, { threshold: 0.2 });
  zones.forEach((z) => fio.observe(z));
}

// ---------------------------------------------------------------- boot
function boot() {
  focusMode();
  html.dataset.adsReady = '1'; // for QA: the engine has run
  if (mode() === 'off' || !mode()) return;
  document.querySelectorAll<HTMLElement>('[data-ad-mid]').forEach(midLesson);
  const hosts = [...document.querySelectorAll<HTMLElement>('.ad-host')];
  for (const h of hosts) {
    if (h.dataset.adTrigger === 'quiz') { settle(h); afterQuiz(h); continue; }
    if (h.dataset.adReveal) { settle(h); afterReveal(h); continue; }
    settle(h);
    watch(h);
  }

  // On a cold first visit a slot can miss its one visibility check and then never fill.
  // Look again (fresh observation) on the first scroll and once the page has settled.
  const retry = () => {
    for (const h of hosts) {
      if (h.hidden || h.dataset.adTrigger || h.dataset.adReveal || h.dataset.adState === 'filled') continue;
      settle(h);
      io?.unobserve(h);
      watch(h);
    }
  };
  addEventListener('scroll', retry, { once: true, passive: true });
  setTimeout(retry, 1500);

  // Viewport rules are re-checked on resize: drop ads that no longer fit, try ones that now do.
  let t = 0;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = window.setTimeout(() => {
      for (const h of document.querySelectorAll<HTMLElement>('.ad-host')) {
        if (h.hidden) continue;
        if (h.dataset.adState === 'filled' && !allowed(h, { ignoreCap: true })) clear(h);
        if (h.dataset.adState !== 'filled') { settle(h); watch(h); }
      }
    }, 250);
  });

  // PWA offline: no empty ad boxes.
  addEventListener('offline', () => {
    html.dataset.ads = 'off';
    document.querySelectorAll<HTMLElement>('.ad-host').forEach((h) => { clear(h); h.dataset.adState = 'off'; });
  });
}

// Never before the page's main content: wait for load, then for an idle moment.
const start = () => ('requestIdleCallback' in window ? (window as any).requestIdleCallback(boot, { timeout: 2000 }) : setTimeout(boot, 300));
if (document.readyState === 'complete') start();
else addEventListener('load', start, { once: true });
