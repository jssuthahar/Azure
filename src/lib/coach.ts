/**
 * Nimbus Coach: one focus exam at a time. Learners can still open any page;
 * the coach only nudges them back (or helps them switch on purpose) and
 * suggests the next exam once the focus exam is done.
 *
 * State lives in this browser, inside the study-plan store under `_coach`
 * (msdb-azure-plan-v1). That store already syncs for signed-in learners, so
 * the coach follows them across devices without a Firestore rules change.
 * cloud/sync.ts merges `_coach` by its `updated` time.
 */
import { load as loadProgress, today, type ProgressState } from './progress';
import { loadPlan, buildSchedule, daysBetween, type PlanItem, type PlanLesson } from './plan';

const PLAN_KEY = 'msdb-azure-plan-v1';
const SESSION_KEY = 'msdb-coach-session';

export interface CoachState {
  /** Exam slug the learner is working on now. */
  focus: string | null;
  /** Date the current focus was set. */
  since?: string;
  /** Exams put on hold, newest first. Progress is kept; parking only changes what the coach suggests. */
  parked: { slug: string; at: string }[];
  /** Exams the learner said they passed, with the date. */
  passed: Record<string, string>;
  /** "You're ready" card shown for these exams. */
  celebrated: Record<string, string>;
  /** "How did the exam go?" asked for these exams. */
  asked: Record<string, string>;
  /** First-visit welcome: snoozed until this time (ms), or never again. */
  snooze?: number;
  never?: boolean;
  /** Last date the daily "welcome back" card was shown. */
  greeted?: string;
  updated: number;
}

export interface CoachExam { slug: string; code: string; name: string; lessons: PlanLesson[]; next: { slug: string; why: string }[] }
export interface CoachData { primary: string; exams: CoachExam[] }

const empty = (): CoachState => ({ focus: null, parked: [], passed: {}, celebrated: {}, asked: {}, updated: 0 });

export function loadCoach(): CoachState {
  try {
    const all = JSON.parse(localStorage.getItem(PLAN_KEY) || '{}');
    return { ...empty(), ...(all._coach ?? {}) };
  } catch {
    return empty();
  }
}

export function saveCoach(s: CoachState) {
  s.updated = Date.now();
  try {
    const all = JSON.parse(localStorage.getItem(PLAN_KEY) || '{}');
    all._coach = s;
    localStorage.setItem(PLAN_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent('msdb-data-change'));
  } catch {
    /* storage blocked: the coach still works for this page view */
  }
  window.dispatchEvent(new CustomEvent('coach-change'));
}

/** Make `slug` the focus exam. The old focus is parked, never reset. */
export function setFocus(s: CoachState, slug: string) {
  if (s.focus === slug) return;
  if (s.focus && !s.passed[s.focus]) s.parked = [{ slug: s.focus, at: today() }, ...s.parked.filter((p) => p.slug !== s.focus)].slice(0, 10);
  s.parked = s.parked.filter((p) => p.slug !== slug);
  s.focus = slug;
  s.since = today();
}

/* ---------------- session (this tab only) ---------------- */
interface SessionState { looking: string[]; shown: string[] }
export function session(): SessionState {
  try { return { looking: [], shown: [], ...JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}') }; } catch { return { looking: [], shown: [] }; }
}
export function saveSession(s: SessionState) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

/* ---------------- progress per exam ---------------- */
export function lessonsDone(exam: CoachExam, p: ProgressState = loadProgress()) {
  return exam.lessons.filter((l) => p.done[l.key]).length;
}
export function percentDone(exam: CoachExam, p: ProgressState = loadProgress()) {
  return exam.lessons.length ? Math.round((lessonsDone(exam, p) / exam.lessons.length) * 100) : 0;
}
/** Best full mock exam score for this exam (older results without `exam` belong to the primary exam). */
export function bestFullMock(exam: CoachExam, primary: string, p: ProgressState = loadProgress()) {
  return Math.max(0, ...p.mocks.filter((m) => m.mode === 'full' && (m.exam ?? primary) === exam.slug).map((m) => m.percent));
}
/** Ready = every lesson done, or 80%+ in a full mock exam. */
export function isReady(exam: CoachExam, primary: string, p: ProgressState = loadProgress()) {
  return (exam.lessons.length > 0 && lessonsDone(exam, p) === exam.lessons.length) || bestFullMock(exam, primary, p) >= 80;
}

/** The one thing to do next for an exam: today's plan item, else the first unfinished lesson. */
export function nextTask(exam: CoachExam, p: ProgressState = loadProgress()): PlanItem {
  const base = `/${exam.slug}/`;
  const plan = loadPlan(exam.slug);
  if (plan && plan.examDate >= today()) {
    const done = new Set(Object.keys(p.done));
    const day = buildSchedule(plan, exam.lessons, done, base).days.find((d) => d.date === today());
    const item = day?.items.find((it) => (it.kind === 'lesson' ? !done.has(it.key!) : it.kind !== 'exam' && !plan.checked[`${day.date}|${it.kind}`]));
    if (item) return item;
  }
  const l = exam.lessons.find((x) => !p.done[x.key]);
  if (l) return { kind: 'lesson', title: l.title, url: l.url, minutes: l.minutes + 10, key: l.key };
  return { kind: 'mock', title: 'Full mock exam, then read every explanation', url: `${base}mock-exam/`, minutes: 60 };
}

export const daysTo = (date: string) => daysBetween(today(), date);
