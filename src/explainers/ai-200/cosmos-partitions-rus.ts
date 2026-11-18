import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const PARTS: [string, string[]][] = [
  ['kettles', ['k-101', 'k-102', 'k-103']],
  ['toasters', ['t-201', 't-202']],
  ['blenders', ['b-301', 'b-302', 'b-303']],
  ['fridges', ['f-401', 'f-402']],
];
const parts = PARTS.map(
  ([pk, ids], i) => `
  <div class="cp-part p${i + 1}">
    <div class="cp-ph msd-mono">category = <b>${pk}</b></div>
    <div class="cp-chips">${ids.map((id, j) => `<span class="cp-chip msd-pop i${i + 1}${j + 1}">${id}</span>`).join('')}${
      i === 0 ? `<span class="cp-chip cp-new msd-pop">k-104 ${I.layers}</span>` : ''
    }</div>
  </div>`,
).join('');

const PATHS: [string, string][] = [
  ['/id', ''],
  ['/category', ''],
  ['/name', ''],
  ['/price', ''],
  ['/embedding/*', '1,536 numbers'],
];
const rows = PATHS.map(
  ([p, note], i) =>
    `<div class="cp-path r${i + 1}${note ? ' emb' : ''}"><code>${p}</code>${note ? `<small>${note}</small>` : ''}<span class="cp-badge">indexed</span></div>`,
).join('');

const LEVELS = ['Strong', 'Bounded staleness', 'Session', 'Consistent prefix', 'Eventual'];
const stops = LEVELS.map(
  (l, i) => `<div class="cp-stop s${i}" style="--at:${i * 25}%"><i></i><span>${l}${i === 2 ? '<em>default</em>' : ''}</span><b class="cp-x">${i < 2 ? '≈ 2x' : '1x'}</b></div>`,
).join('');

