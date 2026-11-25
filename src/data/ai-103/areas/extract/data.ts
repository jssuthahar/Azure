/**
 * AI-103 extract area: problem cards, exam-format items, games, comparisons
 * and service cards. Every item is ORIGINAL, written from the official skills
 * outline; none are real or recalled exam questions. Facts checked on
 * Microsoft Learn, 25 Nov 2026 (Azure AI Search is branded Foundry IQ in agent
 * scenarios; GA agentic retrieval REST contract 2026-10-01; Content
 * Understanding GA API 2025-11-01).
 */
import type { ProblemSolution } from '../../../az-900/problem-solution';
import type { FormatItem } from '../../../az-900/exam-items';
import type { SortSet, Riddle } from '../../../az-900/games';
import type { Comparison } from '../../../az-900/compare';
import type { Service } from '../../../az-900/services';

const ps = (problem: string, solution: string, tool: string, pairs: [string, string, string][]): ProblemSolution => ({ problem, solution, tool, pairs: pairs.map(([icon, pain, fix]) => ({ icon, pain, fix })) });

export const PROBLEMS: Record<string, ProblemSolution> = {
  'ingest-and-index-content': ps('Half the company PDFs are scans, so the search finds nothing in them, and re-indexing everything takes all night.', 'Run an indexer with a skillset: OCR for images, Text Split for chunks, an embedding model for vectors.', 'Azure AI Search indexers and skillsets', [['🖼️', 'Scanned pages with no searchable text', 'OCR skill with imageAction set to generateNormalizedImages'], ['✂️', 'A 200-page PDF is one giant result', 'Text Split chunks, one search document per chunk'], ['♻️', 'Full re-index on every change', 'Blob change detection and a schedule']]),
  'semantic-hybrid-and-vector-search': ps('Searching “cab fare” misses the policy that says “taxi”, but pure vector search loses the exact error code.', 'Run hybrid search, then rerank the top results with the semantic ranker.', 'Hybrid and semantic queries', [['🔤', 'Synonyms and paraphrases missed', 'Add a vector query for meaning'], ['🔢', 'Exact codes and names get lost', 'Keep the keyword query in the same request (hybrid)'], ['🏅', 'The best passage is ranked fourth', 'Semantic ranker reranks the top 50']]),
  'search-enrichment-skills': ps('Chunks hold raw phone numbers, and a legacy product code needs a lookup that no built-in skill does.', 'Add PII Detection and a Web API skill to the skillset, then map their outputs to the index.', 'Built-in and custom skills', [['🔏', 'Personal data in searchable text', 'PII Detection skill and a masked field'], ['🧩', 'Custom logic that is not built in', 'Web API skill that calls an Azure Function'], ['🕳️', 'Enriched fields missing from the index', 'Output field mappings or index projections']]),
  'connect-retrieval-to-agents': ps('The agent answers policy questions from memory, makes up details and cannot read the search index it was given.', 'Give it a knowledge base as a tool, grant the project identity the Search Index Data Reader role and tell it to cite or say it does not know.', 'Knowledge base, MCP tool and agent instructions', [['📚', 'Invented policy details', 'Ground the agent on a knowledge base and require citations'], ['⛔', '403 from the search service', 'Search Index Data Reader for the project managed identity'], ['🧠', 'Multi-part questions answered badly', 'Low or medium retrieval reasoning effort']]),
  'content-understanding-document-extraction': ps('Claim forms arrive as PDFs and photos, OCR text loses the tables, and nobody knows which extracted numbers to trust.', 'Create a Content Understanding analyzer that returns Markdown and fields with confidence and source.', 'Content Understanding analyzers', [['📝', 'Tables flattened into text', 'Layout-aware Markdown output'], ['🧾', 'Values typed in by hand', 'A field schema with extract, classify and generate methods'], ['✍️', 'A blurry handwritten number', 'Confidence score, then human review below a threshold']]),
};

