/**
 * AI-103 agent-developer commands for the simulated Cloud Shell. cli.ts asks
 * these modules first; each returns null for anything it doesn't handle.
 */
import type { World } from '../world';
import type { AdminOut } from '../admin/kit';
import * as plan from './plan';
import * as genai from './genai';
import * as vision from './vision';
import * as text from './text';
import * as extract from './extract';

const AREAS = [plan, genai, vision, text, extract];
export function az(tokens: string[], w: World): AdminOut | null {
  for (const a of AREAS) { const r = a.az(tokens, w); if (r) return r; }
  return null;
}
export function shell(tokens: string[], w: World): AdminOut | null {
  for (const a of AREAS) { const r = a.shell(tokens, w); if (r) return r; }
  return null;
}
export const COMPLETIONS = AREAS.flatMap((a) => a.COMPLETIONS);
