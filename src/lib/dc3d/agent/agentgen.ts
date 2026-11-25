import { THREE, C, v, mat, box, cyl, person, ground, plate, glow, Packets, after, type V3 } from '../kit';
import { stepLabels, type Ctx, type Ctl, type Tone } from '../types';

type M = THREE.MeshStandardMaterial;
const curve = (...p: V3[]) => new THREE.CatmullRomCurve3(p.map((x) => v(...x)));

/**
 * AI-103 GenAI & Agents: thirteen stations, one per lesson, in syllabus order.
 * Each station is a few real nodes (app, model deployments, search, tools,
 * agents, boards). An action sends packets along a path of nodes and the
 * result lands on the board. Step order matches SCENE in
 * src/data/ai-103/areas/genai/scene.ts.
 */
type Kind = 'doc' | 'tool' | 'board' | 'bot' | 'person';
interface NodeSpec { key: string; kind: Kind; dx: number; dz: number; color: number; label: string; ly?: number; strong?: boolean }
const n = (key: string, kind: Kind, dx: number, dz: number, color: number, label: string, ly = 3.6, strong = false): NodeSpec => ({ key, kind, dx, dz, color, label, ly, strong });

const STATIONS: NodeSpec[][] = [
  /* 0 deploy and consume */ [
    n('0app', 'doc', -11, 0, 0xffffff, '🐍 Your app · DefaultAzureCredential'),
    n('0llm', 'tool', 0, -5, C.azure, '🚀 deployment “support-chat” → gpt-4.1-mini', 3.8, true),
    n('0slm', 'tool', 0, 5, C.purple, '⚡ deployment “label-fast” → Phi-4-mini-instruct', 3.8, true),
    n('0out', 'board', 11, 0, 0x223355, 'Call a deployment', 3.2),
  ],
  /* 1 RAG */ [
    n('1q', 'doc', -12, 0, 0xffffff, '❓ “How long to return a damaged kettle?”'),
    n('1idx', 'tool', -3, -5, C.green, '🔎 Azure AI Search · hybrid', 3.8, true),
    n('1mod', 'tool', -3, 5, C.purple, '🤖 gpt-4.1-mini', 3.8, true),
    n('1out', 'board', 10, 0, 0x223355, 'Ask a question', 3.2),
  ],
  /* 2 workflow */ [
    n('2in', 'doc', -14, 0, 0xffffff, '📧 claim email'),
    n('2cl', 'tool', -9, -5, C.azure, '1 Classify', 3.6, true),
    n('2ex', 'tool', -4, 5, C.purple, '2 Extract to schema', 3.6, true),
    n('2tl', 'tool', 1, -5, C.amber, '3 Tool: check_warranty', 3.6, true),
    n('2dr', 'tool', 6, 5, C.purple, '4 Draft', 3.6, true),
    n('2vf', 'tool', 11, -5, C.green, '5 Verify', 3.6, true),
    n('2out', 'board', 13, 5, 0x223355, 'Run the flow', 3.2),
  ],
  /* 3 evaluate */ [
    n('3data', 'doc', -12, 0, 0xffffff, '🗂️ rag-eval.jsonl · 5 rows'),
    n('3q', 'tool', -2, -5, C.azure, '📏 Groundedness · Relevance · Coherence', 3.8, true),
    n('3s', 'tool', -2, 5, C.red, '🛡️ Safety evaluators', 3.8, true),
    n('3out', 'board', 10, 0, 0x223355, 'Run an evaluation', 3.2),
  ],
  /* 4 SDK and connections */ [
    n('4app', 'doc', -13, 0, 0xffffff, '🐍 Your app'),
    n('4sdk', 'tool', -5, 0, C.azure, 'AIProjectClient(endpoint, credential)', 3.8, true),
    n('4proj', 'tool', 3, -6, C.purple, '📁 Foundry project', 3.6),
    n('4conn', 'tool', 3, 6, C.green, '🔌 Connections: Search · App Insights', 3.6),
    n('4out', 'board', 11, 0, 0x223355, 'Connect', 3.2),
  ],
  /* 5 design an agent */ [
    n('5u', 'person', -13, 0, C.azure, '🙋 Customer', 4.2),
    n('5ag', 'bot', -3, 0, C.purple, '🤖 order-agent · role + goal', 5.8, true),
    n('5fn', 'tool', 6, -5, C.amber, 'get_order_status(order_id *)', 3.8, true),
    n('5out', 'board', 12, 4, 0x223355, 'Ask the agent', 3.2),
  ],
  /* 6 retrieval, functions, memory */ [
    n('6u', 'person', -13, 0, C.azure, '🙋 Customer', 4.2),
    n('6ag', 'bot', -3, 0, C.purple, '🤖 order-agent', 5.8, true),
    n('6fs', 'tool', 6, -7, C.green, '📄 File search · policies', 3.8),
    n('6fn', 'tool', 6, 0, C.amber, '🔌 get_order_status', 3.8),
    n('6mem', 'tool', 6, 7, C.purple, '💾 Memory · customer-memory', 3.8),
    n('6out', 'board', -9, 7, 0x223355, 'Ask the agent', 3.2),
  ],
  /* 7 multi-agent */ [
    n('7u', 'doc', -14, 0, 0xffffff, '💬 “Charged twice and not delivered”'),
    n('7tr', 'bot', -7, 0, C.purple, '🧭 triage / manager', 5.6, true),
    n('7bl', 'bot', 1, -6, C.azure, '💳 billing', 5.4),
    n('7dl', 'bot', 1, 6, C.green, '🚚 delivery', 5.4),
    n('7wr', 'bot', 8, 0, C.amber, '✍️ writer', 5.4),
    n('7out', 'board', 13, 6, 0x223355, 'Pick a pattern', 3.2),
  ],
  /* 8 approvals */ [
    n('8u', 'person', -13, 0, C.azure, '🙋 Customer', 4.2),
    n('8ag', 'bot', -6, 0, C.purple, '🤖 refund-agent', 5.6, true),
    n('8rd', 'tool', 1, -6, C.green, '🔎 lookup_order · read-only', 3.8),
    n('8rf', 'tool', 3, 0, C.amber, '💸 issue_refund · approval required', 3.8, true),
    n('8lim', 'tool', 9, 6, C.red, '🧱 Hard limit ₹20,000 (code)', 3.8, true),
    n('8mg', 'person', 10, -5, C.green, '🧑‍💼 Manager', 4.2),
    n('8out', 'board', -9, 7, 0x223355, 'Request a refund', 3.2),
  ],
  /* 9 monitor agents */ [
    n('9runs', 'doc', -12, 0, 0xffffff, '🗂️ agent-runs.jsonl · 4 runs'),
    n('9ev', 'tool', -3, -5, C.azure, '📏 Intent · Tool call accuracy · Task adherence', 3.8, true),
    n('9ea', 'tool', -3, 5, C.amber, '🔍 Error analysis', 3.6, true),
    n('9out', 'board', 10, 0, 0x223355, 'Check a run', 3.2),
  ],
  /* 10 tune */ [
    n('10p', 'doc', -13, 0, 0xffffff, '📝 “steel mixer grinder, 750 W”'),
    n('10ins', 'tool', -6, -6, C.amber, '🧭 Instructions · example', 3.8, true),
    n('10md', 'tool', 1, 0, C.purple, '🤖 temperature · top_p · max_output_tokens', 3.8, true),
    n('10cr', 'tool', 8, 6, C.green, '🔁 Self-critique', 3.6),
    n('10out', 'board', 12, -5, 0x223355, 'Generate', 3.2),
  ],
  /* 11 tracing */ [
    n('11app', 'doc', -13, 0, 0xffffff, '🐍 traced_agent.py'),
    n('11ag', 'bot', -4, 0, C.purple, '🤖 order-agent', 5.6, true),
    n('11ai', 'tool', 6, -5, C.azure, '📈 Application Insights', 3.8, true),
    n('11out', 'board', 9, 5, 0x223355, 'Run the agent', 3.2),
  ],
  /* 12 route */ [
    n('12in', 'doc', -14, 0, 0xffffff, '📨 incoming requests'),
    n('12rl', 'tool', -4, -7, C.green, '📏 Rules, no model', 3.8, true),
    n('12sm', 'tool', -4, 0, C.purple, '⚡ Phi-4-mini-instruct', 3.8, true),
    n('12bg', 'tool', -4, 7, C.azure, '🧠 gpt-4.1 / o4-mini', 3.8, true),
    n('12out', 'board', 10, 0, 0x223355, 'Send a request', 3.2),
  ],
];

