/**
 * AI-103 "plan" Cloud Shell commands (EDUCATION ONLY). cli.ts asks these
 * modules before the AZ-104 and AI-200 ones. Everything here returns null for
 * anything it doesn't handle, and the shared az paths (role assignment,
 * private endpoint, resource update) are claimed only with a `when` guard for
 * Foundry, so AZ-104 and AI-200 commands keep working.
 *
 * Nothing calls a real service: small Python-style apps (pick_model.py,
 * build_kb.py, agent_memory.py, deploy_config.py, agent_versions.py,
 * run_pipeline.py, load_test.py, token_budget.py, monitor_check.py,
 * guardrail.py, run_evals.py, red_team.py, show_trace.py, agent_policy.py,
 * agent_run.py) use simple rules so labs can check what the learner did.
 * Every run emits py.run plus one agt.plan.* event. Names and settings follow
 * Microsoft Learn (Foundry quotas, guardrails, observability, RBAC pages;
 * checked 25 Nov 2026).
 */
import { SimError } from '../engine';
import type { World } from '../world';
import { run, parse, one, has, many, lc, table, type AdminOut, type Parsed, type Cmd, type Handler } from '../admin/kit';
import { foundries, type Deployment } from '../foundry';

/* ------------------------------------------------------------------ */
/* state                                                               */
/* ------------------------------------------------------------------ */
interface PlanState {
  kb: string[];
  memory: Record<string, string[]>;
  agent: { versions: { v: number; instructions: string }[]; active: number };
  secure: Record<string, { localAuthDisabled: boolean; publicAccess: string; pe: string[]; roles: string[] }>;
  guard: Record<string, { risks: string[]; points: string[]; action: string }>;
  policy: { allow: string[]; approval: string[]; egress: string };
}
const S = (w: World): PlanState => ((w as any).agtplan ??= { kb: [], memory: {}, agent: { versions: [{ v: 1, instructions: 'Answer support questions politely.' }], active: 1 }, secure: {}, guard: {}, policy: { allow: [], approval: [], egress: 'open' } } as PlanState);
const fail = (m: string, code = 'BadRequest'): never => { throw new SimError(m, code); };
const firstFoundry = (w: World) => foundries(w)[0] ?? fail('No Foundry resource found. Create one first: az cognitiveservices account create -n <name> -g <rg> --kind AIServices.', 'ResourceNotFound');
const dep = (w: World, name?: string): Deployment => {
  const r = firstFoundry(w);
  const l = r.props.deployments as Deployment[];
  const d = name ? l.find((x) => lc(x.name) === lc(name)) : l[0];
  if (!d) fail(`Deployment '${name ?? ''}' wasn't found on '${r.name}'. Create it with az cognitiveservices account deployment create.`, 'DeploymentNotFound');
  return d!;
};

/* ------------------------------------------------------------------ */
/* az: quota, security                                                 */
/* ------------------------------------------------------------------ */
const isFoundryScope = (p: Parsed) => /microsoft\.cognitiveservices\/accounts|\/accounts\//i.test(`${one(p, '--ids') ?? ''} ${one(p, '--private-connection-resource-id') ?? ''} ${one(p, '--scope') ?? ''}`);
const nameFromId = (id: string) => id.split('/accounts/')[1]?.split('/')[0] ?? '';
const secOf = (w: World, name: string) => (S(w).secure[name] ??= { localAuthDisabled: false, publicAccess: 'Enabled', pe: [], roles: [] });
const FOUNDRY_ROLES = ['foundry user', 'azure ai user', 'azure ai project manager', 'azure ai account owner', 'cognitive services openai user'];

