/**
 * AI-200 course details copy: the "understand before you start" page at /ai-200/.
 * Exam facts come from syllabus.ts; this file holds the course's own promise.
 */
import type { CourseInfo } from '../types';

export const COURSE: CourseInfo = {
  title: 'Microsoft AI-200: Azure AI Cloud Developer Associate',
  subtitle: 'Build the back end of AI apps on Azure: containers, Cosmos DB, PostgreSQL and Redis vector search, Service Bus, Event Grid, Functions, Key Vault and monitoring. No Azure account needed.',
  intro: [
    'AI-200 replaced AZ-204 in 2026 and earns the Microsoft Certified: Azure AI Cloud Developer Associate certification. It is a developer exam about the services behind an AI app: where the container runs, where the embeddings live, how slow work gets queued, and how you keep secrets safe and find problems.',
    'This course follows the official skills outline topic by topic. Every lesson starts with a 30-second answer, then lets you try the idea in an Azure portal walkthrough, a 3D scene and a practice lab in a simulated Azure and Cloud Shell. Python snippets show the SDK calls the exam expects, and a quiz closes each lesson.',
  ],
  audience: [
    { icon: '💻', title: 'Python and back-end developers', text: 'You build APIs and want to run AI features on Azure properly, from containers to vector search.' },
    { icon: '🔁', title: 'AZ-204 learners', text: 'You were preparing for AZ-204 before it retired and want the new path with the same developer focus.' },
    { icon: '🧠', title: 'AI-901 graduates', text: 'You can call a model. Now you want to build the data, messaging and hosting around it.' },
    { icon: '🛠️', title: 'DevOps and platform engineers', text: 'You run containers and pipelines and want to understand what developers need from AKS, Container Apps and monitoring.' },
  ],
  outcomes: [
    'Build, tag and manage images in Azure Container Registry, and build in the cloud with ACR Tasks',
    'Run containers on App Service with app settings and Key Vault references',
    'Deploy to Azure Container Apps, manage revisions and scale with KEDA rules',
    'Deploy to AKS with manifest files and troubleshoot with logs, events and connectivity checks',
    'Query Cosmos DB for NoSQL with the SDK and keep RU costs down with indexing and consistency choices',
    'Store embeddings and run vector search in Cosmos DB, PostgreSQL with pgvector and Azure Managed Redis',
    'Build a RAG retrieval step with metadata filters and react to new data with the change feed',
    'Queue work with Service Bus queues, topics and dead-letter queues, and route events with Event Grid',
    'Build serverless APIs with Azure Functions triggers and bindings, and deploy function apps',
    'Keep secrets in Key Vault and settings in App Configuration, then trace and query with OpenTelemetry and KQL',
  ],
  requirements: [
    'Comfortable Python: functions, classes, async basics, pip and virtual environments',
    'Basic containers (what an image and a Dockerfile are) and some SQL',
    'Azure basics help (resource groups, regions, identities). Our AZ-900 course covers them free',
    'No Azure subscription or credit card: every lab runs in a simulator in your browser',
  ],
  roadmap: [
    { title: 'Week 1: Containers', text: 'Container Registry and ACR Tasks, App Service containers, Container Apps revisions and KEDA, AKS manifests and troubleshooting.' },
    { title: 'Week 2: Cosmos DB and vectors', text: 'Embeddings, the Cosmos DB SDK, RUs, indexing, consistency, vector search and the change feed processor.' },
    { title: 'Week 3: PostgreSQL and Redis', text: 'Connect from Python, schemas and indexes, pgvector RAG with filters, tuning for vectors, then Redis caching and vector search.' },
    { title: 'Week 4: Messaging, Functions, security and monitoring', text: 'Service Bus, Event Grid, Functions triggers and bindings, Key Vault, App Configuration, OpenTelemetry and KQL.' },
    { title: 'Exam week: Mock exams and revision', text: 'Take full mock exams until you score 80% or more twice, read the cheat sheet and the exam day guide, then book.' },
  ],
  faq: [
    { q: 'What happened to AZ-204?', a: 'Microsoft retired AZ-204 on 31 July 2026. AI-200 replaces it with the Azure AI Cloud Developer Associate certification, which keeps the developer focus and adds vector databases and AI back-end patterns.' },
    { q: 'Is this AI-200 course free?', a: 'Yes. Every lesson, simulation, lab, quiz, mock exam and the practice certificate is free. Signing in is optional and only syncs your progress.' },
    { q: 'How much Python do I need?', a: 'Enough to read and complete short snippets that use the Azure SDKs: azure-cosmos, psycopg, redis, azure-servicebus, azure-functions, azure-keyvault-secrets and the Azure Monitor OpenTelemetry Distro. The labs walk you through each one.' },
    { q: 'Do I need an Azure account?', a: 'No. The portal walkthroughs, 3D scenes and Cloud Shell are simulations in your browser, so there is no bill and no sign-up.' },
    { q: 'Are these real AI-200 exam questions?', a: 'No. Every question here is original and written to practise the skills in the official outline. We never publish real, recalled or leaked exam questions.' },
    { q: 'Is the practice certificate a Microsoft certification?', a: 'No. It is an MSDEVBUILD practice certificate that shows you passed our mock exam. To become Microsoft certified you sit AI-200 with Microsoft.' },
  ],
  hubs: {
    compare: 'AI-200 comparisons: App Service vs Container Apps vs AKS, Cosmos DB vs PostgreSQL vs Redis for vectors, Service Bus vs Event Grid, Key Vault vs App Config.',
    games: 'Learn AI-200 the fun way: sort container hosts, data stores and messaging services, Who Am I riddles and a daily challenge, with XP.',
    servicesTitle: 'Azure Developer Services Reference for AI Apps',
    services: 'Every AI-200 service in 60 seconds: Container Registry, Container Apps, AKS, Cosmos DB, PostgreSQL, Redis, Service Bus, Event Grid, Functions, Key Vault and more.',
    sandboxTitle: 'AI-200 Sandbox: Free Azure Developer Simulator | MSDEVBUILD',
    whoAmI: 'Who Am I? Guess the Azure Developer Service Game | MSDEVBUILD',
  },
  labs: {
    title: 'AI-200 Practice Labs: Free Azure Developer Simulator | MSDEVBUILD',
    description: 'Free AI-200 hands-on labs: build images, deploy Container Apps, query Cosmos DB, run pgvector RAG, queue with Service Bus and trace with KQL. No account.',
    h1: 'AI-200 Practice Labs',
    intro: 'A safe, simulated Azure and Cloud Shell in your browser. Build and push images, roll out revisions, query Cosmos DB, search vectors in PostgreSQL and Redis, queue work in Service Bus and query logs with KQL.',
    shell: [
      ['az acr build -r contosoacr -t ragapi:1.0.0 .', 'Run ID: ca1 was successful after 41s'],
      ['az containerapp revision list -n ragapi -g rg-dev -o table', 'ragapi--v1  Active  80%   ragapi--v2  Active  20%'],
    ],
  },
};
