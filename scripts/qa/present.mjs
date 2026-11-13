/**
 * Slide mode on lessons (src/lib/present.ts): opens full screen, walks every slide with
 * Next / keys / swipe, keeps the page from scrolling sideways, closes with Escape, and
 * carries on into the next lesson. Runs on a phone, an iPad and a desktop size.
 */
import { launch, BASE, lessonUrls, watch, finish, SHOTS } from './lib.mjs';
import { join } from 'node:path';

const failures = [];
const b = await launch();
const urls = lessonUrls();
const sample = [urls[0], urls[Math.floor(urls.length / 2)], urls[urls.length - 1]];
const sizes = [
  { name: 'phone', width: 360, height: 740, isMobile: true, hasTouch: true },
  { name: 'ipad', width: 820, height: 1180, isMobile: true, hasTouch: true },
  { name: 'desktop', width: 1366, height: 860 },
];

for (const s of sizes) {
  const ctx = await b.newContext({ viewport: { width: s.width, height: s.height }, isMobile: s.isMobile, hasTouch: s.hasTouch });
  const page = await ctx.newPage();
  watch(page, failures);
  for (const u of sample) {
    const where = `${s.name} ${u}`;
    await page.goto(BASE + u, { waitUntil: 'load' });
    await page.evaluate(() => sessionStorage.clear());
    await page.click('[data-present-open]');
    const st = await page.evaluate(() => ({
      on: document.documentElement.classList.contains('presenting'),
      count: document.querySelector('.present-count')?.textContent ?? '',
      title: document.querySelector('.present-title')?.textContent ?? '',
    }));
    if (!st.on) { failures.push(`${where}: slide mode did not open`); continue; }
    const total = Number(st.count.split('/')[1]);
    if (!(total >= 5)) failures.push(`${where}: only ${total} slides`);
    if (st.title !== 'The 30-second answer') failures.push(`${where}: first slide is "${st.title}"`);
    if (s.name === 'phone') await page.screenshot({ path: join(SHOTS, `present-${s.name}.png`) });

    const seen = new Set();
    for (let i = 1; i <= total; i++) {
      const info = await page.evaluate(() => {
        const art = document.querySelector('article[data-present-root]');
        const shown = [...art.querySelectorAll(':scope *')].filter((e) => !e.closest('.present-ui') && e.getClientRects().length && getComputedStyle(e).display !== 'none');
        return {
          count: document.querySelector('.present-count').textContent,
          title: document.querySelector('.present-title').textContent,
          text: art.innerText.replace(/\s+/g, ' ').length,
          wide: document.documentElement.scrollWidth > innerWidth + 1 || art.scrollWidth > art.clientWidth + 1,
          shown: shown.length,
        };
      });
      if (info.count !== `${i} / ${total}`) failures.push(`${where}: expected slide ${i}, got ${info.count}`);
      if (info.shown < 2) failures.push(`${where}: slide ${i} (${info.title}) is empty`);
      if (info.wide) failures.push(`${where}: slide ${i} (${info.title}) scrolls sideways`);
      seen.add(info.title);
      if (i < total) {
        if (i === 1 && s.hasTouch) {
          // Swipe left on the slide body.
          await page.evaluate(() => {
            const art = document.querySelector('article[data-present-root]');
            const t = (x) => new Touch({ identifier: 1, target: art, clientX: x, clientY: 300 });
            art.dispatchEvent(new TouchEvent('touchstart', { touches: [t(300)], changedTouches: [t(300)], bubbles: true }));
            art.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [t(100)], bubbles: true }));
          });
        } else if (i % 2) await page.keyboard.press('ArrowRight');
        else await page.click('.present-next');
      }
    }
    if (!seen.has('Lesson complete')) failures.push(`${where}: no finish slide`);
    await page.keyboard.press('ArrowLeft');
    const back = await page.textContent('.present-count');
    if (back !== `${total - 1} / ${total}`) failures.push(`${where}: ArrowLeft went to ${back}`);

    await page.keyboard.press('Escape');
    const off = await page.evaluate(() => !document.documentElement.classList.contains('presenting') && !document.querySelector('[data-slide-off]'));
    if (!off) failures.push(`${where}: Escape did not restore the page`);
  }

  // "Next lesson" on the last slide opens the next lesson in slide mode.
  await page.goto(BASE + urls[0], { waitUntil: 'load' });
  await page.evaluate(() => sessionStorage.clear());
  await page.click('[data-present-open]');
  await page.keyboard.press('End');
  const hasNext = await page.evaluate(() => Boolean(document.querySelector('article a[rel="next"]')));
  if (hasNext) {
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click('.present-next')]);
    await page.waitForFunction(() => document.documentElement.classList.contains('presenting'), null, { timeout: 3000 }).catch(() => failures.push(`${s.name}: next lesson did not open in slide mode`));
    await page.keyboard.press('Escape');
  }
  await ctx.close();
}
await b.close();
finish('present (slide mode)', failures);
