/**
 * Developer services for the AI-200 practice labs (EDUCATION ONLY).
 * Azure Container Registry, App Service containers, Container Apps (revisions,
 * traffic, KEDA scale rules), AKS + kubectl, Cosmos DB (RUs, indexing,
 * consistency, vector search, change feed), PostgreSQL + pgvector, Azure
 * Managed Redis, Service Bus, Event Grid, Functions (Flex Consumption, output
 * bindings), Key Vault, App Configuration, Application Insights with
 * OpenTelemetry, KQL and log search alerts.
 * Nothing here calls real Azure: every command changes the in-browser World and
 * emits an event, so lab checks can see exactly what the learner did.
 * Command names and flags follow Microsoft Learn (checked 18 Nov 2026); output
 * is simplified.
 */
import { SimError, SUB_ID, type Res, type ResType } from './engine';
import type { World } from './world';
import { SCRIPTS as AI_SCRIPTS, SAMPLES as AI_SAMPLES } from './foundry';

export interface DevOut { out?: string; error?: string }
type Props = Record<string, any>;

/* ------------------------------------------------------------------ */
/* small helpers                                                       */
/* ------------------------------------------------------------------ */
const rnd = (n: number) => Math.floor(Math.random() * n);
const hex = (n: number) => Array.from({ length: n }, () => '0123456789abcdef'[rnd(16)]).join('');
const uuid = () => `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`;
const json = (v: unknown) => JSON.stringify(v, null, 2);
const hash = (s: string) => Math.abs([...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7));
const lc = (s?: string) => (s ?? '').toLowerCase();
const now = () => new Date().toISOString().slice(0, 19) + 'Z';
const dev = (w: World): Props => ((w as any).dev ??= {});
const envOf = (w: World): Record<string, string> => ((w as any).env ??= {});
const P = (r: Res) => r.props as Props;
export function table(rows: Record<string, unknown>[], cols: string[]): string {
  if (!rows.length) return '';
  const wd = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c] ?? '').length)));
  const line = (vals: string[]) => vals.map((v, i) => v.padEnd(wd[i])).join('  ');
  return [line(cols), line(wd.map((n) => '-'.repeat(n))), ...rows.map((r) => line(cols.map((c) => String(r[c] ?? ''))))].join('\n');
}

/* ---------- argument parsing (aliases match the real az commands used here) ---------- */
interface Parsed { words: string[]; raw: string[]; flags: Record<string, string[]> }
const ALIAS: Record<string, string> = { '-g': '--resource-group', '-n': '--name', '-l': '--location', '-o': '--output', '-y': '--yes', '-h': '--help', '-r': '--registry', '-t': '--image', '-f': '--file', '-c': '--context', '-a': '--account-name', '-d': '--database-name', '-p': '--partition-key-path', '-s': '--server-name', '-v': '--value' };
function parse(tokens: string[], extra: Record<string, string> = {}): Parsed {
  const words: string[] = [];
  const raw: string[] = [];
  const flags: Record<string, string[]> = {};
  let cur: string | null = null;
  for (const t of tokens) {
    if (t.startsWith('-') && t.length > 1 && !/^-\d/.test(t)) {
      const i = t.indexOf('=');
      const k = t.startsWith('--') && i > 0 ? t.slice(0, i) : t;
      cur = extra[k] ?? ALIAS[k] ?? k.toLowerCase();
      flags[cur] ??= [];
      if (t.startsWith('--') && i > 0) flags[cur].push(t.slice(i + 1));
    } else if (cur) flags[cur].push(t);
    else { words.push(t.toLowerCase()); raw.push(t); }
  }
  return { words, raw, flags };
}
const one = (p: Parsed, ...names: string[]) => {
  for (const n of names) if (p.flags[n]?.length) return p.flags[n].join(' ');
  return undefined;
};
const many = (p: Parsed, name: string) => p.flags[name] ?? [];
const has = (p: Parsed, name: string) => name in p.flags;
const bool = (p: Parsed, name: string, dflt: boolean) => (has(p, name) ? !/^(false|0|no)$/i.test(one(p, name) ?? 'true') : dflt);
function req(p: Parsed, spec: [string, string][]) {
  const missing = spec.filter(([l]) => !p.flags[l]?.length).map(([l, s]) => (s ? `${l}/${s}` : l));
  if (missing.length) throw new SimError(`the following arguments are required: ${missing.join(', ')}`, 'MissingArgs');
}
/** Tiny JMESPath: a.b.c and [0]. Enough for `--query principalId -o tsv`. */
function jq(v: any, path: string): any {
  let cur = v;
  for (const part of path.split('.').filter(Boolean)) {
    const m = part.match(/^([\w$-]*)(?:\[(\d+)\])?$/);
    if (!m) return null;
    if (m[1]) cur = cur?.[m[1]];
    if (m[2] !== undefined) cur = cur?.[Number(m[2])];
  }
  return cur ?? null;
}
function out(p: Parsed, value: unknown, rows?: Record<string, unknown>[], cols?: string[]): DevOut {
  const fmt = lc(one(p, '--output') ?? 'json');
  const q = one(p, '--query');
  if (q) {
    const v = jq(value, q);
    if (fmt === 'tsv' || fmt === 'none') return { out: fmt === 'none' ? '' : typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v ?? '') };
    return { out: json(v) };
  }
  if (fmt === 'table' && rows && cols) return { out: table(rows, cols) || '(empty)' };
  if (fmt === 'none') return { out: '' };
  if (fmt === 'tsv' && rows && cols) return { out: rows.map((r) => cols.map((c) => r[c]).join('\t')).join('\n') };
  return { out: json(value) };
}

/* ---------- resources ---------- */
const byName = (w: World, type: ResType, name?: string) => w.res.find((r) => r.type === type && lc(r.name) === lc(name));
function needName(w: World, type: ResType, name: string | undefined, what: string) {
  const r = byName(w, type, name);
  if (!r) throw new SimError(`${what} '${name ?? ''}' was not found. Create it first.`, 'ResourceNotFound');
  return r;
}
/** Create (or return the existing) resource. Real ARM creates are idempotent PUTs. */
function upsert(w: World, type: ResType, o: { rg: string; name: string; location?: string; tags?: Record<string, string> }, global: boolean, props: () => Props): [Res, boolean] {
  const g = w.needRg(o.rg);
  const same = w.find(type, g.name, o.name);
  if (same) return [same, false];
  if (global && byName(w, type, o.name)) throw new SimError(`The name '${o.name}' is already in use. This name must be globally unique across Azure.`, 'NameNotAvailable');
  const location = o.location ? w.checkLocation(o.location) : g.location;
  w.guard(type, g.name, location, o.tags ?? {});
  const r = (w as any).add(type, g, o.name, location, props(), o.tags ?? {}) as Res;
  r.props.location = location;
  return [r, true];
}
const scopeId = (r: Res) => r.id;

/* ---------- managed identities and data-plane RBAC ---------- */
export interface DataRole { principal: string; principalName: string; role: string; scope: string }
const roles = (w: World): DataRole[] => (dev(w).roles ??= []);
export const DATA_ROLES = ['Key Vault Secrets User', 'Key Vault Secrets Officer', 'Key Vault Administrator', 'Key Vault Reader', 'AcrPull', 'AcrPush', 'Azure Service Bus Data Sender', 'Azure Service Bus Data Receiver', 'Azure Service Bus Data Owner', 'App Configuration Data Reader', 'App Configuration Data Owner', 'EventGrid Data Sender', 'Monitoring Metrics Publisher', 'Cosmos DB Account Reader Role', 'Storage Blob Data Contributor', 'Storage Blob Data Reader', 'Storage Queue Data Contributor'];
function identityOf(r: Res) { return P(r).identity?.principalId as string | undefined; }
function assignIdentity(w: World, r: Res, via = 'cli') {
  P(r).identity ??= { type: 'SystemAssigned', principalId: uuid(), tenantId: '11111111-2222-3333-4444-555555555555' };
  w.emit('identity.assign', { kind: r.type, name: r.name, principalId: P(r).identity.principalId, via });
  return P(r).identity;
}
function hasDataRole(w: World, principal: string | undefined, target: Res, names: string[]) {
  if (!principal) return false;
  const id = lc(target.id);
  return roles(w).some((a) => lc(a.principal) === lc(principal) && names.some((n) => lc(n) === lc(a.role)) && (id === lc(a.scope) || id.startsWith(lc(a.scope) + '/')));
}
const KV_READ = ['Key Vault Secrets User', 'Key Vault Secrets Officer', 'Key Vault Administrator'];
const KV_WRITE = ['Key Vault Secrets Officer', 'Key Vault Administrator'];
const ACR_PULL = ['AcrPull', 'AcrPush', 'Contributor', 'Owner'];
const SB_SEND = ['Azure Service Bus Data Sender', 'Azure Service Bus Data Owner'];
function resourceAtScope(w: World, scope: string) {
  const s = lc(scope.replace(/\/$/, ''));
  return w.res.find((r) => lc(r.id) === s);
}

/* ------------------------------------------------------------------ */
/* Cloud Shell files                                                   */
/* ------------------------------------------------------------------ */
export const FILES: Record<string, string> = {
  'Dockerfile': `# Dockerfile: the chat API image (FastAPI on Python 3.12)
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`,
  'requirements.txt': `# shared by the sample API (main.py) and the sample function app (function_app.py)
fastapi
uvicorn
azure-identity
azure-cosmos
azure-functions`,
  'main.py': `# main.py: a tiny chat API that listens on port 8000
import os
from fastapi import FastAPI
app = FastAPI()

@app.get("/healthz")
def health():
    return {"status": "ok"}

@app.post("/chat")
def chat(q: dict):
    return {"model": os.environ.get("CHAT_MODEL", "gpt-4.1-mini"), "answer": "Hello from the chat API"}`,
  'deployment.yaml': `apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chat-api
  template:
    metadata:
      labels:
        app: chat-api
    spec:
      containers:
      - name: chat-api
        image: mcr.microsoft.com/azuredocs/aks-helloworld:v1
        ports:
        - containerPort: 80
        resources:
          requests: { cpu: 100m, memory: 128Mi }
          limits: { cpu: 250m, memory: 256Mi }
        readinessProbe:
          httpGet: { path: /, port: 80 }`,
  'service.yaml': `apiVersion: v1
kind: Service
metadata:
  name: chat-api
spec:
  type: LoadBalancer
  selector:
    app: chat-api
  ports:
  - port: 80
    targetPort: 80`,
  'deployment-broken.yaml': `# Same Deployment, new image tag. Spot the problem: tag v9 was never pushed.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chat-api
  template:
    metadata:
      labels:
        app: chat-api
    spec:
      containers:
      - name: chat-api
        image: mcr.microsoft.com/azuredocs/aks-helloworld:v9
        ports:
        - containerPort: 80`,
  'worker.yaml': `# A background worker that reads COSMOS_ENDPOINT at start-up.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: worker
spec:
  replicas: 1
  selector:
    matchLabels:
      app: worker
  template:
    metadata:
      labels:
        app: worker
    spec:
      containers:
      - name: worker
        image: docker.io/contoso/order-worker:1.4
        # env: COSMOS_ENDPOINT is missing on purpose`,
  'index-policy.json': `{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [{ "path": "/*" }],
  "excludedPaths": [{ "path": "/notes/?" }, { "path": "/\\"_etag\\"/?" }]
}`,
  'index-policy-lean.json': `{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [{ "path": "/customerId/?" }],
  "excludedPaths": [{ "path": "/*" }]
}`,
  'vector-policy.json': `{
  "vectorEmbeddings": [
    { "path": "/embedding", "dataType": "float32", "distanceFunction": "cosine", "dimensions": 1536 }
  ]
}`,
  'vector-index.json': `{
  "indexingMode": "consistent",
  "automatic": true,
  "includedPaths": [{ "path": "/*" }],
  "excludedPaths": [{ "path": "/embedding/*" }, { "path": "/\\"_etag\\"/?" }],
  "vectorIndexes": [{ "path": "/embedding", "type": "diskANN" }]
}`,
  'schema.sql': `-- schema.sql: one table of document chunks for RAG, shared by many tenants
CREATE TABLE IF NOT EXISTS docs (
  id         bigserial PRIMARY KEY,
  tenant_id  text NOT NULL,
  title      text NOT NULL,
  content    text NOT NULL,
  embedding  vector(1536)
);
CREATE INDEX IF NOT EXISTS docs_tenant_idx ON docs (tenant_id);`,
  'load_docs.sql': `-- load_docs.sql: 5,000 practice chunks across three tenants (random embeddings)
INSERT INTO docs (tenant_id, title, content, embedding)
SELECT (ARRAY['contoso','fabrikam','northwind'])[1 + i % 3],
       'Policy doc ' || i,
       'Practice chunk number ' || i,
       (SELECT array_agg(random() + i * 0)::vector(1536) FROM generate_series(1, 1536))
FROM generate_series(1, 5000) AS i;`,
  'explain_search.sql': `-- explain_search.sql: how does PostgreSQL run a nearest-neighbour query?
EXPLAIN ANALYZE
SELECT id, title
FROM docs
ORDER BY embedding <=> (SELECT embedding FROM docs WHERE id = 42)
LIMIT 5;`,
  'search.sql': `-- search.sql: the retrieval step of RAG, filtered to one tenant
SELECT id, title, embedding <=> (SELECT embedding FROM docs WHERE id = 42) AS distance
FROM docs
WHERE tenant_id = 'contoso'
ORDER BY distance
LIMIT 3;`,
  'function_app.py': `# function_app.py: Python v2 programming model
import json
import azure.functions as func

app = func.FunctionApp()

@app.route(route="orders", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
@app.service_bus_queue_output(arg_name="msg", connection="SERVICEBUS", queue_name="orders")
def submit_order(req: func.HttpRequest, msg: func.Out[str]) -> func.HttpResponse:
    order = req.get_json()
    msg.set(json.dumps(order))          # output binding: no Service Bus SDK code needed
    return func.HttpResponse("Order queued", status_code=202)

# connection="SERVICEBUS" means: read app settings that start with SERVICEBUS.
# SERVICEBUS__fullyQualifiedNamespace=<ns>.servicebus.windows.net -> identity-based connection.`,
  'host.json': `{
  "version": "2.0",
  "extensionBundle": { "id": "Microsoft.Azure.Functions.ExtensionBundle", "version": "[4.*, 5.0.0)" }
}`,
};

/** Practice Python scripts (shown by cat, run by python). */
export const DEV_SCRIPTS: Record<string, string> = {
  'cosmos_query.py': `# cosmos_query.py: point read vs queries, with the request charge of each
# pip install azure-cosmos azure-identity
import os
from azure.identity import DefaultAzureCredential
from azure.cosmos import CosmosClient

client = CosmosClient(os.environ["COSMOS_ENDPOINT"], credential=DefaultAzureCredential())
orders = client.get_database_client("retail").get_container_client("orders")
# (This practice world gives your Cloud Shell sign-in the Cosmos DB Built-in Data Contributor role.)

def charge():
    return orders.client_connection.last_response_headers["x-ms-request-charge"]

orders.read_item(item="order-1001", partition_key="cust-42")          # point read: id + partition key
print("Point read:", charge(), "RU")

list(orders.query_items("SELECT * FROM c WHERE c.customerId = 'cust-42'", partition_key="cust-42"))
print("Single-partition query:", charge(), "RU")

list(orders.query_items("SELECT * FROM c WHERE c.status = 'shipped'", enable_cross_partition_query=True))
print("Cross-partition query:", charge(), "RU")`,
  'load_products.py': `# load_products.py: upsert products WITHOUT embeddings (the change feed adds them)
import os, sys
from azure.identity import DefaultAzureCredential
from azure.cosmos import CosmosClient

products = CosmosClient(os.environ["COSMOS_ENDPOINT"], DefaultAzureCredential()) \\
    .get_database_client("retail").get_container_client("products")
for p in NEW_PRODUCTS if "--new" in sys.argv else CATALOG:
    products.upsert_item(p)          # every write lands in the change feed`,
  'change_feed.py': `# change_feed.py: read changes since the last run and write an embedding for each
import os
from azure.identity import DefaultAzureCredential
from azure.cosmos import CosmosClient

products = CosmosClient(os.environ["COSMOS_ENDPOINT"], DefaultAzureCredential()) \\
    .get_database_client("retail").get_container_client("products")
token = load_token()                                   # None on the first run -> start from the beginning
changes = products.query_items_change_feed(start_time="Beginning" if token is None else None, continuation=token)
for item in changes:
    if item.get("embedding_hash") == content_hash(item):   # skip our own embedding writes
        continue
    item["embedding"] = embed(item["name"] + " " + item["description"])  # text-embedding-3-small, 1536 dims
    item["embedding_hash"] = content_hash(item)
    products.upsert_item(item)
save_token(products.client_connection.last_response_headers["etag"])`,
  'vector_search.py': `# vector_search.py: nearest products to a question with VectorDistance
import os, sys
from azure.identity import DefaultAzureCredential
from azure.cosmos import CosmosClient

products = CosmosClient(os.environ["COSMOS_ENDPOINT"], DefaultAzureCredential()) \\
    .get_database_client("retail").get_container_client("products")
q = embed(sys.argv[1] if len(sys.argv) > 1 else "waterproof jacket")
rows = products.query_items(
    "SELECT TOP 3 c.name, VectorDistance(c.embedding, @q) AS score FROM c ORDER BY VectorDistance(c.embedding, @q)",
    parameters=[{"name": "@q", "value": q}], enable_cross_partition_query=True)
for r in rows:
    print(f"{r['score']:.3f}  {r['name']}")`,
  'cache_aside.py': `# cache_aside.py: check Redis first, fall back to the database, then cache the result
# pip install redis redis-entraid
import os, json
from redis import Redis
from redis_entraid.cred_provider import create_from_default_azure_credential

r = Redis(host=os.environ["REDIS_HOST"], port=10000, ssl=True,
          credential_provider=create_from_default_azure_credential(("https://redis.azure.com/.default",)))
key = "product:42"
cached = r.get(key)
if cached:
    print("Cache HIT ", cached)
else:
    product = load_from_postgres(42)                 # slow path
    r.set(key, json.dumps(product), ex=300)          # cache for 5 minutes
    print("Cache MISS -> loaded from the database and cached for 300 s")`,
  'redis_vector.py': `# redis_vector.py: store support articles as hashes and run a KNN query on idx:docs
import os, sys
from redis import Redis
from redis.commands.search.query import Query

r = connect(os.environ["REDIS_HOST"])            # same Entra ID connection as cache_aside.py
for i, (title, text) in enumerate(ARTICLES, start=1):
    r.hset(f"doc:{i}", mapping={"title": title, "embedding": embed(text)})
q = Query("*=>[KNN 3 @embedding $vec AS score]").sort_by("score").return_fields("title", "score").dialect(2)
for d in r.ft("idx:docs").search(q, query_params={"vec": embed(sys.argv[1])}).docs:
    print(d.score, d.title)`,
  'sb_send.py': `# sb_send.py: send order messages to a queue or a topic
# pip install azure-servicebus azure-identity
import os, sys, json
from azure.identity import DefaultAzureCredential
from azure.servicebus import ServiceBusClient, ServiceBusMessage

ns = os.environ["SERVICEBUS_NAMESPACE"]           # <namespace>.servicebus.windows.net
client = ServiceBusClient(ns, DefaultAzureCredential())
with client:
    sender = client.get_queue_sender("orders") if "--queue" in sys.argv else client.get_topic_sender("order-events")
    with sender:
        for order in make_orders(count):
            msg = ServiceBusMessage(json.dumps(order), application_properties={"amount": order["amount"]})
            sender.send_messages(msg)`,
  'sb_receive.py': `# sb_receive.py: receive with peek-lock, then complete or abandon each message
from azure.servicebus import ServiceBusClient, ServiceBusSubQueue

with client.get_queue_receiver("orders", sub_queue=ServiceBusSubQueue.DEAD_LETTER if "--dlq" in sys.argv else None) as receiver:
    for msg in receiver:
        try:
            order = json.loads(str(msg))
            process(order)
            receiver.complete_message(msg)            # done: remove it
        except ValueError:
            receiver.abandon_message(msg)             # try again later; delivery count goes up
# After max delivery count attempts, Service Bus moves the message to the dead-letter queue.`,
  'eg_publish.py': `# eg_publish.py: publish upload events to a custom Event Grid topic (CloudEvents schema)
# pip install azure-eventgrid azure-identity
import os
from azure.identity import DefaultAzureCredential
from azure.eventgrid import EventGridPublisherClient
from azure.core.messaging import CloudEvent

client = EventGridPublisherClient(os.environ["EVENTGRID_TOPIC_ENDPOINT"], DefaultAzureCredential())
client.send([CloudEvent(source="/contoso/uploads", type="Contoso.Uploads.FileUploaded", subject=s, data={"path": s})
             for s in ["/uploads/photos/cat.jpg", "/uploads/docs/report.pdf", "/uploads/photos/beach.jpg",
                       "/uploads/docs/plan.docx", "/uploads/photos/logo.png"]])`,
  'get_secret.py': `# get_secret.py: read a secret with your Microsoft Entra ID sign-in
# pip install azure-keyvault-secrets azure-identity
import os, sys
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

client = SecretClient(vault_url=os.environ["KEY_VAULT_URL"], credential=DefaultAzureCredential())
secret = client.get_secret(sys.argv[1] if len(sys.argv) > 1 else "cosmos-key")
print(secret.name, secret.properties.version, secret.value[:3] + "***")`,
  'get_config.py': `# get_config.py: load settings, Key Vault references and feature flags from App Configuration
# pip install azure-appconfiguration-provider azure-identity
import os
from azure.identity import DefaultAzureCredential
from azure.appconfiguration.provider import load, SettingSelector

config = load(endpoint=os.environ["APPCONFIG_ENDPOINT"], credential=DefaultAzureCredential(),
              selects=[SettingSelector(key_filter="*", label_filter="\\0"),     # keys with no label
                       SettingSelector(key_filter="*", label_filter="prod")],   # prod overrides them
              keyvault_credential=DefaultAzureCredential(),                     # resolves Key Vault references
              feature_flag_enabled=True)
for k in config:
    print(k, "=", config[k])`,
  'otel_app.py': `# otel_app.py: a chat API instrumented with OpenTelemetry, exporting to Application Insights
# pip install azure-monitor-opentelemetry
from azure.monitor.opentelemetry import configure_azure_monitor
from opentelemetry import trace

configure_azure_monitor()          # reads APPLICATIONINSIGHTS_CONNECTION_STRING
tracer = trace.get_tracer(__name__)

def handle(path):
    with tracer.start_as_current_span(path):           # one operation_Id for the whole request
        read_from_cosmos()                             # dependency span
        call_model()                                   # dependency span (may time out)

for path in ["GET /chat", "GET /health", "POST /chat"]:
    handle(path)`,
};

export const DEV_PKGS = ['azure-cosmos', 'azure-identity', 'redis', 'redis-entraid', 'azure-servicebus', 'azure-eventgrid', 'azure-keyvault-secrets', 'azure-appconfiguration', 'azure-appconfiguration-provider', 'azure-monitor-opentelemetry', 'opentelemetry-api', 'psycopg', 'psycopg2-binary', 'pgvector', 'fastapi', 'uvicorn', 'azure-functions'];
const AI_PKGS = ['azure-ai-projects', 'azure-identity', 'azure-ai-textanalytics', 'azure-cognitiveservices-speech', 'azure-ai-contentunderstanding', 'openai', 'python-dotenv'];

/* ------------------------------------------------------------------ */
/* container images                                                    */
/* ------------------------------------------------------------------ */
interface Pull { ok: boolean; reason?: string; port: number }
function imagePull(w: World, image: string, auth: (acr: Res) => boolean): Pull {
  const img = image ?? '';
  const m = img.match(/^([a-z0-9]+)\.azurecr\.io\/([^:@]+)(?::([\w.{}-]+))?$/i);
  if (m) {
    const acr = w.res.find((r) => r.type === 'acr' && lc(r.name) === lc(m[1]));
    if (!acr) return { ok: false, reason: `dial tcp: lookup ${m[1]}.azurecr.io: no such host`, port: 8000 };
    const tag = m[3] ?? 'latest';
    const tags = (P(acr).repos[m[2]] ?? []) as { tag: string }[];
    if (!tags.some((t) => t.tag === tag)) return { ok: false, reason: `manifest for ${img} not found: manifest unknown`, port: 8000 };
    if (!auth(acr)) return { ok: false, reason: `unauthorized: authentication required (the app's identity needs AcrPull on ${acr.name})`, port: 8000 };
    return { ok: true, port: 8000 };
  }
  if (/:v9$|:doesnotexist$/.test(img)) return { ok: false, reason: `manifest for ${img} not found: manifest unknown`, port: 80 };
  return { ok: true, port: /quickstart|helloworld|nginx/.test(img) ? 80 : 8000 };
}

/* ------------------------------------------------------------------ */
/* Azure Container Registry                                            */
/* ------------------------------------------------------------------ */
function needAcr(w: World, name?: string) { return needName(w, 'acr', name, 'Container registry'); }
function pushImage(w: World, acr: Res, repo: string, tag: string, via: string) {
  const digest = `sha256:${hex(64)}`;
  const list = ((P(acr).repos[repo] ??= []) as { tag: string; digest: string; at: number }[]).filter((t) => t.tag !== tag);
  list.push({ tag, digest, at: Date.now() });
  P(acr).repos[repo] = list;
  return digest;
}
function buildLog(acr: Res, image: string, file: string, runId: string, digest: string, context: string) {
  return [`Packing source code into tar to upload...`, `Uploading archived source code from '${context}'...`, `Queued a build with ID: ${runId}`, `Waiting for an agent...`,
    `2026/11/18 10:02:11 Downloading source code...`, `2026/11/18 10:02:13 Using acb_vol_${hex(8)} as the home volume`, `Step 1/7 : FROM python:3.12-slim`, `Step 2/7 : WORKDIR /app`, `Step 3/7 : COPY requirements.txt .`,
    `Step 4/7 : RUN pip install --no-cache-dir -r requirements.txt`, `Step 5/7 : COPY . .`, `Step 6/7 : EXPOSE 8000`, `Step 7/7 : CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`,
    `Successfully built ${hex(12)}`, `Successfully tagged ${P(acr).loginServer}/${image}`, `Pushing image: ${P(acr).loginServer}/${image}`, `${image.split(':')[1] ?? 'latest'}: digest: ${digest} size: 2417`,
    `(Dockerfile: ${file}. The build ran on an ACR Tasks agent in Azure, no Docker needed in Cloud Shell.)`, `Run ID: ${runId} was successful after 41s`].join('\n');
}
const splitImage = (s: string) => { const [repo, tag] = s.split(':'); return [repo, tag || 'latest'] as const; };

