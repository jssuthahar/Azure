import { THREE, C, v, mat, box, cyl, tube, building, rack, blinkLeds, fence, person, fan, ground, plate, glow, Packets, every, after, type V3 } from './kit';
import { stepLabels, type Ctx, type Ctl } from './types';

/** Datacenter campus walk-through: security layers, data hall, rack, server/VMs, power, cooling, network. */
export function datacenter({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 220, C.grass);
  S.add(plate(48, 38, C.concrete, [0, 0, 0]));
  blinkLeds(stage);
  const later = after(stage);
  const packets = new Packets(stage, 0.28);

  /* ---- data hall ---- */
  const hall = building(20, 14, 6, [0, 0.12, 0]);
  S.add(hall.group);
  stage.onTick((_, dt) => hall.update(dt));
  const inside = new THREE.Group();
  inside.position.y = 0.12;
  S.add(inside);
  const rowZ: [number, number][] = [[-4.8, 0], [-1.6, Math.PI], [1.6, 0], [4.8, Math.PI]];
  let featured: ReturnType<typeof rack> | null = null;
  for (const [z, rot] of rowZ) {
    for (let i = 0; i < 12; i++) {
      const x = -5.5 + i;
      const r = rack([x, 0, z], 7, rot);
      inside.add(r.group);
      if (z === 1.6 && i === 6) featured = r;
    }
  }
  const coldMat = mat(C.cold, { transparent: true, opacity: 0.45, emissive: C.cold, emissiveIntensity: 0.4 });
  const hotMat = mat(C.hot, { transparent: true, opacity: 0.4, emissive: C.hot, emissiveIntensity: 0.4 });
  const aisles = new THREE.Group();
  aisles.add(box(13, 0.03, 2, coldMat, [0, 0.01, -3.2]), box(13, 0.03, 2, coldMat, [0, 0.01, 3.2]), box(13, 0.03, 2, hotMat, [0, 0.01, 0]));
  inside.add(aisles);

  /* ---- server pull-out with VMs ---- */
  const srv = featured!.servers[3];
  const srvBaseZ = srv.position.z;
  const vmColors = [C.azure, C.purple, C.amber, C.green, 0xe3008c, 0x00b7c3];
  const vms: THREE.Mesh[] = [];
  const vmGroup = new THREE.Group();
  inside.add(vmGroup);
  const hyper = box(0.9, 0.05, 0.7, mat(0x9aa9b8, { transparent: true, opacity: 0.85 }), [0.5, 1.12, 2.95]);
  vmGroup.add(hyper);
  const addVm = () => {
    const i = vms.length;
    if (i >= 6) return false;
    const m = box(0.24, 0.24, 0.24, mat(vmColors[i], { emissive: vmColors[i], emissiveIntensity: 0.25 }), [0.2 + (i % 3) * 0.3, 1.18, 2.8 + Math.floor(i / 3) * 0.32]);
    vmGroup.add(m);
    vms.push(m);
    return true;
  };
  addVm(); addVm(); addVm();
  let pull = 0, pullTarget = 0;
  stage.onTick((_, dt) => {
    pull += Math.sign(pullTarget - pull) * Math.min(Math.abs(pullTarget - pull), dt * 1.5);
    srv.position.z = srvBaseZ + pull * 0.75;
    vmGroup.visible = pull > 0.6;
  });

  /* ---- mantrap entrance ---- */
  const glass = mat(0x9fd3ff, { transparent: true, opacity: 0.35 });
  const mantrap = box(2.6, 2.6, 2.2, glass, [0, 0.12, 8.1]);
  S.add(mantrap);
  const doorMat = mat(0x3d5a78);
  S.add(box(1.2, 2.2, 0.08, doorMat, [0, 0.12, 9.2]), box(1.2, 2.2, 0.08, doorMat, [0, 0.12, 7.05]));
  const scanner = box(0.25, 0.4, 0.12, mat(C.azure, { emissive: C.azure, emissiveIntensity: 0.6 }), [1.0, 1.1, 9.3]);
  S.add(scanner);

  /* ---- perimeter ---- */
  const fen = fence(stage, 46, 36);
  const booth = box(1.8, 2.3, 1.8, mat(0xdde5ee), [3.4, 0.12, 18.8]);
  S.add(booth, box(2, 0.2, 2, mat(C.roof), [3.4, 2.4, 18.8]));
  const gate = box(5, 0.15, 0.15, mat(C.red, { emissive: C.red, emissiveIntensity: 0.3 }), [0, 1, 18]);
  S.add(gate);
  S.add(person(0x22364d, [3.4, 0.12, 17.3]));
  for (const [x, z] of [[-23, -18], [23, -18], [-23, 18], [23, 18]] as const) {
    S.add(cyl(0.08, 3.4, mat(C.steel), [x, 0, z]));
    S.add(box(0.5, 0.3, 0.3, mat(0x1b2a3d), [x, 3.4, z]));
  }

  /* ---- power yard ---- */
  const utility = tube([v(-60, 4, -9), v(-40, 4, -8), v(-24, 4, -5), v(-18.5, 2.2, -4)], 0.12, C.amber);
  S.add(utility.mesh);
  for (const x of [-56, -44, -32]) S.add(cyl(0.15, 4.3, mat(0x7a5c3a), [x, 0, x === -56 ? -8.8 : x === -44 ? -8.2 : -6.8]));
  const transformer = box(2.2, 2.2, 2, mat(0x8a99a8), [-18, 0.12, -4]);
  const ups = box(2.4, 2, 2, mat(0x5c6b7a), [-14, 0.12, -4]);
  const genMat = [mat(0xd6a100), mat(0xd6a100)];
  const gens = [box(3, 2, 1.8, genMat[0], [-17, 0.12, 1]), box(3, 2, 1.8, genMat[1], [-17, 0.12, 4.6])];
  S.add(transformer, ups, ...gens);
  const genFans = gens.map((g) => { const f = fan([g.position.x, 2.2, g.position.z], 0.6); S.add(f.group); return f; });
  const feed = tube([v(-15.5, 0.4, 0), v(-12.5, 0.4, 0), v(-10.05, 0.4, 0)], 0.15, C.amber);
  S.add(feed.mesh);
  let powerCut = false;

  /* ---- cooling ---- */
  const chillers = [-4, 0, 4].map((z) => {
    S.add(box(3, 1.6, 3, mat(0xb8c6d4), [15, 0.12, z]));
    const f = fan([15, 1.8, z], 1.1);
    S.add(f.group);
    return f;
  });
  let fanSpeed = 2;
  stage.onTick((_, dt) => {
    for (const f of chillers) f.blades.rotation.y += dt * fanSpeed;
    for (const f of genFans) if (powerCut) f.blades.rotation.y += dt * 14;
  });

  /* ---- network fibre ---- */
  const fibre = tube([v(0, 0.2, -7), v(0, 0.2, -18), v(-6, 0.2, -40), v(-12, 0.2, -100)], 0.14, C.azure);
  S.add(fibre.mesh);
  const fibreBack = new THREE.CatmullRomCurve3(fibre.curve.getPoints(40).reverse());

  /* ---- bigger picture: zones ---- */
  const big = new THREE.Group();
  const zoneMat = mat(C.azure, { transparent: true, opacity: 0.12 });
  big.add(box(60, 0.05, 50, zoneMat, [0, 0.02, 0]));
  for (const [x, z] of [[-75, -60], [55, -78]] as const) {
    big.add(box(46, 0.05, 36, zoneMat, [x, 0.02, z]), box(22, 0.1, 18, mat(C.concrete), [x, 0.05, z]));
    const b = building(14, 10, 5, [x, 0.1, z]);
    big.add(b.group);
  }
  big.visible = false;
  S.add(big);

  /* ---- labels ---- */
  const L = stepLabels(stage);
  L.add('🏢 Data hall', [0, 7.5, 0], [0]);
  L.add('⚡ Power yard', [-16, 4, 1], [0]);
  L.add('❄️ Cooling', [15, 3.4, 0], [0]);
  L.add('🚧 Security gate', [0, 3, 18], [0, 1]);
  L.add('📹 Cameras on every corner', [23, 4.2, 18], [1]);
  L.add('💂 Guard post', [3.4, 3.2, 18.8], [1]);
  L.add('🪪 Badge reader + biometric scan', [1, 2.9, 9.3], [2]);
  L.add('🚪 Two-door mantrap', [-1.4, 3.1, 8.1], [2]);
  L.add('❄️ Cold aisle', [-6, 0.6, 3.2], [3, 7]);
  L.add('🔥 Hot aisle', [-6, 0.6, 0], [3, 7]);
  L.add('🗄️ Rows of racks', [5, 2.8, -4.8], [3]);
  L.add('🗄️ One rack ≈ dozens of servers', [0.5, 2.7, 1.6], [4]);
  L.add('🖧 Top-of-rack switch', [0.5, 2.25, 2.3], [4]);
  L.add('🧠 Hypervisor', [0.5, 1.1, 3.35], [5]);
  const vmLabel = L.add('VMs of customers A, B, C', [0.5, 1.6, 2.95], [5]);
  L.add('🔌 Utility feed', [-36, 5, -7.5], [6]);
  L.add('🔋 Batteries (UPS)', [-14, 2.8, -4], [6]);
  L.add('🛢️ Diesel generators', [-17, 3.2, 2.8], [6]);
  L.add('🌬️ Chillers', [15, 3.6, 0], [7]);
  L.add('🌐 To Microsoft’s global network', [-6, 1.4, -40], [8]);
  L.add('📍 This datacenter → Availability zone 1', [0, 9, 0], [9]);
  L.add('Availability zone 2', [-75, 7, -60], [9]);
  L.add('Availability zone 3', [55, 7, -78], [9]);

  /* ---- ambient traffic ---- */
  let step = 0;
  every(stage, 0.45, () => {
    if (step === 8 || step === 0 || step === 9) {
      packets.send(fibre.curve, C.azureLight, 2.2);
      packets.send(fibreBack, 0x9fe870, 2.2);
    }
    if (step === 7) {
      for (const z of [-3.2, 3.2]) packets.send(new THREE.CatmullRomCurve3([v(13.5, 1.2, z * 0.8), v(10, 0.5, z), v(4, 0.3, z), v(-5, 0.3, z)]), C.cold, 1.8);
      packets.send(new THREE.CatmullRomCurve3([v(-5, 0.5, 0), v(0, 2.5, 0), v(6, 5, 0), v(10.5, 5.6, 0), v(14, 2, 0)]), C.hot, 2.2);
    }
  });

  /* ---- walkers ---- */
  const walker = person(C.purple, [0, 0.12, 32]);
  walker.visible = false;
  S.add(walker);
  let walk: { pts: THREE.Vector3[]; i: number; then?: () => void } | null = null;
  stage.onTick((_, dt) => {
    if (!walk) return;
    const tgt = walk.pts[walk.i];
    const d = tgt.clone().sub(walker.position);
    const stepLen = dt * 5;
    if (d.length() <= stepLen) {
      walker.position.copy(tgt);
      walk.i++;
      if (walk.i >= walk.pts.length) { const t = walk.then; walk = null; t?.(); }
    } else walker.position.add(d.normalize().multiplyScalar(stepLen));
  });
  const walkTo = (pts: V3[], then?: () => void) => { walk = { pts: pts.map((p) => v(...p)), i: 0, then }; };

  const resetPower = () => {
    powerCut = false;
    glow(utility.mat, C.amber, 0.35); utility.mat.color.setHex(C.amber);
    glow(transformer.material as THREE.Material, null);
    glow(ups.material as THREE.Material, null);
    genMat.forEach((m) => glow(m, null));
    glow(feed.mat, C.amber, 0.35);
  };

  return {
    go(i) {
      step = i;
      later.cancelAll();
      packets.clear();
      walk = null;
      walker.visible = false;
      gate.position.y = 1;
      hud('');
      resetPower();
      L.show(i);
      cost(0.048, 'hour', i === 5 ? `your VM only. ${vms.length} VMs share this server; each customer pays for their own` : 'one small VM (B2s). The building, power, cooling and guards are included');
      const open = [3, 4, 5, 7].includes(i);
      hall.setOpen(open);
      inside.visible = open;
      aisles.visible = open;
      pullTarget = i === 5 ? 1 : 0;
      fanSpeed = i === 7 ? 9 : 2;
      big.visible = i === 9;
      glow(fen.mat, i === 1 ? C.amber : null, 0.5);
      glow(mantrap.material as THREE.Material, i === 2 ? C.azure : null, 0.4);
      vmLabel.set(`${vms.length} VMs from different customers, isolated from each other`);
      const cams: [V3, V3][] = [
        [[38, 30, 44], [0, 1, 0]],
        [[14, 9, 42], [0, 1, 16]],
        [[7, 4.5, 16.5], [0, 1.6, 8]],
        [[13, 15, 15], [0, 1, 0]],
        [[1.8, 1.9, 4.0], [0.5, 1.2, 2.0]],
        [[1.5, 2.0, 4.1], [0.5, 1.1, 2.8]],
        [[-31, 12, 19], [-17, 1, 0]],
        [[26, 13, 15], [8, 1, 0]],
        [[16, 15, -32], [-2, 1, -14]],
        [[95, 85, 115], [-5, 0, -25]],
      ];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (id === 'intruder' || id === 'visitor') {
        walker.visible = true;
        walker.position.set(0, 0.12, 32);
        const ok = id === 'visitor';
        walkTo([[0, 0.12, 19]], () => {
          if (!ok) {
            hud('⛔ Access denied: no approved access request. The guard turns the visitor away.', 'bad');
            later(1.2, () => walkTo([[0, 0.12, 32]], () => { walker.visible = false; }));
            return;
          }
          hud('✅ Request approved and ID checked. The gate opens.', 'ok');
          gate.position.y = 2.6;
          later(0.6, () => walkTo([[0, 0.12, 9.6]], () => {
            hud('🪪 Badge + biometric scan in the mantrap. Only then does the inner door open.', 'info');
            later(1.4, () => walkTo([[0, 0.12, 6]], () => { walker.visible = false; hud('✅ Inside, escorted, for one approved task only.', 'ok'); }));
          }));
        });
      }
      if (id === 'addvm') {
        if (addVm()) {
          vmLabel.set(`${vms.length} VMs from different customers, isolated from each other`);
          hud(`✅ New VM placed on this server. ${vms.length} VMs now share it, each isolated by the hypervisor.`, 'ok');
        } else hud('This server is full. Azure places the next VM on another server automatically.', 'info');
      }
      if (id === 'cut' && !powerCut) {
        powerCut = true;
        utility.mat.color.setHex(C.red);
        glow(utility.mat, C.red, 0.8);
        glow(transformer.material as THREE.Material, C.red, 0.5);
        glow(ups.material as THREE.Material, C.green, 0.7);
        hud('⚡ Utility power lost! Batteries (UPS) take over instantly. Servers keep running…', 'bad');
        later(2, () => {
          genMat.forEach((m) => glow(m, C.green, 0.6));
          glow(ups.material as THREE.Material, null);
          glow(feed.mat, C.green, 0.6);
          hud('🛢️ Generators started and now power the whole building. No server noticed.', 'ok');
          cost(0.048, 'hour', 'same price during the power cut. Generators and diesel are Microsoft’s cost, not yours');
        });
      }
      if (id === 'restore') { resetPower(); hud('Utility power restored. Generators stand by again.', 'info'); }
    },
  };
}
