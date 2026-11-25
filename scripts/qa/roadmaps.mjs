/**
 * Roadmap pages and the Career Metro: on a phone and a desktop, every roadmap
 * renders its lines, a departure button rides a line (boarding pass, lit line,
 * train shown), a terminal shows the lines that reach it, the path finder
 * drives the metro, the tour starts and stops, and nothing scrolls sideways.
 */
import { launch, BASE, watch, finish, SHOTS } from './lib.mjs';
import { join } from 'node:path';

const failures = [];
const b = await launch();
const pages = ['/ai-certifications/', '/security-certifications/', '/github-certifications/'];
const sizes = [
  { name: 'phone', width: 375, height: 800, isMobile: true, hasTouch: true },
  { name: 'desktop', width: 1366, height: 900 },
];
for (const s of sizes) {
  const ctx = await b.newContext({ viewport: { width: s.width, height: s.height }, isMobile: s.isMobile, hasTouch: s.hasTouch, reducedMotion: 'reduce' });
  for (const url of pages) {
    const page = await ctx.newPage();
    watch(page, failures);
    const fail = (m) => failures.push(`${s.name} ${url}: ${m}`);
    await page.goto(`${BASE}${url}`, { waitUntil: 'load' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'load' });
    const svg = s.name === 'phone' ? '.cm-v' : '.cm-h';
    if (!(await page.isVisible(svg))) fail(`${svg} map is not visible`);
    const lines = await page.locator(`${svg} .cm-line`).count();
    const rows = await page.locator('.cm-board button').count();
    if (lines < 2 || lines !== rows) fail(`lines (${lines}) and departures (${rows}) don't match`);

    await page.locator('.cm-board button').nth(1).click();
    await page.waitForTimeout(200);
    if (!/Boarding pass · Line 2/i.test(await page.textContent('[data-cm-pass]'))) fail('departure did not open the boarding pass for line 2');
    if (!(await page.locator(`${svg} .cm-line[data-line="1"].is-on`).count())) fail('line 2 is not highlighted');
    if (await page.locator(`${svg} [data-train][hidden]`).count()) fail('the train is not shown');
    if (!(await page.locator('[data-cm-pass] a.cm-cta').count())) fail('the boarding pass has no call to action');

    if (await page.locator(`${svg} .cm-term`).count()) {
      await page.locator(`${svg} .cm-term`).first().click();
      if (!/Lines that stop here/.test(await page.textContent('[data-cm-pass]'))) fail('terminal did not list its lines');
    }

    await page.locator('[data-pick]').first().click();
    if (!/Line 1/.test(await page.textContent('[data-cm-pass]'))) fail('the path finder did not drive the metro');

    await page.click('[data-cm-tour]');
    if ((await page.getAttribute('[data-cm-tour]', 'aria-pressed')) !== 'true') fail('tour did not start');
    await page.click('[data-cm-tour]');
    if ((await page.getAttribute('[data-cm-tour]', 'aria-pressed')) !== 'false') fail('tour did not stop');

    // keyboard: Enter on a focused station
    await page.locator(`${svg} .cm-st`).last().focus();
    await page.keyboard.press('Enter');
    if (!(await page.locator(`${svg} .cm-st`).last().evaluate((el) => el.classList.contains('is-on')))) fail('Enter on a station did not select it');

    const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (wide > 1) fail(`page scrolls sideways by ${wide}px`);
    if (url === pages[0]) await page.screenshot({ path: join(SHOTS, `roadmap-metro-${s.name}.png`) });
    await page.close();
  }
  await ctx.close();
}
await b.close();
finish('Roadmaps and Career Metro', failures);
