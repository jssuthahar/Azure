/**
 * AI-103 extract area: the 'agentextract' 3D scene narration and each lesson's
 * simulations. Step order matches src/lib/dc3d/agent/agentextract.ts. Facts
 * follow Microsoft Learn (Azure AI Search / Foundry IQ indexers, skillsets,
 * semantic ranker, agentic retrieval and Content Understanding pages,
 * checked 25 Nov 2026).
 */
import type { LessonSims } from '../../../az-900/lesson-sims';
import type { Sim3D } from '../../../az-900/sims3d';

export const SCENE: Sim3D = {
  title: 'Information extraction: indexing, search, enrichment, agents and Content Understanding',
  steps: [
    { title: 'Ingest and index content', text: 'An **indexer** reads files from a **data source**, runs a **skillset** (**OCR**, **Text Split**, an **embedding** model) and writes one search document per **chunk** into the **index**. Scanned images only become searchable when the OCR skill gets the images (**imageAction**: generateNormalizedImages).', actions: [{ id: 'run', label: '📄 …the indexer runs on the PDFs?', kind: 'ok' }, { id: 'scan', label: '🖼️ …a scanned form has no OCR skill?', kind: 'danger' }, { id: 'ocr', label: '🔎 …we add OCR and run again?', kind: 'ok' }, { id: 'changed', label: '✏️ …one policy file changes?', kind: 'plain' }] },
    { title: 'Keyword, vector, hybrid and semantic', text: '**Keyword** search (BM25) matches words. **Vector** search compares **embeddings**, so it matches meaning. **Hybrid** runs both in parallel and merges them with **Reciprocal Rank Fusion**. The **semantic ranker** then re-reads the top 50 results with a language model and adds **captions**.', actions: [{ id: 'keyword', label: '🔤 …keyword only: “Can I get my cab money back?”', kind: 'danger' }, { id: 'vector', label: '🧭 …vector only: the same question?', kind: 'ok' }, { id: 'code', label: '🔢 …keyword only: “E-1074”?', kind: 'ok' }, { id: 'hybrid', label: '🔀 …hybrid: both at once?', kind: 'ok' }, { id: 'semantic', label: '🏅 …hybrid plus the semantic ranker?', kind: 'ok' }] },
    { title: 'Enrich with skills', text: 'A **skillset** is a chain of skills that adds fields to each document: built-in skills such as **OCR**, **PII Detection** and **Key Phrase Extraction**, a **Web API** custom skill for your own code, and the **Content Understanding** skill for layout-aware chunking. Outputs reach the index through **output field mappings** or **index projections**.', actions: [{ id: 'ocr2', label: '🔎 …OCR reads an image?', kind: 'ok' }, { id: 'pii', label: '🔏 …PII Detection masks a phone number?', kind: 'ok' }, { id: 'custom', label: '🧩 …a Web API skill calls our function?', kind: 'ok' }, { id: 'cu', label: '📐 …the Content Understanding skill chunks a report?', kind: 'ok' }, { id: 'unmapped', label: '🕳️ …nothing maps the PII output?', kind: 'danger' }] },
    { title: 'Connect retrieval to an agent', text: 'A Foundry **agent** gets a **knowledge base** as a tool (an **MCP** endpoint). The **project’s managed identity** needs the **Search Index Data Reader** role. A **retrieval reasoning effort** of **minimal**, **low** or **medium** decides whether a model plans subqueries. Answers should come back with **citations**.', actions: [{ id: 'ask', label: '💬 …a question the knowledge base can answer?', kind: 'ok' }, { id: 'unknown', label: '🙈 …a question it can’t?', kind: 'plain' }, { id: 'norole', label: '⛔ …the project identity has no role?', kind: 'danger' }, { id: 'multi', label: '🧠 …a two-part question at low effort?', kind: 'ok' }] },
    { title: 'Content Understanding analyzers', text: 'An **analyzer** turns a document into **Markdown** (layout, tables, figures) and into **fields** you define. Each field uses a **method**: **extract** (text on the page), **classify** (a fixed list) or **generate** (the model writes it). Fields come with a **confidence score** and a **source** location.', actions: [{ id: 'markdown', label: '📝 …we want clean text for RAG?', kind: 'ok' }, { id: 'fields', label: '🧾 …we want typed fields?', kind: 'ok' }, { id: 'lowconf', label: '✍️ …a handwritten number is unclear?', kind: 'danger' }, { id: 'generate', label: '✨ …we need a two-sentence summary field?', kind: 'ok' }] },
  ],
};

export const SIMS: Record<string, LessonSims> = {
  'ingest-and-index-content': { d3: { mode: 'agentextract', start: 0, intro: 'Index the PDFs, lose the scanned form, then fix it with OCR.' }, tour: { id: 'agt-ingest-index', intro: 'Create a search service, a data source, an index, a skillset and an indexer.' } },
  'semantic-hybrid-and-vector-search': { d3: { mode: 'agentextract', start: 1, intro: 'Ask the same question four ways and see which one finds the taxi policy.' }, tour: { id: 'agt-search-types', intro: 'Run keyword, vector, hybrid and semantic queries in Search explorer.' } },
  'search-enrichment-skills': { d3: { mode: 'agentextract', start: 2, intro: 'Send a document through each skill, then forget the output mapping.' }, tour: { id: 'agt-skillsets', intro: 'Build a skillset with OCR, PII Detection and a custom Web API skill.' } },
  'connect-retrieval-to-agents': { d3: { mode: 'agentextract', start: 3, intro: 'Ask, ask something unanswerable, then remove the role.' }, tour: { id: 'agt-kb-agent', intro: 'Create a knowledge base and connect it to an agent as a tool.' } },
  'content-understanding-document-extraction': { d3: { mode: 'agentextract', start: 4, intro: 'Analyze the claim form, then look at the handwritten field.' }, tour: { id: 'agt-content-understanding', intro: 'Create an analyzer with extract, classify and generate fields and read its results.' } },
};
