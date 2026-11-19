/**
 * Developer terminal for the GH-300 practice labs (EDUCATION ONLY).
 * A small repo on disk, git, the GitHub Copilot CLI (install, /login, the
 * trusted-folder prompt, slash commands, -p with tool permissions, sessions,
 * custom agents, MCP servers, /delegate) and `gh api` for Copilot seats and
 * the organization audit log.
 *
 * Nothing here calls GitHub or a model: Copilot's answers are canned, picked
 * by keyword, and every action emits an event so lab checks can see what the
 * learner did. Commands and flags follow docs.github.com (checked 19 Nov 2026);
 * output is simplified.
 */
import type { World } from './world';
import type { CliResult } from './cli';

export type DevResult = CliResult & { /** Prompt to show after this command (Copilot session or bash). */ prompt?: string };

export const BASH_PROMPT = 'learner@dev:~/contoso-shop$';
export const COPILOT_PROMPT = 'copilot ❯';
const ORG = 'contoso';

/* ------------------------------------------------------------------ */
/* state                                                               */
/* ------------------------------------------------------------------ */
interface Seat { login: string; team?: string; last: string; editor: string }
interface GhState {
  files: Record<string, string>;
  node: string;
  installed: boolean;
  via?: string;
  loggedIn: boolean;
  trusted: boolean;
  session: boolean;
  sessionId: number;
  sessions: { id: number; title: string; turns: number }[];
  model: string;
  turns: number;
  tokens: number;
  approvals: string[];
  mcp: { name: string; type: string; tools: string[]; builtin?: boolean }[];
  context: string[];
  staged: string[];
  commits: string[];
  prs: { n: number; title: string; by: string }[];
  seats: Seat[];
  audit: { action: string; actor: string; user?: string; at: string }[];
}

const SEED_FILES: Record<string, string> = {
  'README.md': '# contoso-shop\n\nA small Node.js shop API used in the MSDEVBUILD GH-300 labs.\n\nnpm test   runs the unit tests (Node test runner).',
  'package.json': '{\n  "name": "contoso-shop",\n  "version": "1.4.0",\n  "type": "module",\n  "scripts": { "test": "node --test tests/" }\n}',
  'src/cart.js': "import { applyDiscount } from './discount.js';\n\nexport function cartTotal(items, code) {\n  let total = 0;\n  for (const i of items) total += i.price * i.qty;\n  return applyDiscount(total, code);\n}",
  'src/discount.js': "const CODES = { SAVE10: 10, HALF: 50 };\n\nexport function applyDiscount(total, code) {\n  const pct = CODES[code];\n  return total - (total * pct) / 100;\n}",
  'src/legacy/report.js': "// 2014 code, still in production\nvar report = function (rows, cb) {\n  var out = '';\n  for (var i = 0; i < rows.length; i++) { out = out + rows[i].name + ',' + rows[i].total + '\\n'; }\n  cb(null, out);\n};\nmodule.exports = report;",
  'tests/cart.test.js': "import test from 'node:test';\nimport assert from 'node:assert';\nimport { cartTotal } from '../src/cart.js';\n\ntest('adds line items', () => {\n  assert.equal(cartTotal([{ price: 10, qty: 2 }], 'SAVE10'), 18);\n});",
  'logs/app-2026-11-17.log': '…',
  'logs/app-2026-11-18.log': '…',
  'logs/app-2026-11-19.log': '…',
  '.env': 'PAYMENT_API_KEY=sk_test_practice_only_do_not_use',
  '.gitignore': 'node_modules/\n.env\nlogs/',
};

