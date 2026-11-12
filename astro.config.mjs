// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { rehypeSections } from './src/lib/rehype-sections.mjs';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Sitemap <lastmod>: each lesson's real `updated:` date from its frontmatter.
const SITE_URL = 'https://azure.msdevbuild.com';
const lastmod = new Map();
const walk = (dir) => readdirSync(dir).forEach((f) => {
  const p = join(dir, f);
  if (statSync(p).isDirectory()) return walk(p);
  if (!p.endsWith('.mdx')) return;
  const m = readFileSync(p, 'utf8').match(/^updated:\s*(\S+)/m);
  const rel = p.split('src/content/tutorials/')[1].replace(/\.mdx$/, '');
  if (m) lastmod.set(`${SITE_URL}/${rel}/`, new Date(m[1]).toISOString());
});
walk(new URL('./src/content/tutorials', import.meta.url).pathname);
const newest = [...lastmod.values()].sort().at(-1);

// https://astro.build/config
export default defineConfig({
  site: 'https://azure.msdevbuild.com',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/offline/') && !page.includes('/progress/') && !page.includes('/embed/3d/') && !page.includes('/embed/portal/') && !page.includes('/embed/lab/'),
      serialize(item) {
        item.lastmod = lastmod.get(item.url) ?? newest;
        return item;
      },
    }),
  ],
  markdown: {
    rehypePlugins: [rehypeSections],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
    },
  },
  vite: {
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
