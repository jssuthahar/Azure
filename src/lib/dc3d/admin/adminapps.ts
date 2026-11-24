import { THREE, C, v, mat, box, cyl, person, ground, plate, glow, Packets, after, type V3 } from '../kit';
import { stepLabels, type Ctx, type Ctl } from '../types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));
type M = THREE.MeshStandardMaterial;

/**
 * AZ-104 apps: a registry feeding Container Instances and a Container Apps
 * environment, an App Service plan as a row of VMs (scale out, scale up,
 * autoscale), a custom domain with TLS, backups to storage, VNet integration
 * and access restrictions, and a staging slot swapping with production.
 */
export function adminapps({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 180, 0xdde6ef);
  const packets = new Packets(stage, 0.36);
  const later = after(stage);
  const solid = (c: number, e = 0.25) => mat(c, { emissive: c, emissiveIntensity: e });
  const flash = (m: M, c: number, base: number, sec = 1) => { glow(m, c, 1); later(sec, () => glow(m, base, 0.25)); };

  // Containers corner: registry, a replica in another region, ACI group, Container Apps environment
  S.add(plate(40, 40, 0xe3ecf7, [-30, 0, 0]));
  const acrM = solid(C.azure, 0.3), repM = solid(C.azure, 0.3);
  S.add(cyl(2, 3, acrM, [-44, 0.12, -10]));
  const replica = cyl(1.6, 2.4, repM, [-44, 0.12, -22]);
  const aciM = solid(0x008575, 0.3);
  S.add(replica, box(5, 3.4, 4, aciM, [-28, 0.12, -10]));
  S.add(plate(22, 14, 0xd9d2ee, [-28, 0.13, 8]));
  const caUser = person(C.green, [-46, 0.1, 8], 1.6);
  S.add(caUser);
  const repMs: M[] = [];
  const replicas = Array.from({ length: 10 }, (_, k) => { const m = solid(C.purple, 0.3); repMs.push(m); const b = box(2, 2, 2, m, [-35 + (k % 5) * 3.6, 0.2, 5 + Math.floor(k / 5) * 4.4]); S.add(b); return b; });
  const setReplicas = (n: number) => replicas.forEach((b, k) => (b.visible = k < n));

  // App Service plan: a row of VMs (instances), each running the same apps
  S.add(plate(36, 18, 0xdbe9e2, [6, 0, 0]));
  const vmMs: M[] = [];
  const vms = Array.from({ length: 6 }, (_, k) => { const m = solid(0x5c6f82, 0.2); vmMs.push(m); const g = new THREE.Group(); g.add(box(4, 3, 4, m), box(1.4, 0.8, 1.4, solid(C.azure, 0.4), [-0.9, 3, 0]), box(1.4, 0.8, 1.4, solid(C.amber, 0.4), [0.9, 3, 0])); g.position.set(-8 + k * 5.6, 0.12, 0); S.add(g); return g; });
  const setVms = (n: number, big = false) => vms.forEach((g, k) => { g.visible = k < n; g.scale.set(big ? 1.25 : 1, big ? 1.35 : 1, big ? 1.25 : 1); });

  // Slots: production and staging above the plan
  const prodM = solid(C.green, 0.3), stageM = solid(C.amber, 0.3);
  const prod = box(6, 2.4, 4, prodM, [0, 0.12, -14]), stg = box(6, 2.4, 4, stageM, [12, 0.12, -14]);
  S.add(prod, stg);

  // Domain + TLS: DNS zone, a browser user, a lock on the app's front door
  const dnsM = solid(C.azureLight, 0.25), lockM = solid(C.amber, 0.3), oldM = solid(0x8a99a8, 0.2);
  S.add(box(4, 2.6, 4, dnsM, [36, 0.12, -14]), cyl(1.2, 1.6, lockM, [24, 0.12, 0]));
  const browser = person(C.azure, [44, 0.1, 0], 1.6), oldClient = person(0x8a99a8, [44, 0.1, 6], 1.6);
  S.add(browser, oldClient, box(1.4, 1, 1, oldM, [44, 2.8, 6]));

  // Backup storage
  const stM = solid(0x2f8f9d, 0.3);
  S.add(cyl(2.2, 3, stM, [36, 0.12, 14]));

  // Networking: VNet with a private database, the office and the internet
  S.add(plate(30, 12, 0xd6e6f5, [6, 0, 22]));
  const dbM = solid(0x0063b1, 0.3), snetM = mat(C.azure, { transparent: true, opacity: 0.25 });
  S.add(cyl(1.8, 2.6, dbM, [16, 0.12, 22]), box(8, 0.3, 6, snetM, [-2, 0.13, 22]));
  const office = person(C.green, [-14, 0.1, 30], 1.6), stranger = person(C.red, [28, 0.1, 30], 1.6);
  S.add(office, stranger);

  const L = stepLabels(stage);
  L.add('🐳 Azure Container Registry', [-44, 4.6, -10], [0, 1], 'd3-label-strong');
  const acrLbl = L.add('Standard · acrcontoso.azurecr.io', [-44, 3.6, -10], [0]);
  const repLbl = L.add('🌍 West Europe replica (Premium)', [-44, 3.4, -22], [0]);
  L.add('📦 Container Instances · container group', [-28, 5, -10], [0], 'd3-label-strong');
  const aciLbl = L.add('1 vCPU · 1.5 GB · restart: OnFailure', [-28, 4, -10], [0]);
  L.add('🧊 Container Apps environment', [-28, 4.6, 14], [1], 'd3-label-strong');
  const caLbl = L.add('', [-28, 3.6, 14], [1]);
  L.add('👥 Users', [-46, 3.4, 8], [1]);
  L.add('📄 App Service plan = the VMs', [6, 6, 6], [2, 3], 'd3-label-strong');
  const planLbl = L.add('', [6, 5, 6], [2, 3]);
  const asLbl = L.add('', [6, 8, 0], [3]);
  L.add('🔎 Azure DNS · contoso-learn.com', [36, 4, -14], [4], 'd3-label-strong');
  const dnsLbl = L.add('', [36, 3.2, -14], [4]);
  const domLbl = L.add('', [24, 5.6, 0], [4, 5]);
  L.add('👩‍💻 Browser', [44, 3.4, 0], [4, 5]);
  L.add('🖥️ Old client (TLS 1.0)', [44, 4, 6], [5]);
  L.add('🗄️ Storage · webbackups container', [36, 4.4, 14], [6], 'd3-label-strong');
  const bkLbl = L.add('', [36, 3.4, 14], [6]);
  L.add('🔷 VNet · snet-app-outbound (/26, delegated)', [-2, 1.6, 22], [7]);
  L.add('🛢️ Private database', [16, 3.6, 22], [7]);
  L.add('🏢 Office 203.0.113.0/24', [-14, 3.4, 30], [7]);
  L.add('🌐 Internet', [28, 3.4, 30], [7]);
  const accLbl = L.add('', [6, 5.6, 8], [7]);
  const prodLbl = L.add('', [0, 3.6, -14], [8], 'd3-label-strong');
  const stgLbl = L.add('', [12, 3.6, -14], [8], 'd3-label-strong');

  let step = 0, nVm = 2, big = false, premium = false, nRep = 0, swapped = false;
  const paintPlan = () => { setVms(nVm, big); planLbl.set(`${big || step === 3 ? 'Standard S1' : 'Basic B1'} · ${nVm} instance${nVm > 1 ? 's' : ''}`); };
  const paintSlots = () => { prodLbl.set(`🟢 production · ${swapped ? 'v2' : 'v1'} · ENVIRONMENT=Production`); stgLbl.set(`🟡 staging · ${swapped ? 'v1' : 'v2'} · ENVIRONMENT=Staging`); };
  const front: V3 = [24, 2, 0];

  return {
    go(i) {
      step = i;
      later.cancelAll();
      packets.clear();
      hud('');
      L.show(i);
      premium = false; replica.visible = i === 0 && premium;
      acrLbl.set('Standard · acrcontoso.azurecr.io'); repLbl.set('');
      glow(aciM, 0x008575, 0.3); aciLbl.set('1 vCPU · 1.5 GB · restart: OnFailure');
      nRep = 0; setReplicas(0);
      caLbl.set('0.5 vCPU / 1.0Gi per replica · min 0 · max 10 · HTTP rule: 50 per replica');
      caUser.visible = i === 1;
      nVm = i === 3 ? 2 : i === 2 ? 1 : 2; big = false; paintPlan();
      if (i < 2) vms.forEach((g) => (g.visible = false));
      vmMs.forEach((m) => glow(m, 0x5c6f82, 0.2));
      asLbl.set(i === 3 ? '📈 Autoscale: min 2 · max 6 · CPU > 70% for 10 min → +1' : '');
      dnsLbl.set('(no records yet)'); domLbl.set(i === 5 ? '🔒 www.contoso-learn.com · managed certificate · HTTPS Only · TLS 1.2+' : '');
      browser.visible = i === 4 || i === 5; oldClient.visible = i === 5;
      glow(lockM, i === 5 ? C.green : C.amber, 0.3);
      bkLbl.set(i === 6 ? 'Daily · keep 30 days · up to 10 GB' : '');
      office.visible = stranger.visible = i === 7;
      accLbl.set(i === 7 ? '🚪 Access restrictions: 100 Allow office · Deny all' : '');
      swapped = false; paintSlots(); prod.visible = stg.visible = i === 8;
      prod.position.x = 0; stg.position.x = 12;
      if (i === 1) hud('No traffic, min replicas 0: the app has scaled to zero and costs nothing for compute right now.', 'info');
      if (i === 2) hud('One B1 VM runs both apps on this plan. Every app on a plan shares its instances.', 'info');
      cost(i >= 2 && i <= 3 ? (i === 3 ? 0.1 * 730 * 2 : 0.018 * 730) : 0, 'month', i === 2 ? 'Basic B1 ≈ $13/month per instance (illustrative)' : i === 3 ? 'Standard S1 ≈ $73/month per instance × 2 (illustrative)' : '');
      const cams: [V3, V3][] = [[[-36, 16, 14], [-34, 1, -12]], [[-28, 20, 32], [-30, 1, 8]], [[6, 16, 24], [6, 2, 0]], [[6, 18, 26], [6, 2, 0]], [[32, 16, 16], [32, 2, -6]], [[32, 14, 18], [32, 2, 2]], [[24, 16, 32], [24, 2, 8]], [[8, 20, 48], [8, 1, 20]], [[6, 14, 4], [6, 2, -14]]];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (id === 'run') {
        packets.send(curve([-44, 2.5, -10], [-36, 5, -10], [-28, 2.5, -10]), C.azure, 1, () => { flash(aciM, C.green, 0x008575, 2); aciLbl.set('▶ Running · 1 vCPU · 1.5 GB');
          later(2, () => { glow(aciM, 0x8a99a8, 0.1); aciLbl.set('⏹ Succeeded (exit 0) · billing stopped'); hud('ACI pulled the image from the registry and ran the job. Exit code 0 with restart policy OnFailure means it stays stopped, and you only paid for the seconds it ran.', 'ok'); }); });
      }
      if (id === 'spike') {
        for (let k = 0; k < 8; k++) later(k * 0.12, () => packets.send(curve([-40, 2, 0], [-34, 4, -5], [-28, 2, -10]), C.red, 0.8));
        later(1.4, () => { flash(aciM, C.red, 0x008575, 2); aciLbl.set('🔥 CPU 100% · still 1 vCPU · still 1 group'); hud('Container Instances has no autoscale. The group keeps the CPU and memory you set at creation; to change them you recreate it, and to handle more load you run more groups yourself, or move to Container Apps.', 'bad'); });
      }
      if (id === 'replicate') {
        if (!premium) {
          packets.send(curve([-44, 2.5, -10], [-44, 4, -16], [-44, 2, -22]), C.red, 0.9, undefined, 0.5);
          later(0.9, () => { hud('Refused: geo-replication is a Premium-only feature. Upgrade the registry in place (no downtime), then try again.', 'bad'); premium = true; acrLbl.set('Premium · upgrade done, try again'); });
        } else {
          replica.visible = true; repLbl.set('🌍 West Europe replica (Premium)');
          packets.send(curve([-44, 2.5, -10], [-44, 4, -16], [-44, 2, -22]), C.green, 0.9, () => { flash(repM, C.green, C.azure); hud('The Premium registry now has a replica in West Europe. Teams there pull from the nearby copy, and a push to either region syncs to both.', 'ok'); });
        }
      }
      if (id === 'load') {
        for (let k = 0; k < 12; k++) later(k * 0.1, () => packets.send(curve([-46, 2, 8], [-40, 4, 8], [-30, 1.4, 8]), C.azure, 0.7));
        const target = 8;
        for (let n = 1; n <= target; n++) later(0.8 + n * 0.25, () => { nRep = n; setReplicas(n); flash(repMs[n - 1], C.green, C.purple, 0.6); });
        later(3.2, () => hud('400 concurrent requests ÷ 50 per replica = 8 replicas. Container Apps added them within seconds and would stop at max replicas (10).', 'ok'));
      }
      if (id === 'quiet') {
        for (let n = nRep; n >= 0; n--) later((nRep - n) * 0.25, () => setReplicas(n));
        later(nRep * 0.25 + 0.4, () => { nRep = 0; hud('Traffic stopped. After the cool-down (300 seconds by default) it scaled back to min replicas, which is 0. The next request starts one again, with a short cold start.', 'info'); });
      }
      if (id === 'out') { nVm = Math.min(3, nVm + 2); paintPlan(); vms.slice(0, nVm).forEach((g, k) => later(k * 0.15, () => flash(vmMs[k], C.green, 0x5c6f82, 0.8))); hud('Scale out: more instances of the same size. Basic stops at 3, and every app on the plan runs on every instance.', 'ok'); }
      if (id === 'up') { big = true; paintPlan(); vmMs.forEach((m) => flash(m, C.azure, 0x5c6f82, 1)); hud('Scale up: same number of instances, but a bigger and richer tier. Standard adds autoscale, 5 deployment slots and daily backups; Premium v3 adds more. Apps restart onto the new hardware.', 'ok'); }
      if (id === 'cpu') {
        vmMs.slice(0, nVm).forEach((m) => glow(m, C.red, 0.8));
        hud('CPU averages 85% across the plan for 10 minutes…', 'bad');
        later(1.4, () => { nVm = Math.min(6, nVm + 1); paintPlan(); vmMs.slice(0, nVm).forEach((m) => glow(m, 0x5c6f82, 0.2)); flash(vmMs[nVm - 1], C.green, 0x5c6f82, 1.5); hud('The scale-out rule fired: +1 instance. The cool-down (5 minutes) stops it reacting again too soon. A matching scale-in rule shrinks the plan when CPU drops.', 'ok'); });
      }
      if (id === 'max') {
        const grow = (n: number) => { if (n > 6) { hud('Stuck at 6: the autoscale maximum. Raise it, or scale up to bigger instances. Standard can go to 10 instances, Premium v3 to 30.', 'bad'); return; } nVm = n; paintPlan(); flash(vmMs[n - 1], C.green, 0x5c6f82, 0.6); later(0.4, () => grow(n + 1)); };
        grow(nVm + 1);
      }
      if (id === 'unverified') {
        packets.send(curve([36, 2, -14], [30, 5, -7], [24, 2, 0]), C.red, 0.9, undefined, 0.6);
        later(1, () => hud('App Service asked DNS for asuid.www.contoso-learn.com and found nothing. Without the TXT record holding the app\'s verification ID, anyone could claim your domain, so it refuses.', 'bad'));
      }
      if (id === 'verify') {
        dnsLbl.set('TXT asuid.www = 7F3A…E21 · CNAME www → app-contoso-www01.azurewebsites.net');
        packets.send(curve([36, 2, -14], [30, 5, -7], [24, 2, 0]), C.green, 0.9, () => { domLbl.set('✅ www.contoso-learn.com · verified · no certificate yet'); flash(lockM, C.amber, C.amber);
          packets.send(curve([44, 2, 0], [34, 4, 0], front), C.azure, 0.9, () => hud('Verified. The browser follows the CNAME to the app and it answers on your name. HTTPS still warns until you bind a certificate.', 'ok')); });
      }
      if (id === 'https') {
        packets.send(curve([44, 2, 0], [34, 4, 0], front), C.amber, 0.8, () => { flash(lockM, C.amber, C.green);
          packets.send(curve(front, [34, 3, -1], [44, 2, 0]), C.amber, 0.6, () => packets.send(curve([44, 2, 0], [34, 4, 0], front), C.green, 0.8, () => { hud('http:// got a 301 redirect to https:// (HTTPS Only), then the TLS handshake used the managed certificate bound with SNI. The padlock shows.', 'ok'); })); });
      }
      if (id === 'oldtls') {
        packets.send(curve([44, 3, 6], [34, 4, 4], front), C.red, 0.9, undefined, 0.7);
        later(1.1, () => hud('Refused: the minimum inbound TLS version is 1.2, so a client that only speaks TLS 1.0 can\'t connect. That\'s what most security audits want.', 'bad'));
      }
      if (id === 'backup') {
        packets.send(curve([6, 4, 0], [22, 7, 8], [36, 2.5, 14]), 0x2f8f9d, 1.2, () => { flash(stM, C.green, 0x2f8f9d); bkLbl.set('✅ app-contoso-fin01_202611240200.zip · files + config + linked DB'); hud('Custom backup written to your container through the SAS URL. Automatic backups also run every hour with no storage account, but you can\'t download or schedule those.', 'ok'); });
      }
      if (id === 'restore') {
        packets.send(curve([36, 2.5, 14], [22, 7, 8], [6, 4, 0]), C.green, 1.2, () => { vmMs.slice(0, nVm).forEach((m) => flash(m, C.green, 0x5c6f82)); hud('Restored over the app (or into a new app or slot). Restore to a staging slot first if you want to check it before users see it.', 'ok'); });
      }
      if (id === 'outbound') {
        packets.send(curve([6, 3, 0], [0, 3, 14], [-2, 1, 22], [16, 2, 22]), C.azure, 1.4, () => { flash(dbM, C.green, 0x0063b1); hud('Outbound: VNet integration sends the app\'s calls into the delegated subnet, so it reaches the private database. This doesn\'t let anything in.', 'ok'); });
      }
      if (id === 'office') packets.send(curve([-14, 2, 30], [-4, 5, 16], [6, 3, 0]), C.green, 1.2, () => hud('Inbound from 203.0.113.0/24 matched rule 100 (Allow) and got through.', 'ok'));
      if (id === 'stranger') packets.send(curve([28, 2, 30], [18, 5, 16], [6, 3, 0]), C.red, 1.2, () => hud('No rule matched this internet address, so the implicit Deny all returned 403. For no public address at all, add a private endpoint and turn off public access.', 'bad'), 0.85);
      if (id === 'swap') {
        if (swapped) { hud('Already swapped. Use “roll back” to swap again.', 'info'); return; }
        flash(stageM, C.green, C.amber, 1.2);
        hud('Warming up staging with production\'s slot settings…', 'info');
        later(1.2, () => { const anim = (t: number) => { prod.position.x = 12 * t; stg.position.x = 12 - 12 * t; if (t < 1) later(0.03, () => anim(Math.min(1, t + 0.06))); else { swapped = true; prod.position.x = 0; stg.position.x = 12; paintSlots(); hud('Swapped. v2 is in production with no cold start, v1 waits in staging. ENVIRONMENT stayed with each slot because it\'s a slot setting.', 'ok'); } }; anim(0); });
      }
      if (id === 'rollback') {
        if (!swapped) { hud('Swap first, then roll back.', 'info'); return; }
        swapped = false; paintSlots(); flash(prodM, C.amber, C.green);
        hud('Rolled back by swapping again: v1 is live in seconds. That\'s why you keep the old build in staging until you\'re sure.', 'ok');
      }
    },
  };
}
