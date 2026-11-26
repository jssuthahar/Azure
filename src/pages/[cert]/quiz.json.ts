import type { APIRoute } from 'astro';
import { examStaticPaths } from '../../data/exams';
import { getQuestionBank } from '../../lib/learn';

/**
 * /<exam>/quiz.json: the "Quiz me" pool for Ask Nimbus. Single-answer questions
 * from this site's own original practice bank (never real exam content), with
 * the same ids as Smart practice, so answers feed the same review deck.
 * Loaded only when a learner taps Quiz me.
 */
export function getStaticPaths() {
  return examStaticPaths();
}

export const GET: APIRoute = async ({ params }) => {
  const bank = await getQuestionBank(params.cert!);
  const pool = bank
    .filter((q) => q.type === 'single' && q.answer.length === 1)
    .map((q) => ({ id: q.id, s: q.scenario, q: q.question, o: q.options.map((o) => o.text), a: q.answer[0], e: q.explanation, t: q.topic }));
  return new Response(JSON.stringify(pool), { headers: { 'Content-Type': 'application/json' } });
};
