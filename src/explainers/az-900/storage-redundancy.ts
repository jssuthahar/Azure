import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const copy = (cls: string) => `<span class="sr-copy ${cls}">${I.image}</span>`;

const spec: ExplainerSpec = {
  id: 'storage-redundancy',
  lesson: 'storage-redundancy',
  title: {
    main: 'One photo. <em>Where are the copies?</em>',
    sub: 'LRS, ZRS, GRS and GZRS: how many copies Azure Storage keeps, and where each one lives.',
  },
  summary: 'An animation of one uploaded file stored three ways: three copies in one datacenter (LRS) lost when the building fails, three copies across availability zones (ZRS), and copies sent to a paired secondary region (GRS and GZRS), with read access to the secondary (RA-GRS).',
  html: `
  <div class="sr">
    <div class="sr-top">
      <span class="msd-pill accent sr-file">${I.image}<span>receipt-2041.jpg</span></span>
      <span class="sr-mode msd-pill msd-reveal">LRS</span>
      <span class="sr-count msd-pill ok msd-reveal"><b class="sr-n">3</b>&nbsp;copies</span>
    </div>
    <div class="sr-regions">
      <div class="sr-region sr-pri msd-card">
        <div class="sr-rh">${I.pin}<b>Primary region</b><span>Central India</span></div>
        <div class="sr-slots">
          <div class="sr-slot k1"><b class="sr-sl">Datacenter</b><div class="sr-copies">${copy('c1')}${copy('c2 lrs-only msd-pop')}${copy('c3 lrs-only msd-pop')}</div><div class="sr-x">${I.fire}<span>Building lost</span></div></div>
          <div class="sr-slot k2 zrs-only"><b class="sr-sl">Zone 2</b><div class="sr-copies">${copy('c1')}</div></div>
          <div class="sr-slot k3 zrs-only"><b class="sr-sl">Zone 3</b><div class="sr-copies">${copy('c1')}</div></div>
        </div>
      </div>
      <div class="sr-region sr-sec msd-card msd-reveal">
        <div class="sr-rh">${I.pin}<b>Secondary region</b><span>South India · paired</span></div>
        <div class="sr-slots"><div class="sr-slot"><b class="sr-sl">Datacenter</b><div class="sr-copies">${copy('c1')}${copy('c2')}${copy('c3')}</div></div></div>
        <span class="sr-ra msd-pill accent msd-reveal">${I.eye}<span>RA-: your app can read here</span></span>
      </div>
    </div>
    <div class="sr-scale msd-stagger"><span>LRS</span><i>‹</i><span>ZRS</span><i>‹</i><span>GRS</span><i>‹</i><span>GZRS</span><em>more protection, higher price</em></div>
    <div class="sr-flow"></div>
  </div>`,
  css: `
  @S .sr{ position:relative; height:100%; display:flex; flex-direction:column; gap:20px; }
  @S .sr-top{ display:flex; gap:14px; justify-content:center; flex-wrap:wrap; }
  @S .msd-pill svg{ width:26px; height:26px; }
  @S .sr-mode{ color:#fff; font-size:26px; border-color:var(--x-a1); }
  @S .sr-regions{ flex:1; display:grid; grid-template-columns:1.5fr 1fr; gap:22px; min-height:0; }
  @S .sr-region{ padding:22px; display:flex; flex-direction:column; gap:16px; min-height:0; }
  @S .sr-rh{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  @S .sr-rh svg{ width:30px; height:30px; color:var(--x-a1); }
  @S .sr-rh b{ color:#fff; font-size:27px; }
  @S .sr-rh span{ color:var(--x-dim); font-family:var(--x-mono); font-size:19px; }
  @S .sr-slots{ flex:1; display:flex; gap:14px; min-height:0; }
  @S .sr-slot{ position:relative; flex:1; display:flex; flex-direction:column; gap:14px; padding:16px; border-radius:18px; border:1.5px solid var(--x-line); background:rgb(14 20 32 / .9); transition:opacity .3s, border-color .3s, flex .4s; }
  @S .sr-sl{ color:var(--x-cyan); font-size:22px; }
  @S .sr-copies{ display:flex; gap:10px; flex-wrap:wrap; }
  @S .sr-copy{ width:70px; height:70px; border-radius:16px; display:grid; place-items:center; background:rgb(58 160 255 / .14); border:1.5px solid rgb(58 160 255 / .45); color:var(--x-a1); transition:opacity .3s, transform .3s; }
  @S .sr-copy svg{ width:38px; height:38px; }
  @S .sr-x{ position:absolute; inset:0; border-radius:18px; display:none; flex-direction:column; gap:8px; align-items:center; justify-content:center; background:rgb(40 8 16 / .82); color:var(--x-bad); font-size:26px; font-weight:800; }
  @S .sr-x svg{ width:60px; height:60px; }
  @S .sr-slot.down{ border-color:var(--x-bad); } @S .sr-slot.down .sr-x{ display:flex; }
  @S .sr-pri .zrs-only{ display:none; }
  @S .sr-pri.zrs .zrs-only{ display:flex; }
  @S .sr-pri.zrs .lrs-only{ display:none; }
  @S .sr-sec .sr-copy{ background:rgb(34 211 238 / .1); border-color:rgb(34 211 238 / .45); color:var(--x-cyan); }
  @S .sr-ra{ align-self:flex-start; font-size:19px; }
  @S .sr-scale{ display:flex; gap:10px; align-items:center; justify-content:center; flex-wrap:wrap; font-size:26px; font-weight:800; color:#fff; }
  @S .sr-scale span{ padding:8px 18px; border-radius:12px; background:rgb(58 160 255 / .14); border:1.5px solid rgb(58 160 255 / .4); }
  @S .sr-scale i{ color:var(--x-a1); font-style:normal; }
  @S .sr-scale em{ width:100%; text-align:center; font-style:normal; font-size:21px; font-weight:600; color:var(--x-dim); }
  @S .sr-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .sr-regions{ grid-template-columns:1fr; grid-template-rows:1.3fr 1fr; }
  @P .sr-copy{ width:62px; height:62px; }
  `,
  stages: [
    {
      title: 'You upload one file',
      key: 'one file',
      desc: 'Behind the scenes, Azure Storage never keeps just one copy.',
      status: 'PUT receipt-2041.jpg · 201 Created',
      say: 'You upload one photo to an Azure storage account. Behind the scenes, Azure never keeps just one copy.',
      run: (m) => {
        m.particles('.sr-flow', { from: '.sr-file', to: '.k1 .c1', count: 6, duration: 900 });
        m.after(900, () => m.punch('.k1 .c1', 2));
      },
    },
    {
      title: 'LRS: three copies, one building',
      key: 'LRS',
      desc: 'Locally redundant storage. Cheapest. Survives a failed disk or rack.',
      status: 'redundancy · LRS · 3 copies · 1 datacenter',
      say: 'With locally redundant storage, or LRS, Azure keeps three copies inside a single datacenter. It is the cheapest option, and it survives a failed disk or rack.',
      run: (m) => {
        m.show('.sr-mode, .sr-count', 0, true);
        m.show('.k1 .c2, .k1 .c3', 0, true);
        m.punch('.k1 .c2', 3);
        m.after(250, () => m.punch('.k1 .c3', 4));
      },
    },
    {
      title: 'But the building can fail',
      key: 'building',
      desc: 'A fire or flood takes out the datacenter, and all three copies with it.',
      status: 'datacenter · LOST · 0 copies left',
      say: 'But if that whole datacenter has a fire or a flood, all three copies were in the same place.',
      run: (m) => {
        m.cls('.k1', 'down');
        m.shake('.k1');
        m.sfx.thud();
        m.q('.sr-count')!.classList.replace('ok', 'bad');
        m.count('.sr-n', 0, 700);
      },
    },
    {
      title: 'ZRS: one copy per zone',
      key: 'ZRS',
      desc: 'Zone-redundant storage spreads the three copies across three availability zones.',
      status: 'redundancy · ZRS · 3 zones',
      say: 'Zone redundant storage, or ZRS, puts the three copies in three availability zones. Lose a building, and your data is still there.',
      run: (m) => {
        m.cls('.k1', 'down', false);
        m.text('.sr-mode', 'ZRS');
        m.text('.k1 .sr-sl', 'Zone 1');
        m.cls('.sr-pri', 'zrs');
        const c = m.q('.sr-count')!;
        c.classList.replace('bad', 'ok');
        m.text('.sr-n', '3');
        m.sfx.lock();
        m.after(1400, () => { m.cls('.k2', 'down'); m.shake('.k2'); });
        m.after(2400, () => m.punch('.k1 .c1, .k3 .c1', 4));
      },
    },
    {
      title: 'GRS: a second region too',
      key: 'GRS',
      desc: 'Three copies in one datacenter, copied in the background to the paired region. Six in all.',
      status: 'redundancy · GRS · 6 copies · 2 regions',
      say: 'Geo redundant storage, or GRS, keeps three copies in one datacenter, then copies the data in the background to a paired region hundreds of kilometres away. That makes six.',
      run: (m) => {
        m.cls('.k2', 'down', false);
        m.cls('.sr-pri', 'zrs', false);
        m.text('.k1 .sr-sl', 'Datacenter');
        m.text('.sr-mode', 'GRS');
        m.show('.sr-sec', 0, true);
        m.count('.sr-n', 6, 900);
        m.after(300, () => m.stream('.sr-flow', { from: '.k1 .c2', to: '.sr-sec .c2', count: 5, duration: 1100, gap: 900 }));
      },
    },
    {
      title: 'GZRS: zones plus a region',
      key: 'GZRS',
      desc: 'Three zones in the primary region, plus copies in the secondary. The strongest option.',
      status: 'redundancy · GZRS · zones + region',
      say: "GZRS combines both. Three zones in the primary region, plus copies in the secondary region. It's the strongest option.",
      run: (m) => {
        m.text('.sr-mode', 'GZRS');
        m.text('.k1 .sr-sl', 'Zone 1');
        m.cls('.sr-pri', 'zrs');
        m.sfx.sparkle();
        m.after(300, () => m.stream('.sr-flow', { from: '.k2 .c1', to: '.sr-sec .c2', count: 4, duration: 1100, gap: 1000, silent: true }));
      },
    },
    {
      title: 'Read from the backup? Add RA-',
      key: 'RA-',
      desc: 'RA-GRS and RA-GZRS let your app read from the secondary region at any time.',
      status: 'RA-GZRS · secondary readable',
      say: 'Add read access, as in RA-GRS or RA-GZRS, and your app can read from the secondary region at any time. Remember, more protection costs more.',
      run: (m) => {
        m.text('.sr-mode', 'RA-GZRS');
        m.show('.sr-ra', 0);
        m.after(700, () => m.show('.sr-scale > *', 140));
      },
    },
  ],
  end: {
    title: 'LRS › ZRS › GRS › GZRS',
    sub: 'One building, three zones, a second region, or both. Match the copies to what you can’t afford to lose.',
  },
};

export default spec;
