/**
 * Official skills outlines for exams that are still 'planned' in certifications.ts.
 * Shown on their "coming soon" details page (/<slug>/) until the full course is built.
 * Checked on Microsoft Learn study guides; re-check before turning an exam 'active'.
 */
export interface PlannedOutline {
  /** "Skills measured as of" date on the study guide (empty when the guide gives none). */
  asOf: string;
  /** Date we last checked the study guide. */
  verifiedOn: string;
  passingScore: number;
  /** Delivered by Microsoft; GitHub exams are maintained by GitHub. */
  owner: 'Microsoft' | 'GitHub';
  domains: { title: string; weight: string }[];
  /** Shown as a caution when the study guide has a known problem or the exam changed. */
  note?: string;
}

const CHECKED = '2026-11-19';

export const PLANNED_OUTLINES: Record<string, PlannedOutline> = {
  'gh-900': {
    asOf: 'January 2026', verifiedOn: CHECKED, passingScore: 700, owner: 'GitHub',
    domains: [
      { title: 'Understand Git and GitHub basics', weight: '25–30%' },
      { title: 'Work with GitHub repositories', weight: '10–15%' },
      { title: 'Collaborate using GitHub', weight: '10–15%' },
      { title: 'Apply modern development practices', weight: '10–15%' },
      { title: 'Manage projects with GitHub', weight: '5–10%' },
      { title: 'Understand privacy, security, and administration', weight: '10–15%' },
      { title: 'Explore the GitHub community', weight: '5–10%' },
    ],
  },
  'gh-300': {
    asOf: 'August 7, 2026', verifiedOn: CHECKED, passingScore: 700, owner: 'GitHub',
    domains: [
      { title: 'Use GitHub Copilot responsibly', weight: '15–20%' },
      { title: 'Use GitHub Copilot features', weight: '25–30%' },
      { title: 'Understand GitHub Copilot data and architecture', weight: '10–15%' },
      { title: 'Apply prompt engineering and context crafting', weight: '10–15%' },
      { title: 'Improve developer productivity with GitHub Copilot', weight: '10–15%' },
      { title: 'Configure privacy, content exclusions, and safeguards', weight: '10–15%' },
    ],
    note: 'The study guide lists "GitHub Copilot features" twice at 25–30%. We show it once here and will confirm with Microsoft Learn before the course opens.',
  },
  'gh-600': {
    asOf: '', verifiedOn: CHECKED, passingScore: 700, owner: 'GitHub',
    domains: [
      { title: 'Prepare agent architecture and SDLC processes', weight: '15–20%' },
      { title: 'Implement tool use and environment interaction', weight: '20–25%' },
      { title: 'Manage memory, state, and execution', weight: '10–15%' },
      { title: 'Perform evaluation, error analysis, and tuning', weight: '15–20%' },
      { title: 'Orchestrate multi-agent coordination', weight: '15–20%' },
      { title: 'Implement guardrails and accountability', weight: '10–15%' },
    ],
  },
  'gh-200': {
    asOf: 'January 2026', verifiedOn: CHECKED, passingScore: 700, owner: 'GitHub',
    domains: [
      { title: 'Author and manage workflows', weight: '20–25%' },
      { title: 'Consume and troubleshoot workflows', weight: '15–20%' },
      { title: 'Author and maintain actions', weight: '15–20%' },
      { title: 'Manage GitHub Actions for the enterprise', weight: '20–25%' },
      { title: 'Secure and optimize automation', weight: '10–15%' },
    ],
  },
  'gh-500': {
    asOf: 'July 2026', verifiedOn: CHECKED, passingScore: 700, owner: 'GitHub',
    domains: [
      { title: 'Describe GitHub Security suites, features, and ecosystem', weight: '15–20%' },
      { title: 'Configure and use Secret Protection', weight: '15–20%' },
      { title: 'Configure and use supply chain security', weight: '15–20%' },
      { title: 'Configure and use Code Security (CodeQL)', weight: '10–15%' },
      { title: 'Security operations: prioritization and remediation', weight: '15–20%' },
      { title: 'GitHub Security suites administration', weight: '10–15%' },
    ],
  },
  'gh-100': {
    asOf: 'July 2026', verifiedOn: CHECKED, passingScore: 700, owner: 'GitHub',
    domains: [
      { title: 'Manage GitHub identities and access', weight: '15–20%' },
      { title: 'Administer GitHub Enterprise environment', weight: '10–15%' },
      { title: 'Implement secure software development and compliance', weight: '25–30%' },
      { title: 'Manage GitHub Actions', weight: '20–25%' },
      { title: 'Monitor and optimize GitHub usage', weight: '10–15%' },
    ],
  },
  'dp-900': {
    asOf: 'July 21, 2026', verifiedOn: CHECKED, passingScore: 700, owner: 'Microsoft',
    domains: [
      { title: 'Describe core data concepts', weight: '25–30%' },
      { title: 'Identify considerations for relational data on Azure', weight: '20–25%' },
      { title: 'Describe considerations for non-relational data on Azure', weight: '15–20%' },
      { title: 'Describe an analytics workload on Azure', weight: '25–30%' },
    ],
  },
  'az-104': {
    asOf: 'October 26, 2023', verifiedOn: CHECKED, passingScore: 700, owner: 'Microsoft',
    domains: [
      { title: 'Manage Azure identities and governance', weight: '20–25%' },
      { title: 'Implement and manage storage', weight: '15–20%' },
      { title: 'Deploy and manage Azure compute resources', weight: '20–25%' },
      { title: 'Implement and manage virtual networking', weight: '15–20%' },
      { title: 'Monitor and maintain Azure resources', weight: '10–15%' },
    ],
  },
  'az-500': {
    asOf: 'January 22, 2026', verifiedOn: CHECKED, passingScore: 700, owner: 'Microsoft',
    domains: [
      { title: 'Secure identity and access', weight: '15–20%' },
      { title: 'Secure networking', weight: '20–25%' },
      { title: 'Secure compute, storage, and databases', weight: '20–25%' },
      { title: 'Secure Azure using Defender for Cloud and Sentinel', weight: '30–35%' },
    ],
    note: 'Microsoft retired AZ-500 on 31 August 2026. Its successor is SC-500 (end-to-end security for cloud and AI workloads), so this course may move to SC-500.',
  },
  'ai-103': {
    asOf: 'April 16, 2026', verifiedOn: CHECKED, passingScore: 700, owner: 'Microsoft',
    domains: [
      { title: 'Plan and manage an Azure AI solution', weight: '25–30%' },
      { title: 'Implement generative AI and agentic solutions', weight: '30–35%' },
      { title: 'Implement computer vision solutions', weight: '10–15%' },
      { title: 'Implement text analysis solutions', weight: '10–15%' },
      { title: 'Implement information extraction solutions', weight: '10–15%' },
    ],
  },
  'az-305': {
    asOf: 'April 17, 2026', verifiedOn: CHECKED, passingScore: 700, owner: 'Microsoft',
    domains: [
      { title: 'Design identity, governance, and monitoring solutions', weight: '25–30%' },
      { title: 'Design data storage solutions', weight: '20–25%' },
      { title: 'Design business continuity solutions', weight: '15–20%' },
      { title: 'Design infrastructure solutions', weight: '30–35%' },
    ],
  },
  'az-400': {
    asOf: 'July 27, 2026', verifiedOn: CHECKED, passingScore: 700, owner: 'Microsoft',
    domains: [
      { title: 'Design and implement processes and communications', weight: '10–15%' },
      { title: 'Design and implement a source control strategy', weight: '10–15%' },
      { title: 'Design and implement build and release pipelines', weight: '50–55%' },
      { title: 'Develop a security and compliance plan', weight: '10–15%' },
      { title: 'Implement an instrumentation strategy', weight: '5–10%' },
    ],
  },
};
