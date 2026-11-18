/**
 * AI-200 syllabus: the single source of truth for navigation, the syllabus
 * page, the mock exam's domain weights and objective coverage.
 *
 * Source: "Study guide for Exam AI-200: Developing AI Cloud Solutions on Azure",
 * skills measured as of October 7, 2026 (checked on Microsoft Learn 18 Nov 2026).
 * https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-200
 *
 * AI-200 replaced AZ-204 (retired 31 July 2026) and earns Microsoft Certified:
 * Azure AI Cloud Developer Associate. Candidates should be comfortable with
 * Python, Azure SDKs, containers, data services, messaging and monitoring.
 *
 * Weights: the study guide's change log says the data domain's share went up
 * on 7 October 2026 and its "skills at a glance" lists 30–35%, while one
 * heading still reads 25–30%. We use 30–35%, which also makes the midpoints
 * add up to 100. Re-check when Microsoft fixes the page.
 *
 * Objective ids are ours (domain.group.bullet), numbered in the order the
 * study guide lists the bullets. Whether a topic is published is derived from
 * the existence of src/content/tutorials/ai-200/<module>/<slug>.mdx.
 */

import type { ObjectiveGroup, SyllabusTopic, SyllabusModule, ExamFacts } from '../types';
export type { ObjectiveGroup, SyllabusTopic, SyllabusModule, ExamFacts };

export const SKILLS_MEASURED_AS_OF = 'October 7, 2026';
export const SYLLABUS_VERIFIED_ON = '2026-11-18';
export const STUDY_GUIDE_URL =
  'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-200';
export const EXAM_FACTS: ExamFacts = {
  passingScore: 700,
  scoreScale: '1–1000',
  durationMinutes: 100,
  practiceAssessmentUrl: 'http://aka.ms/AI200-PA',
};

