import { Stage } from './kit';
import type { Ctx, Ctl } from './types';
import type { Mode3D } from '../../data/sims3d';
import { datacenter } from './datacenter';
import { zones } from './zones';
import { regions } from './regions';
import { redundancy } from './redundancy';
import { scale } from './scale';
import { network } from './network';
import { governance } from './governance';
import { identity } from './identity';
import { responsible } from './responsible';
import { genai } from './genai';
import { foundry } from './foundry';
import { perception } from './perception';
import { containers } from './containers';
import { vectordata } from './vectordata';
import { messaging } from './messaging';
import { observe } from './observe';
import { copilotflow, copilotcontext, copilotagent, copilotgov } from './copilot';
import { adminidentity } from './admin/adminidentity';
import { adminstorage } from './admin/adminstorage';
import { admincompute } from './admin/admincompute';
import { adminapps } from './admin/adminapps';
import { adminnet } from './admin/adminnet';
import { adminops } from './admin/adminops';
import { agentplan } from './agent/agentplan';
import { agentgen } from './agent/agentgen';
import { agentvision } from './agent/agentvision';
import { agenttext } from './agent/agenttext';
import { agentextract } from './agent/agentextract';

const BUILDERS: Record<Mode3D, (c: Ctx) => Ctl> = { datacenter, zones, regions, redundancy, scale, network, governance, identity, responsible, genai, foundry, perception, containers, vectordata, messaging, observe, copilotflow, copilotcontext, copilotagent, copilotgov, adminidentity, adminstorage, admincompute, adminapps, adminnet, adminops, agentplan, agentgen, agentvision, agenttext, agentextract };

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
