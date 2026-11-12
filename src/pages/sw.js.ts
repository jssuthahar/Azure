import type { APIRoute } from 'astro';
import source from '../sw/sw.js?raw';

/** The service worker, stamped with the build time so every deploy installs a fresh copy. */
export const GET: APIRoute = () =>
  new Response(source.replace('__VERSION__', new Date().toISOString().replace(/\D/g, '').slice(0, 14)), {
    headers: { 'Content-Type': 'text/javascript; charset=utf-8' },
  });
