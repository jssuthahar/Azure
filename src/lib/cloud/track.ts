/**
 * Anonymous usage counts. No cookies, no IDs, nothing about the learner:
 * each event adds 1 to a per-day counter and a running total in Firestore
 * (`stats/<YYYY-MM-DD>__<event>` and `stats/total__<event>`, field `n`).
 * firestore.rules only allows a counter to go up by exactly 1.
 *
 * Skipped when the browser sends Do Not Track or Global Privacy Control,
 * and everywhere except the live site (so dev, previews and QA never count).
 */
import { COUNT_HOSTS } from '../../config';

export const EVENTS = ['learner', 'visit', 'lesson', 'quiz', 'mock', 'lab', 'signin'] as const;
export type CountEvent = (typeof EVENTS)[number];

const SEEN = 'msdb-seen';

function allowed() {
  try {
    const n = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (n.globalPrivacyControl || n.doNotTrack === '1') return false;
    return (COUNT_HOSTS as readonly string[]).includes(location.hostname);
  } catch {
    return false;
  }
}

const day = () => new Date().toISOString().slice(0, 10);
const queue = new Set<CountEvent>();
let timer = 0;

async function flush() {
  const evs = [...queue];
  queue.clear();
  if (!evs.length) return;
  try {
    const [{ doc, increment, writeBatch }, { db }] = await Promise.all([import('firebase/firestore/lite'), import('./firebase')]);
    const d = await db();
    const b = writeBatch(d);
    const today = day();
    for (const ev of evs) {
      b.set(doc(d, 'stats', `${today}__${ev}`), { n: increment(1) }, { merge: true });
      b.set(doc(d, 'stats', `total__${ev}`), { n: increment(1) }, { merge: true });
    }
    await b.commit();
  } catch {
    /* offline or blocked: a missed count is fine */
  }
}

/** Count one event. Cheap to call: batches for a moment, then sends in the background. */
export function track(ev: CountEvent) {
  if (typeof window === 'undefined' || !allowed()) return;
  queue.add(ev);
  clearTimeout(timer);
  timer = window.setTimeout(() => {
    const run = () => void flush();
    'requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 4000 }) : run();
  }, 1500);
}

/** Once per browser per day: a visit. Once per browser ever: a learner. */
export function trackVisit() {
  if (typeof window === 'undefined' || !allowed()) return;
  try {
    const seen = JSON.parse(localStorage.getItem(SEEN) || '{}') as { day?: string; learner?: boolean };
    if (!seen.learner) track('learner');
    if (seen.day !== day()) track('visit');
    localStorage.setItem(SEEN, JSON.stringify({ day: day(), learner: true }));
  } catch {
    /* storage blocked: don't count, or we'd count every page */
  }
}
