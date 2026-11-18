import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const LAYERS = [
  { k: 'in', x: 110, n: 5 },
  { k: 'h1', x: 390, n: 6 },
  { k: 'h2', x: 660, n: 6 },
  { k: 'out', x: 900, n: 2 },
];
const ys = (n: number) => Array.from({ length: n }, (_, i) => (n === 2 ? 190 + i * 180 : 50 + (i * 460) / (n - 1)));
const lines = LAYERS.slice(0, -1)
  .map((L, li) => {
    const R = LAYERS[li + 1];
    return ys(L.n).flatMap((y1) => ys(R.n).map((y2) => `<line class="l l${li}" x1="${L.x}" y1="${y1}" x2="${R.x}" y2="${y2}"/>`)).join('');
  })
  .join('');
const nodes = LAYERS.map((L) => ys(L.n).map((y, i) => `<circle class="n n-${L.k} i${i}" cx="${L.x}" cy="${y}" r="22"/>`).join('')).join('');
const SVG = `<svg class="nn-svg" viewBox="0 0 1060 560" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
  <g class="lines">${lines}</g><g class="nodes">${nodes}</g>
  <text class="t-lab" x="110" y="548">Input</text><text class="t-lab" x="390" y="548">Hidden 1</text><text class="t-lab" x="660" y="548">Hidden 2</text><text class="t-lab" x="900" y="548">Output</text>
  <text class="t-what w1" x="390" y="22">edges</text><text class="t-what w2" x="660" y="22">ears · whiskers</text>
  <text class="t-out o0" x="934" y="198">Cat <tspan class="p0">0%</tspan></text><text class="t-out o1" x="934" y="378">Dog <tspan class="p1">0%</tspan></text>
</svg>`;

