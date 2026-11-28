/**
 * Optional Google sign-in. The site never requires it: signed out, everything
 * works from this browser as before. Signing in only adds sync across devices.
 *
 * To keep pages fast, Firebase Auth loads only when the learner clicks
 * Sign in, or when a cached hint says they signed in before.
 * The UI reads `<html data-auth="in|out">` and `[data-account-*]` hooks.
 */
import type { User, AuthProvider } from 'firebase/auth';
import type { AuthProviderId } from '../../config';
import type {} from '@msdevbuild/config/account'; // declares window.msdbAccount
// One sign-in across MSDEVBUILD sites (shared with the blog): see msdevbuild-config src/sso.ts.
import { ssoShare, ssoToken, ssoSignOut, ssoState, ssoSignedOutElsewhere } from '@msdevbuild/config/sso';

/** Set while this site is signing someone in, so that sign-in is shared rather than undone. */
let fresh = false;
let triedSso = false;
let firstReport = true;

const HINT = 'msdb-user';
export interface Hint { uid: string; name: string; email: string; photo: string }

export const hint = (): Hint | null => { try { return JSON.parse(localStorage.getItem(HINT) || 'null'); } catch { return null; } };
const setHint = (h: Hint | null) => { try { h ? localStorage.setItem(HINT, JSON.stringify(h)) : localStorage.removeItem(HINT); } catch { /* blocked */ } };

function render(h: Hint | null) {
  document.documentElement.dataset.auth = h ? 'in' : 'out';
  window.dispatchEvent(new CustomEvent('msdb-auth', { detail: h }));
}

let watching = false;
async function watch() {
  if (watching) return;
  watching = true;
  const [{ onAuthStateChanged, getRedirectResult }, { auth }, { startSync, stopSync }] = await Promise.all([import('firebase/auth'), import('./firebase'), import('./sync')]);
  const a = await auth();
  // The shared profile editor (msdevbuild-config ProfileDialog) talks to this sign-in through window.msdbAccount.
  window.msdbAccount = {
    user: hint,
    idToken: async () => (a.currentUser ? a.currentUser.getIdToken() : null),
    setDisplayName: async (name: string) => {
      if (!a.currentUser) return;
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(a.currentUser, { displayName: name });
      const h = hint();
      if (h) { const next = { ...h, name }; setHint(next); render(next); }
    },
  };
  getRedirectResult(a).then((r) => { if (r) countSignIn(r); }).catch(() => {});
  onAuthStateChanged(a, async (u: User | null) => {
    try { if (sessionStorage.getItem('msdb-auth-redirect')) fresh = true; } catch { /* blocked */ }
    // Only the first report on a page is the remembered user (see msdevbuild-config src/account.ts).
    const remembered = firstReport && !fresh;
    firstReport = false;
    if (u && remembered && ssoSignedOutElsewhere()) {
      // Remembered from before, but they signed out on the blog since.
      const { signOut: out } = await import('firebase/auth');
      await out(a);
      return;
    }
    if (!u && !triedSso) {
      // Signed out here: signed in on the blog? Then sign in quietly.
      triedSso = true;
      const token = await ssoToken();
      if (token) {
        try { fresh = true; const { signInWithCustomToken } = await import('firebase/auth'); await signInWithCustomToken(a, token); return; } catch { fresh = false; }
      }
    }
    if (u) {
      if (ssoState() !== 'in') void u.getIdToken().then(ssoShare).catch(() => {});
      const h = { uid: u.uid, name: u.displayName || 'Learner', email: u.email || '', photo: u.photoURL || '' };
      setHint(h);
      render(h);
      startSync(u);
    } else {
      stopSync();
      setHint(null);
      render(null);
    }
    try { sessionStorage.removeItem('msdb-auth-redirect'); } catch { /* blocked */ }
  });
}

async function countSignIn(cred: unknown) {
  const { getAdditionalUserInfo } = await import('firebase/auth');
  if (getAdditionalUserInfo(cred as Parameters<typeof getAdditionalUserInfo>[0])?.isNewUser) (await import('./track')).track('signin');
}

async function makeProvider(id: AuthProviderId): Promise<AuthProvider> {
  const m = await import('firebase/auth');
  if (id === 'microsoft') { const p = new m.OAuthProvider('microsoft.com'); p.setCustomParameters({ prompt: 'select_account' }); return p; }
  if (id === 'linkedin') { const p = new m.OAuthProvider('oidc.linkedin'); p.addScope('openid'); p.addScope('profile'); p.addScope('email'); return p; }
  const p = new m.GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' });
  return p;
}

export async function signIn(id: AuthProviderId = 'google') {
  window.dispatchEvent(new CustomEvent('msdb-sync', { detail: { state: 'signing-in', provider: id } }));
  try { sessionStorage.setItem('msdb-auth-redirect', '1'); } catch { /* blocked */ }
  try {
    const [{ signInWithPopup, signInWithRedirect }, { auth }] = await Promise.all([import('firebase/auth'), import('./firebase')]);
    const a = await auth();
    void watch();
    fresh = true;
    const provider = await makeProvider(id);
    try {
      countSignIn(await signInWithPopup(a, provider));
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      // Installed app on iOS and strict popup blockers: fall back to a full-page redirect.
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') await signInWithRedirect(a, provider);
      else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') { fresh = false; throw e; }
      else { fresh = false; window.dispatchEvent(new CustomEvent('msdb-sync', { detail: { state: 'idle' } })); }
    }
  } catch (e) {
    window.dispatchEvent(new CustomEvent('msdb-sync', { detail: { state: 'error', signin: true, code: (e as { code?: string })?.code ?? '', error: String((e as Error)?.message ?? e) } }));
  }
}

/** Signs out here and on every MSDEVBUILD site. */
export async function signOut() {
  await ssoSignOut();
  const [{ signOut: out }, { auth }, { stopSync }] = await Promise.all([import('firebase/auth'), import('./firebase'), import('./sync')]);
  stopSync();
  await out(await auth());
  setHint(null);
  render(null);
}

/** Remove the signed-in learner's cloud copy (progress on this device is kept), then sign out. */
export async function deleteCloudData() {
  const [{ doc, deleteDoc }, { auth, db }, { stopSync }] = await Promise.all([import('firebase/firestore/lite'), import('./firebase'), import('./sync')]);
  const a = await auth();
  const u = a.currentUser;
  if (!u) return false;
  stopSync(false);
  await deleteDoc(doc(await db(), 'users', u.uid));
  await signOut();
  return true;
}

/** Called once per page. */
export function initAccount() {
  const h = hint();
  render(h);
  // Signed in before (or coming back from a redirect sign-in): confirm with Firebase in the background.
  const back = /[?&](apiKey|authType)=/.test(location.search) || sessionStorage.getItem('msdb-auth-redirect');
  // Also when signed in on the blog (sso): Firebase loads and signs in quietly.
  if (h || back || ssoState() === 'in') {
    const go = () => void watch();
    'requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 3000 }) : setTimeout(go, 1);
  }
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    // [data-account-signin] opens the sign-in dialog (SignInDialog.astro); this handles sign-out.
    if (t.closest?.('[data-account-signout]')) { e.preventDefault(); void signOut(); }
  });
}
