import { THREE, C, v, mat, box, cyl, building, rack, blinkLeds, person, ground, plate, glow, Packets, every, arc, tube, type V3 } from './kit';
import { stepLabels, type Ctx, type Ctl } from './types';

/** One region with three availability zones, a zone-redundant app, zone failure and availability sets. */
export function zones({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 200, C.grass);
  blinkLeds(stage);
  S.add(plate(86, 52, 0xb9d3ea, [0, 0, -2]));
  const packets = new Packets(stage, 0.42);
  const ZX = [-28, 0, 28];
  const tint = [0xdbe9f7, 0xdbe9f7, 0xdbe9f7];

  const zones = ZX.map((x, i) => {
    const pm = mat(tint[i]);
    const p = box(24, 0.15, 22, pm, [x, 0.12, -4]);
    S.add(p);
    const b1 = building(8, 6, 4, [x - 5, 0.27, -9]);
    const b2 = building(8, 6, 4, [x + 5, 0.27, -9]);
    S.add(b1.group, b2.group);
    stage.onTick((_, dt) => { b1.update(dt); b2.update(dt); });
    const genM = mat(0xd6a100), chM = mat(0xb8c6d4);
    S.add(box(2.4, 1.6, 1.6, genM, [x - 8, 0.27, 3]), cyl(1.1, 1.8, chM, [x + 8, 0.27, 3]));
    const appM = mat(C.green, { emissive: C.green, emissiveIntensity: 0.4 });
    const app = box(2, 2, 2, appM, [x, 0.27, 2]);
    S.add(app);
    return { x, pm, b1, b2, genM, chM, app, appM, failed: false, active: true };
  });

  // fibre between zones
  const fibres: THREE.Curve<THREE.Vector3>[] = [];
  for (const [a, b] of [[0, 1], [1, 2], [0, 2]] as const) {
    const c = arc(v(ZX[a], 0.4, -16), v(ZX[b], 0.4, -16), a === 0 && b === 2 ? 0 : 0);
    const pts = a === 0 && b === 2 ? [v(ZX[a], 0.4, -16), v(0, 0.4, -24), v(ZX[b], 0.4, -16)] : c.getPoints(10);
    const t = tube(pts, 0.25, C.azure);
    S.add(t.mesh);
    fibres.push(t.curve);
  }

  // users + load balancer
  for (let i = 0; i < 9; i++) S.add(person([C.purple, C.azure, 0xe3008c][i % 3], [-6 + (i % 5) * 3, 0, 34 + Math.floor(i / 5) * 2.5], 1.4));
  const lbM = mat(C.azure, { emissive: C.azure, emissiveIntensity: 0.5 });
  const lb = new THREE.Mesh(new THREE.OctahedronGeometry(1.6), lbM);
  lb.position.set(0, 2.2, 20);
  S.add(lb);
  stage.onTick((_, dt) => { lb.rotation.y += dt; });
  const toLb = new THREE.CatmullRomCurve3([v(0, 1.4, 33), v(0, 2, 26), v(0, 2.2, 20)]);
  const lbTo = zones.map((z) => new THREE.CatmullRomCurve3([v(0, 2.2, 20), v(z.x * 0.6, 3, 11), v(z.x, 1.6, 3)]));

  // availability set inside zone 2, building 1
  const avZone = zones[1];
  const racks = [-7.2, -5, -2.8].map((x) => { const r = rack([x, 0.27, -9], 9); S.add(r.group); return r; });
  const rackVm = racks.map((r, i) => {
    const m = mat(C.green, { emissive: C.green, emissiveIntensity: 0.5 });
    const c = box(0.8, 0.8, 0.8, m, [r.group.position.x, 2.75, -9]);
    S.add(c);
    return { m, c, failed: false, i };
  });
  const setRacksVisible = (on: boolean) => { racks.forEach((r) => (r.group.visible = on)); rackVm.forEach((x) => (x.c.visible = on)); };
  setRacksVisible(false);

  const L = stepLabels(stage);
  L.add('📍 Region: West Europe', [0, 4, -27], [0, 2]);
  ZX.forEach((x, i) => L.add(`Availability zone ${i + 1}`, [x, 6.5, -9], [0, 1, 2, 3, 4, 5]));
  L.add('⚡ Own power', [-36, 3, 3], [1]);
  L.add('❄️ Own cooling', [-20, 3, 3], [1]);
  L.add('🌐 Own network', [-28, 1.5, -15], [1]);
  L.add('⚡ Fibre: &lt; 2 ms between zones', [0, 2, -24], [2]);
  L.add('👥 Users', [0, 4, 35], [3, 4, 5]);
  L.add('⚖️ Load balancer', [0, 4.6, 20], [3, 4, 5]);
  zones.forEach((z, i) => L.add(`App copy ${i + 1}`, [z.x, 3.4, 2], [3, 4, 5]));
  rackVm.forEach((r, i) => L.add(`FD ${i} · VM ${i + 1}`, [r.c.position.x, 3.6 + (i % 2) * 0.5, -9], [6]));
  const statusHud = () => {
    const n = zones.filter((z) => z.active).length;
    cost(n * 0.048 + 0.025, 'hour', `${n} VM cop${n === 1 ? 'y' : 'ies'} + a Standard load balancer. More zones = more copies = higher bill, higher SLA`);
    const healthy = zones.filter((z) => z.active && !z.failed).length;
    const total = zones.filter((z) => z.active).length;
    if (healthy === 0) hud(`❌ App is DOWN. 0 of ${total} copies are reachable. All copies were in the failed zone.`, 'bad');
    else if (healthy < total) hud(`✅ App still ONLINE: ${healthy} of ${total} copies healthy. Users notice nothing.`, 'ok');
    else hud(`✅ App online: ${healthy} of ${total} copies healthy.`, 'ok');
  };

  const paintZone = (z: (typeof zones)[number]) => {
    z.pm.color.setHex(z.failed ? 0xf3b6b8 : 0xdbe9f7);
    for (const b of [z.b1, z.b2]) b.wallMat.color.setHex(z.failed ? 0x7b5555 : C.wall);
    z.app.visible = z.active;
    z.appM.color.setHex(z.failed ? C.red : C.green);
    glow(z.appM, z.failed ? C.red : C.green, 0.4);
  };

  let step = 0;
  let traffic = false;
  every(stage, 0.32, () => {
    if (step === 2) fibres.forEach((f) => packets.send(f, C.azureLight, 0.6));
    if (!traffic) return;
    packets.send(toLb, C.purple, 0.9, () => {
      const ok = zones.filter((z) => z.active && !z.failed);
      if (!ok.length) { packets.send(lbTo[0], C.red, 1.4, undefined, 0.25); return; }
      const z = ok[Math.floor(Math.random() * ok.length)];
      packets.send(lbTo[zones.indexOf(z)], C.green, 0.9);
    });
  });

  const reset = () => {
    zones.forEach((z) => { z.failed = false; z.active = true; paintZone(z); });
    rackVm.forEach((r) => { r.failed = false; r.m.color.setHex(C.green); glow(r.m, C.green, 0.5); glow(racks[r.i].frameMat, null); });
  };

  return {
    go(i) {
      step = i;
      packets.clear();
      hud('');
      reset();
      L.show(i);
      traffic = i >= 3 && i <= 5;
      zones.forEach((z, k) => glow(z.pm, i === 1 && k === 0 ? C.azure : null, 0.25));
      avZone.b1.setOpen(i === 6);
      setRacksVisible(i === 6);
      if (i === 4) { zones[0].failed = true; paintZone(zones[0]); }
      if (traffic) statusHud();
      if (i === 6) { hud('3 VMs in an availability set, one per fault domain (rack).', 'info'); cost(0.144, 'hour', 'the availability set is free; you pay for the 3 VMs'); }
      if (i < 3) cost(0, 'hour', '');
      const cams: [V3, V3][] = [
        [[0, 58, 78], [0, 0, -4]],
        [[-28, 22, 30], [-28, 1, -4]],
        [[0, 46, 34], [0, 0, -14]],
        [[0, 38, 64], [0, 0, 4]],
        [[0, 38, 64], [0, 0, 4]],
        [[0, 38, 64], [0, 0, 4]],
        [[-2, 8, 3], [-5, 1.6, -9]],
      ];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (id === 'failz1') { zones[0].failed = true; paintZone(zones[0]); statusHud(); }
      if (id === 'restore') { reset(); if (traffic) statusHud(); else hud('Everything restored.', 'info'); }
      if (id === 'zonal') { zones.forEach((z, k) => { z.active = k === 0; z.failed = false; paintZone(z); }); hud('📌 Zonal: the only copy is pinned to Zone 1. Now fail Zone 1.', 'info'); }
      if (id === 'redundant') { zones.forEach((z) => { z.active = true; z.failed = false; paintZone(z); }); hud('🧩 Zone-redundant: a copy in every zone. Now fail Zone 1.', 'info'); }
      if (id === 'failrack') {
        const r = rackVm[1];
        r.failed = true;
        r.m.color.setHex(C.red);
        glow(r.m, C.red, 0.6);
        glow(racks[1].frameMat, C.red, 0.5);
        hud('💥 Rack in fault domain 1 lost power. VM 2 is down, VMs 1 and 3 keep serving: 2 of 3 healthy.', 'ok');
      }
    },
  };
}
