/**
 * Exam-format practice items for the GH-300 mock exam (Yes/No series,
 * matching, ordering, drop-down completion). Every item is ORIGINAL, written
 * from the official skills outline; none are real or recalled exam questions.
 */
import type { FormatItem } from '../az-900/exam-items';

export const EXAM_ITEMS: FormatItem[] = [
  /* ---------------- Domain 1: Responsible AI ---------------- */
  { kind: 'yesno', id: 'gh-x1-yn-risks', domain: 1, objective: '1.1.1', statements: [
    { text: 'GitHub Copilot can suggest a function or package that does not exist.', answer: true },
    { text: 'Because Copilot is trained on public code, its suggestions are free of security vulnerabilities.', answer: false },
    { text: 'A suggestion can reflect bias present in its training data.', answer: true },
  ], explanation: 'Large language models can **hallucinate** APIs and packages, can reproduce **insecure** patterns they have seen, and can reflect **bias** from training data. That is why output must be reviewed.' },
  { kind: 'order', id: 'gh-x1-order-validate', domain: 1, objective: '1.2.1', question: 'Copilot generated a function that you plan to merge. Which four actions should you perform in sequence?', actions: ['Read the suggestion and make sure you understand it', 'Write or generate tests that include edge cases', 'Run the tests and code scanning in CI', 'Open a pull request for a human review', 'Merge immediately because Copilot wrote it'], answer: [0, 1, 2, 3], explanation: 'Understand it, test it (including edge cases), let **CI and code scanning** check it, then a **person reviews** the pull request. Copilot output is a draft you own.' },
  { kind: 'match', id: 'gh-x1-match-harms', domain: 1, objective: '1.1.3', itemsLabel: 'Mitigations', question: 'Match each risk to the best mitigation. Each mitigation may be used once, more than once, or not at all.', items: ['Content exclusions', 'Code review and tests', 'Public code filter set to Block', 'Use fake sample data in prompts'], targets: [
    { text: 'A suggestion has a subtle logic bug', answer: 1 },
    { text: 'A suggestion closely matches licensed public code', answer: 2 },
    { text: 'Copilot could read a file of production secrets as context', answer: 0 },
  ], explanation: 'Bugs are caught by **review and tests**. Matches with public code are hidden by the **public code filter** (Block). Sensitive files are kept out of context with **content exclusions**. Fake data is a good habit, but not the answer to these three.' },

  /* ---------------- Domain 2: Features ---------------- */
  { kind: 'dropdown', id: 'gh-x2-dd-modes', domain: 2, objective: '2.1.2', question: 'Complete the sentence.', parts: [
    'You want Copilot to find the files to change, edit them, run the tests and fix failures until the task is done. In Copilot Chat, select ',
    { options: ['Ask mode', 'Edit mode', 'Agent mode', 'inline chat'], answer: 2 },
    '. To only explain a selected function without changing files, select ',
    { options: ['Ask mode', 'Edit mode', 'Agent mode'], answer: 0 },
    '.',
  ], explanation: '**Agent** mode plans, edits, runs commands and iterates. **Ask** mode answers questions and changes nothing on its own. **Edit** mode changes files you choose.' },
  { kind: 'order', id: 'gh-x2-order-cli', domain: 2, objective: '2.2.2', question: 'You need to start using GitHub Copilot CLI on a new machine. Which four actions should you perform in sequence?', actions: ['Install Node.js 22 or later', 'Run npm install -g @github/copilot', 'Run copilot and confirm that you trust the folder', 'Sign in with /login', 'Run gh extension install github/gh-copilot'], answer: [0, 1, 2, 3], explanation: 'Copilot CLI is the **copilot** command from the **@github/copilot** package (or Homebrew, WinGet or the install script). Start it, trust the folder, then **/login**. The old gh-copilot extension is not Copilot CLI.' },
  { kind: 'yesno', id: 'gh-x2-yn-cli', domain: 2, objective: '2.2.3', statements: [
    { text: 'copilot -p runs a single prompt non-interactively and then exits.', answer: true },
    { text: 'If a tool is listed in both --allow-tool and --deny-tool, Copilot CLI allows it.', answer: false },
    { text: 'copilot --continue resumes the most recent session in the current folder.', answer: true },
  ], explanation: '`-p` is programmatic mode. **Deny wins** over allow. `--continue` resumes the latest session; `--resume` lets you pick one.' },
  { kind: 'match', id: 'gh-x2-match-files', domain: 2, objective: '2.3.3', itemsLabel: 'Files', question: 'Match each requirement to the file you should create. Each file may be used once, more than once, or not at all.', items: ['.github/copilot-instructions.md', '.github/instructions/tests.instructions.md', '.github/prompts/new-endpoint.prompt.md', '.vscode/mcp.json'], targets: [
    { text: 'Every Copilot Chat request in the repository should follow the team’s coding standards', answer: 0 },
    { text: 'Rules that apply only when Copilot works on files in tests/', answer: 1 },
    { text: 'A reusable request the team runs with a slash command', answer: 2 },
    { text: 'Give agent mode a tool from an MCP server', answer: 3 },
  ], explanation: 'Repository-wide rules go in **copilot-instructions.md**; folder rules in an **.instructions.md** file with **applyTo**; a reusable request in a **.prompt.md** file; MCP servers in **mcp.json**.' },
  { kind: 'yesno', id: 'gh-x2-yn-review', domain: 2, objective: '2.3.2', statements: [
    { text: 'You can request a review from Copilot on a pull request in the same way you request a review from a person.', answer: true },
    { text: 'A Copilot code review counts as an approval for branch protection rules.', answer: false },
    { text: 'Copilot code review can use the standards in the repository’s custom instructions.', answer: true },
  ], explanation: 'Add **Copilot** as a reviewer (or set a ruleset). Its review is always a **comment**, never an approval. It reads **custom instructions** for your standards.' },
  { kind: 'dropdown', id: 'gh-x2-dd-seats', domain: 2, objective: '2.4.3', question: 'Complete the REST API call.', parts: [
    'To give user dina-new a Copilot Business seat in the contoso organization, send ',
    { options: ['GET', 'POST', 'PATCH', 'DELETE'], answer: 1 },
    ' to /orgs/contoso/copilot/billing/',
    { options: ['seats', 'selected_users', 'selected_teams', 'usage'], answer: 1 },
    ' with selected_usernames set to dina-new.',
  ], explanation: '**POST /orgs/{org}/copilot/billing/selected_users** adds seats; **DELETE** on the same endpoint cancels them. `selected_teams` is for teams; `/billing/seats` lists seats.' },
  { kind: 'match', id: 'gh-x2-match-where', domain: 2, objective: '2.4.1', itemsLabel: 'Where', question: 'Match each task to where an administrator does it. Each location may be used once, more than once, or not at all.', items: ['Organization settings › Copilot › Policies', 'Organization settings › Audit log', 'Repository settings › Copilot › Content exclusion', 'Personal settings › Copilot'], targets: [
    { text: 'Turn off Copilot coding agent for every member of the organization', answer: 0 },
    { text: 'Find out who changed a Copilot policy last week', answer: 1 },
    { text: 'Stop Copilot using one repository’s /secrets folder', answer: 2 },
  ], explanation: 'Feature switches are org **policies**. Who-changed-what is in the **audit log** (filter `action:copilot`). Paths for one repository are excluded in that repository’s **Copilot** settings.' },

  /* ---------------- Domain 3: Data and architecture ---------------- */
  { kind: 'order', id: 'gh-x3-order-lifecycle', domain: 3, objective: '3.2.1', question: 'Put the steps of an inline code suggestion in order.', actions: ['The IDE extension gathers context and builds a prompt', 'The prompt is sent securely to the Copilot proxy, which applies filters', 'The model generates a completion', 'Post-processing filters check the completion', 'The suggestion is shown as ghost text', 'The model retrains on your code'], answer: [0, 1, 2, 3, 4], explanation: 'Context → prompt → **proxy** (pre-filters) → **model** → **post-processing** → ghost text. Copilot does not retrain on your code as part of a suggestion.' },
  { kind: 'yesno', id: 'gh-x3-yn-data', domain: 3, objective: '3.1.1', statements: [
    { text: 'Code from open editor tabs can be part of the prompt for an inline suggestion.', answer: true },
    { text: 'With Copilot Business, your prompts and code are used to train GitHub’s models by default.', answer: false },
    { text: 'Data between the IDE and Copilot is encrypted in transit.', answer: true },
  ], explanation: 'Open tabs are a context source. For **Business and Enterprise**, customer code is **not used to train** models. Traffic is **encrypted** in transit.' },

  /* ---------------- Domain 4: Prompt engineering ---------------- */
  { kind: 'match', id: 'gh-x4-match-prompts', domain: 4, objective: '4.1.3', itemsLabel: 'Techniques', question: 'Match each prompt to the technique it uses. Each technique may be used once, more than once, or not at all.', items: ['Zero-shot', 'Few-shot', 'Breaking the task into steps'], targets: [
    { text: '“Write a function that checks whether a string is a palindrome.”', answer: 0 },
    { text: '“Here are two log lines in our format: … Now write one for a failed payment.”', answer: 1 },
    { text: '“First define the Order type. Next, we’ll add validation.”', answer: 2 },
  ], explanation: '**Zero-shot** gives only the instruction. **Few-shot** shows examples first. Splitting work into **small steps** makes each answer easier to check.' },
  { kind: 'dropdown', id: 'gh-x4-dd-history', domain: 4, objective: '4.2.2', question: 'Complete the sentence.', parts: [
    'Copilot Chat keeps answering with an old API you discussed earlier in the conversation. You should ',
    { options: ['repeat the request in capital letters', 'start a new chat or use /clear', 'switch the model', 'turn off inline suggestions'], answer: 1 },
    ', because earlier messages are sent as ',
    { options: ['training data', 'context', 'telemetry only'], answer: 1 },
    '.',
  ], explanation: 'Chat history is part of the **context**. When the topic changes, start a **new chat** (or `/clear`) so old turns stop steering the answer.' },

  /* ---------------- Domain 5: Productivity ---------------- */
  { kind: 'yesno', id: 'gh-x5-yn-tests', domain: 5, objective: '5.2.2', statements: [
    { text: 'You can ask Copilot to generate tests that cover edge cases such as empty input and invalid values.', answer: true },
    { text: 'If a test generated by Copilot fails, the test must be wrong.', answer: false },
    { text: 'The /tests slash command generates tests for the selected code.', answer: true },
  ], explanation: 'Name the **edge cases** you want. A failing generated test can reveal a **real bug** or a wrong expectation, so investigate. `/tests` works on the selection.' },
  { kind: 'match', id: 'gh-x5-match-tasks', domain: 5, objective: '5.1.1', itemsLabel: 'Commands', question: 'Match each goal to the Copilot Chat slash command. Each command may be used once, more than once, or not at all.', items: ['/explain', '/fix', '/tests', '/doc'], targets: [
    { text: 'Understand what an unfamiliar legacy function does', answer: 0 },
    { text: 'Add documentation comments to a function', answer: 3 },
    { text: 'Propose a fix for a problem in the selected code', answer: 1 },
  ], explanation: '`/explain` explains, `/doc` documents, `/fix` proposes a fix, `/tests` writes tests.' },

  /* ---------------- Domain 6: Privacy and safeguards ---------------- */
  { kind: 'yesno', id: 'gh-x6-yn-exclusions', domain: 6, objective: '6.1.1', statements: [
    { text: 'Content exclusions can be configured at the repository and organization level.', answer: true },
    { text: 'A change to content exclusions always takes effect in open IDEs immediately.', answer: false },
    { text: 'Copilot does not offer inline suggestions inside an excluded file in a supported IDE.', answer: true },
  ], explanation: 'Exclusions are set by **repository**, **organization** or **enterprise** admins. Changes can take **up to 30 minutes** to reach IDEs (reloading helps). Excluded files get no inline suggestions and aren’t used as context.' },
  { kind: 'dropdown', id: 'gh-x6-dd-public', domain: 6, objective: '6.2.1', question: 'Complete the sentence.', parts: [
    'Your organization wants Copilot to show suggestions that match public code, together with the source repository and licence. Set “Suggestions matching public code” to ',
    { options: ['Blocked', 'Allowed', 'Disabled for chat only'], answer: 1 },
    ' so that Copilot shows a ',
    { options: ['code reference', 'security alert', 'content exclusion'], answer: 0 },
    '.',
  ], explanation: 'With **Allowed**, matching suggestions are shown with a **code reference** (repositories and licences). **Blocked** hides them.' },
  { kind: 'order', id: 'gh-x6-order-troubleshoot', domain: 6, objective: '6.2.2', question: 'A developer gets no Copilot suggestions in any file. Which four checks should you perform, in a sensible order?', actions: ['Check the Copilot status icon and that the user is signed in', 'Confirm the user has a Copilot seat', 'Check the language is enabled in github.copilot.enable', 'Open the GitHub Copilot logs for network or proxy errors', 'Reinstall the operating system'], answer: [0, 1, 2, 3], explanation: 'Start simple: **signed in**, **seat assigned**, **language enabled**, then the **logs** for network or proxy errors.' },
];
