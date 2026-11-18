import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

/** Example rows, already in ascending cosine distance (smaller = closer). */
const rows: [string, string, string, number][] = [
  ['12', 'contoso', 'Refunds within 30 days need a receipt.', 0.18],
  ['88', 'fabrikam', 'Fabrikam refunds: 60 days, cash back.', 0.21],
  ['31', 'contoso', 'After 30 days we offer store credit.', 0.24],
  ['7', 'contoso', 'Request a refund from the Orders page.', 0.29],
  ['45', 'contoso', "Gift cards can't be refunded.", 0.33],
  ['52', 'contoso', 'Damaged items: refund or replace.', 0.36],
];

const row = ([id, tenant, text]: [string, string, string, number]) =>
  `<div class="rg-row r${id}"><b class="msd-mono">#${id}</b><span class="rg-ten ${tenant === 'contoso' ? 'rg-c' : 'rg-f'}">${tenant}</span><p>${text}</p><span class="rg-d msd-mono">–</span></div>`;

const spec: ExplainerSpec = {
  id: 'rag-retrieval',
  lesson: 'pgvector-rag',
  title: {
    main: 'Find the right chunks, <em>then answer from them</em>',
    sub: 'pgvector similarity search with a tenant filter, an HNSW index, and a grounded answer that cites its sources.',
  },
  summary:
    'An animation of retrieval-augmented generation with pgvector. A Contoso user asks about refunds, the question is embedded with the same model as the documents, and a SQL query orders chunks by cosine distance and keeps five. Without a tenant filter a Fabrikam chunk leaks into the results; adding WHERE tenant_id to the same query fixes it. An HNSW index replaces a full scan, the five chunks go into the prompt, and the model answers citing chunk ids.',
  html: `
  <div class="rg">
    <div class="rg-a">
      <div class="rg-q msd-card msd-reveal">
        <div class="rg-qh"><span class="rg-av">${I.user}</span><p>Can I get a refund after 30 days?</p></div>
        <div class="rg-qm"><span class="msd-chip">tenant_id = contoso</span></div>
        <div class="rg-vec msd-reveal"><span class="rg-vl">${I.layers}<b>embedding</b><small>1,536 numbers</small></span><code class="rg-vt msd-mono"></code><small class="rg-ex">example values</small></div>
      </div>
      <div class="rg-sql msd-editor msd-reveal">
        <div class="ed-bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span class="rg-file msd-mono">retrieve.sql</span></div>
        <div class="body">
          <div><span class="kw">SELECT</span> id, content</div>
          <div><span class="kw">FROM</span> doc_chunks</div>
          <div class="rg-nowhere cm">-- no tenant filter</div>
          <div class="rg-where"><span class="kw">WHERE</span> tenant_id = <span class="st">'contoso'</span></div>
          <div><span class="kw">ORDER BY</span> embedding <span class="fn">&lt;=&gt;</span> $1</div>
          <div><span class="kw">LIMIT</span> 5;</div>
        </div>
      </div>
    </div>
    <div class="rg-b">
      <div class="rg-tbl msd-card msd-reveal">
        <div class="rg-th"><b class="msd-mono">doc_chunks</b><span>cosine distance · smaller = closer · example values</span></div>
        <div class="rg-rows">${rows.map(row).join('')}</div>
        <div class="rg-note">
          <span class="rg-leak msd-pill bad msd-reveal">${I.warn}Another tenant's chunk in the top 5</span>
          <span class="rg-safe msd-pill ok msd-reveal">${I.shield}All 5 rows belong to contoso</span>
        </div>
      </div>
      <div class="rg-slot">
        <div class="rg-idx msd-card msd-reveal">
          <div class="msd-label">How Postgres finds the closest rows</div>
          <div class="rg-bar rg-seq"><span>Sequential scan</span><i><u></u></i><small>compares the question with every row</small></div>
          <div class="rg-bar rg-hn"><span>HNSW index</span><i><u></u></i><small>hops through a graph, 40 candidates by default (hnsw.ef_search)</small></div>
          <span class="msd-chip rg-ops">USING hnsw (embedding vector_cosine_ops)</span>
        </div>
        <div class="rg-out msd-card accent msd-reveal">
          <div class="msd-label">Prompt to the model</div>
          <p class="rg-ins msd-mono">Answer only from the sources below. Cite source ids. If they don't contain the answer, say you don't know.</p>
          <div class="rg-src msd-stagger"><span class="msd-chip">[12]</span><span class="msd-chip">[31]</span><span class="msd-chip">[7]</span><span class="msd-chip">[45]</span><span class="msd-chip">[52]</span></div>
          <div class="rg-ans msd-reveal"><span>${I.check}</span><p>After 30 days you'll get store credit, not a cash refund <b>[31]</b>. Inside 30 days, keep your receipt <b>[12]</b>.</p></div>
        </div>
      </div>
    </div>
    <div class="rg-flow"></div>
  </div>`,
  css: `
  @S code{ background:none; padding:0; border-radius:0; } /* the lesson's light inline-code chip doesn't belong on the dark stage */
  @S .rg{ position:relative; height:100%; display:grid; grid-template-columns:440px 1fr; gap:20px; }
  @S .rg-a, @S .rg-b{ display:flex; flex-direction:column; gap:18px; min-height:0; }
  @S .rg-q{ padding:20px; display:flex; flex-direction:column; gap:14px; }
  @S .rg-qh{ display:flex; gap:14px; align-items:center; }
  @S .rg-av{ width:52px; height:52px; flex-shrink:0; border-radius:14px; display:grid; place-items:center; background:rgb(180 140 255 / .16); color:var(--x-you); }
  @S .rg-av svg{ width:30px; height:30px; }
  @S .rg-qh p{ margin:0; color:#fff; font-size:27px; font-weight:700; line-height:1.3; }
  @S .rg-vec{ display:flex; flex-direction:column; gap:8px; padding:14px; border-radius:16px; background:rgb(34 211 238 / .06); border:1.5px solid rgb(34 211 238 / .35); }
  @S .rg-vl{ display:flex; align-items:center; gap:10px; color:var(--x-cyan); }
  @S .rg-vl svg{ width:26px; height:26px; } @S .rg-vl b{ font-size:22px; } @S .rg-vl small{ color:var(--x-dim); font-size:18px; margin-left:auto; }
  @S .rg-vt{ color:#fff; font-size:21px; min-height:30px; }
  @S .rg-ex{ color:var(--x-dim); font-size:16px; font-style:italic; }
  @S .rg-sql .body{ font-size:22px; line-height:1.6; padding:16px 20px; }
  @S .rg-file{ margin-left:12px; color:#9aa4b4; font-size:18px; }
  @S .rg-nowhere, @S .rg-where{ max-height:0; opacity:0; overflow:hidden; transition:max-height .35s ease, opacity .35s ease, background .3s; }
  @S .rg-nowhere.show{ max-height:44px; opacity:1; }
  @S .rg-where.show{ max-height:44px; opacity:1; background:rgb(63 185 80 / .16); border-radius:6px; }
  @S .rg-tbl{ padding:18px; display:flex; flex-direction:column; gap:10px; }
  @S .rg-th{ display:flex; align-items:baseline; gap:14px; flex-wrap:wrap; }
  @S .rg-th b{ color:#fff; font-size:24px; } @S .rg-th span{ color:var(--x-dim); font-size:17px; }
  @S .rg-rows{ display:flex; flex-direction:column; gap:6px; }
  @S .rg-row{ display:grid; grid-template-columns:62px 118px 1fr 70px; align-items:center; gap:10px; padding:8px 12px; border-radius:12px; border:1.5px solid var(--x-line); background:rgb(14 20 32 / .7); transition:all .3s ease; }
  @S .rg-row b{ color:var(--x-dim); font-size:19px; }
  @S .rg-row p{ margin:0; color:var(--x-text); font-size:20px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  @S .rg-ten{ font-family:var(--x-mono); font-size:16px; font-weight:700; padding:4px 8px; border-radius:8px; text-align:center; }
  @S .rg-c{ color:var(--x-a1); background:rgb(58 160 255 / .12); } @S .rg-f{ color:var(--x-warn); background:rgb(240 166 74 / .14); }
  @S .rg-d{ color:var(--x-cyan); font-size:20px; text-align:right; }
  @S .rg-row.rg-top{ border-color:var(--x-a1); background:rgb(58 160 255 / .1); }
  @S .rg-row.rg-leak{ border-color:var(--x-bad); background:rgb(244 74 106 / .12); }
  @S .rg-row.rg-cut{ opacity:.3; border-style:dashed; }
  @S .rg-row.rg-cut p{ text-decoration:line-through; }
  @S .rg-note{ position:relative; min-height:52px; }
  @S .rg-note .msd-pill{ position:absolute; left:0; top:0; font-size:19px; padding:8px 14px; }
  @S .rg-note .msd-pill svg{ width:22px; height:22px; }
  @S .rg-slot{ position:relative; flex:1; min-height:0; pointer-events:none; }
  @S .rg-idx, @S .rg-out{ position:absolute; inset:0; padding:20px; display:flex; flex-direction:column; gap:14px; }
  @S .rg-bar{ display:grid; grid-template-columns:200px 1fr; gap:6px 14px; align-items:center; }
  @S .rg-bar span{ color:#fff; font-size:22px; font-weight:700; }
  @S .rg-bar i{ height:18px; border-radius:9px; background:var(--x-line); overflow:hidden; }
  @S .rg-bar u{ display:block; height:100%; width:0; border-radius:9px; transition:width 1.4s cubic-bezier(.4,0,.2,1); }
  @S .rg-seq u{ background:var(--x-warn); } @S .rg-hn u{ background:var(--x-ok); }
  @S .rg-bar small{ grid-column:2; color:var(--x-dim); font-size:18px; }
  @S .rg-idx.rg-go .rg-seq u{ width:100%; } @S .rg-idx.rg-go .rg-hn u{ width:9%; }
  @S .rg-ops{ align-self:flex-start; font-size:18px; }
  @S .rg-ins{ margin:0; color:var(--x-text); font-size:18px; line-height:1.45; padding:12px 14px; border-radius:12px; background:rgb(255 255 255 / .04); }
  @S .rg-src{ display:flex; gap:8px; flex-wrap:wrap; }
  @S .rg-ans{ display:flex; gap:12px; align-items:flex-start; padding:14px; border-radius:14px; border:1.5px solid var(--x-ok); background:rgb(63 185 80 / .08); }
  @S .rg-ans > span{ color:var(--x-ok); } @S .rg-ans > span svg{ width:30px; height:30px; }
  @S .rg-ans p{ margin:0; color:#fff; font-size:22px; line-height:1.4; } @S .rg-ans b{ color:var(--x-cyan); }
  @S .rg-flow{ position:absolute; inset:0; pointer-events:none; z-index:8; }
  @L .rg-tbl{ padding:14px 16px; gap:8px; }
  @L .rg-rows{ gap:5px; }
  @L .rg-row{ padding:5px 12px; }
  @L .rg-note{ min-height:44px; }
  @L .rg-idx, @L .rg-out{ padding:16px 18px; gap:10px; }
  @L .rg-bar small{ font-size:17px; }
  @L .rg-ins{ font-size:17px; line-height:1.4; padding:10px 12px; }
  @L .rg-ans{ padding:10px 12px; }
  @L .rg-ans p{ font-size:21px; }
  @P .rg{ grid-template-columns:1fr; display:flex; flex-direction:column; gap:14px; }
  @P .rg-a{ gap:12px; height:500px; flex-shrink:0; }
  @P .rg-b{ position:static; }
  @P .rg-q{ padding:14px 16px; gap:10px; }
  @P .rg-qh p{ font-size:26px; }
  @P .rg-vec{ padding:10px 14px; gap:6px; }
  @P .rg-sql .body{ font-size:22px; line-height:1.4; padding:12px 20px; }
  @P .rg-slot{ position:absolute; left:0; right:0; top:0; height:500px; z-index:7; }
  @P .rg-tbl{ padding:14px 16px; gap:8px; }
  @P .rg-rows{ gap:5px; }
  @P .rg-row{ grid-template-columns:62px 118px 1fr 70px; padding:6px 12px; }
  @P .rg-row p{ font-size:21px; }
  @P .rg-row.msd-focus{ transform:scale(1.02); }
  @P .rg-note{ min-height:44px; }
  `,
  stages: [
    {
      title: 'A question comes in',
      key: 'question',
      desc: 'A Contoso user asks about refunds. Your app already knows which tenant they belong to.',
      status: 'tenant_id = contoso · new question',
      say: "A Contoso customer asks: can I get a refund after thirty days? Your app knows who they are, so it knows their tenant. That matters in a minute.",
      run: (m) => {
        m.show('.rg-q', 0);
      },
    },
    {
      title: 'Embed it with the same model',
      key: 'same model',
      desc: 'The question becomes a vector of 1,536 numbers, made by the model that embedded your documents.',
      status: 'text-embedding-3-small · 1536 dims',
      say: "First, the question becomes an embedding, a list of 1,536 numbers. Use the same model that embedded your documents, or the numbers won't line up.",
      run: (m) => {
        m.show('.rg-vec', 0, true);
        m.after(250, () => m.type('.rg-vt', '[0.021, -0.113, 0.087, 0.004, …]', 30));
      },
    },
    {
      title: 'Closest chunks first',
      key: 'Closest',
      desc: '<=> is cosine distance. Smaller means closer, so you sort ascending and keep 5.',
      status: 'ORDER BY embedding <=> $1 LIMIT 5',
      say: "Now one SQL query. The arrow operator is cosine distance, and smaller means closer, so you sort ascending and keep the top five.",
      run: (m) => {
        m.show('.rg-sql', 0, true);
        m.show('.rg-tbl', 0, true);
        m.after(300, () => m.particles('.rg-flow', { from: '.rg-vec', to: '.rg-rows', count: 6, duration: 800 }));
        rows.forEach(([id, , , d], i) => m.after(500 + i * 120, () => m.count(`.r${id} .rg-d`, d, 700, { decimals: 2 })));
        m.after(1500, () => {
          rows.slice(0, 5).forEach(([id]) => m.cls(`.r${id}`, 'rg-top'));
          m.sfx.lock();
        });
      },
    },
    {
      title: 'No filter, wrong tenant',
      key: 'wrong tenant',
      desc: "Without a tenant filter, a Fabrikam chunk ranks second and lands in Contoso's results.",
      status: 'leak · fabrikam chunk #88 in top 5',
      say: "But row two is Fabrikam's refund policy, another customer's data. With no tenant filter it's close in meaning, so it gets in. That's a leak.",
      run: (m) => {
        m.show('.rg-nowhere', 0, true);
        m.focus('.r88', '.rg-row');
        m.after(500, () => {
          m.cls('.r88', 'rg-top', false);
          m.cls('.r88', 'rg-leak');
          m.shake('.r88');
          m.show('.rg-leak', 0, true);
        });
      },
    },
    {
      title: 'Filter in the same query',
      key: 'same query',
      desc: "WHERE tenant_id = 'contoso' sits in the same query as ORDER BY, so all 5 rows are allowed.",
      status: "WHERE tenant_id = 'contoso' · 5 of 5 allowed",
      say: "The fix is a WHERE clause in the same query. Now only Contoso's rows can rank, and all five results are ones this user may see.",
      run: (m) => {
        m.unfocus();
        m.hide('.rg-leak');
        m.hide('.rg-nowhere');
        m.after(200, () => { m.show('.rg-where', 0, true); m.sfx.pop(); });
        m.after(800, () => { m.cls('.r88', 'rg-leak', false); m.cls('.r88', 'rg-cut'); });
        m.after(1300, () => { m.cls('.r52', 'rg-top'); m.punch('.r52', 3); m.show('.rg-safe', 0, true); });
      },
    },
    {
      title: 'HNSW instead of a full scan',
      key: 'HNSW',
      desc: 'Without an index, Postgres compares every row. HNSW hops through a graph and checks a short candidate list.',
      status: 'hnsw · vector_cosine_ops · ef_search 40',
      say: "Without an index, Postgres compares the question with every row. An HNSW index hops through a graph and keeps a short candidate list, forty by default. Raise ef search for better recall.",
      run: (m) => {
        m.show('.rg-idx', 0, true);
        m.after(400, () => { m.cls('.rg-idx', 'rg-go'); m.sfx.riser(1200); });
      },
    },
    {
      title: 'Chunks go into the prompt',
      key: 'prompt',
      desc: 'The 5 chunks become numbered sources, with an instruction to answer only from them.',
      status: 'prompt · 5 sources · answer only from these',
      say: "The five chunks go into the prompt with their ids, plus an instruction: answer only from these, cite them, and say you don't know if they don't cover it.",
      run: (m) => {
        m.hide('.rg-idx');
        m.show('.rg-out', 0, true);
        m.after(300, () => m.particles('.rg-flow', { from: '.rg-rows', to: '.rg-src', count: 5, duration: 800 }));
        m.after(700, () => m.show('.rg-src > *', 160));
      },
    },
    {
      title: 'A grounded answer with sources',
      key: 'grounded',
      desc: 'The reply cites chunk ids, so you can trace every claim back to your own data.',
      status: 'answer · cites [31] [12]',
      say: "So the model answers from your data, not from memory, and every claim points back to a chunk you can check.",
      run: (m) => {
        m.show('.rg-ans', 0);
        m.after(500, () => m.sfx.chime());
      },
    },
  ],
  end: {
    title: 'Embed, filter, rank, ground',
    sub: 'Same embedding model, WHERE in the same query, smallest distance first, and answer only from the chunks you found.',
  },
};

export default spec;
