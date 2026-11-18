// Validates question banks for every exam: unique ids, answer indexes in range,
// single/multi consistency, and reports official objectives with no practice question.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
const root = new URL('../src/content/questions/', import.meta.url);
let errors = 0;
for (const exam of readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
  const dir = new URL(`${exam}/`, root);
  const sylUrl = new URL(`../src/data/${exam}/syllabus.ts`, import.meta.url);
  const objectives = existsSync(sylUrl) ? [...readFileSync(sylUrl, 'utf8').matchAll(/id: '(\d\.\d\.\d)'/g)].map((m) => m[1]) : [];
  const ids = new Set(); const covered = new Set(); const perDomain = {};
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const bank = JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
    if (bank.cert !== exam) { errors++; console.log(`${exam}/${f}: cert is '${bank.cert}', expected '${exam}'`); }
    for (const q of bank.questions) {
      perDomain[bank.domain] = (perDomain[bank.domain] ?? 0) + 1;
      const err = (m) => { errors++; console.log(`${exam}/${f} ${q.id}: ${m}`); };
      if (ids.has(q.id)) err('duplicate id'); ids.add(q.id);
      if (q.answer.some((a) => a >= q.options.length)) err('answer index out of range');
      if (q.type === 'single' && q.answer.length !== 1) err('single with multiple answers');
      if (q.type === 'multi' && q.answer.length < 2) err('multi with < 2 answers');
      if (q.objective && objectives.length && !objectives.includes(q.objective)) err(`unknown objective ${q.objective}`);
      if (q.objective) covered.add(q.objective);
    }
  }
  const missing = objectives.filter((o) => !covered.has(o));
  console.log(`${exam} questions: ${ids.size} (${Object.entries(perDomain).map(([d, n]) => `domain ${d}: ${n}`).join(', ')})`);
  console.log(missing.length ? `${exam} objectives without a tagged question: ${missing.join(', ')}` : `${exam}: every objective has at least one question`);
}
process.exit(errors ? 1 : 0);
