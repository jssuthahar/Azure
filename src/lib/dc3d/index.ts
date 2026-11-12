import { Stage } from './kit';
import type { Ctx, Ctl } from './types';
import type { Mode3D } from '../../data/az-900/sims3d';
import { datacenter } from './datacenter';
import { zones } from './zones';
import { regions } from './regions';
import { redundancy } from './redundancy';
import { scale } from './scale';
import { network } from './network';
import { governance } from './governance';
import { identity } from './identity';

const BUILDERS: Record<Mode3D, (c: Ctx) => Ctl> = { datacenter, zones, regions, redundancy, scale, network, governance, identity };

export function webglOk() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

export function mount(mode: Mode3D, host: HTMLElement, labels: HTMLElement, ui: Omit<Ctx, 'stage'>) {
  const stage = new Stage(host, labels);
  const ctl = BUILDERS[mode]({ stage, ...ui });
  stage.start();
  return { ctl, stage };
}
