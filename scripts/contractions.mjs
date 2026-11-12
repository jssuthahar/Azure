/**
 * Conversational register for lesson prose: "you do not" → "you don't", "it is not" → "it isn't".
 * Runs on lesson MDX only (exam questions stay formal, like Microsoft's).
 * Never touches code, inline code, quoted text (exam wording, JS strings), titles, SEO fields or imports.
 *
 *   node scripts/contractions.mjs          dry run: counts + samples
 *   node scripts/contractions.mjs --write  apply
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const WRITE = process.argv.includes('--write');
const ROOT = join(process.cwd(), 'src/content/tutorials');
const SKIP_KEYS = /^\s*(title|seoTitle|description|term|slug|cover|coverAlt|updated|readingMinutes|id):/;

// [pattern, replacement]; replacement keeps the first letter's case
const RULES = [
  [/\b([Dd])o not\b/g, '$1on\'t'], [/\b([Dd])oes not\b/g, '$1oesn\'t'], [/\b([Dd])id not\b/g, '$1idn\'t'],
  [/\b([Ii])s not\b/g, '$1sn\'t'], [/\b([Aa])re not\b/g, '$1ren\'t'], [/\b([Ww])as not\b/g, '$1asn\'t'], [/\b([Ww])ere not\b/g, '$1eren\'t'],
  [/\b([Cc])annot\b/g, '$1an\'t'], [/\b([Ww])ill not\b/g, '$1on\'t'], [/\b([Ww])ould not\b/g, '$1ouldn\'t'], [/\b([Ss])hould not\b/g, '$1houldn\'t'],
  [/\b([Cc])ould not\b/g, '$1ouldn\'t'], [/\b([Hh])as not\b/g, '$1asn\'t'], [/\b([Hh])ave not\b/g, '$1aven\'t'],
  [/\b([Yy])ou will\b/g, '$1ou\'ll'], [/\b([Ll])et us\b/g, '$1et\'s'],
  // only when a word follows, so "what it is." and "where you are." stay intact
  [/\b([Ii])t is(?= [a-z])/g, '$1t\'s'], [/\b([Yy])ou are(?= [a-z])/g, '$1ou\'re'], [/\b([Tt])hey are(?= [a-z])/g, '$1hey\'re'],
  [/\b([Ww])e are(?= [a-z])/g, '$1e\'re'], [/\b([Tt])here is(?= [a-z])/g, '$1here\'s'], [/\b([Tt])hat is(?= [a-z]+ing\b)/g, '$1hat\'s'],
];
// "won't" from "will not" must not hit "will notice": guarded by \b above.  Fix "Won't" capital: W + on't.
const FIX = (s) => s.replace(/\b([Ww])on't\b/g, (m, w) => (w === 'W' ? "Won't" : "won't"));

/** Split a line into [text, protected] runs: inline code, quoted strings and JSX braces are protected. */
function runs(line) {
  const out = [];
  const re = /`[^`]*`|"[^"]*"|“[^”]*”|'(?:[^'\\]|\\.)*'(?=[\s,;:)\]}]|$)|\{[^{}]*\}/g;
  let last = 0;
  for (const m of line.matchAll(re)) {
    // an apostrophe inside a word (don't) is not a string start
    if (m[0][0] === "'" && /\w/.test(line[m.index - 1] ?? '')) continue;
    out.push([line.slice(last, m.index), false], [m[0], true]);
    last = m.index + m[0].length;
  }
  out.push([line.slice(last), false]);
  return out;
}

const files = [];
const walk = (p) => (statSync(p).isDirectory() ? readdirSync(p).forEach((f) => walk(join(p, f))) : p.endsWith('.mdx') && files.push(p));
walk(ROOT);

let total = 0;
const samples = [];
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  let fm = 0, fence = false, block = false, changed = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l === '---' && fm < 2) { fm++; continue; }
    if (/^\s*```/.test(l)) { fence = !fence; continue; }
    if (fence || /^(import|export) /.test(l) || /^\s*<!--/.test(l)) continue;
    if (fm === 1) {
      // frontmatter: only the content lines of >- / | block scalars (they can hold apostrophes safely)
      if (/:\s*[>|]-?\s*$/.test(l)) { block = !SKIP_KEYS.test(l); continue; }
      if (/^\s*(- )?[\w]+:/.test(l)) { block = false; continue; }
      if (!block) continue;
    }
    if (SKIP_KEYS.test(l)) continue;
    const next = runs(l).map(([t, prot]) => (prot ? t : FIX(RULES.reduce((s, [a, b]) => s.replace(a, b), t)))).join('');
    if (next !== l) {
      const n = (next.match(/'/g) ?? []).length - (l.match(/'/g) ?? []).length;
      changed += n; total += n;
      if (samples.length < 14 && Math.random() < 0.2) samples.push(`${l.trim().slice(0, 110)}\n   → ${next.trim().slice(0, 110)}`);
      lines[i] = next;
    }
  }
  if (changed && WRITE) writeFileSync(f, lines.join('\n'));
}
console.log(`${WRITE ? 'applied' : 'would apply'} ${total} contractions across ${files.length} lessons\n`);
console.log(samples.join('\n\n'));
