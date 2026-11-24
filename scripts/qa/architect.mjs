/**
 * Architecture Builder (/<exam>/architect/): the rule/traffic logic (headless), then the
 * real page on a phone, an iPad and a desktop: starter design, tap-to-add, drag-and-drop,
 * link mode, fixing the broken hub-and-spoke, the traffic test, Explain, keyboard moves,
 * JSON export, the restored draft and no sideways scrolling.
 */
import { launch, BASE, watch, finish, SHOTS } from './lib.mjs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const failures = [];
const out = join(tmpdir(), 'msdb-architect-check.mjs');
const bundle = spawnSync('npx', ['esbuild', 'scripts/qa/architect-check.ts', '--bundle', '--platform=node', '--format=esm', '--log-level=error', `--outfile=${out}`], { encoding: 'utf8' });
const logic = bundle.status === 0 ? spawnSync(process.execPath, [out], { encoding: 'utf8' }) : bundle;
if (logic.status !== 0) failures.push(`logic checks failed:\n${(logic.stdout ?? '') + (logic.stderr ?? '')}`);
else console.log((logic.stdout.trim().split('\n').pop()));

const URL = `${BASE}/az-104/architect/`;
const b = await launch();
const sizes = [
  { name: 'phone', width: 360, height: 760, isMobile: true, hasTouch: true },
  { name: 'ipad', width: 820, height: 1180, isMobile: true, hasTouch: true },
  { name: 'desktop', width: 1366, height: 900 },
];
const count = (page, sel) => page.evaluate((s) => document.querySelectorAll(s).length, sel);
const badge = (page) => page.textContent('[data-ab-badge]');

for (const s of sizes) {
  const ctx = await b.newContext({ viewport: { width: s.width, height: s.height }, isMobile: s.isMobile, hasTouch: s.hasTouch, acceptDownloads: true });
  const page = await ctx.newPage();
  watch(page, failures);
  page.on('dialog', (dlg) => dlg.accept());
  const fail = (m) => failures.push(`${s.name}: ${m}`);
  await page.goto(URL, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.removeItem('msdb-architect-v1'));
  await page.reload({ waitUntil: 'load' });

  // starter design loads clean
  if (await count(page, '.ab-node') < 8) fail('starter design did not render');
  if (!/No problems/.test(await badge(page))) fail(`starter design is not clean: ${await badge(page)}`);
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (wide > 1) fail(`page scrolls sideways by ${wide}px`);

  // tap-to-add
  const before = await count(page, '.ab-node');
  await page.click('[data-kind="vnet"]');
  if (await count(page, '.ab-node') !== before + 1) fail('tapping “Virtual network” did not add a node');

  // broken hub-and-spoke, then fix it with link mode
  await page.selectOption('[data-ab-template]', 'hub-spoke-broken');
  await page.click('[data-ab-load]');
  if (!/warning/.test(await badge(page))) fail(`hub-and-spoke shows no warnings: ${await badge(page)}`);
  await page.click('[data-ab-tab="check"]');
  if (!/can’t talk through vnet-hub/.test(await page.textContent('[data-ab-check]'))) fail('Check tab does not explain the transit problem');
  const links = await count(page, '.ab-link');
  for (const sub of ['as1', 'bs1']) {
    await page.click('[data-ab-link]');
    await page.locator(`[data-id="${sub}"] .ab-box`).click({ position: { x: 30, y: 12 } });
    await page.locator('[data-id="fw"] .ab-card').click({ position: { x: 40, y: 20 } });
  }
  if (await count(page, '.ab-link') !== links + 2) fail(`link mode did not add both routes (${await count(page, '.ab-link')} links)`);
  await page.click('[data-ab-tab="traffic"]');
  await page.selectOption('#abt-from', 'vma');
  await page.selectOption('#abt-to', 'vmb');
  await page.selectOption('#abt-port', '443');
  await page.click('[data-ab-run]');
  if (!(await page.isVisible('.ab-verdict.ok'))) fail(`spoke-to-spoke traffic still fails: ${await page.textContent('[data-ab-result]')}`);
  if (await count(page, '.ab-node.is-path') < 3) fail('traffic path is not highlighted on the canvas');
  if (s.name === 'phone' || s.name === 'desktop') await page.screenshot({ path: join(SHOTS, `architect-${s.name}.png`), fullPage: false });

  // explain
  await page.click('[data-ab-tab="explain"]');
  await page.click('[data-ab-explain-run]');
  if (!/What you built/.test(await page.textContent('[data-ab-explain]'))) fail('Explain produced nothing');

  // keyboard: move the selected VM with the arrow key
  const vm = page.locator('[data-id="vmb"]');
  const x0 = Number(await vm.locator('.ab-card').getAttribute('x'));
  await vm.focus();
  await page.keyboard.press('ArrowRight');
  const x1 = Number(await page.locator('[data-id="vmb"] .ab-card').getAttribute('x'));
  if (x1 !== x0 + 10) fail(`arrow key did not move the VM (${x0} → ${x1})`);

  // desktop only: drag from the palette onto the canvas, and export JSON
  if (s.name === 'desktop') {
    const n0 = await count(page, '.ab-node');
    await page.locator('[data-kind="pip"]').scrollIntoViewIfNeeded();
    const src = await page.locator('[data-kind="pip"]').boundingBox();
    const dst = await page.locator('[data-ab-wrap]').boundingBox();
    await page.mouse.move(src.x + 20, src.y + 15);
    await page.mouse.down();
    await page.mouse.move(dst.x + dst.width * 0.85, dst.y + 40, { steps: 8 });
    await page.mouse.up();
    if (await count(page, '.ab-node') !== n0 + 1) fail('dragging a public IP onto the canvas did not add it');
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), page.selectOption('[data-ab-export]', 'json')]);
    if (!dl || !/\.json$/.test(dl.suggestedFilename())) fail('JSON export did not download');
  }

  // the draft survives a reload
  const n = await count(page, '.ab-node');
  await page.reload({ waitUntil: 'load' });
  if (await count(page, '.ab-node') !== n) fail('the design was not restored after reload');
  await ctx.close();
}

// GitHub exams don't get the Azure builder
const gh = await (await fetch(`${BASE}/gh-300/architect/`)).status;
if (gh !== 404) failures.push(`/gh-300/architect/ should not exist (HTTP ${gh})`);

await b.close();
finish('Architecture Builder', failures);
