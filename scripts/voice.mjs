/**
 * Turns your recorded narration into the clips the explainer player uses.
 *
 *   1. Record in the voice studio:  npm run dev  →  http://localhost:4321/voice-studio/
 *      Takes are saved to voice-src/<explainer-id>/<step>.webm (+ .txt with the line you read).
 *   2. npm run voice
 *      → public/explainers/voice/<id>/<step>.m4a   (trimmed, loudness-matched, AAC, plays everywhere)
 *      → src/explainers/voice.json                 (fingerprint of each line + clip length)
 *
 * A clip plays only while its line still matches the spec (same fingerprint as
 * voiceHash in src/lib/explainer/types.ts). Edit a line and that step falls back
 * to the browser voice until you record it again; `npm run voice` lists them.
 *
 *   npm run voice -- --force   re-encode every take, not only new ones
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'voice-src');
const OUT = join(ROOT, 'public/explainers/voice');
const MANIFEST = join(ROOT, 'src/explainers/voice.json');
const FORCE = process.argv.includes('--force');

/** Same as voiceHash() in src/lib/explainer/types.ts. */
function voiceHash(text) {
  let h = 0x811c9dc5;
  for (const ch of text.replace(/\s+/g, ' ').trim()) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

try {
  execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
} catch {
  console.error('ffmpeg is needed: brew install ffmpeg');
  process.exit(1);
}

/** The current `say` lines, read from the spec sources (no TS build needed). */
function currentLines() {
  const lines = {};
  const base = join(ROOT, 'src/explainers');
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

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
const lines = currentLines();
let made = 0, kept = 0;

// Takes downloaded by the studio (no folder access) are named <id>__<nn>.<ext>:
// drop them into voice-src/ and they're sorted into voice-src/<id>/ here.
if (existsSync(SRC)) {
  for (const f of readdirSync(SRC)) {
    const m = f.match(/^(.+)__(\d+)\.(\w+)$/);
    if (!m) continue;
    mkdirSync(join(SRC, m[1]), { recursive: true });
    renameSync(join(SRC, f), join(SRC, m[1], `${m[2]}.${m[3]}`));
  }
}

if (existsSync(SRC)) {
  for (const id of readdirSync(SRC)) {
    const dir = join(SRC, id);
    if (!statSync(dir).isDirectory()) continue;
    if (!lines[id]) { console.warn(`skip voice-src/${id}: no explainer with that id`); continue; }
    for (const f of readdirSync(dir)) {
      const m = f.match(/^(\d+)\.(webm|ogg|mp4|m4a|wav|mp3|aac|aiff?|caf)$/i);
      if (!m) continue;
      const step = String(Number(m[1]));
      const txt = join(dir, `${m[1]}.txt`);
      const read = existsSync(txt) ? readFileSync(txt, 'utf8') : lines[id][Number(step) - 1] ?? '';
      const outDir = join(OUT, id);
      const file = `${m[1].padStart(2, '0')}.m4a`;
      const out = join(outDir, file);
      const input = join(dir, f);
      const fresh = existsSync(out) && statSync(out).mtimeMs >= statSync(input).mtimeMs;
      if (!FORCE && fresh && manifest[id]?.[step]) { kept++; continue; }
      mkdirSync(outDir, { recursive: true });
      // Trim leading/trailing silence, cut rumble, match loudness to -16 LUFS (speech standard), mono AAC.
      const af = [
        'highpass=f=80',
        'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08',
        'areverse',
        'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.2',
        'areverse',
        'loudnorm=I=-16:TP=-1.5:LRA=11',
      ].join(',');
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', input, '-af', af, '-ac', '1', '-ar', '44100', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', out]);
      const secs = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString().trim());
      (manifest[id] ??= {})[step] = { hash: voiceHash(read), ms: Math.round(secs * 1000), file: `/explainers/voice/${id}/${file}` };
      made++;
    }
  }
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

// Report coverage against the current script.
let total = 0, ok = 0;
const stale = [], missing = [];
for (const [id, says] of Object.entries(lines)) {
  says.forEach((say, i) => {
    total++;
    const clip = manifest[id]?.[String(i + 1)];
    if (!clip) missing.push(`${id} #${i + 1}`);
    else if (clip.hash !== voiceHash(say)) stale.push(`${id} #${i + 1}`);
    else ok++;
  });
}
console.log(`voice: ${made} encoded, ${kept} unchanged · ${ok}/${total} lines in your voice`);
if (stale.length) console.log(`  re-record (line edited since recording): ${stale.join(', ')}`);
const recordedIds = new Set(Object.keys(manifest));
const partly = missing.filter((m) => recordedIds.has(m.split(' ')[0]));
if (partly.length) console.log(`  not recorded yet: ${partly.join(', ')}`);
