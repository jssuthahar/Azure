import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const res = (k: string, name: string, where: string, icon: string, cls = '') =>
  `<div class="po-res ${k} ${cls}"><span class="ic">${icon}</span><b>${name}</b><small class="msd-mono">${where}</small><i class="po-st"></i></div>`;

const spec: ExplainerSpec = {
  id: 'azure-policy',
  lesson: 'azure-policy',
  title: {
    main: 'Rules Azure enforces <em>for you</em>',
    sub: 'How an Azure Policy is defined, assigned, evaluated and enforced, with one data-residency rule.',
  },
  summary: 'An animation of an “allowed locations: India” policy being defined and assigned to a subscription, a new resource in East US being denied while one in Central India is allowed, an existing resource being flagged as non-compliant on the compliance dashboard, a modify effect adding a missing tag, and how Policy differs from RBAC.',
  html: `
  <div class="po">
    <div class="po-left">
      <div class="po-def msd-editor msd-reveal">
        <div class="ed-bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span>policy definition</span></div>
        <div class="body"><span class="cm">// Allowed locations</span><br><span class="kw">if</span> location <span class="kw">not in</span> [<span class="st">"centralindia"</span>, <span class="st">"southindia"</span>]<br><span class="kw">then</span> effect: <span class="fn po-eff">deny</span></div>
      </div>
      <div class="po-scope msd-reveal">
        <span class="msd-chip">Assigned to</span><b>${I.key}Subscription · Contoso-Prod</b><small>every resource group inherits it</small>
      </div>
      <div class="po-vs msd-stagger">
        <div><b>Azure Policy</b><span>what resources may look like</span></div>
        <div><b>Azure RBAC</b><span>who may do what</span></div>
      </div>
    </div>
    <div class="po-right msd-card">
      <div class="po-rh"><span class="msd-label">Resources</span><span class="po-comp msd-pill ok msd-reveal">Compliance <b class="po-pct">100%</b></span></div>
      <div class="po-list">
        ${res('r1', 'vm-shop-01', 'centralindia', I.server)}
        ${res('r2', 'storage-logs', 'eastus · created 2024', I.db)}
        ${res('r3', 'vm-test-02', 'eastus · new', I.server, 'msd-pop')}
        ${res('r4', 'sql-orders', 'centralindia · new', I.db, 'msd-pop')}
      </div>
      <div class="po-tag msd-reveal msd-pill accent">${I.tag}modify: added tag costCentre = retail</div>
    </div>
    <div class="po-flow"></div>
  </div>`,
  css: `
  @S .po{ position:relative; height:100%; display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  @S .po-left{ display:flex; flex-direction:column; gap:16px; }
  @S .po-def .ed-bar span{ margin-left:12px; color:var(--x-dim); font-family:var(--x-mono); font-size:19px; }
  @S .po-def .body{ font-size:23px; }
  @S .po-scope{ display:flex; flex-direction:column; gap:8px; padding:16px 18px; border-radius:18px; border:1.5px solid rgb(58 160 255 / .5); background:rgb(58 160 255 / .08); align-items:flex-start; }
  @S .po-scope b{ display:flex; align-items:center; gap:10px; color:#fff; font-size:24px; } @S .po-scope b svg{ width:28px; height:28px; color:var(--x-a1); }
  @S .po-scope small{ color:var(--x-dim); font-size:19px; }
  @S .po-vs{ display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:auto; }
  @S .po-vs > div{ display:flex; flex-direction:column; gap:4px; padding:14px; border-radius:16px; border:1.5px solid var(--x-line); background:rgb(255 255 255 / .04); }
  @S .po-vs b{ color:#fff; font-size:23px; } @S .po-vs span{ color:var(--x-dim); font-size:19px; }
  @S .po-vs > div:first-child{ border-color:rgb(63 185 80 / .6); }
  @S .po-right{ padding:20px; display:flex; flex-direction:column; gap:14px; }
  @S .po-rh{ display:flex; justify-content:space-between; align-items:center; gap:10px; }
  @S .po-list{ display:flex; flex-direction:column; gap:12px; }
  @S .po-res{ display:grid; grid-template-columns:48px 1fr auto; grid-template-rows:auto auto; column-gap:14px; align-items:center; padding:12px 16px; border-radius:16px; border:1.5px solid var(--x-line); background:rgb(14 20 32 / .9); transition:border-color .3s, opacity .3s; }
  @S .po-res .ic{ grid-row:span 2; width:48px; height:48px; border-radius:13px; display:grid; place-items:center; background:rgb(58 160 255 / .12); color:var(--x-a1); }
  @S .po-res .ic svg{ width:28px; height:28px; }
  @S .po-res b{ color:#fff; font-size:22px; } @S .po-res small{ color:var(--x-dim); font-size:17px; }
  @S .po-st{ grid-row:span 2; grid-column:3; font-style:normal; font-family:var(--x-mono); font-size:18px; font-weight:800; padding:6px 12px; border-radius:10px; }
  @S .po-st:empty{ display:none; }
  @S .po-res.ok{ border-color:rgb(63 185 80 / .6); } @S .po-res.ok .po-st{ color:var(--x-ok); background:rgb(63 185 80 / .12); }
  @S .po-res.deny{ border-color:var(--x-bad); opacity:.55; } @S .po-res.deny .po-st{ color:var(--x-bad); background:rgb(244 74 106 / .12); }
  @S .po-res.audit{ border-color:var(--x-warn); } @S .po-res.audit .po-st{ color:var(--x-warn); background:rgb(240 166 74 / .12); }
  @S .po-tag{ align-self:flex-start; font-size:18px; }
  @S .po-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .po{ grid-template-columns:1fr; grid-template-rows:auto 1fr; gap:14px; }
  @P .po-def .body{ font-size:21px; }
  @P .po-vs{ margin-top:0; }
  `,
  stages: [
    {
      title: 'A company rule',
      key: 'rule',
      desc: 'Customer data must stay in India. Writing it in a wiki won’t stop anyone.',
      status: 'requirement · data residency · India',
      say: "Contoso has a rule: customer data must stay in India. Writing that on a wiki page won't stop anyone from creating a resource in the United States.",
      run: (m) => {
        m.punch('.po-res.r1', 1);
        m.after(300, () => m.punch('.po-res.r2', 2));
      },
    },
    {
      title: 'Write it as a policy',
      key: 'policy',
      desc: 'A policy definition is the rule plus an effect, such as deny or audit.',
      status: 'definition · allowed locations',
      say: 'So they write it as an Azure Policy. A policy definition is a rule about resource properties, plus an effect, such as deny or audit.',
      run: (m) => {
        m.show('.po-def', 0);
        m.sfx.lock();
      },
    },
    {
      title: 'Assign it to a scope',
      key: 'Assign',
      desc: 'Assign it at a management group, subscription or resource group. Everything below inherits it.',
      status: 'assignment · Contoso-Prod',
      say: 'Next, they assign it at a scope, here the production subscription. Every resource group and resource inside inherits it.',
      run: (m) => {
        m.show('.po-scope', 0);
        m.after(500, () => m.particles('.po-flow', { from: '.po-scope', to: '.po-list', count: 8, duration: 900 }));
      },
    },
    {
      title: 'New resource in East US? Denied',
      key: 'Denied',
      desc: 'Creation is blocked before it happens. The one in Central India goes through.',
      status: 'vm-test-02 · eastus · DENY',
      say: 'Someone tries to create a VM in East US. Azure checks the policy and denies it before it is created. A database in Central India goes straight through.',
      run: (m) => {
        m.show('.po-res.r3', 0);
        m.after(700, () => { m.cls('.po-res.r3', 'deny'); m.text('.po-res.r3 .po-st', 'DENIED'); m.shake('.po-res.r3'); });
        m.after(1800, () => { m.show('.po-res.r4', 0); });
        m.after(2300, () => { m.cls('.po-res.r4, .po-res.r1', 'ok'); m.text('.po-res.r4 .po-st, .po-res.r1 .po-st', 'OK'); m.sfx.ding(); });
      },
    },
    {
      title: 'Old resources get flagged',
      key: 'flagged',
      desc: 'Existing resources aren’t deleted. They show as non-compliant on the dashboard.',
      status: 'compliance · 1 non-compliant',
      say: 'What about resources that broke the rule before it existed? They are not deleted. They are flagged as non-compliant on the compliance dashboard, so you can fix them.',
      run: (m) => {
        m.show('.po-comp', 0, true);
        m.cls('.po-res.r2', 'audit');
        m.text('.po-res.r2 .po-st', 'NON-COMPLIANT');
        m.punch('.po-res.r2', 2);
        m.after(300, () => {
          const c = m.q('.po-comp')!;
          c.classList.replace('ok', 'bad');
          m.count('.po-pct', 67, 900, { suffix: '%' });
        });
      },
    },
    {
      title: 'Other effects fix things',
      key: 'effects',
      desc: 'Modify can add a missing tag. Deploy-if-not-exists can add a missing setting. Group rules into initiatives.',
      status: 'effects · deny · audit · modify · deployIfNotExists',
      say: 'Policies can also fix things. A modify effect can add a missing tag, and deploy if not exists can switch on a missing setting. Related policies are grouped into initiatives.',
      run: (m) => {
        m.show('.po-tag', 0);
        m.text('.po-eff', 'modify');
        m.sfx.sparkle();
      },
    },
    {
      title: 'Policy is not RBAC',
      key: 'not RBAC',
      desc: 'Policy controls what resources look like. RBAC controls who can do what.',
      status: 'exam tip · Policy vs RBAC',
      say: 'One exam favourite. Azure Policy controls what your resources are allowed to look like. Role-based access control decides who is allowed to do what.',
      run: (m) => {
        m.show('.po-vs > *', 300);
        m.after(800, () => m.sfx.chime());
      },
    },
  ],
  end: {
    title: 'Define, assign, evaluate, enforce',
    sub: 'Azure Policy keeps every resource inside your rules, automatically, at any scope.',
  },
};

export default spec;
