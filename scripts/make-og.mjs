// Renders public/og-default.png (1200x630 social card) from inline SVG with sharp.
import sharp from 'sharp';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#006cbe"/><stop offset="1" stop-color="#003a66"/></linearGradient></defs>
<rect width="1200" height="630" fill="url(#g)"/>
<circle cx="1050" cy="90" r="260" fill="#ffffff" opacity=".06"/><circle cx="1120" cy="560" r="200" fill="#ffffff" opacity=".05"/>
<text x="80" y="120" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="34" font-weight="700" fill="#8fcbf7">MSDEVBUILD / azure</text>
<text x="80" y="160" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="24" fill="#c7e0f4">Multi-Stack Dev Build · by Suthahar Jegatheesan</text>
<text x="80" y="270" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="84" font-weight="800" fill="#fff">Learn Azure.</text>
<text x="80" y="370" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="84" font-weight="800" fill="#fff">Pass AZ-900.</text>
<text x="80" y="470" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="36" fill="#deecf9">Free tutorials · quizzes · mock exams · interview prep</text>
<path d="M880 470h190a60 60 0 0 0 9-119.4A86 86 0 0 0 914 334a66 66 0 0 0-34 136z" fill="#fff" opacity=".95"/>
<circle cx="950" cy="410" r="12" fill="#0b1020"/><circle cx="1010" cy="410" r="12" fill="#0b1020"/>
<path d="M960 440q20 16 40 0" fill="none" stroke="#0b1020" stroke-width="7" stroke-linecap="round"/>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile(new URL('../public/og-default.png', import.meta.url).pathname);
console.log('wrote public/og-default.png');
