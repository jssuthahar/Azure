/**
 * Per-page social share cards (1200×630 PNG) rendered at build time with
 * sharp. Used for og:image / twitter:image on lessons, comparisons, service
 * pages and "What happens if…?" pages, so every shared link has its own card.
 */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (s: string) => s.replace(/\*\*|`/g, '').replace(/\s+/g, ' ').trim();

/** Greedy word wrap by character budget, max lines, with an ellipsis. */
function wrap(text: string, perLine: number, maxLines: number) {
  const words = plain(text).split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > perLine) { lines.push(cur.trim()); cur = w; if (lines.length === maxLines) break; }
    else cur = `${cur} ${w}`;
  }
  if (lines.length < maxLines && cur.trim()) lines.push(cur.trim());
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) lines[maxLines - 1] = lines[maxLines - 1].replace(/[\s,.;:]*$/, '') + '…';
  return lines;
}

let photo = '';
const authorPhoto = () => {
  if (!photo) photo = `data:image/jpeg;base64,${readFileSync(join(process.cwd(), 'public/images/author-160.jpg')).toString('base64')}`;
  return photo;
};

export interface Card { eyebrow: string; title: string; text?: string; accent?: string; badge?: string }

export async function renderCard({ eyebrow, title, text = '', accent = '#ffd75e', badge }: Card): Promise<Buffer> {
  const titleLines = wrap(title, title.length > 60 ? 30 : 24, 3);
  const size = titleLines.length > 2 || title.length > 50 ? 58 : 70;
  const textLines = wrap(text, 58, 2);
  const titleY = 215;
  const lh = size * 1.12;
  const textY = titleY + titleLines.length * lh + 30;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a5ea8"/><stop offset="1" stop-color="#062c4f"/></linearGradient>
    <clipPath id="c"><circle cx="1080" cy="96" r="46"/></clipPath>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="1120" cy="560" r="230" fill="#fff" opacity=".05"/><circle cx="-40" cy="-20" r="220" fill="#fff" opacity=".05"/>
  <text x="80" y="110" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="30" font-weight="700" fill="#8fcbf7" letter-spacing="1">MSDEVBUILD / azure</text>
  <circle cx="1080" cy="96" r="50" fill="#fff" opacity=".9"/>
  <image href="${authorPhoto()}" xlink:href="${authorPhoto()}" x="1034" y="50" width="92" height="92" clip-path="url(#c)" preserveAspectRatio="xMidYMid slice"/>
  <rect x="80" y="140" width="${Math.min(1000, 44 + eyebrow.length * 17.5)}" height="40" rx="20" fill="${accent}"/>
  <text x="100" y="168" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="22" font-weight="800" fill="#062c4f" letter-spacing="1.5">${xml(eyebrow.toUpperCase())}</text>
  ${titleLines.map((l, i) => `<text x="80" y="${titleY + 50 + i * lh}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="${size}" font-weight="800" fill="#fff">${xml(l)}</text>`).join('')}
  ${textLines.map((l, i) => `<text x="80" y="${textY + 30 + i * 40}" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="30" fill="#deecf9">${xml(l)}</text>`).join('')}
  <rect x="0" y="560" width="1200" height="70" fill="#000" opacity=".22"/>
  <text x="80" y="604" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="23" fill="#fff"><tspan font-weight="700">MSDEVBUILD</tspan> · Multi-Stack Dev Build</text>
  ${badge ? `<text x="1120" y="604" text-anchor="end" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="26" font-weight="700" fill="${accent}">${xml(badge)}</text>` : ''}
</svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer();
}
