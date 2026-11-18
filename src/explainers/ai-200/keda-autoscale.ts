import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';
import type { XApi } from '../../lib/explainer/player';

/** Counts a number from one value to another (m.count only counts up from zero). */
const tween = (m: XApi, sel: string, from: number, to: number, ms = 900) => {
  if (m.instant) return m.text(sel, String(to));
  const steps = Math.max(1, Math.round(ms / 40));
  let i = 0;
  m.every(40, () => {
    if (i >= steps) return;
    i++;
    m.text(sel, String(Math.round(from + (to - from) * (1 - Math.pow(1 - i / steps, 3)))));
  });
};

// 16 dots stand in for the queue: g1 = a few jobs, g2 = the morning burst.
const msgs = Array.from({ length: 16 }, (_, i) => `<i class="kd-msg ${i < 3 ? 'g1' : 'g2'}"></i>`).join('');
// 20 replica slots = max replicas 20. r1–r3 cover "12 messages ÷ 5", the rest only the burst.
const reps = Array.from({ length: 20 }, (_, i) => `<i class="kd-r ${i === 0 ? 'r1' : i < 3 ? 'r3' : 'rx'}">${I.cpu}</i>`).join('');
// One cost bar per moment in the story.
const bars = ['night', '12 jobs', 'burst', 'draining', 'cooldown', 'idle']
  .map((t, i) => `<div class="kd-b b${i}"><i></i><span>${t}</span></div>`)
  .join('');

