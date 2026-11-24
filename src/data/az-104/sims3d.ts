/**
 * Narration for the AZ-104 3D scenes (<Datacenter3D mode="..." />). Builders
 * live in src/lib/dc3d/admin/. Step order matters: lesson-sims.ts opens a
 * scene at a step index.
 */
import type { Sim3D } from '../az-900/sims3d';
import { SCENE as adminidentity } from './areas/identity';
import { SCENE as adminstorage } from './areas/storage';
import { SCENE as admincompute } from './areas/compute';
import { SCENE as adminapps } from './areas/apps';
import { SCENE as adminnet } from './areas/network';
import { SCENE as adminops } from './areas/ops';

export type AdminMode3D = 'adminidentity' | 'adminstorage' | 'admincompute' | 'adminapps' | 'adminnet' | 'adminops';
export const SIMS3D_ADMIN: Record<AdminMode3D, Sim3D> = { adminidentity, adminstorage, admincompute, adminapps, adminnet, adminops };
