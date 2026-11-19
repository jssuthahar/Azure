/**
 * Guided walkthroughs for GH-300 (<PortalTour id="..." />): Visual Studio Code
 * with GitHub Copilot, github.com settings and pull requests, and the terminal
 * with Copilot CLI. Screens are simplified but follow the real names of menus,
 * settings and commands (checked on docs.github.com and Microsoft Learn,
 * 19 Nov 2026). Education only; nothing here talks to GitHub or a model.
 */
import type { Tour, Step, Screen, Ide, IdeChat, Group, Body, Field, Pr } from '../../lib/portal-tour';

/* ---------------- helpers ---------------- */
type Menu = (string | [string, string[]])[];
const ide = (o: Omit<Ide, 's'>): Screen => ({ s: 'ide', ...o });
const vs = (sc: Screen, t: string | undefined, say: string, extra: Partial<Step> = {}): Step => ({ chrome: 'vscode', sc, t, say, ...extra });
const gh = (sc: Screen, t: string | undefined, say: string, extra: Partial<Step> = {}): Step => ({ chrome: 'github', sc, t, say, ...extra });
const chat = (mode: IdeChat['mode'], msgs: IdeChat['msgs'], o: Partial<IdeChat> = {}): IdeChat => ({ mode, msgs, model: 'Auto', ...o });
const me = (t: string) => ({ r: 'me' as const, t });
const ai = (t: string) => ({ r: 'ai' as const, t });
const tool = (t: string) => ({ r: 'tool' as const, t });
const form = (groups: Group[], save?: string, title?: string): Body => ({ b: 'form', groups, save, title });
const note = (text: string, tone: 'ok' | 'bad' | 'warn' | 'info' = 'info'): Body => ({ b: 'note', text, tone });
const code = (text: string, title?: string): Body => ({ b: 'code', text, title });
const tbl = (cols: string[], rows: string[][], title?: string, cmds?: string[]): Body => ({ b: 'table', cols, rows, title, cmds });
const tg = (l: string, v: 'On' | 'Off', n?: string): Field => (n ? [l, v, 'tg', n] : [l, v, 'tg']);
const sel = (l: string, v: string, n?: string): Field => (n ? [l, v, 's', n] : [l, v, 's']);
const ro = (l: string, v: string, n?: string): Field => (n ? [l, v, 'i', n] : [l, v, 'i']);
const pr = (o: Omit<Pr, 's'>): Screen => ({ s: 'pr', ...o });

/* ---------------- github.com settings ---------------- */
const ORG_MENU: Menu = ['General', 'Policies', ['Access', ['Member privileges', 'Teams']], ['Copilot', ['Access', 'Policies', 'Models', 'MCP', 'Coding agent', 'Content exclusion', 'Metrics']], ['Security', ['Code security']], 'Billing and licensing', ['Archive', ['Audit log']]];
const orgSet = (active: string, body: Body[], cmds?: string[]): Screen => ({ s: 'res', title: 'contoso', type: 'Organization settings', i: 'users', menu: ORG_MENU, crumbs: ['contoso', 'Settings'], active, body, cmds });
const REPO_MENU: Menu = ['General', 'Collaborators and teams', ['Code and automation', ['Branches', 'Rules', 'Actions', 'Copilot', 'Webhooks']], ['Security', ['Advanced Security', 'Secrets and variables']]];
const repoSet = (active: string, body: Body[]): Screen => ({ s: 'res', title: 'contoso-shop', type: 'Repository settings', i: 'doc', menu: REPO_MENU, crumbs: ['contoso', 'contoso-shop', 'Settings'], active, body });
const ME_MENU: Menu = ['Public profile', 'Account', ['Code, planning, and automation', ['Repositories', 'Copilot', 'Codespaces']], 'Billing and licensing'];
const meSet = (active: string, body: Body[]): Screen => ({ s: 'res', title: 'learner', type: 'Personal settings', i: 'entra', menu: ME_MENU, crumbs: ['Settings'], active, body });

/* ---------------- the sample repo ---------------- */
const FILES = ['src/', 'src/cart.js', 'src/discount.js', 'src/legacy/', 'src/legacy/report.js', 'tests/', 'tests/cart.test.js', '.github/', 'package.json', 'README.md'];
const CART = ["import { applyDiscount } from './discount.js';", '', 'export function cartTotal(items, code) {', '  let total = 0;', '  for (const i of items) total += i.price * i.qty;', '  return applyDiscount(total, code);', '}'];
const DISC = ['const CODES = { SAVE10: 10, HALF: 50 };', '', 'export function applyDiscount(total, code) {', '  const pct = CODES[code];', '  return total - (total * pct) / 100;', '}'];
const LEGACY = ['// 2014 code, still in production', 'var report = function (rows, cb) {', "  var out = '';", '  for (var i = 0; i < rows.length; i++) {', "    out = out + rows[i].name + ',' + rows[i].total + '\\n';", '  }', '  cb(null, out);', '};', 'module.exports = report;'];
const cartIde = (o: Omit<Ide, 's'> = {}) => ide({ files: FILES, tabs: ['cart.js'], code: CART, ...o });
const discIde = (o: Omit<Ide, 's'> = {}) => ide({ files: FILES, tabs: ['discount.js', 'cart.js'], code: DISC, ...o });

