/**
 * Prices across the site are authored in USD (Azure's list currency) and shown
 * in the learner's currency. Default INR; the choice is stored in this browser.
 * Rates are rough, fixed conversions for "price feel", not live FX.
 */
export const CURRENCIES = {
  INR: { name: 'Indian rupee', rate: 88, locale: 'en-IN' },
  USD: { name: 'US dollar', rate: 1, locale: 'en-US' },
  EUR: { name: 'Euro', rate: 0.86, locale: 'de-DE' },
  GBP: { name: 'British pound', rate: 0.76, locale: 'en-GB' },
  MYR: { name: 'Malaysian ringgit', rate: 4.2, locale: 'ms-MY' },
  SGD: { name: 'Singapore dollar', rate: 1.3, locale: 'en-SG' },
  AED: { name: 'UAE dirham', rate: 3.67, locale: 'en-AE' },
  AUD: { name: 'Australian dollar', rate: 1.53, locale: 'en-AU' },
  CAD: { name: 'Canadian dollar', rate: 1.39, locale: 'en-CA' },
  JPY: { name: 'Japanese yen', rate: 152, locale: 'ja-JP' },
  LKR: { name: 'Sri Lankan rupee', rate: 300, locale: 'en-LK' },
} as const;
export type Code = keyof typeof CURRENCIES;
export const DEFAULT: Code = 'INR';
const KEY = 'msdb-currency';

export function getCurrency(): Code {
  try {
    const c = localStorage.getItem(KEY) as Code | null;
    if (c && c in CURRENCIES) return c;
  } catch {}
  return DEFAULT;
}

export function setCurrency(c: Code) {
  try { localStorage.setItem(KEY, c); } catch {}
  window.dispatchEvent(new CustomEvent('currency-change', { detail: c }));
}

/** Format a USD amount in the learner's currency. Small amounts keep more decimals. */
export function money(usd: number, code: Code = getCurrency()) {
  const c = CURRENCIES[code];
  const v = usd * c.rate;
  const digits = code === 'JPY' ? 0 : v === 0 ? 0 : v < 1 ? 3 : v < 100 ? 2 : 0;
  try {
    return new Intl.NumberFormat(c.locale, { style: 'currency', currency: code, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
  } catch {
    return `${code} ${v.toFixed(digits)}`;
  }
}

/** Replace "$12.34" and "0.0480 USD" inside a piece of text/HTML with local money. */
export function localizeText(s: string) {
  return s
    .replace(/\$([0-9][0-9,]*(?:\.[0-9]+)?)/g, (_, n) => money(Number(n.replace(/,/g, ''))))
    .replace(/([0-9][0-9,]*(?:\.[0-9]+)?) USD/g, (_, n) => money(Number(n.replace(/,/g, ''))));
}

/** Paint every [data-usd] element on the page; called on load and on change. */
export function paintPrices(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-usd]').forEach((el) => {
    el.textContent = money(Number(el.dataset.usd)) + (el.dataset.per ?? '');
  });
  root.querySelectorAll<HTMLSelectElement>('select[data-currency]').forEach((sel) => { sel.value = getCurrency(); });
}

/** Options markup for a currency <select>. */
export const currencyOptions = () => (Object.keys(CURRENCIES) as Code[]).map((c) => `<option value="${c}">${c}</option>`).join('');
