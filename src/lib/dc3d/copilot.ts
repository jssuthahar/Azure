import { THREE, C, v, mat, box, cyl, person, ground, plate, glow, Packets, after } from './kit';
import { stepLabels, type Ctx, type Ctl, type Tone } from './types';

/**
 * GH-300 3D scenes, all built from one data-driven "flow": blocks on a board,
 * packets travelling along a path of blocks, and a block that can stop a
 * packet (a content exclusion, a filter, a policy, a denied tool).
 * Narration lives in src/data/gh-300/sims3d.ts; action ids must match.
 */
interface FNode { id: string; label: string; x: number; z: number; col: number; w?: number; h?: number; who?: boolean }
interface FAct { path: string[]; col?: number; stop?: string; msg: string; tone?: Tone; out?: [string, string] }
interface Flow {
  ground: number;
  nodes: FNode[];
  /** Per step: blocks to light up (others dim) and the camera height factor. */
  focus: string[][];
  /** Per step: a short note pinned above a block. */
  notes?: ([string, string] | null)[];
  /** Per step: an action to play when the step opens. */
  auto?: (string | null)[];
  acts: Record<string, FAct>;
}

function flow(cfg: Flow) {
  return function build({ stage, hud, cost }: Ctx): Ctl {
    const S = stage.scene;
    ground(stage, 170, cfg.ground);
    const packets = new Packets(stage, 0.42);
    const later = after(stage);
    S.add(plate(78, 46, 0xeef2f6, [0, 0, 0]));
    const at = new Map<string, THREE.Vector3>();
    const mats = new Map<string, THREE.MeshStandardMaterial>();
    for (const n of cfg.nodes) {
      const p = v(n.x, 0.1, n.z);
      at.set(n.id, p);
      const m = mat(n.col, { emissive: n.col, emissiveIntensity: 0.2 });
      mats.set(n.id, m);
      if (n.who) S.add(person(n.col, [n.x, 0.1, n.z], 1.8));
      else S.add(box(n.w ?? 5, n.h ?? 3.2, n.w ?? 5, m, [n.x, 0.1, n.z]), cyl((n.w ?? 5) * 0.62, 0.3, mat(0x46546a), [n.x, 0.05, n.z], 24));
    }
    const L = stepLabels(stage);
    const outs = new Map<string, ReturnType<typeof L.add>>();
    for (const n of cfg.nodes) {
      L.add(n.label, [n.x, (n.h ?? 3.2) + 2.4, n.z], 'all', 'd3-label-strong');
      outs.set(n.id, L.add('', [n.x, (n.h ?? 3.2) + 0.9, n.z], 'all'));
    }
    const notes = (cfg.notes ?? []).map((nt, i) => (nt ? L.add(nt[1], [at.get(nt[0])!.x, 9.5, at.get(nt[0])!.z], [i]) : null));
    void notes;
    const reset = () => outs.forEach((o) => o.set(''));
    const seg = (a: THREE.Vector3, b: THREE.Vector3) => new THREE.CatmullRomCurve3([v(a.x, 1.6, a.z), v((a.x + b.x) / 2, 4.2, (a.z + b.z) / 2), v(b.x, 1.6, b.z)]);

    const run = (id: string) => {
      const a = cfg.acts[id];
      if (!a) return;
      reset();
      const stopAt = a.stop ? a.path.indexOf(a.stop) : -1;
      const hops = a.path.length - 1;
      const go = (k: number) => {
        if (k >= hops || (stopAt >= 0 && k >= stopAt)) {
          const end = stopAt >= 0 ? a.stop! : a.path[a.path.length - 1];
          glow(mats.get(end) ?? [], stopAt >= 0 ? C.red : C.green, 0.9);
          later(0.9, () => glow(mats.get(end) ?? [], cfg.nodes.find((n) => n.id === end)!.col, 0.3));
          if (a.out) outs.get(a.out[0])?.set(a.out[1]);
          hud(a.msg, a.tone ?? (stopAt >= 0 ? 'bad' : 'ok'));
          return;
        }
        const from = at.get(a.path[k])!, to = at.get(a.path[k + 1])!;
        packets.send(seg(from, to), a.col ?? C.azure, 1, () => { glow(mats.get(a.path[k + 1]) ?? [], C.amber, 0.7); go(k + 1); });
      };
      go(0);
    };

    return {
      go(i) {
        later.cancelAll();
        packets.clear();
        hud('');
        reset();
        L.show(i);
        cost(0, 'month', '');
        const f = cfg.focus[i] ?? [];
        for (const n of cfg.nodes) glow(mats.get(n.id) ?? [], n.col, !f.length || f.includes(n.id) ? 0.4 : 0.04);
        const pts = (f.length ? f : cfg.nodes.map((n) => n.id)).map((id) => at.get(id)!);
        const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        const cz = pts.reduce((s, p) => s + p.z, 0) / pts.length;
        const spread = Math.max(14, ...pts.map((p) => Math.hypot(p.x - cx, p.z - cz)));
        stage.fly([cx, 12 + spread * 0.9, cz + 16 + spread * 1.1], [cx, 1, cz]);
        const auto = cfg.auto?.[i];
        if (auto) later(0.8, () => run(auto));
      },
      act: run,
    };
  };
}

