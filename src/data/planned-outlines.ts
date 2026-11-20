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
  'sc-500': {
    asOf: '', verifiedOn: CHECKED, passingScore: 700, owner: 'Microsoft',
    domains: [
      { title: 'Manage identity, access, and governance', weight: '20–25%' },
      { title: 'Secure storage, databases, and networking', weight: '25–30%' },
      { title: 'Secure compute (including AI workloads)', weight: '20–25%' },
      { title: 'Manage and monitor security posture', weight: '20–25%' },
    ],
    note: 'SC-500 replaced AZ-500, which Microsoft retired on 31 August 2026. Existing AZ-500 certifications cannot be renewed.',
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
  'ai-300': {
    asOf: '', verifiedOn: '2026-11-20', passingScore: 700, owner: 'Microsoft',
    domains: [
      { title: 'Design and implement an MLOps infrastructure', weight: '15–20%' },
      { title: 'Implement machine learning model lifecycle and operations', weight: '25–30%' },
      { title: 'Design and implement a GenAIOps infrastructure', weight: '20–25%' },
      { title: 'Implement generative AI quality assurance and observability', weight: '10–15%' },
      { title: 'Optimize generative AI systems and model performance', weight: '10–15%' },
    ],
  },
  'ab-620': {
    asOf: 'December 18, 2026', verifiedOn: '2026-11-20', passingScore: 700, owner: 'Microsoft',
    domains: [
      { title: 'Plan and configure agent solutions', weight: '50–55%' },
      { title: 'Integrate and extend agents in Copilot Studio', weight: '20–25%' },
      { title: 'Test and manage agents', weight: '25–30%' },
    ],
    note: 'Microsoft changes the AB-620 skills outline on 18 December 2026 (the outline shown here). If you sit the exam before then, check the current study guide.',
  },
  'ai-500': {
    asOf: '', verifiedOn: '2026-11-20', passingScore: 700, owner: 'Microsoft',
    domains: [
      { title: 'Architect multi-agent solutions', weight: '15–20%' },
      { title: 'Develop multi-agent solutions in Azure', weight: '30–35%' },
      { title: 'Evaluate, optimize, and monitor multi-agent solutions', weight: '20–25%' },
      { title: 'Secure, govern, and deploy multi-agent solutions', weight: '20–25%' },
    ],
    note: 'Passing AI-500 alone does not earn the certification. You also need AI-103 (the retired AI-102 does not count).',
  },
  'ab-100': {
    asOf: 'November 16, 2026', verifiedOn: '2026-11-20', passingScore: 700, owner: 'Microsoft',
    domains: [
      { title: 'Plan AI-powered business solutions', weight: '35–40%' },
      { title: 'Design AI-powered business solutions', weight: '30–35%' },
      { title: 'Deploy AI-powered business solutions', weight: '20–25%' },
    ],
    note: 'This Expert certification needs a prerequisite associate certification, such as a Power Platform or Dynamics 365 associate, as well as passing AB-100.',
  },
  'sc-900': {
    asOf: 'October 21, 2026', verifiedOn: '2026-11-20', passingScore: 700, owner: 'Microsoft',
    domains: [
      { title: 'Describe the concepts of security, compliance, and identity', weight: '10–15%' },
      { title: 'Describe the capabilities of Microsoft Entra', weight: '25–30%' },
      { title: 'Describe the capabilities of Microsoft security solutions', weight: '35–40%' },
      { title: 'Describe the capabilities of Microsoft compliance solutions', weight: '20–25%' },
    ],
  },
  'sc-200': {
    asOf: 'October 21, 2026', verifiedOn: '2026-11-20', passingScore: 700, owner: 'Microsoft',
    domains: [
      { title: 'Manage a security operations environment', weight: '40–45%' },
      { title: 'Respond to security incidents', weight: '35–40%' },
      { title: 'Perform threat hunting', weight: '20–25%' },
    ],
  },
  'sc-300': {
    asOf: 'October 28, 2026', verifiedOn: '2026-11-20', passingScore: 700, owner: 'Microsoft',
    domains: [
      { title: 'Implement and manage user identities', weight: '20–25%' },
      { title: 'Implement authentication and access management', weight: '25–30%' },
      { title: 'Plan and implement workload identities', weight: '20–25%' },
      { title: 'Plan and automate identity governance', weight: '20–25%' },
    ],
  },
  'sc-401': {
    asOf: 'October 28, 2026', verifiedOn: '2026-11-20', passingScore: 700, owner: 'Microsoft',
    domains: [
      { title: 'Implement information protection', weight: '30–35%' },
      { title: 'Implement data loss prevention and retention', weight: '30–35%' },
      { title: 'Manage risks, alerts, and activities', weight: '30–35%' },
    ],
  },
  'sc-100': {
    asOf: 'October 21, 2026', verifiedOn: '2026-11-20', passingScore: 700, owner: 'Microsoft',
    domains: [
      { title: 'Design solutions that align with security best practices and priorities', weight: '20–25%' },
      { title: 'Design security operations, identity, and compliance capabilities', weight: '25–30%' },
      { title: 'Design security solutions for infrastructure', weight: '25–30%' },
      { title: 'Design security solutions for applications and data', weight: '20–25%' },
    ],
    note: 'Passing SC-100 alone does not earn the certification. You also need one prerequisite associate certification: SC-200 or SC-300 count. AZ-500 was the third option before it retired, so check the current list on Microsoft Learn.',
  },
  'gh-900': {
    asOf: 'January 2026', verifiedOn: '2026-11-20', passingScore: 700, owner: 'GitHub',
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
  'gh-200': {
    asOf: 'January 2026', verifiedOn: '2026-11-20', passingScore: 700, owner: 'GitHub',
    domains: [
      { title: 'Author and manage workflows', weight: '20–25%' },
      { title: 'Consume and troubleshoot workflows', weight: '15–20%' },
      { title: 'Author and maintain actions', weight: '15–20%' },
      { title: 'Manage GitHub Actions for the enterprise', weight: '20–25%' },
      { title: 'Secure and optimize automation', weight: '10–15%' },
    ],
  },
  'gh-500': {
    asOf: 'July 2026', verifiedOn: '2026-11-20', passingScore: 700, owner: 'GitHub',
    domains: [
      { title: 'Describe GitHub Security suites, features, and ecosystem', weight: '15–20%' },
      { title: 'Configure and use Secret Protection', weight: '15–20%' },
      { title: 'Configure and use supply chain security', weight: '15–20%' },
      { title: 'Configure and use Code Security', weight: '10–15%' },
      { title: 'Security operations: best practices, prioritization, and remediation', weight: '15–20%' },
      { title: 'GitHub Security suites administration', weight: '10–15%' },
    ],
  },
  'gh-100': {
    asOf: 'July 2026', verifiedOn: '2026-11-20', passingScore: 700, owner: 'GitHub',
    domains: [
      { title: 'Manage GitHub identities and access', weight: '15–20%' },
      { title: 'Administer GitHub Enterprise environment', weight: '10–15%' },
      { title: 'Implement secure software development and compliance', weight: '25–30%' },
      { title: 'Manage GitHub Actions', weight: '20–25%' },
      { title: 'Monitor and optimize GitHub usage', weight: '10–15%' },
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
