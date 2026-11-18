import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

// Deterministic pseudo-random bar heights so the waveform is identical on every render.
const wave = (n: number, seed: number, gaps: number[] = []) =>
  Array.from({ length: n }, (_, i) => {
    const h = gaps.includes(i) ? 6 : 18 + Math.abs(Math.sin(i * 1.7 + seed) * 70 + Math.sin(i * 0.45 + seed) * 20);
    return `<i style="--h:${Math.min(96, h).toFixed(0)}%;--d:${(i % 9) * 0.07}s"></i>`;
  }).join('');

const spec: ExplainerSpec = {
  id: 'speech',
  lesson: 'speech-recognition-and-synthesis',
  title: {
    main: 'Speech in, text out. <em>Text in, voice out.</em>',
    sub: 'Speech to text, speaker diarization, translation, neural voices and SSML, in one support call.',
  },
  summary: 'An animation of a support call: speech is transcribed to text, speaker diarization labels the agent and the customer, a Tamil sentence is translated to English, a neural voice reads a reply aloud, SSML slows down a one-time password and adds a pause, and the voice assistant pipeline is compared with audio-capable multimodal models.',
  html: `
  <div class="sp">
    <div class="sp-in msd-card">
      <div class="sp-h"><span class="msd-label">${I.wifi}Audio in</span><span class="msd-chip sp-mode">speech to text</span></div>
      <div class="sp-wave w-in">${wave(48, 1)}</div>
      <div class="sp-lines">
        <p class="sp-line l1 msd-reveal"><b class="who">Speaker 1</b><span class="t1"></span></p>
        <p class="sp-line l2 msd-reveal"><b class="who">Speaker 2</b><span class="t2"></span></p>
        <p class="sp-line l3 msd-reveal"><b class="who c">Customer</b><span class="ta">என் ஆர்டர் எங்கே?</span><span class="tr msd-mono"></span></p>
      </div>
    </div>
    <div class="sp-outc msd-card msd-reveal">
      <div class="sp-h"><span class="msd-label">${I.chat}Voice out</span><span class="msd-chip">en-IN-NeerjaNeural</span></div>
      <p class="sp-say">Your one-time password is <b class="otp">4 7 2 9</b>. <i class="brk">pause</i> It expires in five minutes.</p>
      <div class="sp-wave w-out">${wave(48, 4, [20, 21, 22, 23, 30, 31, 32, 33, 34])}</div>
      <pre class="sp-ssml msd-reveal msd-mono">&lt;prosody rate="slow"&gt;4 7 2 9&lt;/prosody&gt;
&lt;break time="500ms"/&gt;</pre>
    </div>
    <div class="sp-pipe msd-reveal">
      <span class="msd-pill">${I.wifi}Speech to text</span><b>→</b><span class="msd-pill">${I.brain}Model answers</span><b>→</b><span class="msd-pill">${I.chat}Text to speech</span>
      <em>or one audio-capable model that hears and speaks directly</em>
    </div>
  </div>`,
  css: `
  @S .sp{ height:100%; display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr auto; gap:18px; }
  @S .sp-in, @S .sp-outc{ padding:20px; display:flex; flex-direction:column; gap:14px; min-height:0; }
  @S .sp-h{ display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; }
  @S .sp-h .msd-label{ display:flex; align-items:center; gap:10px; } @S .sp-h .msd-label svg{ width:26px; height:26px; color:var(--x-a1); }
  @S .sp-wave{ height:120px; display:flex; align-items:center; gap:4px; padding:0 4px; }
  @S .sp-wave i{ flex:1; height:var(--h); min-height:4px; border-radius:4px; background:linear-gradient(180deg, var(--x-cyan), var(--x-a1)); opacity:.35; transform-origin:center; transition:opacity .3s; }
  @S .sp-wave.live i{ opacity:1; animation:sp-bounce .9s ease-in-out infinite; animation-delay:var(--d); }
  @S .w-out i{ background:linear-gradient(180deg, var(--x-ok), var(--x-cyan)); }
  @keyframes sp-bounce{ 0%,100%{ transform:scaleY(.55); } 50%{ transform:scaleY(1); } }
  @S .sp-lines{ display:flex; flex-direction:column; gap:10px; }
  @S .sp-line{ margin:0; display:flex; flex-wrap:wrap; gap:10px; align-items:baseline; padding:12px 14px; border-radius:14px; background:rgb(255 255 255 / .05); border:1.5px solid var(--x-line); font-size:22px; color:#fff; }
  @S .sp-line .who{ font-family:var(--x-mono); font-size:18px; padding:3px 10px; border-radius:8px; background:rgb(58 160 255 / .14); color:var(--x-a1); transition:all .3s; }
  @S .sp-line .who.c{ background:rgb(180 140 255 / .16); color:var(--x-you); }
  @S .sp-line .tr{ width:100%; color:var(--x-cyan); font-size:20px; }
  @S .sp-say{ margin:0; font-size:26px; line-height:1.5; color:#fff; }
  @S .sp-say .otp{ color:var(--x-text); transition:letter-spacing .4s, color .3s; }
  @S .sp-say .brk{ display:none; font-style:normal; font-family:var(--x-mono); font-size:16px; padding:2px 8px; border-radius:6px; background:rgb(240 166 74 / .16); color:var(--x-warn); }
  @S .sp.ssml .otp{ letter-spacing:14px; color:var(--x-warn); } @S .sp.ssml .brk{ display:inline; }
  @S .sp-ssml{ margin:0; font-size:19px; color:var(--x-warn); padding:12px 14px; border-radius:12px; background:rgb(240 166 74 / .08); white-space:pre-wrap; }
  @S .sp-pipe{ grid-column:1 / -1; display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:center; }
  @S .sp-pipe b{ color:var(--x-a1); font-size:28px; }
  @S .sp-pipe em{ width:100%; text-align:center; font-style:normal; color:var(--x-dim); font-size:20px; }
  @media (prefers-reduced-motion: reduce){ @S .sp-wave.live i{ animation:none; } }
  @P .sp{ grid-template-columns:1fr; grid-template-rows:auto auto auto; gap:12px; }
  @P .sp-wave{ height:90px; }
  @P .sp-say{ font-size:24px; }
  @P .sp-pipe b{ display:none; }
  `,
  stages: [
    {
      title: 'A support call comes in',
      key: 'call',
      desc: 'Spoken audio streams in. On its own, an app can’t search or store what was said.',
      status: 'audio · 16 kHz · live',
      say: "A customer calls support. The audio streams in, but on its own an app can't search it, store it, or act on what was said.",
      run: (m) => {
        m.cls('.w-in', 'live');
        m.sfx.whoosh(true);
      },
    },
    {
      title: 'Speech to text',
      key: 'Speech to text',
      desc: 'Speech recognition turns the audio into text, live or from a recording.',
      status: 'recognize · real-time',
      thinking: true,
      say: 'Speech recognition, also called speech to text, turns that audio into text. It can work live as people talk, or on a recording afterwards.',
      run: (m) => {
        m.show('.sp-line.l1', 0, true);
        m.type('.t1', 'Thanks for calling Contoso, how can I help?', 30);
        m.after(1900, () => { m.show('.sp-line.l2', 0, true); m.type('.t2', 'My parcel says delivered but it never came.', 30); });
      },
    },
    {
      title: 'Who said what: diarization',
      key: 'diarization',
      desc: 'Speaker diarization labels each turn, so a transcript shows Agent and Customer.',
      status: 'diarization · 2 speakers',
      say: 'Speaker diarization works out who said what, so the transcript shows the agent and the customer as separate speakers.',
      run: (m) => {
        m.after(300, () => { m.text('.l1 .who', 'Agent'); m.punch('.l1 .who', 2); });
        m.after(900, () => { const w = m.q('.l2 .who')!; w.textContent = 'Customer'; w.classList.add('c'); m.punch('.l2 .who', 4); });
      },
    },
    {
      title: 'Speech translation',
      key: 'translation',
      desc: 'Speech in one language comes out as text or speech in another.',
      status: 'translate · ta-IN → en-IN',
      say: 'Speech translation handles a second language. A Tamil-speaking customer asks where their order is, and the agent reads it in English.',
      run: (m) => {
        m.text('.sp-mode', 'speech translation');
        m.show('.sp-line.l3', 0);
        m.after(900, () => m.type('.tr', '→ "Where is my order?"', 30));
      },
    },
    {
      title: 'Text to speech',
      key: 'Text to speech',
      desc: 'A neural voice reads text aloud and sounds close to a real person.',
      status: 'synthesize · en-IN-NeerjaNeural',
      say: 'Speech synthesis, or text to speech, goes the other way. A neural voice, like the Indian English voice Neerja, reads text aloud and sounds close to a real person.',
      run: (m) => {
        m.cls('.w-in', 'live', false);
        m.show('.sp-outc', 0, true);
        m.after(500, () => { m.cls('.w-out', 'live'); m.sfx.chime(); });
      },
    },
    {
      title: 'Shape it with SSML',
      key: 'SSML',
      desc: 'SSML markup controls speed, pitch and pauses. Slow down for the OTP, then pause.',
      status: 'SSML · prosody rate slow · break 500ms',
      say: 'With SSML markup you control how it speaks. Here it slows down for the one-time password, then pauses before the last sentence.',
      run: (m) => {
        m.show('.sp-ssml', 0);
        m.after(500, () => { m.cls('.sp', 'ssml'); m.sfx.lock(); });
      },
    },
    {
      title: 'Put both together',
      key: 'both together',
      desc: 'Voice assistants chain speech to text, a model and text to speech, or use one audio-capable model.',
      status: 'pipeline · STT → model → TTS',
      say: 'A voice assistant chains the two: speech to text, a model works out the answer, then text to speech replies. Newer audio-capable models can also hear and speak directly.',
      run: (m) => {
        m.show('.sp-pipe', 0);
        m.after(700, () => m.sfx.resolve());
      },
    },
  ],
  end: {
    title: 'Audio to text is recognition. Text to audio is synthesis.',
    sub: 'Who said what is diarization. Speed and pauses are SSML. Your own words and accents need custom speech.',
  },
};

export default spec;
