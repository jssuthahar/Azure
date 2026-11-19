/**
 * Which GH-300 lesson each embeddable simulation links back to, derived from
 * the lesson MDX at build time.
 */
import { LESSON_SIMS } from './lesson-sims';

const files = import.meta.glob('/src/content/tutorials/gh-300/**/*.mdx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

interface Use { title: string; url: string; slug: string }
const uses3d: Record<string, Use[]> = {};
const usesTour: Record<string, Use[]> = {};
for (const [path, raw] of Object.entries(files)) {
  const [, module, slug] = path.match(/gh-300\/([^/]+)\/([^/]+)\.mdx$/) ?? [];
  if (!slug) continue;
  const title = raw.match(/^title:\s*(.+)$/m)?.[1].replace(/^['"]|['"]$/g, '') ?? slug;
  const u: Use = { title, url: `/gh-300/${module}/${slug}/`, slug };
  const sims = LESSON_SIMS[slug];
  if (sims) { (uses3d[sims.d3.mode] ??= []).push(u); (usesTour[sims.tour.id] ??= []).push(u); }
}

const HOME_3D: Record<string, string> = { copilotflow: 'suggestion-lifecycle-and-limits', copilotcontext: 'prompt-structure-and-context', copilotagent: 'agent-mode-mcp-and-subagents', copilotgov: 'organization-policies' };
const pick = (list: Use[] = [], prefer?: string) => list.find((u) => u.slug === prefer) ?? list[0];

export const EMBED_LESSON_3D: Record<string, Use | undefined> = Object.fromEntries(Object.keys(HOME_3D).map((m) => [m, pick(uses3d[m], HOME_3D[m])]));
export const EMBED_LESSON_TOUR: Record<string, Use | undefined> = Object.fromEntries(Object.entries(usesTour).map(([id, l]) => [id, pick(l)]));
