import { THREE, C, v, mat, box, cyl, person, ground, plate, glow, Packets, after, type V3 } from './kit';
import { stepLabels, type Ctx, type Ctl } from './types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));
type M = THREE.MeshStandardMaterial;

/** Data for AI apps: embeddings, Cosmos DB (partitions, RUs, indexing, consistency, vector search, change feed), pgvector, RAG with a tenant filter, Redis cache-aside. */
export function vectordata({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 180, 0xdde6ef);
  const packets = new Packets(stage, 0.35);
  const later = after(stage);
  const solid = (c: number, e = 0.25) => mat(c, { emissive: c, emissiveIntensity: e });
  const flash = (m: M, c: number, base: number, sec = 1) => { glow(m, c, 1); later(sec, () => glow(m, base, 0.25)); };

  // Embedding: text card → model → vector bars, plus a small meaning map
  S.add(plate(30, 24, 0xe8e1f5, [-24, 0, -4]));
  S.add(box(4, 0.4, 3, mat(0xffffff), [-34, 0.12, 0]));
  const embM = solid(C.purple, 0.3);
  S.add(box(3.4, 3, 3.4, embM, [-27, 0.12, 0]));
  const barM = solid(C.azureLight, 0.2);
  const bars = Array.from({ length: 16 }, (_, k) => { const b = box(0.5, 1, 0.5, barM, [-22 + k * 0.8, 0.12, 0]); S.add(b); return b; });
  const setBars = (seed: number) => bars.forEach((b, k) => b.scale.set(1, 0.3 + Math.abs(Math.sin(seed * 7.1 + k * 1.7)) * 3.6, 1));
  const DOTS: [string, V3, number][] = [['refund', [-28, 1, -10], C.green], ['money back', [-26.6, 1, -9.2], C.green], ['weather', [-18, 1, -14], C.steel], ['store hours', [-20, 1, -7], C.steel]];
  DOTS.forEach(([, at, c]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 10), mat(c)); s.position.set(...at); S.add(s); });
  const qDot = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 10), solid(C.amber, 0.6));
  qDot.position.set(-27.4, 1, -11);
  S.add(qDot);

  // Cosmos DB container: 4 logical partitions with items, an app, two replicas
  S.add(plate(30, 30, 0xd6e6f5, [8, 0, -2]));
  const TENANTS = ['contoso', 'fabrikam', 'northwind', 'adatum'];
  const parts = TENANTS.map((_, k) => { const m = solid(C.azure, 0.15); const b = box(4.4, 0.6, 4.4, m, [0.5 + k * 5.4, 0.12, 0]); S.add(b); return { b, m, x: 0.5 + k * 5.4 }; });
  const items = parts.map((p) => [0, 1, 2].map((n) => { const b = box(0.9, 0.9, 0.9, mat(0xffffff), [p.x - 1.2 + n * 1.2, 0.72, 0]); S.add(b); return b; }));
  const newItem = box(0.9, 0.9, 0.9, solid(C.green, 0.5), [0.5, 0.72, 1.4]);
  S.add(newItem, box(3, 2, 2, mat(0x1b1a19, { emissive: 0x55b6ff, emissiveIntensity: 0.25 }), [8, 0.12, 12]));
  const repM = [solid(C.azureLight, 0.2), solid(C.azureLight, 0.2)];
  const replicas = repM.map((m, k) => { const b = box(3, 2, 3, m, [k ? 16 : 0, 0.12, -11]); S.add(b); return b; });
  // Vector cloud above the container
  const FAQ: [string, V3][] = [['Refund policy', [4, 7, 1]], ['Return a damaged item', [6, 8.5, -1]], ['Money back in 5 days', [3, 8, -2]], ['Store hours', [14, 6, 2]], ['Gift cards', [12, 9, -3]], ['Shipping to Pune', [17, 7.5, -1]], ['Track my order', [10, 5.5, 3]], ['Change password', [18, 9, 2]]];
  const query = v(4.5, 8, 0);
  const vecs = FAQ.map(([, at]) => { const m = solid(C.steel, 0.1); const s = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), m); s.position.set(...at); S.add(s); return { s, m }; });
  const qVec = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 10), solid(C.amber, 0.6));
  qVec.position.copy(query);
  const lines = new THREE.Group();
  S.add(qVec, lines);
  // Change feed log, processor, lease container, embedding worker
  const logM = solid(C.purple, 0.2);
  const log = Array.from({ length: 8 }, (_, k) => { const b = box(1.6, 0.8, 1.6, logM, [-1 + k * 2.2, 0.12, -6]); S.add(b); return b; });
  const procM = solid(C.amber, 0.3);
  S.add(box(3, 2.4, 3, procM, [26, 0.12, -6]), cyl(1.2, 2, solid(C.steel, 0.1), [26, 0.12, -13]), box(2.2, 2.2, 2.2, solid(C.purple, 0.3), [32, 0.12, -6]));

  // PostgreSQL + pgvector table (rows coloured by tenant), HNSW layers, RAG app and model
  S.add(plate(26, 34, 0xdbe9e2, [50, 0, 2]));
  S.add(cyl(1.8, 3, solid(0x336791, 0.2), [50, 0.12, -11]));
  const rows = Array.from({ length: 40 }, (_, k) => { const c = k % 3 === 1 ? C.amber : C.azure; const m = solid(c, 0.1); const b = box(1.4, 0.5, 1.2, m, [43 + (k % 8) * 2, 0.12, -4 + Math.floor(k / 8) * 1.8]); S.add(b); return { b, m, c }; });
  const layers = new THREE.Group();
  [[5, 3], [7.5, 6], [10, 10]].forEach(([y, n], li) => {
    layers.add(box(15, 0.05, 9, mat(C.green, { transparent: true, opacity: 0.18, depthWrite: false }), [50, y, 0]));
    for (let k = 0; k < n; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), solid(C.green, 0.4)); s.position.set(44 + ((k * 37 + li * 11) % 13), y, -3.5 + ((k * 23 + li * 7) % 8)); layers.add(s); }
  });
  S.add(layers);
  const asker = person(C.azure, [40, 0.1, 15], 1.6);
  S.add(asker, box(3, 2, 2, mat(0x1b1a19, { emissive: 0x55b6ff, emissiveIntensity: 0.25 }), [46, 0.12, 15]), box(3, 3, 3, solid(C.purple, 0.3), [56, 0.12, 15]));

  // Redis cache-aside (front left)
  S.add(plate(26, 10, 0xf6dede, [-18, 0, 18]));
  const redisM = solid(C.red, 0.3);
  S.add(box(3, 2, 2, mat(0x1b1a19, { emissive: 0x55b6ff, emissiveIntensity: 0.25 }), [-28, 0.12, 18]), box(4, 2.6, 3, redisM, [-14, 0.12, 18]));
  const keyBox = box(1.4, 0.8, 1.4, solid(C.amber, 0.5), [-14, 2.8, 18]);
  S.add(keyBox);

  const L = stepLabels(stage);
  L.add('💬 “How do I get my money back?”', [-34, 1.4, 0], [0]);
  L.add('🧠 text-embedding-3-small', [-27, 4, 0], [0], 'd3-label-strong');
  const vecLbl = L.add('🔢 [0.012, -0.044, 0.31, … 1,536 numbers]', [-16, 5, 0], [0]);
  DOTS.forEach(([n, at]) => L.add(n, [at[0], 2.2, at[2]], [0]));
  L.add('🌌 Cosmos DB for NoSQL · container “faq” · partition key /tenantId', [8, 1.4, -9], [1, 2, 4], 'd3-label-strong');
  TENANTS.forEach((t, k) => L.add(t, [parts[k].x, 2.2, 0], [1, 2, 4]));
  L.add('🐍 App', [8, 3, 12], [1, 2, 3]);
  const ruLbl = L.add('RU charge: …', [8, 5.5, 4], [1, 2]);
  const idxLbl = L.add('📇 Indexing: all paths · ⚖️ Session', [8, 7, -3], [2]);
  L.add('🌍 Replica (Central India)', [0, 3, -11], [2]);
  L.add('🌍 Replica (South India)', [16, 3, -11], [2]);
  L.add('❓ Query vector', [query.x, query.y + 1.4, query.z], [3]);
  const hitAt: THREE.Vector3[] = [v(0, 0, 0), v(0, 0, 0), v(0, 0, 0)];
  const hits = hitAt.map((at) => L.add('', () => at, [3]));
  L.add('📜 Change feed (in order)', [6.7, 2, -6], [4]);
  L.add('⚙️ Change feed processor', [26, 3.4, -6], [4]);
  const leaseLbl = L.add('🔖 Lease: up to change 41', [26, 3, -13], [4]);
  L.add('🧠 Embed', [32, 3, -6], [4]);
  L.add('🐘 PostgreSQL + pgvector · table docs(embedding vector(1536))', [50, 4, -11], [5, 6], 'd3-label-strong');
  const pgLbl = L.add('', [50, 12, 0], [5]);
  L.add('🟦 contoso chunks · 🟧 fabrikam chunks', [50, 1.6, 5], [6]);
  L.add('👤 Contoso customer', [40, 3.4, 15], [6]);
  L.add('🐍 RAG app', [46, 3, 15], [6]);
  L.add('🤖 Chat model', [56, 4, 15], [6]);
  L.add('🐍 App', [-28, 3, 18], [7]);
  L.add('🟥 Azure Managed Redis', [-14, 3.4, 16], [7], 'd3-label-strong');
  const keyLbl = L.add('', [-14, 4.4, 18], [7]);
  const dbLbl = L.add('🌌 Cosmos DB: price ₹1,299', [0.5, 2.8, 2], [7]);

  let step = 0, ttl = 0;
  stage.onTick((_, dt) => {
    if (step !== 7 || ttl <= 0) return;
    ttl = Math.max(0, ttl - dt * 10);
    keyLbl.set(ttl > 0 ? `🔑 price:sku-42 = ₹1,299 · TTL ${Math.ceil(ttl)} s` : '🔑 key expired');
    keyBox.visible = ttl > 0;
  });
  const appToParts = (ks: number[], col: number) => ks.forEach((k, n) => later(n * 0.15, () => packets.send(curve([8, 2, 12], [(8 + parts[k].x) / 2, 4, 6], [parts[k].x, 1, 0]), col, 0.9, () => flash(parts[k].m, col, C.azure))));
  const sweep = (fn: (r: (typeof rows)[number], k: number) => void) => rows.forEach((r, k) => later(k * 0.04, () => fn(r, k)));
  const rag = (leak: boolean) => {
    packets.send(curve([40, 2, 15], [43, 3, 15], [46, 2, 15]), C.azure, 0.6, () => packets.send(curve([46, 2, 15], [48, 4, 8], [50, 1, 0]), C.azure, 0.8, () => {
      const pick = leak ? [0, 1, 3] : [0, 3, 6];
      pick.forEach((k) => glow(rows[k].m, leak && rows[k].c === C.amber ? C.red : C.green, 1));
      packets.send(curve([50, 1, 0], [52, 4, 8], [56, 2, 15]), leak ? C.red : C.green, 1, () => packets.send(curve([56, 2, 15], [48, 4, 17], [40, 2, 15]), leak ? C.red : C.green, 1.1, () => hud(leak
        ? '🔓 With no WHERE tenant_id = $2, the nearest chunk was Fabrikam’s refund terms, and the model quoted them to a Contoso customer. That is a data leak. Always filter by tenant, ideally enforced with row-level security.'
        : '💬 Embed the question → ORDER BY embedding <=> $1 with WHERE tenant_id = \'contoso\' LIMIT 5 → send those chunks as context. The answer quotes Contoso’s own refund policy.', leak ? 'bad' : 'ok')));
    }));
  };

  return {
    go(i) {
      step = i;
      later.cancelAll();
      packets.clear();
      hud('');
      L.show(i);
      hits.forEach((h) => h.show(false));
      setBars(1); vecLbl.set('🔢 [0.012, -0.044, 0.31, … 1,536 numbers]'); qDot.visible = false;
      parts.forEach((p) => { p.b.visible = i >= 1 && i <= 4 || i === 7; glow(p.m, C.azure, i === 3 ? 0.02 : 0.15); });
      items.flat().forEach((b) => (b.visible = i >= 1 && i <= 4 || i === 7));
      newItem.visible = false;
      replicas.forEach((r) => (r.visible = i === 2));
      ruLbl.set(i === 2 ? 'Write a 4 KB item with a 1,536-number array: ~70 RU' : 'RU charge: …');
      idxLbl.set('📇 Indexing: all paths · ⚖️ Session');
      vecs.forEach((x) => { x.s.visible = qVec.visible = i === 3; glow(x.m, C.steel, 0.1); });
      lines.clear();
      log.forEach((b, k) => (b.visible = i === 4 && k < 5));
      leaseLbl.set('🔖 Lease: up to change 41');
      rows.forEach((r) => glow(r.m, r.c, 0.1));
      layers.visible = false;
      pgLbl.set(i === 5 ? 'No vector index yet' : '');
      keyBox.visible = false; ttl = 0; keyLbl.set('🔑 (empty)'); dbLbl.set('🌌 Cosmos DB: price ₹1,299');
      cost(i === 7 ? 0.17 : 0, 'hour', i === 7 ? 'small Azure Managed Redis instance (illustrative)' : '');
      const cams: [V3, V3][] = [[[-24, 12, 18], [-24, 1, -3]], [[8, 14, 24], [8, 1, 3]], [[8, 16, 22], [8, 2, -3]], [[10, 14, 20], [10, 6, 0]], [[14, 16, 18], [14, 1, -6]], [[50, 18, 22], [50, 3, 0]], [[48, 16, 30], [48, 1, 8]], [[-14, 14, 32], [-12, 1, 12]]];
      stage.fly(...cams[i]);
    },
    act(id) {
      if (id === 'embed') packets.send(curve([-34, 1, 0], [-31, 3, 0], [-27, 2, 0]), C.azure, 0.8, () => {
        flash(embM, C.amber, C.purple); setBars(2.3);
        vecLbl.set('🔢 [0.021, -0.087, 0.442, … 1,536 numbers]');
        later(0.5, () => { qDot.visible = true; hud('🔢 The question became 1,536 numbers. On the meaning map it lands right next to “refund” and “money back”, far from “weather”, even though it shares no words with “refund”.', 'ok'); });
      });
      if (id === 'point') { appToParts([0], C.green); ruLbl.set('🎯 Point read (id + /tenantId): 1 RU'); hud('🎯 ReadItem("faq-17", partition key "contoso") goes straight to one partition and one item. About 1 RU for a 1 KB item, the cheapest thing Cosmos DB does.', 'ok'); }
      if (id === 'fanout') { appToParts([0, 1, 2, 3], C.red); ruLbl.set('🌊 Cross-partition query: ~48 RU'); hud('🌊 SELECT * FROM c WHERE c.topic = "refunds" has no tenantId, so it fans out to every partition. More RUs and more latency, and it grows with your data. Filter on the partition key.', 'bad'); }
      if (id === 'exclude') { idxLbl.set('📇 Excluded: /embedding/* · ⚖️ Session'); ruLbl.set('Same write after excluding /embedding/*: ~12 RU'); hud('✂️ Nobody filters on single numbers inside the embedding array, so indexing them was wasted RUs. Excluding the path cut the write cost. Vector search uses the separate vector index.', 'ok'); }
      if (id === 'strong') {
        idxLbl.set('📇 Excluded: /embedding/* · ⚖️ Strong');
        [0, 1].forEach((k) => packets.send(curve([8, 2, 0], [k ? 13 : 3, 4, -6], [k ? 16 : 0, 2, -11]), C.amber, 1, () => flash(repM[k], C.amber, C.azureLight)));
        ruLbl.set('Strong read: about 2× the RUs of Session');
        hud('🧱 Strong: every read sees the latest committed write, so reads check more replicas. Reads cost about twice the RUs and are slower. Session is enough for most apps: a user always sees their own writes.', 'info');
      }
      if (id === 'vsearch') {
        const ranked = vecs.map((x, k) => ({ k, d: x.s.position.distanceTo(query) })).sort((a, b) => a.d - b.d).slice(0, 3);
        ranked.forEach((r, n) => later(n * 0.4, () => {
          glow(vecs[r.k].m, C.green, 0.9);
          lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([query, vecs[r.k].s.position]), new THREE.LineBasicMaterial({ color: C.green })));
          hitAt[n].copy(vecs[r.k].s.position).add(v(0, 1.2, 0));
          const h = hits[n]; h.set(`${n + 1}. ${FAQ[r.k][0]} · ${(1 - r.d / 20).toFixed(2)}`); h.show(true);
        }));
        later(1.4, () => hud('🔍 SELECT TOP 3 c.question FROM c ORDER BY VectorDistance(c.embedding, @q). The diskANN index found the three closest FAQs by cosine distance without comparing against every item.', 'ok'));
      }
      if (id === 'insert') {
        newItem.visible = true;
        later(0.4, () => { log[5].visible = true; flash(logM, C.green, C.purple); });
        later(0.8, () => packets.send(curve([10, 1.5, -6], [18, 3, -6], [26, 2, -6]), C.green, 0.9, () => {
          leaseLbl.set('🔖 Lease: up to change 42'); flash(procM, C.green, C.amber);
          packets.send(curve([26, 2, -6], [29, 3, -6], [32, 2, -6]), C.purple, 0.6, () => packets.send(curve([32, 2, -6], [16, 6, -2], [0.5, 1.2, 1.4]), C.green, 1.1, () => hud('➕ New product saved → it appeared in the change feed → the processor embedded it and wrote the vector back. The lease now says “up to change 42”, so a restart won’t process it twice.', 'ok')));
        }));
      }
      if (id === 'delete') {
        items[1][2].visible = false;
        hud('🗑️ The item is gone, but the default (latest version) change feed doesn’t record deletes, so the processor never hears about it. Use a soft delete (isDeleted: true, then a TTL), or the all versions and deletes mode.', 'info');
      }
      if (id === 'seqscan') { pgLbl.set('🐢 scanning…'); sweep((r) => glow(r.m, C.amber, 0.8)); later(1.8, () => { pgLbl.set('🐢 Seq Scan on docs · 2,000,000 rows compared · ~1.9 s'); hud('🐢 No vector index, so PostgreSQL compares the query vector with every row. Exact, but far too slow for a chat app. EXPLAIN shows Seq Scan.', 'bad'); }); }
      if (id === 'hnsw') {
        rows.forEach((r) => glow(r.m, r.c, 0.1)); layers.visible = true; pgLbl.set('CREATE INDEX ON docs USING hnsw (embedding vector_cosine_ops)');
        packets.send(curve([45, 10, -2], [49, 7.5, 1], [52, 5, -1], [45, 0.8, -4]), C.green, 1.2, () => { [0, 3, 6].forEach((k) => glow(rows[k].m, C.green, 1)); pgLbl.set('⚡ Index Scan using docs_embedding_hnsw · ~15 ms'); hud('⚡ HNSW hops through a layered graph of neighbours: big jumps at the top, fine steps at the bottom. A few hundred comparisons instead of 2 million. It may miss the odd true neighbour (recall), so tune ef_search.', 'ok'); });
      }
      if (id === 'rag') rag(false);
      if (id === 'nofilter') rag(true);
      if (id === 'miss') {
        packets.send(curve([-28, 2, 18], [-21, 3, 18], [-14, 2, 18]), C.steel, 0.6, () => packets.send(curve([-14, 2, 18], [-6, 5, 10], [0.5, 1.5, 0]), C.azure, 1, () => packets.send(curve([0.5, 1.5, 0], [-12, 5, 12], [-28, 2, 18]), C.green, 1.1, () => {
          keyBox.visible = true; ttl = 300; flash(redisM, C.green, C.red);
          hud('❄️ Miss: Redis had nothing, so the app read Cosmos DB (~25 ms) and then SET price:sku-42 with a 300 s TTL. Watch the TTL count down (sped up here).', 'info');
        })));
      }
      if (id === 'hit') {
        if (ttl <= 0) { hud('Nothing cached yet: run the cache miss first.', 'info'); return; }
        packets.send(curve([-28, 2, 18], [-21, 3, 18], [-14, 2, 18]), C.green, 0.4, () => packets.send(curve([-14, 2, 18], [-21, 3, 18], [-28, 2, 18]), C.green, 0.4, () => { flash(redisM, C.green, C.red); hud('🔥 Hit: answered from memory in about 1 ms. The database didn’t even notice. That’s how a cache absorbs a busy product page.', 'ok'); }));
      }
      if (id === 'invalidate') {
        dbLbl.set('🌌 Cosmos DB: price ₹1,099 (updated)');
        packets.send(curve([0.5, 1.5, 0], [-6, 5, 10], [-14, 3, 18]), C.amber, 1, () => { keyBox.visible = false; ttl = 0; keyLbl.set('🧹 DEL price:sku-42'); flash(redisM, C.amber, C.red); hud('🧹 The price changed, so the app deleted the key. The next request misses and caches ₹1,099. Without this, shoppers would see the old price until the TTL ran out.', 'ok'); });
      }
    },
  };
}
