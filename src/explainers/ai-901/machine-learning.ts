import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const fruit = (emoji: string, label: string, yes: boolean) =>
  `<div class="ml-ex msd-pop ${yes ? 'yes' : 'no'}"><span class="ml-f" aria-hidden="true">${emoji}</span><b>${label}</b></div>`;

const spec: ExplainerSpec = {
  id: 'machine-learning',
  lesson: 'what-is-ai',
  title: {
    main: 'Don’t write the rules. <em>Show it examples.</em>',
    sub: 'How machine learning turns labelled examples into a model that makes predictions.',
  },
  summary: 'An animation contrasting a hand-written rule that fails on a green mango with machine learning: labelled examples go into training, a model comes out, and the model predicts a new fruit with a confidence score. It ends with regression, classification and clustering, and where machine learning sits inside AI.',
  html: `
  <div class="ml">
    <div class="ml-rule msd-editor msd-reveal">
      <div class="bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span>rules.py</span></div>
      <div class="body"><span class="kw">if</span> colour == <span class="st">"yellow"</span> <span class="kw">and</span> shape == <span class="st">"oval"</span>:<br>&nbsp;&nbsp;&nbsp;&nbsp;<span class="kw">return</span> <span class="st">"mango"</span></div>
      <div class="ml-fail msd-reveal"><span aria-hidden="true">🥭</span><span>Green mango → <b>"not mango"</b> ✕</span></div>
    </div>
    <div class="ml-main">
      <div class="ml-data msd-card">
        <div class="msd-label">Labelled examples</div>
        <div class="ml-exs">
          ${fruit('🥭', 'Mango', true)}${fruit('🍋', 'Not mango', false)}${fruit('🥭', 'Mango', true)}
          ${fruit('🍎', 'Not mango', false)}${fruit('🥭', 'Mango', true)}${fruit('🍐', 'Not mango', false)}
        </div>
      </div>
      <div class="ml-mid">
        <div class="ml-train msd-pill msd-reveal">${I.gear}<span>Training</span><b class="ml-pct">0%</b></div>
        <div class="ml-model msd-node msd-pop"><span class="ic">${I.brain}</span><span>Model<small>mango-classifier</small></span></div>
      </div>
      <div class="ml-new msd-card msd-reveal">
        <div class="msd-label">New fruit</div>
        <span class="ml-big" aria-hidden="true">🥭</span>
        <div class="ml-pred msd-pill ok msd-reveal">Mango · <b class="ml-conf">0%</b></div>
      </div>
    </div>
    <div class="ml-kinds msd-stagger">
      <div><b>Regression</b><span>a number · flat price ₹62 lakh</span></div>
      <div><b>Classification</b><span>a label · spam or not spam</span></div>
      <div><b>Clustering</b><span>groups · customers who behave alike</span></div>
    </div>
    <div class="ml-nest msd-reveal"><div class="n1">AI<div class="n2">Machine learning<div class="n3">Deep learning<div class="n4">Generative AI</div></div></div></div></div>
    <div class="ml-flow"></div>
  </div>`,
  css: `
  @S .ml{ position:relative; height:100%; display:flex; flex-direction:column; gap:18px; }
  @S .ml-rule{ position:absolute; inset:0 0 auto 0; z-index:7; transition:opacity .35s, transform .35s; }
  @S .ml-rule.gone{ opacity:0; transform:translateY(-20px); pointer-events:none; }
  @S .ml-rule .bar span{ margin-left:14px; color:var(--x-dim); font-family:var(--x-mono); font-size:20px; }
  @S .ml-rule .body{ font-size:30px; }
  @S .ml-fail{ display:flex; gap:14px; align-items:center; padding:18px 24px; font-size:30px; color:var(--x-bad); background:rgb(244 74 106 / .1); }
  @S .ml-main{ flex:1; display:grid; grid-template-columns:1.25fr .8fr 1fr; gap:20px; min-height:0; align-items:stretch; }
  @S .ml-data, @S .ml-new{ padding:20px; display:flex; flex-direction:column; gap:14px; }
  @S .ml-exs{ flex:1; display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  @S .ml-ex{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; border-radius:16px; padding:10px; border:1.5px solid var(--x-line); background:rgb(14 20 32 / .9); }
  @S .ml-ex .ml-f{ font-size:52px; line-height:1; }
  @S .ml-ex b{ font-size:18px; font-family:var(--x-mono); }
  @S .ml-ex.yes b{ color:var(--x-ok); } @S .ml-ex.no b{ color:var(--x-dim); }
  @S .ml-ex.yes{ border-color:rgb(63 185 80 / .45); }
  @S .ml-mid{ display:flex; flex-direction:column; gap:18px; justify-content:center; align-items:center; }
  @S .ml-train svg{ width:26px; height:26px; }
  @S .ml-pct{ color:var(--x-cyan); }
  @S .ml-model{ flex-direction:column; text-align:center; padding:26px; }
  @S .ml-model .ic{ width:90px; height:90px; border-radius:24px; } @S .ml-model .ic svg{ width:56px; height:56px; }
  @S .ml-model small{ display:block; font-family:var(--x-mono); font-size:18px; color:var(--x-dim); margin-top:6px; }
  @S .ml-new{ align-items:center; justify-content:center; text-align:center; }
  @S .ml-big{ font-size:120px; line-height:1; filter:hue-rotate(40deg) saturate(1.2); }
  @S .ml-pred{ font-size:28px; }
  @S .ml-kinds{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
  @S .ml-kinds > div{ display:flex; flex-direction:column; gap:6px; padding:14px 18px; border-radius:16px; border:1.5px solid rgb(58 160 255 / .4); background:rgb(58 160 255 / .08); }
  @S .ml-kinds b{ color:#fff; font-size:25px; } @S .ml-kinds span{ color:var(--x-dim); font-size:20px; }
  @S .ml-nest{ position:absolute; inset:0; z-index:8; display:grid; place-items:center; background:rgb(14 20 32 / .94); border-radius:24px; }
  @S .ml-nest div{ border-radius:24px; padding:22px 26px 26px; font-weight:800; font-size:28px; color:#fff; text-align:left; display:flex; flex-direction:column; gap:18px; }
  @S .ml-nest .n1{ border:2px solid var(--x-dim); background:rgb(255 255 255 / .03); width:86%; }
  @S .ml-nest .n2{ border:2px solid var(--x-a1); background:rgb(58 160 255 / .08); color:var(--x-a1); }
  @S .ml-nest .n3{ border:2px solid var(--x-cyan); background:rgb(34 211 238 / .08); color:var(--x-cyan); }
  @S .ml-nest .n4{ border:2px solid var(--x-you); background:rgb(180 140 255 / .12); color:var(--x-you); }
  @S .ml-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .ml-main{ grid-template-columns:1fr; grid-template-rows:1.4fr auto 1fr; }
  @P .ml-mid{ flex-direction:row; }
  @P .ml-model{ flex-direction:row; padding:18px; text-align:left; }
  @P .ml-model .ic{ width:70px; height:70px; }
  @P .ml-big{ font-size:96px; }
  @P .ml-kinds{ grid-template-columns:1fr; gap:10px; }
  @P .ml-kinds > div{ padding:10px 16px; }
  `,
  stages: [
    {
      title: 'Rules break on real life',
      key: 'Rules break',
      desc: 'Hand-written rules miss the cases you didn’t think of, like a green mango.',
      status: 'rules.py · 1 wrong answer',
      say: 'Try writing rules to spot a mango. Yellow and oval? Then a green mango turns up, and your rule gets it wrong.',
      run: (m) => {
        m.show('.ml-rule', 0);
        m.after(1500, () => { m.show('.ml-fail', 0, true); m.shake('.ml-fail'); });
      },
    },
    {
      title: 'Show it examples instead',
      key: 'examples',
      desc: 'Machine learning starts with data: lots of examples, each labelled with the right answer.',
      status: 'dataset · 6 labelled examples',
      say: 'Machine learning flips this around. Instead of rules, you give the computer lots of examples, each one labelled with the right answer.',
      run: (m) => {
        m.cls('.ml-rule', 'gone');
        m.show('.ml-ex', 110);
      },
    },
    {
      title: 'Training finds the pattern',
      key: 'Training',
      desc: 'The algorithm looks at colour, shape and size, and adjusts until its guesses match the labels.',
      status: 'training · epoch 12 · accuracy rising',
      thinking: true,
      say: 'During training, the algorithm looks at features like colour, shape and size, and keeps adjusting itself until its guesses match the labels.',
      run: (m) => {
        m.show('.ml-train', 0, true);
        m.count('.ml-pct', 100, 2600, { suffix: '%' });
        m.stream('.ml-flow', { from: '.ml-exs', to: '.ml-train', count: 6, duration: 800, gap: 500 });
        m.cls('.ml-data', 'msd-scan');
      },
    },
    {
      title: 'Out comes a model',
      key: 'model',
      desc: 'A model is a file that captures the pattern. It’s what you deploy and call.',
      status: 'mango-classifier · saved',
      say: 'What comes out is a model, a file that captures the pattern it learned. That model is what you deploy.',
      run: (m) => {
        m.cls('.ml-data', 'msd-scan', false);
        m.show('.ml-model', 0, true);
        m.cls('.ml-model', 'hot');
        m.sfx.lock();
      },
    },
    {
      title: 'New data in, prediction out',
      key: 'prediction',
      desc: 'Give the model a fruit it has never seen. It answers with a confidence score. That’s inferencing.',
      status: 'inference · mango · 0.94',
      say: 'Show the model a fruit it has never seen, and it predicts the answer, with a confidence score. Using a model like this is called inferencing.',
      run: (m) => {
        m.show('.ml-new', 0);
        m.after(500, () => m.particles('.ml-flow', { from: '.ml-big', to: '.ml-model', count: 6, duration: 800 }));
        m.after(1500, () => { m.show('.ml-pred', 0, true); m.count('.ml-conf', 94, 900, { suffix: '%' }); m.sfx.chime(); });
      },
    },
    {
      title: 'Three kinds of prediction',
      key: 'Three kinds',
      desc: 'A number is regression, a label is classification, and groups are clustering.',
      status: 'regression · classification · clustering',
      say: 'Predictions come in three flavours. A number is called regression. A label is classification. Groups of similar items are clustering.',
      run: (m) => {
        m.cls('.ml-model', 'hot', false);
        m.show('.ml-kinds > *', 350);
      },
    },
    {
      title: 'Where it fits in AI',
      key: 'fits',
      desc: 'Machine learning is the main way we build AI. Deep learning and generative AI sit inside it.',
      status: 'AI ⊃ ML ⊃ deep learning ⊃ generative AI',
      say: 'Machine learning is the main way we build AI today. Deep learning, and the generative AI built on it, both sit inside machine learning.',
      run: (m) => {
        m.show('.ml-nest', 0);
        m.after(500, () => m.sfx.sparkle());
      },
    },
  ],
  end: {
    title: 'Examples in, model out, predictions forever',
    sub: 'Read the verb in an exam scenario: predict or classify points to machine learning.',
  },
};

export default spec;