const usageList: Handler = (p, w) => {
  const loc = one(p, '--location') ?? fail('the following arguments are required: --location/-l', 'MissingArgs');
  const used = foundries(w).flatMap((r) => r.props.deployments as Deployment[]).reduce((m, d) => ({ ...m, [`${d.sku}.${d.model}`]: (m[`${d.sku}.${d.model}`] ?? 0) + d.capacity }), {} as Record<string, number>);
  const names = ['GlobalStandard.gpt-4.1-mini', 'GlobalStandard.gpt-4.1', 'DataZoneStandard.gpt-4.1-mini', 'GlobalStandard.o4-mini'];
  const rows = names.map((n) => ({ Name: `OpenAI.${n}`, CurrentValue: used[n] ?? 0, Limit: n.endsWith('o4-mini') ? 100 : 1000, Unit: 'Count (1 = 1,000 TPM)' }));
  w.emit('agt.plan.quota', { location: lc(loc) });
  return { out: `Quota in ${loc}, per subscription, model and deployment type\n${table(rows, ['Name', 'CurrentValue', 'Limit', 'Unit'])}\nEach deployment takes a slice of its quota. Requests per minute come with the slice (about 6 per 1,000 TPM).` };
};
const resourceUpdate: Cmd = {
  when: (p) => /cognitiveservices/i.test(one(p, '--ids') ?? ''),
  run: (p, w) => {
    const name = nameFromId(one(p, '--ids')!);
    const r = foundries(w).find((x) => lc(x.name) === lc(name)) ?? fail(`The Foundry resource '${name}' was not found.`, 'ResourceNotFound');
    const sets = many(p, '--set').join(' ');
    const st = secOf(w, r!.name);
    const m1 = sets.match(/properties\.disableLocalAuth=(true|false)/i); if (m1) st.localAuthDisabled = lc(m1[1]) === 'true';
    const m2 = sets.match(/properties\.publicNetworkAccess=(\w+)/i); if (m2) st.publicAccess = /^disabled$/i.test(m2[1]) ? 'Disabled' : 'Enabled';
    if (!m1 && !m2) fail('Nothing to change. Use --set properties.disableLocalAuth=true and/or properties.publicNetworkAccess=Disabled.');
    w.emit('agt.plan.secure', { resource: r!.name, disableLocalAuth: st.localAuthDisabled, publicAccess: st.publicAccess });
    return { out: JSON.stringify({ name: r!.name, properties: { disableLocalAuth: st.localAuthDisabled, publicNetworkAccess: st.publicAccess, provisioningState: 'Succeeded' } }, null, 2) };
  },
};
const roleAssign: Cmd = {
  when: (p) => FOUNDRY_ROLES.includes(lc(one(p, '--role'))),
  run: (p, w) => {
    const assignee = one(p, '--assignee') ?? fail('the following arguments are required: --assignee', 'MissingArgs');
    const scope = one(p, '--scope') ?? fail('the following arguments are required: --scope', 'MissingArgs');
    const name = nameFromId(scope);
    const r = foundries(w).find((x) => lc(x.name) === lc(name)) ?? fail('Use the Foundry resource id as --scope (az cognitiveservices account show --query id).', 'ResourceNotFound');
    secOf(w, r!.name).roles.push(`${assignee}:${one(p, '--role')}`);
    w.emit('agt.plan.role', { resource: r!.name, role: lc(one(p, '--role')), assignee, scope });
    return { out: JSON.stringify({ principalId: assignee, roleDefinitionName: one(p, '--role'), scope, type: 'Microsoft.Authorization/roleAssignments' }, null, 2) };
  },
};
const peCreate: Cmd = {
  when: (p) => /^account$/i.test(one(p, '--group-id') ?? '') || /cognitiveservices/i.test(one(p, '--private-connection-resource-id') ?? ''),
  run: (p, w) => {
    const need = (k: string) => one(p, k) ?? fail(`the following arguments are required: ${k}`, 'MissingArgs');
    const name = need('--name'); need('--resource-group'); need('--vnet-name'); need('--subnet'); need('--connection-name');
    const target = nameFromId(need('--private-connection-resource-id'));
    const r = foundries(w).find((x) => lc(x.name) === lc(target)) ?? fail('--private-connection-resource-id must be the Foundry resource id.', 'ResourceNotFound');
    secOf(w, r!.name).pe.push(name);
    w.emit('agt.plan.pe', { resource: r!.name, name, groupId: lc(one(p, '--group-id')) });
    return { out: JSON.stringify({ name, provisioningState: 'Succeeded', privateLinkServiceConnections: [{ groupIds: ['account'], privateLinkServiceId: one(p, '--private-connection-resource-id') }] }, null, 2) };
  },
};
const AZ: Record<string, Cmd | Handler> = {
  'cognitiveservices usage list': usageList,
  'resource update': resourceUpdate,
  'role assignment create': roleAssign,
  'network private-endpoint create': peCreate,
};
export function az(tokens: string[], w: World): AdminOut | null { return run(AZ, tokens, w); }