const spec: ExplainerSpec = {
  id: 'cosmos-partitions-rus',
  lesson: 'cosmos-db-rus-indexing-consistency',
  title: {
    main: 'Same data. <em>Very different RU bills.</em>',
    sub: 'Partition keys, point reads, fan-out queries, the indexing policy and consistency levels in Azure Cosmos DB.',
  },
  summary:
    'An animation of a Cosmos DB container with items spread across logical partitions by category. A point read costs about 1 RU, a query without the partition key fans out to every partition and costs more, indexing every path makes writes expensive until /embedding/* is excluded, and a consistency slider runs from Strong to Eventual with Session as the default. RU numbers other than the point read are labelled as examples.',
  html: `
  <div class="cp">
    <div class="cp-req msd-card">
      <code class="cp-call"></code>
      <div class="cp-meter msd-reveal"><span class="cp-ml">request charge</span><b class="cp-ru">0</b><span>RU</span><i>example</i></div>
    </div>
    <div class="cp-box msd-card">
      <div class="cp-bh"><span class="msd-label">Container · products</span><span class="msd-chip">partition key /category</span></div>
      <div class="cp-parts">${parts}</div>
    </div>
    <div class="cp-idx msd-card msd-reveal">
      <div class="cp-ih"><span class="msd-label">Indexing policy</span><code class="cp-pol">includedPaths: ["/*"]</code></div>
      <div class="cp-paths msd-stagger">${rows}</div>
      <span class="cp-vnote msd-reveal">${I.check}vector index still covers /embedding</span>
    </div>
    <div class="cp-con msd-card msd-reveal k2">
      <span class="msd-label cp-cl">Consistency level · account default</span>
      <div class="cp-track"><div class="cp-line"></div>${stops}<div class="cp-knob"></div></div>
      <div class="cp-read">read cost <b class="cp-rx">1x</b></div>
      <div class="cp-weak msd-reveal">${I.arrow}A client can go weaker, never stronger</div>
    </div>
    <div class="cp-flow"></div>
  </div>`,
  css: `
  @S code{ background:none; padding:0; border-radius:0; } /* the lesson's light inline-code chip doesn't belong on the dark stage */
  @S .cp{ position:relative; height:100%; display:grid; gap:18px; }
  @L .cp{ grid-template-columns:1fr 1fr; grid-template-rows:92px 270px 1fr; grid-template-areas:"req req" "box box" "idx con"; }
  @P .cp{ grid-template-columns:1fr; grid-template-rows:auto 330px 1fr; grid-template-areas:"req" "box" "bot"; gap:16px; }
  @S .cp-req{ grid-area:req; display:flex; align-items:center; gap:18px; padding:16px 22px; min-width:0; }
  @P .cp-req{ flex-wrap:wrap; }
  @S .cp-call{ flex:1; min-width:0; font-family:var(--x-mono); font-size:24px; color:var(--x-cyan); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-height:32px; }
  @P .cp-call{ flex-basis:100%; white-space:normal; font-size:25px; }
  @S .cp-meter{ display:flex; align-items:baseline; gap:8px; flex-shrink:0; padding:8px 16px; border-radius:14px; border:1.5px solid var(--x-line); background:rgb(255 255 255 / .04); }
  @S .cp-ml{ color:var(--x-dim); font-size:19px; font-family:var(--x-mono); }
  @S .cp-ru{ font-family:var(--x-mono); font-size:38px; color:var(--x-ok); min-width:64px; text-align:right; }
  @S .cp-meter span:not(.cp-ml){ color:var(--x-text); font-size:21px; font-weight:700; }
  @S .cp-meter i{ font-style:normal; color:var(--x-warn); font-size:17px; font-family:var(--x-mono); }
  @S .cp-meter.hot .cp-ru{ color:var(--x-warn); }
  @S .cp-box{ grid-area:box; padding:16px 18px; display:flex; flex-direction:column; gap:12px; min-height:0; }
  @S .cp-bh{ display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
  @S .cp-parts{ flex:1; display:grid; grid-template-columns:repeat(4,1fr); gap:14px; min-height:0; }
  @P .cp-parts{ grid-template-columns:1fr 1fr; }
  @S .cp-part{ position:relative; display:flex; flex-direction:column; gap:12px; padding:14px; border-radius:18px; border:1.5px dashed rgb(58 160 255 / .4); background:rgb(14 20 32 / .9); transition:border-color .3s, opacity .3s, filter .3s, transform .3s; }
  @S .cp-ph{ color:var(--x-dim); font-size:18px; }
  @S .cp-ph b{ color:#fff; font-size:21px; }
  @S .cp-chips{ display:flex; flex-wrap:wrap; gap:8px; }
  @S .cp-chip{ display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:10px; font-family:var(--x-mono); font-size:19px; font-weight:600; color:var(--x-a1); background:rgb(58 160 255 / .12); border:1.5px solid rgb(58 160 255 / .35); transition:opacity .3s, transform .36s cubic-bezier(.22,1.4,.36,1), background .3s, border-color .3s, color .3s; }
  @S .cp-chip svg{ width:20px; height:20px; }
  @S .cp-chip.hit{ background:var(--x-ok); border-color:var(--x-ok); color:#0e1420; box-shadow:0 0 22px rgb(63 185 80 / .6); }
  @S .cp-new{ color:var(--x-you); background:rgb(180 140 255 / .14); border-color:rgb(180 140 255 / .5); }
  @S .cp-part.fan{ border-style:solid; border-color:var(--x-warn); }
  @S .cp-idx{ grid-area:idx; padding:16px 20px; display:flex; flex-direction:column; gap:10px; min-height:0; transition:opacity .3s, transform .3s; }
  @P .cp-idx{ grid-area:bot; }
  @S .cp-ih{ display:flex; align-items:baseline; flex-wrap:wrap; gap:6px 14px; }
  @S .cp-pol{ font-family:var(--x-mono); font-size:19px; color:var(--x-cyan); }
  @S .cp-paths{ display:flex; flex-direction:column; gap:7px; }
  @S .cp-path{ display:flex; align-items:center; gap:10px; padding:6px 12px; border-radius:11px; background:rgb(255 255 255 / .04); border:1.5px solid var(--x-line); transition:opacity .3s, transform .3s, border-color .3s; }
  @S .cp-path code{ font-family:var(--x-mono); font-size:20px; color:#fff; }
  @S .cp-path small{ color:var(--x-warn); font-size:17px; font-family:var(--x-mono); }
  @S .cp-badge{ margin-left:auto; font-size:16px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:3px 10px; border-radius:8px; color:var(--x-ok); border:1px solid rgb(63 185 80 / .5); }
  @S .cp-path.emb{ border-color:rgb(240 166 74 / .55); }
  @S .cp-path.ex{ border-color:var(--x-line); opacity:.75; }
  @S .cp-path.ex code{ text-decoration:line-through; color:var(--x-dim); }
  @S .cp-path.ex .cp-badge{ color:var(--x-bad); border-color:rgb(244 74 106 / .5); }
  @S .cp-vnote{ display:inline-flex; align-items:center; gap:8px; color:var(--x-ok); font-size:18px; font-weight:600; }
  @S .cp-vnote svg{ width:22px; height:22px; }
  @S .cp-con{ grid-area:con; padding:16px 20px; display:flex; flex-direction:column; gap:12px; min-height:0; }
  @P .cp-con{ grid-area:bot; }
  @P .cp.cons .cp-idx{ display:none; }
  @S .cp-track{ position:relative; height:118px; margin:34px 56px 0; }
  @S .cp-line{ position:absolute; left:0; right:0; top:8px; height:6px; border-radius:3px; background:linear-gradient(90deg, var(--x-warn), var(--x-a1), var(--x-ok)); }
  @S .cp-stop{ position:absolute; top:0; left:var(--at); width:0; }
  @S .cp-stop i{ position:absolute; left:-11px; top:0; width:22px; height:22px; border-radius:50%; background:var(--x-panel); border:3px solid var(--x-dim); }
  @S .cp-stop span{ position:absolute; top:32px; left:-55px; width:110px; text-align:center; color:var(--x-text); font-size:17px; font-weight:700; line-height:1.2; }
  @S .cp-stop em{ display:block; font-style:normal; margin-top:4px; color:var(--x-a1); font-family:var(--x-mono); font-size:15px; }
  @S .cp-x{ position:absolute; top:-30px; left:-40px; width:80px; text-align:center; font-family:var(--x-mono); font-size:17px; color:var(--x-ok); opacity:0; transition:opacity .3s; }
  @S .cp-stop.s0 .cp-x, @S .cp-stop.s1 .cp-x{ color:var(--x-warn); }
  @S .cp-con.cost .cp-x{ opacity:1; }
  @S .cp-knob{ position:absolute; top:-7px; left:50%; width:36px; height:36px; margin-left:-18px; border-radius:50%; background:#fff; box-shadow:0 0 0 5px rgb(58 160 255 / .45), 0 0 26px rgb(58 160 255 / .6); transition:left .7s cubic-bezier(.22,1,.36,1); }
  @S .cp-con.k0 .cp-knob{ left:0%; } @S .cp-con.k1 .cp-knob{ left:25%; } @S .cp-con.k2 .cp-knob{ left:50%; }
  @S .cp-con.k3 .cp-knob{ left:75%; } @S .cp-con.k4 .cp-knob{ left:100%; }
  @S .cp-read{ color:var(--x-dim); font-size:21px; font-weight:600; }
  @S .cp-read b{ font-family:var(--x-mono); font-size:30px; color:var(--x-ok); margin-left:8px; }
  @S .cp-con.k0 .cp-read b, @S .cp-con.k1 .cp-read b{ color:var(--x-warn); }
  @S .cp-weak{ display:inline-flex; align-items:center; gap:8px; color:var(--x-a1); font-size:19px; font-weight:700; }
  @S .cp-weak svg{ width:22px; height:22px; }
  @L .cp-idx{ padding:12px 18px; gap:8px; }
  @L .cp-paths{ gap:5px; }
  @L .cp-path{ padding:4px 12px; }
  @P .cp-req{ padding:12px 18px; gap:10px; }
  @P .cp-meter{ padding:6px 14px; }
  @P .cp-ru{ font-size:32px; }
  @P .cp-box{ padding:14px 16px; gap:10px; }
  @P .cp-parts{ gap:10px; }
  @P .cp-part{ padding:10px 12px; gap:8px; }
  @P .cp-idx{ padding:14px 18px; gap:8px; }
  @P .cp-paths{ gap:6px; }
  @P .cp-track{ margin:40px 70px 0; }
  @P .cp-stop span{ font-size:20px; left:-75px; width:150px; }
  @P .cp-x{ font-size:20px; }
  @S .cp-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  `,
  stages: [
    {
      title: 'Items live in logical partitions',
      key: 'logical partitions',
      desc: 'The partition key, /category here, decides which logical partition each item lands in.',
      status: 'container products · 4 logical partitions',
      say: 'A Cosmos DB container spreads its items across logical partitions. The partition key, here slash category, decides where each one lives. Every kettle goes in the kettles partition.',
      run: (m) => {
        PARTS.forEach((_, i) => m.after(i * 380, () => m.show(`.p${i + 1} .cp-chip:not(.cp-new)`, 90)));
      },
    },
    {
      title: 'Point read: about 1 RU',
      key: 'about 1 RU',
      desc: 'With the id and the partition key, Cosmos DB goes straight to one item. About 1 RU for a 1 KB item.',
      status: 'read_item · 1 partition · ≈ 1 RU',
      say: "When you know an item's id and its partition key, you do a point read. Cosmos DB goes straight to that one item. For a one kilobyte item, that's about one request unit.",
      run: (m) => {
        m.type('.cp-call', 'read_item("k-102", partition_key="kettles")', 28);
        m.show('.cp-meter', 0, true);
        m.text('.cp-ml', 'read charge');
        m.focus('.cp-part.p1', '.cp-part');
        m.after(1300, () => {
          m.particles('.cp-flow', { from: '.cp-call', to: '.i12', count: 6, duration: 800, color: 'var(--x-ok)' });
          m.cls('.i12', 'hit');
          m.count('.cp-ru', 1, 500);
          m.sfx.lock();
        });
      },
    },
    {
      title: 'No partition key? It fans out',
      key: 'fans out',
      desc: 'A query that can’t be routed to one partition runs against all of them, and every one adds to the charge.',
      status: 'cross-partition query · RU numbers are examples',
      thinking: true,
      say: 'Run a query without the partition key, and it fans out to every partition. Each one does its share of the work, so the charge climbs. These numbers are examples, but the gap is real.',
      run: (m) => {
        m.unfocus();
        m.cls('.i12', 'hit', false);
        m.type('.cp-call', 'query_items("SELECT * FROM c WHERE c.price < 30")', 24);
        m.text('.cp-ml', 'query charge');
        m.cls('.cp-meter', 'hot');
        m.after(1200, () => {
          m.cls('.cp-part', 'fan');
          [1, 2, 3, 4].forEach((n, i) => m.after(i * 160, () => m.particles('.cp-flow', { from: '.cp-call', to: `.cp-part.p${n}`, count: 4, duration: 800, color: 'var(--x-warn)', silent: true })));
          m.count('.cp-ru', 38, 1500);
          m.sfx.riser(900);
        });
      },
    },
    {
      title: 'Every path is indexed by default',
      key: 'Every path',
      desc: 'The default policy indexes every property. A 1,536-number embedding makes each write pay for all of it.',
      status: 'upsert_item · write charge (example)',
      say: 'By default, Cosmos DB indexes every property. Add a 1,536 number embedding, and every write pays to index all of those numbers too.',
      run: (m) => {
        m.cls('.cp-part', 'fan', false);
        m.type('.cp-call', 'upsert_item(product)  # now with an embedding', 26);
        m.text('.cp-ml', 'write charge');
        m.show('.cp-idx', 0, true);
        m.show('.cp-paths > *', 160);
        m.after(900, () => { m.show('.cp-new', 0); m.punch('.cp-new', 4); });
        m.after(1100, () => m.count('.cp-ru', 48, 1300));
        m.after(1500, () => m.flash('.cp-path.emb'));
      },
    },
    {
      title: 'Exclude /embedding/* to trim writes',
      key: '/embedding/*',
      desc: 'Add the path to excludedPaths. A vector index can still cover it. Never exclude a path you filter on.',
      status: 'excludedPaths: ["/embedding/*"] · write charge drops',
      say: "Put slash embedding slash star in the excluded paths, and writes stop paying for it. A vector index can still cover that field. Just don't exclude a path that a query filters on.",
      run: (m) => {
        m.text('.cp-pol', 'excludedPaths: ["/embedding/*"]');
        m.cls('.cp-path.emb', 'ex');
        m.text('.cp-path.emb .cp-badge', 'excluded');
        m.cls('.cp-meter', 'hot', false);
        m.count('.cp-ru', 11, 1100);
        m.after(900, () => { m.show('.cp-vnote', 0, true); m.sfx.ding(); });
      },
    },
    {
      title: 'Consistency is a slider',
      key: 'slider',
      desc: 'Five levels from Strong to Eventual. Session is the account default: you always read your own writes.',
      status: 'account default · Session',
      say: 'The other dial is consistency. It runs from Strong to Eventual, and Session is the default. Within your own session, you always read your own writes.',
      run: (m) => {
        m.cls('.cp', 'cons');
        m.type('.cp-call', 'read_item("k-104", partition_key="kettles")', 26);
        m.text('.cp-ml', 'read charge');
        m.count('.cp-ru', 1, 600);
        m.show('.cp-con', 0, true);
        m.after(500, () => m.punch('.cp-stop.s2 span', 2));
      },
    },
    {
      title: 'Stronger reads cost about twice',
      key: 'twice',
      desc: 'Strong and Bounded staleness read from two replicas, so reads cost about 2x. Clients can only weaken the level.',
      status: 'Strong ≈ 2x reads · client may go weaker',
      say: "Slide to Strong or Bounded staleness, and reads cost about twice as much, because they check two replicas. A client can choose a weaker level than the account default, never a stronger one.",
      run: (m) => {
        m.cls('.cp-con', 'cost');
        m.cls('.cp-con', 'k2', false);
        m.cls('.cp-con', 'k0');
        m.text('.cp-rx', '≈ 2x');
        m.count('.cp-ru', 2, 600);
        m.cls('.cp-meter', 'hot');
        m.after(2800, () => {
          m.cls('.cp-con', 'k0', false);
          m.cls('.cp-con', 'k4');
          m.text('.cp-rx', '1x');
          m.cls('.cp-meter', 'hot', false);
          m.count('.cp-ru', 1, 500);
          m.type('.cp-call', 'CosmosClient(..., consistency_level="Eventual")  # weaker: allowed', 20);
          m.text('.cp-cl', 'Consistency level · this client');
          m.show('.cp-weak', 0);
        });
      },
    },
  ],
  end: {
    title: 'Point reads, lean indexes, Session',
    sub: 'Pass the partition key, exclude big paths you never filter on, and keep Session unless you truly need more.',
  },
};

export default spec;
