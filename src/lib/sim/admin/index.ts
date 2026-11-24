/**
 * AZ-104 administrator commands for the simulated Cloud Shell. cli.ts asks
 * these modules first; each returns null for anything it doesn't handle.
 */
import type { World } from '../world';
import type { AdminOut } from './kit';
import * as identity from './identity';
import * as storage from './storage';
import * as compute from './compute';
import * as apps from './apps';
import * as network from './network';
import * as ops from './ops';

const AREAS = [identity, storage, compute, apps, network, ops];

/** `az …` (tokens after "az"). */
export function az(tokens: string[], w: World): AdminOut | null {
  for (const a of AREAS) {
    const r = a.az(tokens, w);
    if (r) return r;
  }
  return null;
}
/** Other shell tools (azcopy, Connect-AzAccount style helpers…). */
export function shell(tokens: string[], w: World): AdminOut | null {
  for (const a of AREAS) {
    const r = a.shell(tokens, w);
    if (r) return r;
  }
  return null;
}
export const COMPLETIONS = AREAS.flatMap((a) => a.COMPLETIONS);
