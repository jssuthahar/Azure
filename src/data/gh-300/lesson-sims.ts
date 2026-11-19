/**
 * Simulations shown in each GH-300 lesson's "Simulations" section
 * (VS Code & GitHub | 3D View | Practice Lab). Walkthroughs come from
 * ./portal-tours.ts (VS Code, github.com and the terminal); 3D modes from
 * ./sims3d.ts; Practice Labs are the GH-300 labs in src/lib/sim/labs-gh.ts.
 */
import type { LessonSims } from '../az-900/lesson-sims';

export const LESSON_SIMS: Record<string, LessonSims> = {
  /* Domain 1: Responsible AI */
  'generative-ai-risks-and-limitations': { d3: { mode: 'copilotflow', start: 4, intro: 'The model predicts, it doesn’t check. See where the risk comes from.' }, tour: { id: 'gh-hallucination-check', intro: 'Catch a suggestion that calls an API that doesn’t exist.' } },
  'responsible-ai-principles': { d3: { mode: 'copilotgov', start: 6, intro: 'Policies help, but someone still owns the output.' }, tour: { id: 'gh-responsible-review', intro: 'Spot bias, protect data and keep a human in the loop.' } },
  'validate-copilot-output': { d3: { mode: 'copilotflow', start: 6, intro: 'Accept or reject: the decision is yours.' }, tour: { id: 'gh-validate-output', intro: 'Test a suggestion, find the bug, fix it before you merge.' } },

  /* Domain 2: Copilot features */
  'copilot-plans': { d3: { mode: 'copilotgov', start: 0, intro: 'Individuals, organizations and enterprises get Copilot differently.' }, tour: { id: 'gh-plans-settings', intro: 'Compare the plans and see which settings come from your org.' } },
  'enable-copilot-in-the-ide': { d3: { mode: 'copilotgov', start: 2, intro: 'No seat, no Copilot. Assign one and watch it light up.' }, tour: { id: 'gh-install-extension', intro: 'Install the extension, sign in and check the status bar.' } },
  'inline-suggestions-chat-and-modes': { d3: { mode: 'copilotagent', start: 0, intro: 'Ask, Edit and Agent do very different things. Try each.' }, tour: { id: 'gh-inline-and-chat', intro: 'Ghost text, inline chat, the Chat view and the mode picker.' } },
  'copilot-chat-commands-and-limits': { d3: { mode: 'copilotcontext', start: 2, intro: 'What you add with # and @ is what Copilot sees.' }, tour: { id: 'gh-chat-commands', intro: 'Slash commands, participants, context, the model picker and feedback.' } },
  'copilot-cli-install-and-commands': { d3: { mode: 'copilotagent', start: 7, intro: 'The same agent, in your terminal.' }, tour: { id: 'gh-cli-terminal', intro: 'Install the CLI, trust the folder, sign in and pick a model.' } },
  'copilot-cli-sessions-and-scripts': { d3: { mode: 'copilotagent', start: 2, intro: 'An agent asks before it runs a command. Approve one.' }, tour: { id: 'gh-cli-scripts', intro: 'One-shot prompts, tool permissions and resuming a session.' } },
  'agent-mode-mcp-and-subagents': { d3: { mode: 'copilotagent', start: 3, intro: 'Call an MCP tool, then try a server your org blocks.' }, tour: { id: 'gh-agent-mode', intro: 'Run a task in agent mode, approve a command and add an MCP server.' } },
  'custom-instructions-and-prompt-files': { d3: { mode: 'copilotcontext', start: 5, intro: 'House rules that ride along with every prompt.' }, tour: { id: 'gh-instructions-files', intro: 'Write repository instructions, a path rule and a prompt file.' } },
  'copilot-code-review': { d3: { mode: 'copilotagent', start: 6, intro: 'Copilot comments; a person merges.' }, tour: { id: 'gh-code-review', intro: 'Request a Copilot review and commit its suggestion.' } },
  'spaces-spark-and-pr-summaries': { d3: { mode: 'copilotagent', start: 5, intro: 'Hand work to Copilot on github.com and get a PR back.' }, tour: { id: 'gh-pr-summary-spaces', intro: 'Write a PR summary, set up a Space and see what Spark builds.' } },
  'organization-policies': { d3: { mode: 'copilotgov', start: 1, intro: 'Set a policy at the top and see who can still change it.' }, tour: { id: 'gh-org-policies', intro: 'Access, feature policies and models for an organization.' } },
  'audit-log-and-seats-api': { d3: { mode: 'copilotgov', start: 5, intro: 'Every change leaves a trail.' }, tour: { id: 'gh-seats-audit', intro: 'Search the audit log, then manage seats with the REST API.' } },

  /* Domain 3: Data and architecture */
  'copilot-data-flow': { d3: { mode: 'copilotflow', start: 7, intro: 'Follow one prompt there and back, and see what’s kept.' }, tour: { id: 'gh-data-settings', intro: 'The privacy settings, the request flow and the metrics an org sees.' } },
  'prompt-building-and-context': { d3: { mode: 'copilotflow', start: 1, intro: 'Watch the IDE build a prompt from what’s around your cursor.' }, tour: { id: 'gh-context-chips', intro: 'Open tabs, #file and the references Copilot really used.' } },
  'proxy-filtering-and-post-processing': { d3: { mode: 'copilotflow', start: 3, intro: 'Send a normal request, then one the proxy filters.' }, tour: { id: 'gh-public-code-filter', intro: 'See a suggestion blocked, then shown with a code reference.' } },
  'suggestion-lifecycle-and-limits': { d3: { mode: 'copilotflow', start: 0, intro: 'From keystroke to ghost text, step by step.' }, tour: { id: 'gh-suggestion-lifecycle', intro: 'Cycle alternatives, accept word by word and meet the limits.' } },

  /* Domain 4: Prompt engineering */
  'prompt-structure-and-context': { d3: { mode: 'copilotcontext', start: 0, intro: 'A vague prompt, then a specific one.' }, tour: { id: 'gh-context-chips', intro: 'Point Copilot at the right code.' } },
  'zero-shot-and-few-shot-prompting': { d3: { mode: 'copilotcontext', start: 3, intro: 'No examples, then two. Compare.' }, tour: { id: 'gh-few-shot', intro: 'Teach Copilot your log format with two examples.' } },
  'prompt-engineering-and-chat-history': { d3: { mode: 'copilotcontext', start: 6, intro: 'Old turns pull answers off course. Start fresh.' }, tour: { id: 'gh-chat-history', intro: 'See history leak into answers, then fix it.' } },

  /* Domain 5: Productivity */
  'generate-refactor-and-document': { d3: { mode: 'copilotagent', start: 1, intro: 'Edit mode changes the files you pick; you keep or undo.' }, tour: { id: 'gh-refactor-doc', intro: 'Refactor a loop, review the diff and add docs.' } },
  'sample-data-and-legacy-code': { d3: { mode: 'copilotagent', start: 2, intro: 'Let agent mode modernize code and run the tests.' }, tour: { id: 'gh-legacy-modernize', intro: 'Explain legacy code, modernize it and generate fake data.' } },
  'unit-and-integration-tests': { d3: { mode: 'copilotagent', start: 2, intro: 'Plan, edit, run the tests, fix, repeat.' }, tour: { id: 'gh-generate-tests', intro: 'Generate tests with edge cases and read the failures.' } },
  'security-and-performance-fixes': { d3: { mode: 'copilotflow', start: 5, intro: 'Filters catch some insecure patterns, not all.' }, tour: { id: 'gh-security-fix', intro: 'Fix a SQL injection and an N+1 query with Copilot.' } },

  /* Domain 6: Privacy and safeguards */
  'content-exclusions': { d3: { mode: 'copilotgov', start: 4, intro: 'Open an excluded file and see what Copilot does.' }, tour: { id: 'gh-content-exclusion', intro: 'Exclude paths in a repository and across an organization.' } },
  'output-ownership-and-limits': { d3: { mode: 'copilotgov', start: 6, intro: 'Whatever the settings, you own what ships.' }, tour: { id: 'gh-code-references', intro: 'Code references, ownership and the limits of output.' } },
  'public-code-filter-and-references': { d3: { mode: 'copilotgov', start: 3, intro: 'Block, then Allow with a reference.' }, tour: { id: 'gh-public-code-filter', intro: 'Set the public code policy and read a code reference.' } },
  'troubleshoot-copilot': { d3: { mode: 'copilotgov', start: 7, intro: 'Copilot went quiet. Work through the checklist.' }, tour: { id: 'gh-troubleshoot', intro: 'Sign-in, exclusions, language settings, logs and proxies.' } },
};
