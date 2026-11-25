/**
 * Microsoft exams retired in 2026 and what replaced them. Every date was
 * checked on Microsoft Learn (retired exams list, study guides and Partner
 * Center announcements). Re-check VERIFIED before editing.
 */
export const VERIFIED = '2026-11-25';

export interface ExamChange {
  old: string;
  oldName: string;
  retired: string; // ISO date
  next: string[]; // replacement exam codes
  nextName: string;
  available?: string; // ISO date the replacement became available
  /** One plain sentence on what changed, for the page and llms.txt. */
  what: string;
  /** Site slug of the replacement course, if we have one. */
  slug?: string;
}

export const EXAM_CHANGES: ExamChange[] = [
  { old: 'AI-900', oldName: 'Azure AI Fundamentals', retired: '2026-06-30', next: ['AI-901'], nextName: 'Azure AI Fundamentals', slug: 'ai-901',
    what: 'Same certification name, new exam. AI-901 moves from describing Azure AI services to building simple AI apps and agents in Microsoft Foundry.' },
  { old: 'AI-102', oldName: 'Azure AI Engineer Associate', retired: '2026-06-30', next: ['AI-103'], nextName: 'Azure AI Apps and Agents Developer Associate', available: '2026-06-19', slug: 'ai-103',
    what: 'The AI engineer role becomes an apps-and-agents developer role: generative AI apps, agents, RAG, vision, speech and extraction built with Foundry.' },
  { old: 'DP-100', oldName: 'Azure Data Scientist Associate', retired: '2026-06-01', next: ['AI-300'], nextName: 'Machine Learning Operations Engineer Associate', available: '2026-05-12', slug: 'ai-300',
    what: 'Model training gives way to running models in production: MLOps with Azure Machine Learning and GenAIOps with Foundry.' },
  { old: 'AZ-204', oldName: 'Azure Developer Associate', retired: '2026-07-31', next: ['AI-200'], nextName: 'Azure AI Cloud Developer Associate', available: '2026-07-09', slug: 'ai-200',
    what: 'The Azure developer exam is rebuilt around AI back ends: containers, Cosmos DB and PostgreSQL vector search, messaging, Functions and monitoring.' },
  { old: 'AZ-500', oldName: 'Azure Security Engineer Associate', retired: '2026-08-31', next: ['SC-500'], nextName: 'Cloud and AI Security Engineer Associate', available: '2026-07-21', slug: 'sc-500',
    what: 'The security engineer role now covers protecting AI workloads and models as well as identity, network, compute and data.' },
  { old: 'PL-600, MB-335, MB-700, PL-500', oldName: 'Power Platform and Dynamics 365 architect and RPA certifications', retired: '2026-06-30', next: ['AB-100'], nextName: 'Agentic AI Business Solutions Architect', slug: 'ab-100',
    what: 'Four business applications certifications are replaced together by one agent-first architect certification across Copilot Studio, Foundry, Power Platform and Dynamics 365.' },
];

/** Exams that did NOT retire but changed in 2026. */
export const EXAM_UPDATES = [
  { code: 'AZ-104', slug: 'az-104', text: 'Still current. Microsoft refreshed the skills outline on April 17, 2026: the same five domains with Microsoft Entra naming, Container Apps and both Recovery Services and Backup vaults.' },
];

const fmt = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
export const niceDate = fmt;
