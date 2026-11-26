import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { liveExams, PRIMARY_EXAM } from '../data/exams';
import { NEXT_EXAMS } from '../data/next-exams';
import { getNav } from '../lib/learn';

/**
 * /coach.json: what Nimbus Coach needs about every live exam (lesson list in
 * course order, what to take next). Loaded by NimbusCoach.astro only when the
 * coach has something to say, so ordinary pages never pay for it.
 */
export const GET: APIRoute = async () => {
  const live = liveExams();
  const slugs = new Set(live.map((e) => e.slug));
  const entries = await getCollection('tutorials');
  const exams = await Promise.all(
    live.map(async (e) => {
      const nav = (await getNav(e.slug)).filter((t) => t.published);
      return {
        slug: e.slug,
        code: e.code,
        name: e.name,
        lessons: nav.map((t) => ({ key: t.key, title: t.title, url: t.url, domain: t.module.domain, minutes: entries.find((x) => x.id === t.key)?.data.readingMinutes ?? 8 })),
        modules: e.modules.map((m) => ({ slug: m.slug, title: m.shortTitle || m.title })),
        next: (NEXT_EXAMS[e.slug] ?? []).filter((n) => slugs.has(n.slug)),
      };
    }),
  );
  return new Response(JSON.stringify({ primary: PRIMARY_EXAM, exams }), { headers: { 'Content-Type': 'application/json' } });
};
