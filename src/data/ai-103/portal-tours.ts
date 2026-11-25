/** Guided Azure portal walkthroughs for AI-103, merged from ./areas/<area>/. Ids start agt-. */
import type { Tour } from '../../lib/portal-tour';
import { AREAS } from './lesson-sims';

export const TOURS_AGENT: Record<string, Tour> = Object.assign({}, ...AREAS.map((a) => a.TOURS));
