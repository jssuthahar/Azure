// Notify Bing/Yandex/Seznam (IndexNow) that pages changed. Run AFTER deploying:
//   npm run build && npm run indexnow            (all sitemap URLs)
//   npm run indexnow -- /az-900/compare/ /about/ (only these paths)
// The key file public/088f38d0dd1ec5d67d4f0a6e3be77692.txt must be live on the site first.
import { readFileSync, readdirSync } from 'node:fs';
const HOST = 'azure.msdevbuild.com';
const KEY = '088f38d0dd1ec5d67d4f0a6e3be77692';
const args = process.argv.slice(2);
let urls = args.map((p) => `https://${HOST}${p.startsWith('/') ? p : '/' + p}`);
if (!urls.length) {
  const dist = new URL('../dist/', import.meta.url);
  const xml = readdirSync(dist).filter((f) => /^sitemap-\d+\.xml$/.test(f)).map((f) => readFileSync(new URL(f, dist), 'utf8')).join('');
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls.slice(0, 10000) }),
});
console.log(`IndexNow: submitted ${urls.length} URL(s) → HTTP ${res.status} ${res.statusText}`);
