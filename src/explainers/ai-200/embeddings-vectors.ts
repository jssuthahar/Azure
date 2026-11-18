import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

// Pins on a 2D "meaning map". Real vectors have 1,536 dimensions; the map squashes them flat for the picture.
// Positions are % of the plot. `near` pins sit inside the query's ring in both layouts.
const PINS: { t: string; x: number; y: number; c?: string; sc?: string; lft?: boolean }[] = [
  { t: 'Refund policy', x: 26, y: 30, c: 'near h1', sc: '0.89', lft: true },
  { t: 'Return an item', x: 22, y: 62, c: 'near h2', sc: '0.81' },
  { t: 'Cancel an order', x: 43, y: 32, c: 'near h3', sc: '0.74' },
  { t: 'Track my parcel', x: 68, y: 20 },
  { t: 'Delivery times', x: 84, y: 40, lft: true },
  { t: 'Reset password', x: 62, y: 72 },
  { t: 'Change email', x: 88, y: 88, lft: true },
  { t: 'Opening hours', x: 8, y: 88 },
];
const pins = PINS.map(
  (p) =>
    `<div class="ev-pin msd-pop ${p.c ?? 'far'}${p.lft ? ' lft' : ''}" style="--x:${p.x}%;--y:${p.y}%"><i></i><span>${p.t}</span>${p.sc ? `<b class="ev-sc">${p.sc}</b>` : ''}</div>`,
).join('');

