/**
 * Mock exam room: walks the full exam-day flow for every live exam's /<exam>/mock-exam/ page.
 * Welcome → agreement (Decline dialog) → exam features → start → questions → tools (mark, zoom,
 * contrast, hide time, help, keyboard) → review grid → section 2 lock → score report.
 * axe (WCAG 2.1 AA) and horizontal overflow on every screen, plain and high contrast, phone / iPad / desktop.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { launch, BASE, SHOTS, finish } from './lib.mjs';

const axe = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const exams = readdirSync('dist').filter((d) => existsSync(join('dist', d, 'mock-exam', 'index.html')));
const SIZES = [['phone320', { width: 320, height: 640 }], ['iPad', { width: 820, height: 1180 }], ['desktop', { width: 1280, height: 800 }]];
const fail = [];
const b = await launch();

for (const exam of exams) for (const [dev, viewport] of SIZES) {
  const ctx = await b.newContext({ viewport, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const where = `${exam} ${dev}`;
  p.on('pageerror', (e) => fail.push(`${where} pageerror: ${e.message}`));
  const expect = (ok, msg) => { if (!ok) fail.push(`${where}: ${msg}`); };
  const scan = async (tag) => {
    await p.mouse.move(1, viewport.height / 2); // no hover state on toolbar buttons while axe measures contrast
    await p.addScriptTag({ content: axe });
    const v = await p.evaluate(async () => (await window.axe.run('#xs', { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa'] })).violations.map((x) => `${x.id} (${x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' , ')})`));
    v.forEach((x) => fail.push(`${where} ${tag}: ${x}`));
    expect(!(await p.evaluate(() => document.getElementById('xs').scrollWidth > innerWidth + 1)), `${tag}: horizontal overflow`);
    await p.screenshot({ path: join(SHOTS, `exam-${exam}-${dev}-${tag}.png`) });
  };
  const pos = () => p.textContent('#xs-pos');

  try {
    await p.goto(`${BASE}/${exam}/mock-exam/`, { waitUntil: 'networkidle' });
    await p.check('input[name="mode"][value="quick"]');
    await p.fill('#cand-name', 'QA Learner');
    await p.click('#setup-form button[type=submit]');

    // Before the exam
    await scan('welcome');
    expect((await p.textContent('.xs-brand')).includes('MSDEVBUILD'), 'header has no MSDEVBUILD brand');
    const brand = await p.getAttribute('#xs', 'data-brand');
    expect(brand && (await p.textContent('.xs-brandline')).includes(brand), 'welcome screen is missing the brand line');
    expect((await p.textContent('.xs-facts')).includes('QA Learner'), 'candidate name not on welcome screen');
    await p.click('#xs-foot [data-s="agree"]');
    await scan('agreement');
    await p.click('[data-x="decline"]');
    expect(await p.isVisible('#xs-modal'), 'Decline did not ask to confirm');
    await p.keyboard.press('Escape');
    expect(await p.isHidden('#xs-modal'), 'Escape did not close the Decline dialog');
    await p.click('#xs-foot [data-s="intro"]');
    await scan('features');
    await p.click('#xs-foot [data-s="start"]');
    await scan('start');
    const before = await p.textContent('#xs-time');
    await p.click('[data-x="start"]');

    // Questions and tools
    expect(/^Question 1 of \d+/.test(await pos()), `first question not shown (got "${await pos()}")`);
    await scan('question');
    await p.waitForTimeout(1100);
    expect((await p.textContent('#xs-time')) !== before, 'timer did not start');
    await p.click('#xs-mark');
    expect((await p.getAttribute('#xs-mark', 'aria-pressed')) === 'true', 'Mark for review did not toggle');
    await p.click('[data-zoom="1"]');
    expect((await p.textContent('#xs-zoom-pct')) === '110%', 'zoom did not change');
    await p.click('[data-tool="time"]');
    expect(await p.isHidden('#xs-time'), 'Hide time did not hide the timer');
    await p.click('[data-tool="time"]');
    await p.keyboard.press('Alt+KeyN');
    expect(/^Question 2 of/.test(await pos()), 'Alt+N did not go to the next question');
    await p.keyboard.press('Alt+KeyP');
    expect(/^Question 1 of/.test(await pos()), 'Alt+P did not go back');
    await p.click('[data-tool="contrast"]');
    expect(await p.evaluate(() => document.getElementById('xs').classList.contains('hc')), 'Contrast did not switch');
    await scan('question-contrast');
    await p.click('[data-tool="help"]');
    await scan('help-contrast');
    await p.keyboard.press('Escape');
    expect(await p.isHidden('#xs-modal'), 'Escape did not close Help');

    // Review grid (still in high contrast)
    await p.keyboard.press('Alt+KeyR');
    expect((await pos()).startsWith('Review screen'), 'Alt+R did not open the review screen');
    await scan('review-contrast');
    await p.click('[data-filter="marked"]');
    expect((await p.locator('.xs-cell').count()) === 1, 'Review marked should show exactly one question');
    await p.click('[data-tool="contrast"]');
    await scan('review');
    await p.click('.xs-cell[data-goto="0"]');
    expect(/^Question 1 of/.test(await pos()), 'review tile did not return to the question');

    // Finish section 1, then the locked Yes/No section, then the score report
    await p.click('#xs-foot [data-x="review"]');
    await p.click('[data-x="finish1"]');
    const sec2 = await p.$('[data-x="to-sec2"]');
    if (sec2) {
      await sec2.click();
      await scan('section2');
      await p.click('[data-x="sec2go"]');
      expect(await p.isHidden('#xs-mark'), 'Mark for review should be hidden in section 2');
      for (let i = 0; i < 20 && (await p.isVisible('#xs')); i++) {
        for (const r of await p.$$('#xs-body input[value="1"]')) await r.check();
        await p.click('[data-x="next2"]');
        if (await p.isVisible('#xs-modal')) await p.click('#xs-dialog [data-x="end"]');
      }
    } else await p.click('#xs-dialog [data-x="end"]');
    await p.waitForSelector('#sr-title', { timeout: 5000 });
    expect(await p.isHidden('#xs'), 'exam room still open after ending');
  } catch (e) {
    fail.push(`${where}: ${e.message.split('\n')[0]}`);
  }
  await ctx.close();
}
await b.close();
console.log(`walked the exam room for ${exams.length} exam(s) × ${SIZES.length} screen sizes`);
finish('mock exam room', fail);
