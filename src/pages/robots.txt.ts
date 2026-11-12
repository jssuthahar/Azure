import type { APIRoute } from 'astro';

/**
 * robots.txt: open to search engines and AI assistants (SEO + GEO). Embed
 * frames duplicate lesson simulations, so crawlers skip them; progress is
 * personal. llms.txt / llms-full.txt describe the site for AI assistants.
 */
const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'CCBot'];

export const GET: APIRoute = ({ site }) => {
  const rules = ['Allow: /', 'Disallow: /progress/', 'Disallow: /embed/3d/', 'Disallow: /embed/portal/', 'Disallow: /embed/lab/'];
  const body = [
    'User-agent: *', ...rules, '',
    '# AI assistants and answer engines are welcome to read and cite this site.',
    ...AI_BOTS.flatMap((b) => [`User-agent: ${b}`, ...rules, '']),
    `Sitemap: ${new URL('/sitemap-index.xml', site)}`,
    `# AI-readable site map: ${new URL('/llms.txt', site)}`,
    `# AI-readable full answers: ${new URL('/llms-full.txt', site)}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
