/**
 * Certification registry. Adding a new exam = add an entry here, a syllabus
 * file in src/data/<code>/, tutorials under src/content/tutorials/<code>/ and a
 * question bank under src/content/questions/<code>/. No layout changes needed.
 *
 * `status: 'planned'` entries render as "coming later" and are never linked.
 * Before switching one to 'active', re-check the exam's current status on
 * Microsoft Learn — exams are retired and renamed regularly.
 */
/** Exams switched on only for local preview builds: MSDB_PREVIEW=ai-103 npm run dev / verify. */
const preview = (slug: string) => typeof process !== 'undefined' && (process.env?.MSDB_PREVIEW ?? '').split(',').includes(slug);

export interface Certification {
  code: string;
  slug: string;
  name: string;
  level: 'Fundamentals' | 'Associate' | 'Expert' | 'Specialty';
  status: 'active' | 'planned';
  blurb: string;
  officialUrl: string;
  studyGuideUrl?: string;
  /** Free-text caution shown for planned exams whose status must be verified. */
  verifyNote?: string;
  /** Shown in the home page's Featured Certifications row. */
  featured?: boolean;
  /** The planned exam being built next; the home roadmap marks it "Up next". */
  next?: boolean;
  /** Card artwork (see CertIcon.astro). */
  icon?: 'cloud' | 'ai' | 'data' | 'admin' | 'code' | 'shield' | 'architect' | 'devops';
}

/** Difficulty shown on course cards, from the Microsoft certification level. */
export const difficulty = (c: Certification) => (c.level === 'Fundamentals' ? 'Beginner' : c.level === 'Expert' ? 'Advanced' : 'Intermediate');

