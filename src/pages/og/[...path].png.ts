import type { APIRoute, GetStaticPaths } from 'astro';
import { ogPages, ogImagePath } from '../../lib/og-pages';
import { renderCard } from '../../lib/og';

export const getStaticPaths: GetStaticPaths = async () => {
  const pages = await ogPages();
  return [...pages.entries()].map(([pathname, card]) => ({ params: { path: ogImagePath(pathname).replace(/^\/og\//, '').replace(/\.png$/, '') }, props: { card } }));
};

export const GET: APIRoute = async ({ props }) => {
  const png = await renderCard(props.card);
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