const spec: ExplainerSpec = {
  id: 'embeddings-vectors',
  lesson: 'embeddings-and-vector-search',
  title: {
    main: 'Search by meaning, <em>not by matching words.</em>',
    sub: 'How an embedding model turns text into 1,536 numbers, and how vector search finds the closest ones.',
  },
  summary:
    'An animation that turns a customer question into a 1,536-number embedding, places stored sentences on a meaning map where refunds sit together, finds the question’s nearest neighbours by cosine similarity, compares exact kNN with an approximate (ANN) index, and passes the top three results to a chat model for RAG.',
  html: `
  <div class="ev">
    <div class="ev-pipe">
      <div class="ev-text msd-card"><span class="msd-label">Customer types</span><div class="ev-q-text msd-mono"></div></div>
      <span class="ev-arr a1">${I.arrow}</span>
      <div class="ev-model msd-node msd-pop"><span class="ic">${I.brain}</span><span>text-embedding-3-small</span></div>
      <span class="ev-arr a2">${I.arrow}</span>
      <div class="ev-vec msd-card msd-reveal">
        <span class="msd-label">Vector · example values</span>
        <div class="ev-nums msd-mono">[ 0.0123, -0.0311, 0.0457, -0.0089, … ]</div>
        <div class="ev-dims"><b class="ev-d">0</b> numbers</div>
      </div>
    </div>
    <div class="ev-map msd-card">
      <div class="ev-mh"><span class="msd-label">Meaning map</span><span class="ev-note">1,536 dimensions, drawn flat</span><span class="ev-leg msd-reveal">cosine score (example)</span></div>
      <div class="ev-plot">
        <div class="ev-ring"></div>
        ${pins}
        <div class="ev-pin ev-q msd-pop" style="--x:32%;--y:46%"><i></i><span>“money back?”</span></div>
      </div>
    </div>
    <div class="ev-side msd-card msd-reveal">
      <div class="ev-search">
        <span class="msd-label">How the database searches</span>
        <div class="ev-row ex msd-reveal"><b>Exact kNN</b><span>Compares every vector · recall 100%</span><em><b class="ev-n1">0</b> compared</em></div>
        <div class="ev-row an msd-reveal"><b>ANN index</b><span>DiskANN or HNSW · checks a small slice · recall a little lower</span><em><b class="ev-n2">0</b> compared</em></div>
        <small>Counts are examples for 1,000,000 stored vectors</small>
      </div>
      <div class="ev-rag">
        <span class="msd-label">Top 3 → RAG</span>
        <div class="ev-top msd-stagger"><div>1 · Refund policy <i>0.89</i></div><div>2 · Return an item <i>0.81</i></div><div>3 · Cancel an order <i>0.74</i></div></div>
        <div class="ev-chat msd-pill accent">${I.chat}<span>Chat model + these 3 chunks</span></div>
        <div class="ev-ans"></div>
      </div>
    </div>
    <div class="ev-flow"></div>
  </div>`,
  css: `
  @S .ev{ position:relative; height:100%; display:grid; gap:18px; }
  @L .ev{ grid-template-columns:1fr 420px; grid-template-rows:180px 1fr; grid-template-areas:"pipe pipe" "map side"; }
  @P .ev{ grid-template-columns:1fr; grid-template-rows:auto 1fr 330px; grid-template-areas:"pipe" "map" "side"; }
  @S .ev-pipe{ grid-area:pipe; display:flex; align-items:center; gap:14px; min-width:0; }
  @P .ev-pipe{ flex-wrap:wrap; }
  @S .ev-text{ flex:1.2; min-width:0; padding:18px 22px; display:flex; flex-direction:column; gap:10px; }
  @P .ev-text{ flex-basis:100%; }
  @S .ev-q-text{ font-size:30px; color:#fff; min-height:40px; }
  @S .ev-arr{ color:var(--x-a1); flex-shrink:0; }
  @S .ev-arr svg{ width:38px; height:38px; }
  @P .ev-arr.a1{ display:none; }
  @S .ev-model{ flex-shrink:0; font-size:23px; padding:16px 18px; }
  @S .ev-vec{ flex:1; min-width:0; padding:16px 20px; display:flex; flex-direction:column; gap:8px; }
  @S .ev-nums{ font-size:21px; color:var(--x-cyan); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  @S .ev-dims{ color:var(--x-dim); font-size:21px; }
  @S .ev-dims b{ font-family:var(--x-mono); font-size:34px; color:var(--x-a1); margin-right:6px; }
  @S .ev-map{ grid-area:map; min-height:0; padding:18px 20px; display:flex; flex-direction:column; gap:8px; }
  @S .ev-mh{ display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
  @S .ev-note{ color:var(--x-dim); font-size:19px; font-family:var(--x-mono); }
  @S .ev-leg{ margin-left:auto; font-size:19px; font-family:var(--x-mono); color:var(--x-ok); }
  @S .ev-plot{ position:relative; flex:1; min-height:0; border-radius:16px; background:rgb(14 20 32 / .7); border:1.5px dashed var(--x-line); }
  @S .ev-pin{ position:absolute; left:var(--x); top:var(--y); margin:-11px 0 0 -11px; display:flex; align-items:center; gap:10px; white-space:nowrap; transition:opacity .35s, filter .35s, transform .36s cubic-bezier(.22,1.4,.36,1); }
  @S .ev-pin.lft{ flex-direction:row-reverse; margin:-11px -11px 0 0; left:auto; right:calc(100% - var(--x)); }
  @S .ev-pin i{ width:22px; height:22px; border-radius:50%; flex-shrink:0; background:rgb(58 160 255 / .35); border:2px solid var(--x-a1); transition:background .3s, border-color .3s, box-shadow .3s; }
  @S .ev-pin span{ font-size:22px; font-weight:600; color:var(--x-text); }
  @S .ev-pin.near i{ background:rgb(180 140 255 / .35); border-color:var(--x-you); }
  @S .ev-sc{ font-family:var(--x-mono); font-size:19px; color:var(--x-ok); padding:2px 8px; border-radius:8px; border:1px solid rgb(63 185 80 / .5); opacity:0; transition:opacity .3s; }
  @S .ev-pin.hit i{ background:var(--x-ok); border-color:var(--x-ok); box-shadow:0 0 18px rgb(63 185 80 / .7); }
  @S .ev-pin.hit .ev-sc{ opacity:1; }
  @S .ev-q i{ width:26px; height:26px; background:var(--x-warn); border-color:#fff; box-shadow:0 0 22px rgb(240 166 74 / .8); }
  @S .ev-q{ margin:-13px 0 0 -13px; z-index:3; }
  @S .ev-q span{ color:var(--x-warn); font-weight:800; }
  @S .ev-ring{ position:absolute; left:32%; top:46%; width:0; height:0; margin:0; border-radius:50%; border:2px dashed var(--x-ok); background:rgb(63 185 80 / .07); opacity:0; transition:width .7s cubic-bezier(.22,1,.36,1), height .7s cubic-bezier(.22,1,.36,1), margin .7s cubic-bezier(.22,1,.36,1), opacity .3s; }
  @S .ev.find .ev-ring{ width:280px; height:280px; margin:-140px 0 0 -140px; opacity:1; }
  @S .ev-map.exact .ev-pin i{ border-color:var(--x-warn); box-shadow:0 0 14px rgb(240 166 74 / .6); }
  @S .ev-map.ann .ev-pin.far{ opacity:.22; filter:saturate(.3); }
  @S .ev-side{ grid-area:side; min-height:0; padding:20px 22px; display:flex; flex-direction:column; gap:14px; }
  @S .ev-search, @S .ev-rag{ display:flex; flex-direction:column; gap:14px; }
  @S .ev-rag{ display:none; }
  @S .ev.rag .ev-search{ display:none; }
  @S .ev.rag .ev-rag{ display:flex; }
  @S .ev-row{ display:flex; flex-direction:column; gap:4px; padding:14px 16px; border-radius:16px; border:1.5px solid var(--x-line); background:rgb(255 255 255 / .04); transition:opacity .3s, border-color .3s, transform .3s cubic-bezier(.22,1,.36,1); }
  @S .ev-row b{ color:#fff; font-size:25px; }
  @S .ev-row span{ color:var(--x-dim); font-size:19px; line-height:1.35; }
  @S .ev-row em{ font-style:normal; color:var(--x-text); font-size:19px; }
  @S .ev-row em b{ font-family:var(--x-mono); font-size:24px; color:var(--x-warn); }
  @S .ev-row.an em b{ color:var(--x-ok); }
  @S .ev-row.ex.on{ border-color:var(--x-warn); }
  @S .ev-row.an.on{ border-color:var(--x-ok); }
  @S .ev-row.dim{ opacity:.45; }
  @S .ev-search small{ color:var(--x-dim); font-size:17px; }
  @S .ev-top{ display:flex; flex-direction:column; gap:8px; }
  @S .ev-top > div{ padding:9px 14px; border-radius:12px; border:1.5px solid rgb(63 185 80 / .45); background:rgb(63 185 80 / .08); color:#fff; font-size:21px; font-weight:600; }
  @S .ev-top i{ font-style:normal; font-family:var(--x-mono); color:var(--x-ok); float:right; }
  @S .ev-chat{ align-self:flex-start; font-size:20px; }
  @S .ev-ans{ color:var(--x-text); font-size:21px; line-height:1.4; min-height:58px; }
  @P .ev-search{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @P .ev-search .msd-label, @P .ev-search small{ grid-column:1 / -1; }
  @P .ev.rag .ev-search{ display:none; }
  @P .ev-rag{ display:none; grid-template-columns:1fr 1fr; gap:12px 18px; }
  @P .ev.rag .ev-rag{ display:grid; }
  @P .ev-rag .msd-label{ grid-column:1 / -1; }
  @P .ev-top{ grid-row:span 2; }
  @S .ev-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  `,
  stages: [
    {
      title: 'A question in everyday words',
      key: 'everyday words',
      desc: 'Your help page only ever says “refund”. A keyword search for “money back” finds nothing.',
      status: 'input · "How do I get my money back?"',
      say: "A customer types, how do I get my money back? Your help page never says money back. It says refund. So a keyword search comes back empty.",
      run: (m) => {
        m.type('.ev-q-text', 'How do I get my money back?', 40);
      },
    },
    {
      title: 'Text becomes a vector',
      key: 'vector',
      desc: 'An embedding model reads the text and returns a fixed-length list of numbers: 1,536 for text-embedding-3-small.',
      status: 'embeddings.create · 1,536 dimensions',
      thinking: true,
      say: "An embedding model, here text embedding three small, reads that text and returns a vector. It's a list of 1,536 numbers. You'll only ever look at a few of them.",
      run: (m) => {
        m.show('.ev-model', 0);
        m.particles('.ev-flow', { from: '.ev-text', to: '.ev-model', count: 6, duration: 800 });
        m.after(800, () => {
          m.show('.ev-vec', 0, true);
          m.particles('.ev-flow', { from: '.ev-model', to: '.ev-vec', count: 6, duration: 800 });
        });
        m.after(1100, () => m.count('.ev-d', 1536, 1100));
        m.after(2300, () => m.sfx.lock());
      },
    },
    {
      title: 'Similar meaning, nearby points',
      key: 'nearby',
      desc: 'Every stored sentence has its own vector. Refunds and returns land in one corner, delivery and accounts in others.',
      status: 'stored · 8 help articles (example)',
      say: "Every help article was embedded the same way. Picture each vector as a pin on a map of meaning. Refunds and returns sit together, delivery questions sit somewhere else.",
      run: (m) => {
        m.show('.ev-pin:not(.ev-q)', 110);
        m.after(1300, () => m.punch('.ev-pin.near', 3));
      },
    },
    {
      title: 'The question finds its neighbours',
      key: 'neighbours',
      desc: 'Embed the question with the same model and dimensions, then rank stored vectors by cosine similarity.',
      status: 'VectorDistance · cosine · top 3',
      say: "Now embed the question with the same model, and drop it on the map. It lands right next to refund policy. The database scores the closest pins with cosine similarity.",
      run: (m) => {
        m.show('.ev-q', 0);
        m.after(600, () => { m.cls('.ev', 'find'); m.sfx.focus(); });
        m.after(1400, () => { m.cls('.ev-pin.near', 'hit'); m.show('.ev-leg', 0, true); m.sfx.ding(); });
      },
    },
    {
      title: 'Exact search checks every vector',
      key: 'every vector',
      desc: 'Exact k-nearest neighbours gives 100% recall, but the work grows with every row you add.',
      status: 'flat · compare query with all vectors',
      thinking: true,
      say: "With no index, that's an exact k nearest neighbours search. It compares the question with every single vector. Recall is a hundred percent, but the work grows with every row you add.",
      run: (m) => {
        m.show('.ev-side', 0, true);
        m.show('.ev-row.ex', 0);
        m.cls('.ev-row.ex', 'on');
        m.cls('.ev-map', 'exact');
        m.cls('.ev-plot', 'msd-scan');
        m.count('.ev-n1', 1000000, 1800);
      },
    },
    {
      title: 'An ANN index jumps ahead',
      key: 'ANN index',
      desc: 'DiskANN or HNSW jumps to the right neighbourhood and checks a small slice. Much faster, a little less recall.',
      status: 'diskANN · approximate · small slice',
      say: "An approximate nearest neighbour index, like DiskANN or HNSW, jumps straight to the right neighbourhood and checks only a small slice. It's far faster, and now and then it misses one true match.",
      run: (m) => {
        m.cls('.ev-map', 'exact', false);
        m.cls('.ev-plot', 'msd-scan', false);
        m.cls('.ev-row.ex', 'on', false);
        m.cls('.ev-row.ex', 'dim');
        m.show('.ev-row.an', 0);
        m.cls('.ev-row.an', 'on');
        m.cls('.ev-map', 'ann');
        m.count('.ev-n2', 2400, 900);
        m.after(1000, () => m.sfx.sparkle());
      },
    },
    {
      title: 'Top results feed RAG',
      key: 'RAG',
      desc: 'Put the top k chunks in the prompt. The chat model answers from your refund policy instead of guessing.',
      status: 'k = 3 · grounding the chat model',
      say: "Take the top results, say the best three chunks, and put them in the prompt. Now the chat model answers from your own refund policy instead of guessing. That's RAG.",
      run: (m) => {
        m.cls('.ev', 'rag');
        m.show('.ev-top > *', 220);
        m.after(700, () => m.particles('.ev-flow', { from: '.ev-pin.h1', to: '.ev-chat', count: 6, duration: 900, color: 'var(--x-ok)' }));
        m.after(1300, () => m.type('.ev-ans', 'Answer, from your policy: open Orders, pick the item and choose Refund.', 30));
      },
    },
  ],
  end: {
    title: 'Same model in, closest vectors out',
    sub: 'Embed documents and questions with one model, rank by cosine, and use an ANN index once the data gets big.',
  },
};

export default spec;
