/**
 * Ad placement checks (Google AdSense, src/lib/monetization/*). Runs with ?ads=debug, so no request
 * ever goes to Google and no live ad is shown or clicked: every slot draws a grey labelled box instead.
 *
 *  1. ad-free paths (mock exam, labs, simulator, progress, certificate, legal…): no slot, no AdSense script
 *  2. at most 3 in-content ads per page (sidebar not counted) at 375, 768, 1024, 1280 and 1440px
 *  3. leaderboard only at ≥1024px and never on lessons; sidebar only at ≥1200px and beside, not over, the lesson
 *  4. lesson: the multiplex appears only after the quiz is checked
 *  5. no horizontal scroll and no layout shift from ads; supporters and offline learners see zero ads
 *  6. without ?ads=debug off the live site nothing renders (no empty boxes)
 */
import { launch, BASE, lessonUrls, watch, finish } from './lib.mjs';

const fail = [];
const errs = [];
const check = (ok, msg) => { if (!ok) fail.push(msg); };
const WIDTHS = [375, 768, 1024, 1280, 1440];

const lesson = lessonUrls().find((u) => u.startsWith('/az-900/')) ?? lessonUrls()[0];
const REF = ['/az-900/glossary/', '/az-900/services/', '/az-900/services/app-service/', '/az-900/compare/', '/az-900/compare/azure-vs-aws/', '/az-900/'];
const AD_FREE = ['/az-900/mock-exam/', '/az-900/labs/', '/az-900/interview/', '/az-900/practice/', '/az-900/3d-explorer/', '/simulator/', '/progress/', '/certificate/', '/privacy/', '/terms/', '/sponsor/'];

const browser = await launch();
const open = async (w, init) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  if (init) await ctx.addInitScript(init);
  const p = await ctx.newPage();
  watch(p, errs);
  return { ctx, p };
};
const ready = (p) => p.waitForFunction(() => document.documentElement.dataset.adsReady === '1', null, { timeout: 90000 });
/** Load, let the ad engine boot (after load + idle), then scroll the whole page so lazy slots fill. */
const visit = async (p, url) => {
  await p.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await ready(p);
  // bring each slot into view in turn (lazy loading fills it), then go to the end of the page
  for (let i = 0; i < 8; i++) {
    const n = await p.evaluate((i) => {
      const hs = [...document.querySelectorAll('.ad-host')].filter((h) => h.getClientRects().length);
      if (i >= hs.length) return -1;
      hs[i].scrollIntoView({ block: 'center', behavior: 'instant' });
      return i;
    }, i);
    if (n < 0) break;
    // Wait for this slot to fill while it is on screen (up to 1.5 s) instead of a fixed pause:
    // on very tall pages the browser can report visibility a little later. A slot that never fills still fails below.
    await p.waitForFunction((i) => {
      const h = [...document.querySelectorAll('.ad-host')].filter((x) => x.getClientRects().length)[i];
      return !h || h.dataset.adState === 'filled' || h.dataset.adState === 'off';
    }, i, { timeout: 1500 }).catch(() => {});
    await p.waitForTimeout(100);
  }
  await p.evaluate(() => scrollTo({ top: document.scrollingElement.scrollHeight, behavior: 'instant' }));
  await p.waitForTimeout(400);
};
const count = (p) => p.evaluate(() => ({
  inContent: document.querySelectorAll('.ad-wrap:not([data-unit="sidebar"])').length,
  units: [...document.querySelectorAll('.ad-wrap')].map((w) => w.dataset.unit),
  hscroll: document.documentElement.scrollWidth - innerWidth,
  mode: document.documentElement.dataset.ads,
  script: !!document.querySelector('script[src*="googlesyndication"]'),
}));

// 1 · ad-free paths
{
  const { ctx, p } = await open(1440);
  for (const u of AD_FREE) {
    await visit(p, u + '?ads=debug');
    const c = await count(p);
    const hosts = await p.locator('.ad-host').count();
    check(hosts === 0 && c.units.length === 0, `${u}: ad-free page has ${hosts} slot(s)`);
    check(c.mode === 'off' && !c.script, `${u}: ad-free page still loads AdSense (mode ${c.mode})`);
  }
  await ctx.close();
}

