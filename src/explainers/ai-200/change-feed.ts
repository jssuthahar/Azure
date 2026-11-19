import type { ExplainerSpec } from '../../lib/explainer/types';
import type { XApi } from '../../lib/explainer/player';
import { I } from '../../lib/explainer/icons';

const ticket = (cls: string, verb: string, what: string) =>
  `<span class="cf-tk msd-pop ${cls}"><b>${verb}</b><span>${what}</span></span>`;

/** Moves a rail's lease clip and the matching checkpoint cell to position n. */
const checkpoint = (m: XApi, range: number, n: number) => {
  for (let k = 0; k <= 5; k++) m.cls(`.cf-rail.r${range}`, `n${k}`, k === n);
  m.text(`.cf-l${range} .cf-ck`, `#${n}`);
};

const spec: ExplainerSpec = {
  id: 'change-feed',
  lesson: 'cosmos-db-change-feed',
  title: {
    main: 'New data in. <em>Fresh embeddings out.</em>',
    sub: 'How the Cosmos DB change feed, the change feed processor and its lease container keep vectors up to date.',
  },
  summary:
    'An animation of inserts and updates appended in order to a Cosmos DB change feed for two partition key ranges. A processor with a lease container reads them, the delegate embeds each item and the checkpoint moves only after success, a second worker takes over one lease, a write-back is skipped by a text hash check, a delete is missing from latest version mode so a soft delete with a TTL is used, and the Python route uses the Azure Functions Cosmos DB trigger.',
  html: `
  <div class="cf">
    <div class="cf-src">
      <div class="cf-app msd-node"><span class="ic">${I.app}</span><span>Seller app</span></div>
      <span class="cf-arr">${I.arrow}</span>
      <div class="cf-ctr msd-node"><span class="ic">${I.db}</span><span>products<small>monitored container</small></span></div>
      <span class="cf-del msd-pill bad msd-reveal">${I.x}<span>DELETE p3 · not in the feed</span></span>
    </div>
    <div class="cf-feed msd-card">
      <div class="cf-fh"><span class="msd-label">Change feed</span><span class="cf-fn">ordered per partition key range · on by default</span></div>
      <div class="cf-rail r1 n0"><span class="cf-rl">range 1</span><div class="cf-track">
        ${ticket('a1', 'create', 'p1')}${ticket('a2', 'update', 'p2')}${ticket('a3', 'create', 'p7')}${ticket('a4 wb', 'update', 'p7 · vector')}${ticket('a5 sd', 'update', 'p3 · deleted')}
        <i class="cf-clip"></i></div></div>
      <div class="cf-rail r2 n0"><span class="cf-rl">range 2</span><div class="cf-track">
        ${ticket('b1', 'create', 'p4')}${ticket('b2', 'update', 'p4')}${ticket('b3', 'create', 'p6')}
        <i class="cf-clip"></i></div></div>
    </div>
    <div class="cf-work msd-card msd-reveal">
      <div class="cf-wh"><span class="msd-label">Processor</span><code>embedProducts</code></div>
      <div class="cf-w cf-w1 msd-node"><span class="ic">${I.cpu}</span><span><b>worker-1</b><code class="cf-dl">waiting for changes</code></span></div>
      <div class="cf-w cf-w2 msd-node msd-reveal"><span class="ic">${I.cpu}</span><span><b>worker-2</b><code class="cf-dl">starting</code></span></div>
    </div>
    <div class="cf-lease msd-card msd-reveal">
      <div class="cf-wh"><span class="msd-label">Lease container</span><code>leases</code></div>
      <div class="cf-tbl">
        <div class="cf-th"><span>lease</span><span>owner</span><span>checkpoint</span></div>
        <div class="cf-row cf-l1"><span>range 1</span><span class="cf-ow">worker-1</span><b class="cf-ck">#0</b></div>
        <div class="cf-row cf-l2"><span>range 2</span><span class="cf-ow">worker-1</span><b class="cf-ck">#0</b></div>
      </div>
      <small class="cf-note">Simplified: real checkpoints are continuation tokens</small>
    </div>
    <div class="cf-code msd-editor msd-reveal">
      <div class="ed-bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span class="cf-file">function_app.py · Functions runs the processor and leases</span></div>
      <div class="body"><span class="fn">@app.cosmos_db_trigger</span>(
  arg_name=<span class="st">"items"</span>,
  container_name=<span class="st">"products"</span>,
  lease_container_name=<span class="st">"leases"</span>,
  create_lease_container_if_not_exists=<span class="st">"true"</span>, …)
<span class="kw">def</span> <span class="fn">embed_new_products</span>(items):
  <span class="kw">for</span> doc <span class="kw">in</span> items: <span class="cm"># skip if textHash unchanged</span></div>
    </div>
    <div class="cf-flow"></div>
  </div>`,
  css: `
  @S code{ background:none; padding:0; border-radius:0; } /* the lesson's light inline-code chip doesn't belong on the dark stage */
  @S .cf{ position:relative; height:100%; display:grid; gap:18px; }
  @L .cf{ grid-template-columns:1fr 1fr; grid-template-rows:104px 268px 1fr; grid-template-areas:"src src" "feed feed" "work lease"; }
  @P .cf{ grid-template-columns:1fr; grid-template-rows:auto 280px 1fr 1fr; grid-template-areas:"src" "feed" "work" "lease"; gap:14px; }
  @S .cf-src{ grid-area:src; display:flex; align-items:center; gap:14px; min-width:0; }
  @P .cf-src{ flex-wrap:wrap; }
  @S .cf-src .msd-node{ padding:14px 18px; font-size:24px; }
  @S .cf-src .msd-node .ic{ width:50px; height:50px; }
  @S .cf-ctr small{ display:block; color:var(--x-dim); font-size:17px; font-weight:600; font-family:var(--x-mono); }
  @S .cf-arr{ color:var(--x-a1); } @S .cf-arr svg{ width:36px; height:36px; }
  @S .cf-del{ margin-left:auto; font-size:20px; }
  @S .cf-del svg{ width:24px; height:24px; }
  @S .cf-feed{ grid-area:feed; padding:16px 20px; display:flex; flex-direction:column; gap:12px; min-width:0; }
  @S .cf-fh{ display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
  @S .cf-fn{ color:var(--x-dim); font-size:18px; font-family:var(--x-mono); }
  @S .cf-rail{ display:flex; align-items:center; gap:12px; }
  @S .cf-rl{ width:100px; flex-shrink:0; color:var(--x-cyan); font-family:var(--x-mono); font-size:19px; font-weight:700; }
  @S .cf-track{ position:relative; flex:1; display:flex; gap:10px; padding:10px 12px; min-height:88px; border-radius:16px; background:rgb(14 20 32 / .9); border:1.5px solid var(--x-line); }
  @S .cf-tk{ width:140px; flex-shrink:0; display:flex; flex-direction:column; gap:2px; padding:8px 12px; border-radius:12px; background:rgb(58 160 255 / .12); border:1.5px solid rgb(58 160 255 / .4); transition:opacity .3s, transform .36s cubic-bezier(.22,1.4,.36,1); }
  @S .cf-tk b{ color:var(--x-a1); font-size:16px; letter-spacing:1px; text-transform:uppercase; }
  @S .cf-tk span{ color:#fff; font-family:var(--x-mono); font-size:18px; white-space:nowrap; }
  @S .cf-tk.wb{ background:rgb(180 140 255 / .14); border-color:rgb(180 140 255 / .5); } @S .cf-tk.wb b{ color:var(--x-you); }
  @S .cf-tk.sd{ background:rgb(240 166 74 / .12); border-color:rgb(240 166 74 / .5); } @S .cf-tk.sd b{ color:var(--x-warn); }
  @S .cf-clip{ position:absolute; top:4px; bottom:4px; left:5px; width:6px; border-radius:3px; background:var(--x-ok); box-shadow:0 0 16px rgb(63 185 80 / .8); opacity:0; transition:left .6s cubic-bezier(.22,1,.36,1), opacity .3s; }
  @S .cf.leases .cf-clip{ opacity:1; }
  @S .cf-rail.n1 .cf-clip{ left:155px; } @S .cf-rail.n2 .cf-clip{ left:305px; } @S .cf-rail.n3 .cf-clip{ left:455px; }
  @S .cf-rail.n4 .cf-clip{ left:605px; } @S .cf-rail.n5 .cf-clip{ left:755px; }
  @S .cf-work, @S .cf-lease{ padding:16px 20px; display:flex; flex-direction:column; gap:12px; min-height:0; min-width:0; transition:opacity .3s, transform .3s; }
  @S .cf-work{ grid-area:work; } @S .cf-lease{ grid-area:lease; }
  @S .cf-wh{ display:flex; align-items:center; gap:12px; }
  @S .cf-wh code{ font-family:var(--x-mono); font-size:19px; color:var(--x-cyan); }
  @S .cf-w{ padding:12px 16px; font-size:23px; transition:opacity .3s, transform .3s, border-color .3s; }
  @S .cf-w .ic{ width:48px; height:48px; }
  @S .cf-w > span:last-child{ display:flex; flex-direction:column; gap:2px; min-width:0; }
  @S .cf-dl{ font-family:var(--x-mono); font-size:18px; font-weight:600; color:var(--x-dim); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  @S .cf-w.hot .cf-dl{ color:var(--x-cyan); }
  @S .cf-tbl{ display:flex; flex-direction:column; gap:6px; }
  @S .cf-th, @S .cf-row{ display:grid; grid-template-columns:1fr 1.1fr .9fr; gap:10px; align-items:center; padding:8px 14px; border-radius:11px; }
  @S .cf-th{ color:var(--x-dim); font-size:16px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; }
  @S .cf-row{ background:rgb(255 255 255 / .04); border:1.5px solid var(--x-line); font-family:var(--x-mono); font-size:20px; color:#fff; }
  @S .cf-ck{ color:var(--x-ok); font-size:24px; }
  @S .cf-note{ color:var(--x-dim); font-size:16px; }
  @S .cf-code{ display:none; min-height:0; }
  @L .cf-code{ grid-row:3; grid-column:1 / -1; }
  @P .cf-code{ grid-row:3 / span 2; }
  @S .cf.py .cf-work, @S .cf.py .cf-lease{ display:none; }
  @S .cf.py .cf-code{ display:block; }
  @S .cf-code .body{ white-space:pre; font-size:21px; line-height:1.6; padding:16px 22px; }
  @P .cf-code .body{ font-size:22px; white-space:pre-wrap; }
  @S .cf-file{ margin-left:12px; color:#bbb; font-family:var(--x-mono); font-size:17px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  @P .cf-src .msd-node{ padding:10px 16px; }
  @P .cf-feed{ padding:14px 18px; gap:10px; }
  @P .cf-track{ min-height:78px; padding:8px 10px; }
  @P .cf-work, @P .cf-lease{ padding:14px 18px; gap:10px; }
  @P .cf-th, @P .cf-row{ padding:6px 14px; }
  @S .cf-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  `,
  stages: [
    {
      title: 'Writes land in the change feed',
      key: 'change feed',
      desc: 'Creates and updates are appended in order, per partition key range. The feed is on for every container.',
      status: 'change feed · 6 changes · 2 ranges',
      say: "Every insert and update in a Cosmos DB container lands in its change feed. It's an ordered record, kept per partition key range, and it's switched on by default.",
      run: (m) => {
        m.particles('.cf-flow', { from: '.cf-app', to: '.cf-ctr', count: 5, duration: 700 });
        m.after(500, () => m.show('.r1 .a1, .r2 .b1, .r1 .a2, .r2 .b2, .r1 .a3, .r2 .b3', 260));
        m.after(600, () => m.particles('.cf-flow', { from: '.cf-ctr', to: '.r1 .a2', count: 4, duration: 800, silent: true }));
        m.after(900, () => m.particles('.cf-flow', { from: '.cf-ctr', to: '.r2 .b2', count: 4, duration: 800, silent: true }));
      },
    },
    {
      title: 'A lease container tracks progress',
      key: 'lease container',
      desc: 'The processor keeps one lease per range: the last checkpoint and which instance owns it.',
      status: 'processor embedProducts · 2 leases',
      say: "The change feed processor reads it for you. It keeps its progress in a lease container. There's one lease per range, holding the last checkpoint and which instance owns it.",
      run: (m) => {
        m.show('.cf-work', 0, true);
        m.show('.cf-lease', 0, true);
        m.cls('.cf', 'leases');
        checkpoint(m, 1, 0);
        checkpoint(m, 2, 0);
        m.after(600, () => m.punch('.cf-l1, .cf-l2', 3));
      },
    },
    {
      title: 'Delegate first, then the checkpoint',
      key: 'checkpoint',
      desc: 'Your delegate handles the batch. Only after it succeeds does the lease move on, so delivery is at least once.',
      status: 'delegate · 3 items · at-least-once',
      thinking: true,
      say: 'Each batch goes to your code, called the delegate. Only after the delegate succeeds does the lease move forward. If it fails, the same batch comes back, so delivery is at least once.',
      run: (m) => {
        m.cls('.cf-w1', 'hot');
        m.particles('.cf-flow', { from: '.r1 .a2', to: '.cf-w1', count: 6, duration: 900 });
        m.type('.cf-w1 .cf-dl', 'embedding p1, p2, p7…', 30);
        m.after(1900, () => {
          m.text('.cf-w1 .cf-dl', 'done · checkpoint saved');
          checkpoint(m, 1, 3);
          m.punch('.cf-l1', 4);
          m.sfx.lock();
        });
      },
    },
    {
      title: 'Two workers share the leases',
      key: 'share the leases',
      desc: 'Same processor name and lease container, a different instance name. Each lease has one owner at a time.',
      status: 'instances 2 · leases 2 · one owner each',
      say: 'Start a second instance with the same processor name and the same lease container, but its own instance name. The leases are shared out, so each worker takes a different range.',
      run: (m) => {
        m.cls('.cf-w1', 'hot', false);
        m.text('.cf-w1 .cf-dl', 'owns range 1');
        m.show('.cf-w2', 0);
        m.after(700, () => { m.text('.cf-l2 .cf-ow', 'worker-2'); m.punch('.cf-l2', 2); });
        m.after(1200, () => {
          m.cls('.cf-w2', 'hot');
          m.particles('.cf-flow', { from: '.r2 .b2', to: '.cf-w2', count: 6, duration: 900 });
          m.text('.cf-w2 .cf-dl', 'range 2 · p4, p6 embedded');
        });
        m.after(2200, () => { checkpoint(m, 2, 3); m.cls('.cf-w2', 'hot', false); m.sfx.lock(); });
      },
    },
    {
      title: 'Write the vector back, with a guard',
      key: 'guard',
      desc: 'Writing the embedding is an update too, so it comes back. A text hash check skips it instead of looping.',
      status: 'p7 · textHash unchanged · skipped',
      say: 'Here the delegate embeds the new description and writes the vector back. That write is an update too, so it comes round again. A text hash check sees nothing changed, and skips it.',
      run: (m) => {
        m.cls('.cf-w1', 'hot');
        m.text('.cf-w1 .cf-dl', 'p7 · embed, write vector back');
        m.particles('.cf-flow', { from: '.cf-w1', to: '.cf-ctr', count: 6, duration: 900, color: 'var(--x-you)' });
        m.after(1000, () => { m.show('.r1 .a4', 0); m.punch('.r1 .a4', 5); });
        m.after(1800, () => m.particles('.cf-flow', { from: '.r1 .a4', to: '.cf-w1', count: 5, duration: 800, color: 'var(--x-you)', silent: true }));
        m.after(2700, () => {
          m.text('.cf-w1 .cf-dl', 'p7 · text hash same, skip');
          checkpoint(m, 1, 4);
          m.cls('.cf-w1', 'hot', false);
          m.sfx.ding();
        });
      },
    },
    {
      title: 'Deletes don’t show up',
      key: 'Deletes',
      desc: 'Latest version mode skips deletes. Use a soft delete flag plus a TTL, or all versions and deletes mode.',
      status: 'latest version mode · soft delete + TTL',
      say: "In the default latest version mode, deletes don't show up at all. The usual fix is a soft delete: set a deleted flag, which the feed does record, and add a TTL to remove the item later.",
      run: (m) => {
        m.show('.cf-del', 0, true);
        m.shake('.cf-del');
        m.after(1800, () => {
          m.show('.r1 .a5', 0);
          m.particles('.cf-flow', { from: '.cf-ctr', to: '.r1 .a5', count: 5, duration: 800, color: 'var(--x-warn)' });
        });
        m.after(2700, () => {
          m.text('.cf-w1 .cf-dl', 'p3 · deleted flag, drop its vector');
          checkpoint(m, 1, 5);
          m.sfx.lock();
        });
      },
    },
    {
      title: 'In Python: a Functions trigger',
      key: 'Functions trigger',
      desc: 'The Python SDK has no processor library. The Azure Functions Cosmos DB trigger runs it, leases included.',
      status: 'Azure Functions · Cosmos DB trigger',
      say: "Writing Python? The Python SDK doesn't include the processor. You use the Azure Functions Cosmos DB trigger instead, and it runs the processor and the leases for you.",
      run: (m) => {
        m.cls('.cf', 'py');
        m.show('.cf-code', 0);
        m.sfx.sparkle();
      },
    },
  ],
  end: {
    title: 'Feed, lease, delegate, checkpoint',
    sub: 'Changes arrive in order per range, leases remember where you stopped, and your handler must be safe to run twice.',
  },
};

export default spec;