export const TOURS_GH: Record<string, Tour> = {
  /* ================= Domain 2: features ================= */
  'gh-install-extension': {
    title: 'Set up GitHub Copilot in VS Code',
    steps: [
      vs(ide({ side: 'extensions', ext: [{ n: 'GitHub Copilot Chat', by: 'GitHub', d: 'AI chat, inline suggestions and agents in VS Code' }] }), 'install', 'Open **Extensions** (Ctrl+Shift+X), search for **GitHub Copilot** and choose **Install**. In current VS Code one extension, **GitHub Copilot Chat**, brings chat, inline suggestions and agent mode.'),
      vs(ide({ side: 'extensions', ext: [{ n: 'GitHub Copilot Chat', by: 'GitHub', d: 'Installed', on: true }], palette: { q: 'Sign in', items: ['**GitHub Copilot: Sign in to use Copilot**', 'Accounts: Sign in with GitHub'] } }), 'palette:**GitHub Copilot: Sign in to use Copilot**', 'VS Code asks you to **sign in to GitHub**. Your account needs Copilot access: **Copilot Free**, a paid plan, or a seat from your organization.'),
      vs(cartIde({ status: 'Ln 7, Col 2  JavaScript' }), 'status', 'The **Copilot icon** in the status bar shows it is ready. Click it to see your plan, snooze suggestions, or turn completions off for this language.'),
      vs(cartIde({ side: 'settings', settings: [['Github › Copilot: Enable', '{ "*": true, "plaintext": false, "markdown": true }'], ['Editor: Inline Suggest: Enabled', 'On', 'tg'], ['Github › Copilot › Next Edit Suggestions: Enabled', 'On', 'tg']] }), 'set:Github › Copilot: Enable', 'In **Settings**, `github.copilot.enable` turns completions on or off per language. Other IDEs (Visual Studio, JetBrains, Xcode, Eclipse, Vim/Neovim) have their own Copilot plugin and the same sign-in.'),
    ],
  },
  'gh-plans-settings': {
    title: 'Copilot plans and your Copilot settings',
    steps: [
      gh(meSet('Copilot', [tbl(['Plan', 'For', 'Highlights'], [['Copilot Free', 'Individuals', 'Limited completions and chat per month'], ['Copilot Pro', 'Individuals', 'Unlimited completions, more models, coding agent'], ['Copilot Pro+', 'Individuals', 'Everything in Pro, the most models and premium usage'], ['Copilot Business', 'Organizations', 'Seats, policies, content exclusions, audit log'], ['Copilot Enterprise', 'GitHub Enterprise Cloud', 'Business + enterprise features such as more knowledge sources']], 'Compare plans (simplified)')]), 'row:Copilot Business', 'Under **Settings › Copilot**, the plan decides what you get. **Free, Pro and Pro+** are for individuals. **Business** and **Enterprise** are bought by an organization, which assigns **seats** and sets **policies**.'),
      gh(meSet('Copilot', [form([{ h: 'Features', f: [tg('Copilot Chat in the IDE', 'On'), tg('Copilot in github.com', 'On'), tg('Copilot CLI', 'On'), tg('Copilot coding agent', 'On')] }, { h: 'Privacy', f: [sel('Suggestions matching public code', 'Blocked'), tg('Allow GitHub to use my data for product improvements', 'Off')] }], 'Save')]), 'f:Suggestions matching public code', 'On a personal plan you set the **public code** filter and data settings yourself. With a **Business** or **Enterprise** seat, these come from your organization’s policies and appear read-only.'),
      gh(orgSet('Billing and licensing', [{ b: 'cards', items: [{ t: 'Copilot Business seats', v: '42 assigned', s: 'Billed per seat per month' }, { t: 'Premium usage', v: 'Within allowance', s: 'Extra requests can be billed or blocked by a budget' }] }]), 'card:Copilot Business seats', 'For an organization, **Billing and licensing** shows the seats you pay for. Usage beyond what a plan includes can be allowed with a budget or blocked.'),
    ],
  },
  'gh-inline-and-chat': {
    title: 'Inline suggestions, inline chat and the Chat view',
    steps: [
      vs(discIde({ code: DISC.slice(0, 3), ghost: { at: 3, lines: ['  const pct = CODES[code] ?? 0;', '  return Math.max(0, total - (total * pct) / 100);', '}'] } }), 'ghost', 'Start typing and pause: Copilot shows a **ghost text** suggestion. **Tab** accepts it all, **Ctrl+→** accepts one word, **Alt+]** shows the next alternative, **Esc** dismisses.'),
      vs(discIde({ hl: [4], inline: { q: 'make unknown codes return the total unchanged' } }), 'inline', 'Press **Ctrl+I** for **inline chat** right in the editor. Describe the change for the selected code.'),
      vs(discIde({ add: [4], inline: { q: 'make unknown codes return the total unchanged', a: 'Changed line 4 to default to 0% with `?? 0`.' }, code: ['const CODES = { SAVE10: 10, HALF: 50 };', '', 'export function applyDiscount(total, code) {', '  const pct = CODES[code] ?? 0;', '  return total - (total * pct) / 100;', '}'] }), 'keep', 'Copilot shows the change in place. **Accept** keeps it, **Discard** throws it away.'),
      vs(discIde({ chat: chat('Ask', [me('Why could applyDiscount return NaN?'), ai('If `code` isn’t in `CODES`, `pct` is `undefined`, and `total * undefined` is `NaN`. Default it: `const pct = CODES[code] ?? 0;`')], { ctx: ['discount.js'] }) }), 'mode', 'Open the **Chat view** (Ctrl+Alt+I) for longer conversations. The mode picker switches between **Ask** (answers), **Edit** (changes files you choose) and **Agent** (does the whole task).'),
      vs(discIde({ chat: chat('Agent', [me('Add a 100% code FREE and tests for it')], { ctx: ['discount.js'], input: 'Add a 100% code FREE and tests for it' }) }), 'send', 'In **Agent** mode the same request makes Copilot find the files, edit them, run the tests and report back. Next edit suggestions (NES) also predict your *next* edit as you work.'),
    ],
  },
  'gh-chat-commands': {
    title: 'Copilot Chat: slash commands, participants and feedback',
    steps: [
      vs(discIde({ hl: [3, 4, 5], chat: chat('Ask', [], { ctx: ['discount.js:3-5'], input: '/explain' }) }), 'chat-input', 'Type **/** for **slash commands**: `/explain`, `/fix`, `/tests`, `/doc`, `/new`, `/clear`. Select code first so Copilot knows what you mean.'),
      vs(discIde({ chat: chat('Ask', [me('/tests'), ai('Here are tests for `applyDiscount` using the Node test runner: SAVE10, an unknown code, no code and an empty cart.'), tool('📄 tests/discount.test.js (new file, 14 lines)')], { acts: ['Insert into new file', 'Copy', '👍', '👎'] }) }), 'act:👎', '`/tests` writes tests for the selection. Use **👍 / 👎** to give feedback on an answer, and **Insert** or **Copy** to use the code.'),
      vs(discIde({ chat: chat('Ask', [], { input: '@workspace where is the discount applied?', ctx: ['#codebase'] }) }), 'ctx:#codebase', '**Participants** start with **@**: `@workspace` (your project), `@terminal`, `@vscode`, `@github`. **Context** starts with **#**: `#file`, `#selection`, `#codebase`, `#terminalLastCommand`.'),
      vs(discIde({ chat: chat('Ask', [], { model: 'Auto' }) }), 'model', 'The **model picker** lets you choose a model or **Auto**. Your plan and your organization decide which models are offered, and some models use more of your premium allowance.'),
      vs(discIde({ chat: chat('Ask', [ai('Answers can be wrong. Copilot Chat has limits: it sees only the context in this conversation, the context window is finite, and very long files are trimmed.')]) }), 'chat', 'Know the **limits**: Chat only sees what is in the conversation and the context you add, history counts against the context window, and answers can be wrong. Start a **new chat** when the topic changes.'),
    ],
  },
  'gh-cli-terminal': {
    title: 'Install and start GitHub Copilot CLI',
    steps: [
      vs(cartIde({ term: ['$ node -v', 'v22.11.0', '$ npm install -g @github/copilot', 'added 1 package in 4s'] }), 'term', 'Copilot CLI needs **Node.js 22** or later. Install it with `npm install -g @github/copilot`, or with `brew install --cask copilot-cli`, `winget install GitHub.Copilot` or the install script.'),
      vs(cartIde({ term: ['$ copilot', 'Confirm folder trust: ~/contoso-shop', '  1. Yes', '  2. Yes, and remember this folder for future sessions', '  3. No (Esc)'] }), 'term', 'Run **copilot**. It first asks whether you **trust the files in this folder**, because it can read them and, with your approval, edit them and run commands.'),
      vs(cartIde({ term: ['copilot ❯ /login', '! First copy your one-time code: 7F2C-9A1D', '✔ Signed in to GitHub as learner'] }), 'term', 'Type **/login** and approve the device code on github.com. In scripts you can use a token in `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` or `GITHUB_TOKEN` instead.'),
      vs(cartIde({ term: ['copilot ❯ /model', '  ● Auto', '  ○ claude-sonnet-4.5', '  ○ gpt-5', 'copilot ❯ explain @src/cart.js', '● cartTotal sums price × qty, then applies the discount code…'] }), 'term', '**/model** picks a model. **@path** adds a file to the context, **!cmd** runs a shell command, and **/help** lists the rest: `/mcp`, `/agent`, `/delegate`, `/usage`, `/context`, `/compact`, `/clear`, `/exit`.'),
    ],
  },
  'gh-cli-scripts': {
    title: 'Copilot CLI: scripts, files and permissions',
    steps: [
      vs(cartIde({ term: ['$ copilot -p "write a bash script that backs up logs/"', '● I’ll write scripts/backup-logs.sh …', '✖ Create scripts/backup-logs.sh: needs permission for "write".'] }), 'term', '`copilot -p "…"` runs **one prompt** and exits: good for scripts and CI. It can’t stop to ask, so tools it hasn’t been allowed are skipped.'),
      vs(cartIde({ term: ["$ copilot -p \"write a bash script that backs up logs/\" --allow-tool 'write' --deny-tool 'shell(rm)'", '✔ Created scripts/backup-logs.sh (5 lines)'] }), 'term', 'Allow exactly what it needs with `--allow-tool` and block what it must never do with `--deny-tool`. A deny always wins. `--allow-all-tools` exists, but use it only for tasks you trust.'),
      vs(ide({ files: [...FILES, 'scripts/', 'scripts/backup-logs.sh'], tabs: ['backup-logs.sh'], code: ['#!/usr/bin/env bash', 'set -euo pipefail', 'mkdir -p backups', 'tar -czf "backups/logs-$(date +%F).tar.gz" logs/', 'ls -1t backups/logs-*.tar.gz | tail -n +8 | xargs -r rm --'], hl: [5] }), 'file:scripts/backup-logs.sh', 'Read the script **before** you run it. Line 5 deletes old archives: is that what you want? Copilot’s output is a draft.'),
      vs(cartIde({ term: ['$ copilot', 'copilot ❯ organize the old log files into logs/archive', '? Allow Copilot to use shell(mv)? (y/n) y', '✔ Moved 2 files to logs/archive/', 'copilot ❯ /exit', '$ copilot --continue', '↺ Resumed session #1'] }), 'term', 'In an **interactive session** Copilot asks before each new tool, and a yes lasts for the session. `/exit` saves the session; `copilot --continue` (or `--resume`) picks it up again.'),
    ],
  },
  'gh-agent-mode': {
    title: 'Agent mode with tools and an MCP server',
    steps: [
      vs(discIde({ chat: chat('Agent', [me('Add a FREE code (100% off), make sure totals never go negative, and add tests.')], { ctx: ['#codebase'] }) }), 'mode', 'Switch the chat to **Agent**. Describe the outcome, not the steps.'),
      vs(discIde({ chat: chat('Agent', [me('Add a FREE code (100% off)…'), tool('🔍 Searched codebase: discount, CODES'), tool('✏️ Edited src/discount.js (+2 −1)'), tool('✏️ Created tests/discount.test.js'), tool('⌨️ Run in terminal: npm test'), ai('I’d like to run `npm test` to check the change.')], { acts: ['Allow', 'Allow for this session', 'Skip'] }) }), 'act:Allow', 'Agent mode **plans**, edits files and wants to **run a command**. It asks first; you can allow once, for the session, or skip.'),
      vs(discIde({ term: ['$ npm test', '✔ 5 tests passed'], chat: chat('Agent', [tool('⌨️ npm test → 5 passed'), ai('Done. FREE gives 100% off and totals are clamped at 0. Review the 2 changed files.')], { acts: ['Keep', 'Undo'] }) }), 'act:Keep', 'It reads the test output and iterates until the task passes. **Keep** or **Undo** the changes, and review the diffs either way.'),
      vs(ide({ files: [...FILES, '.vscode/', '.vscode/mcp.json'], tabs: ['mcp.json'], code: ['{', '  "servers": {', '    "github": {', '      "type": "http",', '      "url": "https://api.githubcopilot.com/mcp/"', '    }', '  }', '}'] }), 'file:.vscode/mcp.json', '**MCP servers** add tools. In VS Code, list them in `.vscode/mcp.json` (shared with the repo) or your user settings. This one is the **GitHub MCP server** for issues, pull requests and Actions.'),
      vs(discIde({ chat: chat('Agent', [me('Which open issues are labelled bug?'), tool('🔌 github › list_issues (approve?)'), ai('#41 HALF applies twice on refresh · #44 NaN for unknown codes')], { acts: ['Allow', 'Skip'] }) }), 'act:Allow', 'The agent calls an MCP **tool**, after asking. For long tasks, separate **sessions** and **sub-agents** keep each piece of work in its own context, so the main conversation stays focused.'),
    ],
  },
  'gh-instructions-files': {
    title: 'Custom instructions and prompt files',
    steps: [
      vs(ide({ files: [...FILES, '.github/copilot-instructions.md'], tabs: ['copilot-instructions.md'], code: ['# Copilot instructions for contoso-shop', '- Node.js 22, ES modules, no CommonJS.', '- Tests use the Node test runner: node --test.', '- Never log secrets; read config from environment variables.', '- Explain changes in plain English in the PR description.'] }), 'file:.github/copilot-instructions.md', '**Repository custom instructions** live in `.github/copilot-instructions.md`. Copilot Chat, the coding agent and code review add them to requests in this repo automatically.'),
      vs(ide({ files: [...FILES, '.github/instructions/', '.github/instructions/tests.instructions.md'], tabs: ['tests.instructions.md'], code: ['---', 'applyTo: "tests/**/*.js"', '---', 'Arrange, act, assert. One behaviour per test.', 'Name each test after the behaviour it checks.'], hl: [2] }), 'file:.github/instructions/tests.instructions.md', '**Path-specific** instructions go in `.github/instructions/*.instructions.md` with an `applyTo` glob, so test rules only apply to test files.'),
      vs(ide({ files: [...FILES, '.github/prompts/', '.github/prompts/new-endpoint.prompt.md'], tabs: ['new-endpoint.prompt.md'], code: ['---', 'mode: agent', 'description: Add a REST endpoint with validation and tests', '---', 'Create a new endpoint for ${input:resource}.', 'Validate input, return 400 on bad data, and add tests.'] }), 'file:.github/prompts/new-endpoint.prompt.md', 'A **prompt file** (`.github/prompts/*.prompt.md`) is a reusable prompt. Everyone on the team gets the same, consistent request.'),
      vs(discIde({ chat: chat('Agent', [me('/new-endpoint resource=orders'), tool('📎 Using .github/copilot-instructions.md and new-endpoint.prompt.md'), ai('Created src/orders.js and tests/orders.test.js.')]) }), 'chat', 'Run it in chat by typing **/new-endpoint**. The answer shows which instruction and prompt files were used, so you can check they applied. Personal and organization instructions can be added too.'),
    ],
  },
  'gh-code-review': {
    title: 'Ask Copilot to review a pull request',
    steps: [
      gh(pr({ n: 52, title: 'Add FREE discount code', branch: 'feature/free-code', body: 'Adds a 100% code and clamps totals at 0.', items: [], reviewers: [] }), 'reviewers', 'Open the pull request and, under **Reviewers**, pick **Copilot**. You can also ask for a review from VS Code, or set a **ruleset** so Copilot reviews every new PR automatically.'),
      gh(pr({ n: 52, title: 'Add FREE discount code', branch: 'feature/free-code', items: [{ by: 'Copilot', bot: true, file: 'src/discount.js', t: 'Copilot reviewed 2 files and left 1 comment.\n`code` is not normalised: `free` and `FREE` behave differently. Consider upper-casing it.', code: "const pct = CODES[String(code).toUpperCase()] ?? 0;" }], reviewers: ['Copilot (commented)'], btns: ['Commit suggestion', 'Resolve conversation'] }), 'comment:1', 'Copilot leaves **comments**, often with a **suggested change** you can commit in one click. Its review is always a **Comment**: it never approves or blocks the merge.'),
      vs(ide({ files: [...FILES, '.github/copilot-instructions.md'], tabs: ['copilot-instructions.md'], code: ['## Code review', '- Flag any discount logic without a unit test.', '- Prefer early returns over nested ifs.', '- Comment in English, be brief.'] }), 'file:.github/copilot-instructions.md', 'Put your team’s **review standards** in the instructions file. Copilot code review reads `.github/copilot-instructions.md` (and path-specific `.instructions.md` files) when it reviews.'),
      gh(orgSet('Policies', [form([{ h: 'Copilot code review', f: [sel('Copilot code review', 'Enabled'), tg('Automatic review of new pull requests (ruleset)', 'On')] }], 'Save')]), 'f:Copilot code review', 'Admins switch **Copilot code review** on in the Copilot **policies**, and can require it with a repository or organization **ruleset**.'),
    ],
  },
  'gh-pr-summary-spaces': {
    title: 'Pull request summaries, Copilot Spaces and Spark',
    steps: [
      gh(pr({ n: 53, title: 'Paginate the orders endpoint', branch: 'feature/paging', body: '✨ Copilot summary\n**What changed:** adds `page` and `pageSize` query params to GET /orders (max 100).\n**Why:** large accounts timed out.\n**Files:** src/orders.js, tests/orders.test.js', items: [], btns: ['Edit description'] }), 'btn:Edit description', 'When you open a PR, the **Copilot** button in the description box writes a **summary** of the changes. Edit it: you know the *why* better than the diff does.'),
      gh(meSet('Copilot', [tbl(['Space', 'Sources', 'Shared with'], [['contoso-shop onboarding', 'README, docs/, 3 issues, an ADR', 'web team'], ['Payments rules', 'discount.js, refunds.md', 'org']], 'Copilot Spaces', ['+ New space'])]), 'row:contoso-shop onboarding', '**Copilot Spaces** collect the context for a topic (files, issues, notes, instructions) so every question asked in that space is grounded in the same sources. Share a space with your team.'),
      gh(meSet('Copilot', [note('✨ **Spark**: “Build a small app that tracks which discount codes customers use, with a chart.”'), tbl(['Step', 'What Spark does'], [['Describe', 'You describe the app in plain language'], ['Build', 'Spark builds a full-stack app with hosting'], ['Iterate', 'Refine by chat or edit the code'], ['Ship', 'Publish it, or open the code in a repository']])]), 'row:Build', '**GitHub Spark** turns a description into a working micro app you can refine and publish. It’s for small tools and prototypes; review the code like any other.'),
    ],
  },
  'gh-org-policies': {
    title: 'Copilot policies for an organization',
    steps: [
      gh(orgSet('Access', [form([{ h: 'Copilot access', f: [sel('Who can use Copilot', 'Selected members'), ro('Seats assigned', '42')] }], 'Save'), tbl(['Member / team', 'Seat since', 'Last activity'], [['team: web', '2026-03-01', 'Today'], ['ben-ops', '2026-05-12', 'Today'], ['chen-qa', '2026-02-10', '2 months ago']])]), 'f:Who can use Copilot', '**Organization settings › Copilot › Access** decides who gets a seat: all members, selected members and teams, or nobody.'),
      gh(orgSet('Policies', [form([{ h: 'Features', f: [sel('Copilot in the IDE', 'Enabled'), sel('Copilot Chat in github.com', 'Enabled'), sel('Copilot CLI', 'Enabled'), sel('Copilot coding agent', 'Disabled'), sel('MCP servers in Copilot', 'Enabled')] }, { h: 'Privacy', f: [sel('Suggestions matching public code', 'Blocked')] }], 'Save')]), 'f:Copilot coding agent', '**Policies** switch each feature on or off for every seat in the org: IDE chat, github.com chat, the CLI, code review, the coding agent, MCP, and the public code filter.'),
      gh(orgSet('Models', [form([{ h: 'Models', f: [tg('Claude Sonnet', 'On'), tg('GPT-5', 'On'), tg('Gemini', 'Off')] }], 'Save')]), 'f:Gemini', '**Models** controls which models members can pick in the model picker. Turning a model off hides it everywhere for this org.'),
      gh(orgSet('Policies', [note('🔒 **Enforced by the enterprise**: “Copilot coding agent” is set to Disabled at the enterprise level and can’t be changed here.', 'warn')]), undefined, 'If the **enterprise** sets a policy, organizations can’t override it. If the enterprise leaves it as *No policy*, each org decides.'),
    ],
  },
  'gh-seats-audit': {
    title: 'Seats with the REST API, and the audit log',
    steps: [
      gh(orgSet('Audit log', [tbl(['Action', 'Actor', 'When'], [['copilot.cfb_seat_assignment_created', 'org-admin', '1 Oct'], ['copilot.content_exclusion_changed', 'org-admin', '10 Nov'], ['copilot.policy_changed', 'org-admin', '12 Nov']], 'Search: action:copilot (example events)', ['Export'])]), 'row:copilot.policy_changed', 'The **audit log** (organization settings › Archive › Logs) records Copilot events: seats added or cancelled, policy changes, content exclusion changes. Filter with `action:copilot`; the event names here are examples, so check the docs for the exact list.'),
      vs(cartIde({ term: ['$ gh api /orgs/contoso/copilot/billing/seats', '{ "total_seats": 3, "seats": [', '  { "assignee": { "login": "chen-qa" },', '    "last_activity_at": "2026-09-02T09:12:00Z",', '    "last_activity_editor": "jetbrains/2026.2" } … ] }'] }), 'term', 'The **Copilot user management REST API** lists seats with `last_activity_at`, so you can find seats nobody uses.'),
      vs(cartIde({ term: ['$ gh api -X POST /orgs/contoso/copilot/billing/selected_users -f "selected_usernames[]=dina-new"', '{ "seats_created": 1 }', '$ gh api -X DELETE /orgs/contoso/copilot/billing/selected_users -f "selected_usernames[]=chen-qa"', '{ "seats_cancelled": 1 }'] }), 'term', '**POST** `/copilot/billing/selected_users` adds seats; **DELETE** cancels them (the seat lasts until the end of the billing cycle). `selected_teams` does the same for teams. The token needs `manage_billing:copilot`.'),
    ],
  },

  /* ================= Domain 1 + 5: responsible use and productivity ================= */
  'gh-validate-output': {
    title: 'Validate what Copilot suggests',
    steps: [
      vs(discIde({ code: DISC.slice(0, 3), ghost: { at: 3, lines: ['  const pct = CODES[code];', '  return total - (total * pct) / 100;', '}'] } }), 'ghost', 'Copilot suggests a function that **looks** right. Before you press Tab, ask: what happens with an unknown code?'),
      vs(discIde({ term: ['$ npm test', '✖ unknown code leaves the total unchanged', '  AssertionError: NaN !== 100'], chat: chat('Ask', [me('/tests for applyDiscount with edge cases'), ai('Added 4 tests, including an unknown code.')]) }), 'term', '**Test it.** A quick test with an edge case shows the suggestion returns `NaN`. Running code beats reading it.'),
      vs(discIde({ add: [4], code: ['const CODES = { SAVE10: 10, HALF: 50 };', '', 'export function applyDiscount(total, code) {', '  const pct = CODES[code] ?? 0;', '  return total - (total * pct) / 100;', '}'], term: ['$ npm test', '✔ 5 tests passed'] }), 'term', 'Fix, rerun, and only then commit. **Review, test, lint and scan** Copilot’s code exactly as you would a colleague’s, and never accept code you don’t understand.'),
      gh(pr({ n: 54, title: 'Fix NaN for unknown discount codes', branch: 'fix/nan', items: [{ by: 'code-scanning', t: 'CodeQL: no new alerts. Tests: 5 passed.' }], reviewers: ['asha-dev (approved)', 'Copilot (commented)'], btns: ['Merge pull request'] }), 'btn:Merge pull request', 'Keep the normal safeguards: **pull request review by a person**, CI tests and code scanning. Copilot speeds you up; it doesn’t replace the checks.'),
    ],
  },
  'gh-hallucination-check': {
    title: 'Spot a hallucinated API',
    steps: [
      vs(cartIde({ code: [...CART.slice(0, 5)], ghost: { at: 5, lines: ['  return Money.roundBankers(applyDiscount(total, code));', '}'] } }), 'ghost', 'Copilot suggests `Money.roundBankers(…)`. It reads well, but this project has no `Money` library. LLMs can **invent** functions, packages and options.'),
      vs(cartIde({ chat: chat('Ask', [me('Does Money.roundBankers exist in this project?'), ai('I can’t find `Money` anywhere in the workspace or in package.json. It may not exist. You could round with `Math.round(total * 100) / 100`.')], { ctx: ['#codebase'] }) }), 'chat', 'Ask Copilot with `#codebase`, and check the docs or package registry yourself. Also watch for **outdated** APIs, **insecure** defaults and code that is confidently wrong.'),
      vs(cartIde({ chat: chat('Ask', [ai('Generative AI can be wrong, biased, out of date, or leak sensitive data you paste in. Treat every answer as a draft.')]) }), 'chat', 'Know the risks: **hallucinations**, **bias** in generated text and names, **security** flaws, **licence** questions about matching public code, and **over-reliance**. The fix is the same: human review and tests.'),
    ],
  },
  'gh-refactor-doc': {
    title: 'Generate, refactor and document code',
    steps: [
      vs(cartIde({ hl: [3, 4, 5, 6], chat: chat('Edit', [me('Refactor cartTotal to use reduce and keep the behaviour the same')], { ctx: ['cart.js'] }) }), 'chat-input', 'Select the function and ask in **Edit** mode for a **refactor** that keeps the behaviour. Say what must not change.'),
      vs(cartIde({ code: ["import { applyDiscount } from './discount.js';", '', 'export function cartTotal(items, code) {', '  let total = 0;', '  for (const i of items) total += i.price * i.qty;', '  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);', '  return applyDiscount(total, code);', '}'], del: [4, 5], add: [6], chat: chat('Edit', [ai('Replaced the loop with `reduce`.')], { acts: ['Keep', 'Undo'] }) }), 'act:Keep', 'Review the **diff**: removed lines in red, added in green. Run the tests before you **Keep**.'),
      vs(cartIde({ hl: [3], chat: chat('Ask', [me('/doc'), ai('Added a JSDoc block describing items, code and the return value.')]) }), 'chat', '`/doc` writes documentation comments. Copilot can also draft a README section, explain a regex, or summarise a file you’ve never seen, so you spend less time switching to search.'),
    ],
  },
  'gh-legacy-modernize': {
    title: 'Modernize legacy code and generate sample data',
    steps: [
      vs(ide({ files: FILES, tabs: ['report.js'], code: LEGACY, chat: chat('Ask', [me('/explain'), ai('This builds a CSV string from rows and passes it to a Node-style callback. It uses `var` and string concatenation in a loop.')], { ctx: ['report.js'] }) }), 'chat', 'Start with **/explain** on the legacy file so you understand it before changing it.'),
      vs(ide({ files: FILES, tabs: ['report.js'], code: ['// Modernized with Copilot: same CSV output as before', 'export function report(rows) {', "  return rows.map((r) => `${r.name},${r.total}`).join('\\n') + '\\n';", '}'], add: [1, 2, 3, 4], chat: chat('Agent', [me('Modernize report.js to an ES module, keep the same output, and update the callers'), tool('✏️ Edited src/legacy/report.js'), tool('✏️ Updated 2 callers'), tool('⌨️ npm test → passed')], { acts: ['Keep', 'Undo'] }) }), 'act:Keep', 'Ask for the **same output** in modern code, and let agent mode update the callers and run the tests. Keep changes small so they’re easy to review.'),
      vs(ide({ files: [...FILES, 'data/', 'data/sample-orders.json'], tabs: ['sample-orders.json'], code: ['[', '  { "id": "ord-1001", "customer": "Test Customer 1", "email": "customer1@example.com", "total": 12.5 },', '  { "id": "ord-1002", "customer": "Test Customer 2", "email": "customer2@example.com", "total": 25 }', ']'], chat: chat('Ask', [me('Generate 5 sample orders as JSON. Fake data only, example.com emails.')]) }), 'file:data/sample-orders.json', 'Copilot is handy for **sample data** for tests and demos. Ask for clearly fake values (example.com, test names), and never paste real customer data into a prompt.'),
    ],
  },
  'gh-generate-tests': {
    title: 'Unit tests, integration tests and edge cases',
    steps: [
      vs(discIde({ hl: [3, 4, 5], chat: chat('Ask', [me('/tests applyDiscount: cover unknown codes, no code, 0 and very large totals')], { ctx: ['discount.js'] }) }), 'chat-input', 'Select the code and run **/tests**, naming the **edge cases** you care about. Copilot also suggests ones you missed.'),
      vs(ide({ files: [...FILES, 'tests/discount.test.js'], tabs: ['discount.test.js'], code: ["test('SAVE10 takes 10% off', () => assert.equal(applyDiscount(100, 'SAVE10'), 90));", "test('unknown code leaves the total unchanged', () => assert.equal(applyDiscount(100, 'NOPE'), 100));", "test('no code leaves the total unchanged', () => assert.equal(applyDiscount(100), 100));", "test('empty cart stays at 0', () => assert.equal(applyDiscount(0, 'HALF'), 0));"] }), 'tab:discount.test.js', 'Check the **assertions**: each test should check one behaviour with a clear expected value. Weak assertions (only “is defined”) prove little.'),
      vs(discIde({ chat: chat('Ask', [me('Write an integration test: POST /cart/total with SAVE10 returns 90'), ai('Using supertest against the Express app: starts the server, posts a cart, checks status 200 and body.total === 90.')]) }), 'chat', '**Integration tests** check pieces working together (the API, the discount module, the JSON). Ask Copilot for the setup and teardown too.'),
      vs(discIde({ term: ['$ npm test', '✔ SAVE10 takes 10% off', '✖ unknown code leaves the total unchanged', 'ℹ pass 3  fail 2'] }), 'term', 'Run them. A **failing** generated test is useful: either the code has a bug or the test is wrong. Decide which, then fix.'),
    ],
  },
  'gh-security-fix': {
    title: 'Security improvements and performance fixes',
    steps: [
      vs(ide({ files: [...FILES, 'src/orders.js'], tabs: ['orders.js'], code: ['export async function findOrders(db, customer) {', '  return db.query(`SELECT * FROM orders WHERE customer = \'${customer}\'`);', '}'], hl: [2], chat: chat('Ask', [me('Is this safe?'), ai('No: building SQL with string interpolation allows **SQL injection**. Use a parameterised query: `db.query("SELECT * FROM orders WHERE customer = $1", [customer])`.')], { ctx: ['orders.js'] }) }), 'chat', 'Ask Copilot to **review for security**. It spots common problems like SQL injection, hard-coded secrets and missing input validation, and suggests a fix.'),
      vs(ide({ files: [...FILES, 'src/orders.js'], tabs: ['orders.js'], code: ['export async function findOrders(db, customer) {', "  return db.query('SELECT id, total FROM orders WHERE customer = $1', [customer]);", '}'], add: [2], chat: chat('Ask', [me('This runs once per order in a loop. Can it be faster?'), ai('Fetch all customers’ orders in one query with `WHERE customer = ANY($1)` instead of one query per customer (the N+1 problem), and select only the columns you need.')]) }), 'chat', 'For **performance**, describe how the code is used. Copilot can point out N+1 queries, repeated work in loops and missing caching.'),
      gh(pr({ n: 55, title: 'Parameterise order queries', branch: 'fix/sqli', items: [{ by: 'code-scanning', t: 'CodeQL: 1 alert fixed (SQL injection). 0 new alerts.' }], reviewers: ['asha-dev (approved)'] }), 'comment:1', 'Back it up with tools: **code scanning**, dependency checks and tests in CI. Copilot’s security suggestions are a help, not a guarantee.'),
    ],
  },

  /* ================= Domain 3 + 4: data, architecture and prompts ================= */
  'gh-data-settings': {
    title: 'What happens to your code and prompts',
    steps: [
      gh(meSet('Copilot', [form([{ h: 'Privacy', f: [tg('Allow GitHub to use my data for product improvements', 'Off', 'Individual plans: your choice. Business and Enterprise: data isn’t used to train models.'), sel('Suggestions matching public code', 'Blocked')] }], 'Save')]), 'f:Allow GitHub to use my data for product improvements', 'On individual plans you control whether GitHub may use your prompts and suggestions for product improvements. With **Copilot Business or Enterprise**, your code and prompts are **not used to train** GitHub’s models.'),
      vs(cartIde({ term: ['ℹ Request: prompt (cursor context + open tabs) → HTTPS → Copilot proxy → model', 'ℹ Response: suggestion → post-processing filters → editor', 'ℹ Engagement data: accepted / rejected, latency, errors'] }), 'term', 'The flow: the IDE builds a prompt from context, sends it **encrypted** to the Copilot proxy and model, and the reply is filtered before you see it. **Engagement data** (accepts, rejects, errors) is kept to run the service and for usage metrics.'),
      gh(orgSet('Metrics', [{ b: 'cards', items: [{ t: 'Active users (28 days)', v: '37' }, { t: 'Acceptance rate', v: '31%', s: 'Inline suggestions' }, { t: 'Chat turns', v: '4,120' }] }]), 'card:Acceptance rate', 'Organizations see **usage metrics** built from that engagement data, not your code.'),
    ],
  },
  'gh-context-chips': {
    title: 'Give Copilot the right context',
    steps: [
      vs(ide({ files: FILES, tabs: ['cart.js', 'discount.js', 'README.md', 'notes-old.txt'], code: CART }), 'tab:notes-old.txt', 'For inline suggestions, Copilot looks at the file you’re in and **open tabs**. An unrelated old file in a tab can pull suggestions off course. Close it.'),
      vs(cartIde({ chat: chat('Ask', [], { input: 'Why is the total wrong for unknown codes? #file:src/discount.js', ctx: ['cart.js', '#file:src/discount.js'] }) }), 'ctx:#file:src/discount.js', 'In chat, the **active file** and any **selection** are included. Add more with `#file`, `#selection`, `#codebase` or by dragging files in. Be explicit about which code you mean.'),
      vs(cartIde({ chat: chat('Ask', [me('Why is the total wrong for unknown codes?'), tool('📎 Used 2 references: cart.js, discount.js'), ai('`applyDiscount` reads `CODES[code]`, which is undefined for unknown codes…')]) }), 'chat', 'Expand **Used n references** to see exactly what context went into the answer. If the right file isn’t there, add it and ask again.'),
    ],
  },
  'gh-few-shot': {
    title: 'Zero-shot versus few-shot prompts',
    steps: [
      vs(ide({ files: FILES, tabs: ['log.js'], code: ['// Format: [LEVEL] yyyy-mm-dd hh:mm | module | message'], chat: chat('Ask', [me('Write a log line for a failed payment'), ai('`console.error("Payment failed")`')]) }), 'chat', '**Zero-shot**: just the instruction. Copilot falls back to the most common pattern, not yours.'),
      vs(ide({ files: FILES, tabs: ['log.js'], code: ['// Format: [LEVEL] yyyy-mm-dd hh:mm | module | message'], chat: chat('Ask', [me('Examples:\n[INFO] 2026-11-19 10:02 | cart | Cart created\n[WARN] 2026-11-19 10:03 | discount | Unknown code NOPE\nNow: a failed payment for order 1004.'), ai('`[ERROR] 2026-11-19 10:04 | payments | Payment failed for order 1004`')]) }), 'chat', '**Few-shot**: give two or three examples of the exact format, then ask. Copilot follows the pattern.'),
      vs(ide({ files: FILES, tabs: ['log.js'], code: ['// Format: [LEVEL] yyyy-mm-dd hh:mm | module | message', "logLine('INFO', 'cart', 'Cart created');", "logLine('WARN', 'discount', 'Unknown code NOPE');", ''], ghost: { at: 3, lines: ["logLine('ERROR', 'payments', 'Payment failed for order 1004');"] } }), 'ghost', 'It works in the editor too: write a couple of examples and Copilot’s inline suggestion continues the pattern. Best practice: be **specific**, give **examples**, keep it **short**, and **iterate**.'),
    ],
  },
  'gh-chat-history': {
    title: 'Chat history and starting fresh',
    steps: [
      vs(cartIde({ chat: chat('Ask', [me('Use the v1 pricing API'), ai('…'), me('Actually we moved to v2 last month'), ai('…'), me('Add a discount endpoint'), ai('Calling `/v1/prices`… ')]) }), 'chat', 'Earlier messages in the **same chat** are sent as context. Here the old v1 instruction keeps leaking into new answers.'),
      vs(cartIde({ chat: chat('Ask', [], { input: '/clear' }) }), 'chat-input', 'Start a **new chat** (＋) or type `/clear` when the topic changes. Copilot doesn’t remember other conversations.'),
      vs(cartIde({ chat: chat('Ask', [me('Using pricing API v2 (`/v2/prices`), add a discount endpoint. Follow the pattern in #file:src/orders.js.'), ai('Created `POST /v2/discounts` following orders.js…')]) }), 'chat', 'Put the facts that matter **in the prompt**, point to an example file, and keep follow-ups on the same topic. Principles: clear goal, relevant context, examples, small steps, then refine.'),
    ],
  },
  'gh-suggestion-lifecycle': {
    title: 'The life of a suggestion',
    steps: [
      vs(discIde({ code: DISC.slice(0, 3), ghost: { at: 3, lines: ['  const pct = CODES[code] ?? 0;'], hint: 'Suggestion 1/3 · Tab accept · Alt+] next' } }), 'ghost', 'You pause, the IDE sends context, and a suggestion comes back as ghost text. There may be several: **Alt+]** and **Alt+[** cycle them.'),
      vs(discIde({ code: DISC.slice(0, 3), ghost: { at: 3, lines: ['  if (!(code in CODES)) return total;', '  const pct = CODES[code];'], hint: 'Suggestion 2/3 · Ctrl+→ accept word' } }), 'ghost', 'Accept all with **Tab**, a word at a time with **Ctrl+→**, or open the **Completions panel** (Ctrl+Enter) to compare several.'),
      vs(discIde({ code: DISC, chat: chat('Ask', [ai('LLM limits: training data has a cut-off, so newer APIs may be missing; the context window is limited; output is probabilistic and can differ each time; it can be wrong with confidence.')]) }), 'chat', 'Then you accept, edit or reject it. Remember the **limits**: a knowledge cut-off, a finite context window, non-deterministic output, weaker results for rare languages, and no real understanding.'),
    ],
  },

  /* ================= Domain 6: privacy and safeguards ================= */
  'gh-content-exclusion': {
    title: 'Configure content exclusions',
    steps: [
      gh(repoSet('Copilot', [form([{ h: 'Content exclusion', p: 'Paths to exclude from Copilot in this repository (one per line, fnmatch patterns):' }]), code('- "/config/secrets.js"\n- "/secrets/**"\n- "*.pem"', 'Paths to exclude'), note('Changes can take up to 30 minutes to reach IDEs that are already open.', 'warn')]), 'menu:Copilot', 'In **repository settings › Copilot › Content exclusion**, list the paths Copilot must ignore. Organization and enterprise admins can exclude paths across many repositories.'),
      gh(orgSet('Content exclusion', [code('contoso-shop:\n  - "/secrets/**"\n"*":\n  - "**/.env"', 'Repositories and paths to exclude')]), 'menu:Content exclusion', 'At the **organization** level, write YAML: a repository name (or `"*"` for all) and its paths.'),
      vs(ide({ files: [...FILES, 'config/', 'config/secrets.js'], tabs: ['secrets.js'], code: ['export const PAYMENT_KEY = process.env.PAYMENT_KEY;'], status: 'Copilot: content excluded for this file' }), 'status', 'Open an excluded file and the **Copilot status icon** shows it’s excluded: no inline suggestions, and the file isn’t used as context for other files.'),
      vs(cartIde({ side: 'settings', settings: [['Github › Copilot: Enable', '{ "*": true, "yaml": false, "plaintext": false }'], ['Editor: Inline Suggest: Enabled', 'On', 'tg']] }), 'set:Github › Copilot: Enable', '**Editor settings** are personal: turn completions off for languages such as plaintext or YAML. Note that exclusions don’t cover every Copilot feature, so check the docs for the ones you rely on.'),
    ],
  },
  'gh-public-code-filter': {
    title: 'Suggestions matching public code',
    steps: [
      gh(orgSet('Policies', [form([{ h: 'Privacy', f: [sel('Suggestions matching public code', 'Blocked', 'Block: hide matches. Allow: show them with a code reference.')] }], 'Save')]), 'f:Suggestions matching public code', 'The **public code** policy decides what happens when a suggestion matches code in public repositories (about 150 characters or more). Organizations set it for their seats; individuals set it in their own settings.'),
      vs(cartIde({ code: CART.slice(0, 3), status: 'Copilot: a suggestion matching public code was blocked' }), 'status', 'With **Block**, the matching suggestion simply isn’t shown.'),
      vs(cartIde({ term: ['[GitHub Copilot] Code reference', '  Similar code found with 1 license type: MIT', '  github.com/example/cart-utils/blob/main/total.js'] }), 'term', 'With **Allow**, the suggestion is shown and Copilot adds a **code reference**: the matching repositories and their **licences**, in the Output panel or the chat answer. You decide whether to use it and how to attribute it.'),
    ],
  },
  'gh-code-references': {
    title: 'Who owns the output, and what to check',
    steps: [
      vs(cartIde({ chat: chat('Ask', [me('/explain'), ai('…'), tool('📎 Similar code found with license: MIT (1 reference)')]) }), 'chat', 'When a chat answer matches public code, Copilot lists the **references** and licences. That’s your cue to check you can use it.'),
      vs(cartIde({ chat: chat('Ask', [ai('GitHub doesn’t claim ownership of the suggestions Copilot gives you. You are responsible for the code you accept: its correctness, security and licensing.')]) }), 'chat', 'GitHub doesn’t claim ownership of suggestions; **you** are responsible for what you accept. Business and Enterprise agreements also have terms about IP indemnity, so know what your plan says.'),
      vs(cartIde({ chat: chat('Ask', [ai('Limits to remember: suggestions can be insecure or outdated, can match public code, and may not fit your licence or policies.')]) }), 'chat', 'Limitations of output: it may be **wrong**, **insecure**, **outdated**, or **match licensed code**. Review, test, scan and check licences before it ships.'),
    ],
  },
  'gh-troubleshoot': {
    title: 'Troubleshoot Copilot',
    steps: [
      vs(cartIde({ status: 'Copilot: not signed in', palette: { q: 'copilot', items: ['**GitHub Copilot: Sign in**', 'GitHub Copilot: Open Logs', 'Developer: Reload Window'] } }), 'palette:**GitHub Copilot: Sign in**', 'No suggestions at all? Start with the **status bar icon**: are you signed in, and does the account have a **seat**?'),
      vs(ide({ files: [...FILES, 'config/', 'config/secrets.js'], tabs: ['secrets.js'], code: ['export const PAYMENT_KEY = process.env.PAYMENT_KEY;'], status: 'Copilot: content excluded for this file' }), 'status', 'Suggestions missing in one file only? It may be **excluded**, or completions may be **disabled for that language** in `github.copilot.enable`.'),
      vs(cartIde({ term: ['[GitHub Copilot] Fetching completions…', '[GitHub Copilot] Error: request blocked by proxy (407)', '[GitHub Copilot] Hint: set http.proxy or ask IT to allow *.githubcopilot.com'] }), 'term', 'Open **Output › GitHub Copilot** (or *GitHub Copilot: Open Logs*). Network errors often mean a **proxy or firewall** blocks Copilot’s endpoints.'),
      vs(cartIde({ chat: chat('Ask', [ai('Checklist: signed in with a seat · file not excluded · language enabled · public code filter not hiding it · network/proxy OK · extension up to date · exclusion changes can take 30 minutes.')]) }), 'chat', 'Other usual suspects: an out-of-date extension, a policy that turns a feature off, or an exclusion change that hasn’t reached the IDE yet (up to 30 minutes, or reload the window).'),
    ],
  },
  'gh-responsible-review': {
    title: 'Use Copilot responsibly in a team',
    steps: [
      vs(cartIde({ chat: chat('Ask', [me('Write a greeting for new customers using their first name'), ai('`Hello ${firstName}!` … Note: names vary across cultures; some people have one name. Consider `displayName` instead.')]) }), 'chat', 'Responsible AI principles (fairness, reliability and safety, privacy and security, inclusiveness, transparency, accountability) apply to code too. Watch for **bias** and assumptions in generated text and logic.'),
      vs(cartIde({ chat: chat('Ask', [me('Here is a customer export: …'), ai('⚠️ Please don’t paste real personal data or secrets into prompts. Use fake sample data instead.')]) }), 'chat', '**Privacy**: don’t paste secrets or personal data into prompts; use content exclusions for sensitive files.'),
      gh(pr({ n: 56, title: 'Add customer greeting', branch: 'feature/greeting', body: 'Parts of this change were drafted with GitHub Copilot and reviewed by me. Tests added.', items: [], reviewers: ['asha-dev (approved)'] }), undefined, '**Transparency and accountability**: say when AI helped, keep a person reviewing every change, and own the result. Harm is reduced by review, tests, scanning and policies, not by trusting the tool.'),
    ],
  },
};
