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
import type { SyllabusModule, ExamFacts, CourseInfo } from './types';
import { COURSE as az900Course } from './az-900/course';
import { SIMS3D as az900Sims3d, type Sim3D } from './az-900/sims3d';
import { TOURS as az900Tours } from './az-900/portal-tours';
import type { Tour } from '../lib/portal-tour';
import { EMBED_LESSON_3D as az900Embed3d } from './az-900/embeds';
import * as az900 from './az-900/syllabus';
import { LESSON_SIMS as az900Sims, type LessonSims } from './az-900/lesson-sims';
import { COMPARISONS as az900Compare, type Comparison } from './az-900/compare';
import { WHATIFS as az900WhatIfs, type WhatIf } from './az-900/whatifs';
import { EXAM_ITEMS as az900Items, type FormatItem } from './az-900/exam-items';
import { VISUALS as az900Visuals, type LessonVisual } from './az-900/visuals';
import { PROBLEM_SOLUTION as az900Problems, type ProblemSolution } from './az-900/problem-solution';
import { ACTIVITIES as az900Activities } from './az-900/activities';
import type { LessonActivities } from './activities';
import { SERVICES as az900Services, type Service } from './az-900/services';
import { SORT_SETS as az900Sort, RIDDLES as az900Riddles, type SortSet, type Riddle } from './az-900/games';
import * as ai901 from './ai-901/syllabus';
import { COURSE as ai901Course } from './ai-901/course';
import { SIMS3D_AI as ai901Sims3d } from './ai-901/sims3d';
import { TOURS_AI as ai901Tours } from './ai-901/portal-tours';
import { EMBED_LESSON_3D as ai901Embed3d } from './ai-901/embeds';
import { LESSON_SIMS as ai901Sims } from './ai-901/lesson-sims';
import { COMPARISONS as ai901Compare } from './ai-901/compare';
import { EXAM_ITEMS as ai901Items } from './ai-901/exam-items';
import { PROBLEM_SOLUTION as ai901Problems } from './ai-901/problem-solution';
import { SERVICES as ai901Services } from './ai-901/services';
import { SORT_SETS as ai901Sort, RIDDLES as ai901Riddles } from './ai-901/games';
import * as ai200 from './ai-200/syllabus';
import { COURSE as ai200Course } from './ai-200/course';
import { SIMS3D_DEV as ai200Sims3d } from './ai-200/sims3d';
import { TOURS_DEV as ai200Tours } from './ai-200/portal-tours';
import { EMBED_LESSON_3D as ai200Embed3d } from './ai-200/embeds';
import { LESSON_SIMS as ai200Sims } from './ai-200/lesson-sims';
import { COMPARISONS as ai200Compare } from './ai-200/compare';
import { EXAM_ITEMS as ai200Items } from './ai-200/exam-items';
import { PROBLEM_SOLUTION as ai200Problems } from './ai-200/problem-solution';
import { SERVICES as ai200Services } from './ai-200/services';
import { SORT_SETS as ai200Sort, RIDDLES as ai200Riddles } from './ai-200/games';
import * as gh300 from './gh-300/syllabus';
import { COURSE as gh300Course } from './gh-300/course';
import { SIMS3D_GH as gh300Sims3d } from './gh-300/sims3d';
import { TOURS_GH as gh300Tours } from './gh-300/portal-tours';
import { EMBED_LESSON_3D as gh300Embed3d } from './gh-300/embeds';
import { LESSON_SIMS as gh300Sims } from './gh-300/lesson-sims';
import { COMPARISONS as gh300Compare } from './gh-300/compare';
import { EXAM_ITEMS as gh300Items } from './gh-300/exam-items';
import { PROBLEM_SOLUTION as gh300Problems } from './gh-300/problem-solution';
import { SERVICES as gh300Services } from './gh-300/services';
import { SORT_SETS as gh300Sort, RIDDLES as gh300Riddles } from './gh-300/games';
import * as az104 from './az-104/syllabus';
import { COURSE as az104Course } from './az-104/course';
import { SIMS3D_ADMIN as az104Sims3d } from './az-104/sims3d';
import { TOURS_ADMIN as az104Tours } from './az-104/portal-tours';
import { EMBED_LESSON_3D as az104Embed3d } from './az-104/embeds';
import { LESSON_SIMS as az104Sims } from './az-104/lesson-sims';
import { COMPARISONS as az104Compare } from './az-104/compare';
import { EXAM_ITEMS as az104Items } from './az-104/exam-items';
import { PROBLEM_SOLUTION as az104Problems } from './az-104/problem-solution';
import { SERVICES as az104Services } from './az-104/services';
import { SORT_SETS as az104Sort, RIDDLES as az104Riddles } from './az-104/games';
import * as ai103 from './ai-103/syllabus';
import { COURSE as ai103Course } from './ai-103/course';
import { SIMS3D_AGENT as ai103Sims3d } from './ai-103/sims3d';
import { TOURS_AGENT as ai103Tours } from './ai-103/portal-tours';
import { EMBED_LESSON_3D as ai103Embed3d } from './ai-103/embeds';
import { LESSON_SIMS as ai103Sims } from './ai-103/lesson-sims';
import { COMPARISONS as ai103Compare } from './ai-103/compare';
import { EXAM_ITEMS as ai103Items } from './ai-103/exam-items';
import { PROBLEM_SOLUTION as ai103Problems } from './ai-103/problem-solution';
import { SERVICES as ai103Services } from './ai-103/services';
import { SORT_SETS as ai103Sort, RIDDLES as ai103Riddles } from './ai-103/games';


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
  /** Course details page copy (audience, outcomes, roadmap, FAQ). */
  course: CourseInfo;
  /** 3D scenes, and the lesson each one links back to (3D Explorer). */
  sims3d: Record<string, Sim3D>;
  lesson3d: Record<string, { title: string; url: string } | undefined>;
  /** Guided Azure portal walkthroughs, keyed by tour id (lessonSims[].tour.id). */
  tours: Record<string, Tour>;
  /** "Every service in 60 seconds" reference for this exam. */
  services: Service[];
  /** What the guided-walkthrough tab simulates. Defaults to the Azure portal (see simLabels). */
  sim?: Partial<SimLabels>;
}

