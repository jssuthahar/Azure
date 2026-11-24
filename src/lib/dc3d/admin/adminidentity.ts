import { THREE, C, v, mat, box, cyl, person, ground, plate, glow, Packets, after, type V3 } from '../kit';
import { stepLabels, type Ctx, type Ctl } from '../types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));
type M = THREE.MeshStandardMaterial;

/**
 * AZ-104 identity and governance: an Entra tenant (assigned and dynamic groups,
 * group licensing, a B2B guest, SSPR), the management group ladder with
 * inheriting role assignments, effective access, Azure Policy effects, locks
 * and tags, and a budget that fires.
 */
export function adminidentity({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 190, 0xdde6ef);
  const packets = new Packets(stage, 0.34);
  const later = after(stage);
  const solid = (c: number, e = 0.25) => mat(c, { emissive: c, emissiveIntensity: e });
  const flash = (m: M, c: number, base: number, sec = 1.2) => { glow(m, c, 1); later(sec, () => glow(m, base, 0.25)); };
  const tweens: { o: THREE.Object3D; to: THREE.Vector3 }[] = [];
  const move = (o: THREE.Object3D, to: V3) => { tweens.push({ o, to: v(...to) }); };
  stage.onTick((_, dt) => { for (let i = tweens.length - 1; i >= 0; i--) { const t = tweens[i]; t.o.position.lerp(t.to, Math.min(1, dt * 3)); if (t.o.position.distanceTo(t.to) < 0.05) { t.o.position.copy(t.to); tweens.splice(i, 1); } } });
  const put = (o: THREE.Object3D, at: V3) => { tweens.splice(0, tweens.length, ...tweens.filter((t) => t.o !== o)); o.position.set(...at); };

  /* ---- Tenant: groups, people, licenses, guest, SSPR ---- */
  S.add(plate(46, 34, 0xe3ecf7, [-36, 0, -8]), plate(11, 8, 0xc9def5, [-48, 0.02, -18]), plate(11, 8, 0xe2d8f3, [-26, 0.02, -18]), plate(14, 12, 0xf3e6d6, [-72, 0, -10]));
  const HOME_P: Record<string, V3> = { ana: [-44, 0.1, -2], sam: [-36, 0.1, -2], lee: [-28, 0.1, -2], raj: [-24, 0.1, -19], priya: [-72, 0.1, -10] };
  const ppl = { ana: person(C.green, HOME_P.ana, 1.6), sam: person(C.azure, HOME_P.sam, 1.6), lee: person(C.amber, HOME_P.lee, 1.6), raj: person(C.purple, HOME_P.raj, 1.6), priya: person(0xc239b3, HOME_P.priya, 1.6) };
  Object.values(ppl).forEach((p) => S.add(p));
  const licM = solid(C.amber, 0.4);
  const lic = (['sam', 'raj', 'lee'] as const).map((k) => { const b = box(1, 0.6, 0.15, licM, [0, 2.4, 0]); ppl[k].add(b); b.scale.setScalar(1 / 1.6); b.position.y = 1.6; b.visible = false; return b; });
  const stackM = solid(C.amber, 0.25);
  S.add(box(2.4, 1.6, 2.4, stackM, [-16, 0.12, -12]));
  const kioskM = solid(C.azure, 0.3), phoneM = solid(C.green, 0.25), mailM = solid(C.azureLight, 0.25);
  S.add(box(3, 3.2, 1.6, kioskM, [-36, 0.12, 8]), box(1, 1.6, 0.4, phoneM, [-40, 0.12, 12]), box(1.6, 1, 1.2, mailM, [-32, 0.12, 12]));

  /* ---- Ladder: root → management groups → subscriptions → resource groups → resources ---- */
  const tier = (w: number, at: V3, c: number) => { const m = solid(c, 0.2); S.add(box(w, 0.8, 3, m, at)); return m; };
  const rootM = tier(18, [30, 10, -22], 0x5c2d91), mgM = tier(8, [24, 7.5, -18], C.purple), mgnM = tier(8, [40, 7.5, -18], C.purple);
  const subM = tier(7, [21, 5, -14], C.amber);
  const devM = solid(C.amber, 0.2);
  const dev = box(7, 0.8, 3, devM, [30, 5, -14]); S.add(dev);
  const rgM = tier(5, [18, 2.5, -10], C.azure), rg2M = tier(5, [25, 2.5, -10], C.azureLight);
  const resM = [solid(0x2f8f9d, 0.25), solid(C.azure, 0.25)];
  const st = box(1.6, 1.2, 1.6, resM[0], [17, 0.12, -6]), vm = box(1.6, 1.6, 1.6, resM[1], [20, 0.12, -6]);
  const ben = person(C.green, [10, 0.1, -16], 1.6);
  S.add(st, vm, ben);
  const lineM = new THREE.LineBasicMaterial({ color: 0x6b7b8c });
  const link = (a: V3, b: V3) => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([v(...a), v(...b)]), lineM); S.add(l); return l; };
  link([30, 10, -22], [24, 8.3, -18]); link([30, 10, -22], [40, 8.3, -18]); link([24, 7.5, -18], [21, 5.8, -14]); link([21, 5, -14], [18, 3.3, -10]); link([21, 5, -14], [25, 3.3, -10]);
  const devLink = link([24, 7.5, -18], [30, 5.8, -14]);
  const setDevLink = (from: V3, to: V3) => devLink.geometry.setFromPoints([v(...from), v(...to)]);

  /* ---- Effective access: four people, a VM, the IAM key, a deny wall ---- */
  S.add(plate(36, 18, 0xe6eef6, [30, 0, 28]));
  const vmM = solid(C.azure, 0.25), keyM = solid(C.amber, 0.3);
  S.add(box(3, 2.6, 3, vmM, [26, 0.12, 22]), cyl(1.2, 2.4, keyM, [36, 0.12, 22]));
  const ROLES: [string, number, number][] = [['owner', 18, 0x5c2d91], ['contrib', 26, C.azure], ['reader', 34, C.green], ['uaa', 42, C.amber]];
  ROLES.forEach(([, x, c]) => S.add(person(c, [x, 0.1, 33], 1.6)));
  const denyM = mat(C.red, { transparent: true, opacity: 0.3, emissive: C.red, emissiveIntensity: 0.4, depthWrite: false });
  const denyWall = box(8, 4, 0.3, denyM, [22, 0, 28]); S.add(denyWall);

  /* ---- Policy gate with a resource group behind it ---- */
  S.add(plate(30, 30, 0xe9e4f4, [-36, 0, 28]));
  const gateM = solid(C.purple, 0.3);
  S.add(box(1, 4, 1, gateM, [-41, 0.12, 28]), box(1, 4, 1, gateM, [-31, 0.12, 28]), box(11, 0.6, 1, gateM, [-41.5 + 5.5 - 0.5, 4, 28]));
  const deployer = person(C.azure, [-36, 0.1, 40], 1.6); S.add(deployer);
  const exist = [solid(C.azureLight, 0.2), solid(C.azureLight, 0.2)];
  const ex = [box(2, 1.6, 2, exist[0], [-42, 0.12, 18]), box(2, 1.6, 2, exist[1], [-38, 0.12, 18])];
  const newM = solid(C.azure, 0.25);
  const newRes = box(2, 1.6, 2, newM, [-32, 0.12, 18]);
  S.add(...ex, newRes);
  const tagM = solid(C.green, 0.4);
  const tagOn = (o: THREE.Object3D) => { const t = box(0.8, 0.5, 0.3, tagM, [0, 1.7, 0]); t.name = 'tag'; o.add(t); };
  const untag = (o: THREE.Object3D) => o.children.filter((c) => c.name === 'tag').forEach((c) => o.remove(c));

  /* ---- Locks and tags ---- */
  S.add(plate(22, 16, 0xeaf0e2, [70, 0, -10]));
  const lockVmM = solid(C.azure, 0.25), lockStM = solid(0x2f8f9d, 0.25);
  const lockVm = box(3, 2.4, 3, lockVmM, [65, 0.12, -10]), lockSt = box(3, 1.8, 3, lockStM, [75, 0.12, -10]);
  const padM = solid(C.amber, 0.35);
  const pad = new THREE.Group();
  pad.add(box(2.2, 1.8, 1, padM, [0, 0, 0]));
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.2, 8, 20, Math.PI), padM); shackle.position.y = 1.8; pad.add(shackle);
  pad.position.set(70, 5, -10);
  S.add(lockVm, lockSt, pad);

  /* ---- Budget gauge, bell, Advisor ---- */
  S.add(plate(26, 18, 0xe2efe6, [70, 0, 28]));
  S.add(box(3, 10, 3, mat(0x9fb2c6, { transparent: true, opacity: 0.25, depthWrite: false }), [64, 0.12, 28]));
  const fillM = solid(C.green, 0.3);
  const fill = box(2.6, 1, 2.6, fillM, [64, 0.12, 28]); S.add(fill);
  const lines = [5, 8, 10].map((y) => { const m = mat(C.red, { transparent: true, opacity: 0.35, depthWrite: false }); S.add(box(4.4, 0.08, 4.4, m, [64, y, 28])); return m; });
  const bellM = solid(C.amber, 0.3), idleM = solid(C.azure, 0.25), bulbM = solid(C.amber, 0.2);
  const team = person(C.purple, [78, 0.1, 24], 1.6);
  S.add(cyl(1.1, 2, bellM, [72, 0.12, 24]), box(3, 2.4, 3, idleM, [74, 0.12, 33]), team);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), bulbM); bulb.position.set(79, 3, 33); S.add(bulb);

  /* ---- Labels ---- */
  const L = stepLabels(stage);
  L.add('🏢 Contoso tenant (Microsoft Entra ID)', [-36, 0.4, 9.5], [0, 1, 2], 'd3-label-strong');
  L.add('👥 IT · Assigned', [-48, 1.6, -21], [0, 1]);
  const salesLbl = L.add('', [-26, 1.6, -21], [0, 1]);
  L.add('Ana', [-44, 3, -2], [0, 2]); L.add('Sam · dept: Marketing', [-36, 3, -2], [0]); L.add('Lee · no usage location', [-28, 3, -2], [1, 2]); L.add('Raj', [-24, 3, -19], [0, 1]);
  const samLbl = L.add('', () => v(ppl.sam.position.x, 3.4, ppl.sam.position.z), [1]);
  L.add('🎫 Microsoft 365 E3 · 25 seats', [-16, 2.4, -12], [1]);
  L.add('🤝 Fabrikam tenant', [-72, 0.6, -3], [1], 'd3-label-strong');
  const priyaLbl = L.add('Priya (Fabrikam account)', () => v(ppl.priya.position.x, 3, ppl.priya.position.z), [1]);
  L.add('🔑 aka.ms/sspr', [-36, 4, 8], [2], 'd3-label-strong');
  L.add('📱 Authenticator', [-40, 2.4, 12], [2]); L.add('✉️ Email', [-32, 1.8, 12], [2]);
  const ssprLbl = L.add('SSPR: Selected (SSPR-Pilot) · 2 methods', [-36, 6, 8], [2]);
  L.add('🏛️ Tenant Root Group', [30, 11.6, -22], [3, 4], 'd3-label-strong');
  L.add('mg-contoso', [24, 9, -18], [3, 4]); L.add('mg-nonprod', [40, 9, -18], [3, 4]);
  L.add('🔑 Contoso Production', [21, 6.4, -14], [3, 4]);
  L.add('🔑 Dev/Test', () => v(dev.position.x, 6.4, dev.position.z), [3, 4]);
  L.add('📦 rg-app', [18, 3.8, -10], [3, 4]); L.add('📦 rg-archive', [25, 3.8, -10], [3, 4]);
  L.add('🗄️ stapp0424', () => v(st.position.x, 1.8, st.position.z), [3, 4]); L.add('🖥️ vm-app01', [20, 2.2, -6], [4]);
  const benLbl = L.add('Ben', [10, 3, -16], [4]);
  L.add('👑 Owner', [18, 3, 33], [5]); L.add('🛠️ Contributor', [26, 3, 33], [5]); L.add('👀 Reader', [34, 3, 33], [5]); L.add('🗝️ User Access Admin', [42, 3, 33], [5]);
  L.add('🖥️ vm-web01', [26, 3.4, 22], [5]); L.add('🔐 Access control (IAM)', [36, 3.2, 22], [5]);
  const denyLbl = L.add('⛔ Deny assignment', [22, 4.6, 28], [5]);
  L.add('📜 Azure Policy', [-36, 5.4, 28], [6], 'd3-label-strong');
  const polLbl = L.add('', [-36, 6.6, 28], [6]);
  L.add('📦 rg-finance · costcenter: FIN-042', [-38, 0.4, 13], [6, 7]);
  L.add('👷 Deployer', [-36, 3, 40], [6]);
  L.add('📦 rg-finance', [70, 0.4, -2.5], [7], 'd3-label-strong');
  const lockLbl = L.add('', [70, 8.4, -10], [7]);
  L.add('🖥️ vm-fin01', [65, 3.2, -10], [7]); L.add('🗄️ stfin0424', [75, 2.6, -10], [7]);
  const budLbl = L.add('', [64, 11.4, 28], [8], 'd3-label-strong');
  L.add('50%', [66.6, 5, 28], [8]); L.add('80%', [66.6, 8, 28], [8]); L.add('100%', [66.6, 10, 28], [8]);
  L.add('🔔 Action group', [72, 2.6, 24], [8]); L.add('👩‍💼 Finance ops', [78, 3, 24], [8]);
  L.add('💤 vm-dev02 · CPU 4%', [74, 3, 33], [8]); L.add('💡 Advisor', [79, 4.4, 33], [8]);

  let step = 0;
  const salesSet = new Set(['raj']);
  const paintSales = () => salesLbl.set(`🔄 Sales-Team · Dynamic: user.department -eq "Sales" · ${salesSet.size} member${salesSet.size === 1 ? '' : 's'}`);
  let lockKind: 'CanNotDelete' | 'ReadOnly' = 'CanNotDelete';
  const paintLock = () => { padM.color.setHex(lockKind === 'ReadOnly' ? C.azureLight : C.amber); glow(padM, lockKind === 'ReadOnly' ? C.azureLight : C.amber, 0.35); lockLbl.set(`🔒 ${lockKind} lock on rg-finance`); };
  let spend = 0;
  const setSpend = (pct: number) => { spend = pct; fill.scale.y = Math.max(0.1, pct / 10); fillM.color.setHex(pct >= 100 ? C.red : pct >= 80 ? C.amber : C.green); glow(fillM, pct >= 100 ? C.red : pct >= 80 ? C.amber : C.green, 0.3); budLbl.set(`💲 fin-monthly · $500 budget · ${Math.round(pct)}% spent`); };

  const reset = () => {
    later.cancelAll(); packets.clear(); hud('');
    (Object.keys(HOME_P) as (keyof typeof ppl)[]).forEach((k) => put(ppl[k], HOME_P[k]));
    salesSet.clear(); salesSet.add('raj'); paintSales();
    lic.forEach((b) => (b.visible = false)); samLbl.set(''); priyaLbl.set('Priya (Fabrikam account)');
    [kioskM, phoneM, mailM].forEach((m, k) => glow(m, [C.azure, C.green, C.azureLight][k], 0.25));
    put(dev, [30, 5, -14]); setDevLink([24, 7.5, -18], [30, 5.8, -14]); put(st, [17, 0.12, -6]);
    [mgM, subM, rgM, rg2M, ...resM].forEach((m) => glow(m, m.color.getHex(), 0.2)); benLbl.set('Ben');
    denyWall.visible = false; denyLbl.show(false); glow(vmM, C.azure, 0.25); glow(keyM, C.amber, 0.3);
    ex.forEach(untag); untag(newRes); put(newRes, [-32, 0.12, 18]); newRes.visible = false; polLbl.set('Effects: Deny · Audit · Modify'); glow(gateM, C.purple, 0.3);
    lockKind = 'CanNotDelete'; paintLock(); untag(lockVm); untag(lockSt); glow(lockVmM, C.azure, 0.25); glow(lockStM, 0x2f8f9d, 0.25);
    setSpend(12); lines.forEach((m) => (m.opacity = 0.35)); glow(bellM, C.amber, 0.3); glow(idleM, C.azure, 0.25);
  };

  const fromTo = (a: V3, b: V3, lift = 4) => curve(a, [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + lift, (a[2] + b[2]) / 2], b);
  const tryRole = (x: number, target: 'vm' | 'key', ok: boolean, msg: string, at = 0.55) => {
    const to: V3 = target === 'vm' ? [26, 1.4, 22] : [36, 1.4, 22];
    packets.send(fromTo([x, 1.5, 33], to), ok ? C.green : C.red, 1.1, () => { flash(target === 'vm' ? vmM : keyM, ok ? C.green : C.red, target === 'vm' ? C.azure : C.amber); hud(msg, ok ? 'ok' : 'bad'); }, ok ? undefined : at);
  };

  return {
    go(i) {
      step = i;
      reset();
      L.show(i);
      denyLbl.show(false);
      ben.visible = i === 4;
      newRes.visible = i === 6;
      if (i === 3) hud('Settings flow down the ladder: whatever you assign at a management group reaches every subscription, resource group and resource below it.', 'info');
      cost(i === 8 ? 0.68 : 0, 'month', i === 8 ? 'Budgets and Advisor are free; this scope spends about $500 a month (illustrative)' : '');
      const cams: [V3, V3][] = [[[-36, 22, 22], [-36, 1, -10]], [[-48, 26, 26], [-46, 1, -10]], [[-36, 13, 26], [-36, 2, 6]], [[30, 18, 16], [27, 5, -14]], [[22, 16, 14], [22, 4, -12]], [[30, 15, 50], [30, 1, 27]], [[-36, 17, 52], [-36, 2, 24]], [[70, 15, 12], [70, 2, -10]], [[70, 15, 50], [70, 4, 28]]];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (step !== 0 && ['assigned', 'dynamic'].includes(id)) return;
      /* 0: groups */
      if (id === 'assigned') { move(ppl.ana, [-48, 0.1, -17]); later(0.9, () => hud('➕ You added Ana to IT yourself. She stays there until someone removes her, even if she changes jobs. That\'s an **assigned** group.', 'ok')); }
      if (id === 'dynamic') {
        hud('Sam\'s department property changes from Marketing to Sales…', 'info');
        later(1.2, () => { move(ppl.sam, [-28, 0.1, -17]); salesSet.add('sam'); paintSales(); });
        later(2.2, () => hud('🔄 Nobody touched the group. Entra ID re-evaluated the rule user.department -eq "Sales" and added Sam on its own. Change it back and he leaves. You can\'t add or remove dynamic members by hand.', 'ok'));
      }
      /* 1: licenses and guests */
      if (id === 'grouplic') {
        move(ppl.sam, [-28, 0.1, -17]); salesSet.add('sam'); paintSales();
        later(0.8, () => packets.send(fromTo([-16, 1.6, -12], [-26, 2, -18]), C.amber, 0.9, () => { lic[0].visible = lic[1].visible = true; samLbl.set('🎫 E3 · inherited from Sales-Team'); hud('🎫 One assignment on the group licensed both members. Anyone who joins Sales-Team gets E3; anyone who leaves gives the seat back. That needs Entra ID P1.', 'ok'); }));
      }
      if (id === 'direct') packets.send(fromTo([-16, 1.6, -12], [-28, 2, -2]), C.red, 1, () => hud('🚫 Direct assignment failed: Lee has no **usage location**, and licenses depend on the country the service is used in. Set it in Lee\'s properties, then assign. (Group licensing would use the directory\'s location instead.)', 'bad'), 0.8);
      if (id === 'guest') {
        packets.send(fromTo([-36, 1, -8], [-72, 1.5, -10], 6), C.azure, 1, () => {
          move(ppl.priya, [-52, 0.1, -4]);
          later(1.4, () => { priyaLbl.set('Priya · Guest · priya_fabrikam.com#EXT#'); hud('🤝 Priya signed in with her own Fabrikam account. Contoso decides what she can reach; Fabrikam still owns her identity and password. When the project ends, remove the guest.', 'ok'); });
        });
      }
      /* 2: SSPR */
      if (id === 'reset2') {
        packets.send(fromTo([-44, 1.5, -2], [-36, 2, 8]), C.azure, 0.8, () => { flash(phoneM, C.green, C.green); later(0.5, () => flash(mailM, C.green, C.azureLight)); later(1, () => { flash(kioskM, C.green, C.azure); hud('✅ Ana is in SSPR-Pilot and proved two methods (app notification + email code). New password set, no helpdesk call.', 'ok'); }); });
      }
      if (id === 'reset1') {
        packets.send(fromTo([-28, 1.5, -2], [-36, 2, 8]), C.red, 1, () => { flash(kioskM, C.red, C.azure); hud('⛔ Lee registered only email, but the policy needs 2 methods. Lee is stuck until they register another one. Turning on "Require users to register when signing in" avoids this.', 'bad'); }, 0.85);
      }
      /* 3: ladder */
      if (id === 'movesub') {
        move(dev, [40, 5, -14]); setDevLink([40, 7.5, -18], [40, 5.8, -14]);
        later(1, () => { flash(devM, C.purple, C.amber, 2); hud('🚚 Dev/Test now sits under mg-nonprod. It lost mg-contoso\'s policies and role assignments and picked up mg-nonprod\'s at once. Moving needs write access on the subscription and both management groups.', 'info'); });
      }
      if (id === 'moveres') {
        move(st, [24, 0.12, -6]);
        later(1, () => { flash(resM[0], C.green, 0x2f8f9d, 2); hud('📦 stapp0424 moved from rg-app to rg-archive. Its resource ID changed (it contains the group name) but its region didn\'t. Both groups are locked for writes while a move runs.', 'ok'); });
      }
      /* 4: role assignments */
      if (id === 'assignmg' || id === 'assignrg') {
        const mgFirst = id === 'assignmg';
        const chain: [M, V3][] = mgFirst ? [[mgM, [24, 8, -18]], [subM, [21, 5.6, -14]], [rgM, [18, 3, -10]], [resM[0], [17, 1.4, -6]], [resM[1], [20, 1.6, -6]]] : [[rgM, [18, 3, -10]], [resM[0], [17, 1.4, -6]], [resM[1], [20, 1.6, -6]]];
        const color = mgFirst ? C.green : C.azure;
        packets.send(fromTo([10, 1.5, -16], chain[0][1]), color, 0.9, () => {
          chain.forEach(([m], k) => later(k * 0.35, () => glow(m, color, 0.9)));
          later(chain.length * 0.35 + 0.3, () => {
            benLbl.set(mgFirst ? 'Ben · Reader (mg-contoso)' : 'Ben · Reader (inherited) + Contributor (rg-app)');
            hud(mgFirst ? '🎭 One Reader assignment at mg-contoso: Ben can now read every subscription, resource group and resource below it, including ones created tomorrow.' : '🛠️ Contributor on rg-app adds write access there only. Ben\'s access in rg-app is now Reader + Contributor; everywhere else he\'s still just Reader.', 'ok');
          });
        });
      }
      /* 5: effective access */
      if (id === 'contrib') tryRole(26, 'vm', true, '🛠️ Contributor has Actions: * , so creating and changing resources works.');
      if (id === 'grant') tryRole(26, 'key', false, '🔑 Blocked. Contributor\'s NotActions remove Microsoft.Authorization/*/Write, so it can\'t create role assignments or delete locks.');
      if (id === 'reader') tryRole(34, 'vm', false, '👀 Blocked. Reader only has */read. It can see the VM but not delete, restart or change it.');
      if (id === 'uaa') tryRole(42, 'key', true, '🗝️ User Access Administrator manages access: it can assign roles, but it can\'t create or delete the VM itself.');
      if (id === 'deny') {
        denyWall.visible = true; denyLbl.show(true);
        packets.send(fromTo([18, 1.5, 33], [26, 1.4, 22]), C.red, 1.2, () => hud('⛔ The Owner was stopped by a **deny assignment**. Deny assignments win over every role. You can\'t create them directly; Azure adds them for deployment stacks and managed applications.', 'bad'), 0.45);
      }
      /* 6: policy */
      if (id === 'deny-pol') { polLbl.set('Allowed locations · Deny'); packets.send(curve([-36, 1.5, 40], [-36, 3, 34], [-36, 1.5, 28]), C.red, 1, () => { flash(gateM, C.red, C.purple); hud('🇺🇸 Refused: RequestDisallowedByPolicy. East US isn\'t in the allowed list, so the resource was never created.', 'bad'); }, 0.9); }
      if (id === 'audit') { polLbl.set('Audit VMs that do not use managed disks · Audit'); packets.send(curve([-36, 1.5, 40], [-36, 3, 30], [-32, 1.5, 18]), C.amber, 1.3, () => { newRes.visible = true; glow(newM, C.amber, 0.9); hud('📝 Audit let it in and flagged it **Non-compliant** in the Compliance view. Nothing was blocked or changed; someone has to follow up.', 'info'); }); }
      if (id === 'modify') { polLbl.set('Inherit a tag from the resource group if missing · Modify'); untag(newRes); packets.send(curve([-36, 1.5, 40], [-36, 3, 30], [-32, 1.5, 18]), C.green, 1.3, () => { newRes.visible = true; glow(newM, C.azure, 0.25); tagOn(newRes); hud('🏷️ Modify added costcenter=FIN-042 during deployment, using the assignment\'s managed identity. The two older resources still have no tag.', 'ok'); }); }
      if (id === 'remediate') { polLbl.set('Remediation task · inherit-costcenter'); ex.forEach((o, k) => later(0.4 + k * 0.6, () => { packets.send(curve([-36, 4, 28], [-38, 5, 22], [o.position.x, 1.8, 18]), C.green, 0.6, () => { tagOn(o); flash(exist[k], C.green, C.azureLight); }); })); later(2, () => hud('🧹 The remediation task tagged the resources that existed before the policy. Only Modify and DeployIfNotExists policies can be remediated.', 'ok')); }
      /* 7: locks and tags */
      if (id === 'del-locked') { lockKind = 'CanNotDelete'; paintLock(); packets.send(curve([70, 1, 2], [70, 4, -4], [70, 2, -10]), C.red, 1, () => { flash(padM, C.red, C.amber); hud('🗑️ ScopeLocked: rg-finance can\'t be deleted while the CanNotDelete lock is there, not even by an Owner. Remove the lock first (that needs Microsoft.Authorization/locks/delete).', 'bad'); }, 0.75); }
      if (id === 'upd-cnd') { lockKind = 'CanNotDelete'; paintLock(); packets.send(curve([70, 1, 2], [66, 4, -4], [65, 2, -10]), C.green, 1, () => { flash(lockVmM, C.green, C.azure); lockVm.scale.set(1.2, 1.2, 1.2); later(1.5, () => lockVm.scale.set(1, 1, 1)); hud('⚙️ Resizing worked. CanNotDelete only stops deletes; normal changes carry on.', 'ok'); }); }
      if (id === 'upd-ro') { lockKind = 'ReadOnly'; paintLock(); packets.send(curve([70, 1, 2], [74, 4, -4], [75, 2, -10]), C.red, 1, () => { flash(lockStM, C.red, 0x2f8f9d); hud('🧊 ReadOnly refused even a tag change, and it can break things like listing storage keys (a POST). Use it for short freezes only.', 'bad'); }, 0.75); }
      if (id === 'tags') { lockKind = 'CanNotDelete'; paintLock(); [lockVm, lockSt].forEach((o, k) => later(0.3 + k * 0.6, () => packets.send(curve([70, 0.6, -3], [70, 3, -6], [o.position.x, 2, -10]), C.green, 0.6, () => tagOn(o)))); later(1.8, () => hud('🏷️ Tags on rg-finance weren\'t inherited on their own. The inherit-tag policy copied costcenter=FIN-042 to both resources, so Cost analysis can group them.', 'ok')); }
      /* 8: budget */
      if (id === 'spend') {
        const marks = [50, 80, 100];
        let k = 0;
        const tick = () => { setSpend(Math.min(104, spend + 4)); while (k < marks.length && spend >= marks[k]) { const t = marks[k]; lines[k].opacity = 0.8; flash(bellM, t >= 100 ? C.red : C.amber, C.amber); packets.send(fromTo([72, 2, 24], [78, 2, 24], 2), t >= 100 ? C.red : C.amber, 0.6); hud(t < 100 ? `🔔 ${t}% of $500 reached: an Actual alert emailed finance ops${t === 80 ? ' and called the action group' : ''}.` : '💸 100%: the alert fired, but nothing was switched off. Budgets warn; they don\'t stop resources unless the action group runs automation.', t >= 100 ? 'bad' : 'info'); k++; } if (spend < 104) later(0.12, tick); };
        tick();
      }
      if (id === 'advisor') { flash(bulbM, C.amber, C.amber, 2); packets.send(fromTo([79, 3, 33], [74, 2, 33], 2), C.amber, 0.7, () => { glow(idleM, null, 0); idleM.color.setHex(0x8a99a8); setSpend(Math.max(10, spend - 18)); hud('💡 Advisor flagged vm-dev02 at 4% CPU. Shutting it down cut the forecast by about $90 a month (illustrative).', 'ok'); later(3, () => idleM.color.setHex(C.azure)); }); }
    },
  };
}