const today = () => new Date().toISOString().slice(0, 10);
function st(w: World): GhState {
  const d = (w as any).dev as Record<string, any>;
  d.gh ??= {
    files: { ...SEED_FILES }, node: 'v22.11.0', installed: false, loggedIn: false, trusted: false, session: false, sessionId: 0, sessions: [],
    model: 'Auto', turns: 0, tokens: 0, approvals: [], context: [], staged: [], commits: ['a1f3c9e Add cart total'], prs: [],
    mcp: [{ name: 'github-mcp-server', type: 'remote (built in)', tools: ['issues', 'pull_requests', 'repos', 'actions'], builtin: true }],
    seats: [
      { login: 'asha-dev', team: 'web', last: '2026-11-18', editor: 'vscode/1.106' },
      { login: 'ben-ops', team: 'platform', last: '2026-11-19', editor: 'copilot-cli' },
      { login: 'chen-qa', last: '2026-09-02', editor: 'jetbrains/2026.2' },
    ],
    audit: [],
  } satisfies GhState;
  return d.gh as GhState;
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
function tokenize(line: string): string[] {
  const out: string[] = [];
  let cur = '', q: string | null = null, any = false;
  for (const ch of line) {
    if (q) { if (ch === q) q = null; else cur += ch; continue; }
    if (ch === '"' || ch === "'") { q = ch; any = true; continue; }
    if (/\s/.test(ch)) { if (cur || any) out.push(cur); cur = ''; any = false; continue; }
    cur += ch;
  }
  if (cur || any) out.push(cur);
  return out;
}
const norm = (p: string) => p.replace(/^\.\//, '').replace(/^~\/contoso-shop\//, '').replace(/\/+$/, '');
const exists = (s: GhState, p: string) => p in s.files || Object.keys(s.files).some((f) => f.startsWith(`${p}/`));
const ok = (out: string, prompt?: string): DevResult => ({ out, prompt });
const err = (error: string): DevResult => ({ error });
const prompt = (s: GhState) => (s.session ? COPILOT_PROMPT : BASH_PROMPT);

/** Which tool a Copilot action needs, written the way --allow-tool / --deny-tool expect it. */
type Tool = 'write' | `shell(${string})` | `${string}(${string})`;
function allowed(tool: Tool, allow: string[], deny: string[]) {
  const m = (pat: string) => pat === tool || (pat === 'shell' && tool.startsWith('shell(')) || (pat.endsWith('(*)') && tool.startsWith(pat.slice(0, -3)));
  if (deny.some(m)) return 'denied';
  if (allow.includes('*') || allow.some(m)) return 'allowed';
  return 'ask';
}

/* ------------------------------------------------------------------ */
/* Copilot's canned "answers"                                          */
/* ------------------------------------------------------------------ */
interface Plan { say: string; actions: { tool: Tool; label: string; run: () => string }[]; kind: string }
function plan(w: World, text: string, agent?: string): Plan {
  const s = st(w);
  const t = text.toLowerCase();
  const instr = s.files['.github/copilot-instructions.md'] ?? s.files['AGENTS.md'];
  const scoped = Object.entries(s.files).filter(([f]) => f.startsWith('.github/instructions/') && f.endsWith('.instructions.md'));
  const agentFile = agent ? s.files[`.github/agents/${agent}.agent.md`] ?? s.files[`~/.copilot/agents/${agent}.agent.md`] : undefined;
  const notes: string[] = [];
  if (instr) notes.push(`📎 Using repository instructions (${s.files['.github/copilot-instructions.md'] ? '.github/copilot-instructions.md' : 'AGENTS.md'}).`);
  if (scoped.length && /test/.test(t)) notes.push(`📎 Using ${scoped.map(([f]) => f).join(', ')} (applyTo matched tests/).`);
  if (agentFile) notes.push(`🤖 Running as custom agent "${agent}".`);
  const head = notes.length ? `${notes.join('\n')}\n` : '';
  const usesJest = /jest/i.test(instr ?? '');

  // Questions about issues and PRs go to the GitHub MCP server (checked before "bug"/"fix").
  if (/\bissues?\b|pull requests?|\bprs?\b/.test(t) && !/\bfix\b/.test(t)) {
    const gh = s.mcp.find((m) => m.builtin);
    return {
      kind: 'mcp', say: `${head}I'll ask the GitHub MCP server for open issues labelled "bug" in ${ORG}/contoso-shop.`,
      actions: [{ tool: `${gh?.name ?? 'github-mcp-server'}(list_issues)` as Tool, label: 'Call MCP tool github-mcp-server › list_issues', run: () => { w.emit('gh.mcp.call', { server: 'github-mcp-server', tool: 'list_issues' }); return '✔ 2 open bugs:\n  #41  Discount code HALF applies twice on refresh\n  #44  Cart total shows NaN for unknown codes'; } }],
    };
  }
  if (/backup|script|\.sh\b|bash/.test(t)) {
    return {
      kind: 'script', say: `${head}I'll write scripts/backup-logs.sh: it zips logs/ into backups/logs-<date>.tar.gz and keeps the last 7 archives.`,
      actions: [
        { tool: 'write', label: 'Create scripts/backup-logs.sh', run: () => { s.files['scripts/backup-logs.sh'] = '#!/usr/bin/env bash\nset -euo pipefail\nmkdir -p backups\ntar -czf "backups/logs-$(date +%F).tar.gz" logs/\nls -1t backups/logs-*.tar.gz | tail -n +8 | xargs -r rm --\necho "Backed up logs/ to backups/"'; w.emit('gh.file', { path: 'scripts/backup-logs.sh', by: 'copilot' }); return '✔ Created scripts/backup-logs.sh (5 lines)'; } },
        { tool: 'shell(chmod)', label: 'Run: chmod +x scripts/backup-logs.sh', run: () => { w.emit('gh.shell', { cmd: 'chmod' }); return '✔ chmod +x scripts/backup-logs.sh'; } },
      ],
    };
  }
  if (/organi[sz]e|archive|move .*log|tidy/.test(t)) {
    return {
      kind: 'files', say: `${head}I'll move the log files older than today into logs/archive/.`,
      actions: [{ tool: 'shell(mv)', label: 'Run: mkdir -p logs/archive && mv logs/app-2026-11-1[78].log logs/archive/', run: () => {
        for (const f of ['logs/app-2026-11-17.log', 'logs/app-2026-11-18.log']) if (s.files[f]) { s.files[f.replace('logs/', 'logs/archive/')] = s.files[f]; delete s.files[f]; }
        w.emit('gh.files.moved', { to: 'logs/archive' }); return '✔ Moved 2 files to logs/archive/';
      } }],
    };
  }
  if (/test/.test(t) && !/fix/.test(t)) {
    const style = usesJest ? 'Jest' : 'the Node test runner';
    return {
      kind: 'tests', say: `${head}I'll add unit tests for applyDiscount with ${style}, including edge cases: an unknown code, no code at all and an empty cart.${scoped.length ? ' Following your test instructions: Arrange / Act / Assert, one behaviour per test.' : ''}`,
      actions: [{ tool: 'write', label: 'Create tests/discount.test.js', run: () => {
        s.files['tests/discount.test.js'] = "import test from 'node:test';\nimport assert from 'node:assert';\nimport { applyDiscount } from '../src/discount.js';\n\ntest('SAVE10 takes 10% off', () => assert.equal(applyDiscount(100, 'SAVE10'), 90));\ntest('unknown code leaves the total unchanged', () => assert.equal(applyDiscount(100, 'NOPE'), 100));\ntest('no code leaves the total unchanged', () => assert.equal(applyDiscount(100), 100));\ntest('empty cart stays at 0', () => assert.equal(applyDiscount(0, 'HALF'), 0));";
        w.emit('gh.tests.created', { file: 'tests/discount.test.js', edgeCases: true, instructions: Boolean(scoped.length || instr) });
        return '✔ Created tests/discount.test.js (4 tests)';
      } }],
    };
  }
  if (/fix|bug|unknown code|nan/.test(t)) {
    return {
      kind: 'fix', say: `${head}The tests show applyDiscount returns NaN when the code is unknown: CODES[code] is undefined. I'll default the percentage to 0.`,
      actions: [{ tool: 'write', label: 'Edit src/discount.js (1 line)', run: () => { s.files['src/discount.js'] = s.files['src/discount.js'].replace('const pct = CODES[code];', 'const pct = CODES[code] ?? 0;'); w.emit('gh.fix', { file: 'src/discount.js' }); return '✔ Edited src/discount.js\n- const pct = CODES[code];\n+ const pct = CODES[code] ?? 0;'; } }],
    };
  }
  if (/moderni[sz]e|legacy|refactor/.test(t)) {
    return {
      kind: 'modernize', say: `${head}src/legacy/report.js uses var, a callback and string concatenation in a loop. I'll rewrite it as an ES module with const, map/join and a plain return value, and keep the same output so callers don't break.`,
      actions: [{ tool: 'write', label: 'Edit src/legacy/report.js', run: () => { s.files['src/legacy/report.js'] = "// Modernized with Copilot: same CSV output as before\nexport function report(rows) {\n  return rows.map((r) => `${r.name},${r.total}`).join('\\n') + '\\n';\n}"; w.emit('gh.modernize', { file: 'src/legacy/report.js' }); return '✔ Edited src/legacy/report.js (7 → 4 lines)'; } }],
    };
  }
  if (/sample data|seed|fake|mock data/.test(t)) {
    return {
      kind: 'data', say: `${head}I'll write 5 sample orders to data/sample-orders.json. They're made up: no real names, emails or card numbers.`,
      actions: [{ tool: 'write', label: 'Create data/sample-orders.json', run: () => { s.files['data/sample-orders.json'] = JSON.stringify([1, 2, 3, 4, 5].map((n) => ({ id: `ord-${1000 + n}`, customer: `Test Customer ${n}`, email: `customer${n}@example.com`, items: n, total: 12.5 * n })), null, 2); w.emit('gh.sampledata', {}); return '✔ Created data/sample-orders.json (5 orders, example.com emails)'; } }],
    };
  }
  if (/doc|readme|comment/.test(t)) {
    return { kind: 'docs', say: `${head}I'll add JSDoc to cartTotal and applyDiscount describing the parameters and the return value.`, actions: [{ tool: 'write', label: 'Edit src/cart.js and src/discount.js', run: () => { s.files['src/cart.js'] = `/**\n * Sums price × qty for every item, then applies a discount code.\n * @param {{price:number, qty:number}[]} items\n * @param {string} [code]\n * @returns {number}\n */\n${s.files['src/cart.js']}`; w.emit('gh.docs', {}); return '✔ Added JSDoc to 2 functions'; } }] };
  }
  if (/explain|what does|how does/.test(t)) {
    return { kind: 'explain', say: `${head}cartTotal multiplies price by qty for each item, adds them up and passes the total to applyDiscount, which looks the code up in CODES and subtracts that percentage. Watch out: an unknown code makes CODES[code] undefined, so the result is NaN.`, actions: [] };
  }
  return { kind: 'chat', say: `${head}Here's what I'd do: read the files involved, propose a small change, then run the tests. Try asking for something concrete, for example "write unit tests for src/discount.js", "write a bash script that backs up logs/" or "explain src/cart.js".`, actions: [] };
}

/** Runs a plan. In -p mode permissions come from flags; interactively Copilot asks. */
function execute(w: World, p: Plan, allow: string[], deny: string[], interactive: boolean, agent?: string): DevResult {
  const s = st(w);
  s.turns++; s.tokens += 1800 + p.say.length * 3;
  const lines = [`● ${p.say}`];
  const queue = [...p.actions];
  const step = (): DevResult => {
    while (queue.length) {
      const a = queue.shift()!;
      const v = interactive && s.approvals.includes(a.tool) ? 'allowed' : allowed(a.tool, allow, deny);
      if (v === 'denied') { lines.push(`✖ ${a.label}: blocked by --deny-tool. Nothing was changed.`); w.emit('gh.tool.denied', { tool: a.tool }); continue; }
      if (v === 'allowed') { lines.push(a.run()); w.emit('gh.tool.run', { tool: a.tool }); continue; }
      if (!interactive) { lines.push(`✖ ${a.label}: needs permission for "${a.tool}". Non-interactive runs can't ask, so rerun with --allow-tool '${a.tool}' (or --allow-all-tools if you trust the task).`); w.emit('gh.tool.blocked', { tool: a.tool }); continue; }
      const out = lines.join('\n');
      lines.length = 0;
      return {
        out, prompt: COPILOT_PROMPT,
        confirm: { question: `Allow Copilot to use ${a.tool}? ${a.label} (y/n, yes lasts this session) `, then: () => { lines.push(a.run()); w.emit('gh.tool.run', { tool: a.tool, approved: true }); s.approvals.push(a.tool); return step(); } },
      };
    }
    w.emit('copilot.prompt', { kind: p.kind, interactive, agent, model: s.model, instructions: /repository instructions/.test(p.say) });
    return ok(lines.join('\n'), prompt(s));
  };
  return step();
}

/* ------------------------------------------------------------------ */
/* Copilot CLI                                                         */
/* ------------------------------------------------------------------ */
function needInstall(s: GhState) { return s.installed ? null : err('copilot: command not found. Install it first: npm install -g @github/copilot (needs Node.js 22 or later).'); }

function startSession(w: World, first?: string, resume?: boolean): DevResult {
  const s = st(w);
  const open = (): DevResult => {
    s.session = true;
    if (!resume || !s.sessions.length) { s.sessionId = (s.sessions.at(-1)?.id ?? 0) + 1; s.sessions.push({ id: s.sessionId, title: first?.slice(0, 40) ?? 'New session', turns: 0 }); }
    w.emit('copilot.session', { resumed: Boolean(resume), id: s.sessionId });
    const hello = [`GitHub Copilot CLI · model: ${s.model} · ${s.loggedIn ? 'signed in as learner' : 'not signed in'}`, resume ? `↺ Resumed session #${s.sessionId} (${s.sessions.find((x) => x.id === s.sessionId)?.turns ?? 0} turns).` : '', s.loggedIn ? 'Type a request, a /command, @file to add a file, or !cmd to run a shell command. /exit leaves.' : 'You are not signed in. Type /login to continue.'].filter(Boolean).join('\n');
    if (first && s.loggedIn) { const r = execute(w, plan(w, first), [], [], true); return { ...r, out: `${hello}\n${r.out ?? ''}` }; }
    return ok(hello, COPILOT_PROMPT);
  };
  if (!s.trusted) {
    return {
      out: 'Confirm folder trust\n  ~/contoso-shop\nCopilot may read files in this folder, and with your approval it can edit them and run commands here.',
      confirm: { question: 'Do you trust the files in this folder? (y/n) ', then: () => { s.trusted = true; w.emit('copilot.trust', {}); return open(); } },
    };
  }
  return open();
}

function slash(w: World, line: string): DevResult {
  const s = st(w);
  const [cmd, ...rest] = tokenize(line);
  const arg = rest.join(' ');
  const c = cmd.toLowerCase();
  if (c !== '/login' && c !== '/help' && c !== '/exit' && c !== '/quit' && !s.loggedIn) return err('Not signed in. Run /login first.');
  switch (c) {
    case '/help': return ok(['Slash commands (simulated subset):', '  /login /logout        sign in or out', '  /model [name|auto]    pick a model', '  /mcp [list|show|add]  MCP servers', '  /agent                pick a custom agent', '  /delegate <task>      hand the task to Copilot coding agent (opens a PR)', '  /session /usage /context /compact /clear', '  /init                 create repository custom instructions', '  /exit                 leave the session', 'Also: @path adds a file to the context, !cmd runs a shell command.'].join('\n'), COPILOT_PROMPT);
    case '/login': {
      if (s.loggedIn) return ok('Already signed in as learner.', COPILOT_PROMPT);
      return { out: '! First copy your one-time code: 7F2C-9A1D\nPress Enter to open github.com/login/device in your browser…', confirm: { question: 'Did you approve the device code in the browser? (y/n) ', then: () => { s.loggedIn = true; w.emit('copilot.login', { method: 'device' }); return ok('✔ Signed in to GitHub as learner (Copilot Business seat via contoso).', COPILOT_PROMPT); } } };
    }
    case '/logout': s.loggedIn = false; return ok('Signed out.', COPILOT_PROMPT);
    case '/model': case '/models': {
      const models = ['Auto', 'claude-sonnet-4.5', 'gpt-5', 'gpt-5-mini', 'gemini-2.5-pro'];
      if (!arg) return ok(`Current model: ${s.model}\nAvailable (example list; your plan and org policy decide the real one):\n${models.map((m) => `  ${m === s.model ? '●' : '○'} ${m}`).join('\n')}\nUse /model <name> or /model auto.`, COPILOT_PROMPT);
      const pick = models.find((m) => m.toLowerCase() === arg.replace(/^--\w+\s*/, '').toLowerCase());
      if (!pick) return err(`Unknown model "${arg}". Run /model to see the list.`);
      s.model = pick; w.emit('copilot.model', { model: pick });
      return ok(`✔ Model set to ${pick} for this session.`, COPILOT_PROMPT);
    }
    case '/mcp': {
      const [sub = 'list', name] = rest;
      if (sub === 'list') { w.emit('copilot.mcp.list', {}); return ok(s.mcp.map((m) => `  ${m.builtin ? '★' : '•'} ${m.name}  (${m.type})  tools: ${m.tools.join(', ')}`).join('\n'), COPILOT_PROMPT); }
      if (sub === 'show') { const m = s.mcp.find((x) => x.name === name); return m ? ok(`${m.name}\n  type: ${m.type}\n  tools: ${m.tools.join(', ')}`, COPILOT_PROMPT) : err(`No MCP server named "${name}".`); }
      if (sub === 'add') {
        if (!name) return err('Usage: /mcp add <name>   (the real CLI opens a form for type, command or URL, and tools)');
        if (s.mcp.some((x) => x.name === name)) return err(`"${name}" already exists.`);
        const tools = name.includes('playwright') ? ['browser_navigate', 'browser_click', 'browser_snapshot'] : name.includes('docs') ? ['search_docs', 'fetch_doc'] : ['run'];
        s.mcp.push({ name, type: name.includes('docs') ? 'http' : 'local (npx)', tools });
        s.files['~/.copilot/mcp-config.json'] = JSON.stringify({ mcpServers: Object.fromEntries(s.mcp.filter((m) => !m.builtin).map((m) => [m.name, { type: m.type.startsWith('http') ? 'http' : 'local', tools: ['*'] }])) }, null, 2);
        w.emit('copilot.mcp.add', { name });
        return ok(`✔ Added MCP server "${name}" to ~/.copilot/mcp-config.json. Tools: ${tools.join(', ')}`, COPILOT_PROMPT);
      }
      if (sub === 'delete' || sub === 'remove') { s.mcp = s.mcp.filter((x) => x.name !== name || x.builtin); w.emit('copilot.mcp.delete', { name }); return ok(`Removed "${name}".`, COPILOT_PROMPT); }
      return err('Usage: /mcp [list|show <name>|add <name>|delete <name>]');
    }
    case '/agent': case '/agents': {
      const agents = Object.keys(s.files).filter((f) => /agents\/[^/]+\.agent\.md$/.test(f)).map((f) => f.split('/').pop()!.replace('.agent.md', ''));
      w.emit('copilot.agent.list', { count: agents.length });
      return ok(agents.length ? `Custom agents:\n${agents.map((a) => `  • ${a}`).join('\n')}\nRun one with: copilot --agent=<name> -p "…"` : 'No custom agents yet. Add one as .github/agents/<name>.agent.md (repo) or ~/.copilot/agents/<name>.agent.md (you).', COPILOT_PROMPT);
    }
    case '/delegate': {
      if (!arg) return err('Usage: /delegate <task>');
      const n = 45 + s.prs.length;
      s.prs.push({ n, title: `[WIP] ${arg.slice(0, 50)}`, by: 'Copilot' });
      w.emit('copilot.delegate', { task: arg, pr: n });
      return ok(`✔ Handed off to Copilot coding agent.\n  It works in a GitHub Actions environment on branch copilot/${arg.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 4).join('-')}\n  and opened draft pull request #${n}. You'll be asked to review it.\n  Your local session keeps going.`, COPILOT_PROMPT);
    }
    case '/session': case '/sessions': return ok(`Session #${s.sessionId} · ${s.sessions.find((x) => x.id === s.sessionId)?.turns ?? 0} turns · model ${s.model}\nFiles changed: ${Object.keys(s.files).filter((f) => !(f in SEED_FILES)).join(', ') || 'none'}`, COPILOT_PROMPT);
    case '/usage': w.emit('copilot.usage', {}); return ok(`This session: ${s.turns} requests · ~${s.tokens.toLocaleString()} tokens · model ${s.model}\nUsage counts toward your plan's allowance (example numbers).`, COPILOT_PROMPT);
    case '/context': w.emit('copilot.context', {}); return ok(`Context window: ~${Math.min(95, 8 + s.turns * 9)}% used\nFiles in context: ${s.context.join(', ') || '(none added with @)'}\nTip: /compact summarizes the history to free space; /clear starts fresh.`, COPILOT_PROMPT);
    case '/compact': s.tokens = Math.round(s.tokens * 0.3); w.emit('copilot.compact', {}); return ok('✔ Summarized the conversation. Context window: ~12% used.', COPILOT_PROMPT);
    case '/clear': case '/new': case '/reset': s.context = []; s.turns = 0; s.approvals = []; w.emit('copilot.clear', {}); return ok('✔ New conversation. Earlier messages are no longer in context.', COPILOT_PROMPT);
    case '/init': {
      s.files['.github/copilot-instructions.md'] ??= '# Copilot instructions for contoso-shop\n- Node.js 22, ES modules.\n- Tests use the Node test runner (node --test), one behaviour per test.\n- Never log or commit secrets; read config from environment variables.';
      w.emit('gh.file', { path: '.github/copilot-instructions.md', by: 'init' });
      return ok('✔ Created .github/copilot-instructions.md from what I found in the repo. Review and edit it: Copilot adds it to every request in this repository.', COPILOT_PROMPT);
    }
    case '/exit': case '/quit': {
      s.session = false;
      const cur = s.sessions.find((x) => x.id === s.sessionId); if (cur) cur.turns += s.turns;
      w.emit('copilot.exit', {});
      return ok(`Session #${s.sessionId} saved. Resume it later with: copilot --continue`, BASH_PROMPT);
    }
    default: return err(`Unknown command ${cmd}. Type /help.`);
  }
}

function copilotCmd(w: World, args: string[]): DevResult {
  const s = st(w);
  const miss = needInstall(s); if (miss) return miss;
  if (args[0] === 'version' || args[0] === '--version' || args[0] === '-v') return ok('GitHub Copilot CLI 0.0.372 (simulated)');
  if (args[0] === 'update') return ok('✔ Already on the latest version.');
  if (args[0] === 'help' || args[0] === '--help' || args[0] === '-h') return ok(['Usage: copilot [options]', '  -p, --prompt <text>      run one prompt non-interactively, then exit', '  -i, --interactive <text> start a session that runs this prompt first', '  --allow-tool <tool>      allow a tool without asking, e.g. \'write\', \'shell(git)\'', '  --deny-tool <tool>       never allow a tool (deny wins over allow)', '  --allow-all-tools        allow every tool (use with care)', '  --model <name|auto>      choose the model', '  --agent <name>           run as a custom agent', '  --continue               resume the most recent session here', '  --resume [id]            pick a session to resume', '  login                    sign in from the shell', '  version | update'].join('\n'));
  if (args[0] === 'login') { s.loggedIn = true; w.emit('copilot.login', { method: 'shell' }); return ok('✔ Signed in to GitHub as learner (device flow).'); }
  const allow: string[] = [], deny: string[] = [];
  let p: string | undefined, i: string | undefined, agent: string | undefined, cont = false, resume = false;
  for (let k = 0; k < args.length; k++) {
    const a = args[k];
    const val = (name: string) => (a.startsWith(`${name}=`) ? a.slice(name.length + 1) : args[++k]);
    if (a === '-p' || a.startsWith('--prompt')) p = a.startsWith('--prompt=') ? a.slice(9) : args[++k];
    else if (a === '-i' || a.startsWith('--interactive')) i = a.startsWith('--interactive=') ? a.slice(14) : args[++k];
    else if (a.startsWith('--allow-tool')) allow.push(...(val('--allow-tool') ?? '').split(',').map((x) => x.trim()).filter(Boolean));
    else if (a.startsWith('--deny-tool')) deny.push(...(val('--deny-tool') ?? '').split(',').map((x) => x.trim()).filter(Boolean));
    else if (a === '--allow-all-tools' || a === '--allow-all' || a === '--yolo') allow.push('*');
    else if (a.startsWith('--model')) s.model = val('--model') ?? s.model;
    else if (a.startsWith('--agent')) agent = val('--agent');
    else if (a === '--continue') cont = true;
    else if (a.startsWith('--resume')) resume = true;
    else return err(`Unknown option ${a}. Try copilot --help.`);
  }
  if (cont || resume) { if (!s.sessions.length) return err('No earlier session in this folder. Start one with: copilot'); return startSession(w, undefined, true); }
  if (p !== undefined) {
    if (!s.loggedIn) return err('Not signed in. Run copilot login (or set COPILOT_GITHUB_TOKEN / GH_TOKEN) first.');
    if (agent && !s.files[`.github/agents/${agent}.agent.md`] && !s.files[`~/.copilot/agents/${agent}.agent.md`]) return err(`No custom agent named "${agent}". Create .github/agents/${agent}.agent.md first.`);
    w.emit('copilot.programmatic', { allow, deny, agent });
    return execute(w, plan(w, p, agent), allow, deny, false, agent);
  }
  return startSession(w, i);
}

/* ------------------------------------------------------------------ */
/* gh api: Copilot seats and the audit log                             */
/* ------------------------------------------------------------------ */
function ghCmd(w: World, args: string[]): DevResult {
  const s = st(w);
  if (args[0] === 'auth' && args[1] === 'status') return ok('github.com\n  ✓ Logged in to github.com account learner (keyring)\n  - Token scopes: manage_billing:copilot, read:org, read:audit_log, repo');
  if (args[0] === 'pr' && args[1] === 'list') return ok(s.prs.length ? s.prs.map((p) => `#${p.n}  ${p.title}  (${p.by})`).join('\n') : 'No open pull requests.');
  if (args[0] === 'copilot') return err('The gh-copilot extension has been replaced by GitHub Copilot CLI. Install it with: npm install -g @github/copilot, then run copilot.');
  if (args[0] !== 'api') return err('Simulated gh supports: gh api …, gh auth status, gh pr list.');
  let method = 'GET';
  const fields: [string, string][] = [];
  let path = '';
  for (let k = 1; k < args.length; k++) {
    const a = args[k];
    if (a === '-X' || a === '--method') method = (args[++k] ?? 'GET').toUpperCase();
    else if (a === '-f' || a === '-F' || a === '--field' || a === '--raw-field') { const [key, ...v] = (args[++k] ?? '').split('='); fields.push([key, v.join('=')]); }
    else if (a === '-H' || a === '--header' || a === '--paginate' || a === '--jq' || a === '-q') { if (a !== '--paginate') k++; }
    else if (!path) path = a;
  }
  if (!path) return err('Usage: gh api <endpoint> [-X METHOD] [-f key=value]');
  const [pth, qs = ''] = path.replace(/^\//, '').split('?');
  const q = new URLSearchParams(qs);
  if (fields.length && method === 'GET' && !/selected_users/.test(pth)) fields.forEach(([k, v]) => q.set(k, v));
  if (fields.length && method === 'GET' && /selected_users/.test(pth)) method = 'POST';
  const j = (v: unknown) => ok(JSON.stringify(v, null, 2));
  const users = fields.filter(([k]) => k.startsWith('selected_usernames')).map(([, v]) => v);
  if (!pth.startsWith(`orgs/${ORG}/`)) return err(`gh: Not Found (HTTP 404). Use the practice org: /orgs/${ORG}/…`);
  const rest = pth.slice(`orgs/${ORG}/`.length);
  switch (`${method} ${rest}`) {
    case 'GET copilot/billing':
      w.emit('gh.api', { path: rest, method });
      return j({ seat_breakdown: { total: s.seats.length, added_this_cycle: s.audit.filter((a) => a.action === 'copilot.cfb_seat_added').length, pending_cancellation: 0, active_this_cycle: s.seats.filter((x) => x.last >= '2026-10-20').length, inactive_this_cycle: s.seats.filter((x) => x.last < '2026-10-20').length }, seat_management_setting: 'assign_selected', ide_chat: 'enabled', platform_chat: 'enabled', cli: 'enabled', public_code_suggestions: 'block', plan_type: 'business' });
    case 'GET copilot/billing/seats':
      w.emit('gh.api', { path: rest, method });
      return j({ total_seats: s.seats.length, seats: s.seats.map((x) => ({ assignee: { login: x.login }, assigning_team: x.team ? { slug: x.team } : null, last_activity_at: `${x.last}T09:12:00Z`, last_activity_editor: x.editor, plan_type: 'business' })) });
    case 'POST copilot/billing/selected_users': {
      if (!users.length) return err('gh: Invalid request (HTTP 422). Send -f "selected_usernames[]=<login>".');
      const added = users.filter((u) => !s.seats.some((x) => x.login === u));
      for (const u of added) { s.seats.push({ login: u, last: '—', editor: '—' }); s.audit.push({ action: 'copilot.cfb_seat_added', actor: 'learner', user: u, at: today() }); }
      w.emit('gh.seats.add', { users: added });
      return j({ seats_created: added.length });
    }
    case 'DELETE copilot/billing/selected_users': {
      if (!users.length) return err('gh: Invalid request (HTTP 422). Send -f "selected_usernames[]=<login>".');
      const gone = users.filter((u) => s.seats.some((x) => x.login === u));
      s.seats = s.seats.filter((x) => !gone.includes(x.login));
      for (const u of gone) s.audit.push({ action: 'copilot.cfb_seat_cancelled', actor: 'learner', user: u, at: today() });
      w.emit('gh.seats.remove', { users: gone });
      return j({ seats_cancelled: gone.length, note: 'The seat stays usable until the end of the billing cycle.' });
    }
    case 'GET audit-log': {
      const phrase = q.get('phrase') ?? '';
      const rows = [
        { action: 'copilot.cfb_seat_assignment_created', actor: 'org-admin', user: 'asha-dev', at: '2026-10-01' },
        { action: 'copilot.content_exclusion_changed', actor: 'org-admin', at: '2026-11-10' },
        { action: 'copilot.policy_changed', actor: 'org-admin', at: '2026-11-12' },
        { action: 'repo.create', actor: 'ben-ops', at: '2026-11-13' },
        ...s.audit,
      ].filter((r) => !phrase || phrase.split(/\s+/).every((p) => (p.startsWith('action:') ? r.action.startsWith(p.slice(7).replace(/\*$/, '')) : p.startsWith('actor:') ? r.actor === p.slice(6) : true)));
      w.emit('gh.audit', { phrase });
      return j(rows.map((r) => ({ action: r.action, actor: r.actor, user: r.user, created_at: `${r.at}T10:00:00Z` })));
    }
    default: return err(`gh: Not Found (HTTP 404) for ${method} /orgs/${ORG}/${rest}. Try copilot/billing, copilot/billing/seats, copilot/billing/selected_users or audit-log.`);
  }
}

/* ------------------------------------------------------------------ */
/* bash-ish commands                                                   */
/* ------------------------------------------------------------------ */
function ls(s: GhState, args: string[]) {
  const all = args.includes('-a') || args.includes('-la');
  const dir = norm(args.find((a) => !a.startsWith('-')) ?? '');
  const pre = dir ? `${dir}/` : '';
  const names = new Set<string>();
  for (const f of Object.keys(s.files)) {
    if (f.startsWith('~')) continue;
    if (!f.startsWith(pre)) continue;
    const part = f.slice(pre.length).split('/');
    names.add(part.length > 1 ? `${part[0]}/` : part[0]);
  }
  if (dir && !names.size) return err(`ls: cannot access '${dir}': No such file or directory`);
  return ok([...names].filter((n) => all || !n.startsWith('.')).sort().join('  '));
}

function writeRedirect(w: World, line: string): DevResult | null {
  const m = line.match(/^echo\s+(-e\s+)?(["'])([\s\S]*)\2\s*(>>?)\s*(\S+)$/) ?? line.match(/^echo\s+(-e\s+)?()([^>]*?)\s*(>>?)\s*(\S+)$/);
  if (!m) return null;
  const s = st(w);
  const text = m[3].replace(/\\n/g, '\n').replace(/\\"/g, '"');
  const path = norm(m[5]);
  const dir = path.split('/').slice(0, -1).join('/');
  if (dir && !dir.startsWith('~') && !exists(s, dir) && !(s.files[`${dir}/.keep`] !== undefined)) return err(`bash: ${path}: No such file or directory (create the folder first: mkdir -p ${dir})`);
  s.files[path] = m[4] === '>>' && s.files[path] ? `${s.files[path]}\n${text}` : text;
  w.emit('gh.file', { path, by: 'learner', text: s.files[path] });
  return ok('');
}

function npmTest(w: World): DevResult {
  const s = st(w);
  const tests = Object.keys(s.files).filter((f) => f.startsWith('tests/') && f.endsWith('.test.js'));
  const fixed = s.files['src/discount.js'].includes('?? 0');
  const out = ['> contoso-shop@1.4.0 test', '> node --test tests/', ''];
  let pass = 1, fail = 0;
  out.push('✔ adds line items');
  if (s.files['tests/discount.test.js']) {
    out.push('✔ SAVE10 takes 10% off');
    if (fixed) { out.push('✔ unknown code leaves the total unchanged', '✔ no code leaves the total unchanged'); pass += 3; }
    else { out.push('✖ unknown code leaves the total unchanged\n    AssertionError: NaN !== 100', '✖ no code leaves the total unchanged\n    AssertionError: NaN !== 100'); pass += 1; fail += 2; }
    out.push('✔ empty cart stays at 0'); pass += 1;
  }
  out.push('', `ℹ tests ${pass + fail}`, `ℹ pass ${pass}`, `ℹ fail ${fail}`);
  w.emit('npm.test', { pass, fail, files: tests.length });
  return { out: out.join('\n'), error: fail ? `${fail} test(s) failed` : undefined };
}

function git(w: World, args: string[]): DevResult {
  const s = st(w);
  const changed = Object.keys(s.files).filter((f) => !f.startsWith('~') && !f.startsWith('logs') && !f.endsWith('/.keep') && f !== '.env' && s.files[f] !== SEED_FILES[f]);
  switch (args[0]) {
    case 'status': return ok(changed.length ? `On branch main\nChanges not staged for commit:\n${changed.map((f) => `  ${f in SEED_FILES ? 'modified' : 'new file'}:   ${f}`).join('\n')}` : 'On branch main\nnothing to commit, working tree clean');
    case 'add': s.staged = args.includes('.') || args.includes('-A') ? changed : args.slice(1).map(norm); return ok('');
    case 'commit': {
      const msg = args[args.indexOf('-m') + 1];
      if (!s.staged.length) return err('nothing added to commit (use "git add")');
      s.commits.unshift(`${Math.random().toString(16).slice(2, 9)} ${msg ?? 'Update'}`); w.emit('git.commit', { files: s.staged, msg }); s.staged = [];
      return ok(`[main ${s.commits[0].split(' ')[0]}] ${msg ?? 'Update'}`);
    }
    case 'log': return ok(s.commits.map((c) => c).join('\n'));
    case 'diff': return ok(changed.length ? changed.map((f) => `--- a/${f}\n+++ b/${f}\n(changed)`).join('\n') : '');
    default: return err('Simulated git supports: status, add, commit -m, log, diff.');
  }
}

/* ------------------------------------------------------------------ */
/* entry point                                                         */
/* ------------------------------------------------------------------ */
export function runDev(line: string, w: World): DevResult {
  const s = st(w);
  const raw = line.trim();
  if (!raw) return ok('', prompt(s));
  // Chains: a && b (stop at the first error or question).
  if (/\s&&\s/.test(raw) && !s.session) {
    const outs: string[] = [];
    const parts = raw.split(/\s&&\s/);
    for (let k = 0; k < parts.length; k++) {
      const r = runDev(parts[k], w);
      if (r.out) outs.push(r.out);
      if (r.confirm) { const restCmd = parts.slice(k + 1).join(' && '); const then = r.confirm.then; return { ...r, out: outs.join('\n'), confirm: { question: r.confirm.question, then: () => { const a = then(); if (!restCmd || a.error || a.confirm) return a; const b = runDev(restCmd, w); return { ...b, out: [a.out, b.out].filter(Boolean).join('\n') }; } } }; }
      if (r.error) return { out: outs.join('\n'), error: r.error, prompt: prompt(s) };
    }
    return ok(outs.join('\n'), prompt(s));
  }
  if (s.session) {
    if (raw.startsWith('/')) return slash(w, raw);
    if (raw.startsWith('!')) { s.session = false; let r: DevResult; try { r = runDev(raw.slice(1), w); } finally { s.session = true; } w.emit('copilot.shell', { cmd: raw.slice(1) }); return { ...r, prompt: COPILOT_PROMPT }; }
    if (!s.loggedIn) return err('Not signed in. Type /login first.');
    const files = raw.match(/@([\w./-]+)/g)?.map((x) => norm(x.slice(1))) ?? [];
    for (const f of files) { if (!(f in s.files)) return err(`@${f}: file not found.`); if (!s.context.includes(f)) s.context.push(f); w.emit('copilot.context.add', { file: f }); }
    return execute(w, plan(w, raw), [], [], true);
  }
  const a = tokenize(raw);
  const [cmd, ...args] = a;
  const redirect = cmd === 'echo' ? writeRedirect(w, raw) : null;
  if (redirect) return redirect;
  switch (cmd) {
    case 'help': return ok(['Practice terminal (simulated). Try:', '  node -v · npm install -g @github/copilot · copilot version', '  copilot            start an interactive session (/help inside)', '  copilot -p "…"     one prompt, then exit (use --allow-tool / --deny-tool)', '  copilot --continue resume the last session', '  ls [-a] [dir] · cat <file> · mkdir -p <dir> · echo "text" > <file>', '  npm test · git status|add|commit|log', '  gh api /orgs/contoso/copilot/billing/seats · gh api "/orgs/contoso/audit-log?phrase=action:copilot"'].join('\n'));
    case 'clear': return { clear: true };
    case 'pwd': return ok('/home/learner/contoso-shop');
    case 'cd': return args[0] && !['.', '~/contoso-shop', '~'].includes(args[0]) ? err('cd: stay in ~/contoso-shop for this lab.') : ok('');
    case 'ls': return ls(s, args);
    case 'cat': {
      if (!args[0]) return err('cat: missing file operand');
      const f = norm(args[0]);
      if (!(f in s.files)) return err(`cat: ${f}: No such file or directory`);
      w.emit('gh.cat', { path: f });
      return ok(s.files[f]);
    }
    case 'mkdir': {
      const d = norm(args.filter((x) => x !== '-p')[0] ?? '');
      if (!d) return err('mkdir: missing operand');
      if (!exists(s, d)) s.files[`${d}/.keep`] = '';
      return ok('');
    }
    case 'echo': return ok(args.join(' '));
    case 'node': return args[0] === '-v' || args[0] === '--version' ? ok(s.node) : err('Run node -v, or npm test to run the tests.');
    case 'npm': {
      if (args[0] === 'test' || (args[0] === 'run' && args[1] === 'test')) return npmTest(w);
      if (args[0] === 'install' || args[0] === 'i') {
        if (args.includes('-g') && args.some((x) => /^@github\/copilot(@.+)?$/.test(x))) { s.installed = true; s.via = 'npm'; w.emit('copilot.install', { via: 'npm' }); return ok('added 1 package in 4s\n✔ GitHub Copilot CLI installed. Run: copilot'); }
        if (args.includes('-g') && args.includes('@githubnext/github-copilot-cli')) return err('That is the old preview package. The current one is @github/copilot.');
        return ok('up to date, audited 12 packages in 1s');
      }
      return err('Simulated npm supports: npm install, npm test.');
    }
    case 'brew': if (args.join(' ') === 'install --cask copilot-cli') { s.installed = true; s.via = 'brew'; w.emit('copilot.install', { via: 'brew' }); return ok('==> Installing Cask copilot-cli\n🍺  copilot-cli was successfully installed!'); } return err('Try: brew install --cask copilot-cli');
    case 'winget': if (/install\s+GitHub\.Copilot/i.test(args.join(' '))) { s.installed = true; s.via = 'winget'; w.emit('copilot.install', { via: 'winget' }); return ok('Found GitHub Copilot [GitHub.Copilot]\nSuccessfully installed'); } return err('Try: winget install GitHub.Copilot');
    case 'curl': case 'wget': if (/gh\.io\/copilot-install/.test(raw)) { s.installed = true; s.via = 'script'; w.emit('copilot.install', { via: 'script' }); return ok('Installing GitHub Copilot CLI to ~/.local/bin …\n✔ Installed. Make sure ~/.local/bin is on your PATH.'); } return err('Simulated curl only runs the Copilot install script: curl -fsSL https://gh.io/copilot-install | bash');
    case 'bash': case 'sh': case './scripts/backup-logs.sh': {
      const f = cmd.startsWith('./') ? cmd.slice(2) : norm(args[0] ?? '');
      if (!s.files[f]) return err(`bash: ${f}: No such file or directory`);
      w.emit('gh.script.run', { file: f });
      return ok('Backed up logs/ to backups/');
    }
    case 'copilot': return copilotCmd(w, args);
    case 'gh': return ghCmd(w, args);
    case 'git': return git(w, args);
    case 'az': return err('This lab is a local developer terminal, not Azure Cloud Shell. az is not needed here.');
    default: return err(`${cmd}: command not found. Type help.`);
  }
}

export const DEV_COMPLETIONS = ['copilot', 'copilot -p "', 'copilot --continue', 'copilot --allow-tool ', 'copilot --deny-tool ', 'copilot version', 'npm install -g @github/copilot', 'npm test', 'gh api /orgs/contoso/copilot/billing', 'gh api /orgs/contoso/copilot/billing/seats', 'gh api "/orgs/contoso/audit-log?phrase=action:copilot"', 'git status', 'git add .', 'git commit -m "', 'cat ', 'ls -a', 'mkdir -p .github/', '/login', '/model', '/mcp list', '/mcp add ', '/agent', '/delegate ', '/usage', '/context', '/compact', '/clear', '/init', '/exit', '/help'];
