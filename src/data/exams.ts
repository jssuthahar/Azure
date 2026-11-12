/**
 * Exam registry for content. Every live exam plugs the same set of data into
 * the shared engines (lesson flow, simulators, mock exam, certificate, SEO).
 *
 * Adding an exam:
 *   1. set its entry in certifications.ts to status 'active' (after checking Microsoft Learn)
 *   2. create src/data/<exam>/ with the same files as az-900/
 *   3. register it in EXAMS below
 *   4. add lessons in src/content/tutorials/<exam>/ and questions in src/content/questions/<exam>/
 */
import { CERTIFICATIONS, type Certification } from './certifications';
import type { SyllabusModule, ExamFacts } from './types';
import * as az900 from './az-900/syllabus';
import { LESSON_SIMS as az900Sims, type LessonSims } from './az-900/lesson-sims';
import { COMPARISONS as az900Compare, type Comparison } from './az-900/compare';
import { WHATIFS as az900WhatIfs, type WhatIf } from './az-900/whatifs';
import { EXAM_ITEMS as az900Items, type FormatItem } from './az-900/exam-items';
import { VISUALS as az900Visuals, type LessonVisual } from './az-900/visuals';
import { PROBLEM_SOLUTION as az900Problems, type ProblemSolution } from './az-900/problem-solution';
import { ACTIVITIES as az900Activities } from './az-900/activities';
import type { LessonActivities } from './activities';
import { SORT_SETS as az900Sort, RIDDLES as az900Riddles, type SortSet, type Riddle } from './az-900/games';

export interface Exam {
  /** URL segment and content folder, e.g. 'az-900'. */
  slug: string;
  /** Display code, e.g. 'AZ-900'. */
  code: string;
  /** Official name, e.g. 'Microsoft Azure Fundamentals'. */
  name: string;
  info: Certification;
  /** Accent colour for this exam's badge and highlights. */
  accent: string;
  modules: SyllabusModule[];
  skillsMeasuredAsOf: string;
  syllabusVerifiedOn: string;
  studyGuideUrl: string;
  /** Microsoft Learn instructor-led course page (hands-on exercises). */
  courseUrl: string;
  facts: ExamFacts;
  lessonSims: Record<string, LessonSims>;
  comparisons: Comparison[];
  whatIfs: WhatIf[];
  examItems: FormatItem[];
  visuals: Record<string, LessonVisual>;
  problems: Record<string, ProblemSolution>;
  games: { sortSets: SortSet[]; riddles: Riddle[] };
  /** Interactive lesson activities, keyed by topic slug (see src/data/activities.ts). */
  activities: Record<string, LessonActivities>;
}

const info = (slug: string) => {
  const c = CERTIFICATIONS.find((x) => x.slug === slug);
  if (!c) throw new Error(`exams.ts: "${slug}" is not in certifications.ts`);
  return c;
};

const EXAMS: Record<string, Exam> = {
  'az-900': {
    slug: 'az-900',
    code: 'AZ-900',
    name: info('az-900').name,
    info: info('az-900'),
    accent: '#0078d4',
    modules: az900.MODULES,
    skillsMeasuredAsOf: az900.SKILLS_MEASURED_AS_OF,
    syllabusVerifiedOn: az900.SYLLABUS_VERIFIED_ON,
    studyGuideUrl: az900.STUDY_GUIDE_URL,
    courseUrl: 'https://learn.microsoft.com/en-us/training/courses/az-900t00',
    facts: az900.EXAM_FACTS,
    lessonSims: az900Sims,
    comparisons: az900Compare,
    whatIfs: az900WhatIfs,
    examItems: az900Items,
    visuals: az900Visuals,
    problems: az900Problems,
    games: { sortSets: az900Sort, riddles: az900Riddles },
    activities: az900Activities,
  },
};

/** The exam used when a page is not inside an exam (home, simulator, certificate…). */
export const PRIMARY_EXAM = 'az-900';

/** Exams that are both registered here and 'active' in certifications.ts. */
export const liveExams = (): Exam[] => CERTIFICATIONS.filter((c) => c.status === 'active' && EXAMS[c.slug]).map((c) => EXAMS[c.slug]);

export function getExam(slug: string | undefined = PRIMARY_EXAM): Exam {
  const e = EXAMS[slug ?? PRIMARY_EXAM];
  if (!e) throw new Error(`Unknown exam "${slug}". Registered: ${Object.keys(EXAMS).join(', ')}`);
  return e;
}

/** getStaticPaths for pages that exist once per live exam. */
export const examStaticPaths = () => liveExams().map((e) => ({ params: { cert: e.slug } }));

/** The exam a URL belongs to (first path segment), or the primary exam. */
export function examFromPath(pathname: string): Exam {
  const seg = pathname.split('/')[1];
  return liveExams().find((e) => e.slug === seg) ?? getExam(PRIMARY_EXAM);
}

/** Module lookups that used to live in each syllabus file. */
export const moduleBySlug = (exam: Exam, slug: string) => exam.modules.find((m) => m.slug === slug);
export const objectiveText = (exam: Exam, id: string) => exam.modules.flatMap((m) => m.groups.flatMap((g) => g.objectives)).find((o) => o.id === id)?.text ?? id;
