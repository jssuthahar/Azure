/**
 * Role-based certification roadmaps, rendered by src/components/roadmap/RoadmapPage.astro.
 * One page per roadmap: /ai-certifications/, /security-certifications/, /github-certifications/.
 *
 * Exam names, levels, links and live status come from certifications.ts; this file only adds
 * the role framing. Every exam slug used here must exist there. Prerequisites and outlines were
 * checked on Microsoft Learn study guides on `checked`; re-check before changing a claim.
 *
 * Adding a roadmap: add an object to ROADMAPS, create src/pages/<path>.astro (3 lines, see the
 * existing ones) and list it in og-pages.ts, sitemap.astro and llms.txt.ts.
 */
export interface RoleTrack {
  /** Exam slug in certifications.ts. */
  slug: string;
  role: string;
  /** Short label for the diagram node. */
  short: string;
  /** One line: the work this certification proves you can do. */
  work: string;
  /** "Pick it if ..." */
  pickIf: string;
  tools: string[];
  /** Suggested optional entry exam (must be in the roadmap's `entry`). */
  entry: string;
  /** Path finder option: "I'd rather ..." */
  rather: string;
  /** Growth steps. `required` = counts toward that step's certification. */
  next: { slug: string; required: boolean }[];
  /** One honest line of encouragement for the path finder result. */
  cheer: string;
}

export interface StepThree {
  slug: string;
  /** Short diagram label. */
  short: string;
  /** Small caps tag on the diagram node, e.g. EXPERT. */
  tag: string;
  /** Second line under the code on the phone diagram. */
  phoneNote: string;
  forWho: string;
  needs: string;
  /** Optional "also needs" box on the wide diagram, joined to this node by a required line. */
  alsoNeeds?: [string, string];
}

export interface Roadmap {
  /** URL path, e.g. '/ai-certifications/'. */
  path: string;
  /** Short name used in menus and cross links. */
  name: string;
  icon: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  /** "Every ... needs someone who" + rotating phrases. */
  rotateLead: string;
  rotate: string[];
  sub: string;
  answer: string;
  entry: string[];
  entryTitle: string;
  entryNote: string;
  tracksTitle: string;
  tracksNote: string;
  tracks: RoleTrack[];
  platform?: { slug: string; label: string; note: string };
  stepThreeEyebrow: string;
  stepThreeTitle: string;
  stepThreeNote: string;
  stepThree: StepThree[];
  legend: { req?: string; sug: string };
  stats: { n: number; suffix?: string; label: string }[];
  faq: { q: string; a: string }[];
  /** Hero glow colour. */
  glow: string;
  checked: string;
}

const CHECKED = '2026-11-20';

