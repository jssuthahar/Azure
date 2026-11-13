/**
 * Lesson-flow audit (every lesson, every exam):
 *   30-second answer → Simulations (3D | Azure Portal | Practice Lab tabs) → explanation → exam tip → quiz → prev/next
 * Fails on: wrong order, a missing simulation tab, or a link that takes the learner away mid-lesson (same tab).
 */
import { launch, BASE, lessonUrls, watch, finish } from './lib.mjs';

const b = await launch();
const p = await b.newPage();
const errs = [];
watch(p, errs);
const fail = [];
const urls = lessonUrls();
for (const url of urls) {
  const res = await p.goto(BASE + url, { waitUntil: 'domcontentloaded' });
  if (!res || res.status() !== 200) { fail.push(`${url} → HTTP ${res?.status()}`); continue; }
  const r = await p.evaluate(() => {
    const all = [...document.querySelectorAll('*')];
    const pos = (sel) => { const el = document.querySelector(sel); return el ? all.indexOf(el) : -1; };
    const order = ['.answer-box', '#simulations', '.lesson-step', '#exam-tip', '#knowledge-check, .kc, [id^="knowledge"]', 'a[rel="next"], a[rel="prev"]'].map(pos);
    const sim = document.getElementById('simulations');
    const start = document.querySelector('.answer-box');
    const end = document.getElementById('mark-done');
    const away = [];
    if (start && end) for (const a of document.querySelectorAll('article a[href]')) {
      const inside = (start.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING) && (end.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_PRECEDING);
      const h = a.getAttribute('href');
      if (inside && !h.startsWith('#') && a.target !== '_blank' && !a.closest('#references')) away.push(h);
    }
    return { order, d3: !!sim?.querySelector('figure.d3'), portal: !!sim?.querySelector('figure.pt-root'), lab: !!sim?.querySelector('.lsims-frame'), away, updated: !!document.querySelector('.lesson-updated time') };
  });
  const found = r.order.filter((x) => x >= 0);
  if (r.order.slice(0, 4).some((x) => x < 0) || found.join() !== [...found].sort((a, b) => a - b).join()) fail.push(`${url} lesson flow out of order ${JSON.stringify(r.order)}`);
  if (!r.d3) fail.push(`${url} has no 3D View`);
  if (!r.portal) fail.push(`${url} has no Azure Portal tour`);
  if (!r.lab) fail.push(`${url} has no Practice Lab`);
  if (!r.updated) fail.push(`${url} has no visible updated date`);
  if (r.away.length) fail.push(`${url} sends the learner away mid-lesson → ${[...new Set(r.away)].join(', ')}`);
}
await b.close();
console.log(`lessons audited: ${urls.length}`);
finish('lesson flow', [...fail, ...errs]);
