import type { ExplainerSpec } from '../../lib/explainer/types';

const ROWS = ['Data & information', 'Devices', 'Accounts & identities', 'Applications', 'Network controls', 'Operating system', 'Physical datacenter'];
// y = you, s = shared, m = Microsoft (Microsoft Learn shared responsibility chart, simplified)
const COLS: [string, string, string][] = [
  ['onprem', 'On-premises', 'yyyyyyy'],
  ['iaas', 'IaaS', 'yyyyyym'],
  ['paas', 'PaaS', 'yyyssmm'],
  ['saas', 'SaaS', 'yyymmmm'],
];

const grid = `
  <div class="sh-grid">
    <div class="sh-corner"></div>
    ${COLS.map(([k, label]) => `<div class="sh-ch ${k} msd-reveal">${label}</div>`).join('')}
    ${ROWS.map((r, i) => `<div class="sh-rh r${i}">${r}</div>${COLS.map(([k, , o]) => `<div class="sh-cell ${k} r${i}" data-o="${o[i]}"></div>`).join('')}`).join('')}
  </div>`;

const spec: ExplainerSpec = {
  id: 'shared-responsibility',
  lesson: 'shared-responsibility-model',
  title: {
    main: 'Who patches what? <em>It depends on the model.</em>',
    sub: 'The shared responsibility model, filled in one cloud model at a time.',
  },
  summary: 'An animation of the shared responsibility grid. Each column fills from on-premises to IaaS, PaaS and SaaS as Microsoft takes on more layers, while data, devices and accounts stay the customer’s responsibility in every model.',
  html: `
  <div class="sh">
    <div class="sh-legend"><span class="y">You</span><span class="s">Shared</span><span class="m">Microsoft</span></div>
    ${grid}
    <div class="sh-arrow msd-reveal"><span>More managed by Microsoft</span><b>→</b><span>less for you to run</span></div>
  </div>`,
  css: `
  @S .sh{ height:100%; display:flex; flex-direction:column; gap:18px; }
  @S .sh-legend{ display:flex; gap:12px; justify-content:center; }
  @S .sh-legend span{ display:inline-flex; align-items:center; gap:10px; font-size:22px; font-weight:700; color:var(--x-text); }
  @S .sh-legend span::before{ content:''; width:26px; height:26px; border-radius:8px; }
  @S .sh-legend .y::before{ background:var(--x-you); } @S .sh-legend .s::before{ background:linear-gradient(135deg, var(--x-you) 50%, var(--x-a1) 50%); } @S .sh-legend .m::before{ background:var(--x-a1); }
  @S .sh-grid{ flex:1; display:grid; grid-template-columns:270px repeat(4, 1fr); grid-auto-rows:1fr; gap:8px; min-height:0; }
  @S .sh-ch{ display:flex; align-items:center; justify-content:center; color:#fff; font-size:26px; font-weight:800; border-radius:14px; background:var(--x-panel-2); border:1.5px solid var(--x-line); }
  @S .sh-rh{ display:flex; align-items:center; padding:0 14px; color:var(--x-text); font-size:21px; font-weight:700; border-radius:12px; background:rgb(255 255 255 / .03); transition:background .3s, color .3s; }
  @S .sh-cell{ border-radius:12px; background:rgb(255 255 255 / .03); border:1.5px solid var(--x-line); transform:scaleY(.6); opacity:.35; transition:background .35s, opacity .35s, transform .35s cubic-bezier(.22,1.3,.36,1), box-shadow .3s; }
  @S .sh-cell.on{ opacity:1; transform:none; }
  @S .sh-cell.on[data-o="y"]{ background:var(--x-you); border-color:transparent; }
  @S .sh-cell.on[data-o="m"]{ background:var(--x-a1); border-color:transparent; }
  @S .sh-cell.on[data-o="s"]{ background:linear-gradient(135deg, var(--x-you) 50%, var(--x-a1) 50%); border-color:transparent; }
  @S .sh-cell.ping{ box-shadow:0 0 0 4px #fff, 0 0 30px rgb(255 255 255 / .5); }
  @S .sh-rh.always{ background:rgb(180 140 255 / .2); color:#fff; }
  @S .sh-arrow{ display:flex; gap:14px; justify-content:center; align-items:center; font-size:24px; font-weight:700; color:var(--x-dim); flex-wrap:wrap; }
  @S .sh-arrow b{ color:var(--x-a1); font-size:34px; }
  @P .sh-grid{ grid-template-columns:230px repeat(4, 1fr); gap:6px; }
  @P .sh-rh{ font-size:19px; padding:0 10px; }
  @P .sh-ch{ font-size:21px; }
  `,
  stages: [
    {
      title: 'On-premises: it’s all yours',
      key: 'all yours',
      desc: 'In your own datacenter you own every layer, from the building to the data.',
      status: 'on-premises · 7 of 7 layers on you',
      say: "In your own datacenter, you're responsible for everything, from the building and the power right up to your data.",
      run: (m) => {
        m.show('.sh-ch.onprem', 0);
        m.qa('.sh-cell.onprem').reverse().forEach((c, i) => m.after(i * 110, () => { c.classList.add('on'); m.sfx.step(i); }));
      },
    },
    {
      title: 'IaaS: Microsoft takes the building',
      key: 'IaaS',
      desc: 'With a virtual machine, the physical datacenter, hosts and network move to Microsoft.',
      status: 'IaaS · physical layer → Microsoft',
      say: 'Move to infrastructure as a service, like a virtual machine, and Microsoft takes over the physical datacenter, the hosts and the network.',
      run: (m) => {
        m.show('.sh-ch.iaas', 0);
        m.qa('.sh-cell.iaas').reverse().forEach((c, i) => m.after(i * 110, () => { c.classList.add('on'); m.sfx.step(i); }));
      },
    },
    {
      title: 'But the OS is still yours',
      key: 'OS',
      desc: 'On a VM you patch the operating system, set network rules, and run apps and data.',
      status: 'IaaS · you patch the OS',
      say: 'But on a VM the operating system is still yours to patch, along with the network rules, the apps and the data.',
      run: (m) => {
        m.cls('.sh-cell.iaas.r5', 'ping');
        m.punch('.sh-cell.iaas.r5', 3);
        m.after(2200, () => m.cls('.sh-cell.iaas.r5', 'ping', false));
      },
    },
    {
      title: 'PaaS: Microsoft runs the OS',
      key: 'PaaS',
      desc: 'With App Service, the OS is Microsoft’s. Apps and network controls become shared.',
      status: 'PaaS · OS → Microsoft · app shared',
      say: 'With platform as a service, like App Service, Microsoft runs the operating system too. Network controls and the application become shared.',
      run: (m) => {
        m.show('.sh-ch.paas', 0);
        m.qa('.sh-cell.paas').reverse().forEach((c, i) => m.after(i * 110, () => { c.classList.add('on'); m.sfx.step(i); }));
      },
    },
    {
      title: 'SaaS: you just use it',
      key: 'SaaS',
      desc: 'With Microsoft 365, Microsoft runs the whole application and everything under it.',
      status: 'SaaS · app → Microsoft',
      say: 'With software as a service, like Microsoft 365, Microsoft runs the whole application and everything underneath it.',
      run: (m) => {
        m.show('.sh-ch.saas', 0);
        m.qa('.sh-cell.saas').reverse().forEach((c, i) => m.after(i * 110, () => { c.classList.add('on'); m.sfx.step(i); }));
      },
    },
    {
      title: 'Always yours, in every model',
      key: 'Always yours',
      desc: 'Your data, your devices and your accounts never move to Microsoft.',
      status: 'exam trap · data · devices · accounts',
      say: "Here's the exam trap. In every model, your data, your devices and your accounts stay your responsibility. Microsoft never takes those.",
      run: (m) => {
        m.cls('.sh-rh.r0, .sh-rh.r1, .sh-rh.r2', 'always');
        m.after(200, () => { m.cls('.sh-cell.r0, .sh-cell.r1, .sh-cell.r2', 'ping'); m.sfx.ding(); });
        m.after(2600, () => m.cls('.sh-cell.r0, .sh-cell.r1, .sh-cell.r2', 'ping', false));
      },
    },
    {
      title: 'The pattern',
      key: 'pattern',
      desc: 'The more the provider manages, the less you run. You never hand over your data.',
      status: 'summary · on-prem → IaaS → PaaS → SaaS',
      say: 'The pattern is simple. The more the cloud provider manages, the less you have to, but you never hand over your data.',
      run: (m) => {
        m.show('.sh-arrow', 0);
        m.after(500, () => m.sfx.resolve());
      },
    },
  ],
  end: {
    title: 'More managed means less for you, never zero',
    sub: 'Microsoft takes layers from the bottom up. Data, devices and accounts stay with you in every model.',
  },
};

export default spec;
