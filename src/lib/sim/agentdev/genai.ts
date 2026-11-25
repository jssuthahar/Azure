/**
 * AI-103 "genai" Cloud Shell commands (EDUCATION ONLY). cli.ts asks these
 * modules before the AZ-104 and AI-200 ones; this module returns null for
 * anything it doesn't handle.
 *
 * What it adds (new verbs only; AI-901's Foundry commands in ../foundry.ts are
 * reused through their exported functions, never shadowed):
 * - az cognitiveservices account project create | show | list
 * - az cognitiveservices account project connection create | list | show
 * - python <script> for the AI-103 GenAI and agent scripts below (call two
 *   deployments, RAG ingest and ask, evaluators, a tool-using agent with
 *   memory, Agent Framework orchestrations, approvals, prompt tuning,
 *   tracing, token analytics and multi-model routing)
 * - cat for those scripts and their sample data files
 * - pip install, only when at least one package is one of this area's
 *   (azure-ai-evaluation, agent-framework-foundry, OpenTelemetry, search)
 *
 * Nothing calls a real model. Answers are worked out by simple rules so the
 * labs can check what the learner did. Every state change emits one
 * `agt.*` event. Names follow Microsoft Learn (checked 25 Nov 2026):
 * azure-ai-projects 2.x (AIProjectClient, agents.create_version,
 * PromptAgentDefinition, FunctionTool, MemorySearchPreviewTool),
 * azure-ai-evaluation, Microsoft Agent Framework (FoundryChatClient,
 * SequentialBuilder, @tool(approval_mode="always_require")) and
 * AIProjectInstrumentor + configure_azure_monitor for tracing.
 */
import type { World } from '../world';
import { SimError, run, one, req, json, type AdminOut, type Parsed, type Cmd, type Handler } from '../admin/kit';
import type { Res } from '../engine';
import * as F from '../foundry';

/* ------------------------------------------------------------------ */
/* state kept on the Foundry resource (saved with the lab)             */
/* ------------------------------------------------------------------ */
interface Conn { name: string; project: string; type: 'AzureAISearch' | 'AppInsights'; target: string; auth: string }
interface Approval { id: string; amount: number; order: string; status: 'pending' | 'approved' | 'rejected' }
interface Agt {
  connections: Conn[];
  index: { name: string; chunks: number; embedding: string } | null;
  memory: { store: string; scope: string; items: string[] } | null;
  approvals: Approval[];
  traces: { id: string; spans: { name: string; ms: number; tokens: number; model?: string }[]; content: boolean }[];
}
const st = (r: Res): Agt => {
  const p = r.props as Record<string, any>;
  p.agt ??= { connections: [], index: null, memory: null, approvals: [], traces: [] };
  return p.agt as Agt;
};
const envOf = (w: World): Record<string, string> => ((w as any).env ??= {});