/* ------------------------------------------------------------------ */
/* 1. From keystroke to suggestion (data flow, filters, lifecycle)     */
/* ------------------------------------------------------------------ */
export const copilotflow = flow({
  ground: 0xdfe6ef,
  nodes: [
    { id: 'dev', label: '👩‍💻 You, typing', x: -32, z: 8, col: C.azure, who: true },
    { id: 'ide', label: '🧩 IDE + Copilot extension', x: -22, z: 0, col: C.azure },
    { id: 'excl', label: '🚫 Content exclusion check', x: -11, z: -10, col: 0x5c2d91 },
    { id: 'proxy', label: '🛡️ Copilot proxy (pre-filters)', x: 1, z: 0, col: 0x24292f },
    { id: 'llm', label: '🧠 Large language model', x: 14, z: -10, col: 0x8764b8 },
    { id: 'post', label: '🧹 Post-processing filters', x: 25, z: 0, col: 0x008575 },
    { id: 'out', label: '💡 Ghost text in your editor', x: 14, z: 12, col: C.green },
  ],
  focus: [['dev', 'ide'], ['ide'], ['ide', 'excl'], ['proxy'], ['llm'], ['post'], ['out', 'dev'], ['ide', 'proxy', 'llm']],
  auto: ['keystroke', 'context', null, 'normal', null, null, 'accept', null],
  acts: {
    keystroke: { path: ['dev', 'ide'], msg: '⌨️ You type `function cartTotal(items) {` and pause. The extension notices the pause and starts a request.', out: ['ide', 'cursor + file + open tabs'] },
    context: { path: ['ide', 'ide'], msg: '📚 The extension gathers context: code before and after the cursor, the file name and language, and snippets from other open tabs. That becomes the prompt.', tone: 'info', out: ['ide', 'prompt built'] },
    excluded: { path: ['ide', 'excl', 'proxy'], stop: 'excl', msg: '🚫 `config/secrets.js` matches a content exclusion. Copilot won’t use it as context and gives no suggestions inside it.', out: ['excl', 'blocked'] },
    allowed: { path: ['ide', 'excl', 'proxy'], msg: '✅ `src/cart.js` is not excluded, so its code can be part of the prompt.', out: ['excl', 'ok'] },
    normal: { path: ['ide', 'proxy', 'llm'], msg: '🛡️ The prompt travels over HTTPS to the Copilot proxy, which checks the request (for example for harmful content or prompt injection) before passing it to the model.', out: ['proxy', 'checked'] },
    toxic: { path: ['ide', 'proxy', 'llm'], stop: 'proxy', msg: '⛔ A request with offensive or harmful content is filtered at the proxy and never reaches the model.', out: ['proxy', 'filtered'] },
    generate: { path: ['proxy', 'llm', 'post'], col: 0x8764b8, msg: '🧠 The model predicts the most likely next tokens. It is matching patterns, not running or understanding your code, so the output still needs checking.', out: ['llm', 'candidate code'] },
    publicmatch: { path: ['llm', 'post', 'out'], stop: 'post', msg: '🔁 This suggestion matches public code on GitHub (about 150 characters). With the policy set to **Block**, it’s dropped. With **Allow**, you’d see it plus a code reference with the licence.', out: ['post', 'matched public code'] },
    clean: { path: ['llm', 'post', 'out'], col: C.green, msg: '🧹 Post-processing checks quality and filters insecure patterns and offensive text, then sends the suggestion back.', out: ['post', 'passed'] },
    accept: { path: ['post', 'out', 'dev'], col: C.green, msg: '💡 The suggestion appears as grey ghost text. **Tab** accepts it, **Esc** dismisses it, **Alt+]** shows the next one. Accept or reject, the decision is yours.', out: ['out', 'Tab to accept'] },
    reject: { path: ['out', 'dev'], col: C.red, msg: '✋ You press Esc. Nothing is inserted. Accept and reject counts feed usage metrics, not your code.', tone: 'info', out: ['out', 'dismissed'] },
  },
});

