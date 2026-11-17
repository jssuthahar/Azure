/**
 * Self-hosted Firebase Auth helper (so Google shows "continue to azure.msdevbuild.com"
 * instead of msdevbuild-azure.firebaseapp.com). Copies Firebase's sign-in handler into
 * public/__/auth/ and writes public/__/firebase/init.json.
 *
 *   npm run auth-helper     re-run every few months, or if sign-in starts failing
 *
 * GitHub Pages serves /__/auth/handler from handler.html (extensionless URLs map to .html).
 * See https://firebase.google.com/docs/auth/web/redirect-best-practices (option 4).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { FIREBASE_SOURCE, AUTH_HOST } from './auth-helper.config.mjs';

const out = 'public/__/auth';
mkdirSync(out, { recursive: true });
mkdirSync('public/__/firebase', { recursive: true });
const files = { handler: 'handler.html', 'handler.js': 'handler.js', 'experiments.js': 'experiments.js', iframe: 'iframe.html', 'iframe.js': 'iframe.js' };
for (const [src, dest] of Object.entries(files)) {
  const r = await fetch(`https://${FIREBASE_SOURCE.authDomain}/__/auth/${src}`);
  if (!r.ok) throw new Error(`${src}: HTTP ${r.status}`);
  const body = await r.text();
  writeFileSync(`${out}/${dest}`, body);
  console.log(`✓ ${out}/${dest} (${body.length.toLocaleString()} bytes)`);
}
writeFileSync('public/__/firebase/init.json', JSON.stringify({ ...FIREBASE_SOURCE, authDomain: AUTH_HOST }, null, 2) + '\n');
console.log('✓ public/__/firebase/init.json');
