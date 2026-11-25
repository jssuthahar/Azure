import { THREE, C, v, mat, box, person, ground, plate, glow, Packets, after, type V3 } from '../kit';
import { stepLabels, type Ctx, type Ctl } from '../types';

type M = THREE.MeshStandardMaterial;
const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));

/** [key, label, color]: first node is the source, last node is the output board, the rest are tools. */
type N = [string, string, number];
interface A { p: string[]; bad?: boolean; out: string; hud: string }

/**
 * AI-103 Plan & Manage: eleven stations, one per lesson idea. Each station is
 * a small flow (source, tools, output board); the action buttons in SCENE
 * (src/data/ai-103/areas/plan) send a packet along a path and show whether
 * the gate let it through. Step order matches SCENE.
 */
const ST_NODES: N[][] = [
  [['in', '📨 Incoming jobs', 0], ['rs', '🧠 Reasoning model', C.purple], ['sm', '🏷️ Small language model', C.purple], ['cu', '🧾 Content Understanding', C.azure], ['tx', '📝 Text-only model', 0x8a99a8], ['out', '…', 0]],
  [['in', '🙋 Questions', 0], ['kb', '📚 Foundry IQ knowledge base', C.azure], ['fs', '📎 File search', C.azure], ['mem', '💾 Memory store', C.purple], ['out', '…', 0]],
  [['in', '🏢 Your app', 0], ['gl', '🌍 Global Standard', C.azure], ['dz', '🇪🇺 Data Zone Standard', C.azure], ['sa', '🗄️ Standard agent setup', C.green], ['bt', '📦 Batch', 0x8a99a8], ['out', '…', 0]],
  [['in', '👩‍💻 Developer', 0], ['dep', '🚢 Deployment: version, TPM, guardrail', C.azure], ['v2', '🤖 Agent v2', C.purple], ['v1', '🤖 Agent v1', 0x8a99a8], ['out', '…', 0]],
  [['in', '🔀 Pull request', 0], ['ev', '📏 Evaluation gate', C.amber], ['dev', '🧪 dev project', C.azure], ['prod', '🚀 prod project', C.green], ['out', '…', 0]],
  [['in', '📈 Traffic', 0], ['dep', '🚢 Deployment 100K TPM', C.azure], ['pro', '⚡ Provisioned (PTU)', C.green], ['std', '🌊 Standard spillover', C.azure], ['bud', '💰 Token budget', C.amber], ['out', '…', 0]],
  [['in', '👥 Live traffic', 0], ['mon', '📊 Monitor + App Insights', C.azure], ['ce', '🔎 Continuous evaluation', C.purple], ['ix', '🧱 Search indexer', C.amber], ['out', '…', 0]],
  [['in', '🧑‍💻 Caller', 0], ['ent', '🪪 Entra ID + Foundry User', C.green], ['pe', '🔒 Private endpoint', C.amber], ['fr', '🧠 Foundry resource', C.azure], ['out', '…', 0]],
  [['in', '👤 User, tools, web', 0], ['gi', '🛡️ Input guardrail', C.amber], ['gt', '🛡️ Tool call and response', C.amber], ['go', '🛡️ Output guardrail', C.amber], ['out', '…', 0]],
  [['in', '🧪 Test set', 0], ['evl', '📏 Evaluators', C.purple], ['rt', '🕵️ AI red teaming agent', C.red], ['tr', '🧵 Traces in App Insights', C.azure], ['out', '…', 0]],
  [['in', '🤖 Agent', 0], ['al', '✅ Allowed tools', C.green], ['ap', '🧑‍⚖️ Human approval', C.amber], ['eg', '🌐 Egress control', C.amber], ['out', '🏪 Order system', 0]],
];

