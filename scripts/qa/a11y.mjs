/**
 * Accessibility (axe-core, WCAG 2.1 A/AA) in light + dark, phone + iPad, with animations off
 * (scroll-reveal fades otherwise cause false contrast hits). Includes the open install sheet and banner.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { launch, BASE, IPHONE_UA, finish } from './lib.mjs';

const axe = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const PAGES = [
  ['/', null], ['/az-900/', null], ['/az-900/cloud-concepts/capex-vs-opex/', null], ['/az-900/compare/blob-vs-files-vs-disk/', null],
  ['/az-900/services/virtual-machines/', null], ['/az-900/mock-exam/', null], ['/az-900/practice/', null], ['/az-900/study-plan/', null], ['/az-900/cheat-sheet/', null], ['/az-900/exam-day/', null], ['/progress/', null], ['/certificate/', null], ['/app/', null], ['/offline/', null],
  ['/az-900/glossary/', async (p) => { await p.click('#install-btn'); await p.waitForTimeout(300); }],
];
const b = await launch();
const fail = [];
for (const theme of ['light', 'dark']) for (const [dev, vp] of [['phone', { width: 390, height: 844 }], ['iPad', { width: 820, height: 1180 }]]) {
  const ctx = await b.newContext({ viewport: vp, userAgent: IPHONE_UA, hasTouch: true, isMobile: dev === 'phone', reducedMotion: 'reduce' });
  await ctx.addInitScript((t) => { localStorage.setItem('theme', t); localStorage.setItem('msdb-install-dismissed', String(Date.now())); }, theme);
  const p = await ctx.newPage();
  for (const [u, prep] of PAGES) {
    await p.goto(BASE + u, { waitUntil: 'networkidle' });
    if (prep) await prep(p);
    await p.addScriptTag({ content: axe });
    const v = await p.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations.map((x) => `${x.id} (${x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' , ')})`));
    for (const x of v) fail.push(`${theme} ${dev} ${u}${prep ? ' +install sheet' : ''}: ${x}`);
  }
  await ctx.close();
}
await b.close();
console.log(`scanned ${PAGES.length} pages × light/dark × phone/iPad`);
finish('accessibility (axe)', fail);
