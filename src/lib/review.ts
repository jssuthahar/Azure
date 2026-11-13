/**
 * Spaced repetition and exam readiness, kept in this browser only.
 *
 * Every answered practice question (lesson quiz, mock exam, smart practice)
 * becomes a card in a Leitner box. A right answer moves it up a box and pushes
 * the next review further out; a wrong one sends it back to box 0, due today.
 * Readiness blends how well the learner knows each exam area's questions with
 * their recent mock exam results, weighted like the real exam.
 */
import { today, type MockResult } from './progress';

const KEY = 'msdb-azure-review-v1';
/** Days until the next review for each box. */
export const INTERVALS = [0, 1, 3, 7, 14, 30];
export const TOP_BOX = INTERVALS.length - 1;

export interface Card {
  box: number;
  due: string;
  seen: number;
  wrong: number;
  /** Was the latest answer right? */
  ok: boolean;
  last: string;
}
export type Deck = Record<string, Card>;

/** Card key: the exam and the question id, so exams never share cards. */
export const cardKey = (cert: string, id: string) => `${cert}:${id}`;

export function loadDeck(): Deck {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Deck) : {};
  } catch {
    return {};
  }
}

function saveDeck(d: Deck) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* storage blocked: practice still works, it just won't be remembered */
  }
  window.dispatchEvent(new CustomEvent('review-change'));
}

const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function step(card: Card | undefined, ok: boolean): Card {
  const t = today();
  const prev = card ?? { box: 0, due: t, seen: 0, wrong: 0, ok: false, last: t };
  // A first-time right answer starts at box 1, not box 2: one lucky guess isn't mastery.
  const box = ok ? Math.min(TOP_BOX, card ? prev.box + 1 : 1) : 0;
  return { box, due: addDays(t, INTERVALS[box]), seen: prev.seen + 1, wrong: prev.wrong + (ok ? 0 : 1), ok, last: t };
}

/** Record answers for one exam. Each result is a question id and whether it was right. */
export function recordAnswers(cert: string, results: { id: string; ok: boolean }[]) {
  if (!results.length) return;
  const d = loadDeck();
  for (const r of results) d[cardKey(cert, r.id)] = step(d[cardKey(cert, r.id)], r.ok);
  saveDeck(d);
}

export function resetDeck(cert: string) {
  const d = loadDeck();
  for (const k of Object.keys(d)) if (k.startsWith(`${cert}:`)) delete d[k];
  saveDeck(d);
}

/* ---------------- readiness ---------------- */

export interface QMeta { id: string; domain: number; topic?: string }

/** 0..1: how well one question is known. Unseen counts as 0. */
export function strength(c?: Card): number {
  if (!c) return 0;
  if (!c.ok) return 0.15;
  return Math.min(1, 0.5 + 0.1 * c.box);
}

export interface DomainReadiness { domain: number; percent: number; seen: number; total: number; mock: number | null }
export interface Readiness {
  percent: number;
  label: string;
  tone: 'bad' | 'warn' | 'ok';
  domains: DomainReadiness[];
  answered: number;
  due: number;
}

export function readinessLabel(p: number): { label: string; tone: Readiness['tone'] } {
  if (p >= 85) return { label: 'Exam ready', tone: 'ok' };
  if (p >= 70) return { label: 'Nearly ready', tone: 'ok' };
  if (p >= 50) return { label: 'Getting there', tone: 'warn' };
  return { label: 'Not ready yet', tone: 'bad' };
}

/**
 * Readiness per exam area and overall. Question strength is averaged over the
 * whole bank, so unseen questions pull the score down; once the learner has
 * mock exams, the average of the latest three counts for half of each area.
 */
