/**
 * AI-103 syllabus: the single source of truth for navigation, the syllabus
 * page, the mock exam's domain weights and objective coverage.
 *
 * Source: "Study guide for Exam AI-103: Developing AI Apps and Agents on
 * Azure", skills measured as of April 16, 2026 (checked on Microsoft Learn
 * 25 Nov 2026).
 * https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-103
 *
 * Earns Microsoft Certified: Azure AI Apps and Agents Developer Associate.
 * AI-103 replaced AI-102 (retired 30 June 2026). Candidates build with
 * Python and Microsoft Foundry.
 *
 * Objective ids are ours (domain.group.bullet), numbered in the order the
 * study guide lists the bullets. A topic is published when
 * src/content/tutorials/ai-103/<module>/<slug>.mdx exists. Lesson slugs must
 * not repeat any other exam's slugs (labsForTopic looks up by slug).
 */
import type { ObjectiveGroup, SyllabusTopic, SyllabusModule, ExamFacts } from '../types';
export type { ObjectiveGroup, SyllabusTopic, SyllabusModule, ExamFacts };

export const SKILLS_MEASURED_AS_OF = 'April 16, 2026';
export const SYLLABUS_VERIFIED_ON = '2026-11-25';
export const STUDY_GUIDE_URL = 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-103';
export const EXAM_FACTS: ExamFacts = { passingScore: 700, scoreScale: '1–1000', durationMinutes: 100, practiceAssessmentUrl: 'http://aka.ms/AI103-PA' };

const o = (id: string, text: string) => ({ id, text });

