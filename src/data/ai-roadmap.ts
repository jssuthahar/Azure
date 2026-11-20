/**
 * Role-based Azure AI certification roadmap (/ai-certifications/).
 * Pick a certification by the work you want to own, not by the next exam on a list.
 * Exam names, levels and links come from certifications.ts; this file only adds the
 * role framing. Prerequisites checked on Microsoft Learn, 20 Nov 2026.
 */
export const AI_ROADMAP_CHECKED = '2026-11-20';

export interface RoleTrack {
  /** Exam slug in certifications.ts. */
  slug: string;
  role: string;
  /** One line: the work this certification proves you can do. */
  work: string;
  /** Pick this if you... */
  pickIf: string;
  tools: string[];
  /** Short label for the diagram node. */
  short: string;
  /** Suggested optional entry exam. */
  entry: 'ai-901' | 'az-900';
  /** Path finder option: "I'd rather..." */
  rather: string;
  /** Growth steps after this certification. `required` = needed for that Expert certification. */
  next: { slug: string; required: boolean }[];
  /** One honest line of encouragement for the path finder result. */
  cheer: string;
}

/** Optional entry learning. Neither is a prerequisite for any track below. */
export const AI_ENTRY = ['ai-901', 'az-900'];

/** Start with the work you want to own. */
export const AI_TRACKS: RoleTrack[] = [
  { slug: 'ai-103', role: 'AI apps and agents', work: 'Build generative AI apps and agents with Microsoft Foundry.', pickIf: 'you write code that calls models, grounds them with RAG and wires agents to tools.', tools: ['Microsoft Foundry', 'Agent Service', 'RAG', 'Vision and language'], short: 'Apps & agents', entry: 'ai-901', rather: 'write code that talks to models and tools', next: [{ slug: 'ai-500', required: true }], cheer: 'Teams everywhere want someone who can take an AI idea from a notebook to a working agent. Start with one small app that answers questions from your own documents.' },
  { slug: 'ai-200', role: 'Cloud development and integration', work: 'Build the cloud backend an AI app runs on.', pickIf: 'you build APIs, containers, data stores and messaging that AI features plug into.', tools: ['Container Apps', 'Functions', 'Cosmos DB', 'Vector search'], short: 'Cloud backends', entry: 'az-900', rather: 'build the APIs and data stores an app runs on', next: [{ slug: 'az-104', required: false }], cheer: 'Every AI feature still needs a backend that stays up. Our AI-200 course is live and free, so you can start today.' },
  { slug: 'ai-300', role: 'Production AI and MLOps', work: 'Deploy, monitor and improve ML models and GenAI apps in production.', pickIf: 'you own pipelines, evaluations, drift alerts and fine-tuning after the demo works.', tools: ['Azure Machine Learning', 'Foundry', 'GitHub Actions', 'Bicep'], short: 'MLOps', entry: 'ai-901', rather: 'keep models healthy once they are in production', next: [], cheer: 'Plenty of people can build a demo. Fewer can keep it accurate, fast and affordable a year later. That is the job AI-300 proves.' },
  { slug: 'ab-620', role: 'Enterprise agent building', work: 'Build and integrate enterprise agents in Copilot Studio.', pickIf: 'you build agents for a business on Power Platform, connectors and MCP servers.', tools: ['Copilot Studio', 'MCP', 'Connectors', 'Dataverse'], short: 'Copilot Studio agents', entry: 'ai-901', rather: 'build agents for business teams with low code', next: [{ slug: 'ab-100', required: false }], cheer: 'Business teams are queuing up for agents that file tickets, answer HR questions and update records. You can be the person who builds them.' },
  { slug: 'sc-500', role: 'Cloud and AI security', work: 'Secure cloud and AI workloads end to end.', pickIf: 'you protect identities, data, networks and AI resources, and watch for attacks.', tools: ['Entra ID', 'Key Vault', 'Defender for Cloud', 'Sentinel'], short: 'Cloud & AI security', entry: 'az-900', rather: 'stop attackers and lock AI workloads down', next: [], cheer: 'Every new agent is a new thing to protect. Security people who understand AI will be asked into every project.' },
];

/** Optional platform depth before the Expert tier. */
export const AI_PLATFORM = 'az-104';

export interface ExpertTrack { slug: string; forWho: string; needs: string; }

/** For experienced people moving into architecture. Both need more than one exam. */
export const AI_EXPERTS: ExpertTrack[] = [
  { slug: 'ab-100', forWho: 'Architects designing agent-first business solutions across Copilot Studio, Foundry, Power Platform and Dynamics 365.', needs: 'Pass AB-100 and hold a qualifying associate certification (for example Power Platform Developer or a Dynamics 365 associate). Microsoft’s list of qualifying certifications changes, so check it before you book.' },
  { slug: 'ai-500', forWho: 'Engineers who design, build and run production multi-agent systems on Azure.', needs: 'Pass AI-500 and AI-103, in any order. The retired AI-102 doesn’t count.' },
];

export const AI_FAQ = [
  { q: 'Which Azure AI certification should I start with?', a: 'Start with the work you want to do. Building AI apps and agents in code points to AI-103. Cloud backends for AI apps point to AI-200. Running models in production points to AI-300. Copilot Studio agents point to AB-620. Securing cloud and AI workloads points to SC-500.' },
  { q: 'Do I need AI-901 or AZ-900 before an AI associate exam?', a: 'No. Microsoft lists no prerequisites for AI-103, AI-200, AI-300, AB-620 or SC-500. AI-901 and AZ-900 are optional, but they give you the vocabulary the associate exams assume.' },
  { q: 'What replaced AI-102 and AI-900?', a: 'AI-103 replaced AI-102 (Azure AI Engineer Associate), which retired on 30 June 2026. AI-901 replaced AI-900 on the same date, for the same Azure AI Fundamentals certification.' },
  { q: 'What do I need for the AI-500 Multi-Agent AI Solutions Expert certification?', a: 'You need to pass both AI-500 and AI-103. You can take them in either order. The retired AI-102 does not count towards it.' },
  { q: 'What do I need for the AB-100 Agentic AI Business Solutions Architect Expert certification?', a: 'You need to pass AB-100 and hold one qualifying associate certification, such as Power Platform Developer Associate or a Dynamics 365 associate. Check the current list on Microsoft Learn before you book.' },
  { q: 'Is AZ-104 required for the AI certifications?', a: 'No. AZ-104 is optional. It adds Azure platform depth (identity, networking, storage, monitoring) that helps if you will run AI workloads yourself.' },
];
