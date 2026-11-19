import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const trig = (k: string, name: string, icon: string, deco: string) =>
  `<div class="fb-tr fb-tr-${k}"><span class="fb-ic">${icon}</span><span class="fb-tn"><b>${name}</b><small>${deco}</small></span></div>`;

const inst = Array.from({ length: 8 }, (_, i) => `<span class="fb-inst fb-i${i + 1}">${I.bolt}</span>`).join('');

const spec: ExplainerSpec = {
  id: 'functions-bindings',
  lesson: 'functions-triggers-and-bindings',
  title: {
    main: 'Something happens. <em>Your function runs.</em>',
    sub: 'Triggers, input and output bindings, Python v2 decorators and scaling, in one summarise API.',
  },
  summary: 'An animation of an Azure Functions app: five trigger types wait, an HTTP trigger wakes a Python v2 function decorated with @app.route, an input binding reads a blob, a Service Bus output binding writes a queue message with no client code, the function returns 202 Accepted, then instances scale out under load and back to zero when idle on the Flex Consumption plan.',
  html: `
  <div class="fb">
    <div class="fb-trigs">
      <span class="msd-label">Triggers · one per function</span>
      <div class="fb-tlist msd-stagger">
        ${trig('http', 'HTTP', I.globe, '@app.route')}
        ${trig('sb', 'Service Bus', I.layers, '@app.service_bus_queue_trigger')}
        ${trig('tm', 'Timer', I.clock, '@app.timer_trigger')}
        ${trig('eg', 'Event Grid', I.bolt, '@app.event_grid_trigger')}
        ${trig('cos', 'Cosmos DB', I.db, '@app.cosmos_db_trigger')}
      </div>
    </div>
    <div class="fb-fn msd-editor">
      <div class="ed-bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span class="fb-file">function_app.py</span><span class="fb-zz msd-mono">idle</span></div>
      <div class="body">
        <div class="fb-l fb-l0">app = func.<span class="fn">FunctionApp</span>()</div>
        <div class="fb-l fb-l1 msd-reveal"><span class="kw">@app.route</span>(route=<span class="st">"summarise"</span>)</div>
        <div class="fb-l fb-l2 msd-reveal"><span class="kw">@app.service_bus_queue_output</span>(<br>&nbsp;&nbsp;arg_name=<span class="st">"job"</span>,<br>&nbsp;&nbsp;queue_name=<span class="st">"summarise-jobs"</span>,<br>&nbsp;&nbsp;connection=<span class="st">"ServiceBusConnection"</span>)</div>
        <div class="fb-l fb-l3 msd-reveal"><span class="kw">def</span> <span class="fn">summarise</span>(req, job: func.Out[str]):</div>
        <div class="fb-l fb-l4 msd-reveal">&nbsp;&nbsp;job.<span class="fn">set</span>(json.dumps(body))</div>
        <div class="fb-l fb-l5 msd-reveal">&nbsp;&nbsp;<span class="kw">return</span> func.<span class="fn">HttpResponse</span>(status_code=<span class="st">202</span>)</div>
      </div>
    </div>
    <div class="fb-outs">
      <span class="msd-label">Bindings · optional</span>
      <div class="fb-bind fb-in msd-reveal"><span class="fb-ic">${I.file}</span><span class="fb-tn"><b>Input · Blob</b><small>@app.blob_input</small><small>docs/report-42.pdf</small></span></div>
      <div class="fb-bind fb-q msd-reveal"><span class="fb-ic">${I.layers}</span><span class="fb-tn"><b>Output · Service Bus</b><small>summarise-jobs</small><small class="fb-qn">0 messages</small></span></div>
      <div class="fb-resp msd-pill ok msd-pop">${I.check}<span>202 Accepted</span></div>
    </div>
    <div class="fb-scale">
      <div class="fb-sh"><span class="msd-label">Flex Consumption · instances</span><span class="fb-cnt msd-num">0</span><small class="fb-ex">example numbers</small></div>
      <div class="fb-insts">${inst}</div>
    </div>
    <div class="fb-flow"></div>
  </div>`,
  css: `
  @S .fb{ position:relative; height:100%; display:grid; grid-template-columns:0.95fr 1.9fr 0.95fr; grid-template-rows:1fr auto; gap:18px; grid-template-areas:"tr fn out" "sc sc sc"; }
  @S .fb-trigs{ grid-area:tr; display:flex; flex-direction:column; gap:12px; min-width:0; }
  @S .fb-tlist{ display:flex; flex-direction:column; gap:10px; }
  @S .fb-tr, @S .fb-bind{ display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:16px; border:1.5px solid var(--x-line); background:linear-gradient(180deg, var(--x-panel), var(--x-panel-2)); min-width:0; transition:border-color .3s, box-shadow .3s, opacity .3s; }
  @S .fb-ic{ width:46px; height:46px; border-radius:12px; flex-shrink:0; display:grid; place-items:center; background:rgb(58 160 255 / .12); color:var(--x-a1); }
  @S .fb-ic svg{ width:26px; height:26px; }
  @S .fb-tn{ display:flex; flex-direction:column; gap:3px; min-width:0; }
  @S .fb-tn b{ color:#fff; font-size:22px; }
  @S .fb-tn small{ color:var(--x-dim); font-family:var(--x-mono); font-size:15px; overflow-wrap:anywhere; }
  @S .fb-tr.fb-on{ border-color:var(--x-a1); box-shadow:0 0 0 1px var(--x-a1), 0 0 30px rgb(58 160 255 / .25); }
  @S .fb-tr.fb-on .fb-ic{ background:var(--x-a1); color:#0e1420; }
  @S .fb-fn{ grid-area:fn; min-width:0; display:flex; flex-direction:column; transition:box-shadow .3s, border-color .3s; }
  @S .fb-fn.fb-awake{ border-color:var(--x-a1); box-shadow:0 0 0 2px var(--x-a1), 0 0 50px rgb(58 160 255 / .3); }
  @S .fb-file{ margin-left:12px; color:#bbb; font-family:var(--x-mono); font-size:18px; }
  @S .fb-zz{ margin-left:auto; font-size:16px; padding:4px 12px; border-radius:100px; background:rgb(255 255 255 / .08); color:var(--x-dim); }
  @S .fb-fn.fb-awake .fb-zz{ background:rgb(63 185 80 / .2); color:var(--x-ok); }
  @S .fb-fn .body{ font-size:19px; line-height:1.55; padding:18px 20px; flex:1; }
  @S .fb-l{ white-space:nowrap; border-radius:6px; padding:0 4px; transition:background .3s; }
  @S .fb-l.fb-hl{ background:rgb(58 160 255 / .16); }
  @S .fb-outs{ grid-area:out; display:flex; flex-direction:column; gap:12px; min-width:0; }
  @S .fb-bind.fb-in.fb-on{ border-color:var(--x-cyan); box-shadow:0 0 0 1px var(--x-cyan); }
  @S .fb-bind.fb-q.fb-on{ border-color:var(--x-ok); box-shadow:0 0 0 1px var(--x-ok); }
  @S .fb-qn{ color:var(--x-ok) !important; }
  @S .fb-resp{ align-self:flex-start; font-size:22px; }
  @S .fb-scale{ grid-area:sc; padding:16px 20px; border-radius:20px; border:1.5px solid var(--x-line); background:rgb(14 20 32 / .85); display:flex; flex-direction:column; gap:12px; }
  @S .fb-sh{ display:flex; align-items:baseline; gap:16px; }
  @S .fb-cnt{ font-size:34px; }
  @S .fb-ex{ margin-left:auto; color:var(--x-dim); font-size:17px; font-style:italic; }
  @S .fb-insts{ display:flex; gap:12px; min-height:64px; }
  @S .fb-inst{ width:64px; height:64px; border-radius:16px; display:grid; place-items:center; border:1.5px dashed var(--x-line); color:var(--x-line); transition:all .3s ease; }
  @S .fb-inst svg{ width:30px; height:30px; }
  @S .fb-inst.fb-up{ border:1.5px solid var(--x-a1); background:rgb(58 160 255 / .16); color:var(--x-a1); box-shadow:0 0 20px rgb(58 160 255 / .25); }
  @S .fb-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @L .fb{ gap:14px; }
  @L .fb-trigs{ gap:10px; }
  @L .fb-tlist{ gap:6px; }
  @L .fb-tr{ padding:8px 12px; }
  @L .fb-tr .fb-tn{ gap:1px; }
  @L .fb-scale{ padding:10px 18px; gap:18px; flex-direction:row; align-items:center; }
  @L .fb-sh{ flex-wrap:wrap; gap:0 14px; width:330px; flex-shrink:0; }
  @L .fb-sh .msd-label{ width:100%; font-size:19px; }
  @L .fb-ex{ margin-left:0; }
  @L .fb-cnt{ font-size:30px; }
  @L .fb-insts{ min-height:56px; }
  @L .fb-inst{ width:56px; height:56px; }
  @L .fb-insts{ gap:10px; }
  @P .fb{ grid-template-columns:1fr 1fr; grid-template-rows:auto 1fr auto; grid-template-areas:"fn fn" "tr out" "sc sc"; gap:16px; }
  @P .fb-fn .body{ font-size:21px; line-height:1.5; }
  @P .fb-tlist{ gap:8px; }
  @P .fb-tn small{ font-size:14px; }
  @P .fb-insts{ flex-wrap:wrap; }
  @P .fb-inst{ width:90px; height:72px; }
  `,
  stages: [
    {
      title: 'Nothing runs until a trigger fires',
      key: 'trigger',
      desc: 'A trigger is the event that starts a function: an HTTP call, a message, a timer, an event or a data change.',
      status: 'function app · 0 instances · idle',
      say: "A function sits idle until its trigger fires. That can be an HTTP request, a Service Bus message, a timer, an Event Grid event or a change in Cosmos DB.",
      run: (m) => {
        m.show('.fb-tlist > *', 160);
      },
    },
    {
      title: 'One trigger per function',
      key: 'One trigger',
      desc: 'In the Python v2 model, @app.route makes this an HTTP function. It gets exactly one trigger.',
      status: 'POST /api/summarise · @app.route',
      say: "Each function gets exactly one trigger. In the Python v2 model, the decorator says which. Here it's at app dot route, so an HTTP request wakes it up.",
      run: (m) => {
        m.focus('.fb-tr-http', '.fb-tr-sb, .fb-tr-tm, .fb-tr-eg, .fb-tr-cos');
        m.cls('.fb-tr-http', 'fb-on');
        m.show('.fb-l1', 0, true);
        m.cls('.fb-l1', 'fb-hl');
        m.after(500, () => m.particles('.fb-flow', { from: '.fb-tr-http', to: '.fb-fn', count: 6, duration: 800 }));
        m.after(1200, () => {
          m.cls('.fb-fn', 'fb-awake');
          m.text('.fb-zz', 'running');
          m.cls('.fb-i1', 'fb-up');
          m.text('.fb-cnt', '1');
          m.sfx.pop();
        });
      },
    },
    {
      title: 'An input binding reads data',
      key: 'input binding',
      desc: 'Add @app.blob_input and the file arrives as a parameter before your code runs. No Storage SDK calls.',
      status: 'input binding · blob → parameter',
      say: "Need a file too? Add an input binding, like blob input. The blob arrives as a parameter before your code starts, so you don't write any Storage client code.",
      run: (m) => {
        m.unfocus();
        m.cls('.fb-l1', 'fb-hl', false);
        m.show('.fb-in', 0);
        m.cls('.fb-in', 'fb-on');
        m.after(500, () => m.particles('.fb-flow', { from: '.fb-in', to: '.fb-fn', count: 5, duration: 800, color: '#22d3ee' }));
      },
    },
    {
      title: 'Output binding sends the message',
      key: 'Output binding',
      desc: 'service_bus_queue_output plus func.Out[str] and job.set(). The host sends it when the function ends.',
      status: 'output binding · summarise-jobs +1',
      say: "Now the output binding. Declare the queue in a decorator, take a func dot Out parameter, and call set. The Functions host drops the message on the queue for you. No Service Bus client code at all.",
      run: (m) => {
        m.show('.fb-l2, .fb-l3, .fb-l4', 200, true);
        m.cls('.fb-l2, .fb-l4', 'fb-hl');
        m.show('.fb-q', 0);
        m.after(1100, () => m.particles('.fb-flow', { from: '.fb-fn', to: '.fb-q', count: 5, duration: 800, color: '#3fb950' }));
        m.after(1900, () => {
          m.cls('.fb-q', 'fb-on');
          m.text('.fb-qn', '1 message');
          m.punch('.fb-q', 3);
        });
      },
    },
    {
      title: 'Reply 202 straight away',
      key: '202',
      desc: 'The slow model call happens later in a queue-triggered worker. The caller isn’t kept waiting.',
      status: 'HTTP 202 Accepted · 120 ms (example)',
      say: "Then it returns 202 Accepted right away. The slow model call happens later, in a worker that the queue triggers, so the caller isn't left waiting on an open connection.",
      run: (m) => {
        m.cls('.fb-l2, .fb-l4', 'fb-hl', false);
        m.show('.fb-l5', 0, true);
        m.cls('.fb-l5', 'fb-hl');
        m.after(600, () => { m.show('.fb-resp', 0, true); m.sfx.chime(); });
      },
    },
    {
      title: 'More work, more instances',
      key: 'more instances',
      desc: 'When requests pile up, the platform adds instances of the function app. You don’t manage servers.',
      status: 'scale out · 1 → 8 instances (example)',
      say: "When a rush of requests comes in, Azure adds more instances to keep up. In this example it goes from one to eight. You don't pick servers or set up a load balancer.",
      run: (m) => {
        m.cls('.fb-l5', 'fb-hl', false);
        m.stream('.fb-flow', { from: '.fb-tr-http', to: '.fb-fn', count: 4, duration: 700, gap: 500, silent: true });
        for (let i = 2; i <= 8; i++) m.after((i - 1) * 260, () => { m.cls(`.fb-i${i}`, 'fb-up'); m.text('.fb-cnt', String(i)); m.sfx.blip(i); });
        m.after(1900, () => m.text('.fb-qn', '8 messages'));
      },
    },
    {
      title: 'No work? Back to zero',
      key: 'zero',
      desc: 'On the Flex Consumption plan, idle apps scale in to zero instances unless you set always-ready ones.',
      status: 'scale in · 0 instances · idle',
      say: "And when it goes quiet, the Flex Consumption plan scales back in, all the way to zero instances, unless you've asked for some to stay ready. Like a corridor light, it's only on when someone walks in.",
      run: (m) => {
        m.qa('.fb-inst').forEach((_, i) => m.after(i * 160, () => m.cls(`.fb-i${8 - i}`, 'fb-up', false)));
        m.after(1300, () => {
          m.text('.fb-cnt', '0');
          m.cls('.fb-fn', 'fb-awake', false);
          m.cls('.fb-tr-http', 'fb-on', false);
          m.text('.fb-zz', 'idle');
          m.sfx.resolve();
        });
      },
    },
  ],
  end: {
    title: 'Trigger in, bindings out, scale on demand',
    sub: 'One trigger starts it, bindings move the data, and the platform adds or removes instances for you.',
  },
};

export default spec;
