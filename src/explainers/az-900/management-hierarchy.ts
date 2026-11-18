import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const tags = '<span class="mh-tags"><i class="t-pol">Policy: India only</i><i class="t-rbac">RBAC: web team</i><i class="t-lock">Delete lock</i></span>';

const spec: ExplainerSpec = {
  id: 'management-hierarchy',
  lesson: 'management-hierarchy',
  title: {
    main: 'Four levels. <em>Rules flow down.</em>',
    sub: 'Management groups, subscriptions, resource groups and resources, and how settings are inherited.',
  },
  summary: 'An animation that builds the Azure hierarchy from the bottom up: resources inside resource groups, resource groups inside subscriptions, subscriptions inside a management group. A policy set at the management group, an RBAC role at the subscription and a lock at the resource group all flow down to the virtual machine.',
  html: `
  <div class="mh">
    <div class="mh-lvl l-mg msd-reveal"><span class="ic">${I.layers}</span><b>Management group</b><small>Contoso · company-wide rules</small>${tags}</div>
    <div class="mh-row r-sub">
      <div class="mh-lvl l-sub s1 msd-reveal"><span class="ic">${I.key}</span><b>Subscription</b><small>Contoso-Prod · billing + access</small>${tags}</div>
      <div class="mh-lvl l-sub s2 msd-reveal"><span class="ic">${I.key}</span><b>Subscription</b><small>Contoso-Dev</small>${tags}</div>
    </div>
    <div class="mh-row r-rg">
      <div class="mh-lvl l-rg g1 msd-reveal"><span class="ic">${I.layers}</span><b>rg-shop-web</b><small>one app’s lifecycle</small>${tags}</div>
      <div class="mh-lvl l-rg g2 msd-reveal"><span class="ic">${I.layers}</span><b>rg-shop-data</b>${tags}</div>
    </div>
    <div class="mh-row r-res">
      <div class="mh-lvl l-res v1"><span class="ic">${I.server}</span><b>vm-web-01</b>${tags}</div>
      <div class="mh-lvl l-res v2"><span class="ic">${I.app}</span><b>app-shop</b>${tags}</div>
      <div class="mh-lvl l-res v3"><span class="ic">${I.db}</span><b>sql-orders</b>${tags}</div>
    </div>
    <div class="mh-flow"></div>
  </div>`,
  css: `
  @S .mh{ position:relative; height:100%; display:flex; flex-direction:column; justify-content:space-between; gap:18px; }
  @S .mh-row{ display:flex; gap:16px; }
  @S .mh-row > *{ flex:1; }
  @S .mh-lvl{ position:relative; display:grid; grid-template-columns:52px 1fr; grid-template-rows:auto auto auto; column-gap:14px; align-items:center; padding:14px 18px; border-radius:18px; border:1.5px solid var(--x-line); background:linear-gradient(180deg, var(--x-panel), var(--x-panel-2)); transition:border-color .3s, box-shadow .3s; }
  @S .mh-lvl .ic{ grid-row:span 2; width:52px; height:52px; border-radius:14px; display:grid; place-items:center; background:rgb(58 160 255 / .12); color:var(--x-a1); }
  @S .mh-lvl .ic svg{ width:30px; height:30px; }
  @S .mh-lvl b{ color:#fff; font-size:24px; } @S .mh-lvl small{ color:var(--x-dim); font-size:18px; font-family:var(--x-mono); }
  @S .l-mg{ border-color:rgb(180 140 255 / .6); } @S .l-mg .ic{ background:rgb(180 140 255 / .16); color:var(--x-you); }
  @S .l-sub .ic{ background:rgb(240 166 74 / .14); color:var(--x-warn); }
  @S .l-rg .ic{ background:rgb(34 211 238 / .12); color:var(--x-cyan); }
  @S .mh-tags{ grid-column:1 / -1; display:flex; flex-wrap:wrap; gap:6px; }
  @S .mh-tags i{ display:none; font-style:normal; font-family:var(--x-mono); font-size:16px; font-weight:700; padding:4px 10px; border-radius:8px; margin-top:8px; }
  @S .t-pol{ color:var(--x-you); background:rgb(180 140 255 / .14); } @S .t-rbac{ color:var(--x-warn); background:rgb(240 166 74 / .14); } @S .t-lock{ color:var(--x-cyan); background:rgb(34 211 238 / .12); }
  @S .mh-lvl.pol .t-pol, @S .mh-lvl.rbac .t-rbac, @S .mh-lvl.lock .t-lock{ display:inline-block; }
  @S .mh-lvl.hot{ border-color:var(--x-a1); box-shadow:0 0 0 1px var(--x-a1), 0 0 40px rgb(58 160 255 / .25); }
  @S .mh-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .mh-row{ flex-wrap:wrap; }
  @P .r-res > *{ flex:1 1 45%; }
  @P .mh-lvl b{ font-size:22px; }
  `,
  stages: [
    {
      title: 'It starts with resources',
      key: 'resources',
      desc: 'A VM, a web app, a database: the things you actually create and pay for.',
      status: '3 resources',
      say: 'Start at the bottom. Resources are the things you actually create and pay for: a virtual machine, a web app, a database.',
      run: (m) => {
        m.qa('.l-res').forEach((_, i) => m.after(i * 200, () => m.punch(`.l-res.v${i + 1}`, i)));
      },
    },
    {
      title: 'Resource groups hold them',
      key: 'Resource groups',
      desc: 'Group resources that share a lifecycle. Delete the group and everything in it goes.',
      status: 'rg-shop-web · rg-shop-data',
      say: 'Every resource lives in exactly one resource group. Put things that share a lifecycle together, because deleting the group deletes everything inside it.',
      run: (m) => {
        m.show('.l-rg', 250);
      },
    },
    {
      title: 'Subscriptions hold groups',
      key: 'Subscriptions',
      desc: 'A subscription is a billing boundary and an access boundary. Many companies split prod and dev.',
      status: 'Contoso-Prod · Contoso-Dev',
      say: 'Resource groups sit in a subscription. A subscription is where the bill is counted and an access boundary, so many companies keep production and development apart.',
      run: (m) => {
        m.show('.l-sub', 250);
      },
    },
    {
      title: 'Management groups hold subscriptions',
      key: 'Management groups',
      desc: 'Group subscriptions to apply company-wide rules once, instead of to each subscription.',
      status: 'management group · Contoso',
      say: 'At the top, management groups hold subscriptions, so you can set company-wide rules once, instead of on every subscription.',
      run: (m) => {
        m.show('.l-mg', 0);
        m.sfx.lock();
      },
    },
    {
      title: 'Set a policy at the top',
      key: 'policy',
      desc: 'Allowed regions = India, set on the management group, reaches everything below.',
      status: 'inherit · policy → all levels',
      say: 'Set a policy at the management group, say only Indian regions, and it flows down to every subscription, resource group and resource underneath.',
      run: (m) => {
        m.cls('.l-mg', 'pol');
        m.cls('.l-mg', 'hot');
        ['.l-sub', '.l-rg', '.l-res'].forEach((sel, i) => m.after(500 + i * 500, () => { m.cls(sel, 'pol'); m.sfx.step(i + 1); }));
        m.after(400, () => m.particles('.mh-flow', { from: '.l-mg', to: '.l-res.v2', count: 10, duration: 1300, spread: 300, color: '#b48cff' }));
      },
    },
    {
      title: 'Access and locks flow down too',
      key: 'flow down',
      desc: 'A role on the prod subscription and a lock on the web group are inherited below them only.',
      status: 'RBAC @ Contoso-Prod · lock @ rg-shop-web',
      say: 'Access works the same way. Give the web team a role on the production subscription, and add a delete lock on the web resource group. Each one applies to that level and everything below it, and nowhere else.',
      run: (m) => {
        m.cls('.l-mg', 'hot', false);
        m.cls('.l-sub.s1', 'rbac');
        m.cls('.l-sub.s1', 'hot');
        m.after(700, () => { m.cls('.l-rg', 'rbac'); m.cls('.l-res', 'rbac'); m.sfx.step(3); });
        m.after(1600, () => { m.cls('.l-sub.s1', 'hot', false); m.cls('.l-rg.g1', 'lock'); m.cls('.l-rg.g1', 'hot'); m.sfx.lock(); });
        m.after(2300, () => { m.cls('.l-res.v1, .l-res.v2', 'lock'); m.sfx.step(5); });
      },
    },
    {
      title: 'The VM obeys all three',
      key: 'all three',
      desc: 'vm-web-01 inherits the policy, the role and the lock without any setting of its own.',
      status: 'vm-web-01 · policy + RBAC + lock',
      say: 'So the virtual machine follows all three, the policy, the role and the lock, without a single setting of its own. Management group, subscription, resource group, resource.',
      run: (m) => {
        m.cls('.mh-lvl', 'hot', false);
        m.cls('.l-res.v1', 'hot');
        m.focus('.l-res.v1', '.l-res.v2, .l-res.v3, .l-sub.s2, .l-rg.g2');
        m.after(900, () => m.sfx.resolve());
      },
    },
  ],
  end: {
    title: 'Management group › Subscription › Resource group › Resource',
    sub: 'Set rules high to reach everything below. Settings flow down, never up.',
  },
};

export default spec;
