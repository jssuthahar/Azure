import { inlineMd } from './learn';
/**
 * Markdown-ish text → HTML where every "$12.34" becomes a currency-aware span
 * (painted client-side in the learner's currency; the USD text is the fallback).
 */
export function priceHtml(s: string): string {
  return inlineMd(s).replace(/\$([0-9][0-9,]*(?:\.[0-9]+)?)/g, (m, n) => `<span data-usd="${n.replace(/,/g, '')}">${m}</span>`);
}