export const MODULES: SyllabusModule[] = [
  {
    slug: 'containers',
    domain: 1,
    title: 'Develop containerized solutions on Azure',
    shortTitle: 'Containers',
    weight: '20–25%',
    weightMid: 22.5,
    summary:
      'Package an AI back end as a container image, build and version it in Azure Container Registry, then run it on App Service, Azure Container Apps (with revisions and KEDA scaling) or AKS, and fix it when it breaks.',
    groups: [
      {
        title: 'Implement container application hosting',
        objectives: [
          { id: '1.1.1', text: 'Build, store, version, and manage container images by using Azure Container Registry' },
          { id: '1.1.2', text: 'Build and run images by using Azure Container Registry Tasks' },
          { id: '1.1.3', text: 'Deploy containers to Azure App Service, including configuring App Service to supply environment variables and secrets' },
        ],
      },
      {
        title: 'Implement container-orchestrated solutions',
        objectives: [
          { id: '1.2.1', text: 'Deploy applications to Azure Container Apps, including environment configuration and revision management' },
          { id: '1.2.2', text: 'Implement event-driven scaling by using Kubernetes Event-driven Autoscaling (KEDA) in Container Apps' },
          { id: '1.2.3', text: 'Deploy and manage applications to Azure Kubernetes Service (AKS) by using manifest files' },
          { id: '1.2.4', text: 'Monitor and troubleshoot solutions on AKS and Container Apps by inspecting logs, events, and end-to-end connectivity' },
        ],
      },
    ],
    topics: [
      { slug: 'containers-for-ai-apps', title: 'Containers for AI Apps: App Service, Container Apps or AKS?', objectives: ['1.1.3', '1.2.1', '1.2.3'] },
      { slug: 'azure-container-registry', title: 'Azure Container Registry: Store, Tag and Manage Images', objectives: ['1.1.1'] },
      { slug: 'acr-tasks', title: 'Build and Run Images with ACR Tasks', objectives: ['1.1.2'] },
      { slug: 'app-service-containers', title: 'Run a Container on App Service with Settings and Secrets', objectives: ['1.1.3'] },
      { slug: 'azure-container-apps', title: 'Azure Container Apps: Environments and Revisions', objectives: ['1.2.1'] },
      { slug: 'keda-scaling', title: 'Event-Driven Scaling with KEDA in Container Apps', objectives: ['1.2.2'] },
      { slug: 'aks-manifests', title: 'Deploy to AKS with Manifest Files', objectives: ['1.2.3'] },
      { slug: 'troubleshoot-containers', title: 'Troubleshoot AKS and Container Apps: Logs, Events, Connectivity', objectives: ['1.2.4'] },
    ],
  },
  {
    slug: 'data-for-ai',
    domain: 2,
    title: 'Develop AI solutions by using Azure data management services',
    shortTitle: 'Data for AI',
    weight: '30–35%',
    weightMid: 32.5,
    summary:
      'Store app data and embeddings where your AI app can find them fast: Azure Cosmos DB for NoSQL (SDK queries, RUs, indexing, consistency, vector search, change feed), Azure Database for PostgreSQL with pgvector for RAG, and Azure Managed Redis for caching and vector search.',
    groups: [
      {
        title: 'Develop AI solutions by using Azure Cosmos DB for NoSQL',
        objectives: [
          { id: '2.1.1', text: 'Connect to Azure Cosmos DB for NoSQL by using the SDK and run queries' },
          { id: '2.1.2', text: 'Optimize query performance and Request Units (RUs) consumption by using indexing policies and consistency levels' },
          { id: '2.1.3', text: 'Store and retrieve embeddings and execute vector similarity search for semantic retrieval' },
          { id: '2.1.4', text: 'Implement a change feed processor to detect and handle new or updated items' },
        ],
      },
      {
        title: 'Develop AI solutions by using Azure Database for PostgreSQL',
        objectives: [
          { id: '2.2.1', text: 'Connect and query Azure Database for PostgreSQL by using SDKs' },
          { id: '2.2.2', text: 'Model schemas and implement indexing strategies, including designing tables and choosing appropriate data types' },
          { id: '2.2.3', text: 'Implement indexing strategies, including optimizing query latency and reducing pgvector compute overhead' },
          { id: '2.2.4', text: 'Configure compute, memory, and storage resources to support vector workloads' },
          { id: '2.2.5', text: 'Run vector similarity search, including storing embeddings, semantic retrieval, and implementing retrieval-augmented generation (RAG) patterns by using metadata filter' },
          { id: '2.2.6', text: 'Implement connection optimization to improve throughput and minimize latency' },
        ],
      },
      {
        title: 'Integrate Azure Managed Redis in AI solutions',
        objectives: [
          { id: '2.3.1', text: 'Implement Azure Managed Redis data operations, including caching, expiration, and invalidation' },
          { id: '2.3.2', text: 'Implement vector indexing to enable similarity search' },
        ],
      },
    ],
    topics: [
      { slug: 'embeddings-and-vector-search', title: 'Embeddings and Vector Search for Developers', objectives: ['2.1.3', '2.2.5', '2.3.2'] },
      { slug: 'cosmos-db-sdk-and-queries', title: 'Cosmos DB for NoSQL: Connect with the SDK and Query', objectives: ['2.1.1'] },
      { slug: 'cosmos-db-rus-indexing-consistency', title: 'Cosmos DB: RUs, Indexing Policies and Consistency Levels', objectives: ['2.1.2'] },
      { slug: 'cosmos-db-vector-search', title: 'Vector Search in Cosmos DB for NoSQL', objectives: ['2.1.3'] },
      { slug: 'cosmos-db-change-feed', title: 'Cosmos DB Change Feed Processor', objectives: ['2.1.4'] },
      { slug: 'postgresql-connect-and-query', title: 'Connect to and Query Azure Database for PostgreSQL', objectives: ['2.2.1'] },
      { slug: 'postgresql-schema-and-indexes', title: 'PostgreSQL Schemas, Data Types and Indexes', objectives: ['2.2.2', '2.2.3'] },
      { slug: 'pgvector-rag', title: 'pgvector Similarity Search and RAG with Metadata Filters', objectives: ['2.2.5', '2.2.3'] },
      { slug: 'postgresql-performance-for-vectors', title: 'Size and Tune PostgreSQL for Vector Workloads', objectives: ['2.2.4', '2.2.6'] },
      { slug: 'redis-caching', title: 'Azure Managed Redis: Caching, Expiration and Invalidation', objectives: ['2.3.1'] },
      { slug: 'redis-vector-search', title: 'Vector Search with Azure Managed Redis', objectives: ['2.3.2'] },
    ],
  },
  {
    slug: 'messaging-and-functions',
    domain: 3,
    title: 'Connect to and consume Azure services',
    shortTitle: 'Messaging & Functions',
    weight: '20–25%',
    weightMid: 22.5,
    summary:
      'Hand slow AI work to the back end with Azure Service Bus queues, topics and dead-letter queues, react to events with Azure Event Grid filters and retries, and build serverless APIs with Azure Functions triggers and bindings.',
    groups: [
      {
        title: 'Develop event- and message-based AI solutions',
        objectives: [
          { id: '3.1.1', text: 'Queue and process back-end operations by using Azure Service Bus, including dead-letter queue handling, messages, topics, and subscriptions' },
          { id: '3.1.2', text: 'Implement event-driven workflows by using Azure Event Grid, including filters, custom events, and retries' },
        ],
      },
      {
        title: 'Develop and implement Azure Functions',
        objectives: [
          { id: '3.2.1', text: 'Build serverless APIs, including implementing triggers and bindings' },
          { id: '3.2.2', text: 'Configure and deploy function apps' },
        ],
      },
    ],
    topics: [
      { slug: 'service-bus-queues', title: 'Azure Service Bus Queues: Send, Receive and Settle Messages', objectives: ['3.1.1'] },
      { slug: 'service-bus-topics-and-dead-letters', title: 'Service Bus Topics, Subscriptions and Dead-Letter Queues', objectives: ['3.1.1'] },
      { slug: 'event-grid', title: 'Azure Event Grid: Custom Events, Filters and Retries', objectives: ['3.1.2'] },
      { slug: 'functions-triggers-and-bindings', title: 'Azure Functions: Serverless APIs with Triggers and Bindings', objectives: ['3.2.1'] },
      { slug: 'deploy-function-apps', title: 'Configure and Deploy Function Apps', objectives: ['3.2.2'] },
    ],
  },
  {
    slug: 'secure-and-monitor',
    domain: 4,
    title: 'Secure, monitor, and troubleshoot Azure solutions',
    shortTitle: 'Secure & Monitor',
    weight: '20–25%',
    weightMid: 22.5,
    summary:
      'Keep keys out of code with Azure Key Vault and managed identities, move settings and feature flags into Azure App Configuration, trace requests across services with OpenTelemetry, and find problems with KQL.',
    groups: [
      {
        title: 'Implement secure Azure solutions',
        objectives: [
          { id: '4.1.1', text: 'Secure secrets by using Azure Key Vault, including rotation and retrieval' },
          { id: '4.1.2', text: 'Store and retrieve app configuration information by using Azure App Configuration' },
        ],
      },
      {
        title: 'Monitor and troubleshoot Azure solutions',
        objectives: [
          { id: '4.2.1', text: 'Trace distributed systems by using OpenTelemetry SDKs' },
          { id: '4.2.2', text: 'Write KQL queries to analyze logs and metrics' },
        ],
      },
    ],
    topics: [
      { slug: 'key-vault-secrets', title: 'Azure Key Vault: Retrieve and Rotate Secrets', objectives: ['4.1.1'] },
      { slug: 'app-configuration', title: 'Azure App Configuration: Settings and Feature Flags', objectives: ['4.1.2'] },
      { slug: 'opentelemetry-tracing', title: 'Distributed Tracing with OpenTelemetry', objectives: ['4.2.1'] },
      { slug: 'kql-logs-and-metrics', title: 'KQL Queries for Logs and Metrics', objectives: ['4.2.2'] },
    ],
  },
];

export const moduleBySlug = (slug: string) => MODULES.find((m) => m.slug === slug);
export const allObjectives = () => MODULES.flatMap((m) => m.groups.flatMap((g) => g.objectives));
export const objectiveText = (id: string) => allObjectives().find((o) => o.id === id)?.text ?? id;
