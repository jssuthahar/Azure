import type { APIRoute } from 'astro';
import { examStaticPaths } from '../../data/exams';
import { buildAskIndex } from '../../lib/ask-index';

/** /<exam>/ask-index.json: the Ask chatbot's answer index for one exam. */
export function getStaticPaths() {
  return examStaticPaths();
}

export const GET: APIRoute = async ({ params }) =>
  new Response(JSON.stringify(await buildAskIndex(params.cert!)), { headers: { 'Content-Type': 'application/json' } });
