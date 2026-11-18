import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const srv = (n: number, extra = '') => `<div class="cc-srv s${n} ${extra}"><span>${I.server}</span></div>`;

const spec: ExplainerSpec = {
  id: 'cloud-computing',
  lesson: 'what-is-cloud-computing',
  title: {
    main: 'Stop buying servers. <em>Rent them by the minute.</em>',
    sub: 'What cloud computing really changes, shown with one app launch.',
  },
  summary: 'An animation comparing buying your own servers with renting them from Azure: up-front cost and weeks of waiting versus minutes to start, pay-as-you-go billing, and scaling up and down with demand.',
  html: `
  <div class="cc">
    <div class="cc-head"><span class="msd-pill accent">${I.app}<span>New app · launching Friday</span></span>
      <span class="msd-pill cc-traffic msd-reveal">${I.users}<span class="cc-users">1,000</span>&nbsp;visitors</span></div>
    <div class="cc-cols">
      <div class="cc-col cc-own msd-card msd-reveal">
        <div class="cc-ct">${I.building}<b>Your own server room</b></div>
        <ul class="cc-steps">
          <li class="msd-reveal">${I.coin}<span>Pay <b>₹18 lakh</b> up front</span></li>
          <li class="msd-reveal">${I.clock}<span>Wait <b class="cc-weeks">0</b> weeks for delivery</span></li>
          <li class="msd-reveal">${I.plug}<span>Rack, cable, power, cool</span></li>
        </ul>
        <div class="cc-rack">${srv(1)}${srv(2)}</div>
        <div class="cc-warn msd-pill bad msd-reveal">${I.warn}<span>Overloaded · site slow</span></div>
      </div>
      <div class="cc-col cc-cloud msd-card msd-reveal">
        <div class="cc-ct">${I.cloud}<b>Azure cloud</b></div>
        <div class="cc-click msd-reveal"><span class="msd-chip">Create virtual machine</span><span class="cc-ready msd-pill ok">${I.check}<span>Ready in 3 min</span></span></div>
        <div class="cc-rack cc-fleet">${srv(1, 'msd-pop')}${srv(2, 'msd-pop')}${srv(3, 'msd-pop')}${srv(4, 'msd-pop')}</div>
        <div class="cc-meter msd-reveal">${I.meter}<span>Meter</span><b class="cc-rate">₹0/hr</b><span class="cc-note">pay only while it runs</span></div>
      </div>
    </div>
    <div class="cc-sum msd-stagger">
      <span class="msd-pill accent">On demand</span><span class="msd-pill accent">Pay as you go</span><span class="msd-pill accent">Scale up or down</span><span class="msd-pill accent">Over the internet</span>
    </div>
    <div class="cc-flow"></div>
  </div>`,
  css: `
  @S .cc{ position:relative; height:100%; display:flex; flex-direction:column; gap:22px; }
  @S .cc-head{ display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
  @S .msd-pill svg{ width:26px; height:26px; }
  @S .cc-cols{ flex:1; display:grid; grid-template-columns:1fr 1fr; gap:26px; min-height:0; }
  @S .cc-col{ padding:26px; display:flex; flex-direction:column; gap:20px; }
  @S .cc-ct{ display:flex; align-items:center; gap:14px; color:#fff; font-size:32px; }
  @S .cc-ct svg{ width:44px; height:44px; color:var(--x-a1); }
  @S .cc-own .cc-ct svg{ color:var(--x-warn); }
  @S .cc-steps{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:12px; }
  @S .cc-steps li{ display:flex; align-items:center; gap:12px; font-size:25px; color:var(--x-text); padding:12px 16px; border-radius:14px; background:rgb(255 255 255 / .04); }
  @S .cc-steps svg{ width:28px; height:28px; color:var(--x-warn); flex-shrink:0; }
  @S .cc-steps b{ color:var(--x-warn); }
  @S .cc-rack{ display:flex; gap:14px; flex-wrap:wrap; }
  @S .cc-srv{ width:96px; height:96px; border-radius:20px; display:grid; place-items:center; background:rgb(58 160 255 / .12); border:1.5px solid rgb(58 160 255 / .4); color:var(--x-a1); transition:opacity .3s, transform .3s, border-color .3s; }
  @S .cc-own .cc-srv{ background:rgb(240 166 74 / .1); border-color:rgb(240 166 74 / .4); color:var(--x-warn); }
  @S .cc-srv svg{ width:52px; height:52px; }
  @S .cc-srv.hot{ border-color:var(--x-bad); color:var(--x-bad); background:rgb(244 74 106 / .12); }
  @S .cc-click{ display:flex; gap:14px; align-items:center; flex-wrap:wrap; }
  @S .cc-meter{ margin-top:auto; display:flex; align-items:center; gap:12px; padding:16px 20px; border-radius:16px; background:rgb(63 185 80 / .08); border:1.5px solid rgb(63 185 80 / .35); font-size:24px; color:var(--x-dim); flex-wrap:wrap; }
  @S .cc-meter svg{ width:32px; height:32px; color:var(--x-ok); }
  @S .cc-rate{ font-family:var(--x-mono); color:var(--x-ok); font-size:34px; }
  @S .cc-note{ width:100%; font-size:20px; }
  @S .cc-warn{ margin-top:auto; align-self:flex-start; }
  @S .cc-sum{ display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
  @S .cc-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .cc-cols{ grid-template-columns:1fr; gap:20px; }
  @P .cc-col{ padding:22px; gap:14px; }
  @P .cc-steps li{ font-size:23px; padding:9px 14px; }
  @P .cc-srv{ width:84px; height:84px; }
  @P .cc-srv svg{ width:44px; height:44px; }
  @P .cc-meter{ margin-top:0; }
  `,
  stages: [
    {
      title: 'Your app needs servers',
      key: 'servers',
      desc: 'A new app launches on Friday. There are two ways to get the computers it runs on.',
      status: 'launch in 4 days · 0 servers',
      say: 'Your team is launching a new app on Friday. It needs servers, and there are two ways to get them.',
      run: (m) => {
        m.show('.cc-own, .cc-cloud', 200);
      },
    },
    {
      title: 'The old way: buy them',
      key: 'buy them',
      desc: 'Pay up front, wait weeks, then rack, cable and power them yourself.',
      status: 'purchase order · waiting for delivery',
      thinking: true,
      say: 'The old way is to buy them. You pay up front, wait weeks for delivery, then rack, cable and power everything yourself.',
      run: (m) => {
        m.focus('.cc-own', '.cc-cloud');
        m.show('.cc-steps li', 450);
        m.after(500, () => m.count('.cc-weeks', 6, 1600));
      },
    },
    {
      title: 'The cloud way: rent them',
      key: 'rent them',
      desc: 'Ask Azure for a server and it is running in minutes, in Microsoft’s datacenter.',
      status: 'vm-web-01 · running',
      say: "The cloud way is to rent them. You ask Azure for a server, and a few minutes later it's running in Microsoft's datacenter.",
      run: (m) => {
        m.focus('.cc-cloud', '.cc-own');
        m.show('.cc-click', 0);
        m.after(900, () => { m.show('.cc-fleet .s1', 0, true); m.sfx.lock(); });
      },
    },
    {
      title: 'Pay only while it runs',
      key: 'while it runs',
      desc: 'Billing works like an electricity meter: per second or per hour, no big bill first.',
      status: 'meter · ₹9 per hour',
      say: 'You pay for what you use, by the second or the hour, like an electricity meter. No big bill before you start.',
      run: (m) => {
        m.unfocus();
        m.show('.cc-meter', 0);
        m.after(300, () => m.count('.cc-rate', 9, 1200, { prefix: '₹', suffix: '/hr' }));
      },
    },
    {
      title: 'Launch day: 10× the visitors',
      key: '10×',
      desc: 'The cloud adds servers in minutes. Your own room is stuck with what you bought.',
      status: 'traffic 10,000 · cloud scaled to 4',
      say: 'Launch day brings ten times the visitors. In the cloud you add servers in minutes. Your own room is stuck with what you bought.',
      run: (m) => {
        m.show('.cc-traffic', 0, true);
        m.count('.cc-users', 10000, 1400);
        m.stream('.cc-flow', { from: { x: 50, y: 4 }, to: { x: 26, y: 60 }, count: 6, duration: 900, gap: 500, color: '#f0a64a', silent: true });
        m.stream('.cc-flow', { from: { x: 50, y: 4 }, to: { x: 74, y: 60 }, count: 6, duration: 900, gap: 500 });
        m.after(600, () => { m.cls('.cc-own .cc-srv', 'hot'); m.shake('.cc-own .cc-rack'); m.show('.cc-warn', 0, true); });
        m.after(900, () => m.show('.cc-fleet .s2, .cc-fleet .s3, .cc-fleet .s4', 220));
        m.after(1700, () => m.count('.cc-rate', 36, 900, { prefix: '₹', suffix: '/hr' }));
      },
    },
    {
      title: 'Quiet night? Give them back',
      key: 'Give them back',
      desc: 'Remove the extra servers when traffic drops and stop paying for them.',
      status: 'traffic 800 · cloud scaled to 1',
      say: 'When traffic drops at night, you hand the extra servers back and stop paying for them.',
      run: (m) => {
        m.count('.cc-users', 800, 1000);
        m.hide('.cc-warn');
        m.cls('.cc-own .cc-srv', 'hot', false);
        m.hide('.cc-fleet .s2, .cc-fleet .s3, .cc-fleet .s4');
        m.sfx.whoosh(false);
        m.after(400, () => m.count('.cc-rate', 9, 900, { prefix: '₹', suffix: '/hr' }));
      },
    },
    {
      title: 'That’s cloud computing',
      key: 'cloud computing',
      desc: 'Compute, storage and networking delivered over the internet, on demand, paid as you go.',
      status: 'summary · rent, don’t own',
      say: "That's cloud computing. Computing power, storage and networking delivered over the internet, on demand, and paid for as you go.",
      run: (m) => {
        m.show('.cc-sum > *', 220);
        m.after(900, () => m.sfx.sparkle());
      },
    },
  ],
  end: {
    title: 'Rent what you need, when you need it',
    sub: 'No up-front hardware, minutes instead of weeks, and a bill that follows your real usage.',
  },
};

export default spec;
