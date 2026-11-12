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
  /** Exam area number (1..n). AZ-900 has 3, AI-900 has 5. */
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
