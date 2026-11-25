/**
 * Progress sync for signed-in learners. The browser stays the source of truth
 * while studying (everything works offline); this mirrors it to
 * Firestore `users/<uid>` so a second device picks up where the first stopped.
 *
 * On sign-in the local and cloud copies are MERGED, never overwritten:
 * completed lessons are united, best scores kept, the newer review card wins,
 * the better certificate wins. After that, every change is pushed a moment later.
 */
import type { User } from 'firebase/auth';
import type { ProgressState, QuizResult, MockResult } from '../progress';
import type { Deck } from '../review';
import type { Cert } from '../certificate';
import { mergeNotes, type NotesState } from '../notes';
import { db } from './firebase';

/** What gets synced: name in the cloud doc → localStorage key. */
const KEYS = {
  progress: 'msdb-azure-progress-v1',
  review: 'msdb-azure-review-v1',
  plan: 'msdb-azure-plan-v1',
  cert: 'msdb-azure-cert-v1',
  notes: 'msdb-azure-notes-v1',
} as const;
type Name = keyof typeof KEYS;

const parse = <T>(s: string | null | undefined): T | null => { try { return s ? (JSON.parse(s) as T) : null; } catch { return null; } };
const readLocal = (k: Name) => { try { return localStorage.getItem(KEYS[k]); } catch { return null; } };
const writeLocal = (k: Name, v: string) => { try { localStorage.setItem(KEYS[k], v); } catch { /* blocked */ } };

/* ---------------- merges ---------------- */
const ratio = (q?: QuizResult) => (q && q.total ? q.score / q.total : -1);
const pickBest = (a: Record<string, QuizResult> = {}, b: Record<string, QuizResult> = {}) => {
  const out = { ...b };
  for (const [k, v] of Object.entries(a)) if (ratio(v) >= ratio(out[k])) out[k] = v;
  return out;
};
const maxEach = (a: Record<string, number> = {}, b: Record<string, number> = {}) => {
  const out = { ...b };
  for (const [k, v] of Object.entries(a)) out[k] = Math.max(v, out[k] ?? -Infinity);
  return out;
};
const earliest = (a: Record<string, string> = {}, b: Record<string, string> = {}) => {
  const out = { ...b };
  for (const [k, v] of Object.entries(a)) out[k] = !out[k] || v < out[k] ? v : out[k];
  return out;
};

export function mergeProgress(a: ProgressState, b: ProgressState): ProgressState {
  const mocks = new Map<string, MockResult>();
  for (const m of [...(a.mocks ?? []), ...(b.mocks ?? [])]) mocks.set(m.at, m);
  return {
    ...b,
    ...a,
    done: earliest(a.done, b.done),
    quizzes: pickBest(a.quizzes, b.quizzes),
    activities: pickBest(a.activities, b.activities),
    mocks: [...mocks.values()].sort((x, y) => (x.at < y.at ? 1 : -1)).slice(0, 20),
    labs: earliest(a.labs, b.labs),
    mastered: earliest(a.mastered, b.mastered),
    games: maxEach(a.games, b.games),
    daily: maxEach(a.daily, b.daily),
    days: [...new Set([...(a.days ?? []), ...(b.days ?? [])])].sort(),
    // Counters can't be added without double counting, so keep the higher one.
    xp: Math.max(a.xp ?? 0, b.xp ?? 0),
    interviewsPracticed: Math.max(a.interviewsPracticed ?? 0, b.interviewsPracticed ?? 0),
    gamesPlayed: Math.max(a.gamesPlayed ?? 0, b.gamesPlayed ?? 0),
    perfectSorts: Math.max(a.perfectSorts ?? 0, b.perfectSorts ?? 0),
    detective: Math.max(a.detective ?? 0, b.detective ?? 0),
  };
}

export function mergeDeck(a: Deck, b: Deck): Deck {
  const out = { ...b };
  for (const [k, c] of Object.entries(a)) {
    const o = out[k];
    if (!o || c.last > o.last || (c.last === o.last && c.seen >= o.seen)) out[k] = c;
  }
  return out;
}