export const MODULES: SyllabusModule[] = [
  {
    slug: 'plan-and-manage', domain: 1, title: 'Plan and manage an Azure AI solution', shortTitle: 'Plan & Manage', weight: '25–30%', weightMid: 27.5,
    summary: 'Pick the right Foundry models and services, set up projects and deployments with CI/CD, keep quotas, costs, monitoring and security under control, and build responsible AI into every app and agent.',
    groups: [
      { title: 'Choose the appropriate Foundry services for generative AI and agents', objectives: [
        o('1.1.1', 'Choose an appropriate model for each task, including LLMs, small language models, multimodal models and Foundry Tools'),
        o('1.1.2', 'Choose the appropriate Foundry services for generative tasks, grounding, vector search, agent workflows or multimodal processing'),
        o('1.1.3', 'Choose an appropriate method for retrieval and indexing'),
        o('1.1.4', 'Choose appropriate memory, tool and knowledge integration services for agent solutions'),
      ] },
      { title: 'Set up AI solutions in Foundry', objectives: [
        o('1.2.1', 'Design Azure infrastructure for AI apps and agent-based solutions'),
        o('1.2.2', 'Choose appropriate deployment options'),
        o('1.2.3', 'Configure model and agent deployments'),
        o('1.2.4', 'Integrate Foundry projects with CI/CD pipelines'),
      ] },
      { title: 'Manage, monitor and secure AI systems', objectives: [
        o('1.3.1', 'Manage quotas, scaling, rate limits and cost footprints for model and agent workloads'),
        o('1.3.2', 'Monitor model performance, drift, safety events and grounding quality'),
        o('1.3.3', 'Monitor data ingestion quality, search index health and relevance performance'),
        o('1.3.4', 'Configure security, including managed identity, private networking, keyless credentials and role policies'),
      ] },
      { title: 'Implement responsible AI across generative AI and agentic systems', objectives: [
        o('1.4.1', 'Configure safety filters, guardrails, risk detection and content moderation'),
        o('1.4.2', 'Apply responsible AI instrumentation, including evaluators, safety evaluations and explanation tooling'),
        o('1.4.3', 'Implement auditing through trace logging, provenance metadata and approval workflows'),
        o('1.4.4', 'Govern agent behavior with oversight modes, constraints and tool-access controls'),
      ] },
    ],
    topics: [
      { slug: 'choose-models-and-foundry-tools', title: 'Choose Models and Foundry Services for the Task', objectives: ['1.1.1', '1.1.2'] },
      { slug: 'retrieval-indexing-and-agent-memory', title: 'Retrieval, Indexing and Agent Memory Choices', objectives: ['1.1.3', '1.1.4'] },
      { slug: 'foundry-infrastructure-and-deployment-options', title: 'Foundry Infrastructure and Deployment Options', objectives: ['1.2.1', '1.2.2'] },
      { slug: 'configure-model-and-agent-deployments', title: 'Configure Model and Agent Deployments', objectives: ['1.2.3'] },
      { slug: 'foundry-cicd-pipelines', title: 'CI/CD for Foundry Projects', objectives: ['1.2.4'] },
      { slug: 'quotas-rate-limits-and-cost', title: 'Quotas, Rate Limits, Scaling and Cost', objectives: ['1.3.1'] },
      { slug: 'monitor-models-agents-and-search', title: 'Monitor Models, Agents and Search Indexes', objectives: ['1.3.2', '1.3.3'] },
      { slug: 'secure-foundry-identity-and-networking', title: 'Secure Foundry: Managed Identity, Keyless Auth and Private Networking', objectives: ['1.3.4'] },
      { slug: 'content-safety-filters-and-guardrails', title: 'Content Filters, Guardrails and Risk Detection', objectives: ['1.4.1'] },
      { slug: 'responsible-ai-evaluations-and-auditing', title: 'Safety Evaluations, Tracing and Auditing', objectives: ['1.4.2', '1.4.3'] },
      { slug: 'govern-agent-behavior', title: 'Govern Agent Behavior: Oversight, Constraints and Tool Access', objectives: ['1.4.4'] },
    ],
  },
  {
    slug: 'generative-ai-and-agents', domain: 2, title: 'Implement generative AI and agentic solutions', shortTitle: 'GenAI & Agents', weight: '30–35%', weightMid: 32.5,
    summary: 'Deploy and call models, ground them with RAG, build tool-using agents and multi-agent workflows with approvals, then tune, trace and evaluate everything in production.',
    groups: [
      { title: 'Build generative applications by using Foundry', objectives: [
        o('2.1.1', 'Deploy and consume LLMs, small models, code models and multimodal models'),
        o('2.1.2', 'Implement retrieval-augmented generation (RAG) in an application'),
        o('2.1.3', 'Design workflows, tool-augmented flows and multistep reasoning pipelines'),
        o('2.1.4', 'Evaluate models and apps, including detecting fabrications, relevance, quality and safety'),
        o('2.1.5', 'Integrate generative workflows into applications by using Foundry SDKs and connectors'),
        o('2.1.6', 'Configure an application to connect to a Foundry project'),
      ] },
      { title: 'Build agents by using Foundry', objectives: [
        o('2.2.1', 'Define agent roles, goals, conversation-tracking approach and tool schemas'),
        o('2.2.2', 'Build agents that integrate retrieval, function calling and conversation memory'),
        o('2.2.3', 'Integrate agent tools, including APIs, knowledge stores, search, content understanding and custom functions'),
        o('2.2.4', 'Implement orchestrated multi-agent solutions'),
        o('2.2.5', 'Build autonomous or semiautonomous workflows with safeguards and approval flow controls'),
        o('2.2.6', 'Integrate monitoring into deployed agents, evaluate agent behavior and perform error analysis'),
      ] },
      { title: 'Optimize and operationalize generative AI systems', objectives: [
        o('2.3.1', 'Tune generation behavior, such as prompt engineering and adjusting model parameters'),
        o('2.3.2', 'Implement model reflection, chain-of-thought evaluations and self-critique loops'),
        o('2.3.3', 'Set up observability by implementing tracing, token analytics, safety signals and latency breakdowns'),
        o('2.3.4', 'Orchestrate multiple models, flows, or hybrid LLM and rules engines'),
      ] },
    ],
    topics: [
      { slug: 'deploy-and-consume-models', title: 'Deploy and Call Models from Your App', objectives: ['2.1.1', '2.1.6'] },
      { slug: 'rag-in-an-application', title: 'Retrieval-Augmented Generation (RAG) in an App', objectives: ['2.1.2'] },
      { slug: 'workflows-and-tool-augmented-flows', title: 'Workflows, Tool-Augmented Flows and Multistep Reasoning', objectives: ['2.1.3'] },
      { slug: 'evaluate-models-and-apps', title: 'Evaluate Models and Apps: Groundedness, Relevance and Safety', objectives: ['2.1.4'] },
      { slug: 'foundry-sdks-and-connectors', title: 'Foundry SDKs and Connectors', objectives: ['2.1.5'] },
      { slug: 'design-agents-roles-goals-and-tools', title: 'Design an Agent: Role, Goals, Threads and Tool Schemas', objectives: ['2.2.1'] },
      { slug: 'agents-with-retrieval-functions-and-memory', title: 'Agents with Retrieval, Function Calling and Memory', objectives: ['2.2.2', '2.2.3'] },
      { slug: 'multi-agent-orchestration', title: 'Multi-Agent Orchestration', objectives: ['2.2.4'] },
      { slug: 'autonomous-workflows-with-approvals', title: 'Autonomous Agents with Safeguards and Approvals', objectives: ['2.2.5'] },
      { slug: 'monitor-and-evaluate-agents', title: 'Monitor, Evaluate and Debug Agents', objectives: ['2.2.6'] },
      { slug: 'prompt-engineering-and-parameters', title: 'Prompt Engineering, Parameters and Self-Critique', objectives: ['2.3.1', '2.3.2'] },
      { slug: 'tracing-and-token-analytics', title: 'Tracing, Token Analytics and Latency', objectives: ['2.3.3'] },
      { slug: 'orchestrate-multiple-models', title: 'Orchestrate Multiple Models and Rules Engines', objectives: ['2.3.4'] },
    ],
  },
  {
    slug: 'computer-vision', domain: 3, title: 'Implement computer vision solutions', shortTitle: 'Computer Vision', weight: '10–15%', weightMid: 12.5,
    summary: 'Generate and edit images and video, understand pictures and video with multimodal models and Content Understanding, and keep visual content safe.',
    groups: [
      { title: 'Design and implement image- and video-generation solutions', objectives: [
        o('3.1.1', 'Implement a solution that generates images from text prompts and reference media'),
        o('3.1.2', 'Implement a solution that generates videos from text prompts and reference media'),
        o('3.1.3', 'Configure image-editing workflows, including inpainting, mask-based edits and prompt-driven modifications'),
        o('3.1.4', 'Implement workflows to edit generated videos'),
        o('3.1.5', 'Select and apply appropriate generation and editing controls provided by the platform'),
      ] },
      { title: 'Design and implement multimodal understanding workflows', objectives: [
        o('3.2.1', 'Build a solution that analyzes visual context by using multimodal models'),
        o('3.2.2', 'Configure apps to produce concise or detailed captions for single or multiple images'),
        o('3.2.3', 'Implement question answering grounded in visual evidence'),
        o('3.2.4', 'Configure generation of alt text and extended image descriptions aligned to accessibility guidelines'),
        o('3.2.5', 'Implement visual understanding by configuring Azure Content Understanding in Foundry Tools'),
        o('3.2.6', 'Implement video analysis workflows to process and interpret video segments'),
        o('3.2.7', 'Configure single-task and pro-mode Content Understanding pipelines'),
        o('3.2.8', 'Implement solutions that identify objects, components or regions within images or video'),
      ] },
      { title: 'Implement responsible AI for multimodal content', objectives: [
        o('3.3.1', 'Implement filters to classify unsafe or disallowed visual content'),
        o('3.3.2', 'Detect and mitigate indirect prompt injection by using embedded text in images'),
        o('3.3.3', 'Enforce visual policy rules, such as watermarks, prohibited symbols, brand usage and inappropriate content'),
      ] },
    ],
    topics: [
      { slug: 'image-generation-and-editing', title: 'Generate and Edit Images', objectives: ['3.1.1', '3.1.3', '3.1.5'] },
      { slug: 'video-generation-and-editing', title: 'Generate and Edit Video', objectives: ['3.1.2', '3.1.4'] },
      { slug: 'multimodal-image-understanding', title: 'Multimodal Image Understanding: Captions, Alt Text and Visual Q&A', objectives: ['3.2.1', '3.2.2', '3.2.3', '3.2.4'] },
      { slug: 'content-understanding-for-images-and-video', title: 'Content Understanding for Images and Video', objectives: ['3.2.5', '3.2.6', '3.2.7', '3.2.8'] },
      { slug: 'responsible-ai-for-visual-content', title: 'Responsible AI for Images and Video', objectives: ['3.3.1', '3.3.2', '3.3.3'] },
    ],
  },
  {
    slug: 'text-analysis', domain: 4, title: 'Implement text analysis solutions', shortTitle: 'Text & Speech', weight: '10–15%', weightMid: 12.5,
    summary: 'Pull entities, summaries and JSON out of text, detect sentiment and sensitive content, translate, and give agents a voice with speech.',
    groups: [
      { title: 'Apply language model text analysis', objectives: [
        o('4.1.1', 'Extract entities, topics, summaries and structured JSON outputs by using generative prompting and Foundry Tools'),
        o('4.1.2', 'Configure detection of sentiment, tone, safety issues and sensitive content'),
        o('4.1.3', 'Translate text by using Azure Translator in Foundry Tools or LLM-powered translation flows'),
        o('4.1.4', 'Customize language model outputs for domain tasks, such as compliance summarization and domain extraction'),
      ] },
      { title: 'Implement speech solutions', objectives: [
        o('4.2.1', 'Implement workflows to convert speech to text and text to speech for agentic interactions'),
        o('4.2.2', 'Integrate speech as an agent modality, including custom speech models'),
        o('4.2.3', 'Enable multimodal reasoning from audio inputs'),
        o('4.2.4', 'Translate speech into other languages by using language models and Foundry Tools'),
      ] },
    ],
    topics: [
      { slug: 'extract-entities-summaries-and-json', title: 'Extract Entities, Summaries and Structured JSON', objectives: ['4.1.1', '4.1.4'] },
      { slug: 'sentiment-safety-and-sensitive-content', title: 'Sentiment, Tone and Sensitive Content Detection', objectives: ['4.1.2'] },
      { slug: 'translate-text-with-foundry', title: 'Translate Text with Translator or a Language Model', objectives: ['4.1.3'] },
      { slug: 'speech-to-text-and-text-to-speech', title: 'Speech to Text and Text to Speech for Agents', objectives: ['4.2.1', '4.2.2'] },
      { slug: 'speech-translation-and-audio-reasoning', title: 'Speech Translation and Reasoning over Audio', objectives: ['4.2.3', '4.2.4'] },
    ],
  },
  {
    slug: 'information-extraction', domain: 5, title: 'Implement information extraction solutions', shortTitle: 'Information Extraction', weight: '10–15%', weightMid: 12.5,
    summary: 'Ingest and index documents and media, search them with semantic, hybrid and vector queries, enrich them with skills, and turn documents into clean, grounded data with Content Understanding.',
    groups: [
      { title: 'Build retrieval and grounding pipelines', objectives: [
        o('5.1.1', 'Ingest and index content, such as documents, images, audio and video'),
        o('5.1.2', 'Configure semantic search, hybrid search and vector search for grounding'),
        o('5.1.3', 'Implement enrichment by using custom or built-in skills for text, images and layout'),
        o('5.1.4', 'Configure RAG ingestion flow, including documents and OCR'),
        o('5.1.5', 'Connect retrieval pipelines directly to workflows and agent tools'),
      ] },
      { title: 'Extract content from documents', objectives: [
        o('5.2.1', 'Extract information by using multimodal pipelines that combine OCR, layout analysis and field extraction'),
        o('5.2.2', 'Produce clean, grounded representations for agents and RAG by using Content Understanding'),
        o('5.2.3', 'Implement analyzers that generate structured or markdown outputs for downstream reasoning'),
      ] },
    ],
    topics: [
      { slug: 'ingest-and-index-content', title: 'Ingest and Index Content for RAG', objectives: ['5.1.1', '5.1.4'] },
      { slug: 'semantic-hybrid-and-vector-search', title: 'Semantic, Hybrid and Vector Search', objectives: ['5.1.2'] },
      { slug: 'search-enrichment-skills', title: 'Enrich Content with Built-in and Custom Skills', objectives: ['5.1.3'] },
      { slug: 'connect-retrieval-to-agents', title: 'Connect Retrieval Pipelines to Agents and Workflows', objectives: ['5.1.5'] },
      { slug: 'content-understanding-document-extraction', title: 'Extract Documents with Content Understanding', objectives: ['5.2.1', '5.2.2', '5.2.3'] },
    ],
  },
];
