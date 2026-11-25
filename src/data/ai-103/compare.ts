/**
 * AI-103 "X vs Y" comparison pages: /ai-103/compare/<slug>/.
 * Prices written as $12.34 are shown in the learner's currency (default INR).
 */
import type { Comparison } from '../az-900/compare';
import { AREAS } from './lesson-sims';

export const COMPARISONS: Comparison[] = AREAS.flatMap((a) => a.COMPARE);
