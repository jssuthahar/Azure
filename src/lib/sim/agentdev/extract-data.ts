/**
 * Sample content and script listings for the AI-103 "extract" Cloud Shell
 * (EDUCATION ONLY). The documents are fictional; the Python listings follow
 * the azure-search-documents and Content Understanding SDK shapes on
 * Microsoft Learn (checked 25 Nov 2026) and are simplified for reading.
 */

export interface Doc { title: string; pages: number; scanned?: boolean; dept: string; chunks: string[] }

/** The files in ./policy-docs (Contoso's HR and finance library). */
export const POLICY_DOCS: Record<string, Doc> = {
  'travel-policy.pdf': {
    title: 'Travel and expenses policy', pages: 38, dept: 'Finance',
    chunks: [
      'Taxi and ride-hailing fares to and from the airport are reimbursed when you attach the receipt. Book economy class for flights under six hours.',
      'Hotel stays are booked through the travel desk. Meals on travel days are covered up to the daily allowance for the city you visit.',
      'Submit travel claims within 30 days of returning. Claims older than 30 days need approval from your manager before finance pays them.',
    ],
  },
  'expense-codes.pdf': {
    title: 'Expense claim error codes', pages: 4, dept: 'Finance',
    chunks: [
      'Error E-1074: the currency on the receipt does not match the claim currency. Pick the receipt currency in the claim and submit the claim again.',
      'Error E-1047: the receipt date is outside the claim period. Change the dates or attach a newer receipt.',
    ],
  },
  'remote-work-policy.docx': {
    title: 'Remote work policy', pages: 6, dept: 'HR',
    chunks: [
      'You can work from home up to three days a week if your manager agrees. Core hours are 11:00 to 16:00 on every working day.',
      'Home internet costs are not reimbursed. The company provides a laptop, a headset and one monitor for home working.',
    ],
  },
  'security-handbook.pdf': {
    title: 'IT security handbook', pages: 22, dept: 'IT',
    chunks: [
      'If your laptop is lost or stolen, report it to the service desk within 24 hours so it can be wiped remotely.',
      'Use the company password manager and turn on multifactor authentication for every work account.',
    ],
  },
  'scanned-claim-form.jpg': {
    title: 'Scanned claim form', pages: 1, scanned: true, dept: 'Finance',
    chunks: ['Expense claim form. Employee: Ravi Kumar. Phone: +91 98450 12345. Item: airport taxi, receipt attached. Approved by the line manager.'],
  },
};

/** Words that carry the same meaning in this toy embedding space. */
export const CONCEPTS: Record<string, string> = {
  taxi: 'taxi', cab: 'taxi', cabs: 'taxi', uber: 'taxi', ride: 'taxi', 'ride-hailing': 'taxi', fares: 'taxi', fare: 'taxi',
  airport: 'airport', flight: 'flight', flights: 'flight', fly: 'flight',
  reimbursed: 'refund', reimburse: 'refund', reimbursement: 'refund', refund: 'refund', expense: 'refund', expenses: 'refund', claim: 'refund', claims: 'refund', paid: 'refund', pays: 'refund', money: 'refund', back: 'refund',
  receipt: 'receipt', receipts: 'receipt', bill: 'receipt',
  hotel: 'hotel', stay: 'hotel', stays: 'hotel', meals: 'food', meal: 'food', food: 'food', dinner: 'food', lunch: 'food',
  home: 'remote', remote: 'remote', wfh: 'remote', 'work-from-home': 'remote', office: 'remote',
  laptop: 'device', computer: 'device', headset: 'device', monitor: 'device', phone: 'device',
  lost: 'lost', stolen: 'lost', missing: 'lost', theft: 'lost',
  password: 'security', passwords: 'security', multifactor: 'security', mfa: 'security', hacked: 'security',
  error: 'error', code: 'error', codes: 'error', failed: 'error', rejected: 'error', mean: 'error',
  currency: 'currency', rupees: 'currency', dollars: 'currency',
  date: 'date', dates: 'date', old: 'date', older: 'date', late: 'date', period: 'date',
  internet: 'internet', broadband: 'internet', wifi: 'internet',
  manager: 'approval', approval: 'approval', approve: 'approval', approved: 'approval',
};
export const STOP = new Set(['a', 'an', 'the', 'to', 'of', 'and', 'or', 'i', 'can', 'my', 'is', 'are', 'for', 'do', 'does', 'what', 'how', 'when', 'it', 'in', 'on', 'if', 'you', 'your', 'be', 'with', 'from', 'that', 'this', 'there', 'up', 'at', 'by', 'me', 'we', 'our', 'get', 'need', 'any']);

