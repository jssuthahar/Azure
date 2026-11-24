/**
 * AZ-104 practice labs: administrator tasks in the simulated Azure portal and
 * Cloud Shell. Every task is checked from simulator events, and every task's
 * `cli` hint completes it when run as written, in order. Lab ids start adm-.
 */
import type { Lab } from '../labs';
import { LABS as identity } from './identity';
import { LABS as storage } from './storage';
import { LABS as compute } from './compute';
import { LABS as apps } from './apps';
import { LABS as network } from './network';
import { LABS as ops } from './ops';

export const ADMIN_LABS: Lab[] = [...identity, ...storage, ...compute, ...apps, ...network, ...ops].map((l) => ({ ...l, exam: 'az-104' }));
