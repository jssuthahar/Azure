/**
 * Build-time search index for the home page search: every live exam's lessons,
 * comparisons, glossary terms and study tools, plus every certification.
 * Small enough (a few hundred rows) to ship inline and filter in the browser.
 */
import { getCollection } from 'astro:content';
import { CERTIFICATIONS } from '../data/certifications';
import { liveExams } from '../data/exams';
import { getNav } from './learn';
import { getGlossary } from './glossary';

export interface SearchRow {
  /** Title shown in the result list. */
  t: string;
  /** Kind label: Lesson, Course, Tool, Term, Compare. */
  k: string;
  u: string;
  /** Short context line (module, exam, definition). */
  m: string;
  /** Extra words that should match but are not shown. */
  x?: string;
}

export async function buildSearchIndex(): Promise<SearchRow[]> {
  const rows: SearchRow[] = [];
  const entries = new Map((await getCollection('tutorials')).map((e) => [e.id, e]));
  for (const c of CERTIFICATIONS) {
    rows.push(c.status === 'active'
      ? { t: `${c.code} ${c.name}`, k: 'Course', u: `/${c.slug}/`, m: `${c.level} · available now`, x: c.blurb }
      : { t: `${c.code} ${c.name}`, k: 'Course', u: `/certifications/#${c.slug}`, m: `${c.level} · coming soon`, x: c.blurb });
  }
  for (const exam of liveExams()) {
    const s = exam.slug;
    for (const t of (await getNav(s)).filter((n) => n.published)) {
      const e = entries.get(t.key);
      rows.push({ t: t.title, k: 'Lesson', u: t.url, m: `${exam.code} · ${t.module.shortTitle}`, x: e ? `${e.data.description} ${e.data.keyTerms.map((k) => k.term).join(' ')}` : undefined });
    }
    for (const c of exam.comparisons) rows.push({ t: c.title, k: 'Compare', u: `/${s}/compare/${c.slug}/`, m: `${exam.code} · comparison` });
    for (const g of await getGlossary(s)) rows.push({ t: g.term, k: 'Term', u: g.url, m: g.def.length > 90 ? `${g.def.slice(0, 88).trimEnd()}…` : g.def });
    const tools: [string, string, string][] = [
      ['Learning dashboard', `/${s}/learn/`, 'progress lessons continue'],
      ['Mock exam', `/${s}/mock-exam/`, 'practice test timed exam'],
      ['Smart practice and readiness score', `/${s}/practice/`, 'questions spaced repetition'],
      ['Practice labs', `/${s}/labs/`, 'portal cloud shell cli hands-on'],
      ['3D explorer', `/${s}/3d-explorer/`, 'datacenter zones regions simulation'],
      ['Interview questions', `/${s}/interview/`, 'job interview answers'],
      ['Study plan', `/${s}/study-plan/`, 'schedule calendar reminders'],
      ['Cheat sheet', `/${s}/cheat-sheet/`, 'printable summary notes'],
      ['Revision flashcards', `/${s}/revision/`, 'flash cards quick notes'],
      ['Exam day guide', `/${s}/exam-day/`, 'booking voucher check-in retake'],
      ['Play and learn games', `/${s}/games/`, 'game daily challenge xp'],
      ['Glossary', `/${s}/glossary/`, 'terms definitions'],
    ];
    for (const [t, u, x] of tools) rows.push({ t, k: 'Tool', u, m: exam.code, x });
  }
  rows.push({ t: 'Azure Simulator: what happens if…?', k: 'Tool', u: '/simulator/', m: 'Outages, traffic spikes, bill shock', x: 'simulation' });
  rows.push({ t: 'Free practice certificate', k: 'Tool', u: '/certificate/', m: 'Pass the mock exam and share it', x: 'badge' });
  rows.push({ t: 'My progress', k: 'Tool', u: '/progress/', m: 'XP, streak, badges', x: 'account profile' });
  return rows;
}
