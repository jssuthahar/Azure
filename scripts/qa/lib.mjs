/** Shared helpers for the browser QA checks (scripts/qa/*.mjs). They test the BUILT site served by `astro preview`. */
import { chromium } from 'playwright-core';
import { existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export const BASE = process.env.QA_BASE ?? 'http://localhost:4399';
export const ROOT = process.cwd();
export const SHOTS = join(tmpdir(), 'msdb-qa-shots');
mkdirSync(SHOTS, { recursive: true });

const CHROME = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean);
export const chromePath = () => {
  const p = CHROME.find((c) => existsSync(c));
  if (!p) throw new Error('Chrome not found. Install Google Chrome or set CHROME_PATH.');
  return p;
};
export const ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']; // WebGL for the 3D scenes in headless Chrome
export const launch = () => chromium.launch({ executablePath: chromePath(), args: ARGS });
export const persistent = (dir, opts = {}) => chromium.launchPersistentContext(dir, { executablePath: chromePath(), args: ARGS, ...opts });

/** Every lesson URL, read from the content folder (works for any exam). */
export function lessonUrls() {
  const base = join(ROOT, 'src/content/tutorials');
  const out = [];
  for (const exam of readdirSync(base)) for (const mod of readdirSync(join(base, exam))) {
    const d = join(base, exam, mod);
    if (!statSync(d).isDirectory()) continue;
    for (const f of readdirSync(d)) if (f.endsWith('.mdx')) out.push(`/${exam}/${mod}/${f.replace(/\.mdx$/, '')}/`);
  }
  return out;
}

export const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
export const IPAD_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15';
/** iPadOS reports itself as a Mac; this makes Chrome look like an iPad to our detection code. */
export const asIPad = (ctx) => ctx.addInitScript(() => { Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' }); Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 5 }); });

/** Collect page errors; console errors except network noise. */
export function watch(page, bucket) {
  page.on('pageerror', (e) => bucket.push(`${page.url()} pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_INTERNET_DISCONNECTED|404/.test(m.text())) bucket.push(`${page.url()} console: ${m.text()}`); });
}

export function finish(name, failures) {
  if (failures.length) { console.log(`\n✗ ${name}: ${failures.length} problem(s)\n  ${failures.join('\n  ')}`); process.exitCode = 1; }
  else console.log(`✓ ${name}`);
}
