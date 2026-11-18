import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const rev = (k: string, name: string, image: string, pop: boolean) => `
  <div class="cr-rev ${k} ${pop ? 'msd-pop' : 'msd-reveal'}">
    <div class="cr-rh"><span class="cr-lock">${I.lock}</span><b class="msd-mono">${name}</b><span class="cr-state">active</span></div>
    <div class="cr-img msd-mono">image: ${image}</div>
    <div class="cr-tw"><div class="cr-bar"><i></i></div><b class="cr-pct msd-mono">0%</b></div>
  </div>`;

const spec: ExplainerSpec = {
  id: 'container-revisions',
  lesson: 'azure-container-apps',
  title: {
    main: 'Every deploy is a snapshot. <em>You choose who sees it.</em>',
    sub: 'Environments, immutable revisions and traffic splitting in Azure Container Apps.',
  },
  summary: 'An animation of an Azure Container Apps environment holding the ragapi app, showing a template change creating a new immutable revision, switching to multiple revision mode, splitting traffic 80/20 between two revisions, and rolling back by moving all traffic to the old revision.',
  html: `
  <div class="cr">
    <div class="cr-cmd msd-card"><span class="cr-pr">$</span><span class="cr-cli msd-mono"></span></div>
    <div class="cr-env msd-card msd-reveal">
      <div class="cr-envh">
        <span class="msd-label">Environment · env-rag</span>
        <span class="cr-envp msd-stagger"><span class="msd-chip">${I.net}shared VNet</span><span class="msd-chip">${I.meter}Log Analytics</span></span>
      </div>
      <div class="cr-app msd-reveal">
        <div class="cr-apph">
          <span class="cr-aic">${I.app}</span><b>ragapi</b>
          <span class="cr-mode msd-pill">revision mode: <b class="cr-modev">single</b></span>
        </div>
        <div class="cr-ing msd-node"><span class="ic">${I.globe}</span><span>External ingress</span></div>
        <div class="cr-revs">
          ${rev('v14', 'ragapi--v14', 'ragapi:1.4.0', true)}
          ${rev('v15', 'ragapi--v15', 'ragapi:1.5.0', true)}
        </div>
        <div class="cr-scope msd-card msd-pop">
          <div class="cr-sc yes"><b>${I.check}New revision</b><span>image · env vars · CPU and memory · scale rules</span><em class="msd-mono">properties.template</em></div>
          <div class="cr-sc no"><b>${I.x}No new revision</b><span>ingress · secrets · traffic weights · revision mode</span><em class="msd-mono">properties.configuration</em></div>
        </div>
      </div>
    </div>
    <div class="cr-flow"></div>
  </div>`,
  css: `
  @S .cr{ position:relative; height:100%; display:flex; flex-direction:column; gap:18px; }
  @S .cr-cmd{ display:flex; align-items:flex-start; gap:14px; padding:16px 22px; min-height:70px; background:#0b0f18; }
  @S .cr-pr{ color:var(--x-ok); font-family:var(--x-mono); font-size:22px; font-weight:700; }
  @S .cr-cli{ color:var(--x-text); font-size:21px; line-height:1.45; word-break:break-word; }
  @S .cr-env{ flex:1; padding:20px 24px; display:flex; flex-direction:column; gap:16px; border-style:dashed; border-color:rgb(58 160 255 / .45); min-height:0; }
  @S .cr-envh{ display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
  @S .cr-envp{ display:flex; gap:10px; margin-left:auto; }
  @S .cr-app{ position:relative; flex:1; display:flex; flex-direction:column; gap:16px; padding:18px 20px; border-radius:22px; background:rgb(14 20 32 / .9); border:1.5px solid var(--x-line); }
  @S .cr-apph{ display:flex; align-items:center; gap:14px; color:#fff; font-size:28px; }
  @S .cr-aic{ width:48px; height:48px; border-radius:14px; display:grid; place-items:center; background:rgb(58 160 255 / .14); color:var(--x-a1); }
  @S .cr-aic svg{ width:28px; height:28px; }
  @S .cr-mode{ margin-left:auto; font-size:19px; transition:border-color .3s, color .3s; }
  @S .cr-mode b{ color:#fff; }
  @S .cr.multi .cr-mode{ border-color:rgb(63 185 80 / .6); color:var(--x-ok); }
  @S .cr-ing{ align-self:center; font-size:23px; padding:12px 20px; }
  @S .cr-ing .ic{ width:48px; height:48px; } @S .cr-ing .ic svg{ width:28px; height:28px; }
  @S .cr-revs{ flex:1; display:grid; grid-template-columns:1fr 1fr; gap:20px; align-content:end; }
  @S .cr-rev{ display:flex; flex-direction:column; gap:12px; padding:18px 20px; border-radius:20px; border:1.5px solid var(--x-line); background:linear-gradient(180deg, var(--x-panel), var(--x-panel-2)); transition:border-color .3s, opacity .3s, filter .3s; }
  @S .cr-rh{ display:flex; align-items:center; gap:10px; color:#fff; font-size:23px; }
  @S .cr-lock{ color:var(--x-dim); } @S .cr-lock svg{ width:24px; height:24px; }
  @S .cr-state{ margin-left:auto; font-size:16px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:4px 10px; border-radius:8px; color:var(--x-ok); background:rgb(63 185 80 / .14); }
  @S .cr-img{ color:var(--x-dim); font-size:20px; }
  @S .cr-tw{ display:flex; align-items:center; gap:14px; }
  @S .cr-bar{ flex:1; height:22px; border-radius:8px; background:rgb(255 255 255 / .06); overflow:hidden; }
  @S .cr-bar i{ display:block; height:100%; width:0; background:linear-gradient(90deg, var(--x-a1), var(--x-cyan)); transition:width .8s cubic-bezier(.22,1,.36,1); }
  @S .cr-pct{ min-width:76px; text-align:right; font-size:26px; color:var(--x-a1); }
  @S .cr-rev.w100 .cr-bar i{ width:100%; } @S .cr-rev.w80 .cr-bar i{ width:80%; } @S .cr-rev.w20 .cr-bar i{ width:20%; }
  @S .cr-rev.cr-lockon .cr-lock{ color:var(--x-a1); }
  @S .cr-rev.cr-new{ border-color:var(--x-a1); }
  @S .cr-rev.cr-bad{ border-color:var(--x-bad); }
  @S .cr-rev.cr-bad .cr-state{ color:var(--x-bad); background:rgb(244 74 106 / .14); }
  @S .cr-rev.cr-good{ border-color:var(--x-ok); }
  @S .cr-scope{ position:absolute; left:20px; right:20px; bottom:18px; z-index:7; padding:20px; display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  @S .cr-sc{ display:flex; flex-direction:column; gap:8px; padding:14px 16px; border-radius:16px; border:1.5px solid; }
  @S .cr-sc b{ display:flex; align-items:center; gap:8px; font-size:24px; }
  @S .cr-sc b svg{ width:26px; height:26px; }
  @S .cr-sc span{ color:var(--x-text); font-size:21px; line-height:1.4; }
  @S .cr-sc em{ font-style:normal; color:var(--x-dim); font-size:17px; }
  @S .cr-sc.yes{ border-color:rgb(63 185 80 / .55); background:rgb(63 185 80 / .08); } @S .cr-sc.yes b{ color:var(--x-ok); }
  @S .cr-sc.no{ border-color:rgb(240 166 74 / .55); background:rgb(240 166 74 / .08); } @S .cr-sc.no b{ color:var(--x-warn); }
  @S .cr-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .cr-cmd{ min-height:104px; }
  @P .cr-cli{ font-size:22px; }
  @P .cr-envp{ margin-left:0; }
  @P .cr-apph{ flex-wrap:wrap; }
  @P .cr-revs{ gap:14px; }
  @P .cr-rev{ padding:16px; }
  @P .cr-rh{ font-size:21px; flex-wrap:wrap; }
  @P .cr-state{ margin-left:0; }
  @P .cr-img{ font-size:19px; }
  @P .cr-scope{ grid-template-columns:1fr; }
  `,
  stages: [
    {
      title: 'Start with an environment',
      key: 'environment',
      desc: 'Apps live in an environment: one shared network and one Log Analytics workspace for logs.',
      status: 'az containerapp env create · env-rag',
      say: "In Container Apps, everything lives in an environment. Think of it as a boundary. Apps inside it share one network and send their logs to the same Log Analytics workspace.",
      run: (m) => {
        m.type('.cr-cli', 'az containerapp env create -n env-rag', 30);
        m.after(500, () => m.show('.cr-env', 0, true));
        m.after(900, () => m.show('.cr-envp > *', 250));
      },
    },
    {
      title: 'Deploy the app, get revision one',
      key: 'revision',
      desc: 'Creating ragapi makes its first revision: a read-only snapshot of the template, image 1.4.0.',
      status: 'ragapi--v14 · active · 100%',
      say: "Deploy the ragapi app, and Container Apps makes its first revision. A revision is a snapshot of the app's template: the image, the environment variables, the scale rules. You can't edit it afterwards.",
      run: (m) => {
        m.type('.cr-cli', 'az containerapp create -n ragapi --image ragapi:1.4.0 --ingress external', 22);
        m.after(700, () => m.show('.cr-app', 0, true));
        m.after(1100, () => m.show('.cr-rev.v14', 0));
        m.after(1500, () => {
          m.cls('.cr-rev.v14', 'w100');
          m.count('.cr-rev.v14 .cr-pct', 100, 700, { suffix: '%' });
          m.cls('.cr-rev.v14', 'cr-lockon');
          m.sfx.lock();
        });
        m.after(2200, () => m.stream('.cr-flow', { from: '.cr-ing', to: '.cr-rev.v14', count: 4, duration: 700, gap: 700 }));
      },
    },
    {
      title: 'Which changes make a revision',
      key: 'make a revision',
      desc: 'Template changes create a new revision. App-level settings like ingress and secrets apply to all revisions.',
      status: 'revision scope vs application scope',
      say: "Not every change makes a new revision. Change the image, an environment variable or a scale rule, and you get a new one. Change ingress, a secret or the traffic weights, and you don't. Those apply to the whole app.",
      run: (m) => {
        m.show('.cr-scope', 0, true);
        m.after(300, () => m.punch('.cr-sc.yes', 2));
        m.after(1400, () => m.punch('.cr-sc.no', 4));
      },
    },
    {
      title: 'Switch to multiple revision mode',
      key: 'multiple',
      desc: 'Single mode, the default, keeps one active revision. Multiple mode keeps several running so you can split traffic.',
      status: 'revision set-mode · multiple',
      say: "By default the app is in single revision mode, so a new revision replaces the old one. To run two side by side and split traffic between them, switch to multiple revision mode.",
      run: (m) => {
        m.hide('.cr-scope');
        m.type('.cr-cli', 'az containerapp revision set-mode -n ragapi --mode multiple', 24);
        m.after(1200, () => { m.text('.cr-modev', 'multiple'); m.cls('.cr', 'multi'); m.punch('.cr-mode', 3); });
      },
    },
    {
      title: 'New image, new revision',
      key: 'new revision',
      desc: 'Updating the image to 1.5.0 creates ragapi--v15. It starts with no traffic, and v14 keeps serving.',
      status: 'ragapi--v15 · active · 0%',
      say: "Now update the image to version one point five. That's a template change, so you get a brand new revision, v15. The old one is untouched and still takes all the traffic.",
      run: (m) => {
        m.type('.cr-cli', 'az containerapp update -n ragapi --image ragapi:1.5.0 --revision-suffix v15', 20);
        m.after(1300, () => { m.show('.cr-rev.v15', 0); m.cls('.cr-rev.v15', 'cr-new'); m.cls('.cr-rev.v15', 'cr-lockon'); m.sfx.lock(); });
        m.after(1600, () => m.stream('.cr-flow', { from: '.cr-ing', to: '.cr-rev.v14', count: 4, duration: 700, gap: 700, silent: true }));
      },
    },
    {
      title: 'Split traffic 80/20',
      key: '80/20',
      desc: 'Send most users to the proven revision and a small slice to the new one. Watch errors and answers.',
      status: 'traffic · v14 80% · v15 20%',
      say: "Next, split the traffic. Eighty percent stays on v14, twenty percent tries v15. You watch errors, latency and answer quality on that small slice before anyone else sees it.",
      run: (m) => {
        m.type('.cr-cli', 'az containerapp ingress traffic set -n ragapi --revision-weight ragapi--v14=80 ragapi--v15=20', 16);
        m.after(1600, () => {
          m.cls('.cr-rev.v14', 'w100', false);
          m.cls('.cr-rev.v14', 'w80');
          m.cls('.cr-rev.v15', 'w20');
          m.count('.cr-rev.v14 .cr-pct', 80, 700, { suffix: '%' });
          m.count('.cr-rev.v15 .cr-pct', 20, 700, { suffix: '%' });
          m.sfx.ding();
        });
        m.after(2100, () => {
          m.stream('.cr-flow', { from: '.cr-ing', to: '.cr-rev.v14', count: 4, duration: 700, gap: 600, silent: true });
          m.stream('.cr-flow', { from: '.cr-ing', to: '.cr-rev.v15', count: 1, duration: 700, gap: 1500 });
        });
      },
    },
    {
      title: 'Bad answers? Roll back',
      key: 'Roll back',
      desc: 'Move 100% back to v14. Revisions never change, so there is nothing to rebuild or redeploy.',
      status: 'rollback · v14 100% · v15 0%',
      say: "Say v15 gives worse answers. Rolling back is just moving the weights: a hundred percent back to v14. Nothing gets rebuilt. If v15 had looked good, you'd move the hundred percent to it instead.",
      run: (m) => {
        m.cls('.cr-rev.v15', 'cr-new', false);
        m.cls('.cr-rev.v15', 'cr-bad');
        m.text('.cr-rev.v15 .cr-state', 'errors ↑');
        m.shake('.cr-rev.v15');
        m.after(900, () => m.type('.cr-cli', 'az containerapp ingress traffic set -n ragapi --revision-weight ragapi--v14=100 ragapi--v15=0', 16));
        m.after(2600, () => {
          m.cls('.cr-rev.v14', 'w80', false);
          m.cls('.cr-rev.v14', 'w100');
          m.cls('.cr-rev.v15', 'w20', false);
          m.cls('.cr-rev.v14', 'cr-good');
          m.count('.cr-rev.v14 .cr-pct', 100, 600, { suffix: '%' });
          m.count('.cr-rev.v15 .cr-pct', 0, 600, { suffix: '%' });
          m.sfx.chime();
        });
        m.after(3000, () => m.stream('.cr-flow', { from: '.cr-ing', to: '.cr-rev.v14', count: 4, duration: 700, gap: 600 }));
      },
    },
  ],
  end: {
    title: 'Revisions make releases reversible',
    sub: 'Template change = new revision. Multiple mode plus traffic weights gives you canaries and one-command rollbacks.',
  },
};

export default spec;