/* ------------------------------------------------------------------ */
/* 2. Prompt crafting: context in, quality out                         */
/* ------------------------------------------------------------------ */
export const copilotcontext = flow({
  ground: 0xe6e3ef,
  nodes: [
    { id: 'you', label: '👩‍💻 Your prompt', x: -30, z: 0, col: C.azure, who: true },
    { id: 'goal', label: '🎯 Goal: what and why', x: -16, z: -14, col: 0x0f6cbd },
    { id: 'ctx', label: '📄 Context: #file, selection, open tabs', x: -16, z: 0, col: 0x5c2d91 },
    { id: 'ex', label: '🧾 Examples (few-shot)', x: -16, z: 14, col: C.amber },
    { id: 'hist', label: '💬 Chat history', x: 2, z: 14, col: 0x7a7574 },
    { id: 'instr', label: '📋 Custom instructions', x: 2, z: -14, col: 0x008575 },
    { id: 'model', label: '🧠 Copilot', x: 6, z: 0, col: 0x8764b8 },
    { id: 'res', label: '✨ Result', x: 26, z: 0, col: C.green },
  ],
  focus: [['you', 'model', 'res'], ['goal', 'ctx'], ['ctx', 'model'], ['ex', 'model'], ['you', 'goal', 'res'], ['instr', 'model'], ['hist', 'model'], ['you', 'res']],
  auto: ['vague', null, null, null, null, null, null, null],
  acts: {
    vague: { path: ['you', 'model', 'res'], col: C.red, msg: '😕 “write a function” → a generic snippet in the wrong style. Copilot had to guess the language, inputs, outputs and rules.', tone: 'bad', out: ['res', 'generic guess'] },
    specific: { path: ['you', 'goal', 'model', 'res'], col: C.green, msg: '🎯 “Write applyDiscount(total, code) in JS. Unknown codes return the total unchanged; never return a negative number.” → exactly that.', out: ['res', 'fits the spec'] },
    addfile: { path: ['ctx', 'model', 'res'], msg: '📄 Adding `#file:src/discount.js` (or selecting the code) tells Copilot which code you mean. Open tabs help inline suggestions too.', out: ['res', 'uses your real code'] },
    zeroshot: { path: ['you', 'model', 'res'], msg: '0️⃣ Zero-shot: just the instruction, no examples. Fine for common tasks Copilot has seen many times.', tone: 'info', out: ['res', 'ok for common tasks'] },
    fewshot: { path: ['ex', 'model', 'res'], col: C.amber, msg: '🧾 Few-shot: show two input → output examples of your log format, then ask. Copilot copies the pattern for the third.', out: ['res', 'follows your pattern'] },
    steps: { path: ['you', 'goal', 'model', 'res'], msg: '🪜 Break a big ask into steps: first the data model, then the validation, then the tests. Each answer is smaller and easier to check.', out: ['res', 'small, checkable steps'] },
    instr: { path: ['instr', 'model', 'res'], col: 0x008575, msg: '📋 Repository instructions are added to every chat request in the repo, so you stop repeating “use Jest, ES modules, no console.log”.', out: ['res', 'house style'] },
    stale: { path: ['hist', 'model', 'res'], col: C.red, msg: '🌀 Twenty messages about the old API are still in the history, and Copilot keeps drifting back to it.', tone: 'bad', out: ['res', 'confused by old turns'] },
    fresh: { path: ['you', 'model', 'res'], col: C.green, msg: '🧽 Start a new chat (or `/clear`) when the topic changes. Copilot only sees what is in this conversation.', out: ['res', 'back on track'] },
    iterate: { path: ['res', 'you', 'model', 'res'], msg: '🔁 Read the answer, then refine: “good, now handle an empty cart and add a test”. Prompting is a loop, not one shot.', out: ['res', 'better each turn'] },
  },
});

