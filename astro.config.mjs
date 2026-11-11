// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { rehypeSections } from './src/lib/rehype-sections.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://azure.msdevbuild.com',
  trailingSlash: 'always',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404'),
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
