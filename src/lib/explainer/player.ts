/**
 * Explainer player: the lesson-page port of the MSDEVBUILD reel runtime
 * (msdevbuild-video/src/brand/driver.ts).
 *
 * Kept from the reel: the synthesised sound engine (pentatonic SFX, whoosh on
 * every cut, riser into the last step, resolve on the end card), the `MSD`
 * choreography API, the sequencer, progress track and caption card.
 *
 * Added for learning: spoken narration through the browser's own voice
 * (src/lib/speech.ts, nothing leaves the device), subtitles, pause/resume,
 * previous/next step with true seeking, landscape (web) and portrait (phone)
 * layouts, fullscreen, pause when scrolled away, and no autoplay: a lesson is
 * for reading until the learner presses play.
 */
import { canSpeak, speak, stopSpeaking } from '../speech';
import { holdFor, STEP_GAP, type ExplainerSpec } from './types';

/* ------------------------------------------------------------------ audio -- */
let actx: AudioContext | null = null;
let master: GainNode | null = null;

function ensureAudio() {
  try {
    if (!actx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      actx = new AC();
      master = actx.createGain();
      master.gain.value = 0.9;
      master.connect(actx.destination);
    }
    if (actx.state === 'suspended') void actx.resume();
  } catch {
    actx = null; // audio is a nice-to-have: play silently
  }
}

let soundGate = () => false;

function beep(o: { freq?: number; to?: number; dur?: number; gain?: number; type?: OscillatorType; delay?: number }) {
  if (!soundGate() || !actx || !master) return;
  try {
    const dur = o.dur ?? 0.08;
    const t0 = actx.currentTime + (o.delay ?? 0);
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.freq ?? 600, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.gain ?? 0.05, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  } catch {
    /* a dropped sound must never interrupt the animation */
  }
}

function noiseBurst(dur: number, gain: number, from: number, to: number) {
  if (!soundGate() || !actx || !master) return;
  try {
    const len = Math.floor(actx.sampleRate * dur);
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = actx.createBufferSource();
    src.buffer = buf;
    const filter = actx.createBiquadFilter();
    filter.type = 'bandpass';
    const t0 = actx.currentTime;
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    filter.Q.value = 1.1;
    const g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t0);
  } catch {
    /* see beep() */
  }
}

// C major pentatonic: effects fired in any order still sound musical.
const PENTA = [0, 2, 4, 7, 9];
const ROOT = 523.25;
const scaleFreq = (step: number) => {
  step = Math.max(0, step | 0);
  const semitone = PENTA[step % 5] + Math.floor(step / 5) * 12;
  return ROOT * Math.pow(2, semitone / 12);
};

function sweep(from: number, to: number, dur: number, gain: number) {
  if (!soundGate() || !actx || !master) return;
  try {
    const t0 = actx.currentTime;
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.frequency.setValueAtTime(from, t0);
    osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.82);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    /* see beep() */
  }
}

export const SFX = {
  blip: (i = 0) => beep({ freq: scaleFreq(i), dur: 0.085, gain: 0.026 }),
  step: (i = 0) => beep({ freq: scaleFreq(i + 5), dur: 0.07, gain: 0.02 }),
  tick: () => beep({ freq: 1046, dur: 0.03, type: 'square', gain: 0.009 }),
  pop: () => beep({ freq: 392, to: 784, dur: 0.12, gain: 0.03 }),
  lock: () => { beep({ freq: 659.25, dur: 0.07, gain: 0.03 }); beep({ freq: 987.77, dur: 0.14, gain: 0.026, delay: 0.06 }); },
  data: (i = 0) => beep({ freq: scaleFreq(i + 8), dur: 0.045, gain: 0.014 }),
  chime: () => { beep({ freq: 784, dur: 0.2, gain: 0.03 }); beep({ freq: 1046.5, dur: 0.3, gain: 0.028, delay: 0.11 }); },
  ding: () => { beep({ freq: 587.33, dur: 0.12, gain: 0.032 }); beep({ freq: 880, dur: 0.28, gain: 0.03, delay: 0.1 }); },
  resolve: () => {
    beep({ freq: 659.25, dur: 0.12, gain: 0.028 });
    beep({ freq: 783.99, dur: 0.14, gain: 0.028, delay: 0.1 });
    beep({ freq: 1046.5, dur: 0.34, gain: 0.03, delay: 0.21 });
  },
  whoosh: (up?: boolean) => noiseBurst(0.42, 0.045, up ? 320 : 2400, up ? 2600 : 300),
  swipe: () => noiseBurst(0.22, 0.035, 1800, 420),
  riser: (ms = 1000) => sweep(220, 1320, ms / 1000, 0.028),
  sparkle: () => { for (let i = 0; i < 4; i++) beep({ freq: scaleFreq(i + 4), dur: 0.09, gain: 0.019, delay: i * 0.055 }); },
  focus: () => beep({ freq: 440, to: 660, dur: 0.16, gain: 0.02 }),
  thud: () => beep({ freq: 150, to: 48, dur: 0.34, gain: 0.07 }),
  error: () => beep({ freq: 300, to: 170, dur: 0.2, type: 'sawtooth', gain: 0.03 }),
};

