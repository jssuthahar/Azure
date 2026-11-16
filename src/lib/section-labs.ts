/**
 * Hands-on labs for each section (objective group) of an exam domain.
 * A lab belongs to a section when it practises at least one lesson that
 * covers one of the section's objectives. Most relevant labs come first.
 */
import type { ObjectiveGroup, SyllabusModule } from '../data/types';
import { LABS, type Lab } from './sim/labs';

export interface SectionLabs { number: string; group: ObjectiveGroup; labs: Lab[] }

export function sectionLabs(mod: SyllabusModule): SectionLabs[] {
  return mod.groups.map((group) => {
    const ids = new Set(group.objectives.map((o) => o.id));
    const slugs = new Set(mod.topics.filter((t) => t.objectives.some((o) => ids.has(o))).map((t) => t.slug));
    const hits = (l: Lab) => l.topics.filter((t) => slugs.has(t)).length;
    const labs = LABS.filter((l) => hits(l) > 0).sort((a, b) => hits(b) - hits(a));
    const number = (group.objectives[0]?.id ?? '').split('.').slice(0, 2).join('.');
    return { number, group, labs };
  });
}
