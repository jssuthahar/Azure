/**
 * Learner progress, XP, streaks and badges, kept in this browser only
 * (no account, no backend). Every storage access is wrapped: storage can be
 * blocked (private mode, policies) and the site must keep working without it.
 */
const KEY = 'msdb-azure-progress-v1';

export interface QuizResult {
  score: number;
  total: number;
  at: string;
}
export interface MockResult {
  score: number;
  total: number;
  percent: number;
  scaled: number;
  mode: string;
  domains: Record<string, { ok: number; total: number }>;
  at: string;
}
export interface ProgressState {
  done: Record<string, string>;
  quizzes: Record<string, QuizResult>;
  mocks: MockResult[];
  interviewsPracticed: number;
  /* fun layer */
  xp: number;
  days: string[];
  games: Record<string, number>;
  gamesPlayed: number;
  daily: Record<string, number>;
  perfectSorts: number;
  detective: number;
  labs: Record<string, string>;
  /** Interactive lesson activities, keyed `<lessonKey>#<activityId>`. */
  activities: Record<string, QuizResult>;
  /** Lessons where every activity is done, with the date. */
  mastered: Record<string, string>;
}

const empty = (): ProgressState => ({
  done: {},
  quizzes: {},
  mocks: [],
  interviewsPracticed: 0,
  xp: 0,
  days: [],
  games: {},
  gamesPlayed: 0,
  daily: {},
  perfectSorts: 0,
  detective: 0,
  labs: {},
  activities: {},
  mastered: {},
});

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

function save(state: ProgressState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — progress just won't persist */
  }
  window.dispatchEvent(new CustomEvent('progress-change'));
}

/* ---------------- Levels ---------------- */
export const LEVELS = [
  { min: 0, name: 'Cloud Seed', icon: '🌱' },
  { min: 100, name: 'Cloud Explorer', icon: '🧭' },
  { min: 300, name: 'Cloud Builder', icon: '🧱' },
  { min: 700, name: 'Cloud Architect', icon: '📐' },
  { min: 1200, name: 'Cloud Champion', icon: '🏆' },
  { min: 2000, name: 'Azure Legend', icon: '👑' },
];
export function levelFor(xp: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].min) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  const pct = next ? Math.round(((xp - cur.min) / (next.min - cur.min)) * 100) : 100;
  return { ...cur, level: i + 1, next, pct };
}

