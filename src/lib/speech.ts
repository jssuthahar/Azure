/**
 * Text-to-speech using the browser's built-in Web Speech API (free, no server).
 * Picks the most natural English voice available on the device.
 */
export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

let cached: SpeechSynthesisVoice | null | undefined;
function voice(): SpeechSynthesisVoice | null {
  if (cached !== undefined && cached !== null) return cached;
  const all = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
  const score = (v: SpeechSynthesisVoice) =>
    (/natural|neural|online/i.test(v.name) ? 40 : 0) +
    (/google uk english female|samantha|aria|jenny|libby|sonia|serena|karen|moira/i.test(v.name) ? 25 : 0) +
    (/en-gb/i.test(v.lang) ? 6 : /en-us/i.test(v.lang) ? 5 : /en-in|en-au/i.test(v.lang) ? 4 : 0) +
    (v.localService ? 0 : 3);
  cached = all.sort((a, b) => score(b) - score(a))[0] ?? null;
  return cached;
}
if (canSpeak()) speechSynthesis.addEventListener?.('voiceschanged', () => (cached = undefined));

export function getRate(): number {
  try {
    return Number(localStorage.getItem('voice-rate')) || 1;
  } catch {
    return 1;
  }
}
export function setRate(r: number) {
  try {
    localStorage.setItem('voice-rate', String(r));
  } catch {}
}

/** Speak one chunk of text. Resolves when it finishes (or is cancelled). */
export function speak(text: string, rate = getRate()): Promise<void> {
  return new Promise((resolve) => {
    if (!canSpeak() || !text.trim()) return resolve();
    const clean = text
      .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{20E3}\u{1F1E6}-\u{1F1FF}]/gu, '')
      .replace(/[❮❯→➡️⬇️✓✕]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return resolve();
    const u = new SpeechSynthesisUtterance(clean);
    const v = voice();
    if (v) u.voice = v;
    u.lang = v?.lang ?? 'en-GB';
    u.rate = rate;
    u.pitch = 1.05;
    // Some browsers occasionally never fire onend; never let the reader hang.
    const words = u.text.split(' ').length;
    const guard = setTimeout(resolve, ((words / 2.3) / rate) * 1000 + 2500);
    const done = () => {
      clearTimeout(guard);
      resolve();
    };
    u.onend = done;
    u.onerror = done;
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (canSpeak()) speechSynthesis.cancel();
}

/** Clean visible text of an element for reading aloud (skips buttons and hidden bits). */
export function readableText(el: Element): string {
  const clone = el.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('button, .speak-btn, [aria-hidden="true"], .sr-only, svg, script, style').forEach((n) => n.remove());
  return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
}
