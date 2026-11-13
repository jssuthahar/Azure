/**
 * "AZ-900 Ready" practice certificate. Issued in the browser after passing a
 * full mock exam (scaled score ≥ 700), stored in localStorage, and shared as a
 * link whose query string carries the details plus a checksum so casual edits
 * are detected. There is no server: this is a self-assessed practice
 * certificate, never a Microsoft certification.
 */
import type { MockResult } from './progress';

const KEY = 'msdb-azure-cert-v1';
export const PASS_SCALED = 700;

export interface Cert { name: string; id: string; percent: number; scaled: number; date: string }

/** Small non-cryptographic hash (FNV-1a), base36. Detects edits, not forgery. */
function fnv(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}
const SALT = 'msdevbuild-az900-ready';
export const checksum = (c: Cert) => fnv(`${SALT}|${c.name}|${c.id}|${c.percent}|${c.scaled}|${c.date}`);

export const eligible = (m?: MockResult) => !!m && m.mode === 'full' && m.scaled >= PASS_SCALED;

export function bestFullMock(mocks: MockResult[]) {
  return mocks.filter(eligible).sort((a, b) => b.scaled - a.scaled)[0];
}

export function loadCert(): Cert | null {
  try { const raw = localStorage.getItem(KEY); return raw ? (JSON.parse(raw) as Cert) : null; } catch { return null; }
}

export function issueCert(name: string, m: MockResult): Cert {
  const date = m.at.slice(0, 10);
  const id = `MSDB-AZ900-${fnv(`${name}|${m.at}`).toUpperCase().padStart(7, '0').slice(0, 7)}`;
  const cert: Cert = { name: name.trim().slice(0, 60), id, percent: m.percent, scaled: m.scaled, date };
  try { localStorage.setItem(KEY, JSON.stringify(cert)); } catch {}
  window.dispatchEvent(new CustomEvent('progress-change'));
  return cert;
}

export function certUrl(c: Cert, origin = location.origin) {
  const q = new URLSearchParams({ n: c.name, id: c.id, p: String(c.percent), s: String(c.scaled), d: c.date, c: checksum(c) });
  return `${origin}/certificate/?${q}`;
}

export function certFromUrl(search: string): { cert: Cert; valid: boolean } | null {
  const q = new URLSearchParams(search);
  const name = q.get('n'), id = q.get('id'), d = q.get('d');
  if (!name || !id || !d) return null;
  const cert: Cert = { name, id, percent: Number(q.get('p')), scaled: Number(q.get('s')), date: d };
  return { cert, valid: q.get('c') === checksum(cert) && cert.scaled >= PASS_SCALED };
}

/** LinkedIn "Add to profile → Licenses & certifications" link. */
export function linkedInAddUrl(c: Cert) {
  const [y, m] = c.date.split('-');
  const q = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME', name: 'AZ-900 Ready (Azure Fundamentals practice)', organizationName: 'MSDEVBUILD',
    issueYear: y, issueMonth: String(Number(m)), certUrl: certUrl(c), certId: c.id,
  });
  return `https://www.linkedin.com/profile/add?${q}`;
}

const escX = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const prettyDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** The badge as SVG (square, 600×600). */
export function badgeSvg(size = 600) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="${size}" height="${size}" role="img" aria-label="AZ-900 Ready badge">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0078d4"/><stop offset="1" stop-color="#5c2d91"/></linearGradient></defs>
  <polygon points="300,22 541,161 541,439 300,578 59,439 59,161" fill="url(#bg)"/>
  <polygon points="300,52 515,176 515,424 300,548 85,424 85,176" fill="none" stroke="#ffd75e" stroke-width="6"/>
  <text x="300" y="215" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="40" font-weight="700" fill="#ffd75e" letter-spacing="6">MSDEVBUILD</text>
  <text x="300" y="320" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="104" font-weight="800" fill="#fff">AZ-900</text>
  <rect x="160" y="352" width="280" height="66" rx="33" fill="#ffd75e"/>
  <text x="300" y="398" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="40" font-weight="800" fill="#1b2a3d" letter-spacing="4">READY</text>
  <text x="300" y="470" text-anchor="middle" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="24" fill="#deecf9">Azure Fundamentals · practice</text>
