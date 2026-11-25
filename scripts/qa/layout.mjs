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
const PAGES = ['/', '/certifications/', '/ai-certifications/', '/security-certifications/', '/github-certifications/', '/exam-changes-2026/', '/exam-dumps/', '/ai-900-vs-ai-901/', '/az-204-vs-ai-200/', '/platform/', '/az-900/', '/az-900/learn/', '/az-900/3d-explorer/', '/az-900/cloud-concepts/', '/az-900/cloud-concepts/iaas/', '/az-900/azure-architecture-and-services/storage-accounts/',
  '/az-900/compare/blob-vs-files-vs-disk/', '/az-900/services/', '/az-900/mock-exam/', '/az-900/labs/', '/az-900/labs/sandbox/', '/simulator/region-goes-down/',
  '/az-900/games/', '/az-900/games/sort/', '/az-900/glossary/', '/az-900/revision/', '/az-900/practice/', '/az-900/study-plan/', '/az-900/cheat-sheet/', '/az-900/exam-day/', '/az-900/interview/', '/progress/', '/certificate/', '/app/', '/sitemap/', '/embed/',
  '/ai-901/', '/ai-901/foundry/build-an-agent-in-foundry/', '/ai-901/mock-exam/', '/ai-901/labs/', '/ai-901/labs/ai-first-agent/', '/ai-901/compare/generative-ai-vs-ai-agents/', '/ai-901/services/',
  '/ai-200/', '/ai-200/containers/azure-container-apps/', '/ai-200/data-for-ai/pgvector-rag/', '/ai-200/mock-exam/', '/ai-200/labs/', '/ai-200/labs/dev-container-apps/', '/ai-200/compare/service-bus-vs-event-grid/', '/ai-200/services/', '/az-104/', '/az-104/networking/nsgs-asgs-and-effective-rules/', '/az-104/storage/sas-tokens-and-stored-access-policies/', '/az-104/mock-exam/', '/az-104/architect/', '/az-900/architect/', '/az-104/labs/', '/az-104/services/', '/gh-300/', '/gh-300/copilot-features/agent-mode-mcp-and-subagents/', '/gh-300/mock-exam/', '/gh-300/labs/gh-cli-setup/', '/gh-600/', '/ai-103/'];

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
  const fb = [];
  p.on('request', (q) => { if (/firebase|firestore|googleapis/i.test(q.url())) fb.push(q.url()); });
  await p.goto(BASE + '/az-900/cloud-concepts/iaas/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500); // past the idle callbacks
  // Signed-out learners don't load Firebase here (sign-in loads Auth; only the live site loads Firestore Lite for counts).
  if (fb.length) fail.push(`Firebase loaded for a signed-out visitor at ${w}px: ${fb[0]}`);
  const auth = await p.evaluate(() => ({ state: document.documentElement.dataset.auth, btn: !!document.querySelector('[data-account-signin]') }));
  if (auth.state !== 'out' || !auth.btn) fail.push(`account UI not ready signed out at ${w}px (data-auth=${auth.state})`);
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
