import { getNav, getTutorial } from './learn';
import { PRIMARY_EXAM } from '../data/exams';

export interface Term { term: string; def: string; slug: string; lesson: string; url: string }

/** Every key term from every published lesson, de-duplicated, A–Z. */
export async function getGlossary(cert = PRIMARY_EXAM): Promise<Term[]> {
  const nav = (await getNav(cert)).filter((t) => t.published);
  const seen = new Map<string, Term>();
  for (const t of nav) {
    const e = await getTutorial(t.key);
    for (const k of e?.data.keyTerms ?? []) {
      const id = k.term.toLowerCase();
      if (seen.has(id)) continue;
      const slug = id.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      seen.set(id, { term: k.term, def: k.definition, slug, lesson: t.title, url: t.url });
    }
  }
  return [...seen.values()].sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));
}
