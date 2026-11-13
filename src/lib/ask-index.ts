/**
 * Answer index for the "Ask" chatbot, one per exam, built at build time from the
 * site's own content: lesson answers, interview Q&A, quick revision, exam tips,
 * glossary terms and comparisons. The browser ranks entries against the
 * learner's question (src/lib/ask.ts), so no server or AI service is involved.
 */
import { getNav, getTutorial } from './learn';
import { getGlossary } from './glossary';
import { getExam } from '../data/exams';

export interface AskEntry {
  /** Question or heading the entry answers. */
  q: string;
  /** Plain-text answer. */
  a: string;
  /** Link to the page (and section) it came from. */
  u: string;
  /** Where it came from, shown as a label. */
  k: 'Lesson' | 'Interview' | 'Quick revision' | 'Exam tip' | 'Glossary' | 'Comparison';
  /** Lesson or page title, for context. */
  t: string;
}

export interface AskIndex {
  exam: { slug: string; code: string; name: string };
  suggest: string[];
  links: { label: string; url: string }[];
  entries: AskEntry[];
}

const plain = (s: string) =>
  String(s)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*|__|`/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export async function buildAskIndex(cert: string): Promise<AskIndex> {
  const exam = getExam(cert);
  const nav = (await getNav(cert)).filter((t) => t.published);
  const entries: AskEntry[] = [];

  for (const t of nav) {
    const e = await getTutorial(t.key);
    if (!e) continue;
    const d = e.data;
    entries.push({ q: d.title, a: plain(d.answer), u: t.url, k: 'Lesson', t: d.title });
    for (const i of d.interview) entries.push({ q: plain(i.q), a: plain(i.a), u: t.url, k: 'Interview', t: d.title });
    for (const r of d.revision.quick) entries.push({ q: plain(r.q), a: plain(r.a), u: `${t.url}#quick-revision`, k: 'Quick revision', t: d.title });
    entries.push({ q: `${d.title}: exam tips`, a: d.revision.examTips.map(plain).join(' '), u: `${t.url}#exam-tip`, k: 'Exam tip', t: d.title });
  }

  for (const g of await getGlossary(cert)) {
    entries.push({ q: `What is ${g.term}?`, a: plain(g.def), u: `/${exam.slug}/glossary/#${g.slug}`, k: 'Glossary', t: g.lesson });
  }

  for (const c of exam.comparisons) {
    const u = `/${exam.slug}/compare/${c.slug}/`;
    entries.push({ q: c.title, a: plain(c.answer), u, k: 'Comparison', t: c.title });
    for (const [q, a] of c.faq) entries.push({ q: plain(q), a: plain(a), u, k: 'Comparison', t: c.title });
  }

  return {
    exam: { slug: exam.slug, code: exam.code, name: exam.name },
    suggest: [
      nav[0]?.title ?? '',
      exam.comparisons[0]?.title ?? '',
      nav[Math.floor(nav.length / 2)]?.title ?? '',
      nav[nav.length - 1]?.title ?? '',
    ].filter(Boolean),
    links: [
      { label: `${exam.code} course`, url: `/${exam.slug}/` },
      { label: 'Glossary', url: `/${exam.slug}/glossary/` },
      { label: 'Mock exam', url: `/${exam.slug}/mock-exam/` },
    ],
    entries,
  };
}
