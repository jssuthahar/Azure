import { THREE, C, v, mat, box, cyl, person, ground, glow, Packets, after, every, type V3 } from './kit';
import { stepLabels, type Ctx, type Ctl } from './types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));

/** Management & governance: hierarchy, subscriptions, RGs, Policy, RBAC, locks, tags/cost, ARM, Monitor/Advisor. */
export function governance({ stage, hud, cost, money }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 160, 0xcfe3c4);
  const packets = new Packets(stage, 0.4);
  const later = after(stage);

  type Node = { name: string; pos: THREE.Vector3; m: THREE.MeshStandardMaterial; mesh: THREE.Mesh };
  const node = (name: string, at: V3, w: number, color: number): Node => {
    const m = mat(color, { transparent: true, opacity: 0.85, emissive: color, emissiveIntensity: 0.12 });
    const mesh = box(w, 0.5, 5, m, at);
    S.add(mesh);
    return { name, pos: v(at[0], at[1] + 0.5, at[2]), m, mesh };
  };
  const link = (a: Node, b: Node) => {
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a.pos, v(b.pos.x, a.pos.y - 1.5, b.pos.z), b.pos]), new THREE.LineBasicMaterial({ color: 0x7a8ca0 }));
    S.add(line);
  };
  const root = node('Tenant root group', [0, 24, 0], 14, 0xd6a100);
  const mgProd = node('MG: Production', [-14, 18, 0], 12, C.purple);
  const mgDev = node('MG: Development', [14, 18, 0], 10, C.purple);
  const subShop = node('Sub: Shop-Prod', [-20, 12, 0], 9, 0xc19c00);
  const subHr = node('Sub: HR-Prod', [-7, 12, 0], 8, 0xc19c00);
  const subDev = node('Sub: Dev-Test', [14, 12, 0], 9, 0xc19c00);
  const rgs = {
    web: node('rg-shop-web', [-24, 6, 0], 7, C.azure),
    data: node('rg-shop-data', [-16, 6, 0], 7, C.azure),
    hr: node('rg-hr', [-7, 6, 0], 7, C.azure),
    dev: node('rg-dev', [14, 6, 0], 8, C.azure),
  };
  [[root, mgProd], [root, mgDev], [mgProd, subShop], [mgProd, subHr], [mgDev, subDev], [subShop, rgs.web], [subShop, rgs.data], [subHr, rgs.hr], [subDev, rgs.dev]].forEach(([a, b]) => link(a, b));

  // resources on the ground under each RG
  type R = { mesh: THREE.Mesh; m: THREE.MeshStandardMaterial; rg: keyof typeof rgs; kind: string; base: number; usd: number };
  const resources: R[] = [];
  const addRes = (rg: keyof typeof rgs, kind: 'vm' | 'st' | 'db', dx: number, usd: number) => {
    const color = kind === 'vm' ? C.azure : kind === 'st' ? 0x2f8f9d : C.purple;
    const m = mat(color, { emissive: color, emissiveIntensity: 0.15 });
    const p = rgs[rg].pos;
    const mesh = kind === 'vm' ? box(1.6, 1.8, 1.6, m, [p.x + dx, 0, 4]) : cyl(0.9, 1.8, m, [p.x + dx, 0, 4]);
    S.add(mesh);
    resources.push({ mesh, m, rg, kind, base: color, usd });
  };
  addRes('web', 'vm', -2, 70); addRes('web', 'vm', 0.5, 70); addRes('web', 'st', 3, 20);
  addRes('data', 'db', -1.5, 150); addRes('data', 'st', 1.5, 20);
  addRes('hr', 'vm', -1.5, 35); addRes('hr', 'db', 1.5, 60);
  addRes('dev', 'vm', -2, 35); addRes('dev', 'vm', 0.5, 35); addRes('dev', 'st', 3, 5);
  const resLines = resources.map((r) => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([rgs[r.rg].pos, r.mesh.position.clone().add(v(0, 1.8, 0))]), new THREE.LineBasicMaterial({ color: 0xa8b8c8 })); S.add(l); return l; });

  // Ben (RBAC), lock, ARM hub + sources, Monitor
  const ben = person(0xe3008c, [-34, 0, 10], 1.6);
  S.add(ben);
  const lockM = mat(0xd6a100, { emissive: 0xd6a100, emissiveIntensity: 0.4, metalness: 0.5 });
  const lock = new THREE.Group();
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.15, 8, 20, Math.PI), lockM);
  shackle.position.y = 1.2;
  lock.add(box(1.6, 1.2, 0.6, lockM), shackle);
  lock.position.set(rgs.data.pos.x, rgs.data.pos.y + 0.3, 2.4);
  S.add(lock);
  const armM = mat(C.azure, { emissive: C.azure, emissiveIntensity: 0.5 });
  const arm = new THREE.Mesh(new THREE.OctahedronGeometry(2.2), armM);
  arm.position.set(0, 4, 16);
  S.add(arm);
  const sources = (['Portal', 'CLI', 'PowerShell', 'Bicep'] as const).map((n, i) => { const b = box(3, 1.6, 1.6, mat([0x0f6cbd, 0x1b1a19, 0x012456, C.purple][i]), [-12 + i * 8, 0, 28]); S.add(b); return { n, b }; });
  const monM = mat(0x0f6cbd, { emissive: 0x0f6cbd, emissiveIntensity: 0.4 });
  const monitor = box(4, 4, 4, monM, [30, 8, 4]);
  S.add(monitor);
  stage.onTick((_, dt) => { arm.rotation.y += dt; });

  const L = stepLabels(stage);
  [root, mgProd, mgDev].forEach((n) => L.add(n.name, n.pos.clone().add(v(0, 1.4, 0)), [0, 3], 'd3-label-strong'));
  const subLabels = [subShop, subHr, subDev].map((n) => L.add(n.name, n.pos.clone().add(v(0, 1.4, 0)), [0, 1]));
  Object.values(rgs).forEach((n) => L.add(n.name, n.pos.clone().add(v(0, 1.2, 0)), [0, 2, 4, 5]));
  L.add('👤 Ben · Virtual Machine Contributor on rg-shop-web', [-34, 4.6, 10], [4]);
  L.add('🔒 Delete lock', [rgs.data.pos.x, rgs.data.pos.y + 3.2, 2.4], [5]);
  L.add('⚙️ Azure Resource Manager', [0, 7.5, 16], [7], 'd3-label-strong');
  sources.forEach((s) => L.add(s.n, s.b.position.clone().add(v(0, 2.4, 0)), [7]));
  L.add('📈 Azure Monitor', [30, 13.5, 4], [8], 'd3-label-strong');
  const tagLabels = (['web', 'hr', 'dev'] as const).map((k) => L.add('', () => rgs[k].pos.clone().add(v(0, -3, 4)), [6]));

  const subCost = () => {
    const by = (k: (keyof typeof rgs)[]) => resources.filter((r) => k.includes(r.rg) && r.mesh.visible).reduce((s, r) => s + r.usd, 0);
    return { shop: by(['web', 'data']), hr: by(['hr']), dev: by(['dev']) };
  };
  const paintSubs = () => {
    const c = subCost();
    subLabels[0].set(`Sub: Shop-Prod · 💰 ${money(c.shop)}/mo`);
    subLabels[1].set(`Sub: HR-Prod · 💰 ${money(c.hr)}/mo`);
    subLabels[2].set(`Sub: Dev-Test · 💰 ${money(c.dev)}/mo`);
    tagLabels[0].set(`🏷️ CostCenter: Shop · ${money(c.shop)}/mo`);
    tagLabels[1].set(`🏷️ CostCenter: HR · ${money(c.hr)}/mo`);
    tagLabels[2].set(`🏷️ CostCenter: Dev · ${money(c.dev)}/mo`);
  };

  let step = 0;
  every(stage, 0.5, () => {
    if (step === 3) for (const n of [mgProd, subShop, subHr, rgs.web, rgs.data, rgs.hr]) if (Math.random() < 0.35) packets.send(curve([mgProd.pos.x, mgProd.pos.y, 0], [n.pos.x, (mgProd.pos.y + n.pos.y) / 2, 0.5], [n.pos.x, n.pos.y, 0]), C.amber, 1.2);
    if (step === 8) { const r = resources[Math.floor(Math.random() * resources.length)]; if (r.mesh.visible) packets.send(curve([r.mesh.position.x, 2, 4], [10, 10, 6], [30, 9, 4]), 0x9fe870, 1.2); }
  });

  const reset = () => {
    resources.forEach((r, i) => { r.mesh.visible = true; r.mesh.scale.setScalar(1); r.m.color.setHex(r.base); glow(r.m, r.base, 0.15); resLines[i].visible = true; });
    Object.values(rgs).forEach((n) => { n.mesh.visible = true; glow(n.m, n.m.color.getHex(), 0.12); });
    [subShop, subHr, subDev].forEach((n) => glow(n.m, n.m.color.getHex(), 0.12));
    lock.visible = step === 5;
    glow(monM, 0x0f6cbd, 0.4);
    paintSubs();
  };
  const drop = (ok: boolean) => {
    const m = mat(ok ? C.green : C.red, { emissive: ok ? C.green : C.red, emissiveIntensity: 0.4 });
    const cube = box(1.4, 1.4, 1.4, m, [rgs.web.pos.x + 5, 22, 4]);
    S.add(cube);
    let t = 0;
    stage.onTick((_, dt) => {
      if (!cube.parent) return;
      t += dt;
      if (ok) { cube.position.y = Math.max(0, 22 - t * 14); if (t > 2.6) S.remove(cube); }
      else { cube.position.y = t < 1.1 ? 22 - t * 14 : 6.6 + (t - 1.1) * 10; cube.position.x += t > 1.1 ? dt * 10 : 0; if (t > 2.4) S.remove(cube); }
    });
  };

  return {
    go(i) {
      step = i;
      later.cancelAll();
      packets.clear();
      hud('');
      L.show(i);
      reset();
      ben.visible = i === 4;
      arm.visible = i === 7;
      sources.forEach((s) => (s.b.visible = i === 7));
      monitor.visible = i === 8;
      const total = resources.reduce((s, r) => s + r.usd, 0);
      cost(i === 6 || i === 1 ? total : 0, 'month', i === 6 || i === 1 ? 'all three subscriptions together' : '');
      if (i === 6) resources.forEach((r) => { const col = r.rg === 'hr' ? C.purple : r.rg === 'dev' ? 0xf7630c : C.azure; r.m.color.setHex(col); glow(r.m, col, 0.3); });
      if (i === 1) [subShop, subHr, subDev].forEach((n) => glow(n.m, 0xffd75e, 0.5));
      if (i === 4) glow(rgs.web.m, C.green, 0.5);
      if (i === 3) hud('📜 Policy "Allowed locations: Europe only" is assigned once on MG: Production and flows down to everything below.', 'info');
      const cams: [V3, V3][] = [
        [[0, 24, 52], [0, 11, 0]], [[-4, 18, 34], [-4, 11, 0]], [[-10, 12, 30], [-10, 4, 2]], [[-8, 28, 50], [-10, 9, 0]],
        [[-26, 12, 30], [-22, 4, 4]], [[-16, 10, 22], [-16, 4, 2]], [[-4, 14, 34], [-4, 3, 2]], [[0, 16, 46], [0, 3, 14]], [[10, 16, 40], [6, 4, 4]],
      ];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (id === 'delrg') {
        resources.filter((r) => r.rg === 'dev').forEach((r) => (r.mesh.visible = false));
        resources.forEach((r, i) => { if (r.rg === 'dev') resLines[i].visible = false; });
        rgs.dev.mesh.visible = false;
        paintSubs();
        hud(`🗑️ Deleted rg-dev: every resource inside went with it. Dev-Test bill is now ${money(subCost().dev)}/month.`, 'ok');
      }
      if (id === 'restore') { reset(); hud('Restored.', 'info'); }
      if (id === 'deploy-bad') { drop(false); later(1.1, () => hud('⛔ Denied by Azure Policy: “Allowed locations”. The VM in East US is never created, whoever tries.', 'bad')); }
      if (id === 'deploy-good') { drop(true); later(1.6, () => hud('✅ West Europe is allowed. The VM lands in rg-shop-web.', 'ok')); }
      if (id === 'ben-ok') { const vm = resources[0]; packets.send(curve([-34, 3, 10], [-30, 6, 8], [vm.mesh.position.x, 2.2, 4]), C.green, 1.2, () => hud('✅ Ben restarted the VM: his role allows it in rg-shop-web.', 'ok')); }
      if (id === 'ben-no') { const vm = resources[5]; packets.send(curve([-34, 3, 10], [-20, 8, 9], [vm.mesh.position.x, 2.2, 4]), C.red, 1.6, undefined, 0.85); later(1.4, () => hud('⛔ AuthorizationFailed: Ben has no role on rg-hr. RBAC = who can do what, where.', 'bad')); }
      if (id === 'del-locked') {
        if (!lock.visible) { resources.filter((r) => r.rg === 'data').forEach((r) => (r.mesh.visible = false)); rgs.data.mesh.visible = false; paintSubs(); hud('🗑️ No lock, so rg-shop-data and its database were deleted. Oops: that was production data.', 'bad'); return; }
        packets.send(curve([-34, 3, 10], [-24, 9, 6], [rgs.data.pos.x, rgs.data.pos.y, 2.4]), C.red, 1.3, undefined, 0.9);
        later(1.2, () => { glow(lockM, C.red, 0.9); hud('🔒 ScopeLocked: rg-shop-data has a Delete lock. Even an Owner must remove the lock first.', 'bad'); });
        later(2.2, () => glow(lockM, 0xd6a100, 0.4));
      }
      if (id === 'unlock') { lock.visible = false; hud('🔓 Lock removed. Now a delete would succeed: locks make deletion a deliberate two-step action.', 'info'); }
      if (id === 'req') {
        sources.forEach((s, k) => later(k * 0.25, () => packets.send(curve([s.b.position.x, 1, 28], [s.b.position.x * 0.5, 4, 22], [0, 4, 16]), C.azureLight, 1, () => {
          const r = resources[k * 2];
          packets.send(curve([0, 4, 16], [r.mesh.position.x * 0.5, 6, 10], [r.mesh.position.x, 2, 4]), C.green, 1);
        })));
        hud('⚙️ Portal, CLI, PowerShell and Bicep all send requests to Azure Resource Manager, which checks identity, RBAC, Policy and locks the same way for all of them.', 'info');
      }
      if (id === 'cpu') {
        const r = resources[0];
        r.m.color.setHex(C.red); glow(r.m, C.red, 0.6);
        packets.send(curve([r.mesh.position.x, 2, 4], [0, 14, 6], [30, 9, 4]), C.red, 1.2, () => { glow(monM, C.red, 0.7); hud('🔔 Alert fired: CPU > 80% for 5 minutes on vm-web-1. Email + Teams message sent to the on-call team.', 'bad'); });
      }
      if (id === 'advisor') {
        resources.filter((r) => r.rg === 'dev' && r.kind === 'vm').forEach((r) => { r.m.color.setHex(C.amber); glow(r.m, C.amber, 0.6); });
        hud(`💡 Advisor: 2 dev VMs averaged 3% CPU this week. Right-size or shut them down to save about ${money(50)}/month.`, 'info');
      }
    },
  };
}
