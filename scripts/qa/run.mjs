/**
 * Full QA on the built site. Starts `astro preview` on :4399, runs the browser checks, stops the server.
 *
 *   npm run qa                      everything (build first: npm run build)
 *   npm run qa -- lessons layout    only some: lessons | layout | a11y | pwa | exam
 *
 * Needs Google Chrome installed (or CHROME_PATH). The SEO audit runs without a browser: npm run qa:seo
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const ALL = ['lessons', 'layout', 'a11y', 'pwa', 'exam'];
const pick = process.argv.slice(2).filter((a) => ALL.includes(a));
const checks = pick.length ? pick : ALL;
if (!existsSync('dist/index.html')) { console.error('No build found. Run: npm run build'); process.exit(1); }

const server = spawn('npx', ['astro', 'preview', '--port', '4399'], { stdio: 'ignore', detached: true });
const up = async () => { for (let i = 0; i < 60; i++) { try { if ((await fetch('http://localhost:4399/')).ok) return; } catch {} await new Promise((r) => setTimeout(r, 500)); } throw new Error('preview server did not start'); };
let failed = 0;
try {
  await up();
  for (const c of checks) {
    console.log(`\n── ${c} ──`);
    const r = spawnSync(process.execPath, [`scripts/qa/${c}.mjs`], { stdio: 'inherit' });
    if (r.status !== 0) failed++;
  }
} finally {
  try { process.kill(-server.pid); } catch {}
}
console.log(failed ? `\n✗ QA: ${failed} check(s) failed` : '\n✓ QA: all checks passed');
process.exit(failed ? 1 : 0);
