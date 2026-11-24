/** Guided Azure portal walkthroughs for AZ-104, merged from ./areas/<area>/. Ids start adm-. */
import type { Tour } from '../../lib/portal-tour';
import { AREAS } from './lesson-sims';

export const TOURS_ADMIN: Record<string, Tour> = Object.assign({}, ...AREAS.map((a) => a.TOURS));
