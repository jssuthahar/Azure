/**
 * AI-103 course details copy: the "understand before you start" page at /ai-103/.
 * Exam facts come from syllabus.ts; this file holds the course's own promise.
 */
import type { CourseInfo } from '../types';

export const COURSE: CourseInfo = {
  title: 'Microsoft AI-103: Azure AI Apps and Agents Developer Associate',
  subtitle: 'Build, deploy and govern AI apps and agents with Microsoft Foundry and Python: models, RAG, agents, vision, text and speech, and information extraction. No Azure account needed.',
  intro: [
    'AI-103 (Developing AI Apps and Agents on Azure) replaced AI-102 on 30 June 2026 and earns the Microsoft Certified: Azure AI Apps and Agents Developer Associate certification. It is for developers who build with Microsoft Foundry: you pick models and services, deploy them, ground them on data, build agents with tools and approvals, and keep everything safe, monitored and affordable.',
    'This course follows the official skills outline (as of April 16, 2026) topic by topic. Every lesson starts with a 30-second answer, then lets you try the idea in a Foundry portal walkthrough, a 3D scene and a practice lab with a simulated Foundry and Cloud Shell. A quiz closes each lesson.',
  ],
  audience: [
    { icon: '💻', title: 'Python developers', text: 'You write Python and want to ship apps that call models, search and agents with the Foundry SDK.' },
    { icon: '🔁', title: 'AI-102 candidates', text: 'You studied the retired AI-102 and need the new agent-first, Foundry-based skills outline.' },
    { icon: '🎓', title: 'AI-901 graduates', text: 'You passed the fundamentals and want the associate-level badge for building and managing AI solutions.' },
    { icon: '🛠️', title: 'Cloud and DevOps engineers', text: 'You run Azure and now own deployments, quotas, CI/CD, security and monitoring for AI workloads.' },
  ],
  outcomes: [
    'Choose the right model or Foundry Tool for a task, and the right Foundry service for grounding and agents',
    'Plan retrieval, indexing and agent memory on Azure AI Search and Foundry IQ',
    'Design Foundry resources and projects, and pick Global, Data Zone, Standard, Provisioned or Batch deployments',
    'Configure model and agent deployments, versions and rollbacks, and release them through CI/CD with evaluation gates',
    'Manage quotas, rate limits, scaling and cost, and monitor models, agents and search indexes',
    'Secure Foundry with managed identity, keyless access and private networking',
    'Apply guardrails, evaluators, red teaming, tracing and approvals, and govern agent behavior',
    'Build generative apps with RAG, tools, multi-agent workflows and human approvals',
    'Implement computer vision, text analysis, speech and information extraction solutions',
  ],
  requirements: [
    'Python at a working level: functions, packages, virtual environments and reading SDK samples',
    'Basic Azure knowledge helps (resource groups, regions, RBAC). Our AZ-900 course covers it free',
    'AI-901 is a good warm-up for Foundry, but not required',
    'No Azure subscription or credit card: every lab runs in a simulator in your browser',
  ],
  roadmap: [
    { title: 'Week 1: Plan and manage', text: 'Models and Foundry Tools, retrieval and memory, infrastructure and deployment types, deployments and versions, CI/CD, quotas and cost.' },
    { title: 'Week 2: Secure, monitor, govern', text: 'Monitoring and drift, managed identity and private networking, guardrails, evaluations, red teaming, tracing and agent governance.' },
    { title: 'Week 3: Generative AI and agents', text: 'Deploy and consume models, build RAG, tools and workflows, create agents and multi-agent flows, tune, trace and evaluate.' },
    { title: 'Week 4: Vision and text', text: 'Image analysis, OCR and generation, then Azure Language, structured output, translation, and speech with audio models.' },
    { title: 'Week 5: Information extraction', text: 'Content Understanding analyzers, search with semantic, hybrid and vector queries, and knowledge mining pipelines.' },
    { title: 'Exam week: Mock exams and revision', text: 'Take full mock exams until you score 80% or more twice, read the cheat sheet and the exam day guide, then book.' },
  ],
  faq: [
    { q: 'What happened to AI-102?', a: 'Microsoft retired AI-102 on 30 June 2026. AI-103 replaces it and earns the Azure AI Apps and Agents Developer Associate certification, with a focus on Foundry, agents and Python.' },
    { q: 'Is this AI-103 course free?', a: 'Yes. Every lesson, simulation, lab, quiz, mock exam and the practice certificate is free. Signing in is optional and only syncs your progress.' },
    { q: 'Do I need AI-901 first?', a: 'No. AI-901 is a fundamentals exam and not a prerequisite, though its Foundry basics make this course easier.' },
    { q: 'Do I need an Azure account?', a: 'No. The portal walkthroughs, 3D scenes and Cloud Shell are simulations in your browser, so there is no bill and no sign-up.' },
    { q: 'Are these real AI-103 exam questions?', a: 'No. Every question here is original and written to practise the skills in the official outline. We never publish real, recalled or leaked exam questions.' },
    { q: 'Is the practice certificate a Microsoft certification?', a: 'No. It is an MSDEVBUILD practice certificate that shows you passed our mock exam. To become Microsoft certified you sit AI-103 with Microsoft.' },
  ],
  hubs: {
    compare: 'AI-103 comparisons: reasoning vs small models, Global vs Data Zone deployments, hybrid vs vector search, memory vs knowledge, guardrails vs approvals.',
    games: 'Learn AI-103 the fun way: sort models, deployment types and guardrail controls, Who Am I riddles and a daily challenge, with XP.',
    servicesTitle: 'Azure AI Apps and Agents Services Reference',
    services: 'Every AI-103 service in 60 seconds: Foundry, Agent Service, Foundry IQ, Azure AI Search, Content Understanding, Speech, Language, Vision and Content Safety.',
    sandboxTitle: 'AI-103 Sandbox: Free Foundry and Azure Simulator | MSDEVBUILD',
    whoAmI: 'Who Am I? AI-103 Azure AI Service Game | MSDEVBUILD',
  },
  labs: {
    title: 'AI-103 Practice Labs: Free Foundry Simulator | MSDEVBUILD',
    description: 'Free AI-103 hands-on labs: deploy models, set quotas, secure Foundry, add guardrails, run evaluations and govern agents in a simulated Foundry. No account.',
    h1: 'AI-103 Practice Labs',
    intro: 'A safe, simulated Microsoft Foundry and Cloud Shell in your browser. Deploy models, pin versions, send traffic until you hit a 429, lock down access, build guardrails and approve an agent action.',
    shell: [
      ['az cognitiveservices account deployment create -n contoso-ai -g rg-agents --deployment-name gpt-4.1-mini --model-name gpt-4.1-mini --sku-name DataZoneStandard --sku-capacity 10', '"sku": { "name": "DataZoneStandard", "capacity": 10 }'],
      ['python load_test.py --rps 5', 'HTTP 429 Too Many Requests (retry-after: 20)'],
    ],
  },
};
