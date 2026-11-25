import { THREE, C, v, mat, box, cyl, person, ground, plate, glow, Packets, after, type V3 } from '../kit';
import { stepLabels, type Ctx, type Ctl } from '../types';

const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));
type M = THREE.MeshStandardMaterial;

/**
 * AI-103 Information Extraction: five stations, one per lesson.
 *  0 ingest and index: files -> indexer (OCR, split, embed) -> chunks in an index
 *  1 query types: keyword, vector, hybrid (RRF) and the semantic ranker
 *  2 enrichment skills: built-in, custom Web API and Content Understanding skills
 *  3 agents: a Foundry agent calling a knowledge base (identity, effort, citations)
 *  4 Content Understanding: analyzer -> Markdown + fields with confidence
 * Step order matches SCENE in src/data/ai-103/areas/extract/scene.ts.
 */
export function agentextract({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 170, 0xdde6ef);
  const packets = new Packets(stage, 0.4);
  const later = after(stage);
  const solid = (c: number, e = 0.25) => mat(c, { emissive: c, emissiveIntensity: e });
  const flash = (m: M, c: number, base: number, sec = 1) => { glow(m, c, 1); later(sec, () => glow(m, base, 0.25)); };

  // Station centres: top row steps 0-2, bottom row steps 3-4.
  const ST: [number, number][] = [[-42, -20], [0, -20], [42, -20], [-21, 22], [21, 22]];
  const PLATES = [0xe3ecf7, 0xeee8f8, 0xe2f0e4, 0xf7ece0, 0xe0eef2];
  ST.forEach(([x, z], k) => S.add(plate(34, 20, PLATES[k], [x, 0, z])));
  const at = (k: number, dx: number, dz: number, y = 0.1): V3 => [ST[k][0] + dx, y, ST[k][1] + dz];
  const hi = (p: V3, y = 1.6): V3 => [p[0], y, p[2]];
  const mid = (a: V3, b: V3, lift = 4): V3 => [(a[0] + b[0]) / 2, lift, (a[2] + b[2]) / 2];
  const path = (a: V3, b: V3, lift = 4) => curve(hi(a), mid(a, b, lift), hi(b));

  /* ---------- builders ---------- */
  const doc = (p: V3, c = 0xffffff) => { const m = solid(c, 0.08); S.add(box(2.2, 3, 0.4, m, p)); return m; };
  const tool = (p: V3, c: number, w = 4, d = 3.4) => { const m = solid(c, 0.3); S.add(box(w, 3, d, m, p)); return m; };
  const board = (p: V3, w = 5) => { const m = solid(0x1b1a19, 0.15); m.emissive.setHex(0x223355); S.add(box(w, 3.2, 0.4, m, p)); return m; };
  const bot = (p: V3) => { const m = solid(C.purple, 0.4); const g = new THREE.Group(); g.add(cyl(1.1, 2.2, m, [0, 0, 0])); const head = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), m); head.position.y = 3.1; g.add(head); g.position.set(...p); S.add(g); return m; };
  const stack = (p: V3, c: number) => { const ms: M[] = []; for (let k = 0; k < 4; k++) { const m = solid(c, 0.2); S.add(box(4, 0.8, 4, m, [p[0], 0.5 + k * 0.95, p[2]])); ms.push(m); } return ms; };

  // 0 - ingest: three files -> indexer (OCR on the side) -> index (stack of chunks)
  const p0 = { in: at(0, -13, 0), ixr: at(0, -2, 0), ocr: at(0, -2, -6.5), idx: at(0, 10, 0) };
  const files0 = [-3.2, 0, 3.2].map((dz, k) => doc([p0.in[0], 0.1, p0.in[2] + dz], k === 1 ? 0xf3e2b8 : 0xffffff));
  const ixr0 = tool(p0.ixr, C.azure, 5, 4); const ocr0 = tool(p0.ocr, 0x2f8f9d, 3.4, 2.6);
  const idx0 = stack(p0.idx, C.green);
  // 1 - search: question -> keyword + vector -> RRF -> semantic ranker -> results
  const p1 = { q: at(1, -14, 0), kw: at(1, -6, -6), vec: at(1, -6, 6), rrf: at(1, 1, 0), sem: at(1, 7, 0), out: at(1, 13, 0, 0.8) };
  S.add(person(C.azure, p1.q, 1.6));
  const kw1 = tool(p1.kw, 0x0063b1, 4.4, 3); const vec1 = tool(p1.vec, C.purple, 4.4, 3);
  const rrf1 = tool(p1.rrf, C.amber, 3, 3); const sem1 = tool(p1.sem, C.green, 3, 3.4);
  const out1 = board(p1.out, 4);
  // 2 - enrichment: doc -> OCR -> PII -> custom Web API -> index; Content Understanding on the side
  const p2 = { in: at(2, -14, 0), s: [at(2, -8, 0), at(2, -2, 0), at(2, 4, 0)], cu: at(2, -2, 7), out: at(2, 12, 0, 0.8) };
  doc(p2.in);
  const sk2 = [0x2f8f9d, 0x2f8f9d, C.amber].map((c, k) => tool(p2.s[k], c, 3.6, 3));
  const cu2 = tool(p2.cu, C.purple, 5, 2.8);
  const out2 = board(p2.out, 4.6);
  // 3 - agent + knowledge base: agent -> role gate -> knowledge base -> two knowledge sources
  const p3 = { bot: at(3, -13, 0), gate: at(3, -7, 0), kb: at(3, -1, 0), src: [at(3, 9, -5), at(3, 9, 5)], out: at(3, -13, 8, 0.8) };
  const bot3 = bot(at(3, -13, 0, 1.2));
  const gateM = mat(C.amber, { emissive: C.amber, emissiveIntensity: 0.3, transparent: true, opacity: 0.55 });
  S.add(box(0.6, 5, 7, gateM, p3.gate));
  const kb3 = tool(p3.kb, C.azure, 4.4, 5);
  const src3 = p3.src.map((p) => tool(p, C.green, 4, 3));
  const out3 = board(p3.out, 7);
  // 4 - Content Understanding: claim form -> analyzer -> Markdown + fields; a person reviews low confidence
  const p4 = { in: at(4, -14, 0), an: at(4, -4, 0), md: at(4, 8, -6.5, 0.8), fl: at(4, 8, 0, 0.8), hu: at(4, 10, 7) };
  doc(p4.in); doc([p4.in[0] + 0.1, 0.1, p4.in[2] + 3.2], 0xf3e2b8);
  const an4 = tool(p4.an, C.purple, 5, 4);
  const md4 = board(p4.md, 6); const fl4 = board(p4.fl, 6);
  S.add(person(C.green, p4.hu, 1.5));

  /* ---------- labels ---------- */
  const L = stepLabels(stage);
  const lb = (k: number, text: string, p: V3, dy = 3.6, strong = false) => L.add(text, [p[0], p[1] + dy, p[2]], [k], strong ? 'd3-label-strong' : '');
  lb(0, '📁 policy-docs: 2 PDFs + a scan', p0.in, 4.4); lb(0, '⚙️ Indexer + skillset', p0.ixr, 3.8, true); lb(0, '🔎 OCR skill', p0.ocr, 3.4); lb(0, '🗂️ Index: one document per chunk', [p0.idx[0], 0, p0.idx[2]], 6);
  const out0 = lb(0, '', [p0.idx[0], 0, p0.idx[2] + 4.5], 0.8);
  lb(1, '🙋 “Can I get my cab money back?”', p1.q, 4); lb(1, '🔤 Keyword (BM25)', p1.kw, 3.6, true); lb(1, '🧭 Vector (HNSW)', p1.vec, 3.6, true); lb(1, '🔀 RRF merge', p1.rrf, 3.6); lb(1, '🏅 Semantic ranker (top 50)', p1.sem, 3.8, true);
  const out1L = lb(1, 'Pick a query', p1.out, 3.2);
  lb(2, '📄 Raw document', p2.in, 4.2); lb(2, '🔎 OCR', p2.s[0], 3.6); lb(2, '🔏 PII detection', p2.s[1], 3.6); lb(2, '🧩 Web API (custom)', p2.s[2], 3.6, true); lb(2, '📐 Content Understanding skill', p2.cu, 3.4, true);
  const out2L = lb(2, '…', p2.out, 3.2);
  lb(3, '🤖 Agent', at(3, -13, 0), 5.6); lb(3, '🔐 Project identity + role', p3.gate, 5.6); lb(3, '📚 Knowledge base', p3.kb, 4.6, true); lb(3, '🗂️ Index source', p3.src[0], 3.6); lb(3, '🌐 SharePoint source', p3.src[1], 3.6);
  const out3L = lb(3, '…', p3.out, 3);
  lb(4, '🧾 Claim form (PDF + photo)', p4.in, 4.4); lb(4, '🧠 Custom analyzer', p4.an, 3.8, true); lb(4, '👩‍💼 Reviewer', p4.hu, 3.6);
  const mdL = lb(4, '…', p4.md, 3); const flL = lb(4, '…', p4.fl, 3);

  /* ---------- state ---------- */
  const BASE = new Map<M, number>([[ixr0, C.azure], [ocr0, 0x2f8f9d], [kw1, 0x0063b1], [vec1, C.purple], [rrf1, C.amber], [sem1, C.green], [cu2, C.purple], [kb3, C.azure], [an4, C.purple]]);
  sk2.forEach((m, k) => BASE.set(m, k === 2 ? C.amber : 0x2f8f9d));
  src3.forEach((m) => BASE.set(m, C.green));
  const pulse = (m: M, c = C.amber) => flash(m, c, BASE.get(m) ?? C.azure, 0.8);
  const ok = (m: M) => flash(m, C.green, 0x1b1a19, 1.4);
  const bad = (m: M) => flash(m, C.red, 0x1b1a19, 1.4);
  const fill = (n: number) => idx0.forEach((m, k) => glow(m, k < n ? C.green : 0x8a99a8, k < n ? 0.5 : 0.1));
  const hop = (a: V3, tl: V3, b: V3 | null, color: number, toolM: M | null, done: () => void) => {
    packets.send(path(a, tl), C.azure, 0.9, () => {
      if (toolM) pulse(toolM);
      if (!b) { done(); return; }
      later(0.3, () => packets.send(path(tl, b), color, 0.9, done));
    });
  };
  void files0;

  return {
    go(i) {
      later.cancelAll();
      packets.clear();
      hud('');
      L.show(i);
      out0.set(''); out1L.set('Pick a query'); out2L.set('…'); out3L.set('…'); mdL.set('…'); flL.set('…');
      fill(0);
      BASE.forEach((c, m) => glow(m, c, 0.25));
      [out1, out2, out3, md4, fl4].forEach((m) => glow(m, 0x223355, 0.4));
      glow(gateM, C.amber, 0.3);
      cost(i === 3 ? 5 : 0, 'month', i === 3 ? 'Illustrative: agentic retrieval at low effort adds model tokens for query planning on top of the search service' : '');
      const [cx, cz] = ST[i];
      stage.fly([cx, 18, cz + 26], [cx, 1, cz]);
      if (i === 0) hud('An indexer reads the files, a skillset cracks, splits and embeds them, and each chunk lands in the index as its own search document.', 'info');
      if (i === 1) hud('Same question, four ways to run it. Watch which one finds the “taxi” document when the user typed “cab”.', 'info');
    },
    act(id) {
      // 0 - ingest and index
      if (id === 'run') hop(p0.in, p0.ixr, p0.idx, C.green, ixr0, () => { fill(3); out0.set('7 chunks from 4 PDFs · text_vector filled'); hud('✅ The indexer cracked the PDFs, split them into chunks, called the embedding model and wrote one search document per chunk. Citations can point to the exact chunk.', 'ok'); });
      if (id === 'scan') hop(p0.in, p0.ixr, p0.idx, C.amber, ixr0, () => { fill(1); out0.set('scanned-claim-form.jpg → 0 chunks ⚠️'); hud('⚠️ A scanned image holds pixels, not text. With no OCR skill (and imageAction not set to generateNormalizedImages) the indexer finds nothing to chunk, so the form is never searchable.', 'bad'); });
      if (id === 'ocr') { packets.send(path(p0.in, p0.ocr), C.azure, 0.8, () => { pulse(ocr0, C.green); later(0.3, () => hop(p0.ocr, p0.ixr, p0.idx, C.green, ixr0, () => { fill(4); out0.set('+ scanned form → 1 chunk (OCR text)'); hud('✅ imageAction = generateNormalizedImages hands the images to the OCR skill. Its text is merged back into the content, split and embedded like any other chunk.', 'ok'); })); }); }
      if (id === 'changed') hop(p0.in, p0.ixr, p0.idx, C.azure, ixr0, () => { fill(3); out0.set('1 blob changed → 1 document re-indexed'); hud('♻️ Blob change detection is automatic: on the next run the indexer reads only the file that changed. To reprocess everything after a skillset change, reset the indexer first.', 'info'); });
      // 1 - query types
      const q = (m: M, t: string, good: boolean, note: string) => packets.send(path(p1.q, m === kw1 ? p1.kw : m === vec1 ? p1.vec : p1.rrf), C.azure, 0.8, () => { pulse(m, good ? C.green : C.red); packets.send(path(m === kw1 ? p1.kw : m === vec1 ? p1.vec : p1.rrf, p1.out, 5), good ? C.green : C.amber, 0.9, () => { (good ? ok : bad)(out1); out1L.set(t); hud(note, good ? 'ok' : 'bad'); }); });
      if (id === 'keyword') q(kw1, '0 results ⚠️ (the policy says “taxi”)', false, '⚠️ BM25 matches the words you typed. None of “cab”, “money” or “back” appears in the policy, which says “taxi” and “reimbursed”, so the search returns nothing useful.');
      if (id === 'vector') q(vec1, 'Travel policy: taxi fares ✅', true, '✅ The question became a vector and sat next to the taxi paragraph in meaning, even with no shared word. Vector search finds meaning but can be weak on exact codes.');
      if (id === 'code') q(kw1, 'Expense codes: E-1074 ✅ (exact match)', true, '✅ For an exact token such as an error code, the keyword path wins. This is why hybrid beats either one on its own.');
      if (id === 'hybrid') { packets.send(path(p1.q, p1.kw), C.azure, 0.8, () => pulse(kw1)); packets.send(path(p1.q, p1.vec), C.azure, 0.8, () => { pulse(vec1); later(0.3, () => { packets.send(path(p1.kw, p1.rrf, 3), C.azure, 0.7, () => { }); packets.send(path(p1.vec, p1.rrf, 3), C.purple, 0.7, () => { pulse(rrf1, C.green); packets.send(path(p1.rrf, p1.out, 5), C.green, 0.9, () => { ok(out1); out1L.set('1 Travel policy · 2 Expense codes · 3 Hotels'); hud('✅ Keyword and vector queries run in parallel and Reciprocal Rank Fusion merges them into one list. A document that ranks well in both rises to the top.', 'ok'); }); }); }); }); }
      if (id === 'semantic') { packets.send(path(p1.q, p1.rrf), C.azure, 0.8, () => { pulse(rrf1); later(0.3, () => packets.send(path(p1.rrf, p1.sem), C.azure, 0.7, () => { pulse(sem1, C.green); packets.send(path(p1.sem, p1.out, 5), C.green, 0.9, () => { ok(out1); out1L.set('1 Travel policy (score 3.4) + caption'); hud('🏅 The semantic ranker re-reads the top 50 results with a language model and reorders them. It adds captions and can return answers, but it cannot find anything the first pass missed.', 'ok'); }); })); }); }
      // 2 - enrichment
      const chain = (upTo: number, color: number, text: string, note: string, kind: 'ok' | 'bad' | 'info') => {
        const go = (k: number) => {
          if (k > upTo) { packets.send(path(p2.s[upTo], p2.out), color, 0.8, () => { (kind === 'bad' ? bad : ok)(out2); out2L.set(text); hud(note, kind); }); return; }
          packets.send(path(k === 0 ? p2.in : p2.s[k - 1], p2.s[k]), C.azure, 0.6, () => { pulse(sk2[k]); go(k + 1); });
        };
        go(0);
      };
      if (id === 'ocr2') chain(0, C.green, 'content ← text from the image', '✅ The OCR skill reads text out of images and scanned pages. Its output goes into a field in the enrichment tree, and an output field mapping sends it to the index.', 'ok');
      if (id === 'pii') chain(1, C.green, 'maskedText: “Call me on ***********”', '✅ The PII Detection skill finds personal data and returns a masked copy. Map the masked field into the index, not the original, if the raw text must never be searchable.', 'ok');
      if (id === 'custom') chain(2, C.green, 'productCode: “WM-2210” (from your own API)', '🧩 A Web API skill POSTs a batch of records to your endpoint (often an Azure Function) and expects the same shape back. Use it for logic no built-in skill has.', 'ok');
      if (id === 'cu') packets.send(path(p2.in, p2.cu, 3), C.azure, 0.9, () => { pulse(cu2, C.green); packets.send(path(p2.cu, p2.out, 5), C.green, 0.9, () => { ok(out2); out2L.set('Markdown chunks that keep tables and headings'); hud('📐 The Content Understanding skill parses layout (tables, sections, figures) and chunks along those boundaries, so a table row is not cut in half. It needs a Foundry resource and model deployments.', 'ok'); }); });
      if (id === 'unmapped') chain(1, C.amber, 'maskedText missing in the index ⚠️', '⚠️ The skill ran, but nothing mapped its output to an index field, so the enrichment is thrown away. Add an output field mapping (or an index projection).', 'bad');
      // 3 - agent + knowledge base
      const ask = (good: boolean, text: string, note: string, kind: 'ok' | 'bad' | 'info', block = false, both = false) => {
        packets.send(path(p3.bot, p3.gate, 3), C.azure, 0.7, () => {
          if (block) { flash(gateM, C.red, C.amber); bad(out3); out3L.set(text); hud(note, 'bad'); return; }
          flash(gateM, C.green, C.amber);
          packets.send(path(p3.gate, p3.kb, 3), C.azure, 0.6, () => { pulse(kb3);
            const targets = both ? [0, 1] : [0];
            targets.forEach((t) => later(t * 0.15, () => packets.send(path(p3.kb, p3.src[t], 3), C.azure, 0.6, () => { pulse(src3[t], good ? C.green : C.amber); })));
            later(1, () => packets.send(path(p3.kb, p3.out, 6), good ? C.green : C.amber, 0.9, () => { (good ? ok : bad)(out3); out3L.set(text); hud(note, kind); }));
          });
        });
      };
      void bot3;
      if (id === 'ask') ask(true, '“Taxi fares are reimbursed with a receipt” 【travel-policy.pdf】', '✅ The agent called the knowledge base tool, got extractive passages with references, and answered with a citation. The project’s managed identity made the call.', 'ok');
      if (id === 'unknown') ask(false, '“I don’t know. It isn’t in the knowledge base.”', '🙈 Nothing relevant came back, and the instructions told the agent to say so instead of guessing. That grounding instruction is part of the design.', 'info');
      if (id === 'norole') ask(false, '403 Forbidden: no Search Index Data Reader', '⛔ The agent’s identity is not allowed to read the index. Give the project’s managed identity the Search Index Data Reader role on the search service.', 'bad', true);
      if (id === 'multi') ask(true, '2 subqueries (taxi + hotel) run in parallel, merged, cited', '🧠 At low or medium effort a model splits a multi-part question into subqueries, runs them in parallel across the sources and merges the results. Minimal effort skips that planning step and is cheaper and faster.', 'ok', false, true);
      // 4 - Content Understanding
      if (id === 'markdown') hop(p4.in, p4.an, p4.md, C.green, an4, () => { ok(md4); mdL.set('# Claim Form · table kept · “Photo 1: flooded kitchen floor”'); hud('✅ Layout analysis keeps headings and tables as Markdown and describes the photo. That clean text is what a search index or an agent should read, not raw OCR.', 'ok'); });
      if (id === 'fields') hop(p4.in, p4.an, p4.fl, C.green, an4, () => { ok(fl4); flL.set('ClaimNumber CLM-2026-08812 · 0.98 (page 1)'); hud('✅ A field schema returns typed values with a confidence score and a source location, so every number can be traced back to the page.', 'ok'); });
      if (id === 'lowconf') hop(p4.in, p4.an, p4.fl, C.amber, an4, () => { bad(fl4); flL.set('PolicyNumber HP-77310-K · 0.61 ⚠️ handwritten'); hud('⚠️ The handwritten policy number came back at 0.61. Route low-confidence fields to a person instead of trusting them. That is the point of confidence scores.', 'bad'); packets.send(path(p4.fl, p4.hu, 3), C.amber, 0.9, () => { }); });
      if (id === 'generate') hop(p4.in, p4.an, p4.fl, C.purple, an4, () => { ok(fl4); flL.set('Summary: “Water damage claim, 78,500 INR” (generated)'); hud('✨ A field with method generate lets the model write a value, such as a summary. Use extract for text that is on the page, classify for a fixed list of labels, generate for everything else.', 'ok'); });
    },
  };
}
