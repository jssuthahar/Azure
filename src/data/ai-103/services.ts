/** AI-103 service reference: /ai-103/services/<slug>/ ("in 60 seconds"). Prices ($) are illustrative. */
import type { Service } from '../az-900/services';
import { AREAS } from './lesson-sims';

export const SERVICES: Service[] = AREAS.flatMap((a) => a.SERVICES);
