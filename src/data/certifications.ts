/**
 * Certification registry. Adding a new exam = add an entry here, a syllabus
 * file in src/data/<code>/, tutorials under src/content/tutorials/<code>/ and a
 * question bank under src/content/questions/<code>/. No layout changes needed.
 *
 * `status: 'planned'` entries render as "coming later" and are never linked.
 * Before switching one to 'active', re-check the exam's current status on
 * Microsoft Learn — exams are retired and renamed regularly.
 */
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
  { code: 'AZ-104', slug: 'az-104', icon: 'admin', featured: true, name: 'Azure Administrator Associate', level: 'Associate', status: 'planned', blurb: 'Identity, governance, storage, compute, networking and monitoring for administrators.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/' },
  // AI-200 replaced AZ-204 (Azure Developer Associate), which retired on 31 July 2026.
  { code: 'AI-200', slug: 'ai-200', icon: 'code', featured: true, name: 'Azure AI Cloud Developer Associate', level: 'Associate', status: 'active', blurb: 'Containers, Cosmos DB, PostgreSQL and Redis vector search, messaging, Functions and monitoring for AI apps on Azure.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-cloud-developer-associate/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-200' },
  // SC-500 replaced AZ-500 (Azure Security Engineer Associate), which retired on 31 August 2026.
  { code: 'SC-500', slug: 'sc-500', icon: 'shield', featured: true, name: 'Cloud and AI Security Engineer Associate', level: 'Associate', status: 'planned', blurb: 'Identity, Key Vault, storage, network and compute security, AI workload protection, Defender for Cloud and Sentinel.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/cloud-and-ai-security-engineer-associate/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500' },
  // AI-103 replaced AI-102 (Azure AI Engineer Associate), which retired on 30 June 2026.
  { code: 'AI-103', slug: 'ai-103', icon: 'ai', name: 'Azure AI Apps and Agents Developer Associate', level: 'Associate', status: 'planned', blurb: 'Generative AI apps and agents built with Microsoft Foundry, plus RAG, vision, text, speech and content extraction.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-apps-and-agents-developer-associate/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-103' },
  { code: 'AZ-305', slug: 'az-305', icon: 'architect', featured: true, name: 'Azure Solutions Architect Expert', level: 'Expert', status: 'planned', blurb: 'Designing identity, data, business continuity and infrastructure solutions.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-solutions-architect/' },
  { code: 'AZ-400', slug: 'az-400', icon: 'devops', name: 'DevOps Engineer Expert', level: 'Expert', status: 'planned', blurb: 'Source control, CI/CD, security and compliance, and instrumentation strategy.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/devops-engineer/' },
  // GitHub certifications (delivered by Microsoft, maintained by GitHub). Checked on Microsoft Learn, 19 Nov 2026.
  { code: 'GH-300', slug: 'gh-300', icon: 'code', featured: true, name: 'GitHub Copilot', level: 'Associate', status: 'active', blurb: 'Responsible AI, Copilot in the IDE and CLI, agent mode and MCP, prompt crafting, data flow, org policies and content exclusions.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/github-copilot/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-300' },
  { code: 'GH-600', slug: 'gh-600', icon: 'ai', featured: true, next: true, name: 'GitHub Agentic AI Developer', level: 'Associate', status: 'planned', blurb: 'Running coding agents inside the SDLC: tools and MCP servers, memory and state, evaluation, multi-agent orchestration and guardrails.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/agentic-ai-developer/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-600' },
];

export const activeCerts = () => CERTIFICATIONS.filter((c) => c.status === 'active');
