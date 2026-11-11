// Quick SEO length check for tutorial frontmatter: seoTitle <= 60, description 120-160.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
const root = new URL('../src/content/tutorials', import.meta.url).pathname;
let bad = 0;
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = path.join(d, f);
  if (statSync(p).isDirectory()) return walk(p);
  if (!p.endsWith('.mdx')) return;
  const fm = readFileSync(p, 'utf8').split('---')[1];
  const issues = [];
  let data = {};
  try { data = yaml.load(fm); } catch (e) { issues.push(`YAML: ${e.reason} line ${e.mark?.line}`); }
  for (const [i, x] of (data.revision?.quick ?? []).entries()) if (typeof x.a !== 'string' || typeof x.q !== 'string') issues.push(`quick ${i + 1} must be text (quote it)`);
  for (const k of ['keyPoints', 'mistakes', 'examTips']) for (const x of data.revision?.[k] ?? []) if (typeof x !== 'string') issues.push(`${k} item must be text (quote it)`);
  const t = data.seoTitle ?? '';
  const ds = data.description ?? '';
  if (t.length > 60) issues.push(`seoTitle ${t.length}`);
  if (ds.length < 120 || ds.length > 160) issues.push(`description ${ds.length}`);
  if (issues.length) { bad++; console.log(path.relative(root, p), issues.join(', ')); }
});
walk(root);
console.log(bad ? `${bad} file(s) need attention` : 'meta OK');
