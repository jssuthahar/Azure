/**
 * AI-103 "plan" Cloud Shell commands (EDUCATION ONLY). cli.ts asks these
 * modules before the AZ-104 and AI-200 ones; return null for anything this
 * area doesn't handle, and guard shared command paths with `when` so you
 * never take over another exam's commands.
 */
import type { World } from '../world';
import type { AdminOut } from '../admin/kit';

export function az(_tokens: string[], _w: World): AdminOut | null { return null; }
export function shell(_tokens: string[], _w: World): AdminOut | null { return null; }
export const COMPLETIONS: string[] = [];
