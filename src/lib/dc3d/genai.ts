import { THREE, C, v, mat, box, ground, plate, glow, Packets, after, type V3 } from './kit';
import { stepLabels, type Ctx, type Ctl } from './types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));

/** Inside a generative model: tokens → embeddings → attention layers → next-token probabilities, plus temperature, context window, grounding and model size. */
export function genai({ stage, hud, cost, money }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 150, 0xd9e4f0);
  const packets = new Packets(stage, 0.35);
  const later = after(stage);
  S.add(plate(64, 30, 0xe8eef6, [0, 0, 0]));

  // Prompt tokens (left)
  const WORDS = ['Write', ' a', ' thank', '-you', ' note', ' to', ' my', ' team'];
  const tokM = mat(C.azure, { emissive: C.azure, emissiveIntensity: 0.25 });
  const toks = WORDS.map((_, k) => { const b = box(1.6, 1.6, 1.6, tokM, [-26 + k * 2.1, 0.1, 6]); S.add(b); return b; });
  // Context window frame
  const frameM = mat(C.amber, { transparent: true, opacity: 0.18, emissive: C.amber, emissiveIntensity: 0.3, depthWrite: false });
  const frame = box(18, 3.4, 3.4, frameM, [-18.6, 0, 6]);
  S.add(frame);
  // Transformer layers (centre)
  const layerMeshes: THREE.Mesh[] = [];
  const layers = [0, 1, 2, 3, 4].map((k) => { const m = mat(C.purple, { transparent: true, opacity: 0.35, emissive: C.purple, emissiveIntensity: 0.25 }); const l = box(8, 0.5, 8, m, [0, 1 + k * 1.4, 0]); S.add(l); layerMeshes.push(l); return m; });
  // Next-token bars (right)
  const CANDS = ['Team,', 'Dear', 'Hi', 'Thanks', 'Banana'];
  const base = [0.62, 0.18, 0.1, 0.07, 0.03];
  const barM = CANDS.map((_, k) => mat(k === 0 ? C.green : C.azureLight, { emissive: k === 0 ? C.green : C.azureLight, emissiveIntensity: 0.2 }));
  const bars = CANDS.map((_, k) => { const b = box(1.6, 1, 1.6, barM[k], [12 + k * 2.4, 0.1, 0]); S.add(b); return b; });
  const setBars = (p: number[], pick = 0) => bars.forEach((b, k) => { b.scale.set(1, Math.max(0.05, p[k] * 10), 1); glow(barM[k], k === pick ? C.green : C.azureLight, k === pick ? 0.6 : 0.15); });
  // Output tokens
  const outM = mat(C.green, { emissive: C.green, emissiveIntensity: 0.3 });
  const outs = [0, 1, 2, 3].map((k) => { const b = box(1.6, 1.6, 1.6, outM, [12 + k * 2.1, 0.1, -7]); b.visible = false; S.add(b); return b; });
  // Handbook (grounding)
  const book = box(3, 0.8, 4, mat(0x8a4b0f), [-8, 0.1, -9]);
  S.add(book);
  // Small vs large model
  const small = box(2.4, 2.4, 2.4, mat(C.green, { emissive: C.green, emissiveIntensity: 0.25 }), [-6, 0.1, -2]);
  const large = box(6, 6, 6, mat(C.purple, { emissive: C.purple, emissiveIntensity: 0.25 }), [6, 0.1, -3]);
  S.add(small, large);

  const L = stepLabels(stage);
  WORDS.forEach((w, k) => L.add(w.trim() || '·', [-26 + k * 2.1, 2.4, 6], [0, 1, 2, 5]));
  L.add('✂️ Prompt → tokens', [-18, 4.6, 6], [0], 'd3-label-strong');
  L.add('🔢 Each token → an embedding (a long list of numbers)', [-18, 4.6, 6], [1], 'd3-label-strong');
  L.add('🧠 Transformer layers (attention)', [0, 9, 0], [2, 3, 4], 'd3-label-strong');
  CANDS.forEach((c, k) => L.add(c, [12 + k * 2.4, 1.2, 1.6], [3, 4]));
  L.add('Next-token probabilities', [17, 8, 0], [3, 4], 'd3-label-strong');
  const outLbl = L.add('Output: Team,', [15, 2.8, -7], [3, 4, 6]);
  const ctxLbl = L.add('📏 Context window', [-18.6, 4.4, 6], [5]);
  L.add('📘 HR handbook', [-8, 2, -9], [6]);
  L.add('🐇 Small model (SLM)', [-6, 4, -2], [7]);
  L.add('🐘 Large model (LLM)', [6, 7.5, -3], [7]);

  let step = 0;
  let outCount = 0;
  const pop = (meshes: THREE.Mesh[]) => meshes.forEach((m, k) => { m.scale.setScalar(0.01); later(k * 0.15, () => m.scale.setScalar(1)); });

  return {
    go(i) {
      step = i;
      later.cancelAll();
      packets.clear();
      hud('');
      L.show(i);
      toks.forEach((t) => { t.visible = i <= 2 || i === 5 || i === 6; t.scale.setScalar(1); t.position.y = 0.1; });
      frame.visible = i === 5;
      frame.scale.set(1, 1, 1);
      layers.forEach((m) => glow(m, C.purple, 0.25));
      layerMeshes.forEach((l) => (l.visible = i >= 1 && i <= 4));
      bars.forEach((b) => (b.visible = i === 3 || i === 4));
      setBars(base);
      outs.forEach((o) => (o.visible = false));
      outCount = 0;
      outLbl.set('Output: Team,');
      book.visible = i === 6;
      small.visible = large.visible = i === 7;
      ctxLbl.set('📏 Context window');
      cost(0, 'month', '');
      if (i === 1) { tokM.color.setHex(C.purple); later(0.6, () => tokM.color.setHex(C.azure)); hud('Similar meanings get similar numbers: “team” sits near “colleagues”.', 'info'); }
      if (i === 7) cost(5, 'month', 'Illustrative: 10,000 short chats a month on a small model');
      const cams: [V3, V3][] = [[[-18, 10, 22], [-18, 1, 6]], [[-18, 8, 18], [-18, 1, 6]], [[-6, 14, 22], [-4, 4, 3]], [[16, 12, 18], [16, 2, -2]], [[16, 12, 18], [16, 2, -2]], [[-18, 10, 20], [-18, 1, 6]], [[-4, 14, 18], [-4, 1, -2]], [[0, 12, 18], [0, 2, -2]]];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (id === 'tokenize') { pop(toks); hud('✂️ 8 tokens. Common words are one token; longer or rarer words get split, like “thank” + “-you”. You pay per token, in and out.', 'ok'); }
      if (id === 'attend') {
        layers.forEach((m, k) => later(k * 0.2, () => glow(m, C.amber, 0.8)));
        toks.forEach((t, k) => later(k * 0.1, () => packets.send(curve([t.position.x, 1.8, 6], [-6, 4, 4], [0, 3 + (k % 5), 0]), C.amber, 1)));
        hud('🔦 Attention: every token looks at the others. “team” attends to “thank-you note”, so the model knows who the note is for.', 'ok');
      }
      if (id === 'next') {
        packets.send(curve([0, 7, 0], [6, 6, 0], [12, 4, 0]), C.green, 0.9, () => {
          setBars(base);
          const o = outs[Math.min(outCount, outs.length - 1)]; o.visible = true; outCount++;
          outLbl.set(['Output: Team,', 'Output: Team, thank', 'Output: Team, thank you', 'Output: Team, thank you for'][Math.min(outCount - 1, 3)]);
          hud('➡️ The highest-scoring token is added to the output, then the whole thing runs again for the next one. One token at a time.', 'ok');
        });
      }
      if (id === 'cold') { setBars([0.9, 0.05, 0.03, 0.015, 0.005], 0); hud('🧊 Temperature 0.1: the top token wins almost every time. Same prompt, nearly the same answer. Good for facts and extraction.', 'info'); }
      if (id === 'hot') { const p = [0.3, 0.24, 0.2, 0.16, 0.1]; const pick = Math.floor(Math.random() * 4); setBars(p, pick); outLbl.set(`Output: ${CANDS[pick]}`); hud(`🔥 Temperature 1.2: the odds flatten, so “${CANDS[pick]}” got picked this time. More creative, less predictable. Press again for a different pick.`, 'bad'); }
      if (id === 'overflow') {
        toks.forEach((t, k) => later(k * 0.12, () => { t.position.y = k < 3 ? -3 : 0.1; }));
        ctxLbl.set('📏 Context window full: oldest tokens dropped');
        hud('📚 The chat grew past the context window. The oldest messages fall out, so the model can no longer “remember” them. Summarise or trim long chats.', 'bad');
      }
      if (id === 'guess') { hud('🤷 “You get 30 days of leave.” Sounds confident, but it was made up: the model never saw your policy. That is a hallucination.', 'bad'); }
      if (id === 'ground') { packets.send(curve([-8, 1, -9], [-14, 4, -2], [-18, 2, 6]), C.amber, 1.2, () => hud('📘 With the handbook pasted into the prompt, the answer is “24 days, and you can carry over 5”, taken from your own document. That is grounding (RAG).', 'ok')); }
      if (id === 'small') { packets.send(curve([-20, 2, 6], [-12, 3, 2], [-6, 1.5, -2]), C.green, 0.6, () => { cost(5, 'month', 'Small model: cheap and fast for an FAQ bot'); hud(`🐇 A small model answered the FAQ in a blink for a fraction of the cost (about ${money(5)} a month here, illustrative).`, 'ok'); }); }
      if (id === 'large') { packets.send(curve([-20, 2, 6], [-6, 5, 3], [6, 3, -3]), C.purple, 1.8, () => { cost(60, 'month', 'Large model: more capable, slower, pricier'); hud('🐘 The large model reasoned through a multi-step plan. Better at hard tasks, but slower and more expensive per token.', 'info'); }); }
      void step;
    },
  };
}
