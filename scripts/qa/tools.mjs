/**
 * Study tools end to end: smart practice (spaced repetition + readiness), lesson quiz → review deck,
 * study plan + calendar file, the lesson tutor in Ask Nimbus, and every guided lab whose tasks
 * can all be done from Cloud Shell (run through the lab's own "Try it" commands, && chains included).
 */
import { launch, BASE, watch, finish } from './lib.mjs';

/** Guided labs whose every task can be completed with its own "Try it in Cloud Shell" command. */
const LABS_CLI_ONLY = ['tags-chargeback', 'vm-power-states', 'cli-storage', 'readonly-lock', 'scale-sets',
  'service-models', 'serverless-function', 'hybrid-arc', 'containers', 'build-network', 'vpn-gateway', 'dns-private-endpoint',
  'identity-access', 'conditional-access', 'policy-guardrails', 'bicep-deploy', 'monitor-alerts', 'migrate-databox'];

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
// Tutor "Walk me through the portal" opens the Azure Portal tab in place.
await p.getByRole('button', { name: /Walk me through the portal/ }).last().click();
await p.getByRole('button', { name: /Start the portal walkthrough/ }).last().click();
if ((await p.getAttribute('#lsim-t-portal', 'aria-selected')) !== 'true') fail.push('tutor: portal button did not open the Azure Portal tab');
await p.click('#ask-close');

// 3a. Bookmarks, highlights and notes on a lesson, listed on My Progress.
{
  const lesson = `${BASE}/az-900/cloud-concepts/iaas/`;
  await p.evaluate(() => localStorage.removeItem('msdb-azure-notes-v1'));
  await p.goto(lesson, { waitUntil: 'networkidle' });
  await p.click('[data-view-btn="full"]');
  await p.click('[data-bookmark-btn]');
  if ((await p.getAttribute('[data-bookmark-btn]', 'aria-pressed')) !== 'true') fail.push('notes: bookmark button did not toggle');
  const select = () => p.evaluate(() => {
    const t = document.querySelector('.lesson-section[data-section="technical"] p');
    const node = [...(t?.childNodes ?? [])].find((n) => n.nodeType === 3 && n.data.trim().length > 20);
    if (!node) return false;
    t.scrollIntoView({ block: 'center' });
    const r = document.createRange();
    r.setStart(node, 0);
    r.setEnd(node, Math.min(node.data.length, 30));
    getSelection().removeAllRanges();
    getSelection().addRange(r);
    document.dispatchEvent(new PointerEvent('pointerup'));
    return true;
  });
  if (!(await select())) fail.push('notes: no lesson text to select');
  await p.waitForSelector('#hl-bar:not([hidden])', { timeout: 3000 }).catch(() => fail.push('notes: selection bar did not appear'));
  await p.click('#hl-bar [data-hl-color="green"]');
  if ((await p.locator('mark.hl-green').count()) < 1) fail.push('notes: highlight was not painted');
  await p.reload({ waitUntil: 'networkidle' });
  await p.click('[data-view-btn="full"]');
  if ((await p.locator('mark.hl-green').count()) < 1) fail.push('notes: highlight did not come back after reload');
  await p.locator('mark.hl[id^="note-"]').first().click();
  await p.click('#hl-pop [data-pop-edit]');
  await p.fill('#note-dlg-text', 'Remember: IaaS means I patch the OS.');
  await p.click('#note-dlg button[value="save"]');
  if ((await p.locator('mark.hl-noted').count()) < 1) fail.push('notes: note was not saved on the highlight');
  await p.click('[data-notes-open]');
  if ((await p.locator('#notes-list li').count()) !== 1) fail.push('notes: panel should list 1 note');
  await p.click('[data-notes-close]');
  await p.goto(`${BASE}/progress/#notes`, { waitUntil: 'networkidle' });
  const txt = await p.textContent('#notes');
  if (!/IaaS means I patch the OS/.test(txt) || (await p.locator('#pg-bookmarks a').count()) < 1) fail.push('notes: My Progress did not list the bookmark and note');
  // Cheat sheet shows the note in "My highlights and notes".
  await p.goto(`${BASE}/az-900/cheat-sheet/`, { waitUntil: 'networkidle' });
  if (!(await p.isVisible('#my-notes')) || !/IaaS means I patch the OS/.test(await p.textContent('#my-notes'))) fail.push('notes: cheat sheet did not show my highlights');
  await p.evaluate(() => localStorage.removeItem('msdb-azure-notes-v1'));
  await p.goto(`${BASE}/az-900/cheat-sheet/`, { waitUntil: 'networkidle' });
  if (await p.isVisible('#my-notes')) fail.push('notes: empty "My highlights" section should stay hidden');
}