const AI: Roadmap = {
  path: '/ai-certifications/',
  name: 'AI',
  icon: '🤖',
  metaTitle: 'Azure AI Certification Roadmap 2026, by Role | MSDEVBUILD',
  metaDescription: 'Which Azure AI certification fits your role? AI-103, AI-200, AI-300, AB-620 and SC-500 mapped to real work, plus the AB-100 and AI-500 expert paths.',
  h1: 'Which Azure AI certification fits your role?',
  rotateLead: 'Every AI project needs someone who',
  rotate: ['builds the agent', 'ships it to production', 'keeps it secure', 'designs the whole system'],
  sub: 'Choose by the work you want to own, not by whichever exam comes next on a list.',
  answer: 'Pick the role first. AI-103 if you build AI apps and agents in code, AI-200 for cloud backends, AI-300 for production MLOps, AB-620 for Copilot Studio agents and SC-500 for cloud and AI security. AI-901 and AZ-900 are optional starting points. AB-100 and AI-500 are Expert certifications that need more than one exam.',
  entry: ['ai-901', 'az-900'],
  entryTitle: 'Build the vocabulary first (not required)',
  entryNote: 'Neither is a prerequisite. Take one if words like RAG, region or resource group still feel new.',
  tracksTitle: 'What do you want to do with AI on Azure?',
  tracksNote: 'Each of these is an Associate certification with one exam and no prerequisites.',
  tracks: [
    { slug: 'ai-103', role: 'AI apps and agents', short: 'Apps & agents', work: 'Build generative AI apps and agents with Microsoft Foundry.', pickIf: 'you write code that calls models, grounds them with RAG and wires agents to tools.', tools: ['Microsoft Foundry', 'Agent Service', 'RAG', 'Vision and language'], entry: 'ai-901', rather: 'write code that talks to models and tools', next: [{ slug: 'ai-500', required: true }], cheer: 'Teams everywhere want someone who can take an AI idea from a notebook to a working agent. Start with one small app that answers questions from your own documents.' },
    { slug: 'ai-200', role: 'Cloud development and integration', short: 'Cloud backends', work: 'Build the cloud backend an AI app runs on.', pickIf: 'you build APIs, containers, data stores and messaging that AI features plug into.', tools: ['Container Apps', 'Functions', 'Cosmos DB', 'Vector search'], entry: 'az-900', rather: 'build the APIs and data stores an app runs on', next: [{ slug: 'az-104', required: false }], cheer: 'Every AI feature still needs a backend that stays up. Our AI-200 course is live and free, so you can start today.' },
    { slug: 'ai-300', role: 'Production AI and MLOps', short: 'MLOps', work: 'Deploy, monitor and improve ML models and GenAI apps in production.', pickIf: 'you own pipelines, evaluations, drift alerts and fine-tuning after the demo works.', tools: ['Azure Machine Learning', 'Foundry', 'GitHub Actions', 'Bicep'], entry: 'ai-901', rather: 'keep models healthy once they are in production', next: [], cheer: 'Plenty of people can build a demo. Fewer can keep it accurate, fast and affordable a year later. That is the job AI-300 proves.' },
    { slug: 'ab-620', role: 'Enterprise agent building', short: 'Copilot Studio agents', work: 'Build and integrate enterprise agents in Copilot Studio.', pickIf: 'you build agents for a business on Power Platform, connectors and MCP servers.', tools: ['Copilot Studio', 'MCP', 'Connectors', 'Dataverse'], entry: 'ai-901', rather: 'build agents for business teams with low code', next: [{ slug: 'ab-100', required: false }], cheer: 'Business teams are queuing up for agents that file tickets, answer HR questions and update records. You can be the person who builds them.' },
    { slug: 'sc-500', role: 'Cloud and AI security', short: 'Cloud & AI security', work: 'Secure cloud and AI workloads end to end.', pickIf: 'you protect identities, data, networks and AI resources, and watch for attacks.', tools: ['Entra ID', 'Key Vault', 'Defender for Cloud', 'Sentinel'], entry: 'az-900', rather: 'stop attackers and lock AI workloads down', next: [], cheer: 'Every new agent is a new thing to protect. Security people who understand AI will be asked into every project. The Security roadmap has the full picture.' },
  ],
  platform: { slug: 'az-104', label: 'optional platform depth', note: 'Adds Azure platform depth (identity, networking, storage, monitoring). Useful if you’ll run AI workloads yourself. Not required by any AI exam.' },
  stepThreeEyebrow: 'Step 3 · for experienced professionals',
  stepThreeTitle: 'Moving into AI architecture',
  stepThreeNote: 'Expert certifications. Each one needs an exam plus another credential.',
  stepThree: [
    { slug: 'ai-500', short: 'Multi-agent AI Expert', tag: 'EXPERT', phoneNote: '+ AI-103 required', forWho: 'Engineers who design, build and run production multi-agent systems on Azure.', needs: 'Pass AI-500 and AI-103, in any order. The retired AI-102 doesn’t count.' },
    { slug: 'ab-100', short: 'Agentic business architect', tag: 'EXPERT', phoneNote: '+ qualifying associate', forWho: 'Architects designing agent-first business solutions across Copilot Studio, Foundry, Power Platform and Dynamics 365.', needs: 'Pass AB-100 and hold a qualifying associate certification (for example Power Platform Developer or a Dynamics 365 associate). Microsoft’s list of qualifying certifications changes, so check it before you book.', alsoNeeds: ['Qualifying associate', 'Power Platform / Dynamics 365'] },
  ],
  legend: { req: 'required for that Expert certification', sug: 'suggested next step' },
  stats: [
    { n: 5, label: 'role tracks to choose from' },
    { n: 2, label: 'Expert paths for architects' },
    { n: 0, label: 'prerequisites for the five associate exams' },
    { n: 100, suffix: '%', label: 'free courses on this site' },
  ],
  faq: [
    { q: 'Which Azure AI certification should I start with?', a: 'Start with the work you want to do. Building AI apps and agents in code points to AI-103. Cloud backends for AI apps point to AI-200. Running models in production points to AI-300. Copilot Studio agents point to AB-620. Securing cloud and AI workloads points to SC-500.' },
    { q: 'Do I need AI-901 or AZ-900 before an AI associate exam?', a: 'No. Microsoft lists no prerequisites for AI-103, AI-200, AI-300, AB-620 or SC-500. AI-901 and AZ-900 are optional, but they give you the vocabulary the associate exams assume.' },
    { q: 'What replaced AI-102 and AI-900?', a: 'AI-103 replaced AI-102 (Azure AI Engineer Associate), which retired on 30 June 2026. AI-901 replaced AI-900 on the same date, for the same Azure AI Fundamentals certification.' },
    { q: 'What do I need for the AI-500 Multi-Agent AI Solutions Expert certification?', a: 'You need to pass both AI-500 and AI-103. You can take them in either order. The retired AI-102 does not count towards it.' },
    { q: 'What do I need for the AB-100 Agentic AI Business Solutions Architect Expert certification?', a: 'You need to pass AB-100 and hold one qualifying associate certification, such as Power Platform Developer Associate or a Dynamics 365 associate. Check the current list on Microsoft Learn before you book.' },
    { q: 'Is AZ-104 required for the AI certifications?', a: 'No. AZ-104 is optional. It adds Azure platform depth (identity, networking, storage, monitoring) that helps if you will run AI workloads yourself.' },
  ],
  glow: '135 100 184',
  checked: CHECKED,
};

