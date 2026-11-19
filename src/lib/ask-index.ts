/**
 * Answer index for the "Ask" chatbot, one per exam, built at build time from the
 * site's own content: lesson answers, interview Q&A, quick revision, exam tips,
 * glossary terms and comparisons. The browser ranks entries against the
 * learner's question (src/lib/ask.ts), so no server or AI service is involved.
 */
import { getNav, getTutorial } from './learn';
import { getGlossary } from './glossary';
import { getExam, simLabels } from '../data/exams';
import { labsForTopic } from './sim/labs';

export interface AskEntry {
  /** Question or heading the entry answers. */
  q: string;
  /** Plain-text answer. */
  a: string;
  /** Link to the page (and section) it came from. */
  u: string;
  /** Where it came from, shown as a label. */
  k: 'Lesson' | 'Interview' | 'Quick revision' | 'Exam tip' | 'Glossary' | 'Comparison' | '3D View' | 'Azure Portal' | 'Practice Lab';
  /** Lesson or page title, for context. */
  t: string;
  /** Lesson URL this entry belongs to, so the bot can open its simulations first. */
  l?: string;
}

/** A lesson's three simulations, shown before the text answer: 3D, then the portal, then a lab. */
export interface SimCard {
  d3?: { title: string; intro: string; step: string; text: string };
  portal?: { title: string; intro: string; steps: string[] };
  labs: { id: string; title: string; icon: string; intro: string; minutes: number; tasks: number }[];
}

/** Lesson tutor material, keyed by lesson URL: other ways to explain the same lesson. */
export interface TutorEntry {
  t: string;
  /** "Explain it like I'm 10" in plain text. */
  simple: string;
  /** The real-world business scenario as one short story. */
  example: string;
  /** Common mistakes and exam traps. */
  traps: string[];
  /** Interview answers: a more technical second explanation. */
  deeper: { q: string; a: string }[];
  /** Quick-revision questions for "Quiz me". */
  quiz: { q: string; a: string }[];
  /** Key terms with definitions. */
  terms: { term: string; def: string }[];
}

