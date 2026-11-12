import { THREE, C, v, mat, box, cyl, person, ground, plate, glow, Packets, after, every, type V3 } from './kit';
import { stepLabels, type Ctx, type Ctl } from './types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));

/** Identity & security: Entra ID tenant, SSO, MFA, Conditional Access, guests (B2B), Zero Trust, Defender for Cloud. */
export function identity({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 150, 0xcfe3c4);
  const packets = new Packets(stage, 0.42);
  const later = after(stage);
  S.add(plate(60, 40, 0xdbe9f7, [0, 0, 0]));

  // Entra ID hub
  const hubM = mat(C.azure, { emissive: C.azure, emissiveIntensity: 0.45, transparent: true, opacity: 0.92 });
  const hub = cyl(3.2, 5, hubM, [0, 0.1, 0], 6);
  S.add(hub);
  // Conditional Access gate
  const gateM = mat(C.amber, { emissive: C.amber, emissiveIntensity: 0.3 });
  const gate = new THREE.Group();
  gate.add(box(0.6, 6, 0.6, gateM, [-9, 0, -4]), box(0.6, 6, 0.6, gateM, [-9, 0, 4]), box(0.6, 0.6, 8.6, gateM, [-9, 6, 0]));
  S.add(gate);
  const signals = [['📍', -16, 7, -6], ['💻', -16, 5, 0], ['⚠️', -16, 7, 6]] as const;
  // apps
  const apps = ['Microsoft 365', 'Azure portal', 'HR app (SaaS)'].map((n, i) => {
    const m = mat([0xd83b01, 0x0f6cbd, C.purple][i], { emissive: [0xd83b01, 0x0f6cbd, C.purple][i], emissiveIntensity: 0.2 });
    const b = box(4, 3, 2.4, m, [20, 0.1, -9 + i * 9]);
    S.add(b);
    return { n, b, m, pos: v(20, 2, -9 + i * 9) };
  });
  // people
  const ana = person(C.azure, [-24, 0.1, 0], 1.7);
  const thief = person(0x333333, [-24, 0.1, 9], 1.7);
  const priya = person(C.green, [-24, 0.1, -10], 1.7);
  const phoneM = mat(0x1b1a19, { emissive: 0x55b6ff, emissiveIntensity: 0.1 });
  const phone = box(0.5, 0.9, 0.12, phoneM, [-22.6, 1.3, 0.8]);
  S.add(ana, thief, priya, phone);
  const fabrikam = plate(9, 8, 0xd9cfee, [-26, 0, -10], 0.7);
  S.add(fabrikam);
  // Defender: VMs under a shield
  const vmMs: THREE.MeshStandardMaterial[] = [];
  for (let i = 0; i < 3; i++) { const m = mat(i === 1 ? C.red : C.azure, { emissive: i === 1 ? C.red : C.azure, emissiveIntensity: 0.3 }); vmMs.push(m); S.add(box(2, 2, 2, m, [-4 + i * 4, 0.1, -16])); }
  const shieldM = mat(C.green, { transparent: true, opacity: 0.18, emissive: C.green, emissiveIntensity: 0.3, side: THREE.DoubleSide, depthWrite: false });
  const shield = new THREE.Mesh(new THREE.SphereGeometry(8, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), shieldM);
  shield.position.set(0, 0, -16);
  S.add(shield);
  stage.onTick((_, dt) => { hub.rotation.y += dt * 0.5; });

  const L = stepLabels(stage);
  L.add('🔐 Microsoft Entra ID · tenant contoso', [0, 7, 0], [0, 1, 2, 4, 5, 6], 'd3-label-strong');
  apps.forEach((a) => L.add(a.n, a.pos.clone().add(v(0, 2.6, 0)), 'all'));
  L.add('👩 Ana (employee)', [-24, 3.6, 0], [0, 1, 2, 3, 5]);
  L.add('🕵️ Attacker with a stolen password', [-24, 3.6, 9], [2, 5]);
  L.add('📱 Authenticator app', [-22.6, 2.4, 0.8], [2]);
  L.add('🤝 Priya · guest from Fabrikam', [-24, 3.6, -10], [4]);
  L.add('Fabrikam’s own tenant', [-26, 0.8, -14.5], [4]);
  L.add('🚥 Conditional Access', [-9, 7.6, 0], [3, 5], 'd3-label-strong');
  signals.forEach(([e, x, y, z], i) => L.add(`${e} ${['location', 'device', 'sign-in risk'][i]}`, [x, y, z], [3]));
  const score = L.add('', [0, 9, -16], [6], 'd3-label-strong');

  const userPath = (z: number, to: THREE.Vector3, viaGate = false) => curve([-24, 2.4, z], ...(viaGate ? [[-9, 3, z * 0.4] as V3] : []), [-3, 3, z * 0.2], [0, 3, 0], [to.x * 0.6, 3, to.z], [to.x - 2, to.y, to.z]);
  let step = 0;
  let secure = 62;
  every(stage, 0.7, () => {
    if (step === 0) packets.send(userPath(0, apps[Math.floor(Math.random() * 3)].pos), C.azureLight, 1.6);
    if (step === 5) { const z = [0, 9, -10][Math.floor(Math.random() * 3)]; packets.send(curve([-24, 2.4, z], [-9, 3, z * 0.3]), C.amber, 0.8); }
  });

  const flash = (m: THREE.MeshStandardMaterial, col: number, base: number) => { glow(m, col, 0.9); later(1.2, () => glow(m, base, 0.3)); };

  return {
    go(i) {
      step = i;
      later.cancelAll();
      packets.clear();
      hud('');
      L.show(i);
      thief.visible = i === 2 || i === 5;
      priya.visible = fabrikam.visible = i === 4;
      phone.visible = i === 2;
      gate.visible = i === 3 || i === 5;
      shield.visible = i === 6;
      glow(gateM, C.amber, 0.3);
      secure = 62;
      vmMs.forEach((m, k) => { const c = k === 1 ? C.red : C.azure; m.color.setHex(c); glow(m, c, 0.3); });
      score.set(`🛡️ Secure score: ${secure}%`);
      if (i === 5) hud('Zero Trust: every request is checked, from home or the office. Never trust, always verify.', 'info');
      cost(i === 0 ? 0 : i === 3 ? 6 : i === 6 ? 15 : 0, 'month', i === 0 ? 'Entra ID Free is included with Azure' : i === 3 ? 'Conditional Access needs Entra ID P1 (per user)' : i === 6 ? 'Defender for Servers Plan 2, per server' : '');
      const cams: [V3, V3][] = [
        [[0, 30, 40], [0, 2, 0]], [[0, 22, 34], [0, 2, 0]], [[-18, 14, 26], [-12, 2, 3]], [[-22, 14, 22], [-9, 3, 0]],
        [[-14, 16, 18], [-8, 2, -6]], [[-6, 26, 36], [-6, 2, 0]], [[0, 14, 6], [0, 2, -16]],
      ];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (id === 'sso') {
        packets.send(curve([-24, 2.4, 0], [-10, 3, 0], [0, 3, 0]), C.azure, 1, () => {
          hud('✅ Ana signed in once. Entra ID issues tokens, and every connected app opens without asking again.', 'ok');
          apps.forEach((a, k) => later(k * 0.2, () => packets.send(curve([0, 3, 0], [10, 4, a.pos.z * 0.6], [a.pos.x - 2, a.pos.y, a.pos.z]), C.green, 0.9)));
        });
      }
      if (id === 'thief') {
        packets.send(curve([-24, 2.4, 9], [-12, 3, 5], [-2, 3, 1]), C.red, 1.2, undefined, 0.95);
        later(1.1, () => { flash(hubM, C.red, C.azure); hud('⛔ Correct password, but no second factor. MFA blocks the attacker: a stolen password alone is useless.', 'bad'); });
      }
      if (id === 'ana-mfa') {
        glow(phoneM, 0x55b6ff, 1);
        hud('📱 Ana approves the sign-in on her phone (number matching)…', 'info');
        later(1, () => packets.send(curve([-24, 2.4, 0], [-10, 3, 0], [0, 3, 0], [10, 3, -4], [18, 2, -9]), C.green, 1.2, () => hud('✅ Password + phone = verified. Ana is in.', 'ok')));
      }
      const ca = (z: number, col: number, msg: string, tone: 'ok' | 'bad' | 'info', pass: boolean) => {
        packets.send(curve([-24, 2.4, z], [-9, 3, 0], ...(pass ? [[0, 3, 0], [18, 2, 0]] as V3[] : [])), col, pass ? 1.6 : 0.8, undefined, pass ? undefined : 0.98);
        later(0.75, () => { flash(gateM, col, C.amber); hud(msg, tone); });
      };
      if (id === 'ca-office') ca(0, C.green, '✅ From the office, compliant laptop, low risk → access granted without extra prompts.', 'ok', true);
      if (id === 'ca-travel') ca(0, C.amber, '⚠️ Sign-in from a new country → Conditional Access requires MFA before access.', 'info', true);
      if (id === 'ca-unmanaged') ca(0, C.red, '⛔ Unmanaged personal device + high risk → access blocked to the Azure portal.', 'bad', false);
      if (id === 'guest') {
        packets.send(curve([-24, 2.4, -10], [-10, 3, -6], [0, 3, 0], [10, 3, 4], [18, 2, 9]), C.green, 1.6, () => hud('🤝 Priya signs in with her own Fabrikam account (B2B) and reaches only the HR app she was invited to.', 'ok'));
        later(1.8, () => packets.send(curve([0, 3, 0], [10, 3, -5], [18, 2, -9]), C.red, 1.2, undefined, 0.6));
      }
      if (id === 'fix') {
        secure = 78;
        vmMs[1].color.setHex(C.azure); glow(vmMs[1], C.green, 0.5);
        score.set(`🛡️ Secure score: ${secure}% (+16)`);
        hud('🛠️ Fixed: closed the open RDP port and turned on MFA for owners. Secure score 62% → 78%.', 'ok');
      }
    },
  };
}
