import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const svc = (k: string, name: string, icon: string, role: string, stat: string) =>
  `<div class="dt-svc dt-s-${k}"><span class="dt-ic">${icon}</span><b>${name}</b>` +
  `<span class="dt-role msd-mono">${role}</span><span class="dt-stat msd-mono">${stat}</span></div>`;
const link = `<span class="dt-link">${I.arrow}</span>`;

/** Example timings on a 0 to 4 second axis: start and duration in seconds. */
const row = (k: string, name: string, who: string, start: number, dur: number, table: string) =>
  `<div class="dt-row dt-r-${k} msd-reveal"><span class="dt-name"><b>${name}</b><small>${who}</small></span>` +
  `<span class="dt-track"><span class="dt-bar" style="--l:${(start / 4) * 100}%;--w:${Math.max(2, (dur / 4) * 100)}%"></span></span>` +
  `<span class="dt-ms msd-mono">${dur >= 1 ? `${dur.toFixed(1)} s` : `${Math.round(dur * 1000)} ms`}</span>` +
  `<span class="dt-tb msd-mono">${table}</span></div>`;

const spec: ExplainerSpec = {
  id: 'distributed-tracing',
  lesson: 'opentelemetry-tracing',
  title: {
    main: 'Five services. <em>One trace.</em>',
    sub: 'Spans, trace IDs, the traceparent header and the waterfall that shows which hop is slow.',
  },
  summary: 'An animation of one chatbot request crossing a web API, Service Bus, a worker, Cosmos DB and a model. Each hop records a span sharing one trace ID carried in the W3C traceparent header, a waterfall timeline shows a slow 2.4-second Cosmos DB span, attributes such as tenant.id add context, spans land in the Application Insights requests and dependencies tables joined by operation_Id, and the application map shows each cloud role name.',
  html: `
  <div class="dt">
    <div class="dt-chain msd-stagger">
      ${svc('api', 'Web API', I.globe, 'chat-api', '120 ms')}${link}
      ${svc('sb', 'Service Bus', I.layers, 'queue', 'send')}${link}
      ${svc('wk', 'Worker', I.cpu, 'worker', '3.5 s')}${link}
      ${svc('cos', 'Cosmos DB', I.db, 'dependency', '2.4 s')}${link}
      ${svc('ai', 'Model', I.brain, 'dependency', '0.9 s')}
    </div>
    <div class="dt-tp msd-card msd-reveal">
      <span class="dt-tpk msd-mono">traceparent:</span>
      <span class="dt-tpv msd-mono"><span class="dt-v">00</span>-<span class="dt-tid">4bf92f3577b34da6a3ce929d0e0e4736</span>-<span class="dt-sid">00f067aa0ba902b7</span>-<span class="dt-fl">01</span></span>
      <span class="dt-op msd-chip msd-pop">operation_Id = trace ID</span>
    </div>
    <div class="dt-wf msd-card">
      <div class="dt-wh"><span class="msd-label">End-to-end transaction</span><span class="dt-tchip msd-chip msd-pop">trace 4bf92f35…0e4736</span><small class="dt-ex">example timings</small></div>
      <div class="dt-rows">
        ${row('api', 'POST /ask', 'chat-api · server', 0, 0.12, 'requests')}
        ${row('sb', 'send summarise-jobs', 'chat-api · producer', 0.06, 0.06, 'dependencies')}
        ${row('wk', 'process message', 'worker · consumer', 0.4, 3.5, 'requests')}
        ${row('cos', 'cosmos query', 'worker · client', 0.45, 2.4, 'dependencies')}
        ${row('ai', 'chat completion', 'worker · client', 2.95, 0.9, 'dependencies')}
      </div>
      <div class="dt-axis msd-mono"><span>0 s</span><span>1 s</span><span>2 s</span><span>3 s</span><span>4 s</span></div>
      <div class="dt-attrs msd-reveal"><span class="msd-label">attributes</span><span class="msd-chip">tenant.id = "contoso"</span><span class="msd-chip">http.route = "/ask"</span><span class="msd-chip">service.name = "worker"</span></div>
    </div>
    <div class="dt-flow"></div>
  </div>`,
  css: `
  @S .dt{ position:relative; height:100%; display:flex; flex-direction:column; gap:18px; }
  @S .dt-chain{ display:flex; align-items:stretch; justify-content:space-between; gap:6px; }
  @S .dt-svc{ flex:1; min-width:0; display:flex; flex-direction:column; align-items:center; gap:8px; padding:14px 8px; border-radius:18px; border:1.5px solid var(--x-line); background:linear-gradient(180deg, var(--x-panel), var(--x-panel-2)); text-align:center; transition:border-color .3s, box-shadow .3s, opacity .3s, transform .3s; }
  @S .dt-ic{ width:54px; height:54px; border-radius:15px; display:grid; place-items:center; background:rgb(58 160 255 / .12); color:var(--x-a1); }
  @S .dt-ic svg{ width:30px; height:30px; }
  @S .dt-svc b{ color:#fff; font-size:21px; white-space:nowrap; }
  @S .dt-role, @S .dt-stat{ display:inline-block; visibility:hidden; opacity:0; font-size:15px; padding:3px 10px; border-radius:100px; transition:opacity .3s; }
  @S .dt-role{ background:rgb(180 140 255 / .16); color:var(--x-you); }
  @S .dt-stat{ background:rgb(63 185 80 / .14); color:var(--x-ok); }
  @S .dt-map .dt-role, @S .dt-map .dt-stat{ visibility:visible; opacity:1; }
  @S .dt-svc.dt-hit{ border-color:var(--x-a1); box-shadow:0 0 0 1px var(--x-a1); }
  @S .dt-svc.dt-slow{ border-color:var(--x-bad); box-shadow:0 0 0 1px var(--x-bad), 0 0 36px rgb(244 74 106 / .25); }
  @S .dt-svc.dt-slow .dt-ic{ background:rgb(244 74 106 / .18); color:var(--x-bad); }
  @S .dt-svc.dt-slow .dt-stat{ background:rgb(244 74 106 / .18); color:var(--x-bad); }
  @S .dt-link{ align-self:center; width:30px; flex-shrink:0; color:var(--x-dim); }
  @S .dt-link svg{ width:30px; height:30px; }
  @S .dt-tp{ display:flex; align-items:center; flex-wrap:wrap; gap:8px 14px; padding:14px 18px; font-size:20px; }
  @S .dt-tpk{ color:var(--x-dim); font-weight:700; }
  @S .dt-tpv{ color:var(--x-dim); overflow-wrap:anywhere; }
  @S .dt-tid{ color:var(--x-cyan); font-weight:700; transition:background .3s; border-radius:6px; }
  @S .dt-tid.dt-glow{ background:rgb(34 211 238 / .16); }
  @S .dt-sid{ color:var(--x-warn); } @S .dt-fl{ color:var(--x-ok); }
  @S .dt-op{ font-size:17px; }
  @S .dt-wf{ flex:1; min-height:0; padding:16px 18px; display:flex; flex-direction:column; gap:10px; }
  @S .dt-wh{ display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
  @S .dt-tchip{ font-size:16px; color:var(--x-cyan); }
  @S .dt-ex{ margin-left:auto; color:var(--x-dim); font-size:16px; font-style:italic; }
  @S .dt-rows{ display:flex; flex-direction:column; gap:6px; }
  @S .dt-row{ display:grid; grid-template-columns:220px 1fr 76px 140px; align-items:center; gap:12px; padding:5px 8px; border-radius:12px; transition:background .3s, opacity .3s, transform .3s; }
  @S .dt-name{ display:flex; flex-direction:column; min-width:0; }
  @S .dt-name b{ color:#fff; font-size:19px; font-family:var(--x-mono); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  @S .dt-name small{ color:var(--x-dim); font-size:15px; }
  @S .dt-track{ position:relative; height:26px; border-radius:6px; background:rgb(255 255 255 / .04); }
  @S .dt-bar{ position:absolute; top:3px; bottom:3px; left:var(--l); width:var(--w); border-radius:5px; background:linear-gradient(90deg, var(--x-a1), var(--x-cyan)); transform:scaleX(0); transform-origin:left center; transition:transform .5s cubic-bezier(.22,1,.36,1) .15s; }
  @S .dt-row.show .dt-bar{ transform:scaleX(1); }
  @S .dt-ms{ color:var(--x-text); font-size:17px; text-align:right; }
  @S .dt-tb{ font-size:15px; padding:4px 10px; border-radius:8px; text-align:center; opacity:0; transition:opacity .3s; }
  @S .dt-tables .dt-tb{ opacity:1; }
  @S .dt-r-api .dt-tb, @S .dt-r-wk .dt-tb{ background:rgb(58 160 255 / .16); color:var(--x-a1); }
  @S .dt-r-sb .dt-tb, @S .dt-r-cos .dt-tb, @S .dt-r-ai .dt-tb{ background:rgb(180 140 255 / .16); color:var(--x-you); }
  @S .dt-row.dt-slow{ background:rgb(244 74 106 / .1); }
  @S .dt-row.dt-slow .dt-bar{ background:linear-gradient(90deg, var(--x-bad), var(--x-warn)); }
  @S .dt-row.dt-slow .dt-ms{ color:var(--x-bad); font-weight:700; }
  @S .dt-axis{ display:flex; justify-content:space-between; margin-left:240px; margin-right:248px; color:var(--x-dim); font-size:14px; }
  @S .dt-attrs{ display:flex; align-items:center; flex-wrap:wrap; gap:10px; margin-top:auto; }
  @S .dt-attrs .msd-chip{ font-size:17px; }
  @S .dt-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @L .dt{ gap:12px; }
  @L .dt-svc{ padding:10px 8px; gap:6px; }
  @L .dt-tp{ padding:10px 18px; }
  @L .dt-wf{ padding:12px 18px; gap:8px; }
  @L .dt-rows{ gap:4px; }
  @L .dt-row{ padding:3px 8px; }
  @L .dt-attrs{ gap:8px; }
  @P .dt{ gap:16px; }
  @P .dt-svc{ padding:12px 4px; }
  @P .dt-svc b{ font-size:18px; }
  @P .dt-link{ width:20px; } @P .dt-link svg{ width:20px; height:20px; }
  @P .dt-role, @P .dt-stat{ font-size:13px; padding:3px 6px; }
  @P .dt-tp{ font-size:21px; }
  @P .dt-row{ grid-template-columns:200px 1fr 70px 128px; gap:10px; padding:8px 6px; }
  @P .dt-name b{ font-size:18px; }
  @P .dt-axis{ margin-left:216px; margin-right:224px; }
  `,
  stages: [
    {
      title: 'One question, five stops',
      key: 'five stops',
      desc: 'A chatbot request goes from the web API to a queue, a worker, Cosmos DB and a model. Each team has its own logs.',
      status: '1 request · 5 services · 5 separate logs',
      say: "One chatbot question goes through five places. The web API, a Service Bus queue, a worker, Cosmos DB and the model. Each team has its own logs, and every team says their part is fast.",
      run: (m) => {
        m.show('.dt-chain > *', 140);
        ['api', 'sb', 'wk', 'cos'].forEach((k, i) => {
          const next = ['sb', 'wk', 'cos', 'ai'][i];
          m.after(900 + i * 450, () => m.particles('.dt-flow', { from: `.dt-s-${k}`, to: `.dt-s-${next}`, count: 3, duration: 500, silent: true }));
        });
      },
    },
    {
      title: 'One trace ID rides along',
      key: 'trace ID',
      desc: 'OpenTelemetry passes the trace ID to the next service in the W3C traceparent header, even through Service Bus.',
      status: 'context propagation · W3C traceparent',
      say: "OpenTelemetry gives the request a trace ID, thirty-two hex characters, and passes it on in the traceparent header. The Azure SDK even carries it through the Service Bus message, so the trace survives the queue.",
      run: (m) => {
        m.show('.dt-tp', 0);
        m.after(500, () => { m.cls('.dt-tid', 'dt-glow'); m.sfx.lock(); });
        ['api', 'sb', 'wk', 'cos'].forEach((k, i) => {
          const next = ['sb', 'wk', 'cos', 'ai'][i];
          m.after(800 + i * 420, () => {
            m.cls(`.dt-s-${k}`, 'dt-hit');
            m.particles('.dt-flow', { from: `.dt-s-${k}`, to: `.dt-s-${next}`, count: 3, duration: 450, color: '#22d3ee', silent: true });
            m.sfx.data(i);
          });
        });
        m.after(800 + 4 * 420, () => m.cls('.dt-s-ai', 'dt-hit'));
      },
    },
    {
      title: 'Every hop records a span',
      key: 'span',
      desc: 'A span is one timed step with its own span ID and a parent. All five share the same trace ID.',
      status: '1 trace · 5 spans',
      say: "At every hop, a span gets recorded. A span is one timed step, with its own ID and a parent. All five share the same trace ID, so they line up as one story.",
      run: (m) => {
        m.cls('.dt-svc', 'dt-hit', false);
        m.cls('.dt-tid', 'dt-glow', false);
        m.show('.dt-tchip', 0, true);
        m.show('.dt-row', 380);
      },
    },
    {
      title: 'The waterfall shows the slow hop',
      key: 'slow hop',
      desc: 'Laid out on one timeline, the Cosmos DB query takes 2.4 of the 3.9 seconds. Nobody has to guess.',
      status: 'cosmos query · 2.4 s (example) · slowest span',
      say: "Put the spans on one timeline and the answer jumps out. The Cosmos DB query takes two point four seconds. That's most of the wait, and nobody has to argue about it.",
      run: (m) => {
        m.cls('.dt-r-cos', 'dt-slow');
        m.cls('.dt-s-cos', 'dt-slow');
        m.focus('.dt-r-cos', '.dt-r-api, .dt-r-sb, .dt-r-wk, .dt-r-ai');
        m.shake('.dt-s-cos');
      },
    },
    {
      title: 'Attributes add the why',
      key: 'Attributes',
      desc: 'Key-value details such as tenant.id let you filter. Keep prompts, personal data and secrets out.',
      status: 'span.set_attribute("tenant.id", …)',
      say: "Add attributes to your spans, like tenant dot id. Now you can check whether it's slow for everyone or only for one customer. Just keep prompts, personal data and secrets out of them.",
      run: (m) => {
        m.unfocus();
        m.show('.dt-attrs', 0);
        m.after(300, () => m.show('.dt-attrs .msd-chip', 220));
      },
    },
    {
      title: 'Spans land in two tables',
      key: 'two tables',
      desc: 'Server and consumer spans go to requests; client and producer spans to dependencies. operation_Id joins them.',
      status: 'requests ⋈ dependencies · on operation_Id',
      say: "In Application Insights, server and consumer spans become rows in the requests table. Client and producer spans go into dependencies. Both carry operation underscore Id, which is the trace ID, so one query joins the lot.",
      run: (m) => {
        m.cls('.dt-wf', 'dt-tables');
        m.show('.dt-op', 0);
        m.cls('.dt-tid', 'dt-glow');
        m.sfx.lock();
      },
    },
    {
      title: 'The application map',
      key: 'application map',
      desc: 'One node per cloud role name, from OTEL_SERVICE_NAME, with timings and failures on each.',
      status: 'application map · cloud role names',
      say: "Last, the application map. Each service shows up under its cloud role name, which comes from O T E L service name. You see call times on every node, and the slow one is red before you open a single log.",
      run: (m) => {
        m.cls('.dt-tid', 'dt-glow', false);
        m.cls('.dt-chain', 'dt-map');
        m.qa('.dt-svc').forEach((_, i) => m.after(i * 160, () => m.sfx.blip(i)));
        m.after(900, () => { m.punch('.dt-s-cos', 4); m.sfx.resolve(); });
      },
    },
  ],
  end: {
    title: 'One trace ID, every hop, one timeline',
    sub: 'Spans share a trace ID through traceparent, so the waterfall and the application map show where the time went.',
  },
};

export default spec;
