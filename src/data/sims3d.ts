/**
 * Every 3D scene on the site, from every exam. Shared code (the 3D component,
 * the engine, embed pages) imports from here; each exam keeps its own scene
 * text in src/data/<exam>/sims3d.ts.
 */
import { SIMS3D as AZ, type Sim3D } from './az-900/sims3d';
import { SIMS3D_AI as AI } from './ai-901/sims3d';
import { SIMS3D_DEV as DEV } from './ai-200/sims3d';
import { SIMS3D_GH as GH } from './gh-300/sims3d';
import { SIMS3D_ADMIN as ADM } from './az-104/sims3d';
export type { Sim3D, Step3D, Action3D } from './az-900/sims3d';

export type Mode3D = keyof typeof AZ | keyof typeof AI | keyof typeof DEV | keyof typeof GH | keyof typeof ADM;
export const SIMS3D: Record<Mode3D, Sim3D> = { ...AZ, ...AI, ...DEV, ...GH, ...ADM };