const spec: ExplainerSpec = {
  id: 'keda-autoscale',
  lesson: 'keda-scaling',
  title: {
    main: 'Queue fills, replicas follow. <em>Queue empty, back to zero.</em>',
    sub: 'How a KEDA Service Bus scale rule in Azure Container Apps turns queue length into replicas, and why the bill follows.',
  },
  summary: 'An animation of a summarisation worker in Azure Container Apps with an azure-servicebus KEDA scale rule (messageCount 5, min 0, max 20): the queue fills, replicas scale from 0 to 3 and then to the maximum of 20, the queue drains, the cooldown passes and replicas return to zero, with a cost chart that rises and falls with the replica count.',
  html: `
  <div class="kd">
    <div class="kd-top">
      <div class="kd-q msd-card">
        <div class="kd-h">${I.chat}<span>Service Bus queue</span></div>
        <div class="kd-qn msd-mono">summarise</div>
        <div class="kd-tube">${msgs}<b class="kd-more msd-mono">+484</b></div>
        <div class="kd-big"><b class="kd-qc msd-num">0</b><span>messages</span></div>
      </div>
      <div class="kd-rule msd-card msd-reveal">
        <div class="kd-h">${I.bolt}<span>KEDA scale rule</span></div>
        <div class="kd-yaml msd-mono">
          <div>type: <b>azure-servicebus</b></div>
          <div>queueName: <b>summarise</b></div>
          <div class="kd-mc">messageCount: <b>5</b></div>
          <div class="kd-mm">min: <b>0</b> · max: <b>20</b></div>
        </div>
        <div class="kd-poll msd-chip">${I.clock}checks every 30 s</div>
        <div class="kd-math msd-mono"></div>
      </div>
      <div class="kd-reps msd-card">
        <div class="kd-h">${I.server}<span>Replicas</span><b class="kd-rc msd-num">0</b></div>
        <div class="kd-grid">${reps}</div>
        <div class="kd-cool msd-pill msd-pop">${I.clock}cooldown <b class="kd-cd">300</b> s</div>
      </div>
    </div>
    <div class="kd-cost msd-card">
      <div class="kd-ch"><span class="msd-label">What you pay for (Consumption)</span><span class="kd-cnote">vCPU and memory seconds while replicas run</span></div>
      <div class="kd-bars">${bars}</div>
    </div>
    <div class="kd-flow"></div>
  </div>`,
  css: `
  @S .kd{ position:relative; height:100%; display:flex; flex-direction:column; gap:18px; }
  @S .kd-top{ flex:1; display:grid; grid-template-columns:0.9fr 1fr 1.2fr; gap:18px; min-height:0; }
  @S .kd-h{ display:flex; align-items:center; gap:10px; color:#fff; font-size:24px; font-weight:800; }
  @S .kd-h svg{ width:28px; height:28px; color:var(--x-a1); }
  @S .kd-q, @S .kd-rule, @S .kd-reps{ padding:18px 20px; display:flex; flex-direction:column; gap:14px; min-height:0; }
  @S .kd-qn{ color:var(--x-dim); font-size:20px; }
  @S .kd-tube{ position:relative; flex:1; display:grid; grid-template-columns:repeat(4,1fr); grid-auto-rows:min-content; align-content:end; gap:10px; padding:14px; border-radius:18px; border:2px solid var(--x-line); background:rgb(255 255 255 / .03); transition:border-color .3s; }
  @S .kd-msg{ display:block; aspect-ratio:1.6; border-radius:8px; background:var(--x-warn); opacity:0; transform:scale(.6); transition:opacity .3s, transform .3s; }
  @S .kd-msg.on{ opacity:1; transform:none; }
  @S .kd-more{ position:absolute; top:10px; right:12px; font-size:20px; color:var(--x-warn); opacity:0; transition:opacity .3s; }
  @S .kd.full .kd-more{ opacity:1; }
  @S .kd.full .kd-tube{ border-color:var(--x-warn); }
  @S .kd-big{ display:flex; align-items:baseline; gap:10px; }
  @S .kd-big b{ font-size:52px; }
  @S .kd-big span{ color:var(--x-dim); font-size:20px; }
  @S .kd-yaml{ display:flex; flex-direction:column; gap:6px; font-size:21px; color:var(--x-dim); padding:12px 14px; border-radius:14px; background:#0b0f18; }
  @S .kd-yaml b{ color:#fff; font-weight:600; }
  @S .kd-yaml > div{ padding:2px 6px; margin:0 -6px; border-radius:6px; transition:background .3s; }
  @S .kd-yaml > div.on{ background:rgb(58 160 255 / .22); }
  @S .kd-poll{ align-self:flex-start; font-size:18px; }
  @S .kd-math{ min-height:64px; font-size:22px; color:var(--x-cyan); line-height:1.4; }
  @S .kd-rc{ margin-left:auto; font-size:44px; }
  @S .kd-grid{ flex:1; display:grid; grid-template-columns:repeat(5,1fr); grid-auto-rows:1fr; gap:10px; min-height:0; }
  @S .kd-r{ display:grid; place-items:center; border-radius:12px; border:1.5px dashed var(--x-line); color:var(--x-line); transition:background .35s, border-color .35s, color .35s; }
  @S .kd-r svg{ width:30px; height:30px; }
  @S .kd-r.on{ border-style:solid; border-color:var(--x-ok); background:rgb(63 185 80 / .14); color:var(--x-ok); }
  @S .kd-cool{ align-self:center; font-size:19px; }
  @S .kd-cost{ padding:16px 20px; display:flex; flex-direction:column; gap:10px; }
  @S .kd-ch{ display:flex; align-items:baseline; gap:14px; flex-wrap:wrap; }
  @S .kd-cnote{ color:var(--x-dim); font-size:19px; }
  @S .kd-bars{ height:120px; display:grid; grid-template-columns:repeat(6,1fr); gap:14px; align-items:end; }
  @S .kd-b{ height:100%; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; gap:6px; }
  @S .kd-b i{ display:block; width:70%; height:4px; border-radius:6px 6px 2px 2px; background:var(--x-line); transition:height .6s cubic-bezier(.22,1,.36,1), background .3s; }
  @S .kd-b span{ font-size:17px; color:var(--x-dim); font-family:var(--x-mono); white-space:nowrap; opacity:.35; transition:opacity .3s; }
  @S .kd-b.on span{ opacity:1; }
  @S .kd-b.on i{ background:linear-gradient(180deg, var(--x-a1), var(--x-a2)); }
  @S .kd-b.h3 i{ height:18%; } @S .kd-b.h20 i{ height:84%; } @S .kd-b.h8 i{ height:40%; } @S .kd-b.h1 i{ height:9%; }
  @S .kd-cost.msd-focus{ transform:none; border-color:rgb(58 160 255 / .7); box-shadow:0 0 0 1px rgb(58 160 255 / .4), 0 18px 60px rgb(58 160 255 / .2); }
  @S .kd-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .kd-top{ grid-template-columns:1fr 1fr; grid-template-rows:auto 1fr; }
  @P .kd-reps{ grid-column:1 / -1; }
  @P .kd-tube{ min-height:180px; }
  @P .kd-grid{ grid-template-columns:repeat(10,1fr); }
  @P .kd-r svg{ width:26px; height:26px; }
  @P .kd-bars{ height:110px; gap:8px; }
  @P .kd-b span{ font-size:15px; }
  `,
  stages: [
    {
      title: 'Night: nothing to do',
      key: 'nothing',
      desc: 'The summarisation worker sits at zero replicas. Nothing runs, so nothing is billed.',
      status: 'queue 0 · replicas 0 · min 0',
      say: "Here's a summarisation worker in Container Apps. It's night, the queue is empty, and the app is at zero replicas. Nothing's running, so there's nothing to pay for.",
      run: (m) => {
        m.cls('.kd-b.b0', 'on');
        m.punch('.kd-rc', 1);
      },
    },
    {
      title: 'A KEDA rule watches the queue',
      key: 'KEDA rule',
      desc: 'An azure-servicebus scale rule: aim for one replica per 5 messages, never more than 20.',
      status: 'scale rule · azure-servicebus · messageCount 5',
      say: "A KEDA scale rule watches the Service Bus queue for you. This one says: about one replica for every five messages waiting, between zero and twenty replicas. KEDA checks the queue every thirty seconds.",
      run: (m) => {
        m.show('.kd-rule', 0, true);
        m.after(700, () => { m.cls('.kd-mc', 'on'); m.sfx.focus(); });
        m.after(1700, () => { m.cls('.kd-mc', 'on', false); m.cls('.kd-mm', 'on'); m.sfx.focus(); });
        m.after(2700, () => { m.cls('.kd-mm', 'on', false); m.punch('.kd-poll', 3); });
      },
    },
    {
      title: '12 jobs arrive, 3 replicas start',
      key: '3 replicas',
      desc: '12 messages ÷ 5 per replica rounds up to 3. Example numbers from the lesson.',
      status: 'queue 12 · target 3 replicas',
      say: "Twelve documents land in the queue. Twelve divided by five, rounded up, is three. So KEDA brings the app up from zero to three replicas.",
      run: (m) => {
        m.cls('.kd-msg.g1', 'on');
        m.count('.kd-qc', 12, 700);
        m.after(800, () => m.type('.kd-math', '12 ÷ 5 → 3 replicas', 30));
        m.after(1700, () => {
          m.cls('.kd-r.r1, .kd-r.r3', 'on');
          m.count('.kd-rc', 3, 500);
          m.cls('.kd-b.b1', 'on'); m.cls('.kd-b.b1', 'h3');
          m.sfx.sparkle();
        });
        m.after(2100, () => m.particles('.kd-flow', { from: '.kd-tube', to: '.kd-grid', count: 4, duration: 800 }));
      },
    },
    {
      title: 'Morning burst: up to the max',
      key: 'max',
      desc: '500 messages would ask for 100 replicas. Max replicas caps it at 20.',
      status: 'queue 500 · replicas 20 (max)',
      say: "Then the morning burst. Five hundred jobs. That would ask for a hundred replicas, but max replicas is twenty, so it stops at twenty. Max is your ceiling, for cost and for whatever the worker calls downstream.",
      run: (m) => {
        m.cls('.kd-msg', 'on');
        m.cls('.kd', 'full');
        tween(m, '.kd-qc', 12, 500, 900);
        m.after(700, () => m.type('.kd-math', '500 ÷ 5 = 100 → capped at 20', 26));
        m.after(1600, () => {
          m.qa('.kd-r.rx').forEach((r, i) => m.after(i * 50, () => r.classList.add('on')));
          tween(m, '.kd-rc', 3, 20, 900);
          m.cls('.kd-b.b2', 'on'); m.cls('.kd-b.b2', 'h20');
          m.sfx.riser(900);
        });
        m.after(1900, () => m.stream('.kd-flow', { from: '.kd-tube', to: '.kd-grid', count: 6, duration: 800, gap: 500 }));
      },
    },
    {
      title: 'The queue drains',
      key: 'drains',
      desc: 'Replicas complete messages and the queue shrinks. As it shrinks, KEDA asks for fewer replicas.',
      status: 'queue 500 → 0 · replicas 20 → 1',
      say: "Twenty workers chew through the queue. As it shrinks, KEDA asks for fewer replicas. Your code should only complete a message after the work is done, so a replica that's removed mid-job doesn't lose anything.",
      run: (m) => {
        m.text('.kd-math', '');
        tween(m, '.kd-qc', 500, 0, 1800);
        m.after(600, () => m.cls('.kd', 'full', false));
        m.qa('.kd-msg').reverse().forEach((d, i) => m.after(200 + i * 100, () => d.classList.remove('on')));
        m.after(1500, () => {
          m.qa('.kd-r.rx, .kd-r.r3').reverse().forEach((r, i) => m.after(i * 50, () => r.classList.remove('on')));
          tween(m, '.kd-rc', 20, 1, 900);
          m.cls('.kd-b.b3', 'on'); m.cls('.kd-b.b3', 'h8');
        });
        m.after(2600, () => m.type('.kd-math', 'queue empty → wait for cooldown', 26));
      },
    },
    {
      title: 'Cooldown, then zero',
      key: 'zero',
      desc: 'After the queue has been empty for the cooldown period (300 seconds), the last replica goes too.',
      status: 'cooldown 300 s · replicas 1 → 0',
      say: "Once the queue's empty, KEDA waits for the cooldown period, three hundred seconds by default. Nothing new arrives, so the last replica goes away and the app is back at zero.",
      run: (m) => {
        m.show('.kd-cool', 0, true);
        m.cls('.kd-b.b4', 'on'); m.cls('.kd-b.b4', 'h1');
        tween(m, '.kd-cd', 300, 0, 2200);
        m.after(2400, () => {
          m.cls('.kd-r', 'on', false);
          m.text('.kd-rc', '0');
          m.hide('.kd-cool');
          m.text('.kd-math', 'back to 0 replicas');
          m.cls('.kd-b.b5', 'on');
          m.sfx.whoosh(false);
        });
      },
    },
    {
      title: 'Cost follows replicas',
      key: 'Cost',
      desc: 'You pay only for the busy stretch. CPU and memory rules can’t scale to zero; event rules can.',
      status: 'bill ∝ replica time · min 0 = idle is free',
      say: "Look at the bill. It rises and falls with the replica count, and it's flat at zero overnight. One exam detail: CPU and memory rules can't scale to zero. You need min replicas zero and an event rule like this one.",
      run: (m) => {
        m.focus('.kd-cost', '.kd-top');
        m.after(400, () => m.punch('.kd-b.b2', 4));
        m.after(1200, () => m.sfx.chime());
      },
    },
  ],
  end: {
    title: 'Replicas follow the queue',
    sub: 'messageCount sets the work per replica, max replicas sets the ceiling, and min replicas 0 lets the app cost nothing when idle.',
  },
};

export default spec;
