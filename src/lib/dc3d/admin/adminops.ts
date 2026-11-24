import { THREE, C, v, mat, box, cyl, person, ground, plate, glow, Packets, after, every, type V3 } from '../kit';
import { stepLabels, type Ctx, type Ctl } from '../types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));
type M = THREE.MeshStandardMaterial;

/**
 * AZ-104 monitor and maintain: metrics, diagnostic settings, KQL, alerts and
 * processing rules, Connection monitor, then backup vaults, restores, soft
 * delete and Site Recovery failover. Step order matches SCENE in
 * src/data/az-104/areas/ops/scene.ts.
 */
export function adminops({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 200, 0xdde6ef);
  const packets = new Packets(stage, 0.34);
  const later = after(stage);
  const solid = (c: number, e = 0.25) => mat(c, { emissive: c, emissiveIntensity: e });
  const flash = (m: M, c: number, base: number, sec = 1.2) => { glow(m, c, 1); later(sec, () => glow(m, base, 0.25)); };
  const add = <T extends THREE.Object3D>(o: T) => { S.add(o); return o; };

  /* Monitor corner: resources, metrics store, chart, log destinations, activity log */
  S.add(plate(62, 28, 0xd6e6f5, [-20, 0, -14]));
  const vmM = solid(C.azure, 0.3), stM = solid(0x2f8f9d, 0.3);
  add(box(4, 3, 4, vmM, [-44, 0.12, -8])); add(cyl(1.8, 2.6, stM, [-44, 0.12, -20]));
  const barM = solid(C.azure, 0.3), badM = solid(C.red, 0.5);
  const bars = Array.from({ length: 10 }, (_, k) => add(box(1.4, 1, 1.4, barM, [-35 + k * 2, 0.12, -24])));
  const setBars = (vals: number[], limit = Infinity) => bars.forEach((b, k) => { b.scale.y = Math.max(0.05, vals[k] ?? 0.05); b.material = (vals[k] ?? 0) > limit ? badM : barM; });
  const actM = solid(0x5c2d91, 0.25);
  add(box(5, 1.2, 3, actM, [-30, 0.12, -6]));
  const lawM = solid(C.azureLight, 0.3), arcM = solid(0x2f8f9d, 0.25), ehM = solid(C.purple, 0.25);
  const law = add(cyl(2, 3, lawM, [-6, 0.12, -6])), arch = add(box(3.4, 2, 3, arcM, [-6, 0.12, -14])), eh = add(box(3.4, 2, 3, ehM, [-6, 0.12, -22]));

  /* Alerts corner: rule, action group, receivers, processing rule wall */
  S.add(plate(40, 28, 0xf5ecd6, [28, 0, -14]));
  const bellM = solid(C.amber, 0.3), agM = solid(C.azure, 0.3);
  add(cyl(1.4, 2.4, bellM, [14, 0.12, -14])); add(box(3.4, 2.4, 3.4, agM, [24, 0.12, -14]));
  const rxM = [solid(C.green, 0.2), solid(C.green, 0.2), solid(C.green, 0.2)];
  const RX: V3[] = [[40, 0.12, -6], [40, 0.12, -14], [40, 0.12, -22]];
  add(person(C.purple, [43, 0.1, -6], 1.4));
  RX.forEach((p, k) => add(box(2.2, 1.6, 2, rxM[k], p)));
  const aprM = mat(C.red, { transparent: true, opacity: 0.3, depthWrite: false, emissive: C.red, emissiveIntensity: 0.3 });
  const apr = add(box(0.5, 4, 20, aprM, [32, 0.12, -14]));

  /* Network corner: two VMs, the path, an NSG wall */
  S.add(plate(52, 18, 0xdbe9e2, [-20, 0, 14]));
  const srcM = solid(C.azure, 0.3), dstM = solid(0x0063b1, 0.3);
  add(box(4, 3, 4, srcM, [-40, 0.12, 14])); add(box(4, 3, 4, dstM, [0, 0.12, 14]));
  const pathT = new THREE.Mesh(new THREE.TubeGeometry(curve([-38, 2, 14], [-20, 5, 14], [-2, 2, 14]), 48, 0.25, 8, false), solid(C.green, 0.4));
  const pathM = pathT.material as M;
  add(pathT);
  const nsg = add(box(0.6, 6, 6, solid(C.red, 0.5), [-20, 0.12, 14]));
  const PATH = curve([-38, 2, 14], [-20, 5, 14], [-2, 2, 14]);

  /* Backup region (East US): VM, Recovery Services vault, recovery points, Backup vault, blobs, disks */
  S.add(plate(44, 32, 0xe8e1f5, [30, 0, 22]));
  const prodM = solid(C.azure, 0.3), rsvM = solid(0x0f6cbd, 0.3), bvM = solid(0x008575, 0.3);
  add(box(4, 3, 4, prodM, [14, 0.12, 14]));
  add(box(5, 3.4, 5, rsvM, [30, 0.12, 14]));
  const rps = [0, 1, 2, 3].map((k) => { const m = solid(C.amber, 0.25); return { b: add(box(3.6, 0.5, 3.6, m, [30, 3.8 + k * 0.7, 14])), m }; });
  const newVm = add(box(4, 3, 4, solid(C.green, 0.3), [46, 0.12, 14]));
  const blobM = solid(0x2f8f9d, 0.3), diskM = solid(0x445566, 0.3);
  add(cyl(1.6, 1.8, blobM, [16, 0.12, 30])); add(cyl(1.2, 0.8, diskM, [22, 0.12, 30]));
  add(box(5, 3, 5, bvM, [34, 0.12, 30]));
  const thief = add(person(C.red, [46, 0.1, 30], 1.6));

  /* DR region (West US 2): ASR vault, replica, isolated test VNet */
  S.add(plate(40, 32, 0xdbe9e2, [78, 0, 22]));
  const asrM = solid(0x0f6cbd, 0.3);
  add(box(4, 3, 4, asrM, [66, 0.12, 30]));
  const repM = mat(C.azure, { transparent: true, opacity: 0.35, emissive: C.azure, emissiveIntensity: 0.2 });
  const replica = add(box(4, 3, 4, repM, [72, 0.12, 14]));
  const testNet = add(box(12, 0.3, 10, mat(C.amber, { transparent: true, opacity: 0.35 }), [88, 0.12, 28]));
  const testVm = add(box(3, 2.4, 3, solid(C.amber, 0.3), [88, 0.4, 28]));

  const L = stepLabels(stage);
  L.add('🖥️ vm-web01', [-44, 4, -8], [0, 1, 2], 'd3-label-strong');
  L.add('🗄️ stcontosologs', [-44, 3.4, -20], [0, 1]);
  const chartLbl = L.add('📈 Metrics: Percentage CPU (kept 93 days)', [-26, 6, -24], [0, 2], 'd3-label-strong');
  L.add('📜 Activity log (90 days)', [-30, 2.4, -6], [1]);
  L.add('📚 Log Analytics workspace', [-6, 4, -6], [1, 2], 'd3-label-strong');
  L.add('🗃️ Storage (archive)', [-6, 3, -14], [1]);
  L.add('📡 Event Hubs (SIEM)', [-6, 3, -22], [1]);
  const ruleLbl = L.add('🔔 Alert rule: CPU > 80% for 5 min', [14, 3.4, -14], [3, 4], 'd3-label-strong');
  L.add('📣 Action group ag-ops', [24, 3.4, -14], [3, 4]);
  ['📧 Email', '📱 SMS', '🔗 Webhook'].forEach((t, k) => L.add(t, [RX[k][0], 2.6, RX[k][2]], [3, 4]));
  const aprLbl = L.add('🔕 Processing rule: suppress Sat 22:00 to 02:00', [32, 5, -14], [4]);
  L.add('🖥️ vm-app01 · Network Watcher agent', [-40, 4, 14], [5]);
  L.add('🛢️ vm-sql01 :1433', [0, 4, 14], [5]);
  const cmLbl = L.add('🔍 Connection monitor: TCP 1433 every 30 s', [-20, 7, 14], [5], 'd3-label-strong');
  L.add('🖥️ vm-prod01 (East US)', [14, 4, 14], [6, 7, 8], 'd3-label-strong');
  L.add('🛟 Recovery Services vault', [30, 7, 14], [6, 7], 'd3-label-strong');
  const rpLbl = L.add('', [34, 6, 18], [6, 7]);
  L.add('🪣 Blobs', [16, 2.6, 30], [6]);
  L.add('💽 Disks', [22, 1.8, 30], [6]);
  L.add('🗃️ Backup vault', [34, 4, 30], [6, 7]);
  const newLbl = L.add('', [46, 4, 14], [7]);
  L.add('🕵️ Attacker with stolen admin rights', [46, 3.4, 30], [7]);
  L.add('♻️ Recovery Services vault (West US 2)', [66, 4, 30], [8], 'd3-label-strong');
  const repLbl = L.add('', [72, 4, 14], [8]);
  L.add('🧪 Isolated test VNet', [88, 3.4, 28], [8]);

  let step = 0, nRp = 2, failed = false;
  const paintRps = () => { rps.forEach((r, k) => { r.b.visible = k < nRp && step >= 6 && step <= 7; glow(r.m, C.amber, k === nRp - 1 ? 0.7 : 0.1); }); rpLbl.set(`${nRp} recovery points · daily 23:00 · keep 30 days`); };

  // Metrics trickle from the VM and the storage account into the store on step 0
  every(stage, 0.5, () => {
    if (step === 0) packets.send(curve([-44, 2.5, Math.random() < 0.5 ? -8 : -20], [-38, 4, -18], [-35 + Math.floor(Math.random() * 10) * 2, 1, -24]), C.azure, 0.9);
    if (step === 5 && !failed) packets.send(PATH, C.green, 0.9);
  });

  const ring = (to: number[], color: number, done?: () => void) => {
    let left = to.length;
    to.forEach((k) => packets.send(curve([24, 2, -14], [32, 4, (RX[k][2] - 14) / 2 - 7], RX[k]), color, 0.9, () => { flash(rxM[k], color, C.green); if (--left === 0) done?.(); }));
  };

  return {
    go(i) {
      step = i;
      later.cancelAll();
      packets.clear();
      hud('');
      L.show(i);
      failed = false;
      law.visible = arch.visible = eh.visible = i === 1 || i === 2;
      bars.forEach((b) => (b.visible = i === 0 || i === 2));
      setBars(i === 0 ? [2, 2.4, 2, 2.6, 2.2, 2.4, 2, 2.2, 2.6, 2.4] : Array(10).fill(0.05));
      chartLbl.set(i === 2 ? '📊 KQL result chart' : '📈 Metrics: Percentage CPU (kept 93 days)');
      apr.visible = false; aprLbl.set('🔕 Processing rule: suppress Sat 22:00 to 02:00');
      ruleLbl.set('🔔 Alert rule: CPU > 80% for 5 min');
      nsg.visible = false; pathM.color.setHex(C.green); glow(pathM, C.green, 0.4); cmLbl.set('🔍 Connection monitor: TCP 1433 every 30 s');
      nRp = 2; paintRps();
      newVm.visible = false; newLbl.set(''); thief.visible = i === 7;
      replica.visible = i === 8; repM.opacity = 0.35; testNet.visible = testVm.visible = false; repLbl.set('');
      [vmM, srcM, prodM].forEach((m) => glow(m, C.azure, 0.3)); glow(rsvM, 0x0f6cbd, 0.3); glow(bvM, 0x008575, 0.3);
      if (i === 0) hud('Platform metrics flow in every minute with no setup. Azure keeps them for 93 days.', 'info');
      if (i === 8) { repLbl.set('🔁 vm-prod01 replica (not running)'); hud('Site Recovery copies every disk write to West US 2. The replica VM doesn’t exist yet: it’s created at failover.', 'info'); }
      cost(i >= 6 ? 10 : i >= 1 && i <= 2 ? 2.3 : 0, 'month', i >= 6 ? 'Backup ≈ $10 per protected VM up to 50 GB a month, plus backup storage (illustrative)' : i >= 1 ? 'Log Analytics ≈ $2.30 per GB ingested on pay-as-you-go (illustrative)' : '');
      const cams: [V3, V3][] = [[[-26, 20, 14], [-28, 1, -16]], [[-22, 22, 16], [-22, 1, -14]], [[-24, 18, 8], [-24, 1, -18]], [[28, 20, 12], [28, 1, -14]], [[30, 20, 12], [30, 1, -14]], [[-20, 18, 38], [-20, 1, 14]], [[28, 26, 50], [28, 1, 22]], [[32, 24, 50], [32, 1, 22]], [[60, 30, 58], [56, 1, 22]]];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (id === 'cpu') { const vals = [2, 2.4, 2, 2.6, 2.2, 6.5, 8.2, 7.4, 2.6, 2.4]; bars.forEach((_, k) => later(k * 0.1, () => setBars(vals.map((x, n) => (n <= k ? x : 2)), 5))); later(1.2, () => hud('📈 Percentage CPU jumped to 92% for three minutes. You see it in Metrics explorer straight away, with Average, Max or Min per minute. No agent and no setting were needed.', 'ok')); }
      if (id === 'old') hud('🗓️ You asked for 120 days back. Platform metrics are kept for 93 days, so the oldest month is gone. To keep them longer, send AllMetrics to a Log Analytics workspace with a diagnostic setting.', 'bad');
      if (id === 'nolog') { packets.send(curve([-44, 3, -20], [-30, 5, -16], [-20, 1, -14]), C.red, 1.1, () => { flash(stM, C.red, 0x2f8f9d); hud('🕳️ The storage account produced StorageRead and StorageWrite resource logs, but there’s no diagnostic setting, so they were thrown away. Resource logs aren’t collected until you route them.', 'bad'); }); }
      if (id === 'diag') {
        flash(stM, C.green, 0x2f8f9d);
        ([[-6, 2, -6, lawM, C.azureLight], [-6, 2, -14, arcM, 0x2f8f9d], [-6, 2, -22, ehM, C.purple]] as [number, number, number, M, number][]).forEach(([x, y, z, m, base], k) => later(k * 0.3, () => packets.send(curve([-44, 3, -20], [-24, 6, (z - 20) / 2], [x, y, z]), C.green, 1, () => flash(m, C.green, base))));
        later(1.8, () => hud('✅ One diagnostic setting, three destinations: allLogs to the Log Analytics workspace for KQL, to a storage account for cheap archive, and to Event Hubs for the SIEM. A resource can have up to five diagnostic settings.', 'ok'));
      }
      if (id === 'activity') { flash(actM, C.amber, 0x5c2d91); packets.send(curve([-30, 2, -6], [-18, 5, -6], [-6, 2, -6]), C.amber, 1, () => hud('📜 The activity log recorded “Delete Virtual Machine” by ben@contoso.com at 14:02. It covers control-plane actions for the subscription and keeps them 90 days. A diagnostic setting on the subscription sends it to the workspace for longer.', 'ok')); }
      if (id === 'kql') {
        glow(lawM, C.amber, 0.9);
        chartLbl.set('AzureDiagnostics | where httpStatusCode_d >= 500<br>| summarize count() by bin(TimeGenerated, 5m) | render timechart');
        const vals = [1, 0.8, 1.2, 1, 0.8, 6, 7.6, 1.4, 1, 0.8];
        bars.forEach((_, k) => later(0.3 + k * 0.12, () => { packets.send(curve([-6, 2, -6], [-20 + k, 6, -16], [-35 + k * 2, 1, -24]), C.azure, 0.5); setBars(vals.map((x, n) => (n <= k ? x : 0.05)), 5); }));
        later(2, () => hud('📊 Top to bottom: take the table, keep the 5xx rows, count them per 5 minutes, draw a time chart. The spike at 14:25 is the failed deployment.', 'ok'));
      }
      if (id === 'fire' || id === 'maint' || id === 'after') {
        const muted = id === 'maint';
        if (muted) { apr.visible = true; aprLbl.set('🔕 Processing rule ACTIVE: maintenance window'); }
        if (id === 'after') { apr.visible = false; aprLbl.set('🔕 Window over: rule inactive'); }
        packets.send(curve([-44, 3, -8], [-10, 9, -14], [14, 2.4, -14]), C.red, 1.2, () => { flash(bellM, C.red, C.amber, 2); ruleLbl.set('🔔 Fired · Sev 2 · CPU 94%');
          packets.send(curve([14, 2, -14], [19, 4, -14], [24, 2, -14]), C.red, 0.7, () => {
            if (muted) { packets.send(curve([24, 2, -14], [28, 3, -14], [32, 2, -14]), C.red, 0.6, () => { flash(aprM as M, C.red, C.red); hud('🔕 The alert still fired and you can see it in Alerts, but the processing rule removed all action groups during the patch window. Nobody got paged for an expected reboot.', 'info'); }, 0.9); }
            else ring([0, 1, 2], C.red, () => hud(id === 'after' ? '📣 The window ended, so the next alert notified everyone again. Processing rules act on fired alerts; they never stop the rule evaluating.' : '📣 The rule fired and handed the alert to the action group: an email to the ops team, an SMS to the on-call phone and a webhook that opens a ticket. One action group can be reused by many rules.', 'bad'));
          }); });
      }
      if (id === 'path') { glow(pathM, C.green, 1); hud('🟢 Checks failed 0%, round-trip 2 ms. Connection monitor tests from the agent on vm-app01 to vm-sql01 on TCP 1433 every 30 seconds and keeps the history in Log Analytics. VM insights shows CPU, memory and the connections map for the same VMs.', 'ok'); }
      if (id === 'break') {
        failed = true; nsg.visible = true; packets.clear();
        packets.send(PATH, C.red, 1.2, () => { pathM.color.setHex(C.red); glow(pathM, C.red, 0.8); cmLbl.set('🔴 Checks failed 100% · hop 2: NSG deny'); hud('🔴 Someone added an NSG rule that denies 1433. Connection monitor turned red within a minute and its alert fired. The topology view points at the hop that drops traffic; IP flow verify names the exact rule.', 'bad'); }, 0.5);
      }
      if (id === 'backup') {
        flash(prodM, C.amber, C.azure);
        packets.send(curve([14, 3, 14], [22, 6, 14], [30, 3, 14]), C.amber, 1.1, () => { flash(rsvM, C.green, 0x0f6cbd); nRp = 3; paintRps();
          later(0.6, () => { nRp = 4; paintRps(); hud('🛟 At 23:00 the policy took a snapshot (kept 2 days for instant restore) and copied it to the vault. Each night adds a recovery point; points older than 30 days drop off by themselves.', 'ok'); }); });
      }
      if (id === 'blob') { [[16, 2, 30], [22, 1.4, 30]].forEach(([x, y, z], k) => later(k * 0.4, () => packets.send(curve([x, y, z], [(x + 34) / 2, 5, 32], [34, 2, 30]), C.green, 1, () => flash(bvM, C.green, 0x008575)))); later(1.4, () => hud('🗃️ Blobs, managed disks, PostgreSQL flexible servers and AKS go to a Backup vault, not a Recovery Services vault. Same idea, newer vault type: a backup policy and a backup instance per data source.', 'ok')); }
      if (id === 'wrongregion') hud('⛔ You picked a Recovery Services vault in West US 2 for a VM in East US. The portal won’t list it: for Azure VM backup the vault must be in the same region as the VM. Create a vault in East US.', 'bad');
      if (id === 'files') { packets.send(curve([30, 4, 14], [22, 6, 14], [14, 3, 14]), C.green, 1, () => hud('📄 File Recovery: the portal gives you a script that mounts the recovery point as a drive on the VM. You copy back the one spreadsheet and unmount. Nothing else on the VM changes.', 'ok')); }
      if (id === 'newvm') { packets.send(curve([30, 4, 14], [38, 6, 14], [46, 3, 14]), C.green, 1.1, () => { newVm.visible = true; newLbl.set('🖥️ vm-prod01-restored'); hud('🖥️ Create new virtual machine: Azure builds a fresh VM from last night’s point next to the original. Restore disks instead if you want to tweak the disks or template first.', 'ok'); }); }
      if (id === 'replace') { packets.send(curve([30, 4, 14], [22, 6, 14], [14, 3, 14]), C.amber, 1.1, () => { flash(prodM, C.green, C.azure, 2); hud('🔁 Replace existing: the VM keeps its name, NIC and IP, but its disks are swapped for the ones in the recovery point. Azure takes a safety snapshot of the current disks first.', 'ok'); }); }
      if (id === 'softdel') {
        packets.send(curve([46, 2, 30], [38, 5, 22], [30, 3, 14]), C.red, 1.1, () => { flash(rsvM, C.red, 0x0f6cbd, 2); rps.forEach((r) => glow(r.m, C.red, 0.6)); rpLbl.set('🗑️ Soft-deleted · kept 14 more days');
          hud('🛡️ The attacker stopped backup and deleted the data. Soft delete kept every recovery point for 14 more days at no cost, so you undelete and resume. Immutable vaults and multi-user authorization stop this even earlier.', 'info'); });
      }
      if (id === 'test') { testNet.visible = testVm.visible = true; packets.send(curve([66, 3, 30], [78, 6, 30], [88, 3, 28]), C.amber, 1.1, () => hud('🧪 Test failover built a copy of vm-prod01 in an isolated VNet from a recent recovery point. Production keeps running and replicating. Check the app, then run Cleanup test failover.', 'ok')); }
      if (id === 'failover') {
        flash(prodM, C.red, C.azure, 3); hud('🌪️ East US is down. You run Failover with the Latest processed recovery point…', 'bad');
        packets.send(curve([14, 3, 14], [44, 10, 14], [72, 3, 14]), C.azure, 1.6, () => { repM.opacity = 1; replica.visible = true; repLbl.set('🖥️ vm-prod01 running in West US 2 (uncommitted)'); hud('✅ The VM is running in West US 2. Next, Commit to make the choice final, then Re-protect so changes replicate back to East US.', 'ok'); });
      }
      if (id === 'commit') { repM.opacity = 1; replica.visible = true; repLbl.set('🖥️ vm-prod01 · committed · re-protecting'); packets.send(curve([72, 3, 14], [44, 10, 14], [14, 3, 14]), C.green, 1.6, () => hud('🔁 Commit removed the other recovery points. Re-protect started replicating West US 2 back to East US, so you can fail back later the same way.', 'ok')); }
    },
  };
}
