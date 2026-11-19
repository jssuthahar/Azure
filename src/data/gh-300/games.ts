/**
 * GH-300 content for the Play & Learn games. Every item matches what the lessons teach.
 */
import type { SortSet, Riddle } from '../az-900/games';

export const SORT_SETS: SortSet[] = [
  {
    id: 'copilot-modes', title: 'Which way of using Copilot?', icon: '🤖', intro: 'Pick the Copilot experience for each job.', topic: 'inline-suggestions-chat-and-modes',
    buckets: ['Inline suggestion', 'Chat: Ask mode', 'Agent mode', 'Coding agent'],
    items: [
      { text: 'Finish the line you are typing', bucket: 0, why: 'Ghost text appears as you type.' },
      { text: 'Explain what a regex does', bucket: 1, why: 'Ask answers without changing files.' },
      { text: 'Add a feature, run the tests and fix failures', bucket: 2, why: 'Agent mode edits, runs commands and iterates.' },
      { text: 'Work on an issue in the background and open a PR', bucket: 3, why: 'The coding agent opens a pull request.' },
      { text: 'Accept the next word with Ctrl+→', bucket: 0, why: 'Partial accept of an inline suggestion.' },
      { text: 'Compare two approaches before you write code', bucket: 1, why: 'A conversation, no edits needed.' },
    ],
  },
  {
    id: 'copilot-controls', title: 'Who controls it?', icon: '🛡️', intro: 'Is this set by the developer, the organization, or a repository admin?', topic: 'organization-policies',
    buckets: ['Developer (personal settings)', 'Organization policy', 'Repository settings'],
    items: [
      { text: 'Turn off completions for Markdown files in my editor', bucket: 0, why: 'github.copilot.enable is a personal editor setting.' },
      { text: 'Disable Copilot coding agent for all members', bucket: 1, why: 'Feature policies live in organization settings.' },
      { text: 'Exclude /secrets/** in one repository', bucket: 2, why: 'Repository settings › Copilot › Content exclusion.' },
      { text: 'Block suggestions matching public code for every seat', bucket: 1, why: 'The public code policy for Business seats is set by the org.' },
      { text: 'Choose which model to use in this chat', bucket: 0, why: 'The model picker (from the models the org allows).' },
      { text: 'Decide which models members may use', bucket: 1, why: 'The org’s Models policy.' },
    ],
  },
  {
    id: 'copilot-files', title: 'Which file does it?', icon: '📁', intro: 'Pick the file that makes each thing happen.', topic: 'custom-instructions-and-prompt-files',
    buckets: ['copilot-instructions.md', '*.instructions.md', '*.prompt.md', 'mcp.json'],
    items: [
      { text: 'Team coding standards for every request in the repo', bucket: 0, why: 'Repository custom instructions.' },
      { text: 'Rules that apply only to tests/**', bucket: 1, why: 'Path-specific instructions with applyTo.' },
      { text: 'A reusable “new endpoint” request run with /new-endpoint', bucket: 2, why: 'Prompt files are run on demand.' },
      { text: 'Give agent mode the GitHub MCP server', bucket: 3, why: 'MCP servers are configured in mcp.json.' },
      { text: 'Review standards for Copilot code review', bucket: 0, why: 'Code review reads the repository instructions.' },
      { text: 'Docs-only rules for docs/**/*.md', bucket: 1, why: 'Another applyTo glob.' },
    ],
  },
];

export const RIDDLES: Riddle[] = [
  { answer: 'Agent mode', topic: 'agent-mode-mcp-and-subagents', clues: ['I live in the Chat view next to Ask and Edit.', 'I find the files myself and run your tests.', 'I ask before I run a terminal command.'] },
  { answer: 'Copilot coding agent', topic: 'spaces-spark-and-pr-summaries', clues: ['You can assign me an issue.', 'I work in a GitHub Actions environment.', 'I finish by opening a draft pull request.'] },
  { answer: 'Content exclusion', topic: 'content-exclusions', clues: ['Admins set me in repository or organization settings.', 'I keep certain paths out of Copilot’s context.', 'I can take up to 30 minutes to reach open editors.'] },
  { answer: 'Public code filter', topic: 'public-code-filter-and-references', clues: ['I care about matches of about 150 characters.', 'Block or Allow are my two settings.', 'With Allow, I come with a code reference and a licence.'] },
  { answer: 'Copilot CLI', topic: 'copilot-cli-install-and-commands', clues: ['You install me with npm install -g @github/copilot.', 'I ask whether you trust this folder.', 'copilot -p runs me for one prompt.'] },
  { answer: 'MCP server', topic: 'agent-mode-mcp-and-subagents', clues: ['I speak the Model Context Protocol.', 'I give an agent new tools, like reading issues.', 'In VS Code you list me in mcp.json.'] },
  { answer: 'Few-shot prompt', topic: 'zero-shot-and-few-shot-prompting', clues: ['I bring examples with me.', 'I help when your format is unusual.', 'My sibling has zero examples.'] },
  { answer: 'Audit log', topic: 'audit-log-and-seats-api', clues: ['I remember who changed a Copilot policy.', 'Seat changes are written to me too.', 'Search me with action:copilot.'] },
  { answer: 'Prompt file', topic: 'custom-instructions-and-prompt-files', clues: ['I live in .github/prompts.', 'My name ends in .prompt.md.', 'You run me with a slash command.'] },
  { answer: 'Copilot code review', topic: 'copilot-code-review', clues: ['You add me as a reviewer on a pull request.', 'I leave comments with suggested changes.', 'I never count as an approval.'] },
];