interface Act { path?: string[]; paths?: string[][]; color: number; flash?: [string, 'ok' | 'bad' | 'warn'][]; set?: Record<string, string>; hud: string; tone: Tone; then?: Act }
const ACTS: Record<string, Act> = {
  // 0
  llm: { path: ['0app', '0llm', '0out'], color: C.green, flash: [['0out', 'ok']], set: { '0out': '“A deployment name points to one model, version and quota.” · 410 in / 90 out tokens' }, hud: '🧠 The app called the deployment name. The large model gave a careful answer and the response reports the tokens used, which is what you pay for.', tone: 'ok' },
  slm: { path: ['0app', '0slm', '0out'], color: C.green, flash: [['0out', 'ok']], set: { '0out': '“A deployment name points to one model, version and quota.” · 380 in / 60 out · faster' }, hud: '⚡ The small model answered the same easy question faster and for much less. Send simple, high-volume work here and keep the large model for hard work.', tone: 'ok' },
  modelname: { path: ['0app', '0llm'], color: C.red, flash: [['0llm', 'bad'], ['0out', 'bad']], set: { '0out': '404 DeploymentNotFound: “gpt-4.1-mini” is a model, not a deployment' }, hud: '❌ The app passed the model name. The call must use the deployment name you chose, here “support-chat”. That name is what carries the model version, deployment type and capacity.', tone: 'bad' },
  // 1
  noretrieval: { path: ['1q', '1mod', '1out'], color: C.amber, flash: [['1out', 'bad']], set: { '1out': '“Probably 30 days.” ⚠️ a guess, no source' }, hud: '🎲 With no retrieval the model has never seen Contoso’s policy, so it guesses a typical answer. Nothing in the reply can be checked.', tone: 'bad' },
  rag: { path: ['1q', '1idx', '1mod', '1out'], color: C.green, flash: [['1idx', 'ok'], ['1out', 'ok']], set: { '1out': '“10 days, full refund.” [refund-policy.pdf#1] ✅' }, hud: '📚 Hybrid search found the right chunk, it went into the prompt, and the model answered from it with a citation. That is RAG: retrieve, augment, generate.', tone: 'ok' },
  nohit: { path: ['1q', '1idx', '1out'], color: C.azure, set: { '1out': '“I don’t know: the documents don’t cover that.”' }, hud: '🤷 Nothing relevant came back, and the instructions say to admit it. An honest “I don’t know” beats a confident invention.', tone: 'info' },
  // 2
  flow: { path: ['2in', '2cl', '2ex', '2tl', '2dr', '2vf', '2out'], color: C.green, flash: [['2vf', 'ok'], ['2out', 'ok']], set: { '2out': '“Your mixer is covered until 14 Aug 2027.” ✅ verified, sent' }, hud: '✅ Five small steps, each with one job. The tool returned real warranty data and the verify step checked the draft against it before sending.', tone: 'ok' },
  toolfail: { path: ['2in', '2cl', '2ex', '2tl'], color: C.amber, flash: [['2tl', 'bad']], set: { '2tl': '3 ⏱ timed out ×3' }, hud: '⏱ check_warranty timed out three times. The flow retries, then falls back instead of guessing…', tone: 'bad',
    then: { path: ['2tl', '2vf', '2out'], color: C.red, flash: [['2vf', 'warn'], ['2out', 'warn']], set: { '2out': '⏸ Held for a person: status “needs_human_review”' }, hud: '⛔ The fallback marked the claim for review and the verify step refused to send a draft with no facts behind it. Code decides what happens when a step fails.', tone: 'bad' } },
  // 3
  quality: { path: ['3data', '3q', '3out'], color: C.green, flash: [['3q', 'ok'], ['3out', 'warn']], set: { '3out': '4 of 5 pass · row 4 groundedness 1/5 ✗ invented ₹500 voucher' }, hud: '📏 Four rows are grounded. Row 4 promises a voucher the context never mentions, so groundedness is 1 out of 5. That is a fabrication, caught before release.', tone: 'info' },
  safety: { path: ['3data', '3s', '3out'], color: C.green, flash: [['3s', 'ok'], ['3out', 'ok']], set: { '3out': 'Violence · hate · indirect attack: 0 flagged in 5 rows ✅' }, hud: '🛡️ Safety evaluators score harm categories and indirect attacks on the same dataset. They check different things from quality, so run both.', tone: 'ok' },
  // 4
  keyless: { path: ['4app', '4sdk', '4proj', '4out'], color: C.green, flash: [['4sdk', 'ok'], ['4out', 'ok']], set: { '4out': 'Entra ID token · 2 deployments listed ✅ no secret in code' }, hud: '🔐 DefaultAzureCredential found a managed identity or your sign-in, and AIProjectClient used the project endpoint. Nothing secret is stored in the app.', tone: 'ok' },
  connection: { path: ['4app', '4sdk', '4conn', '4out'], color: C.azure, flash: [['4conn', 'ok']], set: { '4out': 'search-contoso → https://srch-contoso-agents.search.windows.net' }, hud: '🔌 The app asked the project for the “search-contoso” connection and got the endpoint. Connections keep the target and the auth method out of your code.', tone: 'info' },
  key: { path: ['4app', '4sdk'], color: C.red, flash: [['4sdk', 'bad'], ['4out', 'bad']], set: { '4out': '🔑 key in code → leaks in Git, can’t be scoped, never rotates' }, hud: '🔑 A key pasted in code gives whoever finds it full access until someone rotates it. Prefer Microsoft Entra ID with a role such as Foundry User.', tone: 'bad' },
  // 5
  noid: { path: ['5u', '5ag', '5out'], color: C.amber, flash: [['5out', 'ok']], set: { '5out': '“What’s your order number?” ✅ asked, no tool call' }, hud: '🤔 order_id is a required parameter, and the user didn’t give one. A clear schema and instructions make the agent ask instead of inventing a value.', tone: 'info' },
  withid: { path: ['5u', '5ag', '5fn', '5ag', '5out'], color: C.green, flash: [['5fn', 'ok'], ['5out', 'ok']], set: { '5out': '“ORD-1042 shipped yesterday and arrives Friday.” ✅' }, hud: '📦 The model asked for get_order_status with order_id ORD-1042. Your code ran the function and sent the result back, and the agent answered from it.', tone: 'ok' },
  // 6
  policy: { path: ['6u', '6ag', '6fs', '6ag', '6out'], color: C.green, flash: [['6fs', 'ok'], ['6out', 'ok']], set: { '6out': '“Damaged items: 10 days, full refund.” 【refund-policy.pdf】' }, hud: '📄 File search looked inside the policy documents and the agent answered with a citation.', tone: 'ok' },
  order: { path: ['6u', '6ag', '6fn', '6ag', '6out'], color: C.green, flash: [['6fn', 'ok'], ['6out', 'ok']], set: { '6out': '“ORD-1042 arrives Friday.” (live data)' }, hud: '🔌 Live data lives in a system, so the agent used a function. The model asks, your code runs it, and the result goes back to the model.', tone: 'ok' },
  memory: { path: ['6u', '6ag', '6mem', '6ag', '6out'], color: C.green, flash: [['6mem', 'ok'], ['6out', 'ok']], set: { '6out': '“I’ll send the tracking link on WhatsApp, like you asked last week.”' }, hud: '💾 A new conversation, but memory recalled “prefers WhatsApp” from before. The thread is short-term context; memory is what lasts between sessions.', tone: 'ok' },
  // 7
  sequential: { path: ['7u', '7tr', '7wr', '7out'], color: C.azure, flash: [['7out', 'ok']], set: { '7out': 'triage → writer → reviewed reply (fixed order)' }, hud: '➡️ Sequential: each agent gets the previous agent’s output, in an order you fixed. Good for pipelines such as draft, then review.', tone: 'info' },
  concurrent: { paths: [['7u', '7bl', '7wr'], ['7u', '7dl', '7wr']], color: C.green, flash: [['7wr', 'ok']], set: { '7out': 'billing + delivery in parallel → merged reply (time ≈ the slower one)' }, hud: '🔀 Concurrent: billing and delivery work at the same time and an aggregator merges the results. It saves time when the tasks don’t depend on each other.', tone: 'info', then: { path: ['7wr', '7out'], color: C.green, flash: [['7out', 'ok']], hud: '🔀 Two specialists answered in parallel and the reply was merged.', tone: 'ok' } },
  handoff: { path: ['7u', '7tr', '7bl', '7dl', '7out'], color: C.purple, flash: [['7out', 'ok']], set: { '7out': 'triage → billing → delivery: control moved with the conversation' }, hud: '🤝 Handoff: the agent in charge passes control to a better-suited agent. The conversation decides the route, not a fixed order.', tone: 'info' },
  magentic: { path: ['7u', '7tr', '7bl', '7tr', '7dl', '7tr', '7wr', '7out'], color: C.amber, flash: [['7tr', 'ok'], ['7out', 'ok']], set: { '7out': 'manager planned 3 tasks, delegated each, checked the plan' }, hud: '🧭 Magentic: a manager agent plans open-ended work, hands tasks to specialists and checks progress. It suits problems where the steps aren’t known up front.', tone: 'info' },
  // 8 (small / approve / reject / big are special-cased for the pending state)
  small: { path: ['8u', '8ag', '8rd', '8ag', '8rf'], color: C.green, flash: [['8rf', 'warn']], set: { '8out': '⏸ Paused: waiting for approval apr-1 (₹1,200)' }, hud: '⏸ Looking up the order needed no approval. issue_refund is marked approval required, so the run paused. Nothing has been refunded yet.', tone: 'info' },
  approve: { path: ['8mg', '8rf', '8out'], color: C.green, flash: [['8rf', 'ok'], ['8out', 'ok']], set: { '8out': '✅ Approved by manager → ₹1,200 refunded to the original payment method' }, hud: '✅ A person approved, the run resumed and the tool ran once. The approval is part of the trace, so an auditor can see who decided.', tone: 'ok' },
  reject: { path: ['8mg', '8rf', '8out'], color: C.red, flash: [['8rf', 'bad'], ['8out', 'bad']], set: { '8out': '🚫 Rejected → issue_refund did not run; the customer is told a person will follow up' }, hud: '🚫 The manager said no, the tool never ran, and the agent told the customer what happens next.', tone: 'bad' },
  big: { path: ['8u', '8ag', '8rd', '8ag', '8lim'], color: C.red, flash: [['8lim', 'bad'], ['8out', 'bad']], set: { '8out': '🧱 Blocked in code: over ₹20,000 goes to finance. No approval offered.' }, hud: '🧱 A hard limit in code stopped the call. Some actions shouldn’t be approvable by the person in the chat, whatever the model decides.', tone: 'bad' },
  // 9
  goodrun: { path: ['9runs', '9ev', '9out'], color: C.green, flash: [['9ev', 'ok'], ['9out', 'ok']], set: { '9out': 'Run 1: tool call accuracy 5/5 · intent resolved ✅' }, hud: '✅ The agent called get_order_status with the order number the user gave. Tool call accuracy and intent resolution both pass.', tone: 'ok' },
  badrun: { path: ['9runs', '9ev', '9ea', '9out'], color: C.amber, flash: [['9ev', 'bad'], ['9out', 'bad']], set: { '9out': 'Run 2: accuracy 2/5 ✗ order_id “ORD-0000” was never given. Run 3: claimed a cancel with no tool call.' }, hud: '⚠️ Error analysis groups the failures: a made-up argument and a claimed action with no tool call. Fixes: ask for the number first, and add a cancel tool that needs approval.', tone: 'bad' },
  // 10
  cold: { path: ['10p', '10ins', '10md', '10out'], color: C.green, flash: [['10out', 'ok']], set: { '10out': '“Grinds chutney and dosa batter. 750 W, 1-year warranty.”' }, hud: '🧊 Temperature 0.2 keeps the wording steady and close to the instructions. That’s what you want for facts, extraction and support answers.', tone: 'ok' },
  hot: { path: ['10p', '10ins', '10md', '10out'], color: C.amber, flash: [['10out', 'bad']], set: { '10out': '“Whirl, blend, conquer! A kitchen superhero…” ⚠️ off-brand, no warranty' }, hud: '🔥 Temperature 1.4 makes the wording adventurous. Good for brainstorming, bad for a product page that must state the warranty.', tone: 'bad' },
  fewshot: { path: ['10p', '10ins', '10md', '10out'], color: C.green, flash: [['10ins', 'ok'], ['10out', 'ok']], set: { '10out': 'Matches the example: short, plain English, warranty stated ✅' }, hud: '🧩 One worked example in the instructions pinned down the format and tone better than another paragraph of rules.', tone: 'ok' },
  short: { path: ['10p', '10ins', '10md', '10out'], color: C.amber, flash: [['10out', 'bad']], set: { '10out': '“Grinds chutney and do…” ✂️ status: incomplete (max_output_tokens)' }, hud: '✂️ With max output tokens at 30 the model ran out of room mid-sentence. The response status shows “incomplete”, so check it.', tone: 'bad' },
  critique: { path: ['10p', '10ins', '10md', '10cr', '10md', '10out'], color: C.green, flash: [['10cr', 'ok'], ['10out', 'ok']], set: { '10out': 'Draft → checklist found a wrong warranty → revised once ✅' }, hud: '🔁 The model checked its own draft against a checklist, found the wrong warranty and rewrote it once. Limit the loop so it can’t run forever.', tone: 'ok' },
  // 11
  notrace: { path: ['11app', '11ag', '11out'], color: C.amber, flash: [['11out', 'bad']], set: { '11out': '⚠️ No spans exported: GenAI tracing is not switched on' }, hud: '🙈 The agent ran, but nothing was recorded. The instrumentation is opt-in, so switch it on and connect Application Insights.', tone: 'bad' },
  trace: { path: ['11app', '11ag', '11ai', '11out'], color: C.green, flash: [['11ai', 'ok'], ['11out', 'ok']], set: { '11out': 'invoke_agent 2140 ms · chat 610 ms (412 tokens) · execute_tool 940 ms' }, hud: '📈 One trace, three spans: the agent run, the model call with its tokens, and the tool call. The slowest span is the one to fix first.', tone: 'ok' },
  content: { path: ['11app', '11ag', '11ai', '11out'], color: C.amber, flash: [['11out', 'warn']], set: { '11out': 'Spans now hold prompts and answers ⚠️ development only' }, hud: '📝 Recording message content helps debugging, but prompts and answers can hold personal data. Keep it off in production unless policy allows it.', tone: 'info' },
  // 12
  hours: { path: ['12in', '12rl', '12out'], color: C.green, flash: [['12rl', 'ok'], ['12out', 'ok']], set: { '12out': '“Open 9 AM to 9 PM.” · 0 model calls' }, hud: '🕘 A lookup table answers store hours exactly. A model would only add cost and a chance of being wrong.', tone: 'ok' },
  refundlimit: { path: ['12in', '12rl', '12out'], color: C.green, flash: [['12rl', 'ok'], ['12out', 'ok']], set: { '12out': '₹1,200 ≤ ₹5,000 limit → approved by code · 0 model calls' }, hud: '💸 The refund limit is a policy, so code decides it. Rules first keeps decisions exact and free.', tone: 'ok' },
  label: { path: ['12in', '12sm', '12out'], color: C.green, flash: [['12sm', 'ok'], ['12out', 'ok']], set: { '12out': 'Negative · small model, about a fifth of the cost' }, hud: '🏷️ A classification this simple doesn’t need a large model. The small one is faster and cheaper.', tone: 'ok' },
  complex: { path: ['12in', '12bg', '12out'], color: C.azure, flash: [['12bg', 'ok'], ['12out', 'ok']], set: { '12out': 'Large model: compared three plans against the café’s volume' }, hud: '🧠 Long, multi-part reasoning is where the large or reasoning model earns its price. It gets only the requests that need it.', tone: 'info' },
};
// Which action belongs to which station (so a stray id from another step does nothing).
const ACTS_AT: Record<number, string[]> = {
  0: ['llm', 'slm', 'modelname'], 1: ['noretrieval', 'rag', 'nohit'], 2: ['flow', 'toolfail'], 3: ['quality', 'safety'], 4: ['keyless', 'connection', 'key'],
  5: ['noid', 'withid'], 6: ['policy', 'order', 'memory'], 7: ['sequential', 'concurrent', 'handoff', 'magentic'], 8: ['small', 'approve', 'reject', 'big'],
  9: ['goodrun', 'badrun'], 10: ['cold', 'hot', 'fewshot', 'short', 'critique'], 11: ['notrace', 'trace', 'content'], 12: ['hours', 'refundlimit', 'label', 'complex'],
};

