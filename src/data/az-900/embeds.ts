/**
 * Which lesson each embeddable simulation links back to. Derived from the
 * lesson MDX at build time, so it can't drift from where sims are used.
 */
import { LESSON_SIMS } from './lesson-sims';

const files = import.meta.glob('/src/content/tutorials/az-900/**/*.mdx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

interface Use { title: string; url: string; slug: string }
const uses3d: Record<string, Use[]> = {};
const usesTour: Record<string, Use[]> = {};
for (const [path, raw] of Object.entries(files)) {
  const [, module, slug] = path.match(/az-900\/([^/]+)\/([^/]+)\.mdx$/) ?? [];
  if (!slug) continue;
  const title = raw.match(/^title:\s*(.+)$/m)?.[1].replace(/^['"]|['"]$/g, '') ?? slug;
  const u: Use = { title, url: `/az-900/${module}/${slug}/`, slug };
  const sims = LESSON_SIMS[slug];
  if (sims) { (uses3d[sims.d3.mode] ??= []).push(u); (usesTour[sims.tour.id] ??= []).push(u); }
}

const HOME_3D: Record<string, string> = {
  datacenter: 'datacenters', zones: 'availability-zones', regions: 'regions-and-region-pairs',
  redundancy: 'storage-redundancy', scale: 'elasticity', network: 'virtual-networks-and-subnets',
  governance: 'management-hierarchy', identity: 'microsoft-entra-id',
};
const pick = (list: Use[] = [], prefer?: string) => list.find((u) => u.slug === prefer) ?? list[0];

export const EMBED_LESSON_3D: Record<string, Use | undefined> = Object.fromEntries(Object.keys(HOME_3D).map((m) => [m, pick(uses3d[m], HOME_3D[m])]));
export const EMBED_LESSON_TOUR: Record<string, Use | undefined> = Object.fromEntries(Object.entries(usesTour).map(([id, l]) => [id, pick(l)]));
/** Every lesson that uses a given sim (for "used in" lists). */
export const USES_3D = uses3d;
export const USES_TOUR = usesTour;
