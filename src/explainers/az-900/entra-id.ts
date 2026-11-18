import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const app = (k: string, name: string, icon: string) =>
  `<div class="en-app ${k}"><span class="ic">${icon}</span><b>${name}</b><i class="en-lock">${I.lock}</i><i class="en-ok">${I.check}</i></div>`;

const spec: ExplainerSpec = {
  id: 'entra-id',
  lesson: 'microsoft-entra-id',
  title: {
    main: 'One sign-in. <em>Every app.</em>',
    sub: 'What Microsoft Entra ID does when you sign in, and how it reaches on-premises and legacy apps too.',
  },
  summary: 'An animation of an employee signing in once to Microsoft Entra ID with a password and multifactor authentication, then reaching Microsoft 365, the Azure portal, a SaaS app and an internal app through single sign-on, with a registered device, Entra Connect syncing on-premises Active Directory, and Entra Domain Services for a legacy app.',
  html: `
  <div class="en">
    <div class="en-user msd-card">
      <span class="en-av">${I.user}</span><b>Priya</b><small class="msd-mono">priya@contoso.in</small>
      <div class="en-pw msd-reveal"><span class="msd-mono">••••••••••</span></div>
      <div class="en-mfa msd-reveal">${I.key}<span>Approve sign-in? <b>Yes</b></span></div>
      <div class="en-dev msd-reveal msd-pill ok">${I.app}Laptop · registered</div>
    </div>
    <div class="en-core">
      <div class="en-tenant msd-node"><span class="ic">${I.shield}</span><span>Microsoft Entra ID<small>formerly Azure AD</small></span></div>
      <div class="en-token msd-pill accent msd-reveal">${I.tag}<span>token</span></div>
      <div class="en-sync msd-reveal"><div class="en-ad">${I.building}<span>On-premises AD</span></div><span class="msd-chip">Entra Connect · sync</span></div>
    </div>
    <div class="en-apps">
      ${app('a1', 'Microsoft 365', I.file)}${app('a2', 'Azure portal', I.cloud)}${app('a3', 'Salesforce (SaaS)', I.app)}${app('a4', 'HR app (internal)', I.users)}
      <div class="en-legacy msd-reveal"><span class="ic">${I.server}</span><b>Legacy app</b><small>LDAP · Kerberos · domain join</small><span class="msd-chip">Entra Domain Services</span></div>
    </div>
    <div class="en-flow"></div>
  </div>`,
  css: `
  @S .en{ position:relative; height:100%; display:grid; grid-template-columns:1fr 1fr 1.1fr; gap:20px; align-items:center; }
  @S .en-user{ padding:22px; display:flex; flex-direction:column; align-items:center; gap:12px; text-align:center; }
  @S .en-av{ width:84px; height:84px; border-radius:50%; display:grid; place-items:center; background:rgb(180 140 255 / .16); color:var(--x-you); }
  @S .en-av svg{ width:48px; height:48px; }
  @S .en-user b{ color:#fff; font-size:30px; } @S .en-user small{ color:var(--x-dim); font-size:19px; }
  @S .en-pw{ padding:10px 16px; border-radius:12px; background:rgb(255 255 255 / .06); color:#fff; font-size:24px; }
  @S .en-mfa{ display:flex; align-items:center; gap:10px; padding:12px 16px; border-radius:14px; background:rgb(63 185 80 / .1); border:1.5px solid rgb(63 185 80 / .5); font-size:21px; color:var(--x-text); }
  @S .en-mfa svg{ width:28px; height:28px; color:var(--x-ok); } @S .en-mfa b{ color:var(--x-ok); }
  @S .en-dev{ font-size:19px; }
  @S .en-core{ display:flex; flex-direction:column; align-items:center; gap:20px; }
  @S .en-tenant{ flex-direction:column; text-align:center; padding:26px; }
  @S .en-tenant .ic{ width:90px; height:90px; border-radius:24px; } @S .en-tenant .ic svg{ width:54px; height:54px; }
  @S .en-tenant small{ display:block; color:var(--x-dim); font-size:18px; font-family:var(--x-mono); margin-top:6px; }
  @S .en-sync{ display:flex; flex-direction:column; align-items:center; gap:10px; }
  @S .en-ad{ display:flex; align-items:center; gap:10px; padding:12px 16px; border-radius:14px; border:1.5px dashed var(--x-warn); color:var(--x-warn); font-size:21px; font-weight:700; }
  @S .en-ad svg{ width:30px; height:30px; }
  @S .en-apps{ display:flex; flex-direction:column; gap:12px; }
  @S .en-app, @S .en-legacy{ position:relative; display:flex; align-items:center; gap:14px; padding:14px 16px; border-radius:18px; border:1.5px solid var(--x-line); background:linear-gradient(180deg, var(--x-panel), var(--x-panel-2)); transition:border-color .3s, box-shadow .3s; }
  @S .en-app .ic, @S .en-legacy .ic{ width:48px; height:48px; border-radius:13px; display:grid; place-items:center; background:rgb(58 160 255 / .12); color:var(--x-a1); flex-shrink:0; }
  @S .en-app .ic svg, @S .en-legacy .ic svg{ width:28px; height:28px; }
  @S .en-app b, @S .en-legacy b{ color:#fff; font-size:22px; }
  @S .en-app i{ margin-left:auto; width:30px; height:30px; } @S .en-app i svg{ width:30px; height:30px; }
  @S .en-lock{ color:var(--x-dim); } @S .en-ok{ display:none; color:var(--x-ok); }
  @S .en-app.in{ border-color:var(--x-ok); box-shadow:0 0 0 1px var(--x-ok); }
  @S .en-app.in .en-lock{ display:none; } @S .en-app.in .en-ok{ display:block; }
  @S .en-legacy{ flex-wrap:wrap; border-style:dashed; }
  @S .en-legacy small{ width:100%; color:var(--x-dim); font-family:var(--x-mono); font-size:17px; }
  @S .en-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .en{ grid-template-columns:1fr; grid-template-rows:auto auto 1fr; gap:14px; }
  @P .en-user{ flex-direction:row; flex-wrap:wrap; justify-content:center; padding:16px; }
  @P .en-av{ width:64px; height:64px; }
  @P .en-core{ flex-direction:row; justify-content:center; flex-wrap:wrap; gap:12px; }
  @P .en-tenant{ flex-direction:row; padding:16px; text-align:left; }
  @P .en-tenant .ic{ width:64px; height:64px; }
  @P .en-apps{ display:grid; grid-template-columns:1fr 1fr; }
  @P .en-legacy{ grid-column:1 / -1; }
  `,
  stages: [
    {
      title: 'Too many passwords',
      key: 'passwords',
      desc: 'Without a central identity, every app has its own account and its own password.',
      status: '4 apps · 4 passwords · 0 signed in',
      say: 'Priya uses four apps at work. Without a central identity, that means four accounts, four passwords and four ways to get locked out.',
      run: (m) => {
        m.qa('.en-app').forEach((_, i) => m.after(i * 200, () => m.punch(`.en-app.a${i + 1}`, i)));
      },
    },
    {
      title: 'Sign in once to Entra ID',
      key: 'Entra ID',
      desc: 'Microsoft Entra ID is Microsoft’s cloud identity service. It checks who you are.',
      status: 'authenticate · priya@contoso.in',
      thinking: true,
      say: "Microsoft Entra ID, which used to be called Azure Active Directory, is Microsoft's cloud identity service. Priya signs in to it once with her password.",
      run: (m) => {
        m.show('.en-pw', 0);
        m.after(600, () => m.particles('.en-flow', { from: '.en-pw', to: '.en-tenant', count: 6, duration: 800 }));
        m.after(1400, () => m.cls('.en-tenant', 'hot'));
      },
    },
    {
      title: 'Prove it with MFA',
      key: 'MFA',
      desc: 'Multifactor authentication adds a second check, like approving on your phone.',
      status: 'MFA · approved on phone',
      say: 'Then multifactor authentication asks for a second proof, like approving the sign-in on her phone. A stolen password alone is no longer enough.',
      run: (m) => {
        m.show('.en-mfa', 0);
        m.after(900, () => m.sfx.chime());
      },
    },
    {
      title: 'Single sign-on to every app',
      key: 'Single sign-on',
      desc: 'Entra ID issues a token, and each connected app trusts it. No more passwords.',
      status: 'SSO · 4 of 4 apps',
      say: 'Entra ID gives her a token, and every connected app trusts it. That is single sign-on. Microsoft 365, the Azure portal, a SaaS app and an internal app all open without another password.',
      run: (m) => {
        m.show('.en-token', 0);
        [1, 2, 3, 4].forEach((n, i) => m.after(500 + i * 450, () => {
          m.particles('.en-flow', { from: '.en-token', to: `.en-app.a${n}`, count: 4, duration: 600 });
          m.after(600, () => { m.cls(`.en-app.a${n}`, 'in'); m.sfx.blip(i + 2); });
        }));
      },
    },
    {
      title: 'Devices count too',
      key: 'Devices',
      desc: 'Register devices in Entra ID and use them in access rules, such as company laptops only.',
      status: 'device · registered · compliant',
      say: 'Devices can be registered in Entra ID too, so access rules can say, for example, only company laptops may open payroll.',
      run: (m) => {
        m.show('.en-dev', 0);
        m.sfx.lock();
      },
    },
    {
      title: 'Bring on-premises users along',
      key: 'on-premises',
      desc: 'Microsoft Entra Connect syncs accounts from your own Active Directory to the cloud.',
      status: 'Entra Connect · sync every 30 min',
      say: 'Already have Active Directory on your own servers? Microsoft Entra Connect syncs those users to the cloud, so people keep one identity.',
      run: (m) => {
        m.show('.en-sync', 0);
        m.after(400, () => m.stream('.en-flow', { from: '.en-ad', to: '.en-tenant', count: 4, duration: 800, gap: 800 }));
      },
    },
    {
      title: 'Legacy apps: Domain Services',
      key: 'Domain Services',
      desc: 'Old apps that need LDAP, Kerberos or domain join get them, with Microsoft running the domain controllers.',
      status: 'Entra Domain Services · managed domain',
      say: 'And for older apps that need LDAP, Kerberos or domain join, Microsoft Entra Domain Services provides a managed domain, without you running domain controllers.',
      run: (m) => {
        m.show('.en-legacy', 0);
        m.after(600, () => m.sfx.resolve());
      },
    },
  ],
  end: {
    title: 'Entra ID: who you are, everywhere you go',
    sub: 'Authentication, MFA, single sign-on, app and device management, in one cloud identity service.',
  },
};

export default spec;
