import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const dcs = `<div class="ar-dcs msd-reveal"><span>${I.server}</span><span>${I.server}</span></div>`;
const zone = (n: number) => `<div class="ar-zone msd-reveal"><b>Zone ${n}</b>${dcs}</div>`;

const spec: ExplainerSpec = {
  id: 'azure-architecture',
  lesson: 'regions-and-region-pairs',
  title: {
    main: 'Where does your app <em>actually live?</em>',
    sub: 'Geographies, regions, region pairs, availability zones and datacenters, zoomed in one level at a time.',
  },
  summary: 'An animation that zooms from an Azure geography (India) into its regions, into the availability zones of Central India and the datacenters inside them, then shows the Central India and South India region pair taking over during a regional outage.',
  html: `
  <div class="ar">
    <div class="ar-geo msd-card">
      <div class="ar-gh">${I.globe}<b>Geography · India</b><span class="msd-chip ar-res msd-reveal">data stays in India</span></div>
      <div class="ar-regions">
        <div class="ar-reg r-c msd-reveal"><div class="ar-rh">${I.pin}<b>Central India</b><span>Pune</span></div>
          <div class="ar-zones">${zone(1)}${zone(2)}${zone(3)}</div>
          <div class="ar-off">${I.fire}<span>Region outage</span></div>
        </div>
        <div class="ar-reg r-s msd-reveal"><div class="ar-rh">${I.pin}<b>South India</b><span>Chennai</span></div><div class="ar-took msd-pill ok msd-reveal">${I.check}<span>Taking over</span></div></div>
        <div class="ar-reg r-w msd-reveal"><div class="ar-rh">${I.pin}<b>West India</b><span>Mumbai</span></div></div>
      </div>
      <div class="ar-pair msd-reveal"><span class="msd-pill accent">${I.net}<span>Region pair · Central India ⇄ South India</span></span></div>
    </div>
    <div class="ar-ladder msd-stagger">
      <span>Geography</span><i>›</i><span>Region pair</span><i>›</i><span>Region</span><i>›</i><span>Zone</span><i>›</i><span>Datacenter</span>
    </div>
    <div class="ar-flow"></div>
  </div>`,
  css: `
  @S .ar{ position:relative; height:100%; display:flex; flex-direction:column; gap:20px; }
  @S .ar-geo{ flex:1; padding:24px; display:flex; flex-direction:column; gap:18px; border-style:dashed; border-color:rgb(58 160 255 / .45); }
  @S .ar-gh{ display:flex; align-items:center; gap:14px; color:#fff; font-size:32px; flex-wrap:wrap; }
  @S .ar-gh svg{ width:42px; height:42px; color:var(--x-a1); }
  @S .ar-res{ margin-left:auto; }
  @S .ar-regions{ flex:1; display:grid; grid-template-columns:1.9fr 1fr 1fr; gap:18px; min-height:0; }
  @S .ar-reg{ position:relative; display:flex; flex-direction:column; gap:14px; padding:20px; border-radius:22px; background:rgb(14 20 32 / .92); border:1.5px solid var(--x-line); transition:opacity .3s, transform .3s, border-color .3s, filter .3s; }
  @S .ar-reg.hot{ border-color:var(--x-a1); box-shadow:0 0 0 1px var(--x-a1), 0 0 46px rgb(58 160 255 / .25); }
  @S .ar-reg.ok{ border-color:var(--x-ok); box-shadow:0 0 0 1px var(--x-ok), 0 0 46px rgb(63 185 80 / .25); }
  @S .ar-rh{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  @S .ar-rh svg{ width:30px; height:30px; color:var(--x-a1); }
  @S .ar-rh b{ color:#fff; font-size:27px; }
  @S .ar-rh span{ color:var(--x-dim); font-size:20px; font-family:var(--x-mono); }
  @S .ar-zones{ flex:1; display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  @S .ar-zone{ display:flex; flex-direction:column; gap:12px; padding:14px; border-radius:16px; border:1.5px dashed rgb(34 211 238 / .5); background:rgb(34 211 238 / .05); }
  @S .ar-zone b{ color:var(--x-cyan); font-size:22px; }
  @S .ar-dcs{ display:flex; gap:8px; flex-wrap:wrap; }
  @S .ar-dcs span{ width:54px; height:54px; border-radius:12px; display:grid; place-items:center; background:rgb(58 160 255 / .14); color:var(--x-a1); }
  @S .ar-dcs svg{ width:30px; height:30px; }
  @S .ar-off{ position:absolute; inset:0; border-radius:22px; display:none; flex-direction:column; gap:10px; align-items:center; justify-content:center; background:rgb(40 8 16 / .8); color:var(--x-bad); font-size:30px; font-weight:800; }
  @S .ar-off svg{ width:70px; height:70px; }
  @S .ar-reg.down{ border-color:var(--x-bad); }
  @S .ar-reg.down .ar-off{ display:flex; }
  @S .ar-took{ align-self:flex-start; }
  @S .ar-pair{ display:flex; justify-content:center; }
  @S .ar-ladder{ display:flex; gap:10px; justify-content:center; align-items:center; flex-wrap:wrap; font-size:26px; font-weight:700; color:#fff; }
  @S .ar-ladder span{ padding:10px 18px; border-radius:14px; background:rgb(58 160 255 / .14); border:1.5px solid rgb(58 160 255 / .4); }
  @S .ar-ladder i{ color:var(--x-a1); font-style:normal; font-size:34px; }
  @S .ar-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .ar-regions{ grid-template-columns:1fr 1fr; grid-template-rows:1.7fr 1fr; }
  @P .ar-reg.r-c{ grid-column:1 / -1; }
  @P .ar-ladder{ font-size:23px; gap:8px; }
  @P .ar-ladder span{ padding:8px 12px; }
  `,
  stages: [
    {
      title: 'Start with a geography',
      key: 'geography',
      desc: 'A geography, such as India or Europe, keeps data inside one market’s borders.',
      status: 'geography · India',
      say: "Azure's map starts with geographies, like India or Europe. Your data stays inside a geography, which helps you meet local rules.",
      run: (m) => {
        m.show('.ar-res', 0);
      },
    },
    {
      title: 'Regions sit inside it',
      key: 'Regions',
      desc: 'A region is a set of datacenters in one area. You pick a region for every resource.',
      status: 'regions · Central, South, West India',
      say: 'Each geography holds regions. A region is a set of datacenters in one area, like Central India in Pune. You choose a region whenever you create something.',
      run: (m) => {
        m.show('.ar-reg', 260);
      },
    },
    {
      title: 'Zones sit inside a region',
      key: 'Zones',
      desc: 'Many regions are split into three or more availability zones: separate buildings.',
      status: 'Central India · 3 availability zones',
      say: 'Many regions are split into availability zones, separate buildings with their own power, cooling and network.',
      run: (m) => {
        m.cls('.r-c', 'hot');
        m.focus('.r-c', '.r-s, .r-w');
        m.after(400, () => m.show('.ar-zone', 260));
      },
    },
    {
      title: 'Datacenters sit inside a zone',
      key: 'Datacenters',
      desc: 'Each zone is one or more datacenters. That’s where your servers physically run.',
      status: 'zone → datacenter → your VM',
      say: "And each zone is one or more datacenters. That's the bottom of the stack, where your servers actually run.",
      run: (m) => {
        m.show('.ar-dcs', 200);
      },
    },
    {
      title: 'Regions come in pairs',
      key: 'pairs',
      desc: 'Most regions pair with another in the same geography, hundreds of kilometres away.',
      status: 'region pair · Central India ⇄ South India',
      say: 'Most regions are paired with another region in the same geography, hundreds of kilometres away. Central India pairs with South India.',
      run: (m) => {
        m.unfocus();
        m.cls('.r-s', 'hot');
        m.show('.ar-pair', 0);
        m.sfx.lock();
        m.stream('.ar-flow', { from: { x: 30, y: 50 }, to: { x: 66, y: 50 }, count: 4, duration: 900, gap: 900, silent: true });
      },
    },
    {
      title: 'A whole region goes down',
      key: 'region goes down',
      desc: 'Recover in the pair. Azure also updates paired regions one at a time, never both.',
      status: 'Central India · OUTAGE · failover to South India',
      say: 'If a whole region has a disaster, its pair is where you recover. Azure also rolls out planned updates to paired regions one at a time, never both at once.',
      run: (m) => {
        m.cls('.r-c', 'hot', false);
        m.cls('.r-c', 'down');
        m.shake('.r-c');
        m.sfx.thud();
        m.after(700, () => {
          m.cls('.r-s', 'hot', false);
          m.cls('.r-s', 'ok');
          m.show('.ar-took', 0, true);
          m.sfx.chime();
          m.stream('.ar-flow', { from: { x: 50, y: 0 }, to: { x: 72, y: 45 }, count: 6, duration: 900, gap: 600 });
        });
      },
    },
    {
      title: 'Remember the ladder',
      key: 'ladder',
      desc: 'From biggest to smallest: geography, region pair, region, zone, datacenter.',
      status: 'exam tip · biggest to smallest',
      say: 'Remember the ladder from biggest to smallest. Geography, region pair, region, availability zone, datacenter.',
      run: (m) => {
        m.cls('.r-c', 'down', false);
        m.cls('.r-s', 'ok', false);
        m.hide('.ar-took');
        m.show('.ar-ladder > *', 160);
        m.after(1500, () => m.sfx.resolve());
      },
    },
  ],
  end: {
    title: 'Geography › Region pair › Region › Zone › Datacenter',
    sub: 'Zones protect you from a building failure. The region pair protects you from a regional one.',
  },
};

export default spec;
