/**
 * GH-300 syllabus: the single source of truth for navigation, the syllabus
 * page, the mock exam's domain weights and objective coverage.
 *
 * Source: "Study guide for Exam GH-300: GitHub Copilot", skills measured as of
 * August 7, 2026 (checked on Microsoft Learn 19 Nov 2026).
 * https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-300
 *
 * The exam is delivered by Microsoft and maintained by GitHub. Candidates use
 * Copilot in the IDE, on github.com and in the terminal, and should know
 * GitHub basics and at least one programming language.
 *
 * Weights: the study guide's "skills at a glance" repeats "GitHub Copilot
 * features (25–30%)" on a second line, a copy error; the detailed outline has
 * six domains, which is what we use. The six midpoints add up to 95, and the
 * mock exam scales them, so a paper still follows the official mix.
 *
 * Wording: "Utilize" in 2.3.3 and 2.4.2 is shown as "Use" (house style, check:human);
 * the meaning is unchanged.
 *
 * Objective ids are ours (domain.group.bullet), numbered in the order the
 * study guide lists the bullets. Whether a topic is published is derived from
 * the existence of src/content/tutorials/gh-300/<module>/<slug>.mdx.
 */

import type { ObjectiveGroup, SyllabusTopic, SyllabusModule, ExamFacts } from '../types';
export type { ObjectiveGroup, SyllabusTopic, SyllabusModule, ExamFacts };

export const SKILLS_MEASURED_AS_OF = 'August 7, 2026';
export const SYLLABUS_VERIFIED_ON = '2026-11-19';
export const STUDY_GUIDE_URL =
  'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-300';
export const EXAM_FACTS: ExamFacts = {
  passingScore: 700,
  scoreScale: '1–1000',
  durationMinutes: 100,
  practiceAssessmentUrl:
    'https://learn.microsoft.com/en-us/credentials/certifications/github-copilot/practice/assessment?assessment-type=practice&assessmentId=218035372&practice-assessment-type=certification',
};

