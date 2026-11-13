/**
 * Browser-side ranking for the Ask chatbot. A small BM25 over each entry's
 * question (weighted higher) and answer. Light stemming and a few Azure
 * synonyms so "VMs", "virtual machine" and "vm" all meet.
 */
import type { AskEntry } from './ask-index';

const STOP = new Set(
  'a an and are as at be by can do does for from how i in is it its me my of on or so than that the their them then there these this to us was we what when where which who why will with you your about explain tell define meaning mean please should would could use used using'.split(' '),
);

const SYN: Record<string, string[]> = {
  vm: ['virtual', 'machine'],
  vms: ['virtual', 'machine'],
  vnet: ['virtual', 'network'],
  rbac: ['role', 'access', 'control'],
  sla: ['service', 'level', 'agreement'],
  az: ['availability', 'zone'],
  iaas: ['infrastructure', 'service'],
  paas: ['platform', 'service'],
  saas: ['software', 'service'],
  ad: ['entra', 'id'],
  aad: ['entra', 'id'],
  cost: ['price', 'pricing'],
  price: ['cost', 'pricing'],
};

const stem = (w: string) => {
  if (w.length > 5 && w.endsWith('ing')) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && w.endsWith('es') && !w.endsWith('ses')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  if (w.length > 4 && w.endsWith('ed')) return w.slice(0, -2);
  return w;
};

export const tokens = (s: string, expand = false) => {
  const out: string[] = [];
  for (const raw of s.toLowerCase().split(/[^a-z0-9]+/)) {
    if (!raw || STOP.has(raw)) continue;
    out.push(stem(raw));
    if (expand && SYN[raw]) out.push(...SYN[raw].map(stem));
  }
  return out;
};

interface Doc { e: AskEntry; q: string[]; a: string[] }
export interface Ranker { docs: Doc[]; df: Map<string, number>; avgQ: number; avgA: number }

export function makeRanker(entries: AskEntry[]): Ranker {
  const docs = entries.map((e) => ({ e, q: tokens(e.q), a: tokens(e.a) }));
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set([...d.q, ...d.a])) df.set(t, (df.get(t) ?? 0) + 1);
  const avg = (k: 'q' | 'a') => docs.reduce((n, d) => n + d[k].length, 0) / Math.max(1, docs.length);
  return { docs, df, avgQ: avg('q'), avgA: avg('a') };
}

const bm25 = (tf: number, len: number, avg: number, k1 = 1.2, b = 0.75) => (tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * len) / avg));

export interface Hit { e: AskEntry; score: number }

export function ask(r: Ranker, question: string, limit = 3): Hit[] {
  const qt = [...new Set(tokens(question, true))];
  if (!qt.length) return [];
  const comparing = /\b(vs|versus|difference|differ|compare|between)\b/i.test(question);
  const N = r.docs.length;
  const scored: Hit[] = [];
  for (const d of r.docs) {
    let s = 0;
    let matched = 0;
    for (const t of qt) {
      const n = r.df.get(t);
      if (!n) continue;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      const fq = d.q.filter((x) => x === t).length;
      const fa = d.a.filter((x) => x === t).length;
      if (fq || fa) matched++;
      s += idf * (2.2 * bm25(fq, d.q.length, r.avgQ) + bm25(fa, d.a.length, r.avgA));
    }
    if (!s) continue;
    s *= 0.5 + matched / qt.length; // reward covering more of the question
    if (comparing && d.e.k === 'Comparison') s *= 1.4;
    if (d.e.k === 'Lesson' || d.e.k === 'Glossary') s *= 1.1;
    scored.push({ e: d.e, score: s });
  }
  scored.sort((x, y) => y.score - x.score);
  const out: Hit[] = [];
  const seen = new Set<string>();
  for (const h of scored) {
    const key = h.e.a.slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(h);
    if (out.length === limit) break;
  }
  return out;
}
