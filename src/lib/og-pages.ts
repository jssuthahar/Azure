/** Which pages get their own share card, and what it says. Keyed by page path. */
import { getCollection } from 'astro:content';
import { getNav } from './learn';
import { MODULES } from '../data/az-900/syllabus';
import { COMPARISONS } from '../data/az-900/compare';
import { SERVICES } from '../data/az-900/services';
import { WHATIFS } from '../data/az-900/whatifs';
import type { Card } from './og';

let cache: Map<string, Card> | null = null;

export async function ogPages(): Promise<Map<string, Card>> {
  if (cache) return cache;
  const m = new Map<string, Card>();
  const nav = (await getNav()).filter((t) => t.published);
  const entries = await getCollection('tutorials');
  for (const t of nav) {
    const d = entries.find((e) => e.id === t.key)!.data;
    m.set(t.url, { eyebrow: `AZ-900 · ${t.module.shortTitle}`, title: d.title, text: d.answer, badge: '3D + portal simulation' });
  }
  for (const c of COMPARISONS) m.set(`/az-900/compare/${c.slug}/`, { eyebrow: 'Compare', title: c.title, text: c.answer, accent: '#9fe870', badge: 'Side by side' });
  for (const s of SERVICES) m.set(`/az-900/services/${s.slug}/`, { eyebrow: `${s.cat} · in 60 seconds`, title: s.name, text: s.what, accent: '#8fcbf7', badge: `AWS: ${s.aws}`.slice(0, 34) });
  for (const w of WHATIFS) m.set(`/simulator/${w.slug}/`, { eyebrow: 'What happens if…?', title: w.q, text: w.answer, accent: '#ff9f7a', badge: '▶ Simulate it' });
  const hub = (p: string, c: Card) => m.set(p, c);
  hub('/', { eyebrow: 'Free AZ-900 course', title: 'Feel Azure without an Azure account', text: '3D simulations, Azure portal walkthroughs and practice labs in every lesson, plus a real-exam-style mock exam and certificate.' });
  hub('/az-900/', { eyebrow: 'Microsoft Azure Fundamentals', title: 'AZ-900 course and syllabus', text: MODULES.map((x) => x.title).join(' · ') });
  hub('/az-900/mock-exam/', { eyebrow: 'Real exam experience', title: 'AZ-900 mock exam', text: 'Timer, review screen, drag and drop, build list, drop-down and Yes/No items. Scored 1–1000, 700 to pass, with a certificate.', accent: '#9fe870' });
  hub('/certificate/', { eyebrow: 'Free certificate', title: 'AZ-900 Ready certificate', text: 'Pass the full mock exam and share your certificate on LinkedIn, X and WhatsApp.', accent: '#ffd75e' });
  hub('/simulator/', { eyebrow: 'Azure Simulator', title: 'Break Azure on purpose, safely', text: 'Pull the plug on a datacenter, survive a Black Friday spike, see a forgotten-VM bill, measure latency.', accent: '#ff9f7a' });
  hub('/az-900/compare/', { eyebrow: 'Compare', title: 'Which Azure service should I use?', text: 'Blob vs Files vs Disk, VM vs App Service vs Functions, LRS vs GRS, Azure vs AWS and more.', accent: '#9fe870' });
  hub('/az-900/services/', { eyebrow: 'Reference', title: 'Every Azure service in 60 seconds', text: 'What it is, when to use it, price feel in your currency and a simulation.', accent: '#8fcbf7' });
  hub('/az-900/glossary/', { eyebrow: 'Reference', title: 'Azure glossary', text: 'Every AZ-900 term explained in one line, linked to a lesson and a simulation.', accent: '#8fcbf7' });
  hub('/az-900/labs/', { eyebrow: 'Practice labs', title: 'Click through a simulated Azure portal', text: 'Guided tasks in a simulated portal and Cloud Shell. Education only, no Azure account needed.' });
  cache = m;
  return m;
}

/** Share image path for a page, or null to use the site default. */
export const ogImagePath = (pathname: string) => `/og${pathname === '/' ? '/home' : pathname.replace(/\/$/, '')}.png`;