const spec: ExplainerSpec = {
  id: 'neural-network',
  lesson: 'what-is-ai',
  title: {
    main: 'Layers of tiny decisions <em>add up to “cat”</em>',
    sub: 'How a neural network turns pixels into an answer, and what makes it “deep” learning.',
  },
  summary: 'An animation of a single artificial neuron, then a network with an input layer, two hidden layers and an output layer. A photo’s pixels flow through it, early layers spot edges and later layers spot shapes, the output scores cat at 92 percent, and a wrong guess during training sends corrections back to adjust the weights.',
  html: `
  <div class="nn">
    <div class="nn-one msd-card msd-reveal">
      <div class="nn-ins"><span>pixel 0.8 <i>× w 0.6</i></span><span>pixel 0.1 <i>× w −0.4</i></span><span>pixel 0.5 <i>× w 0.9</i></span></div>
      <b class="nn-arr">→</b><div class="nn-sum">Σ</div><b class="nn-arr">→</b><div class="nn-outv msd-pill accent">signal <span class="nn-sig">0.0</span></div>
    </div>
    <div class="nn-body">
      <div class="nn-img msd-card msd-reveal"><span class="nn-pic" aria-hidden="true">🐱</span><div class="nn-px"></div><small class="msd-mono">photo → numbers</small></div>
      <div class="nn-net msd-reveal">${SVG}</div>
    </div>
    <div class="nn-deep msd-stagger">
      <span class="msd-pill accent">${I.layers}Many hidden layers = deep learning</span>
      <span class="msd-pill">Speech</span><span class="msd-pill">Vision</span><span class="msd-pill">Language models</span>
    </div>
    <div class="nn-flow"></div>
  </div>`,
  css: `
  @S .nn{ position:relative; height:100%; display:flex; flex-direction:column; gap:18px; }
  @S .nn-one{ position:absolute; z-index:7; inset:120px 40px auto 40px; padding:36px; display:flex; align-items:center; justify-content:center; gap:24px; transition:opacity .35s, transform .35s; }
  @S .nn-one.gone{ opacity:0; transform:scale(.9); pointer-events:none; }
  @S .nn-ins{ display:flex; flex-direction:column; gap:14px; }
  @S .nn-ins span{ font-family:var(--x-mono); font-size:26px; color:var(--x-text); padding:10px 16px; border-radius:12px; background:rgb(255 255 255 / .05); }
  @S .nn-ins i{ color:var(--x-cyan); font-style:normal; }
  @S .nn-arr{ color:var(--x-a1); font-size:44px; }
  @S .nn-sum{ width:110px; height:110px; border-radius:50%; display:grid; place-items:center; font-size:60px; color:#0e1420; background:var(--x-a1); font-weight:900; box-shadow:0 0 40px rgb(58 160 255 / .5); }
  @S .nn-outv{ font-size:26px; }
  @S .nn-body{ flex:1; display:grid; grid-template-columns:260px 1fr; gap:20px; min-height:0; }
  @S .nn-img{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:18px; position:relative; }
  @S .nn-img > span{ font-size:120px; line-height:1; transition:filter .3s; }
  @S .nn-px{ width:160px; height:60px; border-radius:10px; background:repeating-linear-gradient(90deg, rgb(58 160 255 / .35) 0 12px, rgb(34 211 238 / .15) 12px 24px), repeating-linear-gradient(0deg, transparent 0 12px, rgb(0 0 0 / .3) 12px 14px); opacity:0; transition:opacity .3s; }
  @S .nn-img.pix .nn-px{ opacity:1; }
  @S .nn-img small{ color:var(--x-dim); font-size:18px; }
  @S .nn-net{ min-height:0; display:flex; }
  @S .nn-svg{ width:100%; height:100%; }
  @S .nn-svg .l{ stroke:rgb(139 149 167 / .18); stroke-width:2; transition:stroke .4s, stroke-width .4s; }
  @S .nn-svg .n{ fill:#141b2b; stroke:#3a4660; stroke-width:3; transition:fill .35s, stroke .35s; }
  @S .nn-svg text{ font-family:var(--x-font); fill:var(--x-dim); font-size:22px; font-weight:700; text-anchor:middle; }
  @S .nn-svg .t-what{ fill:var(--x-cyan); opacity:0; transition:opacity .3s; }
  @S .nn-svg .t-out{ text-anchor:start; fill:#fff; font-size:28px; opacity:0; transition:opacity .3s; }
  @S .nn-svg .t-out tspan{ fill:var(--x-a1); font-family:var(--x-mono); }
  @S .nn-svg.a0 .n-in{ fill:var(--x-cyan); stroke:var(--x-cyan); }
  @S .nn-svg.a1 .l0{ stroke:rgb(34 211 238 / .55); }
  @S .nn-svg.a1 .n-h1{ fill:var(--x-a1); stroke:var(--x-a1); }
  @S .nn-svg.a1 .w1{ opacity:1; }
  @S .nn-svg.a2 .l1{ stroke:rgb(58 160 255 / .55); }
  @S .nn-svg.a2 .n-h2{ fill:var(--x-a1); stroke:var(--x-a1); }
  @S .nn-svg.a2 .w2{ opacity:1; }
  @S .nn-svg.a3 .l2{ stroke:rgb(58 160 255 / .7); }
  @S .nn-svg.a3 .n-out.i0{ fill:var(--x-ok); stroke:var(--x-ok); }
  @S .nn-svg.a3 .t-out{ opacity:1; }
  @S .nn-svg.wrong .n-out.i0{ fill:var(--x-bad); stroke:var(--x-bad); }
  @S .nn-svg.dogwin .n-out.i0{ fill:#141b2b; stroke:#3a4660; }
  @S .nn-svg.dogwin .n-out.i1{ fill:var(--x-ok); stroke:var(--x-ok); }
  @S .nn-svg.back .l{ stroke:var(--x-warn); stroke-dasharray:8 10; animation:nn-back 0.9s linear infinite; }
  @keyframes nn-back{ to{ stroke-dashoffset:36; } }
  @S .nn-deep{ display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
  @S .nn-deep svg{ width:26px; height:26px; }
  @S .nn-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .nn-body{ grid-template-columns:1fr; grid-template-rows:240px 1fr; }
  @P .nn-img{ flex-direction:row; }
  @P .nn-one{ flex-direction:column; inset:60px 20px auto 20px; }
  @P .nn-arr{ transform:rotate(90deg); }
  `,
  stages: [
    {
      title: 'One neuron, one tiny decision',
      key: 'One neuron',
      desc: 'A neuron multiplies each input by a weight, adds them up, and passes a signal on.',
      status: 'neuron · Σ(input × weight)',
      say: 'A neural network is built from simple units called neurons. Each one takes some numbers in, weighs them, adds them up, and passes a signal on.',
      run: (m) => {
        m.show('.nn-one', 0);
        m.after(900, () => { m.punch('.nn-sum', 3); m.count('.nn-sig', 0.88, 900, { decimals: 2 }); });
      },
    },
    {
      title: 'Stack neurons in layers',
      key: 'layers',
      desc: 'An input layer takes the data, hidden layers do the work, an output layer answers.',
      status: 'network · 4 layers · 19 neurons',
      say: 'Neurons are arranged in layers. An input layer takes the data, hidden layers in the middle do the work, and an output layer gives the answer.',
      run: (m) => {
        m.cls('.nn-one', 'gone');
        m.show('.nn-net', 0);
        m.sfx.whoosh(true);
      },
    },
    {
      title: 'Feed in a photo',
      key: 'photo',
      desc: 'Every pixel becomes a number on the input layer.',
      status: 'input · 224 × 224 pixels',
      say: 'Feed in a photo, and every pixel becomes a number on the input layer.',
      run: (m) => {
        m.show('.nn-img', 0);
        m.after(500, () => { m.cls('.nn-img', 'pix'); m.sfx.tick(); });
        m.after(900, () => { m.particles('.nn-flow', { from: '.nn-px', to: '.n-in.i2', count: 8, duration: 800 }); });
        m.after(1700, () => { m.cls('.nn-svg', 'a0'); m.sfx.blip(2); });
      },
    },
    {
      title: 'Each layer spots more',
      key: 'spots more',
      desc: 'Early layers find edges. Later layers combine them into shapes like ears and whiskers.',
      status: 'hidden 1 → edges · hidden 2 → shapes',
      thinking: true,
      say: 'The first hidden layer picks out edges. The next one combines them into shapes, like ears and whiskers.',
      run: (m) => {
        m.after(200, () => { m.cls('.nn-svg', 'a1'); m.sfx.step(1); });
        m.after(1700, () => { m.cls('.nn-svg', 'a2'); m.sfx.step(3); });
      },
    },
    {
      title: 'The output decides',
      key: 'output',
      desc: 'The last layer turns everything into a score for each possible answer.',
      status: 'output · cat 0.92 · dog 0.08',
      say: 'The output layer turns all of that into a score for each answer. Cat, ninety two percent.',
      run: (m) => {
        m.cls('.nn-svg', 'a3');
        m.count('.p0', 92, 900, { suffix: '%' });
        m.count('.p1', 8, 900, { suffix: '%' });
        m.after(900, () => m.sfx.chime());
      },
    },
    {
      title: 'Wrong guess? Adjust the weights',
      key: 'Adjust',
      desc: 'A dog photo gets called a cat. The error flows backwards and every weight is nudged.',
      status: 'training · error → adjust weights',
      say: 'During training, when a guess is wrong, like calling this dog a cat, the error is sent backwards through the layers and every weight gets nudged. Thousands of rounds later, the network is good at its job.',
      run: (m) => {
        m.text('.nn-pic', '🐶');
        m.text('.p0', '71%');
        m.text('.p1', '29%');
        m.cls('.nn-svg', 'wrong');
        m.sfx.error();
        m.after(900, () => { m.cls('.nn-svg', 'back'); m.sfx.riser(1200); });
        m.after(2600, () => {
          m.cls('.nn-svg', 'back', false);
          m.cls('.nn-svg', 'wrong', false);
          m.cls('.nn-svg', 'dogwin');
          m.text('.p0', '6%');
          m.text('.p1', '94%');
          m.sfx.lock();
        });
      },
    },
    {
      title: 'Many layers = deep learning',
      key: 'deep learning',
      desc: 'Networks with many hidden layers power speech, vision and large language models.',
      status: 'deep learning · many hidden layers',
      say: 'A network with many hidden layers is called deep learning. It powers speech recognition, image recognition and large language models.',
      run: (m) => {
        m.show('.nn-deep > *', 220);
      },
    },
  ],
  end: {
    title: 'Simple neurons, many layers, one answer',
    sub: 'Deep learning is machine learning with many-layered neural networks. It’s the engine under modern AI.',
  },
};

export default spec;
