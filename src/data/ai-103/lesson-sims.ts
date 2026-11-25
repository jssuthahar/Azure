/** Simulations in each AI-103 lesson (Azure Portal | 3D View | Practice Lab), merged from ./areas/<area>/index.ts. */
import type { LessonSims } from '../az-900/lesson-sims';
import * as plan from './areas/plan';
import * as genai from './areas/genai';
import * as vision from './areas/vision';
import * as text from './areas/text';
import * as extract from './areas/extract';

export const AREAS = [plan, genai, vision, text, extract];
export const LESSON_SIMS: Record<string, LessonSims> = Object.assign({}, ...AREAS.map((a) => a.SIMS));
