import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { MODULES, SKILLS_MEASURED_AS_OF, STUDY_GUIDE_URL } from '../data/az-900/syllabus';
import { getNav } from '../lib/learn';
import { SITE } from '../config';

/** llms.txt: a plain-text map of the site for AI assistants and answer engines. */
export const GET: APIRoute = async () => {
  const nav = await getNav();
  const entries = await getCollection('tutorials');
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    `AZ-900 content follows Microsoft's official skills outline (skills measured as of ${SKILLS_MEASURED_AS_OF}): ${STUDY_GUIDE_URL}`,
    'All practice questions are original and are not real Microsoft exam questions.',
    '',
  ];
  for (const m of MODULES) {
    const pub = nav.filter((t) => t.module.slug === m.slug && t.published);
    if (!pub.length) continue;
    lines.push(`## AZ-900 Domain ${m.domain}: ${m.title} (${m.weight})`, '');
    for (const t of pub) {
      const e = entries.find((x) => x.id === t.key)!;
      lines.push(`- [${e.data.title}](${SITE.url}${t.url}): ${e.data.answer.replace(/\*\*/g, '').replace(/\s+/g, ' ')}`);
    }
    lines.push('');
  }
  lines.push('## Practice', '', `- [AZ-900 mock exam](${SITE.url}/az-900/mock-exam/)`, `- [AZ-900 interview questions](${SITE.url}/az-900/interview/)`, `- [AZ-900 revision flashcards and glossary](${SITE.url}/az-900/revision/)`, '');
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
