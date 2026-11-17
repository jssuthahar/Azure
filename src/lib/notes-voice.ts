/**
 * "Read my notes": Nimbus reads the learner's highlights and notes aloud with
 * the browser's own voice (speech.ts). One button toggles play / stop.
 */
import { canSpeak, speak, stopSpeaking } from './speech';
import { spokenNotes, type Note } from './notes';

export function bindReadNotes(btn: HTMLButtonElement, notes: () => Note[], withLesson = true) {
  if (!canSpeak()) {
    btn.hidden = true;
    return;
  }
  const idle = btn.innerHTML;
  let run = 0;
  const stop = () => {
    run++;
    stopSpeaking();
    btn.innerHTML = idle;
    btn.setAttribute('aria-pressed', 'false');
  };
  btn.setAttribute('aria-pressed', 'false');
  btn.addEventListener('click', async () => {
    if (btn.getAttribute('aria-pressed') === 'true') return stop();
    const parts = spokenNotes(notes(), withLesson);
    if (!parts.length) return;
    window.dispatchEvent(new CustomEvent('speech-stop-all'));
    const id = ++run;
    stopSpeaking();
    btn.textContent = '⏹ Stop reading';
    btn.setAttribute('aria-pressed', 'true');
    for (const t of parts) {
      if (id !== run) return;
      await speak(t);
    }
    if (id === run) stop();
  });
  window.addEventListener('speech-stop-all', () => btn.getAttribute('aria-pressed') === 'true' && stop());
  window.addEventListener('pagehide', stop);
}
