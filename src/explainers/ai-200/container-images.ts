import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const host = (k: string, icon: string, name: string) => `
  <div class="ci-host ci-${k} msd-pop">
    <span class="ci-hic">${icon}</span>
    <span class="ci-ht"><b>${name}</b><span class="ci-run msd-mono">ragapi:1.4.0</span></span>
  </div>`;

const spec: ExplainerSpec = {
  id: 'container-images',
  lesson: 'containers-for-ai-apps',
  title: {
    main: 'Build it once. <em>Run it anywhere on Azure.</em>',
    sub: 'How a Dockerfile becomes an image, how Azure Container Registry versions it, and why one image runs on App Service, Container Apps and AKS.',
  },
  summary: 'An animation that turns a Python app and its Dockerfile into a layered container image, pushes it to Azure Container Registry with a version tag and a digest, runs the same image on App Service, Azure Container Apps and AKS, and shows how a moving latest tag leaves two hosts running different builds.',
  html: `
  <div class="ci">
    <div class="ci-build">
      <div class="ci-df msd-editor">
        <div class="ed-bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span class="ci-fn">Dockerfile</span></div>
        <div class="body">
          <div class="ci-ln l1"><span class="kw">FROM</span> python:3.12-slim</div>
          <div class="ci-ln l2"><span class="kw">WORKDIR</span> /app</div>
          <div class="ci-ln l3"><span class="kw">COPY</span> requirements.txt .</div>
          <div class="ci-ln l4"><span class="kw">RUN</span> pip install -r requirements.txt</div>
          <div class="ci-ln l5"><span class="kw">COPY</span> . .</div>
          <div class="ci-ln l6"><span class="kw">CMD</span> [<span class="st">"uvicorn"</span>, <span class="st">"main:app"</span>]</div>
        </div>
      </div>
      <div class="ci-img msd-card">
        <div class="msd-label">Image · read-only layers</div>
        <div class="ci-stack">
          <div class="ci-layer y1 msd-pop"><span>${I.layers}</span><b>python:3.12-slim</b><em>base</em></div>
          <div class="ci-layer y2 msd-pop"><span>${I.file}</span><b>pip packages</b><em>requirements</em></div>
          <div class="ci-layer y3 msd-pop"><span>${I.code}</span><b>your code</b><em>COPY . .</em></div>
          <div class="ci-layer y4 msd-pop"><span>${I.play}</span><b>start command</b><em>CMD</em></div>
        </div>
        <div class="ci-name msd-reveal msd-mono">ragapi:1.4.0</div>
      </div>
    </div>
    <div class="ci-acr msd-card msd-reveal">
      <div class="ci-acrh"><span class="ci-aic">${I.db}</span><b class="msd-mono">myreg.azurecr.io/ragapi</b><span class="msd-label ci-acrl">Azure Container Registry</span></div>
      <div class="ci-row ci-ra">
        <span class="msd-chip ci-tag">1.4.0</span>
        <span class="ci-latest ci-la msd-pop">latest</span>
        <span class="ci-dig msd-mono">sha256:<i class="ci-d1"></i><small>example</small></span>
      </div>
      <div class="ci-row ci-rb msd-reveal">
        <span class="msd-chip ci-tag">1.5.0</span>
        <span class="ci-latest ci-lb msd-pop">latest</span>
        <span class="ci-dig msd-mono">sha256:<i class="ci-d2"></i><small>example</small></span>
      </div>
      <div class="ci-tvd msd-stagger">
        <span class="msd-pill accent">${I.tag}Tag = your label, it can move</span>
        <span class="msd-pill ok">${I.lock}Digest = fixed fingerprint</span>
      </div>
    </div>
    <div class="ci-hosts">
      ${host('as', I.app, 'App Service')}${host('ca', I.cloud, 'Container Apps')}${host('ak', I.gear, 'AKS')}
    </div>
    <div class="ci-note">
      <span class="ci-warn msd-pill bad msd-pop">${I.warn}Same tag, two different builds</span>
      <span class="ci-rule msd-stagger"><span class="msd-pill ok">${I.check}Deploy a unique tag or the digest</span><span class="msd-pill accent">${I.key}Pull with a managed identity (AcrPull)</span></span>
    </div>
    <div class="ci-flow"></div>
  </div>`,
  css: `
  @S .ci{ position:relative; height:100%; display:flex; flex-direction:column; gap:18px; }
  @S .ci-build{ display:grid; grid-template-columns:1.1fr 1fr; gap:20px; }
  @S .ci-df .ed-bar span{ margin-left:12px; color:#bbb; font-family:var(--x-mono); font-size:18px; }
  @S .ci-df .body{ font-size:21px; line-height:1.6; padding:16px 22px; }
  @S .ci-ln{ white-space:nowrap; padding:0 8px; margin:0 -8px; border-radius:6px; transition:background .3s; }
  @S .ci-ln.ci-on{ background:rgb(58 160 255 / .2); }
  @S .ci-img{ padding:16px 18px; display:flex; flex-direction:column; gap:10px; transition:border-color .3s, box-shadow .3s; }
  @S .ci-stack{ display:flex; flex-direction:column-reverse; gap:8px; }
  @S .ci-layer{ display:flex; align-items:center; gap:12px; padding:8px 14px; border-radius:12px; border:1.5px solid; font-size:21px; }
  @S .ci-layer span svg{ width:24px; height:24px; }
  @S .ci-layer b{ color:#fff; font-weight:700; }
  @S .ci-layer em{ margin-left:auto; font-style:normal; font-family:var(--x-mono); font-size:17px; color:var(--x-dim); }
  @S .ci-layer.y1{ background:rgb(58 160 255 / .14); border-color:rgb(58 160 255 / .5); color:var(--x-a1); }
  @S .ci-layer.y2{ background:rgb(180 140 255 / .14); border-color:rgb(180 140 255 / .5); color:var(--x-you); }
  @S .ci-layer.y3{ background:rgb(63 185 80 / .14); border-color:rgb(63 185 80 / .5); color:var(--x-ok); }
  @S .ci-layer.y4{ background:rgb(34 211 238 / .12); border-color:rgb(34 211 238 / .5); color:var(--x-cyan); }
  @S .ci-name{ align-self:center; font-size:24px; color:#fff; padding:6px 18px; border-radius:100px; border:1.5px solid rgb(58 160 255 / .5); }
  @S .ci-acr{ padding:16px 20px; display:flex; flex-direction:column; gap:10px; }
  @S .ci-acrh{ display:flex; align-items:center; gap:12px; font-size:23px; color:#fff; }
  @S .ci-aic{ width:44px; height:44px; border-radius:12px; display:grid; place-items:center; background:rgb(58 160 255 / .14); color:var(--x-a1); }
  @S .ci-aic svg{ width:26px; height:26px; }
  @S .ci-acrl{ margin-left:auto; font-size:17px; }
  @S .ci-row{ display:flex; align-items:center; gap:12px; padding:6px 10px; border-radius:12px; background:rgb(255 255 255 / .04); }
  @S .ci-dig{ margin-left:auto; color:var(--x-dim); font-size:20px; }
  @S .ci-dig i{ font-style:normal; color:var(--x-text); }
  @S .ci-dig small{ margin-left:10px; font-size:15px; color:var(--x-dim); text-transform:uppercase; letter-spacing:1px; }
  @S .ci-latest{ padding:5px 12px; border-radius:9px; font-family:var(--x-mono); font-size:19px; font-weight:700; color:#0e1420; background:var(--x-warn); }
  @S .ci-tvd{ display:flex; gap:12px; flex-wrap:wrap; }
  @S .ci-tvd .msd-pill{ font-size:18px; padding:7px 14px; }
  @S .ci-hosts{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  @S .ci-host{ display:flex; align-items:center; gap:14px; padding:14px 18px; border-radius:20px; border:1.5px solid var(--x-line); background:linear-gradient(180deg, var(--x-panel), var(--x-panel-2)); transition:border-color .3s; }
  @S .ci-hic{ width:50px; height:50px; flex-shrink:0; border-radius:14px; display:grid; place-items:center; background:rgb(58 160 255 / .12); color:var(--x-a1); }
  @S .ci-hic svg{ width:30px; height:30px; }
  @S .ci-ht{ display:flex; flex-direction:column; align-items:flex-start; gap:6px; min-width:0; }
  @S .ci-host b{ color:#fff; font-size:23px; white-space:nowrap; }
  @S .ci-run{ font-size:18px; color:var(--x-dim); padding:4px 10px; border-radius:8px; background:rgb(255 255 255 / .05); white-space:nowrap; transition:color .3s, background .3s; }
  @S .ci-host.ci-live{ border-color:var(--x-ok); }
  @S .ci-host.ci-live .ci-run{ color:var(--x-ok); background:rgb(63 185 80 / .14); }
  @S .ci-host.ci-old{ border-color:var(--x-warn); }
  @S .ci-host.ci-old .ci-run{ color:var(--x-warn); background:rgb(240 166 74 / .14); }
  @S .ci-host.ci-new{ border-color:var(--x-bad); }
  @S .ci-host.ci-new .ci-run{ color:var(--x-bad); background:rgb(244 74 106 / .14); }
  @S .ci-note{ position:relative; min-height:52px; display:flex; justify-content:center; }
  @S .ci-warn{ position:absolute; top:0; }
  @S .ci-rule{ display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }
  @S .ci-rule .msd-pill{ font-size:19px; }
  @S .ci-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .ci{ gap:12px; }
  @P .ci-build{ grid-template-columns:1fr; gap:14px; }
  @P .ci-df .body{ font-size:21px; line-height:1.45; padding:12px 22px; }
  @P .ci-stack{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  @P .ci-layer.y1{ order:1; } @P .ci-layer.y2{ order:2; } @P .ci-layer.y3{ order:3; } @P .ci-layer.y4{ order:4; }
  @P .ci-layer em{ display:none; }
  @P .ci-acrl{ display:none; }
  @P .ci-hosts{ gap:12px; }
  @P .ci-host{ padding:12px; gap:10px; }
  @P .ci-hic{ width:44px; height:44px; }
  @P .ci-host b{ font-size:21px; }
  @P .ci-run{ font-size:17px; padding:3px 8px; }
  @P .ci-tvd .msd-pill{ font-size:17px; }
  @P .ci-note{ min-height:100px; }
  @S .ci:not(.ci-p2) .ci-acr, @S .ci:not(.ci-p2) .ci-hosts, @S .ci:not(.ci-p2) .ci-note{ display:none; }
  @S .ci.ci-p2 .ci-df{ display:none; }
  @S .ci.ci-p2 .ci-build{ grid-template-columns:1fr; }
  @L .ci.ci-p2 .ci-img{ padding:14px 18px; }
  @L .ci.ci-p2 .ci-stack{ flex-direction:row; }
  @L .ci.ci-p2 .ci-layer{ flex:1; min-width:0; white-space:nowrap; }
  @L .ci.ci-p2 .ci-layer em{ display:none; }
  `,
  stages: [
    {
      title: 'Your app and a Dockerfile',
      key: 'Dockerfile',
      desc: 'The Dockerfile lists every step: the Python base, the packages, your code and the start command.',
      status: 'ragapi · FastAPI · Python 3.12',
      say: "Here's a small Python AI back end. Next to the code sits a Dockerfile. It's a recipe: start from Python, install the packages, copy the code, then say how to start it.",
      run: (m) => {
        m.qa('.ci-ln').forEach((_, i) => m.after(i * 260, () => { m.cls(`.ci-ln.l${i + 1}`, 'ci-on'); m.sfx.tick(); }));
        m.after(6 * 260 + 500, () => m.cls('.ci-ln', 'ci-on', false));
      },
    },
    {
      title: 'Build: the image is a stack of layers',
      key: 'layers',
      desc: 'Each instruction adds a read-only layer. Change only your code and only the top layers rebuild.',
      status: 'docker build · 4 layers',
      thinking: true,
      say: 'Building turns that recipe into an image. Each step adds a read-only layer on top of the last one. Change only your code, and only the top layers get rebuilt.',
      run: (m) => {
        const pair = [['l1', 'y1'], ['l4', 'y2'], ['l5', 'y3'], ['l6', 'y4']];
        pair.forEach(([l, y], i) => m.after(i * 600, () => {
          m.cls('.ci-ln', 'ci-on', false);
          m.cls(`.ci-ln.${l}`, 'ci-on');
          m.show(`.ci-layer.${y}`, 0, true);
          m.sfx.blip(i + 2);
        }));
        m.after(4 * 600, () => { m.cls('.ci-ln', 'ci-on', false); m.show('.ci-name', 0, true); m.sfx.lock(); });
      },
    },
    {
      title: 'Push it to Azure Container Registry',
      key: 'Azure Container Registry',
      desc: 'The image goes into your private registry with a version tag, ragapi:1.4.0.',
      status: 'docker push · myreg.azurecr.io',
      say: 'Now you push the image to Azure Container Registry, your private store for images, with a version tag. Here it is, ragapi, version one point four point oh.',
      run: (m) => {
        m.cls('.ci', 'ci-p2'); // the Dockerfile makes room for the registry and the hosts
        m.show('.ci-acr', 0, true);
        m.particles('.ci-flow', { from: '.ci-name', to: '.ci-row.ci-ra', count: 8, duration: 900 });
        m.after(500, () => m.sfx.whoosh(true));
        m.after(1000, () => m.punch('.ci-row.ci-ra .ci-tag', 3));
      },
    },
    {
      title: 'Every image gets a digest',
      key: 'digest',
      desc: 'A tag is a name you pick and can move. The digest is a fingerprint of the exact image and never changes.',
      status: 'digest · sha256 (example value)',
      say: "The registry also gives the image a digest. That's a fingerprint of the exact bytes, and it never changes. A tag is just a label you chose, so it can be moved to another image later.",
      run: (m) => {
        m.type('.ci-d1', '9f2c…e41a', 60);
        m.after(800, () => m.show('.ci-tvd > *', 300));
      },
    },
    {
      title: 'One image, three hosts',
      key: 'three hosts',
      desc: 'App Service, Container Apps and AKS all pull the same image from ACR, ideally with a managed identity.',
      status: 'pull · AcrPull · same image everywhere',
      say: "Any of the three hosts can pull that same image. App Service, Container Apps or AKS. Same Python, same packages, same code, so what you tested is what runs.",
      run: (m) => {
        m.show('.ci-host', 220, true);
        m.after(700, () => {
          ['.ci-as', '.ci-ca', '.ci-ak'].forEach((h, i) => m.after(i * 180, () =>
            m.particles('.ci-flow', { from: '.ci-row.ci-ra', to: h, count: 5, duration: 800, silent: true })));
          m.sfx.data(1);
        });
        m.after(1700, () => { m.cls('.ci-host', 'ci-live'); m.sfx.chime(); });
      },
    },
    {
      title: 'Why :latest is risky',
      key: ':latest',
      desc: 'If hosts deploy “latest” and someone pushes a new build, hosts that pull at different times run different code.',
      status: 'latest → moved · 2 builds running',
      say: "Now the risky bit. Say every host asks for the latest tag. Someone pushes a new build and latest moves to it. A host that pulls now gets the new code, the others still run the old one. Same tag, two builds, and rolling back is guesswork.",
      run: (m) => {
        m.text('.ci-host .ci-run', 'ragapi:latest');
        m.cls('.ci-host', 'ci-live', false);
        m.show('.ci-latest.ci-la', 0, true);
        m.after(900, () => { m.show('.ci-row.ci-rb', 0, true); m.type('.ci-d2', 'b71d…03c9', 50); });
        m.after(1800, () => { m.hide('.ci-latest.ci-la'); m.show('.ci-latest.ci-lb', 0, true); m.sfx.swipe(); });
        m.after(2600, () => {
          m.cls('.ci-as, .ci-ca', 'ci-old');
          m.cls('.ci-ak', 'ci-new');
          m.text('.ci-ak .ci-run', 'latest = 1.5.0');
          m.text('.ci-as .ci-run, .ci-ca .ci-run', 'latest = 1.4.0');
          m.shake('.ci-ak');
          m.show('.ci-warn', 0, true);
        });
      },
    },
    {
      title: 'Pin what you deploy',
      key: 'Pin',
      desc: 'Deploy a version tag nobody reuses (or the digest), and keep secrets out of the image.',
      status: 'deploy ragapi:1.4.0 · known build',
      say: "So deploy a tag nobody reuses, like a version number or build ID, or the digest itself. Then every host runs the build you tested, and rolling back means picking the previous tag.",
      run: (m) => {
        m.hide('.ci-warn');
        m.cls('.ci-host', 'ci-old', false);
        m.cls('.ci-host', 'ci-new', false);
        m.text('.ci-host .ci-run', 'ragapi:1.4.0');
        m.cls('.ci-host', 'ci-live');
        m.punch('.ci-row.ci-ra .ci-tag', 4);
        m.after(500, () => m.show('.ci-rule > *', 300));
      },
    },
  ],
  end: {
    title: 'One image, any host',
    sub: 'Build once, store it in ACR with a unique tag, and let App Service, Container Apps or AKS pull exactly that build.',
  },
};

export default spec;
