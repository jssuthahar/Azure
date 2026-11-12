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
      filter: (page) => !page.includes('/404') && !page.includes('/progress/') && !page.includes('/embed/3d/') && !page.includes('/embed/portal/'),
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