export const ITEMS: FormatItem[] = [
  { kind: 'match', id: 'agt-x5-match-query', domain: 5, objective: '5.1.2', question: 'Match each requirement to the query type that fits best.', itemsLabel: 'Query types', items: ['Keyword (full-text)', 'Vector', 'Hybrid', 'Semantic ranker on top of hybrid'], targets: [
    { text: 'Users type exact part numbers such as WM-2210 and expect that precise match', answer: 0 },
    { text: 'Users describe a problem in their own words and the documents use different words', answer: 1 },
    { text: 'Users do both, and you want one ranked list', answer: 2 },
    { text: 'The right passage is in the top 50 but not first, and you want captions', answer: 3 },
  ], explanation: '**Keyword** search matches tokens, which suits exact identifiers. **Vector** search matches meaning. **Hybrid** runs both and merges them with Reciprocal Rank Fusion. The **semantic ranker** reorders the top 50 results and can add captions, but it can’t add documents the first pass missed.' },
  { kind: 'order', id: 'agt-x5-order-indexer', domain: 5, objective: '5.1.4', question: 'You must build a RAG ingestion pipeline over PDFs in Blob Storage by using Azure AI Search. Which four objects should you create in sequence?', actions: ['A data source that points to the blob container', 'An index with a chunk field and a vector field', 'A skillset with OCR, Text Split and an embedding skill', 'An indexer that references the data source, skillset and index', 'A knowledge base that references the index'], answer: [0, 1, 2, 3], explanation: 'The indexer references the **data source**, the **index** and the **skillset**, so those three exist first. A knowledge base is a later, optional layer for agents, not part of ingestion.' },
  { kind: 'yesno', id: 'agt-x5-yn-semantic', domain: 5, objective: '5.1.2', statements: [
    { text: 'The semantic ranker reorders only the top 50 results returned by the first-stage query.', answer: true },
    { text: 'The semantic ranker can retrieve a document that the keyword and vector queries did not return.', answer: false },
    { text: 'A hybrid query merges its keyword and vector result lists by using Reciprocal Rank Fusion.', answer: true },
  ], explanation: 'The semantic ranker is a **second-stage reranker** over at most 50 results, so it can’t find new documents. A hybrid query runs full-text and vector queries in parallel and merges them with **RRF**.' },
  { kind: 'dropdown', id: 'agt-x5-dd-agent', domain: 5, objective: '5.1.5', question: 'Complete the statements about connecting a Foundry agent to a knowledge base.', parts: [
    'The agent reaches the knowledge base as a tool through its ',
    { options: ['MCP endpoint', 'storage account key', 'private DNS zone', 'diagnostic setting'], answer: 0 },
    ', and the search service must grant the project’s managed identity the ',
    { options: ['Search Index Data Reader role', 'Owner role on the subscription', 'Storage Blob Data Owner role', 'Contributor role on the resource group'], answer: 0 },
    ' role. A retrieval reasoning effort of ',
    { options: ['minimal', 'medium', 'maximum', 'auto'], answer: 0 },
    ' skips model-based query planning.',
  ], explanation: 'The knowledge base is exposed through an **MCP** endpoint. Reading the index needs **Search Index Data Reader**, which is least privilege. **Minimal** effort bypasses LLM planning; **low** and **medium** use a model to plan subqueries.' },
  { kind: 'yesno', id: 'agt-x5-yn-cu', domain: 5, objective: '5.2.3', statements: [
    { text: 'A Content Understanding field that uses the classify method returns one of the values you list in its enum.', answer: true },
    { text: 'A field that uses the extract method can return a value that does not appear anywhere in the document.', answer: false },
    { text: 'Confidence scores let you route low-confidence fields to a person for review.', answer: true },
  ], explanation: '**Classify** picks from a fixed list. **Extract** reads values that are written in the content, while **generate** lets the model write a value. **Confidence** and source information exist so low-confidence fields can go to human review.' },
  { kind: 'match', id: 'agt-x5-match-skills', domain: 5, objective: '5.1.3', question: 'Match each enrichment need to the skill that provides it.', itemsLabel: 'Skills', items: ['OCR skill', 'PII Detection skill', 'Web API skill', 'Content Understanding skill'], targets: [
    { text: 'Read the text printed on a scanned receipt image', answer: 0 },
    { text: 'Return a masked copy of the text without phone numbers', answer: 1 },
    { text: 'Call your own Azure Function to look up an internal product code', answer: 2 },
    { text: 'Chunk a report along its tables and sections instead of fixed lengths', answer: 3 },
  ], explanation: 'The **OCR** skill extracts text from images. **PII Detection** finds and masks personal data. A **Web API** (custom) skill calls your own endpoint. The **Content Understanding** skill analyses layout and produces semantic chunks.' },
];

export const SORT: SortSet[] = [
  {
    id: 'agt-extract-which-tool', title: 'Which tool extracts it?', icon: '🧲', intro: 'Pick the tool for each information-extraction job.', topic: 'content-understanding-document-extraction',
    buckets: ['Indexer skill', 'Search query option', 'Agent retrieval', 'Content Understanding'],
    items: [
      { text: 'Read the text on scanned pages while indexing', bucket: 0, why: 'The OCR skill in the skillset.' },
      { text: 'Split long PDFs into passages for vectors', bucket: 0, why: 'The Text Split skill.' },
      { text: 'Find “taxi” when the user typed “cab”', bucket: 1, why: 'A vector query, usually inside a hybrid query.' },
      { text: 'Promote the most relevant passage and return a caption', bucket: 1, why: 'The semantic ranker.' },
      { text: 'Break a two-part question into parallel subqueries', bucket: 2, why: 'A knowledge base with low or medium reasoning effort.' },
      { text: 'Let an agent call the search over MCP', bucket: 2, why: 'The knowledge base MCP endpoint as an agent tool.' },
      { text: 'Return invoice totals with confidence and source', bucket: 3, why: 'A field schema with the extract method.' },
      { text: 'Turn a form with tables and a photo into Markdown', bucket: 3, why: 'Layout-aware Markdown output.' },
    ],
  },
];