/* ------------------------------------------------------------------ */
/* Container Apps                                                      */
/* ------------------------------------------------------------------ */
interface Rev { name: string; image: string; active: boolean; weight: number; created: number; env: Record<string, string> }
interface Rule { name: string; type: string; metadata: Record<string, string>; auth: string[] }
const kv = (list: string[]) => Object.fromEntries(list.filter((x) => x.includes('=')).map((x) => [x.slice(0, x.indexOf('=')), x.slice(x.indexOf('=') + 1)]));
function acaPull(w: World, app: Res, image: string) {
  return imagePull(w, image, (acr) => !!P(app).registry && (P(app).registry.identity === 'system' ? hasDataRole(w, identityOf(app), acr, ACR_PULL) || P(app).registry.autoRole : true));
}
function newRevision(w: World, app: Res, suffix: string | undefined, image: string, envVars: Record<string, string>) {
  const revs = P(app).revisions as Rev[];
  const name = `${app.name}--${suffix || hex(7)}`;
  if (revs.some((r) => r.name === name)) throw new SimError(`Revision '${name}' already exists. Use a different --revision-suffix.`, 'Conflict');
  const rev: Rev = { name, image, active: true, weight: 0, created: Date.now(), env: envVars };
  if (P(app).mode === 'single') { revs.forEach((r) => { r.active = false; r.weight = 0; }); rev.weight = 100; }
  else if (!revs.length) rev.weight = 100;
  revs.push(rev);
  w.emit('aca.revision', { app: app.name, name, image, mode: P(app).mode, weight: rev.weight });
  return rev;
}
function rulesFrom(p: Parsed): Rule[] {
  const name = one(p, '--scale-rule-name');
  if (!name) return [];
  return [{ name, type: one(p, '--scale-rule-type') ?? 'http', metadata: kv(many(p, '--scale-rule-metadata')), auth: many(p, '--scale-rule-auth') }];
}
/** KEDA: work out replicas from queue length for every container app with a Service Bus rule. */
export function kedaTick(w: World) {
  for (const app of w.res.filter((r) => r.type === 'containerapp')) {
    const a = P(app);
    const rule = (a.rules as Rule[]).find((r) => r.type === 'azure-servicebus');
    if (!rule) continue;
    const q = rule.metadata.queueName;
    const ns = w.res.find((r) => r.type === 'sbns' && (!rule.metadata.namespace || lc(r.name) === lc(rule.metadata.namespace)) && P(r).queues[q]);
    const msgs = ns ? (P(ns).queues[q].active as unknown[]).length : 0;
    const per = Math.max(1, Number(rule.metadata.messageCount ?? 5));
    const want = msgs === 0 ? a.min : Math.min(a.max, Math.max(a.min, 1, Math.ceil(msgs / per)));
    if (want !== a.replicas) {
      const from = a.replicas;
      a.replicas = want;
      w.emit('aca.scaled', { app: app.name, from, to: want, queue: q, messages: msgs, reason: 'azure-servicebus' });
    }
  }
}

/* ------------------------------------------------------------------ */
/* AKS + kubectl                                                       */
/* ------------------------------------------------------------------ */
interface Deploy { name: string; image: string; replicas: number; history: string[]; env: Record<string, string>; needsEnv?: string; label: string; failedImage?: string }
interface Pod { name: string; deploy: string; image: string; status: string; ready: string; restarts: number; node: string; created: number }
const MANIFESTS: Record<string, { kind: 'Deployment' | 'Service'; name: string; image?: string; replicas?: number; needsEnv?: string; port?: number }[]> = {
  'deployment.yaml': [{ kind: 'Deployment', name: 'chat-api', image: 'mcr.microsoft.com/azuredocs/aks-helloworld:v1', replicas: 3 }],
  'deployment-broken.yaml': [{ kind: 'Deployment', name: 'chat-api', image: 'mcr.microsoft.com/azuredocs/aks-helloworld:v9', replicas: 3 }],
  'service.yaml': [{ kind: 'Service', name: 'chat-api', port: 80 }],
  'worker.yaml': [{ kind: 'Deployment', name: 'worker', image: 'docker.io/contoso/order-worker:1.4', replicas: 1, needsEnv: 'COSMOS_ENDPOINT' }],
};
function cluster(w: World): Res {
  const ctx = dev(w).kube as { rg: string; name: string } | undefined;
  const k = ctx && w.res.find((r) => r.type === 'aks' && lc(r.name) === lc(ctx.name) && lc(r.rg) === lc(ctx.rg));
  if (!k) throw new SimError(`E1118 10:02:11.123 memcache.go:265] couldn't get current server API group list: Get "http://localhost:8080/api?timeout=32s": dial tcp 127.0.0.1:8080: connect: connection refused\nThe connection to the server localhost:8080 was refused - did you specify the right host or port?\n(No kubeconfig yet. Run: az aks get-credentials -g <rg> -n <cluster>)`, 'Kube');
  P(k).k8s ??= { deployments: [], pods: [], services: [], events: [] };
  return k;
}
const k8 = (k: Res) => P(k).k8s as { deployments: Deploy[]; pods: Pod[]; services: { name: string; type: string; ip: string; port: number }[]; events: { type: string; reason: string; obj: string; msg: string; at: number }[] };
function podStatus(w: World, d: Deploy, image: string): [string, string, number] {
  if (!imagePull(w, image, () => true).ok) return ['ImagePullBackOff', '0/1', 0];
  if (d.needsEnv && !d.env[d.needsEnv]) return ['CrashLoopBackOff', '0/1', 4];
  return ['Running', '1/1', 0];
}
function kEvent(k: Res, type: string, reason: string, obj: string, msg: string) {
  k8(k).events.push({ type, reason, obj, msg, at: Date.now() });
  k8(k).events = k8(k).events.slice(-40);
}
function newPod(w: World, k: Res, d: Deploy, image: string): Pod {
  const [status, ready, restarts] = podStatus(w, d, image);
  const p: Pod = { name: `${d.name}-${(hash(image + d.name) % 0xffffffffff).toString(16).padStart(10, '0').slice(0, 10)}-${hex(5)}`, deploy: d.name, image, status, ready, restarts, node: `aks-nodepool1-${hash(k.name) % 99999999}-vmss00000${rnd(P(k).nodes ?? 2)}`, created: Date.now() };
  kEvent(k, 'Normal', 'Scheduled', `pod/${p.name}`, `Successfully assigned default/${p.name} to ${p.node}`);
  if (status === 'ImagePullBackOff') { kEvent(k, 'Warning', 'Failed', `pod/${p.name}`, `Failed to pull image "${image}": rpc error: code = NotFound desc = failed to pull and unpack image "${image}": not found`); kEvent(k, 'Normal', 'BackOff', `pod/${p.name}`, `Back-off pulling image "${image}"`); }
  else if (status === 'CrashLoopBackOff') kEvent(k, 'Warning', 'BackOff', `pod/${p.name}`, 'Back-off restarting failed container worker in pod');
  else kEvent(k, 'Normal', 'Started', `pod/${p.name}`, 'Started container');
  return p;
}
/** Reconcile pods for a deployment, the way a ReplicaSet does (with a stuck rolling update if the new image can't start). */
function reconcile(w: World, k: Res, d: Deploy) {
  const s = k8(k);
  const [status] = podStatus(w, d, d.image);
  const mine = s.pods.filter((p) => p.deploy === d.name);
  if (status === 'ImagePullBackOff' && mine.some((p) => p.status === 'Running' && p.image !== d.image)) {
    // Rolling update: max surge 25% -> one new pod tries the new image, the old pods keep serving.
    const old = mine.filter((p) => p.image !== d.image && p.status === 'Running').slice(0, d.replicas);
    const fresh = mine.find((p) => p.image === d.image) ?? newPod(w, k, d, d.image);
    s.pods = s.pods.filter((p) => p.deploy !== d.name).concat(old, fresh);
    d.failedImage = d.image;
    return;
  }
  d.failedImage = undefined;
  let keep = mine.filter((p) => p.image === d.image && p.status === status).slice(0, d.replicas);
  while (keep.length < d.replicas) keep = keep.concat(newPod(w, k, d, d.image));
  s.pods = s.pods.filter((p) => p.deploy !== d.name).concat(keep);
}
function targetPods(k: Res, args: string[], sel?: string): Pod[] {
  const s = k8(k);
  if (sel) { const v = sel.split('=')[1]; return s.pods.filter((p) => p.deploy === v); }
  const t = args.find((a) => !/^(pod|pods|po)$/.test(a)) ?? '';
  const m = t.match(/^(?:deploy|deployment|deployments)\/(.+)$/);
  if (m) return s.pods.filter((p) => p.deploy === m[1]).slice(0, 1);
  return s.pods.filter((p) => p.name === t);
}
function deployArg(k: Res, args: string[]): Deploy {
  const s = k8(k);
  const t = args.join(' ').replace(/^(?:deployment|deploy|deployments)[ /]/, '').trim();
  const d = s.deployments.find((x) => x.name === t);
  if (!d) throw new SimError(`Error from server (NotFound): deployments.apps "${t}" not found`, 'Kube');
  return d;
}
const age = (t: number) => { const s = Math.max(1, Math.round((Date.now() - t) / 1000)); return s < 120 ? `${s}s` : `${Math.round(s / 60)}m`; };

function kubectl(args: string[], w: World): DevOut {
  const flags: Record<string, string> = {};
  const pos: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) { const [k, v] = a.split('='); flags[k] = v ?? (['--previous', '--all', '--watch', '--follow'].includes(k) ? 'true' : args[++i] ?? ''); }
    else if (/^-[lfonw]$/.test(a)) flags[a] = a === '-w' ? 'true' : args[++i] ?? '';
    else pos.push(a);
  }
  const verb = pos.shift() ?? '';
  if (!verb || verb === 'help') return { out: KUBECTL_HELP };
  if (verb === 'version') return { out: 'Client Version: v1.31.2\nServer Version: v1.31.1 (practice cluster)' };
  const k = cluster(w);
  const s = k8(k);
  const emit = (type: string, data: Props) => w.emit(type, { cluster: k.name, ...data });
  switch (verb) {
    case 'apply': {
      const file = flags['-f'] ?? flags['--filename'];
      if (!file) return { error: 'error: must specify one of -f and -k' };
      const m = MANIFESTS[file];
      if (!m) return { error: `error: the path "${file}" does not exist${FILES[file] ? ' as a Kubernetes manifest' : ''}. Manifests here: ${Object.keys(MANIFESTS).join(', ')}` };
      const lines: string[] = [];
      for (const o of m) {
        if (o.kind === 'Service') {
          const ex = s.services.find((x) => x.name === o.name);
          if (!ex) s.services.push({ name: o.name, type: 'LoadBalancer', ip: `20.${80 + rnd(100)}.${rnd(250)}.${1 + rnd(250)}`, port: o.port ?? 80 });
          lines.push(`service/${o.name} ${ex ? 'unchanged' : 'created'}`);
          emit('k8s.apply', { file, kind: 'Service', name: o.name, ok: true });
          continue;
        }
        let d = s.deployments.find((x) => x.name === o.name);
        const created = !d;
        if (!d) { d = { name: o.name, image: o.image!, replicas: o.replicas ?? 1, history: [o.image!], env: {}, needsEnv: o.needsEnv, label: o.name }; s.deployments.push(d); }
        else if (d.image !== o.image) { d.image = o.image!; d.history.push(o.image!); d.replicas = o.replicas ?? d.replicas; }
        reconcile(w, k, d);
        lines.push(`deployment.apps/${o.name} ${created ? 'created' : d.history.length > 1 && d.history[d.history.length - 1] === o.image ? 'configured' : 'unchanged'}`);
        emit('k8s.apply', { file, kind: 'Deployment', name: o.name, image: d.image, ok: true });
      }
      return { out: lines.join('\n') };
    }
    case 'get': {
      const what = (pos[0] ?? '').toLowerCase();
      const wide = flags['-o'] === 'wide';
      emit('k8s.get', { what });
      if (/^(po|pod|pods)$/.test(what)) {
        const rows = s.pods.map((p) => ({ NAME: p.name, READY: p.ready, STATUS: p.status, RESTARTS: p.restarts ? `${p.restarts} (${10 + rnd(40)}s ago)` : '0', AGE: age(p.created), ...(wide ? { NODE: p.node } : {}) }));
        return { out: table(rows, ['NAME', 'READY', 'STATUS', 'RESTARTS', 'AGE', ...(wide ? ['NODE'] : [])]) || 'No resources found in default namespace.' };
      }
      if (/^(deploy|deployment|deployments)$/.test(what)) {
        const rows = s.deployments.map((d) => { const pods = s.pods.filter((p) => p.deploy === d.name); const ready = pods.filter((p) => p.status === 'Running').length; return { NAME: d.name, READY: `${ready}/${d.replicas}`, 'UP-TO-DATE': pods.filter((p) => p.image === d.image).length, AVAILABLE: ready, AGE: '2m' }; });
        return { out: table(rows, ['NAME', 'READY', 'UP-TO-DATE', 'AVAILABLE', 'AGE']) || 'No resources found in default namespace.' };
      }
      if (/^(svc|service|services)$/.test(what)) {
        const rows = [{ NAME: 'kubernetes', TYPE: 'ClusterIP', 'CLUSTER-IP': '10.0.0.1', 'EXTERNAL-IP': '<none>', 'PORT(S)': '443/TCP' }, ...s.services.map((x) => ({ NAME: x.name, TYPE: x.type, 'CLUSTER-IP': `10.0.${hash(x.name) % 250}.${hash(x.name + 'i') % 250}`, 'EXTERNAL-IP': x.ip, 'PORT(S)': `${x.port}:3${hash(x.name) % 2000 + 1000}/TCP` }))];
        return { out: table(rows, ['NAME', 'TYPE', 'CLUSTER-IP', 'EXTERNAL-IP', 'PORT(S)']) };
      }
      if (/^(ev|event|events)$/.test(what)) return { out: table(s.events.slice(-15).map((e) => ({ 'LAST SEEN': age(e.at), TYPE: e.type, REASON: e.reason, OBJECT: e.obj, MESSAGE: e.msg })), ['LAST SEEN', 'TYPE', 'REASON', 'OBJECT', 'MESSAGE']) || 'No events found in default namespace.' };
      if (/^(no|node|nodes)$/.test(what)) return { out: table(Array.from({ length: P(k).nodes ?? 2 }, (_, i) => ({ NAME: `aks-nodepool1-${hash(k.name) % 99999999}-vmss00000${i}`, STATUS: 'Ready', ROLES: '<none>', AGE: '9m', VERSION: 'v1.31.1' })), ['NAME', 'STATUS', 'ROLES', 'AGE', 'VERSION']) };
      return { error: `error: the server doesn't have a resource type "${what}". Try: pods, deployments, services, events, nodes` };
    }
    case 'describe': {
      const pods = targetPods(k, pos, flags['-l']);
      if (!pods.length) return { error: `Error from server (NotFound): pods "${pos.slice(1).join(' ') || flags['-l']}" not found` };
      const reasons = new Set<string>();
      const text = pods.map((p) => {
        const ev = s.events.filter((e) => e.obj === `pod/${p.name}`);
        ev.forEach((e) => reasons.add(e.reason));
        if (p.status !== 'Running') reasons.add(p.status);
        return [`Name:         ${p.name}`, `Namespace:    default`, `Node:         ${p.node}`, `Labels:       app=${p.deploy}`, `Status:       ${p.status === 'Running' ? 'Running' : 'Pending'}`, `Containers:`, `  ${p.deploy}:`, `    Image:          ${p.image}`, `    State:          ${p.status === 'Running' ? 'Running' : `Waiting\n      Reason:       ${p.status}`}`, `    Ready:          ${p.status === 'Running'}`, `    Restart Count:  ${p.restarts}`, `Events:`, `  Type     Reason     Age   From               Message`, `  ----     ------     ----  ----               -------`, ...ev.map((e) => `  ${e.type.padEnd(8)} ${e.reason.padEnd(10)} ${age(e.at).padEnd(5)} ${e.reason === 'Scheduled' ? 'default-scheduler' : 'kubelet'.padEnd(17)}  ${e.msg}`)].join('\n');
      }).join('\n\n');
      emit('k8s.describe', { pods: pods.length, reasons: [...reasons] });
      return { out: text };
    }
    case 'logs': {
      const pods = targetPods(k, pos, flags['-l']);
      if (!pods.length) return { error: `error: pod or deployment "${pos.join(' ')}" not found. Try: kubectl get pods` };
      const p = pods[0];
      const prev = flags['--previous'] === 'true' || flags['-p'] === 'true';
      const crash = p.status === 'CrashLoopBackOff';
      emit('k8s.logs', { pod: p.name, deploy: p.deploy, previous: prev, crash });
      if (p.status === 'ImagePullBackOff') return { error: `Error from server (BadRequest): container "${p.deploy}" in pod "${p.name}" is waiting to start: trying and failing to pull image` };
      if (crash) return { out: prev ? `Starting order worker 1.4\nTraceback (most recent call last):\n  File "/app/worker.py", line 7, in <module>\n    endpoint = os.environ["COSMOS_ENDPOINT"]\n               ~~~~~~~~~~^^^^^^^^^^^^^^^^^^^\n  File "<frozen os>", line 714, in __getitem__\nKeyError: 'COSMOS_ENDPOINT'` : 'Starting order worker 1.4\n(The container exits a second later. Add --previous to see the logs of the crashed run.)' };
      if (p.deploy === 'worker') return { out: `Starting order worker 1.4\nConnected to ${(s.deployments.find((d) => d.name === 'worker')?.env.COSMOS_ENDPOINT) ?? 'Cosmos DB'}\nProcessed 12 orders` };
      return { out: `10.244.0.1 - - [18/Nov/2026:10:02:11 +0000] "GET / HTTP/1.1" 200 629 "-" "kube-probe/1.31"\n10.244.0.1 - - [18/Nov/2026:10:02:21 +0000] "GET / HTTP/1.1" 200 629 "-" "kube-probe/1.31"` };
    }
    case 'scale': {
      const n = Number(flags['--replicas']);
      if (!Number.isInteger(n) || n < 0) return { error: 'error: --replicas=COUNT is required, e.g. kubectl scale deployment chat-api --replicas=5' };
      const d = deployArg(k, pos);
      const from = d.replicas;
      d.replicas = n;
      reconcile(w, k, d);
      emit('k8s.scale', { name: d.name, from, to: n });
      return { out: `deployment.apps/${d.name} scaled` };
    }
    case 'delete': {
      const what = pos[0] ?? '';
      if (!/^(po|pod|pods)$/.test(what)) return { error: 'This practice cluster deletes pods only, e.g. kubectl delete pod -l app=chat-api' };
      const pods = targetPods(k, pos, flags['-l']);
      if (!pods.length) return { error: `Error from server (NotFound): pods "${pos[1] ?? flags['-l']}" not found` };
      s.pods = s.pods.filter((p) => !pods.includes(p));
      const deps = [...new Set(pods.map((p) => p.deploy))];
      deps.forEach((n) => { const d = s.deployments.find((x) => x.name === n); if (d) reconcile(w, k, d); });
      emit('k8s.delete', { count: pods.length });
      emit('k8s.selfheal', { deployments: deps, replaced: pods.length });
      return { out: `${pods.map((p) => `pod "${p.name}" deleted`).join('\n')}\n(The ReplicaSet noticed fewer pods than desired and started ${pods.length} new one${pods.length > 1 ? 's' : ''}. Run kubectl get pods.)` };
    }
    case 'rollout': {
      const sub = pos.shift();
      const d = deployArg(k, pos);
      if (sub === 'status') {
        const ok = !d.failedImage && s.pods.filter((p) => p.deploy === d.name && p.status === 'Running').length >= d.replicas;
        emit('k8s.rollout.status', { name: d.name, ok });
        return ok ? { out: `deployment "${d.name}" successfully rolled out` } : { error: `Waiting for deployment "${d.name}" rollout to finish: 1 out of ${d.replicas} new replicas have been updated...\nerror: deployment "${d.name}" exceeded its progress deadline` };
      }
      if (sub === 'undo') {
        if (d.history.length < 2) return { error: `error: no rollout history found for deployment "${d.name}"` };
        d.history.pop();
        d.image = d.history[d.history.length - 1];
        reconcile(w, k, d);
        emit('k8s.rollout.undo', { name: d.name, image: d.image });
        return { out: `deployment.apps/${d.name} rolled back` };
      }
      if (sub === 'history') return { out: `deployment.apps/${d.name}\nREVISION  CHANGE-CAUSE\n${d.history.map((h, i) => `${i + 1}         ${h}`).join('\n')}` };
      return { error: 'usage: kubectl rollout status|undo|history deployment/<name>' };
    }
    case 'set': {
      if (pos.shift() !== 'env') return { error: 'usage: kubectl set env deployment/<name> KEY=value' };
      const pairs = pos.filter((x) => x.includes('='));
      const d = deployArg(k, pos.filter((x) => !x.includes('=')));
      Object.assign(d.env, kv(pairs));
      reconcile(w, k, d);
      emit('k8s.setenv', { name: d.name, keys: Object.keys(kv(pairs)) });
      return { out: `deployment.apps/${d.name} env updated` };
    }
  }
  return { error: `error: unknown command "${verb}" for "kubectl"\n${KUBECTL_HELP}` };
}
const KUBECTL_HELP = `kubectl (practice cluster). Try:
  kubectl apply -f deployment.yaml          kubectl get pods | deployments | svc | events | nodes
  kubectl describe pods -l app=chat-api     kubectl logs deploy/worker --previous
  kubectl scale deployment chat-api --replicas=5
  kubectl delete pod -l app=chat-api        kubectl rollout status|undo deployment/chat-api
  kubectl set env deployment/worker KEY=value`;

/* ------------------------------------------------------------------ */
/* Cosmos DB                                                           */
/* ------------------------------------------------------------------ */
interface Item { id: string; [k: string]: any }
interface Cont { pk: string; throughput: number; idx: Props; vec: Props | null; items: Item[]; lsn: number; lease: number | null }
function readPolicy(v?: string): Props | null {
  if (!v) return null;
  const text = v.startsWith('@') ? FILES[v.slice(1)] : v;
  if (text === undefined) throw new SimError(`File '${v.slice(1)}' not found. Files here: ${Object.keys(FILES).filter((f) => f.endsWith('.json')).join(', ')}`, 'FileNotFound');
  try { return JSON.parse(text); } catch { throw new SimError(`'${v}' is not valid JSON.`, 'InvalidPolicy'); }
}
function indexed(idx: Props, path: string) {
  const inc = (idx.includedPaths ?? [{ path: '/*' }]).map((x: Props) => x.path as string);
  const exc = (idx.excludedPaths ?? []).map((x: Props) => x.path as string);
  const m = (pat: string) => pat === '/*' || pat === `${path}/?` || pat === `${path}/*`;
  if (inc.some((p: string) => p === `${path}/?` || p === `${path}/*`)) return true;
  if (exc.some((p: string) => p !== '/*' && m(p))) return false;
  if (exc.includes('/*')) return false;
  return inc.includes('/*');
}
function container(w: World, db: string, name: string): [Res, Cont] {
  const v = envOf(w).COSMOS_ENDPOINT;
  if (!v) throw new SimError(`KeyError: 'COSMOS_ENDPOINT'\nSet it first: export COSMOS_ENDPOINT=https://<account>.documents.azure.com:443/`, 'Python');
  const m = v.match(/^https:\/\/([a-z0-9-]+)\.documents\.azure\.com(:443)?\/?$/i);
  const acct = m && byName(w, 'cosmos', m[1]);
  if (!acct) throw new SimError(`azure.core.exceptions.ServiceRequestError: can't reach '${v}'. The format is https://<account>.documents.azure.com:443/`, 'Python');
  const c = P(acct).dbs[db]?.containers?.[name] as Cont | undefined;
  if (!c) throw new SimError(`azure.cosmos.exceptions.CosmosResourceNotFoundError: (NotFound) Resource Not Found. ${P(acct).dbs[db] ? `Container '${name}'` : `Database '${db}'`} does not exist in account '${acct.name}'. Create it with az cosmosdb sql ${P(acct).dbs[db] ? 'container' : 'database'} create.`, 'Python');
  return [acct, c];
}
const ORDERS = [
  { id: 'order-1001', customerId: 'cust-42', status: 'shipped', total: 2400, notes: 'Leave at the gate' },
  { id: 'order-1002', customerId: 'cust-42', status: 'pending', total: 650 },
  { id: 'order-1003', customerId: 'cust-7', status: 'shipped', total: 120 },
  { id: 'order-1004', customerId: 'cust-7', status: 'cancelled', total: 980 },
  { id: 'order-1005', customerId: 'cust-19', status: 'shipped', total: 3150 },
  { id: 'order-1006', customerId: 'cust-19', status: 'pending', total: 75 },
];
const CATALOG = [
  { id: 'p1', category: 'outdoor', name: 'Monsoon trek rain jacket', description: 'waterproof breathable jacket with taped seams for heavy rain and trekking' },
  { id: 'p2', category: 'outdoor', name: 'Light trail backpack 20L', description: 'lightweight backpack with a rain cover for day hikes' },
  { id: 'p3', category: 'outdoor', name: 'Insulated steel bottle', description: 'keeps water cold for 24 hours on long treks' },
  { id: 'p4', category: 'electronics', name: 'Noise cancelling headphones', description: 'wireless over-ear headphones for travel and calls' },
  { id: 'p5', category: 'electronics', name: 'Smart fitness band', description: 'tracks steps, heart rate and sleep, water resistant' },
  { id: 'p6', category: 'clothing', name: 'Cotton kurta', description: 'breathable cotton kurta for hot summer days' },
  { id: 'p7', category: 'clothing', name: 'Quick-dry hiking trousers', description: 'stretchy quick drying trousers for trekking in wet weather' },
  { id: 'p8', category: 'kitchen', name: 'Stovetop espresso maker', description: 'makes strong coffee on a gas stove' },
];
const NEW_PRODUCTS = [{ id: 'p9', category: 'outdoor', name: 'Waterproof trekking boots', description: 'ankle-high waterproof boots with grip for muddy monsoon trails' }];
const SYN: Record<string, string> = { rain: 'wet', rainy: 'wet', monsoon: 'wet', waterproof: 'wet', wet: 'wet', water: 'wet', trek: 'hike', trekking: 'hike', treks: 'hike', hike: 'hike', hikes: 'hike', hiking: 'hike', trail: 'hike', trails: 'hike', jacket: 'jacket', coat: 'jacket', shoes: 'boots', boots: 'boots', boot: 'boots', headphones: 'audio', music: 'audio', earphones: 'audio', coffee: 'coffee', espresso: 'coffee' };
const terms = (s: string) => [...new Set((lc(s).match(/[a-z]{3,}/g) ?? []).map((t) => SYN[t] ?? t.replace(/(ing|s)$/, '')))];
function similarity(a: string, b: string) {
  const A = terms(a), B = terms(b);
  const both = A.filter((t) => B.includes(t)).length;
  return Math.min(0.97, 0.18 + both / Math.sqrt(A.length * B.length || 1) * 0.9);
}
function upsertItem(c: Cont, item: Item) {
  c.lsn += 1;
  const i = c.items.findIndex((x) => x.id === item.id);
  const merged = { ...(i >= 0 ? c.items[i] : {}), ...item, _lsn: c.lsn };
  if (i >= 0) c.items[i] = merged; else c.items.push(merged);
}

