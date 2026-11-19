/**
 * GH-300 practice labs: GitHub Copilot CLI, git and gh in a simulated
 * developer terminal (see ghsim.ts). Every task is checked from simulator
 * events, and every task's `cli` hint completes it when run as written, in
 * order (scripts/qa/tools.mjs replays them, answering y to each question).
 */
import type { Sim } from './engine';
import type { Lab } from './labs';

const ev = (s: Sim, type: string, pred: (d: Record<string, any>) => boolean = () => true) => s.events.some((e) => e.type === type && pred(e.data));

export const GH_LABS: Lab[] = [
  /* ------------------------------------------------------- setup */
  {
    id: 'gh-cli-setup', exam: 'gh-300', title: 'Install and start GitHub Copilot CLI', icon: '⌨️', level: 'Beginner', minutes: 8, start: 'terminal',
    intro: 'Get Copilot into your terminal. Check Node.js, install the CLI, trust the folder, sign in, pick a model and ask your first question about the code in front of you.',
    learn: ['Install with npm (Node.js 22+), Homebrew, WinGet or the install script', 'The trusted-folder prompt and /login', 'Choosing a model with /model', 'Adding a file to the context with @path, and checking /usage'],
    topics: ['copilot-cli-install-and-commands', 'enable-copilot-in-the-ide', 'copilot-plans'],
    tasks: [
      { text: 'Check the **Node.js** version (the CLI needs 22 or later), then install **GitHub Copilot CLI** with npm.', cli: 'node -v && npm install -g @github/copilot && copilot version', check: (s) => ev(s, 'copilot.install') },
      { text: 'Start an interactive session with **copilot** and **trust** this folder when asked.', cli: 'copilot', check: (s) => ev(s, 'copilot.trust') && ev(s, 'copilot.session') },
      { text: 'Sign in with **/login** (the device flow: a one-time code you approve on github.com).', cli: '/login', check: (s) => ev(s, 'copilot.login') },
      { text: 'Look at the models with **/model**, then pick **gpt-5-mini** for this session.', cli: '/model gpt-5-mini', check: (s) => ev(s, 'copilot.model') },
      { text: 'Add **src/cart.js** to the context with **@** and ask Copilot to **explain** it.', cli: 'explain @src/cart.js', check: (s) => ev(s, 'copilot.context.add', (d) => d.file === 'src/cart.js') && ev(s, 'copilot.prompt', (d) => d.kind === 'explain') },
      { text: 'Check what the session used so far with **/usage**.', cli: '/usage', check: (s) => ev(s, 'copilot.usage') },
      { text: 'Leave the session with **/exit**. It is saved, so you can resume it later.', cli: '/exit', check: (s) => ev(s, 'copilot.exit') },
    ],
    wrap: 'Copilot CLI is the copilot command: install it with npm install -g @github/copilot (or Homebrew, WinGet or the install script), trust the folder, /login once, and you can chat about the repo you are standing in. @file adds a file to the context. Your plan and your organization\'s policy decide which models you can pick and whether the CLI is allowed at all.',
  },

  /* ------------------------------------------- scripts, files, permissions */
  {
    id: 'gh-cli-scripts', exam: 'gh-300', title: 'Scripts, files and tool permissions in Copilot CLI', icon: '🛠️', level: 'Intermediate', minutes: 10, start: 'terminal',
    intro: 'Let Copilot write a script and tidy files, but on your terms. Run one prompt non-interactively, see why it stops, give it exactly the permissions it needs and block the ones it doesn\'t.',
    learn: ['copilot -p for one prompt without a session', '--allow-tool and --deny-tool (deny always wins)', 'Approving a tool interactively for one session', 'Resuming the last session with --continue'],
    topics: ['copilot-cli-sessions-and-scripts', 'copilot-cli-install-and-commands', 'validate-copilot-output'],
    tasks: [
      { text: 'Install the CLI and sign in from the shell with **copilot login**.', cli: 'npm install -g @github/copilot && copilot login', check: (s) => ev(s, 'copilot.install') && ev(s, 'copilot.login') },
      { text: 'Ask for a log **backup script** with **-p** and no permissions. Read why nothing was written.', cli: 'copilot -p "write a bash script that backs up logs/ and keeps 7 archives"', check: (s) => ev(s, 'gh.tool.blocked', (d) => d.tool === 'write') },
      { text: 'Run it again allowing **write** but denying **shell(chmod)**. Then **cat** the script and review it before you run anything.', cli: "copilot -p \"write a bash script that backs up logs/ and keeps 7 archives\" --allow-tool 'write' --deny-tool 'shell(chmod)' && cat scripts/backup-logs.sh", check: (s) => ev(s, 'gh.file', (d) => d.path === 'scripts/backup-logs.sh') && ev(s, 'gh.tool.denied', (d) => d.tool === 'shell(chmod)') && ev(s, 'gh.cat', (d) => d.path === 'scripts/backup-logs.sh') },
      { text: 'Start a session and ask Copilot to **organize** the old log files into an archive folder. Approve **shell(mv)** when it asks.', cli: 'copilot -i "organize the old log files into logs/archive"', check: (s) => ev(s, 'gh.files.moved') },
      { text: 'Run **git status** from inside the session with **!**, then **/exit**.', cli: '!git status', check: (s) => ev(s, 'copilot.shell', (d) => /git status/.test(d.cmd)) },
      { text: 'Leave with **/exit**, then pick the conversation up again with **copilot --continue**.', cli: '/exit', check: (s) => ev(s, 'copilot.exit') },
      { text: 'Resume the most recent session in this folder.', cli: 'copilot --continue', check: (s) => ev(s, 'copilot.session', (d) => d.resumed) },
    ],
    wrap: 'copilot -p runs one prompt and exits, which is what you want in scripts and CI, but it cannot stop to ask, so it only uses the tools you allow with --allow-tool. --deny-tool always beats an allow. In a session Copilot asks before each new tool, and a yes lasts for that session. Whatever it writes is a draft: read it before you run it.',
  },

  /* ------------------------------------------------ instructions + agents */
  {
    id: 'gh-instructions', exam: 'gh-300', title: 'Custom instructions and a custom agent', icon: '📋', level: 'Intermediate', minutes: 10, start: 'terminal',
    intro: 'Stop repeating yourself in every prompt. Write repository instructions, add path-specific instructions for tests, and create a custom agent that only writes tests, then watch Copilot follow them.',
    learn: ['.github/copilot-instructions.md for the whole repo', '.github/instructions/*.instructions.md with applyTo', 'Custom agents in .github/agents/<name>.agent.md', 'Running an agent with --agent'],
    topics: ['custom-instructions-and-prompt-files', 'copilot-chat-commands-and-limits', 'prompt-structure-and-context'],
    tasks: [
      { text: 'Install and sign in, then create **.github/copilot-instructions.md** saying tests use the **Node test runner**.', cli: 'npm install -g @github/copilot && copilot login && mkdir -p .github && echo "Use Node.js 22 and ES modules. Tests use the Node test runner (node --test). Never log secrets." > .github/copilot-instructions.md', check: (s) => ev(s, 'gh.file', (d) => d.path === '.github/copilot-instructions.md') },
      { text: 'Add a **path-specific** instructions file for tests with **applyTo: "tests/**"**.', cli: 'mkdir -p .github/instructions && echo "---\\napplyTo: \\"tests/**\\"\\n---\\nArrange, act, assert. One behaviour per test. Name tests after the behaviour." > .github/instructions/tests.instructions.md', check: (s) => ev(s, 'gh.file', (d) => d.path === '.github/instructions/tests.instructions.md' && /applyTo/.test(d.text ?? '')) },
      { text: 'Ask for unit tests with **-p** and allow **write**. Check the answer says which instructions it used.', cli: "copilot -p \"write unit tests for src/discount.js\" --allow-tool 'write'", check: (s) => ev(s, 'gh.tests.created', (d) => d.instructions) },
      { text: 'Create a custom agent **test-writer** in **.github/agents/test-writer.agent.md**.', cli: 'mkdir -p .github/agents && echo "---\\nname: test-writer\\ndescription: Writes and fixes unit tests only\\ntools: [read, edit]\\n---\\nYou write tests. Never change files outside tests/ unless asked." > .github/agents/test-writer.agent.md', check: (s) => ev(s, 'gh.file', (d) => d.path === '.github/agents/test-writer.agent.md') },
      { text: 'Run the agent with **--agent=test-writer**.', cli: "copilot --agent=test-writer -p \"write unit tests for src/discount.js\" --allow-tool 'write'", check: (s) => ev(s, 'copilot.prompt', (d) => d.agent === 'test-writer') },
      { text: 'Run the tests. Two fail: that is Copilot\'s tests finding a real bug.', cli: 'npm test', check: (s) => ev(s, 'npm.test', (d) => d.fail > 0) },
    ],
    wrap: 'Repository instructions (.github/copilot-instructions.md, or AGENTS.md) are added to every request in the repo. Path-specific .instructions.md files add rules only for matching files through applyTo. A custom agent (.agent.md) is a named persona with its own instructions and tools that you can run with --agent or pick with /agent. In VS Code, .prompt.md files in .github/prompts are reusable prompts you run with /name.',
  },

  /* ----------------------------------------------------- tests and fixes */
  {
    id: 'gh-tests', exam: 'gh-300', title: 'Tests, edge cases and a fix with Copilot', icon: '🧪', level: 'Intermediate', minutes: 10, start: 'terminal',
    intro: 'Use Copilot the way a careful developer would: write tests first, let the edge cases expose the bug, ask for the smallest fix, and prove it with a green run before you commit.',
    learn: ['Asking for tests that cover edge cases', 'Reading a failing assertion', 'A minimal fix, reviewed as a diff', 'Committing only after the tests pass'],
    topics: ['unit-and-integration-tests', 'validate-copilot-output', 'generate-refactor-and-document'],
    tasks: [
      { text: 'Install and sign in, then run the existing tests.', cli: 'npm install -g @github/copilot && copilot login && npm test', check: (s) => ev(s, 'npm.test') },
      { text: 'In a session, ask for **unit tests** for **src/discount.js** with edge cases. Approve **write**.', cli: 'copilot -i "write unit tests for src/discount.js with edge cases"', check: (s) => ev(s, 'gh.tests.created', (d) => d.edgeCases) },
      { text: 'Leave the session and run the tests. Read the failing assertion.', cli: '/exit', check: (s) => ev(s, 'copilot.exit') },
      { text: 'Run the tests and read which edge cases fail.', cli: 'npm test', check: (s) => ev(s, 'npm.test', (d) => d.fail > 0) },
      { text: 'Ask Copilot to **fix** the bug the tests found, allowing **write**, and read the diff it prints.', cli: "copilot -p \"fix the bug the tests found in src/discount.js\" --allow-tool 'write'", check: (s) => ev(s, 'gh.fix') },
      { text: 'Run the tests again until they all pass, then **commit** the tests and the fix.', cli: 'npm test && git add . && git commit -m "Default unknown discount codes to 0% and add edge-case tests"', check: (s) => ev(s, 'npm.test', (d) => d.fail === 0 && d.files >= 2) && ev(s, 'git.commit') },
    ],
    wrap: 'Copilot is good at listing edge cases you might skip: an unknown code, no code, an empty cart. A failing test it wrote is not a Copilot mistake, it is a bug found early. Ask for the smallest fix, read the diff, and only commit once the whole suite is green.',
  },

  /* -------------------------------------------------- MCP and delegation */
  {
    id: 'gh-mcp-agents', exam: 'gh-300', title: 'MCP servers and delegating to the coding agent', icon: '🔌', level: 'Intermediate', minutes: 10, start: 'terminal',
    intro: 'Give Copilot more reach. Look at the built-in GitHub MCP server, add a docs server, let Copilot call a tool to read your issues, then hand a bigger task to Copilot coding agent so it opens a pull request.',
    learn: ['The built-in GitHub MCP server', '/mcp list, add and show', 'Tool calls need your approval', '/delegate: Copilot coding agent works in the cloud and opens a draft PR'],
    topics: ['agent-mode-mcp-and-subagents', 'inline-suggestions-chat-and-modes', 'copilot-code-review'],
    tasks: [
      { text: 'Install, start a session, trust the folder and **/login**.', cli: 'npm install -g @github/copilot && copilot', check: (s) => ev(s, 'copilot.session') },
      { text: 'Sign in with **/login**.', cli: '/login', check: (s) => ev(s, 'copilot.login') },
      { text: 'List the MCP servers with **/mcp list**. One is built in.', cli: '/mcp list', check: (s) => ev(s, 'copilot.mcp.list') },
      { text: 'Add an MCP server named **docs** with **/mcp add**.', cli: '/mcp add docs', check: (s) => ev(s, 'copilot.mcp.add', (d) => d.name === 'docs') },
      { text: 'Ask about the open **issues** labelled bug. Approve the MCP tool call.', cli: 'which open issues are labelled bug in this repo?', check: (s) => ev(s, 'gh.mcp.call', (d) => d.tool === 'list_issues') },
      { text: 'Hand issue #44 to the coding agent with **/delegate**.', cli: '/delegate fix issue #44: cart total shows NaN for unknown codes', check: (s) => ev(s, 'copilot.delegate') },
      { text: 'Leave the session and list the pull requests: the agent\'s draft PR is waiting for your review.', cli: '/exit', check: (s) => ev(s, 'copilot.exit') && ev(s, 'copilot.delegate') },
    ],
    wrap: 'MCP (Model Context Protocol) servers give Copilot tools: the GitHub MCP server for issues, pull requests and Actions, others for docs, browsers or your own APIs. Each new tool call needs your approval. /delegate hands the task to Copilot coding agent, which works on its own branch in a GitHub Actions environment and opens a draft pull request that a human still reviews and merges.',
  },

  /* ------------------------------------------------- seats and audit log */
  {
    id: 'gh-seats-audit', exam: 'gh-300', title: 'Manage Copilot seats and read the audit log', icon: '🪪', level: 'Intermediate', minutes: 8, start: 'terminal',
    intro: 'You\'re the Contoso org admin. Check the Copilot subscription with the REST API, find a seat nobody uses, give a new developer a seat, take one away, and prove it all from the audit log.',
    learn: ['GET /orgs/{org}/copilot/billing and /billing/seats', 'last_activity_at to find unused seats', 'POST and DELETE /copilot/billing/selected_users', 'Audit log search with action:copilot'],
    topics: ['audit-log-and-seats-api', 'organization-policies', 'copilot-plans'],
    tasks: [
      { text: 'Check your token, then read the org\'s **Copilot billing** settings.', cli: 'gh auth status && gh api /orgs/contoso/copilot/billing', check: (s) => ev(s, 'gh.api', (d) => d.path === 'copilot/billing') },
      { text: 'List the **seats** and find the one with no activity since September.', cli: 'gh api /orgs/contoso/copilot/billing/seats', check: (s) => ev(s, 'gh.api', (d) => d.path === 'copilot/billing/seats') },
      { text: 'Give **dina-new** a seat.', cli: 'gh api -X POST /orgs/contoso/copilot/billing/selected_users -f "selected_usernames[]=dina-new"', check: (s) => ev(s, 'gh.seats.add', (d) => d.users.includes('dina-new')) },
      { text: 'Remove the unused seat of **chen-qa**.', cli: 'gh api -X DELETE /orgs/contoso/copilot/billing/selected_users -f "selected_usernames[]=chen-qa"', check: (s) => ev(s, 'gh.seats.remove', (d) => d.users.includes('chen-qa')) },
      { text: 'Search the **audit log** for Copilot events.', cli: 'gh api "/orgs/contoso/audit-log?phrase=action:copilot"', check: (s) => ev(s, 'gh.audit', (d) => /action:copilot/.test(d.phrase)) },
    ],
    wrap: 'The Copilot user management API works on /orgs/{org}/copilot/billing: read the settings, list seats with last_activity_at and last_activity_editor, and add or cancel seats for users (selected_users) or teams (selected_teams). A cancelled seat stays usable until the end of the billing cycle. Every change lands in the audit log, where action:copilot finds it.',
  },

];

/** Free Copilot terminal: offered on every GH-300 lesson, and used when no guided lab fits. */
export const GH_SANDBOX: Lab = {
  id: 'gh-sandbox', exam: 'gh-300', title: 'Copilot terminal sandbox', icon: '🎛️', level: 'Beginner', minutes: 0, start: 'terminal',
  intro: 'A free terminal with GitHub Copilot CLI, git and gh. No tasks: install the CLI, start a session, try slash commands and tool permissions, or call the seats API.',
  learn: [], topics: [], tasks: [], wrap: '',
};
