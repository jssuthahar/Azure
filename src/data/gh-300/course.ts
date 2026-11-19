/**
 * GH-300 course details copy: the "understand before you start" page at /gh-300/.
 * Exam facts come from syllabus.ts; this file holds the course's own promise.
 */
import type { CourseInfo } from '../types';

export const COURSE: CourseInfo = {
  title: 'GH-300: GitHub Copilot',
  subtitle: 'Use GitHub Copilot well and safely: inline suggestions, chat, agent mode, the Copilot CLI, MCP, custom instructions, code review, prompts, data flow, policies and content exclusions. No GitHub account needed.',
  intro: [
    'GH-300 is the GitHub Copilot certification exam. Microsoft delivers it and GitHub maintains it, and it checks that you can use Copilot to write better code faster without giving up quality, security or privacy. It covers the editor, github.com and the terminal, plus what an organization admin controls.',
    'This course follows the official skills outline topic by topic. Every lesson starts with a 30-second answer, then lets you try the idea in a VS Code and GitHub walkthrough, a 3D scene and a practice lab in a simulated terminal with Copilot CLI, git and gh. A quiz closes each lesson. Copilot’s answers in the simulations are scripted examples, so nothing leaves your browser.',
  ],
  audience: [
    { icon: '💻', title: 'Developers using Copilot', text: 'You already press Tab on suggestions and want to use chat, agent mode and the CLI properly, and pass the exam.' },
    { icon: '🧑‍🏫', title: 'Tech leads and reviewers', text: 'You need to know what Copilot does with code, how to review its output and how to set team standards with instructions files.' },
    { icon: '🛡️', title: 'Org admins and platform teams', text: 'You roll out Copilot and need plans, seats, policies, content exclusions, the audit log and the REST API.' },
    { icon: '🎓', title: 'Students and career changers', text: 'You want a recognised AI developer-tool certification. Basic GitHub and one programming language are enough to start.' },
  ],
  outcomes: [
    'Explain the risks and limits of generative AI and how to use Copilot responsibly',
    'Validate Copilot output with review, tests and scanning before it ships',
    'Set up Copilot in VS Code and other IDEs and use inline suggestions, chat, Edit and Agent mode',
    'Use Copilot Chat slash commands, participants, context variables and the model picker',
    'Install and use GitHub Copilot CLI: sessions, -p, tool permissions, scripts and files',
    'Add MCP servers, use sub-agents and delegate work to Copilot coding agent',
    'Write repository and path-specific custom instructions and reusable prompt files',
    'Use Copilot code review, pull request summaries, Copilot Spaces and Spark',
    'Configure organization policies, read the audit log and manage seats with the REST API',
    'Describe how Copilot builds prompts, filters requests and responses, and handles your data',
    'Write effective prompts with the right context, zero-shot and few-shot examples',
    'Generate, refactor, document and test code, and spot security and performance problems',
    'Configure content exclusions and the public code filter, and troubleshoot missing suggestions',
  ],
  requirements: [
    'Basic GitHub: repositories, branches, commits and pull requests',
    'Some experience with at least one programming language (the examples use JavaScript)',
    'No GitHub account or Copilot subscription: every walkthrough and lab is a simulation in your browser',
    'Optional: Visual Studio Code, to try things for real afterwards',
  ],
  roadmap: [
    { title: 'Week 1: Responsible use and setup', text: 'Generative AI risks, responsible AI, validating output, plans, setting up the IDE, inline suggestions, chat and modes.' },
    { title: 'Week 2: Chat, CLI and agents', text: 'Chat commands and limits, Copilot CLI install, sessions, scripts and permissions, agent mode, MCP and sub-agents.' },
    { title: 'Week 3: Team features and admin', text: 'Custom instructions and prompt files, code review, PR summaries, Spaces and Spark, policies, audit log and seats API.' },
    { title: 'Week 4: How it works, prompts, productivity and safeguards', text: 'Data flow, prompt building, filters, the suggestion lifecycle, prompt engineering, tests, security, content exclusions and the public code filter.' },
    { title: 'Exam week: Mock exams and revision', text: 'Take full mock exams until you score 80% or more twice, read the cheat sheet and the exam day guide, then book.' },
  ],
  faq: [
    { q: 'Who runs the GH-300 exam?', a: 'Microsoft delivers it through Microsoft Learn and Pearson VUE, and GitHub maintains the exam and the certification. A score of 700 or more passes, and GitHub certifications are valid for two years.' },
    { q: 'Is this GH-300 course free?', a: 'Yes. Every lesson, simulation, lab, quiz, mock exam and the practice certificate is free. Signing in is optional and only syncs your progress.' },
    { q: 'Do I need a GitHub Copilot subscription?', a: 'Not for this course. The VS Code and GitHub walkthroughs, the 3D scenes and the Copilot CLI terminal are simulations. To try Copilot for real afterwards, Copilot Free is enough for most of the IDE features.' },
    { q: 'Which IDE does the course use?', a: 'Visual Studio Code, because most exam examples use it. The ideas carry over to Visual Studio, JetBrains IDEs, Xcode and the others, and the lessons point out where they differ.' },
    { q: 'Are these real GH-300 exam questions?', a: 'No. Every question here is original and written to practise the skills in the official outline. We never publish real, recalled or leaked exam questions.' },
    { q: 'Is the practice certificate a GitHub certification?', a: 'No. It is an MSDEVBUILD practice certificate that shows you passed our mock exam. To become certified you sit GH-300 through Microsoft Learn.' },
  ],
  hubs: {
    compare: 'GH-300 comparisons: Ask vs Edit vs Agent mode, inline suggestions vs chat vs CLI, Copilot plans, and instructions vs prompt files vs custom agents.',
    games: 'Learn GH-300 the fun way: sort Copilot modes, plans and safeguards, Who Am I riddles about Copilot features and a daily challenge, with XP.',
    servicesTitle: 'GitHub Copilot Features Reference: Each One in 60 Seconds',
    services: 'Every GitHub Copilot feature in 60 seconds: inline suggestions, Chat, agent mode, coding agent, CLI, code review, MCP, Spaces, Spark, content exclusions and more.',
    sandboxTitle: 'GH-300 Sandbox: Free GitHub Copilot CLI Simulator | MSDEVBUILD',
    whoAmI: 'Who Am I? Guess the GitHub Copilot Feature Game | MSDEVBUILD',
  },
  labs: {
    title: 'GH-300 Practice Labs: Free Copilot CLI Simulator | MSDEVBUILD',
    description: 'Free GH-300 hands-on labs: install Copilot CLI, control tool permissions, write instructions and agents, test and fix code, add MCP and manage seats. No account.',
    h1: 'GH-300 Practice Labs',
    intro: 'A safe, simulated developer terminal in your browser with GitHub Copilot CLI, git and the GitHub CLI. Install and sign in, run prompts with exact tool permissions, write instructions and a custom agent, test and fix code, add an MCP server and manage Copilot seats.',
    shell: [
      ['npm install -g @github/copilot && copilot', 'Do you trust the files in this folder? (y/n) y'],
      ["copilot -p \"write unit tests for src/discount.js\" --allow-tool 'write'", '✔ Created tests/discount.test.js (4 tests)'],
    ],
  },
};
