/**
 * Narrate every explainer line with an AI clone of the owner's voice, then
 * hand the takes to scripts/voice.mjs (trim, loudness-match, encode, manifest).
 *
 * ElevenLabs (instant voice clone, same day):
 *   export ELEVENLABS_API_KEY=...                          # never commit it
 *   npm run voice:clone -- --provider elevenlabs --sample ~/Desktop/my-voice.m4a
 *       → creates the clone from 1–3 min of clean speech (audio or video file),
 *         remembers its id in voice-src/.clone.json, narrates every line
 *   npm run voice:clone -- --provider elevenlabs --voice-id <id>   # reuse an existing voice
 *
 * Azure AI Speech personal voice (limited access, needs Microsoft approval + consent):
 *   export AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=centralindia
 *   npm run voice:clone -- --provider azure --speaker-profile <speakerProfileId>
 *
 * Options:
 *   --only <id>[,<id>]   just these explainers        --force     redo lines already narrated
 *   --dry-run            count lines and characters, call nothing
 *
 * Only lines without a take (or whose text changed) are sent, so re-running after
 * editing a script costs a few lines, not all of them. The script text is sent to
 * the chosen provider; nothing else is.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { currentLines, voiceHash } from './lib/explainer-lines.mjs';

const ROOT = process.cwd();
const SRC = join(ROOT, 'voice-src');
const STATE = join(SRC, '.clone.json');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const flag = (name) => args.includes(`--${name}`);

const provider = opt('provider') ?? 'elevenlabs';
const only = opt('only')?.split(',');
const force = flag('force');
const dry = flag('dry-run');
mkdirSync(SRC, { recursive: true });
const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, 'utf8')) : {};

/* ------------------------------------------------------------ what to do -- */
const lines = currentLines(ROOT);
const jobs = [];
for (const [id, says] of Object.entries(lines)) {
  if (only && !only.includes(id)) continue;
  says.forEach((say, i) => {
    const n = String(i + 1).padStart(2, '0');
    const txt = join(SRC, id, `${n}.txt`);
    const have = existsSync(join(SRC, id, `${n}.mp3`)) && existsSync(txt) && voiceHash(readFileSync(txt, 'utf8')) === voiceHash(say);
    if (force || !have) jobs.push({ id, n, say, prev: says[i - 1] ?? '', next: says[i + 1] ?? '' });
  });
}
const chars = jobs.reduce((t, j) => t + j.say.length, 0);
console.log(`voice clone · ${provider} · ${jobs.length} line(s) to narrate · ${chars.toLocaleString('en-US')} characters`);
if (dry || !jobs.length) process.exit(0);

/* ------------------------------------------------------------ providers -- */
async function withRetry(fn, label) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const retry = err.status === 429 || err.status >= 500;
      if (!retry || attempt >= 5) throw new Error(`${label}: ${err.message}`);
      const wait = 1500 * attempt;
      console.log(`  ${label}: ${err.status}, retrying in ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}
async function check(res) {
  if (res.ok) return res;
  const e = new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
  e.status = res.status;
  throw e;
}

/** Any audio or video file → up to 3 minutes of mono MP3, the shape cloning works best with. */
function prepareSample(path) {
  const out = join(tmpdir(), `msdb-voice-sample-${Date.now()}.mp3`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path, '-vn', '-t', '180', '-af', 'highpass=f=80,loudnorm=I=-16:TP=-1.5', '-ac', '1', '-ar', '44100', '-b:a', '128k', out]);
  return out;
}

const eleven = {
  key() {
    const k = process.env.ELEVENLABS_API_KEY;
    if (!k) { console.error('Set ELEVENLABS_API_KEY first (ElevenLabs → Profile → API keys).'); process.exit(1); }
    return k;
  },
  async voiceId() {
    const given = opt('voice-id') ?? (opt('sample') ? undefined : state.elevenlabs);
    if (given) return given;
    const sample = opt('sample');
    if (!sample) { console.error('Pass --sample <file> to create your voice clone, or --voice-id <id> to reuse one.'); process.exit(1); }
    const mp3 = prepareSample(resolve(sample));
    const form = new FormData();
    form.append('name', 'MSDEVBUILD narrator');
    form.append('description', 'Owner’s own voice, for azure.msdevbuild.com explainer narration');
    form.append('remove_background_noise', 'true');
    form.append('files', new Blob([readFileSync(mp3)], { type: 'audio/mpeg' }), 'sample.mp3');
    const res = await withRetry(async () => check(await fetch('https://api.elevenlabs.io/v1/voices/add', { method: 'POST', headers: { 'xi-api-key': this.key() }, body: form })), 'create clone');
    const { voice_id } = await res.json();
    state.elevenlabs = voice_id;
    writeFileSync(STATE, JSON.stringify(state, null, 2));
    console.log(`  created voice clone ${voice_id} (saved to voice-src/.clone.json)`);
    return voice_id;
  },
  async speak(voice, job) {
    const res = await check(await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': this.key(), 'content-type': 'application/json', accept: 'audio/mpeg' },
      body: JSON.stringify({
        text: job.say,
        model_id: opt('model') ?? 'eleven_multilingual_v2',
        // Neighbouring lines keep the delivery flowing like one take.
        previous_text: job.prev,
        next_text: job.next,
        voice_settings: { stability: 0.5, similarity_boost: 0.85, style: 0.15, use_speaker_boost: true },
      }),
    }));
    return Buffer.from(await res.arrayBuffer());
  },
};

const azure = {
  cfg() {
    const key = process.env.AZURE_SPEECH_KEY, region = process.env.AZURE_SPEECH_REGION;
    const profile = opt('speaker-profile') ?? state.azure;
    if (!key || !region || !profile) { console.error('Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION, and pass --speaker-profile <id>.'); process.exit(1); }
    state.azure = profile;
    writeFileSync(STATE, JSON.stringify(state, null, 2));
    return { key, region, profile };
  },
  async voiceId() { return this.cfg().profile; },
  async speak(profile, job) {
    const { key, region } = this.cfg();
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-IN"><voice name="DragonLatestNeural"><mstts:ttsembedding speakerProfileId="${esc(profile)}"/>${esc(job.say)}</voice></speak>`;
    const res = await check(await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-48khz-192kbitrate-mono-mp3', 'User-Agent': 'msdb-explainer-voice' },
      body: ssml,
    }));
    return Buffer.from(await res.arrayBuffer());
  },
};

const P = provider === 'azure' ? azure : provider === 'elevenlabs' ? eleven : null;
if (!P) { console.error('--provider must be elevenlabs or azure'); process.exit(1); }

/* ------------------------------------------------------------------- run -- */
const voice = await P.voiceId();
let done = 0;
const queue = [...jobs];
async function worker() {
  while (queue.length) {
    const job = queue.shift();
    const audio = await withRetry(() => P.speak(voice, job), `${job.id} #${Number(job.n)}`);
    const dir = join(SRC, job.id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${job.n}.mp3`), audio);
    writeFileSync(join(dir, `${job.n}.txt`), job.say);
    writeFileSync(join(dir, '.ai'), `${provider}\n`); // marks these clips as AI narration
    done++;
    process.stdout.write(`\r  narrated ${done}/${jobs.length}`);
  }
}
await Promise.all([worker(), worker()]);
console.log('\n  encoding clips…');
execFileSync('node', [join(ROOT, 'scripts/voice.mjs')], { stdio: 'inherit' });
