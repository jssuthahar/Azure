import { THREE, C, v, mat, box, cyl, person, ground, plate, glow, Packets, after, type V3 } from './kit';
import { stepLabels, type Ctx, type Ctl } from './types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));

/** Microsoft Foundry: resource and project, model catalog, deployment, playground, SDK app, agent with tools, guardrails and tracing. */
export function foundry({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 160, 0xdde6ef);
  const packets = new Packets(stage, 0.4);
  const later = after(stage);

  // Foundry resource and project plates
  S.add(plate(44, 32, 0xd9cfee, [0, 0, 0]), plate(26, 18, 0xeee8f8, [4, 0.14, 0]));
  // Model catalog shelf (left)
  const MODELS = [C.green, C.azure, C.purple, C.amber, 0x008575];
  const shelf = MODELS.map((c, k) => { const m = mat(c, { emissive: c, emissiveIntensity: 0.15 }); const b = box(2, 2, 2, m, [-30, 0.1 + (k % 2) * 2.4, -8 + k * 4]); S.add(b); return { b, m, c }; });
  S.add(box(1, 6, 22, mat(C.steel), [-31.6, 0, 0]));
  // Deployment slot (centre)
  const depM = mat(C.azure, { emissive: C.azure, emissiveIntensity: 0.35 });
  const dep = box(3, 3, 3, depM, [2, 0.2, -4]);
  S.add(dep);
  // Playground desk + person
  const dev = person(C.purple, [-6, 0.2, 7], 1.7);
  S.add(dev, box(3, 1.2, 1.6, mat(0x444444), [-3.5, 0.2, 7]));
  // App laptop + user (right, outside)
  const appM = mat(0x1b1a19, { emissive: 0x55b6ff, emissiveIntensity: 0.25 });
  S.add(box(3, 2, 0.4, appM, [30, 0.1, 0]));
  const user = person(C.azure, [34, 0.1, 0], 1.7);
  S.add(user);
  // Gate (Entra ID + guardrails)
  const gateM = mat(C.amber, { emissive: C.amber, emissiveIntensity: 0.3, transparent: true, opacity: 0.6 });
  const gate = box(0.5, 6, 8, gateM, [20, 0.1, 0]);
  S.add(gate);
  // Agent + tools
  const botM = mat(C.purple, { emissive: C.purple, emissiveIntensity: 0.4 });
  const bot = new THREE.Group();
  bot.add(cyl(1.2, 2.4, botM, [0, 0.2, 0]), new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), botM));
  (bot.children[1] as THREE.Mesh).position.y = 3.4;
  bot.position.set(10, 0.2, 3);
  S.add(bot);
  const TOOLS: [string, number, V3][] = [['📄 File search', C.azureLight, [6, 0.2, 9]], ['🧮 Code interpreter', C.green, [12, 0.2, 9]], ['🔌 Function', C.amber, [16, 0.2, 6]]];
  const tools = TOOLS.map(([n, c, at]) => { const m = mat(c, { emissive: c, emissiveIntensity: 0.2 }); const b = box(2.2, 1.6, 2.2, m, at); S.add(b); return { n, m, c, at }; });
  // Monitoring board
  const board = box(7, 4, 0.3, mat(0x1b1a19, { emissive: 0x223355, emissiveIntensity: 0.4 }), [4, 2, -10]);
  S.add(board);

  const L = stepLabels(stage);
  L.add('✨ Foundry resource · contoso-ai', [-14, 1.2, -15], 'all', 'd3-label-strong');
  L.add('📁 Project · support-bot', [4, 1.4, -8.5], [0, 2, 3, 4, 5, 6, 7]);
  L.add('📚 Model catalog', [-30, 6.5, 0], [0, 1, 2], 'd3-label-strong');
  ['gpt-4.1-mini', 'Phi-4-mini', 'gpt-4.1', 'gpt-image-1', 'Llama 3.3'].forEach((n, k) => L.add(n, [-28, 2.6 + (k % 2) * 2.4, -8 + k * 4], [1]));
  const depLbl = L.add('🚀 Deployment: gpt-4.1-mini · Global Standard', [2, 4.6, -4], [2, 3, 4, 5, 6]);
  L.add('🧑‍💻 Playground', [-6, 3.6, 7], [3]);
  L.add('🐍 Your Python app', [30, 3.2, 0], [4, 7]);
  L.add('🔐 Entra ID + guardrails', [20, 6.8, 0], [4, 7]);
  L.add('🤖 Agent: instructions + tools', [10, 6, 3], [5, 6], 'd3-label-strong');
  tools.forEach((t) => L.add(t.n, [t.at[0], 2.6, t.at[2]], [5, 6]));
  const traceLbl = L.add('📈 Traces · evaluations', [4, 4.8, -10], [7]);

  let step = 0;
  let deployed = false;
  const flash = (m: THREE.MeshStandardMaterial, c: number, base: number) => { glow(m, c, 1); later(1, () => glow(m, base, 0.3)); };

  return {
    go(i) {
      step = i;
      later.cancelAll();
      packets.clear();
      hud('');
      L.show(i);
      deployed = i >= 3;
      dep.visible = i >= 2 && (i !== 2 || deployed);
      dep.visible = i >= 3;
      depLbl.set('🚀 Deployment: gpt-4.1-mini · Global Standard');
      dev.visible = i === 3;
      gate.visible = i === 4 || i === 7;
      bot.visible = i === 5 || i === 6;
      tools.forEach((t) => { t.m.color.setHex(t.c); });
      board.visible = i === 7;
      traceLbl.set('📈 Traces · evaluations');
      shelf.forEach((s) => glow(s.m, s.c, 0.15));
      cost(i === 2 || i === 3 ? 12 : 0, 'month', i === 2 || i === 3 ? 'Illustrative: pay per token on Global Standard' : '');
      const cams: [V3, V3][] = [[[0, 34, 38], [0, 0, 0]], [[-18, 12, 16], [-30, 3, 0]], [[-14, 14, 20], [-10, 2, -2]], [[-8, 12, 20], [-2, 2, 3]], [[24, 14, 20], [16, 2, 0]], [[12, 14, 22], [10, 2, 4]], [[12, 14, 22], [10, 2, 5]], [[14, 16, 22], [10, 2, -3]]];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (id === 'browse') { shelf.forEach((s, k) => later(k * 0.3, () => flash(s.m, C.amber, s.c))); hud('🔎 Each model has a model card: what it accepts (text, images, audio), its context window, benchmarks and the deployment types it supports.', 'info'); }
      if (id === 'deploy-std' || id === 'deploy-batch') {
        packets.send(curve([-30, 1.5, -8], [-14, 5, -6], [2, 1.5, -4]), C.green, 1.2, () => {
          dep.visible = true; deployed = true;
          if (id === 'deploy-std') { depLbl.set('🚀 Deployment: gpt-4.1-mini · Global Standard'); hud('🚀 Deployed as “gpt-4.1-mini” on Global Standard: pay per token, answers in seconds. Apps call it by the deployment name.', 'ok'); cost(12, 'month', 'Illustrative: pay per token on Global Standard'); }
          else { depLbl.set('🐢 Deployment: gpt-4.1-mini · Global Batch'); hud('🐢 Global Batch: upload a file of requests, results within 24 hours at about half the price. Great for big overnight jobs, wrong for a live chatbot.', 'info'); cost(6, 'month', 'Illustrative: batch is about 50% cheaper'); }
        });
      }
      if (id === 'chat') packets.send(curve([-5, 2, 7], [-1, 3, 2], [2, 2, -4]), C.azure, 1, () => { packets.send(curve([2, 2, -4], [-1, 3, 2], [-5, 2, 7]), C.green, 1); hud('💬 System message: “You are Contoso’s assistant.” User: “Store hours?” The deployment answers, and you tune temperature until it feels right.', 'ok'); });
      if (id === 'app') { packets.send(curve([30, 1.5, 0], [20, 3, 0], [8, 3, -2], [2, 2, -4]), C.azure, 1.4, () => { packets.send(curve([2, 2, -4], [20, 3, 0], [30, 1.5, 0]), C.green, 1.2); hud('🐍 AIProjectClient signed in with Entra ID → get_openai_client() → responses.create(model="gpt-4.1-mini"). The answer comes back to the app.', 'ok'); }); }
      if (id === 'noauth') { packets.send(curve([30, 1.5, 0], [24, 3, 0], [20, 3, 0]), C.red, 1, undefined, 0.92); later(0.9, () => { flash(gateM, C.red, C.amber); hud('⛔ 401 Unauthorized. The Foundry SDK needs a Microsoft Entra ID sign-in (DefaultAzureCredential) and the Foundry User role.', 'bad'); }); }
      if (id === 'agent') packets.send(curve([30, 1.5, 0], [20, 3, 2], [10, 3, 3]), C.azure, 1.2, () => { packets.send(curve([10, 3, 3], [6, 4, -1], [2, 2, -4]), C.purple, 0.8, () => { packets.send(curve([2, 2, -4], [10, 3, 3], [30, 1.5, 0]), C.green, 1.4); hud('🤖 The agent read its instructions, asked the model what to do, and replied. Foundry keeps the conversation history for the next turn.', 'ok'); }); });
      if (id === 'tools') {
        packets.send(curve([10, 3, 3], [8, 3, 6], [6, 1.5, 9]), C.azureLight, 0.8, () => { flash(tools[0].m, C.green, tools[0].c); hud('📄 Step 1: file search finds “damaged items: up to ₹5,000” in the refund policy…', 'info');
          later(0.6, () => packets.send(curve([10, 3, 3], [11, 3, 6], [12, 1.5, 9]), C.green, 0.8, () => { flash(tools[1].m, C.green, tools[1].c); hud('🧮 Step 2: the code interpreter runs 0.15 × 4200 = 630…', 'info');
            later(0.6, () => packets.send(curve([10, 3, 3], [20, 3, 2], [30, 1.5, 0]), C.green, 1.2, () => hud('✅ One answer: “Up to ₹5,000 for damaged items, and 15% of 4200 is 630.” Plan → act → observe → answer.', 'ok'))); })); });
      }
      if (id === 'blocked') { packets.send(curve([30, 1.5, 0], [24, 3, 0], [20, 3, 0]), C.red, 1, undefined, 0.92); later(0.9, () => { flash(gateM, C.red, C.amber); hud('🧨 The guardrail blocked a harmful prompt on the way in. The model never saw it, and the event shows up in monitoring.', 'bad'); }); }
      if (id === 'trace') { traceLbl.set('📈 Run 2.1 s: plan 0.4 s · file_search 0.6 s · code 0.5 s · answer 0.6 s'); hud('📈 Tracing shows every step the app or agent took, with timings and tokens. Evaluations score groundedness, relevance and safety.', 'info'); }
      void step;
    },
  };
}
