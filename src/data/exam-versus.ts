/**
 * "Old exam vs new exam" pages (/ai-900-vs-ai-901/, /az-204-vs-ai-200/).
 * Old outlines come from the retired study guides on Microsoft Learn (checked
 * 25 Nov 2026); new outlines are read from the live course syllabus so they
 * never drift. Keep claims to what the outlines say.
 */
export interface Versus {
  path: string;
  old: { code: string; name: string; asOf: string; retired: string; domains: [string, string][] };
  next: string; // live exam slug
  title: string; // <title>
  description: string;
  h1: string;
  answer: string;
  added: string[];
  dropped: string[];
  same: string[];
  verdict: string;
  faq: { q: string; a: string }[];
}

export const VERSUS: Versus[] = [
  {
    path: '/ai-900-vs-ai-901/',
    old: { code: 'AI-900', name: 'Microsoft Azure AI Fundamentals', asOf: 'May 2, 2025', retired: '30 June 2026', domains: [
      ['Describe AI workloads and considerations', '15–20%'],
      ['Describe fundamental principles of machine learning on Azure', '15–20%'],
      ['Describe features of computer vision workloads on Azure', '15–20%'],
      ['Describe features of NLP workloads on Azure', '15–20%'],
      ['Describe features of generative AI workloads on Azure', '20–25%'],
    ] },
    next: 'ai-901',
    title: 'AI-900 vs AI-901: What Changed in 2026 | MSDEVBUILD',
    description: 'AI-900 vs AI-901 side by side: the old five describe-only domains against the new hands-on Foundry exam. What was added, what was dropped and what to study.',
    h1: 'AI-900 vs AI-901: what changed, and what to study now',
    answer: 'AI-901 replaced AI-900 on 30 June 2026 and earns the same Azure AI Fundamentals certification. AI-900 asked you to describe AI services across five domains. AI-901 has two domains, and more than half of it is building with Microsoft Foundry: prompts, a chat client with the Foundry SDK, a single agent, speech, vision and Content Understanding. It also expects basic Python.',
    added: [
      'Hands-on Microsoft Foundry work worth 55–60% of the exam: deploy a model, write system and user prompts, and build a lightweight chat client with the Foundry SDK.',
      'Agents: create and test a single-agent solution in the Foundry portal and a small client app for it.',
      'Information extraction with Azure Content Understanding from documents, images, audio and video.',
      'Basic Python. Microsoft says you need knowledge of Python coding syntax and programming techniques.',
    ],
    dropped: [
      'The machine learning principles domain: regression, classification and clustering scenarios, features and labels, and automated machine learning in Azure Machine Learning.',
      'Describe-only questions about individual services such as Azure AI Face detection.',
      'Older service names. The new outline uses Microsoft Foundry and Foundry Tools throughout.',
    ],
    same: [
      'The six responsible AI principles: fairness, reliability and safety, privacy and security, inclusiveness, transparency and accountability.',
      'Recognising common workloads: text analysis, speech, computer vision and generative AI.',
      'Pass mark 700 on a 1–1000 scale, and the certification name, Microsoft Certified: Azure AI Fundamentals.',
    ],
    verdict: 'Study AI-901. AI-900 can no longer be booked, and an AI-900 course will spend time on machine learning theory the new exam dropped while skipping the Foundry building that now makes up most of the marks.',
    faq: [
      { q: 'Is AI-901 harder than AI-900?', a: 'It asks more of you in practice. AI-900 was describe-only; AI-901 expects you to build small apps and an agent in Microsoft Foundry and to read basic Python.' },
      { q: 'I passed AI-900. Do I need AI-901?', a: 'No. Both earn Microsoft Certified: Azure AI Fundamentals, and a fundamentals certification does not expire.' },
      { q: 'Can I use AI-900 study material for AI-901?', a: 'Only the responsible AI and workload basics carry over. Use material written for AI-901 for everything about Foundry, agents and Content Understanding.' },
    ],
  },
  {
    path: '/az-204-vs-ai-200/',
    old: { code: 'AZ-204', name: 'Developing Solutions for Microsoft Azure', asOf: 'January 14, 2026', retired: '31 July 2026', domains: [
      ['Develop Azure compute solutions', '25–30%'],
      ['Develop for Azure storage', '15–20%'],
      ['Implement Azure security', '15–20%'],
      ['Monitor and troubleshoot Azure solutions', '5–10%'],
      ['Connect to and consume Azure services and third-party services', '20–25%'],
    ] },
    next: 'ai-200',
    title: 'AZ-204 vs AI-200: What Changed for Azure Developers | MSDEVBUILD',
    description: 'AZ-204 vs AI-200 side by side: domains, weights and topics. See what AI-200 adds (vector search, AKS, AI back ends), what it drops and what to study now.',
    h1: 'AZ-204 vs AI-200: what changed for Azure developers',
    answer: 'AI-200 (Azure AI Cloud Developer Associate) replaced AZ-204 on 31 July 2026. It keeps the developer core, containers, Functions, messaging, Key Vault and monitoring, and adds the data side of AI apps: Cosmos DB, PostgreSQL and Redis with vector search. API Management, Microsoft Graph and Blob Storage SDK work are no longer in the outline.',
    added: [
      'A data-for-AI domain worth 30–35%: embeddings and vector search in Azure Cosmos DB, PostgreSQL with pgvector and Azure Managed Redis.',
      'Container orchestration in more depth: Container Apps revisions, KEDA scaling and deploying to AKS with manifest files.',
      'Monitoring weighted far higher: secure, monitor and troubleshoot is 20–25%, up from 5–10% for monitoring in AZ-204.',
    ],
    dropped: [
      'Azure API Management (create instances, document APIs, policies).',
      'Microsoft Graph and Microsoft identity platform sign-in flows as separate objectives.',
      'Blob Storage SDK operations and lifecycle policies, Azure Event Hubs and Queue Storage.',
    ],
    same: [
      'Containers on App Service and Azure Container Registry.',
      'Azure Functions triggers and bindings, Service Bus and Event Grid.',
      'Key Vault, App Configuration and managed identities.',
      'Pass mark 700 on a 1–1000 scale.',
    ],
    verdict: 'Study AI-200. AZ-204 can no longer be booked, and about a third of AI-200 is vector data work that AZ-204 courses never covered.',
    faq: [
      { q: 'Is there an upgrade from AZ-204 to AI-200?', a: 'No. To hold Azure AI Cloud Developer Associate you pass AI-200. An AZ-204 certification earned before 31 July 2026 stays valid until it expires but can no longer be renewed.' },
      { q: 'Does AI-200 count for the DevOps Engineer Expert (AZ-400)?', a: 'Microsoft said AI-200 would be added as a prerequisite option for DevOps Engineer Expert once it is generally available. Check the AZ-400 certification page for the current list.' },
      { q: 'Do I need AI knowledge for AI-200?', a: 'You need to know what embeddings and vector search are for, but it’s a developer exam about the back end: data stores, containers, messaging, security and monitoring.' },
    ],
  },
];
