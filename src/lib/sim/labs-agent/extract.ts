/**
 * AI-103 "extract" practice labs (Information Extraction). Ids start agt-.
 * Every task is checked from simulator events, and every `cli` hint completes
 * its task when run as written, in order, in a fresh simulator
 * (scripts/qa/lab-check.ts). The commands live in
 * src/lib/sim/agentdev/extract.ts.
 */
import type { Sim } from '../engine';
import { SUB_ID } from '../engine';
import type { Lab } from '../labs';
import { PROJECT_PRINCIPAL, SEARCH_PRINCIPAL } from '../agentdev/extract';

const ev = (s: Sim, type: string, pred: (d: Record<string, any>) => boolean = () => true) => s.events.some((e) => e.type === type && pred(e.data));

const RG = 'rg-agt-kb';
const SEARCH_ID = `/subscriptions/${SUB_ID}/resourceGroups/${RG}/providers/Microsoft.Search/searchServices/srch-agt-kb01`;
const STORAGE_ID = `/subscriptions/${SUB_ID}/resourceGroups/${RG}/providers/Microsoft.Storage/storageAccounts/stagtkb01`;
const Q_TAXI = 'Can I get my cab money back?';
const Q_MULTI = 'Can I expense a taxi from the airport, and how long do I have to submit the claim?';
const PIP = 'pip install azure-search-documents azure-identity';

