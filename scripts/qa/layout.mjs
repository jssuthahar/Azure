/**
 * Phone + iPad layout sweep: every main page type at 8 screen sizes (portrait and landscape).
 * Fails on horizontal page scroll, anything poking past the right edge, script errors,
 * and a header that doesn't fit on small iPhones (Install icon + XP chip showing).
 */
import { launch, BASE, IPHONE_UA, watch, finish } from './lib.mjs';

const DEVICES = [
  ['Small phone', 360, 740], ['iPhone 15', 393, 852], ['iPhone landscape', 852, 393],
  ['iPad mini', 744, 1133], ['iPad Air', 820, 1180], ['iPad Air landscape', 1180, 820],
  ['iPad Pro 13', 1032, 1376], ['iPad Pro landscape', 1376, 1032],
];
const PAGES = ['/', '/az-900/', '/az-900/cloud-concepts/', '/az-900/cloud-concepts/iaas/', '/az-900/azure-architecture-and-services/storage-accounts/',
  '/az-900/compare/blob-vs-files-vs-disk/', '/az-900/services/', '/az-900/mock-exam/', '/az-900/labs/', '/az-900/labs/sandbox/', '/simulator/region-goes-down/',
  '/az-900/games/', '/az-900/games/sort/', '/az-900/glossary/', '/az-900/revision/', '/az-900/practice/', '/az-900/study-plan/', '/az-900/cheat-sheet/', '/az-900/exam-day/', '/az-900/interview/', '/progress/', '/certificate/', '/app/', '/sitemap/', '/embed/'];

const b = await launch();
const fail = [];
const errs = [];
for (const [name, w, h] of DEVICES) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: w < 700 });
  await ctx.addInitScript(() => { try { localStorage.setItem('msdb-install-dismissed', String(Date.now())); } catch {} });
  const p = await ctx.newPage();
  watch(p, errs);
  for (const u of PAGES) {
    await p.goto(BASE + u, { waitUntil: 'networkidle' });
    await p.waitForTimeout(200);
    const r = await p.evaluate(() => {
      const W = document.documentElement.clientWidth;
      const clipped = (el) => { for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(a).overflowX)) return true; return false; };
      const out = [];
      for (const el of document.querySelectorAll('body *')) {
        const rc = el.getBoundingClientRect();
        if (!rc.width || rc.right <= W + 1 || clipped(el)) continue;
        if (getComputedStyle(el).position === 'fixed' || el.closest('[hidden],dialog:not([open]),.sr-only')) continue;
        out.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${[...el.classList].slice(0, 2).join('.')}`);
        if (out.length > 3) break;
      }
      return { scroll: document.documentElement.scrollWidth - W, out };
    });
    if (r.scroll > 1 || r.out.length) fail.push(`${name} ${w}x${h} ${u}: page scroll ${r.scroll}px ${r.out.join(' | ')}`);
  }
  await ctx.close();
}

// tightest header: small iPhones with the Install icon and an XP chip with a streak
for (const w of [320, 360, 393]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 760 }, userAgent: IPHONE_UA, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => {
    localStorage.setItem('msdb-azure-progress-v1', JSON.stringify({ xp: 12500, days: [new Date().toISOString().slice(0, 10)], done: {}, quiz: {}, mocks: [], games: {} }));
    localStorage.setItem('msdb-install-dismissed', String(Date.now()));
  });
  const p = await ctx.newPage();
  await p.goto(BASE + '/az-900/cloud-concepts/iaas/', { waitUntil: 'networkidle' });
  const r = await p.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const right = Math.max(...[...document.querySelectorAll('.hdr-row *')].map((e) => e.getBoundingClientRect().right));
    const small = ['install-btn', 'xp-chip', 'search-toggle', 'theme-toggle'].filter((i) => { const e = document.getElementById(i); const rc = e?.getBoundingClientRect(); return e && !e.hidden && rc.width > 0 && (rc.width < 32 || rc.height < 32); });
    return { over: Math.round(right - W), small };
  });
  if (r.over > 0) fail.push(`header overflows by ${r.over}px at ${w}px wide`);
  if (r.small.length) fail.push(`header tap targets under 32px at ${w}px: ${r.small.join(', ')}`);
  await ctx.close();
}
await b.close();
console.log(`checked ${DEVICES.length} screen sizes × ${PAGES.length} pages + header at 320/360/393px`);
finish('phone and iPad layout', [...fail, ...errs]);