export const RIDDLES: Riddle[] = [
  { answer: 'Reciprocal Rank Fusion (RRF)', topic: 'semantic-hybrid-and-vector-search', clues: ['I merge lists, I don’t make them.', 'A document that is good in two lists beats one that is great in only one.', 'Hybrid search uses me to give you a single ranked result.'] },
  { answer: 'Semantic ranker', topic: 'semantic-hybrid-and-vector-search', clues: ['I only look at the top 50.', 'I read your passages with a language model and reorder them.', 'I can add captions, but I can’t find a document the first pass missed.'] },
  { answer: 'Skillset', topic: 'search-enrichment-skills', clues: ['I’m a list of steps that runs on each document.', 'OCR, PII detection and your own Web API calls can all live in me.', 'An indexer uses me while it fills the index.'] },
  { answer: 'Knowledge base (Foundry IQ)', topic: 'connect-retrieval-to-agents', clues: ['An agent calls me instead of calling an index directly.', 'I list knowledge sources and set a reasoning effort.', 'Minimal, low or medium: you choose how hard I think.'] },
  { answer: 'Confidence score', topic: 'content-understanding-document-extraction', clues: ['I come with every extracted field.', 'A handwritten number usually gets a low one.', 'Below your threshold, a person should take a look.'] },
  { answer: 'Index projection', topic: 'search-enrichment-skills', clues: ['One document goes in, many search documents come out.', 'I’m how chunks become their own rows in the index.', 'A parent key links every child back to the file.'] },
];

export const COMPARE: Comparison[] = [
  {
    slug: 'keyword-vs-vector-vs-hybrid-vs-semantic-search',
    title: 'Keyword vs Vector vs Hybrid vs Semantic Search in Azure AI Search',
    seoTitle: 'Keyword vs Vector vs Hybrid vs Semantic Search | AI-103',
    description: 'Compare keyword, vector, hybrid and semantic ranking in Azure AI Search: what each matches, its weakness, how results are scored and when to choose each.',
    answer: 'Use **keyword** search for exact words and codes, **vector** search for meaning, and **hybrid** to get both in one ranked list merged by **Reciprocal Rank Fusion**. Add the **semantic ranker** when the right passage is in the top 50 but not first, or when you want captions. For agents, a **knowledge base** with agentic retrieval can plan several of these queries for you.',
    cols: ['Keyword (BM25)', 'Vector', 'Hybrid', 'Semantic ranker'],
    rows: [
      ['Matches', 'The tokens you typed', 'Meaning, through embeddings', 'Both, merged', 'Meaning, re-read by a language model'],
      ['Strong at', 'Part numbers, names, error codes', 'Paraphrases, synonyms, other languages', 'Mixed real-world questions', 'Picking the best passage'],
      ['Weak at', 'Synonyms (cab vs taxi)', 'Exact identifiers', 'Needs vectors and a text index', 'Can’t find what the first pass missed'],
      ['Needs', 'A searchable text field', 'A vector field and an embedding model', 'Both fields in one query', 'A semantic configuration and the ranker enabled'],
      ['Score', 'BM25 score', 'Similarity score', 'RRF score (small numbers)', 'Reranker score from 0 to 4'],
      ['Works on', 'The whole index', 'The whole index (k nearest)', 'The whole index', 'Top 50 of the first stage'],
    ],
    pick: [['Keyword', 'users search by exact codes or names'], ['Vector', 'questions are phrased freely'], ['Hybrid', 'you can’t predict which style users will use'], ['Hybrid + semantic ranker', 'answer quality matters more than a little extra latency and cost']],
    examTip: '“Matches by meaning even with no shared words” = **vector**. “One request that combines full-text and vector results” = **hybrid**. “Reorders the top results and returns captions” = **semantic ranker**. The ranker never adds documents.',
    sim: { mode: 'agentextract', start: 1, tour: 'agt-search-types', intro: 'Ask the same question four ways.' },
    lessons: ['semantic-hybrid-and-vector-search', 'connect-retrieval-to-agents'],
    faq: [['Do I need an embedding model for vector search?', 'Yes. Both the documents and the query need vectors from the same model. A vectorizer on the index embeds the query text for you.'], ['Does the semantic ranker replace vector search?', 'No. It reranks results that another query already found. Use it with keyword, vector or hybrid queries.']],
  },
  {
    slug: 'azure-ai-search-vs-content-understanding',
    title: 'Azure AI Search vs Content Understanding: Which Do You Need?',
    seoTitle: 'Azure AI Search vs Content Understanding | AI-103',
    description: 'Search retrieves the right passage; Content Understanding turns a document into Markdown and fields. See what each does, how they work together and when to use each.',
    answer: '**Azure AI Search** (Foundry IQ) finds and ranks content across many documents. **Content Understanding** analyses one document or file at a time and returns clean **Markdown** and typed **fields** with confidence. They work well together: analyse with Content Understanding, then index the Markdown so an agent can search it.',
    cols: ['Azure AI Search', 'Content Understanding'],
    rows: [
      ['Main job', 'Retrieve and rank content across a corpus', 'Convert one file into Markdown and fields'],
      ['Output', 'Ranked results, captions, citations', 'Markdown, field values, confidence, source'],
      ['Inputs', 'Indexed text, vectors, images through skills', 'Documents, images, audio and video'],
      ['Question it answers', 'Which passages are relevant?', 'What does this document say, as data?'],
      ['Customise with', 'Skillsets, indexes, scoring, knowledge bases', 'Analyzers and field schemas'],
      ['Typical agent use', 'Knowledge base tool for grounding', 'Intake step that reads uploads or fills a system'],
    ],
    pick: [['Azure AI Search', 'you need to answer questions across thousands of documents'], ['Content Understanding', 'you need totals, dates or clauses from each document as data'], ['Both', 'you want clean, layout-aware chunks in the index']],
    examTip: '“Extract fields with confidence from each invoice” = **Content Understanding**. “Search 40,000 policy pages with citations” = **Azure AI Search**. “Chunk by layout while indexing” = the **Content Understanding skill** in a skillset.',
    sim: { mode: 'agentextract', start: 4, tour: 'agt-content-understanding', intro: 'Analyze a claim form and look at the confidence scores.' },
    lessons: ['content-understanding-document-extraction', 'search-enrichment-skills', 'ingest-and-index-content'],
    faq: [['Can Content Understanding feed Azure AI Search?', 'Yes. Use the Content Understanding skill in a skillset for layout-aware chunking, or analyse files first and index the Markdown.'], ['Which one gives citations?', 'Search returns the source chunk of each passage. Content Understanding returns the source location of each field.']],
  },
];

