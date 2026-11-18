import type { ExplainerSpec } from '../../lib/explainer/types';
import { I } from '../../lib/explainer/icons';

const pod = (k: string) => `
  <div class="k8-pod ${k} msd-pop">
    <span class="k8-pic">${I.cpu}</span>
    <b class="msd-mono k8-pn">ragapi</b>
    <span class="k8-ps msd-mono">Running</span>
  </div>`;

const spec: ExplainerSpec = {
  id: 'kubernetes-desired-state',
  lesson: 'aks-manifests',
  title: {
    main: 'You write what you want. <em>Kubernetes keeps it true.</em>',
    sub: 'How a Deployment and a Service manifest on AKS become running pods, and how the controller reacts when a pod dies or an image is bad.',
  },
  summary: 'An animation of a YAML Deployment (3 replicas, image ragapi:1.4.0, readiness probe) and a LoadBalancer Service applied to an AKS cluster with kubectl apply; the controller starts three pods, replaces a pod that dies, and when a new image tag does not exist the new pod sits in ImagePullBackOff while the old pods keep serving, until the rollout is undone.',
  html: `
  <div class="k8">
    <div class="k8-left">
      <div class="k8-yaml msd-editor">
        <div class="ed-bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span>ragapi.yaml</span></div>
        <div class="body">
          <div class="k8-ln d1"><span class="kw">kind:</span> Deployment</div>
          <div class="k8-ln d2">&nbsp;&nbsp;replicas: <span class="st">3</span></div>
          <div class="k8-ln d3">&nbsp;&nbsp;image: <span class="st k8-tag">ragapi:1.4.0</span></div>
          <div class="k8-ln d4">&nbsp;&nbsp;readinessProbe: <span class="st">/healthz</span></div>
          <div class="k8-ln k8-sep">---</div>
          <div class="k8-ln s1"><span class="kw">kind:</span> Service</div>
          <div class="k8-ln s2">&nbsp;&nbsp;type: <span class="st">LoadBalancer</span></div>
          <div class="k8-ln s3">&nbsp;&nbsp;selector: <span class="st">app: ragapi</span></div>
        </div>
      </div>
      <div class="k8-term msd-card"><span class="k8-pr">$</span><span class="k8-cli msd-mono"></span></div>
      <div class="k8-count msd-card">
        <div><span class="msd-label">Desired</span><b class="k8-want msd-num">3</b></div>
        <div><span class="msd-label">Ready</span><b class="k8-have msd-num">0</b></div>
      </div>
    </div>
    <div class="k8-cluster msd-card msd-reveal">
      <div class="k8-ch"><span class="msd-label">AKS cluster · aks-rag</span></div>
      <div class="k8-cp">
        <span class="msd-chip">${I.gear}API server</span>
        <span class="k8-loop msd-chip">${I.arrow}controller: desired vs actual</span>
      </div>
      <div class="k8-svc msd-node msd-pop"><span class="ic">${I.net}</span><span>Service · public IP</span></div>
      <div class="k8-nodes">
        <div class="k8-node"><span class="msd-label">node 1</span><div class="k8-slots">${pod('p1')}${pod('p2')}${pod('p5')}</div></div>
        <div class="k8-node"><span class="msd-label">node 2</span><div class="k8-slots">${pod('p3')}${pod('p4')}</div></div>
      </div>
      <div class="k8-acr msd-chip">${I.db}pulls from myreg.azurecr.io</div>
    </div>
    <div class="k8-flow"></div>
  </div>`,
  css: `
  @S .k8{ position:relative; height:100%; display:grid; grid-template-columns:0.9fr 1.1fr; gap:20px; }
  @S .k8-left{ display:flex; flex-direction:column; gap:16px; min-height:0; }
  @S .k8-yaml .ed-bar span{ margin-left:12px; color:#bbb; font-family:var(--x-mono); font-size:18px; }
  @S .k8-yaml .body{ font-size:22px; line-height:1.55; padding:14px 22px; }
  @S .k8-ln{ white-space:nowrap; padding:0 8px; margin:0 -8px; border-radius:6px; transition:background .3s; }
  @S .k8-ln.k8-on{ background:rgb(58 160 255 / .2); }
  @S .k8-sep{ color:#6a9955; }
  @S .k8-tag{ transition:color .3s; }
  @S .k8.badimg .k8-tag{ color:var(--x-bad); }
  @S .k8-term{ display:flex; gap:12px; align-items:flex-start; padding:14px 20px; min-height:64px; background:#0b0f18; }
  @S .k8-pr{ color:var(--x-ok); font-family:var(--x-mono); font-size:22px; font-weight:700; }
  @S .k8-cli{ color:var(--x-text); font-size:20px; line-height:1.45; word-break:break-word; }
  @S .k8-count{ display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:14px 20px; }
  @S .k8-count > div{ display:flex; align-items:baseline; justify-content:space-between; gap:10px; }
  @S .k8-count b{ font-size:48px; }
  @S .k8-have{ transition:color .3s; }
  @S .k8.short .k8-have{ color:var(--x-warn); }
  @S .k8-cluster{ padding:18px 20px; display:flex; flex-direction:column; gap:14px; min-height:0; border-style:dashed; border-color:rgb(58 160 255 / .45); }
  @S .k8-cp{ display:flex; gap:10px; flex-wrap:wrap; }
  @S .k8-cp .msd-chip{ font-size:18px; }
  @S .k8-loop{ transition:background .3s, color .3s, border-color .3s; }
  @S .k8-loop svg{ transition:transform .6s ease; }
  @S .k8.watch .k8-loop{ background:rgb(63 185 80 / .16); border-color:rgb(63 185 80 / .5); color:var(--x-ok); }
  @S .k8-svc{ align-self:center; font-size:22px; padding:12px 18px; }
  @S .k8-svc .ic{ width:46px; height:46px; } @S .k8-svc .ic svg{ width:26px; height:26px; }
  @S .k8-nodes{ flex:1; display:grid; grid-template-columns:1fr 1fr; gap:14px; min-height:0; }
  @S .k8-node{ display:flex; flex-direction:column; gap:10px; padding:14px; border-radius:18px; border:1.5px solid var(--x-line); background:rgb(14 20 32 / .9); }
  @S .k8-slots{ flex:1; display:flex; flex-direction:column; gap:10px; }
  @S .k8-pod{ display:grid; grid-template-columns:auto 1fr; align-items:center; column-gap:10px; row-gap:6px; padding:10px 12px; border-radius:14px; border:1.5px solid var(--x-a1); background:rgb(58 160 255 / .1); color:var(--x-a1); transition:border-color .3s, background .3s, color .3s; }
  @S .k8-pic svg{ width:28px; height:28px; }
  @S .k8-pn{ color:#fff; font-size:19px; }
  @S .k8-ps{ grid-column:1 / -1; justify-self:start; font-size:16px; padding:3px 8px; border-radius:7px; background:rgb(255 255 255 / .06); white-space:nowrap; }
  @S .k8-pod.k8-ok{ border-color:var(--x-ok); background:rgb(63 185 80 / .12); color:var(--x-ok); }
  @S .k8-pod.k8-dead{ border-color:var(--x-bad); background:rgb(244 74 106 / .1); color:var(--x-bad); }
  @S .k8-pod.k8-err{ border-color:var(--x-bad); border-style:dashed; background:rgb(244 74 106 / .1); color:var(--x-bad); }
  @S .k8-acr{ align-self:flex-start; font-size:17px; }
  @S .k8-flow{ position:absolute; inset:0; pointer-events:none; z-index:6; }
  @P .k8{ grid-template-columns:1fr; grid-template-rows:auto 1fr; gap:16px; }
  @P .k8-left{ display:grid; grid-template-columns:1.25fr 1fr; grid-template-rows:auto auto; gap:12px; }
  @P .k8-yaml{ grid-row:1 / 3; }
  @P .k8-yaml .body{ font-size:20px; line-height:1.45; padding:12px 18px; }
  @P .k8-term{ min-height:0; padding:12px 16px; }
  @P .k8-cli{ font-size:19px; }
  @P .k8-count{ grid-template-columns:1fr; gap:4px; padding:12px 16px; }
  @P .k8-count b{ font-size:40px; }
  `,
  stages: [
    {
      title: 'Write down what you want',
      key: 'what you want',
      desc: 'A Deployment says which image to run, how many replicas, and how to check each copy is healthy.',
      status: 'ragapi.yaml · Deployment · replicas 3',
      say: "On AKS you don't start containers by hand. You write down what you want in a YAML manifest. This Deployment says: three copies of ragapi one point four, and here's the health check for each one.",
      run: (m) => {
        ['d1', 'd2', 'd3', 'd4'].forEach((l, i) => m.after(i * 550, () => { m.cls('.k8-ln', 'k8-on', false); m.cls(`.k8-ln.${l}`, 'k8-on'); m.sfx.tick(); }));
        m.after(4 * 550 + 300, () => m.cls('.k8-ln', 'k8-on', false));
      },
    },
    {
      title: 'A Service gives one stable address',
      key: 'Service',
      desc: 'The Service finds pods by the label app: ragapi. LoadBalancer type asks Azure for a public IP.',
      status: 'Service · LoadBalancer · selector app=ragapi',
      say: "Pods come and go, so callers need one address that doesn't change. That's the Service. It finds the pods by their label, and the LoadBalancer type gets a public IP from Azure.",
      run: (m) => {
        ['s1', 's2', 's3'].forEach((l, i) => m.after(i * 550, () => { m.cls('.k8-ln', 'k8-on', false); m.cls(`.k8-ln.${l}`, 'k8-on'); m.sfx.tick(); }));
        m.after(3 * 550 + 300, () => m.cls('.k8-ln', 'k8-on', false));
      },
    },
    {
      title: 'kubectl apply',
      key: 'apply',
      desc: 'The API server stores the manifest, three pods are scheduled, each node pulls the image from ACR.',
      status: 'desired 3 · ready 3',
      say: "Now you hand it over with kubectl apply. Kubernetes places three pods on the nodes, each node pulls the image from your registry, and pods that pass the readiness probe join the Service.",
      run: (m) => {
        m.type('.k8-cli', 'kubectl apply -f ragapi.yaml', 34);
        m.after(1000, () => { m.show('.k8-cluster', 0, true); m.particles('.k8-flow', { from: '.k8-yaml', to: '.k8-cp', count: 6, duration: 800 }); });
        m.after(1700, () => { m.show('.k8-pod.p1, .k8-pod.p2, .k8-pod.p3', 250); m.text('.k8-pod .k8-ps', 'Pulling'); });
        m.after(2700, () => {
          m.text('.k8-pod .k8-ps', 'Running');
          m.cls('.k8-pod.p1, .k8-pod.p2, .k8-pod.p3', 'k8-ok');
          m.count('.k8-have', 3, 500);
          m.show('.k8-svc', 0, true);
          m.sfx.chime();
        });
        m.after(3200, () => m.stream('.k8-flow', { from: '.k8-svc', to: '.k8-nodes', count: 3, duration: 700, gap: 800, silent: true }));
      },
    },
    {
      title: 'A loop keeps checking',
      key: 'loop',
      desc: 'The Deployment controller keeps comparing what you declared with what is actually running.',
      status: 'reconcile · desired 3 = actual 3',
      say: "And Kubernetes doesn't stop there. A controller keeps comparing what you asked for with what's really running. Right now they match, three and three, so it does nothing.",
      run: (m) => {
        m.cls('.k8', 'watch');
        m.focus('.k8-loop, .k8-count', '.k8-nodes');
        m.after(1800, () => { m.unfocus(); m.punch('.k8-count', 2); });
      },
    },
    {
      title: 'A pod dies, a new one appears',
      key: 'new one',
      desc: 'Actual drops to 2. The controller sees the gap and starts a replacement, with nobody paged.',
      status: 'pod crashed · ready 2 → 3',
      say: "Now a pod crashes. Ready drops to two, which doesn't match three. The controller notices and starts a replacement on its own. Nobody had to log in or restart anything.",
      run: (m) => {
        m.cls('.k8-pod.p2', 'k8-ok', false);
        m.cls('.k8-pod.p2', 'k8-dead');
        m.text('.k8-pod.p2 .k8-ps', 'Crashed');
        m.text('.k8-have', '2');
        m.cls('.k8', 'short');
        m.shake('.k8-pod.p2');
        m.after(1100, () => { m.hide('.k8-pod.p2'); m.show('.k8-pod.p4', 0); m.text('.k8-pod.p4 .k8-ps', 'Pulling'); });
        m.after(2200, () => {
          m.cls('.k8-pod.p4', 'k8-ok');
          m.text('.k8-pod.p4 .k8-ps', 'Running');
          m.text('.k8-have', '3');
          m.cls('.k8', 'short', false);
          m.punch('.k8-have', 3);
        });
      },
    },
    {
      title: 'A bad image: ImagePullBackOff',
      key: 'ImagePullBackOff',
      desc: 'The new tag was never pushed. The new pod can’t pull it and backs off, while the old pods keep serving.',
      status: 'ragapi:1.5.0 · ImagePullBackOff · 3 old pods ready',
      say: "Next, someone changes the image to version one point five, but that tag was never pushed. The new pod can't pull it, so it shows ImagePullBackOff and keeps retrying. The rolling update waits, and the three old pods keep serving users.",
      run: (m) => {
        m.text('.k8-tag', 'ragapi:1.5.0');
        m.cls('.k8', 'badimg');
        m.type('.k8-cli', 'kubectl apply -f ragapi.yaml', 20);
        m.after(900, () => { m.show('.k8-pod.p5', 0); m.text('.k8-pod.p5 .k8-ps', 'Pulling'); });
        m.after(1900, () => {
          m.cls('.k8-pod.p5', 'k8-err');
          m.text('.k8-pod.p5 .k8-ps', 'ImagePullBackOff');
          m.shake('.k8-pod.p5');
        });
        m.after(2500, () => m.stream('.k8-flow', { from: '.k8-svc', to: '.k8-pod.p1', count: 2, duration: 700, gap: 900, silent: true }));
      },
    },
    {
      title: 'Undo, and you’re back',
      key: 'Undo',
      desc: 'Roll back the rollout or fix the tag in the YAML. The broken pod goes, three healthy pods remain.',
      status: 'rollout undo · desired 3 · ready 3',
      say: "To fix it, roll back with kubectl rollout undo, or correct the tag in the YAML and apply it again. The broken pod is removed, and you're back to three healthy copies of the version that works.",
      run: (m) => {
        m.type('.k8-cli', 'kubectl rollout undo deployment/ragapi', 26);
        m.after(1300, () => {
          m.hide('.k8-pod.p5');
          m.text('.k8-tag', 'ragapi:1.4.0');
          m.cls('.k8', 'badimg', false);
          m.punch('.k8-count', 4);
          m.sfx.resolve();
        });
      },
    },
  ],
  end: {
    title: 'Declare it, and Kubernetes keeps it true',
    sub: 'Deployment for what runs, Service for how to reach it, kubectl apply to send it, and the controller does the rest.',
  },
};

export default spec;