const ACTS: Record<string, A>[] = [
  { reason: { p: ['in', 'rs', 'out'], out: 'Plan: 6 clauses checked, 2 risks flagged', hud: '✅ A reasoning model works through multistep problems. It costs more and runs slower, so keep it for jobs that need it.' },
    classify: { p: ['in', 'sm', 'out'], out: '10,000 labels · low cost', hud: '✅ A small language model is enough for high-volume, narrow jobs like labelling. Test it on your data before you commit.' },
    invoice: { p: ['in', 'cu', 'out'], out: 'vendor, total, due date as fields', hud: '✅ Content Understanding turns documents into structured fields. No prompt engineering needed.' },
    wrongfit: { p: ['in', 'tx'], bad: true, out: '400 · image input not supported', hud: '⛔ A text-only model can\'t read a photo. Check the model card for supported inputs before you deploy.' } },
  { kb: { p: ['in', 'kb', 'out'], out: 'Refunds within 30 days [policy.pdf, p2]', hud: '✅ A Foundry IQ knowledge base on Azure AI Search returns grounded passages the agent can cite.' },
    file: { p: ['in', 'fs', 'out'], out: 'Clause 7 of your uploaded contract says…', hud: '✅ File search answers from files the user uploads in a conversation, without building an index first.' },
    remember: { p: ['in', 'mem'], out: 'Saved: user is vegetarian', hud: '💾 Memory stores what the agent learns about this user. The profile memory is scoped per user and kept until its retention (TTL) ends.' },
    recall: { p: ['in', 'mem', 'out'], out: 'Welcome back! Veg options first.', hud: '✅ New session, same user scope: the agent recalls the preference without being told again.' } },
  { global: { p: ['in', 'gl', 'out'], out: 'Processed in any Azure region', hud: '🌍 Global Standard routes to wherever capacity is. Best throughput and price, but data may be processed outside your geography.' },
    datazone: { p: ['in', 'dz', 'out'], out: 'Processed inside the EU Data Zone', hud: '✅ Data Zone deployments keep processing within the EU or US zone. Choose them when residency matters.' },
    standard: { p: ['in', 'sa', 'out'], out: 'Threads, files, vectors in your own Cosmos DB, Storage, AI Search', hud: '✅ The standard agent setup keeps agent data in resources you own, so you control retention, encryption and networking.' },
    batch: { p: ['in', 'bt', 'out'], out: '50,000 summaries done within 24 hours', hud: '📦 Batch is cheaper for work that can wait. It isn\'t for interactive chat.' } },
  { autoupgrade: { p: ['in', 'dep', 'out'], out: 'Version follows your upgrade policy', hud: '⬆️ A deployment pins a model version. With auto-update on, it moves to the new default on a schedule, so pin a version when behaviour must not change.' },
    agentv2: { p: ['in', 'v2', 'out'], out: 'Endpoint now serves v2', hud: '✅ Every change to an agent creates a new version. You choose which version the endpoint serves.' },
    rollback: { p: ['in', 'v2', 'v1', 'out'], bad: true, out: 'Rolled back: endpoint serves v1 again', hud: '↩️ Because versions are kept, the fix is to point back at v1 while you repair v2.' } },
  { goodpr: { p: ['in', 'ev', 'dev', 'prod', 'out'], out: 'Eval passed → promoted to prod', hud: '✅ Pipeline signs in with workload identity federation (no secret), passes the evaluation gate, then promotes dev to prod.' },
    badpr: { p: ['in', 'ev'], bad: true, out: 'Groundedness 3.1 < 4.0 · release blocked', hud: '⛔ The evaluation gate stopped a prompt change that hurt groundedness before any user saw it.' } },
  { surge: { p: ['in', 'dep'], bad: true, out: '429 Too Many Requests · retry-after: 20', hud: '⛔ Traffic went past the deployment\'s tokens-per-minute slice, so the service answers HTTP 429 and says when to retry.' },
    retry: { p: ['in', 'dep', 'out'], out: 'Succeeded after backoff', hud: '✅ The client waits for retry-after, backs off exponentially, and retries. Spikes get absorbed.' },
    spill: { p: ['in', 'pro', 'std', 'out'], out: 'Overflow served by standard deployment', hud: '✅ Provisioned throughput gives steady latency. With spillover on, extra requests go to a standard deployment instead of failing.' },
    budget: { p: ['in', 'bud'], bad: true, out: 'Daily token budget reached · calls stopped', hud: '💰 A cost control on the project stops runaway spend. Pair it with alerts at 80% so nobody is surprised.' } },
  { drift: { p: ['in', 'ce'], bad: true, out: 'Groundedness fell from 4.6 to 3.4', hud: '📉 Continuous evaluation scores a sample of live answers. A drop after a content change is your drift signal.' },
    indexer: { p: ['in', 'ix'], bad: true, out: 'Indexer failed: 120 PDFs unreadable', hud: '🧱 Check indexer run history and failed-item counts. A silent ingestion failure leaves the agent answering from stale data.' },
    latency: { p: ['in', 'mon', 'out'], out: 'p95 search latency 1.9 s at peak', hud: '🐢 Metrics show latency and throttled queries. Add replicas for query load, partitions for storage.' } },
  { key: { p: ['in', 'fr'], bad: true, out: '403 · key authentication is disabled', hud: '⛔ Local (key) authentication is off, so an old key is useless.' },
    mi: { p: ['in', 'ent', 'fr', 'out'], out: 'Token accepted for Foundry User', hud: '✅ The app\'s managed identity gets an Entra token. No secret is stored anywhere.' },
    internet: { p: ['in', 'pe'], bad: true, out: '403 · public network access disabled', hud: '⛔ With public access disabled, a laptop on the internet never reaches the endpoint.' },
    private: { p: ['in', 'pe', 'fr', 'out'], out: 'Reached over the private endpoint', hud: '✅ Calls from inside the VNet reach the resource through its private endpoint.' } },
  { jailbreak: { p: ['in', 'gi'], bad: true, out: 'Jailbreak detected · blocked at input', hud: '🗡️ The input guardrail catches prompt attacks before the model sees them.' },
    xpia: { p: ['in', 'gi', 'gt'], bad: true, out: 'Indirect attack found in a tool response', hud: '🧪 Instructions hidden in a web page arrive in a tool response. The tool response intervention point inspects them.' },
    output: { p: ['in', 'gi', 'gt', 'go'], bad: true, out: 'Harmful completion blocked at output', hud: '🚫 The output intervention point checks what the model wrote before the user reads it.' },
    clean: { p: ['in', 'gi', 'gt', 'go', 'out'], out: 'Answer delivered with annotations', hud: '🙂 A normal request passes every intervention point.' } },
  { eval: { p: ['in', 'evl', 'out'], out: 'Groundedness 4.5 · relevance 4.7 · tool accuracy 0.94', hud: '✅ Evaluators score every row of the test set, including agent evaluators like tool call accuracy and task adherence.' },
    redteam: { p: ['in', 'rt', 'out'], out: '3 of 120 attacks succeeded · fix before launch', hud: '🕵️ The AI red teaming agent attacks your app the way an adversary would, and reports the attack success rate.' },
    trace: { p: ['in', 'tr', 'out'], out: 'Refund approved by j.rao at 10:42 · trace 8f3c', hud: '✅ Traces record each model call, tool call and approval, so an auditor can replay the reason.' } },
  { read: { p: ['in', 'al', 'out'], out: 'Order 48213: shipped', hud: '✅ Read-only lookups sit on the allowed list, so no approval is needed.' },
    refund: { p: ['in', 'ap', 'out'], out: 'Refund INR 2,400 approved by a human', hud: '⏸️ Risky tools pause for a human approval, then continue only if approved.' },
    deny: { p: ['in', 'ap'], bad: true, out: 'Reviewer rejected · nothing happened', hud: '🙅 A rejected approval ends the action. The agent explains and moves on.' },
    blocked: { p: ['in', 'al'], bad: true, out: 'delete_customer isn\'t an allowed tool', hud: '🗑️ A tool that isn\'t on the allowed list can\'t be called at all. Least privilege for agents.' },
    egress: { p: ['in', 'eg'], bad: true, out: 'Blocked: unknown host', hud: '🌐 Network egress controls limit which sites a hosted agent can reach.' } },
];

