/**
 * Shared helpers for the AZ-104 administrator commands in the simulated Cloud
 * Shell (EDUCATION ONLY). Each area module (identity.ts, storage.ts, …) keeps
 * a table of command paths → handlers and calls `run()`.
 *
 * Rules every area follows:
 * - Return null from az()/shell() for anything the area doesn't handle, so the
 *   AZ-900 and AI-200 commands keep working (admin modules run first).
 * - Prefer new command paths. Only claim an existing path (see GROUPS/C in
 *   cli.ts) when a flag the base command ignores is present, via `when`.
 * - Every state change emits one event (`w.emit('adm.<thing>', {...})`) so lab
 *   checks can see exactly what the learner did.
 * - Command names and flags follow Microsoft Learn; output is simplified.
 */
import { SimError, SUB_ID, TYPE_INFO, type Res, type ResType } from '../engine';
import type { World } from '../world';

export interface AdminOut { out?: string; error?: string }
export { SimError, SUB_ID, TYPE_INFO };
export type { Res, ResType, World };

export interface Parsed { words: string[]; raw: string[]; flags: Record<string, string[]> }
export const ALIAS: Record<string, string> = { '-g': '--resource-group', '-n': '--name', '-l': '--location', '-o': '--output', '-y': '--yes', '-h': '--help', '-c': '--container-name', '-f': '--file', '-s': '--share-name', '-v': '--value' };

export function parse(tokens: string[], extra: Record<string, string> = {}): Parsed {
  const words: string[] = [];
  const raw: string[] = [];
  const flags: Record<string, string[]> = {};
  let cur: string | null = null;
  for (const t of tokens) {
    if (t.startsWith('-') && t.length > 1 && !/^-\d/.test(t)) {
      const i = t.indexOf('=');
      const k = t.startsWith('--') && i > 0 ? t.slice(0, i) : t;
      cur = extra[k] ?? ALIAS[k] ?? k.toLowerCase();
      flags[cur] ??= [];
      if (t.startsWith('--') && i > 0) flags[cur].push(t.slice(i + 1));
    } else if (cur) flags[cur].push(t);
    else { words.push(t.toLowerCase()); raw.push(t); }
  }
  return { words, raw, flags };
}
export const one = (p: Parsed, ...names: string[]) => {
  for (const n of names) if (p.flags[n]?.length) return p.flags[n].join(' ');
  return undefined;
};
export const many = (p: Parsed, name: string) => p.flags[name] ?? [];
export const has = (p: Parsed, name: string) => name in p.flags;
export const bool = (p: Parsed, name: string, dflt: boolean) => (has(p, name) ? !/^(false|0|no|disabled)$/i.test(one(p, name) ?? 'true') : dflt);
export function req(p: Parsed, spec: [long: string, short: string][]) {
  const missing = spec.filter(([l]) => !p.flags[l]?.length).map(([l, s]) => (s ? `${l}/${s}` : l));
  if (missing.length) throw new SimError(`the following arguments are required: ${missing.join(', ')}`, 'MissingArgs');
}
export const lc = (s?: string) => (s ?? '').toLowerCase();
export const json = (v: unknown) => JSON.stringify(v, null, 2);
export const now = () => new Date().toISOString().slice(0, 19) + 'Z';
const rnd = (n: number) => Math.floor(Math.random() * n);
export const hex = (n: number) => Array.from({ length: n }, () => '0123456789abcdef'[rnd(16)]).join('');
export const uuid = () => `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`;
/** Per-world scratch state for admin areas (users' licenses, SSPR settings, backup items…). */
export const adm = (w: World): Record<string, any> => ((w as any).adm ??= {});

export function table(rows: Record<string, unknown>[], cols: string[]): string {
  if (!rows.length) return '';
  const wd = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c] ?? '').length)));
  const line = (vals: string[]) => vals.map((v, i) => v.padEnd(wd[i])).join('  ');
  return [line(cols), line(wd.map((n) => '-'.repeat(n))), ...rows.map((r) => line(cols.map((c) => String(r[c] ?? ''))))].join('\n');
}
/** `-o table` gives the table, `-o tsv` the first column values, anything else JSON. */
export function out(p: Parsed, value: unknown, rows?: Record<string, unknown>[], cols?: string[]): AdminOut {
  const o = lc(one(p, '--output'));
  if (o === 'table' && rows && cols) return { out: table(rows, cols) || '(no results)' };
  if (o === 'tsv') {
    const v = Array.isArray(value) ? value : [value];
    return { out: v.map((x) => (typeof x === 'object' && x ? Object.values(x as object).join('\t') : String(x))).join('\n') };
  }
  return { out: json(value) };
}
/** Find a resource by type, resource group and name, or throw ResourceNotFound. */
export const need = (w: World, type: ResType, rg: string | undefined, name: string | undefined): Res => w.need(type, rg ?? '', name ?? '');
export const idOf = (w: World, type: ResType, rg: string, name: string) => w.idFor(type, rg, name);

export type Handler = (p: Parsed, w: World) => AdminOut;
export interface Cmd { run: Handler; /** Only claim the path when this is true (for paths the base CLI also knows). */ when?: (p: Parsed) => boolean; extra?: Record<string, string> }

/** Longest-match dispatch over an area's command table. */
export function run(table: Record<string, Cmd | Handler>, tokens: string[], w: World): AdminOut | null {
  const pre = parse(tokens);
  let path = '';
  for (let n = Math.min(6, pre.words.length); n > 0; n--) {
    const cand = pre.words.slice(0, n).join(' ');
    if (table[cand]) { path = cand; break; }
  }
  if (!path) return null;
  const entry = table[path];
  const cmd: Cmd = typeof entry === 'function' ? { run: entry } : entry;
  const p = cmd.extra ? parse(tokens, cmd.extra) : pre;
  if (has(p, '--help')) return null;
  if (cmd.when && !cmd.when(p)) return null;
  w.emit('cli', { command: `az ${p.words.join(' ')}`, path, line: `az ${tokens.join(' ')}` });
  try {
    return cmd.run(p, w);
  } catch (e) {
    if (e instanceof SimError) return { error: e.code === 'MissingArgs' ? `${e.message}\nTry 'az ${path} --help' for examples.` : `(${e.code}) ${e.message}` };
    throw e;
  }
}