/** Files in ./claim-docs for Content Understanding. */
export interface CuFile { label: string; kind: 'document' | 'image'; pages: number; markdown: string; summary: string; figure?: string; fields: Record<string, [value: string, confidence: number, source: string]> }
export const CLAIM_DOCS: Record<string, CuFile> = {
  'water-claim.pdf': {
    label: 'Home insurance claim form (PDF, 2 pages, one photo, handwritten policy number)', kind: 'document', pages: 2,
    markdown: [
      '# Home Insurance Claim Form',
      'Claim number: CLM-2026-08812',
      'Policyholder: Anita Rao · Policy number: HP-77310-K (handwritten)',
      '## Incident',
      'Date of loss: 14 November 2026. A pipe under the kitchen sink burst overnight and flooded the kitchen and hallway.',
      '## Damaged items',
      '| Item | Quantity | Estimated cost |',
      '| --- | --- | --- |',
      '| Kitchen base cabinets | 3 | 42,000 |',
      '| Laminate flooring (sq m) | 18 | 27,000 |',
      '| Microwave oven | 1 | 9,500 |',
      '',
      'Total claimed: 78,500',
      '<!-- PageBreak -->',
      '<figure>Photo 1</figure>',
      'Declaration signed by the policyholder on 15 November 2026.',
    ].join('\n'),
    summary: 'A home insurance claim for water damage after a kitchen pipe burst on 14 November 2026, covering cabinets, flooring and a microwave, with a total of 78,500 claimed.',
    figure: 'Photo of a kitchen floor covered in water, with swollen lower cabinet doors.',
    fields: {
      ClaimNumber: ['CLM-2026-08812', 0.98, 'page 1, line 2'],
      PolicyNumber: ['HP-77310-K', 0.61, 'page 1, line 3 (handwriting)'],
      DateOfLoss: ['2026-11-14', 0.95, 'page 1, line 5'],
      TotalClaimed: ['78500', 0.93, 'page 1, line 12'],
    },
  },
  'car-claim.pdf': {
    label: 'Motor insurance claim form (PDF, 1 page)', kind: 'document', pages: 1,
    markdown: '# Motor Claim Form\nClaim number: CLM-2026-09140\nPolicy number: MV-55021-A\n## Incident\nDate of loss: 9 November 2026. Another car reversed into the rear door in a supermarket car park.\nTotal claimed: 31,200',
    summary: 'A motor insurance claim for a dented rear door after a car park collision on 9 November 2026, with 31,200 claimed.',
    fields: {
      ClaimNumber: ['CLM-2026-09140', 0.97, 'page 1, line 2'],
      PolicyNumber: ['MV-55021-A', 0.94, 'page 1, line 3'],
      DateOfLoss: ['2026-11-09', 0.96, 'page 1, line 5'],
      TotalClaimed: ['31200', 0.92, 'page 1, line 6'],
    },
  },
};

export const CLAIM_ANALYZER_JSON = `{
  "analyzerId": "insurance-claim",
  "description": "Claim forms for the claims team and the claims agent",
  "baseAnalyzerId": "prebuilt-document",
  "models": { "completion": "gpt-4.1-mini", "embedding": "text-embedding-3-small" },
  "config": {
    "returnDetails": true,
    "estimateFieldSourceAndConfidence": true,
    "tableFormat": "markdown"
  },
  "fieldSchema": {
    "fields": {
      "ClaimNumber":  { "type": "string", "method": "extract",  "description": "Claim reference, starts with CLM-" },
      "PolicyNumber": { "type": "string", "method": "extract",  "description": "Policy number, may be handwritten" },
      "DateOfLoss":   { "type": "date",   "method": "extract",  "description": "Date the damage happened" },
      "TotalClaimed": { "type": "number", "method": "extract",  "description": "Total amount claimed" },
      "IncidentType": { "type": "string", "method": "classify", "description": "Kind of loss",
                        "enum": ["water damage", "fire", "theft", "collision", "other"] },
      "Summary":      { "type": "string", "method": "generate", "description": "Two-sentence summary for the adjuster" }
    }
  }
}`;

