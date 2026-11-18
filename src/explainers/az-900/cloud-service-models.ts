import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const LAYERS = ['Data & users', 'Application', 'Runtime', 'Operating system', 'Servers & network'];
// y = you manage, m = Microsoft manages (top layer first)
const MODELS: [string, string, string, string, string][] = [
  ['iaas', 'IaaS', 'Virtual Machines', 'yyyym', I.server],
  ['paas', 'PaaS', 'App Service', 'yymmm', I.code],
  ['saas', 'SaaS', 'Microsoft 365', 'ymmmm', I.app],
];

const col = ([k, name, ex, own, icon]: (typeof MODELS)[number]) => `
  <div class="sm-col ${k} msd-reveal">
    <div class="sm-ch"><span class="sm-ic">${icon}</span><b>${name}</b><small>${ex}</small></div>
    <div class="sm-stack">${LAYERS.map((l, i) => `<div class="sm-l" data-o="${own[i]}">${l}</div>`).join('')}</div>
    <div class="sm-drop"></div>
  </div>`;

const spec: ExplainerSpec = {
  id: 'cloud-service-models',
  lesson: 'choosing-iaas-paas-saas',
  title: {
    main: 'IaaS, PaaS or SaaS? <em>Let the job decide.</em>',
    sub: 'What each service type hands you, what it leaves to you, and how to pick one in ten seconds.',
  },
  summary: 'An animation of three stacks for IaaS, PaaS and SaaS showing which layers you manage and which Microsoft manages, then three real requests sorted into the right model, and the rule of starting with the most managed option.',
  html: `
  <div class="sm">
    <div class="sm-legend"><span class="y">You manage</span><span class="m">Microsoft manages</span></div>
    <div class="sm-cols">${MODELS.map(col).join('')}</div>
    <div class="sm-case msd-reveal"><span class="sm-cq"></span></div>
    <div class="sm-scale msd-reveal"><span>More control</span><i></i><span>Less to manage</span></div>
    <div class="sm-flow"></div>
  </div>`,
  css: `
  @S .sm{ position:relative; height:100%; display:flex; flex-direction:column; gap:16px; }
  @S .sm-legend{ display:flex; gap:18px; justify-content:center; }
  @S .sm-legend span{ display:inline-flex; align-items:center; gap:10px; font-size:22px; font-weight:700; }
  @S .sm-legend span::before{ content:''; width:24px; height:24px; border-radius:7px; }
  @S .sm-legend .y::before{ background:var(--x-you); } @S .sm-legend .m::before{ background:var(--x-a1); }
  @S .sm-cols{ flex:1; display:grid; grid-template-columns:repeat(3,1fr); gap:20px; min-height:0; }
  @S .sm-col{ display:flex; flex-direction:column; gap:12px; padding:18px; border-radius:22px; border:1.5px solid var(--x-line); background:linear-gradient(180deg, var(--x-panel), var(--x-panel-2)); transition:border-color .3s, box-shadow .3s; }
  @S .sm-col.hot{ border-color:var(--x-a1); box-shadow:0 0 0 1px var(--x-a1), 0 0 46px rgb(58 160 255 / .25); }
  @S .sm-ch{ display:grid; grid-template-columns:auto 1fr; grid-template-rows:auto auto; column-gap:12px; align-items:center; }
  @S .sm-ic{ grid-row:span 2; width:56px; height:56px; border-radius:16px; display:grid; place-items:center; background:rgb(58 160 255 / .14); color:var(--x-a1); }
  @S .sm-ic svg{ width:32px; height:32px; }
  @S .sm-ch b{ color:#fff; font-size:32px; line-height:1; } @S .sm-ch small{ color:var(--x-dim); font-size:19px; font-family:var(--x-mono); }
  @S .sm-stack{ display:flex; flex-direction:column; gap:7px; }
  @S .sm-l{ padding:11px 14px; border-radius:11px; font-size:20px; font-weight:700; color:var(--x-dim); background:rgb(255 255 255 / .04); border:1.5px solid var(--x-line); transition:background .35s, color .35s, border-color .35s; }
  @S .sm-col.on .sm-l[data-o="y"]{ background:var(--x-you); color:#1b1030; border-color:transparent; }
  @S .sm-col.on .sm-l[data-o="m"]{ background:var(--x-a1); color:#06213d; border-color:transparent; }
  @S .sm-drop{ flex:1; display:flex; flex-direction:column; gap:8px; justify-content:flex-end; }
  @S .sm-pick{ font-size:19px; font-weight:700; color:#fff; padding:10px 12px; border-radius:12px; background:rgb(63 185 80 / .16); border:1.5px solid rgb(63 185 80 / .55); }
  @S .sm-case{ align-self:center; }
  @S .sm-cq{ display:inline-block; font-size:26px; font-weight:700; color:#fff; padding:12px 22px; border-radius:16px; background:var(--x-panel-2); border:1.5px dashed var(--x-a1); }
  @S .sm-scale{ display:flex; align-items:center; gap:16px; font-size:22px; font-weight:700; color:var(--x-dim); }
  @S .sm-scale i{ flex:1; height:10px; border-radius:5px; background:linear-gradient(90deg, var(--x-you), var(--x-a1)); }
  @S .sm-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .sm-cols{ gap:12px; }
  @P .sm-col{ padding:12px; }
  @P .sm-ch{ grid-template-columns:1fr; } @P .sm-ic{ grid-row:auto; width:48px; height:48px; }
  @P .sm-ch b{ font-size:28px; margin-top:6px; }
  @P .sm-l{ font-size:17px; padding:10px 8px; }
  @P .sm-pick{ font-size:17px; }
  `,
  stages: [
    {
      title: 'Three ways to run software',
      key: 'Three ways',
      desc: 'Each one draws the line between your work and Microsoft’s in a different place.',
      status: 'IaaS · PaaS · SaaS',
      say: "The cloud offers three service types. Each one draws the line between your work and Microsoft's in a different place.",
      run: (m) => {
        m.show('.sm-col', 250);
      },
    },
    {
      title: 'IaaS: you get the machine',
      key: 'IaaS',
      desc: 'A virtual machine. Microsoft runs the hardware; the OS and everything above it is yours.',
      status: 'IaaS · Virtual Machines',
      say: 'Infrastructure as a service gives you a virtual machine. Microsoft runs the hardware, and the operating system and everything above it is yours. Most control, most work.',
      run: (m) => {
        m.cls('.sm-col.iaas', 'on');
        m.cls('.sm-col.iaas', 'hot');
        m.sfx.lock();
      },
    },
    {
      title: 'PaaS: you bring the code',
      key: 'PaaS',
      desc: 'App Service runs the OS and runtime. You manage your app, its data and who can use it.',
      status: 'PaaS · App Service',
      say: 'Platform as a service, like App Service, also runs the operating system and the runtime. You just deploy your code and look after its data. This is where developers live.',
      run: (m) => {
        m.cls('.sm-col', 'hot', false);
        m.cls('.sm-col.paas', 'on');
        m.cls('.sm-col.paas', 'hot');
        m.sfx.lock();
      },
    },
    {
      title: 'SaaS: you just use it',
      key: 'SaaS',
      desc: 'Microsoft 365 is a finished app. You manage your data, your users and your settings.',
      status: 'SaaS · Microsoft 365',
      say: 'Software as a service, like Microsoft 365, is a finished application. You sign in, set it up, and manage your own data and users. Least control, least work.',
      run: (m) => {
        m.cls('.sm-col', 'hot', false);
        m.cls('.sm-col.saas', 'on');
        m.cls('.sm-col.saas', 'hot');
        m.sfx.lock();
      },
    },
    {
      title: 'Sort three real requests',
      key: 'real requests',
      desc: 'Payroll for 200 staff, your own booking site, a legacy app that needs OS changes.',
      status: 'payroll → SaaS · booking site → PaaS · legacy → IaaS',
      say: 'Payroll for two hundred staff? A SaaS product already does that. Your own booking website? PaaS. An old app that needs changes to the operating system? That one goes on an IaaS virtual machine.',
      run: (m) => {
        m.cls('.sm-col', 'hot', false);
        m.show('.sm-case', 0, true);
        const drop = (k: string, text: string) => {
          const d = document.createElement('div');
          d.className = 'sm-pick msd-pop';
          d.textContent = text;
          m.q(`.sm-col.${k} .sm-drop`)!.appendChild(d);
          m.after(30, () => d.classList.add('show'));
          m.cls(`.sm-col.${k}`, 'hot');
        };
        const cases: [string, string, number][] = [['saas', 'Payroll for 200 staff', 0], ['paas', 'Our booking website', 2600], ['iaas', 'Legacy app, needs OS access', 5000]];
        cases.forEach(([k, t, at]) => m.after(at, () => {
          m.text('.sm-cq', t);
          m.punch('.sm-case', 2);
          m.after(900, () => { m.cls('.sm-col', 'hot', false); drop(k, t); m.sfx.ding(); });
        }));
      },
    },
    {
      title: 'Control versus convenience',
      key: 'Control',
      desc: 'Moving from IaaS to SaaS, your control goes down and so does your management effort.',
      status: 'scale · control ↔ effort',
      say: 'So it is a trade. Moving from IaaS to SaaS, your control goes down, and so does the work you have to do.',
      run: (m) => {
        m.cls('.sm-col', 'hot', false);
        m.hide('.sm-case');
        m.show('.sm-scale', 0);
        m.sfx.whoosh(true);
      },
    },
    {
      title: 'Start with the most managed',
      key: 'most managed',
      desc: 'Check SaaS first, then PaaS. Only drop to IaaS when you need the OS.',
      status: 'rule · SaaS → PaaS → IaaS',
      say: 'Here is the rule of thumb. Check for a SaaS product first, then PaaS. Only drop down to IaaS when you really need the operating system.',
      run: (m) => {
        ['saas', 'paas', 'iaas'].forEach((k, i) => m.after(i * 600, () => { m.cls('.sm-col', 'hot', false); m.cls(`.sm-col.${k}`, 'hot'); m.sfx.step(i + 2); }));
        m.after(2200, () => m.sfx.resolve());
      },
    },
  ],
  end: {
    title: 'SaaS first, PaaS next, IaaS when you need the OS',
    sub: 'The more Microsoft manages, the less you control and the less you have to look after.',
  },
};

export default spec;
