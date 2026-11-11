// Validates question banks: unique ids, answer indexes in range, single/multi consistency,
// and reports official objectives with no practice question.
import { readdirSync, readFileSync } from 'node:fs';
const dir = new URL('../src/content/questions/az-900/', import.meta.url);
const syllabus = readFileSync(new URL('../src/data/az-900/syllabus.ts', import.meta.url), 'utf8');
const objectives = [...syllabus.matchAll(/id: '(\d\.\d\.\d)'/g)].map((m) => m[1]);
const ids = new Set(); const covered = new Set(); const perDomain = { 1: 0, 2: 0, 3: 0 }; let errors = 0;
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const bank = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
  for (const q of bank.questions) {
    perDomain[bank.domain]++;
    const err = (m) => { errors++; console.log(`${f} ${q.id}: ${m}`); };
    if (ids.has(q.id)) err('duplicate id'); ids.add(q.id);
    if (q.answer.some((a) => a >= q.options.length)) err('answer index out of range');
    if (q.type === 'single' && q.answer.length !== 1) err('single with multiple answers');
    if (q.type === 'multi' && q.answer.length < 2) err('multi with < 2 answers');
    if (q.objective) covered.add(q.objective);
  }
}
const missing = objectives.filter((o) => !covered.has(o));
console.log(`questions: ${ids.size} (domain 1: ${perDomain[1]}, domain 2: ${perDomain[2]}, domain 3: ${perDomain[3]})`);
console.log(missing.length ? `objectives without a tagged question: ${missing.join(', ')}` : 'every objective has at least one question');
process.exit(errors ? 1 : 0);