/* ---------------------------------------------------------------- the API -- */
type Target = string | Element;
type Pt = { x: number; y: number } | string;
interface ParticleOpts { count?: number; duration?: number; /** % of the host, or a selector whose centre is used. */ from?: Pt; to?: Pt; spread?: number; gap?: number; silent?: boolean; color?: string }

/** What a step's `run(m)` can call. Mirrors the reel kit's MSD helper. */
export interface XApi {
  q: (sel: string) => HTMLElement | null;
  qa: (sel: string) => HTMLElement[];
  show: (sel: string, stagger?: number, silent?: boolean) => number;
  hide: (sel: string) => void;
  cls: (sel: string, cls: string, on?: boolean) => void;
  text: (sel: string, text: string) => void;
  type: (sel: Target, text: string, speed?: number) => void;
  count: (sel: Target, to: number, ms?: number, opts?: { prefix?: string; suffix?: string; decimals?: number }) => void;
  particles: (host: Target, opts?: ParticleOpts) => void;
  stream: (host: Target, opts?: ParticleOpts) => void;
  focus: (sel: string, others?: string) => void;
  unfocus: () => void;
  flash: (sel: string) => void;
  punch: (sel: string, i?: number) => void;
  shake: (sel: string) => void;
  after: (ms: number, fn: () => void) => void;
  every: (ms: number, fn: () => void) => void;
  sfx: typeof SFX;
  /** True while earlier steps are being replayed silently to rebuild state. */
  instant: boolean;
  /** True in the portrait (phone) layout. */
  port: boolean;
}