export function readiness(cert: string, bank: QMeta[], weights: Record<number, number>, mocks: MockResult[]): Readiness {
  const deck = loadDeck();
  const recent = mocks.slice(0, 3);
  const t = today();
  const domains = Object.keys(weights).map(Number).sort((a, b) => a - b).map((domain) => {
    const qs = bank.filter((q) => q.domain === domain);
    const cards = qs.map((q) => deck[cardKey(cert, q.id)]);
    const known = qs.length ? cards.reduce((s, c) => s + strength(c), 0) / qs.length : 0;
    const m = recent.map((r) => r.domains[String(domain)]).filter((x): x is { ok: number; total: number } => !!x && x.total > 0);
    const mock = m.length ? m.reduce((s, x) => s + x.ok / x.total, 0) / m.length : null;
    const blended = mock === null ? known : known * 0.5 + mock * 0.5;
    return { domain, percent: Math.round(blended * 100), seen: cards.filter(Boolean).length, total: qs.length, mock: mock === null ? null : Math.round(mock * 100) };
  });
  const wsum = domains.reduce((s, d) => s + (weights[d.domain] ?? 0), 0) || 1;
  const percent = Math.round(domains.reduce((s, d) => s + d.percent * (weights[d.domain] ?? 0), 0) / wsum);
  const mine = Object.entries(deck).filter(([k]) => k.startsWith(`${cert}:`));
  return {
    percent,
    ...readinessLabel(percent),
    domains,
    answered: mine.length,
    due: mine.filter(([, c]) => c.due <= t).length,
  };
}

export interface TopicStat { topic: string; seen: number; total: number; accuracy: number | null }

/** Per-topic accuracy on the latest answer of every seen question. */
export function topicStats(cert: string, bank: QMeta[]): TopicStat[] {
  const deck = loadDeck();
  const by = new Map<string, TopicStat & { right: number }>();
  for (const q of bank) {
    if (!q.topic) continue;
    const s = by.get(q.topic) ?? { topic: q.topic, seen: 0, total: 0, accuracy: null, right: 0 };
    s.total++;
    const c = deck[cardKey(cert, q.id)];
    if (c) { s.seen++; if (c.ok) s.right++; }
    by.set(q.topic, s);
  }
  return [...by.values()].map(({ right, ...s }) => ({ ...s, accuracy: s.seen ? right / s.seen : null }));
}

/* ---------------- building a practice session ---------------- */

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

export type PracticeMode = 'smart' | 'mistakes' | 'new' | `domain-${number}`;

/**
 * Pick question ids for a session.
 *  smart     due reviews first (lowest box first), then unseen questions from the weakest areas, then anything
 *  mistakes  only questions whose latest answer was wrong
 *  new       only questions never answered
 *  domain-N  smart order, limited to one exam area
 */
export function buildSession(cert: string, bank: QMeta[], mode: PracticeMode, size: number, weak: number[] = []): string[] {
  const deck = loadDeck();
  const t = today();
  const card = (q: QMeta) => deck[cardKey(cert, q.id)];
  let pool = bank;
  if (mode.startsWith('domain-')) pool = bank.filter((q) => q.domain === Number(mode.slice(7)));
  if (mode === 'mistakes') return shuffle(pool.filter((q) => card(q) && !card(q)!.ok)).slice(0, size).map((q) => q.id);
  if (mode === 'new') return shuffle(pool.filter((q) => !card(q))).slice(0, size).map((q) => q.id);

  const due = shuffle(pool.filter((q) => card(q) && card(q)!.due <= t)).sort((a, b) => card(a)!.box - card(b)!.box);
  const unseen = shuffle(pool.filter((q) => !card(q)));
  const rank = (d: number) => { const i = weak.indexOf(d); return i === -1 ? weak.length : i; };
  unseen.sort((a, b) => rank(a.domain) - rank(b.domain));
  const rest = shuffle(pool.filter((q) => card(q) && card(q)!.due > t)).sort((a, b) => card(a)!.box - card(b)!.box);
  // Keep at least a third of the session new, so reviews never crowd out progress.
  const fresh = Math.ceil(size / 3);
  const picked = [...due.slice(0, size - Math.min(fresh, unseen.length)), ...unseen];
  return [...new Set([...picked, ...rest].map((q) => q.id))].slice(0, size);
}
