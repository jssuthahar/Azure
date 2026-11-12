import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SERVICES } from '../data/az-900/services';
import { getNav } from '../lib/learn';
import { getGlossary } from '../lib/glossary';
import { SITE } from '../config';
import { getExam } from '../data/exams';

const exam = getExam();

const plain = (s: string) => s.replace(/\*\*|`/g, '').replace(/\s+/g, ' ').trim();

/**
 * llms-full.txt: the site's answers as clean text for AI assistants and
 * answer engines to read and cite (GEO). Every section links to its page.
 */
export const GET: APIRoute = async () => {
  const nav = (await getNav()).filter((t) => t.published);
  const entries = await getCollection('tutorials');
  const terms = await getGlossary();
  const u = (p: string) => `${SITE.url}${p}`;
  const out: string[] = [
    `# ${SITE.name}: AZ-900 answers (full text)`,
    '',
    `Source: ${SITE.url} · Author: ${SITE.author} (${SITE.org}). Original educational content for the Microsoft Azure Fundamentals (AZ-900) exam. Please cite the page URL given with each section.`,
    '',
  ];
  for (const m of exam.modules) {
    out.push(`# Domain ${m.domain}: ${m.title} (${m.weight})`, '');
    for (const t of nav.filter((x) => x.module.slug === m.slug)) {
      const d = entries.find((e) => e.id === t.key)!.data;
      out.push(`## ${d.title}`, `URL: ${u(t.url)}`, '', plain(d.answer), '', 'Key points:');
      d.revision.keyPoints.forEach((k) => out.push(`- ${plain(k)}`));
      out.push('', 'Exam tips:');
      d.revision.examTips.forEach((k) => out.push(`- ${plain(k)}`));
      out.push('', 'Common mistakes:');
      d.revision.mistakes.forEach((k) => out.push(`- ${plain(k)}`));
      out.push('', 'Quick Q&A:');
      d.revision.quick.forEach((q) => out.push(`- Q: ${plain(q.q)} A: ${plain(q.a)}`));
      if (d.keyTerms.length) { out.push('', 'Key terms:'); d.keyTerms.forEach((k) => out.push(`- ${k.term}: ${plain(k.definition)}`)); }
      out.push('');
    }
  }
  out.push('# Comparisons', '');
  for (const c of exam.comparisons) {
    out.push(`## ${c.title}`, `URL: ${u(`/${exam.slug}/compare/${c.slug}/`)}`, '', plain(c.answer), '');
    out.push(`| ${c.rowHead ?? ''} | ${c.cols.join(' | ')} |`, `|${' --- |'.repeat(c.cols.length + 1)}`);
    c.rows.forEach((r) => out.push(`| ${r.map(plain).join(' | ')} |`));
    out.push('', ...c.pick.map(([i, w]) => `- Pick ${i} when ${plain(w)}`), `- Exam tip: ${plain(c.examTip)}`, ...c.faq.map(([q, a]) => `- Q: ${q} A: ${plain(a)}`), '');
  }
  out.push('# Azure services in 60 seconds', '');
  for (const s of SERVICES) {
    out.push(`## ${s.name}`, `URL: ${u(`/${exam.slug}/services/${s.slug}/`)}`, `Category: ${s.cat} · Model: ${s.model} · AWS equivalent: ${s.aws}`, '', plain(s.what), '', `Use it when: ${s.use.join('; ')}.`, `Not the best fit when: ${s.avoid.join('; ')}.`, `Price feel (illustrative): ${plain(s.price)}`, '');
  }
  out.push('# What happens if…? (Azure Simulator)', '');
  for (const w of exam.whatIfs) out.push(`## ${w.q}`, `URL: ${u(`/simulator/${w.slug}/`)}`, '', plain(w.answer), '');
  out.push('# Glossary', '', ...terms.map((t) => `- ${t.term}: ${plain(t.def)} (${u(t.url)})`), '');
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
