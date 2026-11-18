/**
 * Firestore security rules, tested against the local emulator (no real project touched).
 *
 *   npm run test:rules      (starts the emulator, runs this, stops it)
 *
 * Each "person" is its own Firestore Lite client with a mock sign-in token.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, serverTimestamp, setLogLevel } from 'firebase/firestore/lite';

setLogLevel('silent'); // denied writes are expected here

const PROJECT = process.env.GCLOUD_PROJECT || 'demo-msdb';
const HOST = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':');

const client = (uid) => {
  const app = initializeApp({ projectId: PROJECT, apiKey: 'test' }, uid || 'anon');
  const db = getFirestore(app);
  connectFirestoreEmulator(db, HOST[0], Number(HOST[1]), uid ? { mockUserToken: { sub: uid, user_id: uid } } : undefined);
  return db;
};
const anon = client(null), alice = client('alice'), bob = client('bob');
await fetch(`http://${HOST[0]}:${HOST[1]}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });

let pass = 0;
const fails = [];
async function expect(ok, name, fn) {
  let got = true, err = '';
  try { await fn(); } catch (e) { got = false; err = e.code || e.message; }
  if (got === ok) pass++;
  else fails.push(`${name}: expected ${ok ? 'allowed' : 'denied'}, got ${got ? 'allowed' : `denied (${err})`}`);
}

/* ---------- users (progress sync) ---------- */
await expect(true, 'users: owner writes own doc with notes', () => setDoc(doc(alice, 'users', 'alice'), { v: { progress: '{}', notes: '{}' }, updatedAt: serverTimestamp() }));
await expect(false, 'users: someone else writes it', () => setDoc(doc(bob, 'users', 'alice'), { v: {}, updatedAt: serverTimestamp() }));
await expect(false, 'users: unknown key in v', () => setDoc(doc(alice, 'users', 'alice'), { v: { other: 'x' }, updatedAt: serverTimestamp() }));
await expect(false, 'users: read someone else', () => getDoc(doc(bob, 'users', 'alice')));

/* ---------- usage counters still work ---------- */
await expect(true, 'stats: add 1', () => setDoc(doc(anon, 'stats', 'total__visit'), { n: 1 }));
await expect(false, 'stats: add 5', () => setDoc(doc(anon, 'stats', 'total__visit'), { n: 6 }));
await expect(false, 'anything else is closed', () => setDoc(doc(alice, 'other', 'x'), { a: 1 }));

console.log(`rules: ${pass} passed, ${fails.length} failed`);
for (const f of fails) console.log(`  ✗ ${f}`);
process.exit(fails.length ? 1 : 0);
