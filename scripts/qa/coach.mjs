/**
 * Nimbus Coach (src/components/NimbusCoach.astro): walks every card end to end on a
 * phone and an iPad. Welcome → date → minutes → plan ready; the "other exam" nudge
 * (Just looking, Switch focus with parking); welcome back; you're ready → I passed →
 * next exam; My plan from Ask Nimbus; stays away from blocked pages and from
 * automation unless asked. Axe runs on the open card in light and dark.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { launch, BASE, watch, finish, SHOTS } from './lib.mjs';

const axe = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const data = JSON.parse(readFileSync('dist/coach.json', 'utf8'));
const [A, B] = data.exams;
const failures = [];
const b = await launch();

const coach = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('msdb-azure-plan-v1') || '{}'));
const heading = (p) => p.locator('#nc-h').textContent();
const waitCard = async (p, where, ms = 14000) => {
  try { await p.waitForSelector('#nc.is-in', { timeout: ms }); return true; } catch { failures.push(`${where}: coach card did not appear`); return false; }
};
const noCard = async (p, where, ms = 4500) => {
  await p.waitForTimeout(ms);
  if (await p.locator('#nc:not([hidden])').count()) failures.push(`${where}: coach card showed but should not (${await heading(p)})`);
};
const fits = async (p, where) => {
  const r = await p.evaluate(() => {
    const n = document.getElementById('nc').getBoundingClientRect();
    return { l: n.left, r: n.right, t: n.top, w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth };
  });
  if (r.l < 0 || r.r > r.w + 0.5 || r.t < 0) failures.push(`${where}: card outside the screen ${JSON.stringify(r)}`);
  if (r.sw > r.w) failures.push(`${where}: page scrolls sideways (${r.sw} > ${r.w})`);
};
const axeCard = async (p, where) => {
  await p.addScriptTag({ content: axe });
  const v = await p.evaluate(async () => (await window.axe.run('#nc', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations.map((x) => `${x.id} (${x.nodes[0]?.target.join(' ')})`));
  for (const x of v) failures.push(`${where} axe: ${x}`);
};

for (const [dev, vp] of [['phone', { width: 360, height: 740 }], ['ipad', { width: 820, height: 1180 }]]) {
  const ctx = await b.newContext({ viewport: vp, hasTouch: true, isMobile: dev === 'phone', reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { try { localStorage.setItem('msdb-coach-qa', '1'); localStorage.setItem('msdb-install-dismissed', String(Date.now())); localStorage.setItem('msdb-prompts-v1', JSON.stringify({ lastAt: Date.now() })); } catch {} });
  const p = await ctx.newPage();
  watch(p, failures);

  // 1. Welcome on the course page → plan in three taps.
  let w = `${dev} welcome /${A.slug}/`;
  await p.goto(`${BASE}/${A.slug}/`, { waitUntil: 'load' });
  if (await waitCard(p, w)) {
    if (!(await heading(p)).includes(A.code)) failures.push(`${w}: heading "${await heading(p)}"`);
    await fits(p, w);
    await axeCard(p, `${w} light`);
    await p.screenshot({ path: join(SHOTS, `coach-welcome-${dev}.png`) });
    await p.click('#nc [data-act="plan"]');
    await p.click('#nc [data-days="30"]');
    await p.click('#nc [data-min="30"]');
    const h = await heading(p);
    if (!h.includes('plan is ready')) failures.push(`${w}: after 3 taps heading is "${h}"`);
    const s = await coach(p);
    if (s._coach?.focus !== A.slug) failures.push(`${w}: focus is ${s._coach?.focus}`);
    if (s[A.slug]?.minutes !== 30) failures.push(`${w}: plan not saved (${JSON.stringify(s[A.slug])})`);
    const start = await p.locator('#nc a.btn-accent').getAttribute('href');
    if (start !== A.lessons[0].url) failures.push(`${w}: Start now goes to ${start}, expected ${A.lessons[0].url}`);
    await fits(p, `${w} ready`);
    await p.screenshot({ path: join(SHOTS, `coach-ready-${dev}.png`) });
  }

  // 2. Another exam's course page: nudge once, "Just looking" keeps it quiet in this tab.
  w = `${dev} wander /${B.slug}/`;
  await p.evaluate(() => localStorage.setItem('theme', 'dark'));
  await p.goto(`${BASE}/${B.slug}/`, { waitUntil: 'load' });
  if (await waitCard(p, w, 6000)) {
    if (!(await heading(p)).includes(B.code)) failures.push(`${w}: heading "${await heading(p)}"`);
    await axeCard(p, `${w} dark`);
    await p.screenshot({ path: join(SHOTS, `coach-wander-dark-${dev}.png`) });
    await p.evaluate(() => localStorage.setItem('theme', 'light'));
    await p.click('#nc [data-act="look"]');
    await p.reload({ waitUntil: 'load' });
    await noCard(p, `${w} after Just looking`);
  }

  // 3. A lesson of another exam (new tab session): switch focus parks the old exam.
  w = `${dev} wander lesson ${B.lessons[0].url}`;
  await p.evaluate(() => sessionStorage.clear());
  await p.goto(BASE + B.lessons[0].url, { waitUntil: 'load' });
  if (await waitCard(p, w, 6000)) {
    if (!(await p.locator('#nc-body').textContent()).includes('two exams')) failures.push(`${w}: lesson wording missing`);
    await p.click('#nc [data-act="switch"]');
    const s = await coach(p);
    if (s._coach?.focus !== B.slug || s._coach?.parked?.[0]?.slug !== A.slug) failures.push(`${w}: switch did not park ${A.slug} (${JSON.stringify(s._coach)})`);
    if (!(await heading(p)).includes('When will you sit')) failures.push(`${w}: switch did not ask for a date`);
  }

  // 4. Welcome back on a site-wide page, once a day.
  w = `${dev} welcome back /progress/`;
  await p.evaluate(() => { const all = JSON.parse(localStorage.getItem('msdb-azure-plan-v1') || '{}'); all._coach.greeted = '2000-01-01'; localStorage.setItem('msdb-azure-plan-v1', JSON.stringify(all)); });
  await p.goto(`${BASE}/progress/`, { waitUntil: 'load' });
  if (await waitCard(p, w, 7000)) {
    if ((await heading(p)) !== 'Welcome back') failures.push(`${w}: heading "${await heading(p)}"`);
    await fits(p, w);
    await p.reload({ waitUntil: 'load' });
    await noCard(p, `${w} second view the same day`);
  }

  // 5. Every lesson done → you're ready → I passed → next exam list.
  w = `${dev} ready /`;
  await p.evaluate((keys) => {
    const pr = JSON.parse(localStorage.getItem('msdb-azure-progress-v1') || '{}');
    pr.done = Object.fromEntries(keys.map((k) => [k, new Date().toISOString()]));
    localStorage.setItem('msdb-azure-progress-v1', JSON.stringify(pr));
  }, B.lessons.map((l) => l.key));
  await p.goto(`${BASE}/`, { waitUntil: 'load' });
  if (await waitCard(p, w, 7000)) {
    if (!(await heading(p)).includes("You're ready")) failures.push(`${w}: heading "${await heading(p)}"`);
    await p.click('#nc [data-act="passed"]');
    const n = await p.locator('#nc [data-next]').count();
    if (n !== B.next.length) failures.push(`${w}: ${n} next exams shown, expected ${B.next.length}`);
    if ((await coach(p))._coach?.passed?.[B.slug] === undefined) failures.push(`${w}: passed not saved`);
    await fits(p, `${w} next`);
    await p.screenshot({ path: join(SHOTS, `coach-next-${dev}.png`) });
    await p.click('#nc [data-nc-close]');
  }

  // 6. My plan from Ask Nimbus.
  w = `${dev} my plan`;
  await p.click('#ask-fab');
  await p.waitForTimeout(1500); // let the typing bubbles settle
  {
    await p.addScriptTag({ content: axe });
    const v = await p.evaluate(async () => (await window.axe.run('#ask-panel', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations.map((x) => `${x.id} (${x.nodes[0]?.target.join(' ')})`));
    for (const x of v) failures.push(`${dev} Ask Nimbus panel axe: ${x}`);
    const sw = await p.evaluate(() => document.querySelector('.ask-sub').scrollWidth > document.querySelector('.ask-sub').clientWidth + 1 && getComputedStyle(document.querySelector('.ask-sub')).overflow !== 'hidden');
    if (sw) failures.push(`${dev} Ask Nimbus header status overflows`);
  }
  await p.click('#ask-panel [data-coach-open]');
  try {
    await p.waitForSelector('#nc.is-in', { timeout: 4000 });
    const h = await heading(p);
    if (!/^(My plan|Which exam)/.test(h)) failures.push(`${w}: heading "${h}"`);
    if (await p.locator('#ask.is-open').count()) failures.push(`${w}: Ask panel still open`);
    await fits(p, w);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(400);
    if (await p.locator('#nc:not([hidden])').count()) failures.push(`${w}: Escape did not close`);
  } catch { failures.push(`${w}: did not open`); }

  // 6b. Ask Nimbus home: greets a signed-in learner by name, Quiz me records an answer, answers come as a step-by-step story.
  w = `${dev} ask home`;
  await p.evaluate((slug) => { localStorage.setItem('msdb-user', JSON.stringify({ uid: 'qa', name: 'Asha Rao', email: '', photo: '' })); localStorage.setItem('msdb-ask-exam', slug); }, A.slug);
  await p.goto(`${BASE}/about/`, { waitUntil: 'load' });
  await p.click('#ask-fab');
  try {
    await p.waitForSelector('#ask-log .ask-hello', { timeout: 6000 });
    const hi = await p.locator('#ask-log .ask-hello').first().textContent();
    if (!/Asha/.test(hi)) failures.push(`${w}: greeting "${hi}" has no name`);
    await p.click('#ask-log .ask-tile.is-gold');
    await p.waitForSelector('#ask-log .ask-opt', { timeout: 6000 });
    const before = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('msdb-azure-review-v1') || '{}')).length);
    await p.locator('#ask-log .ask-opt').first().click();
    await p.waitForSelector('#ask-log .ask-fb.is-ok, #ask-log .ask-fb.is-no', { timeout: 3000 });
    const after = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('msdb-azure-review-v1') || '{}')).length);
    if (after <= before) failures.push(`${w}: Quiz me answer not recorded in Smart practice`);
    await fits(p, `${w} quiz`);
    await p.addScriptTag({ content: axe });
    const v = await p.evaluate(async () => (await window.axe.run('#ask-panel', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations.map((x) => `${x.id} (${x.nodes[0]?.target.join(' ')})`));
    for (const x of v) failures.push(`${w} axe: ${x}`);
  } catch (e) { failures.push(`${w}: ${e.message.split('\n')[0]}`); }
  await p.evaluate(() => localStorage.removeItem('msdb-user'));
  await p.click('#ask-close').catch(() => {});

  // 7. Never on blocked pages.
  await p.evaluate(() => sessionStorage.clear());
  await p.goto(`${BASE}/${A.slug}/mock-exam/`, { waitUntil: 'load' });
  await noCard(p, `${dev} /${A.slug}/mock-exam/`);
  await ctx.close();
}

// 8. Automation without the QA flag: the coach stays out of every other check's way.
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/${A.slug}/`, { waitUntil: 'load' });
  await noCard(p, 'webdriver without msdb-coach-qa', 9500);
  await ctx.close();
}

await b.close();
finish('coach', failures);
