import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const zone = (n: number, first: boolean) => `
  <div class="az-zone z${n} ${first ? '' : 'msd-reveal'}">
    <div class="az-zh"><span class="az-ic">${I.building}</span><b>Zone ${n}</b></div>
    <div class="az-vm msd-node ${first ? '' : 'msd-reveal'}"><span class="ic">${I.server}</span><span>App copy</span></div>
    <div class="az-utils"><span>${I.bolt}Power</span><span>${I.snow}Cooling</span><span>${I.wifi}Network</span></div>
    <div class="az-off">${I.x}<span>Offline</span></div>
  </div>`;

const spec: ExplainerSpec = {
  id: 'availability-zones',
  lesson: 'availability-zones',
  title: {
    main: 'One building fails. <em>Your app keeps running.</em>',
    sub: 'How availability zones spread one app across separate datacenters in the same Azure region.',
  },
  summary: 'An animation of an app in one datacenter failing, then the same app spread across three availability zones behind a zone-redundant load balancer, surviving a zone outage.',
  html: `
  <div class="az">
    <div class="az-row">
      <span class="msd-pill az-users">${I.users}<span>12,400 shoppers</span></span>
      <span class="msd-pill az-served msd-reveal">Orders served <b class="az-pct">100%</b></span>
    </div>
    <div class="az-lb msd-node msd-pop"><span class="ic">${I.net}</span><span>Zone-redundant load balancer</span></div>
    <div class="az-region msd-card">
      <div class="msd-label az-rl">${I.pin}<span>Azure region · Central India</span><span class="msd-chip az-ms msd-reveal">private fibre · &lt; 2 ms</span></div>
      <div class="az-zones">
        <div class="az-fibre msd-reveal"><svg preserveAspectRatio="none" viewBox="0 0 100 4"><line class="msd-flow" x1="0" y1="2" x2="100" y2="2"/></svg></div>
        ${zone(1, true)}${zone(2, false)}${zone(3, false)}
      </div>
    </div>
    <div class="az-rule msd-stagger">
      <span class="msd-pill ok">${I.building}Zone = survives a datacenter failure</span>
      <span class="msd-pill accent">${I.globe}Region pair = survives a region failure</span>
    </div>
    <div class="az-flow"></div>
  </div>`,
  css: `
  @S .az{ position:relative; height:100%; display:flex; flex-direction:column; gap:22px; }
  @S .az-row{ display:flex; gap:16px; justify-content:center; flex-wrap:wrap; }
  @S .az-users svg, @S .msd-pill svg{ width:26px; height:26px; }
  @S .az-pct{ color:var(--x-ok); margin-left:6px; }
  @S .az-lb{ align-self:center; }
  @S .az-region{ flex:1; padding:24px 26px 26px; display:flex; flex-direction:column; gap:18px; border-style:dashed; border-color:rgb(58 160 255 / .45); }
  @S .az-rl{ display:flex; align-items:center; gap:10px; }
  @S .az-rl svg{ width:24px; height:24px; color:var(--x-a1); }
  @S .az-zones{ position:relative; flex:1; display:grid; grid-template-columns:repeat(3,1fr); gap:46px; }
  @S .az-fibre{ position:absolute; left:8%; right:8%; top:50%; height:4px; z-index:0; }
  @S .az-fibre svg{ width:100%; height:4px; overflow:visible; }
  @S .az-fibre line{ stroke:var(--x-cyan); stroke-width:4; vector-effect:non-scaling-stroke; }
  @S .az-ms{ margin-left:auto; text-transform:none; letter-spacing:0; }
  @S .az-zone{ position:relative; z-index:1; display:flex; flex-direction:column; gap:16px; padding:20px; border-radius:22px; background:rgb(14 20 32 / .92); border:1.5px solid var(--x-line); transition:opacity .3s, transform .3s, border-color .3s, filter .3s; }
  @S .az-zh{ display:flex; align-items:center; gap:12px; color:#fff; font-size:28px; }
  @S .az-ic{ width:48px; height:48px; border-radius:14px; display:grid; place-items:center; background:rgb(58 160 255 / .12); color:var(--x-a1); }
  @S .az-ic svg{ width:30px; height:30px; }
  @S .az-vm{ font-size:24px; padding:16px 18px; }
  @S .az-utils{ display:flex; flex-wrap:wrap; gap:8px; margin-top:auto; }
  @S .az-utils span{ display:inline-flex; align-items:center; gap:6px; font-size:18px; color:var(--x-dim); font-weight:600; padding:6px 10px; border-radius:10px; background:rgb(255 255 255 / .04); }
  @S .az-utils svg{ width:18px; height:18px; color:var(--x-warn); }
  @S .az-off{ position:absolute; inset:0; display:none; flex-direction:column; align-items:center; justify-content:center; gap:10px; border-radius:22px; background:rgb(40 8 16 / .78); color:var(--x-bad); font-size:30px; font-weight:800; letter-spacing:2px; text-transform:uppercase; }
  @S .az-off svg{ width:70px; height:70px; }
  @S .az-zone.down{ border-color:var(--x-bad); }
  @S .az-zone.down .az-off{ display:flex; }
  @S .az-zone.live{ border-color:var(--x-ok); box-shadow:0 0 0 1px var(--x-ok), 0 0 40px rgb(63 185 80 / .2); }
  @S .az-rule{ display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
  @S .az-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .az-zones{ gap:26px; }
  @P .az-zone{ padding:16px; }
  @P .az-zh{ font-size:25px; }
  @P .az-utils span{ font-size:16px; }
  @P .az-vm span:last-child{ font-size:21px; }
  @P .az-rule{ flex-direction:column; align-items:center; }
  `,
  stages: [
    {
      title: 'One building, one app',
      key: 'one app',
      desc: 'Every login and every checkout lands in the same datacenter.',
      status: 'zone 1 · serving all traffic',
      say: "Picture your shop's app running in one datacenter. Every login and every checkout lands in that single building.",
      run: (m) => {
        m.cls('.z1', 'live');
        m.stream('.az-flow', { from: { x: 50, y: 4 }, to: { x: 18, y: 62 }, count: 6, duration: 1100, gap: 700 });
      },
    },
    {
      title: 'The building loses power',
      key: 'loses power',
      desc: 'One fault takes out every server inside it. Nobody can buy anything.',
      status: 'zone 1 · OFFLINE · 0 orders',
      say: 'Then the building loses power. Every server inside goes dark at once, and nobody can buy anything.',
      run: (m) => {
        m.cls('.z1', 'live', false);
        m.cls('.z1', 'down');
        m.shake('.z1');
        m.sfx.thud();
        m.show('.az-served', 0, true);
        m.count('.az-pct', 0, 900, { suffix: '%' });
        m.cls('.az-pct', 'bad');
        m.q('.az-pct')!.style.color = 'var(--x-bad)';
      },
    },
    {
      title: 'A region has three zones',
      key: 'three zones',
      desc: 'Separate buildings, each with its own power, cooling and network.',
      status: 'region · 3 availability zones',
      say: 'An Azure region with zones has at least three of these buildings. Each one has its own power, cooling and network.',
      run: (m) => {
        m.cls('.z1', 'down', false);
        m.hide('.az-served');
        m.show('.z2, .z3', 260);
        m.after(700, () => m.focus('.az-utils', '.az-zh'));
        m.after(2600, () => m.unfocus());
      },
    },
    {
      title: 'Joined by private fibre',
      key: 'private fibre',
      desc: 'Close enough to copy data in about 2 ms, far enough apart to fail alone.',
      status: 'replication latency · < 2 ms',
      say: "They're a few kilometres apart and joined by private fibre, so copying data between them takes about two milliseconds.",
      run: (m) => {
        m.show('.az-fibre, .az-ms', 0);
        m.sfx.lock();
        m.stream('.az-zones', { from: { x: 10, y: 50 }, to: { x: 90, y: 50 }, count: 5, duration: 900, gap: 800, silent: true });
      },
    },
    {
      title: 'Run a copy in every zone',
      key: 'every zone',
      desc: 'A zone-redundant load balancer spreads requests across all three.',
      status: 'traffic split · 3 zones healthy',
      say: 'So you run a copy of the app in every zone, with a zone-redundant load balancer in front.',
      run: (m) => {
        m.show('.az-lb', 0);
        m.show('.z2 .az-vm, .z3 .az-vm', 200);
        m.after(500, () => m.cls('.az-zone', 'live'));
        m.after(600, () => {
          m.stream('.az-flow', { from: { x: 50, y: 14 }, to: { x: 18, y: 62 }, count: 4, duration: 1000, gap: 750, silent: true });
          m.stream('.az-flow', { from: { x: 50, y: 14 }, to: { x: 50, y: 62 }, count: 4, duration: 1000, gap: 750 });
          m.stream('.az-flow', { from: { x: 50, y: 14 }, to: { x: 82, y: 62 }, count: 4, duration: 1000, gap: 750, silent: true });
        });
      },
    },
    {
      title: 'Zone 2 fails. Nobody notices',
      key: 'Nobody notices',
      desc: 'The load balancer stops sending traffic there. Zones 1 and 3 keep serving.',
      status: 'zone 2 · OFFLINE · orders still flowing',
      say: 'Now one zone fails. The load balancer stops sending traffic there, and the other two keep serving customers.',
      run: (m) => {
        m.cls('.z2', 'live', false);
        m.cls('.z2', 'down');
        m.shake('.z2');
        m.show('.az-served', 0, true);
        const pct = m.q('.az-pct')!;
        pct.style.color = 'var(--x-ok)';
        pct.textContent = '100%';
        m.after(400, () => {
          m.stream('.az-flow', { from: { x: 50, y: 14 }, to: { x: 18, y: 62 }, count: 5, duration: 1000, gap: 650 });
          m.stream('.az-flow', { from: { x: 50, y: 14 }, to: { x: 82, y: 62 }, count: 5, duration: 1000, gap: 650, silent: true });
        });
        m.after(900, () => m.punch('.az-served', 4));
      },
    },
    {
      title: 'Know the limit',
      key: 'limit',
      desc: 'Zones protect against a datacenter failure. A whole-region outage needs a second region.',
      status: 'exam tip · zone vs region',
      say: 'Remember the limit. Zones protect you from a datacenter failure. If the whole region goes down, you need a second region, often its pair.',
      run: (m) => {
        m.show('.az-rule > *', 260);
        m.after(600, () => m.sfx.chime());
      },
    },
  ],
  end: {
    title: 'Three buildings, one region, no single point of failure',
    sub: 'Spread copies across availability zones to survive a datacenter outage. Add a second region for a regional one.',
  },
};

export default spec;
