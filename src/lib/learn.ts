import { getCollection, type CollectionEntry } from 'astro:content';
import type { SyllabusModule, SyllabusTopic } from '../data/types';
import { getExam, PRIMARY_EXAM } from '../data/exams';
import type { Question } from '../content.config';

export const topicUrl = (moduleSlug: string, topicSlug: string, cert = PRIMARY_EXAM) => `/${cert}/${moduleSlug}/${topicSlug}/`;
export const moduleUrl = (moduleSlug: string, cert = PRIMARY_EXAM) => `/${cert}/${moduleSlug}/`;
export const topicKey = (moduleSlug: string, topicSlug: string, cert = PRIMARY_EXAM) => `${cert}/${moduleSlug}/${topicSlug}`;

export interface NavTopic extends SyllabusTopic {
  module: SyllabusModule;
  url: string;
  key: string;
  published: boolean;
}

/** Every syllabus topic of an exam, in teaching order, flagged with whether its tutorial exists. */
export async function getNav(cert = PRIMARY_EXAM): Promise<NavTopic[]> {
  const entries = await getCollection('tutorials');
  const ids = new Set(entries.map((e) => e.id));
  return getExam(cert).modules.flatMap((module) =>
    module.topics.map((t) => {
      const key = topicKey(module.slug, t.slug, cert);
      return { ...t, module, url: topicUrl(module.slug, t.slug, cert), key, published: ids.has(key) };
    }),
  );
}

export async function getTutorial(key: string): Promise<CollectionEntry<'tutorials'> | undefined> {
  return (await getCollection('tutorials')).find((e) => e.id === key);
}

export interface BankQuestion extends Question {
  domain: number;
  topic?: string;
}

/**
 * Authors tend to write the correct option first. Shuffle every question's
 * options at build time — deterministically, seeded by the question id, so a
 * question always looks the same but the right answer is not always "A".
 * Options whose text refers to other options' positions must not be used.
 */
function shuffleOptions<T extends Question>(q: T): T {
  let h = 2166136261;
  for (const ch of q.id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const order = q.options.map((_, i) => i);
  // Yes/No questions keep their natural order.
  if (!(q.options.length === 2 && /^yes$/i.test(q.options[0].text))) {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
  return { ...q, options: order.map((i) => q.options[i]), answer: q.answer.map((a) => order.indexOf(a)).sort((a, b) => a - b) };
}

export async function getQuestionBank(cert = PRIMARY_EXAM): Promise<BankQuestion[]> {
  const files = await getCollection('questions', (f) => f.data.cert === cert);
  return files.flatMap((f) => f.data.questions.map((q) => shuffleOptions({ ...q, domain: f.data.domain, topic: f.data.topic })));
}

export async function getTopicQuestions(topicSlug: string, cert = PRIMARY_EXAM): Promise<Question[]> {
  const files = await getCollection('questions', (f) => f.data.cert === cert && f.data.topic === topicSlug);
  return files.flatMap((f) => f.data.questions.map(shuffleOptions));
}

/** Strip the light inline markdown we allow in data strings (**bold**, `code`). */
export function inlineMd(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}