export function agentplan({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 190, 0xdde6ef);
  const packets = new Packets(stage, 0.4);
  const later = after(stage);
  const solid = (c: number, e = 0.25) => mat(c, { emissive: c, emissiveIntensity: e });
  const flash = (m: M, c: number, base: number, sec = 1) => { glow(m, c, 1); later(sec, () => glow(m, base, 0.25)); };
  const L = stepLabels(stage);

  const COL = [-54, -18, 18, 54];
  const ROW = [-42, 0, 42];
  const PLATES = [0xe3ecf7, 0xeee8f8, 0xe2f0e4, 0xf7ece0, 0xe0eef2, 0xe9e4f5, 0xf0e8e8, 0xe6eef7, 0xf2ece0, 0xe4efe9, 0xece6f4];
  const hi = (p: V3, y = 1.6): V3 => [p[0], y, p[2]];
  const path = (a: V3, b: V3) => curve(hi(a), [(a[0] + b[0]) / 2, 4, (a[2] + b[2]) / 2], hi(b));

  interface Node { pos: V3; m: M | null; base: number; out?: { set(t: string): void } }
  const nodes: Record<string, Node>[] = [];
  const outs: M[] = [];
  const centre: [number, number][] = [];

  ST_NODES.forEach((list, k) => {
    const cx = COL[k % 4], cz = ROW[Math.floor(k / 4)];
    centre.push([cx, cz]);
    S.add(plate(32, 20, PLATES[k], [cx, 0, cz]));
    const tools = list.slice(1, -1);
    const map: Record<string, Node> = {};
    list.forEach(([key, label, color], j) => {
      let pos: V3, m: M | null = null, dy = 3.8;
      if (j === 0) { pos = [cx - 11, 0.1, cz]; S.add(person(C.azure, pos, 1.7)); dy = 4.2; }
      else if (j === list.length - 1) { pos = [cx + 11, 0.8, cz]; m = solid(0x1b1a19, 0.15); m.emissive.setHex(0x223355); S.add(box(5, 3.2, 0.4, m, pos)); outs.push(m); dy = 3.2; }
      else { const n = tools.length; pos = [cx - 1, 0.1, cz + (n === 1 ? 0 : -8 + (16 * (j - 1)) / (n - 1))]; m = solid(color, 0.3); S.add(box(4, 3, 3.4, m, pos)); }
      const lab = L.add(label, [pos[0], pos[1] + dy, pos[2]], [k], j > 0 && j < list.length - 1 ? 'd3-label-strong' : '');
      map[key] = { pos, m, base: color, out: j === list.length - 1 ? lab : undefined };
    });
    nodes.push(map);
  });

  const bad = (m: M) => flash(m, C.red, 0x1b1a19, 1.4);
  const ok = (m: M) => flash(m, C.green, 0x1b1a19, 1.4);

  let step = 0;
  const run = (k: number, a: A) => {
    const N = nodes[k];
    const walk = (i: number) => {
      if (i >= a.p.length - 1) {
        const last = N[a.p[a.p.length - 1]];
        if (a.bad) { if (last.m) flash(last.m, C.red, last.base, 1.6); const o = N.out; if (o.m) bad(o.m); }
        else { const o = N.out; if (o.m) ok(o.m); }
        N.out.out?.set(a.out);
        hud(a.hud, a.bad ? 'bad' : 'ok');
        return;
      }
      const from = N[a.p[i]], to = N[a.p[i + 1]];
      packets.send(path(from.pos, to.pos), a.bad && i === a.p.length - 2 ? C.red : C.azure, 0.8, () => {
        if (to.m && i + 1 < a.p.length - 1) flash(to.m, C.amber, to.base, 0.7);
        later(0.15, () => walk(i + 1));
      });
    };
    walk(0);
  };

  return {
    go(i) {
      step = i;
      later.cancelAll();
      packets.clear();
      hud('');
      L.show(i);
      cost(0, 'month', '');
      nodes.forEach((N) => { Object.values(N).forEach((n) => { if (n.m && n.base) glow(n.m, n.base, 0.25); n.out?.set('…'); }); });
      outs.forEach((m) => glow(m, 0x223355, 0.4));
      const [cx, cz] = centre[i];
      stage.fly([cx, 20, cz + 28], [cx, 1, cz]);
    },
    act(id) {
      const a = ACTS[step]?.[id];
      if (!a) return;
      later.cancelAll(); packets.clear(); run(step, a);
    },
  };
}