export function agentgen({ stage, hud, cost }: Ctx): Ctl {
  const S = stage.scene;
  ground(stage, 190, 0xdde6ef);
  const packets = new Packets(stage, 0.4);
  const later = after(stage);
  const solid = (c: number, e = 0.25) => mat(c, { emissive: c, emissiveIntensity: e });
  const L = stepLabels(stage);

  // 4 columns of stations; step k lives at ST[k].
  const ST: [number, number][] = STATIONS.map((_, k) => [((k % 4) - 1.5) * 40, (Math.floor(k / 4) - 1.5) * 32]);
  const PLATES = [0xe3ecf7, 0xeee8f8, 0xe2f0e4, 0xf7ece0, 0xe0eef2, 0xe9e4f5, 0xf0e8e8];
  ST.forEach(([x, z], k) => S.add(plate(34, 22, PLATES[k % PLATES.length], [x, 0, z])));

  interface Node { m: M; p: V3; base: number; baseE: number; text: string; lbl: ReturnType<typeof L.add>; step: number }
  const nodes = new Map<string, Node>();
  STATIONS.forEach((spec, k) => spec.forEach((s) => {
    const p: V3 = [ST[k][0] + s.dx, 0.1, ST[k][1] + s.dz];
    const baseE = s.kind === 'doc' ? 0.08 : s.kind === 'board' ? 0.4 : 0.3;
    const m = solid(s.color, baseE);
    if (s.kind === 'doc') S.add(box(2.4, 3, 0.4, m, p));
    else if (s.kind === 'tool') S.add(box(4, 3, 3.4, m, p));
    else if (s.kind === 'board') { m.emissive.setHex(0x223355); S.add(box(5.6, 3.2, 0.4, m, p)); }
    else if (s.kind === 'person') S.add(person(s.color, p, 1.7));
    else { const g = new THREE.Group(); g.add(cyl(1.1, 2.2, m, [0, 0, 0])); const head = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), m); head.position.y = 3.1; g.add(head); g.position.set(...p); S.add(g); }
    const lbl = L.add(s.label, [p[0], p[1] + (s.ly ?? 3.6), p[2]], [k], s.strong ? 'd3-label-strong' : '');
    nodes.set(s.key, { m, p, base: s.kind === 'board' ? 0x223355 : s.color, baseE, text: s.label, lbl, step: k });
  }));

  const hi = (p: V3): V3 => [p[0], 1.8, p[2]];
  const hop = (a: string, b: string, color: number, done: () => void) => {
    const A = nodes.get(a)!.p, B = nodes.get(b)!.p;
    packets.send(curve(hi(A), [(A[0] + B[0]) / 2, 5, (A[2] + B[2]) / 2], hi(B)), color, 0.75, done);
  };
  const pulse = (key: string, c: number) => { const nd = nodes.get(key); if (!nd) return; glow(nd.m, c, 1); later(0.7, () => glow(nd.m, nd.base, nd.baseE)); };
  const settle = (key: string, tone: 'ok' | 'bad' | 'warn') => { const nd = nodes.get(key); if (!nd) return; const c = tone === 'ok' ? C.green : tone === 'bad' ? C.red : C.amber; glow(nd.m, c, 0.9); later(2.4, () => glow(nd.m, nd.base, nd.baseE)); };
  const walk = (path: string[], color: number, done: () => void, i = 0) => {
    if (i >= path.length - 1) { done(); return; }
    hop(path[i], path[i + 1], color, () => { if (path[i + 1] !== path[path.length - 1]) pulse(path[i + 1], C.amber); walk(path, color, done, i + 1); });
  };

  let step = 0;
  let pending = false;
  const reset = () => { nodes.forEach((nd) => { nd.lbl.set(nd.text); glow(nd.m, nd.base, nd.baseE); }); };

  const play = (a: Act) => {
    const paths = a.paths ?? [a.path ?? []];
    let left = paths.length;
    const finish = () => {
      a.flash?.forEach(([k, t]) => settle(k, t));
      if (a.set) Object.entries(a.set).forEach(([k, t]) => nodes.get(k)?.lbl.set(t));
      hud(a.hud, a.tone);
      if (a.then) later(1.1, () => play(a.then!));
    };
    paths.forEach((p) => walk(p, a.color, () => { if (--left === 0) finish(); }));
  };

  return {
    go(i) {
      step = i;
      later.cancelAll();
      packets.clear();
      pending = false;
      hud('');
      L.show(i);
      reset();
      cost(0, 'month', '');
      const [cx, cz] = ST[i];
      stage.fly([cx, 19, cz + 27], [cx, 1, cz]);
      if (i === 0) hud('One project, two deployments. Pick what to call.', 'info');
    },
    act(id) {
      if (!(ACTS_AT[step] ?? []).includes(id)) return;
      if (step === 8 && (id === 'approve' || id === 'reject')) {
        if (!pending) { hud('Nothing is waiting for a decision. Request a refund first.', 'info'); return; }
        pending = false;
      } else if (step === 8) pending = id === 'small';
      packets.clear();
      later.cancelAll();
      nodes.forEach((nd) => { if (nd.step === step) nd.lbl.set(nd.text); });
      play(ACTS[id]);
    },
  };
}
