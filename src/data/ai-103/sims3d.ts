/** Narration for the AI-103 3D scenes. Builders live in src/lib/dc3d/agent/. */
import type { Sim3D } from '../az-900/sims3d';
import { SCENE as agentplan } from './areas/plan';
import { SCENE as agentgen } from './areas/genai';
import { SCENE as agentvision } from './areas/vision';
import { SCENE as agenttext } from './areas/text';
import { SCENE as agentextract } from './areas/extract';

export type AgentMode3D = 'agentplan' | 'agentgen' | 'agentvision' | 'agenttext' | 'agentextract';
export const SIMS3D_AGENT: Record<AgentMode3D, Sim3D> = { agentplan, agentgen, agentvision, agenttext, agentextract };
