/**
 * "⚑ Flag for review" buttons on practice questions. A flagged question shows
 * up in Smart practice → Flagged questions until the learner un-flags it.
 * Buttons: <button class="q-flag" data-flag-id="<questionId>" aria-pressed>.
 */
import { isFlagged, setFlag } from './notes';

export function paintFlag(btn: HTMLElement, cert: string) {
  const on = isFlagged(cert, btn.dataset.flagId!);
  btn.setAttribute('aria-pressed', String(on));
  const l = btn.querySelector('[data-flag-label]');
  if (l) l.textContent = on ? 'Flagged' : 'Flag for review';
}

export function bindFlags(root: ParentNode, cert: string) {
  const btns = () => root.querySelectorAll<HTMLElement>('.q-flag[data-flag-id]');
  btns().forEach((b) => {
    paintFlag(b, cert);
    b.addEventListener('click', () => setFlag(cert, b.dataset.flagId!, !isFlagged(cert, b.dataset.flagId!)));
  });
  window.addEventListener('notes-change', () => btns().forEach((b) => paintFlag(b, cert)));
}