export const LABS: Lab[] = [
  /* ------------------------------------------------ ingest, enrich, index */
  {
    id: 'agt-extract-index-pipeline', title: 'Build a search pipeline: data source, index, skillset, indexer', icon: '🗂️', level: 'Intermediate', minutes: 15, start: 'shell',
    intro: 'Contoso keeps its HR and finance policies as PDFs in Blob Storage, plus a scanned claim form. Build the four objects of an Azure AI Search pipeline with OCR, Text Split and an embedding model, notice what the first run misses, then fix it.',
    learn: ['Search service with a managed identity and the Storage Blob Data Reader role', 'Data source, index with a vector field, skillset and indexer', 'OCR needs imageAction generateNormalizedImages', 'Reset the indexer after changing it'],
    topics: ['ingest-and-index-content', 'search-enrichment-skills'],
    tasks: [
      { text: `Create **${RG}**, a storage account **stagtkb01** and a search service **srch-agt-kb01** with a system-assigned managed identity.`, cli: `az group create -n ${RG} -l eastus && az storage account create -g ${RG} -n stagtkb01 --sku Standard_LRS && az search service create -g ${RG} -n srch-agt-kb01 --sku basic --identity-type SystemAssigned`, check: (s) => ev(s, 'agx.search.create', (d) => d.name === 'srch-agt-kb01' && d.identity) && ev(s, 'storage.create', (d) => d.name === 'stagtkb01') },
      { text: 'Create the Foundry resource **ai-agt-kb01** and deploy **text-embedding-3-small** for the vectors.', cli: `az cognitiveservices account create -n ai-agt-kb01 -g ${RG} -l eastus --kind AIServices --sku S0 --custom-domain ai-agt-kb01 && az cognitiveservices account deployment create -n ai-agt-kb01 -g ${RG} --deployment-name text-embedding-3-small --model-name text-embedding-3-small --model-format OpenAI --sku-name GlobalStandard --sku-capacity 10`, check: (s) => ev(s, 'ai.deploy', (d) => d.resource === 'ai-agt-kb01' && d.kind === 'embedding') },
      { text: 'Create the **policies** container and upload the files in **./policy-docs** to it.', cli: 'az storage container create --account-name stagtkb01 -n policies && az storage blob upload-batch --account-name stagtkb01 -d policies -s ./policy-docs', check: (s) => ev(s, 'agx.blob.upload', (d) => d.container === 'policies' && d.count >= 5) },
      { text: 'Install **azure-search-documents** and **azure-identity**, then set **SEARCH_SERVICE**.', cli: `${PIP} && export SEARCH_SERVICE="srch-agt-kb01"`, check: (s) => ev(s, 'pip.install', (d) => d.pkgs.includes('azure-search-documents')) && ev(s, 'env.set', (d) => d.name === 'SEARCH_SERVICE') },
      { text: 'Give the search service\'s identity the **Storage Blob Data Reader** role on the storage account, so the indexer needs no keys.', cli: `az role assignment create --assignee ${SEARCH_PRINCIPAL} --role "Storage Blob Data Reader" --scope ${STORAGE_ID}`, check: (s) => ev(s, 'agx.role', (d) => d.role === 'storage-reader') },
      { text: 'Create the data source **ds-policies** (managed identity) and the vector index **policies-idx**. Read **search_setup.py** first if you like.', cli: 'cat search_setup.py && python search_setup.py datasource --name ds-policies --storage stagtkb01 --container policies --auth identity && python search_setup.py index --name policies-idx --vector --foundry ai-agt-kb01 --embedding-deployment text-embedding-3-small', check: (s) => ev(s, 'agx.datasource', (d) => d.auth === 'identity') && ev(s, 'agx.index', (d) => d.name === 'policies-idx' && d.vector) },
      { text: 'Create the skillset **ss-policies** with **OCR, Text Split and the embedding skill**.', cli: 'python search_setup.py skillset --name ss-policies --skills ocr,split,embed --foundry ai-agt-kb01 --embedding-deployment text-embedding-3-small', check: (s) => ev(s, 'agx.skillset', (d) => ['ocr', 'split', 'embed'].every((k) => d.skills.includes(k))) },
      { text: 'Create the indexer **ixr-policies** with no image action. It runs straight away: find the document it could not read.', cli: 'python search_setup.py indexer --name ixr-policies --datasource ds-policies --index policies-idx --skillset ss-policies', check: (s) => ev(s, 'agx.indexer.run', (d) => d.ok && d.reason === 'ran' && d.ocr && !d.scanned) },
      { text: 'Set **imageAction** to **generateNormalizedImages**, **reset** the indexer and run it again.', cli: 'python search_setup.py indexer --name ixr-policies --datasource ds-policies --index policies-idx --skillset ss-policies --image-action generateNormalizedImages && python search_setup.py reset --name ixr-policies && python search_setup.py run --name ixr-policies', check: (s) => ev(s, 'agx.indexer.reset') && ev(s, 'agx.indexer.run', (d) => d.ok && d.reason === 'ran' && d.scanned) },
    ],
    wrap: 'An indexer needs four objects: a data source, an index, an optional skillset and the indexer that ties them together. With a managed identity on the search service and the Storage Blob Data Reader role there are no keys to leak. Text Split turns each file into chunks, the embedding skill fills the vector field, and OCR only sees scanned pages when imageAction is generateNormalizedImages. An indexer remembers what it has processed, so after you change it or its skillset, reset it before you run it again.',
  },

  /* ------------------------------------------------ query types */
  {
    id: 'agt-extract-search-queries', title: 'Keyword, vector, hybrid and semantic search', icon: '🔎', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'The policy index already exists. Ask it the same question in four ways, find out where each one fails, and see why an index needs a semantic configuration before the ranker will run.',
    learn: ['Keyword search matches tokens, vector search matches meaning', 'Exact codes are a vector weakness', 'Hybrid search merges both lists with RRF', 'The semantic ranker reranks the top results and needs a semantic configuration'],
    topics: ['semantic-hybrid-and-vector-search'],
    setup: ['bash setup-kb.sh --semantic'],
    tasks: [
      { text: `Run a **keyword** query: "${Q_TAXI}". The policy says "taxi", not "cab".`, cli: `${PIP} && python query.py "${Q_TAXI}"`, check: (s) => ev(s, 'agx.query', (d) => d.mode === 'keyword' && !d.semantic && d.results === 0) },
      { text: 'Run the same question as a **vector** query.', cli: `python query.py "${Q_TAXI}" --mode vector`, check: (s) => ev(s, 'agx.query', (d) => d.mode === 'vector' && d.top === 'travel-policy.pdf') },
      { text: 'Search for the exact code **E-1074** with vector, then with keyword. Which one finds the error-code document?', cli: 'python query.py "E-1074" --mode vector && python query.py "E-1074"', check: (s) => ev(s, 'agx.query', (d) => d.mode === 'vector' && d.q === 'E-1074' && d.top !== 'expense-codes.pdf') && ev(s, 'agx.query', (d) => d.mode === 'keyword' && d.q === 'E-1074' && d.top === 'expense-codes.pdf') },
      { text: 'Run a **hybrid** query with the taxi question.', cli: `python query.py "${Q_TAXI}" --mode hybrid`, check: (s) => ev(s, 'agx.query', (d) => d.mode === 'hybrid' && !d.semantic && d.top === 'travel-policy.pdf') },
      { text: 'Add the **semantic ranker** (`--semantic`) to the hybrid query and read the reranker score and caption.', cli: `python query.py "${Q_TAXI}" --mode hybrid --semantic`, check: (s) => ev(s, 'agx.query', (d) => d.mode === 'hybrid' && d.semantic && d.top === 'travel-policy.pdf') },
      { text: 'Create **plain-idx** with a vector field but **no semantic configuration**, point **SEARCH_INDEX** at it and try a semantic query. Read the error.', cli: 'python search_setup.py index --name plain-idx --vector --foundry ai-agt-kb01 --embedding-deployment text-embedding-3-small && export SEARCH_INDEX="plain-idx" && python query.py "taxi" --mode hybrid --semantic', check: (s) => ev(s, 'agx.index', (d) => d.name === 'plain-idx' && !d.semantic) && ev(s, 'py.run', (d) => d.file === 'query.py' && !d.ok && d.args.includes('--semantic')) },
    ],
    wrap: 'Keyword search (BM25) only matches the tokens that were indexed, so "cab" never finds "taxi". Vector search compares embeddings, so it matches meaning, but it can blur an exact identifier like E-1074. Hybrid search sends both queries in one request and merges the two lists with Reciprocal Rank Fusion, which is why it is the usual default. The semantic ranker is a second stage: it rereads the top 50 results, returns a reranker score and a caption, and can only work if the index has a semantic configuration. It never finds a document the first stage missed.',
  },

  /* ------------------------------------------------ agents */
  {
    id: 'agt-extract-agent-kb', title: 'Connect a knowledge base to an agent', icon: '🤖', level: 'Intermediate', minutes: 15, start: 'shell',
    intro: 'The policy index is ready. Wrap it in a knowledge source and a knowledge base, compare minimal and low retrieval effort on a two-part question, then give a Foundry agent the knowledge base as a tool. The first call fails with a 403: find out why.',
    learn: ['Knowledge source and knowledge base objects', 'Minimal effort has no model; low and medium plan subqueries with a model', 'The project managed identity needs Search Index Data Reader', 'An agent that says "I don\'t know" when nothing is retrieved'],
    topics: ['connect-retrieval-to-agents'],
    setup: ['bash setup-kb.sh --semantic'],
    tasks: [
      { text: 'Install the SDKs, then create the knowledge source **ks-policies** on **policies-idx** and a knowledge base **kb-minimal** with **minimal** effort.', cli: 'pip install azure-search-documents azure-ai-projects azure-identity requests && python knowledge.py source --name ks-policies --index policies-idx && python knowledge.py base --name kb-minimal --sources ks-policies --effort minimal', check: (s) => ev(s, 'agx.kb.source', (d) => d.name === 'ks-policies') && ev(s, 'agx.kb.base', (d) => d.name === 'kb-minimal' && d.effort === 'minimal') },
      { text: 'Retrieve a two-part question from **kb-minimal**: one query, no model planning.', cli: `python knowledge.py retrieve --kb kb-minimal --q "${Q_MULTI}"`, check: (s) => ev(s, 'agx.kb.retrieve', (d) => d.kb === 'kb-minimal' && d.subqueries === 1) },
      { text: 'Create **kb-low** with **low** effort and the **gpt-4.1-mini** deployment for query planning, then retrieve the same question.', cli: `python knowledge.py base --name kb-low --sources ks-policies --effort low --foundry ai-agt-kb01 --model gpt-4.1-mini && python knowledge.py retrieve --kb kb-low --q "${Q_MULTI}"`, check: (s) => ev(s, 'agx.kb.base', (d) => d.name === 'kb-low' && d.effort === 'low' && d.model === 'gpt-4.1-mini') && ev(s, 'agx.kb.retrieve', (d) => d.kb === 'kb-low' && d.subqueries >= 2) },
      { text: 'Point **FOUNDRY_PROJECT_ENDPOINT** at the project **policy-agents** and run **agent_kb.py**. It fails with a 403: why?', cli: `export FOUNDRY_PROJECT_ENDPOINT="https://ai-agt-kb01.services.ai.azure.com/api/projects/policy-agents" && python agent_kb.py --kb kb-low --agent policy-agent --question "${Q_MULTI}"`, check: (s) => ev(s, 'agx.agent', (d) => !d.ok && d.reason === 'forbidden') },
      { text: 'Give the **project\'s managed identity** the **Search Index Data Reader** role on the search service.', cli: `az role assignment create --assignee ${PROJECT_PRINCIPAL} --role "Search Index Data Reader" --scope ${SEARCH_ID}`, check: (s) => ev(s, 'agx.role', (d) => d.role === 'search-reader') },
      { text: 'Run the agent again, then ask something the knowledge base can\'t answer. It should say it doesn\'t know.', cli: `python agent_kb.py --kb kb-low --agent policy-agent --question "${Q_MULTI}" && python agent_kb.py --kb kb-low --agent policy-agent --question "What is our parental leave policy?"`, check: (s) => ev(s, 'agx.agent', (d) => d.ok && d.answered) && ev(s, 'agx.agent', (d) => d.ok && !d.answered) },
    ],
    wrap: 'Agents call a knowledge base, not an index. The knowledge base lists knowledge sources and sets the retrieval reasoning effort: minimal sends one query with no model, while low and medium use a chat model to split a multi-part question into subqueries that run in parallel. The agent reaches it through an MCP endpoint as the project\'s managed identity, which needs Search Index Data Reader on the search service, otherwise the call returns 403. Instructions that say to cite sources and to admit when nothing was found keep the answers grounded.',
  },

  /* ------------------------------------------------ Content Understanding */
  {
    id: 'agt-extract-content-understanding', title: 'Extract fields from claim forms with Content Understanding', icon: '🧾', level: 'Intermediate', minutes: 12, start: 'shell',
    intro: 'Contoso\'s claims team receives insurance claim forms as PDFs with photos and handwriting. Set up Content Understanding, compare layout output with a custom analyzer, and learn why confidence scores matter.',
    learn: ['Default model deployments on a Foundry resource', 'Prebuilt layout and document search analyzers', 'Custom analyzer with extract, classify and generate fields', 'Confidence and source, and routing low confidence to a person'],
    topics: ['content-understanding-document-extraction'],
    tasks: [
      { text: 'Create **rg-agt-cu**, the Foundry resource **ai-agt-cu01** and deploy **gpt-4.1-mini** and **text-embedding-3-small**.', cli: 'az group create -n rg-agt-cu -l eastus && az cognitiveservices account create -n ai-agt-cu01 -g rg-agt-cu -l eastus --kind AIServices --sku S0 --custom-domain ai-agt-cu01 && az cognitiveservices account deployment create -n ai-agt-cu01 -g rg-agt-cu --deployment-name gpt-4.1-mini --model-name gpt-4.1-mini --model-format OpenAI --sku-name GlobalStandard --sku-capacity 10 && az cognitiveservices account deployment create -n ai-agt-cu01 -g rg-agt-cu --deployment-name text-embedding-3-small --model-name text-embedding-3-small --model-format OpenAI --sku-name GlobalStandard --sku-capacity 10', check: (s) => ev(s, 'ai.deploy', (d) => d.resource === 'ai-agt-cu01' && d.name === 'gpt-4.1-mini') && ev(s, 'ai.deploy', (d) => d.resource === 'ai-agt-cu01' && d.kind === 'embedding') },
      { text: 'Install **azure-ai-contentunderstanding** and **azure-identity**, then set **CU_ENDPOINT**.', cli: 'pip install azure-ai-contentunderstanding azure-identity && export CU_ENDPOINT="https://ai-agt-cu01.services.ai.azure.com/"', check: (s) => ev(s, 'pip.install', (d) => d.pkgs.includes('azure-ai-contentunderstanding')) && ev(s, 'env.set', (d) => d.name === 'CU_ENDPOINT') },
      { text: 'Analyze **water-claim.pdf** with the **prebuilt-layout** analyzer: text and tables, but no fields.', cli: 'python cu.py analyze water-claim.pdf --analyzer prebuilt-layout', check: (s) => ev(s, 'agx.cu.analyze', (d) => d.analyzer === 'prebuilt-layout' && d.fields === 0) },
      { text: 'Map the **default model deployments** for this resource (completion and embedding).', cli: 'python cu.py defaults --completion gpt-4.1-mini --embedding text-embedding-3-small', check: (s) => ev(s, 'agx.cu.defaults', (d) => d.completion === 'gpt-4.1-mini' && d.embedding === 'text-embedding-3-small') },
      { text: 'Read **claim-analyzer-basic.json**, create it and analyze the form. Notice there is no confidence or source.', cli: 'cat claim-analyzer-basic.json && python cu.py create --file claim-analyzer-basic.json && python cu.py analyze water-claim.pdf --analyzer claim-basic', check: (s) => ev(s, 'agx.cu.analyzer', (d) => d.id === 'claim-basic') && ev(s, 'agx.cu.analyze', (d) => d.analyzer === 'claim-basic' && !d.confidence) },
      { text: 'Create the full **insurance-claim** analyzer (extract, classify and generate fields, with confidence) and analyze the form. Find the field below 0.8.', cli: 'cat claim-analyzer.json && python cu.py create --file claim-analyzer.json && python cu.py analyze water-claim.pdf --analyzer insurance-claim', check: (s) => ev(s, 'agx.cu.analyzer', (d) => d.id === 'insurance-claim' && d.methods.includes('classify') && d.methods.includes('generate')) && ev(s, 'agx.cu.analyze', (d) => d.analyzer === 'insurance-claim' && d.confidence && d.low.includes('PolicyNumber')) },
      { text: 'Reuse the analyzer on **car-claim.pdf**, then get Markdown for RAG with **prebuilt-documentSearch**.', cli: 'python cu.py analyze car-claim.pdf --analyzer insurance-claim && python cu.py analyze water-claim.pdf --analyzer prebuilt-documentSearch', check: (s) => ev(s, 'agx.cu.analyze', (d) => d.file === 'car-claim.pdf' && d.analyzer === 'insurance-claim') && ev(s, 'agx.cu.analyze', (d) => d.analyzer === 'prebuilt-documentSearch' && d.markdown) },
    ],
    wrap: 'Content Understanding runs on your Foundry resource and uses your own model deployments, which you map once as defaults. A prebuilt layout analyzer gives text, tables and structure; the document search analyzer adds Markdown, figure descriptions and a summary for RAG. A custom analyzer adds a field schema where each field uses extract (text on the page), classify (a fixed list) or generate (the model writes it). Turn on confidence and source so you know which values to trust, and send fields below your threshold, like a handwritten policy number, to a person.',
  },
];
