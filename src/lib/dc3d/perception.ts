import { THREE, C, v, mat, box, ground, plate, glow, Packets, after, type V3 } from './kit';
import { stepLabels, type Ctx, type Ctl } from './types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));

/** AI workloads as five lanes: generative/agentic, text analysis, speech, vision (+ image generation) and information extraction. */
export function perception({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 160, 0xdde8de);
  const packets = new Packets(stage, 0.4);
  const later = after(stage);

  const LANES: { z: number; name: string; tool: string; inp: string; col: number }[] = [
    { z: -16, name: 'Generative and agentic AI', tool: '🤖 Model / agent', inp: '💬 Prompt', col: C.purple },
    { z: -8, name: 'Text analysis', tool: '📝 Azure Language', inp: '📝 Review', col: C.azure },
    { z: 0, name: 'Speech', tool: '🎙️ Azure Speech', inp: '🎙️ Audio', col: 0x008575 },
    { z: 8, name: 'Computer vision', tool: '👁️ Vision / multimodal model', inp: '📷 Photo', col: C.amber },
    { z: 16, name: 'Information extraction', tool: '🧾 Content Understanding', inp: '🧾 Invoice · 🎬 video', col: C.green },
  ];
  const lanes = LANES.map((l) => {
    S.add(plate(46, 5, 0xeef2f6, [0, 0, l.z]));
    const inM = mat(0xffffff, { emissive: l.col, emissiveIntensity: 0.1 });
    const toolM = mat(l.col, { emissive: l.col, emissiveIntensity: 0.25 });
    const outM = mat(0xf7f7f7, { emissive: l.col, emissiveIntensity: 0.05 });
    S.add(box(3, 3, 2.6, inM, [-19, 0.1, l.z]), box(5, 3.6, 3.4, toolM, [0, 0.1, l.z]), box(6, 3, 0.4, outM, [19, 0.1, l.z]));
    return { ...l, toolM, outM };
  });

  const laneFor = [-1, 1, 2, 2, 3, 3, 4, 4];
  const L = stepLabels(stage);
  lanes.forEach((l, k) => {
    L.add(l.name, [-19, 0.6, l.z - 3.2], [0, ...laneFor.map((x, i) => (x === k ? i : -1)).filter((i) => i > 0)], 'd3-label-strong');
    L.add(l.inp, [-19, 4, l.z], 'all');
    L.add(l.tool, [0, 4.6, l.z], 'all', 'd3-label-strong');
  });
  const out = lanes.map((l) => L.add('…', [19, 4, l.z], 'all'));
  const RESULTS = ['✍️ A new answer, or an action taken', '😐 Mixed · key phrases · entities · PII masked · summary', '“What time does the Chennai store open on Sundays?”', '🔊 Neural voice: en-IN-NeerjaNeural', '🏷️ Shelf, cereal boxes · 3 empty spaces · OCR: “Contoso Oats”', '🎨 New image: rainy Chennai street poster', '🧾 Vendor: Contoso · Total ₹48,260 (0.98) · PO (0.62 ⚠️)', '🎬 3 segments · transcript · summary'];

  let step = 0;
  const run = (k: number, result: string, msg: string, back = false) => {
    const z = lanes[k].z;
    const path = back ? curve([19, 1.5, z], [10, 3, z], [0, 2, z], [-10, 3, z], [-19, 1.5, z]) : curve([-19, 1.5, z], [-10, 3, z], [0, 2, z]);
    packets.send(path, lanes[k].col, 1, () => {
      glow(lanes[k].toolM, C.amber, 0.9);
      later(0.5, () => glow(lanes[k].toolM, lanes[k].col, 0.25));
      if (back) { out[k].set(result); hud(msg, 'ok'); return; }
      packets.send(curve([0, 2, z], [10, 3, z], [19, 1.5, z]), C.green, 1, () => { out[k].set(result); glow(lanes[k].outM, C.green, 0.4); hud(msg, 'ok'); });
    });
  };

  return {
    go(i) {
      step = i;
      later.cancelAll();
      packets.clear();
      hud('');
      L.show(i);
      out.forEach((o) => o.set('…'));
      lanes.forEach((l) => { glow(l.toolM, l.col, laneFor[i] === -1 || lanes.indexOf(l) === laneFor[i] ? 0.35 : 0.05); glow(l.outM, l.col, 0.05); });
      cost(0, 'month', '');
      const k = laneFor[i];
      if (k === -1) stage.fly([0, 40, 34], [0, 0, 0]);
      else stage.fly([0, 20, lanes[k].z + 30], [0, 1, lanes[k].z]);
      if (i === 0) lanes.forEach((_, j) => later(j * 0.4, () => run(j, RESULTS[[0, 1, 2, 4, 6][j]], 'Each lane takes a different kind of input. Spot the input and the output and you know the workload.')));
    },
    act(id) {
      if (id === 'review') run(1, RESULTS[1], '📝 “The room was spotless but breakfast was cold.” → sentiment: mixed; key phrases: room, breakfast; entities: Chennai (Location), Priya (Person); PII masked.');
      if (id === 'stt') run(2, RESULTS[2], '🎙️ Speech to text: the caller’s words become text (with timestamps, and speakers labelled if you turn on diarization).');
      if (id === 'tts') run(2, RESULTS[3], '🔊 Text to speech: the answer is read aloud in a natural neural voice. SSML can slow it down or add a pause.', true);
      if (id === 'photo') run(3, RESULTS[4], '📷 The vision model returns a caption, tags, objects with boxes and any text it can read (OCR).');
      if (id === 'gen') run(3, RESULTS[5], '🎨 Image generation runs the other way: words in, a brand-new picture out, with content credentials marking it as AI-made.', true);
      if (id === 'invoice') run(4, RESULTS[6], '🧾 Content Understanding returns the fields you asked for, each with a confidence score. The 0.62 field goes to a person.');
      if (id === 'video') run(4, RESULTS[7], '🎬 The video is split into segments with key frames, a transcript and a description of each part.');
      void step;
    },
  };
}