/* ------------------------------------------------------------------ */
/* 3. Ask, Edit, Agent, MCP and the coding agent                       */
/* ------------------------------------------------------------------ */
export const copilotagent = flow({
  ground: 0xe3ecea,
  nodes: [
    { id: 'you', label: '👩‍💻 You', x: -32, z: 0, col: C.azure, who: true },
    { id: 'ask', label: '💬 Ask mode', x: -18, z: -14, col: 0x0f6cbd },
    { id: 'edit', label: '✏️ Edit mode', x: -18, z: 0, col: 0x5c2d91 },
    { id: 'agent', label: '🤖 Agent mode', x: -18, z: 14, col: 0x8764b8 },
    { id: 'files', label: '📁 Workspace files', x: 0, z: -6, col: 0x7a7574 },
    { id: 'term', label: '⌨️ Terminal + tests', x: 0, z: 10, col: 0x24292f },
    { id: 'mcp', label: '🔌 MCP server (tools)', x: 14, z: 18, col: C.amber },
    { id: 'cloud', label: '☁️ Copilot coding agent', x: 16, z: -14, col: 0x008575 },
    { id: 'pr', label: '🔀 Pull request', x: 30, z: -2, col: C.green },
  ],
  focus: [['you', 'ask'], ['edit', 'files'], ['agent', 'files', 'term'], ['agent', 'mcp'], ['agent'], ['cloud', 'pr'], ['pr', 'you'], ['you', 'term']],
  auto: ['askq', 'editq', null, null, null, null, null, null],
  acts: {
    askq: { path: ['you', 'ask', 'you'], msg: '💬 Ask mode answers questions about your code. It explains and suggests, but changes nothing on its own.', out: ['ask', 'an answer'] },
    editq: { path: ['you', 'edit', 'files'], msg: '✏️ Edit mode changes the files you picked. You review each diff and Keep or Undo it.', out: ['files', 'diff to review'] },
    agentq: { path: ['you', 'agent', 'files', 'term', 'agent', 'files'], col: 0x8764b8, msg: '🤖 Agent mode plans, finds the files itself, edits them, runs the tests in the terminal, reads the failure and fixes it, looping until the task is done.', out: ['agent', 'task done, tests green'] },
    terminal: { path: ['agent', 'term'], stop: 'term', msg: '✋ Before running `npm install` in your terminal, agent mode asks for approval. You can allow it once, for the session, or say no.', tone: 'info', out: ['term', 'waiting for you'] },
    mcp: { path: ['agent', 'mcp', 'agent'], col: C.amber, msg: '🔌 An MCP server adds tools, for example the GitHub MCP server for issues and pull requests, or a docs server. Copilot asks before it calls a tool.', out: ['mcp', 'tool result'] },
    blocked: { path: ['agent', 'mcp'], stop: 'mcp', msg: '🚫 Your organization’s MCP policy doesn’t allow this server, so the tool isn’t available.', out: ['mcp', 'not allowed'] },
    subagent: { path: ['agent', 'agent', 'files', 'agent'], msg: '🧩 A sub-agent takes a side task (“research how auth works here”) in its own fresh context and returns a short summary, so the main session’s context stays small.', tone: 'info', out: ['agent', 'summary only'] },
    delegate: { path: ['you', 'cloud', 'pr'], col: 0x008575, msg: '☁️ Assign an issue to Copilot (or `/delegate` from the CLI). The coding agent works on its own branch in a GitHub Actions environment and opens a draft pull request.', out: ['pr', 'draft PR'] },
    review: { path: ['pr', 'you'], col: C.green, msg: '👀 A person still reviews and merges. Copilot can review the PR too and leave comments with suggested changes, but it doesn’t approve or block merging.', out: ['pr', 'human merges'] },
    cli: { path: ['you', 'term', 'agent'], msg: '⌨️ The same agent works in your terminal: `copilot` starts a session; `copilot -p` runs one prompt with the tools you allow.', out: ['term', 'copilot CLI'] },
  },
});