/** Plans per exam: this device wins. `_coach` (Nimbus Coach, see coach.ts): the newer copy wins. */
const mergePlan = (a: Record<string, any>, b: Record<string, any>) => {
  const out = { ...b, ...a };
  if (a._coach && b._coach) out._coach = (b._coach.updated ?? 0) > (a._coach.updated ?? 0) ? b._coach : a._coach;
  return out;
};
const mergeCert = (a: Cert, b: Cert) => (b.scaled > a.scaled ? b : a);

function merge(k: Name, local: string | null, remote: string | null): string | null {
  const a = parse<any>(local), b = parse<any>(remote);
  if (!a) return remote;
  if (!b) return local;
  const m = k === 'progress' ? mergeProgress(a, b) : k === 'review' ? mergeDeck(a, b) : k === 'plan' ? mergePlan(a, b) : k === 'notes' ? mergeNotes(a as NotesState, b as NotesState) : mergeCert(a, b);
  return JSON.stringify(m);
}

/* ---------------- cloud ---------------- */
// Set when the deployed security rules don't accept `notes` yet: the rest keeps syncing.
let skipNotes = false;
const snapshot = () => {
  const v: Partial<Record<Name, string>> = {};
  for (const k of Object.keys(KEYS) as Name[]) { if (k === 'notes' && skipNotes) continue; const s = readLocal(k); if (s) v[k] = s; }
  return v;
};

async function push(uid: string) {
  const [{ doc, setDoc, serverTimestamp }, d] = await Promise.all([import('firebase/firestore/lite'), db()]);
  try {
    await setDoc(doc(d, 'users', uid), { v: snapshot(), updatedAt: serverTimestamp() });
  } catch (err) {
    if (skipNotes || (err as { code?: string })?.code !== 'permission-denied' || !readLocal('notes')) throw err;
    skipNotes = true;
    await setDoc(doc(d, 'users', uid), { v: snapshot(), updatedAt: serverTimestamp() });
  }
  lastSync = new Date();
  window.dispatchEvent(new CustomEvent('msdb-sync', { detail: { state: 'synced', at: lastSync } }));
}

let lastSync: Date | null = null;
let stop: ((flush: boolean) => void) | null = null;

/** Merge local and cloud, then keep pushing changes until stopSync(). */
export async function startSync(user: User) {
  stopSync();
  window.dispatchEvent(new CustomEvent('msdb-sync', { detail: { state: 'syncing' } }));
  try {
    const [{ doc, getDoc }, d] = await Promise.all([import('firebase/firestore/lite'), db()]);
    const snap = await getDoc(doc(d, 'users', user.uid));
    const remote = (snap.exists() ? (snap.data().v as Partial<Record<Name, string>>) : {}) ?? {};
    let changed = false;
    for (const k of Object.keys(KEYS) as Name[]) {
      const local = readLocal(k);
      const m = merge(k, local, remote[k] ?? null);
      if (m && m !== local) { writeLocal(k, m); changed = true; }
    }
    await push(user.uid);
    if (changed) {
      for (const e of ['progress-change', 'review-change', 'plan-change', 'notes-change']) window.dispatchEvent(new CustomEvent(e));
      window.dispatchEvent(new CustomEvent('msdb-sync', { detail: { state: 'merged', at: lastSync } }));
    }
  } catch (err) {
    window.dispatchEvent(new CustomEvent('msdb-sync', { detail: { state: 'error', error: String(err) } }));
    return;
  }

  let t = 0, dirty = false;
  const later = () => { dirty = true; clearTimeout(t); t = window.setTimeout(now, 2000); };
  const now = () => { if (!dirty) return; dirty = false; push(user.uid).catch(() => { dirty = true; }); };
  const hidden = () => { if (document.visibilityState === 'hidden') now(); };
  const evs = ['progress-change', 'review-change', 'msdb-data-change'];
  evs.forEach((e) => window.addEventListener(e, later));
  document.addEventListener('visibilitychange', hidden);
  window.addEventListener('online', now);
  stop = (flush) => {
    if (flush) now();
    clearTimeout(t);
    evs.forEach((e) => window.removeEventListener(e, later));
    document.removeEventListener('visibilitychange', hidden);
    window.removeEventListener('online', now);
  };
}

/** Stop pushing. flush=false drops a pending push (used before deleting the cloud copy). */
export function stopSync(flush = true) { stop?.(flush); stop = null; }
export const lastSynced = () => lastSync;