/* ------------------------------------------------------------- the player -- */
const PREFS_KEY = 'msdb-explainer-v1';
interface Prefs { sfx: boolean; voice: boolean; cc: boolean }
function readPrefs(): Prefs {
  const d = { sfx: true, voice: true, cc: true };
  try {
    return { ...d, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') };
  } catch {
    return d;
  }
}
function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {}
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let activePlayer: Player | null = null;

export class Player {
  private root: HTMLElement;
  private spec: ExplainerSpec;
  private frame: HTMLElement;
  private canvas: HTMLElement;
  private stage: HTMLElement;
  private snapshot: string;
  private segs: HTMLElement[] = [];
  private timers: number[] = [];
  private cur = -1;
  private token = 0;
  private playing = false;
  private started = false;
  private finished = false;
  private instant = false;
  private prefs = readPrefs();
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private api: XApi;

  constructor(root: HTMLElement, spec: ExplainerSpec) {
    this.root = root;
    this.spec = spec;
    this.frame = root.querySelector('.xv-frame')!;
    this.canvas = root.querySelector('.xv-canvas')!;
    this.stage = root.querySelector('.xv-stage')!;
    this.snapshot = this.stage.innerHTML;
    this.api = this.makeApi();

    const track = root.querySelector('.xv-track')!;
    track.innerHTML = '';
    this.segs = spec.stages.map(() => {
      const seg = document.createElement('div');
      seg.className = 'seg';
      seg.innerHTML = '<div class="seg-fill"></div>';
      track.appendChild(seg);
      return seg;
    });

    this.wireControls();
    this.layout();
    new ResizeObserver(() => this.layout()).observe(this.frame);
    window.addEventListener('orientationchange', () => setTimeout(() => this.layout(), 200));
    document.addEventListener('fullscreenchange', () => this.onFullscreen());
    document.addEventListener('webkitfullscreenchange', () => this.onFullscreen());
    new IntersectionObserver(
      ([e]) => { if (!e.isIntersecting && this.playing && !this.isFull()) this.pause(); },
      { threshold: 0.2 },
    ).observe(this.frame);
    document.addEventListener('visibilitychange', () => document.hidden && this.playing && this.pause());
    window.addEventListener('speech-stop-all', () => this.playing && activePlayer !== this && this.pause());
    this.paintPrefs();
    root.dataset.ready = '';
  }

  /* ----------------------------------------------------------- layout -- */
  private isFull() {
    const d = document as Document & { webkitFullscreenElement?: Element };
    return (d.fullscreenElement ?? d.webkitFullscreenElement) === this.root || this.root.classList.contains('xv-fake-fs');
  }

  /** Landscape 1920×1080 on the web, portrait 1080×1920 on phones (or a tall fullscreen). */
  private layout() {
    const full = this.isFull();
    const portrait = full ? window.innerHeight > window.innerWidth : matchMedia('(max-width: 639px)').matches;
    this.canvas.classList.toggle('xv-port', portrait);
    this.canvas.classList.toggle('xv-land', !portrait);
    this.root.classList.toggle('is-port', portrait);
    const cw = portrait ? 1080 : 1920;
    const ch = portrait ? 1920 : 1080;
    const w = this.frame.clientWidth;
    const h = this.frame.clientHeight;
    if (!w || !h) return;
    const s = Math.min(w / cw, h / ch);
    this.canvas.style.transform = `translate(-50%, -50%) scale(${s})`;
  }

  private onFullscreen() {
    const full = this.isFull();
    this.root.classList.toggle('xv-is-full', full);
    const btn = this.root.querySelector<HTMLButtonElement>('[data-xv="full"]');
    if (btn) {
      btn.setAttribute('aria-pressed', String(full));
      btn.setAttribute('aria-label', full ? 'Exit full screen' : 'Full screen');
    }
    requestAnimationFrame(() => this.layout());
  }

  private toggleFull() {
    const el = this.root as HTMLElement & { webkitRequestFullscreen?: () => void };
    const d = document as Document & { webkitExitFullscreen?: () => void };
    if (this.isFull()) {
      if (this.root.classList.contains('xv-fake-fs')) {
        this.root.classList.remove('xv-fake-fs');
        document.documentElement.classList.remove('xv-lock');
        this.onFullscreen();
      } else (document.exitFullscreen ? document.exitFullscreen() : d.webkitExitFullscreen?.())?.catch?.(() => {});
      return;
    }
    if (el.requestFullscreen) el.requestFullscreen().catch(() => this.fakeFull());
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else this.fakeFull();
  }

  /** iPhone Safari has no element fullscreen: fill the viewport instead. */
  private fakeFull() {
    this.root.classList.add('xv-fake-fs');
    document.documentElement.classList.add('xv-lock');
    this.onFullscreen();
  }

  /* ---------------------------------------------------------- controls -- */
  private btn(name: string) {
    return this.root.querySelector<HTMLButtonElement>(`[data-xv="${name}"]`);
  }

  private wireControls() {
    this.root.querySelector('.xv-start')?.addEventListener('click', () => this.start());
    this.btn('play')?.addEventListener('click', () => this.toggle());
    this.btn('prev')?.addEventListener('click', () => this.seek(Math.max(0, this.cur - 1)));
    this.btn('next')?.addEventListener('click', () => (this.cur + 1 < this.spec.stages.length ? this.seek(this.cur + 1) : this.finish()));
    this.btn('replay')?.addEventListener('click', () => this.seek(0));
    this.btn('full')?.addEventListener('click', () => this.toggleFull());
    this.root.querySelector('[data-xv="continue"]')?.addEventListener('click', () => {
      if (this.isFull()) this.toggleFull();
      const next = this.root.nextElementSibling as HTMLElement | null;
      next?.scrollIntoView({ behavior: this.reduced ? 'auto' : 'smooth', block: 'start' });
    });
    (['sfx', 'voice', 'cc'] as const).forEach((k) =>
      this.btn(k)?.addEventListener('click', () => {
        this.prefs[k] = !this.prefs[k];
        savePrefs(this.prefs);
        if (k === 'voice' && !this.prefs.voice) stopSpeaking();
        if (k === 'sfx' && this.prefs.sfx) ensureAudio();
        this.paintPrefs();
      }),
    );
    if (!canSpeak()) this.btn('voice')?.setAttribute('hidden', '');
    this.root.addEventListener('keydown', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('summary, details ol')) return;
      if (e.key === ' ' || e.key === 'k') { if (t.tagName === 'BUTTON') return; e.preventDefault(); this.toggle(); }
      else if (e.key === 'ArrowRight' && this.started) { e.preventDefault(); this.btn('next')?.click(); }
      else if (e.key === 'ArrowLeft' && this.started) { e.preventDefault(); this.btn('prev')?.click(); }
      else if (e.key === 'Escape' && this.root.classList.contains('xv-fake-fs')) this.toggleFull();
    });
  }

  private paintPrefs() {
    (['sfx', 'voice', 'cc'] as const).forEach((k) => this.btn(k)?.setAttribute('aria-pressed', String(this.prefs[k])));
    this.root.classList.toggle('xv-cc-off', !this.prefs.cc);
  }

  private paintPlay() {
    const b = this.btn('play');
    if (!b) return;
    b.setAttribute('aria-label', this.playing ? 'Pause' : this.finished ? 'Replay' : 'Play');
    b.dataset.state = this.playing ? 'pause' : this.finished ? 'replay' : 'play';
    this.root.classList.toggle('xv-playing', this.playing);
    this.canvas.classList.toggle('xv-paused', !this.playing && this.started && !this.finished);
  }

  /* -------------------------------------------------------- the API -- */
  private makeApi(): XApi {
    const self = this;
    const q = (sel: string) => self.stage.querySelector<HTMLElement>(sel);
    const qa = (sel: string) => [...self.stage.querySelectorAll<HTMLElement>(sel)];
    const el = (t: Target) => (typeof t === 'string' ? q(t) : (t as HTMLElement));
    const retrigger = (sel: string, cls: string) =>
      qa(sel).forEach((e) => { e.classList.remove(cls); void e.offsetWidth; e.classList.add(cls); });
    const api: XApi = {
      q,
      qa,
      get instant() { return self.instant; },
      get port() { return self.canvas.classList.contains('xv-port'); },
      sfx: SFX,
      after(ms, fn) {
        if (self.instant) return fn();
        self.timers.push(window.setTimeout(fn, ms));
      },
      every(ms, fn) {
        if (self.instant) return;
        self.timers.push(window.setInterval(fn, ms));
      },
      show(sel, stagger = 65, silent) {
        const els = qa(sel);
        els.forEach((e, i) => api.after(i * stagger, () => { e.classList.add('show'); if (!silent) SFX.blip(i); }));
        return els.length;
      },
      hide: (sel) => qa(sel).forEach((e) => e.classList.remove('show')),
      cls: (sel, c, on) => qa(sel).forEach((e) => e.classList.toggle(c, on !== false)),
      text: (sel, t) => qa(sel).forEach((e) => (e.textContent = t)),
      type(t, text, speed = 40) {
        const e = el(t);
        if (!e) return;
        if (self.instant || self.reduced) { e.textContent = text; return; }
        e.textContent = '';
        for (let i = 0; i < text.length; i++) api.after(i * speed, () => { e.textContent = text.slice(0, i + 1); if (i % 5 === 0) SFX.tick(); });
      },
      count(t, to, ms = 1200, o = {}) {
        const e = el(t);
        if (!e) return;
        const fmt = (v: number) => (o.prefix ?? '') + (o.decimals ? v.toFixed(o.decimals) : Math.round(v).toLocaleString('en-US')) + (o.suffix ?? '');
        if (self.instant || self.reduced) { e.textContent = fmt(to); return; }
        const steps = Math.max(1, Math.round(ms / 40));
        let i = 0;
        const id = window.setInterval(() => {
          i++;
          e.textContent = fmt(to * (1 - Math.pow(1 - i / steps, 3)));
          if (i >= steps) { clearInterval(id); e.textContent = fmt(to); }
        }, 40);
        self.timers.push(id);
      },
      particles(host, o = {}) {
        const h = el(host);
        if (!h || self.instant || self.reduced) return;
        const n = o.count ?? 8, dur = o.duration ?? 1200;
        const at = (v: Pt | undefined, d: { x: number; y: number }) => {
          if (typeof v !== 'string') return v ?? d;
          const t = q(v);
          if (!t) return d;
          const hr = h.getBoundingClientRect(), r = t.getBoundingClientRect();
          return { x: ((r.left + r.width / 2 - hr.left) / hr.width) * 100, y: ((r.top + r.height / 2 - hr.top) / hr.height) * 100 };
        };
        const from = at(o.from, { x: 50, y: 90 }), to = at(o.to, { x: 50, y: 10 });
        for (let i = 0; i < n; i++) {
          api.after(i * (dur / n / 1.6), () => {
            const p = document.createElement('div');
            p.className = 'msd-particle';
            if (o.color) p.style.setProperty('--pc', o.color);
            const jitter = (Math.random() - 0.5) * (o.spread ?? 16);
            p.style.left = `calc(${from.x}% + ${jitter}px)`;
            p.style.top = `${from.y}%`;
            p.style.transition = `left ${dur}ms cubic-bezier(.4,0,.2,1), top ${dur}ms cubic-bezier(.4,0,.2,1), opacity ${dur}ms ease`;
            h.appendChild(p);
            requestAnimationFrame(() => requestAnimationFrame(() => {
              p.style.left = `calc(${to.x}% + ${jitter}px)`;
              p.style.top = `${to.y}%`;
              p.style.opacity = '0';
            }));
            window.setTimeout(() => p.remove(), dur + 150);
          });
        }
      },
      stream(host, o = {}) {
        if (self.instant || self.reduced) return;
        let pulse = 0;
        api.particles(host, o);
        if (!o.silent) SFX.data(0);
        api.every(o.gap ?? 620, () => { api.particles(host, o); pulse++; if (!o.silent) SFX.data(pulse % 4); });
      },
      focus(sel, others) {
        qa('.msd-focus').forEach((e) => e.classList.remove('msd-focus'));
        qa('.msd-recede').forEach((e) => e.classList.remove('msd-recede'));
        if (others) qa(others).forEach((e) => e.classList.add('msd-recede'));
        qa(sel).forEach((e) => { e.classList.remove('msd-recede'); e.classList.add('msd-focus'); });
        SFX.focus();
      },
      unfocus: () => qa('.msd-focus, .msd-recede').forEach((e) => e.classList.remove('msd-focus', 'msd-recede')),
      flash: (sel) => { if (!self.instant) retrigger(sel, 'msd-flash'); SFX.pop(); },
      punch: (sel, i = 0) => { if (!self.instant) retrigger(sel, 'msd-punch'); SFX.blip(i); },
      shake: (sel) => { if (!self.instant) retrigger(sel, 'msd-shake'); SFX.error(); },
    };
    return api;
  }

  /* -------------------------------------------------------- sequencer -- */
  private clearTimers() {
    this.timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    this.timers = [];
    this.stage.querySelectorAll('.msd-particle').forEach((p) => p.remove());
  }

  private runStage(i: number) {
    try {
      this.spec.stages[i].run?.(this.api);
    } catch (err) {
      console.error(`[explainer ${this.spec.id}] step ${i + 1} failed`, err);
    }
  }

  private paint(i: number) {
    const s = this.spec.stages[i];
    const n = this.spec.stages.length;
    const q = (c: string) => this.root.querySelector<HTMLElement>(c)!;
    q('.xv-num').textContent = `STEP ${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
    let t = escapeHtml(s.title);
    if (s.key) t = t.replace(escapeHtml(s.key), `<span class="kw-hl">${escapeHtml(s.key)}</span>`);
    q('.xv-title').innerHTML = t;
    q('.xv-desc').textContent = s.desc;
    q('.xv-status-text').textContent = s.status;
    q('.xv-thinking').classList.toggle('show', !!s.thinking);
    q('.xv-cc').textContent = s.say;
    const cap = q('.xv-caption');
    cap.classList.remove('pulse');
    void cap.offsetWidth;
    cap.classList.add('pulse');
    this.segs.forEach((seg, k) => {
      seg.classList.remove('active');
      seg.classList.toggle('done', k < i);
      if (k === i) {
        (seg.firstElementChild as HTMLElement).style.setProperty('--seg-dur', `${holdFor(s)}ms`);
        void seg.offsetWidth;
        seg.classList.add('active');
      }
    });
    q('.xv-live').textContent = `Step ${i + 1} of ${n}: ${s.title}. ${s.say}`;
    const label = this.root.querySelector('.xv-steplabel');
    if (label) label.textContent = `${i + 1} / ${n}`;
  }

  start() {
    ensureAudio();
    this.started = true;
    this.root.classList.add('xv-started');
    this.seek(0);
  }

  private claim() {
    if (activePlayer && activePlayer !== this) activePlayer.pause();
    activePlayer = this;
    window.dispatchEvent(new CustomEvent('speech-stop-all'));
    stopSpeaking();
  }

  /** Rebuilds the stage up to step i silently, then plays step i. */
  seek(i: number) {
    if (!this.started) { this.started = true; this.root.classList.add('xv-started'); }
    ensureAudio();
    this.claim();
    this.token++;
    this.clearTimers();
    stopSpeaking();
    this.finished = false;
    this.root.classList.remove('xv-finished');
    this.stage.innerHTML = this.snapshot;
    this.canvas.classList.add('xv-instant');
    this.instant = true;
    for (let k = 0; k < i; k++) this.runStage(k);
    this.instant = false;
    void this.canvas.offsetWidth;
    this.canvas.classList.remove('xv-instant');
    this.playing = true;
    this.paintPlay();
    this.play(i);
  }

  private play(i: number) {
    const s = this.spec.stages[i];
    const tok = this.token;
    this.cur = i;
    this.paint(i);
    SFX.whoosh(true);
    if (i === 0) SFX.thud();
    else SFX.blip(i);
    const hold = holdFor(s);
    if (i === this.spec.stages.length - 1 && hold > 1400) {
      const r = Math.min(1100, Math.round(hold * 0.45));
      this.api.after(hold - r, () => SFX.riser(r));
    }
    this.runStage(i);

    const timer = new Promise<void>((r) => this.timers.push(window.setTimeout(r, hold)));
    // Let the cut's whoosh land before the voice starts.
    const voice = this.prefs.voice && canSpeak()
      ? new Promise<void>((r) => this.timers.push(window.setTimeout(() => speak(s.say).then(r), 350)))
      : Promise.resolve();
    Promise.all([timer, voice]).then(() => {
      if (tok !== this.token || !this.playing) return;
      this.timers.push(window.setTimeout(() => {
        if (tok !== this.token || !this.playing) return;
        if (i + 1 < this.spec.stages.length) this.play(i + 1);
        else this.finish();
      }, STEP_GAP));
    });
  }

  private finish() {
    this.token++;
    this.clearTimers();
    stopSpeaking();
    this.playing = false;
    this.finished = true;
    this.segs.forEach((seg) => { seg.classList.remove('active'); seg.classList.add('done'); });
    this.root.classList.add('xv-finished');
    this.root.querySelector('.xv-live')!.textContent = `Finished. ${this.spec.end.title}. ${this.spec.end.sub}`;
    SFX.thud();
    SFX.resolve();
    this.paintPlay();
  }

  pause() {
    if (!this.playing) return;
    this.token++;
    this.clearTimers();
    stopSpeaking();
    this.playing = false;
    this.segs[this.cur]?.classList.remove('active');
    this.paintPlay();
  }

  private toggle() {
    if (!this.started) return this.start();
    if (this.playing) return this.pause();
    if (this.finished) return this.seek(0);
    this.seek(Math.max(0, this.cur)); // resume replays the current step from its start
  }
}

soundGate = () => {
  const p = activePlayer as unknown as { prefs: Prefs; instant: boolean } | null;
  return !!p && p.prefs.sfx && !p.instant;
};
