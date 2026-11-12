/**
 * Interactive learning activities: the shared, exam-agnostic shapes.
 *
 * Each exam keeps its own activities in src/data/<exam>/activities.ts as
 * `Record<topicSlug, Activity[]>` and registers them in exams.ts. A lesson places
 * one with `<Activity id="…" />` in its MDX, right after the idea it practises.
 * The component looks the id up for the current exam and lesson, so the same
 * eight activity types work in every lesson of every exam.
 *
 * Progress and XP go through src/lib/progress.ts (browser only, no account).
 */

export interface Choice {
  text: string;
  /** Why this option is right or wrong. Shown after the learner picks. */
  why: string;
}

export interface ChoiceQuestion {
  /** Optional business context shown above the question. */
  scenario?: string;
  q: string;
  options: Choice[];
  answer: number;
  /** The exam idea this question connects to, shown as a chip after answering. */
  concept?: string;
}

interface Base {
  /** Unique within the lesson; becomes the anchor `#act-<id>`. */
  id: string;
  title: string;
  /** One or two sentences that set up the activity. */
  intro?: string;
  /** XP for a perfect first run. Defaults per kind (see ACTIVITY_KINDS). */
  xp?: number;
}

/** Predict before you learn: a real problem, a guess, then the reveal. */
export interface PredictActivity extends Base {
  kind: 'predict';
  scenario: string;
  question: string;
  options: Choice[];
  answer: number;
  /** What actually happens, and how the lesson's concept fixes it (light markdown: **bold**). */
  reveal: string;
  /** Optional animated picture: 'overload' shows requests hitting one server, then the cloud fix. */
  visual?: 'overload';
}

/** Sort cards into buckets by dragging, or by tapping a card and then a bucket. */
export interface SortActivity extends Base {
  kind: 'sort';
  buckets: { label: string; icon: string }[];
  items: { text: string; bucket: number; why: string }[];
}

/** Traffic simulator: fixed on-premises servers against cloud autoscale. All numbers are illustrative. */
export interface TrafficActivity extends Base {
  kind: 'traffic';
  scenario: string;
  /** Users one server can handle comfortably. */
  perServer: number;
  /** Servers the on-premises side bought up front. */
  onPremServers: number;
  /** Illustrative price per server per hour, in USD (shown in the learner's currency). */
  onPremServerHourUsd: number;
  cloudServerHourUsd: number;
  minUsers: number;
  maxUsers: number;
  /** Users per hour for the Start simulation run (one entry per simulated hour). */
  day: number[];
  /** Label for the simulated run, e.g. "Festival sale day". */
  dayLabel: string;
}

/** Click to explore: a small architecture diagram; each part explains itself and asks one question. */
export interface ExploreActivity extends Base {
  kind: 'explore';
  /** Where requests start (not clickable), e.g. users on the internet. Linked by its id. */
  entry: { id: string; icon: string; label: string };
  nodes: {
    id: string;
    icon: string;
    label: string;
    does: string;
    why: string;
    example: string;
    service: string;
    question: ChoiceQuestion;
  }[];
  /** Connections drawn between nodes, as [fromId, toId]. */
  links: [string, string][];
}

/** Match cards: one scenario at a time, pick the idea it shows. */
export interface MatchActivity extends Base {
  kind: 'match';
  pairs: { term: string; icon: string; meaning: string; scenario: string; why: string }[];
}

/** Short question sets: quick knowledge checks between ideas, or real-world problem scenarios. */
export interface QuizActivity extends Base {
  kind: 'quiz';
  style: 'check' | 'scenario';
  questions: ChoiceQuestion[];
}

/** Timed revision game with a countdown per question. */
export interface ChallengeActivity extends Base {
  kind: 'challenge';
  seconds: number;
  questions: ChoiceQuestion[];
}

/** Final mission: the learner writes a plan, then compares it with a model answer. */
export interface MissionActivity extends Base {
  kind: 'mission';
  brief: string;
  tasks: { prompt: string; model: string; points: string[] }[];
}

export type Activity =
  | PredictActivity
  | SortActivity
  | TrafficActivity
  | ExploreActivity
  | MatchActivity
  | QuizActivity
  | ChallengeActivity
  | MissionActivity;

export type ActivityKind = Activity['kind'];

/** Label, icon and default XP for each kind. */
export const ACTIVITY_KINDS: Record<ActivityKind, { label: string; icon: string; xp: number }> = {
  predict: { label: 'Predict before you learn', icon: '🔮', xp: 15 },
  sort: { label: 'Drag and drop challenge', icon: '🗂️', xp: 25 },
  traffic: { label: 'What happens if? simulator', icon: '📈', xp: 25 },
  explore: { label: 'Click to explore', icon: '🧭', xp: 25 },
  match: { label: 'Match the cards', icon: '🃏', xp: 30 },
  quiz: { label: 'Quick check', icon: '✅', xp: 10 },
  challenge: { label: 'Timed challenge', icon: '⏱️', xp: 40 },
  mission: { label: 'Final mission', icon: '🚀', xp: 40 },
};

export const kindLabel = (a: Activity) => (a.kind === 'quiz' && a.style === 'scenario' ? 'Real-world problem' : ACTIVITY_KINDS[a.kind].label);
export const kindIcon = (a: Activity) => (a.kind === 'quiz' && a.style === 'scenario' ? '🧩' : ACTIVITY_KINDS[a.kind].icon);
export const activityXp = (a: Activity) => a.xp ?? (a.kind === 'quiz' ? ACTIVITY_KINDS.quiz.xp * a.questions.length : ACTIVITY_KINDS[a.kind].xp);

/** All activities of one lesson. `master` names the celebration when every activity is done. */
export interface LessonActivities {
  /** e.g. 'Cloud Computing Master'. */
  master: string;
  activities: Activity[];
}
