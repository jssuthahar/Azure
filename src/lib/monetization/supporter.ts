/**
 * Supporter status. A supporter sees no ads anywhere and gets a "Supporter 💙" badge.
 *
 * TODO(payments): this is a browser stub. Real status must come from the signed-in user's
 * profile (users/<uid>.isSupporter), written only by a payment webhook (Buy Me a Coffee
 * membership or similar) and protected in firestore.rules so a learner can't set it.
 * Until then, `localStorage['msdb-supporter-v1'] = '1'` marks this browser as a supporter.
 */
export const SUPPORTER_KEY = 'msdb-supporter-v1';

export function isSupporter(): boolean {
  try { return localStorage.getItem(SUPPORTER_KEY) === '1'; } catch { return false; }
}
