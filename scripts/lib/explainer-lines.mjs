/** Shared by scripts/voice.mjs and scripts/voice-clone.mjs. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Same as voiceHash() in src/lib/explainer/types.ts. Keep the two in step. */
export function voiceHash(text) {
  let h = 0x811c9dc5;
  for (const ch of text.replace(/\s+/g, ' ').trim()) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** The current `say` lines per explainer id, read from the spec sources (no TS build needed). */
export function currentLines(root = process.cwd()) {
  const lines = {};
  const base = join(root, 'src/explainers');
  for (const exam of readdirSync(base)) {
    const dir = join(base, exam);
    if (!statSync(dir).isDirectory()) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts'))) {
      const src = readFileSync(join(dir, f), 'utf8');
      const id = src.match(/\bid:\s*'([^']+)'/)?.[1];
      if (!id) continue;
      lines[id] = [...src.matchAll(/\bsay:\s*(['"`])((?:\\.|(?!\1).)*)\1/gs)].map((m) => m[2].replace(/\\(['"`\\])/g, '$1'));
    }
  }
  return lines;
}
