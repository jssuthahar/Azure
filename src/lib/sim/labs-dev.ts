/**
 * AI-200 practice labs: developer services in the simulated Cloud Shell
 * (see devsvc.ts). Every task is checked from simulator events, and every
 * task's `cli` hint completes it when run as written, in order.
 */
import { SUB_ID, type Sim } from './engine';
import type { Lab } from './labs';

const ev = (s: Sim, type: string, pred: (d: Record<string, any>) => boolean = () => true) => s.events.some((e) => e.type === type && pred(e.data));
const lc = (x?: string) => (x ?? '').toLowerCase();
const id = (rg: string, provider: string, name: string) => `/subscriptions/${SUB_ID}/resourceGroups/${rg}/providers/${provider}/${name}`;
const ran = (s: Sim, file: string) => ev(s, 'py.run', (d) => d.file === file && d.ok);
const kqlRan = (s: Sim, table: string, op?: string) => ev(s, 'kql.run', (d) => d.tables.includes(lc(table)) && (!op || d.ops.includes(op)));

export const DEV_LABS: Lab[] = [
  /* ------------------------------------------------------------ ACR */
  {
    id: 'dev-acr', exam: 'ai-200', title: 'Build images with Azure Container Registry', icon: '🗃️', level: 'Intermediate', minutes: 10, start: 'shell',
    intro: 'Your chat API needs an image before it can run anywhere. Build it in Azure without Docker on your laptop, look at what landed in the registry, then set up a task that rebuilds on every commit and every base-image patch.',
    learn: ['Registry names, SKUs and the login server', 'az acr build: a cloud build from a Dockerfile', 'Tags vs digests, and importing base images', 'ACR Tasks with commit and base-image triggers'],
    topics: ['azure-container-registry', 'acr-tasks', 'containers-for-ai-apps'],
    tasks: [
      { text: 'Create a resource group **rg-dev-acr** and a **Standard** registry named **acrcontosoai01**.', cli: 'az group create -n rg-dev-acr -l eastus && az acr create -g rg-dev-acr -n acrcontosoai01 --sku Standard', check: (s) => ev(s, 'acr.create', (d) => lc(d.name) === 'acrcontosoai01') },
      { text: 'Read the **Dockerfile**, then build it in Azure and push it as **chat-api:v1**.', cli: 'cat Dockerfile && az acr build -r acrcontosoai01 -t chat-api:v1 .', check: (s) => ev(s, 'acr.build', (d) => d.repo === 'chat-api' && d.tag === 'v1') },
      { text: 'List the repositories and the tags of **chat-api**. Note the digest: a tag can move, a digest never does.', cli: 'az acr repository list -n acrcontosoai01 -o table && az acr repository show-tags -n acrcontosoai01 --repository chat-api -o table', check: (s) => ev(s, 'acr.tags', (d) => d.repo === 'chat-api') },
      { text: '**Import** the Python base image into your own registry as **base/python:3.12-slim**, so builds don\'t depend on Docker Hub.', cli: 'az acr import -n acrcontosoai01 --source docker.io/library/python:3.12-slim --image base/python:3.12-slim', check: (s) => ev(s, 'acr.import', (d) => d.repo === 'base/python') },
      { text: 'Create an **ACR task** with the **commit trigger** and the **base-image trigger** on, tagging each image with the run ID, then run it once.', cli: 'az acr task create -r acrcontosoai01 -n build-chat-api -t chat-api:{{.Run.ID}} -c https://github.com/contoso/chat-api.git#main -f Dockerfile --git-access-token ghp_practiceOnlyToken --commit-trigger-enabled true --base-image-trigger-enabled true && az acr task run -r acrcontosoai01 -n build-chat-api', check: (s) => ev(s, 'acr.task.create', (d) => d.commit && d.baseImage) && ev(s, 'acr.task.run') },
    ],
    wrap: 'az acr build sends your folder to Azure and builds it there, so Cloud Shell needs no Docker. Every push gets a digest; tags like v1 or latest are labels you can move. Importing base images keeps your builds working when a public registry throttles you. ACR Tasks rebuild on a commit, on a schedule or when the base image gets a security patch.',
  },

  /* ---------------------------------------------- App Service containers */
  {
    id: 'dev-app-service-container', exam: 'ai-200', title: 'Run a container on App Service', icon: '🌐', level: 'Intermediate', minutes: 10, start: 'shell',
    intro: 'Host the chat UI image on App Service. The first try fails twice, for two very common reasons: the app can\'t pull from your private registry, and it pings the wrong port. Fix both and read the log that proves it.',
    learn: ['Web App for Containers with a private ACR image', 'Managed identity + AcrPull instead of admin passwords', 'WEBSITES_PORT and reading the container log'],
    topics: ['app-service-containers'],
    tasks: [
      { text: 'Create **rg-dev-web**, a Basic registry **acrcontosoweb01** and build **chat-ui:v1** into it.', cli: 'az group create -n rg-dev-web -l eastus && az acr create -g rg-dev-web -n acrcontosoweb01 --sku Basic && az acr build -r acrcontosoweb01 -t chat-ui:v1 .', check: (s) => ev(s, 'acr.build', (d) => lc(d.registry) === 'acrcontosoweb01' && d.repo === 'chat-ui') },
      { text: 'Create a Linux **B1** plan and a web app **app-chat-ui01** that runs **acrcontosoweb01.azurecr.io/chat-ui:v1**. Read the warning.', cli: 'az appservice plan create -g rg-dev-web -n plan-chat-ui --is-linux --sku B1 && az webapp create -g rg-dev-web -p plan-chat-ui -n app-chat-ui01 --container-image-name acrcontosoweb01.azurecr.io/chat-ui:v1', check: (s) => ev(s, 'webapp.container', (d) => d.name === 'app-chat-ui01') },
      { text: 'Give the app a **managed identity**, grant it **AcrPull** on the registry and tell App Service to pull with it.', cli: `az webapp identity assign -g rg-dev-web -n app-chat-ui01 && az role assignment create --assignee-object-id $(az webapp identity show -g rg-dev-web -n app-chat-ui01 --query principalId -o tsv) --assignee-principal-type ServicePrincipal --role AcrPull --scope ${id('rg-dev-web', 'Microsoft.ContainerRegistry/registries', 'acrcontosoweb01')} && az webapp config set -g rg-dev-web -n app-chat-ui01 --generic-configurations '{"acrUseManagedIdentityCreds": true}'`, check: (s) => ev(s, 'role.assign', (d) => d.role === 'AcrPull' && d.principalName === 'app-chat-ui01') && ev(s, 'webapp.config', (d) => d.acrMi) },
      { text: 'The image listens on port **8000**. Set **WEBSITES_PORT** (and a CHAT_MODEL setting while you\'re there).', cli: 'az webapp config appsettings set -g rg-dev-web -n app-chat-ui01 --settings WEBSITES_PORT=8000 CHAT_MODEL=gpt-4.1-mini', check: (s) => ev(s, 'appsettings.set', (d) => d.name === 'app-chat-ui01' && d.keys.includes('WEBSITES_PORT')) },
      { text: 'Tail the log and confirm the container **started and is ready to serve requests**.', cli: 'az webapp log tail -g rg-dev-web -n app-chat-ui01', check: (s) => ev(s, 'webapp.logtail', (d) => d.name === 'app-chat-ui01' && d.healthy) },
    ],
    wrap: 'App Service can run any Linux container. For a private registry, use the app\'s managed identity with the AcrPull role and acrUseManagedIdentityCreds, so no registry password is stored anywhere. App Service sends traffic to port 80 unless WEBSITES_PORT says otherwise; "didn\'t respond to HTTP pings" almost always means the port is wrong.',
  },

  /* --------------------------------------------------- Container Apps */
  {
    id: 'dev-container-apps', exam: 'ai-200', title: 'Container Apps: revisions and traffic', icon: '🚢', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Ship a new version of an API without a big-bang release. Create a container app, switch to multiple revisions, send 20% of users to the new one and check the logs from both sides: Cloud Shell and KQL.',
    learn: ['Environments, ingress and target port', 'Revisions: single vs multiple mode', 'Traffic splitting by revision weight', 'Console logs vs system logs, and the Log Analytics table behind them'],
    topics: ['azure-container-apps', 'containers-for-ai-apps'],
    tasks: [
      { text: 'Create **rg-dev-aca** and a Container Apps environment **cae-contoso-ai**.', cli: 'az group create -n rg-dev-aca -l eastus && az containerapp env create -n cae-contoso-ai -g rg-dev-aca -l eastus', check: (s) => ev(s, 'aca.env', (d) => d.name === 'cae-contoso-ai') },
      { text: 'Create **ca-chat-api** from the quickstart image with **external ingress** on port **80**, 1 to 5 replicas, revision suffix **v1**.', cli: 'az containerapp create -n ca-chat-api -g rg-dev-aca --environment cae-contoso-ai --image mcr.microsoft.com/k8se/quickstart:latest --ingress external --target-port 80 --min-replicas 1 --max-replicas 5 --revision-suffix v1', check: (s) => ev(s, 'aca.create', (d) => d.name === 'ca-chat-api' && d.ingress === 'external') },
      { text: 'Switch to **multiple** revision mode and ship revision **v2** with a new environment variable. List the revisions.', cli: 'az containerapp revision set-mode -n ca-chat-api -g rg-dev-aca --mode multiple && az containerapp update -n ca-chat-api -g rg-dev-aca --set-env-vars CHAT_MODEL=gpt-4.1-mini --revision-suffix v2 && az containerapp revision list -n ca-chat-api -g rg-dev-aca -o table', check: (s) => ev(s, 'aca.mode', (d) => d.mode === 'multiple') && ev(s, 'aca.revision', (d) => d.name === 'ca-chat-api--v2') },
      { text: 'Split traffic: **80%** to v1, **20%** to v2.', cli: 'az containerapp ingress traffic set -n ca-chat-api -g rg-dev-aca --revision-weight ca-chat-api--v1=80 ca-chat-api--v2=20', check: (s) => ev(s, 'aca.traffic', (d) => d.weights['ca-chat-api--v2'] === 20) },
      { text: 'Read the **system** logs (pulls, starts, probes) and the **console** logs (what your code prints).', cli: 'az containerapp logs show -n ca-chat-api -g rg-dev-aca --type system && az containerapp logs show -n ca-chat-api -g rg-dev-aca --type console', check: (s) => ev(s, 'aca.logs', (d) => d.type === 'system') && ev(s, 'aca.logs', (d) => d.type === 'console') },
      { text: 'Query the environment\'s workspace with KQL: the **ContainerAppConsoleLogs_CL** table for ca-chat-api.', cli: `az monitor log-analytics query -w workspace-rgdevaca --analytics-query "ContainerAppConsoleLogs_CL | where ContainerAppName_s == 'ca-chat-api' | project TimeGenerated, RevisionName_s, Log_s | take 10"`, check: (s) => kqlRan(s, 'ContainerAppConsoleLogs_CL', 'where') },
    ],
    wrap: 'Each change to the image, environment variables or scale settings creates a new revision. In single mode the newest revision takes all traffic; in multiple mode you choose the split, which gives you canary and blue-green releases for free. System logs explain why a container won\'t start; console logs show what it does once running, and both land in Log Analytics for KQL.',
  },

  /* --------------------------------------------------------- KEDA */
  {
    id: 'dev-keda', exam: 'ai-200', title: 'Scale a worker on queue length (KEDA)', icon: '📈', level: 'Intermediate', minutes: 10, start: 'shell',
    intro: 'An order worker should cost nothing when the queue is empty and fan out when orders pile up. Wire a Container Apps scale rule to a Service Bus queue, flood the queue and watch replicas go from zero to ten and back.',
    learn: ['Custom KEDA scale rules (azure-servicebus)', 'messageCount and how replicas are worked out', 'Scale to zero with min replicas 0'],
    topics: ['keda-scaling'],
    tasks: [
      { text: 'Create **rg-dev-keda**, a Standard Service Bus namespace **sb-contoso-keda01** and a queue **orders**.', cli: 'az group create -n rg-dev-keda -l eastus && az servicebus namespace create -g rg-dev-keda -n sb-contoso-keda01 --sku Standard && az servicebus queue create -g rg-dev-keda --namespace-name sb-contoso-keda01 -n orders', check: (s) => ev(s, 'sb.queue', (d) => d.ns === 'sb-contoso-keda01' && d.name === 'orders') },
      { text: 'Create an environment and the worker **ca-order-worker** with **0 to 10** replicas and an **azure-servicebus** scale rule: one replica per **5** messages.', cli: 'az containerapp env create -n cae-keda -g rg-dev-keda -l eastus && az containerapp create -n ca-order-worker -g rg-dev-keda --environment cae-keda --image mcr.microsoft.com/k8se/quickstart:latest --min-replicas 0 --max-replicas 10 --secrets sb-conn=Endpoint=sb://sb-contoso-keda01.servicebus.windows.net/;SharedAccessKeyName=listen;SharedAccessKey=practice --scale-rule-name orders-queue --scale-rule-type azure-servicebus --scale-rule-metadata queueName=orders namespace=sb-contoso-keda01 messageCount=5 --scale-rule-auth connection=sb-conn', check: (s) => ev(s, 'aca.scale', (d) => d.app === 'ca-order-worker' && d.type === 'azure-servicebus' && d.metadata.messageCount === '5' && d.min === 0) },
      { text: 'Check the replicas. With an empty queue there should be **none**.', cli: 'az containerapp replica list -n ca-order-worker -g rg-dev-keda -o table', check: (s) => ev(s, 'aca.replicas', (d) => d.app === 'ca-order-worker' && d.count === 0) },
      { text: 'Send **50** orders, then list replicas again. 50 ÷ 5 = **10**.', cli: 'pip install azure-servicebus azure-identity && export SERVICEBUS_NAMESPACE=sb-contoso-keda01.servicebus.windows.net && python sb_send.py --queue orders --count 50 && az containerapp replica list -n ca-order-worker -g rg-dev-keda -o table', check: (s) => ev(s, 'aca.replicas', (d) => d.app === 'ca-order-worker' && d.count === 10) },
      { text: 'Drain the queue and watch it **scale back to zero**.', cli: 'python sb_receive.py --queue orders && az containerapp replica list -n ca-order-worker -g rg-dev-keda -o table', check: (s) => ev(s, 'aca.scaled', (d) => d.app === 'ca-order-worker' && d.to === 0 && d.from > 0) },
    ],
    wrap: 'Container Apps runs KEDA for you. A custom rule names a scaler type (azure-servicebus) and its metadata (queueName, messageCount). Replicas are roughly messages ÷ messageCount, capped by min and max. With min replicas 0 you pay nothing while idle. Prefer a managed identity over a connection-string secret for the rule in real apps.',
  },

  /* ---------------------------------------------------------- AKS */
  {
    id: 'dev-aks', exam: 'ai-200', title: 'AKS: deploy, break and fix', icon: '☸️', level: 'Intermediate', minutes: 14, start: 'shell',
    intro: 'Deploy a small API to Kubernetes with manifests, watch it heal itself, then hit the two failures every developer meets: an image that doesn\'t exist and a container that crashes on start. Use describe, logs and rollout to fix them.',
    learn: ['Deployments, Services and kubectl apply', 'Self-healing and scaling with ReplicaSets', 'ImagePullBackOff vs CrashLoopBackOff', 'kubectl describe, logs --previous and rollout undo'],
    topics: ['aks-manifests', 'troubleshoot-containers'],
    tasks: [
      { text: 'Create **rg-dev-aks**, a 2-node cluster **aks-dev01** and point kubectl at it.', cli: 'az group create -n rg-dev-aks -l eastus && az aks create -g rg-dev-aks -n aks-dev01 --node-count 2 --generate-ssh-keys && az aks get-credentials -g rg-dev-aks -n aks-dev01', check: (s) => ev(s, 'aks.credentials', (d) => d.name === 'aks-dev01') },
      { text: 'Apply **deployment.yaml** and **service.yaml**, then list the pods.', cli: 'kubectl apply -f deployment.yaml && kubectl apply -f service.yaml && kubectl get pods', check: (s) => ev(s, 'k8s.apply', (d) => d.name === 'chat-api' && d.kind === 'Deployment') && ev(s, 'k8s.apply', (d) => d.kind === 'Service') },
      { text: 'Delete the chat-api pods and watch Kubernetes replace them. Then **scale to 5** replicas.', cli: 'kubectl delete pod -l app=chat-api && kubectl get pods && kubectl scale deployment chat-api --replicas=5 && kubectl get deployments', check: (s) => ev(s, 'k8s.selfheal') && ev(s, 'k8s.scale', (d) => d.to === 5) },
      { text: 'Roll out **deployment-broken.yaml** and find out why the new pod won\'t start (look for **ImagePullBackOff** in describe).', cli: 'kubectl apply -f deployment-broken.yaml && kubectl get pods && kubectl describe pods -l app=chat-api', check: (s) => ev(s, 'k8s.describe', (d) => d.reasons.includes('ImagePullBackOff')) },
      { text: '**Undo** the rollout and confirm it finished.', cli: 'kubectl rollout undo deployment/chat-api && kubectl rollout status deployment/chat-api', check: (s) => ev(s, 'k8s.rollout.undo') && ev(s, 'k8s.rollout.status', (d) => d.ok) },
      { text: 'Apply **worker.yaml**. It crash-loops: read the crashed run with **logs --previous**, then set the missing variable.', cli: 'kubectl apply -f worker.yaml && kubectl logs deploy/worker --previous && kubectl set env deployment/worker COSMOS_ENDPOINT=https://cosmos-contoso-ai01.documents.azure.com:443/ && kubectl get pods', check: (s) => ev(s, 'k8s.logs', (d) => d.previous && d.crash) && ev(s, 'k8s.setenv', (d) => d.name === 'worker') },
    ],
    wrap: 'A Deployment keeps the number of pods you ask for, so deleted pods come back and scaling is one command. During a rolling update the old pods keep serving until new ones are ready, which is why a bad image tag only leaves one pod stuck. ImagePullBackOff means the image or registry access is wrong (kubectl describe shows the event). CrashLoopBackOff means the app starts and dies (kubectl logs --previous shows why).',
  },

  /* ------------------------------------------------------- Cosmos DB */
  {
    id: 'dev-cosmos', exam: 'ai-200', title: 'Cosmos DB: partition keys, RUs and consistency', icon: '🪐', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Every Cosmos DB call has a price in request units. Create an orders container, read data three ways from Python and compare the bill, then change consistency and indexing and watch the numbers move.',
    learn: ['Partition key choice and point reads', 'Request units per operation', 'Consistency levels and their RU cost', 'Indexing policy: cheaper writes vs slower queries'],
    topics: ['cosmos-db-sdk-and-queries', 'cosmos-db-rus-indexing-consistency'],
    tasks: [
      { text: 'Create **rg-dev-cosmos**, an account **cosmos-contoso-ai01** (Session consistency) and a database **retail**.', cli: 'az group create -n rg-dev-cosmos -l eastus && az cosmosdb create -n cosmos-contoso-ai01 -g rg-dev-cosmos --default-consistency-level Session && az cosmosdb sql database create -a cosmos-contoso-ai01 -g rg-dev-cosmos -n retail', check: (s) => ev(s, 'cosmos.db', (d) => d.account === 'cosmos-contoso-ai01' && d.name === 'retail') },
      { text: 'Look at **index-policy.json**, then create container **orders** with partition key **/customerId** and that policy.', cli: 'cat index-policy.json && az cosmosdb sql container create -a cosmos-contoso-ai01 -g rg-dev-cosmos -d retail -n orders -p /customerId --throughput 400 --idx @index-policy.json', check: (s) => ev(s, 'cosmos.container', (d) => d.name === 'orders' && d.pk === '/customerId') },
      { text: 'Run **cosmos_query.py** and compare a point read, a single-partition query and a cross-partition query.', cli: 'pip install azure-cosmos azure-identity && export COSMOS_ENDPOINT=https://cosmos-contoso-ai01.documents.azure.com:443/ && python cosmos_query.py', check: (s) => ev(s, 'cosmos.query', (d) => d.kind === 'point') && ev(s, 'cosmos.query', (d) => d.kind === 'cross') },
      { text: 'Switch the account to **Strong** consistency and run the script again. What happened to the read cost?', cli: 'az cosmosdb update -n cosmos-contoso-ai01 -g rg-dev-cosmos --default-consistency-level Strong && python cosmos_query.py', check: (s) => ev(s, 'cosmos.query', (d) => d.kind === 'point' && d.consistency === 'Strong' && d.ru >= 2) },
      { text: 'Apply **index-policy-lean.json** (only /customerId indexed) and run the script once more. The status query now scans everything.', cli: 'az cosmosdb sql container update -a cosmos-contoso-ai01 -g rg-dev-cosmos -d retail -n orders --idx @index-policy-lean.json && python cosmos_query.py', check: (s) => ev(s, 'cosmos.query', (d) => d.kind === 'cross' && d.scan) },
    ],
    wrap: 'A point read (id + partition key) is the cheapest call, about 1 RU for a small item. Queries that stay in one partition cost a little more; queries that fan out across partitions cost more again. Strong and Bounded Staleness reads cost about twice as much as Session. Indexing fewer paths makes writes cheaper but turns queries on unindexed paths into full scans.',
  },

  /* -------------------------------------------------- Cosmos vectors */
  {
    id: 'dev-cosmos-vector', exam: 'ai-200', title: 'Cosmos DB vector search with the change feed', icon: '🧭', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Products arrive without embeddings. Let the change feed notice each new or edited product, write its embedding, and then answer shopper questions with VectorDistance over a DiskANN index.',
    learn: ['Vector embedding policy and vector indexes', 'VectorDistance with TOP N', 'Change feed with a saved continuation token', 'Skipping your own writes to avoid loops'],
    topics: ['cosmos-db-vector-search', 'cosmos-db-change-feed', 'embeddings-and-vector-search'],
    tasks: [
      { text: 'Create **rg-dev-vec**, account **cosmos-contoso-vec01**, database **retail** and a **products** container with the vector policy and a **DiskANN** index.', cli: 'az group create -n rg-dev-vec -l eastus && az cosmosdb create -n cosmos-contoso-vec01 -g rg-dev-vec && az cosmosdb sql database create -a cosmos-contoso-vec01 -g rg-dev-vec -n retail && az cosmosdb sql container create -a cosmos-contoso-vec01 -g rg-dev-vec -d retail -n products -p /category --vector-embeddings @vector-policy.json --idx @vector-index.json', check: (s) => ev(s, 'cosmos.container', (d) => d.name === 'products' && d.vector && d.vectorIndex === 'diskANN') },
      { text: 'Load 8 products **without embeddings**.', cli: 'pip install azure-cosmos azure-identity && export COSMOS_ENDPOINT=https://cosmos-contoso-vec01.documents.azure.com:443/ && python load_products.py', check: (s) => ran(s, 'load_products.py') },
      { text: 'Run **change_feed.py**: it reads every change from the beginning and writes an embedding for each product.', cli: 'python change_feed.py', check: (s) => ev(s, 'cosmos.changefeed', (d) => d.embedded >= 8 && d.fromStart) },
      { text: 'Ask a question with **vector_search.py** and look at the scores and the RU charge.', cli: 'python vector_search.py "waterproof jacket for a monsoon trek"', check: (s) => ev(s, 'cosmos.vector', (d) => d.results > 0 && d.indexed) },
      { text: 'Add one new product and run the change feed again. Only the new product gets embedded; your own embedding writes are skipped.', cli: 'python load_products.py --new && python change_feed.py', check: (s) => ev(s, 'cosmos.changefeed', (d) => !d.fromStart && d.embedded === 1) },
    ],
    wrap: 'A container needs a vector embedding policy (path, dimensions, distance function) set when it is created; a vector index such as DiskANN keeps searches cheap, and excluding the vector path from the normal index keeps writes cheap. Always use TOP N with VectorDistance. The change feed lists inserts and updates in order; save the continuation token and check a content hash so your own writes don\'t trigger endless re-embedding.',
  },

  /* ------------------------------------------------------ PostgreSQL */
  {
    id: 'dev-postgres', exam: 'ai-200', title: 'PostgreSQL + pgvector for RAG', icon: '🐘', level: 'Intermediate', minutes: 14, start: 'shell',
    intro: 'Build the retrieval half of a RAG app on PostgreSQL. Connect with psql, get past the extension allow-list, load 5,000 chunks for three tenants, then make similarity search fast with HNSW and safe with a tenant filter.',
    learn: ['Connecting to a flexible server with psql', 'azure.extensions allow-list and CREATE EXTENSION vector', 'HNSW index and reading EXPLAIN ANALYZE', 'Filtering by tenant in similarity queries'],
    topics: ['postgresql-connect-and-query', 'postgresql-schema-and-indexes', 'pgvector-rag', 'postgresql-performance-for-vectors'],
    tasks: [
      { text: 'Create **rg-dev-pg** and a Burstable flexible server **pg-contoso-ai01** (PostgreSQL 16) that allows Azure services, including Cloud Shell.', cli: 'az group create -n rg-dev-pg -l eastus && az postgres flexible-server create -g rg-dev-pg -n pg-contoso-ai01 -l eastus --tier Burstable --sku-name Standard_B1ms --version 16 --admin-user pgadmin --admin-password "Practice-Only-123" --public-access 0.0.0.0', check: (s) => ev(s, 'pg.create', (d) => d.name === 'pg-contoso-ai01') },
      { text: 'Connect with **psql** and run SELECT version();', cli: 'psql -h pg-contoso-ai01.postgres.database.azure.com -U pgadmin -d postgres -c "SELECT version();"', check: (s) => ev(s, 'pg.query', (d) => d.kind === 'select' && d.ok) },
      { text: 'Allow-list **VECTOR** in azure.extensions, then **CREATE EXTENSION vector**. (Try the CREATE first if you want to see it fail.)', cli: 'az postgres flexible-server parameter set -g rg-dev-pg -s pg-contoso-ai01 -n azure.extensions --value VECTOR && psql -h pg-contoso-ai01.postgres.database.azure.com -U pgadmin -d postgres -c "CREATE EXTENSION IF NOT EXISTS vector;"', check: (s) => ev(s, 'pg.query', (d) => d.kind === 'extension' && d.ok) },
      { text: 'Create the **docs** table from **schema.sql** and load 5,000 chunks with **load_docs.sql**.', cli: 'psql -h pg-contoso-ai01.postgres.database.azure.com -U pgadmin -d postgres -f schema.sql && psql -h pg-contoso-ai01.postgres.database.azure.com -U pgadmin -d postgres -f load_docs.sql', check: (s) => ev(s, 'pg.query', (d) => d.kind === 'load' && d.ok) },
      { text: 'Run **explain_search.sql** (Seq Scan), add an **HNSW** index on embedding, and run it again (Index Scan).', cli: 'psql -h pg-contoso-ai01.postgres.database.azure.com -U pgadmin -d postgres -f explain_search.sql && psql -h pg-contoso-ai01.postgres.database.azure.com -U pgadmin -d postgres -c "CREATE INDEX docs_embedding_hnsw ON docs USING hnsw (embedding vector_cosine_ops);" && psql -h pg-contoso-ai01.postgres.database.azure.com -U pgadmin -d postgres -f explain_search.sql', check: (s) => ev(s, 'pg.query', (d) => d.kind === 'explain' && d.scan === 'seq') && ev(s, 'pg.query', (d) => d.kind === 'explain' && d.scan === 'index') },
      { text: 'Run the RAG retrieval query in **search.sql**: nearest chunks for one tenant only.', cli: 'psql -h pg-contoso-ai01.postgres.database.azure.com -U pgadmin -d postgres -f search.sql', check: (s) => ev(s, 'pg.query', (d) => d.kind === 'similarity' && d.tenantFilter) },
    ],
    wrap: 'On Azure Database for PostgreSQL an extension must be in the azure.extensions allow-list before CREATE EXTENSION works. The <=> operator is cosine distance; without a vector index PostgreSQL compares every row (Seq Scan), with HNSW it walks a graph (Index Scan). In a shared table always filter by tenant, keep a B-tree index on tenant_id, and raise hnsw.ef_search if filters leave too few results.',
  },

  /* ----------------------------------------------------------- Redis */
  {
    id: 'dev-redis', exam: 'ai-200', title: 'Azure Managed Redis: cache and vectors', icon: '🧱', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Make a slow product lookup fast with the cache-aside pattern, watch keys expire, then turn the same cache into a vector store for support articles with RediSearch.',
    learn: ['Creating Azure Managed Redis with RediSearch', 'SET with EX, TTL and expiry', 'Cache-aside: hit vs miss', 'FT.CREATE vector index and KNN queries'],
    topics: ['redis-caching', 'redis-vector-search'],
    tasks: [
      { text: 'Create **rg-dev-redis** and cache **redis-contoso-ai01** with the **RediSearch** module and the **EnterpriseCluster** policy.', cli: 'az group create -n rg-dev-redis -l eastus && az redisenterprise create --cluster-name redis-contoso-ai01 -g rg-dev-redis -l eastus --sku Balanced_B0 --modules name=RediSearch --clustering-policy EnterpriseCluster', check: (s) => ev(s, 'redis.create', (d) => d.name === 'redis-contoso-ai01' && d.modules.some((m: string) => /redisearch/i.test(m))) },
      { text: 'Store **session:42** for **60 seconds** and check its TTL.', cli: 'redis-cli -h redis-contoso-ai01.eastus.redis.azure.net -p 10000 --tls SET session:42 "cart=3" EX 60 && redis-cli -h redis-contoso-ai01.eastus.redis.azure.net -p 10000 --tls TTL session:42', check: (s) => ev(s, 'redis.cmd', (d) => d.cmd === 'SET' && d.ex === 60) && ev(s, 'redis.cmd', (d) => d.cmd === 'TTL') },
      { text: 'Wait 61 seconds and GET it again. It\'s gone.', cli: 'sleep 61 && redis-cli -h redis-contoso-ai01.eastus.redis.azure.net -p 10000 --tls GET session:42', check: (s) => ev(s, 'redis.cmd', (d) => d.cmd === 'GET' && d.expired) },
      { text: 'Run **cache_aside.py** twice: a **miss** that loads from the database, then a **hit**.', cli: 'pip install redis redis-entraid && export REDIS_HOST=redis-contoso-ai01.eastus.redis.azure.net && python cache_aside.py && python cache_aside.py', check: (s) => ev(s, 'redis.cache', (d) => !d.hit) && ev(s, 'redis.cache', (d) => d.hit) },
      { text: 'Create a vector index **idx:docs** over hashes with the prefix **doc:** (HNSW, 1536 dimensions, cosine).', cli: 'redis-cli -h redis-contoso-ai01.eastus.redis.azure.net -p 10000 --tls FT.CREATE idx:docs ON HASH PREFIX 1 doc: SCHEMA title TEXT embedding VECTOR HNSW 6 TYPE FLOAT32 DIM 1536 DISTANCE_METRIC COSINE', check: (s) => ev(s, 'redis.cmd', (d) => d.cmd === 'FT.CREATE' && d.vector) },
      { text: 'Load support articles and run a **KNN** query with **redis_vector.py**.', cli: 'python redis_vector.py "How do I reset my router?"', check: (s) => ev(s, 'redis.vector', (d) => d.results > 0) },
    ],
    wrap: 'Azure Managed Redis listens on port 10000 with TLS, uses Microsoft Entra ID by default and only enables modules such as RediSearch at creation time (with the Enterprise or non-clustered policy). Cache-aside reads the cache first and fills it on a miss with an expiry, so stale data ages out. The same cache can hold vectors and answer KNN queries through an FT.CREATE index.',
  },

  /* ------------------------------------------------------ Service Bus */
  {
    id: 'dev-service-bus', exam: 'ai-200', title: 'Service Bus: queues, topics and dead letters', icon: '🚌', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Send orders through a queue, find out what happens to a message your code can\'t read, then fan orders out to a topic where one subscription only wants the big ones.',
    learn: ['Queues, peek-lock, complete and abandon', 'Max delivery count and the dead-letter queue', 'Topics, subscriptions and SQL filter rules', "Why you delete the $Default rule"],
    topics: ['service-bus-queues', 'service-bus-topics-and-dead-letters'],
    tasks: [
      { text: 'Create **rg-dev-sb**, a Standard namespace **sb-contoso-ai01** and a queue **orders** with **max delivery count 3**.', cli: 'az group create -n rg-dev-sb -l eastus && az servicebus namespace create -g rg-dev-sb -n sb-contoso-ai01 --sku Standard && az servicebus queue create -g rg-dev-sb --namespace-name sb-contoso-ai01 -n orders --max-delivery-count 3', check: (s) => ev(s, 'sb.queue', (d) => d.ns === 'sb-contoso-ai01' && d.maxDelivery === 3) },
      { text: 'Send **5** orders to the queue.', cli: 'pip install azure-servicebus azure-identity && export SERVICEBUS_NAMESPACE=sb-contoso-ai01.servicebus.windows.net && python sb_send.py --queue orders --count 5', check: (s) => ev(s, 'sb.send', (d) => d.kind === 'queue' && d.entity === 'orders') },
      { text: 'Receive them. Good orders are **completed**; the broken one is abandoned until it lands in the **dead-letter queue**.', cli: 'python sb_receive.py --queue orders', check: (s) => ev(s, 'sb.settle', (d) => d.completed > 0) && ev(s, 'sb.dlq', (d) => d.reason === 'MaxDeliveryCountExceeded') },
      { text: 'Peek the **dead-letter queue** and read the reason.', cli: 'python sb_receive.py --queue orders --dlq', check: (s) => ev(s, 'sb.dlq.read', (d) => d.count > 0) },
      { text: 'Create topic **order-events** with two subscriptions: **all-orders**, and **high-value** with the filter **amount > 1000** (and its $Default rule removed).', cli: "az servicebus topic create -g rg-dev-sb --namespace-name sb-contoso-ai01 -n order-events && az servicebus topic subscription create -g rg-dev-sb --namespace-name sb-contoso-ai01 --topic-name order-events -n all-orders && az servicebus topic subscription create -g rg-dev-sb --namespace-name sb-contoso-ai01 --topic-name order-events -n high-value && az servicebus topic subscription rule create -g rg-dev-sb --namespace-name sb-contoso-ai01 --topic-name order-events --subscription-name high-value -n big-orders --filter-sql-expression \"amount > 1000\" && az servicebus topic subscription rule delete -g rg-dev-sb --namespace-name sb-contoso-ai01 --topic-name order-events --subscription-name high-value -n '$Default'", check: (s) => ev(s, 'sb.rule', (d) => d.sub === 'high-value' && /amount\s*>\s*1000/.test(d.sql)) && ev(s, 'sb.rule.delete', (d) => d.sub === 'high-value' && d.name === '$Default') },
      { text: 'Publish 5 orders to the topic and compare what each subscription received.', cli: 'python sb_send.py --topic order-events --count 5', check: (s) => ev(s, 'sb.send', (d) => d.kind === 'topic' && d.routed['high-value'] < d.count && d.routed['all-orders'] === d.count) },
    ],
    wrap: 'With peek-lock a receiver completes a message when it\'s done or abandons it to try again. Each delivery adds to the delivery count; once it reaches the max, Service Bus moves the message to the dead-letter queue with the reason MaxDeliveryCountExceeded so one bad message can\'t block the rest. A topic copies each message to every subscription whose rules match, and a new subscription\'s $Default rule (1=1) matches everything until you remove it.',
  },

  /* ------------------------------------------------------- Event Grid */
  {
    id: 'dev-event-grid', exam: 'ai-200', title: 'Event Grid: filters, retries and dead letters', icon: '📣', level: 'Intermediate', minutes: 10, start: 'shell',
    intro: 'Upload events go to a custom topic. One subscriber only cares about photos; another endpoint is flaky. Filter by subject, publish events, and make sure the ones that can\'t be delivered are kept instead of lost.',
    learn: ['Custom topics and event subscriptions', 'Subject filters (begins with / ends with)', 'Retry policy: max attempts and event TTL', 'Dead-lettering to a storage container'],
    topics: ['event-grid'],
    tasks: [
      { text: 'Create **rg-dev-eg** and a custom topic **egt-contoso-ai01**.', cli: 'az group create -n rg-dev-eg -l eastus && az eventgrid topic create -g rg-dev-eg -n egt-contoso-ai01 -l eastus', check: (s) => ev(s, 'eg.topic', (d) => d.name === 'egt-contoso-ai01') },
      { text: 'Subscribe a webhook that only gets events whose subject ends with **.jpg**.', cli: `az eventgrid event-subscription create --name images-only --source-resource-id ${id('rg-dev-eg', 'Microsoft.EventGrid/topics', 'egt-contoso-ai01')} --endpoint-type webhook --endpoint https://contoso-hooks.example.com/api/thumbnails --subject-ends-with .jpg`, check: (s) => ev(s, 'eg.sub', (d) => d.name === 'images-only' && d.endsWith === '.jpg') },
      { text: 'Publish 5 upload events and see which were **delivered** and which were **filtered out**.', cli: 'pip install azure-eventgrid azure-identity && export EVENTGRID_TOPIC_ENDPOINT=https://egt-contoso-ai01.eastus-1.eventgrid.azure.net/api/events && python eg_publish.py', check: (s) => ev(s, 'eg.publish', (d) => d.delivered > 0 && d.filtered > 0) },
      { text: 'Add a storage account and a second subscription to a **flaky** endpoint with **3 attempts**, a **30-minute TTL** and a **dead-letter** container.', cli: `az storage account create -g rg-dev-eg -n stdeveg01 --sku Standard_LRS && az eventgrid event-subscription create --name audit --source-resource-id ${id('rg-dev-eg', 'Microsoft.EventGrid/topics', 'egt-contoso-ai01')} --endpoint-type webhook --endpoint https://contoso-hooks.example.com/api/flaky --max-delivery-attempts 3 --event-ttl 30 --deadletter-endpoint ${id('rg-dev-eg', 'Microsoft.Storage/storageAccounts', 'stdeveg01')}/blobServices/default/containers/deadletters`, check: (s) => ev(s, 'eg.sub', (d) => d.name === 'audit' && d.maxAttempts === 3 && !!d.deadletter) },
      { text: 'Publish again. The flaky endpoint fails, Event Grid retries, then **dead-letters** the events.', cli: 'python eg_publish.py', check: (s) => ev(s, 'eg.deadletter', (d) => d.sub === 'audit' && d.count > 0) },
    ],
    wrap: 'Event Grid pushes each event to every matching subscription. Filters on subject or event type stop the noise before it reaches your code. When an endpoint fails, Event Grid retries with back-off until it runs out of attempts or time to live; with a dead-letter container the undelivered events are saved as blobs, without one they are dropped.',
  },

  /* -------------------------------------------------------- Functions */
  {
    id: 'dev-functions', exam: 'ai-200', title: 'Functions: HTTP in, Service Bus out', icon: '⚡', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Build an order intake API with no server and almost no code: an HTTP-triggered function whose output binding drops each order on a Service Bus queue, connected with a managed identity instead of a connection string.',
    learn: ['Flex Consumption function apps', 'Triggers and output bindings (Python v2 model)', 'Identity-based connections: <CONNECTION>__fullyQualifiedNamespace', 'func azure functionapp publish and testing with curl'],
    topics: ['functions-triggers-and-bindings', 'deploy-function-apps'],
    tasks: [
      { text: 'Create **rg-dev-func**, a storage account and a **Flex Consumption** Python app **func-contoso-ai01**.', cli: 'az group create -n rg-dev-func -l eastus && az storage account create -g rg-dev-func -n stdevfunc01 --sku Standard_LRS && az functionapp create -g rg-dev-func -n func-contoso-ai01 --storage-account stdevfunc01 --flexconsumption-location eastus --runtime python --runtime-version 3.12', check: (s) => ev(s, 'func.create', (d) => d.name === 'func-contoso-ai01' && d.flex) },
      { text: 'Read **function_app.py**: one HTTP trigger and one Service Bus **output binding** called SERVICEBUS.', cli: 'cat function_app.py', check: (s) => ev(s, 'file.view', (d) => d.file === 'function_app.py') },
      { text: 'Create the namespace and **orders** queue, then point the binding at it with an **identity-based** setting.', cli: 'az servicebus namespace create -g rg-dev-func -n sb-contoso-func01 --sku Standard && az servicebus queue create -g rg-dev-func --namespace-name sb-contoso-func01 -n orders && az functionapp config appsettings set -g rg-dev-func -n func-contoso-ai01 --settings SERVICEBUS__fullyQualifiedNamespace=sb-contoso-func01.servicebus.windows.net', check: (s) => ev(s, 'appsettings.set', (d) => d.kind === 'functionapp' && d.keys.includes('SERVICEBUS__fullyQualifiedNamespace')) },
      { text: 'Turn on the app\'s **managed identity** and give it **Azure Service Bus Data Sender** on the namespace.', cli: `az functionapp identity assign -g rg-dev-func -n func-contoso-ai01 && az role assignment create --assignee-object-id $(az functionapp identity show -g rg-dev-func -n func-contoso-ai01 --query principalId -o tsv) --assignee-principal-type ServicePrincipal --role "Azure Service Bus Data Sender" --scope ${id('rg-dev-func', 'Microsoft.ServiceBus/namespaces', 'sb-contoso-func01')}`, check: (s) => ev(s, 'role.assign', (d) => d.role === 'Azure Service Bus Data Sender' && d.principalName === 'func-contoso-ai01') },
      { text: '**Publish** the project with Core Tools.', cli: 'func azure functionapp publish func-contoso-ai01', check: (s) => ev(s, 'func.publish', (d) => d.app === 'func-contoso-ai01') },
      { text: 'POST an order with **curl** and get **202 Accepted**: the binding queued it.', cli: `curl -X POST https://func-contoso-ai01.azurewebsites.net/api/orders -H "Content-Type: application/json" -d '{"orderId": 1001, "amount": 250}'`, check: (s) => ev(s, 'func.invoke', (d) => d.app === 'func-contoso-ai01' && d.status === 202 && d.queued) },
    ],
    wrap: 'A trigger starts the function; bindings read or write other services without SDK code. The connection name in a binding (SERVICEBUS) points at app settings, and SERVICEBUS__fullyQualifiedNamespace tells the runtime to sign in with the app\'s managed identity, which then needs a data role such as Azure Service Bus Data Sender. Flex Consumption scales each function to zero when idle and out when busy.',
  },

  /* --------------------------------------------- Key Vault + App Config */
  {
    id: 'dev-key-vault', exam: 'ai-200', title: 'Key Vault and App Configuration', icon: '🔑', level: 'Intermediate', minutes: 14, start: 'shell',
    intro: 'Keep the Cosmos DB key out of code and out of app settings. Store it in an RBAC vault, let a web app read it through a Key Vault reference, then load settings, labels and a feature flag from App Configuration.',
    learn: ['RBAC vaults: data roles vs Owner', 'Secret versions and rotation', 'Key Vault references in App Service', 'App Configuration labels, feature flags and Key Vault references'],
    topics: ['key-vault-secrets', 'app-configuration'],
    tasks: [
      { text: 'Create **rg-dev-kv** and an **RBAC** vault **kv-contoso-ai01**, then give yourself **Key Vault Secrets Officer** on it. (Owner alone can\'t write secrets.)', cli: `az group create -n rg-dev-kv -l eastus && az keyvault create -n kv-contoso-ai01 -g rg-dev-kv -l eastus --enable-rbac-authorization true && az role assignment create --assignee learner@msdevbuild.com --role "Key Vault Secrets Officer" --scope ${id('rg-dev-kv', 'Microsoft.KeyVault/vaults', 'kv-contoso-ai01')}`, check: (s) => ev(s, 'kv.create', (d) => d.name === 'kv-contoso-ai01' && d.rbac) && ev(s, 'role.assign', (d) => d.role === 'Key Vault Secrets Officer' && d.principalKind === 'user') },
      { text: 'Set **cosmos-key** twice (a rotation), list its **versions**, then read it from Python with **get_secret.py**.', cli: 'az keyvault secret set --vault-name kv-contoso-ai01 -n cosmos-key --value "first-value" && az keyvault secret set --vault-name kv-contoso-ai01 -n cosmos-key --value "rotated-value" && az keyvault secret list-versions --vault-name kv-contoso-ai01 -n cosmos-key -o table && pip install azure-keyvault-secrets azure-identity && export KEY_VAULT_URL=https://kv-contoso-ai01.vault.azure.net/ && python get_secret.py cosmos-key', check: (s) => ev(s, 'kv.secret', (d) => d.action === 'versions' && d.count >= 2) && ran(s, 'get_secret.py') },
      { text: 'Create web app **app-contoso-kv01** with a managed identity and an app setting that is a **Key Vault reference** to cosmos-key.', cli: 'az appservice plan create -g rg-dev-kv -n plan-kv01 --is-linux --sku B1 && az webapp create -g rg-dev-kv -p plan-kv01 -n app-contoso-kv01 --runtime "PYTHON:3.12" && az webapp identity assign -g rg-dev-kv -n app-contoso-kv01 && az webapp config appsettings set -g rg-dev-kv -n app-contoso-kv01 --settings "COSMOS_KEY=@Microsoft.KeyVault(VaultName=kv-contoso-ai01;SecretName=cosmos-key)"', check: (s) => ev(s, 'appsettings.set', (d) => d.name === 'app-contoso-kv01' && d.kvRefs > 0) },
      { text: 'Grant the app\'s identity **Key Vault Secrets User** and check the reference now shows **Resolved**.', cli: `az role assignment create --assignee-object-id $(az webapp identity show -g rg-dev-kv -n app-contoso-kv01 --query principalId -o tsv) --assignee-principal-type ServicePrincipal --role "Key Vault Secrets User" --scope ${id('rg-dev-kv', 'Microsoft.KeyVault/vaults', 'kv-contoso-ai01')} && az webapp config appsettings list -g rg-dev-kv -n app-contoso-kv01`, check: (s) => ev(s, 'appsettings.list', (d) => d.name === 'app-contoso-kv01' && d.allResolved) },
      { text: 'Create App Configuration **appcs-contoso-ai01** with **Chat:Model** for the **prod** and **dev** labels and a feature flag **Beta.Summaries** turned on.', cli: 'az appconfig create -g rg-dev-kv -n appcs-contoso-ai01 -l eastus --sku Standard && az appconfig kv set -n appcs-contoso-ai01 --key Chat:Model --value gpt-4.1-mini --label prod --yes && az appconfig kv set -n appcs-contoso-ai01 --key Chat:Model --value gpt-4.1-nano --label dev --yes && az appconfig feature set -n appcs-contoso-ai01 --feature Beta.Summaries --yes && az appconfig feature enable -n appcs-contoso-ai01 --feature Beta.Summaries --yes', check: (s) => ev(s, 'appconfig.set', (d) => d.label === 'prod') && ev(s, 'appconfig.set', (d) => d.label === 'dev') && ev(s, 'appconfig.feature', (d) => d.action === 'enable') },
      { text: 'Add a **Key Vault reference** key and load everything with **get_config.py** (prod label).', cli: 'az appconfig kv set-keyvault -n appcs-contoso-ai01 --key Cosmos:Key --secret-identifier https://kv-contoso-ai01.vault.azure.net/secrets/cosmos-key --yes && pip install azure-appconfiguration-provider azure-identity && export APPCONFIG_ENDPOINT=https://appcs-contoso-ai01.azconfig.io && python get_config.py', check: (s) => ev(s, 'appconfig.kvref') && ev(s, 'appconfig.load', (d) => d.kvResolved > 0) },
    ],
    wrap: 'In an RBAC vault, management roles like Owner don\'t read secrets; data roles do (Secrets Officer to write, Secrets User to read). Each set creates a new version, so rotation is just another set. A Key Vault reference lets App Service fetch the secret with its managed identity, and App Configuration holds settings per label, feature flags and references to Key Vault, never the secret itself.',
  },

  /* ------------------------------------------------------ Observability */
  {
    id: 'dev-observe', exam: 'ai-200', title: 'Trace and query an AI app', icon: '🔭', level: 'Intermediate', minutes: 14, start: 'shell',
    intro: 'A user says "the chat hung". Instrument the app with OpenTelemetry, find the failed request with KQL, follow its operation_Id to the slow model call, measure dependencies and set an alert so you hear about it first next time.',
    learn: ['Workspace-based Application Insights', 'azure-monitor-opentelemetry and operation_Id', 'KQL: where, project, union, summarize, order by', 'Log search alert rules'],
    topics: ['opentelemetry-tracing', 'kql-logs-and-metrics', 'troubleshoot-containers'],
    tasks: [
      { text: 'Create **rg-dev-obs**, a Log Analytics workspace and Application Insights **appi-contoso-ai01** on top of it.', cli: 'az group create -n rg-dev-obs -l eastus && az monitor log-analytics workspace create -g rg-dev-obs -n law-dev-obs01 && az monitor app-insights component create --app appi-contoso-ai01 -l eastus -g rg-dev-obs --workspace law-dev-obs01', check: (s) => ev(s, 'appi.create', (d) => d.name === 'appi-contoso-ai01' && d.workspace === 'law-dev-obs01') },
      { text: 'Install the Azure Monitor OpenTelemetry distro, export the **connection string** and run **otel_app.py**.', cli: 'pip install azure-monitor-opentelemetry && export APPLICATIONINSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show --app appi-contoso-ai01 -g rg-dev-obs --query connectionString -o tsv) && python otel_app.py', check: (s) => ev(s, 'otel.run', (d) => d.appi === 'appi-contoso-ai01') },
      { text: 'Find the **failed requests** with KQL.', cli: 'az monitor app-insights query --app appi-contoso-ai01 -g rg-dev-obs --analytics-query "requests | where success == false | project timestamp, name, resultCode, duration, operation_Id"', check: (s) => kqlRan(s, 'requests', 'where') },
      { text: 'Follow one operation end to end: **union** requests, dependencies and exceptions for its operation_Id (4bf92f… on your first run).', cli: `az monitor app-insights query --app appi-contoso-ai01 -g rg-dev-obs --analytics-query "union requests, dependencies, exceptions | where operation_Id == '4bf92f3577b34da6a3ce929d0e0e4736' | project timestamp, itemType, name, target, duration, success"`, check: (s) => ev(s, 'kql.run', (d) => d.tables.length >= 2 && d.ops.includes('where') && d.rows > 0) },
      { text: 'Which dependency is slow? **Summarize** calls and average duration by target.', cli: 'az monitor app-insights query --app appi-contoso-ai01 -g rg-dev-obs --analytics-query "dependencies | summarize calls=count(), avg_ms=avg(duration) by target | order by avg_ms desc"', check: (s) => kqlRan(s, 'dependencies', 'summarize') },
      { text: 'Create a **log search alert** that fires when any request fails.', cli: `az monitor scheduled-query create -g rg-dev-obs -n alert-failed-chat --scopes ${id('rg-dev-obs', 'Microsoft.Insights/components', 'appi-contoso-ai01')} --condition "count 'Failed' > 0" --condition-query "Failed=requests | where success == false" --evaluation-frequency 5m --window-size 5m --severity 2`, check: (s) => ev(s, 'logalert.create', (d) => d.name === 'alert-failed-chat') && ev(s, 'logalert.fired') },
    ],
    wrap: 'configure_azure_monitor() sends OpenTelemetry traces to Application Insights, where a request, its dependencies, exceptions and logs all share one operation_Id. KQL pipes rows through where, project, summarize and order by; union lets you read several tables at once. A log search alert runs a query on a schedule and fires when the row count crosses your threshold.',
  },
];
