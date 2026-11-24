/**
 * Headless lab check: runs every task's `cli` hint in order in a fresh
 * simulated World and confirms each task's check passes. Fast (no build, no
 * browser), so it suits work in progress. The browser version is
 * `npm run qa -- tools`.
 *
 *   npx esbuild scripts/qa/lab-check.ts --bundle --platform=node --format=esm --log-level=error --outfile=<tmp>/lab-check.mjs && node <tmp>/lab-check.mjs [labIdPrefix]
 */
import { World } from '../../src/lib/sim/world';
import { runCli } from '../../src/lib/sim/cli';
import { LABS } from '../../src/lib/sim/labs';

const prefix = process.argv[2] ?? '';
let bad = 0;
for (const lab of LABS.filter((l) => l.id.startsWith(prefix) && l.start !== 'terminal')) {
  const w = new World();
  const fails: string[] = [];
  lab.tasks.forEach((t, i) => {
    if (!t.cli) { fails.push(`task ${i + 1}: no cli hint`); return; }
    let r = runCli(t.cli, w);
    for (let k = 0; k < 5 && r.confirm; k++) r = r.confirm.then();
    // Some tasks are meant to be blocked (a lock, a policy deny): an error is fine if the check passes.
    if (!t.check(w)) fails.push(`task ${i + 1}: check did not pass after its cli hint${r.error ? ` (error: ${r.error.split('\n')[0]})` : ''}`);
  });
  if (fails.length) { bad++; console.log(`✗ ${lab.id}\n  ${fails.join('\n  ')}`); }
  else console.log(`✓ ${lab.id} (${lab.tasks.length} tasks)`);
}
process.exit(bad ? 1 : 0);