</svg>`;
}

/** The certificate as SVG (1600×1130). */
export function certSvg(c: Cert) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1130" width="1600" height="1130" role="img" aria-label="AZ-900 Ready certificate for ${escX(c.name)}">
  <rect width="1600" height="1130" fill="#fbfdff"/>
  <rect x="30" y="30" width="1540" height="1070" rx="28" fill="none" stroke="#0078d4" stroke-width="10"/>
  <rect x="56" y="56" width="1488" height="1018" rx="18" fill="none" stroke="#ffb900" stroke-width="3"/>
  <path d="M30 230 C 400 120, 1200 340, 1570 200 L1570 58 Q1570 30 1542 30 L58 30 Q30 30 30 58 Z" fill="#0078d4" opacity=".08"/>
  <g transform="translate(1270 110) scale(0.42)">${badgeSvg(600).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>
  <text x="120" y="170" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="34" font-weight="700" fill="#0078d4" letter-spacing="8">MSDEVBUILD AZURE</text>
  <text x="120" y="206" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="24" fill="#4a5163">Multi-Stack Dev Build</text>
  <text x="120" y="290" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="78" font-weight="800" fill="#0b1020">Certificate of Achievement</text>
  <text x="120" y="370" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="32" fill="#4a5163">This certifies that</text>
  <text x="120" y="490" font-family="Georgia, 'Times New Roman', serif" font-size="96" font-style="italic" fill="#003a66">${escX(c.name)}</text>
  <line x1="120" y1="520" x2="1180" y2="520" stroke="#c7d6e6" stroke-width="3"/>
  <text x="120" y="600" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="34" fill="#0b1020">passed the full <tspan font-weight="700">AZ-900 Azure Fundamentals mock exam</tspan> on MSDEVBUILD</text>
  <text x="120" y="652" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="34" fill="#0b1020">and is <tspan font-weight="800" fill="#107c10">AZ-900 Ready</tspan> with a score of <tspan font-weight="700">${c.percent}%</tspan> (≈ ${c.scaled}/1000).</text>
  <g font-family="Segoe UI, Inter, Arial, sans-serif" fill="#4a5163" font-size="26">
    <text x="120" y="820">DATE</text><text x="120" y="862" font-size="34" fill="#0b1020" font-weight="600">${prettyDate(c.date)}</text>
    <text x="620" y="820">CERTIFICATE ID</text><text x="620" y="862" font-size="34" fill="#0b1020" font-weight="600">${escX(c.id)}</text>
    <text x="1120" y="820">ISSUED BY</text><text x="1120" y="862" font-size="34" fill="#0b1020" font-weight="600">Suthahar Jegatheesan</text><text x="1120" y="898" font-size="24">MSDEVBUILD · Multi-Stack Dev Build</text>
  </g>
  <text x="120" y="1010" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="21" fill="#6b7280">Self-assessed practice certificate issued by azure.msdevbuild.com after a browser-based mock exam. It is not a Microsoft certification and is not affiliated with or endorsed by Microsoft.</text>
  <text x="120" y="1042" font-family="Segoe UI, Inter, Arial, sans-serif" font-size="21" fill="#6b7280">Check this certificate: azure.msdevbuild.com/certificate · ID ${escX(c.id)}</text>
</svg>`;
}

/** Render an SVG string to a PNG and download it. */
export async function downloadPng(svg: string, filename: string, w: number, h: number) {
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url; });
  const canvas = Object.assign(document.createElement('canvas'), { width: w, height: h });
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(url);
  const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), 'image/png'));
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: filename });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
