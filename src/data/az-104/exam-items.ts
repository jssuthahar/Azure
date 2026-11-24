/**
 * Exam-format practice items for the AZ-104 mock exam (Yes/No series,
 * matching, ordering, drop-down completion). Every item is ORIGINAL, written
 * from the official skills outline; none are real or recalled exam questions.
 */
import type { FormatItem } from '../az-900/exam-items';
import { AREAS } from './lesson-sims';

export const EXAM_ITEMS: FormatItem[] = AREAS.flatMap((a) => a.ITEMS);
