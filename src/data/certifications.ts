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
  { code: 'AI-900', slug: 'ai-900', icon: 'ai', name: 'Azure AI Fundamentals', level: 'Fundamentals', status: 'planned', blurb: 'AI workloads, machine learning, computer vision, NLP and generative AI on Azure.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-fundamentals/' },
  { code: 'DP-900', slug: 'dp-900', icon: 'data', name: 'Azure Data Fundamentals', level: 'Fundamentals', status: 'planned', blurb: 'Core data concepts, relational and non-relational data, and analytics on Azure.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-data-fundamentals/' },
  { code: 'AZ-104', slug: 'az-104', icon: 'admin', featured: true, name: 'Azure Administrator Associate', level: 'Associate', status: 'planned', blurb: 'Identity, governance, storage, compute, networking and monitoring for administrators.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/' },
  // AI-200 replaced AZ-204 (Azure Developer Associate), which retired on 31 July 2026.
  { code: 'AI-200', slug: 'ai-200', icon: 'code', featured: true, name: 'Azure AI Cloud Developer Associate', level: 'Associate', status: 'planned', blurb: 'Containers, Cosmos DB, PostgreSQL and Redis vector search, messaging, Functions and monitoring for AI apps on Azure.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-cloud-developer-associate/', studyGuideUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-200' },
  { code: 'AZ-500', slug: 'az-500', icon: 'shield', featured: true, name: 'Azure Security Engineer Associate', level: 'Associate', status: 'planned', blurb: 'Identity, networking, compute and data security controls on Azure.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-security-engineer/' },
  { code: 'AI-102', slug: 'ai-102', icon: 'ai', name: 'Azure AI Engineer Associate', level: 'Associate', status: 'planned', blurb: 'Designing and implementing Azure AI solutions.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-engineer/' },
  { code: 'AZ-305', slug: 'az-305', icon: 'architect', featured: true, name: 'Azure Solutions Architect Expert', level: 'Expert', status: 'planned', blurb: 'Designing identity, data, business continuity and infrastructure solutions.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/azure-solutions-architect/' },
  { code: 'AZ-400', slug: 'az-400', icon: 'devops', name: 'DevOps Engineer Expert', level: 'Expert', status: 'planned', blurb: 'Source control, CI/CD, security and compliance, and instrumentation strategy.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/certifications/devops-engineer/' },
  { code: 'DP-203', slug: 'dp-203', icon: 'data', name: 'Azure data engineering', level: 'Associate', status: 'planned', blurb: 'Data engineering learning content on Azure.', officialUrl: 'https://learn.microsoft.com/en-us/credentials/', verifyNote: 'Exam status must be verified on Microsoft Learn before publishing; content may be offered as learning material only.' },
];

export const activeCerts = () => CERTIFICATIONS.filter((c) => c.status === 'active');
