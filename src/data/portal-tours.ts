/**
 * Every guided portal walkthrough on the site, from every exam. Shared code
 * (<PortalTour>, embed pages) imports from here; each exam keeps its own tours
 * in src/data/<exam>/portal-tours.ts. Tour ids must be unique across exams.
 */
import { TOURS as AZ } from './az-900/portal-tours';
import { TOURS_AI as AI } from './ai-901/portal-tours';
import { TOURS_DEV as DEV } from './ai-200/portal-tours';
import { TOURS_GH as GH } from './gh-300/portal-tours';
import { TOURS_ADMIN as ADM } from './az-104/portal-tours';

export const TOURS = { ...AZ, ...AI, ...DEV, ...GH, ...ADM };
