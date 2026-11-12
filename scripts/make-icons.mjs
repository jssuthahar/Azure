/**
 * App icons for the installable web app (PWA): the author photo in a circle
 * on Azure blue. Run once after changing the photo: `npm run icons`.
 *
 *   public/icons/icon-192.png, icon-512.png   purpose "any"  (photo fills most of the tile)
 *   public/icons/maskable-512.png, -192.png   purpose "maskable" (photo inside the 80% safe zone,
 *                                             so Android's circle / squircle masks never crop the face)
 *   public/apple-touch-icon.png               180×180, iOS home screen (iOS adds its own rounded corners)
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const photo = join(root, 'public/images/author.jpg');
const out = join(root, 'public/icons');
mkdirSync(out, { recursive: true });

async function icon(size, photoRatio, file, rounded = false) {
  const d = Math.round(size * photoRatio);
  const ring = Math.max(2, Math.round(size * 0.022));
  const r = rounded ? Math.round(size * 0.22) : 0;
  const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a8cff"/><stop offset="1" stop-color="#0058a3"/></linearGradient></defs>
    <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${d / 2 + ring}" fill="#fff"/>
  </svg>`);
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}"><circle cx="${d / 2}" cy="${d / 2}" r="${d / 2}" fill="#fff"/></svg>`);
  const face = await sharp(photo).resize(d, d, { fit: 'cover', position: 'attention' }).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  await sharp(bg).composite([{ input: face, left: Math.round((size - d) / 2), top: Math.round((size - d) / 2) }]).png({ compressionLevel: 9 }).toFile(file);
  console.log('wrote', file.replace(root + '/', ''));
}

await icon(192, 0.8, join(out, 'icon-192.png'), true);
await icon(512, 0.8, join(out, 'icon-512.png'), true);
await icon(192, 0.6, join(out, 'maskable-192.png'));
await icon(512, 0.6, join(out, 'maskable-512.png'));
await icon(180, 0.8, join(root, 'public/apple-touch-icon.png'));