export const CERTIFICATIONS: Certification[] = [
  {
    code: 'AZ-900',
    slug: 'az-900',
    name: 'Microsoft Azure Fundamentals',
    level: 'Fundamentals',
    status: 'active',
    featured: true,
    icon: 'cloud',
    blurb: 'Cloud concepts, Azure architecture and services, and Azure management and governance. The best place to start.',
    officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/',
    studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900',
  },
  // AI-901 replaced AI-900 (retired 30 June 2026). Same certification: Microsoft Certified: Azure AI Fundamentals.
  { code: 'AI-901', slug: 'ai-901', icon: 'ai', name: 'Azure AI Fundamentals', level: 'Fundamentals', status: 'active', blurb: 'Responsible AI, generative and agentic AI, text, speech, vision and information extraction, built hands-on with Microsoft Foundry.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-901' },
  { code: 'DP-900', slug: 'dp-900', icon: 'data', name: 'Azure Data Fundamentals', level: 'Fundamentals', status: 'planned', blurb: 'Core data concepts, relational and non-relational data, and analytics on Azure.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-data-fundamentals/' },
  { code: 'AZ-104', slug: 'az-104', icon: 'admin', featured: true, name: 'Azure Administrator Associate', level: 'Associate', status: 'active', blurb: 'Entra ID and RBAC, Azure Policy, storage security, VMs and Bicep, App Service and containers, VNets and load balancers, monitoring and backup.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104' },
  // AI-200 replaced AZ-204 (Azure Developer Associate), which retired on 31 July 2026.
  { code: 'AI-200', slug: 'ai-200', icon: 'code', featured: true, name: 'Azure AI Cloud Developer Associate', level: 'Associate', status: 'active', blurb: 'Containers, Cosmos DB, PostgreSQL and Redis vector search, messaging, Functions and monitoring for AI apps on Azure.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-cloud-developer-associate/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-200' },
  // SC-500 replaced AZ-500 (Azure Security Engineer Associate), which retired on 31 August 2026.
  { code: 'SC-500', slug: 'sc-500', icon: 'shield', featured: true, name: 'Cloud and AI Security Engineer Associate', level: 'Associate', status: 'planned', blurb: 'Identity, Key Vault, storage, network and compute security, AI workload protection, Defender for Cloud and Sentinel.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/cloud-and-ai-security-engineer-associate/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500' },
  // AI-103 replaced AI-102 (Azure AI Engineer Associate), which retired on 30 June 2026.
  { code: 'AI-103', slug: 'ai-103', icon: 'ai', name: 'Azure AI Apps and Agents Developer Associate', level: 'Associate', status: 'active', blurb: 'Generative AI apps and agents built with Microsoft Foundry, plus RAG, vision, text, speech and content extraction.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-apps-and-agents-developer-associate/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-103' },
  // Added 20 Nov 2026 for the AI certification roadmap (/ai-certifications/). Checked on Microsoft Learn study guides.
  { code: 'AI-300', slug: 'ai-300', icon: 'devops', name: 'Machine Learning Operations Engineer Associate', level: 'Associate', status: 'planned', blurb: 'MLOps with Azure Machine Learning and GenAIOps with Microsoft Foundry: pipelines, deployment, evaluation and monitoring.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/operationalizing-machine-learning-and-generative-ai-solutions/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-300' },
  { code: 'AB-620', slug: 'ab-620', icon: 'ai', name: 'AI Agent Builder Associate', level: 'Associate', status: 'planned', blurb: 'Enterprise agents in Copilot Studio: workflows, skills, MCP servers and connectors as tools, multi-agent collaboration, testing and ALM.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/ai-agent-builder-associate/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-620' },
  { code: 'AI-500', slug: 'ai-500', icon: 'architect', name: 'Multi-Agent AI Solutions Expert', level: 'Expert', status: 'planned', blurb: 'Architecting, building, evaluating and securing production multi-agent systems on Azure. The certification needs AI-103 as well.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/exams/ai-500/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-500' },
  { code: 'AB-100', slug: 'ab-100', icon: 'architect', name: 'Agentic AI Business Solutions Architect', level: 'Expert', status: 'planned', blurb: 'Planning, designing and deploying agent-first business solutions across Copilot Studio, Foundry, Power Platform and Dynamics 365.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/agentic-ai-business-solutions-architect/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-100' },
  { code: 'AZ-305', slug: 'az-305', icon: 'architect', featured: true, name: 'Azure Solutions Architect Expert', level: 'Expert', status: 'planned', blurb: 'Designing identity, data, business continuity and infrastructure solutions.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-solutions-architect/' },
  { code: 'AZ-400', slug: 'az-400', icon: 'devops', name: 'DevOps Engineer Expert', level: 'Expert', status: 'planned', blurb: 'Source control, CI/CD, security and compliance, and instrumentation strategy.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/devops-engineer/' },
  // Security roadmap (/security-certifications/). Checked on Microsoft Learn study guides, 20 Nov 2026.
  { code: 'SC-900', slug: 'sc-900', icon: 'shield', name: 'Security, Compliance, and Identity Fundamentals', level: 'Fundamentals', status: 'planned', blurb: 'Zero Trust, Microsoft Entra, Defender, Sentinel and Purview basics. The gentle way into Microsoft security.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/security-compliance-and-identity-fundamentals/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-900' },
  { code: 'SC-200', slug: 'sc-200', icon: 'shield', name: 'Security Operations Analyst Associate', level: 'Associate', status: 'planned', blurb: 'Detect, investigate and hunt threats with Defender XDR, Microsoft Sentinel, KQL and Security Copilot.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/security-operations-analyst/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-200' },
  { code: 'SC-300', slug: 'sc-300', icon: 'shield', name: 'Identity and Access Administrator Associate', level: 'Associate', status: 'planned', blurb: 'Microsoft Entra users, Conditional Access, workload identities, Global Secure Access and identity governance.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/identity-and-access-administrator/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-300' },
  { code: 'SC-401', slug: 'sc-401', icon: 'shield', name: 'Information Security Administrator Associate', level: 'Associate', status: 'planned', blurb: 'Microsoft Purview labels, DLP, retention and insider risk, plus protecting data used by AI with DSPM for AI.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/information-security-administrator/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-401' },
  { code: 'SC-100', slug: 'sc-100', icon: 'architect', name: 'Cybersecurity Architect Expert', level: 'Expert', status: 'planned', blurb: 'Zero Trust security design across identity, data, AI, apps and infrastructure. Needs SC-200 or SC-300 as well.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/cybersecurity-architect-expert/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-100' },
  // GitHub roadmap (/github-certifications/). Checked on Microsoft Learn study guides, 20 Nov 2026.
  { code: 'GH-900', slug: 'gh-900', icon: 'code', name: 'GitHub Foundations', level: 'Fundamentals', status: 'planned', blurb: 'Git, repositories, pull requests, Actions, Copilot, Codespaces and projects. The starting point for every GitHub exam.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/github-foundations/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-900' },
  { code: 'GH-200', slug: 'gh-200', icon: 'devops', name: 'GitHub Actions', level: 'Associate', status: 'planned', blurb: 'Author, consume and secure workflows and actions, then run GitHub Actions at enterprise scale.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/exams/gh-200/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-200' },
  { code: 'GH-500', slug: 'gh-500', icon: 'shield', name: 'GitHub Advanced Security', level: 'Associate', status: 'planned', blurb: 'Code Security with CodeQL, Secret Protection, supply chain security and running security campaigns.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/exams/gh-500/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-500' },
  { code: 'GH-100', slug: 'gh-100', icon: 'admin', name: 'GitHub Enterprise Administrator', level: 'Associate', status: 'planned', blurb: 'Identity and access, enterprise policies, secure development settings, Actions governance and usage.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/exams/gh-100/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-100' },
  // GitHub certifications (delivered by Microsoft, maintained by GitHub). Checked on Microsoft Learn, 19 Nov 2026.
  { code: 'GH-300', slug: 'gh-300', icon: 'code', featured: true, name: 'GitHub Copilot', level: 'Associate', status: 'active', blurb: 'Responsible AI, Copilot in the IDE and CLI, agent mode and MCP, prompt crafting, data flow, org policies and content exclusions.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/github-copilot/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-300' },
  { code: 'GH-600', slug: 'gh-600', icon: 'ai', featured: true, next: true, name: 'GitHub Agentic AI Developer', level: 'Associate', status: 'planned', blurb: 'Running coding agents inside the SDLC: tools and MCP servers, memory and state, evaluation, multi-agent orchestration and guardrails.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/agentic-ai-developer/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-600' },
];

export const activeCerts = () => CERTIFICATIONS.filter((c) => c.status === 'active');