export const MODULES: SyllabusModule[] = [
  {
    slug: 'responsible-ai',
    domain: 1,
    title: 'Use GitHub Copilot responsibly',
    shortTitle: 'Responsible AI',
    weight: '15–20%',
    weightMid: 17.5,
    summary:
      'Know what generative AI gets wrong, which harms it can cause and how to reduce them, and why every Copilot suggestion is a draft you review, test and own before it ships.',
    groups: [
      {
        title: 'Understand responsible AI principles',
        objectives: [
          { id: '1.1.1', text: 'Describe risks and limitations of Generative AI tools' },
          { id: '1.1.2', text: 'Describe ethical and responsible AI usage' },
          { id: '1.1.3', text: 'Identify potential harms and mitigation strategies of AI usage' },
        ],
      },
      {
        title: 'Validate and operate AI tools',
        objectives: [
          { id: '1.2.1', text: 'Explain the need to validate AI output' },
          { id: '1.2.2', text: 'Identify how to operate GitHub Copilot responsibly' },
        ],
      },
    ],
    topics: [
      { slug: 'generative-ai-risks-and-limitations', title: 'Generative AI Risks and Limitations', objectives: ['1.1.1'] },
      { slug: 'responsible-ai-principles', title: 'Responsible AI: Principles, Harms and Mitigations', objectives: ['1.1.2', '1.1.3'] },
      { slug: 'validate-copilot-output', title: 'Validate Copilot Output and Use It Responsibly', objectives: ['1.2.1', '1.2.2'] },
    ],
  },
  {
    slug: 'copilot-features',
    domain: 2,
    title: 'Use GitHub Copilot features',
    shortTitle: 'Copilot Features',
    weight: '25–30%',
    weightMid: 27.5,
    summary:
      'Turn Copilot on in your editor and use inline suggestions, chat, agent mode and the Copilot CLI. Add MCP tools, custom instructions and prompt files, let Copilot review pull requests, and manage plans, policies, audit logs and seats for an organization.',
    groups: [
      {
        title: 'Use GitHub Copilot in the IDE',
        objectives: [
          { id: '2.1.1', text: 'Enable Copilot in the IDE' },
          { id: '2.1.2', text: 'Trigger Copilot through inline suggestions, chat, CLI, and agent mode' },
          { id: '2.1.3', text: 'Configure content exclusions for specific files or repositories (app knowledge)' },
        ],
      },
      {
        title: 'Use GitHub Copilot CLI',
        objectives: [
          { id: '2.2.1', text: 'Define GitHub Copilot CLI and how it benefits developers' },
          { id: '2.2.2', text: 'Identify the steps for installing GitHub Copilot CLI' },
          { id: '2.2.3', text: 'Describe key GitHub Copilot CLI features and commands' },
          { id: '2.2.4', text: 'Use GitHub Copilot CLI interactively and in sessions' },
          { id: '2.2.5', text: 'Generate scripts and manage files with GitHub Copilot CLI' },
        ],
      },
      {
        title: 'Use GitHub Copilot features and capabilities',
        objectives: [
          { id: '2.3.1', text: 'Use Agent Mode, Copilot Edits, and MCP for enhanced development and workflows; manage Agent Sessions and delegate tasks to Sub-Agents for optimized context usage' },
          { id: '2.3.2', text: 'Use Copilot for code review and coding assistance' },
          { id: '2.3.3', text: 'Use Spaces, Spark, Pull Request summaries, and customizable review standards via instructions files' },
          { id: '2.3.4', text: 'Understand the limits, options, feedback, and commands of GitHub Copilot Chat; include prompt file reuse for consistent responses' },
        ],
      },
      {
        title: 'Manage organization-wide settings and policies',
        objectives: [
          { id: '2.4.1', text: 'Configure organization-wide policy management; enable Copilot Code Review policies and manage feature availability across IDEs and github.com' },
          { id: '2.4.2', text: 'Use audit log events' },
          { id: '2.4.3', text: 'Manage subscriptions using the REST API' },
        ],
      },
    ],
    topics: [
      { slug: 'copilot-plans', title: 'GitHub Copilot Plans: Free, Pro, Business and Enterprise', objectives: ['2.1.1', '2.4.1'] },
      { slug: 'enable-copilot-in-the-ide', title: 'Set Up GitHub Copilot in Your IDE', objectives: ['2.1.1'] },
      { slug: 'inline-suggestions-chat-and-modes', title: 'Inline Suggestions, Chat, Edit and Agent Mode', objectives: ['2.1.2'] },
      { slug: 'copilot-chat-commands-and-limits', title: 'Copilot Chat: Slash Commands, Participants and Limits', objectives: ['2.3.4'] },
      { slug: 'copilot-cli-install-and-commands', title: 'GitHub Copilot CLI: Install and Key Commands', objectives: ['2.2.1', '2.2.2', '2.2.3'] },
      { slug: 'copilot-cli-sessions-and-scripts', title: 'Copilot CLI Sessions, Scripts and Files', objectives: ['2.2.4', '2.2.5'] },
      { slug: 'agent-mode-mcp-and-subagents', title: 'Agent Mode, MCP Servers and Sub-Agents', objectives: ['2.3.1'] },
      { slug: 'custom-instructions-and-prompt-files', title: 'Custom Instructions and Prompt Files', objectives: ['2.3.3', '2.3.4'] },
      { slug: 'copilot-code-review', title: 'Copilot Code Review on Pull Requests', objectives: ['2.3.2', '2.3.3'] },
      { slug: 'spaces-spark-and-pr-summaries', title: 'Copilot Spaces, Spark and Pull Request Summaries', objectives: ['2.3.3'] },
      { slug: 'organization-policies', title: 'Copilot Policies for Organizations and Enterprises', objectives: ['2.4.1'] },
      { slug: 'audit-log-and-seats-api', title: 'Audit Log Events and Managing Seats with the REST API', objectives: ['2.4.2', '2.4.3'] },
    ],
  },
  {
    slug: 'data-and-architecture',
    domain: 3,
    title: 'Understand GitHub Copilot data and architecture',
    shortTitle: 'Data & Architecture',
    weight: '10–15%',
    weightMid: 12.5,
    summary:
      'Follow a suggestion from your keystroke to your screen: what context Copilot collects, how the prompt is built, what the proxy filters before and after the model, what data is kept, and where large language models still fall short.',
    groups: [
      {
        title: 'Describe data handling and flow',
        objectives: [
          { id: '3.1.1', text: 'Explain data usage, flow, and sharing' },
          { id: '3.1.2', text: 'Describe input processing and prompt building' },
          { id: '3.1.3', text: 'Explain proxy filtering and post-processing' },
        ],
      },
      {
        title: 'Understand lifecycle and limitations',
        objectives: [
          { id: '3.2.1', text: 'Visualize code suggestion lifecycle' },
          { id: '3.2.2', text: 'Describe limitations of LLMs and Copilot' },
        ],
      },
    ],
    topics: [
      { slug: 'copilot-data-flow', title: 'How Copilot Handles Your Data', objectives: ['3.1.1'] },
      { slug: 'prompt-building-and-context', title: 'How Copilot Builds a Prompt from Context', objectives: ['3.1.2'] },
      { slug: 'proxy-filtering-and-post-processing', title: 'Proxy Filtering and Post-Processing', objectives: ['3.1.3'] },
      { slug: 'suggestion-lifecycle-and-limits', title: 'The Code Suggestion Lifecycle and LLM Limits', objectives: ['3.2.1', '3.2.2'] },
    ],
  },
  {
    slug: 'prompt-engineering',
    domain: 4,
    title: 'Apply prompt engineering and context crafting',
    shortTitle: 'Prompt Engineering',
    weight: '10–15%',
    weightMid: 12.5,
    summary:
      'Write prompts Copilot can act on: a clear goal, the right context and examples, small steps, and a chat history that helps instead of confusing. Know zero-shot from few-shot and when each one wins.',
    groups: [
      {
        title: 'Craft effective prompts',
        objectives: [
          { id: '4.1.1', text: 'Describe prompt structure and context' },
          { id: '4.1.2', text: 'Understand how context is determined' },
          { id: '4.1.3', text: 'Use zero-shot and few-shot prompting' },
          { id: '4.1.4', text: 'Apply best practices for prompt crafting' },
        ],
      },
      {
        title: 'Engineer prompts for performance',
        objectives: [
          { id: '4.2.1', text: 'Explain prompt engineering principles' },
          { id: '4.2.2', text: 'Describe prompt process flow and chat history usage' },
        ],
      },
    ],
    topics: [
      { slug: 'prompt-structure-and-context', title: 'Prompt Structure and Context for Copilot', objectives: ['4.1.1', '4.1.2'] },
      { slug: 'zero-shot-and-few-shot-prompting', title: 'Zero-Shot and Few-Shot Prompting', objectives: ['4.1.3', '4.1.4'] },
      { slug: 'prompt-engineering-and-chat-history', title: 'Prompt Engineering Principles and Chat History', objectives: ['4.2.1', '4.2.2'] },
    ],
  },
  {
    slug: 'developer-productivity',
    domain: 5,
    title: 'Improve developer productivity with GitHub Copilot',
    shortTitle: 'Productivity',
    weight: '10–15%',
    weightMid: 12.5,
    summary:
      'Use Copilot for the everyday work: write, refactor and document code, learn an unfamiliar codebase, generate sample data, modernize legacy code, write unit and integration tests with real edge cases, and spot security and performance problems.',
    groups: [
      {
        title: 'Enhance productivity and code quality',
        objectives: [
          { id: '5.1.1', text: 'Use Copilot for code generation, refactoring, and documentation' },
          { id: '5.1.2', text: 'Accelerate learning and reduce context switching' },
          { id: '5.1.3', text: 'Generate sample data and modernize legacy code' },
        ],
      },
      {
        title: 'Support testing and security',
        objectives: [
          { id: '5.2.1', text: 'Generate unit and integration tests' },
          { id: '5.2.2', text: 'Identify edge cases and write assertions' },
          { id: '5.2.3', text: 'Suggest security improvements and performance optimizations' },
        ],
      },
    ],
    topics: [
      { slug: 'generate-refactor-and-document', title: 'Generate, Refactor and Document Code', objectives: ['5.1.1', '5.1.2'] },
      { slug: 'sample-data-and-legacy-code', title: 'Sample Data and Modernizing Legacy Code', objectives: ['5.1.3'] },
      { slug: 'unit-and-integration-tests', title: 'Unit Tests, Integration Tests and Edge Cases', objectives: ['5.2.1', '5.2.2'] },
      { slug: 'security-and-performance-fixes', title: 'Security Improvements and Performance Fixes', objectives: ['5.2.3'] },
    ],
  },
  {
    slug: 'privacy-and-safeguards',
    domain: 6,
    title: 'Configure privacy, content exclusions, and safeguards',
    shortTitle: 'Privacy & Safeguards',
    weight: '10–15%',
    weightMid: 12.5,
    summary:
      'Keep sensitive files away from Copilot with content exclusions, set editor settings, know who owns the output, block or reference suggestions that match public code, and fix the usual reasons Copilot stops suggesting.',
    groups: [
      {
        title: 'Manage privacy settings and exclusions',
        objectives: [
          { id: '6.1.1', text: 'Configure content exclusions and editor settings' },
          { id: '6.1.2', text: 'Describe ownership and limitations of outputs' },
        ],
      },
      {
        title: 'Apply safeguards and troubleshoot',
        objectives: [
          { id: '6.2.1', text: 'Enable suggestions matching public code filtering' },
          { id: '6.2.2', text: 'Resolve issues with suggestions and content exclusions' },
        ],
      },
    ],
    topics: [
      { slug: 'content-exclusions', title: 'Content Exclusions and Editor Settings', objectives: ['6.1.1', '2.1.3'] },
      { slug: 'output-ownership-and-limits', title: 'Who Owns Copilot Output, and Its Limits', objectives: ['6.1.2'] },
      { slug: 'public-code-filter-and-references', title: 'Public Code Matching: Block or Show References', objectives: ['6.2.1'] },
      { slug: 'troubleshoot-copilot', title: 'Troubleshoot Suggestions and Content Exclusions', objectives: ['6.2.2'] },
    ],
  },
];

export const moduleBySlug = (slug: string) => MODULES.find((m) => m.slug === slug);
export const allObjectives = () => MODULES.flatMap((m) => m.groups.flatMap((g) => g.objectives));
export const objectiveText = (id: string) => allObjectives().find((o) => o.id === id)?.text ?? id;
