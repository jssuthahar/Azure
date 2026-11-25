/** AI-103 practice labs, merged from each area. Lab ids start agt-. */
import type { Lab } from '../labs';
import { LABS as plan } from './plan';
import { LABS as genai } from './genai';
import { LABS as vision } from './vision';
import { LABS as text } from './text';
import { LABS as extract } from './extract';

export const AGENT_LABS: Lab[] = [...plan, ...genai, ...vision, ...text, ...extract].map((l) => ({ ...l, exam: 'ai-103' }));
