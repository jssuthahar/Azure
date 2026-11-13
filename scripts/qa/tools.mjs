/**
 * Study tools end to end: smart practice (spaced repetition + readiness), lesson quiz → review deck,
 * study plan + calendar file, the lesson tutor in Ask Nimbus, and every guided lab whose tasks
 * can all be done from Cloud Shell (run through the lab's own "Try it" commands, && chains included).
 */
import { launch, BASE, watch, finish } from './lib.mjs';

/** Guided labs whose every task can be completed with its own "Try it in Cloud Shell" command. */
const LABS_CLI_ONLY = ['tags-chargeback', 'vm-power-states', 'cli-storage', 'readonly-lock', 'scale-sets'];

const b = await launch();
const fail = [];
const errs = [];
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
await ctx.addInitScript(() => { try { localStorage.setItem('msdb-install-dismissed', String(Date.now())); } catch {} });
const p = await ctx.newPage();
watch(p, errs);
p.on('dialog', (d) => d.accept());
const deck = () => p.evaluate(() => JSON.parse(localStorage.getItem('msdb-azure-review-v1') || '{}'));

// 1. Smart practice: a 5-question session updates the deck and the readiness card.
await p.goto(`${BASE}/az-900/practice/`, { waitUntil: 'networkidle' });
await p.selectOption('#sp-size', '5');
await p.click('.sp-mode[data-mode="smart"]');
for (let i = 0; i < 5; i++) {
  await p.click('#sp-opts .opt >> nth=0');
  await p.click('#sp-check');
  await p.click('#sp-next');
}
if (!(await p.isVisible('#sp-done'))) fail.push('practice: summary not shown after 5 questions');
const n1 = Object.keys(await deck()).length;
if (n1 < 5) fail.push(`practice: expected ≥5 cards in the review deck, got ${n1}`);
if ((await p.textContent('#sp-answered')).trim() === '0') fail.push('practice: readiness card did not update');

// 2. A lesson quiz feeds the same deck.
await p.goto(`${BASE}/az-900/cloud-concepts/iaas/`, { waitUntil: 'networkidle' });
await p.evaluate(() => document.querySelectorAll('.kc fieldset').forEach((f) => f.querySelector('input')?.click()));
await p.click('.kc button[type=submit]');
const n2 = Object.keys(await deck()).length;
if (n2 <= n1) fail.push('lesson quiz: answers were not added to the review deck');

// 3. Lesson tutor in Ask Nimbus.
await p.click('[data-tutor-open]');
await p.getByRole('button', { name: /Explain it simpler/ }).first().click();
const log = await p.textContent('#ask-log');
if (!/empty flat/i.test(log)) fail.push('tutor: "Explain it simpler" did not show the lesson\'s Eli10 text');
await p.getByRole('button', { name: /Quiz me/ }).last().click();
await p.getByRole('button', { name: /Show the answer/ }).last().click();
await p.click('#ask-close');

// 4. Study plan + .ics.
await p.goto(`${BASE}/az-900/study-plan/`, { waitUntil: 'networkidle' });
await p.click('#pl-form button[type=submit]');
const days = await p.locator('#pl-days > li').count();
if (days < 5) fail.push(`study plan: expected a schedule, got ${days} day(s)`);
const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#pl-ics')]);
const ics = await (await dl.createReadStream()).toArray().then((c) => Buffer.concat(c).toString());
if (!/BEGIN:VCALENDAR[\s\S]*RRULE:FREQ=DAILY[\s\S]*END:VCALENDAR/.test(ics)) fail.push('study plan: calendar file is malformed');
await p.goto(`${BASE}/progress/`, { waitUntil: 'networkidle' });
if (/No study plan yet/.test(await p.textContent('#pg-today'))) fail.push('progress: today\'s plan card did not pick up the plan');

// 5. Exam day + cheat sheet render.
for (const u of ['/az-900/exam-day/', '/az-900/cheat-sheet/']) {
  const r = await p.goto(`${BASE}${u}`, { waitUntil: 'networkidle' });
  if (!r.ok()) fail.push(`${u}: HTTP ${r.status()}`);
}

// 6. Labs that can be finished entirely from Cloud Shell.
for (const id of LABS_CLI_ONLY) {
  await p.goto(`${BASE}/az-900/labs/${id}/`, { waitUntil: 'networkidle' });
  const total = await p.locator('.sim-task').count();
  for (let i = 0; i < total; i++) {
    const btn = p.locator(`.sim-task[data-i="${i}"] .sim-try`);
    if (!(await btn.count())) continue;
    await btn.evaluate((el) => el.click());
    await p.press('.sim-in', 'Enter');
    await p.waitForTimeout(50);
    // answer any y/n question from a delete in the chain
    if (/\(y\/n\)/.test((await p.textContent('.sim-prompt')) || '')) {
      await p.fill('.sim-in', 'y');
      await p.press('.sim-in', 'Enter');
    }
  }
  const done = Number(await p.textContent('.sim-done'));
  if (done !== total) fail.push(`lab ${id}: ${done}/${total} tasks completed from the lab's own commands`);
}

await b.close();
console.log(`checked smart practice, quiz→deck, tutor, study plan, exam day, cheat sheet and ${LABS_CLI_ONLY.length} Cloud Shell labs`);
finish('study tools', [...fail, ...errs]);
