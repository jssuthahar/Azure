/**
 * Simulations shown in each AZ-104 lesson's "Simulations" section
 * (Azure Portal | 3D View | Practice Lab). Each course area keeps its own
 * entries in ./areas/<area>/index.ts; this file merges them.
 */
import type { LessonSims } from '../az-900/lesson-sims';
import * as identity from './areas/identity';
import * as storage from './areas/storage';
import * as compute from './areas/compute';
import * as apps from './areas/apps';
import * as network from './areas/network';
import * as ops from './areas/ops';

export const AREAS = [identity, storage, compute, apps, network, ops];
export const LESSON_SIMS: Record<string, LessonSims> = Object.assign({}, ...AREAS.map((a) => a.SIMS));
