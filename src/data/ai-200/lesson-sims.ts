/**
 * Simulations shown in each AI-200 lesson's "Simulations" section
 * (Azure Portal | 3D View | Practice Lab). Tours are Azure portal
 * walkthroughs from ./portal-tours.ts; 3D modes come from ./sims3d.ts;
 * Practice Labs are the AI-200 labs in src/lib/sim/labs-dev.ts.
 */
import type { LessonSims } from '../az-900/lesson-sims';

export const LESSON_SIMS: Record<string, LessonSims> = {
  /* Domain 1: Containers */
  'containers-for-ai-apps': { d3: { mode: 'containers', start: 0, intro: 'One image, three places to run it. Follow it from the registry.' }, tour: { id: 'container-hosting-choice', intro: 'Compare App Service, Container Apps and AKS in the create flow.' } },
  'azure-container-registry': { d3: { mode: 'containers', start: 0, intro: 'Push a version, then see why :latest bites in production.' }, tour: { id: 'acr-create-push', intro: 'Create a registry, then look at repositories, tags and digests.' } },
  'acr-tasks': { d3: { mode: 'containers', start: 1, intro: 'Build in the cloud, then patch the base image.' }, tour: { id: 'acr-tasks', intro: 'Run a quick build and set up a task that triggers on commits.' } },
  'app-service-containers': { d3: { mode: 'containers', start: 2, intro: 'Add a setting, then make it a Key Vault reference.' }, tour: { id: 'app-service-container', intro: 'Create a web app from an ACR image and add environment variables.' } },
  'azure-container-apps': { d3: { mode: 'containers', start: 4, intro: 'Deploy a new revision and split the traffic.' }, tour: { id: 'container-app-revisions', intro: 'Create a container app, then manage revisions and traffic.' } },
  'keda-scaling': { d3: { mode: 'containers', start: 5, intro: 'Flood the queue and watch replicas appear.' }, tour: { id: 'container-app-scale', intro: 'Add a Service Bus scale rule with min and max replicas.' } },
  'aks-manifests': { d3: { mode: 'containers', start: 6, intro: 'Apply the manifest, then kill a pod.' }, tour: { id: 'aks-workloads', intro: 'Apply a Deployment and a Service from YAML.' } },
  'troubleshoot-containers': { d3: { mode: 'containers', start: 7, intro: 'Three broken apps. Find what’s wrong with each.' }, tour: { id: 'container-troubleshoot', intro: 'Read the log stream, the events and the diagnostics.' } },

  /* Domain 2: Data for AI */
  'embeddings-and-vector-search': { d3: { mode: 'vectordata', start: 0, intro: 'Turn a question into numbers and find its neighbours.' }, tour: { id: 'cosmos-vector', intro: 'Define a vector policy and a vector index on a new container.' } },
  'cosmos-db-sdk-and-queries': { d3: { mode: 'vectordata', start: 1, intro: 'A point read versus a query that fans out.' }, tour: { id: 'cosmos-create', intro: 'Create an account, a database and a container with a partition key.' } },
  'cosmos-db-rus-indexing-consistency': { d3: { mode: 'vectordata', start: 2, intro: 'Trim the index, then try Strong consistency.' }, tour: { id: 'cosmos-indexing', intro: 'Check the RU charge, edit the indexing policy and set consistency.' } },
  'cosmos-db-vector-search': { d3: { mode: 'vectordata', start: 3, intro: 'Ask for the three closest items.' }, tour: { id: 'cosmos-vector', intro: 'Add a vector policy and index, then run VectorDistance.' } },
  'cosmos-db-change-feed': { d3: { mode: 'vectordata', start: 4, intro: 'Save a product and watch the processor pick it up.' }, tour: { id: 'cosmos-change-feed', intro: 'Wire a change feed trigger with a lease container.' } },
  'postgresql-connect-and-query': { d3: { mode: 'vectordata', start: 5, intro: 'The database your Python app will talk to.' }, tour: { id: 'postgres-create', intro: 'Create a flexible server with Microsoft Entra authentication.' } },
  'postgresql-schema-and-indexes': { d3: { mode: 'vectordata', start: 5, intro: 'Search without an index, then add one.' }, tour: { id: 'postgres-extensions', intro: 'Allow pgvector, then create the table and indexes.' } },
  'pgvector-rag': { d3: { mode: 'vectordata', start: 6, intro: 'Retrieve, filter, then answer.' }, tour: { id: 'postgres-extensions', intro: 'Enable pgvector and run a similarity query.' } },
  'postgresql-performance-for-vectors': { d3: { mode: 'vectordata', start: 5, intro: 'Same search, with and without an index.' }, tour: { id: 'postgres-scale', intro: 'Size compute and storage, then turn on PgBouncer.' } },
  'redis-caching': { d3: { mode: 'vectordata', start: 7, intro: 'Miss, hit, then invalidate.' }, tour: { id: 'redis-create', intro: 'Create Azure Managed Redis and try commands in the console.' } },
  'redis-vector-search': { d3: { mode: 'vectordata', start: 7, intro: 'A cache that understands similar questions.' }, tour: { id: 'redis-create', intro: 'Create a cache with the RediSearch module for vector indexes.' } },

  /* Domain 3: Messaging and Functions */
  'service-bus-queues': { d3: { mode: 'messaging', start: 1, intro: 'Complete one message, abandon another.' }, tour: { id: 'service-bus-queue', intro: 'Create a namespace and a queue, then send and peek messages.' } },
  'service-bus-topics-and-dead-letters': { d3: { mode: 'messaging', start: 2, intro: 'Send a poison message, then publish to a topic.' }, tour: { id: 'service-bus-topic', intro: 'Add a topic, subscriptions with filters, and read the dead-letter queue.' } },
  'event-grid': { d3: { mode: 'messaging', start: 4, intro: 'Create a .pdf and a .tmp file. Only one gets through.' }, tour: { id: 'event-grid-topic', intro: 'Create a custom topic and an event subscription with filters and retries.' } },
  'functions-triggers-and-bindings': { d3: { mode: 'messaging', start: 6, intro: 'Call the API and follow the output binding.' }, tour: { id: 'function-create', intro: 'Create a function app and an HTTP-triggered function.' } },
  'deploy-function-apps': { d3: { mode: 'messaging', start: 7, intro: 'A burst of messages, then quiet.' }, tour: { id: 'function-deploy', intro: 'Set app settings and deploy a package.' } },

  /* Domain 4: Secure and monitor */
  'key-vault-secrets': { d3: { mode: 'observe', start: 0, intro: 'Leak a key, then do it properly.' }, tour: { id: 'key-vault-secret', intro: 'Create a secret, look at its versions and set an expiry date.' } },
  'app-configuration': { d3: { mode: 'observe', start: 2, intro: 'Flip a feature flag with no redeploy.' }, tour: { id: 'app-config', intro: 'Add key-values with labels and a feature flag.' } },
  'opentelemetry-tracing': { d3: { mode: 'observe', start: 3, intro: 'Follow one request through every service.' }, tour: { id: 'app-insights-trace', intro: 'Open the application map and an end-to-end transaction.' } },
  'kql-logs-and-metrics': { d3: { mode: 'observe', start: 6, intro: 'Chart the failures, then alert on them.' }, tour: { id: 'log-analytics-kql', intro: 'Run KQL in Logs and turn it into an alert.' } },
};
