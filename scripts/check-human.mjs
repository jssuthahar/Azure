/**
 * Humanizer guard: flags phrasing that makes text read as machine-written.
 * Scans lessons (MDX), question banks (JSON), data files and page copy.
 *
 *   npm run check:human            report + fail on any banned phrase
 *   npm run check:human -- --list  also print every hit with its line
 *
 * Rules
 *   BANNED   stock AI words and phrases. Rewrite in plain words.
 *   DASHES   em dashes (—). Allowed sparingly; more than MAX_DASH per 1,000 words in a file fails.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const LIST = process.argv.includes('--list');
const MAX_DASH = 2; // per 1,000 words

const BANNED = [
  // vocabulary
  'delve', 'delving', 'leverag(e|es|ed|ing)', 'seamless(ly)?', 'robust', 'comprehensive', 'crucial(ly)?', 'pivotal', 'paramount',
  'tapestry', 'realm', 'landscape of', 'ever-evolving', 'ever-changing', 'cutting-edge', 'game[- ]changer', 'plethora', 'myriad',
  'empower(s|ed|ing)?', 'unlock(s|ed|ing)? the', 'unleash', 'supercharge', 'elevate(s|d)? your', 'harness(es|ed|ing)? the power',
  'streamline(s|d)?', 'revolutioni[sz]e', 'transformative', 'holistic', 'synergy', 'meticulous(ly)?', 'intricate', 'nestled',
  'boasts', 'bolster', 'foster(s|ing)?', 'embark', 'utili[sz]e', 'utili[sz]ed', 'utili[sz]ing', 'facilitate(s|d)?', 'optimal(ly)?',
  'furthermore', 'moreover', 'additionally', 'in essence', 'at its core', 'a testament to', 'rest assured', 'look no further',
  // stock openers / closers
  "in today'?s", "it'?s (important|worth|crucial) (to note|noting|to remember)", 'it is important to note', 'in conclusion',
  "let'?s dive", 'dive (deep )?into', 'deep dive', 'whether you\'?re a', 'the world of', 'navigat(e|ing) the (complex|world)',
  'key takeaways?', 'in summary,', 'to sum up', 'buckle up', 'without further ado', 'stands as', 'serves as a',
  'not just .{1,30}, but', 'more than just', 'a wide (range|array|variety) of', 'in the (fast-paced|digital) (world|age)',
];
const BANNED_RE = new RegExp(`\\b(${BANNED.join('|')})\\b`, 'gi');
/** Product names and fixed technical terms that merely look like stock phrases. */
const ALLOW_RE = /seamless (single sign-on|SSO)/gi;

const TARGETS = [
  ['src/content/tutorials', /\.mdx$/],
  ['src/content/questions', /\.json$/],
  ['src/data', /\.ts$/],
  ['src/pages', /\.(astro|ts)$/],
  ['src/components', /\.astro$/],
  ['src/layouts', /\.astro$/],
  ['src/config.ts', /\.ts$/],
];

const files = [];
const walk = (p, re) => { const s = statSync(p); if (s.isDirectory()) readdirSync(p).forEach((f) => walk(join(p, f), re)); else if (re.test(p)) files.push(p); };
for (const [dir, re] of TARGETS) walk(join(ROOT, dir), re);

/** Only human-facing prose: strip code fences, imports, script/style blocks, HTML attributes and identifiers. */
function prose(path, text) {
  if (path.endsWith('.mdx')) return text.replace(/```[\s\S]*?```/g, '').replace(/^(import|export) .*$/gm, '');
  if (path.endsWith('.json')) return text;
  let t = text.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  // keep string literals and text nodes; drop code-ish lines
  const strings = [...t.matchAll(/'((?:[^'\\\n]|\\.){12,})'|"((?:[^"\\\n]|\\.){12,})"|`([^`]{12,})`|>([^<>{}\n]{12,})</g)].map((m) => m[1] ?? m[2] ?? m[3] ?? m[4]);
  return strings.filter((s) => / /.test(s) && !/^[\w-]+( [\w-]+)*$/.test(s.trim()) || /[.,!?]/.test(s)).join('\n');
}

let banned = 0, dashFiles = 0;
const report = [];
for (const f of files) {
  const raw = readFileSync(f, 'utf8');
  const text = prose(f, raw).replace(ALLOW_RE, '');
  const words = (text.match(/\b\w+\b/g) ?? []).length;
  if (!words) continue;
  const hits = [...text.matchAll(BANNED_RE)].map((m) => m[0]);
  const dashes = (text.match(/—/g) ?? []).length;
  const per1k = (dashes / words) * 1000;
  const overDash = per1k > MAX_DASH && dashes > 2;
  if (!hits.length && !overDash) continue;
  banned += hits.length;
  if (overDash) dashFiles++;
  report.push({ file: relative(ROOT, f), hits, dashes, per1k: per1k.toFixed(1), words });
}

report.sort((a, b) => b.hits.length - a.hits.length || b.dashes - a.dashes);
for (const r of report) {
  console.log(`${r.file}: ${r.hits.length ? `${r.hits.length} phrase(s) [${[...new Set(r.hits.map((h) => h.toLowerCase()))].join(', ')}]` : ''}${r.dashes > 2 && Number(r.per1k) > MAX_DASH ? ` ${r.dashes} em dashes (${r.per1k}/1k words)` : ''}`);
  if (LIST) {
    readFileSync(join(ROOT, r.file), 'utf8').split('\n').forEach((l, i) => { if (BANNED_RE.test(l) || l.includes('—')) console.log(`   ${i + 1}: ${l.trim().slice(0, 160)}`); BANNED_RE.lastIndex = 0; });
  }
}
console.log(`\nhumanizer: ${files.length} files scanned · ${banned} stock phrase(s) · ${dashFiles} file(s) over ${MAX_DASH} em dashes per 1,000 words`);
if (banned || dashFiles) process.exit(1);