/* ------------------------------------------------------------------ */
/* PostgreSQL                                                          */
/* ------------------------------------------------------------------ */
function psql(args: string[], w: World): DevOut {
  let host = '', user = '', db = 'postgres', sql = '', file = '';
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-h' || a === '--host') host = args[++i] ?? '';
    else if (a === '-U' || a === '--username') user = args[++i] ?? '';
    else if (a === '-d' || a === '--dbname') db = args[++i] ?? db;
    else if (a === '-p' || a === '--port') i++;
    else if (a === '-c' || a === '--command') sql = args[++i] ?? '';
    else if (a === '-f' || a === '--file') file = args[++i] ?? '';
    else if (/host=/.test(a)) { host = /host=(\S+)/.exec(a)?.[1] ?? ''; user = /user=(\S+)/.exec(a)?.[1] ?? user; db = /dbname=(\S+)/.exec(a)?.[1] ?? db; }
  }
  host ||= envOf(w).PGHOST ?? '';
  user ||= envOf(w).PGUSER ?? '';
  if (!host) return { error: 'psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: No such file or directory\n\tIs the server running locally and accepting connections on that socket?\n(Add -h <server>.postgres.database.azure.com)' };
  const name = host.replace(/\.postgres\.database\.azure\.com$/i, '');
  const srv = byName(w, 'pg', name);
  if (!srv || !/\.postgres\.database\.azure\.com$/i.test(host)) return { error: `psql: error: could not translate host name "${host}" to address: Name or service not known` };
  const s = P(srv);
  if (!s.publicAccess && !s.firewall.length) return { error: `psql: error: connection to server at "${host}" (20.62.12.4), port 5432 failed: Connection timed out\n\tIs the server running on that host and accepting TCP/IP connections?\n(The server has no firewall rule for Cloud Shell. Add one: az postgres flexible-server firewall-rule create …)` };
  if (user && lc(user) !== lc(s.admin)) return { error: `psql: error: connection to server at "${host}", port 5432 failed: FATAL:  password authentication failed for user "${user}"` };
  if (file) {
    sql = FILES[file] ?? '';
    if (!sql) return { error: `${file}: No such file or directory` };
  }
  if (!sql) return { error: 'This practice psql runs one command at a time: add -c "SQL;" or -f file.sql' };
  const stmts = sql.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n').split(';').map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const outs: string[] = [];
  for (const st of stmts) {
    const r = pgExec(w, srv, st, file);
    if (r.error) return { error: [...outs, r.error].join('\n') };
    outs.push(r.out ?? '');
  }
  return { out: outs.join('\n') };
}
function pgExec(w: World, srv: Res, st: string, file: string): DevOut {
  const d = P(srv).db as { ext: string[]; tables: Record<string, { rows: number }>; indexes: { name: string; method: string; col: string }[]; ef: number };
  const q = lc(st);
  const ok = (kind: string, out: string, extra: Props = {}) => { w.emit('pg.query', { server: srv.name, kind, ok: true, file, ...extra }); return { out }; };
  const fail = (kind: string, msg: string) => { w.emit('pg.query', { server: srv.name, kind, ok: false, error: msg.split('\n')[0], file }); return { error: msg }; };
  if (/^select version\(\)/.test(q)) return ok('select', ` version\n-----------------------------------------------------------------\n PostgreSQL ${P(srv).version}.4 on x86_64-pc-linux-gnu, compiled by gcc, 64-bit (Azure Database for PostgreSQL flexible server)\n(1 row)`);
  if (/^show azure\.extensions/.test(q)) return ok('show', ` azure.extensions\n------------------\n ${P(srv).params['azure.extensions'] || ''}\n(1 row)`);
  if (/^(\\dx|select \* from pg_extension)/.test(q)) return ok('select', table(['plpgsql', ...d.ext].map((e) => ({ Name: e, Version: e === 'vector' ? '0.8.0' : '1.0' })), ['Name', 'Version']));
  if (/^\\dt/.test(q)) return ok('select', table(Object.keys(d.tables).map((t) => ({ Schema: 'public', Name: t, Type: 'table', Owner: P(srv).admin })), ['Schema', 'Name', 'Type', 'Owner']) || 'Did not find any relations.');
  if (/^\\di/.test(q)) return ok('select', table(d.indexes.map((i) => ({ Name: i.name, Table: 'docs', Method: i.method })), ['Name', 'Table', 'Method']) || 'Did not find any relations.');
  let m = q.match(/^create extension (if not exists )?"?(\w+)"?/);
  if (m) {
    const allowed = (P(srv).params['azure.extensions'] as string).split(',').map((x) => lc(x.trim()));
    if (!allowed.includes(m[2])) return fail('extension', `ERROR:  extension "${m[2]}" is not allow-listed for "azure_pg_admin" users in Azure Database for PostgreSQL\nHINT:  to see the full allow list of extensions, please run: "show azure.extensions;"\n(Allow it first: az postgres flexible-server parameter set … -n azure.extensions --value ${m[2].toUpperCase()})`);
    if (!d.ext.includes(m[2])) d.ext.push(m[2]);
    return ok('extension', 'CREATE EXTENSION', { extension: m[2] });
  }
  m = q.match(/^create table (if not exists )?(\w+)/);
  if (m) {
    if (/vector\(/.test(q) && !d.ext.includes('vector')) return fail('create-table', 'ERROR:  type "vector" does not exist\n(Run CREATE EXTENSION vector; first.)');
    d.tables[m[2]] ??= { rows: 0 };
    return ok('create-table', 'CREATE TABLE', { table: m[2] });
  }
  m = q.match(/^create index (if not exists )?(\w+)? ?on (\w+)(?: using (\w+))? \(([^)]*)\)/);
  if (m) {
    if (!d.tables[m[3]]) return fail('index', `ERROR:  relation "${m[3]}" does not exist`);
    const method = m[4] ?? 'btree';
    if ((method === 'hnsw' || method === 'ivfflat') && !d.ext.includes('vector')) return fail('index', `ERROR:  access method "${method}" does not exist`);
    const name = m[2] ?? `${m[3]}_${m[5].split(' ')[0]}_idx`;
    if (!d.indexes.some((i) => i.name === name)) d.indexes.push({ name, method, col: m[5].split(' ')[0] });
    return ok('index', 'CREATE INDEX', { method, name });
  }
  m = q.match(/^set hnsw\.ef_search = (\d+)/);
  if (m) { d.ef = Number(m[1]); return ok('set', 'SET', { efSearch: d.ef }); }
  if (/^insert into docs/.test(q)) {
    if (!d.tables.docs) return fail('load', 'ERROR:  relation "docs" does not exist\n(Run psql … -f schema.sql first.)');
    d.tables.docs.rows += /generate_series\(1, 5000\)/.test(q) ? 5000 : 1;
    return ok('load', `INSERT 0 ${/generate_series\(1, 5000\)/.test(q) ? 5000 : 1}`, { rows: d.tables.docs.rows });
  }
  const docs = d.tables.docs;
  if (/^explain/.test(q)) {
    if (!docs) return fail('explain', 'ERROR:  relation "docs" does not exist');
    const hnsw = d.indexes.find((i) => i.method === 'hnsw' || i.method === 'ivfflat');
    const scan = hnsw && /<=>/.test(q) ? 'index' : 'seq';
    const plan = scan === 'index'
      ? ` Limit  (cost=12.46..14.21 rows=5 width=40) (actual time=1.402..1.611 rows=5 loops=1)\n   ->  Index Scan using ${hnsw!.name} on docs  (cost=12.46..1760.46 rows=${docs.rows} width=40) (actual time=1.400..1.607 rows=5 loops=1)\n         Order By: (embedding <=> $0)\n Planning Time: 0.210 ms\n Execution Time: 1.702 ms`
      : ` Limit  (cost=1621.13..1621.14 rows=5 width=40) (actual time=48.920..48.923 rows=5 loops=1)\n   ->  Sort  (cost=1621.13..1633.63 rows=${docs.rows} width=40) (actual time=48.918..48.920 rows=5 loops=1)\n         Sort Key: ((embedding <=> $0))\n         ->  Seq Scan on docs  (cost=0.00..1538.00 rows=${docs.rows} width=40) (actual time=0.031..46.802 rows=${docs.rows} loops=1)\n Planning Time: 0.190 ms\n Execution Time: 49.016 ms\n(Every row was compared. Add an HNSW index on embedding to fix this.)`;
    return ok('explain', ` QUERY PLAN\n${'-'.repeat(60)}\n${plan}`, { scan, rows: docs.rows });
  }
  if (/^select/.test(q) && /<=>|<->|<#>/.test(q)) {
    if (!docs) return fail('similarity', 'ERROR:  relation "docs" does not exist');
    if (!docs.rows) return ok('similarity', ' id | title | distance\n----+-------+----------\n(0 rows)\n(The table is empty. Run psql … -f load_docs.sql)', { tenantFilter: false, rows: 0 });
    const tenant = /where tenant_id = '(\w+)'/.exec(q)?.[1];
    const ids = tenant ? [42, 45, 1002].map((n) => n + (['contoso', 'fabrikam', 'northwind'].indexOf(tenant) + 3) % 3 - (n % 3)) : [42, 1841, 3307];
    const rows = ids.map((id, i) => ` ${String(id).padEnd(4)} | Policy doc ${id}${' '.repeat(Math.max(1, 6 - String(id).length))}| ${i === 0 ? '0.0000' : (0.1012 + i * 0.0137).toFixed(4)}`);
    return ok('similarity', ` id   | title          | distance\n------+----------------+----------\n${rows.join('\n')}\n(3 rows)${tenant ? `\n(Only '${tenant}' rows came back: the WHERE filter keeps each tenant's data separate.)` : '\n(No tenant filter: these rows may belong to any tenant.)'}`, { tenantFilter: !!tenant, tenant, rows: 3 });
  }
  if (/^select count\(\*\) from docs/.test(q)) return docs ? ok('select', ` count\n-------\n ${docs.rows}\n(1 row)`) : fail('select', 'ERROR:  relation "docs" does not exist');
  if (/^select/.test(q)) return ok('select', ' ?column?\n----------\n        1\n(1 row)');
  return fail('other', `(This practice psql understands SELECT version(), SHOW azure.extensions, CREATE EXTENSION, CREATE TABLE, CREATE INDEX, SET hnsw.ef_search, EXPLAIN, similarity SELECTs, \\dx, \\dt and \\di.)`);
}

/* ------------------------------------------------------------------ */
/* Redis                                                               */
/* ------------------------------------------------------------------ */
const clock = (w: World) => (dev(w).clock ??= 0) as number;
function redisFor(w: World, host: string) {
  return w.res.find((r) => r.type === 'redis' && lc(P(r).host) === lc(host));
}
function purge(w: World, r: Res) {
  const data = P(r).data as Record<string, { v: any; exp: number | null }>;
  const t = clock(w);
  const gone: string[] = [];
  for (const [k, v] of Object.entries(data)) if (v.exp !== null && v.exp <= t) { delete data[k]; gone.push(k); }
  P(r).expired = [...new Set([...(P(r).expired ?? []), ...gone])].slice(-50);
}
function redisCmd(w: World, r: Res, argv: string[]): DevOut {
  purge(w, r);
  const data = P(r).data as Record<string, { v: any; exp: number | null; hash?: boolean }>;
  const cmd = (argv[0] ?? '').toUpperCase();
  const k = argv[1];
  const emit = (extra: Props = {}) => w.emit('redis.cmd', { cache: r.name, cmd, key: k, ok: true, ...extra });
  const t = clock(w);
  switch (cmd) {
    case 'PING': emit(); return { out: 'PONG' };
    case 'SET': {
      if (!k || argv[2] === undefined) return { error: "(error) ERR wrong number of arguments for 'set' command" };
      const up = argv.map((a) => a.toUpperCase());
      const ex = up.indexOf('EX') > 0 ? Number(argv[up.indexOf('EX') + 1]) : up.indexOf('PX') > 0 ? Number(argv[up.indexOf('PX') + 1]) / 1000 : null;
      if (up.includes('NX') && data[k]) { emit({ nx: true, set: false }); return { out: '(nil)' }; }
      data[k] = { v: argv[2], exp: ex ? t + ex : null };
      emit({ ex });
      return { out: 'OK' };
    }
    case 'GET': {
      const v = data[k];
      const expired = !v && (P(r).expired ?? []).includes(k);
      if (v) P(r).hits++; else P(r).misses++;
      emit({ hit: !!v, expired });
      return { out: v ? `"${v.v}"` : '(nil)' };
    }
    case 'TTL': { const v = data[k]; const n = !v ? -2 : v.exp === null ? -1 : Math.ceil(v.exp - t); emit({ ttl: n }); return { out: `(integer) ${n}` }; }
    case 'EXPIRE': { const v = data[k]; if (v) v.exp = t + Number(argv[2]); emit({ ex: Number(argv[2]) }); return { out: `(integer) ${v ? 1 : 0}` }; }
    case 'DEL': { const n = argv.slice(1).filter((x) => data[x] && delete data[x]).length; emit({ deleted: n }); return { out: `(integer) ${n}` }; }
    case 'INCR': { const v = data[k] ?? (data[k] = { v: '0', exp: null }); v.v = String(Number(v.v) + 1); emit(); return { out: `(integer) ${v.v}` }; }
    case 'EXISTS': emit(); return { out: `(integer) ${data[k] ? 1 : 0}` };
    case 'DBSIZE': emit(); return { out: `(integer) ${Object.keys(data).length}` };
    case 'KEYS': emit(); return { out: Object.keys(data).map((x, i) => `${i + 1}) "${x}"`).join('\n') + '\n(KEYS scans every key and blocks the server. In production use SCAN.)' };
    case 'HSET': { const h = (data[k] ??= { v: {}, exp: null, hash: true }); for (let i = 2; i + 1 < argv.length; i += 2) h.v[argv[i]] = argv[i + 1]; emit(); return { out: `(integer) ${Math.floor((argv.length - 2) / 2)}` }; }
    case 'HGETALL': { const h = data[k]; emit({ hit: !!h }); return { out: h?.hash ? Object.entries(h.v).map(([f, v], i) => `${2 * i + 1}) "${f}"\n${2 * i + 2}) "${v}"`).join('\n') : '(empty array)' }; }
    case 'FT.CREATE': {
      if (!(P(r).modules as string[]).some((m) => lc(m) === 'redisearch')) return { error: "(error) ERR unknown command 'FT.CREATE'\n(The RediSearch module isn't enabled. Modules are chosen when the cache is created: --modules name=RediSearch)" };
      if (P(r).idx[k]) return { error: '(error) Index already exists' };
      const up = argv.map((a) => a.toUpperCase());
      const prefix = up.indexOf('PREFIX') > 0 ? argv[up.indexOf('PREFIX') + 2] : '';
      const vector = up.includes('VECTOR');
      const algo = up.includes('HNSW') ? 'HNSW' : up.includes('FLAT') ? 'FLAT' : '';
      const dim = up.indexOf('DIM') > 0 ? Number(argv[up.indexOf('DIM') + 1]) : 0;
      P(r).idx[k] = { prefix, vector, algo, dim };
      emit({ index: k, vector, algo, dim });
      return { out: 'OK' };
    }
    case 'FT._LIST': emit(); return { out: Object.keys(P(r).idx).map((x, i) => `${i + 1}) "${x}"`).join('\n') || '(empty array)' };
    case 'FT.INFO': { const x = P(r).idx[k]; emit({ index: k }); return x ? { out: `1) index_name\n2) ${k}\n3) prefixes\n4) "${x.prefix}"\n5) vector\n6) ${x.vector ? `${x.algo} DIM ${x.dim}` : 'none'}` } : { error: `(error) ${k}: no such index` }; }
    case 'FT.SEARCH': { const x = P(r).idx[k]; emit({ index: k }); return x ? { out: '(integer) 0\n(For a KNN vector query you pass the query vector as a binary blob, so run: python redis_vector.py "your question")' } : { error: `(error) ${k}: no such index` }; }
    case 'FLUSHALL': for (const key of Object.keys(data)) delete data[key]; emit(); return { out: 'OK' };
  }
  return { error: `(error) ERR unknown command '${argv[0]}'. This practice cache understands PING, SET (EX/PX/NX), GET, TTL, EXPIRE, DEL, INCR, EXISTS, DBSIZE, KEYS, HSET, HGETALL, FT.CREATE, FT.INFO, FT._LIST, FT.SEARCH.` };
}
function redisCli(args: string[], w: World): DevOut {
  let host = '', port = 10000, tls = false;
  const rest: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-h') host = args[++i] ?? '';
    else if (a === '-p') port = Number(args[++i]);
    else if (a === '--tls') tls = true;
    else if (a === '-a' || a === '--user' || a === '--pass') i++;
    else if (a === '-c' || a === '--no-auth-warning') continue;
    else rest.push(a);
  }
  if (!host) return { error: 'Could not connect to Redis at 127.0.0.1:6379: Connection refused\n(Add -h <cache>.<region>.redis.azure.net -p 10000 --tls)' };
  const r = redisFor(w, host);
  if (!r) return { error: `Could not connect to Redis at ${host}:${port}: Name or service not known` };
  if (port !== 10000) return { error: `Could not connect to Redis at ${host}:${port}: Connection refused (Azure Managed Redis listens on port 10000)` };
  if (!tls) return { error: 'Error: Connection reset by peer\n(Azure Managed Redis only accepts TLS connections. Add --tls.)' };
  if (!rest.length) return { error: 'This practice redis-cli runs one command per line, e.g. redis-cli -h … -p 10000 --tls PING' };
  return redisCmd(w, r, rest);
}
const ARTICLES: [string, string][] = [
  ['Reset your Wi-Fi router', 'hold the reset button on the router for ten seconds then sign in again'],
  ['Slow internet at home', 'restart the router and move it away from walls to fix slow speeds'],
  ['When is my bill due', 'your bill date and payment due date are on the first page of the invoice'],
  ['Change your mobile plan', 'switch to a bigger data plan from the app any time'],
  ['Roaming abroad', 'turn on international roaming before you travel'],
  ['Check data usage', 'see how much data you used this month in the app'],
];

/* ------------------------------------------------------------------ */
/* Service Bus                                                         */
/* ------------------------------------------------------------------ */
interface Msg { id: string; orderId: number; amount: number; body: string; deliveryCount: number; poison?: boolean; reason?: string }
interface Q { maxDelivery: number; lock: string; active: Msg[]; dlq: Msg[] }
interface SubQ extends Q { rules: { name: string; sql: string }[] }
const AMOUNTS = [250, 1500, 80, 4200, 640, 99, 2300, 410, 1200, 75];
function nsFromEnv(w: World): Res {
  const v = envOf(w).SERVICEBUS_NAMESPACE;
  if (!v) throw new SimError(`KeyError: 'SERVICEBUS_NAMESPACE'\nSet it first: export SERVICEBUS_NAMESPACE=<namespace>.servicebus.windows.net`, 'Python');
  const m = v.replace(/^sb:\/\/|\/$/g, '').match(/^([a-z0-9-]+)\.servicebus\.windows\.net$/i);
  const ns = m && byName(w, 'sbns', m[1]);
  if (!ns) throw new SimError(`azure.servicebus.exceptions.ServiceBusConnectionError: can't reach '${v}'. Use the fully qualified namespace, e.g. sb-contoso.servicebus.windows.net`, 'Python');
  return ns;
}
function ruleMatch(sql: string, m: Msg) {
  const s = sql.trim();
  if (/^1\s*=\s*1$/.test(s) || /^true$/i.test(s)) return true;
  const x = s.match(/^(\w+)\s*(>=|<=|<>|!=|>|<|=)\s*'?([\w.-]+)'?$/);
  if (!x) return false;
  const props: Record<string, number | string> = { amount: m.amount, orderId: m.orderId, priority: m.amount > 1000 ? 'high' : 'normal' };
  const a = props[x[1]];
  const b = isNaN(Number(x[3])) ? x[3] : Number(x[3]);
  switch (x[2]) { case '>': return a > b; case '<': return a < b; case '>=': return a >= b; case '<=': return a <= b; case '=': return a == b; default: return a != b; }
}

/* ------------------------------------------------------------------ */
/* Monitoring: telemetry + KQL                                         */
/* ------------------------------------------------------------------ */
interface Tel { requests: Props[]; dependencies: Props[]; exceptions: Props[]; traces: Props[] }
const DEV_TABLES = ['requests', 'dependencies', 'exceptions', 'traces', 'apprequests', 'appdependencies', 'appexceptions', 'apptraces', 'containerappconsolelogs_cl', 'containerappsystemlogs_cl', 'union'];
export const isDevTable = (q: string) => DEV_TABLES.includes(lc((q ?? '').trim().split(/[\s|(]/)[0]));
function tel(w: World): Tel {
  const all: Tel = { requests: [], dependencies: [], exceptions: [], traces: [] };
  for (const a of w.res.filter((r) => r.type === 'appi')) for (const k of Object.keys(all) as (keyof Tel)[]) all[k].push(...(P(a).telemetry[k] ?? []));
  return all;
}
const LA: Record<string, [keyof Tel, Record<string, string>]> = {
  apprequests: ['requests', { timestamp: 'TimeGenerated', name: 'Name', resultCode: 'ResultCode', duration: 'DurationMs', success: 'Success', operation_Id: 'OperationId', cloud_RoleName: 'AppRoleName' }],
  appdependencies: ['dependencies', { timestamp: 'TimeGenerated', name: 'Name', target: 'Target', type: 'DependencyType', duration: 'DurationMs', success: 'Success', resultCode: 'ResultCode', operation_Id: 'OperationId' }],
  appexceptions: ['exceptions', { timestamp: 'TimeGenerated', type: 'ExceptionType', outerMessage: 'OuterMessage', operation_Id: 'OperationId', severityLevel: 'SeverityLevel' }],
  apptraces: ['traces', { timestamp: 'TimeGenerated', message: 'Message', severityLevel: 'SeverityLevel', operation_Id: 'OperationId' }],
};
function tableRows(w: World, name: string): Props[] {
  const n = lc(name);
  const t = tel(w);
  if (n in t) return t[n as keyof Tel].map((r) => ({ ...r }));
  if (LA[n]) { const [src, map] = LA[n]; return t[src].map((r) => Object.fromEntries(Object.entries(map).map(([a, b]) => [b, r[a]]))); }
  if (n === 'containerappconsolelogs_cl' || n === 'containerappsystemlogs_cl') {
    const apps = w.res.filter((r) => r.type === 'containerapp');
    const rows: Props[] = [];
    const base = Date.now() - 600000;
    const list = apps.length ? apps : [{ name: 'ca-chat-api', props: { revisions: [{ name: 'ca-chat-api--v1', image: 'contosoacr.azurecr.io/chat-api:v1', active: true }], targetPort: 8000 } } as unknown as Res];
    list.forEach((a) => (P(a).revisions as Rev[]).filter((r) => r.active).forEach((rv, i) => {
      const pull = apps.length ? acaPull(w, a, rv.image) : { ok: true, port: 8000 };
      const portOk = !P(a).ingress || pull.port === P(a).targetPort;
      const t = (s: number) => new Date(base + s * 1000 + i * 7000).toISOString().slice(0, 19) + 'Z';
      if (n === 'containerappconsolelogs_cl') {
        if (!pull.ok) return;
        rows.push({ TimeGenerated: t(1), ContainerAppName_s: a.name, RevisionName_s: rv.name, ContainerName_s: a.name, Log_s: `INFO:     Uvicorn running on http://0.0.0.0:${pull.port}` });
        rows.push({ TimeGenerated: t(40), ContainerAppName_s: a.name, RevisionName_s: rv.name, ContainerName_s: a.name, Log_s: 'INFO:     "POST /chat HTTP/1.1" 200 OK' });
        rows.push({ TimeGenerated: t(95), ContainerAppName_s: a.name, RevisionName_s: rv.name, ContainerName_s: a.name, Log_s: 'ERROR:    openai.APITimeoutError: Request timed out (model call took 30 s)' });
      } else {
        rows.push({ TimeGenerated: t(0), ContainerAppName_s: a.name, RevisionName_s: rv.name, Reason_s: pull.ok ? 'PulledImage' : 'PullingImageFailed', Log_s: pull.ok ? `Successfully pulled image '${rv.image}'` : `Failed to pull image '${rv.image}': ${pull.reason}` });
        if (pull.ok) rows.push({ TimeGenerated: t(2), ContainerAppName_s: a.name, RevisionName_s: rv.name, Reason_s: portOk ? 'ContainerStarted' : 'ProbeFailed', Log_s: portOk ? 'Started container' : `Startup probe failed: connection refused on port ${P(a).targetPort}` });
      }
    }));
    return rows;
  }
  throw new SimError(`'${name}' is not a known table in this practice workspace. Try requests, dependencies, exceptions, traces, AppRequests, ContainerAppConsoleLogs_CL or ContainerAppSystemLogs_CL.`, 'SemanticError');
}
function splitTop(s: string, sep: string) {
  const out: string[] = [];
  let cur = '', q: string | null = null, depth = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q) q = null; cur += c; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (depth === 0 && s.startsWith(sep, i)) { out.push(cur); cur = ''; i += sep.length - 1; continue; }
    cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim());
}
const lit = (v: string): any => { const t = v.trim(); if (/^['"].*['"]$/.test(t)) return t.slice(1, -1); if (/^(true|false)$/i.test(t)) return /^true$/i.test(t); if (!isNaN(Number(t))) return Number(t); if (/^ago\(/i.test(t)) return { ago: true }; return { col: t }; };
function atom(row: Props, expr: string): boolean {
  const e = expr.trim().replace(/^\((.*)\)$/, '$1');
  let m = e.match(/^(isnotempty|isempty|isnull|isnotnull)\((\w+)\)$/i);
  if (m) { const v = row[m[2]]; const empty = v === undefined || v === null || v === ''; return /^isnot/i.test(m[1]) ? !empty : empty; }
  m = e.match(/^(\w+)\s+(!contains|contains|!has|has|startswith|endswith|=~|!~)\s+(.+)$/i) ?? e.match(/^(\w+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (!m) throw new SimError(`Can't parse the where clause '${e}'. Try: where success == false, where name contains "chat", where duration > 1000.`, 'SyntaxError');
  const a = row[m[1]];
  const bv = lit(m[3]);
  if (bv && typeof bv === 'object' && 'ago' in bv) return true;
  const b = bv && typeof bv === 'object' ? row[bv.col] : bv;
  const A = String(a ?? '').toLowerCase(), B = String(b ?? '').toLowerCase();
  switch (m[2].toLowerCase()) {
    case '==': return typeof b === 'boolean' ? a === b || A === B : typeof b === 'number' ? Number(a) === b : String(a) === String(b);
    case '!=': return typeof b === 'number' ? Number(a) !== b : String(a) !== String(b);
    case '>': return a > b; case '<': return a < b; case '>=': return a >= b; case '<=': return a <= b;
    case '=~': return A === B; case '!~': return A !== B;
    case 'contains': case 'has': return A.includes(B);
    case '!contains': case '!has': return !A.includes(B);
    case 'startswith': return A.startsWith(B); case 'endswith': return A.endsWith(B);
  }
  return false;
}
const whereFn = (expr: string) => (row: Props) => splitTop(expr, ' or ').some((part) => splitTop(part, ' and ').every((a) => atom(row, a)));
function binKey(v: any, size: string) {
  const ms = Number(size.replace(/[a-z]+$/i, '')) * ({ s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[size.replace(/^[\d.]+/, '').toLowerCase()] ?? 6e4);
  const t = Date.parse(String(v));
  return isNaN(t) ? v : new Date(Math.floor(t / ms) * ms).toISOString().slice(0, 19) + 'Z';
}
export function kql(w: World, query: string): Props[] {
  const segs = splitTop((query ?? '').trim(), '|');
  const head = segs.shift() ?? '';
  let tables: string[];
  let rows: Props[];
  if (/^union\b/i.test(head)) {
    tables = head.replace(/^union\s+(withsource=\w+\s+)?/i, '').split(',').map((x) => x.trim()).filter(Boolean);
    rows = tables.flatMap((t) => tableRows(w, t));
  } else { tables = [head]; rows = tableRows(w, head); }
  const ops: string[] = [];
  let note = '';
  for (const seg of segs) {
    const m = seg.match(/^(\w[\w-]*)\s*(.*)$/s);
    if (!m) continue;
    const op = m[1].toLowerCase(), arg = m[2].trim();
    ops.push(op);
    if (op === 'where') rows = rows.filter(whereFn(arg));
    else if (op === 'project') {
      const cols = splitTop(arg, ',').map((c) => { const x = c.split('='); return x.length > 1 ? [x[0].trim(), x.slice(1).join('=').trim()] : [c.trim(), c.trim()]; });
      rows = rows.map((r) => Object.fromEntries(cols.map(([n, s]) => [n, r[s]])));
    } else if (op === 'project-away') { const cols = arg.split(',').map((c) => c.trim()); rows = rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !cols.includes(k)))); }
    else if (op === 'extend') {
      for (const part of splitTop(arg, ',')) { const [n, ...e] = part.split('='); const src = e.join('=').trim(); rows = rows.map((r) => ({ ...r, [n.trim()]: /^\w+$/.test(src) && src in r ? r[src] : lit(src) })); }
    } else if (op === 'take' || op === 'limit') rows = rows.slice(0, Number(arg) || 10);
    else if (op === 'count') rows = [{ Count: rows.length }];
    else if (op === 'distinct') { const cols = arg.split(',').map((c) => c.trim()); const seen = new Set<string>(); rows = rows.filter((r) => { const k = cols.map((c) => r[c]).join('\u0001'); if (seen.has(k)) return false; seen.add(k); return true; }).map((r) => Object.fromEntries(cols.map((c) => [c, r[c]]))); }
    else if (op === 'order' || op === 'sort' || op === 'top') {
      const x = op === 'top' ? arg.match(/^(\d+)\s+by\s+(\w+)\s*(asc|desc)?/i) : arg.match(/^by\s+(\w+)\s*(asc|desc)?/i);
      if (!x) throw new SimError(`Try: ${op === 'top' ? 'top 5 by duration desc' : 'order by timestamp desc'}`, 'SyntaxError');
      const [col, dir] = op === 'top' ? [x[2], x[3]] : [x[1], x[2]];
      const sgn = lc(dir) === 'asc' ? 1 : -1;
      rows = [...rows].sort((a, b) => (a[col] > b[col] ? sgn : a[col] < b[col] ? -sgn : 0));
      if (op === 'top') rows = rows.slice(0, Number(x[1]));
    } else if (op === 'summarize') {
      const [aggPart, byPart] = splitTop(arg, ' by ');
      const aggs = splitTop(aggPart, ',').filter(Boolean).map((a) => {
        const mm = a.match(/^(?:(\w+)\s*=\s*)?(count|dcount|avg|sum|min|max|percentile)\(([^)]*)\)$/i);
        if (!mm) throw new SimError(`Unsupported aggregation '${a}'. Use count(), avg(col), sum(col), min(col), max(col), dcount(col) or percentile(col, 95).`, 'SyntaxError');
        const fn = mm[2].toLowerCase();
        const [col, pct] = mm[3].split(',').map((s) => s.trim());
        return { name: mm[1] ?? (fn === 'count' ? 'count_' : fn === 'percentile' ? `percentile_${col}_${pct}` : `${fn}_${col}`), fn, col, pct: Number(pct) };
      });
      const groups = byPart ? splitTop(byPart, ',').map((g) => { const b = g.match(/^bin\((\w+),\s*([\w.]+)\)$/i); return b ? { name: b[1], col: b[1], bin: b[2] } : { name: g, col: g, bin: '' }; }) : [];
      const map = new Map<string, Props[]>();
      rows.forEach((r) => { const key = JSON.stringify(groups.map((g) => (g.bin ? binKey(r[g.col], g.bin) : r[g.col]))); map.set(key, [...(map.get(key) ?? []), r]); });
      if (!groups.length && !map.size) map.set('[]', []);
      rows = [...map].map(([key, list]) => {
        const gv = JSON.parse(key) as any[];
        const o: Props = Object.fromEntries(groups.map((g, i) => [g.name, gv[i]]));
        for (const a of aggs) {
          const nums = list.map((r) => Number(r[a.col])).filter((n) => !isNaN(n)).sort((x, y) => x - y);
          o[a.name] = a.fn === 'count' ? list.length : a.fn === 'dcount' ? new Set(list.map((r) => r[a.col])).size : !nums.length ? null
            : a.fn === 'avg' ? Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 100) / 100 : a.fn === 'sum' ? nums.reduce((s, n) => s + n, 0) : a.fn === 'min' ? nums[0] : a.fn === 'max' ? nums[nums.length - 1] : nums[Math.min(nums.length - 1, Math.floor((a.pct / 100) * nums.length))];
        }
        return o;
      });
    } else if (op === 'render') note = arg.split(/\s/)[0];
    else throw new SimError(`'${op}' isn't supported in this practice workspace. Supported: where, project, extend, summarize … by, bin(), count, distinct, take, top, order by, render.`, 'SyntaxError');
  }
  w.emit('kql.run', { table: lc(tables[0]), tables: tables.map(lc), ops, rows: rows.length, q: query, render: note });
  if (note) (rows as any).render = note;
  return rows;
}
function addTelemetry(w: World, appi: Res) {
  const t = P(appi).telemetry as Tel;
  P(appi).runs = (P(appi).runs ?? 0) + 1;
  const base = Date.now() - 60000;
  const ts = (ms: number) => new Date(base + ms).toISOString().slice(0, 23) + 'Z';
  const ops = [hex(32), hex(32), P(appi).runs === 1 ? '4bf92f3577b34da6a3ce929d0e0e4736' : hex(32)];
  const role = 'chat-api';
  const ai = 'contoso-ai.services.ai.azure.com';
  t.requests.push(
    { timestamp: ts(0), name: 'GET /chat', url: 'https://chat.contoso.com/chat', resultCode: '200', duration: 342, success: true, operation_Id: ops[0], itemType: 'request', cloud_RoleName: role },
    { timestamp: ts(2000), name: 'GET /health', url: 'https://chat.contoso.com/health', resultCode: '200', duration: 3, success: true, operation_Id: ops[1], itemType: 'request', cloud_RoleName: role },
    { timestamp: ts(4000), name: 'POST /chat', url: 'https://chat.contoso.com/chat', resultCode: '500', duration: 30140, success: false, operation_Id: ops[2], itemType: 'request', cloud_RoleName: role });
  t.dependencies.push(
    { timestamp: ts(5), name: 'POST /dbs/retail/colls/orders/docs', target: 'cosmos-contoso.documents.azure.com', type: 'Azure DocumentDB', duration: 12, success: true, resultCode: '200', operation_Id: ops[0], itemType: 'dependency' },
    { timestamp: ts(20), name: 'POST /openai/responses', target: ai, type: 'HTTP', duration: 296, success: true, resultCode: '200', operation_Id: ops[0], itemType: 'dependency' },
    { timestamp: ts(4006), name: 'POST /dbs/retail/colls/orders/docs', target: 'cosmos-contoso.documents.azure.com', type: 'Azure DocumentDB', duration: 14, success: true, resultCode: '200', operation_Id: ops[2], itemType: 'dependency' },
    { timestamp: ts(4030), name: 'POST /openai/responses', target: ai, type: 'HTTP', duration: 30002, success: false, resultCode: '408', operation_Id: ops[2], itemType: 'dependency' });
  t.exceptions.push({ timestamp: ts(34100), type: 'openai.APITimeoutError', outerMessage: 'Request timed out.', problemId: 'openai.APITimeoutError at call_model', operation_Id: ops[2], itemType: 'exception', severityLevel: 3 });
  t.traces.push(
    { timestamp: ts(340), message: 'Answered question in 342 ms', severityLevel: 1, operation_Id: ops[0], itemType: 'trace' },
    { timestamp: ts(19000), message: 'Model call slow, retrying once', severityLevel: 2, operation_Id: ops[2], itemType: 'trace' });
  return ops;
}

/* ------------------------------------------------------------------ */
/* Key Vault reference resolution (App Service / Functions)            */
/* ------------------------------------------------------------------ */
function kvRef(value: string) {
  const m = value.match(/^@Microsoft\.KeyVault\((.*)\)$/);
  if (!m) return null;
  const uri = /SecretUri=https:\/\/([a-z0-9-]+)\.vault\.azure\.net\/secrets\/([\w-]+)/i.exec(m[1]);
  if (uri) return { vault: uri[1], secret: uri[2] };
  const vn = /VaultName=([\w-]+)/i.exec(m[1])?.[1];
  const sn = /SecretName=([\w-]+)/i.exec(m[1])?.[1];
  return vn && sn ? { vault: vn, secret: sn } : { vault: '', secret: '' };
}
function resolveRef(w: World, app: Res, ref: { vault: string; secret: string }) {
  if (!ref.vault) return 'InvalidSyntax: use @Microsoft.KeyVault(VaultName=<vault>;SecretName=<secret>)';
  const v = byName(w, 'kv', ref.vault);
  if (!v) return `VaultNotFound: '${ref.vault}' does not exist`;
  if (!identityOf(app)) return 'MSINotEnabled: the app has no managed identity (az webapp identity assign)';
  if (P(v).rbac && !hasDataRole(w, identityOf(app), v, KV_READ)) return "AccessToKeyVaultDenied: the app's identity needs the Key Vault Secrets User role on the vault";
  if (!P(v).secrets[ref.secret]) return `SecretNotFound: '${ref.secret}' is not in ${v.name}`;
  return 'Resolved';
}

/* ------------------------------------------------------------------ */
/* az commands                                                         */
/* ------------------------------------------------------------------ */
type H = (p: Parsed, w: World) => DevOut;
const RG: [string, string] = ['--resource-group', '-g'];
const NM: [string, string] = ['--name', '-n'];
const rgName = (p: Parsed) => one(p, '--resource-group')!;
const appOf = (w: World, p: Parsed, type: ResType) => w.need(type, rgName(p), one(p, '--name')!);

const AZ: Record<string, H> = {
  /* ----- Container Registry ----- */
  'acr create': (p, w) => {
    req(p, [RG, NM]);
    const name = one(p, '--name')!;
    if (!/^[a-zA-Z0-9]{5,50}$/.test(name)) throw new SimError(`Registry name '${name}' is invalid. Use 5-50 letters and numbers only (no hyphens). It becomes ${lc(name) || '<name>'}.azurecr.io.`, 'InvalidName');
    const sku = ['Basic', 'Standard', 'Premium'].find((s) => lc(s) === lc(one(p, '--sku') ?? 'Basic'));
    if (!sku) throw new SimError('--sku must be Basic, Standard or Premium.', 'InvalidSku');
    const [r, created] = upsert(w, 'acr', { rg: rgName(p), name, location: one(p, '--location') }, true, () => ({ sku, loginServer: `${lc(name)}.azurecr.io`, adminUserEnabled: false, repos: {}, tasks: [], runs: 0 }));
    if (created) w.emit('acr.create', { name: r.name, rg: r.rg, sku });
    return out(p, { id: r.id, loginServer: P(r).loginServer, name: r.name, sku: { name: P(r).sku }, adminUserEnabled: false, provisioningState: 'Succeeded' });
  },
  'acr login': (p, w) => { const r = needAcr(w, one(p, '--name')); w.emit('acr.login', { name: r.name }); return { out: `Login Succeeded\n(Uses your Microsoft Entra token. Cloud Shell has no Docker daemon, so build with az acr build instead.)` }; },
  'acr build': (p, w) => {
    req(p, [['--registry', '-r'], ['--image', '-t']]);
    const acr = needAcr(w, one(p, '--registry'));
    // The source location is positional; when it follows a flag (… -t repo:tag .) it lands in that flag's values.
    let src = p.raw[2];
    for (const [k, vals] of Object.entries(p.flags)) {
      const i = vals.findIndex((x) => x === '.' || x.startsWith('./') || /\.git(#.*)?$/.test(x));
      if (i >= 0 && k !== '--context') { src ??= vals[i]; vals.splice(i, 1); }
    }
    if (!src) throw new SimError('the following arguments are required: <SOURCE_LOCATION> (use . for the current folder)', 'MissingArgs');
    const file = one(p, '--file') ?? 'Dockerfile';
    if (!FILES[file]) throw new SimError(`Unable to find '${file}' in the build context. Files here: ${Object.keys(FILES).join(', ')}`, 'FileNotFound');
    const logs: string[] = [];
    for (const img of many(p, '--image')) {
      const runId = `ca${++P(acr).runs}`;
      const [repo, tag] = splitImage(img);
      const digest = pushImage(w, acr, repo, tag, 'quick');
      w.emit('acr.build', { registry: acr.name, repo, tag, digest, runId, file, via: 'quick' });
      logs.push(buildLog(acr, `${repo}:${tag}`, file, runId, digest, src));
    }
    return { out: logs.join('\n\n') };
  },
  'acr import': (p, w) => {
    req(p, [NM, ['--source', '']]);
    const acr = needAcr(w, one(p, '--name'));
    const source = one(p, '--source')!;
    const target = one(p, '--image') ?? source.replace(/^[^/]+\.(io|com|net)\//, '').replace(/^library\//, '');
    const [repo, tag] = splitImage(target);
    const digest = pushImage(w, acr, repo, tag, 'import');
    w.emit('acr.import', { registry: acr.name, source, repo, tag });
    return { out: `Imported ${source} as ${P(acr).loginServer}/${repo}:${tag} (${digest.slice(0, 19)}…)\n(Importing public base images into your own registry protects builds from Docker Hub rate limits and outages.)` };
  },
  'acr repository list': (p, w) => {
    const acr = needAcr(w, one(p, '--name'));
    const repos = Object.keys(P(acr).repos);
    w.emit('acr.repo.list', { registry: acr.name, count: repos.length });
    return out(p, repos, repos.map((r) => ({ Result: r })), ['Result']);
  },
  'acr repository show-tags': (p, w) => {
    req(p, [NM, ['--repository', '']]);
    const acr = needAcr(w, one(p, '--name'));
    const repo = one(p, '--repository')!;
    const list = P(acr).repos[repo] as { tag: string; digest: string }[] | undefined;
    if (!list) throw new SimError(`Repository '${repo}' was not found in ${acr.name}.`, 'RepositoryNotFound');
    w.emit('acr.tags', { registry: acr.name, repo, tags: list.map((t) => t.tag) });
    return out(p, list.map((t) => t.tag), list.map((t) => ({ Result: t.tag })), ['Result']);
  },
  'acr repository show-manifests': (p, w) => {
    const acr = needAcr(w, one(p, '--name'));
    const list = (P(acr).repos[one(p, '--repository') ?? ''] ?? []) as { tag: string; digest: string }[];
    return out(p, list.map((t) => ({ digest: t.digest, tags: [t.tag] })), list.map((t) => ({ Digest: t.digest, Tags: t.tag })), ['Digest', 'Tags']);
  },
  'acr task create': (p, w) => {
    req(p, [NM, ['--registry', '-r']]);
    const acr = needAcr(w, one(p, '--registry'));
    const context = one(p, '--context');
    if (!context) throw new SimError('--context/-c is required: a Git repository URL such as https://github.com/contoso/chat-api.git#main', 'MissingArgs');
    const commit = bool(p, '--commit-trigger-enabled', true);
    const baseImage = bool(p, '--base-image-trigger-enabled', true);
    if (/github\.com|dev\.azure\.com/.test(context) && commit && !one(p, '--git-access-token')) throw new SimError('A source trigger needs a personal access token to create the webhook. Add --git-access-token <PAT>, or set --commit-trigger-enabled false.', 'MissingArgs');
    const t = { name: one(p, '--name')!, image: one(p, '--image') ?? '', context, file: one(p, '--file') ?? 'Dockerfile', commit, baseImage, schedule: one(p, '--schedule') ?? '' };
    P(acr).tasks = (P(acr).tasks as typeof t[]).filter((x) => x.name !== t.name).concat(t);
    w.emit('acr.task.create', { registry: acr.name, ...t });
    return out(p, { name: t.name, status: 'Enabled', step: { contextPath: context, dockerFilePath: t.file, imageNames: [t.image] }, trigger: { sourceTriggers: commit ? [{ name: 'defaultSourceTriggerName', sourceTriggerEvents: ['commit'], status: 'Enabled' }] : [], baseImageTrigger: baseImage ? { baseImageTriggerType: 'Runtime', status: 'Enabled' } : null }, provisioningState: 'Succeeded' });
  },
  'acr task list': (p, w) => {
    const acr = needAcr(w, one(p, '--registry'));
    const rows = (P(acr).tasks as Props[]).map((t) => ({ Name: t.name, Image: t.image, CommitTrigger: t.commit ? 'Enabled' : 'Disabled', BaseImageTrigger: t.baseImage ? 'Enabled' : 'Disabled' }));
    return out(p, P(acr).tasks, rows, ['Name', 'Image', 'CommitTrigger', 'BaseImageTrigger']);
  },
  'acr task run': (p, w) => {
    req(p, [NM, ['--registry', '-r']]);
    const acr = needAcr(w, one(p, '--registry'));
    const t = (P(acr).tasks as Props[]).find((x) => x.name === one(p, '--name'));
    if (!t) throw new SimError(`Task '${one(p, '--name')}' was not found on ${acr.name}.`, 'TaskNotFound');
    const runId = `ca${++P(acr).runs}`;
    const [repo, tag] = splitImage(String(t.image).replace('{{.Run.ID}}', runId));
    const digest = pushImage(w, acr, repo, tag, 'task');
    w.emit('acr.task.run', { registry: acr.name, task: t.name, runId });
    w.emit('acr.build', { registry: acr.name, repo, tag, digest, runId, file: t.file, via: 'task' });
    return { out: `Queued a run with ID: ${runId}\n${buildLog(acr, `${repo}:${tag}`, t.file, runId, digest, t.context)}` };
  },

  /* ----- App Service + Functions (containers, identity, settings) ----- */
  'webapp create': (p, w) => {
    req(p, [RG, NM, ['--plan', '-p']]);
    const image = one(p, '--container-image-name', '--deployment-container-image-name')!;
    const app = w.createWebapp({ rg: rgName(p), plan: one(p, '--plan')!, name: one(p, '--name')! }, 'cli');
    Object.assign(app.props, { runtime: 'Container', container: image, acrMi: false, settings: {} });
    const pull = imagePull(w, image, (acr) => P(app).acrMi && hasDataRole(w, identityOf(app), acr, ACR_PULL));
    w.emit('webapp.container', { name: app.name, image, pullOk: pull.ok });
    return { out: json({ name: app.name, defaultHostName: app.props.host, kind: 'app,linux,container', siteConfig: { linuxFxVersion: `DOCKER|${image}` }, state: 'Running' }) + (pull.ok ? '' : `\nWARNING: the container can't start yet: ${pull.reason}.\nGive the app a managed identity, grant it AcrPull on the registry, and set acrUseManagedIdentityCreds.`) };
  },
  'webapp config set': (p, w) => {
    req(p, [RG, NM]);
    const app = appOf(w, p, 'webapp');
    const g = one(p, '--generic-configurations');
    if (g) { let o: Props; try { o = JSON.parse(g); } catch { throw new SimError(`--generic-configurations must be JSON, e.g. '{"acrUseManagedIdentityCreds": true}'`, 'InvalidJson'); } if ('acrUseManagedIdentityCreds' in o) P(app).acrMi = !!o.acrUseManagedIdentityCreds; }
    w.emit('webapp.config', { name: app.name, acrMi: !!P(app).acrMi });
    return out(p, { name: app.name, acrUseManagedIdentityCreds: !!P(app).acrMi, linuxFxVersion: P(app).container ? `DOCKER|${P(app).container}` : P(app).runtime });
  },
  'webapp config container set': (p, w) => {
    req(p, [RG, NM]);
    const app = appOf(w, p, 'webapp');
    const image = one(p, '--container-image-name', '--docker-custom-image-name');
    if (image) P(app).container = image;
    w.emit('webapp.container', { name: app.name, image: P(app).container, pullOk: imagePull(w, P(app).container, (acr) => P(app).acrMi && hasDataRole(w, identityOf(app), acr, ACR_PULL)).ok });
    return out(p, [{ name: 'DOCKER_CUSTOM_IMAGE_NAME', value: P(app).container }]);
  },
  'webapp identity assign': (p, w) => { req(p, [RG, NM]); const app = appOf(w, p, 'webapp'); return out(p, assignIdentity(w, app)); },
  'webapp identity show': (p, w) => { req(p, [RG, NM]); const app = appOf(w, p, 'webapp'); if (!identityOf(app)) return { out: '' }; return out(p, P(app).identity); },
  'functionapp identity assign': (p, w) => { req(p, [RG, NM]); const app = appOf(w, p, 'functionapp'); return out(p, assignIdentity(w, app)); },
  'functionapp identity show': (p, w) => { req(p, [RG, NM]); const app = appOf(w, p, 'functionapp'); if (!identityOf(app)) return { out: '' }; return out(p, P(app).identity); },
  'webapp config appsettings set': (p, w) => settingsSet(p, w, 'webapp'),
  'functionapp config appsettings set': (p, w) => settingsSet(p, w, 'functionapp'),
  'webapp config appsettings list': (p, w) => settingsList(p, w, 'webapp'),
  'functionapp config appsettings list': (p, w) => settingsList(p, w, 'functionapp'),
  'webapp log tail': (p, w) => {
    req(p, [RG, NM]);
    const app = appOf(w, p, 'webapp');
    const a = P(app);
    if (!a.container) { w.emit('webapp.logtail', { name: app.name, healthy: true }); return { out: `${now()}  Site started (${a.runtime}).` }; }
    const pull = imagePull(w, a.container, (acr) => a.acrMi && hasDataRole(w, identityOf(app), acr, ACR_PULL));
    const port = Number(a.settings?.WEBSITES_PORT ?? 80);
    const healthy = pull.ok && port === pull.port;
    w.emit('webapp.logtail', { name: app.name, healthy, pullOk: pull.ok, port });
    const lines = [`${now()} INFO  - Pulling image: ${a.container}`];
    if (!pull.ok) lines.push(`${now()} ERROR - Pull image failed: ${pull.reason}`, `${now()} ERROR - Container ${app.name}_0_${hex(8)} couldn't be started.`);
    else {
      lines.push(`${now()} INFO  - Pull Image successful`, `${now()} INFO  - Starting container for site`, `${now()} INFO  - docker run -d -p 8080:${port} --name ${app.name}_0_${hex(8)} ${a.container}`, `${now()}  INFO:     Uvicorn running on http://0.0.0.0:${pull.port}`);
      lines.push(healthy ? `${now()} INFO  - Container ${app.name}_0 for site ${app.name} initialized successfully and is ready to serve requests.` : `${now()} ERROR - Container ${app.name}_0 didn't respond to HTTP pings on port: ${port}, failing site start.\n(The app listens on ${pull.port}. Set the WEBSITES_PORT app setting to ${pull.port}.)`);
    }
    return { out: lines.join('\n') };
  },
  'functionapp create': (p, w) => {
    req(p, [RG, NM, ['--storage-account', '-s']]);
    const loc = w.checkLocation(one(p, '--flexconsumption-location')!);
    const f = w.createFunctionApp({ rg: rgName(p), name: one(p, '--name')!, storage: one(p, '--storage-account')!, runtime: one(p, '--runtime') ?? 'python' }, 'cli');
    Object.assign(f.props, { plan: 'Flex Consumption', location: loc, runtimeVersion: one(p, '--runtime-version') ?? '3.12', settings: { AzureWebJobsStorage__accountName: f.props.storage }, published: false, functions: [], instanceMemory: Number(one(p, '--instance-memory') ?? 2048) });
    w.emit('func.create', { name: f.name, rg: f.rg, flex: true, runtime: f.props.runtime });
    return out(p, { name: f.name, defaultHostName: f.props.host, kind: 'functionapp,linux', sku: 'FlexConsumption', runtime: `${f.props.runtime} ${f.props.runtimeVersion}`, instanceMemoryMB: f.props.instanceMemory, state: 'Running', note: 'Flex Consumption: scales per function to zero and out to many instances; you pay for executions and memory while running.' });
  },

  /* ----- Container Apps ----- */
  'containerapp env create': (p, w) => {
    req(p, [RG, NM]);
    const [env, created] = upsert(w, 'acaenv', { rg: rgName(p), name: one(p, '--name')!, location: one(p, '--location') }, false, () => ({}));
    if (created) {
      const ws = `workspace-${lc(env.rg).replace(/[^a-z0-9]/g, '')}`;
      if (!w.find('law', env.rg, ws)) w.createWorkspace(env.rg, ws, 'cli');
      Object.assign(env.props, { workspace: ws, defaultDomain: `${['happy', 'calm', 'brave', 'wise'][hash(env.name) % 4]}-${(hash(env.name) % 0xffffff).toString(16)}.${env.location}.azurecontainerapps.io`, workloadProfile: 'Consumption' });
      w.emit('aca.env', { name: env.name, rg: env.rg, workspace: ws });
    }
    return out(p, { name: env.name, location: env.location, properties: { defaultDomain: env.props.defaultDomain, appLogsConfiguration: { destination: 'log-analytics', workspace: env.props.workspace }, provisioningState: 'Succeeded' }, note: created ? `Created Log Analytics workspace ${env.props.workspace} for the environment's logs.` : undefined });
  },
  'containerapp create': (p, w) => {
    req(p, [RG, NM, ['--environment', ''], ['--image', '']]);
    const env = w.res.find((r) => r.type === 'acaenv' && (lc(r.name) === lc(one(p, '--environment')) || lc(r.id) === lc(one(p, '--environment'))));
    if (!env) throw new SimError(`Environment '${one(p, '--environment')}' was not found. Create it with az containerapp env create.`, 'ManagedEnvironmentNotFound');
    const name = one(p, '--name')!;
    if (!/^[a-z][a-z0-9-]{0,30}[a-z0-9]$/.test(name) || name.includes('--')) throw new SimError(`Container app name '${name}' is invalid. Use 2-32 lowercase letters, numbers and single hyphens, starting with a letter.`, 'InvalidName');
    if (w.find('containerapp', rgName(p), name)) throw new SimError(`Container app '${name}' already exists. Use az containerapp update to change it.`, 'Conflict');
    const ingress = one(p, '--ingress');
    const min = Number(one(p, '--min-replicas') ?? 0), max = Number(one(p, '--max-replicas') ?? 10);
    if (min > max) throw new SimError('--min-replicas cannot be greater than --max-replicas.', 'InvalidScale');
    const [app] = upsert(w, 'containerapp', { rg: rgName(p), name, location: env.location }, false, () => ({
      env: env.name, image: one(p, '--image'), ingress: ingress ? lc(ingress) : null, targetPort: Number(one(p, '--target-port') ?? 80),
      fqdn: ingress ? `${name}.${lc(ingress) === 'internal' ? 'internal.' : ''}${env.props.defaultDomain}` : null, min, max, replicas: min, mode: 'single', revisions: [] as Rev[],
      rules: rulesFrom(p), secrets: many(p, '--secrets').map((s) => s.split('=')[0]), envVars: kv(many(p, '--env-vars')), identity: null as any, registry: null as any, requests: 0,
    }));
    const a = P(app);
    if (has(p, '--system-assigned')) assignIdentity(w, app);
    const server = one(p, '--registry-server');
    if (server) {
      const viaId = lc(one(p, '--registry-identity')) === 'system';
      if (viaId) { assignIdentity(w, app); const acr = w.res.find((r) => r.type === 'acr' && lc(P(r).loginServer) === lc(server)); if (acr) roles(w).push({ principal: identityOf(app)!, principalName: app.name, role: 'AcrPull', scope: acr.id }); }
      a.registry = { server, identity: viaId ? 'system' : 'secret', autoRole: viaId };
    }
    const rev = newRevision(w, app, one(p, '--revision-suffix'), a.image, a.envVars);
    kedaTick(w);
    if (!a.rules.length) a.replicas = min;
    const pull = acaPull(w, app, a.image);
    w.emit('aca.create', { name, rg: app.rg, env: env.name, ingress: a.ingress, targetPort: a.targetPort, min, max, image: a.image, pullOk: pull.ok });
    if (a.rules.length) w.emit('aca.scale', { app: name, type: a.rules[0].type, metadata: a.rules[0].metadata, min, max });
    return { out: json({ name, properties: { configuration: { activeRevisionsMode: 'Single', ingress: a.ingress ? { external: a.ingress === 'external', targetPort: a.targetPort, fqdn: a.fqdn } : null }, latestRevisionName: rev.name, template: { scale: { minReplicas: min, maxReplicas: max, rules: a.rules } }, provisioningState: 'Succeeded', runningStatus: pull.ok ? 'Running' : 'Degraded' } }) + (a.fqdn ? `\n\nContainer app created. Access your app at https://${a.fqdn}/` : '') + (pull.ok ? '' : `\nWARNING: image pull failed: ${pull.reason}`) };
  },
  'containerapp update': (p, w) => {
    req(p, [RG, NM]);
    const app = appOf(w, p, 'containerapp');
    const a = P(app);
    const before = JSON.stringify([a.image, a.envVars, a.rules, a.min, a.max]);
    if (one(p, '--image')) a.image = one(p, '--image');
    if (has(p, '--set-env-vars')) a.envVars = { ...a.envVars, ...kv(many(p, '--set-env-vars')) };
    if (has(p, '--min-replicas')) a.min = Number(one(p, '--min-replicas'));
    if (has(p, '--max-replicas')) a.max = Number(one(p, '--max-replicas'));
    const rules = rulesFrom(p);
    if (rules.length) a.rules = rules;
    const changed = before !== JSON.stringify([a.image, a.envVars, a.rules, a.min, a.max]) || has(p, '--revision-suffix');
    if (!changed) return { out: 'Nothing to update.' };
    const rev = newRevision(w, app, one(p, '--revision-suffix'), a.image, a.envVars);
    kedaTick(w);
    if (rules.length) w.emit('aca.scale', { app: app.name, type: rules[0].type, metadata: rules[0].metadata, min: a.min, max: a.max });
    return { out: `Updated ${app.name}. New revision: ${rev.name} (${rev.weight}% of traffic).${a.mode === 'multiple' && rev.weight === 0 ? '\nMultiple revision mode: traffic stays where it was until you change it with az containerapp ingress traffic set.' : ''}` };
  },
  'containerapp show': (p, w) => {
    req(p, [RG, NM]);
    const app = appOf(w, p, 'containerapp');
    const a = P(app);
    return out(p, { id: app.id, name: app.name, identity: a.identity ?? { type: 'None' }, properties: { configuration: { activeRevisionsMode: a.mode === 'multiple' ? 'Multiple' : 'Single', ingress: a.ingress ? { fqdn: a.fqdn, external: a.ingress === 'external', targetPort: a.targetPort, traffic: (a.revisions as Rev[]).filter((r) => r.weight).map((r) => ({ revisionName: r.name, weight: r.weight })) } : null }, latestRevisionName: (a.revisions as Rev[]).at(-1)?.name, template: { scale: { minReplicas: a.min, maxReplicas: a.max, rules: a.rules } } } });
  },
  'containerapp identity assign': (p, w) => { req(p, [RG, NM]); const app = appOf(w, p, 'containerapp'); return out(p, assignIdentity(w, app)); },
  'containerapp identity show': (p, w) => { req(p, [RG, NM]); const app = appOf(w, p, 'containerapp'); return out(p, P(app).identity ?? {}); },
  'containerapp revision set-mode': (p, w) => {
    req(p, [RG, NM, ['--mode', '']]);
    const app = appOf(w, p, 'containerapp');
    const mode = lc(one(p, '--mode'));
    if (!['single', 'multiple', 'labels'].includes(mode)) throw new SimError('--mode must be single, multiple or labels.', 'InvalidMode');
    P(app).mode = mode;
    if (mode === 'single') { const revs = P(app).revisions as Rev[]; revs.forEach((r, i) => { r.active = i === revs.length - 1; r.weight = r.active ? 100 : 0; }); }
    w.emit('aca.mode', { app: app.name, mode });
    return { out: `"${mode === 'multiple' ? 'Multiple' : mode === 'single' ? 'Single' : 'Labels'}"${mode === 'multiple' ? `\nTraffic is now pinned to ${(P(app).revisions as Rev[]).filter((r) => r.weight).map((r) => `${r.name} (${r.weight}%)`).join(', ')}. New revisions start with 0%.` : ''}` };
  },
  'containerapp revision list': (p, w) => {
    req(p, [RG, NM]);
    const app = appOf(w, p, 'containerapp');
    const a = P(app);
    const revs = a.revisions as Rev[];
    const active = revs.filter((r) => r.active);
    w.emit('aca.revision.list', { app: app.name, count: revs.length });
    const rows = revs.map((r) => ({ Name: r.name, Active: r.active ? 'True' : 'False', TrafficWeight: r.weight, Replicas: r.active ? Math.max(0, Math.round(a.replicas / Math.max(1, active.length))) : 0, Image: r.image, Created: new Date(r.created).toISOString().slice(0, 19) }));
    return out(p, rows.map((r) => ({ name: r.Name, properties: { active: r.Active === 'True', trafficWeight: r.TrafficWeight, replicas: r.Replicas, template: { containers: [{ image: r.Image }] } } })), rows, ['Name', 'Active', 'TrafficWeight', 'Replicas', 'Image', 'Created']);
  },
  'containerapp revision deactivate': (p, w) => {
    const app = w.res.find((r) => r.type === 'containerapp' && (P(r).revisions as Rev[]).some((x) => x.name === one(p, '--revision')));
    if (!app) throw new SimError(`Revision '${one(p, '--revision')}' was not found.`, 'NotFound');
    const rv = (P(app).revisions as Rev[]).find((x) => x.name === one(p, '--revision'))!;
    if (rv.weight) throw new SimError(`Revision ${rv.name} still gets ${rv.weight}% of traffic. Move the traffic first.`, 'BadRequest');
    rv.active = false;
    w.emit('aca.revision.deactivate', { app: app.name, revision: rv.name });
    return { out: `Deactivated revision ${rv.name}` };
  },
  'containerapp ingress traffic set': (p, w) => {
    req(p, [RG, NM]);
    const app = appOf(w, p, 'containerapp');
    const a = P(app);
    if (!a.ingress) throw new SimError(`Ingress is not enabled on ${app.name}. Enable it with az containerapp ingress enable.`, 'BadRequest');
    if (a.mode === 'single') throw new SimError(`Containerapp '${app.name}' is configured for single revision mode. Set revision mode to multiple first: az containerapp revision set-mode --mode multiple`, 'BadRequest');
    const revs = a.revisions as Rev[];
    const weights = kv(many(p, '--revision-weight'));
    if (!Object.keys(weights).length) throw new SimError('Use --revision-weight <revision>=<weight> ... e.g. ca-chat-api--v1=80 ca-chat-api--v2=20', 'MissingArgs');
    const resolved: Record<string, number> = {};
    for (const [n, v] of Object.entries(weights)) {
      const rv = n === 'latest' ? revs.at(-1) : revs.find((r) => r.name === n);
      if (!rv) throw new SimError(`Revision '${n}' does not exist. Run az containerapp revision list to see names.`, 'RevisionNotFound');
      resolved[rv.name] = Number(v);
    }
    const sum = Object.values(resolved).reduce((s, n) => s + n, 0);
    if (sum !== 100) throw new SimError(`Traffic weights must add up to 100 (yours add up to ${sum}).`, 'InvalidTraffic');
    revs.forEach((r) => { r.weight = resolved[r.name] ?? 0; if (r.weight) r.active = true; });
    w.emit('aca.traffic', { app: app.name, weights: resolved });
    return out(p, revs.filter((r) => r.weight).map((r) => ({ revisionName: r.name, weight: r.weight })), revs.map((r) => ({ RevisionName: r.name, Weight: r.weight })), ['RevisionName', 'Weight']);
  },
  'containerapp replica list': (p, w) => {
    req(p, [RG, NM]);
    const app = appOf(w, p, 'containerapp');
    kedaTick(w);
    const a = P(app);
    const active = (a.revisions as Rev[]).filter((r) => r.active && (r.weight || a.mode === 'single' || a.rules.length));
    const rows = Array.from({ length: a.replicas }, (_, i) => { const rv = active[i % Math.max(1, active.length)] ?? (a.revisions as Rev[]).at(-1)!; return { Name: `${rv.name}-${(hash(rv.name + i) % 0xfffffff).toString(36)}-${hex(5)}`, Revision: rv.name, Running: 'Running' }; });
    w.emit('aca.replicas', { app: app.name, count: a.replicas });
    return rows.length ? out(p, rows, rows, ['Name', 'Revision', 'Running']) : { out: `No replicas are running. ${a.min === 0 ? 'The app scaled to zero (min replicas 0). It starts again when its scale rule sees work.' : ''}`.trim() };
  },
  'containerapp logs show': (p, w) => {
    req(p, [RG, NM]);
    const app = appOf(w, p, 'containerapp');
    const a = P(app);
    const type = lc(one(p, '--type') ?? 'console');
    const rv = (a.revisions as Rev[]).filter((r) => r.active).at(-1)!;
    const pull = acaPull(w, app, rv.image);
    const portOk = !a.ingress || pull.port === a.targetPort;
    w.emit('aca.logs', { app: app.name, type, healthy: pull.ok && portOk });
    const t = now();
    if (type === 'system') return { out: [`{"TimeStamp":"${t}","Type":"Normal","ContainerAppName":"${app.name}","RevisionName":"${rv.name}","Msg":"Pulling image '${rv.image}'","Reason":"PullingImage"}`, pull.ok ? `{"TimeStamp":"${t}","Type":"Normal","Msg":"Successfully pulled image","Reason":"PulledImage"}` : `{"TimeStamp":"${t}","Type":"Warning","Msg":"Failed to pull image '${rv.image}': ${pull.reason}","Reason":"PullingImageFailed"}`, ...(pull.ok ? [`{"TimeStamp":"${t}","Type":"Normal","Msg":"Created container '${app.name}'","Reason":"ContainerCreated"}`, portOk ? `{"TimeStamp":"${t}","Type":"Normal","Msg":"Started container '${app.name}'","Reason":"ContainerStarted"}` : `{"TimeStamp":"${t}","Type":"Warning","Msg":"Probe of StartUp failed with status code: 1 (connection refused on port ${a.targetPort}; the image listens on ${pull.port})","Reason":"ProbeFailed"}`, `{"TimeStamp":"${t}","Type":"Normal","Msg":"KEDA is starting a watch for revision '${rv.name}' to monitor scale operations","Reason":"KEDAScalersStarted"}`] : [])].join('\n') };
    if (!pull.ok) return { out: '(No console logs: the container never started. Check --type system.)' };
    return { out: [`{"TimeStamp":"${t}","Log":"INFO:     Started server process [1]"}`, `{"TimeStamp":"${t}","Log":"INFO:     Uvicorn running on http://0.0.0.0:${pull.port}"}`, `{"TimeStamp":"${t}","Log":"INFO:     \\"GET / HTTP/1.1\\" 200 OK"}`].join('\n') };
  },

  /* ----- AKS credentials ----- */
  'aks get-credentials': (p, w) => {
    req(p, [RG, NM]);
    const k = w.need('aks', rgName(p), one(p, '--name')!);
    dev(w).kube = { rg: k.rg, name: k.name };
    P(k).k8s ??= { deployments: [], pods: [], services: [], events: [] };
    w.emit('aks.credentials', { name: k.name, rg: k.rg });
    return { out: `Merged "${k.name}" as current context in /home/learner/.kube/config\n(kubectl now talks to ${k.name}. Try: kubectl get nodes)` };
  },

  /* ----- Cosmos DB ----- */
  'cosmosdb create': (p, w) => {
    req(p, [RG, NM]);
    const name = one(p, '--name')!;
    if (!/^[a-z0-9][a-z0-9-]{1,42}[a-z0-9]$/.test(name)) throw new SimError(`Account name '${name}' is invalid. Use 3-44 lowercase letters, numbers and hyphens.`, 'InvalidName');
    const level = consistency(one(p, '--default-consistency-level') ?? 'Session');
    const [r, created] = upsert(w, 'cosmos', { rg: rgName(p), name, location: (one(p, '--locations') ?? '').match(/regionName=(\w+)/)?.[1] }, true, () => ({ endpoint: `https://${name}.documents.azure.com:443/`, consistency: level, dbs: {}, capabilities: many(p, '--capabilities'), serverless: many(p, '--capabilities').some((c) => /serverless/i.test(c)) }));
    if (created) w.emit('cosmos.create', { name, rg: r.rg, consistency: level });
    return out(p, { id: r.id, name, documentEndpoint: P(r).endpoint, consistencyPolicy: { defaultConsistencyLevel: P(r).consistency }, kind: 'GlobalDocumentDB', locations: [{ locationName: r.location, failoverPriority: 0 }], provisioningState: 'Succeeded' });
  },
  'cosmosdb show': (p, w) => { req(p, [RG, NM]); const r = w.need('cosmos', rgName(p), one(p, '--name')!); return out(p, { id: r.id, name: r.name, documentEndpoint: P(r).endpoint, consistencyPolicy: { defaultConsistencyLevel: P(r).consistency } }); },
  'cosmosdb update': (p, w) => {
    req(p, [RG, NM]);
    const r = w.need('cosmos', rgName(p), one(p, '--name')!);
    if (has(p, '--default-consistency-level')) { const from = P(r).consistency; P(r).consistency = consistency(one(p, '--default-consistency-level')!); w.emit('cosmos.consistency', { name: r.name, from, level: P(r).consistency }); }
    if (has(p, '--capabilities')) P(r).capabilities = [...new Set([...(P(r).capabilities ?? []), ...many(p, '--capabilities')])];
    return out(p, { name: r.name, consistencyPolicy: { defaultConsistencyLevel: P(r).consistency }, capabilities: (P(r).capabilities ?? []).map((n: string) => ({ name: n })), note: /Strong|BoundedStaleness/.test(P(r).consistency) ? 'Strong and Bounded Staleness reads cost about twice the RUs of Session or weaker levels.' : undefined });
  },
  'cosmosdb sql database create': (p, w) => {
    req(p, [['--account-name', '-a'], RG, NM]);
    const r = w.need('cosmos', rgName(p), one(p, '--account-name')!);
    const n = one(p, '--name')!;
    P(r).dbs[n] ??= { containers: {}, throughput: one(p, '--throughput') ? Number(one(p, '--throughput')) : null };
    w.emit('cosmos.db', { account: r.name, name: n });
    return out(p, { name: n, resource: { id: n } });
  },
  'cosmosdb sql container create': (p, w) => {
    req(p, [['--account-name', '-a'], RG, ['--database-name', '-d'], NM, ['--partition-key-path', '-p']]);
    const r = w.need('cosmos', rgName(p), one(p, '--account-name')!);
    const db = P(r).dbs[one(p, '--database-name')!];
    if (!db) throw new SimError(`Database '${one(p, '--database-name')}' does not exist. Create it with az cosmosdb sql database create.`, 'NotFound');
    const n = one(p, '--name')!;
    const pk = one(p, '--partition-key-path')!;
    if (!pk.startsWith('/')) throw new SimError(`Partition key path '${pk}' must start with '/', e.g. /customerId.`, 'BadRequest');
    if (db.containers[n]) throw new SimError(`Container '${n}' already exists. The partition key can't be changed after creation; create a new container to change it.`, 'Conflict');
    const idx = readPolicy(one(p, '--idx')) ?? { indexingMode: 'consistent', automatic: true, includedPaths: [{ path: '/*' }], excludedPaths: [{ path: '/"_etag"/?' }] };
    const vec = readPolicy(one(p, '--vector-embeddings'));
    if (idx.vectorIndexes?.length && !vec) throw new SimError('The indexing policy has vectorIndexes but the container has no vector embedding policy. Add --vector-embeddings @vector-policy.json.', 'BadRequest');
    for (const vi of idx.vectorIndexes ?? []) if (!(vec?.vectorEmbeddings ?? []).some((e: Props) => e.path === vi.path)) throw new SimError(`Vector index path '${vi.path}' has no matching entry in the vector embedding policy.`, 'BadRequest');
    const c: Cont = { pk, throughput: Number(one(p, '--throughput') ?? 400), idx, vec, items: [], lsn: 0, lease: null };
    db.containers[n] = c;
    w.emit('cosmos.container', { account: r.name, db: one(p, '--database-name'), name: n, pk, idx: one(p, '--idx') ?? '', vector: !!vec, vectorIndex: (idx.vectorIndexes ?? [])[0]?.type ?? '', throughput: c.throughput });
    return out(p, { name: n, resource: { id: n, partitionKey: { paths: [pk], kind: 'Hash' }, indexingPolicy: idx, vectorEmbeddingPolicy: vec ?? undefined }, throughput: c.throughput });
  },
  'cosmosdb sql container update': (p, w) => {
    req(p, [['--account-name', '-a'], RG, ['--database-name', '-d'], NM]);
    const r = w.need('cosmos', rgName(p), one(p, '--account-name')!);
    const c = P(r).dbs[one(p, '--database-name')!]?.containers?.[one(p, '--name')!] as Cont | undefined;
    if (!c) throw new SimError(`Container '${one(p, '--name')}' does not exist.`, 'NotFound');
    if (has(p, '--vector-embeddings')) throw new SimError("A container's vector embedding policy can't be changed after creation. Create a new container with the policy you want.", 'BadRequest');
    if (has(p, '--partition-key-path')) throw new SimError("The partition key can't be changed. Create a new container and copy the data.", 'BadRequest');
    const idx = readPolicy(one(p, '--idx'));
    if (idx) c.idx = idx;
    w.emit('cosmos.index', { account: r.name, name: one(p, '--name'), idx: one(p, '--idx') ?? '' });
    return out(p, { name: one(p, '--name'), resource: { indexingPolicy: c.idx }, note: 'Index transformation runs in the background using spare RUs.' });
  },
  'cosmosdb sql container show': (p, w) => {
    const r = w.need('cosmos', rgName(p), one(p, '--account-name')!);
    const c = P(r).dbs[one(p, '--database-name')!]?.containers?.[one(p, '--name')!] as Cont | undefined;
    if (!c) throw new SimError(`Container '${one(p, '--name')}' does not exist.`, 'NotFound');
    return out(p, { name: one(p, '--name'), resource: { partitionKey: { paths: [c.pk] }, indexingPolicy: c.idx, vectorEmbeddingPolicy: c.vec ?? undefined }, itemCount: c.items.length });
  },

  /* ----- PostgreSQL flexible server ----- */
  'postgres flexible-server create': (p, w) => {
    req(p, [RG, NM]);
    const name = one(p, '--name')!;
    if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(name)) throw new SimError(`Server name '${name}' is invalid. Use 3-63 lowercase letters, numbers and hyphens.`, 'InvalidName');
    const access = one(p, '--public-access');
    const [r, created] = upsert(w, 'pg', { rg: rgName(p), name, location: one(p, '--location') }, true, () => ({ fqdn: `${name}.postgres.database.azure.com`, admin: one(p, '--admin-user') ?? 'pgadmin', version: one(p, '--version') ?? '16', tier: one(p, '--tier') ?? 'Burstable', sku: one(p, '--sku-name') ?? 'Standard_B1ms', publicAccess: !!access && lc(access) !== 'none' && lc(access) !== 'disabled', firewall: [], params: { 'azure.extensions': '' }, db: { ext: [], tables: {}, indexes: [], ef: 40 } }));
    if (created) w.emit('pg.create', { name, rg: r.rg, publicAccess: P(r).publicAccess });
    return out(p, { host: P(r).fqdn, id: r.id, location: r.location, skuname: P(r).sku, username: P(r).admin, version: P(r).version, firewallName: P(r).publicAccess ? 'AllowAllAzureServicesAndResourcesWithinAzureIps' : undefined, connectionString: `postgresql://${P(r).admin}:<password>@${P(r).fqdn}/postgres?sslmode=require` });
  },
  'postgres flexible-server parameter set': (p, w) => {
    req(p, [RG, ['--server-name', '-s'], NM]);
    const r = w.need('pg', rgName(p), one(p, '--server-name')!);
    const n = one(p, '--name')!;
    const v = one(p, '--value') ?? '';
    P(r).params[n] = v;
    w.emit('pg.param', { server: r.name, name: n, value: v });
    return out(p, { name: n, value: v, source: 'user-override', note: n === 'azure.extensions' ? 'Allow-listed. Now run CREATE EXTENSION in each database that needs it.' : undefined });
  },
  'postgres flexible-server parameter show': (p, w) => { const r = w.need('pg', rgName(p), one(p, '--server-name')!); return out(p, { name: one(p, '--name'), value: P(r).params[one(p, '--name')!] ?? '' }); },
  'postgres flexible-server firewall-rule create': (p, w) => {
    req(p, [RG, NM]);
    const r = w.need('pg', rgName(p), one(p, '--name')!);
    const rule = { name: one(p, '--rule-name') ?? 'rule1', start: one(p, '--start-ip-address') ?? '', end: one(p, '--end-ip-address') ?? one(p, '--start-ip-address') ?? '' };
    P(r).firewall.push(rule);
    w.emit('pg.firewall', { server: r.name, ...rule });
    return out(p, rule);
  },
  'postgres flexible-server show': (p, w) => { req(p, [RG, NM]); const r = w.need('pg', rgName(p), one(p, '--name')!); return out(p, { name: r.name, fullyQualifiedDomainName: P(r).fqdn, version: P(r).version, state: 'Ready' }); },

  /* ----- Azure Managed Redis ----- */
  'redisenterprise create': (p, w) => {
    const name = one(p, '--cluster-name', '--name');
    if (!name) throw new SimError('the following arguments are required: --cluster-name/--name/-n', 'MissingArgs');
    req(p, [RG]);
    const modules = many(p, '--modules').map((m) => m.replace(/^name=/i, '').split(/[,\s]/)[0]).filter(Boolean);
    const clustering = one(p, '--clustering-policy') ?? 'OSSCluster';
    if (modules.some((m) => lc(m) === 'redisearch') && lc(clustering) === 'osscluster') throw new SimError('RediSearch needs the EnterpriseCluster (or NoCluster) clustering policy. Add --clustering-policy EnterpriseCluster.', 'BadRequest');
    const [r, created] = upsert(w, 'redis', { rg: rgName(p), name, location: one(p, '--location') }, true, () => ({ sku: one(p, '--sku') ?? 'Balanced_B0', modules, clustering, port: 10000, data: {}, idx: {}, hits: 0, misses: 0, accessKeys: false }));
    if (created) { P(r).host = `${name}.${r.location}.redis.azure.net`; w.emit('redis.create', { name, rg: r.rg, modules, clustering }); }
    return out(p, { name: r.name, hostName: P(r).host, sku: { name: P(r).sku }, databases: [{ name: 'default', port: 10000, clusteringPolicy: P(r).clustering, modules: (P(r).modules as string[]).map((m) => ({ name: m })), accessKeysAuthentication: 'Disabled' }], provisioningState: 'Succeeded', note: 'Microsoft Entra ID is on and access keys are off by default. Modules can only be chosen at creation time.' });
  },
  'redisenterprise show': (p, w) => { const r = needName(w, 'redis', one(p, '--cluster-name', '--name'), 'Redis cache'); return out(p, { name: r.name, hostName: P(r).host, modules: P(r).modules }); },

  /* ----- Service Bus ----- */
  'servicebus namespace create': (p, w) => {
    req(p, [RG, NM]);
    const name = one(p, '--name')!;
    if (!/^[a-zA-Z][a-zA-Z0-9-]{4,48}[a-zA-Z0-9]$/.test(name)) throw new SimError(`Namespace name '${name}' is invalid. Use 6-50 letters, numbers and hyphens, starting with a letter.`, 'InvalidName');
    const sku = ['Basic', 'Standard', 'Premium'].find((s) => lc(s) === lc(one(p, '--sku') ?? 'Standard'))!;
    const [r, created] = upsert(w, 'sbns', { rg: rgName(p), name, location: one(p, '--location') }, true, () => ({ sku, endpoint: `https://${name}.servicebus.windows.net:443/`, queues: {}, topics: {} }));
    if (created) w.emit('sb.ns', { name, rg: r.rg, sku });
    return out(p, { id: r.id, name, serviceBusEndpoint: P(r).endpoint, sku: { name: P(r).sku, tier: P(r).sku }, provisioningState: 'Succeeded' });
  },
  'servicebus namespace show': (p, w) => { req(p, [RG, NM]); const r = w.need('sbns', rgName(p), one(p, '--name')!); return out(p, { id: r.id, name: r.name, serviceBusEndpoint: P(r).endpoint }); },
  'servicebus queue create': (p, w) => {
    req(p, [RG, ['--namespace-name', ''], NM]);
    const ns = w.need('sbns', rgName(p), one(p, '--namespace-name')!);
    const n = one(p, '--name')!;
    const q: Q = P(ns).queues[n] ?? { maxDelivery: 10, lock: 'PT1M', active: [], dlq: [] };
    q.maxDelivery = Number(one(p, '--max-delivery-count') ?? q.maxDelivery);
    q.lock = one(p, '--lock-duration') ?? q.lock;
    P(ns).queues[n] = q;
    w.emit('sb.queue', { ns: ns.name, name: n, maxDelivery: q.maxDelivery });
    return out(p, { name: n, maxDeliveryCount: q.maxDelivery, lockDuration: q.lock, deadLetteringOnMessageExpiration: false, status: 'Active' });
  },
  'servicebus queue show': (p, w) => {
    req(p, [RG, ['--namespace-name', ''], NM]);
    const ns = w.need('sbns', rgName(p), one(p, '--namespace-name')!);
    const q = P(ns).queues[one(p, '--name')!] as Q | undefined;
    if (!q) throw new SimError(`Queue '${one(p, '--name')}' was not found.`, 'MessagingEntityNotFound');
    w.emit('sb.queue.show', { ns: ns.name, name: one(p, '--name'), active: q.active.length, dlq: q.dlq.length });
    return out(p, { name: one(p, '--name'), maxDeliveryCount: q.maxDelivery, countDetails: { activeMessageCount: q.active.length, deadLetterMessageCount: q.dlq.length } });
  },
  'servicebus topic create': (p, w) => {
    req(p, [RG, ['--namespace-name', ''], NM]);
    const ns = w.need('sbns', rgName(p), one(p, '--namespace-name')!);
    if (P(ns).sku === 'Basic') throw new SimError('Topics and subscriptions are not available in the Basic tier. Use a Standard or Premium namespace.', 'BadRequest');
    P(ns).topics[one(p, '--name')!] ??= { subs: {} };
    w.emit('sb.topic', { ns: ns.name, name: one(p, '--name') });
    return out(p, { name: one(p, '--name'), status: 'Active' });
  },
  'servicebus topic subscription create': (p, w) => {
    req(p, [RG, ['--namespace-name', ''], ['--topic-name', ''], NM]);
    const t = sbTopic(w, p);
    const n = one(p, '--name')!;
    t.subs[n] ??= { maxDelivery: 10, lock: 'PT1M', active: [], dlq: [], rules: [{ name: '$Default', sql: '1=1' }] } as SubQ;
    t.subs[n].maxDelivery = Number(one(p, '--max-delivery-count') ?? t.subs[n].maxDelivery);
    w.emit('sb.sub', { topic: one(p, '--topic-name'), name: n, maxDelivery: t.subs[n].maxDelivery });
    return out(p, { name: n, maxDeliveryCount: t.subs[n].maxDelivery, note: "New subscriptions get a '$Default' rule (1=1) that matches every message." });
  },
  'servicebus topic subscription rule create': (p, w) => {
    req(p, [RG, ['--namespace-name', ''], ['--topic-name', ''], ['--subscription-name', ''], NM]);
    const s = sbSub(w, p);
    const sql = one(p, '--filter-sql-expression') ?? '1=1';
    s.rules = s.rules.filter((r) => r.name !== one(p, '--name')).concat({ name: one(p, '--name')!, sql });
    w.emit('sb.rule', { topic: one(p, '--topic-name'), sub: one(p, '--subscription-name'), name: one(p, '--name'), sql, rules: s.rules.map((r) => r.name) });
    const warn = s.rules.some((r) => r.name === '$Default') ? `\n(Note: the '$Default' rule (1=1) is still there, so this subscription still gets every message. Delete it to filter.)` : '';
    return { out: (out(p, { name: one(p, '--name'), filterType: 'SqlFilter', sqlFilter: { sqlExpression: sql } }).out ?? '') + warn };
  },
  'servicebus topic subscription rule delete': (p, w) => {
    req(p, [RG, ['--namespace-name', ''], ['--topic-name', ''], ['--subscription-name', ''], NM]);
    const s = sbSub(w, p);
    const n = one(p, '--name')!;
    if (!s.rules.some((r) => r.name === n)) throw new SimError(`Rule '${n}' was not found.`, 'MessagingEntityNotFound');
    s.rules = s.rules.filter((r) => r.name !== n);
    w.emit('sb.rule.delete', { topic: one(p, '--topic-name'), sub: one(p, '--subscription-name'), name: n, rules: s.rules.map((r) => r.name) });
    return { out: '' };
  },
  'servicebus topic subscription rule list': (p, w) => {
    const s = sbSub(w, p);
    return out(p, s.rules, s.rules.map((r) => ({ Name: r.name, SqlExpression: r.sql })), ['Name', 'SqlExpression']);
  },

  /* ----- Event Grid ----- */
  'eventgrid topic create': (p, w) => {
    req(p, [RG, NM]);
    const name = one(p, '--name')!;
    const [r, created] = upsert(w, 'egtopic', { rg: rgName(p), name, location: one(p, '--location') }, false, () => ({ subs: [] }));
    if (created) { P(r).endpoint = `https://${name}.${r.location}-1.eventgrid.azure.net/api/events`; w.emit('eg.topic', { name, rg: r.rg }); }
    return out(p, { id: r.id, name, endpoint: P(r).endpoint, inputSchema: 'EventGridSchema (CloudEvents v1.0 also accepted)', provisioningState: 'Succeeded' });
  },
  'eventgrid topic show': (p, w) => { req(p, [RG, NM]); const r = w.need('egtopic', rgName(p), one(p, '--name')!); return out(p, { id: r.id, name: r.name, endpoint: P(r).endpoint }); },
  'eventgrid event-subscription create': (p, w) => {
    req(p, [NM, ['--source-resource-id', ''], ['--endpoint', '']]);
    const src = one(p, '--source-resource-id')!;
    const tn = src.match(/\/topics\/([\w-]+)\/?$/i)?.[1];
    const topic = tn && byName(w, 'egtopic', tn);
    if (!topic) throw new SimError(`Source '${src}' was not found. Use the topic's resource ID (az eventgrid topic show --query id -o tsv).`, 'ResourceNotFound');
    const dl = one(p, '--deadletter-endpoint');
    let deadletter: string | null = null;
    if (dl) {
      const m = dl.match(/\/storageAccounts\/(\w+)\/blobServices\/default\/containers\/([\w-]+)/i);
      if (!m || !byName(w, 'storage', m[1])) throw new SimError('--deadletter-endpoint must be a blob container ID in an existing storage account: /subscriptions/…/storageAccounts/<account>/blobServices/default/containers/<container>', 'BadRequest');
      deadletter = `${m[1]}/${m[2]}`;
    }
    const sub = { name: one(p, '--name')!, endpoint: one(p, '--endpoint')!, endpointType: one(p, '--endpoint-type') ?? 'webhook', beginsWith: one(p, '--subject-begins-with') ?? '', endsWith: one(p, '--subject-ends-with') ?? '', types: many(p, '--included-event-types'), maxAttempts: Number(one(p, '--max-delivery-attempts') ?? 30), ttl: Number(one(p, '--event-ttl') ?? 1440), deadletter, delivered: 0, dead: 0 };
    if (sub.maxAttempts < 1 || sub.maxAttempts > 30) throw new SimError('--max-delivery-attempts must be between 1 and 30.', 'BadRequest');
    P(topic).subs = (P(topic).subs as Props[]).filter((s) => s.name !== sub.name).concat(sub);
    w.emit('eg.sub', { topic: topic.name, ...sub });
    return { out: json({ name: sub.name, destination: { endpointType: sub.endpointType, endpointBaseUrl: sub.endpoint }, filter: { subjectBeginsWith: sub.beginsWith, subjectEndsWith: sub.endsWith, includedEventTypes: sub.types.length ? sub.types : null }, retryPolicy: { maxDeliveryAttempts: sub.maxAttempts, eventTimeToLiveInMinutes: sub.ttl }, deadLetterDestination: deadletter ? { blobContainerName: deadletter.split('/')[1] } : null, provisioningState: 'Succeeded' }) + (sub.endpointType === 'webhook' ? '\n(Validation handshake: the endpoint echoed the validationCode, so Event Grid trusts it.)' : '') };
  },
  'eventgrid event-subscription list': (p, w) => {
    const tn = (one(p, '--source-resource-id') ?? '').match(/\/topics\/([\w-]+)/i)?.[1];
    const subs = w.res.filter((r) => r.type === 'egtopic' && (!tn || lc(r.name) === lc(tn))).flatMap((r) => P(r).subs as Props[]);
    return out(p, subs, subs.map((s) => ({ Name: s.name, Endpoint: s.endpoint, SubjectEndsWith: s.endsWith, MaxAttempts: s.maxAttempts, DeadLetter: s.deadletter ?? '' })), ['Name', 'Endpoint', 'SubjectEndsWith', 'MaxAttempts', 'DeadLetter']);
  },

  /* ----- data-plane role assignments ----- */
  'role assignment create': (p, w) => {
    req(p, [['--role', ''], ['--scope', '']]);
    const who = one(p, '--assignee-object-id', '--assignee');
    if (!who) throw new SimError('the following arguments are required: --assignee or --assignee-object-id', 'MissingArgs');
    const role = DATA_ROLES.find((r) => lc(r) === lc(one(p, '--role')));
    if (!role) throw new SimError(`Role '${one(p, '--role')}' doesn't exist in this practice tenant. Try: ${DATA_ROLES.slice(0, 8).join(', ')}…`, 'RoleNotFound');
    const scope = one(p, '--scope')!;
    const target = resourceAtScope(w, scope);
    const isRg = /^\/subscriptions\/[^/]+\/resourcegroups\/[^/]+$/i.test(scope.replace(/\/$/, ''));
    if (!target && !isRg) throw new SimError(`Scope '${scope}' was not found. Use the full resource ID, e.g. /subscriptions/${SUB_ID}/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault>`, 'ResourceNotFound');
    const user = w.users.find((u) => lc(u.upn) === lc(who));
    const holder = w.res.find((r) => lc(identityOf(r)) === lc(who));
    if (!user && !holder) throw new SimError(`Cannot find user or service principal in graph database for '${who}'. For a managed identity, pass its principalId (az webapp identity show --query principalId -o tsv).`, 'PrincipalNotFound');
    const principal = user ? user.upn : identityOf(holder!)!;
    const a: DataRole = { principal, principalName: user ? user.upn : holder!.name, role, scope: target ? target.id : scope };
    if (!roles(w).some((x) => x.principal === a.principal && x.role === a.role && lc(x.scope) === lc(a.scope))) roles(w).push(a);
    w.emit('role.assign', { role, scope: a.scope, scopeType: target?.type ?? 'rg', scopeName: target?.name ?? scope.split('/').pop(), principal, principalName: a.principalName, principalKind: user ? 'user' : holder!.type });
    return out(p, { principalId: user ? '0b1e0000-0000-0000-0000-00000000a900' : principal, principalName: a.principalName, principalType: user ? 'User' : 'ServicePrincipal', roleDefinitionName: role, scope: a.scope, note: 'Role assignments can take a minute or two to take effect in real Azure.' });
  },

  /* ----- Key Vault ----- */
  'keyvault create': (p, w) => {
    req(p, [RG, NM]);
    const name = one(p, '--name')!;
    if (!/^[a-zA-Z][a-zA-Z0-9-]{1,22}[a-zA-Z0-9]$/.test(name) || name.includes('--')) throw new SimError(`Vault name '${name}' is invalid. Use 3-24 letters, numbers and hyphens, starting with a letter.`, 'InvalidName');
    const rbac = bool(p, '--enable-rbac-authorization', true);
    const [r, created] = upsert(w, 'kv', { rg: rgName(p), name, location: one(p, '--location') }, true, () => ({ uri: `https://${lc(name)}.vault.azure.net/`, rbac, softDeleteDays: Number(one(p, '--retention-days') ?? 90), purgeProtection: bool(p, '--enable-purge-protection', false), secrets: {} }));
    if (created) w.emit('kv.create', { name, rg: r.rg, rbac: P(r).rbac });
    return out(p, { id: r.id, name, properties: { vaultUri: P(r).uri, enableRbacAuthorization: P(r).rbac, enableSoftDelete: true, softDeleteRetentionInDays: P(r).softDeleteDays, sku: { name: 'standard' } }, note: P(r).rbac ? 'RBAC vault: even subscription Owners need a data role (for example Key Vault Secrets Officer) to read or write secrets.' : undefined });
  },
  'keyvault show': (p, w) => { const r = needName(w, 'kv', one(p, '--name'), 'Key vault'); return out(p, { id: r.id, name: r.name, properties: { vaultUri: P(r).uri, enableRbacAuthorization: P(r).rbac } }); },
  'keyvault secret set': (p, w) => {
    req(p, [['--vault-name', ''], NM]);
    const v = needName(w, 'kv', one(p, '--vault-name'), 'Key vault');
    kvGuard(w, v, 'setSecret', KV_WRITE, one(p, '--name')!);
    const value = one(p, '--value') ?? (one(p, '--file') ? `(contents of ${one(p, '--file')})` : '');
    const list = (P(v).secrets[one(p, '--name')!] ??= []) as { version: string; value: string; created: number; enabled: boolean }[];
    const version = hex(32);
    list.push({ version, value, created: Date.now(), enabled: true });
    w.emit('kv.secret', { action: 'set', vault: v.name, name: one(p, '--name'), version, versions: list.length });
    return out(p, { id: `${P(v).uri}secrets/${one(p, '--name')}/${version}`, name: one(p, '--name'), attributes: { enabled: true, created: now() }, value: '***' });
  },
  'keyvault secret show': (p, w) => {
    req(p, [['--vault-name', ''], NM]);
    const v = needName(w, 'kv', one(p, '--vault-name'), 'Key vault');
    kvGuard(w, v, 'getSecret', KV_READ, one(p, '--name')!);
    const list = (P(v).secrets[one(p, '--name')!] ?? []) as { version: string; value: string }[];
    const s = one(p, '--version') ? list.find((x) => x.version === one(p, '--version')) : list.at(-1);
    if (!s) throw new SimError(`A secret with (name/id) ${one(p, '--name')} was not found in this key vault.`, 'SecretNotFound');
    w.emit('kv.secret', { action: 'show', vault: v.name, name: one(p, '--name'), version: s.version });
    return out(p, { id: `${P(v).uri}secrets/${one(p, '--name')}/${s.version}`, name: one(p, '--name'), value: s.value });
  },
  'keyvault secret list-versions': (p, w) => {
    req(p, [['--vault-name', ''], NM]);
    const v = needName(w, 'kv', one(p, '--vault-name'), 'Key vault');
    kvGuard(w, v, 'readMetadata', KV_READ, one(p, '--name')!);
    const list = (P(v).secrets[one(p, '--name')!] ?? []) as { version: string; created: number; enabled: boolean }[];
    w.emit('kv.secret', { action: 'versions', vault: v.name, name: one(p, '--name'), count: list.length });
    const rows = list.map((s) => ({ Version: s.version, Enabled: s.enabled, Created: new Date(s.created).toISOString().slice(0, 19) }));
    return out(p, list.map((s) => ({ id: `${P(v).uri}secrets/${one(p, '--name')}/${s.version}`, attributes: { enabled: s.enabled } })), rows, ['Version', 'Enabled', 'Created']);
  },
  'keyvault secret list': (p, w) => {
    const v = needName(w, 'kv', one(p, '--vault-name'), 'Key vault');
    kvGuard(w, v, 'readMetadata', KV_READ, '*');
    const names = Object.keys(P(v).secrets);
    w.emit('kv.secret', { action: 'list', vault: v.name, count: names.length });
    return out(p, names.map((n) => ({ name: n, id: `${P(v).uri}secrets/${n}` })), names.map((n) => ({ Name: n, Versions: P(v).secrets[n].length })), ['Name', 'Versions']);
  },

  /* ----- App Configuration ----- */
  'appconfig create': (p, w) => {
    req(p, [RG, NM]);
    const name = one(p, '--name')!;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{3,48}[a-zA-Z0-9]$/.test(name)) throw new SimError(`Store name '${name}' is invalid. Use 5-50 letters, numbers and hyphens.`, 'InvalidName');
    const [r, created] = upsert(w, 'appconfig', { rg: rgName(p), name, location: one(p, '--location') }, true, () => ({ endpoint: `https://${lc(name)}.azconfig.io`, sku: one(p, '--sku') ?? 'Standard', kvs: [], features: [] }));
    if (created) w.emit('appconfig.create', { name, rg: r.rg, sku: P(r).sku });
    return out(p, { id: r.id, name, endpoint: P(r).endpoint, sku: { name: P(r).sku }, provisioningState: 'Succeeded' });
  },
  'appconfig kv set': (p, w) => {
    req(p, [NM, ['--key', '']]);
    const s = needName(w, 'appconfig', one(p, '--name'), 'App Configuration store');
    const e = { key: one(p, '--key')!, label: one(p, '--label') ?? null, value: one(p, '--value') ?? '', contentType: one(p, '--content-type') ?? null };
    P(s).kvs = (P(s).kvs as Props[]).filter((x) => !(x.key === e.key && x.label === e.label)).concat(e);
    w.emit('appconfig.set', { store: s.name, key: e.key, label: e.label, value: e.value });
    return out(p, { key: e.key, label: e.label, value: e.value, contentType: e.contentType, locked: false });
  },
  'appconfig kv list': (p, w) => {
    const s = needName(w, 'appconfig', one(p, '--name'), 'App Configuration store');
    const lab = one(p, '--label');
    const list = (P(s).kvs as Props[]).filter((x) => !lab || lab === '*' || (lab === '\\0' ? x.label === null : x.label === lab));
    w.emit('appconfig.list', { store: s.name, count: list.length });
    return out(p, list, list.map((x) => ({ Key: x.key, Label: x.label ?? '(No label)', Value: x.contentType?.includes('keyvaultref') ? `→ ${JSON.parse(x.value).uri}` : x.value })), ['Key', 'Label', 'Value']);
  },
  'appconfig kv set-keyvault': (p, w) => {
    req(p, [NM, ['--key', ''], ['--secret-identifier', '']]);
    const s = needName(w, 'appconfig', one(p, '--name'), 'App Configuration store');
    const uri = one(p, '--secret-identifier')!;
    const m = uri.match(/^https:\/\/([a-z0-9-]+)\.vault\.azure\.net\/secrets\/([\w-]+)/i);
    if (!m) throw new SimError('--secret-identifier must look like https://<vault>.vault.azure.net/secrets/<name>', 'BadRequest');
    const e = { key: one(p, '--key')!, label: one(p, '--label') ?? null, value: JSON.stringify({ uri }), contentType: 'application/vnd.microsoft.appconfig.keyvaultref+json;charset=utf-8' };
    P(s).kvs = (P(s).kvs as Props[]).filter((x) => !(x.key === e.key && x.label === e.label)).concat(e);
    w.emit('appconfig.kvref', { store: s.name, key: e.key, vault: m[1], secret: m[2] });
    return out(p, { ...e, note: 'App Configuration stores only the reference. Your app reads the secret from Key Vault with its own identity.' });
  },
  'appconfig feature set': (p, w) => {
    req(p, [NM, ['--feature', '']]);
    const s = needName(w, 'appconfig', one(p, '--name'), 'App Configuration store');
    const f = { name: one(p, '--feature')!, label: one(p, '--label') ?? null, enabled: false, description: one(p, '--description') ?? '' };
    const prev = (P(s).features as Props[]).find((x) => x.name === f.name && x.label === f.label);
    if (prev) f.enabled = prev.enabled;
    P(s).features = (P(s).features as Props[]).filter((x) => x !== prev).concat(f);
    w.emit('appconfig.feature', { store: s.name, action: 'set', name: f.name, enabled: f.enabled });
    return out(p, { feature: f.name, key: `.appconfig.featureflag/${f.name}`, label: f.label, state: f.enabled ? 'on' : 'off' });
  },
  'appconfig feature enable': (p, w) => featureToggle(p, w, true),
  'appconfig feature disable': (p, w) => featureToggle(p, w, false),
  'appconfig feature list': (p, w) => {
    const s = needName(w, 'appconfig', one(p, '--name'), 'App Configuration store');
    const l = P(s).features as Props[];
    return out(p, l, l.map((f) => ({ Feature: f.name, Label: f.label ?? '(No label)', State: f.enabled ? 'on' : 'off' })), ['Feature', 'Label', 'State']);
  },

  /* ----- Application Insights + alerts ----- */
  'monitor app-insights component create': (p, w) => {
    const name = one(p, '--app');
    if (!name) throw new SimError('the following arguments are required: --app/-a', 'MissingArgs');
    req(p, [RG]);
    const wsArg = one(p, '--workspace');
    const ws = wsArg ? w.res.find((r) => r.type === 'law' && (lc(r.name) === lc(wsArg) || lc(r.id) === lc(wsArg) || lc(wsArg).endsWith(`/${lc(r.name)}`))) : undefined;
    if (wsArg && !ws) throw new SimError(`Workspace '${wsArg}' was not found. Create it with az monitor log-analytics workspace create.`, 'WorkspaceNotFound');
    const [r, created] = upsert(w, 'appi', { rg: rgName(p), name, location: one(p, '--location') }, false, () => {
      const iKey = uuid(), appId = uuid();
      return { iKey, appId, workspace: ws?.name ?? null, kind: one(p, '--kind') ?? 'web', telemetry: { requests: [], dependencies: [], exceptions: [], traces: [] }, runs: 0 };
    });
    if (created) { P(r).connectionString = `InstrumentationKey=${P(r).iKey};IngestionEndpoint=https://${r.location}-8.in.applicationinsights.azure.com/;LiveEndpoint=https://${r.location}.livediagnostics.monitor.azure.com/;ApplicationId=${P(r).appId}`; w.emit('appi.create', { name, rg: r.rg, workspace: P(r).workspace }); }
    return out(p, appiJson(r));
  },
  'monitor app-insights component show': (p, w) => {
    const r = w.need('appi', rgName(p) ?? '', one(p, '--app', '--name')!);
    return out(p, appiJson(r));
  },
  'monitor app-insights query': (p, w) => {
    const q = one(p, '--analytics-query');
    if (!q) throw new SimError('the following arguments are required: --analytics-query', 'MissingArgs');
    const app = one(p, '--app', '--apps');
    if (app && !w.res.some((r) => r.type === 'appi' && (lc(r.name) === lc(app) || lc(P(r).appId) === lc(app)))) throw new SimError(`Application Insights '${app}' was not found.`, 'ResourceNotFound');
    const rows = kql(w, q);
    return kqlOut(rows);
  },
  'monitor scheduled-query create': (p, w) => {
    req(p, [RG, NM, ['--scopes', ''], ['--condition', '']]);
    const cond = one(p, '--condition')!;
    const m = cond.match(/^(count|avg|min|max|total)\s+(?:"[^"]*"\s+from\s+)?'?([\w-]+)'?\s*(>=|<=|>|<|=|!=)\s*(\d+(?:\.\d+)?)/i);
    if (!m) throw new SimError(`--condition should look like "count 'Failed' > 0" (the placeholder name is defined in --condition-query).`, 'BadRequest');
    const cq = many(p, '--condition-query').join(' ');
    const qm = cq.match(new RegExp(`^${m[2]}\\s*=\\s*(.+)$`));
    if (!qm) throw new SimError(`Define the placeholder: --condition-query "${m[2]}=requests | where success == false"`, 'BadRequest');
    const scope = one(p, '--scopes')!;
    const target = resourceAtScope(w, scope) ?? w.res.find((r) => (r.type === 'appi' || r.type === 'law') && lc(scope).endsWith(`/${lc(r.name)}`));
    if (!target) throw new SimError(`Scope '${scope}' was not found. Use the Application Insights or Log Analytics resource ID.`, 'ResourceNotFound');
    const g = w.needRg(rgName(p));
    const count = kql(w, qm[1].trim()).length;
    const th = Number(m[4]);
    const fired = m[3] === '>' ? count > th : m[3] === '>=' ? count >= th : m[3] === '<' ? count < th : m[3] === '<=' ? count <= th : m[3] === '=' ? count === th : count !== th;
    const name = one(p, '--name')!;
    const existing = w.find('logalert', g.name, name);
    const r = existing ?? ((w as any).add('logalert', g, name, target.location, {}) as Res);
    Object.assign(r.props, { target: target.name, query: qm[1].trim(), operator: m[3], threshold: th, frequency: one(p, '--evaluation-frequency') ?? '5m', window: one(p, '--window-size') ?? '5m', severity: Number(one(p, '--severity') ?? 2), lastCount: count, fired: fired ? 1 : 0 });
    w.emit('logalert.create', { name, target: target.name, query: qm[1].trim(), threshold: th, count, fired });
    if (fired) { w.notify('bad', `🔔 Log alert fired: ${name}`, `${count} row(s) matched "${qm[1].trim()}" in the last ${r.props.window} (threshold ${m[3]} ${th}).`); w.emit('logalert.fired', { name, count }); }
    const body = out(p, { name, scopes: [target.id], criteria: { allOf: [{ query: qm[1].trim(), timeAggregation: 'Count', operator: m[3], threshold: th }] }, evaluationFrequency: r.props.frequency, windowSize: r.props.window, severity: r.props.severity, enabled: true }).out ?? '';
    return { out: `${body}\nFirst evaluation: ${count} matching row(s) -> ${fired ? 'ALERT FIRED (see notifications)' : 'no alert'}.` };
  },
};
function appiJson(r: Res) { return { id: r.id, name: r.name, appId: P(r).appId, instrumentationKey: P(r).iKey, connectionString: P(r).connectionString, workspaceResourceId: P(r).workspace, kind: P(r).kind, provisioningState: 'Succeeded' }; }
export function kqlOut(rows: Props[]): DevOut {
  if (!rows.length) return { out: '(no rows)' };
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const r = (rows as any).render;
  return { out: table(rows.map((x) => Object.fromEntries(cols.map((c) => [c, typeof x[c] === 'object' && x[c] !== null ? JSON.stringify(x[c]) : x[c]]))), cols) + (r ? `\n(render ${r}: the portal draws this as a ${r.replace('chart', ' chart')})` : '') };
}
function consistency(v: string) {
  const l = ['Strong', 'BoundedStaleness', 'Session', 'ConsistentPrefix', 'Eventual'].find((x) => lc(x) === lc(v));
  if (!l) throw new SimError(`Consistency level '${v}' is invalid. Use Strong, BoundedStaleness, Session, ConsistentPrefix or Eventual.`, 'BadRequest');
  return l;
}
function kvGuard(w: World, v: Res, action: string, allowed: string[], secret: string) {
  if (!P(v).rbac) return;
  if (hasDataRole(w, w.current, v, allowed)) return;
  w.emit('kv.denied', { vault: v.name, action, user: w.current });
  throw new SimError(`Caller is not authorized to perform action on resource.\nIf role assignments, deny assignments or role definitions were changed recently, please observe propagation time.\nCaller: name=${w.current}\nAction: 'Microsoft.KeyVault/vaults/secrets/${action}/action'\nResource: '${v.id.toLowerCase()}/secrets/${secret}'\nAssignment: (not found)\nVault: ${v.name};location=${v.location}\n(Owner is a control-plane role. Give yourself a data role such as Key Vault Secrets Officer on the vault.)`, 'Forbidden');
}
function settingsSet(p: Parsed, w: World, type: ResType): DevOut {
  req(p, [RG, NM]);
  const app = appOf(w, p, type);
  const pairs = kv(many(p, '--settings'));
  if (!Object.keys(pairs).length) throw new SimError('Use --settings KEY=value [KEY=value ...]', 'MissingArgs');
  P(app).settings = { ...(P(app).settings ?? {}), ...pairs };
  const refs = Object.values(pairs).filter((v) => kvRef(v)).length;
  w.emit('appsettings.set', { kind: type, name: app.name, keys: Object.keys(pairs), kvRefs: refs });
  return out(p, Object.entries(P(app).settings).map(([name, value]) => ({ name, value: kvRef(String(value)) ? value : String(value), slotSetting: false })));
}
function settingsList(p: Parsed, w: World, type: ResType): DevOut {
  req(p, [RG, NM]);
  const app = appOf(w, p, type);
  const s = (P(app).settings ?? {}) as Record<string, string>;
  let refs = 0, resolved = 0;
  const list = Object.entries(s).map(([name, value]) => {
    const ref = kvRef(value);
    if (!ref) return { name, value, slotSetting: false };
    refs++;
    const status = resolveRef(w, app, ref);
    if (status === 'Resolved') resolved++;
    return { name, value, slotSetting: false, keyVaultReferenceStatus: status };
  });
  w.emit('appsettings.list', { kind: type, name: app.name, kvRefs: refs, resolved, allResolved: refs > 0 && refs === resolved });
  return out(p, list);
}
function featureToggle(p: Parsed, w: World, on: boolean): DevOut {
  req(p, [NM, ['--feature', '']]);
  const s = needName(w, 'appconfig', one(p, '--name'), 'App Configuration store');
  const f = (P(s).features as Props[]).find((x) => x.name === one(p, '--feature') && x.label === (one(p, '--label') ?? null));
  if (!f) throw new SimError(`Feature flag '${one(p, '--feature')}' doesn't exist. Create it with az appconfig feature set.`, 'NotFound');
  f.enabled = on;
  w.emit('appconfig.feature', { store: s.name, action: on ? 'enable' : 'disable', name: f.name, enabled: on });
  return out(p, { feature: f.name, label: f.label, state: on ? 'on' : 'off' });
}
function sbTopic(w: World, p: Parsed) {
  const ns = w.need('sbns', rgName(p), one(p, '--namespace-name')!);
  const t = P(ns).topics[one(p, '--topic-name')!] as { subs: Record<string, SubQ> } | undefined;
  if (!t) throw new SimError(`Topic '${one(p, '--topic-name')}' was not found in ${ns.name}.`, 'MessagingEntityNotFound');
  return t;
}
function sbSub(w: World, p: Parsed) {
  const s = sbTopic(w, p).subs[one(p, '--subscription-name')!];
  if (!s) throw new SimError(`Subscription '${one(p, '--subscription-name')}' was not found.`, 'MessagingEntityNotFound');
  return s;
}

/** All az command paths this module adds (for Tab completion and "did you mean"). */
export const DEV_COMMANDS = Object.keys(AZ);
/** Help text for `az <group> --help`. */
export const DEV_GROUPS: Record<string, [string, string][]> = {
  acr: [['create', 'Create a container registry (--sku Basic|Standard|Premium).'], ['build', 'Build an image in Azure and push it: az acr build -r <reg> -t repo:tag .'], ['import', 'Copy an image from another registry into yours.'], ['login', 'Sign in to the registry.']],
  'acr repository': [['list', 'List repositories.'], ['show-tags', 'List tags of a repository.'], ['show-manifests', 'List digests of a repository.']],
  'acr task': [['create', 'Create a task with commit and base-image triggers.'], ['run', 'Run a task now.'], ['list', 'List tasks.']],
  containerapp: [['create', 'Create a container app (--image, --ingress, --target-port, --min/max-replicas, --scale-rule-*).'], ['update', 'Change image, env vars or scale (creates a new revision).'], ['show', 'Show a container app.'], ['logs show', 'Show console or system logs (--type console|system).'], ['replica list', 'List running replicas.'], ['identity assign', 'Turn on a managed identity.']],
  'containerapp env': [['create', 'Create a Container Apps environment.']],
  'containerapp revision': [['list', 'List revisions with traffic and replicas.'], ['set-mode', 'Single or multiple active revisions (--mode).'], ['deactivate', 'Deactivate a revision with no traffic.']],
  'containerapp ingress traffic': [['set', 'Split traffic: --revision-weight <rev1>=80 <rev2>=20']],
  aks: [['create', 'Create an AKS cluster.'], ['get-credentials', 'Point kubectl at a cluster.'], ['scale', 'Change the node count.'], ['list', 'List clusters.']],
  cosmosdb: [['create', 'Create a Cosmos DB for NoSQL account.'], ['update', 'Change --default-consistency-level or --capabilities.'], ['show', 'Show an account.']],
  'cosmosdb sql database': [['create', 'Create a database.']],
  'cosmosdb sql container': [['create', 'Create a container (-p partition key, --idx, --vector-embeddings).'], ['update', 'Change the indexing policy (--idx).'], ['show', 'Show a container.']],
  'postgres flexible-server': [['create', 'Create a flexible server.'], ['show', 'Show a server.']],
  'postgres flexible-server parameter': [['set', 'Set a server parameter, e.g. -n azure.extensions --value VECTOR'], ['show', 'Show a parameter.']],
  'postgres flexible-server firewall-rule': [['create', 'Allow an IP range.']],
  redisenterprise: [['create', 'Create an Azure Managed Redis cache (--modules name=RediSearch).'], ['show', 'Show a cache.']],
  'servicebus namespace': [['create', 'Create a namespace (--sku Basic|Standard|Premium).'], ['show', 'Show a namespace.']],
  'servicebus queue': [['create', 'Create a queue (--max-delivery-count).'], ['show', 'Show message counts.']],
  'servicebus topic': [['create', 'Create a topic.']],
  'servicebus topic subscription': [['create', 'Create a subscription.']],
  'servicebus topic subscription rule': [['create', 'Add a SQL filter (--filter-sql-expression).'], ['delete', "Delete a rule, e.g. '$Default'."], ['list', 'List rules.']],
  'eventgrid topic': [['create', 'Create a custom topic.'], ['show', 'Show a topic and its endpoint.']],
  'eventgrid event-subscription': [['create', 'Subscribe an endpoint (filters, retries, dead-letter).'], ['list', 'List subscriptions.']],
  keyvault: [['create', 'Create a key vault (RBAC by default).'], ['show', 'Show a vault.']],
  'keyvault secret': [['set', 'Create a secret or a new version.'], ['show', 'Read a secret.'], ['list', 'List secrets.'], ['list-versions', 'List versions of a secret.']],
  appconfig: [['create', 'Create an App Configuration store.']],
  'appconfig kv': [['set', 'Set a key (with --label).'], ['list', 'List keys.'], ['set-keyvault', 'Add a Key Vault reference.']],
  'appconfig feature': [['set', 'Create a feature flag.'], ['enable', 'Turn a flag on.'], ['disable', 'Turn a flag off.'], ['list', 'List flags.']],
  'monitor app-insights component': [['create', 'Create a workspace-based Application Insights resource.'], ['show', 'Show it (connection string).']],
  'monitor app-insights': [['query', 'Run a KQL query: --analytics-query "requests | take 10"']],
  'monitor scheduled-query': [['create', 'Create a log search alert rule.']],
};
export const SHELL_HELP = 'Other tools in this shell: kubectl, psql, redis-cli, func, curl, sleep, python <script>.py, pip install, export, ls, cat';
export const SHELL_COMPLETIONS = ['kubectl apply -f', 'kubectl get pods', 'kubectl describe pods -l', 'kubectl logs', 'kubectl rollout undo deployment/', 'psql -h', 'redis-cli -h', 'func azure functionapp publish', 'curl', ...Object.keys(DEV_SCRIPTS).map((s) => `python ${s}`), ...Object.keys(FILES).map((f) => `cat ${f}`)];

/** Run an az command this module owns. Returns null to let the main CLI handle it. */
export function az(tokens: string[], w: World): DevOut | null {
  const first = lc(tokens[0]);
  const extra: Record<string, string> = first === 'webapp' || first === 'appservice' ? { '-p': '--plan' } : first === 'functionapp' ? { '-s': '--storage-account', '-p': '--plan' } : first === 'monitor' ? { '-a': '--app' } : first === 'keyvault' ? { '-f': '--file' } : {};
  const p = parse(tokens, extra);
  if (has(p, '--help')) return null;
  let path = '';
  for (let n = Math.min(6, p.words.length); n > 0; n--) {
    const cand = p.words.slice(0, n).join(' ');
    if (AZ[cand]) { path = cand; break; }
  }
  if (!path) return null;
  if (path === 'webapp create' && !has(p, '--container-image-name') && !has(p, '--deployment-container-image-name')) return null;
  if (path === 'functionapp create' && !has(p, '--flexconsumption-location')) return null;
  if (path === 'role assignment create' && !DATA_ROLES.some((r) => lc(r) === lc(one(p, '--role')))) return null;
  w.emit('cli', { command: `az ${p.words.join(' ')}`, path, line: `az ${tokens.join(' ')}` });
  try {
    return AZ[path](p, w);
  } catch (e) {
    if (e instanceof SimError) return { error: e.code === 'MissingArgs' ? `${e.message}\nTry 'az ${path} --help' for examples.` : `(${e.code}) ${e.message}` };
    throw e;
  }
}

/* ------------------------------------------------------------------ */
/* Cloud Shell tools: kubectl, psql, redis-cli, func, curl, sleep,     */
/* pip, ls, cat and the Python scripts                                 */
/* ------------------------------------------------------------------ */
export function shell(tokens: string[], w: World): DevOut | null {
  const c = lc(tokens[0]);
  const rest = tokens.slice(1);
  try {
    if (c === 'kubectl') return kubectl(rest, w);
    if (c === 'psql') return psql(rest, w);
    if (c === 'redis-cli') return redisCli(rest, w);
    if (c === 'sleep') {
      const s = Number(String(rest[0] ?? '').replace(/s$/, ''));
      if (!Number.isFinite(s) || s < 0) return { error: 'usage: sleep <seconds>' };
      dev(w).clock = clock(w) + s;
      w.emit('clock', { seconds: s, now: dev(w).clock });
      return { out: `(${s} simulated seconds passed)` };
    }
    if (c === 'func') return func(rest, w);
    if (c === 'curl') return curl(rest, w);
    if (c === 'ls' || c === 'dir') return { out: ['main.bicep', ...Object.keys(FILES), ...Object.keys(DEV_SCRIPTS), ...Object.keys(AI_SCRIPTS), ...Object.keys(AI_SAMPLES)].join('  ') };
    if (c === 'cat' && rest[0] && (FILES[rest[0]] || DEV_SCRIPTS[rest[0]])) { w.emit('file.view', { file: rest[0] }); if (DEV_SCRIPTS[rest[0]]) w.emit('py.view', { file: rest[0] }); return { out: FILES[rest[0]] ?? DEV_SCRIPTS[rest[0]] }; }
    if (c === 'pip' || c === 'pip3') {
      if (rest[0] !== 'install') return { error: 'usage: pip install <package> [<package> ...]' };
      const pkgs = rest.slice(1).map((x) => x.replace(/^["']|["']$/g, '').replace(/[<>=\[].*$/, '').toLowerCase()).filter((x) => x && !x.startsWith('-'));
      const known = [...new Set([...AI_PKGS, ...DEV_PKGS])];
      const bad = pkgs.find((x) => !known.includes(x));
      if (bad) return { error: `ERROR: Could not find a version that satisfies the requirement ${bad} (simulated index has: ${known.join(', ')})` };
      (w as any).pip = [...new Set([...((w as any).pip ?? []), ...pkgs])];
      w.emit('pip.install', { pkgs });
      return { out: `${pkgs.map((x) => `Collecting ${x}\n  Downloading ${x}-${x === 'azure-ai-projects' ? '2.11.0' : '1.0.0'}-py3-none-any.whl`).join('\n')}\nSuccessfully installed ${pkgs.join(' ')}` };
    }
    if ((c === 'python' || c === 'python3') && rest[0] && DEV_SCRIPTS[rest[0]]) return python(rest[0], rest.slice(1), w);
  } catch (e) {
    if (e instanceof SimError) return { error: e.message };
    throw e;
  }
  return null;
}

function func(args: string[], w: World): DevOut {
  if (args[0] === 'azure' && args[1] === 'functionapp' && args[2] === 'publish') {
    const name = args[3];
    if (!name) return { error: 'usage: func azure functionapp publish <APP_NAME>' };
    const f = byName(w, 'functionapp', name);
    if (!f) return { error: `Can't find app with name "${name}"` };
    P(f).published = true;
    P(f).functions = [{ name: 'submit_order', trigger: 'httpTrigger', route: 'orders', output: 'serviceBus:orders' }];
    w.emit('func.publish', { app: f.name, functions: ['submit_order'] });
    return { out: `Getting site publishing info...\nCreating archive for current directory...\nUploading 2.1 KB [##############################]\nRemote build in progress, please wait...\nRemote build succeeded!\nDeployment completed successfully.\nFunctions in ${f.name}:\n    submit_order - [httpTrigger]\n        Invoke url: https://${f.props.host}/api/orders` };
  }
  if (args[0] === 'init' || args[0] === 'new') return { out: 'This practice folder already has a function project: function_app.py, host.json, requirements.txt. Run: cat function_app.py' };
  if (args[0] === 'start') return { out: 'Local run is skipped in this practice shell. Publish instead: func azure functionapp publish <APP_NAME>' };
  return { error: 'Azure Functions Core Tools (practice). Try: func azure functionapp publish <APP_NAME>' };
}

function curl(args: string[], w: World): DevOut {
  const url = args.find((a) => /^https?:\/\//.test(a)) ?? '';
  const di = args.findIndex((a) => a === '-d' || a === '--data' || a === '--data-raw');
  const body = di >= 0 ? args[di + 1] ?? '' : '';
  const m = url.match(/^https?:\/\/([^/]+)(\/[^?]*)?/);
  if (!m) return { error: 'curl: try curl -X POST https://<app>.azurewebsites.net/api/orders -d \'{"orderId": 1001, "amount": 250}\'' };
  const host = lc(m[1]), path = m[2] ?? '/';
  const fa = w.res.find((r) => r.type === 'functionapp' && lc(r.props.host) === host);
  if (fa) {
    const a = P(fa);
    const res = (status: number, text: string, extra: Props = {}) => { w.emit('func.invoke', { app: fa.name, path, status, ...extra }); return status < 400 ? { out: text } : { error: text }; };
    if (!a.published || !/^\/api\/orders\/?$/.test(path)) return res(404, `HTTP/1.1 404 Not Found${a.published ? '' : '\n(No functions deployed yet. Run: func azure functionapp publish ' + fa.name + ')'}`);
    let order: Props;
    try { order = JSON.parse(body || '{}'); } catch { return res(400, 'HTTP/1.1 400 Bad Request\nThe body is not valid JSON.'); }
    const nsHost = a.settings?.SERVICEBUS__fullyQualifiedNamespace as string | undefined;
    if (!nsHost && !a.settings?.SERVICEBUS) return res(500, `HTTP/1.1 500 Internal Server Error\nMicrosoft.Azure.WebJobs.Host: Error indexing method 'Functions.submit_order'. The binding connection 'SERVICEBUS' isn't configured.\n(Add the app setting SERVICEBUS__fullyQualifiedNamespace=<namespace>.servicebus.windows.net)`);
    const ns = byName(w, 'sbns', (nsHost ?? '').split('.')[0]);
    if (!ns) return res(500, `HTTP/1.1 500 Internal Server Error\nServiceBusConnectionError: can't resolve '${nsHost}'.`);
    if (!hasDataRole(w, identityOf(fa), ns, SB_SEND)) return res(500, `HTTP/1.1 500 Internal Server Error\nUnauthorizedAccessException: Unauthorized access. 'Send' claim(s) are required to perform this operation.\n(The function app's managed identity needs the Azure Service Bus Data Sender role on ${ns.name}.)`, { reason: 'role' });
    const q = P(ns).queues.orders as Q | undefined;
    if (!q) return res(500, `HTTP/1.1 500 Internal Server Error\nMessagingEntityNotFound: queue 'orders' does not exist in ${ns.name}.`);
    q.active.push({ id: hex(12), orderId: Number(order.orderId ?? 1000 + q.active.length), amount: Number(order.amount ?? 0), body: JSON.stringify(order), deliveryCount: 0 });
    a.executions = (a.executions ?? 0) + 1;
    (a.log ??= []).push(`${now()} Executed 'Functions.submit_order' (Succeeded, Duration=38ms) -> queued order ${order.orderId ?? ''}`);
    kedaTick(w);
    return res(202, `HTTP/1.1 202 Accepted\nOrder queued\n(The output binding wrote the message to ${ns.name}/orders. Messages waiting: ${q.active.length}.)`, { queued: true, queueLength: q.active.length });
  }
  const web = w.res.find((r) => r.type === 'webapp' && lc(r.props.host) === host);
  if (web) {
    w.emit('webapp.browse', { name: web.name, via: 'cli' });
    if (P(web).container) { const pull = imagePull(w, P(web).container, (acr) => P(web).acrMi && hasDataRole(w, identityOf(web), acr, ACR_PULL)); const ok = pull.ok && Number(P(web).settings?.WEBSITES_PORT ?? 80) === pull.port; return ok ? { out: '{"status":"ok"}' } : { error: 'HTTP/1.1 503 Service Unavailable\n(Application Error: the container did not start. Check az webapp log tail.)' }; }
    return { out: '<html><body><h1>Your web app is running and waiting for your content</h1></body></html>' };
  }
  const app = w.res.find((r) => r.type === 'containerapp' && lc(r.props.fqdn) === host);
  if (app) {
    const a = P(app);
    const revs = (a.revisions as Rev[]).filter((r) => r.weight > 0);
    a.requests = (a.requests ?? 0) + 1;
    let pick = (a.requests * 37) % 100, rv = revs[0];
    for (const r of revs) { if (pick < r.weight) { rv = r; break; } pick -= r.weight; }
    if (!rv) return { error: 'HTTP/1.1 404 Not Found (no revision receives traffic)' };
    w.emit('aca.request', { app: app.name, revision: rv.name });
    return { out: `HTTP/1.1 200 OK\nx-ms-revision: ${rv.name}\n\nHello from Azure Container Apps (revision ${rv.name.split('--')[1]})` };
  }
  return { error: `curl: (6) Could not resolve host: ${m[1]}` };
}

/* ---------- Python scripts ---------- */
function needPkgs(w: World, pkgs: string[]) {
  const have: string[] = (w as any).pip ?? [];
  const miss = pkgs.filter((x) => !have.includes(x));
  if (miss.length) throw new SimError(`ModuleNotFoundError: No module named '${miss[0].replace(/-/g, '.').replace('redis.entraid', 'redis_entraid').replace('azure.appconfiguration.provider', 'azure.appconfiguration.provider')}'\nInstall it: pip install ${miss.join(' ')}`, 'Python');
}
function python(file: string, argv: string[], w: World): DevOut {
  const env = envOf(w);
  const emit = (ok: boolean, extra: Props = {}) => w.emit('py.run', { file, ok, args: argv, ...extra });
  const flag = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
  try {
    switch (file) {
      case 'cosmos_query.py': {
        needPkgs(w, ['azure-cosmos', 'azure-identity']);
        const [acct, c] = container(w, 'retail', 'orders');
        const strong = /Strong|BoundedStaleness/.test(P(acct).consistency);
        const k = strong ? 2 : 1;
        const lines: string[] = [];
        if (!c.items.length) {
          const per = indexed(c.idx, '/status') ? 6.86 : 5.71;
          ORDERS.forEach((o) => upsertItem(c, { ...o }));
          lines.push(`Seeded ${ORDERS.length} orders (${per.toFixed(2)} RU per write; fewer indexed paths make writes cheaper).`);
        }
        const point = +(1 * k).toFixed(2);
        const single = c.pk === '/customerId';
        const part = +((single ? 2.83 : 5.92) * k).toFixed(2);
        const statusIdx = indexed(c.idx, '/status');
        const cross = +((statusIdx ? 4.17 : 38.6) * k).toFixed(2);
        w.emit('cosmos.query', { account: acct.name, kind: 'point', ru: point, consistency: P(acct).consistency });
        w.emit('cosmos.query', { account: acct.name, kind: 'partition', ru: part, single, consistency: P(acct).consistency });
        w.emit('cosmos.query', { account: acct.name, kind: 'cross', ru: cross, scan: !statusIdx, consistency: P(acct).consistency });
        lines.push(`Consistency: ${P(acct).consistency}${strong ? ' (reads cost about 2x)' : ''}`, `Point read:             ${point.toFixed(2)} RU   read_item(id, partition key): the cheapest way to read`, `Single-partition query: ${part.toFixed(2)} RU   ${single ? 'stays inside the cust-42 partition' : `fans out to every partition: the container's partition key is ${c.pk}, not /customerId`}`, `Cross-partition query:  ${cross.toFixed(2)} RU   ${statusIdx ? 'status is indexed, so the query engine uses the index' : 'status is NOT indexed: every document was scanned (check the indexing policy)'}`);
        emit(true, { ru: { point, part, cross } });
        return { out: lines.join('\n') };
      }
      case 'load_products.py': {
        needPkgs(w, ['azure-cosmos', 'azure-identity']);
        const [, c] = container(w, 'retail', 'products');
        const list = argv.includes('--new') ? NEW_PRODUCTS : CATALOG;
        if (c.pk !== '/category' && c.pk !== '/id') { /* any key works; just note it */ }
        list.forEach((x) => upsertItem(c, { ...x }));
        emit(true, { count: list.length, new: argv.includes('--new') });
        return { out: `Upserted ${list.length} product${list.length > 1 ? 's' : ''} without embeddings (partition key ${c.pk}).\nEach write is now in the container's change feed.` };
      }
      case 'change_feed.py': {
        needPkgs(w, ['azure-cosmos', 'azure-identity']);
        const [acct, c] = container(w, 'retail', 'products');
        const fromStart = c.lease === null;
        const since = c.lease ?? 0;
        const changes = c.items.filter((x) => x._lsn > since).sort((a, b) => a._lsn - b._lsn);
        c.lease = c.lsn;
        let embedded = 0;
        const lines: string[] = [];
        for (const it of changes) {
          const h = String(hash(`${it.name} ${it.description}`));
          if (it.embedding_hash === h) { lines.push(`  skip   ${it.id}  (our own embedding write, content unchanged)`); continue; }
          upsertItem(c, { ...it, embedding: true, embedding_hash: h });
          embedded++;
          lines.push(`  embed  ${it.id}  ${it.name}  -> 1536 floats`);
        }
        w.emit('cosmos.changefeed', { account: acct.name, container: 'products', read: changes.length, embedded, skipped: changes.length - embedded, fromStart });
        emit(true, { read: changes.length, embedded });
        return { out: `${fromStart ? 'No saved continuation token: reading the change feed from the beginning.' : 'Resuming from the saved continuation token.'}\nRead ${changes.length} change(s):\n${lines.join('\n') || '  (nothing new)'}\nEmbedded ${embedded}, skipped ${changes.length - embedded}. Saved the continuation token for next time.` };
      }
      case 'vector_search.py': {
        needPkgs(w, ['azure-cosmos', 'azure-identity']);
        const [acct, c] = container(w, 'retail', 'products');
        const q = argv.join(' ') || 'waterproof jacket';
        const withVec = c.items.filter((x) => x.embedding);
        if (!withVec.length) { w.emit('cosmos.vector', { account: acct.name, results: 0, indexed: false, ru: 2.9 }); emit(true, { results: 0 }); return { out: `0 results. No product has an embedding yet: run python change_feed.py first.` }; }
        const vi = (c.idx.vectorIndexes ?? [])[0]?.type as string | undefined;
        const ru = vi === 'diskANN' ? 7.62 : vi === 'quantizedFlat' ? 9.4 : 41.8;
        const top = withVec.map((x) => ({ name: x.name, score: similarity(q, `${x.name} ${x.description}`) })).sort((a, b) => b.score - a.score).slice(0, 3);
        w.emit('cosmos.vector', { account: acct.name, query: q, results: top.length, indexed: !!vi, index: vi ?? 'none', ru, policy: !!c.vec });
        emit(true, { results: top.length });
        return { out: `Query: "${q}" (embedded with text-embedding-3-small, simulated locally)\nSELECT TOP 3 c.name, VectorDistance(c.embedding, @q) AS score FROM c ORDER BY VectorDistance(c.embedding, @q)\n${top.map((t) => `${t.score.toFixed(3)}  ${t.name}`).join('\n')}\nRequest charge: ${ru} RU (${vi ? `${vi} vector index` : 'no vector index: brute-force comparison of every vector'}). Cosine: higher score = more similar.` };
      }
      case 'cache_aside.py': {
        needPkgs(w, ['redis', 'redis-entraid']);
        const host = env.REDIS_HOST;
        if (!host) throw new SimError(`KeyError: 'REDIS_HOST'\nSet it first: export REDIS_HOST=<cache>.<region>.redis.azure.net`, 'Python');
        const r = redisFor(w, host);
        if (!r) throw new SimError(`redis.exceptions.ConnectionError: Error connecting to ${host}:10000. Name or service not known.`, 'Python');
        purge(w, r);
        const hit = redisCmd(w, r, ['GET', 'product:42']).out !== '(nil)';
        if (!hit) redisCmd(w, r, ['SET', 'product:42', '{"id":42,"name":"Monsoon trek rain jacket","price":3499}', 'EX', '300']);
        w.emit('redis.cache', { cache: r.name, key: 'product:42', hit });
        emit(true, { hit });
        return { out: hit ? 'Cache HIT  {"id":42,"name":"Monsoon trek rain jacket","price":3499}  (0.9 ms)' : 'Cache MISS -> loaded product 42 from PostgreSQL (118 ms) and cached it for 300 s.\nRun the script again to see a hit.' };
      }
      case 'redis_vector.py': {
        needPkgs(w, ['redis', 'redis-entraid']);
        const host = env.REDIS_HOST;
        if (!host) throw new SimError(`KeyError: 'REDIS_HOST'\nSet it first: export REDIS_HOST=<cache>.<region>.redis.azure.net`, 'Python');
        const r = redisFor(w, host);
        if (!r) throw new SimError(`redis.exceptions.ConnectionError: Error connecting to ${host}:10000.`, 'Python');
        if (!(P(r).modules as string[]).some((m) => lc(m) === 'redisearch')) throw new SimError("redis.exceptions.ResponseError: unknown command 'FT.SEARCH' (RediSearch is not enabled on this cache)", 'Python');
        const idx = P(r).idx['idx:docs'];
        if (!idx) throw new SimError('redis.exceptions.ResponseError: idx:docs: no such index\n(Create it first with redis-cli … FT.CREATE idx:docs ON HASH PREFIX 1 doc: SCHEMA …)', 'Python');
        if (!idx.vector) throw new SimError('redis.exceptions.ResponseError: Unknown field at offset: @embedding is not a VECTOR field', 'Python');
        ARTICLES.forEach(([title], i) => redisCmd(w, r, ['HSET', `doc:${i + 1}`, 'title', title, 'embedding', '<1536 float32 bytes>']));
        const q = argv.join(' ') || 'How do I reset my router?';
        const top = ARTICLES.map(([title, text]) => ({ title, d: 1 - similarity(q, `${title} ${text}`) })).sort((a, b) => a.d - b.d).slice(0, 3);
        w.emit('redis.vector', { cache: r.name, index: 'idx:docs', query: q, results: top.length, algo: idx.algo });
        emit(true, { results: top.length });
        return { out: `Stored ${ARTICLES.length} articles as hashes doc:1..doc:${ARTICLES.length}.\nFT.SEARCH idx:docs "*=>[KNN 3 @embedding $vec AS score]" PARAMS 2 vec <query vector> SORTBY score DIALECT 2\n${top.map((t) => `${t.d.toFixed(4)}  ${t.title}`).join('\n')}\n(score is cosine distance: lower = closer. Index algorithm: ${idx.algo || 'FLAT'}.)` };
      }
      case 'sb_send.py': {
        needPkgs(w, ['azure-servicebus', 'azure-identity']);
        const ns = nsFromEnv(w);
        const count = Math.max(1, Math.min(500, Number(flag('--count') ?? 5)));
        const qn = flag('--queue'), tn = flag('--topic');
        if (!qn && !tn) throw new SimError('usage: python sb_send.py --queue <queue> | --topic <topic> [--count N]', 'Python');
        const mk = (i: number): Msg => ({ id: hex(12), orderId: 1001 + i, amount: AMOUNTS[i % AMOUNTS.length], body: i === 2 ? '{"orderId": 1003, "amount": }' : JSON.stringify({ orderId: 1001 + i, amount: AMOUNTS[i % AMOUNTS.length] }), deliveryCount: 0, poison: i === 2 });
        if (qn) {
          const q = P(ns).queues[qn] as Q | undefined;
          if (!q) throw new SimError(`azure.servicebus.exceptions.MessagingEntityNotFoundError: queue '${qn}' was not found in ${ns.name}.`, 'Python');
          for (let i = 0; i < count; i++) q.active.push(mk(i));
          w.emit('sb.send', { ns: ns.name, entity: qn, kind: 'queue', count, queueLength: q.active.length });
          kedaTick(w);
          emit(true, { count });
          return { out: `Sent ${count} messages to queue '${qn}' (order 1003 has a broken JSON body on purpose).\nActive messages now: ${q.active.length}` };
        }
        const t = P(ns).topics[tn!] as { subs: Record<string, SubQ> } | undefined;
        if (!t) throw new SimError(`azure.servicebus.exceptions.MessagingEntityNotFoundError: topic '${tn}' was not found in ${ns.name}.`, 'Python');
        const routed: Record<string, number> = {};
        for (let i = 0; i < count; i++) { const m = mk(i); for (const [sn, s] of Object.entries(t.subs)) if (s.rules.some((r) => ruleMatch(r.sql, m))) { s.active.push({ ...m, id: hex(12) }); routed[sn] = (routed[sn] ?? 0) + 1; } }
        Object.keys(t.subs).forEach((sn) => (routed[sn] ??= 0));
        w.emit('sb.send', { ns: ns.name, entity: tn, kind: 'topic', count, routed });
        emit(true, { count });
        return { out: `Sent ${count} messages to topic '${tn}' (amounts: ${Array.from({ length: count }, (_, i) => AMOUNTS[i % AMOUNTS.length]).join(', ')}).\n${Object.entries(routed).map(([sn, n]) => `  subscription ${sn.padEnd(12)} got ${n}  (rules: ${t.subs[sn].rules.map((r) => `${r.name}: ${r.sql}`).join('; ') || 'none'})`).join('\n') || '  (no subscriptions: the messages were dropped)'}` };
      }
      case 'sb_receive.py': {
        needPkgs(w, ['azure-servicebus', 'azure-identity']);
        const ns = nsFromEnv(w);
        const qn = flag('--queue'), tn = flag('--topic'), sn = flag('--subscription');
        const ent = qn ? (P(ns).queues[qn] as Q | undefined) : tn && sn ? (P(ns).topics[tn]?.subs?.[sn] as SubQ | undefined) : undefined;
        const label = qn ? `queue '${qn}'` : `subscription '${tn}/${sn}'`;
        if (!qn && !(tn && sn)) throw new SimError('usage: python sb_receive.py --queue <queue> | --topic <topic> --subscription <sub> [--dlq]', 'Python');
        if (!ent) throw new SimError(`azure.servicebus.exceptions.MessagingEntityNotFoundError: ${label} was not found.`, 'Python');
        if (argv.includes('--dlq')) {
          w.emit('sb.dlq.read', { ns: ns.name, entity: qn ?? `${tn}/${sn}`, count: ent.dlq.length });
          emit(true, { dlq: ent.dlq.length });
          return { out: ent.dlq.length ? `Peeked ${ent.dlq.length} message(s) in the dead-letter queue of ${label}:\n${ent.dlq.map((m) => `  order ${m.orderId}  deliveryCount=${m.deliveryCount}  reason=${m.reason}  description="Message could not be consumed after ${m.deliveryCount} delivery attempts."  body=${m.body}`).join('\n')}\nFix the cause, then resubmit or discard these messages.` : `The dead-letter queue of ${label} is empty.` };
        }
        let completed = 0, abandoned = 0, dead = 0;
        const lines: string[] = [];
        let guard = 0;
        while (ent.active.length && guard++ < 2000) {
          const m = ent.active.shift()!;
          m.deliveryCount++;
          if (m.poison) {
            abandoned++;
            if (m.deliveryCount >= ent.maxDelivery) { m.reason = 'MaxDeliveryCountExceeded'; ent.dlq.push(m); dead++; lines.push(`  order ${m.orderId}: bad JSON, abandoned (delivery ${m.deliveryCount}/${ent.maxDelivery}) -> moved to the dead-letter queue`); w.emit('sb.dlq', { ns: ns.name, entity: qn ?? `${tn}/${sn}`, orderId: m.orderId, reason: m.reason }); }
            else { ent.active.push(m); if (m.deliveryCount === 1) lines.push(`  order ${m.orderId}: bad JSON, abandoned (delivery ${m.deliveryCount}/${ent.maxDelivery}), it comes back…`); }
          } else { completed++; if (completed <= 6) lines.push(`  order ${m.orderId}: amount ${m.amount}, processed -> complete`); }
        }
        if (completed > 6) lines.push(`  … and ${completed - 6} more completed`);
        w.emit('sb.settle', { ns: ns.name, entity: qn ?? `${tn}/${sn}`, completed, abandoned, deadlettered: dead });
        kedaTick(w);
        emit(true, { completed, dead });
        return { out: lines.length ? `Receiving from ${label} with peek-lock:\n${lines.join('\n')}\nCompleted ${completed}, abandoned ${abandoned} time(s), dead-lettered ${dead}. Active messages left: ${ent.active.length}.` : `No messages waiting in ${label}.` };
      }
      case 'eg_publish.py': {
        needPkgs(w, ['azure-eventgrid', 'azure-identity']);
        const v = env.EVENTGRID_TOPIC_ENDPOINT;
        if (!v) throw new SimError(`KeyError: 'EVENTGRID_TOPIC_ENDPOINT'\nSet it first: export EVENTGRID_TOPIC_ENDPOINT=https://<topic>.<region>-1.eventgrid.azure.net/api/events`, 'Python');
        const topic = w.res.find((r) => r.type === 'egtopic' && lc(P(r).endpoint) === lc(v.replace(/\/$/, '')));
        if (!topic) throw new SimError(`azure.core.exceptions.ServiceRequestError: '${v}' doesn't match a topic endpoint. Copy it from az eventgrid topic show --query endpoint.`, 'Python');
        const subjects = ['/uploads/photos/cat.jpg', '/uploads/docs/report.pdf', '/uploads/photos/beach.jpg', '/uploads/docs/plan.docx', '/uploads/photos/logo.png'];
        let delivered = 0, filtered = 0, dead = 0, dropped = 0;
        const lines: string[] = [];
        for (const s of P(topic).subs as Props[]) {
          const match = subjects.filter((x) => (!s.beginsWith || x.startsWith(s.beginsWith)) && (!s.endsWith || lc(x).endsWith(lc(s.endsWith))));
          filtered += subjects.length - match.length;
          const flaky = /flaky|broken|down/.test(s.endpoint);
          if (!flaky) { delivered += match.length; s.delivered += match.length; match.forEach(() => w.emit('eg.deliver', { topic: topic.name, sub: s.name, ok: true, attempts: 1 })); lines.push(`  ${s.name}: delivered ${match.length}, filtered out ${subjects.length - match.length}${s.endsWith ? ` (subject ends with ${s.endsWith})` : ''}`); }
          else {
            const attempts = Math.min(s.maxAttempts, 30);
            if (s.deadletter) { dead += match.length; s.dead += match.length; w.emit('eg.deadletter', { topic: topic.name, sub: s.name, count: match.length, attempts, container: s.deadletter }); }
            else { dropped += match.length; w.emit('eg.dropped', { topic: topic.name, sub: s.name, count: match.length }); }
            match.forEach(() => w.emit('eg.deliver', { topic: topic.name, sub: s.name, ok: false, attempts }));
            lines.push(`  ${s.name}: endpoint returned 503 for ${match.length} event(s); retried ${attempts} time(s) within ${s.ttl} min -> ${s.deadletter ? `dead-lettered to ${s.deadletter}` : 'DROPPED (no dead-letter destination set)'}`);
          }
        }
        w.emit('eg.publish', { topic: topic.name, count: subjects.length, delivered, filtered, deadlettered: dead, dropped });
        emit(true, { delivered, filtered });
        return { out: `Published ${subjects.length} CloudEvents (type Contoso.Uploads.FileUploaded) to ${topic.name}.\n${lines.join('\n') || '  No event subscriptions: Event Grid accepted the events and dropped them.'}` };
      }
      case 'get_secret.py': {
        needPkgs(w, ['azure-keyvault-secrets', 'azure-identity']);
        const v = env.KEY_VAULT_URL;
        if (!v) throw new SimError(`KeyError: 'KEY_VAULT_URL'\nSet it first: export KEY_VAULT_URL=https://<vault>.vault.azure.net/`, 'Python');
        const vault = w.res.find((r) => r.type === 'kv' && lc(P(r).uri) === lc(v.replace(/\/?$/, '/')));
        if (!vault) throw new SimError(`azure.core.exceptions.ServiceRequestError: can't reach '${v}'.`, 'Python');
        const name = argv[0] ?? 'cosmos-key';
        if (P(vault).rbac && !hasDataRole(w, w.current, vault, KV_READ)) { w.emit('kv.denied', { vault: vault.name, action: 'getSecret', user: w.current, via: 'sdk' }); throw new SimError(`azure.core.exceptions.HttpResponseError: (Forbidden) Caller is not authorized to perform action on resource.\nCaller: name=${w.current}\nAction: 'Microsoft.KeyVault/vaults/secrets/getSecret/action'\nCode: Forbidden  Status: 403\n(Give this identity Key Vault Secrets User on ${vault.name}.)`, 'Python'); }
        const s = (P(vault).secrets[name] ?? []).at(-1) as { version: string; value: string } | undefined;
        if (!s) throw new SimError(`azure.core.exceptions.ResourceNotFoundError: (SecretNotFound) A secret with (name/id) ${name} was not found in this key vault.`, 'Python');
        w.emit('kv.secret', { action: 'sdk-get', vault: vault.name, name, version: s.version });
        emit(true);
        return { out: `${name}  version ${s.version}  value ${s.value.slice(0, 3)}***\n(DefaultAzureCredential used your Cloud Shell sign-in. In Azure the same code uses the app's managed identity.)` };
      }
      case 'get_config.py': {
        needPkgs(w, ['azure-appconfiguration-provider', 'azure-identity']);
        const v = env.APPCONFIG_ENDPOINT;
        if (!v) throw new SimError(`KeyError: 'APPCONFIG_ENDPOINT'\nSet it first: export APPCONFIG_ENDPOINT=https://<store>.azconfig.io`, 'Python');
        const store = w.res.find((r) => r.type === 'appconfig' && lc(P(r).endpoint) === lc(v.replace(/\/$/, '')));
        if (!store) throw new SimError(`azure.core.exceptions.ServiceRequestError: can't reach '${v}'.`, 'Python');
        const kvs = P(store).kvs as Props[];
        const pick = new Map<string, Props>();
        kvs.filter((x) => x.label === null).forEach((x) => pick.set(x.key, x));
        kvs.filter((x) => x.label === 'prod').forEach((x) => pick.set(x.key, x));
        let kvResolved = 0, kvFailed = 0;
        const lines = [...pick.values()].map((x) => {
          if (!x.contentType?.includes('keyvaultref')) return `${x.key} = ${x.value}${x.label ? `   (label ${x.label})` : ''}`;
          const m = /https:\/\/([a-z0-9-]+)\.vault\.azure\.net\/secrets\/([\w-]+)/i.exec(JSON.parse(x.value).uri)!;
          const vault = byName(w, 'kv', m[1]);
          const s = vault && (P(vault).secrets[m[2]] ?? []).at(-1);
          if (!vault || !s || (P(vault).rbac && !hasDataRole(w, w.current, vault, KV_READ))) { kvFailed++; return `${x.key} = <Key Vault reference failed: ${!vault ? 'vault not found' : !s ? 'secret not found' : '403, no Key Vault Secrets User role'}>`; }
          kvResolved++;
          return `${x.key} = ${String(s.value).slice(0, 3)}***   (resolved from ${vault.name}/${m[2]})`;
        });
        const flags = (P(store).features as Props[]).filter((f) => f.label === null || f.label === 'prod').map((f) => `feature ${f.name}: ${f.enabled ? 'ON' : 'off'}`);
        w.emit('appconfig.load', { store: store.name, keys: pick.size, kvResolved, kvFailed, features: flags.length });
        emit(kvFailed === 0, { kvResolved });
        return { out: `Loaded ${pick.size} key(s) from ${store.name} (no-label keys first, then the prod label overrides them):\n${[...lines, ...flags].join('\n') || '(nothing)'}` };
      }
      case 'otel_app.py': {
        needPkgs(w, ['azure-monitor-opentelemetry']);
        const cs = env.APPLICATIONINSIGHTS_CONNECTION_STRING;
        if (!cs) throw new SimError(`ValueError: Instrumentation key cannot be none or empty.\nSet APPLICATIONINSIGHTS_CONNECTION_STRING (az monitor app-insights component show … --query connectionString -o tsv)`, 'Python');
        const key = /InstrumentationKey=([\w-]+)/i.exec(cs)?.[1];
        const appi = w.res.find((r) => r.type === 'appi' && lc(P(r).iKey) === lc(key));
        if (!appi) throw new SimError('ValueError: Invalid instrumentation key in the connection string.', 'Python');
        const ops = addTelemetry(w, appi);
        w.emit('otel.run', { appi: appi.name, requests: 3, failed: 1, opIds: ops, failedOp: ops[2] });
        emit(true);
        return { out: `configure_azure_monitor(): exporting traces, metrics and logs to ${appi.name}\n  GET /chat     200   342 ms  operation_Id ${ops[0]}  (Cosmos DB 12 ms, model 296 ms)\n  GET /health   200     3 ms  operation_Id ${ops[1]}\n  POST /chat    500 30140 ms  operation_Id ${ops[2]}  (model call timed out after 30 s)\nTelemetry sent. Each request, its dependencies and its exception share one operation_Id.` };
      }
    }
  } catch (e) {
    if (e instanceof SimError) { emit(false, { error: e.message.split('\n')[0] }); return { error: `Traceback (most recent call last):\n  File "/home/learner/${file}", line 8, in <module>\n${e.message}` }; }
    throw e;
  }
  return { error: 'Not supported.' };
}

/* ------------------------------------------------------------------ */
/* Portal views                                                        */
/* ------------------------------------------------------------------ */
export const DEV_TYPES: ResType[] = ['acr', 'acaenv', 'containerapp', 'cosmos', 'pg', 'redis', 'sbns', 'egtopic', 'kv', 'appconfig', 'appi', 'logalert', 'aks'];
export const DEV_TABS: Partial<Record<ResType, [string, string[]]>> = {
  acr: ['Services', ['Repositories', 'Tasks']],
  containerapp: ['Application', ['Revisions and replicas', 'Scale', 'Ingress']],
  acaenv: ['Settings', ['Apps']],
  cosmos: ['Data', ['Data Explorer', 'Default consistency']],
  pg: ['Settings', ['Server parameters', 'Databases']],
  redis: ['Data', ['Keys']],
  sbns: ['Entities', ['Queues', 'Topics']],
  egtopic: ['Entities', ['Event Subscriptions']],
  kv: ['Objects', ['Secrets']],
  appconfig: ['Operations', ['Configuration explorer', 'Feature manager']],
  appi: ['Monitoring', ['Logs', 'Transaction search']],
  aks: ['Kubernetes resources', ['Workloads', 'Services and ingresses']],
};
export interface DevView { ess: [string, string][]; blocks: { h: string; cols: string[]; rows: (string | number)[][] }[]; note?: string }
export function devView(w: World, r: Res, tab: string): DevView | null {
  const a = P(r);
  const v: DevView = { ess: [], blocks: [] };
  const roleRows = roles(w).filter((x) => lc(x.scope) === lc(r.id)).map((x) => [x.principalName, x.role]);
  switch (r.type) {
    case 'acr': {
      if (tab === 'Overview') { v.ess = [['Login server', a.loginServer], ['SKU', a.sku], ['Repositories', String(Object.keys(a.repos).length)], ['Admin user', 'Disabled (use Entra ID / managed identity)']]; if (roleRows.length) v.blocks.push({ h: 'Data-plane role assignments', cols: ['Principal', 'Role'], rows: roleRows }); v.note = 'Build in the cloud with az acr build; pull with a managed identity that has AcrPull.'; return v; }
      if (tab === 'Repositories') { v.blocks.push({ h: 'Repositories', cols: ['Repository', 'Tag', 'Digest'], rows: Object.entries(a.repos).flatMap(([repo, tags]) => (tags as Props[]).map((t) => [repo, t.tag, String(t.digest).slice(0, 19) + '…'])) }); return v; }
      if (tab === 'Tasks') { v.blocks.push({ h: 'ACR Tasks', cols: ['Name', 'Image', 'Commit trigger', 'Base image trigger'], rows: (a.tasks as Props[]).map((t) => [t.name, t.image, t.commit ? 'On' : 'Off', t.baseImage ? 'On' : 'Off']) }); return v; }
      return null;
    }
    case 'containerapp': {
      const revs = a.revisions as Rev[];
      if (tab === 'Overview') { v.ess = [['Environment', a.env], ['Application URL', a.fqdn ? `https://${a.fqdn}` : 'Ingress disabled'], ['Image', a.image], ['Revision mode', a.mode === 'multiple' ? 'Multiple' : 'Single'], ['Replicas now', String(a.replicas)], ['Identity', a.identity ? `System assigned (${a.identity.principalId})` : 'None']]; v.blocks.push({ h: 'Active revisions', cols: ['Revision', 'Traffic', 'Image'], rows: revs.filter((x) => x.active).map((x) => [x.name, `${x.weight}%`, x.image]) }); return v; }
      if (tab === 'Revisions and replicas') { v.blocks.push({ h: 'Revisions', cols: ['Name', 'Active', 'Traffic', 'Created'], rows: revs.map((x) => [x.name, x.active ? 'Yes' : 'No', `${x.weight}%`, new Date(x.created).toLocaleTimeString()]) }); return v; }
      if (tab === 'Scale') { v.ess = [['Min replicas', String(a.min)], ['Max replicas', String(a.max)], ['Replicas now', String(a.replicas)]]; v.blocks.push({ h: 'Scale rules', cols: ['Name', 'Type', 'Metadata'], rows: (a.rules as Rule[]).map((x) => [x.name, x.type, Object.entries(x.metadata).map(([k, val]) => `${k}=${val}`).join(' ')]) }); v.note = 'Without a custom rule, Container Apps scales on HTTP traffic.'; return v; }
      if (tab === 'Ingress') { v.ess = [['Ingress', a.ingress ?? 'Disabled'], ['Target port', String(a.targetPort)], ['FQDN', a.fqdn ?? '—']]; return v; }
      return null;
    }
    case 'acaenv': {
      const apps = w.res.filter((x) => x.type === 'containerapp' && x.props.env === r.name);
      if (tab === 'Overview' || tab === 'Apps') { v.ess = [['Default domain', a.defaultDomain ?? '—'], ['Log Analytics workspace', a.workspace ?? '—'], ['Workload profile', a.workloadProfile ?? 'Consumption']]; v.blocks.push({ h: 'Apps', cols: ['Name', 'Replicas', 'URL'], rows: apps.map((x) => [x.name, x.props.replicas, x.props.fqdn ?? '—']) }); return v; }
      return null;
    }
    case 'cosmos': {
      const conts = Object.entries(a.dbs as Record<string, { containers: Record<string, Cont> }>).flatMap(([db, d]) => Object.entries(d.containers).map(([n, c]) => [db, n, c] as const));
      if (tab === 'Overview' || tab === 'Data Explorer') { v.ess = tab === 'Overview' ? [['URI', a.endpoint], ['Default consistency', a.consistency], ['Databases', String(Object.keys(a.dbs).length)]] : []; v.blocks.push({ h: 'Containers', cols: ['Database', 'Container', 'Partition key', 'Items', 'Vector policy', 'RU/s'], rows: conts.map(([db, n, c]) => [db, n, c.pk, c.items.length, c.vec ? (c.vec.vectorEmbeddings ?? []).map((e: Props) => `${e.path} (${e.dimensions}, ${e.distanceFunction})`).join(', ') : '—', c.throughput]) }); return v; }
      if (tab === 'Default consistency') { v.ess = [['Current level', a.consistency]]; v.note = 'Strong → Bounded staleness → Session (default) → Consistent prefix → Eventual. Stronger = fresher reads, higher latency and RU cost.'; return v; }
      return null;
    }
    case 'pg': {
      if (tab === 'Overview') { v.ess = [['Server name', a.fqdn], ['Admin login', a.admin], ['PostgreSQL version', a.version], ['Compute', `${a.tier} ${a.sku}`], ['Public access', a.publicAccess ? 'Allow Azure services' : a.firewall.length ? 'Firewall rules' : 'No access yet']]; return v; }
      if (tab === 'Server parameters') { v.blocks.push({ h: 'Server parameters', cols: ['Name', 'Value'], rows: Object.entries(a.params).map(([k, val]) => [k, String(val) || '(empty)']) }); v.note = 'azure.extensions is the allow-list. CREATE EXTENSION fails for anything not in it.'; return v; }
      if (tab === 'Databases') { v.blocks.push({ h: 'postgres database', cols: ['Object', 'Detail'], rows: [...a.db.ext.map((e: string) => ['extension', e]), ...Object.entries(a.db.tables).map(([t, x]) => ['table', `${t} (${(x as Props).rows} rows)`]), ...a.db.indexes.map((i: Props) => ['index', `${i.name} (${i.method})`])] }); return v; }
      return null;
    }
    case 'redis': {
      if (tab === 'Overview' || tab === 'Keys') { purge(w, r); const t = clock(w); v.ess = tab === 'Overview' ? [['Host name', a.host], ['Port', '10000 (TLS)'], ['SKU', a.sku], ['Clustering policy', a.clustering], ['Modules', (a.modules as string[]).join(', ') || 'None'], ['Cache hits / misses', `${a.hits} / ${a.misses}`]] : []; v.blocks.push({ h: 'Keys', cols: ['Key', 'TTL (s)'], rows: Object.entries(a.data as Record<string, Props>).map(([k, x]) => [k, x.exp === null ? 'no expiry' : Math.ceil(x.exp - t)]) }); return v; }
      return null;
    }
    case 'sbns': {
      if (tab === 'Overview' || tab === 'Queues') { v.ess = tab === 'Overview' ? [['Host name', `${r.name}.servicebus.windows.net`], ['Pricing tier', a.sku]] : []; v.blocks.push({ h: 'Queues', cols: ['Queue', 'Active', 'Dead-letter', 'Max delivery count'], rows: Object.entries(a.queues as Record<string, Q>).map(([n, q]) => [n, q.active.length, q.dlq.length, q.maxDelivery]) }); return v; }
      if (tab === 'Topics') { v.blocks.push({ h: 'Topic subscriptions', cols: ['Topic', 'Subscription', 'Rules', 'Active', 'Dead-letter'], rows: Object.entries(a.topics as Record<string, { subs: Record<string, SubQ> }>).flatMap(([tn, t]) => Object.entries(t.subs).map(([sn, s]) => [tn, sn, s.rules.map((x) => `${x.name}: ${x.sql}`).join('; ') || '(none)', s.active.length, s.dlq.length])) }); return v; }
      return null;
    }
    case 'egtopic': {
      if (tab === 'Overview' || tab === 'Event Subscriptions') { v.ess = tab === 'Overview' ? [['Topic endpoint', a.endpoint]] : []; v.blocks.push({ h: 'Event subscriptions', cols: ['Name', 'Endpoint', 'Filter', 'Max attempts', 'Dead-letter', 'Delivered', 'Dead-lettered'], rows: (a.subs as Props[]).map((s) => [s.name, s.endpoint, [s.beginsWith && `begins ${s.beginsWith}`, s.endsWith && `ends ${s.endsWith}`].filter(Boolean).join(', ') || 'all', s.maxAttempts, s.deadletter ?? '—', s.delivered, s.dead]) }); return v; }
      return null;
    }
    case 'kv': {
      if (tab === 'Overview' || tab === 'Secrets') { v.ess = tab === 'Overview' ? [['Vault URI', a.uri], ['Permission model', a.rbac ? 'Azure role-based access control' : 'Vault access policy'], ['Soft delete', `${a.softDeleteDays} days`], ['Purge protection', a.purgeProtection ? 'On' : 'Off']] : []; v.blocks.push({ h: 'Secrets', cols: ['Name', 'Versions', 'Current version'], rows: Object.entries(a.secrets as Record<string, Props[]>).map(([n, l]) => [n, l.length, String(l.at(-1)?.version ?? '').slice(0, 12) + '…']) }); if (roleRows.length) v.blocks.push({ h: 'Data-plane role assignments', cols: ['Principal', 'Role'], rows: roleRows }); return v; }
      return null;
    }
    case 'appconfig': {
      if (tab === 'Overview' || tab === 'Configuration explorer') { v.ess = tab === 'Overview' ? [['Endpoint', a.endpoint], ['Pricing tier', a.sku]] : []; v.blocks.push({ h: 'Keys', cols: ['Key', 'Label', 'Value'], rows: (a.kvs as Props[]).map((x) => [x.key, x.label ?? '(No label)', x.contentType?.includes('keyvaultref') ? `Key Vault reference → ${JSON.parse(x.value).uri}` : x.value]) }); return v; }
      if (tab === 'Feature manager') { v.blocks.push({ h: 'Feature flags', cols: ['Name', 'Label', 'State'], rows: (a.features as Props[]).map((f) => [f.name, f.label ?? '(No label)', f.enabled ? 'On' : 'Off']) }); return v; }
      return null;
    }
    case 'appi': {
      const t = a.telemetry as Tel;
      if (tab === 'Overview') { v.ess = [['Instrumentation key', a.iKey], ['Connection string', String(a.connectionString).slice(0, 60) + '…'], ['Workspace', a.workspace ?? '—'], ['Requests / failed', `${t.requests.length} / ${t.requests.filter((x) => !x.success).length}`]]; return v; }
      if (tab === 'Logs') { v.blocks.push({ h: 'requests | where success == false', cols: ['timestamp', 'name', 'resultCode', 'duration', 'operation_Id'], rows: t.requests.filter((x) => !x.success).map((x) => [x.timestamp, x.name, x.resultCode, x.duration, x.operation_Id]) }); v.note = 'Run any KQL from Cloud Shell: az monitor app-insights query --app <name> -g <rg> --analytics-query "…"'; return v; }
      if (tab === 'Transaction search') { v.blocks.push({ h: 'Telemetry', cols: ['timestamp', 'type', 'name', 'operation_Id'], rows: [...t.requests, ...t.dependencies, ...t.exceptions].sort((x, y) => String(y.timestamp).localeCompare(String(x.timestamp))).slice(0, 20).map((x) => [x.timestamp, x.itemType, x.name ?? x.type, x.operation_Id]) }); return v; }
      return null;
    }
    case 'logalert': {
      if (tab === 'Overview') { v.ess = [['Scope', a.target], ['Query', a.query], ['Condition', `rows ${a.operator} ${a.threshold}`], ['Evaluated every', a.frequency], ['Last result', `${a.lastCount} row(s) → ${a.fired ? 'Fired' : 'OK'}`]]; return v; }
      return null;
    }
    case 'aks': {
      const s = a.k8s as ReturnType<typeof k8> | undefined;
      if (tab === 'Overview') { v.ess = [['Kubernetes version', a.version], ['Node count', String(a.nodes)], ['kubectl context', lc(dev(w).kube?.name) === lc(r.name) ? 'Current (az aks get-credentials done)' : 'Not set: run az aks get-credentials']]; return v; }
      if (tab === 'Workloads') { v.blocks.push({ h: 'Pods', cols: ['Name', 'Status', 'Restarts', 'Image'], rows: (s?.pods ?? []).map((x) => [x.name, x.status, x.restarts, x.image]) }); return v; }
      if (tab === 'Services and ingresses') { v.blocks.push({ h: 'Services', cols: ['Name', 'Type', 'External IP', 'Port'], rows: (s?.services ?? []).map((x) => [x.name, x.type, x.ip, x.port]) }); return v; }
      return null;
    }
  }
  return null;
}