/* ------------------------------------------------------------------ */
/* sample files                                                        */
/* ------------------------------------------------------------------ */
const FILES: Record<string, string> = {
  'search-connection.yml': `# search-connection.yml: a project connection to Azure AI Search (Foundry IQ)
# Keyless: the project's managed identity needs "Search Index Data Reader" on the service.
name: search-contoso
type: azure_ai_search
target: https://srch-contoso-agents.search.windows.net
auth_type: aad`,
  'appinsights-connection.yml': `# appinsights-connection.yml: connect Application Insights so the project stores traces
name: appi-agents
type: app_insights
target: /subscriptions/<sub-id>/resourceGroups/rg-agents-lab/providers/Microsoft.Insights/components/appi-agents
auth_type: aad`,
  'rag-eval.jsonl': `{"query": "How long do I have to return a damaged kettle?", "context": "Damaged or faulty items can be returned within 10 days and are refunded in full.", "response": "You can return a damaged kettle within 10 days for a full refund.", "ground_truth": "10 days, full refund"}
{"query": "Is delivery free?", "context": "Delivery is free on orders above ₹999.", "response": "Yes, delivery is free on orders above ₹999.", "ground_truth": "Free above ₹999"}
{"query": "How long is the laptop warranty?", "context": "Laptops carry a 2-year warranty.", "response": "Laptops come with a 2-year warranty.", "ground_truth": "2 years"}
{"query": "When will my refund arrive?", "context": "Refunds reach the original payment method in 5 to 7 working days.", "response": "Refunds arrive instantly as store credit, plus a ₹500 voucher.", "ground_truth": "5 to 7 working days"}
{"query": "Do you deliver on Sundays in Chennai?", "context": "Express delivery in Chennai, Mumbai and Bengaluru arrives next day if ordered before 2 PM.", "response": "Express orders placed before 2 PM arrive the next day in Chennai.", "ground_truth": "Next-day express before 2 PM"}`,
  'agent-runs.jsonl': `{"query": "Where is order ORD-1042?", "tool_calls": [{"name": "get_order_status", "arguments": {"order_id": "ORD-1042"}}], "response": "ORD-1042 shipped yesterday and arrives Friday."}
{"query": "Where is my order?", "tool_calls": [{"name": "get_order_status", "arguments": {"order_id": "ORD-0000"}}], "response": "It arrives tomorrow."}
{"query": "Cancel order ORD-2210", "tool_calls": [], "response": "Your order is cancelled."}
{"query": "What's the return window for damaged items?", "tool_calls": [{"name": "file_search", "arguments": {"query": "damaged items return window"}}], "response": "Damaged items can be returned within 10 days."}`,
};
const SCRIPTS: Record<string, string> = {
  'call_models.py': `# call_models.py: call an LLM and a small model through one Foundry project
# pip install "azure-ai-projects>=2.3.0" azure-identity
import os, sys, time
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

project = AIProjectClient(endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"],   # .../api/projects/<project>
                          credential=DefaultAzureCredential())               # keyless: Microsoft Entra ID
openai = project.get_openai_client()                                         # OpenAI-compatible client

for d in project.deployments.list():
    print("deployed:", d.name, "->", d.model_name)

question = "In one sentence, why do apps call a deployment name?"
for deployment in sys.argv[1:] or [os.environ.get("MODEL_DEPLOYMENT", "gpt-4.1-mini")]:
    start = time.perf_counter()
    r = openai.responses.create(model=deployment, input=question)            # the DEPLOYMENT name, not the model
    ms = (time.perf_counter() - start) * 1000
    print(f"{deployment}: {r.output_text} [{r.usage.input_tokens} in / {r.usage.output_tokens} out, {ms:.0f} ms]")`,
  'list_connections.py': `# list_connections.py: what the project can reach, without a single key in code
import os
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

project = AIProjectClient(endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"], credential=DefaultAzureCredential())
for c in project.connections.list():
    print(c.name, c.type, c.target)
for d in project.deployments.list():
    print("deployment:", d.name, d.model_name)`,
  'ingest_docs.py': `# ingest_docs.py: chunk, embed and upload the policy documents (simulated index)
# pip install "azure-ai-projects>=2.3.0" azure-identity azure-search-documents
import os
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient
from azure.search.documents import SearchClient

cred = DefaultAzureCredential()
project = AIProjectClient(endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"], credential=cred)
openai = project.get_openai_client()
search_conn = project.connections.get("search-contoso")
search = SearchClient(endpoint=search_conn.target, index_name="policies-index", credential=cred)

docs = {"refund-policy.pdf": open("refund-policy.txt").read(),
        "delivery-faq.md": open("delivery-faq.md").read(),
        "warranty.pdf": open("warranty.txt").read()}
batch = []
for source, text in docs.items():
    for i, chunk in enumerate(split_into_chunks(text, size=500, overlap=50)):   # about 500 tokens, 50 overlap
        vector = openai.embeddings.create(model=os.environ.get("EMBEDDING_DEPLOYMENT", "text-embedding-3-small"),
                                          input=chunk).data[0].embedding
        batch.append({"id": f"{source}-{i}", "source": source, "chunk": i, "content": chunk, "contentVector": vector})
search.upload_documents(batch)
print(f"Uploaded {len(batch)} chunks")`,
  'rag_app.py': `# rag_app.py: retrieve, then answer with citations (retrieval-augmented generation)
# pip install "azure-ai-projects>=2.3.0" azure-identity azure-search-documents
import os, sys
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizableTextQuery

cred = DefaultAzureCredential()
project = AIProjectClient(endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"], credential=cred)
openai = project.get_openai_client()
question = sys.argv[-1]

sources = ""
if "--no-retrieval" not in sys.argv:
    conn = project.connections.get("search-contoso")
    search = SearchClient(endpoint=conn.target, index_name="policies-index", credential=cred)
    hits = search.search(search_text=question,                                   # hybrid: keywords + vectors
                         vector_queries=[VectorizableTextQuery(text=question, k_nearest_neighbors=3, fields="contentVector")],
                         top=3)
    sources = "\\n".join(f"[{h['source']}#{h['chunk']}] {h['content']}" for h in hits)

r = openai.responses.create(
    model=os.environ.get("MODEL_DEPLOYMENT", "gpt-4.1-mini"),
    instructions=("Answer from the sources and cite them like [file#chunk]. "
                  "If the sources don't contain the answer, say you don't know.\\n\\nSources:\\n" + sources),
    input=question, temperature=0.2)
print(r.output_text)`,
  'evaluate_app.py': `# evaluate_app.py: score answers with built-in evaluators (azure-ai-evaluation)
# pip install azure-ai-evaluation azure-identity
import os, sys
from azure.identity import DefaultAzureCredential
from azure.ai.evaluation import (evaluate, AzureOpenAIModelConfiguration,
    GroundednessEvaluator, RelevanceEvaluator, CoherenceEvaluator, ViolenceEvaluator,
    IndirectAttackEvaluator, TaskAdherenceEvaluator, ToolCallAccuracyEvaluator, IntentResolutionEvaluator)

project = os.environ["FOUNDRY_PROJECT_ENDPOINT"]
judge = AzureOpenAIModelConfiguration(azure_endpoint=project.split("/api/projects")[0],
                                      azure_deployment=os.environ.get("JUDGE_DEPLOYMENT", "gpt-4.1-mini"))
cred = DefaultAzureCredential()
quality = {"groundedness": GroundednessEvaluator(judge), "relevance": RelevanceEvaluator(judge),
           "coherence": CoherenceEvaluator(judge)}
safety = {"violence": ViolenceEvaluator(credential=cred, azure_ai_project=project),
          "indirect_attack": IndirectAttackEvaluator(credential=cred, azure_ai_project=project)}
agent = {"task_adherence": TaskAdherenceEvaluator(judge), "tool_call_accuracy": ToolCallAccuracyEvaluator(judge),
         "intent_resolution": IntentResolutionEvaluator(judge)}

# --data rag-eval.jsonl --evaluators groundedness,relevance
picked = {**quality, **safety, **agent}
result = evaluate(data=data_file, evaluators={k: picked[k] for k in chosen},
                  azure_ai_project=project)        # the run also shows up under Evaluations in the portal
print(result["metrics"])`,
  'order_agent.py': `# order_agent.py: a prompt agent with a role, a goal, a strict function schema and file search
import os, sys, json
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import PromptAgentDefinition, FunctionTool, FileSearchTool, MemorySearchPreviewTool

project = AIProjectClient(endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"], credential=DefaultAzureCredential())

get_order_status = FunctionTool(
    name="get_order_status",
    description="Look up the delivery status of one Contoso order. Call it whenever the customer gives an order number.",
    parameters={"type": "object",
                "properties": {"order_id": {"type": "string", "description": "Order number, for example ORD-1042"}},
                "required": ["order_id"], "additionalProperties": False},
    strict=True)

tools = [get_order_status, FileSearchTool(vector_store_ids=[os.environ.get("POLICY_STORE_ID", "vs_policies")])]
if "memory" in sys.argv:   # long-term memory (preview): one scope per customer
    tools.append(MemorySearchPreviewTool(memory_store_name="customer-memory", scope="{{$userId}}", update_delay=300))

agent = project.agents.create_version(agent_name="order-agent", definition=PromptAgentDefinition(
    model=os.environ.get("MODEL_DEPLOYMENT", "gpt-4.1-mini"),
    instructions=("Role: Contoso Retail's order assistant. Goal: tell customers where their order is and what the "
                  "returns policy says. Always call get_order_status for order questions and ask for the order "
                  "number if it's missing. Never promise a date the tool didn't return."),
    tools=tools))

openai = project.get_openai_client(agent_name="order-agent")
conversation = openai.conversations.create()          # short-term memory: the thread for this chat
r = openai.responses.create(conversation=conversation.id, input=sys.argv[-1])
for item in r.output:
    if item.type == "function_call":                  # the model ASKS; your code runs the function
        result = lookup_order(**json.loads(item.arguments))
        r = openai.responses.create(conversation=conversation.id,
            input=[{"type": "function_call_output", "call_id": item.call_id, "output": json.dumps(result)}])
print(r.output_text)`,
  'claim_pipeline.py': `# claim_pipeline.py: a multistep, tool-augmented flow with checks between the steps
import os, sys, json
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

project = AIProjectClient(endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"], credential=DefaultAzureCredential())
openai = project.get_openai_client()
model = os.environ.get("MODEL_DEPLOYMENT", "gpt-4.1-mini")
email = open("claim-email.txt").read()

# 1 classify (cheap, deterministic settings)
kind = openai.responses.create(model=model, temperature=0, input=f"Classify as warranty, refund or other: {email}").output_text
# 2 extract to a JSON schema (structured output)
fields = json.loads(openai.responses.create(model=model, input=email,
    text={"format": {"type": "json_schema", "name": "claim", "strict": True, "schema": CLAIM_SCHEMA}}).output_text)
# 3 call a real system (a tool), with retry and a fallback
status = with_retry(lambda: check_warranty(fields["serial_number"]), attempts=3) or "needs_human_review"
# 4 draft the reply, 5 verify it against the facts before sending
draft = openai.responses.create(model=model, input=f"Write a reply. Facts: {fields} {status}").output_text
ok = verify(draft, fields, status)    # rule checks: serial number quoted, no promises beyond policy
print(draft if ok else "Held for a person to check")`,
  'support_workflow.py': `# support_workflow.py: multi-agent orchestration with Microsoft Agent Framework
# pip install agent-framework-foundry azure-identity
import os, sys, asyncio
from azure.identity import AzureCliCredential
from agent_framework.foundry import FoundryChatClient
from agent_framework.orchestrations import SequentialBuilder, ConcurrentBuilder

client = FoundryChatClient(project_endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"],
                           model=os.environ.get("MODEL_DEPLOYMENT", "gpt-4.1-mini"), credential=AzureCliCredential())
triage   = client.as_agent(name="triage",   instructions="Work out what the customer needs. Don't answer it yourself.")
billing  = client.as_agent(name="billing",  instructions="Answer billing and refund questions from the policy.")
delivery = client.as_agent(name="delivery", instructions="Answer delivery questions. Use get_order_status.")
writer   = client.as_agent(name="writer",   instructions="Write one friendly reply from the specialists' notes.")
reviewer = client.as_agent(name="reviewer", instructions="Check the reply against policy. Say APPROVED or list fixes.")

pattern = sys.argv[sys.argv.index("--pattern") + 1] if "--pattern" in sys.argv else "sequential"
if pattern == "sequential":
    workflow = SequentialBuilder(participants=[triage, writer, reviewer]).build()
elif pattern == "concurrent":
    workflow = ConcurrentBuilder(participants=[billing, delivery]).build()   # fan out, then aggregate
# handoff, group-chat and magentic use HandoffBuilder, GroupChatBuilder and MagenticBuilder
events = asyncio.run(workflow.run("I was charged twice for ORD-1042 and it still hasn't arrived."))
for out in events.get_outputs():
    print(out)`,
  'refund_agent.py': `# refund_agent.py: a semi-autonomous agent. Reads freely, but a person approves every refund.
# pip install agent-framework-foundry azure-identity
from typing import Annotated
from agent_framework import tool
from agent_framework.foundry import FoundryChatClient

@tool
def lookup_order(order_id: Annotated[str, "Order number"]) -> str:
    """Read-only: order total, items and delivery status."""

@tool(approval_mode="always_require")                    # pauses the run until a person decides
def issue_refund(order_id: Annotated[str, "Order number"], amount_inr: Annotated[int, "Amount in rupees"]) -> str:
    """Write action: send money back to the customer."""
    if amount_inr > 20000:                               # hard limit in code, whatever the model says
        raise ValueError("Refunds over ₹20,000 go to the finance team")

agent = FoundryChatClient(...).as_agent(name="refund-agent", tools=[lookup_order, issue_refund],
    instructions="Resolve refund requests. Look up the order first. Never refund more than the order total.")
# python refund_agent.py "<request>"   -> runs until a tool needs approval
# python refund_agent.py --approve apr-1 | --reject apr-1   -> resumes the paused run`,
  'tune_prompt.py': `# tune_prompt.py: same question, different instructions and sampling settings
import os, sys
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

project = AIProjectClient(endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"], credential=DefaultAzureCredential())
openai = project.get_openai_client()
args = parse_args()   # --temperature 0.2 --top-p 1 --max-output-tokens 300 --few-shot --self-critique

instructions = ("You are Contoso's product copywriter. Write a product description for an Indian online shop. "
                "Use plain English, mention the warranty, stay under 60 words.")
if args.few_shot:
    instructions += "\\nExample:\\nInput: steel water bottle\\nOutput: Keeps chai hot for 12 hours..."
r = openai.responses.create(model=os.environ.get("MODEL_DEPLOYMENT", "gpt-4.1-mini"),
                            instructions=instructions, input=args.product,
                            temperature=args.temperature, top_p=args.top_p,
                            max_output_tokens=args.max_output_tokens)
draft = r.output_text
if args.self_critique:   # reflection: critique against a checklist, then revise once
    critique = openai.responses.create(model=..., input=f"Check this against the rules and list problems: {draft}")
    draft = openai.responses.create(model=..., input=f"Rewrite fixing: {critique.output_text}\\n{draft}").output_text
print(draft, r.status, r.incomplete_details)`,
  'traced_agent.py': `# traced_agent.py: client-side tracing with OpenTelemetry, exported to Application Insights
# pip install azure-ai-projects opentelemetry-sdk azure-core-tracing-opentelemetry azure-monitor-opentelemetry
import os
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient
from azure.ai.projects.telemetry import AIProjectInstrumentor
from azure.monitor.opentelemetry import configure_azure_monitor

# export AZURE_EXPERIMENTAL_ENABLE_GENAI_TRACING=true   (opt in, the instrumentation is a preview)
# export OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true   (dev only: records prompts and outputs)
project = AIProjectClient(endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"], credential=DefaultAzureCredential())
configure_azure_monitor(connection_string=project.telemetry.get_application_insights_connection_string())
AIProjectInstrumentor().instrument()

openai = project.get_openai_client(agent_name="order-agent")
conversation = openai.conversations.create()
print(openai.responses.create(conversation=conversation.id, input="Where is order ORD-1042?").output_text)`,
  'token_report.py': `# token_report.py: token analytics and latency from the traces in Application Insights
# Runs a KQL query over the gen_ai spans: tokens by model and operation, p50/p95 latency.
query = """
dependencies
| where timestamp > ago(1d) and isnotempty(customDimensions["gen_ai.operation.name"])
| extend model = tostring(customDimensions["gen_ai.request.model"]),
         tokens_in = toint(customDimensions["gen_ai.usage.input_tokens"]),
         tokens_out = toint(customDimensions["gen_ai.usage.output_tokens"])
| summarize calls=count(), tokens_in=sum(tokens_in), tokens_out=sum(tokens_out),
            p50=percentile(duration, 50), p95=percentile(duration, 95) by name, model
"""`,
  'route_requests.py': `# route_requests.py: rules first, a small model for easy work, a big model only when needed
import os, sys, re
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

project = AIProjectClient(endpoint=os.environ["FOUNDRY_PROJECT_ENDPOINT"], credential=DefaultAzureCredential())
openai = project.get_openai_client()
mode = sys.argv[sys.argv.index("--mode") + 1] if "--mode" in sys.argv else "cascade"

def route(request: str) -> str:
    if re.search(r"store hours|opening time", request, re.I):  return "rules"      # deterministic answer, no LLM
    if re.search(r"refund", request, re.I):                    return "rules"      # policy limit decided by code
    if len(request) < 120:                                     return os.environ.get("SMALL_DEPLOYMENT", "Phi-4-mini-instruct")
    return os.environ.get("LARGE_DEPLOYMENT", "gpt-4.1")                           # long, multi-part reasoning

for req in REQUESTS:
    target = "auto" if mode == "auto" else route(req)   # "auto" = model router picks the model (preview)
    answer = RULES[req] if target == "rules" else openai.responses.create(model=target, input=req)
    print(target, "->", answer)`,
};
const PKGS = ['azure-ai-evaluation', 'agent-framework-foundry', 'agent-framework', 'opentelemetry-sdk', 'azure-core-tracing-opentelemetry', 'azure-monitor-opentelemetry', 'azure-search-documents'];
const BASE_PKGS = ['azure-ai-projects', 'azure-identity', 'openai', 'python-dotenv', 'azure-ai-textanalytics', 'azure-cognitiveservices-speech', 'azure-ai-contentunderstanding'];

