/**
 * Exam-format practice items for the AI-200 mock exam (Yes/No series,
 * matching, ordering, drop-down completion). Every item is ORIGINAL, written
 * from the official skills outline; none are real or recalled exam questions.
 */
import type { FormatItem } from '../az-900/exam-items';

export const EXAM_ITEMS: FormatItem[] = [
  /* ---------------- Domain 1: Containers ---------------- */
  { kind: 'yesno', id: 'dev-x1-yn-acr', domain: 1, objective: '1.1.1', statements: [
    { text: 'An image digest identifies the exact content of an image and does not change when a tag is moved.', answer: true },
    { text: 'Running az acr build requires Docker to be installed on the computer that runs the command.', answer: false },
    { text: 'A Container Apps revision is created when you change the container image of the app.', answer: true },
  ], explanation: 'A **digest** is a content hash, so it never moves. `az acr build` sends the build context to **ACR Tasks**, which builds in Azure. Changing the image changes the template, which creates a new **revision**.' },
  { kind: 'order', id: 'dev-x1-order-acr', domain: 1, objective: '1.1.2', question: 'You need to build an image from source in Azure and run it in Azure Container Apps. Which four actions should you perform in sequence?', actions: ['Create an Azure Container Registry', 'Run az acr build to build and push the image', 'Grant the container app’s managed identity the AcrPull role', 'Create the container app that references the image', 'Run docker push from a developer workstation'], answer: [0, 1, 2, 3], explanation: 'Create the registry, build in the cloud with **ACR Tasks** (`az acr build` pushes the result), let the app pull with **AcrPull** on its managed identity, then create the app. `docker push` is not needed.' },
  { kind: 'dropdown', id: 'dev-x1-dd-keda', domain: 1, objective: '1.2.2', question: 'Complete the configuration.', parts: [
    'A worker must scale out as messages arrive in a Service Bus queue and stop running when the queue is empty. Configure a ',
    { options: ['HTTP scale rule', 'custom KEDA scale rule of type azure-servicebus', 'CPU scale rule', 'fixed replica count'], answer: 1 },
    ' and set the minimum replicas to ',
    { options: ['0', '1', '10'], answer: 0 },
    '.',
  ], explanation: 'Container Apps uses a **custom scale rule** backed by the KEDA **azure-servicebus** scaler. **Min replicas 0** lets the app scale to zero when idle.' },
  { kind: 'match', id: 'dev-x1-match-troubleshoot', domain: 1, objective: '1.2.4', question: 'Match each symptom to the first command you should run.', itemsLabel: 'Commands', items: ['kubectl logs <pod> --previous', 'kubectl describe pod <pod>', 'az containerapp logs show --type system', 'kubectl get svc'], targets: [
    { text: 'A pod restarts repeatedly with CrashLoopBackOff', answer: 0 },
    { text: 'A pod is stuck in ImagePullBackOff', answer: 1 },
    { text: 'A container app revision fails to provision', answer: 2 },
    { text: 'You need the cluster IP and ports of a Service', answer: 3 },
  ], explanation: '**logs --previous** shows why the last container crashed. **describe** shows events such as image pull errors. Container Apps **system logs** show platform events. **get svc** lists Services and their ports.' },
  /* ---------------- Domain 2: Data for AI ---------------- */
  { kind: 'yesno', id: 'dev-x2-yn-cosmos', domain: 2, objective: '2.1.2', statements: [
    { text: 'Excluding a large embedding array from the range index can reduce the RU cost of writes.', answer: true },
    { text: 'Session consistency guarantees that a client reads its own writes.', answer: true },
    { text: 'The change feed reports deleted items by default.', answer: false },
  ], explanation: 'Fewer indexed paths means cheaper writes. **Session** gives read-your-writes within a session. The latest-version change feed mode shows **inserts and updates**, not deletes, so use a soft-delete flag.' },
  { kind: 'dropdown', id: 'dev-x2-dd-pgvector', domain: 2, objective: '2.2.5', question: 'Complete the PostgreSQL query that returns the five most similar chunks for one tenant by cosine distance.', parts: [
    'SELECT content FROM chunks WHERE tenant_id = %s ORDER BY embedding ',
    { options: ['<->', '<=>', '<#>', 'LIKE'], answer: 1 },
    ' %s::vector LIMIT 5;',
  ], explanation: 'In pgvector, **<=>** is cosine distance, **<->** is Euclidean (L2) distance and **<#>** is negative inner product. The WHERE clause is the **metadata filter**.' },
  { kind: 'match', id: 'dev-x2-match-redis', domain: 2, objective: '2.3.1', question: 'Match each requirement to the Redis command.', itemsLabel: 'Commands', items: ['SET key value EX 300', 'DEL key', 'TTL key', 'FT.SEARCH'], targets: [
    { text: 'Cache a value for five minutes', answer: 0 },
    { text: 'Invalidate a cached product after its price changes', answer: 1 },
    { text: 'Check how many seconds remain before a key expires', answer: 2 },
    { text: 'Run a KNN vector query against an index', answer: 3 },
  ], explanation: '**SET … EX** sets a value with expiry, **DEL** invalidates, **TTL** reports remaining seconds, and **FT.SEARCH** queries a RediSearch index, including vector KNN.' },
  { kind: 'order', id: 'dev-x2-order-rag', domain: 2, objective: '2.2.5', question: 'You implement a RAG pattern with PostgreSQL. Which four actions should you perform in sequence when a user asks a question?', actions: ['Generate an embedding for the question', 'Run a similarity query with a tenant metadata filter', 'Add the returned chunks to the model prompt as context', 'Send the prompt to the chat model and return the answer', 'Rebuild the HNSW index'], answer: [0, 1, 2, 3], explanation: 'Embed, retrieve with a filter, augment the prompt, then generate. Index builds happen when data is loaded, not per question.' },
  /* ---------------- Domain 3: Messaging and Functions ---------------- */
  { kind: 'yesno', id: 'dev-x3-yn-sb', domain: 3, objective: '3.1.1', statements: [
    { text: 'In peek-lock mode, a message is removed from the queue only after the receiver completes it.', answer: true },
    { text: 'Each subscription of a Service Bus topic receives its own copy of every message that matches its filter.', answer: true },
    { text: 'Messages in a dead-letter queue are deleted automatically after the max delivery count is reached.', answer: false },
  ], explanation: '**Peek-lock** waits for **complete**. Every **subscription** gets a copy. Dead-lettered messages stay in the **DLQ** until something reads and settles them.' },
  { kind: 'dropdown', id: 'dev-x3-dd-eg', domain: 3, objective: '3.1.2', question: 'Complete the Event Grid event subscription.', parts: [
    'To deliver only events for PDF files, set a ',
    { options: ['subject ends with filter of .pdf', 'max delivery count of 1', 'session ID of pdf', 'TTL of 60 seconds'], answer: 0 },
    '. To keep events that still fail after all retries, configure ',
    { options: ['dead-lettering to a storage container', 'a lower event TTL', 'duplicate detection', 'a second topic'], answer: 0 },
    '.',
  ], explanation: '**Subject filters** match the start or end of the event subject. Without **dead-lettering**, events that exhaust retries are dropped.' },
  { kind: 'match', id: 'dev-x3-match-func', domain: 3, objective: '3.2.1', question: 'Match each requirement to the Azure Functions trigger or binding.', itemsLabel: 'Triggers and bindings', items: ['HTTP trigger', 'Service Bus trigger', 'Timer trigger', 'Cosmos DB output binding'], targets: [
    { text: 'Expose a POST /api/summarise endpoint', answer: 0 },
    { text: 'Process each message that arrives in a queue', answer: 1 },
    { text: 'Run a clean-up job every night at 02:00', answer: 2 },
    { text: 'Save the function result as a document without writing client code', answer: 3 },
  ], explanation: 'Triggers start a function; bindings connect to data declaratively. An **output binding** writes when the function returns.' },
  /* ---------------- Domain 4: Secure and monitor ---------------- */
  { kind: 'yesno', id: 'dev-x4-yn-kv', domain: 4, objective: '4.1.1', statements: [
    { text: 'When an application requests a Key Vault secret without a version, it receives the latest enabled version.', answer: true },
    { text: 'A managed identity needs a role such as Key Vault Secrets User to read secrets from a vault that uses Azure RBAC.', answer: true },
    { text: 'Azure App Configuration is the recommended place to store database passwords in plain text.', answer: false },
  ], explanation: 'No version means **latest**. With the RBAC permission model the identity needs **Key Vault Secrets User**. Secrets belong in Key Vault; App Configuration can hold a **Key Vault reference**.' },
  { kind: 'dropdown', id: 'dev-x4-dd-kql', domain: 4, objective: '4.2.2', question: 'Complete the KQL query that counts failed requests in 5-minute buckets.', parts: [
    'requests | ',
    { options: ['where success == false', 'project success', 'extend success', 'take success'], answer: 0 },
    ' | ',
    { options: ['summarize count() by bin(timestamp, 5m)', 'sort by count()', 'join requests', 'render count()'], answer: 0 },
  ], explanation: '**where** filters rows, **summarize … by bin()** groups them into time buckets.' },
  { kind: 'order', id: 'dev-x4-order-otel', domain: 4, objective: '4.2.1', question: 'You add distributed tracing to a Python API by using the Azure Monitor OpenTelemetry Distro. Which three actions should you perform in sequence?', actions: ['Install the azure-monitor-opentelemetry package', 'Call configure_azure_monitor() with the Application Insights connection string at startup', 'Create custom spans with tracer.start_as_current_span() around important work', 'Create a Log Analytics alert rule'], answer: [0, 1, 2], explanation: 'Install the **distro**, call **configure_azure_monitor()** before the app handles requests, then add **custom spans** where you need detail. Alerts are optional and come later.' },
];