/** Consecutive active days ending today (or yesterday, if today has no activity yet). */
export function streak(s: ProgressState): number {
  const set = new Set(s.days);
  const d = new Date();
  const key = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  if (!set.has(key(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(key(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Add XP to a state object (mutates), record today as active, and queue a toast. */
function grant(s: ProgressState, amount: number, reason: string) {
  if (amount <= 0) return;
  const before = levelFor(s.xp);
  s.xp += amount;
  const t = today();
  if (!s.days.includes(t)) s.days = [...s.days, t].slice(-400);
  const after = levelFor(s.xp);
  queueMicrotask(() =>
    window.dispatchEvent(
      new CustomEvent('xp-gain', { detail: { amount, reason, levelUp: after.level > before.level ? after : null } }),
    ),
  );
}

export function addXP(amount: number, reason: string) {
  const s = load();
  grant(s, amount, reason);
  save(s);
}

/* ---------------- Learning events ---------------- */
export function setDone(key: string, done = true) {
  const s = load();
  if (done) {
    if (!s.done[key]) grant(s, 50, 'Lesson completed');
    s.done[key] = new Date().toISOString();
  } else delete s.done[key];
  save(s);
}

export function saveQuiz(key: string, score: number, total: number) {
  const s = load();
  const prev = s.quizzes[key];
  const prevScore = prev ? prev.score : 0;
  if (score > prevScore) grant(s, (score - prevScore) * 10, 'Knowledge check');
  if (!prev || score / total >= prev.score / prev.total) s.quizzes[key] = { score, total, at: new Date().toISOString() };
  if (score / total >= 0.75 && !s.done[key]) {
    s.done[key] = new Date().toISOString();
    grant(s, 50, 'Lesson completed');
  }
  save(s);
}

export function saveMock(result: MockResult) {
  const s = load();
  s.mocks = [result, ...s.mocks].slice(0, 20);
  grant(s, result.score * 3, 'Mock exam');
  save(s);
}

export function countInterview() {
  const s = load();
  s.interviewsPracticed += 1;
  grant(s, 5, 'Interview practice');
  save(s);
}

/** Record a finished game round. Returns true when it is a new personal best. */
export function saveGame(game: string, score: number, xp: number, extra: { perfectSort?: boolean; detective?: number } = {}) {
  const s = load();
  const best = (s.games[game] ?? 0) < score;
  if (best) s.games[game] = score;
  s.gamesPlayed += 1;
  if (extra.perfectSort) s.perfectSorts += 1;
  if (extra.detective) s.detective += extra.detective;
  grant(s, xp, 'Game played');
  save(s);
  return best;
}

export function saveDaily(score: number) {
  const s = load();
  const t = today();
  const first = s.daily[t] === undefined;
  if (first || score > s.daily[t]) s.daily[t] = score;
  if (first) grant(s, 20 + score * 10, 'Daily challenge');
  save(s);
  return first;
}

/** Record a finished practice lab. Returns true the first time. */
export function saveLab(id: string) {
  const s = load();
  const first = !s.labs[id];
  if (first) {
    s.labs[id] = new Date().toISOString();
    grant(s, 60, 'Lab completed');
  } else grant(s, 10, 'Lab practised again');
  save(s);
  return first;
}

/**
 * Record a finished lesson activity. XP scales with the score and is only paid
 * for improvement, so replaying is free practice. When every activity in the
 * lesson is done, the lesson counts as mastered (bonus XP, once).
 */
export function saveActivity(lesson: string, id: string, score: number, total: number, xp: number, lessonIds: string[], title: string) {
  const s = load();
  const key = `${lesson}#${id}`;
  const prev = s.activities[key];
  const firstEver = Object.keys(s.activities).length === 0;
  const worth = (r?: QuizResult) => (r && r.total ? Math.round((xp * r.score) / r.total) : 0);
  const now: QuizResult = { score, total: Math.max(1, total), at: new Date().toISOString() };
  const gained = Math.max(0, worth(now) - worth(prev));
  if (gained) grant(s, gained, prev ? `Better score: ${title}` : firstEver ? 'Your first cloud challenge' : title);
  if (!prev || now.score / now.total >= prev.score / prev.total) s.activities[key] = now;
  let mastered = false;
  if (!s.mastered[lesson] && lessonIds.length > 0 && lessonIds.every((i) => s.activities[`${lesson}#${i}`])) {
    s.mastered[lesson] = now.at;
    grant(s, 50, 'Every activity in this lesson');
    mastered = true;
  }
  save(s);
  return { gained, first: !prev, firstEver, mastered };
}

export function reset() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('progress-change'));
}

/* ---------------- Badges ---------------- */
export interface Badge {
  id: string;
  icon: string;
  title: string;
  text: string;
  earned: boolean;
}

/** `moduleKeys` maps a module slug to the topic keys it contains (published only). */
export function badges(s: ProgressState, moduleKeys: Record<string, string[]>): Badge[] {
  const doneCount = Object.keys(s.done).length;
  const perfect = Object.values(s.quizzes).filter((q) => q.score === q.total).length;
  const bestMock = Math.max(0, ...s.mocks.map((m) => m.percent));
  const st = streak(s);
  const moduleDone = (slug: string) => {
    const keys = moduleKeys[slug] ?? [];
    return keys.length > 0 && keys.every((k) => s.done[k]);
  };
  return [
    { id: 'first-step', icon: '🌱', title: 'First Step', text: 'Complete your first lesson.', earned: doneCount >= 1 },
    { id: 'cloud-curious', icon: '☁️', title: 'Cloud Curious', text: 'Complete 5 lessons.', earned: doneCount >= 5 },
    { id: 'concepts-champion', icon: '🏆', title: 'Cloud Concepts Champion', text: 'Complete every Cloud Concepts lesson.', earned: moduleDone('cloud-concepts') },
    { id: 'quiz-whiz', icon: '🎯', title: 'Quiz Whiz', text: 'Score 100% on 5 knowledge checks.', earned: perfect >= 5 },
    { id: 'player-one', icon: '🎮', title: 'Player One', text: 'Play your first game.', earned: s.gamesPlayed >= 1 },
    { id: 'sort-master', icon: '🗂️', title: 'Sort Master', text: 'Finish a Sort It round with no mistakes.', earned: s.perfectSorts >= 1 },
    { id: 'lightning', icon: '⚡', title: 'Lightning Fast', text: 'Score 12 or more in the Lightning Round.', earned: (s.games['lightning'] ?? 0) >= 12 },
    { id: 'detective', icon: '🕵️', title: 'Cloud Detective', text: 'Solve 5 Who Am I? riddles on the first clue.', earned: s.detective >= 5 },
    { id: 'memory', icon: '🧠', title: 'Memory Master', text: 'Clear Match the Pairs in 12 moves or fewer.', earned: (s.games['match'] ?? 0) >= 88 },
    { id: 'cloud-explorer', icon: '🧩', title: 'Beginner Cloud Explorer', text: 'Finish your first interactive lesson activity.', earned: Object.keys(s.activities ?? {}).length >= 1 },
    { id: 'lesson-master', icon: '🎓', title: 'Lesson Master', text: 'Finish every interactive activity in a lesson.', earned: Object.keys(s.mastered ?? {}).length >= 1 },
    { id: 'hands-on', icon: '🧪', title: 'Hands-on Hero', text: 'Complete 3 simulator labs.', earned: Object.keys(s.labs).length >= 3 },
    { id: 'streak-3', icon: '🔥', title: 'On Fire', text: 'Learn 3 days in a row.', earned: st >= 3 },
    { id: 'streak-7', icon: '📅', title: 'Week Warrior', text: 'Learn 7 days in a row.', earned: st >= 7 },
    { id: 'mock-starter', icon: '⏱️', title: 'Under the Clock', text: 'Finish a timed mock exam.', earned: s.mocks.length >= 1 },
    { id: 'exam-ready', icon: '🚀', title: 'Exam Ready', text: 'Score 80% or more in a full mock exam.', earned: s.mocks.some((m) => m.mode === 'full' && m.percent >= 80) },
    { id: 'high-flyer', icon: '⭐', title: 'High Flyer', text: 'Score 90% or more in any mock exam.', earned: bestMock >= 90 },
    { id: 'interview-ready', icon: '🎤', title: 'Interview Ready', text: 'Practise 10 mock-interview questions.', earned: s.interviewsPracticed >= 10 },
    { id: 'legend', icon: '👑', title: 'Azure Legend', text: 'Reach 2,000 XP.', earned: s.xp >= 2000 },
  ];
}