/* ------------------------------------------------------------------ */
/* the policy documents used by RAG                                    */
/* ------------------------------------------------------------------ */
const CHUNKS: [string, number, string][] = [
  ['refund-policy.pdf', 0, 'Items can be returned within 30 days of delivery with the receipt.'],
  ['refund-policy.pdf', 1, 'Damaged or faulty items can be returned within 10 days and are refunded in full.'],
  ['refund-policy.pdf', 2, 'Refunds over ₹5,000 need a manager’s approval.'],
  ['refund-policy.pdf', 3, 'Refunds reach the original payment method in 5 to 7 working days.'],
  ['delivery-faq.md', 0, 'Standard delivery takes 3 to 5 working days.'],
  ['delivery-faq.md', 1, 'Express delivery in Chennai, Mumbai and Bengaluru arrives next day if ordered before 2 PM.'],
  ['delivery-faq.md', 2, 'Delivery is free on orders above ₹999.'],
  ['warranty.pdf', 0, 'Kitchen appliances such as kettles and mixers carry a 1-year warranty.'],
  ['warranty.pdf', 1, 'Laptops carry a 2-year warranty.'],
  ['warranty.pdf', 2, 'Warranty claims need the serial number and the invoice.'],
];
const STOP = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'what', 'how', 'can', 'are', 'you', 'your', 'have', 'does', 'will', 'many', 'much', 'long', 'when', 'where', 'which', 'there', 'from', 'about', 'any', 'our', 'get', 'its']);
const words = (s: string) => (s.toLowerCase().match(/[a-z0-9][a-z0-9'-]{2,}/g) ?? []).filter((x) => !STOP.has(x));
const stem = (x: string) => x.replace(/(ies|es|s|ed|ing)$/, '').slice(0, 6);
function retrieve(q: string, k = 3) {
  const qs = new Set(words(q).map(stem));
  return CHUNKS.map((c) => ({ c, s: words(c[2]).map(stem).filter((x) => qs.has(x)).length })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, k).map((x) => x.c);
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
function project(w: World): [Res, string] {
  const v = envOf(w).FOUNDRY_PROJECT_ENDPOINT;
  if (!v) throw new SimError(`KeyError: 'FOUNDRY_PROJECT_ENDPOINT'\nSet it first: export FOUNDRY_PROJECT_ENDPOINT="https://<resource>.services.ai.azure.com/api/projects/<project>" (az cognitiveservices account project show prints it).`, 'Python');
  const m = v.match(/^https:\/\/([a-z0-9-]+)\.services\.ai\.azure\.com\/api\/projects\/([\w-]+)\/?$/i);
  if (!m) throw new SimError(`ValueError: '${v}' is not a project endpoint. The format is https://<resource>.services.ai.azure.com/api/projects/<project>.`, 'Python');
  const r = F.foundries(w).find((x) => x.name.toLowerCase() === m[1].toLowerCase());
  if (!r) throw new SimError(`azure.core.exceptions.ServiceRequestError: can't reach ${m[1]}.services.ai.azure.com. Check the resource name.`, 'Python');
  if (!(r.props.projects as string[]).includes(m[2])) throw new SimError(`azure.core.exceptions.ResourceNotFoundError: (NotFound) Project '${m[2]}' not found in '${r.name}'.`, 'Python');
  return [r, m[2]];
}
function needPkgs(w: World, pkgs: string[]) {
  const have: string[] = (w as any).pip ?? [];
  const miss = pkgs.filter((p) => !have.includes(p));
  if (miss.length) throw new SimError(`ModuleNotFoundError: No module named '${miss[0].replace(/-/g, '_').replace('azure_ai_projects', 'azure.ai.projects').replace('azure_ai_evaluation', 'azure.ai.evaluation').replace('agent_framework_foundry', 'agent_framework.foundry')}'\nInstall it: pip install ${miss.join(' ')}`, 'Python');
}
const deployments = (r: Res) => r.props.deployments as F.Deployment[];
const firstChat = (r: Res, pref?: string) => {
  const d = pref ? deployments(r).find((x) => x.name.toLowerCase() === pref.toLowerCase()) : undefined;
  if (d) return d;
  const c = deployments(r).find((x) => ['chat', 'reasoning'].includes(F.MODELS[x.model]?.kind));
  if (!c) throw new SimError('openai.NotFoundError: no chat model deployment in this project. Deploy one first, for example: az cognitiveservices account deployment create ... --deployment-name gpt-4.1-mini --model-name gpt-4.1-mini --sku-name GlobalStandard', 'Python');
  return c;
};
const embedding = (r: Res) => deployments(r).find((x) => F.MODELS[x.model]?.kind === 'embedding');
const flag = (argv: string[], name: string) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
const free = (argv: string[]) => { const out: string[] = []; for (let i = 0; i < argv.length; i++) { if (argv[i].startsWith('--')) { if (argv[i + 1] && !argv[i + 1].startsWith('--') && !['--no-retrieval', '--few-shot', '--self-critique'].includes(argv[i])) i++; continue; } out.push(argv[i]); } return out; };
const latency = (model: string) => Math.round(250 + (6 - (F.MODELS[model]?.speed ?? 3)) * 220);

/* ------------------------------------------------------------------ */
/* az: projects and connections                                        */
/* ------------------------------------------------------------------ */
const foundryArg = (p: Parsed, w: World) => w.need('foundry', one(p, '--resource-group')!, one(p, '--name')!);
const projectArg = (p: Parsed, r: Res) => {
  const name = one(p, '--project-name')!;
  if (!(r.props.projects as string[]).includes(name)) throw new SimError(`Project '${name}' was not found in '${r.name}'. Create it with az cognitiveservices account project create.`, 'ResourceNotFound');
  return name;
};
const projJson = (r: Res, name: string) => ({ name: `${r.name}/${name}`, type: 'Microsoft.CognitiveServices/accounts/projects', location: r.location, identity: { type: 'SystemAssigned' }, properties: { provisioningState: 'Succeeded', endpoints: { 'AI Foundry API': F.projectEndpoint(r, name) } } });
const AZ: Record<string, Cmd | Handler> = {
  'cognitiveservices account project create': (p, w) => {
    req(p, [['--name', '-n'], ['--resource-group', '-g'], ['--project-name', '']]);
    const r = foundryArg(p, w);
    F.addProject(w, r, one(p, '--project-name')!, 'cli');
    return { out: json(projJson(r, one(p, '--project-name')!)) };
  },
  'cognitiveservices account project show': (p, w) => {
    req(p, [['--name', '-n'], ['--resource-group', '-g'], ['--project-name', '']]);
    const r = foundryArg(p, w);
    const name = projectArg(p, r);
    w.emit('agt.project.show', { resource: r.name, project: name });
    if (/endpoints/.test(one(p, '--query') ?? '')) return { out: F.projectEndpoint(r, name) };
    return { out: json(projJson(r, name)) };
  },
  'cognitiveservices account project list': (p, w) => {
    req(p, [['--name', '-n'], ['--resource-group', '-g']]);
    const r = foundryArg(p, w);
    return { out: json((r.props.projects as string[]).map((n) => projJson(r, n))) };
  },
  'cognitiveservices account project connection create': (p, w) => {
    req(p, [['--name', '-n'], ['--resource-group', '-g'], ['--project-name', ''], ['--connection-name', ''], ['--file', '-f']]);
    const r = foundryArg(p, w);
    const project = projectArg(p, r);
    const file = one(p, '--file')!.replace(/^@/, '');
    const body = FILES[file];
    if (!body || !/connection\.yml$/.test(file)) throw new SimError(`Can't read '${file}'. Connection files here: search-connection.yml, appinsights-connection.yml (cat them first).`, 'InvalidFile');
    const type: Conn['type'] = /app_insights/.test(body) ? 'AppInsights' : 'AzureAISearch';
    const name = one(p, '--connection-name')!;
    const target = body.match(/^target: (.+)$/m)![1];
    const s = st(r);
    s.connections = [...s.connections.filter((c) => c.name !== name || c.project !== project), { name, project, type, target, auth: 'AAD' }];
    w.emit('agt.connection', { resource: r.name, project, name, type });
    return { out: json({ name, type: 'Microsoft.CognitiveServices/accounts/projects/connections', properties: { category: type, target, authType: 'AAD', isSharedToAll: false } }) };
  },
  'cognitiveservices account project connection list': (p, w) => {
    req(p, [['--name', '-n'], ['--resource-group', '-g'], ['--project-name', '']]);
    const r = foundryArg(p, w);
    const project = projectArg(p, r);
    return { out: json(st(r).connections.filter((c) => c.project === project).map((c) => ({ name: c.name, properties: { category: c.type, target: c.target, authType: c.auth } }))) };
  },
  'cognitiveservices account project connection show': (p, w) => {
    req(p, [['--name', '-n'], ['--resource-group', '-g'], ['--project-name', ''], ['--connection-name', '']]);
    const r = foundryArg(p, w);
    const project = projectArg(p, r);
    const c = st(r).connections.find((x) => x.project === project && x.name === one(p, '--connection-name'));
    if (!c) throw new SimError(`Connection '${one(p, '--connection-name')}' was not found in project '${project}'.`, 'ResourceNotFound');
    return { out: json({ name: c.name, properties: { category: c.type, target: c.target, authType: c.auth } }) };
  },
};

export function az(tokens: string[], w: World): AdminOut | null {
  return run(AZ, tokens, w);
}

/* ------------------------------------------------------------------ */
/* shell: cat, pip, python                                             */
/* ------------------------------------------------------------------ */
export function shell(tokens: string[], w: World): AdminOut | null {
  const c = tokens[0]?.toLowerCase();
  const rest = tokens.slice(1);
  if (c === 'cat' && rest[0] && (SCRIPTS[rest[0]] || FILES[rest[0]])) {
    w.emit('py.view', { file: rest[0] });
    return { out: SCRIPTS[rest[0]] ?? FILES[rest[0]] };
  }
  if ((c === 'pip' || c === 'pip3') && rest[0] === 'install') {
    const pkgs = rest.slice(1).map((p) => p.replace(/^["']|["']$/g, '').replace(/[<>=\[].*$/, '').toLowerCase()).filter((p) => p && !p.startsWith('-'));
    if (!pkgs.some((p) => PKGS.includes(p))) return null;
    if (pkgs.some((p) => !PKGS.includes(p) && !BASE_PKGS.includes(p))) return null;
    (w as any).pip = [...new Set([...((w as any).pip ?? []), ...pkgs])];
    w.emit('pip.install', { pkgs });
    return { out: `${pkgs.map((p) => `Collecting ${p}\n  Downloading ${p}-${p === 'azure-ai-projects' ? '2.11.0' : '1.4.0'}-py3-none-any.whl`).join('\n')}\nSuccessfully installed ${pkgs.join(' ')}` };
  }
  if ((c === 'python' || c === 'python3') && rest[0] && SCRIPTS[rest[0]]) return python(rest[0], rest.slice(1), w);
  return null;
}

function python(file: string, argv: string[], w: World): AdminOut {
  const emit = (ok: boolean, extra: Record<string, any> = {}) => w.emit('py.run', { file, ok, args: argv, ...extra });
  try {
    const out = SCRIPT_RUN[file](argv, w);
    emit(true);
    return { out };
  } catch (e) {
    if (e instanceof SimError) {
      emit(false, { error: e.message.split('\n')[0] });
      return { error: e.code === 'Python' ? `Traceback (most recent call last):\n  File "/home/learner/${file}", line 12, in <module>\n${e.message}` : `Traceback (most recent call last):\n  File "/home/learner/${file}"\nazure.core.exceptions.HttpResponseError: (${e.code}) ${e.message}` };
    }
    throw e;
  }
}

const SDK = ['azure-ai-projects', 'azure-identity'];
const AF = ['agent-framework-foundry', 'azure-identity'];
type Runner = (argv: string[], w: World) => string;
const SCRIPT_RUN: Record<string, Runner> = {
  /* ---------- deploy and consume ---------- */
  'call_models.py': (argv, w) => {
    needPkgs(w, SDK);
    const [r] = project(w);
    const names = free(argv).length ? free(argv) : [envOf(w).MODEL_DEPLOYMENT ?? 'gpt-4.1-mini'];
    const lines = deployments(r).map((d) => `deployed: ${d.name} -> ${d.model} (${F.DEPLOY_TYPES[d.sku]?.label ?? d.sku})`);
    for (const n of names) {
      const model = F.MODELS[n] && !deployments(r).some((d) => d.name.toLowerCase() === n.toLowerCase()) ? n : '';
      let d: F.Deployment;
      try { d = F.deploymentOf(r, n); } catch {
        throw new SimError(`openai.NotFoundError: Error code: 404 - The API deployment '${n}' does not exist.${model ? ` '${n}' is a model name; call the deployment name you chose when you deployed it.` : ''} Deployments here: ${deployments(r).map((x) => x.name).join(', ') || 'none'}.`, 'Python');
      }
      const o = F.chat(w, r, { deployment: d.name, user: 'In one sentence, why do apps call a deployment name?', system: 'Answer in one sentence.' }, 'cli');
      const kind = F.MODELS[d.model].kind;
      w.emit('agt.call', { resource: r.name, deployment: d.name, model: d.model, kind, tokensIn: o.tokensIn, tokensOut: o.tokensOut });
      lines.push(`${d.name} (${kind === 'slm' ? 'small language model' : kind === 'reasoning' ? 'reasoning model' : 'LLM'}): Apps call the deployment name because it points to one model version, type and quota. [${o.tokensIn} in / ${o.tokensOut} out, ${latency(d.model)} ms]`);
    }
    return lines.join('\n');
  },
  'list_connections.py': (_argv, w) => {
    needPkgs(w, SDK);
    const [r, proj] = project(w);
    const cs = st(r).connections.filter((c) => c.project === proj);
    w.emit('agt.connections.list', { resource: r.name, project: proj, count: cs.length });
    return [...(cs.length ? cs.map((c) => `${c.name}  ${c.type}  ${c.target}  (auth: Microsoft Entra ID)`) : ['(no connections yet: az cognitiveservices account project connection create ...)']), ...deployments(r).map((d) => `deployment: ${d.name}  ${d.model}`)].join('\n');
  },
  /* ---------- RAG ---------- */
  'ingest_docs.py': (_argv, w) => {
    needPkgs(w, [...SDK, 'azure-search-documents']);
    const [r, proj] = project(w);
    const conn = st(r).connections.find((c) => c.project === proj && c.type === 'AzureAISearch');
    if (!conn) throw new SimError(`azure.core.exceptions.ResourceNotFoundError: Connection 'search-contoso' not found. Create it: az cognitiveservices account project connection create ... --connection-name search-contoso --file search-connection.yml`, 'Python');
    const e = embedding(r);
    if (!e) throw new SimError(`openai.NotFoundError: no embedding deployment. Chunks are turned into vectors by an embedding model: deploy text-embedding-3-small first.`, 'Python');
    st(r).index = { name: 'policies-index', chunks: CHUNKS.length, embedding: e.name };
    w.emit('agt.rag.ingest', { resource: r.name, chunks: CHUNKS.length, embedding: e.name, connection: conn.name });
    return `Read 3 documents: refund-policy.pdf, delivery-faq.md, warranty.pdf\nSplit into ${CHUNKS.length} chunks (about 500 tokens each, 50-token overlap)\nEmbedded with '${e.name}' (1536 dimensions)\nUploaded ${CHUNKS.length} chunks to index 'policies-index' on ${conn.target}`;
  },
  'rag_app.py': (argv, w) => {
    needPkgs(w, SDK);
    const [r] = project(w);
    const q = free(argv).join(' ') || 'How many days do I have to return a damaged kettle?';
    const d = firstChat(r, envOf(w).MODEL_DEPLOYMENT);
    const noRet = argv.includes('--no-retrieval');
    if (noRet) {
      const o = F.chat(w, r, { deployment: d.name, user: q, temperature: 0.2 }, 'cli');
      w.emit('agt.rag.ask', { resource: r.name, retrieval: false, grounded: false, citations: 0, question: q });
      return `${/return|refund|deliver|warranty/i.test(q) ? 'Most shops allow 30 days for returns, so you probably have 30 days. (The model guessed: it has never seen Contoso’s policy.)' : o.text}\n⚠️ No sources were sent, so nothing in this answer can be checked.`;
    }
    needPkgs(w, ['azure-search-documents']);
    const idx = st(r).index;
    if (!idx) throw new SimError(`azure.core.exceptions.ResourceNotFoundError: The index 'policies-index' was not found. Run python ingest_docs.py first.`, 'Python');
    const hits = retrieve(q);
    const ctx = hits.map(([s, i, t]) => `[${s}#${i}] ${t}`).join('\n');
    const o = F.chat(w, r, { deployment: d.name, user: q, system: `Cite sources. Context: ${hits.map((h) => h[2]).join(' ')}`, temperature: 0.2 }, 'cli');
    const grounded = hits.length > 0 && !o.blocked;
    w.emit('agt.rag.ask', { resource: r.name, retrieval: true, grounded, citations: hits.length, question: q });
    if (!hits.length) return `Retrieved 0 chunks (hybrid search on 'policies-index').\nI don't know: the policy documents don't cover that. (An honest "I don't know" beats a confident guess.)`;
    return `Retrieved ${hits.length} chunks (hybrid: keywords + vectors):\n${ctx}\n\nAnswer: ${hits[0][2]} [${hits[0][0]}#${hits[0][1]}]`;
  },
  /* ---------- evaluation ---------- */
  'evaluate_app.py': (argv, w) => {
    needPkgs(w, ['azure-ai-evaluation', 'azure-identity']);
    const [r] = project(w);
    const judge = firstChat(r, envOf(w).JUDGE_DEPLOYMENT);
    const data = flag(argv, '--data') ?? 'rag-eval.jsonl';
    if (!FILES[data] || !/jsonl$/.test(data)) throw new SimError(`FileNotFoundError: '${data}'. Datasets here: rag-eval.jsonl, agent-runs.jsonl`, 'Python');
    const evs = (flag(argv, '--evaluators') ?? (data === 'agent-runs.jsonl' ? 'task_adherence,tool_call_accuracy,intent_resolution' : 'groundedness,relevance,coherence')).split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
    const known = ['groundedness', 'relevance', 'coherence', 'fluency', 'similarity', 'f1_score', 'violence', 'hate_unfairness', 'indirect_attack', 'protected_material', 'task_adherence', 'tool_call_accuracy', 'intent_resolution', 'task_completion'];
    const bad = evs.find((x) => !known.includes(x));
    if (bad) throw new SimError(`KeyError: '${bad}'. Evaluators in this script: ${known.join(', ')}`, 'Python');
    const agentEvs = ['task_adherence', 'tool_call_accuracy', 'intent_resolution', 'task_completion'];
    if (data === 'rag-eval.jsonl' && evs.some((x) => agentEvs.includes(x))) throw new SimError(`ValueError: ${evs.find((x) => agentEvs.includes(x))} needs agent messages with tool calls. Use --data agent-runs.jsonl`, 'Python');
    if (data === 'agent-runs.jsonl' && evs.some((x) => ['groundedness', 'similarity', 'f1_score'].includes(x))) throw new SimError(`ValueError: ${evs.find((x) => ['groundedness', 'similarity', 'f1_score'].includes(x))} needs context or a ground truth column. Use --data rag-eval.jsonl`, 'Python');
    const safety = evs.filter((x) => ['violence', 'hate_unfairness', 'indirect_attack', 'protected_material'].includes(x));
    const agent = evs.filter((x) => agentEvs.includes(x));
    const SC: Record<string, number[]> = {
      groundedness: [5, 5, 5, 1, 4], relevance: [5, 5, 5, 3, 4], coherence: [5, 5, 5, 4, 5], fluency: [5, 5, 5, 5, 5], similarity: [5, 4, 5, 1, 3], f1_score: [0.8, 0.7, 0.9, 0.1, 0.5],
      task_adherence: [1, 0, 0, 1], tool_call_accuracy: [5, 2, 1, 5], intent_resolution: [5, 3, 2, 5], task_completion: [1, 0, 0, 1],
    };
    const rows = data === 'rag-eval.jsonl' ? 5 : 4;
    const lines = [`Judge model: ${judge.name} · dataset: ${data} (${rows} rows) · evaluators: ${evs.join(', ')}`];
    const fails: number[] = [];
    for (let i = 0; i < rows; i++) {
      const cells = evs.map((e) => {
        if (safety.includes(e)) return `${e}=pass (severity: Very low)`;
        const v = SC[e][i];
        const pass = e === 'f1_score' ? v >= 0.5 : ['task_adherence', 'task_completion'].includes(e) ? v === 1 : v >= 3;
        if (!pass) fails.push(i + 1);
        return `${e}=${['task_adherence', 'task_completion'].includes(e) ? (v ? 'pass' : 'fail') : v}${pass ? '' : ' ✗'}`;
      });
      lines.push(`row ${i + 1}: ${cells.join('  ')}`);
    }
    const failed = [...new Set(fails)];
    const fabricated = evs.includes('groundedness') && data === 'rag-eval.jsonl';
    if (fabricated) lines.push('\nRow 4 is a fabrication: the answer promises "instant store credit plus a ₹500 voucher", which the context never says. Groundedness 1/5.');
    if (agent.length) lines.push('\nError analysis: row 2 called get_order_status with an order id the user never gave (made-up argument). Row 3 claimed a cancellation without calling any tool. Fix: tighten the instructions ("ask for the order number") and add a cancel_order tool that needs approval.');
    if (safety.length) lines.push(`\nSafety: ${safety.join(', ')} found no harmful content in ${rows} responses.`);
    lines.push(`\nPass rate: ${rows - failed.length}/${rows}. Results logged to the project (Evaluations).`);
    w.emit('agt.eval', { resource: r.name, data, evaluators: evs, judge: judge.name, fabricated, safety: safety.length > 0, agent: agent.length > 0, failedRows: failed });
    return lines.join('\n');
  },
  /* ---------- agents ---------- */
  'order_agent.py': (argv, w) => {
    needPkgs(w, SDK);
    const [r] = project(w);
    const d = firstChat(r, envOf(w).MODEL_DEPLOYMENT);
    const mem = argv.includes('memory') || argv.includes('--memory');
    if (mem) {
      const e = embedding(r);
      if (!e) throw new SimError('azure.core.exceptions.HttpResponseError: A memory store needs a chat model deployment and an embedding model deployment. Deploy text-embedding-3-small first.', 'Python');
    }
    const instructions = "Role: Contoso Retail's order assistant. Goal: tell customers where their order is and what the returns policy says. Always call get_order_status for order questions and ask for the order number if it's missing. Never promise a date the tool didn't return.";
    const a = F.createAgent(w, r, { name: 'order-agent', deployment: d.name, instructions, tools: ['function', 'file_search'] }, 'cli');
    w.emit('agt.agent.schema', { resource: r.name, agent: a.name, version: a.version, tool: 'get_order_status', required: ['order_id'], strict: true });
    const out = [`Agent created (name: order-agent, version: ${a.version}, model: ${d.name})`, 'Tools: get_order_status (function, strict schema, required: order_id), file_search (refund-policy.pdf)'];
    if (mem) {
      const s = st(r);
      s.memory = { store: 'customer-memory', scope: 'user-priya', items: ['Prefers WhatsApp updates', 'Usually orders kitchen appliances'] };
      w.emit('agt.memory', { resource: r.name, store: 'customer-memory', scope: 'user-priya', items: s.memory.items.length });
      out.push('Memory: customer-memory (user profile + chat summary), scope {{$userId}} → user-priya', '', '[Monday, conversation 1] You: Please send updates on WhatsApp, not email.', 'Agent: Done, I’ll use WhatsApp from now on.   (memory written: "Prefers WhatsApp updates")', '', '[Friday, NEW conversation 2] You: Any news on ORD-1042?');
    }
    const q = free(argv).filter((x) => x !== 'memory').join(' ') || 'Where is my order ORD-1042?';
    const id = q.match(/\bORD-\d{3,6}\b/i)?.[0].toUpperCase();
    if (!id && /order|where|track|status/i.test(q)) {
      w.emit('agt.function', { resource: r.name, agent: 'order-agent', called: false, reason: 'missing-required' });
      out.push(`You: ${q}`, 'Agent: Happy to check. What’s your order number? It looks like ORD-1234.   (no tool call: order_id is required and the user didn’t give one)');
      return out.join('\n');
    }
    const res = F.runAgent(w, r, { agent: 'order-agent', input: `order status ${q}` }, 'cli');
    const used = res.used.includes('function');
    w.emit('agt.function', { resource: r.name, agent: 'order-agent', called: used, name: 'get_order_status', args: { order_id: id ?? '' }, memory: mem });
    if (!mem) out.push(`You: ${q}`);
    out.push(`→ model asked for: get_order_status({"order_id": "${id ?? 'ORD-1042'}"})`, '→ your code ran it and sent back: {"status": "shipped", "eta": "Friday"}', `Agent: ${id ?? 'ORD-1042'} shipped yesterday and arrives on Friday.${mem ? ' I’ll send the tracking link on WhatsApp, as you asked.   (recalled from memory)' : ''}`);
    return out.join('\n');
  },
  'claim_pipeline.py': (argv, w) => {
    needPkgs(w, SDK);
    const [r] = project(w);
    const d = firstChat(r, envOf(w).MODEL_DEPLOYMENT);
    F.chat(w, r, { deployment: d.name, user: 'Classify: my mixer stopped working after 3 months', temperature: 0 }, 'cli');
    const failTool = argv.includes('--fail-tool');
    const steps = ['1 classify → "warranty" (temperature 0)', '2 extract → {"product": "mixer", "serial_number": "MX-88213", "bought": "2026-08-14"} (JSON schema, strict)'];
    if (failTool) steps.push('3 tool check_warranty → timeout, retry 1 → timeout, retry 2 → timeout', '  fallback → status "needs_human_review" (the flow didn’t guess)', '4 draft → skipped', '5 verify → held for a person to check');
    else steps.push('3 tool check_warranty("MX-88213") → {"covered": true, "until": "2027-08-14"}', '4 draft → "Your mixer is covered until 14 Aug 2027. We’ll collect it on Monday."', '5 verify → serial number quoted ✓, warranty date matches tool ✓, no promise beyond policy ✓ → send');
    w.emit('agt.pipeline', { resource: r.name, deployment: d.name, steps: 5, toolFailed: failTool, fallback: failTool, verified: !failTool });
    return steps.join('\n');
  },
  'support_workflow.py': (argv, w) => {
    needPkgs(w, AF);
    const [r] = project(w);
    const d = firstChat(r, envOf(w).MODEL_DEPLOYMENT);
    const pattern = (flag(argv, '--pattern') ?? 'sequential').toLowerCase();
    const P: Record<string, string[]> = {
      sequential: ['triage → "billing + delivery problem"', 'writer → drafts one reply from triage’s notes', 'reviewer → "APPROVED"', 'Output: one reviewed reply. Order fixed in advance, each agent sees the previous output.'],
      concurrent: ['billing   ┐ "Duplicate charge found, refund raised"', 'delivery  ┘ "ORD-1042 is in Chennai hub, arrives Friday"   (ran at the same time)', 'aggregator → merges both answers', 'Output: two specialists in parallel, total time ≈ the slower one.'],
      handoff: ['triage → hands off to billing (refund question)', 'billing → refund raised, hands off to delivery (still not arrived)', 'delivery → "arrives Friday", no more handoffs', 'Output: control moved between agents based on the conversation.'],
      'group-chat': ['manager picks billing → speaks', 'manager picks delivery → speaks', 'manager picks reviewer → "APPROVED", stop (max rounds 6)', 'Output: agents share one conversation; a manager chooses who speaks next.'],
      magentic: ['manager plans: [check charge, check delivery, write reply]', 'manager → billing (task 1 done) → delivery (task 2 done) → writer (task 3 done)', 'manager checks the plan: complete', 'Output: a manager agent planned and delegated open-ended work.'],
    };
    if (!P[pattern]) throw new SimError(`ValueError: unknown pattern '${pattern}'. Try sequential, concurrent, handoff, group-chat or magentic.`, 'Python');
    F.chat(w, r, { deployment: d.name, user: 'I was charged twice for ORD-1042 and it still has not arrived.' }, 'cli');
    w.emit('agt.orchestrate', { resource: r.name, pattern, agents: pattern === 'concurrent' ? 2 : 3 });
    return [`Pattern: ${pattern} (Microsoft Agent Framework, model ${d.name})`, ...P[pattern]].join('\n');
  },
  'refund_agent.py': (argv, w) => {
    needPkgs(w, AF);
    const [r] = project(w);
    firstChat(r, envOf(w).MODEL_DEPLOYMENT);
    const s = st(r);
    const decide = argv.includes('--approve') ? 'approve' : argv.includes('--reject') ? 'reject' : '';
    if (decide) {
      const id = flag(argv, decide === 'approve' ? '--approve' : '--reject') ?? '';
      const a = s.approvals.find((x) => x.id === id);
      if (!a) throw new SimError(`KeyError: no paused run with approval id '${id}'. Pending: ${s.approvals.filter((x) => x.status === 'pending').map((x) => x.id).join(', ') || 'none'}`, 'Python');
      if (a.status !== 'pending') throw new SimError(`ValueError: ${id} was already ${a.status}.`, 'Python');
      a.status = decide === 'approve' ? 'approved' : 'rejected';
      w.emit('agt.approval.decision', { resource: r.name, id, approved: decide === 'approve', amount: a.amount });
      return decide === 'approve'
        ? `✅ ${id} approved by learner@msdevbuild.com\n→ issue_refund(order_id="${a.order}", amount_inr=${a.amount}) ran\nAgent: Refund of ₹${a.amount.toLocaleString('en-IN')} raised for ${a.order}. It reaches the card in 5 to 7 working days.\n(audit log: who approved, when, the arguments and the result)`
        : `🚫 ${id} rejected\n→ issue_refund did NOT run\nAgent: I can’t refund this one automatically. A team member will contact you about ${a.order}.`;
    }
    const q = free(argv).join(' ') || 'Refund ₹1,200 for order ORD-1042, the kettle arrived broken.';
    const amount = Number((q.match(/₹?\s?([\d,]{3,})/)?.[1] ?? '1200').replace(/,/g, ''));
    const order = q.match(/\bORD-\d{3,6}\b/i)?.[0].toUpperCase() ?? 'ORD-1042';
    const lines = [`You: ${q}`, `→ lookup_order("${order}") ran (read-only, no approval needed): total ₹${(amount > 20000 ? 64990 : 2499).toLocaleString('en-IN')}`];
    if (amount > 20000) {
      w.emit('agt.guard', { resource: r.name, rule: 'max-refund', amount, blocked: true });
      return [...lines, `→ issue_refund(amount_inr=${amount}) blocked by a hard rule in code: refunds over ₹20,000 go to finance.`, 'Agent: This amount needs the finance team, so I’ve opened a case for them. No money has moved.'].join('\n');
    }
    const id = `apr-${s.approvals.length + 1}`;
    s.approvals.push({ id, amount, order, status: 'pending' });
    w.emit('agt.approval.request', { resource: r.name, id, amount, order, tool: 'issue_refund' });
    return [...lines, `⏸ issue_refund(order_id="${order}", amount_inr=${amount}) needs approval (approval_mode="always_require")`, `   Run paused. Approval id: ${id}`, `   Decide: python refund_agent.py --approve ${id}   or   python refund_agent.py --reject ${id}`].join('\n');
  },
  /* ---------- tuning ---------- */
  'tune_prompt.py': (argv, w) => {
    needPkgs(w, SDK);
    const [r] = project(w);
    const d = firstChat(r, envOf(w).MODEL_DEPLOYMENT);
    const temperature = Number(flag(argv, '--temperature') ?? 0.7);
    const topP = Number(flag(argv, '--top-p') ?? 1);
    const maxTokens = Number(flag(argv, '--max-output-tokens') ?? 300);
    if (Number.isNaN(temperature) || temperature < 0 || temperature > 2) throw new SimError('openai.BadRequestError: temperature must be between 0 and 2.', 'Python');
    if (Number.isNaN(topP) || topP < 0 || topP > 1) throw new SimError('openai.BadRequestError: top_p must be between 0 and 1.', 'Python');
    if (F.MODELS[d.model].kind === 'reasoning' && flag(argv, '--temperature')) throw new SimError(`openai.BadRequestError: '${d.model}' is a reasoning model. Tune it with reasoning_effort (low, medium, high), not temperature.`, 'Python');
    const fewShot = argv.includes('--few-shot');
    const critique = argv.includes('--self-critique');
    const product = free(argv).join(' ') || 'stainless steel mixer grinder, 750 W';
    const o = F.chat(w, r, { deployment: d.name, user: product, temperature, maxTokens }, 'cli');
    const finish = maxTokens < 40 ? 'length' : 'stop';
    let draft = temperature >= 1 ? `Whirl, blend, conquer! Our ${product} is a kitchen superhero with a cape of steel and a heart of gold, ready for chutneys, dosa batter and midnight milkshakes.` : `The ${product} grinds spices, chutneys and dosa batter in seconds. Three stainless steel jars, overload protection and a 2-year warranty.`;
    if (fewShot) draft = `Makes chutney, dosa batter and masala in seconds. ${product.replace(/^./, (x) => x.toUpperCase())}, three steel jars, 2-year warranty. Easy to clean.`;
    if (finish === 'length') draft = `${draft.slice(0, Math.max(12, maxTokens * 3))}…`;
    const lines = [`Deployment: ${d.name} · temperature ${temperature} · top_p ${topP} · max_output_tokens ${maxTokens}${fewShot ? ' · few-shot example' : ''}`, `Draft: ${draft}`];
    if (critique) lines.push('Critique (checklist: under 60 words ✓, plain English ✗ "kitchen superhero", warranty correct? ✗ product has 1-year warranty per warranty.pdf)', `Revised: The ${product} grinds spices, chutneys and dosa batter in seconds. Three stainless steel jars and a 1-year warranty.`);
    lines.push(`status: ${finish === 'length' ? 'incomplete (max_output_tokens)' : 'completed'} · ${o.tokensIn} input + ${finish === 'length' ? maxTokens : o.tokensOut + 40} output tokens`);
    w.emit('agt.tune', { resource: r.name, deployment: d.name, temperature, topP, maxTokens, fewShot, critique, finish });
    return lines.join('\n');
  },
  /* ---------- tracing ---------- */
  'traced_agent.py': (_argv, w) => {
    needPkgs(w, [...SDK, 'opentelemetry-sdk', 'azure-core-tracing-opentelemetry', 'azure-monitor-opentelemetry']);
    const [r, proj] = project(w);
    const env = envOf(w);
    const conn = st(r).connections.find((c) => c.project === proj && c.type === 'AppInsights') ?? (w.events.some((e) => e.type === 'cli' && /project connection create/.test(e.data.path ?? '') && /appinsights/i.test(e.data.line ?? '')) ? { name: 'appi-agents' } : null);
    if (!conn) throw new SimError(`azure.core.exceptions.ResourceNotFoundError: No Application Insights connection in project '${proj}'. Connect one: az cognitiveservices account project connection create ... --connection-name appi-agents --file appinsights-connection.yml`, 'Python');
    const d = firstChat(r, env.MODEL_DEPLOYMENT);
    const on = /^true$/i.test(env.AZURE_EXPERIMENTAL_ENABLE_GENAI_TRACING ?? '');
    const content = /^true$/i.test(env.OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT ?? '');
    const o = F.chat(w, r, { deployment: d.name, user: 'Where is order ORD-1042?' }, 'cli');
    if (!on) {
      w.emit('agt.trace', { resource: r.name, enabled: false, content: false, spans: 0 });
      return 'WARNING: AZURE_EXPERIMENTAL_ENABLE_GENAI_TRACING is not set to true, so GenAI tracing instrumentation is not enabled.\nAgent: ORD-1042 shipped yesterday and arrives Friday.\n(No client-side spans were exported. Server-side traces for Foundry-hosted agents still appear once Application Insights is connected.)';
    }
    const spans = [{ name: 'invoke_agent order-agent', ms: 2140, tokens: 0 }, { name: `chat ${d.name} (plan)`, ms: 610, tokens: 412, model: d.model }, { name: 'execute_tool get_order_status', ms: 940, tokens: 0 }, { name: `chat ${d.name} (answer)`, ms: 520, tokens: 236, model: d.model }];
    const s = st(r);
    s.traces.push({ id: `trace-${s.traces.length + 1}`, spans, content });
    w.emit('agt.trace', { resource: r.name, enabled: true, content, spans: spans.length, connection: conn.name, tokens: o.tokensIn });
    return [`Exporting to Application Insights (${conn.name}) · trace-${s.traces.length}`, ...spans.map((x, i) => `${i ? '  └ ' : ''}${x.name}  ${x.ms} ms${x.tokens ? `  ${x.tokens} tokens` : ''}`), `gen_ai.input.messages / gen_ai.output.messages: ${content ? 'recorded (content recording ON: dev only, it may contain personal data)' : 'not recorded (content recording is off by default)'}`, 'Agent: ORD-1042 shipped yesterday and arrives Friday.'].join('\n');
  },
  'token_report.py': (_argv, w) => {
    needPkgs(w, SDK);
    const [r] = project(w);
    const tr = st(r).traces;
    if (!tr.length) throw new SimError('No traces yet. Run python traced_agent.py with AZURE_EXPERIMENTAL_ENABLE_GENAI_TRACING=true first.', 'Python');
    const calls = tr.length * 2;
    const tin = tr.length * 520, tout = tr.length * 128;
    w.emit('agt.tokens', { resource: r.name, traces: tr.length, tokensIn: tin, tokensOut: tout });
    return [`Traces analysed: ${tr.length} (last 24 hours)`, 'operation              model           calls  tokens_in  tokens_out  p50 ms  p95 ms', `chat (plan)            ${tr[0].spans[1].model?.padEnd(14)}  ${String(tr.length).padStart(5)}  ${String(tr.length * 412).padStart(9)}  ${String(tr.length * 58).padStart(10)}  ${String(610).padStart(6)}  ${String(880).padStart(6)}`, `chat (answer)          ${tr[0].spans[3].model?.padEnd(14)}  ${String(tr.length).padStart(5)}  ${String(tr.length * 108).padStart(9)}  ${String(tr.length * 70).padStart(10)}  ${String(520).padStart(6)}  ${String(760).padStart(6)}`, `execute_tool           get_order_status  ${String(tr.length).padStart(3)}          -           -  ${String(940).padStart(6)}  ${String(2900).padStart(6)}  ⚠️ slowest span`, '', `Total: ${calls} model calls, ${tin} input + ${tout} output tokens. The plan step's input tokens dominate (long instructions and tool schemas are sent on every call).`, 'Latency breakdown: tool 44% · model 53% · overhead 3%. Fix the order API first, then trim the instructions.'].join('\n');
  },
  /* ---------- multiple models ---------- */
  'route_requests.py': (argv, w) => {
    needPkgs(w, SDK);
    const [r] = project(w);
    const mode = (flag(argv, '--mode') ?? 'cascade').toLowerCase();
    if (!['cascade', 'auto', 'single'].includes(mode)) throw new SimError(`ValueError: unknown mode '${mode}'. Use cascade, auto or single.`, 'Python');
    const env = envOf(w);
    const REQ = ['What are your store hours in Chennai?', 'Refund ₹1,200 for ORD-1042', 'Classify this review: "Kettle leaks after a week"', 'Compare our three warranty plans for a café with 6 espresso machines, the 3-year cost of each, and recommend one with reasons'];
    const routes: [string, string, string][] = [];
    if (mode === 'auto') {
      REQ.forEach((q, i) => routes.push([q, 'model router (auto)', ['gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4.1-nano', 'o4-mini'][i]]));
    } else if (mode === 'single') {
      const big = firstChat(r, env.LARGE_DEPLOYMENT ?? 'gpt-4.1');
      REQ.forEach((q) => { F.chat(w, r, { deployment: big.name, user: q }, 'cli'); routes.push([q, big.name, big.model]); });
    } else {
      const small = deployments(r).find((x) => x.name.toLowerCase() === (env.SMALL_DEPLOYMENT ?? '').toLowerCase()) ?? deployments(r).find((x) => F.MODELS[x.model]?.kind === 'slm');
      if (!small) throw new SimError('openai.NotFoundError: no small model deployment. Deploy Phi-4-mini-instruct for the easy requests.', 'Python');
      const big = firstChat(r, env.LARGE_DEPLOYMENT);
      routes.push([REQ[0], 'rules', 'no model: store-hours table']);
      routes.push([REQ[1], 'rules', 'no model: ₹1,200 ≤ ₹5,000 limit, auto-approved by policy code']);
      F.chat(w, r, { deployment: small.name, user: REQ[2] }, 'cli');
      routes.push([REQ[2], small.name, small.model]);
      F.chat(w, r, { deployment: big.name, user: REQ[3] }, 'cli');
      routes.push([REQ[3], big.name, big.model]);
    }
    const llmCalls = routes.filter((x) => x[1] !== 'rules').length;
    w.emit('agt.route', { resource: r.name, mode, rules: routes.filter((x) => x[1] === 'rules').length, llmCalls, targets: routes.map((x) => x[1]) });
    const cost = mode === 'single' ? 100 : mode === 'auto' ? 38 : 27;
    return [`Mode: ${mode}`, ...routes.map(([q, t, m]) => `${t.padEnd(22)} ${m.padEnd(26)} ← ${q.slice(0, 60)}${q.length > 60 ? '…' : ''}`), `Model calls: ${llmCalls} of ${routes.length} · relative cost: ${cost} (single big model = 100, illustrative)`].join('\n');
  },
};

export const COMPLETIONS: string[] = [
  'az cognitiveservices account project create', 'az cognitiveservices account project show', 'az cognitiveservices account project list',
  'az cognitiveservices account project connection create', 'az cognitiveservices account project connection list', 'az cognitiveservices account project connection show',
  ...Object.keys(SCRIPTS).map((s) => `python ${s}`), ...Object.keys(SCRIPTS).map((s) => `cat ${s}`), ...Object.keys(FILES).map((s) => `cat ${s}`),
];

/** For other modules and tests: the files this area adds to Cloud Shell. */
export const GENAI_FILES = [...Object.keys(SCRIPTS), ...Object.keys(FILES)];
void one;