// 2 + 3 · caps, viewport rules, overflow
for (const w of WIDTHS) {
  const { ctx, p } = await open(w);
  for (const u of [lesson, ...REF]) {
    await visit(p, u + '?ads=debug');
    const c = await count(p);
    check(c.mode === 'debug', `${u} @${w}: debug mode not on (${c.mode})`);
    check(!c.script, `${u} @${w}: AdSense script loaded in debug mode`);
    check(c.inContent <= 3, `${u} @${w}: ${c.inContent} in-content ads (max 3): ${c.units}`);
    check(c.inContent >= 1, `${u} @${w}: no ad filled at all (the engine or a slot is broken): ${c.units}`);
    const stuck = await p.evaluate(() => [...document.querySelectorAll('.ad-host:not([data-ad-trigger])')].filter((h) => h.getClientRects().length && h.dataset.adState !== 'filled').map((h) => h.dataset.unit));
    check(!stuck.length || c.inContent === 3, `${u} @${w}: visible slot(s) never filled: ${stuck}`);
    check(c.hscroll <= 1, `${u} @${w}: horizontal scroll of ${c.hscroll}px`);
    if (c.units.includes('leaderboard')) check(w >= 1024 && u !== lesson, `${u} @${w}: leaderboard shown`);
    if (c.units.includes('sidebar')) check(w >= 1200 && u === lesson, `${u} @${w}: sidebar shown`);
    if (u === lesson) {
      check(!c.units.includes('multiplex'), `${u} @${w}: multiplex shown before the quiz was checked`);
      if (w >= 1280) {
        const overlap = await p.evaluate(() => {
          const s = document.querySelector('.ad-wrap[data-unit="sidebar"]')?.getBoundingClientRect();
          const a = document.querySelector('article')?.getBoundingClientRect();
          return s && a ? s.left < a.right && s.right > a.left && s.top < a.bottom && s.bottom > a.top : false;
        });
        check(!overlap, `${u} @${w}: sidebar ad overlaps the lesson`);
      }
    }
  }
  await ctx.close();
}

// 4 · lesson: a second in-article ad mid-explanation when it's long; the multiplex only after the quiz
{
  const { ctx, p } = await open(375);
  await p.goto(BASE + lesson + '?ads=debug', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await ready(p);
  const mid = await p.evaluate(() => document.querySelectorAll('.lesson > .ad-host[data-unit="inArticle"]').length);
  const words = await p.evaluate(() => [...document.querySelectorAll('.lesson > .lesson-section')].reduce((n, s) => n + s.textContent.trim().split(/\s+/).length, 0));
  check(words < 600 ? mid === 0 : mid === 1, `${lesson}: ${mid} mid-explanation ad slot(s) for ${words} words`);
  check(await p.locator('.ad-host[data-ad-trigger="quiz"]').evaluate((h) => h.getClientRects().length === 0), `${lesson}: post-quiz slot visible on page load`);
  const kc = p.locator('.kc form button[type=submit]').first();
  if (await kc.count()) {
    await kc.click();
    await p.evaluate(() => scrollTo({ top: document.scrollingElement.scrollHeight, behavior: 'instant' }));
    await p.waitForTimeout(800);
    const units = await p.evaluate(() => [...document.querySelectorAll('.ad-wrap')].map((w) => w.dataset.unit));
    check(units.includes('multiplex'), `${lesson}: multiplex missing after the quiz was checked (${units})`);
    check(units.filter((x) => x !== 'sidebar').length <= 3, `${lesson}: more than 3 ads after the quiz (${units})`);
    const order = await p.evaluate(() => {
      const next = document.querySelector('article a[rel="next"], article a.nav-btn[href*="mock-exam"]');
      const mx = document.querySelector('.ad-wrap[data-unit="multiplex"]');
      return next && mx ? next.getBoundingClientRect().bottom + 150 <= mx.getBoundingClientRect().top : false;
    });
    check(order, `${lesson}: multiplex is not well below the Next lesson button`);
  }
  await ctx.close();
}

// 5 · layout shift, supporters, offline
{
  const { ctx, p } = await open(375, () => {
    window.__cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  for (const u of [lesson, '/az-900/glossary/']) {
    await p.goto(BASE + u + '?ads=debug', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await ready(p);
    await p.waitForTimeout(800);
    const cls = await p.evaluate(() => window.__cls);
    check(cls < 0.05, `${u} @375: layout shift ${cls.toFixed(3)} with ads`);
  }
  await ctx.close();
}
for (const [name, init] of [
  ['supporter', () => localStorage.setItem('msdb-supporter-v1', '1')],
  ['offline', () => Object.defineProperty(navigator, 'onLine', { get: () => false })],
]) {
  const { ctx, p } = await open(1440, init);
  for (const u of [lesson, '/az-900/glossary/', '/az-900/']) {
    await visit(p, u + '?ads=debug');
    const c = await count(p);
    const shown = await p.evaluate(() => [...document.querySelectorAll('.ad-host')].filter((h) => h.getClientRects().length).length);
    check(c.units.length === 0 && shown === 0 && !c.script, `${u}: ${name} sees ${c.units.length} ad(s), ${shown} visible slot(s)`);
  }
  await ctx.close();
}

// 6 · off the live site, without debug: nothing at all
{
  const { ctx, p } = await open(1440);
  for (const u of [lesson, '/az-900/glossary/']) {
    await visit(p, u);
    const c = await count(p);
    const shown = await p.evaluate(() => [...document.querySelectorAll('.ad-host')].filter((h) => h.getClientRects().length).length);
    check(c.mode === 'off' && c.units.length === 0 && shown === 0 && !c.script, `${u}: ads render off the live site without ?ads=debug`);
  }
  await ctx.close();
}

await browser.close();
finish('ad placements (debug boxes, no live ads)', [...fail, ...errs]);
