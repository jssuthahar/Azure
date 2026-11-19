/**
 * Narration for the GH-300 3D scenes (<Datacenter3D mode="..." />).
 * Same shape as az-900/sims3d.ts; the builders live in src/lib/dc3d/copilot.ts.
 * Step order matters: lesson-sims.ts opens a scene at a step index, and each
 * step's action ids must exist in that builder's `acts`.
 */
import type { Sim3D } from '../az-900/sims3d';

export type GhMode3D = 'copilotflow' | 'copilotcontext' | 'copilotagent' | 'copilotgov';

export const SIMS3D_GH: Record<GhMode3D, Sim3D> = {
  copilotflow: {
    title: 'GitHub Copilot: from your keystroke to a suggestion',
    steps: [
      { title: 'You type, then pause', text: 'Copilot doesn’t read your mind. When you **pause** while typing, the Copilot extension in your IDE starts a request for a completion.', actions: [{ id: 'keystroke', label: '⌨️ …I type a function signature?', kind: 'ok' }] },
      { title: 'The IDE builds a prompt', text: 'The extension gathers **context**: code before and after the cursor, the file name and language, and related snippets from **other open tabs**. That bundle is the **prompt**. A model has a limited **context window**, so the extension picks what matters most.', actions: [{ id: 'context', label: '📚 …the extension gathers context?', kind: 'ok' }] },
      { title: 'Content exclusions are checked', text: 'An admin can **exclude** paths or whole repositories. Excluded files are not used as context, and Copilot gives no inline suggestions inside them.', actions: [{ id: 'allowed', label: '✅ …the file is src/cart.js?', kind: 'ok' }, { id: 'excluded', label: '🚫 …the file is config/secrets.js (excluded)?', kind: 'danger' }] },
      { title: 'The Copilot proxy', text: 'The prompt goes over **HTTPS** to a GitHub-hosted **proxy**. It authenticates the request and runs **pre-filters**, for example for harmful or offensive content and prompt-injection attempts, before anything reaches the model.', actions: [{ id: 'normal', label: '🛡️ …it’s a normal coding request?', kind: 'ok' }, { id: 'toxic', label: '⛔ …the request contains offensive text?', kind: 'danger' }] },
      { title: 'The model predicts code', text: 'A **large language model** predicts the most likely next tokens. It matches patterns from training data and your context; it doesn’t run, test or truly understand your code. That’s why output can be wrong, outdated or insecure.', actions: [{ id: 'generate', label: '🧠 …the model generates a completion?', kind: 'ok' }] },
      { title: 'Post-processing filters', text: 'Before you see it, the response is **post-processed**: checks for code quality and common insecure patterns, offensive content, and (if your policy says **Block**) a check for **matches with public code** of about 150 characters or more.', actions: [{ id: 'clean', label: '🧹 …the suggestion is clean?', kind: 'ok' }, { id: 'publicmatch', label: '🔁 …it matches public code and the policy is Block?', kind: 'danger' }] },
      { title: 'Ghost text: accept or reject', text: 'The suggestion appears as **grey ghost text**. **Tab** accepts, **Esc** dismisses, **Alt+]** / **Alt+[** cycle alternatives, **Ctrl+→** accepts word by word. You decide what goes into your code.', actions: [{ id: 'accept', label: '💡 …I press Tab?', kind: 'ok' }, { id: 'reject', label: '✋ …I press Esc?', kind: 'plain' }] },
      { title: 'What data is kept', text: 'Prompts and suggestions are **encrypted in transit**. For **Copilot Business and Enterprise**, your code is **not used to train** GitHub’s models, and prompts and suggestions from IDE code completion are not retained after the response. **Engagement data** (accepts, rejects, errors) is kept to run and improve the service and to power usage metrics.', actions: [{ id: 'normal', label: '🔐 …a Business user sends a prompt?', kind: 'ok' }] },
    ],
  },
  copilotcontext: {
    title: 'Prompt crafting: what you give Copilot decides what you get',
    steps: [
      { title: 'A vague prompt', text: 'Copilot only knows what is in the **prompt**. “Write a function” leaves it to guess the language, inputs, outputs and rules, so you get something generic.', actions: [{ id: 'vague', label: '😕 …I ask “write a function”?', kind: 'danger' }, { id: 'specific', label: '🎯 …I describe inputs, outputs and rules?', kind: 'ok' }] },
      { title: 'Structure: goal, context, constraints', text: 'A good prompt has a **goal** (what and why), **context** (which code, which framework) and **constraints** (style, edge cases, what not to do). Short is fine; vague is not.', actions: [{ id: 'specific', label: '🎯 …I add the goal and the rules?', kind: 'ok' }] },
      { title: 'How context is chosen', text: 'In chat, Copilot uses the **active file** and any **selection**, plus what you add: `#file`, `#codebase` (search your workspace), `#terminalSelection`, images, or a participant such as `@workspace`. Inline suggestions also use **open tabs**, so close unrelated ones.', actions: [{ id: 'addfile', label: '📄 …I add #file:src/discount.js?', kind: 'ok' }] },
      { title: 'Zero-shot and few-shot', text: '**Zero-shot**: just the instruction. **Few-shot**: include one or more **examples** of the input and the output you want, then ask. Few-shot wins when your format is unusual.', actions: [{ id: 'zeroshot', label: '0️⃣ …I give no example?', kind: 'plain' }, { id: 'fewshot', label: '🧾 …I give two examples first?', kind: 'ok' }] },
      { title: 'Break it down, then iterate', text: 'Split a big task into **small steps** and check each answer. Then **iterate**: keep what’s right and ask for the next change. Prompting is a conversation.', actions: [{ id: 'steps', label: '🪜 …I ask one step at a time?', kind: 'ok' }, { id: 'iterate', label: '🔁 …I refine the answer?', kind: 'ok' }] },
      { title: 'Custom instructions', text: '**Repository instructions** (`.github/copilot-instructions.md`) and **path-specific** `.instructions.md` files are added to requests automatically, so the house rules travel with every prompt.', actions: [{ id: 'instr', label: '📋 …the repo has instructions?', kind: 'ok' }] },
      { title: 'Chat history is context too', text: 'Earlier messages in the **same conversation** go into the prompt. That helps follow-ups (“now add tests”) but old, unrelated turns can **confuse** the answer and fill the context window.', actions: [{ id: 'stale', label: '🌀 …the chat is full of an old topic?', kind: 'danger' }, { id: 'fresh', label: '🧽 …I start a new chat?', kind: 'ok' }] },
      { title: 'The prompt process, end to end', text: 'Your words + selected context + instructions + history → the prompt. The model answers, you **review**, then refine. Better input, less clean-up.', actions: [{ id: 'iterate', label: '🔁 …I go round the loop once more?', kind: 'ok' }] },
    ],
  },
  copilotagent: {
    title: 'Copilot modes and agents: Ask, Edit, Agent, MCP and the coding agent',
    steps: [
      { title: 'Ask mode', text: '**Ask** answers questions about code and concepts and can suggest code blocks. It doesn’t change your files by itself.', actions: [{ id: 'askq', label: '💬 …I ask how cartTotal works?', kind: 'ok' }] },
      { title: 'Edit mode (Copilot Edits)', text: '**Edit** applies changes to the files you choose, across several files at once. You see each **diff** and **Keep** or **Undo** it.', actions: [{ id: 'editq', label: '✏️ …I ask to rename a field in 3 files?', kind: 'ok' }] },
      { title: 'Agent mode', text: '**Agent** works out which files to touch, edits them, **runs commands and tests**, reads errors and keeps going until the task is done. It asks before running terminal commands unless you’ve approved them.', actions: [{ id: 'agentq', label: '🤖 …I ask it to add a feature with tests?', kind: 'ok' }, { id: 'terminal', label: '✋ …it wants to run npm install?', kind: 'plain' }] },
      { title: 'MCP servers add tools', text: 'The **Model Context Protocol (MCP)** lets Copilot use external **tools**: the GitHub MCP server, a browser, a docs search or your own API. Configure servers in `.vscode/mcp.json` (VS Code) or with `/mcp` (CLI). Organizations can restrict which servers are allowed.', actions: [{ id: 'mcp', label: '🔌 …it calls an MCP tool?', kind: 'ok' }, { id: 'blocked', label: '🚫 …the server isn’t allowed by policy?', kind: 'danger' }] },
      { title: 'Sessions and sub-agents', text: 'Long tasks fill the **context window**. Agent **sessions** keep work separate, and a **sub-agent** can do a side task in its own context and hand back only a summary.', actions: [{ id: 'subagent', label: '🧩 …I delegate research to a sub-agent?', kind: 'ok' }] },
      { title: 'Copilot coding agent', text: 'Assign an issue to **Copilot** on github.com (or `/delegate` from the CLI). The **coding agent** works in a GitHub Actions environment on its own branch and opens a **draft pull request** with its changes.', actions: [{ id: 'delegate', label: '☁️ …I assign issue #44 to Copilot?', kind: 'ok' }] },
      { title: 'Review stays human', text: 'You review the agent’s PR like any other. **Copilot code review** can comment and suggest changes, but its review doesn’t count as an approval. A person merges.', actions: [{ id: 'review', label: '👀 …the PR is ready?', kind: 'ok' }] },
      { title: 'Copilot CLI', text: 'The same agent in the terminal: `copilot` for a session with slash commands, `copilot -p "…"` for one prompt, and `--allow-tool` / `--deny-tool` to control what it may run.', actions: [{ id: 'cli', label: '⌨️ …I start copilot in the terminal?', kind: 'ok' }] },
    ],
  },
  copilotgov: {
    title: 'Copilot for organizations: plans, policies, privacy and safeguards',
    steps: [
      { title: 'Plans and seats', text: 'Individuals use **Copilot Free, Pro or Pro+**. Organizations buy **Copilot Business** per seat; **Copilot Enterprise** adds features on GitHub Enterprise Cloud. Admins assign seats to users or teams.', actions: [{ id: 'plan', label: '🏢 …a company wants Copilot?', kind: 'ok' }] },
      { title: 'Policies flow down', text: 'An **enterprise** can enforce a Copilot policy for all its organizations or leave the choice to each **organization**. Policies cover features (chat in the IDE, on github.com, the CLI, code review, agents), models and MCP.', actions: [{ id: 'inherit', label: '📜 …the enterprise enforces a policy?', kind: 'ok' }] },
      { title: 'Seats light up Copilot', text: 'A developer gets Copilot once they have a **seat**. Remove the seat and Copilot stops at the end of the billing cycle.', actions: [{ id: 'assign', label: '🪪 …I assign a seat?', kind: 'ok' }, { id: 'noseat', label: '❌ …the user has no seat?', kind: 'danger' }] },
      { title: 'Suggestions matching public code', text: 'A policy decides what happens when a suggestion matches **public code**: **Block** hides it; **Allow** shows it with a **code reference** (repository and licence) so you can decide.', actions: [{ id: 'block', label: '🔁 …the policy is Block?', kind: 'danger' }, { id: 'allowref', label: '📎 …the policy is Allow?', kind: 'ok' }] },
      { title: 'Content exclusions', text: 'Repository, organization and enterprise admins can **exclude** files and paths. Copilot won’t use them as context or suggest inside them in supported IDEs. Changes can take **up to 30 minutes** to reach editors.', actions: [{ id: 'exclude', label: '🚫 …a developer opens an excluded file?', kind: 'danger' }] },
      { title: 'Audit log and metrics', text: 'Copilot settings changes, seat assignments and content exclusion changes appear in the **audit log**. Usage metrics and the REST API show adoption and activity.', actions: [{ id: 'log', label: '📒 …someone changes a policy?', kind: 'ok' }] },
      { title: 'Responsible use', text: 'Policies reduce risk, but the developer still **owns the output**: review it, test it, scan it for vulnerabilities and check licences before it ships.', actions: [{ id: 'review', label: '🧑‍⚖️ …Copilot’s code is ready to merge?', kind: 'ok' }] },
      { title: 'Troubleshooting', text: 'No suggestions? Check the **seat** and sign-in, whether the **file is excluded**, whether the language is **disabled** in settings, the **public code filter**, network or proxy settings, and the **Copilot logs** in the IDE.', actions: [{ id: 'troubleshoot', label: '🧰 …Copilot stops suggesting?', kind: 'plain' }] },
    ],
  },
};