/* ------------------------------------------------------------------ */
/* 4. Plans, policies, privacy and safeguards                          */
/* ------------------------------------------------------------------ */
export const copilotgov = flow({
  ground: 0xe9e6df,
  nodes: [
    { id: 'ent', label: '🏢 Enterprise', x: -28, z: -12, col: 0x24292f },
    { id: 'org', label: '🏬 Organization', x: -14, z: -12, col: 0x0f6cbd },
    { id: 'pol', label: '📜 Copilot policies', x: -14, z: 4, col: 0x5c2d91 },
    { id: 'excl', label: '🚫 Content exclusions', x: 2, z: 16, col: C.red },
    { id: 'seat', label: '🪪 Seats (users, teams)', x: 2, z: -12, col: C.amber },
    { id: 'dev', label: '👩‍💻 Developer IDE', x: 18, z: 2, col: C.azure, who: true },
    { id: 'filter', label: '🔁 Public code filter', x: 6, z: 2, col: 0x008575 },
    { id: 'audit', label: '📒 Audit log + metrics', x: 28, z: -14, col: 0x7a7574 },
  ],
  focus: [['ent', 'org', 'seat'], ['ent', 'org', 'pol'], ['seat', 'dev'], ['pol', 'filter', 'dev'], ['excl', 'dev'], ['audit'], ['pol', 'dev'], ['dev', 'excl', 'filter']],
  auto: [null, 'inherit', 'assign', null, null, null, null, null],
  acts: {
    plan: { path: ['ent', 'org', 'seat'], msg: '🏢 Copilot Business is bought per organization; Copilot Enterprise adds features on GitHub Enterprise Cloud. Individuals use Free, Pro or Pro+.', tone: 'info', out: ['seat', 'Business / Enterprise'] },
    inherit: { path: ['ent', 'org', 'pol'], msg: '📜 An enterprise owner can set a policy for every organization, or let each organization decide. If the enterprise enforces it, the org can’t change it.', out: ['pol', 'enforced from above'] },
    assign: { path: ['org', 'seat', 'dev'], col: C.amber, msg: '🪪 The org admin gives seats to selected users or teams, in the settings or with the REST API. The developer signs in and Copilot lights up.', out: ['dev', 'Copilot on'] },
    noseat: { path: ['seat', 'dev'], stop: 'seat', msg: '❌ No seat assigned (or the seat was removed): the IDE says Copilot is not available for this account.', out: ['seat', 'no seat'] },
    block: { path: ['pol', 'filter', 'dev'], stop: 'filter', msg: '🔁 “Suggestions matching public code” is set to **Block**: a suggestion that matches public code is not shown.', out: ['filter', 'blocked'] },
    allowref: { path: ['pol', 'filter', 'dev'], col: C.green, msg: '📎 Set to **Allow**: the matching suggestion is shown, and Copilot gives a **code reference** with the repository and licence so you can decide.', out: ['dev', 'shown + reference'] },
    exclude: { path: ['dev', 'excl'], stop: 'excl', msg: '🚫 `secrets/**` is excluded at the repository or organization level. Copilot won’t read it as context and offers nothing inside it. Changes can take up to 30 minutes to reach IDEs.', out: ['excl', 'excluded'] },
    log: { path: ['pol', 'audit'], col: 0x7a7574, msg: '📒 Policy changes, seat changes and content exclusion changes show up in the audit log. Search it with `action:copilot`.', out: ['audit', 'action:copilot'] },
    review: { path: ['dev', 'dev'], msg: '🧑‍⚖️ Whatever the settings, the developer owns what ships: review, test and scan Copilot’s code like any other code.', tone: 'info', out: ['dev', 'you own the output'] },
    troubleshoot: { path: ['dev', 'excl', 'filter', 'dev'], msg: '🧰 No suggestions? Check you are signed in with a seat, the file isn’t excluded, the language isn’t disabled in settings, and the public code filter isn’t dropping it. Then look at the Copilot logs.', tone: 'info', out: ['dev', 'checklist'] },
  },
});
