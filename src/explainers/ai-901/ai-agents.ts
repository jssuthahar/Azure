import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const tool = (k: string, name: string, icon: string) => `<div class="ag-tool ${k}"><span>${icon}</span><b class="msd-mono">${name}</b></div>`;
const ring = ['Plan', 'Act', 'Observe', 'Answer'];

const spec: ExplainerSpec = {
  id: 'ai-agents',
  lesson: 'generative-and-agentic-ai',
  title: {
    main: 'A chatbot talks. <em>An agent gets it done.</em>',
    sub: 'Model, instructions and tools, and the plan, act, observe loop that turns a question into a finished task.',
  },
  summary: 'An animation comparing a plain generative AI reply that cannot check an order with an AI agent built from a model, instructions and tools. The agent plans, calls an order lookup tool, sees the delivery is late, checks the policy, rebooks the delivery and answers, then the idea extends to multi-agent systems and copilots.',
  html: `
  <div class="ag">
    <div class="ag-chat msd-card">
      <div class="ag-msg user"><span>${I.user}</span><p>Where's order #4821? If it's late, move delivery to Saturday.</p></div>
      <div class="ag-msg bot gen msd-reveal"><span>${I.chat}</span><p>I can't look up orders, but deliveries usually take 3–5 days.</p></div>
      <div class="ag-msg bot ans msd-reveal"><span>${I.sparkle}</span><p>Order #4821 was 2 days late, so I've moved delivery to Saturday, 10am–1pm. You'll get an SMS.</p></div>
    </div>
    <div class="ag-agent msd-card msd-reveal">
      <div class="ag-parts">
        <div class="ag-part p-model"><span>${I.brain}</span><b>Model</b><small>gpt-4.1-mini</small></div>
        <div class="ag-part p-ins"><span>${I.file}</span><b>Instructions</b><small>Contoso support · follow policy</small></div>
        <div class="ag-part p-tools"><span>${I.gear}</span><b>Tools</b><small>APIs · search · code</small></div>
      </div>
      <div class="ag-loop msd-reveal">${ring.map((r, i) => `<span class="lp l${i}">${r}</span>`).join('<i>→</i>')}</div>
      <div class="ag-tools">
        ${tool('t1', 'get_order(4821)', I.search)}${tool('t2', 'file_search: policy', I.file)}${tool('t3', 'reschedule(sat)', I.clock)}
      </div>
      <div class="ag-obs msd-mono"></div>
    </div>
    <div class="ag-multi msd-reveal">
      <div class="ag-orch msd-pill accent">${I.net}Orchestrator</div>
      <div class="ag-specs"><span class="msd-pill">Billing agent</span><span class="msd-pill">Shipping agent</span><span class="msd-pill">Returns agent</span></div>
      <span class="ag-tip msd-pill ok">Needs tools to finish a task? It's an agent.</span>
    </div>
    <div class="ag-flow"></div>
  </div>`,
  css: `
  @S .ag{ position:relative; height:100%; display:grid; grid-template-columns:1fr 1.15fr; gap:20px; }
  @S .ag-chat{ padding:20px; display:flex; flex-direction:column; gap:14px; }
  @S .ag-msg{ display:flex; gap:12px; align-items:flex-start; }
  @S .ag-msg > span{ width:46px; height:46px; flex-shrink:0; border-radius:13px; display:grid; place-items:center; background:rgb(180 140 255 / .16); color:var(--x-you); }
  @S .ag-msg > span svg{ width:26px; height:26px; }
  @S .ag-msg p{ margin:0; padding:14px 16px; border-radius:16px; font-size:23px; line-height:1.4; color:#fff; background:rgb(255 255 255 / .05); border:1.5px solid var(--x-line); }
  @S .ag-msg.bot > span{ background:rgb(58 160 255 / .14); color:var(--x-a1); }
  @S .ag-msg.gen p{ border-color:rgb(244 74 106 / .5); color:var(--x-text); }
  @S .ag-msg.ans p{ border-color:var(--x-ok); background:rgb(63 185 80 / .08); }
  @S .ag-msg.gen.faded{ opacity:.4; }
  @S .ag-agent{ padding:20px; display:flex; flex-direction:column; gap:14px; }
  @S .ag-parts{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  @S .ag-part{ display:flex; flex-direction:column; align-items:center; text-align:center; gap:6px; padding:14px 10px; border-radius:16px; border:1.5px solid var(--x-line); background:rgb(14 20 32 / .9); }
  @S .ag-part span{ width:50px; height:50px; border-radius:14px; display:grid; place-items:center; background:rgb(58 160 255 / .14); color:var(--x-a1); }
  @S .ag-part span svg{ width:30px; height:30px; }
  @S .ag-part b{ color:#fff; font-size:22px; } @S .ag-part small{ color:var(--x-dim); font-size:16px; }
  @S .ag-part.hot{ border-color:var(--x-a1); box-shadow:0 0 0 1px var(--x-a1), 0 0 34px rgb(58 160 255 / .25); }
  @S .ag-loop{ display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap; }
  @S .ag-loop .lp{ padding:8px 16px; border-radius:999px; font-weight:800; font-size:21px; color:var(--x-dim); border:1.5px solid var(--x-line); transition:all .25s; }
  @S .ag-loop .lp.on{ color:#0e1420; background:var(--x-cyan); border-color:var(--x-cyan); box-shadow:0 0 24px rgb(34 211 238 / .5); }
  @S .ag-loop i{ color:var(--x-dim); font-style:normal; }
  @S .ag-tools{ display:flex; flex-direction:column; gap:8px; }
  @S .ag-tool{ display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:14px; border:1.5px dashed var(--x-line); color:var(--x-dim); transition:all .3s; }
  @S .ag-tool span svg{ width:24px; height:24px; } @S .ag-tool b{ font-size:20px; }
  @S .ag-tool.run{ border-style:solid; border-color:var(--x-warn); color:var(--x-warn); background:rgb(240 166 74 / .08); }
  @S .ag-tool.done{ border-style:solid; border-color:rgb(63 185 80 / .6); color:var(--x-ok); }
  @S .ag-obs{ min-height:56px; font-size:20px; color:var(--x-cyan); padding:10px 14px; border-radius:12px; background:rgb(34 211 238 / .06); }
  @S .ag-obs:empty{ visibility:hidden; }
  @S .ag-multi{ position:absolute; inset:auto 0 0 0; z-index:7; display:flex; flex-direction:column; align-items:center; gap:12px; padding:20px; border-radius:22px; background:rgb(14 20 32 / .96); border:1.5px solid rgb(58 160 255 / .5); }
  @S .ag-specs{ display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }
  @S .ag-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .ag{ grid-template-columns:1fr; grid-template-rows:auto 1fr; gap:14px; }
  @P .ag-msg p{ font-size:21px; padding:10px 14px; }
  @P .ag-chat{ padding:14px; gap:10px; }
  `,
  stages: [
    {
      title: 'Generative AI alone',
      key: 'alone',
      desc: 'A model only knows its training data and your prompt. It can’t check a live order.',
      status: 'model only · no tools',
      say: "A customer asks where their order is, and to move the delivery if it's late. A model on its own only knows its training data and the prompt, so it can't check, and it can't change anything.",
      run: (m) => {
        m.show('.ag-msg.gen', 0);
        m.after(900, () => m.shake('.ag-msg.gen'));
      },
    },
    {
      title: 'An agent = model + instructions + tools',
      key: 'agent',
      desc: 'Instructions set the role and rules. Tools let it fetch data and take actions.',
      status: 'agent · model + instructions + tools',
      say: 'An agent wraps the model with two more things. Instructions set its role and rules, and tools let it fetch data and take actions in real systems.',
      run: (m) => {
        m.cls('.ag-msg.gen', 'faded');
        m.show('.ag-agent', 0, true);
        ['.p-model', '.p-ins', '.p-tools'].forEach((s, i) => m.after(300 + i * 450, () => { m.cls('.ag-part', 'hot', false); m.cls(s, 'hot'); m.sfx.blip(i + 2); }));
      },
    },
    {
      title: 'Plan the next step',
      key: 'Plan',
      desc: 'The model reads the goal and decides what to do first: look up the order.',
      status: 'plan · look up order 4821',
      thinking: true,
      say: 'Now the loop starts. First it plans. To answer, it needs the order status, so the first step is to look it up.',
      run: (m) => {
        m.cls('.ag-part', 'hot', false);
        m.show('.ag-loop', 0, true);
        m.cls('.lp.l0', 'on');
        m.cls('.p-model', 'hot');
        m.sfx.focus();
      },
    },
    {
      title: 'Act, then observe',
      key: 'Act',
      desc: 'It calls the order tool and reads the result: the parcel is two days late.',
      status: 'tool call · get_order → delayed 2 days',
      say: 'Then it acts. It calls the order lookup tool, and observes the result. The parcel is two days late.',
      run: (m) => {
        m.cls('.p-model', 'hot', false);
        m.cls('.lp', 'on', false);
        m.cls('.lp.l1', 'on');
        m.cls('.ag-tool.t1', 'run');
        m.after(300, () => m.particles('.ag-flow', { from: '.p-tools', to: '.ag-tool.t1', count: 5, duration: 600 }));
        m.after(1300, () => {
          m.cls('.lp', 'on', false); m.cls('.lp.l2', 'on');
          m.cls('.ag-tool.t1', 'run', false); m.cls('.ag-tool.t1', 'done');
          m.type('.ag-obs', '{"status":"in transit","delay_days":2}', 22);
        });
      },
    },
    {
      title: 'Loop again until it’s done',
      key: 'Loop again',
      desc: 'Late, so check the policy, then call the reschedule tool. Each result feeds the next plan.',
      status: 'policy ok · reschedule(sat) → confirmed',
      say: "It's late, so the agent loops again. It checks the delivery policy, then calls the reschedule tool for Saturday. Each result feeds the next decision.",
      run: (m) => {
        const step = (at: number, k: string, obs: string, i: number) => {
          m.after(at, () => { m.cls('.lp', 'on', false); m.cls('.lp.l1', 'on'); m.cls(`.ag-tool.${k}`, 'run'); m.sfx.data(i); });
          m.after(at + 1100, () => { m.cls('.lp', 'on', false); m.cls('.lp.l2', 'on'); m.cls(`.ag-tool.${k}`, 'run', false); m.cls(`.ag-tool.${k}`, 'done'); m.type('.ag-obs', obs, 20); });
        };
        m.cls('.lp', 'on', false); m.cls('.lp.l0', 'on');
        step(500, 't2', 'policy: late orders may be rescheduled free', 2);
        step(2900, 't3', '{"slot":"Sat 10:00-13:00","sms":true}', 4);
      },
    },
    {
      title: 'Then it answers',
      key: 'answers',
      desc: 'The goal is met, so it replies with what it did, not just what it knows.',
      status: 'answer · task complete',
      say: 'Now the goal is met, so it answers, telling the customer what it actually did, not just what it knows.',
      run: (m) => {
        m.cls('.lp', 'on', false);
        m.cls('.lp.l3', 'on');
        m.show('.ag-msg.ans', 0);
        m.after(500, () => m.sfx.chime());
      },
    },
    {
      title: 'Bigger jobs, more agents',
      key: 'more agents',
      desc: 'An orchestrator routes work to specialist agents. A copilot is an agent inside an app that helps a person.',
      status: 'multi-agent · orchestrator + specialists',
      say: 'For bigger jobs, an orchestrator can hand work to specialist agents for billing, shipping and returns. And a copilot is an agent built into an app to help a person. Exam tip: if it needs tools to finish a task, it is an agent.',
      run: (m) => {
        m.show('.ag-multi', 0);
        m.after(700, () => m.sfx.resolve());
      },
    },
  ],
  end: {
    title: 'Model + instructions + tools, in a loop',
    sub: 'Plan, act, observe, repeat, then answer. That loop is what makes it an agent.',
  },
};

export default spec;
