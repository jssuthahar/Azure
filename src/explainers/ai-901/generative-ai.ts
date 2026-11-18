import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const WORDS = ['The', ' Taj', ' Mahal', ' is', ' in'];
const toks = WORDS.map((w, i) => `<span class="ga-tok t${i}"><b>${w.trim()}</b><i class="ga-vec"><s></s><s></s><s></s><s></s><s></s></i></span>`).join('');
const CANDS: [string, number, number][] = [
  [' Agra', 86, 55],
  [' India', 9, 21],
  [' the', 3, 13],
  [' Uttar', 2, 11],
];
const bars = CANDS.map(
  ([w, lo, hi], i) => `<div class="ga-bar b${i}" style="--lo:${lo}%;--hi:${hi}%"><span class="msd-mono">${w.trim()}</span><div class="ga-track"><i></i></div><b class="msd-mono"><span class="lo">${lo}%</span><span class="hi">${hi}%</span></b></div>`,
).join('');

const spec: ExplainerSpec = {
  id: 'generative-ai',
  lesson: 'how-generative-ai-works',
  title: {
    main: 'Generative AI writes <em>one token at a time</em>',
    sub: 'Embeddings, attention and next-token prediction, plus what temperature really changes.',
  },
  summary: 'An animation of a language model completing “The Taj Mahal is in”: tokens become embeddings, attention links “in” to “Taj Mahal”, the model scores possible next tokens with Agra at 86 percent, appends it and repeats, then a temperature dial flattens the scores, and a warning explains hallucination and grounding.',
  html: `
  <div class="ga">
    <div class="ga-line msd-card">
      <span class="msd-label">Prompt → model</span>
      <div class="ga-toks">${toks}<span class="ga-new n0 msd-pop">Agra</span><span class="ga-new n1 msd-pop">,</span><span class="ga-new n2 msd-pop">India</span><span class="ga-new n3 msd-pop">.</span></div>
      <svg class="ga-att" aria-hidden="true"><path class="a1"/><path class="a2"/></svg>
    </div>
    <div class="ga-mid">
      <div class="ga-model msd-node"><span class="ic">${I.brain}</span><span>Transformer<small>attention layers</small></span></div>
      <div class="ga-probs msd-card msd-reveal">
        <div class="ga-ph"><span class="msd-label">Next-token scores</span><span class="ga-temp msd-pill">${I.meter}<span>temperature <b class="ga-t">0.2</b></span></span></div>
        ${bars}
      </div>
    </div>
    <div class="ga-warn msd-reveal">
      <span class="msd-pill bad">${I.warn}Fluent ≠ true: it can hallucinate</span>
      <span class="msd-pill ok">${I.file}Grounding in your data reduces it</span>
    </div>
    <div class="ga-flow"></div>
  </div>`,
  css: `
  @S .ga{ position:relative; height:100%; display:flex; flex-direction:column; gap:20px; }
  @S .ga-line{ position:relative; padding:22px 24px 26px; display:flex; flex-direction:column; gap:14px; }
  @S .ga-toks{ display:flex; flex-wrap:wrap; gap:10px; align-items:flex-start; }
  @S .ga-tok{ display:inline-flex; flex-direction:column; gap:8px; align-items:center; padding:10px 14px; border-radius:12px; background:rgb(58 160 255 / .14); border:1.5px solid rgb(58 160 255 / .45); }
  @S .ga-tok b{ font-family:var(--x-mono); font-size:34px; color:#fff; }
  @S .ga-vec{ display:flex; gap:3px; height:0; overflow:hidden; transition:height .35s; }
  @S .ga.emb .ga-vec{ height:34px; }
  @S .ga-vec s{ width:10px; border-radius:3px; background:var(--x-cyan); align-self:flex-end; }
  @S .ga-vec s:nth-child(1){ height:60%; } @S .ga-vec s:nth-child(2){ height:30%; } @S .ga-vec s:nth-child(3){ height:90%; } @S .ga-vec s:nth-child(4){ height:45%; } @S .ga-vec s:nth-child(5){ height:70%; }
  @S .ga-tok.t1 .ga-vec s, @S .ga-tok.t2 .ga-vec s{ background:var(--x-you); }
  @S .ga-new{ font-family:var(--x-mono); font-size:34px; color:#0e1420; background:var(--x-ok); padding:10px 14px; border-radius:12px; font-weight:800; }
  @S .ga-att{ position:absolute; left:0; top:0; opacity:0; transition:opacity .3s; overflow:visible; pointer-events:none; }
  @S .ga-att path{ fill:none; stroke:var(--x-you); stroke-width:3; vector-effect:non-scaling-stroke; stroke-dasharray:8 8; animation:xv-dash 1.1s linear infinite; }
  @S .ga.att .ga-att{ opacity:1; }
  @S .ga.att .ga-tok.t1, @S .ga.att .ga-tok.t2{ border-color:var(--x-you); background:rgb(180 140 255 / .18); }
  @S .ga.att .ga-tok.t4{ border-color:var(--x-you); }
  @S .ga-mid{ flex:1; display:grid; grid-template-columns:320px 1fr; gap:20px; min-height:0; }
  @S .ga-model{ flex-direction:column; justify-content:center; text-align:center; }
  @S .ga-model .ic{ width:96px; height:96px; border-radius:26px; } @S .ga-model .ic svg{ width:60px; height:60px; }
  @S .ga-model small{ display:block; color:var(--x-dim); font-size:19px; font-family:var(--x-mono); margin-top:6px; }
  @S .ga-probs{ padding:22px 24px; display:flex; flex-direction:column; gap:14px; justify-content:center; }
  @S .ga-ph{ display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; }
  @S .ga-temp svg{ width:24px; height:24px; } @S .ga-temp b{ color:var(--x-cyan); }
  @S .ga-bar{ display:grid; grid-template-columns:120px 1fr 90px; gap:14px; align-items:center; }
  @S .ga-bar > span{ color:#fff; font-size:28px; }
  @S .ga-track{ height:30px; border-radius:10px; background:rgb(255 255 255 / .05); overflow:hidden; }
  @S .ga-track i{ display:block; height:100%; width:0; border-radius:10px; background:linear-gradient(90deg, var(--x-a1), var(--x-cyan)); transition:width .9s cubic-bezier(.22,1,.36,1); }
  @S .ga-probs.show .ga-track i{ width:var(--lo); }
  @S .ga.hot .ga-track i{ width:var(--hi) !important; }
  @S .ga-bar b{ color:var(--x-a1); font-size:24px; text-align:right; }
  @S .ga-bar .hi{ display:none; } @S .ga.hot .ga-bar .hi{ display:inline; } @S .ga.hot .ga-bar .lo{ display:none; }
  @S .ga-bar.b0.pick{ outline:2px solid var(--x-ok); outline-offset:6px; border-radius:8px; }
  @S .ga-warn{ display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
  @S .ga-warn svg{ width:24px; height:24px; }
  @S .ga-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .ga-mid{ grid-template-columns:1fr; grid-template-rows:auto 1fr; }
  @P .ga-model{ flex-direction:row; text-align:left; padding:16px 20px; }
  @P .ga-model .ic{ width:72px; height:72px; }
  @P .ga-warn{ flex-direction:column; align-items:center; }
  `,
  stages: [
    {
      title: 'It starts with your prompt',
      key: 'prompt',
      desc: 'The prompt is split into tokens, the same way we saw in the tokens video.',
      status: 'prompt · 5 tokens',
      say: 'You type a prompt. The model splits it into tokens, just like we saw before.',
      run: (m) => {
        m.qa('.ga-tok').forEach((t, i) => m.after(i * 150, () => m.punch(`.ga-tok.t${i}`, i)));
      },
    },
    {
      title: 'Tokens become embeddings',
      key: 'embeddings',
      desc: 'Each token becomes a list of numbers that captures meaning. Similar words get similar numbers.',
      status: 'embedding · 5 vectors',
      say: 'Each token is turned into an embedding, a list of numbers that captures its meaning. Similar words end up with similar numbers.',
      run: (m) => {
        m.cls('.ga', 'emb');
        m.sfx.sparkle();
      },
    },
    {
      title: 'Attention links the words',
      key: 'Attention',
      desc: 'Transformer layers work out which tokens matter to each other. “in” looks at “Taj Mahal”.',
      status: 'attention · in → Taj Mahal',
      thinking: true,
      say: "Inside the transformer, attention works out which words matter to each other. Here, the word 'in' pays most attention to 'Taj Mahal'.",
      run: (m) => {
        // Draw the arcs from the real token positions (works in both layouts).
        const line = m.q('.ga-line')!;
        const lr = line.getBoundingClientRect();
        const k = line.offsetWidth / lr.width;
        const at = (sel: string) => { const r = m.q(sel)!.getBoundingClientRect(); return { x: (r.left + r.width / 2 - lr.left) * k, y: (r.top - lr.top) * k }; };
        const from = at('.ga-tok.t4');
        const svg = m.q('.ga-att')!;
        svg.setAttribute('width', String(line.offsetWidth));
        svg.setAttribute('height', String(line.offsetHeight));
        svg.setAttribute('viewBox', `0 0 ${line.offsetWidth} ${line.offsetHeight}`);
        (['.ga-tok.t1', '.ga-tok.t2'] as const).forEach((sel, i) => {
          const to = at(sel);
          const lift = Math.max(10, from.y - 46 + i * 14);
          svg.querySelector(`.a${i + 1}`)!.setAttribute('d', `M${from.x} ${from.y} C ${from.x} ${lift}, ${to.x} ${lift}, ${to.x} ${to.y}`);
        });
        m.cls('.ga', 'att');
        m.cls('.ga-model', 'hot');
        m.sfx.focus();
        m.stream('.ga-flow', { from: '.ga-toks', to: '.ga-model', count: 5, duration: 800, gap: 700, silent: true });
      },
    },
    {
      title: 'Score every possible next token',
      key: 'next token',
      desc: 'The model gives every token in its vocabulary a probability. Agra wins easily.',
      status: 'top token · Agra · 0.86',
      say: 'Then it scores every possible next token. Agra is by far the most likely.',
      run: (m) => {
        m.show('.ga-probs', 0);
        m.after(1100, () => { m.cls('.ga-bar.b0', 'pick'); m.sfx.ding(); });
      },
    },
    {
      title: 'Pick one, add it, repeat',
      key: 'repeat',
      desc: 'The chosen token is added to the text and the whole loop runs again for the next one.',
      status: 'generating · Agra, India.',
      say: 'It picks a token, adds it to the text, and runs the whole thing again for the next one. That loop is all that generation is.',
      run: (m) => {
        m.cls('.ga-model', 'hot', false);
        m.particles('.ga-flow', { from: '.ga-bar.b0', to: '.ga-new.n0', count: 6, duration: 700 });
        m.after(700, () => m.show('.ga-new.n0', 0));
        m.after(1500, () => m.show('.ga-new.n1', 0));
        m.after(2100, () => m.show('.ga-new.n2', 0));
        m.after(2700, () => m.show('.ga-new.n3', 0));
      },
    },
    {
      title: 'Temperature changes the pick',
      key: 'Temperature',
      desc: 'Low temperature sticks to the likeliest token. High temperature takes more chances.',
      status: 'temperature 0.2 → 1.2',
      say: 'Temperature controls how adventurous each pick is. Low temperature sticks to the likeliest token. High temperature spreads the chances out, which is good for creative writing.',
      run: (m) => {
        m.cls('.ga-bar.b0', 'pick', false);
        m.after(800, () => { m.cls('.ga', 'hot'); m.text('.ga-t', '1.2'); m.sfx.riser(900); });
      },
    },
    {
      title: 'Fluent isn’t the same as true',
      key: 'true',
      desc: 'It predicts what sounds right, not what’s checked. Ground it in your data.',
      status: 'risk · hallucination · fix · grounding',
      say: "The model predicts what sounds right, not what has been checked. That's why it can hallucinate, and why grounding it in your own data matters.",
      run: (m) => {
        m.show('.ga-warn', 0);
        m.after(300, () => m.sfx.error());
        m.after(1400, () => m.sfx.chime());
      },
    },
  ],
  end: {
    title: 'Predict, append, repeat',
    sub: 'Every reply is built one token at a time. Temperature tunes the risk, grounding keeps it honest.',
  },
};

export default spec;