const SECURITY: Roadmap = {
  path: '/security-certifications/',
  name: 'Security',
  icon: '🛡️',
  metaTitle: 'Microsoft Security & AI Security Certification Roadmap 2026',
  metaDescription: 'Which Microsoft security certification fits your role? SC-200, SC-300, SC-401 and SC-500 mapped to real work, including AI security, plus the SC-100 expert path.',
  h1: 'Which Microsoft security certification fits your role?',
  rotateLead: 'Every company rolling out AI needs someone who',
  rotate: ['catches the attacker', 'controls who gets in', 'stops data leaking into AI', 'locks down the AI apps'],
  sub: 'AI adds new things to protect: agents, prompts, models and the data they can reach. Pick the part you want to own.',
  answer: 'Pick the part of security you want to own. SC-200 for security operations and threat hunting, SC-300 for identity and access, SC-401 for protecting data, including data AI tools like Copilot can reach, and SC-500 for securing Azure and AI workloads. SC-900 and AI-901 are optional starting points. SC-100 is the Expert step and needs SC-200 or SC-300 as well.',
  entry: ['sc-900', 'ai-901'],
  entryTitle: 'Start with the basics (not required)',
  entryNote: 'SC-900 covers Zero Trust, Entra, Defender and Purview. AI-901 explains how AI works, which helps when the thing you protect is an AI app. Neither is a prerequisite.',
  tracksTitle: 'Which part of security do you want to own?',
  tracksNote: 'Each of these is an Associate certification with one exam and no prerequisites.',
  tracks: [
    { slug: 'sc-200', role: 'Security operations', short: 'SecOps & hunting', work: 'Detect, investigate and respond to attacks with Defender XDR and Microsoft Sentinel.', pickIf: 'you like hunting through logs with KQL and calling the shots during an incident.', tools: ['Defender XDR', 'Microsoft Sentinel', 'KQL', 'Security Copilot'], entry: 'sc-900', rather: 'hunt attackers and respond to incidents', next: [{ slug: 'sc-100', required: true }], cheer: 'When something breaks at 2 a.m., the SOC analyst is the person everyone calls. Attackers are using AI to move faster, and teams need people who can keep up.' },
    { slug: 'sc-300', role: 'Identity and access', short: 'Identity & access', work: 'Run sign-in, access and identity governance with Microsoft Entra.', pickIf: 'you want to decide who and what can get in, including the workload identities apps and AI services run as.', tools: ['Entra ID', 'Conditional Access', 'PIM', 'Workload identities'], entry: 'sc-900', rather: 'decide who and what gets access', next: [{ slug: 'sc-100', required: true }], cheer: 'Identity is the front door for every user, app and agent. Get it right and most attacks stop before they start.' },
    { slug: 'sc-401', role: 'Data security for AI', short: 'Data & AI data', work: 'Protect sensitive data in Microsoft 365, including the data Copilot and other AI tools can reach.', pickIf: 'you want to stop oversharing and leaks with labels, DLP and DSPM for AI.', tools: ['Microsoft Purview', 'Sensitivity labels', 'DLP', 'DSPM for AI'], entry: 'ai-901', rather: 'stop sensitive data leaking into AI tools', next: [{ slug: 'sc-100', required: false }], cheer: 'Every company rolling out Copilot asks the same question first: what can it see? An SC-401 is the person with the answer.' },
    { slug: 'sc-500', role: 'Cloud and AI workloads', short: 'Cloud & AI workloads', work: 'Secure Azure and AI workloads end to end, from Key Vault to Defender for Cloud.', pickIf: 'you protect the platforms, data, networks and AI solutions teams build on Azure.', tools: ['Entra ID', 'Key Vault', 'Defender for Cloud', 'Security Copilot'], entry: 'ai-901', rather: 'lock down Azure and the AI apps on it', next: [{ slug: 'sc-100', required: false }], cheer: 'Every new AI app on Azure needs network rules, secrets and posture checks. SC-500 proves you can set them up properly.' },
  ],
  stepThreeEyebrow: 'Step 3 · for experienced professionals',
  stepThreeTitle: 'Moving into security architecture',
  stepThreeNote: 'The Expert certification needs the exam plus one associate certification.',
  stepThree: [
    { slug: 'sc-100', short: 'Cybersecurity Architect', tag: 'EXPERT', phoneNote: '+ SC-200 or SC-300', forWho: 'Security leads who turn strategy into Zero Trust designs across identity, data, AI, apps and infrastructure, including a plan for secure AI adoption.', needs: 'Pass SC-100 and hold one of Microsoft’s prerequisite associate certifications. SC-200 and SC-300 count. AZ-500 was the third option until it retired, so check whether SC-500 now counts before you plan around it.' },
  ],
  legend: { req: 'counts as the SC-100 prerequisite', sug: 'suggested next step (check the current list)' },
  stats: [
    { n: 4, label: 'role tracks to choose from' },
    { n: 3, label: 'tracks with AI security in the outline' },
    { n: 1, label: 'Expert path for security architects' },
    { n: 100, suffix: '%', label: 'free courses on this site' },
  ],
  faq: [
    { q: 'Which Microsoft security certification should I start with?', a: 'Start with the part of security you want to own. Incident response and threat hunting point to SC-200. Identity and access point to SC-300. Data protection and DLP point to SC-401. Securing Azure and AI workloads points to SC-500. SC-900 is an optional first step.' },
    { q: 'Which Microsoft certification covers AI security?', a: 'Three of them, from different angles. SC-500 secures AI solutions and workloads on Azure. SC-401 protects data used by AI services such as Microsoft 365 Copilot, including DSPM for AI. SC-200 includes investigating incidents with Security Copilot. At Expert level, SC-100 covers designing a strategy for secure AI adoption.' },
    { q: 'What replaced AZ-500?', a: 'SC-500 (Cloud and AI Security Engineer Associate) replaced AZ-500, which Microsoft retired on 31 August 2026. It adds securing AI workloads to the old AZ-500 topics.' },
    { q: 'What do I need for the SC-100 Cybersecurity Architect Expert certification?', a: 'You need to pass SC-100 and hold one prerequisite associate certification. SC-200 and SC-300 count. AZ-500 was the third option before it retired, so check the current list on Microsoft Learn.' },
    { q: 'Do I need SC-900 before SC-200, SC-300, SC-401 or SC-500?', a: 'No. SC-900 is optional. It is a good first step if Zero Trust, Conditional Access or DLP are new words to you.' },
  ],
  glow: '0 120 212',
  checked: CHECKED,
};