export const SCRIPTS: Record<string, string> = {
  'setup-kb.sh': `#!/bin/bash
# setup-kb.sh: builds the policy search pipeline used by this lab (practice shortcut).
# Add --semantic to give the index a semantic configuration.
set -e
az group create -n rg-agt-kb -l eastus
az storage account create -g rg-agt-kb -n stagtkb01 --sku Standard_LRS
az storage container create --account-name stagtkb01 -n policies
az storage blob upload-batch --account-name stagtkb01 -d policies -s ./policy-docs
# Azure AI Search (Foundry IQ) with a system-assigned managed identity
az search service create -g rg-agt-kb -n srch-agt-kb01 --sku basic --identity-type SystemAssigned
# Foundry resource + project with a chat model and an embedding model
az cognitiveservices account create -g rg-agt-kb -n ai-agt-kb01 --kind AIServices --sku S0
az cognitiveservices account deployment create -g rg-agt-kb -n ai-agt-kb01 --deployment-name gpt-4.1-mini --model-name gpt-4.1-mini
az cognitiveservices account deployment create -g rg-agt-kb -n ai-agt-kb01 --deployment-name text-embedding-3-small --model-name text-embedding-3-small
# Data source -> index -> skillset -> indexer
python search_setup.py datasource --name ds-policies --storage stagtkb01 --container policies --auth identity
python search_setup.py index --name policies-idx --vector --foundry ai-agt-kb01 --embedding-deployment text-embedding-3-small $SEMANTIC
python search_setup.py skillset --name ss-policies --skills ocr,split,embed --foundry ai-agt-kb01 --embedding-deployment text-embedding-3-small
python search_setup.py indexer --name ixr-policies --datasource ds-policies --index policies-idx --skillset ss-policies --image-action generateNormalizedImages`,

  'search_setup.py': `# search_setup.py: the four objects of an indexer pipeline in Azure AI Search
# pip install azure-search-documents azure-identity   (preinstalled here)
import argparse, os
from azure.identity import DefaultAzureCredential
from azure.search.documents.indexes import SearchIndexClient, SearchIndexerClient
from azure.search.documents.indexes.models import *

endpoint = f"https://{os.environ.get('SEARCH_SERVICE', 'srch-agt-kb01')}.search.windows.net"
cred = DefaultAzureCredential()                      # keyless: Microsoft Entra ID
indexes, indexers = SearchIndexClient(endpoint, cred), SearchIndexerClient(endpoint, cred)

# 1) datasource: where the files live (blob container, managed identity connection)
indexers.create_or_update_data_source_connection(SearchIndexerDataSourceConnection(
    name=args.name, type="azureblob", container=SearchIndexerDataContainer(name=args.container),
    connection_string=f"ResourceId=/subscriptions/.../storageAccounts/{args.storage};"))

# 2) index: chunk_id (key), parent_id, title, chunk, text_vector (1,536 dims)
vector_search = VectorSearch(
    algorithms=[HnswAlgorithmConfiguration(name="hnsw")],
    vectorizers=[AzureOpenAIVectorizer(vectorizer_name="aoai", parameters=AzureOpenAIVectorizerParameters(
        resource_url=f"https://{args.foundry}.openai.azure.com", deployment_name=args.embedding_deployment,
        model_name="text-embedding-3-small"))],          # used at QUERY time to embed the question
    profiles=[VectorSearchProfile(name="vp", algorithm_configuration_name="hnsw", vectorizer_name="aoai")])
semantic = SemanticSearch(configurations=[SemanticConfiguration(name="default",
    prioritized_fields=SemanticPrioritizedFields(title_field=SemanticField(field_name="title"),
                                                 content_fields=[SemanticField(field_name="chunk")]))])

# 3) skillset: OCR -> Text Merge -> Text Split (2,000 chars, 500 overlap) -> Azure OpenAI embedding
#    optional: PIIDetectionSkill, KeyPhraseExtractionSkill, WebApiSkill (custom), ContentUnderstandingSkill
#    index_projections write one search document per chunk (parent_id links them)

# 4) indexer: runs the pipeline; imageAction must be generateNormalizedImages for OCR to get images
indexers.create_or_update_indexer(SearchIndexer(name=args.name, data_source_name=args.datasource,
    target_index_name=args.index, skillset_name=args.skillset,
    parameters=IndexingParameters(configuration={"dataToExtract": "contentAndMetadata",
                                                 "imageAction": args.image_action})))
# also: run, reset, status`,

  'query.py': `# query.py: keyword, vector, hybrid and semantic queries against one index
import os, sys
from azure.identity import DefaultAzureCredential
from azure.search.documents import SearchClient
from azure.search.documents.models import VectorizableTextQuery

client = SearchClient(f"https://{os.environ.get('SEARCH_SERVICE', 'srch-agt-kb01')}.search.windows.net",
                      os.environ.get("SEARCH_INDEX", "policies-idx"), DefaultAzureCredential())
q, mode, semantic = sys.argv[1], args.mode, args.semantic          # mode: keyword | vector | hybrid

vector = [VectorizableTextQuery(text=q, k_nearest_neighbors=50, fields="text_vector")]  # the index's vectorizer embeds q
results = client.search(
    search_text=None if mode == "vector" else q,                # BM25 over the inverted index
    vector_queries=None if mode == "keyword" else vector,         # HNSW over the vector index
    query_type="semantic" if semantic else "simple",              # semantic ranker reranks the top 50
    semantic_configuration_name="default" if semantic else None,
    query_caption="extractive" if semantic else None,
    select=["title", "chunk"], top=3)
for r in results:
    print(r["@search.score"], r.get("@search.reranker_score"), r["title"], r["chunk"])`,

  'knowledge.py': `# knowledge.py: agentic retrieval with a knowledge source and a knowledge base (Search REST 2026-10-01, simplified)
import os, requests
from azure.identity import DefaultAzureCredential, get_bearer_token_provider
endpoint = f"https://{os.environ.get('SEARCH_SERVICE', 'srch-agt-kb01')}.search.windows.net"
token = get_bearer_token_provider(DefaultAzureCredential(), "https://search.azure.com/.default")
H = {"Authorization": f"Bearer {token()}"}; V = {"api-version": "2026-10-01"}

# source: PUT /knowledgesources/{name}
requests.put(f"{endpoint}/knowledgesources/{args.name}", params=V, headers=H, json={
    "name": args.name, "kind": "searchIndex",
    "searchIndexParameters": {"searchIndexName": args.index}})

# base: PUT /knowledgebases/{name}  (low/medium effort plan queries with an LLM, so they need a model)
requests.put(f"{endpoint}/knowledgebases/{args.name}", params=V, headers=H, json={
    "name": args.name, "knowledgeSources": [{"name": s} for s in args.sources],
    "retrievalReasoningEffort": {"kind": args.effort},              # minimal | low | medium
    "outputMode": "extractiveData",
    "models": [] if not args.model else [{"kind": "azureOpenAI", "azureOpenAIParameters": {
        "resourceUri": f"https://{args.foundry}.openai.azure.com", "deploymentId": args.model, "modelName": args.model}}]})

# retrieve: POST /knowledgebases/{name}/retrieve
r = requests.post(f"{endpoint}/knowledgebases/{args.kb}/retrieve", params=V, headers=H, json={
    "messages": [{"role": "user", "content": [{"type": "text", "text": question}]}], "includeActivity": True})
print(r.json()["response"], r.json()["activity"], r.json()["references"])`,

  'agent_kb.py': `# agent_kb.py: give a Foundry agent the knowledge base as an MCP tool
import os
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import PromptAgentDefinition, MCPTool

search = f"https://{os.environ.get('SEARCH_SERVICE', 'srch-agt-kb01')}.search.windows.net"
mcp_endpoint = f"{search}/knowledgebases/{args.kb}/mcp?api-version=2026-11-01-preview"
project = AIProjectClient(endpoint="https://ai-agt-kb01.services.ai.azure.com/api/projects/policy-agents",
                          credential=DefaultAzureCredential())
# A RemoteTool project connection (authType ProjectManagedIdentity, audience https://search.azure.com/)
# lets the agent call the knowledge base as the PROJECT's managed identity.
# That identity needs the Search Index Data Reader role on the search service.
tool = MCPTool(server_label="policies", server_url=mcp_endpoint, require_approval="never",
               allowed_tools=["knowledge_base_retrieve"], project_connection_id="kb-policies-mcp")
agent = project.agents.create_version(agent_name=args.agent, definition=PromptAgentDefinition(
    model="gpt-4.1-mini", tools=[tool], instructions=(
        "Use the knowledge base tool to answer. If it doesn't contain the answer, say you don't know. "
        "Cite the retrieved sources.")))
openai = project.get_openai_client()
reply = openai.responses.create(input=question, extra_body={"agent_reference": {"name": agent.name, "type": "agent_reference"}})
print(reply.output_text)`,

  'cu.py': `# cu.py: Azure Content Understanding in Foundry Tools (API 2025-11-01, simplified)
# pip install azure-ai-contentunderstanding azure-identity   (preinstalled here)
import json, os
from azure.identity import DefaultAzureCredential
from azure.ai.contentunderstanding import ContentUnderstandingClient
from azure.ai.contentunderstanding.models import AnalysisInput

client = ContentUnderstandingClient(endpoint=os.environ.get("CU_ENDPOINT", "https://ai-agt-cu01.services.ai.azure.com/"),
                                    credential=DefaultAzureCredential())
# defaults: map model names to YOUR deployments once per resource (PATCH /contentunderstanding/defaults)
client.update_defaults(model_deployments={args.completion: args.completion, args.embedding: args.embedding})
# create: PUT /contentunderstanding/analyzers/{analyzerId} with the JSON definition
client.begin_create_analyzer(args.analyzer_id, resource=json.load(open(args.file))).result()
# analyze: POST /contentunderstanding/analyzers/{analyzerId}:analyze  (a long-running operation)
result = client.begin_analyze(analyzer_id=args.analyzer, inputs=[AnalysisInput(url=blob_url(args.file))]).result()
content = result.contents[0]
print(content.markdown)                                  # clean Markdown for RAG and agents
for name, f in (content.fields or {}).items():
    print(name, f.value, f.confidence, f.source)         # confidence + grounding (where it came from)`,
};
