import { THREE, C, v, mat, box, cyl, person, ground, plate, glow, Packets, after, every, type V3 } from './kit';
import { stepLabels, type Ctx, type Ctl } from './types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));
type M = THREE.MeshStandardMaterial;

/** Secure and observe: Key Vault + managed identity, secret versions, App Configuration flags, an OpenTelemetry trace, log tables, KQL and alerts. */
export function observe({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 180, 0xdde6ef);
  const packets = new Packets(stage, 0.34);
  const later = after(stage);
  const solid = (c: number, e = 0.25) => mat(c, { emissive: c, emissiveIntensity: e });
  const flash = (m: M, c: number, base: number, sec = 1) => { glow(m, c, 1); later(sec, () => glow(m, base, 0.25)); };

  // Secrets corner: laptop + GitHub + attacker, the app, Entra ID, Key Vault with versions, App Configuration
  S.add(plate(44, 30, 0xe8e1f5, [-18, 0, -2]));
  const ghM = solid(0x24292f, 0.2);
  S.add(box(3, 1.6, 2, mat(0x1b1a19, { emissive: 0x55b6ff, emissiveIntensity: 0.25 }), [-32, 0.12, 4]), box(3, 3, 3, ghM, [-32, 0.12, -8]));
  const thief = person(C.red, [-40, 0.1, -8], 1.6);
  const appM = solid(C.azure, 0.3);
  S.add(thief, box(4, 3, 4, appM, [-14, 0.12, 0]), box(3, 2.4, 3, solid(0x008575, 0.3), [-2, 0.12, 8]));
  const kvM = solid(C.amber, 0.3);
  S.add(cyl(1.6, 2.4, kvM, [-2, 0.12, -6]));
  const vers = [0, 1, 2].map((k) => { const m = solid(C.amber, 0.2); const b = box(2.4, 0.5, 2.4, m, [-2, 2.7 + k * 0.7, -6]); S.add(b); return { b, m }; });
  const acM = solid(C.purple, 0.3), flagM = solid(0x8a99a8, 0.2);
  S.add(box(4, 2.4, 3, acM, [-14, 0.12, -12]), box(1.2, 0.6, 1.2, flagM, [-14, 2.6, -12]));
  const asker = person(C.green, [-24, 0.1, 0], 1.6);
  const egM = solid(C.amber, 0.4), rotM = solid(C.green, 0.3);
  const eg = new THREE.Mesh(new THREE.OctahedronGeometry(1.1), egM);
  eg.position.set(8, 2.2, -10);
  const rotFn = box(2.4, 2, 2.4, rotM, [8, 0.12, -2]);
  S.add(asker, eg, rotFn);

  // Trace row: five services, and a waterfall of spans in front of them
  S.add(plate(62, 26, 0xd6e6f5, [0, 0, 26]));
  const SVC: [string, number][] = [['🌐 web API', -24], ['📨 queue', -12], ['⚙️ worker', 0], ['🌌 Cosmos DB', 12], ['🤖 chat model', 24]];
  const svcM = SVC.map(([, x]) => { const m = solid(C.azure, 0.25); S.add(box(3.4, 2.8, 3, m, [x, 0.12, 18])); return m; });
  const NORMAL: [number, number][] = [[0, 2.0], [0.05, 0.05], [0.1, 1.9], [0.15, 0.12], [0.3, 1.5]];
  const SLOW: [number, number][] = [[0, 4.3], [0.05, 0.05], [0.1, 4.2], [0.15, 2.4], [2.6, 1.5]];
  const spanM = SVC.map(() => solid(C.green, 0.3));
  const spans = spanM.map((m, k) => { const b = box(1, 0.6, 1.2, m, [0, 0.14, 26 + k * 1.8]); S.add(b); return b; });
  const setSpan = (k: number, [s, d]: [number, number], bad = false) => { const b = spans[k]; b.scale.x = Math.max(0.25, d * 5); b.position.x = -24 + (s + d / 2) * 5; b.visible = true; spanM[k].color.setHex(bad ? C.red : C.green); glow(spanM[k], bad ? C.red : C.green, bad ? 0.8 : 0.3); };

  // Log Analytics: tables, a chart, an alert rule and who it notifies
  S.add(plate(46, 26, 0xdbe9e2, [36, 0, -8]));
  const TABLES = ['requests', 'dependencies', 'exceptions', 'traces', 'ContainerAppConsoleLogs_CL', 'ContainerLogV2'];
  const tabM = TABLES.map((_, k) => { const m = solid(C.azureLight, 0.15); S.add(box(3.6, 1 + (k % 3) * 0.4, 3, m, [20 + k * 5, 0.12, -2])); return m; });
  const barM = solid(C.azure, 0.3), badM = solid(C.red, 0.5);
  const bars = Array.from({ length: 12 }, (_, k) => { const b = box(1.4, 1, 1.4, barM, [22 + k * 2, 0.12, -14]); S.add(b); return b; });
  const thrM = mat(C.red, { transparent: true, opacity: 0.25, depthWrite: false });
  const thr = box(25, 0.06, 2.4, thrM, [33, 5, -14]);
  const bellM = solid(C.amber, 0.3);
  const team = person(C.purple, [56, 0.1, -9], 1.6);
  S.add(thr, cyl(1.2, 2.2, bellM, [50, 0.12, -14]), team, box(2.4, 1.6, 2, mat(0x34495e), [56, 0.12, -19]));
  const setBars = (vals: number[], limit = Infinity) => bars.forEach((b, k) => { b.scale.y = Math.max(0.05, vals[k]); b.material = vals[k] > limit ? badM : barM; });

  const L = stepLabels(stage);
  L.add('💻 config.py: CONN = "AccountKey=…"', [-32, 2.6, 4], [0]);
  L.add('🐙 Public GitHub repo', [-32, 4, -8], [0]);
  L.add('🕵️ Secret-scanning bot', [-40, 3.4, -8], [0]);
  const appLbl = L.add('🐍 RAG app · 🪪 managed identity', [-14, 4, 0], [0, 1, 2], 'd3-label-strong');
  L.add('🆔 Microsoft Entra ID', [-2, 3.4, 8], [0, 1]);
  L.add('🔐 Key Vault · kv-contoso-ai', [-2, 5.4, -6], [0, 1, 2], 'd3-label-strong');
  const verLbl = L.add('', [1.2, 4, -6], [1]);
  L.add('⚡ Event Grid', [8, 3.8, -10], [1]);
  L.add('⚙️ Rotation function', [8, 2.8, -2], [1]);
  L.add('🧩 App Configuration', [-14, 3.8, -12], [2], 'd3-label-strong');
  const flagLbl = L.add('🚩 use-gpt-4.1: off · 🔔 sentinel v7', [-14, 4.8, -12], [2]);
  L.add('👤 User', [-24, 3.4, 0], [2]);
  SVC.forEach(([n, x]) => L.add(n, [x, 4, 18], [3, 4, 5]));
  const traceLbl = L.add('🧵 trace id 4bf92f3577b34da6…', [-24, 1.2, 35], [3, 4], 'd3-label-strong');
  const spanText = spans.map((b) => L.add('', () => v(b.position.x, 1.3, b.position.z), [3, 4]));
  L.add('📚 Log Analytics workspace', [36, 0.6, 4.5], [5, 6, 7], 'd3-label-strong');
  TABLES.forEach((t, k) => L.add(t, [20 + k * 5, 2.8 + (k % 3) * 0.4, -2], [5, 6]));
  const kqlLbl = L.add('', [33, 9, -14], [6, 7]);
  L.add('5% threshold line', [47, 5.4, -14], [7]);
  L.add('🚨 Log search alert', [50, 3.4, -14], [7]);
  L.add('👩‍💻 On-call team (email)', [56, 3.4, -9], [7]);
  L.add('🔗 Webhook', [56, 2.6, -19], [7]);

  let step = 0, nVer = 2;
  const paintVers = () => { vers.forEach((x, k) => { x.b.visible = k < nVer; glow(x.m, C.amber, k === nVer - 1 ? 0.7 : 0.05); }); verLbl.set(nVer === 3 ? 'v3 · latest ✅<br>v2 · still valid for a grace period' : 'v2 · latest<br>v1 · older'); };
  const NAMES = ['POST /ask', 'send to queue', 'worker: answer', 'Cosmos DB query', 'chat completion'];
  const runTrace = (data: [number, number][], slow: boolean) => {
    spans.forEach((b, k) => { b.visible = false; spanText[k].set(''); });
    const hop = (k: number) => {
      flash(svcM[k], slow && k === 3 ? C.red : C.green, C.azure, 1.5);
      setSpan(k, data[k], slow && k === 3);
      spanText[k].set(`${NAMES[k]} · ${data[k][1] >= 1 ? data[k][1].toFixed(1) + ' s' : Math.round(data[k][1] * 1000) + ' ms'}`);
      if (k < 4) packets.send(curve([SVC[k][1], 2, 18], [SVC[k][1] + 6, 4, 18], [SVC[k + 1][1], 2, 18]), C.azure, slow && k === 2 ? 1.6 : 0.6, () => hop(k + 1));
      else later(0.6, () => hud(slow
        ? '🐌 The waterfall says it plainly: the model took 1.5 s, but the Cosmos DB span took 2.4 s because the query had no partition key. Fix the query, not the model. A tenant.id attribute on the span shows which tenants hit it.'
        : '🧵 Five spans, one trace ID. Each hop passed the traceparent header along, so Application Insights stitched web API → queue → worker → Cosmos DB → model into one timeline.', slow ? 'bad' : 'ok'));
    };
    hop(0);
  };

  // Telemetry trickles into the tables on the "logs live in tables" step
  every(stage, 0.35, () => {
    if (step !== 5) return;
    const s = Math.floor(Math.random() * 5), t = Math.floor(Math.random() * 6);
    packets.send(curve([SVC[s][1], 2, 18], [(SVC[s][1] + 20 + t * 5) / 2, 6, 8], [20 + t * 5, 1.6, -2]), [C.azure, C.purple, C.red, C.amber, C.green, 0x008575][t], 1.1, () => flash(tabM[t], C.amber, C.azureLight, 0.3));
  });

  return {
    go(i) {
      step = i;
      later.cancelAll();
      packets.clear();
      hud('');
      L.show(i);
      thief.visible = i === 0; asker.visible = i === 2; eg.visible = rotFn.visible = i === 1;
      glow(ghM, 0x24292f, 0.2); glow(appM, C.azure, 0.3);
      appLbl.set(i === 2 ? '🐍 RAG app · 🤖 model: gpt-4.1-mini' : '🐍 RAG app · 🪪 managed identity');
      nVer = 2; paintVers();
      vers.forEach((x) => (x.b.visible = x.b.visible && i <= 2));
      flagM.color.setHex(0x8a99a8); flagLbl.set('🚩 use-gpt-4.1: off · 🔔 sentinel v7');
      spans.forEach((b, k) => { b.visible = false; spanText[k].set(''); });
      svcM.forEach((m) => glow(m, C.azure, 0.25));
      traceLbl.set('🧵 trace id 4bf92f3577b34da6…');
      bars.forEach((b) => (b.visible = i >= 6)); thr.visible = i === 7;
      setBars(i === 7 ? [1, 1.4, 1, 1.6, 1.2, 1.4, 1, 1.2, 1.4, 1, 1.6, 1.2] : [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05]);
      tabM.forEach((m) => glow(m, C.azureLight, 0.15)); glow(bellM, C.amber, 0.3);
      kqlLbl.set(i === 7 ? '📈 failure rate %, 5-minute bins' : '');
      if (i === 5) hud('Telemetry flows from every service into its table: requests, dependencies (calls out), exceptions and traces (log lines).', 'info');
      cost(i >= 5 ? 2.3 : 0, 'month', i >= 5 ? 'Log Analytics ≈ $2.30 per GB ingested on pay-as-you-go: ~1 GB a month here (illustrative)' : '');
      const cams: [V3, V3][] = [[[-22, 14, 20], [-20, 1, -1]], [[-6, 12, 12], [-4, 2, -4]], [[-16, 12, 12], [-15, 1, -5]], [[0, 22, 50], [0, 1, 24]], [[0, 22, 50], [0, 1, 24]], [[16, 28, 42], [16, 1, 6]], [[33, 14, 10], [33, 2, -10]], [[42, 14, 12], [42, 2, -12]]];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (id === 'leak') {
        packets.send(curve([-32, 1.5, 4], [-33, 4, -2], [-32, 2, -8]), C.red, 0.9, () => { flash(ghM, C.red, 0x24292f, 2);
          packets.send(curve([-32, 2, -8], [-36, 4, -8], [-40, 2, -8]), C.red, 0.9, () => packets.send(curve([-40, 2, -8], [-26, 6, -2], [-14, 2, 0]), C.red, 1.2, () => { flash(appM, C.red, C.azure, 2); hud('🙈 Bots scan public repos within minutes. The key works from anywhere, so the attacker reads your data and runs up your bill. Deleting the commit isn’t enough: git history keeps it. Rotate the key now.', 'bad'); })); });
      }
      if (id === 'mi') {
        packets.send(curve([-14, 2, 0], [-8, 4, 5], [-2, 2, 8]), C.azure, 0.8, () => packets.send(curve([-2, 2, 8], [-8, 4, 4], [-14, 2, 0]), C.green, 0.8, () => packets.send(curve([-14, 2, 0], [-8, 4, -4], [-2, 2, -6]), C.green, 0.8, () => { flash(kvM, C.green, C.amber);
          packets.send(curve([-2, 2, -6], [-8, 4, -4], [-14, 2, 0]), C.amber, 0.8, () => hud('🪪 The app asked Entra ID for a token as itself (its managed identity), showed it to Key Vault, and got the secret back. The Key Vault Secrets User role allows it. No password was stored anywhere.', 'ok')); })));
      }
      if (id === 'rotate') {
        flash(kvM, C.amber, C.amber);
        packets.send(curve([-2, 3, -6], [3, 4, -9], [8, 2.2, -10]), C.amber, 0.8, () => { flash(egM, C.amber, C.amber); hud('⏰ The secret is 30 days from expiry, so Key Vault raised SecretNearExpiry through Event Grid…', 'info');
          packets.send(curve([8, 2.2, -10], [9, 3, -6], [8, 1.6, -2]), C.amber, 0.7, () => { flash(rotM, C.green, C.green);
            packets.send(curve([8, 1.6, -2], [3, 4, -3], [-2, 3, -6]), C.green, 0.8, () => {
              nVer = 3; const b = vers[2].b; b.visible = true; b.position.y = 9; paintVers();
              const drop = (n: number) => { b.position.y = Math.max(4.1, b.position.y - 0.6); if (n > 0) later(0.04, () => drop(n - 1)); };
              drop(12);
              later(0.8, () => packets.send(curve([-14, 2, 0], [-8, 4, -4], [-2, 2, -6]), C.azure, 0.7, () => packets.send(curve([-2, 2, -6], [-8, 4, -4], [-14, 2, 0]), C.green, 0.7, () => hud('🔄 The function made a new key at the service and set it in Key Vault as version 3. The app asks for the secret with no version, so its next read gets v3. No redeploy. (Keys rotate even more simply: a rotation policy does it on a schedule.)', 'ok'))));
            }); }); });
      }
      if (id === 'flag') {
        flagM.color.setHex(C.green); glow(flagM, C.green, 0.8); flagLbl.set('🚩 use-gpt-4.1: on · 🔔 sentinel v8');
        later(0.6, () => packets.send(curve([-14, 3, -12], [-12, 5, -6], [-14, 3, 0]), C.purple, 0.9, () => {
          flash(appM, C.green, C.azure); appLbl.set('🐍 RAG app · 🤖 model: gpt-4.1');
          packets.send(curve([-14, 2, 0], [-19, 3, 0], [-24, 2, 0]), C.green, 0.7, () => hud('🚩 The app saw the sentinel key change, refreshed its settings and read the flag as on. The next answer came from gpt-4.1, with no restart and no redeploy. Turn it off and it switches back just as fast.', 'ok'));
        }));
      }
      if (id === 'trace') runTrace(NORMAL, false);
      if (id === 'slow') runTrace(SLOW, true);
      if (id === 'kql') {
        glow(tabM[0], C.amber, 0.9);
        kqlLbl.set('requests | where success == false<br>| summarize count() by bin(timestamp, 5m) | render timechart');
        const vals = [1.2, 0.8, 1.6, 1.2, 0.8, 1.2, 6.5, 8, 1.6, 1.2, 0.8, 1.2];
        bars.forEach((_, k) => later(0.3 + k * 0.12, () => { packets.send(curve([20, 1.6, -2], [21 + k, 4, -8], [22 + k * 2, 1, -14]), C.azure, 0.5); setBars(vals.map((x, n) => (n <= k ? x : 0.05)), 5); }));
        later(2.2, () => hud('📊 Read it top to bottom: take requests, keep the failed ones, count them per 5 minutes, draw a chart. The spike at 14:30 stands out: 80 failures in one bin.', 'ok'));
      }
      if (id === 'alert') {
        const vals = [1, 1.4, 1, 1.6, 1.2, 1.4, 1, 1.2, 3.5, 6.2, 7.4, 6.8];
        bars.forEach((_, k) => later(k * 0.12, () => setBars(vals.map((x, n) => (n <= k ? x : 1)), 5)));
        later(1.6, () => { flash(bellM, C.red, C.amber, 3); hud('🚨 Two 5-minute windows in a row over 5%, so the log search alert fired…', 'bad');
          packets.send(curve([50, 2, -14], [53, 4, -11], [56, 2, -9]), C.red, 0.8);
          packets.send(curve([50, 2, -14], [53, 4, -17], [56, 1.6, -19]), C.red, 0.8, () => hud('🚨 The action group emailed the on-call team and called the webhook (which could open a ticket or scale out). The alert runs the KQL every 5 minutes; when the rate drops, it resolves on its own.', 'bad')); });
      }
    },
  };
}
