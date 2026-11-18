/**
 * AI-200 content for the Play & Learn games. Every item matches what the lessons teach.
 */
import type { SortSet, Riddle } from '../az-900/games';

export const SORT_SETS: SortSet[] = [
  {
    id: 'container-hosts', title: 'Where should it run?', icon: '🧊', intro: 'Pick the container host for each need.', topic: 'containers-for-ai-apps',
    buckets: ['App Service', 'Container Apps', 'AKS'],
    items: [
      { text: 'One containerised web API that needs deployment slots', bucket: 0, why: 'App Service runs a single container with slots.' },
      { text: 'Supply settings to the container as environment variables', bucket: 0, why: 'App settings become env vars.' },
      { text: 'A queue worker that should scale to zero at night', bucket: 1, why: 'KEDA rules in Container Apps scale to zero.' },
      { text: 'Send 20% of traffic to a new revision', bucket: 1, why: 'Revisions with traffic splitting.' },
      { text: 'Apply a Deployment and a Service with kubectl', bucket: 2, why: 'Manifests are how you deploy to AKS.' },
      { text: 'A GPU node pool for self-hosted models', bucket: 2, why: 'AKS gives you node pool control.' },
    ],
  },
  {
    id: 'vector-stores', title: 'Pick the data store', icon: '🗄️', intro: 'Which data service fits each AI need?', topic: 'embeddings-and-vector-search',
    buckets: ['Cosmos DB for NoSQL', 'PostgreSQL + pgvector', 'Azure Managed Redis'],
    items: [
      { text: 'Embed new items the moment they are saved', bucket: 0, why: 'The change feed reports inserts and updates.' },
      { text: 'Chat history keyed by user, with global scale', bucket: 0, why: 'JSON items partitioned by user id.' },
      { text: 'Similarity search joined with an orders table', bucket: 1, why: 'pgvector lives inside SQL.' },
      { text: 'RAG filtered by tenant_id and language columns', bucket: 1, why: 'Metadata filters in a WHERE clause.' },
      { text: 'Reuse the answer to a question asked a different way', bucket: 2, why: 'A semantic cache with a Redis vector index.' },
      { text: 'Cache product pages for 60 seconds', bucket: 2, why: 'Cache-aside with a TTL.' },
    ],
  },
  {
    id: 'messaging-choice', title: 'Message or event?', icon: '📨', intro: 'Service Bus, Event Grid or a Function trigger?', topic: 'service-bus-queues',
    buckets: ['Service Bus', 'Event Grid', 'Azure Functions'],
    items: [
      { text: 'Keep failed jobs for inspection in a dead-letter queue', bucket: 0, why: 'DLQ is a Service Bus feature.' },
      { text: 'Process orders in sequence per customer', bucket: 0, why: 'Sessions give FIFO per session id.' },
      { text: 'React only when a blob name ends with .pdf', bucket: 1, why: 'Subject filters on an event subscription.' },
      { text: 'Publish your own “document indexed” custom event', bucket: 1, why: 'Custom topics accept your events.' },
      { text: 'Run code on an HTTP request and write to a queue', bucket: 2, why: 'HTTP trigger plus an output binding.' },
      { text: 'Clean up old blobs every night at 2 AM', bucket: 2, why: 'A timer trigger.' },
    ],
  },
  {
    id: 'secure-observe', title: 'Which tool?', icon: '🔐', intro: 'Match each job to the right service.', topic: 'key-vault-secrets',
    buckets: ['Key Vault', 'App Configuration', 'Application Insights', 'Log Analytics (KQL)'],
    items: [
      { text: 'Keep every version of a database password', bucket: 0, why: 'Key Vault stores secret versions.' },
      { text: 'Store a TLS certificate', bucket: 0, why: 'Certificates live in Key Vault.' },
      { text: 'Switch on a feature for 10% of users', bucket: 1, why: 'Feature flags with filters.' },
      { text: 'Different settings for dev and prod in one store', bucket: 1, why: 'Labels.' },
      { text: 'See one request across API, queue and database', bucket: 2, why: 'Distributed tracing.' },
      { text: 'Chart failed requests per 5 minutes', bucket: 3, why: 'summarize count() by bin(timestamp, 5m).' },
    ],
  },
];

export const RIDDLES: Riddle[] = [
  { answer: 'Azure Container Registry', topic: 'azure-container-registry', clues: ['I keep your container images private.', 'Tags name my versions; digests never lie.', 'My Tasks can build images in the cloud.'] },
  { answer: 'Revision', topic: 'azure-container-apps', clues: ['I am a snapshot that never changes.', 'A new image or env var makes a new one of me.', 'You can send me 20% of the traffic.'] },
  { answer: 'KEDA', topic: 'keda-scaling', clues: ['I watch queues, topics and other event sources.', 'I add replicas when work piles up.', 'I am happy to scale all the way to zero.'] },
  { answer: 'Request Unit', topic: 'cosmos-db-rus-indexing-consistency', clues: ['I am the currency of Cosmos DB.', 'A 1 KB point read costs about one of me.', 'Indexing every property makes writes cost more of me.'] },
  { answer: 'Change feed', topic: 'cosmos-db-change-feed', clues: ['I am an ordered list of what changed.', 'I remember inserts and updates, not deletes.', 'My processor uses a lease container.'] },
  { answer: 'pgvector', topic: 'pgvector-rag', clues: ['I am an extension, not a separate database.', 'I add a vector column type to PostgreSQL.', 'HNSW and IVFFlat are my indexes.'] },
  { answer: 'Dead-letter queue', topic: 'service-bus-topics-and-dead-letters', clues: ['I am where poison messages go.', 'You get me free with every queue and subscription.', 'Exceed the max delivery count and you meet me.'] },
  { answer: 'Output binding', topic: 'functions-triggers-and-bindings', clues: ['I write data for your function.', 'You declare me instead of writing client code.', 'I can drop a message on a queue when your function returns.'] },
  { answer: 'Managed identity', topic: 'key-vault-secrets', clues: ['I am an identity Azure gives your app.', 'With me there is no password to leak.', 'Give me the Key Vault Secrets User role and I can read secrets.'] },
  { answer: 'Trace ID', topic: 'opentelemetry-tracing', clues: ['Every span in one request shares me.', 'I travel between services in the traceparent header.', 'Find me and you can see the whole journey.'] },
];
