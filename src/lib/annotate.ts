/**
 * Highlights in a lesson: turn a text selection into a stored quote (with a bit
 * of text either side), and paint stored quotes back as <mark> elements.
 *
 * Only reading text counts: the 30-second answer, lesson sections and the exam
 * tip. Quizzes, simulations, activities and buttons are left alone so their
 * scripts keep working. Marks never change the text, so offsets stay stable.
 */
import type { Note } from './notes';

export const AREA = '.answer-box, .lesson';
const SKIP = 'script, style, button, input, select, textarea, svg, canvas, figure, summary, .not-prose, .kc, .ila, .la, .exercise-box, .lsims, .speak-btn, .simple-only, [data-no-annotate]';
const NO_TEXT_PARENT = /^(TABLE|THEAD|TBODY|TFOOT|TR|UL|OL|DL)$/;
const CONTEXT = 40;

interface Piece {
  node: Text;
  start: number;
}

function pieces(root: Element): { list: Piece[]; text: string } {
  const list: Piece[] = [];
  let text = '';
  const areas = [...root.querySelectorAll(AREA)].filter((a) => !a.parentElement?.closest(AREA));
  for (const area of areas) {
    const walker = document.createTreeWalker(area, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement?.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
      list.push({ node: n, start: text.length });
      text += n.data;
    }
    text += '\n'; // areas never run into each other
  }
  return { list, text };
}

const inArea = (n: Node | null) => {
  const el = n instanceof Element ? n : n?.parentElement;
  return Boolean(el?.closest(AREA) && !el.closest(SKIP));
};

/** The heading of the lesson part a node sits in. */
function sectionOf(n: Node): string {
  const el = n instanceof Element ? n : n.parentElement;
  if (el?.closest('.answer-box')) return '30-second answer';
  if (el?.closest('#exam-tip')) return 'Exam tip';
  return el?.closest('.lesson-section')?.querySelector('h2')?.textContent?.trim() ?? '';
}

/** A usable selection inside the lesson text, as a quote with context. */
export function quoteFromSelection(root: Element): Pick<Note, 'quote' | 'prefix' | 'suffix' | 'section'> | null {
  const sel = getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!inArea(range.startContainer) || !inArea(range.endContainer)) return null;
  const { list, text } = pieces(root);
  let s = -1;
  let e = -1;
  for (const { node, start } of list) {
    if (!range.intersectsNode(node)) continue;
    const a = node === range.startContainer ? range.startOffset : 0;
    const b = node === range.endContainer ? range.endOffset : node.length;
    if (b <= a && node !== range.startContainer) continue;
    if (s < 0) s = start + a;
    e = start + b;
  }
  if (s < 0 || e <= s) return null;
  // Trim spaces off both ends so the stored quote is clean.
  while (s < e && /\s/.test(text[s])) s++;
  while (e > s && /\s/.test(text[e - 1])) e--;
  const quote = text.slice(s, e);
  if (quote.length < 2 || quote.length > 2000) return null;
  return { quote, prefix: text.slice(Math.max(0, s - CONTEXT), s), suffix: text.slice(e, e + CONTEXT), section: sectionOf(range.startContainer) };
}

/** Where a stored quote sits now: the occurrence whose context matches best. */
function locate(text: string, n: Pick<Note, 'quote' | 'prefix' | 'suffix'>): number {
  let best = -1;
  let bestScore = -1;
  for (let i = text.indexOf(n.quote); i >= 0; i = text.indexOf(n.quote, i + 1)) {
    let score = 0;
    const before = text.slice(Math.max(0, i - n.prefix.length), i);
    const after = text.slice(i + n.quote.length, i + n.quote.length + n.suffix.length);
    for (let k = 1; k <= Math.min(before.length, n.prefix.length) && before.at(-k) === n.prefix.at(-k); k++) score++;
    for (let k = 0; k < Math.min(after.length, n.suffix.length) && after[k] === n.suffix[k]; k++) score++;
    if (score > bestScore) [best, bestScore] = [i, score];
  }
  return best;
}

/** Paint one note. Returns false when its text isn't in the lesson any more. */
export function paint(root: Element, n: Note): boolean {
  const { list, text } = pieces(root);
  const s = locate(text, n);
  if (s < 0) return false;
  const e = s + n.quote.length;
  let first = true;
  for (const { node, start } of list) {
    const end = start + node.length;
    if (end <= s || start >= e) continue;
    if (NO_TEXT_PARENT.test(node.parentElement?.tagName ?? '')) continue;
    const a = Math.max(s, start) - start;
    const b = Math.min(e, end) - start;
    let mid = node;
    if (a > 0) mid = mid.splitText(a);
    if (b - a < mid.length) mid.splitText(b - a);
    if (!mid.data.trim()) continue;
    const mark = document.createElement('mark');
    mark.className = `hl hl-${n.color}${n.note.trim() ? ' hl-noted' : ''}`;
    mark.dataset.hl = n.id;
    if (first) {
      mark.id = `note-${n.id}`;
      mark.tabIndex = 0;
      mark.setAttribute('role', 'button');
      mark.setAttribute('aria-label', n.note.trim() ? `Highlight with note: ${n.note.trim().slice(0, 80)}` : 'Highlight. Open to add a note or remove it');
      first = false;
    }
    mid.replaceWith(mark);
    mark.append(mid);
  }
  return !first;
}

export function unpaint(id: string) {
  document.querySelectorAll<HTMLElement>(`mark[data-hl="${CSS.escape(id)}"]`).forEach((m) => {
    const parent = m.parentNode!;
    m.replaceWith(...m.childNodes);
    parent.normalize();
  });
}

/** Where to float the selection toolbar: just under the selection, inside the page. */
export function selectionBox(): DOMRect | null {
  const sel = getSelection();
  if (!sel || !sel.rangeCount) return null;
  const rects = [...sel.getRangeAt(0).getClientRects()].filter((r) => r.width > 0);
  return rects.at(-1) ?? sel.getRangeAt(0).getBoundingClientRect();
}
