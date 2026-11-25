/**
 * Accessibility (axe-core, WCAG 2.1 A/AA) in light + dark, phone + iPad, with animations off
 * (scroll-reveal fades otherwise cause false contrast hits). Includes the open install sheet and banner.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { launch, BASE, IPHONE_UA, finish } from './lib.mjs';

const axe = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const PAGES = [
  ['/', null], ['/ai-certifications/', null], ['/security-certifications/', async (p) => { await p.click('.cm-board button >> nth=1'); await p.waitForTimeout(400); }], ['/exam-changes-2026/', null], ['/exam-dumps/', null], ['/ai-900-vs-ai-901/', null], ['/az-204-vs-ai-200/', null], ['/platform/', null], ['/az-900/', null], ['/az-900/cloud-concepts/capex-vs-opex/', null], ['/az-900/compare/blob-vs-files-vs-disk/', null],
  ['/az-900/services/virtual-machines/', null], ['/az-900/mock-exam/', null], ['/az-900/practice/', null], ['/az-900/study-plan/', null], ['/az-900/cheat-sheet/', null], ['/az-900/exam-day/', null], ['/progress/', null], ['/progress/', async (p) => { await p.click('.sync-card [data-account-signin]'); await p.waitForTimeout(300); }], ['/certificate/', null], ['/app/', null], ['/offline/', null],
  ['/az-900/glossary/', async (p) => { await p.click('#install-btn'); await p.waitForTimeout(300); }],
  ['/ai-901/', null], ['/ai-901/ai-concepts/how-generative-ai-works/', null], ['/ai-901/mock-exam/', null], ['/ai-901/labs/ai-deploy-chat/', null], ['/certificate/?exam=ai-901', null],
  ['/ai-200/', null], ['/ai-200/data-for-ai/cosmos-db-vector-search/', null], ['/ai-200/mock-exam/', null], ['/ai-200/labs/dev-service-bus/', null], ['/certificate/?exam=ai-200', null], ['/az-104/', null], ['/az-104/identity-and-governance/rbac-roles-and-scopes/', null], ['/az-104/mock-exam/', null], ['/az-104/architect/', null], ['/certificate/?exam=az-104', null], ['/gh-300/', null], ['/gh-300/copilot-features/agent-mode-mcp-and-subagents/', null], ['/gh-300/mock-exam/', null], ['/gh-300/labs/gh-cli-setup/', null], ['/ai-103/', null], ['/ai-103/plan-and-manage/secure-foundry-identity-and-networking/', null], ['/ai-103/computer-vision/multimodal-image-understanding/', null], ['/ai-103/mock-exam/', null], ['/ai-103/labs/agt-extract-search-queries/', null], ['/projects/', null], ['/troubleshoot/', null], ['/az-104/labs/fix-web-port-80/', null], ['/gh-600/', null], ['/sc-500/', null],
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