/** Wording for the walkthrough tab and practice labs; GitHub exams simulate VS Code and github.com. */
export interface SimLabels {
  /** Tab label, e.g. 'Azure Portal'. */
  tab: string;
  /** In a sentence: "do it in the Azure portal". */
  noun: string;
  icon: string;
  /** Lab terminal name, e.g. 'Cloud Shell'. */
  shell: string;
  /** Disclaimer line under a walkthrough. */
  disclaimer: string;
  /** Lab id used when no lab fits a lesson (always offered last). */
  sandbox: string;
  /** Short line under the practice lab. */
  labNote: string;
}
const AZURE_SIM: SimLabels = {
  tab: 'Azure Portal', noun: 'the Azure portal', icon: '🖥️', shell: 'Cloud Shell',
  disclaimer: '🧪 Simulation for learning. Screens are simplified versions of the Azure portal; names, prices and IDs are examples. Nothing here touches real Azure.',
  sandbox: 'sandbox', labNote: 'simulated Azure portal and Cloud Shell',
};
export const simLabels = (e: Exam): SimLabels => ({ ...AZURE_SIM, ...e.sim });

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
    course: az900Course,
    sims3d: az900Sims3d,
    lesson3d: az900Embed3d,
    tours: az900Tours,
    services: az900Services,
  },
  'ai-901': {
    slug: 'ai-901',
    code: 'AI-901',
    name: info('ai-901').name,
    info: info('ai-901'),
    accent: '#8764b8',
    modules: ai901.MODULES,
    skillsMeasuredAsOf: ai901.SKILLS_MEASURED_AS_OF,
    syllabusVerifiedOn: ai901.SYLLABUS_VERIFIED_ON,
    studyGuideUrl: ai901.STUDY_GUIDE_URL,
    courseUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/exams/ai-901/',
    facts: ai901.EXAM_FACTS,
    lessonSims: ai901Sims,
    comparisons: ai901Compare,
    whatIfs: [],
    examItems: ai901Items,
    visuals: {},
    problems: ai901Problems,
    games: { sortSets: ai901Sort, riddles: ai901Riddles },
    activities: {},
    course: ai901Course,
    sims3d: ai901Sims3d,
    lesson3d: ai901Embed3d,
    tours: ai901Tours,
    services: ai901Services,
  },
  'ai-200': {
    slug: 'ai-200',
    code: 'AI-200',
    name: info('ai-200').name,
    info: info('ai-200'),
    accent: '#008575',
    modules: ai200.MODULES,
    skillsMeasuredAsOf: ai200.SKILLS_MEASURED_AS_OF,
    syllabusVerifiedOn: ai200.SYLLABUS_VERIFIED_ON,
    studyGuideUrl: ai200.STUDY_GUIDE_URL,
    courseUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/exams/ai-200/',
    facts: ai200.EXAM_FACTS,
    lessonSims: ai200Sims,
    comparisons: ai200Compare,
    whatIfs: [],
    examItems: ai200Items,
    visuals: {},
    problems: ai200Problems,
    games: { sortSets: ai200Sort, riddles: ai200Riddles },
    activities: {},
    course: ai200Course,
    sims3d: ai200Sims3d,
    lesson3d: ai200Embed3d,
    tours: ai200Tours,
    services: ai200Services,
  },
  'az-104': {
    slug: 'az-104',
    code: 'AZ-104',
    name: info('az-104').name,
    info: info('az-104'),
    accent: '#005ba1',
    modules: az104.MODULES,
    skillsMeasuredAsOf: az104.SKILLS_MEASURED_AS_OF,
    syllabusVerifiedOn: az104.SYLLABUS_VERIFIED_ON,
    studyGuideUrl: az104.STUDY_GUIDE_URL,
    courseUrl: 'https://learn.microsoft.com/en-us/training/courses/az-104t00',
    facts: az104.EXAM_FACTS,
    lessonSims: az104Sims,
    comparisons: az104Compare,
    whatIfs: [],
    examItems: az104Items,
    visuals: {},
    problems: az104Problems,
    games: { sortSets: az104Sort, riddles: az104Riddles },
    activities: {},
    course: az104Course,
    sims3d: az104Sims3d,
    lesson3d: az104Embed3d,
    tours: az104Tours,
    services: az104Services,
  },
  'ai-103': {
    slug: 'ai-103',
    code: 'AI-103',
    name: info('ai-103').name,
    info: info('ai-103'),
    accent: '#6b3fc0',
    modules: ai103.MODULES,
    skillsMeasuredAsOf: ai103.SKILLS_MEASURED_AS_OF,
    syllabusVerifiedOn: ai103.SYLLABUS_VERIFIED_ON,
    studyGuideUrl: ai103.STUDY_GUIDE_URL,
    courseUrl: 'https://learn.microsoft.com/en-us/training/courses/ai-103t00',
    facts: ai103.EXAM_FACTS,
    lessonSims: ai103Sims,
    comparisons: ai103Compare,
    whatIfs: [],
    examItems: ai103Items,
    visuals: {},
    problems: ai103Problems,
    games: { sortSets: ai103Sort, riddles: ai103Riddles },
    activities: {},
    course: ai103Course,
    sims3d: ai103Sims3d,
    lesson3d: ai103Embed3d,
    tours: ai103Tours,
    services: ai103Services,
  },
  'gh-300': {
    slug: 'gh-300',
    code: 'GH-300',
    name: info('gh-300').name,
    info: info('gh-300'),
    accent: '#1f883d',
    modules: gh300.MODULES,
    skillsMeasuredAsOf: gh300.SKILLS_MEASURED_AS_OF,
    syllabusVerifiedOn: gh300.SYLLABUS_VERIFIED_ON,
    studyGuideUrl: gh300.STUDY_GUIDE_URL,
    courseUrl: 'https://learn.microsoft.com/en-us/training/courses/gh-300t00',
    facts: gh300.EXAM_FACTS,
    lessonSims: gh300Sims,
    comparisons: gh300Compare,
    whatIfs: [],
    examItems: gh300Items,
    visuals: {},
    problems: gh300Problems,
    games: { sortSets: gh300Sort, riddles: gh300Riddles },
    activities: {},
    course: gh300Course,
    sims3d: gh300Sims3d,
    lesson3d: gh300Embed3d,
    tours: gh300Tours,
    services: gh300Services,
    sim: {
      tab: 'VS Code & GitHub', noun: 'VS Code and GitHub', icon: '💻', shell: 'terminal', sandbox: 'gh-sandbox', labNote: 'simulated terminal with GitHub Copilot CLI',
      disclaimer: '🧪 Simulation for learning. Screens are simplified versions of Visual Studio Code and github.com with GitHub Copilot. Not affiliated with GitHub or Microsoft.',
    },
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
