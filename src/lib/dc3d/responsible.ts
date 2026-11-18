import { THREE, C, v, mat, box, cyl, person, ground, plate, glow, Packets, after, type V3 } from './kit';
import { stepLabels, type Ctx, type Ctl } from './types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));

/** Responsible AI: six pillars (fairness, reliability & safety, privacy & security, inclusiveness, transparency, accountability) around one AI system. */
export function responsible({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 150, 0xdfe9d6);
  const packets = new Packets(stage, 0.42);
  const later = after(stage);
  S.add(plate(56, 44, 0xe4ecf6, [0, 0, 0]));

  // The AI system in the middle
  const coreM = mat(C.purple, { emissive: C.purple, emissiveIntensity: 0.5, transparent: true, opacity: 0.92 });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 0), coreM);
  core.position.set(0, 3.2, 0);
  S.add(core, cyl(3.4, 0.4, mat(0x4b3a6e), [0, 0.1, 0], 6));
  stage.onTick((_, dt) => { core.rotation.y += dt * 0.6; core.rotation.x += dt * 0.15; });

  // Six pillars
  const NAMES = ['⚖️ Fairness', '🛡️ Reliability & safety', '🔒 Privacy & security', '🤝 Inclusiveness', '🔍 Transparency', '🧑‍⚖️ Accountability'];
  const COLS = [0x0078d4, 0xd13438, 0x5c2d91, 0x13a10e, 0xffb900, 0x008575];
  const pillars = NAMES.map((n, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const pos = v(Math.cos(a) * 12, 0, Math.sin(a) * 12);
    const m = mat(COLS[i], { emissive: COLS[i], emissiveIntensity: 0.15 });
    const p = cyl(1.1, 7, m, [pos.x, 0.1, pos.z], 16);
    S.add(p);
    return { n, m, pos, col: COLS[i] };
  });

  // Fairness: approval bars by group
  const bars = [0, 1, 2].map((k) => { const b = box(1.4, 1, 1.4, mat([C.azure, C.azureLight, C.amber][k]), [pillars[0].pos.x - 3 + k * 2.2, 0.1, pillars[0].pos.z - 5]); S.add(b); return b; });
  const setBars = (h: number[]) => bars.forEach((b, k) => b.scale.set(1, h[k], 1));
  // Safety: a gate
  const gateM = mat(C.red, { emissive: C.red, emissiveIntensity: 0.25, transparent: true, opacity: 0.55 });
  const gate = box(0.4, 5, 7, gateM, [-6, 0.1, 0]);
  S.add(gate);
  // People
  const user = person(C.azure, [-22, 0.1, 0], 1.7);
  const reviewer = person(C.green, [pillars[5].pos.x + 4, 0.1, pillars[5].pos.z + 3], 1.7);
  S.add(user, reviewer);
  // Inclusiveness: caption board
  const board = box(6, 3, 0.3, mat(0x1b1a19, { emissive: 0x333333, emissiveIntensity: 0.3 }), [pillars[3].pos.x + 4, 2, pillars[3].pos.z + 4]);
  S.add(board);

  const L = stepLabels(stage);
  L.add('🧠 AI system', [0, 7, 0], 'all', 'd3-label-strong');
  pillars.forEach((p, i) => L.add(p.n, p.pos.clone().add(v(0, 8.2, 0)), [0, i + 1]));
  L.add('👤 User', [-22, 3.6, 0], [2, 3, 5]);
  L.add('🚧 Guardrail', [-6, 6, 0], [2]);
  L.add('Approval rate by group', pillars[0].pos.clone().add(v(0, 4.5, -5)), [1]);
  const groupLbl = L.add('A 82% · B 80% · C 51%', pillars[0].pos.clone().add(v(0, 3.4, -5)), [1]);
  const piiLbl = L.add('📞 Call me on 98765 43210', [-14, 4, 0], [3]);
  L.add('💬 Live captions + translation', board.position.clone().add(v(0, 2.6, 0)), [4]);
  const citeLbl = L.add('📎 Source: HR handbook, p. 12', [4, 7.5, 6], [5]);
  L.add('🧑‍⚖️ Human reviewer', reviewer.position.clone().add(v(0, 3.6, 0)), [6]);
  L.add('📜 Audit log + traces', pillars[5].pos.clone().add(v(-3, 3, 4)), [6]);

  let step = 0;
  const toCore = (from: V3, col: number, done?: () => void, bounce?: number) => packets.send(curve(from, [from[0] / 2, 3.5, from[2] / 2], [0, 3.2, 0]), col, 1.2, done, bounce);

  return {
    go(i) {
      step = i;
      later.cancelAll();
      packets.clear();
      hud('');
      L.show(i);
      pillars.forEach((p, k) => { glow(p.m, p.col, i === 0 || k === i - 1 ? 0.55 : 0.08); p.m.opacity = 1; });
      bars.forEach((b) => (b.visible = i === 1));
      setBars([1.6, 1.55, 1]);
      groupLbl.set('A 82% · B 80% · C 51%');
      gate.visible = i === 2;
      user.visible = [2, 3, 5].includes(i);
      reviewer.visible = i === 6;
      board.visible = i === 4;
      piiLbl.set('📞 Call me on 98765 43210');
      citeLbl.show(false);
      cost(0, 'month', '');
      const cams: [V3, V3][] = [[[0, 30, 34], [0, 3, 0]], [[0, 12, -8], [0, 3, -14]], [[-16, 12, 18], [-6, 3, 0]], [[-10, 12, 18], [-4, 3, 2]], [[16, 12, 22], [10, 3, 6]], [[-4, 12, 24], [-4, 4, 6]], [[-18, 12, 4], [-10, 3, -4]]];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (id === 'biased') { setBars([1.6, 1.55, 1]); groupLbl.set('A 82% · B 80% · C 51% ⚠️'); hud('⚖️ The model learned from data where group C was rare, so similar people in group C are approved far less often. That is unfair.', 'bad'); }
      if (id === 'rebalance') { setBars([1.5, 1.5, 1.45]); groupLbl.set('A 79% · B 79% · C 77% ✅'); hud('🧪 Testing results group by group and rebalancing the training data closed the gap. Keep checking after every change.', 'ok'); }
      if (id === 'harmful') { packets.send(curve([-22, 2.4, 0], [-14, 3, 0], [-6, 3, 0]), C.red, 1, undefined, 0.92); later(0.9, () => { glow(gateM, C.red, 1); hud('🧨 “Ignore your rules and…” Prompt Shields spot the jailbreak and block it before it reaches the model.', 'bad'); }); }
      if (id === 'normal') { packets.send(curve([-22, 2.4, 0], [-6, 3, 0], [0, 3.2, 0]), C.green, 1.3, () => { packets.send(curve([0, 3.2, 0], [-6, 3, 0], [-22, 2.4, 0]), C.green, 1.3); hud('💬 A normal question passes the guardrail on the way in, and the answer is checked again on the way out.', 'ok'); }); }
      if (id === 'pii') { piiLbl.set('📞 Call me on 98765 43210'); toCore([-22, 2.4, 0], C.amber, () => hud('📇 That phone number is personal data (PII). Stored as-is, it could leak in logs or answers.', 'info')); }
      if (id === 'mask') { piiLbl.set('📞 Call me on ***** *****'); toCore([-22, 2.4, 0], C.green, () => hud('🛡️ PII detection masks the number before it is stored. Your prompts stay in your Azure tenant and are not used to train the shared models.', 'ok')); }
      if (id === 'include') { toCore([board.position.x, 2, board.position.z], C.green); hud('🦻 Speech to text adds live captions and translation, so a user who is deaf, or who speaks another language, can join in.', 'ok'); }
      if (id === 'cite') { citeLbl.show(true); toCore([-22, 2.4, 0], C.green, () => hud('📎 The answer says it is AI-generated and shows where it came from, so people can check it.', 'ok')); }
      if (id === 'hidden') { citeLbl.show(false); hud('🙈 Hiding that a chatbot is an AI, or hiding its sources, breaks trust. Transparency means people know what they are dealing with.', 'bad'); }
      if (id === 'approve') {
        packets.send(curve([0, 3.2, 0], [-6, 3.5, -6], [reviewer.position.x, 2, reviewer.position.z]), C.amber, 1.4, () => { hud('🧑‍⚖️ A refund over the limit goes to a person. The agent suggests, a human approves, and the audit log records who decided.', 'info'); glow(pillars[5].m, C.green, 0.9); });
      }
      void step;
    },
  };
}
