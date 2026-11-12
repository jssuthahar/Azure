/**
 * Client helpers shared by every interactive activity (src/components/activities/*).
 * The shell (InteractiveLearningActivity.astro) puts the lesson key, activity id,
 * XP and the lesson's activity list on the root element as data attributes.
 */
import { load, saveActivity } from './progress';
import { confetti } from './fun';

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Escape text for innerHTML. */
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Escape, then allow **bold** only. */
export const md = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

/** Read an activity's JSON config from its <script type="application/json">. */
export function config<T>(root: HTMLElement): T {
  return JSON.parse(root.querySelector<HTMLScriptElement>('script[data-config]')!.textContent!);
}

/** A short nudge animation; nothing when the learner prefers reduced motion. */
export function nudge(el: Element, ok: boolean) {
  if (reducedMotion()) return;
  el.animate(
    ok
      ? [{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }]
      : [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }],
    { duration: ok ? 260 : 300 },
  );
}

/** Mark an activity finished: save progress, pay XP, show the reward line, celebrate mastery. */
export function finishActivity(root: HTMLElement, score: number, total: number) {
  const d = root.dataset;
  const ids = (d.lessonActs ?? '').split(',').filter(Boolean);
  const res = saveActivity(d.lesson!, d.activity!, score, total, Number(d.xp), ids, d.title ?? 'Activity completed');
  root.dataset.done = 'true';
  const out = root.querySelector<HTMLElement>('.ila-reward');
  if (out) {
    const lines: string[] = [];
    if (res.gained) lines.push(`⭐ You earned ${res.gained} XP!${res.firstEver ? " You've finished your first interactive challenge." : ''}`);
    else if (!res.first) lines.push('Practice round saved. Beat your best score to earn more XP.');
    if (res.mastered) lines.push(`🎓 Every activity in this lesson done. You're a ${d.master}! +50 bonus XP.`);
    out.innerHTML = lines.map((l) => `<span class="block">${esc(l)}</span>`).join('');
    if (lines.length) nudge(out, true);
  }
  if (res.mastered) confetti(220);
  else if (res.gained && score === total) confetti(80);
  return res;
}

/** Tick every activity the learner has already finished (on load and when progress changes). */
export function paintDone() {
  const s = load();
  document.querySelectorAll<HTMLElement>('[data-activity]').forEach((root) => {
    const r = s.activities[`${root.dataset.lesson}#${root.dataset.activity}`];
    if (r) root.dataset.done = 'true';
    const best = root.querySelector<HTMLElement>('.ila-best');
    if (best && r) best.textContent = `Best: ${r.score}/${r.total}`;
  });
}
