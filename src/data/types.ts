/** Shared syllabus shapes used by every exam's syllabus.ts. */

export interface ObjectiveGroup {
  title: string;
  objectives: { id: string; text: string }[];
}

export interface SyllabusTopic {
  slug: string;
  title: string;
  /** Objective ids from the official outline this topic covers. */
  objectives: string[];
  beyondExam?: boolean;
}

export interface SyllabusModule {
  slug: string;
  /** Exam area number (1..n). AZ-900 has 3, AI-901 has 2. */
  domain: number;
  title: string;
  shortTitle: string;
  weight: string;
  /** Midpoint of the weight range, used to size mock exams. */
  weightMid: number;
  summary: string;
  groups: ObjectiveGroup[];
  topics: SyllabusTopic[];
}

export interface ExamFacts {
  passingScore: number;
  scoreScale: string;
  durationMinutes: number;
  practiceAssessmentUrl: string;
}

/** Course details page copy (src/data/<exam>/course.ts). */
export interface CourseInfo {
  title: string;
  subtitle: string;
  intro: string[];
  audience: { icon: string; title: string; text: string }[];
  outcomes: string[];
  requirements: string[];
  roadmap: { title: string; text: string }[];
  faq: { q: string; a: string }[];
  /** Optional copy for /<exam>/labs/ (defaults are the Azure portal ones). */
  /** Optional per-exam copy for shared hub pages (defaults are the AZ-900 wording). */
  hubs?: { compare?: string; games?: string; servicesTitle?: string; services?: string; sandboxTitle?: string; whoAmI?: string };
  labs?: { title: string; description: string; h1: string; intro: string; shell: [cmd: string, out: string][] };
}