export interface AskIndex {
  exam: { slug: string; code: string; name: string };
  /** "the Azure portal", or "VS Code and GitHub" for GitHub exams. */
  simNoun: string;
  tutor: Record<string, TutorEntry>;
  /** Simulations per lesson URL. */
  sims: Record<string, SimCard>;
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

/** Body text under one `## Heading` of a lesson, with MDX components and markdown stripped. */
function section(body: string, heading: RegExp): string {
  const lines = body.split('\n');
  const start = lines.findIndex((l) => heading.test(l));
  if (start < 0) return '';
  const end = lines.findIndex((l, i) => i > start && /^## /.test(l));
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n');
}
const mdxText = (s: string) =>
  plain(
    s
      .replace(/<[A-Z][A-Za-z]*\b[^>]*?\/>/gs, ' ')
      .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
      .replace(/^#+\s.*$/gm, ' ')
      .replace(/^\s*[-*]\s+/gm, ''),
  );
const prop = (s: string, name: string) => s.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? '';

export async function buildAskIndex(cert: string): Promise<AskIndex> {
  const exam = getExam(cert);
  const nav = (await getNav(cert)).filter((t) => t.published);
  const entries: AskEntry[] = [];
  const tutor: Record<string, TutorEntry> = {};
  const sims: Record<string, SimCard> = {};
  const urlByTitle = new Map(nav.map((t) => [t.title, t.url]));
  const indexed = new Set<string>(); // tours and labs shared by several lessons are searchable once

  for (const t of nav) {
    const e = await getTutorial(t.key);
    if (!e) continue;
    const d = e.data;
    const l = t.url;
    entries.push({ q: d.title, a: plain(d.answer), u: t.url, k: 'Lesson', t: d.title, l });
    for (const i of d.interview) entries.push({ q: plain(i.q), a: plain(i.a), u: t.url, k: 'Interview', t: d.title, l });
    for (const r of d.revision.quick) entries.push({ q: plain(r.q), a: plain(r.a), u: `${t.url}#quick-revision`, k: 'Quick revision', t: d.title, l });
    entries.push({ q: `${d.title}: exam tips`, a: d.revision.examTips.map(plain).join(' '), u: `${t.url}#exam-tip`, k: 'Exam tip', t: d.title, l });

    // Simulations: what the learner can see (3D), click through (portal) and do (lab).
    const ls = exam.lessonSims[t.slug];
    const scene = ls && exam.sims3d[ls.d3.mode];
    const step = scene?.steps[ls.d3.start] ?? scene?.steps[0];
    const tour = ls && exam.tours[ls.tour.id];
    const labs = labsForTopic(t.slug);
    sims[t.url] = {
      d3: ls && scene && step ? { title: scene.title, intro: ls.d3.intro, step: step.title, text: plain(step.text) } : undefined,
      portal: ls && tour ? { title: tour.title, intro: ls.tour.intro, steps: tour.steps.slice(0, 5).map((s) => plain(s.say)) } : undefined,
      labs: labs.slice(0, 2).map((x) => ({ id: x.id, title: x.title, icon: x.icon, intro: plain(x.intro), minutes: x.minutes, tasks: x.tasks.length })),
    };
    if (sims[t.url].d3) {
      const v = sims[t.url].d3!;
      entries.push({ q: `${d.title} in 3D: ${v.step}`, a: `${v.intro} ${v.text}`, u: `${t.url}#sim-3d`, k: '3D View', t: d.title, l });
    }
    if (tour && !indexed.has(`tour:${ls!.tour.id}`)) {
      indexed.add(`tour:${ls!.tour.id}`);
      entries.push({ q: `How do I ${tour.title.replace(/^./, (c) => c.toLowerCase())} in ${simLabels(exam).noun}?`, a: `${ls!.tour.intro} ${tour.steps.map((s) => plain(s.say)).join(' ')}`, u: `${t.url}#sim-portal`, k: 'Azure Portal', t: d.title, l });
    }
    for (const x of labs) {
      if (indexed.has(`lab:${x.id}`)) continue;
      indexed.add(`lab:${x.id}`);
      entries.push({ q: `Practice lab: ${x.title}`, a: `${plain(x.intro)} ${x.learn.map(plain).join(' ')}`, u: `${t.url}#sim-lab-${x.id}`, k: 'Practice Lab', t: d.title, l });
    }
    const body = e.body ?? '';
    const sc = section(body, /^## Real-world business scenario/);
    tutor[t.url] = {
      t: d.title,
      simple: mdxText(section(body, /^## Explain it like I'm 10/)),
      example: prop(sc, 'company')
        ? `${prop(sc, 'company')}. The problem: ${prop(sc, 'problem')} What they used: ${prop(sc, 'service')} Why: ${prop(sc, 'why')} The result: ${prop(sc, 'outcome')}`
        : mdxText(sc),
      traps: [...d.revision.mistakes, ...d.revision.examTips].map(plain),
      deeper: d.interview.filter((i) => i.level !== 'beginner').slice(0, 3).map((i) => ({ q: plain(i.q), a: plain(i.a) })),
      quiz: d.revision.quick.map((r) => ({ q: plain(r.q), a: plain(r.a) })),
      terms: d.keyTerms.map((k) => ({ term: plain(k.term), def: plain(k.definition) })),
    };
  }

  for (const g of await getGlossary(cert)) {
    entries.push({ q: `What is ${g.term}?`, a: plain(g.def), u: `/${exam.slug}/glossary/#${g.slug}`, k: 'Glossary', t: g.lesson, l: urlByTitle.get(g.lesson) ?? g.url });
  }

  for (const c of exam.comparisons) {
    const u = `/${exam.slug}/compare/${c.slug}/`;
    entries.push({ q: c.title, a: plain(c.answer), u, k: 'Comparison', t: c.title });
    for (const [q, a] of c.faq) entries.push({ q: plain(q), a: plain(a), u, k: 'Comparison', t: c.title });
  }

  return {
    exam: { slug: exam.slug, code: exam.code, name: exam.name },
    simNoun: simLabels(exam).noun,
    tutor,
    sims,
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
