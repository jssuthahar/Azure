import { THREE, C, v, mat, box, cyl, ground, plate, glow, rack, blinkLeds, Packets, after, type V3 } from '../kit';
import { stepLabels, type Ctx, type Ctl } from '../types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));
type M = THREE.MeshStandardMaterial;

/**
 * AZ-104 compute: a Bicep file becoming resources through Resource Manager
 * (parameters, what-if, Incremental vs Complete, export), a VM on its host
 * with OS/data/temp disks and caches (resize, encryption at host), moves
 * between resource groups and regions, availability sets vs zones, and a
 * scale set growing on a CPU rule.
 */
export function admincompute({ stage, hud, cost, money }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 190, 0xdde6ef);
  blinkLeds(stage);
  const packets = new Packets(stage, 0.36);
  const later = after(stage);
  const solid = (c: number, e = 0.25) => mat(c, { emissive: c, emissiveIntensity: e });
  const flash = (m: M, c: number, base: number, sec = 1.2) => { glow(m, c, 1); later(sec, () => glow(m, base, 0.25)); };
  const ghost = (c: number, o = 0.18) => mat(c, { transparent: true, opacity: o, depthWrite: false });

  /* ---------- Infrastructure as code (steps 0-2) ---------- */
  S.add(plate(50, 30, 0xe8e1f5, [-42, 0, 2]));
  const fileM = solid(0xf3f2f1, 0.1);
  S.add(box(7, 9, 0.8, fileM, [-60, 0.12, 0]));
  const PARTS: [string, number][] = [['param', C.purple], ['var', C.amber], ['resource', C.azure], ['output', C.green]];
  const partM = PARTS.map(([, c], k) => { const m = solid(c, 0.25); S.add(box(5.6, 1.4, 1, m, [-60, 6.9 - k * 2, 0.2])); return m; });
  const armM = solid(C.azure, 0.35);
  const arm = new THREE.Mesh(new THREE.OctahedronGeometry(2.4), armM);
  arm.position.set(-45, 3.4, 0);
  S.add(arm);
  S.add(plate(18, 16, 0xd6e6f5, [-28, 0.05, 0]));
  const stM = solid(0x2f8f9d, 0.25);
  const st = box(4, 3, 4, stM, [-31, 0.2, -2]);
  const scrM = solid(0x8a99a8, 0.2);
  const scratch = box(3.4, 2.4, 3.4, scrM, [-24, 0.2, 4]);
  const jsonM = solid(0xc19c00, 0.2), bicepM = solid(C.purple, 0.25);
  const jsonDoc = box(5, 6.5, 0.6, jsonM, [-44, 0.12, 11]);
  const bicepDoc = box(5, 6.5, 0.6, bicepM, [-56, 0.12, 11]);
  S.add(st, scratch, jsonDoc, bicepDoc);
  stage.onTick((_, dt) => { arm.rotation.y += dt * 0.6; });

  /* ---------- VM on its host (steps 3-4) ---------- */
  S.add(plate(36, 30, 0xdbe9e2, [2, 0, 4]));
  const hostM = mat(0x34495e, { roughness: 0.45, metalness: 0.4 });
  S.add(box(16, 2, 9, hostM, [0, 0.12, -2]));
  const vmM = solid(C.azure, 0.3);
  const vm = box(5, 3, 4, vmM, [-2, 2.12, -2]);
  const tmpM = solid(C.amber, 0.25), cacheM = solid(0xe3008c, 0.25);
  const tmp = box(2.4, 0.8, 2.4, tmpM, [4.5, 2.12, -4]);
  const cache = box(2.4, 0.8, 2.4, cacheM, [4.5, 2.12, 0]);
  S.add(vm, tmp, cache);
  S.add(plate(22, 8, 0xc9d3dd, [0, 0.05, 12]));
  const osM = solid(C.azure, 0.25), dataM = solid(0x2f8f9d, 0.25);
  const osDisk = cyl(1.6, 1.4, osM, [-5, 0.2, 12]);
  const dataDisk = cyl(1.6, 1.4, dataM, [1, 0.2, 12]);
  S.add(osDisk, dataDisk);
  const shieldM = ghost(C.green, 0.16);
  const shield = box(18, 6, 11, shieldM, [0, 0, -2]);
  S.add(shield);

  /* ---------- Moves (steps 5-6) ---------- */
  S.add(plate(14, 12, 0xd6e6f5, [34, 0.05, -4]), plate(14, 12, 0xe8e1f5, [52, 0.05, -4]), plate(26, 12, 0xfde7c8, [43, 0.05, -26]));
  const mvM = solid(C.azure, 0.3), mdM = solid(C.azure, 0.25), mnM = solid(C.purple, 0.25);
  const mover = new THREE.Group();
  mover.add(box(3.6, 2.4, 3, mvM, [0, 0.2, 0]), cyl(1, 1, mdM, [-3, 0.2, 2.5]), box(1.4, 1, 1.4, mnM, [2.8, 0.2, 2.5]));
  S.add(mover);
  const copy = mover.clone(true);
  S.add(copy);

  /* ---------- Availability set vs zones (step 7) ---------- */
  S.add(plate(18, 14, 0xd6e6f5, [-18, 0.05, 40]));
  const racks = [-22, -14].map((x) => rack([x, 0.12, 40], 9));
  racks.forEach((r) => { r.group.scale.setScalar(2.4); S.add(r.group); });
  const avVmM = [0, 1].map(() => solid(C.azure, 0.3));
  avVmM.forEach((m, k) => S.add(box(2.4, 1.6, 2, m, [k ? -14 : -22, 0.12, 44.5])));
  const zoneM = [0, 1, 2].map(() => mat(0xcfe3c4));
  const zvmM = [0, 1, 2].map(() => solid(C.azure, 0.3));
  [6, 16, 26].forEach((x, k) => { S.add(box(8, 0.2, 12, zoneM[k], [x, 0, 40]), box(3, 2, 3, zvmM[k], [x, 0.2, 40])); });

  /* ---------- Scale set (step 8) ---------- */
  S.add(plate(34, 16, 0xdbe9e2, [46, 0.05, 40]));
  const instM = Array.from({ length: 10 }, () => solid(C.azure, 0.3));
  const insts = instM.map((m, k) => { const b = box(2.2, 2, 2.2, m, [33 + k * 2.9, 0.2, 40]); S.add(b); return b; });
  const cpuM = solid(C.green, 0.4);
  const cpu = box(2, 1, 2, cpuM, [60, 0.2, 46]);
  S.add(cpu);

  /* ---------- labels ---------- */
  const L = stepLabels(stage);
  L.add('📄 storage.bicep', [-60, 10, 0], [0, 1, 2], 'd3-label-strong');
  PARTS.forEach(([n], k) => L.add(['param storageName · skuName', 'var tags', 'resource st (storage account)', 'output blobEndpoint'][k], [-56.4, 7.4 - k * 2, 0.8], [0]));
  L.add('⚙️ Azure Resource Manager', [-45, 7, 0], [0, 1, 2], 'd3-label-strong');
  const rgLbl = L.add('📦 rg-contoso-prod', [-28, 0.6, 8.6], [0, 1, 2]);
  const stLbl = L.add('', [-31, 4.2, -2], [0, 1, 2]);
  L.add('🗄️ stscratch01 (made by hand)', [-24, 3.6, 4], [1, 2]);
  const jsonLbl = L.add('', [-44, 7.4, 11], [2]);
  const bicepLbl = L.add('', [-56, 7.4, 11], [2]);
  const vmLbl = L.add('', [-2, 6, -2], [3, 4], 'd3-label-strong');
  L.add('🖥️ Physical host', [-6, 1.2, 3], [3, 4]);
  L.add('⚡ Temp disk (on the host)', [4.5, 3.6, -4], [3, 4]);
  L.add('🧠 Disk cache (on the host)', [4.5, 3.6, 0], [4]);
  L.add('☁️ Azure Storage: managed disks', [0, 0.6, 16.5], [3, 4]);
  L.add('💽 OS disk', [-5, 2.4, 12], [3, 4]);
  const dataLbl = L.add('💽 Data disk', [1, 2.4, 12], [4]);
  const shieldLbl = L.add('🛡️ Encryption at host', [0, 6.6, -2], [4]);
  L.add('📦 rg-reporting', [34, 0.6, 2.6], [5, 6]);
  L.add('📦 rg-finance', [52, 0.6, 2.6], [5, 6]);
  L.add('🌎 West US 2 (target region)', [43, 0.6, -19.4], [6], 'd3-label-strong');
  const moveLbl = L.add('', () => v(mover.position.x, 4.4, mover.position.z), [5, 6]);
  L.add('🧱 Availability set: fault domain 0', [-22, 7, 40], [7]);
  L.add('fault domain 1', [-14, 7, 40], [7]);
  ['Zone 1', 'Zone 2', 'Zone 3'].forEach((z, k) => L.add(`🏢 ${z}`, [6 + k * 10, 3.6, 40], [7]));
  const scaleLbl = L.add('', [46, 5, 40], [8], 'd3-label-strong');
  const cpuLbl = L.add('', [60, 4, 46], [8]);

  let step = 0, size = 'D2s', running = true, eah = false, attached = false, count = 3, moved = 0;
  const SIZE: Record<string, [number, number, string]> = { D2s: [1, 0.1, 'Standard_D2s_v5 · 2 vCPU · 8 GiB'], D4s: [1.3, 0.2, 'Standard_D4s_v5 · 4 vCPU · 16 GiB'], E4s: [1.3, 0.26, 'Standard_E4s_v5 · 4 vCPU · 32 GiB'] };
  const paintVm = () => {
    const [sc, hr, label] = SIZE[size];
    vm.scale.set(sc, 1, sc);
    vmM.color.setHex(running ? C.azure : 0x8a99a8); glow(vmM, running ? C.azure : 0x8a99a8, running ? 0.3 : 0.05);
    vmLbl.set(`🖥️ vm-app-01 · ${label}<br>${running ? '🟢 Running' : '⚪ Stopped (deallocated)'}${eah ? ' · 🔒 encryption at host' : ''}`);
    if (step === 3 || step === 4) cost(running ? hr : 0, 'hour', running ? `VM compute ≈ ${money(hr)}/hour (illustrative). Deallocated VMs stop compute billing; disks still cost.` : 'Deallocated: no compute charge. Managed disks are still billed.');
  };
  const paintScale = () => {
    insts.forEach((b, k) => (b.visible = k < count));
    scaleLbl.set(`🧮 vmss-web · Flexible · zones 1 2 3<br>${count} instances (min 3, max 10)`);
    if (step === 8) cost(count * 0.05, 'hour', `${count} × Standard_B2s ≈ ${money(count * 0.05)}/hour (illustrative)`);
  };
  const setMover = (where: 'src' | 'dst' | 'region', obj = mover) => { const p: Record<string, V3> = { src: [34, 0, -4], dst: [52, 0, -4], region: [43, 0, -26] }; obj.position.set(...p[where]); };
  const slide = (obj: THREE.Object3D, to: V3, sec = 1.2, done?: () => void) => {
    const from = obj.position.clone(), target = v(...to); let t = 0;
    const tick = () => { t = Math.min(1, t + 0.05 / sec); obj.position.lerpVectors(from, target, t); if (t < 1) later(0.05, tick); else done?.(); };
    tick();
  };

  return {
    go(i) {
      step = i;
      later.cancelAll(); packets.clear(); hud(''); L.show(i);
      cost(0, 'hour', '');
      partM.forEach((m, k) => glow(m, PARTS[k][1], 0.25)); glow(armM, C.azure, 0.35);
      st.visible = i >= 1 && i <= 2; scratch.visible = i === 1 || i === 2; glow(scrM, 0x8a99a8, 0.2);
      stLbl.set(i >= 1 ? '🗄️ stcontosologs · Standard_ZRS' : ''); rgLbl.set('📦 rg-contoso-prod');
      jsonDoc.visible = bicepDoc.visible = false; jsonLbl.set(''); bicepLbl.set('');
      size = 'D2s'; running = true; eah = false; attached = false;
      dataDisk.visible = false; dataLbl.show(false); shield.visible = false; shieldLbl.show(false);
      glow(tmpM, C.amber, 0.25); glow(cacheM, 0xe3008c, 0.25); cache.visible = i === 4;
      paintVm();
      mover.visible = i === 5 || i === 6; copy.visible = false; moved = 0;
      setMover(i === 6 ? 'dst' : 'src'); setMover('region', copy);
      moveLbl.set(i === 6 ? '🖥️ vm-rpt-01 + disk + NIC · East US' : '🖥️ vm-rpt-01 · 💽 disk · 🔌 NIC');
      avVmM.forEach((m) => glow(m, C.azure, 0.3)); zvmM.forEach((m) => glow(m, C.azure, 0.3)); zoneM.forEach((m) => m.color.setHex(0xcfe3c4));
      racks.forEach((r) => glow(r.frameMat, null));
      count = 3; paintScale(); cpuM.color.setHex(C.green); cpu.scale.y = 1; cpuLbl.set('📈 Avg CPU 35%');
      if (i === 1) hud('Run what-if first: it shows + create, ~ modify and - delete without changing anything.', 'info');
      const cams: [V3, V3][] = [[[-44, 18, 30], [-44, 3, 0]], [[-36, 18, 30], [-34, 2, 0]], [[-44, 18, 34], [-44, 3, 5]], [[6, 16, 28], [0, 2, 3]], [[6, 16, 28], [0, 2, 3]], [[43, 18, 22], [43, 1, -4]], [[43, 26, 22], [45, 1, -14]], [[2, 22, 70], [2, 2, 40]], [[46, 18, 64], [46, 2, 40]]];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (id === 'deploy') {
        partM.forEach((m, k) => later(k * 0.3, () => flash(m, C.green, PARTS[k][1], 0.8)));
        packets.send(curve([-60, 5, 1], [-52, 7, 1], [-45, 3.4, 0]), C.purple, 1, () => { flash(armM, C.green, C.azure);
          packets.send(curve([-45, 3, 0], [-38, 6, -1], [-31, 2, -2]), C.azure, 1, () => { st.visible = true; stLbl.set('🗄️ stcontosologs · Standard_ZRS'); flash(stM, C.green, 0x2f8f9d);
            later(0.4, () => hud('📄 → ⚙️ → 🗄️ The CLI compiled Bicep to ARM JSON, Resource Manager checked the parameters against @allowed, then created the storage account. The output blobEndpoint came back to you. Run it again and nothing changes: deployments are idempotent.', 'ok')); }); });
      }
      if (id === 'badparam') {
        glow(partM[0], C.red, 1);
        packets.send(curve([-60, 5, 1], [-52, 7, 1], [-45, 3.4, 0]), C.red, 1, () => { flash(armM, C.red, C.azure, 2); hud('⛔ skuName=Premium_LRS isn\'t in the @allowed list (Standard_LRS, Standard_ZRS, Standard_GRS). Validation failed before anything was created, so there\'s nothing to clean up.', 'bad'); }, 0.9);
      }
      if (id === 'whatif') {
        flash(armM, C.amber, C.azure, 2); glow(stM, C.green, 0.8); glow(scrM, C.red, 0.8);
        hud('🔍 what-if, Incremental: = stcontosologs (no change). In Complete mode it would add: - stscratch01 (delete). Nothing was deployed.', 'info');
      }
      if (id === 'incremental') {
        packets.send(curve([-45, 3, 0], [-38, 6, -1], [-31, 2, -2]), C.azure, 1, () => { flash(stM, C.green, 0x2f8f9d); hud('➕ Incremental (the default): resources in the template are created or updated. stscratch01 isn\'t in the template, so it\'s left alone.', 'ok'); });
      }
      if (id === 'complete') {
        packets.send(curve([-45, 3, 0], [-36, 6, 2], [-24, 2, 4]), C.red, 1.1, () => { glow(scrM, C.red, 1); later(0.6, () => { scratch.visible = false; hud('🗑️ Complete mode made the resource group match the template exactly, so stscratch01 was deleted. If that was someone\'s data, it\'s gone. A CanNotDelete lock would have stopped it.', 'bad'); }); });
      }
      if (id === 'export') {
        jsonDoc.visible = true; jsonDoc.position.set(-28, 0.12, 0);
        slide(jsonDoc, [-44, 0.12, 11], 1.2, () => { jsonLbl.set('🧾 exported.json (ARM)<br>names and values hard-coded'); hud('📤 Export template (portal: Automation › Export template, or az group export) wrote what exists now as ARM JSON. It can\'t include every property and it hard-codes names, so it\'s a starting point.', 'ok'); });
      }
      if (id === 'decompile') {
        if (!jsonDoc.visible) { jsonDoc.visible = true; jsonLbl.set('🧾 exported.json (ARM)'); }
        packets.send(curve([-44, 4, 11], [-50, 7, 12], [-56, 4, 11]), C.purple, 1, () => { bicepDoc.visible = true; bicepLbl.set('💪 exported.bicep'); hud('🔁 az bicep decompile --file exported.json turned the JSON into Bicep. It\'s best effort: read the warnings, rename symbols and turn hard-coded values into parameters.', 'ok'); });
      }
      if (id === 'resize') {
        running = false; paintVm(); hud('🔄 Resizing Standard_D2s_v5 to Standard_D4s_v5. That size is offered on the hardware cluster the VM already runs on, so Azure only needs a restart…', 'info');
        later(1.4, () => { size = size === 'D2s' ? 'D4s' : 'D2s'; running = true; paintVm(); flash(vmM, C.green, C.azure); hud('🔄 Resized with one restart. When the size is on the VM\'s current hardware cluster, that\'s all it takes: a few minutes of downtime.', 'ok'); });
      }
      if (id === 'family') {
        flash(vmM, C.red, C.azure, 2);
        hud('⛔ Standard_E4s_v5 isn\'t available on the cluster hosting the VM, so it\'s greyed out while the VM runs. Deallocate first: the VM leaves its host and every size in the region opens up.', 'bad');
      }
      if (id === 'dealloc') {
        running = false; paintVm(); glow(tmpM, 0x8a99a8, 0.05);
        later(1.2, () => { size = 'E4s'; paintVm(); flash(vmM, C.amber, 0x8a99a8, 0.8); });
        later(2.4, () => { running = true; paintVm(); glow(tmpM, C.amber, 0.25); hud('✅ Deallocated, resized to Standard_E4s_v5 (memory optimised), started on a new host. The OS and data disks came along (they live in Azure Storage), but the temp disk is a fresh, empty one.', 'ok'); });
      }
      if (id === 'attach') {
        dataDisk.visible = true; dataLbl.show(true); attached = true;
        packets.send(curve([1, 2, 12], [0, 5, 6], [-2, 3, -2]), 0x2f8f9d, 1, () => { flash(dataM, C.green, 0x2f8f9d); hud('💽 A 128 GiB Premium SSD data disk attached at LUN 0 with ReadOnly host caching, while the VM kept running. Inside the OS you still partition and format it.', 'ok'); });
      }
      if (id === 'redeploy') {
        glow(tmpM, C.red, 1);
        later(1, () => { glow(tmpM, 0x8a99a8, 0.05); hud('⚠️ The VM was deallocated and came back on another host. OS and data disks are safe in Azure Storage, but the temp disk (D: on Windows, /mnt on Linux) is new and empty. Never keep data you need there.', 'bad'); });
        later(2.4, () => glow(tmpM, C.amber, 0.25));
      }
      if (id === 'eah') {
        running = false; paintVm();
        hud('🔧 Feature EncryptionAtHost registered. The VM must be deallocated to switch it on…', 'info');
        later(1.4, () => { eah = true; shield.visible = true; shieldLbl.show(true); glow(tmpM, C.green, 0.6); glow(cacheM, C.green, 0.6); running = true; paintVm();
          packets.send(curve([-2, 3, -2], [-3, 5, 6], [-5, 1.6, 12]), C.green, 1);
          if (attached) packets.send(curve([-2, 3, -2], [0, 5, 6], [1, 1.6, 12]), C.green, 1);
          later(1.1, () => hud('🛡️ Encryption at host: the temp disk and the OS/data disk caches are encrypted on the host itself, and data travels to Azure Storage already encrypted. Server-side encryption already covered the managed disks at rest.', 'ok')); });
      }
      if (id === 'movealone') {
        flash(mvM, C.red, C.azure, 2);
        packets.send(curve([34, 2, -4], [43, 6, -4], [52, 2, -4]), C.red, 1.2, () => hud('⛔ A VM can\'t leave without its OS disk and network interface: they\'re dependent resources. Select them too (plus the public IP and NSG). Across subscriptions the virtual network has to go as well.', 'bad'), 0.6);
      }
      if (id === 'movedeps') {
        if (moved) return;
        moved = 1;
        slide(mover, [52, 0, -4], 1.4, () => { moveLbl.set('🖥️ vm-rpt-01 · now in rg-finance'); hud('✅ Moved together. Same region, VM still running, but every resource ID changed (it contains the resource group name). Update scripts, alerts and role assignments that used the old IDs.', 'ok'); });
      }
      if (id === 'mover') {
        copy.visible = true; copy.scale.setScalar(0.01);
        hud('🚚 Resource Mover: dependencies added (disk, NIC, VNet), then Prepare…', 'info');
        const grow = (k: number) => { copy.scale.setScalar(Math.min(1, 0.01 + k * 0.1)); if (k < 10) later(0.08, () => grow(k + 1)); };
        packets.send(curve([52, 2, -4], [48, 7, -15], [43, 2, -26]), C.azure, 1.2, () => { grow(0); hud('🚚 Initiate move: a copy is built in West US 2 from replicated disks…', 'info');
          later(1.6, () => hud('✅ Commit: the copy in West US 2 is now the real one. The source in East US still exists (and still costs) until you delete it. A region move is really a copy, unlike a resource group move.', 'ok')); });
      }
      if (id === 'rack') {
        glow(racks[0].frameMat, C.red, 1); glow(avVmM[0], C.red, 1);
        later(0.6, () => hud('🔥 Fault domain 0 lost power. vm-web-01 is down, but vm-web-02 sits in fault domain 1 with its own power and network switch, so the app keeps serving. Planned maintenance works the same way across update domains.', 'bad'));
      }
      if (id === 'zone') {
        zoneM[0].color.setHex(0xf3b8b8); glow(zvmM[0], C.red, 1);
        later(0.6, () => hud('🏢 Zone 1 is down: a whole datacenter. An availability set lives in one datacenter and wouldn\'t survive this; the VMs in zones 2 and 3 do. That\'s why zones get the 99.99% SLA and sets 99.95%.', 'bad'));
      }
      if (id === 'spike') {
        cpuM.color.setHex(C.red); cpu.scale.y = 4; cpuLbl.set('📈 Avg CPU 85% for 5 min');
        later(1, () => { count = Math.min(10, count + 2); paintScale(); insts.slice(count - 2, count).forEach((_, k) => flash(instM[count - 2 + k], C.green, C.azure)); hud('📈 Rule "Percentage CPU > 70 avg 5m → +2" fired. Two instances joined, spread across the zones. A 5-minute cool-down stops it reacting again too soon.', 'ok'); });
      }
      if (id === 'quiet') {
        cpuM.color.setHex(C.green); cpu.scale.y = 0.6; cpuLbl.set('📉 Avg CPU 20%');
        later(1, () => { count = Math.max(3, count - 1); paintScale(); hud(count === 3 ? '🌙 CPU is low, but 3 is the minimum, so nothing is removed. Without a scale-in rule the extra instances would run (and bill) forever.' : '🌙 Rule "Percentage CPU < 30 avg 5m → -1" removed an instance. It never goes below the minimum of 3.', 'info'); });
      }
    },
  };
}