/* ------------------------------------------------------------------ */
/* Python apps                                                         */
/* ------------------------------------------------------------------ */
const JOBS: Record<string, { label: string; best: string; why: string }> = {
  contract: { label: 'Review a 6-step contract question', best: 'o4-mini', why: 'a reasoning model plans multistep problems' },
  labels: { label: 'Label 10,000 support tickets an hour', best: 'Phi-4-mini-instruct', why: 'a small language model is cheap and fast for narrow, high-volume work' },
  invoice: { label: 'Pull fields from scanned invoices', best: 'Content Understanding', why: 'a Foundry Tool returns structured fields from documents without prompt work' },
  photo: { label: 'Describe a product photo', best: 'gpt-4.1-mini', why: 'a multimodal model accepts image input' },
};
const peek = (s: string) => s;
const APPS: Record<string, { src: string; run: (argv: string[], w: World) => { out: string; ev?: [string, Record<string, any>] } }> = {
  'pick_model.py': {
    src: `# pick_model.py: ask the catalog advisor which model or Foundry Tool fits a job
import sys
JOBS = {"contract": "reasoning", "labels": "small", "invoice": "tool", "photo": "multimodal"}
job = sys.argv[sys.argv.index("--job") + 1]
print(recommend(job))   # checks inputs, context window, cost and latency`,
    run: (a) => {
      const job = one(parse(a), '--job') ?? fail(`usage: python pick_model.py --job ${Object.keys(JOBS).join('|')}`, 'Python');
      const j = JOBS[lc(job)] ?? fail(`Unknown job '${job}'. Try: ${Object.keys(JOBS).join(', ')}.`, 'Python');
      return { out: `Job: ${j.label}\nChoose: ${j.best}\nWhy: ${j.why}.\nTip: run your own test set before you commit, because a cheaper model that passes beats a bigger one that also passes.`, ev: ['agt.plan.pick', { job: lc(job), choice: j.best }] };
    },
  },
  'build_kb.py': {
    src: `# build_kb.py: create a Foundry IQ knowledge base on Azure AI Search
from azure.ai.projects import AIProjectClient
kb = project.knowledge_bases.create(
    name="kb-policies",
    sources=["blob:policies", "web"],       # knowledge sources
    retrieval_reasoning_effort="low",       # trade speed for better query planning
)`,
    run: (a, w) => {
      const p = parse(a); const name = one(p, '--name') ?? 'kb-policies'; const src = one(p, '--source') ?? 'blob';
      S(w).kb.push(name);
      return { out: `Knowledge base '${name}' created on Azure AI Search\nSources: ${src}\nThe agent plans sub-queries, searches the sources and returns passages with citations.`, ev: ['agt.plan.kb', { name, source: lc(src) }] };
    },
  },
  'agent_memory.py': {
    src: `# agent_memory.py: one turn with an agent; --memory attaches a memory store scoped to the user
import sys
store = "mem-support" if "--memory" in sys.argv else None
reply = agent.respond(user=user, text=text, memory_store=store, new_session="--new-session" in sys.argv)`,
    run: (a, w) => {
      const p = parse(a); const user = one(p, '--user') ?? 'ravi'; const mem = has(p, '--memory'); const fresh = has(p, '--new-session');
      const text = p.raw.join(' ');
      const st = S(w);
      let out: string; let recalled = false;
      if (fresh) {
        recalled = mem && (st.memory[user]?.length ?? 0) > 0;
        out = recalled ? `New session for ${user}.\nAgent: Welcome back! You told me you're vegetarian, so I'll show vegetarian options first.` : `New session for ${user}.\nAgent: Hello! Tell me about your food preferences. (${mem ? 'Memory is on but nothing is stored yet.' : 'No memory attached, so nothing carried over.'})`;
      } else {
        if (mem && /vegetarian/i.test(text)) (st.memory[user] ??= []).push('vegetarian');
        out = `${user}: ${text || '(no text)'}\nAgent: Noted.${mem && st.memory[user]?.length ? ' (Saved to user profile memory.)' : ''}`;
      }
      return { out, ev: ['agt.plan.memory', { user, memory: mem, newSession: fresh, recalled }] };
    },
  },
  'deploy_config.py': {
    src: `# deploy_config.py: pin the model version, capacity and guardrail on a deployment
parser.add_argument("--deployment"); parser.add_argument("--version"); parser.add_argument("--capacity", type=int)
parser.add_argument("--guardrail"); parser.add_argument("--upgrade", choices=["NoAutoUpgrade", "OnceNewDefaultVersionAvailable"])
client.deployments.begin_create_or_update(resource, name, {"model": {"version": version}, "sku": {"capacity": capacity},
    "properties": {"raiPolicyName": guardrail, "versionUpgradeOption": upgrade}})`,
    run: (a, w) => {
      const p = parse(a);
      const d = dep(w, one(p, '--deployment'));
      const cap = Number(one(p, '--capacity') ?? d.capacity); const version = one(p, '--version') ?? '2025-04-14';
      const guardrail = one(p, '--guardrail') ?? 'Microsoft.DefaultV2'; const upgrade = one(p, '--upgrade') ?? 'OnceNewDefaultVersionAvailable';
      if (!(cap >= 1 && cap <= 500)) fail('--capacity must be between 1 and 500 (1 = 1,000 tokens per minute).', 'Python');
      d.capacity = cap;
      return { out: `Deployment ${d.name} updated\n  model        ${d.model} @ ${version}\n  type         ${d.sku}\n  capacity     ${cap} (${cap * 1000} TPM)\n  guardrail    ${guardrail}\n  upgrade      ${upgrade}`, ev: ['agt.plan.deploy', { name: d.name, capacity: cap, version, guardrail, upgrade, sku: d.sku }] };
    },
  },
  'agent_versions.py': {
    src: `# agent_versions.py: every change to an agent creates a new version; the endpoint serves the active one
if cmd == "publish":  agents.create_version(name, definition=PromptAgentDefinition(model=..., instructions=text))
if cmd == "rollback": agents.set_active_version(name, version)`,
    run: (a, w) => {
      const p = parse(a); const cmd = p.words[0]; const ag = S(w).agent;
      if (cmd === 'publish') { const v = ag.versions.length + 1; ag.versions.push({ v, instructions: one(p, '--instructions') ?? 'Updated instructions.' }); ag.active = v; return { out: `Agent support-agent version ${v} created and active.\nVersions: ${ag.versions.map((x) => x.v).join(', ')}`, ev: ['agt.plan.agent', { action: 'publish', version: v, active: v }] }; }
      if (cmd === 'rollback') { const to = Number(one(p, '--to')); if (!ag.versions.some((x) => x.v === to)) fail(`Version ${to} doesn't exist. Versions: ${ag.versions.map((x) => x.v).join(', ')}.`, 'Python'); ag.active = to; return { out: `Active version is now ${to}. No data was lost; version ${ag.versions.length} is kept.`, ev: ['agt.plan.agent', { action: 'rollback', version: to, active: to }] }; }
      if (cmd === 'list') return { out: ag.versions.map((x) => `v${x.v}${x.v === ag.active ? ' (active)' : ''}  ${x.instructions}`).join('\n'), ev: ['agt.plan.agent', { action: 'list', version: ag.active, active: ag.active }] };
      return fail('usage: python agent_versions.py publish --instructions "..." | rollback --to 1 | list', 'Python');
    },
  },
  'run_pipeline.py': {
    src: `# run_pipeline.py: what the GitHub Actions workflow does for a pull request
# 1. azure/login with workload identity federation (no secret)
# 2. deploy dev with Bicep
# 3. run the evaluation on tests/support-cases.jsonl
# 4. if the gate passes, promote the same definition to test, then prod`,
    run: (a) => {
      const p = parse(a); const change = lc(one(p, '--change') ?? 'good'); const gate = has(p, '--gate');
      if (!['good', 'bad'].includes(change)) fail('--change must be good or bad.', 'Python');
      const g = change === 'good' ? 4.5 : 3.1;
      const passed = g >= 4;
      const promoted = !gate || passed;
      const out = [`Signed in with workload identity federation (no secret)`, `Deployed to dev project`, gate ? `Evaluation gate: groundedness ${g} (threshold 4.0) ${passed ? 'PASS' : 'FAIL'}` : `No evaluation gate configured`, promoted ? `Promoted to test and prod${!passed ? '  (a weak change just shipped!)' : ''}` : `Release blocked. Prod is unchanged.`].join('\n');
      return { out, ev: ['agt.plan.pipeline', { change, gate, passed, promoted }] };
    },
  },
  'load_test.py': {
    src: `# load_test.py: send requests at a deployment and count HTTP 429 answers
# allowed requests per minute is about 6 per 1,000 TPM of capacity
# --retry   honour the retry-after header and back off
# --spillover   overflow to a standard deployment`,
    run: (a, w) => {
      const p = parse(a); const d = dep(w, one(p, '--deployment')); const rps = Number(one(p, '--rps') ?? 5);
      if (!(rps > 0)) fail('--rps must be a positive number.', 'Python');
      const limit = d.capacity * 6; const demand = Math.round(rps * 60); const throttled = Math.max(0, demand - limit);
      const retry = has(p, '--retry'); const spill = has(p, '--spillover');
      const lines = [`Deployment ${d.name}: ${d.capacity * 1000} TPM, about ${limit} requests per minute`, `Sent ${demand} requests in a minute (${rps}/s)`];
      if (!throttled) lines.push('All requests succeeded. Nothing was throttled.');
      else if (spill) lines.push(`${throttled} requests overflowed to the standard spillover deployment. 0 failed.`);
      else if (retry) lines.push(`${throttled} got HTTP 429 with retry-after: 20. After backoff and retry all succeeded, but p95 latency rose to 23 s.`);
      else lines.push(`${throttled} requests failed with HTTP 429 Too Many Requests (retry-after: 20).`);
      return { out: lines.join('\n'), ev: ['agt.plan.load', { rps, throttled, retry, spill, capacity: d.capacity }] };
    },
  },
  'token_budget.py': {
    src: `# token_budget.py: set a daily token budget and an alert for a project
# cost control: stop calls at the limit; alert at a percentage of it`,
    run: (a) => {
      const p = parse(a); const tokens = Number(one(p, '--daily-tokens')); const alert = Number(one(p, '--alert') ?? 80);
      if (!(tokens > 0)) fail('usage: python token_budget.py --daily-tokens 2000000 --alert 80', 'Python');
      return { out: `Project support-bot: budget ${tokens.toLocaleString('en-US')} tokens a day. Alert at ${alert}% (${Math.round(tokens * alert / 100).toLocaleString('en-US')} tokens). Calls stop at 100%.`, ev: ['agt.plan.budget', { tokens, alert }] };
    },
  },
  'monitor_check.py': {
    src: `# monitor_check.py: read what Azure Monitor, Application Insights and Azure AI Search tell you
# --metrics  requests, tokens, latency, 429s    --eval  continuous evaluation scores
# --index    indexer runs, document counts, search latency`,
    run: (a) => {
      const p = parse(a);
      if (has(p, '--metrics')) return { out: 'Azure Monitor metrics, last hour\n  Requests          12,480\n  Processed tokens  9.1M\n  Latency p95       2.4 s\n  HTTP 429          312 (2.5%)', ev: ['agt.plan.monitor', { kind: 'metrics' }] };
      if (has(p, '--eval')) return { out: 'Continuous evaluation, sample of 100 live answers\n  Groundedness  3.4  (was 4.6 last week)  ALERT\n  Relevance     4.5\n  Safety        no violations\nLikely cause: the policy PDF changed and the index wasn\'t refreshed.', ev: ['agt.plan.monitor', { kind: 'eval' }] };
      if (has(p, '--index')) return { out: 'Azure AI Search index kb-policies\n  Documents          4,812\n  Last indexer run   FAILED: 120 items (unreadable PDFs)\n  Search latency p95 1.9 s\n  Throttled queries  41', ev: ['agt.plan.monitor', { kind: 'index', failed: 120 }] };
      return fail('usage: python monitor_check.py --metrics | --eval | --index', 'Python');
    },
  },
  'guardrail.py': {
    src: `# guardrail.py: build a guardrail from controls and test it
# a control = risk + intervention point + action
# risks: hate, violence, jailbreak, indirect-attack, protected-material, pii
# points: input, tool-call, tool-response, output   actions: annotate, block`,
    run: (a, w) => {
      const p = parse(a); const cmd = p.words[0]; const st = S(w);
      if (cmd === 'create') {
        const name = one(p, '--name') ?? fail('--name is required', 'Python');
        const risks = (one(p, '--risks') ?? '').split(',').filter(Boolean); const points = (one(p, '--points') ?? 'input,output').split(','); const action = lc(one(p, '--action') ?? 'block');
        if (!risks.length) fail('--risks is required, for example jailbreak,indirect-attack,hate', 'Python');
        st.guard[name!] = { risks, points, action };
        return { out: `Guardrail ${name} created: ${risks.length} risks x ${points.length} intervention points, action ${action}`, ev: ['agt.plan.guardrail', { name, risks, points, action }] };
      }
      if (cmd === 'apply') {
        const name = one(p, '--name') ?? ''; if (!st.guard[name]) fail(`Guardrail '${name}' doesn't exist. Create it first.`, 'Python');
        const dpl = one(p, '--deployment'); if (dpl) dep(w, dpl);
        return { out: `Guardrail ${name} applied to ${dpl ? `deployment ${dpl}` : 'agent support-agent'}`, ev: ['agt.plan.guardrail.apply', { name, target: dpl ? 'deployment' : 'agent' }] };
      }
      if (cmd === 'test') {
        const name = one(p, '--name') ?? ''; const g = st.guard[name] ?? fail(`Guardrail '${name}' doesn't exist. Create it first.`, 'Python');
        const text = p.raw.slice(1).join(' ') || one(p, '--text') || '';
        const hit = /ignore (all )?(previous|prior) instructions/i.test(text) ? 'jailbreak' : /hidden instructions|<!--/i.test(text) ? 'indirect-attack' : '';
        const caught = hit && g.risks.includes(hit);
        return { out: caught ? `Blocked: ${hit} detected at ${hit === 'jailbreak' ? 'input' : 'tool-response'}` : hit ? `Not caught: ${hit} isn't in this guardrail's risks` : 'Allowed: no risk found', ev: ['agt.plan.guardrail.test', { name, hit, caught: !!caught }] };
      }
      return fail('usage: python guardrail.py create --name N --risks a,b --points input,output --action block | apply --name N [--deployment D] | test "text" --name N', 'Python');
    },
  },
  'run_evals.py': {
    src: `# run_evals.py: run built-in evaluators on a test set
# quality: groundedness, relevance, coherence   agent: tool_call_accuracy, task_adherence   safety: violence, hate_unfairness`,
    run: (a) => {
      const p = parse(a); const ev = many(p, '--evaluators').flatMap((x) => x.split(',')).filter(Boolean);
      if (!ev.length) fail('usage: python run_evals.py --evaluators groundedness relevance tool_call_accuracy', 'Python');
      const S2: Record<string, string> = { groundedness: '4.5', relevance: '4.7', coherence: '4.8', tool_call_accuracy: '0.94', task_adherence: '0.91', violence: '0 defects', hate_unfairness: '0 defects' };
      return { out: `Evaluation run on 120 rows\n${ev.map((e) => `  ${e.padEnd(20)} ${S2[lc(e)] ?? '(unknown evaluator)'}`).join('\n')}\nResults saved to the Evaluations page.`, ev: ['agt.plan.eval', { evaluators: ev.map(lc) }] };
    },
  },
  'red_team.py': {
    src: `# red_team.py: the AI red teaming agent attacks your target before launch
# attack strategies: base64, flip, jailbreak, multi-turn   risk categories: violence, hate_unfairness, self_harm, sexual`,
    run: (a) => {
      const p = parse(a); const n = Number(one(p, '--attacks') ?? 0);
      if (!(n > 0)) fail('usage: python red_team.py --attacks 120', 'Python');
      return { out: `Red team scan: ${n} attacks, 4 strategies\n  Attack success rate  2.5% (3 of ${n} got through)\nFix the weak spots, add the guardrail control that covers them, then scan again.`, ev: ['agt.plan.redteam', { attacks: n }] };
    },
  },
  'show_trace.py': {
    src: `# show_trace.py: replay one trace from Application Insights
# a trace has spans: model call, tool call, approval, guardrail result`,
    run: (a) => {
      const p = parse(a); const id = one(p, '--id') ?? 'tr-8f3c';
      return { out: `Trace ${id}\n  10:41:58  user        "refund order 48213"\n  10:41:59  model       gpt-4.1-mini  1,204 tokens\n  10:42:00  tool call   issue_refund(order=48213, amount=2400)  -> approval required\n  10:42:31  approval    approved by j.rao@contoso.example\n  10:42:32  tool result refund queued\n  10:42:33  guardrail   output ok`, ev: ['agt.plan.trace', { id }] };
    },
  },
  'agent_policy.py': {
    src: `# agent_policy.py: least privilege for an agent
# --allow tools the agent may call   --require-approval tools that pause for a human
# --egress allow-list limits where a hosted agent may connect`,
    run: (a, w) => {
      const p = parse(a); const allow = (many(p, '--allow').join(',') || '').split(',').filter(Boolean); const appr = (many(p, '--require-approval').join(',') || '').split(',').filter(Boolean);
      if (!allow.length) fail('usage: python agent_policy.py --allow lookup_order,issue_refund --require-approval issue_refund [--egress allow-list]', 'Python');
      const st = S(w); st.policy = { allow, approval: appr, egress: lc(one(p, '--egress') ?? 'open') };
      return { out: `Policy saved\n  allowed tools     ${allow.join(', ')}\n  need approval     ${appr.join(', ') || 'none'}\n  network egress    ${st.policy.egress}`, ev: ['agt.plan.policy', { allow, approval: appr, egress: st.policy.egress }] };
    },
  },
  'agent_run.py': {
    src: `# agent_run.py: ask the agent to use one tool and see what the policy does
# --tool name   --approve | --reject  (what the human reviewer decides)`,
    run: (a, w) => {
      const p = parse(a); const tool = one(p, '--tool') ?? fail('usage: python agent_run.py --tool lookup_order|issue_refund|delete_customer [--approve|--reject]', 'Python');
      const pol = S(w).policy;
      if (!pol.allow.length) fail('No policy yet. Run agent_policy.py first.', 'Python');
      let result: string; let outcome: string;
      if (!pol.allow.includes(tool)) { result = `Denied: ${tool} isn't an allowed tool for this agent.`; outcome = 'denied'; }
      else if (pol.approval.includes(tool)) {
        if (has(p, '--approve')) { result = `${tool}: waiting for approval... approved by a human. Done.`; outcome = 'approved'; }
        else if (has(p, '--reject')) { result = `${tool}: waiting for approval... rejected by the reviewer. Nothing happened.`; outcome = 'rejected'; }
        else { result = `${tool}: paused. A human must approve or reject (add --approve or --reject).`; outcome = 'pending'; }
      } else { result = `${tool}: allowed, no approval needed. Done.`; outcome = 'allowed'; }
      return { out: result, ev: ['agt.plan.agentrun', { tool, outcome }] };
    },
  },
};
void peek;
const FILES: Record<string, string> = {
  'pipeline.yml': `name: deploy-agent
on: { pull_request: { branches: [main] } }
permissions: { id-token: write, contents: read }     # lets the job ask for an OIDC token
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: azure/login@v2                         # workload identity federation, no secret stored
        with: { client-id: \${{ vars.AZURE_CLIENT_ID }}, tenant-id: \${{ vars.AZURE_TENANT_ID }}, subscription-id: \${{ vars.AZURE_SUBSCRIPTION_ID }} }
      - run: az deployment group create -g rg-dev -f infra/main.bicep
      - run: python run_evals.py --evaluators groundedness relevance   # the evaluation gate
      - run: python promote.py --from dev --to prod`,
};
const MINE = new Set([...Object.keys(APPS), ...Object.keys(FILES)]);