export const SERVICES: Service[] = [
  { slug: 'azure-ai-search-foundry-iq', name: 'Azure AI Search (Foundry IQ)', cat: 'AI platform', icon: '🔎', model: 'Search and retrieval for apps and agents', what: 'A search service with indexers, skillsets, keyword, vector, hybrid and semantic queries, and knowledge bases with agentic retrieval that plan queries, run them in parallel and return grounded passages with citations.', use: ['Grounding agents and RAG apps on company content', 'Searching documents, images and other files with OCR and vectors', 'Permission-aware answers across several sources'], avoid: ['A single OLTP lookup by key (use the database)', 'Per-document field extraction (use Content Understanding)'], feel: 3, price: 'Billed per search unit by tier and hour; the semantic ranker and agentic retrieval add usage-based charges (illustrative, check the pricing page)', sim: { mode: 'agentextract', start: 0, tour: 'agt-ingest-index', intro: 'Index a folder of PDFs.' }, similar: ['content-understanding-for-agents'], aws: 'Amazon Kendra / OpenSearch Service', lesson: 'ingest-and-index-content', compare: 'keyword-vs-vector-vs-hybrid-vs-semantic-search' },
  { slug: 'content-understanding-for-agents', name: 'Azure Content Understanding in Foundry Tools', cat: 'AI platform', icon: '🧾', model: 'Multimodal content to structured output', what: 'A Foundry Tool that turns documents, images, audio and video into Markdown and user-defined fields by using analyzers, with confidence scores and grounding for each value.', use: ['Invoices, claims and contracts', 'Clean Markdown for RAG and agents', 'Call recordings and video summaries'], avoid: ['Searching across many documents (use Azure AI Search)', 'Fixed text tasks such as translation (use Azure Translator)'], feel: 3, price: 'Billed by pages or minutes processed, plus the model tokens used for field extraction (illustrative)', sim: { mode: 'agentextract', start: 4, tour: 'agt-content-understanding', intro: 'Analyze a claim form.' }, similar: ['azure-ai-search-foundry-iq'], aws: 'Amazon Textract / Bedrock Data Automation', lesson: 'content-understanding-document-extraction', compare: 'azure-ai-search-vs-content-understanding' },
];
