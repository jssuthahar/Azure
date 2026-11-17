/**
 * Lesson bookmarks, highlights and notes, kept in this browser like the rest
 * of the learner's data. Signed-in learners get them synced (cloud/sync.ts,
 * cloud doc key `notes`). Every storage access is wrapped: storage can be blocked.
 *
 * Deleting keeps a small tombstone ({ del: true, at }) so a second device can't
 * bring a deleted note back when the two copies merge. Newer `at` wins.
 */
export const NOTES_KEY = 'msdb-azure-notes-v1';

export type HlColor = 'yellow' | 'green' | 'blue' | 'pink';
export const HL_COLORS: { id: HlColor; label: string }[] = [
  { id: 'yellow', label: 'Yellow' },
  { id: 'green', label: 'Green' },
  { id: 'blue', label: 'Blue' },
  { id: 'pink', label: 'Pink' },
];

export interface Bookmark {
  url: string;
  title: string;
  on: boolean;
  at: number;
}
export interface Note {
  id: string;
  /** Lesson key, e.g. `az-900/cloud-concepts/cloud-computing`. */
  key: string;
  url: string;
  title: string;
  /** The highlighted words, with a little text either side to find them again. */
  quote: string;
  prefix: string;
  suffix: string;
  /** Heading of the part of the lesson it sits in. */
  section: string;
  color: HlColor;
  note: string;
  at: number;
  del?: boolean;
}
/** A practice question the learner flagged for review, keyed `<exam>:<questionId>`. */
export interface Flag {
  on: boolean;
  at: number;
}
export interface NotesState {
  bm: Record<string, Bookmark>;
  notes: Record<string, Note>;
  flags: Record<string, Flag>;
}

const empty = (): NotesState => ({ bm: {}, notes: {}, flags: {} });
const TOMBSTONE_DAYS = 120;

export function loadNotes(): NotesState {
  try {
    const s = JSON.parse(localStorage.getItem(NOTES_KEY) || 'null');
    if (s && typeof s === 'object') return { bm: s.bm ?? {}, notes: s.notes ?? {}, flags: s.flags ?? {} };
  } catch {
    /* blocked or broken */
  }
  return empty();
}

function save(s: NotesState) {
  const cutoff = Date.now() - TOMBSTONE_DAYS * 864e5;
  for (const [id, n] of Object.entries(s.notes)) if (n.del && n.at < cutoff) delete s.notes[id];
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(s));
  } catch {
    /* blocked */
  }
  window.dispatchEvent(new CustomEvent('notes-change'));
  window.dispatchEvent(new CustomEvent('msdb-data-change'));
}

/* ---------- bookmarks ---------- */
export const isBookmarked = (key: string) => Boolean(loadNotes().bm[key]?.on);
export function setBookmark(key: string, url: string, title: string, on: boolean) {
  const s = loadNotes();
  s.bm[key] = { url, title, on, at: Date.now() };
  save(s);
}
export const bookmarks = () =>
  Object.entries(loadNotes().bm)
    .filter(([, b]) => b.on)
    .map(([key, b]) => ({ key, ...b }))
    .sort((a, b) => b.at - a.at);

/* ---------- flagged practice questions ---------- */
export const isFlagged = (cert: string, id: string) => Boolean(loadNotes().flags[`${cert}:${id}`]?.on);
export function setFlag(cert: string, id: string, on: boolean) {
  const s = loadNotes();
  s.flags[`${cert}:${id}`] = { on, at: Date.now() };
  save(s);
}
/** Ids of the questions flagged for one exam. */
export const flaggedIds = (cert: string) =>
  new Set(
    Object.entries(loadNotes().flags)
      .filter(([k, f]) => f.on && k.startsWith(`${cert}:`))
      .map(([k]) => k.slice(cert.length + 1)),
  );

/* ---------- highlights and notes ---------- */
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const liveNotes = (key?: string) =>
  Object.values(loadNotes().notes)
    .filter((n) => !n.del && (!key || n.key === key))
    .sort((a, b) => a.at - b.at);

export function putNote(n: Note) {
  const s = loadNotes();
  s.notes[n.id] = { ...n, at: Date.now() };
  save(s);
}
export function deleteNote(id: string) {
  const s = loadNotes();
  const n = s.notes[id];
  if (!n) return;
  s.notes[id] = { id, key: n.key, url: n.url, title: '', quote: '', prefix: '', suffix: '', section: '', color: n.color, note: '', at: Date.now(), del: true };
  save(s);
}

/** Two copies (this browser and the account): newest change to each item wins. */
export function mergeNotes(a: NotesState, b: NotesState): NotesState {
  const newer = <T extends { at: number }>(x: Record<string, T> = {}, y: Record<string, T> = {}) => {
    const out = { ...y };
    for (const [k, v] of Object.entries(x)) if (!out[k] || v.at >= out[k].at) out[k] = v;
    return out;
  };
  return { bm: newer(a.bm, b.bm), notes: newer(a.notes, b.notes), flags: newer(a.flags, b.flags) };
}

/** Markdown export of notes (one lesson, or all of them grouped by lesson). */
export function notesMarkdown(list: Note[], marks: { title: string; url: string }[] = [], origin = location.origin) {
  const lines: string[] = ['# My Azure study notes', ''];
  if (marks.length) {
    lines.push('## Bookmarked lessons', '');
    for (const b of marks) lines.push(`- [${b.title}](${origin}${b.url})`);
    lines.push('');
  }
  const byLesson = new Map<string, Note[]>();
  for (const n of list) byLesson.set(n.key, [...(byLesson.get(n.key) ?? []), n]);
  for (const notes of byLesson.values()) {
    lines.push(`## ${notes[0].title}`, '', `${origin}${notes[0].url}`, '');
    for (const n of notes) {
      lines.push(`> ${n.quote.replace(/\s+/g, ' ').trim()}`);
      if (n.section) lines.push(`>`, `> _${n.section}_`);
      lines.push('');
      if (n.note.trim()) lines.push(n.note.trim(), '');
    }
  }
  return lines.join('\n');
}

export function download(name: string, text: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** What "Read my notes" says for each note, one chunk at a time. */
export const spokenNotes = (list: Note[], withLesson = true) =>
  list.map((n) =>
    [withLesson ? `From ${n.title}${n.section ? `, ${n.section}` : ''}.` : n.section ? `${n.section}.` : '', n.quote, n.note.trim() ? `Your note: ${n.note.trim()}` : '']
      .filter(Boolean)
      .join(' '),
  );
