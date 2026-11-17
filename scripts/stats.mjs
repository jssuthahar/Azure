/**
 * Usage numbers from the anonymous counters in Firestore (stats/*).
 *   npm run stats            last 30 days + all-time totals
 *   npm run stats -- 90      last 90 days
 *   npm run stats -- --csv   CSV for a spreadsheet
 * Read-only. Counters are public-read by firestore.rules, so no login is needed.
 */
const PROJECT = 'msdevbuild-azure';
const KEY = 'AIzaSyAUkdCvWJ-1_IaIe_PHa7xqqy3ZBDtGd4Q';
const EVENTS = ['learner', 'visit', 'lesson', 'quiz', 'mock', 'lab', 'signin'];
const days = Number(process.argv.find((a) => /^\d+$/.test(a)) ?? 30);
const csv = process.argv.includes('--csv');

const docs = [];
let page = '';
do {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/stats?pageSize=300&key=${KEY}${page ? `&pageToken=${page}` : ''}`;
  const r = await fetch(url);
  if (!r.ok) { console.error(`Firestore said ${r.status}: ${await r.text()}`); process.exit(1); }
  const j = await r.json();
  docs.push(...(j.documents ?? []));
  page = j.nextPageToken ?? '';
} while (page);

const rows = new Map(); const total = {};
for (const d of docs) {
  const id = d.name.split('/').pop(); const [when, ev] = id.split('__');
  const n = Number(d.fields?.n?.integerValue ?? d.fields?.n?.doubleValue ?? 0);
  if (when === 'total') total[ev] = n;
  else { if (!rows.has(when)) rows.set(when, {}); rows.get(when)[ev] = n; }
}
const since = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
const dates = [...rows.keys()].filter((d) => d >= since).sort();
const label = { learner: 'new learners', visit: 'daily visitors', lesson: 'lessons done', quiz: 'quizzes', mock: 'mock exams', lab: 'labs', signin: 'sign-ups' };

if (csv) {
  console.log(['date', ...EVENTS].join(','));
  for (const d of dates) console.log([d, ...EVENTS.map((e) => rows.get(d)[e] ?? 0)].join(','));
  console.log(['total', ...EVENTS.map((e) => total[e] ?? 0)].join(','));
} else {
  const w = 16;
  console.log(`\nMSDEVBUILD Azure usage, last ${days} days (UTC)\n`);
  console.log('date'.padEnd(12) + EVENTS.map((e) => label[e].padStart(w)).join(''));
  for (const d of dates) console.log(d.padEnd(12) + EVENTS.map((e) => String(rows.get(d)[e] ?? 0).padStart(w)).join(''));
  const sum = (e) => dates.reduce((n, d) => n + (rows.get(d)[e] ?? 0), 0);
  console.log('-'.repeat(12 + w * EVENTS.length));
  console.log(`${days}d total`.padEnd(12) + EVENTS.map((e) => String(sum(e)).padStart(w)).join(''));
  console.log('all time'.padEnd(12) + EVENTS.map((e) => String(total[e] ?? 0).padStart(w)).join(''));
  if (!docs.length) console.log('\nNo counts yet. They start once the site with counting is deployed to azure.msdevbuild.com.');
}
