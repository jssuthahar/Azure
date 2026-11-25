/** Problem → Solution cards near the top of every AI-103 lesson, merged from ./areas/<area>/. */
import type { ProblemSolution } from '../az-900/problem-solution';
import { AREAS } from './lesson-sims';

export const PROBLEM_SOLUTION: Record<string, ProblemSolution> = Object.assign({}, ...AREAS.map((a) => a.PROBLEMS));
