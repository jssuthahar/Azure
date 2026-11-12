/**
 * Installable app (PWA) checks against the built site:
 *  1. Chrome's own installability check passes, the service worker controls the page, icons/screenshots load
 *  2. a visited lesson reloads offline; an unvisited page shows /offline/
 *  3. "Save the whole course" downloads everything; lessons, mock exam and a 3D scene then work offline
 *  4. iPhone and iPad Safari get the right "Add to Home Screen" steps; the banner appears after 3 views and "Not now" sticks
 *  5. inside the installed iOS app the Back button appears and the Install button hides
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { launch, persistent, BASE, IPHONE_UA, IPAD_UA, asIPad, watch, finish } from './lib.mjs';

const fail = [];
const errs = [];
const check = (ok, msg) => { if (!ok) fail.push(msg); };

const profile = mkdtempSync(join(tmpdir(), 'msdb-qa-profile-'));
{
  const ctx = await persistent(profile, { viewport: { width: 1280, height: 800 } }); // installability needs a non-incognito profile
  const p = ctx.pages()[0] ?? (await ctx.newPage());
  watch(p, errs);
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.reload({ waitUntil: 'networkidle' });
  const cdp = await ctx.newCDPSession(p);
  const inst = (await cdp.send('Page.getInstallabilityErrors')).installabilityErrors;
  check(!inst.length, `installability errors: ${JSON.stringify(inst)}`);
  const man = await cdp.send('Page.getAppManifest');
  check(!man.errors.length, `manifest errors: ${JSON.stringify(man.errors)}`);
  check(await p.evaluate(() => !!navigator.serviceWorker.controller), 'service worker does not control the page');
  const bad = await p.evaluate(async () => { const m = await (await fetch('/manifest.webmanifest')).json(); const r = await Promise.all([...m.icons, ...m.screenshots].map(async (i) => [i.src, (await fetch(i.src)).status])); return r.filter(([, s]) => s !== 200).map(([u]) => u); });
  check(!bad.length, `manifest files missing: ${bad.join(', ')}`);

  await p.goto(BASE + '/az-900/cloud-concepts/iaas/', { waitUntil: 'networkidle' });
  await ctx.setOffline(true);
  await p.reload({ waitUntil: 'domcontentloaded' });
  check(/IaaS/.test(await p.locator('h1').first().textContent()), 'visited lesson did not reload offline');
  await p.goto(BASE + '/az-900/cloud-concepts/saas/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(500);
  check(/offline/i.test(await p.locator('h1').first().textContent()), 'unvisited page did not show the offline page');
  await ctx.setOffline(false);
  await p.waitForTimeout(1500); // the offline page reloads itself when the connection returns

  await p.goto(BASE + '/app/', { waitUntil: 'networkidle' });
  await p.click('#off-save');
  await p.waitForFunction(() => /pages saved on this device/.test(document.getElementById('off-status').textContent), null, { timeout: 180000 });
  const status = await p.locator('#off-status').textContent();
  const [, n, total] = status.match(/(\d+) of (\d+)/) ?? [];
  check(n && n === total, `save for offline incomplete: ${status}`);
  await ctx.setOffline(true);
  for (const u of ['/az-900/management-and-governance/azure-policy/', '/az-900/mock-exam/', '/az-900/revision/', '/simulator/region-goes-down/']) {
    await p.goto(BASE + u, { waitUntil: 'load' });
    check(!/offline/i.test(await p.locator('h1').first().textContent()), `${u} not available offline after saving`);
  }
  await p.goto(BASE + '/az-900/cloud-concepts/iaas/', { waitUntil: 'load' });
  check(await p.waitForSelector('figure.d3.d3-ready', { timeout: 20000 }).then(() => true).catch(() => false), '3D scene does not start offline');
  await ctx.setOffline(false);
  await ctx.close();
  rmSync(profile, { recursive: true, force: true });
}

const b = await launch();
for (const [name, ua, vp, ipad, steps] of [['iPhone', IPHONE_UA, { width: 390, height: 844 }, false, 'ios-phone'], ['iPad', IPAD_UA, { width: 820, height: 1180 }, true, 'ios-ipad']]) {
  const ctx = await b.newContext({ viewport: vp, userAgent: ua, hasTouch: true, isMobile: !ipad });
  if (ipad) await asIPad(ctx);
  const p = await ctx.newPage();
  watch(p, errs);
  await p.goto(BASE + '/az-900/', { waitUntil: 'networkidle' });
  check(await p.locator('#install-btn').isVisible(), `${name}: header Install button hidden`);
  await p.click('#install-btn');
  await p.waitForTimeout(300);
  check((await p.locator('#install-sheet .is-steps:not([hidden])').getAttribute('data-for')) === steps, `${name}: wrong install steps`);
  await p.click('#install-sheet .is-foot [data-close]');
  await p.goto(BASE + '/az-900/cloud-concepts/', { waitUntil: 'networkidle' });
  await p.goto(BASE + '/az-900/glossary/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);
  check(await p.locator('#install-banner').isVisible(), `${name}: install banner did not appear after 3 views`);
  await p.click('#install-banner .ib-x');
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(3000);
  check(!(await p.locator('#install-banner').isVisible()), `${name}: banner came back after "Not now"`);
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: IPHONE_UA, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => Object.defineProperty(navigator, 'standalone', { get: () => true }));
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  await p.goto(BASE + '/az-900/cloud-concepts/iaas/', { waitUntil: 'networkidle' });
  check(await p.locator('#app-back').isVisible(), 'installed iOS app: Back button missing');
  check(!(await p.locator('#install-btn').isVisible()), 'installed iOS app: Install button still showing');
  await ctx.close();
}
await b.close();
finish('installable app (PWA)', [...fail, ...errs]);
