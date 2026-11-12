/**
 * Mock exam engine: builds a paper in the style of a Microsoft certification
 * exam (domain-weighted, mixed item types, a final no-going-back Yes/No
 * section), keeps responses, and scores them with partial credit on a
 * 1–1000 scale where 700 passes. All questions are original practice items.
 */
import type { FormatItem } from '../data/az-900/exam-items';

export interface ChoiceItem {
  kind: 'single' | 'multi'; id: string; domain: number; topic?: string; scenario?: string;
  question: string; options: { text: string; why: string }[]; answer: number[]; explanation: string;
}
export type Item = ChoiceItem | FormatItem;
export type Response = number[] | (boolean | null)[] | (number | null)[];
export interface Paper { mode: string; items: Item[]; section2Start: number; minutes: number }

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/**
 * Assemble a paper. Yes/No series go into a final section, as on the real exam.
 * `domainWeights` maps each exam area to its share of the exam (e.g. the
 * syllabus weight midpoints); values are normalised, so any scale works.
 */
export function buildPaper(mode: string, domain: number, choice: ChoiceItem[], formats: FormatItem[], domainWeights: Record<number, number>): Paper {
  const plan = mode === 'full' ? { total: 45, yesno: 6, formats: 12, minutes: 45 } : mode === 'quick' ? { total: 12, yesno: 2, formats: 3, minutes: 15 } : { total: 15, yesno: 2, formats: 4, minutes: 18 };
  const sum = Object.values(domainWeights).reduce((a, b) => a + b, 0) || 1;
  const weights: Record<number, number> = mode === 'domain' ? { [domain]: 1 } : Object.fromEntries(Object.entries(domainWeights).map(([d, w]) => [d, w / sum]));
  const doms = Object.keys(weights).map(Number);
  const share = (n: number) => { const out: Record<number, number> = {}; let left = n; doms.forEach((d, i) => { out[d] = i === doms.length - 1 ? left : Math.round(n * weights[d]); left -= out[d]; }); return out; };
  const take = <T extends { domain: number }>(pool: T[], per: Record<number, number>) => doms.flatMap((d) => shuffle(pool.filter((q) => q.domain === d)).slice(0, per[d]));
  const yn = take(formats.filter((f) => f.kind === 'yesno'), share(plan.yesno));
  const fm = take(formats.filter((f) => f.kind !== 'yesno'), share(plan.formats));
  const ch = take(choice, share(plan.total - yn.length - fm.length));
  // shuffle choice options once per paper
  const chShuffled = ch.map((q) => { const order = shuffle(q.options.map((_, i) => i)); return { ...q, options: order.map((i) => q.options[i]), answer: q.answer.map((a) => order.indexOf(a)) }; });
  const section1 = shuffle([...chShuffled, ...fm]);
  return { mode, items: [...section1, ...shuffle(yn)], section2Start: section1.length, minutes: plan.minutes };
}

export function emptyResponse(q: Item): Response {
  switch (q.kind) {
    case 'single': case 'multi': case 'order': return [];
    case 'yesno': return q.statements.map(() => null);
    case 'match': return q.targets.map(() => null);
    case 'dropdown': return q.parts.filter((p) => typeof p !== 'string').map(() => null);
  }
}

export function answered(q: Item, r: Response): 'all' | 'some' | 'none' {
  const filled = (r as unknown[]).filter((x) => x !== null && x !== undefined).length;
  if (q.kind === 'single') return filled ? 'all' : 'none';
  if (q.kind === 'multi') return filled >= q.answer.length ? 'all' : filled ? 'some' : 'none';
  if (q.kind === 'order') return filled >= q.answer.length ? 'all' : filled ? 'some' : 'none';
  const need = (r as unknown[]).length;
  return filled === need ? 'all' : filled ? 'some' : 'none';
}

/** Points available and earned. Multi-part items give one point per correct part. */
export function score(q: Item, r: Response): { earned: number; possible: number } {
  switch (q.kind) {
    case 'single': return { possible: 1, earned: (r as number[])[0] === q.answer[0] ? 1 : 0 };
    case 'multi': { const picks = r as number[]; const right = picks.filter((p) => q.answer.includes(p)).length; const wrong = picks.length - right; return { possible: q.answer.length, earned: Math.max(0, right - wrong) }; }
    case 'yesno': return { possible: q.statements.length, earned: q.statements.filter((s, i) => (r as (boolean | null)[])[i] === s.answer).length };
    case 'match': return { possible: q.targets.length, earned: q.targets.filter((t, i) => (r as (number | null)[])[i] === t.answer).length };
    case 'dropdown': { const blanks = q.parts.filter((p) => typeof p !== 'string') as { answer: number }[]; return { possible: blanks.length, earned: blanks.filter((b, i) => (r as (number | null)[])[i] === b.answer).length }; }
    case 'order': { const seq = r as number[]; return { possible: 1, earned: seq.length === q.answer.length && seq.every((x, i) => x === q.answer[i]) ? 1 : 0 }; }
  }
}

export function result(items: Item[], responses: Response[]) {
  let earned = 0, possible = 0;
  const domains: Record<string, { ok: number; total: number }> = {};
  items.forEach((q, i) => {
    const s = score(q, responses[i]);
    earned += s.earned; possible += s.possible;
    const k = String(q.domain);
    domains[k] ??= { ok: 0, total: 0 };
    domains[k].ok += s.earned; domains[k].total += s.possible;
  });
  const percent = Math.round((earned / Math.max(1, possible)) * 100);
  // Rough indication on Microsoft's 1–1000 reporting scale (passing mark 700).
  const scaled = Math.round(1 + (earned / Math.max(1, possible)) * 999);
  return { earned, possible, percent, scaled, domains, passed: scaled >= 700 };
}

export const KIND_LABEL: Record<Item['kind'], string> = {
  single: 'Multiple choice', multi: 'Multiple response', yesno: 'Yes / No series', match: 'Drag and drop', order: 'Build list (sequence)', dropdown: 'Drop-down (sentence completion)',
};