// 3a2. Flag a lesson quiz question → it appears in Smart practice → Flagged questions.
{
  await p.goto(`${BASE}/az-900/cloud-concepts/iaas/`, { waitUntil: 'networkidle' });
  const qid = await p.getAttribute('.kc .q-flag >> nth=0', 'data-flag-id');
  await p.click('.kc .q-flag >> nth=0');
  if ((await p.getAttribute('.kc .q-flag >> nth=0', 'aria-pressed')) !== 'true') fail.push('flags: quiz flag button did not toggle');
  await p.goto(`${BASE}/az-900/practice/`, { waitUntil: 'networkidle' });
  if (!/1 flagged/.test(await p.textContent('#sp-flag-n'))) fail.push('flags: practice page did not count the flagged question');
  await p.click('.sp-mode[data-mode="flagged"]');
  if ((await p.getAttribute('#sp-flag', 'data-flag-id')) !== qid) fail.push('flags: flagged session did not open the flagged question');
  if ((await p.getAttribute('#sp-flag', 'aria-pressed')) !== 'true') fail.push('flags: practice flag button should show Flagged');
  await p.click('#sp-flag');
  if (!/None yet/.test(await p.textContent('#sp-flag-n'))) fail.push('flags: un-flagging in practice did not update the count');
  await p.click('#sp-quit');
  await p.evaluate(() => localStorage.removeItem('msdb-azure-notes-v1'));
}

// 3a3. Reading settings apply to lesson text and survive a reload.
{
  const lesson = `${BASE}/az-900/cloud-concepts/iaas/`;
  await p.goto(lesson, { waitUntil: 'networkidle' });
  const size0 = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.lesson')).fontSize));
  await p.click('[data-read-open]');
  await p.click('#read-dlg .read-opt:has(input[name="read-size"][value="xl"])');
  await p.click('#read-dlg .read-easy');
  await p.click('#read-dlg button.btn-primary[data-read-close]');
  await p.reload({ waitUntil: 'networkidle' });
  const after = await p.evaluate(() => ({ size: parseFloat(getComputedStyle(document.querySelector('.lesson')).fontSize), font: getComputedStyle(document.querySelector('.lesson')).fontFamily }));
  if (!(after.size > size0 * 1.2)) fail.push(`reading: text size did not grow (${size0} → ${after.size})`);
  if (!/Verdana/.test(after.font)) fail.push('reading: easy-read font not applied');
  await p.evaluate(() => localStorage.removeItem('msdb-reading-v1'));
}

// 3a4. Resume reading: scroll down, come back, jump back.
{
  const lesson = `${BASE}/az-900/cloud-concepts/iaas/`;
  await p.evaluate(() => localStorage.removeItem('msdb-lesson-pos-v1'));
  await p.goto(lesson, { waitUntil: 'networkidle' });
  await p.click('[data-view-btn="full"]');
  await p.evaluate(() => document.getElementById('the-technical-explanation').scrollIntoView({ block: 'start', behavior: 'instant' }));
  await p.mouse.wheel(0, 200);
  await p.waitForTimeout(1000);
  await p.goto(`${BASE}/az-900/`, { waitUntil: 'networkidle' });
  await p.goto(lesson, { waitUntil: 'networkidle' });
  await p.waitForSelector('#resume-chip:not([hidden])', { timeout: 3000 }).catch(() => fail.push('resume: "Pick up where you left off" did not appear'));
  if (await p.isVisible('#resume-chip')) {
    await p.click('#resume-go');
    const top = await p.evaluate(() => document.getElementById('the-technical-explanation').getBoundingClientRect().top);
    if (top > 150 || top < -2000) fail.push(`resume: jump landed in the wrong place (${Math.round(top)}px)`);
  }
  await p.evaluate(() => localStorage.removeItem('msdb-lesson-pos-v1'));
}

// 3b. Ask Nimbus answers simulation first: 3D, then the Azure portal, then the explanation.
await p.goto(`${BASE}/az-900/`, { waitUntil: 'networkidle' });
await p.click('#ask-fab');
await p.waitForSelector('#ask-q:not([disabled])');
await p.fill('#ask-q', 'how do I create a storage account');
await p.press('#ask-q', 'Enter');
const heads = await p.locator('#ask-log .ask-head2').allTextContents();
const order = heads.map((h) => (/3D/.test(h) ? '3d' : /portal/i.test(h) ? 'portal' : /explanation/i.test(h) ? 'text' : '?')).join(',');
if (order !== '3d,portal,text') fail.push(`ask: expected 3D → portal → explanation, got "${order}"`);
if (!(await p.locator('#ask-log a.ask-go[href*="#sim-3d"]').count())) fail.push('ask: no link to the lesson\'s 3D view');
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
    await btn.evaluate((el) => /** @type {HTMLElement} */ (el).click());
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