const GITHUB: Roadmap = {
  path: '/github-certifications/',
  name: 'GitHub',
  icon: '🐙',
  metaTitle: 'GitHub Copilot & GitHub Certification Roadmap 2026, by Role',
  metaDescription: 'Which GitHub certification fits your role? GH-300 Copilot, GH-200 Actions, GH-500 Advanced Security and GH-100 admin mapped to real work, then GH-600 agents.',
  h1: 'Which GitHub certification fits your role?',
  rotateLead: 'Every software team needs someone who',
  rotate: ['gets the most out of Copilot', 'automates the release', 'catches the leaked secret', 'runs GitHub for everyone'],
  sub: 'GitHub’s exams are delivered by Microsoft and maintained by GitHub. Start with the work you do every day.',
  answer: 'Pick the work you do most. GH-300 if you want to use GitHub Copilot well, GH-200 for GitHub Actions and CI/CD, GH-500 for code security, and GH-100 if you run GitHub Enterprise for a company. GH-900 is an optional first step. GH-600 is the next step once you want to run coding agents inside your software lifecycle.',
  entry: ['gh-900'],
  entryTitle: 'Start with the foundations (not required)',
  entryNote: 'GH-900 covers Git, pull requests, Actions, Copilot and Codespaces at a basic level. Skip it if you already use pull requests every day.',
  tracksTitle: 'What do you do with GitHub?',
  tracksNote: 'Each of these is one exam. GH-300 has a free, full course here today.',
  tracks: [
    { slug: 'gh-300', role: 'AI pair programming', short: 'Copilot', work: 'Use GitHub Copilot well and safely, from inline suggestions to agent mode and MCP.', pickIf: 'you write code every day and want Copilot to take on more of the boring parts.', tools: ['Copilot Chat', 'Agent mode', 'MCP', 'Copilot CLI'], entry: 'gh-900', rather: 'get more done in the editor with Copilot', next: [{ slug: 'gh-600', required: false }], cheer: 'Most teams already pay for Copilot. Few people use it well. Our GH-300 course is live and free, so you can start today.' },
    { slug: 'gh-200', role: 'Automation and CI/CD', short: 'Actions & CI/CD', work: 'Automate builds, tests and releases with GitHub Actions, then run them at scale.', pickIf: 'you like pipelines and runners, and want releases to be boring.', tools: ['Workflows', 'Reusable workflows', 'Runners', 'OIDC'], entry: 'gh-900', rather: 'automate builds, tests and releases', next: [{ slug: 'gh-600', required: false }], cheer: 'Coding agents still need pipelines that test and ship their work. Someone has to build those, and GH-200 shows you can.' },
    { slug: 'gh-500', role: 'Code security', short: 'Advanced Security', work: 'Find and fix vulnerabilities, leaked secrets and risky dependencies before they ship.', pickIf: 'you care about secure code and want security checks inside the pull request.', tools: ['CodeQL', 'Secret Protection', 'Dependabot', 'Security campaigns'], entry: 'gh-900', rather: 'catch vulnerabilities and leaked secrets early', next: [], cheer: 'AI writes more code, faster, which means more code to check. Developers who understand code security are worth a lot to any team.' },
    { slug: 'gh-100', role: 'GitHub administration', short: 'Enterprise admin', work: 'Run GitHub Enterprise: identity, policies, Actions governance and usage.', pickIf: 'you look after the platform for hundreds of developers.', tools: ['SAML SSO & EMU', 'Rulesets', 'Audit logs', 'Licensing'], entry: 'gh-900', rather: 'run GitHub for a whole company', next: [], cheer: 'Every company on GitHub Enterprise needs an admin who knows the policies and the bill. That person rarely runs out of work.' },
  ],
  stepThreeEyebrow: 'Step 3 · go further',
  stepThreeTitle: 'Next: running coding agents',
  stepThreeNote: 'Once Copilot and Actions feel normal, this is where GitHub’s exams go next.',
  stepThree: [
    { slug: 'gh-600', short: 'Agentic AI Developer', tag: 'NEXT STEP', phoneNote: 'agents in the SDLC', forWho: 'Developers who run coding agents inside the software lifecycle: tools and MCP servers, memory and state, evaluation, multi-agent work and guardrails.', needs: 'One exam. GH-300 and GH-200 give you most of the background it assumes, because agents lean on Copilot and Actions.' },
  ],
  legend: { sug: 'suggested next step' },
  stats: [
    { n: 4, label: 'role tracks to choose from' },
    { n: 1, label: 'free GitHub course live here (GH-300)' },
    { n: 1, label: 'next step for coding agents' },
    { n: 100, suffix: '%', label: 'free courses on this site' },
  ],
  faq: [
    { q: 'Which GitHub certification should I start with?', a: 'Start with the work you do most. Using Copilot points to GH-300. CI/CD with GitHub Actions points to GH-200. Code security points to GH-500. Running GitHub Enterprise points to GH-100. GH-900 is an optional first step.' },
    { q: 'Is there a GitHub Copilot certification?', a: 'Yes. GH-300 (GitHub Copilot) covers responsible AI, Copilot in the IDE and CLI, agent mode and MCP, prompt crafting, data flow and organisation policies. There is a free GH-300 course on this site.' },
    { q: 'Do I need GH-900 before the other GitHub exams?', a: 'No. GH-900 is optional. Take it if Git, branches and pull requests are still new to you.' },
    { q: 'Who runs the GitHub certifications?', a: 'Microsoft delivers the exams, and GitHub maintains the exams and certifications.' },
    { q: 'What is GH-600?', a: 'GH-600 (GitHub Agentic AI Developer) covers running coding agents inside the software lifecycle: tools and MCP servers, memory and state, evaluation, multi-agent orchestration and guardrails.' },
  ],
  glow: '159 232 112',
  checked: CHECKED,
};

export const ROADMAPS: Roadmap[] = [AI, SECURITY, GITHUB];
export const roadmapByPath = (path: string) => {
  const r = ROADMAPS.find((x) => x.path === path);
  if (!r) throw new Error(`roadmaps.ts: no roadmap at ${path}`);
  return r;
};
/** The AI roadmap's tracks, used by the home page band. */
export const AI_TRACKS = AI.tracks;
