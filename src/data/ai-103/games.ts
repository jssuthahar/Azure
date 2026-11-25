/** AI-103 content for the Play & Learn games. Every item matches what the lessons teach. */
import type { SortSet, Riddle } from '../az-900/games';
import { AREAS } from './lesson-sims';

export const SORT_SETS: SortSet[] = AREAS.flatMap((a) => a.SORT);
export const RIDDLES: Riddle[] = AREAS.flatMap((a) => a.RIDDLES);
