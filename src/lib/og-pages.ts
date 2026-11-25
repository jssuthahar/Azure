/** Which pages get their own share card, and what it says. Keyed by page path. */
import { getCollection } from 'astro:content';
import { getNav } from './learn';
import type { Card } from './og';
import { getExam, liveExams } from '../data/exams';

const exam = getExam();

let cache: Map<string, Card> | null = null;

export async function ogPages(): Promise<Map<string, Card>> {
  if (cache) return cache;
  const m = new Map<string, Card>();
  const entries = await getCollection('tutorials');
  for (const ex of liveExams()) {
    const nav = (await getNav(ex.slug)).filter((t) => t.published);
    for (const t of nav) {
      const d = entries.find((e) => e.id === t.key)!.data;
      m.set(t.url, { eyebrow: `${ex.code} · ${t.module.shortTitle}`, title: d.title, text: d.answer, badge: ex.slug === exam.slug ? '3D + portal simulation' : '3D + Foundry simulation' });
    }
    for (const c of ex.comparisons) m.set(`/${ex.slug}/compare/${c.slug}/`, { eyebrow: 'Compare', title: c.title, text: c.answer, accent: '#9fe870', badge: 'Side by side' });
    for (const s of ex.services) m.set(`/${ex.slug}/services/${s.slug}/`, { eyebrow: `${s.cat} · in 60 seconds`, title: s.name, text: s.what, accent: '#8fcbf7', badge: `AWS: ${s.aws}`.slice(0, 34) });
    for (const w of ex.whatIfs) m.set(`/simulator/${w.slug}/`, { eyebrow: 'What happens if…?', title: w.q, text: w.answer, accent: '#ff9f7a', badge: '▶ Simulate it' });
    if (ex.slug !== exam.slug) {
      m.set(`/${ex.slug}/`, { eyebrow: ex.name, title: `${ex.code} course and syllabus`, text: ex.modules.map((x) => x.title).join(' · ') });
      m.set(`/${ex.slug}/mock-exam/`, { eyebrow: 'Real exam experience', title: `${ex.code} mock exam`, text: 'Timer, review screen, drag and drop, build list, drop-down and Yes/No items. Scored 1–1000, 700 to pass.', accent: '#ffd75e' });
      m.set(`/${ex.slug}/labs/`, { eyebrow: 'Practice labs', title: `${ex.code} practice labs`, text: ex.course.labs?.intro ?? 'Guided tasks in a simulated portal and Cloud Shell. Education only, no account needed.' });
    }
  }
  const hub = (p: string, c: Card) => m.set(p, c);
  hub('/', { eyebrow: 'Free AZ-900 course', title: 'Feel Azure without an Azure account', text: '3D simulations, Azure portal walkthroughs and practice labs in every lesson, plus a real-exam-style mock exam and certificate.' });
  hub(`/${exam.slug}/`, { eyebrow: exam.name, title: `${exam.code} course and syllabus`, text: exam.modules.map((x) => x.title).join(' · ') });
  hub(`/${exam.slug}/mock-exam/`, { eyebrow: 'Real exam experience', title: 'AZ-900 mock exam', text: 'Timer, review screen, drag and drop, build list, drop-down and Yes/No items. Scored 1–1000, 700 to pass, with a certificate.', accent: '#9fe870' });
  hub('/certificate/', { eyebrow: 'Free certificate', title: 'AZ-900 Ready certificate', text: 'Pass the full mock exam and share your certificate on LinkedIn, X and WhatsApp.', accent: '#ffd75e' });
  hub('/simulator/', { eyebrow: 'Azure Simulator', title: 'Break Azure on purpose, safely', text: 'Pull the plug on a datacenter, survive a Black Friday spike, see a forgotten-VM bill, measure latency.', accent: '#ff9f7a' });
  hub(`/${exam.slug}/compare/`, { eyebrow: 'Compare', title: 'Which Azure service should I use?', text: 'Blob vs Files vs Disk, VM vs App Service vs Functions, LRS vs GRS, Azure vs AWS and more.', accent: '#9fe870' });
  hub(`/${exam.slug}/services/`, { eyebrow: 'Reference', title: 'Every Azure service in 60 seconds', text: 'What it is, when to use it, price feel in your currency and a simulation.', accent: '#8fcbf7' });
  hub(`/${exam.slug}/glossary/`, { eyebrow: 'Reference', title: 'Azure glossary', text: 'Every AZ-900 term explained in one line, linked to a lesson and a simulation.', accent: '#8fcbf7' });
  hub(`/${exam.slug}/labs/`, { eyebrow: 'Practice labs', title: 'Click through a simulated Azure portal', text: 'Guided tasks in a simulated portal and Cloud Shell. Education only, no Azure account needed.' });
  hub('/exam-changes-2026/', { eyebrow: 'Exam changes 2026', title: 'Retired Azure exams and what replaced them', text: 'AI-900 → AI-901 · AI-102 → AI-103 · DP-100 → AI-300 · AZ-204 → AI-200 · AZ-500 → SC-500', accent: '#ffd75e' });
  hub('/ai-900-vs-ai-901/', { eyebrow: 'Exam changes 2026', title: 'AI-900 vs AI-901', text: 'Five describe-only domains became two, and most of the new exam is building with Microsoft Foundry.', accent: '#c9b3ff' });
  hub('/az-204-vs-ai-200/', { eyebrow: 'Exam changes 2026', title: 'AZ-204 vs AI-200', text: 'The developer core stays; vector search in Cosmos DB, PostgreSQL and Redis moves in.', accent: '#9fe870' });
  hub('/exam-dumps/', { eyebrow: 'Exam integrity', title: 'Azure exam dumps: the real cost', text: 'Score cancelled, certifications revoked, exam ban. Free original practice tests instead.', accent: '#ff9f7a' });
  hub('/ai-certifications/', { eyebrow: 'AI certification roadmap', title: 'Which Azure AI certification fits your role?', text: 'AI-103 apps and agents · AI-200 cloud dev · AI-300 MLOps · AB-620 Copilot Studio agents · SC-500 security · AB-100 and AI-500 experts.', accent: '#c9b3ff' });
  hub('/security-certifications/', { eyebrow: 'Security certification roadmap', title: 'Which Microsoft security certification fits your role?', text: 'SC-200 SecOps · SC-300 identity · SC-401 data and AI security · SC-500 cloud and AI security · SC-100 architect.', accent: '#8fcbf7' });
  hub('/github-certifications/', { eyebrow: 'GitHub certification roadmap', title: 'Which GitHub or Copilot certification fits your role?', text: 'GH-300 Copilot · GH-200 Actions · GH-500 Advanced Security · GH-100 Enterprise admin · GH-600 coding agents.', accent: '#9fe870' });
  hub('/platform/', { eyebrow: 'The platform', title: 'One learning engine for every Microsoft certification', text: 'Simulation-first lessons, an offline app, browser-side progress and quality gates on every build. Static, serverless and ready for new exams.', accent: '#ffd75e' });
  cache = m;
  return m;
}

/** Share image path for a page, or null to use the site default. */
export const ogImagePath = (pathname: string) => `/og${pathname === '/' ? '/home' : pathname.replace(/\/$/, '')}.png`;
