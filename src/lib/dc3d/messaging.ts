import { THREE, C, v, mat, box, cyl, person, ground, plate, glow, Packets, after, every, type V3 } from './kit';
import { stepLabels, type Ctx, type Ctl } from './types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));
type M = THREE.MeshStandardMaterial;

/** Messaging for AI back ends: queue vs inline, peek-lock, dead-letter queue, topic filters, Event Grid filters and retries, Functions bindings and scaling. */
export function messaging({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 170, 0xdde6ef);
  const packets = new Packets(stage, 0.32);
  const later = after(stage);
  const solid = (c: number, e = 0.25) => mat(c, { emissive: c, emissiveIntensity: e });
  const flash = (m: M, c: number, base: number, sec = 1) => { glow(m, c, 1); later(sec, () => glow(m, base, 0.25)); };

  // Row 1: users → web API → Service Bus queue (+ DLQ) → worker
  S.add(plate(50, 22, 0xd6e6f5, [-12, 0, -2]));
  const crowd = Array.from({ length: 8 }, (_, k) => { const p = person([C.purple, C.azure, 0xe3008c, C.green][k % 4], [-34 + (k % 4) * 1.8, 0.1, -3 + Math.floor(k / 4) * 3], 1.3); S.add(p); return p; });
  const apiM = solid(C.azure, 0.3), wrkM = solid(C.green, 0.25), dlqM = solid(0x6b7b8c, 0.2);
  S.add(box(3.4, 3, 3, apiM, [-20, 0.12, 0]), box(9, 1.6, 2.2, mat(C.purple, { transparent: true, opacity: 0.3, depthWrite: false }), [-8, 0.12, 0]), box(3.4, 3, 3, wrkM, [6, 0.12, 0]), box(5, 1.4, 2.2, dlqM, [-8, 0.12, -8]));
  const cubes = Array.from({ length: 8 }, (_, k) => { const m = solid(C.azure, 0.3); const b = box(0.8, 0.8, 0.8, m, [-4.6 - k * 1.1, 0.5, 0]); S.add(b); return { b, m }; });

  // Topic + three subscriptions
  S.add(plate(26, 22, 0xe8e1f5, [28, 0, -2]));
  const topicM = solid(C.purple, 0.3);
  S.add(box(2.6, 2.4, 2.6, mat(0x34495e), [16, 0.12, 0]), box(3.6, 2.6, 3.6, topicM, [24, 0.12, 0]));
  const SUBS: [string, number, boolean][] = [['🔎 indexing · filter: all messages', -7, true], ['💳 billing · filter: tier = \'premium\'', 0, true], ['🎁 free-trial nudges · filter: tier = \'free\'', 7, false]];
  const subs = SUBS.map(([, z]) => { const m = solid(C.azureLight, 0.2); S.add(box(3, 2, 3, m, [35, 0.12, z])); return m; });

  // Event Grid row: blob storage → topic → two handlers, dead-letter container
  S.add(plate(46, 20, 0xdbe9e2, [-6, 0, -26]));
  const egM = solid(C.amber, 0.4);
  const eg = new THREE.Mesh(new THREE.OctahedronGeometry(1.6), egM);
  eg.position.set(-8, 2.2, -24);
  const sumM = solid(C.green, 0.25), thumbM = solid(C.azureLight, 0.25);
  S.add(cyl(1.6, 2.4, solid(C.azure, 0.2), [-24, 0.12, -24]), eg, box(3, 2.6, 3, sumM, [8, 0.12, -29]), box(3, 2.6, 3, thumbM, [8, 0.12, -19]), cyl(1.2, 1.6, solid(0x6b7b8c, 0.1), [-8, 0.12, -32]));

  // Functions row: client → function app instances → output queue
  S.add(plate(46, 16, 0xf6ead6, [-6, 0, 19]));
  const client = person(C.azure, [-24, 0.1, 18], 1.6);
  S.add(client);
  const fnM = solid(C.amber, 0.35);
  const insts = Array.from({ length: 12 }, (_, k) => { const b = box(1.8, 1.8, 1.8, fnM, [-12 + (k % 4) * 2.6, 0.12, 15.5 + Math.floor(k / 4) * 2.6]); S.add(b); return b; });
  const outQM = solid(C.purple, 0.3);
  S.add(box(4, 1.6, 2.2, outQM, [10, 0.12, 18]));

  const L = stepLabels(stage);
  L.add('👥 Users uploading PDFs', [-32, 3.6, -1], [0]);
  const apiLbl = L.add('🌐 Web API', [-20, 4.2, 0], [0]);
  const qLbl = L.add('📨 Service Bus queue “summarise”', [-8, 3, 0], [0, 1, 2], 'd3-label-strong');
  const wrkLbl = L.add('⚙️ Worker', [6, 4.2, 0], [0, 1, 2]);
  const dlqLbl = L.add('🪦 Dead-letter queue: 0', [-8, 2.6, -8], [2]);
  L.add('🌐 Upload API (publisher)', [16, 3.6, 0], [3]);
  L.add('📣 Topic “document-uploaded”', [24, 4, 0], [3], 'd3-label-strong');
  const subLbl = SUBS.map(([n, z]) => L.add(n, [35, 3.2, z], [3]));
  L.add('🗂️ Blob storage', [-24, 3.6, -24], [4, 5]);
  L.add('⚡ Event Grid system topic', [-8, 4.6, -24], [4, 5], 'd3-label-strong');
  const sumLbl = L.add('📝 summarise function · subject ends with .pdf', [8, 4, -29], [4, 5]);
  L.add('🖼️ thumbnails function · subject ends with .png', [8, 4, -19], [4]);
  L.add('🪦 Dead-letter container', [-8, 2.8, -32], [5]);
  L.add('📱 Client', [-24, 3.4, 18], [6]);
  const fnLbl = L.add('⚡ Function app', [-8, 4, 15.5], [6, 7], 'd3-label-strong');
  const outLbl = L.add('📨 queue “summarise”', [10, 3, 18], [6, 7]);

  let step = 0, msgs: number[] = [], draining = false, deliveries = 0, dlq = 0, inst = 0, backlog = 0, cool = 0;
  const paintQ = () => {
    cubes.forEach((c, k) => { c.b.visible = k < msgs.length; if (k < msgs.length) { c.m.color.setHex(msgs[k]); glow(c.m, msgs[k], 0.3); } });
    qLbl.set(`📨 Service Bus queue “summarise”: ${msgs.length}`);
  };
  const paintFn = () => {
    insts.forEach((b, k) => (b.visible = k < inst));
    fnLbl.set(`⚡ Function app · ${inst} instance${inst === 1 ? '' : 's'}`);
    outLbl.set(`📨 queue “summarise”: ${backlog}`);
    if (step === 7) cost(inst * 0.12, 'hour', inst ? `${inst} Flex Consumption instances, billed per second of work (illustrative)` : 'idle: scaled to zero, nothing billed');
  };
  const qToWorker = (col: number, done?: () => void, bounce?: number) => packets.send(curve([-4, 1.2, 0], [1, 2.6, 0], [6, 2, 0]), col, 0.6, done, bounce);
  const workerBack = (done?: () => void) => packets.send(curve([6, 2, 0], [1, 2.6, 0], [-4, 1.2, 0]), C.amber, 0.6, done);

  // Worker drains the queue at its own pace (step 1 of the story)
  every(stage, 0.7, () => {
    if (step !== 0 || !draining || !msgs.length) return;
    msgs.shift(); paintQ(); qToWorker(C.green, () => flash(wrkM, C.green, C.green, 0.4));
    if (!msgs.length) { draining = false; hud('📨 Every upload got “202 Accepted” in milliseconds, and the worker summarised the PDFs one after another. Slow work, happy users.', 'ok'); }
  });
  // Functions scale controller
  every(stage, 0.4, () => {
    if (step !== 7) return;
    if (backlog > 0) {
      if (inst < 12) inst++;
      backlog = Math.max(0, backlog - inst * 15);
      for (let k = 0; k < Math.min(inst, 4); k++) { const b = insts[k * 3 % inst]; packets.send(curve([10, 1.5, 18], [2, 3, 18], [b.position.x, 1.5, b.position.z]), C.purple, 0.5); }
      if (backlog === 0) { cool = 6; hud('✅ All 2,000 messages processed. With nothing left to do, instances are released…', 'ok'); }
    } else if (cool > 0) { cool--; } else if (inst > 0) { inst--; if (inst === 0) hud('😴 Idle again: zero instances, zero compute bill. On Premium you’d keep at least one warm instance to skip the cold start.', 'ok'); }
    paintFn();
  });

  return {
    go(i) {
      step = i;
      later.cancelAll();
      packets.clear();
      hud('');
      L.show(i);
      draining = false; deliveries = 0; dlq = 0;
      crowd.forEach((p) => (p.visible = i === 0));
      glow(apiM, C.azure, 0.3); glow(wrkM, C.green, 0.25); glow(sumM, C.green, 0.25);
      apiLbl.set('🌐 Web API');
      msgs = i === 1 ? [C.azure, C.azure, C.azure] : i === 2 ? [C.red, C.azure] : [];
      paintQ();
      wrkLbl.set(i === 1 ? '⚙️ Worker · delivery count 0' : '⚙️ Worker');
      dlqLbl.set('🪦 Dead-letter queue: 0');
      subs.forEach((m) => glow(m, C.azureLight, 0.2));
      SUBS.forEach(([n], k) => subLbl[k].set(n));
      sumLbl.set('📝 summarise function · subject ends with .pdf');
      inst = i === 6 ? 1 : 0; backlog = 0; cool = 0; paintFn();
      cost(0, 'month', '');
      const cams: [V3, V3][] = [[[-14, 16, 26], [-14, 1, 0]], [[-2, 12, 18], [-2, 1, 0]], [[-2, 14, 16], [-2, 1, -4]], [[26, 14, 22], [27, 1, 0]], [[-6, 16, -4], [-4, 1, -24]], [[-4, 16, -6], [-4, 1, -26]], [[-8, 14, 38], [-6, 1, 18]], [[-2, 16, 40], [-2, 1, 18]]];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (id === 'inline') {
        for (let k = 0; k < 24; k++) later(k * 0.08, () => { const p = crowd[k % 8].position; const fail = k > 5; packets.send(curve([p.x, 1.5, p.z], [-26, 3, p.z / 2], [-20, 2, 0]), fail ? C.red : C.azure, 0.8, undefined, fail ? 0.9 : undefined); });
        later(0.8, () => { glow(apiM, C.red, 1); apiLbl.set('🌐 Web API · CPU 100% · 504 timeouts'); hud('⏳ Each request holds a thread for a minute while it summarises. A thousand at once and the API runs out of threads: requests queue up inside it and time out (red).', 'bad'); });
      }
      if (id === 'queue') {
        draining = true;
        for (let k = 0; k < 8; k++) later(k * 0.15, () => { const p = crowd[k].position; packets.send(curve([p.x, 1.5, p.z], [-26, 3, p.z / 2], [-20, 2, 0]), C.azure, 0.6, () => { packets.send(curve([-20, 2, 0], [-26, 3, p.z / 2], [p.x, 1.5, p.z]), C.green, 0.6); packets.send(curve([-18, 2, 0], [-15, 2.6, 0], [-12, 1.2, 0]), C.azure, 0.4, () => { msgs.push(C.azure); paintQ(); }); }); });
        hud('📨 The API drops a small message (the blob URL, not the PDF) on the queue and answers “202 Accepted” right away…', 'info');
      }
      if (id === 'complete' || id === 'abandon') {
        if (!msgs.length) msgs = [C.azure];
        msgs[0] = C.amber; paintQ(); deliveries++;
        wrkLbl.set(`⚙️ Worker · delivery count ${deliveries}`);
        qToWorker(C.amber, () => {
          flash(wrkM, C.amber, C.green, 0.8);
          if (id === 'complete') later(0.9, () => { msgs.shift(); paintQ(); deliveries = 0; hud('✅ Peek-lock: the message stayed in the queue (amber = locked, invisible to other workers) until the worker called complete_message(). Only then was it deleted.', 'ok'); });
          else later(0.6, () => workerBack(() => { msgs[0] = C.azure; paintQ(); hud(`↩️ abandon_message() releases the lock, so the message is back at the head of the queue and the next receive gets it again. Delivery count is now ${deliveries}.`, 'info'); }));
        });
      }
      if (id === 'poison') {
        if (msgs[0] !== C.red) { msgs.unshift(C.red); paintQ(); }
        for (let n = 1; n <= 10; n++) later(n * 0.45, () => qToWorker(C.red, () => { flash(wrkM, C.red, C.green, 0.3); wrkLbl.set(`⚙️ Worker · attempt ${n} of 10 failed`); }));
        later(5.4, () => { msgs.shift(); paintQ(); packets.send(curve([-4.6, 1, 0], [-6, 2.4, -4], [-8, 1, -8]), C.red, 0.7, () => { dlq++; flash(dlqM, C.red, 0x6b7b8c, 2); dlqLbl.set(`🪦 Dead-letter queue: ${dlq} · MaxDeliveryCountExceeded`); hud('☠️ Ten failed deliveries, so Service Bus moved it to the dead-letter queue (…/summarise/$deadletterqueue). The good messages behind it flow again. Read the DLQ, fix the link, resubmit.', 'bad'); }); });
      }
      if (id === 'publish') {
        packets.send(curve([16, 2, 0], [20, 3, 0], [24, 2, 0]), C.purple, 0.6, () => {
          flash(topicM, C.amber, C.purple);
          SUBS.forEach(([n, z, pass], k) => packets.send(curve([24, 2, 0], [30, 3, z * 0.6], [35, 1.6, z]), pass ? C.green : C.red, 0.8, () => { if (pass) { flash(subs[k], C.green, C.azureLight); subLbl[k].set(`${n} · 1 copy`); } }, pass ? undefined : 0.85));
          later(1, () => hud('📣 The message has tier = \'premium\'. Indexing (no filter) and billing (tier = \'premium\') each got their own copy. The free-trial subscription’s filter didn’t match, so it got nothing.', 'ok'));
        });
      }
      if (id === 'event' || id === 'filtered') {
        const pdf = id === 'event';
        packets.send(curve([-24, 2.4, -24], [-16, 4, -24], [-8, 2.2, -24]), C.amber, 0.8, () => {
          flash(egM, C.amber, C.amber);
          packets.send(curve([-8, 2.2, -24], [0, 4, -27], [8, 1.6, -29]), pdf ? C.green : C.red, 0.8, () => pdf && flash(sumM, C.green, C.green), pdf ? undefined : 0.4);
          packets.send(curve([-8, 2.2, -24], [0, 4, -21], [8, 1.6, -19]), C.red, 0.8, undefined, 0.4);
          later(0.9, () => hud(pdf ? '⚡ Microsoft.Storage.BlobCreated for /contracts/q3.pdf. Only the summarise subscription matches “ends with .pdf”, so only it is called.' : '🚫 BlobCreated for /tmp/upload-91.tmp. Neither subscription’s subject filter matches, so no handler is called and nobody pays for a wasted run.', pdf ? 'ok' : 'info'));
        });
      }
      if (id === 'down') {
        glow(sumM, C.red, 0.9); sumLbl.set('📝 summarise function · 503 Service Unavailable');
        const waits = ['10 s', '30 s', '1 min', '5 min', '10 min', '30 min'];
        let t = 0;
        waits.forEach((w, n) => { t += 0.5 + n * 0.25; later(t, () => { packets.send(curve([-8, 2.2, -24], [0, 4, -27], [8, 1.6, -29]), C.red, 0.6, undefined, 0.9); sumLbl.set(`📝 attempt ${n + 1} failed · next retry in ~${w}`); }); });
        later(t + 1.2, () => packets.send(curve([-8, 2.2, -24], [-9, 2, -28], [-8, 1.2, -32]), C.amber, 0.8, () => hud('🔌 Event Grid kept retrying with growing gaps (exponential backoff, up to 30 attempts in 24 hours by default). When it gave up, the event went to the dead-letter container, so nothing was lost. Without dead-lettering it would have been dropped.', 'bad')));
      }
      if (id === 'http') {
        packets.send(curve([-24, 2, 18], [-18, 3, 17], [-12, 1.5, 15.5]), C.azure, 0.7, () => {
          flash(fnM, C.green, C.amber);
          packets.send(curve([-12, 1.5, 15.5], [-18, 3, 17], [-24, 2, 18]), C.green, 0.7);
          packets.send(curve([-12, 1.5, 15.5], [0, 3, 17], [10, 1.5, 18]), C.purple, 0.9, () => { backlog = 1; paintFn(); flash(outQM, C.green, C.purple); hud('🌐 The HTTP trigger ran the function, it returned 202, and a Service Bus output binding wrote the job to the queue. No ServiceBusClient code: the binding and an app setting did it.', 'ok'); });
        });
      }
      if (id === 'burst') { backlog = 2000; cool = 0; paintFn(); hud('📈 2,000 messages land. The platform watches the queue and keeps adding instances while the backlog grows…', 'info'); }
    },
  };
}