function runApp(file: string, argv: string[], w: World): AdminOut {
  try {
    const r = APPS[file].run(argv, w);
    w.emit('py.run', { file, ok: true, args: argv });
    if (r.ev) w.emit(r.ev[0], r.ev[1]);
    return { out: r.out };
  } catch (e) {
    if (e instanceof SimError) {
      w.emit('py.run', { file, ok: false, args: argv, error: e.message.split('\n')[0] });
      return { error: e.code === 'Python' ? `Traceback (most recent call last):\n  File "/home/learner/${file}", line 6, in <module>\n${e.message}` : `Traceback (most recent call last):\n  File "/home/learner/${file}"\nazure.core.exceptions.HttpResponseError: (${e.code}) ${e.message}` };
    }
    throw e;
  }
}

export function shell(tokens: string[], w: World): AdminOut | null {
  const c = tokens[0]?.toLowerCase();
  const rest = tokens.slice(1);
  if (c === 'cat' && rest[0] && MINE.has(rest[0])) {
    w.emit('py.view', { file: rest[0] });
    return { out: APPS[rest[0]]?.src ?? FILES[rest[0]] };
  }
  if ((c === 'python' || c === 'python3') && rest[0] && APPS[rest[0]]) return runApp(rest[0], rest.slice(1), w);
  return null;
}

export const COMPLETIONS: string[] = [
  ...Object.keys(APPS).map((f) => `python ${f}`),
  'cat pipeline.yml',
  'az cognitiveservices usage list --location eastus',
];
