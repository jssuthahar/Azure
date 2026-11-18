import { THREE, C, v, mat, box, cyl, person, ground, plate, glow, Packets, after, every, type V3 } from './kit';
import { stepLabels, type Ctx, type Ctl } from './types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));
type M = THREE.MeshStandardMaterial;

/** Containers on Azure: ACR + ACR Tasks, App Service settings, Container Apps (ingress, revisions, KEDA) and AKS (pods, Service, troubleshooting). */
export function containers({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 170, 0xdde6ef);
  const packets = new Packets(stage, 0.35);
  const later = after(stage);
  const solid = (c: number, e = 0.25) => mat(c, { emissive: c, emissiveIntensity: e });
  const flash = (m: M, c: number, base: number, sec = 1) => { glow(m, c, 1); later(sec, () => glow(m, base, 0.25)); };

  // ACR registry, build bay, base image, git repo (left)
  S.add(plate(18, 26, 0xd6e6f5, [-34, 0, -4]));
  const dev = person(C.purple, [-46, 0.1, 6], 1.6);
  S.add(dev);
  const imgs = [-38, -34, -30].map((x) => { const m = solid(C.azure); const b = box(2.6, 2.6, 2.6, m, [x, 0.12, 2]); S.add(b); return { b, m }; });
  const bayM = solid(C.amber, 0.2), baseM = solid(0x6b7b8c, 0.2);
  S.add(box(5, 3, 4, bayM, [-32, 0.12, -10]), box(2, 2, 2, baseM, [-39, 0.12, -10]), box(2, 1.6, 2, mat(0x444444), [-46, 0.1, -10]));

  // App Service with settings panel, Key Vault, and someone who can pull images
  S.add(plate(16, 14, 0xe8e1f5, [-12, 0, -10]));
  const appM = solid(C.azure, 0.3);
  S.add(box(4, 3.4, 4, appM, [-12, 0.12, -10]), box(7, 3, 0.3, mat(0x1b1a19, { emissive: 0x223355, emissiveIntensity: 0.4 }), [-12, 1, -16]));
  const kvM = solid(C.amber, 0.3);
  S.add(cyl(1.3, 2.4, kvM, [-3, 0.12, -14]));
  const snoop = person(C.red, [-22, 0.1, 6], 1.6);
  S.add(snoop);

  // Container Apps environment: ingress, revisions, queue, worker replicas
  S.add(plate(26, 24, 0xd5ecdc, [10, 0, 2]));
  const user = person(C.azure, [-6, 0.1, 2], 1.6);
  const gateM = solid(C.amber, 0.3);
  S.add(user, box(0.4, 4, 6, gateM, [-1.5, 0.1, 2]));
  const v1M = solid(C.azure), v2M = solid(C.green);
  const v2 = box(3, 3, 3, v2M, [6, 0.12, 6]);
  S.add(box(3, 3, 3, v1M, [6, 0.12, -2]), v2);
  const qM = solid(C.purple, 0.3);
  const queue = box(1, 1.4, 1.4, qM, [12, 0.12, 12]);
  S.add(queue);
  const reps = Array.from({ length: 10 }, (_, k) => { const b = box(1.4, 1.8, 1.4, solid(C.green), [13 + (k % 5) * 2.2, 0.12, -6 + Math.floor(k / 5) * 2.4]); S.add(b); return b; });

  // AKS cluster: 3 nodes, 6 pod slots, a Service, a manifest and a database
  S.add(plate(24, 24, 0xdde3ec, [38, 0, 2]));
  [0, 1, 2].forEach((k) => S.add(box(5, 0.8, 5, mat(0x34495e, { metalness: 0.3 }), [32 + k * 6, 0.12, 0])));
  const pods = Array.from({ length: 6 }, (_, k) => { const m = solid(C.green); const p = cyl(0.7, 1.6, m, [32 + Math.floor(k / 2) * 6 + (k % 2 ? 1.3 : -1.3), 0.92, 0]); S.add(p); return { p, m }; });
  const svcM = solid(C.azure, 0.4);
  const svc = new THREE.Mesh(new THREE.OctahedronGeometry(1.2), svcM);
  svc.position.set(38, 2, 9);
  const dbM = solid(0x008575);
  S.add(svc, box(2, 0.3, 2.6, mat(0xffffff), [26, 0.12, -8]), cyl(1.3, 2.2, dbM, [48, 0.12, 12]));

  const L = stepLabels(stage);
  L.add('🗄️ Azure Container Registry · contosoacr', [-34, 6, 0], [0, 1], 'd3-label-strong');
  const tagsBase = ['ragapi:1.2.0', 'ragapi:1.3.0', 'ragapi:1.4.0'];
  const imgLbl = imgs.map((im, k) => L.add(tagsBase[k], [im.b.position.x, 3.4, 2], [0, 1]));
  let latest = 1;
  L.add('🏷️ :latest', () => imgs[latest].b.position.clone().add(v(0, 4.8, 0)), [0]);
  L.add('🧑‍💻 You', [-46, 3.4, 6], [0]);
  L.add('🏗️ ACR Task', [-32, 4.4, -10], [1]);
  const baseLbl = L.add('🐍 python:3.12-slim', [-39, 3, -10], [1]);
  L.add('🌿 git repo', [-46, 2.8, -10], [1]);
  L.add('🌐 App Service · ragapi-web', [-12, 5, -10], [0, 2], 'd3-label-strong');
  const panelLbl = L.add('⚙️ App settings', [-12, 4.6, -16], [2]);
  L.add('🔐 Key Vault', [-3, 3.6, -14], [2]);
  L.add('🕵️ Anyone with pull access', [-22, 3.4, 6], [2]);
  L.add('📦 Container Apps environment (own VNet + Log Analytics)', [10, 0.6, -10], [3, 4, 5], 'd3-label-strong');
  L.add('🚪 Ingress: external', [-1.5, 5, 2], [3, 4]);
  L.add('👤 User', [-6, 3.4, 2], [3, 4]);
  const v1Lbl = L.add('🟦 ragapi--v1 (1.4.0) · 100%', [6, 4.2, -2], [3, 4]);
  const v2Lbl = L.add('🟩 ragapi--v2 (1.5.0) · 0%', [6, 4.2, 6], [4]);
  const qLbl = L.add('📨 Service Bus queue: 0', [12, 3.2, 12], [5]);
  const repLbl = L.add('⚙️ summariser replicas: 0', [17, 4.4, -7], [5]);
  L.add('☸️ AKS cluster · 3 nodes', [38, 0.6, -10], [6, 7], 'd3-label-strong');
  L.add('🔗 Service: ragapi', [38, 4, 9], [6, 7]);
  L.add('📄 deployment.yaml', [26, 1.8, -8], [6]);
  L.add('🗃️ PostgreSQL', [48, 3.6, 12], [7]);
  const podLbl = L.add('', [38, 4.4, 0], [6, 7]);

  let step = 0, split = 0, failing = false, q = 0, rep = 0, draining = false, restarts = 0;
  const podOn = [false, false, false, false, false, false];
  const paintPods = () => pods.forEach((p, k) => (p.p.visible = podOn[k]));
  const setPod = (k: number, on: boolean, col = C.green) => { podOn[k] = on; pods[k].m.color.setHex(col); glow(pods[k].m, col, 0.25); paintPods(); };
  const ready = () => { if (!podOn.some(Boolean)) [0, 2, 4].forEach((k) => setPod(k, true)); };
  const paintRev = () => { v1Lbl.set(`🟦 ragapi--v1 (1.4.0) · ${100 - split}%`); v2Lbl.set(`🟩 ragapi--v2 (1.5.0) · ${split}%`); };
  const paintQ = () => {
    queue.scale.x = Math.max(0.05, (q / 500) * 14);
    reps.forEach((r, k) => (r.visible = k < rep));
    qLbl.set(`📨 Service Bus queue: ${q}`);
    repLbl.set(`⚙️ summariser replicas: ${rep}${rep === 0 ? ' (scaled to zero)' : ''}`);
    cost(rep * 0.09, 'hour', rep ? `${rep} replica${rep > 1 ? 's' : ''} × 1 vCPU, 2 GiB (illustrative)` : 'scaled to zero: no replicas, no compute bill');
  };
  const toUser = (dest: V3, col: number, bounce?: number) => packets.send(curve([-6, 2, 2], [-1.5, 3, 2], dest), col, 0.9, bounce ? undefined : () => packets.send(curve(dest, [-1.5, 3, 2], [-6, 2, 2]), C.green, 0.9), bounce);

  // KEDA loop: one replica per 5 messages, max 10, back to zero after the queue stays empty
  every(stage, 0.5, () => {
    if (step !== 5) return;
    const target = q > 0 ? Math.min(10, Math.ceil(q / 5)) : draining ? 0 : rep;
    if (rep < target) rep++; else if (rep > target) rep--;
    if (q > 0) { q = Math.max(0, q - rep * 6); if (q === 0) hud('✅ Queue empty. KEDA keeps the replicas for a cool-down period, then scales in. Ask what happens when it stays empty.', 'ok'); }
    if (draining && rep === 0) { draining = false; hud('🌙 Min replicas is 0, so the app scaled to zero. No replicas, no compute bill. The next message wakes it up (expect a short cold start).', 'ok'); }
    paintQ();
  });
  // Revision traffic
  every(stage, 0.3, () => {
    if (step !== 4 || (!split && !failing)) return;
    const toV2 = Math.random() * 100 < split;
    toUser(toV2 ? [6, 2, 6] : [6, 2, -2], toV2 && failing ? C.red : C.azure, toV2 && failing ? 0.9 : undefined);
  });

  return {
    go(i) {
      step = i;
      later.cancelAll();
      packets.clear();
      hud('');
      L.show(i);
      latest = 1; split = 0; failing = false; draining = false; restarts = 0;
      imgs.forEach((im, k) => { im.b.visible = k < 2; im.m.color.setHex(C.azure); glow(im.m, C.azure, 0.25); imgLbl[k].set(tagsBase[k]); });
      baseLbl.set('🐍 python:3.12-slim');
      glow(appM, C.azure, 0.3); glow(v2M, C.green, 0.25);
      panelLbl.set('⚙️ App settings<br>(none yet)');
      snoop.visible = false;
      v2.visible = false; paintRev();
      q = 0; rep = i === 5 ? 2 : 0; queue.visible = i === 5; paintQ();
      podOn.fill(false); paintPods();
      if (i === 7) ready();
      podLbl.set(i === 7 ? '3/3 pods Running' : 'No pods yet');
      if (i !== 5) cost(i === 6 || i === 7 ? 0.29 : 0, 'hour', i === 6 || i === 7 ? '3 × D2s v5 nodes; the AKS control plane is free on the Free tier (illustrative)' : '');
      const cams: [V3, V3][] = [[[-34, 13, 22], [-32, 1, 0]], [[-36, 13, 12], [-36, 1, -5]], [[-14, 12, 8], [-12, 1, -10]], [[4, 16, 24], [4, 1, 2]], [[4, 14, 20], [4, 1, 2]], [[16, 18, 28], [15, 1, 3]], [[38, 16, 24], [36, 1, 2]], [[40, 14, 24], [40, 1, 4]]];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (id === 'push') packets.send(curve([-46, 2, 6], [-40, 5, 4], [-30, 2, 2]), C.azure, 1.2, () => { imgs[2].b.visible = true; imgLbl[2].set('ragapi:1.4.0<br>sha256:9f2c…e41'); latest = 2; hud('📦 Pushed. The tag ragapi:1.4.0 points at digest sha256:9f2c…e41. Tags can be moved later; the digest always means these exact bytes.', 'ok'); });
      if (id === 'latest') {
        packets.send(curve([-46, 2, 6], [-40, 5, 4], [-30, 2, 2]), C.red, 1.2, () => {
          imgs[2].b.visible = true; imgs[2].m.color.setHex(C.red); imgLbl[2].set('ragapi:1.5.0-dev ⚠️ broken'); latest = 2;
          later(0.4, () => packets.send(curve([-30, 2, 2], [-20, 5, -4], [-12, 2, -10]), C.red, 1.1, () => { flash(appM, C.red, C.azure, 3); hud('💥 :latest moved to the broken build. Production restarted, pulled :latest and went down. Pin a version tag like :1.4.0, or the digest, so production only changes when you change it.', 'bad'); }));
        });
      }
      if (id === 'quick') {
        packets.send(curve([-46, 1.5, -10], [-40, 4, -12], [-32, 2, -10]), C.azure, 1, () => { flash(bayM, C.amber, C.amber); hud('☁️ az acr build -r contosoacr -t ragapi:1.4.0 . uploads your source and builds it in Azure…', 'info');
          later(1, () => packets.send(curve([-32, 3, -10], [-31, 5, -4], [-30, 2, 2]), C.green, 1, () => { imgs[2].b.visible = true; imgLbl[2].set('ragapi:1.4.0'); latest = 2; hud('✅ Built and pushed straight into the registry. No Docker on your laptop, and the build log stays in ACR.', 'ok'); })); });
      }
      if (id === 'base') {
        baseLbl.set('🐍 python:3.12-slim 🩹 patched'); flash(baseM, C.green, 0x6b7b8c, 2);
        packets.send(curve([-39, 1.5, -10], [-36, 3, -10], [-32, 2, -10]), C.green, 0.9, () => { flash(bayM, C.amber, C.amber); hud('🩹 The base image changed, so the task triggers on its own and rebuilds your image on top of the patched layer…', 'info');
          later(1, () => packets.send(curve([-32, 3, -10], [-31, 5, -4], [-30, 2, 2]), C.green, 1, () => { imgs[2].b.visible = true; imgLbl[2].set('ragapi:1.4.1 (rebuilt)'); latest = 2; hud('✅ A patched ragapi image is in the registry without anyone touching the code. Deploy it like any other version.', 'ok'); })); });
      }
      if (id === 'setting') { panelLbl.set('⚙️ App settings<br>MODEL_DEPLOYMENT = gpt-4.1-mini'); packets.send(curve([-12, 2, -16], [-12, 4, -13], [-12, 2, -10]), C.azure, 0.9, () => { flash(appM, C.green, C.azure); hud('⚙️ The app restarts and MODEL_DEPLOYMENT appears as an environment variable inside the container. os.environ reads it. No new image needed.', 'ok'); }); }
      if (id === 'kvref') {
        panelLbl.set('⚙️ App settings<br>OPENAI_KEY = @Microsoft.KeyVault(SecretUri=…)');
        flash(kvM, C.green, C.amber);
        packets.send(curve([-3, 2, -14], [-7, 4, -12], [-12, 2, -10]), C.green, 1, () => { flash(appM, C.green, C.azure); hud('🔐 App Service uses its managed identity to fetch the secret from Key Vault and hands it to the container as OPENAI_KEY. The portal only ever shows the reference.', 'ok'); });
      }
      if (id === 'baked') {
        snoop.visible = true; imgs[1].m.color.setHex(C.red); imgLbl[1].set('ragapi:1.3.0 🔑 key inside');
        packets.send(curve([-34, 2, 2], [-28, 4, 4], [-22, 2, 6]), C.red, 1.2, () => hud('🙈 Anyone who can pull the image can read the key with docker history or by opening a layer. Every old tag keeps it forever. Use app settings with Key Vault references instead.', 'bad'));
      }
      if (id === 'ingress') { flash(gateM, C.green, C.amber); toUser([6, 2, -2], C.azure); }
      if (id === 'ingress') later(1.8, () => hud('🌐 HTTPS call → ingress (TLS ends here) → the app on its target port. Set ingress to internal and only apps inside the environment could reach it.', 'ok'));
      if (id === 'revision') { v2.visible = true; split = 0; paintRev(); hud('🆕 Changing the image created revision ragapi--v2. In multiple revision mode it starts with 0% of traffic, so you can test it on its own revision URL first.', 'ok'); }
      if (id === 'split') { v2.visible = true; failing = false; split = 20; paintRev(); hud('🔀 Traffic weights: 80% to v1, 20% to v2. Watch the dots. If v2 looks healthy, move it to 100%.', 'ok'); }
      if (id === 'rollback') {
        v2.visible = true; failing = true; split = 20; paintRev(); glow(v2M, C.red, 0.8);
        hud('⚠️ v2 is throwing 500s: one request in five fails (red)…', 'bad');
        later(2.5, () => { split = 0; failing = false; paintRev(); hud('⏪ Rolled back by setting v2 to 0% and v1 to 100%. No redeploy, because v1 was never deleted. Fix the bug and ship a new revision.', 'ok'); });
      }
      if (id === 'flood') { draining = false; q = 500; paintQ(); hud('📨 500 messages. The scale rule says one replica per 5 messages, capped at max replicas (10). Watch it add replicas and drain the queue.', 'info'); }
      if (id === 'drain') {
        q = 0; draining = true; paintQ();
        hud(rep ? '🌙 The queue stays empty past the cool-down, so KEDA removes replicas one by one…' : '🌙 Already at zero replicas: nothing to pay for until a message arrives.', 'info');
      }
      if (id === 'apply') {
        packets.send(curve([26, 1, -8], [32, 4, -5], [38, 2, 0]), C.azure, 1, () => {
          [0, 2, 4].forEach((k, n) => later(n * 0.35, () => setPod(k, true)));
          later(1.2, () => { flash(svcM, C.green, C.azure); podLbl.set('3/3 pods Running'); hud('📄 The Deployment asked for 3 replicas, so the scheduler placed 3 pods across the nodes. The Service gives them one stable address and spreads traffic.', 'ok'); });
        });
      }
      if (id === 'kill') {
        ready(); const k = podOn[2] ? 2 : podOn.findIndex(Boolean);
        setPod(k, true, C.red); podLbl.set('2/3 pods Running');
        later(0.6, () => setPod(k, false));
        later(1.6, () => { setPod(k === 2 ? 3 : k, true); podLbl.set('3/3 pods Running'); hud('💥 A pod died. The Deployment wants 3, saw 2, and started a replacement right away. Nobody had to wake up.', 'ok'); });
        hud('💥 Pod crashed…', 'bad');
      }
      if (id === 'badimage') {
        ready(); setPod(5, true, C.amber); podLbl.set('3/3 Running · 1 ImagePullBackOff');
        packets.send(curve([45, 2, 0], [10, 14, 2], [-30, 3, 2]), C.red, 1.6, () => hud('🚫 Failed to pull contosoacr.azurecr.io/ragapy:1.4.0: not found. Kubernetes keeps retrying with longer waits (ImagePullBackOff). The old pods keep serving. Fix the name, or give the cluster AcrPull if the error says unauthorized.', 'bad'), 0.5);
      }
      if (id === 'crash') {
        ready(); restarts = 0;
        const loop = (n: number) => { if (n === 0) return; setPod(0, true, C.red); later(0.35, () => setPod(0, false)); later(0.8, () => { restarts++; setPod(0, true, C.amber); podLbl.set(`ragapi-pod-1 · restarts ${restarts} · CrashLoopBackOff`); loop(n - 1); }); };
        loop(4);
        later(3.4, () => hud('🔁 The container starts, exits, and Kubernetes waits longer before each restart. kubectl logs --previous shows why: KeyError: \'OPENAI_ENDPOINT\'. A missing setting, not a platform fault.', 'bad'));
      }
      if (id === 'probe') {
        ready(); setPod(2, true, 0x8a99a8); podLbl.set('ragapi-pod-2 · Running, 0/1 Ready');
        [0, 1, 2, 3, 4, 5].forEach((n) => later(n * 0.3, () => { const x = n % 2 ? 43 : 31; packets.send(curve([38, 2, 9], [(38 + x) / 2, 3.4, 5], [x, 2, 0]), C.green, 0.7); }));
        hud('🩺 GET /healthz returns 503 while the model loads, so the pod is Running but not Ready. The Service only sends traffic to Ready pods (green dots skip it). kubectl describe pod shows “Readiness probe failed”.', 'bad');
      }
      if (id === 'dns') {
        ready(); flash(dbM, C.red, 0x008575, 2);
        packets.send(curve([31, 2, 0], [40, 5, 8], [48, 2, 12]), C.red, 1.2, () => hud('🧭 “could not translate host name contoso-pg.postgres.database.azure.com”. Test from inside the pod: kubectl exec … nslookup. With a private endpoint, link its private DNS zone to the VNet, then check port 5432 and the firewall.', 'bad'), 0.85);
      }
    },
  };
}
