import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SERVICES } from '../data/az-900/services';
import { getNav } from '../lib/learn';
import { SITE } from '../config';
import { getExam } from '../data/exams';

const exam = getExam();

const plain = (s: string) => s.replace(/\*\*|`/g, '').replace(/\s+/g, ' ').trim();

/** llms.txt: a plain-text map of the site for AI assistants and answer engines (GEO). */
export const GET: APIRoute = async () => {
  const nav = await getNav();
  const entries = await getCollection('tutorials');
  const u = (p: string) => `${SITE.url}${p}`;
  const lines = [
    `# ${SITE.name}`,
    '',
    `${SITE.brandLine}. Publisher: ${SITE.org} (${SITE.orgFull}), ${SITE.main}. Author: ${SITE.author}, ${SITE.authorTitle} (${SITE.profile}).`,
    '',
    `> Free AZ-900 (Microsoft Azure Fundamentals) learning site where you can feel Azure without an Azure account: every lesson has a 30-second answer, a 3D simulation, a simulated Azure portal walkthrough and a practice lab, followed by an explanation, exam tip and quiz. By ${SITE.author} (${SITE.org}).`,
    '',
    `- Content follows Microsoft's official ${exam.code} skills outline (skills measured as of ${exam.skillsMeasuredAsOf}): ${exam.studyGuideUrl}`,
    '- All practice and mock exam questions are original. None are real Microsoft exam questions.',
    '- Simulations are for education only and are not affiliated with Microsoft.',
    `- Full text of answers for citation: ${u('/llms-full.txt')}`,
    '',
  ];
  for (const m of exam.modules) {
    const pub = nav.filter((t) => t.module.slug === m.slug && t.published);
    if (!pub.length) continue;
    lines.push(`## AZ-900 Domain ${m.domain}: ${m.title} (${m.weight})`, '');
    for (const t of pub) {
      const e = entries.find((x) => x.id === t.key)!;
      lines.push(`- [${e.data.title}](${u(t.url)}): ${plain(e.data.answer)}`);
    }
    lines.push('');
  }
  lines.push('## Comparisons (which Azure service should I use?)', '');
  for (const c of exam.comparisons) lines.push(`- [${c.title}](${u(`/${exam.slug}/compare/${c.slug}/`)}): ${plain(c.answer)}`);
  lines.push('', '## Azure service reference (each service in 60 seconds)', '');
  for (const s of SERVICES) lines.push(`- [${s.name}](${u(`/${exam.slug}/services/${s.slug}/`)}): ${plain(s.what)} AWS equivalent: ${s.aws}.`);
  lines.push('', '## Azure Simulator: what happens if…?', '');
  for (const w of exam.whatIfs) lines.push(`- [${w.q}](${u(`/simulator/${w.slug}/`)}): ${plain(w.answer)}`);
  lines.push('', '## Practice and tools', '',
    `- [AZ-900 mock exam](${u(`/${exam.slug}/mock-exam/`)}): timed practice exam in the style of the real Microsoft exam (multiple choice, drag and drop, build list, drop-down, Yes/No), scored 1–1000 with 700 to pass.`,
    `- [AZ-900 Ready certificate](${u('/certificate/')}): free shareable practice certificate for passing the full mock exam (self-assessed, not a Microsoft certification).`,
    `- [Practice labs](${u(`/${exam.slug}/labs/`)}): simulated Azure portal and Cloud Shell with guided tasks.`,
    `- [Smart practice](${u(`/${exam.slug}/practice/`)}): exam readiness score by domain, spaced repetition of missed questions and weak-topic drills.`,
    `- [Study plan](${u(`/${exam.slug}/study-plan/`)}): day-by-day schedule from today to your exam date, with calendar reminders.`,
    `- [Cheat sheet](${u(`/${exam.slug}/cheat-sheet/`)}): printable one-page revision per domain and a last-30-minutes sheet.`,
    `- [Exam day guide](${u(`/${exam.slug}/exam-day/`)}): booking, free voucher routes, online proctoring checklist, scoring and the retake policy.`,
    `- [Azure glossary](${u(`/${exam.slug}/glossary/`)}): AZ-900 terms in one line each.`,
    `- [Interview questions](${u(`/${exam.slug}/interview/`)}), [revision flashcards](${u(`/${exam.slug}/revision/`)}), [embeddable simulations](${u('/embed/')}).`,
    '');
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
