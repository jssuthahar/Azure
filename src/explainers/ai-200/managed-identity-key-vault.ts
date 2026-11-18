import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const ver = (n: number) =>
  `<div class="mik-ver mik-v${n}${n === 1 ? ' show' : ''}"><span class="msd-mono">v${n}</span><span class="mik-dots msd-mono">••••••••</span><span class="mik-latest">latest</span></div>`;

const spec: ExplainerSpec = {
  id: 'managed-identity-key-vault',
  lesson: 'key-vault-secrets',
  title: {
    main: 'No keys in code. <em>Ask the vault.</em>',
    sub: 'Managed identity, a Microsoft Entra token, an RBAC role, secret versions and event-driven rotation.',
  },
  summary: 'An animation of a chat API whose model key is pushed to a public GitHub repo, then fixed: the app gets a managed identity, Microsoft Entra ID issues it a token, Key Vault checks the Key Vault Secrets User role and returns the secret, each write stacks a new secret version that apps read as latest, and a SecretNearExpiry event goes through Event Grid to a rotation function that writes a new version.',
  html: `
  <div class="mik">
    <div class="mik-app msd-card">
      <div class="mik-h"><span class="mik-ic">${I.app}</span><span><b>chat-api</b><small>container app</small></span>
        <span class="mik-mi msd-pill accent msd-pop">${I.user}<span>managed identity</span></span></div>
      <div class="mik-code msd-editor"><div class="body">
        <div class="mik-c1"><span class="kw">KEY</span> = <span class="st">"sk-live-9f2c…"</span> <span class="cm"># example</span></div>
        <div class="mik-c2 msd-reveal">cred = <span class="fn">DefaultAzureCredential</span>()</div>
        <div class="mik-c3 msd-reveal">client.<span class="fn">get_secret</span>(<span class="st">"openai-api-key"</span>)</div>
        <div class="mik-c4 msd-reveal"><span class="cm"># → version </span><span class="mik-got">v1</span><span class="cm"> (latest)</span></div>
      </div></div>
      <div class="mik-tok msd-pill ok msd-pop">${I.tag}<span>Entra token</span></div>
    </div>
    <div class="mik-git msd-node"><span class="ic">${I.code}</span><span><b class="mik-gt">Public GitHub repo</b><small class="mik-gs">waiting for a push</small></span></div>
    <div class="mik-entra msd-node"><span class="ic">${I.shield}</span><span><b>Microsoft Entra ID</b><small>issues tokens</small></span></div>
    <div class="mik-kv msd-card">
      <div class="mik-h"><span class="mik-ic">${I.key}</span><span><b>Key Vault</b><small>kv-tailspin-prod</small></span></div>
      <div class="mik-role msd-chip msd-reveal">RBAC · Key Vault Secrets User</div>
      <div class="msd-label mik-sn">secret · openai-api-key</div>
      <div class="mik-vers">${ver(3)}${ver(2)}${ver(1)}</div>
    </div>
    <div class="mik-eg msd-node msd-reveal"><span class="ic">${I.bolt}</span><span><b>Event Grid</b><small class="msd-mono">SecretNearExpiry</small></span></div>
    <div class="mik-fn msd-node msd-reveal"><span class="ic">${I.gear}</span><span><b>Rotation function</b><small>Key Vault Secrets Officer</small></span></div>
    <div class="mik-flow"></div>
  </div>`,
  css: `
  @S .mik{ position:relative; height:100%; display:grid; gap:18px; grid-template-columns:1.25fr 0.85fr 1fr; grid-template-rows:1fr auto; grid-template-areas:"app entra kv" "git eg fn"; }
  @S .mik-app{ grid-area:app; padding:18px; display:flex; flex-direction:column; gap:14px; min-width:0; transition:border-color .3s, box-shadow .3s; }
  @S .mik-app.mik-bad{ border-color:var(--x-bad); box-shadow:0 0 0 1px var(--x-bad); }
  @S .mik-h{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
  @S .mik-h b{ display:block; color:#fff; font-size:24px; } @S .mik-h small{ display:block; color:var(--x-dim); font-size:17px; font-family:var(--x-mono); }
  @S .mik-ic{ width:52px; height:52px; border-radius:14px; display:grid; place-items:center; background:rgb(58 160 255 / .12); color:var(--x-a1); flex-shrink:0; }
  @S .mik-ic svg{ width:30px; height:30px; }
  @S .mik-mi{ font-size:17px; padding:7px 14px; } @S .mik-mi svg{ width:22px; height:22px; }
  @S .mik-code .body{ font-size:17px; line-height:1.7; padding:14px 16px; }
  @S .mik-code .body > div{ white-space:nowrap; }
  @S .mik-c1{ transition:opacity .3s; } @S .mik-c1.mik-gone{ text-decoration:line-through; opacity:.4; }
  @S .mik-got{ color:var(--x-ok); font-weight:700; }
  @S .mik-tok{ align-self:flex-start; font-size:19px; }
  @S .msd-node b{ display:block; color:#fff; font-size:22px; } @S .msd-node small{ display:block; color:var(--x-dim); font-size:16px; margin-top:3px; font-weight:600; }
  @S .mik-git{ grid-area:git; transition:all .3s; }
  @S .mik-entra{ grid-area:entra; flex-direction:column; text-align:center; justify-content:center; align-self:center; }
  @S .mik-entra.mik-lit{ border-color:var(--x-a1); box-shadow:0 0 0 1px var(--x-a1), 0 0 40px rgb(58 160 255 / .25); }
  @S .mik-kv{ grid-area:kv; padding:18px; display:flex; flex-direction:column; gap:12px; min-width:0; transition:border-color .3s, box-shadow .3s; }
  @S .mik-kv.mik-lit{ border-color:var(--x-ok); box-shadow:0 0 0 1px var(--x-ok), 0 0 40px rgb(63 185 80 / .2); }
  @S .mik-role{ align-self:flex-start; font-size:17px; }
  @S .mik-sn{ font-size:17px; }
  @S .mik-vers{ display:flex; flex-direction:column; gap:8px; }
  @S .mik-ver{ display:none; align-items:center; gap:12px; padding:10px 14px; border-radius:12px; border:1.5px solid var(--x-line); background:rgb(14 20 32 / .9); color:var(--x-text); font-size:20px; }
  @S .mik-ver.show{ display:flex; animation:mik-in .35s ease; }
  @S .mik-dots{ color:var(--x-dim); }
  @S .mik-latest{ margin-left:auto; display:none; font-size:15px; font-weight:700; padding:3px 10px; border-radius:100px; background:rgb(63 185 80 / .18); color:var(--x-ok); }
  @S .mik-ver.mik-top{ border-color:var(--x-ok); } @S .mik-ver.mik-top .mik-latest{ display:inline-block; }
  @S .mik-ver:not(.mik-top){ opacity:.6; }
  @S .mik-eg{ grid-area:eg; } @S .mik-fn{ grid-area:fn; }
  @S .mik-eg.mik-lit, @S .mik-fn.mik-lit{ border-color:var(--x-warn); box-shadow:0 0 0 1px var(--x-warn); }
  @S .mik-eg.mik-lit .ic, @S .mik-fn.mik-lit .ic{ background:rgb(240 166 74 / .18); color:var(--x-warn); }
  @S .mik-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @keyframes mik-in{ from{ opacity:0; } to{ opacity:1; } }
  @P .mik{ grid-template-columns:1fr 1fr; grid-template-rows:auto auto 1fr auto; grid-template-areas:"app app" "git entra" "kv kv" "eg fn"; gap:16px; }
  @P .mik-code .body{ font-size:22px; }
  @P .mik-entra{ flex-direction:row; text-align:left; align-self:stretch; justify-content:flex-start; }
  @P .mik-kv{ display:grid; grid-template-columns:1fr 1fr; align-content:start; column-gap:18px; }
  @P .mik-kv .mik-h, @P .mik-role, @P .mik-sn{ grid-column:1; }
  @P .mik-vers{ grid-column:2; grid-row:1 / span 3; }
  `,
  stages: [
    {
      title: 'A key in code gets leaked',
      key: 'leaked',
      desc: 'The model API key sits in the source. One push to a public repo and bots find it within minutes.',
      status: 'git push · secret in repo · exposed',
      say: "Here's how it usually goes wrong. The model API key sits right in the code. Someone pushes to a public GitHub repo, and bots that scan for keys find it within minutes.",
      run: (m) => {
        m.after(400, () => m.particles('.mik-flow', { from: '.mik-c1', to: '.mik-git', count: 6, duration: 900, color: '#f44a6a' }));
        m.after(1300, () => {
          m.cls('.mik-git', 'down');
          m.cls('.mik-app', 'mik-bad');
          m.text('.mik-gs', 'key exposed');
          m.shake('.mik-git');
        });
      },
    },
    {
      title: 'Give the app an identity instead',
      key: 'identity',
      desc: 'Azure creates a managed identity for the app. DefaultAzureCredential uses it, so the code holds no secret.',
      status: 'system-assigned managed identity · on',
      say: "So take the key out. Turn on a managed identity, and Azure gives the app its own identity. In code you just create a DefaultAzureCredential. There's no secret left in the repo to leak.",
      run: (m) => {
        m.cls('.mik-app', 'mik-bad', false);
        m.cls('.mik-git', 'down', false);
        m.cls('.mik-git', 'ok');
        m.text('.mik-gs', 'nothing to leak');
        m.cls('.mik-c1', 'mik-gone');
        m.show('.mik-c2', 0, true);
        m.after(500, () => { m.show('.mik-mi', 0, true); m.sfx.lock(); });
      },
    },
    {
      title: 'Entra ID hands over a token',
      key: 'token',
      desc: 'The identity asks Microsoft Entra ID for an access token for Key Vault. No password is sent.',
      status: 'token request · audience vault.azure.net',
      thinking: true,
      say: "When the app needs the key, its identity asks Microsoft Entra ID for a token. No password goes over the wire. Azure handles the identity's credentials for you.",
      run: (m) => {
        m.cls('.mik-git', 'msd-recede');
        m.particles('.mik-flow', { from: '.mik-mi', to: '.mik-entra', count: 5, duration: 700 });
        m.after(700, () => m.cls('.mik-entra', 'mik-lit'));
        m.after(1000, () => m.particles('.mik-flow', { from: '.mik-entra', to: '.mik-tok', count: 5, duration: 700, color: '#3fb950' }));
        m.after(1700, () => m.show('.mik-tok', 0));
      },
    },
    {
      title: 'Key Vault checks the role',
      key: 'role',
      desc: 'Azure RBAC decides. Key Vault Secrets User can read secret values, and that’s all the app needs.',
      status: 'RBAC · Key Vault Secrets User · allowed',
      say: "The app shows that token to Key Vault. Key Vault checks Azure RBAC. The app has Key Vault Secrets User, which lets it read secret values and nothing more.",
      run: (m) => {
        m.cls('.mik-entra', 'mik-lit', false);
        m.particles('.mik-flow', { from: '.mik-tok', to: '.mik-kv', count: 5, duration: 800 });
        m.after(800, () => { m.show('.mik-role', 0); m.sfx.lock(); });
      },
    },
    {
      title: 'The secret comes back',
      key: 'secret',
      desc: 'SecretClient.get_secret returns the value. The app keeps it in memory instead of asking on every request.',
      status: 'get_secret · 200 OK · v1',
      say: "Access granted. get secret returns the value, and the app keeps it in memory, so it isn't calling the vault on every single request.",
      run: (m) => {
        m.show('.mik-c3', 0, true);
        m.cls('.mik-v1', 'mik-top');
        m.cls('.mik-kv', 'mik-lit');
        m.after(500, () => m.particles('.mik-flow', { from: '.mik-v1', to: '.mik-c3', count: 6, duration: 800, color: '#3fb950' }));
        m.after(1300, () => { m.show('.mik-c4', 0, true); m.sfx.chime(); });
      },
    },
    {
      title: 'Every write is a new version',
      key: 'new version',
      desc: 'set_secret never overwrites. It stacks a version, and apps that ask for the latest get it on their next read.',
      status: 'set_secret · v2 created · latest = v2',
      say: "Every time you set a secret, Key Vault stacks a new version on top. The old one stays. Apps that ask for the latest pick up the new value next time they refresh. Pin a version, and rotation never reaches you.",
      run: (m) => {
        m.cls('.mik-kv', 'mik-lit', false);
        m.cls('.mik-v2', 'show');
        m.cls('.mik-v1', 'mik-top', false);
        m.cls('.mik-v2', 'mik-top');
        m.sfx.pop();
        m.after(900, () => { m.text('.mik-got', 'v2'); m.punch('.mik-c4', 2); });
      },
    },
    {
      title: 'Near expiry? An event fires',
      key: 'event',
      desc: 'Key Vault publishes SecretNearExpiry 30 days before expires_on. Event Grid triggers a rotation function.',
      status: 'Microsoft.KeyVault.SecretNearExpiry → Event Grid',
      say: "Give the secret an expiry date. Thirty days before it, Key Vault publishes a Secret Near Expiry event. Event Grid delivers it to a function that has the Secrets Officer role.",
      run: (m) => {
        m.show('.mik-eg, .mik-fn', 200);
        m.after(400, () => m.particles('.mik-flow', { from: '.mik-kv', to: '.mik-eg', count: 5, duration: 800, color: '#f0a64a' }));
        m.after(1200, () => m.cls('.mik-eg', 'mik-lit'));
        m.after(1500, () => m.particles('.mik-flow', { from: '.mik-eg', to: '.mik-fn', count: 5, duration: 700, color: '#f0a64a' }));
        m.after(2200, () => { m.cls('.mik-fn', 'mik-lit'); m.sfx.ding(); });
      },
    },
    {
      title: 'The function writes v3',
      key: 'v3',
      desc: 'It makes a new key at the source and saves it as a new version. Keys have rotation policies; secrets don’t.',
      status: 'rotation · v3 latest · no redeploy',
      say: "The function makes a fresh key at the source and saves it as version three. The app picks it up on its next refresh, with no redeploy. Keys in Key Vault have a built-in rotation policy. Secrets don't, so this event and function is how you rotate them.",
      run: (m) => {
        m.cls('.mik-eg', 'mik-lit', false);
        m.particles('.mik-flow', { from: '.mik-fn', to: '.mik-vers', count: 6, duration: 800, color: '#3fb950' });
        m.after(800, () => {
          m.cls('.mik-v3', 'show');
          m.cls('.mik-v2', 'mik-top', false);
          m.cls('.mik-v3', 'mik-top');
          m.sfx.pop();
        });
        m.after(1700, () => { m.text('.mik-got', 'v3'); m.punch('.mik-c4', 3); m.sfx.resolve(); });
      },
    },
  ],
  end: {
    title: 'Identity in, secret out, versions roll',
    sub: 'Managed identity plus Key Vault Secrets User reads the latest version. Event Grid and a function rotate it.',
  },
};

export default spec;
