import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const inst = (n: number, hidden: boolean) =>
  `<div class="sc-i i${n} ${hidden ? 'msd-pop' : ''}"><span>${I.server}</span><b>web-${n}</b><em class="sc-cpu">CPU <i>40%</i></em></div>`;

const spec: ExplainerSpec = {
  id: 'scalability',
  lesson: 'scalability',
  title: {
    main: 'Bigger server, or <em>more servers?</em>',
    sub: 'Scaling up versus scaling out, with one shop on its busiest day.',
  },
  summary: 'An animation of one overloaded web server being scaled up to a bigger size until it hits the largest size, then scaled out to several instances behind a load balancer, surviving an instance failure, and scaling back in when traffic drops so the bill drops too.',
  html: `
  <div class="sc">
    <div class="sc-top">
      <span class="msd-pill">${I.users}<span class="sc-users">2,000</span>&nbsp;shoppers</span>
      <span class="msd-pill ok sc-bill">${I.coin}<span class="sc-cost">₹18/hr</span></span>
    </div>
    <div class="sc-panes">
      <div class="sc-pane sc-up msd-card">
        <div class="msd-label">Vertical · scale up / down</div>
        <div class="sc-vm-wrap">
          <div class="sc-ceiling msd-reveal"><span>largest size available</span></div>
          <div class="sc-vm"><span>${I.server}</span><b class="sc-size">2 vCPU · 8 GB</b><em class="sc-load">CPU <i>95%</i></em></div>
        </div>
        <div class="sc-note msd-reveal msd-pill">${I.clock}Resize usually needs a restart</div>
      </div>
      <div class="sc-pane sc-out msd-card msd-reveal">
        <div class="msd-label">Horizontal · scale out / in</div>
        <div class="sc-lb msd-node"><span class="ic">${I.net}</span><span>Load balancer</span></div>
        <div class="sc-fleet">${inst(1, false)}${inst(2, true)}${inst(3, true)}${inst(4, true)}</div>
      </div>
    </div>
    <div class="sc-sum msd-stagger"><span class="msd-pill accent">Up / down = change the size</span><span class="msd-pill ok">Out / in = change the count</span></div>
    <div class="sc-flow"></div>
  </div>`,
  css: `
  @S .sc{ position:relative; height:100%; display:flex; flex-direction:column; gap:16px; }
  @S .sc-top{ display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
  @S .sc-panes{ flex:1; display:grid; grid-template-columns:1fr 1.3fr; gap:20px; min-height:0; }
  @S .sc-pane{ padding:20px; display:flex; flex-direction:column; gap:14px; min-height:0; }
  @S .sc-vm-wrap{ position:relative; flex:1; display:flex; align-items:flex-end; justify-content:center; padding-top:40px; }
  @S .sc-vm{ width:52%; height:34%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; border-radius:22px; border:2px solid var(--x-warn); background:rgb(240 166 74 / .1); color:var(--x-warn); transition:width .7s cubic-bezier(.22,1.2,.36,1), height .7s cubic-bezier(.22,1.2,.36,1), border-color .3s, background .3s, color .3s, opacity .2s; }
  @S .sc-vm span svg{ width:56px; height:56px; }
  @S .sc-vm b{ font-family:var(--x-mono); font-size:24px; color:#fff; }
  @S .sc-vm em, @S .sc-i em{ font-style:normal; font-family:var(--x-mono); font-size:20px; }
  @S .sc-vm em i, @S .sc-i em i{ font-style:normal; font-weight:800; }
  @S .sc.big .sc-vm{ width:80%; height:70%; border-color:var(--x-ok); background:rgb(63 185 80 / .1); color:var(--x-ok); }
  @S .sc.max .sc-vm{ width:96%; height:88%; border-color:var(--x-bad); background:rgb(244 74 106 / .1); color:var(--x-bad); }
  @S .sc.blink .sc-vm{ opacity:.2; }
  @S .sc-ceiling{ position:absolute; left:0; right:0; top:8%; border-top:3px dashed var(--x-bad); }
  @S .sc-ceiling span{ position:absolute; right:0; top:-34px; font-family:var(--x-mono); font-size:18px; color:var(--x-bad); }
  @S .sc-note{ align-self:flex-start; font-size:18px; }
  @S .sc-lb{ align-self:center; }
  @S .sc-fleet{ flex:1; display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
  @S .sc-i{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; border-radius:18px; border:1.5px solid var(--x-a1); background:rgb(58 160 255 / .1); color:var(--x-a1); transition:opacity .3s, transform .3s, border-color .3s; }
  @S .sc-i span svg{ width:44px; height:44px; }
  @S .sc-i b{ color:#fff; font-family:var(--x-mono); font-size:22px; }
  @S .sc-i.hot{ border-color:var(--x-warn); color:var(--x-warn); }
  @S .sc-i.down{ border-color:var(--x-bad); color:var(--x-bad); opacity:.4; }
  @S .sc-sum{ display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
  @S .sc-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .sc-panes{ grid-template-columns:1fr; grid-template-rows:1fr 1.2fr; }
  @P .sc-fleet{ grid-template-columns:repeat(4,1fr); }
  @P .sc-vm-wrap{ padding-top:30px; }
  `,
  stages: [
    {
      title: 'One server, too many shoppers',
      key: 'too many',
      desc: 'A sale starts. The single web server’s CPU climbs to 95% and pages slow down.',
      status: 'web-1 · CPU 95% · pages slow',
      say: "A sale starts, and your one web server's CPU climbs to ninety five percent. Pages slow down. You need more capacity.",
      run: (m) => {
        m.count('.sc-users', 9000, 1500);
        m.stream('.sc-flow', { from: { x: 50, y: 3 }, to: '.sc-vm', count: 6, duration: 800, gap: 450 });
        m.after(800, () => m.shake('.sc-vm'));
      },
    },
    {
      title: 'Scale up: a bigger server',
      key: 'Scale up',
      desc: 'Resize to more CPU and memory. Simple, no code changes, but usually a restart.',
      status: 'resize · 2 → 8 vCPU',
      say: 'The first option is to scale up. You resize the server to one with more CPU and memory. No code changes, but it usually means a quick restart.',
      run: (m) => {
        m.show('.sc-note', 0, true);
        m.cls('.sc', 'blink');
        m.after(600, () => {
          m.cls('.sc', 'blink', false);
          m.cls('.sc', 'big');
          m.text('.sc-size', '8 vCPU · 32 GB');
          m.text('.sc-load i', '45%');
          m.text('.sc-cost', '₹72/hr');
          m.sfx.lock();
        });
      },
    },
    {
      title: 'Up has a ceiling',
      key: 'ceiling',
      desc: 'Eventually you reach the largest size. One server is also one point of failure.',
      status: 'largest size reached · still 1 server',
      say: "But scaling up has a ceiling. Sooner or later you hit the biggest size there is, and it's still just one server that can fail.",
      run: (m) => {
        m.count('.sc-users', 40000, 1200);
        m.show('.sc-ceiling', 0, true);
        m.after(600, () => { m.cls('.sc', 'max'); m.text('.sc-size', 'largest size'); m.text('.sc-load i', '97%'); m.shake('.sc-vm'); });
      },
    },
    {
      title: 'Scale out: more servers',
      key: 'Scale out',
      desc: 'Add identical instances behind a load balancer. The work spreads across all of them.',
      status: 'instances 1 → 4 · CPU 40% each',
      say: 'The other option is to scale out. You add more identical servers behind a load balancer, and the work is shared between them. There is almost no ceiling.',
      run: (m) => {
        m.show('.sc-out', 0, true);
        m.focus('.sc-out', '.sc-up');
        m.after(400, () => m.show('.sc-i.i2, .sc-i.i3, .sc-i.i4', 260));
        m.after(1400, () => {
          m.stream('.sc-flow', { from: '.sc-lb', to: '.sc-i.i1', count: 3, duration: 700, gap: 600, silent: true });
          m.stream('.sc-flow', { from: '.sc-lb', to: '.sc-i.i4', count: 3, duration: 700, gap: 600 });
          m.text('.sc-cost', '₹72/hr');
        });
      },
    },
    {
      title: 'Lose one, keep serving',
      key: 'keep serving',
      desc: 'With several instances, one failing just shifts its share to the others.',
      status: 'web-3 · down · traffic rerouted',
      say: 'Scaling out also gives you redundancy. If one instance fails, the load balancer simply sends its share to the others.',
      run: (m) => {
        m.unfocus();
        m.cls('.sc-i.i3', 'down');
        m.shake('.sc-i.i3');
        m.after(500, () => { m.cls('.sc-i.i1, .sc-i.i2, .sc-i.i4', 'hot'); m.text('.sc-i:not(.i3) .sc-cpu i', '55%'); });
        m.after(1800, () => m.stream('.sc-flow', { from: '.sc-lb', to: '.sc-i.i2', count: 3, duration: 700, gap: 600 }));
      },
    },
    {
      title: 'Quiet again? Scale back',
      key: 'Scale back',
      desc: 'Remove instances (scale in) or shrink the size (scale down). The bill follows.',
      status: 'scale in · 4 → 1 · ₹18/hr',
      say: 'When the sale ends, you scale in or scale down, and because the cloud bills for what is running, your cost drops too.',
      run: (m) => {
        m.cls('.sc-i', 'hot', false);
        m.cls('.sc-i.i3', 'down', false);
        m.count('.sc-users', 2000, 1000);
        m.hide('.sc-i.i2, .sc-i.i3, .sc-i.i4');
        m.cls('.sc', 'max', false);
        m.cls('.sc', 'big', false);
        m.text('.sc-size', '2 vCPU · 8 GB');
        m.text('.sc-load i', '35%');
        m.text('.sc-i .sc-cpu i', '35%');
        m.hide('.sc-ceiling, .sc-note');
        m.sfx.whoosh(false);
        m.after(500, () => { m.text('.sc-cost', '₹18/hr'); m.punch('.sc-bill', 3); });
      },
    },
    {
      title: 'Size or count',
      key: 'Size or count',
      desc: 'Vertical changes the size of one resource. Horizontal changes how many there are.',
      status: 'exam tip · up/down vs out/in',
      say: 'Remember it this way. Scaling up or down changes the size. Scaling out or in changes the count.',
      run: (m) => {
        m.show('.sc-sum > *', 300);
        m.after(800, () => m.sfx.chime());
      },
    },
  ],
  end: {
    title: 'Up and down: size. Out and in: count.',
    sub: 'Scale up for a quick fix, scale out for big growth and resilience, and scale back to stop paying.',
  },
};

export default spec;
